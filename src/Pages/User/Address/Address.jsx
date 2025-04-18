import React, { useState, useEffect } from 'react';
import './Address.scss';
import UserLayout from '../../User/UserPanel/UserLayout';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AddressModal from './AddressModal';
import { FiEdit, FiTrash2, FiX, FiChevronUp, FiChevronDown } from 'react-icons/fi';


const Address = () => {
  const [addresses, setAddresses] = useState([]);
  const [states, setStates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedAddressId, setExpandedAddressId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentAddressId, setCurrentAddressId] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
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

        setAddresses(addressesData.addresses || []);
        setStates(statesData.states || []);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message);
        toast.error(`Error: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSaveAddress = async (formData) => {
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

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Delivery not available for this pincode. Please choose a different one.');
      }

      toast.success(isEditMode ? 'Address updated successfully!' : 'Address saved successfully!');

      if (isEditMode) {
        setAddresses(addresses.map(addr =>
          addr.address_id === currentAddressId ? result.address : addr
        ));
      } else {
        setAddresses([...addresses, result.address]);
      }

      return true;
    } catch (err) {
      console.error('Error saving address:', err);
      toast.error(err.message || 'An unexpected error occurred. Please try again.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (address) => {
    setCurrentAddressId(address.address_id);
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleDelete = async (addressId) => {
    if (!window.confirm('Are you sure you want to delete this address?')) return;

    try {
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
      toast.success('Address deleted successfully');
    } catch (err) {
      console.error('Error deleting address:', err);
      toast.error(`Error: ${err.message}`);
    }
  };

  const toggleAddressExpansion = (addressId) => {
    setExpandedAddressId(prev => prev === addressId ? null : addressId);
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
              setIsEditMode(false);
              setCurrentAddressId(null);
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
                  setIsEditMode(false);
                  setCurrentAddressId(null);
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
                <div
                  className="address-summary"
                  onClick={() => toggleAddressExpansion(address.address_id)}
                >
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
                    {/* {expandedAddressId === address.address_id ? '▼' : '▲'} */}
                    {/* {expandedAddressId === address.address_id ? 'Edit' : 'Close'} */}
                    {expandedAddressId === address.address_id ? (
                      <FiChevronUp className="chevron-icon" />
                    ) : (
                      <FiChevronDown className="chevron-icon" />
                    )}
                  </div>
                </div>


                {expandedAddressId === address.address_id && (
                  <div className="address-details">
                    <div className="address-actions">
                      <button
                        className="btn-edit"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(address);
                        }}
                      >
                        <FiEdit className="action-icon" /> Edit
                      </button>
                      <button
                        className="btn-delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(address.address_id);
                        }}
                      >
                        <FiTrash2 className="action-icon" /> Delete
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

        <AddressModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setIsEditMode(false);
            setCurrentAddressId(null);
          }}
          onSave={handleSaveAddress}
          states={states}
          initialData={isEditMode ? addresses.find(a => a.address_id === currentAddressId) : null}
          isEditMode={isEditMode}
          key={currentAddressId || 'create'} // Important for resetting form
        />

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
      </div>
    </UserLayout>
  );
};

export default Address;