import AdminLayout from '../AdminPanel/AdminLayout';
import React, { useState, useEffect } from 'react';
import { Bar, Pie, Line } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
import './Dashboard.scss';
import Loader from '../../../Components/Loader/Loader';
import {
  FiDollarSign,
  FiShoppingBag,
  FiUsers,
  FiClock,
  FiTrendingUp,
  FiPieChart,
  FiActivity,
  FiStar
} from 'react-icons/fi';
import { FaRupeeSign } from "react-icons/fa";
import axios from 'axios';

Chart.register(...registerables);

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summaryData, setSummaryData] = useState(null);
  const [bestSellers, setBestSellers] = useState([]);
  const [customerData, setCustomerData] = useState([]);
  const [timeRange, setTimeRange] = useState('week');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch all data in parallel
        const [summaryRes, sellersRes, customersRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_SERVER_API}/dashboard/summary`),
          axios.get(`${import.meta.env.VITE_SERVER_API}/dashboard/best-sellers`),
          axios.get(`${import.meta.env.VITE_SERVER_API}/dashboard/customers`)
        ]);

        setSummaryData(summaryRes.data);
        setBestSellers(sellersRes.data);
        setCustomerData(customersRes.data);

      } catch (err) {
        setError(err.message || 'Failed to fetch dashboard data');
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <Loader fullscreen />;
  if (error) return <div className="error-message">Error: {error}</div>;

  // Chart data preparation
  const revenueData = {
    labels: ['Today', 'This Week', 'This Month'],
    datasets: [
      {
        label: 'Revenue',
        data: [
          summaryData?.today_revenue || 0,
          summaryData?.week_revenue || 0,
          summaryData?.month_revenue || 0
        ],
        backgroundColor: [
          'rgba(54, 162, 235, 0.7)',
          'rgba(75, 192, 192, 0.7)',
          'rgba(153, 102, 255, 0.7)'
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)'
        ],
        borderWidth: 1,
      },
    ],
  };

  const salesChannelData = {
    labels: ['Online', 'Offline'],
    datasets: [
      {
        data: [
          summaryData?.online_offline_split?.online?.percent || 0,
          summaryData?.online_offline_split?.offline?.percent || 0
        ],
        backgroundColor: [
          'rgba(255, 99, 132, 0.7)',
          'rgba(54, 162, 235, 0.7)'
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)'
        ],
        borderWidth: 1,
      },
    ],
  };

  const bestSellersChartData = {
    labels: bestSellers.map(item => item.product.length > 20 ? item.product.slice(0, 20) + '...' : item.product),

    datasets: [
      {
        label: 'Units Sold',
        data: bestSellers.map(item => item.units_sold),
        backgroundColor: 'rgba(75, 192, 192, 0.7)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
    ],
  };

  return (
    <AdminLayout>
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1 className="dashboard-title">Dashboard Overview</h1>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stats-card primary">
            <div className="stats-icon">
              <FiDollarSign />
            </div>
            <div className="stats-content">
              <h3>Total Revenue</h3>
              <p>₹{summaryData?.month_revenue?.toLocaleString() || '0'}</p>
              <span className="trend up">
                <FiTrendingUp /> {Math.round((summaryData?.week_revenue / summaryData?.month_revenue) * 100)}% of month
              </span>
            </div>
          </div>

          <div className="stats-card success">
            <div className="stats-icon">
              <FiShoppingBag />
            </div>
            <div className="stats-content">
              <h3>Today's Sales</h3>
              <p>₹{summaryData?.today_revenue?.toLocaleString() || '0'}</p>
              <span className="trend up">
                <FiTrendingUp /> {Math.round((summaryData?.today_revenue / summaryData?.week_revenue) * 100)}% of week
              </span>
            </div>
          </div>

          <div className="stats-card warning">
            <div className="stats-icon">
              <FiClock />
            </div>
            <div className="stats-content">
              <h3>Pending Orders</h3>
              <p>{summaryData?.pending_orders || '0'}</p>
              <span className="trend neutral">
                <FiActivity /> Needs attention
              </span>
            </div>
          </div>

          <div className="stats-card info">
            <div className="stats-icon">
              <FiUsers />
            </div>
            <div className="stats-content">
              <h3>Total Customers</h3>
              <p>{customerData?.length || '0'}</p>
              <span className="trend up">
                <FiTrendingUp /> {customerData.filter(c => c.total_orders > 1).length} returning
              </span>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="charts-row">
          <div className="chart-container">
            <h3>
              <FaRupeeSign /> Revenue Overview
            </h3>
            <div className="chart-wrapper">
              <Bar
                data={revenueData}
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      position: 'top',
                    },
                  },
                }}
              />
            </div>
          </div>

          <div className="chart-container">
            <h3>
              <FiPieChart /> Sales Channels
            </h3>
            <div className="chart-wrapper">
              <Pie
                data={salesChannelData}
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      position: 'bottom',
                    },
                  },
                }}
              />
            </div>
          </div>
        </div>

        {/* Best Sellers Section */}
        <div className="best-sellers-section">
          <div className="best-sellers">
            <h3>
              <FiStar /> Best Sellers
            </h3>
            <div className="chart-wrapper">
              <Bar
                data={bestSellersChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false, // Important
                  plugins: {
                    legend: { display: false }
                  },
                  scales: {
                    x: {
                      ticks: {
                        maxRotation: 0, // Prevent rotation
                        minRotation: 0,
                        autoSkip: false,
                        font: {
                          size: 10, // Shrink font if needed
                        }
                      }
                    }
                  }
                }}
              />
            </div>
            <div className="sellers-list">
              {bestSellers.map((item, index) => (
                <div key={index} className="seller-item">
                  <span className="rank">{index + 1}</span>
                  <span className="product">{item.product}</span>
                  <span className="units">{item.units_sold} units</span>
                  <span className="revenue">₹{item.revenue.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Dashboard;