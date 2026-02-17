# MCP-X Agent Development Platform

MCP-X 是一个**企业级 AI 智能体开发平台**，集成了 AI 对话、视频生成、图像编辑、前端应用构建等多种创作工具，为企业和开发者提供一站式的 AI 工作流解决方案。

---

## 🔥 限时福利：加群享100元生图生视频Token！

💰 **GitHub用户专属福利**：扫描下方二维码加入微信群，即可免费领取 **100元等值** 的AI生图生视频Token！

🎨 **包含权益**：
- 🎬 **视频生成Token**：支持高清视频创作
- 🖼️ **图像生成Token**：专业级AI绘画服务
- ⚡ **立即到账**：扫码进群后工作人员立即发放

<div align="center">
  <img src="./public/images/wechat-group-qrcode.jpg" alt="微信交流群" width="300"/>
  <p><strong>👆 扫码加入领取100元Token福利！</strong></p>
</div>

---

## 📸 功能截图

### 统一入口
![统一入口](./public/images/screenshot-2.png)

### 内容精选
![内容精选](./public/images/screenshot-1.png)

### 图片创作中心
![图片创作中心](./public/images/screenshot-3.png)

### 视频创作中心
![视频创作中心](./public/images/screenshot-4.png)

---

## 🏢 企业级平台特色

### 🔐 安全可靠
- **Token 认证体系**：完善的用户认证和权限管理
- **多租户支持**：支持企业级多租户架构
- **数据隔离**：用户数据安全隔离，保护企业隐私

### ⚡ 高性能架构
- **流式响应**：SSE 实时流式输出，毫秒级响应体验
- **本地缓存**：IndexedDB 本地存储，减少服务器压力
- **异步处理**：长任务异步执行，不阻塞用户操作

### 🔌 开放集成
- **MCP 协议支持**：完整支持 Model Context Protocol，可扩展任意工具
- **多模型接入**：统一接口对接 GPT、Gemini、DeepSeek、Kimi 等主流模型
- **API 标准化**：RESTful API 设计，便于二次开发和系统集成

### 📊 企业级功能
- **知识库管理**：企业私有知识库，支持文档上传和智能检索
- **工作流编排**：可视化 Agent 工作流，支持人工介入审批
- **用量计费**：完善的套餐和计费系统，支持企业采购

### 🌐 国际化支持
- **多语言界面**：中英文双语支持
- **本地化部署**：支持私有化部署，满足数据合规要求

---

## 🎨 最新更新

### v1.1 新功能
- **🎬 图形工作台参考生视频**：支持@符号引用画布中的图片作为视频生成参考，目前仅支持阿里千问大模型
- **✨ 界面全面优化**：提升用户体验，优化视觉设计和交互流程

---

## 🌟 核心特色功能

### 1. MCP-X Video Studio（AI 视频工作室）
支持国内主流大模型：千问、即梦、可灵、海螺等，国外主流大模型：Veo3，Runway等。
完整的 AI 驱动视频制作工作流系统，支持从剧本到成片的全流程：
- **剧本解析**：AI 自动分析剧本，提取角色、场景、故事段落
- **分镜生成**：智能生成专业分镜列表，包含镜头运动、景别、关键帧
- **角色定妆照**：AI 生成角色视觉形象
- **场景概念图**：自动生成场景视觉设计
- **视频生成**：支持文生视频、图生视频、首尾帧插值三种模式
- **视频一键导出**：浏览器端一键导出视频片段
- **资源库管理**：本地 IndexedDB 存储，支持角色/场景/视频资源复用

### 2. AI 对话系统
支持国内主流大模型：Deepseek、千问、KIMI等，国外主流大模型：OpenAI等。
- **多模型支持**：集成 GPT、Gemini、DeepSeek、Kimi 等多种大语言模型
- **流式响应**：SSE 实时流式输出
- **MCP 工具集成**：支持 Model Context Protocol 工具调用
- **网络搜索**：集成网络搜索功能，展示搜索结果
- **人工介入**：Agent 工作流支持人工确认和干预
- **文件上传**：支持带文件的对话

