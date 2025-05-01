import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '../AdminPanel/AdminLayout';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './OrderDetails.scss';

const Dummyorders = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedItems, setExpandedItems] = useState([]);
  const [error, setError] = useState(null);
  const [srNoInput, setSrNoInput] = useState('');
  const [validatedSrNos, setValidatedSrNos] = useState([]);
  const [savedSrNos, setSavedSrNos] = useState({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newDeviceData, setNewDeviceData] = useState({
    device_srno: '',
    device_name: '',
    sku_id: '',
    price: '',
    remarks: '',
    order_id: orderId,
    in_out: 1
  });
  const [creatingDevice, setCreatingDevice] = useState(false);

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

        // Create savedSrNos object based on details
        const initialSavedSrNos = {};
        data.details.forEach((detail) => {
          const itemKey = `${detail.product_id}-${detail.item_id}-${detail.detail_id}`;
          initialSavedSrNos[itemKey] = [detail.sr_no || null];
        });

        setSavedSrNos(initialSavedSrNos);
        setOrder(data);
        setExpandedItems(data.details);
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

  const validateSrNo = async () => {
    const srNo = srNoInput.trim();
    if (!srNo) {
      toast.error('Please enter a serial number');
      return;
    }

    const isAlreadyAssigned = Object.values(savedSrNos).some(
      srNos => srNos.some(s => s === srNo)
    );
    if (isAlreadyAssigned) {
      toast.error('This SR No is already assigned to another quantity');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const searchResponse = await fetch(`http://localhost:5000/search-device`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ search_term: srNo })
      });

      if (!searchResponse.ok) {
        const errorData = await searchResponse.json();
        throw new Error(errorData.message || `HTTP error! status: ${searchResponse.status}`);
      }

      const searchData = await searchResponse.json();

      if (!searchData.success) {
        throw new Error(searchData.message || 'Failed to validate SR No');
      }

      if (searchData.data.status === 'SOLD' || searchData.data.status === 'SOLD_WITHOUT_IN') {
        toast.error('This device has already been sold (OUT transaction exists)');
        return;
      }

      const response = await fetch(`http://localhost:5000/get-all-device-transactions?device_srno=${srNo}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to validate SR No');
      }

      if (!data.data || data.data.length === 0) {
        toast.warn('No SR No found in database. You can create a new device.');
        return;
      }

      setValidatedSrNos(prev => [...prev, srNo]);
      toast.success('SR No validated successfully');
      setSrNoInput('');

    } catch (error) {
      console.error('Error validating SR No:', error);
      toast.error(error.message || 'Failed to validate SR No');
    }
  };

  const createNewDevice = async () => {
    if (!newDeviceData.device_srno || !newDeviceData.device_name) {
      toast.error('Device SR No and Name are required');
      return;
    }

    setCreatingDevice(true);
    try {
      const response = await fetch('http://localhost:5000/add-device', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newDeviceData,
          in_out: parseInt(newDeviceData.in_out) || 1
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to create device');

      toast.success('Device created successfully');
      setValidatedSrNos(prev => [...prev, newDeviceData.device_srno]);
      setShowCreateModal(false);
      setNewDeviceData({
        device_srno: '',
        device_name: '',
        sku_id: '',
        price: '',
        remarks: '',
        order_id: orderId,
        in_out: 1
      });
    } catch (error) {
      console.error('Error creating device:', error);
      toast.error(error.message || 'Failed to create device');
    } finally {
      setCreatingDevice(false);
    }
  };

  const assignSrNoToQuantity = (itemKey, qtyIndex) => {
    if (validatedSrNos.length === 0) {
      toast.error('Please validate an SR No first');
      return;
    }

    const srNo = validatedSrNos[validatedSrNos.length - 1];

    setSavedSrNos(prev => ({
      ...prev,
      [itemKey]: [srNo]
    }));

    setValidatedSrNos(prev => prev.filter(s => s !== srNo));
  };

  const saveProductSrNos = async (itemId) => {
    try {
      // Convert itemId to number for comparison
      const numericItemId = Number(itemId);

      // Get all details for this item
      const itemDetails = expandedItems.filter(d => d.item_id === numericItemId);
      
      if (itemDetails.length === 0) {
        toast.error('No order details found for this item');
        return;
      }

      // Prepare data to save
      const dataToSave = itemDetails.map(detail => {
        const itemKey = `${detail.product_id}-${detail.item_id}-${detail.detail_id}`;
        return {
          detail_id: detail.detail_id,
          item_id: detail.item_id,
          product_id: detail.product_id,
          sr_no: savedSrNos[itemKey] ? savedSrNos[itemKey][0] : null
        };
      });

      // Check if all SR numbers are assigned
      const allAssigned = dataToSave.every(item => item.sr_no);
      if (!allAssigned) {
        toast.error('Please assign SR Nos to all quantities first');
        return;
      }

      // Make API call to save SR numbers
      const response = await fetch(`${import.meta.env.VITE_SERVER_API}/orders/save-sr-numbers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSave)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save SR numbers');
      }

      // Update local state to mark items as saved
      const updatedItems = expandedItems.map(item => {
        if (item.item_id === numericItemId) {
          return { ...item, sr_no: savedSrNos[`${item.product_id}-${item.item_id}-${item.detail_id}`][0] };
        }
        return item;
      });

      setExpandedItems(updatedItems);
      toast.success(`SR Numbers for item ${itemId} saved successfully`);

    } catch (error) {
      console.error('Error saving SR numbers:', error);
      toast.error(error.message || 'Failed to save SR numbers');
    }
  };

  // Group details by item_id for rendering
  const groupDetailsByItem = () => {
    const itemsMap = {};
    expandedItems.forEach(detail => {
      if (!itemsMap[detail.item_id]) {
        itemsMap[detail.item_id] = {
          product_id: detail.product_id,
          product_name: detail.product_name,
          details: []
        };
      }
      itemsMap[detail.item_id].details.push(detail);
    });
    return itemsMap;
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

  const groupedItems = groupDetailsByItem();

  return (
    <AdminLayout>
      <ToastContainer position="top-center" autoClose={3000} />
      <div className="order-details-container">
        <button className="back-button" onClick={() => navigate('/adminorders')}>
          &larr; Back to Orders
        </button>

        <div className="order-header">
          <h1>Dummy Order #{order.order_id || 'N/A'}</h1>
          <div className="order-meta">
            <span>Date: {formatIST(order.created_at)}</span>
            <span>Total Items: {Object.keys(groupedItems).length}</span>
            <span>Total Amount: ₹{(order.total_amount || 0).toFixed(2)}</span>
          </div>
        </div>

        <div className="srno-input-section">
          <div className="srno-input-group">
            <input
              type="text"
              placeholder="Enter SR No"
              value={srNoInput}
              onChange={(e) => setSrNoInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && validateSrNo()}
            />
            <button onClick={validateSrNo}>
              Validate SR No
            </button>
            <button
              className="create-button"
              onClick={() => setShowCreateModal(true)}
            >
              Create New Device
            </button>
          </div>
          {validatedSrNos.length > 0 && (
            <div className="validated-srnos">
              <span>Validated SR Nos: {validatedSrNos.join(', ')}</span>
            </div>
          )}
        </div>

        <div className="items-container">
          <h2>Order Items</h2>
          {Object.keys(groupedItems).length > 0 ? (
            <div className="items-list">
              {Object.entries(groupedItems).map(([itemId, itemData]) => {
                // Check if all details for this item have saved SR numbers
                const allSaved = itemData.details.every(detail => detail.sr_no);
                // Check if all have assigned SR numbers (either saved or in state)
                const allAssigned = itemData.details.every(detail => {
                  const itemKey = `${detail.product_id}-${detail.item_id}-${detail.detail_id}`;
                  return detail.sr_no || (savedSrNos[itemKey] && savedSrNos[itemKey][0]);
                });

                return (
                  <div key={itemId} className="product-group">
                    <div className="product-header">
                      <h3>{itemData.product_name || `Product ${itemData.product_id}`}</h3>
                      <span className="item-id">Item ID: {itemId}</span>
                    </div>

                    <div className="product-details">
                      {itemData.details.map((detail, index) => {
                        const itemKey = `${detail.product_id}-${detail.item_id}-${detail.detail_id}`;
                        const srNo = detail.sr_no || (savedSrNos[itemKey] ? savedSrNos[itemKey][0] : null);
                        const isLast = index === itemData.details.length - 1;

                        return (
                          <div key={detail.detail_id} className={`detail-row ${isLast ? 'last-detail' : ''}`}>
                            <div className="detail-info">
                              <span>Detail ID: {detail.detail_id}</span>
                              <span>Quantity #{index + 1}</span>
                            </div>
                            <div className="srno-assignment">
                              {srNo ? (
                                <span className="assigned-srno">
                                  {srNo}
                                  {detail.sr_no && <span className="saved-badge">Saved</span>}
                                </span>
                              ) : (
                                <button
                                  onClick={() => assignSrNoToQuantity(itemKey, 0)}
                                  disabled={validatedSrNos.length === 0}
                                >
                                  Assign SR No
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {allAssigned && !allSaved && (
                      <div className="product-save-section">
                        <button
                          className="save-button"
                          onClick={() => saveProductSrNos(itemId)}
                        >
                          Save All SR Numbers for {itemData.product_name}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="no-items">No items found in this order</div>
          )}
        </div>
      </div>

      {/* Create New Device Modal */}
      {showCreateModal && (
        <div className="device-creation-modal">
          <div className="device-creation-modal__content">
            <div className="device-creation-modal__header">
              <h3>Create New Device</h3>
              <button onClick={() => setShowCreateModal(false)}>×</button>
            </div>

            <div className="device-creation-modal__body">
              <div className="device-creation-modal__form-group">
                <label className="required">Device SR No</label>
                <input
                  type="text"
                  value={newDeviceData.device_srno}
                  onChange={(e) => setNewDeviceData({ ...newDeviceData, device_srno: e.target.value })}
                  required
                />
              </div>

              <div className="device-creation-modal__form-group">
                <label className="required">Device Name</label>
                <input
                  type="text"
                  value={newDeviceData.device_name}
                  onChange={(e) => setNewDeviceData({ ...newDeviceData, device_name: e.target.value })}
                  required
                />
              </div>

              <div className="device-creation-modal__form-group">
                <label>SKU ID</label>
                <input
                  type="text"
                  value={newDeviceData.sku_id}
                  onChange={(e) => setNewDeviceData({ ...newDeviceData, sku_id: e.target.value })}
                />
              </div>

              <div className="device-creation-modal__form-group">
                <label>Order ID</label>
                <input
                  type="text"
                  value={newDeviceData.order_id}
                  onChange={(e) => setNewDeviceData({ ...newDeviceData, order_id: e.target.value })}
                  placeholder={orderId}
                />
              </div>

              <div className="device-creation-modal__form-group">
                <label>Transaction Type</label>
                <select
                  value={newDeviceData.in_out}
                  onChange={(e) => setNewDeviceData({ ...newDeviceData, in_out: e.target.value })}
                >
                  <option value="1">IN</option>
                  <option value="2">OUT</option>
                  <option value="3">RETURN</option>
                </select>
              </div>

              <div className="device-creation-modal__form-group">
                <label>Price (₹)</label>
                <input
                  type="number"
                  value={newDeviceData.price}
                  onChange={(e) => setNewDeviceData({ ...newDeviceData, price: e.target.value })}
                  step="0.01"
                />
              </div>

              <div className="device-creation-modal__form-group">
                <label>Remarks</label>
                <textarea
                  value={newDeviceData.remarks}
                  onChange={(e) => setNewDeviceData({ ...newDeviceData, remarks: e.target.value })}
                  rows="3"
                />
              </div>
            </div>

            <div className="device-creation-modal__footer">
              <button
                className="device-creation-modal__footer--cancel"
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </button>
              <button
                className="device-creation-modal__footer--submit"
                onClick={createNewDevice}
                disabled={creatingDevice}
              >
                {creatingDevice ? 'Creating...' : 'Create Device'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default Dummyorders;