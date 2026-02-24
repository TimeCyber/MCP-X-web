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

const WORKFLOW_STEPS = [
  {
    title: '剧本解析',
    description: 'AI自动分析剧本，提取角色、场景、故事段落',
    icon: '📝',
    color: '#ff6b35',
    image: 'screenshot-4.png'
  },
  {
    title: '分镜生成',
    description: '智能生成专业分镜列表，包含镜头运动和景别',
    icon: '🎬',
    color: '#f59e0b',
    image: 'screenshot-4.png'
  },
  {
    title: '角色定妆照',
    description: 'AI生成角色视觉形象，为视频制作提供参考',
    icon: '👤',
    color: '#8b5cf6',
    image: 'screenshot-3.png'
  },
  {
    title: '场景概念图',
    description: '自动生成场景视觉设计，构建完整世界观',
    icon: '🏞️',
    color: '#10b981',
    image: 'screenshot-3.png'
  },
  {
    title: '视频生成',
    description: '支持文生视频、图生视频、首尾帧插值三种模式',
    icon: '🎥',
    color: '#3b82f6',
    image: 'screenshot-4.png'
  },
  {
    title: '一键导出',
    description: '浏览器端FFmpeg合并导出完整视频片段',
    icon: '📤',
    color: '#ec4899',
    image: 'screenshot-4.png'
  }
];

