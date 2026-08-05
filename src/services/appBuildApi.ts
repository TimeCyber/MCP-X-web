import axios from 'axios';
import config from '../config';

const API_BASE_URL = config.apiBaseUrl;
const STATIC_BASE_URL = config.staticBaseUrl;

// 代码生成类型枚举
export enum CodeGenTypeEnum {
  HTML = 'html',
  REACT = 'react_project',
  VUE_PROJECT = 'vue_project',
  STATIC = 'static'
}

// 创建axios实例
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': '*/*'
  }
});

// 请求拦截器 - 添加token
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

// 响应拦截器 - 处理token过期
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.log('应用构建API响应错误:', error.response);
    // 只在明确的401状态码时处理token过期
    if (error.response?.status === 401) {
      console.log('检测到401错误，清理token');
      // 清理本地存储
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      localStorage.removeItem('nickname');
      localStorage.removeItem('userId');
      // 可以选择跳转到登录页
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

/** 网页生成模式：普通 / Pro */
export type WebgenMode = 'normal' | 'pro';

// 应用构建相关接口
export interface AppBuildRequest {
  // 可选：后端若提供自动命名则无需传入
  appName?: string;
  // 必填：用于触发首次生成
  message: string;
  // 必填：初始化提示词
  initPrompt: string;
  // 可选：后端可根据提示词或默认策略决定生成类型
  codeGenType?: 'HTML' | 'REACT' | 'VUE' | 'STATIC';
  userId: string;
  /** 生成模式：normal | pro */
  mode?: WebgenMode;
  /** 参考图 base64 列表（可含 data: 前缀；当前 UI 仅传 1 张） */
  images?: string[];
}

export interface AppInfo {
  id: string;
  appName: string;
  initPrompt: string;
  codeGenType: string;
  userId: string;
  deployKey?: string;
  cover?: string;
  priority?: number;
  createTime: string;
  updateTime: string;
  deployedTime?: string;
  // 后端 dev 模式下返回的预览地址（如 http://localhost:4100/#/）
  previewUrl?: string;
  /** 创建时选择的生成模式 */
  mode?: WebgenMode;
}

export interface ChatMessage {
  type: 'user' | 'ai';
  content: string;
  loading?: boolean;
  createTime?: string;
  id?: string;
  /** 用户消息附带的参考图预览（base64 data URL，当前最多 1 张） */
  images?: string[];
}

export interface ChatToGenCodeOptions {
  mode?: WebgenMode;
  /** 参考图 base64 列表（可含 data: 前缀；当前 UI 仅传 1 张） */
  images?: string[];
}

export interface ChatHistoryResponse {
  records: Array<{
    id: string;
    messageType: 'user' | 'ai';
    message: string;
    createTime: string;
  }>;
  total: number;
}

export interface DeployResponse {
  deployUrl: string;
  deployKey: string;
}

// 创建应用
export const createApp = async (data: AppBuildRequest) => {
  const response = await apiClient.post('/app/webgen/add', data);
  return response.data;
};

// 获取应用信息
export const getAppInfo = async (appId: string) => {
  const response = await apiClient.get(`/app/webgen/${appId}`, {
    params: { id: appId },
  });
  return response.data;
};

// 获取我的应用列表
export const getMyApps = async (params: {
  pageNum?: number;
  pageSize?: number;
  sortField?: string;
  sortOrder?: string;
  appName?: string;
  isDelete?: number;
}) => {
  const response = await apiClient.get('/app/webgen/list', {
    params
  });
  return response.data;
};

/** 将 File 读为 data URL（base64） */
export const fileToBase64DataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('读取图片失败'));
    reader.readAsDataURL(file);
  });
};

