import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { useAssetUrl, formatBytes } from './offline/assets';
import { isKiosk } from './kiosk';

// three.js + the viewer are ~1MB. Split them out so the shell stays small and
// the chunk is only fetched once a model is actually about to render.
const StlViewer = lazy(() =>
  import('react-stl-viewer').then((m) => ({ default: m.StlViewer }))
);

const viewerStyle = { width: '100%', height: '100%' };

// Models above this size wait for a tap rather than auto-loading on scroll.
const AUTOLOAD_LIMIT = 3 * 1024 * 1024;

const STLModelViewer = ({ stlPath, title, description }) => {
  const { url, bytes, cached } = useAssetUrl(stlPath);
  const cardRef = useRef(null);
  const [near, setNear] = useState(false);
  const [forced, setForced] = useState(false);

  // Only mount the WebGL canvas while the card is near the viewport. Safari caps
  // live WebGL contexts around 8 per page and silently kills the oldest — the
  // 2024 page has 11 models, so unmounting off-screen viewers is a correctness
  // requirement, not just a bandwidth saving.
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setNear(entry.isIntersecting),
      { rootMargin: '400px 0px', threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // The size gate protects visitors on event WiFi. The kiosk serves from local disk,
  // where it would only hide the exhibit behind a tap nobody makes.
  const small = bytes !== null && bytes < AUTOLOAD_LIMIT;
  const show = near && (forced || cached || small || isKiosk);

  return (
    <div className="model-card" ref={cardRef}>
      <div className="card-body stl-viewer-body">
        <span className="card-type">STL Model</span>
        {show ? (
          <Suspense fallback={<ModelPlaceholder label="Loading…" />}>
            <StlViewer
              style={viewerStyle}
              url={url}
              shadows
              orbitControls
              showAxes
              modelProps={{ color: '#0055ff' }}
            />
          </Suspense>
        ) : (
          <ModelPlaceholder
            label={bytes ? formatBytes(bytes) : '3D model'}
            action={near ? () => setForced(true) : null}
          />
        )}
      </div>
      <div className="card-info">
        <div className="card-name">{title}</div>
        <div className="card-author">{description}</div>
      </div>
    </div>
  );
};

const ModelPlaceholder = ({ label, action }) => (
  <div className="model-placeholder">
    <svg viewBox="0 0 64 64" width="48" height="48" aria-hidden="true">
      <path
        d="M32 8L56 20v24L32 56 8 44V20L32 8z M32 8v48 M8 20l24 12 24-12"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
    {action ? (
      <button type="button" className="model-load-button" onClick={action}>
        Load 3D model · {label}
      </button>
    ) : (
      <span className="model-placeholder-label">{label}</span>
    )}
  </div>
);

export default STLModelViewer;
