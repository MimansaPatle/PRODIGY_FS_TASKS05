import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Hash, Zap } from 'lucide-react';
import api from '../config/api';
import { likePost, bookmarkPost } from '../services/posts.service';
import { useAuth } from '../context/AuthContext';

const ROSE_GRADIENT = "bg-gradient-to-r from-[#e93e68] to-[#f45d7d]";

export default function HashtagPage() {
  const { hashtag } = useParams();
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    loadHashtagPosts();
  }, [hashtag]);

  const loadHashtagPosts = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/hashtags/${hashtag}/posts`);
      setPosts(response.data.posts);
      setStats({
        total: response.data.total_count,
        hashtag: response.data.hashtag
      });
    } catch (error) {
      console.error('Error loading hashtag posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId) => {
    try {
      const result = await likePost(postId);
      setPosts(prev => prev.map(p => 
        (p.id || p._id) === postId 
          ? { ...p, is_liked: result.liked, likes_count: result.liked ? p.likes_count + 1 : p.likes_count - 1 }
          : p
      ));
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0708] selection:bg-[#e93e68] selection:text-white">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-[#130f10]/80 backdrop-blur-xl border-b border-white/10 px-6 py-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
            <ArrowLeft size={20} className="text-white" />
          </button>
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 ${ROSE_GRADIENT} rounded-2xl flex items-center justify-center shadow-lg shadow-rose-600/20`}>
              <Hash size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white uppercase tracking-tighter italic">{hashtag}</h1>
              {stats && <p className="text-sm text-white/40">{stats.total} posts</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Posts Grid */}
      <div className="px-6 py-8 pt-28">
        {loading ? (
          <div className="text-center py-20">
            <div className={`w-16 h-16 ${ROSE_GRADIENT} rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse`}>
              <Hash size={32} className="text-white" />
            </div>
            <p className="text-white/40 font-medium">Loading posts...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20">
            <Hash size={64} className="text-white/20 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No posts yet</h3>
            <p className="text-white/40">Be the first to post with {hashtag}</p>
          </div>
        ) : (
          <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4 space-y-4">
            {posts.map((post) => (
              <div 
                key={post.id || post._id} 
                className="break-inside-avoid mb-4 cursor-pointer"
                onClick={() => navigate(`/post/${post.id || post._id}`)}
              >
                <div className="group relative rounded-2xl overflow-hidden bg-[#130f10] border border-white/5 hover:border-rose-500/30 hover:shadow-xl hover:shadow-rose-600/10 transition-all">
                  {post.media_url && (
                    <img src={post.media_url} alt="" className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-110" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#070506]/95 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end">
                    <p className="text-white text-sm font-medium line-clamp-2">{post.content}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
