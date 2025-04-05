import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './ProductPage.scss';
import { useAuth } from '../../Components/Context/AuthContext';

const ProductPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { 
        addToCart, 
        toggleWishlistItem, 
        wishlistItems, 
        currentUser,
        isAuthenticated 
    } = useAuth();
    
    const [product, setProduct] = useState(location.state?.product || null);
    const [loading, setLoading] = useState(!location.state?.product);
    const [error, setError] = useState(null);
    const [selectedColor, setSelectedColor] = useState(null);
    const [selectedModel, setSelectedModel] = useState(null);
    const [selectedImage, setSelectedImage] = useState(0);
    const [quantity, setQuantity] = useState(1);
    const [filteredImages, setFilteredImages] = useState([]);
    const [cartStatus, setCartStatus] = useState({ 
        loading: false, 
        error: null, 
        success: false 
    });
    const [activeSection, setActiveSection] = useState(null);

    // Fetch product if not passed via state
    useEffect(() => {
        if (!location.state?.product && location.pathname.includes('/product/')) {
            const productId = location.pathname.split('/product/')[1];
            const fetchProduct = async () => {
                try {
                    const response = await axios.get(
                        `${import.meta.env.VITE_SERVER_API}/product/${productId}`
                    );
                    setProduct(response.data);
                    setLoading(false);
                } catch (err) {
                    setError(err.message);
                    setLoading(false);
                }
            };
            fetchProduct();
        }
    }, [location]);

    useEffect(() => {
        if (location.state?.selectedModel || location.state?.selectedColor) {
            setSelectedModel(location.state.selectedModel);
            setSelectedColor(location.state.selectedColor);
        }
    }, [location.state]);

    // Helper function to filter images based on selections
    const getFilteredImages = (product, selectedModel, selectedColor) => {
        if (!product) return [];
        
        let images = [];
        
        if (product.product_type === 'variable') {
            if (selectedModel) {
                // Priority: Color images > Model images > Product images
                if (selectedColor?.images?.length > 0) {
                    images = selectedColor.images;
                } else if (selectedModel.images?.length > 0) {
                    images = selectedModel.images;
                } else {
                    images = product.images || [];
                }
            } else {
                images = product.images || [];
            }
        } else {
            // Single product type: Color images > Product images
            images = selectedColor?.images?.length > 0 
                ? selectedColor.images 
                : product.images || [];
        }
        
        return images;
    };

    // Update filtered images when product or selections change
    useEffect(() => {
        if (product) {
            const images = getFilteredImages(product, selectedModel, selectedColor);
            setFilteredImages(images);
            setSelectedImage(0);
        }
    }, [product, selectedModel, selectedColor]);

    // Set initial selections
    useEffect(() => {
        if (product) {
            if (product.product_type === 'single' && product.colors?.length > 0) {
                setSelectedColor(product.colors[0]);
            } else if (product.product_type === 'variable' && product.models?.length > 0) {
                setSelectedModel(product.models[0]);
                if (product.models[0].colors?.length > 0) {
                    setSelectedColor(product.models[0].colors[0]);
                }
            }
        }
    }, [product]);

    const handleAddToCart = async () => {
        console.log('Add to Cart clicked');
        
        if (!product) {
            setCartStatus({ 
                error: 'Product not loaded', 
                success: false, 
                loading: false 
            });
            return;
        }
      
        if (!isAuthenticated) {
            setCartStatus({ 
                error: 'Please login to add items to cart', 
                success: false, 
                loading: false 
            });
            navigate('/login', { state: { from: location.pathname } });
            return;
        }
      
        setCartStatus({ loading: true, error: null, success: false });
        
        try {
            const payload = {
                product_id: product.product_id,
                model_id: selectedModel?.model_id || null,
                color_id: selectedColor?.color_id || null,
                quantity: quantity
            };
    
            // First update server cart
            const response = await axios.post(
                `${import.meta.env.VITE_SERVER_API}/cart/additem`,
                payload,
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );
    
            // Handle response
            if (response.data.success) {
                // Update local cart
                const cartItem = {
                    product_id: product.product_id,
                    name: product.name,
                    price: selectedColor?.price || 
                          product.models?.[0]?.colors?.[0]?.price || 
                          product.price || 
                          0,
                    image: filteredImages.length > 0 ? 
                          filteredImages[0].image_url : 
                          product.images?.[0]?.image_url,
                    color: selectedColor?.name,
                    model: selectedModel?.name,
                    quantity
                };
                
                addToCart(cartItem);
                setCartStatus({ loading: false, error: null, success: true });
            } else {
                throw new Error(response.data.error || 'Failed to add to cart');
            }
    
            setTimeout(() => {
                setCartStatus(prev => ({ ...prev, success: false }));
            }, 3000);
    
        } catch (err) {
            console.error('Add to cart error:', err);
            let errorMessage = err.response?.data?.error || err.message;
            
            // Handle specific error cases
            if (err.response?.status === 403) {
                errorMessage = 'Session expired. Please login again.';
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                navigate('/login');
            }
            
            setCartStatus({
                loading: false,
                error: errorMessage,
                success: false
            });
        }
    };

    const handleWishlistToggle = () => {
        if (!product) return;
    
        // Get the base product details
        const wishlistItem = {
            product_id: product.product_id,
            name: product.name,
            price: selectedColor?.price || 
                  product.models?.[0]?.colors?.[0]?.price || 
                  product.price || 
                  0,
            image: filteredImages.length > 0 ? 
                  filteredImages[0].image_url : 
                  product.images?.[0]?.image_url,
            category: product.category
        };
    
        // First update the local state immediately for better UX
        toggleWishlistItem(wishlistItem);
    
        // Then sync with the server
        const syncWithServer = async () => {
            try {
                const token = localStorage.getItem('token');
                const endpoint = wishlistItems.includes(product.product_id)
                    ? `${import.meta.env.VITE_SERVER_API}/wishlist/deleteitem`
                    : `${import.meta.env.VITE_SERVER_API}/wishlist/additem`;
    
                await axios.post(
                    endpoint,
                    { product_id: product.product_id },
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    }
                );
            } catch (err) {
                console.error('Error syncing wishlist:', err);
                // Revert local change if server sync fails
                toggleWishlistItem(wishlistItem);
            }
        };
    
        if (isAuthenticated) {
            syncWithServer();
        }
    };

    const handleQuantityChange = (change) => {
        const newQuantity = quantity + change;
        if (newQuantity > 0 && newQuantity <= 10) {
            setQuantity(newQuantity);
        }
    };

    const toggleSection = (section) => {
        setActiveSection(activeSection === section ? null : section);
    };

    if (loading) return <div className="loading-state">Loading...</div>;
    if (error) return <div className="error-state">Error: {error}</div>;
    if (!product) return <div className="not-found">Product Not Found</div>;

    const currentPrice = selectedColor?.price || 
                       selectedModel?.colors?.[0]?.price || 
                       product.price || 
                       0;
    const originalPrice = selectedColor?.original_price || 
                        selectedModel?.colors?.[0]?.original_price || 
                        null;
    const inStock = selectedColor?.stock_quantity > 0 || 
                   selectedModel?.colors?.some(c => c.stock_quantity > 0) || 
                   false;

    return (
        <div className="product-page">
            {/* Breadcrumb Navigation */}
            <nav className="breadcrumb">
                <span onClick={() => navigate('/')}>Home</span>
                <span>/</span>
                <span onClick={() => navigate(`/category/${product.category}`)}>
                    {product.category}
                </span>
                <span>/</span>
                <span className="current">{product.name}</span>
            </nav>

            <div className="product-container">
                {/* Product Gallery */}
                <div className="product-gallery">
                    {/* Thumbnail Navigation */}
                    <div className="thumbnail-container">
                        {filteredImages.map((img, index) => (
                            <div
                                key={`${img.image_id}-${index}`}
                                className={`thumbnail ${selectedImage === index ? 'active' : ''}`}
                                onClick={() => setSelectedImage(index)}
                            >
                                <img
                                    src={`${import.meta.env.VITE_SERVER_API}/static${img.image_url}`}
                                    alt={`${product.name} thumbnail ${index + 1}`}
                                    onError={(e) => {
                                        e.target.src = '/fallback-image.jpg';
                                        console.error('Failed to load thumbnail:', img.image_url);
                                    }}
                                />
                            </div>
                        ))}
                    </div>

                    {/* Main Image */}
                    <div className="main-image">
                        {filteredImages.length > 0 && (
                            <img
                                src={`${import.meta.env.VITE_SERVER_API}/static${filteredImages[selectedImage].image_url}`}
                                alt={product.name}
                                onError={(e) => {
                                    e.target.src = '/fallback-image.jpg';
                                    console.error('Failed to load main image:', 
                                    filteredImages[selectedImage].image_url);
                                }}
                            />
                        )}
                    </div>
                </div>

                {/* Product Details */}
                <div className="product-details">
                    <div className="product-header">
                        <h1>{product.name}</h1>
                        <div className="product-meta">
                            <span className="rating">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <svg 
                                        key={`star-${i}`} 
                                        width="16" 
                                        height="16" 
                                        viewBox="0 0 24 24" 
                                        fill={i < Math.floor(product.rating) ? "#FFD700" : "#DDD"}
                                    >
                                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                    </svg>
                                ))}
                                <span>({product.raters || 0} reviews)</span>
                            </span>
                            <span className="sku">SKU: {product.product_id}</span>
                        </div>
                    </div>

                    <div className="price-container">
                        <span className="current-price">${currentPrice.toFixed(2)}</span>
                        {originalPrice && (
                            <span className="original-price">${originalPrice.toFixed(2)}</span>
                        )}
                        {originalPrice && (
                            <span className="discount-badge">
                                {Math.round((1 - currentPrice / originalPrice) * 100)}% OFF
                            </span>
                        )}
                    </div>

                    <div className="availability">
                        <span className={`status ${inStock ? 'in-stock' : 'out-of-stock'}`}>
                            {inStock ? 'In Stock' : 'Out of Stock'}
                        </span>
                        {inStock && selectedColor?.stock_quantity && (
                            <span className="stock-quantity">
                                Only {selectedColor.stock_quantity} left!
                            </span>
                        )}
                    </div>

                    {/* Description Toggle Button */}
                    <button 
                        className="section-toggle-button"
                        onClick={() => toggleSection('description')}
                    >
                        <span>Description</span>
                        <svg 
                            width="16" 
                            height="16" 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="2"
                            className={`icon ${activeSection === 'description' ? 'expanded' : ''}`}
                        >
                            <polyline points="6 9 12 15 18 9" />
                        </svg>
                    </button>

                    {/* Color Selection */}
                    {product.colors?.length > 0 && product.product_type === 'single' && (
                        <div className="option-selector color-selector">
                            <h3>Color: <span>{selectedColor?.name}</span></h3>
                            <div className="options">
                                {product.colors.map(color => (
                                    <button
                                        key={`color-${color.color_id}`}
                                        className={`color-option ${selectedColor?.color_id === color.color_id ? 'selected' : ''}`}
                                        onClick={() => setSelectedColor(color)}
                                        style={{ backgroundColor: color.name.toLowerCase() }}
                                        aria-label={color.name}
                                    >
                                        {selectedColor?.color_id === color.color_id && (
                                            <svg width="12" height="12" viewBox="0 0 24 24" 
                                                fill="none" stroke="#FFF" strokeWidth="3">
                                                <polyline points="20 6 9 17 4 12" />
                                            </svg>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Model Selection */}
                    {product.models?.length > 0 && product.product_type === 'variable' && (
                        <div className="option-selector model-selector">
                            <h3>Model: <span>{selectedModel?.name}</span></h3>
                            <div className="options">
                                {product.models.map(model => (
                                    <button
                                        key={`model-${model.model_id}`}
                                        className={`model-option ${selectedModel?.model_id === model.model_id ? 'selected' : ''}`}
                                        onClick={() => {
                                            setSelectedModel(model);
                                            setSelectedColor(model.colors?.[0] || null);
                                        }}
                                    >
                                        {model.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Model Color Selection */}
                    {selectedModel?.colors?.length > 0 && product.product_type === 'variable' && (
                        <div className="option-selector color-selector">
                            <h3>Color: <span>{selectedColor?.name}</span></h3>
                            <div className="options">
                                {selectedModel.colors.map(color => (
                                    <button
                                        key={`model-color-${color.color_id}`}
                                        className={`color-option ${selectedColor?.color_id === color.color_id ? 'selected' : ''}`}
                                        onClick={() => setSelectedColor(color)}
                                        style={{ backgroundColor: color.name.toLowerCase() }}
                                        aria-label={color.name}
                                    >
                                        {selectedColor?.color_id === color.color_id && (
                                            <svg width="12" height="12" viewBox="0 0 24 24" 
                                                fill="none" stroke="#FFF" strokeWidth="3">
                                                <polyline points="20 6 9 17 4 12" />
                                            </svg>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Quantity Selector */}
                    <div className="quantity-selector">
                        <h3>Quantity</h3>
                        <div className="quantity-control">
                            <button onClick={() => handleQuantityChange(-1)}>-</button>
                            <span>{quantity}</span>
                            <button onClick={() => handleQuantityChange(1)}>+</button>
                        </div>
                    </div>

                    {/* Status Messages */}
                    {cartStatus.error && (
                        <div className="cart-status error">
                            {cartStatus.error}
                        </div>
                    )}
                    {cartStatus.success && (
                        <div className="cart-status success">
                            Item added to cart!
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="action-buttons">
                        <button
                            className="add-to-cart"
                            onClick={handleAddToCart}
                            disabled={!inStock || cartStatus.loading}
                        >
                            {cartStatus.loading ? 'Adding...' : 
                             inStock ? 'Add to Cart' : 'Out of Stock'}
                        </button>
                        <button
                            className="buy-now"
                            onClick={() => {
                                handleAddToCart();
                                navigate('/checkout');
                            }}
                            disabled={!inStock || cartStatus.loading}
                        >
                            Buy Now
                        </button>
                        <button
                            className={`wishlist ${wishlistItems.includes(product.product_id) ? 'active' : ''}`}
                            onClick={handleWishlistToggle}
                            aria-label={
                                wishlistItems.includes(product.product_id)
                                    ? "Remove from wishlist"
                                    : "Add to wishlist"
                            }
                        >
                            <svg
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill={
                                    wishlistItems.includes(product.product_id)
                                        ? "#FF4757"
                                        : "none"
                                }
                                stroke="#111"
                            >
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                            </svg>
                        </button>
                    </div>

                    {/* Specifications Toggle Button */}
                    {(product.specifications?.length > 0 || selectedModel?.specifications?.length > 0) && (
                        <button 
                            className="section-toggle-button"
                            onClick={() => toggleSection('specifications')}
                        >
                            <span>Specifications</span>
                            <svg 
                                width="16" 
                                height="16" 
                                viewBox="0 0 24 24" 
                                fill="none" 
                                stroke="currentColor" 
                                strokeWidth="2"
                                className={`icon ${activeSection === 'specifications' ? 'expanded' : ''}`}
                            >
                                <polyline points="6 9 12 15 18 9" />
                            </svg>
                        </button>
                    )}

                    {/* Model Details Toggle Button */}
                    {selectedModel?.description && (
                        <button 
                            className="section-toggle-button"
                            onClick={() => toggleSection('modelDetails')}
                        >
                            <span>Model Details</span>
                            <svg 
                                width="16" 
                                height="16" 
                                viewBox="0 0 24 24" 
                                fill="none" 
                                stroke="currentColor" 
                                strokeWidth="2"
                                className={`icon ${activeSection === 'modelDetails' ? 'expanded' : ''}`}
                            >
                                <polyline points="6 9 12 15 18 9" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>

            {/* Full Width Sections */}
            {/* Description Section */}
            {activeSection === 'description' && (
                <div className="full-width-section">
                    <div className="section-content">
                        <h2>Product Description</h2>
                        <p className="description">{product.description}</p>
                    </div>
                </div>
            )}

            {/* Specifications Section */}
            {activeSection === 'specifications' && (
                <div className="full-width-section">
                    <div className="section-content">
                        <h2>Product Specifications</h2>
                        {product.specifications?.length > 0 && (
                            <div className="specifications">
                                <table>
                                    <tbody>
                                        {product.specifications.map((spec, i) => (
                                            <tr key={`spec-${i}-${spec.key}`}>
                                                <td>{spec.key}</td>
                                                <td>{spec.value}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {selectedModel?.specifications?.length > 0 && (
                            <div className="specifications">
                                <h3>Model Specifications</h3>
                                <table>
                                    <tbody>
                                        {selectedModel.specifications.map((spec, i) => (
                                            <tr key={`model-spec-${i}-${spec.key}`}>
                                                <td>{spec.key}</td>
                                                <td>{spec.value}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Model Details Section */}
            {activeSection === 'modelDetails' && (
                <div className="full-width-section">
                    <div className="section-content">
                        <h2>Model Details</h2>
                        <div className="model-description">
                            <div className="description-content">
                                {selectedModel.description}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductPage;