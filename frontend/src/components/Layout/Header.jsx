import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bell, Search, ChevronDown, LogOut, Settings, User, Zap, Moon, Sun, Menu, Plus } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { useQuery } from 'react-query';
import api from '../../lib/api';
import { useNavigate } from 'react-router-dom';

const PAGE_TITLES = {
  '/':                       { title: 'Dashboard',        subtitle: 'Overview of your social media' },
  '/calendar':               { title: 'Content Calendar', subtitle: 'Plan and schedule your posts' },
  '/planner':                { title: 'Content Planner',  subtitle: 'Plan and schedule your posts' },
  '/create':                 { title: 'Create Content',   subtitle: 'Generate AI-powered content' },
  '/ai-intelligence':        { title: 'AI Intelligence',  subtitle: 'Your AI-powered marketing brain' },
  '/creative-studio':        { title: 'Creative Studio',  subtitle: 'AI images, videos, scripts & more' },
  '/automation':              { title: 'Automation',      subtitle: 'Automate actions based on triggers' },
  '/analytics':              { title: 'Analytics',        subtitle: 'Track your growth and engagement' },
  '/advertising':            { title: 'Advertising',      subtitle: 'Manage your ad campaigns' },
  '/media':                  { title: 'Media Library',    subtitle: 'Manage your images and videos' },
  '/team':                   { title: 'Team',            subtitle: 'Manage team members and roles' },
  '/settings':               { title: 'Settings',        subtitle: 'Manage your account settings' },
  '/settings/billing':       { title: 'Billing',         subtitle: 'Plans, payments and invoices' },
  '/settings/notifications': { title: 'Notifications',   subtitle: 'Manage your notification preferences' },
  '/settings/security':      { title: 'Security',        subtitle: 'Password, 2FA and sessions' },
  '/social':                 { title: 'Social Accounts',  subtitle: 'Connect and manage your channels' },
  '/audience':               { title: 'Audience',         subtitle: 'Understand your followers' },
  '/approvals':              { title: 'Approvals',       subtitle: 'Review and approve content' },
};

export default function Header({ onToggleSidebar }) {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const [showMenu, setShowMenu] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const menuRef = useRef();
  const location = useLocation();
  const navigate = useNavigate();

  const { data: notifsData } = useQuery('notifications', async () => {
    const { data } = await api.get('/notifications?unread_only=true&limit=5');
    return data;
  }, { refetchInterval: 60000 });

  const unreadCount = notifsData?.notifications?.length || 0;
  const page = PAGE_TITLES[location.pathname] || { title: 'Publift', subtitle: '' };

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
    <header className="bg-white px-6 py-3 flex items-center gap-4 sticky top-0 z-40 border-b border-stone-200">
      {/* Sidebar toggle for mobile */}
      <button
        onClick={onToggleSidebar}
        className="lg:hidden p-2.5 text-stone-500 hover:bg-stone-100 rounded-xl transition-colors"
        aria-label="Toggle sidebar"
      >
        <Menu size={20} />
      </button>

      {/* Page title */}
      <div className="flex-1">
        <h1 className="text-lg font-bold text-stone-900 leading-tight">{page.title}</h1>
        <p className="text-xs text-stone-400">{page.subtitle}</p>
      </div>

      {/* Create button — Buffer style blue + New */}
      <button
        onClick={() => navigate('/create')}
        className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 bg-green-600 text-white rounded-lg font-medium text-sm hover:bg-green-700 transition-colors"
      >
        <Plus size={16} />
        New Post
      </button>

      {/* Search */}
      <div className="hidden md:flex items-center gap-2 bg-stone-100 rounded-lg px-3 py-2 w-56 border border-stone-200">
        <Search size={15} className="text-stone-400 flex-shrink-0" />
        <input
          type="text"
          placeholder="Search..."
          className="bg-transparent text-sm outline-none text-stone-700 placeholder-stone-400 w-full"
        />
      </div>

      {/* Dark Mode Toggle */}
      <button
        onClick={toggleTheme}
        className="p-2.5 text-stone-400 hover:bg-stone-100 rounded-xl transition-colors"
        aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      >
        {theme === 'light' ? <Moon size={19} /> : <Sun size={19} />}
      </button>

      {/* Notifications */}
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => { setShowNotifs(!showNotifs); setShowMenu(false); }}
          className="relative p-2.5 text-stone-400 hover:bg-stone-100 rounded-xl transition-colors"
          aria-label="Notifications"
        >
          <Bell size={19} />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-green-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {showNotifs && (
          <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-lg border border-stone-200 overflow-hidden z-50 animate-slide-down">
            <div className="px-4 py-3 border-b border-stone-200 flex items-center justify-between">
              <h3 className="font-semibold text-stone-900 text-sm">Notifications</h3>
              {unreadCount > 0 && (
                <button className="text-xs text-green-600 hover:underline">Mark all read</button>
              )}
            </div>
            <div className="max-h-72 overflow-y-auto">
              {notifsData?.notifications?.length > 0 ? (
                notifsData.notifications.map((n) => (
                  <div key={n.id} className="px-4 py-3 hover:bg-stone-50 border-b border-stone-100 last:border-0">
                    <p className="text-sm font-medium text-stone-900">{n.title}</p>
                    <p className="text-xs text-stone-500 mt-0.5">{n.message}</p>
                  </div>
                ))
              ) : (
                <div className="px-4 py-8 text-center text-stone-400 text-sm">
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
          className="flex items-center gap-2.5 p-1.5 hover:bg-stone-100 rounded-xl transition-colors"
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
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center text-white text-sm font-bold">
                {user?.full_name?.[0]?.toUpperCase() || '?'}
              </div>
            )}
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-white" />
          </div>
          <div className="hidden md:block text-left">
            <p className="text-sm font-semibold text-stone-900 leading-tight">
              {user?.full_name?.split(' ')[0] || 'User'}
            </p>
            <p className="text-[11px] text-stone-400 capitalize">{user?.plan || 'free'}</p>
          </div>
          <ChevronDown size={15} className="text-stone-400 hidden md:block" />
        </button>

        {showMenu && (
          <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-lg border border-stone-200 overflow-hidden z-50 animate-slide-down">
            <div className="px-4 py-3 border-b border-stone-200">
              <p className="font-semibold text-sm text-stone-900">{user?.full_name}</p>
              <p className="text-xs text-stone-400 truncate">{user?.email}</p>
            </div>
            <div className="py-1.5">
              <Link to="/settings" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50">
                <Settings size={15} className="text-stone-400" /> Settings
              </Link>
              <Link to="/settings/social-accounts" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50">
                <User size={15} className="text-stone-400" /> Social Accounts
              </Link>
              <Link to="/settings/billing" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-green-600 hover:bg-green-50">
                <Zap size={15} className="text-green-500" /> Upgrade Plan
              </Link>
              <div className="border-t border-stone-200 mt-1 pt-1">
                <button
                  onClick={async () => {
                    setShowMenu(false);
                    await logout();
                    navigate('/home');
                  }}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 w-full"
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
