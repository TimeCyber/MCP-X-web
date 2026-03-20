import axios from 'axios';
import config from '../config';

// 创建axios实例
const apiClient = axios.create({
  baseURL: config.apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
    'Accept': '*/*'
  }
});

// 请求拦截器
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// token 过期统一处理：清理本地存储并跳转登录页
function handleTokenExpired() {
  localStorage.removeItem('token');
  localStorage.removeItem('username');
  localStorage.removeItem('nickname');
  localStorage.removeItem('userId');
  if (!window.location.pathname.startsWith('/login')) {
    window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
  }
}

// 响应拦截器 - 处理 401 认证失败
apiClient.interceptors.response.use(
  (response) => {
    if (response.data?.code === 401) {
      handleTokenExpired();
      return Promise.reject(new Error(response.data?.msg || '认证失败'));
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      handleTokenExpired();
    }
    return Promise.reject(error);
  }
);

// 聊天相关类型定义
export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface SendDTO {
  appId?: string;
  contentNumber?: number;
  isMcp?: boolean;
  mcpConfig?: any; // 选中的MCP服务及其JSON配置，将直传后端
  deepResearch?: boolean;
  kid?: string;
  messages: Message[];
  model?: string;
  prompt?: string;
  search?: boolean;
  internet?: boolean;
  sessionId?: string;
  stream?: boolean;
  sysPrompt?: string;
  userId?: number;
  usingContext?: boolean;
  role?: string;
  uuid?: number;
  agent?: string; // 添加agent参数
}

export interface ChatMessageVo {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  sessionId: string;
  userId: string;  // 修改为string类型，避免大整数精度丢失
  createTime?: string;
  updateTime?: string;
  modelName?: string;
  deductCost?: string;
  totalTokens?: number;
  remark?: string;
  files?: FileAttachment[];  // 添加文件附件信息
}

// 文件附件信息接口
export interface FileAttachment {
  uid: string;
  name: string;
  type: string;
  size: number;
  url?: string;
}

export interface GetChatListParams {
  sessionId: string;
  userId: string;  // 修改为string类型，避免大整数精度丢失
}

export interface GetAiQueryResultsParams {
  queryId: string | number;
  pageNum?: number;
  pageSize?: number;
}

export interface SessionInfo {
  id: string;
  sessionTitle: string;
  sessionContent: string;
  remark?: string;
  userId: string; // API返回的是字符串
  createTime?: string;
  updateTime?: string;
}

// SSE流式响应处理函数
export const streamChatSend = async (
  data: SendDTO,
  onChunk: (chunk: any) => void,
  onError?: (error: any) => void,
  onComplete?: () => void
) => {
  const token = localStorage.getItem('token');
  const url = `${config.apiBaseUrl}/chat/send`;

  try {
    console.log('🚀 发起流式请求到:', url, '时间:', new Date().toISOString());

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
      },
      body: JSON.stringify({ ...data, stream: true }),
    });

    console.log('📥 响应状态:', response.status);
    console.log('📥 响应头 Content-Type:', response.headers.get('content-type'));
    console.log('📥 响应头 Transfer-Encoding:', response.headers.get('transfer-encoding'));
    console.log('📥 响应头 Cache-Control:', response.headers.get('cache-control'));

    // 处理 401 认证失败
    if (response.status === 401) {
      handleTokenExpired();
      onError?.(new Error('认证失败'));
      return;
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error('无法获取响应流');
    }

    let buffer = ''; // 用于存储未完成的数据
    let completedCalled = false;

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        console.log('🔚 流式读取完成，时间:', new Date().toISOString());
        onComplete?.();
        break;
      }

      // 将新数据添加到缓冲区
      const chunk = decoder.decode(value, { stream: true });
      console.log(`📦 收到原始数据块: ${chunk.length}字节 时间: ${new Date().toISOString()}`);
      buffer += chunk;
      const lines = buffer.split('\n');

      // 保留最后一行（可能不完整）
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.trim() === '') continue; // 跳过空行

        console.log(`⚡ 处理SSE行: ${line} 时间: ${new Date().toISOString()}`);

        if (line.startsWith('data:')) {
          try {
            const jsonStr = line.substring(5).trim(); // 移除 "data:" 前缀
            // console.log('提取的JSON字符串:', jsonStr, '长度:', jsonStr.length);
            if (jsonStr && jsonStr.trim() !== '' && jsonStr !== '[DONE]') {
              try {
                const parsedData = JSON.parse(jsonStr);
                // console.log('解析后的数据:', parsedData);
                onChunk(parsedData);
              } catch (innerParseError) {
                // console.log('JSON解析失败，检查是否为Agent日志:', jsonStr);
                // 检查是否是Agent步骤日志行 "[Agent] stage action - message"
                const agentMatch = jsonStr.match(/^\[Agent\]\s+(\w+)\s+(\w+)\s+-\s+(.+)$/);
                if (agentMatch) {
                  const [, stage, status, message] = agentMatch;
                  // console.log('✅ 解析Agent步骤成功:', { stage, status, message });
                  // 转换为agent_step格式
                  onChunk({
                    type: 'agent_step',
                    stage,
                    status,
                    message,
                    timestamp: Date.now()
                  });
                } else {
                  // console.log('❌ Agent正则匹配失败，原始字符串:', JSON.stringify(jsonStr));
                  // 其他非JSON行按普通文本增量输出
                  onChunk({ choices: [{ delta: { content: jsonStr } }] });
                }
              }
            } else if (jsonStr === '[DONE]') {
              console.log('收到结束标志');
              if (!completedCalled) {
                completedCalled = true;
                try { onComplete?.(); } catch { }
              }
              break;
            }
          } catch (parseError) {
            console.warn('解析SSE数据错误:', parseError, '原始行:', line);
          }
        }
      }
    }
  } catch (error) {
    console.error('流式请求错误:', error);
    onError?.(error);
  }
};

