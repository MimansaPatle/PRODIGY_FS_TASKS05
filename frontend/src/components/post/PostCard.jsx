import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Heart, MessageCircle, Share, Bookmark, MoreHorizontal, User } from 'lucide-react';
import { likePost, hasUserLikedPost } from '../../services/posts.service';
import '../../styles/components.css';

export default function PostCard({ post }) {
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [loading, setLoading] = useState(false);
  const { currentUser } = useAuth();

  // Check if user has liked this post
  useEffect(() => {
    if (currentUser && post.id) {
      hasUserLikedPost(post.id, currentUser.uid)
        .then(setLiked)
        .catch(console.error);
    }
  }, [post.id, currentUser]);

  const handleLike = async () => {
    if (loading) return;
    
    setLoading(true);
    try {
      const isLiked = await likePost(post.id, currentUser.uid);
      setLiked(isLiked);
      setLikesCount(prev => isLiked ? prev + 1 : prev - 1);
    } catch (error) {
      console.error('Error liking post:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    
    // Handle both Firestore timestamp and ISO string
    const dateString = timestamp.toDate ? timestamp.toDate().toISOString() : timestamp;
    const date = new Date(dateString);
    
    // Check if the date string contains timezone info (+ or -)
    // If it has timezone info, it's already in IST from the backend
    // If not, it's UTC and needs conversion
    const hasTimezone = dateString.includes('+') || dateString.includes('Z');
    
    let displayDate;
    if (hasTimezone && dateString.includes('+05:30')) {
      // Already in IST, no conversion needed
      displayDate = date;
    } else {
      // UTC time, convert to IST by adding 5.5 hours
      displayDate = new Date(date.getTime() + (5.5 * 60 * 60 * 1000));
    }
    
    return displayDate.toLocaleDateString('en-IN', { 
      month: 'short', 
      day: 'numeric'
    });
  };

  return (
    <div className="vois-card overflow-hidden group">
      {/* Media */}
      {post.media_url && (
        <div className="relative aspect-square overflow-hidden">
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
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          )}
          
          {/* Overlay Actions */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
            <div className="flex gap-4">
              <button
                onClick={handleLike}
                className={`glass-surface-dark p-3 rounded-full transition-all duration-300 ${
                  liked ? 'text-rose-pink' : 'text-white'
                }`}
              >
                <Heart className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
              </button>
              <Link
                to={`/post/${post.id}`}
                className="glass-surface-dark p-3 rounded-full text-white transition-all duration-300"
              >
                <MessageCircle className="w-5 h-5" />
              </Link>
              <button className="glass-surface-dark p-3 rounded-full text-white transition-all duration-300">
                <Share className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-6">
        {/* Author */}
        <div className="flex items-center justify-between mb-4">
          <Link
            to={`/profile/${post.author_id}`}
            className="flex items-center gap-3 group/author"
          >
            <div className="vois-avatar">
              {post.author_photo ? (
                <img
                  src={post.author_photo}
                  alt={post.author_username}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 bg-gradient-to-r from-electric-indigo to-rose-pink rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
            <div>
              <p className="font-black text-deep-slate group-hover/author:text-electric-indigo transition-colors">
                @{post.author_username}
              </p>
              <p className="vois-meta text-muted-slate">{formatDate(post.created_at)}</p>
            </div>
          </Link>
          
          <button className="p-2 text-muted-slate hover:text-deep-slate transition-colors">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>

        {/* Post Content */}
        {post.content && (
          <p className="text-sm font-medium leading-relaxed text-deep-slate mb-4">
            {post.content}
          </p>
        )}

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {post.tags.map((tag, index) => (
              <span
                key={index}
                className="vois-meta bg-slate-100 text-muted-slate px-3 py-1 rounded-full"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <div className="flex items-center gap-6">
            <button
              onClick={handleLike}
              className={`flex items-center gap-2 transition-all duration-300 ${
                liked ? 'text-rose-pink' : 'text-muted-slate hover:text-rose-pink'
              }`}
            >
              <Heart className={`w-5 h-5 ${liked ? 'fill-current animate-pulse-like' : ''}`} />
              <span className="vois-meta">{likesCount}</span>
            </button>
            
            <Link
              to={`/post/${post.id}`}
              className="flex items-center gap-2 text-muted-slate hover:text-electric-indigo transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              <span className="vois-meta">{post.comments_count || 0}</span>
            </Link>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="text-muted-slate hover:text-electric-indigo transition-colors">
              <Share className="w-5 h-5" />
            </button>
            <button className="text-muted-slate hover:text-electric-indigo transition-colors">
              <Bookmark className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}