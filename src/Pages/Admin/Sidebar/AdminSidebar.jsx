import {
  FiMenu,
  FiX,
  FiHome,
  FiBox,
  FiPackage,
  FiShoppingCart,
  FiCreditCard,
  FiSettings,
  FiClipboard,
  FiLayers,
  FiEdit,
  FiList,
  FiFileText
} from 'react-icons/fi'; import { Link, useLocation, useNavigate } from 'react-router-dom';
import './AdminSidebar.scss';

const AdminSidebar = ({ isOpen, toggleSidebar, isMobile }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { path: '/admindashboard', name: 'Dashboard', icon: <FiHome /> },
    { path: '/addproducts', name: 'List Products', icon: <FiList /> },             // listing icon
    { path: '/updateproducts', name: 'Update Products', icon: <FiEdit /> },        // edit icon
    { path: '/categoryupdate', name: 'Category & Hsn', icon: <FiLayers /> },       // layers icon for categories
    { path: '/admininventory', name: 'Inventory Manage', icon: <FiPackage /> },    // box/package
    { path: '/createorders', name: 'Offline Order', icon: <FiClipboard /> },       // clipboard for manual entry
    { path: '/adminorders', name: 'Orders', icon: <FiShoppingCart /> },            // shopping cart
    { path: '/srnumbermanage', name: 'SR Number Manage', icon: <FiFileText /> },   // document/serial
    { path: '/orderdetails', name: 'Order Details', icon: <FiCreditCard /> },      // credit card/payment
    { path: '/offers', name: 'Product Offers ', icon: <FiLayers /> },      // credit card/payment
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