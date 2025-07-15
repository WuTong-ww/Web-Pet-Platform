import React, { useState, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import clsx from 'clsx';
import { useAI } from '../../contexts/AIContext';
import { marked } from 'marked';
import styles from './AIAssistant.css';
// 消息组件
const Message = ({ message, onRegenerate }) => {
  const { type, content, timestamp, isEmergency, model } = message;

  return (
    <div className={`flex ${type === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={clsx(
          'max-w-xs lg:max-w-md px-4 py-3 rounded-lg relative',
          type === 'user' && 'bg-blue-600 text-white',
          type === 'bot' && !isEmergency && 'bg-gray-100 text-gray-800',
          type === 'bot' && isEmergency && 'bg-red-50 text-red-800 border-l-4 border-red-500',
          type === 'error' && 'bg-red-100 text-red-800'
        )}
      >
        {/* 紧急模式标识 */}
        {isEmergency && type === 'bot' && (
          <div className="flex items-center mb-2 text-red-600">
            <span className="text-sm font-semibold">🚨 急诊模式</span>
          </div>
        )}

        {/* 消息内容 */}
        <div
          className="whitespace-pre-wrap"
          dangerouslySetInnerHTML={{ __html: marked(content) }} // 使用 marked 解析 Markdown
        ></div>

        {/* 时间戳和模型信息 */}
        <div className="flex items-center justify-between mt-2 text-xs opacity-70">
          <span>{format(timestamp, 'HH:mm', { locale: zhCN })}</span>
          {model && model !== 'fallback' && (
            <span className="ml-2">by {model}</span>
          )}
        </div>

        {/* 重新生成按钮 */}
        {type === 'bot' && onRegenerate && (
          <button
            onClick={onRegenerate}
            className="absolute -bottom-6 right-0 text-xs text-gray-500 hover:text-gray-700 transition-colors"
          >
            🔄 重新生成
          </button>
        )}
      </div>
    </div>
  );
};

// 快速回复组件
const QuickReplies = ({ quickReplies, onQuickReply, isLoading }) => {
  const categoryColors = {
    health: 'bg-green-100 text-green-700 hover:bg-green-200',
    training: 'bg-blue-100 text-blue-700 hover:bg-blue-200',
    medical: 'bg-red-100 text-red-700 hover:bg-red-200',
    care: 'bg-purple-100 text-purple-700 hover:bg-purple-200',
    nutrition: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200',
    emergency: 'bg-red-200 text-red-800 hover:bg-red-300'
  };

  return (
    <div className="p-4 border-t bg-gray-50">
      <div className="text-sm text-gray-600 mb-3">💡 快速咨询</div>
      <div className="grid grid-cols-2 gap-2">
        {quickReplies.map((reply, index) => (
          <button
            key={index}
            onClick={() => onQuickReply(reply)}
            disabled={isLoading}
            className={clsx(
              'text-xs p-2 rounded-lg transition-colors text-left',
              categoryColors[reply.category] || 'bg-gray-100 text-gray-700 hover:bg-gray-200',
              isLoading && 'opacity-50 cursor-not-allowed'
            )}
          >
            {reply.text}
          </button>
        ))}
      </div>
    </div>
  );
};

// 紧急处理提示组件
const EmergencyTips = ({ emergencyTips }) => {
  const [selectedTip, setSelectedTip] = useState(null);

  return (
    <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
      <h3 className="text-lg font-semibold text-red-800 mb-3">🚨 紧急情况处理指南</h3>
      <div className="grid md:grid-cols-3 gap-4">
        {emergencyTips.map((tip, index) => (
          <div
            key={index}
            className="bg-white p-3 rounded-lg border border-red-200 cursor-pointer hover:bg-red-50 transition-colors"
            onClick={() => setSelectedTip(selectedTip === index ? null : index)}
          >
            <h4 className="font-medium text-red-800 mb-2">{tip.title}</h4>
            {selectedTip === index && (
              <ul className="text-sm text-red-700 space-y-1">
                {tip.tips.map((tipItem, tipIndex) => (
                  <li key={tipIndex} className="flex items-start">
                    <span className="text-red-500 mr-2">•</span>
                    {tipItem}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// 打字效果组件
const TypingIndicator = () => {
  return (
    <div className="flex justify-start mb-4">
      <div className="bg-gray-100 px-4 py-3 rounded-lg">
        <div className="flex items-center space-x-1">
          <span className="text-sm text-gray-600">小助手正在思考</span>
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

// 主AI助手组件
const AIAssistant = () => {
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const {
    messages,
    isLoading,
    error,
    quickReplies,
    emergencyTips,
    capabilities,
    sendMessage,
    sendQuickReply,
    clearConversation,
    regenerateResponse
  } = useAI();

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // 聚焦输入框
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const message = inputMessage.trim();
    setInputMessage('');
    await sendMessage(message);
  };

  const handleQuickReply = async (reply) => {
    await sendQuickReply(reply);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* AI能力介绍 */}
      {capabilities && (
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{capabilities.title}</h2>
          <p className="text-gray-600 mb-6">{capabilities.description}</p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {capabilities.capabilities.map((capability, index) => (
              <div key={index} className="bg-gray-50 p-4 rounded-lg">
                <div className="text-2xl mb-2">{capability.icon}</div>
                <h4 className="font-medium text-gray-900 mb-1">{capability.title}</h4>
                <p className="text-sm text-gray-600">{capability.description}</p>
              </div>
            ))}
          </div>

          {/* 急诊模式说明 */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="font-medium text-red-800 mb-2">{capabilities.emergencyMode.title}</h4>
            <p className="text-sm text-red-700">{capabilities.emergencyMode.description}</p>
          </div>
        </div>
      )}

      {/* 紧急处理提示 */}
      <EmergencyTips emergencyTips={emergencyTips} />

      {/* 对话界面 */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* 头部 */}
        <div className="bg-gradient-to-r from-blue-300 to-purple-400 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                <span className="text-xl">🐾</span>
              </div>
              <div>
                <h3 className="text-white font-semibold">Petpet</h3>
                <p className="text-blue-100 text-sm">AI宠物健康助手</p>
              </div>
            </div>
            <button
              onClick={clearConversation}
              className="text-white hover:text-blue-100 transition-colors"
              title="清空对话"
            >
              🗑️
            </button>
          </div>
        </div>

        {/* 消息区域 */}
        <div className="h-96 overflow-y-auto p-4">
          {error && (
            <div className="bg-red-100 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {messages.map((message, index) => (
            <Message
              key={message.id}
              message={message}
              onRegenerate={index === messages.length - 1 && message.type === 'bot' ? regenerateResponse : null}
            />
          ))}
          
          {isLoading && <TypingIndicator />}
          
          <div ref={messagesEndRef} />
        </div>

        {/* 快速回复 */}
        <QuickReplies
          quickReplies={quickReplies}
          onQuickReply={handleQuickReply}
          isLoading={isLoading}
        />

        {/* 输入区域 */}
        <form onSubmit={handleSendMessage} className="p-4 border-t">
          <div className="flex space-x-3">
            <textarea
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="请输入您的问题... (按Enter发送，Shift+Enter换行)"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows="3"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isLoading}
              className={clsx(
                'px-6 py-3 rounded-lg font-medium transition-all',
                !inputMessage.trim() || isLoading
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg transform hover:scale-105'
              )}
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  发送中...
                </span>
              ) : (
                '发送'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AIAssistant;