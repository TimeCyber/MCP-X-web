# MCP-X Agent Development Platform

MCP-X is an **enterprise-grade AI agent development platform** that integrates AI conversation, video generation, image editing, frontend application building, and other creative tools, providing a one-stop AI workflow solution for enterprises and developers.

---

## 🔥 Limited Time Offer: Join Group for 100 RMB Worth of AI Tokens!

💰 **GitHub Users Exclusive**: Scan the QR code below to join our WeChat group and get **100 RMB equivalent** AI image/video generation tokens for FREE!

🎨 **Benefits Include**:
- 🎬 **Video Generation Tokens**: Support for HD video creation
- 🖼️ **Image Generation Tokens**: Professional AI art services
- ⚡ **Instant Credit**: Tokens credited immediately after joining the group

<div align="center">
  <img src="./public/images/wechat-group-qrcode.jpg" alt="WeChat Group" width="300"/>
  <p><strong>👆 Scan to join and claim your 100 RMB token bonus!</strong></p>
</div>

---

## 📸 Screenshots

### Unified Portal
![Unified Portal](./public/images/screenshot-2.png)

### Featured Content
![Featured Content](./public/images/screenshot-1.png)

### Image Creation Center
![Image Creation Center](./public/images/screenshot-3.png)

### Video Creation Center
![Video Creation Center](./public/images/screenshot-4.png)

---

## 🏢 Enterprise Platform Features

### 🔐 Security & Reliability
- **Token Authentication**: Comprehensive user authentication and permission management
- **Multi-tenancy Support**: Enterprise-grade multi-tenant architecture
- **Data Isolation**: Secure user data isolation to protect enterprise privacy

### ⚡ High-Performance Architecture
- **Streaming Response**: SSE real-time streaming output with millisecond-level response
- **Local Caching**: IndexedDB local storage to reduce server pressure
- **Asynchronous Processing**: Long-running tasks execute asynchronously without blocking user operations

### 🔌 Open Integration
- **MCP Protocol Support**: Full support for Model Context Protocol, extensible with any tools
- **Multi-Model Integration**: Unified interface for GPT, Gemini, DeepSeek, Kimi, and other mainstream models
- **Standardized API**: RESTful API design for easy secondary development and system integration

### 📊 Enterprise Functions
- **Knowledge Base Management**: Private enterprise knowledge base with document upload and intelligent retrieval
- **Workflow Orchestration**: Visual Agent workflow with human approval support
- **Usage Billing**: Comprehensive package and billing system supporting enterprise procurement

### 🌐 Internationalization
- **Multi-language Interface**: Chinese and English bilingual support
- **Localized Deployment**: Support for private deployment to meet data compliance requirements

---

## 🎨 Latest Updates

### v0.1.3 App Builder & Preview
- **HTTPS preview via reverse proxy**: Parse SSE message `预览路径: /vite/{port}` and open preview at `current origin + path` (same protocol as the page) to avoid mixed content; persisted key `dev_path_{appId}`
- **Cross-origin dev iframe editing**: For React/Vite dev previews, inject editor via fetch + `srcdoc`; URL constructor shim for `about:srcdoc` to reduce react-router-dom errors
- **New app page**: Shows recent apps list at the bottom with links to the builder
- **Builder UX**: Chat input max 8000 chars; loading older history keeps scroll position; source tab supports inline edit and send to AI

### v0.1.1 New Features
- **🎬 Graphics Workbench Reference Video Generation**: Support @ symbol to reference images on canvas for video generation, currently only supports Alibaba Qwen model
- **✨ Comprehensive UI Optimization**: Enhanced user experience with optimized visual design and interaction flow

---

## 🌟 Core Features

### 1. MCP-X Video Studio (AI Video Studio)
Supports mainstream Chinese models: Qwen, Jimeng, Kling, Hailuo, etc., and international models: Veo3, Runway, etc.
Complete AI-driven video production workflow system supporting the entire process from script to finished product:
- **Script Parsing**: AI automatically analyzes scripts, extracting characters, scenes, and story segments
- **Storyboard Generation**: Intelligently generates professional shot lists including camera movements, shot sizes, and keyframes
- **Character Design**: AI generates character visual designs
- **Scene Concept Art**: Automatically generates scene visual designs
- **Video Generation**: Supports text-to-video, image-to-video, and keyframe interpolation modes
- **One-Click Export**: Browser-based one-click video clip export
- **Asset Library Management**: Local IndexedDB storage supporting character/scene/video asset reuse

