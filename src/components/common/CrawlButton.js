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
      const result = await response.json();
      
      if (result.status === 'success') {
        setBatchInfo(result.crawlStatus);
      }
    } catch (error) {
      console.error('获取爬取状态失败:', error);
    }
  };

  useEffect(() => {
    fetchCrawlStatus();
  }, []);

  const handleCrawl = async () => {
    try {
      setCrawlStatus('crawling');
      setCrawlProgress(0);
      setCrawlMessage('正在连接香港SPCA网站...');
      setCrawlResult(null);

      if (onCrawlStart) {
        onCrawlStart();
      }

      // 模拟进度更新
      const progressInterval = setInterval(() => {
        setCrawlProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + Math.random() * 10;
        });
      }, 500);

      // 调用后端API
      const response = await fetch('http://localhost:8080/crawl/china', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      clearInterval(progressInterval);
      setCrawlProgress(100);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.status === 'success') {
        setCrawlStatus('success');
        setCrawlMessage(result.message);
        setCrawlResult(result);
        setBatchInfo(result.batchInfo);
        
        if (onCrawlComplete) {
          onCrawlComplete(result);
        }
      } else {
        throw new Error(result.message || '爬取失败');
      }

    } catch (error) {
      console.error('爬取失败:', error);
      setCrawlStatus('error');
      setCrawlMessage(`爬取失败: ${error.message}`);
      setCrawlProgress(0);
      
      if (onCrawlError) {
        onCrawlError(error);
      }
    }
  };

  const resetStatus = () => {
    setCrawlStatus('idle');
    setCrawlProgress(0);
    setCrawlMessage('');
    setCrawlResult(null);
  };

  const resetCrawlState = async () => {
    try {
      const response = await fetch('http://localhost:8080/crawl/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setBatchInfo(null);
        resetStatus();
        alert('爬取状态已重置！');
      }
    } catch (error) {
      console.error('重置失败:', error);
      alert('重置失败，请稍后重试');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">🕷️ 香港SPCA数据爬取</h3>
          <p className="text-sm text-gray-600">
            分批获取宠物数据，每次爬取10条信息
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          {crawlStatus === 'success' && (
            <button
              onClick={resetStatus}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              清除状态
            </button>
          )}
          
          <button
            onClick={handleCrawl}
            disabled={disabled || crawlStatus === 'crawling'}
            className={`px-6 py-2 rounded-lg font-medium transition-all ${
              disabled || crawlStatus === 'crawling'
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : crawlStatus === 'success'
                ? 'bg-green-600 text-white hover:bg-green-700'
                : crawlStatus === 'error'
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:shadow-lg transform hover:scale-105'
            }`}
          >
            {crawlStatus === 'crawling' && (
              <span className="inline-flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                爬取中...
              </span>
            )}
            {crawlStatus === 'success' && (
              <span className="inline-flex items-center">
                ✅ 继续爬取
              </span>
            )}
            {crawlStatus === 'error' && (
              <span className="inline-flex items-center">
                ❌ 重新爬取
              </span>
            )}
            {crawlStatus === 'idle' && (
              <span className="inline-flex items-center">
                🚀 开始爬取
              </span>
            )}
          </button>
        </div>
      </div>

      {/* 批次信息显示 */}
      {batchInfo && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600">当前批次:</span>
              <span className="ml-2 font-semibold text-blue-600">
                {batchInfo.currentBatch}/{batchInfo.totalBatches}
              </span>
            </div>
            <div>
              <span className="text-gray-600">已处理:</span>
              <span className="ml-2 font-semibold text-green-600">
                {batchInfo.processedCount}只
              </span>
            </div>
            <div>
              <span className="text-gray-600">总可用:</span>
              <span className="ml-2 font-semibold text-purple-600">
                {batchInfo.totalAvailable}只
              </span>
            </div>
            <div>
              <span className="text-gray-600">下批数量:</span>
              <span className="ml-2 font-semibold text-orange-600">
                {batchInfo.hasMoreData ? `${batchInfo.nextBatchSize}只` : '无更多'}
              </span>
            </div>
          </div>
          
          {!batchInfo.hasMoreData && (
            <div className="mt-2 flex items-center justify-between">
              <span className="text-sm text-green-600">✅ 所有数据已爬取完成</span>
              <button
                onClick={resetCrawlState}
                className="text-sm text-blue-600 hover:text-blue-800 underline"
              >
                重置状态
              </button>
            </div>
          )}
        </div>
      )}

      {/* 进度条 */}
      {crawlStatus === 'crawling' && (
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>爬取进度</span>
            <span>{Math.round(crawlProgress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${crawlProgress}%` }}
            ></div>
          </div>
          <div className="mt-1 text-sm text-gray-600">{crawlMessage}</div>
        </div>
      )}

      {/* 爬取消息 */}
      {crawlMessage && crawlStatus !== 'crawling' && (
        <div className={`mb-4 p-3 rounded-lg ${
          crawlStatus === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {crawlMessage}
        </div>
      )}

      {/* 爬取结果 */}
      {crawlResult && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">爬取结果</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">本批次宠物:</span>
              <span className="ml-2 font-semibold text-green-600">{crawlResult.count}</span>
            </div>
            <div>
              <span className="text-gray-600">总宠物数:</span>
              <span className="ml-2 font-semibold text-blue-600">{crawlResult.totalCount}</span>
            </div>
            {crawlResult.batchInfo && (
              <>
                <div>
                  <span className="text-gray-600">批次进度:</span>
                  <span className="ml-2 font-semibold text-purple-600">
                    {crawlResult.batchInfo.currentBatch}/{crawlResult.batchInfo.totalBatches}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">完成状态:</span>
                  <span className={`ml-2 font-semibold ${
                    crawlResult.batchInfo.isComplete ? 'text-green-600' : 'text-orange-600'
                  }`}>
                    {crawlResult.batchInfo.isComplete ? '全部完成' : '可继续'}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* 使用说明 */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <h4 className="text-sm font-medium text-blue-900 mb-1">💡 使用说明</h4>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• 每次点击爬取10只宠物的详细信息</li>
          <li>• 支持多次点击获取更多数据</li>
          <li>• 所有数据会自动保存并去重</li>
          <li>• 完成后可访问原网站获取更多信息</li>
          <li>• 爬取状态持久化，服务器重启后可重置继续</li>
        </ul>
      </div>
    </div>
  );
};

export default CrawlButton;