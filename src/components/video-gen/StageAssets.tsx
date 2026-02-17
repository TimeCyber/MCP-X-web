import React, { useState, useEffect } from 'react';
import { User, MapPin, Check, Sparkles, Loader2, Users, RefreshCw, Shirt, Plus, X, Image as ImageIcon, Palette, Database, FolderOpen, Upload, Aperture, Eye, Film } from 'lucide-react';
import type { VideoGenProject, CharacterVariation } from '../../types/videogen';
import { generateImage, generateVisualPrompts, addAssetToLibrary, getAssetsFromLibrary, deleteAssetFromLibrary, AssetLibraryItem, IMAGE_STYLES, uploadFileToOss } from '../../services/videogenService';
import { modelApi, ModelInfo } from '../../services/modelApi';
import { chatApi } from '../../services/chatApi';

// 跨项目资源项
interface CrossProjectAsset {
  type: 'image' | 'video';
  url: string;
  thumbnailUrl?: string; // 视频缩略图
  prompt?: string;
  source: string; // 来源描述
}

interface Props {
  project: VideoGenProject;
  updateProject: (updates: Partial<VideoGenProject> | ((prev: VideoGenProject | null) => VideoGenProject | null)) => void;
}

const StageAssets: React.FC<Props> = ({ project, updateProject }) => {
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [batchProgress, setBatchProgress] = useState<{current: number, total: number} | null>(null);
  const [selectedCharId, setSelectedCharId] = useState<string | null>(null);

  // Variation Form State
  const [newVarName, setNewVarName] = useState("");
  const [newVarPrompt, setNewVarPrompt] = useState("");
  
  // 图像模型选择
  const [imageModels, setImageModels] = useState<ModelInfo[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [localImageModel, setLocalImageModel] = useState(project.imageModel || '');
  
  // Prompt 编辑状态
  const [editingPromptId, setEditingPromptId] = useState<string | null>(null);
  const [editingPromptValue, setEditingPromptValue] = useState<string>('');
  
  // 图片风格选择
  const [imageStyle, setImageStyle] = useState<string>(project.imageStyle || 'cinematic');
  
  // 当风格改变时，同步到项目数据中
  useEffect(() => {
    if (project.imageStyle !== imageStyle) {
      updateProject({
        ...project,
        imageStyle: imageStyle
      });
    }
  }, [imageStyle, project.id]); // 注意这里依赖 project.id 而不是整个 project，防止循环更新
  
  // 资源库状态
  const [showLibraryModal, setShowLibraryModal] = useState(false);
  const [libraryType, setLibraryType] = useState<'character' | 'scene'>('character');
  const [libraryAssets, setLibraryAssets] = useState<AssetLibraryItem[]>([]);
  const [selectingForId, setSelectingForId] = useState<string | null>(null);
  
  // 本地上传状态
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  
  // 预览大图
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // 资源库内的跨项目资源 Tab 状态
  const [projectTabs, setProjectTabs] = useState<{ id: string; sessionId: string; title: string }[]>([]);
  const [activeLibraryTabId, setActiveLibraryTabId] = useState<string>('local'); // 'local' = 本地资源库
  const [crossProjectAssets, setCrossProjectAssets] = useState<CrossProjectAsset[]>([]);
  const [loadingCrossAssets, setLoadingCrossAssets] = useState(false);

  // 加载图像模型列表
  useEffect(() => {
    const loadImageModels = async () => {
      setLoadingModels(true);
      try {
        const response = await modelApi.getModelList();
        if (response.code === 200 && response.data) {
          // 只显示 category 为 "text2image" 的模型
          const imgModels = response.data.filter((m: ModelInfo) => m.category === 'text2image');
          setImageModels(imgModels);
          
          // 如果项目已有设置的模型，使用项目的模型
          if (project.imageModel) {
            setLocalImageModel(project.imageModel);
          } 
          // 如果项目没有设置模型，尝试从 localStorage 读取上次使用的模型
          else if (imgModels.length > 0) {
            const lastUsedModel = localStorage.getItem('lastUsedImageModel');
            let modelToUse = imgModels[0].modelName; // 默认使用第一个
            
            // 如果有上次使用的模型，且该模型在当前列表中，则使用它
            if (lastUsedModel && imgModels.some((m: ModelInfo) => m.modelName === lastUsedModel)) {
              modelToUse = lastUsedModel;
            }
            
            setLocalImageModel(modelToUse);
            updateProject({ imageModel: modelToUse });
          }
        }
      } catch (error) {
        console.error('加载图像模型列表失败:', error);
      } finally {
        setLoadingModels(false);
      }
    };

    loadImageModels();
  }, []);

  // 当本地模型选择改变时，更新项目并保存到 localStorage
  useEffect(() => {
    if (localImageModel && localImageModel !== project.imageModel) {
      updateProject({ imageModel: localImageModel });
      // 保存用户选择的模型到 localStorage
      localStorage.setItem('lastUsedImageModel', localImageModel);
    }
  }, [localImageModel]);

  const handleGenerateAsset = async (type: 'character' | 'scene', id: string) => {
    setGeneratingId(id);
    try {
      // Find the item and get prompt
      let prompt = "";
      let existingImage: string | undefined;
      
      if (type === 'character') {
        const char = project.scriptData?.characters.find(c => String(c.id) === String(id));
        if (char) {
          // 直接使用已有的 visualPrompt，或基于角色数据构建简单提示词
          prompt = char.visualPrompt || generateVisualPrompts('character', char, project.scriptData?.genre || 'Cinematic');
          existingImage = char.referenceImage;
        }
      } else {
        const scene = project.scriptData?.scenes.find(s => String(s.id) === String(id));
        if (scene) {
          // 直接使用已有的 visualPrompt，或基于场景数据构建简单提示词
          prompt = scene.visualPrompt || generateVisualPrompts('scene', scene, project.scriptData?.genre || 'Cinematic');
          
          // 确保是空场景
          if (!prompt.toLowerCase().includes('empty scene')) {
            prompt = `Empty scene, no people, no characters, ${prompt}`;
          }
          existingImage = scene.referenceImage;
        }
      }

      let imageUrl: string;
      
      // 根据类型设置图片尺寸
      const imageSize = type === 'character' 
        ? { width: 1728, height: 2304 }  // 角色使用竖版尺寸
        : { width: 2560, height: 1440 };   // 场景使用横版尺寸
      
      // 直接调用 generateImage，它内部会处理 imageStyle
      imageUrl = await generateImage(
        prompt, 
        existingImage ? [existingImage] : [], 
        localImageModel || undefined, 
        project.sessionId,
        imageSize,
        imageStyle
      );

      // Update state
      updateProject((prev: VideoGenProject | null) => {
        if (!prev || !prev.scriptData) return prev;
        
        const newData = { ...prev.scriptData };
        if (type === 'character') {
          const c = newData.characters.find(c => String(c.id) === String(id));
          if (c) {
            c.referenceImage = imageUrl;
            // 自动加入本地资源库
            try {
              addAssetToLibrary({
                type: 'character',
                name: c.name,
                imageUrl: imageUrl,
                visualPrompt: c.visualPrompt || prompt,
                metadata: {
                  gender: c.gender,
                  age: c.age,
                  personality: c.personality
                }
              }).then(() => {
                console.log(`自动加入资源库: 角色 ${c.name}`);
              });
            } catch (err) {
              console.warn('自动加入资源库失败:', err);
            }
          }
        } else {
          const s = newData.scenes.find(s => String(s.id) === String(id));
          if (s) {
            s.referenceImage = imageUrl;
            // 自动加入本地资源库
            try {
              addAssetToLibrary({
                type: 'scene',
                name: s.location,
                imageUrl: imageUrl,
                visualPrompt: s.visualPrompt || prompt,
                metadata: {
                  location: s.location,
                  time: s.time,
                  atmosphere: s.atmosphere
                }
              }).then(() => {
                console.log(`自动加入资源库: 场景 ${s.location}`);
              });
            } catch (err) {
              console.warn('自动加入资源库失败:', err);
            }
          }
        }
        return { ...prev, scriptData: newData };
      });

    } catch (e: any) {
      console.error(e);
      
      // 检查是否是认证失败错误
      if (e.message && (e.message.includes('认证失败') || e.message.includes('401'))) {
        alert('登录已过期，请重新登录');
        window.location.href = '/login';
        return;
      }
      
      alert(`生成失败: ${e.message || '未知错误'}`);
    } finally {
      setGeneratingId(null);
    }
  };

  const handleBatchGenerate = async (type: 'character' | 'scene') => {
    const items = type === 'character' 
      ? project.scriptData?.characters 
      : project.scriptData?.scenes;
    
    if (!items) return;

    // Filter items that need generation
    const itemsToGen = items.filter(i => !i.referenceImage);
    const isRegenerate = itemsToGen.length === 0;

    if (isRegenerate) {
       if(!window.confirm(`确定要重新生成所有${type === 'character' ? '角色' : '场景'}图吗？`)) return;
    }

    const targetItems = isRegenerate ? items : itemsToGen;

    setBatchProgress({ current: 0, total: targetItems.length });

    for (let i = 0; i < targetItems.length; i++) {
      // Rate Limit Mitigation: 3s delay
      if (i > 0) await new Promise(r => setTimeout(r, 3000));
      
      await handleGenerateAsset(type, targetItems[i].id);
      setBatchProgress({ current: i + 1, total: targetItems.length });
    }

    setBatchProgress(null);
  };

  const handleAddVariation = (charId: string) => {
      if (!project.scriptData) return;
      const newData = { ...project.scriptData };
      const char = newData.characters.find(c => c.id === charId);
      if (!char) return;

      const newVar: CharacterVariation = {
          id: `var-${Date.now()}`,
          name: newVarName || "New Outfit",
          visualPrompt: newVarPrompt || char.visualPrompt || "",
          referenceImage: undefined
      };

      if (!char.variations) char.variations = [];
      char.variations.push(newVar);
      
      updateProject({ scriptData: newData });
      setNewVarName("");
      setNewVarPrompt("");
  };

  const handleGenerateVariation = async (charId: string, varId: string) => {
      const char = project.scriptData?.characters.find(c => c.id === charId);
      const variation = char?.variations?.find(v => v.id === varId);
      if (!char || !variation) return;

      setGeneratingId(varId);
      try {
          // IMPORTANT: Use Base Look as reference to maintain facial consistency
          const refImages = char.referenceImage ? [char.referenceImage] : [];
          // Enhance prompt to emphasize character consistency
          const enhancedPrompt = `Character: ${char.name}. ${variation.visualPrompt}. Keep facial features consistent with reference.`;
          
          // 角色变体使用竖版尺寸
          const characterSize = { width: 1242, height: 2208 };
          
          const imageUrl = await generateImage(
            enhancedPrompt, 
            refImages, 
            localImageModel || undefined, 
            project.sessionId, 
            characterSize,
            imageStyle
          );

          const newData = { ...project.scriptData! };
          const c = newData.characters.find(c => c.id === charId);
          const v = c?.variations.find(v => v.id === varId);
          if (v && c) {
            v.referenceImage = imageUrl;
            // 自动加入本地资源库
            try {
              await addAssetToLibrary({
                type: 'character',
                name: `${c.name} (${v.name})`,
                imageUrl: imageUrl,
                visualPrompt: v.visualPrompt || enhancedPrompt,
                metadata: {
                  gender: c.gender,
                  age: c.age,
                  personality: c.personality
                }
              });
              console.log(`自动加入资源库: 角色变体 ${c.name} - ${v.name}`);
            } catch (err) {
              console.warn('自动加入资源库失败:', err);
            }
          }

          updateProject({ scriptData: newData });
      } catch (e: any) {
          console.error(e);
          
          // 检查是否是认证失败错误
          if (e.message && (e.message.includes('认证失败') || e.message.includes('401'))) {
            alert('登录已过期，请重新登录');
            window.location.href = '/login';
            return;
          }
          
          alert("Variation generation failed");
      } finally {
          setGeneratingId(null);
      }
  };

  const handleGenerateThreeView = async (charId: string) => {
    const char = project.scriptData?.characters.find(c => c.id === charId);
    if (!char || !char.referenceImage) {
      alert("请先生成角色主效果图");
      return;
    }

    setGeneratingId(`threeview-${charId}`);
    try {
      // 使用主效果图作为参考
      const refImages = [char.referenceImage];
      // 构建三视图提示词：横板、三视图（前、后、左）、纯白背景、全身照
      const threeViewPrompt = `Full body character three-view photo (front view, back view, side view), standing, horizontal composition, pure white background, consistent with character: ${char.name}. ${char.visualPrompt || ''}`;
      
      
      // 三视图使用横版尺寸
      const threeViewSize = { width: 2560, height: 1440 };
      
      const imageUrl = await generateImage(
        threeViewPrompt, 
        refImages, 
        localImageModel || undefined, 
        project.sessionId, 
        threeViewSize,
        imageStyle
      );

      const newData = { ...project.scriptData! };
      const c = newData.characters.find(c => c.id === charId);
      if (c) {
        c.threeViewImage = imageUrl;
        // 自动加入本地资源库
        try {
          await addAssetToLibrary({
            type: 'character',
            name: `${c.name} (Three-view)`,
            imageUrl: imageUrl,
            visualPrompt: threeViewPrompt,
            metadata: {
              gender: c.gender,
              age: c.age,
              personality: c.personality
            }
          });
        } catch (err) {
          console.warn('自动加入资源库失败:', err);
        }
      }

      updateProject({ scriptData: newData });
    } catch (e: any) {
      console.error(e);
      if (e.message && (e.message.includes('认证失败') || e.message.includes('401'))) {
        alert('登录已过期，请重新登录');
        window.location.href = '/login';
        return;
      }
      alert("Three-view generation failed");
    } finally {
      setGeneratingId(null);
    }
  };
  
  const handleDeleteVariation = (charId: string, varId: string) => {
     if (!project.scriptData) return;
      const newData = { ...project.scriptData };
      const char = newData.characters.find(c => c.id === charId);
      if (!char) return;
      
      char.variations = char.variations.filter(v => v.id !== varId);
      updateProject({ scriptData: newData });
  };

  // 删除角色或场景的图片
  const handleDeleteImage = (type: 'character' | 'scene', id: string) => {
    if (!window.confirm(`确定要删除这张图片吗？删除后可以重新生成。`)) return;
    
    if (!project.scriptData) return;
    const newData = { ...project.scriptData };
    
    if (type === 'character') {
      const char = newData.characters.find(c => String(c.id) === String(id));
      if (char) char.referenceImage = undefined;
    } else {
      const scene = newData.scenes.find(s => String(s.id) === String(id));
      if (scene) scene.referenceImage = undefined;
    }
    
    updateProject({ scriptData: newData });
  };

  // 开始编辑 Prompt
  const handleStartEditPrompt = (type: 'character' | 'scene', id: string) => {
    if (!project.scriptData) return;
    
    let currentPrompt = '';
    if (type === 'character') {
      const char = project.scriptData.characters.find(c => String(c.id) === String(id));
      if (char) {
        currentPrompt = char.visualPrompt || generateVisualPrompts('character', char, project.scriptData.genre || 'Cinematic');
      }
    } else {
      const scene = project.scriptData.scenes.find(s => String(s.id) === String(id));
      if (scene) {
        currentPrompt = scene.visualPrompt || generateVisualPrompts('scene', scene, project.scriptData.genre || 'Cinematic');
      }
    }
    
    setEditingPromptId(id);
    setEditingPromptValue(currentPrompt);
  };

  // 保存编辑的 Prompt
  const handleSavePrompt = (type: 'character' | 'scene', id: string) => {
    if (!project.scriptData) return;
    const newData = { ...project.scriptData };
    
    if (type === 'character') {
      const char = newData.characters.find(c => String(c.id) === String(id));
      if (char) char.visualPrompt = editingPromptValue;
    } else {
      const scene = newData.scenes.find(s => String(s.id) === String(id));
      if (scene) scene.visualPrompt = editingPromptValue;
    }
    
    updateProject({ scriptData: newData });
    setEditingPromptId(null);
    setEditingPromptValue('');
  };

  // 取消编辑 Prompt
  const handleCancelEditPrompt = () => {
    setEditingPromptId(null);
    setEditingPromptValue('');
  };

  // 添加到资源库
  const handleAddToLibrary = async (type: 'character' | 'scene', id: string) => {
    if (!project.scriptData) return;
    
    try {
      if (type === 'character') {
        const char = project.scriptData.characters.find(c => String(c.id) === String(id));
        if (!char || !char.referenceImage) {
          alert('请先生成角色图片');
          return;
        }
        
        await addAssetToLibrary({
          type: 'character',
          name: char.name,
          imageUrl: char.referenceImage,
          visualPrompt: char.visualPrompt,
          metadata: {
            gender: char.gender,
            age: char.age,
            personality: char.personality
          }
        });
        
        console.log(`角色 "${char.name}" 已添加到资源库`);
      } else {
        const scene = project.scriptData.scenes.find(s => String(s.id) === String(id));
        if (!scene || !scene.referenceImage) {
          alert('请先生成场景图片');
          return;
        }
        
        await addAssetToLibrary({
          type: 'scene',
          name: scene.location,
          imageUrl: scene.referenceImage,
          visualPrompt: scene.visualPrompt,
          metadata: {
            location: scene.location,
            time: scene.time,
            atmosphere: scene.atmosphere
          }
        });
        
        console.log(`场景 "${scene.location}" 已添加到资源库`);
      }
    } catch (error: any) {
      console.error('添加到资源库失败:', error);
      
      // 检查是否是数据库结构问题
      if (error.name === 'NotFoundError' || error.message?.includes('object stores')) {
        alert('数据库需要更新。请刷新页面（F5）后重试。如果问题持续，请清除浏览器缓存。');
      } else {
        alert(`添加到资源库失败: ${error.message || '未知错误'}`);
      }
    }
  };

  // 打开资源库选择器
  const handleOpenLibrary = async (type: 'character' | 'scene', id: string) => {
    setLibraryType(type);
    setSelectingForId(id);
    setShowLibraryModal(true);
    setActiveLibraryTabId('local'); // 重置为本地资源库
    
    try {
      // 加载本地资源库
      const assets = await getAssetsFromLibrary(type);
      setLibraryAssets(assets);
      console.log('✅ 本地资源库加载成功:', assets.length, '个资源');
      
      // 加载所有视频工作室项目作为 tabs
      const userId = localStorage.getItem('userId');
      console.log('📌 当前用户ID:', userId);
      console.log('📌 当前项目sessionId:', project.sessionId);
      
      if (userId) {
        const response = await chatApi.getSessionList(userId, 'mcpx-video-studio');
        console.log('📦 获取项目列表响应:', response);
        
        if (response.code === 200) {
          // API返回的数据在 rows 字段中
          const sessions = (response.rows || response.data || []) as any[];
          console.log('📋 所有视频工作室项目:', sessions.length, '个');
          console.log('项目列表:', sessions.map((s: any) => ({ id: s.id, title: s.sessionTitle })));
          
          // 过滤掉当前项目 - 使用字符串比较确保类型一致
          const currentSessionId = String(project.sessionId || '');
          console.log('🔍 当前项目ID (转字符串):', currentSessionId);
          
          const otherProjects = sessions
            .filter((s: any) => {
              const sessionIdStr = String(s.id || '');
              const isCurrentProject = sessionIdStr === currentSessionId;
              console.log(`项目 ${s.sessionTitle} (${sessionIdStr}): ${isCurrentProject ? '当前项目，过滤掉' : '其他项目，保留'}`);
              return !isCurrentProject;
            })
            .map((s: any) => ({
              id: s.id,
              sessionId: s.id,
              title: s.sessionTitle || '未命名项目'
            }));
          
          console.log('✅ 设置项目tabs:', otherProjects.length, '个');
          console.log('Tabs内容:', otherProjects);
          setProjectTabs(otherProjects);
        } else {
          console.warn('⚠️ API响应异常:', response);
        }
      } else {
        console.warn('⚠️ 用户未登录');
      }
    } catch (error: any) {
      console.error('❌ 加载资源库失败:', error);
      
      // 检查是否是数据库结构问题
      if (error.name === 'NotFoundError' || error.message?.includes('object stores')) {
        alert('数据库需要更新。请刷新页面（F5）后重试。如果问题持续，请清除浏览器缓存。');
        setShowLibraryModal(false);
      } else {
        alert(`加载资源库失败: ${error.message || '未知错误'}`);
      }
    }
  };

  // 从资源库选择
  const handleSelectFromLibrary = (asset: AssetLibraryItem | CrossProjectAsset) => {
    if (!project.scriptData || !selectingForId) return;
    
    const newData = { ...project.scriptData };
    const imageUrl = 'imageUrl' in asset ? asset.imageUrl : asset.url;
    const visualPrompt = 'visualPrompt' in asset ? asset.visualPrompt : ('prompt' in asset ? asset.prompt : undefined);
    
    if (libraryType === 'character') {
      const char = newData.characters.find(c => String(c.id) === String(selectingForId));
      if (char) {
        char.referenceImage = imageUrl;
        if (visualPrompt) char.visualPrompt = visualPrompt;
      }
    } else {
      const scene = newData.scenes.find(s => String(s.id) === String(selectingForId));
      if (scene) {
        scene.referenceImage = imageUrl;
        if (visualPrompt) scene.visualPrompt = visualPrompt;
      }
    }
    
    updateProject({ scriptData: newData });
    setShowLibraryModal(false);
    setSelectingForId(null);
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

      console.log('🔄 开始加载跨项目资源，sessionId:', sessionId);

      // 获取该项目的聊天记录
      const response = await chatApi.getChatList({ sessionId, userId });
      console.log('📦 获取聊天记录响应:', response);
      console.log('📦 响应code:', response.code, '类型:', typeof response.code);
      
      // 检查响应是否成功 - 兼容不同的成功码
      if (response.code !== 200 && response.code !== '200' && !response.rows && !response.data) {
        console.error('❌ API响应失败:', response);
        throw new Error(`加载项目数据失败: ${response.msg || '未知错误'}`);
      }

      // API返回的数据在 rows 字段中
      const messages = (response.rows || response.data || []) as any[];
      console.log('📋 聊天记录数量:', messages.length);
      
      const assets: CrossProjectAsset[] = [];

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

      console.log('📸 从消息中提取到', assets.length, '个资源');

      // 尝试从 sessionContent 解析项目数据
      const session = await chatApi.getSessionList(userId, 'mcpx-video-studio');
      console.log('📦 获取项目列表响应:', session);
      
      if (session.code === 200 || session.code === '200') {
        const sessions = (session.rows || session.data || []) as any[];
        console.log('📋 找到', sessions.length, '个项目');
        
        const targetSession = sessions.find((s: any) => String(s.id) === String(sessionId));
        console.log('🎯 目标项目:', targetSession ? targetSession.sessionTitle : '未找到');
        
        if (targetSession?.sessionContent) {
          try {
            const projectData = JSON.parse(targetSession.sessionContent);
            
            // 提取角色图片
            if (projectData.scriptData?.characters) {
              projectData.scriptData.characters.forEach((char: any) => {
                if (char.referenceImage) {
                  assets.push({
                    type: 'image',
                    url: char.referenceImage,
                    source: `角色: ${char.name}`,
                    prompt: char.visualPrompt
                  });
                }
                if (char.threeViewImage) {
                  assets.push({
                    type: 'image',
                    url: char.threeViewImage,
                    source: `角色三视图: ${char.name}`,
                    prompt: char.visualPrompt
                  });
                }
                // 角色变体
                if (char.variations) {
                  char.variations.forEach((v: any) => {
                    if (v.referenceImage) {
                      assets.push({
                        type: 'image',
                        url: v.referenceImage,
                        source: `${char.name} - ${v.name}`,
                        prompt: v.visualPrompt
                      });
                    }
                  });
                }
              });
            }
            
            // 提取场景图片
            if (projectData.scriptData?.scenes) {
              projectData.scriptData.scenes.forEach((scene: any) => {
                if (scene.referenceImage) {
                  assets.push({
                    type: 'image',
                    url: scene.referenceImage,
                    source: `场景: ${scene.location}`,
                    prompt: scene.visualPrompt
                  });
                }
              });
            }
            
            // 提取关键帧
            if (projectData.keyframes) {
              projectData.keyframes.forEach((kf: any) => {
                if (kf.imageUrl) {
                  assets.push({
                    type: 'image',
                    url: kf.imageUrl,
                    source: `关键帧 #${kf.id}`,
                    prompt: kf.visualPrompt
                  });
                }
              });
            }
            
            // 提取生成的视频
            if (projectData.generatedVideos) {
              projectData.generatedVideos.forEach((video: any) => {
                if (video.url) {
                  assets.push({
                    type: 'video',
                    url: video.url,
                    thumbnailUrl: video.thumbnailUrl,
                    source: `生成视频 #${video.id || 'unknown'}`,
                    prompt: video.prompt
                  });
                }
              });
            }
            console.log('📊 从项目数据中提取资源统计:');
            console.log('  - 角色图片:', projectData.scriptData?.characters?.length || 0);
            console.log('  - 场景图片:', projectData.scriptData?.scenes?.length || 0);
            console.log('  - 关键帧:', projectData.keyframes?.length || 0);
            console.log('  - 生成视频:', projectData.generatedVideos?.length || 0);
          } catch (parseError) {
            console.warn('⚠️ 解析项目数据失败:', parseError);
          }
        } else {
          console.log('ℹ️ 目标项目没有 sessionContent 数据');
        }
      } else {
        console.warn('⚠️ 获取项目列表失败:', session);
      }

      // 去重
      const uniqueAssets = assets.filter((asset, index, self) =>
        index === self.findIndex((a) => a.url === asset.url)
      );

      console.log('✅ 加载完成，总共', assets.length, '个资源，去重后', uniqueAssets.length, '个');
      console.log('📊 资源类型统计:');
      console.log('  - 图片:', uniqueAssets.filter(a => a.type === 'image').length);
      console.log('  - 视频:', uniqueAssets.filter(a => a.type === 'video').length);
      
      setCrossProjectAssets(uniqueAssets);
    } catch (error: any) {
      console.error('❌ 加载跨项目资源失败:', error);
      console.error('错误详情:', error.message, error.stack);
      alert(`加载失败: ${error.message || '未知错误'}`);
    } finally {
      setLoadingCrossAssets(false);
    }
  };

  // 当切换资源库 Tab 时
  const handleLibraryTabChange = (tabId: string) => {
    setActiveLibraryTabId(tabId);
    
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

  // 从资源库删除
  const handleDeleteFromLibrary = async (assetId: number) => {
    if (!window.confirm('确定要从资源库中删除这个资源吗？')) return;
    
    try {
      await deleteAssetFromLibrary(assetId);
      // 重新加载资源库
      const assets = await getAssetsFromLibrary(libraryType);
      setLibraryAssets(assets);
    } catch (error) {
      console.error('删除资源失败:', error);
      alert('删除资源失败');
    }
  };

  // 处理本地图片上传
  const handleLocalUpload = async (type: 'character' | 'scene', id: string, file: File) => {
    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件');
      return;
    }

    // 验证文件大小 (限制为 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('图片文件大小不能超过 10MB');
      return;
    }

    setUploadingId(id);
    
    try {
      // 上传到OSS
      const imageUrl = await uploadFileToOss(file);
      console.log('图片已上传到OSS:', imageUrl);

      // 更新项目数据
      if (!project.scriptData) return;
      const newData = { ...project.scriptData };
      
      if (type === 'character') {
        const char = newData.characters.find(c => String(c.id) === String(id));
        if (char) char.referenceImage = imageUrl;
      } else {
        const scene = newData.scenes.find(s => String(s.id) === String(id));
        if (scene) scene.referenceImage = imageUrl;
      }
      
      updateProject({ scriptData: newData });
      
    } catch (error: any) {
      console.error('上传图片失败:', error);
      
      // 检查是否是认证失败错误
      if (error.message && (error.message.includes('认证失败') || error.message.includes('登录已过期') || error.message.includes('401'))) {
        alert('登录已过期，请重新登录');
        window.location.href = '/login';
        return;
      }
      
      alert(`上传失败: ${error.message || '未知错误'}`);
    } finally {
      setUploadingId(null);
    }
  };

  // 触发文件选择
  const triggerFileUpload = (type: 'character' | 'scene', id: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        handleLocalUpload(type, id, file);
      }
    };
    input.click();
  };

  if (!project.scriptData) return (
      <div className="h-full flex flex-col items-center justify-center bg-[#121212] text-zinc-500">
         <p>请先完成 Phase 01 剧本分析</p>
      </div>
  );
  
  const allCharactersReady = project.scriptData.characters.every(c => c.referenceImage);
  const allScenesReady = project.scriptData.scenes.every(s => s.referenceImage);
  const selectedChar = project.scriptData.characters.find(c => c.id === selectedCharId);

  return (
    <div className="flex flex-col h-full bg-[#121212] relative overflow-hidden">
      
      {/* Wardrobe Modal */}
      {selectedChar && (
          <div className="absolute inset-0 z-40 bg-black/90 backdrop-blur-sm flex items-center justify-center p-8 animate-in fade-in duration-200">
              <div className="bg-[#141414] border border-zinc-800 w-full max-w-4xl max-h-[90vh] rounded-2xl flex flex-col shadow-2xl overflow-hidden">
                  {/* Modal Header */}
                  <div className="h-16 px-8 border-b border-zinc-800 flex items-center justify-between shrink-0 bg-[#1A1A1A]">
                      <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-zinc-800 overflow-hidden border border-zinc-700">
                              {selectedChar.referenceImage && <img src={selectedChar.referenceImage} className="w-full h-full object-cover"/>}
                          </div>
                          <div>
                              <h3 className="text-lg font-bold text-white">{selectedChar.name}</h3>
                              <p className="text-xs text-zinc-500 font-mono uppercase tracking-wider">Wardrobe & Variations</p>
                          </div>
                      </div>
                      <button onClick={() => setSelectedCharId(null)} className="p-2 hover:bg-zinc-800 rounded-full transition-colors">
                          <X className="w-5 h-5 text-zinc-500" />
                      </button>
                  </div>
                  
                  {/* Modal Body */}
                  <div className="flex-1 overflow-y-auto p-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          {/* Base Look */}
                          <div>
                              <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                  <User className="w-4 h-4" /> Base Appearance
                              </h4>
                              <div className="bg-[#0A0A0A] p-4 rounded-xl border border-zinc-800">
                                  <div className="aspect-[3/4] bg-zinc-900 rounded-lg overflow-hidden mb-4 relative group/base">
                                      {selectedChar.referenceImage ? (
                                          <>
                                            <img src={selectedChar.referenceImage} className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/base:opacity-100 transition-opacity flex items-center justify-center">
                                                <button 
                                                  onClick={() => setPreviewImage(selectedChar.referenceImage!)}
                                                  className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-all border border-white/20"
                                                >
                                                    <Eye className="w-6 h-6" />
                                                </button>
                                            </div>
                                          </>
                                      ) : (
                                          <div className="flex items-center justify-center h-full text-zinc-700">No Image</div>
                                      )}
                                      <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 backdrop-blur rounded text-[10px] text-white font-bold uppercase border border-white/10">Default</div>
                                  </div>
                                  <p className="text-xs text-zinc-500 leading-relaxed font-mono">{selectedChar.visualPrompt}</p>
                              </div>

                              {/* Three-view Section */}
                              <div className="mt-8">
                                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Aperture className="w-4 h-4" /> Character Three-view
                                </h4>
                                <div className="bg-[#0A0A0A] p-4 rounded-xl border border-zinc-800">
                                    <div className="aspect-video bg-zinc-900 rounded-lg overflow-hidden mb-4 relative border border-zinc-800">
                                        {selectedChar.threeViewImage ? (
                                            <div className="group/three relative w-full h-full">
                                                <img src={selectedChar.threeViewImage} className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/three:opacity-100 transition-opacity flex items-center justify-center">
                                                    <button 
                                                      onClick={() => setPreviewImage(selectedChar.threeViewImage!)}
                                                      className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-all border border-white/20"
                                                    >
                                                        <Eye className="w-6 h-6" />
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center h-full text-zinc-700 gap-2">
                                              <RefreshCw className="w-6 h-6 opacity-20" />
                                              <span className="text-[10px] uppercase tracking-widest">No Three-view Generated</span>
                                            </div>
                                        )}
                                        {generatingId === `threeview-${selectedChar.id}` && (
                                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
                                                <Loader2 className="w-6 h-6 text-white animate-spin" />
                                            </div>
                                        )}
                                    </div>
                                    <button
                                      onClick={() => handleGenerateThreeView(selectedChar.id)}
                                      disabled={generatingId === `threeview-${selectedChar.id}` || !selectedChar.referenceImage}
                                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
                                    >
                                      <RefreshCw className={`w-3 h-3 ${generatingId === `threeview-${selectedChar.id}` ? 'animate-spin' : ''}`} />
                                      {selectedChar.threeViewImage ? 'Regenerate Three-view' : 'Generate Three-view'}
                                    </button>
                                    <p className="text-[9px] text-zinc-600 mt-2 text-center font-mono">Horizontal full-body photo (Front, Back, Side)</p>
                                </div>
                              </div>
                          </div>

                          {/* Variations */}
                          <div>
                              <div className="flex items-center justify-between mb-4">
                                  <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                                      <Shirt className="w-4 h-4" /> Variations / Outfits
                                  </h4>
                              </div>

                              <div className="space-y-4">
                                  {/* List */}
                                  {(selectedChar.variations || []).map((variation) => (
                                      <div key={variation.id} className="flex gap-4 p-4 bg-[#0A0A0A] border border-zinc-800 rounded-xl group hover:border-zinc-700 transition-colors">
                                          <div className="w-20 h-24 bg-zinc-900 rounded-lg flex-shrink-0 overflow-hidden relative border border-zinc-800 group/var">
                                              {variation.referenceImage ? (
                                                  <>
                                                    <img src={variation.referenceImage} className="w-full h-full object-cover" />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/var:opacity-100 transition-opacity flex items-center justify-center">
                                                        <button 
                                                          onClick={() => setPreviewImage(variation.referenceImage!)}
                                                          className="p-1.5 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-all border border-white/20"
                                                        >
                                                            <Eye className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                  </>
                                              ) : (
                                                  <div className="w-full h-full flex items-center justify-center">
                                                      <Shirt className="w-6 h-6 text-zinc-800" />
                                                  </div>
                                              )}
                                              {generatingId === variation.id && (
                                                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                                      <Loader2 className="w-4 h-4 text-white animate-spin" />
                                                  </div>
                                              )}
                                          </div>
                                          <div className="flex-1 min-w-0">
                                              <div className="flex justify-between items-start mb-2">
                                                  <h5 className="font-bold text-zinc-200 text-sm">{variation.name}</h5>
                                                  <button onClick={() => handleDeleteVariation(selectedChar.id, variation.id)} className="text-zinc-600 hover:text-red-500"><X className="w-3 h-3"/></button>
                                              </div>
                                              <p className="text-[10px] text-zinc-500 line-clamp-2 mb-3 font-mono">{variation.visualPrompt}</p>
                                              <button 
                                                  onClick={() => handleGenerateVariation(selectedChar.id, variation.id)}
                                                  disabled={generatingId === variation.id}
                                                  className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 hover:text-white flex items-center gap-1 transition-colors"
                                              >
                                                  <RefreshCw className={`w-3 h-3 ${generatingId === variation.id ? 'animate-spin' : ''}`} />
                                                  {variation.referenceImage ? 'Regenerate' : 'Generate Look'}
                                              </button>
                                          </div>
                                      </div>
                                  ))}

                                  {/* Add New */}
                                  <div className="p-4 border border-dashed border-zinc-800 rounded-xl bg-[#0A0A0A]/50">
                                      <div className="space-y-3">
                                          <input 
                                              type="text" 
                                              placeholder="Variation Name (e.g. Tactical Gear)" 
                                              value={newVarName}
                                              onChange={e => setNewVarName(e.target.value)}
                                              className="w-full bg-[#141414] border border-zinc-800 rounded px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
                                          />
                                          <textarea 
                                              placeholder="Visual description of outfit/state..."
                                              value={newVarPrompt}
                                              onChange={e => setNewVarPrompt(e.target.value)}
                                              className="w-full bg-[#141414] border border-zinc-800 rounded px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 resize-none h-16"
                                          />
                                          <button 
                                              onClick={() => handleAddVariation(selectedChar.id)}
                                              disabled={!newVarName || !newVarPrompt}
                                              className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
                                          >
                                              <Plus className="w-3 h-3" /> Add Variation
                                          </button>
                                      </div>
                                  </div>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* Asset Library Modal */}
      {showLibraryModal && (
        <div className="absolute inset-0 z-40 bg-black/90 backdrop-blur-sm flex items-center justify-center p-8 animate-in fade-in duration-200">
          <div className="bg-[#141414] border border-zinc-800 w-full max-w-5xl max-h-[90vh] rounded-2xl flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="h-16 px-8 border-b border-zinc-800 flex items-center justify-between shrink-0 bg-[#1A1A1A]">
              <div className="flex items-center gap-4">
                <Database className="w-5 h-5 text-indigo-500" />
                <div>
                  <h3 className="text-lg font-bold text-white">资源库</h3>
                  <p className="text-xs text-zinc-500 font-mono uppercase tracking-wider">
                    {libraryType === 'character' ? '角色库' : '场景库'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setShowLibraryModal(false);
                  setSelectingForId(null);
                  setActiveLibraryTabId('local');
                  setCrossProjectAssets([]);
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
              {(() => {
                console.log('🎨 渲染Tabs，projectTabs数量:', projectTabs.length);
                console.log('🎨 projectTabs内容:', projectTabs);
                return projectTabs.map(tab => (
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
                ));
              })()}
            </div>
            
            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-8">
              {activeLibraryTabId === 'local' ? (
                // 本地资源库视图
                libraryAssets.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-zinc-500">
                    <Database className="w-16 h-16 mb-4 opacity-20" />
                    <p className="text-sm">资源库为空</p>
                    <p className="text-xs mt-2">生成{libraryType === 'character' ? '角色' : '场景'}图片后，可以添加到资源库</p>
                  </div>
                ) : (
                  <div className={`grid ${libraryType === 'character' ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'} gap-6`}>
                    {libraryAssets.map((asset) => (
                      <div 
                        key={asset.id} 
                        className="bg-[#0A0A0A] border border-zinc-800 rounded-xl overflow-hidden group hover:border-indigo-500 transition-all cursor-pointer"
                        onClick={() => handleSelectFromLibrary(asset)}
                      >
                        <div className={`${libraryType === 'character' ? 'aspect-[3/4]' : 'aspect-video'} bg-zinc-900 relative group/libitem`}>
                          <img src={asset.imageUrl} alt={asset.name} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/libitem:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm gap-3">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setPreviewImage(asset.imageUrl);
                              }}
                              className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-all border border-white/20"
                              title="查看大图"
                            >
                              <Eye className="w-6 h-6" />
                            </button>
                            <div className="text-center">
                              <Check className="w-8 h-8 text-white mx-auto mb-2" />
                              <p className="text-white text-sm font-bold">选择此资源</p>
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (asset.id) handleDeleteFromLibrary(asset.id);
                            }}
                            className="absolute top-2 right-2 p-1.5 bg-red-500/80 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            title="从资源库删除"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="p-3 border-t border-zinc-800">
                          <h4 className="font-bold text-zinc-200 text-sm truncate mb-1">{asset.name}</h4>
                          {asset.visualPrompt && (
                            <p className="text-[9px] text-zinc-500 line-clamp-2 font-mono">{asset.visualPrompt}</p>
                          )}
                          {asset.metadata && (
                            <div className="flex gap-1 mt-2 flex-wrap">
                              {asset.metadata.gender && (
                                <span className="px-1.5 py-0.5 bg-zinc-900 text-zinc-500 text-[9px] rounded uppercase font-mono">
                                  {asset.metadata.gender}
                                </span>
                              )}
                              {asset.metadata.age && (
                                <span className="px-1.5 py-0.5 bg-zinc-900 text-zinc-500 text-[9px] rounded uppercase font-mono">
                                  {asset.metadata.age}
                                </span>
                              )}
                              {asset.metadata.time && (
                                <span className="px-1.5 py-0.5 bg-zinc-900 text-zinc-500 text-[9px] rounded uppercase font-mono">
                                  {asset.metadata.time}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                // 跨项目资源视图
                loadingCrossAssets ? (
                  <div className="flex flex-col items-center justify-center h-full text-zinc-500">
                    <Loader2 className="w-8 h-8 animate-spin mb-4 text-indigo-500" />
                    <p className="text-sm">正在加载项目资源...</p>
                  </div>
                ) : crossProjectAssets.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-zinc-500">
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
                        <div className={`grid ${libraryType === 'character' ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'} gap-4`}>
                          {crossProjectAssets.filter(a => a.type === 'image').map((asset, idx) => (
                            <div 
                              key={idx} 
                              className="bg-[#0A0A0A] border border-zinc-800 rounded-xl overflow-hidden group hover:border-indigo-500 transition-all cursor-pointer"
                              onClick={() => handleSelectFromLibrary(asset)}
                            >
                              <div className={`${libraryType === 'character' ? 'aspect-[3/4]' : 'aspect-video'} bg-zinc-900 relative group/crossitem`}>
                                <img src={asset.url} alt={asset.source} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/crossitem:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm gap-3">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setPreviewImage(asset.url);
                                    }}
                                    className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-all border border-white/20"
                                    title="查看大图"
                                  >
                                    <Eye className="w-6 h-6" />
                                  </button>
                                  <div className="text-center">
                                    <Check className="w-8 h-8 text-white mx-auto mb-2" />
                                    <p className="text-white text-sm font-bold">选择此资源</p>
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
                            <div key={idx} className="bg-[#141414] border border-zinc-800 rounded-xl overflow-hidden group hover:border-zinc-600 transition-all">
                              <div className="aspect-video bg-zinc-900 relative">
                                <video
                                  src={asset.url}
                                  poster={asset.thumbnailUrl}
                                  controls
                                  preload="metadata"
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 backdrop-blur rounded text-[10px] text-white font-bold uppercase border border-white/10 flex items-center gap-1">
                                  <Film className="w-3 h-3" /> Video
                                </div>
                              </div>
                              <div className="p-2 border-t border-zinc-800">
                                <p className="text-[10px] text-zinc-400 truncate font-mono">{asset.source}</p>
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

      {/* Header - Consistent with Director */}
      <div className="h-16 border-b border-zinc-800 bg-[#1A1A1A] px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-3">
                  <Users className="w-5 h-5 text-indigo-500" />
                  角色与场景
                  <span className="text-xs text-zinc-600 font-mono font-normal uppercase tracking-wider bg-black/30 px-2 py-1 rounded">Assets & Casting</span>
              </h2>
          </div>
          <div className="flex items-center gap-3">
             {/* 图像模型选择器 */}
             <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-zinc-500" />
                <select
                  value={localImageModel}
                  onChange={(e) => setLocalImageModel(e.target.value)}
                  disabled={loadingModels}
                  className="bg-[#141414] border border-zinc-700 text-white px-3 py-1.5 text-xs rounded-md appearance-none focus:border-zinc-500 focus:outline-none transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed min-w-[200px]"
                >
                  {loadingModels ? (
                    <option value="">加载中...</option>
                  ) : imageModels.length === 0 ? (
                    <option value="">暂无图像模型</option>
                  ) : (
                    imageModels.map((model) => {
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
             
             {/* 图片风格选择器 */}
             <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-zinc-500" />
                <select
                  value={imageStyle}
                  onChange={(e) => setImageStyle(e.target.value)}
                  className="bg-[#141414] border border-zinc-700 text-white px-3 py-1.5 text-xs rounded-md appearance-none focus:border-zinc-500 focus:outline-none transition-all cursor-pointer min-w-[140px]"
                >
                  {IMAGE_STYLES.map((style) => (
                    <option key={style.value} value={style.value}>
                      {style.label}
                    </option>
                  ))}
                </select>
             </div>
             
             <div className="w-px h-6 bg-zinc-700"></div>
             
             <div className="flex gap-2">
                 <span className="px-2 py-1 bg-zinc-900 border border-zinc-800 rounded text-[10px] text-zinc-400 font-mono uppercase">
                    {project.scriptData.characters.length} CHARS
                 </span>
                 <span className="px-2 py-1 bg-zinc-900 border border-zinc-800 rounded text-[10px] text-zinc-400 font-mono uppercase">
                    {project.scriptData.scenes.length} SCENES
                 </span>
             </div>
          </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 space-y-12">
        {batchProgress && (
          <div className="mb-8 bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-6 flex items-center gap-6 animate-in slide-in-from-top-4 duration-300">
            <div className="w-12 h-12 bg-indigo-500/20 rounded-xl flex items-center justify-center shrink-0">
              <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-end mb-3">
                <div>
                  <h3 className="text-base font-bold text-white mb-1">正在批量生成资源...</h3>
                  <p className="text-xs text-zinc-500 font-mono">
                    进度: {batchProgress.current} / {batchProgress.total}
                  </p>
                </div>
                <span className="text-lg font-bold font-mono text-indigo-400">
                  {Math.round((batchProgress.current / batchProgress.total) * 100)}%
                </span>
              </div>
              <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-500 transition-all duration-300 shadow-[0_0_10px_rgba(99,102,241,0.5)]" 
                  style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        )}

        {/* Characters Section */}
        <section>
          <div className="flex items-end justify-between mb-6 border-b border-zinc-800 pb-4">
            <div>
               <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                 <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                 角色定妆 (Casting)
               </h3>
               <p className="text-xs text-zinc-500 mt-1 pl-3.5">为剧本中的角色生成一致的参考形象</p>
            </div>
            <button 
              onClick={() => handleBatchGenerate('character')}
              disabled={!!batchProgress}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-all flex items-center gap-2 ${
                  allCharactersReady
                    ? 'bg-[#141414] text-zinc-400 border border-zinc-700 hover:text-white hover:border-zinc-500'
                    : 'bg-white text-black hover:bg-zinc-200 shadow-lg shadow-white/5'
              }`}
            >
              {allCharactersReady ? <RefreshCw className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
              {allCharactersReady ? '重新生成所有角色' : '一键生成所有角色'}
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {project.scriptData.characters.map((char) => {
              const isEditingPrompt = editingPromptId === char.id;
              const currentPrompt = char.visualPrompt || generateVisualPrompts('character', char, project.scriptData?.genre || 'Cinematic');
              
              return (
              <div key={char.id} className="bg-[#141414] border border-zinc-800 rounded-xl overflow-hidden flex flex-col group hover:border-zinc-600 transition-all hover:shadow-lg">
                <div className="aspect-[3/4] bg-zinc-900 relative">
                  {char.referenceImage ? (
                    <>
                      <img src={char.referenceImage} alt={char.name} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 backdrop-blur-sm p-2">
                         <div className="flex gap-2">
                           <button 
                             onClick={() => setPreviewImage(char.referenceImage!)}
                             className="p-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-all border border-white/20"
                             title="查看大图"
                           >
                             <Eye className="w-4 h-4" />
                           </button>
                           <button 
                             onClick={() => handleGenerateAsset('character', char.id)}
                             disabled={generatingId === char.id || uploadingId === char.id}
                             className="p-2 bg-black/50 text-white rounded-full border border-white/20 hover:bg-white hover:text-black transition-colors backdrop-blur disabled:opacity-50"
                             title="重新生成"
                           >
                             {generatingId === char.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                           </button>
                         </div>
                         <div className="flex flex-col gap-1.5 w-full px-2">
                           <button 
                             onClick={() => triggerFileUpload('character', char.id)}
                             disabled={generatingId === char.id || uploadingId === char.id}
                             className="w-full px-3 py-1 bg-blue-500/80 text-white text-[9px] font-bold uppercase tracking-wider rounded border border-white/20 hover:bg-blue-600 transition-colors backdrop-blur disabled:opacity-50 flex items-center justify-center gap-1"
                           >
                             <Upload className="w-3 h-3" />
                             上传图片
                           </button>
                           <button 
                             onClick={() => handleOpenLibrary('character', char.id)}
                             className="w-full px-3 py-1 bg-indigo-500/80 text-white text-[9px] font-bold uppercase tracking-wider rounded border border-white/20 hover:bg-indigo-600 transition-colors backdrop-blur flex items-center justify-center gap-1"
                           >
                             <FolderOpen className="w-3 h-3" />
                             从资源库选择
                           </button>
                           <div className="flex gap-1.5">
                             <button 
                               onClick={() => handleAddToLibrary('character', char.id)}
                               disabled={generatingId === char.id || uploadingId === char.id}
                               className="flex-1 px-3 py-1 bg-zinc-700/80 text-white text-[9px] font-bold uppercase tracking-wider rounded border border-white/20 hover:bg-zinc-600 transition-colors backdrop-blur disabled:opacity-50 flex items-center justify-center gap-1"
                             >
                               <Database className="w-3 h-3" />
                               加入库
                             </button>
                             <button 
                               onClick={() => handleDeleteImage('character', char.id)}
                               disabled={generatingId === char.id || uploadingId === char.id}
                               className="flex-1 px-3 py-1 bg-red-500/80 text-white text-[9px] font-bold uppercase tracking-wider rounded border border-white/20 hover:bg-red-600 transition-colors backdrop-blur disabled:opacity-50 flex items-center justify-center gap-1"
                             >
                               <X className="w-3 h-3" />
                               删除
                             </button>
                           </div>
                         </div>
                      </div>
                      <div className="absolute top-2 right-2 p-1 bg-indigo-500 text-white rounded shadow-lg backdrop-blur">
                        <Check className="w-3 h-3" />
                      </div>
                    </>
                  ) : (
                     <div className="w-full h-full flex flex-col items-center justify-center text-zinc-700 p-4 text-center">
                       <User className="w-10 h-10 mb-3 opacity-10" />
                       <div className="flex flex-col gap-2 w-full">
                         <button
                            onClick={() => handleGenerateAsset('character', char.id)}
                            disabled={generatingId === char.id || uploadingId === char.id}
                            className="px-4 py-2 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 rounded text-xs font-bold transition-all border border-zinc-700 flex items-center justify-center gap-2"
                         >
                           {generatingId === char.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                           生成
                         </button>
                         <button
                            onClick={() => triggerFileUpload('character', char.id)}
                            disabled={generatingId === char.id || uploadingId === char.id}
                            className="px-4 py-2 bg-blue-900/50 text-blue-300 hover:bg-blue-800/50 rounded text-xs font-bold transition-all border border-blue-700/50 flex items-center justify-center gap-2"
                         >
                           {uploadingId === char.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                           上传图片
                         </button>
                         <button
                            onClick={() => handleOpenLibrary('character', char.id)}
                            className="px-4 py-2 bg-indigo-900/50 text-indigo-300 hover:bg-indigo-800/50 rounded text-xs font-bold transition-all border border-indigo-700/50 flex items-center justify-center gap-2"
                         >
                           <FolderOpen className="w-3 h-3" />
                           从资源库选择
                         </button>
                       </div>
                     </div>
                  )}
                  {/* Manage Button */}
                  <button 
                     onClick={() => setSelectedCharId(char.id)}
                     className="absolute bottom-2 right-2 p-2 bg-black/50 text-white rounded-full hover:bg-white hover:text-black transition-colors border border-white/10 backdrop-blur"
                     title="Manage Wardrobe"
                  >
                      <Shirt className="w-3 h-3" />
                  </button>
                </div>
                <div className="p-3 border-t border-zinc-800 bg-[#111] flex-1 flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-zinc-200 truncate text-sm">{char.name}</h3>
                    <div className="flex items-center gap-1">
                      {char.threeViewImage && (
                        <button
                          onClick={() => setPreviewImage(char.threeViewImage!)}
                          className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 rounded transition-all border border-emerald-500/20"
                          title="查看三视图"
                        >
                          <Eye className="w-3 h-3" />
                        </button>
                      )}
                      {char.referenceImage && (
                        <button
                          onClick={() => handleGenerateThreeView(char.id)}
                          disabled={generatingId === `threeview-${char.id}`}
                          className={`px-2 py-1 rounded transition-all disabled:opacity-50 flex items-center gap-1 text-[10px] font-bold ${
                            generatingId === `threeview-${char.id}` 
                              ? 'bg-indigo-500/20 text-indigo-400' 
                              : 'bg-zinc-800 hover:bg-indigo-600 text-zinc-400 hover:text-white'
                          }`}
                          title="生成三视图"
                        >
                          {generatingId === `threeview-${char.id}` ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Aperture className="w-3 h-3" />
                          )}
                          三视图
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* Prompt 编辑区域 */}
                  {isEditingPrompt ? (
                    <div className="space-y-2 mb-2">
                      <textarea
                        value={editingPromptValue}
                        onChange={(e) => setEditingPromptValue(e.target.value)}
                        className="w-full bg-[#0A0A0A] border border-zinc-700 rounded px-2 py-1 text-[14px] text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500 resize-none h-20"
                        placeholder="输入生成提示词..."
                      />
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleSavePrompt('character', char.id)}
                          className="flex-1 px-2 py-1 bg-indigo-500 hover:bg-indigo-600 text-white text-[12px] font-bold uppercase rounded transition-colors"
                        >
                          保存
                        </button>
                        <button
                          onClick={handleCancelEditPrompt}
                          className="flex-1 px-2 py-1 bg-zinc-700 hover:bg-zinc-600 text-white text-[12px] font-bold uppercase rounded transition-colors"
                        >
                          取消
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mb-2">
                      <p className="text-[14px] text-zinc-400 line-clamp-2 mb-1 font-mono leading-relaxed">{currentPrompt}</p>
                      <button
                        onClick={() => handleStartEditPrompt('character', char.id)}
                        className="text-[11px] text-indigo-400 hover:text-indigo-300 font-bold uppercase tracking-wider"
                      >
                        编辑提示词
                      </button>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                     <span className="text-[10px] text-zinc-500 font-mono uppercase bg-zinc-900 px-1.5 py-0.5 rounded">{char.gender}</span>
                     {char.variations && char.variations.length > 0 && (
                         <span className="text-[9px] text-zinc-400 font-mono flex items-center gap-1">
                             <Shirt className="w-2.5 h-2.5" /> +{char.variations.length}
                         </span>
                     )}
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        </section>

        {/* Scenes Section */}
        <section>
          <div className="flex items-end justify-between mb-6 border-b border-zinc-800 pb-4">
            <div>
               <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                 <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                 场景概念 (Locations)
               </h3>
               <p className="text-xs text-zinc-500 mt-1 pl-3.5">为剧本场景生成环境参考图</p>
            </div>
            <button 
              onClick={() => handleBatchGenerate('scene')}
              disabled={!!batchProgress}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-all flex items-center gap-2 ${
                  allScenesReady
                    ? 'bg-[#141414] text-zinc-400 border border-zinc-700 hover:text-white hover:border-zinc-500'
                    : 'bg-white text-black hover:bg-zinc-200 shadow-lg shadow-white/5'
              }`}
            >
              {allScenesReady ? <RefreshCw className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
              {allScenesReady ? '重新生成所有场景' : '一键生成所有场景'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {project.scriptData.scenes.map((scene) => {
              const isEditingPrompt = editingPromptId === scene.id;
              const currentPrompt = scene.visualPrompt || generateVisualPrompts('scene', scene, project.scriptData?.genre || 'Cinematic');
              
              return (
              <div key={scene.id} className="bg-[#141414] border border-zinc-800 rounded-xl overflow-hidden flex flex-col group hover:border-zinc-600 transition-all hover:shadow-lg">
                <div className="aspect-video bg-zinc-900 relative">
                  {scene.referenceImage ? (
                    <>
                      <img src={scene.referenceImage} alt={scene.location} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 backdrop-blur-sm p-2">
                         <div className="flex gap-2">
                           <button 
                             onClick={() => setPreviewImage(scene.referenceImage!)}
                             className="p-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-all border border-white/20"
                             title="查看大图"
                           >
                             <Eye className="w-4 h-4" />
                           </button>
                           <button 
                             onClick={() => handleGenerateAsset('scene', scene.id)}
                             disabled={generatingId === scene.id || uploadingId === scene.id}
                             className="p-2 bg-black/50 text-white rounded-full border border-white/20 hover:bg-white hover:text-black transition-colors backdrop-blur disabled:opacity-50"
                             title="重新生成"
                           >
                             {generatingId === scene.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                           </button>
                         </div>
                         <div className="flex gap-2 mt-1">
                           <button 
                             onClick={() => triggerFileUpload('scene', scene.id)}
                             disabled={generatingId === scene.id || uploadingId === scene.id}
                             className="px-3 py-1 bg-blue-500/80 text-white text-[9px] font-bold uppercase tracking-wider rounded border border-white/20 hover:bg-blue-600 transition-colors backdrop-blur disabled:opacity-50 flex items-center gap-1"
                           >
                             <Upload className="w-3 h-3" />
                             上传
                           </button>
                           <button 
                             onClick={() => handleOpenLibrary('scene', scene.id)}
                             className="px-3 py-1 bg-emerald-500/80 text-white text-[9px] font-bold uppercase tracking-wider rounded border border-white/20 hover:bg-emerald-600 transition-colors backdrop-blur flex items-center gap-1"
                           >
                             <FolderOpen className="w-3 h-3" />
                             资源库
                           </button>
                           <button 
                             onClick={() => handleDeleteImage('scene', scene.id)}
                             disabled={generatingId === scene.id || uploadingId === scene.id}
                             className="px-3 py-1 bg-red-500/80 text-white text-[9px] font-bold uppercase tracking-wider rounded border border-white/20 hover:bg-red-600 transition-colors backdrop-blur disabled:opacity-50 flex items-center gap-1"
                           >
                             <X className="w-3 h-3" />
                             删除
                           </button>
                         </div>
                      </div>
                      <div className="absolute top-2 right-2 p-1 bg-indigo-500 text-white rounded shadow-lg backdrop-blur">
                        <Check className="w-3 h-3" />
                      </div>
                    </>
                  ) : (
                     <div className="w-full h-full flex flex-col items-center justify-center text-zinc-700 p-4 text-center">
                       <MapPin className="w-10 h-10 mb-3 opacity-10" />
                       <div className="flex flex-col gap-2 w-full">
                         <button
                            onClick={() => handleGenerateAsset('scene', scene.id)}
                            disabled={generatingId === scene.id || uploadingId === scene.id}
                            className="px-4 py-2 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 rounded text-xs font-bold transition-all border border-zinc-700 flex items-center justify-center gap-2"
                         >
                            {generatingId === scene.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                            生成
                         </button>
                         <button
                            onClick={() => triggerFileUpload('scene', scene.id)}
                            disabled={generatingId === scene.id || uploadingId === scene.id}
                            className="px-4 py-2 bg-blue-900/50 text-blue-300 hover:bg-blue-800/50 rounded text-xs font-bold transition-all border border-blue-700/50 flex items-center justify-center gap-2"
                         >
                           {uploadingId === scene.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                           上传图片
                         </button>
                         <button
                            onClick={() => handleOpenLibrary('scene', scene.id)}
                            className="px-4 py-2 bg-emerald-900/50 text-emerald-300 hover:bg-emerald-800/50 rounded text-xs font-bold transition-all border border-emerald-700/50 flex items-center justify-center gap-2"
                         >
                           <FolderOpen className="w-3 h-3" />
                           从资源库选择
                         </button>
                       </div>
                     </div>
                  )}
                </div>
                <div className="p-3 border-t border-zinc-800 bg-[#111]">
                  <div className="flex justify-between items-center mb-2">
                     <h3 className="font-bold text-zinc-200 text-sm truncate">{scene.location}</h3>
                     <span className="px-1.5 py-0.5 bg-zinc-900 text-zinc-500 text-[9px] rounded border border-zinc-800 uppercase font-mono">{scene.time}</span>
                  </div>
                  
                  {/* Prompt 编辑区域 */}
                  {isEditingPrompt ? (
                    <div className="space-y-2 mb-2">
                      <textarea
                        value={editingPromptValue}
                        onChange={(e) => setEditingPromptValue(e.target.value)}
                        className="w-full bg-[#0A0A0A] border border-zinc-700 rounded px-2 py-1 text-[14px] text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 resize-none h-20"
                        placeholder="输入生成提示词..."
                      />
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleSavePrompt('scene', scene.id)}
                          className="flex-1 px-2 py-1 bg-emerald-500 hover:bg-emerald-600 text-white text-[12px] font-bold uppercase rounded transition-colors"
                        >
                          保存
                        </button>
                        <button
                          onClick={handleCancelEditPrompt}
                          className="flex-1 px-2 py-1 bg-zinc-700 hover:bg-zinc-600 text-white text-[12px] font-bold uppercase rounded transition-colors"
                        >
                          取消
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mb-2">
                      <p className="text-[14px] text-zinc-400 line-clamp-2 mb-1 font-mono leading-relaxed">{currentPrompt}</p>
                      <button
                        onClick={() => handleStartEditPrompt('scene', scene.id)}
                        className="text-[11px] text-emerald-400 hover:text-emerald-300 font-bold uppercase tracking-wider"
                      >
                        编辑提示词
                      </button>
                    </div>
                  )}
                  
                  <p className="text-[10px] text-zinc-500 line-clamp-1">{scene.atmosphere}</p>
                </div>
              </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* 图片预览 */}
      {previewImage && (
        <ImagePreview src={previewImage} onClose={() => setPreviewImage(null)} />
      )}
    </div>
  );
};

// 预览大图组件
const ImagePreview: React.FC<{ src: string, onClose: () => void }> = ({ src, onClose }) => {
  return (
    <div 
      className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300"
      onClick={onClose}
    >
      <button className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all">
        <X className="w-6 h-6" />
      </button>
      <div className="relative max-w-7xl max-h-[90vh] flex items-center justify-center" onClick={e => e.stopPropagation()}>
        <img 
          src={src} 
          className="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-300 border border-white/10" 
        />
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/60 backdrop-blur-md rounded-full border border-white/10 text-[10px] text-white/50 uppercase tracking-widest font-mono">
          Press anywhere to close
        </div>
      </div>
    </div>
  );
};

export default StageAssets;