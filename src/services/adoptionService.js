import axios from 'axios';
import { 
  validateDescription, 
  formatDescriptionToParagraphs, 
  generateSafeSVGDataURL,
  formatSPCAAboutMe,
  safeCleanText
} from '../utils/textUtils';

// Petfinder API 配置
const PETFINDER_API_CONFIG = {
  baseURL: 'https://api.petfinder.com/v2',
  clientId: process.env.REACT_APP_PETFINDER_CLIENT_ID,
  clientSecret: process.env.REACT_APP_PETFINDER_CLIENT_SECRET,
  tokenUrl: '/oauth2/token',
  animalsUrl: '/animals',
  organizationsUrl: '/organizations',
  typesUrl: '/types'
};

// 本地服务器配置
const LOCAL_SERVER_CONFIG = {
  baseURL: 'http://localhost:8080',
  chinaDataUrl: '/data/china', // 保持不变，因为服务器端点没变
  crawlUrl: '/crawl/china'
};



// 检查 API 配置
const checkAPIConfig = () => {
  if (!PETFINDER_API_CONFIG.clientId || !PETFINDER_API_CONFIG.clientSecret) {
    console.warn('Petfinder API 密钥未配置，将使用模拟数据');
    return false;
  }
  return true;
};

// 创建 axios 实例
const petfinderAPI = axios.create({
  baseURL: PETFINDER_API_CONFIG.baseURL,
  timeout: 45000,
  headers: {
    'Content-Type': 'application/json',
  }
});

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
 * 安全的 Base64 编码函数 - 已弃用，使用 textUtils 中的 safeUrlEncode
 * @deprecated 使用 textUtils.safeUrlEncode 代替
 */
const safeBase64Encode = (str) => {
  console.warn('safeBase64Encode is deprecated, use textUtils.safeUrlEncode instead');
  try {
    // 首先将字符串转换为 UTF-8 字节
    const utf8Bytes = new TextEncoder().encode(str);
    // 将字节转换为二进制字符串
    let binaryString = '';
    for (let i = 0; i < utf8Bytes.length; i++) {
      binaryString += String.fromCharCode(utf8Bytes[i]);
    }
    // 使用 btoa 编码
    return btoa(binaryString);
  } catch (error) {
    console.error('Base64 编码失败:', error);
    return btoa(`
      <svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="400" fill="#f0f0f0"/>
        <text x="200" y="200" font-family="Arial" font-size="60" text-anchor="middle" fill="#333">No Image</text>
      </svg>
    `);
  }
};

/**
 * 生成SVG格式的备用图片 - 使用安全的 URL 编码
 */
const generateFallbackImage = (emoji, name = 'Pet', subtitle = 'Loading...') => {
  // 使用 textUtils 中的安全方法
  return generateSafeSVGDataURL(emoji, name, subtitle);
};

/**
 * 获取 Petfinder API 访问令牌 - 通过后端代理
 */
const getAccessToken = async () => {
  try {
    // 检查缓存中是否有有效令牌
    if (accessToken && tokenExpiresAt && Date.now() < tokenExpiresAt) {
      return accessToken;
    }

    console.log('正在获取 Petfinder API 访问令牌...');
    
    // 通过后端代理获取令牌
    const response = await localAPI.post('/api/petfinder/token');
    
    if (response.data && response.data.access_token) {
      const { access_token, expires_in } = response.data;
      
      accessToken = access_token;
      tokenExpiresAt = Date.now() + (expires_in * 1000) - 300000; // 提前5分钟过期
      
      console.log('成功获取 Petfinder API 访问令牌');
      return accessToken;
    } else {
      throw new Error('未收到有效令牌');
    }
  } catch (error) {
    console.error('获取 Petfinder API 访问令牌失败:', error);
    
    if (error.code === 'ERR_NETWORK' || error.message.includes('CORS')) {
      console.warn('检测到 CORS 或网络错误，这在开发环境中很常见。将使用模拟数据。');
    }
    
    throw error;
  }
};

/**
 * 设置请求拦截器
 */
