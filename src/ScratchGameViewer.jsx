import { useEffect, useRef, useState } from 'react';
import { useAssetUrl } from './offline/assets';
import { useOnline } from './offline/useOnline';

/**
 * Plays a Scratch project from a self-contained file we host ourselves, so it
 * works with no connection. `url` is kept as a link back to the original project
 * on Scratch — the packaged copy is a mirror, not a replacement.
 */
const ScratchGameViewer = ({ localPath, url, title, author, instructions, notes }) => {
  const { url: gameUrl } = useAssetUrl(localPath);
  const { online } = useOnline();
  const cardRef = useRef(null);
  const [near, setNear] = useState(false);

  // Each game is a full VM; mounting seven at once on the 2025 page is heavy.
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
    <div className="model-card" ref={cardRef}>
      <div className="card-body scratch-body">
        <span className="card-type">Scratch Game</span>
        <div className="scratch-wrapper">
          {near ? (
            <iframe src={gameUrl} allowFullScreen title={title} />
          ) : (
            <div className="scratch-placeholder" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="34" height="34" fill="currentColor">
                <path d="M8 5.5l11 6.5-11 6.5v-13z" />
              </svg>
            </div>
          )}
        </div>
      </div>
      <div className="card-info">
        <div className="card-name">{title}</div>
        <div className="card-author">{author}</div>
        {url && online && (
          <a className="card-link" href={url} target="_blank" rel="noopener noreferrer">
            View on Scratch ↗
          </a>
        )}
        {instructions && (
          <details className="card-note">
            <summary className="card-note-label">Instructions</summary>
            <p>{instructions}</p>
          </details>
        )}
        {notes && (
          <details className="card-note">
            <summary className="card-note-label">Notes and Credits</summary>
            <p>{notes}</p>
          </details>
        )}
      </div>
    </div>
  );
};

export default ScratchGameViewer;
