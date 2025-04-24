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
  const [isWishlisting, setIsWishlisting] = useState(false); // Add this state

  const {
    wishlistItems,
    toggleWishlistItem,
    isAuthenticated,
    getToken
  } = useAuth();
  const navigate = useNavigate();

  const handleProductClick = (product, e) => {
    if (e) e.stopPropagation();

    const productSlug = product.name.toLowerCase().replace(/\s+/g, '-');
    const productId = product.product_id;

    navigate(`/products/${productId}/${productSlug}`, {
      state: { product },
    });
  };

  const getProductInfo = (product) => {
    let price = 0;
    let deleted_price = null;
    let inStock = false;

    // ONLY USE PRODUCT-LEVEL IMAGES (color_id = NULL)
    let mainImage = product.images?.[0]?.image_url; // This already comes from product.images (not color-specific)


    // Get the first product-level image (color_id = null)
    // let mainImage = product.images?.[0]?.image_url;

    // Handle image URL construction
    if (mainImage) {
      // If it's already a full URL (starts with http), use as is
      if (mainImage.startsWith('http')) {
        // Do nothing, use as is
      }
      // If it starts with / (like /product_images/...), prepend server URL
      else if (mainImage.startsWith('/')) {
        mainImage = `${import.meta.env.VITE_SERVER_API}${mainImage}`;
      }
      // Otherwise, assume it's just a filename and use the old format
      else {
        mainImage = `${import.meta.env.VITE_SERVER_API}/static/${mainImage}`;
      }
    }



    let mediaType = 'image'; // default
    if (mainImage && /\.(mp4)$/i.test(mainImage)) {
      mediaType = 'video';
    }
    try {
      if (product.product_type === 'single') {
        if (product.colors?.length > 0) {
          const validColors = product.colors.filter(c =>
            c.price !== undefined && c.price !== null
          );

          if (validColors.length > 0) {
            const minPriceEntry = validColors.reduce((min, current) =>
              parseFloat(current.price) < parseFloat(min.price) ? current : min, validColors[0]);

            price = parseFloat(minPriceEntry.price);
            if (minPriceEntry.original_price && parseFloat(minPriceEntry.original_price) > price) {
              deleted_price = parseFloat(minPriceEntry.original_price);
            }

            inStock = validColors.some(c => c.stock_quantity > 0);
          }
        }
      } else {
        if (product.models?.length > 0) {
          const allColors = product.models.flatMap(model =>
            (model.colors || [])
              .filter(color => color.price !== undefined && color.price !== null)
              .map(color => ({
                price: parseFloat(color.price),
                original: color.original_price ? parseFloat(color.original_price) : null,
                stock: color.stock_quantity > 0,
              }))
          );

          if (allColors.length > 0) {
            const minPriceColor = allColors.reduce((min, current) =>
              current.price < min.price ? current : min, allColors[0]);

            price = minPriceColor.price;
            if (minPriceColor.original !== null && minPriceColor.original > price) {
              deleted_price = minPriceColor.original;
            }

            inStock = allColors.some(color => color.stock);
          }
        }
      }
    } catch (error) {
      console.error('Error processing product:', product.product_id, error);
    }

    return {
      price,
      deleted_price,
      inStock,
      mainImage
    };
  };

  const handleWishlistClick = async (product, e) => {
    if (e) e.stopPropagation();
    if (isWishlisting) return;
    setIsWishlisting(true);

    if (!isAuthenticated) {
      navigate('/login');
      setIsWishlisting(false);
      return;
    }

    try {
      const { price, deleted_price, mainImage } = getProductInfo(product);
      const productData = {
        product_id: product.product_id,
        name: product.name,
        price: price,
        image: mainImage,
        category: product.category,
        deleted_price: deleted_price,
        // Explicitly set model/color to null for home page items
        model_id: null,
        color_id: null
      };

      await toggleWishlistItem(productData);
    } catch (error) {
      console.error('Error updating wishlist:', error);
    } finally {
      setIsWishlisting(false);
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
              const isInWishlist = wishlistItems.some(item =>
                item.product_id === product.product_id &&
                item.model_id === null &&
                item.color_id === null
              );

              return (
                <div className="product-card" key={product.product_id}>
                  <div className="product-badge">
                    {inStock ? 'In Stock' : 'Pre-Order'}
                  </div>
                  <div
                    className={`wishlist-icon ${isInWishlist ? 'active' : ''}`}
                    onClick={(e) => handleWishlistClick(product, e)}
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

                  <div className="product-image" onClick={(e) => handleProductClick(product, e)}>
                    {/* {mainImage && (
                      <img
                        src={mainImage}
                        alt={product.name}
                        loading="lazy"
                      />
                    )} */}
                    {mainImage && (
                      mainImage.endsWith('.mp4') ? (
                        <video
                          className="media"
                          src={mainImage}
                          autoPlay
                          muted
                          loop
                          playsInline
                          preload="metadata"
                        />
                      ) : (
                        <img
                          className="media"
                          src={mainImage}
                          alt={product.name}
                          loading="lazy"
                        />
                      )
                    )}
                    <button className="quick-view" onClick={(e) => handleProductClick(product, e)}>
                      Quick View
                    </button>
                  </div>
                  <div className="product-details">
                    <span className="product-category">{product.category || 'Uncategorized'}</span>
                    <h3 className="product-name">{product.name}</h3>
                    <div className="product-pricing">
                      <span className="current-price">₹{price.toFixed(2)}</span>
                      {deleted_price && (
                        <span className="original-price">₹{deleted_price.toFixed(2)}</span>
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