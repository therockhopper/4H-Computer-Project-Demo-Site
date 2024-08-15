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
    title: 'Spider Hat',
    description: 'Sterling Morrison',
  },
  // {
  //   stlPath: '/models/BrodyRobinson/.stl',
  //   title: 'Brody Robinson',
  //   description: '',
  // }
];

function App() {
  const refreshPage = () => {
    window.location.reload();
  };
  return (
    <div>
      <header>
        <h1>4H Computer Project - Port Hood Island View 4-H Club</h1>
      </header>
      <section className="about-section">
        <h2>About Our 3D Models</h2>
        <p>
          The 3D models displayed on our site were created by the talented members of the Port Hood Island View 4-H Club using a variety of CAD (Computer-Aided Design) software tools, including Tinkercad and Blender. These platforms empower our members to bring their creative ideas to life through detailed and precise digital modeling.
        </p>
        <h3>The Process:</h3>
        <ul>
          <li>
            <strong>Conceptualization:</strong> Each model begins with an idea. Our members brainstorm out their concepts, considering the shapes, structures, and details they want to include.
          </li>
          <li>
            <strong>Design in CAD Software:</strong> Depending on the complexity and requirements of the design, members choose the most suitable CAD software. Tinkercad, with its intuitive drag-and-drop interface, is ideal for straightforward designs, while Blender offers advanced features for more intricate and detailed modeling. However, any CAD software could be used depending on the needs and preferences of the designer.
          </li>
          <li>
            <strong>Refinement:</strong> After the initial design is complete, members refine their models, ensuring all parts fit together correctly and that the model is structurally sound. Details such as textures, colors, and additional features are added to enhance the final product.
          </li>
          <li>
            <strong>Review and Feedback:</strong> Models are then reviewed by peers and mentors, who provide feedback on both design and functionality. This collaborative step helps improve the overall quality and accuracy of the models.
          </li>
          <li>
            <strong>Finalization:</strong> Once the model is polished and approved, it’s exported in STL or other suitable formats, making it compatible with 3D printers and viewers like the one used on this site.
          </li>
        </ul>
        <hr />
        <p>
          <strong>Resetting the Models:</strong>
          To help you explore the models anew, we’ve included a Reset button located at the bottom right of your screen. Clicking this button will refresh the entire page, resetting all the models to their original positions and states. This feature is perfect for starting over or reloading the models if you’ve made adjustments or interacted with them in any way. Feel free to use it whenever you want to reset the viewing experience!
        </p>
      </section>
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
      <button className="refresh-button" onClick={refreshPage}>Reset</button>
    </div>
  );
}

export default App
