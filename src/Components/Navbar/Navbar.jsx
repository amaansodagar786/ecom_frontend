import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Navbar.scss';
import Logo from '../../assets/Logo/logo.png';
import {
  FiShoppingCart,
  FiHeart,
  FiUser,
  FiLogIn,
  FiLogOut,
  FiGrid
} from 'react-icons/fi';
import { useAuth } from '../Context/AuthContext';
import Cart from '../../Pages/Cart/Cart';

const Navbar = () => {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, logout, isAdmin } = useAuth();

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  const handleLogoClick = () => navigate('/');
  const handleAccountClick = () => {
    if (isAuthenticated) {
      navigate(isAdmin ? '/admindashboard' : '/userdashboard');
    } else {
      navigate('/login');
    }
  };
  const handleLogoutClick = () => { logout(); navigate('/'); };
  const handleCartClick = () => setIsCartOpen(true);
  const handleWishlistClick = () => navigate('/wishlist');
  const handleAllProductsClick = () => navigate('/allproducts');

  return (
    <>
      <nav className="navbar">
        <div className="navbar-container">
          {/* Logo */}
          <div className="navbar-logo" onClick={handleLogoClick}>
            <img src={Logo} alt="Company Logo" />
          </div>

          {/* Tagline (Only visible in desktop/laptop) */}
          <div className="navbar-tagline">Your One-Stop For ECommerce Store</div>

          {/* Hamburger Menu (For Mobile) */}
          <div className={`hamburger ${isMenuOpen ? 'open' : ''}`} onClick={toggleMenu}>
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
          </div>

          {/* Navigation Icons */}
          <div className={`nav-links ${isMenuOpen ? 'active' : ''}`}>
            <ul>
              {/* Navigation links can be added here */}
            </ul>

            <div className="nav-icons">
              <div className="nav-icon" onClick={handleAllProductsClick}>
                <FiGrid className="icon" />
              </div>

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
                  <div className="nav-icon nav-auth" onClick={handleLogoutClick}>
                    <FiLogOut className="icon" />
                    <span className="auth-text">Logout</span>
                  </div>
                </>
              ) : (
                <div className="nav-icon nav-auth" onClick={handleAccountClick}>
                  <FiLogIn className="icon" />
                  <span className="auth-text">Login</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
      <Cart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
};

export default Navbar;
