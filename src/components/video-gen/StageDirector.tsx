import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Loader2, Video, Image as ImageIcon, LayoutGrid, Sparkles, AlertCircle, MapPin, Clock, ChevronLeft, ChevronRight, MessageSquare, X, Film, Aperture, Maximize2, Trash2, Upload, Database, FolderOpen, Check, Edit2, Volume2, Plus, UserPlus, UserMinus, RefreshCw } from 'lucide-react';
import type { VideoGenProject, Shot, Keyframe } from '../../types/videogen';
import { generateImage, generateVideo, addAssetToLibrary, getAssetsFromLibrary, deleteAssetFromLibrary, AssetLibraryItem, uploadFileToOss } from '../../services/videogenService';
import { modelApi, ModelInfo } from '../../services/modelApi';
import { chatApi } from '../../services/chatApi';

interface Props {
  project: VideoGenProject;
  updateProject: (updates: Partial<VideoGenProject> | ((prev: VideoGenProject | null) => VideoGenProject | null)) => void;
  savingProject?: boolean;
}

const StageDirector: React.FC<Props> = ({ project, updateProject, savingProject = false }) => {
  const [activeShotId, setActiveShotId] = useState<string | null>(null);
  const [processingState, setProcessingState] = useState<{id: string, type: 'kf_start'|'kf_end'|'video'}|null>(null);
  const batchProgress = project.batchProgress || null;
  const setBatchProgress = (progress: {current: number, total: number, message: string} | null) => {
    updateProject({ batchProgress: progress });
  };
  const isBatchStopping = project.isBatchStopping || false;
  const setIsBatchStopping = (stopping: boolean) => {
    updateProject({ isBatchStopping: stopping });
  };
  const stopBatchRef = useRef(false);

  // 同步项目中的进度状态到 stopBatchRef
  useEffect(() => {
    if (!project.batchProgress) {
      stopBatchRef.current = false;
    }
  }, [project.batchProgress]);
  const [videoProgress, setVideoProgress] = useState<{message: string, current?: number, total?: number} | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null); // 图片预览
  
  // 图片编辑器状态
  const [editingImage, setEditingImage] = useState<{
    shotId: string;
    type: 'start' | 'end';
    imageUrl: string;
    imageBase64?: string; // 添加 base64 版本
    prompt: string;
    originalWidth?: number;
    originalHeight?: number;
  } | null>(null);
  const [editorPrompt, setEditorPrompt] = useState('');
  const [editorCameraAngle, setEditorCameraAngle] = useState<'wide' | 'medium' | 'close' | 'extreme-close'>('medium');
  const [editorReferenceImage, setEditorReferenceImage] = useState<string | null>(null);
  const [isGeneratingInEditor, setIsGeneratingInEditor] = useState(false);
  
  // 图片编辑历史记录
  const [editHistory, setEditHistory] = useState<Array<{
    imageUrl: string;
    imageBase64?: string;
    prompt: string;
    timestamp: number;
  }>>([]);
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState(-1);
  
  // 微型画布状态
  const [editorSelection, setEditorSelection] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [isDrawingSelection, setIsDrawingSelection] = useState(false);
  const [selectionStart, setSelectionStart] = useState<{ x: number; y: number } | null>(null);
  const [cameraPosition, setCameraPosition] = useState({ x: 0, y: 0, zoom: 1 });
  const miniCanvasRef = useRef<HTMLCanvasElement>(null);
  const [originalImageDimensions, setOriginalImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const [imageDrawBounds, setImageDrawBounds] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  
  // 图片编辑器 - 比例和尺寸选择
  const [editorImageRatio, setEditorImageRatio] = useState<'16:9' | '9:16' | '1:1' | '4:3' | '3:4'>('16:9');
  const [editorImageSize, setEditorImageSize] = useState<string>('1024x1024');
  
  // 图片编辑器 - 扩图尺寸
  const [expandSize, setExpandSize] = useState<'1.5x' | '2x' | '4x'>('2x');
  
  // 图片编辑器 - 快速操作选择
  const [quickAction, setQuickAction] = useState<'expand' | 'enhance' | null>(null);
  
  // 图片编辑器 - 镜头角度控制
  const [cameraAngleControl, setCameraAngleControl] = useState({
    horizontal: 0, // -90 到 90 度（左右）
    vertical: 0,   // -90 到 90 度（上下）
    distance: 0    // -50 到 50（远近）
  });
  
  // 编辑状态
  const [editingAction, setEditingAction] = useState(false);
  const [editingDialogue, setEditingDialogue] = useState(false);
  const [editingNarration, setEditingNarration] = useState(false);
  const [tempActionValue, setTempActionValue] = useState('');
  const [tempDialogueValue, setTempDialogueValue] = useState('');
  const [tempNarrationValue, setTempNarrationValue] = useState('');
  
  // 关键帧 Prompt 编辑状态
  const [editingStartPrompt, setEditingStartPrompt] = useState(false);
  const [editingEndPrompt, setEditingEndPrompt] = useState(false);
  const [tempStartPrompt, setTempStartPrompt] = useState('');
  const [tempEndPrompt, setTempEndPrompt] = useState('');
  
  // 资源库状态
  const [showLibraryModal, setShowLibraryModal] = useState(false);
  const [libraryType, setLibraryType] = useState<'start' | 'end' | 'video'>('start');
  const [libraryAssets, setLibraryAssets] = useState<any[]>([]);
  const [playingVideos, setPlayingVideos] = useState<Set<string>>(new Set()); // 跟踪正在播放的视频ID
  
  // 跨项目资源 Tab 状态
  const [projectTabs, setProjectTabs] = useState<{ id: string; sessionId: string; title: string }[]>([]);
  const [activeLibraryTabId, setActiveLibraryTabId] = useState<string>('local'); // 'local' = 本地资源库
  const [crossProjectAssets, setCrossProjectAssets] = useState<Array<{
    type: 'image' | 'video';
    url: string;
    thumbnailUrl?: string;
    prompt?: string;
    source: string;
  }>>([]);
  const [loadingCrossAssets, setLoadingCrossAssets] = useState(false);
  const [loadingProjectTabs, setLoadingProjectTabs] = useState(false); // 加载项目 tabs 的状态
  
  // 视频模型选择
  const [videoModels, setVideoModels] = useState<ModelInfo[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [localVideoModel, setLocalVideoModel] = useState(project.videoModel || '');
  
  // 图片模型选择
  const [imageModels, setImageModels] = useState<ModelInfo[]>([]);
  const [loadingImageModels, setLoadingImageModels] = useState(false);
  const [localImageModel, setLocalImageModel] = useState(project.imageModel || '');
  
  // 视频分辨率选择
  const [localVideoResolution, setLocalVideoResolution] = useState<'480P' | '720P' | '1080P'>(project.videoResolution || '720P');
  // 视频比例选择
  const [localVideoRatio, setLocalVideoRatio] = useState<'16:9' | '9:16' | '1:1'>(project.videoRatio || '16:9');
  
  // 音频生成选项
  const [generateAudio, setGenerateAudio] = useState(() => {
    const saved = localStorage.getItem('mcp_video_gen_settings');
    if (saved) {
      try {
        const settings = JSON.parse(saved);
        return typeof settings.defaultAudio === 'boolean' ? settings.defaultAudio : false;
      } catch (e) {
        return false;
      }
    }
    return false;
  });
  const [defaultDuration, setDefaultDuration] = useState(() => {
    const saved = localStorage.getItem('mcp_video_gen_settings');
    if (saved) {
      try {
        const settings = JSON.parse(saved);
        return typeof settings.defaultDuration === 'number' ? settings.defaultDuration : 8;
      } catch (e) {
        return 8;
      }
    }
    return 8;
  });

  // 加载默认设置及监听
  useEffect(() => {
    const handleSettingsChange = (e: any) => {
      const settings = e.detail;
      if (typeof settings.defaultAudio === 'boolean') {
        setGenerateAudio(settings.defaultAudio);
      }
      if (typeof settings.defaultDuration === 'number') {
        setDefaultDuration(settings.defaultDuration);
      }
    };

    window.addEventListener('video-gen-settings-changed', handleSettingsChange);
    return () => window.removeEventListener('video-gen-settings-changed', handleSettingsChange);
  }, []);

  // Seed 相关状态
  const [useSeed, setUseSeed] = useState(project.seed ? true : false);
  const [currentSeed, setCurrentSeed] = useState<number | null>(project.seed || null);

  // 音频上传状态（用于阿里云模型）
  const [uploadedAudioData, setUploadedAudioData] = useState<string | null>(null);
  const [uploadedAudioName, setUploadedAudioName] = useState<string | null>(null);

  // 音频URL输入
  const [audioUrl, setAudioUrl] = useState('');
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);
  
  // 布局状态
  const [rightPanelWidth, setRightPanelWidth] = useState(860);
  const [isResizing, setIsResizing] = useState(false);
  const [leftPanelWidth, setLeftPanelWidth] = useState(0);
  const leftPanelRef = useRef<HTMLDivElement>(null);

  // 监听左侧面板宽度变化
  useEffect(() => {
    if (!leftPanelRef.current) return;
    
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setLeftPanelWidth(entry.contentRect.width);
      }
    });
    
    observer.observe(leftPanelRef.current);
    return () => observer.disconnect();
  }, []);

  // 拖动改变布局大小
  const handleResizeMouseDown = useCallback((e: React.MouseEvent) => {
    setIsResizing(true);
    e.preventDefault();
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = window.innerWidth - e.clientX;
      // 允许右侧面板占据更多空间，使得左侧最小可以缩小到 200px
      if (newWidth > 300 && newWidth < window.innerWidth - 200) {
        setRightPanelWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  // 使用 Ref 跟踪最新的 project 状态，解决异步函数中的闭包过时问题
  const projectRef = useRef(project);
  useEffect(() => {
    projectRef.current = project;
  }, [project]);

  // 当切换镜头时，取消所有编辑状态
  useEffect(() => {
    setEditingAction(false);
    setEditingDialogue(false);
    setEditingNarration(false);
    setEditingStartPrompt(false);
    setEditingEndPrompt(false);
    setTempActionValue('');
    setTempDialogueValue('');
    setTempNarrationValue('');
    setTempStartPrompt('');
    setTempEndPrompt('');
  }, [activeShotId]);

  // 判断当前选择的模型是否为阿里云模型（支持音频上传）
  const isAliyunModel = localVideoModel.toLowerCase().includes('wanx') || 
                        localVideoModel.toLowerCase().includes('wan-') ||
                        localVideoModel.toLowerCase().includes('alibaba');

  const activeShotIndex = project.shots.findIndex(s => s.id === activeShotId);
  const activeShot = project.shots[activeShotIndex];
  
  // Safe access to keyframes (may be undefined if data is incomplete)
  const startKf = activeShot?.keyframes?.find(k => k.type === 'start');
  const endKf = activeShot?.keyframes?.find(k => k.type === 'end');

  // Check if all start frames are generated
  const allStartFramesGenerated = project.shots.length > 0 && project.shots.every(s => s.keyframes?.find(k => k.type === 'start')?.imageUrl);

  // 加载视频模型列表
  useEffect(() => {
    const loadVideoModels = async () => {
      setLoadingModels(true);
      try {
        const response = await modelApi.getModelList();
        if (response.code === 200 && response.data) {
          // 只显示 category 为 "text2video" 的模型
          const vidModels = response.data.filter((m: ModelInfo) => m.category === 'text2video');
          setVideoModels(vidModels);
          
          // 如果项目没有设置模型，使用默认模型
          if (!project.videoModel && vidModels.length > 0) {
            const defaultModel = vidModels[0].modelName;
            setLocalVideoModel(defaultModel);
            updateProject({ videoModel: defaultModel });
          }
        }
      } catch (error) {
        console.error('加载视频模型列表失败:', error);
      } finally {
        setLoadingModels(false);
      }
    };

    loadVideoModels();
  }, []);

  // 加载图片模型列表
  useEffect(() => {
    const loadImageModels = async () => {
      setLoadingImageModels(true);
      try {
        const response = await modelApi.getModelList();
        if (response.code === 200 && response.data) {
          // 只显示 category 为 "text2image" 的模型
          const imgModels = response.data.filter((m: ModelInfo) => m.category === 'text2image');
          setImageModels(imgModels);
          
          // 如果项目没有设置模型，使用默认模型
          if (!project.imageModel && imgModels.length > 0) {
            const defaultModel = imgModels[0].modelName;
            setLocalImageModel(defaultModel);
            updateProject({ imageModel: defaultModel });
          }
        }
      } catch (error) {
        console.error('加载图片模型列表失败:', error);
      } finally {
        setLoadingImageModels(false);
      }
    };

    loadImageModels();
  }, []);

  // 当本地模型选择改变时，更新项目
  useEffect(() => {
    if (localVideoModel && localVideoModel !== project.videoModel) {
      updateProject({ videoModel: localVideoModel });
    }
  }, [localVideoModel]);

  // 当本地图片模型选择改变时，更新项目
  useEffect(() => {
    if (localImageModel && localImageModel !== project.imageModel) {
      updateProject({ imageModel: localImageModel });
    }
  }, [localImageModel]);

  // 当本地分辨率选择改变时，更新项目
  useEffect(() => {
    if (localVideoResolution && localVideoResolution !== project.videoResolution) {
      updateProject({ videoResolution: localVideoResolution });
    }
  }, [localVideoResolution]);

  // 当本地分辨率选择改变时，更新项目
  useEffect(() => {
    if (localVideoRatio && localVideoRatio !== project.videoRatio) {
      updateProject({ videoRatio: localVideoRatio });
    }
  }, [localVideoRatio]);

  // 当seed状态改变时，更新项目
  useEffect(() => {
    if (useSeed && currentSeed !== null) {
      updateProject({ seed: currentSeed });
    } else if (!useSeed) {
      updateProject({ seed: undefined });
    }
  }, [useSeed, currentSeed]);

  const updateShot = (shotId: string, transform: (s: Shot) => Shot) => {
    updateProject((prev: VideoGenProject | null) => {
      if (!prev) return null;
      const newShots = prev.shots.map((s: Shot) => s.id === shotId ? transform(s) : s);
      return { ...prev, shots: newShots };
    });
  };

  const handleDeleteShot = (shotId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (window.confirm("确定要删除这个镜头吗？此操作不可撤销。")) {
      updateProject((prev: VideoGenProject | null) => {
        if (!prev) return null;
        return { ...prev, shots: prev.shots.filter((s: Shot) => s.id !== shotId) };
      });
      if (activeShotId === shotId) {
        setActiveShotId(null);
      }
    }
  };

  const handleAddShot = (afterIndex?: number) => {
    const newShot: Shot = {
      id: `shot-${Date.now()}`,
      sceneId: project.shots[afterIndex ?? project.shots.length - 1]?.sceneId || project.scriptData?.scenes[0]?.id || '1',
      actionSummary: '新镜头描述...',
      cameraMovement: 'static',
      characters: [],
      keyframes: [],
      characterVariations: {},
      characterImageTypes: {}
    };

    updateProject((prev: VideoGenProject | null) => {
      if (!prev) return null;
      const newShots = [...prev.shots];
      const insertIndex = afterIndex !== undefined ? afterIndex + 1 : newShots.length;
      newShots.splice(insertIndex, 0, newShot);
      return { ...prev, shots: newShots };
    });

    // 自动选中新镜头
    setActiveShotId(newShot.id);
  };

  const getRefImagesForShot = (shot: Shot, shotsOverride?: Shot[]) => {
      const referenceImages: string[] = [];
      const currentProject = projectRef.current;
      const allShots = shotsOverride || currentProject.shots;

      if (currentProject.scriptData) {
        // 查找该场景下的所有镜头，确定当前是第几个
        const shotsInScene = allShots.filter(s => String(s.sceneId) === String(shot.sceneId));
        const isFirstShotOfScene = shotsInScene.length > 0 && shotsInScene[0].id === shot.id;

        // 1. Scene Reference (Environment / Atmosphere)
        if (isFirstShotOfScene) {
          // 如果是该场景的第一个镜头，使用基础场景参考图
          const scene = currentProject.scriptData.scenes.find(s => String(s.id) === String(shot.sceneId));
          if (scene?.referenceImage) {
            referenceImages.push(scene.referenceImage);
            console.log('添加场景参考图 (首镜头):', scene.location, scene.referenceImage.substring(0, 50));
          }
        } else {
          // 如果不是第一个镜头，使用该场景下第一个镜头的起始帧图作为“场景参考”
          const firstShotOfScene = shotsInScene[0];
          const firstShotStartKf = firstShotOfScene.keyframes?.find(k => k.type === 'start');
          if (firstShotStartKf?.imageUrl) {
            referenceImages.push(firstShotStartKf.imageUrl);
            console.log('使用场景首镜头起始帧代替场景图:', firstShotOfScene.id, firstShotStartKf.imageUrl.substring(0, 50));
          } else {
            // 如果首镜头还没生成图，还是用基础场景图兜底
            const scene = currentProject.scriptData.scenes.find(s => String(s.id) === String(shot.sceneId));
            if (scene?.referenceImage) {
              referenceImages.push(scene.referenceImage);
            }
          }
        }

        // 2. Character References (Appearance)
        // 即使有了场景首帧参考，依然传入特定的角色定妆照以增强面部一致性
        if (shot.characters && shot.characters.length > 0) {
          console.log('镜头包含角色:', shot.characters);
          shot.characters.forEach(charId => {
            const char = currentProject.scriptData?.characters.find(c => String(c.id) === String(charId));
            if (!char) {
              console.log('未找到角色:', charId);
              return;
            }

            // Check if a specific image type (base or threeview) is selected for this shot
            const imageType = shot.characterImageTypes?.[charId] || 'base';
            
            // If threeview is selected and available, use it
            if (imageType === 'threeview' && char.threeViewImage) {
                referenceImages.push(char.threeViewImage);
                console.log('添加角色三视图参考图:', char.name, char.threeViewImage.substring(0, 50));
                return;
            }

            // Check if a specific variation is selected for this shot
            const varId = shot.characterVariations?.[charId];
            if (varId) {
                const variation = char.variations?.find(v => v.id === varId);
                if (variation?.referenceImage) {
                    referenceImages.push(variation.referenceImage);
                    console.log('添加角色变体参考图:', char.name, variation.name, variation.referenceImage.substring(0, 50));
                    return; // Use variation image instead of base
                }
            }

            // Fallback to base image
            if (char.referenceImage) {
              referenceImages.push(char.referenceImage);
              console.log('添加角色基础参考图:', char.name, char.referenceImage.substring(0, 50));
            }
          });
        } else {
          console.log('镜头不包含角色');
        }
      }
      console.log('最终参考图数量:', referenceImages.length);
      return referenceImages;
  };

  const handleGenerateKeyframe = async (shot: Shot, type: 'start' | 'end') => {
    // Robustly handle missing keyframe object
    const existingKf = shot.keyframes?.find(k => k.type === type);
    const kfId = existingKf?.id || `kf-${shot.id}-${type}-${Date.now()}`;
    let prompt = existingKf?.visualPrompt || shot.actionSummary;
    
    // 如果是场景的第一个镜头且是起始帧，且没有自定义提示词，则强化提示词要求：全景/中景，包含所有角色
    if (type === 'start' && !existingKf?.visualPrompt) {
        const shotsInScene = project.shots.filter(s => String(s.sceneId) === String(shot.sceneId));
        if (shotsInScene.length > 0 && shotsInScene[0].id === shot.id) {
            const allCharNames = shot.characters.map(id => {
                const char = project.scriptData?.characters.find(c => String(c.id) === String(id));
                return char?.name || id;
            }).join(', ');
            prompt = `Wide shot, full scene composition. All characters (${allCharNames}) are present in the scene, showing their initial positions. ${prompt}`;
            console.log('强化首镜头提示词:', prompt);
        }
    }

    setProcessingState({ id: kfId, type: type === 'start' ? 'kf_start' : 'kf_end' });
    
    try {
      const referenceImages = getRefImagesForShot(shot);
      // 关键帧使用 2560x1440 尺寸
      const keyframeSize = { width: 2560, height: 1440 };
      const url = await generateImage(
        prompt, 
        referenceImages, 
        project.imageModel || undefined, 
        project.sessionId, 
        keyframeSize,
        project.imageStyle
      );

      // 自动加入本地资源库
      try {
        const latestShots = projectRef.current.shots;
        const shotIndex = latestShots.findIndex((s: Shot) => s.id === shot.id);
        const scene = project.scriptData?.scenes.find((s: any) => String(s.id) === String(shot.sceneId));
        await addAssetToLibrary({
          type: 'scene',
          name: `镜头 ${shotIndex + 1} ${type === 'start' ? '起始帧' : '结束帧'}`,
          imageUrl: url,
          visualPrompt: prompt,
          metadata: {
            shotNumber: shotIndex + 1,
            atmosphere: scene?.atmosphere || undefined
          }
        });
        console.log(`自动加入资源库: 镜头 ${shotIndex + 1} ${type === 'start' ? '起始帧' : '结束帧'}`);
      } catch (err) {
        console.warn('自动加入资源库失败:', err);
      }

      updateProject((prev: VideoGenProject | null) => {
        if (!prev) return null;
        
        const updatedShots = prev.shots.map((s: Shot) => {
           if (s.id !== shot.id) return s;
           
           const newKeyframes = [...(s.keyframes || [])];
           const idx = newKeyframes.findIndex((k: Keyframe) => k.type === type);
           
           // 保持最新的提示词，不要用生成开始前的旧提示词覆盖
           const currentVisualPrompt = idx >= 0 ? newKeyframes[idx].visualPrompt : prompt;

           const newKf: Keyframe = {
               id: kfId,
               type,
               visualPrompt: currentVisualPrompt,
               imageUrl: url,
               status: 'completed'
           };
           
           if (idx >= 0) {
               newKeyframes[idx] = newKf;
           } else {
               newKeyframes.push(newKf);
           }
           
           return { ...s, keyframes: newKeyframes };
        });
        
        return { ...prev, shots: updatedShots };
      });
    } catch (e: any) {
      console.error(e);
      alert(`生成失败: ${e.message}`);
    } finally {
      setProcessingState(null);
    }
  };

  const handleGenerateVideo = async (shot: Shot) => {
    const sKf = shot.keyframes?.find(k => k.type === 'start');
    const eKf = shot.keyframes?.find(k => k.type === 'end');

    if (!sKf?.imageUrl) return alert("请先生成起始帧！");

    // Create interval if it doesn't exist
    let currentInterval = shot.interval;
    if (!currentInterval) {
      currentInterval = {
        id: `interval-${shot.id}-${Date.now()}`,
        startKeyframeId: sKf.id,
        endKeyframeId: eKf?.id || '',
        duration: defaultDuration, // 使用默认时长
        motionStrength: 0.5,
        status: 'pending'
      };
      // Update shot with new interval
      updateShot(shot.id, (s) => ({ ...s, interval: currentInterval }));
    }

    // Fix: Remove logic that auto-grabs next shot's frame.
    // Prevent morphing artifacts by defaulting to Image-to-Video unless an End Frame is explicitly generated.
    const endImageUrl = eKf?.imageUrl;
    const hasEndFrame = !!endImageUrl; // 记录是否有结束帧
    
    // 构建完整的 prompt，包含动作描述、对白和旁白
    let fullPrompt = shot.actionSummary;
    if (shot.dialogue) {
      fullPrompt += `. Dialogue: "${shot.dialogue}"`;
    } else {
      fullPrompt += `. No dialogue.`;
    }
    if (shot.narration) {
      fullPrompt += `. Narration: "${shot.narration}"`;
    } else {
      fullPrompt += `. No narration.`;
    }
    
    setProcessingState({ id: currentInterval.id, type: 'video' });
    setVideoProgress({ message: '正在初始化视频生成...' });
    
    try {
      // 获取该镜头的参考图（包含角色图片选择逻辑）
      const referenceImages = getRefImagesForShot(shot);

      const result = await generateVideo(
          fullPrompt, // 使用包含对白的完整 prompt
          sKf.imageUrl,
          endImageUrl, // Only pass if it exists
          localVideoModel || undefined, // 使用选择的视频模型
          localVideoResolution, // 使用选择的分辨率
          localVideoRatio, // 使用选择的比例
          currentInterval.duration, // 传递时长参数
          project.sessionId, // 传递项目的 sessionId
          (message: string, current?: number, total?: number) => {
            // 进度回调
            setVideoProgress({ message, current, total });
          },
          generateAudio, // 传递音频生成选项
          uploadedAudioData || undefined, // 传递上传的音频数据（用于阿里云模型）
          audioUrl || undefined, // 传递音频URL
          useSeed && currentSeed !== null ? currentSeed : undefined, // 传递seed
          referenceImages // 传递参考图（包含用户选择的剧照或三视图）
      );

      // 构建更新后的 shots 数组并更新项目
      updateProject((prev: VideoGenProject | null) => {
        if (!prev) return null;
        
        const latestShots = prev.shots;
        const currentShotIndexInternal = latestShots.findIndex(s => s.id === shot.id);
        if (currentShotIndexInternal === -1) return prev; 
        
        const latestShot = latestShots[currentShotIndexInternal];
        const nextShot = currentShotIndexInternal >= 0 && currentShotIndexInternal < latestShots.length - 1 
          ? latestShots[currentShotIndexInternal + 1] 
          : null;
        const nextShotHasStartFrame = nextShot?.keyframes?.find((k: Keyframe) => k.type === 'start')?.imageUrl;

        const updatedShots = latestShots.map((s: Shot) => {
          // 更新当前镜头
          if (s.id === latestShot.id) {
            const updatedShot = {
              ...s,
              interval: s.interval 
                ? { ...s.interval, videoUrl: result.videoUrl, status: 'completed' as const } 
                : { ...currentInterval!, videoUrl: result.videoUrl, status: 'completed' as const }
            };
            
            // 如果没有结束帧，且服务端返回了 lastFrameUrl，则自动填充结束帧
            if (!hasEndFrame && result.lastFrameUrl) {
              console.log('自动填充结束帧:', result.lastFrameUrl);
              const newKeyframes = [...(s.keyframes || [])];
              const endKfIndex = newKeyframes.findIndex((k: Keyframe) => k.type === 'end');
              
              // 保持最新的提示词
              const currentEndPrompt = endKfIndex >= 0 ? newKeyframes[endKfIndex].visualPrompt : s.actionSummary;

              const newEndKf: Keyframe = {
                id: `kf-${s.id}-end-${Date.now()}`,
                type: 'end',
                visualPrompt: currentEndPrompt,
                imageUrl: result.lastFrameUrl,
                status: 'completed'
              };
              
              if (endKfIndex >= 0) {
                newKeyframes[endKfIndex] = newEndKf;
              } else {
                newKeyframes.push(newEndKf);
              }
              
              updatedShot.keyframes = newKeyframes;
            }
            
            return updatedShot;
          }
          
          // 如果有 lastFrameUrl，且下一个镜头没有起始帧，则填充到下一个镜头的起始帧
          if (nextShot && s.id === nextShot.id && result.lastFrameUrl && !nextShotHasStartFrame) {
            console.log('自动填充下一镜头起始帧:', result.lastFrameUrl);
            const newKeyframes = [...(s.keyframes || [])];
            const startKfIndex = newKeyframes.findIndex((k: Keyframe) => k.type === 'start');
            
            // 保持最新的提示词
            const currentStartPrompt = startKfIndex >= 0 ? newKeyframes[startKfIndex].visualPrompt : s.actionSummary;

            const newStartKf: Keyframe = {
              id: `kf-${s.id}-start-${Date.now()}`,
              type: 'start',
              visualPrompt: currentStartPrompt,
              imageUrl: result.lastFrameUrl,
              status: 'completed'
            };
            
            if (startKfIndex >= 0) {
              newKeyframes[startKfIndex] = newStartKf;
            } else {
              newKeyframes.push(newStartKf);
            }
            
            return { ...s, keyframes: newKeyframes };
          }
          
          return s;
        });
        
        // 如果返回了seed，同时保存到项目中
        if (result.seed !== undefined) {
          return { ...prev, shots: updatedShots, seed: result.seed };
        }
        
        return { ...prev, shots: updatedShots };
      });

      // 如果返回了seed，保存到状态
      if (result.seed !== undefined) {
        setCurrentSeed(result.seed);
        console.log('设置当前seed:', result.seed);
      }

      const currentShotIndexForLib = project.shots.findIndex(s => s.id === shot.id);

      // 自动加入本地资源库
      try {
        const scene = project.scriptData?.scenes.find((sc: any) => String(sc.id) === String(shot.sceneId));
        await addAssetToLibrary({
          type: 'video',
          name: `镜头 ${currentShotIndexForLib + 1} 视频`,
          imageUrl: sKf.imageUrl, // 使用起始帧作为缩略图
          videoUrl: result.videoUrl,
          startFrameUrl: sKf.imageUrl,
          endFrameUrl: result.lastFrameUrl || endImageUrl,
          visualPrompt: fullPrompt,
          metadata: {
            shotNumber: currentShotIndexForLib + 1,
            duration: currentInterval.duration,
            atmosphere: scene?.atmosphere || undefined
          }
        });
        console.log(`自动加入资源库: 镜头 ${currentShotIndexForLib + 1} 视频`);
      } catch (err) {
        console.warn('自动加入资源库失败:', err);
      }
    } catch (e: any) {
      console.error(e);
      
      // 检查是否是认证失败错误
      if (e.message && (e.message.includes('认证失败') || e.message.includes('401'))) {
        alert('登录已过期，请重新登录');
        window.location.href = '/login';
        return;
      }
      
      alert(`视频生成失败: ${e.message}`);
    } finally {
      setProcessingState(null);
      setVideoProgress(null);
    }
  };

  // 删除关键帧
  const handleDeleteKeyframe = (shot: Shot, type: 'start' | 'end') => {
    if (!window.confirm(`确定要删除${type === 'start' ? '起始' : '结束'}帧吗？`)) return;
    
    updateShot(shot.id, (s) => {
      const newKeyframes = s.keyframes?.map(kf => {
        if (kf.type === type) {
          return { ...kf, imageUrl: undefined, status: 'pending' as const };
        }
        return kf;
      }) || [];
      return { ...s, keyframes: newKeyframes };
    });
  };

  // 上传关键帧图片到OSS
  const handleUploadKeyframe = async (shot: Shot, type: 'start' | 'end', file: File) => {
    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件');
      return;
    }
    
    // 验证文件大小 (最大 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('图片文件过大，请选择小于 10MB 的图片');
      return;
    }
    
    // 设置上传状态
    setProcessingState({ id: `upload-${shot.id}-${type}`, type: type === 'start' ? 'kf_start' : 'kf_end' });
    
    try {
      // 上传到OSS
      const imageUrl = await uploadFileToOss(file);
      console.log('关键帧图片已上传到OSS:', imageUrl);
      
      // 更新镜头的关键帧
      updateShot(shot.id, (s) => {
        let newKeyframes = s.keyframes || [];
        const existingKf = newKeyframes.find(kf => kf.type === type);
        
        if (existingKf) {
          // 更新现有关键帧
          newKeyframes = newKeyframes.map(kf => {
            if (kf.type === type) {
              return { ...kf, imageUrl, status: 'completed' as const };
            }
            return kf;
          });
        } else {
          // 创建新关键帧
          newKeyframes.push({
            id: `kf-${shot.id}-${type}-${Date.now()}`,
            type,
            visualPrompt: shot.actionSummary,
            imageUrl,
            status: 'completed'
          });
        }
        
        return { ...s, keyframes: newKeyframes };
      });
    } catch (error: any) {
      console.error('图片上传失败:', error);
      if (error.message && error.message.includes('登录已过期')) {
        alert('登录已过期，请重新登录');
        window.location.href = '/login';
      } else {
        alert(`图片上传失败: ${error.message || '未知错误'}`);
      }
    } finally {
      setProcessingState(null);
    }
  };

  // 上传音频文件（用于阿里云模型）
  const handleUploadAudio = (file: File) => {
    // 验证文件类型
    const validTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a', 'audio/aac'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(mp3|wav|ogg|m4a|aac)$/i)) {
      alert('请选择音频文件（支持 MP3、WAV、OGG、M4A、AAC 格式）');
      return;
    }
    
    // 验证文件大小 (最大 20MB)
    const maxSize = 20 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('音频文件过大，请选择小于 20MB 的音频');
      return;
    }
    
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const audioData = e.target?.result as string;
      if (!audioData) {
        alert('音频读取失败，请重试');
        return;
      }
      
      // 存储 base64 编码的音频数据
      setUploadedAudioData(audioData);
      setUploadedAudioName(file.name);
      console.log('音频文件已上传:', file.name, '大小:', (file.size / 1024).toFixed(2), 'KB');
    };
    
    reader.onerror = () => {
      alert('音频读取失败，请重试');
    };
    
    reader.readAsDataURL(file);
  };

  // 上传音频文件到OSS并获取URL
  const handleUploadAudioToOss = async (file: File) => {
    // 验证文件类型
    const validTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a', 'audio/aac'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(mp3|wav|ogg|m4a|aac)$/i)) {
      alert('请选择音频文件（支持 MP3、WAV、OGG、M4A、AAC 格式）');
      return;
    }
    
    // 验证文件大小 (最大 20MB)
    const maxSize = 20 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('音频文件过大，请选择小于 20MB 的音频');
      return;
    }
    
    setIsUploadingAudio(true);
    
    try {
      const url = await uploadFileToOss(file);
      setAudioUrl(url);
      console.log('音频文件已上传到OSS:', url);
    } catch (error: any) {
      console.error('音频上传失败:', error);
      if (error.message && error.message.includes('登录已过期')) {
        alert('登录已过期，请重新登录');
        window.location.href = '/login';
      } else {
        alert(`音频上传失败: ${error.message || '未知错误'}`);
      }
    } finally {
      setIsUploadingAudio(false);
    }
  };


  // 清除已上传的音频
  const handleClearAudio = () => {
    setUploadedAudioData(null);
    setUploadedAudioName(null);
  };

  // 打开图片编辑器
  const handleOpenImageEditor = async (shot: Shot, type: 'start' | 'end') => {
    console.log('=== 打开图片编辑器 ===');
    console.log('镜头ID:', shot.id);
    console.log('类型:', type);
    console.log('镜头对象:', shot);
    
    const kf = shot.keyframes?.find(k => k.type === type);
    console.log('找到关键帧:', kf);
    
    if (!kf?.imageUrl) {
      console.log('❌ 没有图片URL，退出');
      alert('该关键帧还没有图片，请先生成图片');
      return;
    }
    
    console.log('✅ 开始转换图片为 base64');
    
    try {
      // 将图片转换为 base64
      const base64 = await convertImageToBase64(kf.imageUrl);
      console.log('✅ 图片转换成功，base64 长度:', base64.length);
      
      setEditingImage({
        shotId: shot.id,
        type,
        imageUrl: kf.imageUrl,
        imageBase64: base64, // 保存 base64 版本
        prompt: kf.visualPrompt || shot.actionSummary
      });
      setEditorPrompt(kf.visualPrompt || shot.actionSummary);
      setEditorCameraAngle('medium');
      setEditorReferenceImage(null);
      
      // 初始化历史记录
      setEditHistory([{
        imageUrl: kf.imageUrl,
        imageBase64: base64,
        prompt: kf.visualPrompt || shot.actionSummary,
        timestamp: Date.now()
      }]);
      setCurrentHistoryIndex(0);
      
      console.log('✅ 编辑器状态已设置完成');
    } catch (error) {
      console.error('❌ 图片转换失败:', error);
      alert('图片加载失败，请重试');
    }
  };

  // 将图片 URL 转换为 base64（使用 fetch 避免 CORS 污染）
  const convertImageToBase64 = async (imageUrl: string): Promise<string> => {
    try {
      // 使用 fetch 获取图片数据
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const blob = await response.blob();
      
      // 将 blob 转换为 base64
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          resolve(base64);
        };
        reader.onerror = () => {
          reject(new Error('FileReader 错误'));
        };
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Fetch 图片失败:', error);
      // 如果 fetch 失败，尝试使用 Image 对象（可能会有 CORS 问题）
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous'; // 尝试使用 CORS
        
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            
            if (!ctx) {
              reject(new Error('无法获取画布上下文'));
              return;
            }
            
            ctx.drawImage(img, 0, 0);
            const base64 = canvas.toDataURL('image/png');
            resolve(base64);
          } catch (error) {
            reject(error);
          }
        };
        
        img.onerror = () => {
          reject(new Error('图片加载失败'));
        };
        
        img.src = imageUrl;
      });
    }
  };

  // 关闭图片编辑器
  const handleCloseImageEditor = () => {
    setEditingImage(null);
    setEditorPrompt('');
    setEditorCameraAngle('medium');
    setEditorReferenceImage(null);
    setIsGeneratingInEditor(false);
    setEditorSelection(null);
    setIsDrawingSelection(false);
    setSelectionStart(null);
    setCameraPosition({ x: 0, y: 0, zoom: 1 });
    setOriginalImageDimensions(null);
    setImageDrawBounds(null);
    setEditorImageRatio('16:9');
    setEditorImageSize('1024x1024');
    setExpandSize('2x');
    setQuickAction(null);
    setCameraAngleControl({ horizontal: 0, vertical: 0, distance: 0 });
    setEditHistory([]);
    setCurrentHistoryIndex(-1);
  };

  // 根据镜头角度控制生成 prompt
  const generateCameraAnglePrompt = (): string => {
    const { horizontal, vertical, distance } = cameraAngleControl;
    const parts: string[] = [];
    
    // 水平角度（左右）
    if (horizontal < -30) {
      parts.push('camera angle from the left side');
    } else if (horizontal > 30) {
      parts.push('camera angle from the right side');
    } else if (horizontal < -10) {
      parts.push('slightly angled from the left');
    } else if (horizontal > 10) {
      parts.push('slightly angled from the right');
    } else {
      parts.push('frontal view');
    }
    
    // 垂直角度（上下）
    if (vertical < -30) {
      parts.push('low angle shot, looking up');
    } else if (vertical > 30) {
      parts.push('high angle shot, looking down');
    } else if (vertical < -10) {
      parts.push('slightly low angle');
    } else if (vertical > 10) {
      parts.push('slightly high angle');
    } else {
      parts.push('eye level');
    }
    
    // 距离（远近）
    if (distance < -20) {
      parts.push('extreme close-up');
    } else if (distance > 20) {
      parts.push('wide shot, distant view');
    } else if (distance < -5) {
      parts.push('close-up');
    } else if (distance > 5) {
      parts.push('medium shot');
    }
    
    return parts.join(', ');
  };

  // 历史记录导航
  const goToPreviousHistory = () => {
    if (currentHistoryIndex > 0 && editingImage) {
      const newIndex = currentHistoryIndex - 1;
      const historyItem = editHistory[newIndex];
      
      setEditingImage({
        ...editingImage,
        imageUrl: historyItem.imageUrl,
        imageBase64: historyItem.imageBase64,
        prompt: historyItem.prompt
      });
      setEditorPrompt(historyItem.prompt);
      setCurrentHistoryIndex(newIndex);
      
      console.log('切换到历史记录:', newIndex);
    }
  };

  const goToNextHistory = () => {
    if (currentHistoryIndex < editHistory.length - 1 && editingImage) {
      const newIndex = currentHistoryIndex + 1;
      const historyItem = editHistory[newIndex];
      
      setEditingImage({
        ...editingImage,
        imageUrl: historyItem.imageUrl,
        imageBase64: historyItem.imageBase64,
        prompt: historyItem.prompt
      });
      setEditorPrompt(historyItem.prompt);
      setCurrentHistoryIndex(newIndex);
      
      console.log('切换到历史记录:', newIndex);
    }
  };

  const goToHistoryIndex = (index: number) => {
    if (index >= 0 && index < editHistory.length && editingImage) {
      const historyItem = editHistory[index];
      
      setEditingImage({
        ...editingImage,
        imageUrl: historyItem.imageUrl,
        imageBase64: historyItem.imageBase64,
        prompt: historyItem.prompt
      });
      setEditorPrompt(historyItem.prompt);
      setCurrentHistoryIndex(index);
      
      console.log('切换到历史记录:', index);
    }
  };

  // 根据比例获取尺寸选项
  const getSizeOptionsForRatio = (ratio: string): string[] => {
    switch (ratio) {
      case '16:9':
        return ['1280x720', '1920x1080', '2560x1440', '3840x2160'];
      case '9:16':
        return ['720x1280', '1080x1920', '1440x2560', '2160x3840'];
      case '1:1':
        return ['512x512', '1024x1024', '2048x2048'];
      case '4:3':
        return ['1024x768', '1280x960', '1600x1200', '2048x1536'];
      case '3:4':
        return ['768x1024', '960x1280', '1200x1600', '1536x2048'];
      default:
        return ['1024x1024'];
    }
  };

  // 当比例改变时，更新尺寸选项
  useEffect(() => {
    const sizeOptions = getSizeOptionsForRatio(editorImageRatio);
    if (!sizeOptions.includes(editorImageSize)) {
      setEditorImageSize(sizeOptions[0]);
    }
  }, [editorImageRatio]);

  // 微型画布鼠标事件
  const handleMiniCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = miniCanvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;
    
    setIsDrawingSelection(true);
    setSelectionStart({ x, y });
    setEditorSelection(null);
  };

  const handleMiniCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingSelection || !selectionStart) return;
    
    const canvas = miniCanvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;
    
    setEditorSelection({
      x: Math.min(selectionStart.x, x),
      y: Math.min(selectionStart.y, y),
      width: Math.abs(x - selectionStart.x),
      height: Math.abs(y - selectionStart.y)
    });
  };

  const handleMiniCanvasMouseUp = () => {
    setIsDrawingSelection(false);
    setSelectionStart(null);
  };

  // 绘制微型画布
  useEffect(() => {
    if (!editingImage || !miniCanvasRef.current) {
      console.log('画布渲染条件不满足:', { editingImage: !!editingImage, canvas: !!miniCanvasRef.current });
      return;
    }
    
    const canvas = miniCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.log('无法获取画布上下文');
      return;
    }
    
    console.log('开始绘制画布，图片URL:', editingImage.imageUrl);
    
    // 清空画布 - 使用深色背景
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 绘制原图
    const img = new Image();
    // 不设置 crossOrigin，避免 CORS 问题
    
    img.onerror = (e) => {
      console.error('图片加载失败:', editingImage.imageUrl, e);
      // 显示错误提示
      ctx.fillStyle = '#ef4444';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('图片加载失败', canvas.width / 2, canvas.height / 2);
      ctx.fillText('请检查图片URL是否有效', canvas.width / 2, canvas.height / 2 + 25);
    };
    
    img.onload = () => {
      console.log('图片加载成功，尺寸:', img.width, 'x', img.height);
      
      // 保存原图尺寸
      setOriginalImageDimensions({ width: img.width, height: img.height });
      
      // 清空画布
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // 计算图片在画布中的显示尺寸（保持宽高比，居中显示）
      const imgAspect = img.width / img.height;
      const canvasAspect = canvas.width / canvas.height;
      
      let drawWidth, drawHeight, drawX, drawY;
      
      if (imgAspect > canvasAspect) {
        // 图片更宽，以宽度为准
        drawWidth = canvas.width;
        drawHeight = canvas.width / imgAspect;
        drawX = 0;
        drawY = (canvas.height - drawHeight) / 2;
      } else {
        // 图片更高，以高度为准
        drawHeight = canvas.height;
        drawWidth = canvas.height * imgAspect;
        drawX = (canvas.width - drawWidth) / 2;
        drawY = 0;
      }
      
      // 保存图片在画布中的绘制位置和尺寸
      setImageDrawBounds({ x: drawX, y: drawY, width: drawWidth, height: drawHeight });
      console.log('图片在画布中的位置:', { x: drawX, y: drawY, width: drawWidth, height: drawHeight });
      
      // 应用镜头位置和缩放
      ctx.save();
      ctx.translate(cameraPosition.x, cameraPosition.y);
      ctx.scale(cameraPosition.zoom, cameraPosition.zoom);
      
      // 绘制图片（居中，保持宽高比）
      ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
      
      ctx.restore();
      
      // 绘制选区
      if (editorSelection) {
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 3;
        ctx.setLineDash([10, 5]);
        ctx.strokeRect(
          editorSelection.x,
          editorSelection.y,
          editorSelection.width,
          editorSelection.height
        );
        
        // 绘制半透明遮罩（选区外）
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, canvas.width, editorSelection.y);
        ctx.fillRect(0, editorSelection.y, editorSelection.x, editorSelection.height);
        ctx.fillRect(
          editorSelection.x + editorSelection.width,
          editorSelection.y,
          canvas.width - editorSelection.x - editorSelection.width,
          editorSelection.height
        );
        ctx.fillRect(
          0,
          editorSelection.y + editorSelection.height,
          canvas.width,
          canvas.height - editorSelection.y - editorSelection.height
        );
      }
      
      // 绘制镜头角度指示器
      const angleIndicators = {
        'wide': { label: '广角', color: '#10b981' },
        'medium': { label: '中景', color: '#3b82f6' },
        'close': { label: '特写', color: '#f59e0b' },
        'extreme-close': { label: '大特写', color: '#ef4444' }
      };
      
      const indicator = angleIndicators[editorCameraAngle];
      ctx.fillStyle = indicator.color;
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(indicator.label, 10, 30);
      
      console.log('画布绘制完成');
    };
    
    // 使用 base64 版本（如果有），否则使用 URL
    img.src = editingImage.imageBase64 || editingImage.imageUrl;
  }, [editingImage, editorSelection, cameraPosition, editorCameraAngle]);

  // 在编辑器中生成新图片
  const handleGenerateInEditor = async () => {
    if (!editingImage || !editorPrompt.trim()) return;
    
    const shot = project.shots.find(s => s.id === editingImage.shotId);
    if (!shot) return;
    
    setIsGeneratingInEditor(true);
    
    try {
      // 构建详细的 Inpainting 提示词
      const angleDescriptions = {
        'wide': 'Wide shot, full scene view',
        'medium': 'Medium shot, balanced composition',
        'close': 'Close-up shot, focused on subject',
        'extreme-close': 'Extreme close-up, detailed view'
      };
      
      // 生成镜头角度 prompt
      const cameraAnglePrompt = generateCameraAnglePrompt();
      
      let fullPrompt = '';
      
      // 准备参考图列表
      let referenceImages = editorReferenceImage ? [editorReferenceImage] : getRefImagesForShot(shot);
      
      // 如果有选区，生成带标注框的图片并构建 Inpainting prompt
      if (editorSelection && originalImageDimensions && imageDrawBounds) {
        const annotatedImage = await generateAnnotatedImage();
        if (annotatedImage) {
          console.log('生成了标注图片，添加到参考图列表');
          // 将标注图片添加到参考图列表
          referenceImages = [annotatedImage, ...referenceImages];
          
          // 计算选区在原图中的实际坐标
          const canvas = miniCanvasRef.current;
          if (canvas) {
            // 1. 减去图片在画布中的偏移量
            const selectionInImage = {
              x: editorSelection.x - imageDrawBounds.x,
              y: editorSelection.y - imageDrawBounds.y,
              width: editorSelection.width,
              height: editorSelection.height
            };
            
            // 2. 从画布显示尺寸缩放到原图尺寸
            const scaleX = originalImageDimensions.width / imageDrawBounds.width;
            const scaleY = originalImageDimensions.height / imageDrawBounds.height;
            
            const x1 = Math.max(0, Math.round(selectionInImage.x * scaleX));
            const y1 = Math.max(0, Math.round(selectionInImage.y * scaleY));
            const x2 = Math.min(
              originalImageDimensions.width,
              Math.round((selectionInImage.x + selectionInImage.width) * scaleX)
            );
            const y2 = Math.min(
              originalImageDimensions.height,
              Math.round((selectionInImage.y + selectionInImage.height) * scaleY)
            );
            
            // 构建详细的 Inpainting 提示词
            fullPrompt = `**任务类型：** 图像局部重绘 (Inpainting)

**标注图像：** 参考图列表中的第一张图片（原图上标注了红色虚线框，标注区域为需要重绘的区域）

**目标区域设定 (Target Region)：**
请根据图片上的红色虚线标注框进行局部重绘。标注框的坐标信息如下：
* 原图尺寸：宽 ${originalImageDimensions.width} 像素, 高 ${originalImageDimensions.height} 像素
* 区域左上角坐标 (x1, y1)：${x1}, ${y1}
* 区域右下角坐标 (x2, y2)：${x2}, ${y2}

**镜头角度 (Camera Angle)：**
${cameraAnglePrompt}

**重绘内容提示词 (Content Prompt)：**
${angleDescriptions[editorCameraAngle]}. ${editorPrompt}

**约束条件 (Constraints)：**
1. 输出图片必须保持与原图一致的尺寸 (${originalImageDimensions.width}x${originalImageDimensions.height})。
2. 严格保留标注框以外的所有原始像素，不做任何修改。
3. 确保新生成的内容与周围环境的光影、透视和风格完美融合，过渡自然。
4. 移除输出图片中的红色标注框，只保留重绘后的内容。`;
            
            console.log('Inpainting 区域坐标:', { x1, y1, x2, y2 });
          }
        } else {
          console.warn('标注图片生成失败，使用原图 base64');
          // 如果标注图片生成失败，使用原图的 base64
          if (editingImage.imageBase64) {
            referenceImages = [editingImage.imageBase64, ...referenceImages];
          } else {
            referenceImages = [editingImage.imageUrl, ...referenceImages];
          }
        }
      } else {
        // 没有选区时，使用普通的图像生成提示词
        fullPrompt = `${cameraAnglePrompt}. ${angleDescriptions[editorCameraAngle]}. ${editorPrompt}`;
        // 添加原图的 base64（如果有），否则使用 URL
        if (editingImage.imageBase64) {
          referenceImages = [editingImage.imageBase64, ...referenceImages];
          console.log('使用原图 base64 作为参考');
        } else {
          referenceImages = [editingImage.imageUrl, ...referenceImages];
          console.log('使用原图 URL 作为参考');
        }
      }
      
      // 使用用户选择的尺寸生成（而不是原图尺寸）
      const [width, height] = editorImageSize.split('x').map(Number);
      const keyframeSize = { width, height };
      
      console.log('生成图片尺寸:', keyframeSize);
      console.log('完整提示词:', fullPrompt);
      console.log('参考图数量:', referenceImages.length);
      
      const url = await generateImage(
        fullPrompt,
        referenceImages,
        project.imageModel || undefined,
        project.sessionId,
        keyframeSize,
        project.imageStyle
      );
      
      console.log('✅ 新图片生成成功:', url);
      
      // 转换新图片为 base64
      const newBase64 = await convertImageToBase64(url);
      console.log('✅ 新图片转换为 base64 成功');
      
      // 更新关键帧
      updateShot(shot.id, (s) => {
        const newKeyframes = [...(s.keyframes || [])];
        const idx = newKeyframes.findIndex(k => k.type === editingImage.type);
        
        if (idx >= 0) {
          newKeyframes[idx] = {
            ...newKeyframes[idx],
            imageUrl: url,
            visualPrompt: editorPrompt.trim()
          };
        }
        
        return { ...s, keyframes: newKeyframes };
      });
      
      // 更新编辑器状态（刷新预览）
      setEditingImage({
        ...editingImage,
        imageUrl: url,
        imageBase64: newBase64,
        prompt: editorPrompt.trim()
      });
      
      // 添加到历史记录
      const newHistoryItem = {
        imageUrl: url,
        imageBase64: newBase64,
        prompt: editorPrompt.trim(),
        timestamp: Date.now()
      };
      
      // 如果当前不在历史记录的末尾，删除后面的记录
      const newHistory = currentHistoryIndex < editHistory.length - 1
        ? [...editHistory.slice(0, currentHistoryIndex + 1), newHistoryItem]
        : [...editHistory, newHistoryItem];
      
      setEditHistory(newHistory);
      setCurrentHistoryIndex(newHistory.length - 1);
      
      console.log('✅ 历史记录已更新，当前索引:', newHistory.length - 1);
      
      // 自动加入资源库
      try {
        const shotIndex = project.shots.findIndex(s => s.id === shot.id);
        const scene = project.scriptData?.scenes.find((s: any) => String(s.id) === String(shot.sceneId));
        await addAssetToLibrary({
          type: 'scene',
          name: `镜头 ${shotIndex + 1} ${editingImage.type === 'start' ? '起始帧' : '结束帧'} (编辑-${editorCameraAngle})`,
          imageUrl: url,
          visualPrompt: fullPrompt,
          metadata: {
            shotNumber: shotIndex + 1,
            atmosphere: scene?.atmosphere || undefined
          }
        });
      } catch (err) {
        console.warn('自动加入资源库失败:', err);
      }
      
    } catch (e: any) {
      console.error(e);
      alert(`生成失败: ${e.message}`);
    } finally {
      setIsGeneratingInEditor(false);
    }
  };

  // 根据选区标注生成原图大小的图片
  const handleGenerateWithSelection = async () => {
    if (!editingImage || !editorPrompt.trim() || !editorSelection || !originalImageDimensions || !imageDrawBounds) {
      alert('请先框选区域并输入提示词');
      return;
    }
    
    const shot = project.shots.find(s => s.id === editingImage.shotId);
    if (!shot) return;
    
    setIsGeneratingInEditor(true);
    
    try {
      // 计算选区在原图中的实际坐标
      const canvas = miniCanvasRef.current;
      if (!canvas) return;
      
      // 1. 减去图片在画布中的偏移量
      const selectionInImage = {
        x: editorSelection.x - imageDrawBounds.x,
        y: editorSelection.y - imageDrawBounds.y,
        width: editorSelection.width,
        height: editorSelection.height
      };
      
      // 2. 从画布显示尺寸缩放到原图尺寸
      const scaleX = originalImageDimensions.width / imageDrawBounds.width;
      const scaleY = originalImageDimensions.height / imageDrawBounds.height;
      
      const x1 = Math.max(0, Math.round(selectionInImage.x * scaleX));
      const y1 = Math.max(0, Math.round(selectionInImage.y * scaleY));
      const x2 = Math.min(
        originalImageDimensions.width,
        Math.round((selectionInImage.x + selectionInImage.width) * scaleX)
      );
      const y2 = Math.min(
        originalImageDimensions.height,
        Math.round((selectionInImage.y + selectionInImage.height) * scaleY)
      );
      
      // 构建提示词，告诉大模型根据标注选区生成原图大小的图片
      const angleDescriptions = {
        'wide': 'Wide shot, full scene view',
        'medium': 'Medium shot, balanced composition',
        'close': 'Close-up shot, focused on subject',
        'extreme-close': 'Extreme close-up, detailed view'
      };
      
      const fullPrompt = `**任务类型：** 基于选区标注的图像生成

**基础图像：** 参考图列表中的第一张图片（原图）

**选区标注 (Region Annotation)：**
用户在原图上标注了一个感兴趣的区域，请根据这个区域生成完整的原图大小的新图片。
* 原图尺寸：宽 ${originalImageDimensions.width} 像素, 高 ${originalImageDimensions.height} 像素
* 标注区域左上角坐标 (x1, y1)：${x1}, ${y1}
* 标注区域右下角坐标 (x2, y2)：${x2}, ${y2}

**生成内容提示词 (Content Prompt)：**
${angleDescriptions[editorCameraAngle]}. ${editorPrompt}

**生成要求：**
1. 输出图片必须保持与原图一致的尺寸 (${originalImageDimensions.width}x${originalImageDimensions.height})。
2. 根据标注区域和提示词，生成符合要求的完整图片。
3. 确保生成的内容与原图风格、光影、透视保持一致。`;
      
      console.log('选区标注坐标:', { x1, y1, x2, y2 });
      console.log('完整提示词:', fullPrompt);
      
      // 准备参考图列表（使用 base64 版本的原图）
      let referenceImages = [editingImage.imageBase64 || editingImage.imageUrl];
      if (editorReferenceImage) {
        referenceImages.push(editorReferenceImage);
      } else {
        referenceImages.push(...getRefImagesForShot(shot));
      }
      
      console.log('使用', editingImage.imageBase64 ? 'base64' : 'URL', '作为原图参考');
      
      // 使用原图尺寸生成
      const keyframeSize = { width: originalImageDimensions.width, height: originalImageDimensions.height };
      
      const url = await generateImage(
        fullPrompt,
        referenceImages,
        project.imageModel || undefined,
        project.sessionId,
        keyframeSize,
        project.imageStyle
      );
      
      // 更新关键帧
      updateShot(shot.id, (s) => {
        const newKeyframes = [...(s.keyframes || [])];
        const idx = newKeyframes.findIndex(k => k.type === editingImage.type);
        
        if (idx >= 0) {
          newKeyframes[idx] = {
            ...newKeyframes[idx],
            imageUrl: url,
            visualPrompt: editorPrompt.trim()
          };
        }
        
        return { ...s, keyframes: newKeyframes };
      });
      
      // 更新编辑器状态
      setEditingImage({
        ...editingImage,
        imageUrl: url,
        prompt: editorPrompt.trim()
      });
      
      // 自动加入资源库
      try {
        const shotIndex = project.shots.findIndex(s => s.id === shot.id);
        const scene = project.scriptData?.scenes.find((s: any) => String(s.id) === String(shot.sceneId));
        await addAssetToLibrary({
          type: 'scene',
          name: `镜头 ${shotIndex + 1} ${editingImage.type === 'start' ? '起始帧' : '结束帧'} (选区生成)`,
          imageUrl: url,
          visualPrompt: fullPrompt,
          metadata: {
            shotNumber: shotIndex + 1,
            atmosphere: scene?.atmosphere || undefined
          }
        });
      } catch (err) {
        console.warn('自动加入资源库失败:', err);
      }
      
    } catch (e: any) {
      console.error(e);
      alert(`生成失败: ${e.message}`);
    } finally {
      setIsGeneratingInEditor(false);
    }
  };

  // 生成黑白遮罩层（选区为白色，其他为黑色）
  const generateMaskImage = async (): Promise<string | null> => {
    if (!editingImage || !editorSelection || !originalImageDimensions || !imageDrawBounds) return null;
    
    try {
      const canvas = miniCanvasRef.current;
      if (!canvas) return null;
      
      // 创建一个新的画布用于生成遮罩
      const maskCanvas = document.createElement('canvas');
      maskCanvas.width = originalImageDimensions.width;
      maskCanvas.height = originalImageDimensions.height;
      const ctx = maskCanvas.getContext('2d');
      if (!ctx) return null;
      
      // 将画布坐标转换为图片坐标
      // 1. 减去图片在画布中的偏移量
      const selectionInImage = {
        x: editorSelection.x - imageDrawBounds.x,
        y: editorSelection.y - imageDrawBounds.y,
        width: editorSelection.width,
        height: editorSelection.height
      };
      
      // 2. 从画布显示尺寸缩放到原图尺寸
      const scaleX = originalImageDimensions.width / imageDrawBounds.width;
      const scaleY = originalImageDimensions.height / imageDrawBounds.height;
      
      const actualX = Math.max(0, Math.round(selectionInImage.x * scaleX));
      const actualY = Math.max(0, Math.round(selectionInImage.y * scaleY));
      const actualWidth = Math.min(
        originalImageDimensions.width - actualX,
        Math.round(selectionInImage.width * scaleX)
      );
      const actualHeight = Math.min(
        originalImageDimensions.height - actualY,
        Math.round(selectionInImage.height * scaleY)
      );
      
      console.log('画布选区坐标:', editorSelection);
      console.log('图片绘制区域:', imageDrawBounds);
      console.log('选区相对图片:', selectionInImage);
      console.log('原图尺寸:', originalImageDimensions);
      console.log('选区在原图中的坐标:', { x: actualX, y: actualY, width: actualWidth, height: actualHeight });
      
      // 填充黑色背景
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
      
      // 在选区位置填充白色
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(actualX, actualY, actualWidth, actualHeight);
      
      // 转换为 base64
      const dataUrl = maskCanvas.toDataURL('image/png');
      console.log('遮罩层生成成功，大小:', dataUrl.length, 'bytes');
      
      return dataUrl;
    } catch (error) {
      console.error('生成遮罩层失败:', error);
      return null;
    }
  };

  // 生成带选区标注框的原图
  const generateAnnotatedImage = async (): Promise<string | null> => {
    if (!editingImage || !editorSelection || !originalImageDimensions || !imageDrawBounds) {
      console.error('generateAnnotatedImage: 缺少必要参数', {
        editingImage: !!editingImage,
        editorSelection: !!editorSelection,
        originalImageDimensions: !!originalImageDimensions,
        imageDrawBounds: !!imageDrawBounds
      });
      return null;
    }
    
    // 检查是否有 base64 版本
    if (!editingImage.imageBase64) {
      console.error('没有 base64 版本的图片');
      return null;
    }
    
    console.log('开始生成标注图片...');
    console.log('选区:', editorSelection);
    console.log('图片绘制区域:', imageDrawBounds);
    console.log('原图尺寸:', originalImageDimensions);
    
    try {
      // 创建一个新的画布
      const annotatedCanvas = document.createElement('canvas');
      annotatedCanvas.width = originalImageDimensions.width;
      annotatedCanvas.height = originalImageDimensions.height;
      const ctx = annotatedCanvas.getContext('2d');
      if (!ctx) {
        console.error('无法获取画布上下文');
        return null;
      }
      
      // 使用 base64 版本加载图片
      const img = new Image();
      
      await new Promise<void>((resolve, reject) => {
        img.onload = () => {
          console.log('图片加载成功，尺寸:', img.width, 'x', img.height);
          resolve();
        };
        img.onerror = (e) => {
          console.error('图片加载失败:', e);
          reject(new Error('图片加载失败'));
        };
        img.src = editingImage.imageBase64!;
      });
      
      // 1. 先绘制原图
      ctx.drawImage(img, 0, 0, originalImageDimensions.width, originalImageDimensions.height);
      console.log('原图绘制完成');
      
      // 计算选区在原图中的坐标
      const selectionInImage = {
        x: editorSelection.x - imageDrawBounds.x,
        y: editorSelection.y - imageDrawBounds.y,
        width: editorSelection.width,
        height: editorSelection.height
      };
      
      const scaleX = originalImageDimensions.width / imageDrawBounds.width;
      const scaleY = originalImageDimensions.height / imageDrawBounds.height;
      
      const actualX = Math.max(0, Math.round(selectionInImage.x * scaleX));
      const actualY = Math.max(0, Math.round(selectionInImage.y * scaleY));
      const actualWidth = Math.min(
        originalImageDimensions.width - actualX,
        Math.round(selectionInImage.width * scaleX)
      );
      const actualHeight = Math.min(
        originalImageDimensions.height - actualY,
        Math.round(selectionInImage.height * scaleY)
      );
      
      console.log('选区在原图中的坐标:', { actualX, actualY, actualWidth, actualHeight });
      
      // 2. 绘制红色粗边框
      const lineWidth = Math.max(8, Math.round(originalImageDimensions.width / 200));
      ctx.strokeStyle = '#FF0000';
      ctx.lineWidth = lineWidth;
      ctx.setLineDash([]);
      ctx.strokeRect(actualX, actualY, actualWidth, actualHeight);
      console.log('红色边框绘制完成，线宽:', lineWidth);
      
      // 3. 绘制白色内边框（增强对比度）
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = Math.max(2, lineWidth / 3);
      const innerOffset = lineWidth;
      ctx.strokeRect(
        actualX + innerOffset, 
        actualY + innerOffset, 
        actualWidth - innerOffset * 2, 
        actualHeight - innerOffset * 2
      );
      console.log('白色内边框绘制完成');
      
      // 4. 在标注框上方添加文字标签（带背景）
      const fontSize = Math.max(32, Math.round(originalImageDimensions.width / 50));
      ctx.font = `bold ${fontSize}px Arial`;
      const label = '重绘区域';
      const textMetrics = ctx.measureText(label);
      const textWidth = textMetrics.width;
      const textHeight = fontSize;
      const padding = 12;
      
      // 计算文字位置（在选区上方）
      let textX = actualX;
      let textY = actualY - textHeight - padding * 2 - 5;
      
      // 如果文字会超出画布顶部，放到选区内部顶部
      if (textY < 0) {
        textY = actualY + padding;
      }
      
      // 绘制文字背景（红色）
      ctx.fillStyle = '#FF0000';
      ctx.fillRect(textX, textY, textWidth + padding * 2, textHeight + padding);
      
      // 绘制文字（白色）
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(label, textX + padding, textY + textHeight);
      console.log('文字标签绘制完成');
      
      // 转换为 base64
      const dataUrl = annotatedCanvas.toDataURL('image/png');
      console.log('标注图片生成成功！');
      console.log('Base64 长度:', dataUrl.length);
      console.log('Base64 前100字符:', dataUrl.substring(0, 100));
      
      return dataUrl;
    } catch (error) {
      console.error('生成标注图片失败:', error);
      return null;
    }
  };

  // 组件卸载时不要停止批量生成，允许后台继续
  useEffect(() => {
    return () => {
      // 移除原有的自动停止逻辑，允许跨页面生成
      // stopBatchRef.current = true;
    };
  }, []);

  const handleBatchGenerateImages = async () => {
      const isRegenerate = allStartFramesGenerated;
      
      let shotsToProcess = [];
      if (isRegenerate) {
          if (!window.confirm("确定要重新生成所有镜头的首帧吗？这将覆盖现有图片。")) return;
          shotsToProcess = [...project.shots];
      } else {
          // Process shots that don't have a start image URL (handles missing keyframe objects too)
          shotsToProcess = project.shots.filter(s => !s.keyframes?.find(k => k.type === 'start')?.imageUrl);
      }
      
      if (shotsToProcess.length === 0) return;

      // 重置停止标记
      stopBatchRef.current = false;
      setIsBatchStopping(false);

      // 维护一个实时的 shots 数组，用于在生成过程中为后续镜头提供参考图
      let currentShots = [...project.shots];

      setBatchProgress({ 
          current: 0, 
          total: shotsToProcess.length, 
          message: isRegenerate ? "正在重新生成所有首帧..." : "正在批量生成缺失的首帧..." 
      });

      for (let i = 0; i < shotsToProcess.length; i++) {
          // 检查是否被用户停止
          if (stopBatchRef.current) {
              console.log('用户停止了批量生成');
              break;
          }

          // Rate Limit Mitigation: 3s delay
          if (i > 0) await new Promise(r => setTimeout(r, 3000));

          // 再次检查防止延迟期间被停止
          if (stopBatchRef.current) break;
          
          const shot = shotsToProcess[i];
          setBatchProgress({ 
              current: i + 1, 
              total: shotsToProcess.length, 
              message: `正在生成镜头 ${i+1}/${shotsToProcess.length}...` 
          });
          
          try {
             // 每次生成前，从当前正在生成的数组中获取最新的镜头数据
             const latestShot = currentShots.find((s: Shot) => s.id === shot.id) || shot;
             
             const existingKf = latestShot.keyframes?.find((k: Keyframe) => k.type === 'start');
             let prompt = existingKf?.visualPrompt || latestShot.actionSummary;
             const kfId = existingKf?.id || `kf-${latestShot.id}-start-${Date.now()}`;

             // 如果是场景的第一个镜头且没有自定义提示词，则强化提示词要求
             if (!existingKf?.visualPrompt) {
                const shotsInScene = currentShots.filter(s => String(s.sceneId) === String(latestShot.sceneId));
                if (shotsInScene.length > 0 && shotsInScene[0].id === latestShot.id) {
                    const allCharNames = latestShot.characters.map(id => {
                        const char = project.scriptData?.characters.find(c => String(c.id) === String(id));
                        return char?.name || id;
                    }).join(', ');
                    prompt = `Wide shot, full scene composition. All characters (${allCharNames}) are present in the scene, showing their initial positions. ${prompt}`;
                    console.log('批量生成 - 强化首镜头提示词:', prompt);
                }
             }

             // 获取参考图：传入 currentShots 保证能获取到当前循环中刚刚生成的“场景首帧”
             const referenceImages = getRefImagesForShot(latestShot, currentShots);
             // 关键帧使用 2560x1440 尺寸
             const keyframeSize = { width: 2560, height: 1440 };
             const url = await generateImage(
               prompt, 
               referenceImages, 
               project.imageModel || undefined, 
               project.sessionId, 
               keyframeSize,
               project.imageStyle
             );

             // 更新 local currentShots 供下一次迭代使用
             currentShots = currentShots.map((s: Shot) => {
                if (s.id !== latestShot.id) return s;
                const newKeyframes = [...(s.keyframes || [])];
                const kIdx = newKeyframes.findIndex((k: Keyframe) => k.type === 'start');
                const newKf: Keyframe = {
                    id: kfId,
                    type: 'start',
                    visualPrompt: kIdx >= 0 ? newKeyframes[kIdx].visualPrompt : prompt,
                    imageUrl: url,
                    status: 'completed'
                };
                if (kIdx >= 0) newKeyframes[kIdx] = newKf;
                else newKeyframes.push(newKf);
                return { ...s, keyframes: newKeyframes };
             });

             // 自动加入本地资源库
             try {
                const shotIndex = currentShots.findIndex((s: Shot) => s.id === latestShot.id);
                const scene = project.scriptData?.scenes.find((sc: any) => String(sc.id) === String(latestShot.sceneId));
                await addAssetToLibrary({
                    type: 'scene',
                    name: `镜头 ${shotIndex + 1} 起始帧 (批量)`,
                    imageUrl: url,
                    visualPrompt: prompt,
                    metadata: {
                        shotNumber: shotIndex + 1,
                        atmosphere: scene?.atmosphere || undefined
                    }
                });
             } catch (err) {
                console.warn('自动加入资源库失败:', err);
             }

             // 更新 React State (为了 UI 同步)
             updateProject((prev: VideoGenProject | null) => {
                if (!prev) return null;
                return { ...prev, shots: currentShots };
             });

          } catch (e) {
             console.error(`Failed to generate for shot ${shot.id}`, e);
          }
      }

      setBatchProgress(null);
      setIsBatchStopping(false);
  };

  const handleStopBatch = () => {
      stopBatchRef.current = true;
      setIsBatchStopping(true);
      setBatchProgress(project.batchProgress ? { ...project.batchProgress, message: '正在停止中...' } : null);
  };

  const handleVariationChange = (shotId: string, charId: string, varId: string) => {
     updateShot(shotId, (s) => ({
         ...s,
         characterVariations: {
             ...(s.characterVariations || {}),
             [charId]: varId
         }
     }));
  };

  const handleImageTypeChange = (shotId: string, charId: string, type: 'base' | 'threeview') => {
     updateShot(shotId, (s) => ({
         ...s,
         characterImageTypes: {
             ...(s.characterImageTypes || {}),
             [charId]: type
         }
     }));
  };

  // 添加角色到镜头
  const handleAddCharacter = (shotId: string, charId: string) => {
    updateShot(shotId, (s) => {
      if (s.characters.includes(charId)) return s;
      return { ...s, characters: [...s.characters, charId] };
    });
  };

  // 从镜头移除角色
  const handleRemoveCharacter = (shotId: string, charId: string) => {
    updateShot(shotId, (s) => ({
      ...s,
      characters: s.characters.filter(id => id !== charId)
    }));
  };

  // 切换镜头的场景
  const handleChangeScene = (shotId: string, sceneId: string) => {
    updateShot(shotId, (s) => ({
      ...s,
      sceneId: sceneId
    }));
  };

  // 开始编辑动作描述
  const handleStartEditAction = () => {
    if (activeShot) {
      setTempActionValue(activeShot.actionSummary);
      setEditingAction(true);
    }
  };

  // 保存动作描述
  const handleSaveAction = () => {
    if (activeShot && tempActionValue.trim()) {
      updateShot(activeShot.id, (s) => ({
        ...s,
        actionSummary: tempActionValue.trim()
      }));
      setEditingAction(false);
    }
  };

  // 取消编辑动作描述
  const handleCancelEditAction = () => {
    setEditingAction(false);
    setTempActionValue('');
  };

  // 开始编辑对白
  const handleStartEditDialogue = () => {
    if (activeShot) {
      setTempDialogueValue(activeShot.dialogue || '');
      setEditingDialogue(true);
    }
  };

  // 保存对白
  const handleSaveDialogue = () => {
    if (activeShot) {
      updateShot(activeShot.id, (s) => ({
        ...s,
        dialogue: tempDialogueValue.trim() || undefined
      }));
      setEditingDialogue(false);
    }
  };

  // 取消编辑对白
  const handleCancelEditDialogue = () => {
    setEditingDialogue(false);
    setTempDialogueValue('');
  };

  // 开始编辑旁白
  const handleStartEditNarration = () => {
    if (activeShot) {
      setTempNarrationValue(activeShot.narration || '');
      setEditingNarration(true);
    }
  };

  // 保存旁白
  const handleSaveNarration = () => {
    if (activeShot) {
      updateShot(activeShot.id, (s) => ({
        ...s,
        narration: tempNarrationValue.trim() || undefined
      }));
      setEditingNarration(false);
    }
  };

  // 取消编辑旁白
  const handleCancelEditNarration = () => {
    setEditingNarration(false);
    setTempNarrationValue('');
  };

  // 开始编辑起始帧 Prompt
  const handleStartEditStartPrompt = () => {
    if (activeShot) {
      const kf = activeShot.keyframes?.find(k => k.type === 'start');
      setTempStartPrompt(kf?.visualPrompt || activeShot.actionSummary);
      setEditingStartPrompt(true);
    }
  };

  // 保存起始帧 Prompt
  const handleSaveStartPrompt = () => {
    if (activeShot && tempStartPrompt.trim()) {
      updateShot(activeShot.id, (s) => {
        const newKeyframes = [...(s.keyframes || [])];
        const idx = newKeyframes.findIndex(k => k.type === 'start');
        if (idx >= 0) {
          newKeyframes[idx] = { ...newKeyframes[idx], visualPrompt: tempStartPrompt.trim() };
        } else {
          newKeyframes.push({
            id: `kf-${s.id}-start-${Date.now()}`,
            type: 'start',
            visualPrompt: tempStartPrompt.trim(),
            status: 'pending'
          });
        }
        return { ...s, keyframes: newKeyframes };
      });
      setEditingStartPrompt(false);
    }
  };

  // 取消编辑起始帧 Prompt
  const handleCancelEditStartPrompt = () => {
    setEditingStartPrompt(false);
    setTempStartPrompt('');
  };

  // 开始编辑结束帧 Prompt
  const handleStartEditEndPrompt = () => {
    if (activeShot) {
      const kf = activeShot.keyframes?.find(k => k.type === 'end');
      setTempEndPrompt(kf?.visualPrompt || activeShot.actionSummary);
      setEditingEndPrompt(true);
    }
  };

  // 保存结束帧 Prompt
  const handleSaveEndPrompt = () => {
    if (activeShot && tempEndPrompt.trim()) {
      updateShot(activeShot.id, (s) => {
        const newKeyframes = [...(s.keyframes || [])];
        const idx = newKeyframes.findIndex(k => k.type === 'end');
        if (idx >= 0) {
          newKeyframes[idx] = { ...newKeyframes[idx], visualPrompt: tempEndPrompt.trim() };
        } else {
          newKeyframes.push({
            id: `kf-${s.id}-end-${Date.now()}`,
            type: 'end',
            visualPrompt: tempEndPrompt.trim(),
            status: 'pending'
          });
        }
        return { ...s, keyframes: newKeyframes };
      });
      setEditingEndPrompt(false);
    }
  };

  // 取消编辑结束帧 Prompt
  const handleCancelEditEndPrompt = () => {
    setEditingEndPrompt(false);
    setTempEndPrompt('');
  };

  // 添加关键帧到资源库
  const handleAddKeyframeToLibrary = async (type: 'start' | 'end') => {
    if (!activeShot) return;
    
    const kf = activeShot.keyframes?.find(k => k.type === type);
    if (!kf || !kf.imageUrl) {
      alert('请先生成关键帧图片');
      return;
    }
    
    try {
      await addAssetToLibrary({
        type: 'scene', // 关键帧作为场景类型存储
        name: `镜头${activeShotIndex + 1}-${type === 'start' ? '起始帧' : '结束帧'}`,
        imageUrl: kf.imageUrl,
        visualPrompt: kf.visualPrompt,
        metadata: {
          location: `Shot ${activeShotIndex + 1}`,
          time: type === 'start' ? 'Start Frame' : 'End Frame',
          atmosphere: activeShot.actionSummary
        }
      });
      
      alert(`${type === 'start' ? '起始帧' : '结束帧'}已添加到资源库`);
    } catch (error: any) {
      console.error('添加到资源库失败:', error);
      if (error.name === 'NotFoundError' || error.message?.includes('object stores')) {
        alert('数据库需要更新。请刷新页面（F5）后重试。');
      } else {
        alert(`添加到资源库失败: ${error.message || '未知错误'}`);
      }
    }
  };

  // 打开资源库选择关键帧
  const handleOpenLibraryForKeyframe = async (type: 'start' | 'end') => {
    setLibraryType(type);
    setShowLibraryModal(true);
    setActiveLibraryTabId('local'); // 重置为本地资源库
    setProjectTabs([]); // 重置项目 tabs
    
    try {
      // 获取所有场景类型的资源（纯图片）
      const sceneAssets = await getAssetsFromLibrary('scene');
      // 获取所有视频类型的资源
      const videoAssets = await getAssetsFromLibrary('video');
      
      console.log('加载的场景资源:', sceneAssets.length);
      console.log('加载的视频资源:', videoAssets.length);
      
      // 合并所有资源
      const allAssets = [...sceneAssets, ...videoAssets];
      
      setLibraryAssets(allAssets);
      
      // 加载所有视频工作室项目作为 tabs
      const userId = localStorage.getItem('userId');
      if (userId) {
        setLoadingProjectTabs(true);
        try {
          const response = await chatApi.getSessionList(userId, 'mcpx-video-studio');
          if (response.code === 200) {
            const sessions = (response.rows || response.data || []) as any[];
            // 过滤掉当前项目
            const otherProjects = sessions
              .filter((s: any) => s.id !== project.sessionId)
              .map((s: any) => ({
                id: s.id,
                sessionId: s.id,
                title: s.sessionTitle || '未命名项目'
              }));
            setProjectTabs(otherProjects);
            console.log('✅ 加载了', otherProjects.length, '个其他项目');
          }
        } finally {
          setLoadingProjectTabs(false);
        }
      }
    } catch (error: any) {
      console.error('加载资源库失败:', error);
      if (error.name === 'NotFoundError' || error.message?.includes('object stores')) {
        alert('数据库需要更新。请刷新页面（F5）后重试。');
        setShowLibraryModal(false);
      } else {
        alert(`加载资源库失败: ${error.message || '未知错误'}`);
      }
    }
  };

  // 从资源库选择关键帧
  const handleSelectKeyframeFromLibrary = (asset: AssetLibraryItem) => {
    if (!activeShot) return;
    if (libraryType === 'video') return; // Type guard: this function only handles keyframes
    
    // 确定要使用的图片URL
    let imageUrl: string;
    
    if (asset.type === 'video') {
      // 如果是视频资源，根据选择的类型（起始帧/结束帧）选择对应的图片
      if (libraryType === 'start') {
        imageUrl = asset.startFrameUrl || asset.imageUrl;
      } else {
        imageUrl = asset.endFrameUrl || asset.imageUrl;
      }
    } else {
      // 如果是普通图片资源，直接使用 imageUrl
      imageUrl = asset.imageUrl;
    }
    
    updateShot(activeShot.id, (s) => {
      const newKeyframes = [...(s.keyframes || [])];
      const idx = newKeyframes.findIndex(k => k.type === libraryType);
      const newKf: Keyframe = {
        id: `kf-${s.id}-${libraryType}-${Date.now()}`,
        type: libraryType,
        visualPrompt: asset.visualPrompt || s.actionSummary,
        imageUrl: imageUrl,
        status: 'completed'
      };
      
      if (idx >= 0) {
        newKeyframes[idx] = newKf;
      } else {
        newKeyframes.push(newKf);
      }
      
      return { ...s, keyframes: newKeyframes };
    });
    
    setShowLibraryModal(false);
  };

  // 从资源库删除
  const handleDeleteFromLibrary = async (assetId: number) => {
    if (!window.confirm('确定要从资源库中删除这个资源吗？')) return;
    
    try {
      await deleteAssetFromLibrary(assetId);
      // 重新加载资源库
      const assetType = libraryType === 'video' ? 'video' : 'scene';
      const assets = await getAssetsFromLibrary(assetType);
      setLibraryAssets(assets);
    } catch (error) {
      console.error('删除资源失败:', error);
      alert('删除资源失败');
    }
  };

  // 添加视频到资源库
  const handleAddVideoToLibrary = async () => {
    if (!activeShot || !activeShot.interval?.videoUrl) {
      alert('请先生成视频');
      return;
    }
    
    try {
      // 使用起始帧和结束帧作为视频的关键帧
      const startFrameUrl = startKf?.imageUrl || '';
      const endFrameUrl = endKf?.imageUrl || '';
      
      // 生成带时间戳的名称，方便区分同一镜头的多个视频片段
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
      const dateStr = `${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
      
      // 获取场景信息用于命名
      const scene = project.scriptData?.scenes.find(s => String(s.id) === String(activeShot.sceneId));
      const sceneName = scene?.location || `场景${activeShot.sceneId}`;
      
      await addAssetToLibrary({
        type: 'video',
        name: `${sceneName} - 镜头${activeShotIndex + 1} (${dateStr} ${timeStr})`,
        imageUrl: startFrameUrl, // 使用起始帧作为缩略图
        videoUrl: activeShot.interval.videoUrl,
        startFrameUrl: startFrameUrl, // 保存起始帧
        endFrameUrl: endFrameUrl, // 保存结束帧
        visualPrompt: activeShot.actionSummary,
        metadata: {
          shotNumber: activeShotIndex + 1,
          duration: activeShot.interval.duration,
          atmosphere: activeShot.actionSummary,
          location: sceneName, // 保存场景名称
          time: `${dateStr} ${timeStr}` // 保存创建时间
        }
      });
      
      alert('视频已添加到资源库');
    } catch (error: any) {
      console.error('添加到资源库失败:', error);
      if (error.name === 'NotFoundError' || error.message?.includes('object stores')) {
        alert('数据库需要更新。请刷新页面（F5）后重试。');
      } else {
        alert(`添加到资源库失败: ${error.message || '未知错误'}`);
      }
    }
  };

  // 打开视频资源库
  const handleOpenVideoLibrary = async () => {
    setLibraryType('video');
    setShowLibraryModal(true);
    setActiveLibraryTabId('local'); // 重置为本地资源库
    setProjectTabs([]); // 重置项目 tabs
    
    try {
      // 只获取视频类型的资源
      const assets = await getAssetsFromLibrary('video');
      setLibraryAssets(assets);
      
      // 加载所有视频工作室项目作为 tabs
      const userId = localStorage.getItem('userId');
      if (userId) {
        setLoadingProjectTabs(true);
        try {
          const response = await chatApi.getSessionList(userId, 'mcpx-video-studio');
          if (response.code === 200) {
            const sessions = (response.rows || response.data || []) as any[];
            // 过滤掉当前项目
            const otherProjects = sessions
              .filter((s: any) => s.id !== project.sessionId)
              .map((s: any) => ({
                id: s.id,
                sessionId: s.id,
                title: s.sessionTitle || '未命名项目'
              }));
            setProjectTabs(otherProjects);
            console.log('✅ 加载了', otherProjects.length, '个其他项目');
          }
        } finally {
          setLoadingProjectTabs(false);
        }
      }
    } catch (error: any) {
      console.error('加载视频资源库失败:', error);
      if (error.name === 'NotFoundError' || error.message?.includes('object stores')) {
        alert('数据库需要更新。请刷新页面（F5）后重试。');
        setShowLibraryModal(false);
      } else {
        alert(`加载视频资源库失败: ${error.message || '未知错误'}`);
      }
    }
  };

  // 加载跨项目资源
  const loadCrossProjectAssets = async (sessionId: string) => {
    setLoadingCrossAssets(true);
    setCrossProjectAssets([]);
    
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        throw new Error('用户未登录');
      }

      // 获取该项目的聊天记录
      const response = await chatApi.getChatList({ sessionId, userId });
      if (response.code !== 200) {
        throw new Error('加载项目数据失败');
      }

      const messages = (response.rows || response.data || []) as any[];
      const assets: Array<{
        type: 'image' | 'video';
        url: string;
        thumbnailUrl?: string;
        prompt?: string;
        source: string;
      }> = [];

      // 从消息中提取图片和视频 URL
      const urlRegex = /(https?:\/\/[^\s<>"]+?\.(jpg|jpeg|png|gif|webp|mp4|mov|avi))/gi;
      
      messages.forEach((msg: any) => {
        if (msg.content) {
          const matches = msg.content.matchAll(urlRegex);
          for (const match of matches) {
            const url = match[1];
            const ext = match[2].toLowerCase();
            const isVideo = ['mp4', 'mov', 'avi'].includes(ext);
            
            assets.push({
              type: isVideo ? 'video' : 'image',
              url: url,
              source: `消息 #${msg.id?.slice(0, 8) || 'unknown'}`,
              prompt: msg.content.substring(0, 100)
            });
          }
        }
      });

      // 尝试从 sessionContent 解析项目数据
      const session = await chatApi.getSessionList(userId, 'mcpx-video-studio');
      if (session.code === 200) {
        const sessions = (session.rows || session.data || []) as any[];
        const targetSession = sessions.find((s: any) => s.id === sessionId);
        if (targetSession?.sessionContent) {
          try {
            const projectData = JSON.parse(targetSession.sessionContent);
            
            // 提取关键帧图片
            if (projectData.shots) {
              projectData.shots.forEach((shot: any, index: number) => {
                if (shot.keyframes) {
                  shot.keyframes.forEach((kf: any) => {
                    if (kf.imageUrl) {
                      assets.push({
                        type: 'image',
                        url: kf.imageUrl,
                        source: `镜头${index + 1} ${kf.type === 'start' ? '起始帧' : '结束帧'}`,
                        prompt: kf.visualPrompt
                      });
                    }
                  });
                }
                
                // 提取视频
                if (shot.interval?.videoUrl) {
                  const startKf = shot.keyframes?.find((k: any) => k.type === 'start');
                  assets.push({
                    type: 'video',
                    url: shot.interval.videoUrl,
                    thumbnailUrl: startKf?.imageUrl,
                    source: `镜头${index + 1} 视频`,
                    prompt: shot.actionSummary
                  });
                }
              });
            }
          } catch (parseError) {
            console.warn('解析项目数据失败:', parseError);
          }
        }
      }

      // 去重
      const uniqueAssets = assets.filter((asset, index, self) =>
        index === self.findIndex((a) => a.url === asset.url)
      );

      console.log('✅ 加载到', uniqueAssets.length, '个跨项目资源');
      setCrossProjectAssets(uniqueAssets);
    } catch (error: any) {
      console.error('加载跨项目资源失败:', error);
      alert(`加载失败: ${error.message || '未知错误'}`);
    } finally {
      setLoadingCrossAssets(false);
    }
  };

  // 当切换资源库 Tab 时
  const handleLibraryTabChange = (tabId: string) => {
    setActiveLibraryTabId(tabId);
    setPlayingVideos(new Set()); // 切换 tab 时清空播放状态
    
    if (tabId === 'local') {
      // 切换回本地资源库，不需要额外操作
      return;
    }
    
    // 切换到某个项目，加载该项目的资源
    const tab = projectTabs.find(t => t.id === tabId);
    if (tab?.sessionId) {
      loadCrossProjectAssets(tab.sessionId);
    }
  };

  // 从资源库选择视频
  const handleSelectVideoFromLibrary = (asset: AssetLibraryItem) => {
    if (!activeShot || !asset.videoUrl) return;
    
    updateShot(activeShot.id, (s) => {
      const sKf = s.keyframes?.find(k => k.type === 'start');
      const eKf = s.keyframes?.find(k => k.type === 'end');

      const currentInterval = s.interval || {
        id: `interval-${s.id}-${Date.now()}`,
        startKeyframeId: sKf?.id || '',
        endKeyframeId: eKf?.id || '',
        duration: asset.metadata?.duration || defaultDuration,
        motionStrength: 0.5,
        status: 'completed'
      };
      
      return {
        ...s,
        interval: {
          ...currentInterval,
          videoUrl: asset.videoUrl,
          status: 'completed' as const,
          duration: asset.metadata?.duration || currentInterval.duration,
          // 如果原来的 interval 没有 ID，确保这里有一个（虽然 currentInterval 已经处理了）
          startKeyframeId: sKf?.id || currentInterval.startKeyframeId,
          endKeyframeId: eKf?.id || currentInterval.endKeyframeId
        }
      };
    });
    
    setShowLibraryModal(false);
  };

  const goToPrevShot = () => {
    if (activeShotIndex > 0) {
      setActiveShotId(project.shots[activeShotIndex - 1].id);
    }
  };

  const goToNextShot = () => {
    if (activeShotIndex < project.shots.length - 1) {
      setActiveShotId(project.shots[activeShotIndex + 1].id);
    }
  };

  const renderSceneContext = () => {
      if (!activeShot || !project.scriptData) return null;
      // String comparison for safety
      const scene = project.scriptData.scenes.find(s => String(s.id) === String(activeShot.sceneId));
      const activeCharacters = project.scriptData.characters.filter(c => activeShot.characters.includes(c.id));
      const availableCharacters = project.scriptData.characters.filter(c => !activeShot.characters.includes(c.id));
      const otherScenes = project.scriptData.scenes.filter(s => String(s.id) !== String(activeShot.sceneId));

      return (
          <div className="bg-[#141414] p-5 rounded-xl border border-zinc-800 mb-6 space-y-4">
              <div className="flex items-center justify-between mb-2">
                 <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-zinc-500" />
                    <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">场景环境 (Scene Context)</h4>
                 </div>
                 
                 {/* 切换场景下拉菜单 */}
                 <div className="relative group/scene">
                    <button className="flex items-center gap-1.5 px-2 py-1 bg-zinc-800 hover:bg-zinc-700 rounded text-[10px] text-zinc-400 hover:text-white transition-colors">
                        <RefreshCw className="w-3 h-3" />
                        切换场景
                    </button>
                    <div className="absolute right-0 top-full mt-1 w-48 bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl opacity-0 invisible group-hover/scene:opacity-100 group-hover/scene:visible transition-all z-30 overflow-hidden">
                        <div className="max-h-60 overflow-y-auto">
                            {otherScenes.map(s => (
                                <button 
                                    key={s.id}
                                    onClick={() => handleChangeScene(activeShot.id, s.id)}
                                    className="w-full px-3 py-2 text-left text-xs text-zinc-400 hover:bg-zinc-800 hover:text-white border-b border-zinc-800 last:border-0"
                                >
                                    {s.location}
                                </button>
                            ))}
                        </div>
                    </div>
                 </div>
              </div>
              
              <div className="flex gap-4">
                  <div className="w-28 h-20 bg-zinc-900 rounded-lg overflow-hidden flex-shrink-0 border border-zinc-700 relative">
                    {scene?.referenceImage ? (
                      <img src={scene.referenceImage} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-zinc-800">
                          <MapPin className="w-6 h-6 text-zinc-700" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-white text-sm font-bold">{scene?.location || '未知场景'}</span>
                        <span className="text-sm px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded-full flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {scene?.time}
                        </span>
                    </div>
                    <p className="text-xs text-zinc-500 line-clamp-2">{scene?.atmosphere}</p>
                    
                    {/* Character List with Variation Selector */}
                    <div className="flex flex-col gap-2 pt-2">
                         <div className="flex items-center justify-between mb-1">
                             <span className="text-[10px] font-bold text-zinc-500 uppercase">出场角色</span>
                             
                             {/* 添加角色按钮 */}
                             {availableCharacters.length > 0 && (
                                 <div className="relative group/add-char">
                                    <button className="flex items-center gap-1 text-[10px] text-indigo-400 hover:text-indigo-300 font-bold uppercase transition-colors">
                                        <Plus className="w-3 h-3" />
                                        添加
                                    </button>
                                    <div className="absolute right-0 top-full mt-1 w-40 bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl opacity-0 invisible group-hover/add-char:opacity-100 group-hover/add-char:visible transition-all z-30 overflow-hidden">
                                        {availableCharacters.map(char => (
                                            <button 
                                                key={char.id}
                                                onClick={() => handleAddCharacter(activeShot.id, char.id)}
                                                className="w-full px-3 py-2 text-left text-xs text-zinc-400 hover:bg-zinc-800 hover:text-white border-b border-zinc-800 last:border-0 flex items-center gap-2"
                                            >
                                                <UserPlus className="w-3 h-3 opacity-50" />
                                                {char.name}
                                            </button>
                                        ))}
                                    </div>
                                 </div>
                             )}
                         </div>

                         {activeCharacters.map(char => {
                             const hasVars = char.variations && char.variations.length > 0;
                             return (
                                 <div key={char.id} className="group/char flex items-center justify-between bg-zinc-900 rounded p-1.5 border border-zinc-800">
                                     <div className="flex items-center gap-2">
                                         <div className="w-6 h-6 rounded-full bg-zinc-700 overflow-hidden">
                                             {char.referenceImage && <img src={char.referenceImage} className="w-full h-full object-cover" />}
                                         </div>
                                         <span className="text-[11px] text-zinc-300 font-medium">{char.name}</span>
                                     </div>
                                     
                                     <div className="flex items-center gap-2">
                                         {char.threeViewImage && (
                                             <select 
                                                value={activeShot.characterImageTypes?.[char.id] || "base"}
                                                onChange={(e) => handleImageTypeChange(activeShot.id, char.id, e.target.value as 'base' | 'threeview')}
                                                className="bg-black text-[10px] text-zinc-400 border border-zinc-700 rounded px-1.5 py-0.5 max-w-[100px] outline-none focus:border-indigo-500"
                                             >
                                                 <option value="base">剧照 (Photo)</option>
                                                 <option value="threeview">三视图 (3-View)</option>
                                             </select>
                                         )}
                                         {hasVars && (
                                             <select 
                                                value={activeShot.characterVariations?.[char.id] || ""}
                                                onChange={(e) => handleVariationChange(activeShot.id, char.id, e.target.value)}
                                                className="bg-black text-[10px] text-zinc-400 border border-zinc-700 rounded px-1.5 py-0.5 max-w-[100px] outline-none focus:border-indigo-500"
                                             >
                                                 <option value="">Default Look</option>
                                                 {char.variations.map(v => (
                                                     <option key={v.id} value={v.id}>{v.name}</option>
                                                 ))}
                                             </select>
                                         )}
                                         <button 
                                            onClick={() => handleRemoveCharacter(activeShot.id, char.id)}
                                            className="p-1 text-zinc-600 hover:text-red-400 opacity-0 group-hover/char:opacity-100 transition-opacity"
                                            title="移除角色"
                                         >
                                            <UserMinus className="w-3.5 h-3.5" />
                                         </button>
                                     </div>
                                 </div>
                             );
                         })}
                         {activeCharacters.length === 0 && (
                             <p className="text-[10px] text-zinc-600 italic py-1">镜头中没有角色</p>
                         )}
                    </div>
                  </div>
              </div>
          </div>
      );
  };

  if (!project.shots.length) return (
      <div className="flex flex-col items-center justify-center h-full text-zinc-500 bg-[#121212]">
          <AlertCircle className="w-12 h-12 mb-4 opacity-50"/>
          <p>暂无镜头数据，请先返回阶段 1 生成分镜表。</p>
      </div>
  );

  return (
    <div className="flex flex-col h-full bg-[#121212] relative overflow-hidden">
      
      {/* Project Saving Overlay */}
      {savingProject && (
        <div className="absolute inset-0 z-50 bg-black/80 flex flex-col items-center justify-center backdrop-blur-md animate-in fade-in">
           <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-6" />
           <h3 className="text-xl font-bold text-white mb-2">项目保存中</h3>
           <p className="text-zinc-500 text-sm font-mono">正在保存您的项目，请稍候...</p>
        </div>
      )}

      {/* Toolbar */}
      <div className="h-16 border-b border-zinc-800 bg-[#1A1A1A] px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-3">
                  <LayoutGrid className="w-5 h-5 text-indigo-500" />
                  导演工作台
                  <span className="text-xs text-zinc-600 font-mono font-normal uppercase tracking-wider bg-black/30 px-2 py-1 rounded">Director Workbench</span>
              </h2>
          </div>

          <div className="flex items-center gap-3">
              {/* 视频模型选择器 */}
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-zinc-500" />
                <select
                  value={localVideoModel}
                  onChange={(e) => setLocalVideoModel(e.target.value)}
                  disabled={loadingModels}
                  className="bg-[#141414] border border-zinc-700 text-white px-3 py-1.5 text-xs rounded-md appearance-none focus:border-zinc-500 focus:outline-none transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed min-w-[200px]"
                >
                  {loadingModels ? (
                    <option value="">加载中...</option>
                  ) : videoModels.length === 0 ? (
                    <option value="">暂无视频模型</option>
                  ) : (
                    videoModels.map((model) => {
                      // 组合显示：modelDescribe - remark
                      const describe = model.modelDescribe || model.modelName;
                      const remark = model.remark ? ` - ${model.remark}` : '';
                      return (
                        <option key={model.id} value={model.modelName} title={model.remark}>
                          {describe}{remark}
                        </option>
                      );
                    })
                  )}
                </select>
              </div>
              
              {/* 视频分辨率选择器 */}
              <div className="flex items-center gap-2">
                <Maximize2 className="w-4 h-4 text-zinc-500" />
                <select
                  value={localVideoResolution}
                  onChange={(e) => setLocalVideoResolution(e.target.value as '480P' | '720P' | '1080P')}
                  className="bg-[#141414] border border-zinc-700 text-white px-3 py-1.5 text-xs rounded-md appearance-none focus:border-zinc-500 focus:outline-none transition-all cursor-pointer"
                >
                  <option value="480P">480P (854×480)</option>
                  <option value="720P">720P (1280×720)</option>
                  <option value="1080P">1080P (1920×1080)</option>
                </select>
              </div>

              {/* 视频比例选择器 */}
              <div className="flex items-center gap-2">
                <Maximize2 className="w-4 h-4 text-zinc-500" />
                <select
                  value={localVideoRatio}
                  onChange={(e) => setLocalVideoRatio(e.target.value as '16:9' | '9:16' | '1:1')}
                  className="bg-[#141414] border border-zinc-700 text-white px-3 py-1.5 text-xs rounded-md appearance-none focus:border-zinc-500 focus:outline-none transition-all cursor-pointer"
                >
                  <option value="16:9">16:9</option>
                  <option value="9:16">9:16</option>
                  <option value="1:1">1:1</option>
                </select>
              </div>
              
              {/* 音频上传（仅阿里云模型显示） */}
              {isAliyunModel && (
                <div className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-zinc-500" />
                  {uploadedAudioName ? (
                    <div className="flex items-center gap-2 bg-[#141414] border border-green-700 text-green-400 px-3 py-1.5 text-xs rounded-md">
                      <span className="max-w-[120px] truncate" title={uploadedAudioName}>{uploadedAudioName}</span>
                      <button
                        onClick={handleClearAudio}
                        className="text-red-400 hover:text-red-300 transition-colors"
                        title="移除音频"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <label className="bg-[#141414] border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 px-3 py-1.5 text-xs rounded-md cursor-pointer transition-all flex items-center gap-1">
                      <Upload className="w-3 h-3" />
                      上传音频
                      <input
                        type="file"
                        accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleUploadAudio(file);
                          e.target.value = ''; // 重置 input
                        }}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              )}
              
              <div className="w-px h-6 bg-zinc-700"></div>
              
              <span className="text-xs text-zinc-500 mr-4 font-mono">
                  {project.shots.filter(s => s.interval?.videoUrl).length} / {project.shots.length} 完成
              </span>
              <button 
                  onClick={handleBatchGenerateImages}
                  disabled={!!batchProgress}
                  className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-all flex items-center gap-2 ${
                      allStartFramesGenerated
                        ? 'bg-[#141414] text-zinc-400 border border-zinc-700 hover:text-white hover:border-zinc-500'
                        : 'bg-white text-black hover:bg-zinc-200 shadow-lg shadow-white/5'
                  }`}
              >
                  <Sparkles className="w-3 h-3" />
                  {allStartFramesGenerated ? '重新生成所有首帧' : '批量生成首帧'}
              </button>
          </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden flex">
          
          {/* Grid View - Responsive Logic */}
          <div ref={leftPanelRef} className="flex-1 min-w-[200px] overflow-y-auto p-4 transition-all duration-500 ease-in-out">
              {batchProgress && (
                <div className="mb-6 bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4 flex items-center gap-4 animate-in slide-in-from-top-4 duration-300">
                  <div className="w-10 h-10 bg-indigo-500/20 rounded-lg flex items-center justify-center shrink-0">
                    <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-end mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <h3 className="text-sm font-bold text-white truncate">{batchProgress.message}</h3>
                        <span className="text-[10px] font-mono text-indigo-400 shrink-0">
                          {batchProgress.current} / {batchProgress.total} ({Math.round((batchProgress.current / batchProgress.total) * 100)}%)
                        </span>
                      </div>
                      {!isBatchStopping && (
                        <button 
                          onClick={handleStopBatch}
                          className="px-2 py-1 bg-red-500/20 hover:bg-red-500/40 text-red-400 text-[10px] font-bold uppercase rounded transition-colors"
                        >
                          停止生成
                        </button>
                      )}
                    </div>
                    <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-indigo-500 transition-all duration-300" 
                        style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}
              <div className={`grid gap-4 ${activeShotId ? (leftPanelWidth > 500 ? 'grid-cols-2' : 'grid-cols-1 max-w-sm mx-auto') : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'}`}>
                  {project.shots.map((shot, idx) => {
                      const sKf = shot.keyframes?.find((k: Keyframe) => k.type === 'start');
                      const hasImage = !!sKf?.imageUrl;
                      const hasVideo = !!shot.interval?.videoUrl;
                      const isActive = activeShotId === shot.id;

                      return (
                          <div 
                              key={shot.id}
                              onClick={() => setActiveShotId(shot.id)}
                              className={`
                                  group relative flex flex-col bg-[#1A1A1A] border rounded-xl overflow-hidden cursor-pointer transition-all duration-200
                                  ${isActive ? 'border-indigo-500 ring-1 ring-indigo-500/50 shadow-xl scale-[0.98]' : 'border-zinc-800 hover:border-zinc-600 hover:shadow-lg'}
                              `}
                          >
                              {/* Header */}
                              <div className="px-3 py-2 bg-[#151515] border-b border-zinc-800 flex justify-between items-center">
                                  <div className="flex items-center gap-2">
                                      <span className={`font-mono text-[11px] font-bold ${isActive ? 'text-indigo-400' : 'text-zinc-500'}`}>SHOT {String(idx + 1).padStart(2, '0')}</span>
                                      <button 
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleAddShot(idx);
                                          }}
                                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-green-900/40 rounded text-zinc-500 hover:text-green-400 transition-all"
                                          title="在此后添加镜头"
                                      >
                                          <Plus className="w-3.5 h-3.5" />
                                      </button>
                                      <button 
                                          onClick={(e) => handleDeleteShot(shot.id, e)}
                                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-900/40 rounded text-zinc-500 hover:text-red-400 transition-all"
                                          title="删除镜头"
                                      >
                                          <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                  </div>
                                  <span className="text-[11px] px-1.5 py-0.5 bg-zinc-800 text-zinc-400 rounded uppercase">{shot.cameraMovement}</span>
                              </div>

                              {/* Thumbnail */}
                              <div className="aspect-video bg-zinc-900 relative overflow-hidden">
                                  {hasImage ? (
                                      <img src={sKf!.imageUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                  ) : (
                                      <div className="absolute inset-0 flex items-center justify-center text-zinc-800">
                                          <ImageIcon className="w-8 h-8 opacity-20" />
                                      </div>
                                  )}
                                  
                                  {/* Badges */}
                                  <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
                                      {hasVideo && <div className="p-1 bg-green-500 text-white rounded shadow-lg backdrop-blur"><Video className="w-3 h-3" /></div>}
                                  </div>

                                  {!activeShotId && !hasImage && (
                                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                          <span className="text-[10px] text-white font-bold uppercase tracking-wider bg-zinc-900/90 px-3 py-1.5 rounded-full border border-white/10 backdrop-blur">点击生成</span>
                                      </div>
                                  )}
                              </div>

                              {/* Footer */}
                              <div className="p-3">
                                  <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                                      {shot.actionSummary}
                                  </p>
                              </div>
                          </div>
                      );
                  })}
                  
                  {/* Add Shot Card */}
                  <div 
                      onClick={() => handleAddShot()}
                      className="group relative flex flex-col bg-[#1A1A1A]/50 border-2 border-dashed border-zinc-800 rounded-xl overflow-hidden cursor-pointer transition-all duration-200 hover:border-indigo-500/50 hover:bg-[#1A1A1A]"
                  >
                      <div className="aspect-video bg-zinc-900/30 relative overflow-hidden flex items-center justify-center">
                          <div className="flex flex-col items-center gap-3 text-zinc-600 group-hover:text-indigo-400 transition-colors">
                              <Plus className="w-12 h-12" />
                              <span className="text-xs font-bold uppercase tracking-wider">添加镜头</span>
                          </div>
                      </div>
                      <div className="p-3 text-center">
                          <p className="text-xs text-zinc-600 group-hover:text-zinc-400 transition-colors">
                              点击创建新镜头
                          </p>
                      </div>
                  </div>
              </div>
          </div>

          {/* Draggable Divider */}
          {activeShotId && (
              <div 
                onMouseDown={handleResizeMouseDown}
                className={`w-1.5 h-full cursor-col-resize hover:bg-indigo-500/50 transition-colors flex items-center justify-center group relative z-30 ${isResizing ? 'bg-indigo-500' : 'bg-transparent'}`}
              >
                  <div className="w-[1px] h-12 bg-zinc-800 group-hover:bg-indigo-400/50"></div>
              </div>
          )}

          {/* Right Workbench - Optimized Interaction */}
          {activeShotId && activeShot && (
              <div 
                className="bg-[#0F0F0F] flex flex-col h-full shadow-2xl animate-in slide-in-from-right-10 duration-300 relative z-20 shrink-0"
                style={{ width: rightPanelWidth }}
              >
                  
                  {/* Workbench Header */}
                  <div className="h-16 px-6 border-b border-zinc-800 flex items-center justify-between bg-[#141414] shrink-0">
                       <div className="flex items-center gap-3">
                           <span className="w-8 h-8 bg-indigo-900/30 text-indigo-400 rounded-lg flex items-center justify-center font-bold font-mono text-sm border border-indigo-500/20">
                              {String(activeShotIndex + 1).padStart(2, '0')}
                           </span>
                           <div>
                               <h3 className="text-white font-bold text-sm">镜头详情</h3>
                               <p className="text-[12px] text-zinc-500 uppercase tracking-widest">{activeShot.cameraMovement}</p>
                           </div>
                       </div>
                       
                       <div className="flex items-center gap-1">
                           <button onClick={goToPrevShot} disabled={activeShotIndex === 0} className="p-2 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white disabled:opacity-20 transition-colors">
                               <ChevronLeft className="w-4 h-4" />
                           </button>
                           <button onClick={goToNextShot} disabled={activeShotIndex === project.shots.length - 1} className="p-2 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white disabled:opacity-20 transition-colors">
                               <ChevronRight className="w-4 h-4" />
                           </button>
                           <div className="w-px h-4 bg-zinc-700 mx-2"></div>
                           <button onClick={(e) => handleDeleteShot(activeShot.id, e)} className="p-2 hover:bg-red-900/20 rounded text-zinc-400 hover:text-red-400 transition-colors" title="删除当前镜头">
                               <Trash2 className="w-4 h-4" />
                           </button>
                           <button onClick={() => setActiveShotId(null)} className="p-2 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white transition-colors">
                               <X className="w-4 h-4" />
                           </button>
                       </div>
                  </div>

                  {/* Workbench Content */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-8">
                       
                       {/* Section 3: Visual Production */}
                       <div className="space-y-4">
                           <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
                               <Aperture className="w-4 h-4 text-zinc-500" />
                               <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">视觉制作 (Visual Production)</h4>
                           </div>

                           <div className="grid grid-cols-2 gap-4">
                               {/* Start Frame */}
                                  <div className="space-y-2">
                                      <div className="flex justify-between items-center mb-1">
                                          <span className="text-[14px] font-bold text-zinc-500 uppercase tracking-widest">起始帧 (Start)</span>
                                      </div>
                                      
                                      {/* Prompt 编辑区 */}
                                      <div className="bg-[#0A0A0A] p-2 rounded border border-zinc-800">
                                          {editingStartPrompt ? (
                                              <div className="space-y-2">
                                                  <textarea
                                                      value={tempStartPrompt}
                                                      onChange={(e) => setTempStartPrompt(e.target.value)}
                                                      className="w-full bg-black border border-zinc-700 rounded px-2 py-1 text-[14px] text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500 resize-none h-[200px]"
                                                      placeholder="输入起始帧提示词..."
                                                  />
                                                  <div className="flex gap-1">
                                                      <button
                                                          onClick={handleCancelEditStartPrompt}
                                                          className="flex-1 px-2 py-1 bg-zinc-700 hover:bg-zinc-600 text-white text-[12px] font-bold uppercase rounded transition-colors"
                                                      >
                                                          取消
                                                      </button>
                                                      <button
                                                          onClick={handleSaveStartPrompt}
                                                          className="flex-1 px-2 py-1 bg-indigo-500 hover:bg-indigo-600 text-white text-[12px] font-bold uppercase rounded transition-colors"
                                                      >
                                                          保存
                                                      </button>
                                                  </div>
                                              </div>
                                          ) : (
                                              <div className="group">
                                                  <p className="text-[14px] text-zinc-400 mb-1 font-mono whitespace-pre-wrap max-h-[500px] overflow-y-auto leading-relaxed">
                                                      {startKf?.visualPrompt || activeShot.actionSummary}
                                                  </p>
                                                  <button
                                                      onClick={handleStartEditStartPrompt}
                                                      className="text-[11px] text-indigo-400 hover:text-indigo-300 font-bold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1"
                                                  >
                                                      <Edit2 className="w-2 h-2" />
                                                      编辑提示词
                                                  </button>
                                              </div>
                                          )}
                                      </div>
                                   
                                   {/* 图片显示区 */}
                                   <div className="aspect-video bg-black rounded-lg border border-zinc-800 overflow-hidden relative group">
                                       {startKf?.imageUrl ? (
                                           <>
                                               <img 
                                                   src={startKf.imageUrl} 
                                                   className="w-full h-full object-contain cursor-pointer hover:opacity-90 transition-opacity" 
                                                   onClick={(e) => {
                                                       console.log('=== 起始帧图片被点击 ===');
                                                       console.log('事件对象:', e);
                                                       console.log('activeShot:', activeShot);
                                                       handleOpenImageEditor(activeShot, 'start');
                                                   }}
                                                   alt="起始帧"
                                               />
                                               <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                                                   <div className="text-center">
                                                       <Edit2 className="w-6 h-6 text-white mx-auto mb-2" />
                                                       <p className="text-white text-xs font-bold">点击编辑</p>
                                                   </div>
                                               </div>
                                           </>
                                       ) : (
                                           <div className="absolute inset-0 flex items-center justify-center">
                                               <div className="w-2 h-2 rounded-full bg-zinc-800"></div>
                                           </div>
                                       )}
                                       {/* Loading State */}
                                       {((startKf && processingState?.id === startKf.id) || (processingState?.type === 'kf_start' && !startKf)) && (
                                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                                <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
                                            </div>
                                       )}
                                   </div>
                                   
                                   {/* 操作按钮 */}
                                   <div className="flex gap-1">
                                       <button 
                                           onClick={() => handleGenerateKeyframe(activeShot, 'start')}
                                           disabled={processingState?.type === 'kf_start'}
                                           className="flex-1 px-2 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold uppercase rounded transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                                       >
                                           <Sparkles className="w-3 h-3" />
                                           {startKf?.imageUrl ? '重新生成' : '生成'}
                                       </button>
                                       <button 
                                           onClick={() => handleOpenLibraryForKeyframe('start')}
                                           className="px-2 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-white text-[11px] font-bold uppercase rounded transition-colors flex items-center justify-center"
                                           title="从资源库选择"
                                       >
                                           <FolderOpen className="w-3 h-3" />
                                       </button>
                                       <label className="px-2 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-white text-[11px] font-bold uppercase rounded transition-colors flex items-center justify-center cursor-pointer" title="上传图片">
                                           <Upload className="w-3 h-3" />
                                           <input 
                                               type="file" 
                                               accept="image/*" 
                                               className="hidden"
                                               onClick={(e) => { (e.target as HTMLInputElement).value = ''; }}
                                               onChange={(e) => {
                                                   const file = e.target.files?.[0];
                                                   if (file) handleUploadKeyframe(activeShot, 'start', file);
                                               }}
                                           />
                                       </label>
                                       {startKf?.imageUrl && (
                                           <>
                                               <button 
                                                   onClick={() => handleAddKeyframeToLibrary('start')}
                                                   className="px-2 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-white text-[11px] font-bold uppercase rounded transition-colors flex items-center justify-center"
                                                   title="加入资源库"
                                               >
                                                   <Database className="w-3 h-3" />
                                               </button>
                                               <button 
                                                   onClick={() => handleDeleteKeyframe(activeShot, 'start')}
                                                   className="px-2 py-1.5 bg-red-600 hover:bg-red-500 text-white text-[11px] font-bold uppercase rounded transition-colors flex items-center justify-center"
                                                   title="删除"
                                               >
                                                   <Trash2 className="w-3 h-3" />
                                               </button>
                                           </>
                                       )}
                                   </div>
                               </div>

                               {/* End Frame */}
                                  <div className="space-y-2">
                                      <div className="flex justify-between items-center mb-1">
                                          <span className="text-[14px] font-bold text-zinc-500 uppercase tracking-widest">结束帧 (End)</span>
                                      </div>
                                      
                                      {/* Prompt 编辑区 */}
                                      <div className="bg-[#0A0A0A] p-2 rounded border border-zinc-800">
                                          {editingEndPrompt ? (
                                              <div className="space-y-2">
                                                  <textarea
                                                      value={tempEndPrompt}
                                                      onChange={(e) => setTempEndPrompt(e.target.value)}
                                                      className="w-full bg-black border border-zinc-700 rounded px-2 py-1 text-[14px] text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500 resize-none h-[200px]"
                                                      placeholder="输入结束帧提示词..."
                                                  />
                                                  <div className="flex gap-1">
                                                      <button
                                                          onClick={handleCancelEditEndPrompt}
                                                          className="flex-1 px-2 py-1 bg-zinc-700 hover:bg-zinc-600 text-white text-[12px] font-bold uppercase rounded transition-colors"
                                                      >
                                                          取消
                                                      </button>
                                                      <button
                                                          onClick={handleSaveEndPrompt}
                                                          className="flex-1 px-2 py-1 bg-indigo-500 hover:bg-indigo-600 text-white text-[12px] font-bold uppercase rounded transition-colors"
                                                      >
                                                          保存
                                                      </button>
                                                  </div>
                                              </div>
                                          ) : (
                                              <div className="group">
                                                  <p className="text-[14px] text-zinc-400 mb-1 font-mono whitespace-pre-wrap max-h-[500px] overflow-y-auto leading-relaxed">
                                                      {endKf?.visualPrompt || activeShot.actionSummary}
                                                  </p>
                                                  <button
                                                      onClick={handleStartEditEndPrompt}
                                                      className="text-[11px] text-indigo-400 hover:text-indigo-300 font-bold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1"
                                                  >
                                                      <Edit2 className="w-2 h-2" />
                                                      编辑提示词
                                                  </button>
                                              </div>
                                          )}
                                      </div>
                                   
                                   {/* 图片显示区 */}
                                   <div className="aspect-video bg-black rounded-lg border border-zinc-800 overflow-hidden relative group">
                                       {endKf?.imageUrl ? (
                                           <>
                                               <img 
                                                   src={endKf.imageUrl} 
                                                   className="w-full h-full object-contain cursor-pointer hover:opacity-90 transition-opacity" 
                                                   onClick={(e) => {
                                                       console.log('=== 结束帧图片被点击 ===');
                                                       console.log('事件对象:', e);
                                                       console.log('activeShot:', activeShot);
                                                       handleOpenImageEditor(activeShot, 'end');
                                                   }}
                                                   alt="结束帧"
                                               />
                                               <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                                                   <div className="text-center">
                                                       <Edit2 className="w-6 h-6 text-white mx-auto mb-2" />
                                                       <p className="text-white text-xs font-bold">点击编辑</p>
                                                   </div>
                                               </div>
                                           </>
                                       ) : (
                                           <div className="absolute inset-0 flex items-center justify-center">
                                               <span className="text-[9px] text-zinc-700 uppercase">Optional</span>
                                           </div>
                                       )}
                                       {/* Loading State */}
                                       {((endKf && processingState?.id === endKf.id) || (processingState?.type === 'kf_end' && !endKf)) && (
                                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                                <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
                                            </div>
                                       )}
                                   </div>
                                   
                                   {/* 操作按钮 */}
                                   <div className="flex gap-1">
                                       <button 
                                           onClick={() => handleGenerateKeyframe(activeShot, 'end')}
                                           disabled={processingState?.type === 'kf_end'}
                                           className="flex-1 px-2 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold uppercase rounded transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                                       >
                                           <Sparkles className="w-3 h-3" />
                                           {endKf?.imageUrl ? '重新生成' : '生成'}
                                       </button>
                                       <button 
                                           onClick={() => handleOpenLibraryForKeyframe('end')}
                                           className="px-2 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-white text-[11px] font-bold uppercase rounded transition-colors flex items-center justify-center"
                                           title="从资源库选择"
                                       >
                                           <FolderOpen className="w-3 h-3" />
                                       </button>
                                       <label className="px-2 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-white text-[11px] font-bold uppercase rounded transition-colors flex items-center justify-center cursor-pointer" title="上传图片">
                                           <Upload className="w-3 h-3" />
                                           <input 
                                               type="file" 
                                               accept="image/*" 
                                               className="hidden"
                                               onClick={(e) => { (e.target as HTMLInputElement).value = ''; }}
                                               onChange={(e) => {
                                                   const file = e.target.files?.[0];
                                                   if (file) handleUploadKeyframe(activeShot, 'end', file);
                                               }}
                                           />
                                       </label>
                                       {endKf?.imageUrl && (
                                           <>
                                               <button 
                                                   onClick={() => handleAddKeyframeToLibrary('end')}
                                                   className="px-2 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-white text-[11px] font-bold uppercase rounded transition-colors flex items-center justify-center"
                                                   title="加入资源库"
                                               >
                                                   <Database className="w-3 h-3" />
                                               </button>
                                               <button 
                                                   onClick={() => handleDeleteKeyframe(activeShot, 'end')}
                                                   className="px-2 py-1.5 bg-red-600 hover:bg-red-500 text-white text-[11px] font-bold uppercase rounded transition-colors flex items-center justify-center"
                                                   title="删除"
                                               >
                                                   <Trash2 className="w-3 h-3" />
                                               </button>
                                           </>
                                       )}
                                   </div>
                               </div>
                           </div>
                       </div>

                       {/* Section 4: Video Generation (Moved to Top) */}
                       <div className="bg-[#141414] rounded-xl p-5 border border-zinc-800 space-y-4">
                           <div className="flex items-center justify-between">
                               <h4 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
                                  <Video className="w-3 h-3 text-indigo-500" />
                                  视频生成
                               </h4>
                               {activeShot.interval?.status === 'completed' && <span className="text-[10px] text-green-500 font-mono flex items-center gap-1">● READY</span>}
                           </div>
                           
                           
                           
                           {activeShot.interval?.videoUrl ? (
                               <div className="space-y-3">
                                   <div className="w-full aspect-video bg-black rounded-lg overflow-hidden border border-zinc-700 relative shadow-lg">
                                       <video src={activeShot.interval.videoUrl} controls className="w-full h-full" />
                                   </div>
                                   <div className="flex gap-2">
                                       <button
                                           onClick={handleAddVideoToLibrary}
                                           className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 border border-zinc-700"
                                       >
                                           <Database className="w-3 h-3" />
                                           加入资源库
                                       </button>
                                       <button
                                           onClick={handleOpenVideoLibrary}
                                           className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 border border-zinc-700"
                                       >
                                           <FolderOpen className="w-3 h-3" />
                                           从资源库选择
                                       </button>
                                   </div>
                               </div>
                           ) : (
                               <div className="w-full aspect-video bg-zinc-900/50 rounded-lg border border-dashed border-zinc-800 flex items-center justify-center">
                                   {processingState?.type === 'video' && videoProgress ? (
                                       <div className="flex flex-col items-center gap-3">
                                           <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                                           <div className="text-center">
                                               <p className="text-xs text-zinc-400 mb-2">{videoProgress.message}</p>
                                               {videoProgress.current !== undefined && videoProgress.total !== undefined && (
                                                   <>
                                                       <div className="w-48 h-1.5 bg-zinc-800 rounded-full overflow-hidden mb-1">
                                                           <div 
                                                               className="h-full bg-indigo-500 transition-all duration-300" 
                                                               style={{ width: `${(videoProgress.current / videoProgress.total) * 100}%` }}
                                                           ></div>
                                                       </div>
                                                       <p className="text-[10px] text-zinc-600 font-mono">
                                                           {videoProgress.current}/{videoProgress.total} ({Math.round((videoProgress.current / videoProgress.total) * 100)}%)
                                                       </p>
                                                   </>
                                               )}
                                           </div>
                                       </div>
                                   ) : (
                                       <div className="flex flex-col items-center gap-3">
                                           <span className="text-xs text-zinc-600 font-mono">PREVIEW AREA</span>
                                           <button
                                               onClick={handleOpenVideoLibrary}
                                               className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 border border-zinc-700"
                                           >
                                               <FolderOpen className="w-3 h-3" />
                                               从资源库选择
                                           </button>
                                       </div>
                                   )}
                               </div>
                           )}

                           {/* Duration Control */}
                           <div className="space-y-2">
                               <div className="flex items-center justify-between">
                                   <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1">
                                       <Clock className="w-3 h-3" />
                                       视频时长
                                    </label>
                                    <span className="text-[10px] text-zinc-400 font-mono">{activeShot.interval?.duration || defaultDuration}秒</span>
                                </div>
                                <input
                                    type="range"
                                    min="2"
                                    max="15"
                                    step="1"
                                    value={activeShot.interval?.duration || defaultDuration}
                                    onChange={(e) => {
                                        const newDuration = parseInt(e.target.value);
                                        updateShot(activeShot.id, (s) => ({
                                            ...s,
                                            interval: s.interval 
                                                ? { ...s.interval, duration: newDuration }
                                                : {
                                                    id: `interval-${s.id}-${Date.now()}`,
                                                    startKeyframeId: startKf?.id || '',
                                                    endKeyframeId: endKf?.id || '',
                                                    duration: newDuration,
                                                    motionStrength: 0.5,
                                                    status: 'pending'
                                                }
                                        }));
                                    }}
                                    className="w-full h-1.5 bg-zinc-800 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-indigo-500 [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-indigo-500 [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
                                />
                                <div className="flex justify-between text-[9px] text-zinc-600 font-mono">
                                    <span>2s</span>
                                    <span>15s</span>
                                </div>
                           </div>

                           {/* Audio Generation Option */}
                           <div className="flex items-center gap-2 px-3 py-2 bg-zinc-900/50 rounded-lg border border-zinc-800">
                               <input
                                   type="checkbox"
                                   id="generate-audio"
                                   checked={generateAudio}
                                   onChange={(e) => setGenerateAudio(e.target.checked)}
                                   className="w-3.5 h-3.5 rounded border-zinc-700 bg-zinc-800 text-indigo-600 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-0 cursor-pointer"
                               />
                               <label
                                   htmlFor="generate-audio"
                                   className="text-xs text-zinc-400 font-medium cursor-pointer flex items-center gap-1.5 select-none"
                               >
                                   <Volume2 className="w-3.5 h-3.5" />
                                   生成同步音频
                               </label>
                           </div>

                           {/* Seed Option */}
                           {currentSeed !== null && (
                               <div className="flex items-center gap-2 px-3 py-2 bg-zinc-900/50 rounded-lg border border-zinc-800">
                                   <input
                                       type="checkbox"
                                       id="use-seed"
                                       checked={useSeed}
                                       onChange={(e) => setUseSeed(e.target.checked)}
                                       className="w-3.5 h-3.5 rounded border-zinc-700 bg-zinc-800 text-indigo-600 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-0 cursor-pointer"
                                   />
                                   <label
                                       htmlFor="use-seed"
                                       className="text-xs text-zinc-400 font-medium cursor-pointer flex items-center gap-1.5 select-none"
                                   >
                                       <span className="text-yellow-500 font-mono">🔒</span>
                                       锁定种子 (Seed: {currentSeed})
                                   </label>
                               </div>
                           )}

                           {/* Audio URL Input */}
                           <div className="space-y-2">
                               <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1">
                                   <Volume2 className="w-3 h-3" />
                                   音频文件URL
                               </label>
                               <div className="flex gap-2">
                                   <input
                                       type="url"
                                       value={audioUrl}
                                       onChange={(e) => setAudioUrl(e.target.value)}
                                       placeholder="输入音频文件URL (mp3, wav, ogg, m4a, aac)"
                                       disabled={!!uploadedAudioData}
                                       className={`flex-1 bg-[#0A0A0A] border rounded px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none ${
                                           uploadedAudioData ? 'border-green-700 bg-green-900/20' : 'border-zinc-700 focus:border-indigo-500'
                                       } ${uploadedAudioData ? 'cursor-not-allowed opacity-60' : ''}`}
                                   />
                                   <label className={`px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase rounded transition-all flex items-center gap-2 cursor-pointer ${isUploadingAudio ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                       {isUploadingAudio ? (
                                           <>
                                               <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                               上传中
                                           </>
                                       ) : (
                                           <>
                                               <Upload className="w-3.5 h-3.5" />
                                               上传音频
                                           </>
                                       )}
                                       <input
                                           type="file"
                                           accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac"
                                           disabled={isUploadingAudio}
                                           onChange={(e) => {
                                               const file = e.target.files?.[0];
                                               if (file) handleUploadAudioToOss(file);
                                               e.target.value = ''; // 重置 input
                                           }}
                                           className="hidden"
                                       />
                                   </label>
                               </div>
                               <p className="text-[11px] text-zinc-600">
                                   支持格式: MP3, WAV, OGG, M4A, AAC。
                                   {uploadedAudioData ? ' 已上传音频文件，URL输入已禁用。' : ' 可直接输入URL或点击上传本地文件。'}
                               </p>
                           </div>

                           <button
                             onClick={() => handleGenerateVideo(activeShot)}
                             disabled={!startKf?.imageUrl || processingState?.type === 'video'}
                             className={`w-full py-3 rounded-lg font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
                               activeShot.interval?.videoUrl 
                                 ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                                 : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-600/20'
                             } ${(!startKf?.imageUrl) ? 'opacity-50 cursor-not-allowed' : ''}`}
                           >
                             {processingState?.type === 'video' ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  生成视频中...
                                </>
                             ) : (
                                <>
                                  {activeShot.interval?.videoUrl ? '重新生成视频' : '开始生成视频'}
                                </>
                             )}
                           </button>
                           
                           {!endKf?.imageUrl && (
                               <div className="text-[11px] text-zinc-500 text-center font-mono">
                                  * 未检测到结束帧，将使用单图生成模式 (Image-to-Video)
                               </div>
                           )}
                       </div>

                       {/* Section 2: Narrative */}
                       <div className="space-y-4">
                           <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
                               <Film className="w-4 h-4 text-zinc-500" />
                               <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">叙事动作 (Action & Dialogue)</h4>
                           </div>
                           
                           <div className="space-y-3">
                               {/* 动作描述 */}
                               <div className="bg-[#141414] p-4 rounded-lg border border-zinc-800">
                                   {editingAction ? (
                                       <div className="space-y-2">
                                           <textarea
                                               value={tempActionValue}
                                               onChange={(e) => setTempActionValue(e.target.value)}
                                               className="w-full bg-[#0A0A0A] border border-zinc-700 rounded px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500 resize-none min-h-[80px]"
                                               placeholder="输入动作描述..."
                                           />
                                           <div className="flex gap-2 justify-end">
                                               <button
                                                   onClick={handleCancelEditAction}
                                                   className="px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-white text-xs font-bold uppercase rounded transition-colors"
                                               >
                                                   取消
                                               </button>
                                               <button
                                                   onClick={handleSaveAction}
                                                   className="px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold uppercase rounded transition-colors"
                                               >
                                                   保存
                                               </button>
                                           </div>
                                       </div>
                                   ) : (
                                       <div className="group">
                                           <p className="text-zinc-200 text-sm leading-relaxed mb-2">{activeShot.actionSummary}</p>
                                           <button
                                               onClick={handleStartEditAction}
                                               className="text-xs text-indigo-400 hover:text-indigo-300 font-bold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity"
                                           >
                                               编辑动作
                                           </button>
                                       </div>
                                   )}
                               </div>
                               
                               {/* 对白 */}
                               {(activeShot.dialogue || editingDialogue) && (
                                  <div className="bg-[#141414] p-4 rounded-lg border border-zinc-800 flex gap-3">
                                      <MessageSquare className="w-4 h-4 text-zinc-600 mt-0.5 flex-shrink-0" />
                                      <div className="flex-1">
                                          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">对白</p>
                                          {editingDialogue ? (
                                              <div className="space-y-2">
                                                  <textarea
                                                      value={tempDialogueValue}
                                                      onChange={(e) => setTempDialogueValue(e.target.value)}
                                                      className="w-full bg-[#0A0A0A] border border-zinc-700 rounded px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500 resize-none min-h-[60px]"
                                                      placeholder="输入对白..."
                                                  />
                                                  <div className="flex gap-2 justify-end">
                                                      <button
                                                          onClick={handleCancelEditDialogue}
                                                          className="px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-white text-xs font-bold uppercase rounded transition-colors"
                                                      >
                                                          取消
                                                      </button>
                                                      <button
                                                          onClick={handleSaveDialogue}
                                                          className="px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold uppercase rounded transition-colors"
                                                      >
                                                          保存
                                                      </button>
                                                  </div>
                                              </div>
                                          ) : (
                                              <div className="group">
                                                  <p className="text-indigo-200 font-serif italic text-sm mb-2">"{activeShot.dialogue}"</p>
                                                  <button
                                                      onClick={handleStartEditDialogue}
                                                      className="text-xs text-indigo-400 hover:text-indigo-300 font-bold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity"
                                                  >
                                                      编辑对白
                                                  </button>
                                              </div>
                                          )}
                                      </div>
                                  </div>
                               )}
                               
                               {/* 添加对白按钮（如果没有对白） */}
                               {!activeShot.dialogue && !editingDialogue && (
                                   <button
                                       onClick={handleStartEditDialogue}
                                       className="w-full py-2 bg-zinc-800/50 hover:bg-zinc-800 border border-dashed border-zinc-700 rounded-lg text-xs text-zinc-400 hover:text-zinc-300 font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
                                   >
                                       <MessageSquare className="w-3 h-3" />
                                       添加对白
                                   </button>
                               )}

                               {/* 旁白 */}
                               {(activeShot.narration || editingNarration) && (
                                  <div className="bg-[#141414] p-4 rounded-lg border border-zinc-800 flex gap-3">
                                      <Volume2 className="w-4 h-4 text-zinc-600 mt-0.5 flex-shrink-0" />
                                      <div className="flex-1">
                                          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">旁白</p>
                                          {editingNarration ? (
                                              <div className="space-y-2">
                                                  <textarea
                                                      value={tempNarrationValue}
                                                      onChange={(e) => setTempNarrationValue(e.target.value)}
                                                      className="w-full bg-[#0A0A0A] border border-zinc-700 rounded px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500 resize-none min-h-[60px]"
                                                      placeholder="输入旁白..."
                                                  />
                                                  <div className="flex gap-2 justify-end">
                                                      <button
                                                          onClick={handleCancelEditNarration}
                                                          className="px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-white text-xs font-bold uppercase rounded transition-colors"
                                                      >
                                                          取消
                                                      </button>
                                                      <button
                                                          onClick={handleSaveNarration}
                                                          className="px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold uppercase rounded transition-colors"
                                                      >
                                                          保存
                                                      </button>
                                                  </div>
                                              </div>
                                          ) : (
                                              <div className="group">
                                                  <p className="text-green-200 font-serif text-sm mb-2">"{activeShot.narration}"</p>
                                                  <button
                                                      onClick={handleStartEditNarration}
                                                      className="text-xs text-indigo-400 hover:text-indigo-300 font-bold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity"
                                                  >
                                                      编辑旁白
                                                  </button>
                                              </div>
                                          )}
                                      </div>
                                  </div>
                               )}

                               {/* 添加旁白按钮（如果没有旁白） */}
                               {!activeShot.narration && !editingNarration && (
                                   <button
                                       onClick={handleStartEditNarration}
                                       className="w-full py-2 bg-zinc-800/50 hover:bg-zinc-800 border border-dashed border-zinc-700 rounded-lg text-xs text-zinc-400 hover:text-zinc-300 font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
                                   >
                                       <Volume2 className="w-3 h-3" />
                                       添加旁白
                                   </button>
                               )}
                           </div>
                       </div>

                       {/* Section 1: Context (Moved to Bottom) */}
                       {renderSceneContext()}
                  </div>
              </div>
          )}
      </div>

      {/* Asset Library Modal */}
      {showLibraryModal && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#141414] border border-zinc-800 w-full max-w-7xl max-h-[95vh] rounded-2xl flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="h-16 px-8 border-b border-zinc-800 flex items-center justify-between shrink-0 bg-[#1A1A1A]">
              <div className="flex items-center gap-4">
                <Database className="w-5 h-5 text-indigo-500" />
                <div>
                  <h3 className="text-lg font-bold text-white">
                    资源库 - {libraryType === 'video' ? '视频片段' : '关键帧'}
                  </h3>
                  <p className="text-xs text-zinc-500 font-mono uppercase tracking-wider">
                    {libraryType === 'video' 
                      ? '视频库' 
                      : `${libraryType === 'start' ? '起始帧' : '结束帧'}`
                    }
                  </p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setShowLibraryModal(false);
                  setActiveLibraryTabId('local');
                  setCrossProjectAssets([]);
                  setPlayingVideos(new Set()); // 清空播放状态
                }} 
                className="p-2 hover:bg-zinc-800 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-zinc-500" />
              </button>
            </div>
            
            {/* Tabs inside Modal */}
            <div className="border-b border-zinc-800 bg-[#161616] px-6 flex items-center gap-0 shrink-0 overflow-x-auto scrollbar-thin scrollbar-thumb-zinc-700">
              <button
                onClick={() => handleLibraryTabChange('local')}
                className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider whitespace-nowrap border-b-2 transition-colors ${
                  activeLibraryTabId === 'local'
                    ? 'border-indigo-500 text-white'
                    : 'border-transparent text-zinc-500 hover:text-zinc-300'
                }`}
              >
                本地资源库
              </button>
              
              {/* 加载项目 tabs 的提示 */}
              {loadingProjectTabs && (
                <div className="px-4 py-2.5 flex items-center gap-2 text-zinc-500">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span className="text-xs">加载其他项目...</span>
                </div>
              )}
              
              {/* 项目 tabs */}
              {!loadingProjectTabs && projectTabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => handleLibraryTabChange(tab.id)}
                  className={`px-4 py-2.5 text-xs font-medium whitespace-nowrap border-b-2 transition-colors max-w-[160px] truncate ${
                    activeLibraryTabId === tab.id
                      ? 'border-indigo-500 text-white'
                      : 'border-transparent text-zinc-500 hover:text-zinc-300'
                  }`}
                  title={tab.title}
                >
                  {tab.title}
                </button>
              ))}
              
              {/* 没有其他项目的提示 */}
              {!loadingProjectTabs && projectTabs.length === 0 && (
                <div className="px-4 py-2.5 text-xs text-zinc-600 italic">
                  暂无其他项目
                </div>
              )}
            </div>
            
            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-8 min-h-[500px]">
              {activeLibraryTabId === 'local' ? (
                // 本地资源库视图
                libraryAssets.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full min-h-[450px] text-zinc-500">
                    <Database className="w-16 h-16 mb-4 opacity-20" />
                    <p className="text-sm">资源库为空</p>
                    <p className="text-xs mt-2">
                      {libraryType === 'video' ? '生成视频后，可以添加到资源库' : '生成关键帧或视频后，可以添加到资源库'}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {libraryAssets.map((asset) => {
                      // 根据选择类型确定显示的图片
                      let displayImageUrl = asset.imageUrl;
                      if (libraryType !== 'video' && asset.type === 'video') {
                        // 如果是关键帧选择模式且资源是视频，显示对应的帧
                        if (libraryType === 'start') {
                          displayImageUrl = asset.startFrameUrl || asset.imageUrl;
                        } else if (libraryType === 'end') {
                          displayImageUrl = asset.endFrameUrl || asset.imageUrl;
                        }
                      }
                      
                      return (
                      <div 
                        key={asset.id} 
                        className={`bg-[#0A0A0A] rounded-xl overflow-hidden group transition-all ${
                          libraryType === 'video' && asset.type === 'video'
                            ? 'border-2 border-emerald-700 hover:border-emerald-500 hover:shadow-lg hover:shadow-emerald-500/30'
                            : 'border border-zinc-800 hover:border-indigo-500 cursor-pointer'
                        }`}
                        onClick={(e) => {
                          // 如果是视频模式且是视频资源，不在卡片级别处理点击
                          if (libraryType === 'video' && asset.type === 'video') {
                            return;
                          }
                          // 否则正常处理选择
                          libraryType === 'video' ? handleSelectVideoFromLibrary(asset) : handleSelectKeyframeFromLibrary(asset);
                        }}
                      >
                        <div className="aspect-video bg-zinc-900 relative group/videocard">
                          {/* 如果是视频选择模式且资源是视频 */}
                          {libraryType === 'video' && asset.type === 'video' && asset.videoUrl ? (
                            playingVideos.has(asset.id?.toString() || asset.videoUrl) ? (
                              // 用户点击播放后，显示视频播放器
                              <video
                                src={asset.videoUrl}
                                poster={displayImageUrl}
                                controls
                                autoPlay
                                preload="auto"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              // 默认显示首帧图片，点击后加载视频
                              <>
                                {displayImageUrl ? (
                                  <img 
                                    src={displayImageUrl} 
                                    alt={asset.name} 
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      // 图片加载失败时显示默认占位图
                                      e.currentTarget.style.display = 'none';
                                      const parent = e.currentTarget.parentElement;
                                      if (parent) {
                                        const placeholder = parent.querySelector('.video-placeholder');
                                        if (placeholder) {
                                          (placeholder as HTMLElement).style.display = 'flex';
                                        }
                                      }
                                    }}
                                  />
                                ) : null}
                                {/* 默认占位图 */}
                                <div className="video-placeholder absolute inset-0 bg-gradient-to-br from-zinc-800 to-zinc-900 flex flex-col items-center justify-center" style={{ display: displayImageUrl ? 'none' : 'flex' }}>
                                  <Film className="w-16 h-16 text-zinc-600 mb-3" />
                                  <p className="text-zinc-500 text-sm font-medium">视频预览</p>
                                  <p className="text-zinc-600 text-xs mt-1">点击播放</p>
                                </div>
                                {/* 播放按钮覆盖层 */}
                                <div 
                                  className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors cursor-pointer z-10"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setPlayingVideos(prev => new Set(prev).add(asset.id?.toString() || asset.videoUrl));
                                  }}
                                >
                                  <div className="bg-white/90 hover:bg-white rounded-full p-4 shadow-2xl transition-all transform hover:scale-110">
                                    <svg className="w-8 h-8 text-zinc-900" fill="currentColor" viewBox="0 0 24 24">
                                      <path d="M8 5v14l11-7z" />
                                    </svg>
                                  </div>
                                </div>
                              </>
                            )
                          ) : (
                            <img src={displayImageUrl} alt={asset.name} className="w-full h-full object-cover" />
                          )}
                          
                          {/* Video indicator overlay */}
                          {asset.type === 'video' && (
                            <div className="absolute top-2 left-2 pointer-events-none">
                              <div className={`px-2.5 py-1.5 rounded-lg backdrop-blur-sm flex items-center gap-1.5 border shadow-lg ${
                                libraryType === 'video'
                                  ? 'bg-emerald-500/90 border-white/30 text-white'
                                  : 'bg-purple-500/90 border-white/20 text-white'
                              }`}>
                                <Film className="w-3.5 h-3.5" />
                                <span className="text-[10px] font-bold uppercase">视频</span>
                              </div>
                            </div>
                          )}
                          
                          {/* 视频选择按钮 - 只在视频模式下显示，放在右上角 */}
                          {libraryType === 'video' && asset.type === 'video' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectVideoFromLibrary(asset);
                              }}
                              className="absolute top-2 right-2 px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-bold text-xs shadow-lg hover:shadow-emerald-500/50 transition-all flex items-center gap-1.5 z-20 opacity-0 group-hover:opacity-100"
                              title="选择此视频"
                            >
                              <Check className="w-4 h-4" />
                              选择
                            </button>
                          )}
                          
                          {/* Frame type indicator for video assets in keyframe selection mode */}
                          {libraryType !== 'video' && asset.type === 'video' && (
                            <div className="absolute top-2 right-2 pointer-events-none">
                              <div className="px-2 py-1 rounded bg-indigo-500/90 backdrop-blur-sm border border-white/20">
                                <span className="text-[9px] text-white font-bold uppercase">
                                  {libraryType === 'start' ? '起始帧' : '结束帧'}
                                </span>
                              </div>
                            </div>
                          )}
                          
                          {/* Hover overlay - 只在非视频模式或非视频资源时显示 */}
                          {!(libraryType === 'video' && asset.type === 'video') && (
                            <div 
                              className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center backdrop-blur-sm pointer-events-none"
                            >
                              <div className="text-center transform scale-90 group-hover:scale-100 transition-transform">
                                <div className="bg-indigo-500 rounded-full p-3 mb-3 mx-auto w-fit shadow-lg shadow-indigo-500/50">
                                  <Check className="w-8 h-8 text-white" />
                                </div>
                                <p className="text-white text-base font-bold mb-1">选择此资源</p>
                                <p className="text-zinc-300 text-xs">点击应用</p>
                              </div>
                            </div>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (asset.id) handleDeleteFromLibrary(asset.id);
                            }}
                            className="absolute top-2 right-2 p-1.5 bg-red-500/80 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                            title="从资源库删除"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                        <div 
                          className={`p-3 border-t border-zinc-800 ${
                            libraryType === 'video' && asset.type === 'video'
                              ? 'cursor-pointer hover:bg-zinc-800/50 transition-colors'
                              : ''
                          }`}
                          onClick={(e) => {
                            if (libraryType === 'video' && asset.type === 'video') {
                              e.stopPropagation();
                              handleSelectVideoFromLibrary(asset);
                            }
                          }}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-bold text-zinc-200 text-sm truncate flex-1 mr-2" title={asset.name}>{asset.name}</h4>
                            {asset.type === 'video' && (
                              <span className="px-1.5 py-0.5 bg-purple-900/50 text-purple-300 text-[9px] rounded uppercase font-mono flex items-center gap-1 flex-shrink-0">
                                <Film className="w-2 h-2" />
                                VIDEO
                              </span>
                            )}
                          </div>
                          {asset.visualPrompt && (
                            <p className="text-[9px] text-zinc-500 line-clamp-2 font-mono mb-2">{asset.visualPrompt}</p>
                          )}
                          {asset.metadata && (
                            <div className="flex gap-1 flex-wrap">
                              {asset.metadata.shotNumber && (
                                <span className="px-1.5 py-0.5 bg-indigo-900/30 text-indigo-400 text-[9px] rounded font-mono">
                                  镜头 {asset.metadata.shotNumber}
                                </span>
                              )}
                              {asset.metadata.duration && (
                                <span className="px-1.5 py-0.5 bg-green-900/30 text-green-400 text-[9px] rounded font-mono">
                                  {asset.metadata.duration}秒
                                </span>
                              )}
                              {asset.metadata.location && !asset.name.includes(asset.metadata.location) && (
                                <span className="px-1.5 py-0.5 bg-zinc-900 text-zinc-500 text-[9px] rounded font-mono">
                                  {asset.metadata.location}
                                </span>
                              )}
                              {asset.metadata.time && (
                                <span className="px-1.5 py-0.5 bg-zinc-800 text-zinc-400 text-[9px] rounded font-mono flex items-center gap-1">
                                  <Clock className="w-2 h-2" />
                                  {asset.metadata.time}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )})}
                  </div>
                )
              ) : (
                // 跨项目资源视图
                loadingCrossAssets ? (
                  <div className="flex flex-col items-center justify-center h-full min-h-[450px] text-zinc-500">
                    <Loader2 className="w-8 h-8 animate-spin mb-4 text-indigo-500" />
                    <p className="text-sm">正在加载项目资源...</p>
                  </div>
                ) : crossProjectAssets.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full min-h-[450px] text-zinc-500">
                    <Database className="w-16 h-16 mb-4 opacity-20" />
                    <p className="text-sm">该项目暂无可用资源</p>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {/* 图片资源 */}
                    {crossProjectAssets.filter(a => a.type === 'image').length > 0 && (
                      <section>
                        <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2 mb-4">
                          <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                          图片资源 ({crossProjectAssets.filter(a => a.type === 'image').length})
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                          {crossProjectAssets.filter(a => a.type === 'image').map((asset, idx) => (
                            <div 
                              key={idx} 
                              className="bg-[#0A0A0A] border border-zinc-800 rounded-xl overflow-hidden group hover:border-indigo-500 transition-all cursor-pointer"
                              onClick={() => {
                                // 将跨项目资源转换为 AssetLibraryItem 格式
                                const assetItem: AssetLibraryItem = {
                                  type: 'scene',
                                  name: asset.source,
                                  imageUrl: asset.url,
                                  visualPrompt: asset.prompt,
                                  metadata: {}
                                };
                                handleSelectKeyframeFromLibrary(assetItem);
                              }}
                            >
                              <div className="aspect-video bg-zinc-900 relative group/crossitem">
                                <img src={asset.url} alt={asset.source} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent opacity-0 group-hover/crossitem:opacity-100 transition-all flex items-center justify-center backdrop-blur-sm">
                                  <div className="text-center transform scale-90 group-hover/crossitem:scale-100 transition-transform">
                                    <div className="bg-indigo-500 rounded-full p-3 mb-3 mx-auto w-fit shadow-lg shadow-indigo-500/50">
                                      <Check className="w-8 h-8 text-white" />
                                    </div>
                                    <p className="text-white text-base font-bold mb-1">选择此图片</p>
                                    <p className="text-zinc-300 text-xs">点击应用到关键帧</p>
                                  </div>
                                </div>
                              </div>
                              <div className="p-3 border-t border-zinc-800">
                                <h4 className="font-bold text-zinc-200 text-sm truncate mb-1">{asset.source}</h4>
                                {asset.prompt && (
                                  <p className="text-[9px] text-zinc-500 line-clamp-2 font-mono">{asset.prompt}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </section>
                    )}

                    {/* 视频资源 */}
                    {crossProjectAssets.filter(a => a.type === 'video').length > 0 && (
                      <section>
                        <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2 mb-4">
                          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                          视频资源 ({crossProjectAssets.filter(a => a.type === 'video').length})
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {crossProjectAssets.filter(a => a.type === 'video').map((asset, idx) => (
                            <div 
                              key={idx} 
                              className="bg-[#0A0A0A] border-2 border-zinc-800 rounded-xl overflow-hidden group hover:border-emerald-500 hover:shadow-lg hover:shadow-emerald-500/20 transition-all"
                            >
                              <div className="aspect-video bg-zinc-900 relative group/crossvideo">
                                {playingVideos.has(asset.url) ? (
                                  // 用户点击播放后，显示视频播放器
                                  <video
                                    src={asset.url}
                                    poster={asset.thumbnailUrl}
                                    controls
                                    autoPlay
                                    preload="auto"
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  // 默认显示首帧图片，点击后加载视频
                                  <>
                                    {asset.thumbnailUrl ? (
                                      <img 
                                        src={asset.thumbnailUrl} 
                                        alt={asset.source} 
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                          // 图片加载失败时显示默认占位图
                                          e.currentTarget.style.display = 'none';
                                          const parent = e.currentTarget.parentElement;
                                          if (parent) {
                                            const placeholder = parent.querySelector('.video-placeholder');
                                            if (placeholder) {
                                              (placeholder as HTMLElement).style.display = 'flex';
                                            }
                                          }
                                        }}
                                      />
                                    ) : null}
                                    {/* 默认占位图 */}
                                    <div className="video-placeholder absolute inset-0 bg-gradient-to-br from-zinc-800 to-zinc-900 flex flex-col items-center justify-center" style={{ display: asset.thumbnailUrl ? 'none' : 'flex' }}>
                                      <Film className="w-16 h-16 text-zinc-600 mb-3" />
                                      <p className="text-zinc-500 text-sm font-medium">视频预览</p>
                                      <p className="text-zinc-600 text-xs mt-1">点击播放</p>
                                    </div>
                                    {/* 播放按钮覆盖层 */}
                                    <div 
                                      className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors cursor-pointer z-10"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setPlayingVideos(prev => new Set(prev).add(asset.url));
                                      }}
                                    >
                                      <div className="bg-white/90 hover:bg-white rounded-full p-4 shadow-2xl transition-all transform hover:scale-110">
                                        <svg className="w-8 h-8 text-zinc-900" fill="currentColor" viewBox="0 0 24 24">
                                          <path d="M8 5v14l11-7z" />
                                        </svg>
                                      </div>
                                    </div>
                                  </>
                                )}
                                <div className="absolute top-2 left-2 px-2.5 py-1.5 bg-emerald-500/90 backdrop-blur-sm rounded-lg text-xs text-white font-bold uppercase border border-white/30 flex items-center gap-1.5 shadow-lg pointer-events-none">
                                  <Film className="w-4 h-4" /> 视频
                                </div>
                                {/* 视频选择按钮 - 放在右上角 */}
                                <button
                                  onClick={() => {
                                    const assetItem: AssetLibraryItem = {
                                      type: 'video',
                                      name: asset.source,
                                      imageUrl: asset.thumbnailUrl || asset.url,
                                      videoUrl: asset.url,
                                      visualPrompt: asset.prompt,
                                      metadata: {}
                                    };
                                    handleSelectVideoFromLibrary(assetItem);
                                  }}
                                  className="absolute top-2 right-2 px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-bold text-xs shadow-lg hover:shadow-emerald-500/50 transition-all flex items-center gap-1.5 z-20 opacity-0 group-hover/crossvideo:opacity-100"
                                  title="选择此视频"
                                >
                                  <Check className="w-4 h-4" />
                                  选择
                                </button>
                              </div>
                              <div 
                                className="p-3 border-t border-zinc-800 bg-zinc-900/50 cursor-pointer hover:bg-zinc-800/50 transition-colors"
                                onClick={() => {
                                  const assetItem: AssetLibraryItem = {
                                    type: 'video',
                                    name: asset.source,
                                    imageUrl: asset.thumbnailUrl || asset.url,
                                    videoUrl: asset.url,
                                    visualPrompt: asset.prompt,
                                    metadata: {}
                                  };
                                  handleSelectVideoFromLibrary(assetItem);
                                }}
                              >
                                <div className="flex items-center gap-2 mb-1">
                                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                  <p className="text-sm text-zinc-200 font-bold truncate flex-1">{asset.source}</p>
                                </div>
                                {asset.prompt && (
                                  <p className="text-[10px] text-zinc-500 line-clamp-2 font-mono">{asset.prompt}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </section>
                    )}
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setPreviewImage(null)}
        >
          <button
            onClick={() => setPreviewImage(null)}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
          <div className="max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center">
            <img 
              src={previewImage} 
              alt="预览" 
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-zinc-400 bg-black/50 px-3 py-1.5 rounded-full backdrop-blur">
            点击任意位置关闭
          </div>
        </div>
      )}

      {/* Image Editor Modal - 全屏专业编辑器 */}
      {editingImage && (
        <div className="fixed inset-0 z-50 bg-[#0A0A0A] flex flex-col">
          {/* 顶部工具栏 */}
          <div className="h-14 bg-[#141414] border-b border-zinc-800 flex items-center justify-between px-4 shrink-0">
            <div className="flex items-center gap-4">
              <button 
                onClick={handleCloseImageEditor}
                className="p-2 hover:bg-zinc-800 rounded-lg transition-colors flex items-center gap-2 text-zinc-400 hover:text-white"
              >
                <ChevronLeft className="w-5 h-5" />
                <span className="text-sm font-medium">返回</span>
              </button>
              <div className="h-6 w-px bg-zinc-700"></div>
              <div className="flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-indigo-500" />
                <h3 className="text-sm font-bold text-white">图片编辑器</h3>
                <span className="text-xs text-zinc-500 font-mono">
                  {editingImage.type === 'start' ? '起始帧' : '结束帧'}
                </span>
              </div>
            </div>
            
            {/* 中间 - 模型选择器 */}
            <div className="flex items-center gap-3">
              <label className="text-xs text-zinc-500 font-medium">图片模型:</label>
              <select
                value={localImageModel}
                onChange={(e) => setLocalImageModel(e.target.value)}
                disabled={loadingImageModels || isGeneratingInEditor}
                className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-white hover:border-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-[200px]"
              >
                {loadingImageModels ? (
                  <option>加载中...</option>
                ) : imageModels.length === 0 ? (
                  <option>暂无可用模型</option>
                ) : (
                  imageModels.map((model) => (
                    <option key={model.modelName} value={model.modelName}>
                      {model.modelDescribe || model.modelName}
                    </option>
                  ))
                )}
              </select>
            </div>
            
            {/* 顶部操作按钮 */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleGenerateInEditor}
                disabled={!editorPrompt.trim() || isGeneratingInEditor}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-bold transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGeneratingInEditor ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    生成中...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    生成图片
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="flex-1 flex overflow-hidden">
            {/* 左侧工具面板 */}
            <div className="w-16 bg-[#141414] border-r border-zinc-800 flex flex-col items-center py-4 gap-2">
              <button
                className="w-10 h-10 rounded-lg bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-500 transition-colors"
                title="选择/移动"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                </svg>
              </button>
              <div className="w-8 h-px bg-zinc-700"></div>
              <button
                className="w-10 h-10 rounded-lg bg-zinc-800 text-zinc-400 flex items-center justify-center hover:bg-zinc-700 hover:text-white transition-colors"
                title="区域选择"
              >
                <Maximize2 className="w-5 h-5" />
              </button>
            </div>

            {/* 中间画布区域 */}
            <div className="flex-1 flex items-center justify-center p-8 overflow-hidden bg-gradient-to-br from-zinc-950 to-black relative">
              <div className="relative">
                {/* 画布容器 */}
                <div className="relative rounded-lg overflow-hidden shadow-2xl" style={{
                  backgroundImage: 'repeating-conic-gradient(#1a1a1a 0% 25%, #0a0a0a 0% 50%)',
                  backgroundPosition: '0 0, 10px 10px',
                  backgroundSize: '20px 20px'
                }}>
                  <canvas
                    ref={miniCanvasRef}
                    width={1280}
                    height={960}
                    className="cursor-move border-2 border-zinc-700/50"
                    onMouseDown={handleMiniCanvasMouseDown}
                    onMouseMove={handleMiniCanvasMouseMove}
                    onMouseUp={handleMiniCanvasMouseUp}
                    onMouseLeave={handleMiniCanvasMouseUp}
                    style={{ 
                      display: 'block',
                      maxWidth: 'calc(100vw - 600px)',
                      maxHeight: 'calc(100vh - 150px)'
                    }}
                  />
                </div>
                
                {/* 画布信息 */}
                <div className="absolute bottom-4 left-4 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-lg text-[10px] text-zinc-400 font-mono border border-zinc-700/50">
                  1280 × 960 px
                </div>
                
                {/* 选区操作菜单 */}
                {editorSelection && (
                  <div className="absolute top-4 right-4 bg-[#141414]/95 backdrop-blur-md rounded-lg shadow-2xl border border-zinc-700 overflow-hidden">
                    <div className="px-4 py-3 border-b border-zinc-800">
                      <p className="text-xs font-bold text-white">选区操作</p>
                      <p className="text-[10px] text-zinc-500 font-mono mt-1">
                        {Math.round(editorSelection.width)} × {Math.round(editorSelection.height)} px
                      </p>
                    </div>
                    <div className="p-2 space-y-1">
                      <button 
                        onClick={handleGenerateWithSelection}
                        disabled={!editorPrompt.trim() || isGeneratingInEditor}
                        className="w-full px-3 py-2 text-left text-sm text-white hover:bg-indigo-600 bg-indigo-500 rounded transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed font-bold"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>根据选区生成</span>
                      </button>
                      <div className="h-px bg-zinc-800 my-1"></div>
                      <button 
                        onClick={() => setEditorSelection(null)}
                        className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 rounded transition-colors flex items-center gap-2"
                      >
                        <X className="w-4 h-4" />
                        <span>清除选区</span>
                      </button>
                    </div>
                  </div>
                )}
                
                {isGeneratingInEditor && (
                  <div className="absolute inset-0 bg-black/90 flex items-center justify-center rounded-lg backdrop-blur-sm">
                    <div className="text-center">
                      <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mx-auto mb-4" />
                      <p className="text-white text-sm font-bold">正在生成新图片...</p>
                      <p className="text-zinc-400 text-xs mt-2">请稍候，AI 正在处理中</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 右侧控制面板 */}
            <div className="w-80 bg-[#141414] border-l border-zinc-800 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                
                {/* 历史记录 */}
                {editHistory.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5" />
                        编辑历史 ({currentHistoryIndex + 1}/{editHistory.length})
                      </label>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={goToPreviousHistory}
                          disabled={currentHistoryIndex === 0}
                          className="p-1 rounded hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          title="上一步"
                        >
                          <ChevronLeft className="w-4 h-4 text-zinc-400" />
                        </button>
                        <button
                          onClick={goToNextHistory}
                          disabled={currentHistoryIndex === editHistory.length - 1}
                          className="p-1 rounded hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          title="下一步"
                        >
                          <ChevronRight className="w-4 h-4 text-zinc-400" />
                        </button>
                      </div>
                    </div>
                    
                    {/* 历史记录缩略图列表 */}
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {editHistory.map((item, index) => (
                        <button
                          key={item.timestamp}
                          onClick={() => goToHistoryIndex(index)}
                          className={`flex-shrink-0 w-16 h-16 rounded-lg border-2 overflow-hidden transition-all ${
                            index === currentHistoryIndex
                              ? 'border-indigo-500 ring-2 ring-indigo-500/30'
                              : 'border-zinc-700 hover:border-zinc-600'
                          }`}
                          title={`步骤 ${index + 1}`}
                        >
                          <img
                            src={item.imageUrl}
                            alt={`步骤 ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* 提示词输入 */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5" />
                    提示词
                  </label>
                  <textarea
                    value={editorPrompt}
                    onChange={(e) => setEditorPrompt(e.target.value)}
                    className="w-full bg-black border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500 resize-none h-24"
                    placeholder="描述你想要的图片效果..."
                  />
                </div>

                {/* 快速操作 */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">快速操作</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => setQuickAction(quickAction === 'expand' ? null : 'expand')}
                      className={`p-3 rounded-lg border-2 text-left transition-all ${
                        quickAction === 'expand'
                          ? 'border-indigo-500 bg-indigo-500/10'
                          : 'border-zinc-700 bg-zinc-900 hover:bg-zinc-800'
                      }`}
                    >
                      <Maximize2 className={`w-4 h-4 mb-1 ${quickAction === 'expand' ? 'text-indigo-400' : 'text-indigo-400'}`} />
                      <div className="text-xs font-bold text-white">扩图</div>
                      <div className="text-[10px] text-zinc-500">扩展画布</div>
                    </button>
                    <button 
                      onClick={() => setQuickAction(quickAction === 'enhance' ? null : 'enhance')}
                      className={`p-3 rounded-lg border-2 text-left transition-all ${
                        quickAction === 'enhance'
                          ? 'border-green-500 bg-green-500/10'
                          : 'border-zinc-700 bg-zinc-900 hover:bg-zinc-800'
                      }`}
                    >
                      <Sparkles className={`w-4 h-4 mb-1 ${quickAction === 'enhance' ? 'text-green-400' : 'text-green-400'}`} />
                      <div className="text-xs font-bold text-white">清晰度</div>
                      <div className="text-[10px] text-zinc-500">提升质量</div>
                    </button>
                  </div>
                </div>

                {/* 扩图设置 */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">扩图尺寸</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['1.5x', '2x', '4x'] as const).map((size) => (
                      <button
                        key={size}
                        onClick={() => setExpandSize(size)}
                        className={`py-2 rounded-lg border-2 transition-all text-center ${
                          expandSize === size
                            ? 'border-indigo-500 bg-indigo-500/10 text-white'
                            : 'border-zinc-700 bg-zinc-900 hover:border-zinc-600 text-zinc-400'
                        }`}
                      >
                        <div className="text-sm font-bold">{size}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 图片比例 */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">图片比例</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: '16:9', label: '16:9' },
                      { value: '9:16', label: '9:16' },
                      { value: '1:1', label: '1:1' },
                      { value: '4:3', label: '4:3' },
                      { value: '3:4', label: '3:4' }
                    ].map((ratio) => (
                      <button
                        key={ratio.value}
                        onClick={() => setEditorImageRatio(ratio.value as any)}
                        className={`py-2 rounded-lg border-2 transition-all text-center ${
                          editorImageRatio === ratio.value
                            ? 'border-indigo-500 bg-indigo-500/10 text-white'
                            : 'border-zinc-700 bg-zinc-900 hover:border-zinc-600 text-zinc-400'
                        }`}
                      >
                        <div className="text-xs font-bold">{ratio.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 图片尺寸 */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">图片尺寸</label>
                  <div className="grid grid-cols-2 gap-2">
                    {getSizeOptionsForRatio(editorImageRatio).map((size) => (
                      <button
                        key={size}
                        onClick={() => setEditorImageSize(size)}
                        className={`py-2 rounded-lg border-2 transition-all text-center ${
                          editorImageSize === size
                            ? 'border-indigo-500 bg-indigo-500/10 text-white'
                            : 'border-zinc-700 bg-zinc-900 hover:border-zinc-600 text-zinc-400'
                        }`}
                      >
                        <div className="text-xs font-bold">{size}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 镜头视角 */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                    <Aperture className="w-3.5 h-3.5" />
                    镜头视角
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: 'wide', label: '广角', color: 'border-green-500 bg-green-500/10' },
                      { value: 'medium', label: '中景', color: 'border-blue-500 bg-blue-500/10' },
                      { value: 'close', label: '特写', color: 'border-yellow-500 bg-yellow-500/10' },
                      { value: 'extreme-close', label: '大特写', color: 'border-red-500 bg-red-500/10' }
                    ].map((angle) => (
                      <button
                        key={angle.value}
                        onClick={() => setEditorCameraAngle(angle.value as any)}
                        className={`p-2 rounded-lg border-2 transition-all text-center ${
                          editorCameraAngle === angle.value
                            ? angle.color
                            : 'border-zinc-700 bg-zinc-900 hover:border-zinc-600'
                        }`}
                      >
                        <div className="text-xs font-bold text-white">{angle.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 镜头角度控制器 */}
                <div className="space-y-3">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                    <Aperture className="w-3.5 h-3.5" />
                    镜头角度控制
                  </label>
                  
                  {/* 水平角度（左右） */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-zinc-500">水平角度</span>
                      <span className="text-xs font-mono text-indigo-400">{cameraAngleControl.horizontal}°</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-zinc-600">左</span>
                      <input
                        type="range"
                        min="-90"
                        max="90"
                        value={cameraAngleControl.horizontal}
                        onChange={(e) => setCameraAngleControl(prev => ({ ...prev, horizontal: Number(e.target.value) }))}
                        className="flex-1 h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-indigo-500 [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-indigo-500 [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
                      />
                      <span className="text-[10px] text-zinc-600">右</span>
                    </div>
                  </div>
                  
                  {/* 垂直角度（上下） */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-zinc-500">垂直角度</span>
                      <span className="text-xs font-mono text-green-400">{cameraAngleControl.vertical}°</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-zinc-600">下</span>
                      <input
                        type="range"
                        min="-90"
                        max="90"
                        value={cameraAngleControl.vertical}
                        onChange={(e) => setCameraAngleControl(prev => ({ ...prev, vertical: Number(e.target.value) }))}
                        className="flex-1 h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-green-500 [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-green-500 [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
                      />
                      <span className="text-[10px] text-zinc-600">上</span>
                    </div>
                  </div>
                  
                  {/* 距离（远近） */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-zinc-500">镜头距离</span>
                      <span className="text-xs font-mono text-yellow-400">{cameraAngleControl.distance}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-zinc-600">近</span>
                      <input
                        type="range"
                        min="-50"
                        max="50"
                        value={cameraAngleControl.distance}
                        onChange={(e) => setCameraAngleControl(prev => ({ ...prev, distance: Number(e.target.value) }))}
                        className="flex-1 h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-yellow-500 [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-yellow-500 [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
                      />
                      <span className="text-[10px] text-zinc-600">远</span>
                    </div>
                  </div>
                  
                  {/* 预览生成的 prompt */}
                  <div className="p-3 bg-zinc-900/50 border border-zinc-800 rounded-lg">
                    <div className="text-[10px] text-zinc-500 mb-1">镜头角度描述：</div>
                    <div className="text-xs text-zinc-300 leading-relaxed">{generateCameraAnglePrompt()}</div>
                  </div>
                  
                  {/* 重置按钮 */}
                  <button
                    onClick={() => setCameraAngleControl({ horizontal: 0, vertical: 0, distance: 0 })}
                    className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-xs text-zinc-400 hover:text-white transition-colors flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-3 h-3" />
                    重置角度
                  </button>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


export default StageDirector;