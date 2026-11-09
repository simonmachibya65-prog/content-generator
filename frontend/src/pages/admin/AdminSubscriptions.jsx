import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { CreditCard, Search, ChevronDown, Loader2, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

const PLAN_COLORS = {
  free:        'bg-gray-500/10 text-gray-400 border-gray-500/20',
  starter:     'bg-blue-500/10 text-blue-400 border-blue-500/20',
  creator_pro: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  business:    'bg-violet-500/10 text-violet-400 border-violet-500/20',
  agency:      'bg-amber-500/10 text-amber-400 border-amber-500/20',
};

const STATUS_COLORS = {
  active:     'text-green-400 bg-green-400/10 border-green-400/20',
  cancelled:  'text-red-400 bg-red-400/10 border-red-400/20',
  past_due:   'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  trialing:   'text-blue-400 bg-blue-400/10 border-blue-400/20',
};

export default function AdminSubscriptions() {
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('all');
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery(
    ['adminSubscriptions', search, planFilter, page],
    () => api.get(`/admin/subscriptions?search=${search}&plan=${planFilter}&page=${page}&limit=20`)
              .then(r => r.data),
    { keepPreviousData: true }
  );

  const changePlanMut = useMutation(
    ({ userId, plan }) => api.put(`/admin/users/${userId}/plan`, { plan }),
    {
      onSuccess: () => { toast.success('Plan updated'); queryClient.invalidateQueries('adminSubscriptions'); },
      onError:   () => toast.error('Failed to update plan')
    }
  );

  const subs = data?.subscriptions || [];
  const total = data?.total || 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Subscriptions</h1>
        <p className="text-sm text-gray-500 mt-1">Manage customer subscriptions and plans</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Subscribers', value: data?.stats?.total || 0, color: 'text-white' },
          { label: 'Active',            value: data?.stats?.active || 0, color: 'text-green-400' },
          { label: 'Cancelled',         value: data?.stats?.cancelled || 0, color: 'text-red-400' },
          { label: 'MRR',               value: `$${data?.stats?.mrr || 0}`, color: 'text-accent-primary' },
        ].map(s => (
          <div key={s.label} className="bg-dark-card border border-dark-border rounded-xl p-4">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by email or name…"
            className="w-full pl-9 pr-4 py-2 bg-dark-card border border-dark-border rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-accent-primary"
          />
        </div>
        <select
          value={planFilter}
          onChange={e => { setPlanFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 bg-dark-card border border-dark-border rounded-xl text-sm text-white focus:outline-none"
        >
          <option value="all">All plans</option>
          <option value="free">Free</option>
          <option value="starter">Starter</option>
          <option value="creator_pro">Creator Pro</option>
          <option value="business">Business</option>
          <option value="agency">Agency</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={24} className="animate-spin text-accent-primary" />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-dark-bg/50">
              <tr>
                {['User', 'Plan', 'Status', 'Started', 'Renews', 'Amount', 'Actions'].map(h => (
                  <th key={h} className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-border">
              {subs.map(sub => (
                <tr key={sub.id} className="hover:bg-dark-hover transition-colors">
                  <td className="py-3 px-4">
                    <p className="text-white font-medium">{sub.full_name || '—'}</p>
                    <p className="text-xs text-gray-500">{sub.email}</p>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-xs px-2 py-0.5 rounded-full border capitalize ${PLAN_COLORS[sub.plan] || PLAN_COLORS.free}`}>
                      {sub.plan}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_COLORS[sub.status] || STATUS_COLORS.active}`}>
                      {sub.status || 'active'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-400 text-xs">
                    {sub.current_period_start ? format(new Date(sub.current_period_start), 'MMM d, yyyy') : '—'}
                  </td>
                  <td className="py-3 px-4 text-gray-400 text-xs">
                    {sub.current_period_end ? format(new Date(sub.current_period_end), 'MMM d, yyyy') : '—'}
                  </td>
                  <td className="py-3 px-4 text-white font-medium">
                    ${sub.amount || 0}
                  </td>
                  <td className="py-3 px-4">
                    <select
                      value={sub.plan}
                      onChange={e => changePlanMut.mutate({ userId: sub.user_id, plan: e.target.value })}
                      className="text-xs bg-dark-bg border border-dark-border rounded-lg px-2 py-1 text-white"
                    >
                      {['free','starter','creator_pro','business','agency'].map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>{total} total subscriptions</span>
        <div className="flex gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="px-3 py-1.5 bg-dark-card border border-dark-border rounded-lg disabled:opacity-40 hover:text-white transition-colors">
            Previous
          </button>
          <span className="px-3 py-1.5 text-white">Page {page}</span>
          <button onClick={() => setPage(p => p + 1)} disabled={subs.length < 20}
            className="px-3 py-1.5 bg-dark-card border border-dark-border rounded-lg disabled:opacity-40 hover:text-white transition-colors">
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
