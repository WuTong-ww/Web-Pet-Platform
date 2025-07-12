const axios = require('axios');

// 测试图片URL是否可访问
const testImageUrl = async (url) => {
  try {
    console.log(`🧪 测试图片URL: ${url}`);
    
    const response = await axios.head(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    console.log(`✅ 图片可访问: ${response.status} - ${response.headers['content-type']}`);
    return true;
  } catch (error) {
    console.log(`❌ 图片不可访问: ${error.message}`);
    if (error.response) {
      console.log(`   状态码: ${error.response.status}`);
    }
    return false;
  }
};

// 测试一些常见的图片URL格式
const testCommonImageUrls = async () => {
  const testUrls = [
    'https://www.spca.org.hk/wp-content/uploads/2025/07/WhatsApp-Image-2025-07-11-at-11.59.42-2-rotated.jpeg',
    'https://www.spca.org.hk/wp-content/uploads/2025/01/sample.jpg',
    'https://images.unsplash.com/photo-1552053831-71594a27632d?w=400&h=400&fit=crop',
    'https://via.placeholder.com/400x400?text=Test'
  ];
  
  console.log('🧪 开始测试常见图片URL...\n');
  
  for (const url of testUrls) {
    await testImageUrl(url);
    console.log(''); // 空行分隔
    await new Promise(resolve => setTimeout(resolve, 1000)); // 等待1秒
  }
};

// 运行测试
testCommonImageUrls().catch(console.error);
