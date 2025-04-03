import React, { useEffect } from 'react';
import { useAuth } from '../../Components/Context/AuthContext';
import { FiHeart, FiTrash2, FiShoppingCart, FiChevronRight } from 'react-icons/fi';
import "./Wishlist.scss";

const Wishlist = () => {
  const { wishlistItems, toggleWishlistItem } = useAuth();

  useEffect(() => {
    console.log("Wishlist Items:", wishlistItems);
  }, [wishlistItems]);

  const handleMoveToCart = (item) => {
    // Implement move to cart functionality
    console.log("Moving to cart:", item);
  };

  return (
    <div className="wishlist-page">
      <div className="wishlist-header">
        <h1>Your Wishlist</h1>
        <p className="item-count">{wishlistItems.length} {wishlistItems.length === 1 ? 'item' : 'items'}</p>
      </div>

      {wishlistItems.length > 0 ? (
        <div className="wishlist-container">
          <div className="wishlist-items">
            {wishlistItems.map(item => (
              <div key={item.product_id} className="wishlist-item">
                <div className="product-image">
                  {item.image && (
                    <img 
                      src={`http://localhost:5000/static${item.image}`} 
                      alt={item.name} 
                      loading="lazy"
                    />
                  )}
                  <button 
                    className="remove-btn"
                    onClick={() => toggleWishlistItem(item)}
                  >
                    <FiTrash2 size={18} />
                  </button>
                </div>
                
                <div className="product-details">
                  <h3 className="product-name">{item.name}</h3>
                  <p className="product-category">{item.category}</p>
                  <div className="product-price">
                    ${item.price?.toFixed(2)}
                    {item.deleted_price && (
                      <span className="original-price">${item.deleted_price?.toFixed(2)}</span>
                    )}
                  </div>
                  
                  <div className="product-actions">
                    <button 
                      className="move-to-cart"
                      onClick={() => handleMoveToCart(item)}
                    >
                      <FiShoppingCart size={16} />
                      Move to Cart
                    </button>
                    <button className="view-product">
                      View Product
                      <FiChevronRight size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="wishlist-sidebar">
            <div className="sidebar-card">
              <h3>Wishlist Summary</h3>
              <div className="summary-item">
                <span>Items</span>
                <span>{wishlistItems.length}</span>
              </div>
              <button className="add-all-to-cart">
                <FiShoppingCart size={18} />
                Add All to Cart
              </button>
              <p className="hint-text">
                Items remain in your wishlist until you remove them or add to cart
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="empty-wishlist">
          <div className="empty-icon">
            <FiHeart size={48} />
          </div>
          <h2>Your Wishlist is Empty</h2>
          <p>Save your favorite items here for later</p>
          <button className="continue-shopping">
            Continue Shopping
          </button>
        </div>
      )}
    </div>
  );
};

export default Wishlist;