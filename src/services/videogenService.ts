// MCP-X Video Studio 服务 - 使用项目现有的 API 接口
import { generateImageFromText, editImage, ReferenceMaterial } from './imageApi';
import { chatApi, streamChatSend, SendDTO } from './chatApi';
import config from '../config';
import type { ScriptData, Shot, Character, Scene, VideoGenProject } from '../types/videogen';
import axios from 'axios';

// IndexedDB 存储服务
const DB_NAME = 'McpxVideoStudioDB';
const DB_VERSION = 2; // 升级版本以添加新的 store
const STORE_NAME = 'projects';
const ASSET_LIBRARY_STORE = 'assetLibrary'; // 备选资源库

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('IndexedDB 打开失败:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      const db = request.result;

      // 验证所需的 object stores 是否存在
      if (!db.objectStoreNames.contains(STORE_NAME) || !db.objectStoreNames.contains(ASSET_LIBRARY_STORE)) {
        console.warn('数据库结构不完整，尝试重新创建...');
        db.close();

        // 删除旧数据库并重新创建
        const deleteRequest = indexedDB.deleteDatabase(DB_NAME);
        deleteRequest.onsuccess = () => {
          console.log('旧数据库已删除，重新打开...');
          // 递归调用重新打开
          openDB().then(resolve).catch(reject);
        };
        deleteRequest.onerror = () => {
          reject(new Error('无法删除旧数据库'));
        };
        return;
      }

      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      console.log(`数据库升级: 从版本 ${event.oldVersion} 到 ${event.newVersion}`);

      // 创建项目存储
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        console.log('创建 projects store');
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }

      // 创建资源库存储
      if (!db.objectStoreNames.contains(ASSET_LIBRARY_STORE)) {
        console.log('创建 assetLibrary store');
        const assetStore = db.createObjectStore(ASSET_LIBRARY_STORE, { keyPath: 'id', autoIncrement: true });
        assetStore.createIndex('type', 'type', { unique: false }); // 'character' 或 'scene'
        assetStore.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };

    request.onblocked = () => {
      console.warn('数据库升级被阻止，请关闭其他打开的标签页');
      reject(new Error('数据库升级被阻止，请关闭其他打开的标签页'));
    };
  });
};

export const saveProjectToDB = async (project: VideoGenProject, skipServerSync: boolean = false): Promise<void> => {
  const db = await openDB();
  const p = { ...project, lastModified: Date.now() };

  // 保存到 IndexedDB
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(p);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });

  // 同时保存到后端 session content（如果有 sessionId 且不是临时的）
  if (!skipServerSync && project.sessionId && 
      !project.sessionId.startsWith('temp_session_') && 
      project.sessionId !== 'undefined' && 
      project.sessionId !== 'null') {
    try {
      const projectJson = JSON.stringify(p);
      await chatApi.updateSessionContent(project.sessionId, projectJson, project.title);
      console.log('✅ 项目已同步到后端 session:', project.sessionId);
    } catch (error) {
      console.warn('⚠️ 同步到后端失败，仅保存到本地:', error);
      // 不抛出错误，本地保存成功即可
    }
  }
};

export const loadProjectFromDB = async (id: string): Promise<VideoGenProject> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(id);
    request.onsuccess = () => {
      if (request.result) resolve(request.result);
      else reject(new Error("Project not found"));
    };
    request.onerror = () => reject(request.error);
  });
};

export const getAllProjectsMetadata = async (): Promise<VideoGenProject[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => {
      const projects = request.result as VideoGenProject[];
      projects.sort((a, b) => b.lastModified - a.lastModified);
      resolve(projects);
    };
    request.onerror = () => reject(request.error);
  });
};

export const deleteProjectFromDB = async (id: string, sessionId?: string): Promise<void> => {
  const db = await openDB();

  // 从 IndexedDB 删除
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });

  // 同时删除后端 session（如果有 sessionId 且不是临时的）
  if (sessionId && !sessionId.startsWith('temp_session_') && sessionId !== 'undefined' && sessionId !== 'null') {
    try {
      await chatApi.deleteSession(sessionId);
      console.log('✅ 后端 session 已删除:', sessionId);
    } catch (error) {
      console.warn('⚠️ 删除后端 session 失败:', error);
      // 不抛出错误，本地删除成功即可
    }
  }
};

// ==================== 资源库管理 ====================

export interface AssetLibraryItem {
  id?: number; // 自动生成
  type: 'character' | 'scene' | 'video';
  name: string;
  imageUrl: string; // 主图片URL（对于video类型，这是缩略图）
  videoUrl?: string; // 视频URL（仅用于video类型）
  startFrameUrl?: string; // 视频起始帧URL（仅用于video类型）
  endFrameUrl?: string; // 视频结束帧URL（仅用于video类型）
  visualPrompt?: string;
  metadata?: {
    gender?: string;
    age?: string;
    personality?: string;
    location?: string;
    time?: string;
    atmosphere?: string;
    duration?: number; // 视频时长
    shotNumber?: number; // 镜头编号
  };
  createdAt: number;
}

// 添加资源到库
export const addAssetToLibrary = async (asset: Omit<AssetLibraryItem, 'id' | 'createdAt'>): Promise<number> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(ASSET_LIBRARY_STORE, 'readwrite');
    const store = tx.objectStore(ASSET_LIBRARY_STORE);
    const item: Omit<AssetLibraryItem, 'id'> = {
      ...asset,
      createdAt: Date.now()
    };
    const request = store.add(item);
    request.onsuccess = () => resolve(request.result as number);
    request.onerror = () => reject(request.error);
  });
};

// 从库中获取所有资源
export const getAssetsFromLibrary = async (type?: 'character' | 'scene' | 'video'): Promise<AssetLibraryItem[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(ASSET_LIBRARY_STORE, 'readonly');
    const store = tx.objectStore(ASSET_LIBRARY_STORE);

    let request: IDBRequest;
    if (type) {
      const index = store.index('type');
      request = index.getAll(type);
    } else {
      request = store.getAll();
    }

    request.onsuccess = () => {
      const assets = request.result as AssetLibraryItem[];
      // 按创建时间倒序排列
      assets.sort((a, b) => b.createdAt - a.createdAt);
      resolve(assets);
    };
    request.onerror = () => reject(request.error);
  });
};

// 从库中删除资源
export const deleteAssetFromLibrary = async (id: number): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(ASSET_LIBRARY_STORE, 'readwrite');
    const store = tx.objectStore(ASSET_LIBRARY_STORE);
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

