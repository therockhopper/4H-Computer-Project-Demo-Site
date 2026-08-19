import { registerSW } from 'virtual:pwa-register';

/**
 * `prompt` rather than `autoUpdate`: an auto-update reloads the page the moment a
 * new worker activates, which could happen while a visitor is mid-game or
 * orbiting a model in front of a judge.
 */
export function setupServiceWorker() {
  const updateSW = registerSW({
    onNeedRefresh() {
      showUpdateToast(() => updateSW(true));
    },
    onRegisteredSW(swUrl, registration) {
      if (!registration) return;
      // Hourly, not the previous 60s. And gated on actually being online, so we
      // don't throw a rejected promise every minute for the length of an event.
      setInterval(async () => {
        if (document.visibilityState !== 'visible' || !navigator.onLine) return;
        const res = await fetch(swUrl, { cache: 'no-store' }).catch(() => null);
        if (res?.status === 200) registration.update();
      }, 60 * 60 * 1000);
    },
  });
}

function showUpdateToast(onAccept) {
  if (document.querySelector('.sw-toast')) return;

  const toast = document.createElement('div');
  toast.className = 'sw-toast';
  toast.innerHTML =
    '<span>A new version is available.</span>' +
    '<button type="button" data-accept>Reload</button>' +
    '<button type="button" data-dismiss aria-label="Dismiss">✕</button>';

  toast.querySelector('[data-accept]').addEventListener('click', onAccept);
  toast.querySelector('[data-dismiss]').addEventListener('click', () => toast.remove());
  document.body.appendChild(toast);
}
