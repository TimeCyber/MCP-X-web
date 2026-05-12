import pptxgen from 'pptxgenjs';

/* PPT 尺寸（inches, LAYOUT_WIDE 16:9） */
const SLIDE_W_IN = 13.333;
const SLIDE_H_IN = 7.5;

export interface TextElement {
  text: string;
  x: number; y: number; w: number; h: number;  // 比例 0~1
  fontSize: number;                              // pt
  bold: boolean;
  italic: boolean;
  color: string;                                  // hex 不含 #
  align: 'left' | 'center' | 'right';
  valign: 'top' | 'middle' | 'bottom';
  fontFamily?: string;                            // 原始 CSS font-family
  isChinese?: boolean;                            // 是否包含中文（用于字体映射）
}

export interface CaptureResult {
  index: number;
  dataUrl: string;     // 背景截图（不含文字）
  width: number;
  height: number;
  texts: TextElement[]; // 叠加的可编辑文字
}

/* ─────────────────────────────────────────────────────────────
   注入到目标 iframe 的截图脚本。
   策略：
   1. 找所有 slide
   2. 对每个 slide：
      a) 先扫描文字元素，记录位置 + 样式
      b) 调用 html2canvas，在 onclone 里：
         - 隐藏其他 slide
         - 让当前 slide 撑满视口
         - 把所有文字元素 color 改成 transparent（保留布局和背景，只抹掉文字）
      c) 得到「只有背景」的截图
   3. 组装 pptx 时：背景图 + 真实可编辑文字框
───────────────────────────────────────────────────────────── */
export const SCREENSHOT_SCRIPT = `
(function() {
  /* 版本号：每次改动时 +1，保证旧脚本彻底失效 */
  var VERSION = 8;

  /* 移除任何旧版本注册的 message 监听器 */
  if (window.__mcpxCaptureHandler) {
    try { window.removeEventListener('message', window.__mcpxCaptureHandler); } catch(e) {}
    window.__mcpxCaptureHandler = null;
  }
  /* 标记当前版本，旧版本不会再运行 */
  window.__mcpxShotVersion = VERSION;

  function loadH2C(cb) {
    if (window.html2canvas) { cb(null); return; }
    var urls = [
      'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js',
      'https://unpkg.com/html2canvas@1.4.1/dist/html2canvas.min.js'
    ];
    var i = 0;
    (function next() {
      if (i >= urls.length) { cb(new Error('html2canvas 加载失败')); return; }
      var s = document.createElement('script');
      s.src = urls[i++];
      s.onload = function() { cb(null); };
      s.onerror = next;
      document.head.appendChild(s);
    })();
  }

  function findSlides() {
    var selectors = ['section[data-title]', '.slide', '[data-slide]', '.step', '.page'];
    for (var i = 0; i < selectors.length; i++) {
      var arr = Array.from(document.querySelectorAll(selectors[i]));
      if (arr.length > 0) return { slides: arr, selector: selectors[i] };
    }
    var secs = Array.from(document.querySelectorAll('section'));
    var top = secs.filter(function(el) {
      return !secs.some(function(p) { return p !== el && p.contains(el); });
    });
    return top.length > 0 ? { slides: top, selector: 'section' } : { slides: [document.body], selector: 'body' };
  }

  function rgbToHex(rgb) {
    if (!rgb) return '000000';
    var m = rgb.match(/rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)(?:,\\s*([\\d.]+))?/);
    if (!m) return '000000';
    if (m[4] !== undefined && parseFloat(m[4]) < 0.1) return null;
    return [m[1], m[2], m[3]].map(function(n) {
      return parseInt(n).toString(16).padStart(2, '0');
    }).join('');
  }

  function hasDirectText(el) {
    for (var i = 0; i < el.childNodes.length; i++) {
      var n = el.childNodes[i];
      if (n.nodeType === 3 && n.textContent.trim()) return true;
    }
    return false;
  }

  function extractTexts(slideEl, slideRect, slideW, slideH) {
    var results = [];
    var tags = 'h1,h2,h3,h4,h5,h6,p,li,span,a,button,td,th,label,div,em,strong,b';
    var nodes = slideEl.querySelectorAll(tags);

    nodes.forEach(function(node) {
      if (node.closest && node.closest('.notes')) return;
      if (!hasDirectText(node)) return;
      var text = (node.innerText || node.textContent || '').trim();
      if (!text) return;
      var r = node.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) return;
      if (r.right < slideRect.left || r.left > slideRect.right) return;
      if (r.bottom < slideRect.top || r.top > slideRect.bottom) return;

      var cs = window.getComputedStyle(node);
      if (cs.display === 'none' || cs.visibility === 'hidden') return;
      if (parseFloat(cs.opacity || '1') < 0.1) return;

      var color = rgbToHex(cs.color);
      if (!color) return;

      var fw = cs.fontWeight;
      var bold = fw === 'bold' || parseInt(fw) >= 600;
      var italic = cs.fontStyle === 'italic';

      var align = 'left';
      if (cs.textAlign === 'center') align = 'center';
      else if (cs.textAlign === 'right') align = 'right';

      /* 检测是否包含中文字符（含中日韩统一表意文字） */
      var isChinese = /[\u4e00-\u9fa5\u3040-\u30ff\uac00-\ud7af]/.test(text);

      /* 提取 font-family，去掉引号 */
      var fontFamily = (cs.fontFamily || '').replace(/["']/g, '').trim();

      results.push({
        text: text,
        x: (r.left - slideRect.left) / slideW,
        y: (r.top - slideRect.top) / slideH,
        w: r.width / slideW,
        h: r.height / slideH,
        fontSize: Math.round((parseFloat(cs.fontSize) || 14) * 0.75),
        bold: bold,
        italic: italic,
        color: color,
        align: align,
        valign: 'middle',
        fontFamily: fontFamily,
        isChinese: isChinese,
      });
        valign: 'middle',
      });
    });

    var dedup = [];
    results.forEach(function(t) {
      var dup = dedup.find(function(d) {
        return d.text === t.text &&
               Math.abs(d.x - t.x) < 0.01 &&
               Math.abs(d.y - t.y) < 0.01;
      });
      if (!dup) dedup.push(t);
      else if (t.fontSize > dup.fontSize) Object.assign(dup, t);
    });
    return dedup;
  }

  function run(channel) {
    /* 版本过期守卫：只有最新版本才能响应 */
    if (window.__mcpxShotVersion !== VERSION) return;

    loadH2C(function(err) {
      if (err) {
        window.parent.postMessage({ channel: channel, type: 'capture_error', message: err.message }, '*');
        return;
      }

      var found = findSlides();
      var slides = found.slides;
      console.log('[pptx-v' + VERSION + '] slides:', slides.length, 'selector:', found.selector);

      window.parent.postMessage({ channel: channel, type: 'capture_total', total: slides.length }, '*');

      if (slides.length === 0) return;

      var r0 = slides[0].getBoundingClientRect();
      var VW = Math.round(r0.width  > 100 ? r0.width  : window.innerWidth);
      var VH = Math.round(r0.height > 100 ? r0.height : window.innerHeight);

      function doOne(idx) {
        if (idx >= slides.length) return;
        var el = slides[idx];
        var rect = el.getBoundingClientRect();
        var sw = rect.width  > 100 ? rect.width  : VW;
        var sh = rect.height > 100 ? rect.height : VH;

        var texts = extractTexts(el, rect, sw, sh);

        html2canvas(document.documentElement, {
          useCORS: true,
          allowTaint: true,
          scale: 2,
          backgroundColor: '#ffffff',
          logging: false,
          width: VW,
          height: VH,
          windowWidth: VW,
          windowHeight: VH,
          x: 0, y: 0,
          onclone: function(cdoc) {
            var cSlides = Array.from(cdoc.querySelectorAll(found.selector));
            cSlides.forEach(function(s, i) {
              if (i !== idx) s.style.display = 'none';
            });
            var target = cSlides[idx];
            if (target) {
              target.style.display = 'block';
              target.style.visibility = 'visible';
              target.style.opacity = '1';
              target.style.position = 'fixed';
              target.style.left = '0';
              target.style.top = '0';
              target.style.width = VW + 'px';
              target.style.height = VH + 'px';
              target.style.transform = 'none';
              target.style.zIndex = '99999';
              target.style.overflow = 'hidden';
              target.style.boxSizing = 'border-box';

              var textTags = 'h1,h2,h3,h4,h5,h6,p,li,span,a,button,td,th,label,em,strong,b';
              target.querySelectorAll(textTags).forEach(function(n) {
                if (n.closest && n.closest('.notes')) return;
                n.style.color = 'transparent';
                n.style.textShadow = 'none';
                n.style.textDecorationColor = 'transparent';
                n.style.webkitTextFillColor = 'transparent';
              });
            }
            cdoc.querySelectorAll('.notes').forEach(function(n) { n.style.display = 'none'; });
          }
        }).then(function(canvas) {
          var out = document.createElement('canvas');
          out.width = VW * 2;
          out.height = VH * 2;
          var ctx = out.getContext('2d');
          ctx.drawImage(canvas, 0, 0, VW * 2, VH * 2, 0, 0, VW * 2, VH * 2);

          window.parent.postMessage({
            channel: channel,
            type: 'capture_result',
            index: idx,
            dataUrl: out.toDataURL('image/jpeg', 0.9),
            width: VW,
            height: VH,
            texts: texts,
          }, '*');
          doOne(idx + 1);
        }).catch(function(e) {
          console.error('[pptx-v' + VERSION + '] capture error:', e);
          window.parent.postMessage({
            channel: channel,
            type: 'capture_result',
            index: idx,
            dataUrl: '',
            width: VW,
            height: VH,
            texts: texts,
          }, '*');
          doOne(idx + 1);
        });
      }

      doOne(0);
    });
  }

  /* 注册新监听器，保存到 window 以便下次替换 */
  window.__mcpxCaptureHandler = function(e) {
    if (!e.data || e.data.type !== 'pptx_capture') return;
    /* 再次检查版本，防止旧版本触发 */
    if (window.__mcpxShotVersion !== VERSION) return;
    run(e.data.channel);
  };
  window.addEventListener('message', window.__mcpxCaptureHandler);
})();
`;

