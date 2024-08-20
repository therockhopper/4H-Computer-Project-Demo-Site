import './App.css';

import STLModelViewer from './STLModelViewer';
import ScratchGameViewer from './ScratchGameViewer';

const models = [
  {
    stlPath: '/models/EmmetMcNabb/Emmett4HProject1.stl',
    title: 'Steve',
    description: 'Emmett McNabb',
  },
  {
    stlPath: '/models/EmmetMcNabb/Emmetts4HProject2.stl',
    title: 'Truck',
    description: 'Emmett McNabb',
  },
  {
    stlPath: '/models/SamuelWatts/SamBoat.stl',
    title: 'Boat',
    description: 'Samuel Watts',
  },
  {
    stlPath: '/models/SamuelWatts/PumpkinSword.stl',
    title: 'Sword',
    description: 'Samuel Watts',
  },
  {
    stlPath: '/models/SamuelWatts/dogtag.stl',
    title: 'Dog Tag',
    description: 'Samuel Watts',
  },
  {
    stlPath: '/models/MaliaWatts/Skipper.stl',
    title: 'Skipper',
    description: 'Malia Watts',
  },
  {
    stlPath: '/models/SterlingMorrison/Spider_Hat.stl',
    title: 'Spider Hat',
    description: 'Sterling Morrison',
  },
  {
    stlPath: '/models/SterlingMorrison/rabbit.stl',
    title: 'Rabbit',
    description: 'Sterling Morrison',
  },

  {
    stlPath: '/models/WilliamHershey/FunkyRobo.stl',
    title: 'Funky Robo',
    description: 'William Hershey',
  },
  {
    stlPath: '/models/PeterHershey/lamppost.stl',
    title: 'Lamp Post',
    description: 'Peter Hershey',
  },
  {
    stlPath: '/models/BrodyRobinson/SurprisingBorwo.stl',
    title: 'Surprising Borwo',
    description: 'Brody Robinson',
  }
];

const scratchGames = [
  {
    title: 'Fire Fingers',
    author: 'William Hershey',
    url: 'https://scratch.mit.edu/projects/1055559112/embed',
  },
  {
    title: 'Button Clicker',
    author: 'Peter Hershey',
    url: 'https://scratch.mit.edu/projects/1054639773/embed',
  },
]

const animations = [
  {
    title: 'Cat Makes',
    author: 'Sterling Morrison',
    url: "https://www.youtube.com/embed/bA5wyWt2koI?si=ewIJE-goOVZzANCh"
  }

]


function project24() {
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

export default project24;
