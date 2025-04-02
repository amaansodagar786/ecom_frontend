import React, { useEffect, useState } from 'react';

import { useAuth } from '../../Components/Context/AuthContext';
import "./Wishlist.scss";

const Wishlist = () => {
  const { wishlistItems } = useAuth();

  useEffect(() => {
    console.log("Wishlist Items:", wishlistItems);
  }, [wishlistItems]);

  return (
    <div className="wishlist-page">
      <h1>Your Wishlist</h1>
      {wishlistItems.length > 0 ? (
        <div className="wishlist-items">
          {wishlistItems.map(item => (
            <div key={item.product_id} className="wishlist-item">
              <h3>{item.name}</h3>
              <p>Price: ${item.price?.toFixed(2)}</p>
              {item.image && (
                <img 
                  src={`http://localhost:5000/static${item.image}`} 
                  alt={item.name} 
                  width="100"
                />
              )}
            </div>
          ))}
        </div>
      ) : (
        <p>Your wishlist is empty</p>
      )}
    </div>
  );
};
export default Wishlist;
