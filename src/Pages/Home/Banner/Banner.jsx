import React, { useState, useEffect } from 'react';
import './Banner.scss';
import image from "../../../assets/Images/image.jpg"
import image1 from "../../../assets/Images/image1.jpg"
import image2 from "../../../assets/Images/image2.jpg"

const Banner = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Premium banner images (using high-quality placeholder images)
  const banners = [
    {
      id: 1,
      title: "Summer Collection 2023",
      subtitle: "Luxury Redefined",
      // image: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
      image: image2,
      cta: "Shop Now",
      textPosition: "left"
    },
    {
      id: 2,
      title: "Exclusive Watches",
      subtitle: "Timeless Elegance",
      // image: "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2080&q=80",
       image: image1,
      cta: "Discover",
      textPosition: "right"
    },
    {
      id: 3,
      title: "Premium Leather",
      subtitle: "Crafted to Perfection",
      image: "https://images.unsplash.com/photo-1601924994987-69e26d50dc26?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
      cta: "Explore",
      textPosition: "center"
    }
  ];

  // Auto slide change
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev === banners.length - 1 ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(interval);
  }, [banners.length]);

  return (
    <div className="banner-container">
      <div 
        className="banner-slides" 
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
      >
        {banners.map((banner) => (
          <div 
            key={banner.id} 
            className="banner-slide"
            style={{ backgroundImage: `url(${banner.image})` }}
          >
            <div className={`banner-content ${banner.textPosition}`}>
              <h3 className="banner-subtitle">{banner.subtitle}</h3>
              <h2 className="banner-title">{banner.title}</h2>
              <button className="banner-cta">{banner.cta}</button>
            </div>
            <div className="banner-overlay"></div>
          </div>
        ))}
      </div>
      
      <div className="banner-dots">
        {banners.map((_, index) => (
          <button
            key={index}
            className={`dot ${index === currentSlide ? 'active' : ''}`}
            onClick={() => setCurrentSlide(index)}
          />
        ))}
      </div>
    </div>
  );
};

export default Banner;