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

export const ImageEditorDemo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // 场景开始帧 (105秒后)
  const sceneStart = 105 * fps;
  const relativeFrame = frame - sceneStart;

  return (
    <AbsoluteFill
      style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
      }}
    >
      {/* 背景截图 */}
      <Img
        src={staticFile('images/screenshot-3.png')}
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
          🎨 AI 图像编辑器
        </h1>
        <p
          style={{
            fontSize: '24px',
            color: '#cccccc',
            fontFamily: 'Arial, sans-serif',
          }}
        >
          文生图、图生图、图生视频，创意无限
        </p>
      </div>

      {/* 主要演示区域 */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          width: '60%',
          zIndex: 10,
        }}
      >
        <div
          style={{
            background: 'rgba(0, 0, 0, 0.9)',
            borderRadius: '20px',
            padding: '30px',
            border: '3px solid rgba(139, 92, 246, 0.3)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          }}
        >
          <Img
            src={staticFile('images/screenshot-3.png')}
            style={{
              width: '100%',
              height: 'auto',
              borderRadius: '10px',
              opacity: interpolate(relativeFrame, [0, 2 * fps], [0, 1], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              }),
            }}
          />

          {/* 功能标签 */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '15px',
              marginTop: '20px',
              opacity: interpolate(relativeFrame, [2 * fps, 4 * fps], [0, 1], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              }),
            }}
          >
            {[
              '文生图',
              '图生图',
              '局部编辑',
              '图生视频',
              '@符号参考'
            ].map((feature) => (
              <div
                key={feature}
                style={{
                  padding: '8px 16px',
                  background: 'rgba(139, 92, 246, 0.2)',
                  borderRadius: '20px',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  fontSize: '14px',
                  color: '#ffffff',
                  fontFamily: 'Arial, sans-serif',
                }}
              >
                {feature}
              </div>
            ))}
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
            border: '2px solid rgba(139, 92, 246, 0.3)',
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
            "AI图像编辑器支持多种创作模式，@符号引用画布图片生成视频"
          </div>
        </div>
      </div>

      {/* 演示音频 */}
      <Audio
        src="audio/image-editor-demo.mp3"
        startFrom={sceneStart}
        volume={0.7}
      />
    </AbsoluteFill>
  );
};