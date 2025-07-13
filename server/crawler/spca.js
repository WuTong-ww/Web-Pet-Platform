const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

// SPCA宠物领养专用配置
const SPCA_CONFIG = {
    baseURL: 'https://www.spca.org.hk',
    searchURL: 'https://www.spca.org.hk/what-we-do/animals-for-adoption/',
    animalDetailPattern: 'https://www.spca.org.hk/what-we-do/animals-for-adoption-details/?code=',
    timeout: 30000,
    retryCount: 3,
    delayBetweenRequests: 2000,
    batchSize: 5,
    scanConfig: {
      startCode: 500000,
      endCode: 599999,
      batchScanSize: 10,
      maxValidCodes: 30,
      quickTimeout: 20000
    }
};

// 爬取状态管理
let crawlState = {
  processedUrls: new Set(),
  validPetUrls: [],
  petCodes: [],
  currentBatch: 0,
  totalBatches: 0,
  isInitialized: false,
  lastInitTime: null,
  scanProgress: 0
};

// 请求配置
const REQUEST_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'zh-TW,zh;q=0.9,en;q=0.8,zh-CN;q=0.7',
    'Accept-Encoding': 'gzip, deflate, br',
    'DNT': '1',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Cache-Control': 'max-age=0'
};

// 创建axios实例
const createAxiosInstance = (timeout) => {
    return axios.create({
      timeout: timeout,
      headers: REQUEST_HEADERS,
      validateStatus: function (status) {
        return status >= 200 && status < 500;
      },
      maxRedirects: 5
    });
};
  
const quickAxios = createAxiosInstance(SPCA_CONFIG.scanConfig.quickTimeout);
const normalAxios = createAxiosInstance(SPCA_CONFIG.timeout);
  
// 延迟函数
const delay = (ms) => {
    console.log(`⏰ 等待 ${ms}ms...`);
    return new Promise(resolve => setTimeout(resolve, ms));
};

