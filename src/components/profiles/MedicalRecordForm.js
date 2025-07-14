import React, { useState } from 'react';
import clsx from 'clsx';

const MedicalRecordForm = ({ petId, onSubmit, onCancel, isLoading }) => {
  const [formData, setFormData] = useState({
    type: 'vaccination',
    title: '',
    date: '',
    description: '',
    veterinarian: '',
    clinic: '',
    medication: '',
    dosage: '',
    notes: '',
    nextDueDate: '',
    cost: '',
    attachments: []
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
    
    if (!formData.title.trim()) {
      newErrors.title = '标题不能为空';
    }
    
    if (!formData.date) {
      newErrors.date = '日期不能为空';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = '描述不能为空';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit({
        ...formData,
        cost: formData.cost ? parseFloat(formData.cost) : null
      });
    }
  };

  const medicalTypes = [
    { value: 'vaccination', label: '疫苗接种', icon: '💉' },
    { value: 'checkup', label: '健康检查', icon: '🏥' },
    { value: 'surgery', label: '手术', icon: '🔪' },
    { value: 'medication', label: '药物治疗', icon: '💊' },
    { value: 'deworming', label: '驱虫', icon: '🪱' },
    { value: 'dental', label: '牙科治疗', icon: '🦷' },
    { value: 'emergency', label: '紧急治疗', icon: '🚨' },
    { value: 'other', label: '其他', icon: '📋' }
  ];

  const getTypeIcon = (type) => {
    const typeObj = medicalTypes.find(t => t.value === type);
    return typeObj ? typeObj.icon : '📋';
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {getTypeIcon(formData.type)} 添加医疗记录
        </h2>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600 text-2xl"
        >
          ×
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 记录类型 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            记录类型 *
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {medicalTypes.map(type => (
              <button
                key={type.value}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, type: type.value }))}
                className={clsx(
                  "p-3 rounded-lg border-2 transition-all text-left",
                  formData.type === type.value
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                )}
              >
                <div className="text-lg mb-1">{type.icon}</div>
                <div className="text-sm font-medium">{type.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 标题和日期 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              标题 *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className={clsx(
                "w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                errors.title ? 'border-red-500' : 'border-gray-300'
              )}
              placeholder="例如：狂犬病疫苗接种"
            />
            {errors.title && (
              <p className="text-red-500 text-sm mt-1">{errors.title}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              日期 *
            </label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className={clsx(
                "w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                errors.date ? 'border-red-500' : 'border-gray-300'
              )}
            />
            {errors.date && (
              <p className="text-red-500 text-sm mt-1">{errors.date}</p>
            )}
          </div>
        </div>

        {/* 描述 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            详细描述 *
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="4"
            className={clsx(
              "w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent",
              errors.description ? 'border-red-500' : 'border-gray-300'
            )}
            placeholder="请详细描述医疗过程、诊断结果、注意事项等..."
          />
          {errors.description && (
            <p className="text-red-500 text-sm mt-1">{errors.description}</p>
          )}
        </div>

        {/* 医生和诊所 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              兽医师
            </label>
            <input
              type="text"
              name="veterinarian"
              value={formData.veterinarian}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="主治兽医师姓名"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              诊所/医院
            </label>
            <input
              type="text"
              name="clinic"
              value={formData.clinic}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="诊所或医院名称"
            />
          </div>
        </div>

        {/* 药物信息 */}
        {(formData.type === 'medication' || formData.type === 'vaccination') && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                药物/疫苗名称
              </label>
              <input
                type="text"
                name="medication"
                value={formData.medication}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="药物或疫苗名称"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                剂量
              </label>
              <input
                type="text"
                name="dosage"
                value={formData.dosage}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="例如：1ml, 每日2次"
              />
            </div>
          </div>
        )}

        {/* 下次预约日期和费用 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              下次预约日期
            </label>
            <input
              type="date"
              name="nextDueDate"
              value={formData.nextDueDate}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              费用 (港币)
            </label>
            <input
              type="number"
              name="cost"
              value={formData.cost}
              onChange={handleChange}
              step="0.01"
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0.00"
            />
          </div>
        </div>

        {/* 备注 */}
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
            {isLoading ? '保存中...' : '保存记录'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MedicalRecordForm;