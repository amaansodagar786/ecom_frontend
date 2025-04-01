import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './HomeProducts.scss';

const HomeProducts = () => {
  // State for products, filters, and loading/error handling
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({
    priceRange: [0, 2000],
    colors: [],
    sortBy: 'featured',
    activeFilterTab: null
  });

  // Fetch products from the API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get('http://localhost:5000/products');
        setProducts(response.data);
        setLoading(false);
      } catch (error) {
        setError(error.message);
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Color Options (you may add more if needed)
  const colorOptions = [
    { name: 'Black', value: 'black', hex: '#000000' },
    { name: 'White', value: 'white', hex: '#FFFFFF' },
    { name: 'Gold', value: 'gold', hex: '#FFD700' },
    { name: 'Silver', value: 'silver', hex: '#C0C0C0' },
    { name: 'Blue', value: 'blue', hex: '#0000FF' },
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
      const priceInRange = product.price >= filters.priceRange[0] &&
        product.price <= filters.priceRange[1];
      const colorMatch = filters.colors.length === 0 ||
        filters.colors.some(color => product.colors?.includes(color));
      return priceInRange && colorMatch;
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
  if (loading) return <p>Loading products...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <section className="home-products">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">Our Premium Collection</h2>
          <p className="section-subtitle">Curated luxury for the discerning customer</p>
        </div>

        {/* Filter Navbar - Added this section */}
        <div className="filters-navbar">
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

          <div className="filter-group">
            <label>Colors</label>
            <div className="color-options">
              {colorOptions.map(color => (
                <button
                  key={color.value}
                  className={`color-swatch ${filters.colors.includes(color.value) ? 'active' : ''}`}
                  style={{ backgroundColor: color.hex }}
                  onClick={() => {
                    const newColors = filters.colors.includes(color.value)
                      ? filters.colors.filter(c => c !== color.value)
                      : [...filters.colors, color.value];
                    setFilters({ ...filters, colors: newColors });
                  }}
                  aria-label={color.name}
                />
              ))}
            </div>
          </div>

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

          <button
            className="reset-filters"
            onClick={() => setFilters({
              priceRange: [0, 2000],
              colors: [],
              sortBy: 'featured'
            })}
          >
            Reset All
          </button>
        </div>

        {/* Product Grid - Existing code remains the same */}
        <div className="product-grid">
          {filteredProducts.length > 0 ? (
            filteredProducts.map((product) => (
              <div className="product-card" key={product.product_id}>
                <div className="product-badge">
                  {product.stockQuantity > 0 ? 'In Stock' : 'Pre-Order'}
                </div>
                <div className="product-image">
                  <img
                    src={`http://localhost:5000${product.images[0]?.image_url}`}
                    alt={product.name}
                    loading="lazy"
                  />
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
                  <button className="add-to-cart">Add to Cart</button>
                </div>
              </div>
            ))
          ) : (
            <p>No products match your filters</p>
          )}
        </div>
      </div>
    </section>
  );
};

export default HomeProducts;