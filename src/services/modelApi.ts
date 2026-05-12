import axios from 'axios';
import config from '../config';

// 创建axios实例
const apiClient = axios.create({
  baseURL: config.apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
    'Accept': '*/*'
  }
});

// 请求拦截器
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// token 过期统一处理：清理本地存储并跳转登录页
function handleTokenExpired() {
  localStorage.removeItem('token');
  localStorage.removeItem('username');
  localStorage.removeItem('nickname');
  localStorage.removeItem('userId');
  if (!window.location.pathname.startsWith('/login')) {
    window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
  }
}

// 响应拦截器 - 处理 401 认证失败
apiClient.interceptors.response.use(
  (response) => {
    if (response.data?.code === 401) {
      handleTokenExpired();
      return Promise.reject(new Error(response.data?.msg || '认证失败'));
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      handleTokenExpired();
    }
    return Promise.reject(error);
  }
);

// 模型相关类型定义
export interface ModelInfo {
  id: string;
  category: string;
  modelName: string;
  modelDescribe: string;
  modelPrice: number;
  modelType: string;
  modelShow: string;
  systemPrompt: string | null;
  apiHost: string;
  apiKey: string;
  remark: string;
  /** 排序序号，越小越靠前；缺省或未解析时排到末尾（接口可能返回数字或字符串） */
  orderBy?: number | string;
}

/** 按 orderBy 升序排列模型列表（从小到大） */
export function sortModelsByOrderBy(models: ModelInfo[]): ModelInfo[] {
  const toNum = (m: ModelInfo): number => {
    const v = m.orderBy;
    if (typeof v === 'number' && Number.isFinite(v)) return v;
    if (typeof v === 'string' && String(v).trim() !== '') {
      const n = Number(v);
      if (Number.isFinite(n)) return n;
    }
    return Number.MAX_SAFE_INTEGER;
  };
  return [...models].sort((a, b) => toNum(a) - toNum(b));
}

// 模型相关API
export const modelApi = {
  // 获取模型列表（统一按 orderBy 升序，各页面拿到的 data 已为排序结果）
  getModelList: async () => {
    const response = await apiClient.get('/system/model/modelList');
    const body = response.data;
    if (body?.code === 200 && Array.isArray(body.data)) {
      return {
        ...body,
        data: sortModelsByOrderBy(body.data as ModelInfo[])
      };
    }
    return body;
  },
};

export default modelApi; 