import React from 'react'
import './Loader.scss'
import logo from '../../assets/Images/mtm-logo.jpg'

const Loader = () => {
  return (
    <div className="loader-container">
      <img src={logo} alt="Loading..." className="loader-logo" />
    </div>
  );
}

export default Loader
