// Navbar.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import './Navbar.scss';
import Logo from '../../assets/Logo/logo.png';
import { RiAccountPinCircleFill, RiLoginCircleFill, RiLogoutCircleFill } from 'react-icons/ri';
import { FiShoppingCart } from 'react-icons/fi';
import { useAuth } from '../Context/AuthContext';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLogoClick = () => {
    navigate('/');
    setIsMenuOpen(false);
  };

  const handleAccountClick = () => {
    navigate(isAuthenticated ? '/profile' : '/login');
    setIsMenuOpen(false);
  };

  const handleLogoutClick = () => {
    logout();
    navigate('/');
  };

  const handleCartClick = () => {
    navigate('/cart');
    setIsMenuOpen(false);
  };

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
            {/* <li><a href="/" onClick={() => setIsMenuOpen(false)}>Home</a></li> */}
            {/* <li><a href="/contact" onClick={() => setIsMenuOpen(false)}>Contact</a></li> */}
          </ul>

          <div className="nav-icons">
            <div className="nav-cart" onClick={handleCartClick}>
              <FiShoppingCart className="cart-icon" />
              <span className="cart-count">0</span>
            </div>

            {isAuthenticated ? (
              <>
                <RiAccountPinCircleFill className="account-icon" onClick={handleAccountClick} />
                <RiLogoutCircleFill className="logout-icon" onClick={handleLogoutClick} />
              </>
            ) : (
              <RiLoginCircleFill className="login-icon" onClick={handleAccountClick} />
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;