import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Lottie from 'lottie-react';
import './OrderConfirm.scss';

const OrderConfirm = () => {
  const [orderData, setOrderData] = useState(null);
  const [countdown, setCountdown] = useState(10);
  const navigate = useNavigate();
  const [animationData, setAnimationData] = useState(null);

  useEffect(() => {
    // Fetch animation data from URL
    fetch('https://assets1.lottiefiles.com/packages/lf20_raiw2hpe.json')
      .then(response => response.json())
      .then(data => setAnimationData(data))
      .catch(error => console.error('Error loading animation:', error));

    const data = sessionStorage.getItem('orderInfo');
    if (data) {
      setOrderData(JSON.parse(data));
      sessionStorage.removeItem('orderInfo');
    }

    // Set up countdown timer
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  return (
    <div className="order-confirm-container">
      <div className="order-card">
        <div className="animation-wrapper">
          {animationData ? (
            <Lottie 
              animationData={animationData} 
              loop={true} 
              className="lottie-animation" 
            />
          ) : (
            <div className="loading-animation-placeholder">
              <div className="spinner"></div>
            </div>
          )}
        </div>
        <h1 className="thank-you">Thank you for your order!</h1>
        <p className="confirmation-text">
          We're processing your order and will notify you once it's confirmed.
        </p>
        <p className="countdown-text">
          Redirecting to home in {countdown} seconds...
        </p>
        {orderData && (
          <div className="order-details">
            <p><strong>Order ID:</strong> {orderData.order._id}</p>
            <p><strong>Shipping Address:</strong> {orderData.address?.full_address}</p>
          </div>
        )}
        <button className="home-btn" onClick={() => navigate('/')}>
          Back to Home Now
        </button>
      </div>
    </div>
  );
};

export default OrderConfirm;