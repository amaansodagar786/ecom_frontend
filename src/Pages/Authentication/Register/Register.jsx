import React from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { FaUser, FaEnvelope, FaPhone, FaLock, FaCheck } from 'react-icons/fa';
import { BeatLoader } from 'react-spinners';
import { toast, ToastContainer } from 'react-toastify';
import { Player } from '@lottiefiles/react-lottie-player';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import animationData from '../../../assets/Animations/register.json';
import './Register.scss';

const Register = () => {
  const navigate = useNavigate();

  const initialValues = {
    name: '',
    email: '',
    mobile: '',
    password: '',
    confirmPassword: ''
  };

  const validationSchema = Yup.object().shape({
    name: Yup.string()
      .min(3, 'Name must be at least 3 characters')
      .required('Name is required'),
    email: Yup.string()
      .email('Invalid email address')
      .required('Email is required'),
    mobile: Yup.string()
      .matches(/^[0-9]{10}$/, 'Mobile number must be 10 digits')
      .required('Mobile is required'),
    password: Yup.string()
      .min(6, 'Password must be at least 6 characters')
      .required('Password is required'),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref('password'), null], 'Passwords must match')
      .required('Confirm Password is required')
  });

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      const response = await axios.post(`${import.meta.env.VITE_SERVER_API}/signup`, values);
      
      toast.success(response.data.message || 'Registration successful!');
      resetForm();
      
      setTimeout(() => {
        navigate('/login');
      }, 2500);
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Registration failed. Please try again.';
      toast.error(errorMsg);
      resetForm();
    } finally {
      setSubmitting(false);
      resetForm();
    }
  };

  return (
    <div className="register-container">
      <div className="register-animation">
        <Player
          autoplay
          loop
          src={animationData}
          className="animation-container"
          onError={(err) => console.error('Lottie error:', err)}
        />
      </div>

      {/* Mobile Animation (visible only on small screens) */}
      {/* <div className="mobile-animation">
        <Player
          autoplay
          loop
          src={animationData}
          style={{ width: '100%', height: '100%' }}
        />
      </div> */}

      <div className="register-card">
        <h2 className="register-title">Create Account</h2>
        <p className="register-subtitle">Join our community today</p>

        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting }) => (
            <Form className="register-form">
              <div className="form-group">
                <div className="input-group">
                  <FaUser className="input-icon" />
                  <Field 
                    type="text" 
                    name="name" 
                    placeholder="Full Name" 
                    className="form-input" 
                  />
                </div>
                <ErrorMessage name="name" component="div" className="error-message" />
              </div>

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
                  <FaPhone className="input-icon" />
                  <Field 
                    type="tel" 
                    name="mobile" 
                    placeholder="Phone Number" 
                    className="form-input" 
                  />
                </div>
                <ErrorMessage name="mobile" component="div" className="error-message" />
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

              <div className="form-group">
                <div className="input-group">
                  <FaCheck className="input-icon" />
                  <Field 
                    type="password" 
                    name="confirmPassword" 
                    placeholder="Confirm Password" 
                    className="form-input" 
                  />
                </div>
                <ErrorMessage name="confirmPassword" component="div" className="error-message" />
              </div>

              <button 
                type="submit" 
                className="submit-button" 
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <BeatLoader color="#fff" size={8} />
                ) : (
                  'Register'
                )}
              </button>
            </Form>
          )}
        </Formik>

        <p className="login-link">
          Already have an account? <a href="/login">Login here</a>
        </p>
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

export default Register;