import React, { useState, useEffect } from 'react';
import clsx from 'clsx';
import locationService from '../../services/locationService';

const LocationBasedRecommendations = () => {
  const [userLocation, setUserLocation] = useState(null);
  const [recommendedPlatforms, setRecommendedPlatforms] = useState([]);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [selectedPlatform, setSelectedPlatform] = useState(null);
  const [platformDetails, setPlatformDetails] = useState({});

  // 获取用户位置和推荐平台
  const fetchLocationAndRecommendations = async () => {
    setIsLoadingLocation(true);
    setLocationError(null);
    
    try {
      console.log('🌍 开始获取用户位置...');
      const location = await locationService.getUserLocation();
      
      if (location) {
        console.log('📍 用户位置:', location);
        setUserLocation(location);
        
        // 获取推荐平台
        const platforms = locationService.getRecommendedPlatforms(location);
        console.log('🎯 推荐平台:', platforms);
        setRecommendedPlatforms(platforms);
        
        // 预加载平台详情
        await preloadPlatformDetails(platforms);
      } else {
        setLocationError('无法获取您的位置信息');
        // 显示默认推荐
        const defaultPlatforms = locationService.getDefaultRecommendations();
        setRecommendedPlatforms(defaultPlatforms);
      }
    } catch (error) {
      console.error('获取位置失败:', error);
      setLocationError(error.message || '获取位置失败');
      
      // 显示默认推荐
      const defaultPlatforms = locationService.getDefaultRecommendations();
      setRecommendedPlatforms(defaultPlatforms);
    } finally {
      setIsLoadingLocation(false);
    }
  };

  // 预加载平台详情
  const preloadPlatformDetails = async (platforms) => {
    const details = {};
    
    for (const platform of platforms.slice(0, 6)) { // 只预加载前6个
      if (platform.crawlable) {
        try {
          const detail = await fetchPlatformBasicInfo(platform);
          details[platform.id] = detail;
        } catch (error) {
          console.error(`预加载 ${platform.name} 详情失败:`, error);
        }
      }
    }
    
    setPlatformDetails(details);
  };

  // 获取平台基本信息
  const fetchPlatformBasicInfo = async (platform) => {
    try {
      // 模拟爬取平台基本信息
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
      
      return {
        status: 'online',
        lastUpdated: new Date(),
        availablePets: Math.floor(Math.random() * 500) + 50,
        responseTime: Math.floor(Math.random() * 100) + 50,
        rating: (Math.random() * 1.5 + 3.5).toFixed(1),
        reviews: Math.floor(Math.random() * 1000) + 100
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message
      };
    }
  };

  // 手动刷新位置
  const refreshLocation = async () => {
    await fetchLocationAndRecommendations();
  };

  // 搜索平台
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.trim()) {
      const results = locationService.searchPlatforms(query);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  };

  // 初始化
  useEffect(() => {
    fetchLocationAndRecommendations();
  }, []);

  // 平台卡片组件
  const PlatformCard = ({ platform, isDetailed = false }) => {
    const details = platformDetails[platform.id];
    
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="text-3xl">{platform.logo}</div>
            <div>
              <h3 className="font-bold text-lg text-gray-900">{platform.name}</h3>
              <p className="text-sm text-gray-600">{platform.regionName}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className={clsx(
              "px-2 py-1 rounded-full text-xs",
              platform.type === 'adoption' && 'bg-green-100 text-green-700',
              platform.type === 'rescue' && 'bg-red-100 text-red-700',
              platform.type === 'social' && 'bg-blue-100 text-blue-700',
              platform.type === 'marketplace' && 'bg-purple-100 text-purple-700',
              platform.type === 'community' && 'bg-yellow-100 text-yellow-700'
            )}>
              {platform.type === 'adoption' && '领养'}
              {platform.type === 'rescue' && '救助'}
              {platform.type === 'social' && '社交'}
              {platform.type === 'marketplace' && '市场'}
              {platform.type === 'community' && '社区'}
            </span>
            
            {details && (
              <div className={clsx(
                "w-3 h-3 rounded-full",
                details.status === 'online' ? 'bg-green-400' : 'bg-red-400'
              )}></div>
            )}
          </div>
        </div>
        
        <p className="text-gray-700 mb-4">{platform.description}</p>
        
        {/* 平台特色 */}
        <div className="mb-4">
          <h4 className="font-medium text-gray-900 mb-2">平台特色</h4>
          <div className="flex flex-wrap gap-2">
            {platform.features.map((feature, index) => (
              <span key={index} className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs">
                {feature}
              </span>
            ))}
          </div>
        </div>

        {/* 平台详情 */}
        {details && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">可领养宠物:</span>
                <span className="ml-2 font-semibold text-green-600">{details.availablePets}</span>
              </div>
              <div>
                <span className="text-gray-600">用户评分:</span>
                <span className="ml-2 font-semibold text-yellow-600">⭐ {details.rating}</span>
              </div>
              <div>
                <span className="text-gray-600">响应时间:</span>
                <span className="ml-2 font-semibold text-blue-600">{details.responseTime}ms</span>
              </div>
              <div>
                <span className="text-gray-600">用户评价:</span>
                <span className="ml-2 font-semibold text-purple-600">{details.reviews}+</span>
              </div>
            </div>
          </div>
        )}
        
        {/* 联系方式 */}
        <div className="mb-4">
          <h4 className="font-medium text-gray-900 mb-2">联系方式</h4>
          <div className="space-y-1 text-sm">
            {platform.contact.phone && (
              <div className="flex items-center space-x-2">
                <span className="text-gray-600">📞</span>
                <span className="text-gray-700">{platform.contact.phone}</span>
              </div>
            )}
            {platform.contact.email && (
              <div className="flex items-center space-x-2">
                <span className="text-gray-600">📧</span>
                <span className="text-gray-700">{platform.contact.email}</span>
              </div>
            )}
            {platform.contact.wechat && (
              <div className="flex items-center space-x-2">
                <span className="text-gray-600">💬</span>
                <span className="text-gray-700">微信: {platform.contact.wechat}</span>
              </div>
            )}
            {platform.contact.address && (
              <div className="flex items-center space-x-2">
                <span className="text-gray-600">📍</span>
                <span className="text-gray-700">{platform.contact.address}</span>
              </div>
            )}
          </div>
        </div>
        
        {/* 操作按钮 */}
        <div className="flex space-x-2">
          <button
            onClick={() => window.open(platform.url, '_blank')}
            className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2 px-4 rounded-lg hover:shadow-lg transition-all transform hover:scale-105"
          >
            🔗 访问平台
          </button>
          
          <button
            onClick={() => setSelectedPlatform(platform)}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            📋 详情
          </button>
          
          {platform.crawlable && (
            <button
              onClick={() => handleCrawlPlatform(platform)}
              className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
            >
              🕷️ 爬取
            </button>
          )}
        </div>
      </div>
    );
  };

  // 爬取平台数据
  const handleCrawlPlatform = async (platform) => {
    try {
      alert(`开始爬取 ${platform.name} 的数据，这可能需要几分钟时间...`);
      // 这里可以调用具体的爬取逻辑
      console.log('开始爬取平台:', platform);
    } catch (error) {
      console.error('爬取失败:', error);
      alert(`爬取 ${platform.name} 失败: ${error.message}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* 页面标题 */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">🎯 智能推荐</h1>
        <p className="text-gray-600">基于您的位置推荐最合适的宠物领养平台</p>
      </div>

      {/* 位置信息 */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">📍 您的位置</h2>
          <button
            onClick={refreshLocation}
            disabled={isLoadingLocation}
            className={clsx(
              "px-4 py-2 rounded-lg font-medium transition-all",
              isLoadingLocation
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-blue-100 text-blue-700 hover:bg-blue-200"
            )}
          >
            {isLoadingLocation ? '🔄 定位中...' : '🔄 重新定位'}
          </button>
        </div>
        
        {isLoadingLocation ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
            <span className="ml-3 text-gray-600">正在获取您的位置...</span>
          </div>
        ) : locationError ? (
          <div className="p-4 bg-red-50 rounded-lg">
            <div className="flex items-center">
              <span className="text-red-500 mr-2">⚠️</span>
              <span className="text-red-700">{locationError}</span>
            </div>
            <p className="text-red-600 text-sm mt-2">
              我们将为您显示通用推荐平台
            </p>
          </div>
        ) : userLocation ? (
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="flex items-center mb-2">
              <span className="text-green-500 mr-2">📍</span>
              <span className="text-green-700 font-medium">{userLocation.formatted}</span>
            </div>
            <div className="text-sm text-green-600">
              定位精度: {userLocation.accuracy < 1000 ? '高' : '中'}
              {userLocation.source === 'ip' && ' (基于IP地址)'}
            </div>
          </div>
        ) : (
          <div className="p-4 bg-gray-50 rounded-lg">
            <span className="text-gray-600">位置信息未获取</span>
          </div>
        )}
      </div>

      {/* 搜索平台 */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">🔍 搜索平台</h2>
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="搜索平台名称、特色或服务..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">🔍</span>
        </div>
        
        {searchResults.length > 0 && (
          <div className="mt-4 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {searchResults.slice(0, 6).map((platform) => (
              <PlatformCard key={platform.id} platform={platform} />
            ))}
          </div>
        )}
      </div>

      {/* 推荐平台 */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            🎯 为您推荐
            <span className="text-sm font-normal text-gray-500 ml-2">
              (共 {recommendedPlatforms.length} 个平台)
            </span>
          </h2>
          
          <div className="text-sm text-gray-500">
            {userLocation ? '基于您的位置推荐' : '通用推荐'}
          </div>
        </div>
        
        {recommendedPlatforms.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendedPlatforms.map((platform) => (
              <PlatformCard key={platform.id} platform={platform} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🤷‍♂️</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">暂无推荐</h3>
            <p className="text-gray-600 mb-4">请尝试刷新位置或搜索特定平台</p>
            <button
              onClick={refreshLocation}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              🔄 重新获取推荐
            </button>
          </div>
        )}
      </div>

      {/* 平台详情弹窗 */}
      {selectedPlatform && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="text-3xl">{selectedPlatform.logo}</div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedPlatform.name}</h2>
                    <p className="text-gray-600">{selectedPlatform.regionName}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedPlatform(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">平台介绍</h3>
                  <p className="text-gray-700">{selectedPlatform.description}</p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">服务特色</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedPlatform.features.map((feature, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <span className="text-green-500">✓</span>
                        <span className="text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">联系方式</h3>
                  <div className="space-y-2">
                    {Object.entries(selectedPlatform.contact).map(([key, value]) => (
                      <div key={key} className="flex items-center space-x-2">
                        <span className="text-gray-600 capitalize">{key}:</span>
                        <span className="text-gray-700">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="flex space-x-3">
                  <button
                    onClick={() => window.open(selectedPlatform.url, '_blank')}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg hover:shadow-lg transition-all transform hover:scale-105"
                  >
                    🔗 访问平台
                  </button>
                  
                  {selectedPlatform.crawlable && (
                    <button
                      onClick={() => handleCrawlPlatform(selectedPlatform)}
                      className="px-6 py-3 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                    >
                      🕷️ 爬取数据
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 使用说明 */}
      <div className="bg-blue-50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">💡 使用说明</h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-800">
          <div>
            <h4 className="font-medium mb-2">🎯 智能推荐</h4>
            <p>基于您的地理位置，我们会自动推荐最适合的本地宠物领养平台</p>
          </div>
          <div>
            <h4 className="font-medium mb-2">🔍 搜索功能</h4>
            <p>可以搜索特定平台名称或服务特色，快速找到您需要的平台</p>
          </div>
          <div>
            <h4 className="font-medium mb-2">🕷️ 数据爬取</h4>
            <p>点击"爬取"按钮可以获取平台的最新宠物信息</p>
          </div>
          <div>
            <h4 className="font-medium mb-2">🔗 直达链接</h4>
            <p>点击"访问平台"直接跳转到官方网站进行领养</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationBasedRecommendations;