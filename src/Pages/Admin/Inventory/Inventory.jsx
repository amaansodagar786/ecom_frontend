import React, { useState, useEffect } from 'react';
import { FaBoxOpen, FaEdit, FaPlus, FaMinus, FaSearch, FaFilter } from 'react-icons/fa';
import axios from 'axios';
import AdminLayout from '../AdminPanel/AdminLayout';
import './Inventory.scss';

const Inventory = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(null);
  const [stockValue, setStockValue] = useState(0);

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

  const handleUpdateStock = async (productId, colorId) => {
    try {
      await axios.put(`${import.meta.env.VITE_SERVER_API}/${productId}/colors/${colorId}`, {
        stock_quantity: stockValue
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      fetchProductStatus();
      setEditMode(null);
    } catch (err) {
      setError('Failed to update stock');
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

  const renderMediaPreview = (mediaUrl) => {
    if (!mediaUrl) return <div className="no-image">No Media</div>;
    
    const fullUrl = `${import.meta.env.VITE_SERVER_API}/static/${mediaUrl}`;
    
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

  if (loading) return <AdminLayout><div className="loading-spinner"></div></AdminLayout>;
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
                  </div>

                  <div className="stock-info">
                    <div className="stock-status">
                      {getStatusBadge(product.status)}
                      <span>Current Stock: {product.stock_quantity}</span>
                      <span>Threshold: {product.threshold}</span>
                    </div>

                    {editMode === `${product.product_id}-${product.color_id}` ? (
                      <div className="stock-edit">
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
                        <button
                          className="save-btn"
                          onClick={() => handleUpdateStock(product.product_id, product.color_id)}
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
                    ) : (
                      <button
                        className="edit-btn"
                        onClick={() => {
                          setEditMode(`${product.product_id}-${product.color_id}`);
                          setStockValue(product.stock_quantity);
                        }}
                      >
                        <FaEdit /> Update Stock
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