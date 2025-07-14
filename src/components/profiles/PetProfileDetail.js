import React, { useState } from 'react';
import { usePetProfile } from '../../contexts/PetProfileContext';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import MedicalRecordForm from './MedicalRecordForm';

const PetProfileDetail = ({ pet, onBack }) => {
  const { addMedicalRecord, updatePetProfile,deletePetProfile  } = usePetProfile();
  const [showMedicalForm, setShowMedicalForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

    // 处理添加医疗记录
    const handleAddMedicalRecord = async (recordData) => {
        try {
          console.log('添加医疗记录:', recordData); // 添加调试日志
          await addMedicalRecord(pet.id, recordData);
          setShowMedicalForm(false);
          // 可以添加成功提示
          alert('医疗记录保存成功！');
        } catch (error) {
          console.error('保存医疗记录失败:', error);
          alert('保存失败，请重试');
        }
      };
      // 处理删除医疗记录
  const handleDeleteMedicalRecord = async (recordId) => {
    if (window.confirm('确定要删除这条医疗记录吗？')) {
      try {
        setIsLoading(true);
        const updatedMedicalHistory = pet.medicalHistory.filter(record => record.id !== recordId);
        await updatePetProfile(pet.id, { medicalHistory: updatedMedicalHistory });
        alert('医疗记录删除成功！');
      } catch (error) {
        console.error('删除医疗记录失败:', error);
        alert('删除失败，请重试');
      } finally {
        setIsLoading(false);
      }
    }
  };

  // 处理删除宠物档案
  const handleDeletePetProfile = async () => {
    if (window.confirm(`确定要删除 ${pet.name} 的档案吗？此操作不可恢复。`)) {
      try {
        setIsLoading(true);
        await deletePetProfile(pet.id);
        alert('宠物档案删除成功！');
        onBack(); // 返回列表页面
      } catch (error) {
        console.error('删除宠物档案失败:', error);
        alert('删除失败，请重试');
      } finally {
        setIsLoading(false);
      }
    }
  };


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

  const getMedicalRecordIcon = (type) => {
    const icons = {
      vaccination: '💉',
      checkup: '🏥',
      surgery: '🔪',
      medication: '💊',
      deworming: '🪱',
      other: '📋'
    };
    return icons[type] || '📋';
  };

  const getMedicalRecordColor = (type) => {
    const colors = {
      vaccination: 'bg-green-100 text-green-800',
      checkup: 'bg-blue-100 text-blue-800',
      surgery: 'bg-red-100 text-red-800',
      medication: 'bg-purple-100 text-purple-800',
      deworming: 'bg-yellow-100 text-yellow-800',
      other: 'bg-gray-100 text-gray-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const getMedicalRecordTypeText = (type) => {
    const types = {
      vaccination: '疫苗接种',
      checkup: '健康检查',
      surgery: '手术',
      medication: '药物治疗',
      deworming: '驱虫',
      other: '其他'
    };
    return types[type] || '其他';
  };

  const age = calculateAge(pet.birthDate);
  const medicalHistory = pet.medicalHistory || [];
  const sortedMedicalHistory = medicalHistory.sort((a, b) => new Date(b.date) - new Date(a.date));

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
              {pet.species === 'dog' ? '🐕' : '🐱'} {pet.name} 的健康档案
            </h2>
            <p className="text-gray-600">{pet.breed} • {age}岁</p>
          </div>
        </div>
        <button
          onClick={() => setShowMedicalForm(true)}
          className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:shadow-lg transition-all transform hover:scale-105"
        >
          ➕ 添加医疗记录
        </button>
        <button
            onClick={handleDeletePetProfile}
            disabled={isLoading}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            🗑️ 删除档案
          </button>
      </div>

      {/* 基本信息 */}
      <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center text-3xl">
            {pet.species === 'dog' ? '🐕' : pet.species === 'cat' ? '🐱' : '🐾'}
          </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 基本信息</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">名称:</span>
              <span className="font-medium">{pet.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">物种:</span>
              <span className="font-medium">{pet.species === 'dog' ? '狗狗' : '猫咪'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">品种:</span>
              <span className="font-medium">{pet.breed}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">性别:</span>
              <span className="font-medium">{pet.gender === 'male' ? '雄性' : '雌性'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">出生日期:</span>
              <span className="font-medium">
                {format(new Date(pet.birthDate), 'yyyy-MM-dd', { locale: zhCN })}
              </span>
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
              <span className="text-gray-600">活动水平:</span>
              <span className="font-medium">
                {pet.activityLevel === 'low' && '低'}
                {pet.activityLevel === 'moderate' && '中等'}
                {pet.activityLevel === 'high' && '高'}
                {pet.activityLevel === 'very_high' && '极高'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">健康状况:</span>
              <span className="font-medium">
                {pet.healthCondition === 'healthy' && '健康'}
                {pet.healthCondition === 'overweight' && '超重'}
                {pet.healthCondition === 'underweight' && '偏瘦'}
                {pet.healthCondition === 'senior' && '老年'}
                {pet.healthCondition === 'medical_condition' && '有疾病'}
              </span>
            </div>
            {pet.microchipId && (
              <div className="flex items-center justify-between">
                <span className="text-gray-600">芯片编号:</span>
                <span className="font-medium font-mono">{pet.microchipId}</span>
              </div>
            )}
          </div>
        </div>
        
        {pet.allergies && (
          <div className="mt-4 p-3 bg-red-50 rounded-lg">
            <h4 className="font-medium text-red-900 mb-1">过敏信息</h4>
            <p className="text-sm text-red-700">{pet.allergies}</p>
          </div>
        )}
        
        {pet.notes && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-1">备注</h4>
            <p className="text-sm text-gray-700">{pet.notes}</p>
          </div>
        )}
      </div>

      {/* 医疗记录 */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">📋 医疗记录</h3>
          <div className="text-sm text-gray-600">
            共 {medicalHistory.length} 条记录
          </div>
        </div>
        
        {sortedMedicalHistory.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">🏥</div>
            <p className="text-gray-600">暂无医疗记录</p>
            <button
              onClick={() => setShowMedicalForm(true)}
              className="mt-2 text-blue-600 hover:text-blue-800"
            >
              添加第一条记录
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedMedicalHistory.map((record) => (
              <div key={record.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">
                      {getMedicalRecordIcon(record.type)}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium text-gray-900">{record.title}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs ${getMedicalRecordColor(record.type)}`}>
                          {getMedicalRecordTypeText(record.type)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{record.description}</p>
                      {record.medication && (
                        <p className="text-sm text-blue-600 mt-1">
                          💊 {record.medication}
                        </p>
                      )}
                      {record.veterinarian && (
                        <p className="text-sm text-green-600 mt-1">
                          👨‍⚕️ {record.veterinarian}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {format(new Date(record.date), 'yyyy-MM-dd', { locale: zhCN })}
                    </div>
                    {record.nextDueDate && (
                      <div className="text-xs text-orange-600">
                        下次: {format(new Date(record.nextDueDate), 'MM-dd', { locale: zhCN })}
                      </div>
                    )}
                  </div>
                </div>
                <button
                    onClick={() => handleDeleteMedicalRecord(record.id)}
                    disabled={isLoading}
                    className="text-red-600 hover:text-red-800 disabled:opacity-50"
                  >
                    🗑️
                  </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 医疗记录表单模态框 */}
      {showMedicalForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <MedicalRecordForm
              petId={pet.id}
              onSubmit={handleAddMedicalRecord}
              onCancel={() => setShowMedicalForm(false)}
              isLoading={isLoading}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PetProfileDetail;