import { useState } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { useAuthStore } from '../store/authStore';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { Bell, Mail, MessageSquare, TrendingUp, Users, CheckCircle2, Smartphone } from 'lucide-react';

const NOTIFICATION_TYPES = [
  {
    id: 'publishing',
    icon: CheckCircle2,
    title: 'Publishing Updates',
    description: 'Get notified when posts are published or fail',
    email: true,
    push: true,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10'
  },
  {
    id: 'campaigns',
    icon: TrendingUp,
    title: 'Campaign Performance',
    description: 'Daily and weekly campaign performance reports',
    email: true,
    push: false,
    color: 'text-indigo-400',
    bg: 'bg-indigo-500/10'
  },
  {
    id: 'social_mentions',
    icon: MessageSquare,
    title: 'Social Mentions',
    description: 'When someone mentions or tags your account',
    email: true,
    push: true,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10'
  },
  {
    id: 'team_activity',
    icon: Users,
    title: 'Team Activity',
    description: 'Team members join, post approvals, and role changes',
    email: true,
    push: false,
    color: 'text-violet-400',
    bg: 'bg-violet-500/10'
  },
  {
    id: 'ai_recommendations',
    icon: Bell,
    title: 'AI Recommendations',
    description: 'Content suggestions and optimization tips',
    email: true,
    push: false,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10'
  }
];

export default function Notifications() {
  const { user } = useAuthStore();
  const [settings, setSettings] = useState({
    publishing: { email: true, push: true },
    campaigns: { email: true, push: false },
    social_mentions: { email: true, push: true },
    team_activity: { email: true, push: false },
    ai_recommendations: { email: false, push: false }
  });
  const [emailDigest, setEmailDigest] = useState('daily');
  const queryClient = useQueryClient();

  const saveMut = useMutation(
    () => api.put('/users/notification-settings', { settings, emailDigest }),
    {
      onSuccess: () => {
        toast.success('Notification settings saved');
        queryClient.invalidateQueries('auth');
      },
      onError: () => toast.error('Failed to save settings')
    }
  );

  const toggleNotification = (type, channel) => {
    setSettings(prev => ({
      ...prev,
      [type]: { ...prev[type], [channel]: !prev[type][channel] }
    }));
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">

      {/* ── Header ─────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold text-white">Notifications</h1>
        <p className="text-sm text-gray-500 mt-1">Manage how you receive updates and alerts</p>
      </div>

      {/* ── Email Digest ───────────────── */}
      <div className="card">
        <div className="flex items-center gap-2 pb-4 border-b border-dark-border mb-4">
          <Mail size={18} className="text-accent-primary" />
          <h3 className="font-bold text-white">Email Digest</h3>
        </div>

        <p className="text-sm text-gray-400 mb-4">
          Receive a summary of your account activity via email
        </p>

        <div className="flex flex-wrap gap-3">
          {['instant', 'daily', 'weekly', 'never'].map(freq => (
            <button
              key={freq}
              onClick={() => setEmailDigest(freq)}
              className={`px-4 py-2.5 rounded-xl border-2 text-sm font-medium capitalize transition-all
                ${emailDigest === freq
                  ? 'border-accent-primary bg-accent-primary/10 text-accent-primary'
                  : 'border-dark-border text-gray-400 hover:border-dark-border-light'}`}
            >
              {freq}
            </button>
          ))}
        </div>
      </div>

      {/* ── Notification Preferences ────── */}
      <div className="card">
        <div className="flex items-center gap-2 pb-4 border-b border-dark-border mb-4">
          <Bell size={18} className="text-accent-primary" />
          <h3 className="font-bold text-white">Notification Preferences</h3>
        </div>

        <div className="space-y-1">
          {NOTIFICATION_TYPES.map(type => {
            const Icon = type.icon;
            return (
              <div
                key={type.id}
                className="flex items-center gap-4 p-4 rounded-xl hover:bg-dark-hover transition-colors"
              >
                <div className={`w-11 h-11 ${type.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                  <Icon size={20} className={type.color} />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white text-sm">{type.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{type.description}</p>
                </div>

                <div className="flex items-center gap-6">
                  {/* Email toggle */}
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <Mail size={16} className="text-gray-500 group-hover:text-white transition-colors" />
                    <button
                      onClick={() => toggleNotification(type.id, 'email')}
                      className={`relative w-11 h-6 rounded-full transition-colors ${
                        settings[type.id]?.email
                          ? 'bg-accent-primary'
                          : 'bg-dark-surface border border-dark-border'
                      }`}
                    >
                      <div
                        className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                          settings[type.id]?.email ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </label>

                  {/* Push toggle */}
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <Smartphone size={16} className="text-gray-500 group-hover:text-white transition-colors" />
                    <button
                      onClick={() => toggleNotification(type.id, 'push')}
                      className={`relative w-11 h-6 rounded-full transition-colors ${
                        settings[type.id]?.push
                          ? 'bg-accent-primary'
                          : 'bg-dark-surface border border-dark-border'
                      }`}
                    >
                      <div
                        className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                          settings[type.id]?.push ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </label>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Save Button ────────────────── */}
      <div className="flex justify-end">
        <button
          onClick={() => saveMut.mutate()}
          disabled={saveMut.isLoading}
          className={`btn btn-primary ${saveMut.isLoading ? 'btn-disabled' : ''}`}
        >
          {saveMut.isLoading ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>

      {/* ── Info Banner ────────────────── */}
      <div className="card bg-accent-primary/5 border-accent-primary/20">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-accent-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <Bell size={18} className="text-accent-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-sm mb-1">Push Notifications</h3>
            <p className="text-sm text-gray-400">
              To receive push notifications, enable them in your browser settings and allow notifications for this website.
              Mobile push notifications will be available in the mobile app.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