// 重置数据库（用于调试和修复）
export const resetDatabase = async (): Promise<void> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DB_NAME);
    request.onsuccess = () => {
      console.log('数据库已重置');
      resolve();
    };
    request.onerror = () => {
      console.error('重置数据库失败:', request.error);
      reject(request.error);
    };
    request.onblocked = () => {
      console.warn('数据库重置被阻止，请关闭其他打开的标签页');
      reject(new Error('数据库重置被阻止'));
    };
  });
};

// 创建新项目模板
export const createNewProjectState = async (videoType?: 'script' | 'promotional' | 'shortvideo'): Promise<VideoGenProject> => {
  const id = 'proj_' + Date.now().toString(36);
  const userId = localStorage.getItem('userId');

  // 根据视频类型选择不同的示例剧本
  let defaultScript = '';
  const projectType = videoType || 'script';

  if (projectType === 'promotional') {
    // 宣传片制作示例
    defaultScript = `标题：高端护肤品宣传片

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
  } else if (projectType === 'shortvideo') {
    // 短视频制作示例
    defaultScript = `标题：美食探店短视频

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
    // 默认剧本创作示例
    defaultScript = `标题：雨夜侦探

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

  // 通过后端接口创建 session
  let sessionId: string | undefined;
  
  const tempProject: VideoGenProject = {
    id,
    title: '未命名项目',
    createdAt: Date.now(),
    lastModified: Date.now(),
    stage: 'script',
    targetDuration: '60s',
    language: '中文',
    videoType: projectType,
    textModel: 'deepseek-chat',
    imageModel: 'z-image-turbo',
    rawScript: defaultScript,
    scriptData: null,
    shots: [],
    isParsingScript: false,
  };

  if (userId) {
    try {
      const sessionResponse = await chatApi.createSession({
        userId: userId,
        sessionContent: JSON.stringify(tempProject), // 保存初始项目数据，防止同步延迟
        sessionTitle: '未命名项目',
        remark: 'MCP-X Video Studio Project',
        appId: 'mcpx-video-studio'
      });

      if (sessionResponse.code === 200 && sessionResponse.data) {
        // 后端可能直接返回字符串 ID，也可能返回包含 ID 的对象
        const idValue = typeof sessionResponse.data === 'string' 
          ? sessionResponse.data 
          : (sessionResponse.data.id || sessionResponse.data.sessionId);
          
        if (idValue) {
          sessionId = String(idValue);
          tempProject.sessionId = sessionId;
          console.log('✅ 创建项目 session 成功:', sessionId);
        } else {
          console.warn('⚠️ sessionResponse.data 中没有识别到 id 或 sessionId', sessionResponse.data);
          throw new Error('接口未返回有效的 sessionId');
        }
      } else {
        throw new Error(sessionResponse.msg || '创建 session 失败');
      }
    } catch (error) {
      console.error('❌ 创建 session 失败:', error);
      throw error; // 向外抛出错误，防止创建只有临时 ID 的项目
    }
  } else {
    throw new Error('用户未登录，无法创建项目');
  }

  // 立即保存到本地数据库，确保返回列表时 ID 和数据一致
  try {
    await saveProjectToDB(tempProject, true); // skipServerSync 因为上面已经创建了
  } catch (error) {
    console.warn('⚠️ 初始保存本地失败:', error);
  }

  return tempProject;
};

// 清理 JSON 字符串
const cleanJsonString = (str: string): string => {
  if (!str) return "{}";
  let cleaned = str.replace(/```json\n?/g, '').replace(/```/g, '');
  return cleaned.trim();
};

/**
 * 使用 AI 解析剧本数据
 */
export const parseScriptToData = async (
  rawText: string,
  language: string = '中文',
  textModel?: string,
  onProgress?: (text: string) => void
): Promise<ScriptData> => {
  const userId = localStorage.getItem('userId');
  if (!userId) throw new Error('用户未登录');

  const prompt = `你是一个专业的剧本分析师。请分析以下剧本文本，并以JSON格式输出结构化数据。

要求：
1. 提取标题、类型、故事梗概（使用${language}）
2. 提取角色信息（id, name, gender, age, personality）。
   【重要】personality字段要求：
   - 请在此字段填写角色的【视觉形象定妆照描述】（形象Prompt）。
   - 只描述角色的外貌、五官特征、发型、身材、服装款式与材质、配饰等视觉细节。
   - 严禁描述人物性格（如“开朗”、“阴险”）。
   - 严禁描述故事细节、背景或任何情节。
   - 严禁涉及到其他人物。
3. 提取场景信息（id, location, time, atmosphere）。
   【重要】atmosphere字段要求：
   - 请在此字段填写场景的【视觉布局与陈设描述】。
   - 只描述场景的物理样子、建筑风格、房间布局、家具摆放、具体的物品及其材质等视觉细节。
   - 严禁描述情感词、氛围词（如“压抑”、“温馨”、“神秘”）。
   - 严禁描述故事情节或人物活动。
4. 将故事分解为段落，并关联到对应场景

剧本内容：
"${rawText.slice(0, 15000)}"

请严格按照以下JSON格式输出：
{
  "title": "剧本标题",
  "genre": "类型",
  "logline": "故事梗概",
  "characters": [
    {"id": "char1", "name": "角色名", "gender": "性别", "age": "年龄", "personality": "视觉形象定妆照描述"}
  ],
  "scenes": [
    {"id": "scene1", "location": "地点", "time": "时间", "atmosphere": "视觉布局与陈设描述"}
  ],
  "storyParagraphs": [
    {"id": 1, "text": "段落内容", "sceneRefId": "scene1"}
  ]
}`;

  return new Promise((resolve, reject) => {
    let fullResponse = '';

    const sendData: SendDTO = {
      messages: [{ role: 'user', content: prompt }],
      model: textModel || 'deepseek-chat',
      stream: true,
      userId: parseInt(userId),
      appId: 'mcpx-video-studio'
    };

    streamChatSend(
      sendData,
      (chunk) => {
        if (chunk.choices?.[0]?.delta?.content) {
          const content = chunk.choices[0].delta.content;
          fullResponse += content;
          if (onProgress) {
            onProgress(fullResponse);
          }
        }
      },
      (error) => {
        reject(new Error(`剧本解析失败: ${error.message}`));
      },
      () => {
        try {
          // 尝试从响应中提取 JSON
          const jsonMatch = fullResponse.match(/\{[\s\S]*\}/);
          if (!jsonMatch) {
            throw new Error('无法从响应中提取JSON');
          }
          const text = cleanJsonString(jsonMatch[0]);
          const parsed = JSON.parse(text);

          // Validate parsed data structure
          if (!parsed || typeof parsed !== 'object') {
            throw new Error('解析结果不是有效的JSON对象');
          }
          if (!parsed.scenes || !Array.isArray(parsed.scenes) || parsed.scenes.length === 0) {
            throw new Error('未能从剧本中提取出有效场景，请检查剧本格式或重试');
          }

          const characters = Array.isArray(parsed.characters)
            ? parsed.characters.map((c: any) => ({
              ...c,
              id: String(c.id),
              variations: []
            }))
            : [];
          const scenes = Array.isArray(parsed.scenes)
            ? parsed.scenes.map((s: any) => ({ ...s, id: String(s.id) }))
            : [];
          const storyParagraphs = Array.isArray(parsed.storyParagraphs)
            ? parsed.storyParagraphs.map((p: any) => ({ ...p, sceneRefId: String(p.sceneRefId) }))
            : [];

          resolve({
            title: parsed.title || "未命名剧本",
            genre: parsed.genre || "通用",
            logline: parsed.logline || "",
            language: language,
            characters,
            scenes,
            storyParagraphs
          });
        } catch (e: any) {
          console.error("解析剧本数据失败:", e, fullResponse);
          reject(new Error(`解析剧本数据失败: ${e.message}`));
        }
      }
    );
  });
};

/**
 * 尝试从不完整的 JSON 字符串中提取已完成的分镜对象和最后一个不完整的分镜
 */
const parsePartialShotList = (jsonText: string): any[] => {
  const shots: any[] = [];
  let text = jsonText.trim();
  
  // 找到数组的开始 [
  const arrayStart = text.indexOf('[');
  if (arrayStart === -1) return [];
  text = text.substring(arrayStart + 1);
  
  let bracketCount = 0;
  let startPos = -1;

  for (let i = 0; i < text.length; i++) {
    if (text[i] === '{') {
      if (bracketCount === 0) startPos = i;
      bracketCount++;
    } else if (text[i] === '}') {
      bracketCount--;
      if (bracketCount === 0 && startPos !== -1) {
        try {
          const objText = text.substring(startPos, i + 1);
          const cleanedObjText = cleanJsonString(objText);
          const obj = JSON.parse(cleanedObjText);
          shots.push(obj);
        } catch (e) {
          // 忽略解析失败的块
        }
        startPos = -1;
      }
    }
  }

  // 尝试解析最后一个不完整的块
  if (startPos !== -1) {
    const partialText = text.substring(startPos);
    const partialShot: any = { isPartial: true };
    
    // 更加宽松的正则提取，用于实时显示正在生成的文字
    const extractField = (field: string) => {
      // 匹配 "field": "内容... (直到下一个引号，或者如果没引号就匹配到结尾)
      // 注意：这里允许不以引号结尾，以便实时捕获流式输出
      const regex = new RegExp(`"${field}"\\s*:\\s*"([^"]*)`);
      const match = partialText.match(regex);
      if (match) {
        return match[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
      }
      return '';
    };

    partialShot.actionSummary = extractField('actionSummary');
    partialShot.dialogue = extractField('dialogue');
    partialShot.visualPrompt = extractField('visualPrompt');
    partialShot.shotSize = extractField('shotSize');
    partialShot.cameraMovement = extractField('cameraMovement');
    
    // 如果该分镜已经有了任何实质性内容，或者它就是当前正在生成的唯一分镜，则显示它
    if (partialShot.actionSummary || partialShot.dialogue || partialShot.visualPrompt || partialShot.shotSize || partialShot.cameraMovement) {
      shots.push(partialShot);
    }
  }

  return shots;
};

/**
 * 生成分镜列表
 */
export const generateShotList = async (
  scriptData: ScriptData, 
  textModel?: string, 
  videoType?: 'script' | 'promotional' | 'shortvideo',
  onShotsUpdate?: (shots: Shot[]) => void
): Promise<Shot[]> => {
  if (!scriptData.scenes || scriptData.scenes.length === 0) {
    return [];
  }

  const userId = localStorage.getItem('userId');
  if (!userId) throw new Error('用户未登录');

  const lang = scriptData.language || '中文';
  let allShots: Shot[] = [];

  // 辅助函数：将“已完成镜头”和“当前场景的部分镜头”合并并通知 UI
  const notifyUI = (currentScenePartialShots: any[], sceneId: string) => {
    if (!onShotsUpdate) return;

    // 1. 格式化并标记当前场景的镜头
    const formattedCurrent = currentScenePartialShots.map((s, idx) => {
      const shotId = `shot-temp-${allShots.length + idx + 1}`;
      return {
        ...s,
        id: shotId,
        sceneId: sceneId,
        keyframes: Array.isArray(s.keyframes)
          ? s.keyframes.map((k: any, kIdx: number) => ({
              ...k,
              id: `kf-temp-${allShots.length + idx + 1}-${k.type || kIdx}`,
              status: 'pending' as const
            }))
          : (s.visualPrompt || s.actionSummary ? [{
              id: `kf-temp-${allShots.length + idx + 1}-start`,
              type: 'start' as const,
              visualPrompt: s.visualPrompt || s.actionSummary,
              status: 'pending' as const
            }] : [])
      } as Shot;
    });

    // 2. 格式化所有已完成的镜头
    const formattedFinished = allShots.map((s, idx) => ({
      ...s,
      id: `shot-${idx + 1}`,
      keyframes: Array.isArray(s.keyframes)
        ? s.keyframes.map(k => ({
          ...k,
          id: `kf-${idx + 1}-${k.type}`,
          status: 'pending' as const
        }))
        : (s.visualPrompt ? [{
            id: `kf-${idx + 1}-start`,
            type: 'start' as const,
            visualPrompt: s.visualPrompt,
            status: 'pending' as const
          }] : [])
    }));

    onShotsUpdate([...formattedFinished, ...formattedCurrent]);
  };

  // 逐场景处理
  for (let i = 0; i < scriptData.scenes.length; i++) {
    const scene = scriptData.scenes[i];
    const paragraphs = scriptData.storyParagraphs
      .filter(p => String(p.sceneRefId) === String(scene.id))
      .map(p => p.text)
      .join('\n');

    if (!paragraphs.trim()) continue;

    // 添加延迟避免请求过快
    if (i > 0) await new Promise(r => setTimeout(r, 1500));

    // 根据视频类型生成不同的 prompt
    let prompt: string;
    const videoTypeConfig = videoType || 'script';

    if (videoTypeConfig === 'promotional') {
      // 宣传片制作 prompt
      prompt = `你是一位经验丰富的商业宣传片导演和视觉创意专家。请为以下内容生成专业的宣传片分镜列表。

