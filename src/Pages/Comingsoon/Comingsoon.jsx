import React, { useState, useEffect } from 'react';
import { Player } from '@lottiefiles/react-lottie-player';
import './ComingSoon.scss';
import animationData from "../../assets/Animations/Animation - 1742884234227.json"; // Now using .json

const ComingSoon = () => {
  const launchDate = new Date(2025, 3, 6);
  const [timeLeft, setTimeLeft] = useState({
    days: 0, hours: 0, minutes: 0, seconds: 0
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const difference = launchDate - now;

      if (difference <= 0) {
        clearInterval(timer);
        return;
      }

      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000)
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [launchDate]);

  return (
    <div className="coming-soon">
      <div className="coming-soon__content">
        <Player
          autoplay
          loop
          src={animationData}
          className="coming-soon__animation"
        />
        <h1 className="coming-soon__title">Coming Soon!</h1>
        <p className="coming-soon__message">
          We're working hard to bring you an amazing shopping experience.
        </p>
        <div className="coming-soon__countdown">
          {Object.entries(timeLeft).map(([unit, value]) => (
            <div key={unit} className="countdown-item">
              <span className="countdown-number">{value}</span>
              <span className="countdown-label">{unit}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ComingSoon;