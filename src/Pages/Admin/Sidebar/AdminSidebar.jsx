import { FiMenu, FiX, FiHome, FiBox, FiPackage, FiShoppingCart, FiCreditCard, FiSettings } from 'react-icons/fi';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './AdminSidebar.scss';

const AdminSidebar = ({ isOpen, toggleSidebar, isMobile }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { path: '/admindashboard', name: 'Dashboard', icon: <FiHome /> },
    { path: '/addproducts', name: 'List Products', icon: <FiBox /> },
    { path: '/admininventory', name: 'Inventory', icon: <FiPackage /> },
    { path: '/adminorders', name: 'Orders', icon: <FiShoppingCart /> },
    { path: '/admininpayment', name: 'Payments', icon: <FiCreditCard /> },
    { path: '/adminsetting', name: 'Settings', icon: <FiSettings /> },
  ];

  const handleNavClick = (path) => {
    if (isMobile) {
      toggleSidebar();
      setTimeout(() => navigate(path), 300);
    }
  };

  return (
    <aside className={`admin-sidebar ${isOpen ? 'open' : 'closed'} ${isMobile ? 'mobile' : ''}`}>
      <div className="sidebar-header">
        <button className="toggle-btn" onClick={toggleSidebar}>
          {isOpen ? <FiX size={20} /> : <FiMenu size={20} />}
        </button>
        {isOpen && <h2 className="sidebar-title">Admin Panel</h2>}
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

export default AdminSidebar;