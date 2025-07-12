const axios = require('axios');

const testImageProxy = async () => {
  console.log('🧪 测试图片代理功能...\n');
  
  const testImages = [
    'https://www.spca.org.hk/wp-content/uploads/2025/07/WhatsApp-Image-2025-07-11-at-11.59.42-2-rotated.jpeg',
    'https://images.unsplash.com/photo-1552053831-71594a27632d?w=400&h=400&fit=crop'
  ];
  
  for (const imageUrl of testImages) {
    try {
      console.log(`🔍 测试图片: ${imageUrl}`);
      
      const proxyUrl = `http://localhost:8080/proxy/image?url=${encodeURIComponent(imageUrl)}`;
      console.log(`📡 代理URL: ${proxyUrl}`);
      
      const response = await axios.head(proxyUrl, {
        timeout: 10000
      });
      
      console.log(`✅ 代理成功: ${response.status} - ${response.headers['content-type']}`);
      console.log(`📏 内容长度: ${response.headers['content-length']} 字节\n`);
      
    } catch (error) {
      console.log(`❌ 代理失败: ${error.message}`);
      if (error.response) {
        console.log(`   状态码: ${error.response.status}`);
        console.log(`   响应: ${JSON.stringify(error.response.data, null, 2)}`);
      }
      console.log('');
    }
  }
};

// 首先检查服务器是否运行
const checkServer = async () => {
  try {
    const response = await axios.get('http://localhost:8080/health');
    console.log('✅ 服务器运行正常\n');
    return true;
  } catch (error) {
    console.log('❌ 服务器未运行，请先启动服务器: node index.js\n');
    return false;
  }
};

const runTest = async () => {
  const serverRunning = await checkServer();
  if (serverRunning) {
    await testImageProxy();
  }
};

runTest().catch(console.error);
