
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './ProductPage.scss';
import { useAuth } from '../../Components/Context/AuthContext';
import useMetaTags from '../../Components/Hooks/useMetaTags';
import Cart from '../../Pages/Cart/Cart';
import WhatsAppIcon from '@mui/icons-material/WhatsApp'; // or use your own WhatsApp icon
import Loader from '../../Components/Loader/Loader';


// Move this outside the component
const extractProductNameFromUrl = () => {
    const pathParts = window.location.pathname.split('/products/');
    if (pathParts.length !== 2) return null;
    return pathParts[1]; // Get everything after '/products/'
};

const ProductPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const {
        addToCart,
        toggleWishlistItem,
        wishlistItems,
        isAuthenticated
    } = useAuth();


    const productSlug = extractProductNameFromUrl();


    // State management
    const [product, setProduct] = useState(location.state?.product || null);
    const [loading, setLoading] = useState(!location.state?.product);
    const [error, setError] = useState(null);
    const [selectedColor, setSelectedColor] = useState(null);
    const [selectedModel, setSelectedModel] = useState(null);
    const [selectedImage, setSelectedImage] = useState(0);
    const [quantity, setQuantity] = useState(1);
    const [isWishlisting, setIsWishlisting] = useState(false);
    const [reviews, setReviews] = useState([]);
    const [showReviewsModal, setShowReviewsModal] = useState(false);
    const [reviewsLoading, setReviewsLoading] = useState(false);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);


    const [cartStatus, setCartStatus] = useState({
        loading: false,
        error: null,
        success: false
    });
    const [activeTab, setActiveTab] = useState('description');
    const [selectionsLoading, setSelectionsLoading] = useState(true);

    const [showAddReviewModal, setShowAddReviewModal] = useState(false);
    const [newReviewRating, setNewReviewRating] = useState(0);
    const [newReviewText, setNewReviewText] = useState('');
    const [reviewSubmitStatus, setReviewSubmitStatus] = useState({
        loading: false,
        error: null,
        success: false
    });

    const [similarProducts, setSimilarProducts] = useState([]);
    const [similarProductsLoading, setSimilarProductsLoading] = useState(false);

    const handleBuyNow = async () => {
        if (!product) {
            setCartStatus({ error: 'Product not loaded', success: false, loading: false });
            return;
        }

        if (!isAuthenticated) {
            const buyNowItem = {
                product_id: product.product_id,
                name: product.name,
                price: selectedColor?.price || selectedModel?.colors?.[0]?.price || product.price || 0,
                original_price: selectedColor?.original_price || selectedModel?.colors?.[0]?.original_price || product.original_price || null,
                image: product.images?.[0]?.image_url || product.images?.[0],
                color: selectedColor?.name,
                model: selectedModel?.name,
                color_id: selectedColor?.color_id || null,
                model_id: selectedModel?.model_id || null,
                quantity: quantity
            };

            // Clear any existing pending items first
            sessionStorage.removeItem('pendingCartItem');
            sessionStorage.removeItem('pendingBuyNowItem');

            // Store the buy now item
            sessionStorage.setItem('pendingBuyNowItem', JSON.stringify(buyNowItem));
            sessionStorage.setItem('returnAfterLogin', '/checkout'); // Explicitly set checkout as destination

            navigate('/login', {
                state: {
                    from: location.pathname,
                    isFromBuyNow: true
                },
                replace: false  // This ensures state is preserved
            });
            return;
        }

        setCartStatus({ loading: true, error: null, success: false });

        try {
            const buyNowItem = {
                product_id: product.product_id,
                name: product.name,
                price: selectedColor?.price ||
                    selectedModel?.colors?.[0]?.price ||
                    product.price ||
                    0,
                original_price: selectedColor?.original_price ||
                    selectedModel?.colors?.[0]?.original_price ||
                    product.original_price ||
                    null,
                image: product.images?.[0]?.image_url || product.images?.[0],
                color: selectedColor?.name,
                model: selectedModel?.name,
                color_id: selectedColor?.color_id || null,
                model_id: selectedModel?.model_id || null,
                quantity: quantity
            };

            // Navigate to Checkout page with buyNowItem flag
            navigate('/checkout', {
                state: {
                    buyNowItem,
                    isBuyNowFlow: true
                }
            });
        } catch (err) {
            setCartStatus({
                loading: false,
                error: err.response?.data?.error || err.message || 'Failed to proceed',
                success: false
            });
        }
    };

    const handleSubmitReview = async () => {
        if (!isAuthenticated) {
            navigate('/login', { state: { from: location.pathname } });
            return;
        }

        if (newReviewRating === 0) {
            setReviewSubmitStatus({
                error: 'Please select a rating',
                success: false,
                loading: false
            });
            return;
        }

        setReviewSubmitStatus({ loading: true, error: null, success: false });

        try {
            const response = await axios.post(
                `${import.meta.env.VITE_SERVER_API}/review/simple`, // Updated endpoint
                {
                    product_id: product.product_id,
                    rating: newReviewRating,
                    description: newReviewText
                },
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );

            if (response.data.message) {
                setReviewSubmitStatus({ loading: false, error: null, success: true });
                setNewReviewRating(0);
                setNewReviewText('');
                fetchProductReviews(); // Refresh reviews
                setTimeout(() => setShowAddReviewModal(false), 1500);
            } else {
                throw new Error(response.data.error || 'Failed to submit review');
            }
        } catch (err) {
            setReviewSubmitStatus({
                loading: false,
                error: err.response?.data?.error || err.message || 'Failed to submit review',
                success: false
            });
        }
    };


    const fetchProductReviews = async () => {
        if (!product) return;

        try {
            setReviewsLoading(true);
            const response = await axios.get(
                `${import.meta.env.VITE_SERVER_API}/reviews/product/${product.product_id}`
            );
            setReviews(response.data.reviews || []);
        } catch (err) {
            console.error('Error fetching reviews:', err);
        } finally {
            setReviewsLoading(false);
        }
    };

    useEffect(() => {
        const checkIfMobile = () => {
            setIsMobile(window.innerWidth <= 768);
        };

        checkIfMobile();
        window.addEventListener('resize', checkIfMobile);

        return () => window.removeEventListener('resize', checkIfMobile);
    }, []);


    useEffect(() => {
        const fetchProductWithFallback = async (slug) => {
            try {
                console.log('🟡 Fetching product:', slug);
                setLoading(true);
                setError(null);

                // 1️⃣ Try fetching from main API
                const response = await axios.get(
                    `${import.meta.env.VITE_SERVER_API}/product/slug/${slug}`,
                    {
                        params: { full_details: true },
                        headers: { 'Accept': 'application/json' }
                    }
                );

                if (!response.data) throw new Error('Product not found');
                const productData = response.data;

                // Fix image URLs
                if (productData.images?.length > 0) {
                    productData.images = productData.images.map(img => ({
                        ...img,
                        image_url: img.image_url.startsWith('http')
                            ? img.image_url
                            : `${import.meta.env.VITE_SERVER_API}/static/${img.image_url.replace(/^\//, '')}`
                    }));
                }

                console.log('✅ Product fetched from API:', productData);
                setProduct(productData);
                setLoading(false);

            } catch (err) {
                console.warn('⚠️ API fetch failed, trying fallback:', err.message);
                try {
                    const metadataResponse = await axios.get(
                        `${import.meta.env.VITE_SERVER_API}/products/${slug}`,
                        { headers: { 'Accept': 'text/html' } }
                    );

                    const parser = new DOMParser();
                    const htmlDoc = parser.parseFromString(metadataResponse.data, 'text/html');

                    const title = htmlDoc.querySelector('title')?.textContent || 'Product';
                    const description = htmlDoc.querySelector('meta[name="description"]')?.content || '';
                    const ogImage = htmlDoc.querySelector('meta[property="og:image"]')?.content || '';
                    const ogPrice = htmlDoc.querySelector('meta[property="og:price:amount"]')?.content || '0';

                    const fallbackProduct = {
                        name: title,
                        description,
                        price: parseFloat(ogPrice),
                        images: ogImage ? [{ image_url: ogImage }] : [],
                        product_id: `meta-${slug}`,
                        product_type: 'single',
                        stock_quantity: 0
                    };

                    console.log('✅ Product from metadata:', fallbackProduct);
                    setProduct(fallbackProduct);
                    setLoading(false);

                } catch (metadataError) {
                    console.error('❌ Metadata fetch failed:', metadataError);
                    setError('Product not found');
                    setLoading(false);
                    if (err.response?.status === 404) {
                        navigate('/not-found', { replace: true });
                    }
                }
            }
        };
        if (productSlug) {
            fetchProductWithFallback(productSlug);
        }
    }, [productSlug, navigate]);

    // Inside your ProductPage component
    useEffect(() => {
        // This will run on every render
        const fetchAndLogProductByName = async () => {
            const productSlug = extractProductNameFromUrl();
            if (!productSlug) {
                console.log("No product name found in URL");
                return;
            }

            try {
                console.log(`Fetching product by slug: "${productSlug}"`);
                const response = await axios.get(
                    `${import.meta.env.VITE_SERVER_API}/product/slug/${productSlug}`
                );
                console.log("Product details from slug:", response.data);
            } catch (error) {
                console.error("Error fetching product by slug:", error);
            }
        };

        fetchAndLogProductByName();
    }, []); // Empty dependency array means this runs on mount


    useEffect(() => {
        const fetchProductData = async () => {
            // If product is passed via state (client-side navigation)
            if (location.state?.product) {
                setProduct(location.state.product);
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);

                // Extract product slug from URL
                const productSlug = window.location.pathname.split('/products/')[1];
                if (!productSlug) {
                    throw new Error('Invalid product URL');
                }

                // Enhanced crawler detection (before any API calls)
                const isCrawler = /WhatsApp|Twitterbot|facebookexternalhit|LinkedInBot|TelegramBot|Slackbot/i.test(
                    navigator.userAgent
                );

                // If crawler detected, redirect to Flask meta endpoint
                if (isCrawler) {
                    console.log('Crawler detected - redirecting to meta endpoint');
                    window.location.href = `${import.meta.env.VITE_SERVER_API}/products/${encodeURIComponent(productSlug)}`;
                    return;
                }

                console.log('Normal user flow - fetching product data');

                // Normal client flow - fetch product data in single request
                const response = await axios.get(
                    `${import.meta.env.VITE_SERVER_API}/product/slug/${productSlug}`,
                    {
                        params: {
                            full_details: true // Ask backend to return complete product data
                        }
                    }
                );

                if (!response.data) {
                    throw new Error('Product not found');
                }

                // Process product data
                const productData = response.data;

                // Ensure image URLs are absolute
                if (productData.images && productData.images.length > 0) {
                    productData.images = productData.images.map(img => {
                        if (typeof img === 'string') {
                            return {
                                image_url: img.startsWith('http')
                                    ? img
                                    : `${import.meta.env.VITE_SERVER_API}/static/${img.replace(/^\//, '')}`
                            };
                        }
                        return {
                            ...img,
                            image_url: img.image_url.startsWith('http')
                                ? img.image_url
                                : `${import.meta.env.VITE_SERVER_API}/static/${img.image_url.replace(/^\//, '')}`
                        };
                    });
                }

                setProduct(productData);

            } catch (err) {
                console.error('Product fetch error:', {
                    error: err,
                    message: err.message,
                    response: err.response?.data
                });

                setError(err.response?.data?.message || err.message || 'Failed to load product');

                if (err.response?.status === 404) {
                    navigate('/not-found', { replace: true });
                }
            } finally {
                setLoading(false);
            }
        };

        // Only fetch if no product in state
        if (!location.state?.product) {
            fetchProductData();
        }

        // Cleanup function
        return () => {
            // Cancel any ongoing requests if component unmounts
            const source = axios.CancelToken.source();
            source.cancel('Component unmounted');
        };
    }, [location, navigate]);

    useEffect(() => {
        if (product) {

            console.log("Complete Product Object:", product);
            fetchProductReviews();
            fetchSimilarProducts();
        }
    }, [product]);



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
            // ✅ Update this block:
            if (product.models?.length > 0) {
                setSelectedModel(targetModel || product.models?.[0] || null);
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

    const getImageUrl = (img) => {
        if (!img) return null;

        // Case 1: Direct path string (from MainProducts)
        if (typeof img === 'string') {
            // If it's already a full URL, return it directly
            if (img.startsWith('http')) {
                return img;
            }
            // Handle relative paths
            const cleanPath = img.startsWith('/') ? img.slice(1) : img;
            return `${import.meta.env.VITE_SERVER_API}/static/${cleanPath}`;
        }

        // Case 2: Object with image_url (from HomeProducts)
        if (typeof img === 'object' && img.image_url) {
            // If it's already a full URL, return it directly
            if (img.image_url.startsWith('http')) {
                return img.image_url;
            }
            // Handle relative paths
            const cleanPath = img.image_url.startsWith('/')
                ? img.image_url.slice(1)
                : img.image_url;
            return `${import.meta.env.VITE_SERVER_API}/static/${cleanPath}`;
        }

        return null;
    };

    const fetchSimilarProducts = async () => {
        if (!product?.product_id) return;

        try {
            setSimilarProductsLoading(true);
            const response = await axios.get(
                `${import.meta.env.VITE_SERVER_API}/product/${product.product_id}/similar`
            );
            setSimilarProducts(response.data.similar_products || []);
        } catch (err) {
            console.error('Error fetching similar products:', err);
        } finally {
            setSimilarProductsLoading(false);
        }
    };

    const handleAddToCart = async () => {
        if (!product) {
            setCartStatus({ error: 'Product not loaded', success: false, loading: false });
            return;
        }

        if (!isAuthenticated) {
            // Store the cart item data in sessionStorage before redirecting
            const cartItem = {
                product_id: product.product_id,
                name: product.name,
                price: selectedColor?.price ||
                    selectedModel?.colors?.[0]?.price ||
                    product.price ||
                    0,
                original_price: selectedColor?.original_price ||
                    selectedModel?.colors?.[0]?.original_price ||
                    product.original_price ||
                    null,
                image: product.images?.[0]?.image_url || product.images?.[0],
                color: selectedColor?.name,
                model: selectedModel?.name,
                color_id: selectedColor?.color_id || null,
                model_id: selectedModel?.model_id || null,
                quantity: quantity
            };

            sessionStorage.setItem('pendingCartItem', JSON.stringify(cartItem));
            sessionStorage.setItem('returnAfterLogin', window.location.pathname);

            navigate('/login', {
                state: {
                    from: location.pathname,
                    isFromCart: true
                }
            });
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
                    original_price: selectedColor?.original_price ||
                        selectedModel?.colors?.[0]?.original_price ||
                        product.original_price ||
                        null,
                    image: product.images?.[0]?.image_url || product.images?.[0],
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


    // In ProductPage.jsx, update the useEffect for cart opening:
    useEffect(() => {
        if (location.state?.shouldOpenCart) {
            // Get the pending cart item from sessionStorage
            const pendingCartItem = JSON.parse(sessionStorage.getItem('pendingCartItem'));
            setIsCartOpen(true);

            if (pendingCartItem) {
                // Add the item to the cart context
                addToCart(pendingCartItem);

                // Open the cart - we need to dispatch the event properly
                const event = new CustomEvent('openCart', {
                    detail: { open: true }  // Add this detail to match your cart implementation
                });
                window.dispatchEvent(event);

                // Clear the stored data
                sessionStorage.removeItem('pendingCartItem');
                sessionStorage.removeItem('returnAfterLogin');
            }

            // Clear the state to prevent reopening on refresh
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location.state, navigate, addToCart]);


    const handleWishlistToggle = async () => {
        if (isWishlisting || !product) return;
        setIsWishlisting(true);

        try {
            await toggleWishlistItem(product, selectedModel, selectedColor);
        } catch (err) {
            console.error('Error toggling wishlist:', err);
        } finally {
            setIsWishlisting(false);
        }
    };
    const getProductInfo = (product) => {
        let price = 0;
        let original_price = null;
        let inStock = false;

        if (product.product_type === 'single' && product.colors) {
            const validColors = product.colors.filter(c => c.price !== undefined && c.price !== null);
            if (validColors.length > 0) {
                const minPriceEntry = validColors.reduce((min, current) =>
                    parseFloat(current.price) < parseFloat(min.price) ? current : min, validColors[0]);
                price = parseFloat(minPriceEntry.price);
                if (minPriceEntry.original_price) {
                    original_price = parseFloat(minPriceEntry.original_price);
                }
                inStock = validColors.some(c => c.stock_quantity > 0);
            }
        } else if (product.product_type === 'variable' && product.models) {
            const allColors = product.models.flatMap(model =>
                (model.colors || [])
                    .filter(color => color.price !== undefined && color.price !== null)
                    .map(color => ({
                        price: parseFloat(color.price),
                        original_price: color.original_price ? parseFloat(color.original_price) : null,
                        stock: color.stock_quantity > 0,
                    }))
            );
            if (allColors.length > 0) {
                const minPriceColor = allColors.reduce((min, current) =>
                    current.price < min.price ? current : min, allColors[0]);
                price = minPriceColor.price;
                original_price = minPriceColor.original_price;
                inStock = allColors.some(color => color.stock);
            }
        }

        return {
            price,
            original_price,
            inStock
        };
    };

    const incrementQuantity = () => setQuantity(prev => Math.min(currentStock, prev + 1));
    const decrementQuantity = () => setQuantity(prev => Math.max(1, prev - 1));



    if (loading || selectionsLoading) {
        return <Loader />;
    }
    if (error) {
        return <div className="error-state">Error: {error}</div>;
    }
    if (!product) {
        return <div className="not-found">Product Not Found</div>;
    }
    // Calculate currentStock only after we know product exists
    const currentStock = selectedColor?.stock_quantity ||
        selectedModel?.colors?.reduce((acc, color) => acc + color.stock_quantity, 0) ||
        product.stock_quantity ||
        0;

    // const inStock = currentStock > 0;
    const currentPrice = selectedColor?.price ||
        selectedModel?.colors?.[0]?.price ||
        product.price ||
        0;
    const originalPrice = selectedColor?.original_price ||
        selectedModel?.colors?.[0]?.original_price ||
        null;

    const inStock = currentStock > 0;

    const isInWishlist = wishlistItems.some(item =>
        item.product_id === product.product_id &&
        item.model_id === (selectedModel?.model_id || null) &&
        item.color_id === (selectedColor?.color_id || null)
    );

    return (
        <>
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
                            {product.images?.map((img, index) => {
                                const imageUrl = getImageUrl(img);
                                const isVideo = imageUrl && /\.(mp4)$/i.test(imageUrl);

                                return (
                                    <div
                                        key={`thumb-${index}`}
                                        className={`thumbnail ${selectedImage === index ? 'active' : ''}`}
                                        onClick={() => setSelectedImage(index)}
                                    >
                                        {isVideo ? (
                                            <video
                                                className="media"
                                                src={imageUrl}
                                                muted
                                                loop
                                                playsInline
                                                preload="metadata"

                                            />
                                        ) : (
                                            <img
                                                src={imageUrl}
                                                alt={`${product.name} thumbnail ${index + 1}`}
                                                onError={(e) => {
                                                    e.target.src = '/path/to/fallback-image.jpg'; // Add a fallback image
                                                    e.target.style.objectFit = 'contain';
                                                    console.error('Thumbnail load failed:', {
                                                        attemptedUrl: imageUrl,
                                                        imageData: img
                                                    });
                                                }}
                                            />
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        <div className="main-image">
                            {product.images?.length > 0 && (
                                <>
                                    {(() => {
                                        const mainImageUrl = getImageUrl(product.images[selectedImage]);
                                        const isVideo = mainImageUrl && /\.(mp4)$/i.test(mainImageUrl);

                                        return isVideo ? (
                                            <video
                                                className="media"
                                                src={mainImageUrl}
                                                autoPlay
                                                muted
                                                loop
                                                playsInline
                                            // controls
                                            />
                                        ) : (
                                            <img
                                                className="media"
                                                src={mainImageUrl}
                                                alt={product.name}
                                                onError={(e) => {
                                                    e.target.src = '/path/to/fallback-image.jpg'; // Add a fallback image
                                                    e.target.style.objectFit = 'contain';
                                                    console.error('Image load failed:', {
                                                        attemptedUrl: e.target.src,
                                                        imageData: product.images[selectedImage]
                                                    });
                                                }}
                                            />
                                        );
                                    })()}

                                    <div className="image-nav">
                                        <button
                                            className="nav-arrow prev"
                                            onClick={() => setSelectedImage(prev => (prev > 0 ? prev - 1 : product.images.length - 1))}
                                        >
                                            ‹
                                        </button>
                                        <button
                                            className="nav-arrow next"
                                            onClick={() => setSelectedImage(prev => (prev < product.images.length - 1 ? prev + 1 : 0))}
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
                                <div className="rating" onClick={() => setShowReviewsModal(true)}>
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
                                    <span className="review-count" style={{ cursor: 'pointer', textDecoration: 'underline' }}>
                                        ({product.raters || 0} reviews)
                                    </span>
                                </div>
                                {/* <span className="sku">SKU: {product.sku_id}</span> */}
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
                                onClick={handleBuyNow}
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
                            <div className="description-content"
                            >
                                <p>{product.description}</p>
                            </div>
                        )}

                        {activeTab === 'specifications' && (
                            <div className="specifications-content">
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

                        {activeTab === 'modelDetails' && selectedModel?.description && (
                            <div className="model-details-content">
                                <p>{selectedModel.description}</p>
                            </div>
                        )}



                    </div>
                </div>
            </div>
            {showReviewsModal && (
                <div className="reviews-modal">
                    <div className="modal-content">
                        <div className="modal-actions">
                            <button
                                className="add-review-btn"
                                onClick={() => {
                                    setShowReviewsModal(false);
                                    setShowAddReviewModal(true);
                                }}
                                disabled={!isAuthenticated}
                            >
                                {isAuthenticated ? 'Add Your Review' : 'Login to Review'}
                            </button>
                        </div>
                        <button
                            className="close-modal"
                            onClick={() => setShowReviewsModal(false)}
                        >
                            &times;
                        </button>

                        <h2>Customer Reviews</h2>
                        <div className="average-rating">
                            <div className="stars">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <svg
                                        key={`avg-star-${i}`}
                                        width="24"
                                        height="24"
                                        viewBox="0 0 24 24"
                                        fill={i < Math.floor(product.rating) ? "#FFD700" : "#DDD"}
                                    >
                                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                    </svg>
                                ))}
                            </div>
                            <span>{product.rating?.toFixed(1) || 0} out of 5</span>
                            <span>{product.raters || 0} global ratings</span>
                        </div>

                        {reviewsLoading ? (
                            <div className="loading-reviews">Loading reviews...</div>
                        ) : reviews.length === 0 ? (
                            <div className="no-reviews">No reviews yet</div>
                        ) : (
                            <div className="reviews-list">
                                {reviews.map(review => (
                                    <div key={review.review_id} className="review-item">
                                        <div className="review-header">
                                            <div className="user-info">
                                                <span className="user-name">
                                                    {review.customer_name || 'Anonymous'}
                                                </span>
                                                <span className="review-date">
                                                    {new Date(review.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <div className="review-rating">
                                                {Array.from({ length: 5 }).map((_, i) => (
                                                    <svg
                                                        key={`review-star-${i}`}
                                                        width="16"
                                                        height="16"
                                                        viewBox="0 0 24 24"
                                                        fill={i < review.rating ? "#FFD700" : "#DDD"}
                                                    >
                                                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                                    </svg>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="review-body">
                                            <p>{review.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {showAddReviewModal && (
                <div className="add-review-modal">
                    <div className="modal-content">
                        <button
                            className="close-modal"
                            onClick={() => {
                                setShowAddReviewModal(false);
                                setReviewSubmitStatus({ loading: false, error: null, success: false });
                            }}
                        >
                            &times;
                        </button>

                        <h2>Add Your Review</h2>
                        <p>For: {product.name}</p>

                        <div className="rating-section">
                            <h3>Your Rating</h3>
                            <div className="stars">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <span
                                        key={`new-review-star-${star}`}
                                        className="star"
                                        onClick={() => setNewReviewRating(star)}
                                    >
                                        {star <= newReviewRating ? '★' : '☆'}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="review-text">
                            <h3>Your Review</h3>
                            <textarea
                                value={newReviewText}
                                onChange={(e) => setNewReviewText(e.target.value)}
                                placeholder="Share your experience with this product..."
                                rows={5}
                            />
                        </div>

                        {reviewSubmitStatus.error && (
                            <div className="error-message">{reviewSubmitStatus.error}</div>
                        )}
                        {reviewSubmitStatus.success && (
                            <div className="success-message">Review submitted successfully!</div>
                        )}

                        <div className="modal-actions">
                            <button
                                className="cancel-btn"
                                onClick={() => setShowAddReviewModal(false)}
                                disabled={reviewSubmitStatus.loading}
                            >
                                Cancel
                            </button>
                            <button
                                className="submit-btn"
                                onClick={handleSubmitReview}
                                disabled={reviewSubmitStatus.loading || newReviewRating === 0}
                            >
                                {reviewSubmitStatus.loading ? 'Submitting...' : 'Submit Review'}
                            </button>
                        </div>
                    </div>


                </div>
            )}

            {similarProducts.length > 0 && (
                <div className="similar-products-section">
                    <div className="container">
                        <div className="section-header">
                            <h2 className="section-title">You May Also Like</h2>
                            <p className="section-subtitle">Similar products you might enjoy</p>
                        </div>

                        <div className="product-grid">
                            {similarProducts.slice(0, 8).map(similarProduct => {
                                const { price, original_price, inStock } = getProductInfo(similarProduct);
                                const isInWishlist = wishlistItems.some(item =>
                                    item.product_id === similarProduct.product_id &&
                                    item.model_id === null &&
                                    item.color_id === null
                                );

                                const mainImage = similarProduct.images?.[0];
                                const imageUrl = mainImage ? getImageUrl(mainImage) : null;
                                const isVideo = mainImage?.is_video || (imageUrl && /\.(mp4)$/i.test(imageUrl));

                                return (
                                    <div
                                        key={`similar-${similarProduct.product_id}`}
                                        className="product-card"
                                    >
                                        <div className="product-badge">
                                            {inStock ? 'In Stock' : 'Out of Stock'}
                                        </div>
                                        <div
                                            className={`wishlist-icon ${isInWishlist ? 'active' : ''}`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleWishlistItem(similarProduct);
                                            }}
                                        >
                                            <svg
                                                width="24"
                                                height="24"
                                                viewBox="0 0 24 24"
                                                fill={isInWishlist ? "#ff4757" : "none"}
                                                stroke={isInWishlist ? "#ff4757" : "#111"}
                                                strokeWidth="2"
                                            >
                                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                                            </svg>
                                        </div>

                                        <div
                                            className="product-image"
                                            onClick={() => {
                                                const slug = similarProduct.name.toLowerCase().replace(/\s+/g, '-');
                                                navigate(`/products/${slug}`, {
                                                    state: { product: similarProduct }
                                                });
                                                window.scrollTo(0, 0);
                                            }}
                                        >
                                            {imageUrl ? (
                                                isVideo ? (
                                                    <video
                                                        className="media"
                                                        src={imageUrl}
                                                        muted
                                                        loop
                                                        playsInline
                                                        preload="metadata"
                                                    />
                                                ) : (
                                                    <img
                                                        className="media"
                                                        src={imageUrl}
                                                        alt={similarProduct.name}
                                                        loading="lazy"
                                                        onError={(e) => {
                                                            e.target.src = '/path/to/fallback-image.jpg';
                                                            console.error('Failed to load similar product image:', {
                                                                product: similarProduct.name,
                                                                imageUrl: imageUrl
                                                            });
                                                        }}
                                                    />
                                                )
                                            ) : (
                                                <div className="image-placeholder">
                                                    <span>No Image</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="product-details">
                                            <span className="product-category">
                                                {similarProduct.category || 'Uncategorized'}
                                            </span>
                                            <h3 className="product-name">{similarProduct.name}</h3>
                                            <div className="product-pricing">
                                                <div className="price-wrapper">
                                                    <span className="current-price">₹{price?.toFixed(2) || '--'}</span>
                                                    {original_price && (
                                                        <span className="original-price">₹{original_price.toFixed(2)}</span>
                                                    )}
                                                </div>
                                                {original_price && (
                                                    <span className="discount-percent">
                                                        {Math.round((1 - price / original_price) * 100)}% OFF
                                                    </span>
                                                )}
                                            </div>
                                            <button
                                                className="add-to-cart"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    const slug = similarProduct.name.toLowerCase().replace(/\s+/g, '-');
                                                    navigate(`/products/${slug}`, {
                                                        state: { product: similarProduct }
                                                    });
                                                    window.scrollTo(0, 0);
                                                }}
                                            >
                                                {isMobile ? 'View' : 'View Product'}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            <Cart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

            <div className="whatsapp-float">
                <a
                    href="https://wa.me/+917942541131"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Chat on WhatsApp"
                >
                    <WhatsAppIcon className="whatsapp-icon" />
                </a>
            </div>
        </>
    );
};

export default ProductPage;