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
import FallbackImage from "../../assets/Logo/logo.jpg";

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
    console.log('Current cart items:', cartItems);
  }, [cartItems]);


  // In your Cart component (likely Cart.jsx), add this useEffect:
  useEffect(() => {
    const handleOpenCart = (e) => {
      setIsOpen(e.detail?.open ?? true); // Open the cart when event is received
    };

    window.addEventListener('openCart', handleOpenCart);

    return () => {
      window.removeEventListener('openCart', handleOpenCart);
    };
  }, []);

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
    const originalSubtotal = items.reduce((sum, item) => sum + ((item.original_price || item.price) * item.quantity), 0);
    const discount = originalSubtotal - subtotal;

    return {
      subtotal,
      discount,
      originalSubtotal,
      total: subtotal
    };
  };

  const getImageUrl = (image) => {
    console.log('Raw image data received:', image); // Log the raw input

    if (!image) {
      console.log('No image provided');
      return null;
    }

    // Handle cases where image might be an object with different properties
    if (typeof image === 'object') {
      console.log('Image is an object, keys:', Object.keys(image));
      image = image.url || image.path || image.image_url || image.filename;
    }

    // If it's already a full URL (starts with http), use as is
    if (image?.startsWith('http')) {
      console.log('Using full URL:', image);
      return image;
    }
    // If it starts with / (like /product_images/...), prepend server URL
    else if (image?.startsWith('/')) {
      const cleanPath = image.replace(/^\//, '');
      const url = `${import.meta.env.VITE_SERVER_API}/static/${cleanPath}`;
      console.log('Constructed URL from path:', url);
      return url;
    }
    // Otherwise, assume it's just a filename
    else if (image) {
      const url = `${import.meta.env.VITE_SERVER_API}/static/${image}`;
      console.log('Constructed URL from filename:', url);
      return url;
    }

    console.log('No valid image format found');
    return null;
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
                {cartItems.map((item) => {
                  const originalPrice = item.original_price || item.price;
                  const hasDiscount = originalPrice > item.price;
                  // const imageUrl = `${import.meta.env.VITE_SERVER_API}/static/${item.image}`;
                  const imageUrl = getImageUrl(item.image);
                  console.log('Final image URL for product:', item.name, 'is:', imageUrl);
                  const isVideo = item.image && /\.(mp4)$/i.test(item.image);

                  return (
                    <div
                      key={`${item.product_id}-${item.color || 'none'}-${item.model || 'none'}`}
                      className="cart-item"
                    >
                      <div className="product-image-container">
                        {imageUrl ? (
                          isVideo ? (
                            <video
                              className="media"
                              src={imageUrl}
                              autoPlay
                              muted
                              loop
                              playsInline
                              controls
                            />
                          ) : (
                            <img
                              className="media"
                              src={imageUrl}
                              alt={item.name}
                              loading="lazy"
                              onError={(e) => {
                                console.error("Image failed to load for:", imageUrl);
                                e.target.src = { FallbackImage };
                              }}
                            />
                          )
                        ) : (
                          <div className="media-placeholder">
                            <FiShoppingBag size={24} />
                          </div>
                        )}
                      </div>
                      <div className="product-info">
                        <h3>{item.name}</h3>
                        {item.model && <p>{item.model}</p>}
                        <div className="price-container">
                          {hasDiscount ? (
                            <>
                              <span className="original-price">
                                ₹{originalPrice.toFixed(2)}
                              </span>
                              <span className="discounted-price">
                                ₹{(item.price || 0).toFixed(2)}
                              </span>
                              <span className="discount-badge">
                                Save ₹{(originalPrice - item.price).toFixed(2)}
                              </span>
                            </>
                          ) : (
                            <span className="price">
                              ₹{(item.price || 0).toFixed(2)}
                            </span>
                          )}
                        </div>
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
                  );
                })}
              </div>

              <div className="cart-summary">
                {totals.originalSubtotal > totals.subtotal && (
                  <div className="summary-row original-price-row">
                    <span>Original Price</span>
                    <span>₹{totals.originalSubtotal.toFixed(2)}</span>
                  </div>
                )}
                {totals.discount > 0 && (
                  <div className="summary-row discount-row">
                    <span>Discount</span>
                    <span>-₹{totals.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="summary-row">
                  <span>Subtotal</span>
                  <span>₹{totals.subtotal.toFixed(2)}</span>
                </div>
                <div className="summary-row total">
                  <span>Total</span>
                  <span>₹{totals.total.toFixed(2)}</span>
                </div>
                <button
                  className="checkout-btn"
                  onClick={() => {
                    console.log("Items being sent to checkout:", cartItems);
                    onClose();
                    navigate("/checkout", { state: { cartItems } });
                  }}
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