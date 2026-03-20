import axios from 'axios';
import config from '../config';
import { KnowledgeInfo, KnowledgeAttach, KnowledgeFragment } from '../types';

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

// 定义API响应类型
interface ApiResponse<T> {
  code: number;
  data?: T;
  rows?: T;
  total?: number;
  msg?: string;
  message?: string;
}

// 分页查询参数
interface PageQuery {
  pageNum?: number;
  pageSize?: number;
}

// 知识库API服务
export const knowledgeApi = {
  // 获取知识库列表
  getKnowledgeList: async (params?: PageQuery): Promise<ApiResponse<KnowledgeInfo[]>> => {
    try {
      const response = await apiClient.get('/knowledge/list', { 
        params: {
          pageNum: params?.pageNum || 1,
          pageSize: params?.pageSize || 10,
          ...params
        }
      });
      return response.data;
    } catch (error) {
      console.error('获取知识库列表失败:', error);
      throw error;
    }
  },

  // 新增知识库
  saveKnowledge: async (data: KnowledgeInfo): Promise<ApiResponse<void>> => {
    try {
      const response = await apiClient.post('/knowledge/save', data);
      return response.data;
    } catch (error) {
      console.error('新增知识库失败:', error);
      throw error;
    }
  },

  // 编辑知识库
  editKnowledge: async (data: KnowledgeInfo): Promise<ApiResponse<void>> => {
    try {
      const response = await apiClient.post('/knowledge/edit', data);
      return response.data;
    } catch (error) {
      console.error('编辑知识库失败:', error);
      throw error;
    }
  },

  // 删除知识库
  removeKnowledge: async (id: string): Promise<ApiResponse<string>> => {
    try {
      const response = await apiClient.post(`/knowledge/remove/${id}`);
      return response.data;
    } catch (error) {
      console.error('删除知识库失败:', error);
      throw error;
    }
  },

  // 导出知识库
  exportKnowledge: async (data: Partial<KnowledgeInfo>): Promise<Blob> => {
    try {
      const response = await apiClient.post('/knowledge/export', data, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('导出知识库失败:', error);
      throw error;
    }
  },

  // 获取知识库附件列表
  getKnowledgeAttach: async (id: string, params?: PageQuery): Promise<ApiResponse<KnowledgeAttach[]>> => {
    try {
      const response = await apiClient.get(`/knowledge/detail/${id}`, { 
        params: {
          pageNum: params?.pageNum || 1,
          pageSize: params?.pageSize || 10,
          ...params
        }
      });
      return response.data;
    } catch (error) {
      console.error('获取知识库附件失败:', error);
      throw error;
    }
  },

  // 上传知识库附件（使用知识库的 id 字段）
  uploadAttach: async (file: File, id: string | number): Promise<ApiResponse<string>> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      // 后端要求使用 id 字段，不是 kid，但是参数名传kid
      formData.append('kid', String(id));

      const response = await apiClient.post('/knowledge/attach/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.error('上传知识库附件失败:', error);
      throw error;
    }
  },

  // 获取附件详情
  getAttachInfo: async (id: number): Promise<ApiResponse<KnowledgeAttach>> => {
    try {
      const response = await apiClient.get(`/knowledge/attach/info/${id}`);
      return response.data;
    } catch (error) {
      console.error('获取附件详情失败:', error);
      throw error;
    }
  },

  // 删除知识库附件
  removeAttach: async (kid: string): Promise<ApiResponse<void>> => {
    try {
      const response = await apiClient.post(`/knowledge/attach/remove/${kid}`);
      return response.data;
    } catch (error) {
      console.error('删除知识库附件失败:', error);
      throw error;
    }
  },

  // 获取知识片段列表
  getFragmentList: async (docId: string, params?: PageQuery): Promise<ApiResponse<KnowledgeFragment[]>> => {
    try {
      const response = await apiClient.get(`/knowledge/fragment/list/${docId}`, { 
        params: {
          pageNum: params?.pageNum || 1,
          pageSize: params?.pageSize || 10,
          ...params
        }
      });
      return response.data;
    } catch (error) {
      console.error('获取知识片段失败:', error);
      throw error;
    }
  },

  // 文件翻译
  translationByFile: async (file: File, targetLanguage: string): Promise<string> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('targetLanguage', targetLanguage);

      const response = await apiClient.post('/knowledge/translationByFile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.error('文件翻译失败:', error);
      throw error;
    }
  }
};

export default knowledgeApi;
