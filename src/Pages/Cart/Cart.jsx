import React, { useState, useEffect } from 'react';
import { FiTrash2, FiPlus, FiMinus, FiChevronRight, FiShoppingBag, FiX } from 'react-icons/fi';
import { useAuth } from '../../Components/Context/AuthContext';
import './Cart.scss';

const Cart = ({ isOpen, onClose }) => {
  const { wishlistItems, toggleWishlistItem } = useAuth();

  // Updated cart data with stock count and original price
  const [cartItems, setCartItems] = useState([
    {
      id: 1,
      name: "Premium Leather Wallet",
      originalPrice: 119.99, // Original price before discount
      price: 89.99, // Discounted price
      image: "/images/wallet.jpg",
      quantity: 1,
      stock: 10 
    },
    {
      id: 2,
      name: "Wireless Headphones",
      originalPrice: 299.99,
      price: 249.99,
      image: "/images/headphones.jpg",
      quantity: 2,
      stock: 5 
    }
  ]);

  const [snackbar, setSnackbar] = useState({ id: null, message: '' });

  // Calculation functions
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalOriginalPrice = cartItems.reduce((sum, item) => sum + (item.originalPrice * item.quantity), 0);
  const discount = totalOriginalPrice - subtotal;
  const total = subtotal; // No shipping, total is just subtotal

  const updateQuantity = (id, newQuantity, stock) => {
    if (newQuantity < 1) {
      showSnackbar(id, "⚠️ Minimum quantity is 1!");
      return;
    }
    if (newQuantity > stock) {
      showSnackbar(id, `⚠️ Only ${stock} items available!`);
      return;
    }
    setCartItems(cartItems.map(item =>
      item.id === id ? { ...item, quantity: newQuantity } : item
    ));
  };

  const removeItem = (id) => {
    setCartItems(cartItems.filter(item => item.id !== id));
  };

  const showSnackbar = (id, message) => {
    setSnackbar({ id, message });
    setTimeout(() => setSnackbar({ id: null, message: '' }), 2000);
  };

  // Prevent body scroll when cart is open
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('cart-open');
    } else {
      document.body.classList.remove('cart-open');
    }
    return () => document.body.classList.remove('cart-open');
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      <div className="cart-overlay" onClick={onClose} />
      <div className="cart-container">
        <div className="cart-content">
          <div className="cart-header">
            <h2>Your Cart ({cartItems.length})</h2>
            <button className="close-cart" onClick={onClose}>
              <FiX size={24} />
            </button>
          </div>

          {cartItems.length > 0 ? (
            <>
              <div className="cart-items">
                {cartItems.map(item => (
                  <div key={item.id} className="cart-item">
                    <img src={item.image} alt={item.name} className="product-image" />
                    <div className="product-info">
                      <h3>{item.name}</h3>
                      <div className="price">
                        <span className="original-price">${item.originalPrice.toFixed(2)}</span>
                        <span className="discounted-price">${item.price.toFixed(2)}</span>
                      </div>
                      <div className="quantity-controls">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1, item.stock)}
                          className="quantity-btn"
                        >
                          <FiMinus size={14} />
                        </button>
                        <span className="quantity">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1, item.stock)}
                          className="quantity-btn"
                        >
                          <FiPlus size={14} />
                        </button>
                      </div>
                      {/* Snackbar inside product */}
                      {snackbar.id === item.id && <div className="item-snackbar">{snackbar.message}</div>}
                    </div>
                    <button
                      className="remove-btn"
                      onClick={() => removeItem(item.id)}
                    >
                      <FiTrash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="cart-summary">
                <div className="summary-row">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="summary-row">
                  <span>Discount</span>
                  <span>-${discount.toFixed(2)}</span>
                </div>
                <div className="summary-row total">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
                <button className="checkout-btn">
                  Checkout Now
                  <FiChevronRight size={18} />
                </button>
              </div>
            </>
          ) : (
            <div className="empty-cart">
              <FiShoppingBag size={48} />
              <p>Your cart is empty</p>
              <button className="continue-shopping-btn" onClick={onClose}>
                Continue Shopping
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Cart;
