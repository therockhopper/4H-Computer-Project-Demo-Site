import { Link } from 'react-router-dom';
import './Navigation.css';

const Navigation = ({ currentPage }) => {
  return (
    <nav className="navigation">
      {currentPage !== '2024' && (
        <Link to="/2024" className="nav-button">
          <span className="nav-icon">📅</span>
          <span className="nav-text">2024 Projects</span>
        </Link>
      )}

      {currentPage !== '2025' && (
        <Link to="/2025" className="nav-button">
          <span className="nav-icon">🚀</span>
          <span className="nav-text">2025 Projects</span>
        </Link>
      )}

      {currentPage !== '2026' && (
        <Link to="/2026" className="nav-button">
          <span className="nav-icon">⭐</span>
          <span className="nav-text">2026 Projects</span>
        </Link>
      )}
    </nav>
  );
};

export default Navigation;