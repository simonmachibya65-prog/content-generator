import { useState } from 'react';
import { useQuery } from 'react-query';
import api from '../../lib/api';
import { TrendingUp, Users, DollarSign, Zap } from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

export default function AdminAnalytics() {
  const [range, setRange] = useState('30');

  const { data, isLoading } = useQuery(
    ['adminPlatformAnalytics', range],
    () => api.get(`/admin/analytics?days=${range}`).then(r => r.data)
  );

  const stats   = data?.stats   || {};
  const growth  = data?.growth  || [];
  const revenue = data?.revenue || [];
  const top     = data?.topUsers || [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Platform Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">Business-wide performance metrics</p>
        </div>
        <div className="flex gap-1 bg-dark-card border border-dark-border rounded-xl p-1">
          {['7','30','90'].map(d => (
            <button key={d} onClick={() => setRange(d)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                range === d ? 'bg-accent-primary text-white' : 'text-gray-400 hover:text-white'
              }`}>{d}d</button>
          ))}
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'New Users',       value: stats.new_users || 0,           icon: Users,      color: 'text-blue-400' },
          { label: 'MRR',             value: `$${stats.mrr || 0}`,           icon: DollarSign, color: 'text-green-400' },
          { label: 'AI Generations',  value: stats.ai_generations || 0,      icon: Zap,        color: 'text-amber-400' },
          { label: 'Posts Published', value: stats.posts_published || 0,     icon: TrendingUp, color: 'text-purple-400' },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-dark-card border border-dark-border rounded-xl p-4">
              <Icon size={18} className={`${s.color} mb-2`} />
              <p className="text-2xl font-bold text-white">{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* User growth */}
      <div className="bg-dark-card border border-dark-border rounded-xl p-5">
        <h2 className="text-sm font-semibold text-white mb-4">User Growth</h2>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={growth}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
            <XAxis dataKey="date" tick={{ fill: '#9ca3af', fontSize: 11 }} />
            <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} />
            <Tooltip contentStyle={{ backgroundColor: '#252b3f', border: '1px solid #2d3748', borderRadius: 8 }} />
            <Line type="monotone" dataKey="users" stroke="#00d4aa" strokeWidth={2} name="Users" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Revenue trend */}
      <div className="bg-dark-card border border-dark-border rounded-xl p-5">
        <h2 className="text-sm font-semibold text-white mb-4">Revenue Trend</h2>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={revenue}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
            <XAxis dataKey="date" tick={{ fill: '#9ca3af', fontSize: 11 }} />
            <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} />
            <Tooltip contentStyle={{ backgroundColor: '#252b3f', border: '1px solid #2d3748', borderRadius: 8 }} />
            <Bar dataKey="mrr" fill="#6366f1" radius={[4, 4, 0, 0]} name="MRR ($)" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Top users */}
      {top.length > 0 && (
        <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden">
          <div className="p-4 border-b border-dark-border">
            <h2 className="text-sm font-semibold text-white">Most Active Users</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-dark-bg/50">
              <tr>
                {['User','Plan','Posts','AI Credits Used','Joined'].map(h => (
                  <th key={h} className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-border">
              {top.map(u => (
                <tr key={u.id} className="hover:bg-dark-hover">
                  <td className="py-3 px-4">
                    <p className="text-white font-medium">{u.full_name}</p>
                    <p className="text-xs text-gray-500">{u.email}</p>
                  </td>
                  <td className="py-3 px-4 text-gray-300 capitalize">{u.plan}</td>
                  <td className="py-3 px-4 text-gray-300">{u.posts_count || 0}</td>
                  <td className="py-3 px-4 text-gray-300">{u.ai_credits_used || 0}</td>
                  <td className="py-3 px-4 text-gray-500 text-xs">
                    {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
