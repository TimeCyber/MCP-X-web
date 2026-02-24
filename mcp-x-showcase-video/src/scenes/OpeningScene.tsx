import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Audio
} from 'remotion';

export const OpeningScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // 动画时间点
  const logoAppearFrame = 2 * fps; // 2秒
  const textFadeInFrame = 3 * fps; // 3秒
  const subtitleFrame = 6 * fps; // 6秒
  const narratorStart = 8 * fps; // 8秒

  // Logo 动画
  const logoScale = spring({
    frame: frame - logoAppearFrame,
    fps,
    config: {
      damping: 200,
      stiffness: 100,
      mass: 0.5,
    },
  });

  const logoOpacity = interpolate(
    frame,
    [logoAppearFrame, logoAppearFrame + 10],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // 文字动画
  const titleOpacity = interpolate(
    frame,
    [textFadeInFrame, textFadeInFrame + 15],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const subtitleOpacity = interpolate(
    frame,
    [subtitleFrame, subtitleFrame + 15],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // 口播文本动画
  const narratorOpacity = interpolate(
    frame,
    [narratorStart, narratorStart + 10],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  return (
    <AbsoluteFill
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)',
      }}
    >
      {/* 背景光晕效果 */}
      <div
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          background: `radial-gradient(circle at 50% 50%, rgba(255, 107, 53, ${logoOpacity * 0.3}) 0%, transparent 70%)`,
        }}
      />

      {/* MCP-X Logo */}
      <div
        style={{
          transform: `scale(${logoScale})`,
          opacity: logoOpacity,
          marginBottom: '3rem',
          position: 'relative',
          zIndex: 10,
        }}
      >
        {/* Logo 发光效果 */}
        <div
          style={{
            position: 'absolute',
            top: '-30px',
            left: '-30px',
            right: '-30px',
            bottom: '-30px',
            background: `radial-gradient(circle, rgba(255, 107, 53, ${logoOpacity}) 0%, transparent 70%)`,
            borderRadius: '50%',
            filter: 'blur(25px)',
          }}
        />

        {/* Logo 主体 */}
        <div
          style={{
            fontSize: '140px',
            fontWeight: 'bold',
            background: 'linear-gradient(45deg, #ff6b35, #f7931e, #ff4757)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '0 0 60px rgba(255, 107, 53, 0.5)',
            fontFamily: 'Arial, sans-serif',
            letterSpacing: '12px',
          }}
        >
          MCP-X
        </div>
      </div>

      {/* 主要标语 */}
      <div
        style={{
          textAlign: 'center',
          marginBottom: '2rem',
          opacity: titleOpacity,
          zIndex: 10,
        }}
      >
        <h1
          style={{
            fontSize: '56px',
            fontWeight: 'bold',
            color: '#ffffff',
            marginBottom: '1rem',
            fontFamily: 'Arial, sans-serif',
            lineHeight: '1.2',
          }}
        >
          企业级 AI 智能体开发平台
        </h1>
        <p
          style={{
            fontSize: '28px',
            color: '#cccccc',
            fontFamily: 'Arial, sans-serif',
            opacity: subtitleOpacity,
          }}
        >
          全流程AI创作，一站式智能开发
        </p>
      </div>

      {/* 口播字幕 */}
      <div
        style={{
          position: 'absolute',
          bottom: '120px',
          left: '50%',
          transform: 'translateX(-50%)',
          textAlign: 'center',
          opacity: narratorOpacity,
          zIndex: 10,
        }}
      >
        <div
          style={{
            background: 'rgba(0, 0, 0, 0.7)',
            padding: '20px 40px',
            borderRadius: '15px',
            border: '2px solid rgba(255, 107, 53, 0.3)',
          }}
        >
          <div
            style={{
              fontSize: '24px',
              color: '#ffffff',
              fontFamily: 'Arial, sans-serif',
              lineHeight: '1.4',
              marginBottom: '10px',
            }}
          >
            "欢迎来到 MCP-X，企业级AI智能体开发平台"
          </div>
          <div
            style={{
              fontSize: '18px',
              color: '#cccccc',
              fontFamily: 'Arial, sans-serif',
            }}
          >
            解说员配音
          </div>
        </div>
      </div>

      {/* 功能标签 */}
      <div
        style={{
          position: 'absolute',
          bottom: '40px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: '30px',
          opacity: interpolate(frame, [12 * fps, 14 * fps], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
          zIndex: 10,
        }}
      >
        {[
          '🎬 视频工作室',
          '💬 AI对话',
          '🎨 图像编辑',
          '💻 应用构建',
          '🔧 MCP服务'
        ].map((feature, index) => (
          <div
            key={feature}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              padding: '10px 20px',
              borderRadius: '25px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              fontSize: '16px',
              color: '#ffffff',
              fontFamily: 'Arial, sans-serif',
              backdropFilter: 'blur(10px)',
            }}
          >
            {feature}
          </div>
        ))}
      </div>

      {/* 口播音频 */}
      <Audio
        src="audio/narrator-opening.mp3"
        startFrom={narratorStart}
        volume={0.8}
      />
    </AbsoluteFill>
  );
};