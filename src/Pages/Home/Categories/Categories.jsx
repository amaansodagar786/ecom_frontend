import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './Categories.scss';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import errorImage from '../../../assets/Images/mtm-logo.jpg';
import Loader from "../../../Components/Loader/Loader";


const Categories = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const sliderRef = useRef(null);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_SERVER_API}/categories`);
        if (!response.ok) throw new Error('Failed to fetch categories');
        const data = await response.json();
        setCategories(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  const handleCategoryClick = (categoryId ) => {
    navigate(`/products/by-category/${categoryId}`);
    
  };

  const slide = (direction) => {
    const slider = sliderRef.current;
    const categoryWidth = windowWidth <= 768 ?
      (slider.firstChild?.offsetWidth || 120) + 10 :
      (slider.firstChild?.offsetWidth || 180) + 20;
    const scrollAmount = categoryWidth * (windowWidth <= 768 ? 1 : 2);

    slider.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };

  if (loading) return <Loader />;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="shop-by-category">
      <h2 className="sec-heading">Shop by Categories</h2>

      <div className="categories-container">
        <button
          className="slider-button left"
          onClick={() => slide('left')}
          aria-label="Slide left"
        >
          <FaChevronLeft />
        </button>

        <div className="categories" ref={sliderRef}>
          {categories.map((category) => (
            <div
              className="category"
              key={category.category_id}
              onClick={() => handleCategoryClick(category.category_id)}
            >
              <img
                src={`${import.meta.env.VITE_SERVER_API}/static/${category.image_url}`}
                alt={category.name}
                onError={(e) => {
                  e.target.src = errorImage;                  
                  e.target.style.objectFit = 'contain';
                }}
              />
              <div className="category-name">{category.name}</div>
            </div>
          ))}
        </div>

        <button
          className="slider-button right"
          onClick={() => slide('right')}
          aria-label="Slide right"
        >
          <FaChevronRight />
        </button>
      </div>
    </div>
  );
};

export default Categories;