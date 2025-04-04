import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './AllProducts.scss';
import { useAuth } from '../../Components/Context/AuthContext';
import { useNavigate } from 'react-router-dom';

const AllProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [wishlistItems, setWishlistItems] = useState([]);
  const { toggleWishlistItem } = useAuth();
  const navigate = useNavigate();
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const [filters, setFilters] = useState({
    priceRange: [0, 2000],
    colors: [],
    categories: [],
    sortBy: 'featured',
    searchQuery: '',
  });

  const [dropdownOpen, setDropdownOpen] = useState({
    categories: false,
    colors: false,
    price: false
  });

  // Helper function to get product info
  const getProductInfo = (product) => {
    if (!product) return { price: 0, deleted_price: null, inStock: false, mainImage: null, availableColors: [] };

    let price = 0;
    let deleted_price = null;
    let inStock = false;
    let mainImage = product.images?.[0]?.image_url;
    let availableColors = [];

    if (product.product_type === 'single') {
      if (product.colors?.length > 0) {
        const prices = product.colors.map(c => parseFloat(c.price));
        const originalPrices = product.colors
          .map(c => c.original_price ? parseFloat(c.original_price) : null)
          .filter(p => p !== null);
        
        price = Math.min(...prices);
        if (originalPrices.length > 0) {
          deleted_price = Math.max(...originalPrices);
        }
        inStock = product.colors.some(c => c.stock_quantity > 0);
        availableColors = product.colors.map(c => c.name);
        
        if (!mainImage) {
          const firstColorWithImage = product.colors.find(c => c.images?.length > 0);
          mainImage = firstColorWithImage?.images?.[0]?.image_url;
        }
      }
    } else {
      if (product.models?.length > 0) {
        const allPrices = product.models.flatMap(m => 
          m.colors?.map(c => parseFloat(c.price)) || []);
        const allOriginalPrices = product.models.flatMap(m => 
          m.colors?.map(c => c.original_price ? parseFloat(c.original_price) : null).filter(p => p !== null)) || [];
        
        if (allPrices.length > 0) {
          price = Math.min(...allPrices);
        }
        if (allOriginalPrices.length > 0) {
          deleted_price = Math.max(...allOriginalPrices);
        }
        inStock = product.models.some(m => 
          m.colors?.some(c => c.stock_quantity > 0)
        );
        availableColors = product.models.flatMap(m => 
          m.colors?.map(c => c.name) || []
        );
        
        if (!mainImage) {
          const firstModelWithImage = product.models.find(m => 
            m.colors?.some(c => c.images?.length > 0)
          );
          if (firstModelWithImage) {
            const firstColorWithImage = firstModelWithImage.colors.find(c => c.images?.length > 0);
            mainImage = firstColorWithImage?.images?.[0]?.image_url;
          }
        }
      }
    }

    return {
      price,
      deleted_price,
      inStock,
      mainImage: mainImage ? `${import.meta.env.VITE_SERVER_API}/static/${mainImage}` : null,
      availableColors
    };
  };

  const handleWishlistClick = (product) => {
    const { price, deleted_price, mainImage } = getProductInfo(product);
    
    toggleWishlistItem({
      product_id: product.product_id,
      name: product.name,
      price: price,
      image: mainImage,
      category: product.category,
      deleted_price: deleted_price
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
  const categoryOptions = [...new Set(products.map(product => product.category))].filter(Boolean).map(category => ({
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
      const { price, availableColors } = getProductInfo(product);
      const matchesSearch = product.name?.toLowerCase().includes(filters.searchQuery.toLowerCase()) || 
                          product.description?.toLowerCase().includes(filters.searchQuery.toLowerCase());
      const priceInRange = price >= filters.priceRange[0] &&
                          price <= filters.priceRange[1];
      const colorMatch = filters.colors.length === 0 ||
                        filters.colors.some(color => 
                          availableColors.some(c => c.toLowerCase().includes(color.toLowerCase()))
                        );
      const categoryMatch = filters.categories.length === 0 ||
                          (product.category && filters.categories.includes(product.category));
      return matchesSearch && priceInRange && colorMatch && categoryMatch;
    })
    .sort((a, b) => {
      const aInfo = getProductInfo(a);
      const bInfo = getProductInfo(b);
      
      switch (filters.sortBy) {
        case 'price-low': return aInfo.price - bInfo.price;
        case 'price-high': return bInfo.price - aInfo.price;
        case 'newest': 
          // Fallback to product_id if created_at is not available
          const aDate = a.created_at ? new Date(a.created_at) : a.product_id;
          const bDate = b.created_at ? new Date(b.created_at) : b.product_id;
          return bDate - aDate;
        case 'rating': return (b.rating || 0) - (a.rating || 0);
        default: return 0; // Featured keeps original order
      }
    });

  const toggleColor = (color) => {
    setFilters({
      ...filters,
      colors: filters.colors.includes(color)
        ? filters.colors.filter(c => c !== color)
        : [...filters.colors, color]
    });
  };

  const toggleCategory = (category) => {
    setFilters({
      ...filters,
      categories: filters.categories.includes(category)
        ? filters.categories.filter(c => c !== category)
        : [...filters.categories, category]
    });
  };

  const resetFilters = () => {
    setFilters({
      priceRange: [0, 2000],
      colors: [],
      categories: [],
      sortBy: 'featured',
      searchQuery: '',
    });
  };

  const toggleDropdown = (dropdown) => {
    setDropdownOpen(prev => ({
      ...prev,
      [dropdown]: !prev[dropdown]
    }));
  };

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
          {/* Desktop Filter Sidebar */}
          <aside className="filter-sidebar">
            <div className="sidebar-header">
              <h3>Filter Products</h3>
            </div>

            {/* Search Filter */}
            <div className="filter-group">
              <h4 className="filter-title">Search</h4>
              <div className="search-filter">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={filters.searchQuery}
                  onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
                  className="search-input"
                />
                {filters.searchQuery && (
                  <button 
                    className="clear-search" 
                    onClick={() => setFilters({ ...filters, searchQuery: '' })}
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
              <div 
                className="filter-title dropdown-header"
                onClick={() => toggleDropdown('price')}
              >
                <h4>Price Range</h4>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points={dropdownOpen.price ? "18 15 12 9 6 15" : "6 9 12 15 18 9"}></polyline>
                </svg>
              </div>
              {dropdownOpen.price && (
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
              )}
            </div>

            {/* Color Filter */}
            <div className="filter-group">
              <div 
                className="filter-title dropdown-header"
                onClick={() => toggleDropdown('colors')}
              >
                <h4>Colors</h4>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points={dropdownOpen.colors ? "18 15 12 9 6 15" : "6 9 12 15 18 9"}></polyline>
                </svg>
              </div>
              {dropdownOpen.colors && (
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
              )}
            </div>

            {/* Category Filter */}
            <div className="filter-group">
              <div 
                className="filter-title dropdown-header"
                onClick={() => toggleDropdown('categories')}
              >
                <h4>Categories</h4>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points={dropdownOpen.categories ? "18 15 12 9 6 15" : "6 9 12 15 18 9"}></polyline>
                </svg>
              </div>
              {dropdownOpen.categories && (
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
              )}
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
                <button 
                  className="mobile-filter-btn"
                  onClick={() => setShowMobileFilters(true)}
                >
                  Filters
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                </button>
                <div className="sort-select-wrapper">
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
            </div>

            {/* Product Grid */}
            <div className="product-grid">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => {
                  const { price, deleted_price, inStock, mainImage } = getProductInfo(product);
                  
                  return (
                    <div className="product-card" key={product.product_id}>
                      <div className="product-badge">
                        {inStock ? 'In Stock' : 'Pre-Order'}
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
                        {mainImage && (
                          <img
                            src={mainImage}
                            alt={product.name}
                            loading="lazy"
                            onError={(e) => {
                              console.error('Failed to load:', e.target.src);
                              e.target.src = '/path-to-fallback-image.jpg';
                            }}
                          />
                        )}
                        <button 
                          className="quick-view"
                          onClick={() => navigate(`/product/${product.product_id}`)}
                        >
                          Quick View
                        </button>
                      </div>
                      <div className="product-details">
                        <span className="product-category">{product.category || 'Uncategorized'}</span>
                        <h3 className="product-name">{product.name}</h3>
                        <p className="product-description">
                          {product.description || 'No description available'}
                        </p>
                        <div className="product-pricing">
                          <span className="current-price">${price.toFixed(2)}</span>
                          {deleted_price && (
                            <span className="original-price">${deleted_price.toFixed(2)}</span>
                          )}
                        </div>
                        <button 
                          className="add-to-cart"
                          onClick={() => navigate(`/product/${product.product_id}`, { state: { product } })}
                        >
                          View Product
                        </button>
                      </div>
                    </div>
                  );
                })
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

      {/* Mobile Filter Modal */}
      {showMobileFilters && (
        <div className="mobile-filter-modal">
          <div className="mobile-filter-header">
            <h3>Filters</h3>
            <button 
              className="close-mobile-filters"
              onClick={() => setShowMobileFilters(false)}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          
          <div className="mobile-filter-content">
            {/* Search Filter */}
            <div className="filter-group">
              <h4 className="filter-title">Search</h4>
              <div className="search-filter">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={filters.searchQuery}
                  onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
                  className="search-input"
                />
                {filters.searchQuery && (
                  <button 
                    className="clear-search" 
                    onClick={() => setFilters({ ...filters, searchQuery: '' })}
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
              <div 
                className="filter-title dropdown-header"
                onClick={() => toggleDropdown('price')}
              >
                <h4>Price Range</h4>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points={dropdownOpen.price ? "18 15 12 9 6 15" : "6 9 12 15 18 9"}></polyline>
                </svg>
              </div>
              {dropdownOpen.price && (
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
              )}
            </div>

            {/* Color Filter */}
            <div className="filter-group">
              <div 
                className="filter-title dropdown-header"
                onClick={() => toggleDropdown('colors')}
              >
                <h4>Colors</h4>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points={dropdownOpen.colors ? "18 15 12 9 6 15" : "6 9 12 15 18 9"}></polyline>
                </svg>
              </div>
              {dropdownOpen.colors && (
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
              )}
            </div>

            {/* Category Filter */}
            <div className="filter-group">
              <div 
                className="filter-title dropdown-header"
                onClick={() => toggleDropdown('categories')}
              >
                <h4>Categories</h4>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points={dropdownOpen.categories ? "18 15 12 9 6 15" : "6 9 12 15 18 9"}></polyline>
                </svg>
              </div>
              {dropdownOpen.categories && (
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
              )}
            </div>
          </div>

          <div className="mobile-filter-footer">
            <button 
              className="reset-filters-btn"
              onClick={resetFilters}
            >
              Reset
            </button>
            <button 
              className="apply-filters-btn"
              onClick={() => setShowMobileFilters(false)}
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

export default AllProducts;