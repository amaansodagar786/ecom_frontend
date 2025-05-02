import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Lottie from 'lottie-react';
import orderanimation from "../../assets/Animations/orderconfirm.json";
import './OrderConfirm.scss';

const OrderConfirm = () => {
  const [orderData, setOrderData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const data = sessionStorage.getItem('orderInfo');
    if (data) {
      setOrderData(JSON.parse(data));
      sessionStorage.removeItem('orderInfo');
    }
  }, []);

  return (
    <div className="order-confirm-container">
      <div className="order-card">
        <div className="animation-wrapper">
          <Lottie animationData={orderanimation} loop={true} className="lottie-animation" />
        </div>
        <h1 className="thank-you">Thank you for your order!</h1>
        <p className="confirmation-text">Your order has been placed successfully.</p>
        {orderData && (
          <div className="order-details">
            <p><strong>Order ID:</strong> {orderData.order._id}</p>
            <p><strong>Shipping Address:</strong> {orderData.address?.full_address}</p>
          </div>
        )}
        <button className="home-btn" onClick={() => navigate('/')}>
          Back to Home
        </button>
      </div>
    </div>
  );
};

export default OrderConfirm;
