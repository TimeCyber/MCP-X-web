import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Audio
} from 'remotion';

export const ClosingScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // 场景开始帧 (超过180秒)
  const sceneStart = 180 * fps;
  const relativeFrame = frame - sceneStart;

  // 动画时间点
  const logoRevealFrame = 2 * fps;
  const textFadeInFrame = 4 * fps;
  const ctaButtonsFrame = 6 * fps;
  const finalExplosionFrame = 10 * fps;

  // Logo 动画
  const logoScale = spring({
    frame: relativeFrame - logoRevealFrame,
    fps,
    config: {
      damping: 200,
      stiffness: 100,
      mass: 0.5,
    },
  });

  const logoGlow = interpolate(
    relativeFrame - logoRevealFrame,
    [0, 30],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // 文字动画
  const titleOpacity = interpolate(
    relativeFrame - textFadeInFrame,
    [0, 20],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // CTA按钮动画
  const buttonsScale = spring({
    frame: relativeFrame - ctaButtonsFrame,
    fps,
    config: {
      damping: 200,
      stiffness: 100,
      mass: 0.5,
    },
  });

  const buttonsOpacity = interpolate(
    relativeFrame - ctaButtonsFrame,
    [0, 15],
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
        position: 'relative',
      }}
    >
      {/* 背景光晕效果 */}
      <div
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          background: `radial-gradient(circle at 50% 50%, rgba(255, 107, 53, ${logoGlow * 0.4}) 0%, transparent 70%)`,
        }}
      />

      {/* MCP-X Logo */}
      <div
        style={{
          transform: `scale(${logoScale})`,
          opacity: relativeFrame >= logoRevealFrame ? 1 : 0,
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
            background: `radial-gradient(circle, rgba(255, 107, 53, ${logoGlow}) 0%, transparent 70%)`,
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
          开启您的AI创作之旅
        </h1>
        <p
          style={{
            fontSize: '28px',
            color: '#cccccc',
            fontFamily: 'Arial, sans-serif',
          }}
        >
          企业级AI智能体开发平台
        </p>
      </div>

      {/* CTA按钮 */}
      <div
        style={{
          display: 'flex',
          gap: '2rem',
          marginBottom: '3rem',
          transform: `scale(${buttonsScale})`,
          opacity: buttonsOpacity,
          zIndex: 10,
        }}
      >
        <button
          style={{
            padding: '1rem 2rem',
            background: 'linear-gradient(135deg, #ff6b35, #f7931e)',
            border: 'none',
            borderRadius: '50px',
            color: '#ffffff',
            fontSize: '20px',
            fontWeight: 'bold',
            fontFamily: 'Arial, sans-serif',
            cursor: 'pointer',
            boxShadow: '0 8px 25px rgba(255, 107, 53, 0.4)',
            transition: 'all 0.3s ease',
          }}
        >
          🚀 立即体验
        </button>
        <button
          style={{
            padding: '1rem 2rem',
            background: 'rgba(255, 255, 255, 0.1)',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '50px',
            color: '#ffffff',
            fontSize: '20px',
            fontWeight: 'bold',
            fontFamily: 'Arial, sans-serif',
            cursor: 'pointer',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.3s ease',
          }}
        >
          ⭐ GitHub开源
        </button>
      </div>

      {/* 网站信息和统计 */}
      <div
        style={{
          textAlign: 'center',
          opacity: buttonsOpacity,
          zIndex: 10,
        }}
      >
        <div
          style={{
            fontSize: '24px',
            color: '#ffffff',
            marginBottom: '1rem',
            fontFamily: 'Arial, sans-serif',
          }}
        >
          www.mcp-x.com
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '3rem',
            fontSize: '16px',
            color: '#aaaaaa',
            fontFamily: 'Arial, sans-serif',
          }}
        >
          <span>🌟 1000+ Stars</span>
          <span>👥 300+ 开发者</span>
          <span>🔧 1000+ MCP工具</span>
          <span>🤖 20+ AI模型</span>
        </div>
      </div>

      {/* 微信群二维码提示 */}
      <div
        style={{
          position: 'absolute',
          bottom: '40px',
          right: '40px',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          background: 'rgba(0, 0, 0, 0.8)',
          padding: '1rem',
          borderRadius: '15px',
          opacity: interpolate(relativeFrame, [8 * fps, 10 * fps], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
          zIndex: 10,
        }}
      >
        <div
          style={{
            width: '60px',
            height: '60px',
            background: '#25D366',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '30px',
          }}
        >
          💬
        </div>
        <div>
          <div
            style={{
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: 'bold',
              marginBottom: '0.25rem',
              fontFamily: 'Arial, sans-serif',
            }}
          >
            加入技术交流群
          </div>
          <div
            style={{
              color: '#cccccc',
              fontSize: '12px',
              fontFamily: 'Arial, sans-serif',
            }}
          >
            获取最新更新和技术支持
          </div>
        </div>
      </div>

      {/* 结尾音频 */}
      <Audio
        src="audio/closing-scene.mp3"
        startFrom={sceneStart}
        volume={0.7}
      />
    </AbsoluteFill>
  );
};