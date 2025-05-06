import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
// import Loader from "../../../Components/Loader/Loader";
import AdminLayout from '../AdminPanel/AdminLayout';
import './NewProduct.scss';
import Loader from '../../../Components/Loader/Loader';

const NewProduct = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [removedModelIds, setRemovedModelIds] = useState([]);
  const [removedSpecIds, setRemovedSpecIds] = useState([]);
  const [validationErrors, setValidationErrors] = useState({});
  const formRef = useRef(null);

  const [coverImage, setCoverImage] = useState(null);
  const [newCoverImage, setNewCoverImage] = useState(null);

  // const [formData, setFormData] = useState({
  //   name: '',
  //   description: '',
  //   product_type: 'single',
  //   category_id: '',
  //   subcategory_id: '',
  //   images: [],
  //   colors: [],
  //   models: [],
  //   specifications: []
  // });
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    product_type: 'single',
    category_id: '',
    subcategory_id: '',
    hsn: '', // Add this line
    images: [],
    colors: [{
      name: 'DEFAULT', // Single default color variant
      price: 0,
      original_price: 0,
      stock_quantity: 0,
      threshold: 10
    }],
    models: [{
      name: '',
      description: '',
      colors: [{
        name: 'DEFAULT', // Default for variable products
        price: 0,
        original_price: 0,
        stock_quantity: 0,
        threshold: 10
      }],
      specifications: []
    }],
    specifications: []
  });

  const [newImages, setNewImages] = useState([]);
  const [activeTab, setActiveTab] = useState('products');
  const [specsToDelete, setSpecsToDelete] = useState([]);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('name_asc');
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_SERVER_API}/products`),
          axios.get(`${import.meta.env.VITE_SERVER_API}/categories`)
        ]);

        setProducts(productsRes.data);
        console.log('Products:', productsRes.data);
        setFilteredProducts(productsRes.data);
        setCategories(categoriesRes.data);
        setIsLoading(false);
      } catch (err) {
        console.error('Fetch error:', err);
        setError(err.message);
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Apply filters
  useEffect(() => {
    let result = [...products];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(product =>
        product.name.toLowerCase().includes(term) ||
        product.description.toLowerCase().includes(term)
      );
    }

    if (categoryFilter !== 'all') {
      result = result.filter(product => {
        const selectedCategory = categories.find(
          cat => cat.category_id.toString() === categoryFilter.toString()
        );
        return product.category === selectedCategory?.name;
      });
    }

    switch (sortOption) {
      case 'name_asc':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name_desc':
        result.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'price_asc':
        result.sort((a, b) => {
          const aPrice = a.product_type === 'single'
            ? (a.colors[0]?.price || 0)
            : (a.models[0]?.colors[0]?.price || 0);
          const bPrice = b.product_type === 'single'
            ? (b.colors[0]?.price || 0)
            : (b.models[0]?.colors[0]?.price || 0);
          return aPrice - bPrice;
        });
        break;
      case 'price_desc':
        result.sort((a, b) => {
          const aPrice = a.product_type === 'single'
            ? (a.colors[0]?.price || 0)
            : (a.models[0]?.colors[0]?.price || 0);
          const bPrice = b.product_type === 'single'
            ? (b.colors[0]?.price || 0)
            : (b.models[0]?.colors[0]?.price || 0);
          return bPrice - aPrice;
        });
        break;
      default:
        break;
    }

    setFilteredProducts(result);
  }, [searchTerm, sortOption, categoryFilter, products]);

  // Validate form before submission
  const validateForm = () => {
    const errors = {};

    // Basic product info validation
    if (!formData.name.trim()) errors.name = 'Product name is required';
    if (!formData.description.trim()) errors.description = 'Description is required';
    if (!formData.category_id) errors.category_id = 'Category is required';

    // Image validation
    if (formData.images.length === 0 && newImages.length === 0) {
      errors.images = 'At least one product image is required';
    }

    // Validate specifications for single products
    if (formData.product_type === 'single') {
      formData.specifications.forEach((spec, index) => {
        if (!spec.key.trim()) errors[`spec_key_${index}`] = 'Specification name is required';
        if (!spec.value.trim()) errors[`spec_value_${index}`] = 'Specification value is required';
      });
    }

    // Validate colors for single products
    if (formData.product_type === 'single') {
      if (formData.colors.length === 0) {
        errors.colors = 'At least one color variant is required';
      } else {
        formData.colors.forEach((color, colorIndex) => {
          // if (!color.name.trim()) errors[`color_name_${colorIndex}`] = 'Color name is required';
          if (color.price <= 0) errors[`color_price_${colorIndex}`] = 'Price must be greater than 0';
          if (color.stock_quantity < 0) errors[`color_stock_${colorIndex}`] = 'Stock cannot be negative';
          if (color.threshold < 0) errors[`color_threshold_${colorIndex}`] = 'Threshold cannot be negative';

          // Validate color images
          // if ((color.images?.length || 0) === 0 && (color.newImages?.length || 0) === 0) {
          //   errors[`color_images_${colorIndex}`] = 'At least one color image is required';
          // }
        });
      }
    }

    // Validate models and their colors for variable products
    if (formData.product_type === 'variable') {
      if (formData.models.length === 0) {
        errors.models = 'At least one model is required';
      } else {
        formData.models.forEach((model, modelIndex) => {
          if (!model.name.trim()) errors[`model_name_${modelIndex}`] = 'Model name is required';

          // Validate model specifications
          (model.specifications || []).forEach((spec, specIndex) => {
            if (!spec.key.trim()) errors[`model_${modelIndex}_spec_key_${specIndex}`] = 'Specification name is required';
            if (!spec.value.trim()) errors[`model_${modelIndex}_spec_value_${specIndex}`] = 'Specification value is required';
          });

          // Validate model colors
          if (model.colors.length === 0) {
            errors[`model_${modelIndex}_colors`] = 'At least one color variant is required';
          } else {
            model.colors.forEach((color, colorIndex) => {
              // if (!color.name.trim()) errors[`model_${modelIndex}_color_name_${colorIndex}`] = 'Color name is required';
              if (color.price <= 0) errors[`model_${modelIndex}_color_price_${colorIndex}`] = 'Price must be greater than 0';
              if (color.stock_quantity < 0) errors[`model_${modelIndex}_color_stock_${colorIndex}`] = 'Stock cannot be negative';
              if (color.threshold < 0) errors[`model_${modelIndex}_color_threshold_${colorIndex}`] = 'Threshold cannot be negative';

              // Validate color images
              // if ((color.images?.length || 0) === 0 && (color.newImages?.length || 0) === 0) {
              //   errors[`model_${modelIndex}_color_images_${colorIndex}`] = 'At least one color image is required';
              // }
            });
          }
        });
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };


  const getImageUrl = (imagePath) => {
    if (!imagePath) return '';

    if (imagePath.startsWith('http')) {
      return imagePath;
    }

    if (imagePath.startsWith('/')) {
      return `${import.meta.env.VITE_SERVER_API}${imagePath}`;
    }

    return `${import.meta.env.VITE_SERVER_API}/static/${imagePath}`;
  };


  // Scroll to first error field
  const scrollToFirstError = () => {
    if (formRef.current) {
      const firstErrorElement = formRef.current.querySelector('.error-field');
      if (firstErrorElement) {
        firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        firstErrorElement.focus();
      }
    }
  };

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
    const matchedCategory = categories.find(c => c.name === product.category);
    const matchedSubcategory = matchedCategory?.subcategories?.find(sc => sc.name === product.subcategory);

    // Find the first image (cover image) - smallest image_id
    const firstImage = product.images?.length > 0
      ? [...product.images].sort((a, b) => a.image_id - b.image_id)[0]
      : null;

    setEditingProduct({
      ...product,
      category_id: matchedCategory?.category_id || '',
      subcategory_id: matchedSubcategory?.subcategory_id || ''
    });

    setFormData({
      name: product.name,
      description: product.description,
      product_type: product.product_type,
      category_id: matchedCategory?.category_id || '',
      subcategory_id: matchedSubcategory?.subcategory_id || '',
      hsn: product.hsn || '',
      images: product.images || [],
      colors: product.colors || [],
      models: product.models || [],
      specifications: product.specifications?.map(spec => ({
        key: spec.key,
        value: spec.value,
        spec_id: spec.spec_id || spec.id
      })) || []
    });

    // Set cover image state
    setCoverImage(firstImage);
    setNewCoverImage(null);
    setNewImages([]);
    setSpecsToDelete([]);
    setRemovedModelIds([]);
    setRemovedSpecIds([]);
    setValidationErrors({});
  };

  const handleCoverImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setNewCoverImage(file);
    setValidationErrors(prev => ({ ...prev, coverImage: undefined }));

    // If we're not editing, just preview the new image
    if (!editingProduct) return;

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await axios.post(
        `${import.meta.env.VITE_SERVER_API}/${editingProduct.product_id}/cover-image`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      // Update the cover image in state
      setCoverImage({
        ...coverImage,
        image_url: response.data.image_url
      });

      // Also update the product images array if the cover image exists there
      setFormData(prev => ({
        ...prev,
        images: prev.images.map(img =>
          img.image_id === response.data.image_id
            ? { ...img, image_url: response.data.image_url }
            : img
        )
      }));

      setNewCoverImage(null);
    } catch (err) {
      console.error('Error updating cover image:', err);
      setError(err.response?.data?.error || 'Failed to update cover image');
    }
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
      models: [],
      specifications: []
    });
    setNewImages([]);
    setSpecsToDelete([]);
    setValidationErrors({});
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Submit started');
    setValidationErrors({});
    console.log('Form data before validation:', formData);

    if (!validateForm()) {
      console.log('Validation failed', validationErrors);
      scrollToFirstError();
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 1. First handle cover image if it's new
      if (newCoverImage && editingProduct) {
        await handleCoverImageChange({ target: { files: [newCoverImage] } });
      }

      // 2. Update basic product information
      const productData = {
        name: formData.name,
        description: formData.description,
        product_type: formData.product_type,
        category_id: formData.category_id,
        subcategory_id: formData.subcategory_id,
        hsn: formData.hsn
      };

      await axios.put(
        `${import.meta.env.VITE_SERVER_API}/${editingProduct.product_id}`,
        productData,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      // 3. Handle deleted models
      if (removedModelIds.length > 0) {
        await Promise.all(
          removedModelIds.map(async (modelId) => {
            try {
              await axios.delete(
                `${import.meta.env.VITE_SERVER_API}/${editingProduct.product_id}/models/${modelId}`,
                {
                  headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                  }
                }
              );
            } catch (err) {
              console.error(`Failed to delete model ${modelId}`, err);
            }
          })
        );
      }

      // 4. Handle product images
      const uploadedImages = await Promise.all(
        newImages.map(async (file) => {
          try {
            return await uploadImage(file);
          } catch (err) {
            console.error('Error uploading image:', err);
            return null;
          }
        })
      ).then(results => results.filter(url => url !== null));

      // 5. Handle colors (for single products)
      if (formData.product_type === 'single') {
        await Promise.all(formData.colors.map(async (color, colorIndex) => {
          const colorEndpoint = color.color_id
            ? `${import.meta.env.VITE_SERVER_API}/${editingProduct.product_id}/colors/${color.color_id}`
            : `${import.meta.env.VITE_SERVER_API}/${editingProduct.product_id}/colors`;

          const method = color.color_id ? 'PUT' : 'POST';

          const colorData = {
            name: color.name,
            price: color.price,
            original_price: color.original_price,
            stock_quantity: color.stock_quantity,
            threshold: color.threshold
          };

          const colorResponse = await axios({
            method,
            url: colorEndpoint,
            data: colorData,
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });

          const colorId = colorResponse.data.color_id || color.color_id;

          // Handle color images
          if (color.newImages && color.newImages.length > 0) {
            await Promise.all(color.newImages.map(async file => {
              const formData = new FormData();
              formData.append('image', file);
              formData.append('color_id', colorId);

              await axios.post(
                `${import.meta.env.VITE_SERVER_API}/${editingProduct.product_id}/images`,
                formData,
                {
                  headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                  }
                }
              );
            }));
          }
        }));
      }

      // 6. Handle variable products
      if (formData.product_type === 'variable') {
        await Promise.all(formData.models.map(async (model, modelIndex) => {
          const modelEndpoint = model.model_id
            ? `${import.meta.env.VITE_SERVER_API}/${editingProduct.product_id}/models/${model.model_id}`
            : `${import.meta.env.VITE_SERVER_API}/${editingProduct.product_id}/models`;

          const method = model.model_id ? 'PUT' : 'POST';

          const modelResponse = await axios({
            method,
            url: modelEndpoint,
            data: {
              name: model.name,
              description: model.description
            },
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });

          const modelId = modelResponse.data.model_id || model.model_id;

          // Handle model colors
          if (model.colors) {
            await Promise.all(model.colors.map(async (color, colorIndex) => {
              const colorEndpoint = color.color_id
                ? `${import.meta.env.VITE_SERVER_API}/${editingProduct.product_id}/colors/${color.color_id}`
                : `${import.meta.env.VITE_SERVER_API}/${editingProduct.product_id}/colors`;

              const method = color.color_id ? 'PUT' : 'POST';

              const colorData = {
                name: color.name,
                price: color.price,
                original_price: color.original_price,
                stock_quantity: color.stock_quantity,
                threshold: color.threshold,
                model_id: modelId
              };

              const colorResponse = await axios({
                method,
                url: colorEndpoint,
                data: colorData,
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
              });

              const colorId = colorResponse.data.color_id || color.color_id;

              // Handle color images
              if (color.newImages && color.newImages.length > 0) {
                const filesToUpload = [...color.newImages];

                setFormData(prev => {
                  const updatedModels = [...prev.models];
                  updatedModels[modelIndex].colors[colorIndex].newImages = [];
                  return {
                    ...prev,
                    models: updatedModels
                  };
                });

                await Promise.all(filesToUpload.map(async file => {
                  const formData = new FormData();
                  formData.append('image', file);
                  formData.append('color_id', colorId);

                  await axios.post(
                    `${import.meta.env.VITE_SERVER_API}/${editingProduct.product_id}/images`,
                    formData,
                    {
                      headers: {
                        'Content-Type': 'multipart/form-data',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                      }
                    }
                  );
                }));
              }
            }));
          }
        }));
      }

      // Refresh data after all updates
      const res = await axios.get(`${import.meta.env.VITE_SERVER_API}/products`);
      setProducts(res.data);
      setFilteredProducts(res.data);
      cancelEdit();

    } catch (err) {
      console.error('Save error:', err);
      setError(err.response?.data?.error || err.message || 'Failed to save product');
    } finally {
      setIsLoading(false);
    }
  };

  // Separate image upload function
  const uploadImage = async (file, colorId = null) => {
    const formData = new FormData();
    formData.append('image', file);
    if (colorId) formData.append('color_id', colorId);

    try {
      console.log('Uploading image...', file.name); // Debug log
      const response = await axios.post(
        `${import.meta.env.VITE_SERVER_API}/${editingProduct.product_id}/images`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      console.log('Upload successful:', response.data); // Debug log
      return response.data.image_url;
    } catch (err) {
      console.error('Detailed upload error:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      throw err;
    }
  };

  // Add specification to a model
  const addSpecification = (modelIndex) => {
    setFormData(prev => {
      const updatedModels = [...prev.models];
      if (!updatedModels[modelIndex].specifications) {
        updatedModels[modelIndex].specifications = [];
      }
      updatedModels[modelIndex].specifications = [
        ...updatedModels[modelIndex].specifications,
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
      if (!updatedModels[modelIndex].specifications) {
        updatedModels[modelIndex].specifications = [];
      }
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

  // Remove specification (marks for deletion if it has an ID)
  const removeSpecification = (modelIndex, specIndex) => {
    setFormData(prev => {
      const updatedModels = [...prev.models];

      if (!updatedModels[modelIndex].specifications) {
        return prev;
      }

      const specToRemove = updatedModels[modelIndex].specifications[specIndex];

      if (specToRemove?.spec_id) {
        setSpecsToDelete(prev => [...prev, specToRemove.spec_id]);
      }

      updatedModels[modelIndex].specifications.splice(specIndex, 1);

      return {
        ...prev,
        models: updatedModels
      };
    });
  };

  // Handle file uploads for product images
  const handleProductImageChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;




    try {
      setNewImages(prev => [...prev, ...files]);
      setValidationErrors(prev => ({ ...prev, images: undefined }));
    } catch (err) {
      console.error('Error uploading images:', err);
      setError(err.response?.data?.message || 'Failed to upload images');
    }
  };

  // Remove existing product image
  const removeProductImage = async (imageId) => {
    try {
      await axios.delete(
        `${import.meta.env.VITE_SERVER_API}/${editingProduct.product_id}/images/${imageId}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      setFormData(prev => ({
        ...prev,
        images: prev.images.filter(img => img.image_id !== imageId)
      }));
    } catch (err) {
      console.error('Error deleting image:', err);
      setError(err.response?.data?.message || err.message);
    }
  };

  // Handle file uploads for color images
  const handleColorImageChange = async (colorIndex, e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setIsLoading(true);
    setError(null);

    try {
      const color = formData.colors[colorIndex];

      // If color doesn't have an ID yet, we need to save it first
      if (!color.color_id) {
        const colorResponse = await axios.post(
          `${import.meta.env.VITE_SERVER_API}/${editingProduct.product_id}/colors`,
          {
            name: color.name,
            price: color.price,
            original_price: color.original_price,
            stock_quantity: color.stock_quantity,
            threshold: color.threshold
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }
        );

        const colorId = colorResponse.data.color_id;

        setFormData(prev => {
          const updatedColors = [...prev.colors];
          updatedColors[colorIndex] = {
            ...updatedColors[colorIndex],
            color_id: colorId,
            newImages: [...(updatedColors[colorIndex].newImages || []), ...files]
          };
          return {
            ...prev,
            colors: updatedColors
          };
        });
      } else {
        setFormData(prev => {
          const updatedColors = [...prev.colors];
          updatedColors[colorIndex] = {
            ...updatedColors[colorIndex],
            newImages: [...(updatedColors[colorIndex].newImages || []), ...files]
          };
          return {
            ...prev,
            colors: updatedColors
          };
        });
      }

      setValidationErrors(prev => ({ ...prev, [`color_images_${colorIndex}`]: undefined }));
    } catch (err) {
      console.error('Error handling color images:', err);
      setError(err.response?.data?.message || 'Failed to handle color images');
    } finally {
      setIsLoading(false);
    }
  };

  // Remove existing color image
  const removeColorImage = async (colorIndex, imageId) => {
    try {
      await axios.delete(
        `${import.meta.env.VITE_SERVER_API}/${editingProduct.product_id}/images/${imageId}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

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

  const handleModelColorImageChange = async (modelIndex, colorIndex, e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setFormData(prev => {
      const updatedModels = [...prev.models];
      if (!updatedModels[modelIndex].colors[colorIndex].newImages) {
        updatedModels[modelIndex].colors[colorIndex].newImages = [];
      }
      updatedModels[modelIndex].colors[colorIndex] = {
        ...updatedModels[modelIndex].colors[colorIndex],
        newImages: files // Replace existing newImages instead of appending
      };
      return {
        ...prev,
        models: updatedModels
      };
    });

    setValidationErrors(prev => ({
      ...prev,
      [`model_${modelIndex}_color_images_${colorIndex}`]: undefined
    }));
  };

  // Remove existing model color image
  const removeModelColorImage = async (modelIndex, colorIndex, imageId) => {
    try {
      await axios.delete(
        `${import.meta.env.VITE_SERVER_API}/${editingProduct.product_id}/images/${imageId}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

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
      console.error('Error deleting model color image:', err);
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
        [field]: field === 'price' || field === 'original_price' ||
          field === 'stock_quantity' || field === 'threshold'
          ? Number(value)
          : value
      };
      return {
        ...prev,
        colors: updatedColors
      };
    });

    // Clear validation error for this field
    setValidationErrors(prev => ({ ...prev, [`color_${field}_${index}`]: undefined }));
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

    // Clear validation error for this field
    setValidationErrors(prev => ({ ...prev, [`model_${field}_${modelIndex}`]: undefined }));
  };

  // Remove a model
  const removeModel = (modelIndex) => {
    if (formData.models.length <= 1) {
      setError("A variable product must have at least one model");
      return;
    }

    setFormData(prev => {
      const updatedModels = [...prev.models];
      const removedModel = updatedModels.splice(modelIndex, 1)[0];

      if (removedModel.model_id) {
        setRemovedModelIds(prevIds => [...prevIds, removedModel.model_id]);
      }

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

    // Clear validation error for this field
    setValidationErrors(prev => ({
      ...prev,
      [`model_${modelIndex}_color_${field}_${colorIndex}`]: undefined
    }));
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

  // Add product specification
  const addProductSpecification = () => {
    setFormData(prev => ({
      ...prev,
      specifications: [...prev.specifications, { key: '', value: '' }]
    }));
  };

  // Update product specification
  const updateProductSpecification = (specIndex, field, value) => {
    setFormData(prev => {
      const updatedSpecs = [...prev.specifications];
      updatedSpecs[specIndex] = {
        ...updatedSpecs[specIndex],
        [field]: value
      };
      return {
        ...prev,
        specifications: updatedSpecs
      };
    });

    // Clear validation error for this field
    setValidationErrors(prev => ({
      ...prev,
      [`spec_${field}_${specIndex}`]: undefined
    }));
  };

  // Remove product specification
  const removeProductSpecification = (specIndex) => {
    setFormData(prev => {
      const specToRemove = prev.specifications[specIndex];

      if (specToRemove?.spec_id) {
        setSpecsToDelete(prev => [...prev, specToRemove.spec_id]);
      }

      return {
        ...prev,
        specifications: prev.specifications.filter((_, i) => i !== specIndex)
      };
    });
  };

  // Save product specifications
  const saveProductSpecifications = async () => {
    if (!editingProduct) return;

    setIsLoading(true);
    setError(null);

    try {
      // 1. First delete any specs marked for deletion
      if (specsToDelete.length > 0) {
        await Promise.all(
          specsToDelete.map(specId => {
            if (!specId) return Promise.resolve();
            return axios.delete(
              `${import.meta.env.VITE_SERVER_API}/${editingProduct.product_id}/specifications/${specId}`,
              { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }
            );
          })
        );
      }

      // 2. Process remaining specs (create/update)
      const validSpecs = formData.specifications.filter(
        spec => spec.key?.trim() && spec.value?.trim()
      );

      const results = await Promise.all(
        validSpecs.map(async (spec) => {
          const specData = {
            key: spec.key.trim(),
            value: spec.value.trim(),
            product_id: editingProduct.product_id
          };

          if (spec.spec_id) {
            // Update existing spec
            const response = await axios.put(
              `${import.meta.env.VITE_SERVER_API}/${editingProduct.product_id}/specifications/${spec.spec_id}`,
              specData,
              { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }
            );
            return response.data;
          } else {
            // Create new spec
            const response = await axios.post(
              `${import.meta.env.VITE_SERVER_API}/${editingProduct.product_id}/specifications`,
              specData,
              { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }
            );
            return response.data;
          }
        })
      );

      // 3. Update state with new spec IDs
      setFormData(prev => ({
        ...prev,
        specifications: validSpecs.map((spec, idx) => ({
          ...spec,
          spec_id: results[idx]?.spec_id || spec.spec_id
        }))
      }));

      // 4. Clear deletion queue
      setSpecsToDelete([]);
      alert('Specifications saved successfully!');
    } catch (err) {
      console.error('Error saving specifications:', err);
      setError(err.response?.data?.error || err.message || 'Failed to save specifications');
    } finally {
      setIsLoading(false);
    }
  };

  // Save model specifications
  const saveModelSpecifications = async (modelIndex) => {
    if (!editingProduct) return;

    const model = formData.models[modelIndex];
    if (!model || !model.model_id) {
      setError("Model must be saved before adding specifications");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // First delete any specs marked for deletion
      await Promise.all(
        specsToDelete
          .filter(specId => specId)
          .map(async specId => {
            try {
              await axios.delete(
                `${import.meta.env.VITE_SERVER_API}/${editingProduct.product_id}/models/${model.model_id}/specifications/${specId}`,
                {
                  headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                  }
                }
              );
            } catch (err) {
              console.error(`Failed to delete spec ${specId}:`, err);
              throw err;
            }
          })
      );

      // Then handle updates and new specs
      const results = await Promise.all(
        (model.specifications || []).map(async (spec) => {
          if (!spec?.key && !spec?.value) return null;

          const specData = {
            key: spec.key || '',
            value: spec.value || '',
            model_id: model.model_id
          };

          try {
            if (spec?.spec_id) {
              // Update existing spec
              const response = await axios.put(
                `${import.meta.env.VITE_SERVER_API}/${editingProduct.product_id}/models/${model.model_id}/specifications/${spec.spec_id}`,
                specData,
                {
                  headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                  }
                }
              );
              return response.data;
            } else {
              // Add new spec
              const response = await axios.post(
                `${import.meta.env.VITE_SERVER_API}/${editingProduct.product_id}/models/${model.model_id}/specifications`,
                specData,
                {
                  headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                  }
                }
              );
              return response.data;
            }
          } catch (err) {
            console.error('Error saving specification:', err);
            throw err;
          }
        })
      );

      // Filter out null results from empty specs
      const validResults = results.filter(result => result !== null);

      // Update the form data with the new spec IDs
      setFormData(prev => {
        const updatedModels = [...prev.models];
        const updatedSpecs = (updatedModels[modelIndex].specifications || [])
          .map((spec, idx) => ({
            ...spec,
            spec_id: validResults[idx]?.spec_id || spec.spec_id
          }))
          .filter(spec => spec.key || spec.value);

        updatedModels[modelIndex].specifications = updatedSpecs;

        return {
          ...prev,
          models: updatedModels
        };
      });

      setSpecsToDelete([]);
      setError(null);
      alert('Specifications saved successfully!');
    } catch (err) {
      console.error('Error saving specifications:', err);
      setError(err.response?.data?.error || err.message || 'Failed to save specifications');
    } finally {
      setIsLoading(false);
    }
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
          onClick={() => navigate('/addproducts')}
        >
          + Add New Product
        </button>
      </div>

      <div className="product-filters">
        <div className="filter-group">
          <label htmlFor="search">Search:</label>
          <input
            type="text"
            id="search"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label htmlFor="sort">Sort By:</label>
          <select
            id="sort"
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
          >
            <option value="name_asc">Name (A-Z)</option>
            <option value="name_desc">Name (Z-A)</option>
            <option value="price_asc">Price (Low to High)</option>
            <option value="price_desc">Price (High to Low)</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="category">Category:</label>
          <select
            id="category"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="all">All Categories</option>
            {categories.map(category => (
              <option key={category.category_id} value={category.category_id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        // <div className="loading">Loading products...</div>
        <Loader/>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : (
        <div className="product-grid">
          {filteredProducts.length > 0 ? (
            filteredProducts.map(product => (
              <div key={product.product_id} className="product-card">
                <div className="product-images">
                  {product.images.slice(0, 1).map(img => (
                    img.image_url.endsWith('.mp4') || img.image_url.endsWith('.webm') ? (
                      <video
                        key={img.image_id}
                        src={
                          img.image_url.startsWith('http')
                            ? img.image_url
                            : img.image_url.startsWith('/')
                              ? `${import.meta.env.VITE_SERVER_API}${img.image_url}`
                              : `${import.meta.env.VITE_SERVER_API}/static/${img.image_url}`
                        }
                        autoPlay
                        muted
                        loop
                        playsInline
                      />
                    ) : (
                      <img
                        key={img.image_id}
                        src={
                          img.image_url.startsWith('http')
                            ? img.image_url
                            : img.image_url.startsWith('/')
                              ? `${import.meta.env.VITE_SERVER_API}${img.image_url}`
                              : `${import.meta.env.VITE_SERVER_API}/static/${img.image_url}`
                        }
                        alt={product.name}
                      />
                    )
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
            ))
          ) : (
            <div className="no-products">No products found matching your criteria</div>
          )}
        </div>
      )}
    </div>
  );

  // Render product form
  const renderProductForm = () => (
    <div className="product-form-container">
      <div className="form-header">
        <button
          className="btn-back"
          onClick={cancelEdit}
        >
          &larr; Back to Products
        </button>
        <h2>Edit Product</h2>
      </div>

      <form onSubmit={handleSubmit} className="product-form" ref={formRef}>
        <div className={`form-group ${validationErrors.name ? 'error-field' : ''}`}>
          <label>Product Name:</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="Enter product name"
            required
          />
          {validationErrors.name && (
            <span className="error-message">{validationErrors.name}</span>
          )}
        </div>

        <div className={`form-group ${validationErrors.description ? 'error-field' : ''}`}>
          <label>Description:</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Enter detailed product description"
            required
          />
          {validationErrors.description && (
            <span className="error-message">{validationErrors.description}</span>
          )}
        </div>

        <div className="form-group">
          <label>Category:</label>
          <p>
            {
              (() => {
                const matchedCategory = categories.find(c => c.category_id == editingProduct?.category_id);
                return matchedCategory?.name || 'No category';
              })()
            }
          </p>
          <input type="hidden" name="category_id" value={editingProduct?.category_id || ''} />
        </div>

        <div className="form-group">
          <label>Subcategory:</label>
          <p>
            {
              categories
                .flatMap(c => c.subcategories)
                .find(s => s.subcategory_id == formData.subcategory_id)?.name
              || 'No subcategory'
            }
          </p>
          <input type="hidden" name="subcategory_id" value={formData.subcategory_id || ''} />
        </div>

        <div className="form-group">
          <label>HSN Code:</label>
          <p>{editingProduct?.hsn || 'No HSN code'}</p>
        </div>

        <div className="form-group">
          <label>Product Type:</label>
          <select
            name="product_type"
            value={formData.product_type}
            onChange={handleInputChange}
            disabled={editingProduct !== null}
          >
            <option value="single">Single Product</option>
            <option value="variable">Variable Product (with models)</option>
          </select>
          {editingProduct && (
            <p className="form-note">Product type cannot be changed after creation</p>
          )}
        </div>

        <div className={`form-group ${validationErrors.images ? 'error-field' : ''}`}>
          <label>Product Images:</label>
          <input
            type="file"
            multiple
            onChange={handleProductImageChange}
            // accept="image/*"
            accept="image/*,video/*"
            className="file-input"
          />
          {validationErrors.images && (
            <span className="error-message">{validationErrors.images}</span>
          )}
          <div className="media-preview-container">
            <h4>Existing Media</h4>
            <div className="media-preview">
              {formData.images.map((media, index) => (
                <div key={index} className="media-thumbnail">
                  {media.image_url.endsWith('.mp4') || media.image_url.endsWith('.webm') ? (
                    <video
                      src={getImageUrl(media.image_url)}
                      muted
                      loop
                      playsInline
                    />
                  ) : (
                    <img
                      src={getImageUrl(media.image_url)}
                      alt={`Product ${index}`}
                    />
                  )}
                  <button
                    type="button"
                    className="btn-remove-media"
                    onClick={() => removeProductImage(media.image_id)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            <h4>New Media to Upload</h4>
            <div className="media-preview">
              {newImages.map((file, index) => (
                <div key={`new-${index}`} className="media-thumbnail">
                  {file.type.startsWith('video/') ? (
                    <video
                      src={URL.createObjectURL(file)}
                      muted
                      loop
                      playsInline
                    />
                  ) : (
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`New media ${index}`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Cover Image Section */}
        <div className="form-group">
          <label>Cover Image (Main Display Image)</label>
          {coverImage && (
            <div className="cover-image-preview">
              {coverImage.image_url.endsWith('.mp4') || coverImage.image_url.endsWith('.webm') ? (
                <video
                  src={
                    coverImage.image_url.startsWith('http')
                      ? coverImage.image_url
                      : coverImage.image_url.startsWith('/')
                        ? `${import.meta.env.VITE_SERVER_API}${coverImage.image_url}`
                        : `${import.meta.env.VITE_SERVER_API}/static/${coverImage.image_url}`
                  }
                  muted
                  loop
                  playsInline
                />
              ) : (
                <img
                  src={
                    coverImage.image_url.startsWith('http')
                      ? coverImage.image_url
                      : coverImage.image_url.startsWith('/')
                        ? `${import.meta.env.VITE_SERVER_API}${coverImage.image_url}`
                        : `${import.meta.env.VITE_SERVER_API}/static/${coverImage.image_url}`
                  }
                  alt="Cover"
                />
              )}
              <div className="cover-image-actions">
                <input
                  type="file"
                  id="cover-image-upload"
                  onChange={handleCoverImageChange}
                  accept="image/*,video/*"
                  className="file-input"
                />
                <label htmlFor="cover-image-upload" className="btn-update-cover">
                  Update Cover Image
                </label>
              </div>
            </div>
          )}
          {newCoverImage && (
            <div className="new-cover-preview">
              <h4>New Cover Image to Upload</h4>
              {newCoverImage.type.startsWith('video/') ? (
                <video
                  src={URL.createObjectURL(newCoverImage)}
                  muted
                  loop
                  playsInline
                />
              ) : (
                <img
                  src={URL.createObjectURL(newCoverImage)}
                  alt="New Cover"
                />
              )}
            </div>
          )}
        </div>


        {formData.product_type === 'single' && (
          <div className="form-group">
            <div className="spec-header">
              <h3>Specifications</h3>
            </div>

            {formData.specifications?.map((spec, specIndex) => (
              <div key={spec.spec_id || `new-spec-${specIndex}`} className={`specification-item ${validationErrors[`spec_key_${specIndex}`] || validationErrors[`spec_value_${specIndex}`] ? 'error-field' : ''}`}>
                <div className="spec-input-group">
                  <input
                    type="text"
                    placeholder="Spec name (e.g., Material)"
                    value={spec.key}
                    onChange={(e) => updateProductSpecification(specIndex, 'key', e.target.value)}
                    className="spec-input"
                  />
                  {validationErrors[`spec_key_${specIndex}`] && (
                    <span className="error-message">{validationErrors[`spec_key_${specIndex}`]}</span>
                  )}
                </div>
                <div className="spec-input-group">
                  <input
                    type="text"
                    placeholder="Spec value (e.g., Cotton)"
                    value={spec.value}
                    onChange={(e) => updateProductSpecification(specIndex, 'value', e.target.value)}
                    className="spec-input"
                  />
                  {validationErrors[`spec_value_${specIndex}`] && (
                    <span className="error-message">{validationErrors[`spec_value_${specIndex}`]}</span>
                  )}
                </div>
                <button
                  type="button"
                  className="btn-remove-spec"
                  onClick={() => removeProductSpecification(specIndex)}
                  title="Remove specification"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z" />
                  </svg>
                </button>
              </div>
            ))}

            <div className="spec-actions">
              <button
                type="button"
                className="btn-add-spec"
                onClick={addProductSpecification}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" style={{ marginRight: '8px' }}>
                  <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z" />
                </svg>
                Add Specification
              </button>
              <button
                type="button"
                className="btn-save-specs"
                onClick={saveProductSpecifications}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <svg className="spinner" viewBox="0 0 50 50" style={{ marginRight: '8px' }}>
                      <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="5"></circle>
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" style={{ marginRight: '8px' }}>
                      <path d="M2 1a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H9.5a1 1 0 0 0-1 1v7.293l2.646-2.647a.5.5 0 0 1 .708.708l-3.5 3.5a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L7.5 9.293V2a2 2 0 0 1 2-2H14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h2.5a.5.5 0 0 1 0 1H2z" />
                    </svg>
                    Save Specifications
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {formData.product_type === 'single' && (
          <div className="form-group">
            <h3>Product Variant</h3>
            {formData.colors.map((color, colorIndex) => (
              <div key={colorIndex} className="product-variant">
                <div className="variant-details-grid">
                  <div className="form-field">
                    <label>Variant Name</label>
                    <input
                      type="text"
                      value="DEFAULT"
                      readOnly
                      className="read-only-input"
                    />
                  </div>

                  <div className={`form-field ${validationErrors[`color_price_${colorIndex}`] ? 'error-field' : ''}`}>
                    <label>Current Price *</label>
                    <input
                      type="number"
                      placeholder="Selling price"
                      value={color.price}
                      onChange={(e) => updateColor(colorIndex, 'price', e.target.value)}
                      min="0"
                      step="0.01"
                      required
                    />
                    {validationErrors[`color_price_${colorIndex}`] && (
                      <span className="error-message">{validationErrors[`color_price_${colorIndex}`]}</span>
                    )}
                  </div>

                  <div className={`form-field ${validationErrors[`color_original_price_${colorIndex}`] ? 'error-field' : ''}`}>
                    <label>Original Price</label>
                    <input
                      type="number"
                      placeholder="Original price (optional)"
                      value={color.original_price || ''}
                      onChange={(e) => updateColor(colorIndex, 'original_price', e.target.value)}
                      min="0"
                      step="0.01"
                    />
                    {validationErrors[`color_original_price_${colorIndex}`] && (
                      <span className="error-message">{validationErrors[`color_original_price_${colorIndex}`]}</span>
                    )}
                  </div>

                  <div className={`form-field ${validationErrors[`color_stock_${colorIndex}`] ? 'error-field' : ''}`}>
                    <label>Stock Quantity *</label>
                    <input
                      type="number"
                      placeholder="Available quantity"
                      value={color.stock_quantity}
                      onChange={(e) => updateColor(colorIndex, 'stock_quantity', e.target.value)}
                      min="0"
                      required
                    />
                    {validationErrors[`color_stock_${colorIndex}`] && (
                      <span className="error-message">{validationErrors[`color_stock_${colorIndex}`]}</span>
                    )}
                  </div>

                  <div className={`form-field ${validationErrors[`color_threshold_${colorIndex}`] ? 'error-field' : ''}`}>
                    <label>Low Stock Threshold *</label>
                    <input
                      type="number"
                      placeholder="Alert when stock reaches"
                      value={color.threshold}
                      onChange={(e) => updateColor(colorIndex, 'threshold', e.target.value)}
                      min="0"
                      required
                    />
                    {validationErrors[`color_threshold_${colorIndex}`] && (
                      <span className="error-message">{validationErrors[`color_threshold_${colorIndex}`]}</span>
                    )}
                  </div>
                </div>

                {/* <div className={`color-images ${validationErrors[`color_images_${colorIndex}`] ? 'error-field' : ''}`}>
                  <label>Color Images:</label>
                  <input
                    type="file"
                    multiple
                    onChange={(e) => handleColorImageChange(colorIndex, e)}
                    accept="image/*"
                    className="file-input"
                  />
                  {validationErrors[`color_images_${colorIndex}`] && (
                    <span className="error-message">{validationErrors[`color_images_${colorIndex}`]}</span>
                  )}
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
                </div> */}

                {/* <button
                  type="button"
                  className="btn-remove"
                  onClick={() => removeColor(colorIndex)}
                >
                  Remove Color Variant
                </button> */}
              </div>
            ))}
            {/* <button
              type="button"
              className="btn-add"
              onClick={addColor}
            >
              + Add Color Variant
            </button> */}
          </div>
        )}

        {formData.product_type === 'variable' && (
          <div className="form-group">
            <h3>Models</h3>
            {validationErrors.models && (
              <span className="error-message">{validationErrors.models}</span>
            )}
            {formData.models.map((model, modelIndex) => (
              <div key={modelIndex} className="product-model">
                <h4>Model {modelIndex + 1}</h4>
                <div className={`model-details ${validationErrors[`model_name_${modelIndex}`] ? 'error-field' : ''}`}>
                  <div>
                    <input
                      type="text"
                      placeholder="Model name (e.g., Pro Version)"
                      value={model.name}
                      onChange={(e) => updateModel(modelIndex, 'name', e.target.value)}
                    />
                    {validationErrors[`model_name_${modelIndex}`] && (
                      <span className="error-message">{validationErrors[`model_name_${modelIndex}`]}</span>
                    )}
                  </div>
                  <textarea
                    placeholder="Model description"
                    value={model.description}
                    onChange={(e) => updateModel(modelIndex, 'description', e.target.value)}
                  />
                </div>

                <div className="model-specifications">
                  <div className="spec-header">
                    <h5>Specifications</h5>
                  </div>

                  {model.specifications?.map((spec, specIndex) => (
                    <div key={specIndex} className={`specification-item ${validationErrors[`model_${modelIndex}_spec_key_${specIndex}`] ||
                      validationErrors[`model_${modelIndex}_spec_value_${specIndex}`] ? 'error-field' : ''}`}>
                      <div className="spec-input-group">
                        <input
                          type="text"
                          placeholder="Spec name (e.g., Weight)"
                          value={spec.key}
                          onChange={(e) => updateSpecification(modelIndex, specIndex, 'key', e.target.value)}
                          className="spec-input"
                        />
                        {validationErrors[`model_${modelIndex}_spec_key_${specIndex}`] && (
                          <span className="error-message">{validationErrors[`model_${modelIndex}_spec_key_${specIndex}`]}</span>
                        )}
                      </div>
                      <div className="spec-input-group">
                        <input
                          type="text"
                          placeholder="Spec value (e.g., 1.2kg)"
                          value={spec.value}
                          onChange={(e) => updateSpecification(modelIndex, specIndex, 'value', e.target.value)}
                          className="spec-input"
                        />
                        {validationErrors[`model_${modelIndex}_spec_value_${specIndex}`] && (
                          <span className="error-message">{validationErrors[`model_${modelIndex}_spec_value_${specIndex}`]}</span>
                        )}
                      </div>
                      <button
                        type="button"
                        className="btn-remove-spec"
                        onClick={() => removeSpecification(modelIndex, specIndex)}
                        title="Remove specification"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                          <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z" />
                        </svg>
                      </button>
                    </div>
                  ))}

                  <div className="spec-actions">
                    <button
                      type="button"
                      className="btn-add-spec"
                      onClick={() => addSpecification(modelIndex)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" style={{ marginRight: '8px' }}>
                        <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z" />
                      </svg>
                      Add Specification
                    </button>
                    <button
                      type="button"
                      className="btn-save-specs"
                      onClick={() => saveModelSpecifications(modelIndex)}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <svg className="spinner" viewBox="0 0 50 50" style={{ marginRight: '8px' }}>
                            <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="5"></circle>
                          </svg>
                          Saving...
                        </>
                      ) : (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" style={{ marginRight: '8px' }}>
                            <path d="M2 1a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H9.5a1 1 0 0 0-1 1v7.293l2.646-2.647a.5.5 0 0 1 .708.708l-3.5 3.5a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L7.5 9.293V2a2 2 0 0 1 2-2H14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h2.5a.5.5 0 0 1 0 1H2z" />
                          </svg>
                          Save Specifications
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="model-colors">
                  <h5>Product Variant</h5>
                  {model.colors?.map((color, colorIndex) => (
                    <div key={colorIndex} className="product-variant">
                      <div className="variant-details">
                        <div className="form-field">
                          <label>Variant Name</label>
                          <input
                            type="text"
                            value="DEFAULT"
                            readOnly
                            className="read-only-input"
                          />
                        </div>
                        <div className={`form-field ${validationErrors[`model_${modelIndex}_color_price_${colorIndex}`] ? 'error-field' : ''}`}>
                          <label>Current Price *</label>
                          <input
                            type="number"
                            placeholder="Price"
                            value={color.price}
                            onChange={(e) => updateModelColor(modelIndex, colorIndex, 'price', e.target.value)}
                            min="0"
                            step="0.01"
                          />
                          {validationErrors[`model_${modelIndex}_color_price_${colorIndex}`] && (
                            <span className="error-message">{validationErrors[`model_${modelIndex}_color_price_${colorIndex}`]}</span>
                          )}
                        </div>
                        <div className={`form-field ${validationErrors[`model_${modelIndex}_color_original_price_${colorIndex}`] ? 'error-field' : ''}`}>
                          <label>Original Price</label>
                          <input
                            type="number"
                            placeholder="Original Price"
                            value={color.original_price || ''}
                            onChange={(e) => updateModelColor(modelIndex, colorIndex, 'original_price', e.target.value)}
                            min="0"
                            step="0.01"
                          />
                          {validationErrors[`model_${modelIndex}_color_original_price_${colorIndex}`] && (
                            <span className="error-message">{validationErrors[`model_${modelIndex}_color_original_price_${colorIndex}`]}</span>
                          )}
                        </div>
                        <div className={`form-field ${validationErrors[`model_${modelIndex}_color_stock_${colorIndex}`] ? 'error-field' : ''}`}>
                          <label>Stock Quantity *</label>
                          <input
                            type="number"
                            placeholder="Stock quantity"
                            value={color.stock_quantity}
                            onChange={(e) => updateModelColor(modelIndex, colorIndex, 'stock_quantity', e.target.value)}
                            min="0"
                          />
                          {validationErrors[`model_${modelIndex}_color_stock_${colorIndex}`] && (
                            <span className="error-message">{validationErrors[`model_${modelIndex}_color_stock_${colorIndex}`]}</span>
                          )}
                        </div>
                        <div className={`form-field ${validationErrors[`model_${modelIndex}_color_threshold_${colorIndex}`] ? 'error-field' : ''}`}>
                          <label>Low Stock Threshold *</label>
                          <input
                            type="number"
                            placeholder="Low stock threshold"
                            value={color.threshold}
                            onChange={(e) => updateModelColor(modelIndex, colorIndex, 'threshold', e.target.value)}
                            min="0"
                          />
                          {validationErrors[`model_${modelIndex}_color_threshold_${colorIndex}`] && (
                            <span className="error-message">{validationErrors[`model_${modelIndex}_color_threshold_${colorIndex}`]}</span>
                          )}
                        </div>
                      </div>

                      {/* <div className={`color-images ${validationErrors[`model_${modelIndex}_color_images_${colorIndex}`] ? 'error-field' : ''}`}>
                        <label>Color Images:</label>
                        <input
                          type="file"
                          multiple
                          onChange={(e) => handleModelColorImageChange(modelIndex, colorIndex, e)}
                          accept="image/*"
                          className="file-input"
                        />
                        {validationErrors[`model_${modelIndex}_color_images_${colorIndex}`] && (
                          <span className="error-message">{validationErrors[`model_${modelIndex}_color_images_${colorIndex}`]}</span>
                        )}
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
                      </div> */}

                      {/* <button
                        type="button"
                        className="btn-remove"
                        onClick={() => removeModelColor(modelIndex, colorIndex)}
                      >
                        Remove Color Variant
                      </button> */}
                    </div>
                  ))}
                  {/* <button
                    type="button"
                    className="btn-add"
                    onClick={() => addModelColor(modelIndex)}
                  >
                    + Add Color Variant
                  </button> */}
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

  if (isLoading) return <Loader />;

  return (
    <AdminLayout>
      <div className="product-management">
        <div className="tabs">
          <button
            className={activeTab === 'products' ? 'active' : ''}
            onClick={() => setActiveTab('products')}
          >
            Products
          </button>
        </div>

        <div className="content-area">
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
      </div>
    </AdminLayout>
  );
};

export default NewProduct;