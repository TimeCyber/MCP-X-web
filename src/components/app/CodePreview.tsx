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
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const isSrcdocInjectedRef = useRef(false); // 防止跨域 srcdoc 注入后重复处理
  const [previewReady, setPreviewReady] = useState(false);
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
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
  var isEditModeActive = false;
  var overlay = null;
  var mouseMoveHandler = null;
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
  function handleClick(e) {
    if (!isEditModeActive) return;
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
  window.addEventListener('message', function(e) {
    if (!e.data) return;
    if (e.data.type === 'toggleEditMode') {
      isEditModeActive = e.data.enabled;
      if (isEditModeActive) {
        if (!overlay) createOverlay();
        document.addEventListener('click', handleClick, true);
        mouseMoveHandler = function(ev) {
          if (!isEditModeActive) return;
          var t = ev.target;
          if (t && t !== document.body && t !== document.documentElement) updateOverlay(t);
        };
        document.addEventListener('mousemove', mouseMoveHandler, true);
        document.body.style.cursor = 'crosshair';
      } else {
        document.removeEventListener('click', handleClick, true);
        if (mouseMoveHandler) { document.removeEventListener('mousemove', mouseMoveHandler, true); mouseMoveHandler = null; }
        if (overlay) { overlay.remove(); overlay = null; }
        document.body.style.cursor = '';
      }
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
        if (!selectedElementInfo) {
          iframeRef.current?.contentWindow?.postMessage({ type: 'clearSelection' }, '*');
        }
      }, 100);
      return;
    }

    // 2. 跨域（React dev server 不同端口）：fetch HTML → 注入脚本 → 作为 srcdoc 写回
    if (isSrcdocInjectedRef.current) {
      // srcdoc 已写入，这次是 srcdoc 加载完成，发送初始状态即可
      setTimeout(() => {
        iframeRef.current?.contentWindow?.postMessage({ type: 'toggleEditMode', enabled: isEditMode }, '*');
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

  // 监听来自iframe的消息
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'elementSelected' && onElementSelected) {
        onElementSelected(event.data.data);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onElementSelected]);

  // 向iframe发送编辑模式切换消息
  useEffect(() => {
    if (previewReady && iframeRef.current) {
      try {
        iframeRef.current.contentWindow?.postMessage({
          type: 'toggleEditMode',
          enabled: isEditMode,
        }, '*');
      } catch (error) {
        console.warn('无法发送编辑模式消息:', error);
      }
    }
  }, [isEditMode, previewReady]);

  // 发送清除选择消息
  useEffect(() => {
    if (previewReady && iframeRef.current && !selectedElementInfo) {
      try {
        iframeRef.current.contentWindow?.postMessage({
          type: 'clearSelection',
        }, '*');
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
      </div>
    </div>
  );
};

// legacy render removed
