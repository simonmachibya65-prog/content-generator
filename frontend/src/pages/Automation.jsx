/**
 * Automation — unified page replacing Autopilot + Workflows
 * Tabs: Overview | AI Autopilot | Workflows | History
 *
 * The original Autopilot.jsx and Workflows.jsx logic is preserved
 * here as sub-components to avoid losing any work.
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { FaTiktok, FaYoutube, FaXTwitter, FaInstagram, FaFacebookF, FaLinkedinIn } from 'react-icons/fa6';

const PLATFORM_ICONS = {
  tiktok:    { Icon: FaTiktok,     color: '#000000' },
  youtube:   { Icon: FaYoutube,    color: '#FF0000' },
  x:         { Icon: FaXTwitter,   color: '#000000' },
  instagram: { Icon: FaInstagram,  color: '#E4405F' },
  facebook:  { Icon: FaFacebookF,  color: '#1877F2' },
  linkedin:  { Icon: FaLinkedinIn, color: '#0A66C2' },
};

const TRIGGER_TYPES = [
  { id: 'schedule',    label: 'Schedule',    icon: Clock,      desc: 'Run at specific times',    color: 'text-blue-400',   bg: 'bg-blue-500/10' },
  { id: 'performance', label: 'Performance', icon: TrendingUp, desc: 'Trigger on metrics',       color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  { id: 'rss',         label: 'RSS Feed',    icon: Rss,        desc: 'React to new content',     color: 'text-orange-400', bg: 'bg-orange-500/10' },
  { id: 'webhook',     label: 'Webhook',     icon: Webhook,    desc: 'External trigger',         color: 'text-violet-400', bg: 'bg-violet-500/10' },
];

const WORKFLOW_TEMPLATES = [
  {
    name: 'Daily Auto-Post',
    description: 'Generate and publish 1 AI post every day at 9 AM',
    trigger_type: 'schedule',
    trigger_config: { cron: '0 9 * * *' },
    actions: [{ type: 'generate_content', params: { count: 1 } }, { type: 'publish_now' }]
  },
  {
    name: 'Product Launch Campaign',
    description: 'Burst post 3× daily for 7 days on launch',
    trigger_type: 'schedule',
    trigger_config: { cron: '0 9,13,18 * * *', days: 7 },
    actions: [{ type: 'generate_content', params: { count: 1, tone: 'promotional' } }, { type: 'publish_now' }]
  },
  {
    name: 'Engagement Booster',
    description: 'Post extra content when engagement drops below 2 %',
    trigger_type: 'performance',
    trigger_config: { metric: 'engagement_rate', operator: '<', value: 2 },
    actions: [{ type: 'generate_content', params: { count: 2, tone: 'engaging' } }, { type: 'schedule_post' }]
  },
  {
    name: 'Weekly Report',
    description: 'Send a performance summary every Monday morning',
    trigger_type: 'schedule',
    trigger_config: { cron: '0 8 * * 1' },
    actions: [{ type: 'send_notification', params: { type: 'weekly_report' } }]
  },
];

const TABS = [
  { id: 'overview',   label: 'Overview',      icon: Activity },
  { id: 'autopilot',  label: 'AI Autopilot',  icon: Bot },
  { id: 'workflows',  label: 'Workflows',     icon: GitBranch },
  { id: 'history',    label: 'History',       icon: History },
];

// ─────────────────────────────────────────────────────────────
// Overview Tab
// ─────────────────────────────────────────────────────────────
function OverviewTab({ onSwitchTab }) {
  const { data: settingsData } = useQuery('autopilotSettings', () =>
    api.get('/automation/autopilot').then(r => r.data)
  );
  const { data: wfData } = useQuery('workflows', () =>
    api.get('/automation/workflows').then(r => r.data)
  );
  const { data: statsData } = useQuery('autopilotStats', () =>
    api.get('/publishing/stats').then(r => r.data)
  );

  const settings = settingsData?.settings || {};
  const workflows = wfData?.workflows || [];
  const stats = statsData?.stats || {};
  const activeWorkflows = workflows.filter(w => w.status === 'active').length;

  return (
    <div className="space-y-6">
      {/* Status cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-dark-card border border-dark-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-gray-400">AI Autopilot</p>
            <div className={`w-2.5 h-2.5 rounded-full ${settings.is_enabled ? 'bg-emerald-400 animate-pulse' : 'bg-gray-600'}`} />
          </div>
          <p className="text-2xl font-bold text-white mb-1">{settings.is_enabled ? 'Active' : 'Inactive'}</p>
          <p className="text-xs text-gray-500">{settings.posts_per_month || 0} posts/month target</p>
          <button
            onClick={() => onSwitchTab('autopilot')}
            className="mt-3 text-xs text-accent-primary hover:underline"
          >
            Configure →
          </button>
        </div>

        <div className="bg-dark-card border border-dark-border rounded-xl p-5">
          <p className="text-sm text-gray-400 mb-3">Active Workflows</p>
          <p className="text-2xl font-bold text-white mb-1">{activeWorkflows}</p>
          <p className="text-xs text-gray-500">of {workflows.length} total</p>
          <button
            onClick={() => onSwitchTab('workflows')}
            className="mt-3 text-xs text-accent-primary hover:underline"
          >
            Manage →
          </button>
        </div>

        <div className="bg-dark-card border border-dark-border rounded-xl p-5">
          <p className="text-sm text-gray-400 mb-3">Posts This Month</p>
          <p className="text-2xl font-bold text-white mb-1">{stats.published_this_month || 0}</p>
          <p className="text-xs text-gray-500">{stats.scheduled_count || 0} scheduled</p>
        </div>
      </div>

      {/* Active workflows list */}
      {workflows.length > 0 && (
        <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-dark-border">
            <h3 className="text-sm font-semibold text-white">Active Workflows</h3>
          </div>
          <div className="divide-y divide-dark-border">
            {workflows.slice(0, 5).map((wf) => (
              <div key={wf.id} className="flex items-center gap-3 px-5 py-3">
                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${wf.status === 'active' ? 'bg-emerald-400' : 'bg-gray-600'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{wf.name}</p>
                  <p className="text-xs text-gray-500 capitalize">{wf.trigger_type}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full border ${
                  wf.status === 'active'
                    ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20'
                    : 'text-gray-400 bg-gray-400/10 border-gray-400/20'
                }`}>{wf.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {workflows.length === 0 && (
        <div className="text-center py-12 bg-dark-card border border-dark-border rounded-xl">
          <GitBranch className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 mb-1">No workflows yet</p>
          <p className="text-sm text-gray-500 mb-4">Automate your content creation and publishing</p>
          <button
            onClick={() => onSwitchTab('workflows')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-accent-primary text-white rounded-xl text-sm font-medium hover:bg-accent-primary/90 transition-colors"
          >
            <Plus size={14} /> Create Workflow
          </button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Autopilot Tab (content from Autopilot.jsx)
// ─────────────────────────────────────────────────────────────
function AutopilotTab() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: settingsData, isLoading } = useQuery('autopilotSettings', () =>
    api.get('/automation/autopilot').then(r => r.data)
  );
  const { data: accountsData } = useQuery('socialAccounts', () =>
    api.get('/social-accounts').then(r => r.data)
  );

  const settings = settingsData?.settings || {
    is_enabled: false, posts_per_month: 20, videos_per_month: 10,
    max_posts_per_day: 2, publishing_mode: 'auto', platforms: [],
    social_account_ids: [], auto_approve: true, content_language: 'en', content_tone: 'professional'
  };

  const [form, setForm] = useState(settings);
  const connectedAccounts = accountsData?.accounts || [];

  const saveMut = useMutation(
    (data) => api.put('/automation/autopilot', data),
    {
      onSuccess: () => { toast.success('Settings saved!'); queryClient.invalidateQueries('autopilotSettings'); },
      onError:   () => toast.error('Failed to save settings')
    }
  );
  const toggleMut = useMutation(
    () => api.post('/automation/autopilot/toggle'),
    {
      onSuccess: ({ data }) => {
        toast.success(data.is_enabled ? '🚀 Autopilot Activated!' : 'Autopilot paused');
        queryClient.invalidateQueries('autopilotSettings');
      },
      onError: () => toast.error('Failed to toggle')
    }
  );
  const generateNowMut = useMutation(
    () => api.post('/automation/autopilot/generate-now'),
    {
      onSuccess: ({ data }) => toast.success(`Generated ${data.count} posts!`),
      onError:   () => toast.error('Failed to generate')
    }
  );

  const toggleAccount = (id) =>
    setForm(prev => ({
      ...prev,
      social_account_ids: prev.social_account_ids.includes(id)
        ? prev.social_account_ids.filter(a => a !== id)
        : [...prev.social_account_ids, id]
    }));

  if (isLoading) return (
    <div className="flex items-center justify-center h-40">
      <Loader2 size={24} className="animate-spin text-accent-primary" />
    </div>
  );

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Status + toggle */}
      <div className="flex items-center justify-between p-5 bg-dark-card border border-dark-border rounded-xl">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${settings.is_enabled ? 'bg-emerald-400 animate-pulse' : 'bg-gray-600'}`} />
          <div>
            <p className="text-sm font-semibold text-white">{settings.is_enabled ? 'Autopilot Active' : 'Autopilot Off'}</p>
            <p className="text-xs text-gray-500">AI publishes content automatically based on your settings</p>
          </div>
        </div>
        <button
          onClick={() => toggleMut.mutate()}
          disabled={toggleMut.isLoading}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            settings.is_enabled
              ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20'
              : 'bg-accent-primary text-white hover:bg-accent-primary/90'
          }`}
        >
          {toggleMut.isLoading ? <Loader2 size={14} className="animate-spin" /> :
            settings.is_enabled ? <><Pause size={14} /> Pause</> : <><Play size={14} /> Activate</>}
        </button>
      </div>

      {/* Volume settings */}
      <div className="bg-dark-card border border-dark-border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Content Volume</h3>
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Posts / month',   key: 'posts_per_month',   max: 120 },
            { label: 'Videos / month',  key: 'videos_per_month',  max: 30  },
            { label: 'Max posts / day', key: 'max_posts_per_day', max: 10  },
          ].map(({ label, key, max }) => (
            <div key={key}>
              <label className="text-xs text-gray-400 block mb-1">{label}</label>
              <input
                type="number"
                min={0} max={max}
                value={form[key] || 0}
                onChange={e => setForm(prev => ({ ...prev, [key]: +e.target.value }))}
                className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white text-sm"
              />
            </div>
          ))}
          <div>
            <label className="text-xs text-gray-400 block mb-1">Publishing mode</label>
            <select
              value={form.publishing_mode}
              onChange={e => setForm(prev => ({ ...prev, publishing_mode: e.target.value }))}
              className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white text-sm"
            >
              <option value="auto">Auto publish</option>
              <option value="approval">Require approval</option>
              <option value="manual">Manual only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Accounts */}
      {connectedAccounts.length > 0 && (
        <div className="bg-dark-card border border-dark-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Target Accounts</h3>
          <div className="space-y-2">
            {connectedAccounts.map((acc) => {
              const selected = form.social_account_ids.includes(acc.id);
              return (
                <button
                  key={acc.id}
                  onClick={() => toggleAccount(acc.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${
                    selected
                      ? 'border-accent-primary bg-accent-primary/10'
                      : 'border-dark-border hover:border-gray-600'
                  }`}
                >
                  <span className="text-lg">{PLATFORM_ICONS[acc.platform_name] || '🌐'}</span>
                  <div className="flex-1">
                    <p className="text-sm text-white">{acc.display_name || acc.username}</p>
                    <p className="text-xs text-gray-500 capitalize">{acc.platform_name}</p>
                  </div>
                  {selected && <CheckCircle2 size={16} className="text-accent-primary flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Save + Generate Now */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => saveMut.mutate(form)}
          disabled={saveMut.isLoading}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-accent-primary text-white rounded-xl text-sm font-medium hover:bg-accent-primary/90 transition-colors"
        >
          {saveMut.isLoading ? <Loader2 size={14} className="animate-spin" /> : <Settings2 size={14} />}
          Save Settings
        </button>
        <button
          onClick={() => generateNowMut.mutate()}
          disabled={generateNowMut.isLoading}
          className="flex items-center gap-2 px-4 py-2.5 bg-dark-card border border-dark-border text-white rounded-xl text-sm font-medium hover:border-accent-primary transition-colors"
        >
          {generateNowMut.isLoading ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
          Generate Now
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Workflows Tab (content from Workflows.jsx)
// ─────────────────────────────────────────────────────────────
function WorkflowsTab() {
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', trigger_type: 'schedule', trigger_config: {}, actions: [] });
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery('workflows', () =>
    api.get('/automation/workflows').then(r => r.data)
  );
  const createMut = useMutation(
    (wf) => api.post('/automation/workflows', wf),
    {
      onSuccess: () => {
        toast.success('Workflow created!');
        setShowCreate(false);
        setForm({ name: '', description: '', trigger_type: 'schedule', trigger_config: {}, actions: [] });
        queryClient.invalidateQueries('workflows');
      },
      onError: (err) => toast.error(err.response?.data?.error || 'Failed to create')
    }
  );
  const toggleMut = useMutation(
    (id) => api.post(`/automation/workflows/${id}/toggle`),
    { onSuccess: () => { toast.success('Workflow updated'); queryClient.invalidateQueries('workflows'); } }
  );
  const deleteMut = useMutation(
    (id) => api.delete(`/automation/workflows/${id}`),
    { onSuccess: () => { toast.success('Deleted'); queryClient.invalidateQueries('workflows'); } }
  );

  const workflows = data?.workflows || [];

  if (isLoading) return (
    <div className="flex items-center justify-center h-40">
      <Loader2 size={24} className="animate-spin text-accent-primary" />
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-400">{workflows.length} workflow{workflows.length !== 1 ? 's' : ''}</p>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-accent-primary text-white rounded-xl text-sm font-medium hover:bg-accent-primary/90 transition-colors"
        >
          <Plus size={14} /> New Workflow
        </button>
      </div>

      {/* Templates (only when no workflows yet) */}
      {workflows.length === 0 && !showCreate && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {WORKFLOW_TEMPLATES.map((t, i) => (
            <div key={i} className="p-5 bg-dark-card border border-dark-border rounded-xl">
              <h3 className="text-sm font-semibold text-white mb-1">{t.name}</h3>
              <p className="text-xs text-gray-400 mb-3">{t.description}</p>
              <button
                onClick={() => createMut.mutate(t)}
                disabled={createMut.isLoading}
                className="flex items-center gap-1 text-xs text-accent-primary hover:underline"
              >
                Use template <ArrowRight size={11} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Create form */}
      {showCreate && (
        <div className="p-5 bg-dark-card border border-accent-primary/30 rounded-xl space-y-4">
          <h3 className="text-sm font-semibold text-white">New Workflow</h3>
          <input
            placeholder="Workflow name"
            value={form.name}
            onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
            className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white text-sm"
          />
          <input
            placeholder="Description (optional)"
            value={form.description}
            onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
            className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white text-sm"
          />
          <div className="grid grid-cols-2 gap-3">
            {TRIGGER_TYPES.map((t) => (
              <button
                key={t.id}
                onClick={() => setForm(p => ({ ...p, trigger_type: t.id }))}
                className={`flex items-center gap-2 p-3 rounded-lg border text-left transition-all ${
                  form.trigger_type === t.id
                    ? 'border-accent-primary bg-accent-primary/10'
                    : 'border-dark-border hover:border-gray-600'
                }`}
              >
                <t.icon size={16} className={t.color} />
                <div>
                  <p className="text-xs font-medium text-white">{t.label}</p>
                  <p className="text-[10px] text-gray-500">{t.desc}</p>
                </div>
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => createMut.mutate(form)}
              disabled={!form.name || createMut.isLoading}
              className="flex-1 py-2 bg-accent-primary text-white rounded-xl text-sm font-medium hover:bg-accent-primary/90 transition-colors disabled:opacity-50"
            >
              {createMut.isLoading ? 'Creating…' : 'Create Workflow'}
            </button>
            <button
              onClick={() => setShowCreate(false)}
              className="px-4 py-2 bg-dark-bg border border-dark-border text-gray-400 rounded-xl text-sm hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Workflow list */}
      <div className="space-y-2">
        {workflows.map((wf) => (
          <div key={wf.id} className="flex items-center gap-4 p-4 bg-dark-card border border-dark-border rounded-xl hover:border-gray-600 transition-colors">
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${wf.status === 'active' ? 'bg-emerald-400 animate-pulse' : 'bg-gray-600'}`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{wf.name}</p>
              <p className="text-xs text-gray-500">{wf.description || wf.trigger_type}</p>
            </div>
            <span className="text-xs text-gray-500">{wf.run_count || 0} runs</span>
            <button
              onClick={() => toggleMut.mutate(wf.id)}
              className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                wf.status === 'active'
                  ? 'text-yellow-400 border-yellow-400/20 hover:bg-yellow-400/10'
                  : 'text-emerald-400 border-emerald-400/20 hover:bg-emerald-400/10'
              }`}
            >
              {wf.status === 'active' ? 'Pause' : 'Activate'}
            </button>
            <button
              onClick={() => deleteMut.mutate(wf.id)}
              className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// History Tab — real run log
// ─────────────────────────────────────────────────────────────
function HistoryTab() {
  const { data, isLoading } = useQuery('automationHistory', () =>
    api.get('/automation/history').then(r => r.data)
  );

  const runs = data?.history || [];

  if (isLoading) return (
    <div className="flex items-center justify-center h-40">
      <Loader2 size={24} className="animate-spin text-accent-primary" />
    </div>
  );

  if (runs.length === 0) return (
    <div className="text-center py-16">
      <History className="w-10 h-10 text-gray-600 mx-auto mb-3" />
      <p className="text-gray-400 mb-1">No automation history yet</p>
      <p className="text-sm text-gray-500">Run history will appear here once workflows execute</p>
    </div>
  );

  return (
    <div className="space-y-2">
      {runs.map((run, i) => (
        <div key={run.id || i} className="flex items-center gap-4 p-4 bg-dark-card border border-dark-border rounded-xl">
          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
            run.status === 'completed' ? 'bg-green-400' :
            run.status === 'failed'    ? 'bg-red-400'   :
            'bg-yellow-400'
          }`} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{run.workflow_name || 'Workflow run'}</p>
            <p className="text-xs text-gray-500">{run.trigger_type} trigger</p>
          </div>
          <span className={`text-xs px-2 py-0.5 rounded-full border ${
            run.status === 'completed' ? 'text-green-400 border-green-400/20 bg-green-400/10' :
            run.status === 'failed'    ? 'text-red-400 border-red-400/20 bg-red-400/10' :
            'text-yellow-400 border-yellow-400/20 bg-yellow-400/10'
          }`}>{run.status}</span>
          <span className="text-xs text-gray-500 flex-shrink-0">
            {run.executed_at ? new Date(run.executed_at).toLocaleString() : '—'}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────
export default function Automation() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Automation & AI Autopilot</h1>
        <p className="text-sm text-gray-500 mt-0.5">Automate your marketing with AI-driven workflows</p>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-1 mb-6 border-b border-dark-border">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                active
                  ? 'border-accent-primary text-white'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <Icon size={15} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'overview'  && <OverviewTab onSwitchTab={setActiveTab} />}
      {activeTab === 'autopilot' && <AutopilotTab />}
      {activeTab === 'workflows' && <WorkflowsTab />}
      {activeTab === 'history'   && <HistoryTab />}
    </div>
  );
}
