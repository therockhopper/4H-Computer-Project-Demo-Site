import React from 'react';

const PosterViewer = ({ url, title, author, type = 'gif' }) => {
  const renderMedia = () => {
    if (type === 'mp4' || type === 'video') {
      return (
        <video
          src={url}
          controls
          autoPlay
          muted
          loop
          className="poster-media"
          title={title}
        >
          Your browser does not support the video tag.
        </video>
      );
    } else {
      return (
        <img
          src={url}
          alt={title}
          className="poster-media"
          title={title}
        />
      );
    }
  };

  return (
    <div className="poster-card">
      <div className="card-header">
        <h2>{title}</h2>
      </div>
      <div className="poster-body">
        {renderMedia()}
      </div>
      <div className="card-footer">
        <p>Author: {author}</p>
      </div>
    </div>
  );
};

export default PosterViewer;