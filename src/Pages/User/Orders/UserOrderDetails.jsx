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
        
        // Log image URLs for debugging
        console.log('Order items with images:', data.items.map(item => ({
          product_id: item.product_id,
          image_url: item.product_image
        })));
        
        setOrder({
          ...data,
          items: data.items.map(item => ({
            ...item,
            // Prepend server URL if the image path is relative
            product_image: item.product_image 
              ? item.product_image.startsWith('http')
                ? item.product_image
                : `${import.meta.env.VITE_SERVER_API}${item.product_image}`
              : '/images/placeholder-product.jpg'
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
      <div className="user-order-wrapper">
        <button className="user-order-back-btn" onClick={() => navigate(-1)}>
          &larr; Back to Orders
        </button>
        
        <h1 className="user-order-title">Order Details {order.order_id}</h1>
        
        <div className="user-order-main-card">
          <div className="user-order-card-header">
            <div className="user-order-meta">
              <span className="user-order-id">Order {order.order_id}</span>
              <span className="user-order-date">Placed on {formatDate(order.created_at)}</span>
            </div>
            <div className="user-order-status">
              {getStatusBadge(order.delivery_status)}
            </div>
          </div>

          <div className="user-order-items-list">
            {order.items?.map((item, index) => (
              <div key={index} className="user-order-item">
                <div className="user-order-item-image">
                  <img 
                    src={item.product_image} 
                    alt={item.product_name}
                    onError={(e) => {
                      e.target.src = '/images/placeholder-product.jpg';
                    }}
                  />
                </div>
                <div className="user-order-item-details">
                  <h4 className="user-order-item-name">{item.product_name}</h4>
                  <p className="user-order-item-price">₹{item.unit_price?.toFixed(2)}</p>
                  <div className="user-order-item-meta">
                    <span className="user-order-item-qty">Qty: {item.quantity}</span>
                    {item.model && <span className="user-order-item-model">Model: {item.model}</span>}
                    {/* {item.color && <span className="user-order-item-color">Color: {item.color}</span>} */}
                  </div>
                  {order.delivery_status?.toLowerCase() === 'pending' && (
                    <button 
                      className="user-order-review-btn"
                      onClick={() => handleReviewClick(item)}
                    >
                      Rate & Review
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="user-order-summary">
            <div className="user-order-total">
              <span>Total ({order.total_items} items):</span>
              <span className="user-order-total-amount">₹{order.total_amount?.toFixed(2)}</span>
            </div>
            <div className="user-order-payment-status">
              <span>Payment Status:</span>
              <span className={`user-order-status-${order.payment_status}`}>
                {order.payment_status}
              </span>
            </div>
          </div>
        </div>

        {/* Review Modal */}
        {showReviewModal && selectedProduct && (
          <div className="user-order-review-modal-overlay">
            <div className="user-order-review-modal">
              <div className="user-order-modal-header">
                <div className="user-order-modal-product-info">
                  <img 
                    src={selectedProduct.product_image} 
                    alt={selectedProduct.product_name}
                    className="user-order-modal-product-image"
                    onError={(e) => {
                      e.target.src = '/images/placeholder-product.jpg';
                    }}
                  />
                  <h3>{selectedProduct.product_name}</h3>
                </div>
                <button 
                  className="user-order-modal-close-btn"
                  onClick={() => setShowReviewModal(false)}
                >
                  &times;
                </button>
              </div>
              
              <div className="user-order-rating-section">
                <div className="user-order-rating-stars">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span 
                      key={star}
                      className="user-order-rating-star"
                      onClick={() => setRating(star)}
                    >
                      {star <= rating ? <FaStar /> : <FaRegStar />}
                    </span>
                  ))}
                </div>
                <p className="user-order-rating-text">
                  {rating === 0 ? 'Select rating' : 
                   rating === 1 ? 'Poor' :
                   rating === 2 ? 'Fair' :
                   rating === 3 ? 'Good' :
                   rating === 4 ? 'Very Good' : 'Excellent'}
                </p>
              </div>
              
              <div className="user-order-review-section">
                <label htmlFor="user-order-review-text">Your Review (Optional)</label>
                <textarea
                  id="user-order-review-text"
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Share your experience with this product..."
                  rows={4}
                />
              </div>
              
              {submitError && <p className="user-order-error-message">{submitError}</p>}
              
              <div className="user-order-modal-actions">
                <button
                  className="user-order-modal-cancel-btn"
                  onClick={() => setShowReviewModal(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  className="user-order-modal-submit-btn"
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