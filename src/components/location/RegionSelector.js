import React from 'react';
import { useNavigate } from 'react-router-dom';

const RegionSelector = ({ onRegionSelect }) => {
  const navigate = useNavigate();
  
  // 从现有locationService的数据中提取区域
  const popularRegions = [
    { id: 'hong_kong', name: '香港', nameEn: 'Hong Kong', emoji: '🇭🇰' },
    { id: 'usa_new_york', name: '纽约', nameEn: 'New York, NY', emoji: '🇺🇸' },
    { id: 'usa_los_angeles', name: '洛杉矶', nameEn: 'Los Angeles, CA', emoji: '🇺🇸' },
    { id: 'usa_chicago', name: '芝加哥', nameEn: 'Chicago, IL', emoji: '🇺🇸' },
    { id: 'china_mainland_shanghai', name: '上海', nameEn: 'Shanghai', emoji: '🇨🇳', comingSoon: true },
    { id: 'china_mainland_shenzhen', name: '深圳', nameEn: 'Shenzhen', emoji: '🇨🇳', comingSoon: true },
    { id: 'taiwan', name: '台湾', nameEn: 'Taiwan', emoji: '🇹🇼' },
    { id: 'uk', name: '英国', nameEn: 'United Kingdom', emoji: '🇬🇧' }
  ];

  const handleRegionClick = (region) => {
    if (region.comingSoon) {
      alert(`${region.name}地区正在开发中，敬请期待！`);
      return;
    }
    
    if (onRegionSelect) {
      onRegionSelect(region.nameEn);
    }
    
    // 导航到地区页面
    navigate(`/region/${region.id}`);
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {popularRegions.map(region => (
        <button
          key={region.id}
          onClick={() => handleRegionClick(region)}
          className={`p-4 rounded-lg transition-all ${
            region.comingSoon 
              ? 'bg-gray-100 text-gray-500 cursor-not-allowed relative' 
              : 'bg-blue-50 hover:bg-blue-100 text-blue-700 hover:shadow-md transform hover:scale-105'
          }`}
        >
          <div className="text-xl mb-1">{region.emoji}</div>
          <div className="font-medium">{region.name}</div>
          <div className="text-xs">{region.nameEn}</div>
          
          {region.comingSoon && (
            <div className="absolute top-1 right-1 bg-yellow-500 text-white text-xs px-1 rounded-sm transform rotate-12">
              即将上线
            </div>
          )}
        </button>
      ))}
    </div>
  );
};

export default RegionSelector;