import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FiArrowLeft } from 'react-icons/fi';
import './MainProducts.scss';

const MainProducts = () => {
  const { category } = useParams();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_SERVER_API}/products/category/${category}`);
        setProducts(response.data);
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };
    fetchProducts();
  }, [category]);

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

      <h2 className="section-title">{category} Products</h2>
      <div className="product-grid">
        {filteredProducts.length > 0 ? (
          filteredProducts.map((product) => (
            <div key={product.product_id} className="product-card">
              <img
                src={`${import.meta.env.VITE_SERVER_API}/static/${product.images[0]?.image_url}`}
              alt={product.name}
              className="product-image"
              />
              <div className="product-details">
                <h3>{product.name}</h3>
                <p>{product.description}</p>
                <p className="price">${product.price}</p>
              </div>
            </div>
          ))
        ) : (
          <p className="no-products">No products found.</p>
        )}
      </div>
    </div>
  );
};

export default MainProducts;
