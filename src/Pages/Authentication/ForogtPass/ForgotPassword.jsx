import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './ForgotPassword.scss';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState(1); // 1: email, 2: OTP, 3: new password
  const [isLoading, setIsLoading] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState(null); // In production, this would come from backend
  const navigate = useNavigate();

  // Mock function to simulate backend OTP generation
  const generateMockOtp = () => {
    return Math.floor(1000 + Math.random() * 9000).toString();
  };

  const handleGetOtp = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Validate email
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Please enter a valid email address');
      setIsLoading(false);
      return;
    }

    // Simulate API call
    try {
      // In a real app, this would be an API call to your backend
      await new Promise(resolve => setTimeout(resolve, 1000));
      const mockOtp = generateMockOtp();
      setGeneratedOtp(mockOtp);
      
      // In production, backend would send this to user's email
      console.log('Mock OTP sent to email:', mockOtp); // Remove in production
      
      toast.success(`OTP sent to ${email}`);
      setStep(2);
    } catch (error) {
      toast.error('Failed to send OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    
    if (!otp) {
      toast.error('Please enter the OTP');
      return;
    }

    if (otp === generatedOtp) {
      toast.success('OTP verified successfully');
      setStep(3);
    } else {
      toast.error('Invalid OTP. Please check and try again.');
    }
  };

  const handleResetPassword = (e) => {
    e.preventDefault();
    
    if (!newPassword || !confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    // Simulate API call to reset password
    setIsLoading(true);
    try {
      // In a real app, this would be an API call to your backend
      setTimeout(() => {
        toast.success('Password updated successfully!');
        navigate('/login');
      }, 1000);
    } catch (error) {
      toast.error('Failed to reset password. Please try again.');
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