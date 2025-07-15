import React, { useState, useEffect } from 'react';

const CrawlButton = ({ onCrawlStart, onCrawlComplete, onCrawlError, disabled = false }) => {
  const [crawlStatus, setCrawlStatus] = useState('idle'); // idle, crawling, success, error
  const [crawlProgress, setCrawlProgress] = useState(0);
  const [crawlMessage, setCrawlMessage] = useState('');
  const [crawlResult, setCrawlResult] = useState(null);
  const [batchInfo, setBatchInfo] = useState(null);

  // 获取爬取状态
  const fetchCrawlStatus = async () => {
    try {
      const response = await fetch('http://localhost:8080/crawl/status');
      const data = await response.json();
      return data.crawlStatus;
    } catch (error) {
      console.error('获取爬取状态失败:', error);
      return null;
    }
  };

  useEffect(() => {
    // 定期检查爬取状态
    const interval = setInterval(async () => {
      if (crawlStatus === 'crawling') {
        const status = await fetchCrawlStatus();
        if (status) {
          console.log('爬取状态更新:', status);
        }
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [crawlStatus]);

  const handleCrawl = async () => {
    try {
      setCrawlStatus('crawling');
      setCrawlProgress(0);
      setCrawlMessage('正在连接香港SPCA网站...');
      
      if (onCrawlStart) {
        onCrawlStart();
      }

      // 模拟进度更新
      const progressInterval = setInterval(() => {
        setCrawlProgress(prev => {
          const newProgress = Math.min(prev + Math.random() * 15, 90);
          
          if (newProgress < 30) {
            setCrawlMessage('正在获取宠物列表...');
          } else if (newProgress < 60) {
            setCrawlMessage('正在抓取宠物详情...');
          } else {
            setCrawlMessage('正在处理数据...');
          }
          
          return newProgress;
        });
      }, 500);

      const response = await fetch('http://localhost:8080/crawl/china');
      
      clearInterval(progressInterval);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      setCrawlProgress(100);
      setCrawlMessage(`爬取完成！获得 ${result.count} 条数据`);
      setCrawlStatus('success');
      setCrawlResult(result);
      setBatchInfo(result.batchInfo);

      if (onCrawlComplete) {
        onCrawlComplete(result);
      }

      // 3秒后重置状态
      setTimeout(() => {
        resetStatus();
      }, 3000);

    } catch (error) {
      console.error('爬取失败:', error);
      setCrawlStatus('error');
      setCrawlMessage(`爬取失败: ${error.message}`);
      
      if (onCrawlError) {
        onCrawlError(error);
      }

      // 5秒后重置状态
      setTimeout(() => {
        resetStatus();
      }, 5000);
    }
  };

  const resetStatus = () => {
    setCrawlStatus('idle');
    setCrawlProgress(0);
    setCrawlMessage('');
    setCrawlResult(null);
    setBatchInfo(null);
  };

  const resetCrawlState = async () => {
    try {
      await fetch('http://localhost:8080/crawl/reset', { method: 'POST' });
      resetStatus();
      console.log('爬取状态已重置');
    } catch (error) {
      console.error('重置爬取状态失败:', error);
    }
  };

  return (
    <div className="bg-gradient-to-br from-blue-650 to-white-0 rounded-xl shadow-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">🕷️ 香港SPCA数据爬取</h3>
          <p className="text-sm text-gray-600">
            从香港愛護動物協会获取最新的宠物领养信息
          </p>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={handleCrawl}
            disabled={disabled || crawlStatus === 'crawling'}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              crawlStatus === 'crawling'
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : crawlStatus === 'success'
                ? 'bg-green-600 text-white'
                : crawlStatus === 'error'
                ? 'bg-red-600 text-white'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {crawlStatus === 'crawling' && (
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {crawlStatus === 'crawling' ? '爬取中...' :
             crawlStatus === 'success' ? '✅ 爬取成功' :
             crawlStatus === 'error' ? '❌ 爬取失败' :
             '🚀 开始爬取'}
          </button>
          
          <button
            onClick={resetCrawlState}
            className="px-3 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            title="重置爬取状态"
          >
            🔄
          </button>
        </div>
      </div>

      {/* 进度显示 */}
      {crawlStatus === 'crawling' && (
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>{crawlMessage}</span>
            <span>{Math.round(crawlProgress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${crawlProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* 结果显示 */}
      {crawlResult && (
        <div className="mt-4 p-4 bg-green-50 rounded-lg">
          <h4 className="font-medium text-green-900 mb-2">爬取结果</h4>
          <div className="text-sm text-green-700 space-y-1">
            <div>✅ 成功获取 {crawlResult.count} 条新数据</div>
            <div>📊 数据库总计 {crawlResult.totalCount} 条记录</div>
            {batchInfo && (
              <div>📦 批次信息: {batchInfo.message}</div>
            )}
          </div>
        </div>
      )}

      {/* 错误显示 */}
      {crawlStatus === 'error' && (
        <div className="mt-4 p-4 bg-red-50 rounded-lg">
          <h4 className="font-medium text-red-900 mb-2">爬取失败</h4>
          <div className="text-sm text-red-700">
            {crawlMessage}
          </div>
        </div>
      )}
    </div>
  );
};

export default CrawlButton;