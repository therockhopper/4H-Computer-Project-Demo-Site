import './App.css';

import STLModelViewer from './STLModelViewer';

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
    title: 'Sterling Morrison',
    description: 'Spider Hat',
  },
  // {
  //   stlPath: '/models/BrodyRobinson/.stl',
  //   title: 'Brody Robinson',
  //   description: '',
  // }
];


function App() {
  return (
    <div>
      <header>
        <h1>4H Computer Project - Port Hood Island View 4-H Club</h1>
      </header>
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
    </div>
  );
}

export default App