// 聊天生成代码 - 流式响应
export const chatToGenCode = async (
  appId: string,
  message: string,
  onChunk: (chunk: any) => void,
  onError?: (error: any) => void,
  onComplete?: () => void,
  options?: ChatToGenCodeOptions,
) => {
  const token = localStorage.getItem('token');

  const url = `${API_BASE_URL}/app/webgen/chat/gen/code`;

  // 提升到函数作用域，供 catch 和流结束时冲刷使用
  let buffer = '';
  let lastActivityTime = Date.now();
  let heartbeatTimer: NodeJS.Timeout | null = null;
  
  // 先给一个安全的默认实现，避免"used before assigned"告警
  let handleLine: (rawLine: string) => void = (rawLine: string) => {
    const l = (rawLine || '').replace(/\r$/, '');
    if (l.trim() !== '') {
      onChunk({ choices: [{ delta: { content: l } }] });
    }
  };

  // 清理心跳定时器
  const clearHeartbeat = () => {
    if (heartbeatTimer) {
      clearTimeout(heartbeatTimer);
      heartbeatTimer = null;
    }
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'Accept': 'text/event-stream',
        'Connection': 'keep-alive',
        // 强制禁用缓冲
        'X-Accel-Buffering': 'no',
        'Pragma': 'no-cache',
      },
      body: JSON.stringify({
        appId,
        message,
        stream: true,
        mode: options?.mode || 'normal',
        ...(options?.images?.length ? { images: options.images } : {}),
      }),
      // 添加信号控制，用于超时中断（延长至30分钟，适配大模型慢返回）
      signal: AbortSignal.timeout ? AbortSignal.timeout(1800000) : undefined, // 30分钟超时
    });

    console.log('📥 应用构建响应状态:', response.status);

    if (!response.ok) {
      // 处理401认证失败
      if (response.status === 401) {
        console.log('检测到401错误，清理token');
        // 清理本地存储
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        localStorage.removeItem('nickname');
        localStorage.removeItem('userId');
        // 跳转到登录页
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        throw new Error('认证失败，无法访问系统资源');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder('utf-8', { fatal: false }); // 非致命解码

    if (!reader) {
      throw new Error('无法获取响应流');
    }

    buffer = ''; // 用于存储未完成的数据
    
    // 心跳检测：如果30秒内没有数据，认为连接可能有问题（降低阈值以更快检测缓冲问题）
    const startHeartbeat = () => {
      clearHeartbeat();
      heartbeatTimer = setTimeout(() => {
        const timeSinceLastActivity = Date.now() - lastActivityTime;
        if (timeSinceLastActivity > 600000) { // 10分钟无活动（延长等待时间）
          console.warn('⚠️ SSE连接心跳超时，可能遇到缓冲问题，尝试重连');
          // 不直接取消，而是发送ping尝试唤醒连接
          try {
            // 尝试发送一个轻量级请求来检测连接状态
            fetch(`${API_BASE_URL}/ping`, { 
              method: 'GET', 
              headers: { 'Authorization': token ? `Bearer ${token}` : '' },
              signal: AbortSignal.timeout ? AbortSignal.timeout(5000) : undefined
            }).catch(() => {
              console.warn('连接检测失败，可能需要重新连接');
            });
          } catch {}
          reader.cancel?.(); // 如果ping也失败，则取消读取
        } else {
          startHeartbeat(); // 继续监控
        }
      }, 5000); // 每5秒检查一次（更频繁检测）
    };
    
    startHeartbeat();

    // 统一处理一行（SSE 或 JSON 或纯文本）
    handleLine = (rawLine: string) => {
      const line = (rawLine || '').replace(/\r$/, '');
      if (line.trim() === '') return;
      // 处理 SSE 心跳注释: 后端输出 ":keepalive"
      if (line.startsWith(':keepalive')) {
        lastActivityTime = Date.now();
        startHeartbeat();
        return;
      }
      // 其他以冒号开头的 SSE 注释行统一忽略
      if (line.startsWith(':')) return;

      try {
        // SSE data 行
        if (line.startsWith('data: ')) {
          const dataStr = line.slice(6);
          if (dataStr === '[DONE]') {
            console.log('🏁 应用构建流结束标记');
            onComplete?.();
            return;
          }

          try {
            const parsedData = JSON.parse(dataStr);
            if (parsedData && typeof parsedData.d === 'string') {
              onChunk({ d: parsedData.d });
            } else if (typeof parsedData === 'string') {
              onChunk({ choices: [{ delta: { content: parsedData } }] });
            } else {
              onChunk(parsedData);
            }
          } catch (parseError) {
            // 尝试作为纯文本处理，避免因末尾不完整 JSON 中断显示
            onChunk({ choices: [{ delta: { content: dataStr } }] });
          }
          return;
        }

        // SSE 事件类型（目前忽略）
        if (line.startsWith('event: ')) {
          console.log('📢 应用构建事件类型:', line.slice(7));
          return;
        }

        // 兼容没有空格的 data: 前缀
        if (line.startsWith('data:')) {
          return handleLine('data: ' + line.slice(5));
        }

        // 处理纯 JSON 或普通文本
        try {
          const parsedData = JSON.parse(line);
          if (parsedData && typeof parsedData.d === 'string') {
            onChunk({ d: parsedData.d });
          } else {
            onChunk(parsedData);
          }
        } catch (e) {
          onChunk({ choices: [{ delta: { content: line } }] });
        }
      } catch (e) {
        console.warn('⚠️ 应用构建处理行异常，已忽略该行:', line, e);
      }
    };

    while (true) {
      try {
        const { done, value } = await reader.read();
        
        if (done) {
          console.log('🔚 应用构建流式读取完成，时间:', new Date().toISOString());
          clearHeartbeat();
          break;
        }

        // 更新活动时间
        lastActivityTime = Date.now();

        // 将新数据添加到缓冲区，增强容错
        const chunk = decoder.decode(value, { stream: true });
        const chunkPreview = chunk.length > 100 ? chunk.substring(0, 100) + '...' : chunk;
        console.log(`📦 应用构建收到原始数据块: ${chunk.length}字节 时间: ${new Date().toISOString()}`);
        console.log(`📝 数据内容预览: ${JSON.stringify(chunkPreview)}`);
        
        if (chunk.length === 0) {
          console.log('📦 收到空数据块，跳过处理');
          continue;
        }
        
        buffer += chunk;
        const lines = buffer.split('\n');
        
        // 保留最后一行（可能不完整）
        buffer = lines.pop() || '';
        
        // 处理完整的行
        for (const line of lines) {
          try {
            handleLine(line);
          } catch (lineError) {
            console.warn('⚠️ 处理单行数据异常，跳过:', line, lineError);
            // 继续处理下一行，不中断整个流
          }
        }
      } catch (readError) {
        console.warn('⚠️ 流读取单次异常:', readError);
        // 检查是否是网络中断
        const errorName = (readError as Error)?.name;
        const errorMessage = (readError as Error)?.message;
        if (errorName === 'AbortError' || errorMessage?.includes('network')) {
          console.error('🌐 网络连接中断');
          break;
        }
        // 其他错误继续重试
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    // 流结束时冲刷缓冲区剩余内容（可能是不带换行的最后一段）
    if (buffer && buffer.trim() !== '') {
      try {
        handleLine(buffer);
      } catch (bufferError) {
        console.warn('⚠️ 处理缓冲区剩余数据异常:', bufferError);
      }
    }
    
    clearHeartbeat();
    onComplete?.();
  } catch (error) {
    console.error('❌ 应用构建流式请求失败:', error);
    clearHeartbeat(); // 确保清理定时器
    
    // 即使异常也尝试完成，保证已接收内容正常展示
    try {
      if (buffer && buffer.trim() !== '') {
        const tailLines = buffer.split('\n');
        for (const tl of tailLines) {
          if (typeof handleLine === 'function') {
            handleLine(tl);
          } else {
            const l = (tl || '').replace(/\r$/, '');
            if (l.trim() !== '') {
              onChunk({ choices: [{ delta: { content: l } }] });
            }
          }
        }
      }
    } catch {}
    
    // 根据错误类型提供更详细的错误信息
    let errorMessage = '网络连接异常';
    if (error instanceof TypeError && error.message?.includes('fetch')) {
      errorMessage = '网络连接失败，请检查网络状态';
    } else if (error instanceof Error && error.name === 'AbortError') {
      errorMessage = '请求超时，服务器响应较慢';
    } else if (error instanceof Error && error.message?.includes('status:')) {
      errorMessage = `服务器错误: ${error.message}`;
    }
    
    onError?.(error instanceof Error ? { ...error, message: errorMessage } : new Error(errorMessage));
    onComplete?.();
  }
};

// 直接写入文件内容（绕过 AI，后端需提供对应端点 /app/webgen/file/save）
export const saveFileContent = async (appId: string, filePath: string, content: string): Promise<{ code: number; msg?: string }> => {
  const response = await apiClient.post('/app/webgen/file/save', {
    appId,
    filePath,
    content,
  });
  return response.data;
};

// 获取聊天历史
export const getChatHistory = async (params: {
  appId: string;
  pageSize?: number;
  lastCreateTime?: string;
}) => {
  const response = await apiClient.get('/app/webgen/chat/history', {
    params,
  });
  return response.data;
};

// 部署应用（兼容 long：统一以字符串传输，避免 JSON BigInt 序列化问题）
export const deployApp = async (appId: string | number | bigint) => {
  const id = typeof appId === 'bigint' ? appId.toString() : String(appId);
  console.log(appId)
  console.log(id)
  // 以纯文本形式传输（避免 JSON BigInt），后端 @RequestBody Long 可正常解析
  const response = await apiClient.post('/app/webgen/deploy', id, {
    headers: { 'Content-Type': 'application/json;charset=UTF-8' },
  });
  return response.data;
};

// 下载代码
export const downloadAppCode = async (appId: string) => {
  const response = await apiClient.get(`/app/webgen/download/${appId}`, {
    responseType: 'blob',
  });
  // 如果后端返回 JSON 错误（content-type 为 application/json），解析并抛出
  const contentType = response.headers['content-type'] || '';
  if (contentType.includes('application/json')) {
    const text = await (response.data as Blob).text();
    const json = JSON.parse(text);
    const err: any = new Error(json.msg || '下载失败');
    err.code = json.code;
    err.serverMsg = json.msg;
    throw err;
  }
  return response;
};

// 删除应用
export const deleteApp = async (appId: string) => {
  const response = await apiClient.post('/app/webgen/delete', {
    id: appId,
  });
  return response.data;
};

// 更新应用信息
export const updateApp = async (data: {
  id: string;
  appName: string;
  cover?: string;
  priority?: number;
}) => {
  const response = await apiClient.post('/app/webgen/update', {
    id: data.id,
    appName: data.appName,
    cover: data.cover,
    priority: data.priority,
  });
  return response.data;
};

// 将后端返回的 dev server URL 中的 localhost 替换为实际服务器域名
// 例如：http://localhost:4100/#/  →  http://www.mcp-x.com:4100/#/
export const resolveDevServerUrl = (devUrl: string): string => {
  if (!devUrl) return devUrl;
  try {
    const apiHost = new URL(API_BASE_URL).hostname;
    // 开发环境下 API 也在 localhost，不需要替换
    if (!apiHost || apiHost === 'localhost' || apiHost === '127.0.0.1') return devUrl;
    return devUrl.replace(/localhost|127\.0\.0\.1/g, apiHost);
  } catch {
    return devUrl;
  }
};

// 获取静态资源预览URL
export const getStaticPreviewUrl = (codeGenType: string, appId: string): string => {
  // 根据后端控制器格式：/static/{deployKey}/
  // deployKey 格式应该是：{codeGenType}_{appId}
  // const deployKey = `${codeGenType.toLowerCase()}_${appId}`;
  const baseUrl = `${STATIC_BASE_URL}/`;
  console.log('baseUrl', baseUrl);
  
  // 如果是 Vue 项目，浏览地址需要添加 dist 后缀
  if (codeGenType === CodeGenTypeEnum.VUE_PROJECT || codeGenType === CodeGenTypeEnum.REACT ) {
    return `${baseUrl}vue_project_${appId}/dist/index.html`;
  }
  
  // 对于其他项目类型，需要明确指定 index.html
  return `${baseUrl}html_${appId}/index.html`;
};

// 计算 deployKey（不包含具体文件路径）
export const getStaticDeployKey = (codeGenType: string, appId: string): string => {
  const lower = (codeGenType || '').toLowerCase();
  if (lower === CodeGenTypeEnum.VUE_PROJECT || lower === CodeGenTypeEnum.REACT) {
    return `vue_project_${appId}`;
  }
  return `html_${appId}`;
};

// 获取目录列表接口 URL：/static/{deployKey}/list
export const getStaticListUrl = (codeGenType: string, appId: string): string => {
  const deployKey = getStaticDeployKey(codeGenType, appId);
  return `${STATIC_BASE_URL}/${deployKey}/list`;
};

// 构造静态文件访问URL：/static/{deployKey}{path}
export const getStaticFileUrl = (codeGenType: string, appId: string, path: string): string => {
  const deployKey = getStaticDeployKey(codeGenType, appId);
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${STATIC_BASE_URL}/${deployKey}${normalized}`;
};

// 获取静态资源目录URL（用于列目录，不包含 index.html）
export const getStaticPreviewDirUrl = (codeGenType: string, appId: string): string => {
  const baseUrl = `${STATIC_BASE_URL}/`;
  // React/Vue 项目目录一般在 dist 下
  if (codeGenType === CodeGenTypeEnum.VUE_PROJECT || codeGenType === CodeGenTypeEnum.REACT) {
    return `${baseUrl}vue_project_${appId}/dist/`;
  }
  // 其他类型使用根目录
  return `${baseUrl}html_${appId}/`;
};

// 格式化代码生成类型
export const formatCodeGenType = (type: string): string => {
  switch (type?.toUpperCase()) {
    case 'HTML':
      return 'HTML 静态页面';
    case 'REACT':
      return 'React 应用';
    case 'VUE':
      return 'Vue 应用';
    case 'STATIC':
      return '静态网站';
    case 'PPT':
      return 'PPT 演示文稿';
    default:
      return type || '未知类型';
  }
};

/** 判断是否为 PPT 类型应用 */
export const isPptType = (codeGenType?: string): boolean => {
  return codeGenType?.toUpperCase() === 'PPT';
};
