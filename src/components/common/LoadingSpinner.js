// src/components/common/LoadingSpinner.js
import React from 'react';

const LoadingSpinner = ({ size = 'medium', text = '加载中...' }) => {
  let spinnerSize;
  switch (size) {
    case 'small':
      spinnerSize = 'h-6 w-6';
      break;
    case 'large':
      spinnerSize = 'h-16 w-16';
      break;
    case 'medium':
    default:
      spinnerSize = 'h-12 w-12';
  }

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className={`animate-spin rounded-full border-t-2 border-b-2 border-purple-500 ${spinnerSize}`}></div>
      {text && <p className="text-gray-600 mt-3">{text}</p>}
    </div>
  );
};

export default LoadingSpinner;