输出语言: ${lang}

内容信息:
- 主题: ${scene.location}
- 风格: ${scene.time}
- 视觉布局: ${scene.atmosphere}
- 类型: ${scriptData.genre}
- 目标时长: ${scriptData.targetDuration || '标准'}

宣传内容:
"${paragraphs.slice(0, 3000)}"

角色列表:
${JSON.stringify(scriptData.characters.map(c => ({ id: c.id, name: c.name, personality: c.personality })))}

专业要求:

1. **宣传片镜头设计原则**
   - 每个场景设计 3-6 个镜头
   - **重要：每个场景的第一个镜头 (shot-1)**：必须作为该场景的“定调镜头”。其起始帧的视觉描述 (visualPrompt) 应优先选择全景 (WS) 或中景 (MS)，并且必须详细描述出该场景下出现的所有主要角色。
   - 注重视觉冲击力和商业表现力
   - 使用现代商业摄影技巧和构图法则
   - 强调品牌调性和产品价值传递

2. **动态镜头运动**
   使用专业商业拍摄术语：
   - Static（静止构图）
   - Pan Left/Right（横移扫描）
   - Tilt Up/Down（垂直扫描）
   - Dolly In/Out（动态推进/拉远）
   - Tracking（跟随拍摄）
   - Crane Up/Down（升降俯仰）
   - Dutch Angle（倾斜构图）
   - Zoom In/Out（数字变焦）
   - Orbit（环绕展示）

