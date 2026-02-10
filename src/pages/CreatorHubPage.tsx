import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  MessageSquare, 
  Image, 
  Video, 
  Globe, 
  Compass, 
  Bot,
  ChevronDown,
  Upload,
  X,
  ArrowRight,
  Zap,
  Maximize2,
  RatioIcon,
  Eye,
  Play,
  Loader2
} from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { modelApi, ModelInfo } from '../services/modelApi';
import { showcaseApi, ShowcaseCategory, ShowcaseContent } from '../services/showcaseApi';
import { useLanguage } from '../contexts/LanguageContext';
import { toast } from '../utils/toast';

// 功能类型定义
type CreationType = 'text' | 'image' | 'video' | 'web' | 'mcp' | 'agent';

interface CreationOption {
  type: CreationType;
  icon: React.ReactNode;
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  color: string;
  bgColor: string;
  route: string;
  modelCategory?: string;
  supportsUpload?: boolean;
}

const creationOptions: CreationOption[] = [
  {
    type: 'text',
    icon: <MessageSquare className="w-6 h-6" />,
    title: '文案生成',
    titleEn: 'Text Generation',
    description: '智能对话，生成文章、文案、代码等',
    descriptionEn: 'AI chat for articles, copywriting, code, etc.',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10 hover:bg-blue-500/20',
    route: '/chat',
    modelCategory: 'chat'
  },
  {
    type: 'image',
    icon: <Image className="w-6 h-6" />,
    title: '图片生成',
    titleEn: 'Image Generation',
    description: '文生图、图生图，创意无限',
    descriptionEn: 'Text-to-image, image-to-image creation',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10 hover:bg-purple-500/20',
    route: '/image-editor',
    modelCategory: 'text2image',
    supportsUpload: true
  },
  {
    type: 'video',
    icon: <Video className="w-6 h-6" />,
    title: '视频生成',
    titleEn: 'Video Generation',
    description: '图生视频、文生视频，一键成片',
    descriptionEn: 'Image-to-video, text-to-video creation',
    color: 'text-pink-500',
    bgColor: 'bg-pink-500/10 hover:bg-pink-500/20',
    route: '/video-studio',
    modelCategory: 'text2video',
    supportsUpload: true
  },
  {
    type: 'web',
    icon: <Globe className="w-6 h-6" />,
    title: '网页生成',
    titleEn: 'Website Generation',
    description: '一句话生成完整网站',
    descriptionEn: 'Generate complete websites with one sentence',
    color: 'text-green-500',
    bgColor: 'bg-green-500/10 hover:bg-green-500/20',
    route: '/app/new'
  },
  {
    type: 'mcp',
    icon: <Compass className="w-6 h-6" />,
    title: 'MCP 导航',
    titleEn: 'MCP Navigation',
    description: '探索 MCP 服务器生态',
    descriptionEn: 'Explore MCP server ecosystem',
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10 hover:bg-orange-500/20',
    route: '/mcp'
  },
  {
    type: 'agent',
    icon: <Bot className="w-6 h-6" />,
    title: 'Agent 智能体',
    titleEn: 'AI Agents',
    description: '发现和使用 AI 智能体',
    descriptionEn: 'Discover and use AI agents',
    color: 'text-cyan-500',
    bgColor: 'bg-cyan-500/10 hover:bg-cyan-500/20',
    route: '/agent'
  }
];

