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
  const typeText = bodyText.toLowerCase();
  
  if (typeText.includes('dog') || typeText.includes('canine') || typeText.includes('狗') || typeText.includes('犬')) {
    return '狗';
  } else if (typeText.includes('cat') || typeText.includes('feline') || typeText.includes('貓') || typeText.includes('猫')) {
    return '貓';
  } else if (typeText.includes('rabbit') || typeText.includes('兔')) {
    return '兔';
  } else if (typeText.includes('bird') || typeText.includes('鳥') || typeText.includes('鸟')) {
    return '鳥';
  }
  
  return 'Pet';
};

// 提取品种信息
const extractBreedInfo = ($, bodyText) => {
  const breedSelectors = [
    '.breed', 
    '.pet-breed', 
    '.animal-breed',
    '[class*="breed"]', 
    '[class*="type"]',
    '.info-row:contains("品種")',
    '.info-row:contains("breed")'
  ];
  
  for (const selector of breedSelectors) {
    const breedText = $(selector).text().trim();
    if (breedText && breedText.length > 0 && breedText.length < 50) {
      const cleanBreed = breedText.replace(/品種[:\s]*|breed[:\s]*/i, '').trim();
      if (cleanBreed.length > 0) {
        console.log(`📝 从选择器 ${selector} 提取到品种: ${cleanBreed}`);
        return cleanBreed;
      }
    }
  }
  
  const breedPatterns = [
    /breed[:\s]+([^,\n]+)/i,
    /品種[:\s]*([^,\n]+)/i,
    /(golden retriever|labrador|husky|poodle|bulldog|terrier|shepherd|混種|mix|domestic)/i,
    /(persian|siamese|maine coon|british shorthair|家貓|短毛|長毛)/i
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
  
  console.log(`📝 使用默认品种: Mixed Breed`);
  return 'Mixed Breed';
};

// 提取年龄信息
const extractAgeInfo = ($, bodyText) => {
  const agePatterns = [
    /age[:\s]+([^,\n]+)/i,
    /年齡[:\s]*([^,\n]+)/i,
    /(\d+)\s*(year|years|歲|岁|月|個月)/i,
    /(puppy|kitten|adult|senior|young|幼|成年|老年)/i
  ];
  
  for (const pattern of agePatterns) {
    const match = bodyText.match(pattern);
    if (match && match[1]) {
      const age = match[1].trim();
      if (age.length > 0 && age.length < 20) {
        console.log(`📝 提取到年龄: ${age}`);
        return age;
      }
    }
  }
  
  return 'Unknown';
};

// 提取性别信息
const extractGenderInfo = ($, bodyText) => {
  const genderPatterns = [
    /gender[:\s]+(male|female)/i,
    /sex[:\s]+(male|female)/i,
    /性別[:\s]*(公|母|雄|雌)/i,
    /(male|female|公|母)/i
  ];
  
  for (const pattern of genderPatterns) {
    const match = bodyText.match(pattern);
    if (match && match[1]) {
      const gender = match[1].toLowerCase();
      if (gender.includes('male') || gender.includes('公') || gender.includes('雄')) {
        return '公';
      } else if (gender.includes('female') || gender.includes('母') || gender.includes('雌')) {
        return '母';
      }
      return match[1].trim();
    }
  }
  
  return 'Unknown';
};

// 提取描述信息
const extractDescription = ($, bodyText) => {
  const descSelectors = [
    '.description', 
    '.pet-description', 
    '.animal-description',
    '.about', 
    '.pet-about', 
    '.content', 
    '.details',
    '.info-section',
    'p'
  ];
  
  for (const selector of descSelectors) {
    const descText = $(selector).text().trim();
    if (descText && descText.length > 50 && descText.length < 1000) {
      console.log(`📝 从选择器 ${selector} 提取到描述 (${descText.length} 字符)`);
      return descText;
    }
  }
  
  const paragraphs = $('p').map((i, p) => $(p).text().trim()).get();
  const longParagraph = paragraphs.find(p => p.length > 50 && p.length < 1000);
  
  if (longParagraph) {
    console.log(`📝 从段落提取到描述 (${longParagraph.length} 字符)`);
    return longParagraph;
  }
  
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