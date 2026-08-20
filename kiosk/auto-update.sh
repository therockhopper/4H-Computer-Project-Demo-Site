#!/usr/bin/env bash
#
# Boot-time auto-update. Run by kiosk-update.service, not by hand.
#
# Design rule: a failed update must never break a working kiosk. Every failure path
# leaves the currently deployed build serving and exits 0 — the display keeps showing
# the last good version, and the next boot tries again. Nothing here is allowed to
# take the exhibit down.
#
# Deliberately NOT `set -e`: an early exit partway through would be the one thing
# that could leave a half-deployed site.

set -uo pipefail

REPO="${1:-}"
WEBROOT="${2:-/var/www/4h}"
NET_WAIT=45          # seconds to wait for a usable network before giving up
PROBE_URL=https://github.com

log() { printf '[auto-update] %s\n' "$*"; }
skip() { log "$*"; log "leaving the deployed build in place"; exit 0; }

[[ -n "$REPO" && -d "$REPO/.git" ]] || skip "no git repo at '$REPO'"

# ── network ─────────────────────────────────────────────────────────────────
# At a show the Pi is deliberately offline (rfkill), so no network is the normal,
# expected case — not an error. Wait a little for wifi to associate, then give up
# quietly.
log "waiting up to ${NET_WAIT}s for a network"
online=0
for _ in $(seq 1 "$NET_WAIT"); do
  if curl -fsS --max-time 3 -o /dev/null "$PROBE_URL" 2>/dev/null; then
    online=1
    break
  fi
  sleep 1
done
[[ $online -eq 1 ]] || skip "no network"
log "network is up"

cd "$REPO" || skip "cannot cd to $REPO"

# Run git and npm as whoever owns the checkout, not root, so file ownership in the
# repo stays consistent and npm's cache does not land in /root.
OWNER="$(stat -c '%U' "$REPO" 2>/dev/null || echo root)"
as_owner() {
  if [[ "$OWNER" != "root" ]]; then
    sudo -u "$OWNER" -H "$@"
  else
    "$@"
  fi
}

BRANCH="$(as_owner git rev-parse --abbrev-ref HEAD 2>/dev/null)"
[[ -n "$BRANCH" && "$BRANCH" != "HEAD" ]] || skip "detached HEAD — not auto-updating"

# ── is there anything new? ──────────────────────────────────────────────────
# --depth 1 keeps a shallow clone shallow rather than slowly pulling in the ~86 MB
# of deleted-model history this repo carries.
as_owner git fetch --quiet --depth 1 origin "$BRANCH" || skip "git fetch failed"

LOCAL="$(as_owner git rev-parse HEAD)"
REMOTE="$(as_owner git rev-parse "origin/$BRANCH" 2>/dev/null)"
[[ -n "$REMOTE" ]] || skip "no origin/$BRANCH"

# Compare against what is actually DEPLOYED, not just what is checked out. A build
# that fails leaves the checkout at the new commit while the webroot still holds the
# old build; without this the next boot would see LOCAL == REMOTE, report "nothing to
# do", and never retry — so a transient failure (npm registry blip, disk full) would
# strand the kiosk on the old build until someone noticed and intervened by hand.
STAMP_DIR=/var/lib/4h-kiosk
STAMP="$STAMP_DIR/deployed-commit"
DEPLOYED="$(cat "$STAMP" 2>/dev/null || echo none)"

if [[ "$LOCAL" == "$REMOTE" && "$DEPLOYED" == "$REMOTE" ]]; then
  log "already at $(echo "$LOCAL" | cut -c1-8) and deployed — nothing to do"
  exit 0
fi

if [[ "$LOCAL" == "$REMOTE" ]]; then
  log "checkout is current but deployed build is $(echo "$DEPLOYED" | cut -c1-8) — rebuilding"
else
  log "update available: $(echo "$LOCAL" | cut -c1-8) → $(echo "$REMOTE" | cut -c1-8)"
fi

# reset --hard rather than pull: the Pi is a deployment target, not somewhere anyone
# edits code, and a merge conflict at boot would be unrecoverable without a keyboard.
as_owner git reset --hard --quiet "origin/$BRANCH" || skip "git reset failed"

# ── build ───────────────────────────────────────────────────────────────────
# Into the repo's own dist/. Nothing touches the live webroot until this succeeds,
# so a broken commit upstream cannot take the display down.
log "installing dependencies"
as_owner npm ci --no-fund --no-audit --silent || skip "npm ci failed"

log "building"
as_owner npm run build --silent || skip "build failed"

[[ -f "$REPO/dist/index.html" ]] || skip "build produced no dist/index.html"

# ── deploy ──────────────────────────────────────────────────────────────────
log "deploying to $WEBROOT"
if ! rsync -a --delete "$REPO/dist/" "$WEBROOT/"; then
  log "rsync failed — the webroot may be inconsistent, forcing a full recopy"
  if ! rm -rf "${WEBROOT:?}/"*; then
    skip "could not clear $WEBROOT"
  fi
  if ! cp -a "$REPO/dist/." "$WEBROOT/"; then
    # Worst case: the webroot is now empty and nginx would 404. Nothing better is
    # available here, so make the reason loud in the journal.
    log "FATAL: recopy failed and $WEBROOT is now empty — run install.sh by hand"
    exit 0
  fi
fi
chown -R root:www-data "$WEBROOT"
find "$WEBROOT" -type d -exec chmod 755 {} +
find "$WEBROOT" -type f -exec chmod 644 {} +

# Written only after a deploy actually succeeded, and kept outside the webroot so
# rsync --delete cannot remove it and nginx does not serve it.
mkdir -p "$STAMP_DIR" && printf '%s\n' "$REMOTE" > "$STAMP"

# ── restart ─────────────────────────────────────────────────────────────────
# The restart also wipes the browser profile, dropping any HTTP-cached index.html
# along with it.
log "restarting kiosk"
systemctl restart kiosk.service || log "kiosk restart failed — check: systemctl status kiosk"

log "updated to $(echo "$REMOTE" | cut -c1-8)"
exit 0
