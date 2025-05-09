import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdminLayout from '../AdminPanel/AdminLayout';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './AcceptReject.scss';
import Loader from '../../../Components/Loader/Loader';

const AcceptReject = () => {
  const [orders, setOrders] = useState([]);
  const [rejectedOrders, setRejectedOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [processingOrder, setProcessingOrder] = useState(null);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' or 'rejected'

  useEffect(() => {
    if (activeTab === 'pending') {
      fetchPendingOrders();
    } else {
      fetchRejectedOrders();
    }
  }, [activeTab]);

  const fetchPendingOrders = async () => {
    try {
      setLoading(true);
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

  const fetchRejectedOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${import.meta.env.VITE_SERVER_API}/orders`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const rejectedOrders = response.data.filter(order => order.order_status === 'REJECTED');
      setRejectedOrders(rejectedOrders);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching rejected orders:', error);
      toast.error('Failed to load rejected orders');
      setLoading(false);
    }
  };

  const handleApprove = async (orderId) => {
    try {
      setProcessingOrder(orderId);
      const token = localStorage.getItem('token');
      const encodedOrderId = encodeURIComponent(orderId);
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
    } finally {
      setProcessingOrder(null);
    }
  };

  const handleReject = async (orderId) => {
    try {
      setProcessingOrder(orderId);
      const token = localStorage.getItem('token');
      const encodedOrderId = encodeURIComponent(orderId);
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
    } finally {
      setProcessingOrder(null);
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
  };

  const renderOrders = (orders, showActions = true) => {
    if (loading) {
      return (
        <div className="loading-spinner">
          <Loader />
          <p>Loading orders...</p>
        </div>
      );
    }

    if (orders.length === 0) {
      return (
        <div className="no-orders">
          <i className="fas fa-check-circle"></i>
          <p>No orders found</p>
        </div>
      );
    }

    return (
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
              <div className={`order-status ${order.order_status.toLowerCase()}`}>
                {order.order_status}
              </div>
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
                  {order.items.map((item, index) => (
                    <div key={index} className="item-card">
                      <div className="item-image">
                        {item.image_url ? (
                          <img
                            src={`${import.meta.env.VITE_SERVER_API}/${item.image_url.replace(/^\/+/, '')}`}
                            alt="Product"
                          />
                        ) : (
                          <div className="no-image">No Image</div>
                        )}
                      </div>
                      <div className="item-details">
                        <p><strong>Product ID:</strong> {item.product_id}</p>
                        <p><strong>Model Id:</strong> {item.model_id}</p>
                        <p><strong>Qty:</strong> {item.quantity}</p>
                        <p><strong>Price:</strong> {formatCurrency(item.unit_price)}</p>
                      </div>
                    </div>
                  ))}
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

            {showActions && (
              <div className="action-buttons">
                <button
                  className="approve-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleApprove(order.order_id);
                  }}
                  disabled={processingOrder === order.order_id}
                >
                  {processingOrder === order.order_id && (
                    <span className="button-spinner">
                      <i className="fas fa-spinner fa-spin"></i>
                    </span>
                  )}
                  <i className="fas fa-check-circle"></i> 
                  {processingOrder === order.order_id ? 'Approving...' : 'Approve Order'}
                </button>
                <button
                  className="reject-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleReject(order.order_id);
                  }}
                  disabled={processingOrder === order.order_id}
                >
                  {processingOrder === order.order_id && (
                    <span className="button-spinner">
                      <i className="fas fa-spinner fa-spin"></i>
                    </span>
                  )}
                  <i className="fas fa-times-circle"></i> 
                  {processingOrder === order.order_id ? 'Rejecting...' : 'Reject Order'}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <AdminLayout>
      <div className="order-approval-container">
        <h1 className="page-title">Order Management</h1>
        
        <div className="tabs-container">
          <div 
            className={`tab ${activeTab === 'pending' ? 'active' : ''}`}
            onClick={() => setActiveTab('pending')}
          >
            <i className="fas fa-clock"></i> Pending Orders
          </div>
          <div 
            className={`tab ${activeTab === 'rejected' ? 'active' : ''}`}
            onClick={() => setActiveTab('rejected')}
          >
            <i className="fas fa-times-circle"></i> Rejected Orders
          </div>
        </div>

        {activeTab === 'pending' ? (
          <>
            <h2 className="section-title">Pending Order Approvals</h2>
            {renderOrders(orders, true)}
          </>
        ) : (
          <>
            <h2 className="section-title">Rejected Orders</h2>
            {renderOrders(rejectedOrders, false)}
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default AcceptReject;