// 带重试的请求函数
const retryRequest = async (url, maxRetries = SPCA_CONFIG.retryCount) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 尝试请求 ${url} (第 ${attempt}/${maxRetries} 次)`);
        
        const response = await normalAxios.get(url);
        
        if (response.status === 200 && response.data.length > 500) {
          console.log(`✅ 请求成功: ${url}`);
          return response;
        } else {
          throw new Error(`Invalid response: status=${response.status}, length=${response.data.length}`);
        }
        
      } catch (error) {
        console.log(`❌ 请求失败 (第 ${attempt}/${maxRetries} 次): ${error.message}`);
        
        if (attempt === maxRetries) {
          throw error;
        }
        
        const waitTime = 2000 * attempt;
        await delay(waitTime);
      }
    }
};

// 从SPCA主页面查找真实的宠物代码
const findRealPetCodes = async () => {
  console.log('🔍 从SPCA主页面查找真实宠物代码...');
  
  const foundCodes = new Set();
  
  try {
    const response = await normalAxios.get('https://www.spca.org.hk/');
    const $ = cheerio.load(response.data);
    
    console.log(`📄 主页面加载成功，内容长度: ${response.data.length}`);
    
    $('a[href*="animals-for-adoption-details"]').each((i, link) => {
      const href = $(link).attr('href');
      if (href) {
        const codeMatch = href.match(/[?&]code=(\d+)/);
        if (codeMatch && codeMatch[1]) {
          const code = codeMatch[1];
          if (code.length >= 5 && code.length <= 7) {
            foundCodes.add(code);
            console.log(`✅ 从主页链接找到代码: ${code}`);
          }
        }
      }
    });
    
    if (foundCodes.size < 5) {
      console.log('🔍 主页链接不足，尝试访问领养专页...');
      
      try {
        const adoptionResponse = await normalAxios.get(SPCA_CONFIG.searchURL);
        const adoptionPage = cheerio.load(adoptionResponse.data);
        
        adoptionPage('a[href*="animals-for-adoption-details"]').each((i, link) => {
          const href = adoptionPage(link).attr('href');
          if (href) {
            const codeMatch = href.match(/[?&]code=(\d+)/);
            if (codeMatch && codeMatch[1]) {
              const code = codeMatch[1];
              if (code.length >= 5 && code.length <= 7) {
                foundCodes.add(code);
                console.log(`✅ 从领养页面找到代码: ${code}`);
              }
            }
          }
        });
      } catch (adoptionError) {
        console.log('⚠️ 无法访问领养专页:', adoptionError.message);
      }
    }
    
    const pageContent = response.data;
    const codePatterns = [
      /animals-for-adoption-details\?code=(\d{5,7})/gi,
      /animals-for-adoption-details&code=(\d{5,7})/gi,
      /"code":"(\d{5,7})"/gi,
      /'code':'(\d{5,7})'/gi
    ];
    
    codePatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(pageContent)) !== null) {
        const code = match[1];
        if (code.length >= 5 && code.length <= 7) {
          foundCodes.add(code);
          console.log(`✅ 从页面内容找到代码: ${code}`);
        }
      }
    });
    
    console.log(`📋 从SPCA网站找到 ${foundCodes.size} 个潜在代码`);
    return Array.from(foundCodes);
    
  } catch (error) {
    console.error('❌ 获取SPCA主页失败:', error.message);
    return [];
  }
};

// 初始化爬取状态
const initializeCrawlState = async () => {
  const now = Date.now();
  
  if (crawlState.isInitialized && crawlState.lastInitTime && 
      (now - crawlState.lastInitTime) < 30 * 60 * 1000) {
    console.log('📋 使用缓存的爬取状态');
    return;
  }

  console.log('🚀 初始化香港SPCA宠物爬取状态...');
  
  try {
    let validCodes = [];
    
    console.log('🔍 步骤1: 从主页面查找真实代码...');
    const realCodes = await findRealPetCodes();
    
    if (realCodes.length > 0) {
      console.log(`✅ 直接使用从主页面找到的 ${realCodes.length} 个代码`);
      validCodes = realCodes.slice(0, 20);
    }
    
    const knownCodes = ['595784', '541923', '541413', '529599', '536845', '502501', '545307', '553660', '542966', '549320', '542538'];
    validCodes.push(...knownCodes);
    
    validCodes = [...new Set(validCodes)];
    
    if (validCodes.length === 0) {
      console.log('⚠️ 未找到代码，使用备用代码...');
      validCodes = ['595784', '541923', '541413', '529599', '536845', '502501', '545307', '553660', '542966', '549320', '542538'];
    }
    
    const validUrls = validCodes.map(code => `${SPCA_CONFIG.animalDetailPattern}${code}`);
    
    crawlState.petCodes = validCodes;
    crawlState.validPetUrls = validUrls;
    crawlState.totalBatches = Math.ceil(validCodes.length / SPCA_CONFIG.batchSize);
    crawlState.isInitialized = true;
    crawlState.lastInitTime = now;
    crawlState.scanProgress = 100;
    
    console.log(`📋 初始化完成:`);
    console.log(`   - 有效代码: ${validCodes.length} 个`);
    console.log(`   - 批次数量: ${crawlState.totalBatches}`);
    console.log(`   - 代码列表: ${validCodes.join(', ')}`);
    
  } catch (error) {
    console.error('❌ 初始化失败:', error);
    
    console.log('🎭 使用完全备用方案');
    const emergencyCodes = ['595784', '541923', '541413', '529599', '536845', '502501', '545307', '553660', '542966'];
    
    crawlState.petCodes = emergencyCodes;
    crawlState.validPetUrls = emergencyCodes.map(code => `${SPCA_CONFIG.animalDetailPattern}${code}`);
    crawlState.totalBatches = Math.ceil(emergencyCodes.length / SPCA_CONFIG.batchSize);
    crawlState.isInitialized = true;
    crawlState.lastInitTime = now;
    crawlState.scanProgress = 100;
    
    console.log(`📋 备用初始化完成: ${emergencyCodes.length} 个代码`);
  }
};

// 修复批次逻辑问题
const crawlNextBatch = async () => {
    try {
      if (!crawlState.isInitialized) {
        console.log('🔄 开始初始化爬取状态...');
        await initializeCrawlState();
      }
  
      if (crawlState.currentBatch >= crawlState.totalBatches) {
        console.log(`🏁 所有批次已完成: ${crawlState.currentBatch}/${crawlState.totalBatches}`);
        return {
          success: true,
          pets: [],
          batchInfo: {
            currentBatch: crawlState.currentBatch,
            totalBatches: crawlState.totalBatches,
            isComplete: true,
            message: '所有宠物数据已爬取完成'
          }
        };
      }
  
      const startIndex = crawlState.currentBatch * SPCA_CONFIG.batchSize;
      const endIndex = Math.min(startIndex + SPCA_CONFIG.batchSize, crawlState.petCodes.length);
      const batchCodes = crawlState.petCodes.slice(startIndex, endIndex);
  
      if (batchCodes.length === 0) {
        console.log(`🏁 没有更多代码要处理`);
        return {
          success: true,
          pets: [],
          batchInfo: {
            currentBatch: crawlState.currentBatch,
            totalBatches: crawlState.totalBatches,
            isComplete: true,
            message: '所有宠物数据已爬取完成'
          }
        };
      }
  
      console.log(`📦 爬取第 ${crawlState.currentBatch + 1}/${crawlState.totalBatches} 批次`);
      console.log(`🎯 本批次宠物代码: ${batchCodes.join(', ')}`);
  
      const batchPets = [];
      let successCount = 0;
      let failCount = 0;
      
      for (let i = 0; i < batchCodes.length; i++) {
        const code = batchCodes[i];
        const url = `${SPCA_CONFIG.animalDetailPattern}${code}`;
        
        if (crawlState.processedUrls.has(url)) {
          console.log(`⏭️ 跳过已处理: 代码 ${code}`);
          continue;
        }
        
        try {
          console.log(`🔄 正在处理 ${i + 1}/${batchCodes.length}: ${code}`);
          
          const petData = await extractPetData(code);
          
          if (petData && petData.name && !petData.name.includes(`Pet ${code}`)) {
            batchPets.push(petData);
            crawlState.processedUrls.add(url);
            successCount++;
            console.log(`✅ 成功: ${petData.name} (${petData.type}, ${petData.breed}) - 图片: ${petData.images?.length || 0}`);
          } else {
            failCount++;
            console.log(`❌ 失败: ${code} - 数据不完整，使用模拟数据`);
            const mockData = generateMockPetData(code);
            if (mockData) {
              batchPets.push(mockData);
              crawlState.processedUrls.add(url);
            }
          }
          
        } catch (error) {
          failCount++;
          console.error(`❌ 处理异常，代码: ${code}`, error.message);
          try {
            const mockData = generateMockPetData(code);
            if (mockData) {
              batchPets.push(mockData);
              crawlState.processedUrls.add(url);
            }
          } catch (mockError) {
            console.error(`❌ 生成模拟数据也失败: ${mockError.message}`);
          }
        }
        
        if (i < batchCodes.length - 1) {
          await delay(SPCA_CONFIG.delayBetweenRequests);
        }
      }
  
      crawlState.currentBatch++;
  
      const batchInfo = {
        currentBatch: crawlState.currentBatch,
        totalBatches: crawlState.totalBatches,
        isComplete: crawlState.currentBatch >= crawlState.totalBatches,
        processedCount: crawlState.processedUrls.size,
        totalAvailable: crawlState.petCodes.length,
        successCount,
        failCount,
        message: `第 ${crawlState.currentBatch}/${crawlState.totalBatches} 批次完成，成功 ${successCount}，失败 ${failCount}`
      };
  
      console.log(`🎉 批次完成: 成功 ${successCount}，失败 ${failCount}，总宠物数: ${batchPets.length}`);
  
      return {
        success: true,
        pets: batchPets,
        batchInfo
      };
      
    } catch (error) {
      console.error('❌ 分批爬取失败:', error);
      
      const mockPets = [];
      try {
        for (let i = 0; i < SPCA_CONFIG.batchSize; i++) {
          const mockData = generateMockPetData(`${536840 + i}`);
          if (mockData) {
            mockPets.push(mockData);
          }
        }
      } catch (mockError) {
        console.error('❌ 生成备用数据失败:', mockError.message);
      }
      
      return {
        success: false,
        pets: mockPets,
        batchInfo: {
          currentBatch: crawlState.currentBatch + 1,
          totalBatches: crawlState.totalBatches,
          isComplete: false,
          processedCount: crawlState.processedUrls.size,
          totalAvailable: crawlState.petCodes.length,
          message: '网络问题，返回模拟数据'
        }
      };
    }
};

// 主爬虫函数
const crawlSpcaPets = async (batchMode = true) => {
  console.log('🚀 开始爬取香港SPCA宠物数据...');
  
  try {
    if (batchMode) {
      const result = await crawlNextBatch();
      
      if (result.success && result.pets.length > 0) {
        await saveToFile(result.pets);
        
        return {
          success: true,
          count: result.pets.length,
          totalCount: await getTotalCount(),
          batchInfo: result.batchInfo,
          message: result.batchInfo.message
        };
      } else {
        return {
          success: true,
          count: 0,
          batchInfo: result.batchInfo,
          message: result.batchInfo.message
        };
      }
    }
    
  } catch (error) {
    console.error('❌ 香港SPCA爬取失败:', error);
    
    const mockPets = [];
    for (let i = 0; i < 10; i++) {
      mockPets.push(generateMockPetData(`${536840 + i}`));
    }
    
    await saveToFile(mockPets);
    
    return {
      success: true,
      count: mockPets.length,
      totalCount: await getTotalCount(),
      batchInfo: {
        currentBatch: 1,
        totalBatches: 1,
        isComplete: false,
        processedCount: mockPets.length,
        totalAvailable: 50,
        message: '网络问题，返回模拟宠物数据供演示使用'
      },
      message: '网络问题，返回模拟宠物数据供演示使用'
    };
  }
};

// 保存到文件
const saveToFile = async (newPets) => {
  try {
    const dataFile = path.join(__dirname, '../data/chinaPets.json');
    let existingPets = [];
    
    const dataDir = path.dirname(dataFile);
    if (!fs.existsSync(dataDir)) {
      console.log(`📁 创建数据目录: ${dataDir}`);
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    if (fs.existsSync(dataFile)) {
      try {
        const content = fs.readFileSync(dataFile, 'utf-8');
        existingPets = JSON.parse(content);
        console.log(`📖 读取现有数据: ${existingPets.length} 条记录`);
      } catch (err) {
        console.warn('⚠️ 读取现有数据失败，将创建新文件');
        existingPets = [];
      }
    } else {
      console.log('📄 数据文件不存在，将创建新文件');
    }
    
    const existingIds = new Set(existingPets.map(pet => pet.id));
    const uniqueNewPets = newPets.filter(pet => !existingIds.has(pet.id));
    const allPets = [...existingPets, ...uniqueNewPets];
    
    try {
      fs.writeFileSync(dataFile, JSON.stringify(allPets, null, 2), 'utf-8');
      console.log(`💾 保存成功: 新增 ${uniqueNewPets.length}，总计 ${allPets.length}`);
      console.log(`📁 文件路径: ${dataFile}`);
    } catch (writeError) {
      console.error('❌ 写入文件失败:', writeError.message);
      
      const backupFile = path.join(__dirname, `../chinaPets_backup_${Date.now()}.json`);
      console.log(`🔄 尝试备用路径: ${backupFile}`);
      
      fs.writeFileSync(backupFile, JSON.stringify(allPets, null, 2), 'utf-8');
      console.log(`💾 备用保存成功: ${backupFile}`);
    }
    
  } catch (error) {
    console.error('❌ 保存文件失败:', error.message);
    
    try {
      const tempFile = path.join(__dirname, `../temp_pets_${Date.now()}.json`);
      fs.writeFileSync(tempFile, JSON.stringify(newPets, null, 2), 'utf-8');
      console.log(`🆘 紧急保存到临时文件: ${tempFile}`);
    } catch (tempError) {
      console.error('❌ 连临时文件都无法保存:', tempError.message);
    }
  }
};

// 获取总数
const getTotalCount = async () => {
  try {
    const dataFile = path.join(__dirname, '../data/chinaPets.json');
    if (fs.existsSync(dataFile)) {
      const content = fs.readFileSync(dataFile, 'utf-8');
      const data = JSON.parse(content);
      return data.length;
    }
    return 0;
  } catch (error) {
    return 0;
  }
};

// 重置爬取状态
const resetCrawlState = () => {
  crawlState = {
    processedUrls: new Set(),
    validPetUrls: [],
    petCodes: [],
    currentBatch: 0,
    totalBatches: 0,
    isInitialized: false,
    lastInitTime: null,
    scanProgress: 0
  };
  console.log('🔄 爬取状态已重置');
};

// 获取爬取状态
const getCrawlStatus = () => {
  return {
    isInitialized: crawlState.isInitialized,
    currentBatch: crawlState.currentBatch,
    totalBatches: crawlState.totalBatches,
    processedCount: crawlState.processedUrls.size,
    totalAvailable: crawlState.petCodes.length,
    hasMoreData: crawlState.currentBatch < crawlState.totalBatches,
    nextBatchSize: Math.min(
      SPCA_CONFIG.batchSize, 
      Math.max(0, crawlState.petCodes.length - (crawlState.currentBatch * SPCA_CONFIG.batchSize))
    ),
    petCodes: crawlState.petCodes.slice(0, 10),
    scanProgress: crawlState.scanProgress
  };
};

// 提取宠物名称
const extractPetName = ($, bodyText, code) => {
  const nameSelectors = [
    'h1',
    '.pet-name',
    '.animal-name', 
    '[class*="name"]',
    '.title',
    '[class*="title"]'
  ];
  
  for (const selector of nameSelectors) {
    const nameText = $(selector).first().text().trim();
    if (nameText && nameText.length > 0 && nameText.length < 50) {
      console.log(`📝 从选择器 ${selector} 提取到名称: ${nameText}`);
      return nameText;
    }
  }
  
  const namePatterns = [
    /name[:\s]+([A-Za-z\u4e00-\u9fff]+)/i,
    /名字[:\s]*([A-Za-z\u4e00-\u9fff]+)/i,
    /^([A-Za-z\u4e00-\u9fff]{2,15})\s/m
  ];
  
  for (const pattern of namePatterns) {
    const match = bodyText.match(pattern);
    if (match && match[1] && match[1].length >= 2) {
      console.log(`📝 从文本模式提取到名称: ${match[1]}`);
      return match[1].trim();
    }
  }
  
  console.log(`📝 使用默认名称: Pet ${code}`);
  return `Pet ${code}`;
};

// 提取宠物类型
const extractPetType = ($, bodyText) => {
  console.log('🔍 开始提取宠物类型...');
  
  const typeText = bodyText.toLowerCase();
  
  // 1. 优先查找明确的类型标识
  console.log('🔍 查找明确的类型标识...');
  
  // 查找"I am a xxx"模式中的类型信息
  const iAmTypePatterns = [
    /I am a\s+[A-Za-z\s\(\)]*?\s+(dog|cat|rabbit|bird|reptile|snake|skink)/gi,
    /I'm a\s+[A-Za-z\s\(\)]*?\s+(dog|cat|rabbit|bird|reptile|snake|skink)/gi
  ];
  
  for (const pattern of iAmTypePatterns) {
    const matches = typeText.matchAll(pattern);
    for (const match of matches) {
      if (match && match[1]) {
        const detectedType = match[1].toLowerCase();
        console.log(`📝 从"I am a"模式检测到类型: ${detectedType}`);
        
        switch (detectedType) {
          case 'dog': return 'dog';
          case 'cat': return 'cat';
          case 'rabbit': return 'rabbit';
          case 'bird': return 'bird';
          case 'reptile':
          case 'snake':
          case 'skink': return 'reptile';
        }
      }
    }
  }
  
  // 2. 基于品种信息推断类型
  console.log('🔍 基于品种信息推断类型...');
  
  // 狗的品种关键词
  const dogBreeds = [
    'mongrel', 'golden retriever', 'labrador', 'husky', 'poodle', 'bulldog', 
    'terrier', 'shepherd', 'beagle', 'corgi', 'chihuahua', 'dachshund',
    'pomeranian', 'shih tzu', 'maltese', 'yorkshire', 'jack russell',
    'boxer', 'rottweiler', 'doberman', 'great dane', 'mastiff'
  ];
  
  // 猫的品种关键词
  const catBreeds = [
    'domestic short hair', 'domestic long hair', 'domestic shorthair', 'domestic longhair',
    'persian', 'siamese', 'maine coon', 'british shorthair', 'ragdoll',
    'bengal', 'scottish fold', 'russian blue', 'american shorthair',
    'exotic shorthair', 'abyssinian', 'burmese', 'himalayan'
  ];
  
  // 爬虫类品种关键词
  const reptileBreeds = [
    'sandfish skink', 'skink', 'snake', 'lizard', 'gecko', 'iguana',
    'chameleon', 'bearded dragon', 'turtle', 'tortoise'
  ];
  
  // 检查品种匹配
  for (const breed of dogBreeds) {
    if (typeText.includes(breed)) {
      console.log(`📝 通过品种"${breed}"识别为狗`);
      return 'dog';
    }
  }
  
  for (const breed of catBreeds) {
    if (typeText.includes(breed)) {
      console.log(`📝 通过品种"${breed}"识别为猫`);
      return 'cat';
    }
  }
  
  for (const breed of reptileBreeds) {
    if (typeText.includes(breed)) {
      console.log(`📝 通过品种"${breed}"识别为爬虫`);
      return 'reptile';
    }
  }
  
  // 3. 基于关键词匹配（更严格的规则）
  console.log('🔍 基于关键词匹配...');
  
  // 狗的关键词
  if (typeText.includes('dog') || typeText.includes('canine') || 
      typeText.includes('puppy') || typeText.includes('狗') || 
      typeText.includes('犬') || typeText.includes('小狗')) {
    console.log('📝 通过关键词识别为狗');
    return 'dog';
  }
  
  // 猫的关键词（移除了过于宽泛的'hair'）
  if (typeText.includes('cat') || typeText.includes('feline') || 
      typeText.includes('kitten') || typeText.includes('貓') || 
      typeText.includes('猫') || typeText.includes('小猫')) {
    console.log('📝 通过关键词识别为猫');
    return 'cat';
  }
  
  // 兔子的关键词
  if (typeText.includes('rabbit') || typeText.includes('bunny') || 
      typeText.includes('兔') || typeText.includes('小兔')) {
    console.log('📝 通过关键词识别为兔子');
    return 'rabbit';
  }
  
  // 鸟类的关键词
  if (typeText.includes('bird') || typeText.includes('鳥') || 
      typeText.includes('鸟') || typeText.includes('parrot') || 
      typeText.includes('canary')) {
    console.log('📝 通过关键词识别为鸟类');
    return 'bird';
  }
  
  // 爬虫类的关键词
  if (typeText.includes('skink') || typeText.includes('snake') || 
      typeText.includes('lizard') || typeText.includes('reptile') || 
      typeText.includes('gecko') || typeText.includes('iguana')) {
    console.log('📝 通过关键词识别为爬宠');
    return 'reptile';
  }
  
  console.log('📝 未能识别类型，使用默认值');
  return 'Pet';
};

// 提取品种信息
const extractBreedInfo = ($, bodyText) => {
  console.log('🔍 开始提取品种信息...');
  
  // 2. 新的逻辑：查找BREED前面的文本模式
  console.log('🔍 查找BREED前面的品种信息...');
  
  // 查找 "xxx BREED" 或 "xxx breed" 模式，提取xxx部分
  const breedFrontPatterns = [
    // 匹配 "Golden Retriever BREED" 或 "Mixed BREED"
    /([A-Za-z\s\u4e00-\u9fff]+?)\s+BREED/gi,
    /([A-Za-z\s\u4e00-\u9fff]+?)\s+breed/gi,
    // 匹配编号后面到BREED前面的内容，如 "No.123456 Golden Retriever BREED"
    /no\.\s*\d+\s+([A-Za-z\s\u4e00-\u9fff]+?)\s+BREED/gi,
    /no\.\s*\d+\s+([A-Za-z\s\u4e00-\u9fff]+?)\s+breed/gi,
    // 匹配更宽泛的模式：数字后面到BREED前面的内容
    /\d{5,7}\s+([A-Za-z\s\u4e00-\u9fff]+?)\s+BREED/gi,
    /\d{5,7}\s+([A-Za-z\s\u4e00-\u9fff]+?)\s+breed/gi
  ];
  
  for (const pattern of breedFrontPatterns) {
    const matches = bodyText.matchAll(pattern);
    for (const match of matches) {
      if (match && match[1]) {
        const breed = match[1].trim();
        // 过滤掉明显不是品种的词汇
        const invalidWords = ['animal', 'pet', 'dog', 'cat', 'puppy', 'kitten', 'male', 'female', 'age', 'year', 'month', 'the', 'a', 'an'];
        const breedLower = breed.toLowerCase();
        
        if (breed.length > 1 && breed.length < 30 && 
            !invalidWords.some(word => breedLower === word || breedLower.includes(word + ' '))) {
          console.log(`📝 从BREED前面提取到品种: ${breed}`);
          return breed;
        }
      }
    }
  }
  
  // 3. 尝试查找编号后面但BREED前面的文本
  console.log('🔍 查找编号后面到BREED前面的文本...');
  
  // 分割文本为行，查找包含编号和BREED的行
  const lines = bodyText.split('\n');
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // 查找包含编号和BREED的行
    const breedLinePatterns = [
      /no\.\s*(\d+)\s+(.+?)\s+breed/gi,
      /(\d{5,7})\s+(.+?)\s+breed/gi,
      /code[:\s]*(\d+)\s+(.+?)\s+breed/gi
    ];
    
    for (const pattern of breedLinePatterns) {
      const match = trimmedLine.match(pattern);
      if (match && match[2]) {
        const potentialBreed = match[2].trim();
        
        // 清理品种名称，移除多余的空格和特殊字符
        const cleanedBreed = potentialBreed
          .replace(/\s+/g, ' ')
          .replace(/[^\w\s\u4e00-\u9fff-]/g, '')
          .trim();
        
        if (cleanedBreed.length > 1 && cleanedBreed.length < 30) {
          console.log(`📝 从编号后BREED前提取到品种: ${cleanedBreed}`);
          return cleanedBreed;
        }
      }
    }
  }
  
  // 4. 原有的品种匹配模式（保留作为备用）
  console.log('🔍 使用原有品种匹配模式...');
  
  const breedPatterns = [
    /breed[:\s]+([^,\n]+)/i,
    /品種[:\s]*([^,\n]+)/i,
    // 常见品种名称模式
    /(golden retriever|labrador|husky|poodle|bulldog|terrier|shepherd|混種|mix|domestic|mongrel)/i,
    /(persian|siamese|maine coon|british shorthair|家貓|短毛|長毛|short hair|long hair)/i,
    // 新增更多品种模式
    /(beagle|corgi|chihuahua|dachshund|pomeranian|shih tzu|maltese|yorkshire|jack russell)/i,
    /(ragdoll|bengal|scottish fold|russian blue|american shorthair|exotic shorthair)/i
  ];
  
  for (const pattern of breedPatterns) {
    const match = bodyText.match(pattern);
    if (match && match[1]) {
      const breed = match[1].trim();
      if (breed.length > 0 && breed.length < 30) {
        console.log(`📝 从文本模式提取到品种: ${breed}`);
        return breed;
      }
    }
  }
  
  // 5. 尝试从HTML结构中提取更精确的品种信息
  console.log('🔍 从HTML结构中查找品种信息...');
  
  // 查找可能包含品种信息的HTML元素
  const potentialBreedElements = [
    'td', 'span', 'div', 'p', 'strong', 'b'
  ];
  
  for (const element of potentialBreedElements) {
    $(element).each((i, el) => {
      const text = $(el).text().trim();
      
      // 检查是否包含品种相关关键词
      if (text.toLowerCase().includes('breed') || text.includes('品種')) {
        // 尝试提取品种信息
        const breedMatch = text.match(/([A-Za-z\s\u4e00-\u9fff]+?)\s+(?:breed|品種)/i);
        if (breedMatch && breedMatch[1]) {
          const breed = breedMatch[1].trim();
          if (breed.length > 1 && breed.length < 30) {
            console.log(`📝 从HTML元素提取到品种: ${breed}`);
            return breed;
          }
        }
      }
    });
  }
  
  console.log(`📝 使用默认品种: Unknown`);
  return 'Unknown';
};

// 提取年龄信息 - 修改为提取生日信息
const extractAgeInfo = ($, bodyText) => {
  console.log('🔍 开始提取年龄/生日信息...');
  
  // 1. 优先查找生日信息
  const birthdayPatterns = [
    /my birthday is (\d{4}-\d{2}-\d{2})/i,
    /birthday[:\s]+(\d{4}-\d{2}-\d{2})/i,
    /born[:\s]+(\d{4}-\d{2}-\d{2})/i,
    /birth date[:\s]*(\d{4}-\d{2}-\d{2})/i,
    /生日[:\s]*(\d{4}-\d{2}-\d{2})/i,
    /出生日期[:\s]*(\d{4}-\d{2}-\d{2})/i,
    // 支持不同的日期格式
    /my birthday is (\d{2}\/\d{2}\/\d{4})/i,
    /my birthday is (\d{2}-\d{2}-\d{4})/i,
    /birthday[:\s]+(\d{2}\/\d{2}\/\d{4})/i,
    /birthday[:\s]+(\d{2}-\d{2}-\d{4})/i
  ];
  
  for (const pattern of birthdayPatterns) {
    const match = bodyText.match(pattern);
    if (match && match[1]) {
      const birthday = match[1].trim();
      console.log(`🎂 提取到生日: ${birthday}`);
      
      // 格式化生日显示
      try {
        // 尝试解析日期以验证格式
        let formattedBirthday = birthday;
        
        // 如果是 MM/DD/YYYY 或 DD/MM/YYYY 格式，转换为 YYYY-MM-DD
        if (birthday.includes('/')) {
          const parts = birthday.split('/');
          if (parts.length === 3 && parts[2].length === 4) {
            // 假设是 MM/DD/YYYY 格式
            formattedBirthday = `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
          }
        }
        
        // 如果是 DD-MM-YYYY 格式，转换为 YYYY-MM-DD
        if (birthday.includes('-') && birthday.split('-')[2]?.length === 4) {
          const parts = birthday.split('-');
          if (parts.length === 3 && parts[2].length === 4) {
            formattedBirthday = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
          }
        }
        
        // 验证日期格式
        if (formattedBirthday.match(/^\d{4}-\d{2}-\d{2}$/)) {
          return `生日: ${formattedBirthday}`;
        } else {
          return `生日: ${birthday}`;
        }
      } catch (error) {
        console.log(`⚠️ 生日格式解析失败，使用原始格式: ${birthday}`);
        return `生日: ${birthday}`;
      }
    }
  }
  
  // 2. 如果没有找到生日，尝试查找年龄相关信息
  console.log('🔍 未找到生日信息，查找年龄信息...');
  
  const agePatterns = [
    /age[:\s]+(\d+)\s*(year|years|歲|岁)/i,
    /年齡[:\s]*(\d+)\s*(歲|岁|年)/i,
    /(\d+)\s*(year|years|歲|岁)\s*old/i,
    /(\d+)\s*(個月|月|months?)/i,
    /(puppy|kitten|adult|senior|young|幼|幼犬|幼貓|成年|老年)/i
  ];
  
  for (const pattern of agePatterns) {
    const match = bodyText.match(pattern);
    if (match && match[1]) {
      const age = match[1].trim();
      
      // 处理数字年龄
      if (!isNaN(age)) {
        const ageNum = parseInt(age);
        if (ageNum >= 0 && ageNum <= 20) {
          // 检查是否是月份
          if (bodyText.toLowerCase().includes('month') || 
              bodyText.includes('個月') || 
              bodyText.includes('月')) {
            console.log(`📝 提取到年龄: ${ageNum} 个月`);
            return `${ageNum} 个月`;
          } else {
            console.log(`📝 提取到年龄: ${ageNum} 岁`);
            return `${ageNum} 岁`;
          }
        }
      }
      
      // 处理文字年龄描述
      const ageDescriptions = {
        'puppy': '幼犬',
        'kitten': '幼猫',
        'adult': '成年',
        'senior': '老年',
        'young': '幼年',
        '幼': '幼年',
        '幼犬': '幼犬',
        '幼貓': '幼猫',
        '成年': '成年',
        '老年': '老年'
      };
      
      const ageKey = age.toLowerCase();
      if (ageDescriptions[ageKey]) {
        console.log(`📝 提取到年龄描述: ${ageDescriptions[ageKey]}`);
        return ageDescriptions[ageKey];
      }
      
      if (age.length > 0 && age.length < 20) {
        console.log(`📝 提取到年龄: ${age}`);
        return age;
      }
    }
  }
  
  // 3. 尝试从选择器中提取年龄信息
  console.log('🔍 从HTML选择器查找年龄信息...');
  
  const ageSelectors = [
    '.age',
    '.pet-age',
    '.animal-age',
    '[class*="age"]',
    '[class*="birthday"]',
    '[class*="birth"]'
  ];
  
  for (const selector of ageSelectors) {
    const ageText = $(selector).text().trim();
    if (ageText && ageText.length > 0 && ageText.length < 50) {
      // 检查是否包含生日信息
      if (ageText.includes('-') && ageText.match(/\d{4}-\d{2}-\d{2}/)) {
        console.log(`📝 从选择器 ${selector} 提取到生日: ${ageText}`);
        return `生日: ${ageText}`;
      }
      
      // 检查是否包含年龄信息
      if (ageText.match(/\d+/) || ageText.match(/(puppy|kitten|adult|senior|young|幼|成年|老年)/i)) {
        console.log(`📝 从选择器 ${selector} 提取到年龄: ${ageText}`);
        return ageText;
      }
    }
  }
  
  console.log('📝 未找到年龄信息，使用默认值');
  return 'Unknown';
};

