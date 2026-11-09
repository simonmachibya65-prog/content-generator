import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { Zap, DollarSign, ToggleLeft, ToggleRight, Loader2, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const PROVIDERS = [
  { id: 'openai',    name: 'OpenAI',        desc: 'GPT-4o, DALL-E, Whisper', color: 'from-emerald-500 to-teal-500' },
  { id: 'gemini',    name: 'Google Gemini', desc: 'Gemini Pro, Gemini Image', color: 'from-blue-500 to-indigo-500' },
  { id: 'veo',       name: 'Google Veo',    desc: 'Video generation',         color: 'from-violet-500 to-purple-600' },
  { id: 'runway',    name: 'Runway',        desc: 'Video generation fallback', color: 'from-pink-500 to-rose-500' },
  { id: 'elevenlabs',name: 'ElevenLabs',    desc: 'Voice & TTS',              color: 'from-amber-500 to-orange-500' },
];

export default function AdminAIUsage() {
  const queryClient = useQueryClient();

  const { data: usageData, isLoading } = useQuery('adminAIUsage', () =>
    api.get('/admin/ai-usage').then(r => r.data)
  );

  const { data: configData } = useQuery('adminAIConfig', () =>
    api.get('/admin/ai-config').then(r => r.data)
  );

  const toggleProvider = useMutation(
    ({ provider, enabled }) => api.post(`/admin/ai-config/toggle`, { provider, enabled }),
    {
      onSuccess: () => { toast.success('Provider updated'); queryClient.invalidateQueries('adminAIConfig'); },
      onError:   () => toast.error('Failed to update provider')
    }
  );

  const usage  = usageData?.usage || {};
  const daily  = usageData?.daily || [];
  const config = configData?.config || {};

  const costSummary = [
    { label: 'Today',        value: `$${(usage.cost_today || 0).toFixed(2)}`,   sub: `${usage.requests_today || 0} requests` },
    { label: 'This Month',   value: `$${(usage.cost_month || 0).toFixed(2)}`,   sub: `${usage.requests_month || 0} requests` },
    { label: 'Avg / Request',value: `$${(usage.avg_cost || 0).toFixed(4)}`,     sub: 'per generation' },
    { label: 'Credits Used', value: usage.credits_used || 0,                    sub: 'platform-wide' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">AI Provider Management</h1>
        <p className="text-sm text-gray-500 mt-1">Monitor AI usage, costs and provider configuration</p>
      </div>

      {/* Cost summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {costSummary.map(s => (
          <div key={s.label} className="bg-dark-card border border-dark-border rounded-xl p-4">
            <p className="text-2xl font-bold text-white">{s.value}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
            <p className="text-xs text-gray-600">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Daily usage chart */}
      <div className="bg-dark-card border border-dark-border rounded-xl p-5">
        <h2 className="text-sm font-semibold text-white mb-4">Daily AI Requests (Last 30 Days)</h2>
        {daily.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={daily}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
              <XAxis dataKey="date" tick={{ fill: '#9ca3af', fontSize: 11 }} />
              <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} />
              <Tooltip contentStyle={{ backgroundColor: '#252b3f', border: '1px solid #2d3748', borderRadius: 8 }} />
              <Bar dataKey="requests" fill="#00d4aa" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-40 text-gray-500 text-sm">No usage data yet</div>
        )}
      </div>

      {/* Provider configuration */}
      <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden">
        <div className="p-5 border-b border-dark-border">
          <h2 className="text-sm font-semibold text-white">Provider Configuration</h2>
          <p className="text-xs text-gray-500 mt-1">Enable or disable AI providers. API keys are managed via environment variables.</p>
        </div>
        <div className="divide-y divide-dark-border">
          {PROVIDERS.map(provider => {
            const isEnabled = config[provider.id]?.enabled !== false;
            const provUsage = usage.by_provider?.[provider.id] || {};

            return (
              <div key={provider.id} className="flex items-center gap-4 p-4">
                <div className={`w-10 h-10 bg-gradient-to-br ${provider.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                  <Zap size={16} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white">{provider.name}</p>
                  <p className="text-xs text-gray-500">{provider.desc}</p>
                  {provUsage.requests > 0 && (
                    <p className="text-xs text-gray-600 mt-0.5">
                      {provUsage.requests} requests · ${(provUsage.cost || 0).toFixed(2)} this month
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {!config[provider.id]?.api_key_set && (
                    <div className="flex items-center gap-1 text-xs text-yellow-400">
                      <AlertTriangle size={12} /> No API key
                    </div>
                  )}
                  <button
                    onClick={() => toggleProvider.mutate({ provider: provider.id, enabled: !isEnabled })}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                      isEnabled
                        ? 'text-green-400 border-green-400/20 bg-green-400/10 hover:bg-green-400/20'
                        : 'text-gray-500 border-dark-border hover:border-gray-600'
                    }`}
                  >
                    {isEnabled ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                    {isEnabled ? 'Enabled' : 'Disabled'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Usage by type */}
      {usage.by_type && (
        <div className="bg-dark-card border border-dark-border rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Requests by Type</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(usage.by_type).map(([type, count]) => (
              <div key={type} className="p-3 bg-dark-bg rounded-xl border border-dark-border text-center">
                <p className="text-lg font-bold text-white">{count}</p>
                <p className="text-xs text-gray-500 capitalize mt-0.5">{type.replace('_', ' ')}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
