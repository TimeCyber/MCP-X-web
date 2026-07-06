import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { Github } from 'lucide-react';
import api from '../services/api';
import { toast } from '../utils/toast';
import { useLanguage } from '../contexts/LanguageContext';

type LoginMode = 'password' | 'sms';

const PHONE_REGEX = /^1[3-9]\d{9}$/;

export const LoginPage: React.FC = () => {
  const { t, currentLanguage } = useLanguage();
  const [loginMode, setLoginMode] = useState<LoginMode>('password');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [smsCode, setSmsCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const inviteCode = searchParams.get('code') || '';
  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  useEffect(() => {
    return () => {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
    };
  }, []);

  const startCountdown = () => {
    setCountdown(60);
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
    }
    countdownTimerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (countdownTimerRef.current) {
            clearInterval(countdownTimerRef.current);
            countdownTimerRef.current = null;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleLoginSuccess = (res: any) => {
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

    toast.success(t('login.loginSuccess'));

    const from = (location.state as any)?.from?.pathname;
    if (!from || from === '/signup' || from === '/forgot-password') {
      navigate('/', { replace: true });
    } else {
      navigate(from, { replace: true });
    }
  };

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

      if (res && res.code === 200) {
        if (rememberMe) {
          localStorage.setItem('savedUsername', username);
          localStorage.setItem('savedPassword', password);
          localStorage.setItem('rememberMe', 'true');
        } else {
          localStorage.removeItem('savedUsername');
          localStorage.removeItem('savedPassword');
          localStorage.removeItem('rememberMe');
        }

        handleLoginSuccess(res);
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

  const handleSendSmsCode = async () => {
    const trimmedPhone = phone.trim();
    if (!trimmedPhone) {
      setError(currentLanguage === 'zh' ? '请输入手机号' : 'Please enter phone number');
      return;
    }
    if (!PHONE_REGEX.test(trimmedPhone)) {
      setError(t('login.invalidPhone'));
      return;
    }

    setSendingCode(true);
    setError('');

    try {
      const res = await api.user.smsCode(trimmedPhone);
      if (res && res.code === 200) {
        toast.success(t('login.codeSent'));
        startCountdown();
      } else {
        setError(res?.msg || res?.message || t('login.sendCodeFailed'));
      }
    } catch (err: any) {
      console.error('发送验证码错误:', err);
      setError(err?.response?.data?.msg || err?.message || t('login.sendCodeFailed'));
    } finally {
      setSendingCode(false);
    }
  };

  const handleSmsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedPhone = phone.trim();
    if (!PHONE_REGEX.test(trimmedPhone)) {
      setError(t('login.invalidPhone'));
      return;
    }
    if (!smsCode.trim()) {
      setError(currentLanguage === 'zh' ? '请输入验证码' : 'Please enter verification code');
      return;
    }

    setLoading(true);

    try {
      const res = await api.user.smsLogin(trimmedPhone, smsCode.trim(), inviteCode || undefined);

      if (res && res.code === 200) {
        handleLoginSuccess(res);
      } else {
        setError(res?.msg || res?.message || t('login.loginFailed'));
      }
    } catch (err: any) {
      console.error('手机验证码登录错误:', err);
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

            <div className="flex mb-6 bg-gray-800 rounded-lg p-1">
              <button
                type="button"
                onClick={() => { setLoginMode('password'); setError(''); }}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                  loginMode === 'password'
                    ? 'bg-orange-500 text-black'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {t('login.passwordLogin')}
              </button>
              <button
                type="button"
                onClick={() => { setLoginMode('sms'); setError(''); }}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                  loginMode === 'sms'
                    ? 'bg-orange-500 text-black'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {t('login.smsLogin')}
              </button>
            </div>

            {loginMode === 'password' ? (
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
            ) : (
              <form onSubmit={handleSmsLogin}>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-1">
                      {t('login.phone')}
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-400 focus:outline-none focus:border-orange-500"
                      placeholder={t('login.phonePlaceholder')}
                      maxLength={11}
                      required
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      {t('login.phoneHint')}
                    </p>
                    <p className="mt-1 text-xs text-orange-400/90">
                      {t('login.smsAutoRegisterHint')}
                    </p>
                  </div>

                  <div>
                    <label htmlFor="smsCode" className="block text-sm font-medium text-gray-300 mb-1">
                      {t('login.verificationCode')}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        id="smsCode"
                        value={smsCode}
                        onChange={(e) => setSmsCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        className="flex-1 min-w-0 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-400 focus:outline-none focus:border-orange-500"
                        placeholder={t('login.verificationCodePlaceholder')}
                        maxLength={6}
                        required
                      />
                      <button
                        type="button"
                        onClick={handleSendSmsCode}
                        disabled={sendingCode || countdown > 0}
                        className={`shrink-0 px-4 py-2.5 bg-gray-800 border border-gray-700 text-sm font-medium rounded-lg hover:border-orange-500 hover:text-orange-400 transition-colors whitespace-nowrap ${
                          sendingCode || countdown > 0 ? 'opacity-70 cursor-not-allowed' : ''
                        }`}
                      >
                        {sendingCode
                          ? t('login.sendingCode')
                          : countdown > 0
                            ? `${countdown}s`
                            : t('login.sendCode')}
                      </button>
                    </div>
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
            )}

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
