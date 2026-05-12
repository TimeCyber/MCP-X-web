import React, { useState, useRef, useEffect } from 'react';
import { ExternalLink, Edit3, Download, RefreshCw } from 'lucide-react';
import { Logo } from '../ui/Logo';
import { getStaticListUrl, getStaticFileUrl } from '../../services/appBuildApi';

interface ElementInfo {
  tagName: string;
  id?: string;
  className?: string;
  textContent?: string;
  selector: string;
  pagePath?: string;
}

interface CodePreviewProps {
  previewUrl?: string;
  isGenerating?: boolean;
  isEditMode?: boolean;
  selectedElementInfo?: ElementInfo | null;
  onToggleEditMode?: () => void;
  onClearSelection?: () => void;
  onElementSelected?: (elementInfo: ElementInfo) => void;
  onDownloadCode?: () => void;
  onSaveCode?: (filePath: string, content: string) => void;
  isOwner?: boolean;
  className?: string;
  appId?: string;
  codeGenType?: string;
  logs?: Array<{ time: string; level: string; message: string }>;
  onClearLogs?: () => void;
  logsLoading?: boolean;
  onRefreshLogs?: () => void;
  /** 直接编辑：文字修改完成后的回调 */
  onDirectTextEdit?: (selector: string, oldText: string, newText: string) => void;
  /** 直接编辑：拖拽重排完成后的回调 */
  onDirectDragReorder?: (movedSelector: string, referenceSelector: string, position: 'before' | 'after') => void;
  /** 暴露 iframe ref 给父组件（用于导出等操作） */
  iframeRef?: React.RefObject<HTMLIFrameElement>;
}

