// src/services/mapService.js
// 高德地图API集成服务

const AMAP_CONFIG = {
  // 静态地图API密钥（Web服务API）
  staticKey: process.env.REACT_APP_AMAP_STATIC_KEY || '52418d9cff9ca02089028f5861d11696',
  
  // 动态地图API密钥（JS API）
  dynamicKey: process.env.REACT_APP_AMAP_DYNAMIC_KEY || 'a765f2076d4d2d2e18ff9688fdd6d445',
  
  // 安全密钥（仅动态地图使用）
  securityJsCode: process.env.REACT_APP_AMAP_SECURITY_CODE || 'f18b1ad59c7860dda3b7bbd679ec265c',
  
  baseUrl: 'https://restapi.amap.com/v3',
  webServiceUrl: 'https://restapi.amap.com/v3'
};

/**
 * 检查定位权限
 */
export const checkLocationPermission = async () => {
  if ('permissions' in navigator) {
    try {
      const permission = await navigator.permissions.query({name: 'geolocation'});
      console.log('🔐 定位权限状态:', permission.state);
      
      return {
        state: permission.state,
        granted: permission.state === 'granted',
        denied: permission.state === 'denied',
        prompt: permission.state === 'prompt'
      };
    } catch (error) {
      console.warn('无法查询定位权限:', error);
      return {
        state: 'unknown',
        granted: false,
        denied: false,
        prompt: true
      };
    }
  }
  
  return {
    state: 'unsupported',
    granted: false,
    denied: false,
    prompt: true
  };
};

/**
 * 获取用户当前位置 - 优化版本
 */
export const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('浏览器不支持地理定位'));
      return;
    }

    console.log('🔍 开始获取用户位置...');

    const options = {
      enableHighAccuracy: true,
      timeout: 10000, // 减少超时时间
      maximumAge: 10000 // 减少缓存时间，获取更新的位置
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        console.log('✅ GPS定位成功:', { latitude, longitude, accuracy });
        
        // 如果精度太低，提示用户
        if (accuracy > 100) {
          console.warn('⚠️ GPS定位精度较低:', accuracy + '米');
        }
        
        resolve({
          latitude,
          longitude,
          accuracy,
          source: 'gps'
        });
      },
      (error) => {
        console.error('❌ GPS定位失败:', error);
        let errorMessage = '定位失败';
        
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = '用户拒绝了定位权限请求';
            console.log('💡 提示：请在浏览器中允许定位权限');
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = '位置信息不可用';
            break;
          case error.TIMEOUT:
            errorMessage = '定位请求超时';
            break;
          default:
            errorMessage = '未知的定位错误';
            break;
        }
        
        reject(new Error(errorMessage));
      },
      options
    );
  });
};

/**
 * 获取最佳位置 - 多重定位策略
 */
export const getBestLocation = async () => {
  try {
    // 首先检查权限
    const permission = await checkLocationPermission();
    
    if (permission.denied) {
      console.log('🚫 定位权限被拒绝，使用IP定位');
      return await getLocationByIP();
    }
    
    // 尝试GPS定位
    console.log('🛰️ 尝试GPS定位...');
    const gpsLocation = await getCurrentLocation();
    
    // 如果GPS精度太低，尝试重新获取
    if (gpsLocation.accuracy > 100) {
      console.log('🔄 GPS精度较低，尝试重新获取...');
      
      try {
        await new Promise(resolve => setTimeout(resolve, 2000));
        const retryLocation = await getCurrentLocation();
        
        if (retryLocation.accuracy < gpsLocation.accuracy) {
          console.log('✅ 重新获取成功，精度提升');
          return retryLocation;
        }
      } catch (retryError) {
        console.warn('重试GPS定位失败:', retryError);
      }
    }
    
    return gpsLocation;
    
  } catch (error) {
    console.log('🌐 GPS定位失败，使用IP定位:', error.message);
    return await getLocationByIP();
  }
};


/**
 * 高德地图IP定位 - 优化版本
 */