export const VideoStudioDemo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // 场景开始帧 (45秒后)
  const sceneStart = 45 * fps;
  const relativeFrame = frame - sceneStart;

  // 当前步骤索引 (每步8秒)
  const currentStepIndex = Math.min(
    Math.floor(relativeFrame / (8 * fps)),
    WORKFLOW_STEPS.length - 1
  );

  const currentStep = WORKFLOW_STEPS[currentStepIndex];
  const stepStartFrame = currentStepIndex * 8 * fps;
  const stepProgress = (relativeFrame - stepStartFrame) / (8 * fps);

  return (
    <AbsoluteFill
      style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
      }}
    >
      {/* 背景网格效果 */}
      <div
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          backgroundImage: `
            linear-gradient(rgba(255, 107, 53, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 107, 53, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
          opacity: 0.3,
        }}
      />

      {/* 标题区域 */}
      <div
        style={{
          position: 'absolute',
          top: '40px',
          left: '50%',
          transform: 'translateX(-50%)',
          textAlign: 'center',
          zIndex: 10,
        }}
      >
        <h1
          style={{
            fontSize: '48px',
            fontWeight: 'bold',
            color: '#ffffff',
            marginBottom: '1rem',
            fontFamily: 'Arial, sans-serif',
          }}
        >
          🎬 MCP-X Video Studio
        </h1>
        <p
          style={{
            fontSize: '24px',
            color: '#cccccc',
            fontFamily: 'Arial, sans-serif',
          }}
        >
          从剧本到成片，AI全程辅助
        </p>
      </div>

      {/* 工作流步骤指示器 */}
      <div
        style={{
          position: 'absolute',
          top: '140px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: '20px',
          zIndex: 10,
        }}
      >
        {WORKFLOW_STEPS.map((step, index) => {
          const isActive = index === currentStepIndex;
          const isCompleted = index < currentStepIndex;

          return (
            <div
              key={step.title}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '10px',
                opacity: index <= currentStepIndex ? 1 : 0.3,
              }}
            >
              {/* 步骤图标 */}
              <div
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: isActive ? step.color : isCompleted ? '#10b981' : 'rgba(255, 255, 255, 0.1)',
                  border: `3px solid ${isActive ? step.color : 'rgba(255, 255, 255, 0.3)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px',
                  transition: 'all 0.3s ease',
                  boxShadow: isActive ? `0 0 30px ${step.color}60` : 'none',
                }}
              >
                {step.icon}
              </div>

              {/* 步骤标题 */}
              <div
                style={{
                  fontSize: '12px',
                  color: isActive ? '#ffffff' : '#cccccc',
                  textAlign: 'center',
                  fontFamily: 'Arial, sans-serif',
                  maxWidth: '80px',
                }}
              >
                {step.title}
              </div>

              {/* 连接线 */}
              {index < WORKFLOW_STEPS.length - 1 && (
                <div
                  style={{
                    position: 'absolute',
                    top: '30px',
                    left: '100%',
                    width: '20px',
                    height: '2px',
                    background: index < currentStepIndex ? '#10b981' : 'rgba(255, 255, 255, 0.3)',
                    zIndex: -1,
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* 主要内容区域 */}
      <div
        style={{
          position: 'absolute',
          left: '10%',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '35%',
          zIndex: 10,
        }}
      >
        {/* 步骤详情 */}
        <div
          style={{
            marginBottom: '2rem',
            opacity: interpolate(stepProgress, [0, 0.3], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            }),
          }}
        >
          <h2
            style={{
              fontSize: '36px',
              fontWeight: 'bold',
              color: currentStep.color,
              marginBottom: '1rem',
              fontFamily: 'Arial, sans-serif',
            }}
          >
            {currentStep.title}
          </h2>
          <p
            style={{
              fontSize: '20px',
              color: '#cccccc',
              lineHeight: '1.5',
              fontFamily: 'Arial, sans-serif',
            }}
          >
            {currentStep.description}
          </p>
        </div>

        {/* 支持的AI模型 */}
        <div
          style={{
            opacity: interpolate(stepProgress, [0.4, 0.7], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            }),
          }}
        >
          <h3
            style={{
              fontSize: '24px',
              color: '#ffffff',
              marginBottom: '1rem',
              fontFamily: 'Arial, sans-serif',
            }}
          >
            支持AI模型
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {['千问', '即梦', '可灵', '海螺', 'Veo3', 'Runway'].map((model) => (
              <div
                key={model}
                style={{
                  background: 'rgba(255, 107, 53, 0.2)',
                  padding: '8px 16px',
                  borderRadius: '20px',
                  border: '1px solid rgba(255, 107, 53, 0.3)',
                  fontSize: '14px',
                  color: '#ffffff',
                  fontFamily: 'Arial, sans-serif',
                }}
              >
                {model}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 右侧演示区域 */}
      <div
        style={{
          position: 'absolute',
          right: '10%',
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
            border: `3px solid ${currentStep.color}40`,
            boxShadow: `0 20px 60px rgba(0,0,0,0.5), 0 0 40px ${currentStep.color}20`,
          }}
        >
          <Img
            src={staticFile(`images/${currentStep.image}`)}
            style={{
              width: '100%',
              height: 'auto',
              borderRadius: '10px',
              opacity: interpolate(stepProgress, [0.2, 0.6], [0, 1], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              }),
            }}
          />

          {/* 步骤演示动画 */}
          <div
            style={{
              marginTop: '20px',
              height: '4px',
              background: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '2px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                background: currentStep.color,
                width: `${interpolate(stepProgress, [0.6, 1], [0, 100])}%`,
                transition: 'width 0.5s ease',
              }}
            />
          </div>
        </div>
      </div>

      {/* 口播字幕 */}
      <div
        style={{
          position: 'absolute',
          bottom: '60px',
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
            maxWidth: '600px',
          }}
        >
          <div
            style={{
              fontSize: '18px',
              color: '#ffffff',
              fontFamily: 'Arial, sans-serif',
              lineHeight: '1.4',
            }}
          >
            "MCP-X Video Studio 提供完整的AI视频制作工作流，{currentStep.description.toLowerCase()}"
          </div>
        </div>
      </div>

      {/* 步骤解说音频 */}
      <Audio
        src={`audio/video-step-${currentStepIndex + 1}.mp3`}
        startFrom={sceneStart + stepStartFrame}
        volume={0.7}
      />
    </AbsoluteFill>
  );
};