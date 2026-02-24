import React, { useState } from 'react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Book, 
  Code, 
  Rocket, 
  Settings, 
  FileText,
  Github,
  ExternalLink,
  ChevronRight,
  Zap,
  Shield,
  Globe,
  Database
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export const DocsPage: React.FC = () => {
  const { currentLanguage } = useLanguage();
  const [activeSection, setActiveSection] = useState('overview');

  const sections = [
    { id: 'overview', icon: <Book className="w-5 h-5" />, title: '平台概述', titleEn: 'Overview' },
    { id: 'features', icon: <Zap className="w-5 h-5" />, title: '核心功能', titleEn: 'Features' },
    { id: 'quickstart', icon: <Rocket className="w-5 h-5" />, title: '快速开始', titleEn: 'Quick Start' },
    { id: 'api', icon: <Code className="w-5 h-5" />, title: 'API 文档', titleEn: 'API Docs' },
    { id: 'config', icon: <Settings className="w-5 h-5" />, title: '配置说明', titleEn: 'Configuration' },
    { id: 'license', icon: <FileText className="w-5 h-5" />, title: '许可证', titleEn: 'License' }
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col selection:bg-orange-500/30">
      <Navbar />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <div className="relative overflow-hidden bg-gradient-to-b from-orange-500/5 via-transparent to-transparent">
          {/* Background decoration */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-[radial-gradient(ellipse_at_top,rgba(249,115,22,0.15),transparent_70%)] pointer-events-none" />
          
          <div className="max-w-7xl mx-auto px-4 pt-20 pb-16 relative z-10">
            <div className="text-center max-w-3xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <h1 className="text-4xl lg:text-6xl font-bold mb-6 tracking-tight">
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                    {currentLanguage === 'zh' ? 'MCP-X 平台文档' : 'MCP-X Platform Documentation'}
                  </span>
                </h1>
                <p className="text-xl text-gray-400 mb-8 leading-relaxed">
                  {currentLanguage === 'zh' 
                    ? '企业级 AI 智能体开发平台完整指南，助您快速构建下一代 AI 应用' 
                    : 'Complete Guide for Enterprise AI Agent Development Platform, helping you build next-gen AI apps fast'}
                </p>
                <div className="flex gap-4 justify-center">
                  <a
                    href="https://github.com/TimeCyber/MCP-X-web"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-500 text-white rounded-full font-medium transition-all hover:shadow-[0_0_20px_rgba(249,115,22,0.3)]"
                  >
                    <Github className="w-5 h-5" />
                    {currentLanguage === 'zh' ? 'GitHub 仓库' : 'GitHub Repo'}
                    <ExternalLink className="w-4 h-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </a>
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="flex gap-12">
            {/* Sidebar */}
            <aside className="hidden lg:block w-64 flex-shrink-0">
              <div className="sticky top-24 space-y-1">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`relative w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                      activeSection === section.id
                        ? 'text-white'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {activeSection === section.id && (
                      <motion.div
                        layoutId="activeSection"
                        className="absolute inset-0 bg-orange-500/10 rounded-xl border border-orange-500/20"
                        initial={false}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
                    <span className={`relative z-10 transition-colors ${activeSection === section.id ? 'text-orange-400' : 'group-hover:text-orange-400'}`}>
                      {section.icon}
                    </span>
                    <span className="relative z-10 font-medium">
                      {currentLanguage === 'zh' ? section.title : section.titleEn}
                    </span>
                  </button>
                ))}
              </div>
            </aside>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeSection}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {activeSection === 'overview' && <OverviewSection currentLanguage={currentLanguage} />}
                  {activeSection === 'features' && <FeaturesSection currentLanguage={currentLanguage} />}
                  {activeSection === 'quickstart' && <QuickStartSection currentLanguage={currentLanguage} />}
                  {activeSection === 'api' && <APISection currentLanguage={currentLanguage} />}
                  {activeSection === 'config' && <ConfigSection currentLanguage={currentLanguage} />}
                  {activeSection === 'license' && <LicenseSection currentLanguage={currentLanguage} />}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

// 平台概述部分
const OverviewSection: React.FC<{ currentLanguage: string }> = ({ currentLanguage }) => (
  <div className="space-y-8">
    <div>
      <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
        <span className="w-1 h-8 bg-orange-500 rounded-full"/>
        {currentLanguage === 'zh' ? '平台概述' : 'Platform Overview'}
      </h2>
      
      <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-8 border border-gray-800 shadow-xl">
        <p className="text-gray-300 text-lg leading-relaxed">
          {currentLanguage === 'zh' 
            ? 'MCP-X 是一个企业级 AI 智能体开发平台，集成了 AI 对话、视频生成、图像编辑、前端应用构建等多种创作工具，为企业和开发者提供一站式的 AI 工作流解决方案。'
            : 'MCP-X is an enterprise-grade AI agent development platform that integrates AI conversation, video generation, image editing, frontend application building, and other creative tools, providing a one-stop AI workflow solution for enterprises and developers.'}
        </p>
      </div>
    </div>

    <div>
      <h3 className="text-2xl font-bold mb-6 text-gray-200">
        {currentLanguage === 'zh' ? '企业级特色' : 'Enterprise Features'}
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FeatureCard
          icon={<Shield className="w-6 h-6" />}
          title={currentLanguage === 'zh' ? '安全可靠' : 'Security'}
          description={currentLanguage === 'zh' 
            ? 'Token 认证体系、多租户支持、数据隔离'
            : 'Token authentication, multi-tenancy, data isolation'}
        />
        <FeatureCard
          icon={<Zap className="w-6 h-6" />}
          title={currentLanguage === 'zh' ? '高性能' : 'Performance'}
          description={currentLanguage === 'zh' 
            ? 'SSE 流式响应、本地缓存、异步处理'
            : 'SSE streaming, local caching, async processing'}
        />
        <FeatureCard
          icon={<Globe className="w-6 h-6" />}
          title={currentLanguage === 'zh' ? '开放集成' : 'Integration'}
          description={currentLanguage === 'zh' 
            ? 'MCP 协议、多模型接入、标准化 API'
            : 'MCP protocol, multi-model, standardized API'}
        />
        <FeatureCard
          icon={<Database className="w-6 h-6" />}
          title={currentLanguage === 'zh' ? '企业功能' : 'Enterprise'}
          description={currentLanguage === 'zh' 
            ? '知识库管理、工作流编排、用量计费'
            : 'Knowledge base, workflow, billing system'}
        />
      </div>
    </div>
  </div>
);

// 核心功能部分
const FeaturesSection: React.FC<{ currentLanguage: string }> = ({ currentLanguage }) => (
  <div className="space-y-8">
    <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
      <span className="w-1 h-8 bg-orange-500 rounded-full"/>
      {currentLanguage === 'zh' ? '核心功能' : 'Core Features'}
    </h2>
    
    <div className="grid gap-6">
      <FeatureDetail
        title={currentLanguage === 'zh' ? 'AI 视频工作室' : 'AI Video Studio'}
        description={currentLanguage === 'zh'
          ? '支持国内外主流视频生成模型，完整的 AI 驱动视频制作工作流系统，支持从剧本到成片的全流程。'
          : 'Supports mainstream video generation models, complete AI-driven video production workflow from script to finished product.'}
        features={currentLanguage === 'zh' ? [
          '剧本解析：AI 自动分析剧本',
          '分镜生成：智能生成专业分镜列表',
          '角色定妆照：AI 生成角色视觉形象',
          '视频生成：文生视频、图生视频、首尾帧插值',
          '一键导出：浏览器端视频合并导出'
        ] : [
          'Script Parsing: AI analyzes scripts automatically',
          'Storyboard Generation: Intelligent shot list generation',
          'Character Design: AI-generated character visuals',
          'Video Generation: Text-to-video, image-to-video, keyframe',
          'One-Click Export: Browser-based video merging'
        ]}
      />

      <FeatureDetail
        title={currentLanguage === 'zh' ? 'AI 对话系统' : 'AI Conversation'}
        description={currentLanguage === 'zh'
          ? '支持国内外主流大语言模型，提供多模型对话、流式响应、MCP 工具集成等功能。'
          : 'Supports mainstream LLMs with multi-model chat, streaming response, and MCP tool integration.'}
        features={currentLanguage === 'zh' ? [
          '多模型支持：GPT、Gemini、DeepSeek、Kimi 等',
          '流式响应：SSE 实时流式输出',
          'MCP 工具集成：支持工具调用',
          '网络搜索：集成搜索功能',
          '文件上传：支持带文件的对话'
        ] : [
          'Multi-Model: GPT, Gemini, DeepSeek, Kimi, etc.',
          'Streaming: SSE real-time output',
          'MCP Tools: Tool invocation support',
          'Web Search: Integrated search',
          'File Upload: Conversation with files'
        ]}
      />

      <FeatureDetail
        title={currentLanguage === 'zh' ? '前端应用构建' : 'App Builder'}
        description={currentLanguage === 'zh'
          ? '类似 Bolt/Loveable 的 AI 前端构建体验，对话式开发，实时预览。'
          : 'AI frontend building experience similar to Bolt/Loveable with conversational development.'}
        features={currentLanguage === 'zh' ? [
          '对话式开发：自然语言描述需求',
          '多框架支持：HTML、React、Vue',
          '实时预览：代码即时预览',
          '可视化编辑：点击元素修改',
          '一键部署：云端部署支持'
        ] : [
          'Conversational: Natural language requirements',
          'Multi-Framework: HTML, React, Vue',
          'Live Preview: Instant code preview',
          'Visual Editing: Click to modify',
          'One-Click Deploy: Cloud deployment'
        ]}
      />

      <FeatureDetail
        title={currentLanguage === 'zh' ? 'AI 图像编辑器' : 'AI Image Editor'}
        description={currentLanguage === 'zh'
          ? '支持国内外主流图像生成模型，提供文生图、图生图、局部编辑等功能。'
          : 'Supports mainstream image models with text-to-image, image-to-image, and local editing.'}
        features={currentLanguage === 'zh' ? [
          '文生图：根据文字描述生成图像',
          '图生图：基于参考图像生成新图像',
          '局部编辑：蒙版支持局部区域编辑',
          '多模型选择：支持多种图像生成模型'
        ] : [
          'Text-to-Image: Generate from descriptions',
          'Image-to-Image: Generate from references',
          'Local Editing: Mask-based editing',
          'Multi-Model: Various image models'
        ]}
      />
    </div>
  </div>
);

// 快速开始部分
const QuickStartSection: React.FC<{ currentLanguage: string }> = ({ currentLanguage }) => (
  <div className="space-y-8">
    <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
      <span className="w-1 h-8 bg-orange-500 rounded-full"/>
      {currentLanguage === 'zh' ? '快速开始' : 'Quick Start'}
    </h2>
    
    <div className="bg-gray-900/50 rounded-2xl p-6 border border-gray-800">
      <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
        <Rocket className="w-5 h-5 text-orange-400" />
        {currentLanguage === 'zh' ? '环境要求' : 'Requirements'}
      </h3>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <li className="flex items-center gap-2 text-gray-300">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          Node.js 18+
        </li>
        <li className="flex items-center gap-2 text-gray-300">
          <div className="w-2 h-2 rounded-full bg-blue-500" />
          npm or yarn
        </li>
      </ul>
    </div>

    <div className="space-y-6">
      <CodeBlock
        title={currentLanguage === 'zh' ? '1. 克隆仓库' : '1. Clone Repository'}
        code="git clone https://github.com/TimeCyber/MCP-X-web.git\ncd MCP-X-web"
      />

      <CodeBlock
        title={currentLanguage === 'zh' ? '2. 安装依赖' : '2. Install Dependencies'}
        code="npm install"
      />

      <CodeBlock
        title={currentLanguage === 'zh' ? '3. 配置环境变量' : '3. Configure Environment'}
        code="# 创建 .env.local 文件\nVITE_API_BASE_URL=你的API地址\nVITE_STATIC_BASE_URL=静态资源地址"
      />

      <CodeBlock
        title={currentLanguage === 'zh' ? '4. 启动开发服务器' : '4. Start Dev Server'}
        code="npm run dev"
      />

      <CodeBlock
        title={currentLanguage === 'zh' ? '5. 生产构建' : '5. Production Build'}
        code="npm run build"
      />
    </div>
  </div>
);

// API 文档部分
const APISection: React.FC<{ currentLanguage: string }> = ({ currentLanguage }) => {
  const apiGroups = [
    {
      title: currentLanguage === 'zh' ? '认证相关' : 'Authentication',
      endpoints: [
        {
          method: 'POST',
          endpoint: '/auth/login',
          title: currentLanguage === 'zh' ? '用户登录' : 'User Login',
          description: currentLanguage === 'zh' ? '用户认证登录接口' : 'User authentication login',
          request: `{
  "username": "string",  // 用户名/邮箱
  "password": "string"   // 密码
}`,
          response: `{
  "code": 200,
  "data": {
    "access_token": "string",
    "token": "string",
    "userInfo": {
      "userId": "string",
      "username": "string",
      "nickName": "string",
      "avatar": "string"
    }
  }
}`
        },
        {
          method: 'POST',
          endpoint: '/auth/register',
          title: currentLanguage === 'zh' ? '用户注册' : 'User Register',
          description: currentLanguage === 'zh' ? '新用户注册接口' : 'New user registration',
          request: `{
  "username": "string",  // 邮箱
  "password": "string",  // 密码
  "code": "string"       // 邮箱验证码
}`
        },
        {
          method: 'POST',
          endpoint: '/resource/email/code',
          title: currentLanguage === 'zh' ? '发送验证码' : 'Send Code',
          description: currentLanguage === 'zh' ? '发送邮箱验证码' : 'Send email verification code',
          request: `{
  "username": "string"  // 邮箱地址
}`
        }
      ]
    },
    {
      title: currentLanguage === 'zh' ? 'AI 对话' : 'AI Chat',
      endpoints: [
        {
          method: 'POST',
          endpoint: '/chat/send',
          title: currentLanguage === 'zh' ? '发送消息 (SSE)' : 'Send Message (SSE)',
          description: currentLanguage === 'zh' ? '流式 AI 对话接口' : 'Streaming AI conversation',
          request: `{
  "messages": [{ "role": "user", "content": "hello" }],
  "model": "gpt-4o",
  "stream": true,
  "sessionId": "string",
  "isMcp": false,
  "internet": false
}`,
          response: `data: {"choices":[{"delta":{"content":"Hello!"}}]}
data: [DONE]`
        },
        {
          method: 'POST',
          endpoint: '/chat/send-with-files',
          title: currentLanguage === 'zh' ? '带文件对话' : 'Chat with Files',
          description: currentLanguage === 'zh' ? '支持上传文件的对话接口' : 'Conversation with file uploads',
          params: [
            { name: 'file', type: 'File[]', description: '文件列表' },
            { name: 'messages', type: 'string', description: 'JSON 格式的消息数组' }
          ]
        }
      ]
    },
    {
      title: currentLanguage === 'zh' ? '图像生成' : 'Image Generation',
      endpoints: [
        {
          method: 'POST',
          endpoint: '/ai/image/generate',
          title: currentLanguage === 'zh' ? '文生图' : 'Text to Image',
          description: currentLanguage === 'zh' ? '根据文字描述生成图像' : 'Generate images from text',
          request: `{
  "prompt": "a beautiful sunset",
  "model": "z-image-turbo",
  "size": "1024*1024"
}`,
          response: `{
  "code": 200,
  "data": {
    "imageUrl": "https://..."
  }
}`
        },
        {
          method: 'POST',
          endpoint: '/ai/image/edit',
          title: currentLanguage === 'zh' ? '图像编辑' : 'Image Edit',
          description: currentLanguage === 'zh' ? '图生图或局部重绘' : 'Image to image or inpainting',
          request: `{
  "prompt": "change hair color to red",
  "images": [{ "data": "base64...", "mimeType": "image/png" }],
  "mask": { "data": "base64...", "mimeType": "image/png" }
}`
        }
      ]
    },
    {
      title: currentLanguage === 'zh' ? '视频生成' : 'Video Generation',
      endpoints: [
        {
          method: 'POST',
          endpoint: '/ai/video/generate',
          title: currentLanguage === 'zh' ? '生成视频' : 'Generate Video',
          description: currentLanguage === 'zh' ? '流式视频生成接口' : 'Streaming video generation',
          request: `{
  "model": "kling-v1.6-standard",
  "prompt": "a cat running",
  "duration": 5,
  "aspectRatio": "16:9"
}`,
          response: `data: {"choices":[{"delta":{"content":"{\\"progress\\":30}"}}]}
data: {"choices":[{"delta":{"content":"{\\"videoUrl\\":\\"...\\"}"}}]}`
        }
      ]
    },
    {
      title: currentLanguage === 'zh' ? '应用构建' : 'App Builder',
      endpoints: [
        {
          method: 'POST',
          endpoint: '/app/webgen/add',
          title: currentLanguage === 'zh' ? '创建应用' : 'Create App',
          description: currentLanguage === 'zh' ? '初始化一个新的 Web 应用' : 'Initialize a new Web app',
          request: `{
  "appName": "My App",
  "message": "Create a landing page",
  "codeGenType": "REACT"
}`
        },
        {
          method: 'GET',
          endpoint: '/app/webgen/chat/gen/code',
          title: currentLanguage === 'zh' ? '生成代码' : 'Generate Code',
          description: currentLanguage === 'zh' ? '对话式生成代码 (SSE)' : 'Conversational code generation (SSE)',
          params: [
            { name: 'appId', type: 'string', description: '应用ID' },
            { name: 'message', type: 'string', description: '用户指令' }
          ]
        }
      ]
    },
    {
      title: currentLanguage === 'zh' ? 'MCP 服务' : 'MCP Services',
      endpoints: [
        {
          method: 'GET',
          endpoint: '/web/mcp/server/list',
          title: currentLanguage === 'zh' ? '服务列表' : 'Server List',
          description: currentLanguage === 'zh' ? '获取可用的 MCP 服务列表' : 'Get list of available MCP servers'
        },
        {
          method: 'GET',
          endpoint: '/web/mcp/server/detail/{id}',
          title: currentLanguage === 'zh' ? '服务详情' : 'Server Detail',
          description: currentLanguage === 'zh' ? '获取特定服务的详细信息' : 'Get details for a specific server',
          response: `{
  "code": 200,
  "data": {
    "name": "google-search",
    "tools": ["search", "get_page_content"]
  }
}`
        }
      ]
    },
    {
      title: currentLanguage === 'zh' ? '知识库' : 'Knowledge Base',
      endpoints: [
        {
          method: 'GET',
          endpoint: '/knowledge/list',
          title: currentLanguage === 'zh' ? '知识库列表' : 'Knowledge List',
          description: currentLanguage === 'zh' ? '获取用户的知识库列表' : 'Get user knowledge bases'
        },
        {
          method: 'POST',
          endpoint: '/knowledge/attach/upload',
          title: currentLanguage === 'zh' ? '上传附件' : 'Upload Attachment',
          description: currentLanguage === 'zh' ? '上传文档到知识库' : 'Upload documents to knowledge base',
          params: [
            { name: 'file', type: 'File', description: '文档文件' },
            { name: 'kid', type: 'string', description: '知识库ID' }
          ]
        }
      ]
    },
    {
      title: currentLanguage === 'zh' ? '支付系统' : 'Payment',
      endpoints: [
        {
          method: 'GET',
          endpoint: '/web/package/vip',
          title: currentLanguage === 'zh' ? '订阅套餐' : 'VIP Packages',
          description: currentLanguage === 'zh' ? '获取所有可用的 VIP 订阅套餐' : 'Get available VIP subscription plans'
        },
        {
          method: 'POST',
          endpoint: '/web/pay/wechat/create',
          title: currentLanguage === 'zh' ? '创建订单' : 'Create Order',
          description: currentLanguage === 'zh' ? '创建微信支付订单' : 'Create WeChat pay order',
          request: `{ "planId": 1 }`
        }
      ]
    }
  ];

  return (
    <div className="space-y-12">
      <section>
        <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
          <span className="w-1 h-8 bg-orange-500 rounded-full"/>
          {currentLanguage === 'zh' ? 'API 文档' : 'API Documentation'}
        </h2>
        
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-6 border border-gray-700">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="text-gray-300 mb-1">
                {currentLanguage === 'zh' ? '认证方式' : 'Authentication'}
              </p>
              <code className="text-orange-400 bg-black/30 px-2 py-1 rounded">Authorization: Bearer {'{token}'}</code>
            </div>
            <a
              href="https://github.com/TimeCyber/MCP-X-web/blob/main/API_DOCUMENTATION.md"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-orange-400 hover:text-orange-300 font-medium hover:underline flex-shrink-0"
            >
              {currentLanguage === 'zh' ? '完整文档 (Markdown)' : 'Full Docs (Markdown)'}
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {apiGroups.map((group, idx) => (
        <section key={idx} className="space-y-6">
          <h3 className="text-2xl font-bold text-gray-200 flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-orange-500/50" />
            {group.title}
          </h3>

          <div className="space-y-4">
            {group.endpoints.map((endpoint, eIdx) => (
              <APIEndpoint
                key={eIdx}
                {...endpoint}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};


// 配置说明部分
const ConfigSection: React.FC<{ currentLanguage: string }> = ({ currentLanguage }) => (
  <div className="space-y-8">
    <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
      <span className="w-1 h-8 bg-orange-500 rounded-full"/>
      {currentLanguage === 'zh' ? '配置说明' : 'Configuration'}
    </h2>
    
    <div className="space-y-6">
      <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
        <h3 className="text-xl font-bold mb-4 text-gray-200">
          {currentLanguage === 'zh' ? '环境变量配置' : 'Environment Variables'}
        </h3>
        <div className="bg-black/50 rounded-lg p-4 font-mono text-sm border border-gray-800">
          <div className="text-gray-500"># API 配置</div>
          <div className="text-green-400">VITE_API_BASE_URL=<span className="text-orange-300">https://www.mcp-x.com/prod-api</span></div>
          <div className="text-green-400">VITE_STATIC_BASE_URL=<span className="text-orange-300">/static</span></div>
          <div className="mt-2 text-gray-500"># GitHub OAuth</div>
          <div className="text-green-400">REACT_APP_GITHUB_CLIENT_ID=<span className="text-orange-300">your_client_id</span></div>
        </div>
      </div>

      <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
        <h3 className="text-xl font-bold mb-4 text-gray-200">
          {currentLanguage === 'zh' ? 'MCP 配置' : 'MCP Configuration'}
        </h3>
        <p className="text-gray-400 mb-4">
          {currentLanguage === 'zh'
            ? 'MCP 服务配置支持多种传输方式：'
            : 'MCP service configuration supports multiple transport methods:'}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {['stdio (Command Line)', 'SSE (Server-Sent Events)', 'WebSocket'].map((item, i) => (
            <div key={i} className="bg-black/30 p-3 rounded-lg border border-gray-800 text-center text-sm text-gray-300">
              {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// 许可证部分
const LicenseSection: React.FC<{ currentLanguage: string }> = ({ currentLanguage }) => (
  <div className="space-y-8">
    <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
      <span className="w-1 h-8 bg-orange-500 rounded-full"/>
      {currentLanguage === 'zh' ? '许可证' : 'License'}
    </h2>
    
    <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800">
      <div className="flex items-center gap-3 mb-6">
        <FileText className="w-8 h-8 text-orange-400" />
        <h3 className="text-2xl font-bold">Apache License 2.0</h3>
      </div>
      
      <p className="text-gray-400 mb-6 text-lg">
        {currentLanguage === 'zh'
          ? '本项目采用 Apache License 2.0 开源协议，附加商业使用条款：'
          : 'This project is licensed under Apache License 2.0 with additional commercial terms:'}
      </p>
      
      <div className="grid gap-3 mb-8">
        {[
          { icon: '✅', text: currentLanguage === 'zh' ? '个人用户免费使用' : 'Free for individual users' },
          { icon: '✅', text: currentLanguage === 'zh' ? '教育机构免费使用' : 'Free for educational institutions' },
          { icon: '✅', text: currentLanguage === 'zh' ? '非营利组织免费使用' : 'Free for non-profit organizations' },
          { icon: '✅', text: currentLanguage === 'zh' ? '20 人以下企业免费使用' : 'Free for companies with <20 employees' },
          { icon: '⚠️', text: currentLanguage === 'zh' ? '20 人及以上企业商业使用需申请授权' : 'Companies with 20+ employees require commercial authorization', highlight: true }
        ].map((item, i) => (
          <div key={i} className={`flex items-center gap-4 p-4 rounded-xl ${item.highlight ? 'bg-orange-500/10 border border-orange-500/20' : 'bg-black/20'}`}>
            <span className="text-xl">{item.icon}</span>
            <span className={item.highlight ? 'text-orange-200 font-medium' : 'text-gray-300'}>
              {item.text}
            </span>
          </div>
        ))}
      </div>

      <div className="bg-gradient-to-r from-orange-500/10 to-transparent border-l-4 border-orange-500 rounded-r-lg p-6">
        <h3 className="text-lg font-bold mb-2 text-orange-400">
          {currentLanguage === 'zh' ? '商业授权联系' : 'Commercial Authorization'}
        </h3>
        <p className="text-gray-400 mb-4 text-sm">
          {currentLanguage === 'zh'
            ? '如果您的公司/组织拥有 20 名或以上员工，并希望将本软件用于商业目的，请联系我们获取商业授权：'
            : 'If your company/organization has 20 or more employees and wishes to use this software for commercial purposes, please contact us:'}
        </p>
        <a
          href="mailto:ganyizhi@timecyber.com.cn"
          className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors text-sm font-medium"
        >
          📧 ganyizhi@timecyber.com.cn
        </a>
      </div>
    </div>
  </div>
);

// 辅助组件
const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; description: string }> = ({ icon, title, description }) => (
  <motion.div 
    whileHover={{ y: -5 }}
    className="bg-gray-900/50 p-6 rounded-2xl border border-gray-800 hover:border-orange-500/30 transition-colors group"
  >
    <div className="w-12 h-12 rounded-xl bg-gray-800 flex items-center justify-center text-orange-400 mb-4 group-hover:scale-110 transition-transform duration-300 group-hover:bg-orange-500/10">
      {icon}
    </div>
    <h4 className="font-bold text-lg mb-2 text-gray-100 group-hover:text-orange-400 transition-colors">{title}</h4>
    <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
  </motion.div>
);

const FeatureDetail: React.FC<{ title: string; description: string; features: string[] }> = ({ title, description, features }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-gray-900 rounded-2xl p-8 border border-gray-800 overflow-hidden relative"
  >
    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full blur-3xl -mr-16 -mt-16" />
    
    <h3 className="text-2xl font-bold mb-4 relative z-10">{title}</h3>
    <p className="text-gray-400 mb-6 text-lg relative z-10">{description}</p>
    <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 relative z-10">
      {features.map((feature, index) => (
        <li key={index} className="flex items-start gap-3 text-gray-300">
          <div className="mt-1 w-5 h-5 rounded-full bg-orange-500/10 flex items-center justify-center flex-shrink-0">
            <ChevronRight className="w-3 h-3 text-orange-400" />
          </div>
          <span className="text-sm">{feature}</span>
        </li>
      ))}
    </ul>
  </motion.div>
);

const CodeBlock: React.FC<{ title: string; code: string }> = ({ title, code }) => (
  <div className="rounded-xl overflow-hidden border border-gray-800 bg-[#1e1e1e] shadow-2xl">
    <div className="bg-[#2d2d2d] px-4 py-3 border-b border-gray-700 flex items-center justify-between">
      <div className="flex gap-2">
        <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
        <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
        <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
      </div>
      <span className="text-xs font-medium text-gray-400 font-mono">{title}</span>
    </div>
    <pre className="p-5 overflow-x-auto">
      <code className="text-sm text-gray-300 font-mono leading-relaxed">{code}</code>
    </pre>
  </div>
);

const APIEndpoint: React.FC<{ 
  method: string; 
  endpoint: string; 
  title: string; 
  description: string;
  request?: string;
  response?: string;
  params?: { name: string; type: string; description: string }[];
}> = ({ method, endpoint, title, description, request, response, params }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-gray-900/50 rounded-2xl border border-gray-800 overflow-hidden transition-all duration-300">
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full text-left p-5 hover:bg-white/5 transition-colors flex items-start gap-4 group"
      >
        <span className={`px-3 py-1.5 rounded-lg text-xs font-bold tracking-wide uppercase flex-shrink-0 ${
          method === 'GET' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 
          method === 'POST' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
          'bg-orange-500/10 text-orange-400 border border-orange-500/20'
        }`}>
          {method}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <code className="text-orange-400 font-mono text-sm bg-orange-500/5 px-2 py-0.5 rounded truncate">{endpoint}</code>
          </div>
          <h4 className="font-bold text-gray-200 mt-2">{title}</h4>
          <p className="text-gray-500 text-sm mt-1">{description}</p>
        </div>
        <ChevronRight className={`w-5 h-5 text-gray-600 transition-transform duration-300 mt-1 ${isExpanded ? 'rotate-90' : ''}`} />
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="border-t border-gray-800 bg-black/20"
          >
            <div className="p-6 space-y-6">
              {params && params.length > 0 && (
                <div>
                  <h5 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">Parameters</h5>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead>
                        <tr className="text-gray-500 border-b border-gray-800">
                          <th className="pb-2 font-medium">Name</th>
                          <th className="pb-2 font-medium">Type</th>
                          <th className="pb-2 font-medium">Description</th>
                        </tr>
                      </thead>
                      <tbody className="text-gray-300">
                        {params.map((param, i) => (
                          <tr key={i} className="border-b border-gray-800/50">
                            <td className="py-3 font-mono text-orange-300">{param.name}</td>
                            <td className="py-3 font-mono text-blue-400 text-xs">{param.type}</td>
                            <td className="py-3 text-gray-400">{param.description}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {request && (
                <div>
                  <h5 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">Request Body</h5>
                  <div className="bg-black/40 rounded-xl p-4 border border-gray-800">
                    <pre className="text-xs font-mono text-green-400 overflow-x-auto">
                      {request}
                    </pre>
                  </div>
                </div>
              )}

              {response && (
                <div>
                  <h5 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">Example Response</h5>
                  <div className="bg-black/40 rounded-xl p-4 border border-gray-800">
                    <pre className="text-xs font-mono text-blue-300 overflow-x-auto">
                      {response}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
