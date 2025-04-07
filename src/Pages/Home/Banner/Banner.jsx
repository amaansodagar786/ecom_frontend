import React, { useState, useEffect } from 'react';
import './Banner.scss';
import banner from '../../../assets/Images/banner.jpg';
import mobilebanner from '../../../assets/Images/mobilebanner.jpg';

const Banner = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="banner-container">
      <div 
        className="banner-slide"
        style={{ backgroundImage: `url(${isMobile ? mobilebanner : banner})` }}
      >
        <div className="banner-content center">
          {/* <h3 className="banner-subtitle">Luxury Redefined</h3> */}
          {/* <h2 className="banner-title">Power Up Your Life with the Best in Tech!</h2> */}
          {/* <button className="banner-cta">Shop Now</button> */}
        </div>
        <div className="banner-overlay"></div>
      </div>
    </div>
  );
};

export default Banner;