// 带文件上传的SSE流式响应处理函数
export const streamChatSendWithFiles = async (
  data: SendDTO,
  files: File[],
  onChunk: (chunk: any) => void,
  onError?: (error: any) => void,
  onComplete?: () => void
) => {
  const token = localStorage.getItem('token');
  const url = `${config.apiBaseUrl}/chat/send-with-files`;

  try {
    // 创建 FormData 对象
    const formData = new FormData();

    // 添加文件
    files.forEach((file) => {
      formData.append('file', file);
    });

    // 添加其他数据
    formData.append('messages', JSON.stringify(data.messages));
    if (data.model) formData.append('model', data.model);
    if (data.prompt) formData.append('prompt', data.prompt);
    if (data.sysPrompt) formData.append('sysPrompt', data.sysPrompt);
    if (data.stream !== undefined) formData.append('stream', data.stream.toString());
    if (data.kid) formData.append('kid', data.kid);
    if (data.userId) formData.append('userId', data.userId.toString());
    if (data.sessionId) formData.append('sessionId', data.sessionId.toString());
    if (data.appId) formData.append('appId', data.appId);
    if (data.role) formData.append('role', data.role);
    if (data.uuid) formData.append('uuid', data.uuid.toString());
    if (data.agent) formData.append('agent', data.agent);
    if (data.internet !== undefined) formData.append('internet', data.internet.toString());

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
      },
      body: formData,
    });

    // 处理 401 认证失败
    if (response.status === 401) {
      handleTokenExpired();
      onError?.(new Error('认证失败'));
      return;
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error('无法获取响应流');
    }

    let buffer = ''; // 用于存储未完成的数据
    let completedCalled = false;

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        console.log('🔚 流式读取完成，时间:', new Date().toISOString());
        onComplete?.();
        break;
      }

      // 将新数据添加到缓冲区
      const chunk = decoder.decode(value, { stream: true });
      console.log(`📦 收到原始数据块: ${chunk.length}字节 时间: ${new Date().toISOString()}`);
      buffer += chunk;
      const lines = buffer.split('\n');

      // 保留最后一行（可能不完整）
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.trim() === '') continue; // 跳过空行

        console.log(`⚡ 处理SSE行: ${line} 时间: ${new Date().toISOString()}`);

        if (line.startsWith('data:')) {
          try {
            const jsonStr = line.substring(5).trim(); // 移除 "data:" 前缀
            // console.log('提取的JSON字符串:', jsonStr, '长度:', jsonStr.length);
            if (jsonStr && jsonStr.trim() !== '' && jsonStr !== '[DONE]') {
              try {
                const parsedData = JSON.parse(jsonStr);
                // console.log('解析后的数据:', parsedData);
                onChunk(parsedData);
              } catch (innerParseError) {
                // console.log('JSON解析失败，检查是否为Agent日志:', jsonStr);
                // 检查是否是Agent步骤日志行 "[Agent] stage action - message"
                const agentMatch = jsonStr.match(/^\[Agent\]\s+(\w+)\s+(\w+)\s+-\s+(.+)$/);
                if (agentMatch) {
                  const [, stage, status, message] = agentMatch;
                  // console.log('✅ 解析Agent步骤成功:', { stage, status, message });
                  // 转换为agent_step格式
                  onChunk({
                    type: 'agent_step',
                    stage,
                    status,
                    message,
                    timestamp: Date.now()
                  });
                } else {
                  // console.log('❌ Agent正则匹配失败，原始字符串:', JSON.stringify(jsonStr));
                  // 其他非JSON行按普通文本增量输出
                  onChunk({ choices: [{ delta: { content: jsonStr } }] });
                }
              }
            } else if (jsonStr === '[DONE]') {
              console.log('收到结束标志');
              if (!completedCalled) {
                completedCalled = true;
                try { onComplete?.(); } catch { }
              }
              break;
            }
          } catch (parseError) {
            console.warn('解析SSE数据错误:', parseError, '原始行:', line);
          }
        }
      }
    }
  } catch (error) {
    console.error('流式请求错误:', error);
    onError?.(error);
  }
};

