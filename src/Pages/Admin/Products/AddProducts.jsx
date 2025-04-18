import React, { useState, useEffect, useRef } from 'react';
import { Formik, Form, Field, FieldArray, ErrorMessage } from 'formik';
import * as yup from 'yup';
import { FaPlus, FaTrash, FaUpload } from 'react-icons/fa';
import { toast, ToastContainer } from 'react-toastify';
import axios from 'axios';
import 'react-toastify/dist/ReactToastify.css';
import './AddProducts.scss';
import AdminLayout from '../AdminPanel/AdminLayout';

const initialValues = {
  name: '',
  description: '',
  main_category_id: '',
  sub_category_id: '',
  hsn_id: '',
  product_type: 'single',
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
          threshold: 10,
          images: []
        }
      ],
      specifications: [
        { key: '', value: '' }
      ]
    }
  ],
  product_images: []
};

const AddProducts = () => {
  const [categories, setCategories] = useState([]);
  const [hsnCodes, setHsnCodes] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingHsn, setLoadingHsn] = useState(true);
  const [newCategory, setNewCategory] = useState('');
  const [newSubcategory, setNewSubcategory] = useState('');
  const [newHsnCode, setNewHsnCode] = useState('');
  const [newHsnDescription, setNewHsnDescription] = useState('');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showSubcategoryModal, setShowSubcategoryModal] = useState(false);
  const [showHsnModal, setShowHsnModal] = useState(false);
  const [selectedMainCategory, setSelectedMainCategory] = useState(null);
  const [categoryImage, setCategoryImage] = useState(null);
  const setFieldValueRef = useRef(() => { });
  const formValuesRef = useRef(initialValues);
  const [submissionAttempted, setSubmissionAttempted] = useState(false);
  const firstErrorRef = useRef(null);

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

    const fetchHsnCodes = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_SERVER_API}/hsn`);
        setHsnCodes(response.data);
        setLoadingHsn(false);
      } catch (error) {
        console.error('Error fetching HSN codes:', error);
        toast.error('Failed to load HSN codes');
        setLoadingHsn(false);
      }
    };

    fetchCategories();
    fetchHsnCodes();
  }, []);

  const validationSchema = yup.object().shape({
    name: yup.string().required('Product name is required'),
    description: yup.string().required('Description is required'),
    main_category_id: yup.number().required('Main category is required'),
    sub_category_id: yup.number().required('Subcategory is required'),
    hsn_id: yup.number().nullable(),
    product_type: yup.string().required('Product type is required'),
    models: yup.array()
      .of(
        yup.object().shape({
          name: yup.string().required('Model name is required'),
          description: yup.string().required('Description is required'),
          colors: yup.array()
            .of(
              yup.object().shape({
                name: yup.string().required('Color name is required'),
                stock_quantity: yup.number().required('Stock is required').min(0),
                price: yup.number().required('Price is required').min(0),
                original_price: yup.number()
                  .min(yup.ref('price'), 'Original price must be greater than price')
                  .nullable(),
                threshold: yup.number().required('Threshold is required').min(1),
                images: yup.array().min(1, 'At least one image is required')
              })
            )
            .min(1, 'At least one color is required'),
          specifications: yup.array()
            .of(
              yup.object().shape({
                key: yup.string().required('Spec key is required'),
                value: yup.string().required('Spec value is required')
              })
            )
            .min(1, 'At least one specification is required')
        })
      )
      .when('product_type', {
        is: 'single',
        then: (schema) => schema.max(1, 'Single product can only have one model'),
        otherwise: (schema) => schema.min(1, 'At least one model is required')
      }),
    product_images: yup.array().min(1, 'At least one product image is required')
  });

  const scrollToFirstErrorField = (errors, values) => {
    const errorKeys = Object.keys(errors);
    if (errorKeys.length === 0) return;

    // Helper function to find the first truly empty field
    const findFirstEmptyField = () => {
      // Check top-level fields first
      const topLevelFields = ['name', 'description', 'main_category_id', 'sub_category_id', 'hsn_id', 'product_type', 'product_images'];
      for (const field of topLevelFields) {
        if (errors[field] && (!values[field] || (field === 'product_images' && values[field].length === 0))) {
          return field;
        }
      }

      // Check models
      if (errors.models) {
        for (let modelIndex = 0; modelIndex < values.models.length; modelIndex++) {
          const model = values.models[modelIndex];
          const modelErrors = errors.models[modelIndex] || {};

          // Check model fields
          if (modelErrors.name && !model.name) {
            return `models.${modelIndex}.name`;
          }
          if (modelErrors.description && !model.description) {
            return `models.${modelIndex}.description`;
          }

          // Check colors
          if (modelErrors.colors) {
            for (let colorIndex = 0; colorIndex < model.colors.length; colorIndex++) {
              const color = model.colors[colorIndex];
              const colorErrors = modelErrors.colors[colorIndex] || {};

              if (colorErrors.name && !color.name) {
                return `models.${modelIndex}.colors.${colorIndex}.name`;
              }
              if (colorErrors.images && (!color.images || color.images.length === 0)) {
                return `models.${modelIndex}.colors.${colorIndex}.images`;
              }
              // Add other color fields if needed
            }
          }

          // Check specifications
          if (modelErrors.specifications) {
            for (let specIndex = 0; specIndex < model.specifications.length; specIndex++) {
              const spec = model.specifications[specIndex];
              const specErrors = modelErrors.specifications[specIndex] || {};

              if (specErrors.key && !spec.key) {
                return `models.${modelIndex}.specifications.${specIndex}.key`;
              }
              if (specErrors.value && !spec.value) {
                return `models.${modelIndex}.specifications.${specIndex}.value`;
              }
            }
          }
        }
      }

      // Default to first error if we can't find an empty field
      return errorKeys[0];
    };

    const firstErrorKey = findFirstEmptyField();

    // Find the element to scroll to
    let element = document.querySelector(`[name="${firstErrorKey}"]`);

    if (!element) {
      // Try to find a parent section for nested errors
      const modelMatch = firstErrorKey.match(/models\.(\d+)/);
      if (modelMatch) {
        element = document.querySelector(`[data-model-index="${modelMatch[1]}"]`);
      }
    }

    if (element) {
      // Scroll to the element
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });

      // Focus the element if it's an input field
      if (element.tagName === 'INPUT' || element.tagName === 'SELECT' || element.tagName === 'TEXTAREA') {
        element.focus();
      }
    }
  };

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
      setCategoryImage(null);
      setShowCategoryModal(false);
      toast.success("Category added successfully");
    } catch (error) {
      console.error("Error adding category:", error.response?.data || error.message);
      toast.error("Failed to add category");
    }
  };

  const handleAddSubcategory = async (setFieldValue) => {
    if (!newSubcategory.trim() || !selectedMainCategory) return;

    try {
      const token = localStorage.getItem("token");
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
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const categoriesResponse = await axios.get(`${import.meta.env.VITE_SERVER_API}/categories`);
      setCategories(categoriesResponse.data);

      setNewSubcategory("");
      setShowSubcategoryModal(false);

      if (setFieldValue) {
        setFieldValue('sub_category_id', response.data.subcategory_id);
      }

      toast.success("Subcategory added successfully");
      return response.data;
    } catch (error) {
      console.error("Error adding subcategory:", error.response?.data || error.message);
      toast.error("Failed to add subcategory");
      throw error;
    }
  };

  const handleAddHsn = async () => {
    if (!newHsnCode.trim() || !newHsnDescription.trim()) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("User is not authenticated");
        return;
      }

      const response = await axios.post(
        `${import.meta.env.VITE_SERVER_API}/hsn/add`,
        {
          hsn_code: newHsnCode,
          description: newHsnDescription
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const hsnResponse = await axios.get(`${import.meta.env.VITE_SERVER_API}/hsn`);
      setHsnCodes(hsnResponse.data);

      setNewHsnCode("");
      setNewHsnDescription("");
      setShowHsnModal(false);

      setFieldValueRef.current('hsn_id', response.data.hsn_id);

      toast.success("HSN code added successfully");
    } catch (error) {
      console.error("Error adding HSN code:", error.response?.data || error.message);
      toast.error("Failed to add HSN code");
    }
  };

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    setSubmissionAttempted(true);
    try {
      const formData = new FormData();

      // Add basic product data
      formData.append('name', values.name);
      formData.append('description', values.description);
      formData.append('category_id', values.main_category_id);
      formData.append('subcategory_id', values.sub_category_id);
      formData.append('hsn_id', values.hsn_id || '');
      formData.append('product_type', values.product_type);

      // Handle product images
      values.product_images.forEach((image) => {
        formData.append('product_images', image);
      });

      // For single product, ensure model name matches product name
      if (values.product_type === 'single') {
        values.models[0].name = values.name;

        // Handle specifications for single product
        values.models[0].specifications.forEach((spec, specIndex) => {
          formData.append(`spec_key_${specIndex}`, spec.key);
          formData.append(`spec_value_${specIndex}`, spec.value);
        });
        formData.append('specs_count', values.models[0].specifications.length);

        // Handle colors for single product
        values.models[0].colors.forEach((color, colorIndex) => {
          formData.append(`color_name_${colorIndex}`, color.name);
          formData.append(`color_price_${colorIndex}`, color.price);
          formData.append(`color_original_price_${colorIndex}`, color.original_price || '');
          formData.append(`color_stock_${colorIndex}`, color.stock_quantity);
          formData.append(`threshold_${colorIndex}`, color.threshold || 10);

          color.images.forEach((image) => {
            formData.append(`color_images_${colorIndex}`, image);
          });
        });

        formData.append('colors_count', values.models[0].colors.length);
      }
      // Handle variable products
      else {
        values.models.forEach((model, modelIndex) => {
          formData.append(`model_name_${modelIndex}`, model.name);
          formData.append(`model_description_${modelIndex}`, model.description);

          // Handle specifications for variable product
          model.specifications.forEach((spec, specIndex) => {
            formData.append(`model_${modelIndex}_spec_key_${specIndex}`, spec.key);
            formData.append(`model_${modelIndex}_spec_value_${specIndex}`, spec.value);
          });

          // Handle colors for variable product
          model.colors.forEach((color, colorIndex) => {
            formData.append(`model_${modelIndex}_color_name_${colorIndex}`, color.name);
            formData.append(`model_${modelIndex}_color_price_${colorIndex}`, color.price);
            formData.append(`model_${modelIndex}_color_original_price_${colorIndex}`, color.original_price || '');
            formData.append(`model_${modelIndex}_color_stock_${colorIndex}`, color.stock_quantity);
            formData.append(`model_${modelIndex}_threshold_${colorIndex}`, color.threshold || 10);

            color.images.forEach((image) => {
              formData.append(`model_${modelIndex}_color_images_${colorIndex}`, image);
            });
          });

          formData.append(`model_colors_count_${modelIndex}`, model.colors.length);
          formData.append(`model_specs_count_${modelIndex}`, model.specifications.length);
        });

        formData.append('models_count', values.models.length);
      }

      const response = await axios.post(
        `${import.meta.env.VITE_SERVER_API}/product/add`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      toast.success('Product added successfully!');
      resetForm();
      setSubmissionAttempted(false);
    } catch (error) {
      console.error('Error adding product:', error);
      toast.error(error.response?.data?.message || 'Failed to add product');
    } finally {
      setSubmitting(false);
    }
  };

  const getSubcategories = (mainCategoryId) => {
    if (!mainCategoryId) return [];
    const mainCategory = categories.find(cat => cat.category_id == mainCategoryId);
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
            validateOnChange={false}
            validateOnBlur={false}
          >
            {({
              values,
              setFieldValue,
              isSubmitting,
              errors,
              touched,
              handleSubmit: formikHandleSubmit,
              validateForm
            }) => {
              const formRef = useRef();

              // Handle form submission with error scrolling
              const handleSubmitWithScroll = async (e) => {
                e.preventDefault();

                // Use Formik's validateForm function directly
                const validationErrors = await validateForm();

                if (Object.keys(validationErrors).length > 0) {
                  // Scroll to the first error
                  scrollToFirstErrorField(validationErrors, values);
                  return;
                }

                // If no errors, proceed with submission
                formikHandleSubmit(e);
              };

              return (
                <Form className="product-form" onSubmit={handleSubmitWithScroll}>
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
                          onChange={(e) => {
                            setFieldValue('name', e.target.value);
                            if (values.product_type === 'single' && values.models[0]) {
                              setFieldValue('models.0.name', e.target.value);
                            }
                          }}
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
                        <ErrorMessage
                          name="description"
                          component="div"
                          className="error-message"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Category Selection */}
                  <div className="form-section">
                    <h3 className="section-title">Category & HSN</h3>
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
                            {getSubcategories(values.main_category_id).map(subcategory => (
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
                        <label className="form-label">HSN Code</label>
                        <div className="select-with-button">
                          <Field
                            as="select"
                            name="hsn_id"
                            className="form-input"
                          >
                            <option value="">Select HSN Code</option>
                            {loadingHsn ? (
                              <option disabled>Loading HSN codes...</option>
                            ) : (
                              hsnCodes.map(hsn => (
                                <option key={hsn.hsn_id} value={hsn.hsn_id}>
                                  {hsn.hsn_code} - {hsn.description}
                                </option>
                              ))
                            )}
                          </Field>
                          <button
                            type="button"
                            className="add-button"
                            onClick={() => setShowHsnModal(true)}
                          >
                            <FaPlus /> Add
                          </button>
                        </div>
                        <ErrorMessage name="hsn_id" component="div" className="error-message" />
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

                  {/* Model Details */}
                  <FieldArray name="models">
                    {({ push: pushModel, remove: removeModel }) => (
                      <div className="form-section">
                        <div className="section-header">
                          <h3 className="section-title">Model Details</h3>
                        </div>

                        {values.models.map((model, modelIndex) => (
                          <div key={modelIndex} className="model-card" data-model-index={modelIndex}>
                            {values.product_type === 'variable' && (
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
                            )}

                            <div className="form-grid">
                              <div className="form-group">
                                <label className="form-label">
                                  {values.product_type === 'single' ? 'Model/Product Name *' : 'Model Name *'}
                                </label>
                                <Field
                                  type="text"
                                  name={`models.${modelIndex}.name`}
                                  className="form-input"
                                  placeholder={
                                    values.product_type === 'single'
                                      ? 'Same as product name'
                                      : 'Enter model name'
                                  }
                                  readOnly={values.product_type === 'single' && modelIndex === 0}
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
                                  <h4>Color Options</h4>

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

                                        <div className="form-group">
                                          <label className="form-label">Low Stock Threshold *</label>
                                          <Field
                                            type="number"
                                            name={`models.${modelIndex}.colors.${colorIndex}.threshold`}
                                            className="form-input"
                                            min="1"
                                          />
                                          <ErrorMessage
                                            name={`models.${modelIndex}.colors.${colorIndex}.threshold`}
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

                                  {/* Add Color Button */}
                                  <div className="add-button-container">
                                    <button
                                      type="button"
                                      className="add-button"
                                      onClick={() => pushColor({
                                        name: '',
                                        stock_quantity: 0,
                                        price: 0,
                                        original_price: 0,
                                        threshold: 10,
                                        images: []
                                      })}
                                    >
                                      <FaPlus /> Add Color
                                    </button>
                                  </div>
                                </div>
                              )}
                            </FieldArray>

                            {/* Model Specifications */}
                            <FieldArray name={`models.${modelIndex}.specifications`}>
                              {({ push: pushSpec, remove: removeSpec }) => (
                                <div className="form-section">
                                  <h4>Specifications</h4>

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

                                  {/* Add Specification Button */}
                                  <div className="add-button-container">
                                    <button
                                      type="button"
                                      className="add-button"
                                      onClick={() => pushSpec({ key: '', value: '' })}
                                    >
                                      <FaPlus /> Add Specification
                                    </button>
                                  </div>
                                </div>
                              )}
                            </FieldArray>
                          </div>
                        ))}

                        {/* Add Model Button */}
                        {values.product_type === 'variable' && (
                          <div className="add-button-container">
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
                                  threshold: 10,
                                  images: []
                                }],
                                specifications: [{ key: '', value: '' }]
                              })}
                            >
                              <FaPlus /> Add Model
                            </button>
                          </div>
                        )}
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
              );
            }}
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
                  onClick={async () => {
                    try {
                      await handleAddSubcategory(setFieldValueRef.current);
                      const refreshed = await axios.get(`${import.meta.env.VITE_SERVER_API}/categories`);
                      setCategories(refreshed.data);
                    } catch (error) {
                      console.error(error);
                    }
                  }}
                >
                  Add Subcategory
                </button>
              </div>
            </div>
          </div>
        )}

        {/* HSN Code Modal */}
        {showHsnModal && (
          <div className="modal-overlay">
            <div className="modal">
              <h3>Add New HSN Code</h3>
              <div className="form-group">
                <label className="form-label">HSN Code *</label>
                <input
                  type="text"
                  value={newHsnCode}
                  onChange={(e) => setNewHsnCode(e.target.value)}
                  placeholder="Enter HSN code"
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Description *</label>
                <input
                  type="text"
                  value={newHsnDescription}
                  onChange={(e) => setNewHsnDescription(e.target.value)}
                  placeholder="Enter description"
                  className="form-input"
                />
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-button"
                  onClick={() => {
                    setShowHsnModal(false);
                    setNewHsnCode('');
                    setNewHsnDescription('');
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="confirm-button"
                  onClick={handleAddHsn}
                  disabled={!newHsnCode.trim() || !newHsnDescription.trim()}
                >
                  Add HSN Code
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