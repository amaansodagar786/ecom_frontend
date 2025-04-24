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
    const [isNewCustomerModalOpen, setIsNewCustomerModalOpen] = useState(false);
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [customerSearchTerm, setCustomerSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [states, setStates] = useState([]);
    const [newCustomer, setNewCustomer] = useState({
        name: '',
        phone: '',
        email: '',
        addresses: [{
            address_line1: '',
            address_line2: '',
            city: '',
            state_id: '',
            pincode: '',
            country: 'India',
            is_default: true
        }]
    });
    const [customers, setCustomers] = useState([]);
    const [isCustomerLoading, setIsCustomerLoading] = useState(false);
    const [selectionStep, setSelectionStep] = useState('product');
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [selectedModel, setSelectedModel] = useState(null);
    const [selectedColors, setSelectedColors] = useState([]);

    // Fetch products from API
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_SERVER_API}/products`);
                setProducts(response.data);

                // Extract unique categories
                const uniqueCategories = [...new Set(
                    response.data.map(p => p.category).filter(Boolean))
                ];
                setCategories(['all', ...uniqueCategories]);
                setIsLoading(false);
            } catch (error) {
                console.error('Error fetching products:', error);
                setIsLoading(false);
            }
        };

        fetchProducts();
    }, []);

    useEffect(() => {
        const fetchStates = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_SERVER_API}/states`);
                setStates(response.data.states || []);
            } catch (error) {
                console.error('Error fetching states:', error);
            }
        };

        fetchStates();
    }, []);


    useEffect(() => {
        if (isModalOpen || isCustomerModalOpen || isNewCustomerModalOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }

        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [isModalOpen, isCustomerModalOpen, isNewCustomerModalOpen]);


    const getStateName = (stateId) => {
        const state = states.find(s => s.state_id == stateId);
        return state ? state.name : '';
    };

    // Fetch customers from API when customer modal opens
    useEffect(() => {
        if (isCustomerModalOpen) {
            fetchCustomers(); // This will fetch all customers immediately
            setCustomerSearchTerm(''); // Reset search term
        }
    }, [isCustomerModalOpen]);

    const fetchCustomers = async (searchQuery = '') => {
        setIsCustomerLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${import.meta.env.VITE_SERVER_API}/offline-customers`, {
                params: { search: searchQuery },
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            // Convert backend customers to frontend format
            const frontendCustomers = response.data.map(backendCustomer => {
                // Ensure addresses is always an array
                const addresses = backendCustomer.addresses || [];

                return {
                    id: backendCustomer.customer_id,
                    name: backendCustomer.name,
                    phone: backendCustomer.mobile,
                    email: backendCustomer.email,
                    addresses: addresses.map(addr => ({
                        id: addr.address_id,
                        address_line1: addr.address_line ? addr.address_line.split(',')[0].trim() : '',
                        address_line2: addr.address_line && addr.address_line.split(',').length > 1 ?
                            addr.address_line.split(',').slice(1).join(',').trim() : '',
                        city: addr.city || '',
                        state: addr.state_name || addr.state_abbreviation || '',
                        pincode: addr.pincode || '',
                        country: 'India',
                        is_default: addr.is_default || false  // Ensure this is always boolean
                    }))
                };
            });

            setCustomers(frontendCustomers);
        } catch (error) {
            console.error('Error fetching customers:', error);
            toast.error(error.response?.data?.message || 'Failed to load customers');
        } finally {
            setIsCustomerLoading(false);
        }
    };

    const showErrorToast = (message) => {
        toast.error(message, {
            position: "top-center",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
        });
    };

    const showSuccessToast = (message) => {
        toast.success(message, {
            position: "top-center",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
        });
    };

    const handlePlaceOrder = async () => {
        if (selectedProducts.length === 0) {
            showErrorToast('Please select at least one product');
            return;
        }

        if (!selectedCustomer) {
            showErrorToast('Please select a customer');
            return;
        }

        try {
            console.log('Selected Products:', selectedProducts);

            const token = localStorage.getItem('token');

            // 🔁 Removed product verification step here

            // Prepare order items
            const orderItems = selectedProducts.map(product => {
                console.log("🧪 Type of finalPrice:", typeof product.finalPrice, "Value:", product.finalPrice);

                if (!product.finalPrice || isNaN(product.finalPrice)) {
                    throw new Error(`Invalid price for product ${product.product_id}`);
                }

                return {
                    product_id: product.product_id,
                    quantity: product.quantity,
                    unit_price: product.finalPrice,
                    ...(product.model_id && { model_id: product.model_id }),
                    ...(product.color_id && { color_id: product.color_id })
                };
            });

            // Prepare order data
            const orderData = {
                customer_id: selectedCustomer.id,
                items: orderItems,
                discount_percent: 0,
                delivery_charge: 0,
                tax_percent: 0,
                channel: 'offline',
                payment_status: 'paid'
            };

            // Log the exact payload being sent to backend
            console.log('📦 Order Data being sent to backend:', JSON.stringify(orderData, null, 2));

            // Submit order
            const response = await axios.post(
                `${import.meta.env.VITE_SERVER_API}/orders`,
                orderData,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            console.log('✅ Response from server:', response.data);

            if (response.data?.order_id) {
                showSuccessToast(`Order #${response.data.order_id} created successfully!`);
                setSelectedProducts([]);
                setSelectedCustomer(null);
                setSelectedAddress(null);
            } else {
                showErrorToast('Order created but no order ID returned');
            }
        } catch (error) {
            console.error('❌ Order creation error:', error);
            let errorMessage = 'Failed to create order';

            if (error.response?.data) {
                errorMessage = error.response.data.error ||
                    error.response.data.message ||
                    JSON.stringify(error.response.data);
            } else if (error.message) {
                errorMessage = error.message;
            }

            showErrorToast(errorMessage);
        }
    };

    const getImageUrl = (imagePath) => {
        if (!imagePath) return null;

        // If it's already a full URL (starts with http), use as is
        if (imagePath.startsWith('http')) {
            return imagePath;
        }

        // If it starts with / (like /product_images/...), prepend server URL
        if (imagePath.startsWith('/')) {
            return `${import.meta.env.VITE_SERVER_API}${imagePath}`;
        }

        // Otherwise, assume it's just a filename and use the old format
        return `${import.meta.env.VITE_SERVER_API}/static/${imagePath}`;
    };


    const handleProductSelect = (product) => {
        setSelectedProduct(product);
        if (product.product_type === 'single') {
            setSelectionStep('color');
            setSelectedModel(null);
        } else {
            setSelectionStep('model');
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
            setSelectedColors([]);
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

    const handleCustomerSearch = (e) => {
        const query = e.target.value.toLowerCase();
        setCustomerSearchTerm(query);
    };

    const handleCustomerSelect = (customer) => {
        // Map the addresses to include both state and state_id
        const mappedCustomer = {
            ...customer,
            addresses: customer.addresses.map(addr => ({
                ...addr,
                state_id: addr.state_id || states.find(s => s.name === addr.state)?.state_id || ''
            }))
        };

        console.log('Selected customer:', mappedCustomer);
        console.log('Customer addresses:', mappedCustomer.addresses);
        setSelectedCustomer(mappedCustomer);
        setSelectedAddress(null);
    };

    const handleAddressSelect = (address) => {
        setSelectedAddress(address);
    };

    const handleConfirmCustomer = () => {
        if (!selectedCustomer) {
            showErrorToast('Please select a customer');
            return;
        }

        // If customer has addresses but none selected, try to select default
        if (selectedCustomer.addresses?.length > 0 && !selectedAddress) {
            const defaultAddress = selectedCustomer.addresses.find(addr => addr.is_default);
            if (defaultAddress) {
                setSelectedAddress(defaultAddress);
            } else {
                // If no default address, select the first one
                setSelectedAddress(selectedCustomer.addresses[0]);
            }
        }

        setIsCustomerModalOpen(false);

        // Show success message if customer was selected
        if (selectedCustomer) {
            showSuccessToast(`Customer ${selectedCustomer.name} selected`);
        }
    };

    const handleNewCustomerChange = (e) => {
        const { name, value } = e.target;
        setNewCustomer(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleAddressChange = (e, index) => {
        const { name, value } = e.target;
        setNewCustomer(prev => {
            const updatedAddresses = [...prev.addresses];
            updatedAddresses[index] = {
                ...updatedAddresses[index],
                [name]: value
            };
            return {
                ...prev,
                addresses: updatedAddresses
            };
        });
    };

    const handleAddNewCustomer = async () => {
        if (!newCustomer.name || !newCustomer.phone || !newCustomer.addresses[0].address_line1 ||
            !newCustomer.addresses[0].city || !newCustomer.addresses[0].pincode || !newCustomer.addresses[0].state_id) {
            showErrorToast('Please fill all required fields');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const selectedState = states.find(state => state.state_id == newCustomer.addresses[0].state_id);

            const backendData = {
                name: newCustomer.name,
                mobile: newCustomer.phone,
                email: newCustomer.email || '',
                address: {
                    name: newCustomer.name,
                    mobile: newCustomer.phone,
                    pincode: newCustomer.addresses[0].pincode,
                    locality: newCustomer.addresses[0].address_line1,
                    address_line: newCustomer.addresses[0].address_line1 +
                        (newCustomer.addresses[0].address_line2 ?
                            ', ' + newCustomer.addresses[0].address_line2 : ''),
                    city: newCustomer.addresses[0].city,
                    state_id: newCustomer.addresses[0].state_id,
                    landmark: '',
                    alternate_phone: '',
                    address_type: 'Home'
                }
            };

            const response = await axios.post(
                `${import.meta.env.VITE_SERVER_API}/offline-customers`,
                backendData,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            // Check if the response indicates pincode is not serviceable
            if (response.data.success === false) {
                // Reset form
                setNewCustomer({
                    name: '',
                    phone: '',
                    email: '',
                    addresses: [{
                        address_line1: '',
                        address_line2: '',
                        city: '',
                        state_id: '',
                        pincode: '',
                        country: 'India',
                        is_default: true
                    }]
                });
                showErrorToast(response.data.message || 'Service not available for this pincode. Please choose a different pincode.');
                return;
            }

            // If we get here, customer was created successfully
            showSuccessToast('Customer added successfully!');
            setNewCustomer({
                name: '',
                phone: '',
                email: '',
                addresses: [{
                    address_line1: '',
                    address_line2: '',
                    city: '',
                    state_id: '',
                    pincode: '',
                    country: 'India',
                    is_default: true
                }]
            });
            setIsNewCustomerModalOpen(false);
            fetchCustomers();
        } catch (error) {
            console.error('Error adding customer:', error);

            // Handle pincode service error specifically if it comes from backend
            if (error.response?.data?.message?.includes('pincode')) {
                showErrorToast('Service not available for this pincode. Please choose a different pincode.');
            } else {
                showErrorToast(error.response?.data?.message || 'Failed to add customer');
            }
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
                                        ? getImageUrl(product.images[0].image_url)
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
                                        ? getImageUrl(model.images[0].image_url)
                                        : selectedProduct.images?.[0]?.image_url
                                            ? getImageUrl(selectedProduct.images[0].image_url)
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
                                className={`color-item ${color.stock_quantity <= 0 ? 'out-of-stock' : ''} ${selectedColors.some(c => c.color_id === color.color_id) ? 'selected' : ''
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
                            const imageUrl = product.image;
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

                {(selectedCustomer || selectedAddress) && (
                    <div className="customer-details-section">
                        <h3 className="section-title">Customer Details</h3>
                        <div className="customer-details">
                            {selectedCustomer && (
                                <>
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
                                </>
                            )}
                            {selectedAddress && (
                                <>
                                    <div className="detail-row">
                                        <span className="detail-label">Address:</span>
                                        <span className="detail-value">
                                            {selectedAddress.address_line1}
                                            {selectedAddress.address_line2 && `, ${selectedAddress.address_line2}`}
                                            {`, ${selectedAddress.city}, ${selectedAddress.state_id ? getStateName(selectedAddress.state_id) : selectedAddress.state} - ${selectedAddress.pincode}`}
                                        </span>
                                    </div>
                                </>
                            )}
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
                            disabled={!selectedCustomer || !selectedAddress}
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
                                        setSelectedColors([]);
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
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}
                            style={{
                                width: '80%',
                                maxWidth: '800px',
                                maxHeight: '90vh',
                                display: 'flex',
                                flexDirection: 'column'
                            }}>
                            <div className="modal-header">
                                <h3>{selectedCustomer ? 'Change Customer' : 'Select Customer'}</h3>
                                <button
                                    className="close-modal-btn"
                                    onClick={() => setIsCustomerModalOpen(false)}
                                >
                                    ×
                                </button>
                            </div>
                            <div
                                className="modal-body-container">
                                <div className="search-section">
                                    <input
                                        type="text"
                                        placeholder="Search customers by name or phone..."
                                        className="modal-search-input"
                                        value={customerSearchTerm}
                                        onChange={handleCustomerSearch}
                                    />
                                    <button
                                        className="add-customer-btn"
                                        onClick={() => {
                                            setIsNewCustomerModalOpen(true);
                                        }}
                                    >
                                        + Add New Customer
                                    </button>
                                </div>

                                {isCustomerLoading ? (
                                    <div className="loading-customers">Loading customers...</div>
                                ) : (
                                    <>
                                        <div className="customer-list-section">
                                            <div className="customer-list">
                                                {customers
                                                    .filter(customer => {
                                                        const name = customer.name || '';
                                                        const phone = customer.phone || '';
                                                        return customerSearchTerm === '' ||
                                                            name.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
                                                            phone.includes(customerSearchTerm);
                                                    })
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
                                                            </div>
                                                        </div>
                                                    ))}
                                            </div>
                                        </div>

                                        {selectedCustomer && (
                                            <div className="address-selection-section">
                                                <h4>Select Address</h4>
                                                {selectedCustomer.addresses && selectedCustomer.addresses.length === 0 ? (
                                                    <p>No addresses found for this customer.</p>
                                                ) : (
                                                    <div className="address-list">
                                                        {selectedCustomer.addresses?.map(address => {
                                                            console.log("Rendering address:", address); // Add this
                                                            console.log("State from state_id", address.state_id, getStateName(address.state_id)); // 🔥 ADD THIS HERE


                                                            return (
                                                                <div
                                                                    key={address.id}
                                                                    className={`address-item ${selectedAddress?.id === address.id ? 'selected' : ''}`}
                                                                    onClick={() => handleAddressSelect(address)}
                                                                >
                                                                    <div className="address-select-box">
                                                                        {selectedAddress?.id === address.id && <FaCheck className="check-icon" />}
                                                                    </div>
                                                                    <div className="address-details">
                                                                        <p>{address.address_line1}</p>
                                                                        {address.address_line2 && <p>{address.address_line2}</p>}
                                                                        <p>
                                                                            {address.city},
                                                                            {address.state_id ? getStateName(address.state_id) : address.state} - {address.pincode}
                                                                        </p>
                                                                        {address.is_default && <span className="default-tag">Default</span>}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        <div className="customer-modal-actions">
                                            <button
                                                className="cancel-btn"
                                                onClick={() => setIsCustomerModalOpen(false)}
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                className="confirm-btn"
                                                onClick={handleConfirmCustomer}
                                                disabled={!selectedCustomer || (selectedCustomer.addresses.length > 0 && !selectedAddress)}
                                            >
                                                Confirm Customer
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {isNewCustomerModalOpen && (
                    <div className="new-customer-modal" >
                        <div className="modal-overlay" onClick={() => setIsNewCustomerModalOpen(false)}></div>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3>Add New Customer</h3>
                                <button
                                    className="close-modal-btn"
                                    onClick={() => setIsNewCustomerModalOpen(false)}
                                >
                                    ×
                                </button>
                            </div>
                            <div className="modal-body " style={{ overflowY: 'auto', flex: 1 }}>
                                <div className="new-customer-form">
                                    <div className="form-section">
                                        <h4>Basic Information</h4>
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
                                    </div>

                                    <div className="form-section">
                                        <h4>Address Information</h4>
                                        {newCustomer.addresses.map((address, index) => (
                                            <div key={index} className="address-form">
                                                <div className="form-group">
                                                    <label>Address Line 1*</label>
                                                    <input
                                                        type="text"
                                                        name="address_line1"
                                                        value={address.address_line1}
                                                        onChange={(e) => handleAddressChange(e, index)}
                                                        placeholder="Street address, P.O. box, company name"
                                                    />
                                                </div>
                                                <div className="form-group">
                                                    <label>Address Line 2</label>
                                                    <input
                                                        type="text"
                                                        name="address_line2"
                                                        value={address.address_line2}
                                                        onChange={(e) => handleAddressChange(e, index)}
                                                        placeholder="Apartment, suite, unit, building, floor, etc."
                                                    />
                                                </div>
                                                <div className="form-row">
                                                    <div className="form-group">
                                                        <label>City*</label>
                                                        <input
                                                            type="text"
                                                            name="city"
                                                            value={address.city}
                                                            onChange={(e) => handleAddressChange(e, index)}
                                                            placeholder="City"
                                                        />
                                                    </div>
                                                    <div className="form-group">
                                                        <label>State*</label>
                                                        <select
                                                            name="state_id"
                                                            value={newCustomer.addresses[0].state_id || ''}
                                                            onChange={(e) => handleAddressChange(e, 0)}
                                                            required
                                                        >
                                                            <option value="">Select State</option>
                                                            {states.map(state => (
                                                                <option key={state.state_id} value={state.state_id}>
                                                                    {state.name} ({state.abbreviation})
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div className="form-group">
                                                        <label>Pincode*</label>
                                                        <input
                                                            type="text"
                                                            name="pincode"
                                                            value={address.pincode}
                                                            onChange={(e) => handleAddressChange(e, index)}
                                                            placeholder="Pincode"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="form-group">
                                                    <label>Country</label>
                                                    <input
                                                        type="text"
                                                        name="country"
                                                        value={address.country}
                                                        onChange={(e) => handleAddressChange(e, index)}
                                                        placeholder="Country"
                                                        disabled
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="form-actions">
                                        <button
                                            className="cancel-btn"
                                            onClick={() => setIsNewCustomerModalOpen(false)}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            className="save-btn"
                                            onClick={handleAddNewCustomer}
                                            disabled={!newCustomer.name || !newCustomer.phone ||
                                                !newCustomer.addresses[0].address_line1 ||
                                                !newCustomer.addresses[0].city ||
                                                !newCustomer.addresses[0].pincode}
                                        >
                                            Save Customer
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