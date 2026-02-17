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

// 分类接口类型定义
export interface ShowcaseCategory {
  id: number;
  categoryName: string;
  contentType: 'text' | 'image' | 'video';
  customTag?: string;
  description?: string;
  sort?: number;
  status: string;
  isDelete?: number;
  remark?: string;
}

// 精选内容接口类型定义
export interface ShowcaseContent {
  id: number;
  title: string;
  categoryId: number;
  contentType: 'text' | 'image' | 'video';
  originalPrompt?: string;
  generatedResult: string;
  thumbnailUrl?: string;
  aiModel?: string;
  generationParams?: string;
  tags?: string;
  likeCount?: number;
  viewCount?: number;
  favoriteCount?: number;
  sort?: number;
  isRecommended?: string;
  status: string;
  userId?: number;
  isDelete?: number;
  remark?: string;
  createTime?: string;
  updateTime?: string;
}

// 通用响应类型
export interface ApiResponse<T> {
  code: number;
  msg: string;
  data?: T;
  rows?: T;
  total?: number;
}

// 分页参数
export interface PageParams {
  pageNum?: number;
  pageSize?: number;
}

// 获取分类列表参数
export interface GetCategoryListParams extends PageParams {
  categoryName?: string;
  contentType?: 'text' | 'image' | 'video';
  status?: string;
}

// 获取内容列表参数
export interface GetShowcaseListParams extends PageParams {
  title?: string;
  categoryId?: number;
  contentType?: 'text' | 'image' | 'video';
  originalPrompt?: string;
  isRecommended?: string;
  status?: string;
}

// Showcase API
export const showcaseApi = {
  // 获取分类列表
  getCategoryList: async (params?: GetCategoryListParams): Promise<ApiResponse<ShowcaseCategory[]>> => {
    try {
      const response = await apiClient.get('/showcase/category/list', { params });
      return response.data;
    } catch (error) {
      console.error('获取分类列表失败:', error);
      throw error;
    }
  },

  // 获取精选内容列表
  getShowcaseList: async (params?: GetShowcaseListParams): Promise<ApiResponse<ShowcaseContent[]>> => {
    try {
      const response = await apiClient.get('/showcase/showcase/list', { params });
      return response.data;
    } catch (error) {
      console.error('获取精选内容列表失败:', error);
      throw error;
    }
  },

  // 增加浏览数
  incrementViewCount: async (id: number): Promise<ApiResponse<void>> => {
    try {
      const response = await apiClient.post(`/showcase/showcase/view/${id}`);
      return response.data;
    } catch (error) {
      console.error('增加浏览数失败:', error);
      throw error;
    }
  },

  // 点赞
  likeShowcase: async (id: number): Promise<ApiResponse<void>> => {
    try {
      const response = await apiClient.post(`/showcase/showcase/like/${id}`);
      return response.data;
    } catch (error) {
      console.error('点赞失败:', error);
      throw error;
    }
  },

  // 收藏
  favoriteShowcase: async (id: number): Promise<ApiResponse<void>> => {
    try {
      const response = await apiClient.post(`/showcase/showcase/favorite/${id}`);
      return response.data;
    } catch (error) {
      console.error('收藏失败:', error);
      throw error;
    }
  }
};
