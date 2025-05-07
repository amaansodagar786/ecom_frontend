// AddressModal.js
import React, { useState , useEffect} from 'react';
import { toast } from 'react-toastify';
import './Address.scss'; // We'll use the same styles

const AddressModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  states, 
  initialData = null,
  isEditMode = false
}) => {
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

  // Update form data when initialData changes or modal opens
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        mobile: initialData.mobile || '',
        pincode: initialData.pincode || '',
        locality: initialData.locality || '',
        address_line: initialData.address_line || '',
        city: initialData.city || '',
        state_id: initialData.state_id?.toString() || '',
        landmark: initialData.landmark || '',
        alternate_phone: initialData.alternate_phone || '',
        address_type: initialData.address_type || 'Home',
        latitude: initialData.latitude || null,
        longitude: initialData.longitude || null
      });
    } else {
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
    }
  }, [initialData, isOpen]);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationStatus, setLocationStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddressTypeToggle = (type) => {
    setFormData(prev => ({ ...prev, address_type: type }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    const requiredFields = ['name', 'mobile', 'pincode', 'locality', 'address_line', 'city', 'state_id'];
    for (const field of requiredFields) {
      if (!formData[field]) {
        toast.error(`Please fill in the ${field.replace('_', ' ')} field`);
        return;
      }
    }
  
    try {
      setIsLoading(true);
      const result = await onSave(formData);
      
      if (result && result.address) {
        if (!result.address.is_available) {
          toast.warning('Address saved ');
        } else {
          toast.success(isEditMode ? 'Address updated successfully!' : 'Address saved successfully!');
        }
      }
      
      onClose();
    } catch (error) {
      console.error('Error saving address:', error);
      toast.error(error.message || 'Failed to save address');
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentLocation = () => {
    setLocationStatus('Locating...');
    setShowLocationModal(true);

    if (!navigator.geolocation) {
      const errorMsg = 'Geolocation is not supported by your browser';
      setLocationStatus(errorMsg);
      toast.error(errorMsg);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
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

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to fetch address details');
          }

          const result = await response.json();
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
          console.error('Error in reverse geocoding:', err);
          setLocationStatus('Error fetching address details. Please enter manually.');
          toast.error('Error fetching address details. Please enter manually.');
        }
      },
      (error) => {
        console.error('Error getting location:', error);
        setLocationStatus(`Error: ${error.message}`);
        toast.error(`Location error: ${error.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="address-modal-overlay">
        <div className="address-modal">
          <div className="modal-header">
            <h3>{isEditMode ? 'Edit Address' : 'Add New Address'}</h3>
            <button
              className="btn-close-modal"
              onClick={() => {
                onClose();
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
                  onClose();
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-save"
                disabled={isLoading}
              >
                {isLoading ? 'Processing...' : 'Save Address'}
              </button>
            </div>
          </form>
        </div>
      </div>

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
    </>
  );
};

export default AddressModal;