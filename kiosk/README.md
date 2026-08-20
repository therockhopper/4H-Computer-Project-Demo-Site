# Raspberry Pi Display Kiosk

Boots straight into the showcase when the Pi is plugged in, runs with no network at
all, and gives visitors no way out of the page.

**Target:** Pi 4 or 5, Raspberry Pi OS Bookworm (Wayland), mouse attached, no keyboard.

---

## Why not `npm run dev`

The Vite dev server transforms modules on every request (slow cold start on a Pi),
keeps an HMR websocket and filesystem watcher running forever, needs ~150 MB of RAM
plus a ~200 MB `node_modules` tree on the Pi, and has no restart semantics if it
dies — you get a blank screen. It is also documented as not for production use.

nginx serves the same built files at ~5 MB RAM, is managed by systemd, and starts at
boot. Note this is about what *serves* the site, not about where you build it — you can
still build on the Pi (step 3), you just build once rather than on every request.

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
no window manager, no taskbar, no app switcher and no keybindings — not disabled,
never implemented. With no keyboard attached the escape surface is close to nil.

---

## First-time setup

Do all of this over SSH or with a keyboard temporarily attached, while the Pi still
has a network. Step 6 is what takes it offline for good.

### 1. Get the repo onto the Pi

You need it at least once for the config files in `kiosk/`. A shallow clone skips the
~86 MB of deleted-model history and lands at about 12 MB:

```bash
sudo apt update && sudo apt install -y git
git clone --depth 1 https://github.com/therockhopper/4H-Computer-Project-Demo-Site.git ~/4h
cd ~/4h
ls kiosk/          # must list this README, kiosk.service, nginx-4h.conf
```

That `ls` is the check that matters: a plain clone gets the default branch, so if the
kiosk work has not been merged to `main` yet, clone the branch instead:

```bash
rm -rf ~/4h
git clone --depth 1 --branch feat/pi-kiosk \
  https://github.com/therockhopper/4H-Computer-Project-Demo-Site.git ~/4h
cd ~/4h
```

### 2. Packages and user

```bash
sudo apt install --no-install-recommends -y cage chromium-browser nginx

sudo useradd -m -G video,input,render,tty kiosk
id -u kiosk        # note the uid — kiosk.service assumes 1001
```

### 3. Build the site

Two ways. **Building on the Pi** keeps everything self-contained — you can update the
kiosk with nothing but the Pi itself, which is the better default for a machine that
lives in a cupboard between shows. A Pi 4 or 5 builds this in about a minute.

Raspberry Pi OS Bookworm ships Node 18, which Vite 5 accepts, but the project targets
Node 20 (see `netlify.toml`), so install that:

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v                      # expect v20.x

cd ~/4h
npm ci
npm run build                # writes dist/
```

The alternative is **building on your laptop and shipping only `dist/`** — the Pi then
needs no Node and no `node_modules` (~200 MB saved). Skip the block above and see
"Pushing a content update" below for the `rsync` command; you still need the clone from
step 1 for the config files, or you can `scp` just the `kiosk/` directory across.

### 4. Deploy it and start nginx

```bash
sudo mkdir -p /var/www/4h
sudo rsync -a --delete ~/4h/dist/ /var/www/4h/
sudo chown -R root:www-data /var/www/4h
sudo find /var/www/4h -type d -exec chmod 755 {} + -o -type f -exec chmod 644 {} +

sudo cp ~/4h/kiosk/nginx-4h.conf /etc/nginx/sites-available/4h
sudo ln -sf /etc/nginx/sites-available/4h /etc/nginx/sites-enabled/4h
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl enable --now nginx
```

Confirm before going further — this must return `200` and real HTML, not a 403:

```bash
curl -sI http://localhost/ | head -1
curl -s http://localhost/2026 | head -c 120
```

### 5. Stop the desktop competing for the display, install the kiosk service

```bash
sudo systemctl set-default multi-user.target
sudo systemctl disable lightdm 2>/dev/null || true

sudo cp ~/4h/kiosk/kiosk.service /etc/systemd/system/kiosk.service

# The unit hardcodes /run/user/1001; point it at the real uid.
sudo sed -i "s|/run/user/1001|/run/user/$(id -u kiosk)|" /etc/systemd/system/kiosk.service

sudo systemctl daemon-reload
sudo systemctl enable kiosk.service
```

**No autologin is needed — do not enable it.** The usual Pi kiosk recipe turns on
console autologin in `raspi-config` and launches the browser from `.bash_profile`.
This setup does not work that way: `PAMName=login` in the unit runs the service
through the PAM login stack, so `pam_systemd` registers a real logind session on a
seat, and that seat is what grants access to `/dev/dri` and `/dev/input`. The service
*is* the login session, and it starts at boot whether or not anyone logs in.

Turning on getty autologin as well would put a shell on tty1 fighting the kiosk for
the same VT — the unit already stops `getty@tty1` via `Conflicts=` for exactly this
reason.

**This survives power cycling.** That is worth stating plainly, because "no login" and
"comes back after the plug is pulled" sound like they are in tension. They are not: a
systemd *system* service is not attached to a human session. Power up runs
`multi-user.target`, which pulls in `kiosk.service`, which creates its own session.
Nobody has to be there. `Restart=always` then covers crashes on top of that.

Confirm it for yourself with verification steps 2 and 11 below — reboot, and pull the
cord mid-render.

### Fallback: the autologin route

Use this **only if** `kiosk.service` will not start on your image — most likely
`pam_systemd` not granting a seat, which shows up as cage exiting immediately with a
DRM or "no seat" error in `journalctl -u kiosk`. It is the approach most Pi kiosk
guides use, so it is well-trodden.

**Do not run both.** They contend for tty1.

```bash
sudo systemctl disable --now kiosk.service

