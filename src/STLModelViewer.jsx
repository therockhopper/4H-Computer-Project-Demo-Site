import React from 'react';
import { StlViewer } from "react-stl-viewer";


const style = {
  width: '100%',
  height: '400px',
};

const STLModelViewer = ({ stlPath, title, description }) => {
  return (
    <div className="model-container">
      <div className="viewer">
        <StlViewer
          url={stlPath}
          width={400}
          height={400}
          modelColor="#0055ff"
          backgroundColor="#f0f0f0"
          rotate={true}
          orbitControls={true}
          cameraPosition={{ x: 0, y: 0, z: 100 }}
        />
      </div>
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  );
};

export default STLModelViewer;

