
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { McpPage } from './pages/McpPage';
import { ServerDetailPage } from './pages/ServerDetailPage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { AddServerPage } from './pages/AddServerPage';
import { ChatPage } from './pages/ChatPage';
import { MobileChatPage } from './pages/MobileChatPage';
import { ToastProvider } from './components/ui/Toast';
import { LanguageProvider } from './contexts/LanguageContext';
import { AboutPage } from './pages/AboutPage';
import { CareersPage } from './pages/CareersPage';
import { ContactPage } from './pages/ContactPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { TermsPage } from './pages/TermsPage';
import { SettingsPage } from './pages/SettingsPage';
import { PricingPage } from './pages/PricingPage';
import { DownloadPage } from './pages/DownloadPage';
import { RewardsPage } from './pages/RewardsPage';
import { AgentPage } from './pages/AgentPage';
import { AgentDetailPage } from './pages/AgentDetailPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { GithubCallbackPage } from './pages/GithubCallbackPage';
import { AppBuildPage } from './pages/AppBuildPage';
import { NewAppPage } from './pages/NewAppPage';
import { MyAppsPage } from './pages/MyAppsPage';
import { ImageViewerPage } from './pages/ImageViewerPage';
import { WorkflowBuilderPage } from './pages/WorkflowBuilderPage';
import ImageEditorPage from './pages/ImageEditorPage';
import VideoGenPage from './pages/VideoGenPage';
import CreatorHubPage from './pages/CreatorHubPage';
import { DocsPage } from './pages/DocsPage';

function App() {
  return (
    <LanguageProvider>
      <ToastProvider>
        <Router>
          <Routes>
          <Route path="/" element={<CreatorHubPage />} />
          <Route path="/mcp" element={<McpPage />} />
          <Route path="/server/:id" element={<ServerDetailPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/auth/github/callback" element={<GithubCallbackPage />} />
          <Route path="/add-server" element={<AddServerPage />} />
          <Route path="/docs" element={<DocsPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/careers" element={<CareersPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/download" element={<DownloadPage />} />
          <Route path="/rewards" element={<RewardsPage />} />
          <Route path="/agent" element={<AgentPage />} />
          <Route path="/agent/:id" element={<AgentDetailPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/chat/:id" element={<ChatPage />} />
          <Route path="/mobile-chat" element={<MobileChatPage />} />
          <Route path="/mobile-chat/:id" element={<MobileChatPage />} />
          <Route path="/app/build/:id" element={<AppBuildPage />} />
          <Route path="/app/new" element={<NewAppPage />} />
          <Route path="/my-apps" element={<MyAppsPage />} />
          <Route path="/image-viewer" element={<ImageViewerPage />} />
          <Route path="/image-editor" element={<ImageEditorPage />} />
          <Route path="/workflow" element={<WorkflowBuilderPage />} />
          <Route path="/video-studio" element={<VideoGenPage />} />
          </Routes>
        </Router>
      </ToastProvider>
    </LanguageProvider>
  );
}

export default App;