import React, { createContext, useContext, useState, useEffect } from 'react';
import { getAIResponse, getQuickReplies, getEmergencyQuickTips, getAICapabilities } from '../services/aiService';

const AIContext = createContext();

export const useAI = () => {
  const context = useContext(AIContext);
  if (!context) {
    throw new Error('useAI must be used within an AIProvider');
  }
  return context;
};

export const AIProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [quickReplies, setQuickReplies] = useState([]);
  const [emergencyTips, setEmergencyTips] = useState([]);
  const [capabilities, setCapabilities] = useState(null);

  // 初始化AI助手
  useEffect(() => {
    initializeAI();
  }, []);

  const initializeAI = async () => {
    try {
      // 设置初始消息
      const welcomeMessage = {
        id: `msg_${Date.now()}`,
        type: 'bot',
        content: '您好！我是Petpet宠物助手，您的专业宠物健康咨询助手。🐾\n\n我可以帮您解答宠物饲养、训练、健康等问题，还提供24小时急诊咨询服务。请问有什么可以帮助您的吗？',
        timestamp: new Date(),
        isEmergency: false
      };

      setMessages([welcomeMessage]);
      setQuickReplies(getQuickReplies());
      setEmergencyTips(getEmergencyQuickTips());
      setCapabilities(getAICapabilities());
    } catch (error) {
      console.error('AI初始化失败:', error);
      setError('AI助手初始化失败，请刷新页面重试');
    }
  };

  // 发送消息
  const sendMessage = async (userMessage) => {
    if (!userMessage.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      // 添加用户消息
      const userMsg = {
        id: `msg_${Date.now()}`,
        type: 'user',
        content: userMessage,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, userMsg]);

      // 更新对话历史
      const newHistory = [
        ...conversationHistory,
        { role: 'user', content: userMessage }
      ];

      // 获取AI回复
      const aiResponse = await getAIResponse(userMessage, newHistory);

      // 添加AI回复
      const botMsg = {
        id: `msg_${Date.now() + 1}`,
        type: 'bot',
        content: aiResponse.content,
        timestamp: new Date(),
        isEmergency: aiResponse.isEmergency,
        model: aiResponse.model,
        usage: aiResponse.usage
      };

      setMessages(prev => [...prev, botMsg]);

      // 更新对话历史
      setConversationHistory([
        ...newHistory,
        { role: 'assistant', content: aiResponse.content }
      ]);

      // 如果是紧急情况，显示特殊提示
      if (aiResponse.isEmergency) {
        console.log('🚨 检测到紧急情况，已切换到急诊模式');
      }

    } catch (error) {
      console.error('发送消息失败:', error);
      setError('发送消息失败，请稍后重试');
      
      // 添加错误消息
      const errorMsg = {
        id: `msg_${Date.now()}`,
        type: 'error',
        content: '抱歉，我暂时无法回复您的问题。请稍后重试，或者联系客服获取帮助。',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  // 发送快速回复
  const sendQuickReply = async (quickReply) => {
    await sendMessage(quickReply.text);
  };

  // 清空对话
  const clearConversation = () => {
    setMessages([]);
    setConversationHistory([]);
    setError(null);
    initializeAI();
  };

  // 重新生成最后一条回复
  const regenerateResponse = async () => {
    if (messages.length < 2) return;

    const lastUserMessage = messages
      .slice()
      .reverse()
      .find(msg => msg.type === 'user');

    if (!lastUserMessage) return;

    // 移除最后一条AI回复
    setMessages(prev => prev.filter(msg => 
      !(msg.type === 'bot' && msg.timestamp > lastUserMessage.timestamp)
    ));

    // 重新发送消息
    await sendMessage(lastUserMessage.content);
  };

  const value = {
    messages,
    isLoading,
    error,
    quickReplies,
    emergencyTips,
    capabilities,
    conversationHistory,
    sendMessage,
    sendQuickReply,
    clearConversation,
    regenerateResponse
  };

  return (
    <AIContext.Provider value={value}>
      {children}
    </AIContext.Provider>
  );
};