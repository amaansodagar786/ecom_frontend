import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ProductManagement.scss';

const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    product_type: 'single',
    category_id: '',
    subcategory_id: '',
    images: [],
    colors: [],
    models: []
  });
  const [newImages, setNewImages] = useState([]);
  const [activeTab, setActiveTab] = useState('products');

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_SERVER_API}/products`),
          axios.get(`${import.meta.env.VITE_SERVER_API}/categories`)
        ]);
        setProducts(productsRes.data);
        setCategories(categoriesRes.data);
        setIsLoading(false);
      } catch (err) {
        setError(err.message);
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Start editing a product
  const startEditProduct = (product) => {
    setEditingProduct(product.product_id);
    setFormData({
      name: product.name,
      description: product.description,
      product_type: product.product_type,
      category_id: product.category?.category_id || '',
      subcategory_id: product.subcategory?.subcategory_id || '',
      images: product.images || [],
      colors: product.colors || [],
      models: product.models || []
    });
    setNewImages([]);
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      description: '',
      product_type: 'single',
      category_id: '',
      subcategory_id: '',
      images: [],
      colors: [],
      models: []
    });
    setNewImages([]);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const formDataToSend = new FormData();

      // Append basic fields
      formDataToSend.append('name', formData.name);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('product_type', formData.product_type);
      formDataToSend.append('category_id', formData.category_id);
      if (formData.subcategory_id) {
        formDataToSend.append('subcategory_id', formData.subcategory_id);
      }

      // Append new images
      newImages.forEach((file, index) => {
        formDataToSend.append(`product_images`, file);
      });

      // Handle single product colors
      if (formData.product_type === 'single') {
        formData.colors.forEach((color, index) => {
          formDataToSend.append(`color_name_${index}`, color.name);
          formDataToSend.append(`color_price_${index}`, color.price);
          formDataToSend.append(`color_original_price_${index}`, color.original_price || '');
          formDataToSend.append(`color_stock_${index}`, color.stock_quantity);
          formDataToSend.append(`threshold_${index}`, color.threshold);

          // Append color images
          if (color.newImages) {
            color.newImages.forEach((file, imgIndex) => {
              formDataToSend.append(`color_images_${index}`, file);
            });
          }
        });
        formDataToSend.append('colors_count', formData.colors.length);

        // Handle specifications for single product
        if (formData.models.length > 0 && formData.models[0].specifications) {
          formData.models[0].specifications.forEach((spec, index) => {
            formDataToSend.append(`spec_key_${index}`, spec.key);
            formDataToSend.append(`spec_value_${index}`, spec.value);
          });
          formDataToSend.append('specs_count', formData.models[0].specifications.length);
        }
      }

      // Handle variable product models
      if (formData.product_type === 'variable') {
        formData.models.forEach((model, modelIndex) => {
          formDataToSend.append(`model_name_${modelIndex}`, model.name);
          formDataToSend.append(`model_description_${modelIndex}`, model.description);

          // Handle model specifications
          if (model.specifications) {
            model.specifications.forEach((spec, specIndex) => {
              formDataToSend.append(`model_${modelIndex}_spec_key_${specIndex}`, spec.key);
              formDataToSend.append(`model_${modelIndex}_spec_value_${specIndex}`, spec.value);
            });
            formDataToSend.append(`model_specs_count_${modelIndex}`, model.specifications.length);
          }

          // Handle model colors
          if (model.colors) {
            model.colors.forEach((color, colorIndex) => {
              formDataToSend.append(`model_${modelIndex}_color_name_${colorIndex}`, color.name);
              formDataToSend.append(`model_${modelIndex}_color_price_${colorIndex}`, color.price);
              formDataToSend.append(`model_${modelIndex}_color_original_price_${colorIndex}`, color.original_price || '');
              formDataToSend.append(`model_${modelIndex}_color_stock_${colorIndex}`, color.stock_quantity);
              formDataToSend.append(`model_${modelIndex}_threshold_${colorIndex}`, color.threshold);

              // Append color images
              if (color.newImages) {
                color.newImages.forEach((file, imgIndex) => {
                  formDataToSend.append(`model_${modelIndex}_color_images_${colorIndex}`, file);
                });
              }
            });
            formDataToSend.append(`model_colors_count_${modelIndex}`, model.colors.length);
          }
        });
        formDataToSend.append('models_count', formData.models.length);
      }

      let response;
      if (editingProduct) {
        // Update existing product
        response = await axios.put(
          `${import.meta.env.VITE_SERVER_API}/${editingProduct}`,
          formDataToSend,
          { 
            headers: { 
              'Content-Type': 'multipart/form-data',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            } 
          }
        );
      } else {
        // Create new product
        response = await axios.post(
          `${import.meta.env.VITE_SERVER_API}/product/add`,
          formDataToSend,
          { 
            headers: { 
              'Content-Type': 'multipart/form-data',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            } 
          }
        );
      }

      // Refresh product list
      const res = await axios.get(`${import.meta.env.VITE_SERVER_API}/products`);
      setProducts(res.data);
      cancelEdit();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle file uploads for product images
  const handleProductImageChange = (e) => {
    const files = Array.from(e.target.files);
    setNewImages(files);
  };

  // Remove existing product image
  const removeProductImage = async (imageId) => {
    try {
      await axios.delete(
        `${import.meta.env.VITE_SERVER_API}/${editingProduct}/images/${imageId}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      // Update form data to remove the deleted image
      setFormData(prev => ({
        ...prev,
        images: prev.images.filter(img => img.image_id !== imageId)
      }));
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  // Handle file uploads for color images
  const handleColorImageChange = (colorIndex, e) => {
    const files = Array.from(e.target.files);
    setFormData(prev => {
      const updatedColors = [...prev.colors];
      updatedColors[colorIndex] = {
        ...updatedColors[colorIndex],
        newImages: files
      };
      return {
        ...prev,
        colors: updatedColors
      };
    });
  };

  // Remove existing color image
  const removeColorImage = async (colorIndex, imageId) => {
    try {
      await axios.delete(
        `${import.meta.env.VITE_SERVER_API}/${editingProduct}/images/${imageId}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      // Update form data to remove the deleted image
      setFormData(prev => {
        const updatedColors = [...prev.colors];
        updatedColors[colorIndex].images = updatedColors[colorIndex].images.filter(
          img => img.image_id !== imageId
        );
        return {
          ...prev,
          colors: updatedColors
        };
      });
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  // Handle file uploads for model color images
  const handleModelColorImageChange = (modelIndex, colorIndex, e) => {
    const files = Array.from(e.target.files);
    setFormData(prev => {
      const updatedModels = [...prev.models];
      updatedModels[modelIndex].colors[colorIndex] = {
        ...updatedModels[modelIndex].colors[colorIndex],
        newImages: files
      };
      return {
        ...prev,
        models: updatedModels
      };
    });
  };

  // Remove existing model color image
  const removeModelColorImage = async (modelIndex, colorIndex, imageId) => {
    try {
      await axios.delete(
        `${import.meta.env.VITE_SERVER_API}/${editingProduct}/images/${imageId}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      // Update form data to remove the deleted image
      setFormData(prev => {
        const updatedModels = [...prev.models];
        updatedModels[modelIndex].colors[colorIndex].images = 
          updatedModels[modelIndex].colors[colorIndex].images.filter(
            img => img.image_id !== imageId
          );
        return {
          ...prev,
          models: updatedModels
        };
      });
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  // Add a new color variant
  const addColor = () => {
    setFormData(prev => ({
      ...prev,
      colors: [...prev.colors, {
        name: '',
        price: 0,
        original_price: 0,
        stock_quantity: 0,
        threshold: 10,
        images: [],
        newImages: []
      }]
    }));
  };

  // Update color variant
  const updateColor = (index, field, value) => {
    setFormData(prev => {
      const updatedColors = [...prev.colors];
      updatedColors[index] = {
        ...updatedColors[index],
        [field]: field === 'price' || field === 'original_price' || field === 'stock_quantity' || field === 'threshold'
          ? Number(value)
          : value
      };
      return {
        ...prev,
        colors: updatedColors
      };
    });
  };

  // Remove a color variant
  const removeColor = (index) => {
    setFormData(prev => {
      const updatedColors = [...prev.colors];
      updatedColors.splice(index, 1);
      return {
        ...prev,
        colors: updatedColors
      };
    });
  };

  // Add a new model (for variable products)
  const addModel = () => {
    setFormData(prev => ({
      ...prev,
      models: [...prev.models, {
        name: '',
        description: '',
        colors: [],
        specifications: []
      }]
    }));
  };

  // Update model details
  const updateModel = (modelIndex, field, value) => {
    setFormData(prev => {
      const updatedModels = [...prev.models];
      updatedModels[modelIndex] = {
        ...updatedModels[modelIndex],
        [field]: value
      };
      return {
        ...prev,
        models: updatedModels
      };
    });
  };

  // Remove a model
  const removeModel = (modelIndex) => {
    setFormData(prev => {
      const updatedModels = [...prev.models];
      updatedModels.splice(modelIndex, 1);
      return {
        ...prev,
        models: updatedModels
      };
    });
  };

  // Add specification to a model
  const addSpecification = (modelIndex) => {
    setFormData(prev => {
      const updatedModels = [...prev.models];
      updatedModels[modelIndex].specifications = [
        ...(updatedModels[modelIndex].specifications || []),
        { key: '', value: '' }
      ];
      return {
        ...prev,
        models: updatedModels
      };
    });
  };

  // Update specification
  const updateSpecification = (modelIndex, specIndex, field, value) => {
    setFormData(prev => {
      const updatedModels = [...prev.models];
      updatedModels[modelIndex].specifications[specIndex] = {
        ...updatedModels[modelIndex].specifications[specIndex],
        [field]: value
      };
      return {
        ...prev,
        models: updatedModels
      };
    });
  };

  // Remove specification
  const removeSpecification = (modelIndex, specIndex) => {
    setFormData(prev => {
      const updatedModels = [...prev.models];
      updatedModels[modelIndex].specifications.splice(specIndex, 1);
      return {
        ...prev,
        models: updatedModels
      };
    });
  };

  // Add color to a model
  const addModelColor = (modelIndex) => {
    setFormData(prev => {
      const updatedModels = [...prev.models];
      updatedModels[modelIndex].colors = [
        ...(updatedModels[modelIndex].colors || []),
        {
          name: '',
          price: 0,
          original_price: 0,
          stock_quantity: 0,
          threshold: 10,
          images: [],
          newImages: []
        }
      ];
      return {
        ...prev,
        models: updatedModels
      };
    });
  };

  // Update model color
  const updateModelColor = (modelIndex, colorIndex, field, value) => {
    setFormData(prev => {
      const updatedModels = [...prev.models];
      updatedModels[modelIndex].colors[colorIndex] = {
        ...updatedModels[modelIndex].colors[colorIndex],
        [field]: field === 'price' || field === 'original_price' || field === 'stock_quantity' || field === 'threshold'
          ? Number(value)
          : value
      };
      return {
        ...prev,
        models: updatedModels
      };
    });
  };

  // Remove model color
  const removeModelColor = (modelIndex, colorIndex) => {
    setFormData(prev => {
      const updatedModels = [...prev.models];
      updatedModels[modelIndex].colors.splice(colorIndex, 1);
      return {
        ...prev,
        models: updatedModels
      };
    });
  };

  // Delete a product
  const deleteProduct = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      setIsLoading(true);
      try {
        await axios.delete(
          `${import.meta.env.VITE_SERVER_API}/${productId}`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }
        );
        
        // Refresh product list
        const res = await axios.get(`${import.meta.env.VITE_SERVER_API}/products`);
        setProducts(res.data);
        setError(null);
      } catch (err) {
        console.error('Delete error details:', {
          message: err.message,
          response: err.response?.data,
          status: err.response?.status
        });

        setError(
          err.response?.data?.error ||
          err.response?.data?.message ||
          err.message ||
          'Failed to delete product'
        );
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Get subcategories for selected category
  const getSubcategories = () => {
    if (!formData.category_id) return [];
    const category = categories.find(c => c.category_id == formData.category_id);
    return category ? category.subcategories : [];
  };

  // Render product list
  const renderProductList = () => (
    <div className="product-list-container">
      <div className="product-list-header">
        <h2>Product List</h2>
        <button 
          className="btn-add-product"
          onClick={() => startEditProduct({
            product_type: 'single',
            colors: [],
            models: [{
              specifications: []
            }]
          })}
        >
          + Add New Product
        </button>
      </div>

      {isLoading ? (
        <div className="loading">Loading products...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : (
        <div className="product-grid">
          {products.map(product => (
            <div key={product.product_id} className="product-card">
              <div className="product-images">
                {product.images.slice(0, 1).map(img => (
                  <img
                    key={img.image_id}
                    src={`${import.meta.env.VITE_SERVER_API}/static/${img.image_url}`}
                    alt={product.name}
                  />
                ))}
              </div>
              <div className="product-details">
                <h3>{product.name}</h3>
                <p className="product-description">{product.description.substring(0, 50)}...</p>
                <div className="product-meta">
                  <span className="product-type">{product.product_type}</span>
                  <span className="product-category">{product.category || 'No category'}</span>
                </div>
              </div>
              <div className="product-actions">
                <button 
                  className="btn-edit"
                  onClick={() => startEditProduct(product)}
                >
                  Edit
                </button>
                <button 
                  className="btn-delete"
                  onClick={() => deleteProduct(product.product_id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Render product form
  const renderProductForm = () => (
    <div className="product-form-container">
      <h2>{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
      <form onSubmit={handleSubmit} className="product-form">
        <div className="form-group">
          <label>Product Name:</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="Enter product name"
            required
          />
        </div>

        <div className="form-group">
          <label>Description:</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Enter detailed product description"
            required
          />
        </div>

        <div className="form-group">
          <label>Product Type:</label>
          <select
            name="product_type"
            value={formData.product_type}
            onChange={handleInputChange}
          >
            <option value="single">Single Product</option>
            <option value="variable">Variable Product (with models)</option>
          </select>
        </div>

        <div className="form-group">
          <label>Category:</label>
          <select
            name="category_id"
            value={formData.category_id}
            onChange={handleInputChange}
            required
          >
            <option value="">Select a category</option>
            {categories.map(category => (
              <option key={category.category_id} value={category.category_id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Subcategory:</label>
          <select
            name="subcategory_id"
            value={formData.subcategory_id}
            onChange={handleInputChange}
          >
            <option value="">Select a subcategory (optional)</option>
            {getSubcategories().map(subcategory => (
              <option key={subcategory.subcategory_id} value={subcategory.subcategory_id}>
                {subcategory.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Product Images:</label>
          <input
            type="file"
            multiple
            onChange={handleProductImageChange}
            accept="image/*"
            className="file-input"
          />
          <div className="image-preview-container">
            <h4>Existing Images</h4>
            <div className="image-preview">
              {formData.images.map((img, index) => (
                <div key={index} className="image-thumbnail">
                  <img
                    src={`${import.meta.env.VITE_SERVER_API}/static/${img.image_url}`}
                    alt={`Product ${index}`}
                  />
                  <button 
                    type="button" 
                    className="btn-remove-image"
                    onClick={() => removeProductImage(img.image_id)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            
            <h4>New Images to Upload</h4>
            <div className="image-preview">
              {newImages.map((file, index) => (
                <div key={`new-${index}`} className="image-thumbnail">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`New image ${index}`}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Specifications for single product */}
        {formData.product_type === 'single' && formData.models.length > 0 && (
          <div className="form-group">
            <h3>Specifications</h3>
            {formData.models[0].specifications?.map((spec, specIndex) => (
              <div key={specIndex} className="specification-item">
                <input
                  type="text"
                  placeholder="Specification name (e.g., Material)"
                  value={spec.key}
                  onChange={(e) => updateSpecification(0, specIndex, 'key', e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Specification value (e.g., Cotton)"
                  value={spec.value}
                  onChange={(e) => updateSpecification(0, specIndex, 'value', e.target.value)}
                />
                <button 
                  type="button" 
                  className="btn-remove"
                  onClick={() => removeSpecification(0, specIndex)}
                >
                  Remove
                </button>
              </div>
            ))}
            <button 
              type="button" 
              className="btn-add"
              onClick={() => addSpecification(0)}
            >
              + Add Specification
            </button>
          </div>
        )}

        {/* Colors for single product */}
        {formData.product_type === 'single' && (
          <div className="form-group">
            <h3>Colors/Variants</h3>
            {formData.colors.map((color, colorIndex) => (
              <div key={colorIndex} className="color-variant">
                <div className="color-details">
                  <input
                    type="text"
                    placeholder="Color name (e.g., Red)"
                    value={color.name}
                    onChange={(e) => updateColor(colorIndex, 'name', e.target.value)}
                  />
                  <input
                    type="number"
                    placeholder="Price"
                    value={color.price}
                    onChange={(e) => updateColor(colorIndex, 'price', e.target.value)}
                    min="0"
                    step="0.01"
                  />
                  <input
                    type="number"
                    placeholder="Original Price (optional)"
                    value={color.original_price || ''}
                    onChange={(e) => updateColor(colorIndex, 'original_price', e.target.value)}
                    min="0"
                    step="0.01"
                  />
                  <input
                    type="number"
                    placeholder="Stock quantity"
                    value={color.stock_quantity}
                    onChange={(e) => updateColor(colorIndex, 'stock_quantity', e.target.value)}
                    min="0"
                  />
                  <input
                    type="number"
                    placeholder="Low stock threshold"
                    value={color.threshold}
                    onChange={(e) => updateColor(colorIndex, 'threshold', e.target.value)}
                    min="0"
                  />
                </div>

                <div className="color-images">
                  <label>Color Images:</label>
                  <input
                    type="file"
                    multiple
                    onChange={(e) => handleColorImageChange(colorIndex, e)}
                    accept="image/*"
                    className="file-input"
                  />
                  <div className="image-preview-container">
                    <h4>Existing Images</h4>
                    <div className="image-preview">
                      {color.images?.map((img, imgIndex) => (
                        <div key={imgIndex} className="image-thumbnail">
                          <img
                            src={`${import.meta.env.VITE_SERVER_API}/static/${img.image_url}`}
                            alt={`Color ${imgIndex}`}
                          />
                          <button 
                            type="button" 
                            className="btn-remove-image"
                            onClick={() => removeColorImage(colorIndex, img.image_id)}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                    
                    <h4>New Images to Upload</h4>
                    <div className="image-preview">
                      {color.newImages?.map((file, imgIndex) => (
                        <div key={`new-${imgIndex}`} className="image-thumbnail">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={`New color image ${imgIndex}`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <button 
                  type="button" 
                  className="btn-remove"
                  onClick={() => removeColor(colorIndex)}
                >
                  Remove Color Variant
                </button>
              </div>
            ))}
            <button 
              type="button" 
              className="btn-add"
              onClick={addColor}
            >
              + Add Color Variant
            </button>
          </div>
        )}

        {/* Models for variable product */}
        {formData.product_type === 'variable' && (
          <div className="form-group">
            <h3>Models</h3>
            {formData.models.map((model, modelIndex) => (
              <div key={modelIndex} className="product-model">
                <h4>Model {modelIndex + 1}</h4>
                <div className="model-details">
                  <input
                    type="text"
                    placeholder="Model name (e.g., Pro Version)"
                    value={model.name}
                    onChange={(e) => updateModel(modelIndex, 'name', e.target.value)}
                  />
                  <textarea
                    placeholder="Model description"
                    value={model.description}
                    onChange={(e) => updateModel(modelIndex, 'description', e.target.value)}
                  />
                </div>

                <div className="model-specifications">
                  <h5>Specifications</h5>
                  {model.specifications?.map((spec, specIndex) => (
                    <div key={specIndex} className="specification-item">
                      <input
                        type="text"
                        placeholder="Spec name (e.g., Weight)"
                        value={spec.key}
                        onChange={(e) => updateSpecification(modelIndex, specIndex, 'key', e.target.value)}
                      />
                      <input
                        type="text"
                        placeholder="Spec value (e.g., 1.2kg)"
                        value={spec.value}
                        onChange={(e) => updateSpecification(modelIndex, specIndex, 'value', e.target.value)}
                      />
                      <button 
                        type="button" 
                        className="btn-remove"
                        onClick={() => removeSpecification(modelIndex, specIndex)}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button 
                    type="button" 
                    className="btn-add"
                    onClick={() => addSpecification(modelIndex)}
                  >
                    + Add Specification
                  </button>
                </div>

                <div className="model-colors">
                  <h5>Colors/Variants</h5>
                  {model.colors?.map((color, colorIndex) => (
                    <div key={colorIndex} className="color-variant">
                      <div className="color-details">
                        <input
                          type="text"
                          placeholder="Color name"
                          value={color.name}
                          onChange={(e) => updateModelColor(modelIndex, colorIndex, 'name', e.target.value)}
                        />
                        <input
                          type="number"
                          placeholder="Price"
                          value={color.price}
                          onChange={(e) => updateModelColor(modelIndex, colorIndex, 'price', e.target.value)}
                          min="0"
                          step="0.01"
                        />
                        <input
                          type="number"
                          placeholder="Original Price"
                          value={color.original_price || ''}
                          onChange={(e) => updateModelColor(modelIndex, colorIndex, 'original_price', e.target.value)}
                          min="0"
                          step="0.01"
                        />
                        <input
                          type="number"
                          placeholder="Stock quantity"
                          value={color.stock_quantity}
                          onChange={(e) => updateModelColor(modelIndex, colorIndex, 'stock_quantity', e.target.value)}
                          min="0"
                        />
                        <input
                          type="number"
                          placeholder="Low stock threshold"
                          value={color.threshold}
                          onChange={(e) => updateModelColor(modelIndex, colorIndex, 'threshold', e.target.value)}
                          min="0"
                        />
                      </div>

                      <div className="color-images">
                        <label>Color Images:</label>
                        <input
                          type="file"
                          multiple
                          onChange={(e) => handleModelColorImageChange(modelIndex, colorIndex, e)}
                          accept="image/*"
                          className="file-input"
                        />
                        <div className="image-preview-container">
                          <h4>Existing Images</h4>
                          <div className="image-preview">
                            {color.images?.map((img, imgIndex) => (
                              <div key={imgIndex} className="image-thumbnail">
                                <img
                                  src={`${import.meta.env.VITE_SERVER_API}/static/${img.image_url}`}
                                  alt={`Color ${imgIndex}`}
                                />
                                <button 
                                  type="button" 
                                  className="btn-remove-image"
                                  onClick={() => removeModelColorImage(modelIndex, colorIndex, img.image_id)}
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                          
                          <h4>New Images to Upload</h4>
                          <div className="image-preview">
                            {color.newImages?.map((file, imgIndex) => (
                              <div key={`new-${imgIndex}`} className="image-thumbnail">
                                <img
                                  src={URL.createObjectURL(file)}
                                  alt={`New color image ${imgIndex}`}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <button 
                        type="button" 
                        className="btn-remove"
                        onClick={() => removeModelColor(modelIndex, colorIndex)}
                      >
                        Remove Color Variant
                      </button>
                    </div>
                  ))}
                  <button 
                    type="button" 
                    className="btn-add"
                    onClick={() => addModelColor(modelIndex)}
                  >
                    + Add Color Variant
                  </button>
                </div>

                <button 
                  type="button" 
                  className="btn-remove"
                  onClick={() => removeModel(modelIndex)}
                >
                  Remove Model
                </button>
              </div>
            ))}
            <button 
              type="button" 
              className="btn-add"
              onClick={addModel}
            >
              + Add Model
            </button>
          </div>
        )}

        <div className="form-actions">
          <button 
            type="submit" 
            className="btn-save"
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : 'Save Product'}
          </button>
          <button 
            type="button" 
            className="btn-cancel"
            onClick={cancelEdit}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );

  return (
    <div className="product-management">
      <div className="tabs">
        <button
          className={activeTab === 'products' ? 'active' : ''}
          onClick={() => setActiveTab('products')}
        >
          Products
        </button>
        <button
          className={activeTab === 'categories' ? 'active' : ''}
          onClick={() => setActiveTab('categories')}
        >
          Categories
        </button>
      </div>

      {activeTab === 'products' ? (
        editingProduct ? renderProductForm() : renderProductList()
      ) : (
        <div className="category-management">
          <h2>Categories</h2>
          <div className="category-list">
            {categories.map(category => (
              <div key={category.category_id} className="category-card">
                <img
                  src={`${import.meta.env.VITE_SERVER_API}/static/${category.image_url}`}
                  alt={category.name}
                />
                <h3>{category.name}</h3>
                <ul>
                  {category.subcategories.map(subcategory => (
                    <li key={subcategory.subcategory_id}>{subcategory.name}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && <div className="error-message">{error}</div>}
    </div>
  );
};

export default ProductManagement;