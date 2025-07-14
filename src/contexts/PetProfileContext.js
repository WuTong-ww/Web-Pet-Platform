import React, { createContext, useContext, useState, useEffect } from 'react';

const PetProfileContext = createContext();

export const usePetProfile = () => {
  const context = useContext(PetProfileContext);
  if (!context) {
    throw new Error('usePetProfile must be used within a PetProfileProvider');
  }
  return context;
};

export const PetProfileProvider = ({ children }) => {
  const [petProfiles, setPetProfiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // 从本地存储加载宠物档案
  useEffect(() => {
    const savedProfiles = localStorage.getItem('petProfiles');
    if (savedProfiles) {
      setPetProfiles(JSON.parse(savedProfiles));
    }
  }, []);

  // 保存到本地存储
  const saveToLocalStorage = (profiles) => {
    localStorage.setItem('petProfiles', JSON.stringify(profiles));
  };

  // 创建新的宠物档案
  const createPetProfile = async (profileData) => {
    setIsLoading(true);
    try {
      const newProfile = {
        id: `pet_${Date.now()}`,
        ...profileData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        medicalHistory: [],
        nutritionPlan: null
      };
      
      const updatedProfiles = [...petProfiles, newProfile];
      setPetProfiles(updatedProfiles);
      saveToLocalStorage(updatedProfiles);
      
      return newProfile;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // 更新宠物档案
  const updatePetProfile = async (petId, updates) => {
    setIsLoading(true);
    try {
      const updatedProfiles = petProfiles.map(profile => 
        profile.id === petId 
          ? { ...profile, ...updates, updatedAt: new Date().toISOString() }
          : profile
      );
      
      setPetProfiles(updatedProfiles);
      saveToLocalStorage(updatedProfiles);
      
      return updatedProfiles.find(p => p.id === petId);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // 删除宠物档案
  const deletePetProfile = async (petId) => {
    setIsLoading(true);
    try {
      const updatedProfiles = petProfiles.filter(profile => profile.id !== petId);
      setPetProfiles(updatedProfiles);
      saveToLocalStorage(updatedProfiles);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // 添加医疗记录
  const addMedicalRecord = async (petId, medicalRecord) => {
    const record = {
      id: `medical_${Date.now()}`,
      ...medicalRecord,
      createdAt: new Date().toISOString()
    };
    
    const pet = petProfiles.find(p => p.id === petId);
    if (!pet) throw new Error('宠物档案不存在');
    
    const updatedMedicalHistory = [...(pet.medicalHistory || []), record];
    await updatePetProfile(petId, { medicalHistory: updatedMedicalHistory });
    
    return record;
  };

  // 生成营养计划
  const generateNutritionPlan = async (petId) => {
    const pet = petProfiles.find(p => p.id === petId);
    if (!pet) throw new Error('宠物档案不存在');
    
    const nutritionPlan = calculateNutritionPlan(pet);
    await updatePetProfile(petId, { nutritionPlan });
    
    return nutritionPlan;
  };

  const value = {
    petProfiles,
    isLoading,
    error,
    createPetProfile,
    updatePetProfile,
    deletePetProfile,
    addMedicalRecord,
    generateNutritionPlan
  };

  return (
    <PetProfileContext.Provider value={value}>
      {children}
    </PetProfileContext.Provider>
  );
};

// 营养计算工具函数
const calculateNutritionPlan = (pet) => {
  const { species, breed, weight, age, activityLevel, healthCondition } = pet;
  
  // 基础代谢率计算
  const calculateBMR = () => {
    let bmr = 0;
    
    if (species === 'dog') {
      // 狗的基础代谢率 = 30 × 体重(kg) + 70
      bmr = 30 * weight + 70;
    } else if (species === 'cat') {
      // 猫的基础代谢率 = 40 × 体重(kg) + 60
      bmr = 40 * weight + 60;
    }
    
    return bmr;
  };

  // 活动系数
  const getActivityFactor = () => {
    const factors = {
      'low': 1.2,        // 低活动量
      'moderate': 1.4,   // 中等活动量
      'high': 1.6,       // 高活动量
      'very_high': 1.8   // 极高活动量
    };
    return factors[activityLevel] || 1.4;
  };

  // 年龄系数
  const getAgeFactor = () => {
    if (age < 1) return 2.0;      // 幼体
    if (age < 7) return 1.0;      // 成体
    return 0.8;                   // 老体
  };

  const bmr = calculateBMR();
  const activityFactor = getActivityFactor();
  const ageFactor = getAgeFactor();
  
  const dailyCalories = Math.round(bmr * activityFactor * ageFactor);
  
  // 营养配比建议
  const nutritionRatio = {
    protein: species === 'cat' ? 0.35 : 0.25,  // 猫需要更多蛋白质
    fat: species === 'cat' ? 0.15 : 0.10,
    carbs: species === 'cat' ? 0.05 : 0.15,    // 猫需要更少碳水化合物
    fiber: 0.05,
    water: 0.40
  };

  // 每日食物建议
  const dailyFood = {
    dryFood: Math.round(dailyCalories / 350 * 100), // 干粮 (g)
    wetFood: Math.round(dailyCalories / 80 * 100),  // 湿粮 (g)
    treats: Math.round(dailyCalories * 0.1 / 20),   // 零食 (g)
    water: Math.round(weight * 50)                   // 水 (ml)
  };

  return {
    id: `nutrition_${Date.now()}`,
    petId: pet.id,
    dailyCalories,
    nutritionRatio,
    dailyFood,
    recommendations: generateRecommendations(pet, dailyCalories),
    generatedAt: new Date().toISOString()
  };
};

// 生成个性化建议
const generateRecommendations = (pet, dailyCalories) => {
  const recommendations = [];
  
  // 基于年龄的建议
  if (pet.age < 1) {
    recommendations.push({
      type: 'age',
      title: '幼体营养建议',
      content: '幼体需要高蛋白、高脂肪的食物来支持快速生长。建议每天喂食3-4次。'
    });
  } else if (pet.age > 7) {
    recommendations.push({
      type: 'age',
      title: '老年宠物营养建议',
      content: '老年宠物新陈代谢较慢，建议选择易消化、低脂肪的食物，适量补充关节保健品。'
    });
  }
  
  // 基于体重的建议
  if (pet.weight > getIdealWeight(pet.species, pet.breed)) {
    recommendations.push({
      type: 'weight',
      title: '体重管理建议',
      content: '宠物体重偏高，建议减少20%的食物摄入量，增加运动量。'
    });
  }
  
  // 基于品种的建议
  if (pet.species === 'cat') {
    recommendations.push({
      type: 'species',
      title: '猫咪特殊营养需求',
      content: '猫咪需要牛磺酸、精氨酸等特殊营养素，建议选择专业猫粮。'
    });
  }
  
  return recommendations;
};

// 获取理想体重范围
const getIdealWeight = (species, breed) => {
  // 简化的理想体重数据
  const idealWeights = {
    dog: {
      'small': 5,
      'medium': 15,
      'large': 30
    },
    cat: {
      'default': 4.5
    }
  };
  
  if (species === 'dog') {
    if (breed.toLowerCase().includes('chihuahua') || breed.toLowerCase().includes('pomeranian')) {
      return idealWeights.dog.small;
    } else if (breed.toLowerCase().includes('labrador') || breed.toLowerCase().includes('golden')) {
      return idealWeights.dog.large;
    }
    return idealWeights.dog.medium;
  }
  
  return idealWeights.cat.default;
};