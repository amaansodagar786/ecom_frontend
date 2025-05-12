// Update your Login.jsx
import React from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { FaEnvelope, FaLock } from 'react-icons/fa';
import { BeatLoader } from 'react-spinners';
import { toast, ToastContainer } from 'react-toastify';
import { Player } from '@lottiefiles/react-lottie-player';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import 'react-toastify/dist/ReactToastify.css';
import './Login.scss';
import animationData from '../../../assets/Animations/login.json';
import { useAuth } from '../../../Components/Context/AuthContext';
import GoogleLoginButton from './GoogleLoginButton';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [isGoogleLoading, setIsGoogleLoading] = React.useState(false);

  const initialValues = {
    email: '',
    password: ''
  };

  const validationSchema = Yup.object().shape({
    email: Yup.string()
      .email('Invalid email address')
      .required('Email is required'),
    password: Yup.string()
      .min(6, 'Password must be at least 6 characters')
      .required('Password is required')
  });

  // Update the handleGoogleLogin function
  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    try {
        const width = 500;
        const height = 600;
        const left = (window.innerWidth - width) / 2;
        const top = (window.innerHeight - height) / 2;

        const googleAuthWindow = window.open(
            `${import.meta.env.VITE_SERVER_API}/login/google`,
            'GoogleAuth',
            `width=${width},height=${height},top=${top},left=${left}`
        );

        const handleMessage = (event) => {
            if (event.origin !== window.location.origin) return;

            if (event.data.error) {
                toast.error(event.data.error);
                googleAuthWindow?.close();
                return;
            }

            if (event.data.token && event.data.user) {
                login(event.data.token, event.data.user);
                toast.success('Google login successful!');

                // Get all possible flow indicators
                const pendingBuyNowItem = JSON.parse(sessionStorage.getItem('pendingBuyNowItem'));
                const pendingCartItem = JSON.parse(sessionStorage.getItem('pendingCartItem'));
                const returnPath = sessionStorage.getItem('returnAfterLogin');
                
                // Check for Buy Now flow (same logic as regular login)
                const isFromBuyNow = location.state?.isFromBuyNow || 
                                    (pendingBuyNowItem && returnPath === '/checkout');

                // 1. Buy Now flow takes highest priority
                if (isFromBuyNow && pendingBuyNowItem) {
                    sessionStorage.removeItem('pendingBuyNowItem');
                    sessionStorage.removeItem('returnAfterLogin');
                    
                    setTimeout(() => {
                        navigate('/checkout', {
                            state: {
                                buyNowItem: pendingBuyNowItem,
                                isBuyNowFlow: true
                            },
                            replace: true
                        });
                    }, 1500);
                }
                // 2. Add to Cart flow
                else if (pendingCartItem) {
                    try {
                        const payload = {
                            product_id: pendingCartItem.product_id,
                            model_id: pendingCartItem.model_id,
                            color_id: pendingCartItem.color_id,
                            quantity: pendingCartItem.quantity
                        };

                        axios.post(
                            `${import.meta.env.VITE_SERVER_API}/cart/additem`,
                            payload,
                            { headers: { 'Authorization': `Bearer ${event.data.token}` } }
                        )
                        .then(() => {
                            sessionStorage.removeItem('pendingCartItem');
                            sessionStorage.removeItem('returnAfterLogin');
                            
                            setTimeout(() => {
                                navigate(returnPath || '/', {
                                    state: { shouldOpenCart: true }
                                });
                            }, 1500);
                        })
                        .catch(err => {
                            console.error('Error adding pending cart item:', err);
                            setTimeout(() => {
                                navigate(returnPath || '/');
                            }, 1500);
                        });
                    } catch (err) {
                        console.error('Error processing cart item:', err);
                        setTimeout(() => {
                            navigate(returnPath || '/');
                        }, 1500);
                    }
                }
                // 3. Normal login flow
                else {
                    setTimeout(() => {
                        navigate(event.data.user.role === 'admin' ? '/admindashboard' : (returnPath || '/'));
                    }, 1500);
                }

                window.removeEventListener('message', handleMessage);
                googleAuthWindow?.close();
            }
        };

        window.addEventListener('message', handleMessage);
    } catch (error) {
        toast.error('Google login failed. Please try again.');
    } finally {
        setIsGoogleLoading(false);
    }
};

