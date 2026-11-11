import { useQuery } from 'react-query';
import { Link, useLocation, Outlet } from 'react-router-dom';
import api from '../../lib/api';
import {
  LayoutDashboard, Users, CreditCard, Zap, BarChart3,
  Flag, Settings, Shield, ChevronRight, TrendingUp,
  Activity, DollarSign, Server
} from 'lucide-react';

const NAV_ITEMS = [
  { path: '/admin', label: 'Overview', icon: LayoutDashboard },
  { path: '/admin/users', label: 'Users', icon: Users },
  { path: '/admin/subscriptions', label: 'Subscriptions', icon: CreditCard },
  { path: '/admin/ai-usage', label: 'AI Usage', icon: Zap },
  { path: '/admin/analytics', label: 'Platform Analytics', icon: BarChart3 },
  { path: '/admin/moderation', label: 'Content Moderation', icon: Flag },
  { path: '/admin/system', label: 'System Config', icon: Settings }
];

export default function AdminDashboard() {
  const location = useLocation();

  const { data: overviewData } = useQuery('adminOverview', async () => {
    const { data } = await api.get('/admin/overview');
    return data;
  });

  const stats = overviewData?.stats || {};

  return (
    <div className="min-h-screen bg-dark-base flex">
      {/* ── Admin Sidebar ─────────────── */}
      <div className="w-64 bg-dark-secondary border-r border-dark-border flex flex-col flex-shrink-0">
        <div className="px-5 py-5 border-b border-dark-border">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl flex items-center justify-center">
              <Shield size={18} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Super Admin</p>
              <p className="text-[10px] text-gray-500">SpyRex Control Panel</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                  ${isActive ? 'bg-red-500/10 text-red-400' : 'text-gray-400 hover:bg-dark-hover hover:text-white'}`}
              >
                <Icon size={17} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-dark-border">
          <Link to="/" className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs text-gray-500 hover:text-white hover:bg-dark-hover">
            <ChevronRight size={14} /> Back to App
          </Link>
        </div>
      </div>

      {/* ── Content ───────────────────── */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          {location.pathname === '/admin' ? (
            <AdminOverview stats={stats} />
          ) : (
            <Outlet />
          )}
        </div>
      </div>
    </div>
  );
}

function AdminOverview({ stats }) {
  const metricCards = [
    { label: 'Total Users', value: stats.total_users || 0, icon: Users, change: '+12%', color: 'from-blue-500 to-cyan-500' },
    { label: 'Active This Month', value: stats.active_users || 0, icon: Activity, change: '+8%', color: 'from-emerald-500 to-teal-500' },
    { label: 'Monthly Revenue', value: `$${stats.mrr || 0}`, icon: DollarSign, change: '+15%', color: 'from-violet-500 to-purple-600' },
    { label: 'AI Requests Today', value: stats.ai_requests_today || 0, icon: Zap, change: '+22%', color: 'from-amber-500 to-orange-500' },
    { label: 'Posts Published', value: stats.posts_published || 0, icon: TrendingUp, change: '+5%', color: 'from-pink-500 to-rose-500' },
    { label: 'System Health', value: '99.9%', icon: Server, change: 'Uptime', color: 'from-green-500 to-emerald-600' }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Platform Overview</h1>
        <p className="text-sm text-gray-500 mt-1">Real-time metrics and system status</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {metricCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className={`stat-card animate-fade-in-up stagger-${Math.min(i+1,4)}`}>
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 bg-gradient-to-br ${card.color} rounded-xl flex items-center justify-center`}>
                  <Icon size={18} className="text-white" />
                </div>
                <span className="text-xs text-emerald-400 font-semibold">{card.change}</span>
              </div>
              <p className="text-2xl font-black text-white">{card.value}</p>
              <p className="text-sm text-gray-500 mt-0.5">{card.label}</p>
            </div>
          );
        })}
      </div>

      {/* Plan distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card">
          <h3 className="font-bold text-white mb-4">Users by Plan</h3>
          <div className="space-y-3">
            {[
              { plan: 'Free', count: stats.free_users || 0, color: 'bg-gray-500', pct: 60 },
              { plan: 'Starter', count: stats.starter_users || 0, color: 'bg-blue-500', pct: 20 },
              { plan: 'Creator Pro', count: stats.pro_users || 0, color: 'bg-indigo-500', pct: 12 },
              { plan: 'Business', count: stats.business_users || 0, color: 'bg-violet-500', pct: 6 },
              { plan: 'Agency', count: stats.agency_users || 0, color: 'bg-amber-500', pct: 2 }
            ].map(item => (
              <div key={item.plan}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-300 font-medium">{item.plan}</span>
                  <span className="text-gray-500">{item.count} users ({item.pct}%)</span>
                </div>
                <div className="h-2 bg-dark-base rounded-full overflow-hidden">
                  <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 className="font-bold text-white mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {(stats.recent_activity || [
              { type: 'user_registered', user: 'john@example.com', time: '2 min ago' },
              { type: 'post_published', user: 'sarah@fashion.com', time: '5 min ago' },
              { type: 'plan_upgraded', user: 'team@agency.com', time: '12 min ago' },
              { type: 'campaign_created', user: 'mk@tech.com', time: '15 min ago' }
            ]).map((activity, i) => (
              <div key={i} className="flex items-center gap-3 py-2 border-b border-dark-border last:border-0">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  activity.type === 'user_registered' ? 'bg-blue-400' :
                  activity.type === 'post_published' ? 'bg-emerald-400' :
                  activity.type === 'plan_upgraded' ? 'bg-amber-400' : 'bg-violet-400'
                }`} />
                <div className="flex-1">
                  <p className="text-xs text-gray-300">{activity.user}</p>
                  <p className="text-[10px] text-gray-600 capitalize">{activity.type?.replace('_', ' ')}</p>
                </div>
                <p className="text-[10px] text-gray-600">{activity.time}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
