// src/Components/Context/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState({
    isAuthenticated: false,
    user: null,
    token: null,
    isLoading: true // Added loading state
  });

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user'));
        
        if (token && user) {
          setAuthState({
            isAuthenticated: true,
            user,
            token,
            isLoading: false
          });
        } else {
          setAuthState(prev => ({ ...prev, isLoading: false }));
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    };

    initializeAuth();
  }, []);

  const login = (token, user) => {
    try {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setAuthState({
        isAuthenticated: true,
        user,
        token,
        isLoading: false
      });
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const logout = () => {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setAuthState({
        isAuthenticated: false,
        user: null,
        token: null,
        isLoading: false
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

   // Add wishlist state
   const [wishlistItems, setWishlistItems] = useState(() => {
    // Initialize from localStorage if available
    const saved = localStorage.getItem('wishlist');
    return saved ? JSON.parse(saved) : [];
  });

  const toggleWishlistItem = (product) => {
    setWishlistItems(prev => {
      const newWishlist = prev.some(item => item.product_id === product.product_id)
        ? prev.filter(item => item.product_id !== product.product_id)
        : [...prev, product];
      
      // Save to localStorage whenever wishlist changes
      localStorage.setItem('wishlist', JSON.stringify(newWishlist));
      return newWishlist;
    });
  };



  return (
    <AuthContext.Provider value={{ 
      ...authState, 
      login, 
      logout,
      isAdmin: authState.user?.role === 'admin' ,
      wishlistItems,
      toggleWishlistItem
    }}>
      {!authState.isLoading && children}
    </AuthContext.Provider>
  );
};


 


export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};