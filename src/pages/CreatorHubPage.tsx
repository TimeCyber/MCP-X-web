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
  Loader2,
  Clock,
  Film,
  Share2
} from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { modelApi, ModelInfo, sortModelsByOrderBy } from '../services/modelApi';
import { showcaseApi, ShowcaseCategory, ShowcaseContent } from '../services/showcaseApi';
import { useLanguage } from '../contexts/LanguageContext';
import { toast } from '../utils/toast';
import { createApp } from '../services/appBuildApi';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// 判断 thumbnailUrl 是否为有效图片 URL（排除 "default"、空值等无效值）
const isValidThumbnail = (url?: string | null): boolean => {
  if (!url) return false;
  const trimmed = url.trim().toLowerCase();
  if (trimmed === 'default' || trimmed === 'null' || trimmed === 'undefined' || trimmed === '') return false;
  return trimmed.startsWith('http://') || trimmed.startsWith('https://');
};

const stripMarkdown = (text: string): string =>
  text
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]+`/g, '')
    .replace(/#{1,6}\s/g, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/---+/g, '')
    .trim();

const getTextPreview = (text?: string, maxLen = 120): string => {
  if (!text) return '';
  const plain = stripMarkdown(text).replace(/\n+/g, ' ');
  return plain.length > maxLen ? `${plain.slice(0, maxLen)}…` : plain;
};

const parsePromptImages = (prompt: string) => {
  const imageUrlRegex = /https?:\/\/[^\s,]+\.(?:jpg|jpeg|png|gif|webp)/gi;
  const urls = prompt.match(imageUrlRegex) || [];
  const textWithoutUrls = prompt
    .replace(imageUrlRegex, '')
    .replace(/输入图片:\s*,?\s*/g, '')
    .replace(/,\s*,/g, ',')
    .trim();
  return { urls, text: textWithoutUrls };
};

// 功能类型定义
type CreationType = 'text' | 'image' | 'video' | 'web' | 'mcp' | 'agent';
type VideoRatio = '16:9' | '9:16' | '1:1';
type ImageResolution = '1K' | '2K' | '4K';
type ImageRatio = '16:9' | '9:16' | '1:1' | '4:3' | '3:4';

const CREATOR_HUB_IMAGE_SIZE_CACHE_KEY = 'creatorHub_imageSize';
const CREATOR_HUB_VIDEO_RATIO_CACHE_KEY = 'creatorHub_videoRatio';
const CREATOR_HUB_VIDEO_GEN_CACHE_KEY = 'creatorHub_videoGen';
// 与 ImageEditorPage 共享的图片模型缓存 key
const SHARED_IMAGE_MODEL_KEY = 'shared_image_model_id';

const VALID_VIDEO_RATIOS = new Set<VideoRatio>(['16:9', '9:16', '1:1']);
const VALID_IMAGE_RESOLUTIONS = new Set<ImageResolution>(['1K', '2K', '4K']);
type VideoGenDuration = '5秒' | '10秒' | '15秒';
const VALID_VIDEO_GEN_DURATIONS = new Set<VideoGenDuration>(['5秒', '10秒', '15秒']);
const VALID_IMAGE_RATIOS = new Set<ImageRatio>(['16:9', '9:16', '1:1', '4:3', '3:4']);

const SHOWCASE_CACHE_KEY = 'creatorHub_showcase_cache';
const CATEGORIES_CACHE_KEY = 'creatorHub_categories_cache';

const loadShowcaseCache = (): { list: ShowcaseContent[]; total: number } => {
  try {
    const raw = sessionStorage.getItem(SHOWCASE_CACHE_KEY);
    if (!raw) return { list: [], total: 0 };
    const parsed = JSON.parse(raw);
    return { list: parsed.list || [], total: parsed.total || 0 };
  } catch {
    return { list: [], total: 0 };
  }
};

const saveShowcaseCache = (list: ShowcaseContent[], total: number): void => {
  try {
    sessionStorage.setItem(SHOWCASE_CACHE_KEY, JSON.stringify({ list, total, cachedAt: Date.now() }));
  } catch { /* ignore */ }
};

const loadCategoriesCache = (): ShowcaseCategory[] => {
  try {
    const raw = sessionStorage.getItem(CATEGORIES_CACHE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveCategoriesCache = (categories: ShowcaseCategory[]): void => {
  try {
    sessionStorage.setItem(CATEGORIES_CACHE_KEY, JSON.stringify(categories));
  } catch { /* ignore */ }
};

const ShowcaseSkeletonGrid: React.FC<{ colCount: number }> = ({ colCount }) => (
  <div className="flex gap-4 lg:gap-6 items-start w-full min-w-0">
    {Array.from({ length: colCount }).map((_, colIdx) => (
      <div key={colIdx} className="flex-1 min-w-0 flex flex-col gap-4 lg:gap-6">
        {Array.from({ length: colIdx === 0 ? 3 : 2 }).map((__, rowIdx) => (
          <div
            key={rowIdx}
            className="bg-[#1a1a1a] rounded-xl border border-gray-800 overflow-hidden animate-pulse"
          >
            <div className="aspect-[4/3] bg-gray-800" />
            <div className="p-4 space-y-3">
              <div className="h-4 bg-gray-800 rounded w-3/4" />
              <div className="h-3 bg-gray-800/80 rounded w-1/3" />
            </div>
          </div>
        ))}
      </div>
    ))}
  </div>
);

const loadCachedVideoRatio = (): VideoRatio => {
  try {
    const cached = localStorage.getItem(CREATOR_HUB_VIDEO_RATIO_CACHE_KEY);
    if (cached && VALID_VIDEO_RATIOS.has(cached as VideoRatio)) {
      return cached as VideoRatio;
    }
  } catch (error) {
    console.error('读取 CreatorHub 视频比例缓存失败:', error);
  }
  return '16:9';
};

type CachedVideoGen = {
  resolution: ImageResolution;
  duration: VideoGenDuration;
  modelId: string;
};

const loadCachedVideoGen = (): CachedVideoGen => {
  try {
    const cached = localStorage.getItem(CREATOR_HUB_VIDEO_GEN_CACHE_KEY);
    if (!cached) {
      return { resolution: '2K', duration: '5秒', modelId: '' };
    }
    const parsed = JSON.parse(cached);
    const resolution = VALID_IMAGE_RESOLUTIONS.has(parsed?.resolution) ? parsed.resolution : '2K';
    const duration = VALID_VIDEO_GEN_DURATIONS.has(parsed?.duration)
      ? parsed.duration
      : '5秒';
    const modelId = typeof parsed?.modelId === 'string' ? parsed.modelId : '';
    return { resolution, duration, modelId };
  } catch (error) {
    console.error('读取 CreatorHub 视频生成偏好缓存失败:', error);
  }
  return { resolution: '2K', duration: '5秒', modelId: '' };
};

const loadCachedImageSize = (): { resolution: ImageResolution; ratio: ImageRatio } => {
  try {
    const cached = localStorage.getItem(CREATOR_HUB_IMAGE_SIZE_CACHE_KEY);
    if (!cached) {
      return { resolution: '1K', ratio: '1:1' };
    }

    const parsed = JSON.parse(cached);
    const resolution = VALID_IMAGE_RESOLUTIONS.has(parsed?.resolution) ? parsed.resolution : '1K';
    const ratio = VALID_IMAGE_RATIOS.has(parsed?.ratio) ? parsed.ratio : '1:1';
    return { resolution, ratio };
  } catch (error) {
    console.error('读取 CreatorHub 图片尺寸缓存失败:', error);
  }
  return { resolution: '1K', ratio: '1:1' };
};

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
    title: 'MCP 市场',
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
  const containerRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  // 仅当接近视口时才下载视频截取首帧，避免首屏同时下载多个视频
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) {
        setInView(true);
        io.disconnect();
      }
    }, { rootMargin: '400px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!inView) return;
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
  }, [inView, videoUrl]);

  if (!videoUrl || error) {
    return (
      <div ref={containerRef} className={`flex items-center justify-center bg-gray-800 ${className}`}>
        <Video className="w-12 h-12 text-gray-600" />
      </div>
    );
  }

  // 加载中（含未进入视口的占位）
  if (loading) {
    return (
      <div ref={containerRef} className={`flex items-center justify-center bg-gray-800 ${className}`}>
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

// 精选内容卡片 — 等图片加载完成后整体淡入，避免卡片先出现再跳变
const ShowcaseCard: React.FC<{
  item: ShowcaseContent;
  currentLanguage: string;
  onClick: () => void;
}> = ({ item, currentLanguage, onClick }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [ready, setReady] = useState(false);

  // 判断该卡片是否有需要等待加载的图片（文本类型不使用缩略图）
  const getImageSrc = (): string | null => {
    if (item.contentType === 'text') return null;
    if (item.contentType === 'image') {
      return item.thumbnailUrl || item.generatedResult || null;
    }
    if (item.contentType === 'video' || item.contentType === 'longvideo' || item.contentType === 'app') {
      return isValidThumbnail(item.thumbnailUrl) ? item.thumbnailUrl! : null;
    }
    return isValidThumbnail(item.thumbnailUrl) ? item.thumbnailUrl! : null;
  };

  const imageSrc = getImageSrc();

  // 仅当卡片接近视口时才加载图片，避免首屏一次性发起大量图片/视频请求
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) {
        setInView(true);
        io.disconnect();
      }
    }, { rootMargin: '400px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // 进入视口后再预加载缩略图；无图片内容直接显示
  useEffect(() => {
    if (!inView) return;
    if (!imageSrc) {
      setReady(true);
      return;
    }
    const img = new window.Image();
    img.onload = () => setReady(true);
    img.onerror = () => setReady(true); // 加载失败也显示（会走 fallback）
    img.src = imageSrc;
  }, [inView, imageSrc]);

  return (
    <div
      ref={cardRef}
      className="bg-[#1a1a1a] rounded-xl overflow-hidden border border-gray-800 hover:border-gray-700 transition-all group cursor-pointer"
      onClick={onClick}
    >
      {/* 缩略图 */}
      <div className="bg-gray-900 relative overflow-hidden">
        {imageSrc && !ready && (
          <div className="w-full aspect-[4/3] bg-gray-800 animate-pulse" />
        )}
        {(!imageSrc || ready) && (
        <>
        {item.contentType === 'video' ? (
          <>
            {isValidThumbnail(item.thumbnailUrl) ? (
              <img src={item.thumbnailUrl} alt={item.title} loading="lazy" decoding="async" className="w-full h-auto group-hover:scale-105 transition-transform duration-300" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            ) : item.generatedResult ? (
              (() => {
                const videoUrlRegex = /(https?:\/\/[^\s]+\.(?:mp4|webm|mov|avi|mkv))/i;
                const match = item.generatedResult.match(videoUrlRegex);
                const videoUrl = match ? match[1] : item.generatedResult;
                return <VideoThumbnail videoUrl={videoUrl} alt={item.title} className="w-full aspect-video" />;
              })()
            ) : (
              <div className="w-full aspect-video flex items-center justify-center text-gray-600"><Video className="w-12 h-12" /></div>
            )}
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/60 transition-colors z-10">
              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Play className="w-6 h-6 text-white ml-1" />
              </div>
            </div>
          </>
        ) : item.contentType === 'longvideo' ? (
          <>
            {isValidThumbnail(item.thumbnailUrl) ? (
              <img src={item.thumbnailUrl} alt={item.title} loading="lazy" decoding="async" className="w-full h-auto group-hover:scale-105 transition-transform duration-300" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            ) : (() => {
              try {
                const projectData = JSON.parse(item.generatedResult || '{}');
                const shots = projectData.shots || [];
                const firstShot = shots.find((s: any) => s.keyframes?.find((kf: any) => kf.type === 'start' && kf.imageUrl));
                const imageUrl = firstShot?.keyframes?.find((kf: any) => kf.type === 'start')?.imageUrl;
                if (imageUrl) return <img src={imageUrl} alt={item.title} loading="lazy" decoding="async" className="w-full aspect-video object-cover group-hover:scale-105 transition-transform duration-300" />;
              } catch {}
              return <div className="w-full aspect-video flex items-center justify-center text-gray-600"><Film className="w-12 h-12" /></div>;
            })()}
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/60 transition-colors z-10">
              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center"><Play className="w-6 h-6 text-white ml-1" /></div>
            </div>
            <div className="absolute top-2 left-2 px-2 py-0.5 bg-indigo-500/80 text-white text-[10px] font-bold rounded z-20 flex items-center gap-1">
              <Film className="w-3 h-3" />{currentLanguage === 'zh' ? '长视频' : 'Long Video'}
            </div>
          </>
        ) : item.contentType === 'app' ? (
          <>
            {isValidThumbnail(item.thumbnailUrl) ? (
              <img src={item.thumbnailUrl} alt={item.title} loading="lazy" decoding="async" className="w-full h-auto group-hover:scale-105 transition-transform duration-300" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            ) : (
              <div className="w-full aspect-video flex items-center justify-center bg-gradient-to-br from-green-900/40 to-emerald-900/40 text-green-400"><Globe className="w-12 h-12" /></div>
            )}
            <div className="absolute top-2 left-2 px-2 py-0.5 bg-green-500/80 text-white text-[10px] font-bold rounded z-20 flex items-center gap-1">
              <Globe className="w-3 h-3" />{currentLanguage === 'zh' ? '网页应用' : 'Web App'}
            </div>
          </>
        ) : item.contentType === 'image' ? (
          item.thumbnailUrl ? (
            <img src={item.thumbnailUrl} alt={item.title} loading="lazy" decoding="async" className="w-full h-auto group-hover:scale-105 transition-transform duration-300" />
          ) : item.generatedResult ? (
            <img src={item.generatedResult} alt={item.title} loading="lazy" decoding="async" className="w-full h-auto group-hover:scale-105 transition-transform duration-300" />
          ) : (
            <div className="w-full aspect-square flex items-center justify-center text-gray-600"><Image className="w-12 h-12" /></div>
          )
        ) : item.contentType === 'text' ? (
          <div className="w-full aspect-[4/3] flex flex-col justify-between p-4 bg-gradient-to-br from-blue-950/40 via-gray-900 to-gray-950">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-blue-400" />
              </div>
              <span className="text-[10px] text-blue-400/80 font-medium">
                {currentLanguage === 'zh' ? '文本对话' : 'Text Chat'}
              </span>
            </div>
            <p className="text-xs leading-relaxed text-gray-400 line-clamp-5 flex-1 my-3">
              {getTextPreview(item.generatedResult) || item.title}
            </p>
            {item.aiModel && (
              <span className="text-[10px] text-orange-400/90 font-mono truncate">{item.aiModel}</span>
            )}
          </div>
        ) : (
          isValidThumbnail(item.thumbnailUrl) ? (
            <img src={item.thumbnailUrl} alt={item.title} loading="lazy" decoding="async" className="w-full h-auto group-hover:scale-105 transition-transform duration-300" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          ) : (
            <div className="w-full aspect-video flex items-center justify-center text-gray-600"><MessageSquare className="w-12 h-12" /></div>
          )
        )}
        {item.isRecommended === '1' && (
          <div className="absolute top-2 right-2 px-2 py-1 bg-orange-500 text-white text-xs font-bold rounded z-20">
            {currentLanguage === 'zh' ? '推荐' : 'Featured'}
          </div>
        )}
        </>
        )}
      </div>
      {/* 信息 */}
      <div className="p-4">
        <h3 className="text-white font-medium text-sm mb-3 line-clamp-2 group-hover:text-orange-400 transition-colors">{item.title}</h3>
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{item.viewCount || 0}</span>
          {item.aiModel && <span className="text-orange-400 text-[10px] font-mono truncate max-w-[80px]">{item.aiModel}</span>}
        </div>
      </div>
    </div>
  );
};
const LongVideoList: React.FC<{
  videoList: { shotNumber: number; actionSummary: string; duration: number; videoUrl: string; imageUrl?: string }[];
  currentLanguage: string;
}> = ({ videoList, currentLanguage }) => {
  const [activeIndex, setActiveIndex] = React.useState(0);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);
  const activeVideo = videoList[activeIndex];

  const handleEnded = React.useCallback(() => {
    if (activeIndex < videoList.length - 1) {
      setActiveIndex(prev => prev + 1);
    }
  }, [activeIndex, videoList.length]);

  // 切换到新片段时自动播放，并滚动列表到对应项
  React.useEffect(() => {
    if (videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().catch(() => {});
    }
    // 滚动列表到当前激活项
    if (listRef.current) {
      const activeItem = listRef.current.querySelector(`[data-idx="${activeIndex}"]`) as HTMLElement;
      if (activeItem) {
        activeItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [activeIndex]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <Film className="w-4 h-4 text-indigo-400" />
        <span className="text-sm font-medium text-gray-400">
          {currentLanguage === 'zh' ? `视频片段（${videoList.length} 个）` : `Video Clips (${videoList.length})`}
        </span>
        {activeIndex < videoList.length - 1 && (
          <span className="text-xs text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">
            {currentLanguage === 'zh' ? '自动连播' : 'Auto-play'}
          </span>
        )}
      </div>

      {/* 当前播放的视频 */}
      <div className="bg-gray-900 rounded-lg overflow-hidden aspect-video">
        <video
          ref={videoRef}
          key={activeVideo.videoUrl}
          src={activeVideo.videoUrl}
          controls
          className="w-full h-full"
          preload="auto"
          onEnded={handleEnded}
        />
      </div>

      {/* 当前镜头信息 */}
      <div className="flex items-center gap-2 px-1">
        <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-400 text-xs rounded font-mono">
          Shot {String(activeVideo.shotNumber).padStart(2, '0')}
        </span>
        <span className="text-sm text-gray-300 truncate flex-1">{activeVideo.actionSummary}</span>
        {activeVideo.duration > 0 && (
          <span className="text-xs text-gray-500 font-mono flex-shrink-0">{activeVideo.duration}s</span>
        )}
      </div>

      {/* 视频列表 */}
      <div ref={listRef} className="bg-gray-900/50 rounded-lg border border-gray-800 overflow-hidden max-h-56 overflow-y-auto">
        {videoList.map((item, idx) => (
          <div
            key={item.videoUrl}
            data-idx={idx}
            onClick={() => setActiveIndex(idx)}
            className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors border-b border-gray-800 last:border-0 ${
              idx === activeIndex ? 'bg-indigo-500/10 border-l-2 border-l-indigo-500' : 'hover:bg-gray-800/60'
            }`}
          >
            {/* 缩略图 */}
            <div className="w-12 h-8 bg-gray-800 rounded overflow-hidden flex-shrink-0 relative">
              {item.imageUrl ? (
                <img src={item.imageUrl} alt="" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Play className="w-3 h-3 text-gray-600" />
                </div>
              )}
              {idx === activeIndex && (
                <div className="absolute inset-0 bg-indigo-500/20 flex items-center justify-center">
                  <Play className="w-3 h-3 text-indigo-400 fill-indigo-400" />
                </div>
              )}
            </div>
            {/* 镜头编号 */}
            <span className={`text-xs font-mono flex-shrink-0 w-10 ${idx === activeIndex ? 'text-indigo-400' : 'text-gray-500'}`}>
              {String(item.shotNumber).padStart(2, '0')}
            </span>
            {/* 描述 */}
            <span className={`text-xs flex-1 truncate ${idx === activeIndex ? 'text-white' : 'text-gray-400'}`}>
              {item.actionSummary}
            </span>
            {/* 时长 */}
            {item.duration > 0 && (
              <span className="text-xs text-gray-600 font-mono flex-shrink-0">{item.duration}s</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export const CreatorHubPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentLanguage } = useLanguage();
  const videoGenBootstrapRef = useRef<CachedVideoGen | null>(null);
  if (videoGenBootstrapRef.current === null) {
    videoGenBootstrapRef.current = loadCachedVideoGen();
  }
  const persistedVideoModelIdRef = useRef<string>(videoGenBootstrapRef.current.modelId);
  const [selectedType, setSelectedType] = useState<CreationType>('text');
  const [backgroundLoaded, setBackgroundLoaded] = useState(true);
  const [prompt, setPrompt] = useState('');
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  // 视频模式专用：首帧图和尾帧图
  const [videoFirstFrame, setVideoFirstFrame] = useState<File | null>(null);
  const [videoLastFrame, setVideoLastFrame] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showModeDropdown, setShowModeDropdown] = useState(false);
  const cachedImageSize = loadCachedImageSize();
  // 视频/图片分辨率和比例
  const [videoResolution, setVideoResolution] = useState<'1K' | '2K' | '4K'>(videoGenBootstrapRef.current.resolution);
  const [videoRatio, setVideoRatio] = useState<'16:9' | '9:16' | '1:1'>(() => loadCachedVideoRatio());
  const [videoDuration, setVideoDuration] = useState<'5秒' | '10秒' | '15秒'>(videoGenBootstrapRef.current.duration);
  const [imageResolution, setImageResolution] = useState<'1K' | '2K' | '4K'>(cachedImageSize.resolution);
  const [imageRatio, setImageRatio] = useState<'16:9' | '9:16' | '1:1' | '4:3' | '3:4'>(cachedImageSize.ratio);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const firstFrameInputRef = useRef<HTMLInputElement>(null);
  const lastFrameInputRef = useRef<HTMLInputElement>(null);
  const modeDropdownRef = useRef<HTMLDivElement>(null);

  // Showcase 相关状态（优先读 session 缓存，刷新时立即显示上次内容）
  const cachedShowcase = loadShowcaseCache();
  const [categories, setCategories] = useState<ShowcaseCategory[]>(() => loadCategoriesCache());
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [showcaseList, setShowcaseList] = useState<ShowcaseContent[]>(() => cachedShowcase.list);
  const [showcaseLoading, setShowcaseLoading] = useState(() => cachedShowcase.list.length === 0);
  const [showcasePage, setShowcasePage] = useState(1);
  const [showcaseTotal, setShowcaseTotal] = useState(() => cachedShowcase.total);

  // 响应式列数：监听窗口宽度变化
  const [windowWidth, setWindowWidth] = useState(() => typeof window !== 'undefined' ? window.innerWidth : 1280);
  useEffect(() => {
    const onResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  const colCount = windowWidth < 1024 ? 2 : 4;
  const showcasePageSize = 24;
  const [selectedShowcase, setSelectedShowcase] = useState<ShowcaseContent | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isCreatingSimilar, setIsCreatingSimilar] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [isNavbarTransparent, setIsNavbarTransparent] = useState(true);
  const sharedShowcaseTriedIdsRef = useRef<Set<number>>(new Set());

  // 监听滚动，控制导航栏透明度
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      // 滚动超过50px时，导航栏变为不透明
      setIsNavbarTransparent(scrollY < 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
        setModels(sortModelsByOrderBy(response.data as ModelInfo[]));
      }
    } catch (error) {
      console.error('Failed to load models:', error);
    }
  }, []);

  useEffect(() => {
    loadModels();
  }, [loadModels]);

  useEffect(() => {
    try {
      localStorage.setItem(CREATOR_HUB_VIDEO_RATIO_CACHE_KEY, videoRatio);
    } catch (error) {
      console.error('保存 CreatorHub 视频比例缓存失败:', error);
    }
  }, [videoRatio]);

  useEffect(() => {
    if (selectedType === 'video' && selectedModel) {
      persistedVideoModelIdRef.current = selectedModel;
    }
    try {
      localStorage.setItem(
        CREATOR_HUB_VIDEO_GEN_CACHE_KEY,
        JSON.stringify({
          resolution: videoResolution,
          duration: videoDuration,
          modelId: persistedVideoModelIdRef.current
        })
      );
    } catch (error) {
      console.error('保存 CreatorHub 视频生成偏好缓存失败:', error);
    }
  }, [videoResolution, videoDuration, selectedModel, selectedType]);

  useEffect(() => {
    try {
      localStorage.setItem(
        CREATOR_HUB_IMAGE_SIZE_CACHE_KEY,
        JSON.stringify({ resolution: imageResolution, ratio: imageRatio })
      );
    } catch (error) {
      console.error('保存 CreatorHub 图片尺寸缓存失败:', error);
    }
  }, [imageResolution, imageRatio]);

  // 加载分类列表
  const loadCategories = useCallback(async () => {
    try {
      const response = await showcaseApi.getCategoryList({ status: '0' });
      if (response.code === 200 && response.rows) {
        setCategories(response.rows);
        saveCategoriesCache(response.rows);
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
        params.originalPrompt = searchKeyword.trim();
      }

      const response = await showcaseApi.getShowcaseList(params);
      if (response.code === 200) {
        if (append) {
          setShowcaseList(prev => {
            const merged = [...prev, ...(response.rows || [])];
            saveShowcaseCache(merged, response.total || 0);
            return merged;
          });
        } else {
          const rows = response.rows || [];
          setShowcaseList(rows);
          saveShowcaseCache(rows, response.total || 0);
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

  const syncShowcaseShareParam = useCallback((showcaseId?: number | string) => {
    const params = new URLSearchParams(location.search);
    if (showcaseId != null) {
      params.set('showcaseId', String(showcaseId));
    } else {
      params.delete('showcaseId');
    }
    const search = params.toString();
    navigate(
      {
        pathname: location.pathname,
        search: search ? `?${search}` : ''
      },
      { replace: true }
    );
  }, [location.pathname, location.search, navigate]);

  const closeDetailModal = useCallback(() => {
    setShowDetailModal(false);
    syncShowcaseShareParam(undefined);
  }, [syncShowcaseShareParam]);

  const handleOpenShowcaseDetail = useCallback((item: ShowcaseContent, options?: { incrementView?: boolean; syncUrl?: boolean }) => {
    const shouldIncrementView = options?.incrementView ?? true;
    const shouldSyncUrl = options?.syncUrl ?? true;

    if (shouldIncrementView) {
      const updatedItem = { ...item, viewCount: (item.viewCount || 0) + 1 };
      setShowcaseList(prev => prev.map(i => i.id === item.id ? updatedItem : i));
      setSelectedShowcase(updatedItem);
      setShowDetailModal(true);

      showcaseApi.incrementViewCount(item.id).catch(error => {
        console.error('更新浏览数失败:', error);
        // 如果失败，回滚本地数据
        setShowcaseList(prev => prev.map(i => i.id === item.id ? item : i));
        setSelectedShowcase(prev => (prev?.id === item.id ? item : prev));
      });
    } else {
      setSelectedShowcase(item);
      setShowDetailModal(true);
    }

    if (shouldSyncUrl) {
      syncShowcaseShareParam(item.id);
    }
  }, [syncShowcaseShareParam]);

  const handleShareShowcase = useCallback(async () => {
    if (!selectedShowcase) return;

    const shareUrl = new URL(window.location.href);
    shareUrl.searchParams.set('showcaseId', String(selectedShowcase.id));
    const finalUrl = shareUrl.toString();

    // 优先复制链接：clipboard 必须在用户手势上下文中立即调用，
    // 不能放在 await navigator.share() 之后（手势上下文会被消耗）
    try {
      await navigator.clipboard.writeText(finalUrl);
      toast.success(currentLanguage === 'zh' ? '分享链接已复制' : 'Share link copied');
      return;
    } catch {
      // clipboard 不可用时（如非 HTTPS 或权限被拒），降级到系统分享
    }

    // 降级：系统原生分享
    if (navigator.share) {
      try {
        await navigator.share({
          title: selectedShowcase.title,
          text: currentLanguage === 'zh' ? '我在 AIGC 内容社区发现了这个作品，分享给你：' : 'Check out this AIGC content:',
          url: finalUrl
        });
        return;
      } catch (error: any) {
        if (error?.name === 'AbortError') return;
      }
    }

    // 最终降级：prompt 手动复制
    window.prompt(currentLanguage === 'zh' ? '复制下面链接进行分享：' : 'Copy this link to share:', finalUrl);
  }, [selectedShowcase, currentLanguage]);

  // 初始加载分类和内容
  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    loadShowcaseList(1);
  }, [selectedCategory]);

  // 通过分享链接自动打开指定内容（示例：?showcaseId=123）
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const sharedIdRaw = params.get('showcaseId');
    if (!sharedIdRaw) return;

    // 用字符串比较，避免超大 id（雪花算法 > MAX_SAFE_INTEGER）转 Number 后精度丢失
    const sharedIdStr = sharedIdRaw.trim();
    if (!sharedIdStr || !/^\d+$/.test(sharedIdStr)) return;

    if (showDetailModal && String(selectedShowcase?.id) === sharedIdStr) return;

    const target = showcaseList.find(item => String(item.id) === sharedIdStr);
    if (target) {
      handleOpenShowcaseDetail(target, { incrementView: false, syncUrl: false });
      return;
    }

    if (sharedShowcaseTriedIdsRef.current.has(sharedIdStr as any)) return;
    sharedShowcaseTriedIdsRef.current.add(sharedIdStr as any);

    let cancelled = false;
    const tryLoadSharedItem = async () => {
      try {
        const response = await showcaseApi.getShowcaseList({
          pageNum: 1,
          pageSize: 1,
          status: '0',
          id: sharedIdStr   // 传字符串，后端通常能正确处理
        } as any);
        const rows = response.rows || [];
        const matched = rows.find((item: any) => String(item.id) === sharedIdStr);
        if (!cancelled && matched) {
          setShowcaseList(prev => prev.some(item => String(item.id) === sharedIdStr) ? prev : [matched, ...prev]);
          handleOpenShowcaseDetail(matched, { incrementView: false, syncUrl: false });
        } else if (!cancelled) {
          toast.error(currentLanguage === 'zh' ? '分享内容不存在或已下架' : 'Shared content not found');
        }
      } catch (error) {
        if (!cancelled) {
          console.error('加载分享内容失败:', error);
          toast.error(currentLanguage === 'zh' ? '加载分享内容失败' : 'Failed to load shared content');
        }
      }
    };

    tryLoadSharedItem();
    return () => {
      cancelled = true;
    };
  }, [location.search, showcaseList, showDetailModal, selectedShowcase?.id, handleOpenShowcaseDetail, currentLanguage]);

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

  // 当过滤后的模型列表变化时：优先恢复缓存的模型，否则默认选第一个
  useEffect(() => {
    if (filteredModels.length === 0) return;
    if (filteredModels.some(m => m.id === selectedModel)) return;

    let nextId = filteredModels[0].id;
    if (selectedType === 'video') {
      const mid = persistedVideoModelIdRef.current;
      if (mid && filteredModels.some(m => m.id === mid)) {
        nextId = mid;
      }
    } else if (selectedType === 'image') {
      // 图片模式：优先读与 ImageEditorPage 共享的缓存
      const cachedId = localStorage.getItem(SHARED_IMAGE_MODEL_KEY);
      if (cachedId && filteredModels.some(m => m.id === cachedId)) {
        nextId = cachedId;
      }
    }
    setSelectedModel(nextId);
  }, [filteredModels, selectedModel, selectedType]);

  // 图片模式下，selectedModel 变化时同步写入共享缓存
  useEffect(() => {
    if (selectedType !== 'image' || !selectedModel) return;
    try {
      localStorage.setItem(SHARED_IMAGE_MODEL_KEY, selectedModel);
    } catch (error) {
      console.error('保存共享图片模型缓存失败:', error);
    }
  }, [selectedModel, selectedType]);

  // 获取当前选中的功能配置
  const currentOption = creationOptions.find(o => o.type === selectedType)!;

  // 处理图片上传（图片模式）
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newImages = Array.from(files).filter(f =>
        f.type.startsWith('image/') &&
        !f.name.toLowerCase().endsWith('.lnk') &&
        !f.name.toLowerCase().endsWith('.url')
      );
      setUploadedImages(prev => [...prev, ...newImages].slice(0, 4)); // 最多4张
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 处理视频首帧图上传
  const handleFirstFrameUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/') &&
        !file.name.toLowerCase().endsWith('.lnk') &&
        !file.name.toLowerCase().endsWith('.url')) {
      setVideoFirstFrame(file);
    }
    if (firstFrameInputRef.current) {
      firstFrameInputRef.current.value = '';
    }
  };

  // 处理视频尾帧图上传
  const handleLastFrameUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/') &&
        !file.name.toLowerCase().endsWith('.lnk') &&
        !file.name.toLowerCase().endsWith('.url')) {
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
          if (!localStorage.getItem('token')) {
            navigate('/login', { state: { from: location } });
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
          if (!localStorage.getItem('token')) {
            navigate('/login', { state: { from: location } });
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
          if (!localStorage.getItem('token')) {
            navigate('/login', { state: { from: location } });
            setIsLoading(false);
            return;
          }
          // 获取当前选中的模型信息
          const currentModel = models.find(m => m.id === selectedModel);

          // 转换分辨率格式
          const resolutionMap: { [key: string]: '480P' | '720P' | '1080P' } = {
            '1K': '480P',
            '2K': '720P',
            '4K': '1080P'
          };

          // 跳转到图片编辑器，传递首帧图和尾帧图用于视频生成
          navigate('/image-editor', {
            state: {
              initialPrompt: prompt.trim(),
              firstFrameImage: videoFirstFrame,
              lastFrameImage: videoLastFrame,
              model: currentModel?.modelName || selectedModel,
              size: resolutionMap[videoResolution] || '720P',
              ratio: videoRatio,
              duration: videoDuration,
              audio: true,
              mode: 'video', // 标记为视频模式
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
          // 检查登录状态
          const userId = localStorage.getItem('userId');
          if (!userId) {
            toast.error(currentLanguage === 'zh' ? '请先登录' : 'Please login first');
            setIsLoading(false);
            navigate('/login', { state: { from: location } });
            return;
          }
          // 直接创建应用并跳转到构建页面
          try {
            const response = await createApp({
              initPrompt: prompt.trim(),
              message: prompt.trim(),
              userId,
            });
            if (response.code === 200 && response.data) {
              toast.success(currentLanguage === 'zh' ? '应用创建成功，正在生成...' : 'App created successfully, generating...');
              // 跳转到构建页面，自动开始生成
              navigate(`/app/build/${response.data}`);
            } else {
              toast.error((currentLanguage === 'zh' ? '创建失败: ' : 'Create failed: ') + response.message);
            }
          } catch (error) {
            console.error(currentLanguage === 'zh' ? '创建应用失败:' : 'Create app failed:', error);
            toast.error(currentLanguage === 'zh' ? '创建失败，请重试' : 'Creation failed, please retry');
          }
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
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col relative">
      <Navbar transparent={isNavbarTransparent} />
      
      {/* 全局背景 - 从页面顶部开始，覆盖导航栏区域 */}
      <div className="absolute left-0 right-0 top-0 w-full h-[600px] lg:h-[800px] pointer-events-none">
        {/* 图片背景 */}
        <div
          className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-500 ${
            selectedType === 'video' ? 'opacity-0' : 'opacity-40'
          }`}
          style={{
            backgroundImage: 'url(/images/hero.webp)',
            maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.6) 60%, rgba(0,0,0,0) 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.6) 60%, rgba(0,0,0,0) 100%)',
            filter: 'brightness(1.3)'
          }}
        />

        {/* 视频背景：仅在视频模式下挂载，避免首屏下载 hero.mp4 */}
        {selectedType === 'video' && (
        <video
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500 opacity-40"
          style={{
            maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.6) 60%, rgba(0,0,0,0) 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.6) 60%, rgba(0,0,0,0) 100%)',
            filter: 'brightness(1.3)'
          }}
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          onLoadedData={() => setBackgroundLoaded(true)}
          onError={() => setBackgroundLoaded(true)}
        >
          <source src="/images/hero.mp4" type="video/mp4" />
        </video>
        )}
      </div>

      <main className="flex-grow flex flex-col items-center justify-center px-4 py-12 lg:py-20 relative z-10">
        {/* Hero 区域 - 不再需要单独的背景图 */}
        <div className="w-full flex flex-col items-center relative">
          {/* Hero 内容 */}
          <div className="w-full flex flex-col items-center">
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
                        setBackgroundLoaded(false);
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
                    accept="image/png,image/jpeg,image/jpg,image/gif,image/bmp,image/webp,image/svg+xml"
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
                    accept="image/png,image/jpeg,image/jpg,image/gif,image/bmp,image/webp,image/svg+xml"
                    onChange={handleFirstFrameUpload}
                    className="hidden"
                  />
                  <input
                    ref={lastFrameInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/gif,image/bmp,image/webp,image/svg+xml"
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
                        { value: '1K', label: '1K (480P)', description: '720×480' },
                        { value: '2K', label: '2K (720P)', description: '1280×720' },
                        { value: '4K', label: '4K (1080P)', description: '1920×1080' }
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
                    {/* 时长选择 */}
                    <DropdownSelector
                      options={[
                        { value: '5秒', label: currentLanguage === 'zh' ? '5秒' : '5 seconds', description: currentLanguage === 'zh' ? '超短视频' : 'Ultra short' },
                        { value: '10秒', label: currentLanguage === 'zh' ? '10秒' : '10 seconds', description: currentLanguage === 'zh' ? '短视频' : 'Short video' },
                        { value: '15秒', label: currentLanguage === 'zh' ? '15秒' : '15 seconds', description: currentLanguage === 'zh' ? '中等视频' : 'Medium video' }
                      ]}
                      value={videoDuration}
                      onChange={(v) => setVideoDuration(v as '5秒' | '10秒' | '15秒')}
                      icon={<Clock className="w-4 h-4 lg:w-5 lg:h-5" />}
                      title={currentLanguage === 'zh' ? '选择时长' : 'Select Duration'}
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
          </div>
        </div>

        {/* Banner 区域 - 请将banner文件放置在public/images/目录下，命名为banner.jpg、banner.png等 */}
        <div className="w-full max-w-4xl xl:max-w-5xl 2xl:max-w-6xl mt-4 lg:mt-6">
          <img
            src="/images/banner.jpg"
            alt="Banner"
            className="w-full h-auto rounded-xl shadow-lg cursor-pointer hover:shadow-xl transition-shadow duration-300"
            onClick={() => navigate('/login')}
            onError={(e) => {
              // 如果banner.jpg不存在，尝试其他常见格式
              const img = e.target as HTMLImageElement;
              const extensions = ['png', 'jpeg', 'gif', 'webp'];
              let tried = 0;

              const tryNext = () => {
                if (tried < extensions.length) {
                  img.src = `/images/banner.${extensions[tried]}`;
                  tried++;
                } else {
                  // 所有格式都尝试失败，隐藏banner
                  img.style.display = 'none';
                }
              };

              tryNext();
            }}
            onLoad={() => {
              // 图片加载成功，确保显示
              const img = document.querySelector('img[alt="Banner"]') as HTMLImageElement;
              if (img) img.style.display = 'block';
            }}
          />
        </div>

        {/* 精选内容展示区 */}
        <div className="w-full lg:max-w-4xl xl:max-w-5xl 2xl:max-w-7xl mt-4 lg:mt-6 min-w-0">
          <div className="flex items-center justify-between mb-8 gap-4">
            <h2 className="text-2xl lg:text-3xl font-bold text-white">
              {currentLanguage === 'zh' ? 'AIGC开源社区' : 'AIGC Community'}
            </h2>
            
            {/* 搜索框 */}
            <div className="relative flex-shrink-0 w-64 lg:w-80">
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchKeyword.trim()) {
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
          {showcaseLoading && showcaseList.length === 0 ? (
            <ShowcaseSkeletonGrid colCount={colCount} />
          ) : showcaseList.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
              {currentLanguage === 'zh' ? '暂无内容' : 'No content'}
            </div>
          ) : (
            <>
              {/* 瀑布流：手动分列，确保新内容横向分布到各列而非全堆第一列 */}
              {(() => {
                // 按索引取模分配：item[0]→col0, item[1]→col1, item[2]→col2, item[3]→col3, item[4]→col0...
                const cols: typeof showcaseList[] = Array.from({ length: colCount }, () => []);
                showcaseList.forEach((item, idx) => cols[idx % colCount].push(item));
                return (
                  <div className="flex gap-4 lg:gap-6 items-start w-full min-w-0">
                    {cols.map((colItems, colIdx) => (
                      <div key={colIdx} className="flex-1 min-w-0 flex flex-col gap-4 lg:gap-6">
                        {colItems.map((item) => (
                          <ShowcaseCard
                            key={item.id}
                            item={item}
                            currentLanguage={currentLanguage}
                            onClick={() => handleOpenShowcaseDetail(item, { incrementView: true, syncUrl: true })}
                          />
                        ))}
                      </div>
                    ))}
                  </div>
                );
              })()}

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
          onClick={closeDetailModal}
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
                onClick={closeDetailModal}
                className="w-10 h-10 flex items-center justify-center bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0"
              >
                <X className="w-5 h-5 text-gray-300" />
              </button>
            </div>

            {/* 内容区域 */}
            <div className="flex-1 overflow-y-auto p-4 lg:p-6">
              {selectedShowcase.contentType === 'text' ? (() => {
                const { urls: promptImageUrls, text: promptText } = parsePromptImages(selectedShowcase.originalPrompt || '');
                return (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 min-w-0">
                      <div className="bg-gray-950/60 rounded-xl border border-gray-800 p-4 lg:p-6 space-y-5 max-h-[65vh] overflow-y-auto min-w-0">
                        {promptText && (
                          <div className="flex justify-end min-w-0">
                            <div className="min-w-0 max-w-[88%]">
                              <div className="text-[10px] text-gray-500 mb-1.5 text-right px-1">
                                {currentLanguage === 'zh' ? '用户' : 'You'}
                              </div>
                              <div className="bg-blue-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap break-words">
                                {promptText}
                              </div>
                            </div>
                          </div>
                        )}
                        {promptImageUrls.length > 0 && (
                          <div className="flex justify-end gap-2 flex-wrap">
                            {promptImageUrls.map((url, idx) => (
                              <div key={idx} className="w-20 h-20 rounded-lg overflow-hidden border border-gray-700">
                                <img src={url} alt="" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                              </div>
                            ))}
                          </div>
                        )}
                        {selectedShowcase.generatedResult && (
                          <div className="flex justify-start gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center shrink-0 mt-1">
                              <Bot className="w-4 h-4 text-orange-400" />
                            </div>
                            <div className="min-w-0 max-w-[calc(100%-2.75rem)]">
                              <div className="flex items-center gap-2 mb-1.5 px-1">
                                <span className="text-[10px] text-gray-500">
                                  {currentLanguage === 'zh' ? 'AI 助手' : 'AI Assistant'}
                                </span>
                                {selectedShowcase.aiModel && (
                                  <span className="text-[10px] text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded font-mono">
                                    {selectedShowcase.aiModel}
                                  </span>
                                )}
                              </div>
                              <div className="bg-gray-800/80 border border-gray-700 rounded-2xl rounded-tl-sm px-4 py-3 text-gray-200 text-sm min-w-0 overflow-hidden">
                                <div className="showcase-chat-markdown prose prose-sm prose-invert max-w-none break-words">
                                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {selectedShowcase.generatedResult}
                                  </ReactMarkdown>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="space-y-4">
                      {selectedShowcase.aiModel && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Zap className="w-4 h-4 text-orange-400" />
                            <span className="text-sm font-medium text-gray-400">
                              {currentLanguage === 'zh' ? 'AI 模型' : 'AI Model'}
                            </span>
                          </div>
                          <div className="bg-gray-900/50 rounded-lg p-3 text-gray-300 text-sm font-mono">
                            {selectedShowcase.aiModel}
                          </div>
                        </div>
                      )}
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
                        } catch {
                          return null;
                        }
                      })()}
                      {selectedShowcase.tags && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-medium text-gray-400">
                              {currentLanguage === 'zh' ? '标签' : 'Tags'}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {selectedShowcase.tags.split(',').map((tag, idx) => (
                              <span key={idx} className="px-3 py-1 bg-gray-800 text-gray-300 text-xs rounded-full">
                                {tag.trim()}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })() : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
                {/* 左侧：内容展示 */}
                <div className="space-y-4">
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

                  {/* 长视频类型 - 视频播放器 + 视频列表 */}
                  {selectedShowcase.contentType === 'longvideo' && (() => {
                    try {
                      const projectData = JSON.parse(selectedShowcase.generatedResult || '{}');
                      const shots = projectData.shots || [];
                      const videoList: { shotNumber: number; actionSummary: string; duration: number; videoUrl: string; imageUrl?: string }[] = [];
                      shots.forEach((shot: any, idx: number) => {
                        const videoUrl = shot.interval?.videoUrl;
                        if (videoUrl) {
                          const startKeyframe = shot.keyframes?.find((kf: any) => kf.type === 'start');
                          videoList.push({
                            shotNumber: idx + 1,
                            actionSummary: shot.actionSummary || `镜头 ${idx + 1}`,
                            duration: shot.interval?.duration || 0,
                            videoUrl,
                            imageUrl: startKeyframe?.imageUrl,
                          });
                        }
                      });
                      if (videoList.length === 0) return (
                        <div className="bg-gray-900 rounded-lg p-4 text-gray-400 text-sm">
                          {currentLanguage === 'zh' ? '暂无视频片段' : 'No video clips yet'}
                        </div>
                      );
                      return <LongVideoList videoList={videoList} currentLanguage={currentLanguage} />;
                    } catch (e) {
                      return (
                        <div className="bg-gray-900 rounded-lg p-4 text-gray-400 text-sm">
                          {selectedShowcase.title}
                        </div>
                      );
                    }
                  })()}

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
                            autoPlay
                            poster={isValidThumbnail(selectedShowcase.thumbnailUrl) ? selectedShowcase.thumbnailUrl : undefined}
                            className="w-full h-full"
                            preload="auto"
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
                        {isValidThumbnail(selectedShowcase.thumbnailUrl) && (
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

                  {/* App 类型 - iframe 预览 */}
                  {selectedShowcase.contentType === 'app' && (() => {
                    const appUrl = selectedShowcase.generatedResult
                      ? `https://mcp-x.com/dist/${selectedShowcase.generatedResult}`
                      : '';
                    return (
                      <div className="space-y-3">
                        {appUrl ? (
                          <>
                            <div className="bg-gray-900 rounded-lg overflow-hidden border border-gray-800" style={{ height: '480px' }}>
                              <iframe
                                src={appUrl}
                                title={selectedShowcase.title}
                                className="w-full h-full border-none"
                                sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <a
                                href={appUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-green-500 text-white text-sm font-semibold rounded-lg shadow-lg shadow-green-500/25 ring-1 ring-green-300/40 hover:bg-green-400 transition-all"
                              >
                                <Maximize2 className="w-4 h-4" />
                                {currentLanguage === 'zh' ? '↗ 新窗口打开查看' : '↗ Open in New Tab'}
                              </a>
                            </div>
                          </>
                        ) : (
                          <div className="bg-gray-900 rounded-lg p-4 text-gray-400 text-sm">
                            {currentLanguage === 'zh' ? '应用地址无效' : 'Invalid app URL'}
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
                    const { urls: imageUrls, text: promptText } = parsePromptImages(selectedShowcase.originalPrompt);

                    return (
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2 mb-3">
                          <MessageSquare className={`w-4 h-4 ${
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
                          <div className="bg-gray-900/50 rounded-lg p-4 text-gray-300 text-sm whitespace-pre-wrap overflow-y-auto" style={{ minHeight: '5.5rem', maxHeight: '24rem' }}>
                            {promptText}
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* longvideo 项目简介信息 */}
                  {selectedShowcase.contentType === 'longvideo' && (() => {
                    try {
                      const projectData = JSON.parse(selectedShowcase.generatedResult || '{}');
                      const targetDuration = projectData.targetDuration;
                      const videoModel = projectData.videoModel;
                      const imageModel = projectData.imageModel;
                      const shots = projectData.shots || [];
                      const completedShots = shots.filter((s: any) => s.interval?.videoUrl);
                      return (
                        <div className="bg-gray-900/50 rounded-lg p-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
                          {targetDuration && <span>时长目标：<span className="text-gray-300">{targetDuration}</span></span>}
                          {shots.length > 0 && <span>共 <span className="text-gray-300">{shots.length}</span> 个镜头</span>}
                          {completedShots.length > 0 && <span>已生成：<span className="text-indigo-400">{completedShots.length}</span> 个视频</span>}
                          {videoModel && <span>视频模型：<span className="text-gray-300">{videoModel}</span></span>}
                          {imageModel && <span>图像模型：<span className="text-gray-300">{imageModel}</span></span>}
                        </div>
                      );
                    } catch (e) {
                      return null;
                    }
                  })()}

                  {/* AI 模型信息 */}
                  {selectedShowcase.aiModel && (
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
              )}
            </div>

            {/* 底部操作栏 */}
            <div className="flex items-center justify-between p-4 lg:p-6 border-t border-gray-800 gap-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-800 rounded-lg">
                  <Eye className="w-4 h-4 text-blue-400" />
                  <span className="text-sm text-gray-300">{selectedShowcase.viewCount || 0}</span>
                </div>
                <button
                  onClick={handleShareShowcase}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-gray-300"
                >
                  <Share2 className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm">{currentLanguage === 'zh' ? '分享' : 'Share'}</span>
                </button>
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
                        // 跳转到图片编辑器，带入提示词但不自动发送
                        navigate('/image-editor', { 
                          state: { 
                            initialPrompt: prompt,
                            mode: 'video',
                            size: '720P',
                            ratio: '16:9',
                            duration: '5秒',
                            autoSubmit: false
                          } 
                        });
                      } else if (selectedShowcase.contentType === 'longvideo') {
                        // 跳转到视频工作室，带入提示词
                        navigate('/video-studio', {
                          state: {
                            initialPrompt: prompt,
                            autoSubmit: false
                          }
                        });
                      } else if (selectedShowcase.contentType === 'app') {
                        // 跳转到网页生成，带入提示词
                        navigate('/app/new', {
                          state: {
                            initialPrompt: prompt,
                            autoSubmit: false
                          }
                        });
                      }
                      
                      closeDetailModal();
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
                  onClick={closeDetailModal}
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
