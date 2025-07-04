import axios from 'axios';

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
 * 安全的 Base64 编码函数
 */
const safeBase64Encode = (str) => {
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
 * 生成SVG格式的备用图片 - 使用 URL 编码替代 Base64
 */
const generateFallbackImage = (emoji, name = 'Pet', subtitle = 'Loading...') => {
    // 清理和限制文本内容
    const safeName = String(name).replace(/[<>&"']/g, '').substring(0, 10);
    const safeSubtitle = String(subtitle).replace(/[<>&"']/g, '').substring(0, 15);
    
    const svgContent = `
      <svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="400" fill="#f8f9fa" stroke="#dee2e6" stroke-width="2"/>
        <text x="200" y="160" font-family="Arial, sans-serif" font-size="120" text-anchor="middle" fill="#6c757d">${emoji}</text>
        <text x="200" y="250" font-family="Arial, sans-serif" font-size="24" text-anchor="middle" fill="#495057">${safeName}</text>
        <text x="200" y="300" font-family="Arial, sans-serif" font-size="16" text-anchor="middle" fill="#6c757d">${safeSubtitle}</text>
      </svg>
    `;
    
    // 使用 URL 编码替代 Base64
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgContent)}`;
  };

/**
 * 获取 Petfinder API 访问令牌
 */
const getAccessToken = async () => {
  try {
    if (!checkAPIConfig()) {
      throw new Error('API configuration missing');
    }

    if (accessToken && tokenExpiresAt && Date.now() < tokenExpiresAt) {
      return accessToken;
    }

    console.log('正在获取 Petfinder API 访问令牌...');
    
    const formData = new FormData();
    formData.append('grant_type', 'client_credentials');
    formData.append('client_id', PETFINDER_API_CONFIG.clientId);
    formData.append('client_secret', PETFINDER_API_CONFIG.clientSecret);

    const response = await axios.post(
      `${PETFINDER_API_CONFIG.baseURL}${PETFINDER_API_CONFIG.tokenUrl}`,
      formData,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    const { access_token, expires_in } = response.data;
    
    accessToken = access_token;
    tokenExpiresAt = Date.now() + (expires_in * 1000) - 300000;
    
    console.log('成功获取 Petfinder API 访问令牌');
    return accessToken;
  } catch (error) {
    console.error('获取 Petfinder API 访问令牌失败:', error);
    
    if (error.code === 'ERR_NETWORK' || error.message.includes('CORS')) {
      console.warn('检测到 CORS 错误，这在开发环境中很常见。将使用模拟数据。');
      throw new Error('CORS_ERROR');
    }
    
    throw new Error('Failed to get Petfinder API access token');
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
 * 转换 Petfinder API 数据格式
 */
const transformPetfinderAnimal = (animal) => {
  const emoji = getAnimalEmoji(animal.type);
  const fallbackImage = generateFallbackImage(emoji, animal.name, 'Photo loading...');

  let primaryPhoto = fallbackImage;
  
  if (animal.photos && animal.photos.length > 0) {
    primaryPhoto = animal.photos[0].medium || animal.photos[0].large || animal.photos[0].full || fallbackImage;
  }

  return {
    id: `petfinder_${animal.id}`,
    originalId: animal.id,
    name: animal.name,
    breed: animal.breeds.primary + (animal.breeds.secondary ? ` / ${animal.breeds.secondary}` : ''),
    age: animal.age,
    size: animal.size,
    gender: animal.gender,
    type: animal.type,
    location: animal.contact?.address ? 
      `${animal.contact.address.city}, ${animal.contact.address.state}` : 
      '未知地区',
    image: primaryPhoto,
    fallbackImage,
    emoji,
    description: animal.description || `${animal.name} is looking for a loving home!`,
    tags: animal.tags || [],
    status: animal.status,
    healthStatus: animal.attributes?.shots_current ? '已接种疫苗' : '健康状况待确认',
    vaccinated: animal.attributes?.shots_current || false,
    spayed: animal.attributes?.spayed_neutered || false,
    houseTrained: animal.attributes?.house_trained || false,
    specialNeeds: animal.attributes?.special_needs || false,
    goodWithChildren: animal.environment?.children || false,
    goodWithDogs: animal.environment?.dogs || false,
    goodWithCats: animal.environment?.cats || false,
    contact: {
      email: animal.contact?.email,
      phone: animal.contact?.phone,
      address: animal.contact?.address
    },
    organization: {
      id: animal.organization_id,
      url: animal.url
    },
    photos: animal.photos || [],
    videos: animal.videos || [],
    publishedAt: animal.published_at,
    popularity: Math.floor(Math.random() * 100) + 1,
    viewCount: Math.floor(Math.random() * 1000) + 100,
    favoriteCount: Math.floor(Math.random() * 200) + 50,
    adoptionCenter: '通过 Petfinder',
    postedDate: new Date(animal.published_at),
    source: 'petfinder'
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

  // 使用完整的描述信息
  let fullDescription = '';
  
  if (pet.aboutMe || pet.originalAboutMe) {
    // 使用原始的 ABOUT ME 内容
    const aboutMeContent = pet.aboutMe || pet.originalAboutMe;
    
    // 分离性格标签行和描述段落
    const lines = aboutMeContent.split('\n').map(line => line.trim()).filter(line => line);
    
    if (lines.length > 0) {
      // 第一行通常是性格标签
      const firstLine = lines[0];
      const personalityPattern = /^[A-Z][a-z]+(?:,\s*[A-Z][a-z]+)*$/;
      
      if (personalityPattern.test(firstLine)) {
        // 如果第一行是性格标签，将其格式化
        fullDescription = `性格特點: ${firstLine}\n\n`;
        
        // 添加剩余的描述段落
        if (lines.length > 1) {
          fullDescription += lines.slice(1).join('\n');
        }
      } else {
        // 如果第一行不是标准的性格标签格式，直接使用完整内容
        fullDescription = aboutMeContent;
      }
    } else {
      fullDescription = aboutMeContent;
    }
  } else {
    // 使用现有描述或生成默认描述
    fullDescription = pet.description || `${pet.name}正在香港愛護動物協會等待領養`;
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
    description: fullDescription, // 使用完整的描述
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
    aboutMe: pet.aboutMe || pet.originalAboutMe // 保留原始 ABOUT ME 内容
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
 * 获取 Petfinder 数据
 */
const fetchPetfinderPets = async (filters = {}, page = 1, limit = 20) => {
  try {
    console.log('正在从 Petfinder API 获取数据...');
    
    const params = {
      status: 'adoptable',
      limit: limit,
      page: page,
      sort: 'recent'
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

    const response = await petfinderAPI.get(PETFINDER_API_CONFIG.animalsUrl, { params });
    
    console.log('成功获取 Petfinder API 数据:', response.data.animals.length, '条记录');
    
    const pets = response.data.animals.map(transformPetfinderAnimal);
    
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

export default {
  fetchAdoptablePets,
  fetchPopularPets,
  fetchPetById,
  fetchPetTypes,
  fetchOrganization,
  searchPets
};