import React, { useState, useEffect } from "react";
import {
  FiTrash2,
  FiPlus,
  FiMinus,
  FiChevronRight,
  FiShoppingBag,
  FiX,
} from "react-icons/fi";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Cart.scss";
import { useAuth } from "../../Components/Context/AuthContext";

const Cart = ({ isOpen, onClose }) => {
  const {
    currentUser,
    cartItems,
    addToCart,
    removeFromCart,
    updateCartItemQuantity,
    clearCart,
    getToken
  } = useAuth();

  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ id: null, message: "" });

  useEffect(() => {
    console.log('Current cart itemss:', cartItems);
  }, [cartItems]);
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  const calculateTotals = (items) => {
    const subtotal = items.reduce((sum, item) => sum + ((item.price || 0) * item.quantity), 0);
    return {
      subtotal,
      discount: 0,
      tax: subtotal * 0.1,
      shipping: subtotal > 50 ? 0 : 5.99,
      total: subtotal + (subtotal * 0.1) + (subtotal > 50 ? 0 : 5.99)
    };
  };

  const totals = calculateTotals(cartItems);

  const handleUpdateQuantity = async (item, newQuantity) => {
    if (newQuantity < 1) return;

    try {
      setLoading(true);

      await axios.post(
        `${import.meta.env.VITE_SERVER_API}/cart/updateitem`,
        {
          product_id: item.product_id,
          quantity: newQuantity,
          color_id: item.color_id,
          model_id: item.model_id
        },
        {
          headers: {
            Authorization: `Bearer ${getToken()}`
          },
        }
      );

      updateCartItemQuantity(
        item.product_id,
        item.color,
        item.model,
        newQuantity
      );

      setSnackbar({ id: item.product_id, message: "Quantity updated!" });
      setTimeout(() => setSnackbar({ id: null, message: "" }), 2000);
    } catch (err) {
      console.error("Quantity Update Error:", err.response?.data || err.message);
      setError(err.response?.data?.error || "Failed to update quantity");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveItem = async (item) => {
    try {
      setLoading(true);

      await axios.post(
        `${import.meta.env.VITE_SERVER_API}/cart/deleteitem`,
        {
          product_id: item.product_id,
          color_id: item.color_id,
          model_id: item.model_id
        },
        {
          headers: { Authorization: `Bearer ${getToken()}` },
        }
      );

      removeFromCart(item.product_id, item.color, item.model);
    } catch (err) {
      console.error("Remove Item Error:", err.response?.data || err.message);
      setError(err.response?.data?.error || "Failed to remove item");
    } finally {
      setLoading(false);
    }
  };

  const handleClearCart = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);

      await axios.delete(`${import.meta.env.VITE_SERVER_API}/cart/clear`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });

      clearCart();
    } catch (err) {
      console.error("Clear Cart Error:", err.response?.data || err.message);
      setError(err.response?.data?.error || "Failed to clear cart");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="cart-overlay" onClick={onClose} />
      <div className="cart-container">
        <div className="cart-content">
          <div className="cart-header">
            <h2>Your Cart ({cartItems.length})</h2>
            <div className="header-actions">
    {cartItems.length > 0 && (
      <button className="clear-cart-btn" onClick={handleClearCart}>
        Clear Cart
      </button>
    )}
            <button className="close-cart" onClick={onClose}>
              <FiX size={24} />
            </button>
          </div>
          </div>

          {loading ? (
            <div className="loading-state">Loading cart...</div>
          ) : error ? (
            <div className="error-state">{error}</div>
          ) : cartItems.length > 0 ? (
            <>
              <div className="cart-items">
                {cartItems.map((item) => (
                  <div
                    key={`${item.product_id}-${item.color || 'none'}-${item.model || 'none'}`}
                    className="cart-item"
                  >
                    <img
                      src={`${import.meta.env.VITE_SERVER_API}/static/${item.image}`}
                      alt={item.name}
                      className="product-image"
                      // onError={(e) => (e.target.src = "/fallback-image.jpg")}
                    />
                    <div className="product-info">
                      <h3>{item.name}</h3>
                      {item.color && <p>Color: {item.color}</p>}
                      {item.model && <p>Model: {item.model}</p>}
                      <div className="price">${(item.price || 0).toFixed(2)}</div>
                      <div className="quantity-controls">
                        <button
                          onClick={() => handleUpdateQuantity(item, item.quantity - 1)}
                          className="quantity-btn"
                          disabled={item.quantity <= 1}
                        >
                          <FiMinus size={14} />
                        </button>
                        <span className="quantity">{item.quantity}</span>
                        <button
                          onClick={() => handleUpdateQuantity(item, item.quantity + 1)}
                          className="quantity-btn"
                        >
                          <FiPlus size={14} />
                        </button>
                      </div>
                      {snackbar.id === item.product_id && (
                        <div className="item-snackbar">{snackbar.message}</div>
                      )}
                    </div>
                    <button
                      className="remove-btn"
                      onClick={() => handleRemoveItem(item)}
                    >
                      <FiTrash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="cart-summary">
                <div className="summary-row">
                  <span>Subtotal</span>
                  <span>${totals.subtotal.toFixed(2)}</span>
                </div>
                {totals.discount > 0 && (
                  <div className="summary-row">
                    <span>Discount</span>
                    <span>-${totals.discount.toFixed(2)}</span>
                  </div>
                )}
                {totals.tax > 0 && (
                  <div className="summary-row">
                    <span>Tax</span>
                    <span>${totals.tax.toFixed(2)}</span>
                  </div>
                )}
                {totals.shipping > 0 && (
                  <div className="summary-row">
                    <span>Shipping</span>
                    <span>${totals.shipping.toFixed(2)}</span>
                  </div>
                )}
                <div className="summary-row total">
                  <span>Total</span>
                  <span>${totals.total.toFixed(2)}</span>
                </div>
                <button
                  className="checkout-btn"
                  onClick={() => navigate("/checkout")}
                >
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