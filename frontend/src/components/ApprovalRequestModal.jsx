import { useState } from 'react';
import { useMutation, useQuery } from 'react-query';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { X, Send, User, Loader2, CheckCircle } from 'lucide-react';

export default function ApprovalRequestModal({ postId, onClose, onSuccess }) {
  const [approverId, setApproverId] = useState('');

  // Fetch team members who can approve
  const { data: teamData } = useQuery('teamMembers', async () => {
    const { data } = await api.get('/team/members');
    return data;
  });

  const requestMut = useMutation(
    () => api.post(`/content/posts/${postId}/request-approval`, { approver_id: approverId }),
    {
      onSuccess: () => {
        toast.success('Approval requested! 🎉');
        onSuccess?.();
        onClose();
      },
      onError: (err) => {
        toast.error(err.response?.data?.error || 'Failed to request approval');
      }
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!approverId) {
      return toast.error('Please select an approver');
    }
    requestMut.mutate();
  };

  const teamMembers = teamData?.members || [];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-dark-card border border-dark-border rounded-2xl max-w-md w-full">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Request Approval</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Approver selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-400 mb-3">
                Select Approver
              </label>
              
              {teamMembers.length === 0 ? (
                <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                  <p className="text-sm text-amber-400">
                    No team members available. Please add team members first.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {teamMembers.map((member) => (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => setApproverId(member.id)}
                      className={`w-full p-3 rounded-lg border transition-all text-left ${
                        approverId === member.id
                          ? 'border-accent-primary bg-accent-primary/10'
                          : 'border-dark-border hover:border-dark-border-light bg-dark-surface'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {member.avatar_url ? (
                          <img
                            src={member.avatar_url}
                            alt={member.full_name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                            <User size={20} className="text-white" />
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="font-medium text-white">{member.full_name}</p>
                          <p className="text-xs text-gray-500">{member.email}</p>
                        </div>
                        {approverId === member.id && (
                          <CheckCircle size={20} className="text-accent-primary" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Info message */}
            <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg mb-6">
              <p className="text-sm text-blue-400">
                The selected team member will be notified and can approve, reject, or request changes to this content.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary flex-1"
                disabled={requestMut.isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary flex-1"
                disabled={requestMut.isLoading || !approverId}
              >
                {requestMut.isLoading ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    Requesting...
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    Request Approval
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
