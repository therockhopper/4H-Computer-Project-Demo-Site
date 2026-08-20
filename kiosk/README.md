# Raspberry Pi Display Kiosk

Boots straight into the showcase when the Pi is plugged in, runs with no network at
all, and gives visitors no way out of the page.

**Target:** Pi 4 or 5, Raspberry Pi OS Bookworm (Wayland), mouse attached, no keyboard.

---

## Install

On a fresh Raspberry Pi OS Bookworm install, with a network available for setup:

```bash
sudo apt update && sudo apt install -y git
git clone --depth 1 --branch feat/pi-kiosk \
  https://github.com/therockhopper/4H-Computer-Project-Demo-Site.git ~/4h
cd ~/4h
sudo ./kiosk/install.sh
```

Then `sudo reboot` and work through [Verification](#verification).

`--depth 1` skips ~86 MB of deleted-model history. Drop `--branch feat/pi-kiosk` once
that branch is merged to `main`.

### Options

| Flag | Effect |
|---|---|
| *(none)* | Install Node if needed, build on the Pi, deploy, configure, smoke-test, enable |
| `--no-build` | Use an existing `dist/` instead of building — for a `dist/` built on a laptop and copied across. Skips installing Node. |
| `--update` | Content update only: build, deploy, restart. Skips packages, user, nginx and unit. Use after `git pull`. |
| `--lock-vt` | Drop cage's `-s`, blocking `Ctrl+Alt+F2` to a console. Maximum lockdown for show day — **make sure SSH works first**. |
| `--offline` | Disable wifi and bluetooth at the end. Do this once the kiosk is working. |
| `--uninstall` | Remove the service and nginx site, restore the console and the desktop target |

The script is idempotent — re-run it after a failure or a config change.

### What it does

1. **Preflight** — verifies the repo layout and warns if no `/dev/dri/card*` exists
2. **Packages** — `cage`, `nginx`, Chromium
3. **Resolves the Chromium binary path** and bakes it into the unit
4. **User** — creates `kiosk`, and re-applies the `video,input,render,tty` groups
5. **Build** — installs Node 20 if needed, `npm ci && npm run build` as the invoking
   user so `node_modules` is not left root-owned
6. **Deploy** — rsyncs `dist/` to `/var/www/4h` with sane ownership and modes
7. **nginx** — installs the site, then *proves* it works: `GET /` must be 200, and
   `GET /2026` must return 200 with the app shell, not a 403
8. **Unit** — renders `kiosk.service.in`, refusing to install if any placeholder
   survives; sets the default target to `multi-user`
9. **Smoke test** — starts the service and requires it to stay up for 10 seconds
   **before enabling it at boot**
10. `consoleblank=0`, and `--offline` if asked

**Step 9 is the important one.** An enabled-but-broken unit is exactly the black-screen
restart loop this setup hit the first time. If the service will not stay up, the script
dumps the journal, explains the common causes, and exits *without* enabling it — so you
reboot to a normal console instead of a black screen.

Step 3 is why it broke: Raspberry Pi OS ships the binary as `chromium` on some images
and `chromium-browser` on others. A missing `ExecStart` binary fails with
`status=203/EXEC` before anything renders, with nothing on screen to explain it.

---

## Why not `npm run dev`

The Vite dev server transforms modules on every request (slow cold start on a Pi),
keeps an HMR websocket and filesystem watcher running forever, needs ~150 MB of RAM
plus a ~200 MB `node_modules` tree, and has no restart semantics if it dies. It is also
documented as not for production use.

nginx serves the same built files at ~5 MB RAM, is managed by systemd, and starts at
boot. This is about what *serves* the site, not where you build it — the script still
builds on the Pi by default, just once rather than on every request.

---

## Architecture

```
power on
  └─ systemd (multi-user.target — no display manager, no autologin)
       ├─ nginx.service   → serves /var/www/4h on 127.0.0.1:80
       └─ kiosk.service   → its own logind session on tty1 (PAMName=login)
                              └─ cage (Wayland compositor, one app, fullscreen)
                                   └─ chromium --kiosk http://localhost/?kiosk=1
                                        └─ restarts in 2s if it ever dies
```

`cage` is a Wayland compositor that runs exactly one application fullscreen. There is
no window manager, no taskbar, no app switcher and no keybindings — not disabled, never
implemented. With no keyboard attached the escape surface is close to nil.

### No autologin, and it still survives power cycling

Those sound like they are in tension. They are not. A systemd *system* service is not
attached to a human session: power-up runs `multi-user.target`, which pulls in
`kiosk.service`, which creates its own session via `PAMName=login` — `pam_systemd`
registers a logind session on a seat, and that seat grants `/dev/dri` and `/dev/input`.
Nobody has to be present. `Restart=always` covers crashes on top of that.

**Do not enable console autologin as well.** It would put a shell on tty1 fighting the
kiosk for the same VT; the unit stops `getty@tty1` via `Conflicts=` for that reason.

---

## Getting a terminal once the kiosk is running

The kiosk owns tty1 and fills the screen, so the console is not where you left it.

**`Ctrl+Alt+F2`** — switches to a second virtual terminal with a normal login prompt.
The kiosk keeps running behind it; `Ctrl+Alt+F1` switches back.

This only works because the installer passes `-s` to cage. **Cage blocks VT switching
by default** — it is a kiosk compositor, and refusing `Ctrl+Alt+F<n>` is one of the
things it is for. If you installed with `--lock-vt`, or you are on an older build of
this repo that did not pass `-s`, this key combination does nothing at all and SSH is
your only way in.

Check what your machine is running:

```bash
grep ExecStart /etc/systemd/system/kiosk.service    # look for -s
```

**SSH** — worth setting up for a machine that lives in a cupboard, and the only route
in if VT switching is locked. It is off by default on Raspberry Pi OS, so enable it
once while you still have a console:

```bash
sudo systemctl enable --now ssh
hostname -I                       # note the address
```

Then from a laptop on the same network: `ssh pi@raspberrypi.local`. If you ran
`--offline`, `sudo rfkill unblock wifi` first — though ethernet is unaffected by
`rfkill` and works either way.

**Stopping the kiosk entirely**, if you want the whole screen back:

```bash
sudo systemctl stop kiosk
sudo systemctl start getty@tty1   # <- needed: see below
```

That second command is not optional. The unit has `Conflicts=getty@tty1.service`, so
starting the kiosk stops tty1's login prompt, and stopping the kiosk does **not** bring
it back. Skip it and tty1 is just dead and black. `sudo systemctl start kiosk` when done.

---

## Updating the Pi when the website changes

Nothing is automatic — the Pi is deliberately offline, so it never notices that the
repo moved. You pull the new code and rebuild, which is three commands:

```bash
sudo rfkill unblock wifi          # the Pi needs a network for this
cd ~/4h
git pull
sudo ./kiosk/install.sh --update
sudo rfkill block wifi            # put it back
```

`--update` is the fast path: it builds, deploys to `/var/www/4h`, re-verifies that
nginx is serving, and restarts the kiosk. It skips package installs, user setup, the
nginx site and the systemd unit, because those have not changed. Takes about a minute
on a Pi 4.

The display goes black for a second or two during the restart, then comes back on the
new build. No reboot needed.

**Building on a laptop instead?** Copy the built `dist/` into `~/4h/dist/` on the Pi
and run `sudo ./kiosk/install.sh --update --no-build`.

**If a dependency changed** (anything in `package.json`), `--update` handles it —
`npm ci` runs as part of the build.

**If `kiosk/` itself changed** — the service file, the nginx config, or the installer —
run the full `sudo ./kiosk/install.sh` instead. `--update` deliberately does not touch
those.

**Shallow clone note.** The Pi is cloned with `--depth 1`, and `git pull` works fine on
that. But if the branch was force-pushed, `git pull` will refuse; the fix is to re-clone
rather than fight it.

**Read-only root.** If you enabled the overlay filesystem, turn it off and reboot
*before* updating, then turn it back on and reboot after. Otherwise the update lives in
RAM and vanishes at the next power cut — the kiosk silently reverts to the old build.

### Why the display doesn't serve a stale page

`index.html` is the only unfingerprinted file, and it names all the fingerprinted ones,
so a cached copy would pin the kiosk to the previous build no matter what you deploy.
Two things prevent that: nginx sends `Cache-Control: no-store` for `index.html` and
`offline-manifest.json`, and the service wipes the browser profile on every start, which
drops the HTTP cache with it. The service worker is not registered in kiosk mode, so
there is no third cache layer to go stale.

---

## What kiosk mode changes in the app

Driven by `?kiosk=1` on the launch URL, latched into `sessionStorage` so it survives
navigation and reloads. Implemented in `src/kiosk.js`. Normal browsing is unaffected.

| Behaviour | Why |
|---|---|
| External links do not navigate | Under `--kiosk` a new window has no tab bar and no close button. With no keyboard there is no Ctrl+W or Alt+F4 — one click on "Blender" ends the exhibit until someone power-cycles the Pi. |
| Right-click and middle-click blocked | The main escape routes when a mouse is the only input device. |
| 3D model auto-loads regardless of size | `AUTOLOAD_LIMIT` is 3 MB and the model is 5.9 MB, so it would otherwise sit behind a "Load 3D model" tap nobody makes. The limit protects visitors on event WiFi; on local disk it only hides the exhibit. |
| Service worker not registered | nginx on localhost is already instant, and `registerType:'prompt'` would surface an update toast on the display in front of visitors. |
| Offline download panel hidden | Meaningless when every asset is on local disk. |
| Reset to top after 3 minutes idle | So the next visitor does not inherit a half-scrolled page or a game left mid-play. |
| Screen wake lock held | Monitor never blanks. |

---

## Verification

Run in this order, and do not touch a keyboard after step 2.

1. `sudo rfkill block all` — prove there is no network at all
2. `sudo reboot`
3. Site appears fullscreen within ~30 s — no desktop, no crash-restore bar
4. **3D model renders on its own**, no "Load 3D model" placeholder, orbits with the mouse
5. **Scratch game** loads, green flag runs, sound plays
6. Click all five external links (Tinkercad, Blender, Fusion360, Scratch, View on
   Scratch) — none may open a window or leave the page
7. Right-click and middle-click anywhere — no context menu, no new window
8. Browse to `/2026` directly — must render, not 403
9. Leave untouched past the idle timeout — must return to the top of the page
10. `sudo systemctl kill -s KILL kiosk` — back on screen within ~5 s
11. Pull the power cord mid-render, plug back in — comes up clean, no restore bar

---

## Troubleshooting

Console access is **Ctrl+Alt+F2** — the kiosk holds tty1. See
[Getting a terminal](#getting-a-terminal-once-the-kiosk-is-running) for SSH and for
stopping the kiosk.

```bash
journalctl -u kiosk -b -f            # follow this boot's kiosk log
systemctl status kiosk nginx
curl -sI http://localhost/           # is nginx serving?
grep ExecStart /etc/systemd/system/kiosk.service   # what binary was baked in?
```

**Black screen looping.** The service is failing and restarting. It now gives up after
5 failures in 60 s rather than looping forever, so `systemctl status kiosk` will show
`failed` with the reason. `status=203/EXEC` means the binary path is wrong — re-run the
installer, which resolves it.

**Nothing happens at boot, `systemctl status kiosk` says `inactive (dead)`.** The unit
was never pulled in by the boot target:

```bash
systemctl get-default                              # expect multi-user.target
grep WantedBy /etc/systemd/system/kiosk.service    # expect multi-user.target
systemctl is-enabled kiosk                         # expect enabled
```

**`Failed to open /dev/tty1: Device or resource busy`.** A getty still owns the VT. If
you enabled console autologin, turn it back off — this setup does not use it.

**cage exits immediately with a DRM or seat error.** `pam_systemd` is not granting a
seat on this image. Use the autologin fallback below.

**Locked out — no console, no SSH.** Power off and put the SD card in another machine.
The `boot`/`bootfs` partition is FAT and mounts anywhere, including macOS and Windows;
the root filesystem is ext4 and generally will not. So work from the boot partition:

```bash
touch /Volumes/bootfs/ssh        # macOS; adjust the path elsewhere
```

An empty file named `ssh` there turns SSH on at the next boot. Eject, boot the Pi, and
`ssh pi@raspberrypi.local` — the kiosk keeps running, you just get a way in alongside
it. This is the recovery route to reach for first.

If you would rather stop the kiosk outright and you *can* read ext4, delete
`/etc/systemd/system/multi-user.target.wants/kiosk.service` from the root partition, or
append ` systemd.unit=rescue.target` to the single line in the boot partition's
`cmdline.txt`.

**Recovery once you have a shell.** `sudo ./kiosk/install.sh --uninstall` removes the
service and restores the console and desktop target.

### Fallback: the autologin route

Use this **only if** `kiosk.service` will not start — most likely `pam_systemd` not
granting a seat. It is the approach most Pi kiosk guides use, so it is well-trodden.
**Do not run both**; they contend for tty1.

```bash
sudo systemctl disable --now kiosk.service
sudo raspi-config     # System Options → Boot / Auto Login → Console Autologin
```

Then in that user's `~/.bash_profile`, using the Chromium path the installer found
(`grep ExecStart /etc/systemd/system/kiosk.service`):

```bash
if [ -z "$WAYLAND_DISPLAY" ] && [ "$(tty)" = "/dev/tty1" ]; then
  rm -rf ~/.chromium-kiosk
  exec cage -d -- chromium \
    --ozone-platform=wayland --kiosk \
    --user-data-dir="$HOME/.chromium-kiosk" \
    --noerrdialogs --disable-infobars --disable-session-crashed-bubble \
    --check-for-update-interval=31536000 \
    --autoplay-policy=no-user-gesture-required \
    --overscroll-history-navigation=0 --disable-pinch \
    --password-store=basic \
    'http://localhost/?kiosk=1'
fi
```

`exec` replaces the shell, so when cage exits agetty respawns, autologin fires again
and the kiosk relaunches — the same self-healing the unit gets from `Restart=always`.
What you lose is `journalctl -u kiosk` and `systemctl restart kiosk`.

---

## Hardening: read-only root

A kiosk unplugged at the end of each show will eventually corrupt its SD card.

`sudo raspi-config` → Performance Options → Overlay File System → enable.

The root filesystem then lives in a RAM overlay, so power loss cannot leave a
half-written filesystem behind. Toggle it off to update, back on afterwards.
