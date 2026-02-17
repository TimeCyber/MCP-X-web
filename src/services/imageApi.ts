import axios from 'axios';
import config from '../config';

// 创建axios实例
const apiClient = axios.create({
  baseURL: config.apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
    'Accept': '*/*'
  },
  timeout: 600000 // 10分钟超时时间，考虑到图片生成可能需要较长时间
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

// 图像输入类型
export interface ImageInput {
  href: string;
  mimeType: string;
}

// Reference material 类型定义
export interface ReferenceMaterial {
  type: 'image' | 'video';
  url?: string;
  data?: string;
  mimeType?: string;
}

// 文生图响应类型
export interface TextToImageResponse {
  code: number;
  message: string;
  data: {
    imageUrl: string;
    imageBase64?: string;
  } | null;
}

// 图生图响应类型
export interface ImageToImageResponse {
  code: number;
  message: string;
  data: {
    imageUrl: string;
    imageBase64?: string;
  } | null;
}

/**
 * 通过 Image 对象和 Canvas 获取图片 base64（绕过 CORS 限制）
 * @param imageUrl 图片URL
 * @returns Promise<string> base64 格式的图片数据（不含前缀）
 */
export async function fetchImageAsBase64(imageUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = ''; // 尝试请求 CORS

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('无法创建 canvas context'));
          return;
        }
        ctx.drawImage(img, 0, 0);
        const dataUrl = canvas.toDataURL('image/png');
        const base64Data = dataUrl.split(',')[1];
        resolve(base64Data);
      } catch (error) {
        // Canvas 被污染，无法导出
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error('图片加载失败'));
    };

    img.src = imageUrl;
  });
}

/**
 * 文生图接口
 * @param prompt 提示词
 * @param model 可选的模型名称
 * @param sessionId 可选的会话ID
 * @param imageSize 可选的图片尺寸
 * @param watermark 是否添加水印
 * @returns Promise<{ newImageBase64: string | null; newImageMimeType: string | null; textResponse: string | null; imageUrl: string | null; }>
 */
export async function generateImageFromText(
  prompt: string,
  model?: string,
  sessionId?: string,
  imageSize?: { width: number; height: number },
  watermark?: boolean,
  referenceMaterials?: ReferenceMaterial[]
): Promise<{ newImageBase64: string | null; newImageMimeType: string | null; textResponse: string | null; imageUrl?: string | null; }> {
  // 创建超时Promise
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('图片生成超时（10分钟）')), 10 * 60 * 1000); // 10分钟超时
  });

  const generatePromise = async (): Promise<{ newImageBase64: string | null; newImageMimeType: string | null; textResponse: string | null; imageUrl?: string | null; }> => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      throw new Error('用户未登录');
    }

    const requestData: any = {
      prompt,
      userId: userId, // 保持字符串格式，避免大数精度丢失
      model: model || 'z-image-turbo',
      appId: 'mcpx-text2image',
      watermark: watermark ?? false
    };

    if (sessionId) {
      requestData.sessionId = sessionId;
    }

    if (imageSize) {
      requestData.size = `${imageSize.width}*${imageSize.height}`;
    }

    if (referenceMaterials && referenceMaterials.length > 0) {
      requestData.referenceMaterials = referenceMaterials;
    }

    const response = await apiClient.post('/ai/image/generate', requestData);

    // 处理服务器返回的特殊格式
    const responseData = response.data;
    let imageUrl = null;

    // 检查是否是新的数据格式 (可能包含 data: 前缀)
    if (typeof responseData === 'string') {
      // 解析 <images>标签中的URL
      const imagesMatch = responseData.match(/<images>(.*?)<\/images>/);
      if (imagesMatch && imagesMatch[1]) {
        imageUrl = imagesMatch[1];
      }
    } else if (responseData.code === 200 && responseData.data) {
      // 原来的JSON格式
      const imageData = responseData.data;
      if (imageData.imageBase64) {
        return {
          newImageBase64: imageData.imageBase64,
          newImageMimeType: 'image/png',
          textResponse: null
        };
      }
      if (imageData.imageUrl) {
        imageUrl = imageData.imageUrl;
      }
    }

    // 如果有图片URL，尝试转换为 base64
    if (imageUrl) {
      try {
        const base64Data = await fetchImageAsBase64(imageUrl);
        return {
          newImageBase64: base64Data,
          newImageMimeType: 'image/png',
          textResponse: null,
          imageUrl: imageUrl
        };
      } catch (error) {
        console.warn('转换图片为 base64 失败，返回原始 URL:', error);
        // 转换失败时返回原始 URL，前端可以直接用 img 标签显示
        return {
          newImageBase64: null,
          newImageMimeType: 'image/png',
          textResponse: null,
          imageUrl: imageUrl
        };
      }
    }

    return {
      newImageBase64: null,
      newImageMimeType: null,
      textResponse: '图片生成失败，请重试'
    };
  };

  try {
    // 使用 Promise.race 实现超时控制
    return await Promise.race([generatePromise(), timeoutPromise]);
  } catch (error: any) {
    console.error('文生图API调用失败:', error);

    // 检查是否是 401 认证失败
    if (error.response?.status === 401 || error.response?.data?.code === 401) {
      throw new Error('认证失败，无法访问系统资源');
    }

    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    if (error.response?.data?.msg) {
      throw new Error(error.response.data.msg);
    }
    throw new Error('请求失败，可能是账户余额不足或网络服务不畅，请检查后重试');
  }
}

