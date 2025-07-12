const { crawlSpcaPets, resetCrawlState } = require('./crawler/spca');
const fs = require('fs');
const path = require('path');

const quickTest = async () => {
  console.log('🚀 快速测试SPCA爬取功能...\n');
  
  try {
    // 检查并创建data目录
    const dataDir = path.join(__dirname, 'data');
    if (!fs.existsSync(dataDir)) {
      console.log('📁 创建data目录...');
      fs.mkdirSync(dataDir, { recursive: true });
      console.log('✅ data目录创建成功');
    } else {
      console.log('📁 data目录已存在');
    }
    
    // 重置状态
    resetCrawlState();
    console.log('✅ 爬取状态已重置\n');
    
    // 执行爬取
    console.log('📡 开始爬取...');
    const result = await crawlSpcaPets(true);
    
    console.log('\n🎉 爬取完成!');
    console.log('📊 结果统计:');
    console.log(`   - 成功: ${result.success}`);
    console.log(`   - 数量: ${result.count}`);
    console.log(`   - 总数: ${result.totalCount}`);
    console.log(`   - 消息: ${result.message}`);
    
    if (result.batchInfo) {
      console.log(`   - 批次信息: ${result.batchInfo.currentBatch}/${result.batchInfo.totalBatches}`);
      console.log(`   - 是否完成: ${result.batchInfo.isComplete}`);
    }
    
    // 检查数据文件
    const dataFile = path.join(__dirname, 'data/chinaPets.json');
    if (fs.existsSync(dataFile)) {
      const content = fs.readFileSync(dataFile, 'utf-8');
      const data = JSON.parse(content);
      console.log(`✅ 数据文件已创建，包含 ${data.length} 条记录`);
      
      // 显示前几条数据的摘要
      if (data.length > 0) {
        console.log('\n📝 数据示例:');
        data.slice(0, 3).forEach((pet, index) => {
          console.log(`   ${index + 1}. ${pet.name} (${pet.type}, ${pet.breed}) - ${pet.source}`);
        });
      }
    } else {
      console.log('❌ 数据文件未创建');
    }
    
  } catch (error) {
    console.error('❌ 快速测试失败:', error.message);
    console.error('详细错误:', error);
  }
};

quickTest();
