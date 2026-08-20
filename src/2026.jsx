import './App.css';

import STLModelViewer from './STLModelViewer';
import ScratchGameViewer from './ScratchGameViewer';
import PythonProgramViewer from './PythonProgramViewer';
import PdfDocumentViewer from './PdfDocumentViewer';
import Navigation from './Navigation';

const models = [
  {
    stlPath: '/2026/models/plant-pot.stl',
    title: '4H Plant Pot',
    description: 'David Mueller',
  },
];

const scratchGames = [
  {
    title: 'Robin Hood',
    author: 'William Hershey',
    localPath: '/games/robinhood.html',
  },
  {
    title: 'Galaxy Evade',
    author: 'Henry Hershey',
    localPath: '/games/galaxy-evade.html',
  },
  {
    title: "Gnomey's Slimey Adventure",
    author: 'Henry Hershey',
    localPath: '/games/gnomeys-slimey-adventure.html',
  },
  {
    title: 'Bug Hunt',
    author: 'David Mueller',
    localPath: '/games/bug-hunt.html',
    url: 'https://scratch.mit.edu/projects/1269295368',
  },
];

const documents = [
  {
    title: '4-H Resume 2026',
    author: 'David Mueller',
    pdfPath: '/2026/pdf/david-mueller-resume-2026.pdf',
  },
];

const pythonPrograms = [
  {
    title: 'Fraction Bot',
    author: 'William Hershey',
    sourcePath: '/2026/python/fracbot.py',
  },
  {
    title: 'Chat Bot',
    author: 'William Hershey',
    sourcePath: '/2026/python/chatbot.py',
  },
  {
    title: 'Animal Namer',
    author: 'Henry Hershey',
    sourcePath: '/2026/python/animal.py',
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
            {' '}Python programs run right here in the page &mdash; press Run and type your answers.
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

        <div className="section-head">
          <h2 className="section-title">Python Programs</h2>
          <span className="section-chip">Code</span>
        </div>
        <div className="section-rule"></div>
        <div className="model-gallery">
          {pythonPrograms.map((program, index) => (
            <PythonProgramViewer
              key={index}
              sourcePath={program.sourcePath}
              title={program.title}
              author={program.author}
            />
          ))}
        </div>

        <div className="section-head">
          <h2 className="section-title">Member Resume</h2>
          <span className="section-chip">Document</span>
        </div>
        <div className="section-rule"></div>
        <div className="model-gallery">
          {documents.map((doc, index) => (
            <PdfDocumentViewer
              key={index}
              pdfPath={doc.pdfPath}
              title={doc.title}
              author={doc.author}
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
