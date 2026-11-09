import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Calendar, Sparkles, BarChart3,
  Image, Users, Settings, HelpCircle, Zap, ChevronRight,
  ChevronLeft, Megaphone, Bot, Share2, Workflow,
  BookUser, Library, CheckSquare
} from 'lucide-react';
import clsx from 'clsx';
import { useAuthStore } from '../../store/authStore';

const NAV_SECTIONS = [
  {
    label: 'Main',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard',       path: '/' },
      { icon: Calendar,        label: 'Content Planner', path: '/planner' },
    ]
  },
  {
    label: 'Creation',
    items: [
      { icon: Sparkles,  label: 'Creative Studio', path: '/creative-studio' },
      { icon: Megaphone, label: 'Advertising',     path: '/advertising' },
    ]
  },
  {
    label: 'Intelligence',
    items: [
      { icon: Bot, label: 'AI Intelligence', path: '/ai-intelligence' },
    ]
  },
  {
    label: 'Publishing',
    items: [
      { icon: Share2, label: 'Social Accounts', path: '/social' },
    ]
  },
  {
    label: 'Growth',
    items: [
      { icon: BarChart3, label: 'Analytics', path: '/analytics' },
      { icon: BookUser,  label: 'Audience',  path: '/audience', badge: 'New' },
    ]
  },
  {
    label: 'Operations',
    items: [
      { icon: Workflow,     label: 'Automation',    path: '/automation' },
      { icon: Library,      label: 'Media Library', path: '/media' },
      { icon: Users,        label: 'Team',          path: '/team' },
      { icon: CheckSquare,  label: 'Approvals',     path: '/approvals' },
    ]
  },
];

const PLAN_COLORS = {
  free:        { bg: 'bg-gray-700',   text: 'text-gray-300' },
  starter:     { bg: 'bg-blue-600',   text: 'text-blue-100' },
  creator_pro: { bg: 'bg-indigo-600', text: 'text-indigo-100' },
  business:    { bg: 'bg-violet-600', text: 'text-violet-100' },
  agency:      { bg: 'bg-amber-500',  text: 'text-amber-100' }
};

export default function Sidebar({ collapsed, onToggle }) {
  const location = useLocation();
  const { user } = useAuthStore();
  const planStyle = PLAN_COLORS[user?.plan] || PLAN_COLORS.free;

  // A path is active if it matches exactly, or if the current path starts with it
  // (but "/" only matches exactly to avoid matching everything)
  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <div
      className={clsx(
        'h-screen sidebar-bg flex flex-col border-r border-dark-border flex-shrink-0 transition-all duration-300 relative',
        collapsed ? 'w-[72px]' : 'w-[248px]'
      )}
    >
      {/* ── Collapse Toggle ─────────────── */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-20 z-50 w-6 h-6 rounded-full bg-dark-elevated border border-dark-border flex items-center justify-center hover:bg-dark-hover transition-colors"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed
          ? <ChevronRight size={14} className="text-gray-400" />
          : <ChevronLeft  size={14} className="text-gray-400" />}
      </button>

      {/* ── Logo ──────────────────────────── */}
      <div className="px-5 py-5 border-b border-dark-border">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 bg-gradient-to-br from-accent-primary to-emerald-500 rounded-xl flex items-center justify-center shadow-glow-teal-sm group-hover:scale-105 transition-transform flex-shrink-0">
            <Zap size={18} className="text-dark-base" />
          </div>
          {!collapsed && (
            <div>
          <span className="text-lg font-bold text-white tracking-tight">Publift</span>
              <div className="flex items-center gap-1.5">
                <span className={clsx('text-[10px] px-1.5 py-0.5 rounded font-semibold uppercase tracking-wide', planStyle.bg, planStyle.text)}>
                  {user?.plan || 'free'}
                </span>
              </div>
            </div>
          )}
        </Link>
      </div>

      {/* ── Navigation ────────────────────── */}
      <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto overflow-x-hidden">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            {!collapsed && (
              <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-gray-600">
                {section.label}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map(({ icon: Icon, label, path, badge }) => {
                const active = isActive(path);
                return (
                  <Link
                    key={path}
                    to={path}
                    title={collapsed ? label : ''}
                    className={clsx(
                      'nav-item group',
                      active ? 'nav-item-active' : 'nav-item-inactive'
                    )}
                  >
                    <Icon
                      size={18}
                      className={clsx(
                        'flex-shrink-0',
                        active ? 'text-accent-primary' : 'text-gray-500 group-hover:text-white'
                      )}
                    />
                    {!collapsed && <span className="flex-1 text-sm">{label}</span>}
                    {!collapsed && badge && !active && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent-primary/20 text-accent-primary font-semibold">
                        {badge}
                      </span>
                    )}
                    {!collapsed && active && (
                      <ChevronRight size={14} className="text-accent-primary/50" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* ── AI Credits Progress ────────────── */}
      {user && !collapsed && (
        <div className="mx-3 mb-3 p-3 rounded-xl bg-dark-surface border border-dark-border">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold text-gray-400">AI Credits</span>
            <span className="text-xs font-bold text-white">
              {Math.max(0, (user.ai_credits || 0) - (user.ai_credits_used || 0))}
              <span className="text-gray-600">/{user.ai_credits || 0}</span>
            </span>
          </div>
          <div className="h-1.5 bg-dark-base rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-accent-primary to-emerald-500 rounded-full transition-all"
              style={{
                width: `${user.ai_credits
                  ? Math.min(100, ((user.ai_credits - user.ai_credits_used) / user.ai_credits) * 100)
                  : 0}%`
              }}
            />
          </div>
          {user.plan === 'free' && (
            <Link
              to="/settings/billing"
              className="mt-2 text-[11px] text-accent-primary hover:text-accent-primary-hover font-medium flex items-center gap-1"
            >
              <Zap size={10} /> Upgrade for more
            </Link>
          )}
        </div>
      )}

      {/* ── Bottom Links ──────────────────── */}
      <div className="px-3 pb-4 border-t border-dark-border pt-3 space-y-0.5">
        {[
          { icon: Settings,   label: 'Settings',     path: '/settings' },
          { icon: HelpCircle, label: 'Help & Support', path: '/help' },
        ].map(({ icon: Icon, label, path }) => {
          const active = isActive(path);
          return (
            <Link
              key={path}
              to={path}
              title={collapsed ? label : ''}
              className={clsx('nav-item', active ? 'nav-item-active' : 'nav-item-inactive')}
            >
              <Icon size={17} className="flex-shrink-0" />
              {!collapsed && <span className="text-sm">{label}</span>}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
