import React, { useState, useEffect } from 'react';
import UserLayout from '../../User/UserPanel/UserLayout';
import { useParams, useNavigate } from 'react-router-dom';
import './UserOrderDetails.scss';
import Loader from "../../../Components/Loader/Loader";
import { FaStar, FaRegStar } from 'react-icons/fa';

const UserOrderDetails = () => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        const encodedOrderId = encodeURIComponent(orderId);
        const response = await fetch(
          `${import.meta.env.VITE_SERVER_API}/order/${encodedOrderId}/items`
        );
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `Order not found (${response.status})`);
        }
        
        const data = await response.json();
        
        setOrder({
          ...data,
          items: data.items.map(item => ({
            ...item,
            product_image: item.product_image || '/images/placeholder-product.jpg'
          }))
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
  
    fetchOrderDetails();
  }, [orderId]);

  const handleReviewClick = (product) => {
    setSelectedProduct(product);
    setShowReviewModal(true);
    setRating(0);
    setReviewText('');
    setSubmitError(null);
  };

  const handleSubmitReview = async () => {
    if (rating === 0) {
      setSubmitError('Please select a rating');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER_API}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          product_id: selectedProduct.product_id,
          rating: rating,
          description: reviewText
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit review');
      }

      // Close modal and reset form
      setShowReviewModal(false);
      // Optionally: Refresh the order data or show success message
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'delivered':
        return <span className="status-badge delivered">Delivered</span>;
      case 'shipped':
        return <span className="status-badge shipped">Shipped</span>;
      case 'processing':
        return <span className="status-badge processing">Processing</span>;
      case 'cancelled':
        return <span className="status-badge cancelled">Cancelled</span>;
      default:
        return <span className="status-badge pending">Pending</span>;
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (loading) {
    return (
      <UserLayout>
        <Loader />
      </UserLayout>
    );
  }

  if (error) {
    return (
      <UserLayout>
        <div className="user-order-details-container">
          <div className="orders-error">
            <p>Error: {error}</p>
            <button className="back-btn" onClick={() => navigate(-1)}>
              Back to Orders
            </button>
          </div>
        </div>
      </UserLayout>
    );
  }

  if (!order) {
    return (
      <UserLayout>
        <div className="user-order-details-container">
          <div className="no-orders">
            <h3>Order Not Found</h3>
            <p>The requested order could not be loaded.</p>
            <button className="back-btn" onClick={() => navigate(-1)}>
              Back to Orders
            </button>
          </div>
        </div>
      </UserLayout>
    );
  }

  return (
    <UserLayout>
      <div className="user-order-details-container">
        <button className="back-btn" onClick={() => navigate(-1)}>
          &larr; Back to Orders
        </button>
        
        <h1 className="orders-title">Order Details {order.order_id}</h1>
        
        <div className="order-card">
          <div className="order-header">
            <div className="order-meta">
              <span className="order-id">Order {order.order_id}</span>
              <span className="order-date">Placed on {formatDate(order.created_at)}</span>
            </div>
            <div className="order-status">
              {getStatusBadge(order.delivery_status)}
            </div>
          </div>

          <div className="order-items">
            {order.items?.map((item, index) => (
              <div key={index} className="order-item">
                <div className="item-image">
                  <img 
                    src={item.product_image} 
                    alt={item.product_name}
                    onError={(e) => {
                    //   e.target.src = '/images/placeholder-product.jpg';
                    }}
                  />
                </div>
                <div className="item-details">
                  <h4 className="item-name">{item.product_name}</h4>
                  <p className="item-price">₹{item.unit_price?.toFixed(2)}</p>
                  <div className="item-meta">
                    <span className="item-quantity">Qty: {item.quantity}</span>
                    {item.model && <span className="item-model">Model: {item.model}</span>}
                    {item.color && <span className="item-color">Color: {item.color}</span>}
                  </div>
                  {order.delivery_status?.toLowerCase() === 'pending' && (
                    <button 
                      className="review-btn"
                      onClick={() => handleReviewClick(item)}
                    >
                      Rate & Review
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="order-summary">
            <div className="order-total">
              <span>Total ({order.total_items} items):</span>
              <span className="total-amount">₹{order.total_amount?.toFixed(2)}</span>
            </div>
            <div className="payment-status">
              <span>Payment Status:</span>
              <span className={`status-${order.payment_status}`}>
                {order.payment_status}
              </span>
            </div>
          </div>
        </div>

        {/* Review Modal */}
        {showReviewModal && (
          <div className="review-modal-overlay">
            <div className="review-modal">
              <div className="modal-header">
                <h3>Rate {selectedProduct.product_name}</h3>
                <button 
                  className="close-btn"
                  onClick={() => setShowReviewModal(false)}
                >
                  &times;
                </button>
              </div>
              
              <div className="rating-section">
                <div className="stars">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span 
                      key={star}
                      className="star"
                      onClick={() => setRating(star)}
                    >
                      {star <= rating ? <FaStar /> : <FaRegStar />}
                    </span>
                  ))}
                </div>
                <p className="rating-text">
                  {rating === 0 ? 'Select rating' : 
                   rating === 1 ? 'Poor' :
                   rating === 2 ? 'Fair' :
                   rating === 3 ? 'Good' :
                   rating === 4 ? 'Very Good' : 'Excellent'}
                </p>
              </div>
              
              <div className="review-section">
                <label htmlFor="review-text">Your Review (Optional)</label>
                <textarea
                  id="review-text"
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Share your experience with this product..."
                  rows={4}
                />
              </div>
              
              {submitError && <p className="error-message">{submitError}</p>}
              
              <div className="modal-actions">
                <button
                  className="cancel-btn"
                  onClick={() => setShowReviewModal(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  className="submit-btn"
                  onClick={handleSubmitReview}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </UserLayout>
  );
};

export default UserOrderDetails;