import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Heart, MessageCircle, Share, Bookmark, Send, User, ArrowLeft, Zap } from 'lucide-react';
import { getPostById, likePost, hasUserLikedPost } from '../services/posts.service';
import { getPostComments, addComment } from '../services/comments.service';

export default function PostDetail() {
  const { postId } = useParams();
  const { currentUser } = useAuth();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [commentLoading, setCommentLoading] = useState(false);

  useEffect(() => {
    loadPostData();
  }, [postId]);

  const loadPostData = async () => {
    try {
      setLoading(true);
      
      // Load post
      const postData = await getPostById(postId);
      setPost(postData);
      setLikesCount(postData?.likes_count || 0);
      
      // Load comments
      const postComments = await getPostComments(postId);
      setComments(postComments);
      
      // Check if user has liked this post
      if (currentUser && postData) {
        const userLiked = await hasUserLikedPost(postId, currentUser.uid);
        setLiked(userLiked);
      }
    } catch (error) {
      console.error('Error loading post:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!currentUser) return;
    
    try {
      const isLiked = await likePost(postId, currentUser.uid);
      setLiked(isLiked);
      setLikesCount(prev => isLiked ? prev + 1 : prev - 1);
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !currentUser || commentLoading) return;

    try {
      setCommentLoading(true);
      const comment = await addComment(postId, currentUser.uid, newComment.trim());
      setComments([comment, ...comments]);
      setNewComment('');
      
      // Update post comment count
      setPost(prev => ({
        ...prev,
        comments_count: (prev.comments_count || 0) + 1
      }));
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setCommentLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const dateString = timestamp.toString ? timestamp.toString() : timestamp;
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
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafbfc] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Zap size={32} fill="white" className="text-white" />
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
          <h1 className="text-2xl font-black text-slate-900 mb-4">Post not found</h1>
          <p className="text-slate-400 mb-6">This post doesn't exist or has been removed.</p>
          <Link to="/" className="inline-flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-full font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Feed
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafbfc] font-sans text-slate-900">
      
      {/* Floating Logo Top Left */}
      <div className="fixed top-8 left-8 z-[110] flex items-center gap-3">
        <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-600/20">
          <Zap size={22} fill="currentColor" />
        </div>
        <span className="font-black text-xl tracking-tighter uppercase italic text-indigo-600">Vois</span>
      </div>

      <div className="max-w-6xl mx-auto p-6 md:p-12 pt-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Media */}
          <div className="bg-white/70 backdrop-blur-xl border border-white/20 shadow-lg rounded-[3rem] overflow-hidden">
            <div className="aspect-square">
              {post.media_type === 'video' ? (
                <video
                  src={post.media_url}
                  className="w-full h-full object-cover"
                  controls
                />
              ) : (
                <img
                  src={post.media_url}
                  alt={post.content}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            
            {/* Media Actions */}
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <button
                    onClick={handleLike}
                    className={`flex items-center gap-2 transition-all duration-300 ${
                      liked ? 'text-pink-500' : 'text-slate-400 hover:text-pink-500'
                    }`}
                  >
                    <Heart className={`w-6 h-6 ${liked ? 'fill-current' : ''}`} />
                    <span className="font-black">{likesCount}</span>
                  </button>
                  <div className="flex items-center gap-2 text-slate-400">
                    <MessageCircle className="w-6 h-6" />
                    <span className="font-black">{post.comments_count || 0}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <button className="text-slate-400 hover:text-indigo-600 transition-colors">
                    <Share className="w-6 h-6" />
                  </button>
                  <button className="text-slate-400 hover:text-indigo-600 transition-colors">
                    <Bookmark className="w-6 h-6" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-6">
            {/* Author */}
            <div className="bg-white/70 backdrop-blur-xl border border-white/20 shadow-lg rounded-[2rem] p-8">
              <div className="flex items-center gap-4 mb-6">
                <Link to={`/profile/${post.author_id}`} className="relative">
                  {post.author_photo ? (
                    <img
                      src={post.author_photo}
                      alt={post.author_username}
                      className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-lg"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gradient-to-r from-indigo-600 to-pink-500 rounded-full flex items-center justify-center border-2 border-white shadow-lg">
                      <User className="w-6 h-6 text-white" />
                    </div>
                  )}
                </Link>
                <div className="flex-1">
                  <Link
                    to={`/profile/${post.author_id}`}
                    className="font-black text-slate-900 hover:text-indigo-600 transition-colors"
                  >
                    @{post.author_username}
                  </Link>
                  <p className="text-[10px] font-medium text-slate-400 uppercase tracking-tighter">
                    {formatDate(post.created_at)}
                  </p>
                </div>
                <button className="px-6 py-3 bg-slate-100 rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-indigo-50 hover:text-indigo-600 transition-colors">
                  Collect
                </button>
              </div>

              {/* Post Content */}
              <div className="border-t border-slate-100 pt-6">
                <p className="text-slate-700 leading-relaxed font-medium mb-4">
                  {post.content}
                </p>
                
                {/* Tags */}
                {post.tags && post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {post.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Add Comment */}
            {currentUser && (
              <div className="bg-white/70 backdrop-blur-xl border border-white/20 shadow-lg rounded-[2rem] p-8">
                <form onSubmit={handleCommentSubmit} className="space-y-4">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Add Comment</h3>
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Share your thoughts..."
                    className="w-full h-24 bg-slate-50 border border-slate-100 rounded-2xl p-4 outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-600 transition-all resize-none font-medium text-slate-700"
                    maxLength={500}
                  />
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                      {newComment.length}/500 Characters
                    </span>
                    <button
                      type="submit"
                      disabled={!newComment.trim() || commentLoading}
                      className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-full font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="w-4 h-4" />
                      {commentLoading ? 'Posting...' : 'Post Comment'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Comments */}
            <div className="bg-white/70 backdrop-blur-xl border border-white/20 shadow-lg rounded-[2rem] p-8">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-6">Comments ({comments.length})</h3>
              <div className="space-y-6 max-h-96 overflow-y-auto">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex gap-4">
                    <Link to={`/profile/${comment.author_id}`} className="flex-shrink-0">
                      {comment.author_photo ? (
                        <img
                          src={comment.author_photo}
                          alt={comment.author_username}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 bg-gradient-to-r from-indigo-600 to-pink-500 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </Link>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Link
                          to={`/profile/${comment.author_id}`}
                          className="font-black text-slate-900 text-sm hover:text-indigo-600 transition-colors"
                        >
                          @{comment.author_username}
                        </Link>
                        <span className="text-[10px] font-medium text-slate-400 uppercase tracking-tighter">
                          {formatDate(comment.created_at)}
                        </span>
                      </div>
                      <p className="text-slate-700 text-sm leading-relaxed font-medium">
                        {comment.content}
                      </p>
                    </div>
                  </div>
                ))}
                
                {comments.length === 0 && (
                  <div className="text-center py-12">
                    <MessageCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-400 font-medium">No comments yet</p>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300 mt-2">Be the first to share your thoughts</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}