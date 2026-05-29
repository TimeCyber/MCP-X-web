import { streamChatSend, SendDTO } from './chatApi';
import type { ScriptData, Shot } from '../types/videogen';

/** Seedance 2.0 故事板 Agent 系统提示（剧本分析 → 15 秒分镜提示词） */
export const SEEDANCE_STORYBOARD_AGENT_SYSTEM = `# Role: Seedance 2.0 首席文戏导演 (Cinematic Drama Director)

## Profile
你是一个专门为字节跳动 Seedance 2.0 多模态大模型编写视频提示词的「万能文戏导演」。你精通电影理论中的「场面调度（Mise-en-scène）」，擅长将用户的任何剧情描述（包括悬疑对峙、浪漫情感、悲伤独白、日常写实等），自适应地翻译为 Seedance 2.0 可完美执行的**时间戳分镜**与**动态摄影机运动指令**。

## Background & Theory
1. **文戏场面调度原则：** 利用景深、焦距变化、空间调度与微表情外化心理张力。
2. **Seedance 2.0 专属限制：** 单次最高 15 秒。通过精确到秒的切分（如 0-3s, 4-8s），进行运镜调度，保持人、物、光影一致。
3. **剧情驱动镜头：** 以剧情驱动镜头，不生搬硬套运镜公式。

## Workflow
1. **情感与场景拆解：** 分析核心矛盾、情绪走向与美学风格。
2. **运镜与调度策划：** 匹配镜头语言（浅焦、Dolly in、Static 等）。
3. **15 秒时间戳切分：** 将剧情分配在 15 秒内（通常 2-6 个镜头段落），景别起承转合流畅。

## Output Template
每次输出必须严格使用以下格式：

--- Seedance 2.0 文戏专属提示词 ---

**【1. 风格设定 (Style & Aesthetics)】**
[视觉质感] + [光影风格] + [情绪基调色彩]

**【2. 角色与场景定义 (Characters & Environment)】**
- **角色A：** [外貌、服饰、情绪]
- **场景：** [空间与纵深感]

**【3. 15秒时间戳分镜头描述 (Timestamp Camera Script)】**
- **[0.0s - X.0s] 镜头一：** [景别] + [运镜] + [画面与微表情] + [音效/台词]
- **[X.0s - Y.0s] 镜头二：** ...
- **[Y.0s - 15.0s] 镜头三：** ...

---

收到剧本后，直接按 Workflow 与 Output Template 输出完整提示词，不要多余解释。若剧本较长，先输出第一个 15 秒段落；用户可要求继续下一段。`;

/** 阶段1 剧本结构化：故事板 Agent 模式（仍输出标准 JSON，供后续 15 秒分镜使用） */
export const buildStoryboardScriptParsePrompt = (rawText: string, language: string) => {
  return `你是 Seedance 2.0 首席文戏导演，同时负责将用户输入整理为结构化剧本数据。

用户输入可能是完整剧本、宣传片策划简报或短视频创意描述。你需要：
1. 理解商业/叙事目标，必要时将简报扩写为可拍摄的文戏场景与段落；
2. 为后续「每段 15 秒故事板」生成做准备，段落粒度宜控制在约 15 秒可表现的戏剧单元；
3. 运用场面调度思维：景别、运镜、人物位置、光影层次。

输出语言：${language}

【重要约束】
- 禁止调用任何工具（联网搜索、网页抓取等），仅根据下方用户文本创作；
- 不要输出 markdown 代码块、不要输出任何说明文字，只输出一个 JSON 对象。

【角色 personality 字段】仅写视觉定妆照描述（外貌、发型、服装、配饰），禁止性格词与情节。
【场景 atmosphere 字段】仅写物理空间、布局、陈设、材质，禁止氛围形容词与情节。

剧本/简报内容：
"${rawText.slice(0, 15000)}"

请严格只输出以下 JSON（单行或多行均可，但必须是合法 JSON，且不要用 \`\`\` 包裹）：
{
  "title": "标题",
  "genre": "类型（如：企业宣传片 / 文戏短片）",
  "logline": "梗概（${language}）",
  "characters": [
    {"id": "char1", "name": "角色名", "gender": "性别", "age": "年龄", "personality": "视觉定妆描述"}
  ],
  "scenes": [
    {"id": "scene1", "location": "地点", "time": "时间", "atmosphere": "场景视觉布局描述"}
  ],
  "storyParagraphs": [
    {"id": 1, "text": "本段约15秒可表现的剧情与镜头意图（可含对白/旁白要点）", "sceneRefId": "scene1"}
  ]

注意：scenes 数组至少 1 项且必填；storyParagraphs 至少 1 项，每项 sceneRefId 必须对应 scenes 中已有 id。
}`;
};

