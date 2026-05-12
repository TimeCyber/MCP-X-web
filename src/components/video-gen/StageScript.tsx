import React, { useState, useEffect, useRef } from 'react';
import { BrainCircuit, Wand2, ChevronRight, AlertCircle, Users, MapPin, List, TextQuote, Clock, BookOpen, ArrowLeft, Aperture, Plus, Trash2, Layout, Film } from 'lucide-react';
import type { VideoGenProject, Shot, Scene, Character } from '../../types/videogen';
import { parseScriptToData, generateShotList } from '../../services/videogenService';
import { modelApi, ModelInfo, sortModelsByOrderBy } from '../../services/modelApi';

interface Props {
  project: VideoGenProject;
  updateProject: (updates: Partial<VideoGenProject> | ((prev: VideoGenProject | null) => VideoGenProject | null)) => void;
}

type TabMode = 'story' | 'script';

const DURATION_OPTIONS = [
  { label: '30秒 (广告)', value: '30s' },
  { label: '60秒 (预告)', value: '60s' },
  { label: '2分钟 (片花)', value: '120s' },
  { label: '5分钟 (短片)', value: '300s' },
  { label: '自定义', value: 'custom' }
];

const LANGUAGE_OPTIONS = [
  { label: '中文 (Chinese)', value: '中文' },
  { label: 'English (US)', value: 'English' },
  { label: '日本語 (Japanese)', value: 'Japanese' },
  { label: 'Français (French)', value: 'French' },
  { label: 'Español (Spanish)', value: 'Spanish' }
];

const VIDEO_TYPE_OPTIONS = [
  { label: '剧本创作', value: 'script', description: '基于剧本内容生成专业分镜' },
  { label: '宣传片制作', value: 'promotional', description: '商业宣传片风格的分镜设计' },
  { label: '短视频制作', value: 'shortvideo', description: '社交媒体短视频风格的分镜' }
];

const CAMERA_MOVEMENTS = [
  { label: '固定 (Static)', value: 'STATIC' },
  { label: '左摇 (Pan Left)', value: 'PAN_LEFT' },
  { label: '右摇 (Pan Right)', value: 'PAN_RIGHT' },
  { label: '上仰 (Tilt Up)', value: 'TILT_UP' },
  { label: '下俯 (Tilt Down)', value: 'TILT_DOWN' },
  { label: '推镜头 (Zoom In)', value: 'ZOOM_IN' },
  { label: '拉镜头 (Zoom Out)', value: 'ZOOM_OUT' },
  { label: '跟拍 (Tracking)', value: 'TRACKING' },
  { label: '推轨 (Dolly In)', value: 'DOLLY_IN' },
  { label: '拉轨 (Dolly Out)', value: 'DOLLY_OUT' },
];

const SHOT_SIZES = [
  { label: '特写', value: 'CLOSE_UP' },
  { label: '中景', value: 'MEDIUM_SHOT' },
  { label: '全景', value: 'WIDE_SHOT' },
  { label: '超特写', value: 'EXTREME_CLOSE_UP' },
  { label: '大远景', value: 'EXTREME_LONG_SHOT' },
];

