import { Link } from 'react-router-dom';

const Navigation = ({ currentPage }) => {
  const buttonStyle = {
    padding: '12px 24px',
    fontSize: '18px',
    fontWeight: 'bold',
    textDecoration: 'none',
    backgroundColor: '#339966',
    color: 'white',
    borderRadius: '8px',
    display: 'inline-block',
    border: '2px solid #339966',
    transition: 'all 0.3s ease',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    marginRight: '15px'
  };

  const handleMouseOver = (e) => {
    e.target.style.backgroundColor = 'white';
    e.target.style.color = '#339966';
  };

  const handleMouseOut = (e) => {
    e.target.style.backgroundColor = '#339966';
    e.target.style.color = 'white';
  };

  return (
    <nav style={{ margin: '20px 0' }}>
      {currentPage !== 'home' && (
        <Link
          to="/"
          style={buttonStyle}
          onMouseOver={handleMouseOver}
          onMouseOut={handleMouseOut}
        >
          🏠 Home
        </Link>
      )}
      
      {currentPage !== '2024' && (
        <Link
          to="/2024"
          style={buttonStyle}
          onMouseOver={handleMouseOver}
          onMouseOut={handleMouseOut}
        >
          📅 2024 Projects
        </Link>
      )}
      
      {currentPage !== '2025' && (
        <Link
          to="/2025"
          style={buttonStyle}
          onMouseOver={handleMouseOver}
          onMouseOut={handleMouseOut}
        >
          🚀 2025 Projects
        </Link>
      )}
    </nav>
  );
};

export default Navigation;