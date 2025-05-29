import React, { useEffect } from 'react';
import Categories from './Categories/Categories';
import './Home.scss';
import Banner from './Banner/Banner';
import HomeProducts from './Homeproducts/HomeProducts.jsx';

const Home = () => {

  useEffect(() => {
    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      console.log(`Home page took ${endTime - startTime}ms to load`);
    };
  }, []);
  return (
    <div className="home-page">
      <Banner />
      <Categories />
      <HomeProducts />

    </div>
  );
};

export default Home;