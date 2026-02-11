import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Hash, TrendingUp } from 'lucide-react';
import api from '../config/api';
import { likePost, bookmarkPost } from '../services/posts.service';
import { useAuth } from '../context/AuthContext';

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
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl border-b border-slate-100 px-6 py-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-full">
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-pink-500 rounded-2xl flex items-center justify-center">
              <Hash size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black">{hashtag}</h1>
              {stats && <p className="text-sm text-slate-400">{stats.total} posts</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Posts Grid */}
      <div className="px-6 py-8">
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20">
            <Hash size={48} className="mx-auto text-slate-300 mb-4" />
            <h3 className="text-xl font-bold text-slate-900 mb-2">No posts yet</h3>
            <p className="text-slate-400">Be the first to post with {hashtag}</p>
          </div>
        ) : (
          <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4 space-y-4">
            {posts.map((post) => (
              <div 
                key={post.id || post._id} 
                className="break-inside-avoid mb-4 cursor-pointer"
                onClick={() => navigate(`/post/${post.id || post._id}`)}
              >
                <div className="group relative rounded-2xl overflow-hidden bg-gray-100 hover:shadow-lg transition-all">
                  {post.media_url && (
                    <img src={post.media_url} alt="" className="w-full h-auto object-cover" />
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end">
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
