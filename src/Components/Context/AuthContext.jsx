import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';


const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState({
    isAuthenticated: false,
    user: null,
    token: null,
    isLoading: true
  });
  const [cartItems, setCartItems] = useState([]);
  const [wishlistItems, setWishlistItems] = useState([]);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user'));
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        const wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];

        if (token && user) {
          setAuthState({
            isAuthenticated: true,
            user,
            token,
            isLoading: false
          });
          setCartItems(cart);
          setWishlistItems(wishlist);
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

  const login = (token, user, navigate) => {
    try {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setAuthState({
        isAuthenticated: true,
        user,
        token,
        isLoading: false
      });
      if (navigate) navigate('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const logout = (navigate) => {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setAuthState({
        isAuthenticated: false,
        user: null,
        token: null,
        isLoading: false
      });
      setCartItems([]);
      setWishlistItems([]);
      localStorage.removeItem('cart');
      localStorage.removeItem('wishlist');
      if (navigate) navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

// In AuthProvider component
const toggleWishlistItem = async (product, selectedModel = null, selectedColor = null) => {
  const wishlistItem = {
    product_id: product.product_id,
    model_id: selectedModel?.model_id || null,
    color_id: selectedColor?.color_id || null,
    name: product.name,
    price: selectedColor?.price || 
          selectedModel?.colors?.[0]?.price || 
          product.price,
    image: selectedColor?.images?.[0]?.image_url || 
           product.images?.[0]?.image_url,
    category: product.category
  };

  // Check existence before updating state
  const exists = wishlistItems.some(item => 
    item.product_id === wishlistItem.product_id &&
    item.model_id === wishlistItem.model_id &&
    item.color_id === wishlistItem.color_id
  );;

  const newWishlist = exists
    ? wishlistItems.filter(item => 
        !(item.product_id === wishlistItem.product_id &&
          item.model_id === wishlistItem.model_id &&
          item.color_id === wishlistItem.color_id)
      ) // <-- This closing parenthesis was missing
    : [...wishlistItems, wishlistItem]

setWishlistItems(newWishlist);
localStorage.setItem('wishlist', JSON.stringify(newWishlist));

// Sync with server if authenticated
if (authState.isAuthenticated) {
  try {
    const token = getToken();
    const endpoint = exists 
      ? `${import.meta.env.VITE_SERVER_API}/wishlist/deleteitem`
      : `${import.meta.env.VITE_SERVER_API}/wishlist/additem`;

    await axios.post(
      endpoint,
      { 
        product_id: wishlistItem.product_id,
        model_id: wishlistItem.model_id,
        color_id: wishlistItem.color_id
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
  
  } catch (err) {
    // Revert on error
    setWishlistItems(wishlistItems);
    localStorage.setItem('wishlist', JSON.stringify(wishlistItems));
    console.error('Error syncing wishlist:', err);
  }
}
};



  const addToCart = (item) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(i => 
        i.product_id === item.product_id && 
        i.color === (item.color || '') && 
        i.model === (item.model || '')
      );
      
      let newItems;
      if (existingItem) {
        newItems = prevItems.map(i => 
          i.product_id === item.product_id && 
          i.color === (item.color || '') && 
          i.model === (item.model || '')
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        );
      } else {
        newItems = [...prevItems, {
          ...item,
          color: item.color || '',
          model: item.model || ''
        }];
      }
      
      localStorage.setItem('cart', JSON.stringify(newItems));
      return newItems;
    });
  };

  const removeFromCart = (productId, color, model) => {
    setCartItems(prevItems => {
      const newItems = prevItems.filter(item => 
        !(item.product_id === productId && 
          item.color === color && 
          item.model === model)
      );
      localStorage.setItem('cart', JSON.stringify(newItems));
      return newItems;
    });
  };

  const updateCartItemQuantity = (productId, color, model, newQuantity) => {
    setCartItems(prevItems => {
      const newItems = prevItems.map(item => 
        item.product_id === productId && 
        item.color === color && 
        item.model === model
          ? { ...item, quantity: newQuantity }
          : item
      );
      localStorage.setItem('cart', JSON.stringify(newItems));
      return newItems;
    });
  };

  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem('cart');
  };

  const getToken = () => {
    return localStorage.getItem('token');
  };

  const updateWishlistCount = (productIds) => {
    setWishlistItems(productIds);
    localStorage.setItem('wishlist', JSON.stringify(productIds));
  };

  const updateCartGlobally = (items) => {
    setCartItems(items);
    localStorage.setItem("cart", JSON.stringify(items));
  };

  return (
    <AuthContext.Provider value={{
      ...authState,
      currentUser: authState.user,
      login,
      logout,
      isAdmin: authState.user?.role === 'admin',
      wishlistItems,
      toggleWishlistItem,
      updateWishlistCount ,
      cartItems,
      addToCart,
      updateCartGlobally,
      removeFromCart,
      updateCartItemQuantity,
      clearCart,
      getToken
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