const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

// 导入爬虫模块
const { crawlSzadoptPet } = require("./crawler/szadopt");
const { crawlSpcaPets, resetCrawlState, getCrawlStatus } = require("./crawler/spca");

const app = express();
const PORT = process.env.PORT || 8080;

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