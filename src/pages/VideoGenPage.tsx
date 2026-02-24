import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import VideoGenSidebar from '../components/video-gen/VideoGenSidebar';
import VideoGenDashboard, { isServerSyncCompleted } from '../components/video-gen/VideoGenDashboard';
import StageScript from '../components/video-gen/StageScript';
import StageAssets from '../components/video-gen/StageAssets';
import StageDirector from '../components/video-gen/StageDirector';
import StageExport from '../components/video-gen/StageExport';
import type { VideoGenProject } from '../types/videogen';
import { saveProjectToDB } from '../services/videogenService';
import { chatApi } from '../services/chatApi';
import { api } from '../services/api';
import { toast } from '../utils/toast';

// 邀请制遮盖页面组件
const InvitationOnlyOverlay: React.FC<{ onApply: (formData: any) => void; isSubmitting: boolean }> = ({ onApply, isSubmitting }) => {
  const [formData, setFormData] = useState({
    reason: '',
    experience: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onApply(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-xl">
        <div className="bg-[#0F1115] border border-white/10 rounded-2xl p-8 shadow-2xl relative overflow-hidden ring-1 ring-white/5">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

          {/* Header */}
          <div className="text-center mb-8 relative z-10">
            <div className="inline-flex items-center justify-center p-3 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-2xl mb-5 ring-1 ring-white/10 shadow-lg shadow-blue-500/10">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-inner">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-white">
                  <path d="M15 10l4.553-2.276A1 1 0 0 1 21 8.618v6.764a1 1 0 0 1-1.447.894L15 14M5 18h8a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2z" />
                  <path d="M7 10l2 2-2 2" />
                </svg>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">视频工作台申请</h2>
            <p className="text-gray-400 text-sm max-w-sm mx-auto leading-relaxed">
              为确保极致的服务体验，我们目前仅向受邀创作者开放 Video Studio 功能。
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            <div className="space-y-5">
              {/* Reason Input */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300 ml-1">
                  申请理由 <span className="text-blue-500">*</span>
                </label>
                <div className="relative group">
                  <textarea
                    required
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    placeholder="请描述您的创作计划或商业需求..."
                    rows={4}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all resize-none text-sm group-hover:bg-white/[0.07]"
                  />
                </div>
              </div>

              {/* Experience Select */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300 ml-1">
                  AI 视频创作经验
                </label>
                <div className="relative group">
                  <select
                    value={formData.experience}
                    onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all text-sm appearance-none group-hover:bg-white/[0.07]"
                  >
                    <option value="" className="bg-gray-900 text-gray-400">请选择您的经验水平</option>
                    <option value="beginner" className="bg-[#1a1d24]">新手 (首次尝试)</option>
                    <option value="intermediate" className="bg-[#1a1d24]">有一定经验 (使用过类似工具)</option>
                    <option value="advanced" className="bg-[#1a1d24]">熟练 (经常创作)</option>
                    <option value="professional" className="bg-[#1a1d24]">专业 (以此为职业)</option>
                  </select>
                  {/* Custom Arrow */}
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-4 flex items-start gap-3">
              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 mt-0.5">
                <span className="text-xs font-bold">i</span>
              </div>
              <div className="space-y-1">
                <p className="text-blue-200 text-xs font-medium">审核说明</p>
                <p className="text-blue-300/70 text-xs leading-relaxed">
                  提交后通常在 1-3 个工作日内完成审核。审核通过后您将自动获得权限。
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => window.history.back()}
                disabled={isSubmitting}
                className="px-6 py-3 bg-white/5 hover:bg-white/10 disabled:opacity-50 text-gray-300 font-medium rounded-xl transition-all text-sm"
              >
                返回
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-70 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-xl shadow-lg shadow-blue-900/20 transition-all flex items-center justify-center text-sm group"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    提交中...
                  </>
                ) : (
                  <>
                    提交申请
                    <svg className="w-4 h-4 ml-2 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const VideoGenPage: React.FC = () => {
  const navigate = useNavigate();
  const [project, setProject] = useState<VideoGenProject | null>(null);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [savingProject, setSavingProject] = useState(false);
  const [hasAccess, setHasAccess] = useState<boolean | null>(null); // null: loading, true: has access, false: no access
  const [isSubmittingApplication, setIsSubmittingApplication] = useState(false);

  // 标记项目是否已完全加载，防止初始化时触发自动保存覆盖服务端数据
  const isProjectLoadedRef = useRef(false);
  // 记录初始项目ID，用于检测是否是同一个项目的更新
  const initialProjectIdRef = useRef<string | null>(null);
  // 记录最新的项目状态，解决退出保存时的闭包问题
  const projectRef = useRef<VideoGenProject | null>(null);

  // 同步项目到 ref
  useEffect(() => {
    projectRef.current = project;
  }, [project]);

  // 检查登录状态
  useEffect(() => {
    const userId = localStorage.getItem('userId');
    const token = localStorage.getItem('token');
    if (!userId || !token) {
      alert('请先登录后再使用 MCP-X Video Studio 功能');
      navigate('/login');
      return;
    }
    // 暂时不验证套餐权限，直接放行
    setHasAccess(true);
  }, [navigate]);

  // 自动保存 - 只有在项目完全加载后才触发
  useEffect(() => {
    if (!project) return;

    // 如果项目还未标记为已加载，跳过自动保存
    if (!isProjectLoadedRef.current) {
      console.log('⏳ 项目初始化中，跳过自动保存');
      return;
    }

    setSaveStatus('unsaved');
    const timer = setTimeout(async () => {
      setSaveStatus('saving');
      try {
        // 检查服务端同步是否完成，未完成时只保存到本地，不同步到服务端
        const skipServerSync = !isServerSyncCompleted();
        if (skipServerSync) {
          console.log('⏳ 服务端数据尚未同步完成，仅保存到本地');
        }
        await saveProjectToDB(project, skipServerSync);
        setSaveStatus('saved');
      } catch (e) {
        console.error("Auto-save failed", e);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [project]);

  const updateProject = (updates: Partial<VideoGenProject> | ((prev: VideoGenProject | null) => VideoGenProject | null)) => {
    if (!project) return;
    if (typeof updates === 'function') {
      setProject(updates);
    } else {
      setProject(prev => prev ? ({ ...prev, ...updates }) : null);
    }
  };

  const setStage = (stage: 'script' | 'assets' | 'director' | 'export') => {
    updateProject({ stage });
  };

  const handleOpenProject = async (proj: VideoGenProject) => {
    // 重置加载标记
    isProjectLoadedRef.current = false;
    initialProjectIdRef.current = proj.id;

    // 确保项目有 sessionId（兼容旧项目）
    if (!proj.sessionId || proj.sessionId.startsWith('temp_session_') || proj.sessionId === 'undefined' || proj.sessionId === 'null') {
      const userId = localStorage.getItem('userId');
      if (userId) {
        try {
          const sessionResponse = await chatApi.createSession({
            userId: userId,
            sessionContent: JSON.stringify(proj),
            sessionTitle: proj.title || '未命名项目',
            remark: 'MCP-X Video Studio Project (Restored)',
            appId: 'mcpx-video-studio'
          });

          if (sessionResponse.code === 200 && sessionResponse.data) {
            const idValue = typeof sessionResponse.data === 'string' 
              ? sessionResponse.data 
              : (sessionResponse.data.id || sessionResponse.data.sessionId);
              
            if (idValue) {
              proj.sessionId = String(idValue);
              console.log('✅ 为项目创建/修复 session 成功:', proj.sessionId);
              // 立即保存到本地数据库，防止 sessionId 丢失导致列表重复
              await saveProjectToDB(proj, true);
            } else {
              console.warn('⚠️ 为项目创建 session 响应中没有识别到 id 或 sessionId', sessionResponse.data);
            }
          }
        } catch (error) {
          console.error('❌ 为项目创建 session 失败:', error);
        }
      }
    }

    setProject(proj);

    // 延迟标记项目已加载，确保初始状态设置完成后再允许自动保存
    setTimeout(() => {
      if (initialProjectIdRef.current === proj.id) {
        isProjectLoadedRef.current = true;
        console.log('✅ 项目已加载完成，启用自动保存');
      }
    }, 500);
  };

  const handleExitProject = async () => {
    if (projectRef.current && isProjectLoadedRef.current) {
      setSavingProject(true);
      try {
        // 检查服务端同步是否完成，未完成时只保存到本地
        const skipServerSync = !isServerSyncCompleted();
        if (skipServerSync) {
          console.log('⏳ 服务端数据尚未同步完成，退出时仅保存到本地');
        }
        await saveProjectToDB(projectRef.current, skipServerSync);
      } catch (error) {
        console.error('保存项目失败:', error);
      } finally {
        setSavingProject(false);
      }
    }
    // 重置标记
    isProjectLoadedRef.current = false;
    initialProjectIdRef.current = null;
    projectRef.current = null;
    setProject(null);
  };

  const handleLoadHistory = async (content: string) => {
    try {
      if (!content) return;

      const historyProject = JSON.parse(content) as VideoGenProject;

      // 保持当前的 sessionId，防止覆盖丢失关联
      if (project?.sessionId) {
        historyProject.sessionId = project.sessionId;
      }

      setProject(historyProject);

      // 立即保存一次到本地数据库
      await saveProjectToDB(historyProject);

      // 稍微延迟后刷新一下自动保存状态
      isProjectLoadedRef.current = true;
      initialProjectIdRef.current = historyProject.id;

      toast.success('已成功恢复到历史版本');
    } catch (error) {
      console.error('恢复历史版本失败:', error);
      toast.error('恢复历史版本失败: 数据格式错误');
    }
  };

  // 提交视频工作室访问申请
  const handleApplyForAccess = async (formData: any) => {
    setIsSubmittingApplication(true);

    try {
      // 获取用户信息用于提交申请（联系方式自动从登录信息获取）
      const nickname = localStorage.getItem('nickname') || '';
      const username = localStorage.getItem('username') || '';

      // 构建提交数据 - 使用新的feedbackType (4表示视频工作室访问申请)
      const submitData = {
        contactInfo: username || nickname, // 从登录用户信息自动获取联系方式
        contributionDescription: '申请访问MCP-X Video Studio视频工作台功能',
        detailedDescription: `申请理由：${formData.reason}\n使用经验：${formData.experience || '未填写'}\n用户申请访问MCP-X Video Studio视频工作台，希望体验AI视频生成功能。`,
        feedbackType: 4, // 新类型：视频工作室访问申请
        githubForkUrl: undefined,
        issueType: 'video_studio_access',
        releaseUrl: undefined
      };

      const result = await api.feedback.submitFeedback(submitData);

      if (result.code === 200) {
        alert('申请提交成功！我们会在1-3个工作日内审核您的申请，请耐心等待。');
        navigate('/'); // 提交成功后跳转到创作者中心
      } else {
        const errorMsg = result.msg || result.message || '提交申请失败，请稍后重试';
        alert(errorMsg);
      }
    } catch (error: any) {
      console.error('提交申请失败:', error);

      let errorMessage = '网络错误，请稍后重试';

      if (error && typeof error === 'object') {
        if (error.response && error.response.data) {
          const responseData = error.response.data;
          if (responseData.msg) {
            errorMessage = responseData.msg;
          } else if (responseData.message) {
            errorMessage = responseData.message;
          }
        } else if (error.msg) {
          errorMessage = error.msg;
        } else if (error.message) {
          errorMessage = error.message;
        }
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      alert(errorMessage);
    } finally {
      setIsSubmittingApplication(false);
    }
  };

  // 检查访问权限 - 如果还没检查完成，显示loading
  if (hasAccess === null) {
    return (
      <div className="h-screen bg-[#121212] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mb-4"></div>
          <p className="text-gray-400">检查访问权限...</p>
        </div>
      </div>
    );
  }

  // 如果没有访问权限，显示邀请制页面
  if (hasAccess === false) {
    return <InvitationOnlyOverlay onApply={handleApplyForAccess} isSubmitting={isSubmittingApplication} />;
  }

  // Dashboard View
  if (!project) {
    return <VideoGenDashboard onOpenProject={handleOpenProject} />;
  }

  // Render stage content
  const renderStage = () => {
    switch (project.stage) {
      case 'script':
        return <StageScript project={project} updateProject={updateProject} />;
      case 'assets':
        return <StageAssets project={project} updateProject={updateProject} />;
      case 'director':
        return <StageDirector project={project} updateProject={updateProject} savingProject={savingProject} />;
      case 'export':
        return <StageExport project={project} />;
      default:
        return <StageScript project={project} updateProject={updateProject} />;
    }
  };

  // Workspace View
  return (
    <div className="flex h-screen bg-[#121212] font-sans text-gray-100 selection:bg-indigo-500/30">
      <VideoGenSidebar
        currentStage={project.stage}
        setStage={setStage}
        onExit={handleExitProject}
        projectName={project.title}
        saveStatus={saveStatus}
        sessionId={project.sessionId}
        onLoadHistory={handleLoadHistory}
      />

      <main className="ml-72 flex-1 h-screen overflow-hidden relative">
        {/* Stage Content */}
        {renderStage()}
      </main>
    </div>
  );
};

export default VideoGenPage;