export const getLocationByIP = async () => {
  try {
    console.log('🌐 开始高德地图IP定位...');
    
    // 检查API密钥
    if (!AMAP_CONFIG.staticKey || AMAP_CONFIG.staticKey === 'YOUR_AMAP_KEY') {
      throw new Error('高德地图API密钥未配置');
    }
    
    const url = `${AMAP_CONFIG.webServiceUrl}/ip?key=${AMAP_CONFIG.staticKey}`;
    console.log('🔗 IP定位请求URL:', url);
    
    const response = await fetch(url);
    const data = await response.json();
    
    console.log('📡 高德IP定位响应:', data);
    
    if (data.status === '1' && data.rectangle) {
      // 解析矩形坐标获取中心点
      const coords = data.rectangle.split(';')[0].split(',');
      const result = {
        latitude: parseFloat(coords[1]),
        longitude: parseFloat(coords[0]),
        accuracy: 3000, // IP定位精度
        city: data.city || '未知城市',
        province: data.province || '未知省份',
        adcode: data.adcode || '',
        country: '中国',
        source: 'ip_amap'
      };
      
      console.log('✅ 高德IP定位成功:', result);
      return result;
    }
    
    // 处理高德API错误
    if (data.infocode) {
      const errorMessages = {
        '10001': 'API密钥无效',
        '10002': 'API密钥过期',
        '10003': '访问已超出日配额',
        '10004': '访问过于频繁',
        '10005': 'IP白名单错误',
        '10009': '请求key与绑定平台不符',
        '10012': '服务不支持https请求',
        '10013': '权限不足，服务请求被拒绝',
        '20001': '请求参数非法',
        '20002': '缺少必填参数',
        '20003': '请求协议非法',
        '20011': '请求IP非法',
        '20012': '请求内容非法'
      };
      
      const errorMsg = errorMessages[data.infocode] || `未知错误 (${data.infocode})`;
      throw new Error(`高德IP定位失败: ${errorMsg}`);
    }
    
    throw new Error('IP定位返回数据格式错误');
    
  } catch (error) {
    console.error('❌ 高德IP定位失败:', error);
    
    // 使用备用IP定位服务
    try {
      console.log('🔄 尝试备用IP定位服务...');
      return await fallbackIPLocation();
    } catch (fallbackError) {
      console.error('❌ 备用IP定位也失败:', fallbackError);
      throw new Error('所有IP定位服务均失败');
    }
  }
};


/**
 * 备用IP定位服务
 */
const fallbackIPLocation = async () => {
  try {
    // 使用免费的IP定位服务
    const response = await fetch('https://ipapi.co/json/');
    
    if (!response.ok) {
      throw new Error(`请求失败: ${response.status}`);
    }
    
    const data = await response.json();
    
    return {
      latitude: data.latitude,
      longitude: data.longitude,
      accuracy: 5000,
      city: data.city || '未知城市',
      province: data.region || '未知省份',
      country: data.country_name || '未知国家',
      source: 'ip_fallback'
    };
    
  } catch (error) {
    console.error('备用IP定位失败:', error);
    
    // 最后的备用方案 - 使用另一个免费服务
    try {
      const response = await fetch('https://api.bigdatacloud.net/data/ip-geolocation?localityLanguage=zh');
      const data = await response.json();
      
      return {
        latitude: data.location.latitude,
        longitude: data.location.longitude,
        accuracy: 8000,
        city: data.location.city || '未知城市',
        province: data.location.principalSubdivision || '未知省份',
        country: data.location.countryName || '未知国家',
        source: 'ip_bigdata'
      };
    } catch (finalError) {
      console.error('最终备用IP定位失败:', finalError);
      throw new Error('所有IP定位服务均不可用');
    }
  }
};

/**
 * 生成静态地图URL
 */
