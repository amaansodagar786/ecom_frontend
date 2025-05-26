import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '../AdminPanel/AdminLayout';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './ShowOrders.scss';
import Loader from '../../../Components/Loader/Loader';

const OrderDetails = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [orderItems, setOrderItems] = useState([]);
  const [error, setError] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [isFulfillingOrder, setIsFulfillingOrder] = useState(false);
  const [trackingData, setTrackingData] = useState(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingError, setTrackingError] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [srNoInputs, setSrNoInputs] = useState({});
  const [isSubmittingSrNos, setIsSubmittingSrNos] = useState(false);
  const [showRemarksInput, setShowRemarksInput] = useState(false);
  const [remarks, setRemarks] = useState('');
  const [isSavingRemarks, setIsSavingRemarks] = useState(false);

  useEffect(() => {
    if (order?.address?.is_available && order?.fulfillment_status && order?.awb_number) {
      const fetchTrackingData = async () => {
        setTrackingLoading(true);
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(
            `${import.meta.env.VITE_SERVER_API}/order/${encodeURIComponent(order.order_id)}/track`,
            {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            }
          );

          if (!response.ok) {
            throw new Error('Failed to fetch tracking data');
          }

          const data = await response.json();
          setTrackingData(data);
        } catch (err) {
          console.error('Error fetching tracking data:', err);
          setTrackingError(err.message);
        } finally {
          setTrackingLoading(false);
        }
      };

      fetchTrackingData();
    }
  }, [order]);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        const encodedOrderId = encodeURIComponent(orderId);
        const response = await fetch(`${import.meta.env.VITE_SERVER_API}/orders/${encodedOrderId}/details-expanded`);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          let errorMessage = errorData.error || `HTTP error! status: ${response.status}`;

          if (response.status === 500 && orderId.includes('#')) {
            errorMessage = 'Order ID format error. Please check backend route configuration.';
          }

          throw new Error(errorMessage);
        }

        const data = await response.json();

        if (!data || !data.details) {
          throw new Error('Invalid order data structure');
        }

        setOrder({
          order_id: data.order_id,
          customer_id: data.customer_id,
          offline_customer_id: data.offline_customer_id,
          customer_type: data.customer_type,
          customer_display: data.customer_id || data.offline_customer_id || 'N/A',
          total_amount: data.total_amount || 0,
          subtotal: data.subtotal || 0,
          payment_status: data.payment_status,
          fulfillment_status: data.fulfillment_status,
          delivery_status: data.delivery_status,
          created_at: data.created_at,
          awb_number: data.awb_number || null,
          upload_wbn: data.upload_wbn || null,
          address: data.address || null
        });
        setPaymentStatus(data.payment_status || 'pending');

        // Group items by both product_id and model_id to keep different models separate
        const groupedItems = data.details.reduce((acc, detail) => {
          // Find if we already have this product+model combination
          const existingItem = acc.find(item =>
            item.product_id === detail.product_id &&
            item.model_id === detail.model_id
          );

          if (existingItem) {
            existingItem.quantity += 1;
            existingItem.details.push(detail);
          } else {
            acc.push({
              ...detail,
              quantity: 1,
              details: [detail],
              // Explicitly include model information
              model_id: detail.model_id,
              model_name: detail.model_name
            });
          }
          return acc;
        }, []);

        setOrderItems(groupedItems);

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

  const updatePaymentStatus = async (newStatus) => {
    try {
      const encodedOrderId = encodeURIComponent(orderId);
      const token = localStorage.getItem('token');

      const response = await fetch(
        `${import.meta.env.VITE_SERVER_API}/update-payment-status/${encodedOrderId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ payment_status: newStatus })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update payment status');
      }

      setOrder(prev => ({ ...prev, payment_status: newStatus }));
      setPaymentStatus(newStatus);
      toast.success('Payment status updated successfully');
    } catch (error) {
      console.error('Error updating payment status:', error);
      toast.error(error.message || 'Failed to update payment status');
      setPaymentStatus(order.payment_status || 'pending');
    }
  };

  const handlePaymentStatusChange = (e) => {
    const newStatus = e.target.value;
    setPaymentStatus(newStatus);
    updatePaymentStatus(newStatus);
  };

  const saveRemarks = async () => {
  try {
    setIsSavingRemarks(true);
    const token = localStorage.getItem('token');

    // Properly encode the order ID (handles the # character)
    const encodedOrderId = encodeURIComponent(orderId);

    const response = await axios.put(
      `${import.meta.env.VITE_SERVER_API}/orders/${encodedOrderId}/remarks`,
      { remarks },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data.success) {
      setOrder(prev => ({ ...prev, remarks }));
      toast.success('Remarks saved successfully');
      setShowRemarksInput(false);
    } else {
      throw new Error(response.data.error || 'Failed to save remarks');
    }
  } catch (error) {
    console.error('Error saving remarks:', error);
    toast.error(error.response?.data?.error || error.message || 'Failed to save remarks');
  } finally {
    setIsSavingRemarks(false);
  }
};


  const fulfillOrder = async () => {
    if (order.fulfillment_status) {
      toast.info('Order has already been fulfilled');
      return;
    }

    if (!order.address?.is_available) {
      toast.error('Delhivery service not available for this address');
      return;
    }

    setIsFulfillingOrder(true);

    try {
      const encodedOrderId = encodeURIComponent(orderId);
      const token = localStorage.getItem('token');

      const pickupResponse = await fetch(
        `${import.meta.env.VITE_SERVER_API}/order/${encodedOrderId}/add-pickup-req`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!pickupResponse.ok) {
        throw new Error('Failed to create pickup request');
      }

      const pickupData = await pickupResponse.json();

      setOrder(prev => ({
        ...prev,
        awb_number: pickupData.waybill || prev.awb_number,
        upload_wbn: pickupData.upload_wbn || prev.upload_wbn,
        delivery_status: 'processing',
        fulfillment_status: true
      }));

      toast.success('Pickup request created successfully');
    } catch (err) {
      console.error('Error creating pickup request:', err);
      toast.error(err.message || 'Failed to create pickup request');
    } finally {
      setIsFulfillingOrder(false);
    }
  };

  const updateOrderStatus = async (action) => {
    try {
      const encodedOrderId = encodeURIComponent(orderId);
      const token = localStorage.getItem('token');

      const response = await fetch(
        `${import.meta.env.VITE_SERVER_API}/update-order-status/${encodedOrderId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ action })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to update status to ${action}`);
      }

      const data = await response.json();

      setOrder(prev => ({
        ...prev,
        fulfillment_status: data.fulfillment_status,
        delivery_status: data.delivery_status,
        updated_at: data.updated_at
      }));

      toast.success(`Order status updated to ${action} successfully`);

    } catch (error) {
      console.error(`Error updating ${action} status:`, error);
      toast.error(error.message || `Failed to update ${action} status`);
    }
  };

  const openAssignModal = (product) => {
    setCurrentProduct(product);

    // Initialize srNoInputs with existing SR numbers if available
    const initialInputs = {};
    product.details.forEach(detail => {
      initialInputs[detail.detail_id] = detail.sr_no || '';
    });
    setSrNoInputs(initialInputs);

    setShowAssignModal(true);
  };

  const handleSrNoInputChange = (detailId, value) => {
    setSrNoInputs(prev => ({
      ...prev,
      [detailId]: value
    }));
  };

  const submitSrNumbers = async () => {
    // Check if all inputs are filled
    const allFilled = currentProduct.details.every(detail => srNoInputs[detail.detail_id]?.trim());

    if (!allFilled) {
      toast.error('Please enter SR numbers for all quantities');
      return;
    }

    // Prepare data to send to backend
    const dataToSend = currentProduct.details.map(detail => ({
      detail_id: detail.detail_id,
      item_id: detail.item_id,
      product_id: detail.product_id,
      sr_no: srNoInputs[detail.detail_id]
    }));

    try {
      setIsSubmittingSrNos(true);
      const token = localStorage.getItem('token');

      const response = await axios.post(
        `${import.meta.env.VITE_SERVER_API}/save-sr-number`,
        dataToSend,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        // Update local state to reflect the assigned SR numbers
        const updatedItems = orderItems.map(item => {
          if (item.product_id === currentProduct.product_id && item.model_id === currentProduct.model_id) {
            return {
              ...item,
              details: item.details.map(detail => ({
                ...detail,
                sr_no: srNoInputs[detail.detail_id] || detail.sr_no
              }))
            };
          }
          return item;
        });

        setOrderItems(updatedItems);
        setShowAssignModal(false);
        toast.success('SR numbers saved successfully');
      } else {
        throw new Error(response.data.error || 'Failed to save SR numbers');
      }
    } catch (error) {
      console.error('Error saving SR numbers:', error);
      toast.error(error.response?.data?.error || error.message || 'Failed to save SR numbers');
    } finally {
      setIsSubmittingSrNos(false);
    }
  };

  const areAllSrNosAssigned = () => {
    return orderItems.every(product =>
      product.details.every(detail => detail.sr_no)
    );
  };

  const TrackingSection = ({ trackingData, loading, error }) => {
    if (loading) return <div className="tracking-loading">Loading tracking data...</div>;
    if (error) return <div className="tracking-error">Error: {error}</div>;
    if (!trackingData) return <div className="tracking-no-data">No tracking data available</div>;

    return (
      <div className="tracking-container">
        <h3>Order Tracking Details</h3>
        <div className="tracking-summary">
          <div className="tracking-field">
            <span className="tracking-label">AWB Number:</span>
            <span className="tracking-value">{trackingData.ShipmentData?.[0]?.Shipment?.AWB || 'N/A'}</span>
          </div>
          <div className="tracking-field">
            <span className="tracking-label">Status:</span>
            <span className="tracking-value">{trackingData.ShipmentData?.[0]?.Shipment?.Status?.Status || 'N/A'}</span>
          </div>
          <div className="tracking-field">
            <span className="tracking-label">Origin:</span>
            <span className="tracking-value">{trackingData.ShipmentData?.[0]?.Shipment?.Origin || 'N/A'}</span>
          </div>
          <div className="tracking-field">
            <span className="tracking-label">Destination:</span>
            <span className="tracking-value">{trackingData.ShipmentData?.[0]?.Shipment?.Destination || 'N/A'}</span>
          </div>
        </div>

        <div className="tracking-timeline">
          <h4>Tracking History</h4>
          {trackingData.ShipmentData?.[0]?.Shipment?.Scans?.length > 0 ? (
            <ul className="timeline-list">
              {trackingData.ShipmentData[0].Shipment.Scans.map((scan, index) => (
                <li key={index} className="timeline-item">
                  <div className="timeline-date">
                    {new Date(scan.ScanDetail?.ScanDateTime || '').toLocaleString()}
                  </div>
                  <div className="timeline-content">
                    <div className="timeline-status">{scan.ScanDetail?.Scan || 'Scan'}</div>
                    <div className="timeline-location">{scan.ScanDetail?.ScannedLocation || 'Unknown location'}</div>
                    <div className="timeline-remarks">{scan.ScanDetail?.Instructions || ''}</div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p>No tracking history available</p>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <AdminLayout>
        <Loader />
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
      <ToastContainer position="top-center" autoClose={3000} />
      <div className="order-details-container">
        <button className="back-button" onClick={() => navigate('/adminorders')}>
          &larr; Back to Orders
        </button>

        <div className="order-header">
          <h1>Order {order.order_id || 'N/A'}</h1>
          <div className="order-meta">
            <span>Date: {formatIST(order.created_at)}</span>
            <span>Customer ID: {order.customer_display}</span>
            <span>Items: {orderItems.length}</span>
            <span>Total: ₹{(order.total_amount || 0).toFixed(2)}</span>
            <span className="payment-status-dropdown">
              Payment:
              <select
                value={paymentStatus}
                onChange={handlePaymentStatusChange}
                className={`status-select ${paymentStatus}`}
              >
                <option value="paid">Paid</option>
                <option value="unpaid">Unpaid</option>
                <option value="pending">Pending</option>
              </select>
            </span>
            <span className={`status-badge ${order.delivery_status}`}>
              Delivery: {order.delivery_status || 'N/A'}
              {order.awb_number && <div>AWB: {order.awb_number}</div>}
            </span>
          </div>
        </div>

        <div className="items-container">
          <h2>Order Items</h2>
          {orderItems.length > 0 ? (
            <table className="items-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Model</th>
                  <th>Quantity</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>Add SR No</th>
                </tr>
              </thead>
              <tbody>
                {orderItems.map((item) => (
                  <tr key={`${item.product_id}-${item.model_id}`}>
                    <td>
                      <div className="product-info">
                        <span className="product-name">{item.product_name || `Product ${item.product_id}`}</span>
                        <span className="product-id">ID: {item.product_id}</span>
                      </div>
                    </td>
                    <td>
                      {item.model_name || 'Default Model'}
                      {item.model_id && <div>(ID: {item.model_id})</div>}
                    </td>
                    <td>{item.quantity}</td>
                    <td>₹{(item.unit_price || 0).toFixed(2)}</td>
                    <td>
                      <span className={`status-badge ${order.fulfillment_status ? 'fulfilled' : 'pending'}`}>
                        {order.fulfillment_status ? 'Done' : 'Pending'}
                      </span>
                    </td>
                    <td>
                      {item.details.some(d => d.sr_no) ? (
                        <span className="assigned-srno">
                          Assigned
                        </span>
                      ) : (
                        <button
                          className="assign-button"
                          onClick={() => openAssignModal(item)}
                        >
                          Add SR No
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="no-items">No items found in this order</div>
          )}
        </div>

        {/* Fulfillment Section */}
        {areAllSrNosAssigned() && (
          <div className="fulfill-order-section">

            {showRemarksInput ? (
              <div className="remarks-input-container">
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Enter any remarks for this order (optional)"
                  rows={3}
                />
                <div className="remarks-buttons">
                  <button
                    className="cancel-button"
                    onClick={() => setShowRemarksInput(false)}
                    disabled={isSavingRemarks}
                  >
                    Cancel
                  </button>
                  <button
                    className="submit-button"
                    onClick={saveRemarks}
                    disabled={isSavingRemarks}
                  >
                    {isSavingRemarks ? 'Saving...' : 'Save Remarks'}
                  </button>
                </div>
              </div>
            ) : (
              !order.remarks ? (
                <button
                  className="add-remarks-button"
                  onClick={() => setShowRemarksInput(true)}
                >
                  + Add Remarks (Optional)
                </button>
              ) : (
                <div className="remarks-display">
                  <h4>Remarks:</h4>
                  <p>{order.remarks}</p>
                  <button
                    className="edit-remarks-button"
                    onClick={() => {
                      setRemarks(order.remarks);
                      setShowRemarksInput(true);
                    }}
                  >
                    Edit Remarks
                  </button>
                </div>
              )
            )}

            {order.address?.is_available === false ? (
              <div className="delivery-stepper">
                <div className="stepper-buttons">
                  <button
                    className={`stepper-button ${order.fulfillment_status ? 'completed' : ''}`}
                    onClick={() => updateOrderStatus('fulfill')}
                    disabled={order.fulfillment_status}
                  >
                    Fulfill
                    {order.fulfillment_status && <span className="checkmark">✓</span>}
                  </button>

                  <button
                    className={`stepper-button ${['shipped', 'delivered'].includes(order.delivery_status) ? 'completed' : ''}`}
                    onClick={() => updateOrderStatus('shipped')}
                    disabled={!order.fulfillment_status || ['shipped', 'delivered'].includes(order.delivery_status)}
                  >
                    Shipped
                    {['shipped', 'delivered'].includes(order.delivery_status) && <span className="checkmark">✓</span>}
                  </button>

                  <button
                    className={`stepper-button ${order.delivery_status === 'delivered' ? 'completed' : ''}`}
                    onClick={() => updateOrderStatus('delivered')}
                    disabled={order.delivery_status !== 'shipped'}
                  >
                    Delivered
                    {order.delivery_status === 'delivered' && <span className="checkmark">✓</span>}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <button
                  className="fulfill-order-button"
                  onClick={fulfillOrder}
                  disabled={isFulfillingOrder || order.fulfillment_status}
                >
                  {isFulfillingOrder ? 'Processing...' : 'Fulfill Order for Delivery'}
                </button>
                {order.fulfillment_status && (
                  <div className="fulfillment-info">
                    <p>Order has been fulfilled</p>
                    {order.awb_number && <p>AWB Number: {order.awb_number}</p>}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Tracking Section */}
        {order?.address?.is_available && order?.fulfillment_status && (
          <div className="track-order-section">
            <h2>Track Order</h2>
            {trackingLoading && <Loader />}
            <TrackingSection
              trackingData={trackingData}
              loading={trackingLoading}
              error={trackingError}
            />
          </div>
        )}
      </div>

      {/* Assign SR No Modal */}
      {showAssignModal && currentProduct && (
        <div className="sr-assign-modal">
          <div className="sr-assign-modal-content">
            <div className="sr-assign-modal-header">
              <h3>
                <div className="modal-title-info">
                  <span>OrderID : {order.order_id}</span>
                  <span>Model: {currentProduct.model_name || 'N/A'}</span>
                </div>
                Add SR Numbers for {currentProduct.product_name}
              </h3>
              <button onClick={() => setShowAssignModal(false)}>×</button>
            </div>

            <div className="sr-assign-modal-body">
              <table className="assign-table">
                <thead>
                  <tr>
                    <th>Quantity</th>
                    <th>SR Number</th>
                  </tr>
                </thead>
                <tbody>
                  {currentProduct.details.map((detail, index) => (
                    <tr key={detail.detail_id}>
                      <td>{index + 1}</td>
                      <td>
                        <input
                          type="text"
                          value={srNoInputs[detail.detail_id] || ''}
                          onChange={(e) => handleSrNoInputChange(detail.detail_id, e.target.value)}
                          placeholder="Enter SR Number"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="sr-assign-modal-footer">
              <button
                className="cancel-button"
                onClick={() => setShowAssignModal(false)}
              >
                Cancel
              </button>
              <button
                className="submit-button"
                onClick={submitSrNumbers}
                disabled={isSubmittingSrNos}
              >
                {isSubmittingSrNos ? 'Saving...' : 'Submit SR Numbers'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default OrderDetails;