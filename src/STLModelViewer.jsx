import React from 'react';
import { StlViewer } from 'react-stl-viewer';

const style = {
  width: '100%',
  height: '400px', // Increased height
};


const STLModelViewer = ({ stlPath, title, description }) => {
  return (
    <div className="model-card">
      <div className="card-header">
        <h2>{title}</h2>
      </div>
      <div className="card-body">

        <StlViewer

          style={style}
          url={stlPath}
          modelcolor="#0055ff"
          backgroundcolor="#f0f0f0"
          rotate="true"
          shadows
          orbitControls
          showAxes
          cameraposition={{ x: 0, y: 0, z: 100 }}
        />
      </div>
      <div className="card-footer">
        <p>{description}</p>
      </div>
    </div>
  );
};

export default STLModelViewer;



