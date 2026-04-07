import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { ChatProvider, useChat } from '../contexts/ChatContext';
import { FilesProvider } from '../contexts/FilesContext';
import { useLanguage } from '../contexts/LanguageContext';
import { ChatMessage } from '../components/chat/ChatMessage';
import { ChatInput } from '../components/chat/ChatInput';
import { WelcomeText } from '../components/chat/WelcomeText';
import { ChatSidebar } from '../components/chat/ChatSidebar';
import { KnowledgeManager } from '../components/chat';
import { McpManager } from '../components/chat/McpManager';
import { chatApi, ChatMessageVo, streamChatSend, streamChatSendWithFiles } from '../services/chatApi';
import { modelApi, ModelInfo } from '../services/modelApi';
import config from '../config';
import { toast } from '../utils/toast';
import { ModelSelect } from '../components/chat/ModelSelect';
import { KnowledgeInfo } from '../types';
import { Globe, ArrowDown, Wrench } from 'lucide-react';
import { HumanFeedbackPanel, HumanFeedbackBanner } from '../components/chat/HumanFeedbackPanel';
import { ReferenceLinksSidebar } from '../components/chat/ReferenceLinksSidebar';
import { ReferenceImagesSidebar } from '../components/chat/ReferenceImagesSidebar';
import type { FeedbackOption } from '../types/human-feedback';

// 解析中文时间格式
const parseChinaTimeString = (timeStr: string): Date | null => {
  try {
    // 处理格式：2025/8/12 下午7:46
    const match = timeStr.match(/(\d{4})\/(\d{1,2})\/(\d{1,2})\s+(上午|下午)(\d{1,2}):(\d{2})/);
    if (match) {
      const [, year, month, day, period, hour, minute] = match;
      let hourNum = parseInt(hour);

      // 处理上午/下午
      if (period === '下午' && hourNum !== 12) {
        hourNum += 12;
      } else if (period === '上午' && hourNum === 12) {
        hourNum = 0;
      }

      return new Date(
        parseInt(year),
        parseInt(month) - 1, // 月份从0开始
        parseInt(day),
        hourNum,
        parseInt(minute)
      );
    }
    return null;
  } catch (error) {
    return null;
  }
};

// 语言切换按钮组件
const LanguageToggle: React.FC = () => {
  const { currentLanguage, setLanguage } = useLanguage();
  
  const toggleLanguage = () => {
    setLanguage(currentLanguage === 'zh' ? 'en' : 'zh');
  };
  
  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center gap-1 px-2 py-1 text-sm text-slate-600 hover:text-blue-600 transition-colors rounded-lg hover:bg-slate-100"
      title={currentLanguage === 'zh' ? 'Switch to English' : '切换到中文'}
    >
      <Globe size={16} />
      <span className="text-xs font-medium">
        {currentLanguage === 'zh' ? 'EN' : '中'}
      </span>
    </button>
  );
};

