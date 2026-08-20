import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
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

// react-stl-viewer's own defaults, which is what the model is framed with on
// load. Mirrored here so Reset puts the camera back exactly where it started
// rather than somewhere that merely looks similar.
const HOME_CAMERA = {
  latitude: Math.PI / 8,
  longitude: -Math.PI / 8,
  distance: 3, // a factor applied to the model's bounding radius, not a length
};

/*
 * "Expand" is a CSS overlay rather than Element.requestFullscreen.
 *
 * iOS Safari has no element fullscreen outside <video>, and a good share of
 * visitors arrive by scanning the QR on a phone. The native API also needs a
 * user-activation permission check and, on the kiosk, leaves Esc as the
 * expected way out — and the kiosk has no keyboard. Pinning the viewer to the
 * viewport in CSS behaves identically everywhere and always has a visible way
 * back out.
 */

const STLModelViewer = ({ stlPath, title, description }) => {
  const { url, bytes, cached } = useAssetUrl(stlPath);
  const cardRef = useRef(null);
  const viewerRef = useRef(null);
  const cameraRef = useRef(null);
  const [near, setNear] = useState(false);
  const [forced, setForced] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

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

  // Escape still closes it for anyone who does have a keyboard, matching what
  // an expanded view is expected to do.
  useEffect(() => {
    if (!isFullscreen) return;
    const onKey = (event) => event.key === 'Escape' && setIsFullscreen(false);
    document.addEventListener('keydown', onKey);
    // Stop the page behind the overlay scrolling under the model.
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [isFullscreen]);

  const resetCamera = useCallback(() => {
    cameraRef.current?.setCameraPosition(HOME_CAMERA);
  }, []);

  const toggleFullscreen = useCallback(() => setIsFullscreen((prev) => !prev), []);

  // The size gate protects visitors on event WiFi. The kiosk serves from local disk,
  // where it would only hide the exhibit behind a tap nobody makes.
  const small = bytes !== null && bytes < AUTOLOAD_LIMIT;
  const show = near && (forced || cached || small || isKiosk);

  return (
    <div
      className={`model-card${isFullscreen ? ' model-card-expanded' : ''}`}
      ref={cardRef}
    >
      <div
        className={`card-body stl-viewer-body${isFullscreen ? ' stl-expanded' : ''}`}
        ref={viewerRef}
      >
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
              cameraProps={{ ref: cameraRef }}
            />
            <div className="model-controls">
              <button
                type="button"
                className="model-control"
                onClick={resetCamera}
                title="Reset the view"
                aria-label="Reset the view"
              >
                <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
                  <path d="M3 3v5h5" />
                </svg>
              </button>
              <button
                type="button"
                className="model-control"
                onClick={toggleFullscreen}
                title={isFullscreen ? 'Exit full screen' : 'Full screen'}
                aria-label={isFullscreen ? 'Exit full screen' : 'Full screen'}
              >
                {isFullscreen ? (
                  <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 3v6H3M15 3v6h6M9 21v-6H3M15 21v-6h6" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9V3h6M21 9V3h-6M3 15v6h6M21 15v6h-6" />
                  </svg>
                )}
              </button>
            </div>
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
