import React, { useState, useEffect } from 'react';
import { usePetProfile } from '../../contexts/PetProfileContext';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

const NutritionCalculator = ({ pet, onBack }) => {
  const { generateNutritionPlan, updatePetProfile } = usePetProfile();
  const [nutritionPlan, setNutritionPlan] = useState(pet.nutritionPlan);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showCustomPlan, setShowCustomPlan] = useState(false);

  const handleGeneratePlan = async () => {
    setIsGenerating(true);
    try {
      const newPlan = await generateNutritionPlan(pet.id);
      setNutritionPlan(newPlan);
    } catch (error) {
      console.error('生成营养计划失败:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const getActivityLevelText = (level) => {
    const levels = {
      low: '低活动量',
      moderate: '中等活动量',
      high: '高活动量',
      very_high: '极高活动量'
    };
    return levels[level] || '中等活动量';
  };

  const renderNutritionRatio = (ratio) => {
    const total = Object.values(ratio).reduce((sum, value) => sum + value, 0);
    
    return (
      <div className="space-y-3">
        <h4 className="font-medium text-gray-900">营养配比建议</h4>
        <div className="space-y-2">
          {Object.entries(ratio).map(([key, value]) => {
            const percentage = Math.round((value / total) * 100);
            const labels = {
              protein: '蛋白质',
              fat: '脂肪',
              carbs: '碳水化合物',
              fiber: '纤维',
              water: '水分'
            };
            const colors = {
              protein: 'bg-red-400',
              fat: 'bg-yellow-400',
              carbs: 'bg-blue-400',
              fiber: 'bg-green-400',
              water: 'bg-cyan-400'
            };
            
            return (
              <div key={key} className="flex items-center space-x-3">
                <div className="w-20 text-sm text-gray-600">{labels[key]}</div>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${colors[key]}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <div className="w-12 text-sm font-medium text-gray-900">
                  {percentage}%
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderRecommendations = (recommendations) => {
    return (
      <div className="space-y-4">
        <h4 className="font-medium text-gray-900">个性化建议</h4>
        <div className="space-y-3">
          {recommendations.map((rec, index) => {
            const icons = {
              age: '🎂',
              weight: '⚖️',
              species: '🐾',
              health: '🏥'
            };
            
            return (
              <div key={index} className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-start space-x-3">
                  <div className="text-2xl">{icons[rec.type] || '💡'}</div>
                  <div>
                    <h5 className="font-medium text-blue-900">{rec.title}</h5>
                    <p className="text-sm text-blue-700 mt-1">{rec.content}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            ← 返回
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              🥗 {pet.name} 的营养计划
            </h2>
            <p className="text-gray-600">{pet.breed} • {pet.weight}kg</p>
          </div>
        </div>
        <button
          onClick={handleGeneratePlan}
          disabled={isGenerating}
          className="px-4 py-2 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:shadow-lg transition-all transform hover:scale-105 disabled:opacity-50"
        >
          {isGenerating ? '生成中...' : '重新计算'}
        </button>
      </div>

      {/* 宠物基本信息 */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">基本信息</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl mb-2">{pet.species === 'dog' ? '🐕' : '🐱'}</div>
            <div className="text-sm text-gray-600">物种</div>
            <div className="font-medium">{pet.species === 'dog' ? '狗狗' : '猫咪'}</div>
          </div>
          <div className="text-center">
            <div className="text-2xl mb-2">⚖️</div>
            <div className="text-sm text-gray-600">体重</div>
            <div className="font-medium">{pet.weight}kg</div>
          </div>
          <div className="text-center">
            <div className="text-2xl mb-2">🎂</div>
            <div className="text-sm text-gray-600">年龄</div>
            <div className="font-medium">{pet.age}岁</div>
          </div>
          <div className="text-center">
            <div className="text-2xl mb-2">🏃</div>
            <div className="text-sm text-gray-600">活动量</div>
            <div className="font-medium text-xs">{getActivityLevelText(pet.activityLevel)}</div>
          </div>
        </div>
      </div>

      {/* 营养计划 */}
      {nutritionPlan ? (
        <div className="space-y-6">
          {/* 每日营养需求 */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">每日营养需求</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="text-center mb-4">
                  <div className="text-3xl font-bold text-blue-600">
                    {nutritionPlan.dailyCalories}
                  </div>
                  <div className="text-sm text-gray-600">每日卡路里</div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-lg font-semibold text-blue-600">
                      {nutritionPlan.dailyFood.dryFood}g
                    </div>
                    <div className="text-xs text-gray-600">干粮</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-lg font-semibold text-green-600">
                      {nutritionPlan.dailyFood.wetFood}g
                    </div>
                    <div className="text-xs text-gray-600">湿粮</div>
                  </div>
                  <div className="text-center p-3 bg-yellow-50 rounded-lg">
                    <div className="text-lg font-semibold text-yellow-600">
                      {nutritionPlan.dailyFood.treats}g
                    </div>
                    <div className="text-xs text-gray-600">零食</div>
                  </div>
                  <div className="text-center p-3 bg-cyan-50 rounded-lg">
                    <div className="text-lg font-semibold text-cyan-600">
                      {nutritionPlan.dailyFood.water}ml
                    </div>
                    <div className="text-xs text-gray-600">水</div>
                  </div>
                </div>
              </div>
              
              <div>
                {renderNutritionRatio(nutritionPlan.nutritionRatio)}
              </div>
            </div>
          </div>

          {/* 个性化建议 */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            {renderRecommendations(nutritionPlan.recommendations)}
          </div>

          {/* 计划信息 */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">计划生成时间</h4>
                <p className="text-sm text-gray-600">
                  {format(new Date(nutritionPlan.generatedAt), 'yyyy-MM-dd HH:mm', { locale: zhCN })}
                </p>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500">营养计划ID</div>
                <div className="text-sm font-mono text-gray-600">
                  {nutritionPlan.id.split('_')[1]}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <div className="text-6xl mb-4">🥗</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">还没有营养计划</h3>
          <p className="text-gray-600 mb-6">
            根据 {pet.name} 的基本信息生成个性化营养计划
          </p>
          <button
            onClick={handleGeneratePlan}
            disabled={isGenerating}
            className="px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:shadow-lg transition-all transform hover:scale-105 disabled:opacity-50"
          >
            {isGenerating ? '正在生成...' : '生成营养计划'}
          </button>
        </div>
      )}
    </div>
  );
};

export default NutritionCalculator;