/**
 * 图生图/图像编辑接口
 * @param images 输入图片数组
 * @param prompt 编辑提示词
 * @param mask 蒙版图片（可选，用于局部编辑）
 * @param model 可选的模型名称
 * @param sessionId 可选的会话ID
 * @param size 可选的图片尺寸
 * @returns Promise<{ newImageBase64: string | null; newImageMimeType: string | null; textResponse: string | null; imageUrl?: string | null; }>
 */
export async function editImage(
  images: ImageInput[],
  prompt: string,
  mask?: ImageInput,
  model?: string,
  sessionId?: string,
  size?: { width: number; height: number }
): Promise<{ newImageBase64: string | null; newImageMimeType: string | null; textResponse: string | null; imageUrl?: string | null; }> {
  // 创建超时Promise
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('图片编辑超时（10分钟）')), 10 * 60 * 1000); // 10分钟超时
  });

  const editPromise = async (): Promise<{ newImageBase64: string | null; newImageMimeType: string | null; textResponse: string | null; imageUrl?: string | null; }> => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      throw new Error('用户未登录');
    }

    // 准备图片数据
    const imageDataList = images.map(image => {
      const dataUrlParts = image.href.split(',');
      const base64Data = dataUrlParts.length > 1 ? dataUrlParts[1] : dataUrlParts[0];
      return {
        data: base64Data,
        mimeType: image.mimeType
      };
    });

    const requestData: any = {
      userId: userId, // 保持字符串格式，避免大数精度丢失
      prompt,
      images: imageDataList,
      model: model || 'flux-dev',
      appId: 'mcpx-text2image'
    };

    if (sessionId) {
      requestData.sessionId = sessionId;
    }

    if (size) {
      requestData.size = `${size.width}*${size.height}`;
    }

    // 如果有蒙版，添加蒙版数据
    if (mask) {
      const maskDataUrlParts = mask.href.split(',');
      const maskBase64Data = maskDataUrlParts.length > 1 ? maskDataUrlParts[1] : maskDataUrlParts[0];
      requestData.mask = {
        data: maskBase64Data,
        mimeType: mask.mimeType
      };
    }

    const response = await apiClient.post('/ai/image/edit', requestData);

    // 处理服务器返回的特殊格式
    const responseData = response.data;
    let imageUrl = null;

    // 检查是否是新的数据格式
    if (typeof responseData === 'string' && responseData.includes('<images>')) {
      // 解析 <images>标签中的URL
      const imagesMatch = responseData.match(/<images>(.*?)<\/images>/);
      if (imagesMatch && imagesMatch[1]) {
        imageUrl = imagesMatch[1];
      }
    } else if (responseData.code === 200 && responseData.data) {
      // 原来的JSON格式
      const imageData = responseData.data;
      if (imageData.imageBase64) {
        return {
          newImageBase64: imageData.imageBase64,
          newImageMimeType: 'image/png',
          textResponse: null
        };
      }
      if (imageData.imageUrl) {
        imageUrl = imageData.imageUrl;
      }
    }

    // 如果有图片URL，尝试转换为 base64
    if (imageUrl) {
      try {
        const base64Data = await fetchImageAsBase64(imageUrl);
        return {
          newImageBase64: base64Data,
          newImageMimeType: 'image/png',
          textResponse: null,
          imageUrl: imageUrl
        };
      } catch (error) {
        console.warn('转换图片为 base64 失败，返回原始 URL:', error);
        // 转换失败时返回原始 URL，前端可以直接用 img 标签显示
        return {
          newImageBase64: null,
          newImageMimeType: 'image/png',
          textResponse: null,
          imageUrl: imageUrl
        };
      }
    }

    return {
      newImageBase64: null,
      newImageMimeType: null,
      textResponse: '图片编辑失败，请重试'
    };
  };

  try {
    // 使用 Promise.race 实现超时控制
    return await Promise.race([editPromise(), timeoutPromise]);
  } catch (error: any) {
    console.error('图生图API调用失败:', error);

    // 检查是否是 401 认证失败
    if (error.response?.status === 401 || error.response?.data?.code === 401) {
      throw new Error('认证失败，无法访问系统资源');
    }

    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    if (error.response?.data?.msg) {
      throw new Error(error.response.data.msg);
    }
    throw new Error('请求失败，可能是账户余额不足或网络服务不畅，请检查后重试');
  }
}
