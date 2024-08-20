import './App.css';

import STLModelViewer from './STLModelViewer';
import ScratchGameViewer from './ScratchGameViewer';

const models = [
  {
    stlPath: '/models/PeterHershey/lamppost.stl',
    title: 'Lamp Post',
    description: 'Peter Hershey',
  },
];

function App() {
  return (
    <div>
      <header>
        <h1>4H Computer Project Showcase</h1>
      </header>
      {/* Description Card Section */}
      <div className="description-card">
        <p>
          These are the projects created by members of the Port Hood Island View 4H club. The 3D models were designed using
          <a href="https://www.tinkercad.com" target="_blank" rel="noopener noreferrer"> Tinkercad</a>,

          <a href="https://www.blender.org" target="_blank" rel="noopener noreferrer"> Blender</a>, or
          <a href="https://www.autodesk.com/products/fusion-360" target="_blank" rel="noopener noreferrer"> Fusion360</a>.
          The games were created using
          <a href="https://scratch.mit.edu" target="_blank" rel="noopener noreferrer"> Scratch</a>.

        </p>
      </div>


      {/* Section for CAD Models */}
      <h2 className="section-title">CAD Models</h2>
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

export default App
