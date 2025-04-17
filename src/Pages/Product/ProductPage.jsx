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
        isAuthenticated
    } = useAuth();

    // State management
    const [product, setProduct] = useState(location.state?.product || null);
    const [loading, setLoading] = useState(!location.state?.product);
    const [error, setError] = useState(null);
    const [selectedColor, setSelectedColor] = useState(null);
    const [selectedModel, setSelectedModel] = useState(null);
    const [selectedImage, setSelectedImage] = useState(0);
    const [quantity, setQuantity] = useState(1);
    const [filteredImages, setFilteredImages] = useState([]);
    const [isWishlisting, setIsWishlisting] = useState(false); // Add this state

    const [cartStatus, setCartStatus] = useState({
        loading: false,
        error: null,
        success: false
    });
    const [activeTab, setActiveTab] = useState('description');
    const [selectionsLoading, setSelectionsLoading] = useState(true);


    useEffect(() => {
        if (product) {
            console.log("Complete Product Object:", product);
        }
    }, [product]);

    // Fetch product data if not passed via state
    useEffect(() => {
        console.log("useEffect triggered");
        console.log("location.state?.product:", location.state?.product);
        console.log("location.pathname:", location.pathname);



        if (!location.state?.product && location.pathname.includes('/product/')) {
            const productId = location.pathname.split('/product/')[1];
            const fetchProduct = async () => {
                try {
                    const response = await axios.get(
                        `${import.meta.env.VITE_SERVER_API}/product/${productId}`
                    );

                    // Log entire product details
                    console.log("Fetched Product Details:", response.data);

                    setProduct(response.data);
                    setLoading(false);
                } catch (err) {
                    setError(err.message);
                    setLoading(false);
                }
            };
            fetchProduct();
        } else {
            setLoading(false);
        }
    }, [location]);

    // Handle initial selections and preselections
    useEffect(() => {
        if (product && !loading) {
            setSelectionsLoading(true);

            const preselected = location.state?.preselected;
            let targetModel = null;
            let targetColor = null;

            if (location.state?.selectedModel) {
                targetModel = location.state.selectedModel;
            }
            if (location.state?.selectedColor) {
                targetColor = location.state.selectedColor;
            }

            if (preselected) {
                if (preselected.modelId && product.models) {
                    const foundModel = product.models.find(m => m.model_id === preselected.modelId);
                    if (foundModel) targetModel = foundModel;
                }

                if (preselected.colorId) {
                    if (targetModel?.colors) {
                        const foundColor = targetModel.colors.find(c => c.color_id === preselected.colorId);
                        if (foundColor) targetColor = foundColor;
                    }
                    else if (product.colors) {
                        const foundColor = product.colors.find(c => c.color_id === preselected.colorId);
                        if (foundColor) targetColor = foundColor;
                    }
                }
            }

            if (product.product_type === 'variable') {
                setSelectedModel(targetModel || product.models?.[0] || null);
                setSelectedColor(
                    targetColor ||
                    targetModel?.colors?.[0] ||
                    product.models?.[0]?.colors?.[0] ||
                    null
                );
            } else {
                setSelectedColor(targetColor || product.colors?.[0] || null);
            }

            setSelectionsLoading(false);
        }
    }, [product, loading, location.state]);

    // Update filtered images when selections change
    useEffect(() => {
        if (product && !selectionsLoading) {
            const images = getFilteredImages(product, selectedModel, selectedColor);
            setFilteredImages(images);
            setSelectedImage(0);
        }
    }, [product, selectedModel, selectedColor, selectionsLoading]);



    const getImageUrl = (img) => {
        if (!img) return null;

        // Case 1: Direct path string (from MainProducts)
        if (typeof img === 'string') {
            // Remove leading slash if present to avoid double slashes
            const cleanPath = img.startsWith('/') ? img.slice(1) : img;
            return `${import.meta.env.VITE_SERVER_API}/static/${cleanPath}`;
        }

        // Case 2: Object with image_url (from HomeProducts)
        if (typeof img === 'object' && img.image_url) {
            const cleanPath = img.image_url.startsWith('/')
                ? img.image_url.slice(1)
                : img.image_url;
            return `${import.meta.env.VITE_SERVER_API}/static/${cleanPath}`;
        }

        return null;
    };



    const getFilteredImages = (product, selectedModel, selectedColor) => {
        if (!product) return [];

        console.log('Getting filtered images with:', {
            productType: product.product_type,
            selectedModel: selectedModel?.name,
            selectedColor: selectedColor?.name
        });

        if (product.product_type === 'variable' && selectedModel) {
            return selectedColor?.images ||
                selectedModel.images ||
                product.images ||
                [];


        }

        return selectedColor?.images ||
            product.images ||
            [];
    };

    const handleAddToCart = async () => {
        if (!product) {
            setCartStatus({ error: 'Product not loaded', success: false, loading: false });
            return;
        }
    
        if (!isAuthenticated) {
            setCartStatus({ error: 'Please login to add items to cart', success: false, loading: false });
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
    
            const response = await axios.post(
                `${import.meta.env.VITE_SERVER_API}/cart/additem`,
                payload,
                {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                });
    
            if (response.data.success) {
                const cartItem = {
                    product_id: product.product_id,
                    name: product.name,
                    price: selectedColor?.price ||
                        selectedModel?.colors?.[0]?.price ||
                        product.price ||
                        0,
                    original_price: selectedColor?.original_price || // Add original price here
                        selectedModel?.colors?.[0]?.original_price ||
                        product.original_price ||
                        null,
                    image: filteredImages[0]?.image_url ||
                        product.images?.[0]?.image_url,
                    color: selectedColor?.name,
                    model: selectedModel?.name,
                    quantity
                };
    
                addToCart(cartItem);
                setCartStatus({ loading: false, error: null, success: true });
    
                window.dispatchEvent(new CustomEvent('openCart'));
                setTimeout(() => setCartStatus(prev => ({ ...prev, success: false })), 3000);
            } else {
                throw new Error(response.data.error || 'Failed to add to cart');
            }
        } catch (err) {
            let errorMessage = err.response?.data?.error || err.message;
    
            if (err.response?.status === 403) {
                errorMessage = 'Session expired. Please login again.';
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                navigate('/login');
            }
    
            setCartStatus({ loading: false, error: errorMessage, success: false });
        }
    };


    const handleWishlistToggle = async () => {
        if (isWishlisting || !product) return; // Prevent rapid clicks
        setIsWishlisting(true);

        try {
            await toggleWishlistItem(product, selectedModel, selectedColor);

            if (isAuthenticated) {
                const token = localStorage.getItem('token');
                const isInWishlist = wishlistItems.some(item =>
                    item.product_id === product.product_id &&
                    item.model_id === (selectedModel?.model_id || null) &&
                    item.color_id === (selectedColor?.color_id || null)
                );

                const endpoint = isInWishlist
                    ? `${import.meta.env.VITE_SERVER_API}/wishlist/deleteitem`
                    : `${import.meta.env.VITE_SERVER_API}/wishlist/additem`;

                await axios.post(
                    endpoint,
                    {
                        product_id: product.product_id,
                        model_id: selectedModel?.model_id || null,
                        color_id: selectedColor?.color_id || null,
                    },
                    { headers: { 'Authorization': `Bearer ${token}` } }
                );
            }
        } catch (err) {
            console.error('Error syncing wishlist:', err);
            toggleWishlistItem(product, selectedModel, selectedColor); // Revert on error
        } finally {
            setIsWishlisting(false); // Reset state
        }
    };

    const currentStock = selectedColor?.stock_quantity ||
        selectedModel?.colors?.reduce((acc, color) => acc + color.stock_quantity, 0) ||
        product.stock_quantity ||
        0;

    const incrementQuantity = () => setQuantity(prev => Math.min(currentStock, prev + 1));
    const decrementQuantity = () => setQuantity(prev => Math.max(1, prev - 1));

    const isInWishlist = wishlistItems.some(item =>
        item.product_id === product.product_id &&
        item.model_id === (selectedModel?.model_id || null) &&
        item.color_id === (selectedColor?.color_id || null)
    );

    const currentPrice = selectedColor?.price ||
        selectedModel?.colors?.[0]?.price ||
        product.price ||
        0;
    const originalPrice = selectedColor?.original_price ||
        selectedModel?.colors?.[0]?.original_price ||
        null;

    const inStock = currentStock > 0;

    if (loading || selectionsLoading) {
        return <div className="loading-state">Loading...</div>;
    }
    if (error) {
        return <div className="error-state">Error: {error}</div>;
    }
    if (!product) {
        return <div className="not-found">Product Not Found</div>;
    }

    return (
        <div className="product-page">
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
                <div className="product-gallery">
                    <div className="thumbnail-container">
                        {filteredImages.map((img, index) => {
                            const imageUrl = getImageUrl(img);
                            return (
                                <div
                                    key={`thumb-${index}`}
                                    className={`thumbnail ${selectedImage === index ? 'active' : ''}`}
                                    onClick={() => setSelectedImage(index)}
                                >
                                    <img
                                        src={imageUrl}
                                        alt={`${product.name} thumbnail ${index + 1}`}
                                        onError={(e) => {
                                            // e.target.src = '/fallback-image.jpg';
                                            e.target.style.objectFit = 'contain';
                                            console.error('Thumbnail load failed:', {
                                                attemptedUrl: imageUrl,
                                                imageData: img
                                            });
                                        }}
                                    />
                                </div>
                            );
                        })}
                    </div>

                    <div className="main-image">
                        {filteredImages.length > 0 && (
                            <>
                                <img
                                    src={getImageUrl(filteredImages[selectedImage])}
                                    alt={product.name}
                                    onError={(e) => {
                                        // e.target.src = '/fallback-image.jpg';
                                        e.target.style.objectFit = 'contain';
                                        console.error('Image load failed:', {
                                            attemptedUrl: e.target.src,
                                            imageData: filteredImages[selectedImage]
                                        });
                                    }}
                                />
                                <div className="image-nav">
                                    <button
                                        className="nav-arrow prev"
                                        onClick={() => setSelectedImage(prev => (prev > 0 ? prev - 1 : filteredImages.length - 1))}
                                    >
                                        ‹
                                    </button>
                                    <button
                                        className="nav-arrow next"
                                        onClick={() => setSelectedImage(prev => (prev < filteredImages.length - 1 ? prev + 1 : 0))}
                                    >
                                        ›
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>

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
                        <span className="current-price">₹{currentPrice.toFixed(2)}</span>
                        {originalPrice && (
                            <>
                                <span className="original-price">₹{originalPrice.toFixed(2)}</span>
                                <span className="discount-badge">
                                    {Math.round((1 - currentPrice / originalPrice) * 100)}% OFF
                                </span>
                            </>
                        )}
                    </div>

                    <div className="availability">
                        {inStock ? (
                            selectedColor?.stock_quantity <= 10 ? (
                                <span className="stock-quantity">
                                    Only {selectedColor.stock_quantity} left!
                                </span>
                            ) : (
                                <span className="status in-stock">In Stock</span>
                            )
                        ) : (
                            <span className="status out-of-stock">Out of Stock</span>
                        )}
                    </div>



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
                                            <svg
                                                width="12"
                                                height="12"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="#FFF"
                                                strokeWidth="3"
                                            >
                                                <polyline points="20 6 9 17 4 12" />
                                            </svg>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

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
                                            <svg
                                                width="12"
                                                height="12"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="#FFF"
                                                strokeWidth="3"
                                            >
                                                <polyline points="20 6 9 17 4 12" />
                                            </svg>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="quantity-selector">
                        <h3>Quantity</h3>
                        <div className="quantity-control">
                            <button onClick={decrementQuantity}>-</button>
                            <span>{quantity}</span>
                            <button onClick={incrementQuantity}>+</button>
                        </div>
                    </div>

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

                    <div className="action-buttons">
                        <button
                            className="add-to-cart"
                            onClick={handleAddToCart}
                            disabled={!inStock || cartStatus.loading}
                        >
                            {cartStatus.loading ? 'Adding...' : inStock ? 'Add to Cart' : 'Out of Stock'}
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
                            className={`wishlist ${isInWishlist ? 'active' : ''}`}
                            onClick={handleWishlistToggle}
                            aria-label={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
                        >
                            <svg
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill={isInWishlist ? "#FF4757" : "none"}
                                stroke="#111"
                            >
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Tabbed Content Section */}
            <div className="tabbed-content">
                <div className="tabs">
                    <button
                        className={`tab ${activeTab === 'description' ? 'active' : ''}`}
                        onClick={() => setActiveTab('description')}
                    >
                        Description
                    </button>
                    <button
                        className={`tab ${activeTab === 'specifications' ? 'active' : ''}`}
                        onClick={() => setActiveTab('specifications')}
                    >
                        Specifications
                    </button>
                    {selectedModel?.description && (
                        <button
                            className={`tab ${activeTab === 'modelDetails' ? 'active' : ''}`}
                            onClick={() => setActiveTab('modelDetails')}
                        >
                            Model Details
                        </button>
                    )}
                </div>

                <div className="tab-content">
                    {activeTab === 'description' && (
                        <div className="description-content">
                            <p>{product.description}</p>
                        </div>
                    )}

                    {activeTab === 'specifications' && (
                        <div className="specifications-content">
                            {/* Show product-level specs for single products */}
                            {product.product_type === 'single' && product.specifications?.length > 0 && (
                                <div className="product-specs">
                                    <table>
                                        <tbody>
                                            {product.specifications.map((spec, i) => (
                                                <tr key={`prod-spec-${i}-${spec.key}`}>
                                                    <td>{spec.key}</td>
                                                    <td>{spec.value}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* Show model specs for variable products */}
                            {product.product_type === 'variable' && selectedModel?.specifications?.length > 0 && (
                                <div className="model-specs">
                                    <h3>Specifications</h3>
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
                    )}


                    {/* {selectedModel?.specifications?.length > 0 && (
                        <div className="model-specs">
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
                    )} */}
                </div>


                {activeTab === 'modelDetails' && selectedModel?.description && (
                    <div className="model-details-content">
                        <p>{selectedModel.description}</p>
                    </div>
                )}
            </div>
        </div>

    );
};

export default ProductPage;