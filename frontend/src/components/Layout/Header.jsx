import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bell, Search, ChevronDown, LogOut, Settings, User, Zap, Moon, Sun, Menu } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { useQuery } from 'react-query';
import api from '../../lib/api';

const PAGE_TITLES = {
  '/':                       { title: 'Dashboard',        subtitle: 'Overview of your social media' },
  '/calendar':               { title: 'Content Calendar', subtitle: 'Plan and schedule your posts' },
  '/create':                 { title: 'Create Content',   subtitle: 'Generate AI-powered content' },
  '/ai-intelligence':        { title: 'AI Intelligence',  subtitle: 'Your AI-powered marketing brain' },
  '/creative-studio':        { title: 'Creative Studio',  subtitle: 'AI images, videos, scripts & more' },
  '/autopilot':              { title: 'AI Autopilot',     subtitle: 'Fully autonomous social media management' },
  '/workflows':              { title: 'Workflows',        subtitle: 'Automate actions based on triggers' },
  '/queue':                  { title: 'Publishing Queue', subtitle: 'Manage scheduled & published posts' },
  '/analytics':              { title: 'Analytics',        subtitle: 'Track your growth and engagement' },
  '/campaigns':              { title: 'Campaigns',        subtitle: 'Automate your content strategy' },
  '/media':                  { title: 'Media Library',    subtitle: 'Manage your images and videos' },
  '/team':                   { title: 'Team',             subtitle: 'Manage team members and roles' },
  '/settings':               { title: 'Settings',         subtitle: 'Manage your account settings' },
  '/settings/billing':       { title: 'Billing',          subtitle: 'Plans, payments and invoices' },
  '/settings/notifications': { title: 'Notifications',    subtitle: 'Manage your notification preferences' },
  '/settings/security':      { title: 'Security',         subtitle: 'Password, 2FA and sessions' }
};

export default function Header({ onToggleSidebar }) {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const [showMenu, setShowMenu] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const menuRef = useRef();
  const location = useLocation();

  const { data: notifsData } = useQuery('notifications', async () => {
    const { data } = await api.get('/notifications?unread_only=true&limit=5');
    return data;
  }, { refetchInterval: 60000 });

  const unreadCount = notifsData?.notifications?.length || 0;
  const page = PAGE_TITLES[location.pathname] || { title: 'Cotents', subtitle: '' };

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
        setShowNotifs(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <header className="glass-dark px-6 py-3 flex items-center gap-4 sticky top-0 z-40 border-b border-dark-border">
      {/* Sidebar toggle for mobile */}
      <button
        onClick={onToggleSidebar}
        className="lg:hidden p-2.5 text-gray-400 hover:bg-dark-hover rounded-xl transition-colors"
        aria-label="Toggle sidebar"
      >
        <Menu size={20} />
      </button>

      {/* Page title */}
      <div className="flex-1">
        <h1 className="text-lg font-bold text-white leading-tight">{page.title}</h1>
        <p className="text-xs text-gray-500">{page.subtitle}</p>
      </div>

      {/* Search */}
      <div className="hidden md:flex items-center gap-2 bg-dark-surface rounded-xl px-3 py-2.5 w-60 border border-dark-border">
        <Search size={15} className="text-gray-500 flex-shrink-0" />
        <input
          type="text"
          placeholder="Search posts, campaigns..."
          className="bg-transparent text-sm outline-none text-gray-200 placeholder-gray-600 w-full"
        />
        <kbd className="text-[10px] text-gray-500 bg-dark-base px-1.5 py-0.5 rounded font-mono border border-dark-border">⌘K</kbd>
      </div>

      {/* Dark Mode Toggle */}
      <button
        onClick={toggleTheme}
        className="p-2.5 text-gray-400 hover:bg-dark-hover rounded-xl transition-colors"
        aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      >
        {theme === 'light' ? <Moon size={19} /> : <Sun size={19} />}
      </button>

      {/* Notifications */}
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => { setShowNotifs(!showNotifs); setShowMenu(false); }}
          className="relative p-2.5 text-gray-400 hover:bg-dark-hover rounded-xl transition-colors"
          aria-label="Notifications"
        >
          <Bell size={19} />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-accent-primary rounded-full text-[9px] font-bold text-dark-base flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {showNotifs && (
          <div className="absolute right-0 top-full mt-2 w-80 bg-dark-card rounded-2xl shadow-card-lg border border-dark-border overflow-hidden z-50 animate-slide-down">
            <div className="px-4 py-3 border-b border-dark-border flex items-center justify-between">
              <h3 className="font-semibold text-white text-sm">Notifications</h3>
              {unreadCount > 0 && (
                <button className="text-xs text-accent-primary hover:underline">Mark all read</button>
              )}
            </div>
            <div className="max-h-72 overflow-y-auto">
              {notifsData?.notifications?.length > 0 ? (
                notifsData.notifications.map((n) => (
                  <div key={n.id} className="px-4 py-3 hover:bg-dark-hover border-b border-dark-border last:border-0">
                    <p className="text-sm font-medium text-white">{n.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                  </div>
                ))
              ) : (
                <div className="px-4 py-8 text-center text-gray-600 text-sm">
                  <Bell size={24} className="mx-auto mb-2 opacity-30" />
                  All caught up!
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* User menu */}
      <div className="relative">
        <button
          onClick={() => { setShowMenu(!showMenu); setShowNotifs(false); }}
          className="flex items-center gap-2.5 p-1.5 hover:bg-dark-hover rounded-xl transition-colors"
          aria-label="User menu"
        >
          <div className="relative">
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.full_name}
                className="w-8 h-8 rounded-xl object-cover"
              />
            ) : (
              <div className="w-8 h-8 bg-gradient-to-br from-accent-primary to-emerald-500 rounded-xl flex items-center justify-center text-dark-base text-sm font-bold">
                {user?.full_name?.[0]?.toUpperCase() || '?'}
              </div>
            )}
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-dark-base" />
          </div>
          <div className="hidden md:block text-left">
            <p className="text-sm font-semibold text-white leading-tight">
              {user?.full_name?.split(' ')[0] || 'User'}
            </p>
            <p className="text-[11px] text-gray-500 capitalize">{user?.plan || 'free'}</p>
          </div>
          <ChevronDown size={15} className="text-gray-500 hidden md:block" />
        </button>

        {showMenu && (
          <div className="absolute right-0 top-full mt-2 w-52 bg-dark-card rounded-2xl shadow-card-lg border border-dark-border overflow-hidden z-50 animate-slide-down">
            <div className="px-4 py-3 border-b border-dark-border">
              <p className="font-semibold text-sm text-white">{user?.full_name}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
            <div className="py-1.5">
              <Link to="/settings" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-300 hover:bg-dark-hover">
                <Settings size={15} className="text-gray-500" /> Settings
              </Link>
              <Link to="/settings/social-accounts" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-300 hover:bg-dark-hover">
                <User size={15} className="text-gray-500" /> Social Accounts
              </Link>
              <Link to="/settings/billing" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-accent-primary hover:bg-accent-primary/10">
                <Zap size={15} className="text-accent-primary" /> Upgrade Plan
              </Link>
              <div className="border-t border-dark-border mt-1 pt-1">
                <button
                  onClick={logout}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 w-full"
                >
                  <LogOut size={15} /> Sign out
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
