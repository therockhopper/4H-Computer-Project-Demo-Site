import { useEffect, useRef, useState } from 'react';
import { useAssetUrl, formatBytes } from './offline/assets';
import { isKiosk } from './kiosk';

// Animations wait for a tap rather than auto-loading — they run well into the
// tens of MB, same reasoning as the STL size gate.
const AUTOLOAD_LIMIT = 3 * 1024 * 1024;

const AnimationViewer = ({ videoPath, title, author }) => {
  const { url, bytes, cached } = useAssetUrl(videoPath);
  const cardRef = useRef(null);
  const [near, setNear] = useState(false);
  const [forced, setForced] = useState(false);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setNear(entry.isIntersecting), {
      rootMargin: '400px 0px',
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const small = bytes !== null && bytes < AUTOLOAD_LIMIT;
  const show = near && (forced || cached || small || isKiosk);

  return (
    <div className="animation-card" ref={cardRef}>
      <div className="card-body animation-body">
        <span className="card-type">Animation</span>
        {show ? (
          <video src={url} controls playsInline />
        ) : (
          <div className="model-placeholder">
            <svg viewBox="0 0 64 64" width="48" height="48" aria-hidden="true">
              <rect x="8" y="14" width="48" height="36" rx="4" fill="none" stroke="currentColor" strokeWidth="1.5" />
              <path d="M26 24l16 8-16 8V24z" fill="currentColor" />
            </svg>
            {near ? (
              <button type="button" className="model-load-button" onClick={() => setForced(true)}>
                Load animation · {bytes ? formatBytes(bytes) : ''}
              </button>
            ) : (
              <span className="model-placeholder-label">{bytes ? formatBytes(bytes) : 'Animation'}</span>
            )}
          </div>
        )}
      </div>
      <div className="card-info">
        <div className="card-name">{title}</div>
        <div className="card-author">{author}</div>
      </div>
    </div>
  );
};

export default AnimationViewer;
