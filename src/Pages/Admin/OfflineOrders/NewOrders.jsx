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
        csp_code: '',
        gst_number: '',
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
    const [selectedModels, setSelectedModels] = useState([]); // Changed to array for multiple selection
    const [selectedSingleProducts, setSelectedSingleProducts] = useState([]); // For multiple single product selection
    const [singleProductSearchTerm, setSingleProductSearchTerm] = useState('');
    const [paymentType, setPaymentType] = useState('cod'); // Default to 'cod'
    const [isFreeDelivery, setIsFreeDelivery] = useState(false);

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
            fetchCustomers();
            setCustomerSearchTerm('');
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

            const frontendCustomers = response.data.map(backendCustomer => {
                const addresses = backendCustomer.addresses || [];
                return {
                    id: backendCustomer.customer_id,
                    name: backendCustomer.name,
                    phone: backendCustomer.mobile,
                    email: backendCustomer.email,
                    gst_number: backendCustomer.gst_number || '',
                    addresses: addresses.map(addr => ({
                        id: addr.address_id,
                        address_line1: addr.address_line ? addr.address_line.split(',')[0].trim() : '',
                        address_line2: addr.address_line && addr.address_line.split(',').length > 1 ?
                            addr.address_line.split(',').slice(1).join(',').trim() : '',
                        city: addr.city || '',
                        state: addr.state_name || addr.state_abbreviation || '',
                        state_id: addr.state_id || '',
                        pincode: addr.pincode || '',
                        country: 'India',
                        is_default: addr.is_default || false,
                        is_available: addr.is_available // Add this line
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
            const token = localStorage.getItem('token');

            // Calculate all order summary values
            const originalSubtotal = calculateOriginalSubtotal();
            const productDiscount = calculateProductDiscount();
            const extraDiscount = calculateExtraDiscount();
            const subtotalExcludingGST = calculateSubtotalExcludingGST();
            const gst = calculateGST();
            const subtotal = calculateSubtotal();
            const deliveryCharge = isFreeDelivery ? 0 : calculateDeliveryCharge(subtotal); // Update this line
            const total = subtotal + deliveryCharge;

            const orderItems = selectedProducts.map(product => {
                if (!product.finalPrice || isNaN(product.finalPrice)) {
                    throw new Error(`Invalid price for product ${product.product_id}`);
                }

                const item = {
                    product_id: product.product_id,
                    quantity: product.quantity,
                    unit_price: product.finalPrice,
                    original_price: product.original_price,
                    product_discount: product.original_price - product.price,
                    extra_discount_percent: parseFloat(product.extraDiscountPercentage) || 0,
                    extra_discount_amount: (product.price - product.finalPrice) * product.quantity,
                    total_price: product.finalPrice * product.quantity
                };

                if (product.model_id) {
                    item.model_id = product.model_id;
                }

                if (product.color_id) {
                    item.color_id = product.color_id;
                }

                return item;
            });

            const paymentStatus = paymentType === 'cod' ? 'pending' : 'paid';

            const orderData = {
                customer_id: selectedCustomer.id,
                items: orderItems,
                // Pricing breakdown
                original_subtotal: originalSubtotal,
                product_discount: productDiscount,
                extra_discount: extraDiscount,
                subtotal_excluding_gst: subtotalExcludingGST,
                gst_amount: gst,
                subtotal: subtotal,
                delivery_charge: isFreeDelivery ? 0 : deliveryCharge,
                is_free_delivery: isFreeDelivery,
                total_amount: total,
                // Discount and tax rates
                discount_percent: 0, // This can be calculated if needed
                tax_percent: 18, // Assuming 18% GST
                // Order details
                channel: 'offline',
                payment_status: paymentStatus,
                payment_type: paymentType,
                delivery_method: 'shipping',
                delivery_status: 'intransit',
                fulfillment_status: false,
                // Customer and address info
                customer_details: {
                    name: selectedCustomer.name,
                    phone: selectedCustomer.phone,
                    email: selectedCustomer.email || null
                },
                shipping_address: selectedAddress ? {
                    address_line1: selectedAddress.address_line1,
                    address_line2: selectedAddress.address_line2 || '',
                    city: selectedAddress.city,
                    state: selectedAddress.state_id ? getStateName(selectedAddress.state_id) : selectedAddress.state,
                    state_id: selectedAddress.state_id || null,
                    pincode: selectedAddress.pincode,
                    country: selectedAddress.country || 'India'
                } : null
            };

            console.log('Full Order Data:', JSON.stringify(orderData, null, 2));

            const response = await axios.post(
                `${import.meta.env.VITE_SERVER_API}/orders`,
                orderData,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 10000
                }
            ).catch(error => {
                if (error.response) {
                    console.error('Server responded with error:', error.response.status, error.response.data);
                } else if (error.request) {
                    console.error('No response received:', error.request);
                } else {
                    console.error('Request setup error:', error.message);
                }
                throw error;
            });

            console.log('Order created:', response.data);

            if (response.data?.order_id) {
                showSuccessToast(`Order #${response.data.order_id} created successfully!`);
                setSelectedProducts([]);
                setSelectedCustomer(null);
                setSelectedAddress(null);
                setPaymentType('cod'); // Reset to default
            } else {
                showErrorToast('Order created but no order ID returned');
            }
        } catch (error) {
            console.error('Order creation failed:', error);
            let errorMessage = 'Failed to create order';

            if (error.code === 'ERR_NETWORK') {
                errorMessage = 'Network error - please check your connection and server status';
            } else if (error.response?.data) {
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
        if (imagePath.startsWith('http')) return imagePath;
        if (imagePath.startsWith('/')) return `${import.meta.env.VITE_SERVER_API}${imagePath}`;
        return `${import.meta.env.VITE_SERVER_API}/static/${imagePath}`;
    };

    const handleProductSelect = (product) => {
        // For single products, check stock before selecting
        if (product.product_type === 'single') {
            const defaultColor = product.colors?.[0];
            if (!defaultColor || defaultColor.stock_quantity <= 0) {
                showErrorToast('This product is out of stock');
                return;
            }
        }

        setSelectedProduct(product);
        if (product.product_type === 'single') {
            setSelectionStep('single-products');
            setSelectedSingleProducts([product]); // Start with the selected product
        } else {
            setSelectionStep('models');
            setSelectedModels([]);
        }
    };


    const handleSingleProductToggle = (product) => {
        const defaultColor = product.colors?.[0];
        if (!defaultColor || defaultColor.stock_quantity <= 0) {
            showErrorToast('This product is out of stock');
            return;
        }

        setSelectedSingleProducts(prev => {
            const isSelected = prev.some(p => p.product_id === product.product_id);
            if (isSelected) {
                return prev.filter(p => p.product_id !== product.product_id);
            } else {
                return [...prev, product];
            }
        });
    };

    const handleModelToggle = (model) => {
        const defaultColor = model.colors?.[0];
        if (!defaultColor || defaultColor.stock_quantity <= 0) {
            showErrorToast('This model is out of stock');
            return;
        }

        setSelectedModels(prev => {
            const isSelected = prev.some(m => m.model_id === model.model_id);
            if (isSelected) {
                return prev.filter(m => m.model_id !== model.model_id);
            } else {
                return [...prev, model];
            }
        });
    };

    const handleAddSelection = () => {
        if (selectionStep === 'single-products') {
            // Add all selected single products
            const newSelections = selectedSingleProducts.map(product => {
                const defaultColor = product.colors?.[0];
                if (!defaultColor) {
                    showErrorToast(`No colors available for product ${product.name}`);
                    return null;
                }

                return {
                    id: defaultColor.color_id,
                    product_id: product.product_id,
                    color_id: defaultColor.color_id,
                    type: 'single',
                    name: product.name,
                    color_name: defaultColor.name,
                    full_name: `${product.name} - ${defaultColor.name}`,
                    image: defaultColor.images?.[0]?.image_url
                        ? `${import.meta.env.VITE_SERVER_API}/${defaultColor.images[0].image_url}`
                        : product.images?.[0]?.image_url
                            ? `${import.meta.env.VITE_SERVER_API}/${product.images[0].image_url}`
                            : '/placeholder-product.png',
                    stock: defaultColor.stock_quantity,
                    // original_price: defaultColor.original_price || defaultColor.price,
                    price: defaultColor.price,
                    original_price: defaultColor.original_price || defaultColor.price,
                    category: product.category,
                    specifications: product.specifications,
                    finalPrice: defaultColor.price,
                    discountPercentage: 0,
                    quantity: 1
                };
            }).filter(Boolean);

            setSelectedProducts(prev => [...prev, ...newSelections]);
        }
        else if (selectionStep === 'models' && selectedProduct) {
            // Add all selected models with their default colors
            const newSelections = selectedModels.map(model => {
                const defaultColor = model.colors?.[0];
                if (!defaultColor) {
                    showErrorToast(`No colors available for model ${model.name}`);
                    return null;
                }

                return {
                    id: `${model.model_id}-${defaultColor.color_id}`,
                    product_id: selectedProduct.product_id,
                    model_id: model.model_id,
                    color_id: defaultColor.color_id,
                    type: 'variable',
                    name: `${selectedProduct.name} - ${model.name}`,
                    color_name: defaultColor.name,
                    // full_name: `${selectedProduct.name} - ${model.name} - ${defaultColor.name}`,
                    full_name: `${selectedProduct.name} - ${model.name} `,
                    image: defaultColor.images?.[0]?.image_url
                        ? `${import.meta.env.VITE_SERVER_API}/${defaultColor.images[0].image_url}`
                        : model.images?.[0]?.image_url
                            ? `${import.meta.env.VITE_SERVER_API}/${model.images[0].image_url}`
                            : selectedProduct.images?.[0]?.image_url
                                ? `${import.meta.env.VITE_SERVER_API}/${selectedProduct.images[0].image_url}`
                                : '/placeholder-product.png',
                    stock: defaultColor.stock_quantity,
                    price: defaultColor.price,
                    original_price: defaultColor.original_price || defaultColor.price,
                    category: selectedProduct.category,
                    specifications: [...selectedProduct.specifications, ...model.specifications],
                    finalPrice: defaultColor.price,
                    discountPercentage: 0,
                    quantity: 1
                };
            }).filter(Boolean);

            setSelectedProducts(prev => [...prev, ...newSelections]);
        }

        setIsModalOpen(false);
        setSelectionStep('product');
        setSelectedProduct(null);
        setSelectedModels([]);
        setSelectedSingleProducts([]);
    };

    const handleModalClose = (e) => {
        if (e.target === e.currentTarget) {
            setIsModalOpen(false);
            setSelectionStep('product');
            setSelectedProduct(null);
            setSelectedModels([]);
            setSelectedSingleProducts([]);
        }
    };

    const handleQuantityChange = (id, newQuantity) => {
        setSelectedProducts(prev =>
            prev.map(product =>
                product.id === id
                    ? {
                        ...product,
                        quantity: Math.max(1, Math.min(
                            product.stock,
                            parseInt(newQuantity) || 1
                        ))
                    }
                    : product
            )
        );
    };


    const handleExtraDiscountPercentageChange = (id, percentage) => {
        const perc = Math.min(100, Math.max(0, parseFloat(percentage) || 0));
        setSelectedProducts(prev =>
            prev.map(product =>
                product.id === id
                    ? {
                        ...product,
                        extraDiscountPercentage: perc,
                        finalPrice: product.price * (1 - perc / 100)
                    }
                    : product
            )
        );
    };


    const handlePriceChange = (id, newPrice) => {
        const finalPrice = parseFloat(newPrice) || 0;
        setSelectedProducts(prev =>
            prev.map(product =>
                product.id === id
                    ? {
                        ...product,
                        finalPrice,
                        extraDiscountPercentage: ((product.price - finalPrice) / product.price * 100).toFixed(2)
                    }
                    : product
            )
        );
    };

    const calculateOriginalSubtotal = () => {
        return selectedProducts.reduce(
            (sum, product) => sum + (product.original_price * product.quantity),
            0
        );
    };

    const calculateProductDiscount = () => {
        return selectedProducts.reduce(
            (sum, product) => sum + (
                (product.original_price - product.price) * product.quantity
            ),
            0
        );
    };

    const calculateExtraDiscount = () => {
        return selectedProducts.reduce(
            (sum, product) => sum + (
                (product.price - product.finalPrice) * product.quantity
            ),
            0
        );
    };

    const calculateSubtotalExcludingGST = () => {
        return calculateSubtotal() / 1.18; // Assuming 18% GST
    };

    const calculateGST = () => {
        return calculateSubtotal() - calculateSubtotalExcludingGST();
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
        setCustomerSearchTerm(e.target.value.toLowerCase());
    };

    const handleCustomerSelect = (customer) => {
        const mappedCustomer = {
            ...customer,
            addresses: customer.addresses.map(addr => ({
                ...addr,
                state_id: addr.state_id || states.find(s => s.name === addr.state)?.state_id || ''
            }))
        };

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

        if (selectedCustomer.addresses?.length > 0 && !selectedAddress) {
            const defaultAddress = selectedCustomer.addresses.find(addr => addr.is_default) ||
                selectedCustomer.addresses[0];
            if (defaultAddress) {
                setSelectedAddress(defaultAddress);
            }
        }

        setIsCustomerModalOpen(false);
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
            const backendData = {
                name: newCustomer.name,
                mobile: newCustomer.phone,
                email: newCustomer.email || '',
                csp_code: newCustomer.csp_code || null,
                gst_number: newCustomer.gst_number || null,
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

            // Check if address was saved but not serviceable
            if (response.data.address && response.data.address.is_available === false) {
                showWarningToast('Customer added successfully, but delivery not available to this address');
            } else {
                showSuccessToast('Customer added successfully!');
            }

            setNewCustomer({
                name: '',
                phone: '',
                email: '',
                csp_code: '',
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
            showErrorToast(error.response?.data?.message || 'Failed to add customer');
        }
    };


    const showWarningToast = (message) => {
        toast.warning(message, {
            position: "top-center",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
        });
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

    const renderSingleProductsSelection = () => {
        if (!selectedProduct || selectedProduct.product_type !== 'single') return null;

        // Get all single products in the same category as the selected product
        const similarProducts = products.filter(p =>
            p.product_type === 'single' &&
            p.product_id !== selectedProduct.product_id
        );

        const allProducts = [selectedProduct, ...similarProducts];

        // Filter products based only on search term (remove stock check)
        const filteredProducts = allProducts.filter(product => {
            return product.name.toLowerCase().includes(singleProductSearchTerm.toLowerCase());
        });

        return (
            <div className="single-products-selection">
                <button
                    className="back-button"
                    onClick={() => setSelectionStep('product')}
                >
                    ← Back to Products
                </button>
                <h4>Select Products</h4>
                <div className="search-bar" style={{ marginBottom: '15px' }}>
                    <input
                        type="text"
                        placeholder="Search products..."
                        value={singleProductSearchTerm}
                        onChange={(e) => setSingleProductSearchTerm(e.target.value)}
                        className="search-input"
                    />
                </div>
                <div className="product-list" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    {filteredProducts.length === 0 ? (
                        <div className="no-products-found">
                            {singleProductSearchTerm ?
                                'No matching products found' :
                                'No products in this category'}
                        </div>
                    ) : (
                        filteredProducts.map(product => {
                            const defaultColor = product.colors?.[0];
                            const isSelected = selectedSingleProducts.some(p => p.product_id === product.product_id);
                            const isOutOfStock = !defaultColor || defaultColor.stock_quantity <= 0;

                            return (
                                <div
                                    key={product.product_id}
                                    className={`product-item ${isSelected ? 'selected' : ''} ${isOutOfStock ? 'out-of-stock' : ''}`}
                                    onClick={() => handleSingleProductToggle(product)}
                                >
                                    <div className="product-select-box">
                                        {isSelected && <FaCheck className="check-icon" />}
                                        {isOutOfStock && <div className="out-of-stock-overlay">Out of Stock</div>}
                                    </div>
                                    <div className="product-image">
                                        <img
                                            src={product.images?.[0]?.image_url
                                                ? getImageUrl(product.images[0].image_url)
                                                : '/placeholder-product.png'}
                                            alt={product.name}
                                        />
                                    </div>
                                    <div className="product-info">
                                        <h5>{product.name}</h5>
                                        {defaultColor && (
                                            <div className="product-details">
                                                <span>Price: ₹{defaultColor.price.toFixed(2)}</span>
                                                <span className={`stock-info ${isOutOfStock ? 'out-of-stock' : ''}`}>
                                                    {isOutOfStock ? 'Out of stock' : `Stock: ${defaultColor.stock_quantity}`}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
                <div className="selection-actions">
                    <button
                        className="cancel-btn"
                        onClick={() => {
                            setSelectionStep('product');
                            setSelectedSingleProducts([]);
                            setSingleProductSearchTerm('');
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        className="confirm-btn"
                        onClick={handleAddSelection}
                        disabled={selectedSingleProducts.length === 0}
                    >
                        Add {selectedSingleProducts.length > 1 ?
                            `${selectedSingleProducts.length} Products to Order` :
                            'Product to Order'}
                    </button>
                </div>
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
                <h4>Select Models for {selectedProduct.name}</h4>
                <div className="model-list" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    {selectedProduct.models.map(model => {
                        const defaultColor = model.colors?.[0];
                        const isSelected = selectedModels.some(m => m.model_id === model.model_id);
                        const isOutOfStock = !defaultColor || defaultColor.stock_quantity <= 0;

                        return (
                            <div
                                key={model.model_id}
                                className={`model-item ${isSelected ? 'selected' : ''} ${isOutOfStock ? 'out-of-stock' : ''}`}
                                onClick={() => handleModelToggle(model)}
                            >
                                <div className="model-select-box">
                                    {isSelected && <FaCheck className="check-icon" />}
                                    {isOutOfStock && <div className="out-of-stock-overlay">Out of Stock</div>}
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
                                    {defaultColor && (
                                        <div className="model-details">
                                            <span>Price: ₹{defaultColor.price.toFixed(2)}</span>
                                            <span className={`stock-info ${isOutOfStock ? 'out-of-stock' : ''}`}>
                                                {isOutOfStock ? 'Out of stock' : `Stock: ${defaultColor.stock_quantity}`}
                                            </span>
                                        </div>
                                    )}
                                    <div className="model-specs">
                                        {model.specifications?.map(spec => (
                                            <span key={spec.spec_id}>{spec.key}: {spec.value}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
                <div className="selection-actions">
                    <button
                        className="cancel-btn"
                        onClick={() => {
                            setSelectionStep('product');
                            setSelectedModels([]);
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        className="confirm-btn"
                        onClick={handleAddSelection}
                        disabled={selectedModels.length === 0}
                    >
                        Add {selectedModels.length > 1 ?
                            `${selectedModels.length} Models to Order` :
                            'Model to Order'}
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
                            onChange={handleCustomerSearch}
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
                                        <div className="original-price">₹{product.original_price.toFixed(2)}</div>
                                        <div className="price-edit-options">
                                            <div className="discount-option">
                                                <label>Extra Discount %</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    className="discount-percentage-input"
                                                    value={product.extraDiscountPercentage || 0}
                                                    onChange={(e) => handleExtraDiscountPercentageChange(product.id, e.target.value)}
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


                                    {selectedCustomer.gst_number && (
                                        <div className="detail-row">
                                            <span className="detail-label">GST Number:</span>
                                            <span className="detail-value">{selectedCustomer.gst_number}</span>
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

                {selectedCustomer && (
                    <div className="payment-type-section">
                        <h3 className="section-title">Payment Method</h3>
                        <div className="payment-options">
                            <div className="payment-select-container">
                                <select
                                    className="payment-select"
                                    value={paymentType}
                                    onChange={(e) => setPaymentType(e.target.value)}
                                >
                                    <option value="">Select Payment Method</option>
                                    <option value="upi">UPI Payment</option>
                                    <option value="bank_transfer">Bank Transfer</option>
                                </select>
                            </div>
                            <div className="free-delivery-option">
                                <input
                                    type="checkbox"
                                    id="freeDelivery"
                                    checked={isFreeDelivery}
                                    onChange={(e) => setIsFreeDelivery(e.target.checked)}
                                />
                                <label htmlFor="freeDelivery">Free Delivery</label>
                            </div>
                        </div>
                    </div>
                )}

                {selectedProducts.length > 0 && (
                    <div className="payment-summary">
                        <h3 className="summary-title">Payment Summary</h3>

                        <div className="summary-row">
                            <span>Original Subtotal ({selectedProducts.reduce((sum, p) => sum + p.quantity, 0)} items):</span>
                            <span>₹{calculateOriginalSubtotal().toFixed(2)}</span>
                        </div>

                        <div className="summary-row discount-row">
                            <span>Product Discount:</span>
                            <span>-₹{calculateProductDiscount().toFixed(2)}</span>
                        </div>

                        <div className="summary-row discount-row">
                            <span>Extra Discount:</span>
                            <span>-₹{calculateExtraDiscount().toFixed(2)}</span>
                        </div>

                        <div className="summary-row">
                            <span>Subtotal (Excluding GST):</span>
                            <span>₹{calculateSubtotalExcludingGST().toFixed(2)}</span>
                        </div>

                        <div className="summary-row">
                            <span>GST (18%):</span>
                            <span>₹{calculateGST().toFixed(2)}</span>
                        </div>

                        <div className="summary-row">
                            <span>Delivery Charge:</span>
                            <span>
                                {isFreeDelivery || calculateDeliveryCharge(calculateSubtotal()) === 0
                                    ? 'FREE'
                                    : `₹${calculateDeliveryCharge(calculateSubtotal()).toFixed(2)}`
                                }
                            </span>
                        </div>

                        <div className="summary-row total-row">
                            <span>Total:</span>
                            <span>
                                ₹{(
                                    calculateSubtotal() +
                                    (isFreeDelivery ? 0 : calculateDeliveryCharge(calculateSubtotal()))
                                ).toFixed(2)}
                            </span>
                        </div>

                        <button
                            className="place-order-btn"
                            onClick={handlePlaceOrder}
                            disabled={!selectedCustomer || !selectedAddress || !paymentType}
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
                                    {selectionStep === 'single-products' && 'Select Products'}
                                    {selectionStep === 'models' && 'Select Models'}
                                </h3>
                                <button
                                    className="close-modal-btn"
                                    onClick={() => {
                                        setIsModalOpen(false);
                                        setSelectionStep('product');
                                        setSelectedProduct(null);
                                        setSelectedModels([]);
                                        setSelectedSingleProducts([]);
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
                                {selectionStep === 'single-products' && renderSingleProductsSelection()}
                                {selectionStep === 'models' && renderModelSelection()}
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
                                                        {selectedCustomer.addresses?.map(address => (
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
                                                                    {address.is_available === false && (
                                                                        <div className="service-warning">
                                                                            <span className="warning-icon">⚠️</span>
                                                                            Delivery not available
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
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

                                        <div className="form-group">
                                            <label>CSP Code</label>
                                            <input
                                                type="text"
                                                name="csp_code"
                                                value={newCustomer.csp_code}
                                                onChange={handleNewCustomerChange}
                                                placeholder="CSP Code (optional)"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>GST Number</label>
                                            <input
                                                type="text"
                                                name="gst_number"
                                                value={newCustomer.gst_number}
                                                onChange={handleNewCustomerChange}
                                                placeholder="GST Number (optional)"
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