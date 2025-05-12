import React, { useState, useEffect } from 'react';
import { FaBoxOpen, FaEdit, FaPlus, FaMinus, FaSearch, FaFilter } from 'react-icons/fa';
import axios from 'axios';
import AdminLayout from '../AdminPanel/AdminLayout';
import './Inventory.scss';
import Loader from '../../../Components/Loader/Loader';

const Inventory = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(null);
  const [stockValue, setStockValue] = useState(0);
  const [thresholdValue, setThresholdValue] = useState(0);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  useEffect(() => {
    fetchProductStatus();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, searchTerm, statusFilter]);

  const fetchProductStatus = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_SERVER_API}/product/get/productstatus`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      setProducts(response.data);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const filterProducts = () => {
    let result = [...products];

    // Apply search filter
    if (searchTerm) {
      result = result.filter(product =>
        product.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.model_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'ALL') {
      result = result.filter(product => product.status === statusFilter);
    }

    setFilteredProducts(result);
  };

  const handleUpdateStockAndThreshold = async (productId, colorId) => {
    try {
      await axios.put(
        `${import.meta.env.VITE_SERVER_API}/${productId}/colors/${colorId}`,
        {
          stock_quantity: stockValue,
          threshold: thresholdValue
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      fetchProductStatus();
      setEditMode(null);
    } catch (err) {
      setError('Failed to update stock and threshold');
      console.error('Update error:', err);
    }
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      'IN_STOCK': 'badge-success',
      'LOW_STOCK': 'badge-warning',
      'OUT_OF_STOCK': 'badge-danger'
    };
    return <span className={`badge ${statusClasses[status]}`}>{status.replace('_', ' ')}</span>;
  };

  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('ALL');
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;

    // If it's already a full URL (starts with http), use as is
    if (imagePath.startsWith('http')) {
      return imagePath;
    }

    // If it starts with / (like /product_images/...), prepend server URL
    if (imagePath.startsWith('/')) {
      return `${import.meta.env.VITE_SERVER_API}${imagePath}`;
    }

    // Otherwise, assume it's just a filename and use the old format
    return `${import.meta.env.VITE_SERVER_API}/static/${imagePath}`;
  };

  const renderMediaPreview = (mediaUrl) => {
    if (!mediaUrl) return <div className="no-image">No Media</div>;

    const fullUrl = getImageUrl(mediaUrl);

    if (mediaUrl.endsWith('.mp4')) {
      return (
        <video
          className="media-preview"
          src={fullUrl}
          muted
          loop
          playsInline
          autoPlay
        />
      );
    } else {
      return (
        <img
          className="media-preview"
          src={fullUrl}
          alt="Product media"
        />
      );
    }
  };

  if (loading) return <AdminLayout><Loader /></AdminLayout>;
  if (error) return <AdminLayout><div className="error-message">Error: {error}</div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="inventory-container">
        <div className="inventory-header">
          <h1><FaBoxOpen /> Inventory Management</h1>
          <p>Manage product stock levels and status</p>
        </div>

        {/* Filter Bar */}
        <div className="filter-bar">
          <div className="search-box">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <button
            className="mobile-filter-toggle"
            onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)}
          >
            <FaFilter /> Filters
          </button>

          <div className={`filter-options ${isMobileFiltersOpen ? 'mobile-open' : ''}`}>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              <option value="IN_STOCK">In Stock</option>
              <option value="LOW_STOCK">Low Stock</option>
              <option value="OUT_OF_STOCK">Out of Stock</option>
            </select>

            <button
              className="reset-filters"
              onClick={resetFilters}
            >
              Reset Filters
            </button>

            <div className="filter-results">
              Showing {filteredProducts.length} of {products.length} products
            </div>
          </div>
        </div>

        <div className="inventory-content">
          {filteredProducts.length > 0 ? (
            filteredProducts.map((product) => (
              <div key={`${product.product_id}-${product.model_id}`} className="product-card">
                <div className="product-media">
                  {renderMediaPreview(product.images?.[0])}
                </div>

                <div className="product-details">
                  <h3>{product.product_name}</h3>
                  <div className="product-meta">
                    <span>Model: {product.model_name}</span>
                    {/* {product.color_name && <span>Color: {product.color_name}</span>} */}
                  </div>

                  <div className="stock-info">
                    <div className="stock-status">
                      {getStatusBadge(product.status)}
                      <span>Current Stock: {product.stock_quantity}</span>
                      <span>Threshold: {product.threshold}</span>
                    </div>

                    {editMode === `${product.product_id}-${product.color_id}` ? (
                      <div className="stock-edit">
                        <div className="edit-group">
                          <label>Stock:</label>
                          <div className="number-input">
                            <button onClick={() => setStockValue(prev => Math.max(0, prev - 1))}>
                              <FaMinus />
                            </button>
                            <input
                              type="number"
                              value={stockValue}
                              onChange={(e) => setStockValue(Math.max(0, parseInt(e.target.value) || 0))}
                            />
                            <button onClick={() => setStockValue(prev => prev + 1)}>
                              <FaPlus />
                            </button>
                          </div>
                        </div>

                        <div className="edit-group">
                          <label>Threshold:</label>
                          <div className="number-input">
                            <button onClick={() => setThresholdValue(prev => Math.max(0, prev - 1))}>
                              <FaMinus />
                            </button>
                            <input
                              type="number"
                              value={thresholdValue}
                              onChange={(e) => setThresholdValue(Math.max(0, parseInt(e.target.value) || 0))}
                            />
                            <button onClick={() => setThresholdValue(prev => prev + 1)}>
                              <FaPlus />
                            </button>
                          </div>
                        </div>

                        <div className="edit-buttons">
                          <button
                            className="save-btn"
                            onClick={() => handleUpdateStockAndThreshold(product.product_id, product.color_id)}
                          >
                            Save
                          </button>
                          <button
                            className="cancel-btn"
                            onClick={() => setEditMode(null)}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        className="edit-btn"
                        onClick={() => {
                          setEditMode(`${product.product_id}-${product.color_id}`);
                          setStockValue(product.stock_quantity);
                          setThresholdValue(product.threshold);
                        }}
                      >
                        <FaEdit />
                        <span>
                          Update Stock & Threshold
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="no-results">
              <h3>No products found</h3>
              <p>Try adjusting your search or filters</p>
              <button onClick={resetFilters}>Reset all filters</button>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default Inventory;