const StageScript: React.FC<Props> = ({ project, updateProject }) => {
  const [activeTab, setActiveTab] = useState<TabMode>(project.scriptData ? 'script' : 'story');

  const [localScript, setLocalScript] = useState(project.rawScript);
  const [localTitle, setLocalTitle] = useState(project.title);
  const [localDuration, setLocalDuration] = useState(project.targetDuration || '60s');
  const [localLanguage, setLocalLanguage] = useState(project.language || '中文');
  const [localVideoType, setLocalVideoType] = useState<'script' | 'promotional' | 'shortvideo'>(project.videoType || 'script');
  const [localTextModel, setLocalTextModel] = useState(project.textModel || '');
  const [customDurationInput, setCustomDurationInput] = useState('');

  const [isProcessing, setIsProcessing] = useState(false);
  const [processingText, setProcessingText] = useState('');
  const [streamingAnalysisText, setStreamingAnalysisText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const streamScrollRef = useRef<HTMLDivElement>(null);

  // 自动滚动第一阶段输出框到最下方
  useEffect(() => {
    if (streamScrollRef.current) {
      streamScrollRef.current.scrollTop = streamScrollRef.current.scrollHeight;
    }
  }, [streamingAnalysisText]);

  // 模型列表状态
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);

  // 根据视频类型生成示例剧本
  const getDefaultScriptForVideoType = (videoType: 'script' | 'promotional' | 'shortvideo'): string => {
    if (videoType === 'promotional') {
      return `标题：高端护肤品宣传片

场景 1
内景。现代美容院- 白天
柔和的自然光线洒进宽敞明亮的房间
年轻女性：（25岁，优雅知性）坐在舒适的美容椅上

年轻女性
我想要重获年轻光彩...

场景 2
内景。实验室- 白天
科研人员在高端设备前工作
产品特写：晶莹剔透的护肤精华液

旁白
突破性科技，激活肌肤再生

场景 3
外景。海边度假村- 黄昏
年轻女性在沙滩上自信微笑
阳光洒在她的肌肤上，散发健康光泽

旁白
重拾青春活力，绽放自然美`;
    } else if (videoType === 'shortvideo') {
      return `标题：美食探店短视频

场景 1
外景。网红餐厅门口- 白天
色彩鲜艳的餐厅招牌，吸引眼球
探店博主：（20岁，活泼开朗）兴奋地推门进入

探店博主
大家好！今天给大家带来这家超火的网红餐厅！

场景 2
内景。餐厅内部- 白天
精致的餐桌布置，诱人的美食
产品特写：热气腾腾的特色美食

探店博主
看这色香味！简直完美！

场景 3
内景。餐厅- 白天
博主品尝美食的表情特写
背景音乐：欢快的流行音乐

探店博主
太好吃了！下次还来！

结尾字幕：快来尝尝吧！#美食探店 #网红餐厅`;
    } else {
      return `标题：雨夜侦探

场景 1
外景。夜晚街边- 雨夜
霓虹灯在水坑中反射出破碎的光芒
侦探：（30岁，穿着风衣）站在街角，点燃了一支烟

侦探
这雨什么时候才会停？

场景 2
内景。侦探办公室- 夜晚
昏黄的台灯照亮凌乱的桌面
侦探坐在椅子上，翻看着旧照片

侦探
（自言自语）线索就在这里...

场景 3
外景。废弃工厂- 深夜
风雨交加，雷声轰鸣
侦探小心翼翼地潜入废弃建筑

旁白
真相，往往隐藏在最黑暗的地方`;
    }
  };

  // 加载模型列表
  useEffect(() => {
    const loadModels = async () => {
      setLoadingModels(true);
      try {
        const response = await modelApi.getModelList();
        if (response.code === 200 && response.data) {
          // 只显示 category 为 "chat" 或 "deepseek" 的模型
          const chatModels = sortModelsByOrderBy(
            response.data.filter((m: ModelInfo) =>
              m.category === 'chat' || m.category === 'deepseek'
            )
          );
          setModels(chatModels);

          // 如果项目没有设置模型，使用默认模型
          if (!project.textModel && chatModels.length > 0) {
            setLocalTextModel(chatModels[0].modelName);
          }
        }
      } catch (error) {
        console.error('加载模型列表失败:', error);
      } finally {
        setLoadingModels(false);
      }
    };

    loadModels();
  }, [project.textModel]);

  useEffect(() => {
    setLocalScript(project.rawScript);
    setLocalTitle(project.title);
    setLocalDuration(project.targetDuration || '60s');
    setLocalLanguage(project.language || '中文');
    setLocalVideoType(project.videoType || 'script');
    setLocalTextModel(project.textModel || '');

    // 如果项目还没有设置 videoType，设置为默认值
    if (!project.videoType) {
      updateProject({ videoType: 'script' });
    }
  }, [project.id]);

  // 处理视频类型切换时的脚本更新
  const handleVideoTypeChange = (newVideoType: 'script' | 'promotional' | 'shortvideo') => {
    setLocalVideoType(newVideoType);
    updateProject({ videoType: newVideoType });

    // 只有当前脚本是空的或与某个默认示例完全一致时，才替换为新类型的默认脚本
    // 用精确匹配，避免误替换用户自己输入的文案
    const isUsingDefaultScript =
      localScript.trim() === '' ||
      localScript === getDefaultScriptForVideoType('script') ||
      localScript === getDefaultScriptForVideoType('promotional') ||
      localScript === getDefaultScriptForVideoType('shortvideo');

    if (isUsingDefaultScript) {
      setLocalScript(getDefaultScriptForVideoType(newVideoType));
    }
  };

  const handleDurationSelect = (val: string) => {
    setLocalDuration(val);
    if (val === 'custom') {
      setCustomDurationInput('');
    }
  };

  const getFinalDuration = () => {
    return localDuration === 'custom' ? customDurationInput : localDuration;
  };

  const handleAnalyze = async () => {
    // 如果已经在解析中，不再重复触发
    if (isProcessing) return;

    // 已有分镜时，二次确认是否重新生成
    if (project.shots && project.shots.length > 0) {
      if (!confirm('已有生成的分镜，重新生成将覆盖现有内容，确定继续吗？')) return;
    }
    
    if (!localScript.trim()) {
      setError("请输入剧本内容。");
      return;
    }

    const finalDuration = getFinalDuration();
    if (!finalDuration) {
      setError("请选择目标时长。");
      return;
    }

    setIsProcessing(true);
    setStreamingAnalysisText("");
    setError(null);
    try {
      updateProject({
        title: localTitle,
        rawScript: localScript,
        targetDuration: finalDuration,
        language: localLanguage,
        videoType: localVideoType,
        textModel: localTextModel,
        isParsingScript: true
      });

      const scriptData = await parseScriptToData(
        localScript, 
        localLanguage, 
        localTextModel,
        (fullText) => {
          // 实时更新分析中的文本流
          setStreamingAnalysisText(fullText);
        }
      );

      scriptData.targetDuration = finalDuration;
      scriptData.language = localLanguage;

      if (localTitle && localTitle !== "未命名项目") {
        scriptData.title = localTitle;
      }

      // 1. 剧本结构分析完成后，立即切换到分镜展示界面，并展示初步结构
      updateProject({
        scriptData,
        shots: [], // 初始为空，后续通过流式更新填充
        title: scriptData.title
      });
      setActiveTab('script');

      // 2. 开始流式生成分镜列表
      const finalShots = await generateShotList(
        scriptData, 
        localTextModel, 
        localVideoType,
        (updatedShots) => {
          // 每次有新的分镜生成时，实时更新项目状态
          updateProject({ shots: updatedShots });
        }
      );

      // 3. 生成完成后，最后更新一次完整数据，并关闭加载状态
      updateProject({
        shots: finalShots,
        isParsingScript: false
      });

    } catch (err: any) {
      console.error(err);
      setError(`错误: ${err.message || "AI 连接失败"}`);
      updateProject({ isParsingScript: false });
    } finally {
      setIsProcessing(false);
    }
  };

  // 手动模式 / 编辑功能
  const handleEnterManualMode = () => {
    const initialSceneId = crypto.randomUUID();
    const initialScene: Scene = {
      id: initialSceneId,
      location: '新场景',
      time: '白天',
      atmosphere: '自然',
    };

    const initialShot: Shot = {
      id: crypto.randomUUID(),
      sceneId: initialSceneId,
      actionSummary: '',
      cameraMovement: 'STATIC',
      shotSize: 'MED',
      characters: [],
      keyframes: [{
        id: crypto.randomUUID(),
        type: 'start',
        visualPrompt: '',
        status: 'pending'
      }]
    };

    updateProject({
      scriptData: {
        title: localTitle || '未命名项目',
        genre: '通用',
        logline: '',
        characters: [],
        scenes: [initialScene],
        storyParagraphs: []
      },
      shots: [initialShot],
      videoType: localVideoType,
      targetDuration: getFinalDuration() || '60s'
    });
    setActiveTab('script');
  };

  const handleAddScene = () => {
    if (!project.scriptData) return;

    const newSceneId = crypto.randomUUID();
    const newScene: Scene = {
      id: newSceneId,
      location: '新场景',
      time: '白天',
      atmosphere: '自然',
    };

    updateProject({
      scriptData: {
        ...project.scriptData,
        scenes: [...project.scriptData.scenes, newScene]
      }
    });

    // 自动添加一个分镜
    handleAddShot(newSceneId);
  };

  const handleDeleteScene = (sceneId: string) => {
    if (!project.scriptData) return;

    if (!confirm('确定要删除这个场景及其所有分镜吗？')) return;

    // 过滤掉场景
    const newScenes = project.scriptData.scenes.filter(s => s.id !== sceneId);
    // 过滤掉该场景的分镜
    const newShots = project.shots.filter(s => s.sceneId !== sceneId);

    updateProject({
      scriptData: {
        ...project.scriptData,
        scenes: newScenes
      },
      shots: newShots
    });
  };

  const handleAddShot = (sceneId: string) => {
    const newShot: Shot = {
      id: crypto.randomUUID(),
      sceneId: sceneId,
      actionSummary: '',
      cameraMovement: 'STATIC',
      shotSize: 'MED',
      characters: [],
      keyframes: [{
        id: crypto.randomUUID(),
        type: 'start',
        visualPrompt: '',
        status: 'pending'
      }]
    };

    updateProject((prev: VideoGenProject | null) => {
      if (!prev) return null;
      const newShots = [...prev.shots];

      // 智能插入位置：找到该场景的最后一个分镜，插入到后面
      let insertIndex = newShots.length;

      // 1. 尝试找到本场景最后一张
      const sceneShotIndices = newShots
        .map((s, i) => s.sceneId === sceneId ? i : -1)
        .filter(i => i !== -1);

      if (sceneShotIndices.length > 0) {
        insertIndex = sceneShotIndices[sceneShotIndices.length - 1] + 1;
      } else {
        // 2. 如果本场景没分镜，尝试找到下一个场景的第一个分镜前
        const currentSceneIndex = prev.scriptData?.scenes.findIndex(s => s.id === sceneId) ?? -1;
        if (currentSceneIndex !== -1 && prev.scriptData?.scenes) {
          for (let i = currentSceneIndex + 1; i < prev.scriptData.scenes.length; i++) {
            const nextSceneId = prev.scriptData.scenes[i].id;
            const nextSceneFirstShotIndex = newShots.findIndex(s => s.sceneId === nextSceneId);
            if (nextSceneFirstShotIndex !== -1) {
              insertIndex = nextSceneFirstShotIndex;
              break;
            }
          }
        }
      }

      newShots.splice(insertIndex, 0, newShot);
      return { ...prev, shots: newShots };
    });
  };

  const handleDeleteShot = (shotId: string) => {
    if (!confirm('确定删除此分镜？')) return;
    const newShots = project.shots.filter(s => s.id !== shotId);
    updateProject({ shots: newShots });
  };

  const renderStoryInput = () => (
    <div className="flex h-full bg-[#050505] text-zinc-300">

      {/* Middle Column: Config Panel - Adjusted Width to w-96 */}
      <div className="w-96 border-r border-zinc-800 flex flex-col bg-[#0A0A0A]">
        {/* Header - Fixed Height 56px */}
        <div className="h-14 px-5 border-b border-zinc-800 flex items-center justify-between shrink-0">
          <h2 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-zinc-400" />
            项目配置
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* Title Input */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">项目标题</label>
            <input
              type="text"
              value={localTitle}
              onChange={(e) => setLocalTitle(e.target.value)}
              onBlur={() => {
                if (localTitle !== project.title) updateProject({ title: localTitle });
              }}
              className="w-full bg-[#141414] border border-zinc-800 text-white px-3 py-2.5 text-sm rounded-md focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-700 transition-all placeholder:text-zinc-700"
              placeholder="输入项目名称..."
            />
          </div>

          {/* Language Selection */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
              输出语言
            </label>
            <div className="relative">
              <select
                value={localLanguage}
                onChange={(e) => {
                  setLocalLanguage(e.target.value);
                  updateProject({ language: e.target.value });
                }}
                className="w-full bg-[#141414] border border-zinc-800 text-white px-3 py-2.5 text-sm rounded-md appearance-none focus:border-zinc-600 focus:outline-none transition-all cursor-pointer"
              >
                {LANGUAGE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <div className="absolute right-3 top-3 pointer-events-none">
                <ChevronRight className="w-4 h-4 text-zinc-600 rotate-90" />
              </div>
            </div>
          </div>

          {/* Video Type Selection */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
              视频类型
            </label>
            <div className="space-y-2">
              {VIDEO_TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleVideoTypeChange(opt.value as 'script' | 'promotional' | 'shortvideo')}
                  className={`w-full text-left px-3 py-2.5 text-sm rounded-md transition-all border ${localVideoType === opt.value
                    ? 'bg-zinc-100 text-black border-zinc-100 shadow-sm'
                    : 'bg-transparent border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200'
                    }`}
                >
                  <div className="font-medium">{opt.label}</div>
                  <div className="text-[10px] text-zinc-500 mt-0.5">{opt.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Text Model Selection */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
              <BrainCircuit className="w-3 h-3" />
              文字大模型
            </label>
            <div className="relative">
              <select
                value={localTextModel}
                onChange={(e) => {
                  setLocalTextModel(e.target.value);
                  updateProject({ textModel: e.target.value });
                }}
                disabled={loadingModels}
                className="w-full bg-[#141414] border border-zinc-800 text-white px-3 py-2.5 text-sm rounded-md appearance-none focus:border-zinc-600 focus:outline-none transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingModels ? (
                  <option value="">加载模型中...</option>
                ) : models.length === 0 ? (
                  <option value="">暂无可用模型</option>
                ) : (
                  <>
                    <option value="">选择模型</option>
                    {models.map((model) => {
                      // 组合显示：modelDescribe - remark
                      const describe = model.modelDescribe || model.modelName;
                      const remark = model.remark ? ` - ${model.remark}` : '';
                      return (
                        <option key={model.id} value={model.modelName} title={model.remark}>
                          {describe}{remark}
                        </option>
                      );
                    })}
                  </>
                )}
              </select>
              <div className="absolute right-3 top-3 pointer-events-none">
                <ChevronRight className="w-4 h-4 text-zinc-600 rotate-90" />
              </div>
            </div>
            {localTextModel && (
              <p className="text-[9px] text-zinc-600 mt-1 flex items-center gap-1">
                <span className="w-1 h-1 bg-green-500 rounded-full"></span>
                已选择: {models.find(m => m.modelName === localTextModel)?.modelDescribe || localTextModel}
              </p>
            )}
          </div>

          {/* Duration Selection */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
              目标时长
            </label>
            <div className="grid grid-cols-2 gap-2">
              {DURATION_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleDurationSelect(opt.value)}
                  className={`px-2 py-2.5 text-[11px] font-medium rounded-md transition-all text-center border ${localDuration === opt.value
                    ? 'bg-zinc-100 text-black border-zinc-100 shadow-sm'
                    : 'bg-transparent border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200'
                    }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {localDuration === 'custom' && (
              <div className="pt-1">
                <input
                  type="text"
                  value={customDurationInput}
                  onChange={(e) => setCustomDurationInput(e.target.value)}
                  onBlur={() => {
                    updateProject({ targetDuration: customDurationInput });
                  }}
                  className="w-full bg-[#141414] border border-zinc-800 text-white px-3 py-2.5 text-sm rounded-md focus:border-zinc-600 focus:outline-none font-mono placeholder:text-zinc-700"
                  placeholder="输入时长 (如: 90s, 3m)"
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer Action */}
        <div className="p-6 border-t border-zinc-800 bg-[#0A0A0A]">
          <button
            onClick={handleAnalyze}
            disabled={isProcessing}
            className={`w-full py-3.5 font-bold text-xs tracking-widest uppercase rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg ${isProcessing
              ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
              : 'bg-white text-black hover:bg-zinc-200 shadow-white/5'
              }`}
          >
            {isProcessing ? (
              <>
                <BrainCircuit className="w-4 h-4 animate-spin" />
                智能分析中...
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" />
                生成分镜脚本
              </>
            )}
          </button>

          <button
            onClick={() => {
              if (project.shots && project.shots.length > 0) {
                if (!confirm('进入手动编辑模式将清空已生成的分镜，确定继续吗？')) return;
              }
              handleEnterManualMode();
            }}
            disabled={isProcessing}
            className={`w-full mt-3 py-2.5 font-bold text-[10px] tracking-widest uppercase rounded-lg flex items-center justify-center gap-2 transition-all bg-transparent border ${isProcessing ? 'border-zinc-800 text-zinc-700 cursor-not-allowed opacity-50' : 'border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-600 hover:bg-zinc-900'}`}
          >
            <Layout className="w-3 h-3" />
            手动编辑模式 (空白)
          </button>

          {/* 已有分镜时显示「查看分镜」快捷入口 */}
          {project.shots && project.shots.length > 0 && (
            <button
              onClick={() => setActiveTab('script')}
              disabled={isProcessing}
              className={`w-full mt-3 py-2.5 font-bold text-[10px] tracking-widest uppercase rounded-lg flex items-center justify-center gap-2 transition-all ${isProcessing ? 'bg-indigo-500/5 border border-indigo-500/10 text-indigo-700 cursor-not-allowed opacity-50' : 'bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/20 hover:border-indigo-500/50 hover:text-indigo-300'}`}
            >
              <List className="w-3 h-3" />
              查看已生成分镜 ({project.shots.length} 个)
            </button>
          )}

          {error && (
            <div className="mt-4 p-3 bg-red-900/10 border border-red-900/50 text-red-500 text-xs rounded flex items-center gap-2">
              <AlertCircle className="w-3 h-3 flex-shrink-0" />
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Right: Text Editor - Optimized */}
      <div className="flex-1 flex flex-col bg-[#050505] relative">
        <div className="h-14 border-b border-zinc-800 flex items-center justify-between px-8 bg-[#050505] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-zinc-700"></div>
            <span className="text-xs font-bold text-zinc-400">剧本编辑器</span>
          </div>
          <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">MARKDOWN SUPPORTED</span>
        </div>

        <div className="flex-1 overflow-y-auto relative">
          <div className="max-w-3xl mx-auto h-full flex flex-col py-12 px-8">
            <textarea
              value={localScript}
              onChange={(e) => setLocalScript(e.target.value)}
              onBlur={() => {
                if (localScript !== project.rawScript) {
                  updateProject({ rawScript: localScript });
                }
              }}
              className={`flex-1 bg-transparent text-zinc-200 font-serif text-lg leading-loose focus:outline-none resize-none placeholder:text-zinc-800 selection:bg-zinc-700 transition-opacity duration-500 ${isProcessing ? 'opacity-30' : 'opacity-100'}`}
              placeholder="在此输入故事大纲或直接粘贴剧本..."
              spellCheck={false}
              readOnly={isProcessing}
            />
          </div>

          {/* AI 分析中的显著标识 */}
          {isProcessing && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[4px] z-20 animate-in fade-in duration-500 overflow-hidden">
               <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-8 shadow-2xl flex flex-col items-center gap-6 max-w-2xl w-full mx-4 border-indigo-500/20 shadow-indigo-500/10">
                  <div className="w-full flex items-center gap-6">
                    {/* 赛博编剧人物形象 */}
                    <div className="relative shrink-0">
                      <div className="w-24 h-24 bg-gradient-to-br from-indigo-600/20 to-purple-600/20 rounded-2xl flex items-center justify-center border border-indigo-500/30 overflow-hidden shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=2070&auto=format&fit=crop')] bg-cover opacity-10 mix-blend-overlay"></div>
                        <BrainCircuit className="w-12 h-12 text-indigo-400 animate-pulse relative z-10" />
                        
                        {/* 扫描线效果 */}
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-500/10 to-transparent h-1/2 w-full animate-[scan_2s_linear_infinite] pointer-events-none"></div>
                      </div>
                      <div className="absolute -bottom-2 -right-2 px-2 py-0.5 bg-indigo-500 text-[10px] font-bold text-white rounded shadow-lg uppercase tracking-tighter">
                        Script Agent
                      </div>
                    </div>

                    <div className="flex-1 space-y-4">
                      <div className="space-y-1">
                        <h3 className="text-white font-bold tracking-widest uppercase text-base flex items-center gap-2">
                          <span className="w-2 h-2 bg-green-500 rounded-full animate-ping"></span>
                          赛博编剧正在构建故事世界
                        </h3>
                        <p className="text-zinc-500 text-xs">
                          大模型正在深度解析剧本结构、角色性格与视觉布局...
                        </p>
                      </div>

                      {/* 实时文本输出预览 */}
                      <div 
                        ref={streamScrollRef}
                        className="bg-black/50 border border-zinc-800 rounded-lg p-4 h-32 overflow-y-auto relative scroll-smooth no-scrollbar"
                      >
                         <div className="text-[11px] font-mono text-indigo-300/80 leading-relaxed whitespace-pre-wrap">
                           {streamingAnalysisText || "正在初始化神经元网络..."}
                           <span className="inline-block w-1.5 h-3 bg-indigo-500 animate-pulse ml-1 align-middle"></span>
                         </div>
                      </div>
                    </div>
                  </div>

                  <div className="w-full flex items-center gap-4">
                    <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
                       <div className="h-full bg-indigo-500 animate-[loading_20s_ease-in-out_infinite]" style={{ width: '60%' }}></div>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"></div>
                      <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                      <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                    </div>
                  </div>
               </div>

               {/* 背景装饰 - 赛博风格 */}
               <style>{`
                 @keyframes scan {
                   from { transform: translateY(-100%); }
                   to { transform: translateY(200%); }
                 }
                 @keyframes loading {
                   0% { width: 5%; }
                   50% { width: 85%; }
                   100% { width: 95%; }
                 }
               `}</style>
            </div>
          )}
        </div>

        {/* Editor Status Footer */}
        <div className="h-8 border-t border-zinc-900 bg-[#050505] px-4 flex items-center justify-end gap-4 text-[10px] text-zinc-600 font-mono select-none">
          <span>{localScript.length} 字符</span>
          <span>{localScript.split('\n').length} 行</span>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-zinc-800"></div>
            {project.lastModified ? '已自动保存' : '准备就绪'}
          </div>
        </div>
      </div>
    </div>
  );

  const renderScriptBreakdown = () => {
    // Deduplication Logic
    const seenLocations = new Set();
    const uniqueScenesList = (project.scriptData?.scenes || []).filter(scene => {
      const normalizedLoc = scene.location.trim().toLowerCase();
      if (seenLocations.has(normalizedLoc)) {
        return false;
      }
      seenLocations.add(normalizedLoc);
      return true;
    });

    return (
      <div className="flex flex-col h-full bg-[#050505] animate-in fade-in duration-500">
        {/* Header */}
        <div className="h-16 px-6 border-b border-zinc-800 bg-[#080808] flex items-center justify-between shrink-0 z-20">
          <div className="flex items-center gap-6">
            <h2 className="text-lg font-light text-white tracking-tight flex items-center gap-3">
              <List className="w-5 h-5 text-zinc-400" />
              拍摄清单
              <span className="text-xs text-zinc-600 font-mono uppercase tracking-wider ml-1">Script Manifest</span>
            </h2>
            <div className="h-6 w-px bg-zinc-800"></div>

            <div className="flex items-center gap-4">
              <div className="flex flex-col">
                <span className="text-[10px] text-zinc-600 uppercase tracking-widest">项目</span>
                <input
                  type="text"
                  value={project.scriptData?.title || ''}
                  onChange={(e) => {
                    const newTitle = e.target.value;
                    updateProject({
                      title: newTitle,
                      scriptData: { ...project.scriptData!, title: newTitle }
                    });
                    setLocalTitle(newTitle);
                  }}
                  className="text-sm text-zinc-200 font-medium bg-transparent border-b border-transparent hover:border-zinc-700 focus:border-zinc-500 focus:outline-none transition-all w-32"
                  placeholder="项目名称"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-zinc-600 uppercase tracking-widest">时长</span>
                <span className="text-sm font-mono text-zinc-400">{project.targetDuration}</span>
              </div>
              {project.isParsingScript && (
                <div className="flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full animate-pulse">
                  <BrainCircuit className="w-3 h-3 text-indigo-400 animate-spin" />
                  <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">分镜生成中...</span>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => {
              // 切回编辑时，确保显示的是已保存的原始文案
              setLocalScript(project.rawScript || localScript);
              setActiveTab('story');
            }}
            className="text-xs font-bold text-zinc-400 hover:text-white flex items-center gap-2 px-4 py-2 hover:bg-zinc-800 rounded-lg transition-all"
          >
            <ArrowLeft className="w-3 h-3" />
            返回编辑
          </button>
        </div>

        {/* Content Split View */}
        <div className="flex-1 overflow-hidden flex">

          {/* Sidebar: Index */}
          <div className="w-72 border-r border-zinc-800 bg-[#0A0A0A] flex flex-col hidden lg:flex">
            <div className="p-6 border-b border-zinc-900 group/logline">
              <h3 className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                <TextQuote className="w-3 h-3" /> 故事梗概
              </h3>
              <textarea
                value={project.scriptData?.logline || ''}
                onChange={(e) => {
                  updateProject({
                    scriptData: { ...project.scriptData!, logline: e.target.value }
                  });
                }}
                className="w-full bg-transparent text-xs text-zinc-400 italic leading-relaxed font-serif resize-none border border-transparent rounded p-1 -ml-1 hover:border-zinc-800 focus:border-zinc-700 focus:bg-zinc-900/50 focus:outline-none focus:text-zinc-300 transition-all"
                rows={4}
                placeholder="在此输入故事梗概..."
              />
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* Characters */}
              <section>
                <div className="flex items-center justify-between mb-4 pr-2">
                  <h3 className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest flex items-center gap-2">
                    <Users className="w-3 h-3" /> 演员表
                  </h3>
                  <button
                    onClick={() => {
                      const newChar: Character = {
                        id: crypto.randomUUID(),
                        name: '新角色',
                        gender: '男',
                        age: '未知',
                        personality: '未知',
                        variations: []
                      };
                      updateProject({
                        scriptData: {
                          ...project.scriptData!,
                          characters: [...(project.scriptData?.characters || []), newChar]
                        }
                      });
                    }}
                    className="text-zinc-600 hover:text-zinc-300 transition-colors p-1 hover:bg-zinc-800 rounded"
                    title="添加角色"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                <div className="space-y-2">
                  {project.scriptData?.characters.map((c, idx) => (
                    <div key={c.id} className="group relative flex items-center gap-2 p-2 rounded hover:bg-zinc-900/50 transition-colors">
                      <input
                        value={c.name}
                        onChange={(e) => {
                          const newChars = [...(project.scriptData?.characters || [])];
                          newChars[idx] = { ...newChars[idx], name: e.target.value };
                          updateProject({
                            scriptData: { ...project.scriptData!, characters: newChars }
                          });
                        }}
                        className="flex-1 bg-transparent text-sm text-zinc-300 font-medium focus:text-white border-b border-transparent focus:border-zinc-700 focus:outline-none min-w-0 placeholder:text-zinc-700"
                        placeholder="角色名"
                      />
                      <input
                        value={c.gender}
                        onChange={(e) => {
                          const newChars = [...(project.scriptData?.characters || [])];
                          newChars[idx] = { ...newChars[idx], gender: e.target.value };
                          updateProject({
                            scriptData: { ...project.scriptData!, characters: newChars }
                          });
                        }}
                        className="w-8 text-right bg-transparent text-[10px] text-zinc-600 font-mono focus:text-zinc-400 border-b border-transparent focus:border-zinc-700 focus:outline-none placeholder:text-zinc-700"
                        placeholder="性别"
                      />
                      <button
                        onClick={() => {
                          const newChars = project.scriptData?.characters.filter(char => char.id !== c.id) || [];
                          updateProject({
                            scriptData: { ...project.scriptData!, characters: newChars }
                          });
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-zinc-600 hover:text-red-500 transition-all"
                        title="删除角色"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {(!project.scriptData?.characters || project.scriptData?.characters.length === 0) && (
                    <div className="text-xs text-zinc-700 text-center py-4 italic">暂无角色</div>
                  )}
                </div>
              </section>

              {/* Scenes */}
              <section>
                <h3 className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <MapPin className="w-3 h-3" /> 场景列表
                </h3>
                <div className="space-y-1">
                  {uniqueScenesList.map((s) => (
                    <div key={s!.id} className="flex items-center gap-3 text-xs text-zinc-400 group cursor-default p-2 rounded hover:bg-zinc-900/50 transition-colors">
                      <div className="w-1.5 h-1.5 bg-zinc-700 rounded-full group-hover:bg-zinc-400 transition-colors"></div>
                      <span className="truncate group-hover:text-zinc-200">{s!.location}</span>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>

          {/* Main: Script & Shots */}
          <div className="flex-1 overflow-y-auto bg-[#050505] p-0">
            <div className="max-w-5xl mx-auto pb-20">
              {project.scriptData?.scenes.map((scene, index) => {
                const sceneShots = project.shots.filter(s => String(s.sceneId) === String(scene.id));

                return (
                  <div key={scene.id} className="border-b border-zinc-800 group/scene">
                    {/* Scene Header strip */}
                    <div className="sticky top-0 z-10 bg-[#080808]/95 backdrop-blur border-y border-zinc-800 px-8 py-5 flex items-center justify-between shadow-lg shadow-black/20">
                      <div className="flex items-baseline gap-4">
                        <span className="text-3xl font-bold text-white/10 font-mono">{(index + 1).toString().padStart(2, '0')}</span>
                        <div className="flex flex-col">
                          <input
                            value={scene.location}
                            onChange={(e) => {
                              const newScenes = project.scriptData?.scenes.map(s => s.id === scene.id ? { ...s, location: e.target.value } : s) || [];
                              updateProject({ scriptData: { ...project.scriptData!, scenes: newScenes } });
                            }}
                            className="bg-transparent border-b border-transparent hover:border-zinc-700 focus:border-zinc-500 text-lg font-bold text-white uppercase tracking-wider focus:outline-none transition-all px-1 min-w-[120px]"
                            placeholder="场景地点"
                          />
                          {project.isParsingScript && sceneShots.length === 0 && (
                            <span className="text-[10px] text-indigo-500 animate-pulse mt-1 font-mono uppercase tracking-widest pl-1">
                              等待生成中...
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 ml-2 opacity-0 group-hover/scene:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleDeleteScene(scene.id)}
                            className="p-1.5 hover:bg-red-900/30 text-zinc-600 hover:text-red-500 rounded transition-colors"
                            title="删除场景"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-[10px] font-mono uppercase tracking-widest text-zinc-500">
                        <div className="flex items-center gap-1.5 group/time">
                          <Clock className="w-3 h-3" />
                          <input
                            value={scene.time}
                            onChange={(e) => {
                              const newScenes = project.scriptData?.scenes.map(s => s.id === scene.id ? { ...s, time: e.target.value } : s) || [];
                              updateProject({ scriptData: { ...project.scriptData!, scenes: newScenes } });
                            }}
                            className="bg-transparent border-b border-transparent hover:border-zinc-700 focus:border-zinc-500 text-zinc-500 focus:text-zinc-300 focus:outline-none w-20 transition-all text-center"
                            placeholder="时间"
                          />
                        </div>
                        <span className="text-zinc-700">|</span>
                        <div className="group/atmos">
                          <input
                            value={scene.atmosphere}
                            onChange={(e) => {
                              const newScenes = project.scriptData?.scenes.map(s => s.id === scene.id ? { ...s, atmosphere: e.target.value } : s) || [];
                              updateProject({ scriptData: { ...project.scriptData!, scenes: newScenes } });
                            }}
                            className="bg-transparent border-b border-transparent hover:border-zinc-700 focus:border-zinc-500 text-zinc-500 focus:text-zinc-300 focus:outline-none w-32 transition-all text-center"
                            placeholder="视觉布局"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Shot Rows */}
                    <div className="divide-y divide-zinc-800/50">
                      {sceneShots.map((shot) => (
                        <div key={shot.id} className={`group bg-[#050505] hover:bg-[#0A0A0A] transition-colors p-8 flex gap-8 relative ${shot.id.includes('temp') ? 'animate-in fade-in duration-500' : ''}`}>
                          {shot.id.includes('temp') && (
                            <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500/30 animate-pulse"></div>
                          )}
                          {/* Shot ID & Tech Data */}
                          <div className="w-32 flex-shrink-0 flex flex-col gap-4">
                            <div className="text-xs font-mono text-zinc-500 group-hover:text-white transition-colors flex items-center gap-2">
                              SHOT {(project.shots.indexOf(shot) + 1).toString().padStart(3, '0')}
                              {shot.id.includes('temp') && <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-ping"></div>}
                            </div>

                            <button
                              onClick={() => handleDeleteShot(shot.id)}
                              className="absolute top-2 left-2 p-1.5 opacity-0 group-hover:opacity-100 bg-black/50 hover:bg-red-900/50 text-zinc-500 hover:text-red-400 rounded transition-all backdrop-blur-sm"
                              title="删除分镜"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>

                            <div className="flex flex-col gap-2">
                              <div className="relative group/shotsize">
                                <select
                                  value={shot.shotSize || 'MEDIUM_SHOT'}
                                  onChange={(e) => {
                                    const newShots = project.shots.map(s => s.id === shot.id ? { ...s, shotSize: e.target.value } : s);
                                    updateProject({ shots: newShots });
                                  }}
                                  className="w-full px-2 py-1 bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-zinc-400 uppercase text-center rounded appearance-none hover:bg-zinc-800 cursor-pointer focus:outline-none focus:border-zinc-600"
                                >
                                  {SHOT_SIZES.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                  ))}
                                </select>
                              </div>

                              <div className="relative group/move">
                                <select
                                  value={shot.cameraMovement || 'STATIC'}
                                  onChange={(e) => {
                                    const newShots = project.shots.map(s => s.id === shot.id ? { ...s, cameraMovement: e.target.value } : s);
                                    updateProject({ shots: newShots });
                                  }}
                                  className="w-full px-2 py-1 bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-zinc-400 uppercase text-center rounded appearance-none hover:bg-zinc-800 cursor-pointer focus:outline-none focus:border-zinc-600"
                                >
                                  {CAMERA_MOVEMENTS.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label.split('(')[0]}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          </div>

                          {/* Main Action */}
                          <div className="flex-1 space-y-4">
                            <div className="relative">
                              <textarea
                                value={shot.actionSummary}
                                onChange={(e) => {
                                  const newShots = project.shots.map(s =>
                                    s.id === shot.id ? { ...s, actionSummary: e.target.value } : s
                                  );
                                  updateProject({ shots: newShots });
                                }}
                                className="w-full bg-transparent text-zinc-200 text-sm leading-7 font-medium max-w-2xl resize-none focus:outline-none focus:bg-zinc-900/50 p-2 -ml-2 rounded transition-colors"
                                rows={3}
                                placeholder={shot.id.includes('temp') ? "正在构思动作..." : "输入分镜内容..."}
                              />
                              {shot.id.includes('temp') && !shot.actionSummary && (
                                <div className="absolute inset-0 flex items-center gap-2 pointer-events-none opacity-50 pl-2">
                                  <div className="flex gap-1">
                                    <div className="w-1 h-1 bg-zinc-400 rounded-full animate-bounce"></div>
                                    <div className="w-1 h-1 bg-zinc-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                                    <div className="w-1 h-1 bg-zinc-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                                  </div>
                                </div>
                              )}
                            </div>

                            {shot.dialogue && (
                              <div className="pl-6 border-l-2 border-zinc-800 group-hover:border-zinc-600 transition-colors py-1">
                                <p className="text-zinc-400 font-serif italic text-sm">"{shot.dialogue}"</p>
                              </div>
                            )}

                            {/* Tags/Characters */}
                            <div className="flex flex-wrap gap-2 pt-2 opacity-50 group-hover:opacity-100 transition-opacity items-center">
                              {shot.characters && shot.characters.map((cid) => {
                                const char = project.scriptData?.characters.find((c) => c.id === cid);
                                return char ? (
                                  <span
                                    key={cid}
                                    className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider text-zinc-500 border border-zinc-800 px-2 py-0.5 rounded-full bg-zinc-900 group/tag hover:border-zinc-600 transition-colors cursor-default"
                                  >
                                    {char.name}
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const newShots = project.shots.map((s) =>
                                          s.id === shot.id
                                            ? { ...s, characters: s.characters.filter((id) => id !== cid) }
                                            : s
                                        );
                                        updateProject({ shots: newShots });
                                      }}
                                      className="hover:text-red-400 group-hover/tag:text-zinc-400 transition-colors"
                                    >
                                      &times;
                                    </button>
                                  </span>
                                ) : null;
                              })}

                              {/* Add Character Dropdown */}
                              {!shot.id.includes('temp') && (project.scriptData?.characters.filter((c) => !shot.characters.includes(c.id))
                                .length || 0) > 0 && (
                                  <div className="relative group/add">
                                    <Plus className="w-3 h-3 text-zinc-600 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none group-hover/add:text-zinc-400" />
                                    <select
                                      value=""
                                      onChange={(e) => {
                                        if (!e.target.value) return;
                                        const newShots = project.shots.map((s) =>
                                          s.id === shot.id
                                            ? { ...s, characters: [...s.characters, e.target.value] }
                                            : s
                                        );
                                        updateProject({ shots: newShots });
                                      }}
                                      className="pl-6 pr-4 py-0.5 bg-transparent border border-dashed border-zinc-800 hover:border-zinc-600 hover:bg-zinc-900 text-[10px] text-zinc-600 hover:text-zinc-300 rounded-full focus:outline-none focus:border-zinc-500 appearance-none cursor-pointer transition-all w-24"
                                    >
                                      <option value="">添加角色</option>
                                      {project.scriptData?.characters
                                        .filter((c) => !shot.characters.includes(c.id))
                                        .map((c) => (
                                          <option key={c.id} value={c.id}>
                                            {c.name}
                                          </option>
                                        ))}
                                    </select>
                                  </div>
                                )}
                            </div>
                          </div>

                          {/* Prompt Preview */}
                          <div className="w-64 hidden xl:block pl-6 border-l border-zinc-900">
                            <div className="text-[10px] font-bold text-zinc-700 uppercase tracking-widest mb-2 flex items-center gap-2">
                              <Aperture className="w-3 h-3" /> 画面提示词 (AI Prompt)
                            </div>
                            <textarea
                              value={shot.keyframes && shot.keyframes[0]?.visualPrompt || ''}
                              onChange={(e) => {
                                const newShots = project.shots.map(s => {
                                  if (s.id === shot.id) {
                                    const newKeyframes = [...(s.keyframes || [])];
                                    if (newKeyframes.length > 0) {
                                      newKeyframes[0] = { ...newKeyframes[0], visualPrompt: e.target.value };
                                    } else {
                                      newKeyframes.push({
                                        id: `kf-${s.id}-start-${Date.now()}`,
                                        type: 'start',
                                        visualPrompt: e.target.value,
                                        status: 'pending'
                                      });
                                    }
                                    return { ...s, keyframes: newKeyframes };
                                  }
                                  return s;
                                });
                                updateProject({ shots: newShots });
                              }}
                              className="w-full h-32 bg-zinc-900/30 text-[10px] text-zinc-400 font-mono leading-relaxed p-2 rounded focus:outline-none focus:bg-zinc-900/80 focus:text-zinc-200 transition-all resize-none"
                              placeholder={shot.id.includes('temp') ? "正在生成提示词..." : "输入画面提示词..."}
                            />
                          </div>

                        </div>
                      ))}

                      {/* Shot Add Button */}
                      {!project.isParsingScript && (
                        <div className="p-4 bg-[#050505] flex justify-center border-t border-zinc-800/30">
                          <button
                            onClick={() => handleAddShot(scene.id)}
                            className="flex items-center gap-2 px-4 py-2 bg-zinc-900/50 hover:bg-zinc-900 text-zinc-500 hover:text-zinc-300 rounded border border-zinc-800 hover:border-zinc-700 transition-all text-xs uppercase tracking-wider font-bold"
                          >
                            <Plus className="w-3 h-3" />
                            添加分镜
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Scene Add Button */}
              <div className="pt-8 pb-32">
                <button
                  onClick={handleAddScene}
                  className="w-full py-6 border-2 border-dashed border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/20 text-zinc-600 hover:text-zinc-400 rounded-xl flex flex-col items-center justify-center gap-2 transition-all group"
                >
                  <Film className="w-6 h-6 text-zinc-700 group-hover:text-zinc-500" />
                  <span className="text-xs font-bold uppercase tracking-widest">添加新场景</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full bg-[#050505]">
      {activeTab === 'story' ? renderStoryInput() : renderScriptBreakdown()}
    </div>
  );
};

export default StageScript;