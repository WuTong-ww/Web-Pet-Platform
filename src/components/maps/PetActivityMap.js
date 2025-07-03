// src/components/maps/PetActivityMap.js
import React, { useState, useEffect } from 'react';
import { MapPin, Star, Calendar, Clock, Navigation, Info } from 'lucide-react';

const PetActivityMap = ({ activities }) => {
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  
  // 在实际应用中，这里会使用谷歌地图或高德地图API
  // 为演示目的，我们创建一个简单的模拟地图可视化
  
  useEffect(() => {
    // 模拟地图加载
    const timer = setTimeout(() => {
      setMapLoaded(true);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  const getIconColor = (type) => {
    switch (type) {
      case "宠物公园": return "bg-green-500";
      case "宠物咖啡厅": return "bg-orange-500";
      case "宠物医院": return "bg-red-500";
      case "宠物用品店": return "bg-blue-500";
      case "宠物训练场": return "bg-purple-500";
      case "宠物美容院": return "bg-pink-500";
      case "宠物友好餐厅": return "bg-amber-500";
      case "宠物酒店": return "bg-indigo-500";
      default: return "bg-gray-500";
    }
  };
  
  const getIconEmoji = (type) => {
    switch (type) {
      case "宠物公园": return "🌳";
      case "宠物咖啡厅": return "☕";
      case "宠物医院": return "🏥";
      case "宠物用品店": return "🛒";
      case "宠物训练场": return "🦮";
      case "宠物美容院": return "✂️";
      case "宠物友好餐厅": return "🍽️";
      case "宠物酒店": return "🏨";
      default: return "📍";
    }
  };
  
  if (!mapLoaded) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-600">正在加载地图...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="relative w-full h-full bg-blue-50 overflow-hidden">
      {/* 模拟地图背景 */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-80"
        style={{ backgroundImage: "url('https://source.unsplash.com/1600x900/?map,city')" }}
      ></div>
      
      {/* 地图图例 */}
      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-xl p-3 shadow-lg z-10">
        <div className="text-sm font-semibold mb-2">地图图例</div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          <div className="flex items-center text-xs">
            <span className="w-3 h-3 rounded-full bg-green-500 mr-1"></span>
            <span>宠物公园</span>
          </div>
          <div className="flex items-center text-xs">
            <span className="w-3 h-3 rounded-full bg-orange-500 mr-1"></span>
            <span>宠物咖啡厅</span>
          </div>
          <div className="flex items-center text-xs">
            <span className="w-3 h-3 rounded-full bg-red-500 mr-1"></span>
            <span>宠物医院</span>
          </div>
          <div className="flex items-center text-xs">
            <span className="w-3 h-3 rounded-full bg-blue-500 mr-1"></span>
            <span>宠物用品店</span>
          </div>
        </div>
      </div>
      
      {/* 活动标记 */}
      {activities.map((activity) => {
        // 为模拟地图生成随机位置
        const left = `${10 + Math.random() * 80}%`;
        const top = `${10 + Math.random() * 80}%`;
        
        return (
          <div
            key={activity.id}
            className={`absolute rounded-full ${getIconColor(activity.type)} text-white w-8 h-8 flex items-center justify-center cursor-pointer transform hover:scale-125 transition-transform duration-300 shadow-lg`}
            style={{ left, top }}
            onClick={() => setSelectedActivity(activity)}
            title={activity.name}
          >
            {getIconEmoji(activity.type)}
          </div>
        );
      })}
      
      {/* 当前位置标记 */}
      <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
        <div className="relative">
          <div className="bg-blue-600 w-6 h-6 rounded-full flex items-center justify-center">
            <div className="bg-white w-2 h-2 rounded-full"></div>
          </div>
          <div className="absolute -inset-2 bg-blue-500/30 rounded-full animate-ping"></div>
        </div>
        <div className="mt-1 text-xs text-center bg-white/80 px-2 py-0.5 rounded-full shadow-sm">
          当前位置
        </div>
      </div>
      
      {/* 活动详情信息窗口 */}
      {selectedActivity && (
        <div 
          className="absolute left-4 bottom-4 bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-xl z-30 max-w-sm"
          style={{ width: "300px" }}
        >
          <div className="flex justify-between items-start">
            <h3 className="font-bold text-gray-800">{selectedActivity.name}</h3>
            <button 
              className="text-gray-500 hover:text-gray-700" 
              onClick={() => setSelectedActivity(null)}
            >
              ✕
            </button>
          </div>
          <p className="text-sm text-gray-600 mb-2">{selectedActivity.type}</p>
          
          <div className="flex items-center text-gray-700 mb-1">
            <MapPin size={14} className="mr-1 text-gray-500" />
            <span className="text-sm">{selectedActivity.address}</span>
          </div>
          
          <div className="flex items-center text-gray-700 mb-1">
            <Clock size={14} className="mr-1 text-gray-500" />
            <span className="text-sm">营业时间: {selectedActivity.operatingHours}</span>
          </div>
          
          <div className="flex items-center text-gray-700 mb-3">
            <Navigation size={14} className="mr-1 text-gray-500" />
            <span className="text-sm">距离: {selectedActivity.distance}</span>
            <div className="ml-auto flex items-center text-yellow-500">
              <Star size={14} className="mr-1 fill-current" />
              <span className="text-sm font-semibold">{selectedActivity.rating}</span>
              <span className="text-xs text-gray-500 ml-1">({selectedActivity.reviewCount})</span>
            </div>
          </div>
          
          {selectedActivity.events.length > 0 && (
            <div className="mt-2 bg-blue-50 rounded-lg p-2">
              <div className="text-sm font-semibold text-blue-800 mb-1 flex items-center">
                <Calendar size={14} className="mr-1" />
                即将举行的活动
              </div>
              {selectedActivity.events.map(event => (
                <div key={event.id} className="text-xs text-blue-700 mb-1">
                  <div className="font-medium">{event.name}</div>
                  <div>{event.date} {event.time}</div>
                </div>
              ))}
            </div>
          )}
          
          <div className="mt-3 flex space-x-2">
            <button className="flex-1 bg-purple-500 text-white py-1.5 rounded-lg hover:bg-purple-600 transition-colors duration-300 text-sm font-semibold flex items-center justify-center">
              <Info size={14} className="mr-1" />
              查看详情
            </button>
            <button className="flex-1 bg-green-500 text-white py-1.5 rounded-lg hover:bg-green-600 transition-colors duration-300 text-sm font-semibold flex items-center justify-center">
              <Navigation size={14} className="mr-1" />
              导航前往
            </button>
          </div>
        </div>
      )}
      
      {/* 缩放控制 */}
      <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden">
        <button className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 text-gray-700 font-bold text-xl">
          +
        </button>
        <div className="border-t border-gray-200"></div>
        <button className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 text-gray-700 font-bold text-xl">
          -
        </button>
      </div>
    </div>
  );
};

export default PetActivityMap;