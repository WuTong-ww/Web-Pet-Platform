import React, { useState, useEffect } from 'react';
import { fetchHomePagePets } from '../services/adoptionService';
import PetList from '../components/adoption/PetList';
import RegionSelector from '../components/location/RegionSelector';
import HeroSection from '../components/common/HeroSection';

const Home = () => {
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHomeData = async () => {
      setLoading(true);
      try {
        // 获取首页数据 - 仅使用Petfinder数据以确保稳定性
        const petData = await fetchHomePagePets(12); // 只加载12个宠物
        setPets(petData);
      } catch (error) {
        console.error('加载首页数据失败:', error);
      } finally {
        setLoading(false);
      }
    };

    loadHomeData();
  }, []);

  return (
    <div>
      <HeroSection />

      {/* 地区选择器组件 */}
      <div className="mb-10">
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            🌎 选择您所在的地区
          </h2>
          <RegionSelector />
        </div>
      </div>

      {/* 宠物预览列表 */}
      <div className="mb-10">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">
              🐾 最新上线的宠物
            </h2>
            <div className="text-sm text-blue-600">
              数据来源: Petfinder API
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600">正在加载宠物数据...</p>
            </div>
          ) : (
            <PetList pets={pets} limit={12} />
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;