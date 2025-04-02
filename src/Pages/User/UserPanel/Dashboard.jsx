import React from 'react';
import UserLayout from '../../User/UserPanel/UserLayout';
import "./Userdashboard.scss";

const Dashboard = () => {
  return (
    <UserLayout>
      <div className="dashboard-container">
        <h1 className="dashboard-title">My Dashboard</h1>
        
        <div className="dashboard-grid">
          {/* Dashboard content goes here */}
          <div className="welcome-message">
            <h2>Welcome back!</h2>
            <p>Here's your recent activity and account overview.</p>
          </div>
        </div>
      </div>
    </UserLayout>
  );
};

export default Dashboard;