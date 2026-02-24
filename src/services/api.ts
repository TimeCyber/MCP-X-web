import axios from 'axios';
import config from '../config';
import { encrypt } from '../utils/jsencrypt';
import { Server, Category, DetailedServer } from '../types';

// 定义API响应类型
interface ApiResponse<T> {
  code: number;
  rows: T;
  data: T;
  message?: string;
  msg?: string;
  token?: string;
  nickname?: string;
  sub?: string;
  total: number;
}

// 新增ruoyi-element-ai项目的接口类型
interface LoginDTO {
  username: string;
  password: string;
  code?: string;
  confirmPassword?: string;
}

interface RegisterDTO {
  username: string;
  password: string;
  code: string;
}

interface LoginVO {
  access_token?: string;
  token?: string;
  userInfo?: {
    userId?: string;  // 修改为string类型，匹配实际API返回值
    username?: string;
    nickName?: string;
    avatar?: string;
    rolePermission?: string[];
    tenantId?: string;
    userType?: string;
    roles?: Array<{
      roleId: number;
      roleName: string;
      roleKey: string;
      dataScope: string;
    }>;
    [key: string]: any;
  };
}

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
    // 这里可以添加认证token等
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
  // 避免在登录页重复跳转
  if (!window.location.pathname.startsWith('/login')) {
    window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
  }
}

// 响应拦截器 - 不再直接返回data，而是保留完整响应结构
apiClient.interceptors.response.use(
  (response) => {
    // 服务端以 HTTP 200 返回但 body.code === 401，表示 token 失效
    if (response.data?.code === 401) {
      handleTokenExpired();
      return Promise.reject(new Error(response.data?.msg || '认证失败'));
    }
    return response;
  },
  (error) => {
    // HTTP 状态码 401
    if (error.response?.status === 401) {
      handleTokenExpired();
    }
    return Promise.reject(error);
  }
);

// 生成requestid的工具函数
function generateRequestId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// 格式化使用量数字为带单位的字符串
const formatUsage = (num: number): string => {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(2)}m`;
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(2)}k`;
  }
  return num.toString();
};

// 将后端分类映射到前端的Category类型
const mapCategory = (category: string | null): Category => {
  if (!category) return '精选MCP';
  
  // 直接返回原始分类名称
  return category as Category;
};

