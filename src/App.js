import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import clsx from 'clsx';

// 导入各个组件
import { RealTimeDataProvider, useRealTimeData } from './contexts/RealTimeDataContext';
import AdoptionFilter from './components/adoption/AdoptionFilter';
import PetActivityMap from './components/maps/PetActivityMap';
import PetImage from './components/common/PetImage';
import CrawlButton from './components/common/CrawlButton';
import DataManagement from './components/admin/DataManagement';
import LocationBasedRecommendations from './components/location/LocationBasedRecommendations';
import RegionDetail from './pages/RegionDetail';
import { fetchPetfinderPetById } from './services/adoptionService';
import { cleanText, formatDescription } from './utils/textUtils';
import NearbyPlaces from './components/maps/NearbyPlaces';



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
        
        <div className="w-16 h-16 rounded-full overflow-hidden">
          <PetImage 
            pet={pet} 
            size="small"
            className="w-full h-full"
          />
        </div>
        
        <div className="flex-1">
          
          
          <p className="text-gray-600 mb-2">{pet.name} • {pet.age}</p>
          
          <div className="flex items-center text-sm text-gray-500 mb-3">
            <span className="mr-1">📍</span>
            <span>{pet.location}</span>
            <span className="mx-2">•</span>
            <span className={clsx(
              "px-2 py-1 rounded-full text-xs",
              pet.source === 'petfinder' && 'bg-blue-100 text-blue-700',
              pet.source === 'spca' && 'bg-green-100 text-green-700',
              pet.source === 'mock' && 'bg-gray-100 text-gray-700'
            )}>
              {pet.source === 'petfinder' && 'Petfinder'}
              {pet.source === 'spca' && 'SPCA香港'}
              {pet.source === '其他'}
            </span>
          </div>
          
          <div className="flex flex-wrap gap-1 mb-3">
            {pet.tags.slice(0, 3).map((tag, index) => (
              <span key={index} className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">
                {tag}
              </span>
            ))}
          </div>
          
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{pet.description}</p>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              
              
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

// 分页组件
const PaginationControls = ({ pagination, onLoadMore, onRefresh, isLoading }) => {
  const { currentPage, hasNextPage, hasPreviousPage, totalCount } = pagination;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          已显示 {totalCount} 只宠物
        </div>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className={clsx(
              "px-4 py-2 transition-colors",
              isLoading 
                ? "text-gray-400 cursor-not-allowed" 
                : "text-gray-600 hover:text-gray-800"
            )}
          >
            {isLoading ? '🔄' : '🔄'} 刷新
          </button>
          
          {hasNextPage && (
            <button
              onClick={onLoadMore}
              disabled={isLoading}
              className={clsx(
                "px-6 py-2 rounded-lg font-medium transition-all",
                isLoading
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:shadow-lg transform hover:scale-105"
              )}
            >
              {isLoading ? '加载中...' : '加载更多宠物'}
            </button>
          )}
        </div>
      </div>
      
      <div className="mt-4 text-xs text-gray-500">
        当前第 {currentPage} 页 • 数据来源: Petfinder + 香港爱护动物协会
      </div>
    </div>
  );
};

// 宠物列表组件
const PetList = ({ pets, onPetClick, pagination, onLoadMore, onRefresh, isLoading }) => {
  if (pets.length === 0) {
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

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pets.map((pet, index) => (
          <PetCard
            key={pet.id}
            pet={pet}
            onClick={onPetClick}
          />
        ))}
      </div>
      
      <PaginationControls
        pagination={pagination}
        onLoadMore={onLoadMore}
        onRefresh={onRefresh}
        isLoading={isLoading}
      />
    </div>
  );
};

