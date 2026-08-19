import './App.css';
import { Routes, Route } from 'react-router-dom';

import Project26 from './2026';
import OfflinePanel from './offline/OfflinePanel';

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Project26 />} />
        <Route path="/2026" element={<Project26 />} />
      </Routes>
      {/* Outside <Routes> so it is reachable from every page. */}
      <OfflinePanel />
    </>
  );
}

export default App
