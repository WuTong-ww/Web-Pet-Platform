import React from 'react';
import { isPlatformCrawlable } from '../../services/locationService';

const PlatformList = ({ platforms }) => {
  if (!platforms || platforms.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="text-4xl mb-3">🏢</div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">暂无平台数据</h3>
        <p className="text-gray-600">该地区暂时没有可用的领养平台信息</p>
      </div>
    );
  }
  
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {platforms.map(platform => {
        // 判断平台是否支持爬取
        const crawlable = isPlatformCrawlable(platform.id);
        
        return (
          <div key={platform.id} className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-12 h-12 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 text-2xl mr-3">
                    {platform.logo || '🏢'}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{platform.name}</h3>
                    <p className="text-sm text-gray-500">{platform.type}</p>
                  </div>
                </div>
                
                {crawlable && (
                  <div className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">
                    支持数据爬取
                  </div>
                )}
              </div>
              
              <p className="text-gray-600 text-sm mb-4">{platform.description}</p>
              
              {/* 联系方式 */}
              <div className="mb-4">
                <h4 className="font-medium text-gray-700 mb-2">联系方式</h4>
                <div className="space-y-1 text-sm">
                  {platform.contact?.phone && (
                    <div className="flex items-center">
                      <span className="mr-2">📞</span>
                      <a href={`tel:${platform.contact.phone}`} className="text-blue-600 hover:underline">
                        {platform.contact.phone}
                      </a>
                    </div>
                  )}
                  
                  {platform.contact?.email && (
                    <div className="flex items-center">
                      <span className="mr-2">✉️</span>
                      <a href={`mailto:${platform.contact.email}`} className="text-blue-600 hover:underline">
                        {platform.contact.email}
                      </a>
                    </div>
                  )}
                  
                  {platform.contact?.address && (
                    <div className="flex items-center">
                      <span className="mr-2">📍</span>
                      <span>{platform.contact.address}</span>
                    </div>
                  )}
                  
                  {platform.contact?.wechat && (
                    <div className="flex items-center">
                      <span className="mr-2">💬</span>
                      <span>微信: {platform.contact.wechat}</span>
                    </div>
                  )}
                  
                  {platform.contact?.weibo && (
                    <div className="flex items-center">
                      <span className="mr-2">🔄</span>
                      <span>微博: {platform.contact.weibo}</span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* 特点标签 */}
              {platform.features && platform.features.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-medium text-gray-700 mb-2">平台特点</h4>
                  <div className="flex flex-wrap gap-2">
                    {platform.features.map((feature, index) => (
                      <span key={index} className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs">
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* 访问网站按钮 */}
            <div className="px-6 pb-6">
              <a 
                href={platform.url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="block w-full py-2 bg-purple-500 hover:bg-blue-700 text-white text-center rounded-lg transition-colors"
              >
                访问官网
              </a>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PlatformList;