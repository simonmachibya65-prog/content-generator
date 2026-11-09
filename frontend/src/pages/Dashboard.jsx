import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { Users, Send, Target, Zap, ArrowRight, Eye, Heart, MessageCircle, Share2, Plus, TrendingUp } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import GaugeChart from '../components/GaugeChart';

const PLATFORM_ICONS = { tiktok:'🎵', youtube:'▶️', x:'𝕏', instagram:'📸', facebook:'📘', linkedin:'💼' };

export default function Dashboard() {
  const { user } = useAuthStore();

  const { data: stats } = useQuery('userStats', async () => {
    const { data } = await api.get('/users/stats');
    return data.stats;
  });

  const { data: analytics } = useQuery('analyticsOverview', async () => {
    const { data } = await api.get('/analytics/overview?days=30');
    return data.overview;
  });

  // Real 7-day trend data
  const { data: trendsData } = useQuery('dashboardTrends', async () => {
    const { data } = await api.get('/analytics/engagement-trends?days=7');
    return data.trends;
  });

  const { data: accountsData } = useQuery('socialAccounts', async () => {
    const { data } = await api.get('/social-accounts');
    return data;
  });

  const connectedAccounts = accountsData?.accounts || [];
  const credits = Math.max(0, (user?.ai_credits || 0) - (user?.ai_credits_used || 0));
  const creditPercent = user?.ai_credits ? Math.round((credits / user.ai_credits) * 100) : 0;

  // Format chart data — use real trends or a sensible empty state
  const chartData = (trendsData && trendsData.length > 0)
    ? trendsData.map(t => ({
        day: new Date(t.date).toLocaleDateString('en-US', { weekday: 'short' }),
        views: parseInt(t.views) || 0,
        likes: parseInt(t.likes) || 0,
      }))
    : [
        { day: 'Mon', views: 0, likes: 0 },
        { day: 'Tue', views: 0, likes: 0 },
        { day: 'Wed', views: 0, likes: 0 },
        { day: 'Thu', views: 0, likes: 0 },
        { day: 'Fri', views: 0, likes: 0 },
        { day: 'Sat', views: 0, likes: 0 },
        { day: 'Sun', views: 0, likes: 0 },
      ];

  const statCards = [
    { label: 'Connected', value: stats?.connected_accounts ?? 0, icon: Users, color: 'from-blue-500 to-cyan-500', iconBg: 'bg-blue-500/10', iconColor: 'text-blue-400', link: '/social' },
    { label: 'Published', value: stats?.published_posts ?? 0, icon: Send, color: 'from-violet-500 to-purple-600', iconBg: 'bg-violet-500/10', iconColor: 'text-violet-400', link: '/planner' },
    { label: 'Campaigns', value: stats?.active_campaigns ?? 0, icon: Target, color: 'from-amber-500 to-orange-500', iconBg: 'bg-amber-500/10', iconColor: 'text-amber-400', link: '/advertising' },
    { label: 'AI Credits', value: credits, icon: Zap, color: creditPercent > 20 ? 'from-emerald-500 to-teal-500' : 'from-red-500 to-rose-500', iconBg: creditPercent > 20 ? 'bg-emerald-500/10' : 'bg-red-500/10', iconColor: creditPercent > 20 ? 'text-emerald-400' : 'text-red-400', link: '/create' }
  ];

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Welcome Banner (no accounts) ── */}
      {connectedAccounts.length === 0 && (
        <div className="rounded-2xl bg-gradient-to-r from-accent-secondary via-violet-600 to-purple-600 p-6 text-white relative overflow-hidden">
          <div className="absolute right-0 top-0 w-64 h-full opacity-10">
            <div className="w-48 h-48 rounded-full bg-white absolute -top-12 -right-12" />
            <div className="w-32 h-32 rounded-full bg-white absolute bottom-4 right-16" />
          </div>
          <div className="relative">
            <p className="text-white/70 text-sm font-medium mb-1">👋 Welcome, {user?.full_name?.split(' ')[0]}!</p>
            <h2 className="text-2xl font-bold mb-2">Get started in 3 minutes</h2>
            <p className="text-white/80 text-sm mb-4 max-w-md">Connect your social accounts, set your niche, and let AI handle the rest — automatically.</p>
            <Link to="/quick-start" className="inline-flex items-center gap-2 bg-white text-accent-secondary font-semibold px-5 py-2.5 rounded-xl hover:bg-white/90 transition-colors text-sm">
              <Zap size={15} /> Start Quick Setup <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      )}

      {/* ── Stat cards ─────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s, i) => {
          const Icon = s.icon;
          return (
            <Link key={s.label} to={s.link} className={`stat-card animate-fade-in-up stagger-${i+1} group`}>
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 ${s.iconBg} rounded-xl flex items-center justify-center`}>
                  <Icon size={20} className={s.iconColor} />
                </div>
                <ArrowRight size={15} className="text-gray-600 group-hover:text-accent-primary group-hover:translate-x-0.5 transition-all" />
              </div>
              <p className="text-3xl font-black text-white mb-0.5">{s.value}</p>
              <p className="text-sm text-gray-500 font-medium">{s.label}</p>
            </Link>
          );
        })}
      </div>

      {/* ── Main Grid ──────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Chart */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-bold text-white flex items-center gap-2">
                <TrendingUp size={16} className="text-accent-primary" /> Performance
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">Last 7 days</p>
            </div>
            <select className="text-xs bg-dark-surface border border-dark-border rounded-lg px-3 py-1.5 text-gray-400 outline-none focus:border-accent-primary">
              <option>7 days</option>
              <option>30 days</option>
              <option>90 days</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="gv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#00d4aa" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#00d4aa" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: '1px solid #2d3748',
                  background: '#252b3f',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                  fontSize: 12,
                  color: '#fff'
                }}
                labelStyle={{ color: '#a0aec0', fontSize: 11 }}
                itemStyle={{ color: '#00d4aa' }}
              />
              <Area type="monotone" dataKey="views" stroke="#00d4aa" strokeWidth={2.5} fill="url(#gv)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>

          {/* Engagement row */}
          <div className="grid grid-cols-4 gap-3 mt-4 pt-4 border-t border-dark-border">
            {[
              { icon: Eye,           label: 'Views',    value: analytics?.total_views || 0,    color: 'text-blue-400' },
              { icon: Heart,         label: 'Likes',    value: analytics?.total_likes || 0,    color: 'text-red-400' },
              { icon: MessageCircle, label: 'Comments', value: analytics?.total_comments || 0, color: 'text-emerald-400' },
              { icon: Share2,        label: 'Shares',   value: analytics?.total_shares || 0,   color: 'text-purple-400' }
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="text-center">
                <Icon size={18} className={`${color} mx-auto mb-1`} />
                <p className="text-base font-bold text-white">{parseInt(value).toLocaleString()}</p>
                <p className="text-xs text-gray-500">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Gauges & Accounts Column */}
        <div className="space-y-5">
          {/* Key Metrics Gauges */}
          <div className="card">
            <h3 className="font-bold text-white flex items-center gap-2 mb-4">
              <Target size={16} className="text-accent-primary" /> Key Metrics
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-dark-surface rounded-xl p-3 border border-dark-border">
                <GaugeChart
                  value={analytics?.engagement_rate || 0}
                  max={10}
                  label="Engagement"
                  color="#00d4aa"
                  size={120}
                />
              </div>
              <div className="bg-dark-surface rounded-xl p-3 border border-dark-border">
                <GaugeChart
                  value={creditPercent}
                  max={100}
                  label="Credits"
                  color={creditPercent > 20 ? '#10b981' : '#ef4444'}
                  size={120}
                />
              </div>
            </div>
          </div>

          {/* Connected Accounts */}
          <div className="card flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white">Accounts</h3>
              <Link to="/settings/social-accounts" className="text-xs text-accent-primary font-semibold hover:underline flex items-center gap-1">
                Manage <ArrowRight size={12} />
              </Link>
            </div>

            {connectedAccounts.length > 0 ? (
              <div className="space-y-3 flex-1">
                {connectedAccounts.slice(0, 5).map((acc) => (
                  <div key={acc.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-dark-hover transition-colors">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg bg-dark-surface border border-dark-border">
                      {PLATFORM_ICONS[acc.platform_name] || '📱'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{acc.display_name || acc.username}</p>
                      <p className="text-xs text-gray-500 capitalize">{acc.platform_name}</p>
                    </div>
                    <div className={`w-2 h-2 rounded-full ${acc.status === 'connected' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center py-8 text-center">
                <div className="w-16 h-16 bg-dark-surface border border-dark-border rounded-2xl flex items-center justify-center text-3xl mb-3">📱</div>
                <p className="text-sm font-semibold text-white mb-1">No accounts yet</p>
                <p className="text-xs text-gray-500 mb-4">Connect TikTok, YouTube and more</p>
                <Link to="/settings/social-accounts" className="btn btn-primary btn-sm">
                  <Plus size={14} /> Connect
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Quick Actions ──────────────── */}
      <div>
        <h3 className="font-bold text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: '✍️', title: 'Create AI Post', desc: 'Generate content for all platforms', to: '/create', gradient: 'from-accent-secondary to-violet-600' },
            { icon: '🎯', title: 'New Campaign', desc: 'Automate posting forever', to: '/campaigns', gradient: 'from-amber-500 to-orange-500' },
            { icon: '📊', title: 'View Analytics', desc: 'Track your performance', to: '/analytics', gradient: 'from-emerald-500 to-teal-500' }
          ].map((a) => (
            <Link key={a.to} to={a.to} className="stat-card group flex items-center gap-4 p-5 hover:border-dark-border-light">
              <div className={`w-12 h-12 bg-gradient-to-br ${a.gradient} rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 group-hover:scale-110 transition-transform`}>
                {a.icon}
              </div>
              <div>
                <p className="font-semibold text-white">{a.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{a.desc}</p>
              </div>
              <ArrowRight size={16} className="ml-auto text-gray-600 group-hover:text-accent-primary group-hover:translate-x-1 transition-all" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