### 2. AI Conversation System
Supports mainstream Chinese models: Deepseek, Qwen, KIMI, etc., and international models: OpenAI, etc.
- **Multi-Model Support**: Integrates GPT, Gemini, DeepSeek, Kimi, and other large language models
- **Streaming Response**: SSE real-time streaming output
- **MCP Tool Integration**: Supports Model Context Protocol tool invocation
- **Web Search**: Integrated web search functionality with result display
- **Human Intervention**: Agent workflow supports human confirmation and intervention
- **File Upload**: Supports conversations with file attachments

### 3. Frontend Application Builder (App Builder)
AI frontend building experience similar to Bolt/Loveable:
- **Conversational Development**: Describe requirements in natural language, AI generates code in real-time
- **Multi-Framework Support**: HTML, React, Vue, static websites
- **Real-Time Preview**: Instant preview; production can proxy dev server at `/vite/{port}` so the UI builds same-origin HTTPS URLs from SSE “preview path”
- **Visual Editing**: Click elements to refine (with cross-origin dev iframe injection when needed)
- **One-Click Deployment**: Cloud deployment support
- **Code Download**: Complete code package download

### 4. AI Image Editor
Supports mainstream Chinese models: Qwen, Seed, etc., and international models: Nano Banana.
- **Text-to-Image**: Generate images from text descriptions
- **Image-to-Image**: Generate new images based on reference images
- **Local Editing**: Mask support for local area editing
- **Multi-Model Selection**: Support for various image generation models
- **Image-to-Video**: Generate dynamic videos from images with multiple resolution and duration options
- **Reference Video Generation**: Support @ symbol to reference images on canvas for video generation, currently only supports Alibaba Qwen model

### 5. MCP Service Marketplace
- **Service Discovery**: Browse and search MCP services
- **Category Management**: Service directory organized by function
- **One-Click Configuration**: Quick configuration and activation of MCP services
- **Tool Detection**: Automatically detect tool lists provided by services

---

## 💎 Platform Highlights

| Feature | Description |
|---------|-------------|
| 🎬 **Full Video Production** | From script to finished product, AI assists throughout, supporting promotional videos, short videos, and drama films |
| 🔧 **MCP Marketplace** | MCP tool collection and aggregation, with thousands of MCP tools integrated, expanding AI capability boundaries |
| 🔧 **Agent Marketplace** | Agent collection and aggregation, with 500+ common agents integrated for vertical agent conversations |
| 💻 **AI Code Generation** | Conversational frontend development with real-time preview, supporting React/Vue/HTML frameworks |
| 🖼️ **Professional Image Processing** | Text-to-image, image-to-image, local editing, @ symbol reference video generation, multiple models available for various creative needs |
| 📚 **Enterprise Knowledge Base** | Private knowledge base management, intelligent document parsing, RAG-enhanced retrieval support |
| 💰 **Membership Billing** | Pay-as-you-go + subscription packages, supporting membership billing and WeChat recharge |
| 🌍 **Multi-Language Support** | Chinese and English bilingual interface, AI output supports multiple languages |

---

## 📋 Complete Feature List

### User System
- User registration/login (email verification code)
- GitHub OAuth login
- Token authentication management
- User settings

### AI Conversation
- Multi-model conversation
- Session management (create/delete/history)
- Streaming response
- File upload conversation
- Web search result display
- Agent workflow human intervention

### MCP Services
- MCP service list/details
- Service category browsing
- Service search
- User MCP configuration management
- Tool detection and execution

### Agent Marketplace
- Agent category list
- Agent detail view
- Agent search
- Featured/Latest agents

### Video Studio
- Project management (create/delete/save)
- Script parsing (AI analysis)
- Storyboard list generation
- Character design generation
- Scene concept art generation
- Keyframe image generation
- Video generation (text-to-video/image-to-video/keyframe)
- Video model selection
- Video resolution/aspect ratio selection
- Audio upload (local/URL)
- Video merge and export
- Asset library management

### Image Editing
- Text-to-image
- Image-to-image
- Mask editing
- Multi-model selection
- Image size settings
- Image-to-video
- @ Symbol reference video generation (Alibaba Qwen model)

### Application Building
- Create application
- Conversational code generation
- Real-time preview
- Application deployment
- Code download
- Application management

### Knowledge Base
- Knowledge base create/edit/delete
- Attachment upload
- Knowledge fragment management
- File translation

### Payment System
- VIP packages
- WeChat payment
- Order management
- Balance inquiry

### Other Features
- Multi-language support (Chinese/English)
- Feedback submission
- Contact us

## 🛠 Tech Stack

