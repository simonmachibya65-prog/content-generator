import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../lib/api';
import toast from 'react-hot-toast';
import {
  Trash2, RefreshCw, CheckCircle2, Clock, AlertCircle, Link2,
  Plus, Search, Sparkles, Loader2, ShieldAlert, ShieldCheck, Wifi, WifiOff
} from 'lucide-react';

const PLATFORMS = [
  { id: 'tiktok',    name: 'TikTok',    icon: '🎵', bg: 'bg-black',          desc: 'Videos and photo posts' },
  { id: 'youtube',   name: 'YouTube',   icon: '▶️', bg: 'bg-red-600',        desc: 'Videos and Shorts' },
  { id: 'x',         name: 'X',         icon: '𝕏',  bg: 'bg-zinc-900',        desc: 'Text, images and videos' },
  { id: 'instagram', name: 'Instagram', icon: '📸', bg: 'bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400', desc: 'Posts, Reels and Stories' },
  { id: 'facebook',  name: 'Facebook',  icon: '📘', bg: 'bg-blue-600',       desc: 'Pages and promotional posts' },
  { id: 'linkedin',  name: 'LinkedIn',  icon: '💼', bg: 'bg-blue-700',       desc: 'Professional content' }
];

function TokenHealthBadge({ health }) {
  if (health === 'expired') return (
    <span className="badge badge-danger flex items-center gap-1">
      <WifiOff size={10} /> Token Expired
    </span>
  );
  if (health === 'expiring_soon') return (
    <span className="badge badge-warning flex items-center gap-1">
      <ShieldAlert size={10} /> Expiring Soon
    </span>
  );
  return (
    <span className="badge badge-success flex items-center gap-1">
      <ShieldCheck size={10} /> Active
    </span>
  );
}