// 提取性别信息
const extractGenderInfo = ($, bodyText) => {
  console.log('🔍 开始提取性别信息...');
  
  // 1. 新的逻辑：查找"I am a xxx(性别) xxx(品种)"模式
  console.log('🔍 查找"I am a xxx(性别) xxx(品种)"格式...');
  
  const iAmPatterns = [
    // 匹配 "I am a Male Golden Retriever" 或 "I am a Female(Spayed) Domestic Cat"
    /I am a\s+([A-Za-z\s\(\)]+?)\s+([A-Za-z\s\u4e00-\u9fff]+)/gi,
    // 匹配 "I'm a Male Golden Retriever" 
    /I'm a\s+([A-Za-z\s\(\)]+?)\s+([A-Za-z\s\u4e00-\u9fff]+)/gi,
    // 匹配 "i am a male golden retriever" (小写)
    /i am a\s+([A-Za-z\s\(\)]+?)\s+([A-Za-z\s\u4e00-\u9fff]+)/gi,
    // 匹配完整句子，更宽泛的模式
    /I am a\s+([A-Za-z\s\(\)]+?)\s+([A-Za-z\s\u4e00-\u9fff]+?)\s+(?:and|who|that|\.|\!)/gi,
    /I'm a\s+([A-Za-z\s\(\)]+?)\s+([A-Za-z\s\u4e00-\u9fff]+?)\s+(?:and|who|that|\.|\!)/gi
  ];
  
  for (const pattern of iAmPatterns) {
    const matches = bodyText.matchAll(pattern);
    for (const match of matches) {
      if (match && match[1] && match[2]) {
        const potentialGender = match[1].trim();
        const potentialBreed = match[2].trim();
        
        console.log(`🔍 从"I am a"模式提取到: 可能性别="${potentialGender}", 可能品种="${potentialBreed}"`);
        
        // 验证第一个词是否是性别词汇
        const validGenders = [
          'male', 'female', 'boy', 'girl', 'man', 'woman', 
          '公', '母', '雄', '雌',
          'male(desexed)', 'female(desexed)', 
          'male(neutered)', 'female(spayed)',
          'male(castrated)', 'female(sterilized)',
          'desexed', 'neutered', 'spayed', 'castrated', 'sterilized'
        ];
        
        const genderLower = potentialGender.toLowerCase();
        
        const isValidGender = validGenders.some(gender => {
          const genderPattern = gender.replace(/[()]/g, '\\$&'); // 转义括号
          return new RegExp(`^${genderPattern}$`, 'i').test(genderLower) || 
                 new RegExp(`^${genderPattern}\\s`, 'i').test(genderLower);
        });
        
        // 验证第二个词是否是品种词汇（排除明显的性别词汇）
        const breedLower = potentialBreed.toLowerCase();
        const isNotGenderWord = !validGenders.some(gender => 
          new RegExp(gender.replace(/[()]/g, '\\$&'), 'i').test(breedLower)
        );
        
        if (isValidGender && isNotGenderWord && 
            potentialGender.length > 0 && potentialGender.length < 30) {
          console.log(`📝 从"I am a"模式提取到性别: ${potentialGender}`);
          return potentialGender; // 直接返回原始文本，保留完整格式
        }
      }
    }
  }
  
  // 2. 原有逻辑：查找BREED后面GENDER前面的文本
  console.log('🔍 查找BREED后面GENDER前面的性别信息...');
  
  // 查找 "BREED xxx GENDER" 或 "breed xxx gender" 模式，提取xxx部分
  const breedToGenderPatterns = [
    // 匹配 "BREED Male(Desexed) GENDER" 或 "breed Female(Spayed) gender"
    /BREED\s+([A-Za-z\s\u4e00-\u9fff\(\)]+?)\s+GENDER/gi,
    /breed\s+([A-Za-z\s\u4e00-\u9fff\(\)]+?)\s+gender/gi,
    // 匹配编号后面的完整结构：如 "No.123456 Golden Retriever BREED Male(Desexed) GENDER"
    /no\.\s*\d+\s+[A-Za-z\s\u4e00-\u9fff]+?\s+BREED\s+([A-Za-z\s\u4e00-\u9fff\(\)]+?)\s+GENDER/gi,
    /no\.\s*\d+\s+[A-Za-z\s\u4e00-\u9fff]+?\s+breed\s+([A-Za-z\s\u4e00-\u9fff\(\)]+?)\s+gender/gi,
    // 匹配更宽泛的模式：数字后面的完整结构
    /\d{5,7}\s+[A-Za-z\s\u4e00-\u9fff]+?\s+BREED\s+([A-Za-z\s\u4e00-\u9fff\(\)]+?)\s+GENDER/gi,
    /\d{5,7}\s+[A-Za-z\s\u4e00-\u9fff]+?\s+breed\s+([A-Za-z\s\u4e00-\u9fff\(\)]+?)\s+gender/gi
  ];
  
  for (const pattern of breedToGenderPatterns) {
    const matches = bodyText.matchAll(pattern);
    for (const match of matches) {
      if (match && match[1]) {
        const genderText = match[1].trim();
        
        // 过滤掉明显不是性别的词汇
        const invalidWords = ['animal', 'pet', 'dog', 'cat', 'puppy', 'kitten', 'age', 'year', 'month', 'breed', 'unknown'];
        const genderLower = genderText.toLowerCase();
        
        // 扩展有效的性别词汇，包括带括号的形式
        const validGenders = [
          'male', 'female', 'boy', 'girl', 'man', 'woman', 
          '公', '母', '雄', '雌',
          'male(desexed)', 'female(desexed)', 
          'male(neutered)', 'female(spayed)',
          'male(castrated)', 'female(sterilized)',
          'desexed', 'neutered', 'spayed', 'castrated', 'sterilized'
        ];
        
        const isValidGender = validGenders.some(gender => {
          const genderPattern = gender.replace(/[()]/g, '\\$&'); // 转义括号
          return new RegExp(genderPattern, 'i').test(genderLower);
        });
        
        if (genderText.length > 0 && genderText.length < 30 && 
            !invalidWords.some(word => genderLower === word || genderLower.includes(word + ' ')) &&
            isValidGender) {
          console.log(`📝 从BREED后GENDER前提取到性别: ${genderText}`);
          return genderText; // 直接返回原始文本，保留完整格式
        }
      }
    }
  }
  
  // 3. 尝试查找编号后面的完整行结构
  console.log('🔍 查找编号后面的完整行结构...');
  
  const lines = bodyText.split('\n');
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // 查找包含编号、BREED和GENDER的行
    const genderLinePatterns = [
      /no\.\s*(\d+)\s+[A-Za-z\s\u4e00-\u9fff]+?\s+breed\s+([A-Za-z\s\u4e00-\u9fff\(\)]+?)\s+gender/gi,
      /(\d{5,7})\s+[A-Za-z\s\u4e00-\u9fff]+?\s+breed\s+([A-Za-z\s\u4e00-\u9fff\(\)]+?)\s+gender/gi,
      /code[:\s]*(\d+)\s+[A-Za-z\s\u4e00-\u9fff]+?\s+breed\s+([A-Za-z\s\u4e00-\u9fff\(\)]+?)\s+gender/gi
    ];
    
    for (const pattern of genderLinePatterns) {
      const match = trimmedLine.match(pattern);
      if (match && match[2]) {
        const potentialGender = match[2].trim();
        
        // 保留括号，只清理不必要的特殊字符
        const cleanedGender = potentialGender
          .replace(/\s+/g, ' ')
          .replace(/[^\w\s\u4e00-\u9fff\(\)]/g, '')
          .trim();
        
        if (cleanedGender.length > 0 && cleanedGender.length < 30) {
          console.log(`📝 从行结构提取到性别: ${cleanedGender}`);
          return cleanedGender; // 直接返回，保留完整格式
        }
      }
    }
  }
  
  // 4. 传统的性别匹配模式（保留作为备用）
  console.log('🔍 使用传统性别匹配模式...');
  
  const genderPatterns = [
    // 扩展模式以匹配带括号的性别信息
    /gender[:\s]+(male\(desexed\)|female\(desexed\)|male\(neutered\)|female\(spayed\)|male\(castrated\)|female\(sterilized\)|male|female|公|母|雄|雌)/i,
    /sex[:\s]+(male\(desexed\)|female\(desexed\)|male\(neutered\)|female\(spayed\)|male|female|公|母|雄|雌)/i,
    /性別[:\s]*(公|母|雄|雌)/i,
    // 直接匹配完整的性别表述
    /(male\(desexed\)|female\(desexed\)|male\(neutered\)|female\(spayed\)|male\(castrated\)|female\(sterilized\))/i,
    /(male|female|公|母|雄|雌)/i
  ];
  
  for (const pattern of genderPatterns) {
    const match = bodyText.match(pattern);
    if (match && match[1]) {
      const genderText = match[1].trim();
      console.log(`📝 从传统模式提取到性别: ${genderText}`);
      return genderText; // 直接返回原始文本
    }
  }
  
  // 5. 尝试从HTML结构中提取性别信息
  console.log('🔍 从HTML结构中查找性别信息...');
  
  const potentialGenderElements = [
    'td', 'span', 'div', 'p', 'strong', 'b'
  ];
  
  for (const element of potentialGenderElements) {
    $(element).each((i, el) => {
      const text = $(el).text().trim();
      
      // 检查是否包含性别相关关键词
      if (text.toLowerCase().includes('gender') || 
          text.toLowerCase().includes('sex') || 
          text.includes('性別')) {
        
        // 尝试提取性别信息，保留括号内容
        const genderMatch = text.match(/([A-Za-z\s\u4e00-\u9fff\(\)]+?)\s+(?:gender|sex|性別)/i);
        if (genderMatch && genderMatch[1]) {
          const genderText = genderMatch[1].trim();
          if (genderText.length > 0 && genderText.length < 30) {
            console.log(`📝 从HTML元素提取到性别: ${genderText}`);
            return genderText; // 直接返回原始文本
          }
        }
      }
    });
  }
  
  console.log('📝 未找到性别信息，使用默认值');
  return 'Unknown';
};

