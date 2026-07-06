
import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { ToastProvider } from './components/ui/Toast';
import { LanguageProvider } from './contexts/LanguageContext';
// 首页不走懒加载，避免刷新时出现长时间纯黑屏
import CreatorHubPage from './pages/CreatorHubPage';

const PageFallback = () => (
  <div className="min-h-screen bg-[#0a0a0a] text-white">
    <div className="h-14 border-b border-gray-800/60 bg-[#0a0a0a]/90" />
    <div className="px-4 pt-16 pb-10 max-w-5xl mx-auto space-y-8 animate-pulse">
      <div className="h-10 w-2/3 max-w-md mx-auto bg-gray-800 rounded-lg" />
      <div className="h-40 bg-[#1a1a1a] border border-gray-800 rounded-2xl" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-48 bg-[#1a1a1a] border border-gray-800 rounded-xl" />
        ))}
      </div>
    </div>
  </div>
);
const McpPage             = lazy(() => import('./pages/McpPage').then(m => ({ default: m.McpPage })));
const ServerDetailPage    = lazy(() => import('./pages/ServerDetailPage').then(m => ({ default: m.ServerDetailPage })));
const LoginPage           = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));
const SignupPage          = lazy(() => import('./pages/SignupPage').then(m => ({ default: m.SignupPage })));
const ForgotPasswordPage  = lazy(() => import('./pages/ForgotPasswordPage').then(m => ({ default: m.ForgotPasswordPage })));
const GithubCallbackPage  = lazy(() => import('./pages/GithubCallbackPage').then(m => ({ default: m.GithubCallbackPage })));
const AddServerPage       = lazy(() => import('./pages/AddServerPage').then(m => ({ default: m.AddServerPage })));
const DocsPage            = lazy(() => import('./pages/DocsPage').then(m => ({ default: m.DocsPage })));
const AboutPage           = lazy(() => import('./pages/AboutPage').then(m => ({ default: m.AboutPage })));
const CareersPage         = lazy(() => import('./pages/CareersPage').then(m => ({ default: m.CareersPage })));
const ContactPage         = lazy(() => import('./pages/ContactPage').then(m => ({ default: m.ContactPage })));
const PrivacyPage         = lazy(() => import('./pages/PrivacyPage').then(m => ({ default: m.PrivacyPage })));
const TermsPage           = lazy(() => import('./pages/TermsPage').then(m => ({ default: m.TermsPage })));
const SettingsPage        = lazy(() => import('./pages/SettingsPage').then(m => ({ default: m.SettingsPage })));
const PricingPage         = lazy(() => import('./pages/PricingPage').then(m => ({ default: m.PricingPage })));
const DownloadPage        = lazy(() => import('./pages/DownloadPage').then(m => ({ default: m.DownloadPage })));
const RewardsPage         = lazy(() => import('./pages/RewardsPage').then(m => ({ default: m.RewardsPage })));
const AgentPage           = lazy(() => import('./pages/AgentPage').then(m => ({ default: m.AgentPage })));
const AgentDetailPage     = lazy(() => import('./pages/AgentDetailPage').then(m => ({ default: m.AgentDetailPage })));
const ChatPage            = lazy(() => import('./pages/ChatPage').then(m => ({ default: m.ChatPage })));
const MobileChatPage      = lazy(() => import('./pages/MobileChatPage').then(m => ({ default: m.MobileChatPage })));
const AppBuildPage        = lazy(() => import('./pages/AppBuildPage').then(m => ({ default: m.AppBuildPage })));
const NewAppPage          = lazy(() => import('./pages/NewAppPage').then(m => ({ default: m.NewAppPage })));
const MyAppsPage          = lazy(() => import('./pages/MyAppsPage').then(m => ({ default: m.MyAppsPage })));
const ImageViewerPage     = lazy(() => import('./pages/ImageViewerPage').then(m => ({ default: m.ImageViewerPage })));
const WorkflowBuilderPage = lazy(() => import('./pages/WorkflowBuilderPage').then(m => ({ default: m.WorkflowBuilderPage })));
const ImageEditorPage     = lazy(() => import('./pages/ImageEditorPage'));
const VideoGenPage        = lazy(() => import('./pages/VideoGenPage'));
const SkillPage           = lazy(() => import('./pages/SkillPage'));
const SkillDetailPage     = lazy(() => import('./pages/SkillDetailPage'));

function App() {
  return (
    <LanguageProvider>
      <ToastProvider>
        <Router>
          <Suspense fallback={<PageFallback />}>
            <Routes>
              <Route path="/"                        element={<CreatorHubPage />} />
              <Route path="/mcp"                     element={<McpPage />} />
              <Route path="/server/:id"              element={<ServerDetailPage />} />
              <Route path="/login"                   element={<LoginPage />} />
              <Route path="/signup"                  element={<SignupPage />} />
              <Route path="/forgot-password"         element={<ForgotPasswordPage />} />
              <Route path="/auth/github/callback"    element={<GithubCallbackPage />} />
              <Route path="/add-server"              element={<AddServerPage />} />
              <Route path="/docs"                    element={<DocsPage />} />
              <Route path="/about"                   element={<AboutPage />} />
              <Route path="/careers"                 element={<CareersPage />} />
              <Route path="/contact"                 element={<ContactPage />} />
              <Route path="/privacy"                 element={<PrivacyPage />} />
              <Route path="/terms"                   element={<TermsPage />} />
              <Route path="/settings"               element={<SettingsPage />} />
              <Route path="/pricing"                 element={<PricingPage />} />
              <Route path="/download"                element={<DownloadPage />} />
              <Route path="/rewards"                 element={<RewardsPage />} />
              <Route path="/agent"                   element={<AgentPage />} />
              <Route path="/agent/:id"               element={<AgentDetailPage />} />
              <Route path="/chat"                    element={<ChatPage />} />
              <Route path="/chat/:id"                element={<ChatPage />} />
              <Route path="/mobile-chat"             element={<MobileChatPage />} />
              <Route path="/mobile-chat/:id"         element={<MobileChatPage />} />
              <Route path="/app/build/:id"           element={<AppBuildPage />} />
              <Route path="/app/new"                 element={<NewAppPage />} />
              <Route path="/my-apps"                 element={<MyAppsPage />} />
              <Route path="/image-viewer"            element={<ImageViewerPage />} />
              <Route path="/image-editor"            element={<ImageEditorPage />} />
              <Route path="/workflow"                element={<WorkflowBuilderPage />} />
              <Route path="/video-studio"            element={<VideoGenPage />} />
              <Route path="/skill"                   element={<SkillPage />} />
              <Route path="/skill/:id"               element={<SkillDetailPage />} />
            </Routes>
          </Suspense>
        </Router>
      </ToastProvider>
    </LanguageProvider>
  );
}

export default App;