import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';

// ── Auth / Onboarding ──────────────────────────────────────────
import Login           from './pages/Login';
import Register        from './pages/Register';
import GoogleAuthSuccess from './pages/GoogleAuthSuccess';
import QuickStart      from './pages/QuickStart';
import BusinessSetup   from './pages/BusinessSetup';

// ── Main pages ────────────────────────────────────────────────
import Dashboard       from './pages/Dashboard';
import ContentPlanner  from './pages/ContentPlanner';
import CreateContent   from './pages/CreateContent';
import AIIntelligence  from './pages/AIIntelligence';
import CreativeStudio  from './pages/CreativeStudio';
import Automation      from './pages/Automation';       // replaces Autopilot + Workflows
import Analytics       from './pages/Analytics';
import Audience        from './pages/Audience';
import Advertising     from './pages/Advertising';
import CreateCampaign  from './pages/CreateCampaign';
import CampaignDetail  from './pages/CampaignDetail';
import AdBudget        from './pages/AdBudget';
import Social          from './pages/Social';           // replaces SocialAccounts (now at /social)
import MediaLibrary    from './pages/MediaLibrary';
import Team            from './pages/Team';
import Approvals       from './pages/Approvals';

// ── Settings sub-pages ────────────────────────────────────────
import Settings        from './pages/Settings';
import SocialAccounts  from './pages/SocialAccounts';
import Billing         from './pages/Billing';
import Notifications   from './pages/Notifications';
import Security        from './pages/Security';
import Help            from './pages/Help';

// ── Admin ─────────────────────────────────────────────────────
import WorkflowBuilder    from './pages/WorkflowBuilder';
import AdminDashboard     from './pages/admin/AdminDashboard';
import AdminUsers         from './pages/admin/AdminUsers';
import AdminSubscriptions from './pages/admin/AdminSubscriptions';
import AdminAIUsage       from './pages/admin/AdminAIUsage';
import AdminAnalytics     from './pages/admin/AdminAnalytics';
import AdminModeration    from './pages/admin/AdminModeration';
import AdminSystem        from './pages/admin/AdminSystem';

// ── Layout ────────────────────────────────────────────────────
import MainLayout   from './components/Layout/MainLayout';
import PublicLayout from './components/Layout/PublicLayout';

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? children : <Navigate to="/login" />;
}

export default function App() {
  return (
    <Routes>
      {/* ── Public (with header navbar, no sidebar) ────────── */}
      <Route element={<PublicLayout />}>
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      {/* ── Google OAuth callback (no layout needed) ────────── */}
      <Route path="/auth/google/success" element={<GoogleAuthSuccess />} />

      {/* ── Onboarding (no sidebar) ─────────────────────────── */}
      <Route path="/quick-start" element={
        <ProtectedRoute><QuickStart /></ProtectedRoute>
      } />
      <Route path="/business-setup" element={
        <ProtectedRoute><BusinessSetup /></ProtectedRoute>
      } />

      {/* ── Main dashboard (with sidebar) ───────────────────── */}
      <Route path="/" element={
        <ProtectedRoute><MainLayout /></ProtectedRoute>
      }>
        {/* Dashboard */}
        <Route index                element={<Dashboard />} />

        {/* Content creation */}
        <Route path="planner"       element={<ContentPlanner />} />
        <Route path="create"        element={<CreateContent />} />

        {/* Creation tools */}
        <Route path="creative-studio" element={<CreativeStudio />} />

        {/* Advertising */}
        <Route path="advertising"              element={<Advertising />} />
        <Route path="advertising/create"       element={<CreateCampaign />} />
        <Route path="advertising/campaigns/:id" element={<CampaignDetail />} />
        <Route path="advertising/budget"       element={<AdBudget />} />

        {/* Intelligence */}
        <Route path="ai-intelligence" element={<AIIntelligence />} />

        {/* Social media */}
        <Route path="social" element={<Social />} />

        {/* Growth */}
        <Route path="analytics" element={<Analytics />} />
        <Route path="audience"  element={<Audience />} />

        {/* Operations */}
        <Route path="automation"              element={<Automation />} />
        <Route path="automation/builder"      element={<WorkflowBuilder />} />
        <Route path="media"        element={<MediaLibrary />} />
        <Route path="team"         element={<Team />} />
        <Route path="approvals"    element={<Approvals />} />

        {/* Settings */}
        <Route path="settings"                       element={<Settings />} />
        <Route path="settings/social-accounts"       element={<SocialAccounts />} />
        <Route path="settings/billing"               element={<Billing />} />
        <Route path="settings/notifications"         element={<Notifications />} />
        <Route path="settings/security"              element={<Security />} />
        <Route path="help"                           element={<Help />} />

        {/* Legacy redirects — keep old URLs working */}
        <Route path="calendar"   element={<Navigate to="/planner"    replace />} />
        <Route path="queue"      element={<Navigate to="/planner"    replace />} />
        <Route path="autopilot"  element={<Navigate to="/automation" replace />} />
        <Route path="workflows"  element={<Navigate to="/automation" replace />} />
        <Route path="campaigns"  element={<Navigate to="/advertising" replace />} />
      </Route>

      {/* ── Admin (separate layout) ─────────────────────────── */}
      <Route path="/admin" element={
        <ProtectedRoute><AdminDashboard /></ProtectedRoute>
      }>
        <Route path="users"         element={<AdminUsers />} />
        <Route path="subscriptions" element={<AdminSubscriptions />} />
        <Route path="ai-usage"      element={<AdminAIUsage />} />
        <Route path="analytics"     element={<AdminAnalytics />} />
        <Route path="moderation"    element={<AdminModeration />} />
        <Route path="system"        element={<AdminSystem />} />
      </Route>
    </Routes>
  );
}
