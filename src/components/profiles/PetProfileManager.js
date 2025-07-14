import React, { useState } from 'react';
import { usePetProfile } from '../../contexts/PetProfileContext';
import PetProfileForm from './PetProfileForm';
import PetProfileCard from './PetProfileCard';
import PetProfileDetail from './PetProfileDetail';
import NutritionCalculator from './NutritionCalculator';
import clsx from 'clsx';

const PetProfileManager = () => {
  const { petProfiles, isLoading, createPetProfile, deletePetProfile } = usePetProfile();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedPet, setSelectedPet] = useState(null);
  const [currentView, setCurrentView] = useState('list'); // 'list', 'detail', 'nutrition'

  const handleCreateProfile = async (profileData) => {
    try {
      await createPetProfile(profileData);
      setShowCreateForm(false);
    } catch (error) {
      console.error('创建档案失败:', error);
    }
  };

  const handleDeleteProfile = async (petId) => {
    if (window.confirm('确定要删除这个宠物档案吗？此操作不可恢复。')) {
      try {
        await deletePetProfile(petId);
      } catch (error) {
        console.error('删除档案失败:', error);
      }
    }
  };

  const handleViewDetail = (pet) => {
    setSelectedPet(pet);
    setCurrentView('detail');
  };

  const handleViewNutrition = (pet) => {
    setSelectedPet(pet);
    setCurrentView('nutrition');
  };

  const renderContent = () => {
    switch (currentView) {
      case 'detail':
        return (
          <PetProfileDetail 
            pet={selectedPet}
            onBack={() => setCurrentView('list')}
          />
        );
      case 'nutrition':
        return (
          <NutritionCalculator 
            pet={selectedPet}
            onBack={() => setCurrentView('list')}
          />
        );
      default:
        return (
          <div className="space-y-6">
            {/* 档案列表头部 */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">🐾 我的宠物档案</h2>
                <p className="text-gray-600">管理您的宠物健康档案和营养计划</p>
              </div>
              <button
                onClick={() => setShowCreateForm(true)}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:shadow-lg transition-all transform hover:scale-105"
              >
                ➕ 创建档案
              </button>
            </div>

            {/* 档案统计 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl mb-2">📊</div>
                <h4 className="font-medium text-blue-900">总档案数</h4>
                <p className="text-2xl font-bold text-blue-600">{petProfiles.length}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-2xl mb-2">🏥</div>
                <h4 className="font-medium text-green-900">健康档案</h4>
                <p className="text-2xl font-bold text-green-600">
                  {petProfiles.filter(p => p.medicalHistory && p.medicalHistory.length > 0).length}
                </p>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="text-2xl mb-2">🥗</div>
                <h4 className="font-medium text-orange-900">营养计划</h4>
                <p className="text-2xl font-bold text-orange-600">
                  {petProfiles.filter(p => p.nutritionPlan).length}
                </p>
              </div>
            </div>

            {/* 档案列表 */}
            {petProfiles.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🐾</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">还没有宠物档案</h3>
                <p className="text-gray-600 mb-4">创建您的第一个宠物档案，开始记录它们的健康信息</p>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:shadow-lg transition-all transform hover:scale-105"
                >
                  创建第一个档案
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {petProfiles.map((pet) => (
                  <PetProfileCard
                    key={pet.id}
                    pet={pet}
                    onViewDetail={() => handleViewDetail(pet)}
                    onViewNutrition={() => handleViewNutrition(pet)}
                    onDelete={() => handleDeleteProfile(pet.id)}
                  />
                ))}
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {renderContent()}
      
      {/* 创建档案表单模态框 */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <PetProfileForm
              onSubmit={handleCreateProfile}
              onCancel={() => setShowCreateForm(false)}
              isLoading={isLoading}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PetProfileManager;