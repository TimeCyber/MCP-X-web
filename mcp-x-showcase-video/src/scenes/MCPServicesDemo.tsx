import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  Audio
} from 'remotion';

const MCP_SERVICES = [
  { name: 'GitHub', description: '代码仓库管理', icon: '📚' },
  { name: 'Google', description: '搜索和工具集成', icon: '🔍' },
  { name: 'Notion', description: '知识库管理', icon: '📝' },
  { name: 'Slack', description: '团队协作', icon: '💬' },
  { name: 'Jira', description: '项目管理', icon: '📋' },
  { name: 'Figma', description: '设计协作', icon: '🎨' },
  { name: 'Weather', description: '天气查询', icon: '🌤️' },
  { name: 'Database', description: '数据查询', icon: '🗄️' },
];

export const MCPServicesDemo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // 场景开始帧 (165秒后)
  const sceneStart = 165 * fps;
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
          🔧 MCP 服务市场
        </h1>
        <p
          style={{
            fontSize: '24px',
            color: '#cccccc',
            fontFamily: 'Arial, sans-serif',
          }}
        >
          1000+ 工具集成，扩展AI能力边界
        </p>
      </div>

      {/* 服务网格 */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '20px',
          width: '80%',
          maxWidth: '800px',
          zIndex: 10,
        }}
      >
        {MCP_SERVICES.map((service, index) => (
          <div
            key={service.name}
            style={{
              background: 'rgba(0, 0, 0, 0.8)',
              padding: '20px',
              borderRadius: '15px',
              border: '2px solid rgba(245, 158, 11, 0.3)',
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
            <div style={{ fontSize: '32px', marginBottom: '10px' }}>
              {service.icon}
            </div>
            <div
              style={{
                fontSize: '18px',
                fontWeight: 'bold',
                color: '#ffffff',
                marginBottom: '5px',
                fontFamily: 'Arial, sans-serif',
              }}
            >
              {service.name}
            </div>
            <div
              style={{
                fontSize: '14px',
                color: '#cccccc',
                fontFamily: 'Arial, sans-serif',
              }}
            >
              {service.description}
            </div>
          </div>
        ))}
      </div>

      {/* 统计数据 */}
      <div
        style={{
          position: 'absolute',
          bottom: '120px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: '40px',
          opacity: interpolate(relativeFrame, [3 * fps, 5 * fps], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
          zIndex: 10,
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              fontSize: '36px',
              fontWeight: 'bold',
              color: '#f59e0b',
              marginBottom: '5px',
            }}
          >
            1000+
          </div>
          <div style={{ color: '#cccccc', fontSize: '16px' }}>MCP工具</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              fontSize: '36px',
              fontWeight: 'bold',
              color: '#f59e0b',
              marginBottom: '5px',
            }}
          >
            500+
          </div>
          <div style={{ color: '#cccccc', fontSize: '16px' }}>AI智能体</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              fontSize: '36px',
              fontWeight: 'bold',
              color: '#f59e0b',
              marginBottom: '5px',
            }}
          >
            24/7
          </div>
          <div style={{ color: '#cccccc', fontSize: '16px' }}>服务可用</div>
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
            border: '2px solid rgba(245, 158, 11, 0.3)',
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
            "MCP服务市场集成1000+工具和500+智能体，扩展AI能力无界限"
          </div>
        </div>
      </div>

      {/* 演示音频 */}
      <Audio
        src="audio/mcp-services-demo.mp3"
        startFrom={sceneStart}
        volume={0.7}
      />
    </AbsoluteFill>
  );
};