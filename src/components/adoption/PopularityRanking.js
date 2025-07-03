import React from 'react';
import { useRealTimeData } from '../../contexts/RealTimeDataContext';

const PopularityRanking = ({ pets }) => {
  const { isLoading } = useRealTimeData();

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">🔥 热度排行</h3>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const sortedPets = pets.slice().sort((a, b) => b.popularity - a.popularity);

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4">🔥 热度排行</h3>
      <div className="space-y-4">
        {sortedPets.slice(0, 10).map((pet, index) => (
          <div key={pet.id} className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
              index === 0 ? 'bg-yellow-500' :
              index === 1 ? 'bg-gray-400' :
              index === 2 ? 'bg-orange-400' :
              'bg-blue-500'
            }`}>
              {index + 1}
            </div>
            
            <img 
              src={pet.image} 
              alt={pet.name}
              className="w-10 h-10 rounded-full object-cover"
            />
            
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-900">{pet.name}</h4>
                <div className="flex items-center space-x-1">
                  <span className="text-orange-500">🔥</span>
                  <span className="text-sm font-semibold text-orange-500">{pet.popularity}</span>
                </div>
              </div>
              <p className="text-sm text-gray-600">{pet.breed}</p>
              <p className="text-xs text-gray-500">📍 {pet.location}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PopularityRanking;