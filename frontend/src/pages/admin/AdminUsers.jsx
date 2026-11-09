import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { Search, Filter, Ban, Eye, RefreshCw, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

const PLAN_COLORS = {
  free: 'badge-gray', starter: 'badge-primary', creator_pro: 'badge-success',
  business: 'badge-warning', agency: 'bg-amber-500/20 text-amber-400'
};

export default function AdminUsers() {
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('all');
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery(['adminUsers', search, planFilter, page], async () => {
    const params = new URLSearchParams({ page, limit: 20 });
    if (search) params.set('search', search);
    if (planFilter !== 'all') params.set('plan', planFilter);
    const { data } = await api.get(`/admin/users?${params}`);
    return data;
  }, { keepPreviousData: true });

  const suspendMut = useMutation(
    (userId) => api.post(`/admin/users/${userId}/suspend`),
    {
      onSuccess: () => { toast.success('User suspended'); queryClient.invalidateQueries('adminUsers'); },
      onError: () => toast.error('Failed to suspend user')
    }
  );

  const impersonateMut = useMutation(
    (userId) => api.post(`/admin/users/${userId}/impersonate`),
    {
      onSuccess: ({ data }) => {
        localStorage.setItem('admin_token_backup', localStorage.getItem('auth-storage'));
        toast.success('Impersonating user. Refresh to see their view.');
      }
    }
  );

  const users = data?.users || [];
  const pagination = data?.pagination || {};

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">User Management</h1>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>{pagination.total || 0} total users</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name, email..." className="input pl-10 w-full" />
        </div>
        <div className="flex gap-2">
          {['all', 'free', 'starter', 'creator_pro', 'business', 'agency'].map(plan => (
            <button key={plan}
              onClick={() => { setPlanFilter(plan); setPage(1); }}
              className={`px-3 py-2 rounded-xl border-2 text-xs font-semibold capitalize transition-all
                ${planFilter === plan ? 'border-accent-primary bg-accent-primary/10 text-accent-primary' : 'border-dark-border text-gray-400'}`}>
              {plan === 'creator_pro' ? 'Pro' : plan}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="card flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin text-accent-primary" />
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-dark-border">
                <th className="text-left py-3 px-3 font-semibold text-gray-500">User</th>
                <th className="text-left py-3 px-3 font-semibold text-gray-500">Plan</th>
                <th className="text-left py-3 px-3 font-semibold text-gray-500">AI Credits</th>
                <th className="text-left py-3 px-3 font-semibold text-gray-500">Joined</th>
                <th className="text-left py-3 px-3 font-semibold text-gray-500">Last Login</th>
                <th className="text-right py-3 px-3 font-semibold text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} className="border-b border-dark-border hover:bg-dark-hover transition-colors">
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-3">
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt="" className="w-8 h-8 rounded-lg object-cover" />
                      ) : (
                        <div className="w-8 h-8 bg-gradient-to-br from-accent-primary to-emerald-500 rounded-lg flex items-center justify-center text-dark-base text-sm font-bold">
                          {user.full_name?.[0]?.toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-white">{user.full_name}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <span className={`badge ${PLAN_COLORS[user.plan] || 'badge-gray'} capitalize`}>
                      {user.plan}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-gray-400">
                    {user.ai_credits_used || 0} / {user.ai_credits || 10}
                  </td>
                  <td className="py-3 px-3 text-gray-500 text-xs">
                    {user.created_at ? format(new Date(user.created_at), 'MMM d, yyyy') : '—'}
                  </td>
                  <td className="py-3 px-3 text-gray-500 text-xs">
                    {user.last_login_at ? format(new Date(user.last_login_at), 'MMM d, h:mm a') : 'Never'}
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => impersonateMut.mutate(user.id)}
                        className="p-1.5 text-gray-500 hover:text-accent-primary hover:bg-accent-primary/10 rounded-lg transition-colors"
                        title="Impersonate"
                      >
                        <Eye size={15} />
                      </button>
                      <button
                        onClick={() => suspendMut.mutate(user.id)}
                        disabled={!user.is_active}
                        className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Suspend"
                      >
                        <Ban size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {pagination.total > 20 && (
            <div className="flex items-center justify-between pt-4 border-t border-dark-border">
              <p className="text-xs text-gray-500">
                Page {page} of {Math.ceil(pagination.total / 20)}
              </p>
              <div className="flex gap-2">
                <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="btn btn-secondary btn-sm">
                  <ChevronLeft size={14} />
                </button>
                <button disabled={page >= Math.ceil(pagination.total / 20)} onClick={() => setPage(p => p + 1)} className="btn btn-secondary btn-sm">
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
