import React from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { FaEnvelope, FaLock, FaUser, FaPhone, FaShieldAlt } from 'react-icons/fa';
import { BeatLoader } from 'react-spinners';
import { toast, ToastContainer } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import 'react-toastify/dist/ReactToastify.css';
import './Adminsignup.scss';

const Adminsignup = () => {
  const navigate = useNavigate();

  const initialValues = {
    name: '',
    email: '',
    mobile: '',
    password: '',
    admin_token: ''
  };

  const validationSchema = Yup.object().shape({
    name: Yup.string()
      .required('Full name is required')
      .min(3, 'Name must be at least 3 characters')
      .max(50, 'Name must not exceed 50 characters'),
    email: Yup.string()
      .email('Invalid email address')
      .required('Email is required')
      .matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email format'),
    mobile: Yup.string()
      .matches(/^[0-9]{10}$/, 'Mobile number must be exactly 10 digits')
      .required('Mobile number is required'),
    password: Yup.string()
      .min(8, 'Password must be at least 8 characters')
      .matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
        'Password must contain at least one uppercase, one lowercase, one number and one special character'
      )
      .required('Password is required'),
    admin_token: Yup.string()
      .required('Admin token is required')
  });

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_SERVER_API}/admin-signup`,
        values,
        {
          headers: {
            'Content-Type': 'application/json'
          },
          withCredentials: true
        }
      );

      toast.success(response.data.message || 'Admin account created successfully!');

      setTimeout(() => {
        resetForm();
        navigate('/login');
      }, 2500);

    } catch (error) {
      const errorMsg = error.response?.data?.message ||
        error.response?.data?.error ||
        'Signup failed. Please try again.';
      toast.error(errorMsg);

      console.log('Response data:', error.response.data);
      console.log('Response status:', error.response.status);
      console.log('Response headers:', error.response.headers);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-signup">
      <div className="signup-container">
        <div className="signup-header">
          <h1 className="signup-title">Admin Registration</h1>
          <p className="signup-subtitle">Create your administrator account</p>
        </div>

        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting, errors, touched }) => (
            <Form className="signup-form">
              <div className={`form-group ${errors.name && touched.name ? 'error' : ''}`}>
                <label htmlFor="name" className="form-label">
                  <FaUser className="input-icon" />
                  Full Name
                </label>
                <Field
                  type="text"
                  name="name"
                  id="name"
                  placeholder="Enter your full name"
                  className="form-input"
                />
                <ErrorMessage name="name" component="div" className="error-message" />
              </div>

              <div className={`form-group ${errors.email && touched.email ? 'error' : ''}`}>
                <label htmlFor="email" className="form-label">
                  <FaEnvelope className="input-icon" />
                  Email Address
                </label>
                <Field
                  type="email"
                  name="email"
                  id="email"
                  placeholder="Enter your email"
                  className="form-input"
                />
                <ErrorMessage name="email" component="div" className="error-message" />
              </div>

              <div className={`form-group ${errors.mobile && touched.mobile ? 'error' : ''}`}>
                <label htmlFor="mobile" className="form-label">
                  <FaPhone className="input-icon" />
                  Mobile Number
                </label>
                <Field
                  type="tel"
                  name="mobile"
                  id="mobile"
                  placeholder="Enter 10-digit mobile number"
                  className="form-input"
                />
                <ErrorMessage name="mobile" component="div" className="error-message" />
              </div>

              <div className={`form-group ${errors.password && touched.password ? 'error' : ''}`}>
                <label htmlFor="password" className="form-label">
                  <FaLock className="input-icon" />
                  Password
                </label>
                <Field
                  type="password"
                  name="password"
                  id="password"
                  placeholder="Create a password"
                  className="form-input"
                />
                <ErrorMessage name="password" component="div" className="error-message" />
              </div>

              <div className={`form-group ${errors.admin_token && touched.admin_token ? 'error' : ''}`}>
                <label htmlFor="admin_token" className="form-label">
                  <FaShieldAlt className="input-icon" />
                  Admin Token
                </label>
                <Field
                  type="password"
                  name="admin_token"
                  id="admin_token"
                  placeholder="Enter admin registration token"
                  className="form-input"
                />
                <ErrorMessage name="admin_token" component="div" className="error-message" />
              </div>

              <button
                type="submit"
                className="submit-button"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <BeatLoader color="#fff" size={10} />
                ) : (
                  'Register Admin Account'
                )}
              </button>
            </Form>
          )}
        </Formik>

        <div className="signup-footer">
          <p>Already have an account? <a href="/login">Sign in</a></p>
        </div>
      </div>

      <ToastContainer
        position="top-center"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        toastStyle={{
          borderRadius: '12px',
          fontFamily: "'Inter', sans-serif"
        }}
      />
    </div>
  );
};

export default Adminsignup;