3. **商业景别**
   精确指定商业景别：
   - ECU（极致特写/产品特写）
   - CU（特写/细节展示）
   - MCU（中特写/人物特写）
   - MS（中景/产品展示）
   - MWS（中全景/环境展示）
   - WS（全景/场景展示）
   - EWS（极远景/宏大叙事）
   - OTS（过肩/互动展示）
   - POV（体验视角）

4. **商业镜头描述**
   - 使用 ${lang} 详细描述商业镜头内容
   - 突出产品优势、品牌价值、服务体验
   - 强调情感共鸣和消费欲望
   - 60-120 字

5. **视觉描述 (visualPrompt)**
   - 使用 ${lang}，不超过 100 字
   - **核心要求**：只描述镜头语言（Camera Language）。
   - **包含内容**：
     - **人物方位**：明确描述人物在画面中的具体位置（如：左侧三分之一处、中心偏右、画面下方等）。
     - **动作连贯性**：必须参考并描述人物在前一两个镜头中的动作延续（如：保持奔跑姿态、继续侧头微笑、维持手持杯子的动作等）。
     - **镜头指向**：切换景别时，需描述镜头相对于人物的方位（如：侧前方 45 度、俯视视角、平视背面等）。
     - **其他**：镜头构图、角色表情与眼神、镜头景别、光影对比、焦距变化。
   - **严禁描述**：严禁描述场景布置、物理建筑、家具陈设、角色固定外貌。
   - 严禁使用情感/氛围描述词（如“温馨”、“压抑”）。
   - 适合用于商业 AI 图像生成
   - 强调品牌定位和目标受众

6. **商业镜头衔接**
   - 注重节奏感和视觉流畅性
   - 使用专业转场技巧
   - 突出产品特性和服务价值
   - 关键帧体现商业叙事逻辑

7. **对白和旁白处理**
   - 商业对白注重说服力和品牌传播
   - 旁白简洁有力，突出核心价值

请严格按照以下 JSON 数组格式输出：

[
  {
    "id": "shot-1",
    "sceneId": "${scene.id}",
    "shotNumber": 1,
    "actionSummary": "商业镜头描述（使用${lang}），突出产品优势和品牌价值",
    "dialogue": "商业对白内容（如无则为空字符串）",
    "cameraMovement": "商业镜头运动术语",
    "shotSize": "商业景别代码",
    "duration": "预估时长（秒）",
    "characters": ["char1", "char2"],
    "lighting": "商业光线描述（如：专业灯光、产品光、氛围光）",
    "mood": "商业情绪氛围",
    "keyframes": [
      {
        "id": "kf-1-start",
        "type": "start",
        "timestamp": "00:00",
        "visualPrompt": "镜头起始帧的视觉描述（使用${lang}），包含人物方位、前序动作衔接及镜头语言",
        "composition": "商业构图说明"
      },
      {
        "id": "kf-1-end",
        "type": "end",
        "timestamp": "00:05",
        "visualPrompt": "镜头结束帧的视觉描述（使用${lang}），包含镜头运动后的方位变化及动作延续",
        "composition": "商业构图说明"
      }
    ],
    "transitionTo": "商业转场方式（如：Cut、Dissolve、Wipe）"
  }
]

注意事项:
- 确保输出为有效的 JSON 格式
- 所有描述性文字使用 ${lang}
- 镜头编号从 1 开始连续递增
- 每个镜头至少包含起始关键帧
- 突出商业价值和品牌传播
- 根据 ${scene.atmosphere} 调整商业氛围
`;
    } else if (videoTypeConfig === 'shortvideo') {
      // 短视频制作 prompt
      prompt = `你是一位经验丰富的社交媒体短视频导演和内容创意专家。请为以下内容生成吸引人的短视频分镜列表。

输出语言: ${lang}

内容信息:
- 主题: ${scene.location}
- 风格: ${scene.time}
- 视觉布局: ${scene.atmosphere}
- 类型: ${scriptData.genre}
- 目标时长: ${scriptData.targetDuration || '标准'}

短视频内容:
"${paragraphs.slice(0, 3000)}"

角色列表:
${JSON.stringify(scriptData.characters.map(c => ({ id: c.id, name: c.name, personality: c.personality })))}

专业要求:

1. **短视频镜头设计原则**
   - 每个场景设计 2-5 个镜头
   - **重要：每个场景的第一个镜头 (shot-1)**：其起始帧的视觉描述 (visualPrompt) 应优先选择全景 (WS) 或中景 (MS)，并且必须描述出该场景下出现的所有角色。
   - 注重快速节奏和吸引注意力
   - 使用抖音/快手等平台流行拍摄技巧
   - 强调情感共鸣和分享价值

2. **动感镜头运动**
   使用短视频流行术语：
   - Static（固定构图）
   - Quick Pan（快速横扫）
   - Whip Pan（甩镜头）
   - Dolly Zoom（推拉变焦）
   - Tracking（跟随）
   - Handheld（手机手持）
   - Rack Focus（焦点拉伸）
   - Dutch Angle（趣味倾斜）
   - Time Lapse（快进）
   - Stop Motion（定格）

3. **社交媒体景别**
   适合手机屏幕的景别：
   - ECU（表情特写）
   - CU（脸部特写）
   - MCU（上半身）
   - MS（全身展示）
   - WS（环境展示）
   - POV（第一视角）
   - OTS（互动视角）

4. **短视频镜头描述**
   - 使用 ${lang} 生动描述镜头内容
   - 突出趣味性和情感表达
   - 适合社交媒体传播
   - 40-100 字

