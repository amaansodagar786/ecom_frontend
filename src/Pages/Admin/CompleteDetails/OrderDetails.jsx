import React, { useState } from 'react';
import AdminLayout from '../AdminPanel/AdminLayout';
import './CompleteOrderDetails.scss';
import { useNavigate } from 'react-router-dom';

const OrderDetails = () => {
    const [orderId, setOrderId] = useState('');
    const [srNumber, setSrNumber] = useState('');
    const [orderData, setOrderData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [selectedSrNumber, setSelectedSrNumber] = useState(null);
    const [searchType, setSearchType] = useState('orderId');
    const navigate = useNavigate();

    const fetchOrderDetails = async () => {
        if ((searchType === 'orderId' && !orderId.trim()) ||
            (searchType === 'srNumber' && !srNumber.trim())) {
            setError(`Please enter a ${searchType === 'orderId' ? 'order ID' : 'serial number'}`);
            return;
        }

        setLoading(true);
        setError('');

        try {
            let apiUrl;
            if (searchType === 'orderId') {
                const encodedOrderId = encodeURIComponent(orderId);
                apiUrl = `${import.meta.env.VITE_SERVER_API}/order/${encodedOrderId}/get-all-info`;
            } else {
                const encodedSrNumber = encodeURIComponent(srNumber);
                apiUrl = `${import.meta.env.VITE_SERVER_API}/order/by-serial-number/${encodedSrNumber}`;
            }

            console.log('Making API request to:', apiUrl);

            const response = await fetch(apiUrl);
            const data = await response.json();

            console.log('API Response:', data);

            if (data.success) {
                setOrderData(data.data);
                if (searchType === 'srNumber') {
                    setSelectedSrNumber(srNumber);
                }
                
                console.group('Order Details Data');
                console.log('Order Info:', data.data?.order);
                console.log('Customer Info:', data.data?.customer);
                console.log('Address Info:', data.data?.address);
                console.log('Items:', data.data?.items);
                console.groupEnd();
            } else {
                setError(data.message || 'No data found');
                setOrderData(null);
            }
        } catch (err) {
            console.error('API Error:', err);
            setError('Failed to fetch details');
            setOrderData(null);
        } finally {
            setLoading(false);
        }
    };

    const handleSrNumberClick = (srNumber) => {
        setSelectedSrNumber(srNumber === selectedSrNumber ? null : srNumber);
    };

    const handleBackToOrders = () => {
        navigate('/admin/orders');
    };

    const handleNewSearch = () => {
        setOrderData(null);
        setOrderId('');
        setSrNumber('');
        setSelectedSrNumber(null);
    };

    const handleSearchTypeChange = (type) => {
        setSearchType(type);
        setOrderData(null);
        setError('');
        setSelectedSrNumber(null);
    };

    const filteredItems = orderData?.items?.filter(item => {
        if (searchType !== 'srNumber') return true;
        
        const hasSearchedSr = 
            item.serial_numbers?.some(sn => sn.sr_number === srNumber) ||
            item.details?.some(d => d.sr_no === srNumber);
        
        return hasSearchedSr;
    }) || [];

    // Delivery status stepper configuration
    const deliverySteps = [
        { id: 'pending', label: 'Pending' },
        { id: 'processing', label: 'Processing' },
        { id: 'intransit', label: 'In Transit' },
        { id: 'delivered', label: 'Delivered' }
    ];

    const currentDeliveryStatus = orderData?.order?.delivery_status || 'pending';
    const currentStepIndex = deliverySteps.findIndex(step => step.id === currentDeliveryStatus);

    const isOfflineOrder = orderData?.order?.channel === "offline";

    return (
        <AdminLayout>
            <div className="order-details-container">
                <div className="order-header">
                    <h1>Order Details</h1>
                    {orderData && (
                        <button onClick={handleNewSearch} className="new-search-button">
                            New Search
                        </button>
                    )}
                </div>

                <div className="search-type-toggle">
                    <button
                        className={`toggle-button ${searchType === 'orderId' ? 'active' : ''}`}
                        onClick={() => handleSearchTypeChange('orderId')}
                    >
                        Search by Order ID
                    </button>
                    <button
                        className={`toggle-button ${searchType === 'srNumber' ? 'active' : ''}`}
                        onClick={() => handleSearchTypeChange('srNumber')}
                    >
                        Search by Serial Number
                    </button>
                </div>

                <div className="order-search">
                    <div className="search-box">
                        {searchType === 'orderId' ? (
                            <input
                                type="text"
                                value={orderId}
                                onChange={(e) => setOrderId(e.target.value)}
                                placeholder="Enter Order ID"
                                className="search-input"
                                disabled={loading}
                            />
                        ) : (
                            <input
                                type="text"
                                value={srNumber}
                                onChange={(e) => setSrNumber(e.target.value)}
                                placeholder="Enter Serial Number"
                                className="search-input"
                                disabled={loading}
                            />
                        )}
                        <button
                            onClick={fetchOrderDetails}
                            className="search-button"
                            disabled={loading || (searchType === 'orderId' ? !orderId.trim() : !srNumber.trim())}
                        >
                            {loading ? (
                                <>
                                    <span className="spinner"></span> Loading...
                                </>
                            ) : (
                                'Search'
                            )}
                        </button>
                    </div>
                    {error && <div className="error-message">{error}</div>}
                </div>

                {orderData && (
                    <div className="order-content">
                        <div className="order-summary">
                            <div className="summary-card">
                                <h3>Order {orderData.order.order_id}</h3>
                                <div className="summary-grid">
                                    <div>
                                        <span>Date:</span>
                                        <strong>{new Date(orderData.order.created_at).toLocaleDateString()}</strong>
                                    </div>
                                    <div>
                                        <span>Status:</span>
                                        <strong className={`status-${(orderData.order.order_status || '').toLowerCase()}`}>
                                            {orderData.order.order_status}
                                        </strong>
                                    </div>
                                    <div>
                                        <span>Total:</span>
                                        <strong>₹{(orderData.order.total_amount || 0).toFixed(2)}</strong>
                                    </div>
                                    <div>
                                        <span>Items:</span>
                                        <strong>{orderData.order.total_items}</strong>
                                    </div>
                                </div>
                            </div>

                            <div className="customer-card">
                                <h3>Customer Details</h3>
                                <div className="customer-info">
                                    <p><strong>Name:</strong> {orderData.customer.name}</p>
                                    <p><strong>Email:</strong> {orderData.customer.email}</p>
                                    <p><strong>Phone:</strong> {orderData.customer.mobile || orderData.customer.phone}</p>
                                    <p><strong>Type:</strong> {orderData.customer.type === 'online' ? 'Online' : 'Offline'}</p>
                                    {orderData.customer.role && <p><strong>Role:</strong> {orderData.customer.role}</p>}
                                    {orderData.customer.gender && <p><strong>Gender:</strong> {orderData.customer.gender}</p>}
                                    {orderData.customer.age && <p><strong>Age:</strong> {orderData.customer.age}</p>}
                                </div>
                            </div>

                            <div className="address-card">
                                <h3>Shipping Address</h3>
                                <div className="address-info">
                                    <p>{orderData.address.name}</p>
                                    <p>{orderData.address.address_line || orderData.address.address_line1}</p>
                                    <p>{orderData.address.locality && `${orderData.address.locality}, `}{orderData.address.city}, {orderData.address.state_name || orderData.address.state}</p>
                                    <p>Postal Code: {orderData.address.pincode || orderData.address.postal_code}</p>
                                    <p>Phone: {orderData.address.mobile || orderData.address.phone}</p>
                                    {orderData.address.landmark && <p>Landmark: {orderData.address.landmark}</p>}
                                    {orderData.address.alternate_phone && <p>Alt. Phone: {orderData.address.alternate_phone}</p>}
                                </div>
                            </div>
                        </div>

                        <div className="order-items">
                            <h2>Order Items</h2>
                            {orderData.searched_serial_number && (
                                <div className="searched-sr-notice">
                                    Showing product with serial number: <strong>{orderData.searched_serial_number}</strong>
                                </div>
                            )}
                            <div className="items-table-container">
                                <table className="items-table">
                                    <thead>
                                        <tr>
                                            <th>Product</th>
                                            <th>Model</th>
                                            {isOfflineOrder && (
                                                <>
                                                    <th>Actual Price</th>
                                                    <th>Extra Discount</th>
                                                </>
                                            )}
                                            <th>Price per product</th>
                                            {searchType === 'orderId' ? (
                                                <>
                                                    <th>Qty</th>
                                                    <th>Total</th>
                                                </>
                                            ) : null}
                                            <th>Serial Numbers</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredItems.map((item) => {
                                            const actualPrice = item.color?.price || item.price || 0;
                                            const discountPercent = item.extra_item_discount_percent || 0;
                                            const discountAmount = (actualPrice * discountPercent / 100).toFixed(2);
                                            
                                            return (
                                                <React.Fragment key={item.item_id || item.product?.product_id}>
                                                    <tr className="item-row">
                                                        <td>
                                                            <div className="product-info">
                                                                <span className="product-name">{item.product?.name}</span>
                                                                {item.product?.sku_id && (
                                                                    <span className="product-sku">SKU: {item.product.sku_id}</span>
                                                                )}
                                                                {item.product?.product_type && (
                                                                    <span className="product-type">Type: {item.product.product_type}</span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td>
                                                            {item.model?.name || '-'}
                                                            {item.model?.specifications && (
                                                                <div className="specs">
                                                                    {Object.entries(item.model.specifications).map(([key, value]) => (
                                                                        <span key={key} className="spec-item">{key}: {value}</span>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </td>
                                                        
                                                        {isOfflineOrder && (
                                                            <>
                                                                <td>₹{actualPrice.toFixed(2)}</td>
                                                                <td>
                                                                    {discountPercent}%<br />
                                                                    (₹{discountAmount})
                                                                </td>
                                                            </>
                                                        )}
                                                        
                                                        <td>₹{(item.unit_price || 0).toFixed(2)}</td>
                                                        
                                                        {searchType === 'orderId' && (
                                                            <>
                                                                <td>{item.quantity}</td>
                                                                <td>₹{(item.total_price || 0).toFixed(2)}</td>
                                                            </>
                                                        )}
                                                        
                                                        <td>
                                                            {searchType === 'srNumber' ? (
                                                                <span className="sr-number active">
                                                                    {srNumber}
                                                                </span>
                                                            ) : (
                                                                <>
                                                                    {item.serial_numbers?.length > 0 ? (
                                                                        <div className="serial-numbers">
                                                                            {item.serial_numbers.map((sn) => (
                                                                                <span
                                                                                    key={sn.id}
                                                                                    className={`sr-number ${selectedSrNumber === sn.sr_number ? 'active' : ''}`}
                                                                                    onClick={() => handleSrNumberClick(sn.sr_number)}
                                                                                >
                                                                                    {sn.sr_number}
                                                                                </span>
                                                                            ))}
                                                                        </div>
                                                                    ) : (
                                                                        <span className="no-serial"></span>
                                                                    )}
                                                                    {item.details?.length > 0 && (
                                                                        <div className="serial-numbers">
                                                                            {item.details.map((detail) => (
                                                                                <span
                                                                                    key={detail.id}
                                                                                    className={`sr-number ${selectedSrNumber === detail.sr_no ? 'active' : ''}`}
                                                                                    onClick={() => handleSrNumberClick(detail.sr_no)}
                                                                                >
                                                                                    {detail.sr_no}
                                                                                </span>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                </>
                                                            )}
                                                        </td>
                                                    </tr>
                                                    {selectedSrNumber && (
                                                        (item.serial_numbers?.some(sn => sn.sr_number === selectedSrNumber) ||
                                                            item.details?.some(d => d.sr_no === selectedSrNumber)
                                                    ) ? (
                                                        <tr className="sr-details-row">
                                                            <td colSpan={searchType === 'orderId' ? (isOfflineOrder ? "8" : "6") : (isOfflineOrder ? "6" : "4")}>
                                                                <div className="sr-details">
                                                                    <h4>Serial Number Details: {selectedSrNumber}</h4>
                                                                    <div className="details-grid">
                                                                        <div>
                                                                            <h5>Product Information</h5>
                                                                            <p><strong>Name:</strong> {item.product?.name || 'N/A'}</p>
                                                                            <p><strong>SKU:</strong> {item.product?.sku_id || 'N/A'}</p>
                                                                            <p><strong>Type:</strong> {item.product?.product_type || 'N/A'}</p>
                                                                            {item.product?.category_id && (
                                                                                <p><strong>Category ID:</strong> {item.product.category_id}</p>
                                                                            )}
                                                                            {isOfflineOrder && (
                                                                                <>
                                                                                    <p><strong>Actual Price:</strong> ₹{actualPrice.toFixed(2)}</p>
                                                                                    <p><strong>Extra Discount:</strong> {discountPercent}% (₹{discountAmount})</p>
                                                                                </>
                                                                            )}
                                                                        </div>
                                                                        <div>
                                                                            <h5>Customer Information</h5>
                                                                            <p><strong>Name:</strong> {orderData.customer.name}</p>
                                                                            <p><strong>Contact:</strong> {orderData.customer.mobile || orderData.customer.phone}</p>
                                                                            <p><strong>Email:</strong> {orderData.customer.email}</p>
                                                                        </div>
                                                                        <div>
                                                                            <h5>Order Information</h5>
                                                                            <p><strong>Order ID:</strong> {orderData.order.order_id}</p>
                                                                            <p><strong>Order Date:</strong> {new Date(orderData.order.created_at).toLocaleDateString()}</p>
                                                                            <p><strong>Status:</strong> {orderData.order.order_status}</p>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ) : null)}
                                                </React.Fragment>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="order-history">
                            <h2>Delivery Status</h2>
                            <div className="delivery-stepper">
                                {deliverySteps.map((step, index) => (
                                    <div 
                                        key={step.id}
                                        className={`stepper-step ${index < currentStepIndex ? 'completed' : ''} ${index === currentStepIndex ? 'active' : ''}`}
                                    >
                                        <div className="step-icon">
                                            {index < currentStepIndex ? (
                                                <span className="completed-icon">✓</span>
                                            ) : (
                                                <span className="step-number">{index + 1}</span>
                                            )}
                                        </div>
                                        <div className="step-label">{step.label}</div>
                                        {index < deliverySteps.length - 1 && (
                                            <div className={`step-connector ${index < currentStepIndex ? 'completed' : ''}`}></div>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <div className="current-status">
                                Current Status: <strong className={`status-${currentDeliveryStatus}`}>
                                    {currentDeliveryStatus.charAt(0).toUpperCase() + currentDeliveryStatus.slice(1)}
                                </strong>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};

export default OrderDetails;