import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { Settings, ToggleLeft, ToggleRight, Save, AlertTriangle, Loader2, Server } from 'lucide-react';

export default function AdminSystem() {
  const queryClient = useQueryClient();

  const { data: configData, isLoading } = useQuery('adminSystemConfig', () =>
    api.get('/admin/system-config').then(r => r.data)
  );

  const { data: healthData } = useQuery('adminSystemHealth', () =>
    api.get('/admin/health').then(r => r.data),
    { refetchInterval: 30000 }
  );

  const [features, setFeatures] = useState({});
  const [limits, setLimits]     = useState({});

  const config  = configData?.config  || {};
  const health  = healthData?.health  || {};
  const mergedFeatures = { ...config.features, ...features };
  const mergedLimits   = { ...config.limits,   ...limits };

  const saveMut = useMutation(
    () => api.put('/admin/system-config', { features: mergedFeatures, limits: mergedLimits }),
    {
      onSuccess: () => { toast.success('Configuration saved'); queryClient.invalidateQueries('adminSystemConfig'); },
      onError:   () => toast.error('Failed to save')
    }
  );

  const maintenanceMut = useMutation(
    (enabled) => api.post('/admin/maintenance', { enabled }),
    {
      onSuccess: ({ data }) => {
        toast.success(data.maintenance ? 'Maintenance mode ON' : 'Maintenance mode OFF');
        queryClient.invalidateQueries('adminSystemConfig');
      },
      onError: () => toast.error('Failed')
    }
  );

  const FEATURE_FLAGS = [
    { key: 'ai_image_gen',   label: 'AI Image Generation',   desc: 'Allow users to generate images' },
    { key: 'ai_video_gen',   label: 'AI Video Generation',   desc: 'Allow users to generate videos' },
    { key: 'ai_voice_gen',   label: 'AI Voice Generation',   desc: 'Allow voiceover synthesis' },
    { key: 'auto_publish',   label: 'Auto Publishing',       desc: 'Allow automatic content publishing' },
    { key: 'team_features',  label: 'Team Features',         desc: 'Enable team & collaboration module' },
    { key: 'advertising',    label: 'Advertising Module',    desc: 'Enable paid advertising management' },
    { key: 'audience_crm',   label: 'Audience & CRM',        desc: 'Enable audience management' },
  ];

  const LIMIT_FIELDS = [
    { key: 'max_accounts_free',    label: 'Max accounts (Free plan)',    type: 'number' },
    { key: 'max_posts_per_day',    label: 'Max posts/day (Free)',        type: 'number' },
    { key: 'max_file_size_mb',     label: 'Max upload size (MB)',        type: 'number' },
    { key: 'rate_limit_per_min',   label: 'API rate limit (req/min)',    type: 'number' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">System Configuration</h1>
          <p className="text-sm text-gray-500 mt-1">Manage platform-wide settings and feature flags</p>
        </div>
        <button
          onClick={() => saveMut.mutate()}
          disabled={saveMut.isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-accent-primary text-white rounded-xl text-sm font-medium hover:bg-accent-primary/90 transition-colors disabled:opacity-50"
        >
          {saveMut.isLoading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          Save Changes
        </button>
      </div>

      {/* System Health */}
      <div className="bg-dark-card border border-dark-border rounded-xl p-5">
        <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Server size={15} className="text-accent-primary" /> System Health
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'API',        status: health.api       !== false, value: health.api_latency     ? `${health.api_latency}ms` : 'OK' },
            { label: 'Database',   status: health.database  !== false, value: health.db_latency      ? `${health.db_latency}ms` : 'OK' },
            { label: 'Redis',      status: health.redis     !== false, value: 'Queue' },
            { label: 'Storage',    status: health.storage   !== false, value: health.storage_used    || 'OK' },
          ].map(s => (
            <div key={s.label} className="p-3 bg-dark-bg rounded-xl border border-dark-border">
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-2 h-2 rounded-full ${s.status ? 'bg-green-400' : 'bg-red-400'}`} />
                <span className="text-xs font-medium text-white">{s.label}</span>
              </div>
              <p className={`text-xs ${s.status ? 'text-green-400' : 'text-red-400'}`}>{s.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Maintenance mode */}
      <div className="bg-dark-card border border-yellow-500/20 rounded-xl p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-500/10 rounded-xl flex items-center justify-center">
              <AlertTriangle size={18} className="text-yellow-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Maintenance Mode</p>
              <p className="text-xs text-gray-500">When enabled, only admins can access the platform</p>
            </div>
          </div>
          <button
            onClick={() => maintenanceMut.mutate(!config.maintenance_mode)}
            disabled={maintenanceMut.isLoading}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
              config.maintenance_mode
                ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20 hover:bg-yellow-500/20'
                : 'bg-dark-bg border-dark-border text-gray-400 hover:text-white'
            }`}
          >
            {config.maintenance_mode ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
            {config.maintenance_mode ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      {/* Feature flags */}
      <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden">
        <div className="p-4 border-b border-dark-border">
          <h2 className="text-sm font-semibold text-white">Feature Flags</h2>
        </div>
        <div className="divide-y divide-dark-border">
          {FEATURE_FLAGS.map(f => {
            const enabled = mergedFeatures[f.key] !== false;
            return (
              <div key={f.key} className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm font-medium text-white">{f.label}</p>
                  <p className="text-xs text-gray-500">{f.desc}</p>
                </div>
                <button
                  onClick={() => setFeatures(prev => ({ ...prev, [f.key]: !enabled }))}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                    enabled
                      ? 'text-green-400 border-green-400/20 bg-green-400/10'
                      : 'text-gray-500 border-dark-border'
                  }`}
                >
                  {enabled ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                  {enabled ? 'Enabled' : 'Disabled'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Usage limits */}
      <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden">
        <div className="p-4 border-b border-dark-border">
          <h2 className="text-sm font-semibold text-white">Usage Limits</h2>
        </div>
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {LIMIT_FIELDS.map(f => (
            <div key={f.key}>
              <label className="block text-xs font-medium text-gray-400 mb-1">{f.label}</label>
              <input
                type="number"
                value={mergedLimits[f.key] ?? config.limits?.[f.key] ?? ''}
                onChange={e => setLimits(prev => ({ ...prev, [f.key]: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:outline-none focus:border-accent-primary"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