### 3. 前端应用构建（App Builder）
类似 Bolt/Loveable 的 AI 前端构建体验：
- **对话式开发**：通过自然语言描述需求，AI 实时生成代码
- **多框架支持**：HTML、React、Vue、静态网站
- **实时预览**：生成代码即时预览
- **可视化编辑**：点击页面元素精确修改
- **一键部署**：支持云端部署
- **代码下载**：完整代码包下载

### 4. AI 图像编辑器
支持国内主流大模型：千问、Seed等，国外主流大模型：Nano Banana。
- **文生图**：根据文字描述生成图像
- **图生图**：基于参考图像生成新图像
- **局部编辑**：蒙版支持局部区域编辑
- **多模型选择**：支持多种图像生成模型
- **图生视频**：基于图片生成动态视频，支持多种分辨率和时长设置
- **参考生视频**：支持 @ 符号引用画布中的图片作为视频生成参考，目前仅支持阿里千问大模型

### 5. MCP 服务市场
- **服务发现**：浏览和搜索 MCP 服务
- **分类管理**：按功能分类的服务目录
- **一键配置**：快速配置和启用 MCP 服务
- **工具探测**：自动探测服务提供的工具列表

---

## 💎 平台亮点

| 特性 | 说明 |
|------|------|
| 🎬 **全流程视频制作** | 从剧本到成片，AI 全程辅助，支持宣传片、短视频、剧情片多种类型 |
| 🔧 **MCP市场** | MCP工具收集汇总，已接入上千种MCP工具，扩展 AI 能力边界 |
| 🔧 **Agent市场** | Agent智能体收集汇总，已接入500多个常用智能体，垂直智能体对话使用 |
| 💻 **AI 代码生成** | 对话式前端开发，实时预览，支持 React/Vue/HTML 多框架 |
| 🖼️ **专业图像处理** | 文生图、图生图、局部编辑、@符号参考生视频，多模型可选，满足各类创意需求 |
| 📚 **企业知识库** | 私有知识库管理，文档智能解析，支持 RAG 增强检索 |
| 💰 **会员计费系统** | 按量计费 + 套餐订阅，支持会员计费，微信充值等 |
| 🌍 **多语言支持** | 中英文双语界面，AI 输出支持多语言 |

---

## 📋 全部功能列表

### 用户系统
- 用户注册/登录（邮箱验证码）
- GitHub OAuth 登录
- Token 认证管理
- 用户设置

### AI 对话
- 多模型对话
- 会话管理（创建/删除/历史记录）
- 流式响应
- 文件上传对话
- 网络搜索结果展示
- Agent 工作流人工介入

### MCP 服务
- MCP 服务列表/详情
- 服务分类浏览
- 服务搜索
- 用户 MCP 配置管理
- 工具探测和执行

### Agent 市场
- Agent 分类列表
- Agent 详情查看
- Agent 搜索
- 精选/最新 Agent

### 视频工作室
- 项目管理（创建/删除/保存）
- 剧本解析（AI 分析）
- 分镜列表生成
- 角色定妆照生成
- 场景概念图生成
- 关键帧图像生成
- 视频生成（文生视频/图生视频/首尾帧）
- 视频模型选择
- 视频分辨率/比例选择
- 音频上传（本地/URL）
- 视频合并导出
- 资源库管理

### 图像编辑
- 文生图
- 图生图
- 蒙版编辑
- 多模型选择
- 图片尺寸设置
- 图生视频
- @符号参考生视频（阿里千问大模型）

### 应用构建
- 创建应用
- 对话式代码生成
- 实时预览
- 应用部署
- 代码下载
- 应用管理

### 知识库
- 知识库创建/编辑/删除
- 附件上传
- 知识片段管理
- 文件翻译

### 支付系统
- VIP 套餐
- 微信支付
- 订单管理
- 余额查询

### 其他功能
- 多语言支持（中/英）
- 反馈提交
- 联系我们

## 🛠 技术栈