# System Options → Boot / Auto Login → Console Autologin, as the kiosk user
sudo raspi-config
```

Then in that user's `~/.bash_profile`:

```bash
if [ -z "$WAYLAND_DISPLAY" ] && [ "$(tty)" = "/dev/tty1" ]; then
  rm -rf ~/.chromium-kiosk
  exec cage -d -- chromium-browser \
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
and the kiosk relaunches — the same self-healing the systemd unit gets from
`Restart=always`. What you lose is `journalctl -u kiosk` for logs and
`systemctl restart kiosk` for control.

### 6. Take the Pi off the network

The requirement is never-connected, so make it structural rather than a setting
someone can flip:

```bash
sudo rfkill block wifi bluetooth
sudo systemctl disable --now wpa_supplicant bluetooth
```

Re-enable only when pushing a content update (see below).

### 7. Stop the display blanking

Append `consoleblank=0` to the single line in `/boot/firmware/cmdline.txt`. The page
also holds a `navigator.wakeLock`; this is the belt-and-braces companion.

Then `sudo reboot` and work through the verification list below.

---

## Pushing a content update

Whichever way you build, the Pi needs a network for the duration — re-enable it with
`sudo rfkill unblock wifi`, and block it again when you are done.

**If you build on the Pi:**

```bash
cd ~/4h
git pull
npm ci                       # only when dependencies changed
npm run build
sudo rsync -a --delete dist/ /var/www/4h/
sudo systemctl restart kiosk
```

**If you build on your laptop**, from the repo there:

```bash
npm run build
rsync -av --delete dist/ pi@4h-kiosk.local:/tmp/4h-dist/
ssh pi@4h-kiosk.local 'sudo rsync -a --delete /tmp/4h-dist/ /var/www/4h/ && sudo systemctl restart kiosk'
```

The staging hop through `/tmp` is there because `/var/www/4h` is root-owned — rsyncing
straight into it over SSH would need root login enabled, which is worse.

If the overlay filesystem is enabled (below), turn it off and reboot before updating,
then turn it back on and reboot after. Otherwise your changes live in RAM and vanish
at the next power cut.

---

## Hardening: read-only root

A kiosk unplugged at the end of each show will eventually corrupt its SD card.

`sudo raspi-config` → Performance Options → Overlay File System → enable.

The root filesystem then lives in a RAM overlay, so power loss cannot leave a
half-written filesystem behind. Toggle it off to push an update, back on afterwards.

---

## What kiosk mode changes in the app

Driven by `?kiosk=1` on the launch URL, latched into `sessionStorage` so it survives
navigation and reloads. Implemented in `src/kiosk.js`.

| Behaviour | Why |
|---|---|
| External links do not navigate | Under `--kiosk`, a new window has no tab bar and no close button. With no keyboard there is no Ctrl+W or Alt+F4 — one click on "Blender" ends the exhibit until someone power-cycles the Pi. |
| Right-click and middle-click blocked | The main escape routes when a mouse is the only input device. |
| 3D model auto-loads regardless of size | `AUTOLOAD_LIMIT` is 3 MB and the model is 5.9 MB, so it would otherwise sit behind a "Load 3D model" tap nobody makes. The limit protects visitors on event WiFi; on local disk it is pure downside. |
| Service worker not registered | nginx on localhost is already instant, and `registerType: 'prompt'` would surface an "update available" toast on the display in front of visitors. |
| Offline download panel hidden | Meaningless when every asset is already on local disk. |
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
8. Browse to `/2026` directly — must render, not 403 (the `try_files` case)
9. Leave untouched past the idle timeout — must return to the top of the page
10. `sudo systemctl kill -s KILL kiosk` — back on screen within ~5 s
11. Pull the power cord mid-render, plug back in — comes up clean, no restore bar

---

## Troubleshooting

```bash
journalctl -u kiosk -b -f          # kiosk service log, this boot, follow
journalctl -u nginx -b
systemctl status kiosk nginx
curl -sI http://localhost/          # is nginx serving?
curl -s http://localhost/2026 | head -5   # SPA fallback working?
```

**Nothing happens at boot, and `systemctl status kiosk` says "inactive (dead)"** —
the unit was never pulled in by the boot target. Check the two halves agree:

```bash
systemctl get-default                       # expect multi-user.target
grep WantedBy /etc/systemd/system/kiosk.service   # expect multi-user.target
systemctl is-enabled kiosk                  # expect enabled
```

A unit `WantedBy=graphical.target` on a system defaulting to `multi-user.target` will
sit there forever without ever being started, and nothing logs an error.

**Black screen, service restarting in a loop** — usually cage failing to get a seat.
Confirm `PAMName=login` is present and `XDG_RUNTIME_DIR` matches `id -u kiosk`.

**`Failed to open /dev/tty1: Device or resource busy`** — a getty still owns the VT.
The unit's `Conflicts=getty@tty1.service` should handle it; if you enabled console
autologin in `raspi-config`, turn it back off — this setup does not use it.

**`chromium-browser: not found`** — the binary is `chromium` on some images. Update
the `ExecStart` path in `kiosk.service`.

**Site loads but kiosk behaviours are absent** — the URL lost its `?kiosk=1`. Check
the `ExecStart` line; look for the `kiosk` class on `<html>`.
