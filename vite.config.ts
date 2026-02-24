import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // 加载环境变量
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@langchain/mcp-adapters': path.resolve(__dirname, 'node_modules/@langchain/mcp-adapters'),
    },
  },
    // 定义环境变量
    define: {
      'process.env': env
    },
    // 开发服务器配置
    server: {
      port: 3000,
      open: true,
      proxy: {
        // 代理API请求
        '/dev-api': {
          target: mode === 'production' 
            ? 'https://www.mcp-x.com/dev-api' 
            : 'http://localhost:6039',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, '')
        },
        // 代理静态预览资源，保证与前端同源，避免 iframe 跨域
        '/static': {
          target: mode === 'production'
            ? 'https://www.mcp-x.com/prod-api'
            : 'http://localhost:6039',
          changeOrigin: true,
          // 直接透传 /static 前缀
        }
      }
    },
    // 构建选项
    build: {
      outDir: 'dist',
      sourcemap: mode !== 'production',
      // 超过 800kb 才警告，给大型页面留余量
      chunkSizeWarningLimit: 800,
      rollupOptions: {
        output: {
          // 手动分包：将重型第三方库单独拆出，利用浏览器长效缓存
          manualChunks(id) {
            if (id.includes('node_modules')) {
              // React 核心（变动最少，缓存最久）
              if (id.includes('react-dom') || id.includes('react/') || id.includes('react-router')) {
                return 'vendor-react';
              }
              // UI / 动画
              if (id.includes('framer-motion')) return 'vendor-framer';
              if (id.includes('antd') || id.includes('@ant-design') || id.includes('rc-')) return 'vendor-antd';
              // Markdown 渲染
              if (
                id.includes('react-markdown') ||
                id.includes('remark') ||
                id.includes('rehype') ||
                id.includes('unified') ||
                id.includes('hast') ||
                id.includes('mdast') ||
                id.includes('micromark')
              ) {
                return 'vendor-markdown';
              }
              // LangChain / MCP（体积大，仅 Chat 页用到）
              if (id.includes('@langchain') || id.includes('langchain')) return 'vendor-langchain';
              // 其余第三方统一打入 vendor
              return 'vendor-misc';
            }
          },
        },
      },
    }
  };
});
