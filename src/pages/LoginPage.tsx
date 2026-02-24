import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { Github } from 'lucide-react';
import api from '../services/api';
import { toast } from '../utils/toast';
import { useLanguage } from '../contexts/LanguageContext';

export const LoginPage: React.FC = () => {
  const { t, currentLanguage } = useLanguage();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // 从localStorage加载保存的登录信息
  useEffect(() => {
    const savedUsername = localStorage.getItem('savedUsername');
    const savedPassword = localStorage.getItem('savedPassword');
    const savedRememberMe = localStorage.getItem('rememberMe') === 'true';

    if (savedRememberMe && savedUsername && savedPassword) {
      setUsername(savedUsername);
      setPassword(savedPassword);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    // 邮箱格式校验
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(username.trim())) {
      setError(currentLanguage === 'zh' ? '请输入正确的邮箱地址' : 'Please enter a valid email address');
      return;
    }
    setLoading(true);

    try {
      // 使用新的ruoyi-element-ai项目的登录接口
      const res = await api.user.login(username, password);
      console.log('登录API响应:', res);
      
      if (res && res.code === 200) {
        // 处理新的响应格式
        const token = res.data?.access_token || res.data?.token || res.token;
        const userInfo = res.data?.userInfo;
        
        console.log('提取的token:', token);
        console.log('提取的userInfo:', userInfo);
        
        if (token) {
          localStorage.setItem('token', token);
          console.log('已保存token到localStorage');
        }
        
        if (userInfo) {
          // 保存用户ID - userInfo.userId 已经是字符串类型
          if (userInfo.userId) {
            localStorage.setItem('userId', userInfo.userId);
            console.log('已保存userId到localStorage:', userInfo.userId);
          }
          
          // 保存其他用户信息
          if (userInfo.nickName) {
            localStorage.setItem('nickname', userInfo.nickName);
        }
          if (userInfo.username) {
            localStorage.setItem('username', userInfo.username);
          }
          
          // 保存用户角色信息
          if (userInfo.rolePermission && userInfo.rolePermission.length > 0) {
            localStorage.setItem('userRole', userInfo.rolePermission[0]);
          }
        }
        
        console.log('localStorage更新后的内容:');
        console.log('- token:', localStorage.getItem('token'));
        console.log('- userId:', localStorage.getItem('userId'));
        console.log('- username:', localStorage.getItem('username'));
        
        // 处理"记住我"功能
        if (rememberMe) {
          localStorage.setItem('savedUsername', username);
          localStorage.setItem('savedPassword', password);
          localStorage.setItem('rememberMe', 'true');
        } else {
          localStorage.removeItem('savedUsername');
          localStorage.removeItem('savedPassword');
          localStorage.removeItem('rememberMe');
        }

        toast.success(t('login.loginSuccess'));
        
        // 获取来源页面
        const from = (location.state as any)?.from?.pathname;
        console.log('location.state:', location.state);
        console.log('跳转目标 from:', from);
        
        // 如果来源页面是注册或忘记密码页面，则跳转到首页
        if (!from || from === '/signup' || from === '/forgot-password') {
          console.log('准备跳转到首页 /');
          navigate('/', { replace: true });
        } else {
          console.log('准备跳转到来源页面:', from);
          navigate(from, { replace: true });
        }
      } else {
        setError(res?.msg || res?.message || t('login.loginFailed'));
      }
    } catch (err: any) {
      console.error('登录错误:', err);
      setError(err?.response?.data?.msg || err?.message || t('login.loginError'));
    } finally {
      setLoading(false);
    }
  };

  // GitHub登录处理
  const handleGithubLogin = () => {
    try {
      // 检查用户是否已经登录
      const existingToken = localStorage.getItem('token');
      if (existingToken) {
        toast.success(t('login.alreadyLoggedIn'));
        navigate('/');
        return;
      }

      const githubAuthUrl = api.user.getGithubAuthUrl();
      console.log('GitHub授权URL:', githubAuthUrl);
      
      // 打开GitHub授权页面
      window.location.href = githubAuthUrl;
    } catch (error) {
      console.error('GitHub登录错误:', error);
      toast.error(t('login.githubLoginError'));
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Navbar />
      
      <main className="flex-grow flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-2">{t('login.welcomeBack')}</h1>
            <p className="text-gray-400">{t('login.loginToContinue')}</p>
          </div>
          
          <div className="bg-gray-900 rounded-lg p-6 mb-4">
            {error && (
              <div className="mb-4 p-3 bg-red-900/50 border border-red-800 rounded-lg text-sm text-red-200">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-1">
                    {t('login.username')}
                  </label>
                  <input
                    type="text"
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-400 focus:outline-none focus:border-orange-500"
                    placeholder={currentLanguage === 'zh' ? '请输入邮箱地址' : 'Please enter email address'}
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    {currentLanguage === 'zh' ? '请填写有效的邮箱地址作为用户名' : 'Use a valid email as your username.'}
                  </p>
                </div>
                
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
                    {t('login.password')}
                  </label>
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-400 focus:outline-none focus:border-orange-500"
                    placeholder={t('login.passwordPlaceholder')}
                    required
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="remember"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-700 bg-gray-800 text-orange-500 focus:ring-orange-500"
                    />
                    <label htmlFor="remember" className="ml-2 text-sm text-gray-300">
                      {t('login.rememberMe')}
                    </label>
                  </div>
                  <Link to="/forgot-password" className="text-sm text-orange-500 hover:text-orange-400">
                    {t('login.forgotPassword')}
                  </Link>
                </div>
                
                <button
                  type="submit"
                  className={`w-full bg-orange-500 text-black font-medium rounded-lg px-4 py-2.5 hover:bg-orange-600 transition-colors ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                  disabled={loading}
                >
                  {loading ? t('login.loggingIn') : t('login.loginButton')}
                </button>
              </div>
            </form>
            <div className="flex items-center my-6">
              <div className="flex-grow border-t border-gray-800"></div>
              <span className="px-4 text-sm text-gray-500">{t('login.orLoginWith')}</span>
              <div className="flex-grow border-t border-gray-800"></div>
            </div>
            <button 
              type="button"
              onClick={handleGithubLogin}
              className="w-full flex items-center justify-center bg-white text-black rounded-lg px-4 py-2.5 font-medium hover:bg-gray-100 transition-colors"
            >
              <Github size={20} className="mr-2" />
              {t('login.continueWithGithub')}
            </button>
          </div>
          
          <p className="text-center text-sm text-gray-400">
            {t('login.noAccount')}{' '}
            <Link to="/signup" className="text-orange-500 hover:text-orange-400">
              {t('login.signUp')}
            </Link>
          </p>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};