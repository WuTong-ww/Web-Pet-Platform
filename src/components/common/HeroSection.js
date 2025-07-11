import React from 'react';
import { Link } from 'react-router-dom';

const HeroSection = () => {
  return (
    <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl shadow-xl overflow-hidden mb-10">
      <div className="md:flex md:items-center">
        <div className="md:w-1/2 p-8 md:p-12">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            寻找您的完美伴侣
          </h1>
          <p className="text-purple-100 mb-6">
            浏览全球各地的待领养宠物，找到您命中注定的毛茸茸朋友。
            我们连接您与世界各地的领养平台，助您完成爱的领养。
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              to="/search"
              className="px-6 py-3 bg-white text-purple-700 rounded-lg font-medium hover:bg-purple-50 transition-colors"
            >
              开始搜索 →
            </Link>
            <Link
              to="/platforms"
              className="px-6 py-3 bg-purple-700 bg-opacity-30 text-white rounded-lg font-medium hover:bg-opacity-40 transition-colors"
            >
              浏览领养平台
            </Link>
          </div>
        </div>
        <div className="md:w-1/2 relative h-64 md:h-auto">
          <div className="absolute inset-0 bg-gradient-to-tr from-purple-700 to-transparent opacity-30"></div>
          <img 
            src="https://images.unsplash.com/photo-1583337130417-3346a1be7dee?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80" 
            alt="Happy pets" 
            className="w-full h-full object-cover"
          />
        </div>
      </div>
      <div className="px-8 py-4 bg-blue-700 bg-opacity-30 flex flex-wrap justify-between text-white text-sm">
        <div>🌎 覆盖全球多个国家和地区的领养平台</div>
        <div>🐱 超过10,000只宠物等待您的领养</div>
        <div>❤️ 与专业领养机构合作</div>
      </div>
    </div>
  );
};

export default HeroSection;