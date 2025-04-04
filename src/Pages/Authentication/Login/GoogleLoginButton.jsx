// src/components/Auth/GoogleLoginButton.jsx
import React from 'react';
import { FcGoogle } from 'react-icons/fc';
import './GoogleLoginButton.scss';

const GoogleLoginButton = ({ onClick, disabled }) => {
  return (
    <button 
      className="google-login-button"
      onClick={onClick}
      disabled={disabled}
    >
      <FcGoogle className="google-icon" />
      Continue with Google
    </button>
  );
};

export default GoogleLoginButton;