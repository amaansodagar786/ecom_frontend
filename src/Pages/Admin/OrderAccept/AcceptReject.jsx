import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdminLayout from '../AdminPanel/AdminLayout';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './AcceptReject.scss';

const AcceptReject = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    fetchPendingOrders();
  }, []);

  const fetchPendingOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${import.meta.env.VITE_SERVER_API}/orders`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const pendingOrders = response.data.filter(order => order.order_status === 'PENDING');
      setOrders(pendingOrders);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
      setLoading(false);
    }
  };

  const handleApprove = async (orderId) => {
    try {
      const token = localStorage.getItem('token');
      const encodedOrderId = encodeURIComponent(orderId); // Encode the order ID
      await axios.get(`${import.meta.env.VITE_SERVER_API}/approve-order/${encodedOrderId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      toast.success('Order approved successfully!');
      fetchPendingOrders();
    } catch (error) {
      console.error('Error approving order:', error);
      toast.error(error.response?.data?.error || 'Failed to approve order');
    }
  };

  const handleReject = async (orderId) => {
    try {
      const token = localStorage.getItem('token');
      const encodedOrderId = encodeURIComponent(orderId); // Encode the order ID
      await axios.delete(`${import.meta.env.VITE_SERVER_API}/reject-order/${encodedOrderId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      toast.success('Order rejected successfully!');
      fetchPendingOrders();
    } catch (error) {
      console.error('Error rejecting order:', error);
      toast.error(error.response?.data?.error || 'Failed to reject order');
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
  };

  return (<AdminLayout> <div className="order-approval-container"> <h1 className="page-title">Pending Order Approvals</h1>

  
    {loading ? (
      <div className="loading-spinner">
        <div className="spinner"></div>
        <p>Loading orders...</p>
      </div>
    ) : orders.length === 0 ? (
      <div className="no-orders">
        <i className="fas fa-check-circle"></i>
        <p>No pending orders to review</p>
      </div>
    ) : (
      <div className="orders-grid">
        {orders.map(order => (
          <div
            key={order.order_id}
            className={`order-card ${selectedOrder === order.order_id ? 'expanded' : ''}`}
            onClick={() => setSelectedOrder(selectedOrder === order.order_id ? null : order.order_id)}
          >
            <div className="order-header">
              <div className="order-id">Order #{order.order_id}</div>
              <div className="order-date">{formatDate(order.created_at)}</div>
              <div className="order-amount">{formatCurrency(order.total_amount)}</div>
              <div className="order-status pending">{order.order_status}</div>
            </div>

            <div className="order-details">
              <div className="customer-section">
                <h3>Customer Details</h3>
                <p><strong>Customer ID:</strong> {order.customer_id}</p>
                <p><strong>Delivery Address:</strong></p>
                <div className="address-box">
                  <p>{order.address.name}</p>
                  <p>{order.address.address_line}, {order.address.locality}</p>
                  <p>{order.address.city}, {order.address.state.name} - {order.address.pincode}</p>
                  <p><strong>Phone:</strong> {order.address.mobile}</p>
                </div>
              </div>

              <div className="items-section">
                <h3>Order Items ({order.total_items})</h3>
                <div className="items-grid">
                  {order.items.map((item, index) => {
                    // console.log('Image URL:', item.image_url); // ✅ Console log added here
                    return (
                      <div key={index} className="item-card">
                        <div className="item-image">
                          {item.image_url ? (
                            <>
                              {console.log('Image URL:', `${import.meta.env.VITE_SERVER_API}/${item.image_url.replace(/^\/+/, '')}`)}
                              <img
                                src={`${import.meta.env.VITE_SERVER_API}/${item.image_url.replace(/^\/+/, '')}`}
                                alt="Product"
                              />
                            </>
                          ) : (
                            <div className="no-image">No Image</div>
                          )}
                        </div>
                        <div className="item-details">
                          <p><strong>Product ID:</strong> {item.product_id}</p>
                          <p><strong>Model Id:</strong> {item.model_id}</p>
                          {/* <p><strong>Color:</strong> {item.color_id}</p> */}
                          <p><strong>Qty:</strong> {item.quantity}</p>
                          <p><strong>Price:</strong> {formatCurrency(item.unit_price)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="summary-section">
                <h3>Order Summary</h3>
                <div className="summary-grid">
                  <div className="summary-row">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(order.subtotal)}</span>
                  </div>
                  <div className="summary-row">
                    <span>Discount ({order.discount_percent}%):</span>
                    <span>-{formatCurrency(order.subtotal * (order.discount_percent / 100))}</span>
                  </div>
                  <div className="summary-row">
                    <span>Tax ({order.tax_percent}%):</span>
                    <span>{formatCurrency((order.subtotal - (order.subtotal * (order.discount_percent / 100))) * (order.tax_percent / 100))}</span>
                  </div>
                  <div className="summary-row">
                    <span>Delivery Charge:</span>
                    <span>{formatCurrency(order.delivery_charge)}</span>
                  </div>
                  <div className="summary-row total">
                    <span>Total Amount:</span>
                    <span>{formatCurrency(order.total_amount)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="action-buttons">
              <button
                className="approve-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleApprove(order.order_id);
                }}
              >
                <i className="fas fa-check-circle"></i> Approve Order
              </button>
              <button
                className="reject-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleReject(order.order_id);
                }}
              >
                <i className="fas fa-times-circle"></i> Reject Order
              </button>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
  </AdminLayout>


  );
};

export default AcceptReject;


