import type { ModelInfo } from '../../services/modelApi';

/** 视频生成工作台各阶段共用的模型记忆 key */
export const LAST_USED_IMAGE_MODEL_KEY = 'lastUsedImageModel';
export const LAST_USED_VIDEO_MODEL_KEY = 'lastUsedVideoModel';
export const LAST_USED_TEXT_MODEL_KEY = 'lastUsedTextModel';

/** 新建项目时的默认生图模型（服务端常残留此值，不应覆盖用户已选模型） */
export const DEFAULT_IMAGE_MODEL = 'z-image-turbo';

const isGenericImageModel = (model?: string): boolean =>
  !model || model === DEFAULT_IMAGE_MODEL;

export const getInitialImageModel = (projectModel?: string): string => {
  const lastUsed = localStorage.getItem(LAST_USED_IMAGE_MODEL_KEY);
  if (lastUsed && isGenericImageModel(projectModel)) {
    return lastUsed;
  }
  return projectModel || lastUsed || '';
};

export const getInitialVideoModel = (projectModel?: string): string =>
  projectModel || localStorage.getItem(LAST_USED_VIDEO_MODEL_KEY) || '';

export const getInitialTextModel = (projectModel?: string): string =>
  projectModel || localStorage.getItem(LAST_USED_TEXT_MODEL_KEY) || '';

export const resolvePreferredModel = (
  projectModel: string | undefined,
  storageKey: string,
  models: ModelInfo[]
): string | null => {
  if (models.length === 0) return null;
  if (projectModel && models.some(m => m.modelName === projectModel)) {
    return projectModel;
  }
  const lastUsed = localStorage.getItem(storageKey);
  if (lastUsed && models.some(m => m.modelName === lastUsed)) {
    return lastUsed;
  }
  return models[0].modelName;
};

/** 生图模型：当项目仍为默认 z-image-turbo 时，优先使用用户上次选择 */
export const resolvePreferredImageModel = (
  projectModel: string | undefined,
  models: ModelInfo[]
): string | null => {
  if (models.length === 0) return null;
  const lastUsed = localStorage.getItem(LAST_USED_IMAGE_MODEL_KEY);
  if (lastUsed && models.some(m => m.modelName === lastUsed) && isGenericImageModel(projectModel)) {
    return lastUsed;
  }
  return resolvePreferredModel(projectModel, LAST_USED_IMAGE_MODEL_KEY, models);
};

export const persistImageModel = (modelName: string): void => {
  if (modelName) localStorage.setItem(LAST_USED_IMAGE_MODEL_KEY, modelName);
};

export const persistVideoModel = (modelName: string): void => {
  if (modelName) localStorage.setItem(LAST_USED_VIDEO_MODEL_KEY, modelName);
};

export const persistTextModel = (modelName: string): void => {
  if (modelName) localStorage.setItem(LAST_USED_TEXT_MODEL_KEY, modelName);
};
