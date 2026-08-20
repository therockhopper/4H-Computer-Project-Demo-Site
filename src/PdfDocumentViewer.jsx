import { useEffect, useRef, useState } from 'react';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { isKiosk } from './kiosk';

/**
 * Shows a PDF we host ourselves, rendered to canvases with PDF.js.
 *
 * Deliberately not an <iframe> pointing at the file. That hands the job to
 * whatever PDF viewer the browser happens to ship, and the kiosk's Chromium
 * has none — it downloaded the file instead of showing it, leaving a blank
 * card. iOS Safari is unreliable here too. PDF.js draws the pages itself, so
 * every browser gets the same result and it keeps working offline.
 *
 * A plain path, not assetUrl(): these are small and precached by Workbox, which
 * does its own revisioning. The offline manifest is for the heavy
 * runtime-cached assets only.
 */

// ~350 KB of renderer. Loaded on demand so it costs nothing until a document
// card actually comes into view.
let pdfjsPromise = null;
function loadPdfjs() {
  if (!pdfjsPromise) {
    pdfjsPromise = import('pdfjs-dist/build/pdf.min.mjs').then((pdfjs) => {
      pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
      return pdfjs;
    });
  }
  return pdfjsPromise;
}

// Render above CSS resolution so the page stays legible in the small card and
// when the card is expanded. Capped so a long document cannot eat memory.
const RENDER_SCALE = 2;
const MAX_CANVAS_WIDTH = 1600;

const PdfDocumentViewer = ({ pdfPath, title, author }) => {
  const cardRef = useRef(null);
  const pagesRef = useRef(null);
  // Guards the render from restarting — and, more importantly, from cancelling
  // itself: setStatus() re-runs this effect, whose cleanup would otherwise trip
  // the `cancelled` flag on the work it just kicked off.
  const startedRef = useRef(false);
  const [near, setNear] = useState(false);
  const [status, setStatus] = useState('idle');

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => entry.isIntersecting && setNear(true), {
      rootMargin: '400px 0px',
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!near || startedRef.current) return;
    startedRef.current = true;
    let cancelled = false;
    setStatus('loading');

    (async () => {
      try {
        const pdfjs = await loadPdfjs();
        // v6 requires the parameter object; a bare URL string is rejected.
        const doc = await pdfjs.getDocument({ url: pdfPath }).promise;
        if (cancelled) return;

        const container = pagesRef.current;
        if (!container) return;
        container.replaceChildren();

        for (let n = 1; n <= doc.numPages; n += 1) {
          const page = await doc.getPage(n);
          if (cancelled) return;

          const base = page.getViewport({ scale: 1 });
          const scale = Math.min(RENDER_SCALE, MAX_CANVAS_WIDTH / base.width);
          const viewport = page.getViewport({ scale });

          const canvas = document.createElement('canvas');
          canvas.width = Math.floor(viewport.width);
          canvas.height = Math.floor(viewport.height);
          canvas.className = 'pdf-page';
          canvas.setAttribute('role', 'img');
          canvas.setAttribute('aria-label', `${title}, page ${n} of ${doc.numPages}`);
          container.appendChild(canvas);

          await page.render({ canvas, viewport }).promise;
          if (cancelled) return;
        }
        setStatus('ready');
      } catch {
        if (!cancelled) setStatus('error');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [near, pdfPath, title]);

  return (
    <div className="model-card" ref={cardRef}>
      <div className="card-body pdf-body">
        <span className="card-type">Document</span>
        <div className="pdf-frame">
          <div className="pdf-pages" ref={pagesRef} />
          {status !== 'ready' && (
            <div className="pdf-placeholder">
              <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5z" />
                <path d="M14 3v5h5" />
              </svg>
              {status === 'error' && <span>Could not display this document.</span>}
            </div>
          )}
        </div>
      </div>
      <div className="card-info">
        <div className="card-name">{title}</div>
        <div className="card-author">{author}</div>
        {/* Deliberately not offered on the kiosk. Under --kiosk a new window
            opens fullscreen with no tab bar, and with no keyboard there is no
            Ctrl+W — one tap would end the exhibit. The pages above scroll, so
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
