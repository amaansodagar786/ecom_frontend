import React, { useState, useEffect } from 'react';
import UserLayout from '../../User/UserPanel/UserLayout';
import { toast } from 'react-toastify';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';
import './Userdashboard.scss';
// import Loader from '../../../Components/Loader/Loader';

const ProfileDashboard = () => {
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    mobile: '',
    age: '',
    gender: '',
    role: '',
    google_id: null
  });
  const [editMode, setEditMode] = useState(false);
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_SERVER_API}/profile-info`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setUserData(response.data['profile-info']);
      setIsLoading(false);
    } catch (error) {
      toast.error('Failed to fetch profile data');
      console.error(error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserData(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${import.meta.env.VITE_SERVER_API}/profile`, userData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      toast.success('Profile updated successfully');
      setEditMode(false);
      fetchUserData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error('Passwords do not match');
      return;
    }

    try {
      await axios.put(`${import.meta.env.VITE_SERVER_API}/password`, {
        current_password: passwordData.current_password,
        new_password: passwordData.new_password
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      toast.success('Password updated successfully');
      setShowPasswordForm(false);
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update password');
    }
  };

  // if (isLoading) {
  //   return (
  //     <UserLayout>
  //       <Loader />
  //     </UserLayout>
  //   );
  // }

  return (
    <UserLayout>
      <div className="profile-dashboard">
        <div className="profile-header">
          <h1>My Profile</h1>
          {!editMode && (
            <button
              className="edit-btn"
              onClick={() => setEditMode(true)}
            >
              Edit Profile
            </button>
          )}
        </div>

        <div className="profile-content">
          <div className="profile-card">
            {editMode ? (
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={userData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={userData.email}
                    onChange={handleInputChange}
                    disabled={userData.google_id}
                    required
                  />
                  {userData.google_id && (
                    <small className="disabled-note">(Email cannot be changed for Google accounts)</small>
                  )}
                </div>

                <div className="form-group">
                  <label>Mobile Number</label>
                  <input
                    type="tel"
                    name="mobile"
                    value={userData.mobile || ''}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Age</label>
                    <input
                      type="number"
                      name="age"
                      value={userData.age || ''}
                      onChange={handleInputChange}
                      min="1"
                      max="120"
                    />
                  </div>

                  <div className="form-group">
                    <label>Gender</label>
                    <select
                      name="gender"
                      value={userData.gender || ''}
                      onChange={handleInputChange}
                    >
                      <option value="">Select</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="form-actions">
                  <button type="submit" className="save-btn">Save Changes</button>
                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={() => {
                      setEditMode(false);
                      fetchUserData();
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="profile-info">
                <div className="info-item">
                  <span className="info-label">Name:</span>
                  <span className="info-value">{userData.name}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Email:</span>
                  <span className="info-value">{userData.email}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Mobile:</span>
                  <span className="info-value">{userData.mobile || 'Not provided'}</span>
                </div>
                <div className="info-row">
                  <div className="info-item">
                    <span className="info-label">Age:</span>
                    <span className="info-value">{userData.age || 'Not provided'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Gender:</span>
                    <span className="info-value">{userData.gender || 'Not provided'}</span>
                  </div>
                </div>
                <div className="info-item">
                  <span className="info-label">Account Type:</span>
                  <span className="info-value">
                    {userData.google_id ? 'Google Account' : 'Email Account'}
                  </span>
                </div>
              </div>
            )}

            {!userData.google_id && (
              <div className="password-section">
                {showPasswordForm ? (
                  <form onSubmit={handlePasswordSubmit}>
                    <h3>Change Password</h3>
                    <div className="form-group">
                      <label>Current Password</label>
                      <input
                        type="password"
                        name="current_password"
                        value={passwordData.current_password}
                        onChange={handlePasswordChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>New Password</label>
                      <input
                        type="password"
                        name="new_password"
                        value={passwordData.new_password}
                        onChange={handlePasswordChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Confirm New Password</label>
                      <input
                        type="password"
                        name="confirm_password"
                        value={passwordData.confirm_password}
                        onChange={handlePasswordChange}
                        required
                      />
                    </div>
                    <div className="form-actions">
                      <button type="submit" className="save-btn">Update Password</button>
                      <button
                        type="button"
                        className="cancel-btn"
                        onClick={() => setShowPasswordForm(false)}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <button
                    className="change-password-btn"
                    onClick={() => setShowPasswordForm(true)}
                  >
                    Change Password
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <ToastContainer
        position="top-center"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />

    </UserLayout>
  );
};

export default ProfileDashboard;