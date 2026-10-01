import './App.css';

import AnimationViewer from './AnimationViewer';

const featured = {
  title: 'Cat Makes: Season 2',
  author: 'Sterling Morrison',
  videoPath: '/2026/animations/Cat makes_ season 2.mp4',
};

function Project26ProShow() {
  return (
    <div>
      <header>
        <div className="year-badge">Port Hood Island View · 2026 Pro Show</div>
        <h1>4H Computer Project <em>Showcase</em></h1>
        <p className="header-sub">Pro Show selection</p>
      </header>

      <div className="page-wrap">
        <div className="section-head">
          <h2 className="section-title">Animation</h2>
        </div>
        <div className="section-rule"></div>
        <div className="pro-show-feature">
          <AnimationViewer
            videoPath={featured.videoPath}
            title={featured.title}
            author={featured.author}
          />
        </div>

        <div className="qr-code-section">
          <img src='/qr.png' alt="QR Code" className="qr-code" />
          <p className="qr-code-description">Scan to view this site on your phone.</p>
        </div>

        <button className="refresh-button" onClick={() => window.location.reload()}>
          Reset
        </button>
      </div>
    </div>
  );
}

export default Project26ProShow;
