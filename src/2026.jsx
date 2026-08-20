import './App.css';

import STLModelViewer from './STLModelViewer';
import ScratchGameViewer from './ScratchGameViewer';
import Navigation from './Navigation';

const models = [
  {
    stlPath: '/2026/models/EmmettRobot.stl',
    title: 'The Big Bad Wolf',
    description: 'Emmett McNabb',
  },
];

const scratchGames = [
  {
    title: 'Fly Bat',
    author: 'Malcolm Beaton',
    localPath: '/games/fly-bat.html',
    url: 'https://scratch.mit.edu/projects/1123823210',
  },
];

function Project26() {
  return (
    <div>
      <header>
        <div className="year-badge">Port Hood Island View · 2026</div>
        <h1>4H Computer Project <em>Showcase</em></h1>
        <p className="header-sub">Celebrating the creativity and technical skills of our 4&#8209;H club members</p>
        <Navigation currentPage="2026" />
      </header>

      <div className="page-wrap">
        <div className="description-card">
          <p>
            Projects created by members of the Port Hood Island View 4H club in 2026. 3D models designed using
            {' '}<a href="https://www.tinkercad.com" target="_blank" rel="noopener noreferrer">Tinkercad</a>,
            {' '}<a href="https://www.blender.org" target="_blank" rel="noopener noreferrer">Blender</a>, or
            {' '}<a href="https://www.autodesk.com/products/fusion-360" target="_blank" rel="noopener noreferrer">Fusion360</a>.
            {' '}Games created using
            {' '}<a href="https://scratch.mit.edu" target="_blank" rel="noopener noreferrer">Scratch</a>.
          </p>
        </div>

        <div className="section-head">
          <h2 className="section-title">CAD Models</h2>
          <span className="section-chip">3D Design</span>
        </div>
        <div className="section-rule"></div>
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

        <div className="section-head">
          <h2 className="section-title">Scratch Games</h2>
          <span className="section-chip">Interactive</span>
        </div>
        <div className="section-rule"></div>
        <div className="model-gallery">
          {scratchGames.map((game, index) => (
            <ScratchGameViewer
              key={index}
              localPath={game.localPath}
              url={game.url}
              title={game.title}
              author={game.author}
            />
          ))}
        </div>

        <div className="qr-code-section">
          <img src='/qr.png' alt="QR Code" className="qr-code" />
          <p className="qr-code-description">
            Scan to view this site on your phone. 3D models and Scratch games may load better on mobile.
          </p>
        </div>

        <button className="refresh-button" onClick={() => window.location.reload()}>
          Reset
        </button>
      </div>
    </div>
  );
}

export default Project26;
