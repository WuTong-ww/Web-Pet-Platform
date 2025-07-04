import React, { useState, useEffect } from 'react';

const PetImage = ({ 
  pet, 
  className = '', 
  size = 'medium',
  showFallback = true 
}) => {
  const [imageSrc, setImageSrc] = useState(pet.image);
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 生成简单的备用图片
  const generateSimpleFallback = () => {
    const safeName = String(pet.name || 'Pet').replace(/[<>&"']/g, '').substring(0, 10);
    const safeBreed = String(pet.breed || 'Unknown').replace(/[<>&"']/g, '').substring(0, 15);
    
    const colors = [
      '#E3F2FD', '#F3E5F5', '#E8F5E8', '#FFF3E0', 
      '#FCE4EC', '#E1F5FE', '#F1F8E9', '#FFF8E1'
    ];
    const bgColor = colors[Math.floor(Math.random() * colors.length)];
    
    const svgContent = `
      <svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="400" fill="${bgColor}" rx="8"/>
        <text x="200" y="160" font-family="Arial, sans-serif" font-size="120" text-anchor="middle" dominant-baseline="middle" fill="#333">${pet.emoji || '🐾'}</text>
        <text x="200" y="250" font-family="Arial, sans-serif" font-size="24" text-anchor="middle" dominant-baseline="middle" fill="#666">${safeName}</text>
        <text x="200" y="300" font-family="Arial, sans-serif" font-size="16" text-anchor="middle" dominant-baseline="middle" fill="#999">${safeBreed}</text>
      </svg>
    `;
    
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgContent)}`;
  };

  const handleImageLoad = () => {
    setIsLoading(false);
    setImageError(false);
  };

  const handleImageError = () => {
    setIsLoading(false);
    setImageError(true);
    
    if (showFallback) {
      console.log('图片加载失败，使用备用图片:', pet.name);
      setImageSrc(generateSimpleFallback());
    }
  };

  useEffect(() => {
    // 重置状态当pet改变时
    if (pet.image && pet.image !== imageSrc) {
      setImageSrc(pet.image);
      setImageError(false);
      setIsLoading(true);
    }
  }, [pet.image, pet.id]);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* 主要图片 */}
      <img
        src={imageSrc}
        alt={pet.name}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        }`}
        onLoad={handleImageLoad}
        onError={handleImageError}
        style={{
          minHeight: '100%',
          minWidth: '100%'
        }}
      />
      
      {/* 加载中的占位符 */}
      {isLoading && !imageError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 animate-pulse">
          <div className="text-center">
            <div className="text-4xl mb-2">{pet.emoji || '🐾'}</div>
            <div className="text-sm text-gray-600">加载中...</div>
          </div>
        </div>
      )}
      
      {/* 错误状态显示 */}
      {imageError && !showFallback && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-center p-4">
            <div className="text-6xl mb-2">{pet.emoji || '🐾'}</div>
            <div className="text-sm text-gray-600 mb-2">{pet.name}</div>
            <div className="text-xs text-gray-500 mb-3">图片加载失败</div>
            <button 
              onClick={() => {
                setImageError(false);
                setIsLoading(true);
                setImageSrc(pet.image);
              }}
              className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
            >
              重试
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PetImage;