/** 分镜表生成：故事板 Agent 模式专用指令片段 */
export const buildStoryboardShotListPrompt = (params: {
  lang: string;
  sceneId: string;
  location: string;
  time: string;
  atmosphere: string;
  genre: string;
  paragraphs: string;
  charactersJson: string;
}) => {
  const { lang, sceneId, location, time, atmosphere, genre, paragraphs, charactersJson } = params;
  return `你是 Seedance 2.0 首席文戏导演，正在将剧本拆解为「15秒故事板」镜头列表。

输出语言: ${lang}

场景: ${location} / ${time} / ${atmosphere}
类型: ${genre}

剧本片段:
"${paragraphs.slice(0, 3000)}"

角色:
${charactersJson}

要求:
1. 每个 shot 代表一个完整的 **15 秒** 故事板段落（duration 字段固定为 "15"）。
2. 将该 15 秒内的 2-6 个时间戳镜头描述写入 actionSummary（含 [0.0s-X.0s] 格式）。
3. visualPrompt 用于生成**单张故事板关键帧图像**：描述该 15 秒段落中最具戏剧张力的代表性画面（景别、构图、人物位置、光影），适合 AI 出图，不超过 120 字。
4. 运镜术语使用电影工业标准（Dolly in, Static, Pan, Focus Pull 等）。
5. 每个 shot 至少包含 start 关键帧；可含 end 关键帧表示段末状态。
6. characters 字段必须填写本段出场角色的 id 数组（从上方角色列表选取，如 ["char1","char2"]），不可留空。

严格输出 JSON 数组:
[
  {
    "id": "shot-1",
    "sceneId": "${sceneId}",
    "shotNumber": 1,
    "actionSummary": "15秒内时间戳分镜脚本（${lang}）",
    "dialogue": "",
    "cameraMovement": "本段主运镜",
    "shotSize": "MS",
    "duration": "15",
    "characters": ["char1"],
    "lighting": "光线描述",
    "mood": "情绪",
    "keyframes": [
      {
        "id": "kf-1-start",
        "type": "start",
        "timestamp": "00:00",
        "visualPrompt": "故事板关键帧画面描述（${lang}）",
        "composition": "构图"
      }
    ],
    "transitionTo": "Cut"
  }
]`;
};

/** 从 Agent 输出中解析时间戳段落 */
export const parseSeedanceTimestampSegments = (text: string): Array<{ range: string; description: string }> => {
  const segments: Array<{ range: string; description: string }> = [];
  const patterns = [
    /\[(\d+(?:\.\d+)?s\s*-\s*\d+(?:\.\d+)?s)\]\s*镜头[^：:\n]*[：:]\s*([^\n]+(?:\n(?!\s*-\s*\*\*\[|\s*-\s*\[)[^\n]+)*)/gi,
    /\*\*\[(\d+(?:\.\d+)?s\s*-\s*\d+(?:\.\d+)?s)\]\s*镜头[^*]*\*\*([^\n]+(?:\n(?!\*\*\[)[^\n]+)*)/gi,
  ];
  for (const re of patterns) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      const range = m[1].trim();
      const description = m[2].trim();
      if (description && !segments.some(s => s.range === range)) {
        segments.push({ range, description });
      }
    }
  }
  return segments;
};

export const extractStyleBlock = (text: string): string => {
  const m = text.match(/【1\.\s*风格设定[^】]*】\*\*([\s\S]*?)(?=\*\*【2\.|$)/i)
    || text.match(/【1\.\s*风格设定[^】]*】([\s\S]*?)(?=【2\.|$)/i);
  return m?.[1]?.trim() || '4K cinematic film still, 35mm lens, dramatic natural lighting, shallow depth of field';
};

/** 从分镜脚本中解析时间戳镜头段落 */
export const parseStoryboardTimestampPanels = (
  content: string
): Array<{ range: string; description: string }> => {
  const panels: Array<{ range: string; description: string }> = [];
  const re = /\[(\d+(?:\.\d+)?s\s*-\s*\d+(?:\.\d+)?s)\]\s*([^\n\[]+)/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(content)) !== null) {
    const description = m[2].trim();
    if (description) {
      panels.push({ range: m[1].trim(), description });
    }
  }
  return panels;
};

/** 解析分镜脚本中的对白、旁白与纯动作文案 */
export const parseStoryboardScript = (content: string) => {
  const panels = parseStoryboardTimestampPanels(content);
  const dialogueMatch = content.match(/对白[:：]\s*"(.+?)"/);
  const narrationMatch = content.match(/旁白[:：]\s*"(.+?)"/);
  const actionOnly = content
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && !/^对白[:：]/.test(line) && !/^旁白[:：]/.test(line))
    .join('\n')
    .trim();
  return {
    panels,
    dialogue: dialogueMatch?.[1]?.trim(),
    narration: narrationMatch?.[1]?.trim(),
    actionOnly,
  };
};

const resolveStoryboardLayout = (panelCount: number): string => {
  if (panelCount <= 1) {
    return '单格大画幅故事板（一个镜头），画面内展示完整人物、场景与动作';
  }
  if (panelCount === 2) {
    return '2格横排分镜故事板，从左到右';
  }
  if (panelCount === 3) {
    return '3格横排分镜故事板，从左到右';
  }
  if (panelCount === 4) {
    return '2x2 四格分镜故事板网格，按阅读顺序排列';
  }
  return `${panelCount}格分镜故事板网格（2行或多行），按时间顺序排列`;
};

const buildStoryboardPanelScript = (
  panels: Array<{ range: string; description: string }>,
  actionOnly: string,
  dialogue?: string,
  narration?: string
): string => {
  const lines: string[] = [];
  if (panels.length > 0) {
    panels.forEach((p, i) => {
      lines.push(`分镜${i + 1} [${p.range}]：${p.description}`);
    });
  } else if (actionOnly) {
    lines.push(`分镜1 [15秒内单镜头]：${actionOnly.replace(/\n/g, ' ')}`);
  }
  if (dialogue) lines.push(`对白（需在对应分镜旁标注）："${dialogue}"`);
  if (narration) lines.push(`旁白（需在对应分镜旁标注）："${narration}"`);
  return lines.join('\n');
};

/** 故事板生图参考图上下文 */
export interface StoryboardReferenceContext {
  sceneName?: string;
  characterNames?: string[];
  hasReferenceImages?: boolean;
}

/** 从镜头与剧本数据构建故事板参考图上下文 */
export const buildStoryboardRefContextFromShot = (
  shot: Shot,
  scriptData: ScriptData | null | undefined,
  referenceImageCount = 0
): StoryboardReferenceContext => {
  const scene = scriptData?.scenes.find(s => String(s.id) === String(shot.sceneId));
  const charIds = shot.characters?.length
    ? shot.characters
    : (scriptData?.characters || []).map(c => c.id);
  const characterNames = charIds
    .map(id => scriptData?.characters.find(c => String(c.id) === String(id))?.name)
    .filter((name): name is string => Boolean(name));
  return {
    sceneName: scene?.location,
    characterNames,
    hasReferenceImages: referenceImageCount > 0,
  };
};

