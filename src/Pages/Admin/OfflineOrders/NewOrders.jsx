import React, { useState, useEffect } from 'react';
import AdminLayout from '../AdminPanel/AdminLayout';
import { ToastContainer, toast } from 'react-toastify';
import axios from 'axios';
import 'react-toastify/dist/ReactToastify.css';
import './NewOrders.scss';
import { FaChevronRight, FaCheck } from 'react-icons/fa';

const NewOrders = () => {
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [categories, setCategories] = useState([]);
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
    const [selectionStep, setSelectionStep] = useState('product'); // 'product', 'model', 'color'
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [selectedModel, setSelectedModel] = useState(null);
    const [selectedColors, setSelectedColors] = useState([]);
    const [tempSelections, setTempSelections] = useState([]);

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

    // Fetch products from API
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_SERVER_API}/products`);
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
                name: product.full_name,
                quantity: product.quantity,
                originalPrice: product.original_price,
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

    const handleProductSelect = (product) => {
        setSelectedProduct(product);
        if (product.product_type === 'single') {
            setSelectionStep('color');
            setSelectedModel(null);
        } else {
            setSelectionStep('model');
            // setSelectedColors(null);
            setSelectedColors([]);
        }
    };

    const handleModelSelect = (model) => {
        setSelectedModel(model);
        setSelectionStep('color');
    };

    const handleColorSelect = (color) => {
        setSelectedColors(prev => {
            const isSelected = prev.some(c => c.color_id === color.color_id);
            if (isSelected) {
                return prev.filter(c => c.color_id !== color.color_id);
            } else {
                return [...prev, color];
            }
        });
    };

    const handleAddSelection = () => {
        if (!selectedProduct) return;

        // For single product type with multiple colors
        if (selectedProduct.product_type === 'single' && selectedColors.length > 0) {
            const newSelections = selectedColors.map(color => ({
                id: color.color_id,
                product_id: selectedProduct.product_id,
                type: 'single',
                name: selectedProduct.name,
                color_name: color.name,
                full_name: `${selectedProduct.name} - ${color.name}`,
                image: color.images?.[0]?.image_url
                    ? `${import.meta.env.VITE_SERVER_API}/${color.images[0].image_url}`
                    : selectedProduct.images?.[0]?.image_url
                        ? `${import.meta.env.VITE_SERVER_API}/${selectedProduct.images[0].image_url}`
                        : '/placeholder-product.png',
                stock: color.stock_quantity,
                price: color.price,
                original_price: color.original_price || color.price,
                category: selectedProduct.category,
                specifications: selectedProduct.specifications
            }));

            setSelectedProducts(prev => {
                // Filter out existing selections to avoid duplicates
                const existingIds = prev.map(p => p.id);
                const newItems = newSelections.filter(item => !existingIds.includes(item.id));

                return [
                    ...prev,
                    ...newItems.map(item => ({
                        ...item,
                        finalPrice: item.price,
                        discountPercentage: 0,
                        quantity: 1
                    }))
                ];
            });
        }
        // For variable product type with model and colors
        else if (selectedModel && selectedColors.length > 0) {
            const newSelections = selectedColors.map(color => ({
                id: `${selectedModel.model_id}-${color.color_id}`,
                product_id: selectedProduct.product_id,
                model_id: selectedModel.model_id,
                type: 'variable',
                name: `${selectedProduct.name} - ${selectedModel.name}`,
                color_name: color.name,
                full_name: `${selectedProduct.name} - ${selectedModel.name} - ${color.name}`,
                image: color.images?.[0]?.image_url
                    ? `${import.meta.env.VITE_SERVER_API}/${color.images[0].image_url}`
                    : selectedModel.images?.[0]?.image_url
                        ? `${import.meta.env.VITE_SERVER_API}/${selectedModel.images[0].image_url}`
                        : selectedProduct.images?.[0]?.image_url
                            ? `${import.meta.env.VITE_SERVER_API}/${selectedProduct.images[0].image_url}`
                            : '/placeholder-product.png',
                stock: color.stock_quantity,
                price: color.price,
                original_price: color.original_price || color.price,
                category: selectedProduct.category,
                specifications: [...selectedProduct.specifications, ...selectedModel.specifications]
            }));

            setSelectedProducts(prev => {
                // Filter out existing selections to avoid duplicates
                const existingIds = prev.map(p => p.id);
                const newItems = newSelections.filter(item => !existingIds.includes(item.id));

                return [
                    ...prev,
                    ...newItems.map(item => ({
                        ...item,
                        finalPrice: item.price,
                        discountPercentage: 0,
                        quantity: 1
                    }))
                ];
            });
        }

        // Reset selection process
        setSelectionStep('product');
        setSelectedProduct(null);
        setSelectedModel(null);
        setSelectedColors([]);
    };

    const handleModalClose = (e) => {
        if (e.target === e.currentTarget) {
            setIsModalOpen(false);
            setSelectionStep('product');
            setSelectedProduct(null);
            setSelectedModel(null);
            setSelectedColor(null);
        }
    };

    const handleQuantityChange = (id, newQuantity) => {
        const product = selectedProducts.find(p => p.id === id);
        if (!product) return;

        const quantity = Math.max(1, Math.min(
            product.stock,
            parseInt(newQuantity) || 1
        ));

        setSelectedProducts(prev =>
            prev.map(p =>
                p.id === id
                    ? { ...p, quantity }
                    : p
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

    const renderProductSelection = () => {
        return (
            <div className="product-list">
                {products
                    .filter(product => {
                        const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
                        const matchesCategory = selectedCategory === 'all' ||
                            (product.category &&
                                product.category.toLowerCase() === selectedCategory.toLowerCase());
                        return matchesSearch && matchesCategory;
                    })
                    .map(product => (
                        <div
                            key={product.product_id}
                            className="product-list-item"
                            onClick={() => handleProductSelect(product)}
                        >
                            <div className="product-select-box"></div>
                            <div className="product-image">
                                <img
                                    src={product.images?.[0]?.image_url
                                        ? `${import.meta.env.VITE_SERVER_API}/${product.images[0].image_url}`
                                        : '/placeholder-product.png'}
                                    alt={product.name}
                                />
                            </div>
                            <div className="product-info">
                                <label>{product.name}</label>
                                <div className="product-type">
                                    {product.product_type === 'single' ? 'Single Product' : 'Variable Product'}
                                </div>
                                {product.specifications && product.specifications.length > 0 && (
                                    <div className="product-specs">
                                        {product.specifications.slice(0, 2).map(spec => (
                                            <span key={spec.spec_id}>{spec.key}: {spec.value}</span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
            </div>
        );
    };

    const renderModelSelection = () => {
        if (!selectedProduct || selectedProduct.product_type !== 'variable') return null;

        return (
            <div className="model-selection">
                <button
                    className="back-button"
                    onClick={() => setSelectionStep('product')}
                >
                    ← Back to Products
                </button>
                <h4>Select Model for {selectedProduct.name}</h4>
                <div className="model-list" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    {selectedProduct.models.map(model => (
                        <div
                            key={model.model_id}
                            className={`model-item ${selectedModel?.model_id === model.model_id ? 'selected' : ''}`}
                            onClick={() => handleModelSelect(model)}
                        >
                            <div className="model-select-box">
                                {selectedModel?.model_id === model.model_id && <FaCheck className="check-icon" />}
                            </div>
                            <div className="model-image">
                                <img
                                    src={model.images?.[0]?.image_url
                                        ? `${import.meta.env.VITE_SERVER_API}/${model.images[0].image_url}`
                                        : selectedProduct.images?.[0]?.image_url
                                            ? `${import.meta.env.VITE_SERVER_API}/${selectedProduct.images[0].image_url}`
                                            : '/placeholder-product.png'}
                                    alt={model.name}
                                />
                            </div>
                            <div className="model-info">
                                <h5>{model.name}</h5>
                                <div className="model-specs">
                                    {model.specifications?.map(spec => (
                                        <span key={spec.spec_id}>{spec.key}: {spec.value}</span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="selection-actions">
                    <button
                        className="cancel-btn"
                        onClick={() => {
                            setSelectionStep('product');
                            setSelectedModel(null);
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        className="confirm-btn"
                        onClick={() => {
                            if (selectedModel) {
                                setSelectionStep('color');
                            } else {
                                showErrorToast('Please select a model');
                            }
                        }}
                        disabled={!selectedModel}
                    >
                        Next: Select Color
                    </button>
                </div>
            </div>
        );
    };

    const renderColorSelection = () => {
        if (!selectedProduct) return null;
    
        let colors = [];
        if (selectedProduct.product_type === 'single') {
            colors = selectedProduct.colors;
        } else if (selectedModel) {
            colors = selectedModel.colors;
        } else {
            return null;
        }
    
        return (
            <div className="color-selection">
                <button
                    className="back-button"
                    onClick={() => {
                        selectedProduct.product_type === 'single'
                            ? setSelectionStep('product')
                            : setSelectionStep('model');
                        setSelectedColors([]);
                    }}
                >
                    ← Back to {selectedProduct.product_type === 'single' ? 'Products' : 'Models'}
                </button>
                <h4>
                    Select Color for {selectedProduct.name}
                    {selectedModel && ` - ${selectedModel.name}`}
                </h4>
                <div className="color-list" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    {colors.map(color => {
                        // Determine the image source with proper fallbacks
                        const imageSrc = color.images?.[0]?.image_url
                            ? `${import.meta.env.VITE_SERVER_API}/${color.images[0].image_url}`
                            : selectedModel?.images?.[0]?.image_url
                                ? `${import.meta.env.VITE_SERVER_API}/${selectedModel.images[0].image_url}`
                                : selectedProduct.images?.[0]?.image_url
                                    ? `${import.meta.env.VITE_SERVER_API}/${selectedProduct.images[0].image_url}`
                                    : '/placeholder-product.png';
    
                        return (
                            <div
                                key={color.color_id}
                                className={`color-item ${color.stock_quantity <= 0 ? 'out-of-stock' : ''} ${
                                    selectedColors.some(c => c.color_id === color.color_id) ? 'selected' : ''
                                }`}
                                onClick={() => color.stock_quantity > 0 && handleColorSelect(color)}
                            >
                                <div className="color-select-box">
                                    {selectedColors.some(c => c.color_id === color.color_id) && (
                                        <FaCheck className="check-icon" />
                                    )}
                                </div>
                                <div className="color-image-container">
                                    <img 
                                        src={imageSrc} 
                                        alt={color.name}
                                        className="color-image"
                                    />
                                </div>
                                <div className="color-swatch" style={{ backgroundColor: color.hex_code || '#ccc' }}></div>
                                <div className="color-info">
                                    <span>{color.name}</span>
                                    <span>₹{color.price.toFixed(2)}</span>
                                    <span className="stock-info">
                                        {color.stock_quantity <= 0 ? 'Out of stock' : `Stock: ${color.stock_quantity}`}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
                <div className="selection-actions">
                    <button
                        className="cancel-btn"
                        onClick={() => {
                            selectedProduct.product_type === 'single'
                                ? setSelectionStep('product')
                                : setSelectionStep('model');
                            setSelectedColors([]);
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        className="confirm-btn"
                        onClick={() => {
                            if (selectedColors.length > 0) {
                                handleAddSelection();
                                setIsModalOpen(false);
                            } else {
                                showErrorToast('Please select at least one color');
                            }
                        }}
                        disabled={selectedColors.length === 0}
                    >
                        {selectedColors.length > 1 ? 'Add All to Order' : 'Add to Order'}
                    </button>
                </div>
            </div>
        );
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
            // const imageUrl = `${import.meta.env.VITE_SERVER_API}/${product.image}`;
            const imageUrl = product.image;

            console.log('Image URL:', imageUrl); // ✅ Log image URL here

            return (
                <div key={product.id} className="selected-product-item">
                    <div className="product-image">
                        <img src={imageUrl} alt={product.full_name} />
                    </div>
                    <div className="product-details">
                        <h4 className="product-name">{product.full_name}</h4>
                        <div className="stock-info">Available: {product.stock}</div>
                        <div className="quantity-control">
                            <label>Qty:</label>
                            <input
                                type="number"
                                min="1"
                                max={product.stock}
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
                                <h3>
                                    {selectionStep === 'product' && 'Select Products'}
                                    {selectionStep === 'model' && 'Select Model'}
                                    {selectionStep === 'color' && 'Select Color'}
                                </h3>
                                <button
                                    className="close-modal-btn"
                                    onClick={() => {
                                        setIsModalOpen(false);
                                        setSelectionStep('product');
                                        setSelectedProduct(null);
                                        setSelectedModel(null);
                                        setSelectedColor(null);
                                    }}
                                >
                                    ×
                                </button>
                            </div>
                            <div className="modal-body">
                                {selectionStep === 'product' && (
                                    <>
                                        <div className="product-search-section">
                                            <input
                                                type="text"
                                                placeholder="Search products..."
                                                className="modal-search-input"
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                            />
                                            {isLoading ? (
                                                <div className="loading-products">Loading products...</div>
                                            ) : renderProductSelection()}
                                        </div>
                                        <div className="category-filter-section">
                                            <h4>Categories</h4>
                                            <ul className="category-list">
                                                {categories.map(category => (
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
                                    </>
                                )}
                                {selectionStep === 'model' && renderModelSelection()}
                                {selectionStep === 'color' && renderColorSelection()}
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