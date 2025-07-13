import axios from 'axios';
import { cleanText, formatDescription, validateTextIntegrity, createSafeSVGDataURI } from '../utils/textUtils';

// Petfinder API 配置 - 使用后端代理
const PETFINDER_API_CONFIG = {
  baseURL: 'http://localhost:8080/api/petfinder', // 使用后端代理
  tokenUrl: '/token',
  animalsUrl: '/animals',
  organizationsUrl: '/organizations',
  typesUrl: '/types'
};

// 本地服务器配置
const LOCAL_SERVER_CONFIG = {
  baseURL: 'http://localhost:8080',
  chinaDataUrl: '/data/china',
  crawlUrl: '/crawl/china'
};

// 检查 API 配置
const checkAPIConfig = () => {
  if (!PETFINDER_API_CONFIG.baseURL) {
    console.warn('Petfinder API 基础路径未配置，将使用模拟数据');
    return false;
  }
  return true;
};

// 创建 axios 实例
const localAPI = axios.create({
  baseURL: LOCAL_SERVER_CONFIG.baseURL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// 令牌管理
let accessToken = null;
let tokenExpiresAt = null;

/**
 * 检查是否为CORS错误
 */
const isCORSError = (error) => {
  return error.code === 'ERR_NETWORK' || 
         error.message.includes('CORS') ||
         error.message.includes('Access-Control-Allow-Origin') ||
         (error.response === undefined && error.request && error.request.readyState === 4);
};

/**
 * 获取动物类型对应的emoji图标
 */
const getAnimalEmoji = (type) => {
  const typeEmojiMap = {
    'Dog': '🐕',
    'Cat': '🐱',
    'Rabbit': '🐰',
    'Small & Furry': '🐹',
    'Horse': '🐴',
    'Bird': '🐦',
    'Scales, Fins & Other': '🐠',
    'Barnyard': '🐄',
    'Pig': '🐷',
    'Reptile': '🦎',
    'dog': '🐕',
    'cat': '🐱',
    'rabbit': '🐰',
    'bird': '🐦',
    '狗': '🐕',
    '猫': '🐱',
    '貓': '🐱',
    '兔': '🐰',
    '兔子': '🐰',
    'default': '🐾'
  };
  
  return typeEmojiMap[type] || typeEmojiMap['default'];
};

/**
 * 生成SVG格式的备用图片 - 使用安全的编码方式
 */
const generateFallbackImage = (emoji, name = 'Pet', subtitle = 'Loading...') => {
  // 使用文本工具进行安全清理
  const safeName = cleanText(String(name)).substring(0, 15) || 'Pet';
  const safeSubtitle = cleanText(String(subtitle)).substring(0, 20) || 'Loading...';
  
  const svgContent = `<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
    <rect width="400" height="400" fill="#f8f9fa" stroke="#dee2e6" stroke-width="2"/>
    <text x="200" y="160" font-family="Arial, sans-serif" font-size="120" text-anchor="middle" fill="#6c757d">${emoji}</text>
    <text x="200" y="250" font-family="Arial, sans-serif" font-size="24" text-anchor="middle" fill="#495057">${safeName}</text>
    <text x="200" y="300" font-family="Arial, sans-serif" font-size="16" text-anchor="middle" fill="#6c757d">${safeSubtitle}</text>
  </svg>`;
  
  return createSafeSVGDataURI(svgContent);
};

/**
 * 生成高质量备用图片 - 修复URL生成和类型处理
 */
const generateHighQualityFallbackImage = (type, name, code) => {
  const typeKeywords = {
    '狗': 'dog,golden-retriever',
    '貓': 'cat,kitten',
    'dog': 'dog,golden-retriever',
    'cat': 'cat,kitten',
    'Dog': 'dog,golden-retriever',
    'Cat': 'cat,kitten',
    'Rabbit': 'rabbit,bunny',
    'Small & Furry': 'hamster,guinea-pig',
    'Horse': 'horse',
    'Bird': 'bird,parrot',
    'Scales, Fins & Other': 'fish,aquarium',
    'Barnyard': 'farm,animals'
  };
  
  const keyword = typeKeywords[type] || 'pet,animal';
  
  // 使用更稳定的图片源和随机种子
  const seeds = [
    '1552053831-71594a27632d', // 可靠的狗图片
    '1574158622682-e40e69881006', // 可靠的猫图片
    '1548199973-03cce0bbc87b', // 可靠的宠物图片
    '1601758228041-375435679ac4', // 可靠的动物图片
    '1583337130070-e35b1b1a4fbe', // 可靠的宠物图片
    '1583512603805-3cc6b41f3edb', // 可靠的动物图片
    '1587300003388-59208cc962cb', // 可靠的宠物图片
    '1592194996308-7b43878e84a6'  // 可靠的动物图片
  ];
  
  // 根据code或name选择种子 - 修复类型问题
  let seedIndex = 0;
  if (code) {
    // 确保code转换为字符串
    const codeStr = String(code);
    if (codeStr.length > 0) {
      seedIndex = parseInt(codeStr.slice(-1)) % seeds.length;
    }
  } else if (name) {
    const nameStr = String(name);
    seedIndex = nameStr.length % seeds.length;
  } else {
    seedIndex = Math.floor(Math.random() * seeds.length);
  }
  
  const selectedSeed = seeds[seedIndex];
  const unsplashUrl = `https://images.unsplash.com/photo-${selectedSeed}?w=600&h=600&fit=crop&auto=format&q=80`;
  
  console.log(`🎨 生成备用图片: ${unsplashUrl} (类型: ${type}, 种子: ${selectedSeed})`);
  
  return unsplashUrl;
};

/**
 * 检查图片是否来自SPCA且可能有CORS问题
 */
const isSpcaImage = (imageUrl) => {
  return imageUrl && imageUrl.includes('spca.org.hk');
};

/**
 * 处理SPCA图片的CORS问题 - 强制使用代理
 */
const processSpcaImage = (imageUrl, petName, petType, petCode) => {
  if (!imageUrl) return null;
  
  // 首先清理和标准化URL
  let cleanImageUrl = String(imageUrl).trim();
  
  // 修复URL中的重复域名问题
  cleanImageUrl = cleanImageUrl.replace(/https:\/\/www\.spca\.org\.hk\/+\/www\.spca\.org\.hk/g, 'https://www.spca.org.hk');
  cleanImageUrl = cleanImageUrl.replace(/www\.spca\.org\.hk\/+\/www\.spca\.org\.hk/g, 'www.spca.org.hk');
  cleanImageUrl = cleanImageUrl.replace(/spca\.org\.hk\/+\/www\.spca\.org\.hk/g, 'spca.org.hk');
  
  // 清理多余的斜杠
  cleanImageUrl = cleanImageUrl.replace(/([^:]\/)\/+/g, '$1');
  
  // 确保URL格式正确
  if (cleanImageUrl.startsWith('//www.spca.org.hk')) {
    cleanImageUrl = 'https:' + cleanImageUrl;
  } else if (cleanImageUrl.startsWith('/www.spca.org.hk')) {
    cleanImageUrl = 'https:/' + cleanImageUrl;
  } else if (cleanImageUrl.startsWith('www.spca.org.hk') && !cleanImageUrl.startsWith('http')) {
    cleanImageUrl = 'https://' + cleanImageUrl;
  } else if (cleanImageUrl.startsWith('/wp-content')) {
    cleanImageUrl = 'https://www.spca.org.hk' + cleanImageUrl;
  } else if (cleanImageUrl.startsWith('wp-content')) {
    cleanImageUrl = 'https://www.spca.org.hk/' + cleanImageUrl;
  }
  
  console.log(`🔧 图片URL清理: ${imageUrl} -> ${cleanImageUrl}`);
  
  // 准备备用图片
  const fallbackUrl = generateHighQualityFallbackImage(petType, petName, petCode);
  
  // 如果是SPCA图片，强制使用代理
  if (isSpcaImage(cleanImageUrl)) {
    console.log(`🔄 检测到SPCA图片，使用代理: ${cleanImageUrl}`);
    
    // 使用本地代理服务器
    const proxyUrl = `${LOCAL_SERVER_CONFIG.baseURL}/proxy/image?url=${encodeURIComponent(cleanImageUrl)}`;
    
    console.log(`🌐 代理URL: ${proxyUrl}`);
    
    return {
      proxyUrl: proxyUrl, // 使用代理URL
      fallbackUrl,
      originalUrl: cleanImageUrl,
      hasCorsIssue: true
    };
  }
  
  return {
    proxyUrl: cleanImageUrl,
    fallbackUrl,
    originalUrl: cleanImageUrl,
    hasCorsIssue: false
  };
};

/**
 * 转换香港SPCA数据格式 - 使用代理图片
 */
const transformSpcaData = (spcaAnimal) => {
  console.log(`🔄 转换SPCA数据: ${spcaAnimal.name}`);
  
  // 提取并清理名称
  const cleanName = cleanText(spcaAnimal.name || `Pet ${spcaAnimal.code}`).replace(/!+$/, '').trim();
  
  // 生成表情符号
  const emoji = getAnimalEmoji(spcaAnimal.type);
  
  // 处理品种信息 - 直接使用提取的品种
  const finalBreed = spcaAnimal.breed || 
    (spcaAnimal.type === 'dog' ? 'Mongrel' : 
     spcaAnimal.type === 'cat' ? 'Domestic Shorthair' : 'Mixed Breed');
  
  // 处理性别信息 - 直接使用提取的性别
  let finalGender = spcaAnimal.gender || 'Unknown';
  
  // 处理年龄信息 - 直接使用提取的年龄
  const finalAge = spcaAnimal.age || 'Unknown';
  
  // 处理类型 - 基于品种推断
let finalType = spcaAnimal.type;
if (!finalType || finalType === 'Pet') {
  // 基于品种推断类型
  const breedLower = finalBreed.toLowerCase();
  
  if (breedLower.includes('mongrel') || breedLower.includes('retriever') || 
      breedLower.includes('shepherd') || breedLower.includes('terrier') ||
      breedLower.includes('bulldog') || breedLower.includes('husky') ||
      breedLower.includes('poodle') || breedLower.includes('beagle')) {
    finalType = 'dog';
  } else if (breedLower.includes('domestic') && breedLower.includes('hair')) {
    finalType = 'cat';
  } else if (breedLower.includes('skink') || breedLower.includes('snake') || 
             breedLower.includes('lizard') || breedLower.includes('reptile')) {
    finalType = 'reptile';
  } else {
    // 保持原来的逻辑作为备用
    finalType = 'pet';
  }
}
  
  console.log(`✅ SPCA数据转换完成:
    - 名称: ${cleanName}
    - 品种: ${finalBreed}
    - 性别: ${finalGender}
    - 年龄: ${finalAge}
    - 类型: ${finalType}`);
  
  // 处理图片 - 强制使用代理
  const validImages = Array.isArray(spcaAnimal.images) ? spcaAnimal.images.filter(Boolean) : [];
  const originalPrimaryImage = validImages.length > 0 ? validImages[0] : spcaAnimal.image;
  
  // 处理主图片的CORS问题 - 强制使用代理
  const primaryImageInfo = processSpcaImage(originalPrimaryImage, cleanName, finalType, spcaAnimal.code);
  
  // 处理所有图片，都使用代理
  const processedImages = validImages.map(imageUrl => {
    const imageInfo = processSpcaImage(imageUrl, cleanName, finalType, spcaAnimal.code);
    return imageInfo.proxyUrl;
  }).filter(Boolean);
  
  const finalImages = processedImages.length > 0 ? processedImages : [primaryImageInfo.fallbackUrl];
  const finalPrimaryImage = primaryImageInfo.proxyUrl || primaryImageInfo.fallbackUrl;
  
  // 处理描述
  const description = spcaAnimal.description || 
    `${cleanName}是一只可愛的${finalBreed}，正在${spcaAnimal.centre || 'SPCA香港'}等待领养。`;

  return {
    id: spcaAnimal.id,
    originalId: spcaAnimal.code,
    name: cleanName,
    breed: finalBreed,
    age: finalAge,
    size: spcaAnimal.size || 'Medium',
    gender: finalGender,
    type: finalType,
    location: spcaAnimal.location || '香港',
    image: finalPrimaryImage,
    images: finalImages,
    fallbackImage: primaryImageInfo.fallbackUrl,
    emoji,
    description: description,
    tags: spcaAnimal.tags || ['待領養', '健康檢查', 'SPCA認證'],
    personalityTags: spcaAnimal.personalityTags || ['友善', '可愛'],
    status: spcaAnimal.status || 'adoptable',
    healthStatus: spcaAnimal.healthStatus || '健康',
    vaccinated: spcaAnimal.vaccinated || false,
    spayed: spcaAnimal.spayed || finalGender.includes('Neutered') || finalGender.includes('Spayed'),
    center: spcaAnimal.centre || '香港愛護動物協會',
    
    // 添加SPCA特有字段
    microchip: spcaAnimal.microchip || '',
    intake: spcaAnimal.intake || '',
    birthday: spcaAnimal.birthday || '',
    
    contact: spcaAnimal.contact || {
      phone: '+852 2232 5529',
      email: 'adoption@spca.org.hk',
      organization: '香港愛護動物協會'
    },
    publishedAt: spcaAnimal.publishedAt || new Date().toISOString(),
    popularity: 0,
    viewCount: 0,
    favoriteCount: 0,
    adoptionCenter: spcaAnimal.centre || '香港愛護動物協會',
    postedDate: new Date(spcaAnimal.publishedAt || Date.now()),
    source: 'spca',
    
    // 添加图片元数据
    imageMetadata: {
      originalUrl: originalPrimaryImage,
      proxyUrl: primaryImageInfo.proxyUrl,
      hasCorsIssue: primaryImageInfo.hasCorsIssue,
      fallbackUrl: primaryImageInfo.fallbackUrl
    },
    
    // 添加原始数据用于调试
    debugInfo: {
      originalData: spcaAnimal,
      extractedCorrectly: true,
      processingTime: new Date().toISOString()
    }
  };
};

/**
 * 转换 Petfinder API 数据格式 - 根据实际API响应结构优化
 */
const transformPetfinderAnimal = (animal) => {
  const emoji = getAnimalEmoji(animal.type);
  const fallbackImage = generateHighQualityFallbackImage(animal.type, animal.name, animal.id);

  // 处理Petfinder图片 - 修复图片URL提取逻辑
  let processedImages = [];
  let primaryPhoto = fallbackImage;
  
  if (animal.photos && Array.isArray(animal.photos) && animal.photos.length > 0) {
    console.log(`📸 原始photos数据:`, animal.photos.length, '张图片');
    
    // 提取所有有效的图片URL - 使用正确的属性名
    processedImages = animal.photos
      .filter(photo => {
        // 确保photo对象存在且有有效的URL
        const hasValidUrl = photo && (photo.large || photo.medium || photo.full || photo.small);
        if (!hasValidUrl) {
          console.log(`❌ 无效的photo对象:`, photo);
        }
        return hasValidUrl;
      })
      .map(photo => {
        // 按优先级选择图片URL: large > medium > full > small
        const url = photo.large || photo.medium || photo.full || photo.small;
        console.log(`🔍 提取图片URL:`, url);
        return url;
      })
      .filter(url => {
        // 验证URL的有效性
        const isValid = url && typeof url === 'string' && (url.startsWith('http://') || url.startsWith('https://'));
        if (!isValid) {
          console.log(`❌ 无效的URL:`, url);
        }
        return isValid;
      });
    
    if (processedImages.length > 0) {
      primaryPhoto = processedImages[0];
      console.log(`✅ 找到 ${processedImages.length} 张有效Petfinder图片，主图: ${primaryPhoto}`);
    } else {
      console.log(`⚠️ 未找到有效图片，photos数据结构:`, JSON.stringify(animal.photos[0], null, 2));
    }
  } else {
    console.log(`⚠️ 没有photos数据或photos不是数组:`, animal.photos);
  }

  // 确保至少有一个图片（备用图片）
  if (processedImages.length === 0) {
    processedImages = [fallbackImage];
    primaryPhoto = fallbackImage;
    console.log(`🎨 使用备用图片: ${fallbackImage}`);
  }

  // 改进的描述处理逻辑
  let description = '';
  
  if (animal.description) {
    let rawDescription = animal.description.trim();
    
    // 清理Petfinder特有的无关内容 - 增加更多清理规则
    const petfinderExcludePatterns = [
      /\*\*\*\*\*.*?AVAILABLE FOR ADOPTION NOW.*?\*\*\*\*\*/gi,
      /\*\*\*PLEASE NOTE\*\*\*.*?applications\.?/gi,
      /pre.?adoption.*?application.*?must.*?be.*?completed/gi,
      /pre.?adoption.*?applications/gi,
      /a\s+pre\s+adoption\s+application\s+must\s+be\s+completed/gi,
      /for\s+any\s+pets\s+you\s+are\s+interested\s+in\s+adopting/gi,
      /please\s+note.*?application/gi,
      /application\s+fee/gi,
      /contact.*?for.*?more.*?information/gi,
      /email\s*:\s*[^\s]+@[^\s]+/gi,
      /phone\s*:\s*[\d\s\-\+\(\)]+/gi,
      /^[A-Za-z\s]+ Rd?,.*?(?=\s*[A-Z])/gi, // 清理地址信息
      /^Post Office Rd,.*?(?=\s*[A-Z])/gi, // 清理邮政地址
      /Neutered\s+(Male|Female)/gi,
      /~\d+\s+months?\s+old/gi,
      /\d+\s*$/gi // 清理末尾的数字
    ];
    
    petfinderExcludePatterns.forEach(pattern => {
      const beforeLength = rawDescription.length;
      rawDescription = rawDescription.replace(pattern, '').trim();
      if (beforeLength !== rawDescription.length) {
        console.log(`🧹 清理模式匹配: ${pattern} (${beforeLength} -> ${rawDescription.length})`);
      }
    });
    
    // 清理多余的空行和空格
    rawDescription = rawDescription
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      .replace(/\s+/g, ' ')
      .trim();
    
    console.log(`📝 清理后的Petfinder描述 (${rawDescription.length} 字符): "${rawDescription.substring(0, 100)}..."`);
    
    // 验证描述质量 - 对Petfinder数据使用更宽松的验证
    if (rawDescription.length > 10 && rawDescription.length < 2000) {
      // 对于Petfinder的英文内容，先进行基本检查
      const basicChecks = {
        hasValidLength: rawDescription.length >= 10, // 降低最小长度要求
        hasEnglishWords: /\b(i|am|is|are|was|were|have|has|the|a|an|my|me|love|like|enjoy|need|want|very|once|she|he|this|that|good|great|sweet|nice)\b/gi.test(rawDescription),
        hasPersonality: /\b(friendly|sweet|gentle|active|calm|playful|loving|smart|curious|shy|social|independent|affectionate|intelligent|energetic|quiet|happy|loyal)\b/gi.test(rawDescription),
        hasPetWords: /\b(dog|cat|pet|animal|puppy|kitten|rescue|adopt|shelter|home|family|owner|lap|walk|play|treat|toy)\b/gi.test(rawDescription),
        hasFirstPerson: /\b(i|me|my|myself)\b/gi.test(rawDescription),
        hasDescriptiveWords: /\b(very|quite|really|extremely|somewhat|fairly|pretty|rather|absolutely|completely|totally)\b/gi.test(rawDescription),
        hasActionWords: /\b(love|loves|like|likes|enjoy|enjoys|need|needs|want|wants|prefer|prefers|get|gets|go|goes|come|comes)\b/gi.test(rawDescription)
      };
      
      console.log('📊 Petfinder描述检查:', basicChecks);
      
      // 如果通过基本检查，直接使用 - 放宽条件
      if (basicChecks.hasValidLength && 
          (basicChecks.hasEnglishWords || basicChecks.hasPersonality || 
           basicChecks.hasPetWords || basicChecks.hasDescriptiveWords || 
           basicChecks.hasActionWords)) {
        description = rawDescription;
        console.log(`✅ Petfinder描述通过基本检查: "${description.substring(0, 100)}..."`);
      } else {
        // 进行更详细的验证
        const validationResult = validateTextIntegrity(rawDescription);
        
        if (validationResult.isValid) {
          description = validationResult.text;
          console.log(`✅ Petfinder描述验证通过: "${description.substring(0, 100)}..."`);
        } else {
          console.warn(`⚠️ Petfinder描述质量问题: ${validationResult.reason}`);
          // 对于Petfinder，即使验证不通过，如果有基本英文内容也使用
          if (rawDescription.length > 10 && (basicChecks.hasEnglishWords || basicChecks.hasPetWords)) {
            description = rawDescription;
            console.log(`🔄 强制使用Petfinder描述 (有基本内容): "${description.substring(0, 100)}..."`);
          } else {
            description = `${animal.name} is a wonderful ${animal.type.toLowerCase()} looking for a loving home. This ${animal.age ? animal.age.toLowerCase() : 'adorable'} ${animal.gender ? animal.gender.toLowerCase() : ''} ${animal.breeds?.primary || 'pet'} would make a great addition to your family!`;
            console.log(`📝 使用生成的描述: "${description}"`);
          }
        }
      }
    } else {
      console.warn(`⚠️ Petfinder描述长度异常: ${rawDescription.length} 字符`);
      description = `${animal.name} is a wonderful ${animal.type.toLowerCase()} looking for a loving home. This ${animal.age ? animal.age.toLowerCase() : 'adorable'} ${animal.gender ? animal.gender.toLowerCase() : ''} ${animal.breeds?.primary || 'pet'} would make a great addition to your family!`;
    }
  } else {
    console.log(`⚠️ 无description数据，生成默认描述`);
    description = `${animal.name} is a wonderful ${animal.type.toLowerCase()} looking for a loving home. This ${animal.age ? animal.age.toLowerCase() : 'adorable'} ${animal.gender ? animal.gender.toLowerCase() : ''} ${animal.breeds?.primary || 'pet'} would make a great addition to your family!`;
  }

  // 确保描述不为空
  if (!description || description.trim().length === 0) {
    description = `${animal.name} is a wonderful ${animal.type.toLowerCase()} looking for a loving home!`;
  }

  // 处理标签 - 使用正确的tags数组
  let tags = [];
  if (animal.tags && Array.isArray(animal.tags)) {
    tags = animal.tags
      .filter(tag => tag && typeof tag === 'string')
      .map(tag => cleanText(tag))
      .filter(tag => tag.length > 0);
  }

  // 去重并限制数量
  const uniqueTags = [...new Set(tags)];

  // 处理品种信息 - 使用正确的breeds对象结构
  let breedText = 'Mixed Breed';
  if (animal.breeds && animal.breeds.primary) {
    breedText = animal.breeds.primary;
    if (animal.breeds.secondary) {
      breedText += ` / ${animal.breeds.secondary}`;
    }
    if (animal.breeds.mixed) {
      breedText += ' (Mixed)';
    }
  }

  // 处理颜色信息
  let colorText = '';
  if (animal.colors && animal.colors.primary) {
    colorText = animal.colors.primary;
    if (animal.colors.secondary) {
      colorText += ` / ${animal.colors.secondary}`;
    }
    if (animal.colors.tertiary) {
      colorText += ` / ${animal.colors.tertiary}`;
    }
  }

  // 格式化地址
  const formatContactAddress = (contact) => {
    if (!contact || !contact.address) return '未知地区';
    
    const addr = contact.address;
    const parts = [];
    
    if (addr.city) parts.push(addr.city);
    if (addr.state) parts.push(addr.state);
    if (addr.postcode) parts.push(addr.postcode);
    
    return parts.length > 0 ? parts.join(', ') : '未知地区';
  };

  return {
    id: `petfinder_${animal.id}`,
    originalId: animal.id,
    name: cleanText(animal.name) || 'Unknown Pet',
    breed: cleanText(breedText),
    age: animal.age || 'Unknown',
    size: animal.size || 'Medium',
    gender: animal.gender || 'Unknown',
    type: animal.type || 'Pet',
    species: animal.species || animal.type,
    coat: animal.coat || 'Unknown',
    colors: colorText,
    location: formatContactAddress(animal.contact),
    image: primaryPhoto,
    images: processedImages,
    fallbackImage,
    emoji,
    description: description,
    tags: uniqueTags.slice(0, 8),
    status: animal.status || 'adoptable',
    
    // 使用正确的attributes结构
    healthStatus: animal.attributes?.shots_current ? '已接种疫苗' : '健康状况待确认',
    vaccinated: animal.attributes?.shots_current || false,
    spayed: animal.attributes?.spayed_neutered || false,
    houseTrained: animal.attributes?.house_trained || false,
    specialNeeds: animal.attributes?.special_needs || false,
    declawed: animal.attributes?.declawed || false,
    
    // 使用正确的environment结构
    goodWithChildren: animal.environment?.children || false,
    goodWithDogs: animal.environment?.dogs || false,
    goodWithCats: animal.environment?.cats || false,
    
    // 联系信息
    contact: {
      email: animal.contact?.email,
      phone: animal.contact?.phone,
      address: animal.contact?.address
    },
    
    // 组织信息
    organization: {
      id: animal.organization_id,
      url: animal.url
    },
    
    // 媒体信息
    photos: animal.photos || [],
    videos: animal.videos || [],
    
    // 其他信息
    publishedAt: animal.published_at,
    distance: animal.distance,
    popularity: 0,
    viewCount: 0,
    favoriteCount: 0,
    adoptionCenter: '通过 Petfinder',
    postedDate: new Date(animal.published_at),
    source: 'petfinder',
    
    // API链接
    links: animal._links
  };
};

/**
 * 获取香港 SPCA 数据
 */
const fetchSpcaData = async () => {
  try {
    console.log('🔍 正在连接本地服务器获取香港 SPCA 数据...');
    
    // 首先检查服务器状态
    try {
      const statusResponse = await localAPI.get('/status');
      console.log('✅ 服务器状态正常:', statusResponse.data.status);
    } catch (statusError) {
      console.warn('⚠️ 无法获取服务器状态:', statusError.message);
    }
    
    // 首先尝试初始化数据目录
    try {
      console.log('📁 正在初始化数据目录...');
      await localAPI.post('/init-data-dir');
      console.log('✅ 数据目录初始化成功');
    } catch (initError) {
      console.warn('⚠️ 数据目录初始化失败:', initError.message);
    }
    
    // 尝试获取现有数据
    let data = [];
    try {
      console.log('📡 正在获取香港 SPCA 数据...');
      const response = await localAPI.get(LOCAL_SERVER_CONFIG.chinaDataUrl);
      data = response.data;
      console.log('✅ 获取到现有数据:', data.length, '条');
    } catch (error) {
      console.log('❌ 获取现有数据失败:', error.message);
      if (error.response?.status === 404) {
        console.log('📁 数据文件不存在，将触发爬取');
      }
    }
    
    // 如果数据不足，尝试触发爬取，但使用更长的超时
    if (!data || data.length < 5) {
      console.log('🕷️ 数据不足，触发香港 SPCA 爬取...');
      try {
        // 使用更长的超时时间用于爬取
        const crawlResponse = await axios.get(`${LOCAL_SERVER_CONFIG.baseURL}${LOCAL_SERVER_CONFIG.crawlUrl}`, {
          timeout: 60000 // 60秒超时用于爬取
        });
        console.log('✅ 爬取响应:', crawlResponse.data);
        
        // 等待爬取完成
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        try {
          const newResponse = await localAPI.get(LOCAL_SERVER_CONFIG.chinaDataUrl);
          data = newResponse.data;
          console.log('🎉 爬取后获取到数据:', data.length, '条');
        } catch (newError) {
          console.log('⚠️ 爬取后仍无法获取数据:', newError.message);
        }
      } catch (crawlError) {
        console.log('❌ 触发爬取失败:', crawlError.message);
        if (crawlError.code === 'ECONNABORTED') {
          console.log('⏰ 爬取请求超时，可能正在后台处理');
        }
      }
    }
    
    // 如果还是没有数据，返回模拟数据
    if (!data || data.length === 0) {
      console.log('🎭 使用香港 SPCA 模拟数据...');
      return generateMockSpcaData();
    }
    
    console.log('🎉 成功获取香港 SPCA 数据:', data.length, '条记录');
    
    // 转换数据格式
    const transformedData = data.map(transformSpcaData);
    
    return transformedData;
  } catch (error) {
    console.error('💥 获取香港 SPCA 数据失败:', error);
    
    if (error.code === 'ECONNABORTED') {
      console.error('⏰ 请求超时 - 尝试增加超时时间或检查网络连接');
    }
    
    return generateMockSpcaData();
  }
};

/**
 * 获取可领养宠物信息（合并多个数据源）- 优先使用Petfinder数据
 */
const fetchAdoptablePets = async (filters = {}, page = 1, limit = 50) => {
  try {
    console.log('正在获取可领养宠物数据，筛选条件:', filters, '页码:', page, '每页:', limit);
    
    const promises = [];
    
    // 优先获取 Petfinder 数据
    promises.push(
      fetchPetfinderPets(filters, page, Math.ceil(limit * 0.7))
        .catch(error => {
          console.warn('Petfinder 数据获取失败，继续使用其他数据源');
          return [];
        })
    );
    
    // 获取香港 SPCA 数据作为补充
    promises.push(fetchSpcaData());
    
    // 并行获取数据
    const results = await Promise.allSettled(promises);
    
    let allPets = [];
    
    // 优先处理 Petfinder 数据
    if (results[0].status === 'fulfilled') {
      allPets = allPets.concat(results[0].value);
      console.log('✅ 获取到 Petfinder 数据:', results[0].value.length, '条');
    }
    
    // 处理香港 SPCA 数据作为补充
    if (results[1].status === 'fulfilled') {
      // 应用筛选条件到香港 SPCA 数据
      const filteredSpcaData = results[1].value.filter(pet => {
        if (filters.type && filters.type !== 'all') {
          const filterType = filters.type.toLowerCase();
          const petType = pet.type.toLowerCase();
          if (filterType === 'dog' && petType !== '狗' && petType !== 'dog') return false;
          if (filterType === 'cat' && petType !== '貓' && petType !== 'cat') return false;
          if (filterType !== 'dog' && filterType !== 'cat' && petType !== filterType) return false;
        }
        if (filters.breed && !pet.breed.toLowerCase().includes(filters.breed.toLowerCase())) {
          return false;
        }
        if (filters.location && !pet.location.toLowerCase().includes(filters.location.toLowerCase()) && !filters.location.toLowerCase().includes('hong kong') && !filters.location.toLowerCase().includes('香港')) {
          return false;
        }
        return true;
      });
      
      // 限制 SPCA 数据的数量，确保 Petfinder 数据占主导
      const spcaLimit = Math.max(limit - allPets.length, Math.ceil(limit * 0.3));
      allPets = allPets.concat(filteredSpcaData.slice(0, spcaLimit));
      console.log('✅ 获取到 SPCA 数据:', filteredSpcaData.length, '条，使用:', Math.min(filteredSpcaData.length, spcaLimit), '条');
    }
    
    // 如果数据不足，补充模拟数据
    if (allPets.length < limit * 0.5) {
      console.log('数据不足，添加模拟数据...');
      const mockCount = Math.max(limit - allPets.length, 10);
      const mockPets = generateMockPets(mockCount, filters);
      allPets = allPets.concat(mockPets);
    }
    
    // 随机打乱顺序，但保持 Petfinder 数据优先
    const petfinderPets = allPets.filter(pet => pet.source === 'petfinder');
    const otherPets = allPets.filter(pet => pet.source !== 'petfinder');
    
    // 打乱各自的顺序
    const shuffledPetfinder = petfinderPets.sort(() => Math.random() - 0.5);
    const shuffledOthers = otherPets.sort(() => Math.random() - 0.5);
    
    // 重新组合，优先展示 Petfinder 数据
    allPets = [...shuffledPetfinder, ...shuffledOthers];
    
    // 分页处理
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedPets = allPets.slice(startIndex, endIndex);
    
    console.log(`成功获取宠物数据: 总共${allPets.length}只，当前页${paginatedPets.length}只`);
    
    return {
      pets: paginatedPets,
      pagination: {
        currentPage: page,
        totalCount: allPets.length,
        hasNextPage: endIndex < allPets.length,
        hasPreviousPage: page > 1
      }
    };
    
  } catch (error) {
    console.error('获取可领养宠物失败:', error);
    
    // 最后的备用方案
    console.log('使用模拟数据作为备用...');
    const mockPets = generateMockPets(limit, filters);
    
    return {
      pets: mockPets,
      pagination: {
        currentPage: page,
        totalCount: mockPets.length,
        hasNextPage: false,
        hasPreviousPage: false
      }
    };
  }
};

/**
 * 获取首页展示宠物数据 - 优先使用Petfinder数据
 */
const fetchHomePagePets = async (limit = 50) => {
  try {
    console.log('正在获取首页宠物数据，优先使用 Petfinder 数据...');
    
    let allPets = [];
    
    // 优先获取 Petfinder 数据
    try {
      const petfinderPets = await fetchPetfinderPets({}, 1, Math.ceil(limit * 0.8));
      allPets = allPets.concat(petfinderPets);
      console.log('✅ 获取到 Petfinder 数据:', petfinderPets.length, '条');
    } catch (error) {
      console.warn('Petfinder 数据获取失败，继续使用其他数据源');
    }
    
    // 如果 Petfinder 数据不足，补充 SPCA 数据
    if (allPets.length < limit * 0.6) {
      console.log('Petfinder 数据不足，补充 SPCA 数据...');
      try {
        const spcaData = await fetchSpcaData();
        const remainingSlots = limit - allPets.length;
        allPets = allPets.concat(spcaData.slice(0, remainingSlots));
        console.log('✅ 补充 SPCA 数据:', Math.min(spcaData.length, remainingSlots), '条');
      } catch (error) {
        console.warn('SPCA 数据获取失败');
      }
    }
    
    // 如果数据仍然不足，补充模拟数据
    if (allPets.length < limit * 0.5) {
      console.log('数据不足，添加模拟数据...');
      const mockCount = Math.max(limit - allPets.length, 20);
      const mockPets = generateMockPets(mockCount);
      allPets = allPets.concat(mockPets);
    }
    
    // 优先展示 Petfinder 数据，但随机打乱
    const petfinderPets = allPets.filter(pet => pet.source === 'petfinder');
    const otherPets = allPets.filter(pet => pet.source !== 'petfinder');
    
    const shuffledPetfinder = petfinderPets.sort(() => Math.random() - 0.5);
    const shuffledOthers = otherPets.sort(() => Math.random() - 0.5);
    
    // 重新组合并限制数量
    const finalPets = [...shuffledPetfinder, ...shuffledOthers].slice(0, limit);
    
    console.log(`✅ 成功获取首页数据: ${finalPets.length}只宠物 (Petfinder: ${petfinderPets.length}只)`);
    return finalPets;
  } catch (error) {
    console.error('❌ 获取首页宠物数据失败:', error);
    console.log('使用模拟数据作为备用...');
    return generateMockPets(limit);
  }
};

/**
 * 获取热门宠物列表 - 优先使用Petfinder数据
 */
const fetchPopularPets = async (limit = 10) => {
  try {
    console.log('正在获取热门宠物，优先使用 Petfinder 数据...');
    
    // 获取更多数据以便筛选热门宠物
    const result = await fetchAdoptablePets({}, 1, limit * 3);
    const pets = result.pets;
    
    // 优先选择 Petfinder 数据作为热门宠物
    const petfinderPets = pets.filter(pet => pet.source === 'petfinder');
    const otherPets = pets.filter(pet => pet.source !== 'petfinder');
    
    // 按人气排序
    const sortedPetfinder = petfinderPets.sort((a, b) => b.popularity - a.popularity);
    const sortedOthers = otherPets.sort((a, b) => b.popularity - a.popularity);
    
    // 组合结果，优先展示 Petfinder 数据
    const popularPets = [...sortedPetfinder, ...sortedOthers].slice(0, limit);
    
    console.log(`✅ 获取热门宠物: ${popularPets.length}只 (Petfinder: ${Math.min(sortedPetfinder.length, limit)}只)`);
    return popularPets;
  } catch (error) {
    console.error('获取热门宠物失败:', error);
    
    const mockPets = generateMockPets(limit)
      .sort((a, b) => b.popularity - a.popularity);
    
    return mockPets;
  }
};

/**
 * 根据宠物ID获取详细信息
 */
const fetchPetById = async (petId) => {
  try {
    console.log('获取宠物详细信息:', petId);
    
    if (petId.startsWith('petfinder_')) {
      const originalId = petId.replace('petfinder_', '');
      return await fetchPetfinderPetById(originalId);
    }
    
    if (petId.startsWith('spca_')) {
      // 尝试从本地数据中查找
      const spcaData = await fetchSpcaData();
      const pet = spcaData.find(p => p.id === petId);
      return pet || null;
    }
    
    // 对于其他ID，返回模拟数据
    const mockPets = generateMockPets(1);
    return mockPets[0];
    
  } catch (error) {
    console.error('获取宠物详细信息失败:', error);
    throw error;
  }
};

/**
 * 获取宠物类型列表 - 使用后端代理
 */
const fetchPetTypes = async () => {
  try {
    console.log('获取宠物类型列表...');
    
    const response = await createAuthenticatedRequest(
      `${PETFINDER_API_CONFIG.baseURL}${PETFINDER_API_CONFIG.typesUrl}`
    );
    
    return response.data.types || [];
  } catch (error) {
    console.error('获取宠物类型失败:', error);
    // 返回默认类型
    return [
      { name: 'Dog' },
      { name: 'Cat' },
      { name: 'Rabbit' },
      { name: 'Small & Furry' },
      { name: 'Horse' },
      { name: 'Bird' },
      { name: 'Scales, Fins & Other' },
      { name: 'Barnyard' }
    ];
  }
};

/**
 * 获取收容所信息 - 使用后端代理
 */
const fetchOrganization = async (organizationId) => {
  try {
    console.log('获取收容所信息:', organizationId);
    
    const response = await createAuthenticatedRequest(
      `${PETFINDER_API_CONFIG.baseURL}${PETFINDER_API_CONFIG.organizationsUrl}/${organizationId}`
    );
    
    return response.data.organization;
  } catch (error) {
    console.error('获取收容所信息失败:', error);
    throw error;
  }
};

/**
 * 搜索宠物
 */
const searchPets = async (query, filters = {}, page = 1, limit = 20) => {
  try {
    console.log('搜索宠物:', query, filters);
    
    const searchFilters = {
      ...filters,
      name: query
    };
    
    const result = await fetchAdoptablePets(searchFilters, page, limit);
    return result;
  } catch (error) {
    console.error('搜索宠物失败:', error);
    throw error;
  }
};

/**
 * 获取 Petfinder 宠物详细信息 - 使用后端代理
 */
const fetchPetfinderPetById = async (petId) => {
  try {
    console.log('获取 Petfinder 宠物详细信息:', petId);
    
    // 清理 petId，移除可能的前缀
    const cleanPetId = petId.replace('petfinder_', '');
    
    const response = await createAuthenticatedRequest(
      `${PETFINDER_API_CONFIG.baseURL}/animal/${cleanPetId}`
    );
    
    if (response.data && response.data.animal) {
      const transformedPet = transformPetfinderAnimal(response.data.animal);
      console.log('成功获取宠物详细信息:', transformedPet.name);
      return transformedPet;
    }
    
    return null;
  } catch (error) {
    console.error('获取 Petfinder 宠物详细信息失败:', error);
    throw error;
  }
};

/**
 * 根据地区获取宠物
 */
const fetchPetsByRegion = async (region, limit = 20) => {
  try {
    console.log('根据地区获取宠物:', region);
    
    const filters = {
      location: region
    };
    
    const result = await fetchAdoptablePets(filters, 1, limit);
    return result.pets;
  } catch (error) {
    console.error('根据地区获取宠物失败:', error);
    throw error;
  }
};

/**
 * 获取Petfinder宠物数据 - 使用后端代理
 */
const fetchPetfinderPets = async (filters = {}, page = 1, limit = 20) => {
  try {
    console.log('正在获取Petfinder宠物数据...', { filters, page, limit });
    
    // 获取访问令牌
    const token = await getAccessToken();
    
    // 构建查询参数
    const queryParams = {
      token,
      page,
      limit,
      status: 'adoptable',
      sort: 'recent'
    };
    
    // 添加筛选条件
    if (filters.type && filters.type !== 'all') {
      queryParams.type = filters.type;
    }
    
    if (filters.breed) {
      queryParams.breed = filters.breed;
    }
    
    if (filters.location) {
      queryParams.location = filters.location;
    }
    
    if (filters.age) {
      queryParams.age = filters.age;
    }
    
    if (filters.gender) {
      queryParams.gender = filters.gender;
    }
    
    if (filters.size) {
      queryParams.size = filters.size;
    }
    
    if (filters.name) {
      queryParams.name = filters.name;
    }
    
    const response = await axios.get(`${PETFINDER_API_CONFIG.baseURL}${PETFINDER_API_CONFIG.animalsUrl}`, {
      params: queryParams,
      timeout: 30000
    });
    
    if (response.data && response.data.animals) {
      const transformedPets = response.data.animals
        .map(animal => transformPetfinderAnimal(animal))
        .filter(pet => pet && pet.name); // 过滤掉转换失败的数据
      
      console.log(`✅ 获取 Petfinder 宠物成功: ${transformedPets.length} 只`);
      return transformedPets;
    } else {
      console.log('⚠️ Petfinder 返回的数据结构异常');
      return [];
    }
    
  } catch (error) {
    console.error('❌ 获取 Petfinder 宠物失败:', error.message);
    
    if (isCORSError(error)) {
      console.error('这可能是CORS错误，尝试使用后端代理');
    }
    
    return [];
  }
};

/**
 * 生成模拟宠物数据
 */
const generateMockPets = (count = 10, filters = {}) => {
  console.log('🎭 生成模拟宠物数据:', count, '只');
  
  const names = [
    'Bella', 'Charlie', 'Luna', 'Cooper', 'Lucy', 'Max', 'Daisy', 'Milo',
    'Sadie', 'Rocky', 'Molly', 'Jack', 'Stella', 'Bear', 'Lily', 'Duke',
    'Zoe', 'Buddy', 'Lola', 'Oliver', 'Sophie', 'Tucker', 'Ruby', 'Winston'
  ];
  
  const dogBreeds = [
    'Labrador Retriever', 'Golden Retriever', 'German Shepherd', 'Beagle',
    'Poodle', 'Bulldog', 'Siberian Husky', 'Dachshund', 'Chihuahua',
    'Mixed Breed', 'Border Collie', 'Shih Tzu', 'Boxer', 'Pug'
  ];
  
  const catBreeds = [
    'Domestic Shorthair', 'Siamese', 'Maine Coon', 'Persian',
    'Ragdoll', 'Bengal', 'Sphynx', 'British Shorthair', 'Abyssinian',
    'Mixed Breed', 'Scottish Fold', 'American Shorthair', 'Burmese'
  ];
  
  const descriptions = [
    'A loving pet looking for a forever home.',
    'Playful and energetic, gets along great with other pets.',
    'Sweet and gentle, would make a great family pet.',
    'Loves attention and cuddles. Very affectionate.',
    'Intelligent and curious. Loves to explore.',
    'Calm and well-behaved. Already knows basic commands.',
    'Needs a patient owner who can help build confidence.',
    'Young and energetic. Would benefit from training.',
    'Very social and loves meeting new people and pets.',
    'Quiet and independent. Would do well in a calm household.'
  ];
  
  const locations = [
    'New York, NY', 'Los Angeles, CA', 'Chicago, IL', 'Houston, TX',
    'Phoenix, AZ', 'Philadelphia, PA', 'San Antonio, TX', 'San Diego, CA',
    'Dallas, TX', 'San Jose, CA', 'Austin, TX', 'Boston, MA', '香港'
  ];
  
  const ages = ['Baby', 'Young', 'Adult', 'Senior'];
  const sizes = ['Small', 'Medium', 'Large', 'Extra Large'];
  const genders = ['Male', 'Female'];
  
  const mockPets = [];
  
  // 应用筛选条件
  let petTypes = ['Dog', 'Cat', 'Rabbit', 'Small & Furry', 'Bird'];
  
  if (filters.type && filters.type !== 'all') {
    petTypes = [filters.type.charAt(0).toUpperCase() + filters.type.slice(1)];
  }
  
  for (let i = 0; i < count; i++) {
    // 随机选择宠物类型
    const type = petTypes[Math.floor(Math.random() * petTypes.length)];
    
    // 根据类型选择品种
    const breed = type === 'Dog' ? 
      dogBreeds[Math.floor(Math.random() * dogBreeds.length)] : 
      type === 'Cat' ?
        catBreeds[Math.floor(Math.random() * catBreeds.length)] :
        'Mixed Breed';
    
    // 如果有breed筛选，跳过不匹配的
    if (filters.breed && !breed.toLowerCase().includes(filters.breed.toLowerCase())) {
      continue;
    }
    
    const name = names[Math.floor(Math.random() * names.length)];
    const age = ages[Math.floor(Math.random() * ages.length)];
    const size = sizes[Math.floor(Math.random() * sizes.length)];
    const gender = genders[Math.floor(Math.random() * genders.length)];
    const description = descriptions[Math.floor(Math.random() * descriptions.length)];
    
    let location = locations[Math.floor(Math.random() * locations.length)];
    // 如果有location筛选，使用筛选的location
    if (filters.location) {
      location = filters.location;
    }
    
    // 如果有age或gender筛选，跳过不匹配的
    if (filters.age && filters.age !== age) continue;
    if (filters.gender && filters.gender !== gender) continue;
    if (filters.size && filters.size !== size) continue;
    
    const mockId = `mock_${Date.now()}_${i}`;
    const emoji = getAnimalEmoji(type);
    const primaryImage = generateHighQualityFallbackImage(type, name, mockId);
    
    const pet = {
      id: mockId,
      originalId: `mock${i + 100}`,
      name,
      breed,
      age,
      size,
      gender,
      type,
      location,
      image: primaryImage,
      images: [primaryImage],
      fallbackImage: primaryImage,
      emoji,
      description,
      tags: ['友善', '健康', '已接种疫苗'],
      personalityTags: ['活泼', '聪明', '可爱'],
      status: 'adoptable',
      healthStatus: '健康',
      vaccinated: Math.random() > 0.2, // 80%概率已接种疫苗
      spayed: Math.random() > 0.3, // 70%概率已绝育
      center: '模拟收容所',
      contact: {
        phone: '+1 123-456-7890',
        email: 'adopt@example.org',
        organization: '模拟收容组织'
      },
      publishedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      popularity: 0,
      viewCount: 0,
      favoriteCount: 0,
      adoptionCenter: '模拟收容中心',
      postedDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      source: 'mock'
    };
    
    mockPets.push(pet);
  }
  
  // 如果筛选条件导致没有足够的宠物，继续生成直到达到count
  while (mockPets.length < count) {
    const mockId = `mock_${Date.now()}_${mockPets.length}`;
    const type = petTypes[Math.floor(Math.random() * petTypes.length)];
    const name = names[Math.floor(Math.random() * names.length)];
    const emoji = getAnimalEmoji(type);
    const primaryImage = generateHighQualityFallbackImage(type, name, mockId);
    
    const pet = {
      id: mockId,
      originalId: `mock${mockPets.length + 100}`,
      name,
      breed: type === 'Dog' ? 'Mixed Breed Dog' : type === 'Cat' ? 'Mixed Breed Cat' : 'Mixed Breed',
      age: ages[Math.floor(Math.random() * ages.length)],
      size: sizes[Math.floor(Math.random() * sizes.length)],
      gender: genders[Math.floor(Math.random() * genders.length)],
      type,
      location: filters.location || '全球',
      image: primaryImage,
      images: [primaryImage],
      fallbackImage: primaryImage,
      emoji,
      description: `这是一只可爱的${type}，正在寻找一个充满爱的家。`,
      tags: ['友善', '健康', '已接种疫苗'],
      personalityTags: ['活泼', '聪明', '可爱'],
      status: 'adoptable',
      healthStatus: '健康',
      vaccinated: true,
      spayed: true,
      center: '模拟收容所',
      contact: {
        phone: '+1 123-456-7890',
        email: 'adopt@example.org',
        organization: '模拟收容组织'
      },
      publishedAt: new Date().toISOString(),
      popularity: Math.floor(Math.random() * 100) + 1,
      viewCount: Math.floor(Math.random() * 500) + 50,
      favoriteCount: Math.floor(Math.random() * 100) + 20,
      adoptionCenter: '模拟收容中心',
      postedDate: new Date(),
      source: 'mock'
    };
    
    mockPets.push(pet);
  }
  
  return mockPets;
};

/**
 * 生成香港SPCA模拟数据 - 使用正确的品种和性别信息
 */
const generateMockSpcaData = () => {
  const mockSpcaData = [
    {
      id: 'spca_mock_1',
      code: '536845',
      name: 'Ruby',
      type: '狗',
      breed: 'Mongrel', // 正确的品种信息
      age: '成年',
      size: '中型',
      gender: 'Female(Desexed)', // 正确的性别信息
      location: '香港',
      center: 'Sai Kung Adopt-a-Pet Centre',
      description: 'Ruby是一只温顺的混种犬，性格活泼友善，非常适合家庭饲养。',
      image: generateHighQualityFallbackImage('狗', 'Ruby', '536845'),
      tags: ['待領養', '健康檢查', 'SPCA認證'],
      personalityTags: ['Active', 'Positive', 'Reliable'],
      healthStatus: '健康',
      vaccinated: true,
      spayed: true,
      contact: {
        phone: '+852 2232 5529',
        email: 'adoption@spca.org.hk',
        organization: '香港愛護動物協會'
      },
      publishedAt: new Date().toISOString(),
      source: 'spca'
    },
    {
      id: 'spca_mock_2',
      code: '541923',
      name: 'Max',
      type: '狗',
      breed: 'Golden Retriever Mix', // 正确的品种信息
      age: '青年',
      size: '大型',
      gender: 'Male(Neutered)', // 正确的性别信息
      location: '香港',
      center: 'Wan Chai Centre',
      description: 'Max是一只活泼的金毛寻回犬，喜欢运动和与人互动。',
      image: generateHighQualityFallbackImage('狗', 'Max', '541923'),
      tags: ['待領養', '健康檢查', 'SPCA認證'],
      personalityTags: ['Energetic', 'Friendly', 'Playful'],
      healthStatus: '健康',
      vaccinated: true,
      spayed: false,
      contact: {
        phone: '+852 2232 5529',
        email: 'adoption@spca.org.hk',
        organization: '香港愛護動物協會'
      },
      publishedAt: new Date().toISOString(),
      source: 'spca'
    },
    {
      id: 'spca_mock_3',
      code: '542966',
      name: 'Whiskers',
      type: '貓',
      breed: 'Domestic Shorthair', // 正确的品种信息
      age: '青年',
      size: '小型',
      gender: 'Female(Spayed)', // 正确的性别信息
      location: '香港',
      center: 'Tsing Yi Centre',
      description: 'Whiskers是一只温柔的猫咪，喜欢安静的环境，适合与老人或小孩相处。',
      image: generateHighQualityFallbackImage('貓', 'Whiskers', '542966'),
      tags: ['待領養', '健康檢查', 'SPCA認證'],
      personalityTags: ['Gentle', 'Calm', 'Affectionate'],
      healthStatus: '健康',
      vaccinated: true,
      spayed: true,
      contact: {
        phone: '+852 2232 5529',
        email: 'adoption@spca.org.hk',
        organization: '香港愛護動物協會'
      },
      publishedAt: new Date().toISOString(),
      source: 'spca'
    }
  ];

  return mockSpcaData;
};

/**
 * 获取 Petfinder API 访问令牌 - 使用后端代理
 */
const getAccessToken = async () => {
  try {
    if (accessToken && tokenExpiresAt && Date.now() < tokenExpiresAt) {
      return accessToken;
    }

    console.log('正在通过后端代理获取 Petfinder API 访问令牌...');
    
    const response = await axios.post(`${PETFINDER_API_CONFIG.baseURL}${PETFINDER_API_CONFIG.tokenUrl}`, {
      grant_type: 'client_credentials'
    });

    const { access_token, expires_in } = response.data;
    
    accessToken = access_token;
    tokenExpiresAt = Date.now() + (expires_in * 1000) - 300000;
    
    console.log('成功获取 Petfinder API 访问令牌');
    return accessToken;
  } catch (error) {
    console.error('获取 Petfinder API 访问令牌失败:', error);
    throw new Error('Failed to get Petfinder API access token');
  }
};

/**
 * 创建带认证的请求实例
 */
const createAuthenticatedRequest = async (url, params = {}) => {
  try {
    const token = await getAccessToken();
    
    const response = await axios.get(url, {
      params: {
        ...params,
        token: token // 将token作为参数传递给后端
      },
      timeout: 30000
    });
    
    return response;
  } catch (error) {
    if (error.response?.status === 401) {
      // Token 过期，清除并重试
      accessToken = null;
      tokenExpiresAt = null;
      
      const token = await getAccessToken();
      return await axios.get(url, {
        params: {
          ...params,
          token: token
        },
        timeout: 30000
      });
    }
    throw error;
  }
};

// 集中导出所有函数，避免重复导出
export {
  fetchAdoptablePets,
  fetchHomePagePets,
  fetchPopularPets,
  fetchPetById,
  fetchPetTypes,
  fetchPetfinderPetById,
  searchPets,
  fetchPetsByRegion,
  fetchSpcaData,
  transformPetfinderAnimal,
  transformSpcaData,
  generateMockSpcaData,
  generateHighQualityFallbackImage,
  getAnimalEmoji,
  fetchOrganization
};