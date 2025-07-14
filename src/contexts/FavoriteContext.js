import React, { createContext, useContext, useState, useEffect } from 'react';

const FavoriteContext = createContext();

export const useFavorite = () => {
  const context = useContext(FavoriteContext);
  if (!context) {
    throw new Error('useFavorite must be used within a FavoriteProvider');
  }
  return context;
};

export const FavoriteProvider = ({ children }) => {
  const [favorites, setFavorites] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // 从本地存储加载收藏
  useEffect(() => {
    const savedFavorites = localStorage.getItem('pet_favorites');
    if (savedFavorites) {
      try {
        const parsed = JSON.parse(savedFavorites);
        setFavorites(parsed);
      } catch (error) {
        console.error('加载收藏数据失败:', error);
      }
    }
  }, []);

  // 保存到本地存储
  const saveToLocalStorage = (favoritesData) => {
    try {
      localStorage.setItem('pet_favorites', JSON.stringify(favoritesData));
    } catch (error) {
      console.error('保存收藏数据失败:', error);
    }
  };

  // 添加收藏
  const addToFavorites = (pet) => {
    if (!pet || !pet.id) return;

    const favoriteItem = {
      id: pet.id,
      name: pet.name,
      type: pet.type,
      breed: pet.breed,
      age: pet.age,
      gender: pet.gender,
      image: pet.image,
      source: pet.source,
      location: pet.location,
      description: pet.description,
      tags: pet.tags || [],
      contact: pet.contact,
      detailUrl: pet.detailUrl,
      addedAt: new Date().toISOString(),
      originalPet: pet // 保存完整的宠物信息
    };

    const newFavorites = [...favorites, favoriteItem];
    setFavorites(newFavorites);
    saveToLocalStorage(newFavorites);
  };

  // 移除收藏
  const removeFromFavorites = (petId) => {
    const newFavorites = favorites.filter(fav => fav.id !== petId);
    setFavorites(newFavorites);
    saveToLocalStorage(newFavorites);
  };

  // 检查是否已收藏
  const isFavorited = (petId) => {
    return favorites.some(fav => fav.id === petId);
  };

  // 清空收藏
  const clearFavorites = () => {
    setFavorites([]);
    saveToLocalStorage([]);
  };

  // 获取收藏统计
  const getFavoriteStats = () => {
    const stats = {
      total: favorites.length,
      dogs: favorites.filter(f => f.type?.toLowerCase() === 'dog').length,
      cats: favorites.filter(f => f.type?.toLowerCase() === 'cat').length,
      others: favorites.filter(f => !['dog', 'cat'].includes(f.type?.toLowerCase())).length,
      recentlyAdded: favorites.filter(f => {
        const addedDate = new Date(f.addedAt);
        const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
        return addedDate > threeDaysAgo;
      }).length
    };
    return stats;
  };

  const value = {
    favorites,
    isLoading,
    addToFavorites,
    removeFromFavorites,
    isFavorited,
    clearFavorites,
    getFavoriteStats
  };

  return (
    <FavoriteContext.Provider value={value}>
      {children}
    </FavoriteContext.Provider>
  );
};