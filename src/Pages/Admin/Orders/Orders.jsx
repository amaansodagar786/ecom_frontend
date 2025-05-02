import React, { useState, useEffect } from 'react';
import AdminLayout from '../AdminPanel/AdminLayout';
import './Orders.scss';
import { useNavigate } from 'react-router-dom';
import Loader from "../../../Components/Loader/Loader"


const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();


  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER_API}/orders`);
      const data = await response.json();
      setOrders(data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
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

  return (
    <AdminLayout>
      <div className="orders-container">
        <h1>Order Management</h1>

        {loading ? (
          <Loader />
        ) : (
          <div className="table-container">
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
                  <th>Delivery</th>
                  <th>Status</th>
                  <th>AWB</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr
                    key={order.order_id}
                    onClick={() => navigate(`/orders/${encodeURIComponent(order.order_id)}`)}
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
                    <td>{order.delivery_method}</td>
                    <td className={`status ${order.delivery_status}`}>
                      {order.delivery_status}
                    </td>
                    <td>{order.awb_number || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default Orders;