import React, { useState, useEffect } from 'react';
import UserLayout from '../../User/UserPanel/UserLayout';
import { useParams, useNavigate } from 'react-router-dom';
import './UserOrderDetails.scss';
import Loader from "../../../Components/Loader/Loader";
import { FaStar, FaRegStar, FaCheck, FaTruck, FaBoxOpen, FaThumbsUp, FaCreditCard } from 'react-icons/fa';

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
  const [trackingData, setTrackingData] = useState(null);
  const [trackingError, setTrackingError] = useState(null);

  useEffect(() => {
    console.log('UserOrderDetails component mounted with orderId:', orderId);
    const fetchOrderDetails = async () => {
      try {
        console.log(`Fetching order details for order: ${orderId}`);
        const response = await fetch(
          `${import.meta.env.VITE_SERVER_API}/order/${encodeURIComponent(orderId)}/items`
        );

        if (!response.ok) {
          console.error('Order details fetch failed', response.status, response.statusText);
          throw new Error('Order not found');
        }

        const data = await response.json();
        console.log('Received order details:', data);

        setOrder({
          ...data,
          items: data.items.map(item => ({
            ...item,
            product_image: item.product_image?.startsWith('http')
              ? item.product_image
              : `${import.meta.env.VITE_SERVER_API}${item.product_image}`
          }))
        });
      } catch (err) {
        console.error('Error fetching order details:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId]);

  useEffect(() => {
    if (order && order.order_status?.toUpperCase() === 'APPROVED') {
      console.log('Order is approved, fetching tracking data');
      const fetchTrackingData = async () => {
        try {
          const token = localStorage.getItem('token');
          if (!token) {
            console.warn('No token available for tracking data');
            return;
          }

          const response = await fetch(
            `${import.meta.env.VITE_SERVER_API}/order/${encodeURIComponent(orderId)}/track`,
            {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            }
          );

          if (!response.ok) {
            console.error('Tracking data fetch failed', response.status, response.statusText);
            throw new Error('Tracking data not available');
          }

          const data = await response.json();
          console.log('Received tracking data:', data);
          
          if (data.ShipmentData?.[0]?.Shipment) {
            setTrackingData(data.ShipmentData[0].Shipment);
          } else {
            console.warn('No shipment data in response');
            setTrackingError('No tracking information available');
          }
        } catch (err) {
          console.error('Failed to fetch tracking data:', err);
          setTrackingError(err.message);
        }
      };

      fetchTrackingData();
    }
  }, [order, orderId]);

  const getStatusBadge = (orderStatus, deliveryStatus) => {
    const status = orderStatus?.toUpperCase();
    const delivery = deliveryStatus?.toLowerCase();

    console.log(`getStatusBadge called with orderStatus: ${status}, deliveryStatus: ${delivery}`);

    if (status === 'PENDING') {
      return <span className="status-badge pending-approval">Waiting Approval</span>;
    }

    if (status === 'REJECTED') {
      return <span className="status-badge pending-approval">Rejected</span>;
    }

    if (status === 'APPROVED') {
      switch (delivery) {
        case 'delivered': return <span className="status-badge delivered">Delivered</span>;
        case 'shipped': return <span className="status-badge shipped">Shipped</span>;
        case 'processing': return <span className="status-badge processing">Processing</span>;
        case 'cancelled': return <span className="status-badge cancelled">Cancelled</span>;
        default: return <span className="status-badge confirmed">Order Confirmed</span>;
      }
    }

    return <span className="status-badge pending">Pending</span>;
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const handleReviewClick = (product) => {
    console.log('Opening review modal for product:', product.product_id);
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
    try {
      console.log('Submitting review for product:', selectedProduct.product_id);
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
        console.error('Review submission failed', response.status, response.statusText);
        throw new Error('Failed to submit review');
      }

      console.log('Review submitted successfully');
      setShowReviewModal(false);
    } catch (err) {
      console.error('Error submitting review:', err);
      setSubmitError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const OrderStepper = ({ orderStatus, deliveryStatus, trackingData }) => {
    const status = orderStatus?.toUpperCase();
    const delivery = deliveryStatus?.toLowerCase();

    console.log('OrderStepper rendering with:', {
      orderStatus: status,
      deliveryStatus: delivery,
      trackingData: trackingData
    });

    // Check tracking data for shipped/delivered status
    const isShipped = trackingData?.Scans?.some(scan => 
      scan.ScanDetail?.Scan === 'In Transit' || 
      scan.ScanDetail?.Scan === 'Dispatched'
    );

    const isDelivered = trackingData?.Scans?.some(scan => 
      scan.ScanDetail?.Scan === 'Delivered'
    );

    console.log('Tracking states:', { isShipped, isDelivered });

    const steps = [
      {
        id: 1,
        name: 'Order Placed',
        icon: <FaCreditCard />,
        active: true,
        completed: true
      },
      {
        id: 2,
        name: status === 'PENDING' ? 'Waiting Approval' : 'Approved',
        icon: status === 'PENDING' ? <FaThumbsUp /> : <FaCheck />,
        active: status === 'PENDING',
        completed: status === 'APPROVED'
      },
      {
        id: 3,
        name: 'Processing',
        icon: <FaBoxOpen />,
        active: status === 'APPROVED' && ['processing', 'shipped', 'delivered'].includes(delivery),
        completed: isShipped || ['shipped', 'delivered'].includes(delivery)
      },
      {
        id: 4,
        name: 'Shipped',
        icon: <FaTruck />,
        active: isShipped || delivery === 'shipped',
        completed: isDelivered || delivery === 'delivered'
      },
      {
        id: 5,
        name: 'Delivered',
        icon: <FaCheck />,
        active: isDelivered || delivery === 'delivered',
        completed: isDelivered || delivery === 'delivered'
      }
    ];

    console.log('Stepper steps:', steps);

    return (
      <div className="order-stepper">
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            <div className={`step ${step.active ? 'active' : ''} ${step.completed ? 'completed' : ''}`}>
              <div className="step-icon">{step.icon}</div>
              <div className="step-name">{step.name}</div>
            </div>
            {index < steps.length - 1 && (
              <div className={`connector ${steps[index + 1].completed ? 'completed' : ''}`}></div>
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };

  if (loading) return <UserLayout><Loader /></UserLayout>;
  if (error) return (
    <UserLayout>
      <div className="user-order-details-container">
        <div className="orders-error">
          <p>Error: {error}</p>
          <button className="back-btn" onClick={() => navigate(-1)}>Back to Orders</button>
        </div>
      </div>
    </UserLayout>
  );

  if (!order) return (
    <UserLayout>
      <div className="user-order-details-container">
        <div className="no-orders">
          <h3>Order Not Found</h3>
          <p>The requested order could not be loaded.</p>
          <button className="back-btn" onClick={() => navigate(-1)}>Back to Orders</button>
        </div>
      </div>
    </UserLayout>
  );

  return (
    <UserLayout>
      <div className="user-order-wrapper">
        <button className="user-order-back-btn" onClick={() => navigate(-1)}>
          &larr; Back to Orders
        </button>

        <h1 className="user-order-title">Order Details #{order.order_id}</h1>

        <div className="user-order-main-card">
          <div className="user-order-card-header">
            <div className="user-order-meta">
              <span className="user-order-id">Order #{order.order_id}</span>
              <span className="user-order-date">Placed on {formatDate(order.created_at)}</span>
            </div>
            <div className="user-order-status">
              {getStatusBadge(order.order_status, order.delivery_status)}
            </div>
          </div>

          <div className="user-order-items-list">
            {order.items?.map((item, index) => (
              <div key={index} className="user-order-item">
                <div className="user-order-item-image">
                  <img
                    src={item.product_image}
                    alt={item.product_name}
                    onError={(e) => e.target.src = '/images/placeholder-product.jpg'}
                  />
                </div>
                <div className="user-order-item-details">
                  <h4 className="user-order-item-name">{item.product_name}</h4>
                  <p className="user-order-item-price">₹{item.unit_price?.toFixed(2)}</p>
                  <div className="user-order-item-meta">
                    <span className="user-order-item-qty">Qty: {item.quantity}</span>
                    {item.model && <span className="user-order-item-model">Model: {item.model}</span>}
                  </div>
                  {order.delivery_status?.toLowerCase() === 'delivered' && (
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

          <div className="order-stepper-container">
            <OrderStepper
              orderStatus={order.order_status}
              deliveryStatus={order.delivery_status}
              trackingData={trackingData}
            />
          </div>

          {/* {trackingError && (
            <div className="tracking-error-notice">
              <p>Note: {trackingError}</p>
            </div>
          )} */}
        </div>

        {showReviewModal && selectedProduct && (
          <div className="user-order-review-modal-overlay">
            <div className="user-order-review-modal">
              <div className="user-order-modal-header">
                <div className="user-order-modal-product-info">
                  <img
                    src={selectedProduct.product_image}
                    alt={selectedProduct.product_name}
                    className="user-order-modal-product-image"
                    onError={(e) => e.target.src = '/images/placeholder-product.jpg'}
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