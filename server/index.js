const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const authRoutes = require('./auth');

// 在文件顶部添加ECNU API配置
const ECNU_API_CONFIG = {
  baseURL: 'https://chat.ecnu.edu.cn/open/api/v1',
  apiKey: process.env.ECNU_API_KEY || 'sk-c83a6cc7486547f08dd974beeb919d87', // 从环境变量获取
  model: 'ecnu-plus',
  timeout: 30000
};


// 导入爬虫模块
//const { crawlSzadoptPet } = require("./crawler/szadopt");
const { crawlSpcaPets, resetCrawlState, getCrawlStatus } = require("./crawler/spca");

const app = express();
const PORT = process.env.PORT || 8080;

const PETFINDER_API_KEY = process.env.PETFINDER_API_KEY || "po4C4QyAelafMNrVlaFQMyDHAeVLCn1AhkFEKTaCN4R1QrNOjy";
const PETFINDER_SECRET = process.env.PETFINDER_SECRET || "QwiklIgdjWuY92gFndcjtDfO1R4SmEmY22qUrNrM";

// 中间件
app.use(cors());
app.use(express.json());

// 记录请求日志
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

app.use('/api/auth', authRoutes);

// 添加ECNU API代理 - 现在 app 已经初始化了
app.post("/api/ecnu/chat/completions", async (req, res) => {
  try {
    console.log("🤖 正在调用ECNU大模型API...");
    
    const { messages, temperature, max_tokens, model } = req.body;
    
    // 验证请求参数
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({
        status: "error",
        message: "缺少或无效的消息参数"
      });
    }
    
    // 构建请求数据
    const requestData = {
      model: model || ECNU_API_CONFIG.model,
      messages: messages,
      temperature: temperature || 0.7,
      max_tokens: max_tokens || 1000
    };
    
    console.log("📝 ECNU API请求数据:", {
      model: requestData.model,
      messageCount: messages.length,
      temperature: requestData.temperature,
      max_tokens: requestData.max_tokens
    });
    
    // 调用ECNU API
    const response = await axios.post(
      `${ECNU_API_CONFIG.baseURL}/chat/completions`,
      requestData,
      {
        headers: {
          'Authorization': `Bearer ${ECNU_API_CONFIG.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: ECNU_API_CONFIG.timeout
      }
    );
    
    console.log("✅ ECNU API调用成功");
    
    // 返回响应
    res.json(response.data);
    
  } catch (error) {
    console.error("❌ ECNU API调用失败:", error.message);
    
    let errorMessage = "ECNU API调用失败";
    let statusCode = 500;
    
    if (error.response) {
      statusCode = error.response.status;
      errorMessage = `ECNU API错误: ${error.response.status}`;
      
      if (error.response.status === 401) {
        errorMessage = "ECNU API认证失败，请检查API密钥";
      } else if (error.response.status === 403) {
        errorMessage = "ECNU API访问被拒绝";
      } else if (error.response.status === 429) {
        errorMessage = "ECNU API请求过于频繁";
      }
      
      console.error("   ECNU API响应:", error.response.data);
    } else if (error.code === 'ECONNABORTED') {
      errorMessage = "ECNU API请求超时";
      statusCode = 408;
    } else if (error.code === 'ENOTFOUND') {
      errorMessage = "无法连接到ECNU服务器";
      statusCode = 503;
    }
    
    res.status(statusCode).json({
      status: "error",
      message: errorMessage,
      error: error.message,
      details: error.response?.data
    });
  }
});

// 健康检查
app.get("/health", (req, res) => {
  res.json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    message: "Server is healthy"
  });
});

// 服务器状态
app.get("/status", (req, res) => {
  const dataFile = path.join(__dirname, "data/chinaPets.json");
  const fileExists = fs.existsSync(dataFile);
  
  let fileInfo = null;
  if (fileExists) {
    const stats = fs.statSync(dataFile);
    const content = fs.readFileSync(dataFile, "utf-8");
    const data = JSON.parse(content);
    
    fileInfo = {
      exists: true,
      size: stats.size,
      lastModified: stats.mtime,
      recordCount: data.length
    };
  }
  
  const crawlStatus = getCrawlStatus();
  
  res.json({
    status: "running",
    server: "Pet2.0 Backend",
    version: "1.0.0",
    endpoints: {
      health: "/health",
      status: "/status",
      chinaData: "/data/china",
      crawl: "/crawl/china",
      crawlStatus: "/crawl/status",
      resetCrawl: "/crawl/reset"
    },
    dataFile: fileInfo,
    crawlStatus,
    timestamp: new Date().toISOString()
  });
});

// 分批爬取香港SPCA数据的API
app.get("/crawl/china", async (req, res) => {
  try {
    console.log("🚀 开始分批爬取香港SPCA宠物数据...");
    
    const result = await crawlSpcaPets(true); // 启用分批模式
    
    console.log(`✅ 分批爬取完成: ${result.message}`);
    
    res.json({ 
      status: "success", 
      count: result.count,
      totalCount: result.totalCount,
      batchInfo: result.batchInfo,
      message: result.message,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error("❌ 分批爬取失败:", err);
    res.status(500).json({ 
      status: "error",
      error: err.toString(),
      message: "分批爬取数据时发生错误",
      timestamp: new Date().toISOString()
    });
  }
});

// 获取爬取状态
app.get("/crawl/status", (req, res) => {
  try {
    const crawlStatus = getCrawlStatus();
    res.json({
      status: "success",
      crawlStatus,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error("❌ 获取爬取状态失败:", err);
    res.status(500).json({
      status: "error",
      error: err.toString(),
      message: "获取爬取状态时发生错误",
      timestamp: new Date().toISOString()
    });
  }
});

// 重置爬取状态
app.post("/crawl/reset", (req, res) => {
  try {
    resetCrawlState();
    res.json({
      status: "success",
      message: "爬取状态已重置",
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error("❌ 重置爬取状态失败:", err);
    res.status(500).json({
      status: "error",
      error: err.toString(),
      message: "重置爬取状态时发生错误",
      timestamp: new Date().toISOString()
    });
  }
});

// 获取香港SPCA数据的API
app.get("/data/china", (req, res) => {
  try {
    const file = path.join(__dirname, "data/chinaPets.json");
    
    console.log("📖 尝试读取文件:", file);
    
    if (!fs.existsSync(file)) {
      console.log("📄 文件不存在，返回空数组");
      return res.json([]);
    }
    
    const content = fs.readFileSync(file, "utf-8");
    const data = JSON.parse(content);
    
    console.log(`✅ 成功读取 ${data.length} 条数据`);
    res.json(data);
  } catch (err) {
    console.error("❌ 读取数据失败:", err);
    res.status(500).json({ 
      status: "error",
      error: err.toString(),
      message: "读取数据时发生错误",
      timestamp: new Date().toISOString()
    });
  }
});

// API根路径
app.get("/", (req, res) => {
  res.json({
    message: "Pet2.0 Backend API",
    server: "Express.js",
    version: "1.0.0",
    endpoints: {
      health: "/health",
      status: "/status",
      chinaData: "/data/china",
      crawl: "/crawl/china",
      crawlStatus: "/crawl/status",
      resetCrawl: "/crawl/reset"
    },
    timestamp: new Date().toISOString()
  });
});

// Petfinder Token代理 - 改进错误处理
app.post("/api/petfinder/token", async (req, res) => {
  try {
    console.log("🔑 正在获取Petfinder API令牌...");
    
    // 检查API密钥
    if (!PETFINDER_API_KEY || !PETFINDER_SECRET) {
      console.error("❌ Petfinder API密钥未配置");
      return res.status(500).json({
        status: "error",
        message: "Petfinder API密钥未配置"
      });
    }
    
    const response = await axios.post("https://api.petfinder.com/v2/oauth2/token", {
      grant_type: "client_credentials",
      client_id: PETFINDER_API_KEY,
      client_secret: PETFINDER_SECRET
    }, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'PetAdoption/1.0'
      },
      timeout: 15000
    });
    
    console.log("✅ 成功获取Petfinder API令牌");
    res.json(response.data);
  } catch (error) {
    console.error("❌ 获取Petfinder API令牌失败:", error.message);
    
    if (error.response) {
      console.error("   响应状态:", error.response.status);
      console.error("   响应数据:", error.response.data);
    }
    
    res.status(500).json({
      status: "error",
      message: "获取Petfinder API令牌失败",
      error: error.message,
      details: error.response?.data
    });
  }
});

// Petfinder Animals API代理 - 改进错误处理
app.get("/api/petfinder/animals", async (req, res) => {
  try {
    console.log("🐾 正在请求Petfinder Animals API...");
    console.log("📝 查询参数:", req.query);
    
    // 获取前端传来的token
    const { token, ...otherParams } = req.query;
    
    if (!token) {
      return res.status(400).json({
        status: "error",
        message: "缺少访问令牌"
      });
    }
    
    // 清理和验证参数
    const cleanParams = {};
    Object.keys(otherParams).forEach(key => {
      if (otherParams[key] && otherParams[key] !== 'undefined' && otherParams[key] !== 'null') {
        cleanParams[key] = otherParams[key];
      }
    });
    
    console.log("📝 清理后的参数:", cleanParams);
    
    // 向Petfinder API发送请求，增加超时和重试
    const response = await axios.get("https://api.petfinder.com/v2/animals", {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Accept": "application/json",
        "User-Agent": "PetAdoption/1.0"
      },
      params: cleanParams,
      timeout: 15000, // 15秒超时
      validateStatus: (status) => status < 500 // 只有5xx错误才抛出异常
    });
    
    if (response.status !== 200) {
      console.log(`⚠️ Petfinder API返回状态: ${response.status}`);
      return res.status(response.status).json({
        status: "error",
        message: "Petfinder API请求失败",
        httpStatus: response.status
      });
    }
    
    console.log(`✅ 成功获取Petfinder数据: ${response.data.animals?.length || 0}只宠物`);
    
    // 验证响应数据
    if (!response.data || !response.data.animals) {
      return res.status(200).json({
        animals: [],
        pagination: {
          count_per_page: 0,
          total_count: 0,
          current_page: 1,
          total_pages: 1
        }
      });
    }
    
    res.json(response.data);
  } catch (error) {
    console.error("❌ 请求Petfinder Animals API失败:", error.message);
    
    let errorMessage = "请求Petfinder API失败";
    let statusCode = 500;
    
    if (error.code === 'ENOTFOUND') {
      errorMessage = "无法连接到Petfinder服务器";
      statusCode = 503;
    } else if (error.code === 'ECONNABORTED') {
      errorMessage = "请求超时";
      statusCode = 408;
    } else if (error.response) {
      statusCode = error.response.status;
      errorMessage = `Petfinder API错误: ${error.response.status}`;
      
      if (error.response.status === 401) {
        errorMessage = "Petfinder API认证失败，请检查token";
      } else if (error.response.status === 403) {
        errorMessage = "Petfinder API访问被拒绝";
      } else if (error.response.status === 429) {
        errorMessage = "Petfinder API请求过于频繁";
      }
    }
    
    res.status(statusCode).json({
      status: "error",
      message: errorMessage,
      error: error.message,
      code: error.code,
      details: error.response?.data
    });
  }
});

// 修复单个宠物详情 API - 改进错误处理和日志
app.get("/api/petfinder/animal/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { token } = req.query;
    
    if (!token) {
      return res.status(400).json({
        status: "error",
        message: "缺少访问令牌"
      });
    }
    
    if (!id || id === 'undefined') {
      return res.status(400).json({
        status: "error",
        message: "无效的宠物ID"
      });
    }
    
    console.log(`🔍 获取宠物ID: ${id} 的详细信息`);
    
    // 向Petfinder API发送请求
    const response = await axios.get(`https://api.petfinder.com/v2/animals/${id}`, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Accept": "application/json",
        "User-Agent": "PetAdoption/1.0"
      },
      timeout: 15000,
      validateStatus: (status) => status < 500
    });
    
    if (response.status === 404) {
      console.log(`⚠️ 宠物ID: ${id} 未找到`);
      return res.status(404).json({ 
        status: "error", 
        message: "未找到指定的宠物信息" 
      });
    }
    
    if (response.status !== 200) {
      console.log(`⚠️ 获取宠物详情失败，状态: ${response.status}`);
      return res.status(response.status).json({
        status: "error",
        message: "获取宠物详情失败",
        httpStatus: response.status
      });
    }
    
    if (response.data && response.data.animal) {
      console.log("✅ 成功获取宠物详细信息");
      
      // 详细日志记录宠物信息
      const animal = response.data.animal;
      console.log(`📝 宠物名称: ${animal.name}`);
      console.log(`📝 宠物类型: ${animal.type} - ${animal.breeds?.primary || 'Unknown'}`);
      
      if (animal.description) {
        console.log(`📝 描述长度: ${animal.description.length} 字符`);
        console.log(`📝 描述前150字符: ${animal.description.substring(0, 150)}...`);
      } else {
        console.log("📝 宠物描述: 无");
      }
      
      res.json(response.data);
    } else {
      console.log("⚠️ 响应数据格式异常");
      res.status(500).json({ 
        status: "error", 
        message: "响应数据格式异常" 
      });
    }
  } catch (error) {
    console.error(`❌ 获取宠物ID: ${req.params.id} 详细信息失败:`, error.message);
    
    let errorMessage = "获取宠物详细信息失败";
    let statusCode = 500;
    
    if (error.code === 'ENOTFOUND') {
      errorMessage = "无法连接到Petfinder服务器";
      statusCode = 503;
    } else if (error.code === 'ECONNABORTED') {
      errorMessage = "请求超时";
      statusCode = 408;
    } else if (error.response) {
      statusCode = error.response.status;
      errorMessage = `Petfinder API错误: ${error.response.status}`;
    }
    
    res.status(statusCode).json({
      status: "error",
      message: errorMessage,
      error: error.message,
      petId: req.params.id,
      details: error.response?.data
    });
  }
});

