import React, { useState, useEffect } from 'react';
import AdminLayout from '../AdminPanel/AdminLayout';
import './Orders.scss';
import { useNavigate } from 'react-router-dom';
import Loader from "../../../Components/Loader/Loader";
import { toast, ToastContainer } from 'react-toastify';

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
        order.order_status === filters.deliveryStatus
      );
    }
    
    if (filters.fulfillment) {
      const fulfilled = filters.fulfillment === 'fulfilled';
      result = result.filter(order => 
        (fulfilled && order.fulfillment_status) || 
        (!fulfilled && !order.fulfillment_status)
      );
    }
    
    if (filters.channel) {
      result = result.filter(order => 
        order.channel === filters.channel
      );
    }
    
    if (filters.paymentStatus) {
      result = result.filter(order => 
        order.payment_status === filters.paymentStatus
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

  const handleOrderClick = (order) => {
    if (order.order_status === 'PENDING') {
      toast.warning('Please review and approve this order first');
    } else {
      navigate(`/orders/${encodeURIComponent(order.order_id)}`);
    }
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
              <option value="PENDING">Pending</option>
              <option value="PROCESSING">Processing</option>
              <option value="INTRANSIT">In Transit</option>
              <option value="DELIVERED">Delivered</option>
              <option value="CANCELLED">Cancelled</option>
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
              <option value="PAID">Paid</option>
              <option value="PENDING">Pending</option>
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
                  <tr
                    key={order.order_id}
                    onClick={() => handleOrderClick(order)}
                    className="clickable-row"
                  >
                    <td>{order.order_id}</td>
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
                    <td className={`status ${order.order_status}`}>
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