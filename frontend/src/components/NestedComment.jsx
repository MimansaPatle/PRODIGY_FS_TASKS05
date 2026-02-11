import { useState } from 'react';
import { MessageCircle, Edit2, Trash2, MoreVertical } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../config/api';

export default function NestedComment({ comment, onDelete, onEdit, onReply, level = 0 }) {
  const { userProfile } = useAuth();
  const [showReplies, setShowReplies] = useState(false);
  const [replies, setReplies] = useState([]);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [showMenu, setShowMenu] = useState(false);

  const isOwner = comment.author_id === (userProfile?.id || userProfile?._id);
  const commentId = comment.id || comment._id;

  const loadReplies = async () => {
    if (replies.length > 0) {
      setShowReplies(!showReplies);
      return;
    }

    try {
      setLoadingReplies(true);
      const response = await api.get(`/comments/${commentId}/replies`);
      setReplies(response.data);
      setShowReplies(true);
    } catch (error) {
      console.error('Error loading replies:', error);
    } finally {
      setLoadingReplies(false);
    }
  };

  const handleReply = async () => {
    if (!replyText.trim()) return;

    try {
      const response = await api.post(`/comments/posts/${comment.post_id}`, {
        content: replyText,
        parent_id: commentId
      });
      
      setReplies([...replies, response.data]);
      setReplyText('');
      setShowReplyForm(false);
      setShowReplies(true);
      
      if (onReply) onReply();
    } catch (error) {
      console.error('Error posting reply:', error);
    }
  };

  return (
    <div className={`${level > 0 ? 'ml-12 mt-3' : 'mt-4'}`}>
      <div className="flex gap-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {comment.author_photo ? (
            <img
              src={comment.author_photo}
              alt={comment.author_displayName}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-pink-400" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="bg-slate-50 rounded-2xl px-4 py-2">
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-sm">{comment.author_displayName}</span>
              {isOwner && (
                <div className="relative">
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="p-1 hover:bg-slate-200 rounded-full"
                  >
                    <MoreVertical size={14} />
                  </button>
                  {showMenu && (
                    <div className="absolute right-0 top-8 bg-white rounded-xl shadow-lg border border-slate-100 py-2 min-w-[120px] z-10">
                      <button
                        onClick={() => {
                          onEdit(comment);
                          setShowMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-2"
                      >
                        <Edit2 size={14} />
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          onDelete(commentId);
                          setShowMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
            <p className="text-sm text-slate-700">{comment.content}</p>
            {comment.updated_at && (
              <p className="text-xs text-slate-400 mt-1">(edited)</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4 mt-2 px-2">
            <span className="text-xs text-slate-400">
              {(() => {
                const dateString = comment.created_at;
                const date = new Date(dateString);
                const hasTimezone = dateString.includes('+') || dateString.includes('Z');
                
                let displayDate;
                if (hasTimezone && dateString.includes('+05:30')) {
                  displayDate = date;
                } else {
                  displayDate = new Date(date.getTime() + (5.5 * 60 * 60 * 1000));
                }
                
                return displayDate.toLocaleTimeString('en-IN', { 
                  hour: '2-digit', 
                  minute: '2-digit',
                  hour12: true
                });
              })()}
            </span>
            <button
              onClick={() => setShowReplyForm(!showReplyForm)}
              className="text-xs font-semibold text-slate-600 hover:text-indigo-600"
            >
              Reply
            </button>
            {comment.replies_count > 0 && (
              <button
                onClick={loadReplies}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                <MessageCircle size={12} />
                {showReplies ? 'Hide' : 'View'} {comment.replies_count} {comment.replies_count === 1 ? 'reply' : 'replies'}
              </button>
            )}
          </div>

          {/* Reply Form */}
          {showReplyForm && (
            <div className="mt-3 flex gap-2">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write a reply..."
                className="flex-1 px-4 py-2 bg-white border border-slate-200 rounded-full text-sm outline-none focus:border-indigo-600"
                onKeyPress={(e) => e.key === 'Enter' && handleReply()}
              />
              <button
                onClick={handleReply}
                disabled={!replyText.trim()}
                className="px-4 py-2 bg-indigo-600 text-white rounded-full text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50"
              >
                Reply
              </button>
            </div>
          )}

          {/* Nested Replies */}
          {showReplies && (
            <div className="mt-2">
              {loadingReplies ? (
                <div className="text-center py-2">
                  <div className="inline-block w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                replies.map((reply) => (
                  <NestedComment
                    key={reply.id || reply._id}
                    comment={reply}
                    onDelete={onDelete}
                    onEdit={onEdit}
                    onReply={onReply}
                    level={level + 1}
                  />
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