- **前端框架**：React 18 + TypeScript
- **构建工具**：Vite
- **UI 框架**：Tailwind CSS + Ant Design
- **状态管理**：Zustand + React Context
- **路由**：React Router v6
- **HTTP 客户端**：Axios
- **Markdown 渲染**：react-markdown + remark-gfm
- **动画**：Framer Motion
- **图标**：Lucide React
- **本地存储**：IndexedDB
- **视频处理**：FFmpeg.wasm
- **文件压缩**：JSZip

## 🚀 快速开始

### 环境要求
- Node.js 18+
- npm 或 yarn

### 安装依赖
```bash
npm install
```

### 开发模式
```bash
npm run dev
```

### 生产构建
```bash
npm run build
```

### 预览构建
```bash
npm run preview
```

## 📁 项目结构

```
src/
├── assets/          # 静态资源
├── components/      # 组件
│   ├── app/         # 应用构建组件
│   ├── chat/        # 聊天组件
│   ├── image-editor/# 图像编辑组件
│   ├── layout/      # 布局组件
│   ├── ui/          # 通用 UI 组件
│   ├── video-gen/   # 视频生成组件
│   └── workflow/    # 工作流组件
├── config/          # 配置文件
├── contexts/        # React Context
├── data/            # 静态数据
├── hooks/           # 自定义 Hooks
├── i18n/            # 国际化
├── pages/           # 页面组件
├── services/        # API 服务
├── styles/          # 样式文件
├── types/           # TypeScript 类型定义
└── utils/           # 工具函数
```

## 🔧 配置说明

### 链接地址配置
在 `src/config/index.ts` 文件中修改链接地址：

```typescript
// 修改API基础URL
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.PROD ? 'https://www.mcp-x.com/prod-api' : 'https://www.mcp-x.com/prod-api');

// 修改静态资源基础URL
const staticBaseUrl = import.meta.env.VITE_STATIC_BASE_URL ||
  (import.meta.env.PROD ? '/prod-api/static' : '/static');
```

### MCP 配置
MCP 服务配置支持多种传输方式：
- stdio（命令行）
- SSE（Server-Sent Events）
- WebSocket

## 📖 相关文档

- [视频生成 API 文档](./VIDEO_GENERATION_API.md)
- [MCP-X Video Studio 集成说明](./CINEGEN_INTEGRATION.md)
- [前端构建功能说明](./APP_BUILD_FEATURE.md)
- [资源库功能说明](./ASSET_LIBRARY_FEATURE.md)
- [人工介入功能说明](./HUMAN_FEEDBACK_INTEGRATION.md)

## 📄 许可证

本项目采用 **Apache License 2.0** 开源协议，附加商业使用条款：

- ✅ 个人用户免费使用
- ✅ 教育机构免费使用
- ✅ 非营利组织免费使用
- ✅ 20 人以下企业免费使用
- ⚠️ **20 人及以上企业商业使用需申请授权**

### 商业授权

如果您的公司/组织拥有 20 名或以上员工，并希望将本软件用于商业目的，请联系我们获取商业授权：

📧 **商业授权咨询**：ganyizhi@timecyber.com.cn

详细条款请查看 [LICENSE](./LICENSE) 文件。

## 🤝 联系我们

如有问题或建议，请通过以下方式联系：
- 提交 Issue
- 发送邮件至：ganyizhi@timecyber.com.cn
- 加入微信交流群：

<div align="center">
  <img src="./public/images/wechat-group-qrcode.jpg" alt="微信交流群" width="300"/>
  <p>扫码加入 MCP-X 技术交流群</p>
</div>

---

## 🚀 后端开源计划

**后端代码状态**: 正在整理中，预计近期开源

**开源条件**: 本项目在 GitHub 上达到 **1000 星标** ⭐ 后，将同步开源后端代码

**后端技术栈**:
- Spring Boot 3.x
- MySQL 8.0
- Redis
- Docker & Kubernetes
- AI 模型集成 (通义千问、即梦等)

**支持我们**:
- ⭐ 在 GitHub 给我们点亮 Star
- 🔄 分享项目到技术社区
- 💬 参与讨论和贡献代码

**目标**: 1000 ⭐ = 完整开源！期待您的支持！🎉
