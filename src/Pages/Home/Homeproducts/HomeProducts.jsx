import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './HomeProducts.scss';
import { useAuth } from '../../../Components/Context/AuthContext';
import { useNavigate } from 'react-router-dom';

const HomeProducts = () => {
  const [products, setProducts] = useState([]);
  const [displayedProducts, setDisplayedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [wishlistItems, setWishlistItems] = useState([]);
  const { toggleWishlistItem } = useAuth();
  const navigate = useNavigate();

  const handleWishlistClick = (product) => {
    toggleWishlistItem({
      product_id: product.product_id,
      name: product.name,
      price: product.price,
      image: product.images?.[0]?.image_url,
      category: product.category,
      deleted_price: product.deleted_price
    });
  
    setWishlistItems((prevWishlist) =>
      prevWishlist.includes(product.product_id)
        ? prevWishlist.filter((id) => id !== product.product_id)
        : [...prevWishlist, product.product_id]
    );
  };

  // Fetch products from the API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_SERVER_API}/products`);
        setProducts(response.data);
        setLoading(false);
      } catch (error) {
        setError(error.message);
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Select 12 random products when products are loaded
  useEffect(() => {
    if (products.length > 0) {
      const shuffled = [...products].sort(() => 0.5 - Math.random());
      setDisplayedProducts(shuffled.slice(0, 12));
    }
  }, [products]);

  // Error & Loading States
  if (loading) return (
    <div className="loading-state">
      <div className="spinner"></div>
      <p>Loading premium products...</p>
    </div>
  );
  
  if (error) return (
    <div className="error-state">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
      <p>Error loading products: {error}</p>
    </div>
  );

  return (
    <section className="home-products">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">Our Premium Collection</h2>
          <p className="section-subtitle">Curated luxury for the discerning customer</p>
        </div>

        {/* Product Grid */}
        <div className="product-grid">
          {displayedProducts.length > 0 ? (
            displayedProducts.map((product) => (
              <div className="product-card" key={product.product_id}>
                <div className="product-badge">
                  {product.unit > 0 ? 'In Stock' : 'Pre-Order'}
                </div>
                <div className="wishlist-icon" onClick={() => handleWishlistClick(product)}>
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill={wishlistItems.includes(product.product_id) ? "#ff4757" : "none"}
                    stroke={wishlistItems.includes(product.product_id) ? "#ff4757" : "#111"}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                  </svg>
                </div>
                <div className="product-image">
                  {product.images?.length > 0 && (
                    <img
                      src={`${import.meta.env.VITE_SERVER_API}/static/${product.images[0].image_url}`}
                      alt={product.name}
                      loading="lazy"
                      onError={(e) => {
                        console.error('Failed to load:', e.target.src);
                        // e.target.src = '/path-to-fallback-image.jpg';
                      }}
                    />
                  )}
                  <button className="quick-view">Quick View</button>
                </div>
                <div className="product-details">
                  <span className="product-category">{product.category}</span>
                  <h3 className="product-name">{product.name}</h3>
                  <p className="product-description">{product.description}</p>
                  <div className="product-pricing">
                    <span className="current-price">${product.price?.toFixed(2)}</span>
                    {product.deleted_price && (
                      <span className="original-price">${product.deleted_price?.toFixed(2)}</span>
                    )}
                  </div>
                  <button className="add-to-cart">View Product</button>
                </div>
              </div>
            ))
          ) : (
            <div className="no-products">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <h3>No products available</h3>
            </div>
          )}
        </div>

        {/* View More Button */}
        {products.length > 0 && (
          <div className="view-more-container">
            <button 
              className="view-more-btn"
              onClick={() => navigate('/allproducts')}
            >
              View All Products
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7"></path>
              </svg>
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default HomeProducts;