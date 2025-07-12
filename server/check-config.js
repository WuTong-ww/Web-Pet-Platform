const fs = require('fs');
const path = require('path');

// 检查环境配置
console.log('🔍 检查环境配置...\n');

// 检查环境变量
console.log('📋 环境变量:');
console.log(`   PETFINDER_API_KEY: ${process.env.PETFINDER_API_KEY ? '已设置' : '未设置'}`);
console.log(`   PETFINDER_SECRET: ${process.env.PETFINDER_SECRET ? '已设置' : '未设置'}`);
console.log(`   PORT: ${process.env.PORT || '未设置 (将使用默认值 8080)'}`);

// 检查.env文件
const envFile = path.join(__dirname, '../.env');
console.log(`\n📄 .env文件: ${fs.existsSync(envFile) ? '存在' : '不存在'}`);

if (fs.existsSync(envFile)) {
  const envContent = fs.readFileSync(envFile, 'utf-8');
  console.log('   内容预览:');
  envContent.split('\n').forEach((line, index) => {
    if (line.trim() && !line.startsWith('#')) {
      const [key] = line.split('=');
      console.log(`     ${index + 1}. ${key}=***`);
    }
  });
}

// 检查data目录
const dataDir = path.join(__dirname, 'data');
console.log(`\n📁 数据目录: ${fs.existsSync(dataDir) ? '存在' : '不存在'}`);

if (fs.existsSync(dataDir)) {
  const files = fs.readdirSync(dataDir);
  console.log(`   文件数量: ${files.length}`);
  files.forEach(file => {
    const filePath = path.join(dataDir, file);
    const stats = fs.statSync(filePath);
    console.log(`     ${file}: ${stats.size} 字节, 修改时间: ${stats.mtime.toLocaleString('zh-CN')}`);
  });
}

// 测试网络连接
console.log(`\n🌐 测试网络连接...`);
const axios = require('axios');

const testUrls = [
  'https://api.petfinder.com/v2/oauth2/token',
  'https://www.spca.org.hk/',
  'https://images.unsplash.com/photo-1552053831-71594a27632d?w=100&h=100'
];

const testConnections = async () => {
  for (const url of testUrls) {
    try {
      const response = await axios.head(url, { timeout: 5000 });
      console.log(`   ✅ ${url}: ${response.status}`);
    } catch (error) {
      console.log(`   ❌ ${url}: ${error.message}`);
    }
  }
};

testConnections();
