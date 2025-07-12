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
  const [retryCount, setRetryCount] = useState(0);

  // 生成高质量备用图片 - 使用可靠的图片源，修复类型错误
  const generateHighQualityFallback = () => {
    const petType = pet.type?.toLowerCase() || 'pet';
    const typeKeywords = {
      '狗': 'dog',
      '貓': 'cat', 
      'dog': 'dog',
      'cat': 'cat',
      '犬': 'dog',
      '猫': 'cat'
    };
    
    const keyword = typeKeywords[petType] || 'pet';
    
    // 使用可靠的Unsplash图片ID
    const reliableImageIds = {
      dog: [
        '1552053831-71594a27632d', // 金毛
        '1548199973-03cce0bbc87b', // 拉布拉多
        '1601758228041-375435679ac4', // 小狗
        '1587300003388-59208cc962cb', // 可爱小狗
        '1583512603805-3cc6b41f3edb'  // 宠物狗
      ],
      cat: [
        '1574158622682-e40e69881006', // 猫咪
        '1583337130070-e35b1b1a4fbe', // 可爱猫
        '1592194996308-7b43878e84a6', // 小猫
        '1606918801680-5e35c7e3e01a', // 宠物猫
        '1513360371669-4adf3dd7dff8'  // 橘猫
      ],
      pet: [
        '1552053831-71594a27632d',
        '1574158622682-e40e69881006',
        '1548199973-03cce0bbc87b',
        '1601758228041-375435679ac4'
      ]
    };
    
    const imageIds = reliableImageIds[keyword] || reliableImageIds.pet;
    let seedIndex = 0;
    
    // 修复类型错误 - 确保code转换为字符串
    if (pet.code) {
      const codeStr = String(pet.code);
      if (codeStr.length > 0) {
        seedIndex = parseInt(codeStr.slice(-1)) % imageIds.length;
      }
    } else if (pet.name) {
      const nameStr = String(pet.name);
      seedIndex = nameStr.length % imageIds.length;
    } else {
      seedIndex = Math.floor(Math.random() * imageIds.length);
    }
    
    const selectedId = imageIds[seedIndex];
    
    // 使用可靠的Unsplash图片
    return `https://images.unsplash.com/photo-${selectedId}?w=600&h=600&fit=crop&auto=format&q=80`;
  };

  // 生成简单的SVG备用图片（作为最后备选）
  const generateSimpleFallback = () => {
    const safeName = String(pet.name || 'Pet').replace(/[<>&"']/g, '').substring(0, 10);
    const safeBreed = String(pet.breed || 'Unknown').replace(/[<>&"']/g, '').substring(0, 15);
    
    const colors = [
      '#E3F2FD', '#F3E5F5', '#E8F5E8', '#FFF3E0', 
      '#FCE4EC', '#E1F5FE', '#F1F8E9', '#FFF8E1'
    ];
    const bgColor = colors[Math.floor(Math.random() * colors.length)];
    
    const svgContent = `
      <svg width="600" height="600" xmlns="http://www.w3.org/2000/svg">
        <rect width="600" height="600" fill="${bgColor}" rx="12"/>
        <text x="300" y="240" font-family="Arial, sans-serif" font-size="180" text-anchor="middle" dominant-baseline="middle" fill="#333">${pet.emoji || '🐾'}</text>
        <text x="300" y="380" font-family="Arial, sans-serif" font-size="36" text-anchor="middle" dominant-baseline="middle" fill="#666">${safeName}</text>
        <text x="300" y="430" font-family="Arial, sans-serif" font-size="24" text-anchor="middle" dominant-baseline="middle" fill="#999">${safeBreed}</text>
        <text x="300" y="480" font-family="Arial, sans-serif" font-size="18" text-anchor="middle" dominant-baseline="middle" fill="#bbb">SPCA</text>
      </svg>
    `;
    
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgContent)}`;
  };

  // 生成替代备用图片
  const generateAlternativeFallback = () => {
    const petType = pet.type?.toLowerCase() || 'pet';
    
    // 使用不同的图片源作为备用
    const alternativeImages = {
      dog: [
        '1583337130070-e35b1b1a4fbe',
        '1587300003388-59208cc962cb',
        '1592194996308-7b43878e84a6'
      ],
      cat: [
        '1552053831-71594a27632d',
        '1548199973-03cce0bbc87b',
        '1601758228041-375435679ac4'
      ]
    };
    
    const images = alternativeImages[petType] || alternativeImages.dog;
    const randomIndex = Math.floor(Math.random() * images.length);
    
    return `https://images.unsplash.com/photo-${images[randomIndex]}?w=600&h=600&fit=crop&auto=format&q=80`;
  };

  const handleImageLoad = () => {
    setIsLoading(false);
    setImageError(false);
    setRetryCount(0);
  };

  const handleImageError = () => {
    setIsLoading(false);
    setImageError(true);
    
    console.log(`❌ 图片加载失败: ${pet.name}`);
    console.log(`   当前图片URL: ${imageSrc}`);
    console.log(`   宠物来源: ${pet.source}`);
    console.log(`   所有图片URLs: `, pet.images);
    
    if (showFallback && retryCount < 3) {
      console.log(`🔄 图片加载失败，尝试备用方案 (${retryCount + 1}/3):`, pet.name);
      
      if (retryCount === 0) {
        // 第一次失败，尝试其他图片
        if (pet.images && Array.isArray(pet.images) && pet.images.length > 1) {
          const currentIndex = pet.images.indexOf(imageSrc);
          const nextIndex = (currentIndex + 1) % pet.images.length;
          const nextImage = pet.images[nextIndex];
          
          console.log(`   尝试下一张图片: ${nextImage}`);
          setImageSrc(nextImage);
          setRetryCount(1);
          setImageError(false);
          setIsLoading(true);
        } else {
          // 没有其他图片，使用高质量备用图片
          const highQualityFallback = generateHighQualityFallback();
          console.log(`   使用高质量备用图片: ${highQualityFallback}`);
          setImageSrc(highQualityFallback);
          setRetryCount(1);
          setImageError(false);
          setIsLoading(true);
        }
      } else if (retryCount === 1) {
        // 第二次失败，使用不同的备用图片
        const alternativeFallback = generateAlternativeFallback();
        console.log(`   使用替代备用图片: ${alternativeFallback}`);
        setImageSrc(alternativeFallback);
        setRetryCount(2);
        setImageError(false);
        setIsLoading(true);
      } else if (retryCount === 2) {
        // 第三次失败，使用SVG备用图片
        const svgFallback = generateSimpleFallback();
        console.log(`   使用SVG备用图片: ${svgFallback.substring(0, 100)}...`);
        setImageSrc(svgFallback);
        setRetryCount(3);
        setImageError(false);
        setIsLoading(false);
      }
    } else {
      console.log(`❌ ${pet.name} 所有图片加载方案都失败了`);
    }
  };

  const handleRetry = () => {
    setImageError(false);
    setIsLoading(true);
    setRetryCount(0);
    
    // 尝试原始图片，如果失败会触发备用方案
    if (pet.images && pet.images.length > 1) {
      // 如果有多张图片，尝试下一张
      const currentIndex = pet.images.indexOf(imageSrc);
      const nextIndex = (currentIndex + 1) % pet.images.length;
      setImageSrc(pet.images[nextIndex]);
    } else {
      setImageSrc(pet.image);
    }
  };

  useEffect(() => {
    // 重置状态当pet改变时
    if (pet.image && pet.image !== imageSrc) {
      setImageSrc(pet.image);
      setImageError(false);
      setIsLoading(true);
      setRetryCount(0);
    }
  }, [pet.image, pet.id]);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* 主要图片 - 添加crossOrigin属性 */}
      <img
        src={imageSrc}
        alt={pet.name}
        crossOrigin="anonymous"
        referrerPolicy="no-referrer"
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
            {retryCount > 0 && (
              <div className="text-xs text-gray-500 mt-1">
                备用方案 {retryCount}/3
              </div>
            )}
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
              onClick={handleRetry}
              className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
            >
              重试
            </button>
          </div>
        </div>
      )}
      
      {/* 图片来源标识 - 只在SPCA且成功加载时显示 */}
      {pet.source === 'spca' && !isLoading && !imageError && (
        <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
          SPCA {retryCount > 0 ? `(备用${retryCount})` : ''}
        </div>
      )}
      
      {/* 完全移除调试信息显示 */}
    </div>
  );
};

export default PetImage;