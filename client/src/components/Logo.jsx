import React from 'react';

const Logo = ({ size = 44, className = "" }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 100 100" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg" 
    className={`${className}`}
  >
    <defs>
      <linearGradient id="premium-grad" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
        <stop stopColor="#9333EA" />
        <stop offset="0.5" stopColor="#EC4899" />
        <stop offset="1" stopColor="#6366F1" />
      </linearGradient>
      <filter id="premium-glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>
    
    {/* Base Glass Layer */}
    <rect x="5" y="5" width="90" height="90" rx="24" fill="url(#premium-grad)" fillOpacity="0.2" stroke="white" strokeOpacity="0.1" strokeWidth="0.5" />
    <rect x="5" y="5" width="90" height="90" rx="24" fill="rgba(255,255,255,0.02)" />
    
    {/* Inner Decorative Rings */}
    <circle cx="50" cy="50" r="35" stroke="url(#premium-grad)" strokeWidth="1" strokeOpacity="0.2" fill="none" />
    
    {/* The Modern Note Icon */}
    <path 
      d="M48 25V62C48 67.5228 43.5228 72 38 72C32.4772 72 28 67.5228 28 62C28 56.4772 32.4772 52 38 52C40.5 52 42.5 53 44 54.5V30L72 25V55C72 60.5228 67.5228 65 62 65C56.4772 65 52 60.5228 52 55C52 49.4772 56.4772 45 62 45C64.5 45 66.5 46 68 47.5V25H48Z" 
      fill="white" 
      filter="url(#premium-glow)"
    />
    
    {/* Dynamic Highlight Spot */}
    <circle cx="30" cy="30" r="15" fill="white" fillOpacity="0.1" filter="blur(8px)" />
  </svg>
);

export default Logo;
