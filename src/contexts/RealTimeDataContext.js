import React, { createContext, useState, useEffect, useContext } from 'react';
import { fetchAdoptablePets, fetchPopularPets, searchPets } from '../services/adoptionService';
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
    type: 'all',
    size: '',
    gender: '',
    query: ''
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalCount: 0,
    hasNextPage: false,
    hasPreviousPage: false
  });
  
  // 全局统计数据状态
  const [globalStats, setGlobalStats] = useState({
    totalPets: 0,
    adoptedToday: 0,
    activeUsers: 0,
    successRate: 0,
    newPetsToday: 0,
    lastUpdated: null
  });

  // 爬取状态管理
  const [crawlStatus, setCrawlStatus] = useState({
    isActive: false,
    progress: 0,
    message: '',
    lastCrawlTime: null,
    lastCrawlCount: 0
  });

  // 从真实数据计算全局统计数据
  const calculateGlobalStats = (pets, totalCount) => {
    const now = new Date();
    const todayStart = new Date(now.setHours(0, 0, 0, 0));
    
    const todayPets = pets.filter(pet => 
      pet.postedDate && new Date(pet.postedDate) >= todayStart
    );
    
    return {
      totalPets: totalCount,
      adoptedToday: Math.floor(Math.random() * 50) + 20,
      activeUsers: Math.floor(Math.random() * 100) + 500,
      successRate: Math.floor(Math.random() * 20) + 80,
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
          type: 'adoption',
          petName: '小白',
          petBreed: '中华田园犬',
          adopterName: '王女士',
          location: '深圳市',
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
          message: '小白通过深圳宠物领养网找到了新家！'
        },
        {
          id: 4,
          type: 'medical',
          petName: 'Buddy',
          petBreed: 'Golden Retriever',
          centerName: '爱心动物医院',
          location: '广州市',
          timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
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
  const loadAdoptablePets = async (currentFilters = filters, page = 1, limit = 50) => {
    try {
      setIsLoading(true);
      setConnectionStatus('connecting');
      
      console.log('正在加载宠物数据...', { filters: currentFilters, page, limit });
      
      const result = await fetchAdoptablePets(currentFilters, page, limit);
      
      if (page === 1) {
        // 第一页，替换数据
        setAdoptablePets(result.pets);
      } else {
        // 后续页面，追加数据
        setAdoptablePets(prev => [...prev, ...result.pets]);
      }
      
      setPagination(result.pagination);
      
      // 计算全局统计数据
      const stats = calculateGlobalStats(result.pets, result.pagination.totalCount);
      setGlobalStats(stats);
      
      setConnectionStatus('connected');
      setError(null);
      
      console.log('成功加载宠物数据:', result.pets.length, '只宠物，总计:', result.pagination.totalCount);
      
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
      console.log('正在加载热门宠物...');
      
      const pets = await fetchPopularPets(15); // 获取前15只热门宠物
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

  // 加载更多宠物
  const loadMorePets = async () => {
    if (!pagination.hasNextPage || isLoading) return;
    
    const nextPage = pagination.currentPage + 1;
    await loadAdoptablePets(filters, nextPage, 50);
  };

  // 重置并加载第一页
  const resetAndLoadFirstPage = async (newFilters = filters) => {
    setFilters(newFilters);
    await loadAdoptablePets(newFilters, 1, 50);
  };

  // 搜索宠物
  const searchPetsWithFilters = async (query, searchFilters = filters) => {
    try {
      setIsLoading(true);
      setConnectionStatus('connecting');
      
      console.log('正在搜索宠物:', query, searchFilters);
      
      const result = await searchPets(query, searchFilters, 1, 50);
      
      setAdoptablePets(result.pets);
      setPagination(result.pagination);
      
      // 更新筛选条件
      const updatedFilters = { ...searchFilters, query };
      setFilters(updatedFilters);
      
      // 计算全局统计数据
      const stats = calculateGlobalStats(result.pets, result.pagination.totalCount);
      setGlobalStats(stats);
      
      setConnectionStatus('connected');
      setError(null);
      
      console.log('搜索完成:', result.pets.length, '只宠物');
      
    } catch (err) {
      console.error('搜索宠物失败:', err);
      setError('Failed to search pets');
      setConnectionStatus('disconnected');
    } finally {
      setIsLoading(false);
    }
  };

  // 手动触发爬取
  const triggerCrawl = async (onComplete) => {
    if (crawlStatus.isActive) return;
    
    // 设置爬取状态
    setCrawlStatus(prev => ({
      ...prev,
      isActive: true,
      progress: 0,
      message: '正在连接爬虫服务...'
    }));
    
    try {
      // 启动爬虫
      const response = await fetch('http://localhost:3001/api/crawl/start', {
        method: 'POST'
      });
      
      // 处理响应
      if (response.ok) {
        // 爬虫启动成功，等待完成
        const result = await response.json();
        setCrawlStatus(prev => ({
          ...prev,
          message: '爬取已开始，正在处理数据...'
        }));
        
        // 刷新数据
        await refreshData();
        
        // 更新爬取状态
        setCrawlStatus(prev => ({
          ...prev,
          isActive: false,
          lastCrawlTime: new Date(),
          lastCrawlCount: result.count || 0,
          progress: 100,
          message: '爬取完成！'
        }));
      } else {
        throw new Error('启动爬虫失败');
      }
    } catch (error) {
      console.error('爬虫错误:', error);
      setCrawlStatus(prev => ({
        ...prev,
        isActive: false,
        message: `爬取失败: ${error.message}`
      }));
    } finally {
      // 调用完成回调，通知组件爬取过程已完成
      if (typeof onComplete === 'function') {
        onComplete();
      }
    }
  };

  // 重置爬取状态
  const resetCrawlStatus = () => {
    setCrawlStatus({
      isActive: false,
      progress: 0,
      message: '',
      lastCrawlTime: null,
      lastCrawlCount: 0
    });
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
      if (filters.query) {
        // 如果有搜索词，执行搜索
        searchPetsWithFilters(filters.query, filters);
      } else {
        // 否则执行正常筛选
        loadAdoptablePets(filters, 1, 50);
      }
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
        loadAdoptablePets(filters, 1, 50),
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
      const stats = calculateGlobalStats(adoptablePets, pagination.totalCount);
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
    pagination,
    crawlStatus,
    setFilters,
    refreshData,
    refreshStats,
    loadMorePets,
    resetAndLoadFirstPage,
    searchPetsWithFilters,
    triggerCrawl,
    resetCrawlStatus
  };

  return (
    <RealTimeDataContext.Provider value={contextValue}>
      {children}
    </RealTimeDataContext.Provider>
  );
};