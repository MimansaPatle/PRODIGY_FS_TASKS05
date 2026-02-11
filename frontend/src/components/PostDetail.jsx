import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Heart, 
  MessageCircle, 
  Send, 
  Bookmark, 
  ArrowLeft, 
  X,
  MoreHorizontal,
  Edit,
  Trash2,
  Hash,
  Tag,
  ImageIcon,
  Flag
} from 'lucide-react';
import { getPostById, likePost, getPostComments, deleteComment, deletePost, updatePost, bookmarkPost } from '../services/posts.service';
import { addComment } from '../services/posts.service';
import { useAuth } from '../context/AuthContext';
import SharePostModal from './SharePostModal';
import NestedComment from './NestedComment';
import EditCommentModal from './EditCommentModal';
import BlockReportModal from './BlockReportModal';
import VerifiedBadge from './VerifiedBadge';
import ClickableHashtags from './ClickableHashtags';

export default function PostDetail() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showPostMenu, setShowPostMenu] = useState(false);
  const [showEditOverlay, setShowEditOverlay] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [editingComment, setEditingComment] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);

  // Check if current user owns this post
  const isPostOwner = post && userProfile && (
    post.author_id === userProfile.id || 
    post.author_id === userProfile._id ||
    post.author_id === userProfile.uid
  );

  useEffect(() => {
    loadPostData();
  }, [postId]);

  // Close post menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowPostMenu(false);
    };

    if (showPostMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showPostMenu]);

  const loadPostData = async () => {
    try {
      const [postData, commentsData] = await Promise.all([
        getPostById(postId),
        getPostComments(postId)
      ]);
      setPost(postData);
      setComments(commentsData);
    } catch (error) {
      console.error('Error loading post:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    try {
      const result = await likePost(postId);
      setPost(prev => ({
        ...prev,
        is_liked: result.liked,
        likes_count: result.liked ? prev.likes_count + 1 : prev.likes_count - 1
      }));
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleBookmark = async () => {
    try {
      const result = await bookmarkPost(postId);
      setPost(prev => ({
        ...prev,
        is_bookmarked: result.bookmarked
      }));
    } catch (error) {
      console.error('Error bookmarking post:', error);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      const comment = await addComment(postId, newComment);
      setComments(prev => [...prev, comment]);
      setNewComment('');
      setPost(prev => ({
        ...prev,
        comments_count: prev.comments_count + 1
      }));
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      const success = await deleteComment(postId, commentId);
      if (success) {
        setComments(prev => prev.filter(c => (c.id || c._id) !== commentId));
        setPost(prev => ({
          ...prev,
          comments_count: prev.comments_count - 1
        }));
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  const handleDeletePost = async () => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    
    try {
      await deletePost(postId);
      // Navigate back after successful deletion
      navigate(-1);
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Failed to delete post. Please try again.');
    }
  };

  const handleEditPost = () => {
    setShowEditOverlay(true);
    setShowPostMenu(false);
  };

  const handleShare = () => {
    setShowShareModal(true);
  };

  const handleUpdatePost = async (postData) => {
    try {
      await updatePost(
        postId,
        postData.content,
        postData.tags,
        postData.mediaFile,
        postData.mediaFile?.thumbnailDataUrl || null,
        postData.existingMediaUrl || post.media_url // Pass existing media URL
      );
      
      // Reload post data to get updated version
      await loadPostData();
      
      setShowEditOverlay(false);
    } catch (error) {
      console.error('Error updating post:', error);
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafbfc] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <MessageCircle size={32} className="text-white" />
          </div>
          <p className="text-slate-400 font-medium">Loading post...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-[#fafbfc] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Post not found</h2>
          <button 
            onClick={() => navigate('/home')}
            className="px-6 py-3 bg-indigo-600 text-white rounded-full font-bold"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafbfc]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-lg font-black">Post</h1>
          </div>
          
          {/* Post Menu for Owner */}
          {isPostOwner && (
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowPostMenu(!showPostMenu);
                }}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <MoreHorizontal size={20} />
              </button>
              
              {showPostMenu && (
                <div className="absolute top-12 right-0 bg-white rounded-xl shadow-lg border border-slate-100 py-2 min-w-[140px] z-10">
                  {isPostOwner ? (
                    <>
                      <button
                        onClick={handleEditPost}
                        className="w-full px-4 py-2 text-left text-sm text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-2"
                      >
                        <Edit size={14} />
                        Edit Post
                      </button>
                      <button
                        onClick={handleDeletePost}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                      >
                        <Trash2 size={14} />
                        Delete Post
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => {
                        setShowReportModal(true);
                        setShowPostMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                    >
                      <Flag size={14} />
                      Report Post
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-[2rem] shadow-sm overflow-hidden">
          {/* Post Header */}
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-center gap-4">
              <img 
                src={post.author_photo || `https://i.pravatar.cc/150?u=${post.author_id}`}
                className="w-12 h-12 rounded-full object-cover"
                alt=""
              />
              <div className="flex-1">
                <h3 className="font-bold text-slate-800">{post.author_username}</h3>
                <p className="text-sm text-slate-400">
                  {(() => {
                    const dateString = post.created_at;
                    const date = new Date(dateString);
                    const hasTimezone = dateString.includes('+') || dateString.includes('Z');
                    
                    let displayDate;
                    if (hasTimezone && dateString.includes('+05:30')) {
                      displayDate = date;
                    } else {
                      displayDate = new Date(date.getTime() + (5.5 * 60 * 60 * 1000));
                    }
                    
                    return displayDate.toLocaleDateString('en-IN', {
                      month: 'short',
                      day: 'numeric'
                    });
                  })()}
                </p>
              </div>
            </div>
          </div>

          {/* Post Content */}
          <div className="p-6">
            <p className="text-slate-700 mb-4 leading-relaxed">
              <ClickableHashtags text={post.content} />
            </p>
            
            {post.media_url && (
              <div className="rounded-2xl overflow-hidden mb-4">
                {post.media_type === 'video' ? (
                  <video 
                    src={post.media_url} 
                    className="w-full max-h-96 object-cover"
                    controls
                  />
                ) : (
                  <img 
                    src={post.media_url} 
                    className="w-full max-h-96 object-cover"
                    alt=""
                  />
                )}
              </div>
            )}

            {/* Post Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <div className="flex items-center gap-6">
                <button 
                  onClick={handleLike}
                  className={`flex items-center gap-2 ${post.is_liked ? 'text-pink-500' : 'text-slate-400'} hover:text-pink-500 transition-colors`}
                >
                  <Heart size={20} fill={post.is_liked ? "currentColor" : "none"} />
                  <span className="text-sm font-medium">{post.likes_count}</span>
                </button>
                <div className="flex items-center gap-2 text-slate-400">
                  <MessageCircle size={20} />
                  <span className="text-sm font-medium">{post.comments_count}</span>
                </div>
                <button 
                  onClick={handleShare}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <Send size={20} />
                </button>
                {/* View count */}
                {post.views_count > 0 && (
                  <div className="flex items-center gap-2 text-slate-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span className="text-sm font-medium">{post.views_count}</span>
                  </div>
                )}
              </div>
              <button 
                onClick={handleBookmark}
                className={`transition-colors ${
                  post.is_bookmarked 
                    ? 'text-indigo-600' 
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <Bookmark size={20} fill={post.is_bookmarked ? "currentColor" : "none"} />
              </button>
            </div>
          </div>

          {/* Comments Section */}
          <div className="border-t border-slate-100">
            {/* Add Comment */}
            <form onSubmit={handleAddComment} className="p-6 border-b border-slate-100">
              <div className="flex gap-4">
                <img 
                  src={userProfile?.photoURL || `https://i.pravatar.cc/150?u=${userProfile?.id}`}
                  className="w-10 h-10 rounded-full object-cover"
                  alt=""
                />
                <div className="flex-1">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="w-full p-3 bg-slate-50 rounded-xl resize-none outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                    rows="2"
                  />
                  <div className="flex justify-end mt-2">
                    <button
                      type="submit"
                      disabled={!newComment.trim() || submitting}
                      className="px-6 py-2 bg-indigo-600 text-white rounded-full text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-700 transition-colors"
                    >
                      {submitting ? 'Posting...' : 'Post'}
                    </button>
                  </div>
                </div>
              </div>
            </form>

            {/* Comments List */}
            <div className="max-h-96 overflow-y-auto px-6">
              {comments.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  <MessageCircle size={32} className="mx-auto mb-2 opacity-50" />
                  <p>No comments yet. Be the first to comment!</p>
                </div>
              ) : (
                comments.map(comment => (
                  <NestedComment
                    key={comment.id || comment._id}
                    comment={comment}
                    onDelete={handleDeleteComment}
                    onEdit={(comment) => setEditingComment(comment)}
                    onReply={loadPostData}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Comment Modal */}
      {editingComment && (
        <EditCommentModal
          comment={editingComment}
          onClose={() => setEditingComment(null)}
          onUpdate={() => {
            setEditingComment(null);
            loadPostData();
          }}
        />
      )}

      {/* Report Modal */}
      {showReportModal && post && (
        <BlockReportModal
          targetType="post"
          targetId={post.id || post._id}
          targetName={post.author_username}
          onClose={() => setShowReportModal(false)}
          onSuccess={(msg) => {
            alert(msg);
            setShowReportModal(false);
          }}
        />
      )}

      {/* Edit Post Overlay */}
      {showEditOverlay && post && (
        <EditPostOverlay
          post={post}
          onClose={() => setShowEditOverlay(false)}
          onUpdate={handleUpdatePost}
        />
      )}

      {/* Share Post Modal */}
      {showShareModal && post && (
        <SharePostModal
          post={post}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  );
}

// Edit Post Overlay Component
const EditPostOverlay = ({ post, onClose, onUpdate }) => {
  const [content, setContent] = useState(post.content || '');
  const [tags, setTags] = useState(post.tags || []);
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(post.media_url || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const addHashtag = () => {
    const hashtag = prompt('Enter hashtag (without #):');
    if (hashtag && hashtag.trim()) {
      const cleanHashtag = hashtag.trim().replace(/\s+/g, '').toLowerCase();
      const newTag = `#${cleanHashtag}`;
      if (!tags.includes(newTag) && cleanHashtag.length > 0) {
        setTags([...tags, newTag]);
      }
    }
  };

  const addTag = () => {
    const tag = prompt('Enter tag:');
    if (tag && tag.trim()) {
      const cleanTag = tag.trim().toLowerCase();
      if (!tags.includes(cleanTag) && cleanTag.length > 0) {
        setTags([...tags, cleanTag]);
      }
    }
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size
      const maxSize = file.type.startsWith('video/') ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
      if (file.size > maxSize) {
        setError(`File too large. Max: ${maxSize / (1024 * 1024)}MB`);
        return;
      }
      
      setMediaFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setMediaPreview(e.target.result);
      reader.readAsDataURL(file);
      setError('');
    }
  };

  const removeMedia = () => {
    setMediaFile(null);
    setMediaPreview('');
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      setError('Please add a caption for your post.');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      await onUpdate({ 
        content, 
        tags, 
        mediaFile,
        existingMediaUrl: mediaFile ? null : post.media_url // Keep existing if no new file
      });
    } catch (error) {
      console.error('Error updating post:', error);
      setError(error.message || 'Failed to update post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={onClose} />
      <div className="relative bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden">
        <button onClick={onClose} className="absolute top-6 right-6 z-10 p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors">
          <X size={20} />
        </button>
        
        <div className="p-10">
          <h2 className="text-2xl font-black text-slate-900 mb-8">Edit Post</h2>
          
          {/* Media Upload/Preview */}
          <div className="mb-6">
            {mediaPreview ? (
              <div className="relative w-full h-64 bg-slate-100 rounded-2xl overflow-hidden">
                {(mediaFile?.type.startsWith('video/') || post.media_type === 'video' || post.media_url?.match(/\.(mp4|mov|avi|webm)$/i)) ? (
                  <video 
                    src={mediaPreview} 
                    className="w-full h-full object-cover"
                    controls
                  />
                ) : (
                  <img 
                    src={mediaPreview} 
                    className="w-full h-full object-cover" 
                    alt="Post media" 
                  />
                )}
                <button
                  onClick={removeMedia}
                  className="absolute top-4 right-4 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                >
                  <X size={16} />
                </button>
                {!mediaFile && (
                  <div className="absolute bottom-4 left-4 right-4">
                    <label className="block w-full px-4 py-2 bg-white/90 backdrop-blur-sm text-center rounded-xl cursor-pointer hover:bg-white transition-colors">
                      <span className="text-sm font-bold text-slate-700">Change Media</span>
                      <input
                        type="file"
                        accept="image/*,video/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
              </div>
            ) : (
              <label className="block w-full h-48 border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 hover:bg-slate-50 transition-colors">
                <ImageIcon size={32} className="text-slate-400 mb-2" />
                <span className="text-sm font-bold text-slate-600">Add Media</span>
                <span className="text-xs text-slate-400 mt-1">Click to upload image or video</span>
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            )}
          </div>
          
          <textarea 
            placeholder="What's the story behind this piece?" 
            className="w-full h-32 bg-transparent outline-none resize-none font-medium text-slate-600 border border-slate-200 rounded-2xl p-4 mb-6"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          
          {/* Tags Display */}
          {tags.length > 0 && (
            <div className="mb-6">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Tags:</p>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag, index) => (
                  <span 
                    key={index}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium"
                  >
                    {tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="ml-1 text-indigo-500 hover:text-indigo-700"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {/* Error Display */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-medium">
              {error}
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <button 
                onClick={addHashtag}
                disabled={loading}
                className="flex items-center gap-2 p-2 bg-slate-50 hover:bg-indigo-50 rounded-lg text-slate-400 hover:text-indigo-600 transition-colors disabled:opacity-50"
                title="Add Hashtag"
              >
                <Hash size={18} />
                <span className="text-xs font-medium">Hashtag</span>
              </button>
              <button 
                onClick={addTag}
                disabled={loading}
                className="flex items-center gap-2 p-2 bg-slate-50 hover:bg-indigo-50 rounded-lg text-slate-400 hover:text-indigo-600 transition-colors disabled:opacity-50"
                title="Add Tag"
              >
                <Tag size={18} />
                <span className="text-xs font-medium">Tag</span>
              </button>
            </div>
            <button 
              onClick={handleSubmit}
              disabled={loading || !content.trim()}
              className="px-8 py-3 bg-indigo-600 text-white rounded-full font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-600/30 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-700 transition-colors"
            >
              {loading ? 'Updating...' : 'Update Post'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};