// 移除 Petfinder API 代理配置，现在使用后端代理
// 如果需要其他代理，可以在这里添加

module.exports = function(app) {
  // 可以在这里添加其他需要代理的服务
  console.log('前端代理配置已加载，当前使用后端代理访问 Petfinder API');
};
