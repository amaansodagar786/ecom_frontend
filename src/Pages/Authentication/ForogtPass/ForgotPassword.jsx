import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './ForgotPassword.scss';
import axios from 'axios';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState(1); // 1: email, 2: OTP, 3: new password
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleGetOtp = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Validate email
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Please enter a valid email address');
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.post(`${import.meta.env.VITE_SERVER_API}/send-otp`, { email });
      
      if (response.status === 200) {
        toast.success(`OTP sent to ${email}`);
        setStep(2);
      } else {
        toast.error(response.data.message || 'Failed to send OTP');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to send OTP. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    if (!otp) {
      toast.error('Please enter the OTP');
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.post(`${import.meta.env.VITE_SERVER_API}/verify-otp`, {
        email,
        otp
      });
      
        
      
      if (response.status === 200) {
        toast.success('OTP verified successfully');
        setStep(3);
      } else {
        toast.error(response.data.message || 'OTP verification failed');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Invalid OTP. Please check and try again.';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    if (!newPassword || !confirmPassword) {
      toast.error('Please fill in all fields');
      setIsLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      setIsLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.post(`${import.meta.env.VITE_SERVER_API}/reset-password`, {
        
        email,
        new_password: newPassword,
        confirm_password: confirmPassword
      });
      
      if (response.status === 200) {
        toast.success('Password updated successfully!');
        navigate('/login');
      } else {
        toast.error(response.data.message || 'Failed to reset password');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to reset password. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="forgot-password-container">
      <div className="forgot-password-card">
        <div className="card-header">
          <h2>Reset Your Password</h2>
          <p>
            {step === 1 && 'Enter your email to receive an OTP'}
            {step === 2 && 'Enter the OTP sent to your email'}
            {step === 3 && 'Create a new password'}
          </p>
        </div>

        <form onSubmit={
          step === 1 ? handleGetOtp : 
          step === 2 ? handleVerifyOtp : 
          handleResetPassword
        }>
          {step === 1 && (
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your registered email"
                required
              />
            </div>
          )}

          {step === 2 && (
            <div className="form-group">
              <label htmlFor="otp">OTP Verification</label>
              <input
                type="text"
                id="otp"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter 4-digit OTP"
                maxLength="4"
                pattern="\d{4}"
                required
              />
              <p className="otp-note">
                We've sent a verification code to your email
              </p>
            </div>
          )}

          {step === 3 && (
            <>
              <div className="form-group">
                <label htmlFor="newPassword">New Password</label>
                <input
                  type="password"
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password (min 8 characters)"
                  minLength="8"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your new password"
                  minLength="8"
                  required
                />
              </div>
            </>
          )}

          <button 
            type="submit" 
            className="submit-btn"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="spinner"></span>
            ) : (
              <>
                {step === 1 && 'Get OTP'}
                {step === 2 && 'Verify OTP'}
                {step === 3 && 'Reset Password'}
              </>
            )}
          </button>

          {step !== 1 && (
            <button 
              type="button" 
              className="back-btn"
              onClick={() => setStep(step - 1)}
              disabled={isLoading}
            >
              Back
            </button>
          )}
        </form>

        <div className="card-footer">
          <p>
            Remember your password?{' '}
            <span onClick={() => navigate('/login')}>Login here</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;