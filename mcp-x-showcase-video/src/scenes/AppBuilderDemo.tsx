import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  Img,
  staticFile,
  Audio
} from 'remotion';

export const AppBuilderDemo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // 场景开始帧 (135秒后)
  const sceneStart = 135 * fps;
  const relativeFrame = frame - sceneStart;

  return (
    <AbsoluteFill
      style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
      }}
    >
      {/* 背景截图 */}
      <Img
        src={staticFile('images/screenshot-2.png')}
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          opacity: 0.2,
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
          💻 应用构建器
        </h1>
        <p
          style={{
            fontSize: '24px',
            color: '#cccccc',
            fontFamily: 'Arial, sans-serif',
          }}
        >
          对话式开发，实时预览，一键部署
        </p>
      </div>

      {/* 演示区域 */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          width: '70%',
          zIndex: 10,
        }}
      >
        <div
          style={{
            background: 'rgba(0, 0, 0, 0.9)',
            borderRadius: '20px',
            padding: '30px',
            border: '3px solid rgba(16, 185, 129, 0.3)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            display: 'flex',
            gap: '30px',
          }}
        >
          {/* 左侧对话区域 */}
          <div style={{ flex: 1 }}>
            <h3
              style={{
                color: '#ffffff',
                marginBottom: '15px',
                fontFamily: 'Arial, sans-serif',
              }}
            >
              对话式开发
            </h3>
            <div
              style={{
                background: 'rgba(16, 185, 129, 0.1)',
                padding: '15px',
                borderRadius: '10px',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                marginBottom: '15px',
              }}
            >
              <div style={{ color: '#10b981', fontSize: '14px', marginBottom: '5px' }}>
                用户输入：
              </div>
              <div style={{ color: '#ffffff', fontSize: '16px' }}>
                "创建一个电商网站的首页"
              </div>
            </div>
            <div
              style={{
                background: 'rgba(59, 130, 246, 0.1)',
                padding: '15px',
                borderRadius: '10px',
                border: '1px solid rgba(59, 130, 246, 0.3)',
              }}
            >
              <div style={{ color: '#3b82f6', fontSize: '14px', marginBottom: '5px' }}>
                AI生成：
              </div>
              <div style={{ color: '#ffffff', fontSize: '16px' }}>
                正在为您构建现代化的电商首页...
              </div>
            </div>
          </div>

          {/* 右侧预览区域 */}
          <div style={{ flex: 1 }}>
            <h3
              style={{
                color: '#ffffff',
                marginBottom: '15px',
                fontFamily: 'Arial, sans-serif',
              }}
            >
              实时预览
            </h3>
            <Img
              src={staticFile('images/screenshot-2.png')}
              style={{
                width: '100%',
                height: 'auto',
                borderRadius: '10px',
                border: '2px solid rgba(16, 185, 129, 0.3)',
                opacity: interpolate(relativeFrame, [0, 2 * fps], [0, 1], {
                  extrapolateLeft: 'clamp',
                  extrapolateRight: 'clamp',
                }),
              }}
            />
          </div>
        </div>
      </div>

      {/* 功能特性 */}
      <div
        style={{
          position: 'absolute',
          bottom: '120px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: '20px',
          opacity: interpolate(relativeFrame, [2 * fps, 4 * fps], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
          zIndex: 10,
        }}
      >
        {[
          'React/Vue框架',
          '实时预览',
          '可视化编辑',
          '一键部署',
          '代码下载'
        ].map((feature) => (
          <div
            key={feature}
            style={{
              padding: '10px 20px',
              background: 'rgba(16, 185, 129, 0.2)',
              borderRadius: '25px',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              fontSize: '16px',
              color: '#ffffff',
              fontFamily: 'Arial, sans-serif',
            }}
          >
            {feature}
          </div>
        ))}
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
            border: '2px solid rgba(16, 185, 129, 0.3)',
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
            "应用构建器支持对话式前端开发，实时预览，支持多种框架和一键部署"
          </div>
        </div>
      </div>

      {/* 演示音频 */}
      <Audio
        src="audio/app-builder-demo.mp3"
        startFrom={sceneStart}
        volume={0.7}
      />
    </AbsoluteFill>
  );
};