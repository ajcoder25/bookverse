import React from 'react';

export const BackgroundGradient = ({ children, className = '' }) => {
  return (
    <div
      className={`relative group ${className}`}
    >
      <div
        className="absolute -inset-0.5 bg-gradient-to-r from-pink-600 to-purple-600 rounded-lg blur opacity-0"
      />
      <div className="relative">{children}</div>
    </div>
  );
}; 