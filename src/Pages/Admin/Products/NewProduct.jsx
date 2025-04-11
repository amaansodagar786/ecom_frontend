import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Loader from "../../../Components/Loader/Loader";
import AdminLayout from '../AdminPanel/AdminLayout';
import './NewProduct.scss';

const NewProduct = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [removedModelIds, setRemovedModelIds] = useState([]);  // NEW 
  const [removedSpecIds, setRemovedSpecIds] = useState([]); // NEW


  const [formData, setFormData] = useState({
    name: '',
    description: '',
    product_type: 'single',
    category_id: '',
    subcategory_id: '',
    images: [],
    colors: [],
    models: [],
    specifications: [] // NEW: For single product specs

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

        console.log('Fetched Products:', productsRes.data);
        console.log('Fetched Categories:', categoriesRes.data);

        setProducts(productsRes.data);
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

    console.log('Products before filtering:', products); // Debug log
    console.log('Current category filter:', categoryFilter); // Debug log

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(product =>
        product.name.toLowerCase().includes(term) ||
        product.description.toLowerCase().includes(term)
      );
    }

    if (categoryFilter !== 'all') {
      result = result.filter(product => {
        // Check different possible category structures
        const categoryId =
          product.category_id || // Direct property
          product.category?.category_id || // Nested object
          product.category; // Could be just the ID

        console.log(`Product ${product.product_id} category:`, categoryId); // Debug log

        return categoryId && categoryId.toString() === categoryFilter.toString();
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
      case 'newest':
        result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        break;
      case 'oldest':
        result.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        break;
      default:
        break;
    }
    console.log('Filtered products:', result); // Debug log

    setFilteredProducts(result);
  }, [searchTerm, sortOption, categoryFilter, products]);

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

    console.log("Resolved category:", matchedCategory);
    console.log("Resolved subcategory:", matchedSubcategory);

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
      images: product.images || [],
      colors: product.colors || [],
      models: product.models || [],
      specifications: product.specifications || [] // Initialize specs for single products
    });

    setNewImages([]);
    setSpecsToDelete([]);

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
    setSpecsToDelete([]);

  };

  // UPDATE SINGLE PRODUCT SPECIFICATIONS
  // Add these functions for single product specifications
  const addProductSpecification = () => {
    setFormData(prev => ({
      ...prev,
      specifications: [...prev.specifications, { key: '', value: '' }]
    }));
  };

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
  };

  const removeProductSpecification = (specIndex) => {
    setFormData(prev => {
      const updatedSpecs = [...prev.specifications];
      const specToRemove = updatedSpecs[specIndex];

      if (specToRemove?.spec_id) {
        setSpecsToDelete(prev => [...prev, specToRemove.spec_id]);
      }

      updatedSpecs.splice(specIndex, 1);
      return {
        ...prev,
        specifications: updatedSpecs
      };
    });
  };

  const saveProductSpecifications = async () => {
    if (!editingProduct) return;

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
                `${import.meta.env.VITE_SERVER_API}/${editingProduct.product_id}/specifications/${specId}`,
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
        formData.specifications.map(async (spec) => {
          if (!spec?.key && !spec?.value) return null;

          const specData = {
            key: spec.key || '',
            value: spec.value || '',
            product_id: editingProduct.product_id
          };

          try {
            if (spec?.spec_id) {
              // Update existing spec
              const response = await axios.put(
                `${import.meta.env.VITE_SERVER_API}/${editingProduct.product_id}/specifications/${spec.spec_id}`,
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
                `${import.meta.env.VITE_SERVER_API}/${editingProduct.product_id}/specifications`,
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

      // Update the form data with new spec IDs
      setFormData(prev => {
        const updatedSpecs = prev.specifications
          .map((spec, idx) => ({
            ...spec,
            spec_id: results[idx]?.spec_id || spec.spec_id
          }))
          .filter(spec => spec.key || spec.value);

        return {
          ...prev,
          specifications: updatedSpecs
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




  // Save specifications for a model
  const saveModelSpecifications = async (modelIndex) => {
    if (!editingProduct) return;

    const model = formData.models[modelIndex];
    if (!model || !model.model_id) {
      setError('Model must be saved before adding specifications');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // First delete any specs marked for deletion
      await Promise.all(
        specsToDelete
          .filter(specId => specId) // Filter out any undefined/null values
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
          if (!spec?.key && !spec?.value) return null; // Skip empty specs

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
          .filter(spec => spec.key || spec.value); // Remove empty specs

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
  };;


  // Separate image upload function
  const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append('image', file);

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

    return response.data.image_url; // Make sure your backend returns this
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // 1. First update basic product information
      const productData = {
        name: formData.name,
        description: formData.description,
        product_type: formData.product_type,
        category_id: formData.category_id,
        subcategory_id: formData.subcategory_id
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

      // 2. Handle deleted models
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

      // 3. Handle product images
      const uploadedImages = await Promise.all(
        newImages.map(file => uploadImage(file))
      );

      if (uploadedImages.length > 0) {
        await Promise.all(uploadedImages.map(url => {
          return axios.post(
            `${import.meta.env.VITE_SERVER_API}/${editingProduct.product_id}/images`,
            { image_url: url },
            {
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              }
            }
          );
        }));
      }

      // 4. Handle colors (for single products)
      if (formData.product_type === 'single') {
        await Promise.all(formData.colors.map(async (color, colorIndex) => {
          // Update or create color
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

          // Handle color images if any - using the product images endpoint with color_id
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

      // 5. Handle models and their colors (for variable products)
      if (formData.product_type === 'variable') {
        await Promise.all(formData.models.map(async (model, modelIndex) => {
          // Update or create model
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
          // Handle model colors
          if (model.colors) {
            await Promise.all(model.colors.map(async (color, colorIndex) => {
              // Update or create color
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
                model_id: modelId // Include model_id in the request body

              };

              try {
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

                // Handle color images if any
                if (color.newImages && color.newImages.length > 0) {
                  await Promise.all(color.newImages.map(async file => {
                    const formData = new FormData();
                    formData.append('image', file);
                    formData.append('color_id', colorId);
                    formData.append('model_id', modelId);

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
              } catch (err) {
                console.error(`Error saving color ${colorIndex} for model ${modelIndex}:`, err);
                throw err;
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

      // Safely access specifications array
      if (!updatedModels[modelIndex].specifications) {
        return prev; // No specifications to remove
      }

      const specToRemove = updatedModels[modelIndex].specifications[specIndex];

      // Only add to delete list if spec exists and has an ID
      if (specToRemove?.spec_id) {
        setSpecsToDelete(prev => [...prev, specToRemove.spec_id]);
      }

      // Remove the specification from the array
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

    try {
      // Upload each new image
      const uploadPromises = files.map(file => {
        const formData = new FormData();
        formData.append('image', file);

        return axios.post(
          `${import.meta.env.VITE_SERVER_API}/${editingProduct.product_id}/images`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }
        );
      });

      const responses = await Promise.all(uploadPromises);
      const newImageUrls = responses.map(res => res.data.image_url);

      // Update state with new images
      setFormData(prev => ({
        ...prev,
        images: [
          ...prev.images,
          ...newImageUrls.map(url => ({
            image_url: url,
            image_id: Date.now() // Temporary ID for new images
          }))
        ]
      }));

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
    const colorId = formData.colors[colorIndex].color_id;

    if (!colorId) {
      setError("Color must be saved before adding images");
      return;
    }

    try {
      const uploadPromises = files.map(file => {
        const formData = new FormData();
        formData.append('image', file);
        formData.append('color_id', colorId); // Add color_id to form data

        return axios.post(
          `${import.meta.env.VITE_SERVER_API}/${editingProduct.product_id}/images`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }
        );
      });

      const responses = await Promise.all(uploadPromises);
      const newImageUrls = responses.map(res => res.data.image_url);

      // Update state with new images
      setFormData(prev => {
        const updatedColors = [...prev.colors];
        updatedColors[colorIndex] = {
          ...updatedColors[colorIndex],
          images: [
            ...updatedColors[colorIndex].images,
            ...newImageUrls.map(url => ({
              image_url: url,
              image_id: Date.now() // Temporary ID for new images
            }))
          ]
        };
        return {
          ...prev,
          colors: updatedColors
        };
      });

    } catch (err) {
      console.error('Error uploading color images:', err);
      setError(err.response?.data?.message || 'Failed to upload color images');
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

    try {
      const modelId = formData.models[modelIndex].model_id;
      const colorId = formData.models[modelIndex].colors[colorIndex].color_id;

      if (!modelId || !colorId) {
        throw new Error("Model and color must be saved before adding images");
      }

      const uploadedImages = await Promise.all(
        files.map(file => {
          const formData = new FormData();
          formData.append('image', file);
          formData.append('color_id', colorId);
          formData.append('model_id', modelId); // Add model_id to form data

          return axios.post(
            `${import.meta.env.VITE_SERVER_API}/${editingProduct.product_id}/images`,
            formData,
            {
              headers: {
                'Content-Type': 'multipart/form-data',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              }
            }
          );
        })
      );

      const imageUrls = uploadedImages.map(res => res.data.image_url);

      setFormData(prev => {
        const updatedModels = [...prev.models];
        updatedModels[modelIndex].colors[colorIndex] = {
          ...updatedModels[modelIndex].colors[colorIndex],
          images: [
            ...updatedModels[modelIndex].colors[colorIndex].images,
            ...imageUrls.map(url => ({
              image_url: url,
              image_id: Date.now() // Temporary ID for new images
            }))
          ]
        };
        return {
          ...prev,
          models: updatedModels
        };
      });
    } catch (err) {
      console.error('Error uploading model color images:', err);
      setError(err.response?.data?.message || 'Failed to upload model color images');
    }
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
      const removedModel = updatedModels.splice(modelIndex, 1)[0];

      // Track removed model ID if it exists
      if (removedModel.model_id) {
        setRemovedModelIds(prevIds => [...prevIds, removedModel.model_id]);
      }

      return {
        ...prev,
        models: updatedModels
      };
    });
  };

  // // Add specification to a model
  // const addSpecification = (modelIndex) => {
  //   setFormData(prev => {
  //     const updatedModels = [...prev.models];
  //     updatedModels[modelIndex].specifications = [
  //       ...(updatedModels[modelIndex].specifications || []),
  //       { key: '', value: '' }
  //     ];
  //     return {
  //       ...prev,
  //       models: updatedModels
  //     };
  //   });
  // };

  // Update specification
  // Update specification
  //  const updateSpecification = (modelIndex, specIndex, field, value) => {
  //   setFormData(prev => {
  //     const updatedModels = [...prev.models];
  //     updatedModels[modelIndex].specifications[specIndex][field] = value;
  //     return {
  //       ...prev,
  //       models: updatedModels
  //     };
  //   });
  // };

  // Remove specification (marks for deletion if it exists in DB)
  // const removeSpecification = (modelIndex, specIndex) => {
  //   setFormData(prev => {
  //     const updatedModels = [...prev.models];
  //     const model = updatedModels[modelIndex];

  //     if (!model.specifications || specIndex >= model.specifications.length) {
  //       return prev;
  //     }

  //     const removedSpec = model.specifications[specIndex];

  //     // Remove from local state
  //     model.specifications.splice(specIndex, 1);

  //     // Track deletion if it has an ID (exists in DB)
  //     if (removedSpec?.spec_id) {
  //       setRemovedSpecIds(prev => [
  //         ...prev,
  //         {
  //           model_id: model.model_id,
  //           spec_id: removedSpec.spec_id
  //         }
  //       ]);
  //     }

  //     return {
  //       ...prev,
  //       models: updatedModels
  //     };
  //   });
  // };


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
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
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
        <div className="loading">Loading products...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : (
        <div className="product-grid">
          {filteredProducts.length > 0 ? (
            filteredProducts.map(product => (
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

        {/* Display Category (based on formData.category_id) */}
        <div className="form-group">
          <label>Category:</label>
          <p>
            {
              (() => {
                console.log("Editing Product Category ID:", editingProduct?.category_id);
                console.log("All Categories IDs:", categories.map(c => c.category_id));

                const matchedCategory = categories.find(c => c.category_id == editingProduct?.category_id);
                return matchedCategory?.name || 'No category';
              })()
            }
          </p>
          <input type="hidden" name="category_id" value={editingProduct?.category_id || ''} />
        </div>

        {/* Display Subcategory (based on formData.subcategory_id) */}
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

        {formData.product_type === 'single' && (
          <div className="form-group">
            <div className="spec-header">
              <h3>Specifications</h3>
              <button
                type="button"
                className="btn-save-specs"
                onClick={saveProductSpecifications}
                disabled={isLoading}
              >
                {isLoading ? 'Saving...' : 'Save Specifications'}
              </button>
            </div>

            {formData.specifications?.map((spec, specIndex) => (
              <div key={specIndex} className="specification-item">
                <input
                  type="text"
                  placeholder="Spec name (e.g., Material)"
                  value={spec.key}
                  onChange={(e) => updateProductSpecification(specIndex, 'key', e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Spec value (e.g., Cotton)"
                  value={spec.value}
                  onChange={(e) => updateProductSpecification(specIndex, 'value', e.target.value)}
                />
                <button
                  type="button"
                  className="btn-remove"
                  onClick={() => removeProductSpecification(specIndex)}
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              className="btn-add"
              onClick={addProductSpecification}
            >
              + Add Specification
            </button>
          </div>
        )}

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
                  <div className="spec-header">
                    <h5>Specifications</h5>
                    <button
                      type="button"
                      className="btn-save-specs"
                      onClick={() => saveModelSpecifications(modelIndex)}
                      disabled={isLoading}
                    >
                      {isLoading ? 'Saving...' : 'Save Specifications'}
                    </button>
                  </div>

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

