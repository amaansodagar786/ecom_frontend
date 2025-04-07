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
  const { 
    wishlistItems, 
    toggleWishlistItem, 
    isAuthenticated,
    getToken
  } = useAuth();
  const navigate = useNavigate();

  const handleProductClick = (product, e) => {
    if (e) e.stopPropagation();
    navigate(`/product/${product.product_id}`, { state: { product } });
  };

  const getProductInfo = (product) => {
    let price = 0;
    let deleted_price = null;
    let inStock = false;
    let mainImage = product.images?.[0]?.image_url;
  
    if (product.product_type === 'single') {
      if (product.colors?.length > 0) {
        // Process colors for single product type
        const colorEntries = product.colors.map(c => ({
          price: parseFloat(c.price),
          original: c.original_price ? parseFloat(c.original_price) : null,
          stock: c.stock_quantity > 0,
          images: c.images
        }));
  
        // Find color with lowest price
        const minPriceEntry = colorEntries.reduce((min, current) => 
          current.price < min.price ? current : min, colorEntries[0]);
  
        price = minPriceEntry.price;
        if (minPriceEntry.original !== null && minPriceEntry.original > price) {
          deleted_price = minPriceEntry.original;
        }
  
        // Check stock availability
        inStock = product.colors.some(c => c.stock_quantity > 0);
  
        // Find main image from the color with lowest price or first available
        if (!mainImage) {
          const firstColorWithImage = minPriceEntry.images?.length > 0 
            ? minPriceEntry 
            : product.colors.find(c => c.images?.length > 0);
          mainImage = firstColorWithImage?.images?.[0]?.image_url;
        }
      }
    } else {
      // Process models for variable product type
      if (product.models?.length > 0) {
        const allColorEntries = product.models.flatMap(m => 
          m.colors?.map(c => ({
            price: parseFloat(c.price),
            original: c.original_price ? parseFloat(c.original_price) : null,
            stock: c.stock_quantity > 0,
            images: c.images
          })) || []
        );
  
        if (allColorEntries.length > 0) {
          // Find color with lowest price across all models
          const minPriceEntry = allColorEntries.reduce((min, current) => 
            current.price < min.price ? current : min, allColorEntries[0]);
  
          price = minPriceEntry.price;
          if (minPriceEntry.original !== null && minPriceEntry.original > price) {
            deleted_price = minPriceEntry.original;
          }
  
          // Check stock availability
          inStock = allColorEntries.some(c => c.stock);
        }
  
        // Find main image from the color with lowest price or first available
        if (!mainImage) {
          const firstColorWithImage = allColorEntries.find(c => c.images?.length > 0);
          mainImage = firstColorWithImage?.images?.[0]?.image_url;
        }
      }
    }
  
    return {
      price,
      deleted_price,
      inStock,
      mainImage: mainImage ? `${import.meta.env.VITE_SERVER_API}/static/${mainImage}` : null
    };
  };

  const handleWishlistClick = async (product, e) => {
    if (e) e.stopPropagation();
    
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const { price, deleted_price, mainImage } = getProductInfo(product);
    
    // Update local state immediately for better UX
    toggleWishlistItem({
      product_id: product.product_id,
      name: product.name,
      price: price,
      image: mainImage,
      category: product.category,
      deleted_price: deleted_price,
    });

    try {
      const token = getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      if (wishlistItems.includes(product.product_id)) {
        await axios.post(
          `${import.meta.env.VITE_SERVER_API}/wishlist/deleteitem`,
          { product_id: product.product_id },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        await axios.post(
          `${import.meta.env.VITE_SERVER_API}/wishlist/additem`,
          { product_id: product.product_id },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
    } catch (error) {
      console.error('Error updating wishlist:', error);
      // Revert local state if API call fails
      toggleWishlistItem({
        product_id: product.product_id,
        name: product.name,
        price: price,
        image: mainImage,
        category: product.category,
        deleted_price: deleted_price,
      });
    }
  };

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

  useEffect(() => {
    if (products.length > 0) {
      const shuffled = [...products].sort(() => 0.5 - Math.random());
      setDisplayedProducts(shuffled.slice(0, 12));
    }
  }, [products]);

  if (loading) return (
    <div className="loading-state">
      <div className="spinner"></div>
      <p>Loading premium products...</p>
    </div>
  );
  
  if (error) return (
    <div className="error-state">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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

        <div className="product-grid">
          {displayedProducts.length > 0 ? (
            displayedProducts.map((product) => {
              const { price, deleted_price, inStock, mainImage } = getProductInfo(product);
              
              return (
                <div className="product-card" key={product.product_id}>
                  <div className="product-badge">
                    {inStock ? 'In Stock' : 'Pre-Order'}
                  </div>
                  <div 
                    className="wishlist-icon" 
                    onClick={(e) => handleWishlistClick(product, e)}
                  >
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill={wishlistItems.includes(product.product_id) ? "#ff4757" : "none"}
                      stroke={wishlistItems.includes(product.product_id) ? "#ff4757" : "#111"}
                      strokeWidth="2"
                    >
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                    </svg>
                  </div>
                  <div className="product-image" onClick={(e) => handleProductClick(product, e)}>
                    {mainImage && (
                      <img
                        src={mainImage}
                        alt={product.name}
                        loading="lazy"
                      />
                    )}
                    <button className="quick-view" onClick={(e) => handleProductClick(product, e)}>
                      Quick View
                    </button>
                  </div>
                  <div className="product-details">
                    <span className="product-category">{product.category || 'Uncategorized'}</span>
                    <h3 className="product-name">{product.name}</h3>
                    <div className="product-pricing">
                      <span className="current-price">${price.toFixed(2)}</span>
                      {deleted_price && (
                        <span className="original-price">${deleted_price.toFixed(2)}</span>
                      )}
                    </div>
                    <button 
                      className="add-to-cart"
                      onClick={(e) => handleProductClick(product, e)} 
                    >
                      View Product
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="no-products">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <h3>No products available</h3>
            </div>
          )}
        </div>

        {products.length > 0 && (
          <div className="view-more-container">
            <button 
              className="view-more-btn"
              onClick={() => navigate('/allproducts')}
            >
              View All Products
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
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