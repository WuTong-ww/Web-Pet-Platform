// src/App.js
import React, { useState, useEffect } from 'react';
import { Heart, MapPin, Calendar, Phone, Star, TrendingUp, Camera, MessageCircle, Activity, Bell, Settings, User, Home, Search, Plus, Filter, Map, Stethoscope, Brain, Zap } from 'lucide-react';
import './index.css';

const PetPlatform = () => {
  const [currentView, setCurrentView] = useState('home');
  const [notifications, setNotifications] = useState(3);
  const [selectedPet, setSelectedPet] = useState(null);
  const [adoptionData, setAdoptionData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // 模拟实时数据抓取
  useEffect(() => {
    const mockAdoptionData = [
      {
        id: 1,
        name: "Luna",
        breed: "金毛寻回犬",
        age: "2岁",
        location: "上海市浦东新区",
        image: "https://images.unsplash.com/photo-1552053831-71594a27632d?w=300&h=300&fit=crop",
        popularity: 95,
        tags: ["友善", "已训练", "喜欢小孩"],
        adoptionCenter: "爱心宠物收容所"
      },
      {
        id: 2,
        name: "Max",
        breed: "边境牧羊犬",
        age: "1岁",
        location: "北京市朝阳区",
        image: "https://images.unsplash.com/photo-1551717743-49959800b1f6?w=300&h=300&fit=crop",
        popularity: 88,
        tags: ["聪明", "活跃", "需要运动"],
        adoptionCenter: "北京宠物救助中心"
      },
      {
        id: 3,
        name: "Bella",
        breed: "布偶猫",
        age: "6个月",
        location: "广州市天河区",
        image: "https://images.unsplash.com/photo-1574144611937-0df059b5ef3e?w=300&h=300&fit=crop",
        popularity: 92,
        tags: ["温顺", "美丽", "适合公寓"],
        adoptionCenter: "南方宠物之家"
      }
    ];
    
    setAdoptionData(mockAdoptionData);
  }, []);

  const mockPets = [
    {
      id: 1,
      name: "小白",
      breed: "博美犬",
      age: "3岁",
      weight: "3.2kg",
      image: "https://images.unsplash.com/photo-1605568427561-40dd23c2acea?w=200&h=200&fit=crop",
      healthScore: 95,
      mood: "开心",
      nextVaccine: "2025-08-15",
      lastCheckup: "2025-06-01"
    },
    {
      id: 2,
      name: "橘子",
      breed: "英短猫",
      age: "2岁",
      weight: "4.8kg",
      image: "https://images.unsplash.com/photo-1513245543132-31f507417b26?w=200&h=200&fit=crop",
      healthScore: 87,
      mood: "平静",
      nextVaccine: "2025-09-10",
      lastCheckup: "2025-05-20"
    }
  ];

  const mockActivities = [
    {
      id: 1,
      name: "宠物公园",
      type: "户外活动",
      distance: "1.2km",
      rating: 4.8,
      image: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=300&h=200&fit=crop"
    },
    {
      id: 2,
      name: "猫咪咖啡厅",
      type: "休闲场所",
      distance: "0.8km",
      rating: 4.6,
      image: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=300&h=200&fit=crop"
    },
    {
      id: 3,
      name: "宠物医院",
      type: "医疗服务",
      distance: "2.1km",
      rating: 4.9,
      image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=300&h=200&fit=crop"
    }
  ];

  const NavButton = ({ icon: Icon, label, view, active }) => (
    <button
      onClick={() => setCurrentView(view)}
      className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-300 ${
        active 
          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg transform scale-105' 
          : 'text-gray-600 hover:bg-purple-50 hover:text-purple-600'
      }`}
    >
      <Icon size={20} />
      <span className="font-medium">{label}</span>
    </button>
  );

  const AdoptionCard = ({ pet }) => (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 group">
      <div className="relative">
        <img src={pet.image} alt={pet.name} className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500" />
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 flex items-center space-x-1">
          <TrendingUp size={16} className="text-red-500" />
          <span className="text-sm font-bold text-gray-800">{pet.popularity}%</span>
        </div>
        <div className="absolute bottom-4 left-4 bg-purple-500/90 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-semibold">
          {pet.adoptionCenter}
        </div>
      </div>
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-2">{pet.name}</h3>
        <p className="text-gray-600 mb-2">{pet.breed} • {pet.age}</p>
        <div className="flex items-center text-gray-500 mb-4">
          <MapPin size={16} className="mr-2" />
          <span className="text-sm">{pet.location}</span>
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          {pet.tags.map((tag, index) => (
            <span key={index} className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs font-medium">
              {tag}
            </span>
          ))}
        </div>
        <button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 transform hover:scale-105">
          <Heart size={18} className="inline mr-2" />
          申请领养
        </button>
      </div>
    </div>
  );

  const PetProfileCard = ({ pet }) => (
    <div 
      onClick={() => setSelectedPet(pet)}
      className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
    >
      <div className="flex items-center space-x-4 mb-4">
        <img src={pet.image} alt={pet.name} className="w-16 h-16 rounded-full object-cover border-4 border-purple-200" />
        <div>
          <h3 className="text-lg font-bold text-gray-800">{pet.name}</h3>
          <p className="text-gray-600">{pet.breed} • {pet.age}</p>
        </div>
        <div className="ml-auto">
          <div className="text-right">
            <div className="text-2xl font-bold text-green-500">{pet.healthScore}</div>
            <div className="text-xs text-gray-500">健康指数</div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-blue-50 rounded-xl p-3 text-center">
          <div className="text-blue-600 font-semibold">体重</div>
          <div className="text-xl font-bold text-gray-800">{pet.weight}</div>
        </div>
        <div className="bg-green-50 rounded-xl p-3 text-center">
          <div className="text-green-600 font-semibold">心情</div>
          <div className="text-xl font-bold text-gray-800">{pet.mood}</div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">下次疫苗</span>
          <span className="font-semibold text-orange-600">{pet.nextVaccine}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">上次体检</span>
          <span className="font-semibold text-gray-800">{pet.lastCheckup}</span>
        </div>
      </div>
    </div>
  );

  const ActivityCard = ({ activity }) => (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300">
      <img src={activity.image} alt={activity.name} className="w-full h-32 object-cover" />
      <div className="p-4">
        <h3 className="font-bold text-gray-800 mb-1">{activity.name}</h3>
        <p className="text-gray-600 text-sm mb-2">{activity.type}</p>
        <div className="flex justify-between items-center">
          <div className="flex items-center text-gray-500">
            <MapPin size={14} className="mr-1" />
            <span className="text-sm">{activity.distance}</span>
          </div>
          <div className="flex items-center text-yellow-500">
            <Star size={14} className="mr-1 fill-current" />
            <span className="text-sm font-semibold">{activity.rating}</span>
          </div>
        </div>
      </div>
    </div>
  );

  const AIFeature = ({ icon: Icon, title, description, color }) => (
    <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 group">
      <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
        <Icon size={24} className="text-white" />
      </div>
      <h3 className="text-lg font-bold text-gray-800 mb-2">{title}</h3>
      <p className="text-gray-600 text-sm">{description}</p>
    </div>
  );

  const renderHomeView = () => (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-purple-600 via-purple-700 to-pink-600 rounded-3xl p-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <h1 className="text-4xl font-bold mb-4">智能宠物管理平台</h1>
          <p className="text-purple-100 text-lg mb-6">AI驱动，实时数据，让宠物生活更美好</p>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center">
              <div className="text-2xl font-bold">2,847</div>
              <div className="text-sm text-purple-100">待领养宠物</div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center">
              <div className="text-2xl font-bold">1,234</div>
              <div className="text-sm text-purple-100">活跃用户</div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center">
              <div className="text-2xl font-bold">89%</div>
              <div className="text-sm text-purple-100">成功领养率</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <button 
          onClick={() => setCurrentView('adoption')}
          className="bg-gradient-to-r from-green-500 to-emerald-500 text-white p-6 rounded-2xl font-semibold hover:shadow-lg transition-all duration-300 transform hover:scale-105"
        >
          <Heart size={24} className="mb-2" />
          浏览领养
        </button>
        <button 
          onClick={() => setCurrentView('profiles')}
          className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white p-6 rounded-2xl font-semibold hover:shadow-lg transition-all duration-300 transform hover:scale-105"
        >
          <User size={24} className="mb-2" />
          我的宠物
        </button>
      </div>

      {/* Latest Adoptions */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">最新领养动态</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {adoptionData.slice(0, 3).map(pet => (
            <AdoptionCard key={pet.id} pet={pet} />
          ))}
        </div>
      </div>
    </div>
  );

  const renderAdoptionView = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-800">全球领养动态</h2>
        <div className="flex space-x-2">
          <button className="px-4 py-2 bg-purple-100 text-purple-700 rounded-xl hover:bg-purple-200 transition-colors duration-300">
            <Filter size={18} className="inline mr-2" />
            筛选
          </button>
          <button className="px-4 py-2 bg-green-100 text-green-700 rounded-xl hover:bg-green-200 transition-colors duration-300">
            <TrendingUp size={18} className="inline mr-2" />
            热度榜
          </button>
        </div>
      </div>

      {/* Real-time Stats */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-2xl p-6">
        <h3 className="text-xl font-bold mb-4">实时统计</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold">156</div>
            <div className="text-orange-100">今日新增</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">42</div>
            <div className="text-orange-100">成功配对</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">98%</div>
            <div className="text-orange-100">用户满意度</div>
          </div>
        </div>
      </div>

      {/* Adoption Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {adoptionData.map(pet => (
          <AdoptionCard key={pet.id} pet={pet} />
        ))}
      </div>
    </div>
  );

  const renderMapView = () => (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-800">本地宠物活动地图</h2>
      
      {/* Map Placeholder */}
      <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl h-64 flex items-center justify-center text-white">
        <div className="text-center">
          <Map size={48} className="mx-auto mb-4" />
          <h3 className="text-xl font-bold">交互式地图</h3>
          <p className="text-blue-100">显示附近的宠物活动场所</p>
        </div>
      </div>

      {/* Nearby Activities */}
      <div>
        <h3 className="text-xl font-bold text-gray-800 mb-4">附近推荐</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {mockActivities.map(activity => (
            <ActivityCard key={activity.id} activity={activity} />
          ))}
        </div>
      </div>
    </div>
  );

  const renderProfilesView = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-800">我的宠物档案</h2>
        <button className="px-4 py-2 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-colors duration-300">
          <Plus size={18} className="inline mr-2" />
          添加宠物
        </button>
      </div>

      {/* Health Dashboard */}
      <div className="bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-2xl p-6">
        <h3 className="text-xl font-bold mb-4">健康总览</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
            <div className="text-2xl font-bold">2</div>
            <div className="text-green-100">宠物总数</div>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
            <div className="text-2xl font-bold">91%</div>
            <div className="text-green-100">平均健康指数</div>
          </div>
        </div>
      </div>

      {/* Pet Profiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {mockPets.map(pet => (
          <PetProfileCard key={pet.id} pet={pet} />
        ))}
      </div>

      {/* Nutrition Calculator */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">
          <Stethoscope size={24} className="inline mr-2 text-blue-500" />
          营养计算器
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">宠物选择</label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500">
              <option>小白 (博美犬)</option>
              <option>橘子 (英短猫)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">活动量</label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500">
              <option>低活动量</option>
              <option>中等活动量</option>
              <option>高活动量</option>
            </select>
          </div>
          <div className="flex items-end">
            <button className="w-full bg-purple-500 text-white py-2 rounded-lg hover:bg-purple-600 transition-colors duration-300">
              计算营养需求
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAIView = () => (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-800">AI 智能功能</h2>

      {/* AI Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AIFeature 
          icon={Brain}
          title="宠物心情AI评估"
          description="上传照片，AI分析宠物情绪状态，提供关怀建议"
          color="bg-gradient-to-r from-purple-500 to-indigo-500"
        />
        <AIFeature 
          icon={MessageCircle}
          title="智能咨询助手"
          description="24/7在线，回答饲养、训练、健康等问题"
          color="bg-gradient-to-r from-green-500 to-emerald-500"
        />
        <AIFeature 
          icon={Zap}
          title="急诊模式"
          description="紧急情况快速响应，提供即时处理建议"
          color="bg-gradient-to-r from-red-500 to-pink-500"
        />
        <AIFeature 
          icon={Activity}
          title="健康预测"
          description="基于历史数据，预测潜在健康风险"
          color="bg-gradient-to-r from-blue-500 to-cyan-500"
        />
      </div>

      {/* AI Demo */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">
          <Camera size={24} className="inline mr-2 text-purple-500" />
          宠物心情分析演示
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-purple-500 transition-colors duration-300">
              <Camera size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">点击或拖拽上传宠物照片</p>
              <button className="mt-4 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors duration-300">
                选择照片
              </button>
            </div>
          </div>
          <div className="bg-gray-50 rounded-xl p-6">
            <h4 className="font-semibold text-gray-800 mb-4">AI分析结果</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">开心指数</span>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{width: '85%'}}></div>
                  </div>
                  <span className="text-sm font-semibold">85%</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">焦虑程度</span>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div className="bg-yellow-500 h-2 rounded-full" style={{width: '15%'}}></div>
                  </div>
                  <span className="text-sm font-semibold">15%</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">疲惫程度</span>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div className="bg-orange-500 h-2 rounded-full" style={{width: '30%'}}></div>
                  </div>
                  <span className="text-sm font-semibold">30%</span>
                </div>
              </div>
            </div>
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>AI建议：</strong> 您的宠物看起来心情不错！建议适当休息，可以准备一些小零食作为奖励。
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Interface */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">
          <MessageCircle size={24} className="inline mr-2 text-green-500" />
          智能咨询助手
        </h3>
        <div className="bg-gray-50 rounded-xl p-4 h-64 overflow-y-auto mb-4">
          <div className="space-y-3">
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <p className="text-sm text-gray-800"><strong>AI助手：</strong> 您好！我是您的宠物专家助手，有什么问题可以问我。</p>
            </div>
            <div className="bg-purple-500 text-white p-3 rounded-lg ml-8">
              <p className="text-sm">我的狗狗最近不爱吃饭，怎么办？</p>
            </div>
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <p className="text-sm text-gray-800"><strong>AI助手：</strong> 狗狗食欲下降可能有多种原因。建议：1) 检查食物是否新鲜 2) 观察是否有其他症状 3) 尝试更换食物品牌 4) 如持续3天以上建议就医检查。</p>
            </div>
          </div>
        </div>
        <div className="flex space-x-2">
          <input 
            type="text" 
            placeholder="输入您的问题..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
          />
          <button className="px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors duration-300">
            发送
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <Heart size={24} className="text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                PetCare AI
              </h1>
            </div>
            
            <nav className="hidden md:flex items-center space-x-2">
              <NavButton icon={Home} label="首页" view="home" active={currentView === 'home'} />
              <NavButton icon={Heart} label="领养" view="adoption" active={currentView === 'adoption'} />
              <NavButton icon={Map} label="地图" view="map" active={currentView === 'map'} />
              <NavButton icon={User} label="档案" view="profiles" active={currentView === 'profiles'} />
              <NavButton icon={Brain} label="AI功能" view="ai" active={currentView === 'ai'} />
            </nav>

            <div className="flex items-center space-x-3">
              <button className="relative p-2 text-gray-600 hover:text-purple-600 transition-colors duration-300">
                <Bell size={24} />
                {notifications > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                    {notifications}
                  </span>
                )}
              </button>
              <button className="p-2 text-gray-600 hover:text-purple-600 transition-colors duration-300">
                <Settings size={24} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {currentView === 'home' && renderHomeView()}
        {currentView === 'adoption' && renderAdoptionView()}
        {currentView === 'map' && renderMapView()}
        {currentView === 'profiles' && renderProfilesView()}
        {currentView === 'ai' && renderAIView()}
      </main>

      {/* Mobile Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm border-t border-gray-200">
        <div className="flex justify-around py-2">
          {[
            { icon: Home, view: 'home' },
            { icon: Heart, view: 'adoption' },
            { icon: Map, view: 'map' },
            { icon: User, view: 'profiles' },
            { icon: Brain, view: 'ai' }
          ].map(({ icon: Icon, view }) => (
            <button
              key={view}
              onClick={() => setCurrentView(view)}
              className={`p-3 rounded-xl transition-all duration-300 ${
                currentView === view 
                  ? 'bg-purple-500 text-white' 
                  : 'text-gray-600'
              }`}
            >
              <Icon size={24} />
            </button>
          ))}
        </div>
      </nav>

      {/* Pet Detail Modal */}
      {selectedPet && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">{selectedPet.name} 详细档案</h2>
              <button 
                onClick={() => setSelectedPet(null)}
                className="text-gray-500 hover:text-gray-700 transition-colors duration-300"
              >
                ✕
              </button>
            </div>
            
            <img src={selectedPet.image} alt={selectedPet.name} className="w-full h-48 object-cover rounded-2xl mb-6" />
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-purple-50 rounded-xl p-4 text-center">
                  <div className="text-purple-600 font-semibold">品种</div>
                  <div className="text-lg font-bold text-gray-800">{selectedPet.breed}</div>
                </div>
                <div className="bg-blue-50 rounded-xl p-4 text-center">
                  <div className="text-blue-600 font-semibold">年龄</div>
                  <div className="text-lg font-bold text-gray-800">{selectedPet.age}</div>
                </div>
              </div>
              
              <div className="bg-green-50 rounded-xl p-4">
                <div className="text-green-600 font-semibold mb-2">健康状况</div>
                <div className="flex items-center justify-between">
                  <span>健康指数</span>
                  <span className="text-2xl font-bold text-green-600">{selectedPet.healthScore}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{width: `${selectedPet.healthScore}%`}}></div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">当前心情</span>
                  <span className="font-semibold">{selectedPet.mood}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">下次疫苗</span>
                  <span className="font-semibold">{selectedPet.nextVaccine}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">上次体检</span>
                  <span className="font-semibold">{selectedPet.lastCheckup}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PetPlatform;