// 模型选择下拉组件
const ModelSelector: React.FC<{
  models: ModelInfo[];
  selectedModel: string;
  onSelect: (modelId: string) => void;
  disabled?: boolean;
}> = ({ models, selectedModel, onSelect, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selectedModelInfo = models.find(m => m.id === selectedModel);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (models.length === 0) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className="flex items-center gap-2 px-3 py-1.5 lg:px-4 lg:py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm lg:text-base text-gray-300 transition-colors disabled:opacity-50"
      >
        <Zap className="w-4 h-4 lg:w-5 lg:h-5 text-orange-400" />
        <span className="max-w-[150px] lg:max-w-[200px] truncate">{selectedModelInfo?.modelName || '选择模型'}</span>
        <ChevronDown className={`w-4 h-4 lg:w-5 lg:h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 bottom-full left-0 mb-2 w-72 lg:w-80 xl:w-96 bg-[#1a1a1a] border border-gray-800 rounded-lg shadow-xl overflow-hidden">
          <div className="p-2 lg:p-3 border-b border-gray-800">
            <span className="text-xs lg:text-sm text-gray-500 px-2">选择模型</span>
          </div>
          <div className="max-h-64 lg:max-h-80 overflow-y-auto py-1">
            {models.map((model) => (
              <button
                key={model.id}
                onClick={() => {
                  onSelect(model.id);
                  setIsOpen(false);
                }}
                className={`w-full px-3 py-2.5 lg:px-4 lg:py-3 flex items-start gap-3 hover:bg-gray-800 transition-colors ${
                  selectedModel === model.id ? 'bg-orange-500/20' : ''
                }`}
              >
                <div className={`w-2 h-2 lg:w-2.5 lg:h-2.5 rounded-full mt-1.5 flex-shrink-0 ${
                  selectedModel === model.id ? 'bg-orange-400' : 'bg-gray-600'
                }`} />
                <div className="flex-1 text-left min-w-0">
                  <div className="text-sm lg:text-base text-gray-200 font-medium truncate">
                    {model.modelDescribe || model.modelName}
                  </div>
                  {model.remark && (
                    <div className="text-xs lg:text-sm text-gray-500 mt-0.5 line-clamp-1">
                      {model.remark}
                    </div>
                  )}
                </div>
                <span className={`text-xs lg:text-sm px-2 py-0.5 rounded-full ${
                  model.modelPrice === 0 ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                }`}>
                  {model.modelPrice === 0 ? '免费' : '收费'}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// 图片上传预览组件
const ImageUploadPreview: React.FC<{
  images: File[];
  onRemove: (index: number) => void;
}> = ({ images, onRemove }) => {
  if (images.length === 0) return null;

  return (
    <div className="flex gap-2 lg:gap-3 flex-wrap mb-3">
      {images.map((file, index) => (
        <div key={index} className="relative group">
          <img
            src={URL.createObjectURL(file)}
            alt={`upload-${index}`}
            className="w-16 h-16 lg:w-20 lg:h-20 xl:w-24 xl:h-24 object-cover rounded-lg border border-white/10"
          />
          <button
            onClick={() => onRemove(index)}
            className="absolute -top-2 -right-2 w-5 h-5 lg:w-6 lg:h-6 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="w-3 h-3 lg:w-4 lg:h-4 text-white" />
          </button>
        </div>
      ))}
    </div>
  );
};

// 视频缩略图组件 - 使用 video 标签的 poster 或直接显示视频帧
const VideoThumbnail: React.FC<{
  videoUrl: string;
  alt: string;
  className?: string;
}> = ({ videoUrl, className = '' }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!videoUrl) {
      setError(true);
      setLoading(false);
      return;
    }

    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.muted = true;
    video.playsInline = true;
    video.preload = 'metadata';

    let timeoutId: ReturnType<typeof setTimeout>;

    const captureFrame = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 360;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          setThumbnailUrl(dataUrl);
          setLoading(false);
        }
      } catch (e) {
        console.warn('Canvas 截图失败（可能是 CORS）:', e);
        // Canvas 失败，回退到直接显示 video
        setThumbnailUrl(null);
        setLoading(false);
      }
      video.remove();
    };

    video.onloadeddata = () => {
      video.currentTime = 0.1;
    };

    video.onseeked = () => {
      clearTimeout(timeoutId);
      captureFrame();
    };

    video.onerror = () => {
      console.error('视频加载失败:', videoUrl);
      clearTimeout(timeoutId);
      setError(true);
      setLoading(false);
      video.remove();
    };

    // 超时处理 - 5秒后如果还没加载完就显示 video 标签
    timeoutId = setTimeout(() => {
      console.warn('视频加载超时，使用 video 标签显示');
      setThumbnailUrl(null);
      setLoading(false);
      video.remove();
    }, 5000);

    video.src = videoUrl;
    video.load();

    return () => {
      clearTimeout(timeoutId);
      video.remove();
    };
  }, [videoUrl]);

  if (!videoUrl || error) {
    return (
      <div className={`flex items-center justify-center bg-gray-800 ${className}`}>
        <Video className="w-12 h-12 text-gray-600" />
      </div>
    );
  }

  // 加载中
  if (loading) {
    return (
      <div className={`flex items-center justify-center bg-gray-800 ${className}`}>
        <div className="w-6 h-6 border-2 border-gray-600 border-t-orange-500 rounded-full animate-spin" />
      </div>
    );
  }

  // 如果成功截取了缩略图，显示图片
  if (thumbnailUrl) {
    return (
      <img
        src={thumbnailUrl}
        alt="video thumbnail"
        className={`object-cover ${className}`}
      />
    );
  }

  // 回退方案：直接显示 video 标签（暂停在第一帧）
  return (
    <video
      ref={videoRef}
      src={videoUrl}
      muted
      playsInline
      preload="metadata"
      className={`object-cover ${className}`}
      style={{ pointerEvents: 'none' }}
      onLoadedData={(e) => {
        const video = e.currentTarget;
        video.currentTime = 0.1;
      }}
    />
  );
};

// 通用下拉选择器组件
interface DropdownOption {
  value: string;
  label: string;
  description?: string;
}

const DropdownSelector: React.FC<{
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  icon: React.ReactNode;
  title: string;
  iconColor?: string;
  disabled?: boolean;
}> = ({ options, value, onChange, icon, title, iconColor = 'text-orange-400', disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selectedOption = options.find(o => o.value === value);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className="flex items-center gap-2 px-3 py-1.5 lg:px-4 lg:py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm lg:text-base text-gray-300 transition-colors disabled:opacity-50"
      >
        <span className={iconColor}>{icon}</span>
        <span className="truncate">{selectedOption?.label || '选择'}</span>
        <ChevronDown className={`w-4 h-4 lg:w-5 lg:h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 bottom-full left-0 mb-2 w-48 lg:w-56 bg-[#1a1a1a] border border-gray-800 rounded-lg shadow-xl overflow-hidden">
          <div className="p-2 lg:p-3 border-b border-gray-800">
            <span className="text-xs lg:text-sm text-gray-500 px-2">{title}</span>
          </div>
          <div className="py-1">
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full px-3 py-2.5 lg:px-4 lg:py-3 flex items-center gap-3 hover:bg-gray-800 transition-colors ${
                  value === option.value ? 'bg-orange-500/20' : ''
                }`}
              >
                <div className={`w-2 h-2 lg:w-2.5 lg:h-2.5 rounded-full flex-shrink-0 ${
                  value === option.value ? 'bg-orange-400' : 'bg-gray-600'
                }`} />
                <div className="flex-1 text-left min-w-0">
                  <div className="text-sm lg:text-base text-gray-200 font-medium">
                    {option.label}
                  </div>
                  {option.description && (
                    <div className="text-xs text-gray-500 mt-0.5">
                      {option.description}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const CreatorHubPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentLanguage } = useLanguage();
  const [selectedType, setSelectedType] = useState<CreationType>('text');
  const [prompt, setPrompt] = useState('');
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  // 视频模式专用：首帧图和尾帧图
  const [videoFirstFrame, setVideoFirstFrame] = useState<File | null>(null);
  const [videoLastFrame, setVideoLastFrame] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showModeDropdown, setShowModeDropdown] = useState(false);
  // 视频/图片分辨率和比例
  const [videoResolution, setVideoResolution] = useState<'1K' | '2K' | '4K'>('1K');
  const [videoRatio, setVideoRatio] = useState<'16:9' | '9:16' | '1:1'>('16:9');
  const [imageResolution, setImageResolution] = useState<'1K' | '2K' | '4K'>('1K');
  const [imageRatio, setImageRatio] = useState<'16:9' | '9:16' | '1:1' | '4:3' | '3:4'>('1:1');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const firstFrameInputRef = useRef<HTMLInputElement>(null);
  const lastFrameInputRef = useRef<HTMLInputElement>(null);
  const modeDropdownRef = useRef<HTMLDivElement>(null);

  // Showcase 相关状态
  const [categories, setCategories] = useState<ShowcaseCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [showcaseList, setShowcaseList] = useState<ShowcaseContent[]>([]);
  const [showcaseLoading, setShowcaseLoading] = useState(false);
  const [showcasePage, setShowcasePage] = useState(1);
  const [showcaseTotal, setShowcaseTotal] = useState(0);
  const showcasePageSize = 50;
  const [selectedShowcase, setSelectedShowcase] = useState<ShowcaseContent | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isCreatingSimilar, setIsCreatingSimilar] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // 关闭模式下拉菜单
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modeDropdownRef.current && !modeDropdownRef.current.contains(e.target as Node)) {
        setShowModeDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 从 location.state 恢复初始状态
  useEffect(() => {
    const state = location.state as any;
    if (state) {
      if (state.selectedType) {
        setSelectedType(state.selectedType);
      }
      if (state.initialPrompt) {
        setPrompt(state.initialPrompt);
      }
    }
  }, [location.state]);

  // 加载模型列表
  const loadModels = useCallback(async () => {
    try {
      const response = await modelApi.getModelList();
      if (response.code === 200 && response.data) {
        setModels(response.data);
      }
    } catch (error) {
      console.error('Failed to load models:', error);
    }
  }, []);

  useEffect(() => {
    loadModels();
  }, [loadModels]);

  // 加载分类列表
  const loadCategories = useCallback(async () => {
    try {
      const response = await showcaseApi.getCategoryList({ status: '0' });
      if (response.code === 200 && response.rows) {
        setCategories(response.rows);
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  }, []);

  // 加载精选内容列表
  const loadShowcaseList = useCallback(async (page: number = 1, append: boolean = false) => {
    setShowcaseLoading(true);
    try {
      const params: any = {
        pageNum: page,
        pageSize: showcasePageSize,
        status: '0'
      };
      
      if (selectedCategory) {
        params.categoryId = selectedCategory;
      }

      // 添加搜索关键词
      if (searchKeyword.trim()) {
        params.keyword = searchKeyword.trim();
      }

      const response = await showcaseApi.getShowcaseList(params);
      if (response.code === 200) {
        if (append) {
          // 追加模式：将新数据添加到现有列表后面
          setShowcaseList(prev => [...prev, ...(response.rows || [])]);
        } else {
          // 替换模式：用于切换分类时
          setShowcaseList(response.rows || []);
        }
        setShowcaseTotal(response.total || 0);
        setShowcasePage(page);
      }
    } catch (error) {
      console.error('Failed to load showcase list:', error);
    } finally {
      setShowcaseLoading(false);
    }
  }, [selectedCategory, showcasePageSize, searchKeyword]);

  // 初始加载分类和内容
  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    loadShowcaseList(1);
  }, [selectedCategory]);

  // 无限滚动：监听滚动事件
  useEffect(() => {
    const handleScroll = () => {
      // 检查是否滚动到底部
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = document.documentElement.clientHeight;
      
      // 距离底部 200px 时开始加载
      if (scrollHeight - scrollTop - clientHeight < 200) {
        // 检查是否还有更多数据，且当前没有在加载
        if (!showcaseLoading && showcaseList.length < showcaseTotal) {
          loadShowcaseList(showcasePage + 1, true);
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [showcaseLoading, showcaseList.length, showcaseTotal, showcasePage, loadShowcaseList]);

  // 根据选中类型过滤模型
  const filteredModels = React.useMemo(() => {
    const option = creationOptions.find(o => o.type === selectedType);
    if (!option?.modelCategory) return [];
    
    return models.filter(m => {
      const category = m.category?.toLowerCase() || '';
      if (option.modelCategory === 'chat') {
        return !category.includes('video') && !category.includes('image');
      }
      return category.includes(option.modelCategory!);
    });
  }, [models, selectedType]);

  // 当过滤后的模型列表变化时，自动选择第一个
  useEffect(() => {
    if (filteredModels.length > 0 && !filteredModels.find(m => m.id === selectedModel)) {
      setSelectedModel(filteredModels[0].id);
    }
  }, [filteredModels, selectedModel]);

  // 获取当前选中的功能配置
  const currentOption = creationOptions.find(o => o.type === selectedType)!;

  // 处理图片上传（图片模式）
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newImages = Array.from(files).filter(f => f.type.startsWith('image/'));
      setUploadedImages(prev => [...prev, ...newImages].slice(0, 4)); // 最多4张
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 处理视频首帧图上传
  const handleFirstFrameUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setVideoFirstFrame(file);
    }
    if (firstFrameInputRef.current) {
      firstFrameInputRef.current.value = '';
    }
  };

  // 处理视频尾帧图上传
  const handleLastFrameUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setVideoLastFrame(file);
    }
    if (lastFrameInputRef.current) {
      lastFrameInputRef.current.value = '';
    }
  };

  // 移除上传的图片（图片模式）
  const handleRemoveImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  // 处理生成/跳转
  const handleGenerate = async () => {
    setIsLoading(true);

    try {
      // 根据不同类型跳转到对应页面，并标记为自动提交
      switch (selectedType) {
        case 'mcp':
          // 跳转到MCP页面，如果有搜索内容则带上搜索参数
          if (prompt.trim()) {
            navigate(`/mcp?q=${encodeURIComponent(prompt.trim())}`);
          } else {
            navigate('/mcp');
          }
          break;
        
        case 'agent':
          // 跳转到Agent页面，如果有搜索内容则带上搜索参数
          if (prompt.trim()) {
            navigate(`/agent?q=${encodeURIComponent(prompt.trim())}`);
          } else {
            navigate('/agent');
          }
          break;
        
        case 'text':
          if (!prompt.trim()) {
            toast.error(currentLanguage === 'zh' ? '请输入内容' : 'Please enter content');
            setIsLoading(false);
            return;
          }
          // 跳转到聊天页面，带上初始消息和自动提交标记
          navigate('/chat', { 
            state: { 
              initialMessage: prompt.trim(), 
              modelId: selectedModel,
              autoSubmit: true // 标记为自动提交
            } 
          });
          break;
        
        case 'image':
          if (!prompt.trim() && uploadedImages.length === 0) {
            toast.error(currentLanguage === 'zh' ? '请输入内容或上传图片' : 'Please enter content or upload images');
            setIsLoading(false);
            return;
          }
          // 跳转到图片编辑器，带上提示词、图片和自动提交标记
          navigate('/image-editor', { 
            state: { 
              initialPrompt: prompt.trim(), 
              modelId: selectedModel,
              uploadedImages: uploadedImages,
              resolution: imageResolution,
              ratio: imageRatio,
              autoSubmit: true // 标记为自动提交
            } 
          });
          break;
        
        case 'video':
          if (!prompt.trim() && !videoFirstFrame && !videoLastFrame) {
            toast.error(currentLanguage === 'zh' ? '请输入内容或上传首帧/尾帧图片' : 'Please enter content or upload first/last frame images');
            setIsLoading(false);
            return;
          }
          // 跳转到视频工作室，传递首帧图和尾帧图
          navigate('/video-studio', { 
            state: { 
              initialPrompt: prompt.trim(),
              firstFrameImage: videoFirstFrame,
              lastFrameImage: videoLastFrame,
              resolution: videoResolution,
              ratio: videoRatio,
              autoSubmit: true // 标记为自动提交
            } 
          });
          break;
        
        case 'web':
          if (!prompt.trim()) {
            toast.error(currentLanguage === 'zh' ? '请输入内容' : 'Please enter content');
            setIsLoading(false);
            return;
          }
          // 跳转到网页生成页面
          navigate('/app/new', { state: { initialPrompt: prompt.trim() } });
          break;
        
        default:
          navigate(currentOption.route);
      }
    } catch (error) {
      console.error('Navigation error:', error);
      toast.error(currentLanguage === 'zh' ? '跳转失败' : 'Navigation failed');
    } finally {
      setIsLoading(false);
    }
  };

  // 获取占位符文本
  const getPlaceholder = () => {
    const placeholders: Record<CreationType, { zh: string; en: string }> = {
      text: { zh: '描述你想生成的内容，如：写一篇关于AI的文章...', en: 'Describe what you want to generate, e.g., Write an article about AI...' },
      image: { zh: '描述你想生成的图片，如：一只可爱的猫咪在阳光下...', en: 'Describe the image you want, e.g., A cute cat in the sunlight...' },
      video: { zh: '描述你想生成的视频，或上传首尾帧图片...', en: 'Describe the video you want, or upload start/end frame images...' },
      web: { zh: '描述你想生成的网站，如：一个个人作品集网站...', en: 'Describe the website you want, e.g., A personal portfolio site...' },
      mcp: { zh: '点击开始探索 MCP 服务器生态', en: 'Click to explore MCP server ecosystem' },
      agent: { zh: '点击发现和使用 AI 智能体', en: 'Click to discover and use AI agents' }
    };
    return currentLanguage === 'zh' ? placeholders[selectedType].zh : placeholders[selectedType].en;
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col">
      <Navbar />
      
      <main className="flex-grow flex flex-col items-center justify-center px-4 py-12 lg:py-20">
        {/* GitHub 开源链接 */}
        <div className="mb-8 lg:mb-10">
          <a
            href="https://github.com/TimeCyber/MCP-X-web"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 lg:px-6 lg:py-3 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 rounded-full text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          >
            <svg className="w-5 h-5 lg:w-6 lg:h-6" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
            </svg>
            <span className="text-sm lg:text-base">
              {currentLanguage === 'zh' ? 'GitHub 开源' : 'Open Source on GitHub'}
            </span>
          </a>
        </div>

        {/* 头部标题 - 带模式下拉 */}
        <div className="text-center mb-12 lg:mb-16">
          <h1 className="text-4xl font-bold mb-2 text-white">
            {currentLanguage === 'zh' ? '开启你的 ' : 'Start your '}
            <span className="relative inline-block" ref={modeDropdownRef}>
              <button
                onClick={() => setShowModeDropdown(!showModeDropdown)}
                className="text-orange-400 hover:text-orange-300 inline-flex items-center gap-1 lg:gap-2 font-medium"
              >
                {currentLanguage === 'zh' ? (
                  selectedType === 'agent' ? 'Agent 模式' :
                  selectedType === 'text' ? '文案模式' :
                  selectedType === 'image' ? '图片模式' :
                  selectedType === 'video' ? '视频模式' :
                  selectedType === 'web' ? '网页模式' :
                  'MCP 模式'
                ) : (
                  selectedType === 'agent' ? 'Agent Mode' :
                  selectedType === 'text' ? 'Text Mode' :
                  selectedType === 'image' ? 'Image Mode' :
                  selectedType === 'video' ? 'Video Mode' :
                  selectedType === 'web' ? 'Web Mode' :
                  'MCP Mode'
                )}
                <ChevronDown className={`w-4 h-4 lg:w-5 lg:h-5 transition-transform ${showModeDropdown ? 'rotate-180' : ''}`} />
              </button>
              
              {showModeDropdown && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 lg:w-64 bg-[#1a1a1a] rounded-lg shadow-lg border border-gray-700 py-2 z-50">
                  {creationOptions.map((option) => (
                    <button
                      key={option.type}
                      onClick={() => {
                        setSelectedType(option.type);
                        setShowModeDropdown(false);
                        setUploadedImages([]);
                        setVideoFirstFrame(null);
                        setVideoLastFrame(null);
                      }}
                      className={`w-full px-4 py-2 lg:py-3 text-left hover:bg-gray-800 flex items-center gap-3 ${
                        selectedType === option.type ? 'bg-orange-500/20 text-orange-400' : 'text-gray-300'
                      }`}
                    >
                      <span className={option.color}>{option.icon}</span>
                      <span className="text-sm lg:text-base font-medium">
                        {currentLanguage === 'zh' ? option.title : option.titleEn}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </span>
            {currentLanguage === 'zh' ? ' 创想，创意，创造！' : ' Create Now!'}
          </h1>
        </div>

        {/* 主输入区域 */}
        <div className="w-full max-w-4xl xl:max-w-5xl 2xl:max-w-6xl mb-12 lg:mb-16">
          <div className="bg-[#1a1a1a] rounded-2xl shadow-lg border border-gray-800 p-6 lg:p-8">
            {/* 图片模式：上传的图片预览 */}
            {selectedType === 'image' && uploadedImages.length > 0 && (
              <div className="mb-4 lg:mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs lg:text-sm text-orange-400 bg-orange-500/20 px-2 py-1 rounded-full">
                    已上传 {uploadedImages.length} 张图片
                  </span>
                </div>
                <ImageUploadPreview images={uploadedImages} onRemove={handleRemoveImage} />
              </div>
            )}

            {/* 视频模式：首帧图和尾帧图预览 */}
            {selectedType === 'video' && (videoFirstFrame || videoLastFrame) && (
              <div className="mb-4 lg:mb-6">
                <div className="flex gap-4 flex-wrap">
                  {videoFirstFrame && (
                    <div className="relative group">
                      <div className="text-xs text-gray-400 mb-1">{currentLanguage === 'zh' ? '首帧图' : 'First Frame'}</div>
                      <img
                        src={URL.createObjectURL(videoFirstFrame)}
                        alt="first-frame"
                        className="w-20 h-20 lg:w-24 lg:h-24 object-cover rounded-lg border border-orange-500/50"
                      />
                      <button
                        onClick={() => setVideoFirstFrame(null)}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  )}
                  {videoLastFrame && (
                    <div className="relative group">
                      <div className="text-xs text-gray-400 mb-1">{currentLanguage === 'zh' ? '尾帧图' : 'Last Frame'}</div>
                      <img
                        src={URL.createObjectURL(videoLastFrame)}
                        alt="last-frame"
                        className="w-20 h-20 lg:w-24 lg:h-24 object-cover rounded-lg border border-blue-500/50"
                      />
                      <button
                        onClick={() => setVideoLastFrame(null)}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 输入框和按钮 */}
            <div className="flex items-start gap-4">
              {/* 图片模式：添加图片按钮 */}
              {selectedType === 'image' && (
                <div className="flex-shrink-0">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-12 h-12 lg:w-14 lg:h-14 flex items-center justify-center bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors"
                    title={currentLanguage === 'zh' ? '上传图片' : 'Upload Image'}
                  >
                    <Upload className="w-5 h-5 lg:w-6 lg:h-6 text-gray-300" />
                  </button>
                </div>
              )}

              {/* 视频模式：首帧图和尾帧图上传按钮 */}
              {selectedType === 'video' && (
                <div className="flex-shrink-0 flex gap-2">
                  <input
                    ref={firstFrameInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFirstFrameUpload}
                    className="hidden"
                  />
                  <input
                    ref={lastFrameInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLastFrameUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => firstFrameInputRef.current?.click()}
                    className={`w-12 h-12 lg:w-14 lg:h-14 flex flex-col items-center justify-center rounded-xl transition-colors ${
                      videoFirstFrame ? 'bg-orange-500/20 border border-orange-500/50' : 'bg-gray-800 hover:bg-gray-700'
                    }`}
                    title={currentLanguage === 'zh' ? '上传首帧图' : 'Upload First Frame'}
                  >
                    <Upload className="w-4 h-4 lg:w-5 lg:h-5 text-gray-300" />
                    <span className="text-[10px] text-gray-400 mt-0.5">{currentLanguage === 'zh' ? '首帧' : '1st'}</span>
                  </button>
                  <button
                    onClick={() => lastFrameInputRef.current?.click()}
                    className={`w-12 h-12 lg:w-14 lg:h-14 flex flex-col items-center justify-center rounded-xl transition-colors ${
                      videoLastFrame ? 'bg-blue-500/20 border border-blue-500/50' : 'bg-gray-800 hover:bg-gray-700'
                    }`}
                    title={currentLanguage === 'zh' ? '上传尾帧图' : 'Upload Last Frame'}
                  >
                    <Upload className="w-4 h-4 lg:w-5 lg:h-5 text-gray-300" />
                    <span className="text-[10px] text-gray-400 mt-0.5">{currentLanguage === 'zh' ? '尾帧' : 'Last'}</span>
                  </button>
                </div>
              )}

              {/* 输入框 */}
              <div className="flex-1">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={getPlaceholder()}
                  className="w-full bg-transparent border-none text-white placeholder-gray-500 resize-none focus:outline-none text-base lg:text-lg"
                  rows={3}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleGenerate();
                    }
                  }}
                />
              </div>

              {/* 发送按钮 */}
              <div className="flex-shrink-0">
                <button
                  onClick={handleGenerate}
                  disabled={isLoading}
                  className={`w-12 h-12 lg:w-14 lg:h-14 flex items-center justify-center rounded-xl transition-colors ${
                    isLoading
                      ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                      : 'bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700'
                  }`}
                >
                  {isLoading ? (
                    <div className="w-5 h-5 lg:w-6 lg:h-6 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <ArrowRight className="w-5 h-5 lg:w-6 lg:h-6" />
                  )}
                </button>
              </div>
            </div>

            {/* 底部工具栏 */}
            <div className="flex items-center justify-between mt-4 lg:mt-6 pt-4 lg:pt-6 border-t border-gray-800">
              <div className="flex items-center gap-3 flex-wrap">
                {/* 模型选择 */}
                {filteredModels.length > 0 && (
                  <ModelSelector
                    models={filteredModels}
                    selectedModel={selectedModel}
                    onSelect={setSelectedModel}
                    disabled={isLoading}
                  />
                )}

                {/* 视频模式：分辨率和比例选择 */}
                {selectedType === 'video' && (
                  <>
                    {/* 分辨率选择 */}
                    <DropdownSelector
                      options={[
                        { value: '1K', label: '1K (720P)', description: '1280×720' },
                        { value: '2K', label: '2K (1080P)', description: '1920×1080' },
                        { value: '4K', label: '4K (2160P)', description: '3840×2160' }
                      ]}
                      value={videoResolution}
                      onChange={(v) => setVideoResolution(v as '1K' | '2K' | '4K')}
                      icon={<Maximize2 className="w-4 h-4 lg:w-5 lg:h-5" />}
                      title={currentLanguage === 'zh' ? '选择分辨率' : 'Select Resolution'}
                      iconColor="text-pink-400"
                      disabled={isLoading}
                    />
                    {/* 比例选择 */}
                    <DropdownSelector
                      options={[
                        { value: '16:9', label: currentLanguage === 'zh' ? '16:9 横屏' : '16:9 Landscape', description: currentLanguage === 'zh' ? '适合电脑、电视' : 'For PC, TV' },
                        { value: '9:16', label: currentLanguage === 'zh' ? '9:16 竖屏' : '9:16 Portrait', description: currentLanguage === 'zh' ? '适合手机、短视频' : 'For mobile, shorts' },
                        { value: '1:1', label: currentLanguage === 'zh' ? '1:1 方形' : '1:1 Square', description: currentLanguage === 'zh' ? '适合社交媒体' : 'For social media' }
                      ]}
                      value={videoRatio}
                      onChange={(v) => setVideoRatio(v as '16:9' | '9:16' | '1:1')}
                      icon={<RatioIcon className="w-4 h-4 lg:w-5 lg:h-5" />}
                      title={currentLanguage === 'zh' ? '选择比例' : 'Select Ratio'}
                      iconColor="text-pink-400"
                      disabled={isLoading}
                    />
                  </>
                )}

                {/* 图片模式：分辨率和比例选择 */}
                {selectedType === 'image' && (
                  <>
                    {/* 分辨率选择 */}
                    <DropdownSelector
                      options={[
                        { value: '1K', label: '1K (1024px)', description: currentLanguage === 'zh' ? '标准质量' : 'Standard' },
                        { value: '2K', label: '2K (2048px)', description: currentLanguage === 'zh' ? '高清质量' : 'HD Quality' },
                        { value: '4K', label: '4K (4096px)', description: currentLanguage === 'zh' ? '超高清质量' : 'Ultra HD' }
                      ]}
                      value={imageResolution}
                      onChange={(v) => setImageResolution(v as '1K' | '2K' | '4K')}
                      icon={<Maximize2 className="w-4 h-4 lg:w-5 lg:h-5" />}
                      title={currentLanguage === 'zh' ? '选择分辨率' : 'Select Resolution'}
                      iconColor="text-purple-400"
                      disabled={isLoading}
                    />
                    {/* 比例选择 */}
                    <DropdownSelector
                      options={[
                        { value: '1:1', label: currentLanguage === 'zh' ? '1:1 方形' : '1:1 Square', description: currentLanguage === 'zh' ? '头像、图标' : 'Avatar, Icon' },
                        { value: '16:9', label: currentLanguage === 'zh' ? '16:9 横屏' : '16:9 Landscape', description: currentLanguage === 'zh' ? '壁纸、封面' : 'Wallpaper, Cover' },
                        { value: '9:16', label: currentLanguage === 'zh' ? '9:16 竖屏' : '9:16 Portrait', description: currentLanguage === 'zh' ? '手机壁纸' : 'Phone wallpaper' },
                        { value: '4:3', label: currentLanguage === 'zh' ? '4:3 标准' : '4:3 Standard', description: currentLanguage === 'zh' ? '传统比例' : 'Traditional' },
                        { value: '3:4', label: currentLanguage === 'zh' ? '3:4 竖版' : '3:4 Vertical', description: currentLanguage === 'zh' ? '人像照片' : 'Portrait photo' }
                      ]}
                      value={imageRatio}
                      onChange={(v) => setImageRatio(v as '16:9' | '9:16' | '1:1' | '4:3' | '3:4')}
                      icon={<RatioIcon className="w-4 h-4 lg:w-5 lg:h-5" />}
                      title={currentLanguage === 'zh' ? '选择比例' : 'Select Ratio'}
                      iconColor="text-purple-400"
                      disabled={isLoading}
                    />
                  </>
                )}
              </div>
              
              <div className="text-xs lg:text-sm text-gray-500 hidden sm:block">
                {currentLanguage === 'zh' ? '按 Enter 发送，Shift + Enter 换行' : 'Press Enter to send, Shift + Enter for new line'}
              </div>
            </div>
          </div>
        </div>

        {/* 快捷功能卡片 */}
        <div className="w-full max-w-4xl xl:max-w-5xl 2xl:max-w-6xl">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 lg:gap-6">
            {creationOptions.map((option) => (
              <button
                key={option.type}
                onClick={() => {
                  setSelectedType(option.type);
                  setUploadedImages([]);
                  setVideoFirstFrame(null);
                  setVideoLastFrame(null);
                  if (option.type === 'mcp' || option.type === 'agent') {
                    navigate(option.route);
                  }
                }}
                className={`flex flex-col items-center gap-3 lg:gap-4 p-4 lg:p-6 rounded-xl transition-all ${
                  selectedType === option.type
                    ? 'bg-[#1a1a1a] border-2 border-orange-500'
                    : 'bg-[#1a1a1a] border border-gray-800 hover:border-gray-700'
                }`}
              >
                <div className={`w-12 h-12 lg:w-16 lg:h-16 rounded-full flex items-center justify-center ${
                  selectedType === option.type ? 'bg-orange-500/30' : 'bg-gray-800'
                }`}>
                  <span className={`${selectedType === option.type ? 'text-orange-400' : 'text-gray-400'} [&>svg]:w-6 [&>svg]:h-6 lg:[&>svg]:w-8 lg:[&>svg]:h-8`}>
                    {option.icon}
                  </span>
                </div>
                <div className="text-center">
                  <div className={`text-sm lg:text-base font-medium ${
                    selectedType === option.type ? 'text-orange-400' : 'text-gray-300'
                  }`}>
                    {currentLanguage === 'zh' ? option.title : option.titleEn}
                  </div>
                  <div className="text-xs lg:text-sm text-gray-500 mt-1 max-w-[120px] lg:max-w-[160px]">
                    {currentLanguage === 'zh' ? option.description : option.descriptionEn}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 精选内容展示区 */}
        <div className="w-full max-w-4xl xl:max-w-5xl 2xl:max-w-6xl mt-16 lg:mt-20">
          <div className="flex items-center justify-between mb-8 gap-4">
            <h2 className="text-2xl lg:text-3xl font-bold text-white">
              {currentLanguage === 'zh' ? '精选作品' : 'Featured Works'}
            </h2>
            
            {/* 搜索框 */}
            <div className="relative flex-shrink-0 w-64 lg:w-80">
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchKeyword.trim()) {
                    setIsSearching(true);
                    setShowcaseList([]);
                    loadShowcaseList(1);
                  }
                }}
                placeholder={currentLanguage === 'zh' ? '搜索标题或内容...' : 'Search title or content...'}
                className="w-full px-4 py-2 pl-10 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 transition-colors"
              />
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              {searchKeyword && (
                <button
                  onClick={() => {
                    setSearchKeyword('');
                    setIsSearching(false);
                    setShowcaseList([]);
                    loadShowcaseList(1);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* 分类标签 */}
          <div className="flex gap-3 mb-8 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                selectedCategory === null
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {currentLanguage === 'zh' ? '全部' : 'All'}
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {category.categoryName}
              </button>
            ))}
          </div>

          {/* 内容网格 */}
          {showcaseLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : showcaseList.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
              {currentLanguage === 'zh' ? '暂无内容' : 'No content'}
            </div>
          ) : (
            <>
              {/* 瀑布流布局 - 使用 CSS columns 实现自适应高度 */}
              <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 lg:gap-6 space-y-4 lg:space-y-6">
                {showcaseList.map((item) => (
                  <div
                    key={item.id}
                    className="break-inside-avoid bg-[#1a1a1a] rounded-xl overflow-hidden border border-gray-800 hover:border-gray-700 transition-all group cursor-pointer"
                    onClick={() => {
                      // 立即在本地更新浏览数
                      const updatedItem = { ...item, viewCount: (item.viewCount || 0) + 1 };
                      setShowcaseList(prev => 
                        prev.map(i => i.id === item.id ? updatedItem : i)
                      );
                      setSelectedShowcase(updatedItem);
                      setShowDetailModal(true);
                      
                      // 异步调用接口更新服务器数据
                      showcaseApi.incrementViewCount(item.id).catch(error => {
                        console.error('更新浏览数失败:', error);
                        // 如果失败，回滚本地数据
                        setShowcaseList(prev => 
                          prev.map(i => i.id === item.id ? item : i)
                        );
                      });
                    }}
                  >
                    {/* 缩略图 - 自适应高度 */}
                    <div className="bg-gray-900 relative overflow-hidden">
                      {/* 视频类型：显示第一帧或缩略图 */}
                      {item.contentType === 'video' ? (
                        <>
                          {item.thumbnailUrl ? (
                            <img
                              src={item.thumbnailUrl}
                              alt={item.title}
                              className="w-full h-auto group-hover:scale-105 transition-transform duration-300"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          ) : item.generatedResult ? (
                            (() => {
                              // 解析视频URL - 提取第一个有效的视频链接
                              const parseVideoUrl = (url: string) => {
                                const videoUrlRegex = /(https?:\/\/[^\s]+\.(?:mp4|webm|mov|avi|mkv))/i;
                                const match = url.match(videoUrlRegex);
                                return match ? match[1] : url;
                              };
                              const videoUrl = parseVideoUrl(item.generatedResult);
                              return (
                                <VideoThumbnail
                                  videoUrl={videoUrl}
                                  alt={item.title}
                                  className="w-full aspect-video"
                                />
                              );
                            })()
                          ) : (
                            <div className="w-full aspect-video flex items-center justify-center text-gray-600">
                              <Video className="w-12 h-12" />
                            </div>
                          )}
                          {/* 播放按钮覆盖层 */}
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/60 transition-colors z-10">
                            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                              <Play className="w-6 h-6 text-white ml-1" />
                            </div>
                          </div>
                        </>
                      ) : item.contentType === 'image' ? (
                        item.thumbnailUrl ? (
                          <img
                            src={item.thumbnailUrl}
                            alt={item.title}
                            className="w-full h-auto group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : item.generatedResult ? (
                          <img
                            src={item.generatedResult}
                            alt={item.title}
                            className="w-full h-auto group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full aspect-square flex items-center justify-center text-gray-600">
                            <Image className="w-12 h-12" />
                          </div>
                        )
                      ) : (
                        item.thumbnailUrl ? (
                          <img
                            src={item.thumbnailUrl}
                            alt={item.title}
                            className="w-full h-auto group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full aspect-video flex items-center justify-center text-gray-600">
                            <MessageSquare className="w-12 h-12" />
                          </div>
                        )
                      )}
                      {item.isRecommended === '1' && (
                        <div className="absolute top-2 right-2 px-2 py-1 bg-orange-500 text-white text-xs font-bold rounded z-20">
                          {currentLanguage === 'zh' ? '推荐' : 'Featured'}
                        </div>
                      )}
                    </div>

                    {/* 信息 */}
                    <div className="p-4">
                      <h3 className="text-white font-medium text-sm mb-3 line-clamp-2 group-hover:text-orange-400 transition-colors">
                        {item.title}
                      </h3>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {item.viewCount || 0}
                          </span>
                        </div>
                        {item.aiModel && (
                          <span className="text-orange-400 text-[10px] font-mono truncate max-w-[80px]">
                            {item.aiModel}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* 加载更多提示 */}
              {showcaseLoading && showcaseList.length > 0 && (
                <div className="flex items-center justify-center py-8">
                  <div className="flex items-center gap-2 text-gray-400">
                    <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm">{currentLanguage === 'zh' ? '加载中...' : 'Loading...'}</span>
                  </div>
                </div>
              )}
              
              {/* 已加载全部提示 */}
              {!showcaseLoading && showcaseList.length >= showcaseTotal && showcaseList.length > 0 && (
                <div className="flex items-center justify-center py-8">
                  <span className="text-sm text-gray-500">
                    {currentLanguage === 'zh' ? '已加载全部内容' : 'All content loaded'}
                  </span>
                </div>
              )}
            </>
          )}
        </div>

        {/* 底部导航标签 */}
        {/* <div className="mt-12 lg:mt-16 flex items-center gap-8 lg:gap-12 text-sm lg:text-base">
          <button 
            onClick={() => navigate('/mcp')}
            className="text-gray-400 hover:text-orange-400 transition-colors"
          >
            {currentLanguage === 'zh' ? '发现' : 'Discover'}
          </button>
          <button 
            onClick={() => navigate('/chat')}
            className="text-gray-400 hover:text-orange-400 transition-colors"
          >
            {currentLanguage === 'zh' ? '短片' : 'Shorts'}
          </button>
          <button 
            onClick={() => navigate('/agent')}
            className="text-gray-400 hover:text-orange-400 transition-colors"
          >
            {currentLanguage === 'zh' ? '活动' : 'Activity'}
          </button>
          <button 
            onClick={() => navigate('/settings')}
            className="text-gray-400 hover:text-orange-400 transition-colors flex items-center gap-1"
          >
            <span>🔍</span>
            {currentLanguage === 'zh' ? '搜索制作' : 'Search'}
          </button>
        </div> */}
      </main>
      
      {/* 详情弹窗 */}
      {showDetailModal && selectedShowcase && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowDetailModal(false)}
        >
          <div 
            className="bg-[#1a1a1a] rounded-2xl border border-gray-800 max-w-7xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 头部 */}
            <div className="flex items-center justify-between p-4 lg:p-6 border-b border-gray-800">
              <h2 className="text-xl lg:text-2xl font-bold text-white truncate flex-1 mr-4">
                {selectedShowcase.title}
              </h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="w-10 h-10 flex items-center justify-center bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0"
              >
                <X className="w-5 h-5 text-gray-300" />
              </button>
            </div>

            {/* 内容区域 - 统一左右布局 */}
            <div className="flex-1 overflow-y-auto p-4 lg:p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
                {/* 左侧：内容展示 */}
                <div className="space-y-4">
                  {/* 文案类型 */}
                  {selectedShowcase.contentType === 'text' && (
                    <div className="h-full flex flex-col">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center">
                          <Bot className="w-4 h-4 text-orange-400" />
                        </div>
                        <span className="text-sm font-medium text-gray-400">
                          {currentLanguage === 'zh' ? 'AI 生成内容' : 'AI Generated Content'}
                        </span>
                        {selectedShowcase.aiModel && (
                          <span className="text-xs text-orange-400 bg-orange-500/10 px-2 py-1 rounded">
                            {selectedShowcase.aiModel}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 bg-gray-900/50 rounded-lg p-4 text-gray-300 whitespace-pre-wrap overflow-y-auto">
                        {selectedShowcase.generatedResult}
                      </div>
                    </div>
                  )}

                  {/* 图片类型 */}
                  {selectedShowcase.contentType === 'image' && (
                    <div className="space-y-3">
                      <div className="bg-gray-900 rounded-lg overflow-hidden">
                        <img
                          src={selectedShowcase.generatedResult}
                          alt={selectedShowcase.title}
                          className="w-full h-auto"
                        />
                      </div>
                      {/* 参考图片缩略图 */}
                      {selectedShowcase.thumbnailUrl && (
                        <div>
                          <div className="text-xs font-medium text-gray-500 mb-2">
                            {currentLanguage === 'zh' ? '参考图片' : 'Reference'}
                          </div>
                          <div className="flex gap-2">
                            <div className="w-20 h-20 bg-gray-900 rounded-lg overflow-hidden border border-gray-800 hover:border-gray-600 transition-colors cursor-pointer">
                              <img
                                src={selectedShowcase.thumbnailUrl}
                                alt="reference"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 视频类型 */}
                  {selectedShowcase.contentType === 'video' && (() => {
                    // 解析视频URL - 提取第一个有效的视频链接
                    const parseVideoUrl = (url: string) => {
                      // 匹配视频文件URL（mp4, webm, mov等）
                      const videoUrlRegex = /(https?:\/\/[^\s]+\.(?:mp4|webm|mov|avi|mkv))/i;
                      const match = url.match(videoUrlRegex);
                      return match ? match[1] : url;
                    };

                    const videoUrl = parseVideoUrl(selectedShowcase.generatedResult);

                    return (
                      <div className="space-y-3">
                        <div className="bg-gray-900 rounded-lg overflow-hidden aspect-video relative">
                          {/* 直接显示视频播放器 */}
                          <video
                            src={videoUrl}
                            controls
                            poster={selectedShowcase.thumbnailUrl || undefined}
                            className="w-full h-full"
                            preload="metadata"
                            onError={(e) => {
                              // 视频加载失败，显示错误提示
                              const target = e.currentTarget;
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent) {
                                const errorDiv = document.createElement('div');
                                errorDiv.className = 'w-full h-full flex items-center justify-center bg-gray-800';
                                errorDiv.innerHTML = `
                                  <div class="text-center text-gray-400">
                                    <svg class="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                    <p class="text-sm">${currentLanguage === 'zh' ? '视频加载失败' : 'Video load failed'}</p>
                                  </div>
                                `;
                                parent.appendChild(errorDiv);
                              }
                            }}
                          >
                            {currentLanguage === 'zh' ? '您的浏览器不支持视频播放' : 'Your browser does not support video playback'}
                          </video>
                        </div>
                        {/* 参考图片缩略图 */}
                        {selectedShowcase.thumbnailUrl && (
                          <div>
                            <div className="text-xs font-medium text-gray-500 mb-2">
                              {currentLanguage === 'zh' ? '首帧图' : 'First Frame'}
                            </div>
                            <div className="flex gap-2">
                              <div className="w-20 h-20 bg-gray-900 rounded-lg overflow-hidden border border-gray-800 hover:border-gray-600 transition-colors cursor-pointer">
                                <img
                                  src={selectedShowcase.thumbnailUrl}
                                  alt="first frame"
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* 右侧：提示词和信息 */}
                <div className="space-y-4">
                  {/* Prompt */}
                  {selectedShowcase.originalPrompt && (() => {
                    // 解析提示词中的图片链接
                    const parsePromptImages = (prompt: string) => {
                      const imageUrlRegex = /https?:\/\/[^\s,]+\.(?:jpg|jpeg|png|gif|webp)/gi;
                      const urls = prompt.match(imageUrlRegex) || [];
                      const textWithoutUrls = prompt.replace(imageUrlRegex, '').replace(/输入图片:\s*,?\s*/g, '').replace(/,\s*,/g, ',').trim();
                      return { urls, text: textWithoutUrls };
                    };

                    const { urls: imageUrls, text: promptText } = parsePromptImages(selectedShowcase.originalPrompt);

                    return (
                      <div className="h-full flex flex-col">
                        <div className="flex items-center gap-2 mb-3">
                          <MessageSquare className={`w-4 h-4 ${
                            selectedShowcase.contentType === 'text' ? 'text-blue-400' :
                            selectedShowcase.contentType === 'image' ? 'text-purple-400' :
                            'text-pink-400'
                          }`} />
                          <span className="text-sm font-medium text-gray-400">
                            {currentLanguage === 'zh' ? '提示词' : 'Prompt'}
                          </span>
                        </div>
                        
                        {/* 输入图片展示 */}
                        {imageUrls.length > 0 && (
                          <div className="mb-3">
                            <div className="text-xs font-medium text-gray-500 mb-2">
                              {currentLanguage === 'zh' ? '输入图片' : 'Input Images'}
                            </div>
                            <div className="flex gap-2 flex-wrap">
                              {imageUrls.map((url, idx) => (
                                <div key={idx} className="w-20 h-20 bg-gray-900 rounded-lg overflow-hidden border border-gray-800 hover:border-gray-600 transition-colors cursor-pointer">
                                  <img
                                    src={url}
                                    alt={`input-${idx}`}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                    }}
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* 文本提示词 */}
                        {promptText && (
                          <div className="flex-1 bg-gray-900/50 rounded-lg p-4 text-gray-300 text-sm whitespace-pre-wrap overflow-y-auto">
                            {promptText}
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* AI 模型信息 */}
                  {selectedShowcase.aiModel && selectedShowcase.contentType !== 'text' && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Zap className="w-4 h-4 text-orange-400" />
                        <span className="text-sm font-medium text-gray-400">
                          {currentLanguage === 'zh' ? 'AI 模型' : 'AI Model'}
                        </span>
                      </div>
                      <div className="bg-gray-900/50 rounded-lg p-3 text-gray-300 text-sm">
                        {selectedShowcase.aiModel}
                      </div>
                    </div>
                  )}

                  {/* 花费 */}
                  {selectedShowcase.generationParams && (() => {
                    try {
                      const params = JSON.parse(selectedShowcase.generationParams);
                      const cost = params.deductCost || '0.0';
                      return (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Zap className="w-4 h-4 text-green-400" />
                            <span className="text-sm font-medium text-gray-400">
                              {currentLanguage === 'zh' ? '花费' : 'Cost'}
                            </span>
                          </div>
                          <div className="bg-gray-900/50 rounded-lg p-3 text-gray-300 text-sm">
                            <span className="text-green-400 font-mono text-lg">{cost}</span>
                            <span className="text-gray-500 ml-1">{currentLanguage === 'zh' ? '积分' : 'Credits'}</span>
                          </div>
                        </div>
                      );
                    } catch (e) {
                      // JSON 解析失败，不显示
                      return null;
                    }
                  })()}

                  {/* 标签 */}
                  {selectedShowcase.tags && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium text-gray-400">
                          {currentLanguage === 'zh' ? '标签' : 'Tags'}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {selectedShowcase.tags.split(',').map((tag, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-gray-800 text-gray-300 text-xs rounded-full"
                          >
                            {tag.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 底部操作栏 */}
            <div className="flex items-center justify-between p-4 lg:p-6 border-t border-gray-800 gap-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-800 rounded-lg">
                  <Eye className="w-4 h-4 text-blue-400" />
                  <span className="text-sm text-gray-300">{selectedShowcase.viewCount || 0}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={async () => {
                    if (!selectedShowcase.originalPrompt) {
                      toast.error(currentLanguage === 'zh' ? '该作品没有提示词' : 'No prompt available');
                      return;
                    }
                    
                    setIsCreatingSimilar(true);
                    try {
                      const prompt = selectedShowcase.originalPrompt;
                      
                      // 根据内容类型跳转到不同页面
                      if (selectedShowcase.contentType === 'text') {
                        // 跳转到文案页面，不自动提交
                        navigate('/chat', { 
                          state: { 
                            initialMessage: prompt,
                            autoSubmit: false // 不自动提交
                          } 
                        });
                      } else if (selectedShowcase.contentType === 'image') {
                        // 跳转到图片编辑器，不自动提交
                        // 如果有参考图，也传递过去
                        const stateData: any = { 
                          initialPrompt: prompt,
                          autoSubmit: false // 不自动提交
                        };
                        
                        // 如果有缩略图作为参考图，尝试加载
                        if (selectedShowcase.thumbnailUrl) {
                          try {
                            // 将URL转换为File对象
                            const response = await fetch(selectedShowcase.thumbnailUrl);
                            const blob = await response.blob();
                            const file = new File([blob], 'reference.jpg', { type: blob.type });
                            stateData.uploadedImages = [file];
                          } catch (error) {
                            console.warn('加载参考图失败:', error);
                          }
                        }
                        
                        navigate('/image-editor', { state: stateData });
                      } else if (selectedShowcase.contentType === 'video') {
                        // 视频类型保持自动提交
                        navigate('/video-studio', { 
                          state: { 
                            initialPrompt: prompt,
                            autoSubmit: true
                          } 
                        });
                      }
                      
                      setShowDetailModal(false);
                    } catch (error) {
                      console.error('创建同款失败:', error);
                      toast.error(currentLanguage === 'zh' ? '创建同款失败' : 'Failed to create similar');
                    } finally {
                      setIsCreatingSimilar(false);
                    }
                  }}
                  disabled={isCreatingSimilar || !selectedShowcase.originalPrompt}
                  className="flex items-center gap-2 px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreatingSimilar ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{currentLanguage === 'zh' ? '跳转中...' : 'Loading...'}</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      <span>{currentLanguage === 'zh' ? '做同款' : 'Create Similar'}</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  {currentLanguage === 'zh' ? '关闭' : 'Close'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <Footer />
    </div>
  );
};

export default CreatorHubPage;
