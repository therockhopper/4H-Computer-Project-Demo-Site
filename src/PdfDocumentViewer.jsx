import { useEffect, useRef, useState } from 'react';
import { isKiosk } from './kiosk';

/**
 * Shows a PDF we host ourselves, rendered by the browser's own viewer.
 *
 * A plain path, not assetUrl(): these are small and precached by Workbox, which
 * does its own revisioning. The offline manifest is for the heavy
 * runtime-cached assets only.
 */
const PdfDocumentViewer = ({ pdfPath, title, author }) => {
  const cardRef = useRef(null);
  const [near, setNear] = useState(false);

  // Same deferral as the game cards: a PDF viewer is a real plugin instance, so
  // don't spin one up until the card is close to the viewport.
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
      <div className="card-body pdf-body">
        <span className="card-type">Document</span>
        <div className="pdf-frame">
          {near ? (
            <iframe src={`${pdfPath}#view=FitH&toolbar=0&navpanes=0`} title={title} />
          ) : (
            <div className="pdf-placeholder" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5z" />
                <path d="M14 3v5h5" />
              </svg>
            </div>
          )}
        </div>
      </div>
      <div className="card-info">
        <div className="card-name">{title}</div>
        <div className="card-author">{author}</div>
        {/* Deliberately not offered on the kiosk. Under --kiosk a new window
            opens fullscreen with no tab bar, and with no keyboard there is no
            Ctrl+W — one tap would end the exhibit. The frame above scrolls, so
            nothing is lost. */}
        {!isKiosk && (
          <a className="card-link" href={pdfPath} target="_blank" rel="noopener noreferrer">
            Open the full document ↗
          </a>
        )}
      </div>
    </div>
  );
};

export default PdfDocumentViewer;
