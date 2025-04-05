import React, { useEffect, useState } from 'react';
import { useAuth } from '../../Components/Context/AuthContext';
import { FiHeart, FiTrash2, FiShoppingCart, FiChevronRight } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import "./Wishlist.scss";

const Wishlist = () => {
  const {
    wishlistItems,
    toggleWishlistItem,
    isAuthenticated,
    getToken
  } = useAuth();
  const [wishlistProducts, setWishlistProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

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
          setWishlistProducts(response.data.wishlist.items || []);
          console.log("Fetched wishlist items:", response.data.wishlist.items);
        } else {
          setWishlistProducts([]);
        }
        setLoading(false);
      } catch (err) {
        console.error('Error fetching wishlist:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchWishlistProducts();
  }, [isAuthenticated, getToken, navigate, wishlistItems]);

  const getWishlistItemPrice = (item) => {
    // 1. Check if we have a selected color price
    if (item.color?.price) {
      return {
        currentPrice: parseFloat(item.color.price),
        originalPrice: item.color.original_price ? parseFloat(item.color.original_price) : null
      };
    }

    // 2. Check if product has colors (single product type)
    if (item.product?.colors?.length > 0) {
      return {
        currentPrice: parseFloat(item.product.colors[0].price),
        originalPrice: item.product.colors[0].original_price
          ? parseFloat(item.product.colors[0].original_price)
          : null
      };
    }

    // 3. Check if product has models with colors (variable product type)
    if (item.product?.models?.length > 0 && item.product.models[0].colors?.length > 0) {
      return {
        currentPrice: parseFloat(item.product.models[0].colors[0].price),
        originalPrice: item.product.models[0].colors[0].original_price
          ? parseFloat(item.product.models[0].colors[0].original_price)
          : null
      };
    }

    // 4. Fallback to product price if exists
    return {
      currentPrice: item.product?.price ? parseFloat(item.product.price) : 0,
      originalPrice: item.product?.original_price ? parseFloat(item.product.original_price) : null
    };
  };

  const handleRemoveItem = async (item) => {
    try {
      const token = getToken();
      await axios.post(
        `${import.meta.env.VITE_SERVER_API}/wishlist/deleteitem`,
        { product_id: item.product.product_id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toggleWishlistItem({
        product_id: item.product.product_id,
        name: item.product.name,
        price: item.product.price,
        image: item.product.image_url,
        category: item.product.category
      });
    } catch (error) {
      console.error('Error removing item:', error);
    }
  };

  const handleViewProduct = async (item) => {
    try {
        // Fetch full product details first
        const response = await axios.get(
            `${import.meta.env.VITE_SERVER_API}/product/${item.product.product_id}`
        );
        
        const fullProduct = response.data;
        
        navigate(`/product/${item.product.product_id}`, {
            state: {
                product: fullProduct,
                selectedModel: item.model || null,
                selectedColor: item.color || null
            }
        });
    } catch (error) {
        console.error('Error fetching product details:', error);
        // Fallback to existing data if API call fails
        navigate(`/product/${item.product.product_id}`, {
            state: {
                product: item.product,
                selectedModel: item.model || null,
                selectedColor: item.color || null
            }
        });
    }
};

  if (loading) return (
    <div className="loading-state">
      <div className="spinner"></div>
      <p>Loading wishlist items...</p>
    </div>
  );

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
        <h1>Your Wishlist</h1>
        <p className="item-count">{wishlistProducts.length} {wishlistProducts.length === 1 ? 'item' : 'items'}</p>
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

              return (
                <div key={item.item_id} className="wishlist-item">
                  <div className="product-image">
                    <img
                      src={`${import.meta.env.VITE_SERVER_API}/static/${imageUrl}`}
                      alt={item.product.name}
                      loading="lazy"
                      onError={(e) => {
                        console.error("Image failed to load for:", imageUrl);
                        e.target.src = '/fallback-image.jpg';
                      }}
                    />
                    <button
                      className="remove-btn"
                      onClick={() => handleRemoveItem(item)}
                    >
                      <FiTrash2 size={18} />
                    </button>
                  </div>

                  <div className="product-details">
                    <h3 className="product-name">{item.product.name}</h3>
                    <p className="product-category">{item.product.category}</p>
                    <div className="product-pricing">
                      <span className="current-price">
                        ${currentPrice.toFixed(2)}
                      </span>
                      {originalPrice && originalPrice > currentPrice && (
                        <span className="original-price">
                          ${originalPrice.toFixed(2)}
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