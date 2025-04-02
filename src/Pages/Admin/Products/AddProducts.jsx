import React, { useState, useEffect } from 'react';
import { Formik, Form, Field, FieldArray, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { FaPlus, FaTrash, FaUpload, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { toast, ToastContainer } from 'react-toastify';
import axios from 'axios';
import 'react-toastify/dist/ReactToastify.css';
import './AddProducts.scss';
import AdminLayout from '../AdminPanel/AdminLayout';

const AddProducts = () => {
  // State for categories from MySQL
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [newCategory, setNewCategory] = useState('');
  const [newSubcategory, setNewSubcategory] = useState('');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showSubcategoryModal, setShowSubcategoryModal] = useState(false);
  const [selectedMainCategory, setSelectedMainCategory] = useState(null);

  // Fetch categories from MySQL backend
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get('/api/categories');
        console.log('API Response:', response.data); // Add this line
        setCategories(response.data);
        setLoadingCategories(false);
      } catch (error) {
        console.error('Error fetching categories:', error);
        toast.error('Failed to load categories');
        setLoadingCategories(false);
        setCategories([]); // Ensure it's set to empty array on error
      }
    };
    fetchCategories();
  }, []);

  // Initial form values (aligned with MySQL structure)
  const initialValues = {
    product_name: '',
    short_description: '',
    long_description: '',
    main_category_id: '',
    sub_category_id: '',
    product_type: 'single', // 'single' or 'variable'
    variations: [
      {
        model_name: '',
        description: '',
        colors: [
          {
            color_name: '',
            stock_quantity: 0,
            price: 0,
            original_price: 0,
            images: []
          }
        ],
        specifications: [
          { spec_key: '', spec_value: '' }
        ]
      }
    ]
  };

  // Validation schema
  const validationSchema = Yup.object().shape({
    product_name: Yup.string().required('Product name is required'),
    short_description: Yup.string().required('Short description is required'),
    main_category_id: Yup.number().required('Main category is required'),
    sub_category_id: Yup.number().required('Subcategory is required'),
    product_type: Yup.string().required('Product type is required'),
    variations: Yup.array().of(
      Yup.object().shape({
        model_name: Yup.string().when('../product_type', {
          is: 'variable',
          then: Yup.string().required('Model name is required for variable products')
        }),
        description: Yup.string().required('Description is required'),
        colors: Yup.array().of(
          Yup.object().shape({
            color_name: Yup.string().required('Color name is required'),
            stock_quantity: Yup.number().required('Stock is required').min(0),
            price: Yup.number().required('Price is required').min(0),
            original_price: Yup.number().min(Yup.ref('price'), 'Original price must be greater than price'),
            images: Yup.array().min(1, 'At least one image is required')
          })
        ).min(1, 'At least one color is required'),
        specifications: Yup.array().of(
          Yup.object().shape({
            spec_key: Yup.string().required('Spec key is required'),
            spec_value: Yup.string().required('Spec value is required')
          })
        ).min(1, 'At least one specification is required')
      })
    ).min(1, 'At least one variation is required')
  });

  // Add new main category to MySQL
  const handleAddMainCategory = async () => {
    if (!newCategory.trim()) return;

    try {
      const response = await axios.post('/api/categories', {
        category_name: newCategory,
        parent_id: null
      });
      setCategories([...categories, response.data]);
      setNewCategory('');
      setShowCategoryModal(false);
      toast.success('Category added successfully');
    } catch (error) {
      toast.error('Failed to add category');
    }
  };

  // Add new subcategory to MySQL
  const handleAddSubcategory = async () => {
    if (!newSubcategory.trim() || !selectedMainCategory) return;

    try {
      const response = await axios.post('/api/categories', {
        category_name: newSubcategory,
        parent_id: selectedMainCategory
      });

      // Update the categories state
      const updatedCategories = categories.map(cat => {
        if (cat.id === selectedMainCategory) {
          return {
            ...cat,
            children: [...(cat.children || []), response.data]
          };
        }
        return cat;
      });

      setCategories(updatedCategories);
      setNewSubcategory('');
      setShowSubcategoryModal(false);
      toast.success('Subcategory added successfully');
    } catch (error) {
      toast.error('Failed to add subcategory');
    }
  };

  // Handle form submission to MySQL
  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      const formData = new FormData();

      // Convert the data to MySQL-friendly format
      const productData = {
        product_name: values.product_name,
        short_description: values.short_description,
        long_description: values.long_description,
        main_category_id: values.main_category_id,
        sub_category_id: values.sub_category_id,
        product_type: values.product_type,
        variations: values.variations.map(variation => ({
          model_name: variation.model_name,
          description: variation.description,
          colors: variation.colors.map(color => ({
            color_name: color.color_name,
            stock_quantity: color.stock_quantity,
            price: color.price,
            original_price: color.original_price
          })),
          specifications: variation.specifications
        }))
      };

      // Append JSON data
      formData.append('product', JSON.stringify(productData));

      // Append all images
      values.variations.forEach((variation, vIndex) => {
        variation.colors.forEach((color, cIndex) => {
          color.images.forEach((image, iIndex) => {
            formData.append(`images[v${vIndex}_c${cIndex}]`, image);
          });
        });
      });

      const response = await axios.post('/api/products', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      toast.success(response.data.message || 'Product added successfully!');
      resetForm();
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to add product. Please try again.';
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  // Get subcategories for selected main category
  const getSubcategories = () => {
    if (!selectedMainCategory) return [];
    const mainCategory = categories.find(cat => cat.id === selectedMainCategory);
    return mainCategory ? mainCategory.children || [] : [];
  };

  return (
    <AdminLayout>
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
          {({ values, setFieldValue, isSubmitting }) => (
            <Form className="product-form">
              {/* Basic Product Information */}
              <div className="form-section">
                <h3 className="section-title">Basic Information</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Product Name *</label>
                    <Field
                      type="text"
                      name="product_name"
                      className="form-input"
                      placeholder="Enter product name"
                    />
                    <ErrorMessage name="product_name" component="div" className="error-message" />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Short Description *</label>
                    <Field
                      as="textarea"
                      name="short_description"
                      className="form-input textarea"
                      placeholder="Brief product description"
                      rows="2"
                    />
                    <ErrorMessage name="short_description" component="div" className="error-message" />
                  </div>
                </div>
              </div>

              {/* Category Selection */}
              <div className="form-section">
                <h3 className="section-title">Category</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Main Category *</label>
                    <div className="select-with-button">
                      <Field
                        as="select"
                        name="main_category_id"
                        className="form-input"
                        onChange={(e) => {
                          setFieldValue('main_category_id', e.target.value);
                          setSelectedMainCategory(e.target.value);
                          setFieldValue('sub_category_id', '');
                        }}
                      >
                        <option value="">Select main category</option>
                        {loadingCategories ? (
                          <option disabled>Loading categories...</option>
                        ) : Array.isArray(categories) ? (
                          categories.filter(c => !c.parent_id).map(category => (
                            <option key={category.id} value={category.id}>
                              {category.category_name}
                            </option>
                          ))
                        ) : (
                          <option disabled>No categories available</option>
                        )}
                      </Field>
                      <button
                        type="button"
                        className="add-button"
                        onClick={() => setShowCategoryModal(true)}
                      >
                        <FaPlus /> Add
                      </button>
                    </div>
                    <ErrorMessage name="main_category_id" component="div" className="error-message" />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Subcategory *</label>
                    <div className="select-with-button">
                      <Field
                        as="select"
                        name="sub_category_id"
                        className="form-input"
                        disabled={!values.main_category_id}
                      >
                        <option value="">Select subcategory</option>
                        {getSubcategories().map(subcategory => (
                          <option key={subcategory.id} value={subcategory.id}>
                            {subcategory.category_name}
                          </option>
                        ))}
                      </Field>
                      <button
                        type="button"
                        className="add-button"
                        onClick={() => values.main_category_id && setShowSubcategoryModal(true)}
                        disabled={!values.main_category_id}
                      >
                        <FaPlus /> Add
                      </button>
                    </div>
                    <ErrorMessage name="sub_category_id" component="div" className="error-message" />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Product Type *</label>
                    <div className="radio-group">
                      <label className="radio-label">
                        <Field
                          type="radio"
                          name="product_type"
                          value="single"
                          className="radio-input"
                        />
                        Single Product
                      </label>
                      <label className="radio-label">
                        <Field
                          type="radio"
                          name="product_type"
                          value="variable"
                          className="radio-input"
                        />
                        Variable Product
                      </label>
                    </div>
                    <ErrorMessage name="product_type" component="div" className="error-message" />
                  </div>
                </div>
              </div>

              {/* Product Variations */}
              <FieldArray name="variations">
                {({ push, remove }) => (
                  <div className="form-section">
                    <div className="section-header">
                      <h3 className="section-title">
                        {values.product_type === 'variable' ? 'Product Models' : 'Product Details'}
                      </h3>
                      {values.product_type === 'variable' && (
                        <button
                          type="button"
                          className="add-button"
                          onClick={() => push({
                            model_name: '',
                            description: '',
                            colors: [{
                              color_name: '',
                              stock_quantity: 0,
                              price: 0,
                              original_price: 0,
                              images: []
                            }],
                            specifications: [{ spec_key: '', spec_value: '' }]
                          })}
                        >
                          <FaPlus /> Add Model
                        </button>
                      )}
                    </div>

                    {values.variations.map((variation, index) => (
                      <div key={index} className="variation-card">
                        <div className="variation-header">
                          {values.product_type === 'variable' && (
                            <>
                              <h4>Model {index + 1}</h4>
                              <button
                                type="button"
                                className="remove-button"
                                onClick={() => remove(index)}
                                disabled={values.variations.length <= 1}
                              >
                                <FaTrash />
                              </button>
                            </>
                          )}
                        </div>

                        <div className="form-grid">
                          {values.product_type === 'variable' && (
                            <div className="form-group">
                              <label className="form-label">Model Name *</label>
                              <Field
                                type="text"
                                name={`variations.${index}.model_name`}
                                className="form-input"
                                placeholder="Enter model name"
                              />
                              <ErrorMessage
                                name={`variations.${index}.model_name`}
                                component="div"
                                className="error-message"
                              />
                            </div>
                          )}

                          <div className="form-group">
                            <label className="form-label">Description *</label>
                            <Field
                              as="textarea"
                              name={`variations.${index}.description`}
                              className="form-input textarea"
                              placeholder="Detailed description"
                              rows="4"
                            />
                            <ErrorMessage
                              name={`variations.${index}.description`}
                              component="div"
                              className="error-message"
                            />
                          </div>
                        </div>

                        {/* Color Variations */}
                        <FieldArray name={`variations.${index}.colors`}>
                          {({ push: pushColor, remove: removeColor }) => (
                            <div className="colors-section">
                              <div className="section-header">
                                <h4 className="section-subtitle">Color Options</h4>
                                <button
                                  type="button"
                                  className="add-button"
                                  onClick={() => pushColor({
                                    color_name: '',
                                    stock_quantity: 0,
                                    price: 0,
                                    original_price: 0,
                                    images: []
                                  })}
                                >
                                  <FaPlus /> Add Color
                                </button>
                              </div>

                              {variation.colors.map((color, colorIndex) => (
                                <div key={colorIndex} className="color-card">
                                  <div className="color-header">
                                    <h5>Color {colorIndex + 1}</h5>
                                    <button
                                      type="button"
                                      className="remove-button"
                                      onClick={() => removeColor(colorIndex)}
                                      disabled={variation.colors.length <= 1}
                                    >
                                      <FaTrash />
                                    </button>
                                  </div>

                                  <div className="form-grid">
                                    <div className="form-group">
                                      <label className="form-label">Color Name *</label>
                                      <Field
                                        type="text"
                                        name={`variations.${index}.colors.${colorIndex}.color_name`}
                                        className="form-input"
                                        placeholder="e.g., Black, Red"
                                      />
                                      <ErrorMessage
                                        name={`variations.${index}.colors.${colorIndex}.color_name`}
                                        component="div"
                                        className="error-message"
                                      />
                                    </div>

                                    <div className="form-group">
                                      <label className="form-label">Stock Quantity *</label>
                                      <Field
                                        type="number"
                                        name={`variations.${index}.colors.${colorIndex}.stock_quantity`}
                                        className="form-input"
                                        min="0"
                                      />
                                      <ErrorMessage
                                        name={`variations.${index}.colors.${colorIndex}.stock_quantity`}
                                        component="div"
                                        className="error-message"
                                      />
                                    </div>

                                    <div className="form-group">
                                      <label className="form-label">Price *</label>
                                      <Field
                                        type="number"
                                        name={`variations.${index}.colors.${colorIndex}.price`}
                                        className="form-input"
                                        min="0"
                                        step="0.01"
                                      />
                                      <ErrorMessage
                                        name={`variations.${index}.colors.${colorIndex}.price`}
                                        component="div"
                                        className="error-message"
                                      />
                                    </div>

                                    <div className="form-group">
                                      <label className="form-label">Original Price</label>
                                      <Field
                                        type="number"
                                        name={`variations.${index}.colors.${colorIndex}.original_price`}
                                        className="form-input"
                                        min="0"
                                        step="0.01"
                                      />
                                      <ErrorMessage
                                        name={`variations.${index}.colors.${colorIndex}.original_price`}
                                        component="div"
                                        className="error-message"
                                      />
                                    </div>
                                  </div>

                                  {/* Image Upload */}
                                  <div className="form-group">
                                    <label className="form-label">Images *</label>
                                    <div className="image-upload-container">
                                      <input
                                        type="file"
                                        id={`color-images-${index}-${colorIndex}`}
                                        multiple
                                        accept="image/*"
                                        className="file-input"
                                        onChange={(e) => {
                                          const files = Array.from(e.target.files);
                                          const currentImages = values.variations[index].colors[colorIndex].images;
                                          setFieldValue(
                                            `variations.${index}.colors.${colorIndex}.images`,
                                            [...currentImages, ...files]
                                          );
                                        }}
                                      />
                                      <label
                                        htmlFor={`color-images-${index}-${colorIndex}`}
                                        className="upload-button"
                                      >
                                        <FaUpload /> Upload Images
                                      </label>
                                      <p className="file-hint">Supports: JPG, PNG, WEBP</p>
                                    </div>
                                    <ErrorMessage
                                      name={`variations.${index}.colors.${colorIndex}.images`}
                                      component="div"
                                      className="error-message"
                                    />

                                    {/* Image Previews */}
                                    {color.images.length > 0 && (
                                      <div className="image-previews">
                                        {color.images.map((image, imgIndex) => (
                                          <div key={imgIndex} className="image-preview">
                                            {typeof image === 'string' ? (
                                              <img src={image} alt={`Preview ${imgIndex + 1}`} />
                                            ) : (
                                              <img src={URL.createObjectURL(image)} alt={`Preview ${imgIndex + 1}`} />
                                            )}
                                            <button
                                              type="button"
                                              className="remove-image"
                                              onClick={() => {
                                                const updatedImages = [...color.images];
                                                updatedImages.splice(imgIndex, 1);
                                                setFieldValue(
                                                  `variations.${index}.colors.${colorIndex}.images`,
                                                  updatedImages
                                                );
                                              }}
                                            >
                                              <FaTrash />
                                            </button>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </FieldArray>

                        {/* Specifications */}
                        <FieldArray name={`variations.${index}.specifications`}>
                          {({ push: pushSpec, remove: removeSpec }) => (
                            <div className="specs-section">
                              <div className="section-header">
                                <h4 className="section-subtitle">Specifications</h4>
                                <button
                                  type="button"
                                  className="add-button"
                                  onClick={() => pushSpec({ spec_key: '', spec_value: '' })}
                                >
                                  <FaPlus /> Add Specification
                                </button>
                              </div>

                              {variation.specifications.map((spec, specIndex) => (
                                <div key={specIndex} className="spec-row">
                                  <div className="form-group">
                                    <Field
                                      type="text"
                                      name={`variations.${index}.specifications.${specIndex}.spec_key`}
                                      className="form-input"
                                      placeholder="Key (e.g., RAM)"
                                    />
                                    <ErrorMessage
                                      name={`variations.${index}.specifications.${specIndex}.spec_key`}
                                      component="div"
                                      className="error-message"
                                    />
                                  </div>
                                  <div className="form-group">
                                    <Field
                                      type="text"
                                      name={`variations.${index}.specifications.${specIndex}.spec_value`}
                                      className="form-input"
                                      placeholder="Value (e.g., 8GB)"
                                    />
                                    <ErrorMessage
                                      name={`variations.${index}.specifications.${specIndex}.spec_value`}
                                      component="div"
                                      className="error-message"
                                    />
                                  </div>
                                  <button
                                    type="button"
                                    className="remove-button"
                                    onClick={() => removeSpec(specIndex)}
                                    disabled={variation.specifications.length <= 1}
                                  >
                                    <FaTrash />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </FieldArray>
                      </div>
                    ))}
                  </div>
                )}
              </FieldArray>

              {/* Form Submission */}
              <div className="form-actions">
                <button
                  type="submit"
                  className="submit-button"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving Product...' : 'Save Product'}
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </div>

      {/* Category Modals */}
      {showCategoryModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Add New Main Category</h3>
            <input
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="Enter category name"
              className="form-input"
            />
            <div className="modal-actions">
              <button
                type="button"
                className="cancel-button"
                onClick={() => setShowCategoryModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="confirm-button"
                onClick={handleAddMainCategory}
              >
                Add Category
              </button>
            </div>
          </div>
        </div>
      )}

      {showSubcategoryModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Add New Subcategory</h3>
            <p>For category: {categories.find(c => c.id === selectedMainCategory)?.category_name}</p>
            <input
              type="text"
              value={newSubcategory}
              onChange={(e) => setNewSubcategory(e.target.value)}
              placeholder="Enter subcategory name"
              className="form-input"
            />
            <div className="modal-actions">
              <button
                type="button"
                className="cancel-button"
                onClick={() => setShowSubcategoryModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="confirm-button"
                onClick={handleAddSubcategory}
              >
                Add Subcategory
              </button>
            </div>
          </div>
        </div>
      )}

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
    </AdminLayout>
  );
};

export default AddProducts;