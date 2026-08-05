import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  createApp,
  getMyApps,
  formatCodeGenType,
  fileToBase64DataUrl,
  type AppInfo,
  type WebgenMode,
} from '../services/appBuildApi';
import { toast } from '../utils/toast';
import { ArrowLeft, Code, Calendar, ImagePlus, X } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface CreateAppForm {
  initPrompt: string;
}

interface NewAppPageLocationState {
  initialPrompt?: string;
  autoSubmit?: boolean;
}

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

// 生成类型选择已取消

const examplePrompts = [
  {
    category: '网页',
    items: [
      {
        title: '个人作品集网站',
        prompt: '创建一个个人作品集网站，包含首页、关于我、项目展示、技能介绍和联系方式页面。使用现代简洁的设计风格，响应式布局，深色主题。',
      },
      {
        title: '公司官网',
        prompt: '设计一个科技公司官网，包含公司介绍、产品服务、团队介绍、新闻动态和联系我们。采用专业的商务风格，蓝白色调，包含轮播图和产品卡片。',
      },
      {
        title: '餐厅网站',
        prompt: '制作一个餐厅网站，展示菜单、餐厅环境、预订功能和联系信息。温馨的设计风格，美食图片展示，在线订餐功能。',
      },
      {
        title: '在线学习平台',
        prompt: '构建一个在线学习平台，包含课程列表、课程详情、学习进度、用户中心。现代化的教育风格设计，课程卡片布局。',
      },
    ],
  },
  {
    category: 'PPT',
    items: [
      {
        title: '年终工作总结',
        prompt: '制作一份年终工作总结PPT，包含年度亮点、核心数据、项目成果、团队贡献、问题与改进、明年计划共6页。商务蓝色主题，图表与文字结合，简洁大气。',
      },
      {
        title: '产品发布演示',
        prompt: '创建一份新产品发布PPT，包含产品背景、核心功能介绍、技术亮点、市场定位、用户案例、价格方案共6页。科技感设计，深色背景，突出产品卖点。',
      },
      {
        title: '项目提案报告',
        prompt: '制作一份项目提案PPT，包含项目背景与痛点、解决方案、实施计划、预期收益、风险评估、资源需求共6页。专业商务风格，逻辑清晰，数据可视化。',
      },
      {
        title: '培训课程课件',
        prompt: '设计一套员工培训PPT课件，主题为时间管理与效率提升，包含课程目标、核心理论、实用方法、案例分析、练习互动、总结回顾共6页。活泼清新风格，图文并茂。',
      },
    ],
  },
];

