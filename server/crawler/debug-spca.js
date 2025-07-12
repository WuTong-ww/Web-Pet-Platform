const axios = require('axios');
const cheerio = require('cheerio');

// 调试特定SPCA页面的图片结构 - 重点查找WhatsApp图片
const debugSpcaPage = async (code) => {
  try {
    const url = `https://www.spca.org.hk/what-we-do/animals-for-adoption-details/?code=${code}`;
    console.log(`🔍 调试页面: ${url}`);
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      timeout: 30000
    });
    
    const $ = cheerio.load(response.data);
    
    console.log(`📄 页面标题: ${$('title').text()}`);
    console.log(`📄 页面大小: ${response.data.length} 字符`);
    
    // 特别搜索WhatsApp图片
    console.log('\n🔍 搜索WhatsApp图片:');
    const whatsappPattern = /WhatsApp-Image-\d{4}-\d{2}-\d{2}-at-\d{2}\.\d{2}\.\d{2}[^'">\s]*/gi;
    const whatsappMatches = response.data.match(whatsappPattern);
    
    if (whatsappMatches) {
      console.log(`✅ 找到 ${whatsappMatches.length} 个WhatsApp图片:`);
      whatsappMatches.forEach((match, index) => {
        console.log(`   ${index + 1}: ${match}`);
      });
    } else {
      console.log('❌ 未找到WhatsApp图片');
    }
    
    // 搜索所有图片URL模式
    console.log('\n🖼️ 所有图片URL模式搜索:');
    const imagePatterns = [
      { name: 'WhatsApp图片', pattern: /WhatsApp-Image-[^'">\s]*/gi },
      { name: 'JPEG图片', pattern: /[^'">\s]*\.jpe?g[^'">\s]*/gi },
      { name: 'PNG图片', pattern: /[^'">\s]*\.png[^'">\s]*/gi },
      { name: 'WordPress上传', pattern: /wp-content\/uploads\/[^'">\s]*/gi },
      { name: 'HTTP图片URL', pattern: /https?:\/\/[^'">\s]+\.(jpg|jpeg|png|gif|webp)/gi }
    ];
    
    imagePatterns.forEach(({ name, pattern }) => {
      const matches = response.data.match(pattern);
      if (matches) {
        console.log(`\n📸 ${name}: 找到 ${matches.length} 个`);
        matches.slice(0, 3).forEach((match, i) => {
          console.log(`   ${i + 1}: ${match}`);
        });
      }
    });
    
    // 分析页面结构
    console.log('\n🏗️ 页面结构分析:');
    console.log(`   H1标签: ${$('h1').length} 个`);
    console.log(`   IMG标签: ${$('img').length} 个`);
    console.log(`   DIV标签: ${$('div').length} 个`);
    
    // 详细分析所有图片
    console.log('\n🖼️ 所有图片详细信息:');
    $('img').each((index, img) => {
      const src = $(img).attr('src');
      const dataSrc = $(img).attr('data-src');
      const alt = $(img).attr('alt');
      const className = $(img).attr('class');
      const id = $(img).attr('id');
      const width = $(img).attr('width');
      const height = $(img).attr('height');
      
      console.log(`\n   图片 ${index + 1}:`);
      console.log(`     src: ${src}`);
      console.log(`     data-src: ${dataSrc}`);
      console.log(`     alt: ${alt}`);
      console.log(`     class: ${className}`);
      console.log(`     id: ${id}`);
      console.log(`     width: ${width}`);
      console.log(`     height: ${height}`);
      
      // 检查父元素
      const parent = $(img).parent();
      console.log(`     父元素: ${parent.prop('tagName')} (class: ${parent.attr('class')})`);
    });
    
    // 检查懒加载图片
    console.log('\n🔄 懒加载图片:');
    $('[data-src]').each((index, el) => {
      console.log(`   ${index + 1}: ${$(el).attr('data-src')}`);
    });
    
    // 检查背景图片
    console.log('\n🎨 背景图片:');
    $('[style*="background-image"]').each((index, el) => {
      const style = $(el).attr('style');
      console.log(`   ${index + 1}: ${style}`);
    });
    
    // 搜索可能的图片容器
    console.log('\n📦 可能的图片容器:');
    const containers = [
      '.pet-image', '.animal-image', '.pet-photo', '.animal-photo',
      '.gallery', '.image-gallery', '.pet-gallery', '.photos',
      '.main-image', '.featured-image', '.primary-image'
    ];
    
    containers.forEach(container => {
      const found = $(container);
      if (found.length > 0) {
        console.log(`   找到容器 ${container}: ${found.length} 个`);
        found.each((i, el) => {
          console.log(`     内容: ${$(el).text().substring(0, 100)}...`);
        });
      }
    });
    
    // 搜索特定关键词
    console.log('\n🔍 关键词搜索:');
    const keywords = ['jpg', 'jpeg', 'png', 'image', 'photo', 'picture'];
    keywords.forEach(keyword => {
      const count = (response.data.match(new RegExp(keyword, 'gi')) || []).length;
      console.log(`   "${keyword}": ${count} 次`);
    });
    
    // 输出页面的主要内容区域
    console.log('\n📝 主要内容区域:');
    const mainContent = $('main').text() || $('.content').text() || $('.main-content').text();
    if (mainContent) {
      console.log(`   长度: ${mainContent.length}`);
      console.log(`   前200字符: ${mainContent.substring(0, 200)}...`);
    }
    
  } catch (error) {
    console.error('❌ 调试失败:', error.message);
  }
};

// 专门测试图片提取的函数
const testImageExtraction = async (code) => {
  try {
    const url = `https://www.spca.org.hk/what-we-do/animals-for-adoption-details?code=${code}`;
    console.log(`🧪 测试图片提取: ${url}`);
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      timeout: 30000
    });
    
    const $ = cheerio.load(response.data);
    const pageContent = response.data;
    
    console.log(`📄 页面大小: ${response.data.length} 字符`);
    
    // 测试所有WordPress图片模式
    console.log('\n🔍 测试WordPress图片模式:');
    const wpPatterns = [
      { name: 'WhatsApp完整路径', pattern: /wp-content\/uploads\/\d{4}\/\d{2}\/WhatsApp-Image-[^'">\s]+\.(?:jpg|jpeg|png|gif|webp)/gi },
      { name: 'WhatsApp相对路径', pattern: /\/wp-content\/uploads\/[^'">\s]*WhatsApp-Image-[^'">\s]+\.(?:jpg|jpeg|png|gif|webp)/gi },
      { name: 'WordPress完整URL', pattern: /https?:\/\/[^'">\s]*\/wp-content\/uploads\/[^'">\s]+\.(?:jpg|jpeg|png|gif|webp)/gi },
      { name: 'WordPress相对路径', pattern: /\/wp-content\/uploads\/[^'">\s]+\.(?:jpg|jpeg|png|gif|webp)/gi },
      { name: 'WhatsApp基础模式', pattern: /WhatsApp-Image-\d{4}-\d{2}-\d{2}-at-\d{2}\.\d{2}\.\d{2}[^'">\s]*\.(?:jpg|jpeg|png|gif|webp)/gi }
    ];
    
    wpPatterns.forEach(({ name, pattern }) => {
      const matches = pageContent.match(pattern);
      if (matches) {
        console.log(`\n✅ ${name}: 找到 ${matches.length} 个`);
        matches.slice(0, 3).forEach((match, i) => {
          console.log(`   ${i + 1}: ${match}`);
          
          // 构建完整URL并测试
          let fullUrl = match;
          if (match.startsWith('/wp-content')) {
            fullUrl = 'https://www.spca.org.hk' + match;
          } else if (match.startsWith('wp-content')) {
            fullUrl = 'https://www.spca.org.hk/' + match;
          }
          console.log(`      完整URL: ${fullUrl}`);
        });
      } else {
        console.log(`❌ ${name}: 未找到`);
      }
    });
    
    // 测试img标签
    console.log('\n🖼️ 分析img标签:');
    $('img').each((index, img) => {
      const src = $(img).attr('src');
      const dataSrc = $(img).attr('data-src');
      const alt = $(img).attr('alt');
      
      if (src || dataSrc) {
        console.log(`\n   图片 ${index + 1}:`);
        console.log(`     src: ${src}`);
        console.log(`     data-src: ${dataSrc}`);
        console.log(`     alt: ${alt}`);
        
        // 检查是否是WordPress上传的图片
        const imageUrl = src || dataSrc;
        if (imageUrl && imageUrl.includes('wp-content')) {
          console.log(`     ✅ WordPress图片!`);
        }
        if (imageUrl && imageUrl.toLowerCase().includes('whatsapp')) {
          console.log(`     🎯 WhatsApp图片!`);
        }
      }
    });
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
};

// 运行调试
if (require.main === module) {
  // 使用您提供的真实代码
  debugSpcaPage('541923');
  // 测试你提供的真实代码
  testImageExtraction('595784');
}

module.exports = { debugSpcaPage, testImageExtraction };
