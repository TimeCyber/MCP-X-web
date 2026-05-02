import axios from 'axios';
import config from '../config';

const apiClient = axios.create({
  baseURL: config.apiBaseUrl,
  headers: { 'Content-Type': 'application/json', 'Accept': '*/*' }
});

apiClient.interceptors.request.use((cfg) => {
  const token = localStorage.getItem('token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

function handleTokenExpired() {
  localStorage.removeItem('token');
  localStorage.removeItem('username');
  localStorage.removeItem('nickname');
  localStorage.removeItem('userId');
  if (!window.location.pathname.startsWith('/login')) {
    window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
  }
}

apiClient.interceptors.response.use(
  (res) => { if (res.data?.code === 401) { handleTokenExpired(); return Promise.reject(new Error('认证失败')); } return res; },
  (err) => { if (err.response?.status === 401) handleTokenExpired(); return Promise.reject(err); }
);

// 类型定义
export interface SkillCategory {
  id: number;
  name: string;
  nameEn?: string;
  icon?: string;
  sort?: number;
  isShow?: number;
}

export interface SkillDetail {
  id?: number;
  readme?: string;
  readmeCn?: string;
  toolList?: any[];
  envSchema?: string;
  serverConfig?: string;
  deployedEnvs?: Record<string, any>;
}

export interface SkillServer {
  id: number;
  name: string;
  chineseName?: string;
  nameEn?: string;
  nameCn?: string;
  handle?: string;
  description?: string;
  descriptionEn?: string;
  descriptionCn?: string;
  category?: string;
  categoryCn?: string;
  categoryEn?: string;
  categoryId?: number;
  skillType?: string;
  tags?: string;
  usageCount?: number;
  usageLabel?: string;
  verified?: boolean;
  isNew?: boolean;
  status?: number;
  isShow?: number;
  icon?: string;
  author?: string;
  version?: string;
  gmtCreated?: number;
  gmtUpdated?: number;
  createdDate?: string;
  skillDetailVo?: SkillDetail;
}

export const skillApi = {
  // 获取分类列表
  getCategories: async () => {
    const res = await apiClient.get('/web/skill/home/category');
    return res.data;
  },

  // 获取Skill列表（分页）
  getList: async (params?: { pageNum?: number; pageSize?: number; categoryId?: number; skillType?: string }) => {
    const res = await apiClient.get('/web/skill/home/list', { params: { pageNum: 1, pageSize: 20, ...params } });
    return res.data;
  },

  // 获取Skill详情
  getDetail: async (id: string | number) => {
    const res = await apiClient.get(`/web/skill/detail/${id}`);
    return res.data;
  },

  // 搜索Skill
  search: async (key: string, params?: { pageNum?: number; pageSize?: number }) => {
    const res = await apiClient.get('/web/skill/search', { params: { key, pageNum: 1, pageSize: 20, ...params } });
    return res.data;
  },

  // 根据分类获取Skill列表
  getByCategory: async (categoryId: number, params?: { pageNum?: number; pageSize?: number }) => {
    const res = await apiClient.get(`/web/skill/category/${categoryId}`, { params: { pageNum: 1, pageSize: 20, ...params } });
    return res.data;
  },

  // 根据类型获取Skill列表
  getByType: async (skillType: string, params?: { pageNum?: number; pageSize?: number }) => {
    const res = await apiClient.get(`/web/skill/type/${skillType}`, { params: { pageNum: 1, pageSize: 20, ...params } });
    return res.data;
  },
};

export default skillApi;
