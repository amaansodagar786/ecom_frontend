import React from 'react';
import { Player } from '@lottiefiles/react-lottie-player';
import './Nopage.scss';

const Nopage = () => {
  return (
    <div className="no-page">
      <div className="no-page__container">
        <Player
          autoplay
          loop
          src="https://assets10.lottiefiles.com/packages/lf20_kcsr6fcp.json"
          className="no-page__animation"
        />
        <h1 className="no-page__title">404 - Page Not Found</h1>
        <p className="no-page__message">
          Oops! The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="no-page__actions">
          <a href="/" className="no-page__button">
            Go Home
          </a>
          
        </div>
      </div>
    </div>
  );
};

export default Nopage;