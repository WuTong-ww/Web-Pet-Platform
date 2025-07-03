import React, { createContext, useState, useEffect, useContext } from 'react';
import { fetchAdoptablePets, fetchPopularPets } from '../services/adoptionService';
import { fetchNearbyActivities } from '../services/mapService';

const RealTimeDataContext = createContext();

export const useRealTimeData = () => useContext(RealTimeDataContext);

export const RealTimeDataProvider = ({ children }) => {
  const [adoptablePets, setAdoptablePets] = useState([]);
  const [popularPets, setPopularPets] = useState([]);
  const [nearbyActivities, setNearbyActivities] = useState([]);
  const [adoptionFeed, setAdoptionFeed] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [filters, setFilters] = useState({
    location: '',
    breed: '',
    age: '',
    type: 'all'
  });
  const [activityFilter, setActivityFilter] = useState('');
  
  // 全局统计数据状态
  const [globalStats, setGlobalStats] = useState({
    totalPets: 0,
    adoptedToday: 0,
    activeUsers: 0,
    successRate: 0,
    newPetsToday: 0,
    lastUpdated: null
  });

  // 从真实 API 数据计算全局统计数据
  const calculateGlobalStats = (pets) => {
    const now = new Date();
    const todayStart = new Date(now.setHours(0, 0, 0, 0));
    
    const todayPets = pets.filter(pet => 
      pet.postedDate && new Date(pet.postedDate) >= todayStart
    );
    
    return {
      totalPets: pets.length,
      adoptedToday: Math.floor(Math.random() * 50) + 20, // 模拟今日领养数
      activeUsers: Math.floor(Math.random() * 100) + 500, // 模拟活跃用户
      successRate: Math.floor(Math.random() * 20) + 80, // 模拟成功率
      newPetsToday: todayPets.length,
      lastUpdated: new Date()
    };
  };

  // 获取领养动态
  const fetchAdoptionFeed = async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const feed = [
        {
          id: 1,
          type: 'adoption',
          petName: 'Charlie',
          petBreed: 'Labrador Retriever',
          adopterName: '张先生',
          location: '上海市',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          message: '恭喜 Charlie 找到了新家！'
        },
        {
          id: 2,
          type: 'rescue',
          petName: 'Whiskers',
          petBreed: 'Domestic Shorthair',
          rescuerName: '李女士',
          location: '北京市',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
          message: '感谢李女士救助了 Whiskers'
        },
        {
          id: 3,
          type: 'medical',
          petName: 'Buddy',
          petBreed: 'Golden Retriever',
          centerName: '爱心动物医院',
          location: '广州市',
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
          message: 'Buddy 完成了健康检查'
        }
      ];
      
      setAdoptionFeed(feed);
      return feed;
    } catch (error) {
      console.error('获取领养动态失败:', error);
      throw error;
    }
  };

  // 加载可领养宠物
  const loadAdoptablePets = async (currentFilters = filters) => {
    try {
      setIsLoading(true);
      setConnectionStatus('connecting');
      
      console.log('正在从 Petfinder API 加载宠物数据...');
      
      const pets = await fetchAdoptablePets(currentFilters);
      setAdoptablePets(pets);
      
      // 计算全局统计数据
      const stats = calculateGlobalStats(pets);
      setGlobalStats(stats);
      
      setConnectionStatus('connected');
      setError(null);
      
      console.log('成功加载宠物数据:', pets.length, '只宠物');
      
    } catch (err) {
      console.error('加载宠物数据失败:', err);
      setError('Failed to fetch adoptable pets');
      setConnectionStatus('disconnected');
    } finally {
      setIsLoading(false);
    }
  };

  // 加载热门宠物
  const loadPopularPets = async () => {
    try {
      console.log('正在从 Petfinder API 加载热门宠物...');
      
      const pets = await fetchPopularPets();
      setPopularPets(pets);
      
      console.log('成功加载热门宠物:', pets.length, '只宠物');
      
    } catch (err) {
      console.error('加载热门宠物失败:', err);
      setError('Failed to fetch popular pets');
    }
  };

  // 加载附近活动
  const loadNearbyActivities = async () => {
    try {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            const activities = await fetchNearbyActivities(latitude, longitude);
            setNearbyActivities(activities);
          },
          async (err) => {
            console.error('获取位置失败:', err);
            const activities = await fetchNearbyActivities();
            setNearbyActivities(activities);
          }
        );
      } else {
        const activities = await fetchNearbyActivities();
        setNearbyActivities(activities);
      }
    } catch (err) {
      console.error('加载附近活动失败:', err);
    }
  };

  // 初始化数据加载
  useEffect(() => {
    const initializeData = async () => {
      try {
        await Promise.all([
          loadAdoptablePets(),
          loadPopularPets(),
          loadNearbyActivities(),
          fetchAdoptionFeed()
        ]);
      } catch (error) {
        console.error('初始化数据失败:', error);
      }
    };

    initializeData();
  }, []);

  // 当筛选条件变化时重新加载数据
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      loadAdoptablePets(filters);
    }, 500); // 500ms 防抖

    return () => clearTimeout(debounceTimer);
  }, [filters]);

  // 定期刷新数据
  useEffect(() => {
    // 每5分钟刷新一次热门宠物
    const popularPetsInterval = setInterval(loadPopularPets, 5 * 60 * 1000);
    
    // 每小时刷新一次附近活动
    const activitiesInterval = setInterval(loadNearbyActivities, 60 * 60 * 1000);
    
    // 每分钟刷新一次领养动态
    const feedInterval = setInterval(fetchAdoptionFeed, 60 * 1000);
    
    return () => {
      clearInterval(popularPetsInterval);
      clearInterval(activitiesInterval);
      clearInterval(feedInterval);
    };
  }, []);

  // 刷新所有数据
  const refreshData = async () => {
    try {
      setIsLoading(true);
      await Promise.all([
        loadAdoptablePets(),
        loadPopularPets(),
        loadNearbyActivities(),
        fetchAdoptionFeed()
      ]);
    } catch (err) {
      console.error('刷新数据失败:', err);
      setError('Failed to refresh data');
    } finally {
      setIsLoading(false);
    }
  };

  // 仅刷新统计数据
  const refreshStats = async () => {
    try {
      setConnectionStatus('connecting');
      
      // 重新计算统计数据
      const stats = calculateGlobalStats(adoptablePets);
      setGlobalStats(stats);
      
      setConnectionStatus('connected');
    } catch (err) {
      console.error('刷新统计数据失败:', err);
      setConnectionStatus('disconnected');
    }
  };

  const contextValue = {
    adoptablePets,
    popularPets,
    nearbyActivities,
    adoptionFeed,
    globalStats,
    isLoading,
    error,
    connectionStatus,
    filters,
    activityFilter,
    setFilters,
    setActivityFilter,
    refreshData,
    refreshStats
  };

  return (
    <RealTimeDataContext.Provider value={contextValue}>
      {children}
    </RealTimeDataContext.Provider>
  );
};