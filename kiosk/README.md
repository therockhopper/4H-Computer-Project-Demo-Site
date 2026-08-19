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
boot. Build on your laptop, ship `dist/`, and the Pi never needs a toolchain.

---

## Architecture

```
power on
  └─ systemd (graphical.target)
       ├─ nginx.service   → serves /var/www/4h on 127.0.0.1:80
       └─ kiosk.service   → cage (Wayland compositor, one app, fullscreen)
                              └─ chromium --kiosk http://localhost/?kiosk=1
                                   └─ restarts in 2s if it ever dies
```

`cage` is a Wayland compositor that runs exactly one application fullscreen. There is
no window manager, no taskbar, no app switcher and no keybindings — not disabled,
never implemented. With no keyboard attached the escape surface is close to nil.

---

## First-time setup

### 1. Packages and user

```bash
sudo apt update
sudo apt install --no-install-recommends cage chromium-browser nginx

sudo useradd -m -G video,input,render,tty kiosk
id -u kiosk        # note the uid — kiosk.service assumes 1001
```

### 2. Stop the desktop competing for the display

```bash
sudo systemctl set-default multi-user.target
sudo systemctl disable lightdm 2>/dev/null || true
```

### 3. Serve the site

```bash
sudo mkdir -p /var/www/4h
sudo chown -R "$USER":www-data /var/www/4h

sudo cp kiosk/nginx-4h.conf /etc/nginx/sites-available/4h
sudo ln -sf /etc/nginx/sites-available/4h /etc/nginx/sites-enabled/4h
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl enable --now nginx
```

### 4. Install the kiosk service

```bash
sudo cp kiosk/kiosk.service /etc/systemd/system/kiosk.service
sudo systemctl daemon-reload
sudo systemctl enable kiosk.service
```

### 5. Take the Pi off the network

The requirement is never-connected, so make it structural rather than a setting
someone can flip:

```bash
sudo rfkill block wifi bluetooth
sudo systemctl disable --now wpa_supplicant bluetooth
```

Re-enable only when pushing a content update (see below).

### 6. Stop the display blanking

Append `consoleblank=0` to the single line in `/boot/firmware/cmdline.txt`. The page
also holds a `navigator.wakeLock`; this is the belt-and-braces companion.

---

## Pushing a content update

From the repo on your laptop, with the Pi temporarily on the network:

```bash
npm run build
rsync -av --delete dist/ kiosk@4h-kiosk.local:/var/www/4h/
ssh kiosk@4h-kiosk.local sudo systemctl restart kiosk
```

If the overlay filesystem is enabled (below), turn it off, reboot, update, turn it
back on, reboot.

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

**Black screen, service restarting in a loop** — usually cage failing to get a seat.
Confirm `PAMName=login` is present and `XDG_RUNTIME_DIR` matches `id -u kiosk`.

**`chromium-browser: not found`** — the binary is `chromium` on some images. Update
the `ExecStart` path in `kiosk.service`.

**Site loads but kiosk behaviours are absent** — the URL lost its `?kiosk=1`. Check
the `ExecStart` line; look for the `kiosk` class on `<html>`.
