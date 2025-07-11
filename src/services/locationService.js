// 位置服务
class LocationService {
    constructor() {
      this.userLocation = null;
      this.adoptionPlatforms = this.initializePlatforms();
    }
  
    // 初始化各地区的领养平台数据
    initializePlatforms() {
      return [
        // 中国大陆地区
        {
          id: 'china_mainland',
          name: '中国大陆',
          region: 'China',
          cities: ['北京', '上海', '广州', '深圳', '杭州', '成都', '重庆', '武汉', '南京', '西安'],
          platforms: [
            {
              id: 'pet_home',
              name: '宠物之家',
              type: 'adoption',
              url: 'https://www.pethome.com.cn',
              description: '国内最大的宠物领养平台',
              contact: {
                phone: '400-123-4567',
                email: 'contact@pethome.com.cn',
                wechat: 'pethome2024'
              },
              logo: '🏠',
              features: ['免费领养', '健康检查', '疫苗接种', '术后护理'],
              crawlable: true
            },
            {
              id: 'ai_chong',
              name: '爱宠网',
              type: 'adoption',
              url: 'https://www.aichong.com',
              description: '专业的宠物救助和领养服务',
              contact: {
                phone: '400-987-6543',
                email: 'rescue@aichong.com',
                qq: '123456789'
              },
              logo: '💖',
              features: ['24小时救助', '专业医疗', '爱心接力', '终身回访'],
              crawlable: true
            },
            {
              id: 'weibo_pet',
              name: '微博宠物',
              type: 'social',
              url: 'https://weibo.com/petrescue',
              description: '微博上的宠物救助信息聚合',
              contact: {
                weibo: '@微博宠物救助',
                hashtag: '#宠物领养#'
              },
              logo: '📱',
              features: ['实时信息', '社交分享', '用户互助', '地区分类'],
              crawlable: false
            }
          ]
        },
        
        // 香港地区
        {
          id: 'hong_kong',
          name: '香港',
          region: 'Hong Kong',
          cities: ['香港'],
          platforms: [
            {
              id: 'spca_hk',
              name: '香港愛護動物協會',
              type: 'adoption',
              url: 'https://www.spca.org.hk',
              description: '香港历史最悠久的动物保护组织',
              contact: {
                phone: '+852 2232 5529',
                email: 'info@spca.org.hk',
                address: '香港灣仔謝斐道5號'
              },
              logo: '🏥',
              features: ['专业医疗', '行为训练', '领养跟进', '教育推广'],
              crawlable: true
            },
            {
              id: 'animals_asia',
              name: '亞洲動物基金',
              type: 'rescue',
              url: 'https://www.animalsasia.org',
              description: '致力于动物福利的国际组织',
              contact: {
                phone: '+852 2791 2225',
                email: 'info@animalsasia.org'
              },
              logo: '🐻',
              features: ['国际标准', '科学救助', '政策倡导', '公众教育'],
              crawlable: true
            }
          ]
        },
        
        // 台湾地区
        {
          id: 'taiwan',
          name: '台湾',
          region: 'Taiwan',
          cities: ['台北', '高雄', '台中', '台南'],
          platforms: [
            {
              id: 'animal_taiwan',
              name: '台灣動物緊急救援小組',
              type: 'rescue',
              url: 'https://www.animals.org.tw',
              description: '台湾地区专业动物救援组织',
              contact: {
                phone: '+886 2 8780 2025',
                email: 'rescue@animals.org.tw',
                line: '@animalrescue'
              },
              logo: '🚑',
              features: ['紧急救援', '医疗照护', '领养媒合', '教育宣导'],
              crawlable: true
            },
            {
              id: 'pet_blog_tw',
              name: '寵物部落',
              type: 'community',
              url: 'https://www.petblog.tw',
              description: '台湾宠物社区和领养信息平台',
              contact: {
                email: 'contact@petblog.tw',
                facebook: 'PetBlogTW'
              },
              logo: '🌐',
              features: ['社区交流', '领养信息', '照护知识', '活动资讯'],
              crawlable: true
            }
          ]
        },
        
        // 美国地区
        {
          id: 'usa',
          name: '美国',
          region: 'USA',
          cities: ['纽约', '洛杉矶', '芝加哥', '旧金山', '华盛顿', '波士顿', '西雅图'],
          platforms: [
            {
              id: 'petfinder',
              name: 'Petfinder',
              type: 'adoption',
              url: 'https://www.petfinder.com',
              description: '北美最大的宠物领养平台',
              contact: {
                phone: '1-800-PETFINDER',
                email: 'info@petfinder.com'
              },
              logo: '🔍',
              features: ['海量数据', '精准匹配', '本地化服务', '专业筛选'],
              crawlable: true
            },
            {
              id: 'adopt_a_pet',
              name: 'Adopt-a-Pet',
              type: 'adoption',
              url: 'https://www.adoptapet.com',
              description: '专业的宠物领养和救助平台',
              contact: {
                phone: '1-800-ADOPT-PET',
                email: 'support@adoptapet.com'
              },
              logo: '💝',
              features: ['免费服务', '快速匹配', '移动应用', '社区支持'],
              crawlable: true
            }
          ]
        },
        
        // 加拿大地区
        {
          id: 'canada',
          name: '加拿大',
          region: 'Canada',
          cities: ['多伦多', '温哥华', '蒙特利尔', '卡尔加里', '渥太华'],
          platforms: [
            {
              id: 'petfinder_ca',
              name: 'Petfinder Canada',
              type: 'adoption',
              url: 'https://www.petfinder.ca',
              description: '加拿大本土宠物领养平台',
              contact: {
                phone: '1-800-PET-FIND',
                email: 'info@petfinder.ca'
              },
              logo: '🍁',
              features: ['双语服务', '地区覆盖', '专业认证', '志愿者网络'],
              crawlable: true
            }
          ]
        },
        
        // 英国地区
        {
          id: 'uk',
          name: '英国',
          region: 'UK',
          cities: ['伦敦', '曼彻斯特', '伯明翰', '利物浦', '爱丁堡'],
          platforms: [
            {
              id: 'rspca',
              name: 'RSPCA',
              type: 'adoption',
              url: 'https://www.rspca.org.uk',
              description: '英国皇家防止虐待动物协会',
              contact: {
                phone: '0300 1234 999',
                email: 'info@rspca.org.uk'
              },
              logo: '👑',
              features: ['历史悠久', '权威认证', '法律支持', '全国覆盖'],
              crawlable: true
            },
            {
              id: 'pets4homes',
              name: 'Pets4Homes',
              type: 'marketplace',
              url: 'https://www.pets4homes.co.uk',
              description: '英国宠物买卖和领养平台',
              contact: {
                phone: '0800 086 2965',
                email: 'support@pets4homes.co.uk'
              },
              logo: '🏡',
              features: ['市场化运作', '价格透明', '品种丰富', '用户评价'],
              crawlable: true
            }
          ]
        }
      ];
    }
  
