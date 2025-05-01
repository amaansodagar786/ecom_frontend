import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '../AdminPanel/AdminLayout';
import './ShowOrders.scss';

const ShowOrders = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [orderItems, setOrderItems] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_SERVER_API}/orders/${orderId}/details-expanded`);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data || !data.details) {
          throw new Error('Invalid order data structure');
        }
  
        setOrder({
          order_id: data.order_id,
          customer_id: data.customer_id,
          total_amount: data.total_amount || 0,
          subtotal: data.subtotal || 0,
          payment_status: data.payment_status,
          fulfillment_status: data.fulfillment_status,
          delivery_status: data.delivery_status,
          created_at: data.created_at
        });
        
        setOrderItems(data.details || []);
      } catch (error) {
        console.error('Error fetching order details:', error);
        setError(error.message || 'Failed to fetch order details');
      } finally {
        setLoading(false);
      }
    };
  
    fetchOrderDetails();
  }, [orderId]);

  const formatIST = (utcDate) => {
    if (!utcDate) return 'N/A';
    const date = new Date(utcDate);
    return date.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="loading">Loading order details...</div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="error">Error: {error}</div>
      </AdminLayout>
    );
  }

  if (!order) {
    return (
      <AdminLayout>
        <div className="error">Order not found</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="order-details-container">
        <button className="back-button" onClick={() => navigate('/adminorders')}>
          &larr; Back to Orders
        </button>
        
        <div className="order-header">
          <h1>Order #{order.order_id || 'N/A'}</h1>
          <div className="order-meta">
            <span>Date: {formatIST(order.created_at)}</span>
            <span>Customer ID: {order.customer_id || 'N/A'}</span>
            <span>Total Items: {orderItems.length}</span>
            <span>Total Amount: ₹{(order.total_amount || 0).toFixed(2)}</span>
            <span className={`status-badge ${order.payment_status}`}>
              Payment: {order.payment_status || 'N/A'}
            </span>
            <span className={`status-badge ${order.fulfillment_status}`}>
              Fulfillment: {order.fulfillment_status || 'N/A'}
            </span>
            <span className={`status-badge ${order.delivery_status}`}>
              Delivery: {order.delivery_status || 'N/A'}
            </span>
          </div>
        </div>

        <div className="items-container">
          <h2>Order Items</h2>
          {orderItems.length > 0 ? (
            <table className="items-table">
              <thead>
                <tr>
                  <th>SR No</th>
                  <th>Product</th>
                  <th>Variant</th>
                  <th>Price</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {orderItems.map((item) => (
                  <tr key={`${item.detail_id}-${item.sr_no}`}>
                    <td>{item.sr_no}</td>
                    <td>
                      <div className="product-info">
                        <span className="product-name">{item.product_name || `Product ${item.product_id}`}</span>
                        <span className="product-id">ID: {item.product_id}</span>
                      </div>
                    </td>
                    <td>
                      {item.model_name && <div>Model: {item.model_name}</div>}
                      {item.color_name && <div>Color: {item.color_name}</div>}
                    </td>
                    <td>₹{(item.unit_price || 0).toFixed(2)}</td>
                    <td>
                      <span className={`status-badge ${item.status || 'fulfilled'}`}>
                        {item.status || 'Fulfilled'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="no-items">No items found in this order</div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default ShowOrders;