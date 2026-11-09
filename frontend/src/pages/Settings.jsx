import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useMutation, useQueryClient } from 'react-query';
import api from '../lib/api';
import toast from 'react-hot-toast';
import {
  User, Globe, Bell, Lock, CreditCard, Zap,
  Save, ArrowRight, Shield, LogOut, Camera, AlertTriangle
} from 'lucide-react';

export default function Settings() {
  const { user, logout, updateUser } = useAuthStore();
  const fileInputRef = useRef(null);
  const [form, setForm] = useState({
    full_name: user?.full_name || '',
    timezone: user?.timezone || 'Africa/Dar_es_Salaam',
    language: user?.language || 'en'
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteText, setDeleteText] = useState('');
  const queryClient = useQueryClient();

  const credits = Math.max(0, (user?.ai_credits || 0) - (user?.ai_credits_used || 0));

  const updateMut = useMutation(
    () => api.put('/users/profile', form),
    {
      onSuccess: ({ data }) => {
        toast.success('Profile updated');
        if (data?.user) updateUser(data.user);
        queryClient.invalidateQueries('auth');
      },
      onError: () => toast.error('Update failed')
    }
  );

  const avatarMut = useMutation(
    (file) => {
      const fd = new FormData();
      fd.append('file', file);
      return api.post('/media/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    },
    {
      onSuccess: ({ data }) => {
        const avatarUrl = data?.file?.file_url || data?.url;
        if (avatarUrl) {
          api.put('/users/profile', { avatar_url: avatarUrl }).then(({ data: r }) => {
            if (r?.user) updateUser(r.user);
            toast.success('Avatar updated');
          });
        }
      },
      onError: () => toast.error('Avatar upload failed')
    }
  );

  const deleteMut = useMutation(
    () => api.delete('/users/account'),
    {
      onSuccess: () => {
        toast.success('Account deleted');
        logout();
      },
      onError: () => toast.error('Failed to delete account. Contact support.')
    }
  );

  const handleAvatarClick = () => fileInputRef.current?.click();
  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file) avatarMut.mutate(file);
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">

      {/* ── Header ─────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your account and preferences</p>
      </div>

      {/* ── Profile ────────────────────── */}
      <div className="card">
        <div className="flex items-center gap-2 pb-4 border-b border-dark-border mb-5">
          <User size={18} className="text-accent-primary" />
          <h3 className="font-bold text-white">Profile</h3>
        </div>

        <div className="space-y-4">
          {/* Avatar with real upload */}
          <div className="flex items-center gap-4">
            <div className="relative">
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt="" className="w-16 h-16 rounded-xl object-cover" />
              ) : (
                <div className="w-16 h-16 bg-gradient-to-br from-accent-primary to-emerald-500 rounded-xl flex items-center justify-center text-dark-base text-2xl font-bold">
                  {user?.full_name?.[0]?.toUpperCase()}
                </div>
              )}
              <button
                onClick={handleAvatarClick}
                disabled={avatarMut.isLoading}
                className="absolute -bottom-1 -right-1 w-6 h-6 bg-dark-elevated border border-dark-border rounded-lg flex items-center justify-center hover:bg-dark-hover transition-colors"
                title="Upload avatar"
              >
                <Camera size={12} className="text-gray-400" />
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{user?.full_name}</p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
          </div>

          <div>
            <label className="label">Full Name</label>
            <input
              type="text"
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              className="input"
            />
          </div>

          <div>
            <label className="label">Email</label>
            <input
              type="email"
              value={user?.email}
              disabled
              className="input opacity-50 cursor-not-allowed"
            />
            <p className="text-xs text-gray-600 mt-1">Email cannot be changed</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Timezone</label>
              <select value={form.timezone} onChange={(e) => setForm({ ...form, timezone: e.target.value })} className="select">
                <option value="Africa/Dar_es_Salaam">🇹🇿 Dar es Salaam</option>
                <option value="Africa/Nairobi">🇰🇪 Nairobi</option>
                <option value="Africa/Kampala">🇺🇬 Kampala</option>
                <option value="Europe/London">🇬🇧 London</option>
                <option value="America/New_York">🇺🇸 New York</option>
                <option value="Asia/Dubai">🇦🇪 Dubai</option>
              </select>
            </div>

            <div>
              <label className="label">Language</label>
              <select value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })} className="select">
                <option value="en">🇬🇧 English</option>
                <option value="sw">🇹🇿 Swahili</option>
                <option value="fr">🇫🇷 French</option>
                <option value="es">🇪🇸 Spanish</option>
              </select>
            </div>
          </div>

          <button
            onClick={() => updateMut.mutate()}
            disabled={updateMut.isLoading}
            className={`btn btn-primary ${updateMut.isLoading ? 'btn-disabled' : ''}`}
          >
            <Save size={16} /> {updateMut.isLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* ── Quick Links ────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { icon: Globe,      label: 'Social Accounts', desc: 'Connect platforms',   to: '/settings/social-accounts', iconBg: 'bg-blue-500/10',    iconColor: 'text-blue-400' },
          { icon: CreditCard, label: 'Billing & Plans',  desc: 'Manage subscription', to: '/settings/billing',         iconBg: 'bg-emerald-500/10', iconColor: 'text-emerald-400' },
          { icon: Bell,       label: 'Notifications',    desc: 'Email preferences',   to: '/settings/notifications',   iconBg: 'bg-amber-500/10',   iconColor: 'text-amber-400' },
          { icon: Lock,       label: 'Security',         desc: 'Password & 2FA',      to: '/settings/security',        iconBg: 'bg-red-500/10',     iconColor: 'text-red-400' }
        ].map(item => {
          const Icon = item.icon;
          return (
            <Link key={item.to} to={item.to} className="stat-card group flex items-center gap-4 hover:border-dark-border-light">
              <div className={`w-11 h-11 ${item.iconBg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                <Icon size={20} className={item.iconColor} />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-white">{item.label}</p>
                <p className="text-xs text-gray-500">{item.desc}</p>
              </div>
              <ArrowRight size={16} className="text-gray-600 group-hover:text-accent-primary group-hover:translate-x-1 transition-all" />
            </Link>
          );
        })}
      </div>

      {/* ── Plan Info ──────────────────── */}
      <div className="card bg-gradient-to-r from-accent-primary/5 to-accent-secondary/5 border-accent-primary/20">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Zap size={18} className="text-accent-primary" />
              <h3 className="font-bold text-white">Current Plan</h3>
            </div>
            <p className="text-2xl font-black text-white capitalize mb-1">{user?.plan || 'Free'}</p>
            <p className="text-sm text-gray-400">
              {credits} AI credits remaining
            </p>
            {/* Credits bar */}
            <div className="mt-2 w-48 h-1.5 bg-dark-base rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-accent-primary to-emerald-500 rounded-full"
                style={{ width: `${user?.ai_credits ? Math.min(100, (credits / user.ai_credits) * 100) : 0}%` }}
              />
            </div>
          </div>
          <Link to="/settings/billing" className="btn btn-primary">
            <Zap size={14} /> Upgrade
          </Link>
        </div>
      </div>

      {/* ── Danger Zone ────────────────── */}
      <div className="card border-red-500/20">
        <h3 className="font-bold text-white mb-4 flex items-center gap-2">
          <Shield size={18} className="text-red-400" />
          Danger Zone
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-xl bg-dark-surface border border-dark-border">
            <div>
              <p className="font-semibold text-sm text-white">Sign Out</p>
              <p className="text-xs text-gray-500">Sign out of your account</p>
            </div>
            <button onClick={logout} className="btn btn-secondary btn-sm">
              <LogOut size={14} /> Sign Out
            </button>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-red-500/5 border border-red-500/20">
            <div>
              <p className="font-semibold text-sm text-red-400">Delete Account</p>
              <p className="text-xs text-red-500/70">Permanently delete your account and all data</p>
            </div>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="btn btn-danger btn-sm"
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* ── Delete Account Confirmation Modal ── */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-dark-card border border-red-500/30 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={20} className="text-red-400" />
              </div>
              <div>
                <h3 className="font-bold text-white">Delete Account?</h3>
                <p className="text-xs text-gray-500">This cannot be undone</p>
              </div>
            </div>
            <p className="text-sm text-gray-400 mb-4">
              All your data — posts, campaigns, analytics, connected accounts — will be permanently deleted.
            </p>
            <p className="text-sm text-gray-400 mb-2">
              Type <span className="font-mono text-red-400">DELETE</span> to confirm:
            </p>
            <input
              value={deleteText}
              onChange={e => setDeleteText(e.target.value)}
              placeholder="DELETE"
              className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white text-sm mb-4 font-mono"
            />
            <div className="flex gap-2">
              <button
                onClick={() => { setShowDeleteConfirm(false); setDeleteText(''); }}
                className="flex-1 py-2 bg-dark-bg border border-dark-border text-gray-400 rounded-xl text-sm hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteMut.mutate()}
                disabled={deleteText !== 'DELETE' || deleteMut.isLoading}
                className="flex-1 py-2 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {deleteMut.isLoading ? 'Deleting…' : 'Delete Forever'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
