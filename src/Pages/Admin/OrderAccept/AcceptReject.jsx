import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdminLayout from '../AdminPanel/AdminLayout';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './AcceptReject.scss';
import Loader from '../../../Components/Loader/Loader';

const AcceptReject = () => {
  const [orders, setOrders] = useState([]);
  const [rejectedOrders, setRejectedOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [approvingOrder, setApprovingOrder] = useState(null); // Separate state for approve
  const [rejectingOrder, setRejectingOrder] = useState(null); // Separate state for reject
  const [activeTab, setActiveTab] = useState('pending');
  const [rejectionReasons, setRejectionReasons] = useState({});
  const [pendingOrderCount, setPendingOrderCount] = useState(0);


  // Make sure you have ToastContainer somewhere in your app (typically in App.js)
  // If not, add: <ToastContainer position="top-right" autoClose={5000} />

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
      const pendingOrders = response.data.filter(order =>
        order?.order_status === 'PENDING'
      );
      setOrders(pendingOrders || []);
      setPendingOrderCount(pendingOrders.length); // Add this line
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
      const response = await axios.get(`${import.meta.env.VITE_SERVER_API}/orders/rejected`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setRejectedOrders(response.data || []);

      // Create a map of rejection reasons if available in the response
      const reasons = {};
      response.data?.forEach(order => {
        if (order?.rejection_reason) {
          reasons[order.order_id] = order.rejection_reason;
        }
      });
      setRejectionReasons(reasons);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching rejected orders:', error);
      toast.error('Failed to load rejected orders');
      setLoading(false);
    }
  };

  const handleApprove = async (orderId) => {
    try {
      setApprovingOrder(orderId); // Only set approving state
      const token = localStorage.getItem('token');
      const encodedOrderId = encodeURIComponent(orderId);
      await axios.get(`${import.meta.env.VITE_SERVER_API}/approve-order/${encodedOrderId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      toast.success('Order approved successfully!', {
        position: "top-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
      fetchPendingOrders();
    } catch (error) {
      console.error('Error approving order:', error);
      toast.error(error.response?.data?.error || 'Failed to approve order', {
        position: "top-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    } finally {
      setApprovingOrder(null);
    }
  };

  const handleReject = async (orderId) => {
    try {
      setRejectingOrder(orderId); // Only set rejecting state
      const token = localStorage.getItem('token');
      const encodedOrderId = encodeURIComponent(orderId);
      await axios.delete(`${import.meta.env.VITE_SERVER_API}/reject-order/${encodedOrderId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      toast.success('Order rejected successfully!', {
        position: "top-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
      fetchPendingOrders();
    } catch (error) {
      console.error('Error rejecting order:', error);
      toast.error(error.response?.data?.error || 'Failed to reject order', {
        position: "top-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    } finally {
      setRejectingOrder(null);
    }
  };

  const formatDate = (dateString) => {
    try {
      const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
      return new Date(dateString).toLocaleDateString('en-US', options);
    } catch (e) {
      return 'Invalid date';
    }
  };

  const formatCurrency = (amount) => {
    try {
      return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount || 0);
    } catch (e) {
      return '₹0.00';
    }
  };

  const getOrderStatusClass = (status) => {
    if (!status) return '';
    const statusStr = String(status).toLowerCase();
    if (statusStr === 'pending') return 'pending';
    if (statusStr === 'rejected') return 'rejected';
    return '';
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

    if (!orders || orders.length === 0) {
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
            key={order?.order_id || Math.random()}
            className={`order-card ${selectedOrder === order?.order_id ? 'expanded' : ''}`}
            onClick={() => setSelectedOrder(selectedOrder === order?.order_id ? null : order?.order_id)}
          >
            <div className="order-header">
              <div className="order-id">Order {order?.order_id || 'N/A'}</div>
              <div className="order-date">{formatDate(order?.created_at)}</div>
              <div className="order-amount">{formatCurrency(order?.total_amount)}</div>
              <div className={`order-status ${getOrderStatusClass(order?.order_status)}`}>
                {order?.order_status || 'UNKNOWN'}
              </div>
              <div className={`payment-type ${order?.payment_type || 'unknown'}`}>
                {order?.payment_type ? order.payment_type.toUpperCase() : 'N/A'}
              </div>
            </div>

            <div className="order-details">
              {!showActions && rejectionReasons[order?.order_id] && (
                <div className="rejection-reason">
                  <h3>Rejection Reason</h3>
                  <div className="reason-box">
                    {rejectionReasons[order.order_id] || 'No reason provided'}
                  </div>
                </div>
              )}

              <div className="customer-section">
                <h3>Customer Details</h3>
                <p><strong>Customer ID:</strong> {order?.customer_id || 'N/A'}</p>
                <p><strong>Delivery Address:</strong></p>
                <div className="address-box">
                  <p>{order?.address?.name || 'N/A'}</p>
                  <p>{order?.address?.address_line || ''}, {order?.address?.locality || ''}</p>
                  <p>{order?.address?.city || ''}, {order?.address?.state?.name || ''} - {order?.address?.pincode || ''}</p>
                  <p><strong>Phone:</strong> {order?.address?.mobile || 'N/A'}</p>
                </div>
              </div>

              <div className="items-section">
                <h3>Order Items ({order?.total_items || 0})</h3>
                <div className="items-grid">
                  {(order?.items || []).map((item, index) => (
                    <div key={index} className="item-card">
                      <div className="item-image">
                        {item?.image_url ? (
                          <img
                            src={`${import.meta.env.VITE_SERVER_API}/${item.image_url.replace(/^\/+/, '')}`}
                            alt="Product"
                          />
                        ) : (
                          <div className="no-image">No Image</div>
                        )}
                      </div>
                      <div className="item-details">
                        <p><strong>Product ID:</strong> {item?.product_id || 'N/A'}</p>
                        <p><strong>Model Id:</strong> {item?.model_id || 'N/A'}</p>
                        <p><strong>Qty:</strong> {item?.quantity || 0}</p>
                        <p><strong>Price:</strong> {formatCurrency(item?.unit_price)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="summary-section">
                <h3>Order Summary</h3>
                <div className="summary-grid">
                  <div className="summary-row">
                    <span>Payment Method:</span>
                    <span className={`payment-method ${order?.payment_type || 'unknown'}`}>
                      {order?.payment_type ?
                        order.payment_type === 'cod' ? 'Cash on Delivery' :
                          order.payment_type === 'upi' ? 'UPI Payment' :
                            order.payment_type === 'bank_transfer' ? 'Bank Transfer' :
                              order.payment_type.toUpperCase()
                        : 'N/A'}
                    </span>
                  </div>
                  <div className="summary-row">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(order?.subtotal)}</span>
                  </div>
                  <div className="summary-row">
                    <span>Discount ({order?.discount_percent || 0}%):</span>
                    <span>-{formatCurrency((order?.subtotal || 0) * ((order?.discount_percent || 0) / 100))}</span>
                  </div>
                  <div className="summary-row">
                    <span>Tax ({order?.tax_percent || 0}%):</span>
                    <span>{formatCurrency(((order?.subtotal || 0) - ((order?.subtotal || 0) * ((order?.discount_percent || 0) / 100)) * ((order?.tax_percent || 0) / 100)))}</span>
                  </div>
                  <div className="summary-row">
                    <span>Delivery Charge:</span>
                    <span>{formatCurrency(order?.delivery_charge)}</span>
                  </div>
                  <div className="summary-row total">
                    <span>Total Amount:</span>
                    <span>{formatCurrency(order?.total_amount)}</span>
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
                    if (order?.order_id) handleApprove(order.order_id);
                  }}
                  disabled={approvingOrder === order?.order_id || rejectingOrder === order?.order_id || !order?.order_id}
                >
                  {approvingOrder === order?.order_id ? (
                    <span className="button-spinner">
                      <i className="fas fa-spinner fa-spin"></i>
                    </span>
                  ) : (
                    <i className="fas fa-check-circle"></i>
                  )}
                  {approvingOrder === order?.order_id ? 'Approving...' : 'Approve Order'}
                </button>
                <button
                  className="reject-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (order?.order_id) handleReject(order.order_id);
                  }}
                  disabled={rejectingOrder === order?.order_id || approvingOrder === order?.order_id || !order?.order_id}
                >
                  {rejectingOrder === order?.order_id ? (
                    <span className="button-spinner">
                      <i className="fas fa-spinner fa-spin"></i>
                    </span>
                  ) : (
                    <i className="fas fa-times-circle"></i>
                  )}
                  {rejectingOrder === order?.order_id ? 'Rejecting...' : 'Reject Order'}
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
            {orders.length > 0 && <span className="badge">{orders.length}</span>}
          </div>
          <div
            className={`tab ${activeTab === 'rejected' ? 'active' : ''}`}
            onClick={() => setActiveTab('rejected')}
          >
            <i className="fas fa-times-circle"></i> Rejected Orders
            {rejectedOrders.length > 0 && <span className="badge">{rejectedOrders.length}</span>}
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
            <div className="info-message">
              <i className="fas fa-info-circle"></i>
              <p>These are orders that have been rejected by the admin team.</p>
            </div>
            {renderOrders(rejectedOrders, false)}
          </>
        )}
      </div>

      <ToastContainer
        position="top-center"
        autoClose={2500}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </AdminLayout>
  );
};

export default AcceptReject;