    // 获取用户位置
    async getUserLocation() {
      try {
        // 尝试使用浏览器的地理位置API
        const position = await this.getCurrentPosition();
        
        // 根据坐标获取地址信息
        const locationInfo = await this.reverseGeocode(position.coords.latitude, position.coords.longitude);
        
        this.userLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          ...locationInfo
        };
        
        return this.userLocation;
      } catch (error) {
        console.error('获取位置失败:', error);
        
        // 如果无法获取精确位置，尝试通过IP获取大概位置
        try {
          const ipLocation = await this.getLocationByIP();
          this.userLocation = ipLocation;
          return this.userLocation;
        } catch (ipError) {
          console.error('IP定位也失败:', ipError);
          return null;
        }
      }
    }
  
    // 获取当前位置（Promise包装）
    getCurrentPosition(options = {}) {
      return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error('浏览器不支持地理位置'));
          return;
        }
  
        const defaultOptions = {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5分钟缓存
        };
  
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          { ...defaultOptions, ...options }
        );
      });
    }
  
    // 反向地理编码（坐标转地址）
    async reverseGeocode(lat, lng) {
      try {
        // 使用免费的地理编码服务
        const response = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=zh-CN`
        );
        
        if (!response.ok) {
          throw new Error('地理编码服务请求失败');
        }
        
        const data = await response.json();
        
        return {
          country: data.countryName || '未知',
          countryCode: data.countryCode || '',
          region: data.principalSubdivision || '未知',
          city: data.city || data.locality || '未知',
          address: data.localityInfo?.administrative?.[0]?.name || '未知',
          formatted: `${data.city || data.locality || '未知'}, ${data.principalSubdivision || '未知'}, ${data.countryName || '未知'}`
        };
      } catch (error) {
        console.error('反向地理编码失败:', error);
        return {
          country: '未知',
          region: '未知',
          city: '未知',
          formatted: '位置未知'
        };
      }
    }
  
    // 通过IP获取位置
    async getLocationByIP() {
      try {
        const response = await fetch('https://ipapi.co/json/');
        
        if (!response.ok) {
          throw new Error('IP定位服务请求失败');
        }
        
        const data = await response.json();
        
        return {
          latitude: data.latitude,
          longitude: data.longitude,
          accuracy: 10000, // IP定位精度较低
          country: data.country_name || '未知',
          countryCode: data.country_code || '',
          region: data.region || '未知',
          city: data.city || '未知',
          formatted: `${data.city || '未知'}, ${data.region || '未知'}, ${data.country_name || '未知'}`,
          source: 'ip'
        };
      } catch (error) {
        console.error('IP定位失败:', error);
        throw error;
      }
    }
  
    // 根据用户位置推荐平台
    getRecommendedPlatforms(userLocation = this.userLocation) {
      if (!userLocation) {
        return [];
      }
  
      const { country, countryCode, region, city } = userLocation;
      
      // 根据国家/地区匹配平台
      const matchedRegions = this.adoptionPlatforms.filter(platformRegion => {
        // 精确匹配国家代码
        if (countryCode) {
          if (countryCode === 'CN' && platformRegion.id === 'china_mainland') return true;
          if (countryCode === 'HK' && platformRegion.id === 'hong_kong') return true;
          if (countryCode === 'TW' && platformRegion.id === 'taiwan') return true;
          if (countryCode === 'US' && platformRegion.id === 'usa') return true;
          if (countryCode === 'CA' && platformRegion.id === 'canada') return true;
          if (countryCode === 'GB' && platformRegion.id === 'uk') return true;
        }
        
        // 模糊匹配国家名称
        const countryLower = country.toLowerCase();
        if (countryLower.includes('china') || countryLower.includes('中国')) {
          return platformRegion.id === 'china_mainland';
        }
        if (countryLower.includes('hong kong') || countryLower.includes('香港')) {
          return platformRegion.id === 'hong_kong';
        }
        if (countryLower.includes('taiwan') || countryLower.includes('台湾')) {
          return platformRegion.id === 'taiwan';
        }
        if (countryLower.includes('united states') || countryLower.includes('america')) {
          return platformRegion.id === 'usa';
        }
        if (countryLower.includes('canada')) {
          return platformRegion.id === 'canada';
        }
        if (countryLower.includes('united kingdom') || countryLower.includes('britain')) {
          return platformRegion.id === 'uk';
        }
        
        return false;
      });
  
      // 如果没有匹配到地区，返回通用推荐
      if (matchedRegions.length === 0) {
        return this.getDefaultRecommendations();
      }
  
      // 提取所有匹配地区的平台
      const allPlatforms = matchedRegions.flatMap(region => 
        region.platforms.map(platform => ({
          ...platform,
          regionName: region.name,
          regionId: region.id,
          distance: this.calculateCityDistance(city, region.cities)
        }))
      );
  
      // 按距离和类型排序
      return allPlatforms.sort((a, b) => {
        // 优先显示领养类型的平台
        if (a.type === 'adoption' && b.type !== 'adoption') return -1;
        if (b.type === 'adoption' && a.type !== 'adoption') return 1;
        
        // 然后按距离排序
        return (a.distance || 999) - (b.distance || 999);
      });
    }
  
    // 计算城市距离（简化版，返回匹配度）
    calculateCityDistance(userCity, regionCities) {
      if (!userCity || !regionCities) return 999;
      
      const userCityLower = userCity.toLowerCase();
      
      // 精确匹配
      for (const city of regionCities) {
        if (city.toLowerCase() === userCityLower) return 0;
      }
      
      // 模糊匹配
      for (const city of regionCities) {
        if (city.toLowerCase().includes(userCityLower) || 
            userCityLower.includes(city.toLowerCase())) {
          return 1;
        }
      }
      
      return 999;
    }
  
    // 获取默认推荐（当无法确定用户位置时）
    getDefaultRecommendations() {
      return [
        // 返回一些通用的国际平台
        {
          id: 'petfinder',
          name: 'Petfinder',
          type: 'adoption',
          url: 'https://www.petfinder.com',
          description: '国际知名宠物领养平台',
          contact: {
            email: 'info@petfinder.com'
          },
          logo: '🔍',
          features: ['全球覆盖', '多语言支持', '专业服务', '免费使用'],
          regionName: '国际',
          regionId: 'international',
          distance: 999
        },
        {
          id: 'adopt_a_pet',
          name: 'Adopt-a-Pet',
          type: 'adoption',
          url: 'https://www.adoptapet.com',
          description: '专业的宠物领养服务',
          contact: {
            email: 'support@adoptapet.com'
          },
          logo: '💝',
          features: ['免费服务', '快速匹配', '移动应用', '社区支持'],
          regionName: '国际',
          regionId: 'international',
          distance: 999
        }
      ];
    }
  
    // 获取特定平台的详细信息
    async getPlatformDetails(platformId) {
      // 在所有地区中查找平台
      for (const region of this.adoptionPlatforms) {
        const platform = region.platforms.find(p => p.id === platformId);
        if (platform) {
          return {
            ...platform,
            regionName: region.name,
            regionId: region.id
          };
        }
      }
      return null;
    }
  
    // 搜索平台
    searchPlatforms(query) {
      const results = [];
      const queryLower = query.toLowerCase();
      
      for (const region of this.adoptionPlatforms) {
        for (const platform of region.platforms) {
          if (platform.name.toLowerCase().includes(queryLower) ||
              platform.description.toLowerCase().includes(queryLower) ||
              platform.features.some(f => f.toLowerCase().includes(queryLower))) {
            results.push({
              ...platform,
              regionName: region.name,
              regionId: region.id
            });
          }
        }
      }
      
      return results;
    }
  
    // 获取用户位置的格式化字符串
    getFormattedLocation(userLocation = this.userLocation) {
      if (!userLocation) return '位置未知';
      return userLocation.formatted || '位置未知';
    }
  
    // 检查是否支持地理位置
    isGeolocationSupported() {
      return 'geolocation' in navigator;
    }
  }
  
  /**
 * 根据地区ID获取对应的平台列表
 * @param {string} regionId - 地区ID，例如'hong_kong'或'usa_new_york'
 * @returns {Array} - 该地区的平台列表
 */
export const getPlatformsByRegion = async (regionId) => {
  try {
    // 使用现有的locationService实例
    const platforms = locationService.adoptionPlatforms;
    
    // 处理复合地区ID (如usa_new_york应该映射到usa地区的纽约城市)
    if (regionId.includes('_')) {
      const [country, city] = regionId.split('_');
      
      // 找到对应国家的地区
      const countryRegion = platforms.find(region => region.id === country);
      
      if (countryRegion) {
        // 格式化城市名称
        const formattedCity = city
          .split('_')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
        
        // 根据城市过滤或标记平台
        return countryRegion.platforms.map(platform => ({
          ...platform,
          regionName: countryRegion.name,
          regionId: countryRegion.id,
          cityFiltered: true,
          city: formattedCity
        }));
      }
    }
    
    // 常规地区ID匹配
    const matchedRegion = platforms.find(region => region.id === regionId);
    
    if (matchedRegion) {
      return matchedRegion.platforms.map(platform => ({
        ...platform,
        regionName: matchedRegion.name,
        regionId: matchedRegion.id
      }));
    }
    
    // 如果没找到，返回空数组
    return [];
    
  } catch (error) {
    console.error('获取地区平台失败:', error);
    return [];
  }
};

/**
 * 获取特定平台的详细信息 - 扩展版本
 * @param {string} platformId - 平台ID
 * @returns {Object} - 平台详细信息
 */
export const getPlatformDetails = async (platformId) => {
  try {
    // 使用现有的方法获取基本信息
    const platformBasic = await locationService.getPlatformDetails(platformId);
    
    if (platformBasic) {
      // 增强平台信息
      return {
        ...platformBasic,
        status: 'active',
        lastUpdated: new Date(),
        petCount: Math.floor(Math.random() * 200) + 50,
        adoptionRate: Math.floor(Math.random() * 40) + 60,
        rating: (Math.random() * 1 + 4).toFixed(1),
        reviews: Math.floor(Math.random() * 500) + 50
      };
    }
    
    return null;
  } catch (error) {
    console.error('获取平台详情失败:', error);
    return null;
  }
};

/**
 * 判断某个平台是否支持数据爬取
 * @param {string} platformId - 平台ID
 * @returns {boolean} - 是否支持爬取
 */
export const isPlatformCrawlable = (platformId) => {
  // 目前只支持香港SPCA的爬取
  return platformId === 'spca_hk';
};



// 创建单例实例
const locationService = new LocationService();


  
export default locationService;