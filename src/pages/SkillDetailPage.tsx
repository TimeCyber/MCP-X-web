import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { useLanguage } from '../contexts/LanguageContext';
import { skillApi, SkillServer } from '../services/skillApi';
import {
  ArrowLeft, Zap, Tag, User, Sparkles, Copy, Check,
  BookOpen, Wrench, Settings2, Calendar, Box, ChevronDown, ChevronUp
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// 工具卡片
const ToolCard: React.FC<{ tool: any; lang: string }> = ({ tool, lang }) => {
  const [open, setOpen] = useState(false);
  const hasSchema = !!tool.inputSchema;
  return (
    <div className="rounded-xl border border-gray-800 bg-[#1a1a1a] hover:border-gray-700 transition-all overflow-hidden">
      <div className="flex items-start gap-4 p-4">
        <div className="w-9 h-9 rounded-lg bg-orange-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Zap size={16} className="text-orange-500" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-gray-100 font-semibold font-mono text-sm">{tool.name || tool.toolName}</h4>
            {hasSchema && (
              <button onClick={() => setOpen(!open)} className="text-gray-500 hover:text-gray-300 flex-shrink-0">
                {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            )}
          </div>
          {(tool.description || tool.toolDescription) && (
            <p className="text-gray-400 text-sm mt-1 leading-relaxed">{tool.description || tool.toolDescription}</p>
          )}
        </div>
      </div>
      {open && hasSchema && (
        <div className="border-t border-gray-800 bg-black/30 px-4 py-3">
          <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wider">
            {lang === 'zh' ? '输入参数' : 'Input Schema'}
          </p>
          <pre className="text-xs text-gray-300 overflow-x-auto font-mono leading-relaxed">
            {typeof tool.inputSchema === 'string' ? tool.inputSchema : JSON.stringify(tool.inputSchema, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export const SkillDetailPage: React.FC = () => {
  const { currentLanguage } = useLanguage();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const searchQ = params.get('q');

  const [skill, setSkill] = useState<SkillServer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'tools' | 'config'>('overview');
  const [copiedConfig, setCopiedConfig] = useState(false);
  const lang = currentLanguage;

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setLoading(true);
      try {
        const res = await skillApi.getDetail(id);
        if (res.code === 200 && res.data) setSkill(res.data);
        else setError(lang === 'zh' ? 'Skill 不存在' : 'Skill not found');
      } catch { setError(lang === 'zh' ? '加载失败' : 'Failed to load'); }
      finally { setLoading(false); }
    };
    load();
  }, [id]);

  const goBack = () => {
    if (searchQ) navigate(`/skill?q=${encodeURIComponent(searchQ)}`);
    else navigate('/skill');
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedConfig(true);
    setTimeout(() => setCopiedConfig(false), 2000);
  };

  if (!id || (!loading && (error || !skill))) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col">
        <Navbar />
        <div className="flex-grow flex flex-col items-center justify-center">
          <p className="text-gray-400 mb-4">{error || (lang === 'zh' ? 'Skill 不存在' : 'Skill not found')}</p>
          <button onClick={goBack} className="text-orange-400 hover:text-orange-300 flex items-center text-sm">
            <ArrowLeft size={15} className="mr-1" />{lang === 'zh' ? '返回列表' : 'Back'}
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-orange-500 border-t-transparent" />
        </div>
        <Footer />
      </div>
    );
  }

  const s = skill!;
  const detail = s.skillDetailVo;
  const tools = detail?.toolList || [];
  const readme = lang === 'zh' ? (detail?.readmeCn || detail?.readme) : (detail?.readme || detail?.readmeCn);
  const name = lang === 'zh' ? (s.chineseName || s.nameCn || s.name) : (s.name || s.nameEn || s.chineseName);
  const desc = lang === 'zh' ? (s.descriptionCn || s.description || '') : (s.descriptionEn || s.description || '');
  const configJson = detail?.serverConfig || detail?.envSchema;

  const tabs = [
    { key: 'overview' as const, label: lang === 'zh' ? '概览' : 'Overview', icon: <BookOpen size={14} /> },
    { key: 'tools' as const, label: lang === 'zh' ? `工具${tools.length > 0 ? ` (${tools.length})` : ''}` : `Tools${tools.length > 0 ? ` (${tools.length})` : ''}`, icon: <Wrench size={14} /> },
    { key: 'config' as const, label: lang === 'zh' ? '配置' : 'Config', icon: <Settings2 size={14} /> },
  ];

  const formatDate = (s: SkillServer) => {
    if (s.createdDate) {
      try { const d = new Date(s.createdDate); if (!isNaN(d.getTime())) return d.toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' }); } catch {}
    }
    if (s.gmtCreated) {
      try { return new Date(s.gmtCreated * 1000).toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' }); } catch {}
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Navbar />

      {/* 顶部 Hero 区域 */}
      <div className="bg-[#111111] border-b border-gray-800">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          {/* 返回 */}
          <button onClick={goBack} className="text-gray-500 hover:text-gray-300 flex items-center mb-6 transition-colors text-sm gap-1.5">
            <ArrowLeft size={15} />{lang === 'zh' ? '返回 Skill 列表' : 'Back to Skills'}
          </button>

          <div className="flex items-start gap-6">
            {/* 图标 */}
            <div className="flex-shrink-0">
              {s.icon ? (
                <img src={s.icon} alt="" className="w-20 h-20 rounded-2xl object-cover border border-gray-800" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-400 via-pink-500 to-violet-500 flex items-center justify-center shadow-lg shadow-orange-200">
                  <Sparkles size={36} className="text-white" />
                </div>
              )}
            </div>

            {/* 标题区 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-white">{name}</h1>
                {s.isNew && (
                  <span className="text-[10px] bg-orange-500 text-white px-2 py-0.5 rounded-full font-bold tracking-wide">NEW</span>
                )}
                {s.skillType && (
                  <span className="text-xs bg-violet-500/15 text-violet-300 border border-violet-500/30 px-2.5 py-0.5 rounded-full font-medium">{s.skillType}</span>
                )}
              </div>
              {s.handle && <p className="text-gray-500 font-mono text-sm mb-3">{s.handle}</p>}
              <p className="text-gray-300 leading-relaxed max-w-2xl">{desc}</p>

              {/* 快速统计 */}
              <div className="flex items-center gap-6 mt-4">
                <div className="flex items-center gap-1.5 text-sm text-gray-400">
                  <Zap size={14} className="text-orange-400" />
                  <span className="font-semibold text-gray-100">{(s.usageCount || 0).toLocaleString()}</span>
                  <span>{lang === 'zh' ? '次使用' : 'uses'}</span>
                </div>
                {s.author && (
                  <div className="flex items-center gap-1.5 text-sm text-gray-400">
                    <User size={14} className="text-blue-400" />
                    <span>{s.author}</span>
                  </div>
                )}
                {tools.length > 0 && (
                  <div className="flex items-center gap-1.5 text-sm text-gray-400">
                    <Box size={14} className="text-cyan-500" />
                    <span>{tools.length} {lang === 'zh' ? '个工具' : 'tools'}</span>
                  </div>
                )}
                {formatDate(s) && (
                  <div className="flex items-center gap-1.5 text-sm text-gray-400">
                    <Calendar size={14} className="text-gray-400" />
                    <span>{formatDate(s)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* 右侧操作按钮 */}
            {configJson && (
              <div className="flex-shrink-0 hidden md:block">
                <button
                  onClick={() => handleCopy(typeof configJson === 'string' ? configJson : JSON.stringify(configJson, null, 2))}
                  className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-xl transition-colors text-sm shadow-sm shadow-orange-200"
                >
                  {copiedConfig ? <Check size={15} /> : <Copy size={15} />}
                  {copiedConfig ? (lang === 'zh' ? '已复制' : 'Copied!') : (lang === 'zh' ? '复制配置' : 'Copy Config')}
                </button>
              </div>
            )}
          </div>

          {/* Tab 导航 */}
          <div className="flex gap-0 mt-8 -mb-px">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-700'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 主内容区 */}
      <main className="flex-grow container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex gap-8">
          {/* 左侧内容 */}
          <div className="flex-1 min-w-0">

            {/* 概览 Tab */}
            {activeTab === 'overview' && (
              <div className="bg-[#1a1a1a] rounded-2xl border border-gray-800 p-8">
                {readme ? (
                  <div className="prose prose-invert max-w-none prose-headings:font-bold prose-headings:text-white prose-p:text-gray-300 prose-p:leading-relaxed prose-a:text-orange-400 prose-a:no-underline hover:prose-a:underline prose-code:text-orange-300 prose-code:bg-orange-500/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-pre:bg-black prose-pre:text-gray-100 prose-pre:rounded-xl prose-blockquote:border-orange-400 prose-blockquote:text-gray-400 prose-strong:text-gray-100 prose-li:text-gray-300">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{readme}</ReactMarkdown>
                  </div>
                ) : desc ? (
                  <p className="text-gray-300 leading-relaxed">{desc}</p>
                ) : (
                  <div className="text-center py-20">
                    <BookOpen size={48} className="mx-auto mb-4 text-gray-700" />
                    <p className="text-gray-500">{lang === 'zh' ? '暂无详细说明' : 'No description available'}</p>
                  </div>
                )}
              </div>
            )}

            {/* 工具 Tab */}
            {activeTab === 'tools' && (
              <div>
                {tools.length === 0 ? (
                  <div className="bg-[#1a1a1a] rounded-2xl border border-gray-800 p-8 text-center py-20">
                    <Wrench size={48} className="mx-auto mb-4 text-gray-700" />
                    <p className="text-gray-500">{lang === 'zh' ? '暂无工具信息' : 'No tools available'}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {tools.map((tool: any, i: number) => (
                      <ToolCard key={i} tool={tool} lang={lang} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 配置 Tab */}
            {activeTab === 'config' && (
              <div className="space-y-5">
                {configJson ? (
                  <div className="bg-[#1a1a1a] rounded-2xl border border-gray-800 overflow-hidden">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
                      <h3 className="text-sm font-semibold text-gray-200">{lang === 'zh' ? '服务配置' : 'Service Configuration'}</h3>
                      <button
                        onClick={() => handleCopy(typeof configJson === 'string' ? configJson : JSON.stringify(configJson, null, 2))}
                        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-200 transition-colors px-3 py-1.5 rounded-lg hover:bg-gray-800 border border-gray-700"
                      >
                        {copiedConfig ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
                        {copiedConfig ? (lang === 'zh' ? '已复制' : 'Copied') : (lang === 'zh' ? '复制' : 'Copy')}
                      </button>
                    </div>
                    <pre className="px-6 py-5 text-sm text-gray-300 overflow-x-auto font-mono leading-relaxed bg-black/40">
                      {typeof configJson === 'string' ? configJson : JSON.stringify(configJson, null, 2)}
                    </pre>
                  </div>
                ) : null}

                {detail?.deployedEnvs && Object.keys(detail.deployedEnvs).length > 0 && (
                  <div className="bg-[#1a1a1a] rounded-2xl border border-gray-800 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-800">
                      <h3 className="text-sm font-semibold text-gray-200">{lang === 'zh' ? '环境变量' : 'Environment Variables'}</h3>
                    </div>
                    <div className="divide-y divide-gray-800">
                      {Object.entries(detail.deployedEnvs).map(([key, val]) => (
                        <div key={key} className="flex items-center px-6 py-3.5">
                          <span className="text-orange-600 font-mono text-sm w-52 flex-shrink-0">{key}</span>
                          <span className="text-gray-400 text-sm truncate">{String(val)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {!configJson && (!detail?.deployedEnvs || Object.keys(detail.deployedEnvs).length === 0) && (
                  <div className="bg-[#1a1a1a] rounded-2xl border border-gray-800 p-8 text-center py-20">
                    <Settings2 size={48} className="mx-auto mb-4 text-gray-700" />
                    <p className="text-gray-500">{lang === 'zh' ? '暂无配置信息' : 'No configuration available'}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 右侧信息栏 */}
          <div className="w-64 flex-shrink-0 hidden lg:block">
            <div className="sticky top-24 space-y-4">
              {/* 元信息卡片 */}
              <div className="bg-[#1a1a1a] rounded-2xl border border-gray-800 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-800">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{lang === 'zh' ? '详细信息' : 'Details'}</h3>
                </div>
                <div className="divide-y divide-gray-800">
                  <div className="flex items-center justify-between px-5 py-3">
                    <span className="text-xs text-gray-500">{lang === 'zh' ? '使用次数' : 'Usage'}</span>
                    <span className="text-sm font-semibold text-gray-200 flex items-center gap-1"><Zap size={13} className="text-orange-400" />{(s.usageCount || 0).toLocaleString()}</span>
                  </div>
                  {s.author && (
                    <div className="flex items-center justify-between px-5 py-3">
                      <span className="text-xs text-gray-500">{lang === 'zh' ? '作者' : 'Author'}</span>
                      <span className="text-sm text-gray-300 flex items-center gap-1"><User size={13} className="text-blue-400" />{s.author}</span>
                    </div>
                  )}
                  {s.version && (
                    <div className="flex items-center justify-between px-5 py-3">
                      <span className="text-xs text-gray-500">{lang === 'zh' ? '版本' : 'Version'}</span>
                      <span className="text-sm font-mono text-gray-300">{s.version}</span>
                    </div>
                  )}
                  {s.skillType && (
                    <div className="flex items-center justify-between px-5 py-3">
                      <span className="text-xs text-gray-500">{lang === 'zh' ? '类型' : 'Type'}</span>
                      <span className="text-sm text-gray-300 flex items-center gap-1"><Tag size={13} className="text-violet-400" />{s.skillType}</span>
                    </div>
                  )}
                  {s.category && (
                    <div className="flex items-center justify-between px-5 py-3">
                      <span className="text-xs text-gray-500">{lang === 'zh' ? '分类' : 'Category'}</span>
                      <span className="text-sm text-gray-300">{lang === 'zh' ? (s.categoryCn || s.category) : (s.categoryEn || s.category)}</span>
                    </div>
                  )}
                  {tools.length > 0 && (
                    <div className="flex items-center justify-between px-5 py-3">
                      <span className="text-xs text-gray-500">{lang === 'zh' ? '工具数' : 'Tools'}</span>
                      <span className="text-sm text-gray-300 flex items-center gap-1"><Box size={13} className="text-cyan-500" />{tools.length}</span>
                    </div>
                  )}
                  {formatDate(s) && (
                    <div className="flex items-center justify-between px-5 py-3">
                      <span className="text-xs text-gray-500">{lang === 'zh' ? '发布' : 'Published'}</span>
                      <span className="text-xs text-gray-400">{formatDate(s)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 标签 */}
              {s.tags && (
                <div className="bg-[#1a1a1a] rounded-2xl border border-gray-800 p-5">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">{lang === 'zh' ? '标签' : 'Tags'}</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {s.tags.split(',').map((tag, i) => (
                      <span key={i} className="px-2.5 py-1 bg-gray-800 text-gray-300 text-xs rounded-lg border border-gray-700 hover:bg-gray-700 transition-colors cursor-default">{tag.trim()}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* 复制配置按钮 */}
              {configJson && (
                <button
                  onClick={() => handleCopy(typeof configJson === 'string' ? configJson : JSON.stringify(configJson, null, 2))}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-xl transition-colors text-sm"
                >
                  {copiedConfig ? <Check size={15} /> : <Copy size={15} />}
                  {copiedConfig ? (lang === 'zh' ? '已复制配置' : 'Copied!') : (lang === 'zh' ? '复制配置' : 'Copy Config')}
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SkillDetailPage;