// API接口
export const api = {
  // 用户相关接口 - 使用ruoyi-element-ai项目的接口
  user: {
    // 登录接口 - 改为使用ruoyi-element-ai项目的接口
    login: async (username: string, password: string) => {
      const loginData: LoginDTO = {
        username,
        password
      };

      const response = await apiClient.post<ApiResponse<LoginVO>>('/auth/login', loginData);
      return response.data;
    },
    
    // 注册接口 - 改为使用ruoyi-element-ai项目的接口
    register: async (username: string, password: string, code: string, inviteCode?: string) => {
      const registerData: RegisterDTO & { inviteCode?: string } = {
        username,
        password,
        code,
        ...(inviteCode ? { inviteCode } : {})
      };
      
      const response = await apiClient.post<ApiResponse<any>>('/auth/register', registerData);
      return response.data;
    },
    
    // 邮箱验证码接口
    emailCode: async (username: string) => {
      const response = await apiClient.post<ApiResponse<any>>('/resource/email/code', {
        username
      });
      return response.data;
    },
    
    // 验证token接口
    verifyToken: async () => {
      try {
        const response = await apiClient.get<ApiResponse<any>>('/web/feedback/my');
      return response.data;
      } catch (error) {
        console.error('获取反馈记录失败:', error);
        throw error;
      }
    },
    
    // GitHub登录接口
    githubLogin: async (code: string) => {
      const response = await apiClient.post<ApiResponse<LoginVO>>('/web/auth/github/login', {
        code
      });
      return response.data;
    },
    
    // 获取GitHub授权URL
    getGithubAuthUrl: () => {
      const clientId = process.env.REACT_APP_GITHUB_CLIENT_ID || 'your-github-client-id';
      const redirectUri = encodeURIComponent('https://www.mcp-x.com/auth/github/callback');
      const scope = 'read:user user:email';
      // 生成随机state参数防止CSRF攻击
      const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('github_oauth_state', state);
      return `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&state=${state}`;
    }
  },
  
  // 用户MCP配置
  userMcp: {
    // 新增用户MCP配置（首次保存）
    add: async (data: any) => {
      try {
        const response = await apiClient.post<ApiResponse<any>>('/user/userMcpServer', data);
        return response.data;
      } catch (e) {
        console.error('新增用户MCP配置失败:', e as any);
        throw e;
      }
    },
    // 删除我的MCP（支持单个或多个ID，逗号分隔）
    remove: async (ids: number | string | Array<number | string>) => {
      try {
        const path = Array.isArray(ids) ? ids.join(',') : ids;
        const response = await apiClient.delete<ApiResponse<any>>(`/user/userMcpServer/${path}`);
        return response.data;
      } catch (e) {
        console.error('删除用户MCP失败:', e as any);
        throw e;
      }
    },
    // 保存/更新用户MCP配置（自定义 serviceConfig）
    saveOrUpdate: async (data: any) => {
      try {
        const response = await apiClient.put<ApiResponse<any>>('/user/userMcpServer', data);
        return response.data;
      } catch (e) {
        console.error('保存用户MCP配置失败:', e as any);
        throw e;
      }
    },
    // 查询我的MCP列表
    list: async (params?: { pageNum?: number; pageSize?: number }) => {
      try {
        const response = await apiClient.get<ApiResponse<any>>('/user/userMcpServer/list', {
          params: {
            pageNum: params?.pageNum || 1,
            pageSize: params?.pageSize || 20,
            ...params
          }
        });
        return response.data;
      } catch (e) {
        console.error('获取用户MCP列表失败:', e as any);
        throw e;
      }
    },
    start: async (ids: number | string | Array<number | string>) => {
      try {
        const path = Array.isArray(ids) ? ids.join(',') : ids;
        const response = await apiClient.post<ApiResponse<any>>(`/user/userMcpServer/start/${path}`);
        return response.data;
      } catch (e) {
        console.error('启动用户MCP失败:', e as any);
        throw e;
      }
    }
  },
  
  // 服务器相关接口
  server: {
    // 获取服务器列表
    getList: async () => {
      const response = await apiClient.get<ApiResponse<any>>('/web/mcp/server/list');
      return response.data;
    },
    
    // 获取服务器详情
    getDetail: async (id: string) => {
      const response = await apiClient.get<ApiResponse<any>>(`/web/mcp/server/${id}`);
      return response.data;
    },
    
    // 获取最近收录的服务器
    fetchRecentServers: async () => {
      const response = await apiClient.get<ApiResponse<any>>('/web/mcp/recent');
      return response.data;
    },
    
    // 从后台API获取服务器数据
    fetchServers: async (): Promise<{ servers: Server[]; total: number }> => {
      try {
        const response = await apiClient.get<ApiResponse<any>>('/web/mcp/home/server');
        const apiResponse = response.data;
        
        if (apiResponse && apiResponse.code === 200 &&
          apiResponse.data &&
          Array.isArray((apiResponse.data as any).mcpservers)) {
          // 将获取的数据转换为正确的Server类型
          const servers = (apiResponse.data as any).mcpservers.map((item: any) => ({
            id: item.id.toString(),
            name: item.name,
            chineseName: item.chineseName,
            handle: item.handle ? `${item.handle}` : `${item.name.toLowerCase().replace(/\s+/g, '-')}`,
            description: item.descriptionEn || '',
            descriptionCn: item.descriptionCn || '',
            category: mapCategory(item.category),
            tags: ['Remote'],
            usage: item.usageCount || 0,
            usageLabel: item.usageLabel || formatUsage(item.usageCount || 0),
            verified: !!item.verified,
            new: !!item.isNew
          }));
          return { servers, total: (apiResponse.data as any).total || servers.length };
        } else {
          console.error('获取服务器数据失败:', apiResponse);
          return { servers: [], total: 0 };
        }
      } catch (error) {
        console.error('API请求错误:', error);
        return { servers: [], total: 0 };
      }
    },
    
    // 添加服务器
    addServer: async (serverData: {
      name: string;
      handle: string;
      description: string;
      documentation: string;
    }) => {
      const response = await apiClient.post<ApiResponse<any>>('/web/mcp/member/addserver', serverData);
      return response.data;
    },
    
    // 获取服务器详情数据
    getServerById: async (id: string): Promise<DetailedServer> => {
      try {
        // 尝试从API获取详细数据
        const response = await apiClient.get<ApiResponse<any>>(`/web/mcp/server/detail/${id}`);
        const apiResponse = response.data;
        
        // 检查API返回状态
        if (apiResponse && apiResponse.code === 200 && apiResponse.data) {
          const apiData = apiResponse.data;
          
          // 提取详细信息，处理嵌套数据结构
          const serverDetail = apiData.serverdetailVo || {};
          
          // 获取工具列表
          const tools = serverDetail.toolList || [];
          
          // 解析环境变量配置
          let envConfig = {};
          try {
            if (serverDetail.envSchema) {
              envConfig = JSON.parse(serverDetail.envSchema);
            }
          } catch (e) {
            console.error('解析环境变量配置失败:', e);
          }
          
          // 解析服务器配置
          let installCommand = '';
          let serverConfigJson = null;
          try {
            if (serverDetail.serverConfig) {
              // 预处理 JSON 字符串
              let configText = serverDetail.serverConfig.trim();
              
              // 如果是数组格式，提取第一个元素的内容
              if (configText.startsWith('[') && configText.endsWith(']')) {
                configText = configText.substring(1, configText.length - 1).trim();
              }
              
              // 移除末尾多余的逗号
              configText = configText.replace(/,(\s*[}\]])/g, '$1');
              
              try {
                serverConfigJson = JSON.parse(configText);
              } catch (innerError) {
                console.warn('第一次解析失败，尝试修复 JSON:', innerError);
                // 如果解析失败，尝试更激进的清理
                configText = configText
                  .replace(/,(\s*[}\]])/g, '$1') // 移除对象/数组结尾的逗号
                  .replace(/([{,]\s*)([a-zA-Z0-9_$]+)\s*:/g, '$1"$2":') // 给没有引号的键名加上引号
                  .replace(/:\s*'([^']*)'/g, ':"$1"') // 将单引号替换为双引号
                  .replace(/```/g, ''); // 移除 ```
                
                serverConfigJson = JSON.parse(configText);
              }
              
              if (serverConfigJson && serverConfigJson.mcpServers) {
                const serverKey = Object.keys(serverConfigJson.mcpServers)[0];
                if (serverKey) {
                  const serverConfig = serverConfigJson.mcpServers[serverKey];
                  if (serverConfig.command && serverConfig.args) {
                    installCommand = `${serverConfig.command} ${serverConfig.args.join(' ')}`;
                  }
                }
              }
            }
          } catch (e) {
            console.error('解析服务器配置失败:', e);
          }
          
          // 如果没有解析出安装命令，使用默认格式
          if (!installCommand) {
            installCommand = `npx -y ${serverDetail.serverConfig || apiData.handle || apiData.name.toLowerCase().replace(/\s+/g, '-')}`;
          }
          
          // 将API返回的数据转换为DetailedServer类型
          return {
            // 基本信息
            id: apiData.id.toString(),
            name: apiData.name,
            chineseName: apiData.chineseName,
            handle: apiData.handle ? `${apiData.handle}` : `${apiData.name.toLowerCase().replace(/\s+/g, '-')}`,
            description: apiData.descriptionEn || '',
            descriptionCn: apiData.descriptionCn || '',
            category: mapCategory(apiData.category),
            tags: apiData.tags || ['Remote'],
            usage: apiData.usageCount || 0,
            usageLabel: apiData.usageLabel || formatUsage(apiData.usageCount || 0),
            verified: !!apiData.verified,
            new: !!apiData.isNew,
            tools: tools,
            serverConfig: serverConfigJson,
            deployedEnvs: serverDetail.deployedEnvs || {},
            readme: serverDetail.readme || '',
            readmeCn: serverDetail.readmeCn || '',
            createdDate: apiData.createdDate,
            gmtCreated: apiData.gmtCreated,
            gmtUpdated: apiData.gmtUpdated,
            
            // 详细信息
            overview: serverDetail.abstractCn || apiData.descriptionCn || '',
            installation: {
              command: installCommand,
              platforms: ['MCP-X', 'Claude', 'Cursor', 'Windsurf']
            },
            security: {
              level: 'unknown',
              details: '需要配置高德地图API密钥'
            },
            statistics: {
              monthlyCalls: apiData.usageCount || 0,
              license: 'MIT',
              published: new Date(apiData.gmtCreated * 1000).toLocaleDateString() || '01/01/2025',
              local: false
            }
          };
        } else {
          console.error('获取服务器详情失败:', apiResponse);
          throw new Error(`获取服务器 ${id} 详情失败`);
        }
      } catch (error) {
        console.error('服务器详情API请求错误:', error);
        throw new Error(`服务器ID ${id} 获取失败`);
      }
    }
  },
  
  // 分类相关接口
  category: {
    // 从后台API获取分类数据
    fetchCategories: async (): Promise<any[]> => {
      try {
        const response = await apiClient.get<ApiResponse<any[]>>('/web/mcp/home/category');
        const apiResponse = response.data;
        
        if (apiResponse && apiResponse.code === 200 && Array.isArray(apiResponse.data)) {
          // 返回包含nameEn字段的分类对象数组
          const categories = apiResponse.data.map((item: any) => ({
            name: item.name || '',
            nameEn: item.nameEn || item.name || '',
            id: item.id
          }));
          
          // 确保至少有一些默认分类
          if (categories.length === 0) {
            return [
              { name: '精选MCP', nameEn: 'Featured MCP', id: 1 },
              { name: '浏览器自动化', nameEn: 'Browser Automation', id: 2 },
              { name: '办公软件', nameEn: 'Office Software', id: 3 }
            ];
          }
          
          return categories;
        } else {
          console.error('获取分类数据失败:', apiResponse);
          // 使用默认分类
          return [
            { name: '精选MCP', nameEn: 'Featured MCP', id: 1 },
            { name: '浏览器自动化', nameEn: 'Browser Automation', id: 2 },
            { name: '办公软件', nameEn: 'Office Software', id: 3 }
          ];
        }
      } catch (error) {
        console.error('分类API请求错误:', error);
        // 使用默认分类
        return [
          { name: '精选MCP', nameEn: 'Featured MCP', id: 1 },
          { name: '浏览器自动化', nameEn: 'Browser Automation', id: 2 },
          { name: '办公软件', nameEn: 'Office Software', id: 3 }
        ];
      }
    }
  },
  
  // 搜索相关接口
  search: {
    // 搜索接口
    search: async (keyword: string) => {
      try {
        const response = await apiClient.get<ApiResponse<any[]>>('/web/mcp/search', {
          params: {
            key: keyword
          }
        });
        return response.data;
      } catch (error) {
        console.error('搜索请求失败:', error);
        throw error;
      }
    }
  },
  
  // 反馈相关接口
  feedback: {
    // 提交反馈
    submitFeedback: async (data: {
      contactInfo: string;
      contributionDescription: string;
      detailedDescription: string;
      feedbackType: number;
      githubForkUrl?: string;
      issueType?: string;
      releaseUrl?: string;
    }) => {
      try {
        const response = await apiClient.post<ApiResponse<any>>('/web/feedback/submit', data);
        return response.data;
      } catch (error) {
        console.error('提交反馈失败:', error);
        throw error;
      }
    },
    
    // 获取我的反馈记录
    getMyFeedback: async () => {
      try {
        const response = await apiClient.get<ApiResponse<any>>('/web/feedback/my');
        return response.data;
      } catch (error) {
        console.error('获取反馈记录失败:', error);
        throw error;
      }
    }
  },
  
  contact: {
    sendMessage: async (data: { name: string; email: string; subject: string; message: string }) => {
      try {
        const res = await apiClient.post('/web/contact', data);
        return res;
      } catch (err: any) {
        let msg = '发送失败，请稍后重试';
        if (err && (err.message || err.msg)) {
          msg = err.message || err.msg;
        } else if (typeof err === 'string') {
          msg = err;
        }
        throw new Error(msg);
      }
    }
  },

  // VIP套餐相关接口
  package: {
    // 获取VIP套餐价格
    getVipPackages: async () => {
      try {
        const response = await apiClient.get<ApiResponse<any>>('/web/package/vip');
        return response.data;
      } catch (error) {
        console.error('获取VIP套餐失败:', error);
        throw error;
      }
    }
  },

  // 支付相关接口
  payment: {
    // 创建微信支付订单
    createWechatOrder: async (planId: number) => {
      try {
        const response = await apiClient.post<ApiResponse<any>>('/web/pay/wechat/create', {
          planId
        });
        return response.data;
      } catch (error) {
        console.error('创建微信支付订单失败:', error);
        throw error;
      }
    },

    // 继续微信支付
    continueWechatPay: async (orderNo: string) => {
      try {
        const response = await apiClient.post<ApiResponse<any>>('/web/pay/wechat/continue', {
          orderNo
        });
        return response.data;
      } catch (error) {
        console.error('继续微信支付失败:', error);
        throw error;
      }
    },

    // 根据订单号查询订单
    getOrderByNo: async (orderNo: string) => {
      try {
        // 依次尝试多种常见路径，增强兼容性
        const tryGet = async () => {
          try {
            return (await apiClient.get<ApiResponse<any>>(`/web/pay/order/detail/${orderNo}`)).data;
          } catch {}
        };
        return await tryGet();
      } catch (error) {
        console.error('根据订单号获取订单失败:', error);
        throw error;
      }
    },

    // 获取我的订单列表
    getMyOrders: async (params?: {
      pageNum?: number;
      pageSize?: number;
    }) => {
      try {
        const response = await apiClient.get<ApiResponse<any>>('/web/pay/order/list', {
          params: {
            pageNum: params?.pageNum || 1,
            pageSize: params?.pageSize || 10,
            ...params
          }
        });
        return response.data;
      } catch (error) {
        console.error('获取订单列表失败:', error);
        throw error;
      }
    },

    // 查询个人余额与套餐
    getMyBalanceAndPlan: async () => {
      try {
        const response = await apiClient.get<ApiResponse<any>>('/web/pay/me/balance-plan');
        return response.data;
      } catch (error) {
        console.error('获取余额和套餐信息失败:', error);
        throw error;
      }
    }
  },

  // Agent相关接口
  agent: {
    // 获取Agent分类列表
    getCategories: async () => {
      try {
        const response = await apiClient.get<ApiResponse<any>>('/web/agent/categories');
        return response.data;
      } catch (error) {
        console.error('获取Agent分类失败:', error);
        throw error;
      }
    },

    // 获取Agent列表
    getList: async (params?: { 
      pageNum?: number; 
      pageSize?: number; 
      categoryId?: number;
      status?: number;
    }) => {
      try {
        const response = await apiClient.get<ApiResponse<any>>('/web/agent/list', {
          params: {
            pageNum: params?.pageNum || 1,
            pageSize: params?.pageSize || 20,
            status: params?.status || 1, // 默认只获取状态为1的agent
            ...params
          }
        });
        return response.data;
      } catch (error) {
        console.error('获取Agent列表失败:', error);
        throw error;
      }
    },

    // 获取Agent详情
    getDetail: async (id: string | number) => {
      try {
        const response = await apiClient.get<ApiResponse<any>>(`/web/agent/detail/${id}`);
        return response.data;
      } catch (error) {
        console.error('获取Agent详情失败:', error);
        throw error;
      }
    },

    // 记录Agent使用活动
    trackActivity: async (id: string) => {
      // 在这个场景下，我们通常不关心响应体，但要处理可能的错误
      try {
        await apiClient.get(`/web/agent/activity/${id}`);
      } catch (error) {
        console.error(`记录Agent活动失败 (ID: ${id}):`, error);
        // 不向上抛出错误，以免阻塞主流程
      }
    },
    
    // 搜索Agent
    search: async (key: string, params?: {
      pageNum?: number;
      pageSize?: number;
      categoryId?: number;
    }) => {
      try {
        const response = await apiClient.get<ApiResponse<any>>('/web/agent/search', {
          params: {
            key,
            pageNum: 1,
            pageSize: 20,
            ...params
          }
        });
        return response.data;
      } catch (error) {
        console.error('搜索Agent失败:', error);
        throw error;
      }
    },

    // 获取最近发布的Agent
    getRecent: async (params?: { 
      pageNum?: number; 
      pageSize?: number; 
    }) => {
      try {
        const response = await apiClient.get<ApiResponse<any>>('/web/agent/recent', {
          params: {
            pageNum: 1,
            pageSize: 10,
            ...params
          }
        });
        return response.data;
      } catch (error) {
        console.error('获取最近Agent失败:', error);
        throw error;
      }
    },

    // 获取精选Agent列表
    getFeatured: async (params?: { 
      pageNum?: number; 
      pageSize?: number; 
    }) => {
      try {
        const response = await apiClient.get<ApiResponse<any>>('/web/agent/featured', {
          params: {
            pageNum: 1,
            pageSize: 20,
            ...params
          }
        });
        return response.data;
      } catch (error) {
        console.error('获取精选Agent失败:', error);
        throw error;
      }
    },

    // 根据分类获取Agent
    getByCategory: async (categoryId: number, params?: {
      pageNum?: number;
      pageSize?: number;
    }) => {
      try {
        const response = await apiClient.get<ApiResponse<any>>(`/web/agent/category/${categoryId}`, {
          params: {
            pageNum: 1,
            pageSize: 20,
            ...params
          }
        });
        return response.data;
      } catch (error) {
        console.error('根据分类获取Agent失败:', error);
        throw error;
      }
    }
  },

  // 邀请码相关接口
  invite: {
    // 获取或生成当前用户的邀请码
    getOrGenerateCode: async (): Promise<{ inviteCode: string; [key: string]: any }> => {
      try {
        const response = await apiClient.get('/web/invite/code/generate');
        return response.data?.data;
      } catch (error) {
        console.error('获取邀请码失败:', error);
        throw error;
      }
    }
  }
};

