import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchPetsByRegion } from '../services/adoptionService';
import { getPlatformsByRegion } from '../services/locationService';
import PetList from '../components/adoption/PetList';
import PlatformList from '../components/location/PlatformList';

const RegionDetail = () => {
  const { regionId } = useParams();
  const [regionInfo, setRegionInfo] = useState(null);
  const [pets, setPets] = useState([]);
  const [platforms, setPlatforms] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // 从regionId解析实际区域名称
  const getRegionName = (id) => {
    const regionMap = {
      'hong_kong': { name: '香港', nameEn: 'Hong Kong' },
      'usa_new_york': { name: '纽约', nameEn: 'New York, NY' },
      'usa_los_angeles': { name: '洛杉矶', nameEn: 'Los Angeles, CA' },
      'usa_chicago': { name: '芝加哥', nameEn: 'Chicago, IL' },
      'usa_houston': { name: '休斯顿', nameEn: 'Houston, TX' },
      'taiwan': { name: '台湾', nameEn: 'Taiwan' },
      'uk': { name: '英国', nameEn: 'United Kingdom' },
      'china_mainland_shanghai': { name: '上海', nameEn: 'Shanghai' },
      'china_mainland_shenzhen': { name: '深圳', nameEn: 'Shenzhen' }
    };
    
    return regionMap[id] || { name: '未知地区', nameEn: 'Unknown Region' };
  };
  
  useEffect(() => {
    const loadRegionData = async () => {
      setLoading(true);
      try {
        const region = getRegionName(regionId);
        setRegionInfo(region);
        
        // 获取地区平台数据
        const platformData = await getPlatformsByRegion(regionId);
        setPlatforms(platformData);
        
        // 获取地区宠物数据
        const petData = await fetchPetsByRegion(region.nameEn, 20);
        setPets(petData);
        
      } catch (error) {
        console.error('加载地区数据失败:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadRegionData();
  }, [regionId]);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return (
    <div>
      {/* 面包屑导航 */}
      <div className="mb-6">
        <div className="text-sm breadcrumbs">
          <ul className="flex space-x-2 text-gray-500">
            <li><Link to="/" className="hover:text-blue-600">首页</Link></li>
            <li className="before:content-['/'] before:mx-2">地区</li>
            <li className="text-blue-600">{regionInfo?.name}</li>
          </ul>
        </div>
      </div>
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {regionInfo?.name} 地区宠物领养
        </h1>
        <p className="text-gray-600">
          浏览 {regionInfo?.nameEn} 地区的可爱宠物和领养平台
        </p>
      </div>
      
      {/* 领养平台列表 */}
      <div className="mb-10">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            📍 {regionInfo?.name} 地区领养平台
          </h2>
          <PlatformList platforms={platforms} />
        </div>
      </div>
      
      {/* 宠物列表 */}
      <div className="mb-10">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            🐾 {regionInfo?.name} 地区待领养宠物
          </h2>
          {pets.length > 0 ? (
            <PetList pets={pets} />
          ) : (
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">暂无宠物数据</h3>
              <p className="text-gray-600">该地区暂时没有可用的宠物数据，请稍后再试</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RegionDetail;