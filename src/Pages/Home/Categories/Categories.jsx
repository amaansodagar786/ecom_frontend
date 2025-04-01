// src/components/Categories.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Categories.scss';

const Categories = () => {
  const navigate = useNavigate();

  const categories = [
    { id: 1, name: 'Electronics', imageUrl: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03' },
    { id: 2, name: 'Fashion', imageUrl: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f' },
    {
      id: 3,
      name: "Home Appliances",
      imageUrl: "https://images.unsplash.com/photo-1513694203232-719a280e022f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1200&q=80"
    },
    {
      id: 4,
      name: "Footwear",
      imageUrl: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1200&q=80"
    }
  ];

  const handleCategoryClick = (categoryName) => {
    navigate(`/products/${categoryName}`);
  };

  return (
    <div className="shop-by-category">
      <h2 className="sec-heading">Shop By Categories</h2>
      <div className="categories">
        {categories.map((category) => (
          <div
            className="category"
            key={category.id}
            onClick={() => handleCategoryClick(category.name)}
          >
            <img src={category.imageUrl} alt={category.name} />
            <div className="category-name">{category.name}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Categories;