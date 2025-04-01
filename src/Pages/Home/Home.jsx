import React from 'react';
import Categories from './Categories/Categories';
import './Home.scss';
import Banner from './Banner/Banner';
import HomeProducts from './Homeproducts/HomeProducts.jsx';

const Home = () => {
  return (
    <div className="home-page">
      <Banner/>
      <Categories />
      <HomeProducts />
      
    </div>
  );
};

export default Home;