petfinderAPI.interceptors.request.use(
  async (config) => {
    try {
      const token = await getAccessToken();
      config.headers.Authorization = `Bearer ${token}`;
      return config;
    } catch (error) {
      if (error.message === 'CORS_ERROR') {
        throw error;
      }
      return config;
    }
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * 设置响应拦截器
 */
petfinderAPI.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      accessToken = null;
      tokenExpiresAt = null;
      
      try {
        const token = await getAccessToken();
        error.config.headers.Authorization = `Bearer ${token}`;
        return petfinderAPI.request(error.config);
      } catch (retryError) {
        return Promise.reject(retryError);
      }
    }
    return Promise.reject(error);
  }
);
/**
 * 转换 Petfinder API 返回的宠物数据格式
 * @param {Object} animal - Petfinder API返回的单个宠物数据
 * @returns {Object} - 转换后的标准格式宠物数据
 */
const transformPetfinderAnimal = (animal) => {
  if (!animal) return null;
  
  // 使用新的文本处理工具来处理描述
  let description = '';
  
  // 检查 description 字段是否存在且不为空
  if (animal.description && animal.description.trim() !== '') {
    // 使用 textUtils 验证和清理描述，确保完整保留
    description = validateDescription(animal.description);
    console.log(`宠物 ${animal.name} 描述长度: ${description.length}字符`);
  }
  
  // 如果没有描述，才尝试从其他属性构建一个描述
  if (!description || description.trim() === '') {
    const traits = [];
    
    if (animal.attributes?.spayed_neutered) traits.push('已绝育');
    if (animal.attributes?.house_trained) traits.push('已家庭训练');
    if (animal.attributes?.declawed) traits.push('已除爪');
    if (animal.attributes?.special_needs) traits.push('需特殊照顾');
    if (animal.attributes?.shots_current) traits.push('疫苗已接种');
    
    let builtDescription = `${animal.name} 是一只${animal.age || ''}${animal.gender ? ' ' + animal.gender : ''}的${animal.breeds?.primary || '未知品种'}`;
    
    if (traits.length > 0) {
      builtDescription += `\n\n特点：${traits.join('、')}`;
    }
    
    // 环境适应性
    const environments = [];
    if (animal.environment?.children === true) environments.push('适合有孩子的家庭');
    if (animal.environment?.dogs === true) environments.push('可以和狗相处');
    if (animal.environment?.cats === true) environments.push('可以和猫相处');
    
    if (environments.length > 0) {
      builtDescription += `\n\n环境适应性：${environments.join('、')}`;
    }
    
    // 添加联系信息
    builtDescription += `\n\n如果您有兴趣领养${animal.name}，请联系收容所了解更多信息。`;
    
    description = builtDescription;
  }
  
  // 构建标签
  const tags = [];
  
  // 从品种添加标签
  if (animal.breeds?.primary) tags.push(animal.breeds.primary);
  if (animal.breeds?.secondary) tags.push(animal.breeds.secondary);
  
  // 从年龄和性别添加标签
  if (animal.age) tags.push(animal.age);
  if (animal.gender) tags.push(animal.gender);
  
  // 从颜色添加标签
  if (animal.colors?.primary) tags.push(animal.colors.primary);
  
  // 从环境偏好添加标签
  if (animal.environment?.children === true) tags.push('适合有孩子的家庭');
  if (animal.environment?.dogs === true) tags.push('喜欢狗');
  if (animal.environment?.cats === true) tags.push('喜欢猫');
  
  // 从特征添加标签
  if (animal.attributes?.spayed_neutered) tags.push('已绝育');
  if (animal.attributes?.house_trained) tags.push('已家庭训练');
  
  // 确保返回的标签不重复且不为空
  const uniqueTags = [...new Set(tags)].filter(tag => tag);
  
  // 格式化联系方式
  const contact = {
    email: animal.contact?.email || null,
    phone: animal.contact?.phone || null,
    address: animal.contact?.address || null
  };
  
  // 获取主图片
  const image = animal.photos && animal.photos.length > 0 
    ? animal.photos[0].medium || animal.photos[0].small || animal.photos[0].large 
    : null;
  
  // 获取所有图片
  const images = animal.photos && animal.photos.length > 0 
    ? animal.photos.map(photo => photo.medium || photo.small || photo.large)
    : [];
  
  // 从标签中提取性格特点
  const personalityTags = animal.tags || [];
  
  // 返回标准化的宠物数据
  return {
    id: animal.id,
    name: animal.name || '未命名宠物',
    type: animal.type || '未知类型',
    breed: animal.breeds?.primary || '未知品种',
    age: animal.age || '未知年龄',
    gender: animal.gender || '未知性别',
    size: animal.size || '未知大小',
    description: description, // 使用完整的处理后描述
    // 保存原始描述，便于调试
    rawDescription: animal.description || '',
    location: animal.contact?.address?.city 
      ? `${animal.contact.address.city}, ${animal.contact.address.state || ''}`
      : (animal.organization_id || '未知地区'),
    image: image,
    images: images,
    fallbackImage: 'https://via.placeholder.com/300x300?text=No+Image',
    url: animal.url,
    status: animal.status,
    published_at: animal.published_at,
    tags: uniqueTags.slice(0, 6), // 限制标签数量
    personalityTags: personalityTags,
    contact: contact,
    adoptionCenter: animal.organization || animal.organization_id || 'Petfinder',
    viewCount: Math.floor(Math.random() * 200) + 50, // 模拟数据
    favoriteCount: Math.floor(Math.random() * 30) + 5, // 模拟数据
    popularity: Math.floor(Math.random() * 100), // 模拟数据
    source: 'petfinder',
    postedDate: animal.published_at ? new Date(animal.published_at) : new Date(),
    // 添加额外属性，帮助调试
    descriptionLength: description.length,
    originalDescriptionLength: animal.description ? animal.description.length : 0
  };
};

