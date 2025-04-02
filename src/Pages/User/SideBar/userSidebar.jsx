import { FiMenu, FiX, FiHome, FiMapPin, FiShoppingBag, FiHeart, FiShoppingCart, FiStar, FiHelpCircle } from 'react-icons/fi';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './UserSidebar.scss';

const UserSidebar = ({ isOpen, toggleSidebar, isMobile }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { path: '/userdashboard', name: 'Dashboard', icon: <FiHome /> },
    { path: '/address', name: 'Address', icon: <FiMapPin /> },
    { path: '/userorders', name: 'Orders', icon: <FiShoppingBag /> },
    { path: '/wishlist', name: 'Wishlist', icon: <FiHeart /> },
    { path: '/cart', name: 'Cart', icon: <FiShoppingCart /> },
    { path: '/randr', name: 'Reviews & Ratings', icon: <FiStar /> },
    { path: '/support', name: 'Support', icon: <FiHelpCircle /> },
  ];

  const handleNavClick = (path) => {
    if (isMobile) {
      toggleSidebar();
      setTimeout(() => navigate(path), 300);
    }
  };

  return (
    <aside className={`user-sidebar ${isOpen ? 'open' : 'closed'} ${isMobile ? 'mobile' : ''}`}>
      <div className="sidebar-header">
        <button className="toggle-btn" onClick={toggleSidebar}>
          {isOpen ? <FiX size={20} /> : <FiMenu size={20} />}
        </button>
        {isOpen && <h2 className="sidebar-title">My Account</h2>}
      </div>
      
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <Link 
            to={item.path} 
            key={item.path}
            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            onClick={() => handleNavClick(item.path)}
          >
            <span className="nav-icon">{item.icon}</span>
            {isOpen && <span className="nav-text">{item.name}</span>}
            {!isOpen && <span className="tooltip">{item.name}</span>}
          </Link>
        ))}
      </nav>
    </aside>
  );
};

export default UserSidebar;