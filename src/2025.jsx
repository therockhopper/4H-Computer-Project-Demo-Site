import './App.css';

import STLModelViewer from './STLModelViewer';
import ScratchGameViewer from './ScratchGameViewer';
import PosterViewer from './PosterViewer';

const models = [
  {
    stlPath: '/2025/models/EmmettBeach.stl',
    title: 'Beach',
    description: 'Emmett McNabb',
  },

  {
    stlPath: '/2025/models/EmmettRobot.stl',
    title: 'Robot',
    description: 'Emmett McNabb',
  },
  {
    stlPath: '/2025/models/SamuelWattsCar.stl',
    title: 'Car',
    description: 'Samuel Watts',
  },
  {
    stlPath: '/2025/models/SamuelWattsAirport.stl',
    title: 'Airport',
    description: 'Samuel Watts',
  },

];

const scratchGames = [
  {
    title: 'Pogo Penguin',
    author: 'Malcolm Beaton',
    url: 'https://scratch.mit.edu/projects/1163371525/embed',
  },
  {
    title: 'Fly Bat',
    author: 'Malcolm Beaton',
    url: 'https://scratch.mit.edu/projects/1123823210/embed',
  },
  {
    title: 'Untitled',
    author: 'Samuel Watts',
    url: ' https://scratch.mit.edu/projects/1136390747/embed',
  },
  {
    title: 'The Broken Script: Integrity Boss Fight',
    author: 'Sterling Morrison',
    url: 'https://scratch.mit.edu/projects/1162757694/embed',
  }
]

const animations = [
  // Add your 2025 animations here
]

const posters = [
  {
    title: 'Digital Art Poster',
    author: 'Sample Student',
    url: '/2025/images/MalcomFLYBATPOSTER.gif',
    type: 'gif'
  }
]


function project25() {
  return (
    <div>
      <header>
        <h1>4H Computer Project Showcase - 2025</h1>
      </header>
      {/* Description Card Section */}
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

      {/* Section for Animations */}
      {animations.length > 0 && (
        <>
          <h2 className="section-title">Animations</h2>
          <div className="animation-gallery">
            {animations.map((animation, index) => (
              <div key={index} className="model-card">
                <div className="card-header">
                  <h2>{animation.title}</h2>
                </div>
                <div className="card-body">
                  <iframe
                    width="560"
                    height="315"
                    src={animation.url}
                    title={animation.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </div>
                <div className="card-footer">
                  <p>By: {animation.author}</p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Section for Posters */}
      <h2 className="section-title">Posters</h2>
      <div className="poster-gallery">
        {posters.map((poster, index) => (
          <PosterViewer
            key={index}
            url={poster.url}
            title={poster.title}
            author={poster.author}
            type={poster.type}
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

export default project25;
