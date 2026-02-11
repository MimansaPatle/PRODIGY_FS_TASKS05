import { useState, useEffect } from 'react';
import { TrendingUp, Hash, Users, Compass, Search, Command, Zap, ArrowLeft, User } from 'lucide-react';
import { getExplorePosts } from '../services/posts.service';
import { getTrendingUsers, searchUsers } from '../services/users.service';
import { useNavigate } from 'react-router-dom';

export default function Explore() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('trending');
  const [posts, setPosts] = useState([]);
  const [trendingUsers, setTrendingUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExploreData();
  }, [activeTab]);

  useEffect(() => {
    if (searchTerm.trim()) {
      handleSearch();
    } else {
      setSearchResults([]);
    }
  }, [searchTerm]);

  const loadExploreData = async () => {
    try {
      setLoading(true);
      
      if (activeTab === 'trending') {
        // Load all posts for trending
        const response = await getExplorePosts({ limit: 50 });
        // Handle both direct array and PostsResponse format
        const postsData = response.posts || response || [];
        setPosts(Array.isArray(postsData) ? postsData : []);
      } else if (activeTab === 'artists') {
        // Load trending users
        const trending = await getTrendingUsers(12);
        setTrendingUsers(trending);
      }
    } catch (error) {
      console.error('Error loading explore data:', error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    try {
      const results = await searchUsers(searchTerm, 10);
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching users:', error);
    }
  };

  const tabs = [
    { id: 'trending', label: 'Trending', icon: TrendingUp },
    { id: 'tags', label: 'Tags', icon: Hash },
    { id: 'artists', label: 'Artists', icon: Users },
    { id: 'discover', label: 'Discover', icon: Compass },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafbfc] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Zap size={32} fill="white" className="text-white" />
          </div>
          <p className="text-slate-400 font-medium">Loading explore...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafbfc] font-sans text-slate-900">
      
      {/* Header with Back Button and Logo */}
      <div className="fixed top-8 left-8 z-[110] flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 bg-white/80 backdrop-blur-md rounded-xl hover:bg-white transition-colors shadow-lg"
        >
          <ArrowLeft size={20} className="text-slate-600" />
        </button>
        <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-600/20">
          <Zap size={22} fill="currentColor" />
        </div>
        <span className="font-black text-xl tracking-tighter uppercase italic text-indigo-600">Vois</span>
      </div>

      <div className="max-w-7xl mx-auto p-6 md:p-12 pt-24">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-5xl font-black tracking-tighter text-slate-900 mb-2">Explore</h1>
          <p className="text-slate-400 font-medium text-lg">Discover trending visuals and emerging artists</p>
        </div>

        {/* Search Bar */}
        <div className="mb-12">
          <div className="max-w-md w-full relative">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Artists, aesthetics, or trends..."
              className="w-full px-8 py-5 pl-14 bg-white border border-slate-100 rounded-[2rem] shadow-sm outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-600 transition-all font-bold text-slate-800"
            />
            <Command size={20} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300" />
          </div>
          
          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="mt-6 bg-white/70 backdrop-blur-xl border border-white/20 shadow-lg rounded-[2rem] p-6 max-w-md">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-4">Search Results</h3>
              <div className="space-y-4">
                {searchResults.map((user, index) => (
                  <button
                    key={user.id || user._id || index}
                    onClick={() => navigate(`/profile/${user.id || user._id}`)}
                    className="w-full flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-50 transition-colors group text-left"
                  >
                    <div className="relative">
                      {user.photoURL ? (
                        <img
                          src={user.photoURL}
                          alt={user.displayName}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gradient-to-r from-indigo-600 to-pink-500 rounded-full flex items-center justify-center">
                          <Users className="w-5 h-5 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">{user.displayName}</p>
                      <p className="text-[10px] font-medium text-slate-400 uppercase tracking-tighter">@{user.username}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex justify-center mb-12">
          <div className="bg-white/70 backdrop-blur-xl border border-white/20 shadow-lg rounded-[2rem] p-2 flex gap-2 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-full font-black text-xs uppercase tracking-[0.3em] transition-all duration-300 whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                      : 'text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        {activeTab === 'trending' && (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-8 auto-rows-[200px] md:auto-rows-[300px]">
            {posts.length === 0 ? (
              <div className="col-span-full text-center py-20">
                <div className="w-24 h-24 bg-slate-100 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6">
                  <TrendingUp className="w-12 h-12 text-slate-300" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-2">No trending posts</h3>
                <p className="text-slate-400 font-medium">Check back later for trending content</p>
              </div>
            ) : (
              Array.isArray(posts) && posts.map((post, index) => {
                // Asymmetric grid pattern
                let cardClass = "group relative rounded-[2rem] overflow-hidden bg-slate-200 cursor-pointer shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500";
                if (index % 7 === 0) cardClass += " col-span-2 row-span-1"; // Wide
                if (index % 11 === 0) cardClass += " col-span-1 row-span-2"; // Tall
                
                return (
                  <div key={post.id || post._id || index} className={cardClass}>
                    {post.media_url ? (
                      post.media_type === 'video' || post.media_url.match(/\.(mp4|mov|avi|webm)$/i) ? (
                        <div className="relative w-full h-full">
                          <video 
                            src={post.media_url} 
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            poster={post.thumbnail_url || undefined}
                            preload="metadata"
                            muted
                          />
                          {/* Video Play Indicator */}
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
                              <div className="w-0 h-0 border-l-[20px] border-l-white border-y-[12px] border-y-transparent ml-1"></div>
                            </div>
                          </div>
                          {/* Video Badge */}
                          <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-full">
                            <span className="text-white text-xs font-bold">VIDEO</span>
                          </div>
                        </div>
                      ) : (
                        <img src={post.media_url} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                      )
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-indigo-100 to-pink-100 flex items-center justify-center">
                        <div className="text-center">
                          <User size={24} className="text-indigo-300 mx-auto mb-2" />
                          <p className="text-xs text-indigo-400 font-medium">Text Post</p>
                        </div>
                      </div>
                    )}
                    
                    {/* Overlay Information */}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-black/0 to-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-6 flex flex-col justify-end">
                      <div className="flex items-center gap-3 mb-3">
                        <img src={post.author_photo || 'https://i.pravatar.cc/150?u=' + post.author_id} className="w-8 h-8 rounded-full border border-white/40" alt="" />
                        <span className="text-white font-bold text-sm tracking-tight">{post.author_username}</span>
                      </div>
                      <p className="text-white/80 text-xs line-clamp-2 leading-relaxed">{post.content}</p>
                    </div>

                    {/* Stats */}
                    <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md border border-white/20 px-3 py-1 rounded-full opacity-100 group-hover:opacity-0 transition-opacity">
                      <span className="text-white text-[10px] font-black tracking-widest uppercase">{post.likes_count || 0}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {activeTab === 'tags' && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {['photography', 'art', 'nature', 'portrait', 'landscape', 'street', 'minimal', 'abstract'].map((tag) => (
              <div key={tag} className="bg-white/70 backdrop-blur-xl border border-white/20 shadow-lg rounded-[2rem] p-8 text-center group cursor-pointer hover:bg-white/90 transition-all duration-300 hover:-translate-y-1">
                <div className="w-16 h-16 bg-gradient-to-r from-indigo-600 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                  <Hash className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-black text-slate-900 text-lg mb-2">#{tag}</h3>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">{Math.floor(Math.random() * 1000)} Posts</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'artists' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {trendingUsers.length === 0 ? (
              <div className="col-span-full text-center py-20">
                <div className="w-24 h-24 bg-slate-100 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6">
                  <Users className="w-12 h-12 text-slate-300" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-2">No artists to discover</h3>
                <p className="text-slate-400 font-medium">Be the first to join the community</p>
              </div>
            ) : (
              trendingUsers.map((user, index) => (
                <div key={user.id || user._id || index} className="bg-white/70 backdrop-blur-xl border border-white/20 shadow-lg rounded-[2rem] p-8 group cursor-pointer hover:bg-white/90 transition-all duration-300 hover:-translate-y-1">
                  <div className="flex items-center gap-6 mb-6">
                    <button onClick={() => navigate(`/profile/${user.id || user._id}`)} className="relative">
                      {user.photoURL ? (
                        <img
                          src={user.photoURL}
                          alt={user.displayName}
                          className="w-16 h-16 rounded-full object-cover border-4 border-white shadow-lg"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gradient-to-r from-indigo-600 to-pink-500 rounded-full flex items-center justify-center border-4 border-white shadow-lg">
                          <Users className="w-8 h-8 text-white" />
                        </div>
                      )}
                    </button>
                    <div className="flex-1">
                      <button onClick={() => navigate(`/profile/${user.id || user._id}`)} className="text-left w-full">
                        <h3 className="font-black text-slate-900 text-lg group-hover:text-indigo-600 transition-colors">
                          {user.displayName}
                        </h3>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">@{user.username}</p>
                        <p className="text-xs text-slate-500 font-medium mt-1">
                          {user.followers_count || 0} Collectors
                        </p>
                      </button>
                    </div>
                  </div>
                  
                  {user.bio && (
                    <p className="text-slate-500 text-sm mb-6 leading-relaxed line-clamp-2">
                      {user.bio}
                    </p>
                  )}
                  
                  <div className="flex justify-between items-center mb-6">
                    <div className="text-center">
                      <p className="font-black text-slate-900 text-lg">{user.posts_count || 0}</p>
                      <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Posts</p>
                    </div>
                    <div className="text-center">
                      <p className="font-black text-slate-900 text-lg">{user.followers_count || 0}</p>
                      <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Collectors</p>
                    </div>
                    <div className="text-center">
                      <p className="font-black text-slate-900 text-lg">{user.following_count || 0}</p>
                      <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Following</p>
                    </div>
                  </div>
                  
                  <button onClick={() => navigate(`/profile/${user.id || user._id}`)} className="block w-full py-4 bg-indigo-600 text-white text-center rounded-full font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-colors">
                    View Studio
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'discover' && (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-slate-100 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6">
              <Compass className="w-12 h-12 text-slate-300" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-2">Discover New Content</h3>
            <p className="text-slate-400 font-medium">Personalized recommendations coming soon</p>
          </div>
        )}
      </div>
    </div>
  );
}