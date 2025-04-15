import React, { useState } from 'react';
import AdminLayout from '../AdminPanel/AdminLayout';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './NewOrders.scss';

const NewOrders = () => {
    // State for products from API
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [categories, setCategories] = useState([]);
    // Dummy product data
    // const dummyProducts = [
    //     {
    //         id: 1,
    //         name: 'Wireless Headphones',
    //         image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e',
    //         stock: 50,
    //         price: 99.99
    //     },
    //     {
    //         id: 2,
    //         name: 'Smart Watch',
    //         image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30',
    //         stock: 30,
    //         price: 199.99
    //     },
    //     {
    //         id: 3,
    //         name: 'Bluetooth Speaker',
    //         image: 'https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb',
    //         stock: 45,
    //         price: 79.99
    //     },
    //     {
    //         id: 4,
    //         name: 'Laptop Backpack',
    //         image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62',
    //         stock: 60,
    //         price: 49.99
    //     },
    //     {
    //         id: 5,
    //         name: 'Wireless Mouse',
    //         image: 'https://images.unsplash.com/photo-1527814050087-3793815479db',
    //         stock: 100,
    //         price: 29.99
    //     }
    // ];

    // Dummy customer data with separate pincode
    const dummyCustomers = [
        {
            id: 1,
            name: 'Rahul Sharma',
            phone: '9876543210',
            email: 'rahul@example.com',
            address: '123 Main St, Bangalore, Karnataka',
            pincode: '560001'
        },
        {
            id: 2,
            name: 'Priya Patel',
            phone: '8765432109',
            email: 'priya@example.com',
            address: '456 Oak Ave, Mumbai, Maharashtra',
            pincode: '400001'
        },
        {
            id: 3,
            name: 'Amit Singh',
            phone: '7654321098',
            email: 'amit@example.com',
            address: '789 Pine Rd, Delhi',
            pincode: '110001'
        },
        {
            id: 4,
            name: 'Neha Gupta',
            phone: '6543210987',
            email: 'neha@example.com',
            address: '321 Elm St, Hyderabad, Telangana',
            pincode: '500001'
        },
        {
            id: 5,
            name: 'Vikram Joshi',
            phone: '5432109876',
            email: 'vikram@example.com',
            address: '654 Maple Ave, Pune, Maharashtra',
            pincode: '411001'
        }
    ];

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [customerSearchTerm, setCustomerSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [newCustomer, setNewCustomer] = useState({
        name: '',
        phone: '',
        email: '',
        address: '',
        pincode: ''
    });


    // Fetch products from API
    // Fetch products from API
useEffect(() => {
    const fetchProducts = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_SERVER_API}/api/products`);
            setProducts(response.data);
            
            // Extract unique categories
            const uniqueCategories = [...new Set(
                response.data.map(p => p.category).filter(Boolean)
            )];
            setCategories(['all', ...uniqueCategories]);
            setIsLoading(false);
        } catch (error) {
            console.error('Error fetching products:', error);
            setIsLoading(false);
        }
    };
    
    fetchProducts();
}, []);


    // Helper functions
    const showErrorToast = (message) => {
        toast.error(message, {
            position: "top-right",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
        });
    };

    const handlePlaceOrder = () => {
        if (selectedProducts.length === 0) {
            showErrorToast('Please select at least one product');
            return;
        }

        if (!selectedCustomer) {
            showErrorToast('Please select a customer');
            return;
        }

        const orderData = {
            customer: selectedCustomer,
            products: selectedProducts.map(product => ({
                id: product.id,
                name: product.name,
                quantity: product.quantity,
                originalPrice: product.price,
                finalPrice: product.finalPrice,
                discountPercentage: product.discountPercentage
            })),
            subtotal: calculateSubtotal(),
            discount: calculateTotalDiscount(),
            deliveryCharge: calculateDeliveryCharge(calculateSubtotal()),
            total: calculateSubtotal() + calculateDeliveryCharge(calculateSubtotal()),
            date: new Date().toISOString()
        };

        console.log('Order Details:', orderData);

        toast.success('Order placed successfully!', {
            position: "top-right",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
        });
    };

    const handleModalClose = (e) => {
        if (e.target === e.currentTarget) {
            setIsModalOpen(false);
        }
    };

    const toggleProductSelection = (product) => {
        setSelectedProducts(prev => {
            const isSelected = prev.some(p => p.id === product.id);
            if (isSelected) {
                return prev.filter(p => p.id !== product.id);
            } else {
                return [...prev, {
                    ...product,
                    finalPrice: product.price,
                    discountPercentage: 0,
                    quantity: 1
                }];
            }
        });
    };

    const handleQuantityChange = (id, newQuantity) => {
        const quantity = Math.max(1, Math.min(
            dummyProducts.find(p => p.id === id).stock,
            parseInt(newQuantity) || 1
        ));

        setSelectedProducts(prev =>
            prev.map(product =>
                product.id === id
                    ? { ...product, quantity }
                    : product
            )
        );
    };

    const handlePriceChange = (id, newPrice) => {
        setSelectedProducts(prev =>
            prev.map(product =>
                product.id === id
                    ? {
                        ...product,
                        finalPrice: parseFloat(newPrice) || 0,
                        discountPercentage: calculateDiscountPercentage(product.price, newPrice)
                    }
                    : product
            )
        );
    };

    const handleDiscountPercentageChange = (id, percentage) => {
        const perc = Math.min(100, Math.max(0, parseFloat(percentage) || 0));
        setSelectedProducts(prev =>
            prev.map(product =>
                product.id === id
                    ? {
                        ...product,
                        discountPercentage: perc,
                        finalPrice: product.price * (1 - perc / 100)
                    }
                    : product
            )
        );
    };

    const calculateDiscountPercentage = (originalPrice, finalPrice) => {
        return ((originalPrice - finalPrice) / originalPrice * 100).toFixed(2);
    };

    const calculateSubtotal = () => {
        return selectedProducts.reduce(
            (sum, product) => sum + (product.finalPrice * product.quantity),
            0
        );
    };

    const calculateTotalDiscount = () => {
        return selectedProducts.reduce(
            (total, product) => total + (
                (product.price - product.finalPrice) * product.quantity
            ),
            0
        );
    };

    const removeProduct = (id) => {
        setSelectedProducts(prev => prev.filter(product => product.id !== id));
    };

    const calculateDeliveryCharge = (subtotal) => {
        if (subtotal <= 999) return 0;
        if (subtotal <= 5000) return 90;
        if (subtotal <= 10000) return 180;
        if (subtotal <= 20000) return 240;
        if (subtotal <= 30000) return 560;
        return 850;
    };

    const handleCustomerSelect = (customer) => {
        setSelectedCustomer(customer);
        setIsCustomerModalOpen(false);
    };

    const handleNewCustomerChange = (e) => {
        const { name, value } = e.target;
        setNewCustomer(prev => ({ ...prev, [name]: value }));
    };

    const handleAddNewCustomer = () => {
        if (newCustomer.name && newCustomer.phone && newCustomer.address && newCustomer.pincode) {
            const customer = {
                id: Date.now(),
                ...newCustomer
            };
            setSelectedCustomer(customer);
            setNewCustomer({ name: '', phone: '', email: '', address: '', pincode: '' });
            setIsCustomerModalOpen(false);
        }
    };

    return (
        <AdminLayout>
            <ToastContainer />
            <div className="offline-orders-container">
                <div className="orders-filter-bar">
                    <div className="search-products-input">
                        <input
                            type="text"
                            placeholder="Search products..."
                            className="search-input"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onClick={() => setIsModalOpen(true)}
                        />
                        <button
                            className="browse-products-btn"
                            onClick={() => setIsModalOpen(true)}
                        >
                            Browse Products
                        </button>
                    </div>

                    <div className="customer-search-input">
                        <input
                            type="text"
                            placeholder="Search customer..."
                            className="search-input"
                            value={customerSearchTerm}
                            onChange={(e) => setCustomerSearchTerm(e.target.value)}
                            onClick={() => setIsCustomerModalOpen(true)}
                        />
                        <button
                            className="browse-customer-btn"
                            onClick={() => setIsCustomerModalOpen(true)}
                        >
                            {selectedCustomer ? 'Change Customer' : 'Select Customer'}
                        </button>
                    </div>
                </div>

                <div className="selected-products-list">
                    {selectedProducts.length === 0 ? (
                        <div className="no-products-selected">
                            <p>No products selected. Click "Browse Products" to add items.</p>
                        </div>
                    ) : (
                        selectedProducts.map(product => {
                            const availableStock = dummyProducts.find(p => p.id === product.id)?.stock || 0;
                            return (
                                <div key={product.id} className="selected-product-item">
                                    <div className="product-image">
                                        <img src={product.image} alt={product.name} />
                                    </div>
                                    <div className="product-details">
                                        <h4 className="product-name">{product.name}</h4>
                                        <div className="stock-info">Available: {availableStock}</div>
                                        <div className="quantity-control">
                                            <label>Qty:</label>
                                            <input
                                                type="number"
                                                min="1"
                                                max={availableStock}
                                                value={product.quantity}
                                                onChange={(e) => handleQuantityChange(product.id, e.target.value)}
                                                className="quantity-input"
                                            />
                                        </div>
                                    </div>
                                    <div className="price-editor">
                                        <div className="original-price">₹{product.price.toFixed(2)}</div>
                                        <div className="price-edit-options">
                                            <div className="discount-option">
                                                <label>Discount %</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    className="discount-percentage-input"
                                                    value={product.discountPercentage || 0}
                                                    onChange={(e) => handleDiscountPercentageChange(product.id, e.target.value)}
                                                />
                                            </div>
                                            <div className="manual-price-option">
                                                <label>Final Price</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    className="final-price-input"
                                                    value={product.finalPrice || product.price}
                                                    onChange={(e) => handlePriceChange(product.id, e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        className="remove-product-btn"
                                        onClick={() => removeProduct(product.id)}
                                    >
                                        ×
                                    </button>
                                </div>
                            );
                        })
                    )}
                </div>

                {selectedCustomer && (
                    <div className="customer-details-section">
                        <h3 className="section-title">Customer Details</h3>
                        <div className="customer-details">
                            <div className="detail-row">
                                <span className="detail-label">Name:</span>
                                <span className="detail-value">{selectedCustomer.name}</span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Phone:</span>
                                <span className="detail-value">{selectedCustomer.phone}</span>
                            </div>
                            {selectedCustomer.email && (
                                <div className="detail-row">
                                    <span className="detail-label">Email:</span>
                                    <span className="detail-value">{selectedCustomer.email}</span>
                                </div>
                            )}
                            <div className="detail-row">
                                <span className="detail-label">Address:</span>
                                <span className="detail-value">{selectedCustomer.address}</span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Pincode:</span>
                                <span className="detail-value">{selectedCustomer.pincode}</span>
                            </div>
                        </div>
                    </div>
                )}

                {selectedProducts.length > 0 && (
                    <div className="payment-summary">
                        <h3 className="summary-title">Payment Summary</h3>
                        <div className="summary-row">
                            <span>Subtotal ({selectedProducts.reduce((sum, p) => sum + p.quantity, 0)} items):</span>
                            <span>₹{calculateSubtotal().toFixed(2)}</span>
                        </div>
                        <div className="summary-row discount-row">
                            <span>Discount:</span>
                            <span>-₹{calculateTotalDiscount().toFixed(2)}</span>
                        </div>
                        <div className="summary-row">
                            <span>Tax (Included):</span>
                            <span>₹0.00</span>
                        </div>
                        <div className="summary-row">
                            <span>Delivery Charge:</span>
                            <span>₹{calculateDeliveryCharge(calculateSubtotal()).toFixed(2)}</span>
                        </div>
                        <div className="summary-row total-row">
                            <span>Total:</span>
                            <span>₹{(calculateSubtotal() + calculateDeliveryCharge(calculateSubtotal())).toFixed(2)}</span>
                        </div>
                        <button
                            className="place-order-btn"
                            onClick={handlePlaceOrder}
                        >
                            Place Order
                        </button>
                    </div>
                )}

                {isModalOpen && (
                    <div className="product-selection-modal" onClick={handleModalClose}>
                        <div className="modal-overlay"></div>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3>Select Products</h3>
                                <button
                                    className="close-modal-btn"
                                    onClick={() => setIsModalOpen(false)}
                                >
                                    ×
                                </button>
                            </div>
                            <div className="modal-body">
                                <div className="product-search-section">
                                    <input
                                        type="text"
                                        placeholder="Search products..."
                                        className="modal-search-input"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                    <div className="product-list">
                                        {dummyProducts
                                            .filter(product =>
                                                product.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
                                                (selectedCategory === 'all' ||
                                                    product.category === selectedCategory)
                                            )
                                            .map(product => (
                                                <div key={product.id} className="product-list-item">
                                                    <div className="product-select-checkbox">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedProducts.some(p => p.id === product.id)}
                                                            onChange={() => toggleProductSelection(product)}
                                                        />
                                                    </div>
                                                    <div className="product-image">
                                                        <img src={product.image} alt={product.name} />
                                                    </div>
                                                    <div className="product-info">
                                                        <label>{product.name}</label>
                                                        <div className="product-price-stock">
                                                            <span>₹{product.price.toFixed(2)}</span>
                                                            <span>Stock: {product.stock}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                </div>
                                <div className="category-filter-section">
                                    <h4>Categories</h4>
                                    <ul className="category-list">
                                        {['all', 'Electronics', 'Accessories', 'Bags', 'Others'].map(category => (
                                            <li
                                                key={category}
                                                className={`category-item ${selectedCategory === category.toLowerCase() ? 'active' : ''}`}
                                                onClick={() => setSelectedCategory(category.toLowerCase())}
                                            >
                                                {category}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button
                                    className="cancel-btn"
                                    onClick={() => setIsModalOpen(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="add-products-btn"
                                    onClick={() => setIsModalOpen(false)}
                                >
                                    Add Selected Products
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {isCustomerModalOpen && (
                    <div className="customer-selection-modal" onClick={() => setIsCustomerModalOpen(false)}>
                        <div className="modal-overlay"></div>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3>{selectedCustomer ? 'Change Customer' : 'Select Customer'}</h3>
                                <button
                                    className="close-modal-btn"
                                    onClick={() => setIsCustomerModalOpen(false)}
                                >
                                    ×
                                </button>
                            </div>
                            <div className="modal-body">
                                <div className="search-section">
                                    <input
                                        type="text"
                                        placeholder="Search customers..."
                                        className="modal-search-input"
                                        value={customerSearchTerm}
                                        onChange={(e) => setCustomerSearchTerm(e.target.value)}
                                    />
                                </div>

                                <div className="customer-list">
                                    {dummyCustomers
                                        .filter(customer =>
                                            customer.name.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
                                            customer.phone.includes(customerSearchTerm)
                                        )
                                        .map(customer => (
                                            <div
                                                key={customer.id}
                                                className={`customer-list-item ${selectedCustomer?.id === customer.id ? 'selected' : ''}`}
                                                onClick={() => handleCustomerSelect(customer)}
                                            >
                                                <div className="customer-info">
                                                    <h4>{customer.name}</h4>
                                                    <div className="customer-contact">
                                                        <span>{customer.phone}</span>
                                                        {customer.email && <span>{customer.email}</span>}
                                                    </div>
                                                    <div className="customer-address">
                                                        {customer.address}, {customer.pincode}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                </div>

                                <div className="new-customer-section">
                                    <h4>Add New Customer</h4>
                                    <div className="new-customer-form">
                                        <div className="form-group">
                                            <label>Name*</label>
                                            <input
                                                type="text"
                                                name="name"
                                                value={newCustomer.name}
                                                onChange={handleNewCustomerChange}
                                                placeholder="Full Name"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Phone*</label>
                                            <input
                                                type="text"
                                                name="phone"
                                                value={newCustomer.phone}
                                                onChange={handleNewCustomerChange}
                                                placeholder="Phone Number"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Email</label>
                                            <input
                                                type="email"
                                                name="email"
                                                value={newCustomer.email}
                                                onChange={handleNewCustomerChange}
                                                placeholder="Email (optional)"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Address*</label>
                                            <textarea
                                                name="address"
                                                value={newCustomer.address}
                                                onChange={handleNewCustomerChange}
                                                placeholder="Full Address"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Pincode*</label>
                                            <input
                                                type="text"
                                                name="pincode"
                                                value={newCustomer.pincode}
                                                onChange={handleNewCustomerChange}
                                                placeholder="Pincode"
                                            />
                                        </div>
                                        <button
                                            className="add-customer-btn"
                                            onClick={handleAddNewCustomer}
                                            disabled={!newCustomer.name || !newCustomer.phone || !newCustomer.address || !newCustomer.pincode}
                                        >
                                            Add Customer
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};

export default NewOrders;