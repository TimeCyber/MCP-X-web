import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { Github, AlertTriangle } from 'lucide-react';
import api from '../services/api';
import { toast } from '../utils/toast';
import { useLanguage } from '../contexts/LanguageContext';

export const SignupPage: React.FC = () => {
  const { t, currentLanguage } = useLanguage();
  const [searchParams] = useSearchParams();
  const [inviteCode] = useState(() => searchParams.get('code') || '');
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    code: '',
    agreeToTerms: false
  });
  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    // 邮箱格式校验
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.username.trim())) {
      setError(currentLanguage === 'zh' ? '请输入正确的邮箱地址' : 'Please enter a valid email address');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError(t('signup.passwordMismatch'));
      return;
    }
    if (!formData.agreeToTerms) {
      setError(t('signup.agreeTerms'));
      return;
    }
    setLoading(true);
    try {
      // 使用新的ruoyi-element-ai项目的注册接口，如果有邀请码则一并传入
      const res = await api.user.register(formData.username, formData.password, formData.code, inviteCode || undefined);
      if (res && res.code === 200) {
        toast.success(t('signup.registerSuccess'));
        setSuccess(t('signup.registerSuccessRedirect'));
        setTimeout(() => {
          navigate('/login');
        }, 1500);
      } else {
        setError(res?.msg || res?.message || t('signup.registerFailed'));
      }
    } catch (err: any) {
      console.error('注册错误:', err);
      setError(err?.response?.data?.msg || err?.message || t('signup.registerFailedRetry'));
    } finally {
      setLoading(false);
    }
  };

  const handleSendCode = async () => {
    if (!formData.username) {
      setError(t('signup.enterUsername'));
      return;
    }
    // 邮箱格式校验
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.username.trim())) {
      setError(currentLanguage === 'zh' ? '请输入正确的邮箱地址' : 'Please enter a valid email address');
      return;
    }
    
    setSendingCode(true);
    setError('');
    
    try {
      const res = await api.user.emailCode(formData.username);
      if (res && res.code === 200) {
        toast.success(t('signup.codeSent'));
      } else {
        setError(res?.msg || res?.message || t('signup.sendCodeFailed'));
      }
    } catch (err: any) {
      console.error('发送验证码错误:', err);
      setError(err?.response?.data?.msg || err?.message || t('signup.sendCodeFailed'));
    } finally {
      setSendingCode(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Navbar />
      
      <main className="flex-grow flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-2">{t('signup.title')}</h1>
            <p className="text-gray-400">{t('signup.subtitle')}</p>
          </div>
          
          <div className="bg-gray-900 rounded-lg p-6 mb-4">
            {inviteCode && (
              <div className="mb-4 p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg text-sm text-orange-300 flex items-center gap-2">
                <span>🎁</span>
                <span>
                  {currentLanguage === 'zh'
                    ? `你通过邀请链接访问，注册后双方各得 100 元 Token 奖励（邀请码：${inviteCode}）`
                    : `You're invited! Both you and your friend will get ¥100 Token after registration (Code: ${inviteCode})`}
                </span>
              </div>
            )}
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-1">
                    {t('signup.username')}
                  </label>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-400 focus:outline-none focus:border-orange-500"
                    placeholder={currentLanguage === 'zh' ? '请输入邮箱地址' : 'Please enter email address'}
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    {currentLanguage === 'zh' ? '请填写有效的邮箱地址作为用户名，用于接收验证码' : 'Use a valid email as your username to receive the verification code.'}
                  </p>
                </div>

                <div>
                  <label htmlFor="code" className="block text-sm font-medium text-gray-300 mb-1">
                    {t('signup.verificationCode')}
                  </label>
                  <div className="flex space-x-2">
                  <input
                    type="text"
                      id="code"
                      name="code"
                      value={formData.code}
                    onChange={handleChange}
                      className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-400 focus:outline-none focus:border-orange-500"
                      placeholder={t('signup.verificationCodePlaceholder')}
                    required
                  />
                    <button
                      type="button"
                      onClick={handleSendCode}
                      disabled={sendingCode}
                      className={`px-4 py-2.5 bg-orange-500 text-black font-medium rounded-lg hover:bg-orange-600 transition-colors ${sendingCode ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                      {sendingCode ? t('signup.sending') : t('signup.sendCode')}
                    </button>
                  </div>
                </div>
                
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
                    {t('signup.password')}
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-400 focus:outline-none focus:border-orange-500"
                    placeholder={t('signup.passwordPlaceholder')}
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-1">
                    {t('signup.confirmPassword')}
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-400 focus:outline-none focus:border-orange-500"
                    placeholder={t('signup.confirmPasswordPlaceholder')}
                    required
                  />
                </div>
                
                <div className="bg-gray-800 rounded-lg p-4 flex items-start">
                  <AlertTriangle className="text-yellow-500 mt-1 mr-3 flex-shrink-0" size={16} />
                  <p className="text-sm text-gray-400">
                    {t('signup.passwordRule')}
                  </p>
                </div>
                
                <div className="flex items-start">
                  <input
                    type="checkbox"
                    id="agreeToTerms"
                    name="agreeToTerms"
                    checked={formData.agreeToTerms}
                    onChange={handleChange}
                    className="mt-1 h-4 w-4 rounded border-gray-700 bg-gray-800 text-orange-500 focus:ring-orange-500"
                    required
                  />
                  <label htmlFor="agreeToTerms" className="ml-2 text-sm text-gray-300">
                    {t('signup.agreeText')}{' '}
                    <Link to="/terms" className="text-orange-500 hover:text-orange-400">
                      {t('signup.termsOfService')}
                    </Link>{' '}
                    {t('signup.and')}{' '}
                    <Link to="/privacy" className="text-orange-500 hover:text-orange-400">
                      {t('signup.privacyPolicy')}
                    </Link>
                  </label>
                </div>
                
                <button
                  type="submit"
                  className={`w-full bg-orange-500 text-black font-medium rounded-lg px-4 py-2.5 hover:bg-orange-600 transition-colors ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                  disabled={loading}
                >
                  {loading ? t('signup.registering') : t('signup.createAccount')}
                </button>
                {error && (
                  <div className="mt-3 p-3 bg-red-900/50 border border-red-800 rounded-lg text-sm text-red-200">
                    {error}
                  </div>
                )}
                {success && (
                  <div className="mt-3 p-3 bg-green-900/50 border border-green-800 rounded-lg text-sm text-green-200">
                    {success}
                  </div>
                )}
              </div>
            </form>
            <div className="flex items-center my-6">
              <div className="flex-grow border-t border-gray-800"></div>
              <span className="px-4 text-sm text-gray-500">{t('signup.orSignupWith')}</span>
              <div className="flex-grow border-t border-gray-800"></div>
            </div>
            <button className="w-full flex items-center justify-center bg-white text-black rounded-lg px-4 py-2.5 font-medium hover:bg-gray-100 transition-colors">
              <Github size={20} className="mr-2" />
              {t('signup.continueWithGithub')}
            </button>
          </div>
          
          <p className="text-center text-sm text-gray-400">
            {t('signup.alreadyHaveAccount')}{' '}
            <Link to="/login" className="text-orange-500 hover:text-orange-400">
              {t('signup.loginLink')}
            </Link>
          </p>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};