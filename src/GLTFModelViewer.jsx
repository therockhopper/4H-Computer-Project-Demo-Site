import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useAssetUrl, formatBytes } from './offline/assets';
import { isKiosk } from './kiosk';

// Lazy for the same reason as STLModelViewer: three.js plus its GLTF loader and
// orbit controls are heavy, and most cards on the page are never scrolled to.
const StlViewer = lazy(() =>
  import('react-stl-viewer').then((m) => ({ default: m.StlViewer }))
);

const viewerStyle = { width: '100%', height: '100%' };

// Models above this size wait for a tap rather than auto-loading on scroll.
const AUTOLOAD_LIMIT = 3 * 1024 * 1024;

const HOME_CAMERA = {
  latitude: Math.PI / 8,
  longitude: -Math.PI / 8,
  distance: 3,
};

/**
 * Displays a colored glTF export, falling back to an uncolored STL if the
 * glTF ever fails to load (e.g. a malformed export). A .bbmodel, if given, is
 * offered as a download rather than rendered — nothing in this project's
 * three.js stack can read Blockbench's native project format.
 */
const GLTFModelViewer = ({ gltfPath, stlPath, bbmodelPath, title, description }) => {
  const { url: gltfUrl, bytes, cached } = useAssetUrl(gltfPath);
  const { url: stlUrl } = useAssetUrl(stlPath);
  const cardRef = useRef(null);
  const canvasHostRef = useRef(null);
  const homeRef = useRef(null); // camera/target to return to on Reset
  const stlCameraRef = useRef(null);
  const [near, setNear] = useState(false);
  const [forced, setForced] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mode, setMode] = useState('gltf'); // 'gltf' | 'stl' (fallback after a load error)

  // Only run the WebGL canvas while the card is near the viewport — Safari
  // caps live contexts around 8, same constraint STLModelViewer works around.
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

  useEffect(() => {
    if (!isFullscreen) return;
    const onKey = (event) => event.key === 'Escape' && setIsFullscreen(false);
    document.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [isFullscreen]);

  const small = bytes !== null && bytes < AUTOLOAD_LIMIT;
  const show = near && (forced || cached || small || isKiosk);

  // Mount/unmount the raw three.js scene while glTF mode is showing.
  useEffect(() => {
    if (mode !== 'gltf' || !show || !canvasHostRef.current) return;

    let alive = true;
    let renderer, scene, camera, controls, frameId, resizeObserver;

    (async () => {
      const [THREE, { GLTFLoader }, { OrbitControls }] = await Promise.all([
        import('three'),
        import('three/examples/jsm/loaders/GLTFLoader.js'),
        import('three/examples/jsm/controls/OrbitControls.js'),
      ]);
      if (!alive || !canvasHostRef.current) return;

      const host = canvasHostRef.current;
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(50, 1, 0.01, 1000);
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.domElement.style.width = '100%';
      renderer.domElement.style.height = '100%';
      renderer.domElement.style.display = 'block';
      host.appendChild(renderer.domElement);

      scene.add(new THREE.HemisphereLight(0xffffff, 0x3a4a3f, 1.15));
      const dir = new THREE.DirectionalLight(0xffffff, 1.35);
      dir.position.set(3, 5, 4);
      scene.add(dir);

      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;

      const resize = () => {
        const { clientWidth: w, clientHeight: h } = host;
        if (!w || !h) return;
        renderer.setSize(w, h);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      };
      resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(host);
      resize();

      new GLTFLoader().load(
        gltfUrl,
        (gltf) => {
          if (!alive) return;
          scene.add(gltf.scene);

          const sphere = new THREE.Box3().setFromObject(gltf.scene).getBoundingSphere(new THREE.Sphere());
          const distance = sphere.radius * 2.6;
          const home = new THREE.Vector3(
            sphere.center.x + distance * 0.6,
            sphere.center.y + distance * 0.45,
            sphere.center.z + distance * 0.6
          );
          camera.position.copy(home);
          camera.near = Math.max(distance / 100, 0.01);
          camera.far = distance * 100;
          camera.updateProjectionMatrix();
          controls.target.copy(sphere.center);
          controls.update();
          homeRef.current = { camera, controls, home, target: sphere.center.clone() };

          const animate = () => {
            frameId = requestAnimationFrame(animate);
            controls.update();
            renderer.render(scene, camera);
          };
          animate();
        },
        undefined,
        () => {
          if (alive && stlPath) setMode('stl');
        }
      );
    })();

    return () => {
      alive = false;
      cancelAnimationFrame(frameId);
      resizeObserver?.disconnect();
      controls?.dispose();
      scene?.traverse((obj) => {
        obj.geometry?.dispose();
        const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
        materials.forEach((m) => m?.dispose());
      });
      renderer?.dispose();
      renderer?.domElement.remove();
      homeRef.current = null;
    };
  }, [mode, show, gltfUrl, stlPath]);

  const resetCamera = useCallback(() => {
    if (mode === 'gltf') {
      const h = homeRef.current;
      if (!h) return;
      h.camera.position.copy(h.home);
      h.controls.target.copy(h.target);
      h.controls.update();
    } else {
      stlCameraRef.current?.setCameraPosition(HOME_CAMERA);
    }
  }, [mode]);

  const toggleFullscreen = useCallback(() => setIsFullscreen((prev) => !prev), []);

  return (
    <div
      className={`model-card${isFullscreen ? ' model-card-expanded' : ''}`}
      ref={cardRef}
    >
      <div className={`card-body gltf-viewer-body${isFullscreen ? ' stl-expanded' : ''}`}>
        <span className="card-type">3D Model</span>
        {show ? (
          <>
            {mode === 'gltf' ? (
              <div className="gltf-canvas-host" ref={canvasHostRef} />
            ) : (
              <Suspense fallback={<ModelPlaceholder label="Loading…" />}>
                <StlViewer
                  style={viewerStyle}
                  url={stlUrl}
                  shadows
                  orbitControls
                  showAxes
                  modelProps={{ color: '#0055ff' }}
                  cameraProps={{ ref: stlCameraRef }}
                />
              </Suspense>
            )}
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
          </>
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
        {bbmodelPath && (
          <a className="card-link" href={bbmodelPath} download>
            Download source (.bbmodel)
          </a>
        )}
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

export default GLTFModelViewer;
