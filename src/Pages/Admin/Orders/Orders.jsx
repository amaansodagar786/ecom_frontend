import React, { useState, useEffect } from 'react';
import AdminLayout from '../AdminPanel/AdminLayout';
import './Orders.scss';
import { useNavigate } from 'react-router-dom';
import Loader from "../../../Components/Loader/Loader";
import { toast, ToastContainer } from 'react-toastify';
import axios from 'axios';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    orderId: '',
    deliveryStatus: '',
    fulfillment: '',
    channel: '',
    paymentStatus: ''
  });
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [orders, filters]);

  const fetchOrders = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER_API}/orders`);
      const data = await response.json();
      setOrders(data);
      setFilteredOrders(data);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const applyFilters = () => {
    let result = [...orders];

    if (filters.orderId) {
      result = result.filter(order =>
        order.order_id.toLowerCase().includes(filters.orderId.toLowerCase())
      );
    }

    if (filters.deliveryStatus) {
      result = result.filter(order =>
        order.delivery_status.toLowerCase() === filters.deliveryStatus.toLowerCase()
      );
    }

    if (filters.fulfillment) {
      if (filters.fulfillment === 'fulfilled') {
        result = result.filter(order => order.fulfillment_status === 1 || order.fulfillment_status === true);
      } else if (filters.fulfillment === 'pending') {
        result = result.filter(order => order.fulfillment_status === 0 || order.fulfillment_status === false);
      }
    }

    if (filters.channel) {
      result = result.filter(order =>
        order.channel === filters.channel
      );
    }

    if (filters.paymentStatus) {
      result = result.filter(order =>
        order.payment_status.toLowerCase() === filters.paymentStatus.toLowerCase()
      );
    }

    setFilteredOrders(result);
  };

  const clearFilters = () => {
    setFilters({
      orderId: '',
      deliveryStatus: '',
      fulfillment: '',
      channel: '',
      paymentStatus: ''
    });
  };

  const formatIST = (utcDate) => {
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

  const getCustomerName = (order) => {
    if (order.customer_id) {
      return order.address?.name || 'Online Customer';
    }
    return order.address?.name || 'Walk-in Customer';
  };

  const handleOrderIdClick = (order) => {
  if (order.order_status === 'PENDING' || order.order_status === 'REJECTED') {
    setSelectedOrder(order);
    setIsModalOpen(true);
    toast.info('Please accept the order first');
  } else {
    navigate(`/orders/${encodeURIComponent(order.order_id)}`);
  }
};

  const handleStatusClick = (order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedOrder(null);
  };

  const changeOrderStatus = async (newStatus) => {
    if (!selectedOrder) return;

    try {
      setIsProcessing(true);
      const token = localStorage.getItem('token');

      // PROPERLY encode the order ID
      const orderId = encodeURIComponent(selectedOrder.order_id);

      console.log('Order ID being sent:', orderId); // Debug log

      const response = await axios.post(
        `${import.meta.env.VITE_SERVER_API}/change-order-status/${orderId}`,
        { status: newStatus },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          withCredentials: true  // This is crucial for cookies/auth
        }
      );
      console.log('Status change response:', response.data);
      toast.success(`Order status changed to ${newStatus} successfully!`);
      fetchOrders();
      closeModal();
    } catch (error) {
      console.error('Error changing order status:', error);
      toast.error(error.response?.data?.error || `Failed to change status to ${newStatus}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const renderModalContent = () => {
    if (!selectedOrder) return null;

    return (
      <div className="order-details-modal">
        <div className="modal-header">
          <h3>Order Details - {selectedOrder.order_id}</h3>
          <button onClick={closeModal} className="close-modal">
            &times;
          </button>
        </div>

        <div className="modal-body">
          <div className="customer-section">
            <h4>Customer Details</h4>
            <p><strong>Name:</strong> {getCustomerName(selectedOrder)}</p>
            <p><strong>Order Date:</strong> {formatIST(selectedOrder.created_at)}</p>
            <p><strong>Delivery Address:</strong></p>
            <div className="address-box">
              <p>{selectedOrder.address?.address_line || 'N/A'}</p>
              <p>{selectedOrder.address?.locality || ''}, {selectedOrder.address?.city || ''}</p>
              <p>{selectedOrder.address?.state?.name || ''} - {selectedOrder.address?.pincode || ''}</p>
              <p><strong>Phone:</strong> {selectedOrder.address?.mobile || 'N/A'}</p>
            </div>
          </div>

          <div className="items-section">
            <h4>Order Items ({selectedOrder.total_items})</h4>
            <div className="items-grid">
              {selectedOrder.items?.map((item, index) => (
                <div key={index} className="item-card">
                  <div className="item-image">
                    {item?.image_url ? (
                      <img src={`${import.meta.env.VITE_SERVER_API}/${item.image_url.replace(/^\/+/, '')}`} alt="Product" />
                    ) : (
                      <div className="no-image">No Image</div>
                    )}
                  </div>
                  <div className="item-details">
                    <p><strong>Product:</strong> {item?.product_id || 'N/A'}</p>
                    <p><strong>Model:</strong> {item?.model_id || 'N/A'}</p>
                    <p><strong>Qty:</strong> {item?.quantity || 0}</p>
                    <p><strong>Price:</strong> ₹{item?.unit_price?.toFixed(2) || '0.00'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="summary-section">
            <h4>Order Summary</h4>
            <div className="summary-row">
              <span>Subtotal:</span>
              <span>₹{selectedOrder.subtotal?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="summary-row">
             <span>GST ({selectedOrder.tax_percent || 0}%):</span>
        <span>₹{(selectedOrder.gst || 0).toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span>Delivery:</span>
              <span>₹{selectedOrder.delivery_charge?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="summary-row total">
              <span>Total:</span>
              <span>₹{selectedOrder.total_amount?.toFixed(2) || '0.00'}</span>
            </div>
          </div>

          <div className="action-buttons">
            {selectedOrder.order_status === 'PENDING' && (
              <>
                <button
                  className="approve-btn"
                  onClick={() => changeOrderStatus('APPROVED')}
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Processing...' : 'Approve Order'}
                </button>
                <button
                  className="reject-btn"
                  onClick={() => changeOrderStatus('REJECTED')}
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Processing...' : 'Reject Order'}
                </button>
              </>
            )}
            {selectedOrder.order_status === 'APPROVED' && (
              <button
                className="reject-btn"
                onClick={() => changeOrderStatus('REJECTED')}
                disabled={isProcessing}
              >
                {isProcessing ? 'Processing...' : 'Reject Order'}
              </button>
            )}
            {selectedOrder.order_status === 'REJECTED' && (
              <button
                className="approve-btn"
                onClick={() => changeOrderStatus('APPROVED')}
                disabled={isProcessing}
              >
                {isProcessing ? 'Processing...' : 'Approve Order'}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <AdminLayout>
      <div className="orders-container">
        <h1>Order Management</h1>

        <div className="filters-container">
          <div className="filter-group">
            <label htmlFor="orderId">Order ID</label>
            <input
              type="text"
              id="orderId"
              name="orderId"
              value={filters.orderId}
              onChange={handleFilterChange}
              placeholder="Search by order ID"
            />
          </div>

          <div className="filter-group">
            <label htmlFor="deliveryStatus">Delivery Status</label>
            <select
              id="deliveryStatus"
              name="deliveryStatus"
              value={filters.deliveryStatus}
              onChange={handleFilterChange}
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="Processing">Processing</option>
              <option value="intransit">In Transit</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="fulfillment">Fulfillment</label>
            <select
              id="fulfillment"
              name="fulfillment"
              value={filters.fulfillment}
              onChange={handleFilterChange}
            >
              <option value="">All</option>
              <option value="fulfilled">Fulfilled</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="channel">Channel</label>
            <select
              id="channel"
              name="channel"
              value={filters.channel}
              onChange={handleFilterChange}
            >
              <option value="">All Channels</option>
              <option value="online">Online</option>
              <option value="offline">Offline</option>
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="paymentStatus">Payment</label>
            <select
              id="paymentStatus"
              name="paymentStatus"
              value={filters.paymentStatus}
              onChange={handleFilterChange}
            >
              <option value="">All Payments</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          <button className="clear-filters" onClick={clearFilters}>
            Clear All
          </button>
        </div>

        {loading ? (
          <Loader />
        ) : (
          <div className="table-container">
            <div className="results-count">
              Showing {filteredOrders.length} of {orders.length} orders
            </div>
            <table className="orders-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Date & Time</th>
                  <th>Customer</th>
                  <th>City</th>
                  <th>Items</th>
                  <th>Amount</th>
                  <th>Channel</th>
                  <th>Payment</th>
                  <th>Fulfilled</th>
                  <th>Status</th>
                  <th>Type</th>
                  <th>Delhivery</th>
                  <th>AWB</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.order_id}>
                    <td
                      className="order-id-link"
                      onClick={() => handleOrderIdClick(order)}
                    >
                      {order.order_id}
                    </td>
                    <td>{formatIST(order.created_at)}</td>
                    <td>{getCustomerName(order)}</td>
                    <td>{order.address?.city || 'N/A'}</td>
                    <td>{order.total_items}</td>
                    <td>₹{order.total_amount.toFixed(2)}</td>
                    <td className={`channel ${order.channel}`}>
                      {order.channel}
                    </td>
                    <td className={`payment ${order.payment_status}`}>
                      {order.payment_status}
                    </td>
                    <td className={order.fulfillment_status ? 'fulfilled' : 'pending'}>
                      {order.fulfillment_status ? 'Yes' : 'No'}
                    </td>
                    <td
                      className={`status ${order.order_status}`}
                      onClick={() => handleStatusClick(order)}
                    >
                      {order.order_status}
                    </td>
                    <td className={`type ${order.payment_type}`}>
                      {order.payment_type}
                    </td>
                    <td className={String(order.address?.is_available).toLowerCase() === 'true' ? 'available' : 'unavailable'}>
                      {String(order.address?.is_available).toLowerCase() === 'true' ? 'Yes' : 'No'}
                    </td>
                    <td>{order.awb_number || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          {renderModalContent()}
        </div>
      )}

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

export default Orders;