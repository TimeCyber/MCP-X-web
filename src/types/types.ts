
export type Tool = 'select' | 'pan' | 'draw' | 'erase' | 'rectangle' | 'circle' | 'triangle' | 'text' | 'arrow' | 'highlighter' | 'lasso' | 'line' | 'crop';

export type WheelAction = 'zoom' | 'pan';

export interface Point {
  x: number;
  y: number;
}

interface CanvasElementBase {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  name?: string;
  visible?: boolean;
  locked?: boolean;
  isVisible?: boolean;
  isLocked?: boolean;
  parentId?: string;
}

export interface ImageElement extends CanvasElementBase {
  type: 'image';
  href?: string;
  mimeType?: string;
  borderRadius?: number;
  image?: HTMLImageElement; // 存储加载完成的图片对象
  videoPrompt?: string; // 图生视频的提示词，每个图片独立保存
}

export interface PathElement extends CanvasElementBase {
  type: 'path' | 'line';
  points: Point[];
  strokeColor: string;
  strokeWidth: number;
  strokeOpacity?: number;
}

export interface ShapeElement extends CanvasElementBase {
    type: 'shape';
    shapeType: 'rectangle' | 'circle' | 'triangle' | 'ellipse';
    strokeColor: string;
    strokeWidth: number;
    fillColor: string;
    borderRadius?: number;
    strokeDashArray?: [number, number];
}

export interface TextElement extends CanvasElementBase {
    type: 'text';
    text: string;
    fontSize: number;
    fontColor?: string;
    fillColor?: string;
    fontFamily?: string;
    fontWeight?: string;
}

export interface ArrowElement extends CanvasElementBase {
    type: 'arrow';
    points: [Point, Point];
    strokeColor: string;
    strokeWidth: number;
}

export interface LineElement extends CanvasElementBase {
    type: 'line';
    points: [Point, Point];
    strokeColor: string;
    strokeWidth: number;
    strokeOpacity?: number;
}

export interface GroupElement extends CanvasElementBase {
    type: 'group';
}

export interface VideoElement extends CanvasElementBase {
    type: 'video';
    href?: string;
    videoUrl?: string;
    thumbnailUrl?: string;
    video?: HTMLVideoElement;
    isPlaying?: boolean; // 是否正在播放
}

export type Element = ImageElement | PathElement | ShapeElement | TextElement | ArrowElement | LineElement | GroupElement | VideoElement;

export interface UserEffect {
  id: string;
  name: string;
  value: string;
}

export interface Board {
  id: string;
  name: string;
  elements: Element[];
  history?: Element[][];
  historyIndex?: number;
  panOffset?: Point;
  zoom?: number;
  canvasBackgroundColor?: string;
  sessionId?: string;
  isLoading?: boolean; // 标记画板是否正在加载图片
}