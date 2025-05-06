import React, { useState, useEffect } from 'react';
import UserLayout from '../../User/UserPanel/UserLayout';
import Loader from '../../../Components/Loader/Loader';
import { FaStar } from 'react-icons/fa';
import './ReviewandRating.scss';

const ReviewandRating = () => {
  const [reviews, setReviews] = useState([]);
  const [products, setProducts] = useState({});
  const [loading, setLoading] = useState(true);

  const getUserData = () => {
    try {
      const storedData = localStorage.getItem('user');
      if (!storedData) return null;
      return JSON.parse(storedData);
    } catch (error) {
      console.error("Error parsing user data:", error);
      return null;
    }
  };

  const user = getUserData();
  const customer_id = user?.customer_id;

  useEffect(() => {
    if (!customer_id) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const reviewsResponse = await fetch(`${import.meta.env.VITE_SERVER_API}/reviews/customer/${customer_id}`);
        const reviewsData = await reviewsResponse.json();
        setReviews(reviewsData);

        const productIds = [...new Set(reviewsData.map(review => review.product_id))];
        const productPromises = productIds.map(id =>
          fetch(`${import.meta.env.VITE_SERVER_API}/product/${id}`).then(res => res.json())
        );
        
        const productsData = await Promise.all(productPromises);
        const productsMap = productsData.reduce((acc, product) => {
          acc[product.product_id] = product;
          return acc;
        }, {});

        setProducts(productsMap);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [customer_id]);

  return (
    <UserLayout>
      <div className="reviews-container">
        <h1 className="reviews-title">Your Reviews & Ratings</h1>
        
        {loading ? (
          <Loader />
        ) : reviews.length > 0 ? (
          <div className="reviews-list">
            {reviews.map((review) => {
              const product = products[review.product_id];
              const productImage = product?.images?.[0]?.image_url
                ? `${import.meta.env.VITE_SERVER_API}/static/${product.images[0].image_url}`
                : '/placeholder-product.jpg';
              const productName = product?.name || 'Unknown Product';
              const productCategory = product?.category || 'Uncategorized';

              return (
                <div className="review-card" key={review.review_id}>
                  <div className="review-product-section">
                    <div className="product-image-container">
                      <img 
                        src={productImage} 
                        alt={productName}
                        className="product-image"
                        onError={(e) => {
                          e.target.src = '/placeholder-product.jpg';
                        }}
                      />
                    </div>
                    <div className="product-info">
                      <h4 className="product-name">{productName}</h4>
                      <p className="product-category">{productCategory}</p>
                    </div>
                  </div>
                  <div className="review-content">
                    <div className="review-header">
                      <div className="review-user">
                        <h3 className="review-user-name">{review.customer_name}</h3>
                        <span className="review-date">
                          {new Date(review.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                      <div className="review-rating">
                        <FaStar className="filled" />
                        <span>{review.rating}</span>
                      </div>
                    </div>
                    <p className="review-text">{review.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="no-reviews">
            <p>You haven't reviewed any products yet</p>
            <button className="cta-button">Browse Products</button>
          </div>
        )}
      </div>
    </UserLayout>
  );
};

export default ReviewandRating;