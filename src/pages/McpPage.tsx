import React, { useState, useEffect, useRef } from 'react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { SearchBar } from '../components/ui/SearchBar';
import { CategorySection } from '../components/ui/CategorySection';
import { getServersByCategory, categories, fetchCategories } from '../data/servers_api';
import { api } from '../services/api';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { formatUsage } from '../utils/format';
import { VerifiedBadge } from '../components/ui/VerifiedBadge';
import { useLanguage } from '../contexts/LanguageContext';
import { setSEO } from '../utils/seo';

// McpPage 内容组件
const McpPageContent: React.FC = () => {
  const { currentLanguage } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [categoryList, setCategoryList] = useState<any[]>([]);
  const [serverCount, setServerCount] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [recentServers, setRecentServers] = useState<any[]>([]);

  
  const shouldScrollToResults = useRef(false);
  const navigate = useNavigate();
  const location = useLocation();

  // 获取分类名称（支持多语言）
  const getCategoryName = (category: any) => {
    if (typeof category === 'string') return category;
    return currentLanguage === 'en' && category.nameEn ? category.nameEn : category.name;
  };

  // 设置页面 SEO
  useEffect(() => {
    setSEO('/mcp', {
      title: 'MCP-X - 专业的MCP智能体平台 | Model Context Protocol扩展中心',
      description: `发现 ${serverCount} 个优质MCP服务器和AI智能体。MCP-X是领先的Model Context Protocol平台，提供丰富的MCP扩展、AI工具集成，探索MCP协议的无限可能。`,
    });
  }, [serverCount]);

  // 每次location.search变化都根据q参数自动同步搜索内容和结果
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('q') || '';
    setSearchQuery(q);
    if (q) {
      handleSearch(q, true);
    } else {
      // sessionStorage 恢复
      const savedQuery = sessionStorage.getItem('searchQuery') || '';
      const savedResults = sessionStorage.getItem('searchResults');
      setSearchQuery(savedQuery);
      if (savedResults) {
        setSearchResults(JSON.parse(savedResults));
      } else {
        setSearchResults([]);
      }
    }
    // eslint-disable-next-line
  }, [location.search]);

  // 在组件加载时获取最新数据
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const { total } = await api.server.fetchServers();
        await fetchCategories();
        setCategoryList(categories);
        setServerCount(total);
        
        // 获取最近收录的服务器
        const recentResponse = await api.server.fetchRecentServers();
        if (recentResponse.code === 200 && Array.isArray(recentResponse.data)) {
          // 将API返回的数据转换为Server类型
          const recentServers = recentResponse.data.map((item: any) => ({
            id: item.id.toString(),
            name: item.name,
            nameEn: item.nameEn,
            chineseName: item.chineseName,
            nameCn: item.nameCn,
            handle: item.handle ? `${item.handle}` : `${item.name.toLowerCase().replace(/\s+/g, '-')}`,
            description: item.description || '',
            descriptionEn: item.descriptionEn || '',
            descriptionCn: item.descriptionCn || '',
            category: currentLanguage === 'zh' ? (item.categoryCn || item.category || '未分类') : (item.categoryEn || item.category || 'Uncategorized'),
            tags: ['Remote'],
            usage: item.usageCount || 0,
            usageLabel: item.usageLabel || formatUsage(item.usageCount || 0),
            verified: !!item.verified,
            new: !!item.isNew
          }));
          setRecentServers(recentServers);
        }
        
        setLoading(false);
      } catch (err) {
        console.error(currentLanguage === 'zh' ? '加载数据失败' : 'Failed to load data', err);
        setError(currentLanguage === 'zh' ? '加载数据失败，请重试' : 'Failed to load data, please try again');
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // 如果搜索结果已经加载完成且需要滚动，则滚动到搜索结果
  useEffect(() => {
    if (!searchLoading && searchResults.length > 0 && shouldScrollToResults.current) {
      const searchResultsElement = document.getElementById('search-results');
      if (searchResultsElement) {
        searchResultsElement.scrollIntoView({ behavior: 'smooth' });
      }
      shouldScrollToResults.current = false;
    }
  }, [searchLoading, searchResults.length]);

  // 搜索时同步URL
  const handleSearch = async (query: string, fromUrl = false) => {
    if (!fromUrl) {
      if (query.trim()) {
        navigate(`/mcp?q=${encodeURIComponent(query)}`);
      } else {
        navigate(`/mcp`);
      }
    }
    if (!query.trim()) {
      setSearchResults([]);
      // 清理sessionStorage
      sessionStorage.removeItem('searchQuery');
      sessionStorage.removeItem('searchResults');
      return;
    }
    try {
      setSearchLoading(true);
      const response = await api.search.search(query);
      if (response.code === 200) {
        setSearchResults(response.data);
        // 存入sessionStorage
        sessionStorage.setItem('searchQuery', query);
        sessionStorage.setItem('searchResults', JSON.stringify(response.data));
        shouldScrollToResults.current = true;
      } else {
        throw new Error(response.message || (currentLanguage === 'zh' ? '搜索失败' : 'Search failed'));
      }
    } catch (err) {
      console.error(currentLanguage === 'zh' ? '搜索失败' : 'Search failed', err);
      setError(currentLanguage === 'zh' ? '搜索失败，请重试' : 'Search failed, please try again');
    } finally {
      setSearchLoading(false);
    }
  };

  // 一键清除搜索内容和结果
  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    sessionStorage.removeItem('searchQuery');
    sessionStorage.removeItem('searchResults');
    navigate('/mcp');
  };



  // 搜索按钮或回车时才调用handleSearch
  const handleSearchBarSearch = (query: string) => {
    handleSearch(query);
  };

  const handleCategoryViewAll = (query: string) => {
    setSearchQuery(query);
    handleSearch(query);
  };

  const renderSearchResult = (server: any) => {
    return (
      <Link 
        to={`/server/${server.id}`} 
        key={server.id}
        className="block w-full rounded-lg transition-all duration-200 p-5 h-[250px] flex flex-col border backdrop-blur-md bg-white/10 hover:bg-white/20 border-white/20 hover:border-white/30 shadow-sm relative"
      >
        <div className="absolute top-5 right-5 text-sm text-gray-400">
          {server.usageCount || 0} {currentLanguage === 'zh' ? '次调用' : 'calls'}
        </div>
        
        <div className="flex flex-col">
          <div className="mb-1">
            <h3 className="text-lg font-medium text-white flex items-center">
              {currentLanguage === 'zh' 
                ? (server.chineseName || server.nameCn || server.name) 
                : (server.name || server.nameEn || server.chineseName || server.nameCn)
              }
              {!!server.verified && <span className="ml-1"><VerifiedBadge /></span>}
              {!!server.isNew && <span className="ml-2 text-xs bg-orange-500 text-black px-1.5 py-0.5 rounded-full">NEW</span>}
            </h3>
          </div>
          <p className="text-sm text-gray-400 mb-2">{server.handle || ''}</p>
          <p className="text-gray-300 text-sm">
            {currentLanguage === 'zh' 
              ? (server.descriptionCn || server.description || server.descriptionEn) 
              : (server.descriptionEn || server.description || server.descriptionCn)
            }
          </p>
        </div>
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Navbar />
      
      <main className="flex-grow flex flex-col">
        {/* 头部内容区域 - 保持居中 */}
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col items-center justify-center mb-16">
            <h1 className="text-3xl md:text-4xl font-bold text-center mb-4">
              {currentLanguage === 'zh' ? (
                <>通过 <span className="text-orange-500">MCP-X</span> 服务器为您的智能体扩展 <span className="text-orange-500">{serverCount || '...'}</span> 种能力。</>
              ) : (
                <>Expand your agents with <span className="text-orange-500">{serverCount || '...'}</span> capabilities through <span className="text-orange-500">MCP-X</span> servers.</>
              )}
            </h1>
            <div className="text-lg text-gray-400 mb-2">
              {currentLanguage === 'zh' ? '发掘AI智能体的真实应用场景' : 'Discover real-world AI agent applications'}
            </div>
            
            {/* 搜索框和添加服务器按钮在同一行 */}
            <div className="w-full max-w-2xl mt-8 flex gap-4">
              <div className="flex-1">
                <SearchBar onSearch={handleSearchBarSearch} searchQuery={searchQuery} onClear={handleClearSearch} />
              </div>
              <Link
                to="/add-server"
                className="bg-orange-500 hover:bg-orange-600 text-black font-medium text-sm rounded-md px-6 py-3 transition-colors flex items-center whitespace-nowrap shadow-lg hover:shadow-xl"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                {currentLanguage === 'zh' ? '添加服务器' : 'Add Server'}
              </Link>
            </div>
          </div>
        </div>

        {/* 分类内容区域 - 全屏宽度 */}
        <div className="w-full">
          {searchLoading ? (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
            </div>
          ) : searchResults.length > 0 ? (
            <div id="search-results" className="container mx-auto mb-16">
              <h2 className="text-xl font-medium text-white mb-4 px-4">
                {currentLanguage === 'zh' ? '搜索结果' : 'Search Results'}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 px-4">
                {searchResults.map((result) => renderSearchResult(result))}
              </div>
            </div>
          ) : searchQuery.trim() ? (
            <div className="container mx-auto mb-16 px-4">
              <div className="text-center py-12">
                <div className="text-gray-400 text-lg mb-2">
                  {currentLanguage === 'zh' ? '未找到相关结果' : 'No results found'}
                </div>
                <div className="text-gray-500 text-sm">
                  {currentLanguage === 'zh' ? (
                    <>请尝试其他关键词，或<button onClick={handleClearSearch} className="text-orange-500 hover:text-orange-400 cursor-pointer">清空搜索框</button></>
                  ) : (
                    <>Try other keywords, or <button onClick={handleClearSearch} className="text-orange-500 hover:text-orange-400 cursor-pointer">clear search</button></>
                  )}
                </div>
              </div>
            </div>
          ) : loading ? (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
            </div>
          ) : error ? (
            <div className="text-center text-red-500">{error}</div>
          ) : (
            <>
              {/* 最近收录的服务器 */}
              {recentServers.length > 0 && (
                <CategorySection 
                  title={currentLanguage === 'zh' ? '最近收录' : 'Recently Added'}
                  count={recentServers.length}
                  servers={recentServers}
                  onSearch={handleCategoryViewAll}
                  hideViewAll={true}
                />
              )}
              
              {/* 分类列表 */}
              {categoryList.length === 0 ? (
                <div className="text-center text-gray-400">
                  {currentLanguage === 'zh' ? '暂无分类数据' : 'No category data available'}
                </div>
              ) : (
                categoryList.map((category) => {
                  const categoryName = getCategoryName(category);
                  const originalCategoryName = typeof category === 'string' ? category : category.name;
                  const categoryServers = getServersByCategory(originalCategoryName);
                  console.log(`🔍 分类 "${categoryName}" 的服务器数量:`, categoryServers.length);
                  if (categoryServers.length === 0) return null;
                  
                  return (
                    <CategorySection 
                      key={typeof category === 'string' ? category : category.id}
                      title={categoryName}
                      count={categoryServers.length}
                      servers={categoryServers}
                      onSearch={handleCategoryViewAll}
                    />
                  );
                })
              )}
            </>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

// 导出的主McpPage组件
export const McpPage: React.FC = () => {
  return <McpPageContent />;
};