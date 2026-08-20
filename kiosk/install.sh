#!/usr/bin/env bash
#
# 4H Showcase — Raspberry Pi kiosk installer.
#
# Run from a clone of the repo on the Pi:
#     sudo ./kiosk/install.sh
#
# Idempotent: safe to re-run after a failure or a config change.
#
#     --no-build     use an existing dist/ instead of building (for a dist/ built
#                    on a laptop and copied across; skips installing Node)
#     --offline      disable wifi and bluetooth at the end, for show configuration
#     --uninstall    remove the kiosk service and nginx site, restore the console
#     -h, --help
#
# The script refuses to enable a service it could not start. That is deliberate: the
# first version of this setup hardcoded a Chromium path that did not exist on the
# image, and the Pi booted to a black screen restarting every two seconds with
# nothing useful on screen to explain it.

set -euo pipefail

KIOSK_USER=kiosk
WEBROOT=/var/www/4h
UNIT=/etc/systemd/system/kiosk.service
NGINX_SITE=/etc/nginx/sites-available/4h
NODE_MAJOR=20

DO_BUILD=1
DO_OFFLINE=0
DO_UNINSTALL=0

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# ── output ──────────────────────────────────────────────────────────────────
if [[ -t 1 ]]; then
  BOLD=$'\033[1m'; RED=$'\033[31m'; GREEN=$'\033[32m'; YELLOW=$'\033[33m'; RESET=$'\033[0m'
else
  BOLD=''; RED=''; GREEN=''; YELLOW=''; RESET=''
fi

step() { printf '\n%s==> %s%s\n' "$BOLD" "$*" "$RESET"; }
ok()   { printf '    %s✓%s %s\n' "$GREEN" "$RESET" "$*"; }
warn() { printf '    %s!%s %s\n' "$YELLOW" "$RESET" "$*"; }
die()  { printf '\n%sERROR:%s %s\n\n' "$RED" "$RESET" "$*" >&2; exit 1; }

usage() { sed -n '2,20p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'; exit 0; }

while [[ $# -gt 0 ]]; do
  case "$1" in
    --no-build)  DO_BUILD=0 ;;
    --offline)   DO_OFFLINE=1 ;;
    --uninstall) DO_UNINSTALL=1 ;;
    -h|--help)   usage ;;
    *) die "unknown option: $1 (try --help)" ;;
  esac
  shift
done

[[ $EUID -eq 0 ]] || die "run with sudo: sudo $0 $*"
command -v systemctl >/dev/null || die "this needs systemd"

# ── uninstall ───────────────────────────────────────────────────────────────
if [[ $DO_UNINSTALL -eq 1 ]]; then
  step "Removing the kiosk"
  systemctl disable --now kiosk.service 2>/dev/null || true
  rm -f "$UNIT"
  systemctl daemon-reload
  rm -f /etc/nginx/sites-enabled/4h "$NGINX_SITE"
  [[ -e /etc/nginx/sites-available/default ]] &&
    ln -sf /etc/nginx/sites-available/default /etc/nginx/sites-enabled/default
  systemctl reload nginx 2>/dev/null || true
  systemctl start getty@tty1.service 2>/dev/null || true
  systemctl set-default graphical.target >/dev/null 2>&1 || true
  ok "kiosk service and nginx site removed"
  warn "the '$KIOSK_USER' user and $WEBROOT were left in place — remove by hand if you want them gone"
  echo; echo "Reboot to get the normal desktop back."
  exit 0
fi

# ── preflight ───────────────────────────────────────────────────────────────
# Everything that could fail later is checked here, before anything is changed.
step "Preflight"

[[ -f "$REPO_ROOT/package.json" ]] || die "no package.json at $REPO_ROOT — run this from a clone of the repo"
[[ -f "$REPO_ROOT/kiosk/kiosk.service.in" ]] || die "missing kiosk/kiosk.service.in"
[[ -f "$REPO_ROOT/kiosk/nginx-4h.conf" ]] || die "missing kiosk/nginx-4h.conf"
ok "repo at $REPO_ROOT"

if [[ ! -e /dev/dri/card0 && ! -e /dev/dri/card1 ]]; then
  warn "no /dev/dri/card* — no GPU node visible. cage will not start."
  warn "on a Pi this usually means the vc4 driver is not loaded. Check /boot/firmware/config.txt"
fi

ARCH="$(uname -m)"
ok "arch $ARCH, kernel $(uname -r)"

# ── packages ────────────────────────────────────────────────────────────────
step "Installing packages"
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq --no-install-recommends cage nginx ca-certificates curl >/dev/null
ok "cage, nginx"

