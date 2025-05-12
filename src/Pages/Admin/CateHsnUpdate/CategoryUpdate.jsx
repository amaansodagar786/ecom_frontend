import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast ,ToastContainer  } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AdminLayout from '../AdminPanel/AdminLayout';
import './CategoryUpdate.scss';
import Loader from '../../../Components/Loader/Loader';

const CategoryUpdate = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [hsnCodes, setHsnCodes] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedHsn, setSelectedHsn] = useState(null);
  const [selectedForDelete, setSelectedForDelete] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState('update'); // 'update', 'edit', or 'delete'
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    subcategory: ''
  });
  const [tempCategory, setTempCategory] = useState(null);
  const [tempSubcategory, setTempSubcategory] = useState(null);
  const [tempHsn, setTempHsn] = useState(null);
  const [deleteType, setDeleteType] = useState('category'); // 'category', 'subcategory', or 'hsn'

  // Fetch all necessary data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, categoriesRes, hsnRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_SERVER_API}/products`),
          axios.get(`${import.meta.env.VITE_SERVER_API}/categories`),
          axios.get(`${import.meta.env.VITE_SERVER_API}/hsn`)
        ]);

        setProducts(productsRes.data);
        setFilteredProducts(productsRes.data);
        setCategories(categoriesRes.data);
        setHsnCodes(hsnRes.data);
        setIsLoading(false);
      } catch (err) {
        console.error('Fetch error:', err);
        setError(err.message);
        setIsLoading(false);
        toast.error(`Failed to load data: ${err.message}`);
      }
    };

    fetchData();
  }, []);

  // Apply filters
  useEffect(() => {
    let result = [...products];
    
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      result = result.filter(product => 
        product.name.toLowerCase().includes(searchTerm) ||
        product.description.toLowerCase().includes(searchTerm))
    }
    
    if (filters.category) {
      result = result.filter(product => 
        product.category === filters.category)
    }
    
    if (filters.subcategory) {
      result = result.filter(product => 
        product.subcategory === filters.subcategory)
    }
    
    setFilteredProducts(result);
  }, [filters, products]);

  const renderMediaPreview = (mediaUrl) => {
    if (!mediaUrl) return <div className="no-media">No Media</div>;
    
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

  // Handle category updates
  const handleCategoryUpdate = async (productId, categoryId) => {
    try {
      setIsLoading(true);
      await axios.put(
        `${import.meta.env.VITE_SERVER_API}/product/${productId}/category`,
        { category_id: categoryId },
        { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }
      );
      refreshProductList(productId);
      toast.success('Category updated successfully');
    } catch (err) {
      handleError(err, 'Failed to update category');
      toast.error(`Failed to update category: ${err.response?.data?.error || err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle subcategory updates
  const handleSubcategoryUpdate = async (productId, subcategoryId) => {
    try {
      setIsLoading(true);
      await axios.put(
        `${import.meta.env.VITE_SERVER_API}/product/${productId}/subcategory`,
        { subcategory_id: subcategoryId },
        { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }
      );
      refreshProductList(productId);
      toast.success('Subcategory updated successfully');
    } catch (err) {
      handleError(err, 'Failed to update subcategory');
      toast.error(`Failed to update subcategory: ${err.response?.data?.error || err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle HSN updates for products
  const handleHsnUpdate = async (productId, hsnId) => {
    try {
      setIsLoading(true);
      await axios.put(
        `${import.meta.env.VITE_SERVER_API}/update/${productId}/hsn`,
        { hsn_id: hsnId },
        { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }
      );
      refreshProductList(productId);
      toast.success('HSN code updated successfully');
    } catch (err) {
      handleError(err, 'Failed to update HSN code');
      toast.error(`Failed to update HSN code: ${err.response?.data?.error || err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle HSN edits
  const handleHsnEdit = async (hsnId, updatedData) => {
    try {
      setIsLoading(true);
      await axios.put(
        `${import.meta.env.VITE_SERVER_API}/edit/hsn/${hsnId}`,
        updatedData,
        { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }
      );
      
      // Refresh HSN list
      const res = await axios.get(`${import.meta.env.VITE_SERVER_API}/hsn`);
      setHsnCodes(res.data);
      
      // Reset selection
      setSelectedHsn(null);
      toast.success('HSN code updated successfully');
    } catch (err) {
      handleError(err, 'Failed to update HSN');
      toast.error(`Failed to update HSN: ${err.response?.data?.error || err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle deletion
  const handleDelete = async (id) => {
    try {
      setIsLoading(true);
      setSelectedForDelete(id);
      setError(null);

      let endpoint = '';
      if (deleteType === 'category') {
        endpoint = `delete/category/${id}`;
      } else if (deleteType === 'subcategory') {
        endpoint = `delete/subcategory/${id}`;
      } else if (deleteType === 'hsn') {
        endpoint = `delete/hsn/${id}`;
      }

      const response = await axios.delete(
        `${import.meta.env.VITE_SERVER_API}/${endpoint}`,
        { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }
      );

      // Refresh data
      const [categoriesRes, hsnRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_SERVER_API}/categories`),
        axios.get(`${import.meta.env.VITE_SERVER_API}/hsn`)
      ]);

      setCategories(categoriesRes.data);
      setHsnCodes(hsnRes.data);
      setSelectedForDelete(null);

      toast.success(response.data.message || 'Deleted successfully');
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Failed to delete';
      handleError(err, errorMessage);
      
      if (err.response?.status === 400 && err.response?.data?.error?.includes('associated with products')) {
        toast.error('Cannot delete: This item is associated with existing products');
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsLoading(false);
      setSelectedForDelete(null);
    }
  };

  // Handle combined save
  const handleCombinedSave = async () => {
    try {
      // Validate that if category is changed, subcategory must be selected
      if ((tempCategory || selectedProduct.category) && !tempSubcategory && !selectedProduct.subcategory) {
        toast.error('Please select a subcategory when changing category');
        return;
      }

      setIsLoading(true);
      setError(null);
      
      const updates = [];
      
      if (tempCategory) {
        updates.push(
          axios.put(
            `${import.meta.env.VITE_SERVER_API}/product/${selectedProduct.product_id}/category`,
            { category_id: tempCategory },
            { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }
          )
        );
      }
      
      if (tempSubcategory) {
        updates.push(
          axios.put(
            `${import.meta.env.VITE_SERVER_API}/product/${selectedProduct.product_id}/subcategory`,
            { subcategory_id: tempSubcategory },
            { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }
          )
        );
      }
      
      if (tempHsn) {
        updates.push(
          axios.put(
            `${import.meta.env.VITE_SERVER_API}/update/${selectedProduct.product_id}/hsn`,
            { hsn_id: tempHsn },
            { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }
          )
        );
      }
      
      if (updates.length > 0) {
        await Promise.all(updates);
        refreshProductList(selectedProduct.product_id);
        // Reset temp values
        setTempCategory(null);
        setTempSubcategory(null);
        setTempHsn(null);
        toast.success('Product details updated successfully');
      }
    } catch (err) {
      handleError(err, 'Failed to save changes');
      toast.error(`Failed to save changes: ${err.response?.data?.error || err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper functions
  const refreshProductList = async (updatedProductId) => {
    const res = await axios.get(`${import.meta.env.VITE_SERVER_API}/products`);
    setProducts(res.data);
    setFilteredProducts(res.data);
    
    if (selectedProduct && selectedProduct.product_id === updatedProductId) {
      const updatedProduct = res.data.find(p => p.product_id === updatedProductId);
      setSelectedProduct(updatedProduct);
    }
  };

  const handleError = (err, defaultMsg) => {
    console.error('Error:', err);
    setError(err.response?.data?.error || err.message || defaultMsg);
  };

  const getSubcategories = (categoryId) => {
    if (!categoryId) return [];
    const category = categories.find(c => c.category_id == categoryId);
    return category ? category.subcategories : [];
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({ search: '', category: '', subcategory: '' });
  };

  // Render modes
  const renderUpdateMode = () => (
    <div className="management-container">
      <div className="mode-toggle">
        <button 
          className={mode === 'update' ? 'active' : ''}
          onClick={() => setMode('update')}
        >
          Update 
        </button>
        <button 
          className={mode === 'edit' ? 'active' : ''}
          onClick={() => setMode('edit')}
        >
          Edit HSN 
        </button>
        <button 
          className={mode === 'delete' ? 'active' : ''}
          onClick={() => setMode('delete')}
        >
          Delete 
        </button>
      </div>

      {selectedProduct ? (
        <div className="product-detail-form">
          <button className="btn-back" onClick={() => setSelectedProduct(null)}>
            &larr; Back to Products
          </button>
          
          <h2>Update Codes for: {selectedProduct.name}</h2>
          
          <div className="current-values">
            <p><strong>Current Category:</strong> {selectedProduct.category || 'None'}</p>
            <p><strong>Current Subcategory:</strong> {selectedProduct.subcategory || 'None'}</p>
            <p><strong>Current HSN:</strong> {selectedProduct.hsn || 'None'}</p>
          </div>
          
          <div className="form-section">
            <h3>Update Category</h3>
            <select
              onChange={(e) => {
                setTempCategory(e.target.value);
                setTempSubcategory(null); // Reset subcategory when category changes
              }}
              value={tempCategory || categories.find(c => c.name === selectedProduct.category)?.category_id || ''}
            >
              <option value="">Select a category</option>
              {categories.map(category => (
                <option key={category.category_id} value={category.category_id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-section">
            <h3>Update Subcategory</h3>
            <select
              onChange={(e) => setTempSubcategory(e.target.value)}
              value={tempSubcategory || ''}
              disabled={!tempCategory && !selectedProduct.category}
              required
            >
              <option value="">Select a subcategory</option>
              {getSubcategories(
                tempCategory || 
                categories.find(c => c.name === selectedProduct.category)?.category_id
              ).map(subcategory => (
                <option key={subcategory.subcategory_id} value={subcategory.subcategory_id}>
                  {subcategory.name}
                </option>
              ))}
            </select>
            {(!tempSubcategory && !selectedProduct.subcategory) && (
              <p className="validation-error">Subcategory is required when category is selected</p>
            )}
          </div>
          
          <div className="form-section">
            <h3>Update HSN Code</h3>
            <select
              onChange={(e) => setTempHsn(e.target.value)}
              value={tempHsn || hsnCodes.find(h => h.hsn_code === selectedProduct.hsn)?.hsn_id || ''}
            >
              <option value="">Select HSN Code</option>
              {hsnCodes.map(hsn => (
                <option key={hsn.hsn_id} value={hsn.hsn_id}>
                  {hsn.hsn_code} - {hsn.description}
                </option>
              ))}
            </select>
          </div>

          {(tempCategory || tempSubcategory || tempHsn) && (
            <div className="form-section">
              <button
                className="btn-save"
                onClick={handleCombinedSave}
                disabled={isLoading || (tempCategory && !tempSubcategory)}
              >
                {isLoading ? 'Saving...' : 'Save All Changes'}
              </button>
            </div>
          )}
          
          {error && <div className="error-message">{error}</div>}
        </div>
      ) : (
        <div className="product-list-container">
          <div className="product-filters">
            <div className="filter-group">
              <label>Search Products</label>
              <input
                type="text"
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                placeholder="Search by name or description..."
              />
            </div>
            
            <div className="filter-group">
              <label>Filter by Category</label>
              <select
                name="category"
                value={filters.category}
                onChange={handleFilterChange}
              >
                <option value="">All Categories</option>
                {[...new Set(products.map(p => p.category).filter(Boolean))].map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            
            <div className="filter-group">
              <label>Filter by Subcategory</label>
              <select
                name="subcategory"
                value={filters.subcategory}
                onChange={handleFilterChange}
              >
                <option value="">All Subcategories</option>
                {[...new Set(products.map(p => p.subcategory).filter(Boolean))].map(sub => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>
            
            <button className="clear-filters-btn" onClick={clearFilters}>
              Clear Filters
            </button>
            
            <div className="filter-results-count">
              Showing <strong>{filteredProducts.length}</strong> of <strong>{products.length}</strong> products
            </div>
          </div>
          
          {filteredProducts.length === 0 ? (
            <div className="no-products">
              <h3>No products found</h3>
              <p>Try adjusting your search or filter criteria</p>
              <button className="btn-reset-filters" onClick={clearFilters}>
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="product-grid">
              {filteredProducts.map(product => (
                <div 
                  key={product.product_id} 
                  className="product-card" 
                  onClick={() => setSelectedProduct(product)}
                >
                  <div className="product-media">
                    {product.images?.[0] && renderMediaPreview(product.images[0].image_url)}
                  </div>
                  <div className="product-info">
                    <h3>{product.name}</h3>
                    <p>Cat: {product.category || 'None'}</p>
                    <p>Sub: {product.subcategory || 'None'}</p>
                    <p>HSN: {product.hsn || 'None'}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderEditMode = () => (
    <div className="management-container">
      <div className="mode-toggle">
        <button 
          className={mode === 'update' ? 'active' : ''}
          onClick={() => setMode('update')}
        >
          Update 
        </button>
        <button 
          className={mode === 'edit' ? 'active' : ''}
          onClick={() => setMode('edit')}
        >
          Edit HSN 
        </button>
        <button 
          className={mode === 'delete' ? 'active' : ''}
          onClick={() => setMode('delete')}
        >
          Delete 
        </button>
      </div>

      {selectedHsn ? (
        <div className="hsn-edit-form">
          <button className="btn-back" onClick={() => setSelectedHsn(null)}>
            &larr; Back to HSN List
          </button>
          
          <h2>Edit HSN Code</h2>
          
          <div className="form-group">
            <label>HSN Code</label>
            <input
              type="text"
              value={selectedHsn.hsn_code}
              onChange={(e) => setSelectedHsn({
                ...selectedHsn,
                hsn_code: e.target.value
              })}
            />
          </div>
          
          <div className="form-group">
            <label>Description</label>
            <textarea
              value={selectedHsn.description}
              onChange={(e) => setSelectedHsn({
                ...selectedHsn,
                description: e.target.value
              })}
            />
          </div>
          
          <button
            className="btn-save"
            onClick={() => handleHsnEdit(selectedHsn.hsn_id, {
              hsn_code: selectedHsn.hsn_code,
              description: selectedHsn.description
            })}
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </button>
          
          {error && <div className="error-message">{error}</div>}
        </div>
      ) : (
        <div className="hsn-list-container">
          <h2>HSN Codes</h2>
          
          <table className="hsn-table">
            <thead>
              <tr>
                <th>HSN </th>
                <th>Description</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {hsnCodes.map(hsn => (
                <tr key={hsn.hsn_id}>
                  <td>{hsn.hsn_code}</td>
                  <td>{hsn.description}</td>
                  <td>
                    <button 
                      className="btn-edit"
                      onClick={() => setSelectedHsn(hsn)}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderDeleteMode = () => (
    <div className="management-container">
      <div className="mode-toggle">
        <button 
          className={mode === 'update' ? 'active' : ''}
          onClick={() => setMode('update')}
        >
          Update 
        </button>
        <button 
          className={mode === 'edit' ? 'active' : ''}
          onClick={() => setMode('edit')}
        >
          Edit HSN 
        </button>
        <button 
          className={mode === 'delete' ? 'active' : ''}
          onClick={() => setMode('delete')}
        >
          Delete 
        </button>
      </div>

      <div className="delete-selection">
        <div className="delete-type-selector">
          <button
            className={deleteType === 'category' ? 'active' : ''}
            onClick={() => setDeleteType('category')}
          >
            Categories
          </button>
          <button
            className={deleteType === 'subcategory' ? 'active' : ''}
            onClick={() => setDeleteType('subcategory')}
          >
            Subcategories
          </button>
          <button
            className={deleteType === 'hsn' ? 'active' : ''}
            onClick={() => setDeleteType('hsn')}
          >
            HSN 
          </button>
        </div>

        {deleteType === 'category' && (
          <div className="delete-list-container">
            <h2>Categories</h2>
            <table className="delete-table">
              <thead>
                <tr>
                  <th>Category </th>
                  <th>Subcategories</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {categories.map(category => (
                  <tr key={category.category_id}>
                    <td>{category.name}</td>
                    <td>{category.subcategories?.length || 0}</td>
                    <td>
                      <button 
                        className="btn-delete"
                        onClick={() => handleDelete(category.category_id)}
                        disabled={isLoading && selectedForDelete === category.category_id}
                      >
                        {isLoading && selectedForDelete === category.category_id ? 'Deleting...' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {deleteType === 'subcategory' && (
          <div className="delete-list-container">
            <h2>Subcategories</h2>
            <table className="delete-table">
              <thead>
                <tr>
                  <th>Subcategory </th>
                  <th> Category</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {categories.flatMap(category => 
                  category.subcategories?.map(subcategory => (
                    <tr key={subcategory.subcategory_id}>
                      <td>{subcategory.name}</td>
                      <td>{category.name}</td>
                      <td>
                        <button 
                          className="btn-delete"
                          onClick={() => handleDelete(subcategory.subcategory_id)}
                          disabled={isLoading && selectedForDelete === subcategory.subcategory_id}
                        >
                          {isLoading && selectedForDelete === subcategory.subcategory_id ? 'Deleting...' : 'Delete'}
                        </button>
                      </td>
                    </tr>
                  )) || []
                )}
              </tbody>
            </table>
          </div>
        )}

        {deleteType === 'hsn' && (
          <div className="delete-list-container">
            <h2>HSN Codes</h2>
            <table className="delete-table">
              <thead>
                <tr>
                  <th>HSN Code</th>
                  <th>Description</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {hsnCodes.map(hsn => (
                  <tr key={hsn.hsn_id}>
                    <td>{hsn.hsn_code}</td>
                    <td>{hsn.description}</td>
                    <td>
                      <button 
                        className="btn-delete"
                        onClick={() => handleDelete(hsn.hsn_id)}
                        disabled={isLoading && selectedForDelete === hsn.hsn_id}
                      >
                        {isLoading && selectedForDelete === hsn.hsn_id ? 'Deleting...' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <AdminLayout>
      
      <ToastContainer
        position="top-center"
        autoClose={2500}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      <div className="hsn-management-container">
        {isLoading && !selectedForDelete && (
          // <div className="loading-overlay">
          //   <div className="loading-spinner"></div>
          //   <p>Loading...</p>
          // </div>
          <Loader/>
        )}
        
        {mode === 'update' ? (
          renderUpdateMode()
        ) : mode === 'edit' ? (
          renderEditMode()
        ) : (
          renderDeleteMode()
        )}
      </div>
    </AdminLayout>
  );
};

export default CategoryUpdate;