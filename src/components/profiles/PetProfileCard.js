import React from 'react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

const PetProfileCard = ({ pet, onViewDetail, onViewNutrition, onDelete }) => {
  const calculateAge = (birthDate) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  const getSpeciesEmoji = (species) => {
    return species === 'dog' ? '🐕' : '🐱';
  };

  const getHealthStatusColor = (condition) => {
    const colors = {
      healthy: 'bg-green-100 text-green-800',
      overweight: 'bg-yellow-100 text-yellow-800',
      underweight: 'bg-orange-100 text-orange-800',
      senior: 'bg-blue-100 text-blue-800',
      medical_condition: 'bg-red-100 text-red-800'
    };
    return colors[condition] || 'bg-gray-100 text-gray-800';
  };

  const getHealthStatusText = (condition) => {
    const texts = {
      healthy: '健康',
      overweight: '超重',
      underweight: '偏瘦',
      senior: '老年',
      medical_condition: '有疾病'
    };
    return texts[condition] || '未知';
  };

  const age = calculateAge(pet.birthDate);
  const hasNutritionPlan = pet.nutritionPlan !== null;
  const medicalRecordCount = pet.medicalHistory ? pet.medicalHistory.length : 0;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="text-3xl">{getSpeciesEmoji(pet.species)}</div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">{pet.name}</h3>
            <p className="text-gray-600">{pet.breed}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={onViewDetail}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="查看详情"
          >
            📋
          </button>
          <button
            onClick={onViewNutrition}
            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
            title="营养计划"
          >
            🥗
          </button>
          <button
            onClick={onDelete}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="删除档案"
          >
            🗑️
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-gray-600">年龄:</span>
          <span className="font-medium">{age}岁</span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-gray-600">体重:</span>
          <span className="font-medium">{pet.weight}kg</span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-gray-600">性别:</span>
          <span className="font-medium">{pet.gender === 'male' ? '雄性' : '雌性'}</span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-gray-600">健康状况:</span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getHealthStatusColor(pet.healthCondition)}`}>
            {getHealthStatusText(pet.healthCondition)}
          </span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center space-x-4">
            <span className="flex items-center">
              🏥 <span className="ml-1">{medicalRecordCount}</span>
            </span>
            <span className="flex items-center">
              🥗 <span className="ml-1">{hasNutritionPlan ? '✅' : '❌'}</span>
            </span>
          </div>
          <span>
            {format(new Date(pet.updatedAt), 'MM-dd', { locale: zhCN })}
          </span>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <button
          onClick={onViewDetail}
          className="w-full bg-blue-50 text-blue-600 py-2 rounded-lg hover:bg-blue-100 transition-colors font-medium"
        >
          查看健康档案
        </button>
        <button
          onClick={onViewNutrition}
          className="w-full bg-green-50 text-green-600 py-2 rounded-lg hover:bg-green-100 transition-colors font-medium"
        >
          {hasNutritionPlan ? '查看营养计划' : '生成营养计划'}
        </button>
      </div>
    </div>
  );
};

export default PetProfileCard;