export const generateStaticMapUrl = (options = {}) => {
  const {
    location = '121.484968 31.2351',
    zoom = 13,
    size = '400*400',
    scale = 1,
    markers = [],
    labels = [],
    paths = [],
    traffic = 0
  } = options;

  let url = `${AMAP_CONFIG.baseUrl}/staticmap?`;
  const params = [];

  
  // 使用静态地图密钥
  params.push(`key=${AMAP_CONFIG.staticKey}`);
  params.push(`location=${location}`);
  params.push(`zoom=${zoom}`);
  params.push(`size=${size}`);
  params.push(`scale=${scale}`);
  params.push(`traffic=${traffic}`);

  // 标记点
  if (markers.length > 0) {
    const markerStrings = markers.map(marker => {
      const { style = 'mid,0xFF0000,A', locations = [] } = marker;
      return `${style}:${locations.join(';')}`;
    });
    params.push(`markers=${markerStrings.join('|')}`);
  }

  // 标签
  if (labels.length > 0) {
    const labelStrings = labels.map(label => {
      const { 
        content = '标签', 
        font = 0, 
        bold = 0, 
        fontSize = 10, 
        fontColor = '0xFFFFFF', 
        background = '0x5288d8',
        locations = []
      } = label;
      return `${content},${font},${bold},${fontSize},${fontColor},${background}:${locations.join(';')}`;
    });
    params.push(`labels=${labelStrings.join('|')}`);
  }

  // 路径
  if (paths.length > 0) {
    const pathStrings = paths.map(path => {
      const {
        weight = 5,
        color = '0x0000FF',
        transparency = 1,
        fillcolor = '',
        fillTransparency = 0.5,
        locations = []
      } = path;
      return `${weight},${color},${transparency},${fillcolor},${fillTransparency}:${locations.join(';')}`;
    });
    params.push(`paths=${pathStrings.join('|')}`);
  }

  return url + params.join('&');
};

/**
 * 获取附近的宠物活动场所
 */
export const fetchNearbyActivities = async (latitude, longitude, radius = 5000) => {
  try {
    console.log(`获取附近宠物活动场所，坐标:(${latitude}, ${longitude})，半径:${radius}米`);
    
    const petKeywords = [
      '宠物医院',
      '宠物店',
      '宠物美容',
      '宠物公园',
      '宠物咖啡',
      '动物医院',
      '宠物用品店',
      '宠物诊所',
      '宠物训练'
    ];

    const allResults = [];
    
    // 为每个关键词搜索
    for (const keyword of petKeywords) {
      const url = `${AMAP_CONFIG.webServiceUrl}/place/around?key=${AMAP_CONFIG.staticKey}&location=${longitude},${latitude}&keywords=${encodeURIComponent(keyword)}&radius=${radius}&offset=20&page=1&extensions=all`;
      
      try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.status === '1' && data.pois && data.pois.length > 0) {
          const formattedPois = data.pois.map(poi => {
            const [lng, lat] = poi.location.split(',').map(Number);
            
            // 安全处理 poi.tag
            let tags = [];
            if (poi.tag) {
              if (typeof poi.tag === 'string') {
                tags = poi.tag.split(';').filter(tag => tag.trim()).slice(0, 3);
              } else if (Array.isArray(poi.tag)) {
                tags = poi.tag.filter(tag => tag && typeof tag === 'string').slice(0, 3);
              }
            }
            
            // 安全处理 poi.photos
            let photos = [];
            if (poi.photos) {
              if (Array.isArray(poi.photos)) {
                photos = poi.photos.map(photo => {
                  if (typeof photo === 'string') {
                    return photo;
                  } else if (photo && photo.url) {
                    return photo.url;
                  }
                  return null;
                }).filter(Boolean);
              } else if (typeof poi.photos === 'string') {
                photos = poi.photos.split(';').filter(photo => photo.trim());
              }
            }
            
            return {
              id: poi.id,
              name: poi.name,
              type: getActivityType(poi.type, keyword),
              icon: getActivityIcon(poi.type, keyword),
              latitude: lat,
              longitude: lng,
              distance: poi.distance ? `${(poi.distance / 1000).toFixed(1)}km` : '未知',
              rating: generateRating(),
              reviewCount: Math.floor(Math.random() * 200) + 5,
              address: poi.address || `${poi.pname}${poi.cityname}${poi.adname}`,
              operatingHours: (poi.business && poi.business.opentime) || '营业时间详询',
              phone: poi.tel || '',
              photos: photos.length > 0 ? photos : generatePhotos(poi.photos),
              tags: tags,
              typeCode: poi.type,
              pname: poi.pname,
              cityname: poi.cityname,
              adname: poi.adname,
              source: 'amap'
            };
          });
          
          allResults.push(...formattedPois);
        }
      } catch (error) {
        console.error(`搜索 ${keyword} 失败:`, error);
      }
    }

    // 去重和排序
    const uniqueResults = removeDuplicates(allResults);
    return uniqueResults.sort((a, b) => {
      const distanceA = parseFloat(a.distance);
      const distanceB = parseFloat(b.distance);
      if (isNaN(distanceA)) return 1;
      if (isNaN(distanceB)) return -1;
      return distanceA - distanceB;
    }).slice(0, 50);

  } catch (error) {
    console.error('获取附近宠物活动场所失败:', error);
    return generateFallbackData(latitude, longitude, radius);
  }
};

