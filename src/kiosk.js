/**
 * Kiosk mode — for the Raspberry Pi display at shows.
 *
 * The Pi serves the built site from nginx on localhost and launches Chromium with
 * `--kiosk http://localhost/?kiosk=1`. There is a mouse but no keyboard, so anything
 * that opens a second window or a context menu is a trap with no way back.
 *
 * Latched into sessionStorage on first detection so it survives client-side
 * navigation (a <Link> would drop the query param) and any reload. The per-boot
 * profile wipe in kiosk.service clears it between shows.
 */
const detected =
  new URLSearchParams(window.location.search).has('kiosk') ||
  sessionStorage.getItem('kiosk') === '1';

export const isKiosk = detected;

if (detected) {
  try {
    sessionStorage.setItem('kiosk', '1');
  } catch {
    /* private mode / storage disabled — kiosk still works for this page load */
  }
}

/** Return to the top of the site after this long without input. */
const IDLE_RESET_MS = 3 * 60 * 1000;

const isExternal = (anchor) => {
  const href = anchor.getAttribute('href');
  if (!href || href.startsWith('#')) return false;
  try {
    return new URL(href, window.location.href).origin !== window.location.origin;
  } catch {
    return false;
  }
};

/**
 * Block navigation to anything off-origin.
 *
 * Under --kiosk a new-window request opens another fullscreen window with no tab bar
 * and no close affordance, and with no keyboard there is no Ctrl+W or Alt+F4 — one
 * click on an external link ends the exhibit until someone power-cycles the Pi.
 *
 * Capture phase so this runs before React's synthetic handlers. `auxclick` covers
 * middle-click, which opens a new window even when `click` is prevented.
 */
function blockExternalLinks() {
  const handler = (event) => {
    const anchor = event.target.closest?.('a[href]');
    if (anchor && isExternal(anchor)) {
      event.preventDefault();
      event.stopPropagation();
    }
  };
  document.addEventListener('click', handler, true);
  document.addEventListener('auxclick', handler, true);
}

/** Right-click is the main escape route when a mouse is the only input device. */
function blockContextMenu() {
  document.addEventListener('contextmenu', (event) => event.preventDefault());
}

/**
 * Reset to the top of the site once a visitor walks away, so the next one does not
 * inherit a half-scrolled page or a game left mid-play.
 */
function resetWhenIdle() {
  let timer;
  const reset = () => {
    clearTimeout(timer);
    timer = setTimeout(() => window.location.replace('/?kiosk=1'), IDLE_RESET_MS);
  };
  for (const event of ['pointerdown', 'pointermove', 'wheel', 'scroll', 'keydown']) {
    window.addEventListener(event, reset, { passive: true });
  }
  reset();
}

/** Keep the monitor awake. The lock is dropped whenever the page is hidden. */
function keepScreenAwake() {
  if (!navigator.wakeLock) return;
  const request = () => {
    navigator.wakeLock.request('screen').catch(() => {
      /* denied or not permitted — consoleblank=0 on the Pi is the fallback */
    });
  };
  request();
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') request();
  });
}

export function startKioskMode() {
  if (!isKiosk) return;
  document.documentElement.classList.add('kiosk');
  blockExternalLinks();
  blockContextMenu();
  resetWhenIdle();
  keepScreenAwake();
}