export const NewAppPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as NewAppPageLocationState | null;
  const { currentLanguage } = useLanguage();
  const [form, setForm] = useState<CreateAppForm>({
    initPrompt: '',
  });
  const [creating, setCreating] = useState(false);
  const [mode, setMode] = useState<WebgenMode>('normal');
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [uploadingImages, setUploadingImages] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [myApps, setMyApps] = useState<AppInfo[]>([]);
  const [myAppsLoading, setMyAppsLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState(examplePrompts[0].category);
  const userId = localStorage.getItem('userId');

  const handlePickImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = Array.from(e.target.files || []).find((f) => f.type.startsWith('image/'));
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (!file) return;
    if (file.size > MAX_IMAGE_SIZE) {
      toast.error(currentLanguage === 'zh' ? `${file.name} 超过 10MB` : `${file.name} exceeds 10MB`);
      return;
    }
    setUploadingImages(true);
    try {
      const dataUrl = await fileToBase64DataUrl(file);
      setAttachedImage(dataUrl);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || (currentLanguage === 'zh' ? '图片读取失败' : 'Failed to read image'));
    } finally {
      setUploadingImages(false);
    }
  };

  const removeImage = () => {
    setAttachedImage(null);
  };

  const formatTime = (timeString: string) => {
    try {
      return new Date(timeString).toLocaleString(currentLanguage === 'zh' ? 'zh-CN' : 'en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return timeString;
    }
  };

  // 检查登录状态
  useEffect(() => {
    if (!userId) {
      navigate('/login', { state: { from: location } });
    }
  }, [userId, navigate, location]);

  // 从精选内容「做同款」跳转过来时，自动回填模板提示词到输入框
  useEffect(() => {
    if (locationState?.initialPrompt) {
      setForm(prev => ({ ...prev, initPrompt: locationState.initialPrompt || '' }));
    }
  }, [locationState?.initialPrompt]);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      setMyAppsLoading(true);
      try {
        const response = await getMyApps({
          pageNum: 1,
          pageSize: 12,
          sortField: 'createTime',
          sortOrder: 'desc',
          isDelete: 0,
        });
        if (!cancelled && response.code === 200) {
          setMyApps(response.rows || []);
        }
      } catch (e) {
        console.error('加载应用列表失败:', e);
      } finally {
        if (!cancelled) setMyAppsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  // 创建应用执行逻辑（提交和回车复用）
  const handleCreate = async () => {
    if (!form.initPrompt.trim()) {
      toast.error(currentLanguage === 'zh' ? '请输入初始提示词' : 'Please enter an initial prompt');
      return;
    }
    if (!userId) {
      toast.error(currentLanguage === 'zh' ? '请先登录' : 'Please login first');
      navigate('/login', { state: { from: location } });
      return;
    }
    if (creating || uploadingImages) return;
    setCreating(true);
    try {
      const response = await createApp({
        initPrompt: form.initPrompt.trim(),
        message: form.initPrompt.trim(),
        userId,
        mode,
        ...(attachedImage ? { images: [attachedImage] } : {}),
      });
      if (response.code === 200 && response.data) {
        toast.success(currentLanguage === 'zh' ? '应用创建成功' : 'App created successfully');
        const appId = typeof response.data === 'object' ? (response.data as any).id || response.data : response.data;
        navigate(`/app/build/${appId}`, {
          state: {
            mode,
            ...(attachedImage ? { images: [attachedImage] } : {}),
          },
        });
      } else {
        toast.error((currentLanguage === 'zh' ? '创建失败: ' : 'Create failed: ') + (response.message || response.msg));
      }
    } catch (error) {
      console.error(currentLanguage === 'zh' ? '创建应用失败:' : 'Create app failed:', error);
      toast.error(currentLanguage === 'zh' ? '创建失败，请重试' : 'Creation failed, please retry');
    } finally {
      setCreating(false);
    }
  };

  // 表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    handleCreate();
  };

  // 使用示例提示词
  const useExamplePrompt = (prompt: string) => {
    setForm(prev => ({ ...prev, initPrompt: prompt }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 text-slate-800">
      {/* 顶部导航 */}
      <div className="border-b border-slate-200/80 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/')}
                className="flex items-center gap-2 text-slate-600 hover:text-blue-600 transition-colors"
              >
                <ArrowLeft size={20} />
                {currentLanguage === 'zh' ? '返回' : 'Back'}
              </button>
              <h1 className="text-2xl font-bold">{currentLanguage === 'zh' ? '创建新应用' : 'Create New App'}</h1>
            </div>
            <button
              onClick={() => navigate('/my-apps')}
              className="px-3 py-1.5 text-sm text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-md transition-colors"
            >
              {currentLanguage === 'zh' ? '我的应用' : 'My Apps'}
            </button>
          </div>
        </div>
      </div>

      {/* 主内容 */}
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 顶部提示文字（突出显示，居中） */}
          <h2 className="text-center text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            {currentLanguage === 'zh' ? '一句话，生成你的网站' : 'One sentence, build your website'}
          </h2>
          <p className="text-center text-base md:text-lg text-slate-700">
            {currentLanguage === 'zh' ? '用自然语言描述你的需求即可开始。写得越详细，结果越贴近你的想法。' : 'Describe your needs in natural language to get started. The more details, the closer the results match your idea.'}
          </p>

          {/* 对话输入框（突出显示为对话气泡风格） */}
          {/* <label className="block text-sm font-medium text-slate-700">
            初始提示词
          </label> */}
          {/* 普通 / Pro 模式 */}
          <div className="flex items-center justify-center gap-2">
            <span className="text-sm text-slate-600">{currentLanguage === 'zh' ? '生成模式' : 'Mode'}</span>
            <div className="inline-flex rounded-lg border border-slate-300 bg-white p-0.5 shadow-sm">
              <button
                type="button"
                onClick={() => setMode('normal')}
                className={`px-4 py-1.5 text-sm rounded-md transition-colors ${
                  mode === 'normal' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {currentLanguage === 'zh' ? '普通' : 'Normal'}
              </button>
              <button
                type="button"
                onClick={() => setMode('pro')}
                className={`px-4 py-1.5 text-sm rounded-md transition-colors ${
                  mode === 'pro' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                Pro
              </button>
            </div>
            <span className="text-xs text-slate-500">
              {mode === 'pro'
                ? (currentLanguage === 'zh' ? '更强模型，效果更好' : 'Stronger model')
                : (currentLanguage === 'zh' ? '更快更省' : 'Faster & cheaper')}
            </span>
          </div>

          <div className="relative overflow-visible">
            {attachedImage && (
              <div className="flex flex-wrap gap-2 mb-2 px-1">
                <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
                  <img src={attachedImage} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80"
                  >
                    <X size={12} />
                  </button>
                </div>
              </div>
            )}
                <textarea
                  value={form.initPrompt}
                  onChange={(e) => setForm(prev => ({ ...prev, initPrompt: e.target.value }))}
              placeholder={currentLanguage === 'zh' ? '一句话生成网站：例如 创建一个个人作品集网站，包含首页、项目、关于我、联系方式，深色科技风，支持移动端。可上传一张参考图。' : 'One sentence to build your site. You can also attach one reference image.'}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 pb-14 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none shadow-sm"
              rows={5}
                  maxLength={8000}
                  required
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleCreate();
                  }
                }}
                />
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImages}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg disabled:opacity-50 transition-colors"
                >
                  <ImagePlus size={16} />
                  {uploadingImages
                    ? (currentLanguage === 'zh' ? '读取中...' : 'Reading...')
                    : (currentLanguage === 'zh' ? '上传图片' : 'Upload')}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePickImages}
                />
              </div>
              <button
                type="submit"
                disabled={creating || uploadingImages || !form.initPrompt.trim()}
                className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                {creating ? (currentLanguage === 'zh' ? '创建中...' : 'Creating...') : (currentLanguage === 'zh' ? '创建应用' : 'Create App')}
              </button>
            </div>
              </div>

          {/* 示例提示词（以气泡/按钮样式展示） */}
          <div>
            <div className="flex items-center gap-3 mb-3 flex-wrap">
              <h3 className="text-sm font-medium text-slate-700 shrink-0">{currentLanguage === 'zh' ? '示例提示词' : 'Examples'}</h3>
              <div className="flex gap-1.5">
                {examplePrompts.map((group) => (
                  <button
                    key={group.category}
                    type="button"
                    onClick={() => setActiveCategory(group.category)}
                    className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                      activeCategory === group.category
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-slate-600 border-slate-300 hover:border-blue-400 hover:text-blue-600'
                    }`}
                  >
                    {group.category}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {examplePrompts.find(g => g.category === activeCategory)?.items.map((example, index) => (
                <button
                  type="button"
                  key={index}
                  className="text-left p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors"
                  onClick={() => useExamplePrompt(example.prompt)}
                >
                  <h4 className="text-sm font-medium mb-1">{example.title}</h4>
                  <p className="text-xs text-slate-600 line-clamp-2">{example.prompt.substring(0, 100)}...</p>
                </button>
              ))}
            </div>
          </div>

          {/* 底部操作已取消取消按钮 */}
        </form>

        <section className="mt-12 pt-10 border-t border-slate-200/80">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h3 className="text-lg font-semibold text-slate-800">
              {currentLanguage === 'zh' ? '我的应用' : 'My apps'}
            </h3>
            <button
              type="button"
              onClick={() => navigate('/my-apps')}
              className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
            >
              {currentLanguage === 'zh' ? '查看全部' : 'View all'}
            </button>
          </div>

          {myAppsLoading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
            </div>
          ) : myApps.length === 0 ? (
            <p className="text-sm text-slate-600 py-6 text-center">
              {currentLanguage === 'zh' ? '暂无应用，创建后将显示在这里' : 'No apps yet. They will appear here after you create one.'}
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {myApps.map((app) => (
                <button
                  key={app.id}
                  type="button"
                  onClick={() => navigate(`/app/build/${app.id}`)}
                  className="text-left rounded-xl border border-slate-200 bg-white/90 shadow-sm overflow-hidden hover:shadow-md hover:border-blue-200 transition-all"
                >
                  <div className="h-28 bg-gradient-to-br from-blue-500 to-indigo-600 relative">
                    {app.cover ? (
                      <img
                        src={app.cover}
                        alt={app.appName}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Code className="h-10 w-10 text-white opacity-80" />
                      </div>
                    )}
                    <span className="absolute bottom-2 left-2 px-2 py-0.5 text-xs bg-white/20 text-white rounded-full backdrop-blur-sm">
                      {formatCodeGenType(app.codeGenType)}
                    </span>
                  </div>
                  <div className="p-3">
                    <div className="font-medium text-slate-800 line-clamp-1">{app.appName}</div>
                    {app.initPrompt ? (
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{app.initPrompt}</p>
                    ) : null}
                    <div className="flex items-center gap-1 mt-2 text-xs text-slate-400">
                      <Calendar className="h-3.5 w-3.5 shrink-0" />
                      <span>{formatTime(app.createTime)}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