// 提取描述信息
const extractDescription = ($, bodyText) => {
  console.log('🔍 开始提取描述信息...');
  
  // 1. 优先查找"ABOUT ME"到"Facebook Twitter LinkedIn Google + Email"之间的内容
  console.log('🔍 查找"ABOUT ME"到社交媒体链接之间的描述...');
  
  const aboutMeToSocialPatterns = [
    // 匹配完整的ABOUT ME到社交媒体链接的内容
    /ABOUT ME\s*\n?([\s\S]*?)(?=\n?\s*Facebook\s+Twitter\s+LinkedIn\s+Google\s*\+\s*Email|$)/gi,
    // 匹配简化版的社交媒体结尾
    /ABOUT ME\s*\n?([\s\S]*?)(?=\n?\s*Facebook\s+Twitter\s+LinkedIn|$)/gi,
    /ABOUT ME\s*\n?([\s\S]*?)(?=\n?\s*Facebook\s+Twitter|$)/gi,
    // 匹配带冒号的格式
    /ABOUT ME:\s*\n?([\s\S]*?)(?=\n?\s*Facebook\s+Twitter\s+LinkedIn\s+Google\s*\+\s*Email|$)/gi,
    /ABOUT ME:\s*\n?([\s\S]*?)(?=\n?\s*Facebook\s+Twitter\s+LinkedIn|$)/gi,
    // 匹配小写版本
    /about me\s*\n?([\s\S]*?)(?=\n?\s*Facebook\s+Twitter\s+LinkedIn\s+Google\s*\+\s*Email|$)/gi,
    /about me\s*\n?([\s\S]*?)(?=\n?\s*Facebook\s+Twitter\s+LinkedIn|$)/gi,
    /about me:\s*\n?([\s\S]*?)(?=\n?\s*Facebook\s+Twitter\s+LinkedIn\s+Google\s*\+\s*Email|$)/gi,
    // 匹配更宽泛的社交媒体结尾模式
    /ABOUT ME[\s:]*\n?([\s\S]*?)(?=\n?\s*Facebook.*Twitter.*LinkedIn|$)/gi,
    /about me[\s:]*\n?([\s\S]*?)(?=\n?\s*Facebook.*Twitter.*LinkedIn|$)/gi,
    // 匹配包含特征词汇的完整结构
    /ABOUT ME\s*\n?([^]*?)(?=\n?\s*Facebook\s+Twitter\s+LinkedIn\s+Google\s*\+\s*Email|$)/gi,
    /ABOUT ME\s*\n?([^]*?)(?=\n?\s*Facebook\s+Twitter\s+LinkedIn|$)/gi
  ];
  
  for (const pattern of aboutMeToSocialPatterns) {
    const matches = bodyText.matchAll(pattern);
    for (const match of matches) {
      if (match && match[1]) {
        let description = match[1].trim();
        
        console.log(`🔍 从"ABOUT ME"到社交媒体模式提取到原始内容: ${description.substring(0, 100)}...`);
        
        // 检查是否包含特征词汇行（需要从描述中移除）
        const characteristicsPattern = /^(Friendly,?\s*Courageous,?\s*Sophisticated,?\s*Strong|[A-Za-z\s,]+)\s*$/m;
        const characteristicsMatch = description.match(characteristicsPattern);
        
        if (characteristicsMatch) {
          console.log(`🔍 检测到特征词汇行: ${characteristicsMatch[0]}`);
          // 移除特征词汇行，保留后面的实际描述
          description = description.replace(characteristicsMatch[0], '').trim();
        }
        
        // 清理和格式化描述内容
        description = description
          .replace(/\n\s*\n/g, '\n\n') // 规范化段落间距
          .replace(/\n/g, ' ') // 将换行符替换为空格
          .replace(/\s+/g, ' ') // 合并多个空格
          .trim();
        
        // 验证描述长度和质量
        if (description.length >= 30 && description.length <= 2000) {
          // 检查是否包含有意义的内容
          const meaningfulContent = description.match(/[.!?]/g); // 包含句号、感叹号或问号
          const hasPersonalStory = description.toLowerCase().includes('i am') || 
                                  description.toLowerCase().includes('hi,') ||
                                  description.toLowerCase().includes('hello,') ||
                                  description.toLowerCase().includes('my name') ||
                                  description.toLowerCase().includes('i was') ||
                                  description.toLowerCase().includes('i love') ||
                                  description.toLowerCase().includes('please give me');
          
          // 检查是否不只是特征词汇
          const isNotJustCharacteristics = !description.match(/^[A-Za-z\s,]+$/);
          
          if ((meaningfulContent && meaningfulContent.length > 0) || hasPersonalStory || isNotJustCharacteristics) {
            console.log(`📝 从"ABOUT ME"到社交媒体提取到完整描述 (${description.length} 字符)`);
            return description;
          }
        }
      }
    }
  }
  
  // 2. 如果没有找到标准格式，尝试查找"ABOUT ME"后面的内容（原有逻辑保留作为备用）
  console.log('🔍 未找到标准格式，尝试查找"ABOUT ME"后面的内容...');
  
  const aboutMePatterns = [
    // 匹配 "ABOUT ME" 后面的完整内容，直到遇到下一个大写标题或结束
    /ABOUT ME\s*\n([\s\S]*?)(?=\n[A-Z]{2,}|\n\n[A-Z]{2,}|$)/gi,
    // 匹配 "about me" (小写)
    /about me\s*\n([\s\S]*?)(?=\n[A-Z]{2,}|\n\n[A-Z]{2,}|$)/gi,
    // 匹配带冒号的格式
    /ABOUT ME:\s*\n([\s\S]*?)(?=\n[A-Z]{2,}|\n\n[A-Z]{2,}|$)/gi,
    /about me:\s*\n([\s\S]*?)(?=\n[A-Z]{2,}|\n\n[A-Z]{2,}|$)/gi,
    // 匹配更宽泛的格式，包括同一行的内容
    /ABOUT ME[\s:]*([^]*?)(?=\n[A-Z]{2,}|\n\n[A-Z]{2,}|$)/gi,
    /about me[\s:]*([^]*?)(?=\n[A-Z]{2,}|\n\n[A-Z]{2,}|$)/gi
  ];
  
  for (const pattern of aboutMePatterns) {
    const matches = bodyText.matchAll(pattern);
    for (const match of matches) {
      if (match && match[1]) {
        let description = match[1].trim();
        
        console.log(`🔍 从"ABOUT ME"模式提取到原始内容: ${description.substring(0, 100)}...`);
        
        // 同样处理特征词汇行
        const characteristicsPattern = /^(Friendly,?\s*Courageous,?\s*Sophisticated,?\s*Strong|[A-Za-z\s,]+)\s*$/m;
        const characteristicsMatch = description.match(characteristicsPattern);
        
        if (characteristicsMatch) {
          console.log(`🔍 检测到特征词汇行: ${characteristicsMatch[0]}`);
          description = description.replace(characteristicsMatch[0], '').trim();
        }
        
        // 清理和格式化描述内容
        description = description
          .replace(/\n\s*\n/g, '\n\n') // 规范化段落间距
          .replace(/\n/g, ' ') // 将换行符替换为空格
          .replace(/\s+/g, ' ') // 合并多个空格
          .trim();
        
        // 验证描述长度和质量
        if (description.length >= 30 && description.length <= 2000) {
          // 检查是否包含有意义的内容（不只是特征词汇）
          const meaningfulContent = description.match(/[.!?]/g); // 包含句号、感叹号或问号
          const hasPersonalStory = description.toLowerCase().includes('i am') || 
                                  description.toLowerCase().includes('hi,') ||
                                  description.toLowerCase().includes('hello,') ||
                                  description.toLowerCase().includes('my name') ||
                                  description.toLowerCase().includes('i was') ||
                                  description.toLowerCase().includes('i love') ||
                                  description.toLowerCase().includes('please give me');
          
          if (meaningfulContent && meaningfulContent.length > 0 || hasPersonalStory) {
            console.log(`📝 从"ABOUT ME"提取到完整描述 (${description.length} 字符)`);
            return description;
          }
        }
      }
    }
  }
  
  // 3. 如果没有找到"ABOUT ME"，尝试查找其他描述模式
  console.log('🔍 未找到"ABOUT ME"，尝试其他描述模式...');
  
  // 查找以"Hi, I'm"开始的自我介绍
  const selfIntroPatterns = [
    /Hi,\s*I'm\s+[^.]*\.([\s\S]*?)(?=\n[A-Z]{2,}|\n\n[A-Z]{2,}|Facebook\s+Twitter|$)/gi,
    /Hello,\s*I'm\s+[^.]*\.([\s\S]*?)(?=\n[A-Z]{2,}|\n\n[A-Z]{2,}|Facebook\s+Twitter|$)/gi,
    /My name is\s+[^.]*\.([\s\S]*?)(?=\n[A-Z]{2,}|\n\n[A-Z]{2,}|Facebook\s+Twitter|$)/gi
  ];
  
  for (const pattern of selfIntroPatterns) {
    const matches = bodyText.matchAll(pattern);
    for (const match of matches) {
      if (match && match[1]) {
        let description = match[1].trim();
        
        // 提取包含"Hi, I'm"的完整段落
        const fullIntroMatch = bodyText.match(/(Hi,\s*I'm\s+[^]*?)(?=\n[A-Z]{2,}|\n\n[A-Z]{2,}|Facebook\s+Twitter|$)/gi);
        if (fullIntroMatch && fullIntroMatch[0]) {
          description = fullIntroMatch[0].trim();
        }
        
        description = description
          .replace(/\n\s*\n/g, '\n\n')
          .replace(/\n/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        
        if (description.length >= 30 && description.length <= 2000) {
          console.log(`📝 从自我介绍模式提取到描述 (${description.length} 字符)`);
          return description;
        }
      }
    }
  }
  
  // 4. 尝试从HTML选择器中提取描述
  console.log('🔍 从HTML选择器查找描述...');
  
  const descSelectors = [
    '.description', 
    '.pet-description', 
    '.animal-description',
    '.about', 
    '.pet-about', 
    '.content', 
    '.details',
    '.info-section',
    '.entry-content',
    '.post-content',
    '.animal-info'
  ];
  
  for (const selector of descSelectors) {
    const descText = $(selector).text().trim();
    if (descText && descText.length > 30 && descText.length < 2000) {
      // 检查是否包含"ABOUT ME"相关内容
      if (descText.toLowerCase().includes('about me') || 
          descText.toLowerCase().includes('hi, i\'m') ||
          descText.toLowerCase().includes('my name is')) {
        console.log(`📝 从选择器 ${selector} 提取到描述 (${descText.length} 字符)`);
        return descText;
      }
    }
  }
  
  // 5. 查找最长的有意义段落
  console.log('🔍 查找最长的有意义段落...');
  
  const paragraphs = $('p').map((i, p) => $(p).text().trim()).get();
  const meaningfulParagraphs = paragraphs.filter(p => 
    p.length > 30 && 
    p.length < 2000 && 
    (p.includes('.') || p.includes('!') || p.includes('?')) &&
    !p.toLowerCase().includes('error') &&
    !p.toLowerCase().includes('404')
  );
  
  if (meaningfulParagraphs.length > 0) {
    // 按长度排序，选择最长的
    const longestParagraph = meaningfulParagraphs.sort((a, b) => b.length - a.length)[0];
    console.log(`📝 从段落提取到描述 (${longestParagraph.length} 字符)`);
    return longestParagraph;
  }
  
  // 6. 最后尝试从整个文本中提取包含动物相关信息的段落
  console.log('🔍 从整个文本提取动物相关段落...');
  
  const animalKeywords = ['dog', 'cat', 'pet', 'animal', 'friendly', 'love', 'play', 'home', 'family'];
  const textParagraphs = bodyText.split('\n').filter(p => p.trim().length > 30);
  
  for (const paragraph of textParagraphs) {
    const cleanParagraph = paragraph.trim();
    if (cleanParagraph.length >= 30 && cleanParagraph.length <= 2000) {
      const hasAnimalKeywords = animalKeywords.some(keyword => 
        cleanParagraph.toLowerCase().includes(keyword)
      );
      
      if (hasAnimalKeywords && 
          (cleanParagraph.includes('.') || cleanParagraph.includes('!') || cleanParagraph.includes('?'))) {
        console.log(`📝 从文本段落提取到描述 (${cleanParagraph.length} 字符)`);
        return cleanParagraph;
      }
    }
  }
  
  console.log('📝 未找到合适的描述信息');
  return null;
};

// 提取性格标签
const extractPersonalityTags = ($, bodyText) => {
  const personalityWords = [
    'friendly', 'active', 'calm', 'playful', 'gentle', 'energetic',
    '友善', '活潑', '溫柔', '平靜', '好動', '親人', '可愛', '聰明'
  ];
  
  const foundTags = [];
  const textLower = bodyText.toLowerCase();
  
  for (const word of personalityWords) {
    if (textLower.includes(word.toLowerCase())) {
      foundTags.push(word);
      if (foundTags.length >= 3) break;
    }
  }
  
  return foundTags.length > 0 ? foundTags : ['友善', '可愛'];
};

// 重新设计的图片提取函数 - 专门针对SPCA WordPress结构
const extractSpcaImages = async ($, pageContent, petName) => {
  console.log(`🖼️ 开始提取SPCA图片，宠物: ${petName}`);
  
  const images = [];
  
  // 1. 优先搜索WhatsApp图片（WordPress上传目录）
  console.log('🔍 搜索WordPress上传目录中的WhatsApp图片...');
  const whatsappPatterns = [
    // 完整的WordPress路径 + WhatsApp图片
    /wp-content\/uploads\/\d{4}\/\d{2}\/WhatsApp-Image-[^'">\s]+\.(?:jpg|jpeg|png|gif|webp)/gi,
    // 相对路径的WhatsApp图片
    /\/wp-content\/uploads\/[^'">\s]*WhatsApp-Image-[^'">\s]+\.(?:jpg|jpeg|png|gif|webp)/gi,
    // 任何包含WhatsApp-Image的图片
    /https?:\/\/[^'">\s]*\/wp-content\/uploads\/[^'">\s]*WhatsApp-Image-[^'">\s]+\.(?:jpg|jpeg|png|gif|webp)/gi,
    // 基础的WhatsApp图片模式
    /WhatsApp-Image-\d{4}-\d{2}-\d{2}-at-\d{2}\.\d{2}\.\d{2}[^'">\s]*\.(?:jpg|jpeg|png|gif|webp)/gi
  ];
  
  whatsappPatterns.forEach((pattern, index) => {
    const matches = pageContent.match(pattern);
    if (matches) {
      console.log(`   模式 ${index + 1} 找到 ${matches.length} 个WhatsApp图片:`);
      matches.forEach((match, i) => {
        if (i < 3) { // 只显示前3个以避免日志过长
          console.log(`     ${i + 1}: ${match}`);
          
          // 构建完整URL
          let fullUrl = match;
          if (match.startsWith('/wp-content')) {
            fullUrl = SPCA_CONFIG.baseURL + match;
          } else if (match.startsWith('wp-content')) {
            fullUrl = SPCA_CONFIG.baseURL + '/' + match;
          } else if (!match.startsWith('http')) {
            // 如果是相对路径，尝试构建完整路径
            fullUrl = SPCA_CONFIG.baseURL + '/wp-content/uploads/' + match;
          }
          
          // 验证URL格式
          try {
            new URL(fullUrl);
            console.log(`     ✅ 有效URL: ${fullUrl}`);
            
            if (!images.find(img => img.url === fullUrl)) {
              images.push({
                url: fullUrl,
                alt: `${petName} - SPCA photo`,
                priority: 20,
                type: 'whatsapp'
              });
            }
          } catch (urlError) {
            console.log(`     ❌ 无效URL: ${fullUrl}`);
          }
        }
      });
    }
  });
  
  // 2. 从img标签中提取图片
  console.log('🔍 从img标签提取图片...');
  $('img').each((i, img) => {
    const src = $(img).attr('src');
    const dataSrc = $(img).attr('data-src');
    const srcset = $(img).attr('srcset');
    const alt = $(img).attr('alt') || '';
    const className = $(img).attr('class') || '';
    
    // 检查所有可能的图片源
    const possibleSources = [src, dataSrc];
    
    // 从srcset中提取URL
    if (srcset) {
      const srcsetUrls = srcset.split(',').map(s => s.trim().split(' ')[0]);
      possibleSources.push(...srcsetUrls);
    }
    
    possibleSources.forEach(source => {
      if (!source) return;
      
      console.log(`   检查图片源: ${source}`);
      
      // 构建完整URL
      let fullUrl = source;
      if (source.startsWith('/')) {
        fullUrl = SPCA_CONFIG.baseURL + source;
      } else if (!source.startsWith('http')) {
        fullUrl = SPCA_CONFIG.baseURL + '/' + source;
      }
      
      // 检查是否是有效的图片URL
      const isValidImage = 
        fullUrl.match(/\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i) ||
        fullUrl.includes('wp-content/uploads') ||
        fullUrl.toLowerCase().includes('whatsapp-image');
      
      if (isValidImage) {
        // 排除明显的非宠物图片
        const excludePatterns = [
          'logo', 'icon', 'banner', 'nav', 'menu', 'header', 'footer',
          'facebook', 'twitter', 'instagram', 'social', 'btn', 'button'
        ];
        
        const shouldExclude = excludePatterns.some(pattern => 
          fullUrl.toLowerCase().includes(pattern) || 
          alt.toLowerCase().includes(pattern) || 
          className.toLowerCase().includes(pattern)
        );
        
        if (!shouldExclude && !images.find(img => img.url === fullUrl)) {
          let priority = 10; // 基础优先级
          
          // 提高WordPress上传图片的优先级
          if (fullUrl.includes('wp-content/uploads')) priority += 8;
          if (fullUrl.toLowerCase().includes('whatsapp-image')) priority += 15;
          if (alt.toLowerCase().includes('pet') || alt.toLowerCase().includes('animal')) priority += 5;
          if (fullUrl.includes('.jpg') || fullUrl.includes('.jpeg')) priority += 2;
          
          // 验证URL格式
          try {
            new URL(fullUrl);
            
            images.push({
              url: fullUrl,
              alt: alt || `${petName} photo`,
              priority: priority,
              type: 'img-tag'
            });
            
            console.log(`     ✅ 添加图片: ${fullUrl} (优先级: ${priority})`);
          } catch (urlError) {
            console.log(`     ❌ 无效URL跳过: ${fullUrl}`);
          }
        }
      }
    });
  });
  
  // 3. 搜索页面中所有WordPress上传的图片
  console.log('🔍 搜索页面中所有WordPress上传图片...');
  const wpUploadPatterns = [
    /https?:\/\/[^'">\s]*\/wp-content\/uploads\/[^'">\s]+\.(?:jpg|jpeg|png|gif|webp)/gi,
    /\/wp-content\/uploads\/[^'">\s]+\.(?:jpg|jpeg|png|gif|webp)/gi,
    /wp-content\/uploads\/[^'">\s]+\.(?:jpg|jpeg|png|gif|webp)/gi
  ];
  
  wpUploadPatterns.forEach((pattern, index) => {
    const matches = pageContent.match(pattern);
    if (matches) {
      console.log(`   WordPress模式 ${index + 1} 找到 ${matches.length} 个图片:`);
      matches.forEach((match, i) => {
        if (i < 3) { // 只显示前3个
          console.log(`     ${i + 1}: ${match}`);
          
          let fullUrl = match;
          if (match.startsWith('/wp-content')) {
            fullUrl = SPCA_CONFIG.baseURL + match;
          } else if (match.startsWith('wp-content')) {
            fullUrl = SPCA_CONFIG.baseURL + '/' + match;
          }
          
          // 验证URL格式
          try {
            new URL(fullUrl);
            
            if (!images.find(img => img.url === fullUrl)) {
              images.push({
                url: fullUrl,
                alt: `${petName} - WordPress photo`,
                priority: 15,
                type: 'wordpress'
              });
              console.log(`     ✅ 添加WordPress图片: ${fullUrl}`);
            }
          } catch (urlError) {
            console.log(`     ❌ 无效WordPress URL跳过: ${fullUrl}`);
          }
        }
      });
    }
  });
  
  // 按优先级排序
  images.sort((a, b) => b.priority - a.priority);
  
  console.log(`📊 图片提取总结: 找到 ${images.length} 张图片`);
  images.slice(0, 5).forEach((img, index) => {
    console.log(`   ${index + 1}. ${img.url} (优先级: ${img.priority}, 类型: ${img.type})`);
  });
  
  // 返回排序后的图片URL数组
  return images.map(img => img.url);
};

// 优化的提取宠物数据函数
const extractPetData = async (code) => {
    try {
      const url = `${SPCA_CONFIG.animalDetailPattern}${code}`;
      console.log(`🔍 提取宠物数据: ${url}`);
      
      const response = await retryRequest(url);
      const $ = cheerio.load(response.data);
      
      const petData = {
        id: `spca_${code}`,
        code: code,
        detailUrl: url,
        source: 'spca'
      };
      
      const bodyText = $.text();
      const pageContent = response.data;
      console.log(`📄 页面内容长度: ${bodyText.length}`);

      if (bodyText.length < 1000) {
        console.log(`⚠️ 页面内容过短，可能无效: ${code}`);
        return null;
      }
      
      if (bodyText.toLowerCase().includes('404') || 
          bodyText.toLowerCase().includes('not found')) {
        console.log(`⚠️ 检测到404页面: ${code}`);
        return null;
      }
      
      petData.name = extractPetName($, bodyText, code);
      petData.type = extractPetType($, bodyText);
      petData.breed = extractBreedInfo($, bodyText);
      petData.age = extractAgeInfo($, bodyText);
      petData.gender = extractGenderInfo($, bodyText);
      petData.description = extractDescription($, bodyText);
      
      // 使用新的图片提取函数
      const extractedImages = await extractSpcaImages($, pageContent, petData.name);
      
      // 验证图片可访问性（简化版，只检查URL格式）
      const validImages = [];
      for (const imageUrl of extractedImages.slice(0, 5)) {
        // 对于WordPress和WhatsApp图片，直接接受（相信URL是正确的）
        if (imageUrl.includes('wp-content/uploads') || 
            imageUrl.toLowerCase().includes('whatsapp-image')) {
          validImages.push(imageUrl);
          console.log(`✅ 直接接受WordPress/WhatsApp图片: ${imageUrl}`);
        } else if (imageUrl.startsWith('https://www.spca.org.hk/') && imageUrl.length > 30) {
          validImages.push(imageUrl);
          console.log(`✅ 接受SPCA图片: ${imageUrl}`);
        }
      }
      
      petData.images = validImages;
      
      // 设置主图片
      if (validImages.length > 0) {
        petData.image = validImages[0];
        console.log(`🎯 设置主图片: ${petData.image}`);
      } else {
        // 如果没有找到有效图片，使用高质量的备用图片
        petData.image = generateHighQualityFallbackImage(petData.type, petData.name, code);
        petData.images = [petData.image]; // 确保images数组不为空
        console.log(`🎨 使用备用图片: ${petData.image}`);
      }
      
      // 3. 其他字段
      petData.tags = ['待領養', '健康檢查', 'SPCA認證'];
      petData.personalityTags = extractPersonalityTags($, bodyText);
      petData.location = '香港';
      petData.center = 'SPCA Hong Kong';
      petData.publishedAt = new Date().toISOString();
      petData.popularity = Math.floor(Math.random() * 100) + 1;
      petData.viewCount = Math.floor(Math.random() * 500) + 50;
      petData.favoriteCount = Math.floor(Math.random() * 100) + 20;
      petData.postedDate = new Date();
      
      console.log(`✅ 成功提取宠物数据: ${petData.name} (${petData.type}, ${petData.breed}) - 图片数量: ${validImages.length}`);
      
      return petData;
      
    } catch (error) {
        console.error(`❌ 提取宠物数据失败，代码: ${code}`, error.message);
        return null;
    }
};

// 生成模拟宠物数据 - 修复类型错误
const generateMockPetData = (code) => {
  const names = ['Ruby', 'Max', 'Bella', 'Charlie', 'Luna', 'Cooper'];
  const types = ['狗', '貓'];
  const breeds = ['混種犬', '金毛尋回犬', '家貓', '英國短毛貓'];
  const ages = ['幼年', '青年', '成年'];
  const genders = ['公', '母'];
  
  const randomName = names[Math.floor(Math.random() * names.length)];
  const randomType = types[Math.floor(Math.random() * types.length)];
  const randomBreed = breeds[Math.floor(Math.random() * breeds.length)];
  const randomAge = ages[Math.floor(Math.random() * ages.length)];
  const randomGender = genders[Math.floor(Math.random() * genders.length)];
  
  // 修复类型错误 - 确保code转换为字符串
  const codeStr = String(code);
  const seed = codeStr.length >= 3 ? parseInt(codeStr.slice(-3)) : Math.floor(Math.random() * 1000);
  const fallbackImage = `https://images.unsplash.com/photo-${1500000000000 + seed}?w=600&h=600&fit=crop&auto=format&q=80`;
  
  return {
    id: `spca_mock_${code}`,
    code: code,
    name: randomName,
    type: randomType,
    breed: randomBreed,
    age: randomAge,
    gender: randomGender,
    location: '香港',
    image: fallbackImage,
    images: [fallbackImage],
    description: `${randomName}是一只可爱的${randomBreed}，正在寻找一个充满爱的家庭。`,
    tags: ['待領養', '健康檢查', 'SPCA認證'],
    personalityTags: ['友善', '活潑'],
    healthStatus: '健康',
    vaccinated: true,
    spayed: Math.random() > 0.5,
    center: 'SPCA Hong Kong',
    contact: {
      phone: '+852 2232 5529',
      email: 'adoption@spca.org.hk',
      organization: '香港愛護動物協會'
    },
    publishedAt: new Date().toISOString(),
    source: 'spca'
  };
};

module.exports = {
  crawlSpcaPets,
  resetCrawlState,
  getCrawlStatus
};