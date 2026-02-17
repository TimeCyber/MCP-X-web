import React, { useRef, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Download, PlusSquare, LogOut, User, Settings, Bell, Award, MessageSquare, Cpu, Bot, Globe, Code2, ChevronDown } from 'lucide-react';
import { Logo} from '../ui/Logo';

import { useLanguage } from '../../contexts/LanguageContext';

// 语言切换按钮组件
const LanguageToggle: React.FC = () => {
  const { currentLanguage, setLanguage } = useLanguage();
  
  const toggleLanguage = () => {
    setLanguage(currentLanguage === 'zh' ? 'en' : 'zh');
  };
  
  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center gap-1 px-2 py-1 text-sm text-gray-300 hover:text-white transition-colors rounded-lg hover:bg-gray-800"
      title={currentLanguage === 'zh' ? 'Switch to English' : '切换到中文'}
    >
      <Globe size={16} />
      <span className="text-xs font-medium">
        {currentLanguage === 'zh' ? 'EN' : '中'}
      </span>
    </button>
  );
};



// Navbar 内容组件
const NavbarContent: React.FC<{ transparent?: boolean }> = ({ transparent = false }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentLanguage } = useLanguage();
  const profileRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const [username, setUser] = useState<any>(null);
  const [nickname, setNickname] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isAiMenuOpen, setIsAiMenuOpen] = useState(false);
  const aiMenuTimer = useRef<number | null>(null);
  const openAiMenu = () => {
    if (aiMenuTimer.current) {
      window.clearTimeout(aiMenuTimer.current);
      aiMenuTimer.current = null;
    }
    setIsAiMenuOpen(true);
  };
  const closeAiMenuWithDelay = () => {
    if (aiMenuTimer.current) window.clearTimeout(aiMenuTimer.current);
    aiMenuTimer.current = window.setTimeout(() => setIsAiMenuOpen(false), 180);
  };
  // 监听点击弹窗外部关闭弹窗
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        isProfileOpen &&
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setIsProfileOpen(false);
      }
      if (
        isNotificationsOpen &&
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target as Node)
      ) {
        setIsNotificationsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isProfileOpen, isNotificationsOpen]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('username');
    const nickname = localStorage.getItem('nickname');
    setToken(token);
    setUser(userStr ? userStr : null);
    setNickname(nickname ? nickname : username);
    
    // 简化逻辑：只在有token时设置状态，不立即验证
    // token验证将由API响应拦截器自动处理
  }, [location.pathname]); // 路由变化时刷新

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('nickname');
    localStorage.removeItem('userId');
    setToken(null);
    setUser(null);
    setNickname(null);
    navigate('/');
  };

  const notifications = [
    {
      id: 1,
      title: 'New server available',
      message: 'Sequential Thinking server has been added',
      time: '2 hours ago'
    },
    {
      id: 2,
      title: 'Server update',
      message: 'Desktop Commander has been updated to v2.0',
      time: '1 day ago'
    }
  ];

  return (
    <header className={`sticky top-0 z-50 border-b transition-all duration-300 ${
      transparent ? 'bg-transparent border-transparent' : 'bg-black/80 backdrop-blur-md border-gray-800'
    }`}>
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link to="/" className="flex items-center whitespace-nowrap">
          <Logo className="mr-2" />
          <span className="text-xl font-bold text-white">MCP-X</span>
        </Link>
        
        <div className="flex items-center space-x-4">
          
          {/* AI 应用菜单 */}
          <div
            className="relative"
            onMouseEnter={openAiMenu}
            onMouseLeave={closeAiMenuWithDelay}
          >
            <button className="text-sm text-gray-300 hover:text-white transition-colors flex items-center px-3 py-2 whitespace-nowrap">
              <MessageSquare size={16} className="mr-1" />
              {currentLanguage === 'zh' ? 'AI工作台' : 'AI Studio'}
              <ChevronDown size={14} className="ml-1 opacity-70" />
            </button>
            {isAiMenuOpen && (
              <div
                className="absolute mt-1 right-0 w-44 bg-gray-900 rounded-md shadow-lg border border-gray-800 py-1 z-50"
                onMouseEnter={openAiMenu}
                onMouseLeave={closeAiMenuWithDelay}
              >
                <Link
                  to="/chat"
                  className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-800"
                >
                  {currentLanguage === 'zh' ? 'AI文字工作台' : 'AI Chat'}
                </Link>
                <Link
                  to="/image-editor"
                  className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-800"
                >
                  {currentLanguage === 'zh' ? 'AI图形工作台' : 'AI Graphics Studio'}
                </Link>
                <Link
                  to="/video-studio"
                  className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-800"
                >
                  {currentLanguage === 'zh' ? 'AI视频工作台' : 'AI Video Studio'}
                </Link>
                <button
                  onClick={() => {
                    const token = localStorage.getItem('token');
                    if (!token) {
                      navigate('/login', { state: { from: { pathname: location.pathname } } });
                      return;
                    }
                    navigate('/app/new');
                  }}
                  className="w-full text-left block px-4 py-2 text-sm text-gray-300 hover:bg-gray-800"
                >
                  {currentLanguage === 'zh' ? '一句话建站' : 'One‑sentence Builder'}
                </button>
              </div>
            )}
          </div>
          <Link
            to="/mcp"
            className="text-sm text-gray-300 hover:text-white transition-colors flex items-center px-3 py-2 whitespace-nowrap"
          >
            <Cpu size={16} className="mr-1" />
            MCP
          </Link>
          <Link
            to="/agent"
            className="text-sm text-gray-300 hover:text-white transition-colors flex items-center px-3 py-2 whitespace-nowrap"
          >
            <Bot size={16} className="mr-1" />
            Agent
          </Link>
          {/* <Link
            to="/workflow"
            className="text-sm text-gray-300 hover:text-white transition-colors flex items-center px-3 py-2"
          >
            <Code2 size={16} className="mr-1" />
            {currentLanguage === 'zh' ? '工作流构建' : 'Workflow Builder'}
          </Link> */}
          {/* 原“前端构建”入口合并到 AI 应用子菜单 */}
          {/* <Link 
            to="/docs"
            className="text-sm text-gray-300 hover:text-white transition-colors flex items-center px-3 py-2"
          >
            <BookOpen size={16} className="mr-1" />
            文档
          </Link> */}
          <Link
            to="/rewards"
            className="text-sm text-gray-300 hover:text-white transition-colors flex items-center px-3 py-2 whitespace-nowrap"
          >
            <Award size={16} className="mr-1" />
{currentLanguage === 'zh' ? '奖研金计划' : 'Rewards Program'}
          </Link>
          <Link
            to="/download"
            className="text-sm text-gray-300 hover:text-white transition-colors flex items-center px-3 py-2 whitespace-nowrap"
          >
            <Download size={16} className="mr-1" />
{currentLanguage === 'zh' ? '下载客户端' : 'Download Client'}
          </Link>
          <a
            href="https://github.com/TimeCyber/MCP-X-web"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-orange-500 hover:bg-orange-600 text-white font-medium text-sm rounded-md px-3 py-2 transition-colors flex items-center whitespace-nowrap"
            title={currentLanguage === 'zh' ? 'GitHub 开源' : 'Open Source'}
          >
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24" className="mr-1">
              <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
            </svg>
            {currentLanguage === 'zh' ? '开源' : 'Open Source'}
          </a>
          <Link
            to="/docs"
            className="text-sm text-gray-300 hover:text-white transition-colors flex items-center px-3 py-2 whitespace-nowrap"
            title={currentLanguage === 'zh' ? '应用文档' : 'Documentation'}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" className="mr-1">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            {currentLanguage === 'zh' ? '文档' : 'Docs'}
          </Link>
          {/* 语言切换：登录与未登录均显示 */}
          <LanguageToggle />
          {token ? (
            <div className="flex items-center space-x-2">
              {/* Notifications */}
              <div className="relative" hidden={true}>
                <button
                  onClick={() => {
                    setIsNotificationsOpen((prev) => {
                      if (!prev) setIsProfileOpen(false); // 打开通知时关闭个人中心
                      return !prev;
                    });
                  }}
                  className="p-2 text-gray-400 hover:text-white transition-colors relative"
                >
                  <Bell size={20} />
                  <span className="absolute top-0 right-0 w-2 h-2 bg-orange-500 rounded-full"></span>
                </button>

                {isNotificationsOpen && (
                  <div ref={notificationsRef} className="absolute right-0 mt-2 w-80 bg-gray-900 rounded-lg shadow-lg py-2 border border-gray-800">
                    <div className="px-4 py-2 border-b border-gray-800">
                      <h3 className="font-semibold">{currentLanguage === 'zh' ? '通知' : 'Notifications'}</h3>
                    </div>
                    {notifications.map(notification => (
                      <div key={notification.id} className="px-4 py-3 hover:bg-gray-800 cursor-pointer">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-sm">{notification.title}</p>
                            <p className="text-sm text-gray-400">{notification.message}</p>
                          </div>
                          <span className="text-xs text-gray-500">{notification.time}</span>
                        </div>
                      </div>
                    ))}
                    <div className="px-4 py-2 border-t border-gray-800">
                      <button className="text-sm text-orange-500 hover:text-orange-400">
{currentLanguage === 'zh' ? '查看全部通知' : 'View All Notifications'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
              {/* User Profile */}
              <div className="relative">
                <button
                  onClick={() => {
                    setIsProfileOpen((prev) => {
                      if (!prev) setIsNotificationsOpen(false); // 打开个人中心时关闭通知
                      return !prev;
                    });
                  }}
                  className="flex items-center space-x-2 p-1 rounded-full hover:bg-gray-800 transition-colors"
                >
                  <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                    <User size={16} className="text-gray-300" />
                  </div>
                </button>

                {isProfileOpen && (
                  <div ref={profileRef} className="absolute right-0 mt-2 w-48 bg-gray-900 rounded-lg shadow-lg py-2 border border-gray-800">
                    <div className="px-4 py-2 border-b border-gray-800">
                      <p className="font-medium">{nickname}</p>
                      {/* <p className="text-sm text-gray-400">john@example.com</p> */}
                    </div>
                    <Link
                      to="/settings"
                      className="flex items-center px-4 py-2 text-sm hover:bg-gray-800"
                    >
                      <Settings size={16} className="mr-2" />
{currentLanguage === 'zh' ? '个人中心' : 'User Center'}
                    </Link>
                    <button
                      className="flex items-center px-4 py-2 text-sm hover:bg-gray-800 w-full text-left text-red-400"
                      onClick={handleLogout}
                    >
                      <LogOut size={16} className="mr-2" />
{currentLanguage === 'zh' ? '退出登录' : 'Logout'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            location.pathname !== '/login' && (
              <Link 
                to="/login"
                state={{ from: location }}
                className="text-sm font-medium px-3 py-2 text-white transition-colors flex items-center"
              >
                {/* <LogIn size={16} className="mr-1" /> */}
{currentLanguage === 'zh' ? '登录' : 'Login'}
              </Link>
            )
          )}
          {/* <button
            className="text-gray-400 hover:text-white transition-colors ml-2"
            aria-label="帮助"
          >
            <HelpCircle size={20} />
          </button> */}
        </div>
      </div>
    </header>
  );
};

// 导出的主Navbar组件
export const Navbar: React.FC<{ transparent?: boolean }> = ({ transparent }) => {
  return <NavbarContent transparent={transparent} />;
};