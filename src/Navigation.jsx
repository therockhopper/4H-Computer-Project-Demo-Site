import { Link } from 'react-router-dom';
import './Navigation.css';

/**
 * Links to the other years' showcases. Add a year here when its page exists;
 * the current page's own entry is filtered out, and the nav disappears entirely
 * while there is only one year, rather than rendering an empty bar.
 */
const YEARS = [{ id: '2026', label: '2026 Projects', icon: '⭐', path: '/2026' }];

const Navigation = ({ currentPage }) => {
  const others = YEARS.filter((y) => y.id !== currentPage);
  if (others.length === 0) return null;

  return (
    <nav className="navigation">
      {others.map((year) => (
        <Link key={year.id} to={year.path} className="nav-button">
          <span className="nav-icon">{year.icon}</span>
          <span className="nav-text">{year.label}</span>
        </Link>
      ))}
    </nav>
  );
};

export default Navigation;
