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

/**
 * 转换 Petfinder API 数据格式 - 修复图片处理和类型错误
 */
const transformPetfinderAnimal = (animal) => {
  const emoji = getAnimalEmoji(animal.type);
  // 修复：确保传递正确的参数类型
  const fallbackImage = generateHighQualityFallbackImage(animal.type, animal.name, animal.id);

  // 处理Petfinder图片
  let processedImages = [];
  let primaryPhoto = fallbackImage;
  
  if (animal.photos && animal.photos.length > 0) {
    // 提取所有有效的图片URL
    processedImages = animal.photos
      .filter(photo => photo && (photo.medium || photo.large || photo.full))
      .map(photo => photo.medium || photo.large || photo.full)
      .filter(url => url && url.startsWith('http'));
    
    if (processedImages.length > 0) {
      primaryPhoto = processedImages[0];
    }
  }

  // 确保至少有一个备用图片
  if (processedImages.length === 0) {
    processedImages = [fallbackImage];
  }

  // 使用改进的描述处理逻辑
  let description = '';
  
  if (animal.description) {
    // 检查描述是否有效
    if (typeof animal.description === 'string' && animal.description.trim().length > 0) {
      const validationResult = validateTextIntegrity(animal.description);
      
      if (validationResult.isValid) {
        description = validationResult.text;
      } else {
        console.warn(`宠物 ${animal.name} 的描述有问题: ${validationResult.reason}`);
        description = formatDescription(animal.description, { 
          petName: animal.name,
          fallback: `${animal.name} is looking for a loving home!`
        });
      }
    } else {
      description = `${animal.name} is looking for a loving home!`;
    }
  } else {
    description = `${animal.name} is looking for a loving home!`;
  }

  // 确保描述不为空
  if (!description || description.trim().length === 0) {
    description = `${animal.name} is looking for a loving home!`;
  }

  // 处理标签 - 增加安全检查
  let tags = [];
  if (animal.tags && Array.isArray(animal.tags)) {
    tags = animal.tags
      .filter(tag => tag && typeof tag === 'string')
      .map(tag => cleanText(tag))
      .filter(tag => tag.length > 0);
  }

  // 去重并限制数量
  const uniqueTags = [...new Set(tags)];

  // 处理品种信息 - 增加安全检查
  let breedText = 'Mixed Breed';
  if (animal.breeds && animal.breeds.primary) {
    breedText = animal.breeds.primary;
    if (animal.breeds.secondary) {
      breedText += ` / ${animal.breeds.secondary}`;
    }
  }

  return {
    id: `petfinder_${animal.id}`,
    originalId: animal.id,
    name: cleanText(animal.name) || 'Unknown Pet',
    breed: cleanText(breedText),
    age: animal.age || 'Unknown',
    size: animal.size || 'Medium',
    gender: animal.gender || 'Unknown',
    type: animal.type || 'Pet',
    location: animal.contact?.address ? 
      `${animal.contact.address.city || ''}, ${animal.contact.address.state || ''}`.replace(/^,\s*|,\s*$/g, '') : 
      '未知地区',
    image: primaryPhoto,
    images: processedImages, // 确保images数组存在
    fallbackImage,
    emoji,
    description: description,
    tags: uniqueTags.slice(0, 8),
    status: animal.status || 'adoptable',
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
 * 转换香港SPCA数据格式 - 修复图片处理和类型检查
 */
const transformSpcaData = (spcaAnimal) => {
  const emoji = getAnimalEmoji(spcaAnimal.type);
  // 修复：确保传递正确的参数类型
  const fallbackImage = generateHighQualityFallbackImage(spcaAnimal.type, spcaAnimal.name, spcaAnimal.code);

  // 处理图片数组
  let processedImages = [];
  let primaryImage = fallbackImage;

  if (spcaAnimal.images && Array.isArray(spcaAnimal.images)) {
    processedImages = spcaAnimal.images.filter(img => img && typeof img === 'string');
  } else if (spcaAnimal.image && typeof spcaAnimal.image === 'string') {
    processedImages = [spcaAnimal.image];
  }

  // 验证和清理图片URL
  const validImages = processedImages.map(img => {
    if (img.startsWith('//')) return 'https:' + img;
    if (img.startsWith('/')) return 'https://www.spca.org.hk' + img;
    if (!img.startsWith('http')) return 'https://www.spca.org.hk/' + img;
    return img;
  }).filter(img => {
    try {
      new URL(img);
      return true;
    } catch (e) {
      return false;
    }
  }).map(img => {
    // 如果是SPCA图片，使用代理
    if (img.includes('spca.org.hk')) {
      return `http://localhost:8080/proxy/image?url=${encodeURIComponent(img)}`;
    }
    return img;
  });

  if (validImages.length > 0) {
    primaryImage = validImages[0];
  } else {
    // 确保至少有一个图片
    validImages.push(fallbackImage);
  }

  return {
    id: spcaAnimal.id,
    originalId: spcaAnimal.code,
    name: cleanText(spcaAnimal.name) || 'Unknown Pet',
    breed: cleanText(spcaAnimal.breed) || 'Mixed Breed',
    age: spcaAnimal.age || 'Unknown',
    size: spcaAnimal.size || 'Medium',
    gender: spcaAnimal.gender || 'Unknown',
    type: spcaAnimal.type || 'Pet',
    location: spcaAnimal.location || '香港',
    image: primaryImage,
    images: validImages, // 确保images数组存在且不为空
    fallbackImage,
    emoji,
    description: cleanText(spcaAnimal.description) || `${spcaAnimal.name} 正在寻找一个充满爱的家庭。`,
    tags: spcaAnimal.tags || ['待領養', '健康檢查', 'SPCA認證'],
    personalityTags: spcaAnimal.personalityTags || ['友善', '可愛'],
    status: spcaAnimal.status || 'adoptable',
    healthStatus: spcaAnimal.healthStatus || '健康',
    vaccinated: spcaAnimal.vaccinated || false,
    spayed: spcaAnimal.spayed || false,
    center: spcaAnimal.center || '香港愛護動物協會',
    contact: spcaAnimal.contact || {
      phone: '+852 2232 5529',
      email: 'adoption@spca.org.hk',
      organization: '香港愛護動物協會'
    },
    publishedAt: spcaAnimal.publishedAt || new Date().toISOString(),
    popularity: Math.floor(Math.random() * 100) + 1,
    viewCount: Math.floor(Math.random() * 500) + 50,
    favoriteCount: Math.floor(Math.random() * 100) + 20,
    adoptionCenter: '香港愛護動物協會',
    postedDate: new Date(spcaAnimal.publishedAt || Date.now()),
    source: 'spca'
  };
};

/**
 * 生成香港SPCA模拟数据
 */
const generateMockSpcaData = () => {
  const mockSpcaData = [
    {
      id: 'spca_mock_1',
      code: '536845',
      name: 'Ruby',
      type: '狗',
      breed: '混種犬',
      age: '成年',
      size: '中型',
      gender: '母',
      location: '香港',
      center: 'Sai Kung Adopt-a-Pet Centre',
      description: 'Ruby是一只温顺的混种犬，性格活泼友善，非常适合家庭饲养。',
      image: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=400&h=400&fit=crop',
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
      breed: '金毛尋回犬',
      age: '青年',
      size: '大型',
      gender: '公',
      location: '香港',
      center: 'Wan Chai Centre',
      description: 'Max是一只活泼的金毛寻回犬，喜欢运动和与人互动。',
      image: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400&h=400&fit=crop',
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
      breed: '家貓',
      age: '青年',
      size: '小型',
      gender: '母',
      location: '香港',
      center: 'Tsing Yi Centre',
      description: 'Whiskers是一只温柔的猫咪，喜欢安静的环境，适合与老人或小孩相处。',
      image: 'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=400&h=400&fit=crop',
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

  return mockSpcaData.map(transformSpcaData);
};

/**
 * 生成模拟宠物数据 - 修复图片处理和类型安全
 */
const generateMockPets = (count = 10, filters = {}) => {
  const mockPets = [];
  const names = ['Lucky', 'Bella', 'Max', 'Luna', 'Charlie', 'Daisy', 'Rocky', 'Molly', 'Buddy', 'Sadie', 'Cooper', 'Lily', 'Tucker', 'Sophie', 'Bear'];
  const dogBreeds = ['Labrador Retriever', 'Golden Retriever', 'German Shepherd', 'Bulldog', 'Beagle', 'Poodle', 'Mixed Breed', 'Border Collie', 'Chihuahua', 'Husky'];
  const catBreeds = ['Domestic Shorthair', 'Persian', 'Siamese', 'Maine Coon', 'British Shorthair', 'Ragdoll', 'Mixed Breed', 'Russian Blue', 'Bengal', 'Abyssinian'];
  const ages = ['Baby', 'Young', 'Adult', 'Senior'];
  const sizes = ['Small', 'Medium', 'Large'];
  const genders = ['Male', 'Female'];
  const locations = ['New York, NY', 'Los Angeles, CA', 'Chicago, IL', 'Houston, TX', 'Phoenix, AZ', 'Philadelphia, PA', 'San Antonio, TX', 'San Diego, CA'];

  for (let i = 0; i < count; i++) {
    let type = 'dog';
    let breeds = dogBreeds;
    
    if (filters.type && filters.type !== 'all') {
      type = filters.type.toLowerCase();
    } else {
      type = Math.random() > 0.6 ? 'cat' : 'dog';
    }
    
    if (type === 'cat') {
      breeds = catBreeds;
    }
    
    const name = names[Math.floor(Math.random() * names.length)];
    const breed = breeds[Math.floor(Math.random() * breeds.length)];
    const age = ages[Math.floor(Math.random() * ages.length)];
    const size = sizes[Math.floor(Math.random() * sizes.length)];
    const gender = genders[Math.floor(Math.random() * genders.length)];
    const location = locations[Math.floor(Math.random() * locations.length)];
    
    const emoji = getAnimalEmoji(type);
    const fallbackImage = generateFallbackImage(emoji, name, 'Mock数据');
    
    // 生成可靠的图片URL - 修复：传递正确的参数类型
    const imageUrl = generateHighQualityFallbackImage(type, name, `mock_${i}`);
    const images = [imageUrl, fallbackImage]; // 确保有多个备用图片

    mockPets.push({
      id: `mock_${Date.now()}_${i}`,
      originalId: `mock_${i}`,
      name: name,
      breed: breed,
      age: age,
      size: size,
      gender: gender,
      type: type,
      location: location,
      image: imageUrl,
      images: images, // 确保images数组存在
      fallbackImage,
      emoji,
      description: `${name} 是一只可爱的${breed}，正在寻找一个充满爱的家庭。这只${type === 'cat' ? '猫咪' : '狗狗'}性格友善，与人相处融洽。`,
      tags: ['友善', '健康', '已接种疫苗', '寻找家庭'],
      status: 'adoptable',
      healthStatus: '健康',
      vaccinated: Math.random() > 0.2,
      spayed: Math.random() > 0.3,
      houseTrained: Math.random() > 0.4,
      goodWithChildren: Math.random() > 0.3,
      goodWithDogs: Math.random() > 0.4,
      goodWithCats: Math.random() > 0.5,
      contact: {
        email: 'adoption@mocksheler.com',
        phone: '(555) 123-4567',
        organization: 'Mock Animal Shelter'
      },
      publishedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      popularity: Math.floor(Math.random() * 100) + 1,
      viewCount: Math.floor(Math.random() * 1000) + 100,
      favoriteCount: Math.floor(Math.random() * 200) + 50,
      adoptionCenter: 'Mock Animal Shelter',
      postedDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      source: 'mock'
    });
  }

  return mockPets;
};

/**
 * 获取 Petfinder 数据 - 使用后端代理
 */
const fetchPetfinderPets = async (filters = {}, page = 1, limit = 20) => {
  try {
    console.log('正在通过后端代理获取 Petfinder API 数据...');
    
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

    const response = await createAuthenticatedRequest(
      `${PETFINDER_API_CONFIG.baseURL}${PETFINDER_API_CONFIG.animalsUrl}`,
      params
    );
    
    console.log('成功获取 Petfinder API 数据:', response.data.animals?.length || 0, '条记录');
    
    if (response.data.animals) {
      const pets = response.data.animals.map(transformPetfinderAnimal);
      return pets;
    }
    
    return [];
  } catch (error) {
    console.error('获取 Petfinder 数据失败:', error);
    return [];
  }
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
 * 获取可领养宠物信息（合并多个数据源）- 优先使用Petfinder数据
 */
export const fetchAdoptablePets = async (filters = {}, page = 1, limit = 50) => {
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
export const fetchHomePagePets = async (limit = 50) => {
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
export const fetchPopularPets = async (limit = 10) => {
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
export const fetchPetById = async (petId) => {
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
export const fetchPetTypes = async () => {
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
export const fetchOrganization = async (organizationId) => {
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
export const searchPets = async (query, filters = {}, page = 1, limit = 20) => {
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
export const fetchPetfinderPetById = async (petId) => {
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
export const fetchPetsByRegion = async (region, limit = 20) => {
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

export default {
  fetchAdoptablePets,
  fetchPopularPets,
  fetchPetById,
  fetchPetTypes,
  fetchOrganization,
  searchPets,
  fetchPetfinderPetById,
  fetchPetsByRegion,
  fetchHomePagePets
};