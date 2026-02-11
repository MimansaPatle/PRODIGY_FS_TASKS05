import { useState } from 'react';
import { X } from 'lucide-react';
import api from '../config/api';

export default function EditCommentModal({ comment, onClose, onUpdate }) {
  const [content, setContent] = useState(comment.content);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!content.trim()) {
      setError('Comment cannot be empty');
      return;
    }

    try {
      setLoading(true);
      const response = await api.put(`/comments/${comment.id || comment._id}`, {
        content: content.trim()
      });
      
      onUpdate(response.data);
      onClose();
    } catch (error) {
      console.error('Error updating comment:', error);
      setError('Failed to update comment');
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

        <h2 className="text-xl font-black mb-4">Edit Comment</h2>

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full h-32 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl resize-none outline-none focus:border-indigo-600"
          placeholder="Edit your comment..."
          maxLength={500}
        />

        <div className="flex justify-between items-center mt-2 mb-4">
          <span className="text-xs text-slate-400">{content.length}/500</span>
        </div>

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
            onClick={handleSubmit}
            disabled={loading || !content.trim()}
            className="flex-1 py-3 bg-indigo-600 text-white rounded-full font-bold hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