5. **视觉描述 (visualPrompt)**
   - 使用 ${lang}，不超过 80 字
   - **核心要求**：只描述镜头语言。
   - **包含内容**：
     - **人物位置**：描述人物在手机画幅中的方位。
     - **动作继承**：描述人物动作与前序镜头的衔接关系。
     - **视角描述**：切换景别时描述镜头的拍摄方位。
     - **其他**：手机拍摄视角、滤镜风格、趣味构图、动态景深、角色瞬间神态、镜头距离感。
   - **严禁描述**：严禁描述重复的场景陈设或角色长相。
   - 严禁使用情感/氛围描述词。
   - 适合移动端 AI 图像生成
   - 强调分享欲和互动性

6. **短视频节奏衔接**
   - 快速剪辑和流畅转场
   - 突出高潮和情感节点
   - 适合短视频平台算法
   - 关键帧体现内容爆点

7. **对白和文案处理**
   - 简短有力的对白
   - 适合配字幕的旁白
   - 突出金句和价值点

请严格按照以下 JSON 数组格式输出：

[
  {
    "id": "shot-1",
    "sceneId": "${scene.id}",
    "shotNumber": 1,
    "actionSummary": "短视频镜头描述（使用${lang}），突出趣味和情感",
    "dialogue": "短视频对白（如无则为空字符串）",
    "cameraMovement": "短视频镜头运动",
    "shotSize": "社交媒体景别",
    "duration": "预估时长（秒）",
    "characters": ["char1", "char2"],
    "lighting": "手机拍摄光线",
    "mood": "短视频情绪",
    "keyframes": [
      {
        "id": "kf-1-start",
        "type": "start",
        "timestamp": "00:00",
        "visualPrompt": "短视频起始帧描述（使用${lang}），仅描述构图、神态等镜头语言",
        "composition": "手机构图说明"
      },
      {
        "id": "kf-1-end",
        "type": "end",
        "timestamp": "00:03",
        "visualPrompt": "短视频结束帧描述（使用${lang}），仅描述镜头变化后的画面状态",
        "composition": "手机构图说明"
      }
    ],
    "transitionTo": "短视频转场（如：Cut、Swipe、Zoom）"
  }
]

注意事项:
- 确保输出为有效的 JSON 格式
- 所有描述性文字使用 ${lang}
- 镜头编号从 1 开始连续递增
- 每个镜头至少包含起始关键帧
- 突出趣味性和传播价值
- 适合短视频平台特点
`;
    } else {
      // 默认剧本创作 prompt
      prompt = `你是一位经验丰富的电影摄影师和视觉叙事专家。请为以下场景生成专业的分镜列表。

输出语言: ${lang}

场景信息:
- 地点: ${scene.location}
- 时间: ${scene.time}
- 氛围: ${scene.atmosphere}
- 类型: ${scriptData.genre}
- 目标时长: ${scriptData.targetDuration || '标准'}

场景动作:
"${paragraphs.slice(0, 3000)}"

角色列表:
${JSON.stringify(scriptData.characters.map(c => ({ id: c.id, name: c.name, personality: c.personality })))}

专业要求:

1. **镜头设计原则**
   - 每个场景设计 2-8 个镜头
   - **重要：每个场景的第一个镜头 (shot-1)**：必须作为该场景的“定调镜头”。其起始帧的视觉描述 (visualPrompt) 应优先选择全景 (WS) 或中景 (MS)，并且必须详细描述出该场景下出现的所有角色，展示他们在环境中的初始位置关系。
   - 确保镜头之间的视觉连贯性和叙事流畅性
   - 遵循 180 度轴线法则和镜头匹配原则
   - 考虑景别变化的节奏感（避免跳切）

2. **cameraMovement（镜头运动）**
   使用专业术语，包括但不限于：
   - Static（静止）
   - Pan Left/Right（左/右摇）
   - Tilt Up/Down（上/下摇）
   - Dolly In/Out（推/拉）
   - Tracking/Follow（跟拍）
   - Crane Up/Down（升降）
   - Handheld（手持）
   - Steadicam（斯坦尼康）
   - Zoom In/Out（变焦）
   - Orbit（环绕）

3. **shotSize（景别）**
   精确指定景别：
   - ECU（大特写/Extreme Close-Up）
   - CU（特写/Close-Up）
   - MCU（中特写/Medium Close-Up）
   - MS（中景/Medium Shot）
   - MWS（中全景/Medium Wide Shot）
   - WS（全景/Wide Shot）
   - EWS（远景/Extreme Wide Shot）
   - OTS（过肩镜头/Over-The-Shoulder）
   - POV（主观镜头/Point of View）

4. **actionSummary（镜头描述）**
   - 使用 ${lang} 详细描述镜头内容
   - 包含人物动作、表情、位置关系
   - 说明镜头的叙事功能和情感表达
   - 50-150 字

5. **视觉描述 (visualPrompt)**
   - 使用 ${lang}，不超过 100 字
   - **核心要求**：只描述镜头语言（Camera Language）。
   - **包含内容**：
     - **人物方位**：明确描述人物在镜头中的具体位置。
     - **动作连贯性**：描述人物动作与前一两个镜头的延续性。
     - **镜头指向**：切换景别时，描述镜头相对于人物的朝向和位置。
     - **其他**：镜头构图（如：三分法、低角度）、角色表情与视线、镜头景别（如：MCU、WS）、光影布局、景深效果。
   - **严禁描述**：严禁描述场景物理细节、建筑风格、家具摆放或角色固有特征。
   - 严禁使用情感/氛围描述词（如“压抑”、“温馨”）。
   - 适合用于 AI 图像生成
   - 强调视觉风格和叙事感

6. **镜头衔接**
   - 考虑前后镜头的视觉连贯性
   - 注意人物位置、视线方向、动作连续性
   - 合理使用匹配剪辑（Match Cut）
   - 关键帧（keyframes）需体现镜头的起始和结束状态

7. **对白处理**
   - 如有对白，标注在对应镜头
   - 无对白则留空

请严格按照以下 JSON 数组格式输出：

[
  {
    "id": "shot-1",
    "sceneId": "${scene.id}",
    "shotNumber": 1,
    "actionSummary": "详细的镜头描述（使用${lang}），包含人物动作、表情、位置",
    "dialogue": "对白内容（如无则为空字符串）",
    "cameraMovement": "镜头运动术语",
    "shotSize": "景别代码",
    "duration": "预估时长（秒）",
    "characters": ["char1", "char2"],
    "lighting": "光线描述（如：自然光、侧光、逆光）",
    "mood": "情绪氛围",
    "keyframes": [
      {
        "id": "kf-1-start",
        "type": "start",
        "timestamp": "00:00",
        "visualPrompt": "起始帧的视觉描述（使用${lang}），仅描述该镜头的构图、景别、表情等镜头语言",
        "composition": "构图说明（如：三分法、对称、引导线）"
      },
      {
        "id": "kf-1-end",
        "type": "end",
        "timestamp": "00:05",
        "visualPrompt": "结束帧的视觉描述（使用${lang}），仅描述镜头运动后的画面状态和镜头语言",
        "composition": "构图说明"
      }
    ],
    "transitionTo": "下一个镜头的转场方式（如：Cut、Dissolve、Fade）"
  }
]

