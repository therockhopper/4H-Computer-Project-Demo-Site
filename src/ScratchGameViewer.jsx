import React from 'react';

const ScratchGameViewer = ({ url, title, author }) => {
  return (
    <div className="model-card">
      <div className="card-header">
        <h2>{title}</h2>
      </div>
      <div className="card-body" style={{ padding: 0 }}>
        <div className="scratch-wrapper">
          <iframe
            src={url}
            allowtransparency="true"
            allowFullScreen
            title={title}
          ></iframe>
        </div>
      </div>
      <div className="card-footer">
        <p>Author: {author}</p>
      </div>
    </div>
  );
};


export default ScratchGameViewer;


