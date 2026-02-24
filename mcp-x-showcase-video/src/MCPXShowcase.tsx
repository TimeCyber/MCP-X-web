import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Audio,
  Img,
  staticFile
} from 'remotion';
import { OpeningScene } from './scenes/OpeningScene';
import { FeatureOverview } from './scenes/FeatureOverview';
import { VideoStudioDemo } from './scenes/VideoStudioDemo';
import { ChatAIDemo } from './scenes/ChatAIDemo';
import { ImageEditorDemo } from './scenes/ImageEditorDemo';
import { AppBuilderDemo } from './scenes/AppBuilderDemo';
import { MCPServicesDemo } from './scenes/MCPServicesDemo';
import { TechnicalHighlights } from './scenes/TechnicalHighlights';
import { ClosingScene } from './scenes/ClosingScene';

interface MCPXShowcaseProps {
  title: string;
}

export const MCPXShowcase: React.FC<MCPXShowcaseProps> = ({ title }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // 时间节点定义 (帧数)
  const openingEnd = 15 * fps; // 15秒 - 开场
  const overviewEnd = 45 * fps; // 45秒 - 功能总览
  const videoDemoEnd = 75 * fps; // 75秒 - 视频工作室演示
  const chatDemoEnd = 105 * fps; // 105秒 - AI对话演示
  const imageDemoEnd = 135 * fps; // 135秒 - 图像编辑演示
  const appDemoEnd = 165 * fps; // 165秒 - 应用构建演示
  const mcpDemoEnd = 180 * fps; // 180秒 - MCP服务演示

  // 根据当前帧决定显示哪个场景
  const renderScene = () => {
    if (frame < openingEnd) {
      return <OpeningScene />;
    } else if (frame < overviewEnd) {
      return <FeatureOverview />;
    } else if (frame < videoDemoEnd) {
      return <VideoStudioDemo />;
    } else if (frame < chatDemoEnd) {
      return <ChatAIDemo />;
    } else if (frame < imageDemoEnd) {
      return <ImageEditorDemo />;
    } else if (frame < appDemoEnd) {
      return <AppBuilderDemo />;
    } else if (frame < mcpDemoEnd) {
      return <MCPServicesDemo />;
    } else {
      return <TechnicalHighlights />;
    }
  };

  return (
    <AbsoluteFill style={{ backgroundColor: '#0a0a0a' }}>
      {/* 背景音乐 */}
      <Audio
        src={staticFile('audio/background-music.mp3')}
        startFrom={0}
        volume={0.2}
      />

      {/* 渲染当前场景 */}
      {renderScene()}

      {/* 全局粒子效果 */}
      <ParticleEffect />
    </AbsoluteFill>
  );
};

// 粒子效果组件
const ParticleEffect: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const particles = Array.from({ length: 30 }, (_, i) => {
    const x = interpolate(frame + i * 20, [0, 600], [0, width], {
      extrapolateRight: 'extend',
    });
    const y = interpolate(frame + i * 25, [0, 600], [height, 0], {
      extrapolateRight: 'extend',
    });

    return (
      <div
        key={i}
        style={{
          position: 'absolute',
          left: x,
          top: y,
          width: '3px',
          height: '3px',
          backgroundColor: '#ff6b35',
          borderRadius: '50%',
          opacity: 0.4,
        }}
      />
    );
  });

  return <>{particles}</>;
};