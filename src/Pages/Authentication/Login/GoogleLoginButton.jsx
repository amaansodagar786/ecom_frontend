import React from 'react';
import { FcGoogle } from 'react-icons/fc';
import { BeatLoader } from 'react-spinners';

const GoogleLoginButton = ({ onClick, disabled }) => {
  return (
    <button
      className="google-login-button"
      onClick={onClick}
      disabled={disabled}
    >
      {disabled ? (
        <BeatLoader color="#000" size={8} />
      ) : (
        <>
          <FcGoogle className="google-icon" />
          Continue with Google
        </>
      )}
    </button>
  );
};

export default GoogleLoginButton;