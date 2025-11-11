import React, { useState, useEffect } from 'react';

interface GoldenHourBannerProps {
  endTime: number;
  multiplier: number;
}

const GoldenHourBanner: React.FC<GoldenHourBannerProps> = ({ endTime, multiplier }) => {
  const [timeLeft, setTimeLeft] = useState(endTime - Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(endTime - Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [endTime]);

  const formatTime = (ms: number) => {
    if (ms < 0) return '00:00';
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  if (timeLeft < 0) return null;

  return (
    <div className="sticky top-[84px] z-20 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-black text-center py-2 px-4 shadow-lg animate-pulse-gold">
      <div className="container mx-auto flex justify-center items-center gap-4">
        <span className="font-bold text-lg animate-pulse">GOLDEN HOUR!</span>
        <span className="hidden sm:inline">|</span>
        <span className="font-semibold">{multiplier}x Points are now active!</span>
        <span className="hidden md:inline">|</span>
        <span className="font-mono font-bold text-lg tabular-nums">{formatTime(timeLeft)} left</span>
      </div>
    </div>
  );
};

export default GoldenHourBanner;
