// 创建 src/components/common/FluffyButton.js
import React from 'react';

const FluffyButton = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  size = 'medium',
  disabled = false,
  className = ''
}) => {
  const baseClasses = `
    relative overflow-hidden font-medium transition-all duration-300
    transform hover:scale-105 active:scale-95
    border-2 border-transparent
    ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
  `;
  
  const variants = {
    primary: 'bg-gradient-to-r from-pink-300 to-purple-300 text-white hover:from-pink-400 hover:to-purple-400',
    secondary: 'bg-gradient-to-r from-blue-200 to-indigo-200 text-gray-700 hover:from-blue-300 hover:to-indigo-300',
    heart: 'bg-gradient-to-r from-red-200 to-pink-200 text-red-700 hover:from-red-300 hover:to-pink-300'
  };
  
  const sizes = {
    small: 'px-4 py-2 text-sm rounded-xl',
    medium: 'px-6 py-3 text-base rounded-2xl',
    large: 'px-8 py-4 text-lg rounded-3xl'
  };
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      <span className="relative z-10">{children}</span>
      <div className="absolute inset-0 bg-gradient-to-r from-white to-transparent opacity-0 hover:opacity-20 transition-opacity duration-300"></div>
    </button>
  );
};

export default FluffyButton;