import React, { useState } from 'react';
import AdminLayout from '../AdminPanel/AdminLayout';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './Device.scss';

const Device = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [file, setFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [newDeviceData, setNewDeviceData] = useState({
    device_srno: '',
    model_name: '',
    sku_id: '',
    price: '',
    remarks: '',
    order_id: '',
    in_out: 1
  });
  const [creatingDevice, setCreatingDevice] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setUploadStatus('');
  };

  const handleUpload = async () => {
    if (!file) {
      setUploadStatus('Please select a file first.');
      toast.error('Please select a file first.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_SERVER_API}/upload-device-transaction`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Upload failed');
      }

      const successMessage = data.message || 'Upload successful!';
      setUploadStatus(successMessage);
      setFile(null);
      setShowUploadModal(false);
      toast.success(successMessage);

    } catch (error) {
      console.error('Upload Error:', error);
      let errorMessage = 'Upload failed.';

      if (error.response) {
        errorMessage = error.response.data.message || errorMessage;
      } else if (error.request) {
        errorMessage = 'No response from server. Check your connection.';
      }

      setUploadStatus(errorMessage);
      toast.error(errorMessage);
    }
  };

 const createNewDevice = async () => {
  console.log('Attempting to create device with data:', newDeviceData);
  
  // Changed from device_name to model_name
  if (!newDeviceData.device_srno || !newDeviceData.model_name) {
    const errorMsg = `Validation failed: ${!newDeviceData.device_srno ? 'Device SR No required' : ''} ${!newDeviceData.model_name ? 'Model Name required' : ''}`;
    console.error(errorMsg);
    toast.error('Device SR No and Model Name are required');
    return;
  }

  setCreatingDevice(true);
  try {
    console.log('Sending request to server...');
    const response = await fetch(`${import.meta.env.VITE_SERVER_API}/add-device`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...newDeviceData,
        in_out: parseInt(newDeviceData.in_out) || 1
      })
    });

    console.log('Response received, status:', response.status);
    const data = await response.json();
    console.log('Response data:', data);

    if (!response.ok) {
      throw new Error(data.message || `Server responded with status ${response.status}`);
    }

    toast.success('Device created successfully');
    console.log('Device created successfully:', data);
    setShowCreateModal(false);
    setNewDeviceData({
      device_srno: '',
      model_name: '',
      sku_id: '',
      price: '',
      remarks: '',
      order_id: '',
      in_out: 1
    });
  } catch (error) {
    console.error('Error creating device:', {
      error: error,
      message: error.message,
      stack: error.stack
    });
    toast.error(error.message || 'Failed to create device');
  } finally {
    console.log('Request completed');
    setCreatingDevice(false);
  }
};
  return (
    <AdminLayout>
      <div className="device-management-container">
        <h1>SR Number Management</h1>

        <div className="device-input-section">
          <div className="device-input-group">
            {/* <input
              type="text"
              placeholder="Enter Order ID"
              value={newDeviceData.order_id}
              onChange={(e) => setNewDeviceData({...newDeviceData, order_id: e.target.value})}
              className="order-id-input"
            /> */}

            <div className="device-action-buttons">
              <button
                className="create-device-button"
                onClick={() => setShowCreateModal(true)}
              >
                Create New Device
              </button>

              <button
                className="import-device-button"
                onClick={() => setShowUploadModal(true)}
              >
                Import Devices (CSV)
              </button>
            </div>
          </div>
        </div>

        {/* Create Device Modal */}
        {showCreateModal && (
          <div className="device-modal">
            <div className="device-modal-content">
              <div className="device-modal-header">
                <h3>Create New Device</h3>
                <button onClick={() => setShowCreateModal(false)}>×</button>
              </div>

              <div className="device-modal-body">
                <div className="form-group">
                  <label className="required">Device SR No</label>
                  <input
                    type="text"
                    value={newDeviceData.device_srno}
                    onChange={(e) => setNewDeviceData({ ...newDeviceData, device_srno: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="required">Model Name</label>
                  <input
                    type="text"
                    value={newDeviceData.model_name}  // Changed from device_name
                    onChange={(e) => setNewDeviceData({ ...newDeviceData, model_name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>SKU ID</label>
                  <input
                    type="text"
                    value={newDeviceData.sku_id}
                    onChange={(e) => setNewDeviceData({ ...newDeviceData, sku_id: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Order ID</label>
                  <input
                    type="text"
                    value={newDeviceData.order_id}
                    onChange={(e) => setNewDeviceData({ ...newDeviceData, order_id: e.target.value })}
                  />
                </div>

                <div className="form-group">
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

                <div className="form-group">
                  <label>Price (₹)</label>
                  <input
                    type="number"
                    value={newDeviceData.price}
                    onChange={(e) => setNewDeviceData({ ...newDeviceData, price: e.target.value })}
                    step="0.01"
                  />
                </div>

                <div className="form-group">
                  <label>Remarks</label>
                  <textarea
                    value={newDeviceData.remarks}
                    onChange={(e) => setNewDeviceData({ ...newDeviceData, remarks: e.target.value })}
                    rows="3"
                  />
                </div>
              </div>

              <div className="device-modal-footer">
                <button
                  className="cancel-button"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="submit-button"
                  onClick={createNewDevice}
                  disabled={creatingDevice}
                >
                  {creatingDevice ? 'Creating...' : 'Create Device'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Upload CSV Modal */}
        {showUploadModal && (
          <div className="device-modal">
            <div className="device-modal-content">
              <div className="device-modal-header">
                <h3>Upload Device Transactions</h3>
                <button onClick={() => {
                  setShowUploadModal(false);
                  setUploadStatus('');
                  setFile(null);
                }}>×</button>
              </div>

              <div className="device-modal-body">
                <div className="form-group">
                  <label>Select File (CSV or Excel)</label>
                  <input
                    type="file"
                    accept=".csv, .xlsx, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    onChange={handleFileChange}
                  />
                </div>
                {uploadStatus && (
                  <p className={`upload-status ${uploadStatus.includes('success') ? 'success' : 'error'}`}>
                    {uploadStatus}
                  </p>
                )}
              </div>

              <div className="device-modal-footer">
                <button
                  className="cancel-button"
                  onClick={() => {
                    setShowUploadModal(false);
                    setUploadStatus('');
                    setFile(null);
                  }}
                >
                  Cancel
                </button>
                <button
                  className="submit-button"
                  onClick={handleUpload}
                  disabled={!file}
                >
                  Upload
                </button>
              </div>
            </div>
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

export default Device;