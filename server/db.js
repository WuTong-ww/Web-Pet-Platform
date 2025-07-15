const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// 确保data目录存在
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// 数据库文件路径
const DB_PATH = path.join(dataDir, 'pet_database.db');

// 创建数据库连接
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('❌ 数据库连接失败:', err.message);
  } else {
    console.log(`✅ 成功连接到SQLite数据库: ${DB_PATH}`);
    
    // 初始化表结构
    initializeTables();
  }
});

// 初始化数据库表
function initializeTables() {
  // 用户表
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) {
      console.error('❌ 创建用户表失败:', err.message);
    } else {
      console.log('✅ 用户表已初始化');
    }
  });

  // 宠物表
  db.run(`CREATE TABLE IF NOT EXISTS pets (
    id TEXT PRIMARY KEY,
    code TEXT,
    name TEXT,
    type TEXT,
    breed TEXT,
    age TEXT,
    gender TEXT,
    description TEXT,
    image TEXT,
    location TEXT,
    center TEXT,
    source TEXT,
    detailUrl TEXT,
    tags TEXT,
    personalityTags TEXT,
    popularity INTEGER DEFAULT 0,
    viewCount INTEGER DEFAULT 0,
    favoriteCount INTEGER DEFAULT 0,
    publishedAt TIMESTAMP,
    postedDate TIMESTAMP,
    images TEXT,
    data JSON
  )`, (err) => {
    if (err) {
      console.error('❌ 创建宠物表失败:', err.message);
    } else {
      console.log('✅ 宠物表已初始化');
    }
  });
}

// 在应用退出时关闭数据库连接
process.on('exit', () => {
  db.close((err) => {
    if (err) {
      console.error('❌ 关闭数据库连接失败:', err.message);
    } else {
      console.log('✅ 数据库连接已关闭');
    }
  });
});

module.exports = db;