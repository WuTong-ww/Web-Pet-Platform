const axios = require('axios');

const testServer = async () => {
  const baseURL = 'http://localhost:8080';
  
  console.log('🧪 开始测试服务器...');
  console.log('🌐 测试 URL:', baseURL);
  
  try {
    // 1. 测试基本连接
    console.log('\n1. 测试基本连接...');
    const response = await axios.get(`${baseURL}/`, {
      timeout: 5000,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Test-Client'
      }
    });
    console.log('✅ 基本连接成功:', response.status, response.statusText);
    console.log('📄 响应数据:', response.data);
    
  } catch (error) {
    console.error('❌ 连接失败:');
    console.error('错误类型:', error.constructor.name);
    console.error('错误代码:', error.code);
    console.error('错误信息:', error.message);
    
    if (error.response) {
      console.error('服务器响应状态:', error.response.status);
      console.error('服务器响应数据:', error.response.data);
    } else if (error.request) {
      console.error('请求已发送但没有收到响应');
      console.error('请求配置:', error.config?.url);
    }
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 解决方案:');
      console.log('1. 确保服务器正在运行: node index.js');
      console.log('2. 检查端口是否被占用: netstat -ano | findstr :8080');
      console.log('3. 检查防火墙设置');
    }
    
    return;
  }
  
  // 如果基本连接成功，继续测试其他功能
  try {
    console.log('\n2. 测试健康检查...');
    const healthResponse = await axios.get(`${baseURL}/health`);
    console.log('✅ 健康检查通过:', healthResponse.data);
    
    console.log('\n3. 测试服务器状态...');
    const statusResponse = await axios.get(`${baseURL}/status`);
    console.log('✅ 服务器状态:', statusResponse.data);
    
    console.log('\n4. 测试获取中国数据...');
    const dataResponse = await axios.get(`${baseURL}/data/china`);
    console.log(`✅ 数据获取成功: ${dataResponse.data.length} 条记录`);
    
    if (dataResponse.data.length > 0) {
      console.log('📄 数据示例:', dataResponse.data[0]);
    }
    
    console.log('\n5. 测试数据生成...');
    const crawlResponse = await axios.get(`${baseURL}/crawl/china`);
    console.log('✅ 数据生成成功:', crawlResponse.data);
    
    console.log('\n🎉 所有测试通过！');
    
  } catch (error) {
    console.error('❌ 功能测试失败:', error.message);
  }
};

// 首先检查 Node.js 和依赖
console.log('📋 环境检查:');
console.log('Node.js 版本:', process.version);
console.log('当前工作目录:', process.cwd());

// 检查是否安装了 axios
try {
  console.log('Axios 版本:', require('axios/package.json').version);
} catch (err) {
  console.error('❌ Axios 未安装，请运行: npm install axios');
  process.exit(1);
}

// 检查服务器文件是否存在
const fs = require('fs');
const path = require('path');

const indexFile = path.join(__dirname, 'index.js');
if (!fs.existsSync(indexFile)) {
  console.error('❌ index.js 文件不存在');
  process.exit(1);
}

console.log('✅ 环境检查完成\n');

// 运行测试
testServer();