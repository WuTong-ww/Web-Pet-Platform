const fs = require('fs');
const path = require('path');
const axios = require('axios');

// 检查现有数据中的图片URL
const checkExistingImageUrls = async () => {
  try {
    const dataFile = path.join(__dirname, 'data/chinaPets.json');
    
    if (!fs.existsSync(dataFile)) {
      console.log('❌ 数据文件不存在');
      return;
    }
    
    const content = fs.readFileSync(dataFile, 'utf-8');
    const pets = JSON.parse(content);
    
    console.log(`📊 检查 ${pets.length} 只宠物的图片URL...\n`);
    
    let validCount = 0;
    let invalidCount = 0;
    
    for (let i = 0; i < Math.min(pets.length, 10); i++) { // 只检查前10个
      const pet = pets[i];
      console.log(`🔍 检查宠物: ${pet.name} (${pet.source})`);
      console.log(`   主图片: ${pet.image}`);
      
      if (pet.images && pet.images.length > 0) {
        console.log(`   图片数组 (${pet.images.length}张):`);
        for (let j = 0; j < Math.min(pet.images.length, 3); j++) {
          console.log(`     ${j + 1}: ${pet.images[j]}`);
        }
      } else {
        console.log(`   图片数组: 空`);
      }
      
      // 测试主图片是否可访问
      if (pet.image) {
        try {
          const response = await axios.head(pet.image, {
            timeout: 5000,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
          });
          console.log(`   ✅ 主图片可访问: ${response.status}`);
          validCount++;
        } catch (error) {
          console.log(`   ❌ 主图片不可访问: ${error.message}`);
          invalidCount++;
        }
      }
      
      console.log(''); // 空行分隔
      
      // 等待一下避免请求过快
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log(`📈 图片检查统计:`);
    console.log(`   可访问: ${validCount}`);
    console.log(`   不可访问: ${invalidCount}`);
    
  } catch (error) {
    console.error('❌ 检查失败:', error);
  }
};

// 运行检查
checkExistingImageUrls();
