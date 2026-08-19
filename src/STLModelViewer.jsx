import React from 'react';
import { StlViewer } from 'react-stl-viewer';

const style = { width: '100%', height: '100%' };

const STLModelViewer = ({ stlPath, title, description }) => {
  return (
    <div className="model-card">
      <div className="card-body stl-viewer-body">
        <span className="card-type">STL Model</span>
        <StlViewer
          style={style}
          url={stlPath}
          modelcolor="#0055ff"
          backgroundcolor="#e8f5ed"
          rotate="true"
          shadows
          orbitControls
          showAxes
          cameraposition={{ x: 0, y: 0, z: 100 }}
        />
      </div>
      <div className="card-info">
        <div className="card-name">{title}</div>
        <div className="card-author">{description}</div>
      </div>
    </div>
  );
};

export default STLModelViewer;