# Chromium is the package whose binary name varies. Install whichever exists.
if ! command -v chromium-browser >/dev/null && ! command -v chromium >/dev/null; then
  apt-get install -y -qq chromium 2>/dev/null || apt-get install -y -qq chromium-browser 2>/dev/null ||
    die "could not install Chromium (tried 'chromium' and 'chromium-browser')"
fi

# THE fix for the black-screen loop: resolve the real path now, and bake it into the
# unit, rather than hardcoding a name that may not exist on this image.
CHROMIUM_BIN="$(command -v chromium-browser || command -v chromium || true)"
[[ -x "$CHROMIUM_BIN" ]] || die "Chromium installed but no executable found on PATH"
CAGE_BIN="$(command -v cage)"
ok "chromium → $CHROMIUM_BIN"
ok "cage     → $CAGE_BIN"

# ── kiosk user ──────────────────────────────────────────────────────────────
step "Kiosk user"
if id "$KIOSK_USER" >/dev/null 2>&1; then
  ok "user '$KIOSK_USER' exists"
else
  useradd -m -G video,input,render,tty "$KIOSK_USER"
  ok "created user '$KIOSK_USER'"
fi
# Group membership is corrected on every run — a user that predates this script may
# be missing the groups that grant DRM and input access.
usermod -aG video,input,render,tty "$KIOSK_USER"
KIOSK_UID="$(id -u "$KIOSK_USER")"
ok "uid $KIOSK_UID, groups: $(id -Gn "$KIOSK_USER" | tr ' ' ',')"

# ── build ───────────────────────────────────────────────────────────────────
if [[ $DO_BUILD -eq 1 ]]; then
  step "Building the site"

  NEED_NODE=1
  if command -v node >/dev/null; then
    CUR="$(node -p 'process.versions.node.split(".")[0]')"
    [[ "$CUR" -ge 18 ]] && { NEED_NODE=0; ok "node $(node -v) is new enough"; }
  fi

  if [[ $NEED_NODE -eq 1 ]]; then
    ok "installing Node $NODE_MAJOR"
    curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | bash - >/dev/null 2>&1
    apt-get install -y -qq nodejs >/dev/null
    ok "node $(node -v)"
  fi

  cd "$REPO_ROOT"
  # npm must not run as root here or node_modules ends up root-owned in a user's
  # checkout. Drop to the invoking user when there is one.
  # -H so npm's cache lands in that user's home rather than root's. Output is left
  # visible on purpose: a silent failure here is one of the hardest things to debug
  # over a slow SSH link to a Pi in a cupboard.
  RUN_AS="${SUDO_USER:-root}"
  if [[ "$RUN_AS" != "root" ]]; then
    sudo -u "$RUN_AS" -H npm ci --no-fund --no-audit || die "npm ci failed (see output above)"
    sudo -u "$RUN_AS" -H npm run build || die "build failed (see output above)"
  else
    npm ci --no-fund --no-audit || die "npm ci failed (see output above)"
    npm run build || die "build failed (see output above)"
  fi
  ok "built $(du -sh "$REPO_ROOT/dist" | cut -f1) into dist/"
else
  step "Skipping build (--no-build)"
fi

[[ -f "$REPO_ROOT/dist/index.html" ]] ||
  die "no dist/index.html — build first, or copy a laptop-built dist/ here"

# ── deploy ──────────────────────────────────────────────────────────────────
step "Deploying to $WEBROOT"
mkdir -p "$WEBROOT"
if command -v rsync >/dev/null; then
  rsync -a --delete "$REPO_ROOT/dist/" "$WEBROOT/"
else
  rm -rf "${WEBROOT:?}/"* && cp -a "$REPO_ROOT/dist/." "$WEBROOT/"
fi
chown -R root:www-data "$WEBROOT"
find "$WEBROOT" -type d -exec chmod 755 {} +
find "$WEBROOT" -type f -exec chmod 644 {} +
ok "$(find "$WEBROOT" -type f | wc -l) files, $(du -sh "$WEBROOT" | cut -f1)"

# ── nginx ───────────────────────────────────────────────────────────────────
step "Configuring nginx"
cp "$REPO_ROOT/kiosk/nginx-4h.conf" "$NGINX_SITE"
ln -sf "$NGINX_SITE" /etc/nginx/sites-enabled/4h
rm -f /etc/nginx/sites-enabled/default
nginx -t >/dev/null 2>&1 || { nginx -t; die "nginx config test failed"; }
systemctl enable nginx >/dev/null 2>&1
systemctl restart nginx
ok "nginx restarted"

sleep 1
curl -sf -o /dev/null http://localhost/ || die "nginx is not serving / — check: systemctl status nginx"
ok "GET / → 200"

