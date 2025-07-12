/**
 * 文本处理工具类
 * 用于处理宠物描述信息的清理、编码和格式化
 */

/**
 * 安全地清理文本内容
 */
export const cleanText = (text) => {
  if (!text || typeof text !== 'string') return '';
  
  return text
    .replace(/<[^>]*>/g, '') // 移除HTML标签
    .replace(/&nbsp;/g, ' ') // 替换HTML空格
    .replace(/&amp;/g, '&') // 替换HTML实体
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ') // 合并多个空格
    .trim();
};

/**
 * 安全的文本截断
 */
export const safeTextTruncate = (text, maxLength = 100, suffix = '...') => {
  if (!text || typeof text !== 'string') return '';
  
  const cleaned = cleanText(text);
  if (cleaned.length <= maxLength) return cleaned;
  
  // 在单词边界截断
  const truncated = cleaned.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  
  if (lastSpace > maxLength * 0.8) {
    return truncated.substring(0, lastSpace) + suffix;
  }
  
  return truncated + suffix;
};

/**
 * 验证文本完整性
 */
export const validateTextIntegrity = (text) => {
  if (!text || typeof text !== 'string') {
    return { isValid: false, reason: 'Empty or invalid text', text: '' };
  }
  
  const cleaned = cleanText(text);
  
  if (cleaned.length < 10) {
    return { isValid: false, reason: 'Text too short', text: cleaned };
  }
  
  if (cleaned.length > 5000) {
    return { isValid: false, reason: 'Text too long', text: cleaned.substring(0, 5000) + '...' };
  }
  
  return { isValid: true, text: cleaned };
};

/**
 * 格式化宠物描述 - 改进版本
 */
export const formatDescription = (description, options = {}) => {
  const { petName = 'This pet', fallback = 'Looking for a loving home!' } = options;
  
  if (!description || typeof description !== 'string') {
    return fallback;
  }
  
  let cleaned = cleanText(description);
  
  if (!cleaned || cleaned.length < 5) {
    return fallback;
  }
  
  // 智能分段处理
  const formatted = formatPetDescription(cleaned, petName);
  
  return formatted || fallback;
};

/**
 * 智能格式化宠物描述
 */
const formatPetDescription = (text, petName) => {
  if (!text) return '';
  
  // 检测常见的宠物描述模式并格式化
  let formatted = text;
  
  // 处理基本信息行（如：Male / ~3 Years / 48 lbs）
  formatted = formatted.replace(
    /(Male|Female)\s*\/\s*([^\/]+)\s*\/\s*([^\/\n]+)/g,
    '**基本信息：** $1 | $2 | $3\n\n'
  );
  
  // 处理收容所信息
  formatted = formatted.replace(
    /Want to meet me\?\s*Come down to our ([^.]+)\./g,
    '**领养地点：** $1\n\n'
  );
  
  // 处理 "Looking for" 开头的句子
  formatted = formatted.replace(
    /Looking for ([^?]+\?)/g,
    '**寻找：** $1\n\n'
  );
  
  // 添加段落分隔
  formatted = formatted.replace(/([.!?])\s+([A-Z])/g, '$1\n\n$2');
  
  // 清理多余的换行
  formatted = formatted.replace(/\n{3,}/g, '\n\n');
  
  return formatted.trim();
};

/**
 * 创建安全的SVG Data URI
 */
export const createSafeSVGDataURI = (svgContent) => {
  try {
    // 编码SVG内容
    const encoded = encodeURIComponent(svgContent)
      .replace(/'/g, '%27')
      .replace(/"/g, '%22');
    
    return `data:image/svg+xml;charset=utf-8,${encoded}`;
  } catch (error) {
    console.error('创建SVG Data URI失败:', error);
    // 返回一个简单的灰色占位符
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iI2Y4ZjlmYSIvPgogIDx0ZXh0IHg9IjIwMCIgeT0iMjAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM2Yzc1N2QiPk5vIEltYWdlPC90ZXh0Pgo8L3N2Zz4K';
  }
};

/**
 * 格式化地址信息
 */
export const formatAddress = (address) => {
  if (!address) return '';
  
  if (typeof address === 'string') {
    return cleanText(address);
  }
  
  if (typeof address === 'object') {
    const parts = [];
    if (address.address1) parts.push(address.address1);
    if (address.address2) parts.push(address.address2);
    if (address.city) parts.push(address.city);
    if (address.state) parts.push(address.state);
    if (address.postcode) parts.push(address.postcode);
    if (address.country) parts.push(address.country);
    
    return parts.join(', ');
  }
  
  return '';
};

/**
 * 处理宠物详情页面的描述显示
 */
export const formatDetailDescription = (description, source = 'unknown') => {
  if (!description) return [];
  
  const cleaned = cleanText(description);
  if (!cleaned) return [];
  
  // 根据来源使用不同的格式化策略
  switch (source) {
    case 'petfinder':
      return formatPetfinderDescription(cleaned);
    case 'spca':
      return formatSpcaDescription(cleaned);
    default:
      return formatGenericDescription(cleaned);
  }
};

/**
 * 格式化 Petfinder 描述
 */
const formatPetfinderDescription = (text) => {
  const sections = [];
  
  // 分割文本
  const sentences = text.split(/[.!?]+/).filter(s => s.trim());
  
  let currentSection = '';
  
  sentences.forEach(sentence => {
    const trimmed = sentence.trim();
    if (!trimmed) return;
    
    // 检查是否是新段落的开始
    if (trimmed.match(/^(Male|Female|Looking for|Want to meet|Come down to)/)) {
      if (currentSection) {
        sections.push(currentSection.trim());
      }
      currentSection = trimmed + '.';
    } else {
      currentSection += ' ' + trimmed + '.';
    }
  });
  
  if (currentSection) {
    sections.push(currentSection.trim());
  }
  
  return sections.filter(section => section.length > 10);
};

/**
 * 格式化 SPCA 描述
 */
const formatSpcaDescription = (text) => {
  return text.split('\n').filter(line => line.trim()).map(line => line.trim());
};

/**
 * 格式化通用描述
 */
const formatGenericDescription = (text) => {
  // 简单的句子分割
  return text.split(/[.!?]+/).filter(s => s.trim().length > 10).map(s => s.trim() + '.');
};