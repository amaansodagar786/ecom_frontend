import React, { useEffect, useState } from 'react';
import { useAuth } from '../../Components/Context/AuthContext';
import { FiHeart, FiTrash2, FiShoppingCart, FiChevronRight } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import "./Wishlist.scss";

const Wishlist = () => {
  const { wishlistItems, toggleWishlistItem } = useAuth();
  const [wishlistProducts, setWishlistProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Helper function to get product price info
  const getProductPriceInfo = (product) => {
    if (product.product_type === 'single') {
      if (product.colors?.length > 0) {
        const prices = product.colors.map(c => parseFloat(c.price));
        const originalPrices = product.colors
          .map(c => c.original_price ? parseFloat(c.original_price) : null)
          .filter(p => p !== null);
        
        return {
          price: Math.min(...prices),
          deleted_price: originalPrices.length > 0 ? Math.max(...originalPrices) : null
        };
      }
      return {
        price: product.price || 0,
        deleted_price: product.deleted_price || null
      };
    } else {
      // For variable products
      if (product.models?.length > 0) {
        const allPrices = product.models.flatMap(m => 
          m.colors?.map(c => parseFloat(c.price)) || []
        );
        const allOriginalPrices = product.models.flatMap(m => 
          m.colors?.map(c => c.original_price ? parseFloat(c.original_price) : null).filter(p => p !== null) || []
        );
        
        return {
          price: allPrices.length > 0 ? Math.min(...allPrices) : 0,
          deleted_price: allOriginalPrices.length > 0 ? Math.max(...allOriginalPrices) : null
        };
      }
      return {
        price: 0,
        deleted_price: null
      };
    }
  };

  // Fetch product details for all wishlist items
  useEffect(() => {
    const fetchWishlistProducts = async () => {
      try {
        const products = await Promise.all(
          wishlistItems.map(item => 
            axios.get(`${import.meta.env.VITE_SERVER_API}/product/${item.product_id}`)
              .then(res => {
                const product = res.data;
                const { price, deleted_price } = getProductPriceInfo(product);
                return {
                  ...product,
                  displayPrice: price,
                  displayDeletedPrice: deleted_price
                };
              })
              .catch(err => {
                console.error(`Error fetching product ${item.product_id}:`, err);
                return null;
              })
          )
        );
        setWishlistProducts(products.filter(Boolean));
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    if (wishlistItems.length > 0) {
      fetchWishlistProducts();
    } else {
      setWishlistProducts([]);
      setLoading(false);
    }
  }, [wishlistItems]);

  const handleAddAllToCart = () => {
    console.log("Adding all items to cart");
  };

  const handleViewProduct = (product) => {
    navigate(`/product/${product.product_id}`, { state: { product } });
  };

  if (loading) return (
    <div className="loading-state">
      <div className="spinner"></div>
      <p>Loading wishlist items...</p>
    </div>
  );

  if (error) return (
    <div className="error-state">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
            {wishlistProducts.map(product => (
              <div key={product.product_id} className="wishlist-item">
                <div className="product-image">
                  {product.images?.[0]?.image_url && (
                    <img
                      src={`${import.meta.env.VITE_SERVER_API}/static${product.images[0].image_url}`}
                      alt={product.name}
                      loading="lazy"
                      onError={(e) => {
                        e.target.src = '/fallback-image.jpg';
                      }}
                    />
                  )}
                  <button
                    className="remove-btn"
                    onClick={() => toggleWishlistItem({
                      product_id: product.product_id,
                      name: product.name,
                      price: product.displayPrice,
                      image: product.images?.[0]?.image_url,
                      category: product.category
                    })}
                  >
                    <FiTrash2 size={18} />
                  </button>
                </div>

                <div className="product-details">
                  <h3 className="product-name">{product.name}</h3>
                  <p className="product-category">{product.category}</p>
                  <div className="product-pricing">
                    <span className="current-price">${product.displayPrice?.toFixed(2)}</span>
                    {product.displayDeletedPrice && (
                      <span className="original-price">${product.displayDeletedPrice?.toFixed(2)}</span>
                    )}
                  </div>
                  <button
                    onClick={() => handleViewProduct(product)}
                    className="view-product-btn"
                  >
                    View Product
                    <FiChevronRight size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="wishlist-sidebar">
            <div className="sidebar-card">
              <h3>Wishlist Summary</h3>
              <div className="summary-item">
                <span>Items</span>
                <span>{wishlistProducts.length}</span>
              </div>
              <button
                className="add-all-to-cart"
                onClick={handleAddAllToCart}
              >
                <FiShoppingCart size={18} />
                Add All to Cart
              </button>
              <p className="hint-text">
                Items remain in your wishlist until you remove them or add to cart
              </p>
            </div>
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