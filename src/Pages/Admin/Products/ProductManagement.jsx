import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AdminLayout from '../AdminPanel/AdminLayout';
import axios from 'axios';
// import '/ProductManagement.scss' ;


const ProductManagement = () => {
  const { product_id } = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const [productData, setProductData] = useState({
    basic: {
      name: '',
      description: '',
      category_id: '',
      subcategory_id: '',
      product_type: 'single'
    },
    specifications: [],
    colors: [],
    models: [],
    images_to_delete: []
  });
  const [newImages, setNewImages] = useState([]);
  const [colorImages, setColorImages] = useState({});
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);

  // Fetch all products and categories
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_SERVER_API}/products`),
          axios.get(`${import.meta.env.VITE_SERVER_API}/categories`)
        ]);

        setProducts(productsRes.data);
        setFilteredProducts(productsRes.data);
        setCategories(categoriesRes.data);

        if (product_id) {
          const productToEdit = productsRes.data.find(p => p.product_id == product_id);
          if (productToEdit) {
            setSelectedProduct(productToEdit);
            setIsEditing(true);
            loadProductData(productToEdit, categoriesRes.data);
          }
        }

        setIsLoading(false);
      } catch (error) {
        toast.error('Failed to load data');
        console.error(error);
      }
    };

    fetchData();
  }, [product_id]);

  const loadProductData = (product, categories) => {
    // Find the category object that matches the product's category
    const productCategory = categories.find(cat => 
      cat.category_id === product.main_category?.category_id || 
      cat.name === product.main_category?.name
    );
    
    const categoryId = productCategory?.category_id || '';
    let subcategoryId = '';
    
    // Find the subcategory if it exists
    if (productCategory?.subcategories) {
      const productSubcategory = productCategory.subcategories.find(
        sub => sub.subcategory_id === product.sub_category?.subcategory_id || 
              sub.name === product.sub_category?.name
      );
      subcategoryId = productSubcategory?.subcategory_id || '';
    }

    // Format product data for our form
    setProductData({
      basic: {
        name: product.name,
        description: product.description,
        category_id: categoryId,
        subcategory_id: subcategoryId,
        product_type: product.product_type || 'single'
      },
      specifications: product.specifications || [],
      colors: product.colors || [],
      models: product.models || [],
      images_to_delete: []
    });

    // Set subcategories if category is found
    if (productCategory) {
      setSubcategories(productCategory.subcategories || []);
    }
  };

  // Filter products based on search term
  useEffect(() => {
    if (searchTerm) {
      const filtered = products.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.main_category?.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (product.sub_category?.name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts(products);
    }
  }, [searchTerm, products]);

  const handleBasicChange = (e) => {
    const { name, value } = e.target;
    setProductData(prev => ({
      ...prev,
      basic: {
        ...prev.basic,
        [name]: value
      }
    }));

    // If category changed, update subcategories from the already loaded categories
    if (name === 'category_id') {
      const category = categories.find(c => c.category_id == value);
      setSubcategories(category?.subcategories || []);
      // Reset subcategory when category changes
      setProductData(prev => ({
        ...prev,
        basic: {
          ...prev.basic,
          subcategory_id: ''
        }
      }));
    }
  };

  const handleSpecChange = (index, e) => {
    const { name, value } = e.target;
    const updatedSpecs = [...productData.specifications];
    updatedSpecs[index] = {
      ...updatedSpecs[index],
      [name]: value
    };
    setProductData(prev => ({
      ...prev,
      specifications: updatedSpecs
    }));
  };

  const addNewSpec = () => {
    setProductData(prev => ({
      ...prev,
      specifications: [
        ...prev.specifications,
        { key: '', value: '', spec_id: null }
      ]
    }));
  };

  const removeSpec = (index) => {
    const updatedSpecs = [...productData.specifications];
    const specToRemove = updatedSpecs[index];
    
    if (specToRemove.spec_id) {
      setProductData(prev => ({
        ...prev,
        images_to_delete: [...prev.images_to_delete, specToRemove.spec_id]
      }));
    }
    
    updatedSpecs.splice(index, 1);
    setProductData(prev => ({
      ...prev,
      specifications: updatedSpecs
    }));
  };

  const handleColorChange = (index, e) => {
    const { name, value } = e.target;
    const updatedColors = [...productData.colors];
    updatedColors[index] = {
      ...updatedColors[index],
      [name]: value
    };
    setProductData(prev => ({
      ...prev,
      colors: updatedColors
    }));
  };

  const addNewColor = () => {
    const tempId = Date.now();
    setProductData(prev => ({
      ...prev,
      colors: [
        ...prev.colors,
        {
          temp_id: tempId,
          name: '',
          price: 0,
          original_price: 0,
          stock_quantity: 0,
          threshold: 10,
          model_id: null
        }
      ]
    }));
  };

  const removeColor = (index) => {
    const updatedColors = [...productData.colors];
    const colorToRemove = updatedColors[index];
    
    if (colorToRemove.color_id) {
      setProductData(prev => ({
        ...prev,
        images_to_delete: [...prev.images_to_delete, colorToRemove.color_id]
      }));
    }
    
    updatedColors.splice(index, 1);
    setProductData(prev => ({
      ...prev,
      colors: updatedColors
    }));
  };

  const handleModelChange = (index, e) => {
    const { name, value } = e.target;
    const updatedModels = [...productData.models];
    updatedModels[index] = {
      ...updatedModels[index],
      [name]: value
    };
    setProductData(prev => ({
      ...prev,
      models: updatedModels
    }));
  };

  const addNewModel = () => {
    setProductData(prev => ({
      ...prev,
      models: [
        ...prev.models,
        { name: '', description: '', model_id: null }
      ]
    }));
  };

  const removeModel = (index) => {
    const updatedModels = [...productData.models];
    const modelToRemove = updatedModels[index];
    
    if (modelToRemove.model_id) {
      setProductData(prev => ({
        ...prev,
        images_to_delete: [...prev.images_to_delete, modelToRemove.model_id]
      }));
    }
    
    updatedModels.splice(index, 1);
    setProductData(prev => ({
      ...prev,
      models: updatedModels
    }));
  };

  const handleMainImageUpload = (e) => {
    setNewImages([...e.target.files]);
  };

  const handleColorImageUpload = (colorId, e) => {
    setColorImages(prev => ({
      ...prev,
      [colorId]: [...(prev[colorId] || []), ...e.target.files]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('productData', JSON.stringify(productData));

      newImages.forEach(file => {
        formData.append('images', file);
      });

      Object.entries(colorImages).forEach(([colorId, files]) => {
        files.forEach(file => {
          formData.append(`color_image_${colorId}`, file);
        });
      });

      const url = isEditing 
        ? `${import.meta.env.VITE_SERVER_API}/${selectedProduct.product_id}/update-all`
        : `${import.meta.env.VITE_SERVER_API}/products/create`;

      const response = await axios.post(
        url,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      toast.success(isEditing ? 'Product updated successfully!' : 'Product created successfully!');
      
      const productsRes = await axios.get(`${import.meta.env.VITE_SERVER_API}/products`);
      setProducts(productsRes.data);
      setFilteredProducts(productsRes.data);
      
      if (!isEditing) {
        resetForm();
      }
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error(`Failed to ${isEditing ? 'update' : 'create'} product: ${error.response?.data?.error || error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setProductData({
      basic: {
        name: '',
        description: '',
        category_id: '',
        subcategory_id: '',
        product_type: 'single'
      },
      specifications: [],
      colors: [],
      models: [],
      images_to_delete: []
    });
    setNewImages([]);
    setColorImages({});
    setSelectedProduct(null);
    setIsEditing(false);
  };

  const handleEditProduct = (product) => {
    setSelectedProduct(product);
    setIsEditing(true);
    loadProductData(product, categories);
    document.getElementById('product-form-section').scrollIntoView({ behavior: 'smooth' });
  };

  const handleCreateNew = () => {
    resetForm();
    document.getElementById('product-form-section').scrollIntoView({ behavior: 'smooth' });
  };

  const deleteProduct = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await axios.delete(`${import.meta.env.VITE_SERVER_API}/products/${productId}`);
        toast.success('Product deleted successfully');
        setProducts(products.filter(p => p.product_id !== productId));
        setFilteredProducts(filteredProducts.filter(p => p.product_id !== productId));
        
        if (selectedProduct && selectedProduct.product_id === productId) {
          resetForm();
        }
      } catch (error) {
        toast.error('Failed to delete product');
        console.error(error);
      }
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Product Management</h1>
            <button
              onClick={handleCreateNew}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Add New Product
            </button>
          </div>

          <div className="mb-6">
            <input
              type="text"
              placeholder="Search products..."
              className="w-full px-4 py-2 border border-gray-300 rounded-md"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="bg-white shadow rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.map((product) => (
                  <tr key={product.product_id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {product.images?.length > 0 ? (
                        <img
                          src={product.images[0].image_url}
                          alt={product.name}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-gray-200"></div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{product.name}</div>
                      <div className="text-sm text-gray-500 line-clamp-1">{product.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{product.main_category?.name}</div>
                      <div className="text-sm text-gray-500">{product.sub_category?.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.product_type || 'single'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleEditProduct(product)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteProduct(product.product_id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div id="product-form-section" className="bg-white shadow rounded-lg p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">
              {isEditing ? `Update Product: ${selectedProduct?.name}` : 'Create New Product'}
            </h1>
            {isEditing && (
              <button
                onClick={resetForm}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
              >
                Cancel Edit
              </button>
            )}
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                  <input
                    type="text"
                    name="name"
                    value={productData.basic.name}
                    onChange={handleBasicChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Type</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={productData.basic.product_type}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                      readOnly
                    />
                  ) : (
                    <select
                      name="product_type"
                      value={productData.basic.product_type}
                      onChange={handleBasicChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="single">Single Product</option>
                      <option value="variable">Variable Product</option>
                    </select>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    name="category_id"
                    value={productData.basic.category_id}
                    onChange={handleBasicChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map(category => (
                      <option key={category.category_id} value={category.category_id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subcategory</label>
                  <select
                    name="subcategory_id"
                    value={productData.basic.subcategory_id}
                    onChange={handleBasicChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    disabled={!productData.basic.category_id}
                  >
                    <option value="">Select Subcategory</option>
                    {subcategories.map(subcategory => (
                      <option key={subcategory.subcategory_id} value={subcategory.subcategory_id}>
                        {subcategory.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    name="description"
                    value={productData.basic.description}
                    onChange={handleBasicChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows="4"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Specifications</h2>
                <button
                  type="button"
                  onClick={addNewSpec}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  Add Specification
                </button>
              </div>
              <div className="space-y-4">
                {productData.specifications.map((spec, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Key</label>
                      <input
                        type="text"
                        name="key"
                        value={spec.key}
                        onChange={(e) => handleSpecChange(index, e)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Value</label>
                      <input
                        type="text"
                        name="value"
                        value={spec.value}
                        onChange={(e) => handleSpecChange(index, e)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <button
                        type="button"
                        onClick={() => removeSpec(index)}
                        className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {productData.basic.product_type === 'single' && (
              <div className="bg-white shadow rounded-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Color Variants</h2>
                  <button
                    type="button"
                    onClick={addNewColor}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                  >
                    Add Color Variant
                  </button>
                </div>
                <div className="space-y-6">
                  {productData.colors.map((color, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Color Name</label>
                          <input
                            type="text"
                            name="name"
                            value={color.name}
                            onChange={(e) => handleColorChange(index, e)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                          <input
                            type="number"
                            name="price"
                            value={color.price}
                            onChange={(e) => handleColorChange(index, e)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            step="0.01"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Original Price</label>
                          <input
                            type="number"
                            name="original_price"
                            value={color.original_price}
                            onChange={(e) => handleColorChange(index, e)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            step="0.01"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity</label>
                          <input
                            type="number"
                            name="stock_quantity"
                            value={color.stock_quantity}
                            onChange={(e) => handleColorChange(index, e)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Threshold</label>
                          <input
                            type="number"
                            name="threshold"
                            value={color.threshold}
                            onChange={(e) => handleColorChange(index, e)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          />
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Color Images</label>
                        <input
                          type="file"
                          multiple
                          onChange={(e) => handleColorImageUpload(color.color_id || color.temp_id, e)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => removeColor(index)}
                        className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                      >
                        Remove Color
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {productData.basic.product_type === 'variable' && (
              <div className="bg-white shadow rounded-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Models</h2>
                  <button
                    type="button"
                    onClick={addNewModel}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                  >
                    Add Model
                  </button>
                </div>
                <div className="space-y-4">
                  {productData.models.map((model, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Model Name</label>
                        <input
                          type="text"
                          name="name"
                          value={model.name}
                          onChange={(e) => handleModelChange(index, e)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      <div className="md:col-span-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <input
                          type="text"
                          name="description"
                          value={model.description}
                          onChange={(e) => handleModelChange(index, e)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      <div>
                        <button
                          type="button"
                          onClick={() => removeModel(index)}
                          className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Main Product Images</h2>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Upload New Images</label>
                <input
                  type="file"
                  multiple
                  onChange={handleMainImageUpload}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              {isEditing && selectedProduct?.images?.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-lg font-medium mb-2">Current Images</h3>
                  <div className="flex flex-wrap gap-4">
                    {selectedProduct.images.map((image, index) => (
                      <div key={index} className="relative">
                        <img
                          src={image.image_url}
                          alt={`Product ${index}`}
                          className="h-24 w-24 object-cover rounded"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-3 bg-gray-500 text-white rounded-md hover:bg-gray-600"
              >
                Reset
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-3 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:bg-gray-400"
              >
                {isLoading ? 'Saving...' : isEditing ? 'Update Product' : 'Create Product'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
};

export default ProductManagement;