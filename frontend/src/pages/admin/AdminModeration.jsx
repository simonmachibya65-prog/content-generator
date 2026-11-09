import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { Flag, CheckCircle2, XCircle, Loader2, Eye } from 'lucide-react';

const REASON_LABELS = {
  spam:        { label: 'Spam',           color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20' },
  hate_speech: { label: 'Hate Speech',    color: 'text-red-400 bg-red-400/10 border-red-400/20' },
  violence:    { label: 'Violence',       color: 'text-red-400 bg-red-400/10 border-red-400/20' },
  copyright:   { label: 'Copyright',      color: 'text-orange-400 bg-orange-400/10 border-orange-400/20' },
  misinformation: { label: 'Misinformation', color: 'text-purple-400 bg-purple-400/10 border-purple-400/20' },
  other:       { label: 'Other',          color: 'text-gray-400 bg-gray-400/10 border-gray-400/20' },
};

export default function AdminModeration() {
  const [statusFilter, setStatusFilter] = useState('pending');
  const [selected, setSelected] = useState(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery(
    ['adminModeration', statusFilter],
    () => api.get(`/admin/moderation?status=${statusFilter}`).then(r => r.data)
  );

  const approveMut = useMutation(
    (id) => api.post(`/admin/moderation/${id}/approve`),
    {
      onSuccess: () => { toast.success('Content approved'); setSelected(null); queryClient.invalidateQueries('adminModeration'); },
      onError:   () => toast.error('Failed')
    }
  );
  const rejectMut = useMutation(
    (id) => api.post(`/admin/moderation/${id}/reject`),
    {
      onSuccess: () => { toast.success('Content rejected'); setSelected(null); queryClient.invalidateQueries('adminModeration'); },
      onError:   () => toast.error('Failed')
    }
  );

  const reports = data?.reports || [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Content Moderation</h1>
        <p className="text-sm text-gray-500 mt-1">Review flagged content and reports</p>
      </div>

      {/* Status filter */}
      <div className="flex gap-2">
        {['pending','approved','rejected'].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-4 py-1.5 rounded-xl text-sm font-medium border transition-colors capitalize ${
              statusFilter === s
                ? 'bg-accent-primary text-white border-accent-primary'
                : 'text-gray-400 border-dark-border hover:text-white'
            }`}>{s}</button>
        ))}
      </div>

      {/* Reports list */}
      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 size={24} className="animate-spin text-accent-primary" />
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center py-16 bg-dark-card border border-dark-border rounded-xl">
          <Flag size={32} className="mx-auto text-gray-600 mb-3" />
          <p className="text-gray-400">No {statusFilter} reports</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map(report => {
            const reason = REASON_LABELS[report.reason] || REASON_LABELS.other;
            return (
              <div key={report.id} className="bg-dark-card border border-dark-border rounded-xl p-4">
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${reason.color}`}>
                        {reason.label}
                      </span>
                      <span className="text-xs text-gray-500">
                        Reported {report.created_at ? new Date(report.created_at).toLocaleDateString() : '—'}
                      </span>
                    </div>
                    <p className="text-sm text-white font-medium mb-1">{report.reporter_email}</p>
                    <p className="text-xs text-gray-400 line-clamp-2">{report.content_preview || 'No preview'}</p>
                    {report.description && (
                      <p className="text-xs text-gray-500 mt-1 italic">"{report.description}"</p>
                    )}
                  </div>

                  {statusFilter === 'pending' && (
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => rejectMut.mutate(report.id)}
                        disabled={rejectMut.isLoading}
                        className="flex items-center gap-1 px-3 py-1.5 bg-red-500/10 text-red-400 border border-red-400/20 rounded-xl text-xs font-medium hover:bg-red-500/20 transition-colors"
                      >
                        <XCircle size={13} /> Remove
                      </button>
                      <button
                        onClick={() => approveMut.mutate(report.id)}
                        disabled={approveMut.isLoading}
                        className="flex items-center gap-1 px-3 py-1.5 bg-green-500/10 text-green-400 border border-green-400/20 rounded-xl text-xs font-medium hover:bg-green-500/20 transition-colors"
                      >
                        <CheckCircle2 size={13} /> Allow
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
