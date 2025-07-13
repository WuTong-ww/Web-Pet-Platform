// src/components/maps/PetActivityMap.js
import React, { useState, useEffect } from 'react';

const PetActivityMap = ({ activities }) => {
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  
  // 在实际应用中，这里会使用谷歌地图或高德地图API
  // 为演示目的，我们创建一个简单的模拟地图可视化
  
  useEffect(() => {
    setTimeout(() => setMapLoaded(true), 1000);
  }, []);
  
  const getIconColor = (type) => {
    switch (type) {
      case 'shelter': return 'bg-blue-500';
      case 'event': return 'bg-green-500';
      case 'vet': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };
  
  const getIconEmoji = (type) => {
    switch (type) {
      case 'shelter': return '🏠';
      case 'event': return '🎉';
      case 'vet': return '🏥';
      default: return '📍';
    }
  };
  
  if (!mapLoaded) {
    return (
      <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-2">🗺️</div>
          <div className="text-gray-600">地图加载中...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-96 bg-gradient-to-br from-blue-100 to-green-100 rounded-lg overflow-hidden">
      <div className="absolute inset-0 bg-white bg-opacity-50">
        {activities.map((activity, index) => (
          <div
            key={index}
            className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer hover:scale-110 transition-all ${getIconColor(activity.type)} w-8 h-8 rounded-full flex items-center justify-center text-white shadow-lg`}
            style={{
              left: `${20 + (index % 4) * 20}%`,
              top: `${30 + Math.floor(index / 4) * 25}%`
            }}
            onClick={() => setSelectedActivity(activity)}
          >
            {getIconEmoji(activity.type)}
          </div>
        ))}
      </div>
      
      {selectedActivity && (
        <div className="absolute bottom-4 left-4 bg-white p-4 rounded-lg shadow-lg max-w-xs">
          <h4 className="font-bold">{selectedActivity.name}</h4>
          <p className="text-sm text-gray-600">{selectedActivity.address}</p>
          <p className="text-xs text-gray-500 mt-2">{selectedActivity.description}</p>
          <button
            onClick={() => setSelectedActivity(null)}
            className="mt-2 text-xs text-blue-600 hover:text-blue-800"
          >
            关闭
          </button>
        </div>
      )}
    </div>
  );
};

export default PetActivityMap;