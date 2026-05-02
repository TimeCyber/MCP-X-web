import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { useLanguage } from '../contexts/LanguageContext';
import { skillApi, SkillCategory, SkillServer } from '../services/skillApi';
import { Search, X, Zap, Tag, User, ChevronRight, Loader2, Sparkles } from 'lucide-react';

// Skill 卡片组件
const SkillCard: React.FC<{ skill: SkillServer; onClick: () => void; lang: string }> = ({ skill, onClick, lang }) => (
  <Link
    to={`/skill/${skill.id}`}
    className="block w-full rounded-lg transition-all duration-200 p-5 h-[220px] flex flex-col border bg-[#1a1a1a] hover:bg-[#202020] border-gray-800 hover:border-gray-700 cursor-pointer group"
  >
    <div className="flex justify-between items-start mb-2">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {skill.icon ? (
          <img src={skill.icon} alt="" className="w-8 h-8 rounded-lg flex-shrink-0 object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
        ) : (
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
        )}
        <h3 className="text-base font-semibold text-white truncate group-hover:text-orange-400 transition-colors">
          {lang === 'zh' ? (skill.chineseName || skill.nameCn || skill.name) : (skill.name || skill.nameEn || skill.chineseName)}
        </h3>
      </div>
      {skill.isNew && <span className="ml-2 text-[10px] bg-orange-500 text-black px-1.5 py-0.5 rounded-full font-bold flex-shrink-0">NEW</span>}
    </div>

    {skill.handle && <div className="text-xs text-gray-500 mb-2 truncate">{skill.handle}</div>}

    <p className="text-gray-400 text-sm line-clamp-3 flex-1 mb-3">
      {lang === 'zh' ? (skill.descriptionCn || skill.description || skill.descriptionEn || '') : (skill.descriptionEn || skill.description || skill.descriptionCn || '')}
    </p>

    <div className="flex items-center justify-between mt-auto">
      <div className="flex items-center gap-3 text-xs text-gray-500">
        {skill.author && (
          <span className="flex items-center gap-1"><User className="w-3 h-3" />{skill.author}</span>
        )}
        {skill.skillType && (
          <span className="flex items-center gap-1 px-1.5 py-0.5 bg-gray-800 rounded border border-gray-700"><Tag className="w-3 h-3" />{skill.skillType}</span>
        )}
      </div>
      <span className="flex items-center gap-1 text-xs text-gray-500">
        <Zap className="w-3 h-3" />{skill.usageCount || 0}
      </span>
    </div>
  </Link>
);

export const SkillPage: React.FC = () => {
  const { currentLanguage } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const [categories, setCategories] = useState<SkillCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [skills, setSkills] = useState<SkillServer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SkillServer[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const pageSize = 20;

  // 从 URL 参数恢复搜索
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('q') || '';
    if (q) {
      setSearchQuery(q);
      handleSearch(q);
    }
  }, [location.search]);

  // 加载分类
  useEffect(() => {
    const load = async () => {
      try {
        const res = await skillApi.getCategories();
        if (res.code === 200 && res.data) setCategories(res.data);
      } catch (e) { console.error('加载Skill分类失败:', e); }
    };
    load();
  }, []);

  // 加载列表
  const loadSkills = useCallback(async (pageNum = 1, append = false) => {
    if (pageNum === 1) setLoading(true); else setLoadingMore(true);
    try {
      const params: any = { pageNum, pageSize };
      if (selectedCategory) params.categoryId = selectedCategory;
      const res = selectedCategory
        ? await skillApi.getByCategory(selectedCategory, { pageNum, pageSize })
        : await skillApi.getList(params);
      if (res.code === 200) {
        const rows = res.rows || res.data || [];
        const t = res.total || 0;
        if (append) setSkills(prev => [...prev, ...rows]); else setSkills(rows);
        setTotal(t);
        setPage(pageNum);
        setHasMore(pageNum * pageSize < t);
      }
    } catch (e) { console.error('加载Skill列表失败:', e); }
    finally { setLoading(false); setLoadingMore(false); }
  }, [selectedCategory]);

  useEffect(() => { loadSkills(1); }, [selectedCategory, loadSkills]);

  // 搜索
  const handleSearch = async (query: string) => {
    if (!query.trim()) { setSearchResults([]); return; }
    setSearchLoading(true);
    try {
      const res = await skillApi.search(query, { pageNum: 1, pageSize: 50 });
      if (res.code === 200) setSearchResults(res.rows || res.data || []);
    } catch (e) { console.error('搜索Skill失败:', e); }
    finally { setSearchLoading(false); }
  };

  // 无限滚动
  useEffect(() => {
    if (searchQuery.trim()) return; // 搜索模式不触发
    const handleScroll = () => {
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 300) {
        if (!loading && !loadingMore && hasMore) loadSkills(page + 1, true);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loading, loadingMore, hasMore, page, searchQuery, loadSkills]);

  const displayList = searchQuery.trim() ? searchResults : skills;
  const lang = currentLanguage;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Navbar />
      <main className="flex-grow flex flex-col">
        {/* 头部 */}
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col items-center justify-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-center mb-4">
              {lang === 'zh' ? (
                <>探索 <span className="text-orange-500">Skill</span> 市场，发现 <span className="text-orange-500">{total || '...'}</span> 个技能</>
              ) : (
                <>Explore <span className="text-orange-500">Skill</span> Marketplace with <span className="text-orange-500">{total || '...'}</span> skills</>
              )}
            </h1>
            <p className="text-gray-400 text-lg mb-8">
              {lang === 'zh' ? '为你的 AI 智能体扩展专业技能' : 'Extend professional skills for your AI agents'}
            </p>

            {/* 搜索框 */}
            <div className="w-full max-w-2xl relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { handleSearch(searchQuery); navigate(searchQuery.trim() ? `/skill?q=${encodeURIComponent(searchQuery)}` : '/skill'); } }}
                placeholder={lang === 'zh' ? '搜索 Skill...' : 'Search Skills...'}
                className="w-full pl-12 pr-10 py-3.5 bg-[#1a1a1a] border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 transition-colors"
              />
              {searchQuery && (
                <button onClick={() => { setSearchQuery(''); setSearchResults([]); navigate('/skill'); }} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 分类标签 */}
        <div className="container mx-auto px-4 mb-8">
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${!selectedCategory ? 'bg-orange-500 text-black' : 'bg-[#1a1a1a] text-gray-300 border border-gray-800 hover:bg-[#202020]'}`}
            >
              {lang === 'zh' ? '全部' : 'All'}
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${selectedCategory === cat.id ? 'bg-orange-500 text-black' : 'bg-[#1a1a1a] text-gray-300 border border-gray-800 hover:bg-[#202020]'}`}
              >
                {lang === 'zh' ? cat.name : (cat.nameEn || cat.name)}
              </button>
            ))}
          </div>
        </div>

        {/* 内容区域 */}
        <div className="container mx-auto px-4 pb-16">
          {(loading || searchLoading) && displayList.length === 0 ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-orange-500" />
            </div>
          ) : displayList.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
              {lang === 'zh' ? '暂无数据' : 'No data'}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {displayList.map((skill) => (
                  <SkillCard key={skill.id} skill={skill} lang={lang} onClick={() => {}} />
                ))}
              </div>
              {loadingMore && (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 text-orange-500 animate-spin" />
                </div>
              )}
              {!hasMore && displayList.length > 0 && !searchQuery.trim() && (
                <div className="text-center py-8 text-gray-600 text-sm">{lang === 'zh' ? '已加载全部' : 'All loaded'}</div>
              )}
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default SkillPage;
