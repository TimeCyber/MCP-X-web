# MCP-X 项目功能展示视频

基于 Remotion 创建的 MCP-X 企业级AI智能体开发平台功能展示视频。

## 视频总览

- **总时长**: 180秒 (3分钟)
- **分辨率**: 1920x1080 (Full HD)
- **帧率**: 30fps
- **包含口播**: 完整的中文字幕和配音脚本

### 时间轴详解

1. **0-15秒**: 开场震撼
   - MCP-X Logo发光动画
   - 平台标语展示
   - 功能预览标签

2. **15-45秒**: 核心功能总览
   - 视频工作室 (MCP-X Video Studio)
   - AI对话系统
   - 智能图像编辑器
   - 应用构建器
   - MCP服务市场

3. **45-75秒**: 视频工作室深度演示
   - 剧本解析工作流
   - 分镜生成
   - 角色定妆照
   - 场景概念图
   - 视频生成模式
   - 一键导出

4. **75-105秒**: AI对话系统演示
   - 多模型支持
   - 流式响应
   - MCP工具集成
   - 实时对话界面

5. **105-135秒**: 图像编辑器演示
   - 文生图、图生图
   - 局部蒙版编辑
   - 图生视频功能
   - @符号参考生成

6. **135-165秒**: 应用构建器演示
   - 对话式开发
   - 实时预览
   - 多框架支持
   - 一键部署

7. **165-180秒**: MCP服务市场演示
   - 1000+工具集成
   - 服务分类展示
   - 扩展能力演示

8. **180秒后**: 技术亮点与结尾
   - 企业级架构特色
   - 技术指标展示
   - 社区号召

## 技术特色

### Remotion 编程视频
- **声明式动画**: 使用React组件构建视频
- **精确时间控制**: 帧级动画控制
- **动态内容**: 基于实际项目截图
- **可重用组件**: 模块化场景设计

### 视觉设计
- **深色科技风格**: 符合AI产品定位
- **渐变色彩**: MCP-X品牌色系
- **流畅过渡**: 专业动画效果
- **信息层次**: 清晰的功能展示

### 音频系统
- **分段配音**: 每个功能独立音频
- **背景音乐**: 科技感电子乐
- **字幕同步**: 中文字幕显示
- **专业配音**: 标准普通话

## 快速开始

### 环境要求
- Node.js 18+
- npm 或 yarn

### 安装依赖
```bash
npm install
```

### 开发预览
```bash
npm run dev
```
访问 http://localhost:3000 预览视频

### 导出视频
```bash
npm run build
```
输出文件位于 `out/mcp-x-showcase.mp4`

## 项目结构

```
mcp-x-showcase-video/
├── src/
│   ├── Root.tsx                 # Remotion根组件
│   ├── MCPXShowcase.tsx         # 主视频组件
│   └── scenes/                  # 各场景组件
│       ├── OpeningScene.tsx     # 开场场景
│       ├── FeatureOverview.tsx  # 功能总览
│       ├── VideoStudioDemo.tsx  # 视频工作室演示
│       ├── ChatAIDemo.tsx       # AI对话演示
│       ├── ImageEditorDemo.tsx  # 图像编辑演示
│       ├── AppBuilderDemo.tsx   # 应用构建演示
│       ├── MCPServicesDemo.tsx  # MCP服务演示
│       ├── TechnicalHighlights.tsx # 技术亮点
│       └── ClosingScene.tsx     # 结尾场景
├── public/
│   ├── images/                  # 项目截图资源
│   └── audio/                   # 音频资源目录
├── out/                         # 输出目录
├── package.json
├── tsconfig.json
├── remotion.config.ts
└── README.md
```

## 音频资源准备

详细的音频资源要求请查看 `public/audio/README.md`

### 必需音频文件
- 开场配音 (narrator-opening.mp3)
- 各功能介绍音频 (feature-1.mp3 ~ feature-5.mp3)
- 演示场景配音
- 背景音乐 (background-music.mp3)

## 自定义修改

### 修改视频时长
```typescript
// src/Root.tsx
durationInFrames: 180 * 30, // 修改总帧数
```

### 调整场景时间
```typescript
// src/MCPXShowcase.tsx
const openingEnd = 15 * fps;    // 开场结束时间
const overviewEnd = 45 * fps;   // 总览结束时间
// ... 其他时间节点
```

### 更新功能介绍
```typescript
// 修改功能描述
const FEATURES = [
  {
    title: '新的功能名称',
    description: '新的功能描述',
    // ...
  }
];
```

### 替换截图资源
将新的项目截图放置在 `public/images/` 目录中，并更新组件中的引用。

## 性能优化

- **组件拆分**: 每个场景独立组件
- **资源预加载**: 图片和音频预加载
- **动画优化**: 使用transform和opacity属性
- **内存管理**: 避免不必要的重新渲染

## 部署和分发

### 本地导出
```bash
npm run build
# 输出: out/mcp-x-showcase.mp4
```

### 云端渲染
支持 Remotion Cloud 或自托管渲染服务

### 多种格式
- MP4 (H.264) - 通用兼容
- WebM (VP9) - 更小文件
- GIF - 短片段分享

## 许可证

本项目基于 MCP-X 开源协议。

## 技术支持

如有问题或需要定制，请联系：
- 项目地址: https://github.com/your-repo/mcp-x
- 技术支持: support@mcp-x.com