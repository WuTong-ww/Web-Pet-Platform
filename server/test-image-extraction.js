const { testImageExtraction } = require('./crawler/debug-spca');

console.log('🧪 开始测试SPCA图片提取功能...\n');

// 测试你提供的真实代码
const testCodes = ['595784', '541923', '536845'];

const runTests = async () => {
  for (const code of testCodes) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`测试代码: ${code}`);
    console.log(`${'='.repeat(60)}\n`);
    
    await testImageExtraction(code);
    
    // 等待一下避免请求过快
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log('\n🎉 测试完成!');
};

runTests().catch(console.error);
