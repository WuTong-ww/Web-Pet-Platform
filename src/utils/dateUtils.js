// src/utils/dateUtils.js

/**
 * 格式化日期为本地字符串格式
 * @param {Date|string} date - 日期对象或日期字符串
 * @param {string} format - 格式化选项 ('date', 'time', 'datetime', 'relative')
 * @returns {string} - 格式化后的日期字符串
 */
export const formatDate = (date, format = 'date') => {
    if (!date) return '';
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // 检查日期是否有效
    if (isNaN(dateObj.getTime())) {
      console.error('Invalid date:', date);
      return '';
    }
    
    switch (format) {
      case 'date':
        return dateObj.toLocaleDateString('zh-CN', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      
      case 'time':
        return dateObj.toLocaleTimeString('zh-CN', {
          hour: '2-digit',
          minute: '2-digit'
        });
      
      case 'datetime':
        return dateObj.toLocaleString('zh-CN', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      
      case 'relative':
        return getRelativeTimeString(dateObj);
      
      default:
        return dateObj.toLocaleDateString('zh-CN');
    }
  };
  
  /**
   * 获取相对时间描述
   * @param {Date} date - 日期对象
   * @returns {string} - 相对时间描述
   */
  export const getRelativeTimeString = (date) => {
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.round(diffMs / 1000);
    const diffMin = Math.round(diffSec / 60);
    const diffHour = Math.round(diffMin / 60);
    const diffDay = Math.round(diffHour / 24);
    
    // 未来时间
    if (diffMs < 0) {
      const absDiffDay = Math.abs(Math.round(diffMs / (1000 * 60 * 60 * 24)));
      if (absDiffDay < 1) return '今天';
      if (absDiffDay < 2) return '明天';
      if (absDiffDay < 7) return `${absDiffDay}天后`;
      if (absDiffDay < 30) return `${Math.round(absDiffDay / 7)}周后`;
      return `${Math.round(absDiffDay / 30)}个月后`;
    }
    
    // 过去时间
    if (diffSec < 60) return '刚刚';
    if (diffMin < 60) return `${diffMin}分钟前`;
    if (diffHour < 24) return `${diffHour}小时前`;
    if (diffDay < 7) return `${diffDay}天前`;
    if (diffDay < 30) return `${Math.round(diffDay / 7)}周前`;
    if (diffDay < 365) return `${Math.round(diffDay / 30)}个月前`;
    return `${Math.round(diffDay / 365)}年前`;
  };
  
  /**
   * 获取两个日期之间的时间差描述
   * @param {Date|string} startDate - 开始日期
   * @param {Date|string} endDate - 结束日期
   * @returns {string} - 时间差描述
   */
  export const getDateDifference = (startDate, endDate) => {
    const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
    const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
    
    const diffMs = end - start;
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays < 1) {
      const diffHours = Math.round(diffMs / (1000 * 60 * 60));
      return diffHours < 1 
        ? `${Math.round(diffMs / (1000 * 60))}分钟` 
        : `${diffHours}小时`;
    }
    
    if (diffDays < 7) return `${diffDays}天`;
    if (diffDays < 30) return `${Math.round(diffDays / 7)}周`;
    if (diffDays < 365) return `${Math.round(diffDays / 30)}个月`;
    return `${Math.round(diffDays / 365)}年`;
  };
  
  /**
   * 获取日期的友好显示格式
   * @param {Date|string} date - 日期对象或日期字符串
   * @returns {string} - 友好格式的日期
   */
  export const getFriendlyDate = (date) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    
    // 同一天
    if (dateObj.toDateString() === now.toDateString()) {
      return `今天 ${dateObj.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    // 昨天
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (dateObj.toDateString() === yesterday.toDateString()) {
      return `昨天 ${dateObj.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    // 本周内
    const dayDiff = Math.round((now - dateObj) / (1000 * 60 * 60 * 24));
    if (dayDiff < 7) {
      const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
      return `${weekdays[dateObj.getDay()]} ${dateObj.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    // 其他日期
    const thisYear = now.getFullYear();
    if (dateObj.getFullYear() === thisYear) {
      return dateObj.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' });
    }
    
    return dateObj.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
  };
  
  /**
   * 检查日期是否在指定时间范围内
   * @param {Date|string} date - 需要检查的日期
   * @param {string} range - 时间范围 ('today', 'yesterday', 'thisWeek', 'lastWeek', 'thisMonth', 'lastMonth')
   * @returns {boolean} - 是否在指定范围内
   */
  export const isDateInRange = (date, range) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    
    const startOfDay = (d) => {
      const date = new Date(d);
      date.setHours(0, 0, 0, 0);
      return date;
    };
    
    const endOfDay = (d) => {
      const date = new Date(d);
      date.setHours(23, 59, 59, 999);
      return date;
    };
    
    const startOfWeek = (d) => {
      const date = new Date(d);
      const day = date.getDay();
      date.setDate(date.getDate() - day + (day === 0 ? -6 : 1)); // 调整到本周一
      return startOfDay(date);
    };
    
    const startOfMonth = (d) => {
      const date = new Date(d);
      date.setDate(1);
      return startOfDay(date);
    };
    
    switch (range) {
      case 'today':
        return dateObj >= startOfDay(now) && dateObj <= endOfDay(now);
      
      case 'yesterday': {
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);
        return dateObj >= startOfDay(yesterday) && dateObj <= endOfDay(yesterday);
      }
      
      case 'thisWeek':
        return dateObj >= startOfWeek(now);
      
      case 'lastWeek': {
        const lastWeekStart = new Date(startOfWeek(now));
        lastWeekStart.setDate(lastWeekStart.getDate() - 7);
        const lastWeekEnd = new Date(startOfWeek(now));
        lastWeekEnd.setDate(lastWeekEnd.getDate() - 1);
        lastWeekEnd.setHours(23, 59, 59, 999);
        
        return dateObj >= lastWeekStart && dateObj <= lastWeekEnd;
      }
      
      case 'thisMonth':
        return dateObj >= startOfMonth(now);
      
      case 'lastMonth': {
        const lastMonthStart = new Date(startOfMonth(now));
        lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
        
        const lastMonthEnd = new Date(startOfMonth(now));
        lastMonthEnd.setDate(lastMonthEnd.getDate() - 1);
        lastMonthEnd.setHours(23, 59, 59, 999);
        
        return dateObj >= lastMonthStart && dateObj <= lastMonthEnd;
      }
      
      default:
        return false;
    }
  };
  
  /**
   * 格式化活动日期范围
   * @param {string} startDate - 开始日期字符串
   * @param {string} endDate - 结束日期字符串
   * @returns {string} - 格式化后的日期范围
   */
  export const formatDateRange = (startDate, endDate) => {
    if (!startDate || !endDate) return '';
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // 同一天
    if (start.toDateString() === end.toDateString()) {
      return `${formatDate(start, 'date')} ${start.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    // 不同天
    return `${formatDate(start, 'date')} - ${formatDate(end, 'date')}`;
  };