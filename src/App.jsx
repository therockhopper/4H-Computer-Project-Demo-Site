import './App.css';
import { Routes, Route } from 'react-router-dom';

import Project26 from './2026';
import Project26ProShow from './2026ProShow';
import OfflinePanel from './offline/OfflinePanel';
import { isKiosk } from './kiosk';

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Project26ProShow />} />
        <Route path="/2026-pro-show" element={<Project26ProShow />} />
        <Route path="/2026" element={<Project26 />} />
      </Routes>
      {/* Outside <Routes> so it is reachable from every page. Meaningless on the
          kiosk, which already has every asset on local disk. */}
      {!isKiosk && <OfflinePanel />}
    </>
  );
}

export default App
