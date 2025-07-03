import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import clsx from 'clsx';

// 导入各个组件
import { RealTimeDataProvider, useRealTimeData } from './contexts/RealTimeDataContext';
import PopularityRanking from './components/adoption/PopularityRanking';
import AdoptionFilter from './components/adoption/AdoptionFilter';
import PetActivityMap from './components/maps/PetActivityMap';

// 实时统计组件
const RealTimeStats = () => {
  const { globalStats, connectionStatus, refreshStats } = useRealTimeData();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const statsData = [
    {
      title: "待领养宠物",
      value: globalStats.totalPets,
      icon: "🐕",
      color: "bg-blue-500",
      change: "+12"
    },
    {
      title: "今日成功领养",
      value: globalStats.adoptedToday,
      icon: "❤️",
      color: "bg-green-500",
      change: "+5"
    },
    {
      title: "活跃用户",
      value: globalStats.activeUsers,
      icon: "👥",
      color: "bg-purple-500",
      change: "+8"
    },
    {
      title: "成功率",
      value: `${globalStats.successRate}%`,
      icon: "📈",
      color: "bg-orange-500",
      change: "+2%"
    }
  ];

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">📊 实时数据</h2>
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${
            connectionStatus === 'connected' ? 'bg-green-400 animate-pulse' : 'bg-red-400'
          }`}></div>
          <span className="text-sm text-gray-600">
            {connectionStatus === 'connected' ? '实时更新' : '连接中...'}
          </span>
          <button 
            onClick={refreshStats}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            🔄
          </button>
          <span className="text-xs text-gray-500">
            {format(currentTime, 'HH:mm:ss')}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsData.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-lg ${stat.color} flex items-center justify-center text-white text-xl`}>
                {stat.icon}
              </div>
            </div>
            <div className="flex items-center">
              <span className="text-green-600 text-sm font-medium">{stat.change}</span>
              <span className="text-gray-500 text-sm ml-2">较昨日</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// 宠物卡片组件
