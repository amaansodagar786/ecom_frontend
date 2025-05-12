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
    const initializeAuth = async () => {
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
          
          // Fetch server data on initial load if authenticated
          await fetchServerCart();
          
          setWishlistItems(wishlist);
        } else {
          // Guest user - just use localStorage
          setAuthState(prev => ({ ...prev, isLoading: false }));
          setCartItems(cart);
          setWishlistItems(wishlist);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    };
  
    initializeAuth();
  }, []);


const fetchServerCart = async () => {
  try {
    const token = getToken();
    console.log('Fetching server cart...');
    const response = await axios.get(
      `${import.meta.env.VITE_SERVER_API}/cart/getbycustid`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    console.log('Server cart response:', response.data);
    
    if (response.data.success && response.data.cart.items) {
      const formattedItems = response.data.cart.items.map(item => {
        // Debug the image structure
        console.log('Original item image data:', {
          product_image: item.product?.image_url,
          color_image: item.color?.image_url,
          item_images: item.product?.images,
          color_images: item.color?.images
        });

        // Get the first available image in priority order:
        // 1. Color-specific image
        // 2. Product image
        // 3. First image from product images array
        const firstImage = 
          item.color?.image_url || 
          item.product?.image_url ||
          (item.product?.images?.[0]?.image_url) ||
          (item.color?.images?.[0]?.image_url) ||
          null;

        console.log('Selected image:', firstImage);

        return {
          product_id: item.product.product_id,
          name: item.product.name,
          price: item.product.price || (item.color ? item.color.price : null),
          original_price: item.product.original_price || (item.color ? item.color.original_price : null),
          quantity: item.quantity,
          color: item.color ? item.color.name : '',
          model: item.model ? item.model.name : '',
          color_id: item.color ? item.color.color_id : null,
          model_id: item.model ? item.model.model_id : null,
          image: firstImage
        };
      });
      
      console.log('Formatted cart items:', formattedItems);
      setCartItems(formattedItems);
      localStorage.setItem('cart', JSON.stringify(formattedItems));
    }
  } catch (err) {
    console.error('Error fetching cart:', err.response?.data || err.message);
  }
};

  const login = async (token, user, navigate) => {
    try {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setAuthState({
        isAuthenticated: true,
        user,
        token,
        isLoading: false
      });
      
      // Fetch server data after login
      await fetchServerCart();
      
      if (navigate) navigate('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const logout = (navigate) => {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.removeItem('pendingCartItem');
      sessionStorage.removeItem('returnAfterLogin');
      
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
      price: product.price || selectedColor?.price || selectedModel?.colors?.[0]?.price,
      image: product.image || selectedColor?.images?.[0]?.image_url || product.images?.[0]?.image_url,
      category: product.category
    };
  
    // Check if item exists
    const exists = wishlistItems.some(item => 
      item.product_id === wishlistItem.product_id &&
      item.model_id === wishlistItem.model_id &&
      item.color_id === wishlistItem.color_id
    );
  
    // Optimistic UI update
    const newWishlist = exists
      ? wishlistItems.filter(item => 
          item.product_id !== wishlistItem.product_id ||
          item.model_id !== wishlistItem.model_id ||
          item.color_id !== wishlistItem.color_id
        )
      : [...wishlistItems, wishlistItem];
  
    setWishlistItems(newWishlist);
    localStorage.setItem('wishlist', JSON.stringify(newWishlist));
  
    // Sync with server if authenticated
    if (authState.isAuthenticated) {
      try {
        const token = getToken();
        
        if (exists) {
          // Use DELETE method for removal
          await axios.delete(
            `${import.meta.env.VITE_SERVER_API}/wishlist/deleteitem`,
            {
              headers: { Authorization: `Bearer ${token}` },
              data: { // Send data in the request body for DELETE
                product_id: wishlistItem.product_id,
                model_id: wishlistItem.model_id,
                color_id: wishlistItem.color_id
              }
            }
          );
        } else {
          // Use POST for addition
          await axios.post(
            `${import.meta.env.VITE_SERVER_API}/wishlist/additem`,
            {
              product_id: wishlistItem.product_id,
              model_id: wishlistItem.model_id,
              color_id: wishlistItem.color_id
            },
            { headers: { Authorization: `Bearer ${token}` } }
          );
        }
      } catch (err) {
        // Revert on error
        setWishlistItems(wishlistItems);
        localStorage.setItem('wishlist', JSON.stringify(wishlistItems));
        console.error('Error syncing wishlist:', err);
        throw err;
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
      updateWishlistCount,
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