- **Frontend Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **UI Framework**: Tailwind CSS + Ant Design
- **State Management**: Zustand + React Context
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **Markdown Rendering**: react-markdown + remark-gfm
- **Animation**: Framer Motion
- **Icons**: Lucide React
- **Local Storage**: IndexedDB
- **Video Processing**: FFmpeg.wasm
- **File Compression**: JSZip

## 🚀 Quick Start

### Requirements
- Node.js 18+
- npm or yarn

### Install Dependencies
```bash
npm install
```

### Development Mode
```bash
npm run dev
```

### Production Build
```bash
npm run build
```

### Preview Build
```bash
npm run preview
```

## 📁 Project Structure

```
src/
├── assets/          # Static resources
├── components/      # Components
│   ├── app/         # Application building components
│   ├── chat/        # Chat components
│   ├── image-editor/# Image editing components
│   ├── layout/      # Layout components
│   ├── ui/          # Common UI components
│   ├── video-gen/   # Video generation components
│   └── workflow/    # Workflow components
├── config/          # Configuration files
├── contexts/        # React Context
├── data/            # Static data
├── hooks/           # Custom Hooks
├── i18n/            # Internationalization
├── pages/           # Page components
├── services/        # API services
├── styles/          # Style files
├── types/           # TypeScript type definitions
└── utils/           # Utility functions
```

## 🔧 Configuration

### Link Configuration
Modify link addresses in the `src/config/index.ts` file:

```typescript
// Modify API base URL
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.PROD ? 'https://www.mcp-x.com/prod-api' : 'https://www.mcp-x.com/prod-api');

// Modify static resource base URL
const staticBaseUrl = import.meta.env.VITE_STATIC_BASE_URL ||
  (import.meta.env.PROD ? '/prod-api/static' : '/static');
```

### MCP Configuration
MCP service configuration supports multiple transport methods:
- stdio (command line)
- SSE (Server-Sent Events)
- WebSocket

## 📖 Related Documentation

- [Video Generation API Documentation](./VIDEO_GENERATION_API.md)
- [MCP-X Video Studio Integration Guide](./CINEGEN_INTEGRATION.md)
- [Frontend Building Feature Guide](./APP_BUILD_FEATURE.md)
- [Asset Library Feature Guide](./ASSET_LIBRARY_FEATURE.md)
- [Human Intervention Integration Guide](./HUMAN_FEEDBACK_INTEGRATION.md)

## 📄 License

This project is licensed under **Apache License 2.0** with additional commercial use terms:

- ✅ Free for individual users
- ✅ Free for educational institutions
- ✅ Free for non-profit organizations
- ✅ Free for companies with fewer than 20 employees
- ⚠️ **Companies with 20 or more employees require commercial authorization**

### Commercial Authorization

If your company/organization has 20 or more employees and wishes to use this software for commercial purposes, please contact us for commercial authorization:

📧 **Commercial Authorization Inquiry**: ganyizhi@timecyber.com.cn

For detailed terms, please refer to the [LICENSE](./LICENSE) file.

## 🤝 Contact Us

For questions or suggestions, please contact us through:
- Submit an Issue
- Email: ganyizhi@timecyber.com.cn
- Join WeChat Group:

<div align="center">
  <img src="./public/images/wechat-group-qrcode.jpg" alt="WeChat Group" width="300"/>
  <p>Scan to join MCP-X Technical Exchange Group</p>
</div>

---

## 🚀 Backend Open Source Plan

**Backend Code Status**: Currently being organized, expected to be open-sourced soon

**Open Source Conditions**: This project reaches **1000 stars** ⭐ on GitHub, and over 300 real developers join the enterprise WeChat group, the backend code will be open-sourced simultaneously

**Backend Tech Stack**:
- Spring Boot 3.x
- MySQL 8.0
- Redis
- Docker & Kubernetes
- AI Model Integration (Alibaba Qwen, Jimeng, etc.)

**Support Us**:
- ⭐ Give us a star on GitHub
- 🔄 Share the project to tech communities
- 💬 Participate in discussions and contribute code

**Goal**: 1000 ⭐ = Complete Open Source! We look forward to your support! 🎉

---

## 📜 Intellectual Property Declaration

⚠️ **Important Notice**: This project has been registered for software copyright with relevant authorities, MCP-X is a registered trademark, please respect intellectual property rights.

**Copyright Declaration**:
- This project adopts Apache License 2.0 open source protocol
- All trademarks and copyrights are reserved
- Commercial use requires authorization

**Trademark Protection**:
- MCP-X is a registered trademark
- Unauthorized commercial use is prohibited, legal action will be taken
- Respect intellectual property rights and jointly maintain the open source ecosystem
