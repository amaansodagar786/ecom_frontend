import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FiArrowLeft } from 'react-icons/fi';
import './MainProducts.scss';

const MainProducts = () => {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!categoryId) {
      console.error("No category ID provided");
      setError("No category selected");
      setLoading(false);
      return;
    }

    const fetchProducts = async () => {
      console.log('Fetching products for category:', categoryId);
      setLoading(true);
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_SERVER_API}/products/by-category/${categoryId}`
        );

        console.log("API Response:", response.data);

        const data = Array.isArray(response.data) ? response.data : [];
        setProducts(data);
        setError(null);
      } catch (error) {
        console.error('Error fetching products:', error);
        setError('Failed to load products. Please try again later.');
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [categoryId]);

  const getImageUrl = (imageData) => {
    if (!imageData) return null;
    
    // Handle case where imageData is a string (direct path)
    if (typeof imageData === 'string') {
      return `${import.meta.env.VITE_SERVER_API}/static/${imageData}`;
    }
    
    // Handle case where imageData is an object with image_url property
    if (typeof imageData === 'object' && imageData.image_url) {
      return `${import.meta.env.VITE_SERVER_API}/static/${imageData.image_url}`;
    }
    
    // Handle case where imageData is an object with url property
    if (typeof imageData === 'object' && imageData.url) {
      return `${import.meta.env.VITE_SERVER_API}/static/${imageData.url}`;
    }
    
    // Fallback : try to find any string property in the object
    if (typeof imageData === 'object') {
      const possibleUrl = Object.values(imageData).find(val => typeof val === 'string');
      return possibleUrl ? `${import.meta.env.VITE_SERVER_API}/static/${possibleUrl}` : null;
    }
    
    return null;
  };

  const filteredProducts = Array.isArray(products)
  ? products.filter((product) =>
      product.name?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  : [];



  if (loading) {
    return (
      <div className="home-products">
        <div className="top-bar">
          <button className="back-button" onClick={() => navigate(-1)}>
            <FiArrowLeft /> Back
          </button>
        </div>
        <div className="loading-spinner">Loading products...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="home-products">
        <div className="top-bar">
          <button className="back-button" onClick={() => navigate(-1)}>
            <FiArrowLeft /> Back
          </button>
        </div>
        <div className="error-message">{error}</div>
      </div>
    );
  }

  return (
    <div className="home-products">
      <div className="top-bar">
        <button className="back-button" onClick={() => navigate(-1)}>
          <FiArrowLeft /> Back
        </button>
        <input
          type="text"
          placeholder="Search products..."
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <h2 className="section-title">Products</h2>
      <div className="product-grid">
        {filteredProducts.length > 0 ? (
          filteredProducts.map((product) => {
            const firstImage = product.images?.[0];
            const imageUrl = getImageUrl(firstImage);

            console.log('Product:', product.name, '| Image URL:', imageUrl);

            return (
              <div key={product.product_id} className="product-card">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={product.name}
                    className="product-image"
                    // onError={(e) => {
                    //   e.target.onerror = null;
                    //   e.target.src = '/placeholder-image.jpg';
                    //   e.target.classList.add('image-error');
                    // }}
                  />
                ) : (
                  <div className="no-image">No Image Available</div>
                )}
                <div className="product-details">
                  <h3>{product.name || 'Unnamed Product'}</h3>
                  <p>{product.description || 'No description available'}</p>
                  <p className="price">
                    {product.colors?.length > 0
                      ? `$${product.colors[0].price}`
                      : 'Price unavailable'}
                  </p>
                </div>
              </div>
            );
          })
        ) : (
          <p className="no-products">
            {searchTerm ? 'No matching products found' : 'No products available in this category'}
          </p>
        )}
      </div>
    </div>
  );
};

export default MainProducts;