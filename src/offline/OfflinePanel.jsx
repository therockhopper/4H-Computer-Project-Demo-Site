import { useState } from 'react';
import { formatBytes } from './assets';
import { useOfflineStore } from './useOfflineStore';
import { useOnline, useStandalone, isIOS } from './useOnline';
import './offline.css';

export default function OfflinePanel() {
  const [open, setOpen] = useState(false);
  const { online } = useOnline();
  const standalone = useStandalone();
  const { groups, estimate, progress, failures, quotaError, supported, download, cancel, purge } =
    useOfflineStore();

  if (!supported) return null;

  const totalBytes = groups.reduce((n, g) => n + g.bytes, 0);
  const cachedBytes = groups.reduce((n, g) => n + g.cachedBytes, 0);
  const allCached = totalBytes > 0 && cachedBytes >= totalBytes;

  // Since iOS 17.4 an installed app gets a storage bucket separate from Safari,
  // so anything downloaded in the tab does not carry over. And Safari clears site
  // data after 7 days idle unless the site is installed — which, for "load at
  // home, show at the fair a month later", makes installing a requirement.
  const warnInstallFirst = isIOS() && !standalone;

  let label = 'Save for offline';
  if (progress) {
    const pct = progress.totalBytes ? Math.round((progress.doneBytes / progress.totalBytes) * 100) : 0;
    label = `${pct}% · ${formatBytes(progress.doneBytes)}`;
  } else if (allCached) {
    label = 'Offline ready';
  } else if (cachedBytes > 0) {
    label = `${formatBytes(cachedBytes)} saved`;
  } else if (totalBytes) {
    label = `Save offline · ${formatBytes(totalBytes)}`;
  }

  return (
    <>
      <button
        type="button"
        className={`offline-badge${allCached ? ' is-ready' : ''}${online ? '' : ' is-offline'}`}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="offline-dot" aria-hidden="true" />
        {online ? label : 'Offline'}
      </button>

      {open && (
        <div className="offline-panel" role="dialog" aria-label="Offline downloads">
          <div className="offline-panel-head">
            <h2>Offline</h2>
            <button type="button" className="offline-close" onClick={() => setOpen(false)}>
              ✕
            </button>
          </div>

          {warnInstallFirst && (
            <p className="offline-note">
              <strong>Install first.</strong> On iPhone and iPad, an app added to the Home Screen
              gets its own separate storage — anything downloaded here in Safari won&apos;t carry
              over. Tap Share, then <em>Add to Home Screen</em>, open it from there, and download
              inside the app.
            </p>
          )}

          {!online && (
            <p className="offline-note">
              You&apos;re offline. Anything already saved still works; new downloads need a
              connection.
            </p>
          )}

          {quotaError && (
            <p className="offline-note is-error">
              Not enough space — this needs {formatBytes(quotaError.needed)} but only{' '}
              {formatBytes(quotaError.available)} is free. Try one year at a time, or remove a year
              below.
            </p>
          )}

          <ul className="offline-groups">
            {groups.map((g) => {
              const done = g.cachedCount >= g.count;
              return (
                <li key={g.id}>
                  <div className="offline-group-text">
                    <span className="offline-group-label">{g.label}</span>
                    <span className="offline-group-meta">
                      {done
                        ? `Saved · ${formatBytes(g.bytes)}`
                        : `${g.cachedCount} of ${g.count} · ${formatBytes(g.bytes)}`}
                    </span>
                  </div>
                  {done ? (
                    <button type="button" className="offline-action" onClick={() => purge([g.id])}>
                      Remove
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="offline-action is-primary"
                      disabled={!online || Boolean(progress)}
                      onClick={() => download([g.id])}
                    >
                      Save
                    </button>
                  )}
                </li>
              );
            })}
          </ul>

          {progress && (
            <div className="offline-progress">
              <div className="offline-bar">
                <span
                  style={{
                    width: `${
                      progress.totalBytes ? (progress.doneBytes / progress.totalBytes) * 100 : 0
                    }%`,
                  }}
                />
              </div>
              <div className="offline-progress-text">
                <span>
                  {progress.doneCount} of {progress.totalCount} files
                </span>
                <button type="button" className="offline-action" onClick={cancel}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          {failures.length > 0 && (
            <p className="offline-note is-error">
              {failures.length} file{failures.length === 1 ? '' : 's'} didn&apos;t save. Tap Save
              again to retry — anything already saved is skipped.
            </p>
          )}

          {!progress && groups.length > 1 && (
            <button
              type="button"
              className="offline-save-all"
              disabled={!online || allCached}
              onClick={() => download(groups.map((g) => g.id))}
            >
              {allCached ? 'Everything saved' : `Save everything · ${formatBytes(totalBytes)}`}
            </button>
          )}

          {estimate?.quota ? (
            <p className="offline-estimate">
              Using {formatBytes(estimate.usage)} of {formatBytes(estimate.quota)} available
            </p>
          ) : null}
        </div>
      )}
    </>
  );
}
