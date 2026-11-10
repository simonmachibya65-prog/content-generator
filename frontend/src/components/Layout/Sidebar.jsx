import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Calendar, Sparkles, BarChart3,
  Image, Users, Settings, HelpCircle, Zap, ChevronRight,
  ChevronLeft, Megaphone, Bot, Share2, Workflow,
  BookUser, Library, CheckSquare, Inbox,
} from 'lucide-react';
import clsx from 'clsx';
import { useAuthStore } from '../../store/authStore';

const NAV_SECTIONS = [
  {
    label: 'Main',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard',       path: '/dashboard' },
      { icon: Calendar,        label: 'Content Planner', path: '/dashboard/planner' },
    ]
  },
  {
    label: 'Create',
    items: [
      { icon: Sparkles,  label: 'Creative Studio', path: '/dashboard/creative-studio' },
      { icon: Megaphone, label: 'Advertising',     path: '/dashboard/advertising' },
    ]
  },
  {
    label: 'Engage',
    items: [
      { icon: Bot, label: 'AI Intelligence', path: '/dashboard/ai-intelligence' },
      { icon: Inbox, label: 'Community',      path: '/dashboard/social' },
    ]
  },
  {
    label: 'Growth',
    items: [
      { icon: BarChart3, label: 'Analytics', path: '/dashboard/analytics' },
      { icon: BookUser,  label: 'Audience',  path: '/dashboard/audience', badge: 'New' },
    ]
  },
  {
    label: 'Operations',
    items: [
      { icon: Workflow,     label: 'Automation',    path: '/dashboard/automation' },
      { icon: Library,      label: 'Media Library', path: '/dashboard/media' },
      { icon: Users,        label: 'Team',          path: '/dashboard/team' },
      { icon: CheckSquare,  label: 'Approvals',     path: '/dashboard/approvals' },
    ]
  },
];

const PLAN_COLORS = {
  free:        { bg: 'bg-stone-100',   text: 'text-stone-600' },
  starter:     { bg: 'bg-green-100',   text: 'text-green-700' },
  creator_pro: { bg: 'bg-indigo-100',  text: 'text-indigo-700' },
  business:    { bg: 'bg-violet-100',  text: 'text-violet-700' },
  agency:      { bg: 'bg-amber-100',   text: 'text-amber-700' }
};

export default function Sidebar({ collapsed, onToggle }) {
  const location = useLocation();
  const { user } = useAuthStore();
  const planStyle = PLAN_COLORS[user?.plan] || PLAN_COLORS.free;

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <div
      className={clsx(
        'h-screen bg-white flex flex-col border-r border-stone-200 flex-shrink-0 transition-all duration-300 relative',
        collapsed ? 'w-[72px]' : 'w-[248px]'
      )}
    >
      {/* ── Collapse Toggle ─────────────── */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-20 z-50 w-6 h-6 rounded-full bg-white border border-stone-200 flex items-center justify-center hover:bg-stone-50 transition-colors shadow-sm"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed
          ? <ChevronRight size={14} className="text-stone-400" />
          : <ChevronLeft  size={14} className="text-stone-400" />}
      </button>

      {/* ── Logo ──────────────────────────── */}
      <div className="px-5 py-5 border-b border-stone-200">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform flex-shrink-0">
            <Zap size={18} className="text-white" />
          </div>
          {!collapsed && (
            <div>
              <span className="text-lg font-bold text-stone-900 tracking-tight">Publift</span>
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
              <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-stone-400">
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
                        active ? 'text-green-600' : 'text-stone-400 group-hover:text-stone-700'
                      )}
                    />
                    {!collapsed && <span className="flex-1 text-sm">{label}</span>}
                    {!collapsed && badge && !active && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-100 text-green-700 font-semibold">
                        {badge}
                      </span>
                    )}
                    {!collapsed && active && (
                      <ChevronRight size={14} className="text-green-600/50" />
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
        <div className="mx-3 mb-3 p-3 rounded-xl bg-stone-50 border border-stone-200">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold text-stone-500">AI Credits</span>
            <span className="text-xs font-bold text-stone-900">
              {Math.max(0, (user.ai_credits || 0) - (user.ai_credits_used || 0))}
              <span className="text-stone-400">/{user.ai_credits || 0}</span>
            </span>
          </div>
          <div className="h-1.5 bg-stone-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all"
              style={{
                width: `${user.ai_credits
                  ? Math.min(100, ((user.ai_credits - user.ai_credits_used) / user.ai_credits) * 100)
                  : 0}%`
              }}
            />
          </div>
          {user.plan === 'free' && (
            <Link
              to="/dashboard/settings/billing"
              className="mt-2 text-[11px] text-green-600 hover:text-green-700 font-medium flex items-center gap-1"
            >
              <Zap size={10} /> Upgrade for more
            </Link>
          )}
        </div>
      )}

      {/* ── Bottom Links ──────────────────── */}
      <div className="px-3 pb-4 border-t border-stone-200 pt-3 space-y-0.5">
        {[
          { icon: Settings,   label: 'Settings',     path: '/dashboard/settings' },
          { icon: HelpCircle, label: 'Help & Support', path: '/dashboard/help' },
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
