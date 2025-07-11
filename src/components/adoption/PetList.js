import React from 'react';
import clsx from 'clsx';

const PetList = ({ pets, limit = 50, onPetClick, pagination, onLoadMore, onRefresh, isLoading }) => {
  // 如果需要限制显示数量
  const displayPets = limit ? pets.slice(0, limit) : pets;

  // 分页控制组件
  const PaginationControls = () => {
    if (!pagination) return null;
    const { currentPage = 1, hasNextPage, hasPreviousPage } = pagination;
    
    if (!hasNextPage && !hasPreviousPage) return null;
    
    return (
      <div className="mt-8 flex justify-between items-center">
        <div className="text-sm text-gray-500">
          当前第 {currentPage} 页 • 数据来源: Petfinder + 香港爱护动物协会
        </div>
        <div className="flex space-x-4">
          {hasPreviousPage && (
            <button
              disabled={isLoading}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
            >
              上一页
            </button>
          )}
          {hasNextPage && (
            <button
              onClick={onLoadMore}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {isLoading ? '加载中...' : '加载更多'}
            </button>
          )}
        </div>
      </div>
    );
  };

  // 空状态处理
  if (displayPets.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-12 text-center">
        <div className="text-6xl mb-4">🐾</div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">暂无宠物数据</h3>
        <p className="text-gray-600 mb-4">请稍后再试或调整筛选条件</p>
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className={clsx(
            "px-6 py-2 rounded-lg transition-colors",
            isLoading 
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-blue-700"
          )}
        >
          {isLoading ? '加载中...' : '重新加载'}
        </button>
      </div>
    );
  }

  // 单个宠物卡片组件
  const PetCard = ({ pet }) => {
    return (
      <div 
        className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer"
        onClick={() => onPetClick && onPetClick(pet)}
      >
        <div className="aspect-square bg-gray-200 relative">
          <img 
            src={pet.image} 
            alt={pet.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://via.placeholder.com/300x300?text=No+Image';
            }}
          />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
            <div className="text-white font-bold text-lg">{pet.name}</div>
            <div className="text-white/80 text-sm">{pet.breed}</div>
          </div>
        </div>
        
        <div className="p-4">
          <div className="flex justify-between items-center mb-2">
            <div className="text-gray-700">{pet.age} • {pet.gender}</div>
            <div className={clsx(
              "px-2 py-1 rounded text-xs font-medium",
              pet.source === 'petfinder' && 'bg-blue-100 text-blue-700',
              pet.source === 'spca' && 'bg-green-100 text-green-700',
              pet.source === 'mock' && 'bg-gray-100 text-gray-700'
            )}>
              {pet.source === 'petfinder' && 'Petfinder'}
              {pet.source === 'spca' && 'SPCA香港'}
              {pet.source === 'mock' && '模拟数据'}
            </div>
          </div>
          
          <div className="flex flex-wrap gap-1 mb-3">
            {pet.tags && pet.tags.slice(0, 3).map((tag, index) => (
              <span key={index} className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">
                {tag}
              </span>
            ))}
          </div>
          
          <div className="text-sm text-gray-600 flex items-center">
            <span className="mr-1">📍</span>
            <span>{pet.location || '未知地区'}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayPets.map(pet => (
          <PetCard key={pet.id} pet={pet} />
        ))}
      </div>
      
      <PaginationControls />
    </div>
  );
};

export default PetList;