const PetCard = ({ pet, rank, onClick }) => {
  const formatTimeAgo = (date) => {
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return `${diffDays}天前`;
  };

  return (
    <div 
      className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
      onClick={() => onClick && onClick(pet)}
    >
      <div className="flex items-start space-x-4">
        {rank && (
          <div className={clsx(
            "w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm",
            rank === 1 && 'bg-yellow-500',
            rank === 2 && 'bg-gray-400',
            rank === 3 && 'bg-orange-400',
            rank > 3 && 'bg-blue-500'
          )}>
            {rank}
          </div>
        )}
        
        <img 
          src={pet.image} 
          alt={pet.name}
          className="w-16 h-16 rounded-full object-cover"
        />
        
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-lg text-gray-900">{pet.name}</h3>
            <div className="flex items-center space-x-2">
              <span className="text-orange-500">🔥</span>
              <span className="text-sm font-semibold text-orange-500">{pet.popularity}%</span>
            </div>
          </div>
          
          <p className="text-gray-600 mb-2">{pet.breed} • {pet.age}</p>
          
          <div className="flex items-center text-sm text-gray-500 mb-3">
            <span className="mr-1">📍</span>
            <span>{pet.location}</span>
          </div>
          
          <div className="flex flex-wrap gap-1 mb-3">
            {pet.tags.slice(0, 3).map((tag, index) => (
              <span key={index} className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">
                {tag}
              </span>
            ))}
          </div>
          
          <p className="text-sm text-gray-600 mb-3">{pet.description}</p>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <div className="flex items-center">
                <span className="mr-1">👁️</span>
                <span>{pet.viewCount}</span>
              </div>
              <div className="flex items-center">
                <span className="mr-1">❤️</span>
                <span>{pet.favoriteCount}</span>
              </div>
            </div>
            <span className="text-xs text-gray-400">
              {formatTimeAgo(pet.postedDate)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// 宠物详情模态框
const PetDetailModal = ({ pet, onClose }) => {
  if (!pet) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">{pet.name}</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <img
                src={pet.image}
                alt={pet.name}
                className="w-full h-64 object-cover rounded-lg mb-4"
              />
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">品种:</span>
                  <span className="font-medium">{pet.breed}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">年龄:</span>
                  <span className="font-medium">{pet.age}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">地区:</span>
                  <span className="font-medium">{pet.location}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">健康状况:</span>
                  <span className="font-medium text-green-600">{pet.healthStatus || '优秀'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">疫苗:</span>
                  <span className="font-medium">{pet.vaccinated ? '✅ 已接种' : '❌ 未接种'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">绝育:</span>
                  <span className="font-medium">{pet.spayed ? '✅ 已绝育' : '❌ 未绝育'}</span>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-3">关于 {pet.name}</h3>
              <p className="text-gray-700 mb-4">{pet.description}</p>
              
              <div className="mb-4">
                <h4 className="font-medium mb-2">特点标签</h4>
                <div className="flex flex-wrap gap-2">
                  {pet.tags.map((tag, index) => (
                    <span key={index} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="mb-6">
                <h4 className="font-medium mb-2">收容所信息</h4>
                <p className="text-gray-600">{pet.adoptionCenter || '爱心宠物收容所'}</p>
              </div>
              
              <div className="space-y-3">
                <button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-medium hover:shadow-lg transition-all">
                  💖 我要领养
                </button>
                <button className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors">
                  📞 联系收容所
                </button>
                <button className="w-full bg-orange-100 text-orange-700 py-3 rounded-lg font-medium hover:bg-orange-200 transition-colors">
                  ❤️ 收藏
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// AI助手组件
const AIAssistant = () => {
  const [messages, setMessages] = useState([
    { type: 'bot', content: '您好！我是PetConnect AI助手，我可以帮您解答宠物相关问题。请问有什么可以帮助您的吗？' }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userMessage = { type: 'user', content: inputMessage };
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    // 模拟AI响应
    setTimeout(() => {
      const responses = [
        '这是一个很好的问题！根据我的知识，建议您...',
        '对于这种情况，我建议您首先...',
        '这个问题需要考虑宠物的具体情况...',
        '建议您咨询专业的宠物医生，同时...'
      ];
      
      const botResponse = { 
        type: 'bot', 
        content: responses[Math.floor(Math.random() * responses.length)] 
      };
      
      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">🤖 AI宠物助手</h2>
        <p className="text-gray-600 mb-6">
          我可以帮您解答宠物饲养、训练、健康等问题，也可以分析宠物照片来评估状态。
        </p>
        
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <button className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors text-left">
            <div className="text-2xl mb-2">🐕</div>
            <div className="font-medium">宠物健康咨询</div>
            <div className="text-sm text-gray-600">健康问题解答</div>
          </button>
          <button className="p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors text-left">
            <div className="text-2xl mb-2">🎓</div>
            <div className="font-medium">训练建议</div>
            <div className="text-sm text-gray-600">行为训练指导</div>
          </button>
          <button className="p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors text-left">
            <div className="text-2xl mb-2">📸</div>
            <div className="font-medium">照片分析</div>
            <div className="text-sm text-gray-600">宠物状态评估</div>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg">
        <div className="h-96 overflow-y-auto p-6 space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.type === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-gray-100 px-4 py-2 rounded-lg">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <form onSubmit={handleSendMessage} className="p-4 border-t">
          <div className="flex space-x-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="请输入您的问题..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isTyping}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              发送
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// 主应用内容组件
const AppContent = () => {
  const [currentView, setCurrentView] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPet, setSelectedPet] = useState(null);
  const [showFilter, setShowFilter] = useState(false);
  const [filters, setFilters] = useState({
    location: '',
    breed: '',
    age: '',
    type: 'all'
  });
  const [isLoading, setIsLoading] = useState(false);

  const { popularPets, adoptionFeed, nearbyActivities, refreshData } = useRealTimeData();

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setIsLoading(true);
    setCurrentView('search');
    
    // 模拟搜索延迟
    setTimeout(() => {
      setIsLoading(false);
      console.log('搜索:', searchQuery);
    }, 1000);
  };

  const handlePetClick = (pet) => {
    setSelectedPet(pet);
  };

  const navItems = [
    { key: 'home', label: '首页', icon: '🏠' },
    { key: 'search', label: '搜索', icon: '🔍' },
    { key: 'map', label: '地图', icon: '🗺️' },
    { key: 'profile', label: '档案', icon: '👤' },
    { key: 'ai', label: 'AI助手', icon: '🤖' }
  ];

  const renderContent = () => {
    switch (currentView) {
      case 'home':
        return (
          <div className="space-y-8">
            <RealTimeStats />
            
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">🔥 热门宠物</h2>
                  <button 
                    onClick={() => setShowFilter(true)}
                    className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    筛选
                  </button>
                </div>
                
                <div className="space-y-4">
                  {popularPets.map((pet, index) => (
                    <PetCard 
                      key={pet.id} 
                      pet={pet} 
                      rank={index + 1}
                      onClick={handlePetClick}
                    />
                  ))}
                </div>
              </div>
              
              <div className="space-y-6">
                <PopularityRanking pets={popularPets} />
              </div>
            </div>
          </div>
        );

      case 'search':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">🔍 搜索结果</h2>
              {searchQuery && (
                <p className="text-gray-600 mb-4">搜索关键词: "{searchQuery}"</p>
              )}
              
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-500">搜索中...</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {popularPets.filter(pet => 
                    !searchQuery || 
                    pet.name.includes(searchQuery) || 
                    pet.breed.includes(searchQuery) ||
                    pet.location.includes(searchQuery)
                  ).map((pet) => (
                    <PetCard 
                      key={pet.id} 
                      pet={pet} 
                      onClick={handlePetClick}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case 'map':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">🗺️ 宠物活动地图</h2>
              <PetActivityMap activities={nearbyActivities} />
            </div>
          </div>
        );

      case 'profile':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">👤 我的档案</h2>
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📋</div>
                <div className="text-gray-500 mb-4">宠物档案管理功能开发中</div>
                <p className="text-gray-400">您可以在这里管理您的宠物健康档案、疫苗记录等</p>
              </div>
            </div>
          </div>
        );

      case 'ai':
        return <AIAssistant />;

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      {/* 顶部导航 */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">🐾</span>
              <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                PetConnect
              </span>
            </div>
            
            <form onSubmit={handleSearch} className="flex-1 max-w-md mx-8">
              <div className="relative">
                <input
                  type="text"
                  placeholder="搜索宠物、品种、地区..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">🔍</span>
                {isLoading && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
            </form>
            
            <div className="flex items-center space-x-4">
              <button 
                onClick={refreshData}
                className="p-2 text-gray-600 hover:text-purple-600 transition-colors"
                title="刷新数据"
              >
                🔄
              </button>
              <button className="relative p-2 text-gray-600 hover:text-purple-600 transition-colors">
                🔔
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  3
                </span>
              </button>
              <button className="p-2 text-gray-600 hover:text-purple-600 transition-colors">
                👤
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 主内容 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
        {renderContent()}
      </main>

      {/* 底部导航 */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="flex items-center justify-around h-16">
          {navItems.map(({ key, icon, label }) => (
            <button
              key={key}
              onClick={() => setCurrentView(key)}
              className={clsx(
                "flex flex-col items-center space-y-1 p-2 transition-colors",
                currentView === key ? 'text-purple-600' : 'text-gray-600'
              )}
            >
              <span className="text-xl">{icon}</span>
              <span className="text-xs">{label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* 模态框 */}
      {selectedPet && (
        <PetDetailModal 
          pet={selectedPet} 
          onClose={() => setSelectedPet(null)} 
        />
      )}
      
      {showFilter && (
        <AdoptionFilter
          filters={filters}
          updateFilters={setFilters}
          onClose={() => setShowFilter(false)}
        />
      )}
    </div>
  );
};

// 主应用组件
function App() {
  return (
    <RealTimeDataProvider>
      <AppContent />
    </RealTimeDataProvider>
  );
}

export default App;