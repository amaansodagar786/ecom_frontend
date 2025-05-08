import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../Components/Context/AuthContext';
import './Checkout.scss';
import AddressModal from '../../Pages/User/Address/AddressModal';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Loader from '../../Components/Loader/Loader';

const Checkout = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { getToken, cartItems: contextCartItems } = useAuth();

    const initialItems = location.state?.isBuyNowFlow
        ? [location.state.buyNowItem]
        : location.state?.cartItems || contextCartItems || [];

    const [cartItems, setCartItems] = useState(initialItems);
    const [isBuyNowFlow] = useState(location.state?.isBuyNowFlow || false);
    const [activeStep, setActiveStep] = useState(1);
    const [addresses, setAddresses] = useState([]);
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
    const [states, setStates] = useState([]);
    const [paymentMethod, setPaymentMethod] = useState('');
    const [isUPIModalOpen, setIsUPIModalOpen] = useState(false);

    // Calculate order totals
    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const originalSubtotal = cartItems.reduce((sum, item) => sum + ((item.original_price || item.price) * item.quantity), 0);
    const totalDiscount = originalSubtotal - subtotal;

    const calculateDeliveryCharge = (amount) => {
        if (amount <= 999) return 0;
        if (amount <= 5000) return 90;
        if (amount <= 10000) return 180;
        if (amount <= 20000) return 240;
        if (amount <= 30000) return 560;
        return 850;
    };

    const deliveryCharge = calculateDeliveryCharge(subtotal);
    const taxes = 0;
    const total = subtotal + deliveryCharge + taxes;

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [activeStep]);

    // Fetch user addresses and states
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [addressesResponse, statesResponse] = await Promise.all([
                    axios.get(`${import.meta.env.VITE_SERVER_API}/addresses`, {
                        headers: { Authorization: `Bearer ${getToken()}` }
                    }),
                    axios.get(`${import.meta.env.VITE_SERVER_API}/states`, {
                        headers: { Authorization: `Bearer ${getToken()}` }
                    })
                ]);

                setAddresses(addressesResponse.data.addresses || []);
                setStates(statesResponse.data.states || []);

                if (addressesResponse.data.addresses?.length > 0) {
                    setSelectedAddress(addressesResponse.data.addresses[0].address_id);
                }
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to load data');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [getToken]);

    const handleSaveAddress = async (formData) => {
        try {
            const response = await axios.post(`${import.meta.env.VITE_SERVER_API}/add-address`, formData, {
                headers: { Authorization: `Bearer ${getToken()}` }
            });

            if (response.data.success) {
                const updatedResponse = await axios.get(`${import.meta.env.VITE_SERVER_API}/addresses`, {
                    headers: { Authorization: `Bearer ${getToken()}` }
                });

                setAddresses(updatedResponse.data.addresses || []);
                if (updatedResponse.data.addresses?.length > 0) {
                    const newAddress = updatedResponse.data.addresses[updatedResponse.data.addresses.length - 1];
                    setSelectedAddress(newAddress.address_id);
                }

                setIsAddressModalOpen(false);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save address');
            throw err;
        }
    };

    const handleAddressSubmit = () => {
        if (!selectedAddress) {
            setError('Please select an address');
            return;
        }
        setActiveStep(2);
    };

    const handlePlaceOrder = async (isUPIPaymentCompleted = false) => {
        try {
            const isBuyNowFlow = cartItems.length === 1 && location.state?.isBuyNowFlow;

            if (!selectedAddress) {
                throw new Error('Please select a delivery address');
            }
            if (!paymentMethod) {
                throw new Error('Please select a payment method');
            }

            // For UPI, only proceed if payment is marked as completed
            if (paymentMethod === 'UPI' && !isUPIPaymentCompleted) {
                setIsUPIModalOpen(true);
                return;
            }

            const baseOrderData = {
                address_id: selectedAddress,
                payment_status: paymentMethod === 'Cash on Delivery' ? 'pending' : 'paid',
                delivery_method: 'standard',
                delivery_charge: deliveryCharge,
                tax_percent: 0
            };

            const orderData = isBuyNowFlow
                ? {
                    ...baseOrderData,
                    product_id: cartItems[0].product_id,
                    model_id: cartItems[0].model_id || null,
                    color_id: cartItems[0].color_id || null,
                    quantity: cartItems[0].quantity
                }
                : {
                    ...baseOrderData,
                    items: cartItems.map(item => ({
                        product_id: item.product_id,
                        model_id: item.model_id || null,
                        color_id: item.color_id || null,
                        quantity: item.quantity,
                        price: item.price
                    }))
                };

            const endpoint = isBuyNowFlow
                ? '/order/add-to-order'
                : '/order/place-order';

            const response = await axios.post(
                `${import.meta.env.VITE_SERVER_API}${endpoint}`,
                orderData,
                { headers: { Authorization: `Bearer ${getToken()}` } }
            );

            if (response.data.success) {
                toast.success('Order placed successfully!', {
                    position: "top-center",
                    autoClose: 3000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                });

                setTimeout(() => {
                    sessionStorage.setItem('orderInfo', JSON.stringify({
                        order: response.data.order,
                        address: addresses.find(a => a.address_id === selectedAddress),
                        isBuyNow: isBuyNowFlow
                    }));
                    window.location.href = '/order-confirmation';
                }, 3000);
            } else {
                throw new Error(response.data.error || 'Failed to place order');
            }
        } catch (error) {
            console.error('Order placement error:', error);
            let errorMessage = 'Failed to place order. Please try again.';
            
            if (error.response?.status === 400) {
                errorMessage = error.response.data.error || errorMessage;
            } else if (error.response?.status === 403) {
                errorMessage = 'Session expired. Please login again.';
            }

            toast.error(errorMessage, {
                position: "top-center",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
            });

            if (error.response?.status === 403) {
                setTimeout(() => {
                    navigate('/login', { state: { from: location.pathname } });
                }, 1500);
            }
        }
    };

    const handlePaymentMethodSelect = (method) => {
        setPaymentMethod(method);
    };

    if (cartItems.length === 0) {
        return (
            <div className="empty-cart-message">
                <h2>Your cart is empty</h2>
                <button onClick={() => navigate('/')}>Continue Shopping</button>
            </div>
        );
    }

    return (
        <div className="checkout-container">
            {isBuyNowFlow && (
                <div className="buy-now-notice">
                    <p>You're completing your purchase directly. This item won't be added to your cart.</p>
                </div>
            )}
            <div className="checkout-stepper">
                <div className={`step ${activeStep >= 1 ? 'active' : ''}`}>
                    <span>1</span>
                    <p>Address</p>
                </div>
                <div className={`step ${activeStep >= 2 ? 'active' : ''}`}>
                    <span>2</span>
                    <p>Review Order</p>
                </div>
                <div className={`step ${activeStep >= 3 ? 'active' : ''}`}>
                    <span>3</span>
                    <p>Payment</p>
                </div>
            </div>

            {(activeStep === 2 || activeStep === 3) && (
                <div className="top-navigation">
                    <button
                        className="back-to-address-btn"
                        onClick={() => setActiveStep(1)}
                    >
                        Back to Address
                    </button>
                    {activeStep === 3 && (
                        <button
                            className="back-to-review-btn"
                            onClick={() => setActiveStep(2)}
                        >
                            Back to Review
                        </button>
                    )}
                </div>
            )}

            {activeStep === 1 && (
                <div className="address-step">
                    <h2>Select Delivery Address</h2>

                    {loading ? (
                        <Loader/>
                    ) : error ? (
                        <div className="error">{error}</div>
                    ) : addresses.length > 0 ? (
                        <div className="address-list">
                            {addresses.map(address => (
                                <div
                                    key={address.address_id}
                                    className={`address-card ${selectedAddress === address.address_id ? 'selected' : ''}`}
                                    onClick={() => setSelectedAddress(address.address_id)}
                                >
                                    <h3>{address.name}</h3>
                                    <p>{address.address_line}, {address.locality}</p>
                                    <p>{address.city}, {address.state} - {address.pincode}</p>
                                    <p>Mobile: {address.mobile}</p>
                                    {address.landmark && <p>Landmark: {address.landmark}</p>}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="no-addresses">
                            <p>No saved addresses found</p>
                        </div>
                    )}

                    <div className="address-actions">
                        <button
                            className="add-address-btn"
                            onClick={() => setIsAddressModalOpen(true)}
                        >
                            Add New Address
                        </button>
                        {addresses.length > 0 && (
                            <button className="continue-btn" onClick={handleAddressSubmit}>
                                Continue
                            </button>
                        )}
                    </div>
                </div>
            )}

            {activeStep === 2 && (
                <div className="order-review-step">
                    <div className="order-summary">
                        <h2>Order Summary</h2>
                        <div className="order-items">
                            {cartItems.map(item => {
                                const originalPrice = item.original_price || item.price;
                                const hasDiscount = originalPrice > item.price;
                                const imageUrl = `${import.meta.env.VITE_SERVER_API}/static/${item.image}`;
                                const isVideo = item.image && /\.(mp4)$/i.test(item.image);

                                return (
                                    <div key={`${item.product_id}-${item.color || 'none'}-${item.model || 'none'}`} className="order-item">
                                        <div className="product-media-container">
                                            {isVideo ? (
                                                <video
                                                    className="media"
                                                    src={imageUrl}
                                                    autoPlay
                                                    muted
                                                    loop
                                                    playsInline
                                                    controls
                                                />
                                            ) : (
                                                <img
                                                    className="media"
                                                    src={imageUrl}
                                                    alt={item.name}
                                                    loading="lazy"
                                                    onError={(e) => {
                                                        console.error("Image failed to load for:", imageUrl);
                                                        e.target.src = '/fallback-image.jpg';
                                                    }}
                                                />
                                            )}
                                        </div>
                                        <div className="item-details">
                                            <h3>{item.name}</h3>
                                            {item.model && <p>{item.model}</p>}
                                            <p>Quantity: {item.quantity}</p>
                                            <div className="price-display">
                                                {hasDiscount ? (
                                                    <>
                                                        <span className="original-price">₹{(originalPrice * item.quantity).toFixed(2)}</span>
                                                        <span className="discounted-price">₹{(item.price * item.quantity).toFixed(2)}</span>
                                                        <span className="discount-badge">
                                                            Save ₹{((originalPrice - item.price) * item.quantity).toFixed(2)}
                                                        </span>
                                                    </>
                                                ) : (
                                                    <span className="price">₹{(item.price * item.quantity).toFixed(2)}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="price-breakdown">
                            <div className="price-row">
                                <span>Original Subtotal</span>
                                <span>₹{originalSubtotal.toFixed(2)}</span>
                            </div>
                            {totalDiscount > 0 && (
                                <div className="price-row discount-row">
                                    <span>Discount</span>
                                    <span>-₹{totalDiscount.toFixed(2)}</span>
                                </div>
                            )}
                            <div className="price-row">
                                <span>Subtotal</span>
                                <span>₹{subtotal.toFixed(2)}</span>
                            </div>
                            <div className="price-row">
                                <span>Delivery Charge</span>
                                <span>{deliveryCharge === 0 ? 'FREE' : `₹${deliveryCharge.toFixed(2)}`}</span>
                            </div>
                            <div className="price-row">
                                <span>Taxes</span>
                                <span>All taxes included (₹0)</span>
                            </div>
                            <div className="price-row total">
                                <span>Total</span>
                                <span>₹{total.toFixed(2)}</span>
                            </div>
                            {totalDiscount > 0 && (
                                <div className="savings-message">
                                    You're saving ₹{totalDiscount.toFixed(2)} on this order!
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="selected-address">
                        <h3>Delivery Address</h3>
                        {addresses.find(a => a.address_id === selectedAddress) && (
                            <div className="address-card">
                                <h3>{addresses.find(a => a.address_id === selectedAddress).name}</h3>
                                <p>{addresses.find(a => a.address_id === selectedAddress).address_line}</p>
                                <p>{addresses.find(a => a.address_id === selectedAddress).locality}</p>
                                <p>{addresses.find(a => a.address_id === selectedAddress).city}, {addresses.find(a => a.address_id === selectedAddress).state} - {addresses.find(a => a.address_id === selectedAddress).pincode}</p>
                                <p>Mobile: {addresses.find(a => a.address_id === selectedAddress).mobile}</p>
                            </div>
                        )}
                    </div>

                    <div className="order-actions">
                        <button className="back-btn" onClick={() => setActiveStep(1)}>
                            Back
                        </button>
                        <button className="proceed-btn" onClick={() => setActiveStep(3)}>
                            Proceed to Payment
                        </button>
                    </div>
                </div>
            )}

            {activeStep === 3 && (
                <div className="payment-step">
                    <h2>Payment Methods</h2>
                    <div className="payment-methods">
                        <button
                            className={`payment-option ${paymentMethod === 'UPI' ? 'selected' : ''}`}
                            onClick={() => handlePaymentMethodSelect('UPI')}
                        >
                            UPI Payment
                        </button>
                        <button
                            className={`payment-option ${paymentMethod === 'Cash on Delivery' ? 'selected' : ''}`}
                            onClick={() => handlePaymentMethodSelect('Cash on Delivery')}
                        >
                            Cash on Delivery
                        </button>
                    </div>

                    <div className="final-order-summary">
                        <h3>Order Total: ₹{total.toFixed(2)}</h3>
                        <p>Including delivery charge: {deliveryCharge === 0 ? 'FREE' : `₹${deliveryCharge.toFixed(2)}`}</p>

                        <div className="payment-actions">
                            <button className="back-to-review-btn" onClick={() => setActiveStep(2)}>
                                Back to Review
                            </button>
                            <button
                                className="place-order-btn"
                                onClick={() => handlePlaceOrder(false)}
                                disabled={!paymentMethod}
                            >
                                {paymentMethod === 'Cash on Delivery' ? 'Place Order' : 'Pay'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* UPI Payment Modal */}
            {isUPIModalOpen && (
                <div className="upi-modal-overlay">
                    <div className="upi-modal">
                        <div className="upi-modal-header">
                            <h3>Complete UPI Payment</h3>
                            <button onClick={() => setIsUPIModalOpen(false)}>×</button>
                        </div>
                        <div className="upi-modal-content">
                            <div className="upi-qr-code">
                                {/* Replace with your actual QR code image */}
                                <img src="/upi-qr-code.png" alt="UPI QR Code" />
                                <p>Scan this QR code to pay</p>
                            </div>
                            <div className="upi-payment-details">
                                <p>Amount to pay: <strong>₹{total.toFixed(2)}</strong></p>
                                <p>UPI ID: <strong>yourstore@upi</strong></p>
                                <p>Please complete the payment and then click the button below</p>
                            </div>
                            <button 
                                className="payment-done-btn"
                                onClick={() => {
                                    setIsUPIModalOpen(false);
                                    handlePlaceOrder(true);
                                }}
                            >
                                I've Completed the Payment
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ToastContainer
                position="top-center"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
            />

            <AddressModal
                isOpen={isAddressModalOpen}
                onClose={() => setIsAddressModalOpen(false)}
                onSave={handleSaveAddress}
                states={states}
            />
        </div>
    );
};

export default Checkout;