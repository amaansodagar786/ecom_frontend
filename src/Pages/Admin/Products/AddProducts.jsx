import React, { useState } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { FaPlus, FaTrash, FaUpload } from 'react-icons/fa';
import { toast, ToastContainer } from 'react-toastify';
import axios from 'axios';
import 'react-toastify/dist/ReactToastify.css';
import './AddProducts.scss';

const AddProducts = () => {
  const [imageFiles, setImageFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);

  const initialValues = {
    name: '',
    description: '',
    category: '',
    price: '',
    deleted_price: '',
    unit: 1
  };

  const validationSchema = Yup.object().shape({
    name: Yup.string()
      .required('Product name is required')
      .max(255, 'Product name must be at most 255 characters'),
    description: Yup.string().required('Description is required'),
    category: Yup.string().required('Category is required'),
    price: Yup.number()
      .positive('Price must be a positive number')
      .required('Price is required'),
    deleted_price: Yup.number()
      .positive('Deleted price must be a positive number')
      .min(
        Yup.ref('price'), 
        'Deleted price must be greater than the current price'
      ),
    unit: Yup.number()
      .positive('Unit must be a positive number')
      .integer('Unit must be a whole number')
      .required('Unit is required')
  });

  const handleImageUpload = (event) => {
    const files = Array.from(event.target.files);
    setImageFiles([...imageFiles, ...files]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    setImageFiles([...imageFiles, ...files]);
  };

  const removeImage = (index) => {
    const newImageFiles = imageFiles.filter((_, i) => i !== index);
    setImageFiles(newImageFiles);
  };

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      const formData = new FormData();
      
      Object.keys(values).forEach(key => {
        formData.append(key, values[key]);
      });

      imageFiles.forEach((file) => {
        formData.append('images', file);
      });

      const response = await axios.post('http://localhost:5000/product/add', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      toast.success(response.data.message || 'Product added successfully!');
      resetForm();
      setImageFiles([]);
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to add product. Please try again.';
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-panel">
      <div className="admin-container">
        <div className="admin-header">
          <h1 className="admin-title">Add New Product</h1>
          <p className="admin-subtitle">Fill in the details to add a new product to your store</p>
        </div>

        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting }) => (
            <Form className="product-form">
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Product Name *</label>
                  <Field 
                    type="text" 
                    name="name" 
                    className="form-input"
                    placeholder="Enter product name"
                  />
                  <ErrorMessage name="name" component="div" className="error-message" />
                </div>

                <div className="form-group">
                  <label className="form-label">Description *</label>
                  <Field 
                    as="textarea" 
                    name="description" 
                    className="form-input textarea"
                    placeholder="Enter detailed product description"
                    rows="4"
                  />
                  <ErrorMessage name="description" component="div" className="error-message" />
                </div>

                <div className="form-group">
                  <label className="form-label">Category *</label>
                  <Field 
                    as="select" 
                    name="category" 
                    className="form-input"
                  >
                    <option value="">Select a category</option>
                    <option value="electronics">Electronics</option>
                    <option value="clothing">Clothing</option>
                    <option value="home">Home & Kitchen</option>
                    <option value="beauty">Beauty</option>
                    <option value="other">Other</option>
                  </Field>
                  <ErrorMessage name="category" component="div" className="error-message" />
                </div>

                <div className="form-group">
                  <label className="form-label">Price *</label>
                  <div className="price-input-group">
                    <span className="currency-symbol">$</span>
                    <Field 
                      type="number" 
                      name="price" 
                      className="form-input"
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                    />
                  </div>
                  <ErrorMessage name="price" component="div" className="error-message" />
                </div>

                <div className="form-group">
                  <label className="form-label">Original Price</label>
                  <div className="price-input-group">
                    <span className="currency-symbol">$</span>
                    <Field 
                      type="number" 
                      name="deleted_price" 
                      className="form-input"
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                    />
                  </div>
                  <ErrorMessage name="deleted_price" component="div" className="error-message" />
                </div>

                <div className="form-group">
                  <label className="form-label">Stock Quantity *</label>
                  <Field 
                    type="number" 
                    name="unit" 
                    className="form-input"
                    placeholder="Enter quantity"
                    min="1"
                  />
                  <ErrorMessage name="unit" component="div" className="error-message" />
                </div>
              </div>

              <div className="image-upload-section">
                <label className="form-label">Product Images *</label>
                <div 
                  className={`upload-area ${isDragging ? 'dragging' : ''}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <FaUpload className="upload-icon" />
                  <p>Drag & drop images here or</p>
                  <label className="file-input-label">
                    Browse Files
                    <input 
                      type="file" 
                      multiple 
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="file-input"
                    />
                  </label>
                  <p className="file-types">Supports: JPG, PNG, WEBP</p>
                </div>

                {imageFiles.length > 0 && (
                  <div className="image-previews">
                    <h4 className="previews-title">Selected Images ({imageFiles.length})</h4>
                    <div className="preview-grid">
                      {imageFiles.map((file, index) => (
                        <div key={index} className="image-preview">
                          <img 
                            src={URL.createObjectURL(file)} 
                            alt={`Preview ${index + 1}`} 
                            className="preview-image"
                          />
                          <button 
                            type="button" 
                            onClick={() => removeImage(index)} 
                            className="remove-image-btn"
                            aria-label="Remove image"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="form-actions">
                <button 
                  type="submit" 
                  className="submit-button"
                  disabled={isSubmitting || imageFiles.length === 0}
                >
                  {isSubmitting ? (
                    <span className="button-loader">Adding Product...</span>
                  ) : (
                    'Add Product'
                  )}
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </div>
      <ToastContainer
        position="top-center"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        toastStyle={{
          borderRadius: '12px',
          fontFamily: "'Inter', sans-serif"
        }}
      />
    </div>
  );
};

export default AddProducts;