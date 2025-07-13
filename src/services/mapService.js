// src/services/mapService.js
// 高德地图API集成服务

const AMAP_CONFIG = {
  key: process.env.REACT_APP_AMAP_KEY || '52418d9cff9ca02089028f5861d11696',
  baseUrl: 'https://restapi.amap.com/v3',
  webServiceUrl: 'https://restapi.amap.com/v3'
};

/**
 * 获取用户当前位置
 */
export const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('浏览器不支持地理定位'));
      return;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
      },
      (error) => {
        console.error('定位失败:', error);
        reject(error);
      },
      options
    );
  });
};

/**
 * 根据IP获取位置
 */
export const getLocationByIP = async () => {
  try {
    const response = await fetch(`${AMAP_CONFIG.webServiceUrl}/ip?key=${AMAP_CONFIG.key}`);
    const data = await response.json();
    
    if (data.status === '1' && data.rectangle) {
      // 解析矩形坐标获取中心点
      const coords = data.rectangle.split(';')[0].split(',');
      return {
        latitude: parseFloat(coords[1]),
        longitude: parseFloat(coords[0]),
        accuracy: 10000,
        city: data.city,
        province: data.province,
        adcode: data.adcode,
        source: 'ip'
      };
    }
    
    throw new Error('IP定位失败');
  } catch (error) {
    console.error('IP定位失败:', error);
    throw error;
  }
};

/**
 * 生成静态地图URL
 */
export const generateStaticMapUrl = (options = {}) => {
  const {
    location = '116.397428,39.90923',
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

  // 基础参数
  params.push(`key=${AMAP_CONFIG.key}`);
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
 * 搜索附近宠物相关场所
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
      const url = `${AMAP_CONFIG.webServiceUrl}/place/around?key=${AMAP_CONFIG.key}&location=${longitude},${latitude}&keywords=${encodeURIComponent(keyword)}&radius=${radius}&offset=20&page=1&extensions=all`;
      
      try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.status === '1' && data.pois && data.pois.length > 0) {
          const formattedPois = data.pois.map(poi => {
            const [lng, lat] = poi.location.split(',').map(Number);
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
              operatingHours: poi.business?.opentime || '营业时间详询',
              phone: poi.tel || '',
              photos: generatePhotos(poi.photos),
              tags: poi.tag && typeof poi.tag === 'string' ? poi.tag.split(';').slice(0, 3) : [],
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
    const url = `${AMAP_CONFIG.webServiceUrl}/place/detail?key=${AMAP_CONFIG.key}&id=${placeId}&extensions=all`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status === '1' && data.pois && data.pois.length > 0) {
      const poi = data.pois[0];
      return {
        id: poi.id,
        name: poi.name,
        address: poi.address,
        phone: poi.tel,
        website: poi.website,
        photos: poi.photos || [],
        rating: generateRating(),
        reviews: generateReviews(),
        operatingHours: poi.business?.opentime || '营业时间详询',
        features: poi.tag ? poi.tag.split(';') : [],
        description: poi.introduction || `${poi.name}是一家专业的宠物服务机构。`,
        price: poi.business?.cost || '',
        parkingType: poi.business?.parking_type || '',
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
    const url = `${AMAP_CONFIG.webServiceUrl}/geocode/geo?key=${AMAP_CONFIG.key}&address=${encodeURIComponent(address)}`;
    const response = await fetch(url);
    const data = await response.json();
    
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
    // 检查API密钥
    if (!AMAP_CONFIG.key || AMAP_CONFIG.key === 'YOUR_AMAP_KEY') {
      console.warn('高德地图API密钥未配置，使用备用方案');
      return await fallbackReverseGeocode(latitude, longitude);
    }

    const url = `${AMAP_CONFIG.webServiceUrl}/geocode/regeo?key=${AMAP_CONFIG.key}&location=${longitude},${latitude}&extensions=all&output=json`;
    
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
      console.warn('高德地图API返回错误:', data.info || '未知错误');
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
 * 搜索地点
 */
export const searchPlaces = async (query, city = '') => {
  try {
    const url = `${AMAP_CONFIG.webServiceUrl}/place/text?key=${AMAP_CONFIG.key}&keywords=${encodeURIComponent(query)}&city=${encodeURIComponent(city)}&offset=20&page=1&extensions=all`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status === '1' && data.pois && data.pois.length > 0) {
      return data.pois.map(poi => {
        const [lng, lat] = poi.location.split(',').map(Number);
        return {
          id: poi.id,
          name: poi.name,
          address: poi.address,
          latitude: lat,
          longitude: lng,
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
 * 输入提示
 */
export const inputTips = async (keywords, city = '') => {
  try {
    const url = `${AMAP_CONFIG.webServiceUrl}/assistant/inputtips?key=${AMAP_CONFIG.key}&keywords=${encodeURIComponent(keywords)}&city=${encodeURIComponent(city)}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status === '1' && data.tips && data.tips.length > 0) {
      return data.tips.map(tip => ({
        id: tip.id,
        name: tip.name,
        district: tip.district,
        adcode: tip.adcode,
        location: tip.location || '',
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

export default {
  getCurrentLocation,
  getLocationByIP,
  generateStaticMapUrl,
  fetchNearbyActivities,
  fetchPlaceDetails,
  geocode,
  reverseGeocode,
  searchPlaces,
  inputTips
};