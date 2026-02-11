import { useState } from 'react';
import { X, AlertTriangle, Ban } from 'lucide-react';
import api from '../config/api';

export default function BlockReportModal({ targetType, targetId, targetName, onClose, onSuccess }) {
  const [action, setAction] = useState('report'); // 'report' or 'block'
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const reportReasons = {
    post: ['Spam', 'Inappropriate Content', 'Harassment', 'False Information', 'Other'],
    comment: ['Spam', 'Harassment', 'Hate Speech', 'Inappropriate', 'Other'],
    user: ['Spam Account', 'Harassment', 'Impersonation', 'Inappropriate Content', 'Other']
  };

  const handleBlock = async () => {
    if (targetType !== 'user') return;

    try {
      setLoading(true);
      await api.post(`/moderation/block/${targetId}`);
      onSuccess('User blocked successfully');
      onClose();
    } catch (error) {
      console.error('Error blocking user:', error);
      setError(error.response?.data?.detail || 'Failed to block user');
    } finally {
      setLoading(false);
    }
  };

  const handleReport = async () => {
    if (!reason) {
      setError('Please select a reason');
      return;
    }

    try {
      setLoading(true);
      await api.post('/moderation/report', {
        target_type: targetType,
        target_id: targetId,
        reason,
        description
      });
      onSuccess('Report submitted successfully');
      onClose();
    } catch (error) {
      console.error('Error submitting report:', error);
      setError('Failed to submit report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl p-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-full"
        >
          <X size={20} />
        </button>

        <h2 className="text-xl font-black mb-6">Report or Block</h2>

        {/* Action Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setAction('report')}
            className={`flex-1 py-3 rounded-xl font-bold transition-all ${
              action === 'report'
                ? 'bg-red-100 text-red-600'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            <AlertTriangle size={18} className="inline mr-2" />
            Report
          </button>
          {targetType === 'user' && (
            <button
              onClick={() => setAction('block')}
              className={`flex-1 py-3 rounded-xl font-bold transition-all ${
                action === 'block'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              <Ban size={18} className="inline mr-2" />
              Block
            </button>
          )}
        </div>

        {action === 'report' ? (
          <>
            <p className="text-sm text-slate-600 mb-4">
              Help us understand what's wrong with this {targetType}.
            </p>

            {/* Reason Selection */}
            <div className="mb-4">
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Reason *
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-600"
              >
                <option value="">Select a reason</option>
                {reportReasons[targetType]?.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div className="mb-4">
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Additional Details (Optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full h-24 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl resize-none outline-none focus:border-indigo-600"
                placeholder="Provide more context..."
                maxLength={500}
              />
            </div>
          </>
        ) : (
          <div className="mb-6">
            <div className="p-4 bg-slate-50 rounded-xl mb-4">
              <p className="text-sm text-slate-700">
                <strong>{targetName}</strong> will not be able to:
              </p>
              <ul className="text-sm text-slate-600 mt-2 space-y-1 ml-4">
                <li>• See your posts or profile</li>
                <li>• Follow you or message you</li>
                <li>• Find you in search</li>
              </ul>
            </div>
            <p className="text-xs text-slate-500">
              You can unblock them anytime from your settings.
            </p>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-full font-bold hover:bg-slate-200"
          >
            Cancel
          </button>
          <button
            onClick={action === 'report' ? handleReport : handleBlock}
            disabled={loading || (action === 'report' && !reason)}
            className={`flex-1 py-3 rounded-full font-bold disabled:opacity-50 ${
              action === 'block'
                ? 'bg-slate-900 text-white hover:bg-slate-800'
                : 'bg-red-600 text-white hover:bg-red-700'
            }`}
          >
            {loading ? 'Processing...' : action === 'report' ? 'Submit Report' : 'Block User'}
          </button>
        </div>
      </div>
    </div>
  );
}