/**
 * 获取POI详细信息
 */
export const fetchPlaceDetails = async (placeId) => {
  try {
    // 使用静态地图密钥
    const url = `${AMAP_CONFIG.webServiceUrl}/place/detail?key=${AMAP_CONFIG.staticKey}&id=${placeId}&extensions=all`;
    const response = await fetch(url);
    const data = await response.json();
    
    console.log('🔍 POI详情响应:', data);
    
    if (data.status === '1' && data.pois && data.pois.length > 0) {
      const poi = data.pois[0];
      
      // 安全处理 poi.tag
      let features = [];
      if (poi.tag) {
        if (typeof poi.tag === 'string') {
          features = poi.tag.split(';').filter(tag => tag.trim());
        } else if (Array.isArray(poi.tag)) {
          features = poi.tag.filter(tag => tag && typeof tag === 'string');
        }
      }
      
      // 安全处理 poi.photos
      let photos = [];
      if (poi.photos) {
        if (Array.isArray(poi.photos)) {
          photos = poi.photos.map(photo => {
            if (typeof photo === 'string') {
              return photo;
            } else if (photo && photo.url) {
              return photo.url;
            }
            return null;
          }).filter(Boolean);
        } else if (typeof poi.photos === 'string') {
          photos = poi.photos.split(';').filter(photo => photo.trim());
        }
      }
      
      // 安全处理营业时间
      let operatingHours = '营业时间详询';
      if (poi.business && poi.business.opentime) {
        operatingHours = poi.business.opentime;
      } else if (poi.business && poi.business.open_time) {
        operatingHours = poi.business.open_time;
      }
      
      return {
        id: poi.id,
        name: poi.name,
        address: poi.address,
        phone: poi.tel || '',
        website: poi.website || '',
        photos: photos,
        rating: generateRating(),
        reviews: generateReviews(),
        operatingHours: operatingHours,
        features: features,
        description: poi.introduction || `${poi.name}是一家专业的宠物服务机构。`,
        price: (poi.business && poi.business.cost) || '',
        parkingType: (poi.business && poi.business.parking_type) || '',
        indoor: poi.indoor_map === '1'
      };
    }
    
    throw new Error('获取POI详情失败');
    
  } catch (error) {
    console.error('获取POI详情失败:', error);
    return generateMockPlaceDetails(placeId);
  }
};

/**
 * 地理编码 - 地址转坐标
 */
