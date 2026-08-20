import './App.css';

import STLModelViewer from './STLModelViewer';
import GLTFModelViewer from './GLTFModelViewer';
import ScratchGameViewer from './ScratchGameViewer';
import AnimationViewer from './AnimationViewer';
import PythonProgramViewer from './PythonProgramViewer';
import PdfDocumentViewer from './PdfDocumentViewer';
import Navigation from './Navigation';

const models = [
  {
    stlPath: '/2026/models/plant-pot.stl',
    title: '4H Plant Pot',
    description: 'David Mueller',
  },
  {
    gltfPath: '/2026/models/castle/castel.gltf',
    stlPath: '/2026/models/castle/castel.stl',
    bbmodelPath: '/2026/models/castle/castel.bbmodel',
    title: 'Castle',
    description: 'Malcolm Beaton',
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
  {
    title: 'Gold Fish Game',
    author: 'Malcolm Beaton',
    localPath: '/games/gold-fish-game.html',
    url: 'https://scratch.mit.edu/projects/1276637435',
    instructions: `Press the space bar to cast your fishing rod and catch fish.
Right arow to go to shop
Left arow to go to dock.
Up arow to turn volume down to make it quieter.
Use the Number buttons to explore the fishpedia and learn about the different fish you have caught. Every number corresponds to a different page. Start the fishpedia by pressing 2 and flip through the pages with number buttons 3 through 9.When you level up your bait it adds pages to the fish-pedia.

Catch fish to earn points, and use your points to increase your bait level and catch different fish,
or buy costumes to make you look cool.

When you upgrade your bait level it will increase the type of fish available to you. Check for new pages to your fishapedia..`,
    notes: `Graphics by me
Original music by me (except for the "cha ching" I got that from a YouTubevideo from a YouTube channel called cashregestersound)`,
  },
];

const animations = [
  {
    title: 'Ghosts Get Out',
    author: 'Malcolm Beaton',
    videoPath: '/2026/animations/Ghosts Get Out.mp4',
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
          {models.map((model, index) =>
            model.gltfPath ? (
              <GLTFModelViewer
                key={index}
                gltfPath={model.gltfPath}
                stlPath={model.stlPath}
                bbmodelPath={model.bbmodelPath}
                title={model.title}
                description={model.description}
              />
            ) : (
              <STLModelViewer
                key={index}
                stlPath={model.stlPath}
                title={model.title}
                description={model.description}
              />
            )
          )}
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
              instructions={game.instructions}
              notes={game.notes}
            />
          ))}
        </div>

        <div className="section-head">
          <h2 className="section-title">Animations</h2>
          <span className="section-chip">Video</span>
        </div>
        <div className="section-rule"></div>
        <div className="model-gallery">
          {animations.map((animation, index) => (
            <AnimationViewer
              key={index}
              videoPath={animation.videoPath}
              title={animation.title}
              author={animation.author}
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
