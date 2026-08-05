import React, { useState, useRef, useEffect } from 'react';
import { Send, Brain, X, FileText, Image, Video, Music, Mic, MicOff, Volume2 } from 'lucide-react';
import { FileUpload } from './FileUpload';
import { KnowledgeSelect } from './KnowledgeSelect';
import { KnowledgeInfo } from '../../types';
import { useFiles } from '../../contexts/FilesContext';
import { McpToggle } from '../ui/McpToggle';
import { 
  shouldShowSpeechRecognition, 
  createSpeechRecognition,
  isWeChatBrowser,
  isMobileBrowser,
  getBrowserEnvironmentInfo
} from '../../utils/speechRecognition';

interface ChatInputProps {
  onSend: (message: string, files?: File[]) => void;
  isDeepThinking?: boolean;
  onToggleDeepThinking?: () => void;
  isMcpEnabled?: boolean;
  onToggleMcp?: () => void;
  disabled?: boolean;
  placeholder?: string;
  selectedKnowledge?: KnowledgeInfo | null;
  onSelectKnowledge?: (knowledge: KnowledgeInfo | null) => void;
  onOpenKnowledgeManager?: () => void;
  friendlyEnabled?: boolean;
  onToggleFriendly?: () => void;
  voiceEnabled?: boolean;
  onToggleVoice?: () => void;
  onInput?: () => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  isDeepThinking = false,
  onToggleDeepThinking,
  isMcpEnabled = false,
  onToggleMcp,
  disabled = false,
  placeholder = "输入您的消息...",
  selectedKnowledge,
  onSelectKnowledge,
  onOpenKnowledgeManager,
  friendlyEnabled = false,
  onToggleFriendly,
  voiceEnabled = false,
  onToggleVoice,
  onInput
}) => {
  const [message, setMessage] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);
  const finalTranscriptRef = useRef<string>('');
  const interimTranscriptRef = useRef<string>('');
  const userStoppedRef = useRef<boolean>(false);
  const noSpeechRetryRef = useRef<number>(0);
  const appendedLengthRef = useRef<number>(0);
  const autoContinueRef = useRef<boolean>(false);
  const endTimeoutRef = useRef<number | null>(null);
  
  // 检测语音识别支持情况
  const speechRecognitionSupported = shouldShowSpeechRecognition();
  
  // 调试信息（开发环境下显示）
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('桌面端语音识别环境信息:', getBrowserEnvironmentInfo());
    }
  }, []);
  // 将缓冲的识别结果写入输入框并清理缓存
  const flushBufferedTranscripts = () => {
    const remaining = finalTranscriptRef.current.slice(appendedLengthRef.current).trim();
    const interimText = interimTranscriptRef.current.trim();
    if (remaining) {
      setMessage(prev => (prev ? prev + ' ' : '') + remaining);
      appendedLengthRef.current = finalTranscriptRef.current.length;
    } else if (!finalTranscriptRef.current && interimText) {
      setMessage(prev => (prev ? prev + ' ' : '') + interimText);
    }
    finalTranscriptRef.current = '';
    interimTranscriptRef.current = '';
    appendedLengthRef.current = 0;
  };
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { filesList, clearFiles, removeFile } = useFiles();

  // 创建新的识别实例
  const createRecognitionInstance = () => {
    // 使用工具函数创建语音识别实例
    const recognition = createSpeechRecognition('zh-CN');
    if (!recognition) {
      return null;
    }

    // 设置为连续识别模式
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setIsRecording(true);
      userStoppedRef.current = false;
      noSpeechRetryRef.current = 0;
      finalTranscriptRef.current = '';
      interimTranscriptRef.current = '';
      appendedLengthRef.current = 0;
      if (endTimeoutRef.current) {
        window.clearTimeout(endTimeoutRef.current);
        endTimeoutRef.current = null;
      }
    };

    recognition.onresult = (event: any) => {
      let localFinal = '';
      let localInterim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          localFinal += transcript;
        } else {
          localInterim += transcript;
        }
      }
      if (localFinal) {
        finalTranscriptRef.current += localFinal;
        const delta = finalTranscriptRef.current.slice(appendedLengthRef.current).trim();
        if (delta) {
          setMessage(prev => (prev ? prev + ' ' : '') + delta);
          appendedLengthRef.current = finalTranscriptRef.current.length;
        }
      }
      if (localInterim) {
        interimTranscriptRef.current = localInterim; // 仅保留最近一次的临时片段
      }
    };

    recognition.onend = () => {
      if (endTimeoutRef.current) {
        window.clearTimeout(endTimeoutRef.current);
        endTimeoutRef.current = null;
      }
      // 写入文本（一次性）
      flushBufferedTranscripts();

      // 若用户主动停止，则不重启
      if (userStoppedRef.current) {
        setIsRecording(false);
        recognitionRef.current = null;
        return;
      }

      // 自动续录：某些浏览器会在一段静默后自然结束
      if (autoContinueRef.current) {
        try {
          const next = createRecognitionInstance();
          if (next) {
            recognitionRef.current = next;
            next.start();
            return;
          }
        } catch (e) {
          console.error('自动续录启动失败:', e);
        }
      }
      setIsRecording(false);
      recognitionRef.current = null;
    };

    recognition.onerror = (event: any) => {
      if (event?.error === 'aborted') {
        // 主动中止，直接复位状态
        autoContinueRef.current = false;
        recognitionRef.current = null;
        setIsRecording(false);
        return;
      }
      console.error('语音识别错误:', event.error);
      // 用户主动停止不处理
      if (userStoppedRef.current) return;
      // no-speech 轻微错误：仅重试一次
      if (event.error === 'no-speech' && noSpeechRetryRef.current < 1) {
        noSpeechRetryRef.current += 1;
        try { recognition.stop(); } catch {}
        setTimeout(() => {
          try { recognition.start(); } catch (e) {
            console.error('重启语音识别失败:', e);
            autoContinueRef.current = false;
            recognitionRef.current = null;
            setIsRecording(false);
          }
        }, 300);
        return;
      }
      // 其他错误（network、audio-capture等）：立即清理并复位，避免UI卡住
      flushBufferedTranscripts();
      autoContinueRef.current = false;
      userStoppedRef.current = true;
      try { recognition.abort(); } catch {}
      recognitionRef.current = null;
      setIsRecording(false);
    };

    return recognition;
  };

  // 开始/停止语音录制
  const toggleRecording = () => {
    // 检查是否支持语音识别
    if (!speechRecognitionSupported) {
      if (isWeChatBrowser()) {
        alert('微信浏览器不支持语音识别功能');
      } else if (isMobileBrowser()) {
        alert('当前移动浏览器不支持语音识别功能');
      } else {
        alert('您的浏览器不支持语音识别功能');
      }
      return;
    }
    
    // 停止录音
    if (isRecording && recognitionRef.current) {
      userStoppedRef.current = true;
      autoContinueRef.current = false;
      try {
        // 优先优雅停止，触发 onend 用于最终写入
        recognitionRef.current.stop();
      } catch {
        try { recognitionRef.current.abort(); } catch {}
      }
      // 安全兜底：若 onend 未在预期时间内触发，则强制收尾
      if (endTimeoutRef.current) window.clearTimeout(endTimeoutRef.current);
      endTimeoutRef.current = window.setTimeout(() => {
        flushBufferedTranscripts();
        recognitionRef.current = null;
        setIsRecording(false);
        endTimeoutRef.current = null;
      }, 1500);
      // 等待 onend 统一收尾
      return;
    }

    // 防御：UI卡住时（显示录音中但实例已空），强制复位
    if (isRecording && !recognitionRef.current) {
      userStoppedRef.current = true;
      autoContinueRef.current = false;
      setIsRecording(false);
      return;
    }

    // 开始录音（每次新建实例）
    try {
      userStoppedRef.current = false;
      noSpeechRetryRef.current = 0;
      autoContinueRef.current = true;
      const rec = createRecognitionInstance();
      if (!rec) {
        alert('无法创建语音识别实例');
        return;
      }
      recognitionRef.current = rec;
      rec.start();
    } catch (e) {
      console.error('启动语音识别失败:', e);
      setIsRecording(false);
      alert('启动语音识别失败');
    }
  };

  // 卸载清理
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch {}
        recognitionRef.current = null;
      }
    };
  }, []);

  // 自动调整文本框高度
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [message]);

  const handleSubmit = () => {
    if ((!message.trim() && filesList.length === 0) || disabled) return;
    
    // 发送消息和文件
    const files = filesList.map(file => file.file);
    onSend(message.trim(), files);
    setMessage('');
    clearFiles(); // 清空文件列表
    
    // 重置文本框高度
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !isComposing) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // 获取文件图标
  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="w-3 h-3" />;
    if (type.startsWith('video/')) return <Video className="w-3 h-3" />;
    if (type.startsWith('audio/')) return <Music className="w-3 h-3" />;
    return <FileText className="w-3 h-3" />;
  };

  // 格式化文件大小
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + sizes[i];
  };

  return (
    <div className="bg-transparent p-0">
      {/* 文件列表显示区域 */}
      {filesList.length > 0 && (
        <div className="bg-white border-b border-gray-200 p-2">
          <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
            <span>已选择 {filesList.length} 个文件</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {filesList.map((file) => (
              <div
                key={file.uid}
                className="flex items-center gap-1 px-2 py-1 bg-white border border-gray-200 rounded-md text-xs hover:bg-gray-50"
                title={`${file.name} (${formatFileSize(file.fileSize)})`}
              >
                <span className="text-gray-400">
                  {getFileIcon(file.type)}
                </span>
                <span className="text-gray-700 truncate max-w-24">
                  {file.name}
                </span>
                <span className="text-gray-400">
                  ({formatFileSize(file.fileSize)})
                </span>
                <button
                  onClick={() => removeFile(file.uid)}
                  className="flex-shrink-0 text-gray-400 hover:text-red-500 transition-colors ml-1"
                  title="删除文件"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-transparent p-2">
        {/* 功能按钮栏 */}
        <div className="flex items-center gap-2 mb-2 px-2">
          {/* 文件上传按钮 */}
          <FileUpload />

          {/* 知识库按钮 */}
          <KnowledgeSelect
            selectedKnowledge={selectedKnowledge}
            onSelect={(k) => onSelectKnowledge && onSelectKnowledge(k)}
            onManageKnowledge={() => onOpenKnowledgeManager && onOpenKnowledgeManager()}
            disabled={disabled}
          />

          {/* 联网搜索开关 */}
          {/* {onToggleInternet && (
            <button
              type="button"
              onClick={onToggleInternet}
              disabled={disabled}
              className={`p-2 transition-colors disabled:opacity-50 ${
                internetEnabled
                  ? 'text-blue-500 hover:text-blue-400'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
              title={internetEnabled ? '联网搜索已开启' : '联网搜索已关闭'}
            >
              <Globe size={20} />
            </button>
          )} */}

          {/* 友好模式开关（自动播报AI回复） */}
          {onToggleFriendly && (
            <button
              type="button"
              onClick={onToggleFriendly}
              disabled={disabled}
              className={`p-2 transition-colors disabled:opacity-50 ${
                friendlyEnabled
                  ? 'text-emerald-600 hover:text-emerald-500'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
              title={friendlyEnabled ? '友好模式已开启（自动播报）' : '友好模式已关闭'}
            >
              {/* 使用现有图标组合：小喇叭 + 心形的替代风格，这里先用 Brain 表示开关以保持一致风格 */}
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18V5l12-2v13"></path>
                <circle cx="6" cy="18" r="3"></circle>
              </svg>
            </button>
          )}

          {/* 语音回复：开启后请求传 voice:true，服务端返回 <audio> */}
          {onToggleVoice && (
            <button
              type="button"
              onClick={onToggleVoice}
              disabled={disabled}
              className={`p-2 transition-colors disabled:opacity-50 ${
                voiceEnabled
                  ? 'text-violet-500 hover:text-violet-400'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
              title={voiceEnabled ? '关闭语音回复' : '开启语音回复'}
            >
              <Volume2 size={20} />
            </button>
          )}

          {/* 语音录入按钮（移至发送按钮旁） */}

          {/* 深度思考开关 */}
          {onToggleDeepThinking && (
            <button
              type="button"
              onClick={onToggleDeepThinking}
              disabled={disabled}
              className={`p-2 transition-colors disabled:opacity-50 ${
                isDeepThinking 
                  ? 'text-blue-500 hover:text-blue-400' 
                  : 'text-gray-500 hover:text-gray-800'
              }`}
              title={isDeepThinking ? '关闭深度思考' : '开启深度思考'}
            >
              <Brain size={20} />
            </button>
          )}

        {/* MCP 开关（紧邻深度思考按钮） */}
        {onToggleMcp && (
          <McpToggle enabled={isMcpEnabled} disabled={disabled} onToggle={onToggleMcp} />
        )}
        </div>

        {/* 文本输入框 */}
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              onInput?.();
            }}
            onKeyDown={handleKeyDown}
            onCompositionStart={() => setIsComposing(true)}
            onCompositionEnd={() => setIsComposing(false)}
            placeholder={placeholder}
            disabled={disabled}
            className="w-full bg-transparent rounded-lg px-4 py-3 pr-28 text-gray-800 placeholder-gray-500 focus:outline-none resize-none"
            style={{ minHeight: '80px', maxHeight: '200px' }}
            rows={3}
          />
          {/* 右侧操作区：语音与发送按钮 */}
          <div className="absolute right-4 bottom-4 flex items-center gap-2">
            {/* 语音按钮（与发送键同高同视觉权重） - 只在支持的环境中显示 */}
            {speechRecognitionSupported && (
              <button
                type="button"
                onClick={toggleRecording}
                disabled={disabled}
                className={`bg-white text-gray-700 border border-gray-300 p-3 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  isRecording ? 'ring-2 ring-red-400 text-red-600 border-red-300' : ''
                }`}
                title={isRecording ? '停止语音录入' : '开始语音录入'}
              >
                {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
              </button>
            )}

            {/* 发送按钮 */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={(!message.trim() && filesList.length === 0) || disabled}
              className="bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="发送消息"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
      
      {/* 状态提示区域 */}
      <div className="flex items-center gap-4 text-xs text-gray-500 pl-2 pb-2">
        {/* 深度思考状态提示 */}
        {isDeepThinking && (
          <div className="flex items-center gap-2 text-blue-500">
            <Brain size={14} />
            <span>深度思考模式已开启</span>
          </div>
        )}

        {voiceEnabled && (
          <div className="flex items-center gap-2 text-violet-500">
            <Volume2 size={14} />
            <span>语音回复已开启</span>
          </div>
        )}
        
        {/* 语音录入状态提示 */}
        {speechRecognitionSupported && isRecording && (
          <div className="flex items-center gap-2 text-red-500">
            <Mic size={14} />
            <span>正在录音中...</span>
          </div>
        )}
      </div>
    </div>
  );
}; 