# The SPA-fallback case that a directory in public/ silently breaks. If this returns
# 403 the try_files rule is wrong and deep links would fail at the show.
ROUTE_CODE="$(curl -s -o /dev/null -w '%{http_code}' http://localhost/2026)"
[[ "$ROUTE_CODE" == "200" ]] || die "GET /2026 → $ROUTE_CODE (expected 200). SPA fallback is broken."
curl -s http://localhost/2026 | grep -q '<div id="root">' ||
  die "GET /2026 did not return the app shell"
ok "GET /2026 → 200, app shell served"

# ── systemd unit ────────────────────────────────────────────────────────────
step "Installing the kiosk service"
sed -e "s|@CHROMIUM_BIN@|$CHROMIUM_BIN|g" \
    -e "s|@CAGE_BIN@|$CAGE_BIN|g" \
    -e "s|@KIOSK_USER@|$KIOSK_USER|g" \
    -e "s|@KIOSK_UID@|$KIOSK_UID|g" \
    -e "s|@WEBROOT@|$WEBROOT|g" \
    "$REPO_ROOT/kiosk/kiosk.service.in" > "$UNIT"
grep -q '@[A-Z_]*@' "$UNIT" && die "unsubstituted placeholder left in $UNIT"
chmod 644 "$UNIT"
ok "wrote $UNIT"

systemctl set-default multi-user.target >/dev/null 2>&1
systemctl disable lightdm >/dev/null 2>&1 || true
ok "default target: multi-user (no display manager)"

systemctl daemon-reload

# ── smoke test ──────────────────────────────────────────────────────────────
# Start it before enabling it. If it cannot run now it will not run at boot either,
# and an enabled-but-broken unit is the black-screen loop.
step "Smoke test"
warn "the screen will switch to the kiosk now"
systemctl reset-failed kiosk.service 2>/dev/null || true
systemctl start kiosk.service || true

for _ in $(seq 1 10); do
  sleep 1
  systemctl is-active --quiet kiosk.service || break
done

if systemctl is-active --quiet kiosk.service; then
  ok "service stayed up for 10s"
  systemctl enable kiosk.service >/dev/null 2>&1
  ok "enabled at boot"
else
  echo
  printf '%s%s%s\n' "$RED" "The service did not stay running. NOT enabling it at boot," "$RESET"
  printf '%s%s%s\n' "$RED" "so you get a normal console instead of a black screen." "$RESET"
  echo
  echo "Last 30 log lines:"
  journalctl -u kiosk -n 30 --no-pager || true
  echo
  echo "Common causes:"
  echo "  status=203/EXEC      → binary path wrong (this script resolved: $CHROMIUM_BIN)"
  echo "  DRM / seat errors    → pam_systemd did not grant a seat; try the autologin"
  echo "                         fallback in kiosk/README.md"
  echo "  tty1 busy            → something else holds the console"
  echo
  die "kiosk service failed to start (see above)"
fi

# ── offline ─────────────────────────────────────────────────────────────────
if [[ $DO_OFFLINE -eq 1 ]]; then
  step "Taking the Pi off the network"
  rfkill block wifi bluetooth 2>/dev/null || true
  systemctl disable --now wpa_supplicant bluetooth >/dev/null 2>&1 || true
  ok "wifi and bluetooth disabled — re-enable with: sudo rfkill unblock wifi"
fi

# ── screen blanking ─────────────────────────────────────────────────────────
step "Display blanking"
CMDLINE=/boot/firmware/cmdline.txt
[[ -f $CMDLINE ]] || CMDLINE=/boot/cmdline.txt
if [[ -f $CMDLINE ]]; then
  if grep -q 'consoleblank=0' "$CMDLINE"; then
    ok "consoleblank=0 already set"
  else
    cp "$CMDLINE" "$CMDLINE.bak"
    sed -i '1s/$/ consoleblank=0/' "$CMDLINE"
    ok "added consoleblank=0 (backup at $CMDLINE.bak)"
  fi
else
  warn "no cmdline.txt found — set consoleblank=0 yourself if the screen blanks"
fi

# ── done ────────────────────────────────────────────────────────────────────
cat <<EOF

$BOLD Done. $RESET

  Site      $WEBROOT  (nginx on 127.0.0.1:80)
  Browser   $CHROMIUM_BIN under $CAGE_BIN
  Service   kiosk.service — enabled, running

  Logs      journalctl -u kiosk -b -f
  Restart   sudo systemctl restart kiosk
  Console   Ctrl+Alt+F2
  Remove    sudo ./kiosk/install.sh --uninstall

 Reboot now and check it comes up on its own:  sudo reboot

EOF
