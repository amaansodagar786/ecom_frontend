import AdminLayout from '../AdminPanel/AdminLayout';
import React from 'react'
import './Dashboard.scss'; // Import your CSS file for styling
import Loader from '../../../Components/Loader/Loader';

const Dashboard = () => {
  return (
    <AdminLayout>
      <div className="dashboard-container">
        <h1 className="dashboard-title">Dashboard Overview</h1>
        
        <div className="dashboard-grid">
          {/* Your dashboard content here */}
          <div className="stats-card">
            <h3>Total Revenue</h3>
            <p>$12,345</p>
            <span className="trend up">↑ 12% from last month</span>
          </div>
          
          {/* More dashboard content... */}
        </div>
      </div>
    </AdminLayout>
  );
};

export default Dashboard
