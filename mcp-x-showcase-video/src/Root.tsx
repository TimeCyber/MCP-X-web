import React from 'react';
import { Composition, Folder } from 'remotion';
import { MCPXShowcase } from './MCPXShowcase';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Folder name="mcp-x-showcase">
        <Composition
          id="MCP-X-Showcase"
          component={MCPXShowcase}
          durationInFrames={30 * 180} // 180秒 @ 30fps
          fps={30}
          width={1920}
          height={1080}
          defaultProps={{
            title: 'MCP-X 企业级AI智能体开发平台'
          }}
        />
      </Folder>
    </>
  );
};