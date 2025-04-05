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
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [cartData, setCartData] = useState({
    cart_id: null,
    items: [],
    pricing: {
      subtotal: 0,
      discount: 0,
      tax: 0,
      shipping: 0,
      total: 0
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ id: null, message: "" });

  const fetchCart = async () => {
    if (!currentUser) return;

    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(
        `${import.meta.env.VITE_SERVER_API}/cart/getbycustid`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      console.log("Cart API Response:", response.data);

      // Handle both empty cart and populated cart cases
      if (response.data.success) {
        const cart = response.data.cart || {
          cart_id: null,
          customer_id: currentUser.customer_id,
          items: [],
          pricing: {
            subtotal: 0,
            discount: 0,
            tax: 0,
            shipping: 0,
            total: 0
          }
        };

        // Ensure items array exists and has proper structure
        const items = cart.items?.map((item) => ({
          ...item,
          product: {
            ...item.product,
            name: item.product?.name || "Unnamed Product",
            rating: item.product?.rating || 0
          },
          color: item.color || null,
          model: item.model || null,
          quantity: item.quantity || 1,
          unit_price: item.unit_price || 0,
          total_item_price: item.total_item_price || 0
        })) || [];

        setCartData({
          cart_id: cart.cart_id,
          items: items,
          pricing: cart.pricing || {
            subtotal: items.reduce((sum, item) => sum + item.total_item_price, 0),
            discount: 0,
            tax: 0,
            shipping: 0,
            total: items.reduce((sum, item) => sum + item.total_item_price, 0)
          }
        });
      }
    } catch (err) {
      console.error("Cart Fetch Error:", err.response?.data || err.message);
      setError(err.response?.data?.error || "Failed to load cart");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, [currentUser]);

  if (!isOpen) return null;

  const updateQuantity = async (itemId, newQuantity) => {
    if (!currentUser || newQuantity < 1) return;

    try {
      await axios.post(
        `${import.meta.env.VITE_SERVER_API}/cart/updateitem`,
        { 
          product_id: itemId, 
          quantity: newQuantity 
        },
        {
          headers: { 
            Authorization: `Bearer ${localStorage.getItem("token")}` 
          },
        }
      );

      // Update local state
      setCartData(prev => ({
        ...prev,
        items: prev.items.map(item => 
          item.product.product_id === itemId
            ? { 
                ...item, 
                quantity: newQuantity,
                total_item_price: item.unit_price * newQuantity
              }
            : item
        )
      }));

      // Recalculate totals
      setCartData(prev => {
        const subtotal = prev.items.reduce(
          (sum, item) => sum + (item.unit_price * (item.product.product_id === itemId ? newQuantity : item.quantity)),
          0
        );
        return {
          ...prev,
          pricing: {
            ...prev.pricing,
            subtotal,
            total: subtotal - prev.pricing.discount + prev.pricing.tax + prev.pricing.shipping
          }
        };
      });

      setSnackbar({ id: itemId, message: "Quantity updated!" });
      setTimeout(() => setSnackbar({ id: null, message: "" }), 2000);
    } catch (err) {
      console.error("Quantity Update Error:", err.response?.data || err.message);
      setError(err.response?.data?.error || "Failed to update quantity");
    }
  };

  const removeItem = async (itemId) => {
    if (!currentUser) return;

    try {
      await axios.post(
        `${import.meta.env.VITE_SERVER_API}/cart/deleteitem`,
        { product_id: itemId },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      // Update local state
      setCartData(prev => {
        const filteredItems = prev.items.filter(item => item.product.product_id !== itemId);
        const subtotal = filteredItems.reduce((sum, item) => sum + item.total_item_price, 0);
        return {
          ...prev,
          items: filteredItems,
          pricing: {
            ...prev.pricing,
            subtotal,
            total: subtotal - prev.pricing.discount + prev.pricing.tax + prev.pricing.shipping
          }
        };
      });
    } catch (err) {
      console.error("Remove Item Error:", err.response?.data || err.message);
      setError(err.response?.data?.error || "Failed to remove item");
    }
  };

  const clearCart = async () => {
    if (!currentUser) return;

    try {
      // This would require a proper endpoint on your backend
      await axios.delete(`${import.meta.env.VITE_SERVER_API}/cart/clear`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      setCartData({
        cart_id: null,
        items: [],
        pricing: {
          subtotal: 0,
          discount: 0,
          tax: 0,
          shipping: 0,
          total: 0
        }
      });
    } catch (err) {
      console.error("Clear Cart Error:", err.response?.data || err.message);
      setError(err.response?.data?.error || "Failed to clear cart");
    }
  };

  return (
    <>
      <div className="cart-overlay" onClick={onClose} />
      <div className="cart-container">
        <div className="cart-content">
          <div className="cart-header">
            <h2>Your Cart ({cartData.items.length})</h2>
            <button className="close-cart" onClick={onClose}>
              <FiX size={24} />
            </button>
          </div>

          {loading ? (
            <div className="loading-state">Loading cart...</div>
          ) : error ? (
            <div className="error-state">{error}</div>
          ) : cartData.items.length > 0 ? (
            <>
              <div className="cart-items">
                {cartData.items.map((item) => (
                  <div key={`${item.product.product_id}-${item.color?.color_id || '0'}-${item.model?.model_id || '0'}`} className="cart-item">
                    <img
                      // src={item.product.image_url}
                      src={`${import.meta.env.VITE_SERVER_API}/static/${item.product.image_url}`}
                      alt={item.product.name}
                      className="product-image"
                      // onError={(e) => (e.target.src = "/fallback-image.jpg")}
                    />
                    <div className="product-info">
                      <h3>{item.product.name}</h3>
                      {item.color && <p>Color: {item.color.name}</p>}
                      {item.model && <p>Model: {item.model.name}</p>}
                      <div className="price">${item.unit_price.toFixed(2)}</div>
                      <div className="quantity-controls">
                        <button
                          onClick={() => updateQuantity(item.product.product_id, item.quantity - 1)}
                          className="quantity-btn"
                          disabled={item.quantity <= 1}
                        >
                          <FiMinus size={14} />
                        </button>
                        <span className="quantity">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product.product_id, item.quantity + 1)}
                          className="quantity-btn"
                        >
                          <FiPlus size={14} />
                        </button>
                      </div>
                      {snackbar.id === item.product.product_id && (
                        <div className="item-snackbar">{snackbar.message}</div>
                      )}
                    </div>
                    <button 
                      className="remove-btn" 
                      onClick={() => removeItem(item.product.product_id)}
                    >
                      <FiTrash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="cart-summary">
                <div className="summary-row">
                  <span>Subtotal</span>
                  <span>${cartData.pricing.subtotal.toFixed(2)}</span>
                </div>
                {cartData.pricing.discount > 0 && (
                  <div className="summary-row">
                    <span>Discount</span>
                    <span>-${cartData.pricing.discount.toFixed(2)}</span>
                  </div>
                )}
                {cartData.pricing.tax > 0 && (
                  <div className="summary-row">
                    <span>Tax</span>
                    <span>${cartData.pricing.tax.toFixed(2)}</span>
                  </div>
                )}
                {cartData.pricing.shipping > 0 && (
                  <div className="summary-row">
                    <span>Shipping</span>
                    <span>${cartData.pricing.shipping.toFixed(2)}</span>
                  </div>
                )}
                <div className="summary-row total">
                  <span>Total</span>
                  <span>${cartData.pricing.total.toFixed(2)}</span>
                </div>
                <button 
                  className="checkout-btn" 
                  onClick={() => navigate("/checkout")}
                >
                  Checkout Now
                  <FiChevronRight size={18} />
                </button>
                <button className="clear-cart-btn" onClick={clearCart}>
                  Clear Cart
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