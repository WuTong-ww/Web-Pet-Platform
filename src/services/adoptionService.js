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
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// 令牌管理
let accessToken = null;
let tokenExpiresAt = null;

/**
 * 获取 Petfinder API 访问令牌
 * @returns {Promise<string>} - 访问令牌
 */
const getAccessToken = async () => {
  try {
    // 检查 API 配置
    if (!checkAPIConfig()) {
      throw new Error('API configuration missing');
    }

    // 检查当前令牌是否仍然有效
    if (accessToken && tokenExpiresAt && Date.now() < tokenExpiresAt) {
      return accessToken;
    }

    console.log('正在获取 Petfinder API 访问令牌...');
    
    // 使用 FormData 发送请求
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
    
    // 存储令牌和过期时间
    accessToken = access_token;
    tokenExpiresAt = Date.now() + (expires_in * 1000) - 300000; // 提前5分钟过期
    
    console.log('成功获取 Petfinder API 访问令牌');
    return accessToken;
  } catch (error) {
    console.error('获取 Petfinder API 访问令牌失败:', error);
    
    // 检查是否是 CORS 错误
    if (error.code === 'ERR_NETWORK' || error.message.includes('CORS')) {
      console.warn('检测到 CORS 错误，这在开发环境中很常见。将使用模拟数据。');
      throw new Error('CORS_ERROR');
    }
    
    throw new Error('Failed to get Petfinder API access token');
  }
};

/**
 * 设置请求拦截器，自动添加认证头
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
 * 设置响应拦截器，处理令牌过期
 */
petfinderAPI.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // 令牌过期，清除缓存的令牌
      accessToken = null;
      tokenExpiresAt = null;
      
      try {
        // 重试请求
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
 * 转换 Petfinder API 数据到我们的数据格式
 */
const transformPetfinderAnimal = (animal) => {
  const primaryPhoto = animal.photos && animal.photos.length > 0 
    ? animal.photos[0].medium || animal.photos[0].large || animal.photos[0].full
    : 'https://via.placeholder.com/400x400?text=No+Photo';

  return {
    id: animal.id,
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
    // 模拟一些额外的数据
    popularity: Math.floor(Math.random() * 100) + 1,
    viewCount: Math.floor(Math.random() * 1000) + 100,
    favoriteCount: Math.floor(Math.random() * 200) + 50,
    adoptionCenter: '通过 Petfinder',
    postedDate: new Date(animal.published_at)
  };
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
  
  for (let i = 0; i < count; i++) {
    const petType = Math.random() > 0.5 ? 'Dog' : 'Cat';
    const breed = petType === 'Dog' ? 
      dogBreeds[Math.floor(Math.random() * dogBreeds.length)] :
      catBreeds[Math.floor(Math.random() * catBreeds.length)];
    
    const pet = {
      id: i + 1,
      name: names[Math.floor(Math.random() * names.length)],
      breed,
      age: ages[Math.floor(Math.random() * ages.length)],
      size: sizes[Math.floor(Math.random() * sizes.length)],
      gender: genders[Math.floor(Math.random() * genders.length)],
      type: petType,
      location: cities[Math.floor(Math.random() * cities.length)],
      image: `https://images.unsplash.com/photo-${1550000000000 + i}?w=400&h=400&fit=crop`,
      description: `${names[Math.floor(Math.random() * names.length)]} is a wonderful ${petType.toLowerCase()} looking for a loving home!`,
      tags: ['Friendly', 'House Trained', 'Good with Kids'].slice(0, Math.floor(Math.random() * 3) + 1),
      status: 'adoptable',
      healthStatus: '健康',
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
      postedDate: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
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
 * 获取可领养宠物信息
 */
export const fetchAdoptablePets = async (filters = {}) => {
  try {
    console.log('正在从 Petfinder API 获取可领养宠物，筛选条件:', filters);
    
    // 构建查询参数
    const params = {
      status: 'adoptable',
      limit: 20,
      page: 1,
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
    
    console.log('成功获取 Petfinder API 数据:', response.data);
    
    // 转换数据格式
    const pets = response.data.animals.map(transformPetfinderAnimal);
    
    return pets;
  } catch (error) {
    console.error('获取可领养宠物失败:', error);
    
    // 如果是 CORS 错误或 API 配置问题，使用模拟数据
    if (error.message === 'CORS_ERROR' || error.message.includes('API configuration missing')) {
      console.log('使用模拟数据作为备用...');
      return generateMockPets(20, filters);
    }
    
    // 其他错误也使用模拟数据
    console.log('使用模拟数据作为备用...');
    return generateMockPets(20, filters);
  }
};

/**
 * 获取热门宠物列表
 */
export const fetchPopularPets = async () => {
  try {
    console.log('正在从 Petfinder API 获取热门宠物...');
    
    const params = {
      status: 'adoptable',
      limit: 10,
      page: 1,
      sort: 'recent'
    };

    const response = await petfinderAPI.get(PETFINDER_API_CONFIG.animalsUrl, { params });
    
    // 转换数据格式并按人气排序
    const pets = response.data.animals.map(transformPetfinderAnimal)
      .sort((a, b) => b.popularity - a.popularity);
    
    return pets;
  } catch (error) {
    console.error('获取热门宠物失败:', error);
    
    // 使用模拟数据
    console.log('使用模拟数据作为备用...');
    return generateMockPets(10).sort((a, b) => b.popularity - a.popularity);
  }
};

/**
 * 获取宠物类型列表
 */
export const fetchPetTypes = async () => {
  try {
    console.log('正在获取宠物类型列表...');
    
    const response = await petfinderAPI.get(PETFINDER_API_CONFIG.typesUrl);
    
    return response.data.types;
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
      { name: 'Barnyard' }
    ];
  }
};

/**
 * 根据宠物ID获取详细信息
 */
export const fetchPetById = async (petId) => {
  try {
    console.log('正在获取宠物详细信息:', petId);
    
    const response = await petfinderAPI.get(`${PETFINDER_API_CONFIG.animalsUrl}/${petId}`);
    
    return transformPetfinderAnimal(response.data.animal);
  } catch (error) {
    console.error('获取宠物详细信息失败:', error);
    
    // 返回模拟数据
    return generateMockPets(1)[0];
  }
};

/**
 * 获取组织信息
 */
export const fetchOrganization = async (organizationId) => {
  try {
    console.log('正在获取组织信息:', organizationId);
    
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
        postcode: '12345'
      }
    };
  }
};

export default {
  fetchAdoptablePets,
  fetchPopularPets,
  fetchPetById,
  fetchPetTypes,
  fetchOrganization
};