// Petfinder Types API代理
app.get("/api/petfinder/types", async (req, res) => {
  try {
    const { token, type } = req.query;
    
    if (!token) {
      return res.status(400).json({
        status: "error",
        message: "缺少访问令牌"
      });
    }
    
    let url = "https://api.petfinder.com/v2/types";
    if (type) {
      url = `${url}/${type}`;
    }
    
    const response = await axios.get(url, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });
    
    res.json(response.data);
  } catch (error) {
    console.error("❌ 请求Petfinder Types API失败:", error.message);
    res.status(500).json({
      status: "error",
      message: "请求Petfinder Types API失败",
      error: error.message
    });
  }
});

// 图片代理API - 解决CORS问题
app.get("/proxy/image", async (req, res) => {
  try {
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({
        status: "error",
        message: "缺少图片URL参数"
      });
    }
    
    // 验证URL是否来自允许的域名
    const allowedDomains = [
      'www.spca.org.hk',
      'images.unsplash.com',
      'source.unsplash.com'
    ];
    
    const urlObj = new URL(url);
    if (!allowedDomains.includes(urlObj.hostname)) {
      return res.status(403).json({
        status: "error",
        message: "不允许的域名"
      });
    }
    
    console.log(`🖼️ 代理图片请求: ${url}`);
    
    const response = await axios.get(url, {
      responseType: 'stream',
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/*',
        'Referer': 'https://www.spca.org.hk/'
      }
    });
    
    // 设置正确的Content-Type
    if (response.headers['content-type']) {
      res.setHeader('Content-Type', response.headers['content-type']);
    }
    
    // 设置缓存头
    res.setHeader('Cache-Control', 'public, max-age=86400'); // 24小时缓存
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // 流式传输图片数据
    response.data.pipe(res);
    
  } catch (error) {
    console.error('❌ 代理图片失败:', error.message);
    
    if (error.response?.status === 404) {
      res.status(404).json({
        status: "error",
        message: "图片未找到"
      });
    } else {
      res.status(500).json({
        status: "error", 
        message: "图片代理失败",
        error: error.message
      });
    }
  }
});

// 启动服务器
const server = app.listen(PORT, () => {
  console.log(`🌟 服务器启动成功！`);
  console.log(`🚀 服务器地址: http://localhost:${PORT}`);
  console.log(`🕷️ 分批爬取SPCA: http://localhost:${PORT}/crawl/china`);
  console.log(`📊 爬取状态: http://localhost:${PORT}/crawl/status`);
  console.log(`🔄 重置爬取: http://localhost:${PORT}/crawl/reset`);
  console.log(`📝 API信息: http://localhost:${PORT}/`);
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('🛑 收到 SIGTERM 信号，正在关闭服务器...');
  server.close(() => {
    console.log('✅ 服务器已关闭');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 收到 SIGINT 信号，正在关闭服务器...');
  server.close(() => {
    console.log('✅ 服务器已关闭');
    process.exit(0);
  });
});