// src/components/adoption/PopularPetsGrid.js
import React from 'react';
import { TrendingUp, Star, Award, Heart } from 'lucide-react';

const PopularPetsGrid = ({ pets }) => {
  if (!pets || pets.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">暂无热门宠物数据</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white rounded-2xl p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold flex items-center">
          <TrendingUp size={24} className="mr-2" />
          宠物热度榜
        </h3>
        <span className="text-yellow-100 text-sm">每日更新</span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {pets.slice(0, 5).map((pet, index) => (
          <div 
            key={pet.id} 
            className="bg-white/20 backdrop-blur-sm rounded-xl p-4 hover:transform hover:scale-105 transition-all duration-300 group"
          >
            <div className="relative">
              <div className="absolute -top-3 -left-3 bg-yellow-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold shadow-lg border-2 border-white group-hover:scale-110 transition-transform duration-300">
                {index === 0 ? <Award size={16} /> : index + 1}
              </div>
              <img 
                src={pet.image} 
                alt={pet.name} 
                className="w-full h-24 object-cover rounded-lg mb-2"
              />
            </div>
            
            <div className="mt-1">
              <div className="font-bold text-white">{pet.name}</div>
              <div className="text-yellow-100 text-xs">{pet.breed}</div>
              <div className="mt-1 flex items-center justify-between">
                <div className="flex items-center bg-white/20 px-2 py-0.5 rounded-full">
                  <TrendingUp size={12} className="mr-1" />
                  <span className="text-xs font-bold">{pet.popularity}%</span>
                </div>
                <button className="text-white hover:text-red-200 transition-colors duration-300">
                  <Heart size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* 热度榜详情按钮 */}
      <div className="text-center mt-4">
        <button className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-300">
          查看完整榜单
        </button>
      </div>
    </div>
  );
};

export default PopularPetsGrid;