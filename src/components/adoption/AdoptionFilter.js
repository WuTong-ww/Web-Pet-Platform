import React, { useState, useEffect } from 'react';
import { fetchPetTypes } from '../../services/adoptionService';

const AdoptionFilter = ({ filters, updateFilters, onClose }) => {
  const [petTypes, setPetTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // 加载宠物类型
  useEffect(() => {
    const loadPetTypes = async () => {
      try {
        setIsLoading(true);
        const types = await fetchPetTypes();
        setPetTypes(types);
      } catch (error) {
        console.error('加载宠物类型失败:', error);
        // 使用默认类型
        setPetTypes([
          { name: 'Dog' },
          { name: 'Cat' },
          { name: 'Rabbit' },
          { name: 'Small & Furry' },
          { name: 'Horse' },
          { name: 'Bird' },
          { name: 'Scales, Fins & Other' },
          { name: 'Barnyard' }
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    loadPetTypes();
  }, []);

  const handleFilterChange = (key, value) => {
    updateFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleReset = () => {
    updateFilters({
      location: '',
      breed: '',
      age: '',
      type: 'all',
      size: '',
      gender: ''
    });
  };

  const handleApply = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">筛选条件</h3>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>
          
          <div className="space-y-6">
            {/* 宠物类型 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                宠物类型
              </label>
              <select
                value={filters.type || 'all'}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                disabled={isLoading}
              >
                <option value="all">全部类型</option>
                {petTypes.map((type) => (
                  <option key={type.name} value={type.name.toLowerCase()}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>
            
            {/* 地区 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                地区 (邮编或城市)
              </label>
              <input
                type="text"
                value={filters.location || ''}
                onChange={(e) => handleFilterChange('location', e.target.value)}
                placeholder="如: 10001 或 New York"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            
            {/* 品种 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                品种
              </label>
              <input
                type="text"
                value={filters.breed || ''}
                onChange={(e) => handleFilterChange('breed', e.target.value)}
                placeholder="如: Labrador Retriever"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            
            {/* 年龄 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                年龄
              </label>
              <select
                value={filters.age || ''}
                onChange={(e) => handleFilterChange('age', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">全部年龄</option>
                <option value="Baby">幼体</option>
                <option value="Young">青年</option>
                <option value="Adult">成年</option>
                <option value="Senior">老年</option>
              </select>
            </div>
            
            {/* 体型 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                体型
              </label>
              <select
                value={filters.size || ''}
                onChange={(e) => handleFilterChange('size', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">全部体型</option>
                <option value="Small">小型</option>
                <option value="Medium">中型</option>
                <option value="Large">大型</option>
                <option value="Extra Large">超大型</option>
              </select>
            </div>
            
            {/* 性别 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                性别
              </label>
              <select
                value={filters.gender || ''}
                onChange={(e) => handleFilterChange('gender', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">全部性别</option>
                <option value="Male">公</option>
                <option value="Female">母</option>
              </select>
            </div>
          </div>
          
          <div className="flex space-x-3 mt-8">
            <button
              onClick={handleReset}
              className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              重置
            </button>
            <button
              onClick={handleApply}
              className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
            >
              应用筛选
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdoptionFilter;