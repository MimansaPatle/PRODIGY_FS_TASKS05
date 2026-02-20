import { useState, useEffect } from 'react';
import { TrendingUp, Hash, Users, Compass, Search, Zap, ArrowLeft, User, Activity } from 'lucide-react';
import { getExplorePosts } from '../services/posts.service';
import { getTrendingUsers, searchUsers } from '../services/users.service';
import { useNavigate } from 'react-router-dom';

const ROSE_GRADIENT = "bg-gradient-to-r from-[#e93e68] to-[#f45d7d]";

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
        const response = await getExplorePosts({ limit: 50 });
        const postsData = response.posts || response || [];
        setPosts(Array.isArray(postsData) ? postsData : []);
      } else if (activeTab === 'artists') {
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
      <div className="min-h-screen bg-[#0a0708] flex items-center justify-center">
        <div className="text-center">
          <div className={`w-16 h-16 ${ROSE_GRADIENT} rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse`}>
            <Zap size={32} fill="white" className="text-white" />
          </div>
          <p className="text-white/40 font-medium">Loading explore...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0708] font-sans text-white selection:bg-[#e93e68] selection:text-white">
      
      {/* Header with Back Button and Logo */}
      <div className="fixed top-8 left-8 z-[110] flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 bg-white/5 backdrop-blur-md rounded-xl hover:bg-white/10 transition-colors border border-white/10"
        >
          <ArrowLeft size={20} className="text-white" />
        </button>
        <div className={`w-10 h-10 ${ROSE_GRADIENT} rounded-2xl flex items-center justify-center text-white shadow-lg shadow-rose-600/20`}>
          <Zap size={22} fill="currentColor" />
        </div>
        <span className="font-black text-xl tracking-tighter uppercase italic text-white">Pixora</span>
      </div>

      <div className="max-w-7xl mx-auto p-6 md:p-12 pt-24">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-2 h-2 bg-rose-500 rounded-full animate-pulse shadow-[0_0_10px_#e93e68]" />
            <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-rose-400/60">Neural Explore</h3>
          </div>
          <h1 className="text-6xl font-black tracking-tighter italic mb-2">Explore.</h1>
          <p className="text-white/40 font-medium text-lg">Discover trending visuals and emerging artists</p>
        </div>

        {/* Search Bar */}
        <div className="mb-12">
          <div className="max-w-md w-full relative">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Artists, aesthetics, or trends..."
              className="w-full px-8 py-5 pl-14 bg-white/5 border border-white/10 rounded-[2rem] outline-none focus:border-[#e93e68] transition-all font-bold text-white placeholder:text-white/20"
            />
            <Activity size={20} className="absolute right-6 top-1/2 -translate-y-1/2 text-white/30" />
          </div>
          
          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="mt-6 bg-[#130f10] border border-white/10 shadow-2xl rounded-[2rem] p-6 max-w-md">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-rose-400/60 mb-4">Search Results</h3>
              <div className="space-y-4">
                {searchResults.map((user, index) => (
                  <button
                    key={user.id || user._id || index}
                    onClick={() => navigate(`/profile/${user.id || user._id}`)}
                    className="w-full flex items-center gap-4 p-3 rounded-2xl hover:bg-white/5 transition-colors group text-left"
                  >
                    <div className="relative">
                      {user.photoURL ? (
                        <img
                          src={user.photoURL}
                          alt={user.displayName}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className={`w-10 h-10 ${ROSE_GRADIENT} rounded-full flex items-center justify-center`}>
                          <Users className="w-5 h-5 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-white text-sm group-hover:text-[#e93e68] transition-colors">{user.displayName}</p>
                      <p className="text-[10px] font-medium text-white/40 uppercase tracking-tighter">@{user.username}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex justify-center mb-12">
          <div className="bg-[#130f10] border border-white/10 shadow-2xl rounded-[2rem] p-2 flex gap-2 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-full font-black text-xs uppercase tracking-[0.3em] transition-all duration-300 whitespace-nowrap ${
                    activeTab === tab.id
                      ? `${ROSE_GRADIENT} text-white shadow-lg shadow-rose-600/20`
                      : 'text-white/40 hover:text-white/70'
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
                <div className="w-24 h-24 bg-white/5 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6">
                  <TrendingUp className="w-12 h-12 text-white/20" />
                </div>
                <h3 className="text-2xl font-black text-white mb-2">No trending posts</h3>
                <p className="text-white/40 font-medium">Check back later for trending content</p>
              </div>
            ) : (
              Array.isArray(posts) && posts.map((post, index) => {
                let cardClass = "group relative rounded-[2rem] overflow-hidden bg-[#130f10] cursor-pointer shadow-sm hover:shadow-[0_0_40px_rgba(233,62,104,0.2)] hover:-translate-y-1 transition-all duration-500 border border-white/5 hover:border-rose-500/30";
                if (index % 7 === 0) cardClass += " col-span-2 row-span-1";
                if (index % 11 === 0) cardClass += " col-span-1 row-span-2";
                
                return (
                  <div key={post.id || post._id || index} className={cardClass} onClick={() => navigate(`/post/${post.id || post._id}`)}>
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
                          <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-full">
                            <span className="text-white text-xs font-bold">VIDEO</span>
                          </div>
                        </div>
                      ) : (
                        <img src={post.media_url} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                      )
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#e93e68]/10 to-[#f45d7d]/10 flex items-center justify-center p-6">
                        <p className="text-white/70 text-sm font-medium leading-relaxed line-clamp-4">{post.content}</p>
                      </div>
                    )}
                    
                    <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-black/0 to-black/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-6 flex flex-col justify-end">
                      <div className="flex items-center gap-3 mb-3">
                        <img src={post.author_photo || 'https://i.pravatar.cc/150?u=' + post.author_id} className="w-8 h-8 rounded-full border border-rose-400/30" alt="" />
                        <span className="text-white font-bold text-sm tracking-tight italic">@{post.author_username}</span>
                      </div>
                      <p className="text-white/80 text-xs line-clamp-2 leading-relaxed">{post.content}</p>
                    </div>

                    <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1 rounded-full opacity-100 group-hover:opacity-0 transition-opacity">
                      <span className="text-rose-400 text-[10px] font-black tracking-widest uppercase">{post.likes_count || 0}</span>
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
              <div key={tag} className="bg-[#130f10] border border-white/10 shadow-2xl rounded-[2rem] p-8 text-center group cursor-pointer hover:border-rose-500/30 transition-all duration-300 hover:-translate-y-1">
                <div className={`w-16 h-16 ${ROSE_GRADIENT} rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-rose-600/20`}>
                  <Hash className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-black text-white text-lg mb-2">#{tag}</h3>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">{Math.floor(Math.random() * 1000)} Posts</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'artists' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {trendingUsers.length === 0 ? (
              <div className="col-span-full text-center py-20">
                <div className="w-24 h-24 bg-white/5 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6">
                  <Users className="w-12 h-12 text-white/20" />
                </div>
                <h3 className="text-2xl font-black text-white mb-2">No artists to discover</h3>
                <p className="text-white/40 font-medium">Be the first to join the community</p>
              </div>
            ) : (
              trendingUsers.map((user, index) => (
                <div key={user.id || user._id || index} className="bg-[#130f10] border border-white/10 shadow-2xl rounded-[2rem] p-8 group cursor-pointer hover:border-rose-500/30 transition-all duration-300 hover:-translate-y-1">
                  <div className="flex items-center gap-6 mb-6">
                    <button onClick={() => navigate(`/profile/${user.id || user._id}`)} className="relative">
                      {user.photoURL ? (
                        <img
                          src={user.photoURL}
                          alt={user.displayName}
                          className="w-16 h-16 rounded-full object-cover border-4 border-[#0a0708] shadow-lg"
                        />
                      ) : (
                        <div className={`w-16 h-16 ${ROSE_GRADIENT} rounded-full flex items-center justify-center border-4 border-[#0a0708] shadow-lg`}>
                          <Users className="w-8 h-8 text-white" />
                        </div>
                      )}
                    </button>
                    <div className="flex-1">
                      <button onClick={() => navigate(`/profile/${user.id || user._id}`)} className="text-left w-full">
                        <h3 className="font-black text-white text-lg group-hover:text-[#e93e68] transition-colors">
                          {user.displayName}
                        </h3>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">@{user.username}</p>
                        <p className="text-xs text-white/60 font-medium mt-1">
                          {user.followers_count || 0} Collectors
                        </p>
                      </button>
                    </div>
                  </div>
                  
                  {user.bio && (
                    <p className="text-white/60 text-sm mb-6 leading-relaxed line-clamp-2">
                      {user.bio}
                    </p>
                  )}
                  
                  <div className="flex justify-between items-center mb-6">
                    <div className="text-center">
                      <p className="font-black text-white text-lg">{user.posts_count || 0}</p>
                      <p className="text-[8px] font-black uppercase text-white/40 tracking-widest">Nodes</p>
                    </div>
                    <div className="text-center">
                      <p className="font-black text-white text-lg">{user.followers_count || 0}</p>
                      <p className="text-[8px] font-black uppercase text-white/40 tracking-widest">Collectors</p>
                    </div>
                    <div className="text-center">
                      <p className="font-black text-white text-lg">{user.following_count || 0}</p>
                      <p className="text-[8px] font-black uppercase text-white/40 tracking-widest">Following</p>
                    </div>
                  </div>
                  
                  <button onClick={() => navigate(`/profile/${user.id || user._id}`)} className={`block w-full py-4 ${ROSE_GRADIENT} text-white text-center rounded-full font-black text-[10px] uppercase tracking-widest shadow-lg shadow-rose-600/20 hover:brightness-110 transition-all`}>
                    View Studio
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'discover' && (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-white/5 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6">
              <Compass className="w-12 h-12 text-white/20 animate-spin-slow" />
            </div>
            <h3 className="text-2xl font-black text-white mb-2">Discover New Content</h3>
            <p className="text-white/40 font-medium">Personalized recommendations coming soon</p>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin-slow { 
          from { transform: rotate(0deg); } 
          to { transform: rotate(360deg); } 
        }
        .animate-spin-slow { 
          animation: spin-slow 12s linear infinite; 
        }
      `}} />
    </div>
  );
}
