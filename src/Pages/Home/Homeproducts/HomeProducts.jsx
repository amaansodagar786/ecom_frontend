import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './HomeProducts.scss';
import { useAuth } from '../../../Components/Context/AuthContext';

const HomeProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [wishlistItems, setWishlistItems] = useState([]);
  const { toggleWishlistItem } = useAuth();

  const [filters, setFilters] = useState({
    priceRange: [0, 2000],
    colors: [],
    sortBy: 'featured',
    searchQuery: '',
    activeFilterTab: null
  });

  const handleWishlistClick = (product) => {
    toggleWishlistItem({
      product_id: product.product_id,
      name: product.name,
      price: product.price,
      image: product.images?.[0]?.image_url,
      category: product.category
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

  // Color Options
  const colorOptions = [
    { name: 'Black', value: 'black', hex: '#000000' },
    { name: 'White', value: 'white', hex: '#FFFFFF' },
    { name: 'Gold', value: 'gold', hex: '#FFD700' },
    { name: 'Silver', value: 'silver', hex: '#C0C0C0' },
    { name: 'Blue', value: 'blue', hex: '#0000FF' },
    { name: 'Red', value: 'red', hex: '#FF0000' },
    { name: 'Green', value: 'green', hex: '#008000' },
  ];

  // Sort Options
  const sortOptions = [
    { value: 'featured', label: 'Featured' },
    { value: 'newest', label: 'Newest Arrivals' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
    { value: 'rating', label: 'Highest Rated' },
  ];

  // Filtering and Sorting Logic
  const filteredProducts = products
    .filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(filters.searchQuery.toLowerCase()) || 
                          product.description.toLowerCase().includes(filters.searchQuery.toLowerCase());
      const priceInRange = product.price >= filters.priceRange[0] &&
                          product.price <= filters.priceRange[1];
      const colorMatch = filters.colors.length === 0 ||
                        filters.colors.some(color => product.colors?.includes(color));
      return matchesSearch && priceInRange && colorMatch;
    })
    .sort((a, b) => {
      switch (filters.sortBy) {
        case 'price-low': return a.price - b.price;
        case 'price-high': return b.price - a.price;
        case 'newest': return new Date(b.createdAt) - new Date(a.createdAt);
        case 'rating': return (b.rating || 0) - (a.rating || 0);
        default: return 0;
      }
    });

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

        {/* Premium Filter Navbar */}
        <div className="filters-navbar">
          {/* Search Bar */}
          <div className="search-filter">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              placeholder="Search products..."
              value={filters.searchQuery}
              onChange={(e) => setFilters({...filters, searchQuery: e.target.value})}
              className="search-input"
            />
            {filters.searchQuery && (
              <button 
                className="clear-search" 
                onClick={() => setFilters({...filters, searchQuery: ''})}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            )}
          </div>

          {/* Price Range Filter */}
          <div className="filter-group">
            <label>Price Range</label>
            <div className="price-range-container">
              <input
                type="range"
                min="0"
                max="2000"
                step="50"
                value={filters.priceRange[1]}
                onChange={(e) => setFilters({
                  ...filters,
                  priceRange: [0, parseInt(e.target.value)]
                })}
              />
              <span className="price-display">
                $0 - ${filters.priceRange[1]}
              </span>
            </div>
          </div>

          {/* Color Dropdown Filter */}
          <div className="filter-group">
            <label>Colors</label>
            <div className="custom-select">
              <select
                value={filters.colors[0] || ''}
                onChange={(e) => {
                  const color = e.target.value;
                  if (color) {
                    setFilters({
                      ...filters,
                      colors: filters.colors.includes(color) 
                        ? filters.colors.filter(c => c !== color)
                        : [color]
                    });
                  }
                }}
                className="color-select"
              >
                <option value="">Select Color</option>
                {colorOptions.map(color => (
                  <option key={color.value} value={color.value}>
                    {color.name}
                  </option>
                ))}
              </select>
              <div className="selected-colors">
                {filters.colors.map(color => {
                  const colorData = colorOptions.find(c => c.value === color);
                  return colorData ? (
                    <span 
                      key={color} 
                      className="color-chip"
                      style={{ backgroundColor: colorData.hex }}
                      onClick={() => setFilters({
                        ...filters,
                        colors: filters.colors.filter(c => c !== color)
                      })}
                    />
                  ) : null;
                })}
              </div>
            </div>
          </div>

          {/* Sort Dropdown */}
          <div className="filter-group">
            <label>Sort By</label>
            <select
              value={filters.sortBy}
              onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
              className="sort-select"
            >
              {sortOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Reset Button */}
          <button
            className="reset-filters"
            onClick={() => setFilters({
              priceRange: [0, 2000],
              colors: [],
              sortBy: 'featured',
              searchQuery: ''
            })}
          >
            Reset All
          </button>
        </div>

        {/* Product Grid */}
        <div className="product-grid">
          {filteredProducts.length > 0 ? (
            filteredProducts.map((product) => (
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
              <h3>No products match your filters</h3>
              <button 
                className="reset-filters-btn"
                onClick={() => setFilters({
                  priceRange: [0, 2000],
                  colors: [],
                  sortBy: 'featured',
                  searchQuery: ''
                })}
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default HomeProducts;