export default function SocialAccounts() {
  const [accountUrl, setAccountUrl] = useState('');
  const [detecting, setDetecting] = useState(false);
  const [connecting, setConnecting] = useState(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery('socialAccounts', async () => {
    const { data } = await api.get('/social-accounts');
    return data;
  });

  // Account health (token expiry status)
  const { data: healthData } = useQuery('accountHealth', async () => {
    const { data } = await api.get('/publishing/account-health');
    return data;
  }, { refetchInterval: 5 * 60 * 1000 }); // refresh every 5 min

  const connected = data?.accounts || [];
  const healthByAccountId = {};
  (healthData?.accounts || []).forEach(a => { healthByAccountId[a.id] = a.token_health; });

  const connectedByPlatform = {};
  connected.forEach(acc => {
    if (!connectedByPlatform[acc.platform_name]) connectedByPlatform[acc.platform_name] = [];
    connectedByPlatform[acc.platform_name].push(acc);
  });

  const handleDetect = async () => {
    if (!accountUrl.trim()) return toast.error('Please paste your profile URL');
    setDetecting(true);
    try {
      const { data } = await api.post('/oauth/detect', { url: accountUrl });
      toast.success(`Detected ${data.platform}! Redirecting to authorization...`);
      handleConnect(data.platform);
    } catch {
      toast.error('Could not detect platform. Try connecting manually below.');
    } finally {
      setDetecting(false);
    }
  };

  const handleConnect = async (platform) => {
    setConnecting(platform);
    try {
      const { data } = await api.get(`/oauth/${platform}/authorize`);
      // Redirect to platform OAuth page
      window.location.href = data.authUrl;
    } catch {
      toast.error(`Failed to connect to ${platform}. Check your API credentials.`);
      setConnecting(null);
    }
  };

  const disconnectMut = useMutation(
    ({ platform, id }) => api.delete(`/oauth/${platform}/disconnect/${id}`),
    {
      onSuccess: () => {
        toast.success('Account disconnected');
        queryClient.invalidateQueries('socialAccounts');
        queryClient.invalidateQueries('accountHealth');
      },
      onError: () => toast.error('Failed to disconnect')
    }
  );

  const statusBadge = (acc) => {
    const health = healthByAccountId[acc.id];
    if (health) return <TokenHealthBadge health={health} />;
    if (acc.status === 'connected') return <span className="badge badge-success"><CheckCircle2 size={11} /> Connected</span>;
    if (acc.status === 'expired')   return <span className="badge badge-warning"><Clock size={11} /> Expired</span>;
    if (acc.status === 'error')     return <span className="badge badge-danger"><AlertCircle size={11} /> Error</span>;
    return <span className="badge badge-gray">{acc.status}</span>;
  };

  // Count expiring / expired accounts for the warning banner
  const healthIssues = (healthData?.accounts || []).filter(
    a => a.token_health === 'expired' || a.token_health === 'expiring_soon'
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Social Accounts</h1>
        <p className="text-sm text-gray-500 mt-1">Connect and manage your social media accounts</p>
      </div>

      {/* Health warning banner */}
      {healthIssues.length > 0 && (
        <div className="card bg-amber-500/10 border-amber-500/30">
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-amber-400 text-sm">
                {healthIssues.length} account{healthIssues.length > 1 ? 's' : ''} need attention
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {healthIssues.map(a => (
                  <button
                    key={a.id}
                    onClick={() => handleConnect(a.platform_name)}
                    className="text-xs flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 rounded-lg text-amber-300 transition-colors"
                  >
                    <RefreshCw size={11} />
                    Reconnect {a.display_name || a.username} ({a.platform_name})
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Connect */}
      <div className="card relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-accent-primary/10 to-accent-secondary/10 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/4" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={18} className="text-accent-primary" />
            <h2 className="text-lg font-bold text-white">Quick Connect</h2>
          </div>
          <p className="text-sm text-gray-500 mb-4">Paste your profile URL and we'll detect the platform automatically</p>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Link2 size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="url"
                value={accountUrl}
                onChange={(e) => setAccountUrl(e.target.value)}
                placeholder="https://www.tiktok.com/@yourname"
                className="input pl-11"
                onKeyPress={(e) => e.key === 'Enter' && handleDetect()}
              />
            </div>
            <button
              onClick={handleDetect}
              disabled={detecting}
              className={`btn btn-primary px-6 ${detecting ? 'btn-disabled' : ''}`}
            >
              {detecting ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
              {detecting ? 'Detecting...' : 'Detect & Connect'}
            </button>
          </div>

          <div className="flex flex-wrap gap-2 mt-3">
            {['tiktok.com/@user', 'youtube.com/@user', 'x.com/user', 'instagram.com/user', 'linkedin.com/in/user', 'facebook.com/pagename'].map(ex => (
              <button
                key={ex}
                onClick={() => setAccountUrl(`https://www.${ex}`)}
                className="text-xs text-gray-500 hover:text-accent-primary bg-dark-surface hover:bg-accent-primary/10 px-2.5 py-1 rounded-lg transition-colors border border-dark-border"
              >
                {ex}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats bar */}
      {connected.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="stat-card text-center">
            <p className="text-2xl font-bold text-white">{connected.length}</p>
            <p className="text-xs text-gray-500">Connected</p>
          </div>
          <div className="stat-card text-center">
            <p className="text-2xl font-bold text-emerald-400">
              {(healthData?.accounts || []).filter(a => a.token_health === 'ok').length}
            </p>
            <p className="text-xs text-gray-500">Healthy</p>
          </div>
          <div className="stat-card text-center">
            <p className="text-2xl font-bold text-amber-400">{healthIssues.length}</p>
            <p className="text-xs text-gray-500">Need Attention</p>
          </div>
        </div>
      )}

      {/* Platform Cards */}
      <div>
        <h2 className="text-lg font-bold text-white mb-4">All Platforms</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PLATFORMS.map((p, i) => {
            const accounts = connectedByPlatform[p.id] || [];
            return (
              <div key={p.id} className={`card animate-fade-in-up stagger-${Math.min(i+1, 4)}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 ${p.bg} rounded-xl flex items-center justify-center text-xl shadow-sm`}>
                      {p.icon}
                    </div>
                    <div>
                      <h3 className="font-bold text-white">{p.name}</h3>
                      <p className="text-xs text-gray-500">{p.desc}</p>
                    </div>
                  </div>
                  {accounts.length === 0 ? (
                    <button
                      onClick={() => handleConnect(p.id)}
                      disabled={connecting === p.id}
                      className={`btn btn-primary btn-sm ${connecting === p.id ? 'btn-disabled' : ''}`}
                    >
                      {connecting === p.id ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                      {connecting === p.id ? 'Redirecting...' : 'Connect'}
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="badge badge-success">
                        <CheckCircle2 size={11} /> {accounts.length} active
                      </span>
                      <button
                        onClick={() => handleConnect(p.id)}
                        className="p-1.5 text-gray-500 hover:text-accent-primary hover:bg-accent-primary/10 rounded-lg transition-colors"
                        title="Add another account"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  )}
                </div>

                {accounts.length > 0 && (
                  <div className="space-y-2 pt-3 border-t border-dark-border">
                    {accounts.map(acc => {
                      const health = healthByAccountId[acc.id];
                      const needsReconnect = health === 'expired' || acc.status === 'expired';
                      return (
                        <div
                          key={acc.id}
                          className={`flex items-center gap-3 p-2.5 rounded-xl transition-colors group ${
                            needsReconnect ? 'bg-amber-500/5 border border-amber-500/20' : 'hover:bg-dark-hover'
                          }`}
                        >
                          {acc.avatar_url ? (
                            <img src={acc.avatar_url} alt="" className="w-9 h-9 rounded-xl object-cover" />
                          ) : (
                            <div className={`w-9 h-9 ${p.bg} rounded-xl flex items-center justify-center text-base`}>
                              {p.icon}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white truncate">
                              {acc.display_name || acc.username}
                            </p>
                            <div className="flex items-center gap-2">
                              <p className="text-xs text-gray-500">{acc.username}</p>
                              {acc.followers_count > 0 && (
                                <span className="text-xs text-gray-500">· {acc.followers_count.toLocaleString()}</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {statusBadge(acc)}
                            {needsReconnect && (
                              <button
                                onClick={() => handleConnect(p.id)}
                                className="p-1.5 text-amber-400 hover:bg-amber-500/10 rounded-lg"
                                title="Reconnect"
                              >
                                <RefreshCw size={14} />
                              </button>
                            )}
                            <button
                              onClick={() => disconnectMut.mutate({ platform: p.id, id: acc.id })}
                              className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                              title="Disconnect"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* How it works */}
      <div className="card bg-gradient-to-r from-accent-primary/5 to-accent-secondary/5 border-accent-primary/20">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-accent-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <Sparkles size={18} className="text-accent-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-sm">How it works</h3>
            <p className="text-sm text-gray-400 mt-1">
              Click <strong className="text-white">Connect</strong> on any platform — you'll be redirected to that platform's 
              secure authorization page. After you approve access, your account connects instantly. 
              We never see your password. Tokens are encrypted and auto-refreshed so publishing never breaks.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