// 宠物详情模态框 - 简化描述显示，保持原始内容
const PetDetailModal = ({ pet, onClose }) => {
  if (!pet) return null;

  // 格式化地址信息
  const formatAddress = (address) => {
    if (!address) return '暂无地址信息';
    
    if (typeof address === 'string') {
      return address;
    }
    
    const parts = [];
    if (address.city) parts.push(address.city);
    if (address.state) parts.push(address.state);
    if (address.postcode) parts.push(address.postcode);
    
    return parts.length > 0 ? parts.join(', ') : '暂无地址信息';
  };

  // 格式化 Petfinder 描述
  const formatPetfinderDescription = (text) => {
    const sections = [];
    
    // 处理基本信息模式（如：Male / ~3 Years / 48 lbs）
    const basicInfoMatch = text.match(/(Male|Female)\s*\/\s*([^\/]+)\s*\/\s*([^\n\.]+)/);
    if (basicInfoMatch) {
      sections.push(`**基本信息：** ${basicInfoMatch[1]} | ${basicInfoMatch[2].trim()} | ${basicInfoMatch[3].trim()}`);
      text = text.replace(basicInfoMatch[0], '').trim();
    }
    
    // 处理收容所信息
    const meetMeMatch = text.match(/Want to meet me\?\s*Come down to our ([^\.]+)\./);
    if (meetMeMatch) {
      sections.push(`**见面地点：** ${meetMeMatch[1].trim()}`);
      text = text.replace(meetMeMatch[0], '').trim();
    }
    
    // 处理剩余文本
    if (text.trim()) {
      // 智能分段
      const sentences = text.split(/[\.!?]+/).filter(s => s.trim().length > 5);
      
      let currentParagraph = '';
      sentences.forEach((sentence, index) => {
        const trimmed = sentence.trim();
        if (!trimmed) return;
        
        // 检查是否应该开始新段落
        if (trimmed.match(/^(Looking for|I am|I love|I enjoy|My|This|He|She)/i) && currentParagraph) {
          sections.push(currentParagraph.trim() + '.');
          currentParagraph = trimmed;
        } else {
          currentParagraph += (currentParagraph ? ' ' : '') + trimmed;
        }
        
        // 最后一句话
        if (index === sentences.length - 1 && currentParagraph) {
          sections.push(currentParagraph.trim() + '.');
        }
      });
    }
    
    return sections.filter(section => section.length > 5);
  };

  // 简化描述处理 - 专门处理SPCA的完整描述
  const formatDescriptionContent = (description, source, personalityTags) => {
    if (!description) {
      return [`${pet.name}正在寻找一个充满爱的家庭。`];
    }
    
    const cleanDescription = typeof description === 'string' ? description.trim() : '';
    if (!cleanDescription) return [`${pet.name}正在寻找一个充满爱的家庭。`];
    
    // 检查是否是不相关的内容
    const excludePatterns = [
      /training\s+courses?\s+for\s+licensed\s+dog\s+breeders?/i,
      /licensed\s+dog\s+breeder/i,
      /cap\s+\d+b?/i,
      /traders?\s+and\s+staff/i
    ];
    
    const hasExcludedContent = excludePatterns.some(pattern => pattern.test(cleanDescription));
    
    if (hasExcludedContent) {
      console.warn(`检测到不相关内容，使用默认描述`);
      return [`${pet.name}正在寻找一个充满爱的家庭。`];
    }
    
    // 对于SPCA数据，智能分段显示完整内容
    if (source === 'spca') {
      // 如果描述很短，直接返回
      if (cleanDescription.length < 100) {
        return [cleanDescription];
      }
      
      // 按段落分割（保持原有的段落结构）
      const paragraphs = cleanDescription.split(/\n\s*\n/).filter(p => p.trim().length > 0);
      
      if (paragraphs.length > 1) {
        // 如果有多个段落，返回段落数组
        return paragraphs.map(p => p.trim());
      } else {
        // 如果是一个长段落，按句子分割
        const sentences = cleanDescription.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 10);
        
        if (sentences.length > 1) {
          return sentences.map(s => s.trim());
        } else {
          // 如果是一个很长的句子，直接返回
          return [cleanDescription];
        }
      }
    }
    
    // 对于其他来源的数据，使用原有的格式化逻辑
    if (source === 'petfinder') {
      return formatPetfinderDescription(cleanDescription);
    } else {
      return [cleanDescription];
    }
  };

  const descriptionLines = formatDescriptionContent(pet.description, pet.source, pet.personalityTags);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">{pet.name}</h2>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                  {pet.type}
                </span>
                <span className={clsx(
                  "px-3 py-1 rounded-full text-sm font-medium",
                  pet.source === 'petfinder' && 'bg-blue-100 text-blue-700',
                  pet.source === 'spca' && 'bg-green-100 text-green-700',
                  pet.source === '其他' && 'bg-gray-100 text-gray-700'
                )}>
                  {pet.source === 'petfinder' && 'Petfinder API'}
                  {pet.source === 'spca' && '香港愛護動物協會'}
                  {pet.source === '其他'}
                </span>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
            >
              ×
            </button>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <div className="aspect-square mb-4">
                <img 
                  src={pet.image || pet.fallbackImage}
                  alt={pet.name}
                  className="w-full h-full object-cover rounded-lg"
                  onError={(e) => {
                    if (pet.fallbackImage && e.target.src !== pet.fallbackImage) {
                      e.target.src = pet.fallbackImage;
                    }
                  }}
                />
              </div>
              
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
                  <span className="text-gray-600">性别:</span>
                  <span className="font-medium">{pet.gender}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">体型:</span>
                  <span className="font-medium">{pet.size}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">地区:</span>
                  <span className="font-medium">{pet.location}</span>
                </div>

                {pet.center && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">现在位置:</span>
                    <span className="font-medium">{pet.center}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-3">关于 {pet.name}</h3>
              
              <div className="text-gray-700 mb-4 space-y-3">
                {descriptionLines.length > 0 ? (
                  descriptionLines.map((line, index) => (
                    <p key={index} className="leading-relaxed">
                      {line}
                    </p>
                  ))
                ) : (
                  <p className="text-gray-500 italic">
                    {pet.name}正在寻找一个充满爱的家庭
                  </p>
                )}
              </div>
              
              {/* 显示性格标签 */}
              {pet.personalityTags && pet.personalityTags.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-medium mb-2">性格特点</h4>
                  <div className="flex flex-wrap gap-2">
                    {pet.personalityTags.map((tag, index) => (
                      <span key={index} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
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
                {pet.contact && pet.contact.phone && (
                  <p className="text-gray-600 text-sm">联系电话: {pet.contact.phone}</p>
                )}
                {pet.contact && pet.contact.email && (
                  <p className="text-gray-600 text-sm">邮箱: {pet.contact.email}</p>
                )}
                {pet.contact && pet.contact.address && (
                  <p className="text-gray-600 text-sm">地址: {formatAddress(pet.contact.address)}</p>
                )}
              </div>
              
              <div className="space-y-3">
                <button 
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-medium hover:shadow-lg transition-all transform hover:scale-105"
                  onClick={() => alert(`您想要领养 ${pet.name}！请联系收容所进行下一步操作。`)}
                >
                  💖 我要领养
                </button>
                <button 
                  className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                  onClick={() => alert(`请拨打电话联系收容所: ${pet.contact?.phone || '请查看详细信息'}`)}
                >
                  📞 联系收容所
                </button>
                <button 
                  className="w-full bg-orange-100 text-orange-700 py-3 rounded-lg font-medium hover:bg-orange-200 transition-colors"
                  onClick={() => alert(`已将 ${pet.name} 添加到收藏夹！`)}
                >
                  ❤️ 收藏
                </button>
              </div>
              
              <div className="mt-4 text-xs text-gray-500">
                发布时间: {format(pet.postedDate, 'yyyy-MM-dd HH:mm')} | 
                
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
    { type: 'bot', content: '您好！我是Petpet AI助手，我可以帮您解答宠物相关问题。请问有什么可以帮助您的吗？' }
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
  const [isLoading, setIsLoading] = useState(false);

  const { 
    adoptablePets, 
    adoptionFeed, 
    nearbyActivities, 
    filters, 
    setFilters,
    pagination,
    crawlStatus,
    refreshData,
    loadMorePets,
    resetAndLoadFirstPage,
    triggerCrawl,
    resetCrawlStatus
  } = useRealTimeData();

  // 处理爬取完成
  const handleCrawlComplete = async (result) => {
    console.log('爬取完成:', result);
    // 显示成功消息
    setTimeout(() => {
      alert(`🎉 爬取成功！获得 ${result.count} 条香港SPCA宠物数据`);
    }, 1000);
  };

  // 处理爬取错误
  const handleCrawlError = (error) => {
    console.error('爬取错误:', error);
    alert(`❌ 爬取失败: ${error.message}`);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setIsLoading(true);
    setCurrentView('search');
    
    try {
      await resetAndLoadFirstPage({ ...filters, query: searchQuery });
    } catch (error) {
      console.error('搜索失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePetClick = async (pet) => {
    // 先显示基本信息
    setSelectedPet(pet);
    
    // // 对于 Petfinder 宠物，获取完整详细信息
    // if (pet.source === 'petfinder' && pet.id) {
    //   try {
    //     setIsLoading(true);
        
    //     console.log('获取宠物详细信息:', pet.id);
    //     const detailedPet = await fetchPetfinderPetById(pet.id);
        
    //     if (detailedPet) {
    //       console.log('更新宠物详细信息:', detailedPet.name);
    //       console.log('描述长度:', detailedPet.description?.length || 0);
          
    //       // 更新选中的宠物
    //       setSelectedPet(detailedPet);
    //     }
    //   } catch (error) {
    //     console.error('获取宠物详细信息失败:', error);
    //   } finally {
    //     setIsLoading(false);
    //   }
    // }
  };

  const handleLoadMore = async () => {
    setIsLoading(true);
    try {
      await loadMorePets();
    } catch (error) {
      console.error('加载更多失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      await refreshData();
    } catch (error) {
      console.error('刷新失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const navItems = [
    { key: 'home', label: '首页', icon: '🏠' },
    { key: 'recommend', label: '地区推荐', icon: '🌎' },
    { key: 'map', label: '地图', icon: '🗺️' },
    { key: 'admin', label: '管理', icon: '📊' },
    { key: 'profile', label: '档案', icon: '👤' },
    { key: 'ai', label: 'AI助手', icon: '🤖' }
  ];

  const renderContent = () => {
    switch (currentView) {
      case 'home':
        return (
          <div className="space-y-8">
            <RealTimeStats />
            
            {/* 快速数据更新区域 */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">🔄 数据更新</h3>
                  <p className="text-sm text-gray-600">
                    最后更新: {crawlStatus.lastCrawlTime ? 
                      crawlStatus.lastCrawlTime.toLocaleString('zh-CN') : 
                      '暂无数据'
                    }
                  </p>
                </div>
                <button
                  onClick={triggerCrawl}
                  disabled={crawlStatus.isActive || isLoading}
                  className={clsx(
                    "px-4 py-2 rounded-lg font-medium transition-all",
                    crawlStatus.isActive || isLoading
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:shadow-lg transform hover:scale-105"
                  )}
                >
                  {crawlStatus.isActive ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      爬取中...
                    </span>
                  ) : '🚀 快速更新数据'}
                </button>
              </div>
              
              {crawlStatus.isActive && (
                <div className="mt-2">
                  <div className="text-sm text-gray-600 mb-1">{crawlStatus.message}</div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${crawlStatus.progress}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
{/* 搜索和筛选区域 */}
<div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">🔍 宠物搜索与浏览</h2>
                <button 
                  onClick={() => setShowFilter(true)}
                  className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
                >
                  🎛️ 高级筛选
                </button>
              </div>
              
              {searchQuery && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-blue-700">
                    搜索关键词: "<strong>{searchQuery}</strong>" | 
                    找到 {adoptablePets.length} 只宠物
                  </p>
                </div>
              )}
              
              {/* 当前筛选条件显示 */}
              <div className="mb-4 text-sm text-gray-600">
                当前筛选条件: 
                {filters.type !== 'all' && <span className="ml-2 px-2 py-1 bg-gray-100 rounded">类型: {filters.type}</span>}
                {filters.location && <span className="ml-2 px-2 py-1 bg-gray-100 rounded">地区: {filters.location}</span>}
                {filters.breed && <span className="ml-2 px-2 py-1 bg-gray-100 rounded">品种: {filters.breed}</span>}
                {filters.age && <span className="ml-2 px-2 py-1 bg-gray-100 rounded">年龄: {filters.age}</span>}
                {filters.size && <span className="ml-2 px-2 py-1 bg-gray-100 rounded">体型: {filters.size}</span>}
                {filters.gender && <span className="ml-2 px-2 py-1 bg-gray-100 rounded">性别: {filters.gender}</span>}
                {Object.keys(filters).length === 1 && filters.type === 'all' && (
                  <span className="ml-2 text-gray-400">无筛选条件</span>
                )}
              </div>
              
              {/* 显示爬取状态 */}
              {crawlStatus.lastCrawlTime && (
                <div className="mb-4 p-3 bg-green-50 rounded-lg">
                  <p className="text-green-700 text-sm">
                    📡 最近更新: {crawlStatus.lastCrawlTime.toLocaleString('zh-CN')} | 
                    新增 {crawlStatus.lastCrawlCount} 条数据
                  </p>
                </div>
              )}
            </div>
            
            
            {/* 宠物列表 - 直接显示 */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  🐾 待领养宠物
                  <span className="text-sm font-normal text-gray-500 ml-2">
                    (共 {pagination.totalCount} 只)
                  </span>
                </h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleRefresh}
                    disabled={isLoading}
                    className={clsx(
                      "px-3 py-1 text-sm rounded-lg transition-colors",
                      isLoading 
                        ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    )}
                  >
                    {isLoading ? '🔄 刷新中...' : '🔄 刷新'}
                  </button>
                </div>
              </div>
              
              <PetList
                pets={adoptablePets}
                onPetClick={handlePetClick}
                pagination={pagination}
                onLoadMore={handleLoadMore}
                onRefresh={handleRefresh}
                isLoading={isLoading}
              />
            </div>
          </div>
        );

      case 'search':
        return (
          <div className="space-y-6">
            {/* 添加爬取按钮 */}
            <CrawlButton
              onCrawlStart={() => setIsLoading(true)}
              onCrawlComplete={handleCrawlComplete}
              onCrawlError={handleCrawlError}
              disabled={isLoading}
            />
            
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">🔍 宠物搜索</h2>
                <button 
                  onClick={() => setShowFilter(true)}
                  className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
                >
                  🎛️ 高级筛选
                </button>
              </div>
              
              {searchQuery && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-blue-700">
                    搜索关键词: "<strong>{searchQuery}</strong>" | 
                    找到 {adoptablePets.length} 只宠物
                  </p>
                </div>
              )}
              
              <div className="mb-4 text-sm text-gray-600">
                当前筛选条件: 
                {filters.type !== 'all' && <span className="ml-2 px-2 py-1 bg-gray-100 rounded">类型: {filters.type}</span>}
                {filters.location && <span className="ml-2 px-2 py-1 bg-gray-100 rounded">地区: {filters.location}</span>}
                {filters.breed && <span className="ml-2 px-2 py-1 bg-gray-100 rounded">品种: {filters.breed}</span>}
                {filters.age && <span className="ml-2 px-2 py-1 bg-gray-100 rounded">年龄: {filters.age}</span>}
                {filters.size && <span className="ml-2 px-2 py-1 bg-gray-100 rounded">体型: {filters.size}</span>}
                {filters.gender && <span className="ml-2 px-2 py-1 bg-gray-100 rounded">性别: {filters.gender}</span>}
              </div>
              
              {/* 显示爬取状态 */}
              {crawlStatus.lastCrawlTime && (
                <div className="mb-4 p-3 bg-green-50 rounded-lg">
                  <p className="text-green-700 text-sm">
                    📡 最近更新: {crawlStatus.lastCrawlTime.toLocaleString('zh-CN')} | 
                    新增 {crawlStatus.lastCrawlCount} 条数据
                  </p>
                </div>
              )}
            </div>
            
            <PetList
              pets={adoptablePets}
              onPetClick={handlePetClick}
              pagination={pagination}
              onLoadMore={handleLoadMore}
              onRefresh={handleRefresh}
              isLoading={isLoading}
            />
          </div>
        );

        case 'recommend':
          return <LocationBasedRecommendations onPetClick={handlePetClick} />;

      case 'map':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">🗺️ 宠物友好场所地图</h2>
              <p className="text-gray-600 mb-4">找到您附近的宠物医院、宠物店、宠物公园等宠物友好场所，为您的毛孩子提供最好的服务。</p>
               {/* 功能特色 */}
               <div className="grid md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl mb-2">🏥</div>
                  <h4 className="font-medium text-blue-900">宠物医院</h4>
                  <p className="text-sm text-blue-700">24小时宠物医疗服务</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl mb-2">🏪</div>
                  <h4 className="font-medium text-green-900">宠物用品店</h4>
                  <p className="text-sm text-green-700">宠物食品和用品采购</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-2xl mb-2">🌳</div>
                  <h4 className="font-medium text-purple-900">宠物公园</h4>
                  <p className="text-sm text-purple-700">宠物休闲娱乐场所</p>
                </div>
              </div>
              {/* 地图组件 */}
            <NearbyPlaces />
            
              <PetActivityMap activities={nearbyActivities} />
            </div>
          </div>
        );

      case 'admin':
        return <DataManagement />;

      case 'profile':
        return (
          <div className="space-y-6">
            {/* 数据管理区域 */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">📊 数据管理</h2>
              
              <CrawlButton
                onCrawlStart={() => setIsLoading(true)}
                onCrawlComplete={handleCrawlComplete}
                onCrawlError={handleCrawlError}
                disabled={isLoading}
              />
              
              {/* 数据统计 */}
              <div className="grid md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900">总宠物数</h4>
                  <p className="text-2xl font-bold text-blue-600">{pagination.totalCount}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-medium text-green-900">今日新增</h4>
                  <p className="text-2xl font-bold text-green-600">{crawlStatus.lastCrawlCount || 0}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="font-medium text-purple-900">最近更新</h4>
                  <p className="text-sm text-purple-600">
                    {crawlStatus.lastCrawlTime ? 
                      crawlStatus.lastCrawlTime.toLocaleString('zh-CN') : 
                      '暂无数据'
                    }
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">👤 我的档案</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📋</div>
                  <div className="text-gray-500 mb-4">宠物档案管理</div>
                  <p className="text-gray-400 mb-4">您可以在这里管理您的宠物健康档案、疫苗记录等</p>
                  <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    创建宠物档案
                  </button>
                </div>
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">❤️</div>
                  <div className="text-gray-500 mb-4">我的收藏</div>
                  <p className="text-gray-400 mb-4">查看您收藏的宠物和关注的领养信息</p>
                  <button className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                    查看收藏
                  </button>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4">最近活动</h3>
              <div className="space-y-3">
                {adoptionFeed.slice(0, 5).map((activity, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl">
                      {activity.type === 'adoption' && '💖'}
                      {activity.type === 'rescue' && '🆘'}
                      {activity.type === 'medical' && '🏥'}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.message}</p>
                      <p className="text-xs text-gray-500">
                        {format(activity.timestamp, 'MM-dd HH:mm')} • {activity.location}
                      </p>
                    </div>
                  </div>
                ))}
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
                Petpet
              </span>
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                v1.0.0
              </span>
            </div>
            
            <div className="flex-1 max-w-md mx-8 text-center">
              <p className="text-gray-600 font-medium">
                ♥专注毛孩子♥
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <button 
                onClick={handleRefresh}
                className="p-2 text-gray-600 hover:text-purple-600 transition-colors"
                title="刷新数据"
                disabled={isLoading}
              >
                <span className={isLoading ? 'animate-spin' : ''}>🔄</span>
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
                "flex flex-col items-center space-y-1 p-2 transition-colors relative",
                currentView === key ? 'text-purple-600' : 'text-gray-600'
              )}
            >
              <span className="text-xl">{icon}</span>
              <span className="text-xs">{label}</span>
              {key === 'search' && adoptablePets.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center">
                  {adoptablePets.length > 99 ? '99+' : adoptablePets.length}
                </span>
              )}
              {key === 'admin' && crawlStatus.lastCrawlTime && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 text-white text-xs rounded-full flex items-center justify-center">
                  ✓
                </span>
              )}
            </button>
          ))}
        </div>
      </nav>

      {/* 加载指示器 */}
      {isLoading && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-white rounded-lg shadow-lg p-4 flex items-center space-x-3">
            <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-gray-700">加载中...</span>
          </div>
        </div>
      )}

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