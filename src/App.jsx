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
    stlPath: '/models/WilliamHershey/FunkyRobo.stl',
    title: 'Funky Robo',
    description: 'William Hershey',
  },
  {
    stlPath: '/models/PeterHershey/lamppost.stl',
    title: 'Lamp Post',
    description: 'Peter Hershey',
  },
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

function App() {
  return (
    <div>
      <header>
        <h1>4H Computer Project - Port Hood Island View 4-H Club</h1>
      </header>

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
    </div>
  );
}

export default App
