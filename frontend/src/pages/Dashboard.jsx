import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { Users, Send, Target, Zap, ArrowRight, Eye, Heart, MessageCircle, Share2, Plus, TrendingUp, Calendar, Inbox } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import GaugeChart from '../components/GaugeChart';
import { FaTiktok, FaYoutube, FaXTwitter, FaInstagram, FaFacebookF, FaLinkedinIn } from 'react-icons/fa6';

const PLATFORM_ICONS = {
  tiktok:    { Icon: FaTiktok,     color: '#000000' },
  youtube:   { Icon: FaYoutube,    color: '#FF0000' },
  x:         { Icon: FaXTwitter,   color: '#000000' },
  instagram: { Icon: FaInstagram,  color: '#E4405F' },
  facebook:  { Icon: FaFacebookF,  color: '#1877F2' },
  linkedin:  { Icon: FaLinkedinIn, color: '#0A66C2' },
};

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
    { label: 'Connected', value: stats?.connected_accounts ?? 0, icon: Users, iconBg: 'bg-blue-50', iconColor: 'text-blue-500', link: '/social' },
    { label: 'Published', value: stats?.published_posts ?? 0, icon: Send, iconBg: 'bg-purple-50', iconColor: 'text-purple-500', link: '/planner' },
    { label: 'Campaigns', value: stats?.active_campaigns ?? 0, icon: Target, iconBg: 'bg-amber-50', iconColor: 'text-amber-500', link: '/advertising' },
    { label: 'AI Credits', value: credits, icon: Zap, iconBg: creditPercent > 20 ? 'bg-green-50' : 'bg-red-50', iconColor: creditPercent > 20 ? 'text-green-500' : 'text-red-500', link: '/create' }
  ];

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Welcome Banner (no accounts) ── */}
      {connectedAccounts.length === 0 && (
        <div className="rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-white relative overflow-hidden">
          <div className="absolute right-0 top-0 w-64 h-full opacity-10">
            <div className="w-48 h-48 rounded-full bg-white absolute -top-12 -right-12" />
            <div className="w-32 h-32 rounded-full bg-white absolute bottom-4 right-16" />
          </div>
          <div className="relative">
            <p className="text-white/70 text-sm font-medium mb-1">👋 Welcome, {user?.full_name?.split(' ')[0]}!</p>
            <h2 className="text-2xl font-bold mb-2">Get started in 3 minutes</h2>
            <p className="text-white/80 text-sm mb-4 max-w-md">Connect your social accounts, set your niche, and let AI handle the rest — automatically.</p>
            <Link to="/quick-start" className="inline-flex items-center gap-2 bg-white text-green-600 font-semibold px-5 py-2.5 rounded-xl hover:bg-white/90 transition-colors text-sm">
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
                <ArrowRight size={15} className="text-stone-300 group-hover:text-green-500 group-hover:translate-x-0.5 transition-all" />
              </div>
              <p className="text-3xl font-bold text-stone-900 mb-0.5">{s.value}</p>
              <p className="text-sm text-stone-500 font-medium">{s.label}</p>
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
              <h3 className="font-bold text-stone-900 flex items-center gap-2">
                <TrendingUp size={16} className="text-green-500" /> Performance
              </h3>
              <p className="text-xs text-stone-400 mt-0.5">Last 7 days</p>
            </div>
            <select className="text-xs bg-stone-50 border border-stone-200 rounded-lg px-3 py-1.5 text-stone-500 outline-none focus:border-green-500">
              <option>7 days</option>
              <option>30 days</option>
              <option>90 days</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="gv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#16A34A" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#16A34A" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#A8A29E' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: '1px solid #E7E5E4',
                  background: '#FFFFFF',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                  fontSize: 12,
                  color: '#1C1917'
                }}
                labelStyle={{ color: '#78716C', fontSize: 11 }}
                itemStyle={{ color: '#16A34A' }}
              />
              <Area type="monotone" dataKey="views" stroke="#16A34A" strokeWidth={2.5} fill="url(#gv)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>

          {/* Engagement row */}
          <div className="grid grid-cols-4 gap-3 mt-4 pt-4 border-t border-stone-200">
            {[
              { icon: Eye,           label: 'Views',    value: analytics?.total_views || 0,    color: 'text-blue-500' },
              { icon: Heart,         label: 'Likes',    value: analytics?.total_likes || 0,    color: 'text-red-500' },
              { icon: MessageCircle, label: 'Comments', value: analytics?.total_comments || 0, color: 'text-green-500' },
              { icon: Share2,        label: 'Shares',   value: analytics?.total_shares || 0,   color: 'text-purple-500' }
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="text-center">
                <Icon size={18} className={`${color} mx-auto mb-1`} />
                <p className="text-base font-bold text-stone-900">{parseInt(value).toLocaleString()}</p>
                <p className="text-xs text-stone-400">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Gauges & Accounts Column */}
        <div className="space-y-5">
          {/* Key Metrics Gauges */}
          <div className="card">
            <h3 className="font-bold text-stone-900 flex items-center gap-2 mb-4">
              <Target size={16} className="text-green-500" /> Key Metrics
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-stone-50 rounded-xl p-3 border border-stone-200">
                <GaugeChart
                  value={analytics?.engagement_rate || 0}
                  max={10}
                  label="Engagement"
                  color="#16A34A"
                  size={120}
                />
              </div>
              <div className="bg-stone-50 rounded-xl p-3 border border-stone-200">
                <GaugeChart
                  value={creditPercent}
                  max={100}
                  label="Credits"
                  color={creditPercent > 20 ? '#16a34a' : '#ef4444'}
                  size={120}
                />
              </div>
            </div>
          </div>

          {/* Connected Accounts */}
          <div className="card flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-stone-900">Accounts</h3>
              <Link to="/settings/social-accounts" className="text-xs text-green-600 font-semibold hover:underline flex items-center gap-1">
                Manage <ArrowRight size={12} />
              </Link>
            </div>

            {connectedAccounts.length > 0 ? (
              <div className="space-y-3 flex-1">
                {connectedAccounts.slice(0, 5).map((acc) => (
                  <div key={acc.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-stone-50 transition-colors">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-stone-50 border border-stone-200">
                      {(() => {
                        const p = PLATFORM_ICONS[acc.platform_name];
                        if (!p) return <span className="text-sm">📱</span>;
                        const { Icon, color } = p;
                        return <Icon className="w-5 h-5" style={{ color }} />;
                      })()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-stone-900 truncate">{acc.display_name || acc.username}</p>
                      <p className="text-xs text-stone-400 capitalize">{acc.platform_name}</p>
                    </div>
                    <div className={`w-2 h-2 rounded-full ${acc.status === 'connected' ? 'bg-green-400' : 'bg-amber-400'}`} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center py-8 text-center">
                <div className="w-16 h-16 bg-stone-50 border border-stone-200 rounded-2xl flex items-center justify-center text-3xl mb-3">📱</div>
                <p className="text-sm font-semibold text-stone-900 mb-1">No accounts yet</p>
                <p className="text-xs text-stone-400 mb-4">Connect TikTok, YouTube and more</p>
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
        <h3 className="font-bold text-stone-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: '✍️', title: 'Create AI Post', desc: 'Generate content for all platforms', to: '/create', gradient: 'from-purple-500 to-indigo-500' },
            { icon: '🎯', title: 'New Campaign', desc: 'Automate posting forever', to: '/campaigns', gradient: 'from-amber-500 to-orange-500' },
            { icon: '📊', title: 'View Analytics', desc: 'Track your performance', to: '/analytics', gradient: 'from-green-500 to-emerald-500' }
          ].map((a) => (
            <Link key={a.to} to={a.to} className="stat-card group flex items-center gap-4 p-5 hover:border-stone-300">
              <div className={`w-12 h-12 bg-gradient-to-br ${a.gradient} rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 group-hover:scale-110 transition-transform`}>
                {a.icon}
              </div>
              <div>
                <p className="font-semibold text-stone-900">{a.title}</p>
                <p className="text-xs text-stone-400 mt-0.5">{a.desc}</p>
              </div>
              <ArrowRight size={16} className="ml-auto text-stone-300 group-hover:text-green-500 group-hover:translate-x-1 transition-all" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