/**
 * 转换香港 SPCA 数据格式
 */
const transformSpcaData = (pet) => {
  const emoji = getAnimalEmoji(pet.type || 'default');
  const fallbackImage = generateFallbackImage(emoji, pet.name, 'SPCA Hong Kong');

  // 处理年龄显示
  let ageDisplay = pet.age || '未知';
  if (pet.birthDate) {
    const birthYear = parseInt(pet.birthDate.split('-')[0]);
    const currentYear = new Date().getFullYear();
    const yearsDiff = currentYear - birthYear;
    ageDisplay = `${yearsDiff}歲 (${pet.age || '成年'})`;
  }

  // 处理性别和绝育状态
  let genderDisplay = pet.gender || '未知';
  if (pet.spayed) {
    genderDisplay += '(已絕育)';
  }

  // 使用 textUtils 处理完整的描述信息
  let fullDescription = '';
  
  if (pet.aboutMe || pet.originalAboutMe) {
    // 使用新的文本处理工具
    const aboutMeContent = pet.aboutMe || pet.originalAboutMe;
    fullDescription = formatSPCAAboutMe(aboutMeContent);
  } else {
    // 使用现有描述或生成默认描述
    fullDescription = validateDescription(pet.description) || `${pet.name}正在香港愛護動物協會等待領養`;
  }

  // 添加基本信息到描述中
  if (pet.center && pet.center !== '香港愛護動物協會') {
    fullDescription += `\n\n現時位置: ${pet.center}`;
  }

  // 添加微晶片信息
  if (pet.microchip) {
    fullDescription += `\n晶片號碼: ${pet.microchip}`;
  }

  // 添加摄入信息
  if (pet.intake) {
    fullDescription += `\n摄入方式: ${pet.intake}`;
  }

  return {
    id: `spca_${pet.id || Math.random().toString(36).substr(2, 9)}`,
    originalId: pet.code,
    name: pet.name || '可愛寵物',
    breed: pet.breed || '混血',
    age: ageDisplay,
    size: pet.size || '中型',
    gender: genderDisplay,
    type: pet.type || pet.species || '未知',
    location: `${pet.location || '香港'}${pet.center ? ` - ${pet.center}` : ''}`,
    image: (pet.images && pet.images.length > 0) ? pet.images[0] : (pet.image || fallbackImage),
    images: pet.images || (pet.image ? [pet.image] : []),
    fallbackImage,
    emoji,
    description: fullDescription, // 使用完整的处理后描述
    tags: pet.tags || [...(pet.personalityTags || []), '待領養', 'SPCA'],
    status: pet.status || 'adoptable',
    healthStatus: pet.health || '健康',
    vaccinated: pet.vaccinated !== false,
    spayed: pet.spayed || false,
    houseTrained: pet.houseTrained !== false,
    specialNeeds: pet.specialNeeds || false,
    goodWithChildren: pet.goodWithChildren !== false,
    goodWithDogs: pet.goodWithDogs !== false,
    goodWithCats: pet.goodWithCats !== false,
    contact: {
      phone: pet.contact?.phone || "+852 2232 5529",
      email: pet.contact?.email || "adoption@spca.org.hk",
      address: pet.contact?.address || "香港灣仔謝斐道5號"
    },
    organization: {
      id: 'spca',
      name: '香港愛護動物協會',
      url: pet.detailUrl || 'https://www.spca.org.hk'
    },
    photos: pet.images || [],
    videos: pet.videos || [],
    publishedAt: pet.publishedAt || new Date().toISOString(),
    popularity: Math.floor(Math.random() * 100) + 1,
    viewCount: Math.floor(Math.random() * 500) + 50,
    favoriteCount: Math.floor(Math.random() * 100) + 10,
    adoptionCenter: pet.center || '香港愛護動物協會',
    postedDate: new Date(pet.publishedAt || Date.now()),
    source: 'spca',
    
    // 新增字段
    birthDate: pet.birthDate,
    microchip: pet.microchip,
    personalityTags: pet.personalityTags || [],
    center: pet.center,
    intake: pet.intake,
    aboutMe: pet.aboutMe || pet.originalAboutMe, // 保留原始 ABOUT ME 内容
    // 添加描述长度统计
    descriptionLength: fullDescription.length,
    originalAboutMeLength: (pet.aboutMe || pet.originalAboutMe)?.length || 0
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
    
    // 尝试获取现有数据
    let data = [];
    try {
      console.log('📡 正在获取香港 SPCA 数据...');
      const response = await localAPI.get(LOCAL_SERVER_CONFIG.chinaDataUrl);
      data = response.data;
      console.log('✅ 获取到现有数据:', data.length, '条');
    } catch (error) {
      console.log('❌ 获取现有数据失败:', error.message);
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
 * 生成模拟的香港 SPCA 数据
 */
const generateMockSpcaData = () => {
  const mockData = [];
  const names = ['Lucky', 'Bella', 'Max', 'Luna', 'Charlie', 'Daisy', 'Rocky', 'Molly', 'Buddy', 'Coco'];
  const breeds = ['混種犬', '唐狗', '金毛尋回犬', '拉布拉多', '混種貓', '家貓', '英國短毛貓', '波斯貓'];
  const ages = ['幼年', '青年', '成年', '年長'];
  const sizes = ['小型', '中型', '大型'];
  const genders = ['公', '母'];
  const types = ['狗', '貓'];
  
  for (let i = 0; i < 12; i++) {
    const type = types[Math.floor(Math.random() * types.length)];
    const name = names[Math.floor(Math.random() * names.length)];
    const breed = breeds[Math.floor(Math.random() * breeds.length)];
    
    mockData.push({
      id: `spca_mock_${i}`,
      name: `${name}${i > 9 ? i : ''}`,
      breed,
      age: ages[Math.floor(Math.random() * ages.length)],
      size: sizes[Math.floor(Math.random() * sizes.length)],
      gender: genders[Math.floor(Math.random() * genders.length)],
      type,
      location: '香港',
      image: `https://images.unsplash.com/photo-${1500000000000 + i}?w=400&h=400&fit=crop`,
      emoji: type === '狗' ? '🐕' : '🐱',
      description: `${name}是一隻可愛的${breed}，性格溫順，正在香港愛護動物協會等待領養。`,
      tags: ['健康', '已檢查', '已疫苗', '待領養', 'SPCA認證'],
      status: 'adoptable',
      healthStatus: '健康',
      vaccinated: true,
      spayed: Math.random() > 0.5,
      houseTrained: true,
      specialNeeds: false,
      goodWithChildren: true,
      goodWithDogs: Math.random() > 0.5,
      goodWithCats: Math.random() > 0.5,
      contact: {
        phone: '+852 2232 5529',
        email: 'adoption@spca.org.hk'
      },
      organization: {
        id: 'spca',
        name: '香港愛護動物協會',
        url: 'https://www.spca.org.hk'
      },
      photos: [],
      videos: [],
      publishedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      popularity: Math.floor(Math.random() * 100) + 1,
      viewCount: Math.floor(Math.random() * 500) + 50,
      favoriteCount: Math.floor(Math.random() * 100) + 10,
      adoptionCenter: '香港愛護動物協會',
      postedDate: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      source: 'spca'
    });
  }
  
  return mockData;
};

/**
 * 模拟数据生成器
 */
const generateMockPets = (count = 10, filters = {}) => {
  const mockPets = [];
  const names = ['Luna', 'Max', 'Bella', 'Charlie', 'Rocky', 'Daisy', 'Cooper', 'Sadie', 'Tucker', 'Maggie'];
  const dogBreeds = ['Labrador Retriever', 'Golden Retriever', 'German Shepherd', 'French Bulldog', 'Bulldog'];
  const catBreeds = ['Domestic Shorthair', 'Persian', 'Maine Coon', 'Siamese', 'Ragdoll'];
  const ages = ['Baby', 'Young', 'Adult', 'Senior'];
  const sizes = ['Small', 'Medium', 'Large', 'Extra Large'];
  const genders = ['Male', 'Female'];
  const cities = ['New York, NY', 'Los Angeles, CA', 'Chicago, IL', 'Houston, TX', 'Phoenix, AZ'];
  const types = ['Dog', 'Cat'];
  
  for (let i = 0; i < count; i++) {
    const petType = types[Math.floor(Math.random() * types.length)];
    const breed = petType === 'Dog' ? 
      dogBreeds[Math.floor(Math.random() * dogBreeds.length)] :
      catBreeds[Math.floor(Math.random() * catBreeds.length)];
    
    const emoji = getAnimalEmoji(petType);
    const name = names[Math.floor(Math.random() * names.length)];
    const fallbackImage = generateFallbackImage(emoji, name, 'Mock Data');
    
    const pet = {
      id: `mock_${i + 1}`,
      originalId: i + 1,
      name,
      breed,
      age: ages[Math.floor(Math.random() * ages.length)],
      size: sizes[Math.floor(Math.random() * sizes.length)],
      gender: genders[Math.floor(Math.random() * genders.length)],
      type: petType,
      location: cities[Math.floor(Math.random() * cities.length)],
      image: Math.random() > 0.3 ? 
        `https://images.unsplash.com/photo-${1550000000000 + i}?w=400&h=400&fit=crop` : 
        fallbackImage,
      fallbackImage,
      emoji,
      description: `${name} is a wonderful ${petType.toLowerCase()} looking for a loving home!`,
      tags: ['Friendly', 'House Trained', 'Good with Kids'].slice(0, Math.floor(Math.random() * 3) + 1),
      status: 'adoptable',
      healthStatus: 'Healthy',
      vaccinated: Math.random() > 0.3,
      spayed: Math.random() > 0.4,
      houseTrained: Math.random() > 0.2,
      specialNeeds: Math.random() > 0.8,
      goodWithChildren: Math.random() > 0.3,
      goodWithDogs: Math.random() > 0.4,
      goodWithCats: Math.random() > 0.6,
      contact: {
        email: 'contact@shelter.com',
        phone: '555-123-4567',
        address: {
          city: cities[Math.floor(Math.random() * cities.length)].split(',')[0],
          state: cities[Math.floor(Math.random() * cities.length)].split(',')[1]?.trim()
        }
      },
      organization: {
        id: `org${i + 1}`,
        url: 'https://example.com'
      },
      photos: [],
      videos: [],
      publishedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      popularity: Math.floor(Math.random() * 100) + 1,
      viewCount: Math.floor(Math.random() * 1000) + 100,
      favoriteCount: Math.floor(Math.random() * 200) + 50,
      adoptionCenter: 'Local Animal Shelter',
      postedDate: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      source: 'mock'
    };
    
    mockPets.push(pet);
  }
  
  // 应用筛选条件
  return mockPets.filter(pet => {
    if (filters.type && filters.type !== 'all' && pet.type.toLowerCase() !== filters.type.toLowerCase()) {
      return false;
    }
    if (filters.breed && !pet.breed.toLowerCase().includes(filters.breed.toLowerCase())) {
      return false;
    }
    if (filters.age && pet.age !== filters.age) {
      return false;
    }
    if (filters.size && pet.size !== filters.size) {
      return false;
    }
    if (filters.gender && pet.gender !== filters.gender) {
      return false;
    }
    if (filters.location && !pet.location.toLowerCase().includes(filters.location.toLowerCase())) {
      return false;
    }
    return true;
  });
};

/**
 * 获取可领养宠物信息（合并多个数据源）
 */
export const fetchAdoptablePets = async (filters = {}, page = 1, limit = 50) => {
  try {
    console.log('正在获取可领养宠物数据，筛选条件:', filters, '页码:', page, '每页:', limit);
    
    const promises = [];
    
    // 获取 Petfinder 数据
    promises.push(fetchPetfinderPets(filters, page, Math.ceil(limit * 0.6)));
    
    // 获取香港 SPCA 数据
    promises.push(fetchSpcaData());
    
    // 并行获取数据
    const results = await Promise.allSettled(promises);
    
    let allPets = [];
    
    // 处理 Petfinder 数据
    if (results[0].status === 'fulfilled') {
      allPets = allPets.concat(results[0].value);
    }
    
    // 处理香港 SPCA 数据
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
      
      allPets = allPets.concat(filteredSpcaData);
    }
    
    // 如果没有数据，使用模拟数据
    if (allPets.length === 0) {
      console.log('没有获取到真实数据，使用模拟数据...');
      allPets = generateMockPets(limit, filters);
    }
    
    // 随机打乱顺序
    allPets = allPets.sort(() => Math.random() - 0.5);
    
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
 * 获取 Petfinder 数据 - 通过后端代理
 */
const fetchPetfinderPets = async (filters = {}, page = 1, limit = 20) => {
  try {
    console.log('正在从 Petfinder API 获取数据...');
    
    // 获取访问令牌
    const token = await getAccessToken();
    
    // 准备查询参数
    const params = {
      status: 'adoptable',
      limit: limit,
      page: page,
      sort: 'recent',
      token: token // 添加令牌作为参数
    };

    // 添加筛选条件
    if (filters.type && filters.type !== 'all') {
      params.type = filters.type;
    }
    if (filters.breed) {
      params.breed = filters.breed;
    }
    if (filters.age) {
      params.age = filters.age;
    }
    if (filters.size) {
      params.size = filters.size;
    }
    if (filters.gender) {
      params.gender = filters.gender;
    }
    if (filters.location) {
      params.location = filters.location;
    }

    // 通过后端代理发送请求
    const response = await localAPI.get('/api/petfinder/animals', { params });
    
    console.log('成功获取 Petfinder API 数据:', response.data.animals?.length || 0, '条记录');
    
    const pets = response.data.animals?.map(transformPetfinderAnimal) || [];
    
    return pets;
  } catch (error) {
    console.error('获取 Petfinder 数据失败:', error);
    return [];
  }
};

/**
 * 获取热门宠物列表
 */
export const fetchPopularPets = async (limit = 10) => {
  try {
    console.log('正在获取热门宠物...');
    
    const result = await fetchAdoptablePets({}, 1, limit * 2);
    const pets = result.pets;
    
    // 按人气排序
    const popularPets = pets.sort((a, b) => b.popularity - a.popularity).slice(0, limit);
    
    return popularPets;
  } catch (error) {
    console.error('获取热门宠物失败:', error);
    
    const mockPets = generateMockPets(limit)
      .sort((a, b) => b.popularity - a.popularity);
    
    return mockPets;
  }
};

/**
 * 获取宠物类型列表
 */
export const fetchPetTypes = async () => {
  try {
    console.log('正在获取宠物类型列表...');
    
    const response = await petfinderAPI.get(PETFINDER_API_CONFIG.typesUrl);
    
    // 添加中文类型
    const chineseTypes = [
      { name: '狗', nameEn: 'Dog' },
      { name: '猫', nameEn: 'Cat' },
      { name: '兔子', nameEn: 'Rabbit' },
      { name: '鸟', nameEn: 'Bird' },
      { name: '其他', nameEn: 'Other' }
    ];
    
    const combinedTypes = [
      ...response.data.types,
      ...chineseTypes
    ];
    
    return combinedTypes;
  } catch (error) {
    console.error('获取宠物类型列表失败:', error);
    
    // 返回默认类型
    return [
      { name: 'Dog' },
      { name: 'Cat' },
      { name: 'Rabbit' },
      { name: 'Small & Furry' },
      { name: 'Horse' },
      { name: 'Bird' },
      { name: 'Scales, Fins & Other' },
      { name: 'Barnyard' },
      { name: '狗' },
      { name: '猫' },
      { name: '兔子' },
      { name: '鸟' },
      { name: '其他' }
    ];
  }
};

/**
 * 根据宠物ID获取详细信息
 */
export const fetchPetById = async (petId) => {
  try {
    console.log('正在获取宠物详细信息:', petId);
    
    // 判断数据源
    if (petId.startsWith('petfinder_')) {
      const originalId = petId.replace('petfinder_', '');
      const response = await petfinderAPI.get(`${PETFINDER_API_CONFIG.animalsUrl}/${originalId}`);
      return transformPetfinderAnimal(response.data.animal);
    } else if (petId.startsWith('spca_')) {
      // 从香港 SPCA 数据中查找
      const spcaData = await fetchSpcaData();
      const pet = spcaData.find(p => p.id === petId);
      return pet || generateMockPets(1)[0];
    } else {
      // 模拟数据
      const mockPet = generateMockPets(1)[0];
      mockPet.id = petId;
      return mockPet;
    }
  } catch (error) {
    console.error('获取宠物详细信息失败:', error);
    
    // 返回模拟数据
    const mockPet = generateMockPets(1)[0];
    mockPet.id = petId;
    return mockPet;
  }
};

/**
 * 获取组织信息
 */
export const fetchOrganization = async (organizationId) => {
  try {
    console.log('正在获取组织信息:', organizationId);
    
    if (organizationId === 'spca') {
      return {
        id: 'spca',
        name: '香港愛護動物協會',
        email: 'adoption@spca.org.hk',
        phone: '+852 2232 5529',
        address: {
          city: '香港',
          state: '香港特別行政區',
          postcode: '',
          country: 'HK'
        },
        website: 'https://www.spca.org.hk',
        mission_statement: '致力於防止虐待動物，並促進動物福利',
        adoption: {
          policy: '我們致力為動物尋找最合適的家庭',
          url: 'https://www.spca.org.hk/zh-hant/what-we-do/animals-for-adoption/'
        }
      };
    }
    
    const response = await petfinderAPI.get(`${PETFINDER_API_CONFIG.organizationsUrl}/${organizationId}`);
    
    return response.data.organization;
  } catch (error) {
    console.error('获取组织信息失败:', error);
    
    // 返回模拟数据
    return {
      id: organizationId,
      name: 'Local Animal Shelter',
      email: 'contact@shelter.com',
      phone: '555-123-4567',
      address: {
        city: 'Sample City',
        state: 'CA',
        postcode: '12345',
        country: 'US'
      },
      website: 'https://example.com',
      mission_statement: 'Dedicated to finding loving homes for animals in need.',
      adoption: {
        policy: 'We welcome all potential adopters and work to match pets with the right families.',
        url: 'https://example.com/adopt'
      }
    };
  }
};

/**
 * 搜索宠物
 */
export const searchPets = async (query, filters = {}, page = 1, limit = 50) => {
  try {
    console.log('正在搜索宠物:', query, filters, '页码:', page);
    
    // 将搜索词添加到筛选条件中
    const searchFilters = {
      ...filters,
      query: query
    };
    
    return await fetchAdoptablePets(searchFilters, page, limit);
  } catch (error) {
    console.error('搜索宠物失败:', error);
    
    // 使用模拟数据进行搜索
    const mockPets = generateMockPets(limit, filters);
    
    if (query) {
      const filteredPets = mockPets.filter(pet => 
        pet.name.toLowerCase().includes(query.toLowerCase()) ||
        pet.breed.toLowerCase().includes(query.toLowerCase()) ||
        pet.description.toLowerCase().includes(query.toLowerCase())
      );
      
      return {
        pets: filteredPets,
        pagination: {
          currentPage: page,
          totalCount: filteredPets.length,
          hasNextPage: false,
          hasPreviousPage: false
        }
      };
    }
    
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
 * 获取首页展示宠物数据 - 仅使用Petfinder作为数据源以确保稳定性
 */
export const fetchHomePagePets = async (limit = 50) => {
  try {
    console.log('正在获取首页宠物数据，使用Petfinder API...');
    
    // 只从Petfinder获取数据
    const petfinderPets = await fetchPetfinderPets({}, 1, limit);
    
    if (petfinderPets.length === 0) {
      // 如果Petfinder没有数据，使用备用模拟数据
      console.log('⚠️ Petfinder数据为空，使用模拟数据...');
      return generateMockPets(limit);
    }
    
    console.log(`✅ 成功获取首页数据: ${petfinderPets.length}只宠物`);
    return petfinderPets;
  } catch (error) {
    console.error('❌ 获取首页宠物数据失败:', error);
    console.log('使用模拟数据作为备用...');
    return generateMockPets(limit);
  }
};

/**
 * 按地区获取宠物数据
 */
export const fetchPetsByRegion = async (region, limit = 20) => {
  try {
    console.log(`正在获取${region}地区的宠物数据...`);
    
    if (region.toLowerCase() === 'hong kong' || region.toLowerCase() === '香港') {
      // 香港地区 - 使用SPCA爬取数据
      const spcaData = await fetchSpcaData();
      return spcaData.slice(0, limit);
    } else {
      // 其他地区 - 使用Petfinder筛选
      const params = {
        location: region,
        distance: 100, // 100英里范围内
        limit: limit
      };
      
      return await fetchPetfinderPets(params, 1, limit);
    }
  } catch (error) {
    console.error(`❌ 获取${region}地区宠物数据失败:`, error);
    // 返回模拟数据作为备用
    return generateMockPets(limit).map(pet => {
      pet.location = region;
      return pet;
    });
  }
};

/**
 * 获取单个宠物的详细信息
 * @param {string} id - 宠物ID
 * @returns {Promise<Object>} - 宠物详细信息
 */
export const fetchPetfinderPetById = async (id) => {
  try {
    // 获取访问令牌
    const token = await getAccessToken();
    
    // 通过后端代理获取详细信息
    const response = await localAPI.get(`/api/petfinder/animal/${id}`, {
      params: { token }
    });
    
    if (response.data && response.data.animal) {
      console.log('获取到宠物详细信息:', response.data.animal);
      return transformPetfinderAnimal(response.data.animal);
    }
    
    throw new Error('未找到宠物信息');
  } catch (error) {
    console.error(`获取宠物ID: ${id} 详细信息失败:`, error);
    return null;
  }
};

export default {
  fetchAdoptablePets,
  fetchPopularPets,
  fetchPetById,
  fetchPetTypes,
  fetchOrganization,
  searchPets
};