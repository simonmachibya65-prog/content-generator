import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../lib/api';
import toast from 'react-hot-toast';
import {
  Users, UserPlus, Trash2, Mail, Shield, Eye, Edit,
  Loader2, ChevronDown, RefreshCw, Clock, CheckCircle2
} from 'lucide-react';

const ROLES = [
  { id: 'admin',  label: 'Admin',  icon: Shield, desc: 'Full access',      color: 'text-red-400',     bg: 'bg-red-500/10' },
  { id: 'editor', label: 'Editor', icon: Edit,   desc: 'Create & publish', color: 'text-indigo-400',  bg: 'bg-indigo-500/10' },
  { id: 'viewer', label: 'Viewer', icon: Eye,    desc: 'View only',        color: 'text-gray-400',    bg: 'bg-gray-500/10' }
];

export default function Team() {
  const [showInvite, setShowInvite]   = useState(false);
  const [email, setEmail]             = useState('');
  const [role, setRole]               = useState('editor');
  const [editingMember, setEditing]   = useState(null); // { id, role }
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery('team', async () => {
    const { data } = await api.get('/team');
    return data;
  });

  const inviteMut = useMutation(
    () => api.post('/team/invite', { email, role }),
    {
      onSuccess: () => {
        toast.success('Invitation sent!');
        setEmail(''); setRole('editor'); setShowInvite(false);
        queryClient.invalidateQueries('team');
      },
      onError: (err) => toast.error(err.response?.data?.error || 'Failed to invite')
    }
  );

  const removeMut = useMutation(
    (id) => api.delete(`/team/${id}`),
    {
      onSuccess: () => { toast.success('Member removed'); queryClient.invalidateQueries('team'); },
      onError:   () => toast.error('Failed to remove member')
    }
  );

  const updateRoleMut = useMutation(
    ({ id, newRole }) => api.put(`/team/${id}`, { role: newRole }),
    {
      onSuccess: () => {
        toast.success('Role updated');
        setEditing(null);
        queryClient.invalidateQueries('team');
      },
      onError: () => toast.error('Failed to update role')
    }
  );

  const resendMut = useMutation(
    (id) => api.post(`/team/${id}/resend`),
    {
      onSuccess: () => toast.success('Invitation resent'),
      onError:   () => toast.error('Failed to resend')
    }
  );

  const team    = data?.team || [];
  const active  = team.filter(m => m.status === 'active');
  const pending = team.filter(m => m.status === 'pending');

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Team</h1>
          <p className="text-sm text-gray-500 mt-1">
            {active.length} active · {pending.length} pending
          </p>
        </div>
        <button onClick={() => setShowInvite(!showInvite)} className="btn btn-primary">
          <UserPlus size={16} /> Invite Member
        </button>
      </div>

      {/* Invite Form */}
      {showInvite && (
        <div className="card animate-fade-in border-accent-primary/30">
          <h3 className="font-bold text-white mb-4">Invite Team Member</h3>
          <div className="space-y-4">
            <div>
              <label className="label">Email address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="colleague@example.com"
                className="input"
              />
            </div>
            <div>
              <label className="label">Role</label>
              <div className="grid grid-cols-3 gap-3">
                {ROLES.map(r => {
                  const Icon = r.icon;
                  return (
                    <button
                      key={r.id}
                      onClick={() => setRole(r.id)}
                      className={`p-4 rounded-xl border-2 text-center transition-all ${
                        role === r.id
                          ? 'border-accent-primary bg-accent-primary/10'
                          : 'border-dark-border hover:border-gray-600 bg-dark-surface'
                      }`}
                    >
                      <Icon size={20} className={`mx-auto mb-2 ${role === r.id ? 'text-accent-primary' : 'text-gray-500'}`} />
                      <p className="font-semibold text-sm text-white">{r.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{r.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => inviteMut.mutate()}
                disabled={!email || inviteMut.isLoading}
                className="btn btn-primary flex-1 disabled:opacity-50"
              >
                {inviteMut.isLoading ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
                Send Invitation
              </button>
              <button onClick={() => setShowInvite(false)} className="btn btn-secondary">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="card flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin text-accent-primary" />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && team.length === 0 && (
        <div className="card text-center py-12">
          <div className="w-16 h-16 bg-dark-surface border border-dark-border rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Users size={28} className="text-gray-700" />
          </div>
          <h3 className="font-bold text-white mb-1">No team members yet</h3>
          <p className="text-sm text-gray-500 mb-4">Invite colleagues to collaborate</p>
          <button onClick={() => setShowInvite(true)} className="btn btn-primary">
            <UserPlus size={16} /> Invite First Member
          </button>
        </div>
      )}

      {/* Active members */}
      {active.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-white text-sm mb-4 flex items-center gap-2">
            <CheckCircle2 size={15} className="text-green-400" />
            Active Members ({active.length})
          </h3>
          <div className="divide-y divide-dark-border">
            {active.map(member => {
              const roleConfig = ROLES.find(r => r.id === member.role) || ROLES[1];
              const RoleIcon = roleConfig.icon;
              const isEditing = editingMember?.id === member.id;

              return (
                <div key={member.id} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
                  {/* Avatar */}
                  {member.avatar_url ? (
                    <img src={member.avatar_url} alt="" className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-10 h-10 bg-gradient-to-br from-accent-primary to-emerald-500 rounded-xl flex items-center justify-center text-dark-base font-bold text-sm flex-shrink-0">
                      {member.full_name?.[0]?.toUpperCase() || '?'}
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white text-sm">{member.full_name}</p>
                    <p className="text-xs text-gray-500">{member.email}</p>
                  </div>

                  {/* Role — inline editor */}
                  {isEditing ? (
                    <div className="flex items-center gap-1">
                      <select
                        value={editingMember.role}
                        onChange={e => setEditing({ ...editingMember, role: e.target.value })}
                        className="text-xs bg-dark-bg border border-dark-border rounded-lg px-2 py-1 text-white"
                      >
                        {ROLES.map(r => (
                          <option key={r.id} value={r.id}>{r.label}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => updateRoleMut.mutate({ id: member.id, newRole: editingMember.role })}
                        disabled={updateRoleMut.isLoading}
                        className="text-xs px-2 py-1 bg-accent-primary text-white rounded-lg"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditing(null)}
                        className="text-xs px-2 py-1 bg-dark-bg border border-dark-border text-gray-400 rounded-lg"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setEditing({ id: member.id, role: member.role })}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors hover:border-accent-primary/50 ${roleConfig.bg} ${roleConfig.color} border-transparent`}
                      title="Click to change role"
                    >
                      <RoleIcon size={12} />
                      {member.role}
                      <ChevronDown size={10} />
                    </button>
                  )}

                  {/* Remove */}
                  <button
                    onClick={() => removeMut.mutate(member.id)}
                    disabled={removeMut.isLoading}
                    className="p-1.5 text-gray-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors flex-shrink-0"
                    title="Remove member"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Pending invitations */}
      {pending.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-white text-sm mb-4 flex items-center gap-2">
            <Clock size={15} className="text-yellow-400" />
            Pending Invitations ({pending.length})
          </h3>
          <div className="divide-y divide-dark-border">
            {pending.map(member => (
              <div key={member.id} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                <div className="w-10 h-10 bg-yellow-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Mail size={16} className="text-yellow-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white">{member.email}</p>
                  <p className="text-xs text-gray-500 capitalize">Invited as {member.role}</p>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                  Pending
                </span>
                <button
                  onClick={() => resendMut.mutate(member.id)}
                  disabled={resendMut.isLoading}
                  className="flex items-center gap-1 text-xs text-accent-primary hover:underline flex-shrink-0"
                  title="Resend invitation"
                >
                  <RefreshCw size={12} /> Resend
                </button>
                <button
                  onClick={() => removeMut.mutate(member.id)}
                  className="p-1.5 text-gray-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors flex-shrink-0"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Permissions info */}
      <div className="card bg-dark-surface border-dark-border">
        <h3 className="font-semibold text-white text-sm mb-3">Role Permissions</h3>
        <div className="grid grid-cols-3 gap-3 text-xs text-gray-400">
          {[
            { role: 'Admin',  color: 'text-red-400',    perms: ['Manage team', 'Manage billing', 'All content', 'All settings'] },
            { role: 'Editor', color: 'text-indigo-400', perms: ['Create content', 'Schedule posts', 'View analytics', 'Manage media'] },
            { role: 'Viewer', color: 'text-gray-400',   perms: ['View content', 'View analytics', 'View calendar'] },
          ].map(r => (
            <div key={r.role} className="p-3 bg-dark-bg rounded-xl border border-dark-border">
              <p className={`font-semibold mb-2 ${r.color}`}>{r.role}</p>
              <ul className="space-y-1">
                {r.perms.map(p => (
                  <li key={p} className="flex items-center gap-1">
                    <span className="text-accent-primary">✓</span> {p}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