注意事项:
- 确保输出为有效的 JSON 格式
- 所有描述性文字使用 ${lang}
- 镜头编号从 1 开始连续递增
- 每个镜头至少包含起始关键帧，复杂镜头可包含结束关键帧
- 考虑 ${scriptData.genre} 类型的视觉风格特点
- 根据 ${scene.atmosphere} 调整光线和色调描述
`;
    }

    try {
      const shots = await new Promise<Shot[]>((resolve) => {
        let fullResponse = '';

        const sendData: SendDTO = {
          messages: [{ role: 'user', content: prompt }],
          model: textModel || 'deepseek-chat',
          stream: true,
          userId: parseInt(userId),
          appId: 'mcpx-video-studio'
        };

        streamChatSend(
          sendData,
          (chunk) => {
            if (chunk.choices?.[0]?.delta?.content) {
              fullResponse += chunk.choices[0].delta.content;
              
              // 实时解析已接收到的文本并通知 UI
              const partialShots = parsePartialShotList(fullResponse);
              if (partialShots.length > 0) {
                notifyUI(partialShots, scene.id);
              }
            }
          },
          (error) => {
            console.error(`场景 ${scene.id} 分镜生成失败:`, error);
            resolve([]);
          },
          () => {
            try {
              const jsonMatch = fullResponse.match(/\[[\s\S]*\]/);
              if (!jsonMatch) {
                resolve([]);
                return;
              }
              const text = cleanJsonString(jsonMatch[0]);
              const parsed = JSON.parse(text);
              const validShots = Array.isArray(parsed) ? parsed : [];
              resolve(validShots.map(s => ({
                ...s,
                sceneId: String(scene.id)
              })));
            } catch (e) {
              console.error(`场景 ${scene.id} 分镜解析失败:`, e);
              resolve([]);
            }
          }
        );
      });

      allShots.push(...shots);
      
      // 场景生成完毕，确保 UI 同步
      notifyUI([], scene.id);
    } catch (e) {
      console.error(`场景 ${scene.id} 处理失败:`, e);
    }
  }

  // 最终格式化并返回
  const finalFormatted = allShots.map((s, idx) => ({
    ...s,
    id: `shot-${idx + 1}`,
    keyframes: Array.isArray(s.keyframes)
      ? s.keyframes.map(k => ({
        ...k,
        id: `kf-${idx + 1}-${k.type}`,
        status: 'pending' as const
      }))
      : (s.visualPrompt ? [{
          id: `kf-${idx + 1}-start`,
          type: 'start' as const,
          visualPrompt: s.visualPrompt,
          status: 'pending' as const
        }] : [])
  }));

  if (onShotsUpdate) {
    onShotsUpdate(finalFormatted);
  }

  return finalFormatted;
};

/**
 * 图像风格定义
 */
export const IMAGE_STYLES = [
  { value: 'cinematic', label: '电影级', prompt: 'cinematic, dramatic lighting, film grain, professional color grading' },
  { value: 'realistic', label: '写实', prompt: 'photorealistic, highly detailed, natural lighting, 8k uhd' },
  { value: 'anime-2d', label: '二次元动漫', prompt: '2D anime style, high quality illustration, vibrant colors, clean lines, studio quality' },
  { value: 'pixar-3d', label: '皮克斯3D', prompt: 'Pixar style 3D animation, Disney style, cinematic lighting, cute character design, highly detailed textures, 8k render' },
  { value: 'oil-painting', label: '油画', prompt: 'oil painting style, artistic, textured brushstrokes, classical art' },
  { value: 'cyberpunk', label: '赛博朋克', prompt: 'cyberpunk style, neon lights, futuristic, high tech, dystopian' },
  { value: 'fantasy', label: '奇幻', prompt: 'fantasy art style, magical, ethereal, epic, detailed fantasy illustration' },
  { value: 'noir', label: '黑色电影', prompt: 'film noir style, high contrast, dramatic shadows, monochromatic, vintage' },
  { value: 'watercolor', label: '水彩', prompt: 'watercolor painting style, soft colors, artistic, flowing' },
];

/**
 * 生成视觉提示词 - 直接基于数据构建，不调用AI
 */
export const generateVisualPrompts = (
  type: 'character' | 'scene',
  data: Character | Scene,
  genre: string
): string => {
  if (type === 'character') {
    const char = data as Character;
    // 基于角色数据构建简单的视觉提示词 - 要求生成角色照片
    return `${genre} movie character look-book photo, ${char.name}, ${char.gender}, ${char.age} years old, ${char.personality}, cinematic lighting, high quality, 8k, detailed character styling`;
  } else {
    const scene = data as Scene;
    // 基于场景数据构建简单的视觉提示词 - 要求空场景，无人物
    return `${genre} movie empty scene, no people, no characters, ${scene.location}, ${scene.time}, ${scene.atmosphere}, cinematic composition, high quality, detailed environment`;
  }
};

/**
 * 生成图像 - 使用项目现有的文生图接口
 */
export const generateImage = async (
  prompt: string,
  referenceImages: string[] = [],
  imageModel?: string,
  sessionId?: string,
  size?: { width: number; height: number },
  imageStyle?: string
): Promise<string> => {
  // 处理风格提示词
  let finalPrompt = prompt;
  if (imageStyle) {
    const style = IMAGE_STYLES.find(s => s.value === imageStyle);
    if (style) {
      finalPrompt = `${prompt}, ${style.prompt}`;
    }
  }

  // 限制提示词长度
  const truncatedPrompt = finalPrompt.slice(0, 1500);
  const model = imageModel || 'z-image-turbo'; // 使用传入的模型或默认模型
  const appId = 'mcpx-video-studio'; // 固定的 appId
  const defaultSize = size || { width: 1280, height: 720 }; // 默认 1280x720

  // 创建超时Promise
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('图片生成超时（10分钟）')), 10 * 60 * 1000); // 10分钟超时
  });

  const generatePromise = async (): Promise<string> => {
    // 如果有参考图片，使用图生图接口
    if (referenceImages.length > 0 && referenceImages[0]) {
      const validRefImages = referenceImages.filter(img => img && (img.startsWith('data:image') || img.startsWith('http')));

      if (validRefImages.length > 0) {
        // 支持多张参考图片（场景 + 角色）
        const images = validRefImages.map(href => ({
          href,
          mimeType: 'image/png'
        }));

        console.log(`使用 ${images.length} 张参考图片生成图像, sessionId: ${sessionId}, appId: ${appId}, size: ${defaultSize.width}x${defaultSize.height}`);

        const result = await editImage(
          images,
          `Generate a cinematic shot matching this prompt: "${truncatedPrompt}". Maintain visual consistency with the reference images provided.`,
          undefined,
          model,
          sessionId,
          defaultSize
        );

        if (result.imageUrl) {
          return result.imageUrl;
        }
        if (result.newImageBase64) {
          return `data:${result.newImageMimeType};base64,${result.newImageBase64}`;
        }
        throw new Error(result.textResponse || '图片生成失败');
      }
    }

    // 无参考图片，使用文生图接口
    console.log(`无参考图片，使用文生图接口, sessionId: ${sessionId}, appId: ${appId}, size: ${defaultSize.width}x${defaultSize.height}`);
    const result = await generateImageFromText(truncatedPrompt, model, sessionId, defaultSize);

    if (result.imageUrl) {
      return result.imageUrl;
    }
    if (result.newImageBase64) {
      return `data:${result.newImageMimeType};base64,${result.newImageBase64}`;
    }
    throw new Error(result.textResponse || '图片生成失败');
  };

  // 使用 Promise.race 实现超时控制
  return Promise.race([generatePromise(), timeoutPromise]);
};

/**
 * 视频生成结果
 */
export interface VideoGenerationResult {
  videoUrl: string;
  lastFrameUrl?: string; // 视频最后一帧的图片URL
  seed?: number; // 生成视频时使用的seed值
}

/**
 * 生成视频 - 使用项目的视频生成接口
 * 支持：文生视频、图生视频、首尾帧生成视频
 */
export const generateVideo = async (
  prompt: string,
  startImageUrl?: string,
  endImageUrl?: string,
  videoModel?: string,
  resolution?: '480P' | '720P' | '1080P',
  ratio?: '16:9' | '9:16' | '1:1',
  duration?: number,
  sessionId?: string,
  onProgress?: (message: string, current?: number, total?: number) => void,
  audio?: boolean, // 是否生成同步音频
  audioData?: string, // 音频数据（base64 编码），用于阿里云模型
  audioUrl?: string, // 音频文件URL
  seed?: number, // 生成视频时使用的seed值
  referenceImages?: string[], // 额外的参考图（如角色图、场景图）
  referenceMaterials?: ReferenceMaterial[], // @功能引用的素材
): Promise<VideoGenerationResult> => {
  const userId = localStorage.getItem('userId');
  const token = localStorage.getItem('token');

  if (!userId) throw new Error('用户未登录');
  if (!token) throw new Error('未找到认证令牌');

  const appId = 'mcpx-video-studio'; // 固定的 appId

  // 构建视频生成请求
  const requestBody: any = {
    model: videoModel || 'kling-v1.6-standard', // 使用传入的模型或默认模型
    userId: userId,
    sessionId: sessionId || Date.now(), // 使用传入的 sessionId 或时间戳
    appId: appId, // 固定的 appId
    prompt: prompt,
    duration: duration || 5, // 使用传入的时长或默认5秒
    ratio: ratio || '16:9', // 默认16:9
    resolution: resolution || '720P', // 直接传递分辨率参数
  };

  // 如果指定生成音频，添加 audio 参数
  if (audio !== undefined) {
    requestBody.audio = audio;
  }

  // 如果提供了音频数据（用于阿里云模型），添加 audio_data 参数
  if (audioData) {
    requestBody.audio_data = audioData;
  }

  // 如果提供了音频URL，添加 audio_url 参数
  if (audioUrl) {
    requestBody.audioUrl = audioUrl;
  }

  // 如果提供了seed，添加 seed 参数
  if (seed !== undefined) {
    requestBody.seed = seed;
  }

  // 如果提供了额外的参考图，添加 refImages 参数
  if (referenceImages && referenceImages.length > 0) {
    requestBody.refImages = referenceImages;
    console.log(`添加了 ${referenceImages.length} 张参考图到视频生成请求`);
  }

  // 如果提供了@功能的引用素材，添加 referenceMaterials 参数
  if (referenceMaterials && referenceMaterials.length > 0) {
    requestBody.referenceMaterials = referenceMaterials;
    console.log(`添加了 ${referenceMaterials.length} 个引用素材到视频生成请求`);
  }

  console.log(`生成视频请求: sessionId=${sessionId}, appId=${appId}, model=${requestBody.model}, duration=${requestBody.duration}s, audio=${audio}, hasAudioData=${!!audioData}, hasAudioUrl=${!!audioUrl}, seed=${seed}`);

  // 根据参数自动识别生成类型
  if (startImageUrl && endImageUrl) {
    // 首尾帧生成视频 - 使用 firstFrameUrl 和 lastFrameUrl 参数
    requestBody.firstFrameUrl = startImageUrl;
    requestBody.lastFrameUrl = endImageUrl;
    console.log('首尾帧模式: firstFrameUrl 和 lastFrameUrl');
  } else if (startImageUrl) {
    // 图生视频 - 只有起始帧
    requestBody.imageUrl = startImageUrl;
    console.log('图生视频模式: imageUrl');
  }
  // 否则为文生视频（只有prompt）

  const url = `${config.apiBaseUrl}/ai/video/generate`;

  return new Promise((resolve, reject) => {
    let videoUrl = '';
    let lastFrameUrl = ''; // 存储最后一帧URL
    let extractedSeed: number | undefined; // 存储提取的seed
    let hasError = false;
    let lastActivityTime = Date.now(); // 记录最后一次活动时间

    // 设置60分钟超时（视频生成可能需要很长时间）
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
      clearInterval(activityCheckInterval);
      reject(new Error('视频生成超时（60分钟）'));
    }, 60 * 60 * 1000); // 60分钟

    // 活跃性检测：每30秒检查一次，如果5分钟没有任何数据，给出警告但不中断
    const activityCheckInterval = setInterval(() => {
      const timeSinceLastActivity = Date.now() - lastActivityTime;
      if (timeSinceLastActivity > 5 * 60 * 1000) { // 5分钟无活动
        console.warn('视频生成已超过5分钟无响应，但仍在等待...');
        if (onProgress) {
          onProgress('视频生成中，请耐心等待...（后台仍在处理）');
        }
        lastActivityTime = Date.now(); // 重置时间，避免重复警告
      }
    }, 30 * 1000); // 每30秒检查一次

    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Accept': 'text/event-stream',
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          throw new Error('无法获取响应流');
        }

        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            // 流结束，返回结果
            if (videoUrl) {
              console.log('流结束，视频生成完成，videoUrl:', videoUrl, 'lastFrameUrl:', lastFrameUrl, 'seed:', extractedSeed);
              clearTimeout(timeoutId);
              clearInterval(activityCheckInterval);
              resolve({ videoUrl, lastFrameUrl: lastFrameUrl || undefined, seed: extractedSeed });
            } else if (!hasError) {
              clearInterval(activityCheckInterval);
              reject(new Error('视频生成完成但未返回URL'));
            }
            break;
          }

          // 更新活跃时间
          lastActivityTime = Date.now();

          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.trim() === '') continue;

            if (line.startsWith('data:')) {
              try {
                // 整行可能包含多个 data: 前缀，需要处理整行内容
                const fullContent = line;
                console.log('处理data行内容:', JSON.stringify(fullContent));

                // 检查是否包含 <video> 标签
                const videoTagMatch = fullContent.match(/<video>(.*?)<\/video>/);
                if (videoTagMatch && videoTagMatch[1]) {
                  videoUrl = videoTagMatch[1].trim();
                  console.log('从<video>标签提取到视频URL:', videoUrl);
                }

                // 检查是否包含 <last_frame> 标签（可能在同一行或后续行）
                const lastFrameMatch = fullContent.match(/<last_frame>(.*?)<\/last_frame>/);
                if (lastFrameMatch && lastFrameMatch[1]) {
                  lastFrameUrl = lastFrameMatch[1].trim();
                  console.log('从<last_frame>标签提取到最后一帧URL:', lastFrameUrl);
                }

                // 检查是否包含 <seed> 标签
                const seedMatch = fullContent.match(/<seed>(.*?)<\/seed>/);
                if (seedMatch && seedMatch[1]) {
                  const seedValue = parseInt(seedMatch[1].trim());
                  if (!isNaN(seedValue)) {
                    extractedSeed = seedValue;
                    console.log('从<seed>标签提取到seed:', extractedSeed, '原始内容:', fullContent);
                  }
                } else if (fullContent.includes('<seed>')) {
                  console.log('发现seed标签但未能匹配，原始内容:', fullContent);
                } else if (fullContent.includes('seed')) {
                  console.log('发现包含seed的内容但没有<seed>标签，原始内容:', fullContent);
                }

                // 继续处理，不在这里提前返回，等待所有数据都到达

                // 提取 data: 后面的实际内容进行进一步处理
                const jsonStr = line.substring(5).trim();

                // 检查进度信息格式: "视频生成中... (1/60)"
                const progressMatch = jsonStr.match(/视频生成中\.\.\.\s*\((\d+)\/(\d+)\)/);
                if (progressMatch) {
                  const current = parseInt(progressMatch[1]);
                  const total = parseInt(progressMatch[2]);
                  if (onProgress) {
                    onProgress(`视频生成中... (${current}/${total})`, current, total);
                  }
                  continue;
                }

                // 其他进度消息
                if (jsonStr && !jsonStr.startsWith('{') && !jsonStr.startsWith('[')) {
                  if (onProgress) {
                    onProgress(jsonStr);
                  }
                  continue;
                }

                if (jsonStr === '[DONE]') {
                  if (videoUrl) {
                    console.log('收到[DONE]，视频生成完成，videoUrl:', videoUrl, 'lastFrameUrl:', lastFrameUrl, 'seed:', extractedSeed);
                    clearTimeout(timeoutId);
                    clearInterval(activityCheckInterval);
                    resolve({ videoUrl, lastFrameUrl: lastFrameUrl || undefined, seed: extractedSeed });
                  } else if (!hasError) {
                    clearInterval(activityCheckInterval);
                    reject(new Error('视频生成完成但未返回URL'));
                  }
                  return;
                }

                // 检查是否是空的 data: 行（可能表示流结束）
                if (jsonStr === '' || jsonStr === 'data:') {
                  // 如果已经有 videoUrl，继续等待可能的 last_frame
                  continue;
                }

                if (jsonStr && jsonStr !== '') {
                  const data = JSON.parse(jsonStr);

                  // 处理不同的响应格式
                  if (data.choices?.[0]?.delta?.content) {
                    // OpenAI格式的流式响应
                    const content = data.choices[0].delta.content;
                    try {
                      const contentData = JSON.parse(content);
                      if (contentData.videoUrl) {
                        videoUrl = contentData.videoUrl;
                      }
                      if (contentData.lastFrameUrl || contentData.last_frame) {
                        lastFrameUrl = contentData.lastFrameUrl || contentData.last_frame;
                      }
                      if (contentData.seed !== undefined) {
                        extractedSeed = contentData.seed;
                        console.log('从OpenAI格式响应中提取到seed:', extractedSeed);
                      }
                    } catch {
                      // 内容不是JSON，可能是进度信息
                      console.log('视频生成进度:', content);
                      if (onProgress) {
                        onProgress(content);
                      }
                    }
                  } else if (data.videoUrl) {
                    // 直接返回videoUrl
                    videoUrl = data.videoUrl;
                    if (data.lastFrameUrl || data.last_frame) {
                      lastFrameUrl = data.lastFrameUrl || data.last_frame;
                    }
                    if (data.seed !== undefined) {
                      extractedSeed = data.seed;
                      console.log('从JSON响应中提取到seed:', extractedSeed);
                    }
                  } else if (data.error) {
                    // 错误信息
                    hasError = true;
                    clearInterval(activityCheckInterval);
                    reject(new Error(data.error.message || '视频生成失败'));
                    return;
                  } else if (data.status) {
                    // 状态更新
                    console.log('视频生成状态:', data.status, data.message || '');
                    if (onProgress) {
                      onProgress(data.message || data.status);
                    }
                  }
                }
              } catch (parseError) {
                console.warn('解析SSE数据错误:', parseError);
              }
            }
          }
        }
      })
      .catch((error) => {
        hasError = true;
        clearTimeout(timeoutId);
        clearInterval(activityCheckInterval);
        console.error('视频生成请求错误:', error);
        reject(new Error(`视频生成失败: ${error.message}`));
      });
  });
};

/**
 * 上传文件到OSS
 * @param file 要上传的文件
 * @returns Promise<string> 返回OSS文件URL
 */
export const uploadFileToOss = async (file: File): Promise<string> => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    throw new Error('未找到认证令牌，请先登录');
  }

  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await axios.post(
      `${config.apiBaseUrl}/public/oss/upload`,
      formData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    if (response.data.code === 200 && response.data.data?.url) {
      console.log('文件上传成功:', response.data.data.url);
      return response.data.data.url;
    } else {
      throw new Error(response.data.msg || '文件上传失败');
    }
  } catch (error: any) {
    console.error('文件上传失败:', error);
    if (error.response?.status === 401) {
      throw new Error('登录已过期，请重新登录');
    }
    throw new Error(error.response?.data?.msg || error.message || '文件上传失败');
  }
};