export const geocode = async (address) => {
  try {
    console.log('🌐 地理编码:', address);
    
    // 使用静态地图密钥
    const url = `${AMAP_CONFIG.webServiceUrl}/geocode/geo?key=${AMAP_CONFIG.staticKey}&address=${encodeURIComponent(address)}`;
    const response = await fetch(url);
    const data = await response.json();
    
    console.log('🌐 地理编码API响应:', data);
    
    if (data.status === '1' && data.geocodes && data.geocodes.length > 0) {
      const result = data.geocodes[0];
      const [lng, lat] = result.location.split(',').map(Number);
      return {
        latitude: lat,
        longitude: lng,
        formatted_address: result.formatted_address,
        province: result.province,
        city: result.city,
        district: result.district,
        township: result.township,
        neighborhood: result.neighborhood,
        building: result.building,
        adcode: result.adcode,
        level: result.level
      };
    }
    
    throw new Error('地理编码失败');
    
  } catch (error) {
    console.error('地理编码失败:', error);
    throw error;
  }
};

/**
 * 逆地理编码 - 坐标转地址
 */
export const reverseGeocode = async (latitude, longitude) => {
  try {
    // 检查静态地图API密钥
    if (!AMAP_CONFIG.staticKey || AMAP_CONFIG.staticKey === 'YOUR_AMAP_KEY') {
      console.warn('高德地图静态API密钥未配置，使用备用方案');
      return await fallbackReverseGeocode(latitude, longitude);
    }

    const url = `${AMAP_CONFIG.webServiceUrl}/geocode/regeo?key=${AMAP_CONFIG.staticKey}&location=${longitude},${latitude}&extensions=all&output=json`;
    
    console.log('逆地理编码请求URL:', url);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    console.log('逆地理编码响应:', data);
    
    if (data.status === '1' && data.regeocode) {
      const regeocode = data.regeocode;
      return {
        formatted_address: regeocode.formatted_address,
        province: regeocode.addressComponent.province,
        city: regeocode.addressComponent.city,
        district: regeocode.addressComponent.district,
        township: regeocode.addressComponent.township,
        neighborhood: regeocode.addressComponent.neighborhood?.name || '',
        building: regeocode.addressComponent.building?.name || '',
        adcode: regeocode.addressComponent.adcode,
        roads: regeocode.roads || [],
        pois: regeocode.pois || []
      };
    } else {
      // 如果高德API返回错误，使用备用方案
      
      if (data.infocode === '10009') {
        console.error('高德地图API密钥平台不匹配 - 请检查控制台配置');
      } else if (data.infocode === '10001') {
        console.error('高德地图API密钥无效');
      } else if (data.infocode === '10004') {
        console.error('高德地图API访问过于频繁');
      }
      
      console.warn('高德地图API返回错误:', data.info || '未知错误', '错误码:', data.infocode);
      return await fallbackReverseGeocode(latitude, longitude);
    }
    
  } catch (error) {
    console.error('高德地图逆地理编码失败:', error);
    // 使用备用方案
    return await fallbackReverseGeocode(latitude, longitude);
  }
};



/**
 * 备用逆地理编码方案
 */
