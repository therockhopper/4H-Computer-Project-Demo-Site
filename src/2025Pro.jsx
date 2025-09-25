import './App.css';

import STLModelViewer from './STLModelViewer';
import ScratchGameViewer from './ScratchGameViewer';

const models = [
  {
    stlPath: '/2025/models/EmmettRobot.stl',
    title: 'The Big Bad wolf',
    description: 'Emmett McNabb',
  },
];

const scratchGames = [
  {
    title: 'Fly Bat',
    author: 'Malcolm Beaton',
    url: 'https://scratch.mit.edu/projects/1123823210/embed',
  },
]

function Project25Pro() {
  return (
    <div>
      <header>
        <h1>Inverness Country Computer Project Showcase</h1>
      </header>
      <div className="description-card">
        <p>
          These are the projects created by members of the Port Hood Island View 4H club in 2025. The 3D models were designed using
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

      {/* Section for Scratch Games */}
      <h2 className="section-title">Scratch Games</h2>
      <div className="model-gallery">
        {scratchGames.map((game, index) => (
          <ScratchGameViewer
            key={index}
            url={game.url}
            title={game.title}
            author={game.author}
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

export default Project25Pro;