export default api;

// Token验证工具函数
export const tokenUtils = {
  // 检查本地是否有token
  hasToken: (): boolean => {
    return !!localStorage.getItem('token');
  },
  
  // 验证token是否有效（带缓存）
  verifyToken: async (): Promise<boolean> => {
    const token = localStorage.getItem('token');
    console.log('验证token:', token ? '存在' : '不存在');
    if (!token) {
      return false;
    }
    
    try {
      const response = await api.user.verifyToken();
      console.log('Token验证响应:', response);
      const isValid = response.code === 200;
      console.log('Token是否有效:', isValid);
      return isValid;
    } catch (error) {
      console.error('Token验证请求失败:', error);
      // 网络错误时不清理token，可能只是临时网络问题
      return false;
    }
  },
  
  // 清理过期token
  clearExpiredToken: () => {
    console.log('清理过期token');
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('nickname');
  },
  
  // 安全检查token（不重定向，适用于组件内部使用）
  safeCheck: async (): Promise<boolean> => {
    const token = localStorage.getItem('token');
    if (!token) {
      return false;
    }
    
    try {
      const response = await api.user.verifyToken();
      const isValid = response.code === 200;
      if (!isValid) {
        tokenUtils.clearExpiredToken();
      }
      return isValid;
    } catch (error) {
      console.error('Token安全验证失败:', error);
      // 网络错误时不清理token
      return false;
    }
  },
  
  // 检查并处理token过期（会重定向）
  checkTokenExpiry: async (): Promise<boolean> => {
    const isValid = await tokenUtils.verifyToken();
    if (!isValid && tokenUtils.hasToken()) {
      tokenUtils.clearExpiredToken();
      // 如果当前不在登录页面，则重定向到登录页面
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return isValid;
  },
  
  // 静默检查token（不重定向）
  silentCheck: async (): Promise<boolean> => {
    const token = localStorage.getItem('token');
    if (!token) {
      return false;
    }
    
    try {
      const response = await api.user.verifyToken();
      const isValid = response.code === 200;
      if (!isValid) {
        tokenUtils.clearExpiredToken();
      }
      return isValid;
    } catch (error) {
      console.error('Token静默验证失败:', error);
      // 网络错误时不清理token
      return false;
    }
  }
}; 