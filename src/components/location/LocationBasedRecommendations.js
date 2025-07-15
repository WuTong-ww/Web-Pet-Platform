import React, { useState, useEffect } from 'react';
import { useRealTimeData } from '../../contexts/RealTimeDataContext';
import PetList from '../adoption/PetList';
import { fetchPetsByRegion } from '../../services/adoptionService';
import { getPlatformsByRegion } from '../../services/locationService';
import PlatformList from './PlatformList';

const LocationBasedRecommendations = ({ onPetClick }) => {
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [regionPets, setRegionPets] = useState([]);
  const [platforms, setPlatforms] = useState([]);
  const [loading, setLoading] = useState(false);
  const { globalStats } = useRealTimeData();

  // 预定义地区
  const popularRegions = [
    { id: 'hong_kong', name: '香港', nameEn: 'Hong Kong', emoji: '🇭🇰', description: '浏览香港地区的SPCA等收容所宠物' },
    { id: 'usa_new_york', name: '纽约', nameEn: 'New York, NY', emoji: '🇺🇸', description: '通过Petfinder查看纽约地区宠物' },
    { id: 'usa_los_angeles', name: '洛杉矶', nameEn: 'Los Angeles, CA', emoji: '🇺🇸', description: '加州洛杉矶地区的待领养宠物' },
    { id: 'usa_chicago', name: '芝加哥', nameEn: 'Chicago, IL', emoji: '🇺🇸', description: '伊利诺伊州芝加哥的宠物收容所' },
    { id: 'china_mainland_shanghai', name: '上海', nameEn: 'Shanghai', emoji: '🇨🇳', description: '上海地区的宠物领养平台和机构', comingSoon: true },
    { id: 'china_mainland_shenzhen', name: '深圳', nameEn: 'Shenzhen', emoji: '🇨🇳', description: '深圳的宠物收容所和领养渠道', comingSoon: true },
  ];

  // 从regionId解析实际区域名称
  const getRegionName = (id) => {
    const region = popularRegions.find(r => r.id === id);
    return region || { name: '未知地区', nameEn: 'Unknown Region' };
  };

  const handleRegionSelect = async (region) => {
    if (region.comingSoon) {
      alert(`${region.name}地区正在开发中，敬请期待！`);
      return;
    }

    setLoading(true);
    setSelectedRegion(region);
    
    try {
      // 获取地区平台数据
      const platformData = await getPlatformsByRegion(region.id);
      setPlatforms(platformData);
      
      // 获取地区宠物数据
      const petData = await fetchPetsByRegion(region.nameEn, 20);
      setRegionPets(petData);
    } catch (error) {
      console.error('加载地区数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 自动选择用户所在地区
  useEffect(() => {
    if (!selectedRegion) {
      // 默认选择香港地区，实际项目中可以根据用户IP或浏览器语言自动选择
      const defaultRegion = popularRegions[0];
      handleRegionSelect(defaultRegion);
    }
  }, []);

  return (
    <div className="space-y-8">
      {/* 地区选择区域 */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">🌎 选择您所在的地区</h2>
        <p className="text-gray-600 mb-6">根据您的地区，我们将为您推荐合适的领养机构和宠物</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {popularRegions.map(region => (
            <button
              key={region.id}
              onClick={() => handleRegionSelect(region)}
              className={`p-4 rounded-lg transition-all text-left ${
                region.comingSoon 
                  ? 'bg-gray-100 text-gray-500 cursor-not-allowed relative' 
                  : selectedRegion?.id === region.id
                    ? 'bg-purple-500 text-white shadow-md'
                    : 'bg-blue-50 hover:bg-blue-100 text-blue-700 hover:shadow-md'
              }`}
            >
              <div className="flex items-center mb-2">
                <div className="text-2xl mr-2">{region.emoji}</div>
                <div>
                  <div className="font-medium">{region.name}</div>
                  <div className="text-xs opacity-80">{region.nameEn}</div>
                </div>
              </div>
              <p className={`text-sm ${selectedRegion?.id === region.id ? 'text-blue-100' : 'text-gray-600'}`}>
                {region.description}
              </p>
              
              {region.comingSoon && (
                <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs px-1 rounded-sm transform rotate-12">
                  即将上线
                </div>
              )}
            </button>
          ))}
        </div>
        
        
      </div>
      
      {/* 加载中状态 */}
      {loading && (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-600">正在加载 {selectedRegion?.name} 地区数据...</p>
        </div>
      )}
      
      {/* 已选择地区内容 */}
      {selectedRegion && !loading && (
        <>
          {/* 地区信息头部 */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl shadow-lg p-6">
            <div className="flex items-center mb-4">
              <div className="text-3xl mr-3">{selectedRegion.emoji}</div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{selectedRegion.name} 地区</h2>
                <p className="text-gray-600">{selectedRegion.nameEn}</p>
              </div>
            </div>
            
            <p className="text-gray-700 mb-4">
              以下是 {selectedRegion.name} 地区的宠物收容所和待领养宠物，您可以直接联系这些机构了解更多信息。
              {selectedRegion.id === 'hong_kong' && ' 香港地区数据来自SPCA爬取。'}
              {selectedRegion.id.startsWith('usa_') && ' 美国地区数据来自Petfinder API。'}
            </p>
          </div>
          
          {/* 领养平台列表 */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              📍 {selectedRegion.name} 地区领养平台
            </h2>
            <PlatformList platforms={platforms} />
          </div>
          
          {/* 宠物列表 */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              🐾 {selectedRegion.name} 地区待领养宠物
            </h2>
            {regionPets.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {regionPets.slice(0, 9).map(pet => (
                  <div
                    key={pet.id}
                    className="bg-white rounded-lg shadow border p-4 cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => 
                      
                      onPetClick && onPetClick(pet)}
                  >
                    <div className="aspect-square mb-4 bg-gray-200 rounded-lg overflow-hidden">
                      <img 
                        src={pet.image} 
                        alt={pet.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://via.placeholder.com/300x300?text=No+Image';
                        }}
                      />
                    </div>
                    <h3 className="font-bold text-lg">{pet.name}</h3>
                    <p className="text-gray-600 text-sm">{pet.breed} • {pet.age}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {pet.tags.slice(0, 3).map((tag, idx) => (
                        <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">暂无宠物数据</h3>
                <p className="text-gray-600">该地区暂时没有可用的宠物数据，请选择其他地区</p>
              </div>
            )}
            
            
          </div>
        </>
      )}
    </div>
  );
};

export default LocationBasedRecommendations;