const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const axios = require("axios");

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

// Petfinder Token代理
app.post("/api/petfinder/token", async (req, res) => {
  try {
    console.log("🔑 正在获取Petfinder API令牌...");
    
    const response = await axios.post("https://api.petfinder.com/v2/oauth2/token", {
      grant_type: "client_credentials",
      client_id: PETFINDER_API_KEY,
      client_secret: PETFINDER_SECRET
    });
    
    console.log("✅ 成功获取Petfinder API令牌");
    res.json(response.data);
  } catch (error) {
    console.error("❌ 获取Petfinder API令牌失败:", error.message);
    res.status(500).json({
      status: "error",
      message: "获取Petfinder API令牌失败",
      error: error.message
    });
  }
});

// Petfinder Animals API代理
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
    
    // 向Petfinder API发送请求
    const response = await axios.get("https://api.petfinder.com/v2/animals", {
      headers: {
        "Authorization": `Bearer ${token}`
      },
      params: otherParams
    });
    
    console.log(`✅ 成功获取Petfinder数据: ${response.data.animals?.length || 0}只宠物`);
    res.json(response.data);
  } catch (error) {
    console.error("❌ 请求Petfinder Animals API失败:", error.message);
    
    // 尝试获取详细错误信息
    const errorResponse = error.response ? error.response.data : null;
    
    res.status(500).json({
      status: "error",
      message: "请求Petfinder API失败",
      error: error.message,
      details: errorResponse
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

// 修改 Petfinder 单个宠物 API 代理，确保完整打印描述

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
    
    console.log(`🔍 获取宠物ID: ${id} 的详细信息`);
    
    // 向Petfinder API发送请求
    const response = await axios.get(`https://api.petfinder.com/v2/animals/${id}`, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });
    
    if (response.data && response.data.animal) {
      console.log("✅ 成功获取宠物详细信息");
      
      // 打印完整描述，不截断
      if (response.data.animal.description) {
        console.log("📝 完整宠物描述:", response.data.animal.description);
        // 检查描述长度
        console.log("📏 描述长度:", response.data.animal.description.length, "字符");
      } else {
        console.log("📝 宠物描述: 无");
      }
      
      res.json(response.data);
    } else {
      console.log("⚠️ 未找到宠物信息");
      res.status(404).json({ status: "error", message: "未找到宠物信息" });
    }
  } catch (error) {
    console.error(`❌ 获取宠物ID: ${req.params.id} 详细信息失败:`, error.message);
    
    // 尝试获取详细错误信息
    const errorResponse = error.response ? error.response.data : null;
    
    res.status(500).json({
      status: "error",
      message: "获取宠物详细信息失败",
      error: error.message,
      details: errorResponse
    });
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