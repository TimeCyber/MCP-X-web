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
  Database,
  Video
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export const DocsPage: React.FC = () => {
  const { currentLanguage } = useLanguage();
  const [activeSection, setActiveSection] = useState('overview');

  const sections = [
    { id: 'overview', icon: <Book className="w-5 h-5" />, title: '平台概述', titleEn: 'Overview' },
    { id: 'features', icon: <Zap className="w-5 h-5" />, title: '核心功能', titleEn: 'Features' },
    { id: 'videogen', icon: <Video className="w-5 h-5" />, title: '视频生成指南', titleEn: 'Video Gen Guide' },
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
                    {currentLanguage === 'zh' ? 'MCP-X 企业级 AI 中台文档' : 'MCP-X Enterprise AI Platform Docs'}
                  </span>
                </h1>
                <p className="text-xl text-gray-400 mb-8 leading-relaxed">
                  {currentLanguage === 'zh' 
                    ? '企业级 AI 中台完整指南，助您快速构建下一代 AI 应用' 
                    : 'Complete Guide for the Enterprise AI Middle Platform, helping you build next-gen AI apps fast'}
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
                  {activeSection === 'videogen' && <VideoGenGuideSection currentLanguage={currentLanguage} />}
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

// 视频生成指南部分
const VideoGenGuideSection: React.FC<{ currentLanguage: string }> = ({ currentLanguage }) => {
  const zh = currentLanguage === 'zh';
  return (
    <div className="space-y-10">
      <div>
        <h2 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <span className="w-1 h-8 bg-orange-500 rounded-full"/>
          {zh ? '视频生成指南' : 'Video Generation Guide'}
        </h2>
        <p className="text-gray-400 mt-3">
          {zh
            ? '本页解答关于 AI 视频工作台的常见疑问：页面地址、API 调用方式与完整工作流程。'
            : 'Answers common questions about the AI Video Studio: URL, API usage, and full workflow.'}
        </p>
      </div>

      {/* 1. 页面地址 */}
      <section className="bg-gray-900/60 rounded-2xl border border-gray-800 p-7 space-y-4">
        <h3 className="text-xl font-bold flex items-center gap-2 text-orange-400">
          <span className="w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center text-sm font-bold">1</span>
          {zh ? '视频生成页面地址' : 'Video Studio URL'}
        </h3>
        <p className="text-gray-300">
          {zh ? '视频工作台的前端路由为：' : 'The frontend route for the Video Studio is:'}
        </p>
        <div className="bg-black/50 rounded-xl border border-gray-700 px-5 py-3 font-mono text-orange-300 text-sm">
          /video-studio
        </div>
        <p className="text-gray-400 text-sm">
          {zh
            ? '完整 URL 示例：https://www.mcp-x.com/video-studio。该页面需要登录后才能访问，未登录会自动跳转到 /login。'
            : 'Full example: https://www.mcp-x.com/video-studio. Login is required; unauthenticated users are redirected to /login.'}
        </p>
      </section>

      {/* 2. API 调用方式 */}
      <section className="bg-gray-900/60 rounded-2xl border border-gray-800 p-7 space-y-5">
        <h3 className="text-xl font-bold flex items-center gap-2 text-orange-400">
          <span className="w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center text-sm font-bold">2</span>
          {zh ? 'API 接口调用方式' : 'API Call Details'}
        </h3>

        <div className="space-y-3">
          <p className="text-gray-300 font-medium">{zh ? '接口地址' : 'Endpoint'}</p>
          <div className="bg-black/50 rounded-xl border border-gray-700 px-5 py-3 font-mono text-green-400 text-sm">
            https://www.mcp-x.com/prod-api/ai/video/generate
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-gray-300 font-medium">{zh ? '请求头' : 'Headers'}</p>
          <div className="bg-black/50 rounded-xl border border-gray-700 px-5 py-3 font-mono text-sm text-gray-300">
            <div><span className="text-blue-400">Content-Type</span>: application/json</div>
            <div><span className="text-blue-400">Authorization</span>: Bearer {'<token>'}</div>
            <div><span className="text-blue-400">Accept</span>: text/event-stream</div>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-gray-300 font-medium">{zh ? '请求体（基础模式）' : 'Request Body (core modes)'}</p>
          <div className="grid gap-3">
            {[
              {
                label: zh ? '① 文生视频（只传 prompt）' : '① Text-to-Video (prompt only)',
                code: `{\n  "model": "kling-v1.6-standard",\n  "prompt": "a cat running in the park",\n  "duration": 5,\n  "ratio": "16:9",\n  "resolution": "720P",\n  "userId": "string",\n  "sessionId": "string",\n  "appId": "mcpx-video-studio"\n}`,
              },
              {
                label: zh ? '② 图生视频（传 imageUrl）' : '② Image-to-Video (imageUrl)',
                code: `{\n  ...// 同上\n  "imageUrl": "https://your-start-frame.jpg"\n}`,
              },
              {
                label: zh ? '③ 首尾帧插值（传 firstFrameUrl + lastFrameUrl）' : '③ Keyframe Interpolation',
                code: `{\n  ...// 同上\n  "firstFrameUrl": "https://start.jpg",\n  "lastFrameUrl": "https://end.jpg"\n}`,
              },
            ].map((item, i) => (
              <div key={i} className="rounded-xl overflow-hidden border border-gray-800">
                <div className="bg-gray-800/60 px-4 py-2 text-xs text-gray-400 font-medium">{item.label}</div>
                <pre className="bg-black/40 px-4 py-3 text-xs font-mono text-green-400 overflow-x-auto">{item.code}</pre>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3 rounded-xl border border-amber-500/40 bg-amber-500/5 p-5">
          <p className="text-amber-200 font-semibold">{zh ? '④ 参考生视频（独立说明 · 与前端 videogenService 一致）' : '④ Reference-based Video (matches videogenService)'}</p>
          <p className="text-gray-300 text-sm leading-relaxed space-y-2">
            <span className="block">
              {zh
                ? '**仅适用于阿里云图生视频类模型**（如 `wan2.6-i2v-flash`）。走同一接口 `POST /ai/video/generate`，与前端 `generateVideo` 组包一致。**referenceMaterials** 为引用素材数组，元素为 `{ "type": "image"|"video", "url": "..." }`（即 `imageApi.ts` 的 `ReferenceMaterial`）；可选用 `data`（base64）、`mimeType`。**imageUrl** 为图生视频起始帧，实践中常与首张参考图 URL 一致。不传 `firstFrameUrl` / `lastFrameUrl`。非阿里云请用「图生视频」或「首尾帧」。'
                : '**Alibaba i2v models only** (e.g. `wan2.6-i2v-flash`). Same `POST /ai/video/generate` as `generateVideo`. **referenceMaterials** entries follow `{ "type": "image"|"video", "url": "..." }` (`ReferenceMaterial` in imageApi.ts); optional `data`, `mimeType`. **imageUrl** is the start frame; often matches the first reference image URL. No keyframes. For other vendors use Image-to-Video or Keyframes.'}
            </span>
            <span className="block mt-2 text-gray-200">
              {zh
                ? '**prompt 书写规则（须强调）**：**character1、character2…** 与 **referenceMaterials 下标一一对齐**（0 → character1，1 → character2）。元素可为图片或视频，`character2` 即指向第二条素材（如参考视频）。示例见下方请求体：`character1` 对应首条参考图，`character2` 对应第二条参考视频。'
                : '**Prompt rule**: **character1, character2, …** map to **referenceMaterials** indices (0 → character1, 1 → character2). Items may be image or video—`character2` targets the second slot (e.g. a reference clip). See the sample body: `character1` is the first ref image, `character2` the second ref video.'}
            </span>
          </p>
          <pre className="bg-black/40 rounded-lg border border-gray-800 px-4 py-3 text-xs font-mono text-green-400 overflow-x-auto">{`{
  "model": "wan2.6-i2v-flash",
  "userId": "1948598948378775554",
  "sessionId": "2031992889474203650",
  "appId": "mcpx-video-studio",
  "prompt": "character1 根据这个参考图，生成企业宣传视频 character2 ，接着这个视频往下拍。多切几个镜头",
  "duration": 10,
  "ratio": "16:9",
  "resolution": "1080P",
  "audio": true,
  "referenceMaterials": [
    { "type": "image", "url": "https://mcpx.oss-cn-shanghai.aliyuncs.com/2026/03/21/2ffb904ea50e44ea987a6d5ad05feffd.jpg" },
    { "type": "video", "url": "https://mcpx.oss-cn-shanghai.aliyuncs.com/2026/03/30/4773506735b04b7e98e18b76d180cdfb.mp4" }
  ],
  "imageUrl": "https://mcpx.oss-cn-shanghai.aliyuncs.com/2026/03/21/2ffb904ea50e44ea987a6d5ad05feffd.jpg"
}`}</pre>
        </div>

        <div className="space-y-3">
          <p className="text-gray-300 font-medium">{zh ? '可选参数' : 'Optional Parameters'}</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="text-gray-500 border-b border-gray-800">
                  <th className="pb-2 font-medium pr-4">{zh ? '参数' : 'Param'}</th>
                  <th className="pb-2 font-medium pr-4">{zh ? '类型' : 'Type'}</th>
                  <th className="pb-2 font-medium">{zh ? '说明' : 'Description'}</th>
                </tr>
              </thead>
              <tbody className="text-gray-300">
                {[
                  ['referenceMaterials', 'object[]', zh ? '参考素材：每项 `{ type: "image"|"video", url?, data?, mimeType? }`；阿里云参考生视频必填引用图时在此声明，常与 imageUrl 同图' : 'Reference items `{ type, url?, data?, mimeType? }`; Alibaba ref-to-video uses this, often same URL as imageUrl'],
                  ['imageUrl', 'string', zh ? '图生视频起始帧；阿里云参考场景下常与 referenceMaterials[0].url 相同' : 'Start frame; for Alibaba ref flow often matches referenceMaterials URL'],
                  ['audio', 'boolean', zh ? '是否生成同步音频（阿里云等模型）' : 'Synchronized audio flag'],
                  ['audioUrl', 'string', zh ? '背景音频文件 URL' : 'Background audio file URL'],
                  ['seed', 'number', zh ? '随机种子，用于复现结果' : 'Seed for reproducible results'],
                  ['refImages', 'string[]', zh ? '额外参考图 URL 列表（与 referenceMaterials 不同字段）' : 'Extra ref image URLs (refImages array)'],
                ].map(([p, t, d], i) => (
                  <tr key={i} className="border-b border-gray-800/50">
                    <td className="py-2.5 font-mono text-orange-300 pr-4">{p}</td>
                    <td className="py-2.5 font-mono text-blue-400 text-xs pr-4">{t}</td>
                    <td className="py-2.5 text-gray-400">{d}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-gray-300 font-medium">{zh ? 'SSE 响应格式' : 'SSE Response Format'}</p>
          <div className="bg-black/50 rounded-xl border border-gray-700 px-5 py-4 font-mono text-xs text-blue-300 space-y-1">
            <div className="text-gray-500">{zh ? '// 进度推送' : '// Progress events'}</div>
            <div>{'data: {"choices":[{"delta":{"content":"{\\"progress\\":30}"}}]}'}</div>
            <div className="text-gray-500 mt-2">{zh ? '// 视频完成' : '// Video ready'}</div>
            <div>{'data: {"choices":[{"delta":{"content":"<video>https://cdn.../result.mp4</video>"}}]}'}</div>
            <div className="text-gray-500 mt-2">{zh ? '// 最后一帧（可选）' : '// Last frame (optional)'}</div>
            <div>{'data: {"choices":[{"delta":{"content":"{\\"lastFrameUrl\\":\\"https://...\\"}"}}]}'}</div>
            <div className="text-gray-500 mt-2">{zh ? '// 流结束' : '// Stream end'}</div>
            <div>data: [DONE]</div>
          </div>
        </div>
      </section>

      {/* 3. 完整工作流程 */}
      <section className="bg-gray-900/60 rounded-2xl border border-gray-800 p-7 space-y-6">
        <h3 className="text-xl font-bold flex items-center gap-2 text-orange-400">
          <span className="w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center text-sm font-bold">3</span>
          {zh ? '完整工作流程' : 'Full Workflow'}
        </h3>
        <div className="space-y-3">
          {[
            {
              step: zh ? '① 编写剧本' : '① Write Script',
              desc: zh ? '在"剧本"阶段输入原始剧本文本，AI 自动解析出角色、场景、段落结构。' : 'Enter raw script text in the Script stage. AI parses characters, scenes, and paragraphs.',
              api: null,
            },
            {
              step: zh ? '② 生成分镜' : '② Generate Storyboard',
              desc: zh ? 'AI 根据每个场景自动生成专业分镜列表（镜头描述、景别、运镜、对白）。' : 'AI generates a professional shot list per scene (description, shot size, camera movement, dialogue).',
              api: 'POST /chat/send  (streamChatSend)',
            },
            {
              step: zh ? '③ 生成角色 / 场景参考图' : '③ Generate Reference Images',
              desc: zh ? '为每个角色生成定妆照，为每个场景生成参考图，用于后续图像和视频生成时保持一致性。' : 'Generate character reference images and scene reference images for visual consistency.',
              api: 'POST /ai/image/generate',
            },
            {
              step: zh ? '④ 生成关键帧' : '④ Generate Keyframes',
              desc: zh ? '为每个分镜生成起始帧（和可选的结束帧），分辨率 2560×1440。' : 'Generate start (and optional end) keyframes per shot at 2560×1440.',
              api: 'POST /ai/image/generate',
            },
            {
              step: zh ? '⑤ 生成视频片段' : '⑤ Generate Video Clips',
              desc: zh ? '以关键帧为起始/结束帧，调用视频生成接口，SSE 流式返回进度和最终视频 URL。' : 'Use keyframes as start/end frames, call the video API, receive progress and final URL via SSE.',
              api: 'POST /ai/video/generate',
            },
            {
              step: zh ? '⑥ 导出合并' : '⑥ Export & Merge',
              desc: zh ? '在浏览器端将所有视频片段按顺序合并，导出为完整视频文件。' : 'Merge all video clips in order in the browser and export as a single video file.',
              api: null,
            },
          ].map((item, i) => (
            <div key={i} className="flex gap-4 p-4 rounded-xl bg-black/20 border border-gray-800/60">
              <div className="shrink-0 w-7 h-7 rounded-full bg-orange-500/15 flex items-center justify-center text-orange-400 text-xs font-bold mt-0.5">
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-200 mb-1">{item.step}</p>
                <p className="text-gray-400 text-sm">{item.desc}</p>
                {item.api && (
                  <code className="mt-2 inline-block text-xs font-mono bg-orange-500/10 text-orange-300 px-2 py-0.5 rounded">
                    {item.api}
                  </code>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
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
            ? 'MCP-X 是一个企业级 AI 中台，集成了 AI 对话、视频生成、图像编辑、前端应用构建等多种创作工具，为企业和开发者提供一站式的 AI 工作流解决方案。'
            : 'MCP-X is an enterprise AI middle platform that integrates AI conversation, video generation, image editing, frontend application building, and other creative tools, providing a one-stop AI workflow solution for enterprises and developers.'}
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
      title: currentLanguage === 'zh' ? '模型列表' : 'Model List',
      endpoints: [
        {
          method: 'GET',
          endpoint: '/system/model/modelList',
          title: currentLanguage === 'zh' ? '获取所有模型' : 'Get All Models',
          description: currentLanguage === 'zh'
            ? '获取平台支持的所有 AI 模型列表，包含对话、图像、视频等各类模型，可通过 category 字段区分类型'
            : 'Get all AI models supported by the platform. Use the category field to filter by type.',
          response: `{
  "code": 200,
  "data": [
    {
      "id": "string",
      "modelName": "gpt-4o",
      "category": "text2text",   // text2text | text2image | text2video
      "modelDescribe": "string",
      "modelPrice": 0,
      "modelType": "string",
      "modelShow": "string",
      "systemPrompt": null,
      "apiHost": "string",
      "remark": "string"
    }
  ]
}`
        }
      ]
    },
    {
      title: currentLanguage === 'zh' ? '会话管理' : 'Session Management',
      description: currentLanguage === 'zh'
        ? 'Session 是 AI 对话、图像生成、视频生成等功能的统一上下文容器。创建 Session 后，将 sessionId 传入各业务接口即可关联上下文、保存历史记录。'
        : 'A Session is the shared context container for AI chat, image generation, and video generation. Create a session first, then pass sessionId to any business API to associate context and persist history.',
      endpoints: [
        {
          method: 'POST',
          endpoint: '/web/session',
          title: currentLanguage === 'zh' ? '新建会话（登录用户）' : 'Create Session (Auth)',
          description: currentLanguage === 'zh' ? '创建一个新的 Session，返回 sessionId 供后续接口使用' : 'Create a new session and return a sessionId for subsequent API calls.',
          request: `{
  "userId": "string",
  "sessionContent": "",       // 初始内容，可为空
  "sessionTitle": "string",   // 会话标题
  "remark": "string",         // 备注（可选）
  "appId": "string"           // 关联应用ID（可选）
}`,
          response: `{
  "code": 200,
  "data": "1773812492551"   // 新建的 sessionId（大整数字符串）
}`
        },

        {
          method: 'GET',
          endpoint: '/web/session/list',
          title: currentLanguage === 'zh' ? '会话列表（登录用户）' : 'Session List (Auth)',
          description: currentLanguage === 'zh'
            ? '获取当前用户的会话列表，可按 appId 过滤，isDelete=0 只返回未删除的会话。'
            : 'Get session list for current user. Filter by appId; isDelete=0 returns only active sessions.',
          params: [
            { name: 'userId', type: 'string', description: currentLanguage === 'zh' ? '用户ID' : 'User ID' },
            { name: 'appId', type: 'string', description: currentLanguage === 'zh' ? '应用ID（可选）' : 'App ID (optional)' },
            { name: 'isDelete', type: 'number', description: currentLanguage === 'zh' ? '是否删除，默认 0' : 'Is deleted, default 0' }
          ],
          response: `{
  "code": 200,
  "rows": [
    {
      "id": "string",
      "sessionTitle": "string",
      "sessionContent": "string",
      "remark": "string",
      "userId": "string",
      "createTime": "string",
      "updateTime": "string"
    }
  ]
}`
        },

        {
          method: 'GET',
          endpoint: '/web/message/list',
          title: currentLanguage === 'zh' ? '获取聊天记录（登录用户）' : 'Get Messages (Auth)',
          description: currentLanguage === 'zh' ? '获取指定 Session 下的全部聊天记录，按时间升序返回' : 'Fetch all messages for a given session, ordered by time ascending.',
          params: [
            { name: 'sessionId', type: 'string', description: currentLanguage === 'zh' ? '会话ID' : 'Session ID' },
            { name: 'userId', type: 'string', description: currentLanguage === 'zh' ? '用户ID' : 'User ID' }
          ],
          response: `{
  "code": 200,
  "rows": [
    {
      "id": "string",
      "sessionId": "string",
      "role": "user | assistant | system",
      "content": "string",
      "userId": "string",
      "modelName": "gpt-4o",
      "deductCost": "0.02",
      "totalTokens": 512,
      "createTime": "string",
      "updateTime": "string",
      "files": [
        { "uid": "string", "name": "file.pdf", "type": "application/pdf", "size": 102400, "url": "string" }
      ]
    }
  ]
}`
        },

        {
          method: 'PUT',
          endpoint: '/web/session',
          title: currentLanguage === 'zh' ? '更新会话' : 'Update Session',
          description: currentLanguage === 'zh' ? '更新会话标题或备注' : 'Update session title or remark',
          request: `{
  "id": "string",            // 会话ID（id 或 sessionId 二选一）
  "sessionId": "string",     // 同上
  "sessionTitle": "string",  // 可选
  "remark": "string"         // 可选
}`
        },
        {
          method: 'PUT',
          endpoint: '/web/session/content',
          title: currentLanguage === 'zh' ? '更新会话内容' : 'Update Session Content',
          description: currentLanguage === 'zh' ? '保存会话内容（如视频项目 JSON），用于持久化工作区状态' : 'Save session content (e.g. video project JSON) for workspace persistence',
          request: `{
  "id": "string",           // sessionId
  "content": "string",      // 内容（JSON字符串等）
  "sessionTitle": "string"  // 可选
}`
        },
        {
          method: 'GET',
          endpoint: '/web/session/content/list/{sessionId}',
          title: currentLanguage === 'zh' ? '会话内容历史' : 'Session Content History',
          description: currentLanguage === 'zh' ? '获取会话内容的历史版本列表（如视频项目的历史快照）' : 'Get history of session content versions (e.g. video project snapshots)',
          response: `{
  "code": 200,
  "rows": [
    {
      "id": "string",
      "sessionId": "string",
      "content": "string",        // 保存的内容（JSON字符串等）
      "sessionTitle": "string",
      "createTime": "string"
    }
  ]
}`
        },
        {
          method: 'DELETE',
          endpoint: '/web/session/{sessionId}',
          title: currentLanguage === 'zh' ? '删除会话' : 'Delete Session',
          description: currentLanguage === 'zh' ? '删除指定会话（软删除）' : 'Delete a specific session (soft delete)',
          response: `{
  "code": 200,
  "msg": "操作成功"
}`
        },
        {
          method: 'GET',
          endpoint: '/web/ai-query/results/{queryId}/page',
          title: currentLanguage === 'zh' ? 'AI 查询结果（参考链接）' : 'AI Query Results',
          description: currentLanguage === 'zh' ? '分页获取 AI 查询的参考链接结果' : 'Paginated AI query reference link results',
          params: [
            { name: 'pageNum', type: 'number', description: currentLanguage === 'zh' ? '页码' : 'Page number' },
            { name: 'pageSize', type: 'number', description: currentLanguage === 'zh' ? '每页数量' : 'Page size' }
          ]
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
          title: currentLanguage === 'zh' ? '带文件对话 (SSE)' : 'Chat with Files (SSE)',
          description: currentLanguage === 'zh' ? '支持上传文件的流式对话接口，使用 multipart/form-data' : 'Streaming conversation with file uploads, multipart/form-data',
          params: [
            { name: 'file', type: 'File[]', description: currentLanguage === 'zh' ? '文件列表（可多个）' : 'File list (multiple allowed)' },
            { name: 'messages', type: 'string', description: currentLanguage === 'zh' ? 'JSON 格式的消息数组' : 'JSON-encoded messages array' },
            { name: 'model', type: 'string', description: currentLanguage === 'zh' ? '模型名称' : 'Model name' },
            { name: 'sessionId', type: 'string', description: currentLanguage === 'zh' ? '会话ID（可选）' : 'Session ID (optional)' },
            { name: 'userId', type: 'string', description: currentLanguage === 'zh' ? '用户ID（可选）' : 'User ID (optional)' },
            { name: 'stream', type: 'boolean', description: currentLanguage === 'zh' ? '是否流式，固定 true' : 'Streaming flag, always true' },
            { name: 'internet', type: 'boolean', description: currentLanguage === 'zh' ? '是否联网搜索' : 'Enable web search' },
            { name: 'kid', type: 'string', description: currentLanguage === 'zh' ? '知识库ID（可选）' : 'Knowledge base ID (optional)' },
            { name: 'agent', type: 'string', description: currentLanguage === 'zh' ? 'Agent名称（可选）' : 'Agent name (optional)' }
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
          description: currentLanguage === 'zh'
            ? '根据文字描述生成图像。无参考图时走文生图模型（默认 z-image-turbo）。'
            : 'Generate an image from a text prompt. Uses text-to-image model when no reference images are provided.',
          request: `{
  "prompt": "cinematic portrait of a young woman",
  "model": "z-image-turbo",       // 模型名，默认 z-image-turbo
  "userId": "string",
  "sessionId": "string",          // 可选，关联会话
  "appId": "mcpx-text2image",
  "size": "1024*1024",            // 宽*高，如 1280*720 / 2560*1440
  "watermark": false,             // 是否加水印
  "referenceMaterials": []        // 可选，@功能引用的素材
}`,
          response: `{
  "code": 200,
  "data": {
    "imageUrl": "https://cdn.../result.png",
    "imageBase64": "base64..."    // 部分模型直接返回 base64
  }
}`
        },
        {
          method: 'POST',
          endpoint: '/ai/image/edit',
          title: currentLanguage === 'zh' ? '参考图生图（图生图）' : 'Reference Image-to-Image',
          description: currentLanguage === 'zh'
            ? '传入一张或多张参考图时，自动切换为图生图模式（调用 /ai/image/edit），保持参考图的视觉风格和角色一致性。支持场景图 + 多张角色定妆照同时传入。'
            : 'When referenceImages are provided, the service automatically switches to image-to-image mode (calls /ai/image/edit internally), preserving visual style and character consistency.',
          request: `// 前端调用 generateImage(prompt, referenceImages, model, sessionId, size)
// 内部自动路由到 /ai/image/edit，请求体如下：
{
  "prompt": "Generate a cinematic shot matching this prompt: \\"...\\"",
  "model": "flux-dev",            // 图生图默认模型
  "userId": "string",
  "sessionId": "string",
  "appId": "mcpx-text2image",
  "size": "1280*720",
  "images": [
    { "data": "base64...", "mimeType": "image/png" },  // 场景参考图
    { "data": "base64...", "mimeType": "image/png" }   // 角色定妆照（可多张）
  ]
  // mask 字段不传 → 全图重绘
}`
        },
        {
          method: 'POST',
          endpoint: '/ai/image/edit',
          title: currentLanguage === 'zh' ? '图像局部编辑（蒙版重绘）' : 'Inpainting (Mask Edit)',
          description: currentLanguage === 'zh'
            ? '传入原图 + 蒙版 + 提示词，对蒙版区域进行局部重绘，其余区域保持不变。'
            : 'Pass source image + mask + prompt to repaint only the masked region.',
          request: `{
  "prompt": "change hair color to red",
  "model": "flux-dev",
  "userId": "string",
  "sessionId": "string",
  "appId": "mcpx-text2image",
  "size": "1024*1024",
  "images": [
    { "data": "base64...", "mimeType": "image/png" }   // 原图
  ],
  "mask": {
    "data": "base64...",          // 蒙版：白色=重绘区域，黑色=保留区域
    "mimeType": "image/png"
  }
}`,
          response: `{
  "code": 200,
  "data": {
    "imageUrl": "https://cdn.../edited.png"
  }
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
          title: currentLanguage === 'zh' ? '文生视频' : 'Text to Video',
          description: currentLanguage === 'zh'
            ? '只传 prompt，不传任何图片参数，走文生视频模式。响应为 SSE 流，持续推送进度直到视频 URL 返回。'
            : 'Prompt only, no image params. Uses text-to-video mode. Response is SSE stream.',
          request: `{
  "model": "kling-v1.6-standard",
  "prompt": "a cat running in the park",
  "duration": 5,                  // 时长（秒），默认 5
  "ratio": "16:9",                // 16:9 | 9:16 | 1:1
  "resolution": "720P",           // 480P | 720P | 1080P
  "userId": "string",
  "sessionId": "string",
  "appId": "mcpx-video-studio",
  "audio": false,                 // 可选：是否生成同步音频
  "seed": 12345                   // 可选：随机种子
}`,
          response: `data: {"choices":[{"delta":{"content":"{\\"progress\\":10,\\"message\\":\\"排队中\\"}"}}]}
data: {"choices":[{"delta":{"content":"{\\"progress\\":60,\\"message\\":\\"生成中\\"}"}}]}
data: {"choices":[{"delta":{"content":"<video>https://cdn.../result.mp4</video>"}}]}
data: [DONE]`
        },
        {
          method: 'POST',
          endpoint: '/ai/video/generate',
          title: currentLanguage === 'zh' ? '图生视频（起始帧）' : 'Image to Video (Start Frame)',
          description: currentLanguage === 'zh'
            ? '传入 imageUrl 作为视频起始帧，AI 根据 prompt 生成后续动态画面。同时可传 refImages 提供角色/场景参考图增强一致性。'
            : 'Pass imageUrl as the start frame. AI animates from that frame based on the prompt. refImages can be added for consistency.',
          request: `{
  "model": "kling-v1.6-standard",
  "prompt": "the character walks forward slowly",
  "imageUrl": "https://cdn.../start-frame.jpg",  // 起始帧图片 URL
  "duration": 5,
  "ratio": "16:9",
  "resolution": "720P",
  "userId": "string",
  "sessionId": "string",
  "appId": "mcpx-video-studio",
  "refImages": [                  // 可选：额外参考图（角色图、场景图）
    "https://cdn.../character.jpg",
    "https://cdn.../scene.jpg"
  ],
  "audio": false,
  "audioUrl": "https://cdn.../bg.mp3"  // 可选：背景音频
}`
        },
        {
          method: 'POST',
          endpoint: '/ai/video/generate',
          title: currentLanguage === 'zh' ? '首尾帧插值生成视频' : 'Keyframe Interpolation',
          description: currentLanguage === 'zh'
            ? '同时传入 firstFrameUrl 和 lastFrameUrl，AI 在两帧之间插值生成流畅过渡视频。适合精确控制镜头起止画面。'
            : 'Pass both firstFrameUrl and lastFrameUrl. AI interpolates between them for a smooth transition.',
          request: `{
  "model": "kling-v1.6-standard",
  "prompt": "smooth camera pan from left to right",
  "firstFrameUrl": "https://cdn.../start.jpg",   // 起始帧
  "lastFrameUrl": "https://cdn.../end.jpg",       // 结束帧
  "duration": 5,
  "ratio": "16:9",
  "resolution": "720P",
  "userId": "string",
  "sessionId": "string",
  "appId": "mcpx-video-studio",
  "seed": 42                      // 可选：固定 seed 可复现结果
}`,
          response: `// 与文生视频相同的 SSE 格式
// 视频完成后额外返回 lastFrameUrl（可用于下一镜头的起始帧）
data: {"choices":[{"delta":{"content":"{\\"lastFrameUrl\\":\\"https://cdn.../last.jpg\\"}"}}]}
data: {"choices":[{"delta":{"content":"<video>https://cdn.../result.mp4</video>"}}]}
data: [DONE]`
        },
        {
          method: 'POST',
          endpoint: '/ai/video/generate',
          title: currentLanguage === 'zh' ? '参考生视频（阿里云 · referenceMaterials + imageUrl）' : 'Reference Video (Alibaba: referenceMaterials + imageUrl)',
          description: currentLanguage === 'zh'
            ? '**仅适用于阿里云图生视频类模型**（如 `wan2.6-i2v-flash`）。与前端 `generateVideo` 一致：**referenceMaterials** 可为 `image` 与 `video` 混排（`ReferenceMaterial`）；**imageUrl** 多为起始帧、常与首条参考图一致。**character1 / character2…** 与数组下标对齐，见下方完整示例。非阿里云请用「图生视频」或「首尾帧」。'
            : '**Alibaba i2v only** (e.g. `wan2.6-i2v-flash`). Same as `generateVideo`: **referenceMaterials** may mix `image` and `video` (`ReferenceMaterial`); **imageUrl** is usually the start frame, often same as the first ref image. **character1 / character2…** align with indices—see sample body. Others: Image-to-Video or Keyframes.',
          request: `{
  "model": "wan2.6-i2v-flash",
  "userId": "1948598948378775554",
  "sessionId": "2031992889474203650",
  "appId": "mcpx-video-studio",
  "prompt": "character1 根据这个参考图，生成企业宣传视频 character2 ，接着这个视频往下拍。多切几个镜头",
  "duration": 10,
  "ratio": "16:9",
  "resolution": "1080P",
  "audio": true,
  "referenceMaterials": [
    { "type": "image", "url": "https://mcpx.oss-cn-shanghai.aliyuncs.com/2026/03/21/2ffb904ea50e44ea987a6d5ad05feffd.jpg" },
    { "type": "video", "url": "https://mcpx.oss-cn-shanghai.aliyuncs.com/2026/03/30/4773506735b04b7e98e18b76d180cdfb.mp4" }
  ],
  "imageUrl": "https://mcpx.oss-cn-shanghai.aliyuncs.com/2026/03/21/2ffb904ea50e44ea987a6d5ad05feffd.jpg"
}`,
          response: `// 与文生视频相同的 SSE 流式响应
data: {"choices":[{"delta":{"content":"<video>https://cdn.../result.mp4</video>"}}]}
data: [DONE]`
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
  "initPrompt": "string",
  "codeGenType": "HTML | REACT | VUE | STATIC",
  "userId": "string"
}`,
          response: `{
  "code": 200,
  "data": { "id": "app-id-string" }
}`
        },
        {
          method: 'GET',
          endpoint: '/app/webgen/{appId}',
          title: currentLanguage === 'zh' ? '获取应用信息' : 'Get App Info',
          description: currentLanguage === 'zh' ? '获取指定应用的详细信息' : 'Get details of a specific app',
          params: [
            { name: 'id', type: 'string', description: currentLanguage === 'zh' ? '应用ID（query param）' : 'App ID (query param)' }
          ]
        },
        {
          method: 'GET',
          endpoint: '/app/webgen/list',
          title: currentLanguage === 'zh' ? '我的应用列表' : 'My Apps',
          description: currentLanguage === 'zh' ? '分页获取当前用户的应用列表' : 'Paginated list of current user apps',
          params: [
            { name: 'pageNum', type: 'number', description: currentLanguage === 'zh' ? '页码' : 'Page number' },
            { name: 'pageSize', type: 'number', description: currentLanguage === 'zh' ? '每页数量' : 'Page size' },
            { name: 'appName', type: 'string', description: currentLanguage === 'zh' ? '应用名称（可选过滤）' : 'App name filter (optional)' }
          ]
        },
        {
          method: 'POST',
          endpoint: '/app/webgen/chat/gen/code',
          title: currentLanguage === 'zh' ? '对话生成代码 (SSE)' : 'Generate Code (SSE)',
          description: currentLanguage === 'zh' ? '对话式生成/修改代码，POST JSON 请求体，SSE 流式返回' : 'Conversational code generation: POST JSON body, SSE stream response',
          params: [
            { name: 'appId', type: 'string', description: currentLanguage === 'zh' ? '应用ID（JSON body）' : 'App ID (JSON body)' },
            { name: 'message', type: 'string', description: currentLanguage === 'zh' ? '用户指令（JSON body）' : 'User instruction (JSON body)' },
            { name: 'stream', type: 'boolean', description: currentLanguage === 'zh' ? '固定传 true（JSON body）' : 'Always true (JSON body)' }
          ],
          request: `{
  "appId": "string",
  "message": "string",
  "stream": true
}`,
          response: `data: {"d":"<html>..."}
data: [DONE]`
        },
        {
          method: 'GET',
          endpoint: '/app/webgen/chat/history',
          title: currentLanguage === 'zh' ? '聊天历史' : 'Chat History',
          description: currentLanguage === 'zh' ? '获取应用的对话历史记录' : 'Get chat history for an app',
          params: [
            { name: 'appId', type: 'string', description: currentLanguage === 'zh' ? '应用ID' : 'App ID' },
            { name: 'pageSize', type: 'number', description: currentLanguage === 'zh' ? '每页数量' : 'Page size' },
            { name: 'lastCreateTime', type: 'string', description: currentLanguage === 'zh' ? '游标时间（可选）' : 'Cursor time (optional)' }
          ]
        },
        {
          method: 'POST',
          endpoint: '/app/webgen/deploy',
          title: currentLanguage === 'zh' ? '部署应用' : 'Deploy App',
          description: currentLanguage === 'zh' ? '将应用部署到云端，返回部署 URL' : 'Deploy app to cloud, returns deploy URL',
          request: `"app-id-string"  // 直接传应用ID字符串`,
          response: `{
  "code": 200,
  "data": {
    "deployUrl": "https://...",
    "deployKey": "html_appId"
  }
}`
        },
        {
          method: 'GET',
          endpoint: '/app/webgen/download/{appId}',
          title: currentLanguage === 'zh' ? '下载代码' : 'Download Code',
          description: currentLanguage === 'zh' ? '下载应用源代码压缩包' : 'Download app source code as archive'
        },
        {
          method: 'POST',
          endpoint: '/app/webgen/delete',
          title: currentLanguage === 'zh' ? '删除应用' : 'Delete App',
          description: currentLanguage === 'zh' ? '删除指定应用' : 'Delete a specific app',
          request: `{ "id": "app-id-string" }`
        },
        {
          method: 'POST',
          endpoint: '/app/webgen/update',
          title: currentLanguage === 'zh' ? '更新应用信息' : 'Update App',
          description: currentLanguage === 'zh' ? '更新应用名称、封面等信息' : 'Update app name, cover, etc.',
          request: `{
  "id": "string",
  "appName": "string",
  "cover": "string",    // 可选
  "priority": 0         // 可选
}`
        }
      ]
    },
    {
      title: currentLanguage === 'zh' ? 'MCP 服务' : 'MCP Services',
      endpoints: [
        {
          method: 'GET',
          endpoint: '/web/mcp/home/server',
          title: currentLanguage === 'zh' ? '首页服务列表' : 'Home Server List',
          description: currentLanguage === 'zh' ? '获取首页展示的 MCP 服务列表' : 'Get MCP servers shown on the home page'
        },
        {
          method: 'GET',
          endpoint: '/web/mcp/server/list',
          title: currentLanguage === 'zh' ? '全部服务列表' : 'All Servers',
          description: currentLanguage === 'zh' ? '获取所有可用的 MCP 服务列表' : 'Get all available MCP servers'
        },
        {
          method: 'GET',
          endpoint: '/web/mcp/server/detail/{id}',
          title: currentLanguage === 'zh' ? '服务详情' : 'Server Detail',
          description: currentLanguage === 'zh' ? '获取特定服务的详细信息，包含工具列表、README、安装配置等' : 'Get full details for a server including tools, README, and install config'
        },
        {
          method: 'GET',
          endpoint: '/web/mcp/recent',
          title: currentLanguage === 'zh' ? '最近收录' : 'Recent Servers',
          description: currentLanguage === 'zh' ? '获取最近新收录的 MCP 服务' : 'Get recently added MCP servers'
        },
        {
          method: 'GET',
          endpoint: '/web/mcp/home/category',
          title: currentLanguage === 'zh' ? '服务分类' : 'Server Categories',
          description: currentLanguage === 'zh' ? '获取 MCP 服务分类列表' : 'Get MCP server category list'
        },
        {
          method: 'GET',
          endpoint: '/web/mcp/search',
          title: currentLanguage === 'zh' ? '搜索服务' : 'Search Servers',
          description: currentLanguage === 'zh' ? '按关键词搜索 MCP 服务' : 'Search MCP servers by keyword',
          params: [
            { name: 'key', type: 'string', description: currentLanguage === 'zh' ? '搜索关键词' : 'Search keyword' }
          ]
        },
        {
          method: 'POST',
          endpoint: '/web/mcp/member/addserver',
          title: currentLanguage === 'zh' ? '提交服务' : 'Submit Server',
          description: currentLanguage === 'zh' ? '提交新的 MCP 服务收录申请' : 'Submit a new MCP server for listing',
          request: `{
  "name": "string",
  "handle": "string",
  "description": "string",
  "documentation": "string"
}`
        },
        {
          method: 'GET',
          endpoint: '/user/userMcpServer/list',
          title: currentLanguage === 'zh' ? '我的 MCP 配置' : 'My MCP Configs',
          description: currentLanguage === 'zh' ? '获取当前用户保存的 MCP 服务配置列表' : 'Get current user saved MCP server configs'
        },
        {
          method: 'POST',
          endpoint: '/user/userMcpServer',
          title: currentLanguage === 'zh' ? '新增 MCP 配置' : 'Add MCP Config',
          description: currentLanguage === 'zh' ? '新增用户 MCP 服务配置' : 'Add a user MCP server config'
        },
        {
          method: 'PUT',
          endpoint: '/user/userMcpServer',
          title: currentLanguage === 'zh' ? '更新 MCP 配置' : 'Update MCP Config',
          description: currentLanguage === 'zh' ? '更新用户 MCP 服务配置（含自定义 serviceConfig）' : 'Update user MCP config including custom serviceConfig'
        },
        {
          method: 'DELETE',
          endpoint: '/user/userMcpServer/{ids}',
          title: currentLanguage === 'zh' ? '删除 MCP 配置' : 'Delete MCP Config',
          description: currentLanguage === 'zh' ? '删除用户 MCP 配置，支持逗号分隔多个ID' : 'Delete user MCP configs, supports comma-separated IDs'
        },
        {
          method: 'POST',
          endpoint: '/user/userMcpServer/start/{ids}',
          title: currentLanguage === 'zh' ? '启动 MCP 服务' : 'Start MCP Service',
          description: currentLanguage === 'zh' ? '启动指定的用户 MCP 服务' : 'Start specified user MCP services'
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
          description: currentLanguage === 'zh' ? '分页获取用户的知识库列表' : 'Paginated list of user knowledge bases',
          params: [
            { name: 'pageNum', type: 'number', description: currentLanguage === 'zh' ? '页码' : 'Page number' },
            { name: 'pageSize', type: 'number', description: currentLanguage === 'zh' ? '每页数量' : 'Page size' }
          ]
        },
        {
          method: 'POST',
          endpoint: '/knowledge/save',
          title: currentLanguage === 'zh' ? '新增知识库' : 'Create Knowledge Base',
          description: currentLanguage === 'zh' ? '创建新的知识库' : 'Create a new knowledge base'
        },
        {
          method: 'POST',
          endpoint: '/knowledge/edit',
          title: currentLanguage === 'zh' ? '编辑知识库' : 'Edit Knowledge Base',
          description: currentLanguage === 'zh' ? '修改知识库信息' : 'Update knowledge base info'
        },
        {
          method: 'POST',
          endpoint: '/knowledge/remove/{id}',
          title: currentLanguage === 'zh' ? '删除知识库' : 'Delete Knowledge Base',
          description: currentLanguage === 'zh' ? '删除指定知识库' : 'Delete a knowledge base by ID'
        },
        {
          method: 'GET',
          endpoint: '/knowledge/detail/{id}',
          title: currentLanguage === 'zh' ? '知识库附件列表' : 'Knowledge Attachments',
          description: currentLanguage === 'zh' ? '获取知识库下的附件列表' : 'Get attachments for a knowledge base'
        },
        {
          method: 'POST',
          endpoint: '/knowledge/attach/upload',
          title: currentLanguage === 'zh' ? '上传附件' : 'Upload Attachment',
          description: currentLanguage === 'zh' ? '上传文档到知识库（multipart/form-data）' : 'Upload document to knowledge base (multipart/form-data)',
          params: [
            { name: 'file', type: 'File', description: currentLanguage === 'zh' ? '文档文件' : 'Document file' },
            { name: 'kid', type: 'string', description: currentLanguage === 'zh' ? '知识库ID' : 'Knowledge base ID' }
          ]
        },
        {
          method: 'GET',
          endpoint: '/knowledge/attach/info/{id}',
          title: currentLanguage === 'zh' ? '附件详情' : 'Attachment Detail',
          description: currentLanguage === 'zh' ? '获取单个附件的详细信息' : 'Get details of a single attachment'
        },
        {
          method: 'POST',
          endpoint: '/knowledge/attach/remove/{kid}',
          title: currentLanguage === 'zh' ? '删除附件' : 'Delete Attachment',
          description: currentLanguage === 'zh' ? '删除知识库附件' : 'Delete a knowledge base attachment'
        },
        {
          method: 'GET',
          endpoint: '/knowledge/fragment/list/{docId}',
          title: currentLanguage === 'zh' ? '知识片段列表' : 'Fragment List',
          description: currentLanguage === 'zh' ? '获取文档的知识片段列表' : 'Get knowledge fragments for a document'
        },
        {
          method: 'POST',
          endpoint: '/knowledge/translationByFile',
          title: currentLanguage === 'zh' ? '文件翻译' : 'File Translation',
          description: currentLanguage === 'zh' ? '上传文件并翻译为目标语言' : 'Upload and translate a file to target language',
          params: [
            { name: 'file', type: 'File', description: currentLanguage === 'zh' ? '待翻译文件' : 'File to translate' },
            { name: 'targetLanguage', type: 'string', description: currentLanguage === 'zh' ? '目标语言' : 'Target language' }
          ]
        }
      ]
    },
    {
      title: currentLanguage === 'zh' ? '精选展示' : 'Showcase',
      endpoints: [
        {
          method: 'GET',
          endpoint: '/showcase/category/list',
          title: currentLanguage === 'zh' ? '展示分类列表' : 'Showcase Categories',
          description: currentLanguage === 'zh' ? '获取精选内容的分类列表，可按 contentType 过滤' : 'Get showcase content categories, filterable by contentType',
          params: [
            { name: 'categoryName', type: 'string', description: currentLanguage === 'zh' ? '分类名称（可选）' : 'Category name (optional)' },
            { name: 'contentType', type: 'string', description: 'text | image | video' },
            { name: 'pageNum', type: 'number', description: currentLanguage === 'zh' ? '页码' : 'Page number' },
            { name: 'pageSize', type: 'number', description: currentLanguage === 'zh' ? '每页数量' : 'Page size' }
          ],
          response: `{
  "code": 200,
  "rows": [
    {
      "id": 1,
      "categoryName": "string",
      "contentType": "text | image | video",
      "sort": 0,
      "status": "0"
    }
  ],
  "total": 10
}`
        },
        {
          method: 'GET',
          endpoint: '/showcase/showcase/list',
          title: currentLanguage === 'zh' ? '精选内容列表' : 'Showcase List',
          description: currentLanguage === 'zh' ? '获取精选内容列表，支持按分类、类型、推荐状态过滤' : 'Get showcase content list with category/type/recommended filters',
          params: [
            { name: 'categoryId', type: 'number', description: currentLanguage === 'zh' ? '分类ID（可选）' : 'Category ID (optional)' },
            { name: 'contentType', type: 'string', description: 'text | image | video' },
            { name: 'isRecommended', type: 'string', description: currentLanguage === 'zh' ? '是否推荐（可选）' : 'Is recommended (optional)' },
            { name: 'pageNum', type: 'number', description: currentLanguage === 'zh' ? '页码' : 'Page number' },
            { name: 'pageSize', type: 'number', description: currentLanguage === 'zh' ? '每页数量' : 'Page size' }
          ],
          response: `{
  "code": 200,
  "rows": [
    {
      "id": 1,
      "title": "string",
      "categoryId": 1,
      "contentType": "image",
      "originalPrompt": "string",
      "generatedResult": "https://cdn.../result.png",
      "thumbnailUrl": "string",
      "aiModel": "string",
      "likeCount": 0,
      "viewCount": 0,
      "favoriteCount": 0,
      "isRecommended": "1",
      "createTime": "2026-01-01T00:00:00Z"
    }
  ],
  "total": 100
}`
        },
        {
          method: 'POST',
          endpoint: '/showcase/showcase/view/{id}',
          title: currentLanguage === 'zh' ? '增加浏览数' : 'Increment View Count',
          description: currentLanguage === 'zh' ? '记录一次内容浏览，浏览数 +1' : 'Record a view, increments viewCount by 1'
        },
        {
          method: 'POST',
          endpoint: '/showcase/showcase/like/{id}',
          title: currentLanguage === 'zh' ? '点赞' : 'Like',
          description: currentLanguage === 'zh' ? '对精选内容点赞' : 'Like a showcase item'
        },
        {
          method: 'POST',
          endpoint: '/showcase/showcase/favorite/{id}',
          title: currentLanguage === 'zh' ? '收藏' : 'Favorite',
          description: currentLanguage === 'zh' ? '收藏精选内容' : 'Favorite a showcase item'
        }
      ]
    },
    {
      title: currentLanguage === 'zh' ? '人工反馈' : 'Human Feedback',
      endpoints: [
        {
          method: 'GET',
          endpoint: '/chat/human-feedback/status/{threadId}',
          title: currentLanguage === 'zh' ? '检查反馈状态' : 'Check Feedback Status',
          description: currentLanguage === 'zh' ? '检查指定线程是否有等待人工反馈的任务' : 'Check if a thread has a pending human feedback task',
          response: `{
  "code": 200,
  "data": {
    "isAwaitingFeedback": true,
    "threadId": "string"
  }
}`
        },
        {
          method: 'GET',
          endpoint: '/chat/human-feedback/pending/{threadId}',
          title: currentLanguage === 'zh' ? '获取待反馈任务' : 'Get Pending Task',
          description: currentLanguage === 'zh' ? '获取等待人工反馈的任务详情' : 'Get details of the pending human feedback task',
          response: `{
  "code": 200,
  "data": {
    "taskId": "string",
    "threadId": "string",
    "question": "string",
    "options": ["string"],
    "createTime": "string"
  }
}`
        },
        {
          method: 'POST',
          endpoint: '/chat/human-feedback/submit',
          title: currentLanguage === 'zh' ? '提交人工反馈' : 'Submit Feedback',
          description: currentLanguage === 'zh' ? '提交人工反馈结果，继续 AI 工作流' : 'Submit human feedback to resume the AI workflow',
          request: `{
  "taskId": "string",
  "threadId": "string",
  "feedback": "string"  // 用户选择或输入的反馈内容
}`,
          response: `{
  "code": 200,
  "data": "submitted"
}`
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
          description: currentLanguage === 'zh' ? '获取所有可用的 VIP 订阅套餐' : 'Get available VIP subscription plans',
          response: `{
  "code": 200,
  "msg": "操作成功",
  "data": [
    {
      "id": 1,
      "name": "VIP套餐",
      "price": 99
    }
  ]
}`
        },
        {
          method: 'POST',
          endpoint: '/web/pay/wechat/create',
          title: currentLanguage === 'zh' ? '创建微信支付订单' : 'Create WeChat Order',
          description: currentLanguage === 'zh' ? '创建微信支付订单，返回支付二维码等信息' : 'Create a WeChat pay order, returns QR code info',
          request: `{
  "planId": 1
}`,
          response: `{
  "code": 200,
  "msg": "操作成功",
  "data": {
    "orderNo": "P20260401123456",
    "qrCodeUrl": "weixin://wxpay/bizpayurl?pr=xxxxxx"
  }
}`
        },
        {
          method: 'POST',
          endpoint: '/web/pay/wechat/continue',
          title: currentLanguage === 'zh' ? '继续支付' : 'Continue Payment',
          description: currentLanguage === 'zh' ? '继续未完成的微信支付订单' : 'Continue an unfinished WeChat pay order',
          request: `{
  "orderNo": "P20260401123456"
}`,
          response: `{
  "code": 200,
  "msg": "操作成功",
  "data": {
    "orderNo": "P20260401123456",
    "qrCodeUrl": "weixin://wxpay/bizpayurl?pr=xxxxxx"
  }
}`
        },
        {
          method: 'GET',
          endpoint: '/web/pay/order/detail/{orderNo}',
          title: currentLanguage === 'zh' ? '订单详情' : 'Order Detail',
          description: currentLanguage === 'zh' ? '根据订单号查询订单详情' : 'Query order details by order number',
          response: `{
  "code": 200,
  "msg": "操作成功",
  "data": {
    "orderNo": "P20260401123456",
    "orderName": "VIP套餐",
    "amount": 99,
    "paymentStatus": 0,
    "status": 0,
    "payMethod": "wxpay",
    "createTime": "2026-04-01 10:00:00",
    "payTime": null
  }
}`
        },
        {
          method: 'GET',
          endpoint: '/web/pay/order/list',
          title: currentLanguage === 'zh' ? '我的订单' : 'My Orders',
          description: currentLanguage === 'zh' ? '分页获取当前用户的订单列表' : 'Paginated list of current user orders',
          params: [
            { name: 'pageNum', type: 'number', description: currentLanguage === 'zh' ? '页码' : 'Page number' },
            { name: 'pageSize', type: 'number', description: currentLanguage === 'zh' ? '每页数量' : 'Page size' }
          ],
          response: `{
  "code": 200,
  "msg": "操作成功",
  "rows": [
    {
      "id": "1001",
      "orderNo": "P20260401123456",
      "orderName": "VIP套餐",
      "amount": 99,
      "status": 0,
      "payMethod": "wxpay",
      "createTime": "2026-04-01 10:00:00",
      "payTime": null
    }
  ],
  "total": 1
}`
        },
        {
          method: 'GET',
          endpoint: '/web/pay/me/balance-plan',
          title: currentLanguage === 'zh' ? '余额与套餐' : 'Balance & Plan',
          description: currentLanguage === 'zh' ? '查询当前用户的余额和订阅套餐信息' : 'Get current user balance and subscription plan',
          response: `{
  "code": 200,
  "msg": "操作成功",
  "data": {
    "userBalance": 0,
    "userPlan": "free"
  }
}`
        }
      ]
    },
    {
      title: currentLanguage === 'zh' ? 'Agent' : 'Agent',
      endpoints: [
        {
          method: 'GET',
          endpoint: '/web/agent/my',
          title: currentLanguage === 'zh' ? '我的 Agent 列表' : 'My Agent List',
          description: currentLanguage === 'zh' ? '获取当前登录用户创建的 Agent 列表' : 'Get the current user created Agent list',
          response: `{
  "code": 200,
  "msg": "操作成功",
  "data": {
    "rows": [
      {
        "id": 1001,
        "name": "智能客服助手",
        "description": "负责售前咨询与问题分流",
        "nameEn": "customer-support-assistant",
        "descriptionEn": "Handle presales consultation and triage",
        "systemPromote": "你是专业的客服助手，请先识别用户意图，再给出简洁准确的回答。",
        "categoryId": 1,
        "status": 1,
        "isFeatured": 0,
        "usageCount": 23,
        "creatorName": "当前用户",
        "createTime": "2026-04-01 10:00:00"
      }
    ],
    "total": 1
  }
}`
        },
        {
          method: 'POST',
          endpoint: '/web/agent/create',
          title: currentLanguage === 'zh' ? '创建 Agent' : 'Create Agent',
          description: currentLanguage === 'zh' ? '创建一个新的 Agent（用于设置页 Agent 管理）' : 'Create a new Agent (for Settings Agent management)',
          request: `{
  "name": "智能客服助手",
  "description": "负责售前咨询与问题分流",
  "systemRole": "负责售前咨询与问题分流",
  "systemPrompt": "你是专业的客服助手，请先识别用户意图，再给出简洁准确的回答。",
  "categoryId": 1,
  "nameEn": "customer-support-assistant",
  "descriptionEn": "Handle presales consultation and triage"
}`,
          response: `{
  "code": 200,
  "msg": "操作成功",
  "data": null
}`
        },
        {
          method: 'PUT',
          endpoint: '/web/agent/update/{id}',
          title: currentLanguage === 'zh' ? '更新 Agent' : 'Update Agent',
          description: currentLanguage === 'zh' ? '更新指定 Agent 配置' : 'Update the specified Agent configuration',
          request: `{
  "id": 1001,
  "name": "智能客服助手",
  "description": "负责售前咨询与问题分流",
  "systemRole": "负责售前咨询与问题分流",
  "systemPrompt": "你是专业的客服助手，请先识别用户意图，再给出简洁准确的回答。",
  "categoryId": 1,
  "nameEn": "customer-support-assistant",
  "descriptionEn": "Handle presales consultation and triage"
}`,
          response: `{
  "code": 200,
  "msg": "操作成功",
  "data": null
}`
        },
        {
          method: 'DELETE',
          endpoint: '/web/agent/my/{id}',
          title: currentLanguage === 'zh' ? '删除我的 Agent' : 'Delete My Agent',
          description: currentLanguage === 'zh' ? '删除当前用户创建的 Agent' : 'Delete an Agent created by current user',
          response: `{
  "code": 200,
  "msg": "操作成功",
  "data": null
}`
        },
        {
          method: 'GET',
          endpoint: '/web/agent/categories',
          title: currentLanguage === 'zh' ? 'Agent 分类' : 'Agent Categories',
          description: currentLanguage === 'zh' ? '获取 Agent 分类列表' : 'Get Agent category list',
          response: `{
  "code": 200,
  "msg": "操作成功",
  "data": {
    "categories": [
      {
        "createDept": null,
        "createBy": null,
        "createTime": null,
        "updateBy": null,
        "updateTime": null,
        "id": 13,
        "name": "编程",
        "nameEn": "programming",
        "sortOrder": null,
        "status": 1,
        "agentCount": 106
      }
    ],
    "total": 14
  }
}`
        },
        {
          method: 'GET',
          endpoint: '/web/agent/list',
          title: currentLanguage === 'zh' ? 'Agent 列表' : 'Agent List',
          description: currentLanguage === 'zh' ? '分页获取 Agent 列表，可按分类过滤' : 'Paginated Agent list, filterable by category',
          params: [
            { name: 'pageNum', type: 'number', description: currentLanguage === 'zh' ? '页码' : 'Page number' },
            { name: 'pageSize', type: 'number', description: currentLanguage === 'zh' ? '每页数量' : 'Page size' },
            { name: 'categoryId', type: 'number', description: currentLanguage === 'zh' ? '分类ID（可选）' : 'Category ID (optional)' },
            { name: 'status', type: 'number', description: currentLanguage === 'zh' ? '状态，默认 1' : 'Status, default 1' }
          ],
          response: `{
  "code": 200,
  "msg": "操作成功",
  "data": {
    "rows": [
      {
        "id": 101,
        "name": "前端开发助手",
        "description": "回答前端工程问题并给出代码建议",
        "nameEn": "frontend-assistant",
        "descriptionEn": "Help with frontend engineering",
        "systemPromote": "你是高级前端开发助手，输出准确、可执行的方案。",
        "categoryId": 13,
        "status": 1,
        "isFeatured": 0,
        "usageCount": 256,
        "creatorName": "admin",
        "createTime": "2026-04-01 10:00:00"
      }
    ],
    "total": 1
  }
}`
        },
        {
          method: 'GET',
          endpoint: '/web/agent/detail/{id}',
          title: currentLanguage === 'zh' ? 'Agent 详情' : 'Agent Detail',
          description: currentLanguage === 'zh' ? '获取指定 Agent 的详细信息' : 'Get details of a specific Agent',
          response: `{
  "code": 200,
  "msg": "操作成功",
  "data": {
    "id": 101,
    "name": "前端开发助手",
    "description": "回答前端工程问题并给出代码建议",
    "nameEn": "frontend-assistant",
    "descriptionEn": "Help with frontend engineering",
    "systemPromote": "你是高级前端开发助手，输出准确、可执行的方案。",
    "categoryId": 13,
    "categoryName": "编程",
    "status": 1,
    "isFeatured": 0,
    "usageCount": 256,
    "creatorId": 10001,
    "creatorName": "admin",
    "createTime": "2026-04-01 10:00:00",
    "updateTime": "2026-04-01 10:00:00"
  }
}`
        },
        {
          method: 'GET',
          endpoint: '/web/agent/search',
          title: currentLanguage === 'zh' ? '搜索 Agent' : 'Search Agents',
          description: currentLanguage === 'zh' ? '按关键词搜索 Agent' : 'Search Agents by keyword',
          params: [
            { name: 'key', type: 'string', description: currentLanguage === 'zh' ? '搜索关键词' : 'Search keyword' },
            { name: 'pageNum', type: 'number', description: currentLanguage === 'zh' ? '页码（默认 1）' : 'Page number (default 1)' },
            { name: 'pageSize', type: 'number', description: currentLanguage === 'zh' ? '每页数量（默认 20）' : 'Page size (default 20)' },
            { name: 'categoryId', type: 'number', description: currentLanguage === 'zh' ? '分类ID（可选）' : 'Category ID (optional)' }
          ],
          response: `{
  "code": 200,
  "msg": "操作成功",
  "data": {
    "rows": [
      {
        "id": 101,
        "name": "前端开发助手",
        "description": "回答前端工程问题并给出代码建议",
        "nameEn": "frontend-assistant",
        "descriptionEn": "Help with frontend engineering",
        "systemPromote": "你是高级前端开发助手，输出准确、可执行的方案。",
        "categoryId": 13,
        "status": 1,
        "isFeatured": 0,
        "usageCount": 256,
        "creatorName": "admin",
        "createTime": "2026-04-01 10:00:00"
      }
    ],
    "total": 1
  }
}`
        },
        {
          method: 'GET',
          endpoint: '/web/agent/featured',
          title: currentLanguage === 'zh' ? '精选 Agent' : 'Featured Agents',
          description: currentLanguage === 'zh' ? '获取精选推荐的 Agent 列表' : 'Get featured/recommended Agents',
          params: [
            { name: 'pageNum', type: 'number', description: currentLanguage === 'zh' ? '页码（默认 1）' : 'Page number (default 1)' },
            { name: 'pageSize', type: 'number', description: currentLanguage === 'zh' ? '每页数量（默认 20）' : 'Page size (default 20)' }
          ],
          response: `{
  "code": 200,
  "msg": "操作成功",
  "data": {
    "rows": [
      {
        "id": 101,
        "name": "前端开发助手",
        "description": "回答前端工程问题并给出代码建议",
        "isFeatured": 1,
        "categoryId": 13,
        "usageCount": 256
      }
    ],
    "total": 1
  }
}`
        },
        {
          method: 'GET',
          endpoint: '/web/agent/recent',
          title: currentLanguage === 'zh' ? '最近发布' : 'Recent Agents',
          description: currentLanguage === 'zh' ? '获取最近发布的 Agent 列表' : 'Get recently published Agents',
          params: [
            { name: 'pageNum', type: 'number', description: currentLanguage === 'zh' ? '页码（默认 1）' : 'Page number (default 1)' },
            { name: 'pageSize', type: 'number', description: currentLanguage === 'zh' ? '每页数量（默认 10）' : 'Page size (default 10)' }
          ],
          response: `{
  "code": 200,
  "msg": "操作成功",
  "data": {
    "rows": [
      {
        "id": 101,
        "name": "前端开发助手",
        "description": "回答前端工程问题并给出代码建议",
        "categoryId": 13,
        "createTime": "2026-04-01 10:00:00"
      }
    ],
    "total": 1
  }
}`
        },
        {
          method: 'GET',
          endpoint: '/web/agent/category/{categoryId}',
          title: currentLanguage === 'zh' ? '按分类获取 Agent' : 'Agents by Category',
          description: currentLanguage === 'zh' ? '获取指定分类下的 Agent 列表' : 'Get Agents under a specific category',
          params: [
            { name: 'categoryId', type: 'number', description: currentLanguage === 'zh' ? '路径参数：分类ID' : 'Path param: category ID' },
            { name: 'pageNum', type: 'number', description: currentLanguage === 'zh' ? '页码（默认 1）' : 'Page number (default 1)' },
            { name: 'pageSize', type: 'number', description: currentLanguage === 'zh' ? '每页数量（默认 20）' : 'Page size (default 20)' }
          ],
          response: `{
  "code": 200,
  "msg": "操作成功",
  "data": {
    "rows": [
      {
        "id": 101,
        "name": "前端开发助手",
        "description": "回答前端工程问题并给出代码建议",
        "categoryId": 13,
        "status": 1
      }
    ],
    "total": 1
  }
}`
        },
        {
          method: 'GET',
          endpoint: '/web/agent/activity/{id}',
          title: currentLanguage === 'zh' ? '记录使用活动' : 'Track Activity',
          description: currentLanguage === 'zh' ? '记录 Agent 使用活动（用于统计）' : 'Record Agent usage activity (for analytics)',
          params: [
            { name: 'id', type: 'string', description: currentLanguage === 'zh' ? '路径参数：Agent ID' : 'Path param: Agent ID' }
          ],
          response: `{
  "code": 200,
  "msg": "操作成功",
  "data": null
}`
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
        
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-6 border border-gray-700 space-y-4">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="space-y-3 flex-1">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                  {currentLanguage === 'zh' ? 'Base URL' : 'Base URL'}
                </p>
                <code className="text-green-400 bg-black/40 px-3 py-1.5 rounded-lg text-sm font-mono select-all">
                  https://www.mcp-x.com/prod-api
                </code>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                  {currentLanguage === 'zh' ? '认证方式' : 'Authentication'}
                </p>
                <code className="text-orange-400 bg-black/40 px-3 py-1.5 rounded-lg text-sm font-mono">
                  Authorization: Bearer {'{token}'}
                </code>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                  {currentLanguage === 'zh' ? '完整请求示例' : 'Full Request Example'}
                </p>
                <code className="text-gray-300 bg-black/40 px-3 py-1.5 rounded-lg text-sm font-mono">
                  POST https://www.mcp-x.com/prod-api/ai/video/generate
                </code>
              </div>
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
          {'description' in group && group.description && (
            <p className="text-gray-400 text-sm leading-relaxed">{group.description}</p>
          )}

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
