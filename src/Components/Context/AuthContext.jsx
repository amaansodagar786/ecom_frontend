import { createContext, useContext, useState, useEffect } from 'react';

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

  const toggleWishlistItem = (product) => {
    setWishlistItems(prev => {
      const productId = product.product_id;
      const newWishlist = prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId];
      localStorage.setItem('wishlist', JSON.stringify(newWishlist));
      return newWishlist;
    });
  };

  const addToCart = (item) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(i => 
        i.product_id === item.product_id && 
        i.color === item.color && 
        i.model === item.model
      );
      
      let newItems;
      if (existingItem) {
        newItems = prevItems.map(i => 
          i.product_id === item.product_id && 
          i.color === item.color && 
          i.model === item.model
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        );
      } else {
        newItems = [...prevItems, item];
      }
      
      localStorage.setItem('cart', JSON.stringify(newItems));
      return newItems;
    });
  };

  // Add this function to get the token
  const getToken = () => {
    return localStorage.getItem('token');
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
      cartItems,
      addToCart,
      getToken // Make sure to include this in the context value
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