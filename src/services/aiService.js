import axios from 'axios';
<script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
// 后端API代理配置
const AI_API_CONFIG = {
  baseURL: 'http://localhost:8080/api/ecnu', // 使用后端代理
  timeout: 30000
};

// 创建axios实例 - 使用后端代理
const aiAPI = axios.create({
  baseURL: AI_API_CONFIG.baseURL,
  timeout: AI_API_CONFIG.timeout,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 急诊关键词检测
const EMERGENCY_KEYWORDS = [
  '呕吐', '拉稀', '腹泻', '抽搐', '昏迷', '不吃东西', '发烧', '体温高', 
  '呼吸困难', '咳嗽严重', '流血', '外伤', '误食', '中毒', '痉挛',
  '无精打采', '嗜睡', '食欲不振', '便血', '尿血', '呼吸急促',
  '口吐白沫', '站不起来', '走路不稳', '眼睛红肿', '急救', '紧急'
];

// 系统提示词
const SYSTEM_PROMPTS = {
  normal: `你是一个专业的宠物健康咨询助手，名叫"Petpet小助手"。你具有丰富的宠物医疗知识，能够为宠物主人提供专业的饲养建议、训练方法和健康咨询。

请遵循以下原则：
1. 回答要专业、准确、易懂
2. 对于严重的健康问题，建议立即就医
3. 提供具体的操作建议和注意事项
4. 保持温和、关怀的语调
5. 回答要简洁明了，分点列出重要信息

请用中文回答问题。`,

  emergency: `你是一个专业的宠物急诊医疗助手，名叫"Petpet小助手"。用户正在咨询紧急医疗问题，请立即提供紧急处理方案。

请按以下格式回答：
🚨 **紧急情况处理**

**立即采取的措施：**
[列出1-3个最紧急的处理步骤]

**就医建议：**
[说明是否需要立即就医，如何选择医院]

**注意事项：**
[列出重要的注意事项和禁忌]

**观察要点：**
[告诉主人需要观察宠物的哪些症状变化]

请用中文回答，语言要紧急但不要引起恐慌。`
};

/**
 * 检测是否为紧急情况
 */
const isEmergencyCase = (message) => {
  const lowerMessage = message.toLowerCase();
  return EMERGENCY_KEYWORDS.some(keyword => lowerMessage.includes(keyword));
};

/**
 * 调用ECNU大模型API（通过后端代理）
 */
const callECNUAPI = async (messages, isEmergency = false) => {
  try {
    const systemPrompt = isEmergency ? SYSTEM_PROMPTS.emergency : SYSTEM_PROMPTS.normal;
    
    const requestData = {
      model: 'ecnu-plus',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ],
      temperature: 0.7,
      max_tokens: 1000
    };

    console.log('📞 调用ECNU大模型API（通过后端代理）...', { 
      isEmergency, 
      messageCount: messages.length,
      model: requestData.model
    });

    // 通过后端代理调用ECNU API
    const response = await aiAPI.post('/chat/completions', requestData);
    
    if (response.data && response.data.choices && response.data.choices.length > 0) {
      const content = response.data.choices[0].message.content;
      console.log('✅ ECNU API调用成功（通过后端代理）');
      return {
        content,
        isEmergency,
        model: response.data.model || 'ecnu-plus',
        usage: response.data.usage
      };
    } else {
      throw new Error('API响应格式异常');
    }
  } catch (error) {
    console.error('❌ ECNU API调用失败:', error);
    
    // 提供更详细的错误信息
    if (error.response) {
      console.error('   响应状态:', error.response.status);
      console.error('   响应数据:', error.response.data);
    }
    
    throw error;
  }
};

/**
 * 获取AI回复
 */
export const getAIResponse = async (userMessage, conversationHistory = []) => {
  try {
    // 检测是否为紧急情况
    const isEmergency = isEmergencyCase(userMessage);
    
    // 构建消息历史
    const messages = [
      ...conversationHistory.slice(-6), // 只保留最近6条消息避免token过多
      { role: 'user', content: userMessage }
    ];

    // 调用ECNU API
    const result = await callECNUAPI(messages, isEmergency);
    
    return {
      content: result.content,
      isEmergency,
      model: result.model,
      usage: result.usage,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('获取AI回复失败:', error);
    
    // 降级处理：返回预设回复
    return getFallbackResponse(userMessage, isEmergencyCase(userMessage));
  }
};

/**
 * 获取预设的快速回复选项
 */
export const getQuickReplies = () => {
  return [
    { text: '🐕 狗狗不吃东西怎么办？', category: 'health' },
    { text: '🐱 猫咪训练技巧', category: 'training' },
    { text: '🏥 如何选择宠物医院？', category: 'medical' },
    { text: '💊 宠物疫苗接种时间', category: 'health' },
    { text: '🛁 宠物洗澡注意事项', category: 'care' },
    { text: '🎾 宠物玩具推荐', category: 'care' },
    { text: '🍖 宠物营养搭配', category: 'nutrition' },
    { text: '🚨 宠物急救处理', category: 'emergency' }
  ];
};

/**
 * 获取紧急情况的快速处理建议
 */
export const getEmergencyQuickTips = () => {
  return [
    {
      title: '宠物呕吐',
      tips: [
        '立即停止喂食和饮水',
        '观察呕吐物颜色和内容',
        '保持宠物安静',
        '如持续呕吐请立即就医'
      ]
    },
    {
      title: '宠物腹泻',
      tips: [
        '暂停固体食物',
        '少量多次提供清水',
        '观察便便颜色和性状',
        '如出现血便立即就医'
      ]
    },
    {
      title: '宠物误食',
      tips: [
        '立即查看误食物品',
        '不要强行催吐',
        '收集误食物品包装',
        '立即联系宠物医院'
      ]
    }
  ];
};

/**
 * 降级处理：API失败时的预设回复
 */
const getFallbackResponse = (userMessage, isEmergency) => {
  const fallbackResponses = {
    emergency: {
      content: `🚨 **紧急情况处理**

我检测到这可能是紧急情况。请立即采取以下措施：

**立即采取的措施：**
1. 保持宠物安静，避免过度刺激
2. 观察宠物的呼吸和心跳情况
3. 如果宠物昏迷，确保呼吸道畅通

**就医建议：**
建议立即联系最近的宠物医院或24小时急诊中心。

**注意事项：**
- 不要给宠物喂食或喂水
- 小心搬运，避免造成二次伤害
- 记录症状发生的时间和过程

如果情况危急，请立即拨打宠物医院急诊电话！`,
      isEmergency: true
    },
    normal: {
      content: `您好！我是Petpet小助手，您的宠物健康咨询助手。

很抱歉，我现在无法连接到AI服务。不过我可以为您提供一些基本建议：

🏥 **就医建议**
如果宠物出现异常症状，建议及时就医

📞 **紧急情况**
如遇紧急情况，请立即联系当地宠物医院

💡 **日常护理**
- 定期疫苗接种
- 保持良好的饮食习惯
- 适量运动
- 定期体检

请稍后再试，或者您可以详细描述问题，我会尽力为您提供帮助。`,
      isEmergency: false
    }
  };

  return {
    content: isEmergency ? fallbackResponses.emergency.content : fallbackResponses.normal.content,
    isEmergency,
    model: 'fallback',
    usage: null,
    timestamp: new Date().toISOString()
  };
};

/**
 * 获取AI助手的能力介绍
 */
export const getAICapabilities = () => {
  return {
    title: '🤖 Petpet小助手 - AI宠物健康助手',
    description: '基于ECNU大模型，为您提供专业的宠物健康咨询服务',
    capabilities: [
      {
        icon: '🏥',
        title: '健康咨询',
        description: '专业的宠物疾病诊断建议和治疗方案'
      },
      {
        icon: '🎓',
        title: '训练指导',
        description: '科学的宠物训练方法和行为纠正'
      },
      {
        icon: '🍖',
        title: '营养建议',
        description: '个性化的宠物饮食和营养搭配方案'
      },
      {
        icon: '🚨',
        title: '紧急处理',
        description: '24小时急诊模式，提供紧急处理流程'
      }
    ],
    emergencyMode: {
      title: '🚨 急诊模式',
      description: '当检测到紧急关键词时，自动切换到急诊模式，优先提供紧急处理方案'
    }
  };
};