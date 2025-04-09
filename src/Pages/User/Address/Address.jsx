import React, { useState, useEffect } from 'react';
import './Address.scss';
import UserLayout from '../../User/UserPanel/UserLayout';

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

  // Fetch addresses and states on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Fetching addresses and states...');
        
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

        console.log('Addresses response status:', addressesResponse.status);
        console.log('States response status:', statesResponse.status);

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

        console.log('Fetched addresses:', addressesData);
        console.log('Fetched states:', statesData);

        setAddresses(addressesData.addresses || []);
        setStates(statesData.states || []);
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message);
        setIsLoading(false);
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
    setIsLoading(true);

    try {
      const url = isEditMode 
        ? `${import.meta.env.VITE_SERVER_API}/addresses/${currentAddressId}`
        : `${import.meta.env.VITE_SERVER_API}/add-address`;
      
      const method = isEditMode ? 'PUT' : 'POST';

      console.log('Submitting address data:', formData); // Debug log

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save address');
      }

      const result = await response.json();
      console.log('Address saved successfully:', result);

      // Update local state
      if (isEditMode) {
        setAddresses(addresses.map(addr => 
          addr.address_id === currentAddressId ? result.address : addr
        ));
      } else {
        setAddresses([...addresses, result.address]);
      }

      // Reset form and close modal
      resetForm();
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error saving address:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (address) => {
    console.log('Editing address:', address); // Debug log
    setFormData({
      name: address.name,
      mobile: address.mobile,
      pincode: address.pincode,
      locality: address.locality,
      address_line: address.address_line,
      city: address.city,
      state_id: address.state_id.toString(), // Ensure state_id is string for select
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
      console.log('Deleting address ID:', addressId); // Debug log
      
      const response = await fetch(`${import.meta.env.VITE_SERVER_API}/addresses/${addressId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete address');
      }

      setAddresses(addresses.filter(addr => addr.address_id !== addressId));
      console.log('Address deleted successfully');
    } catch (err) {
      console.error('Error deleting address:', err);
      setError(err.message);
    }
  };

  const resetForm = () => {
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
    setExpandedAddressId(expandedAddressId === addressId ? null : addressId);
  };

  const getCurrentLocation = () => {
    setLocationStatus('Locating...');
    setShowLocationModal(true);

    if (!navigator.geolocation) {
      setLocationStatus('Geolocation is not supported by your browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        console.log('Location coordinates:', latitude, longitude);
        
        setLocationStatus('Location found! Fetching address details...');
        
        try {
          // Save coordinates to form
          setFormData(prev => ({
            ...prev,
            latitude,
            longitude
          }));

          // Reverse geocode to get address details
          const response = await fetch(`${import.meta.env.VITE_SERVER_API}/addresses/location`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ latitude, longitude })
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to fetch address details');
          }

          const result = await response.json();
          console.log('Reverse geocode result:', result);

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
          setTimeout(() => setShowLocationModal(false), 2000);
        } catch (err) {
          console.error('Error in reverse geocoding:', err);
          setLocationStatus('Error fetching address details. Please enter manually.');
        }
      },
      (error) => {
        console.error('Error getting location:', error);
        setLocationStatus(`Error: ${error.message}`);
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
                    disabled={isLoading}
                  >
                    {isLoading ? 'Saving...' : 'Save Address'}
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
    </UserLayout>
  );
};

export default Address;