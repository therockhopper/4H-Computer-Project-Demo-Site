import React from 'react';

const ScratchGameViewer = ({ url, title, author }) => {
  return (
    <div className="model-card">
      <div className="card-body" style={{ padding: 0, background: '#1d5c3a' }}>
        <span className="card-type">Scratch Game</span>
        <div className="scratch-wrapper">
          <iframe
            src={url}
            allowtransparency="true"
            allowFullScreen
            title={title}
          ></iframe>
        </div>
      </div>
      <div className="card-info">
        <div className="card-name">{title}</div>
        <div className="card-author">{author}</div>
      </div>
    </div>
  );
};

export default ScratchGameViewer;
