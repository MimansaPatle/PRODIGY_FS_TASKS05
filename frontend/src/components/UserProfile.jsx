import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Settings, 
  Heart, 
  MessageCircle,
  UserPlus,
  UserMinus,
  Image as ImageIcon
} from 'lucide-react';
import { getUserProfile, toggleFollowUser, isFollowing, getUserPosts } from '../services/users.service';
import { useAuth } from '../context/AuthContext';

export default function UserProfile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { userProfile: currentUser } = useAuth();
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isFollowingUser, setIsFollowingUser] = useState(false);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);

  const isOwnProfile = currentUser?.id === userId;

  useEffect(() => {
    loadUserData();
  }, [userId]);

  const loadUserData = async () => {
    try {
      const [userData, userPosts, followStatus] = await Promise.all([
        getUserProfile(userId),
        getUserPosts(userId, 20),
        !isOwnProfile ? isFollowing(userId) : Promise.resolve(false)
      ]);
      
      setUser(userData);
      setPosts(userPosts);
      setIsFollowingUser(followStatus);
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    if (isOwnProfile) return;
    
    setFollowLoading(true);
    try {
      const result = await toggleFollowUser(userId);
      setIsFollowingUser(result);
      
      // Update follower count
      setUser(prev => ({
        ...prev,
        followers_count: result ? prev.followers_count + 1 : prev.followers_count - 1
      }));
    } catch (error) {
      console.error('Error toggling follow:', error);
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafbfc] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <UserPlus size={32} className="text-white" />
          </div>
          <p className="text-slate-400 font-medium">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#fafbfc] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">User not found</h2>
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
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/home')}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-lg font-black">{user.displayName}</h1>
            <p className="text-sm text-slate-400">{user.posts_count} posts</p>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-6">
        {/* Profile Header */}
        <div className="bg-white rounded-[2rem] shadow-sm p-8 mb-6">
          <div className="flex flex-col md:flex-row items-center gap-8">
            {/* Profile Picture */}
            <div className="relative">
              <div className="p-2 rounded-[3rem] bg-gradient-to-tr from-indigo-600 to-pink-500">
                <img 
                  src={user.photoURL || `https://i.pravatar.cc/150?u=${user.id}`}
                  className="w-32 h-32 md:w-40 md:h-40 rounded-[2.5rem] object-cover border-4 border-white shadow-2xl"
                  alt=""
                />
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row items-center gap-4 mb-6">
                <h2 className="text-3xl font-black tracking-tight">{user.username}</h2>
                
                {isOwnProfile ? (
                  <button 
                    onClick={() => navigate('/edit-profile')}
                    className="px-8 py-3 bg-slate-100 rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-colors"
                  >
                    Edit Profile
                  </button>
                ) : (
                  <button 
                    onClick={handleFollow}
                    disabled={followLoading}
                    className={`flex items-center gap-2 px-8 py-3 rounded-full font-black text-[10px] uppercase tracking-widest transition-colors ${
                      isFollowingUser 
                        ? 'bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-600' 
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}
                  >
                    {followLoading ? (
                      'Loading...'
                    ) : isFollowingUser ? (
                      <>
                        <UserMinus size={16} />
                        Unfollow
                      </>
                    ) : (
                      <>
                        <UserPlus size={16} />
                        Follow
                      </>
                    )}
                  </button>
                )}

                {isOwnProfile && (
                  <button className="p-3 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors">
                    <Settings size={18} />
                  </button>
                )}
              </div>

              {/* Stats */}
              <div className="flex justify-center md:justify-start gap-10 mb-6">
                <div key="posts" className="text-center">
                  <span className="font-black block text-2xl">{user.posts_count}</span>
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Posts</span>
                </div>
                <div key="followers" className="text-center">
                  <span className="font-black block text-2xl">{user.followers_count}</span>
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Followers</span>
                </div>
                <div key="following" className="text-center">
                  <span className="font-black block text-2xl">{user.following_count}</span>
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Following</span>
                </div>
              </div>

              {/* Bio */}
              <p className="max-w-md text-slate-500 font-medium leading-relaxed">
                {user.bio || 'No bio yet.'}
              </p>
            </div>
          </div>
        </div>

        {/* Posts Grid */}
        <div className="bg-white rounded-[2rem] shadow-sm p-8">
          <h3 className="text-xl font-black mb-6">Posts</h3>
          
          {posts.length === 0 ? (
            <div className="text-center py-12">
              <ImageIcon size={48} className="mx-auto text-slate-300 mb-4" />
              <p className="text-slate-400 font-medium">
                {isOwnProfile ? "You haven't posted anything yet." : "No posts yet."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {posts.map(post => (
                <div 
                  key={post.id || post._id} 
                  className="aspect-square rounded-2xl overflow-hidden bg-slate-100 group cursor-pointer relative hover:scale-105 transition-transform"
                  onClick={() => navigate(`/post/${post.id || post._id}`)}
                >
                  {post.media_url ? (
                    <img 
                      src={post.media_url} 
                      className="w-full h-full object-cover" 
                      alt="" 
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-indigo-100 to-pink-100 flex items-center justify-center">
                      <div className="text-center">
                        <ImageIcon size={24} className="text-indigo-300 mx-auto mb-2" />
                        <p className="text-xs text-indigo-400 font-medium">Text</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="flex items-center gap-4 text-white">
                      <div className="flex items-center gap-1">
                        <Heart size={16} fill="white" />
                        <span className="text-sm font-bold">{post.likes_count}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageCircle size={16} fill="white" />
                        <span className="text-sm font-bold">{post.comments_count}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}