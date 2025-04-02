import { useState, useEffect } from 'react';
import { FiMenu, FiX } from 'react-icons/fi';
import UserSidebar from '../../User/SideBar/userSidebar';
import './UserLayout.scss';

const UserLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      setSidebarOpen(!mobile);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    if (isMobile) setSidebarOpen(false);
  };

  return (
    <div className="user-panel">
      {/* Mobile Header */}
      {isMobile && (
        <div className="mobile-header">
          <button className="toggle-btn" onClick={toggleSidebar}>
            {sidebarOpen ? <FiX size={20} /> : <FiMenu size={20} />}
          </button>
        </div>
      )}

      {/* Sidebar Overlay */}
      {isMobile && sidebarOpen && (
        <div className="sidebar-overlay" onClick={closeSidebar} />
      )}

      <UserSidebar 
        isOpen={sidebarOpen} 
        toggleSidebar={toggleSidebar}
        isMobile={isMobile}
      />
      
      <main className={`user-content ${sidebarOpen && !isMobile ? 'sidebar-open' : 'sidebar-closed'}`}>
        {children}
      </main>
    </div>
  );
};

export default UserLayout;