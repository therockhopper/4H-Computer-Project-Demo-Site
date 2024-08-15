import React from 'react';
import { StlViewer } from "react-stl-viewer";

const STLModelViewer = ({ stlPath, title, description }) => {
  return (
    <div className="model-container">
      <div className="viewer">
        <StlViewer
          url={stlPath}
          width={400}
          height={400}
          modelcolor="#0055ff"
          backgroundcolor="#f0f0f0"
          rotate="true"
          orbitControls={true}
          cameraposition={{ x: 0, y: 0, z: 100 }}
        />
      </div>
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  );
};

export default STLModelViewer;

