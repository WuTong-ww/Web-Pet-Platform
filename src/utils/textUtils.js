/**
 * 文本处理工具类
 * 提供安全的文本处理和编码功能
 */

/**
 * 安全清理文本内容，移除有害字符但保留完整内容
 * @param {string} text - 原始文本
 * @returns {string} - 清理后的文本
 */
export const safeCleanText = (text) => {
  if (!text || typeof text !== 'string') return '';
  
  // 移除有害的HTML标签和脚本，但保留换行符和基本格式
  return text
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // 移除script标签
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '') // 移除style标签
    .replace(/<[^>]*>/g, '') // 移除所有HTML标签
    .replace(/&lt;/g, '<') // 恢复转义的字符
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim(); // 去除首尾空白
};

/**
 * 验证和修复描述内容
 * @param {string} description - 描述内容
 * @returns {string} - 验证后的描述
 */
export const validateDescription = (description) => {
  if (!description || typeof description !== 'string') return '';
  
  // 清理文本
  const cleanText = safeCleanText(description);
  
  // 如果清理后的文本为空，返回默认描述
  if (!cleanText.trim()) {
    return '这只可爱的宠物正在等待一个温暖的家庭。';
  }
  
  return cleanText;
};

/**
 * 格式化描述内容为段落
 * @param {string} description - 描述内容
 * @returns {string[]} - 格式化后的段落数组
 */
export const formatDescriptionToParagraphs = (description) => {
  if (!description || typeof description !== 'string') return [];
  
  const cleanText = validateDescription(description);
  
  return cleanText
    .replace(/\r\n/g, '\n') // 统一换行符
    .replace(/\n{3,}/g, '\n\n') // 合并多个连续空行
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0); // 过滤空行
};

/**
 * 安全的URL编码，替代Base64编码
 * @param {string} text - 需要编码的文本
 * @returns {string} - 编码后的文本
 */
export const safeUrlEncode = (text) => {
  if (!text || typeof text !== 'string') return '';
  
  try {
    return encodeURIComponent(text);
  } catch (error) {
    console.error('URL编码失败:', error);
    return encodeURIComponent('编码失败');
  }
};

/**
 * 创建安全的SVG图片内容
 * @param {string} emoji - 表情符号
 * @param {string} name - 宠物名称
 * @param {string} subtitle - 副标题
 * @returns {string} - 安全的SVG内容
 */
export const createSafeSVGContent = (emoji, name = 'Pet', subtitle = 'Loading...') => {
  // 清理和限制文本内容
  const safeName = safeCleanText(String(name)).substring(0, 15);
  const safeSubtitle = safeCleanText(String(subtitle)).substring(0, 20);
  const safeEmoji = String(emoji).substring(0, 2); // 限制emoji长度
  
  return `
    <svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="400" fill="#f8f9fa" stroke="#dee2e6" stroke-width="2"/>
      <text x="200" y="160" font-family="Arial, sans-serif" font-size="120" text-anchor="middle" fill="#6c757d">${safeEmoji}</text>
      <text x="200" y="250" font-family="Arial, sans-serif" font-size="24" text-anchor="middle" fill="#495057">${safeName}</text>
      <text x="200" y="300" font-family="Arial, sans-serif" font-size="16" text-anchor="middle" fill="#6c757d">${safeSubtitle}</text>
    </svg>
  `;
};

/**
 * 生成安全的SVG Data URL
 * @param {string} emoji - 表情符号
 * @param {string} name - 宠物名称
 * @param {string} subtitle - 副标题
 * @returns {string} - 安全的Data URL
 */
export const generateSafeSVGDataURL = (emoji, name = 'Pet', subtitle = 'Loading...') => {
  const svgContent = createSafeSVGContent(emoji, name, subtitle);
  return `data:image/svg+xml;charset=utf-8,${safeUrlEncode(svgContent)}`;
};

/**
 * 截断文本但保持完整性
 * @param {string} text - 原始文本
 * @param {number} maxLength - 最大长度
 * @param {string} suffix - 后缀
 * @returns {string} - 截断后的文本
 */
export const truncateText = (text, maxLength = 100, suffix = '...') => {
  if (!text || typeof text !== 'string') return '';
  
  const cleanText = safeCleanText(text);
  
  if (cleanText.length <= maxLength) return cleanText;
  
  // 在单词边界处截断
  const truncated = cleanText.substring(0, maxLength);
  const lastSpaceIndex = truncated.lastIndexOf(' ');
  
  if (lastSpaceIndex > maxLength * 0.8) {
    return truncated.substring(0, lastSpaceIndex) + suffix;
  }
  
  return truncated + suffix;
};

/**
 * 处理SPCA特有的aboutMe内容
 * @param {string} aboutMe - SPCA的aboutMe内容
 * @returns {string} - 格式化后的内容
 */
export const formatSPCAAboutMe = (aboutMe) => {
  if (!aboutMe || typeof aboutMe !== 'string') return '';
  
  const cleanText = safeCleanText(aboutMe);
  const lines = cleanText.split('\n').map(line => line.trim()).filter(line => line);
  
  if (lines.length === 0) return '';
  
  // 检查第一行是否是性格标签
  const firstLine = lines[0];
  const personalityPattern = /^[A-Z][a-z]+(?:,\s*[A-Z][a-z]+)*$/;
  
  if (personalityPattern.test(firstLine)) {
    // 如果第一行是性格标签，将其格式化
    let formattedContent = `性格特點: ${firstLine}`;
    
    // 添加剩余的描述段落
    if (lines.length > 1) {
      formattedContent += '\n\n' + lines.slice(1).join('\n');
    }
    
    return formattedContent;
  }
  
  // 如果不是标准格式，直接返回完整内容
  return cleanText;
};

/**
 * 验证文本完整性
 * @param {string} text - 需要验证的文本
 * @returns {boolean} - 是否完整
 */
export const validateTextIntegrity = (text) => {
  if (!text || typeof text !== 'string') return false;
  
  // 检查文本长度
  if (text.length < 5) return false;
  
  // 检查是否包含基本内容
  return /[a-zA-Z\u4e00-\u9fa5]/.test(text);
};

export default {
  safeCleanText,
  validateDescription,
  formatDescriptionToParagraphs,
  safeUrlEncode,
  createSafeSVGContent,
  generateSafeSVGDataURL,
  truncateText,
  formatSPCAAboutMe,
  validateTextIntegrity
};