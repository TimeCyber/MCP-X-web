// VideoGen AI 类型定义

export interface CharacterVariation {
  id: string;
  name: string; // e.g., "Casual", "Tactical Gear", "Injured"
  visualPrompt: string;
  referenceImage?: string;
}

export interface Character {
  id: string;
  name: string;
  gender: string;
  age: string;
  personality: string;
  visualPrompt?: string;
  referenceImage?: string; // Base URL
  threeViewImage?: string; // 横板三视图 URL
  variations: CharacterVariation[]; // List of alternative looks
}

export interface Scene {
  id: string;
  location: string;
  time: string;
  atmosphere: string;
  visualPrompt?: string;
  referenceImage?: string; // URL
}

export interface Keyframe {
  id: string;
  type: 'start' | 'end';
  visualPrompt: string;
  imageUrl?: string;
  status: 'pending' | 'generating' | 'completed' | 'failed';
}

export interface VideoInterval {
  id: string;
  startKeyframeId: string;
  endKeyframeId: string;
  duration: number;
  motionStrength: number;
  videoUrl?: string;
  status: 'pending' | 'generating' | 'completed' | 'failed';
}

export interface Shot {
  id: string;
  sceneId: string;
  actionSummary: string;
  dialogue?: string;
  narration?: string; // 旁白
  cameraMovement: string;
  shotSize?: string;
  characters: string[]; // Character IDs
  characterVariations?: { [characterId: string]: string }; // Map char ID to variation ID for this shot
  characterImageTypes?: { [characterId: string]: 'base' | 'threeview' }; // Map char ID to image type for this shot
  keyframes: Keyframe[];
  interval?: VideoInterval;
}

export interface ScriptData {
  title: string;
  genre: string;
  logline: string;
  targetDuration?: string;
  language?: string;
  characters: Character[];
  scenes: Scene[];
  storyParagraphs: { id: number; text: string; sceneRefId: string }[];
}

export interface VideoGenProject {
  id: string;
  title: string;
  createdAt: number;
  lastModified: number;
  stage: 'script' | 'assets' | 'director' | 'export';

  // Script Phase Data
  rawScript: string;
  targetDuration: string;
  language: string;
  videoType?: 'script' | 'promotional' | 'shortvideo' | 'storyboard'; // 视频类型：剧本创作、宣传片、短视频、故事板Agent
  storyboardAnalysis?: string; // 故事板 Agent 分析结果（Seedance 提示词全文）
  textModel?: string; // 文字大模型选择
  imageModel?: string; // 图像生成模型选择
  imageStyle?: string; // 图像风格选择
  videoModel?: string; // 视频生成模型选择
  
  // 运行时状态（不持久化到数据库，仅用于页面切换保持）
  batchProgress?: {current: number, total: number, message: string} | null;
  isBatchStopping?: boolean;
  videoResolution?: '480P' | '720P' | '1080P'; // 视频输出分辨率
  videoRatio?: '16:9' | '9:16' | '1:1'; // 视频输出比例
  seed?: number; // 视频生成使用的seed值

  scriptData: ScriptData | null;
  shots: Shot[];
  isParsingScript: boolean;
  
  // 关联的会话ID（用于后端存储）
  sessionId?: string;
}

/** 从项目已有数据推断视频类型（兼容旧项目未持久化 videoType 的情况） */
export function inferVideoType(project: Partial<VideoGenProject>): VideoGenProject['videoType'] | undefined {
  if (project.videoType) return project.videoType;
  if (project.storyboardAnalysis) return 'storyboard';
  const shots = project.shots;
  if (shots && shots.length > 0) {
    const hasStoryboardMarkers = shots.some(s =>
      /\[\d+(?:\.\d+)?s\s*-\s*\d+(?:\.\d+)?s\]/i.test(s.actionSummary || '')
    );
    if (hasStoryboardMarkers) return 'storyboard';
  }
  return undefined;
}

/** 解析最终视频类型，无推断结果时默认 script */
export function resolveVideoType(project: Partial<VideoGenProject>): NonNullable<VideoGenProject['videoType']> {
  return inferVideoType(project) || 'script';
}

// 导出阶段类型
export type VideoGenStage = 'script' | 'assets' | 'director' | 'export';