/* ── 注入脚本到同源 iframe ── */
export function injectScreenshotScript(iframeDoc: Document): void {
  /* 清除旧版本脚本和所有旧标记 */
  ['__mcpx_screenshot__', '__mcpx_shot_v2__', '__mcpx_shot_v3__'].forEach((id) => {
    const old = iframeDoc.getElementById(id);
    if (old) old.remove();
  });
  /* 清除 iframe window 上的所有旧版本标记 */
  const win = iframeDoc.defaultView as any;
  if (win) {
    ['__mcpxScreenshotInjected', '__mcpxShotV3', '__mcpxShotV4', '__mcpxShotV5'].forEach((k) => {
      try { delete win[k]; } catch (_) { /* ignore */ }
    });
  }

  const s = iframeDoc.createElement('script');
  s.id = '__mcpx_screenshot__';
  s.textContent = SCREENSHOT_SCRIPT;
  (iframeDoc.head || iframeDoc.documentElement).appendChild(s);
}

/* ── 父页面等待截图 ── */
export function captureSlideScreenshots(
  iframe: HTMLIFrameElement,
  timeout = 180000
): Promise<CaptureResult[]> {
  return new Promise((resolve, reject) => {
    const channel = `pptx_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const results: CaptureResult[] = [];
    let total = -1;
    let received = 0;
    let settled = false;

    const cleanup = () => {
      clearTimeout(timer);
      window.removeEventListener('message', handler);
    };

    const finish = (list: CaptureResult[]) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(list.sort((a, b) => a.index - b.index));
    };

    const fail = (err: Error) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(err);
    };

    const timer = setTimeout(() => {
      results.length > 0
        ? finish(results)
        : fail(new Error('截图超时，请检查预览页面是否正常加载'));
    }, timeout);

    const handler = (e: MessageEvent) => {
      if (!e.data || e.data.channel !== channel) return;
      if (e.data.type === 'capture_total') {
        total = e.data.total;
        if (total === 0) finish([]);
      } else if (e.data.type === 'capture_result') {
        if (received >= total && total >= 0) return; // 防止重复
        results.push(e.data as CaptureResult);
        received++;
        if (total >= 0 && received >= total) finish(results);
      } else if (e.data.type === 'capture_error') {
        fail(new Error(e.data.message || '截图失败'));
      }
    };

    window.addEventListener('message', handler);
    setTimeout(() => {
      iframe.contentWindow?.postMessage({ type: 'pptx_capture', channel }, '*');
    }, 300);
  });
}

/* 把 CSS font-family 映射到 PowerPoint 系统自带字体 */
function mapFontFamily(cssFamily: string, isChinese: boolean): string {
  const fam = (cssFamily || '').toLowerCase();

  /* 中文字符：优先用系统自带中文字体，各平台打开效果一致 */
  if (isChinese) {
    if (/kaiti|楷体|kai/i.test(fam)) return '楷体';
    if (/heiti|黑体|hei/i.test(fam)) return '黑体';
    if (/songti|宋体|song|serif/i.test(fam)) return '宋体';
    if (/fangsong|仿宋/i.test(fam)) return '仿宋';
    if (/pingfang|苹方/i.test(fam)) return '苹方';
    /* 默认微软雅黑，Win/Mac/WPS 都内置 */
    return '微软雅黑';
  }

  /* 英文：映射到 PowerPoint 常见字体 */
  if (!fam) return 'Calibri';
  if (/times|serif/i.test(fam)) return 'Times New Roman';
  if (/georgia/i.test(fam)) return 'Georgia';
  if (/courier|mono|consolas/i.test(fam)) return 'Consolas';
  if (/arial|helvetica/i.test(fam)) return 'Arial';
  if (/verdana/i.test(fam)) return 'Verdana';
  if (/tahoma/i.test(fam)) return 'Tahoma';
  if (/cambria/i.test(fam)) return 'Cambria';
  if (/segoe/i.test(fam)) return 'Segoe UI';
  /* 其他统一用 Calibri（PPT 默认） */
  return 'Calibri';
}

/* ── 组装 pptx：背景截图 + 可编辑文字层 ── */
export async function exportToPptx(slides: CaptureResult[], fileName = 'presentation.pptx') {
  const prs = new pptxgen();
  prs.layout = 'LAYOUT_WIDE';
  prs.defineLayout({ name: 'WIDE_16_9', width: SLIDE_W_IN, height: SLIDE_H_IN });

  for (const slide of slides) {
    const s = prs.addSlide();

    if (slide.dataUrl) {
      s.addImage({ data: slide.dataUrl, x: 0, y: 0, w: '100%', h: '100%' });
    }

    /* 叠加可编辑文字 */
    for (const t of (slide.texts || [])) {
      if (t.x < -0.05 || t.y < -0.05 || t.x > 1.05 || t.y > 1.05) continue;
      if (t.w <= 0 || t.h <= 0) continue;

      const x = Math.max(0, +(t.x * SLIDE_W_IN).toFixed(3));
      const y = Math.max(0, +(t.y * SLIDE_H_IN).toFixed(3));
      const w = Math.max(0.1, +(Math.min(t.w, 1) * SLIDE_W_IN).toFixed(3));
      const h = Math.max(0.1, +(Math.min(t.h, 1) * SLIDE_H_IN).toFixed(3));

      const fontFace = mapFontFamily(t.fontFamily || '', !!t.isChinese);

      try {
        s.addText(t.text, {
          x, y, w, h,
          fontSize: Math.max(8, Math.min(t.fontSize, 96)),
          bold: t.bold,
          italic: t.italic,
          color: t.color || '000000',
          align: t.align as any,
          valign: t.valign as any,
          fontFace,
          margin: 0,
          wrap: true,
          /* 不设背景色，保持透明让底图可见 */
        });
      } catch (_) { /* skip */ }
    }
  }

  await prs.writeFile({ fileName });
}