const buildStoryboardReferenceSection = (refContext?: StoryboardReferenceContext): string[] => {
  if (!refContext?.hasReferenceImages) return [];
  const lines = [
    '【参考图约束 — 人物、场景与画风严格还原，禁止改动】',
    '已附带用户提供的角色参考图与场景参考图。人物外貌、脸型、发型、服装、体型、肤色必须与角色参考图完全一致；场景的建筑、空间、陈设、色调、天气与环境必须与场景参考图完全一致。',
    '画风必须与参考图保持一致：相同的色彩饱和度、写实程度、光影质感、材质细节与整体美术风格，全彩呈现，禁止擅自改为黑白、线稿、铅笔速写或灰度分镜风。',
    '禁止改变、重设计、美化、替换或臆造参考图中不存在的人物与场景元素。只允许在保持人物、场景与画风一致的前提下，编排分镜格构图、人物姿态与动作、景别与运镜。',
  ];
  if (refContext.sceneName) {
    lines.push(`场景参考（保持原貌）：${refContext.sceneName}`);
  }
  if (refContext.characterNames && refContext.characterNames.length > 0) {
    lines.push(`角色参考（保持原貌）：${refContext.characterNames.join('、')}`);
  }
  return lines;
};

/** 构建故事板单帧出图提示词 */
export const buildStoryboardImagePrompt = (
  shot: Shot,
  options?: { styleBlock?: string; analysisText?: string; refContext?: StoryboardReferenceContext }
): string => {
  const narrative =
    shot.keyframes?.find(k => k.type === 'start')?.visualPrompt?.trim() ||
    shot.actionSummary?.trim() ||
    'cinematic storyboard';
  const script = shot.dialogue?.trim()
    ? `${narrative}\n对白: "${shot.dialogue.trim()}"`
    : narrative;
  const styleBlock =
    options?.styleBlock?.trim() || extractStyleBlock(options?.analysisText || '');
  const base = wrapStoryboardImagePrompt(script, options?.refContext);
  return styleBlock ? `${base}\n视觉风格参考：${styleBlock}` : base;
};

/**
 * 故事板文生图：拼接界面不展示的默认指令 + 用户分镜脚本
 * 分镜格数由用户文案中的时间戳段落决定（1 个=单镜头，多个=多镜头），总时长 15 秒内
 */
export const wrapStoryboardImagePrompt = (
  narrativeContent: string,
  refContext?: StoryboardReferenceContext
): string => {
  const content = narrativeContent.trim();
  if (!content) return '';

  const { panels, dialogue, narration, actionOnly } = parseStoryboardScript(content);
  const panelCount = panels.length > 0 ? panels.length : 1;
  const layoutHint = resolveStoryboardLayout(panelCount);
  const panelScript = buildStoryboardPanelScript(panels, actionOnly, dialogue, narration);
  const durationHint =
    panels.length > 0
      ? `覆盖时间段：${panels[0].range} 至 ${panels[panels.length - 1].range}`
      : '覆盖本场景 15 秒内的叙事节奏';
  const referenceSection = buildStoryboardReferenceSection(refContext);
  const styleLine = refContext?.hasReferenceImages
    ? '【画风】必须与附带的场景、角色参考图完全一致（全彩、相同写实度/渲染风格/光影/色调），分镜版式为多格故事板布局，禁止黑白线稿或铅笔速写风格。'
    : '【画风】专业影视分镜故事板，全彩，画面清晰，人物与场景可辨识，各格风格统一。';

  return [
    '【任务】生成一张专业影视分镜故事板图（film storyboard sheet），用于导演预演，不是单张无分镜格的精修效果图。',
    `【时长与节奏】${durationHint}，总时长不超过 15 秒；分镜格数 = ${panelCount}，严格按用户文案的时间戳段落划分，不得自行增减镜头。`,
    `【版式】${layoutHint}；格与格之间保留清晰黑色分镜边框；按时间顺序从左到右（或从上到下）展示故事推进。`,
    '【每格画面必须包含】① 人物：可见角色身形、姿态、表情或动作（外貌以参考图为准）；② 场景：建筑/室内/外景/天气等环境（场景以参考图为准）；③ 镜头：景别（远景/全景/中景/近景）与运镜方向。',
    ...referenceSection,
    '【故事流程与文案】画面内容必须忠实还原下方「用户分镜脚本」；每个分镜格下方或旁边用中文标注该格对应的文案说明（时间戳 + 动作描述），对白/旁白写在相应分镜旁。',
    styleLine,
    '【用户分镜脚本 — 严格按此绘制】',
    panelScript,
    '【禁止】超写实无分镜格单张大图、只有空景没有人物、自行编造脚本中没有的剧情、改变参考图中的人物或场景外观、擅自转成黑白/线稿/素描风格。',
  ].join('\n');
};

