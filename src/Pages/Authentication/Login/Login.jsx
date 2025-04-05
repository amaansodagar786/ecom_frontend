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
        
        setTimeout(() => {
          navigate(event.data.user.role === 'admin' ? '/admindashboard' : '/');
        }, 1500);
      }

      window.removeEventListener('message', handleMessage);
      googleAuthWindow?.close();
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

      setTimeout(() => {
        if (user.role === 'admin') {
          navigate('/admindashboard');
        } else {
          navigate('/');
        }
      }, 1500);
    } catch (error) {
      console.error("Login error:", error.response?.data || error);
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
                <a href="/forgot-password" className="forgot-password">
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