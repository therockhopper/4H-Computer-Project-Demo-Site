import React from 'react';

const ScratchGameViewer = ({ url, title, author }) => {
  return (
    <div className="model-card">
      <div className="card-header">
        <h2>{title}</h2>
      </div>
      <div className="card-body">
        <iframe
          src={url}
          allowtransparency="true"
          width="485"
          height="402"
          allowFullScreen
          title={title}
        ></iframe>
      </div>
      <div className="card-footer">
        <p>Author: {author}</p>
      </div>
    </div>
  );
};


export default ScratchGameViewer;