export const CodePreview: React.FC<CodePreviewProps> = ({
  previewUrl,
  isGenerating,
  isEditMode = false,
  selectedElementInfo,
  onToggleEditMode,
  onClearSelection: _onClearSelection,
  onElementSelected,
  onDownloadCode,
  onSaveCode,
  isOwner = true,
  className = '',
  appId,
  codeGenType,
  logs = [],
  onClearLogs,
  logsLoading = false,
  onRefreshLogs,
  onDirectTextEdit,
  onDirectDragReorder,
  iframeRef: externalIframeRef,
}) => {
  const internalIframeRef = useRef<HTMLIFrameElement>(null);
  const iframeRef = externalIframeRef || internalIframeRef;
  const isSrcdocInjectedRef = useRef(false); // 防止跨域 srcdoc 注入后重复处理
  const [previewReady, setPreviewReady] = useState(false);
  /** 直接编辑子模式（true=直接编辑，false=AI选中） */
  const [directEditMode, setDirectEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState<'preview' | 'code' | 'logs'>('preview');
  const [codeText, setCodeText] = useState('');
  const [loadingCode, setLoadingCode] = useState(false);
  const [codeError, setCodeError] = useState('');
  const [selectedPath, setSelectedPath] = useState<string>('');
  const [selectedLines, setSelectedLines] = useState<{ start: number; end: number } | null>(null);
  const [isCodeEditing, setIsCodeEditing] = useState(false);
  const [editingContent, setEditingContent] = useState('');

  type FileNode = {
    name: string;
    path: string; // 服务端返回以 / 开头
    type: 'file' | 'dir';
    children?: FileNode[];
  };

  const [fileTree, setFileTree] = useState<FileNode | null>(null);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set(['/']));

  // 新窗口打开预览
  const openInNewTab = () => {
    if (previewUrl) {
      window.open(previewUrl, '_blank');
    }
  };

  // 编辑器脚本内容（内联，同源/跨域均可用）
  const EDITOR_SCRIPT_CONTENT = `(function() {
  if (window.__mcpxEditorInjected) return;
  window.__mcpxEditorInjected = true;

  /* ===== Console forwarding ===== */
  try {
    var _origError = console.error;
    var _origWarn = console.warn;
    console.error = function() {
      _origError.apply(console, arguments);
      try { window.parent.postMessage({ type: 'console_error', message: Array.prototype.slice.call(arguments).map(function(a){ return typeof a === 'object' ? JSON.stringify(a) : String(a); }).join(' ') }, '*'); } catch(e) {}
    };
    console.warn = function() {
      _origWarn.apply(console, arguments);
      try { window.parent.postMessage({ type: 'console_warn', message: Array.prototype.slice.call(arguments).map(function(a){ return typeof a === 'object' ? JSON.stringify(a) : String(a); }).join(' ') }, '*'); } catch(e) {}
    };
    window.addEventListener('error', function(ev) {
      try { window.parent.postMessage({ type: 'console_error', message: ev.message + (ev.filename ? ' (' + ev.filename + ':' + ev.lineno + ')' : '') }, '*'); } catch(e) {}
    });
    window.addEventListener('unhandledrejection', function(ev) {
      try { window.parent.postMessage({ type: 'console_error', message: 'Unhandled Promise: ' + (ev.reason && ev.reason.message ? ev.reason.message : String(ev.reason)) }, '*'); } catch(e) {}
    });
  } catch(e) {}

  /* ===== State ===== */
  var isEditModeActive = false;
  var isDirectEditActive = false;
  var overlay = null;
  var mouseMoveHandler = null;
  /* direct-edit text state */
  var activeTextEl = null;
  var activeTextOld = '';
  /* direct-edit drag state */
  var dragEl = null;
  var dragGhost = null;
  var dropLine = null;
  var dragOffsetX = 0, dragOffsetY = 0;
  var dragStarted = false;
  var dropTarget = null;
  var dropBefore = true;
  var DRAG_THRESHOLD = 5;
  var TEXT_TAGS = {P:1,H1:1,H2:1,H3:1,H4:1,H5:1,H6:1,SPAN:1,A:1,BUTTON:1,LI:1,TD:1,TH:1,LABEL:1,DIV:1};

  /* ===== Shared helpers ===== */
  function createOverlay() {
    overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;border:2px solid #1890ff;background:rgba(24,144,255,0.1);pointer-events:none;z-index:10000;transition:all 0.1s ease;';
    document.body.appendChild(overlay);
  }
  function updateOverlay(el) {
    if (!overlay || !el) return;
    var r = el.getBoundingClientRect();
    overlay.style.left = r.left + 'px';
    overlay.style.top = r.top + 'px';
    overlay.style.width = r.width + 'px';
    overlay.style.height = r.height + 'px';
    overlay.style.display = 'block';
  }
  function cssEscape(s) {
    try { if (window.CSS && CSS.escape) return CSS.escape(s); } catch(e) {}
    return String(s).replace(/([!"#$%&'()*+,./:;<=>?@\\[\\\\\\]^\`{|}~])/g,'\\\\$1');
  }
  function generateSelector(el) {
    if (el.id) return '#' + cssEscape(el.id);
    var sel = el.tagName.toLowerCase();
    var tokens = el.classList && el.classList.length ? Array.from(el.classList) : (el.className ? String(el.className).split(' ') : []);
    tokens = tokens.map(function(c){return c && c.trim();}).filter(Boolean);
    if (tokens.length) sel += '.' + tokens.map(cssEscape).join('.');
    if (document.querySelectorAll(sel).length > 1 && el.parentElement && el.parentElement !== document.body) {
      sel = generateSelector(el.parentElement) + ' > ' + sel;
    }
    return sel;
  }

  /* ===== AI Select Mode ===== */
  function handleAIClick(e) {
    if (!isEditModeActive || isDirectEditActive) return;
    e.preventDefault(); e.stopPropagation();
    var el = e.target;
    if (!el || el === document.body || el === document.documentElement) return;
    updateOverlay(el);
    window.parent.postMessage({ type: 'elementSelected', data: {
      tagName: el.tagName,
      id: el.id || undefined,
      className: (typeof el.className === 'string' ? el.className : '') || undefined,
      textContent: el.textContent ? el.textContent.substring(0,100) : undefined,
      selector: generateSelector(el),
      pagePath: window.location.pathname
    }}, '*');
  }

  /* ===== Direct Edit: Text Editing ===== */
  function commitTextEdit() {
    if (!activeTextEl) return;
    var el = activeTextEl;
    var newText = el.innerText !== undefined ? el.innerText : (el.textContent || '');
    el.removeAttribute('contenteditable');
    el.removeAttribute('spellcheck');
    el.style.outline = '';
    el.style.minWidth = '';
    var old = activeTextOld;
    activeTextEl = null;
    activeTextOld = '';
    if (newText.trim() !== old.trim()) {
      window.parent.postMessage({ type: 'directTextEdit', selector: generateSelector(el), oldText: old, newText: newText }, '*');
    }
  }
  function cancelTextEdit() {
    if (!activeTextEl) return;
    var el = activeTextEl;
    if (el.innerText !== undefined) { el.innerText = activeTextOld; } else { el.textContent = activeTextOld; }
    el.removeAttribute('contenteditable');
    el.removeAttribute('spellcheck');
    el.style.outline = '';
    el.style.minWidth = '';
    activeTextEl = null;
    activeTextOld = '';
  }
  function startTextEdit(el) {
    if (activeTextEl) commitTextEdit();
    activeTextEl = el;
    activeTextOld = el.innerText !== undefined ? el.innerText : (el.textContent || '');
    el.setAttribute('contenteditable', 'true');
    el.setAttribute('spellcheck', 'false');
    el.style.outline = '2px solid #1890ff';
    el.style.minWidth = '20px';
    el.focus();
    try {
      var range = document.createRange();
      range.selectNodeContents(el);
      var sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    } catch(ex) {}
  }
  function handleDblClick(e) {
    if (!isDirectEditActive || !isEditModeActive) return;
    var el = e.target;
    while (el && el !== document.body) {
      if (TEXT_TAGS[el.tagName]) break;
      el = el.parentElement;
    }
    if (!el || el === document.body) return;
    e.preventDefault(); e.stopPropagation();
    startTextEdit(el);
  }
  function handleEditKeyDown(e) {
    if (!activeTextEl) return;
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); cancelTextEdit(); }
    else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); e.stopPropagation(); commitTextEdit(); }
  }
  function handleDocClickForCommit(e) {
    if (!activeTextEl) return;
    if (!activeTextEl.contains(e.target)) commitTextEdit();
  }

  /* ===== Direct Edit: Drag to Reorder ===== */
  function createDragGhost(el) {
    var ghost = el.cloneNode(true);
    var r = el.getBoundingClientRect();
    ghost.style.cssText = 'position:fixed;opacity:0.55;pointer-events:none;z-index:20000;width:' + r.width + 'px;box-shadow:0 4px 16px rgba(0,0,0,0.2);left:' + r.left + 'px;top:' + r.top + 'px;';
    document.body.appendChild(ghost);
    return ghost;
  }
  function createDropLine() {
    var line = document.createElement('div');
    line.style.cssText = 'position:fixed;height:3px;background:#1890ff;border-radius:2px;z-index:19999;pointer-events:none;display:none;box-shadow:0 0 4px rgba(24,144,255,0.5);';
    document.body.appendChild(line);
    return line;
  }
  function showDropLine(targetEl, before) {
    if (!dropLine) return;
    var r = targetEl.getBoundingClientRect();
    dropLine.style.display = 'block';
    dropLine.style.width = r.width + 'px';
    dropLine.style.left = r.left + 'px';
    dropLine.style.top = (before ? r.top - 2 : r.bottom - 1) + 'px';
  }
  function handleDragMove(e) {
    if (!dragGhost || !dragStarted) return;
    dragGhost.style.left = (e.clientX - dragOffsetX) + 'px';
    dragGhost.style.top = (e.clientY - dragOffsetY) + 'px';
    var siblings = dragEl && dragEl.parentElement
      ? Array.from(dragEl.parentElement.children).filter(function(c){ return c !== dragEl; })
      : [];
    var found = null, before = true;
    for (var i = 0; i < siblings.length; i++) {
      var r = siblings[i].getBoundingClientRect();
      if (r.width === 0 && r.height === 0) continue;
      if (e.clientX >= r.left - 20 && e.clientX <= r.right + 20 && e.clientY >= r.top - 10 && e.clientY <= r.bottom + 10) {
        found = siblings[i];
        before = (e.clientY - r.top) < r.height / 2;
        break;
      }
    }
    if (found) { dropTarget = found; dropBefore = before; showDropLine(found, before); }
    else { dropTarget = null; if (dropLine) dropLine.style.display = 'none'; }
  }
  function finishDrag(e) {
    document.removeEventListener('mousemove', handleDragMove, true);
    document.removeEventListener('mouseup', finishDrag, true);
    if (dragGhost) { dragGhost.remove(); dragGhost = null; }
    if (dropLine) { dropLine.remove(); dropLine = null; }
    if (dragEl) dragEl.style.opacity = '';
    if (dragStarted && dragEl && dropTarget && dragEl.parentElement) {
      var movedSel = generateSelector(dragEl);
      var refSel = generateSelector(dropTarget);
      if (dropBefore) { dragEl.parentElement.insertBefore(dragEl, dropTarget); }
      else { dragEl.parentElement.insertBefore(dragEl, dropTarget.nextSibling || null); }
      window.parent.postMessage({ type: 'directDragReorder', movedSelector: movedSel, referenceSelector: refSel, position: dropBefore ? 'before' : 'after' }, '*');
    }
    dragEl = null; dragStarted = false; dropTarget = null;
  }
  function handleDragMouseDown(e) {
    if (!isDirectEditActive || !isEditModeActive) return;
    if (activeTextEl) return;
    if (e.button !== 0) return;
    var el = e.target;
    if (!el || el === document.body || el === document.documentElement) return;
    if (el.contentEditable === 'true') return;
    var startX = e.clientX, startY = e.clientY;
    var r = el.getBoundingClientRect();
    dragEl = el;
    dragStarted = false;
    dragOffsetX = startX - r.left;
    dragOffsetY = startY - r.top;
    var onMove = function(ev) {
      if (!dragEl) return;
      var dx = ev.clientX - startX, dy = ev.clientY - startY;
      if (!dragStarted && Math.sqrt(dx*dx + dy*dy) > DRAG_THRESHOLD) {
        dragStarted = true;
        dragEl.style.opacity = '0.35';
        dragGhost = createDragGhost(dragEl);
        dropLine = createDropLine();
      }
      if (dragStarted) handleDragMove(ev);
    };
    var onUp = function(ev) {
      document.removeEventListener('mousemove', onMove, true);
      document.removeEventListener('mouseup', onUp, true);
      if (!dragStarted) { dragEl = null; return; }
      finishDrag(ev);
    };
    document.addEventListener('mousemove', onMove, true);
    document.addEventListener('mouseup', onUp, true);
  }

  /* ===== Mode Activation ===== */
  function enterMode(direct) {
    exitMode();
    isEditModeActive = true;
    isDirectEditActive = direct;
    if (!overlay) createOverlay();
    mouseMoveHandler = function(ev) {
      if (!isEditModeActive) return;
      var t = ev.target;
      if (t && t !== document.body && t !== document.documentElement && (!activeTextEl || !activeTextEl.contains(t))) {
        updateOverlay(t);
      }
    };
    document.addEventListener('mousemove', mouseMoveHandler, true);
    if (direct) {
      document.addEventListener('dblclick', handleDblClick, true);
      document.addEventListener('keydown', handleEditKeyDown, true);
      document.addEventListener('click', handleDocClickForCommit, true);
      document.addEventListener('mousedown', handleDragMouseDown, true);
      document.body.style.cursor = 'default';
    } else {
      document.addEventListener('click', handleAIClick, true);
      document.body.style.cursor = 'crosshair';
    }
  }
  function exitMode() {
    cancelTextEdit();
    document.removeEventListener('click', handleAIClick, true);
    document.removeEventListener('dblclick', handleDblClick, true);
    document.removeEventListener('keydown', handleEditKeyDown, true);
    document.removeEventListener('click', handleDocClickForCommit, true);
    document.removeEventListener('mousedown', handleDragMouseDown, true);
    if (mouseMoveHandler) { document.removeEventListener('mousemove', mouseMoveHandler, true); mouseMoveHandler = null; }
    if (overlay) { overlay.remove(); overlay = null; }
    document.body.style.cursor = '';
    isEditModeActive = false;
    isDirectEditActive = false;
  }

  /* ===== Message Handler ===== */
  window.addEventListener('message', function(e) {
    if (!e.data) return;
    if (e.data.type === 'toggleEditMode') {
      if (e.data.enabled) { enterMode(isDirectEditActive); }
      else { exitMode(); }
    } else if (e.data.type === 'setDirectEditMode') {
      isDirectEditActive = e.data.enabled;
      if (isEditModeActive) enterMode(isDirectEditActive);
    } else if (e.data.type === 'clearSelection') {
      if (overlay) overlay.style.display = 'none';
    }
  });
})();`;

  // 向 iframe 注入编辑器脚本（同源：直接操作 DOM；跨域：fetch+srcdoc）
  const handleIframeLoad = async () => {
    setPreviewReady(true);
    if (!iframeRef.current || !isOwner) return;

    // 1. 尝试同源注入
    let iframeDoc: Document | null = null;
    try { iframeDoc = iframeRef.current.contentDocument; } catch (_) { /* 跨域，忽略 */ }

    if (iframeDoc) {
      // 同源：直接注入脚本
      if (!iframeDoc.getElementById('__mcpx_editor__')) {
        const s = iframeDoc.createElement('script');
        s.id = '__mcpx_editor__';
        s.textContent = EDITOR_SCRIPT_CONTENT;
        (iframeDoc.head || iframeDoc.documentElement).appendChild(s);
      }
      setTimeout(() => {
        iframeRef.current?.contentWindow?.postMessage({ type: 'toggleEditMode', enabled: isEditMode }, '*');
        iframeRef.current?.contentWindow?.postMessage({ type: 'setDirectEditMode', enabled: directEditMode }, '*');
        if (!selectedElementInfo) {
          iframeRef.current?.contentWindow?.postMessage({ type: 'clearSelection' }, '*');
        }
      }, 100);
      return;
    }

    // dev 代理预览（Vite/React）：跨域时不要 fetch+srcdoc 整页替换。
    // about:srcdoc 下以 / 开头的模块 URL（/@vite/client、/src/main.tsx）会按「站点根」解析，
    // 落到错误路径拿到 text/html，触发 “Expected JavaScript module but got text/html”。
    const iframeSrcAttr = iframeRef.current.getAttribute('src') || '';
    if (/\/app\/webgen\/dev-proxy\//i.test(iframeSrcAttr)) {
      return;
    }

    // 2. 跨域（React dev server 不同端口）：fetch HTML → 注入脚本 → 作为 srcdoc 写回
    if (isSrcdocInjectedRef.current) {
      // srcdoc 已写入，这次是 srcdoc 加载完成，发送初始状态即可
      setTimeout(() => {
        iframeRef.current?.contentWindow?.postMessage({ type: 'toggleEditMode', enabled: isEditMode }, '*');
        iframeRef.current?.contentWindow?.postMessage({ type: 'setDirectEditMode', enabled: directEditMode }, '*');
        if (!selectedElementInfo) {
          iframeRef.current?.contentWindow?.postMessage({ type: 'clearSelection' }, '*');
        }
      }, 200);
      return;
    }

    const src = iframeRef.current.getAttribute('src');
    if (!src || src === 'about:blank') return;

    try {
      console.log('🔧 跨域 iframe，尝试 fetch+srcdoc 注入编辑器脚本:', src);
      const res = await fetch(src, { mode: 'cors', credentials: 'omit' });
      if (!res.ok) throw new Error(`fetch ${res.status}`);
      let html = await res.text();

      // 去掉 hash，构造 base URL
      const baseUrl = src.replace(/#.*$/, '');

      // srcdoc iframe 的 window.location.href 是 'about:srcdoc'，
      // react-router-dom 调用 new URL(path, 'about:srcdoc') 会崩溃。
      // 解决：在所有模块加载前，先注入 URL 构造器补丁，将 about: 系列 base 替换为真实 dev server 地址。
      const urlPatch = `<script>
(function(){
  var _base="${baseUrl}";
  try{
    var _O=window.URL;
    var _P=function(u,b){
      if(!b||(typeof b==="string"&&b.startsWith("about:"))){b=_base;}
      return new _O(u,b);
    };
    _P.prototype=_O.prototype;
    _P.createObjectURL=_O.createObjectURL.bind(_O);
    _P.revokeObjectURL=_O.revokeObjectURL.bind(_O);
    if(_O.canParse)_P.canParse=_O.canParse.bind(_O);
    window.URL=_P;
  }catch(e){}
  try{
    var _ph=history.pushState.bind(history);
    var _rh=history.replaceState.bind(history);
    history.pushState=function(s,t,u){try{_ph(s,t,u);}catch(e){}};
    history.replaceState=function(s,t,u){try{_rh(s,t,u);}catch(e){}};
  }catch(e){}
})();
<\/script>`;

      const injection = `${urlPatch}<base href="${baseUrl}"><script id="__mcpx_editor__">${EDITOR_SCRIPT_CONTENT}<\/script>`;

      if (html.includes('<head>')) {
        html = html.replace('<head>', `<head>${injection}`);
      } else if (html.includes('<html')) {
        html = html.replace(/(<html[^>]*>)/i, `$1<head>${injection}</head>`);
      } else {
        html = `<head>${injection}</head>` + html;
      }

      isSrcdocInjectedRef.current = true;
      iframeRef.current.srcdoc = html;
      console.log('✅ 跨域编辑器脚本注入成功（srcdoc 模式）');
    } catch (err) {
      console.warn('⚠️ 跨域 iframe 编辑器注入失败（CORS 限制）:', err);
    }
  };

  // isEditMode 关闭时重置直接编辑子模式
  useEffect(() => {
    if (!isEditMode) setDirectEditMode(false);
  }, [isEditMode]);

  // 监听来自iframe的消息
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'elementSelected' && onElementSelected) {
        onElementSelected(event.data.data);
      }
      if (event.data.type === 'directTextEdit' && onDirectTextEdit) {
        onDirectTextEdit(event.data.selector, event.data.oldText, event.data.newText);
      }
      if (event.data.type === 'directDragReorder' && onDirectDragReorder) {
        onDirectDragReorder(event.data.movedSelector, event.data.referenceSelector, event.data.position);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onElementSelected, onDirectTextEdit, onDirectDragReorder]);

  // 向iframe发送编辑模式切换消息
  useEffect(() => {
    if (previewReady && iframeRef.current) {
      try {
        iframeRef.current.contentWindow?.postMessage({ type: 'toggleEditMode', enabled: isEditMode }, '*');
      } catch (error) {
        console.warn('无法发送编辑模式消息:', error);
      }
    }
  }, [isEditMode, previewReady]);

  // 向iframe发送直接编辑子模式切换消息
  useEffect(() => {
    if (previewReady && iframeRef.current) {
      try {
        iframeRef.current.contentWindow?.postMessage({ type: 'setDirectEditMode', enabled: directEditMode }, '*');
      } catch (error) {
        console.warn('无法发送直接编辑模式消息:', error);
      }
    }
  }, [directEditMode, previewReady]);

  // 发送清除选择消息
  useEffect(() => {
    if (previewReady && iframeRef.current && !selectedElementInfo) {
      try {
        iframeRef.current.contentWindow?.postMessage({ type: 'clearSelection' }, '*');
      } catch (error) {
        console.warn('无法发送清除选择消息:', error);
      }
    }
  }, [selectedElementInfo, previewReady]);

  // previewUrl 变化时重置 srcdoc 注入标记
  useEffect(() => {
    isSrcdocInjectedRef.current = false;
  }, [previewUrl]);

  // 当切换到代码 Tab 时，拉取 index.html 源码与目录结构
  useEffect(() => {
    const fetchCode = async () => {
      if (!previewUrl) return;
      setLoadingCode(true);
      setCodeError('');
      try {
        const res = await fetch(previewUrl, { credentials: 'omit' });
        const text = await res.text();
        setCodeText(text);
        setSelectedLines(null);
        _onClearSelection?.();
        // 通过新接口获取目录结构 /static/{deployKey}/list
        try {
          if (appId && codeGenType) {
            const listUrl = getStaticListUrl(String(codeGenType).toUpperCase(), appId);
            const token = localStorage.getItem('token');
            const listRes = await fetch(listUrl, {
              credentials: 'omit',
              headers: token ? { Authorization: `Bearer ${token}` } : undefined,
            });
            if (listRes.ok) {
              const items = await listRes.json();
              const root = normalizeServerTree(items);
              setFileTree(root);
              // 仅在首次无展开记录时设置默认展开
              setExpandedPaths((prev) => (prev && prev.size > 0 ? prev : new Set<string>(['/'])));
            }
          }
        } catch {}
      } catch (e) {
        setCodeError('加载源码失败');
      } finally {
        setLoadingCode(false);
      }
    };
    if (activeTab === 'code') {
      fetchCode();
    }
  }, [activeTab, previewUrl, appId, codeGenType]);

  // 切换到日志 Tab 时自动获取日志
  useEffect(() => {
    if (activeTab === 'logs' && onRefreshLogs) {
      onRefreshLogs();
    }
  }, [activeTab]);

  // 预留的辅助：如需退化到解析HTML资源，可恢复使用
  // const extractAssetPathsFromHtml = (html: string): string[] => { ... };
  // const normalizeRelativePath = (p: string): string => { ... };

  // 规范化服务端树形结构
  const normalizeServerTree = (items: any[]): FileNode => {
    const toNode = (item: any): FileNode => ({
      name: item.name,
      path: item.path,
      type: item.directory ? 'dir' : 'file',
      children: item.children && item.children.length ? item.children.map(toNode) : undefined,
    });
    const root: FileNode = { name: '/', path: '/', type: 'dir', children: items.map(toNode) };
    const sortTree = (node: FileNode) => {
      if (node.children) {
        node.children.sort((a, b) => {
          if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
          return a.name.localeCompare(b.name);
        });
        node.children.forEach(sortTree);
      }
    };
    sortTree(root);
    return root;
  };

  // 解析目录索引页面中的相对链接
  // 目录索引解析方法已不再使用，保留注释方便回退
  // const extractLinksFromDirectoryIndex = (html: string): string[] => { ... };

  // 点击文件，加载并显示
  const handleSelectFile = async (path: string) => {
    if (!previewUrl) return;
    setIsCodeEditing(false);
    setSelectedPath(path);
    // 确保父级目录始终保持展开（如 /src、/src/pages等）
    try {
      const parts = path.split('/').filter(Boolean);
      const parents: string[] = [];
      let acc = '';
      for (let i = 0; i < parts.length - 1; i++) {
        acc += '/' + parts[i];
        parents.push(acc);
      }
      setExpandedPaths((prev) => {
        const next = new Set(prev);
        parents.forEach((p) => next.add(p));
        return next;
      });
    } catch {}
    setSelectedLines(null);
    _onClearSelection?.();
    setLoadingCode(true);
    setCodeError('');
    try {
      const url = getStaticFileUrl(String(codeGenType).toUpperCase(), appId || '', path);
      const token = localStorage.getItem('token');
      // 简单二进制判断
      const isText = /\.(html?|css|js|json|txt|md|svg|vue|ts|tsx|jsx)$/i.test(path);
      const res = await fetch(url, {
        credentials: 'omit',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!isText) {
        setCodeText('该文件为二进制或暂不支持的格式，无法预览。');
      } else {
        const text = await res.text();
        setCodeText(text);
      }
    } catch (e) {
      setCodeError('加载文件失败');
    } finally {
      setLoadingCode(false);
    }
  };

  const toggleExpand = (path: string) => {
    setExpandedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path); else next.add(path);
      return next;
    });
  };

  // 目录树渲染（使用组件内部状态，避免全局事件带来的折叠问题）
  const renderTree = (node: any, depth: number): React.ReactNode => {
    if (!node) return null;
    const isDir = node.type === 'dir';
    const paddingLeft = 8 + depth * 12;
    if (isDir) {
      const expanded = expandedPaths.has(node.path);
      return (
        <div key={node.path}>
          <div
            className="cursor-pointer select-none px-1 py-1 hover:bg-slate-100 rounded"
            style={{ paddingLeft }}
            onClick={(e) => {
              e.stopPropagation();
              toggleExpand(node.path);
            }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <span className="mr-1 text-slate-500">{expanded ? '▼' : '▶'}</span>
            <span className="font-medium text-slate-700">{node.name === '/' ? '根目录' : node.name}</span>
          </div>
          {expanded && node.children && node.children.map((c: any) => renderTree(c, depth + 1))}
        </div>
      );
    }
    const isActive = selectedPath === node.path;
    return (
      <div
        key={node.path}
        className={`cursor-pointer select-none px-1 py-1 rounded text-slate-700 ${isActive ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-100'}`}
        style={{ paddingLeft }}
        onClick={(e) => { e.stopPropagation(); handleSelectFile(node.path); }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {node.name}
      </div>
    );
  };

  return (
    <div className={`flex flex-col h-full bg-white rounded-lg shadow-sm border border-slate-200 ${className}`}>
      {/* 预览头部 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('preview')}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              activeTab === 'preview'
                ? 'bg-white text-slate-900 border border-slate-200'
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            网页预览
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              activeTab === 'code'
                ? 'bg-white text-slate-900 border border-slate-200'
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            源代码
          </button>
          {/* 日志Tab暂时隐藏
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors relative ${
              activeTab === 'logs'
                ? 'bg-white text-slate-900 border border-slate-200'
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            日志
            {logs.length > 0 && activeTab !== 'logs' && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
                {logs.length > 99 ? '99' : logs.length}
              </span>
            )}
          </button>
          */}
        </div>
        <div className="flex items-center gap-2">
          {previewUrl && (
            <button
              onClick={() => {
                try {
                  iframeRef.current?.contentWindow?.location.reload();
                } catch (e) {
                  // ignore
                }
              }}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
              title="刷新预览"
            >
              <RefreshCw size={14} />
              刷新
            </button>
          )}
          {isOwner && previewUrl && (
            <button
              onClick={onToggleEditMode}
              className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded-md transition-colors ${
                isEditMode
                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              }`}
              title={isEditMode ? '退出编辑模式' : '进入编辑模式'}
            >
              <Edit3 size={14} />
              {isEditMode ? '退出编辑' : '编辑模式'}
            </button>
          )}
          {onDownloadCode && (
            <button
              onClick={onDownloadCode}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
              title="下载代码"
            >
              <Download size={14} />
              下载
            </button>
          )}
          {previewUrl && (
            <button
              onClick={openInNewTab}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
              title="新窗口打开"
            >
              <ExternalLink size={14} />
              新窗口
            </button>
          )}
        </div>
      </div>

      {/* 选中元素信息 */}
      {/* {selectedElementInfo && (
        <div className="mx-4 mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-1 text-xs font-mono bg-blue-100 text-blue-800 rounded">
                  {selectedElementInfo.tagName.toLowerCase()}
                </span>
                {selectedElementInfo.id && (
                  <span className="px-2 py-1 text-xs font-mono bg-green-100 text-green-800 rounded">
                    #{selectedElementInfo.id}
                  </span>
                )}
                {selectedElementInfo.className && (
                  <span className="px-2 py-1 text-xs font-mono bg-yellow-100 text-yellow-800 rounded">
                    .{selectedElementInfo.className.split(' ').join('.')}
                  </span>
                )}
              </div>
              {selectedElementInfo.textContent && (
                <p className="text-xs text-slate-600 mb-1">
                  内容: {selectedElementInfo.textContent.substring(0, 50)}
                  {selectedElementInfo.textContent.length > 50 ? '...' : ''}
                </p>
              )}
              <p className="text-xs text-slate-500 font-mono">
                选择器: {selectedElementInfo.selector}
              </p>
            </div>
            <button
              onClick={onClearSelection}
              className="ml-2 p-1 text-slate-400 hover:text-slate-600 rounded"
              title="清除选择"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )} */}

      {/* 预览/代码内容 */}
      <div className="flex-1 relative overflow-hidden">
        {activeTab === 'preview' ? (
          !previewUrl ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500">
              <div className="mb-3">
                <Logo className="h-12 w-12" />
              </div>
            <p className="text-sm">网站文件生成完成后将在这里展示</p>
          </div>
        ) : (
          <>
            <iframe
              ref={iframeRef}
              src={previewUrl}
              className="w-full h-full border-none"
              onLoad={handleIframeLoad}
              title="网站预览"
            />
            {isGenerating && (
              <div className="absolute inset-0 pointer-events-none flex items-start justify-end p-3">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white/90 backdrop-blur rounded-md shadow border border-slate-200">
                    <Logo className="h-4 w-4" />
                    <span className="text-xs text-slate-700 animate-pulse">正在生成中…</span>
                  </div>
                </div>
              )}
            </>
          )
        ) : (
          <div className="w-full h-full flex bg-slate-50">
            {/* 目录侧栏 */}
            <div className="w-56 shrink-0 border-r border-slate-200 bg-white overflow-auto p-2">
              {!fileTree ? (
                <div className="text-sm text-slate-500 p-2">暂无目录</div>
              ) : (
                <div className="text-sm">
                  {renderTree(fileTree, 0)}
                </div>
              )}
            </div>
            {/* 文件内容区 */}
            <div className="flex-1 min-w-0 h-full flex flex-col overflow-hidden">
              {/* 代码区工具栏 */}
              {!loadingCode && !codeError && codeText && isOwner && (
                <div className="flex items-center justify-end gap-2 px-3 py-1.5 border-b border-slate-200 bg-slate-50 shrink-0">
                  {isCodeEditing ? (
                    <>
                      <button
                        onClick={() => {
                          const filePath = selectedPath || 'index.html';
                          onSaveCode?.(filePath, editingContent);
                          setIsCodeEditing(false);
                        }}
                        className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                      >
                        发送修改给 AI
                      </button>
                      <button
                        onClick={() => { setIsCodeEditing(false); setEditingContent(codeText); }}
                        className="px-3 py-1 text-xs text-slate-600 border border-slate-300 rounded hover:bg-slate-100 transition-colors"
                      >
                        取消
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => { setIsCodeEditing(true); setEditingContent(codeText); }}
                      className="px-3 py-1 text-xs text-slate-600 border border-slate-300 rounded hover:bg-slate-100 transition-colors flex items-center gap-1"
                    >
                      <Edit3 size={12} />
                      编辑代码
                    </button>
                  )}
                </div>
              )}

              <div className="flex-1 overflow-auto">
                {!previewUrl ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-500">
                    <div className="text-4xl mb-4">📄</div>
                    <p className="text-sm">暂无可展示的源码</p>
                  </div>
                ) : loadingCode ? (
                  <div className="flex items-center justify-center h-full text-slate-500">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mr-2"></div>
                    <span className="text-sm">加载中…</span>
                  </div>
                ) : codeError ? (
                  <div className="text-center text-sm text-red-600 p-4">{codeError}</div>
                ) : isCodeEditing ? (
                  /* 编辑模式：可编辑 textarea */
                  <textarea
                    className="w-full h-full p-3 font-mono text-[12px] leading-5 text-slate-800 bg-white border-none outline-none resize-none"
                    value={editingContent}
                    onChange={(e) => setEditingContent(e.target.value)}
                    spellCheck={false}
                    autoCorrect="off"
                    autoCapitalize="off"
                  />
                ) : (
                  /* 只读模式：行号 + 代码 */
                  <div className="text-[12px] leading-5 font-mono bg-white h-full select-none">
                    {isEditMode && (
                      <div className="px-3 py-1 text-xs text-slate-500 bg-slate-50 border-b border-slate-200">
                        单击/Shift+单击多行，可选中代码发给 AI
                      </div>
                    )}
                    {isEditMode && selectedLines && (
                      <div className="px-3 py-1 text-xs text-blue-700 bg-blue-50 border-b border-slate-200">
                        已选中 {selectedPath || 'index.html'} 第 {selectedLines.start}-{selectedLines.end} 行
                      </div>
                    )}
                    {(codeText.split(/\r?\n/)).map((line, i) => {
                      const lineNo = i + 1;
                      const inSel = selectedLines && lineNo >= Math.min(selectedLines.start, selectedLines.end) && lineNo <= Math.max(selectedLines.start, selectedLines.end);
                      return (
                        <div
                          key={i}
                          className={`flex items-start ${inSel ? 'bg-blue-50' : ''}`}
                          onClick={(e) => {
                            if (!isEditMode) return;
                            const withShift = (e as React.MouseEvent<HTMLDivElement>).shiftKey;
                            setSelectedLines((prev) => {
                              const next = !prev || !withShift ? { start: lineNo, end: lineNo } : { start: prev.start, end: lineNo };
                              try {
                                const start = Math.min(next.start, next.end);
                                const end = Math.max(next.start, next.end);
                                const snippet = codeText.split(/\r?\n/).slice(start - 1, end).join('\n').slice(0, 500);
                                onElementSelected?.({
                                  tagName: 'CODE',
                                  selector: `${(selectedPath || 'index.html')}:${start}-${end}`,
                                  textContent: snippet,
                                  pagePath: selectedPath || 'index.html',
                                } as any);
                              } catch {}
                              return next;
                            });
                          }}
                        >
                          <div className="w-12 shrink-0 select-none text-right pr-3 py-0.5 text-slate-400 border-r border-slate-100">{lineNo}</div>
                          <div className="whitespace-pre-wrap break-words px-3 py-0.5 text-slate-800">{line || '\u00A0'}</div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        {activeTab === 'logs' && (
          <div className="w-full h-full flex flex-col bg-slate-900 text-slate-200">
            {/* 日志工具栏 */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-slate-700 bg-slate-800 shrink-0">
              <span className="text-xs text-slate-400">Dev Server 日志 ({logs.length})</span>
              <div className="flex items-center gap-2">
                {onRefreshLogs && (
                  <button
                    onClick={onRefreshLogs}
                    disabled={logsLoading}
                    className="px-2 py-1 text-xs text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors disabled:opacity-50"
                  >
                    {logsLoading ? '加载中...' : '刷新'}
                  </button>
                )}
                {logs.length > 0 && onClearLogs && (
                  <button
                    onClick={onClearLogs}
                    className="px-2 py-1 text-xs text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"
                  >
                    清空
                  </button>
                )}
              </div>
            </div>
            {/* 日志内容 */}
            <div className="flex-1 overflow-auto p-2 font-mono text-xs">
              {logsLoading && logs.length === 0 ? (
                <div className="flex items-center justify-center h-full text-slate-500">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-slate-400 mr-2"></div>
                  <span className="text-sm">加载日志中...</span>
                </div>
              ) : logs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-500">
                  <div className="text-3xl mb-3">📋</div>
                  <p className="text-sm">暂无日志</p>
                  <p className="text-xs mt-1 text-slate-600">Dev Server 运行时的错误和警告会显示在这里</p>
                  {onRefreshLogs && (
                    <button
                      onClick={onRefreshLogs}
                      className="mt-3 px-3 py-1.5 text-xs text-slate-400 border border-slate-600 rounded hover:bg-slate-800 transition-colors"
                    >
                      点击获取日志
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-0.5">
                  {logs.map((log, i) => (
                    <div
                      key={i}
                      className={`flex items-start gap-2 px-2 py-1 rounded ${
                        log.level === 'error' ? 'bg-red-900/30 text-red-300' :
                        log.level === 'warn' ? 'bg-yellow-900/20 text-yellow-300' :
                        'text-slate-300'
                      }`}
                    >
                      <span className="shrink-0 text-slate-500 select-none">{log.time}</span>
                      <span className={`shrink-0 w-12 text-center rounded text-[10px] font-bold uppercase ${
                        log.level === 'error' ? 'text-red-400' :
                        log.level === 'warn' ? 'text-yellow-400' :
                        'text-blue-400'
                      }`}>{log.level}</span>
                      <span className="whitespace-pre-wrap break-all">{log.message}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// legacy render removed
