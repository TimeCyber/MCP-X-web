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

const CHAT_MESSAGES = [
  {
    type: 'user',
    content: '帮我写一篇关于AI发展趋势的文章',
    avatar: '👤'
  },
  {
    type: 'assistant',
    content: '正在为您撰写关于AI发展趋势的文章...',
    avatar: '🤖',
    thinking: true
  },
  {
    type: 'assistant',
    content: '人工智能（Artificial Intelligence）正以惊人的速度发展...',
    avatar: '🤖',
    typing: true
  },
  {
    type: 'user',
    content: '可以添加一些最新的研究进展吗？',
    avatar: '👤'
  },
  {
    type: 'assistant',
    content: '当然可以。最近的研究进展包括：大型语言模型的涌现能力、AI在医疗领域的应用、多模态AI的发展等...',
    avatar: '🤖',
    typing: true
  }
];

export const ChatAIDemo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // 场景开始帧 (75秒后)
  const sceneStart = 75 * fps;
  const relativeFrame = frame - sceneStart;

  // 当前消息索引
  const currentMessageIndex = Math.min(
    Math.floor(relativeFrame / (4 * fps)), // 每条消息4秒
    CHAT_MESSAGES.length - 1
  );

  const currentMessage = CHAT_MESSAGES[currentMessageIndex];
  const messageStartFrame = currentMessageIndex * 4 * fps;
  const messageProgress = (relativeFrame - messageStartFrame) / (4 * fps);

  return (
    <AbsoluteFill
      style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
      }}
    >
      {/* 背景截图 */}
      <Img
        src={staticFile('images/screenshot-1.png')}
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
          💬 AI 对话系统
        </h1>
        <p
          style={{
            fontSize: '24px',
            color: '#cccccc',
            fontFamily: 'Arial, sans-serif',
          }}
        >
          多模型支持，智能对话，工具集成
        </p>
      </div>

      {/* 左侧功能说明 */}
      <div
        style={{
          position: 'absolute',
          left: '8%',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '35%',
          zIndex: 10,
        }}
      >
        <div style={{ marginBottom: '2rem' }}>
          <h2
            style={{
              fontSize: '32px',
              fontWeight: 'bold',
              color: '#3b82f6',
              marginBottom: '1rem',
              fontFamily: 'Arial, sans-serif',
            }}
          >
            核心特性
          </h2>
          {[
            '多模型对话 (GPT、DeepSeek、Kimi)',
            '流式响应，实时输出',
            'MCP工具集成，扩展能力',
            '网络搜索，知识增强',
            '人工介入，精确控制'
          ].map((feature, index) => (
            <div
              key={feature}
              style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '1rem',
                opacity: interpolate(
                  relativeFrame,
                  [index * 0.5 * fps, (index * 0.5 + 1) * fps],
                  [0, 1],
                  { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
                ),
              }}
            >
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  background: '#3b82f6',
                  borderRadius: '50%',
                  marginRight: '12px',
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontSize: '18px',
                  color: '#ffffff',
                  fontFamily: 'Arial, sans-serif',
                }}
              >
                {feature}
              </span>
            </div>
          ))}
        </div>

        {/* 模型选择器 */}
        <div
          style={{
            background: 'rgba(0, 0, 0, 0.6)',
            padding: '20px',
            borderRadius: '15px',
            border: '2px solid rgba(59, 130, 246, 0.3)',
          }}
        >
          <h3
            style={{
              fontSize: '20px',
              color: '#ffffff',
              marginBottom: '1rem',
              fontFamily: 'Arial, sans-serif',
            }}
          >
            支持AI模型
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {[
              { name: 'GPT-4', active: true },
              { name: 'DeepSeek', active: false },
              { name: 'Kimi', active: false },
              { name: 'Claude', active: false },
            ].map((model) => (
              <div
                key={model.name}
                style={{
                  padding: '6px 12px',
                  background: model.active ? '#3b82f6' : 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '15px',
                  fontSize: '14px',
                  color: '#ffffff',
                  fontFamily: 'Arial, sans-serif',
                }}
              >
                {model.name}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 右侧聊天界面演示 */}
      <div
        style={{
          position: 'absolute',
          right: '8%',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '40%',
          zIndex: 10,
        }}
      >
        <div
          style={{
            background: 'rgba(0, 0, 0, 0.9)',
            borderRadius: '20px',
            padding: '20px',
            border: '2px solid rgba(59, 130, 246, 0.3)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            height: '500px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* 聊天头部 */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px',
              paddingBottom: '15px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ fontSize: '24px' }}>💬</div>
              <span style={{ color: '#ffffff', fontSize: '18px', fontFamily: 'Arial, sans-serif' }}>
                AI对话
              </span>
            </div>
            <div style={{ display: 'flex', gap: '5px' }}>
              {['MCP', '搜索', '工具'].map((feature) => (
                <div
                  key={feature}
                  style={{
                    padding: '4px 8px',
                    background: 'rgba(59, 130, 246, 0.2)',
                    borderRadius: '10px',
                    fontSize: '12px',
                    color: '#3b82f6',
                    fontFamily: 'Arial, sans-serif',
                  }}
                >
                  {feature}
                </div>
              ))}
            </div>
          </div>

          {/* 消息列表 */}
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {CHAT_MESSAGES.slice(0, currentMessageIndex + 1).map((message, index) => {
              const isCurrentMessage = index === currentMessageIndex;
              const messageOpacity = isCurrentMessage
                ? interpolate(messageProgress, [0, 0.3], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
                : 1;

              const isTyping = isCurrentMessage && message.typing && messageProgress < 0.8;
              const textProgress = isTyping ? interpolate(messageProgress, [0.3, 0.8], [0, message.content.length]) : message.content.length;
              const displayText = message.content.slice(0, Math.floor(textProgress));

              return (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    opacity: messageOpacity,
                  }}
                >
                  <div
                    style={{
                      fontSize: '20px',
                      flexShrink: 0,
                    }}
                  >
                    {message.avatar}
                  </div>
                  <div
                    style={{
                      flex: 1,
                      background: message.type === 'user' ? '#3b82f6' : 'rgba(255, 255, 255, 0.1)',
                      padding: '12px 16px',
                      borderRadius: '15px',
                      color: '#ffffff',
                      fontFamily: 'Arial, sans-serif',
                      fontSize: '16px',
                      lineHeight: '1.4',
                      alignSelf: message.type === 'user' ? 'flex-end' : 'flex-start',
                      maxWidth: '80%',
                    }}
                  >
                    {displayText}
                    {isTyping && Math.floor(frame / 10) % 2 === 0 && '|'}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 输入框 */}
          <div
            style={{
              marginTop: '15px',
              padding: '12px 16px',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '25px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#cccccc',
              fontFamily: 'Arial, sans-serif',
              fontSize: '14px',
            }}
          >
            输入您的问题，或@符号调用工具...
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
            border: '2px solid rgba(59, 130, 246, 0.3)',
            maxWidth: '500px',
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
            "AI对话系统支持多模型切换，集成MCP工具，提供智能搜索和人工介入功能"
          </div>
        </div>
      </div>

      {/* 对话音频 */}
      <Audio
        src={`audio/chat-demo-${currentMessageIndex + 1}.mp3`}
        startFrom={sceneStart + messageStartFrame}
        volume={0.6}
      />
    </AbsoluteFill>
  );
};