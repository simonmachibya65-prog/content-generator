import { useState } from 'react';
import { useMutation, useQuery } from 'react-query';
import { useAuthStore } from '../store/authStore';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { Shield, Lock, Key, Smartphone, AlertTriangle, CheckCircle2, Copy, Eye, EyeOff } from 'lucide-react';
import { format } from 'date-fns';

export default function Security() {
  const { user } = useAuthStore();
  const [showPassword, setShowPassword] = useState({});
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  const { data: sessionsData } = useQuery('sessions', async () => {
    const { data } = await api.get('/users/sessions');
    return data;
  });

  const changePasswordMut = useMutation(
    () => api.put('/users/password', passwordForm),
    {
      onSuccess: () => {
        toast.success('Password changed successfully');
        setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
      },
      onError: (err) => toast.error(err.response?.data?.error || 'Failed to change password')
    }
  );

  const enable2FAMut = useMutation(
    () => api.post('/users/2fa/enable'),
    {
      onSuccess: () => {
        toast.success('Two-factor authentication enabled');
        setTwoFactorEnabled(true);
      },
      onError: () => toast.error('Failed to enable 2FA')
    }
  );

  const revokeSessionMut = useMutation(
    (sessionId) => api.delete(`/users/sessions/${sessionId}`),
    {
      onSuccess: () => toast.success('Session revoked')
    }
  );

  const sessions = sessionsData?.sessions || [];

  const handlePasswordChange = (e) => {
    e.preventDefault();
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      return toast.error('Passwords do not match');
    }
    if (passwordForm.new_password.length < 8) {
      return toast.error('Password must be at least 8 characters');
    }
    changePasswordMut.mutate();
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">

      {/* ── Header ─────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold text-white">Security</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your password, 2FA and active sessions</p>
      </div>

      {/* ── Change Password ────────────── */}
      <div className="card">
        <div className="flex items-center gap-2 pb-4 border-b border-dark-border mb-4">
          <Lock size={18} className="text-accent-primary" />
          <h3 className="font-bold text-white">Change Password</h3>
        </div>

        <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
          <div>
            <label className="label">Current password</label>
            <div className="relative">
              <input
                type={showPassword.current ? 'text' : 'password'}
                value={passwordForm.current_password}
                onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                className="input pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword({ ...showPassword, current: !showPassword.current })}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
              >
                {showPassword.current ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label className="label">New password</label>
            <div className="relative">
              <input
                type={showPassword.new ? 'text' : 'password'}
                value={passwordForm.new_password}
                onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                className="input pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword({ ...showPassword, new: !showPassword.new })}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
              >
                {showPassword.new ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">Minimum 8 characters</p>
          </div>

          <div>
            <label className="label">Confirm new password</label>
            <input
              type="password"
              value={passwordForm.confirm_password}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
              className="input"
              required
            />
          </div>

          <button
            type="submit"
            disabled={changePasswordMut.isLoading}
            className={`btn btn-primary ${changePasswordMut.isLoading ? 'btn-disabled' : ''}`}
          >
            {changePasswordMut.isLoading ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      </div>

      {/* ── Two-Factor Auth ────────────── */}
      <div className="card">
        <div className="flex items-center gap-2 pb-4 border-b border-dark-border mb-4">
          <Smartphone size={18} className="text-accent-primary" />
          <h3 className="font-bold text-white">Two-Factor Authentication</h3>
        </div>

        <div className="flex items-start gap-4">
          <div className="flex-1">
            <p className="text-sm text-gray-300 mb-2">
              Add an extra layer of security to your account by requiring a verification code when signing in.
            </p>
            <p className="text-xs text-gray-500">
              Use an authenticator app like Google Authenticator or Authy to generate codes.
            </p>
          </div>

          {twoFactorEnabled ? (
            <div className="flex items-center gap-2 text-emerald-400">
              <CheckCircle2 size={18} />
              <span className="text-sm font-semibold">Enabled</span>
            </div>
          ) : (
            <button
              onClick={() => enable2FAMut.mutate()}
              disabled={enable2FAMut.isLoading}
              className={`btn btn-primary ${enable2FAMut.isLoading ? 'btn-disabled' : ''}`}
            >
              Enable 2FA
            </button>
          )}
        </div>
      </div>

      {/* ── API Keys ───────────────────── */}
      <div className="card">
        <div className="flex items-center gap-2 pb-4 border-b border-dark-border mb-4">
          <Key size={18} className="text-accent-primary" />
          <h3 className="font-bold text-white">API Keys</h3>
        </div>

        <p className="text-sm text-gray-400 mb-4">
          Use API keys to integrate Cotents with your applications and scripts.
        </p>

        <div className="flex items-center gap-3 p-4 rounded-xl bg-dark-surface border border-dark-border">
          <div className="flex-1 font-mono text-sm text-white">
            {showApiKey ? 'cotents_sk_1234567890abcdef' : '••••••••••••••••••••••••'}
          </div>
          <button
            onClick={() => setShowApiKey(!showApiKey)}
            className="p-2 text-gray-500 hover:text-white hover:bg-dark-hover rounded-lg transition-colors"
          >
            {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
          <button className="p-2 text-gray-500 hover:text-accent-primary hover:bg-accent-primary/10 rounded-lg transition-colors">
            <Copy size={16} />
          </button>
        </div>

        <button className="btn btn-secondary mt-4">
          Generate New Key
        </button>
      </div>

      {/* ── Active Sessions ────────────── */}
      <div className="card">
        <div className="flex items-center gap-2 pb-4 border-b border-dark-border mb-4">
          <Shield size={18} className="text-accent-primary" />
          <h3 className="font-bold text-white">Active Sessions</h3>
        </div>

        <p className="text-sm text-gray-400 mb-4">
          Manage devices and browsers where you're currently logged in.
        </p>

        <div className="space-y-3">
          {sessions.length > 0 ? (
            sessions.map(session => (
              <div
                key={session.id}
                className="flex items-center gap-4 p-4 rounded-xl bg-dark-surface border border-dark-border"
              >
                <div className="w-10 h-10 bg-accent-primary/10 rounded-xl flex items-center justify-center">
                  <Smartphone size={18} className="text-accent-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-white text-sm">{session.device || 'Unknown Device'}</p>
                  <p className="text-xs text-gray-500">
                    {session.location || 'Unknown location'} • Last active {format(new Date(session.last_active), 'MMM d, h:mm a')}
                  </p>
                </div>
                {session.is_current ? (
                  <span className="badge badge-success">Current</span>
                ) : (
                  <button
                    onClick={() => revokeSessionMut.mutate(session.id)}
                    className="btn btn-danger btn-sm"
                  >
                    Revoke
                  </button>
                )}
              </div>
            ))
          ) : (
            <p className="text-center text-sm text-gray-500 py-8">No other active sessions</p>
          )}
        </div>
      </div>

      {/* ── Danger Zone ────────────────── */}
      <div className="card border-red-500/20">
        <div className="flex items-center gap-2 pb-4 border-b border-dark-border mb-4">
          <AlertTriangle size={18} className="text-red-400" />
          <h3 className="font-bold text-white">Danger Zone</h3>
        </div>

        <div className="flex items-start justify-between p-4 rounded-xl bg-red-500/5 border border-red-500/20">
          <div>
            <p className="font-semibold text-sm text-red-400">Delete Account</p>
            <p className="text-xs text-red-500/70 mt-1">
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>
          </div>
          <button className="btn btn-danger btn-sm">Delete</button>
        </div>
      </div>
    </div>
  );
}
