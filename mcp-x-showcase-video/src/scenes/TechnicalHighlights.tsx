import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  Audio
} from 'remotion';

const TECH_FEATURES = [
  {
    title: '企业级架构',
    description: 'Token认证、多租户、数据隔离',
    icon: '🏢',
    color: '#3b82f6'
  },
  {
    title: '流式响应',
    description: 'SSE实时输出，毫秒级体验',
    icon: '⚡',
    color: '#10b981'
  },
  {
    title: '本地缓存',
    description: 'IndexedDB存储，减少服务器压力',
    icon: '💾',
    color: '#f59e0b'
  },
  {
    title: 'MCP协议',
    description: '完整支持Model Context Protocol',
    icon: '🔌',
    color: '#8b5cf6'
  },
  {
    title: '多模型接入',
    description: '统一接口对接主流AI模型',
    icon: '🤖',
    color: '#ec4899'
  },
  {
    title: '浏览器端处理',
    description: 'FFmpeg.wasm视频处理',
    icon: '🌐',
    color: '#06b6d4'
  }
];

export const TechnicalHighlights: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // 场景开始帧 (180秒后)
  const sceneStart = 180 * fps;
  const relativeFrame = frame - sceneStart;

  return (
    <AbsoluteFill
      style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
      }}
    >
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
          🏗️ 企业级技术架构
        </h1>
        <p
          style={{
            fontSize: '24px',
            color: '#cccccc',
            fontFamily: 'Arial, sans-serif',
          }}
        >
          安全可靠 · 高性能 · 可扩展
        </p>
      </div>

      {/* 技术特性网格 */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '30px',
          width: '90%',
          maxWidth: '1000px',
          zIndex: 10,
        }}
      >
        {TECH_FEATURES.map((feature, index) => (
          <div
            key={feature.title}
            style={{
              background: 'rgba(0, 0, 0, 0.8)',
              padding: '30px',
              borderRadius: '20px',
              border: `2px solid ${feature.color}40`,
              textAlign: 'center',
              opacity: interpolate(
                relativeFrame,
                [index * 0.5 * fps, (index * 0.5 + 1) * fps],
                [0, 1],
                { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
              ),
              transform: `scale(${interpolate(
                relativeFrame,
                [index * 0.5 * fps, (index * 0.5 + 0.5) * fps],
                [0.8, 1],
                { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
              )})`,
            }}
          >
            <div style={{ fontSize: '48px', marginBottom: '15px' }}>
              {feature.icon}
            </div>
            <h3
              style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: '#ffffff',
                marginBottom: '10px',
                fontFamily: 'Arial, sans-serif',
              }}
            >
              {feature.title}
            </h3>
            <p
              style={{
                fontSize: '16px',
                color: '#cccccc',
                fontFamily: 'Arial, sans-serif',
                lineHeight: '1.4',
              }}
            >
              {feature.description}
            </p>
          </div>
        ))}
      </div>

      {/* 结尾统计 */}
      <div
        style={{
          position: 'absolute',
          bottom: '120px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: '60px',
          opacity: interpolate(relativeFrame, [4 * fps, 6 * fps], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
          zIndex: 10,
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              fontSize: '42px',
              fontWeight: 'bold',
              color: '#ff6b35',
              marginBottom: '5px',
              fontFamily: 'Arial, sans-serif',
            }}
          >
            1000+
          </div>
          <div style={{ color: '#cccccc', fontSize: '16px', fontFamily: 'Arial, sans-serif' }}>
            Stars
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              fontSize: '42px',
              fontWeight: 'bold',
              color: '#ff6b35',
              marginBottom: '5px',
              fontFamily: 'Arial, sans-serif',
            }}
          >
            300+
          </div>
          <div style={{ color: '#cccccc', fontSize: '16px', fontFamily: 'Arial, sans-serif' }}>
            开发者
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              fontSize: '42px',
              fontWeight: 'bold',
              color: '#ff6b35',
              marginBottom: '5px',
              fontFamily: 'Arial, sans-serif',
            }}
          >
            20+
          </div>
          <div style={{ color: '#cccccc', fontSize: '16px', fontFamily: 'Arial, sans-serif' }}>
            AI模型
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
          opacity: interpolate(relativeFrame, [1 * fps, 3 * fps], [0, 1], {
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
            border: '2px solid rgba(255, 107, 53, 0.3)',
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
            "MCP-X采用企业级技术架构，确保安全、高效、可扩展的AI开发体验"
          </div>
        </div>
      </div>

      {/* 技术亮点音频 */}
      <Audio
        src="audio/technical-highlights.mp3"
        startFrom={sceneStart}
        volume={0.7}
      />
    </AbsoluteFill>
  );
};