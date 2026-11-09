import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../lib/api';
import toast from 'react-hot-toast';
import {
  CheckCircle, XCircle, MessageSquare, Clock, User, Calendar,
  AlertCircle, Send, ThumbsUp, ThumbsDown, Edit3, Loader2
} from 'lucide-react';

export default function Approvals() {
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' or 'my-requests'
  const [selectedApproval, setSelectedApproval] = useState(null);
  const [feedback, setFeedback] = useState('');
  const queryClient = useQueryClient();

  // Fetch pending approvals (for approvers)
  const { data: pendingData, isLoading: pendingLoading } = useQuery(
    'pendingApprovals',
    async () => {
      const { data } = await api.get('/content/approvals/pending');
      return data;
    },
    { enabled: activeTab === 'pending' }
  );

  // Fetch my approval requests
  const { data: myRequestsData, isLoading: requestsLoading } = useQuery(
    'myApprovalRequests',
    async () => {
      const { data } = await api.get('/content/approvals/my-requests');
      return data;
    },
    { enabled: activeTab === 'my-requests' }
  );

  // Approve mutation
  const approveMut = useMutation(
    ({ id, feedback }) => api.post(`/content/approvals/${id}/approve`, { feedback }),
    {
      onSuccess: () => {
        toast.success('Content approved! ✅');
        queryClient.invalidateQueries('pendingApprovals');
        setSelectedApproval(null);
        setFeedback('');
      },
      onError: () => toast.error('Failed to approve')
    }
  );

  // Reject mutation
  const rejectMut = useMutation(
    ({ id, feedback }) => api.post(`/content/approvals/${id}/reject`, { feedback }),
    {
      onSuccess: () => {
        toast.success('Content rejected');
        queryClient.invalidateQueries('pendingApprovals');
        setSelectedApproval(null);
        setFeedback('');
      },
      onError: () => toast.error('Failed to reject')
    }
  );

  // Request changes mutation
  const requestChangesMut = useMutation(
    ({ id, feedback }) => api.post(`/content/approvals/${id}/request-changes`, { feedback }),
    {
      onSuccess: () => {
        toast.success('Changes requested');
        queryClient.invalidateQueries('pendingApprovals');
        setSelectedApproval(null);
        setFeedback('');
      },
      onError: () => toast.error('Failed to request changes')
    }
  );

  const handleApprove = (approval) => {
    if (!feedback.trim()) {
      return approveMut.mutate({ id: approval.id, feedback: 'Approved' });
    }
    approveMut.mutate({ id: approval.id, feedback });
  };

  const handleReject = (approval) => {
    if (!feedback.trim()) {
      return toast.error('Please provide feedback when rejecting');
    }
    rejectMut.mutate({ id: approval.id, feedback });
  };

  const handleRequestChanges = (approval) => {
    if (!feedback.trim()) {
      return toast.error('Please provide feedback for requested changes');
    }
    requestChangesMut.mutate({ id: approval.id, feedback });
  };

  const approvals = activeTab === 'pending' ? pendingData?.approvals || [] : myRequestsData?.requests || [];
  const isLoading = activeTab === 'pending' ? pendingLoading : requestsLoading;

  const getStatusBadge = (status) => {
    const badges = {
      pending: { color: 'bg-amber-500/10 text-amber-400 border-amber-500/30', icon: Clock, label: 'Pending' },
      approved: { color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30', icon: CheckCircle, label: 'Approved' },
      rejected: { color: 'bg-red-500/10 text-red-400 border-red-500/30', icon: XCircle, label: 'Rejected' },
      changes_requested: { color: 'bg-blue-500/10 text-blue-400 border-blue-500/30', icon: Edit3, label: 'Changes Requested' }
    };
    const badge = badges[status] || badges.pending;
    const Icon = badge.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${badge.color}`}>
        <Icon size={12} />
        {badge.label}
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Content Approvals</h1>
        <p className="text-sm text-gray-500 mt-1">Review and approve content before publishing</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 border-b border-dark-border">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'pending'
              ? 'border-accent-primary text-white'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          Pending Review
        </button>
        <button
          onClick={() => setActiveTab('my-requests')}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'my-requests'
              ? 'border-accent-primary text-white'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          My Requests
        </button>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-accent-primary animate-spin" />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && approvals.length === 0 && (
        <div className="card text-center py-12">
          <div className="w-16 h-16 bg-dark-surface rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-gray-600" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-1">
            {activeTab === 'pending' ? 'No pending approvals' : 'No approval requests'}
          </h3>
          <p className="text-sm text-gray-500">
            {activeTab === 'pending'
              ? 'All content has been reviewed'
              : "You haven't requested any approvals yet"}
          </p>
        </div>
      )}

      {/* Approval list */}
      {!isLoading && approvals.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {approvals.map((approval) => (
            <div
              key={approval.id}
              className="card hover:border-accent-primary/30 transition-all cursor-pointer"
              onClick={() => setSelectedApproval(approval)}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-white mb-1">
                    {approval.title || 'Untitled Post'}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <User size={12} />
                    <span>{approval.creator_name || approval.approver_name || 'Unknown'}</span>
                    <span>•</span>
                    <Calendar size={12} />
                    <span>{new Date(approval.requested_at).toLocaleDateString()}</span>
                  </div>
                </div>
                {getStatusBadge(approval.status)}
              </div>

              {/* Content preview */}
              <div className="bg-dark-surface rounded-lg p-3 mb-3">
                <p className="text-sm text-gray-300 line-clamp-3">
                  {approval.content_text || 'No content preview available'}
                </p>
              </div>

              {/* Feedback if exists */}
              {approval.feedback && (
                <div className="flex items-start gap-2 p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg mb-3">
                  <MessageSquare size={14} className="text-blue-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-blue-400 mb-1">Feedback</p>
                    <p className="text-xs text-gray-300">{approval.feedback}</p>
                  </div>
                </div>
              )}

              {/* Action buttons for pending approvals */}
              {activeTab === 'pending' && approval.status === 'pending' && (
                <div className="flex items-center gap-2 pt-3 border-t border-dark-border">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleApprove(approval);
                    }}
                    disabled={approveMut.isLoading}
                    className="btn btn-sm btn-success flex-1"
                  >
                    <ThumbsUp size={14} />
                    Approve
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedApproval(approval);
                    }}
                    className="btn btn-sm btn-secondary flex-1"
                  >
                    <Edit3 size={14} />
                    Review
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Approval detail modal */}
      {selectedApproval && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-dark-card border border-dark-border rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Modal header */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-white mb-2">
                    {selectedApproval.title || 'Untitled Post'}
                  </h2>
                  <div className="flex items-center gap-3 text-sm text-gray-400">
                    <span className="flex items-center gap-1.5">
                      <User size={14} />
                      {selectedApproval.creator_name || selectedApproval.approver_name}
                    </span>
                    <span>•</span>
                    {getStatusBadge(selectedApproval.status)}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedApproval(null)}
                  className="text-gray-400 hover:text-white"
                >
                  <XCircle size={24} />
                </button>
              </div>

              {/* Content */}
              <div className="bg-dark-surface rounded-lg p-4 mb-6">
                <p className="text-sm font-medium text-gray-400 mb-2">Content</p>
                <p className="text-white whitespace-pre-wrap">
                  {selectedApproval.content_text || 'No content available'}
                </p>
              </div>

              {/* Media preview if available */}
              {selectedApproval.media_ids && selectedApproval.media_ids.length > 0 && (
                <div className="mb-6">
                  <p className="text-sm font-medium text-gray-400 mb-2">Media ({selectedApproval.media_ids.length})</p>
                  <div className="flex gap-2 overflow-x-auto">
                    {selectedApproval.media_ids.map((id, idx) => (
                      <div key={idx} className="w-24 h-24 bg-dark-surface rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-xs text-gray-500">Media {idx + 1}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Existing feedback */}
              {selectedApproval.feedback && (
                <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-lg mb-6">
                  <p className="text-sm font-medium text-blue-400 mb-2">Previous Feedback</p>
                  <p className="text-sm text-gray-300">{selectedApproval.feedback}</p>
                </div>
              )}

              {/* Feedback textarea for pending approvals */}
              {activeTab === 'pending' && selectedApproval.status === 'pending' && (
                <>
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Feedback (optional for approval, required for rejection)
                    </label>
                    <textarea
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder="Add your feedback here..."
                      rows={4}
                      className="input resize-none"
                    />
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleApprove(selectedApproval)}
                      disabled={approveMut.isLoading}
                      className="btn btn-success flex-1"
                    >
                      {approveMut.isLoading ? (
                        <Loader2 className="animate-spin" size={16} />
                      ) : (
                        <ThumbsUp size={16} />
                      )}
                      Approve
                    </button>
                    <button
                      onClick={() => handleRequestChanges(selectedApproval)}
                      disabled={requestChangesMut.isLoading}
                      className="btn btn-secondary flex-1"
                    >
                      {requestChangesMut.isLoading ? (
                        <Loader2 className="animate-spin" size={16} />
                      ) : (
                        <Edit3 size={16} />
                      )}
                      Request Changes
                    </button>
                    <button
                      onClick={() => handleReject(selectedApproval)}
                      disabled={rejectMut.isLoading}
                      className="btn btn-danger flex-1"
                    >
                      {rejectMut.isLoading ? (
                        <Loader2 className="animate-spin" size={16} />
                      ) : (
                        <ThumbsDown size={16} />
                      )}
                      Reject
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
