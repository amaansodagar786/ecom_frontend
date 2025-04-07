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


  
  useEffect(() => {

    if (!categoryId) {
      console.error("No category ID provided");
      return;
    }
    
    const fetchProducts = async () => {
      console.log('Fetching products for category:', categoryId); // Debugging line
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_SERVER_API}/products/by-category/${categoryId}`
        );
        setProducts(response.data);
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };
    fetchProducts();
  }, [categoryId]); // Ensure categoryId is a dependency

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

      <h2 className="section-title">{categoryId} Products</h2>
      <div className="product-grid">
      {filteredProducts.length > 0 ? (
  filteredProducts.map((product) => {
    const hasImages = product.images && product.images.length > 0;
    const imageUrl = hasImages
  ? `${import.meta.env.VITE_SERVER_API}/static/${product.images[0]}`
  : null;


    console.log('Product:', product.name, '| Image URL:', imageUrl);

    return (
      <div key={product.product_id} className="product-card">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={product.name}
            className="product-image"
          />
        ) : (
          <div className="no-image">No Image Available</div>
        )}
        <div className="product-details">
          <h3>{product.name}</h3>
          <p>{product.description}</p>
          <p className="price">
            {product.colors.length > 0
              ? `$${product.colors[0].price}`
              : 'Price unavailable'}
          </p>
        </div>
      </div>
    );
  })
) : (
  <p className="no-products">No products found.</p>
)}


      </div>
    </div>
  );
};

export default MainProducts;
