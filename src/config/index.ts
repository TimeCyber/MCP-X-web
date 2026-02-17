interface Config {
  apiBaseUrl: string;
  staticBaseUrl: string;
}

// 从环境变量中读取API基础URL，如果没有则使用默认值  //https://www.mcp-x.com/prod-api
//http://localhost:6039
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 
  (import.meta.env.PROD ? 'https://www.mcp-x.com/prod-api' : 'http://localhost:6039');

// 从环境变量中读取静态资源基础URL
// 生产环境使用同源 '/prod-api/static'，开发环境使用 '/static'
const staticBaseUrl = import.meta.env.VITE_STATIC_BASE_URL || 
  (import.meta.env.PROD ? '/prod-api/static' : '/static');

// 配置对象
const config: Config = {
  apiBaseUrl,
  staticBaseUrl
};

// 导出配置
export default config; 