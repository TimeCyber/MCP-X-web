import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Img,
  staticFile,
  Audio
} from 'remotion';

const FEATURES = [
  {
    title: 'MCP-X Video Studio',
    subtitle: 'AI视频工作室',
    description: '从剧本到成片，全流程AI辅助视频制作',
    icon: '🎬',
    color: '#ff6b35',
    image: 'screenshot-4.png',
    keyPoints: [
      '剧本AI解析',
      '智能分镜生成',
      '角色定妆照',
      '多模型视频生成'
    ]
  },
  {
    title: 'AI Chat System',
    subtitle: '智能对话系统',
    description: '多模型支持，工具集成，流式响应',
    icon: '💬',
    color: '#3b82f6',
    image: 'screenshot-1.png',
    keyPoints: [
      'GPT、DeepSeek等多模型',
      'MCP工具调用',
      '网络搜索集成',
      '人工介入工作流'
    ]
  },
  {
    title: 'AI Image Editor',
    subtitle: '智能图像编辑',
    description: '文生图、图生图、局部编辑、图生视频',
    icon: '🎨',
    color: '#8b5cf6',
    image: 'screenshot-3.png',
    keyPoints: [
      '多种AI模型支持',
      '蒙版局部编辑',
      '图生视频功能',
      '@符号参考生成'
    ]
  },
  {
    title: 'App Builder',
    subtitle: '应用构建器',
    description: '对话式前端开发，实时预览，一键部署',
    icon: '💻',
    color: '#10b981',
    image: 'screenshot-2.png',
    keyPoints: [
      '自然语言开发',
      'React/Vue多框架',
      '实时预览编辑',
      '云端部署'
    ]
  },
  {
    title: 'MCP Services',
    subtitle: 'MCP服务市场',
    description: '1000+工具集成，扩展AI能力边界',
    icon: '🔧',
    color: '#f59e0b',
    keyPoints: [
      '服务发现与搜索',
      '一键配置启用',
      '工具自动探测',
      '垂直领域扩展'
    ]
  }
];

export const FeatureOverview: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // 场景开始帧 (15秒后)
  const sceneStart = 15 * fps;
  const relativeFrame = frame - sceneStart;

  // 当前显示的功能索引
  const currentFeatureIndex = Math.min(
    Math.floor(relativeFrame / (6 * fps)), // 每个功能6秒
    FEATURES.length - 1
  );

  const currentFeature = FEATURES[currentFeatureIndex];
  const featureStartFrame = currentFeatureIndex * 6 * fps;

  // 功能切换动画
  const featureProgress = (relativeFrame - featureStartFrame) / (6 * fps);

  return (
    <AbsoluteFill
      style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
      }}
    >
      {/* 背景截图 */}
      <Img
        src={staticFile(`images/${currentFeature.image}`)}
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          opacity: 0.3,
        }}
      />

      {/* 主要内容区域 */}
      <div
        style={{
          position: 'absolute',
          left: '8%',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '45%',
          zIndex: 10,
        }}
      >
        {/* 功能标题 */}
        <div
          style={{
            marginBottom: '2rem',
            opacity: interpolate(featureProgress, [0, 0.3], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            }),
          }}
        >
          <div
            style={{
              fontSize: '20px',
              color: currentFeature.color,
              fontWeight: 'bold',
              marginBottom: '1rem',
              fontFamily: 'Arial, sans-serif',
            }}
          >
            {currentFeature.icon} {currentFeature.title}
          </div>
          <h2
            style={{
              fontSize: '48px',
              fontWeight: 'bold',
              color: '#ffffff',
              marginBottom: '1rem',
              fontFamily: 'Arial, sans-serif',
              lineHeight: '1.2',
            }}
          >
            {currentFeature.subtitle}
          </h2>
          <p
            style={{
              fontSize: '24px',
              color: '#cccccc',
              fontFamily: 'Arial, sans-serif',
              lineHeight: '1.4',
            }}
          >
            {currentFeature.description}
          </p>
        </div>

        {/* 关键功能点 */}
        <div style={{ marginBottom: '2rem' }}>
          {currentFeature.keyPoints.map((point, index) => (
            <div
              key={point}
              style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '1rem',
                opacity: interpolate(
                  featureProgress,
                  [0.3 + index * 0.1, 0.5 + index * 0.1],
                  [0, 1],
                  {
                    extrapolateLeft: 'clamp',
                    extrapolateRight: 'clamp',
                  }
                ),
              }}
            >
              <div
                style={{
                  width: '12px',
                  height: '12px',
                  background: currentFeature.color,
                  borderRadius: '50%',
                  marginRight: '15px',
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontSize: '20px',
                  color: '#ffffff',
                  fontFamily: 'Arial, sans-serif',
                }}
              >
                {point}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 右侧截图展示 */}
      <div
        style={{
          position: 'absolute',
          right: '8%',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '35%',
          zIndex: 10,
        }}
      >
        <div
          style={{
            background: 'rgba(0, 0, 0, 0.8)',
            borderRadius: '20px',
            padding: '20px',
            border: `3px solid ${currentFeature.color}40`,
            boxShadow: `0 20px 60px rgba(0,0,0,0.5), 0 0 40px ${currentFeature.color}20`,
          }}
        >
          <Img
            src={staticFile(`images/${currentFeature.image}`)}
            style={{
              width: '100%',
              height: 'auto',
              borderRadius: '10px',
              opacity: interpolate(featureProgress, [0, 0.5], [0, 1], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              }),
            }}
          />
        </div>
      </div>

      {/* 进度指示器 */}
      <div
        style={{
          position: 'absolute',
          bottom: '40px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: '15px',
          zIndex: 10,
        }}
      >
        {FEATURES.map((_, index) => (
          <div
            key={index}
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: index === currentFeatureIndex ? currentFeature.color : 'rgba(255, 255, 255, 0.3)',
              transition: 'all 0.3s ease',
              boxShadow: index === currentFeatureIndex ? `0 0 20px ${currentFeature.color}60` : 'none',
            }}
          />
        ))}
      </div>

      {/* 口播字幕 */}
      <div
        style={{
          position: 'absolute',
          bottom: '100px',
          left: '50%',
          transform: 'translateX(-50%)',
          textAlign: 'center',
          opacity: interpolate(relativeFrame, [2 * fps, 4 * fps], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
          zIndex: 10,
        }}
      >
        <div
          style={{
            background: 'rgba(0, 0, 0, 0.8)',
            padding: '15px 30px',
            borderRadius: '10px',
            border: '2px solid rgba(255, 255, 255, 0.2)',
          }}
        >
          <div
            style={{
              fontSize: '18px',
              color: '#ffffff',
              fontFamily: 'Arial, sans-serif',
            }}
          >
            "{currentFeature.description}"
          </div>
        </div>
      </div>

      {/* 功能解说音频 */}
      <Audio
        src={`audio/feature-${currentFeatureIndex + 1}.mp3`}
        startFrom={sceneStart + featureStartFrame}
        volume={0.7}
      />
    </AbsoluteFill>
  );
};