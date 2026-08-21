import { useEffect, useRef, useState } from 'react';
import { useAssetUrl } from './offline/assets';

const AnimationViewer = ({ videoPath, title, author, description }) => {
  const { url } = useAssetUrl(videoPath);
  const cardRef = useRef(null);
  const [near, setNear] = useState(false);

  // Mount the <video> once the card is near the viewport, same as the other
  // heavy-asset viewers — but no tap-to-load gate: preload="metadata" means the
  // browser only fetches enough to show a poster frame/duration, not the whole
  // file, so there's no event-WiFi cost until the visitor actually presses play.
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setNear(entry.isIntersecting), {
      rootMargin: '400px 0px',
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="animation-card" ref={cardRef}>
      <div className="card-body animation-body">
        <span className="card-type">Animation</span>
        {near ? (
          <video src={url} controls playsInline preload="metadata" />
        ) : (
          <div className="model-placeholder">
            <svg viewBox="0 0 64 64" width="48" height="48" aria-hidden="true">
              <rect x="8" y="14" width="48" height="36" rx="4" fill="none" stroke="currentColor" strokeWidth="1.5" />
              <path d="M26 24l16 8-16 8V24z" fill="currentColor" />
            </svg>
            <span className="model-placeholder-label">Animation</span>
          </div>
        )}
      </div>
      <div className="card-info">
        <div className="card-name">{title}</div>
        <div className="card-author">{author}</div>
        {description && (
          <details className="card-note">
            <summary className="card-note-label">Description</summary>
            <p>{description}</p>
          </details>
        )}
      </div>
    </div>
  );
};

export default AnimationViewer;
