// src/services/mapService.js
// 模拟地图API集成服务

/**
 * 获取附近宠物活动场所
 * @param {number} latitude - 纬度（默认上海坐标）
 * @param {number} longitude - 经度（默认上海坐标）
 * @param {number} radius - 搜索半径（米）
 * @returns {Promise<Array>} - 附近宠物活动场所列表
 */
export const fetchNearbyActivities = async (latitude = 31.2304, longitude = 121.4737, radius = 5000) => {
    try {
      console.log(`获取附近宠物活动场所，坐标:(${latitude}, ${longitude})，半径:${radius}米`);
      
      // 在实际实现中，我们会查询地图API
      // 这里模拟API响应
      
      // 模拟API请求延迟
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      // 生成模拟附近活动数据
      const mockActivities = generateMockActivities(latitude, longitude, radius);
      
      return mockActivities;
    } catch (error) {
      console.error("获取附近活动时出错:", error);
      throw error;
    }
  };
  
  /**
   * 获取活动详情
   * @param {string} activityId - 活动ID
   * @returns {Promise<Object>} - 活动详情
   */
  export const fetchActivityDetails = async (activityId) => {
    try {
      console.log(`获取活动详情，ID:${activityId}`);
      
      // 模拟API请求延迟
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // 模拟活动详情
      const mockDetail = {
        id: activityId,
        name: "宠物公园示例",
        description: "这是一个专为宠物设计的公园，有专门的活动区域和设施。",
        openHours: "周一至周日 8:00-21:00",
        features: ["宠物饮水区", "宠物游乐设施", "宠物洗澡区", "休息区"],
        photos: [
          "https://source.unsplash.com/400x300/?pet,park,1",
          "https://source.unsplash.com/400x300/?pet,park,2",
          "https://source.unsplash.com/400x300/?pet,park,3"
        ],
        reviews: [
          { user: "用户A", rating: 4.5, comment: "环境很好，我家狗狗很喜欢这里。" },
          { user: "用户B", rating: 5, comment: "设施齐全，周末人有点多。" },
          { user: "用户C", rating: 4, comment: "工作人员很友好，会再来的。" }
        ]
      };
      
      return mockDetail;
    } catch (error) {
      console.error("获取活动详情时出错:", error);
      throw error;
    }
  };
  
  // 生成模拟附近活动数据
  const generateMockActivities = (baseLatitude, baseLongitude, radius) => {
    const activityTypes = [
      { type: "宠物公园", icon: "park" },
      { type: "宠物咖啡厅", icon: "cafe" },
      { type: "宠物医院", icon: "hospital" },
      { type: "宠物用品店", icon: "shop" },
      { type: "宠物训练场", icon: "training" },
      { type: "宠物美容院", icon: "grooming" },
      { type: "宠物友好餐厅", icon: "restaurant" },
      { type: "宠物酒店", icon: "hotel" }
    ];
    
    // 生成15-25个随机活动
    const count = Math.floor(Math.random() * 11) + 15;
    const activities = [];
  
    for (let i = 0; i < count; i++) {
      const randomType = activityTypes[Math.floor(Math.random() * activityTypes.length)];
      
      // 在半径范围内生成随机位置（简化计算，非实际地理测量）
      // 将度转换为大约的米，1度约等于111000米
      const radiusDegrees = radius / 111000;
      const randomLat = baseLatitude + (Math.random() - 0.5) * radiusDegrees * 2;
      const randomLng = baseLongitude + (Math.random() - 0.5) * radiusDegrees * 2;
      
      // 计算模拟距离（不准确，仅用于显示）
      const latDiff = baseLatitude - randomLat;
      const lngDiff = baseLongitude - randomLng;
      const distanceKm = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff) * 111;
      
      activities.push({
        id: i + 1,
        name: getRandomActivityName(randomType.type),
        type: randomType.type,
        icon: randomType.icon,
        latitude: randomLat,
        longitude: randomLng,
        distance: `${distanceKm.toFixed(1)}km`,
        rating: (Math.random() * 1.5 + 3.5).toFixed(1), // 3.5-5.0
        reviewCount: Math.floor(Math.random() * 200) + 5,
        address: getRandomAddress(),
        operatingHours: getRandomHours(),
        image: `https://source.unsplash.com/300x200/?${randomType.type.includes("咖啡") ? "cafe,pet" : randomType.type.includes("公园") ? "park,dog" : "pet," + randomType.type}`,
        events: Math.random() > 0.7 ? generateRandomEvents() : [] // 30% 概率有活动
      });
    }
  
    // 根据距离排序
    return activities.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));
  };
  
  // 生成随机活动名称
  const getRandomActivityName = (type) => {
    const prefixes = ["快乐", "阳光", "萌宠", "爱心", "宠趣", "毛孩", "宠乐", "乐宠", "宠爱", "汪汪", "喵星", "宠悦"];
    const suffixes = {
      "宠物公园": ["公园", "乐园", "花园", "绿地", "草坪", "活动区"],
      "宠物咖啡厅": ["咖啡", "猫咪馆", "宠物馆", "休闲屋", "宠物角", "下午茶"],
      "宠物医院": ["医院", "诊所", "医疗中心", "健康中心", "兽医院"],
      "宠物用品店": ["用品店", "商店", "精品店", "百货", "宠物屋"],
      "宠物训练场": ["训练中心", "学校", "俱乐部", "培训所", "训练营"],
      "宠物美容院": ["美容店", "造型屋", "SPA中心", "美容院", "造型店"],
      "宠物友好餐厅": ["餐厅", "小厨", "西餐厅", "料理", "美食屋"],
      "宠物酒店": ["酒店", "寄养中心", "之家", "旅馆", "度假村"]
    };
    
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const suffix = suffixes[type][Math.floor(Math.random() * suffixes[type].length)];
    
    return `${prefix}${suffix}`;
  };
  
  // 生成随机地址
  const getRandomAddress = () => {
    const districts = ["浦东新区", "黄浦区", "静安区", "徐汇区", "长宁区", "普陀区", "虹口区", "杨浦区", "宝山区", "闵行区"];
    const roads = ["中山路", "人民大道", "南京路", "淮海路", "陆家嘴路", "世纪大道", "延安路", "长宁路", "天山路", "梅陇路"];
    const numbers = Math.floor(Math.random() * 500) + 1;
    
    return `上海市${districts[Math.floor(Math.random() * districts.length)]}${roads[Math.floor(Math.random() * roads.length)]}${numbers}号`;
  };
  
  // 生成随机营业时间
  const getRandomHours = () => {
    const openHour = Math.floor(Math.random() * 4) + 8; // 8-11
    const closeHour = Math.floor(Math.random() * 4) + 18; // 18-21
    
    return `${openHour}:00-${closeHour}:00`;
  };
  
  // 生成随机活动
  const generateRandomEvents = () => {
    const eventNames = [
      "宠物领养日", "犬类训练课程", "宠物健康讲座", "狗狗社交派对", 
      "猫咪摄影展", "宠物主题市集", "兽医咨询日", "宠物美容展示"
    ];
    
    const eventCount = Math.floor(Math.random() * 3) + 1; // 1-3个活动
    const events = [];
    
    for (let i = 0; i < eventCount; i++) {
      // 生成未来30天内的随机日期
      const eventDate = new Date();
      eventDate.setDate(eventDate.getDate() + Math.floor(Math.random() * 30) + 1);
      
      events.push({
        id: i + 1,
        name: eventNames[Math.floor(Math.random() * eventNames.length)],
        date: eventDate.toISOString().split('T')[0],
        time: `${Math.floor(Math.random() * 8) + 10}:00-${Math.floor(Math.random() * 4) + 16}:00`,
        description: "来参加我们的特别活动，与其他宠物爱好者交流互动。"
      });
    }
    
    return events;
  };