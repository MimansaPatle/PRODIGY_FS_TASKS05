import { useState } from 'react';
import { X } from 'lucide-react';
import api from '../config/api';

const ROSE_GRADIENT = "bg-gradient-to-r from-[#e93e68] to-[#f45d7d]";

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
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative bg-[#130f10] border border-white/10 w-full max-w-md rounded-3xl shadow-2xl p-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full text-white/60 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        <h2 className="text-xl font-black mb-4 text-white uppercase tracking-tighter italic">Edit Comment</h2>

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full h-32 px-4 py-3 bg-white/5 border border-white/10 rounded-2xl resize-none outline-none focus:border-rose-500 text-white placeholder:text-white/20 transition-all"
          placeholder="Edit your comment..."
          maxLength={500}
        />

        <div className="flex justify-between items-center mt-2 mb-4">
          <span className="text-xs text-white/40">{content.length}/500</span>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-white/5 border border-white/10 text-white/70 rounded-full font-bold hover:bg-white/10 hover:border-rose-500/30 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !content.trim()}
            className={`flex-1 py-3 ${ROSE_GRADIENT} text-white rounded-full font-bold hover:brightness-110 disabled:opacity-50 transition-all shadow-lg shadow-rose-600/20`}
          >
            {loading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