// 聊天相关API
export const chatApi = {
  // 发送消息
  send: async (data: SendDTO) => {
    const response = await apiClient.post('/chat/send', data);
    return response.data;
  },

  // 新增对应会话聊天记录
  addChat: async (data: ChatMessageVo) => {
    const response = await apiClient.post('/system/message', data);
    return response.data;
  },

  // 获取当前会话的聊天记录
  getChatList: async (params: GetChatListParams) => {
    const response = await apiClient.get('/system/message/list', { params });
    return response.data;
  },

  // 获取当前会话的聊天记录（Web接口，用于未登录用户）
  getWebChatList: async (params: GetChatListParams) => {
    const response = await apiClient.get('/web/message/list', { params });
    return response.data;
  },

  // 创建会话
  createSession: async (data: {
    userId: string;
    sessionContent: string;
    sessionTitle: string;
    remark?: string;
    appId?: string;
  }) => {
    const response = await apiClient.post('/system/session', data);
    return response.data;
  },

  // 创建会话（Web接口，用于未登录用户）
  createWebSession: async (data: {
    userId: string;
    sessionContent: string;
    sessionTitle: string;
    remark?: string;
  }) => {
    const response = await apiClient.post('/web/session', data);
    return response.data;
  },

  // 获取会话列表
  getSessionList: async (userId: string, appId?: string) => {
    const params: any = { userId };
    if (appId) {
      params.appId = appId;
    }
    params.isDelete = 0;
    const response = await apiClient.get('/system/session/list', { params });
    return response.data;
  },

  // 获取会话列表（Web接口，用于未登录用户）
  getWebSessionList: async (userId: string) => {
    const response = await apiClient.get('/web/session/list', { params: { userId } });
    return response.data;
  },

  // 删除会话
  deleteSession: async (sessionId: string) => {
    const response = await apiClient.delete(`/web/session/${sessionId}`);
    return response.data;
  },

  // 更新会话
  updateSession: async (data: {
    sessionTitle?: string;
    remark?: string;
    sessionId?: string;
    id?: string;
  }) => {
    const response = await apiClient.put(`/system/session`, data);
    return response.data;
  },

  // 更新会话内容（用于保存视频项目JSON）
  updateSessionContent: async (sessionId: string, content: string, sessionTitle?: string) => {
    const response = await apiClient.put(`/web/session/content`, {
      id: sessionId,
      content: content,
      sessionTitle: sessionTitle
    });
    return response.data;
  },

  // 获取会话历史记录
  getSessionContentHistory: async (sessionId: string) => {
    const response = await apiClient.get(`/web/session/content/list/${sessionId}`);
    return response.data;
  },

  // 获取AI查询结果（参考链接）
  getAiQueryResults: async (params: GetAiQueryResultsParams) => {
    const response = await apiClient.get(`/web/ai-query/results/${params.queryId}/page`, {
      params: {
        pageNum: params.pageNum || 1,
        pageSize: params.pageSize || 10
      }
    });
    return response.data;
  }
};

export default chatApi; 