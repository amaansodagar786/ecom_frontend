import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FiArrowLeft, FiSearch, FiFilter, FiChevronDown } from 'react-icons/fi';
import './MainProducts.scss';

const MainProducts = () => {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortOption, setSortOption] = useState('default');
  const [colorFilter, setColorFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [availableColors, setAvailableColors] = useState([]);
  

  useEffect(() => {
    if (!categoryId) {
      console.error("No category ID provided");
      setError("No category selected");
      setLoading(false);
      return;
    }

    const fetchProducts = async () => {
      console.log('Fetching products for category:', categoryId);
      setLoading(true);
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_SERVER_API}/products/by-category/${categoryId}`
        );

        console.log("API Response:", response.data);

        const data = Array.isArray(response.data) ? response.data : [];
        setProducts(data);

        // Extract available colors
        const colors = new Set();
        data.forEach(product => {
          if (product.colors && product.colors.length > 0) {
            product.colors.forEach(color => {
              if (color.name) colors.add(color.name);
            });
          }
        });
        setAvailableColors(['all', ...Array.from(colors)]);

        setError(null);
      } catch (error) {
        console.error('Error fetching products:', error);
        setError('Failed to load products. Please try again later.');
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [categoryId]);

  const getImageUrl = (imageData) => {
    if (!imageData) return null;

    if (typeof imageData === 'string') {
      return `${import.meta.env.VITE_SERVER_API}/static/${imageData}`;
    }

    if (typeof imageData === 'object' && imageData.image_url) {
      return `${import.meta.env.VITE_SERVER_API}/static/${imageData.image_url}`;
    }

    if (typeof imageData === 'object' && imageData.url) {
      return `${import.meta.env.VITE_SERVER_API}/static/${imageData.url}`;
    }

    if (typeof imageData === 'object') {
      const possibleUrl = Object.values(imageData).find(val => typeof val === 'string');
      return possibleUrl ? `${import.meta.env.VITE_SERVER_API}/static/${possibleUrl}` : null;
    }

    return null;
  };

  const handleProductClick = (product, e) => {
    console.log('Product clicked:', product.product_id);
    if (e) e.stopPropagation();
  
    const productSlug = product.name.toLowerCase().replace(/\s+/g, '-');
    const productId = product.product_id;
  
    navigate(`/products/${productId}/${productSlug}`, {
      state: { product },
    });
  };
  const filteredProducts = Array.isArray(products)
    ? products
      .filter((product) =>
        product.name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .filter((product) => {
        if (colorFilter === 'all') return true;
        return product.colors?.some(color => color.name === colorFilter);
      })
      .sort((a, b) => {
        switch (sortOption) {
          case 'price-asc':
            return (a.colors?.[0]?.price || 0) - (b.colors?.[0]?.price || 0);
          case 'price-desc':
            return (b.colors?.[0]?.price || 0) - (a.colors?.[0]?.price || 0);
          case 'name-asc':
            return (a.name || '').localeCompare(b.name || '');
          case 'name-desc':
            return (b.name || '').localeCompare(a.name || '');
          default:
            return 0;
        }
      })
    : [];

  if (loading) {
    return (
      <div className="home-products">
        <div className="top-bar">
          <button className="back-button" onClick={() => navigate(-1)}>
            <FiArrowLeft /> Back
          </button>
        </div>
        <div className="loading-spinner">Loading products...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="home-products">
        <div className="top-bar">
          <button className="back-button" onClick={() => navigate(-1)}>
            <FiArrowLeft /> Back
          </button>
        </div>
        <div className="error-message">{error}</div>
      </div>
    );
  }

  return (
    <div className="home-products">
      <div className="top-bar">
        <button className="back-button" onClick={() => navigate(-1)}>
          <FiArrowLeft /> Back
        </button>
        <div className="search-container">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search products..."
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button
          className="filter-toggle"
          onClick={() => setShowFilters(!showFilters)}
        >
          <FiFilter /> Filters <FiChevronDown className={`chevron ${showFilters ? 'open' : ''}`} />
        </button>
      </div>

      {showFilters && (
        <div className="filters-panel">
          <div className="filter-group">
            <label>Sort by:</label>
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="filter-select"
            >
              <option value="default">Default</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="name-asc">Name: A to Z</option>
              <option value="name-desc">Name: Z to A</option>
            </select>
          </div>

          {/* <div className="filter-group">
            <label>Color:</label>
            <select
              value={colorFilter}
              onChange={(e) => setColorFilter(e.target.value)}
              className="filter-select"
            >
              {availableColors.map(color => (
                <option key={color} value={color}>
                  {color.charAt(0).toUpperCase() + color.slice(1)}
                </option>
              ))}
            </select>
          </div> */}
        </div>
      )}

      <h2 className="section-title">Products</h2>
      <div className="product-grid">
        {filteredProducts.length > 0 ? (
          filteredProducts.map((product) => {
            const firstImage = product.images?.[0];
            const imageUrl = getImageUrl(firstImage);
            const isVideo = imageUrl && /\.(mp4)$/i.test(imageUrl);

            return (
              <div
                className="product-card"
                key={product.product_id}
                onClick={(e) => handleProductClick(product, e)}
              >
                {imageUrl ? (
                  isVideo ? (
                    <video
                      className="product-image"
                      src={imageUrl}
                      autoPlay
                      muted
                      loop
                      playsInline
                      preload="metadata"
                    />
                  ) : (
                    <img
                      src={imageUrl}
                      alt={product.name}
                      className="product-image"
                      loading="lazy"
                    />
                  )
                ) : (
                  <div className="no-image">No Image Available</div>
                )}
                <div className="product-details">
                  <h3>{product.name || 'Unnamed Product'}</h3>
                  <p className="price">
                    {product.colors?.length > 0
                      ? `₹${product.colors[0].price}`
                      : 'Price unavailable'}
                  </p>
                  <button
                    className="view-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleProductClick(product);
                    }}
                  >
                    View Product
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <p className="no-products">
            {searchTerm ? 'No matching products found' : 'No products available in this category'}
          </p>
        )}
      </div>
    </div>
  );
};

export default MainProducts;