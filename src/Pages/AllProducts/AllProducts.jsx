import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './AllProducts.scss';
import { useAuth } from '../../Components/Context/AuthContext';

const AllProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [wishlistItems, setWishlistItems] = useState([]);
  const { toggleWishlistItem } = useAuth();
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const [filters, setFilters] = useState({
    priceRange: [0, 2000],
    colors: [],
    categories: [],
    sortBy: 'featured',
    searchQuery: '',
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

  // Get unique categories from products
  const categoryOptions = [...new Set(products.map(product => product.category))].map(category => ({
    value: category,
    label: category
  }));

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
      const categoryMatch = filters.categories.length === 0 ||
                          filters.categories.includes(product.category);
      return matchesSearch && priceInRange && colorMatch && categoryMatch;
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

  // Toggle color selection
  const toggleColor = (color) => {
    setFilters({
      ...filters,
      colors: filters.colors.includes(color)
        ? filters.colors.filter(c => c !== color)
        : [...filters.colors, color]
    });
  };

  // Toggle category selection
  const toggleCategory = (category) => {
    setFilters({
      ...filters,
      categories: filters.categories.includes(category)
        ? filters.categories.filter(c => c !== category)
        : [...filters.categories, category]
    });
  };

  // Reset all filters
  const resetFilters = () => {
    setFilters({
      priceRange: [0, 2000],
      colors: [],
      categories: [],
      sortBy: 'featured',
      searchQuery: '',
    });
  };

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
    <section className="all-products">
      <div className="container">
        <div className="section-header">
          <h1 className="section-title">Our Complete Collection</h1>
          <p className="section-subtitle">Explore our premium selection of luxury products</p>
        </div>

        <div className="content-wrapper">
          {/* Mobile Filter Toggle */}
          <button 
            className="mobile-filter-toggle"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="21" x2="4" y2="14"></line>
              <line x1="4" y1="10" x2="4" y2="3"></line>
              <line x1="12" y1="21" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12" y2="3"></line>
              <line x1="20" y1="21" x2="20" y2="16"></line>
              <line x1="20" y1="12" x2="20" y2="3"></line>
              <line x1="1" y1="14" x2="7" y2="14"></line>
              <line x1="9" y1="8" x2="15" y2="8"></line>
              <line x1="17" y1="16" x2="23" y2="16"></line>
            </svg>
            Filters
          </button>

          {/* Premium Filter Sidebar */}
          <aside className={`filter-sidebar ${isFilterOpen ? 'open' : ''}`}>
            <div className="sidebar-header">
              <h3>Filter Products</h3>
              <button 
                className="close-sidebar"
                onClick={() => setIsFilterOpen(false)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            {/* Search Filter */}
            <div className="filter-group">
              <h4 className="filter-title">Search</h4>
              <div className="search-filter">
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
            </div>

            {/* Price Range Filter */}
            <div className="filter-group">
              <h4 className="filter-title">Price Range</h4>
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
                <div className="price-display">
                  $0 - ${filters.priceRange[1]}
                </div>
              </div>
            </div>

            {/* Color Filter */}
            <div className="filter-group">
              <h4 className="filter-title">Colors</h4>
              <div className="color-options">
                {colorOptions.map(color => (
                  <button
                    key={color.value}
                    className={`color-option ${filters.colors.includes(color.value) ? 'selected' : ''}`}
                    onClick={() => toggleColor(color.value)}
                    style={{ backgroundColor: color.hex }}
                    aria-label={color.name}
                  >
                    {filters.colors.includes(color.value) && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Category Filter */}
            <div className="filter-group">
              <h4 className="filter-title">Categories</h4>
              <div className="category-options">
                {categoryOptions.map(category => (
                  <button
                    key={category.value}
                    className={`category-option ${filters.categories.includes(category.value) ? 'selected' : ''}`}
                    onClick={() => toggleCategory(category.value)}
                  >
                    {category.label}
                    <span className="checkmark">
                      {filters.categories.includes(category.value) && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      )}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Reset Button */}
            <button
              className="reset-filters"
              onClick={resetFilters}
            >
              Reset All Filters
            </button>
          </aside>

          {/* Main Content Area */}
          <main className="main-content">
            {/* Sort Bar */}
            <div className="sort-bar">
              <div className="results-count">
                Showing {filteredProducts.length} of {products.length} products
              </div>
              <div className="sort-options">
                <label>Sort By:</label>
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
                    onClick={resetFilters}
                  >
                    Reset Filters
                  </button>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </section>
  );
};

export default AllProducts;