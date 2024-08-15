import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

import STLModelViewer from './STLModelViewer';

const models = [
  {
    stlPath: '/models/EmmetMcNabb/Emmett4HProject1.stl',
    title: 'Emmett McNabb',
    description: 'Description for Model 1',
  },
  {
    stlPath: '/models/EmmetMcNabb/Emmetts4HProject2.stl',
    title: 'Emmett McNabb',
    description: 'Description for Model 2',
  },
  {
    stlPath: '/models/SamuelWatts/SamBoat.stl',
    title: 'Samuel Watts',
    description: 'Boat',
  },
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
