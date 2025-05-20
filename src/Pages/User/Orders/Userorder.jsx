import React, { useState, useEffect } from 'react';
import UserLayout from '../../User/UserPanel/UserLayout';
import { useNavigate } from 'react-router-dom';
import './UserOrders.scss';
import Loader from "../../../Components/Loader/Loader";
import fallbackimage from '../../../assets/Logo/logo.jpg';

const UserOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    console.log('UserOrders component mounted');
    const userData = JSON.parse(localStorage.getItem('user'));
    
    if (!userData || !userData.customer_id) {
      console.error('User not authenticated - missing customer_id');
      setError('User not authenticated');
      setLoading(false);
      return;
    }

    const fetchOrders = async () => {
      try {
        console.log(`Fetching orders for customer: ${userData.customer_id}`);
        const ordersResponse = await fetch(
          `${import.meta.env.VITE_SERVER_API}/customer/${userData.customer_id}/orders`
        );
        
        if (!ordersResponse.ok) {
          console.error('Failed to fetch orders', ordersResponse.status, ordersResponse.statusText);
          throw new Error('Failed to fetch orders');
        }
        
        const ordersData = await ordersResponse.json();
        console.log('Received orders data:', ordersData);
        
        const ordersWithItems = await Promise.all(
          ordersData.map(async (order) => {
            try {
              const encodedOrderId = encodeURIComponent(order.order_id);
              console.log(`Fetching items for order: ${order.order_id}`);
              const itemsResponse = await fetch(
                `${import.meta.env.VITE_SERVER_API}/order/${encodedOrderId}/items`
              );
              
              if (!itemsResponse.ok) {
                console.warn(`Failed to fetch items for order ${order.order_id}`, itemsResponse.status);
                return {...order, items: []};
              }
              
              const itemsData = await itemsResponse.json();
              console.log(`Items for order ${order.order_id}:`, itemsData);
              return {
                ...order,
                items: itemsData.items || []
              };
            } catch (err) {
              console.error(`Error fetching items for order ${order.order_id}:`, err);
              return {...order, items: []};
            }
          })
        );
        
        console.log('Final orders with items:', ordersWithItems);
        setOrders(ordersWithItems);
      } catch (err) {
        console.error('Error in fetchOrders:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const getStatusBadge = (orderStatus, deliveryStatus) => {
    if (orderStatus?.toUpperCase() === 'PENDING') {
      return <span className="status-badge pending-approval">Waiting Approval</span>;
    }

    if (orderStatus?.toUpperCase() === 'REJECTED') {
      return <span className="status-badge pending-approval">Rejected</span>;
    }
    
    if (orderStatus?.toUpperCase() === 'APPROVED') {
      switch (deliveryStatus?.toLowerCase()) {
        case 'delivered': return <span className="status-badge delivered">Delivered</span>;
        case 'shipped': return <span className="status-badge shipped">Shipped</span>;
        case 'processing': return <span className="status-badge processing">Processing</span>;
        case 'cancelled': return <span className="status-badge cancelled">Cancelled</span>;
        default: return <span className="status-badge confirmed">Order Confirmed</span>;
      }
    }

    return <span className="status-badge pending">Pending</span>;
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const handleViewDetails = (orderId) => {
    console.log('Navigating to order details:', orderId);
    navigate(`/user/orders/${encodeURIComponent(orderId)}`);
  };

  if (loading) return <UserLayout><Loader /></UserLayout>;
  if (error) return (
    <UserLayout>
      <div className="orders-error">
        <p>Error: {error}</p>
      </div>
    </UserLayout>
  );

  if (orders.length === 0) return (
    <UserLayout>
      <div className="no-orders">
        <div className="no-orders-icon"><i className="fas fa-box-open"></i></div>
        <h3>No Orders Found</h3>
        <p>You haven't placed any orders yet.</p>
        <button className="shop-now-btn">Shop Now</button>
      </div>
    </UserLayout>
  );

  return (
    <UserLayout>
      <div className="user-orders-container">
        <h1 className="orders-title">My Orders</h1>
        
        <div className="orders-list">
          {orders.map((order) => (
            <div key={order.order_id} className="order-card">
              <div className="order-header">
                <div className="order-meta">
                  <span className="order-id">Order #{order.order_id}</span>
                  <span className="order-date">Placed on {formatDate(order.created_at)}</span>
                </div>
                <div className="order-status">
                  {getStatusBadge(order.order_status, order.delivery_status)}
                </div>
              </div>

              <div className="order-items-preview">
                {order.items?.slice(0, 3).map((item, index) => (
                  <div key={index} className="preview-item">
                    <div className="preview-image">
                      <img 
                        src={item.product_image?.startsWith('http') 
                          ? item.product_image 
                          : `${import.meta.env.VITE_SERVER_API}${item.product_image}`} 
                        alt={item.product_name}
                        onError={(e) => e.target.src = {fallbackimage}}
                      />
                    </div>
                    <div className="preview-details">
                      <span className="preview-name">{item.product_name}</span>
                      <span className="preview-qty">Qty: {item.quantity}</span>
                    </div>
                  </div>
                ))}
                {order.items?.length > 3 && (
                  <div className="more-items">+{order.items.length - 3} more items</div>
                )}
              </div>

              <div className="order-footer">
                <div className="order-total">
                  <span>Total:</span>
                  <span className="total-amount">₹{order.total_amount?.toFixed(2)}</span>
                </div>
                <div className="order-actions">
                  <button 
                    className="action-btn details-btn"
                    onClick={() => handleViewDetails(order.order_id)}
                  >
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </UserLayout>
  );
};

export default UserOrders;