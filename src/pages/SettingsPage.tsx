import React, { useState, useEffect, useRef } from 'react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { User, CreditCard, Trash2, Award, MessageSquare, ShoppingCart, Wallet, Bot, Plus, Pencil, X, Sparkles } from 'lucide-react';
import { api } from '../services/api';
import { chatApi, streamChatSend } from '../services/chatApi';
import type { AgentCategory } from '../types';
import { toast } from '../utils/toast';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { Modal } from 'antd';
import { QRCodeCanvas } from 'qrcode.react';

export const SettingsPage: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('mine');
  const [formData, setFormData] = useState({
    name: localStorage.getItem('nickname') || '',
    email: localStorage.getItem('username') || '',
    company: '示例公司',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    emailNotifications: true,
    browserNotifications: false
  });
  const [rewardsData, setRewardsData] = useState({
    totalPoints: 0,
    pendingPoints: 0,
    feedbackList: []
  });
  const [balanceData, setBalanceData] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [orderLoading, setOrderLoading] = useState(false);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [orderPagination, setOrderPagination] = useState({ current: 1, pageSize: 5, total: 0 });
  // 继续支付弹窗与轮询
  const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false);
  const [paymentOrder, setPaymentOrder] = useState<any>(null);
  const paymentPollTimer = useRef<any>(null);
  const [continuingOrderNo, setContinuingOrderNo] = useState<string | null>(null);
  const [myAgents, setMyAgents] = useState<any[]>([]);
  const [agentsLoading, setAgentsLoading] = useState(false);
  const [agentCategories, setAgentCategories] = useState<AgentCategory[]>([]);
  const [agentModalOpen, setAgentModalOpen] = useState(false);
  const [agentModalMode, setAgentModalMode] = useState<'create' | 'edit'>('create');
  const [agentSubmitting, setAgentSubmitting] = useState(false);
  const [agentPromptGenLoading, setAgentPromptGenLoading] = useState(false);
  const [agentForm, setAgentForm] = useState({
    id: '' as string | number | '',
    name: '',
    description: '',
    systemPrompt: '',
    categoryId: '' as '' | number,
    nameEn: '',
    descriptionEn: '',
  });

  const parseMyAgentsRows = (res: any): any[] => {
    if (!res || res.code !== 200) return [];
    const d = res.data;
    if (d && Array.isArray(d.rows)) return d.rows;
    if (Array.isArray(d)) return d;
    if (Array.isArray(res.rows)) return res.rows;
    return [];
  };

  const loadAgentCategories = async () => {
    try {
      const categoriesRes = await api.agent.getCategories();
      if (categoriesRes.code !== 200) return;
      let categoriesData: any[] = [];
      const raw = categoriesRes.data as any;
      if (raw?.categories) categoriesData = raw.categories;
      else if (Array.isArray(raw)) categoriesData = raw;
      const active = (categoriesData || []).filter((c: AgentCategory) => c.status === 1);
      setAgentCategories(active);
    } catch (e) {
      console.error('加载 Agent 分类失败', e);
    }
  };

  const fetchMyAgents = async () => {
    setAgentsLoading(true);
    try {
      const res = await api.agent.getMyList();
      setMyAgents(parseMyAgentsRows(res));
    } catch (e) {
      console.error('加载我的 Agent 失败', e);
      toast.error('加载我的 Agent 失败');
      setMyAgents([]);
    } finally {
      setAgentsLoading(false);
    }
  };

  const openCreateAgentModal = () => {
    setAgentModalMode('create');
    setAgentForm({
      id: '',
      name: '',
      description: '',
      systemPrompt: '',
      categoryId: '',
      nameEn: '',
      descriptionEn: '',
    });
    setAgentModalOpen(true);
  };

  const openEditAgentModal = (row: any) => {
    setAgentModalMode('edit');
    setAgentForm({
      id: row.id,
      name: row.name || '',
      description: row.description || '',
      systemPrompt: row.systemPromote || row.systemPrompt || '',
      categoryId: row.categoryId != null && row.categoryId !== '' ? Number(row.categoryId) : '',
      nameEn: row.nameEn || '',
      descriptionEn: row.descriptionEn || '',
    });
    setAgentModalOpen(true);
  };

  const buildAgentWriteBody = (includeId?: string | number): Record<string, unknown> => {
    const description = agentForm.description.trim();
    const body: Record<string, unknown> = {
      name: agentForm.name.trim(),
      description,
      systemRole: description,
      systemPrompt: agentForm.systemPrompt.trim(),
    };
    if (agentForm.categoryId !== '' && agentForm.categoryId != null) body.categoryId = Number(agentForm.categoryId);
    if (agentForm.nameEn.trim()) body.nameEn = agentForm.nameEn.trim();
    if (agentForm.descriptionEn.trim()) body.descriptionEn = agentForm.descriptionEn.trim();
    if (includeId != null && includeId !== '') body.id = includeId;
    return body;
  };

  const handleAiGenerateSystemPrompt = async () => {
    const name = agentForm.name.trim();
    const desc = agentForm.description.trim();
    if (!name) return toast.error('请先填写 Agent 名称');
    if (!desc) return toast.error('请先填写 Agent 描述');
    const currentUserId = localStorage.getItem('userId');
    const currentToken = localStorage.getItem('token');
    if (!currentUserId || !currentToken) return toast.error('请先登录后再使用 AI 生成');

    setAgentPromptGenLoading(true);
    try {
      const sessionResponse = await chatApi.createSession({
        userId: currentUserId,
        sessionContent: '生成 Agent 系统提示词',
        sessionTitle: '生成系统提示词',
        remark: 'settings-agent-prompt-gen',
        appId: 'mcpx-chat',
      });
      if (sessionResponse.code !== 200 || sessionResponse.data == null) {
        toast.error((sessionResponse as any).msg || (sessionResponse as any).message || '创建会话失败');
        return;
      }
      const sessionIdForGen = String(sessionResponse.data);
      const userPrompt = `Agent 名称：${name}\n\nAgent 描述：${desc}\n\n请根据以上信息，撰写一段完整、可直接用作该对话 Agent 系统提示词（system prompt）的正文。要求语气专业、边界清晰、突出角色与任务。只输出提示词正文，不要标题、不要代码围栏、不要解释性前后缀。`;
      let aggregated = '';
      await new Promise<void>((resolve, reject) => {
        streamChatSend(
          {
            messages: [{ role: 'user', content: userPrompt }],
            sessionId: sessionIdForGen,
            userId: parseInt(currentUserId, 10),
            stream: true,
            isMcp: false,
            model: 'deepseek-chat',
            appId: 'mcpx-chat',
            sysPrompt: '你是专业的 AI Agent 配置助手，只根据用户提供的名称与描述生成系统提示词正文，不要输出 Markdown 代码块或任何与正文无关的内容。',
          },
          (chunk: any) => {
            if (chunk?.type === 'agent_step') return;
            const delta = chunk?.choices?.[0]?.delta?.content;
            if (delta) aggregated += delta;
          },
          (err) => reject(err),
          () => resolve()
        );
      });
      const finalText = aggregated.trim();
      if (!finalText) return toast.error('未收到模型回复，请重试');
      setAgentForm((p) => ({ ...p, systemPrompt: finalText }));
      toast.success('已填入系统提示词');
    } catch (e: any) {
      console.error('AI 生成系统提示词失败', e);
      toast.error(e?.message || '生成失败，请重试');
    } finally {
      setAgentPromptGenLoading(false);
    }
  };

  const handleAgentModalOk = async () => {
    if (!agentForm.name.trim()) return toast.error('请填写 Agent 名称');
    if (!agentForm.description.trim()) return toast.error('请填写描述');
    if (!agentForm.systemPrompt.trim()) return toast.error('请填写系统提示词（systemPrompt）');
    setAgentSubmitting(true);
    try {
      if (agentModalMode === 'create') {
        const res = await api.agent.createMy(buildAgentWriteBody());
        if (res.code === 200) {
          toast.success('创建成功');
          setAgentModalOpen(false);
          await fetchMyAgents();
        } else {
          toast.error((res as any).msg || (res as any).message || '创建失败');
        }
      } else {
        const id = agentForm.id;
        if (id === '' || id == null) return toast.error('缺少 Agent ID');
        const res = await api.agent.updateMy(id, buildAgentWriteBody(id));
        if (res.code === 200) {
          toast.success('保存成功');
          setAgentModalOpen(false);
          await fetchMyAgents();
        } else {
          toast.error((res as any).msg || (res as any).message || '保存失败');
        }
      }
    } catch (e: any) {
      console.error('保存 Agent 失败', e);
      toast.error(e?.message || '保存失败');
    } finally {
      setAgentSubmitting(false);
    }
  };

  const handleDeleteAgent = async (id: string | number) => {
    if (!window.confirm('确认删除该 Agent 吗？')) return;
    try {
      const res = await api.agent.deleteMy(id);
      if (res.code === 200) {
        toast.success('删除成功');
        await fetchMyAgents();
      } else {
        toast.error((res as any).msg || (res as any).message || '删除失败');
      }
    } catch (e: any) {
      console.error('删除 Agent 失败', e);
      toast.error(e?.message || '删除失败');
    }
  };

  const stopPaymentPolling = () => {
    if (paymentPollTimer.current) {
      clearInterval(paymentPollTimer.current);
      paymentPollTimer.current = null;
    }
  };

  const startPaymentPolling = (orderNo: string) => {
    stopPaymentPolling();
    let attempts = 0;
    paymentPollTimer.current = setInterval(async () => {
      attempts += 1;
      try {
        const res = await api.payment.getOrderByNo(orderNo);
        const data: any = res?.data || res;
        const status = data?.paymentStatus ?? data?.status; // 1已支付
        if (status === 1 || status === '1') {
          stopPaymentPolling();
          setIsPaymentModalVisible(false);
          setPaymentOrder(null);
          setContinuingOrderNo(null);
          // 刷新订单列表
          fetchOrders();
        }
      } catch (e) {
        // 忽略单次错误
      }
      if (attempts >= 24) {
        // 约2分钟超时（5秒 * 24）
        stopPaymentPolling();
      }
    }, 5000);
  };

  // 获取奖研金和反馈数据
  const fetchRewardsData = async () => {
    setLoading(true);
    try {
      const response = await api.feedback.getMyFeedback();
      if (response.code === 200 && response.data) {
        // 计算总积分和账户余额
        const feedbackList = response.data || [];
        
        // 计算积分，如果rewardPoints为0则使用默认积分规则
        const getDefaultPoints = (feedbackType: number) => {
          switch(feedbackType) {
            case 1: return 1000; // 博主推广
            case 2: return 500;  // 开发者贡献（默认）
            case 3: return 100;  // 测试反馈
            default: return 100;
          }
        };
        
        const totalPoints = feedbackList.reduce((sum: number, item: any) => {
          // 只计算已审核通过的记录
          if (item.auditStatus === 1) {
            const points = item.rewardPoints || getDefaultPoints(item.feedbackType);
            return sum + points;
          }
          return sum;
        }, 0);
        
        const pendingPoints = feedbackList.reduce((sum: number, item: any) => {
          // 只计算审核中的记录
          if (item.auditStatus === 0) {
            const points = item.rewardPoints || getDefaultPoints(item.feedbackType);
            return sum + points;
          }
          return sum;
        }, 0);
        
        setRewardsData({
          totalPoints,
          pendingPoints,
          feedbackList
        });
      }
    } catch (error) {
      console.error('获取奖研金数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 获取订单数据
  const fetchOrders = async (page: number = orderPagination.current) => {
    setOrderLoading(true);
    try {
      const response = await api.payment.getMyOrders({
        pageNum: page,
        pageSize: orderPagination.pageSize
      });
      if (response.code === 200 && response.rows) {
        setOrders(response.rows);
        if (typeof response.total === 'number') {
          setOrderPagination(prev => ({ ...prev, current: page, total: response.total }));
        }
      }
    } catch (error) {
      console.error('获取订单数据失败:', error);
    } finally {
      setOrderLoading(false);
    }
  };

  const handleContinuePay = async (orderNo: string) => {
    if (continuingOrderNo) return;
    try {
      setContinuingOrderNo(orderNo);
      const res = await api.payment.continueWechatPay(orderNo);
      if (res && res.code === 200 && res.data) {
        setPaymentOrder(res.data);
        setIsPaymentModalVisible(true);
        startPaymentPolling(orderNo);
      }
    } catch (e) {
      console.error('继续支付失败', e);
    }
  };

  // 获取余额数据
  const fetchBalanceData = async () => {
    setBalanceLoading(true);
    try {
      const response = await api.payment.getMyBalanceAndPlan();
      if (response.code === 200 && response.data) {
        setBalanceData(response.data);
        // 存储用户套餐到缓存
        if (response.data.userPlan) {
          localStorage.setItem('userPlan', response.data.userPlan);
          console.log('用户套餐已存储到缓存:', response.data.userPlan);
        }
      }
    } catch (error) {
      console.error('获取余额数据失败:', error);
    } finally {
      setBalanceLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'rewards') {
      fetchRewardsData();
    } else if (activeTab === 'orders') {
      fetchOrders(1);
    } else if (activeTab === 'mine') {
      fetchBalanceData();
    } else if (activeTab === 'agents') {
      fetchMyAgents();
      loadAgentCategories();
    }
  }, [activeTab]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('表单已提交:', formData);
  };

  // 获取订单状态文本
  const getStatusText = (status: number) => {
    const statusMap: Record<number, string> = {
      0: t('order.status.pending'),
      1: t('order.status.paid'),
      2: t('order.status.cancelled'),
      3: t('order.status.refunded')
    };
    return statusMap[status] || t('order.status.unknown');
  };

  // 获取订单状态样式
  const getStatusColor = (status: number) => {
    const colorMap: Record<number, string> = {
      0: 'text-yellow-600 bg-yellow-100',
      1: 'text-green-600 bg-green-100',
      2: 'text-red-600 bg-red-100',
      3: 'text-gray-600 bg-gray-100'
    };
    return colorMap[status] || 'text-gray-600 bg-gray-100';
  };

  // 获取支付方式文本
  const getPayMethodText = (payMethod: string) => {
    const methodMap: Record<string, string> = {
      'wxpay': t('order.payMethod.wechat'),
      'alipay': t('order.payMethod.alipay'),
      'bankcard': t('order.payMethod.bankcard')
    };
    return methodMap[payMethod] || payMethod;
  };

  // 获取套餐显示名称
  const getPlanDisplayName = (plan: string) => {
    const planMap: Record<string, string> = {
      'free': t('balance.plans.free'),
      'pro': t('balance.plans.pro'),
      'vip': t('balance.plans.vip'),
      'enterprise': t('balance.plans.enterprise')
    };
    return planMap[plan?.toLowerCase()] || plan || t('balance.plans.free');
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Navbar />
      
      <main className="flex-grow container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">{t('settings.title')}</h1>
          
          <div className="flex flex-col md:flex-row gap-8">
            {/* Sidebar */}
            <div className="w-full md:w-64 space-y-2">
              <button
                onClick={() => setActiveTab('mine')}
                className={`w-full text-left px-4 py-2 rounded-lg flex items-center ${
                  activeTab === 'mine' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <User size={18} className="mr-3" />
                我的
              </button>
              
              <button
                onClick={() => setActiveTab('orders')}
                className={`w-full text-left px-4 py-2 rounded-lg flex items-center ${
                  activeTab === 'orders' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <ShoppingCart size={18} className="mr-3" />
                {t('settings.tabs.orders')}
              </button>
              
              <button
                onClick={() => setActiveTab('rewards')}
                className={`w-full text-left px-4 py-2 rounded-lg flex items-center ${
                  activeTab === 'rewards' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <Award size={18} className="mr-3" />
                {t('settings.tabs.rewards')}
              </button>

              <button
                onClick={() => setActiveTab('agents')}
                className={`w-full text-left px-4 py-2 rounded-lg flex items-center ${
                  activeTab === 'agents' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <Bot size={18} className="mr-3" />
                Agent 管理
              </button>
              
              {/* <button
                onClick={() => setActiveTab('security')}
                className={`w-full text-left px-4 py-2 rounded-lg flex items-center ${
                  activeTab === 'security' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <Lock size={18} className="mr-3" />
                安全设置
              </button>
              
              <button
                onClick={() => setActiveTab('notifications')}
                className={`w-full text-left px-4 py-2 rounded-lg flex items-center ${
                  activeTab === 'notifications' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <Bell size={18} className="mr-3" />
                通知设置
              </button>
              
              <button
                onClick={() => setActiveTab('api')}
                className={`w-full text-left px-4 py-2 rounded-lg flex items-center ${
                  activeTab === 'api' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <Key size={18} className="mr-3" />
                API 密钥
              </button> */}
              {/*
              <button
                onClick={() => setActiveTab('billing')}
                className={`w-full text-left px-4 py-2 rounded-lg flex items-center ${
                  activeTab === 'billing' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <CreditCard size={18} className="mr-3" />
                账单与订阅
              </button>
              */}
            </div>
            
            {/* Content */}
            <div className="flex-1">
              {activeTab === 'mine' && (
                <div className="bg-gray-900 rounded-lg p-6">
                  <h2 className="text-xl font-bold mb-6">我的</h2>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
                        姓名
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        disabled={true}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-orange-500"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                        邮箱地址
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        disabled={true}
                        onChange={handleChange}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-orange-500"
                      />
                    </div>
                    
                    {/* <div>
                      <label htmlFor="company" className="block text-sm font-medium text-gray-300 mb-1">
                        公司
                      </label>
                      <input
                        type="text"
                        id="company"
                        name="company"
                        value={formData.company}
                        onChange={handleChange}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-orange-500"
                      />
                    </div>
                     */}
                    {/* <button
                      type="submit"
                      className="bg-orange-500 text-black font-medium rounded-lg px-4 py-2.5 hover:bg-orange-600 transition-colors"
                    >
                      保存更改
                    </button> */}
                  </form>
                  <div className="mt-8">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold">{t('settings.balance.title')}</h3>
                      <button
                        onClick={fetchBalanceData}
                        disabled={balanceLoading}
                        className="px-3 py-1.5 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm disabled:opacity-50"
                      >
                        {balanceLoading ? t('balance.loading') : t('balance.refresh')}
                      </button>
                    </div>
                    {balanceLoading && !balanceData ? (
                      <div className="text-center py-8">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                        <p className="mt-4 text-gray-300">{t('balance.loading')}</p>
                      </div>
                    ) : (
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-xl p-6 text-white">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-base font-bold">{t('balance.currentBalance')}</h4>
                            <Wallet size={20} />
                          </div>
                          <div className="text-3xl font-bold mb-2">
                            ￥{balanceData?.userBalance?.toFixed(2) || '0.00'}
                          </div>
                          <div className="text-orange-100 text-xs">
                            {t('balance.availableBalance')}
                          </div>
                        </div>
                        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-base font-bold">{t('balance.currentPlan')}</h4>
                            <CreditCard size={20} className="text-gray-400" />
                          </div>
                          <div className="text-2xl font-bold text-orange-500 mb-2">
                            {getPlanDisplayName(balanceData?.userPlan || 'free')}
                          </div>
                          <div className="text-gray-400 text-sm">
                            {t('balance.planDescription')}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {activeTab === 'orders' && (
                <div className="bg-gray-900 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold">{t('settings.orders.title')}</h2>
                    <button
                      onClick={() => fetchOrders(orderPagination.current)}
                      disabled={orderLoading}
                      className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium disabled:opacity-50"
                    >
                      {orderLoading ? t('order.loading') : t('order.refresh')}
                    </button>
                  </div>
                  
                  {orderLoading ? (
                    <div className="text-center py-8">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                      <p className="mt-4 text-gray-300">{t('order.loading')}</p>
                    </div>
                  ) : orders.length === 0 ? (
                    <div className="text-center py-8">
                      <ShoppingCart size={48} className="text-gray-600 mx-auto mb-2" />
                      <p className="text-gray-400">{t('order.noOrders')}</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders.map((order) => (
                        <div key={order.id} className="bg-gray-800 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <h4 className="font-medium text-white">{order.orderName}</h4>
                              <p className="text-sm text-gray-400">{order.orderNo}</p>
                            </div>
                            <div className="text-right">
                              <div className="text-orange-500 font-bold">￥{order.amount}</div>
                              <div className={`px-2 py-1 rounded-full text-xs ${getStatusColor(order.paymentStatus)}`}>
                                {getStatusText(order.paymentStatus)}
                              </div>
                            </div>
                          </div>
                          <div className="flex justify-between items-center text-sm text-gray-400">
                            <span>{getPayMethodText(order.payMethod)}</span>
                            <div className="flex items-center gap-3">
                              {order.paymentStatus === '0' && (
                                <button
                                  onClick={() => handleContinuePay(order.orderNo)}
                                  disabled={continuingOrderNo === order.orderNo}
                                  className={`px-3 py-1 rounded ${continuingOrderNo === order.orderNo ? 'bg-orange-500/60 cursor-not-allowed' : 'bg-orange-500 hover:bg-orange-600'} text-black`}
                                >
                                  {t('order.continuePay') || '继续支付'}
                                </button>
                              )}
                              <span>{new Date(order.createTime).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                      {/* 分页 */}
                      <div className="flex items-center justify-center gap-3 pt-2">
                        <button
                          onClick={() => fetchOrders(Math.max(1, orderPagination.current - 1))}
                          disabled={orderPagination.current <= 1 || orderLoading}
                          className="px-3 py-1.5 text-sm rounded bg-gray-700 text-white hover:bg-gray-600 disabled:opacity-50"
                        >
                          {t('order.pagination.prev')}
                        </button>
                        <span className="text-sm text-gray-400">
                          {orderPagination.current} / {Math.max(1, Math.ceil(orderPagination.total / orderPagination.pageSize))}
                        </span>
                        <button
                          onClick={() => fetchOrders(Math.min(Math.ceil(orderPagination.total / orderPagination.pageSize) || 1, orderPagination.current + 1))}
                          disabled={orderPagination.current >= Math.ceil(orderPagination.total / orderPagination.pageSize) || orderLoading}
                          className="px-3 py-1.5 text-sm rounded bg-gray-700 text-white hover:bg-gray-600 disabled:opacity-50"
                        >
                          {t('order.pagination.next')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {activeTab === 'security' && (
                <div className="bg-gray-900 rounded-lg p-6">
                  <h2 className="text-xl font-bold mb-6">安全设置</h2>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-300 mb-1">
                        当前密码
                      </label>
                      <input
                        type="password"
                        id="currentPassword"
                        name="currentPassword"
                        value={formData.currentPassword}
                        onChange={handleChange}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-orange-500"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="newPassword" className="block text-sm font-medium text-gray-300 mb-1">
                        新密码
                      </label>
                      <input
                        type="password"
                        id="newPassword"
                        name="newPassword"
                        value={formData.newPassword}
                        onChange={handleChange}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-orange-500"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-1">
                        确认新密码
                      </label>
                      <input
                        type="password"
                        id="confirmPassword"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-orange-500"
                      />
                    </div>
                    
                    <button
                      type="submit"
                      className="bg-orange-500 text-black font-medium rounded-lg px-4 py-2.5 hover:bg-orange-600 transition-colors"
                    >
                      更新密码
                    </button>
                  </form>
                  
                  <div className="mt-8 pt-8 border-t border-gray-800">
                    <h3 className="text-lg font-semibold mb-4 text-red-500">危险操作</h3>
                    <button className="flex items-center text-red-500 hover:text-red-400">
                      <Trash2 size={18} className="mr-2" />
                      删除账号
                    </button>
                  </div>
                </div>
              )}
              
              {activeTab === 'notifications' && (
                <div className="bg-gray-900 rounded-lg p-6">
                  <h2 className="text-xl font-bold mb-6">通知偏好设置</h2>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">邮件通知</h3>
                        <p className="text-sm text-gray-400">通过邮件接收服务器相关更新</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          name="emailNotifications"
                          checked={formData.emailNotifications}
                          onChange={handleChange}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">浏览器通知</h3>
                        <p className="text-sm text-gray-400">在浏览器中实时接收通知</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          name="browserNotifications"
                          checked={formData.browserNotifications}
                          onChange={handleChange}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                      </label>
                    </div>
                    
                    <button
                      type="submit"
                      className="bg-orange-500 text-black font-medium rounded-lg px-4 py-2.5 hover:bg-orange-600 transition-colors"
                    >
                      保存偏好
                    </button>
                  </form>
                </div>
              )}
              
              {activeTab === 'api' && (
                <div className="bg-gray-900 rounded-lg p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">API 密钥</h2>
                    <button className="bg-orange-500 text-black font-medium rounded-lg px-4 py-2 hover:bg-orange-600 transition-colors">
                      生成新密钥
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="bg-gray-800 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-medium">生产环境密钥</h3>
                          <p className="text-sm text-gray-400">创建于 2025年3月15日</p>
                        </div>
                        <button className="text-red-500 hover:text-red-400">撤销</button>
                      </div>
                      <div className="font-mono text-sm bg-gray-900 p-2 rounded">
                        sk_live_••••••••••••••••
                      </div>
                    </div>
                    
                    <div className="bg-gray-800 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-medium">开发环境密钥</h3>
                          <p className="text-sm text-gray-400">创建于 2025年3月10日</p>
                        </div>
                        <button className="text-red-500 hover:text-red-400">撤销</button>
                      </div>
                      <div className="font-mono text-sm bg-gray-900 p-2 rounded">
                        sk_test_••••••••••••••••
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {activeTab === 'rewards' && (
                <div className="bg-gray-900 rounded-lg p-6">
                  <h2 className="text-xl font-bold mb-6">我的积分</h2>
                  
                  {/* 积分统计 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-6 text-black">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-lg">总积分</h3>
                          <p className="text-2xl font-bold">{rewardsData.totalPoints}</p>
                        </div>
                        <Award size={40} className="opacity-80" />
                      </div>
                    </div>
                    
                    <div className="bg-gray-800 rounded-lg p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-lg text-white">待审核积分</h3>
                          <p className="text-2xl font-bold text-orange-500">{rewardsData.pendingPoints}</p>
                        </div>
                        <MessageSquare size={40} className="text-gray-400" />
                      </div>
                    </div>
                  </div>
                  
                  {/* 积分说明 */}
                  <div className="bg-gray-800 rounded-lg p-4 mb-6">
                    <h4 className="font-medium text-white mb-2">积分获取方式</h4>
                    <div className="text-sm text-gray-300 space-y-1">
                      <p>• 博主推广：1000积分/视频（B站、小红书等平台推广）</p>
                      <p>• 开发者贡献：根据PR难度获得相应积分（GitHub开源贡献）</p>
                      <p>• 测试反馈：100积分/条（有效Bug报告或优化建议）</p>
                    </div>
                  </div>
                  
                  {/* 我的反馈记录 */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">我的反馈记录</h3>
                      <button 
                        onClick={fetchRewardsData}
                        disabled={loading}
                        className="text-orange-500 hover:text-orange-400 text-sm disabled:opacity-50"
                      >
                        {loading ? '刷新中...' : '刷新'}
                      </button>
                    </div>
                    
                    {loading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
                        <p className="text-gray-400 mt-2">加载中...</p>
                      </div>
                    ) : rewardsData.feedbackList.length > 0 ? (
                      <div className="space-y-4">
                        {rewardsData.feedbackList.map((feedback: any, index: number) => (
                          <div key={index} className="bg-gray-800 rounded-lg p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <h4 className="font-medium text-white">
                                  {feedback.feedbackType === 1 ? '博主推广' : 
                                   feedback.feedbackType === 2 ? '开发者贡献' : '测试反馈'}
                                </h4>
                                <p className="text-sm text-gray-400 mt-1">
                                  {feedback.contributionDescription || feedback.detailedDescription || '无详细描述'}
                                </p>
                                {feedback.githubForkUrl && (
                                  <a 
                                    href={feedback.githubForkUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-xs text-orange-500 hover:text-orange-400 mt-1 inline-block"
                                  >
                                    查看GitHub链接 →
                                  </a>
                                )}
                                {feedback.releaseUrl && (
                                  <a 
                                    href={feedback.releaseUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-xs text-orange-500 hover:text-orange-400 mt-1 inline-block"
                                  >
                                    查看博文链接 →
                                  </a>
                                )}
                                {feedback.contactInfo && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    联系方式：{feedback.contactInfo}
                                  </p>
                                )}
                              </div>
                              <div className="text-right ml-4">
                                <div className="text-sm font-medium text-orange-500">
                                  +{feedback.rewardPoints || 
                                    (feedback.feedbackType === 1 ? 1000 :
                                     feedback.feedbackType === 2 ? 500 : 100)} 积分
                                </div>
                                <div className="text-xs text-gray-500">
                                  {feedback.createTime || ''}
                                </div>
                                <div className="text-xs mt-1">
                                  <span className={`px-2 py-1 rounded-full ${
                                    feedback.auditStatus === 1 ? 'bg-green-900 text-green-300' :
                                    feedback.auditStatus === 2 ? 'bg-red-900 text-red-300' :
                                    'bg-yellow-900 text-yellow-300'
                                  }`}>
                                    {feedback.auditStatus === 1 ? '已通过' :
                                     feedback.auditStatus === 2 ? '未通过' : '审核中'}
                                  </span>
                                </div>
                                {feedback.pointsGranted === 1 && feedback.auditStatus === 1 && (
                                  <div className="text-xs text-green-400 mt-1">
                                    积分已发放
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <MessageSquare size={48} className="text-gray-600 mx-auto mb-2" />
                        <p className="text-gray-400">暂无反馈记录</p>
                        <p className="text-sm text-gray-500 mt-1">
                          前往 <a href="/rewards" className="text-orange-500 hover:text-orange-400">奖研金计划</a> 提交反馈获得积分
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'agents' && (
                <div className="bg-gray-900 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold">Agent 管理</h2>
                    <button
                      type="button"
                      onClick={openCreateAgentModal}
                      className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-black px-4 py-2 rounded-lg font-medium"
                    >
                      <Plus size={16} />
                      新建 Agent
                    </button>
                  </div>
                  {/* <div className="text-sm text-gray-400 mb-4">
                    系统提示词请使用字段 <code className="text-orange-400">systemPrompt</code>。
                  </div> */}
                  <div className="space-y-3">
                    {agentsLoading ? (
                      <div className="text-gray-400">加载中...</div>
                    ) : myAgents.length === 0 ? (
                      <div className="text-gray-400">暂无 Agent，点击右上角新建。</div>
                    ) : (
                      myAgents.map((row) => (
                        <div key={row.id} className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <div className="text-white font-medium">{row.name || '-'}</div>
                              <div className="text-sm text-gray-400 mt-1 line-clamp-2">{row.description || '-'}</div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => navigate(`/chat?agent=${row.id}`)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-orange-500/20 hover:bg-orange-500/30 text-orange-300"
                              >
                                <MessageSquare size={14} />
                                对话
                              </button>
                              <button
                                type="button"
                                onClick={() => openEditAgentModal(row)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-gray-700 hover:bg-gray-600 text-gray-100"
                              >
                                <Pencil size={14} />
                                编辑
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteAgent(row.id)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-red-500/20 hover:bg-red-500/30 text-red-300"
                              >
                                <Trash2 size={14} />
                                删除
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
              
              {/* 隐藏账单与订阅内容区 */}
              {/*
              {activeTab === 'billing' && (
                <div className="bg-gray-900 rounded-lg p-6">
                  <h2 className="text-xl font-bold mb-6">账单与订阅</h2>
                  
                  <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-medium">当前套餐</h3>
                      <span className="bg-orange-500 text-black px-3 py-1 rounded-full text-sm font-medium">
                        专业版
                      </span>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-300">月度订阅</span>
                        <span className="font-medium">￥349/月</span>
                      </div>
                      <div className="text-sm text-gray-400">
                        下次扣费日期：2025年4月15日
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-8">
                    <h3 className="font-medium mb-4">支付方式</h3>
                    <div className="bg-gray-800 rounded-lg p-4 flex items-center justify-between">
                      <div className="flex items-center">
                        <CreditCard size={20} className="mr-3" />
                        <div>
                          <div className="font-medium">•••• •••• •••• 4242</div>
                          <div className="text-sm text-gray-400">有效期至 12/25</div>
                        </div>
                      </div>
                      <button className="text-orange-500 hover:text-orange-400">
                        更新
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-4">账单历史</h3>
                    <div className="space-y-2">
                      <div className="bg-gray-800 rounded-lg p-4 flex items-center justify-between">
                        <div>
                          <div className="font-medium">2025年3月</div>
                          <div className="text-sm text-gray-400">专业版套餐</div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">￥349.00</div>
                          <button className="text-sm text-orange-500 hover:text-orange-400">
                            下载
                          </button>
                        </div>
                      </div>
                      
                      <div className="bg-gray-800 rounded-lg p-4 flex items-center justify-between">
                        <div>
                          <div className="font-medium">2025年2月</div>
                          <div className="text-sm text-gray-400">专业版套餐</div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">￥349.00</div>
                          <button className="text-sm text-orange-500 hover:text-orange-400">
                            下载
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              */}
            </div>
          </div>
        </div>
      </main>

      <Modal
        title={<span className="text-white font-semibold text-base">{agentModalMode === 'create' ? '新建 Agent' : '编辑 Agent'}</span>}
        open={agentModalOpen}
        onCancel={() => {
          if (!agentSubmitting && !agentPromptGenLoading) setAgentModalOpen(false);
        }}
        onOk={handleAgentModalOk}
        confirmLoading={agentSubmitting}
        okText="保存"
        cancelText="取消"
        width={640}
        destroyOnClose
        rootClassName="settings-agent-modal"
        classNames={{
          content: '!bg-gray-900 !border !border-gray-700 !rounded-2xl shadow-xl',
          header: '!bg-gray-900 !border-b !border-gray-700 !pb-4 !mb-0',
          body: '!bg-gray-900 !pt-4',
          footer: '!bg-gray-900 !border-t !border-gray-700 !mt-0',
          mask: '!bg-black/70',
        }}
        okButtonProps={{
          disabled: agentPromptGenLoading,
          className: '!h-auto !py-2 !px-5 !bg-orange-500 !text-black !border-none hover:!bg-orange-600 font-medium rounded-lg',
        }}
        cancelButtonProps={{
          className: '!h-auto !py-2 !px-5 !bg-gray-800 !text-gray-200 !border-gray-600 hover:!bg-gray-700 hover:!text-white rounded-lg',
        }}
        closeIcon={<X className="text-gray-400 hover:text-white" size={20} strokeWidth={2} />}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">名称 *</label>
            <input
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder:text-gray-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/40"
              value={agentForm.name}
              onChange={(e) => setAgentForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="Agent 名称"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Agent描述 *</label>
            <textarea
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder:text-gray-500 min-h-[80px] focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/40 resize-y"
              value={agentForm.description}
              onChange={(e) => setAgentForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="简要描述用途"
            />
          </div>
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
              <label className="block text-sm font-medium text-gray-300">系统提示词（systemPrompt）*</label>
              <button
                type="button"
                onClick={handleAiGenerateSystemPrompt}
                disabled={agentPromptGenLoading || agentSubmitting}
                className="inline-flex items-center gap-1.5 rounded-lg border border-orange-500/50 bg-orange-500/15 px-3 py-1.5 text-sm font-medium text-orange-300 hover:bg-orange-500/25 hover:text-orange-200 disabled:opacity-50 disabled:pointer-events-none focus:outline-none focus:ring-1 focus:ring-orange-500/50"
              >
                <Sparkles className="h-4 w-4 shrink-0" strokeWidth={2} />
                {agentPromptGenLoading ? '生成中…' : 'AI 生成'}
              </button>
            </div>
            <textarea
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder:text-gray-500 min-h-[120px] font-mono text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/40 resize-y"
              value={agentForm.systemPrompt}
              onChange={(e) => setAgentForm((p) => ({ ...p, systemPrompt: e.target.value }))}
              placeholder="对应后端 systemPromote，请求字段名使用 systemPrompt"
              disabled={agentPromptGenLoading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">分类（可选）</label>
            <select
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/40 [&>option]:bg-gray-800 [&>option]:text-white"
              value={agentForm.categoryId === '' ? '' : String(agentForm.categoryId)}
              onChange={(e) => {
                const v = e.target.value;
                setAgentForm((p) => ({ ...p, categoryId: v === '' ? '' : Number(v) }));
              }}
            >
              <option value="">默认（服务端选用首个启用分类）</option>
              {agentCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Modal>

      <Footer />
      {/* 微信支付模态框（继续支付） */}
      <Modal
        title={t('pricing.wechatPayment')}
        open={isPaymentModalVisible}
        onCancel={() => {
          setIsPaymentModalVisible(false);
          setPaymentOrder(null);
          setContinuingOrderNo(null);
          stopPaymentPolling();
        }}
        footer={[
          <button
            key="close"
            onClick={() => {
              setIsPaymentModalVisible(false);
              setPaymentOrder(null);
              setContinuingOrderNo(null);
            }}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors mr-2"
          >
            {t('pricing.close')}
          </button>,
          <button
            key="confirm"
            onClick={() => {
              setIsPaymentModalVisible(false);
              setPaymentOrder(null);
              setContinuingOrderNo(null);
              stopPaymentPolling();
            }}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            {t('pricing.confirmPayment')}
          </button>
        ]}
        className="payment-modal"
      >
        <div className="py-4 text-center">
          <p className="text-gray-600 mb-6">{t('pricing.wechatPaymentDesc')}</p>
          <div className="flex justify-center mb-6">
            {paymentOrder && paymentOrder.qrCodeUrl ? (
              <div className="w-48 h-48 bg-white border-2 border-gray-300 rounded-lg overflow-hidden flex items-center justify-center">
                <QRCodeCanvas value={paymentOrder.qrCodeUrl} size={184} />
              </div>
            ) : (
              <div className="w-48 h-48 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl mb-2">📱</div>
                  <div className="text-gray-500 text-sm">{t('pricing.qrCodePlaceholder')}</div>
                </div>
              </div>
            )}
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            {paymentOrder && (
              <>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">{t('pricing.orderNo')}:</span>
                  <span className="text-gray-700 text-sm">{paymentOrder.orderNo}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">{t('pricing.paymentAmount')}:</span>
                  <span className="text-green-600 font-bold text-lg">￥{paymentOrder.amount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">{t('pricing.productName')}:</span>
                  <span className="text-gray-700">{paymentOrder.orderName}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};

// 支付弹窗（复用 PricingPage 视觉风格）
// 放在页面底部，保持组件结构清晰