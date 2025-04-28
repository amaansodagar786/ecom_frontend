import React, { useEffect, useState } from 'react';
import { useAuth } from '../../Components/Context/AuthContext';
import { FiHeart, FiTrash2, FiShoppingCart, FiChevronRight } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import "./Wishlist.scss";
import Loader from '../../Components/Loader/Loader';

const Wishlist = () => {
  const {
    wishlistItems,
    toggleWishlistItem,
    isAuthenticated,
    getToken,
    updateWishlistCount
  } = useAuth();
  const [wishlistProducts, setWishlistProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const [isWishlisting, setIsWishlisting] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const fetchWishlistProducts = async () => {
      try {
        const token = getToken();
        const response = await axios.get(
          `${import.meta.env.VITE_SERVER_API}/wishlist/getbycustid`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.data.success) {
          const items = response.data.wishlist.items || [];
          setWishlistProducts(items);

          // Convert to format compatible with AuthContext
          const simplifiedItems = items.map(item => ({
            product_id: item.product.product_id,
            model_id: item.model?.model_id || null,
            color_id: item.color?.color_id || null
          }));

          updateWishlistCount(simplifiedItems);
        } else {
          setWishlistProducts([]);
          updateWishlistCount([]);
        }
        setLoading(false);
      } catch (err) {
        console.error('Error fetching wishlist:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchWishlistProducts();
  }, [isAuthenticated, getToken, navigate, updateWishlistCount]);

  const handleClearWishlist = async () => {
    if (isClearing || wishlistProducts.length === 0) return;

    setIsClearing(true);
    try {
      const token = getToken();
      await axios.delete(
        `${import.meta.env.VITE_SERVER_API}/wishlist/clear`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      // Update both local state and AuthContext
      setWishlistProducts([]);
      updateWishlistCount([]);
    } catch (error) {
      console.error('Error clearing wishlist:', error);
    } finally {
      setIsClearing(false);
    }
  };

  const getWishlistItemPrice = (item) => {
    // Check if we have a selected color price
    if (item.color?.price) {
      return {
        currentPrice: parseFloat(item.color.price),
        originalPrice: item.color.original_price ? parseFloat(item.color.original_price) : null
      };
    }

    // Check if product has colors (single product type)
    if (item.product?.colors?.length > 0) {
      return {
        currentPrice: parseFloat(item.product.colors[0].price),
        originalPrice: item.product.colors[0].original_price
          ? parseFloat(item.product.colors[0].original_price)
          : null
      };
    }

    // Check if product has models with colors (variable product type)
    if (item.product?.models?.length > 0 && item.product.models[0].colors?.length > 0) {
      return {
        currentPrice: parseFloat(item.product.models[0].colors[0].price),
        originalPrice: item.product.models[0].colors[0].original_price
          ? parseFloat(item.product.models[0].colors[0].original_price)
          : null
      };
    }

    // Fallback to product price if exists
    return {
      currentPrice: item.product?.price ? parseFloat(item.product.price) : 0,
      originalPrice: item.product?.original_price ? parseFloat(item.product.original_price) : null
    };
  };

  const handleRemoveItem = async (item) => {
    if (isWishlisting) return;
    setIsWishlisting(true);

    try {
      const token = getToken();
      await axios.delete(
        `${import.meta.env.VITE_SERVER_API}/wishlist/deleteitem`,
        {
          headers: { Authorization: `Bearer ${token}` },
          data: {
            product_id: item.product.product_id,
            model_id: item.model?.model_id || null,
            color_id: item.color?.color_id || null
          }
        }
      );

      // Update both local state and AuthContext
      await toggleWishlistItem(item.product, item.model, item.color);
    } catch (error) {
      console.error('Error removing item:', error);
    } finally {
      setIsWishlisting(false);
    }
  };

  const handleViewProduct = async (item) => {
    try {
      // Fetch full product details first
      const response = await axios.get(
        `${import.meta.env.VITE_SERVER_API}/product/${item.product.product_id}`
      );
  
      const fullProduct = response.data;
  
      // Create slug from product name
      const productSlug = fullProduct.name.toLowerCase().replace(/\s+/g, '-');
  
      // Prepare navigation state with all necessary details
      const navigationState = {
        product: fullProduct,
        selectedModel: item.model || null,
        selectedColor: item.color || null,
        preselected: {
          modelId: item.model?.model_id || null,
          colorId: item.color?.color_id || null
        }
      };
  
      navigate(`/products/${productSlug}`, {
        state: navigationState
      });
    } catch (error) {
      console.error('Error fetching product details:', error);
  
      // Fallback: create slug from existing product name
      const fallbackSlug = item.product.name.toLowerCase().replace(/\s+/g, '-');
  
      navigate(`/products/${item.product.product_id}/${fallbackSlug}`, {
        state: {
          product: item.product,
          selectedModel: item.model || null,
          selectedColor: item.color || null,
          preselected: {
            modelId: item.model?.model_id || null,
            colorId: item.color?.color_id || null
          }
        }
      });
    }
  };
  

  const getVariantDetails = (item) => {
    if (!item.model) return null;
    return `Model: ${item.model.name}`;
  };

  if (loading) return <Loader />;
  if (isWishlisting) return <Loader />;
  if (isClearing) return <Loader />;

  if (error) return (
    <div className="error-state">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
      <p>Error loading wishlist: {error}</p>
    </div>
  );

  return (
    <div className="wishlist-page">
      <div className="wishlist-header">
        <div className="header-content">
          <h1>Your Wishlist</h1>
          <p className="item-count">{wishlistProducts.length} {wishlistProducts.length === 1 ? 'item' : 'items'}</p>
        </div>

        {wishlistProducts.length > 0 && (
          <button
            onClick={handleClearWishlist}
            className="clear-wishlist-btn"
            disabled={isClearing}
          >
            <FiTrash2 size={16} />
            {isClearing ? 'Clearing...' : 'Clear Wishlist'}
          </button>
        )}
      </div>

      {wishlistProducts.length > 0 ? (
        <div className="wishlist-container">
          <div className="wishlist-items">
            {wishlistProducts.map(item => {
              const { currentPrice, originalPrice } = getWishlistItemPrice(item);
              const imageUrl =
                item.color?.images?.[0]?.image_url ||
                item.product?.images?.[0]?.image_url ||
                item.product?.image_url ||
                (item.product?.models?.[0]?.colors?.[0]?.images?.[0]?.image_url);

              const fullImageUrl = imageUrl ? `${import.meta.env.VITE_SERVER_API}/static/${imageUrl}` : null;
              const isVideo = fullImageUrl && /\.(mp4)$/i.test(fullImageUrl);

              return (
                <div key={item.item_id} className="wishlist-item">
                  <div className="product-image">
                    {fullImageUrl ? (
                      isVideo ? (
                        <video
                          className="media"
                          src={fullImageUrl}
                          autoPlay
                          muted
                          loop
                          playsInline
                          controls
                        />
                      ) : (
                        <img
                          className="media"
                          src={fullImageUrl}
                          alt={item.product.name}
                          loading="lazy"
                          onError={(e) => {
                            console.error("Image failed to load for:", fullImageUrl);
                            e.target.src = '/fallback-image.jpg';
                          }}
                        />
                      )
                    ) : (
                      <div className="no-image">No Image Available</div>
                    )}
                    <button
                      className="remove-btn"
                      onClick={() => handleRemoveItem(item)}
                    >
                      <FiTrash2 size={18} />
                    </button>
                  </div>

                  <div className="product-details">
                    <h3 className="product-name">{item.product.name}</h3>
                    {getVariantDetails(item) && (
                      <p className="product-variant">{getVariantDetails(item)}</p>
                    )}
                    <p className="product-category">{item.product.category}</p>
                    <div className="product-pricing">
                      <span className="current-price">
                        ₹{currentPrice.toFixed(2)}
                      </span>
                      {originalPrice && originalPrice > currentPrice && (
                        <span className="original-price">
                          ₹{originalPrice.toFixed(2)}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleViewProduct(item)}
                      className="view-product-btn"
                    >
                      View Product
                      <FiChevronRight size={18} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="empty-wishlist">
          <div className="empty-icon">
            <FiHeart size={48} />
          </div>
          <h2>Your Wishlist is Empty</h2>
          <p>Save your favorite items here for later</p>
          <button
            className="continue-shopping"
            onClick={() => navigate('/')}
          >
            Continue Shopping
          </button>
        </div>
      )}
    </div>
  );
};

export default Wishlist;