// 聊天页面内容组件
const ChatPageContent: React.FC = React.memo(() => {
  const { id: sessionId } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { state, dispatch, setCurrentSession, addMessage, setDeepThinking } = useChat();
  const { currentLanguage, t } = useLanguage();

  // 工作流步骤类型与状态
  interface AgentStep {
    stage?: string;
    status?: string;
    message?: string;
    timestamp?: number;
  }
  // 按消息ID存储步骤的映射
  const [messageSteps, setMessageSteps] = useState<Record<string, AgentStep[]>>({});

  // 工具调用步骤类型
  interface ToolCallStep {
    stage: string;
    type: string;
    message: string;
    tool: string;
    timestamp: number;
  }
  // 按消息ID存储工具调用步骤的映射（实时更新）
  const [messageToolCallSteps, setMessageToolCallSteps] = useState<Record<string, ToolCallStep[]>>({});

  // 辅助函数：保留agent参数进行跳转
  const navigateWithAgent = (path: string) => {
    const agentId = searchParams.get('agent');
    if (agentId) {
      navigate(`${path}?agent=${agentId}`);
    } else {
      navigate(path);
    }
  };
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState<boolean>(true);
  // 标记用户是否主动滚动离开底部（查看历史消息）
  const userScrolledAwayRef = useRef<boolean>(false);
  // 标记是否正在程序自动滚动（避免误判）
  const isProgrammaticScrollRef = useRef<boolean>(false);
  // 标记是否正在恢复滚动位置
  const isRestoringScrollRef = useRef<boolean>(false);
  const userId = localStorage.getItem('userId');
  const token = localStorage.getItem('token');
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [autoCollapsed, setAutoCollapsed] = useState<boolean>(false);
  const [selectedKnowledge, setSelectedKnowledge] = useState<KnowledgeInfo | null>(null);
  const [showKnowledgeManager, setShowKnowledgeManager] = useState(false);
  const [internetEnabled] = useState<boolean>(false);
  const [friendlyModeEnabled, setFriendlyModeEnabled] = useState<boolean>(false);
  const [isMcpEnabled, setIsMcpEnabled] = useState<boolean>(false);
  const [showMcpManager, setShowMcpManager] = useState<boolean>(false);
  const [mcpSelectedIds, setMcpSelectedIds] = useState<string[]>([]);
  const [mcpConfigMap, setMcpConfigMap] = useState<Record<string, any>>({});
  // 人工反馈相关状态
  const [showFeedbackPanel, setShowFeedbackPanel] = useState<boolean>(false);

  // 参考链接相关状态
  const [showReferenceLinks, setShowReferenceLinks] = useState<boolean>(false);
  const [referenceLinks, setReferenceLinks] = useState<any[]>([]);
  const [referenceLinksLoading, setReferenceLinksLoading] = useState<boolean>(false);
  const [referenceLinksError, setReferenceLinksError] = useState<string>('');

  // 参考图片相关状态
  const [showReferenceImages, setShowReferenceImages] = useState<boolean>(false);
  const [referenceImages, setReferenceImages] = useState<any[]>([]);
  const [referenceImagesLoading, setReferenceImagesLoading] = useState<boolean>(false);
  const [referenceImagesError, setReferenceImagesError] = useState<string>('');

  // 工具执行结果相关状态
  const [toolExecutions, setToolExecutions] = useState<any[]>([]);
  const [referenceLinksPagination, setReferenceLinksPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  // 性能优化：仅渲染最近 N 条，支持展开全部
  const [showAllMessages, setShowAllMessages] = useState<boolean>(false);
  // 最后消息缓存
  const [lastMessages, setLastMessages] = useState<Record<string, { content: string; time: string }>>({});
  const isDataLoadedRef = useRef(false);
  const cachedSessionsRef = useRef<any[]>([]);
  const cachedLastMessagesRef = useRef<Record<string, { content: string; time: string }>>({});
  const loadedSessionsRef = useRef<Set<string>>(new Set()); // 跟踪已加载的会话
  const chatMapRef = useRef(state.chatMap); // 用于在回调中获取最新的消息状态
  
  // 保持 chatMapRef 与 state.chatMap 同步
  useEffect(() => {
    chatMapRef.current = state.chatMap;
  }, [state.chatMap]);

  // ============ 滚动位置持久化 ============
  const SCROLL_POSITION_KEY = `chat_scroll_position_${userId}`;

  // 保存滚动位置到 localStorage
  const saveScrollPosition = useCallback((sessionId: string, scrollTop: number) => {
    try {
      const positions = JSON.parse(localStorage.getItem(SCROLL_POSITION_KEY) || '{}');
      positions[sessionId] = scrollTop;
      localStorage.setItem(SCROLL_POSITION_KEY, JSON.stringify(positions));
    } catch (error) {
      console.error('Failed to save scroll position:', error);
    }
  }, [SCROLL_POSITION_KEY]);

  // 从 localStorage 加载滚动位置
  const loadScrollPosition = useCallback((sessionId: string): number | null => {
    try {
      const positions = JSON.parse(localStorage.getItem(SCROLL_POSITION_KEY) || '{}');
      return positions[sessionId] || null;
    } catch (error) {
      console.error('Failed to load scroll position:', error);
      return null;
    }
  }, [SCROLL_POSITION_KEY]);

  // 恢复滚动位置
  const restoreScrollPosition = useCallback((sessionId: string) => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const savedPosition = loadScrollPosition(sessionId);
    if (savedPosition !== null) {
      isRestoringScrollRef.current = true;
      isProgrammaticScrollRef.current = true;
      
      // 使用 requestAnimationFrame 确保 DOM 已经渲染
      requestAnimationFrame(() => {
        container.scrollTop = savedPosition;
        
        // 检查是否在底部
        const threshold = 10;
        const atBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - threshold;
        setIsAtBottom(atBottom);
        userScrolledAwayRef.current = !atBottom;
        
        setTimeout(() => {
          isProgrammaticScrollRef.current = false;
          isRestoringScrollRef.current = false;
        }, 100);
      });
    } else {
      // 如果没有保存的位置，滚动到底部
      scrollToBottom();
    }
  }, [loadScrollPosition]);

  // ============ localStorage 本地缓存配置 ============
  const CACHE_KEY = `chat_sessions_${userId}`;
  const CACHE_TIMESTAMP_KEY = `chat_sessions_timestamp_${userId}`;
  const CACHE_EXPIRY_TIME = 2 * 60 * 60 * 1000; // 2小时过期，延长缓存时间

  // 从 localStorage 加载缓存
  const loadFromLocalStorage = useCallback(() => {
    try {
      const cachedData = localStorage.getItem(CACHE_KEY);
      const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
      
      if (!cachedData || !timestamp) {
        return null;
      }

      const now = Date.now();
      const cacheTime = parseInt(timestamp, 10);
      if (now - cacheTime > CACHE_EXPIRY_TIME) {
        localStorage.removeItem(CACHE_KEY);
        localStorage.removeItem(CACHE_TIMESTAMP_KEY);
        return null;
      }

      const parsed = JSON.parse(cachedData);
      return parsed;
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
      return null;
    }
  }, [CACHE_KEY, CACHE_TIMESTAMP_KEY, CACHE_EXPIRY_TIME]);

  // 保存到 localStorage
  const saveToLocalStorage = useCallback((sessions: any[], lastMsgs: Record<string, { content: string; time: string }>) => {
    try {
      const dataToCache = {
        sessions,
        lastMessages: lastMsgs
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(dataToCache));
      localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  }, [CACHE_KEY, CACHE_TIMESTAMP_KEY]);

  // ============ 消息列表缓存 ============
  const loadMessagesFromCache = useCallback((sessionId: string) => {
    try {
      const cacheKey = `chat_messages_${userId}_${sessionId}`;
      const timestampKey = `chat_messages_timestamp_${userId}_${sessionId}`;
      
      const cachedData = localStorage.getItem(cacheKey);
      const timestamp = localStorage.getItem(timestampKey);
      
      if (!cachedData || !timestamp) {
        return null;
      }

      const now = Date.now();
      const cacheTime = parseInt(timestamp, 10);
      if (now - cacheTime > CACHE_EXPIRY_TIME) {
        localStorage.removeItem(cacheKey);
        localStorage.removeItem(timestampKey);
        return null;
      }

      return JSON.parse(cachedData);
    } catch (error) {
      console.error('Failed to load messages from cache:', error);
      return null;
    }
  }, [userId, CACHE_EXPIRY_TIME]);

  // 保存消息到 localStorage
  const saveMessagesToCache = useCallback((sessionId: string, messages: any[]) => {
    try {
      const cacheKey = `chat_messages_${userId}_${sessionId}`;
      const timestampKey = `chat_messages_timestamp_${userId}_${sessionId}`;
      
      localStorage.setItem(cacheKey, JSON.stringify(messages));
      localStorage.setItem(timestampKey, Date.now().toString());
    } catch (error) {
      console.error('Failed to save messages to cache:', error);
    }
  }, [userId]);

  // 清除特定会话的消息缓存（保留供将来使用）
  const _clearMessagesCache = useCallback((sessionId: string) => {
    try {
      const cacheKey = `chat_messages_${userId}_${sessionId}`;
      const timestampKey = `chat_messages_timestamp_${userId}_${sessionId}`;
      
      localStorage.removeItem(cacheKey);
      localStorage.removeItem(timestampKey);
    } catch (error) {
      console.error('Failed to clear messages cache:', error);
    }
  }, [userId]);

  // 从URL中提取文件名
  const extractFileNameFromUrl = useCallback((url: string): string => {
    try {
      // 从URL中提取路径部分
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      
      // 获取最后一个斜杠后的部分
      const segments = pathname.split('/');
      const lastSegment = segments[segments.length - 1];
      
      // 如果有文件名，返回它
      if (lastSegment && lastSegment.includes('.')) {
        return decodeURIComponent(lastSegment);
      }
      
      return '下载文件';
    } catch (error) {
      return '下载文件';
    }
  }, []);

  // 解析 <files> 标签，提取文件信息并返回去除标签后的文本内容
  const parseFiles = useCallback((content: string): { cleanContent: string; files: any[] } => {
    try {
      // 使用更宽松的正则表达式来匹配 <files> 标签，包括标签内的空白字符
      const fileMatches = [...content.matchAll(/<files>\s*([\s\S]*?)\s*<\/files>/gi)];
      const files: any[] = [];

      fileMatches.forEach((match) => {
        const fileData = (match[1] || '').trim();

        if (!fileData) {
          return;
        }

        // 解析文件信息，格式可能是 JSON 字符串或其他格式
        try {
          // 如果是 JSON 格式
          if (fileData.startsWith('{')) {
            const fileInfo = JSON.parse(fileData);
            if (fileInfo.url || fileInfo.name) {
              files.push({
                name: fileInfo.name || extractFileNameFromUrl(fileInfo.url || fileData),
                type: fileInfo.type || fileInfo.mimeType || 'application/octet-stream',
                size: fileInfo.size || 0,
                url: fileInfo.url || fileData,
                ...fileInfo
              });
            }
          } else if (fileData.startsWith('http://') || fileData.startsWith('https://')) {
            // 如果是纯 URL
            const url = fileData;
            
            // 从URL提取真实文件名
            const extractedFileName = extractFileNameFromUrl(url);
            
            // 根据URL特征推断文件类型
            let fileType = 'application/octet-stream';
            let displayName = extractedFileName;

            if (url.includes('.txt')) {
              fileType = 'text/plain';
            } else if (url.includes('.pdf')) {
              fileType = 'application/pdf';
            } else if (url.includes('.doc') || url.includes('.docx')) {
              fileType = 'application/msword';
            } else if (url.includes('.xls') || url.includes('.xlsx')) {
              fileType = 'application/vnd.ms-excel';
            } else if (url.includes('.ppt') || url.includes('.pptx')) {
              fileType = 'application/vnd.ms-powerpoint';
            } else if (url.includes('.jpg') || url.includes('.jpeg')) {
              fileType = 'image/jpeg';
            } else if (url.includes('.png')) {
              fileType = 'image/png';
            } else if (url.includes('.mp4')) {
              fileType = 'video/mp4';
            } else if (url.includes('.mp3')) {
              fileType = 'audio/mp3';
            }

            files.push({
              name: displayName,
              type: fileType,
              size: 0,
              url: url
            });
          }
        } catch (e) {
          // 如果不是 JSON，可能是纯 URL
          if (fileData.startsWith('http://') || fileData.startsWith('https://')) {
            files.push({
              name: extractFileNameFromUrl(fileData),
              type: 'application/octet-stream',
              size: 0,
              url: fileData
            });
          }
        }
      });

      // 移除 <files> 标签，保留其他内容（使用更宽松的正则）
      const cleanContent = content.replace(/<files>\s*[\s\S]*?\s*<\/files>/gi, '').trim();

      return { cleanContent, files };
    } catch (error) {
      console.warn('解析文件标签失败:', error);
      return { cleanContent: content, files: [] };
    }
  }, [extractFileNameFromUrl]);

  // 解析工具执行结果
  const parseToolExecutions = useCallback((content: string) => {
    const executions: any[] = [];

    // 查找所有 ToolExecution 块
    const toolExecutionRegex = /ToolExecution\{([^}]+)\}/g;
    let match;

    while ((match = toolExecutionRegex.exec(content)) !== null) {
      const toolExecutionContent = match[1];

      try {
        // 直接提取 request 和 result 部分
        const requestStart = toolExecutionContent.indexOf('request=ToolExecutionRequest');
        const resultStart = toolExecutionContent.indexOf('result=ToolExecutionResult');

        if (requestStart !== -1 && resultStart !== -1) {
          // 提取从 request 开始到 result 结束的部分
          const requestPart = toolExecutionContent.substring(requestStart, resultStart).trim();
          const resultPart = toolExecutionContent.substring(resultStart).trim();

          // 解析 request
          const idMatch = requestPart.match(/id\s*=\s*"([^"]+)"/);
          const nameMatch = requestPart.match(/name\s*=\s*"([^"]+)"/);
          const argsMatch = requestPart.match(/arguments\s*=\s*"([^"]*)"(\s*}?)/);

          // 解析 result
          const isErrorMatch = resultPart.match(/isError=([^,\s}]+)/);
          const resultTextMatch = resultPart.match(/resultText='([^']+)'/);
          const resultMatch = resultPart.match(/result=([^,]+),\s*resultText/);

          if (idMatch && nameMatch) {
            const execution = {
              id: idMatch[1],
              name: nameMatch[1],
              arguments: argsMatch ? argsMatch[1] : '',
              isError: isErrorMatch ? isErrorMatch[1] === 'true' : false,
              result: resultMatch ? resultMatch[1].trim() : '',
              resultText: resultTextMatch ? resultTextMatch[1] : ''
            };
            executions.push(execution);
          }
        }
      } catch (error) {
        console.warn('解析单个 ToolExecution 块失败:', error);
      }
    }

    return executions;
  }, []);

  // 解析网络搜索工具执行结果
  const parseWebSearchData = useCallback((content: string) => {
    try {
      // 查找 :data: 或 data: 的位置
      const dataIndex = content.search(/:?data:/);
      if (dataIndex === -1) return null;

      // 从 data: 后面开始查找 JSON 对象
      const startIndex = content.indexOf('{', dataIndex);
      if (startIndex === -1) return null;

      // 使用括号计数来找到完整的 JSON 对象
      let braceCount = 0;
      let endIndex = startIndex;
      for (let i = startIndex; i < content.length; i++) {
        if (content[i] === '{') braceCount++;
        else if (content[i] === '}') {
          braceCount--;
          if (braceCount === 0) {
            endIndex = i + 1;
            break;
          }
        }
      }

      if (braceCount !== 0) return null;

      const jsonStr = content.substring(startIndex, endIndex);
      const data = JSON.parse(jsonStr);

      // 检查是否是 webSearch 工具
      if (data.name !== 'webSearch') return null;

      // 解析 result 字段中的 JSON
      if (data.result && typeof data.result === 'string') {
        try {
          const parsedResult = JSON.parse(data.result);
          return {
            ...data,
            parsedResult
          };
        } catch (e) {
          console.warn('解析 webSearch result 失败:', e);
          return data;
        }
      }

      return data;
    } catch (error) {
      console.warn('解析 webSearch 数据失败:', error);
      return null;
    }
  }, []);

  // 解析工具调用步骤 (type: "tool_call" 格式)
  const parseToolCallSteps = useCallback((content: string) => {
    const steps: any[] = [];
    
    try {
      // 匹配所有 data: {...} 格式的工具调用步骤
      const dataRegex = /data:\s*(\{[^}]+\})/g;
      let match;
      
      while ((match = dataRegex.exec(content)) !== null) {
        try {
          const jsonStr = match[1];
          const data = JSON.parse(jsonStr);
          
          // 检查是否是工具调用步骤 (type: "tool_call")
          if (data.type === 'tool_call' && data.stage && data.message && data.tool) {
            steps.push({
              stage: data.stage,
              type: data.type,
              message: data.message,
              tool: data.tool,
              timestamp: data.timestamp
            });
          }
        } catch (e) {
          // 单个 JSON 解析失败，继续处理下一个
        }
      }
    } catch (error) {
      console.warn('解析工具调用步骤失败:', error);
    }
    
    return steps;
  }, []);

  // 从内容中移除工具调用步骤数据
  const removeToolCallStepsFromContent = useCallback((content: string) => {
    // 移除所有 data: {...} 格式的工具调用步骤
    return content.replace(/data:\s*\{[^}]*"type"\s*:\s*"tool_call"[^}]*\}/g, '').trim();
  }, []);

  // 获取每个会话的最后一条消息内容
  const loadLastMessagesForSessions = useCallback(async (sessionsList: any[]) => {
    const lastMessagePromises = sessionsList.map(async (session) => {
      try {
        const response = await chatApi.getChatList({ sessionId: session.id.toString(), userId: userId! });

        if (response.code === 200 && response.rows && response.rows.length > 0) {
          const lastMessage = response.rows[response.rows.length - 1];
          const content = lastMessage.content || '';
          const time = lastMessage.createTime || '';
          const truncatedContent = content.length > 20 ? content.substring(0, 20) + '...' : content;
          return { sessionId: session.id.toString(), content: truncatedContent, time };
        }
        return { sessionId: session.id.toString(), content: '', time: '' };
      } catch (error) {
        console.error(`Failed to load last message for session ${session.id}:`, error);
        return { sessionId: session.id.toString(), content: '', time: '' };
      }
    });

    try {
      const results = await Promise.all(lastMessagePromises);
      const lastMessagesMap: Record<string, { content: string; time: string }> = {};
      results.forEach(({ sessionId, content, time }) => {
        lastMessagesMap[sessionId] = { content, time };
      });
      setLastMessages(lastMessagesMap);

      const sessionsWithLastMessage = sessionsList.map(session => {
        const lastMessageData = lastMessagesMap[session.id.toString()];
        return { ...session, lastMessageData };
      });

      const parseTime = (timeStr: any): number => {
        try {
          if (!timeStr) return 0;
          if (typeof timeStr === 'number') return timeStr > 1000000000000 ? timeStr : timeStr * 1000;
          if (typeof timeStr === 'string') {
            if (/^\d+$/.test(timeStr)) {
              const n = parseInt(timeStr, 10);
              return n > 1000000000000 ? n : n * 1000;
            }
            const cn = parseChinaTimeString(timeStr);
            if (cn) return cn.getTime();
            const d = new Date(timeStr);
            const t = d.getTime();
            return isNaN(t) ? 0 : t;
          }
          return 0;
        } catch {
          return 0;
        }
      };

      const sortedSessions = sessionsWithLastMessage.sort((a, b) => {
        const getLastMessageTime = (session: any) => {
          if (session.lastMessageData?.time) {
            return parseTime(session.lastMessageData.time);
          } else {
            return parseTime(session.createTime);
          }
        };

        const aTime = getLastMessageTime(a);
        const bTime = getLastMessageTime(b);

        return bTime - aTime;
      });

      dispatch({
        type: 'SET_SESSION_LIST',
        payload: sortedSessions
      });

      isDataLoadedRef.current = true;
      cachedSessionsRef.current = sortedSessions;
      cachedLastMessagesRef.current = lastMessagesMap;
      
      saveToLocalStorage(sortedSessions, lastMessagesMap);
    } catch (error) {
      console.error('Failed to load last messages:', error);
    }
  }, [userId, dispatch, saveToLocalStorage]);

  // 加载会话列表
  const loadSessionList = useCallback(async () => {
    if (!userId) return;

    if (isDataLoadedRef.current && cachedSessionsRef.current.length > 0) {
      dispatch({ type: 'SET_SESSION_LIST', payload: cachedSessionsRef.current });
      setLastMessages(cachedLastMessagesRef.current);
      return;
    }

    const localCache = loadFromLocalStorage();
    if (localCache && localCache.sessions && localCache.sessions.length > 0) {
      dispatch({ type: 'SET_SESSION_LIST', payload: localCache.sessions });
      setLastMessages(localCache.lastMessages || {});
      
      cachedSessionsRef.current = localCache.sessions;
      cachedLastMessagesRef.current = localCache.lastMessages || {};
      isDataLoadedRef.current = true;
      
      return;
    }

    try {
      const response = await chatApi.getSessionList(userId, 'mcpx-chat');

      if (response && response.code === 401) {
        navigate('/login', { state: { from: { pathname: location.pathname } } });
        return;
      }

      let sessionsData: any[] = [];
      if (response.code === 200 && response.rows) {
        sessionsData = response.rows;
      } else if (response.code === 200 && response.data) {
        sessionsData = response.data;
      }

      if (sessionsData.length > 0) {
        const initialSorted = [...sessionsData].sort((a, b) => {
          const getTs = (it: any): number => {
            const ct: any = it?.createTime;
            try {
              if (!ct) return 0;
              if (typeof ct === 'number') return ct > 1000000000000 ? ct : ct * 1000;
              if (typeof ct === 'string') {
                if (/^\d+$/.test(ct)) {
                  const n = parseInt(ct, 10);
                  return n > 1000000000000 ? n : n * 1000;
                }
                const cn = parseChinaTimeString(ct);
                if (cn) return cn.getTime();
                const d = new Date(ct);
                const t = d.getTime();
                return isNaN(t) ? 0 : t;
              }
              return 0;
            } catch {
              return 0;
            }
          };
          return getTs(b) - getTs(a);
        });

        dispatch({ type: 'SET_SESSION_LIST', payload: initialSorted });
        loadLastMessagesForSessions(initialSorted);
      }
    } catch (error) {
      console.error(t('errors.loadFailed'), error);
    }
  }, [userId, dispatch, loadLastMessagesForSessions, loadFromLocalStorage, navigate, t]);

  // 强制刷新会话列表
  const refreshSessionList = useCallback(() => {
    isDataLoadedRef.current = false;
    cachedSessionsRef.current = [];
    cachedLastMessagesRef.current = {};
    
    try {
      localStorage.removeItem(CACHE_KEY);
      localStorage.removeItem(CACHE_TIMESTAMP_KEY);
    } catch (error) {
      console.error('Failed to clear localStorage cache:', error);
    }
  }, [CACHE_KEY, CACHE_TIMESTAMP_KEY]);

  // 加载模型列表
  const loadModels = useCallback(async () => {
    try {
      const response = await modelApi.getModelList();
      if (response.code === 200 && response.data) {
        // 过滤掉 text2video 类型的模型（忽略大小写）
        const list = response.data.filter(
          (m: ModelInfo) => !m.category?.toLowerCase().includes('video')
        );
        setModels(list);
        const cachedModelId = localStorage.getItem('selectedModelId');
        const preferredId = cachedModelId || selectedModel;
        const existsInList = preferredId && list.some((m: ModelInfo) => m.id === preferredId);
        if (existsInList) {
          if (preferredId !== selectedModel) {
            setSelectedModel(preferredId as string);
          }
        } else if (list.length > 0) {
          const firstId = list[0].id;
          setSelectedModel(firstId);
          localStorage.setItem('selectedModelId', firstId);
        }
      }
    } catch (error) {
      console.error(t('errors.loadFailed'), error);
    }
  }, [selectedModel]);

  // 检查登录状态
  useEffect(() => {
    if (!token || !userId) {
      navigate('/login', { state: { from: { pathname: location.pathname } } });
      return;
    }
    
    loadModels();
    loadSessionList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, userId]);

  // 自动提交功能 - 从 CreatorHubPage 跳转过来时自动发送消息
  useEffect(() => {
    const state = location.state as any;
    if (state?.autoSubmit && state?.initialMessage?.trim() && models.length > 0) {
      // 清除 autoSubmit 标记，避免重复触发
      navigate(location.pathname + (sessionId ? `/${sessionId}` : ''), { 
        replace: true, 
        state: { ...state, autoSubmit: false } 
      });

      // 延迟执行，确保页面已完全加载
      setTimeout(() => {
        handleSendMessage(state.initialMessage);
      }, 500);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state, models.length]);

  // 滚动到底部
  const scrollToBottom = () => {
    isProgrammaticScrollRef.current = true;
    
    const container = messagesContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
    
    setIsAtBottom(true);
    
    requestAnimationFrame(() => {
      setTimeout(() => {
        isProgrammaticScrollRef.current = false;
      }, 100);
    });
  };

  // 监听滚动
  const handleScroll = () => {
    const el = messagesContainerRef.current;
    if (!el) return;

    if (isProgrammaticScrollRef.current || isRestoringScrollRef.current) {
      return;
    }

    const threshold = 10; // 降低阈值，从50px改为10px
    const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - threshold;

    if (atBottom && !userScrolledAwayRef.current) {
      // 已在底部
    } else if (atBottom && userScrolledAwayRef.current) {
      userScrolledAwayRef.current = false;
    }

    setIsAtBottom(atBottom);

    // 保存滚动位置
    if (currentSessionId) {
      saveScrollPosition(currentSessionId, el.scrollTop);
    }
  };

  // 加载聊天历史
  const loadChatHistory = useCallback(async (sessionId: string, forceRefresh = false) => {
    if (!userId) return;

    // 如果已经加载过且不是强制刷新，直接返回
    if (loadedSessionsRef.current.has(sessionId) && !forceRefresh) {
      return;
    }

    // 优先使用缓存
    const cachedMessages = loadMessagesFromCache(sessionId);
    if (cachedMessages && cachedMessages.length > 0 && !forceRefresh) {
      console.log('Using cached messages for session:', sessionId, 'count:', cachedMessages.length);
      dispatch({
        type: 'SET_CHAT_MAP',
        payload: { sessionId, messages: cachedMessages }
      });

      setTimeout(() => {
        restoreScrollPosition(sessionId);
      }, 100);
      return;
    }

    try {
      console.log('Loading messages from server for session:', sessionId);
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await chatApi.getChatList({ sessionId, userId });

      if (response.code === 200 && response.rows) {
        const messages = response.rows.map((msg: any) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          sessionId: msg.sessionId,
          userId: msg.userId,
          createTime: msg.createTime,
          modelName: msg.modelName,
          deductCost: msg.deductCost,
          totalTokens: msg.totalTokens,
          remark: msg.remark
        }));

        dispatch({
          type: 'SET_CHAT_MAP',
          payload: { sessionId, messages }
        });

        // 保存到缓存
        saveMessagesToCache(sessionId, messages);
        loadedSessionsRef.current.add(sessionId); // 标记为已加载
        console.log('Saved messages to cache for session:', sessionId, 'count:', messages.length);

        setTimeout(() => {
          restoreScrollPosition(sessionId);
        }, 100);
      }
    } catch (error) {
      console.error(t('errors.loadFailed'), error);
      toast.error(t('errors.loadFailed'));
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [userId, dispatch, t, loadMessagesFromCache, saveMessagesToCache, restoreScrollPosition]);

  // 设置当前会话和加载聊天历史 - 只在sessionId变化时执行
  const prevSessionIdRef = useRef<string | undefined>(undefined);
  
  useEffect(() => {
    // 如果 sessionId 没有变化，不执行任何操作（避免从大图返回时重复触发）
    if (prevSessionIdRef.current === sessionId) {
      return;
    }
    prevSessionIdRef.current = sessionId;

    if (sessionId && !state.chatMap[sessionId]) {
      setCurrentSession(sessionId);

      // 立即检查缓存，如果有缓存直接使用，否则从服务器加载
      const cachedMessages = loadMessagesFromCache(sessionId);
      if (cachedMessages && cachedMessages.length > 0) {
        console.log('Using cached messages for session:', sessionId, 'count:', cachedMessages.length);
        dispatch({
          type: 'SET_CHAT_MAP',
          payload: { sessionId, messages: cachedMessages }
        });
        loadedSessionsRef.current.add(sessionId); // 标记为已加载
        
        // 恢复滚动位置
        setTimeout(() => {
          restoreScrollPosition(sessionId);
        }, 50);
      } else {
        // 没有缓存，从服务器加载
        loadChatHistory(sessionId);
      }
    } else if (sessionId && state.chatMap[sessionId]) {
      // 会话已加载，恢复滚动位置
      setTimeout(() => {
        restoreScrollPosition(sessionId);
      }, 50);
    }
  }, [sessionId]); // 只依赖sessionId，避免其他状态变化导致重新执行

  // 切换对话时恢复滚动位置 - 仅在真正切换会话时触发
  const lastRestoredSessionRef = useRef<string | undefined>(undefined);
  
  useEffect(() => {
    if (sessionId && sessionId !== lastRestoredSessionRef.current) {
      lastRestoredSessionRef.current = sessionId;
      // 延迟恢复，确保 DOM 已渲染
      const timer = setTimeout(() => {
        restoreScrollPosition(sessionId);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [sessionId, restoreScrollPosition]);

  // 发送消息
  const handleSendMessage = async (content: string, files?: File[]) => {
    if (!content.trim() && (!files || files.length === 0)) {
      return;
    }

    const currentUserId = localStorage.getItem('userId');
    const currentToken = localStorage.getItem('token');
    if (!currentUserId || !currentToken) {
      toast.error(currentLanguage === 'zh' ? '登录已过期，请重新登录' : 'Login expired, please login again');
      navigate('/login', { state: { from: { pathname: location.pathname } } });
      return;
    }

    let currentSessionId = sessionId;

    if (!sessionId) {
      try {
        const sessionResponse = await chatApi.createSession({
          userId: currentUserId,
          sessionContent: content,
          sessionTitle: content.slice(0, 20),
          remark: content.slice(0, 20),
          appId: 'mcpx-chat'
        });

        if (sessionResponse.code === 200 && sessionResponse.data) {
          currentSessionId = sessionResponse.data.toString();
          navigateWithAgent(`/chat/${currentSessionId}`);
          setCurrentSession(currentSessionId!);
          refreshSessionList();
          loadSessionList();
        } else {
          toast.error(currentLanguage === 'zh' ? '创建会话失败' : 'Failed to create session');
          return;
        }
      } catch (error) {
        console.error(currentLanguage === 'zh' ? '创建会话失败' : 'Failed to create session', error);
        toast.error(currentLanguage === 'zh' ? '创建会话失败' : 'Failed to create session');
        return;
      }
    }

    const timestamp = Date.now();
    const userMessageId = timestamp.toString();
    const aiMessageId = (timestamp + 1).toString();
    
    const userMessage: ChatMessageVo = {
      id: userMessageId,
      role: 'user',
      content: content.trim(),
      sessionId: currentSessionId!,
      userId: currentUserId,
      createTime: new Date().toISOString(),
      files: files && files.length > 0 ? files.map(file => ({
        uid: crypto.randomUUID(),
        name: file.name,
        type: file.type,
        size: file.size,
        url: URL.createObjectURL(file)
      })) : undefined
    };

    addMessage(currentSessionId!, userMessage);

    const aiMessage: ChatMessageVo = {
      id: aiMessageId,
      role: 'assistant',
      content: '',
      sessionId: currentSessionId!,
      userId: currentUserId,
      createTime: new Date().toISOString()
    };
    addMessage(currentSessionId!, aiMessage);
    
    userScrolledAwayRef.current = false;

    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      const selectedModelInfo = models.find(model => model.id === selectedModel);
      const modelName = selectedModelInfo?.modelName;

      const currentMessages = state.chatMap[currentSessionId!] || [];
      const historyMessages = currentMessages
        .filter((msg: ChatMessageVo) => msg.role === 'user' || msg.role === 'assistant')
        .slice(-10)
        .map((msg: ChatMessageVo) => ({
          role: msg.role,
          content: msg.content
        }));

      const messageContent = content.trim();
      const agentId = searchParams.get('agent');

      let aggregatedContent = '';

      if (files && files.length > 0) {
          await streamChatSendWithFiles(
          {
            messages: [...historyMessages, { role: 'user', content: messageContent }],
            sessionId: currentSessionId!,
            userId: currentUserId,
            stream: true,
            isMcp: isMcpEnabled,
            mcpConfig: isMcpEnabled ? mcpConfigMap : undefined,
            deepResearch: state.isDeepThinking,
            model: modelName || undefined,
            agent: agentId || undefined,
            kid: selectedKnowledge?.id?.toString() || undefined,
            internet: internetEnabled,
            appId: 'mcpx-chat'
          },
          files,
          (chunk: any) => {
            try {
              if (chunk?.type === 'agent_step') {
                setMessageSteps(prev => {
                  const messageId = String(aiMessageId);
                  const currentSteps = prev[messageId] || [];
                  const newSteps = [...currentSteps, {
                    stage: chunk.stage,
                    status: chunk.status,
                    message: chunk.message,
                    timestamp: chunk.timestamp
                  }];
                  return { ...prev, [messageId]: newSteps };
                });
                return;
              }
              let deltaContent = chunk.choices?.[0]?.delta?.content;
              
              if (deltaContent) {
                // 先累积内容用于解析
                aggregatedContent += deltaContent;
                
                // 实时解析工具调用步骤 - 从累积内容中提取完整的 data: {...} 块
                const toolCallRegex = /data:\s*\{[^{}]*"type"\s*:\s*"tool_call"[^{}]*\}/g;
                let match;
                while ((match = toolCallRegex.exec(aggregatedContent)) !== null) {
                  try {
                    const jsonStr = match[0].replace(/^data:\s*/, '');
                    const toolCallData = JSON.parse(jsonStr);
                    if (toolCallData.type === 'tool_call' && toolCallData.stage && toolCallData.message && toolCallData.tool) {
                      setMessageToolCallSteps(prev => {
                        const messageId = String(aiMessageId);
                        const currentSteps = prev[messageId] || [];
                        // 通过 timestamp 去重
                        const isDuplicate = currentSteps.some(s => 
                          s.timestamp === toolCallData.timestamp && 
                          s.stage === toolCallData.stage && 
                          s.tool === toolCallData.tool
                        );
                        if (isDuplicate) return prev;
                        
                        const newStep = {
                          stage: toolCallData.stage,
                          type: toolCallData.type,
                          message: toolCallData.message,
                          tool: toolCallData.tool,
                          timestamp: toolCallData.timestamp || Date.now()
                        };
                        return { ...prev, [messageId]: [...currentSteps, newStep] };
                      });
                    }
                  } catch (e) {
                    // 解析失败，忽略
                  }
                }
                
                // 检查是否包含需要过滤的内容
                if (deltaContent.includes('ToolExecution{') ||
                    deltaContent.includes('data:{"') || deltaContent.includes('data: {"') ||
                    deltaContent.includes('"type":"tool_call"') || deltaContent.includes('"type": "tool_call"')) {
                  // 不显示这些内容到聊天气泡
                  return;
                }
                
                // 检查 aggregatedContent 中是否有未闭合的 ToolExecution
                const lastToolStart = aggregatedContent.lastIndexOf('ToolExecution{');
                if (lastToolStart !== -1) {
                  const afterStart = aggregatedContent.substring(lastToolStart);
                  let braceCount = 0;
                  let isClosed = false;
                  for (let i = 0; i < afterStart.length; i++) {
                    if (afterStart[i] === '{') braceCount++;
                    else if (afterStart[i] === '}') {
                      braceCount--;
                      if (braceCount === 0) {
                        isClosed = true;
                        break;
                      }
                    }
                  }
                  if (!isClosed) return;
                }
                
                // 检查 aggregatedContent 中是否有未闭合的 data: JSON 块
                const lastDataStart = aggregatedContent.lastIndexOf('data:{"');
                if (lastDataStart !== -1) {
                  const afterDataStart = aggregatedContent.substring(lastDataStart + 5);
                  let braceCount = 0;
                  let isClosed = false;
                  for (let i = 0; i < afterDataStart.length; i++) {
                    if (afterDataStart[i] === '{') braceCount++;
                    else if (afterDataStart[i] === '}') {
                      braceCount--;
                      if (braceCount === 0) {
                        isClosed = true;
                        break;
                      }
                    }
                  }
                  if (!isClosed) return;
                }
                
                aggregatedContent += deltaContent;
                dispatch({
                  type: 'UPDATE_MESSAGE_CONTENT',
                  payload: {
                    sessionId: currentSessionId!,
                    messageId: aiMessageId,
                    deltaContent: deltaContent
                  }
                });
              }

              const reasoningContent = chunk.choices?.[0]?.delta?.reasoning_content;
              if (reasoningContent) {
                // 处理思考内容
              }
            } catch (error) {
              console.error('处理流式数据块出错:', error);
            }
          },
          (error: any) => {
            console.error(currentLanguage === 'zh' ? '流式请求错误' : 'Stream request error', error);
            toast.error(t('errors.sendFailed'));
          },
          () => {
            // 使用 chatMapRef 获取最新的消息状态，避免闭包问题
            const finalMessage = chatMapRef.current[currentSessionId!]?.find(msg => msg.id === aiMessageId);
            
            const lastMessageContent = (aggregatedContent && aggregatedContent.trim()) || finalMessage?.content || '';
            const truncatedContent = lastMessageContent.length > 20 ? lastMessageContent.substring(0, 20) + '...' : lastMessageContent;
            const lastMessageTime = finalMessage?.createTime || new Date().toISOString();

            setLastMessages(prev => ({
              ...prev,
              [currentSessionId!]: {
                content: truncatedContent,
                time: lastMessageTime
              }
            }));

            // 保存消息到缓存，确保下次加载时有最新数据
            // 使用 setTimeout 和 chatMapRef 确保获取最新状态
            setTimeout(() => {
              const latestMessages = chatMapRef.current[currentSessionId!] || [];
              if (latestMessages.length > 0) {
                saveMessagesToCache(currentSessionId!, latestMessages);
                console.log('Saved messages to cache after completion for session:', currentSessionId, 'count:', latestMessages.length);
              }
            }, 50);

            try {
              if (friendlyModeEnabled) {
                const contentToSpeak = (aggregatedContent && aggregatedContent.trim())
                  || chatMapRef.current[currentSessionId!]?.find(msg => msg.id === aiMessageId)?.content
                  || '';
                if (contentToSpeak) {
                  if ('speechSynthesis' in window) {
                    const u = new SpeechSynthesisUtterance(contentToSpeak);
                    u.lang = 'zh-CN';
                    u.rate = 1.0;
                    u.pitch = 1.0;
                    window.speechSynthesis.cancel();
                    window.speechSynthesis.speak(u);
                  }
                }
              }
            } catch (e) {
              console.warn('自动播报失败:', e);
            }
          }
        );
      } else {
          await streamChatSend(
          {
            messages: [...historyMessages, { role: 'user', content: messageContent }],
            sessionId: currentSessionId!,
            userId: currentUserId,
            stream: true,
            isMcp: isMcpEnabled,
            mcpConfig: isMcpEnabled ? mcpConfigMap : undefined,
            deepResearch: state.isDeepThinking,
            model: modelName || undefined,
            agent: agentId || undefined,
            kid: selectedKnowledge?.id?.toString() || undefined,
            internet: internetEnabled,
            appId:"mcpx-chat"
          },
          (chunk: any) => {
            try {
              if (chunk?.type === 'agent_step') {
                setMessageSteps(prev => {
                  const messageId = String(aiMessageId);
                  const currentSteps = prev[messageId] || [];
                  const newSteps = [...currentSteps, {
                    stage: chunk.stage,
                    status: chunk.status,
                    message: chunk.message,
                    timestamp: chunk.timestamp
                  }];
                  return { ...prev, [messageId]: newSteps };
                });
                return;
              }
              let deltaContent = chunk.choices?.[0]?.delta?.content;
              
              if (deltaContent) {
                // 先累积内容用于解析
                aggregatedContent += deltaContent;
                
                // 实时解析工具调用步骤 - 从累积内容中提取完整的 data: {...} 块
                const toolCallRegex = /data:\s*\{[^{}]*"type"\s*:\s*"tool_call"[^{}]*\}/g;
                let match;
                while ((match = toolCallRegex.exec(aggregatedContent)) !== null) {
                  try {
                    const jsonStr = match[0].replace(/^data:\s*/, '');
                    const toolCallData = JSON.parse(jsonStr);
                    if (toolCallData.type === 'tool_call' && toolCallData.stage && toolCallData.message && toolCallData.tool) {
                      setMessageToolCallSteps(prev => {
                        const messageId = String(aiMessageId);
                        const currentSteps = prev[messageId] || [];
                        // 通过 timestamp 去重
                        const isDuplicate = currentSteps.some(s => 
                          s.timestamp === toolCallData.timestamp && 
                          s.stage === toolCallData.stage && 
                          s.tool === toolCallData.tool
                        );
                        if (isDuplicate) return prev;
                        
                        const newStep = {
                          stage: toolCallData.stage,
                          type: toolCallData.type,
                          message: toolCallData.message,
                          tool: toolCallData.tool,
                          timestamp: toolCallData.timestamp || Date.now()
                        };
                        return { ...prev, [messageId]: [...currentSteps, newStep] };
                      });
                    }
                  } catch (e) {
                    // 解析失败，忽略
                  }
                }
                
                // 检查是否包含需要过滤的内容
                if (deltaContent.includes('ToolExecution{') ||
                    deltaContent.includes('data:{"') || deltaContent.includes('data: {"') ||
                    deltaContent.includes('"type":"tool_call"') || deltaContent.includes('"type": "tool_call"')) {
                  // 不显示这些内容到聊天气泡
                  return;
                }
                
                // 检查 aggregatedContent 中是否有未闭合的 ToolExecution
                const lastToolStart = aggregatedContent.lastIndexOf('ToolExecution{');
                if (lastToolStart !== -1) {
                  const afterStart = aggregatedContent.substring(lastToolStart);
                  let braceCount = 0;
                  let isClosed = false;
                  for (let i = 0; i < afterStart.length; i++) {
                    if (afterStart[i] === '{') braceCount++;
                    else if (afterStart[i] === '}') {
                      braceCount--;
                      if (braceCount === 0) {
                        isClosed = true;
                        break;
                      }
                    }
                  }
                  if (!isClosed) return;
                }
                
                // 检查 aggregatedContent 中是否有未闭合的 data: JSON 块
                const lastDataStart = aggregatedContent.lastIndexOf('data:{"');
                if (lastDataStart !== -1) {
                  const afterDataStart = aggregatedContent.substring(lastDataStart + 5);
                  let braceCount = 0;
                  let isClosed = false;
                  for (let i = 0; i < afterDataStart.length; i++) {
                    if (afterDataStart[i] === '{') braceCount++;
                    else if (afterDataStart[i] === '}') {
                      braceCount--;
                      if (braceCount === 0) {
                        isClosed = true;
                        break;
                      }
                    }
                  }
                  if (!isClosed) return;
                }
                
                // 显示内容
                dispatch({
                  type: 'UPDATE_MESSAGE_CONTENT',
                  payload: {
                    sessionId: currentSessionId!,
                    messageId: aiMessageId,
                    deltaContent: deltaContent
                  }
                });
              }

              const reasoningContent = chunk.choices?.[0]?.delta?.reasoning_content;
              if (reasoningContent) {
                // 处理思考内容
              }
            } catch (error) {
              console.error('处理流式数据块出错:', error);
            }
          },
          (error: any) => {
            console.error(currentLanguage === 'zh' ? '流式请求错误' : 'Stream request error', error);
            toast.error(t('errors.sendFailed'));
          },
          () => {
            // 使用 chatMapRef 获取最新的消息状态，避免闭包问题
            const finalMessage = chatMapRef.current[currentSessionId!]?.find(msg => msg.id === aiMessageId);
            
            const lastMessageContent = (aggregatedContent && aggregatedContent.trim()) || finalMessage?.content || '';
            const truncatedContent = lastMessageContent.length > 20 ? lastMessageContent.substring(0, 20) + '...' : lastMessageContent;
            const lastMessageTime = finalMessage?.createTime || new Date().toISOString();

            setLastMessages(prev => ({
              ...prev,
              [currentSessionId!]: {
                content: truncatedContent,
                time: lastMessageTime
              }
            }));

            // 保存消息到缓存，确保下次加载时有最新数据
            // 使用 setTimeout 和 chatMapRef 确保获取最新状态
            setTimeout(() => {
              const latestMessages = chatMapRef.current[currentSessionId!] || [];
              if (latestMessages.length > 0) {
                saveMessagesToCache(currentSessionId!, latestMessages);
                console.log('Saved messages to cache after completion for session:', currentSessionId, 'count:', latestMessages.length);
              }
            }, 50);

            try {
              if (friendlyModeEnabled) {
                const contentToSpeak = (aggregatedContent && aggregatedContent.trim())
                  || chatMapRef.current[currentSessionId!]?.find(msg => msg.id === aiMessageId)?.content
                  || '';
                if (contentToSpeak) {
                  if ('speechSynthesis' in window) {
                    const u = new SpeechSynthesisUtterance(contentToSpeak);
                    u.lang = 'zh-CN';
                    u.rate = 1.0;
                    u.pitch = 1.0;
                    window.speechSynthesis.cancel();
                    window.speechSynthesis.speak(u);
                  }
                }
              }
            } catch (e) {
              console.warn('自动播报失败:', e);
            }
          }
        );
      }

      if (!sessionId && currentSessionId) {
        setCurrentSession(currentSessionId);
      }
    } catch (error) {
      console.error(t('errors.sendFailed'), error);
      toast.error(t('errors.sendFailed'));
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // 切换深度思考模式
  const handleToggleDeepThinking = () => {
    setDeepThinking(!state.isDeepThinking);
  };

  // 处理模型选择
  const handleModelChange = (modelId: string) => {
    setSelectedModel(modelId);
    try {
      localStorage.setItem('selectedModelId', modelId);
    } catch {}
  };

  // 切换联网搜索
  // const handleToggleInternet = () => {
  //   setInternetEnabled(prev => !prev);
  // };

  // 切换友好模式
  const handleToggleFriendly = () => {
    setFriendlyModeEnabled(prev => !prev);
  };

  // 切换 MCP 功能
  const handleToggleMcp = () => {
    setShowMcpManager(true);
  };

  // 处理人工反馈提交
  const handleFeedbackSubmitted = (feedback: FeedbackOption) => {
    console.log('人工反馈已提交:', feedback);
    setShowFeedbackPanel(false);
  };

  // 加载参考链接
  const loadReferenceLinks = async (pageNum: number = 1, pageSize: number = 10) => {
    if (!sessionId) {
      setReferenceLinksError('无法获取会话ID');
      return;
    }

    setReferenceLinksLoading(true);
    setReferenceLinksError('');

    try {
      const response = await chatApi.getAiQueryResults({
        queryId: sessionId,
        pageNum,
        pageSize
      });

      if (response.code === 200 || response.code === 0) {
        const { rows = [], total = 0 } = response.data || response;
        setReferenceLinks(rows);
        setReferenceLinksPagination({
          current: pageNum,
          pageSize,
          total
        });
        setReferenceLinksError('');
      } else {
        setReferenceLinksError('获取参考链接失败');
      }
    } catch (error: any) {
      console.error('获取参考链接失败:', error);
      setReferenceLinksError(error.message || '获取参考链接失败');
    } finally {
      setReferenceLinksLoading(false);
    }
  };

  // 加载参考图片
  const loadReferenceImages = async () => {
    if (!sessionId) {
      setReferenceImagesError('无法获取会话ID');
      return;
    }

    setReferenceImagesLoading(true);
    setReferenceImagesError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.apiBaseUrl}/web/ai-query/images/${sessionId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': '*/*',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });

      const data = await response.json();

      if (data.code === 200) {
        const images = data.data || [];
        setReferenceImages(images);
        setReferenceImagesError('');
      } else {
        setReferenceImagesError('获取参考图片失败');
        setReferenceImages([]);
      }
    } catch (error: any) {
      console.error('获取参考图片失败:', error);
      setReferenceImagesError(error.message || '获取参考图片失败');
      setReferenceImages([]);
    } finally {
      setReferenceImagesLoading(false);
    }
  };

  // 处理显示参考链接
  const handleShowReferenceLinks = async () => {
    setShowReferenceLinks(true);
    await loadReferenceLinks(1, referenceLinksPagination.pageSize);
  };

  // 处理显示参考图片
  const handleShowReferenceImages = async () => {
    setShowReferenceImages(true);
    await loadReferenceImages();
  };

  // 处理分页变化
  const handleReferenceLinksPageChange = async (page: number, pageSize: number) => {
    await loadReferenceLinks(page, pageSize);
  };

  // 显示反馈详情
  const handleShowFeedbackDetails = () => {
    setShowFeedbackPanel(true);
  };

  // 切换侧边栏
  const handleToggleSidebar = () => {
    if (autoCollapsed) {
      setAutoCollapsed(false);
    }
    setSidebarCollapsed(!sidebarCollapsed);
  };

  // 监听用户主动滚动
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      if (isProgrammaticScrollRef.current || isRestoringScrollRef.current) return;

      // 只要有滚动行为就标记为用户主动滚动
      if (e.deltaY !== 0) {
        userScrolledAwayRef.current = true;
      }
    };

    let touchStartY = 0;
    const handleTouchStart = (e: TouchEvent) => {
      if (isProgrammaticScrollRef.current || isRestoringScrollRef.current) return;
      touchStartY = e.touches[0].clientY;
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      if (isProgrammaticScrollRef.current || isRestoringScrollRef.current) return;

      const touchY = e.touches[0].clientY;
      const deltaY = touchY - touchStartY;

      // 只要有触摸滑动就标记为用户主动滚动
      if (Math.abs(deltaY) > 5) { // 添加最小移动距离，避免误触发
        userScrolledAwayRef.current = true;
      }

      touchStartY = touchY;
    };

    container.addEventListener('wheel', handleWheel, { passive: true });
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: true });

    return () => {
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

  // 监听窗口宽度变化
  useEffect(() => {
    const handleResize = () => {
      const windowWidth = window.innerWidth;
      const breakpoint = 768;
      
      if (windowWidth < breakpoint && !autoCollapsed) {
        setAutoCollapsed(true);
        setSidebarCollapsed(true);
      } else if (windowWidth >= breakpoint && autoCollapsed) {
        setAutoCollapsed(false);
        setSidebarCollapsed(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [autoCollapsed]);

  // 获取当前会话的消息列表
  const currentSessionId = sessionId || state.currentSessionId;
  const currentMessages = currentSessionId ? state.chatMap[currentSessionId] || [] : [];
  
  // 记录上一次的消息数量，用于判断是否有新消息
  const prevMessageCountRef = useRef<number>(0);

  useEffect(() => {
    const currentCount = currentMessages.length;
    const prevCount = prevMessageCountRef.current;
    
    // 只有当消息数量增加时才自动滚动（有新消息）
    if (currentCount > prevCount && !userScrolledAwayRef.current && !isRestoringScrollRef.current) {
      scrollToBottom();
    }
    
    prevMessageCountRef.current = currentCount;
  }, [currentMessages.length]);

  const displayedMessages = React.useMemo(() => {
    if (showAllMessages) return currentMessages;
    const MAX = 200;
    return currentMessages.length > MAX ? currentMessages.slice(-MAX) : currentMessages;
  }, [currentMessages, showAllMessages]);

  // 使用 ref 缓存已处理的消息，避免重复计算
  const processedMessagesCache = useRef<Map<string, any>>(new Map());

  // 过滤消息内容中的工具执行结果和文件标签
  const filteredMessages = React.useMemo(() => {
    return displayedMessages.map(message => {
      // 使用消息ID和内容长度作为缓存键
      const cacheKey = `${message.id}-${message.content?.length || 0}`;
      
      // 如果缓存中已有处理结果，直接返回
      if (processedMessagesCache.current.has(cacheKey)) {
        return processedMessagesCache.current.get(cacheKey);
      }

      if (message.content) {
        let filteredContent = message.content;
        let executions: any[] = [];
        let parsedFiles: any[] = [];
        let webSearchData: any = null;

        // 解析工具执行结果（仅对 assistant 消息）
        if (message.role === 'assistant') {
          const toolExecutions = parseToolExecutions(filteredContent);
          if (toolExecutions.length > 0) {
            executions = toolExecutions;
            // 移除 ToolExecution 块
            let toolExecutionStart = filteredContent.indexOf('ToolExecution{');
            while (toolExecutionStart !== -1) {
              let braceCount = 0;
              let endIndex = toolExecutionStart;
              for (let i = toolExecutionStart; i < filteredContent.length; i++) {
                if (filteredContent[i] === '{') {
                  braceCount++;
                } else if (filteredContent[i] === '}') {
                  braceCount--;
                  if (braceCount === 0) {
                    endIndex = i + 1;
                    break;
                  }
                }
              }

              if (braceCount === 0) {
                const before = filteredContent.substring(0, toolExecutionStart);
                const after = filteredContent.substring(endIndex);
                filteredContent = before + after;
              } else {
                break;
              }

              toolExecutionStart = filteredContent.indexOf('ToolExecution{');
            }
          }

          // 解析网络搜索数据
          webSearchData = parseWebSearchData(filteredContent);
          // 移除 :data: 或 data: 开头的 webSearch 数据
          if (webSearchData) {
            // 查找并移除完整的 data: JSON 块
            const dataIndex = filteredContent.search(/:?data:/);
            if (dataIndex !== -1) {
              const startIndex = filteredContent.indexOf('{', dataIndex);
              if (startIndex !== -1) {
                let braceCount = 0;
                let endIndex = startIndex;
                for (let i = startIndex; i < filteredContent.length; i++) {
                  if (filteredContent[i] === '{') braceCount++;
                  else if (filteredContent[i] === '}') {
                    braceCount--;
                    if (braceCount === 0) {
                      endIndex = i + 1;
                      break;
                    }
                  }
                }
                if (braceCount === 0) {
                  const before = filteredContent.substring(0, dataIndex);
                  const after = filteredContent.substring(endIndex);
                  filteredContent = (before + after).trim();
                }
              }
            }
          }

          // 解析工具调用步骤 (type: "tool_call" 格式)
          const toolCallSteps = parseToolCallSteps(filteredContent);
          // 移除工具调用步骤数据
          if (toolCallSteps.length > 0) {
            filteredContent = removeToolCallStepsFromContent(filteredContent);
          }
        }

        // 解析文件标签（对所有消息类型）
        const { cleanContent, files } = parseFiles(filteredContent);
        filteredContent = cleanContent;
        parsedFiles = files;

        // 总是返回处理后的消息
        const processedMessage = {
          ...message,
          content: filteredContent.trim(),
          toolExecutions: executions,
          parsedFiles: parsedFiles,
          webSearchData: webSearchData,
          toolCallSteps: message.role === 'assistant' ? parseToolCallSteps(message.content || '') : []
        };

        // 缓存处理结果
        processedMessagesCache.current.set(cacheKey, processedMessage);
        
        // 限制缓存大小，避免内存泄漏
        if (processedMessagesCache.current.size > 500) {
          const firstKey = processedMessagesCache.current.keys().next().value;
          if (firstKey) {
            processedMessagesCache.current.delete(firstKey);
          }
        }

        return processedMessage;
      }
      
      const unchangedMessage = message;
      processedMessagesCache.current.set(cacheKey, unchangedMessage);
      return unchangedMessage;
    });
  }, [displayedMessages, parseToolExecutions, parseFiles, parseWebSearchData, parseToolCallSteps, removeToolCallStepsFromContent]);

  // 更新工具执行结果状态
  React.useEffect(() => {
    const allExecutions: any[] = [];
    filteredMessages.forEach(message => {
      if ((message as any).toolExecutions) {
        allExecutions.push(...(message as any).toolExecutions);
      }
    });
    setToolExecutions(allExecutions);
  }, [filteredMessages]);

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-slate-800 overflow-hidden font-sans">
      {/* 左侧聊天记录 */}
      <ChatSidebar
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={handleToggleSidebar}
        onLoadSessionList={loadSessionList}
        autoCollapsed={autoCollapsed}
        lastMessages={lastMessages}
        onRefreshSessionList={refreshSessionList}
      />
      
      {/* 右侧主区域容器 */}
      <div className="flex flex-1 relative min-w-0 overflow-hidden bg-white">
        {/* 聊天区域 */}
        <div className="flex flex-col flex-1 min-w-0 relative h-full transition-all duration-300 ease-in-out">
          {/* 顶部功能栏 */}
          <div className="sticky top-0 z-20 flex justify-between items-center px-6 py-4 bg-white/80 backdrop-blur-xl border-b border-slate-100 transition-all">
            <div className="flex items-center space-x-4">
              <ModelSelect
                selectedModel={selectedModel}
                onModelChange={handleModelChange}
                disabled={state.loading}
                models={models}
              />
            </div>
            {/* 个人状态和语言切换 */}
            <div className="flex items-center gap-4">
              <LanguageToggle />
              <div className="flex items-center gap-2 pl-4 border-l border-slate-200">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-violet-600 text-white flex items-center justify-center text-xs font-bold shadow-md ring-2 ring-white">
                  {localStorage.getItem('username')?.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-medium text-slate-700 hidden sm:block">
                   {localStorage.getItem('nickname')}
                </span>
              </div>
            </div>
          </div>

          {/* 聊天消息区域 */}
          <div 
            className="flex-1 overflow-y-auto relative" 
            ref={messagesContainerRef} 
            onScroll={handleScroll}
            style={{ 
              overscrollBehavior: 'none',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            <div className="mx-auto px-2 py-2 min-h-full" style={{ maxWidth: 'calc(64rem + 52px)' }}>
              {currentMessages.length === 0 ? (
                <div className="max-w-5xl mx-auto">
                  <WelcomeText onSuggestionClick={handleSendMessage} />
                </div>
              ) : (
                <div className="space-y-2 max-w-5xl pb-2 mx-auto">
                  {!showAllMessages && currentMessages.length > 200 && (
                    <div className="sticky top-0 z-0 -mt-4 mb-2 flex justify-center">
                      <button
                        type="button"
                        onClick={() => setShowAllMessages(true)}
                        className="px-4 py-2 text-xs font-medium bg-white/90 text-slate-600 rounded-full border border-slate-200 shadow-sm hover:bg-slate-50 backdrop-blur transition-all"
                      >
                        仅显示最近200条，点击查看全部（{currentMessages.length}）
                      </button>
                    </div>
                  )}
                  {/* 人工反馈横幅 */}
                  {currentSessionId && (
                    <HumanFeedbackBanner
                      threadId={currentSessionId}
                      onShowDetails={handleShowFeedbackDetails}
                    />
                  )}
                  
                  {/* 人工反馈面板 */}
                  {showFeedbackPanel && currentSessionId && (
                    <HumanFeedbackPanel
                      threadId={currentSessionId}
                      onFeedbackSubmitted={handleFeedbackSubmitted}
                      onClose={() => setShowFeedbackPanel(false)}
                      className="mb-6"
                    />
                  )}
                  
                  {filteredMessages.map((message) => {
                    const messageId = String(message.id);
                    const steps = message.role === 'assistant' ? messageSteps[messageId] : undefined;
                    // 优先使用实时的工具调用步骤，如果没有则使用从消息内容解析的
                    const toolSteps = message.role === 'assistant' 
                      ? (messageToolCallSteps[messageId] || (message as any).toolCallSteps || [])
                      : [];
                    return (
                      <React.Fragment key={`${message.id}-${message.content?.length || 0}`}>
                        <ChatMessage
                          message={message}
                          isTyping={state.loading && message.role === 'assistant' && !message.content.trim()}
                          agentSteps={steps}
                          onShowReferenceLinks={handleShowReferenceLinks}
                          onShowReferenceImages={handleShowReferenceImages}
                          parsedFiles={(message as any).parsedFiles}
                          webSearchData={(message as any).webSearchData}
                          toolCallSteps={toolSteps}
                        />
                      </React.Fragment>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
            
            {!isAtBottom && (
              <div className="sticky bottom-6 z-10 flex justify-center w-full pointer-events-none">
                <div className="max-w-3xl mx-auto w-full px-4 flex justify-center pointer-events-none">
                  <button
                    type="button"
                    onClick={() => {
                      userScrolledAwayRef.current = false;
                      scrollToBottom();
                    }}
                    className="pointer-events-auto group px-5 py-2.5 text-sm font-medium bg-white text-blue-600 rounded-full shadow-lg hover:shadow-xl hover:bg-gray-50 transition-all duration-200 flex items-center gap-2 backdrop-blur-sm border border-gray-200"
                    title={currentLanguage === 'zh' ? '回到底部' : 'Scroll to bottom'}
                  >
                    <ArrowDown size={16} className="group-hover:animate-bounce" />
                    <span>{currentLanguage === 'zh' ? '回到底部' : 'Bottom'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 工具执行结果区域 */}
          {toolExecutions.length > 0 && (
            <div className="w-full px-4 md:px-6 pb-4">
              <div className="max-w-5xl mx-auto">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                  <h3 className="text-sm font-medium text-blue-900 flex items-center gap-2">
                    <Wrench size={16} className="text-blue-600" />
                    工具执行结果
                  </h3>
                  <div className="space-y-2">
                    {toolExecutions.map((execution, index) => (
                      <div key={`${execution.id}-${index}`} className="bg-white rounded-md p-3 border border-blue-100">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium text-gray-700 mb-1">
                              {execution.name}
                            </div>
                            {execution.arguments && (
                              <div className="text-xs text-gray-600 mb-2 break-all">
                                参数: {execution.arguments}
                              </div>
                            )}
                            <div className={`text-sm ${execution.isError ? 'text-red-700' : 'text-green-700'}`}>
                              {execution.isError ? '❌ ' : '✅ '}
                              {execution.resultText || execution.result}
                            </div>
                          </div>
                          <div className="text-xs text-gray-500 flex-shrink-0">
                            ID: {execution.id.slice(-8)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 聊天输入区域 - 悬浮式设计 */}
          <div className="w-full px-4 md:px-6 pb-6 pt-2 bg-gradient-to-t from-white via-white to-transparent z-20">
            <div className="max-w-5xl mx-auto bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-slate-100/50 p-2 transition-shadow hover:shadow-[0_8px_40px_rgb(0,0,0,0.12)]">
              <ChatInput
                onSend={handleSendMessage}
                isDeepThinking={state.isDeepThinking}
                onToggleDeepThinking={handleToggleDeepThinking}
                isMcpEnabled={isMcpEnabled}
                onToggleMcp={handleToggleMcp}
                disabled={state.loading}
                placeholder={state.loading ?
                  (currentLanguage === 'zh' ? "AI正在思考中..." : "AI is thinking...") :
                  t('chat.typingPlaceholder')
                }
                selectedKnowledge={selectedKnowledge}
                onSelectKnowledge={setSelectedKnowledge}
                onOpenKnowledgeManager={() => setShowKnowledgeManager(true)}

                friendlyEnabled={friendlyModeEnabled}
                onToggleFriendly={handleToggleFriendly}
                onInput={() => {
                  setShowReferenceLinks(false);
                  setShowReferenceImages(false);
                }}
              />
            </div>
            <div className="text-center mt-2">
               <p className="text-[10px] text-slate-400">内容由AI生成，请核实重要信息。</p>
            </div>
          </div>
        </div>

        {/* 参考链接侧边栏 - 并排显示 */}
        <div className={`flex-shrink-0 transition-all duration-300 ease-in-out bg-white border-l border-slate-100 ${showReferenceLinks ? 'w-[380px] opacity-100 translate-x-0' : 'w-0 opacity-0 translate-x-20 overflow-hidden'}`}>
           <div className="w-[380px] h-full">
             <ReferenceLinksSidebar
                isOpen={true}
                className="h-full w-full shadow-none border-none bg-slate-50/30"
                onClose={() => setShowReferenceLinks(false)}
                links={referenceLinks}
                loading={referenceLinksLoading}
                error={referenceLinksError}
                pagination={referenceLinksPagination}
                onPageChange={handleReferenceLinksPageChange}
             />
           </div>
        </div>

        {/* 参考图片侧边栏 - 并排显示 */}
        {showReferenceImages && (
          <ReferenceImagesSidebar
            isOpen={true}
            className="flex-shrink-0 transition-all duration-300 ease-in-out bg-white border-l border-slate-100 shadow-none border-none bg-slate-50/30 w-[380px]"
            onClose={() => {
              setShowReferenceImages(false);
            }}
            images={referenceImages}
            loading={referenceImagesLoading}
            error={referenceImagesError}
          />
        )}
      </div>

      {/* 知识库管理弹窗 */}
      <KnowledgeManager
        isOpen={showKnowledgeManager}
        onClose={() => setShowKnowledgeManager(false)}
      />

      {/* MCP 管理弹窗 */}
      <McpManager
        isOpen={showMcpManager}
        onClose={() => setShowMcpManager(false)}
        defaultTab="my"
        onSave={({ selectedServerIds, configMap }) => {
          setMcpSelectedIds(selectedServerIds);
          // 当没有选择任何MCP服务器时，清空配置并禁用MCP
          if (selectedServerIds.length === 0) {
            setMcpConfigMap({});
            setIsMcpEnabled(false);
          } else {
            setMcpConfigMap(configMap);
            setIsMcpEnabled(true);
          }
        }}
        initialSelectedIds={mcpSelectedIds}
        initialConfigMap={mcpConfigMap}
      />
    </div>
  );
});

ChatPageContent.displayName = 'ChatPageContent';

// 主聊天页面组件
export const ChatPage: React.FC = () => {
  return (
    <ChatProvider>
      <FilesProvider>
        <ChatPageContent />
      </FilesProvider>
    </ChatProvider>
  );
};

