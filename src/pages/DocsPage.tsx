import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
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
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col">
      <Navbar />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <div className="bg-gradient-to-b from-orange-500/10 to-transparent py-16 lg:py-20">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center">
              <h1 className="text-4xl lg:text-5xl font-bold mb-4">
                {currentLanguage === 'zh' ? 'MCP-X 平台文档' : 'MCP-X Platform Documentation'}
              </h1>
              <p className="text-xl text-gray-400 mb-8">
                {currentLanguage === 'zh' 
                  ? '企业级 AI 智能体开发平台完整指南' 
                  : 'Complete Guide for Enterprise AI Agent Development Platform'}
              </p>
              <div className="flex gap-4 justify-center">
                <a
                  href="https://github.com/TimeCyber/MCP-X-web"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 rounded-lg font-medium transition-colors"
                >
                  <Github className="w-5 h-5" />
                  {currentLanguage === 'zh' ? 'GitHub 仓库' : 'GitHub Repo'}
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="flex gap-8">
            {/* Sidebar */}
            <aside className="hidden lg:block w-64 flex-shrink-0">
              <div className="sticky top-24 space-y-2">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      activeSection === section.id
                        ? 'bg-orange-500/20 text-orange-400'
                        : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                    }`}
                  >
                    {section.icon}
                    <span>{currentLanguage === 'zh' ? section.title : section.titleEn}</span>
                  </button>
                ))}
              </div>
            </aside>

            {/* Content */}
            <div className="flex-1 max-w-4xl">
              {activeSection === 'overview' && <OverviewSection currentLanguage={currentLanguage} />}
              {activeSection === 'features' && <FeaturesSection currentLanguage={currentLanguage} />}
              {activeSection === 'quickstart' && <QuickStartSection currentLanguage={currentLanguage} />}
              {activeSection === 'api' && <APISection currentLanguage={currentLanguage} />}
              {activeSection === 'config' && <ConfigSection currentLanguage={currentLanguage} />}
              {activeSection === 'license' && <LicenseSection currentLanguage={currentLanguage} />}
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
  <div className="prose prose-invert max-w-none">
    <h2 className="text-3xl font-bold mb-6">
      {currentLanguage === 'zh' ? '平台概述' : 'Platform Overview'}
    </h2>
    
    <div className="bg-[#1a1a1a] rounded-lg p-6 mb-6">
      <p className="text-gray-300 text-lg leading-relaxed">
        {currentLanguage === 'zh' 
          ? 'MCP-X 是一个企业级 AI 智能体开发平台，集成了 AI 对话、视频生成、图像编辑、前端应用构建等多种创作工具，为企业和开发者提供一站式的 AI 工作流解决方案。'
          : 'MCP-X is an enterprise-grade AI agent development platform that integrates AI conversation, video generation, image editing, frontend application building, and other creative tools, providing a one-stop AI workflow solution for enterprises and developers.'}
      </p>
    </div>

    <h3 className="text-2xl font-bold mb-4 mt-8">
      {currentLanguage === 'zh' ? '企业级特色' : 'Enterprise Features'}
    </h3>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
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
);

// 核心功能部分
const FeaturesSection: React.FC<{ currentLanguage: string }> = ({ currentLanguage }) => (
  <div className="prose prose-invert max-w-none">
    <h2 className="text-3xl font-bold mb-6">
      {currentLanguage === 'zh' ? '核心功能' : 'Core Features'}
    </h2>
    
    <div className="space-y-6">
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
  <div className="prose prose-invert max-w-none">
    <h2 className="text-3xl font-bold mb-6">
      {currentLanguage === 'zh' ? '快速开始' : 'Quick Start'}
    </h2>
    
    <div className="bg-[#1a1a1a] rounded-lg p-6 mb-6">
      <h3 className="text-xl font-bold mb-4">
        {currentLanguage === 'zh' ? '环境要求' : 'Requirements'}
      </h3>
      <ul className="list-disc list-inside text-gray-300 space-y-2">
        <li>Node.js 18+</li>
        <li>npm or yarn</li>
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
const APISection: React.FC<{ currentLanguage: string }> = ({ currentLanguage }) => (
  <div className="prose prose-invert max-w-none">
    <h2 className="text-3xl font-bold mb-6">
      {currentLanguage === 'zh' ? 'API 文档' : 'API Documentation'}
    </h2>
    
    <div className="bg-[#1a1a1a] rounded-lg p-6 mb-6">
      <p className="text-gray-300">
        {currentLanguage === 'zh'
          ? '完整的 API 文档请查看：'
          : 'For complete API documentation, please visit:'}
      </p>
      <a
        href="https://github.com/TimeCyber/MCP-X-web/blob/main/API_DOCUMENTATION.md"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 text-orange-400 hover:text-orange-300 mt-2"
      >
        API_DOCUMENTATION.md
        <ExternalLink className="w-4 h-4" />
      </a>
    </div>

    <h3 className="text-2xl font-bold mb-4">
      {currentLanguage === 'zh' ? '主要接口' : 'Main APIs'}
    </h3>

    <div className="space-y-4">
      <APIEndpoint
        method="POST"
        endpoint="/auth/login"
        title={currentLanguage === 'zh' ? '用户登录' : 'User Login'}
        description={currentLanguage === 'zh' ? '用户认证登录接口' : 'User authentication login'}
      />

      <APIEndpoint
        method="POST"
        endpoint="/chat/send"
        title={currentLanguage === 'zh' ? 'AI 对话' : 'AI Chat'}
        description={currentLanguage === 'zh' ? '流式 AI 对话接口' : 'Streaming AI conversation'}
      />

      <APIEndpoint
        method="POST"
        endpoint="/ai/image/generate"
        title={currentLanguage === 'zh' ? '图像生成' : 'Image Generation'}
        description={currentLanguage === 'zh' ? '文生图接口' : 'Text-to-image generation'}
      />

      <APIEndpoint
        method="POST"
        endpoint="/ai/video/generate"
        title={currentLanguage === 'zh' ? '视频生成' : 'Video Generation'}
        description={currentLanguage === 'zh' ? '视频生成接口（SSE）' : 'Video generation (SSE)'}
      />

      <APIEndpoint
        method="GET"
        endpoint="/app/webgen/chat/gen/code"
        title={currentLanguage === 'zh' ? '代码生成' : 'Code Generation'}
        description={currentLanguage === 'zh' ? '对话式代码生成接口' : 'Conversational code generation'}
      />
    </div>
  </div>
);

// 配置说明部分
const ConfigSection: React.FC<{ currentLanguage: string }> = ({ currentLanguage }) => (
  <div className="prose prose-invert max-w-none">
    <h2 className="text-3xl font-bold mb-6">
      {currentLanguage === 'zh' ? '配置说明' : 'Configuration'}
    </h2>
    
    <div className="space-y-6">
      <div className="bg-[#1a1a1a] rounded-lg p-6">
        <h3 className="text-xl font-bold mb-4">
          {currentLanguage === 'zh' ? '环境变量配置' : 'Environment Variables'}
        </h3>
        <div className="bg-black rounded p-4 font-mono text-sm">
          <div className="text-gray-400"># API 配置</div>
          <div className="text-green-400">VITE_API_BASE_URL=<span className="text-yellow-400">https://api.example.com</span></div>
          <div className="text-green-400">VITE_STATIC_BASE_URL=<span className="text-yellow-400">/static</span></div>
          <div className="mt-2 text-gray-400"># GitHub OAuth</div>
          <div className="text-green-400">REACT_APP_GITHUB_CLIENT_ID=<span className="text-yellow-400">your_client_id</span></div>
        </div>
      </div>

      <div className="bg-[#1a1a1a] rounded-lg p-6">
        <h3 className="text-xl font-bold mb-4">
          {currentLanguage === 'zh' ? 'MCP 配置' : 'MCP Configuration'}
        </h3>
        <p className="text-gray-300 mb-4">
          {currentLanguage === 'zh'
            ? 'MCP 服务配置支持多种传输方式：'
            : 'MCP service configuration supports multiple transport methods:'}
        </p>
        <ul className="list-disc list-inside text-gray-300 space-y-2">
          <li>stdio {currentLanguage === 'zh' ? '（命令行）' : '(command line)'}</li>
          <li>SSE (Server-Sent Events)</li>
          <li>WebSocket</li>
        </ul>
      </div>
    </div>
  </div>
);

// 许可证部分
const LicenseSection: React.FC<{ currentLanguage: string }> = ({ currentLanguage }) => (
  <div className="prose prose-invert max-w-none">
    <h2 className="text-3xl font-bold mb-6">
      {currentLanguage === 'zh' ? '许可证' : 'License'}
    </h2>
    
    <div className="bg-[#1a1a1a] rounded-lg p-6 mb-6">
      <h3 className="text-xl font-bold mb-4">Apache License 2.0</h3>
      <p className="text-gray-300 mb-4">
        {currentLanguage === 'zh'
          ? '本项目采用 Apache License 2.0 开源协议，附加商业使用条款：'
          : 'This project is licensed under Apache License 2.0 with additional commercial terms:'}
      </p>
      
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <span className="text-green-400 mt-1">✅</span>
          <span className="text-gray-300">
            {currentLanguage === 'zh' ? '个人用户免费使用' : 'Free for individual users'}
          </span>
        </div>
        <div className="flex items-start gap-3">
          <span className="text-green-400 mt-1">✅</span>
          <span className="text-gray-300">
            {currentLanguage === 'zh' ? '教育机构免费使用' : 'Free for educational institutions'}
          </span>
        </div>
        <div className="flex items-start gap-3">
          <span className="text-green-400 mt-1">✅</span>
          <span className="text-gray-300">
            {currentLanguage === 'zh' ? '非营利组织免费使用' : 'Free for non-profit organizations'}
          </span>
        </div>
        <div className="flex items-start gap-3">
          <span className="text-green-400 mt-1">✅</span>
          <span className="text-gray-300">
            {currentLanguage === 'zh' ? '20 人以下企业免费使用' : 'Free for companies with <20 employees'}
          </span>
        </div>
        <div className="flex items-start gap-3">
          <span className="text-orange-400 mt-1">⚠️</span>
          <span className="text-gray-300">
            {currentLanguage === 'zh' 
              ? '20 人及以上企业商业使用需申请授权' 
              : 'Companies with 20+ employees require commercial authorization'}
          </span>
        </div>
      </div>
    </div>

    <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-6">
      <h3 className="text-xl font-bold mb-4 text-orange-400">
        {currentLanguage === 'zh' ? '商业授权' : 'Commercial Authorization'}
      </h3>
      <p className="text-gray-300 mb-4">
        {currentLanguage === 'zh'
          ? '如果您的公司/组织拥有 20 名或以上员工，并希望将本软件用于商业目的，请联系我们获取商业授权：'
          : 'If your company/organization has 20 or more employees and wishes to use this software for commercial purposes, please contact us:'}
      </p>
      <a
        href="mailto:ganyizhi@timecyber.com.cn"
        className="inline-flex items-center gap-2 text-orange-400 hover:text-orange-300 font-medium"
      >
        📧 ganyizhi@timecyber.com.cn
      </a>
    </div>
  </div>
);

// 辅助组件
const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; description: string }> = ({ icon, title, description }) => (
  <div className="bg-[#1a1a1a] rounded-lg p-6 border border-gray-800">
    <div className="flex items-start gap-4">
      <div className="text-orange-400">{icon}</div>
      <div>
        <h4 className="font-bold mb-2">{title}</h4>
        <p className="text-gray-400 text-sm">{description}</p>
      </div>
    </div>
  </div>
);

const FeatureDetail: React.FC<{ title: string; description: string; features: string[] }> = ({ title, description, features }) => (
  <div className="bg-[#1a1a1a] rounded-lg p-6 border border-gray-800">
    <h3 className="text-xl font-bold mb-3">{title}</h3>
    <p className="text-gray-400 mb-4">{description}</p>
    <ul className="space-y-2">
      {features.map((feature, index) => (
        <li key={index} className="flex items-start gap-2 text-gray-300">
          <ChevronRight className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
          <span>{feature}</span>
        </li>
      ))}
    </ul>
  </div>
);

const CodeBlock: React.FC<{ title: string; code: string }> = ({ title, code }) => (
  <div className="bg-[#1a1a1a] rounded-lg overflow-hidden border border-gray-800">
    <div className="bg-gray-900 px-4 py-2 border-b border-gray-800">
      <span className="text-sm font-medium text-gray-300">{title}</span>
    </div>
    <pre className="p-4 overflow-x-auto">
      <code className="text-sm text-gray-300 font-mono">{code}</code>
    </pre>
  </div>
);

const APIEndpoint: React.FC<{ method: string; endpoint: string; title: string; description: string }> = ({ method, endpoint, title, description }) => (
  <div className="bg-[#1a1a1a] rounded-lg p-4 border border-gray-800">
    <div className="flex items-start gap-4">
      <span className={`px-2 py-1 rounded text-xs font-bold ${
        method === 'GET' ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'
      }`}>
        {method}
      </span>
      <div className="flex-1">
        <code className="text-orange-400 font-mono text-sm">{endpoint}</code>
        <h4 className="font-bold mt-2">{title}</h4>
        <p className="text-gray-400 text-sm mt-1">{description}</p>
      </div>
    </div>
  </div>
);