const fallbackReverseGeocode = async (latitude, longitude) => {
  try {
    // 使用免费的BigDataCloud API
    const response = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=zh-CN`
    );
    
    if (!response.ok) {
      throw new Error(`备用API请求失败: ${response.status}`);
    }
    
    const data = await response.json();
    
    return {
      formatted_address: data.localityInfo?.administrative?.[0]?.name || `${data.city || data.locality || '未知'}, ${data.principalSubdivision || '未知'}`,
      province: data.principalSubdivision || '未知',
      city: data.city || data.locality || '未知',
      district: data.localityInfo?.administrative?.[1]?.name || '未知',
      township: data.localityInfo?.administrative?.[2]?.name || '',
      neighborhood: '',
      building: '',
      adcode: '',
      roads: [],
      pois: []
    };
    
  } catch (error) {
    console.error('备用逆地理编码也失败:', error);
    // 返回基本信息
    return {
      formatted_address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
      province: '未知',
      city: '未知',
      district: '未知',
      township: '',
      neighborhood: '',
      building: '',
      adcode: '',
      roads: [],
      pois: []
    };
  }
};

/**
 * 搜索地点 - 改进版本
 */
export const searchPlaces = async (query, city = '') => {
  try {
    console.log('🔍 搜索地点:', query, '城市:', city);
    
    const url = `${AMAP_CONFIG.webServiceUrl}/place/text?key=${AMAP_CONFIG.staticKey}&keywords=${encodeURIComponent(query)}&city=${encodeURIComponent(city)}&offset=20&page=1&extensions=all`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    console.log('📍 搜索API响应:', data);
    
    if (data.status === '1' && data.pois && data.pois.length > 0) {
      return data.pois.map(poi => {
        const [lng, lat] = poi.location.split(',').map(Number);
        return {
          id: poi.id,
          name: poi.name,
          address: poi.address,
          latitude: lat,
          longitude: lng,
          location: poi.location, // 保留原始location格式
          city: poi.cityname,
          district: poi.adname,
          province: poi.pname,
          type: poi.type,
          typecode: poi.typecode
        };
      });
    }
    
    return [];
    
  } catch (error) {
    console.error('地址搜索失败:', error);
    return [];
  }
};

/**
 * 输入提示 - 改进版本
 */
export const inputTips = async (keywords, city = '') => {
  try {
    console.log('💡 输入提示:', keywords, '城市:', city);
    
    const url = `${AMAP_CONFIG.webServiceUrl}/assistant/inputtips?key=${AMAP_CONFIG.staticKey}&keywords=${encodeURIComponent(keywords)}&city=${encodeURIComponent(city)}&citylimit=true`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    console.log('💡 输入提示API响应:', data);
    
    if (data.status === '1' && data.tips && data.tips.length > 0) {
      return data.tips.map(tip => ({
        id: tip.id,
        name: tip.name,
        district: tip.district,
        adcode: tip.adcode,
        location: tip.location || '', // 确保location字段存在
        address: tip.address,
        typecode: tip.typecode
      }));
    }
    
    return [];
    
  } catch (error) {
    console.error('输入提示失败:', error);
    return [];
  }
};

// 辅助函数
const getActivityType = (poiType, keyword) => {
  const typeMap = {
    '宠物医院': '宠物医院',
    '动物医院': '宠物医院',
    '宠物店': '宠物用品店',
    '宠物用品店': '宠物用品店',
    '宠物美容': '宠物美容院',
    '宠物公园': '宠物公园',
    '宠物咖啡': '宠物咖啡厅',
    '宠物诊所': '宠物医院',
    '宠物训练': '宠物训练场'
  };
  
  return typeMap[keyword] || '宠物服务';
};

const getActivityIcon = (poiType, keyword) => {
  const iconMap = {
    '宠物医院': 'hospital',
    '动物医院': 'hospital',
    '宠物店': 'shop',
    '宠物用品店': 'shop',
    '宠物美容': 'grooming',
    '宠物公园': 'park',
    '宠物咖啡': 'cafe',
    '宠物诊所': 'hospital',
    '宠物训练': 'training'
  };
  
  return iconMap[keyword] || 'service';
};

const removeDuplicates = (results) => {
  const seen = new Set();
  return results.filter(item => {
    const key = `${item.name}-${item.address}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const generateRating = () => {
  return (Math.random() * 1.5 + 3.5).toFixed(1);
};

const generatePhotos = (photos) => {
  if (photos && photos.length > 0) {
    return photos.slice(0, 3).map(photo => photo.url);
  }
  return [
    `https://source.unsplash.com/400x300/?pet,${Math.floor(Math.random() * 1000)}`,
    `https://source.unsplash.com/400x300/?animal,${Math.floor(Math.random() * 1000)}`,
    `https://source.unsplash.com/400x300/?veterinary,${Math.floor(Math.random() * 1000)}`
  ];
};

const generateReviews = () => {
  const reviews = [
    { user: "爱宠人士", rating: 4.5, comment: "服务很专业，我家宠物很喜欢这里。" },
    { user: "宠物主人", rating: 5, comment: "环境干净，工作人员很友好。" },
    { user: "铲屎官", rating: 4, comment: "价格合理，会推荐给朋友。" },
    { user: "毛孩家长", rating: 4.5, comment: "医生很有经验，设备也很先进。" },
    { user: "爱狗人士", rating: 5, comment: "态度很好，对宠物很温柔。" }
  ];
  return reviews.slice(0, Math.floor(Math.random() * 3) + 1);
};

const generateMockPlaceDetails = (placeId) => {
  return {
    id: placeId,
    name: "宠物友好场所",
    address: "详细地址信息",
    phone: "联系电话",
    website: "",
    photos: generatePhotos(),
    rating: generateRating(),
    reviews: generateReviews(),
    operatingHours: "周一至周日 9:00-18:00",
    features: ["宠物友好", "专业服务", "环境舒适"],
    description: "这是一个宠物友好的场所，提供专业的宠物服务。"
  };
};

const generateFallbackData = (latitude, longitude, radius) => {
  return [
    {
      id: 'fallback-1',
      name: '附近宠物医院',
      type: '宠物医院',
      icon: 'hospital',
      latitude: latitude + 0.001,
      longitude: longitude + 0.001,
      distance: '0.1km',
      rating: '4.5',
      reviewCount: 120,
      address: '附近地址',
      operatingHours: '24小时营业',
      source: 'fallback'
    },
    {
      id: 'fallback-2',
      name: '附近宠物店',
      type: '宠物用品店',
      icon: 'shop',
      latitude: latitude + 0.002,
      longitude: longitude + 0.002,
      distance: '0.2km',
      rating: '4.3',
      reviewCount: 85,
      address: '附近地址',
      operatingHours: '9:00-21:00',
      source: 'fallback'
    }
  ];
};

/**
 * 动态地图辅助函数
 */

/**
 * 创建路径规划
 */
export const createRoute = async (start, end) => {
  try {
    const url = `${AMAP_CONFIG.webServiceUrl}/direction/driving?key=${AMAP_CONFIG.staticKey}&origin=${start.longitude},${start.latitude}&destination=${end.longitude},${end.latitude}&extensions=all`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status === '1' && data.route && data.route.paths.length > 0) {
      const path = data.route.paths[0];
      const steps = path.steps;
      
      // 提取路径坐标
      const coordinates = [];
      steps.forEach(step => {
        const stepCoords = step.polyline.split(';').map(coord => {
          const [lng, lat] = coord.split(',');
          return [parseFloat(lng), parseFloat(lat)];
        });
        coordinates.push(...stepCoords);
      });
      
      return {
        coordinates,
        distance: path.distance,
        duration: path.duration,
        steps: steps.map(step => ({
          instruction: step.instruction,
          distance: step.distance,
          duration: step.duration
        }))
      };
    }
    
    throw new Error('路径规划失败');
  } catch (error) {
    console.error('路径规划失败:', error);
    throw error;
  }
};

/**
 * 批量地理编码
 */
export const batchGeocode = async (addresses) => {
  try {
    const results = [];
    
    for (const address of addresses) {
      const result = await geocode(address);
      results.push(result);
      // 避免请求过快
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return results;
  } catch (error) {
    console.error('批量地理编码失败:', error);
    throw error;
  }
};


// 导出配置供其他模块使用
export const getMapConfig = () => ({
  staticKey: AMAP_CONFIG.staticKey,
  dynamicKey: AMAP_CONFIG.dynamicKey,
  securityJsCode: AMAP_CONFIG.securityJsCode
});

export default {
  getCurrentLocation,
  getLocationByIP,
  generateStaticMapUrl,
  fetchNearbyActivities,
  fetchPlaceDetails,
  geocode,
  reverseGeocode,
  searchPlaces,
  inputTips,
  createRoute,        // 新增
  batchGeocode,        // 新增
  checkLocationPermission,
  getBestLocation
};