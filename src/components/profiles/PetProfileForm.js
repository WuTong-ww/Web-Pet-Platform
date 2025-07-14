import React, { useState } from 'react';
import clsx from 'clsx';

const PetProfileForm = ({ onSubmit, onCancel, isLoading, initialData = null }) => {
  const [formData, setFormData] = useState({
    name: '',
    species: 'dog',
    breed: '',
    gender: 'male',
    birthDate: '',
    weight: '',
    microchipId: '',
    activityLevel: 'moderate',
    healthCondition: 'healthy',
    allergies: '',
    currentFood: '',
    veterinarian: '',
    vetContact: '',
    profileImage: '',
    notes: '',
    ...initialData
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // 清除错误
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = '宠物名称不能为空';
    }
    
    if (!formData.breed.trim()) {
      newErrors.breed = '品种不能为空';
    }
    
    if (!formData.birthDate) {
      newErrors.birthDate = '出生日期不能为空';
    }
    
    if (!formData.weight || formData.weight <= 0) {
      newErrors.weight = '请输入有效的体重';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      // 计算年龄
      const age = calculateAge(formData.birthDate);
      onSubmit({
        ...formData,
        age,
        weight: parseFloat(formData.weight)
      });
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

  const breedOptions = {
    dog: [
      '拉布拉多犬', '金毛寻回犬', '德国牧羊犬', '边境牧羊犬', '贵宾犬',
      '比熊犬', '法国斗牛犬', '柯基犬', '哈士奇', '阿拉斯加', '萨摩耶',
      '吉娃娃', '博美犬', '约克夏', '马尔济斯', '西施犬', '混血犬', '其他'
    ],
    cat: [
      '英国短毛猫', '美国短毛猫', '波斯猫', '暹罗猫', '缅因猫', '挪威森林猫',
      '布偶猫', '俄罗斯蓝猫', '苏格兰折耳猫', '孟买猫', '阿比西尼亚猫',
      '土耳其安哥拉猫', '中华田园猫', '混血猫', '其他'
    ]
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {initialData ? '编辑宠物档案' : '创建宠物档案'}
        </h2>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600 text-2xl"
        >
          ×
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 基本信息 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              宠物名称 *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={clsx(
                "w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                errors.name ? 'border-red-500' : 'border-gray-300'
              )}
              placeholder="请输入宠物名称"
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              物种 *
            </label>
            <select
              name="species"
              value={formData.species}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="dog">狗狗</option>
              <option value="cat">猫咪</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              品种 *
            </label>
            <select
              name="breed"
              value={formData.breed}
              onChange={handleChange}
              className={clsx(
                "w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                errors.breed ? 'border-red-500' : 'border-gray-300'
              )}
            >
              <option value="">请选择品种</option>
              {breedOptions[formData.species].map(breed => (
                <option key={breed} value={breed}>{breed}</option>
              ))}
            </select>
            {errors.breed && (
              <p className="text-red-500 text-sm mt-1">{errors.breed}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              性别
            </label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="male">雄性</option>
              <option value="female">雌性</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              出生日期 *
            </label>
            <input
              type="date"
              name="birthDate"
              value={formData.birthDate}
              onChange={handleChange}
              className={clsx(
                "w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                errors.birthDate ? 'border-red-500' : 'border-gray-300'
              )}
            />
            {errors.birthDate && (
              <p className="text-red-500 text-sm mt-1">{errors.birthDate}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              体重 (kg) *
            </label>
            <input
              type="number"
              name="weight"
              value={formData.weight}
              onChange={handleChange}
              step="0.1"
              min="0"
              className={clsx(
                "w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                errors.weight ? 'border-red-500' : 'border-gray-300'
              )}
              placeholder="请输入体重"
            />
            {errors.weight && (
              <p className="text-red-500 text-sm mt-1">{errors.weight}</p>
            )}
          </div>
        </div>

        {/* 健康信息 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              活动水平
            </label>
            <select
              name="activityLevel"
              value={formData.activityLevel}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="low">低 (每天散步 少于 30分钟)</option>
              <option value="moderate">中等 (每天散步 30-60分钟)</option>
              <option value="high">高 (每天散步 大于 60分钟)</option>
              <option value="very_high">极高 (专业训练/运动)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              健康状况
            </label>
            <select
              name="healthCondition"
              value={formData.healthCondition}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="healthy">健康</option>
              <option value="overweight">超重</option>
              <option value="underweight">偏瘦</option>
              <option value="senior">老年</option>
              <option value="medical_condition">有疾病</option>
            </select>
          </div>
        </div>

        {/* 其他信息 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              芯片编号
            </label>
            <input
              type="text"
              name="microchipId"
              value={formData.microchipId}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="请输入芯片编号"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              当前食物
            </label>
            <input
              type="text"
              name="currentFood"
              value={formData.currentFood}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="请输入当前食物品牌"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            过敏信息
          </label>
          <textarea
            name="allergies"
            value={formData.allergies}
            onChange={handleChange}
            rows="2"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="请输入过敏信息（如有）"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            备注
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows="3"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="其他需要记录的信息..."
          />
        </div>

        {/* 提交按钮 */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className={clsx(
              "px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium transition-all",
              isLoading 
                ? "opacity-50 cursor-not-allowed"
                : "hover:shadow-lg transform hover:scale-105"
            )}
          >
            {isLoading ? '保存中...' : '保存档案'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PetProfileForm;