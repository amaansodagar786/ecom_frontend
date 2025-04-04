import React, { useState, useEffect } from 'react';
import { Formik, Form, Field, FieldArray, ErrorMessage } from 'formik';
// import * as Yup from 'yup';
import * as yup from 'yup';

import { FaPlus, FaTrash, FaUpload, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { toast, ToastContainer } from 'react-toastify';
import axios from 'axios';
import 'react-toastify/dist/ReactToastify.css';
import './AddProducts.scss';
import AdminLayout from '../AdminPanel/AdminLayout';

const AddProducts = () => {
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [newCategory, setNewCategory] = useState('');
  const [newSubcategory, setNewSubcategory] = useState('');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showSubcategoryModal, setShowSubcategoryModal] = useState(false);
  const [selectedMainCategory, setSelectedMainCategory] = useState(null);
  const [categoryImage, setCategoryImage] = useState(null);

  // Fetch categories from backend
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_SERVER_API}/categories`);
        setCategories(response.data);
        setLoadingCategories(false);
      } catch (error) {
        console.error('Error fetching categories:', error);
        toast.error('Failed to load categories');
        setLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  // Initial form values
  const initialValues = {
    name: '',
    description: '',
    main_category_id: '',
    sub_category_id: '',
    product_type: 'single',
    unit: 1,
    models: [
      {
        name: '',
        description: '',
        colors: [
          {
            name: '',
            stock_quantity: 0,
            price: 0,
            original_price: 0,
            images: []
          }
        ],
        specifications: [
          { key: '', value: '' }
        ]
      }
    ],
    colors: [
      {
        name: '',
        stock_quantity: 0,
        price: 0,
        original_price: 0,
        images: []
      }
    ],
    specifications: [
      { key: '', value: '' }
    ],
    product_images: []
  };

  // Validation schema
  const validationSchema = yup.object().shape({
    name: yup.string().required('Product name is required'),
    description: yup.string().required('Description is required'),
    main_category_id: yup.number().required('Main category is required'),
    sub_category_id: yup.number().required('Subcategory is required'),
    product_type: yup.string().required('Product type is required'),
    unit: yup.number()
      .when('product_type', {
        is: (val) => val === 'single',
        then: (schema) => schema.required('Unit is required').min(1),
        otherwise: (schema) => schema.notRequired()
      }),
    models: yup.array()
      .when('product_type', {
        is: (val) => val === 'variable',
        then: (schema) => schema.of(
          yup.object().shape({
            name: yup.string().required('Model name is required'),
            description: yup.string().required('Description is required'),
            colors: yup.array().of(
              yup.object().shape({
                name: yup.string().required('Color name is required'),
                stock_quantity: yup.number().required('Stock is required').min(0),
                price: yup.number().required('Price is required').min(0),
                original_price: yup.number()
                  .min(yup.ref('price'), 'Original price must be greater than price')
                  .nullable(),
                images: yup.array().min(1, 'At least one image is required')
              })
            ).min(1, 'At least one color is required'),
            specifications: yup.array().of(
              yup.object().shape({
                key: yup.string().required('Spec key is required'),
                value: yup.string().required('Spec value is required')
              })
            ).min(1, 'At least one specification is required')
          })
        ).min(1, 'At least one model is required'),
        otherwise: (schema) => schema.notRequired()
      }),
    colors: yup.array()
      .when('product_type', {
        is: (val) => val === 'single',
        then: (schema) => schema.of(
          yup.object().shape({
            name: yup.string().required('Color name is required'),
            stock_quantity: yup.number().required('Stock is required').min(0),
            price: yup.number().required('Price is required').min(0),
            original_price: yup.number()
              .min(yup.ref('price'), 'Original price must be greater than price')
              .nullable(),
            images: yup.array().min(1, 'At least one image is required')
          })
        ).min(1, 'At least one color is required'),
        otherwise: (schema) => schema.notRequired()
      }),
    specifications: yup.array()
      .when('product_type', {
        is: (val) => val === 'single',
        then: (schema) => schema.of(
          yup.object().shape({
            key: yup.string().required('Spec key is required'),
            value: yup.string().required('Spec value is required')
          })
        ).min(1, 'At least one specification is required'),
        otherwise: (schema) => schema.notRequired()
      }),
    product_images: yup.array().min(1, 'At least one product image is required')
  });

  // Add new main category
  const handleAddMainCategory = async () => {
    if (!newCategory.trim()) return;
  
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("User is not authenticated");
        return;
      }
  
      const formData = new FormData();
      formData.append('name', newCategory);
      if (categoryImage) {
        formData.append('image', categoryImage);
      }
  
      const response = await axios.post(
        `${import.meta.env.VITE_SERVER_API}/category/add`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          },
        }
      );
  
      setCategories([...categories, response.data]);
      setNewCategory("");
      setCategoryImage(null);  // Reset image state
      setShowCategoryModal(false);
      toast.success("Category added successfully");
    } catch (error) {
      console.error("Error adding category:", error.response?.data || error.message);
      toast.error("Failed to add category");
    }
  };


  // Add new subcategory
  const handleAddSubcategory = async () => {
    if (!newSubcategory.trim() || !selectedMainCategory) return;

    try {
      const token = localStorage.getItem("token"); // Get token from local storage
      if (!token) {
        toast.error("User is not authenticated");
        return;
      }

      const response = await axios.post(
        `${import.meta.env.VITE_SERVER_API}/subcategory/add`,
        {
          name: newSubcategory,
          category_id: selectedMainCategory
        },
        {
          headers: {
            Authorization: `Bearer ${token}`, // Add the Authorization header
          },
        }
      );

      // Update the categories state
      const updatedCategories = categories.map((cat) => {
        if (cat.category_id === selectedMainCategory) {
          return {
            ...cat,
            subcategories: [...(cat.subcategories || []), response.data],
          };
        }
        return cat;
      });

      setCategories(updatedCategories);
      setNewSubcategory("");
      setShowSubcategoryModal(false);
      toast.success("Subcategory added successfully");
    } catch (error) {
      console.error("Error adding subcategory:", error.response?.data || error.message);
      toast.error("Failed to add subcategory");
    }
  };


  // Handle form submission
  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    console.log('Form submitted with values:', values); // Add this

    try {
      const formData = new FormData();

      // Add product data
      formData.append('name', values.name);
      formData.append('description', values.description);
      formData.append('category_id', values.main_category_id);
      formData.append('subcategory_id', values.sub_category_id);
      // formData.append('main_category_id', values.main_category_id);
      // formData.append('sub_category_id', values.sub_category_id);
      formData.append('product_type', values.product_type);

      // Handle product images
      values.product_images.forEach((image, index) => {
        formData.append(`product_images`, image);
      });

      // Handle single product
      if (values.product_type === 'single') {
        formData.append('unit', values.unit);

        // Add specifications
        values.specifications.forEach((spec, index) => {
          formData.append(`spec_key_${index}`, spec.key);
          formData.append(`spec_value_${index}`, spec.value);
        });
        formData.append('specs_count', values.specifications.length);

        // Add colors
        values.colors.forEach((color, index) => {
          formData.append(`color_name_${index}`, color.name);
          formData.append(`color_price_${index}`, color.price);
          formData.append(`color_original_price_${index}`, color.original_price || '');
          formData.append(`color_stock_${index}`, color.stock_quantity);

          // Add color images
          color.images.forEach((image, imgIndex) => {
            formData.append(`color_images_${index}`, image);
          });
        });
        formData.append('colors_count', values.colors.length);
      }
      // Handle variable product
      else {
        values.models.forEach((model, modelIndex) => {
          formData.append(`model_name_${modelIndex}`, model.name);
          formData.append(`model_description_${modelIndex}`, model.description);

          // Add model specifications
          model.specifications.forEach((spec, specIndex) => {
            formData.append(`model_${modelIndex}_spec_key_${specIndex}`, spec.key);
            formData.append(`model_${modelIndex}_spec_value_${specIndex}`, spec.value);
          });
          formData.append(`model_specs_count_${modelIndex}`, model.specifications.length);

          // Add model colors
          model.colors.forEach((color, colorIndex) => {
            formData.append(`model_${modelIndex}_color_name_${colorIndex}`, color.name);
            formData.append(`model_${modelIndex}_color_price_${colorIndex}`, color.price);
            formData.append(`model_${modelIndex}_color_original_price_${colorIndex}`, color.original_price || '');
            formData.append(`model_${modelIndex}_color_stock_${colorIndex}`, color.stock_quantity);

            // Add color images
            color.images.forEach((image, imgIndex) => {
              formData.append(`model_${modelIndex}_color_images_${colorIndex}`, image);
            });
          });
          formData.append(`model_colors_count_${modelIndex}`, model.colors.length);
        });
        formData.append('models_count', values.models.length);
      }

      // Add new category if specified
      if (values.new_category) {
        formData.append('new_category', values.new_category);
      }

      // Add new subcategory if specified
      if (values.new_subcategory) {
        formData.append('new_subcategory', values.new_subcategory);
      }

      const response = await axios.post(`${import.meta.env.VITE_SERVER_API}/product/add`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      toast.success('Product added successfully!');
      resetForm();
    } catch (error) {
      console.error('Error adding product:', error);
      toast.error(error.response?.data?.message || 'Failed to add product');
    } finally {
      setSubmitting(false);
    }
  };

  // Get subcategories for selected main category
  const getSubcategories = () => {
    if (!selectedMainCategory) return [];
    const mainCategory = categories.find(cat => cat.category_id == selectedMainCategory);
    return mainCategory ? mainCategory.subcategories || [] : [];
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
                        placeholder="Product description"
                        rows="4"
                      />
                      <ErrorMessage name="description" component="div" className="error-message" />
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
  ) : (
    categories.map(category => (
      <option key={category.category_id} value={category.category_id}>
        {category.name}
      </option>
    ))
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
                            <option key={subcategory.subcategory_id} value={subcategory.subcategory_id}>
                              {subcategory.name}
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

                    {values.product_type === 'single' && (
                      <div className="form-group">
                        <label className="form-label">Unit *</label>
                        <Field
                          type="number"
                          name="unit"
                          className="form-input"
                          min="1"
                        />
                        <ErrorMessage name="unit" component="div" className="error-message" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Product Images */}
                <div className="form-section">
                  <h3 className="section-title">Product Images</h3>
                  <div className="form-group">
                    <div className="image-upload-container">
                      <input
                        type="file"
                        id="product-images"
                        multiple
                        accept="image/*"
                        className="file-input"
                        onChange={(e) => {
                          const files = Array.from(e.target.files);
                          setFieldValue('product_images', files);
                        }}
                      />
                      <label htmlFor="product-images" className="upload-button">
                        <FaUpload /> Upload Images
                      </label>
                      <p className="file-hint">Supports: JPG, PNG, WEBP</p>
                    </div>
                    <ErrorMessage name="product_images" component="div" className="error-message" />

                    {/* Image Previews */}
                    {values.product_images.length > 0 && (
                      <div className="image-previews">
                        {values.product_images.map((image, index) => (
                          <div key={index} className="image-preview">
                            {typeof image === 'string' ? (
                              <img src={image} alt={`Preview ${index + 1}`} />
                            ) : (
                              <img src={URL.createObjectURL(image)} alt={`Preview ${index + 1}`} />
                            )}
                            <button
                              type="button"
                              className="remove-image"
                              onClick={() => {
                                const updatedImages = [...values.product_images];
                                updatedImages.splice(index, 1);
                                setFieldValue('product_images', updatedImages);
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

                {/* Product Variations */}
                {values.product_type === 'single' ? (
                  <>
                    {/* Single Product - Colors */}
                    <FieldArray name="colors">
                      {({ push: pushColor, remove: removeColor }) => (
                        <div className="form-section">
                          <div className="section-header">
                            <h3 className="section-title">Color Options</h3>
                            <button
                              type="button"
                              className="add-button"
                              onClick={() => pushColor({
                                name: '',
                                stock_quantity: 0,
                                price: 0,
                                original_price: 0,
                                images: []
                              })}
                            >
                              <FaPlus /> Add Color
                            </button>
                          </div>

                          {values.colors.map((color, index) => (
                            <div key={index} className="color-card">
                              <div className="color-header">
                                <h4>Color {index + 1}</h4>
                                <button
                                  type="button"
                                  className="remove-button"
                                  onClick={() => removeColor(index)}
                                  disabled={values.colors.length <= 1}
                                >
                                  <FaTrash />
                                </button>
                              </div>

                              <div className="form-grid">
                                <div className="form-group">
                                  <label className="form-label">Color Name *</label>
                                  <Field
                                    type="text"
                                    name={`colors.${index}.name`}
                                    className="form-input"
                                    placeholder="e.g., Black, Red"
                                  />
                                  <ErrorMessage
                                    name={`colors.${index}.name`}
                                    component="div"
                                    className="error-message"
                                  />
                                </div>

                                <div className="form-group">
                                  <label className="form-label">Stock Quantity *</label>
                                  <Field
                                    type="number"
                                    name={`colors.${index}.stock_quantity`}
                                    className="form-input"
                                    min="0"
                                  />
                                  <ErrorMessage
                                    name={`colors.${index}.stock_quantity`}
                                    component="div"
                                    className="error-message"
                                  />
                                </div>

                                <div className="form-group">
                                  <label className="form-label">Price *</label>
                                  <Field
                                    type="number"
                                    name={`colors.${index}.price`}
                                    className="form-input"
                                    min="0"
                                    step="0.01"
                                  />
                                  <ErrorMessage
                                    name={`colors.${index}.price`}
                                    component="div"
                                    className="error-message"
                                  />
                                </div>

                                <div className="form-group">
                                  <label className="form-label">Original Price</label>
                                  <Field
                                    type="number"
                                    name={`colors.${index}.original_price`}
                                    className="form-input"
                                    min="0"
                                    step="0.01"
                                  />
                                  <ErrorMessage
                                    name={`colors.${index}.original_price`}
                                    component="div"
                                    className="error-message"
                                  />
                                </div>
                              </div>

                              {/* Color Images */}
                              <div className="form-group">
                                <label className="form-label">Color Images *</label>
                                <div className="image-upload-container">
                                  <input
                                    type="file"
                                    id={`color-images-${index}`}
                                    multiple
                                    accept="image/*"
                                    className="file-input"
                                    onChange={(e) => {
                                      const files = Array.from(e.target.files);
                                      setFieldValue(`colors.${index}.images`, files);
                                    }}
                                  />
                                  <label htmlFor={`color-images-${index}`} className="upload-button">
                                    <FaUpload /> Upload Images
                                  </label>
                                </div>
                                <ErrorMessage
                                  name={`colors.${index}.images`}
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
                                            setFieldValue(`colors.${index}.images`, updatedImages);
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

                    {/* Single Product - Specifications */}
                    <FieldArray name="specifications">
                      {({ push: pushSpec, remove: removeSpec }) => (
                        <div className="form-section">
                          <div className="section-header">
                            <h3 className="section-title">Specifications</h3>
                            <button
                              type="button"
                              className="add-button"
                              onClick={() => pushSpec({ key: '', value: '' })}
                            >
                              <FaPlus /> Add Specification
                            </button>
                          </div>

                          {values.specifications.map((spec, index) => (
                            <div key={index} className="spec-row">
                              <div className="form-group">
                                <Field
                                  type="text"
                                  name={`specifications.${index}.key`}
                                  className="form-input"
                                  placeholder="Key (e.g., RAM)"
                                />
                                <ErrorMessage
                                  name={`specifications.${index}.key`}
                                  component="div"
                                  className="error-message"
                                />
                              </div>
                              <div className="form-group">
                                <Field
                                  type="text"
                                  name={`specifications.${index}.value`}
                                  className="form-input"
                                  placeholder="Value (e.g., 8GB)"
                                />
                                <ErrorMessage
                                  name={`specifications.${index}.value`}
                                  component="div"
                                  className="error-message"
                                />
                              </div>
                              <button
                                type="button"
                                className="remove-button"
                                onClick={() => removeSpec(index)}
                                disabled={values.specifications.length <= 1}
                              >
                                <FaTrash />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </FieldArray>
                  </>
                ) : (
                  <>
                    {/* Variable Product - Models */}
                    <FieldArray name="models">
                      {({ push: pushModel, remove: removeModel }) => (
                        <div className="form-section">
                          <div className="section-header">
                            <h3 className="section-title">Product Models</h3>
                            <button
                              type="button"
                              className="add-button"
                              onClick={() => pushModel({
                                name: '',
                                description: '',
                                colors: [{
                                  name: '',
                                  stock_quantity: 0,
                                  price: 0,
                                  original_price: 0,
                                  images: []
                                }],
                                specifications: [{ key: '', value: '' }]
                              })}
                            >
                              <FaPlus /> Add Model
                            </button>
                          </div>

                          {values.models.map((model, modelIndex) => (
                            <div key={modelIndex} className="model-card">
                              <div className="model-header">
                                <h4>Model {modelIndex + 1}</h4>
                                <button
                                  type="button"
                                  className="remove-button"
                                  onClick={() => removeModel(modelIndex)}
                                  disabled={values.models.length <= 1}
                                >
                                  <FaTrash />
                                </button>
                              </div>

                              <div className="form-grid">
                                <div className="form-group">
                                  <label className="form-label">Model Name *</label>
                                  <Field
                                    type="text"
                                    name={`models.${modelIndex}.name`}
                                    className="form-input"
                                    placeholder="Enter model name"
                                  />
                                  <ErrorMessage
                                    name={`models.${modelIndex}.name`}
                                    component="div"
                                    className="error-message"
                                  />
                                </div>

                                <div className="form-group">
                                  <label className="form-label">Description *</label>
                                  <Field
                                    as="textarea"
                                    name={`models.${modelIndex}.description`}
                                    className="form-input textarea"
                                    placeholder="Model description"
                                    rows="3"
                                  />
                                  <ErrorMessage
                                    name={`models.${modelIndex}.description`}
                                    component="div"
                                    className="error-message"
                                  />
                                </div>
                              </div>

                              {/* Model Colors */}
                              <FieldArray name={`models.${modelIndex}.colors`}>
                                {({ push: pushColor, remove: removeColor }) => (
                                  <div className="form-section">
                                    <div className="section-header">
                                      <h4>Color Options</h4>
                                      <button
                                        type="button"
                                        className="add-button"
                                        onClick={() => pushColor({
                                          name: '',
                                          stock_quantity: 0,
                                          price: 0,
                                          original_price: 0,
                                          images: []
                                        })}
                                      >
                                        <FaPlus /> Add Color
                                      </button>
                                    </div>

                                    {model.colors.map((color, colorIndex) => (
                                      <div key={colorIndex} className="color-card">
                                        <div className="color-header">
                                          <h5>Color {colorIndex + 1}</h5>
                                          <button
                                            type="button"
                                            className="remove-button"
                                            onClick={() => removeColor(colorIndex)}
                                            disabled={model.colors.length <= 1}
                                          >
                                            <FaTrash />
                                          </button>
                                        </div>

                                        <div className="form-grid">
                                          <div className="form-group">
                                            <label className="form-label">Color Name *</label>
                                            <Field
                                              type="text"
                                              name={`models.${modelIndex}.colors.${colorIndex}.name`}
                                              className="form-input"
                                              placeholder="e.g., Black, Red"
                                            />
                                            <ErrorMessage
                                              name={`models.${modelIndex}.colors.${colorIndex}.name`}
                                              component="div"
                                              className="error-message"
                                            />
                                          </div>

                                          <div className="form-group">
                                            <label className="form-label">Stock Quantity *</label>
                                            <Field
                                              type="number"
                                              name={`models.${modelIndex}.colors.${colorIndex}.stock_quantity`}
                                              className="form-input"
                                              min="0"
                                            />
                                            <ErrorMessage
                                              name={`models.${modelIndex}.colors.${colorIndex}.stock_quantity`}
                                              component="div"
                                              className="error-message"
                                            />
                                          </div>

                                          <div className="form-group">
                                            <label className="form-label">Price *</label>
                                            <Field
                                              type="number"
                                              name={`models.${modelIndex}.colors.${colorIndex}.price`}
                                              className="form-input"
                                              min="0"
                                              step="0.01"
                                            />
                                            <ErrorMessage
                                              name={`models.${modelIndex}.colors.${colorIndex}.price`}
                                              component="div"
                                              className="error-message"
                                            />
                                          </div>

                                          <div className="form-group">
                                            <label className="form-label">Original Price</label>
                                            <Field
                                              type="number"
                                              name={`models.${modelIndex}.colors.${colorIndex}.original_price`}
                                              className="form-input"
                                              min="0"
                                              step="0.01"
                                            />
                                            <ErrorMessage
                                              name={`models.${modelIndex}.colors.${colorIndex}.original_price`}
                                              component="div"
                                              className="error-message"
                                            />
                                          </div>
                                        </div>

                                        {/* Color Images */}
                                        <div className="form-group">
                                          <label className="form-label">Color Images *</label>
                                          <div className="image-upload-container">
                                            <input
                                              type="file"
                                              id={`model-${modelIndex}-color-images-${colorIndex}`}
                                              multiple
                                              accept="image/*"
                                              className="file-input"
                                              onChange={(e) => {
                                                const files = Array.from(e.target.files);
                                                setFieldValue(`models.${modelIndex}.colors.${colorIndex}.images`, files);
                                              }}
                                            />
                                            <label htmlFor={`model-${modelIndex}-color-images-${colorIndex}`} className="upload-button">
                                              <FaUpload /> Upload Images
                                            </label>
                                          </div>
                                          <ErrorMessage
                                            name={`models.${modelIndex}.colors.${colorIndex}.images`}
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
                                                      setFieldValue(`models.${modelIndex}.colors.${colorIndex}.images`, updatedImages);
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

                              {/* Model Specifications */}
                              <FieldArray name={`models.${modelIndex}.specifications`}>
                                {({ push: pushSpec, remove: removeSpec }) => (
                                  <div className="form-section">
                                    <div className="section-header">
                                      <h4>Specifications</h4>
                                      <button
                                        type="button"
                                        className="add-button"
                                        onClick={() => pushSpec({ key: '', value: '' })}
                                      >
                                        <FaPlus /> Add Specification
                                      </button>
                                    </div>

                                    {model.specifications.map((spec, specIndex) => (
                                      <div key={specIndex} className="spec-row">
                                        <div className="form-group">
                                          <Field
                                            type="text"
                                            name={`models.${modelIndex}.specifications.${specIndex}.key`}
                                            className="form-input"
                                            placeholder="Key (e.g., RAM)"
                                          />
                                          <ErrorMessage
                                            name={`models.${modelIndex}.specifications.${specIndex}.key`}
                                            component="div"
                                            className="error-message"
                                          />
                                        </div>
                                        <div className="form-group">
                                          <Field
                                            type="text"
                                            name={`models.${modelIndex}.specifications.${specIndex}.value`}
                                            className="form-input"
                                            placeholder="Value (e.g., 8GB)"
                                          />
                                          <ErrorMessage
                                            name={`models.${modelIndex}.specifications.${specIndex}.value`}
                                            component="div"
                                            className="error-message"
                                          />
                                        </div>
                                        <button
                                          type="button"
                                          className="remove-button"
                                          onClick={() => removeSpec(specIndex)}
                                          disabled={model.specifications.length <= 1}
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
                  </>
                )}

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
      
      {/* Image Upload Section */}
      <div className="form-group" style={{ marginTop: '1rem' }}>
        <label className="form-label">Category Image *</label>
        <div className="image-upload-container">
          <input
            type="file"
            id="category-image"
            accept="image/*"
            className="file-input"
            onChange={(e) => {
              const file = e.target.files[0];
              setCategoryImage(file);
            }}
          />
          <label htmlFor="category-image" className="upload-button">
            <FaUpload /> Upload Image
          </label>
          <p className="file-hint">Supports: JPG, PNG, WEBP</p>
        </div>
        
        {/* Image Preview */}
        {categoryImage && (
          <div className="image-previews" style={{ marginTop: '1rem' }}>
            <div className="image-preview">
              <img 
                src={URL.createObjectURL(categoryImage)} 
                alt="Category preview" 
              />
              <button
                type="button"
                className="remove-image"
                onClick={() => setCategoryImage(null)}
              >
                <FaTrash />
              </button>
            </div>
          </div>
        )}
      </div>
      
      <div className="modal-actions">
        <button
          type="button"
          className="cancel-button"
          onClick={() => {
            setShowCategoryModal(false);
            setCategoryImage(null);
          }}
        >
          Cancel
        </button>
        <button
          type="button"
          className="confirm-button"
          onClick={handleAddMainCategory}
          disabled={!newCategory.trim() || !categoryImage}
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
              <p>For category: {categories.find(c => c.category_id == selectedMainCategory)?.name}</p>
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