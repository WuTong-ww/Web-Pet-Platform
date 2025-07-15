import React, { useState } from 'react';
import { useFavorite } from '../../contexts/FavoriteContext';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

const FavoriteManager = ({ onPetClick }) => {
  const { favorites, removeFromFavorites, clearFavorites, getFavoriteStats } = useFavorite();
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recent');

  const stats = getFavoriteStats();

  // 筛选收藏
  const filteredFavorites = favorites.filter(pet => {
    if (filter === 'all') return true;
    if (filter === 'dogs') return pet.type?.toLowerCase() === 'dog';
    if (filter === 'cats') return pet.type?.toLowerCase() === 'cat';
    if (filter === 'others') return !['dog', 'cat'].includes(pet.type?.toLowerCase());
    return true;
  });

  // 排序收藏
  const sortedFavorites = [...filteredFavorites].sort((a, b) => {
    if (sortBy === 'recent') {
      return new Date(b.addedAt) - new Date(a.addedAt);
    }
    if (sortBy === 'name') {
      return a.name.localeCompare(b.name);
    }
    if (sortBy === 'type') {
      return a.type.localeCompare(b.type);
    }
    return 0;
  });

  const handleRemoveFavorite = (petId, petName) => {
    if (window.confirm(`确定要从收藏中移除 ${petName} 吗？`)) {
      removeFromFavorites(petId);
    }
  };

  const handleClearAll = () => {
    if (window.confirm('确定要清空所有收藏吗？此操作不可恢复。')) {
      clearFavorites();
    }
  };

  return (
    <div className="space-y-6">
      {/* 标题和操作栏 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">❤️ 我的收藏</h2>
          <p className="text-gray-600">查看和管理您收藏的宠物</p>
        </div>
        {favorites.length > 0 && (
          <button
            onClick={handleClearAll}
            className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
          >
            🗑️ 清空收藏
          </button>
        )}
      </div>

      {/* 统计信息 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-2xl mb-2">📊</div>
          <h4 className="font-medium text-blue-900">总收藏</h4>
          <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-2xl mb-2">🐕</div>
          <h4 className="font-medium text-green-900">狗狗</h4>
          <p className="text-2xl font-bold text-green-600">{stats.dogs}</p>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg">
          <div className="text-2xl mb-2">🐱</div>
          <h4 className="font-medium text-orange-900">猫猫</h4>
          <p className="text-2xl font-bold text-orange-600">{stats.cats}</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="text-2xl mb-2">🐾</div>
          <h4 className="font-medium text-purple-900">其他</h4>
          <p className="text-2xl font-bold text-purple-600">{stats.others}</p>
        </div>
      </div>

      {/* 筛选和排序控件 */}
      {favorites.length > 0 && (
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">筛选:</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">全部 ({stats.total})</option>
              <option value="dogs">狗狗 ({stats.dogs})</option>
              <option value="cats">猫猫 ({stats.cats})</option>
              <option value="others">其他 ({stats.others})</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">排序:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="recent">最近添加</option>
              <option value="name">名称排序</option>
              <option value="type">类型排序</option>
            </select>
          </div>
        </div>
      )}

      {/* 收藏列表 */}
      {sortedFavorites.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">💔</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {filter === 'all' ? '还没有收藏任何宠物' : `没有找到${filter === 'dogs' ? '狗狗' : filter === 'cats' ? '猫猫' : '其他'}类型的收藏`}
          </h3>
          <p className="text-gray-600 mb-4">
            {filter === 'all' 
              ? '在浏览宠物时点击收藏按钮来添加您喜欢的宠物' 
              : '尝试更改筛选条件或添加更多收藏'
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedFavorites.map((pet) => (
            <div
              key={pet.id}
              className="fluffy-card bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300"
            >
              {/* 宠物图片 */}
              <div className="aspect-square bg-gray-200 relative">
                <img
                  src={pet.image}
                  alt={pet.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = `https://via.placeholder.com/300x300/e2e8f0/64748b?text=${encodeURIComponent(pet.name)}`;
                  }}
                />
                <div className="absolute top-2 right-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    pet.source === 'petfinder' ? 'bg-blue-100 text-blue-700' :
                    pet.source === 'spca' ? 'bg-green-100 text-green-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {pet.source === 'petfinder' ? 'Petfinder' : 
                     pet.source === 'spca' ? 'SPCA' : '其他'}
                  </span>
                </div>
              </div>

              {/* 宠物信息 */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{pet.name}</h3>
                    <p className="text-gray-600 text-sm">{pet.breed}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm text-gray-500">{pet.type}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                  <span>{pet.age}</span>
                  <span>{pet.gender}</span>
                  <span>📍 {pet.location}</span>
                </div>

                {/* 标签 */}
                {pet.tags && pet.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {pet.tags.slice(0, 3).map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* 操作按钮 */}
                <div className="flex space-x-2">
                  <button
                    onClick={() => onPetClick && onPetClick(pet.originalPet)}
                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    查看详情
                  </button>
                  <button
                    onClick={() => handleRemoveFavorite(pet.id, pet.name)}
                    className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                    title="移除收藏"
                  >
                    💔
                  </button>
                </div>

                {/* 添加时间 */}
                <div className="mt-2 text-xs text-gray-500">
                  收藏于: {format(new Date(pet.addedAt), 'yyyy-MM-dd HH:mm', { locale: zhCN })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FavoriteManager;