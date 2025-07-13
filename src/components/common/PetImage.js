import React, { useState, useEffect } from 'react';

const PetImage = ({ 
  pet, 
  className = '', 
  size = 'medium',
  showFallback = true
}) => {
  // 清理和验证初始图片URL - 增强版本
  const cleanInitialImageUrl = (url) => {
    if (!url || typeof url !== 'string') return null;
    
    let cleanUrl = url.trim();
    
    // 如果已经是代理URL，直接使用
    if (cleanUrl.includes('/proxy/image?url=')) {
      console.log(`🌐 检测到代理URL: ${cleanUrl}`);
      return cleanUrl;
    }
    
    // 修复SPCA URL中的重复域名问题
    cleanUrl = cleanUrl.replace(/https:\/\/www\.spca\.org\.hk\/+\/www\.spca\.org\.hk/g, 'https://www.spca.org.hk');
    cleanUrl = cleanUrl.replace(/www\.spca\.org\.hk\/+\/www\.spca\.org\.hk/g, 'www.spca.org.hk');
    cleanUrl = cleanUrl.replace(/spca\.org\.hk\/+\/www\.spca\.org\.hk/g, 'spca.org.hk');
    
    // 清理多余的斜杠
    cleanUrl = cleanUrl.replace(/([^:]\/)\/+/g, '$1');
    
    // 确保URL格式正确
    if (cleanUrl.startsWith('//www.spca.org.hk')) {
      cleanUrl = 'https:' + cleanUrl;
    } else if (cleanUrl.startsWith('/www.spca.org.hk')) {
      cleanUrl = 'https:/' + cleanUrl;
    } else if (cleanUrl.startsWith('www.spca.org.hk') && !cleanUrl.startsWith('http')) {
      cleanUrl = 'https://' + cleanUrl;
    }
    
    // 如果是SPCA图片，使用代理
    if (cleanUrl.includes('www.spca.org.hk')) {
      const proxyUrl = `http://localhost:8080/proxy/image?url=${encodeURIComponent(cleanUrl)}`;
      console.log(`🔄 转换为代理URL: ${cleanUrl} -> ${proxyUrl}`);
      return proxyUrl;
    }
    
    console.log(`🔧 清理图片URL: ${url} -> ${cleanUrl}`);
    return cleanUrl;
  };
  
  const cleanImageUrl = cleanInitialImageUrl(pet.image);
  const [imageSrc, setImageSrc] = useState(cleanImageUrl);
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

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
    
    const reliableImageIds = {
      dog: [
        '1552053831-71594a27632d',
        '1548199973-03cce0bbc87b',
        '1601758228041-375435679ac4',
        '1587300003388-59208cc962cb',
        '1583512603805-3cc6b41f3edb'
      ],
      cat: [
        '1574158622682-e40e69881006',
        '1583337130070-e35b1b1a4fbe',
        '1592194996308-7b43878e84a6',
        '1606918801680-5e35c7e3e01a',
        '1513360371669-4adf3dd7dff8'
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
    
    return `https://images.unsplash.com/photo-${selectedId}?w=600&h=600&fit=crop&auto=format&q=80`;
  };

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

  const generateAlternativeFallback = () => {
    const petType = pet.type?.toLowerCase() || 'pet';
    
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
    
    // 如果是代理URL失败，尝试其他代理URL或备用图片
    if (showFallback && retryCount < 3) {
      console.log(`🔄 图片加载失败，尝试备用方案 (${retryCount + 1}/3):`, pet.name);
      
      if (retryCount === 0) {
        // 尝试其他图片（如果有的话）
        if (pet.images && Array.isArray(pet.images) && pet.images.length > 1) {
          const cleanImages = pet.images.map(cleanInitialImageUrl).filter(Boolean);
          const currentIndex = cleanImages.indexOf(imageSrc);
          const nextIndex = (currentIndex + 1) % cleanImages.length;
          const nextImage = cleanImages[nextIndex];
          
          if (nextImage && nextImage !== imageSrc) {
            console.log(`   尝试下一张图片: ${nextImage}`);
            setImageSrc(nextImage);
            setRetryCount(1);
            setImageError(false);
            setIsLoading(true);
            return;
          }
        }
        
        // 使用高质量备用图片
        const highQualityFallback = generateHighQualityFallback();
        console.log(`   使用高质量备用图片: ${highQualityFallback}`);
        setImageSrc(highQualityFallback);
        setRetryCount(1);
        setImageError(false);
        setIsLoading(true);
      } else if (retryCount === 1) {
        // 使用替代备用图片
        const alternativeFallback = generateAlternativeFallback();
        console.log(`   使用替代备用图片: ${alternativeFallback}`);
        setImageSrc(alternativeFallback);
        setRetryCount(2);
        setImageError(false);
        setIsLoading(true);
      } else if (retryCount === 2) {
        // 使用SVG备用图片
        const svgFallback = generateSimpleFallback();
        console.log(`   使用SVG备用图片`);
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
    
    if (pet.images && pet.images.length > 1) {
      const currentIndex = pet.images.indexOf(imageSrc);
      const nextIndex = (currentIndex + 1) % pet.images.length;
      setImageSrc(pet.images[nextIndex]);
    } else {
      setImageSrc(pet.image);
    }
  };

  useEffect(() => {
    const newCleanUrl = cleanInitialImageUrl(pet.image);
    if (newCleanUrl && newCleanUrl !== imageSrc) {
      setImageSrc(newCleanUrl);
      setImageError(false);
      setIsLoading(true);
      setRetryCount(0);
    }
  }, [pet.image, pet.id]);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <img
        src={imageSrc}
        alt={pet.name}
        // 移除crossOrigin和referrerPolicy，因为我们使用代理
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
    </div>
  );
};

export default PetImage;