const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
        const response = await axios.post(
            `${import.meta.env.VITE_SERVER_API}/login`, 
            values, 
            { withCredentials: true }
        );
        
        const { token, message, user } = response.data;
        login(token, user);
        toast.success(message || 'Login successful!');

        // Get all possible flow indicators
        const pendingBuyNowItem = JSON.parse(sessionStorage.getItem('pendingBuyNowItem'));
        const pendingCartItem = JSON.parse(sessionStorage.getItem('pendingCartItem'));
        const returnPath = sessionStorage.getItem('returnAfterLogin');
        
        // NEW: Check location.state first, then sessionStorage for isFromBuyNow
        const isFromBuyNow = location.state?.isFromBuyNow || 
                            (pendingBuyNowItem && returnPath === '/checkout');

        // 1. Buy Now flow takes highest priority
        if (isFromBuyNow && pendingBuyNowItem) {
            sessionStorage.removeItem('pendingBuyNowItem');
            sessionStorage.removeItem('returnAfterLogin');
            
            // Navigate immediately with the item
            navigate('/checkout', {
                state: {
                    buyNowItem: pendingBuyNowItem,
                    isBuyNowFlow: true
                },
                replace: true  // Prevent back navigation to login
            });
            return;
        }
        else if (pendingCartItem) {
            console.log('[Login] Handling Add to Cart flow...');
            try {
                const payload = {
                    product_id: pendingCartItem.product_id,
                    model_id: pendingCartItem.model_id,
                    color_id: pendingCartItem.color_id,
                    quantity: pendingCartItem.quantity
                };

                console.log('[Login] Adding pending cart item to server:', payload);
                await axios.post(
                    `${import.meta.env.VITE_SERVER_API}/cart/additem`,
                    payload,
                    { headers: { 'Authorization': `Bearer ${token}` } }
                );

                sessionStorage.removeItem('pendingCartItem');
                sessionStorage.removeItem('returnAfterLogin');

                console.log('[Login] Navigating to return path:', returnPath || '/');
                navigate(returnPath || '/', {
                    state: { shouldOpenCart: true }
                });
            } catch (err) {
                console.error('[Login] Error adding pending cart item:', err);
                navigate(returnPath || '/');
            }
        } else {
            console.log('[Login] Handling normal login flow...');
            // Normal login flow
            const destination = user.role === 'admin' ? '/admindashboard' : (returnPath || '/');
            console.log('[Login] Navigating to:', destination);
            navigate(destination);
        }
    } catch (error) {
        console.error("[Login] Login error:", error.response?.data || error);
        const errorMsg = error.response?.data?.message || 'Login failed. Please try again.';
        toast.error(errorMsg);
    } finally {
        setSubmitting(false);
    }
};

  return (
    <div className="login-container">
      <div className="login-animation">
        <Player
          autoplay
          loop
          src={animationData}
          style={{ width: '500px', height: '500px' }}
        />
      </div>

      <div className="login-card">
        <h2 className="login-title">Welcome Back</h2>
        <p className="login-subtitle">Please enter your credentials to login</p>



        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting }) => (
            <Form className="login-form">
              <div className="form-group">
                <div className="input-group">
                  <FaEnvelope className="input-icon" />
                  <Field
                    type="email"
                    name="email"
                    placeholder="Email Address"
                    className="form-input"
                  />
                </div>
                <ErrorMessage name="email" component="div" className="error-message" />
              </div>

              <div className="form-group">
                <div className="input-group">
                  <FaLock className="input-icon" />
                  <Field
                    type="password"
                    name="password"
                    placeholder="Password"
                    className="form-input"
                  />
                </div>
                <ErrorMessage name="password" component="div" className="error-message" />
              </div>

              <div className="form-options">
                <a href="/forgotpassword" className="forgot-password">
                  Forgot password?
                </a>
              </div>

              <button
                type="submit"
                className="submit-button"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <BeatLoader color="#fff" size={8} />
                ) : (
                  'Login'
                )}
              </button>
            </Form>
          )}
        </Formik>

        <div className="login-links">
          <p className="register-link">
            Don't have an account? <a href="/register">Register here</a>
          </p>
        </div>
        <div className="divider">
          <span className="divider-line"></span>
          <span className="divider-text">OR</span>
          <span className="divider-line"></span>
        </div>
        {/* Add Google Login Button */}
        <GoogleLoginButton
          className="google-login-button"
          onClick={handleGoogleLogin}
          disabled={isGoogleLoading}
        />


      </div>
      <ToastContainer
        position="top-center"
        autoClose={2500}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </div>
  );
};

export default Login;