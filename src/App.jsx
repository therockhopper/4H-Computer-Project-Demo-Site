import './App.css';
import { Routes, Route } from 'react-router-dom';

import STLModelViewer from './STLModelViewer';
import ScratchGameViewer from './ScratchGameViewer';
import Project24 from './2024';
import Project25 from './2025';
import Navigation from './Navigation';

const models = [
  {
    stlPath: '/2024/models/PeterHershey/lamppost.stl',
    title: 'Lamp Post',
    description: 'Peter Hershey',
  },
];

function HomePage() {
  return (
    <div>
      <header>
        <h1>4H Computer Project Showcase</h1>
        <Navigation currentPage="home" />
      </header>
      {/* Description Card Section */}
      <div className="description-card">
        <p>
          Welcome to the Port Hood Island View 4H club project showcase! 
          Click the links above to view projects from different years.
        </p>
        <p>
          These are the projects created by members of our club. The 3D models were designed using
          <a href="https://www.tinkercad.com" target="_blank" rel="noopener noreferrer"> Tinkercad</a>,
          <a href="https://www.blender.org" target="_blank" rel="noopener noreferrer"> Blender</a>, or
          <a href="https://www.autodesk.com/products/fusion-360" target="_blank" rel="noopener noreferrer"> Fusion360</a>.
          The games were created using
          <a href="https://scratch.mit.edu" target="_blank" rel="noopener noreferrer"> Scratch</a>.
        </p>
      </div>

      {/* Section for CAD Models */}
      <h2 className="section-title">Featured Model</h2>
      <div className="model-gallery">
        {models.map((model, index) => (
          <STLModelViewer
            key={index}
            stlPath={model.stlPath}
            title={model.title}
            description={model.description}
          />
        ))}
      </div>

      <div className="qr-code-section">
        <img src='/qr.png' alt="QR Code" className="qr-code" />
        <p className="qr-code-description">
          You can view this website on your phone by scanning the QR code.
          If any of the 3D models or Scratch Games don't load here, they might load better on your phone.
        </p>
      </div>

      <button className="refresh-button" onClick={() => window.location.reload()}>
        Reset
      </button>
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Project25 />} />
      <Route path="/2024" element={<Project24 />} />
      <Route path="/2025" element={<Project25 />} />
    </Routes>
  );
}

export default App
