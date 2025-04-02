import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Navbar.scss';
import Logo from '../../assets/Logo/logo.png';
import { 
  FiShoppingCart, 
  FiHeart, 
  FiUser,
  FiLogIn,
  FiLogOut 
} from 'react-icons/fi';
import { useAuth } from '../Context/AuthContext';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  const handleLogoClick = () => navigate('/');
  const handleAccountClick = () => navigate(isAuthenticated ? '/profile' : '/login');
  const handleLogoutClick = () => { logout(); navigate('/'); };
  const handleCartClick = () => navigate('/cart');
  const handleWishlistClick = () => navigate('/wishlist');

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-logo" onClick={handleLogoClick}>
          <img src={Logo} alt="Company Logo" />
        </div>

        <div className={`hamburger ${isMenuOpen ? 'open' : ''}`} onClick={toggleMenu}>
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
        </div>

        <div className={`nav-links ${isMenuOpen ? 'active' : ''}`}>
          <ul>
            {/* Navigation links can be added here */}
          </ul>

          <div className="nav-icons">
            <div className="nav-icon" onClick={handleWishlistClick}>
              <FiHeart className="icon" />
            </div>
            
            <div className="nav-icon nav-cart" onClick={handleCartClick}>
              <FiShoppingCart className="icon" />
              <span className="cart-count">0</span>
            </div>

            {isAuthenticated ? (
              <>
                <div className="nav-icon" onClick={handleAccountClick}>
                  <FiUser className="icon" />
                </div>
                <div className="nav-icon" onClick={handleLogoutClick}>
                  <FiLogOut className="icon" />
                </div>
              </>
            ) : (
              <div className="nav-icon" onClick={handleAccountClick}>
                <FiLogIn className="icon" />
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;