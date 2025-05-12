import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Lottie from 'lottie-react';
import './OrderConfirm.scss';

const OrderConfirm = () => {
  const [orderData, setOrderData] = useState(null);
  const [countdown, setCountdown] = useState(30);
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
      const parsedData = JSON.parse(data);
      setOrderData(parsedData);
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

  // Function to format the address
  const formatAddress = (address) => {
    if (!address) return '';
    return `
      ${address.name}, 
      ${address.address_line}, 
      ${address.locality}, 
      ${address.city}, 
      ${address.state} - ${address.pincode}
      Mobile: ${address.mobile}
      ${address.landmark ? `Landmark: ${address.landmark}` : ''}
    `;
  };

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
        
        {orderData && (
          <div className="order-details-section">
            <div className="order-info">
              <h3>Order Information</h3>
              <p><strong>Order ID:</strong> {orderData.order?.order_id || 'N/A'}</p>
              <p><strong>Order Date:</strong> {new Date(orderData.order?.created_at).toLocaleString()}</p>
            </div>
            
            <div className="shipping-info">
              <h3>Shipping Address</h3>
              <div className="address-block">
                {orderData.address ? (
                  <>
                    <p><strong>{orderData.address.name}</strong></p>
                    <p>{orderData.address.address_line}</p>
                    <p>{orderData.address.locality}</p>
                    <p>{orderData.address.city}, {orderData.address.state} - {orderData.address.pincode}</p>
                    <p>Mobile: {orderData.address.mobile}</p>
                    {orderData.address.landmark && <p>Landmark: {orderData.address.landmark}</p>}
                  </>
                ) : (
                  <p>No shipping address available</p>
                )}
              </div>
            </div>
          </div>
        )}
        
        <p className="countdown-text">
          Redirecting to home in {countdown} seconds...
        </p>
        
        <button className="home-btn" onClick={() => navigate('/')}>
          Back to Home Now
        </button>
      </div>
    </div>
  );
};

export default OrderConfirm;