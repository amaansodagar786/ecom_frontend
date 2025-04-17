import React, { useState, useEffect } from 'react';
import './Address.scss';
import UserLayout from '../../User/UserPanel/UserLayout';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Address = () => {
  const [addresses, setAddresses] = useState([]);
  const [states, setStates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedAddressId, setExpandedAddressId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    pincode: '',
    locality: '',
    address_line: '',
    city: '',
    state_id: '',
    landmark: '',
    alternate_phone: '',
    address_type: 'Home',
    latitude: null,
    longitude: null
  });
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentAddressId, setCurrentAddressId] = useState(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationStatus, setLocationStatus] = useState('');
  const [isCheckingPincode, setIsCheckingPincode] = useState(false);

  useEffect(() => {
    toast.info("This is a test toast");
  }, []);

  // Fetch addresses and states on component mountt
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('[Address] Fetching addresses and states...');

        const [addressesResponse, statesResponse] = await Promise.all([
          fetch(`${import.meta.env.VITE_SERVER_API}/addresses`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json'
            }
          }),
          fetch(`${import.meta.env.VITE_SERVER_API}/states`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json'
            }
          })
        ]);

        console.log('[Address] Addresses response status:', addressesResponse.status);
        console.log('[Address] States response status:', statesResponse.status);

        if (!addressesResponse.ok) {
          const errorData = await addressesResponse.json();
          throw new Error(errorData.message || 'Failed to fetch addresses');
        }

        if (!statesResponse.ok) {
          const errorData = await statesResponse.json();
          throw new Error(errorData.message || 'Failed to fetch states');
        }

        const addressesData = await addressesResponse.json();
        const statesData = await statesResponse.json();

        console.log('[Address] Fetched addresses:', addressesData);
        console.log('[Address] Fetched states:', statesData.states);

        setAddresses(addressesData.addresses || []);
        setStates(statesData.states || []);
        setIsLoading(false);
      } catch (err) {
        console.error('[Address] Error fetching data:', err);
        setError(err.message);
        setIsLoading(false);
        toast.error(`Error: ${err.message}`);
      }
    };

    fetchData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddressTypeToggle = (type) => {
    setFormData(prev => ({
      ...prev,
      address_type: type
    }));
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
  
    // First validate all required fields
    const requiredFields = ['name', 'mobile', 'pincode', 'locality', 'address_line', 'city', 'state_id'];
    for (const field of requiredFields) {
      if (!formData[field]) {
        toast.error(`Please fill in the ${field.replace('_', ' ')} field`);
        return;
      }
    }
  
    try {
      setIsLoading(true);
  
      const url = isEditMode
        ? `${import.meta.env.VITE_SERVER_API}/addresses/${currentAddressId}`
        : `${import.meta.env.VITE_SERVER_API}/add-address`;
  
      const method = isEditMode ? 'PUT' : 'POST';
  
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
  
      const result = await response.json();
      console.log('[Address] Response:', result);
  
      if (!response.ok || !result.success) {
        // Show error toast with custom message
        toast.error(result.message || 'Delivery not available for this pincode. Please choose a different one.');
  
        // Reset only the pincode field while keeping other fields intact
        setFormData(prev => ({
          ...prev,
          pincode: ''
        }));
  
        // Keep the modal open to allow user to enter a different pincode
        return;
      }
  
      // Only reaches here if pincode is serviceable
      toast.success(isEditMode ? 'Address updated successfully!' : 'Address saved successfully!');
  
      // Update local state
      if (isEditMode) {
        setAddresses(addresses.map(addr =>
          addr.address_id === currentAddressId ? result.address : addr
        ));
      } else {
        setAddresses([...addresses, result.address]);
      }
  
      resetForm();
      setIsModalOpen(false);
    } catch (err) {
      console.error('[Address] Error saving address:', err);
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (address) => {
    console.log('[Address] Editing address:', address);
    setFormData({
      name: address.name,
      mobile: address.mobile,
      pincode: address.pincode,
      locality: address.locality,
      address_line: address.address_line,
      city: address.city,
      state_id: address.state_id.toString(),
      landmark: address.landmark || '',
      alternate_phone: address.alternate_phone || '',
      address_type: address.address_type,
      latitude: address.latitude,
      longitude: address.longitude
    });
    setCurrentAddressId(address.address_id);
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleDelete = async (addressId) => {
    if (!window.confirm('Are you sure you want to delete this address?')) return;

    try {
      console.log('[Address] Deleting address ID:', addressId);

      const response = await fetch(`${import.meta.env.VITE_SERVER_API}/addresses/${addressId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('[Address] Delete response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete address');
      }

      setAddresses(addresses.filter(addr => addr.address_id !== addressId));
      toast.success('Address deleted successfully');
      console.log('[Address] Address deleted successfully');
    } catch (err) {
      console.error('[Address] Error deleting address:', err);
      toast.error(`Error: ${err.message}`);
    }
  };

  const resetForm = () => {
    console.log('[Address] Resetting form');
    setFormData({
      name: '',
      mobile: '',
      pincode: '',
      locality: '',
      address_line: '',
      city: '',
      state_id: '',
      landmark: '',
      alternate_phone: '',
      address_type: 'Home',
      latitude: null,
      longitude: null
    });
    setIsEditMode(false);
    setCurrentAddressId(null);
  };

  const toggleAddressExpansion = (addressId) => {
    console.log('[Address] Toggling address expansion for:', addressId);
    setExpandedAddressId(expandedAddressId === addressId ? null : addressId);
  };

  const getCurrentLocation = () => {
    console.log('[Address] Getting current location');
    setLocationStatus('Locating...');
    setShowLocationModal(true);

    if (!navigator.geolocation) {
      const errorMsg = 'Geolocation is not supported by your browser';
      console.error('[Address]', errorMsg);
      setLocationStatus(errorMsg);
      toast.error(errorMsg);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        console.log('[Address] Location coordinates:', latitude, longitude);

        setLocationStatus('Location found! Fetching address details...');

        try {
          setFormData(prev => ({
            ...prev,
            latitude,
            longitude
          }));

          const response = await fetch(`${import.meta.env.VITE_SERVER_API}/addresses/location`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ latitude, longitude })
          });

          console.log('[Address] Reverse geocode response status:', response.status);

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to fetch address details');
          }

          const result = await response.json();
          console.log('[Address] Reverse geocode result:', result);

          if (result.address_details) {
            const { address_details } = result;
            setFormData(prev => ({
              ...prev,
              address_line: address_details.address_line || prev.address_line,
              city: address_details.city || prev.city,
              state_id: address_details.state_id ? address_details.state_id.toString() : prev.state_id,
              pincode: address_details.pincode || prev.pincode,
              locality: address_details.locality || prev.locality
            }));
          }

          setLocationStatus('Address details updated from your location!');
          toast.success('Location captured successfully!');
          setTimeout(() => setShowLocationModal(false), 2000);
        } catch (err) {
          console.error('[Address] Error in reverse geocoding:', err);
          setLocationStatus('Error fetching address details. Please enter manually.');
          toast.error('Error fetching address details. Please enter manually.');
        }
      },
      (error) => {
        console.error('[Address] Error getting location:', error);
        setLocationStatus(`Error: ${error.message}`);
        toast.error(`Location error: ${error.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  if (isLoading && addresses.length === 0) {
    return (
      <UserLayout>
        <div className="loading-spinner">Loading your addresses...</div>
      </UserLayout>
    );
  }

  if (error) {
    return (
      <UserLayout>
        <div className="error-message">Error: {error}</div>
      </UserLayout>
    );
  }

  return (
    <UserLayout>
      <div className={`address-container ${isModalOpen ? 'modal-open' : ''}`}>
        <div className="address-header">
          <h2>My Addresses</h2>
          <button
            className="btn-add-address"
            onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}
          >
            + Add New Address
          </button>
        </div>

        <div className="address-list">
          {addresses.length === 0 ? (
            <div className="no-addresses">
              <p>You haven't saved any addresses yet.</p>
              <button
                className="btn-add-first-address"
                onClick={() => {
                  resetForm();
                  setIsModalOpen(true);
                }}
              >
                Add Your First Address
              </button>
            </div>
          ) : (
            addresses.map(address => (
              <div
                key={address.address_id}
                className={`address-card ${expandedAddressId === address.address_id ? 'expanded' : ''}`}
              >
                <div className="address-summary" onClick={() => toggleAddressExpansion(address.address_id)}>
                  <div className="address-type-badge">
                    {address.address_type === 'Home' ? '🏠 Home' : '💼 Work'}
                  </div>
                  <div className="address-main-info">
                    <h3>{address.name}</h3>
                    <p>{address.address_line}, {address.locality}</p>
                    <p>{address.city}, {address.state_name} - {address.pincode}</p>
                  </div>
                  <div className="address-mobile">
                    <p>Mobile: {address.mobile}</p>
                    {address.alternate_phone && <p>Alt. Phone: {address.alternate_phone}</p>}
                  </div>
                  <div className="expand-icon">
                    {expandedAddressId === address.address_id ? '▲' : '▼'}
                  </div>
                </div>

                {expandedAddressId === address.address_id && (
                  <div className="address-details">
                    <div className="address-actions">
                      <button
                        className="btn-edit"
                        onClick={() => handleEdit(address)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn-delete"
                        onClick={() => handleDelete(address.address_id)}
                      >
                        Delete
                      </button>
                    </div>
                    {address.landmark && (
                      <div className="address-landmark">
                        <strong>Landmark:</strong> {address.landmark}
                      </div>
                    )}
                    {address.latitude && address.longitude && (
                      <div className="address-map">
                        <strong>Location:</strong>
                        <iframe
                          title="Address Location"
                          src={`https://maps.google.com/maps?q=${address.latitude},${address.longitude}&z=15&output=embed`}
                          width="100%"
                          height="200"
                          frameBorder="0"
                          style={{ border: 0, marginTop: '10px' }}
                          allowFullScreen
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Address Form Modal */}
        {isModalOpen && (
          <div className="address-modal-overlay">
            <div className="address-modal">
              <div className="modal-header">
                <h3>{isEditMode ? 'Edit Address' : 'Add New Address'}</h3>
                <button
                  className="btn-close-modal"
                  onClick={() => {
                    setIsModalOpen(false);
                    resetForm();
                  }}
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleSubmit} className="address-form">
                <div className="form-group">
                  <label htmlFor="name">Full Name*</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="mobile">Mobile Number*</label>
                  <input
                    type="tel"
                    id="mobile"
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleInputChange}
                    required
                    pattern="[0-9]{10}"
                    maxLength="10"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="pincode">Pincode*</label>
                  <input
                    type="text"
                    id="pincode"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="locality">Locality*</label>
                  <input
                    type="text"
                    id="locality"
                    name="locality"
                    value={formData.locality}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group full-width">
                  <label htmlFor="address_line">Address (Area and Street)*</label>
                  <textarea
                    id="address_line"
                    name="address_line"
                    value={formData.address_line}
                    onChange={handleInputChange}
                    required
                    rows="3"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="city">City/District/Town*</label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="state_id">State*</label>
                  <select
                    id="state_id"
                    name="state_id"
                    value={formData.state_id}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select State</option>
                    {states.map(state => (
                      <option key={state.state_id} value={state.state_id.toString()}>
                        {state.name} ({state.abbreviation})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="landmark">Landmark (Optional)</label>
                  <input
                    type="text"
                    id="landmark"
                    name="landmark"
                    value={formData.landmark}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="alternate_phone">Alternate Phone (Optional)</label>
                  <input
                    type="tel"
                    id="alternate_phone"
                    name="alternate_phone"
                    value={formData.alternate_phone}
                    onChange={handleInputChange}
                    pattern="[0-9]{10}"
                    maxLength="10"
                  />
                </div>

                <div className="form-group address-type-group">
                  <label>Address Type*</label>
                  <div className="address-type-options">
                    <button
                      type="button"
                      className={`address-type-btn ${formData.address_type === 'Home' ? 'active' : ''}`}
                      onClick={() => handleAddressTypeToggle('Home')}
                    >
                      🏠 Home
                    </button>
                    <button
                      type="button"
                      className={`address-type-btn ${formData.address_type === 'Work' ? 'active' : ''}`}
                      onClick={() => handleAddressTypeToggle('Work')}
                    >
                      💼 Work
                    </button>
                  </div>
                </div>

                <div className="form-group full-width">
                  <button
                    type="button"
                    className="btn-use-location"
                    onClick={getCurrentLocation}
                  >
                    📍 Use My Current Location
                  </button>
                  {(formData.latitude && formData.longitude) && (
                    <div className="location-coordinates">
                      Location set: {formData.latitude.toFixed(4)}, {formData.longitude.toFixed(4)}
                    </div>
                  )}
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    className="btn-cancel"
                    onClick={() => {
                      setIsModalOpen(false);
                      resetForm();
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-save"
                    disabled={isLoading || isCheckingPincode}
                  >
                    {isLoading || isCheckingPincode ? 'Processing...' : 'Save Address'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Location Modal */}
        {showLocationModal && (
          <div className="location-modal">
            <div className="modal-content">
              <p>{locationStatus}</p>
              <button
                className="btn-close-modal"
                onClick={() => setShowLocationModal(false)}
                disabled={locationStatus.includes('Locating') || locationStatus.includes('fetching')}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
      <ToastContainer
        position="top-center"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </UserLayout>
  );
};

export default Address;