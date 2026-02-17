import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { Github, Eye, EyeOff, Mail, Lock, ArrowRight, Sparkles } from 'lucide-react';
import api from '../services/api';
import { toast } from '../utils/toast';
import { useLanguage } from '../contexts/LanguageContext';
import { Logo } from '../components/ui/Logo';

export const LoginPage: React.FC = () => {
  const { t, currentLanguage } = useLanguage();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
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
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(username.trim())) {
      setError(currentLanguage === 'zh' ? '请输入正确的邮箱地址' : 'Please enter a valid email address');
      return;
    }
    setLoading(true);

    try {
      const res = await api.user.login(username, password);
      console.log('登录API响应:', res);
      
      if (res && res.code === 200) {
        const token = res.data?.access_token || res.data?.token || res.token;
        const userInfo = res.data?.userInfo;
        
        if (token) {
          localStorage.setItem('token', token);
        }
        
        if (userInfo) {
          if (userInfo.userId) {
            localStorage.setItem('userId', userInfo.userId);
          }
          if (userInfo.nickName) {
            localStorage.setItem('nickname', userInfo.nickName);
          }
          if (userInfo.username) {
            localStorage.setItem('username', userInfo.username);
          }
          if (userInfo.rolePermission && userInfo.rolePermission.length > 0) {
            localStorage.setItem('userRole', userInfo.rolePermission[0]);
          }
        }
        
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
        
        const from = (location.state as any)?.from?.pathname;
        if (!from || from === '/signup' || from === '/forgot-password') {
          navigate('/', { replace: true });
        } else {
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

  const handleGithubLogin = () => {
    try {
      const existingToken = localStorage.getItem('token');
      if (existingToken) {
        toast.success(t('login.alreadyLoggedIn'));
        navigate('/');
        return;
      }
      const githubAuthUrl = api.user.getGithubAuthUrl();
      window.location.href = githubAuthUrl;
    } catch (error) {
      console.error('GitHub登录错误:', error);
      toast.error(t('login.githubLoginError'));
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col relative overflow-hidden">
      <Navbar />

      {/* Animated background */}
      <div className="absolute inset-0 z-0">
        {/* Background image */}
        <img
          src="/images/login_background.jpg"
          alt=""
          className="w-full h-full object-cover opacity-40"
          onError={(e) => {
            const img = e.target as HTMLImageElement;
            const extensions = ['png', 'jpeg', 'gif', 'webp'];
            let tried = 0;
            const tryNext = () => {
              if (tried < extensions.length) {
                img.src = `/images/login_background.${extensions[tried]}`;
                tried++;
              } else {
                img.style.display = 'none';
              }
            };
            tryNext();
          }}
        />
        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/50 to-orange-950/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/60" />
        {/* Decorative orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-orange-600/8 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <main className="flex-grow flex items-center justify-center px-4 py-16 min-h-[85vh] relative z-10">
        <div className="w-full max-w-[420px] animate-slideUp">
          
          {/* Logo & heading */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg shadow-orange-500/25 mb-5">
              <Logo className="text-white [&_svg]:stroke-white" />
            </div>
            <h1 className="text-3xl font-bold mb-2 tracking-tight">{t('login.welcomeBack')}</h1>
            <p className="text-gray-400 text-sm">{t('login.loginToContinue')}</p>
          </div>

          {/* Glass card */}
          <div className="relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-7 shadow-2xl shadow-black/40">
            {/* Subtle top glow */}
            <div className="absolute -top-px left-8 right-8 h-px bg-gradient-to-r from-transparent via-orange-500/50 to-transparent" />

            {error && (
              <div className="mb-5 p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-300 flex items-start gap-2">
                <span className="shrink-0 mt-0.5">⚠</span>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email field */}
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-1.5">
                  {t('login.username')}
                </label>
                <div className={`relative flex items-center rounded-xl border transition-all duration-200 ${
                  focusedField === 'email' 
                    ? 'border-orange-500/60 bg-white/[0.07] shadow-[0_0_0_3px_rgba(249,115,22,0.1)]' 
                    : 'border-white/10 bg-white/[0.04] hover:border-white/20'
                }`}>
                  <Mail size={16} className="ml-3.5 text-gray-500 shrink-0" />
                  <input
                    type="text"
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    className="w-full bg-transparent px-3 py-3 text-white placeholder-gray-500 focus:outline-none text-sm"
                    placeholder={currentLanguage === 'zh' ? '请输入邮箱地址' : 'Enter your email'}
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password field */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                    {t('login.password')}
                  </label>
                  <Link to="/forgot-password" className="text-xs text-orange-400 hover:text-orange-300 transition-colors">
                    {t('login.forgotPassword')}
                  </Link>
                </div>
                <div className={`relative flex items-center rounded-xl border transition-all duration-200 ${
                  focusedField === 'password' 
                    ? 'border-orange-500/60 bg-white/[0.07] shadow-[0_0_0_3px_rgba(249,115,22,0.1)]' 
                    : 'border-white/10 bg-white/[0.04] hover:border-white/20'
                }`}>
                  <Lock size={16} className="ml-3.5 text-gray-500 shrink-0" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    className="w-full bg-transparent px-3 py-3 text-white placeholder-gray-500 focus:outline-none text-sm"
                    placeholder={t('login.passwordPlaceholder')}
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="mr-3 text-gray-500 hover:text-gray-300 transition-colors shrink-0"
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Remember me */}
              <div className="flex items-center">
                <label className="relative flex items-center cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-4 h-4 rounded border border-white/20 bg-white/5 peer-checked:bg-orange-500 peer-checked:border-orange-500 transition-all flex items-center justify-center group-hover:border-white/30">
                    {rememberMe && (
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  <span className="ml-2.5 text-sm text-gray-400 group-hover:text-gray-300 transition-colors">
                    {t('login.rememberMe')}
                  </span>
                </label>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full relative flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-xl px-4 py-3 transition-all duration-200 shadow-lg shadow-orange-500/20 ${
                  loading 
                    ? 'opacity-70 cursor-not-allowed' 
                    : 'hover:shadow-orange-500/30 hover:from-orange-500 hover:to-orange-500 active:scale-[0.98]'
                }`}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span>{t('login.loggingIn')}</span>
                  </>
                ) : (
                  <>
                    <span>{t('login.loginButton')}</span>
                    <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center my-6">
              <div className="flex-grow h-px bg-white/10" />
              <span className="px-4 text-xs text-gray-500 uppercase tracking-wider">{t('login.orLoginWith')}</span>
              <div className="flex-grow h-px bg-white/10" />
            </div>

            {/* GitHub button */}
            <button
              type="button"
              onClick={handleGithubLogin}
              className="w-full flex items-center justify-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium text-white hover:bg-white/[0.08] hover:border-white/20 transition-all duration-200 active:scale-[0.98]"
            >
              <Github size={18} />
              <span>{t('login.continueWithGithub')}</span>
            </button>
          </div>

          {/* Sign up link */}
          <p className="text-center text-sm text-gray-500 mt-6">
            {t('login.noAccount')}{' '}
            <Link to="/signup" className="text-orange-400 hover:text-orange-300 font-medium transition-colors">
              {t('login.signUp')}
            </Link>
          </p>

          {/* Feature highlights */}
          <div className="mt-8 flex items-center justify-center gap-6 text-xs text-gray-600">
            <span className="flex items-center gap-1.5">
              <Sparkles size={12} className="text-orange-500/60" />
              {currentLanguage === 'zh' ? 'AI 驱动' : 'AI Powered'}
            </span>
            <span className="w-1 h-1 rounded-full bg-gray-700" />
            <span>{currentLanguage === 'zh' ? '安全加密' : 'Encrypted'}</span>
            <span className="w-1 h-1 rounded-full bg-gray-700" />
            <span>{currentLanguage === 'zh' ? '免费使用' : 'Free to Use'}</span>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