/** 故事板视频：构建 referenceMaterials（仅资产库场景+角色参考图，不含已生成镜头图） */
export const buildStoryboardVideoReferenceMaterials = (
  assetRefUrls: string[],
  excludeUrls: string[] = []
): Array<{ type: 'image'; url: string }> => {
  const excluded = new Set(excludeUrls.filter(Boolean));
  return assetRefUrls
    .filter(url => url && (url.startsWith('http') || url.startsWith('data:image')) && !excluded.has(url))
    .map(url => ({ type: 'image' as const, url }));
};

/** 调用故事板 Agent 分析完整剧本 */
export const analyzeScriptWithStoryboardAgent = async (
  rawScript: string,
  textModel: string,
  options?: {
    userId?: string;
    sessionId?: string;
    onDelta?: (accumulated: string) => void;
  }
): Promise<string> => {
  const userId = options?.userId || localStorage.getItem('userId');
  if (!userId) throw new Error('用户未登录');

  let fullText = '';

  const sendData: SendDTO = {
    messages: [
      { role: 'system', content: SEEDANCE_STORYBOARD_AGENT_SYSTEM },
      {
        role: 'user',
        content: `请分析以下文戏剧情，并输出完整的 Seedance 2.0 文戏专属提示词（含风格、角色场景、15秒时间戳分镜）。若剧情较长，至少完整输出第一个 15 秒段落的时间戳脚本。\n\n---\n${rawScript.slice(0, 12000)}`,
      },
    ],
    model: textModel || 'deepseek-chat',
    stream: true,
    userId: String(userId),
    sessionId: options?.sessionId,
    appId: 'mcpx-video-studio',
  };

  await new Promise<void>((resolve, reject) => {
    streamChatSend(
      sendData,
      (chunk) => {
        const delta = chunk.choices?.[0]?.delta?.content;
        if (delta) {
          fullText += delta;
          options?.onDelta?.(fullText);
        }
      },
      (err) => reject(err),
      () => resolve()
    );
  });

  return fullText.trim();
};

/** 将 Agent 分析结果同步到镜头 visualPrompt */
export const applyStoryboardAnalysisToShots = (
  shots: Shot[],
  analysisText: string
): Shot[] => {
  const styleBlock = extractStyleBlock(analysisText);
  const segments = parseSeedanceTimestampSegments(analysisText);

  if (segments.length === 0) {
    return shots.map(s => ({
      ...s,
      keyframes: (s.keyframes || []).map(k =>
        k.type === 'start'
          ? { ...k, visualPrompt: buildStoryboardImagePrompt(s, { styleBlock, analysisText }) }
          : k
      ),
    }));
  }

  return shots.map((shot, idx) => {
    const seg = segments[idx] || segments[segments.length - 1];
    const segmentScript = seg ? `[${seg.range}] ${seg.description}` : shot.actionSummary;
    const visualPrompt = buildStoryboardImagePrompt(
      { ...shot, actionSummary: segmentScript },
      { styleBlock, analysisText }
    );
    const keyframes = [...(shot.keyframes || [])];
    const startIdx = keyframes.findIndex(k => k.type === 'start');
    const startKf = {
      id: startIdx >= 0 ? keyframes[startIdx].id : `kf-${shot.id}-start`,
      type: 'start' as const,
      visualPrompt,
      status: 'pending' as const,
      ...(startIdx >= 0 ? keyframes[startIdx] : {}),
    };
    if (startIdx >= 0) keyframes[startIdx] = startKf;
    else keyframes.push(startKf);

    return {
      ...shot,
      actionSummary: segmentScript || shot.actionSummary,
      keyframes,
      interval: shot.interval
        ? { ...shot.interval, duration: 15 }
        : undefined,
    };
  });
};
