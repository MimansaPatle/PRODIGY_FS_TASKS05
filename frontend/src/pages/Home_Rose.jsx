import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Home as HomeIcon, 
  Compass, 
  Plus, 
  Heart, 
  User, 
  MessageCircle, 
  Bookmark, 
  Send, 
  Zap, 
  Hash,
  X,
  Image as ImageIcon,
  Layers,
  Bell,
  Settings,
  Activity,
  Sparkles
} from 'lucide-react';
import { likePost, createPost, deletePost, updatePost, bookmarkPost } from '../services/posts.service';
import { useAuth } from '../context/AuthContext';
import { useFeed } from '../hooks/useFeed';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import LazyImage from '../components/LazyImage';
import SharePostModal from '../components/SharePostModal';
import StoriesBar from '../components/StoriesBar';
import StoryViewer from '../components/StoryViewer';
import CreateStoryModal from '../components/CreateStoryModal';
import TrendingHashtags from '../components/TrendingHashtags';
import MentionAutocomplete from '../components/MentionAutocomplete';
import { 
  SkeletonGrid, 
  InfiniteScrollLoader, 
  EndOfContent, 
  ErrorState, 
  EmptyState 
} from '../components/LoadingStates';

// Rose theme constants
const ROSE_GRADIENT = "bg-gradient-to-r from-[#e93e68] to-[#f45d7d]";
const ROSE_TEXT = "text-[#e93e68]";

// Stream Card Component with Rose Theme
const StreamCard = ({ post, onLike, onDelete, onEdit, onShare, onBookmark, currentUserId }) => {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const isOwner = post.author_id === currentUserId;

  const handleCardClick = () => {
    navigate(`/post/${post.id || post._id}`);
  };

  return (
    <div 
      className="group relative w-full aspect-[4/5] bg-[#130f10] rounded-[3rem] overflow-hidden border border-white/5 hover:border-rose-500/30 transition-all duration-500 shadow-2xl cursor-pointer"
      onClick={handleCardClick}
    >
      {post.media_url ? (
        post.media_type === 'video' || post.media_url.match(/\.(mp4|mov|avi|webm)$/i) ? (
          <video 
            src={post.media_url} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            poster={post.thumbnail_url || undefined}
            preload="metadata"
            muted
          />
        ) : (
          <LazyImage 
            src={post.media_url} 
            alt="" 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        )
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-[#e93e68]/10 to-[#f45d7d]/10 flex items-center justify-center p-8">
          <p className="text-white/70 text-sm font-medium leading-relaxed line-clamp-6">{post.content}</p>
        </div>
      )}
      
      {/* Hover Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#070506]/95 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-8 flex flex-col justify-end">
        <div className="flex items-center gap-3 mb-6">
          {post.author_photo ? (
            <img src={post.author_photo} className="w-8 h-8 rounded-full border border-rose-400/30" alt="" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-rose-500/20 border border-rose-400/30 flex items-center justify-center">
              <User size={16} className="text-rose-400" />
            </div>
          )}
          <span className="text-white font-black text-sm tracking-tighter italic">@{post.author_username}</span>
        </div>
        
        <p className="text-white/70 text-sm font-medium mb-8 leading-relaxed line-clamp-2">{post.content}</p>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6 text-white/40">
            <button 
              onClick={(e) => { 
                e.stopPropagation(); 
                onLike(post.id || post._id); 
              }} 
              className={`transition-all hover:scale-125 ${post.is_liked ? 'text-rose-500' : 'hover:text-white'}`}
            >
              <Heart size={22} fill={post.is_liked ? "currentColor" : "none"} />
            </button>
            <button 
              onClick={(e) => { 
                e.stopPropagation(); 
                navigate(`/post/${post.id || post._id}`); 
              }}
              className="hover:text-white hover:scale-125 transition-all"
            >
              <MessageCircle size={22} />
            </button>
            <button 
              onClick={(e) => { 
                e.stopPropagation(); 
                onShare(post); 
              }}
              className="hover:text-rose-400 hover:scale-125 transition-all"
            >
              <Send size={22} />
            </button>
          </div>
          <button 
            onClick={(e) => { 
              e.stopPropagation(); 
              onBookmark(post.id || post._id); 
            }}
            className={`transition-all ${
              post.is_bookmarked 
                ? 'text-rose-500' 
                : 'text-white/40 hover:text-white'
            }`}
          >
            <Bookmark size={22} fill={post.is_bookmarked ? "currentColor" : "none"} />
          </button>
        </div>
      </div>

      {/* Like Count Badge */}
      <div className="absolute top-6 left-6 flex flex-col gap-2">
        <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2 text-[10px] font-black text-rose-400 tracking-widest uppercase">
          <Layers size={12} /> {post.likes_count || 0}
        </div>
      </div>

      {/* Owner Menu */}
      {isOwner && (
        <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="p-2 bg-black/60 backdrop-blur-md rounded-full text-white hover:bg-black/80 transition-colors"
          >
            <Settings size={16} />
          </button>
          
          {showMenu && (
            <div className="absolute top-12 right-0 bg-[#130f10] rounded-xl shadow-lg border border-white/10 py-2 min-w-[120px] z-10">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(post.id || post._id);
                  setShowMenu(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-white/70 hover:bg-white/5 transition-colors"
              >
                Edit Post
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm('Are you sure you want to delete this post?')) {
                    onDelete(post.id || post._id);
                  }
                  setShowMenu(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 transition-colors"
              >
                Delete Post
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Create Overlay Component - Reusing existing logic with rose theme
const CreateOverlay = ({ onClose, onPost, editingPost }) => {
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState('');
  const [caption, setCaption] = useState('');
  const [tags, setTags] = useState([]);
  const [mentionedUsers, setMentionedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingPost) {
      setCaption(editingPost.content || '');
      setMediaPreview(editingPost.media_url || '');
      setTags(editingPost.tags || []);
    }
  }, [editingPost]);

  const handleFileSelect = (file) => {
    if (!file) return;
    setMediaFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setMediaPreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) handleFileSelect(files[0]);
  };

  const handlePost = async () => {
    if (!caption.trim()) {
      setError('Please add a caption for your post.');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const mentionIds = mentionedUsers.map(u => u.id || u._id);
      await onPost({ content: caption, mediaFile, tags, mentions: mentionIds });
      onClose();
    } catch (error) {
      console.error('Error creating post:', error);
      setError(error.message || 'Failed to save post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleMention = (user) => {
    const userId = user.id || user._id;
    if (!mentionedUsers.find(u => (u.id || u._id) === userId)) {
      setMentionedUsers([...mentionedUsers, user]);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      <div className="relative bg-[#130f10] w-full max-w-4xl h-[75vh] rounded-[3.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row border border-rose-500/10">
        <button onClick={onClose} className="absolute top-6 right-6 z-10 p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
          <X size={20} className="text-white" />
        </button>
        
        <div className="w-full md:w-3/5 bg-[#070506] flex items-center justify-center p-8 border-b md:border-b-0 md:border-r border-white/5">
          {mediaPreview ? (
            <div className="relative w-full h-full">
              {mediaFile?.type.startsWith('video/') ? (
                <video src={mediaPreview} className="w-full h-full object-contain rounded-2xl" controls />
              ) : (
                <img src={mediaPreview} className="w-full h-full object-contain rounded-2xl" alt="Preview" />
              )}
              <button
                onClick={() => { setMediaFile(null); setMediaPreview(''); }}
                className="absolute top-4 right-4 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <div 
              className={`w-full h-full border-2 border-dashed rounded-2xl flex flex-col items-center justify-center transition-colors cursor-pointer ${
                isDragging ? 'border-rose-500 bg-rose-500/5' : 'border-white/10 hover:border-rose-500/30'
              }`}
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
              onClick={() => document.getElementById('file-input').click()}
            >
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto">
                  <ImageIcon size={28} className="text-white/20" />
                </div>
                <input
                  id="file-input"
                  type="file"
                  accept="image/*,video/*"
                  onChange={(e) => handleFileSelect(e.target.files[0])}
                  className="hidden"
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 p-10 flex flex-col bg-[#130f10]">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic">Share Insight</h2>
          </div>
          
          <MentionAutocomplete
            value={caption}
            onChange={setCaption}
            onMention={handleMention}
            placeholder="The storytelling signal begins here..."
            className="flex-1 w-full bg-transparent outline-none resize-none font-bold text-white/60 placeholder:text-white/10 text-lg border border-white/10 rounded-2xl p-4"
          />
          
          {error && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm font-medium">
              {error}
            </div>
          )}
          
          <button 
            onClick={handlePost}
            disabled={loading || !caption.trim()}
            className={`w-full py-5 ${ROSE_GRADIENT} text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-rose-600/20 mt-4 hover:brightness-110 transition-all disabled:opacity-50`}
          >
            {loading ? 'Processing...' : editingPost ? 'Update' : 'Publish'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Navigation Rail Component
const NavigationRail = ({ activeTab, setTab, onLogout, userProfile }) => {
  const navigate = useNavigate();
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    const loadUnreadCounts = async () => {
      try {
        const { getUnreadMessagesCount } = await import('../services/messages.service');
        const { getUnreadCount } = await import('../services/notifications.service');
        
        const [messagesCount, notificationsCount] = await Promise.all([
          getUnreadMessagesCount(),
          getUnreadCount()
        ]);
        
        setUnreadMessages(messagesCount);
        setUnreadNotifications(notificationsCount);
      } catch (error) {
        console.error('Error loading unread counts:', error);
      }
    };

    loadUnreadCounts();
    const interval = setInterval(loadUnreadCounts, 30000);
    return () => clearInterval(interval);
  }, []);

  const items = [
    { id: 'home', icon: HomeIcon, label: 'Stream', action: () => setTab('home') },
    { id: 'explore', icon: Compass, label: 'Neural', action: () => navigate('/explore') },
    { id: 'messages', icon: MessageCircle, label: 'Messages', action: () => navigate('/messages'), badge: unreadMessages },
    { id: 'notifications', icon: Bell, label: 'Pulse', action: () => navigate('/notifications'), badge: unreadNotifications },
    { id: 'profile', icon: User, label: 'Profile', action: () => navigate(`/profile/${userProfile?.id || userProfile?._id}`) },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-20 md:w-24 bg-[#070506] border-r border-white/5 flex flex-col items-center py-10 z-[100]">
      <div className={`w-12 h-12 ${ROSE_GRADIENT} rounded-xl flex items-center justify-center text-white mb-16 shadow-lg shadow-rose-600/20`}>
        <Zap size={24} fill="currentColor" />
      </div>
      
      <nav className="flex flex-col gap-10 flex-1">
        {items.map(item => (
          <button
            key={item.id}
            onClick={item.action}
            className={`group relative flex flex-col items-center gap-2 transition-all ${
              activeTab === item.id ? ROSE_TEXT : 'text-white/20 hover:text-white/60'
            }`}
          >
            <div className="relative">
              <item.icon size={26} strokeWidth={activeTab === item.id ? 2.5 : 2} />
              {item.badge > 0 && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                  {item.badge > 9 ? '9+' : item.badge}
                </div>
              )}
            </div>
            <span className="text-[8px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
              {item.label}
            </span>
            {activeTab === item.id && (
              <div className="absolute left-[-24px] w-1 h-8 bg-[#e93e68] rounded-r-full shadow-[0_0_15px_#e93e68]" />
            )}
          </button>
        ))}
      </nav>
      
      <button onClick={onLogout} className="text-white/20 hover:text-rose-400 transition-colors p-4">
        <Settings size={22} />
      </button>
    </aside>
  );
};

// Right Panel - Pulse Activity
const PulseActivity = () => (
  <aside className="hidden lg:flex flex-col w-72 h-screen sticky top-0 bg-[#0a0708] border-l border-white/5 p-8 pt-12 overflow-y-auto">
    <div className="flex items-center justify-between mb-10">
      <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-rose-300/40">The Pulse</h3>
      <Activity size={16} className="text-[#f45d7d]" />
    </div>
    
    <div className="space-y-8">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="flex gap-4 group cursor-pointer">
          <div className="w-10 h-10 rounded-xl bg-[#130f10] overflow-hidden border border-white/5">
            <img src={`https://i.pravatar.cc/100?u=${i + 60}`} className="w-full h-full object-cover opacity-50 group-hover:opacity-100 transition-all" alt="" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold text-white group-hover:text-[#e93e68] transition-colors truncate">node_rose_{i}</p>
            <p className="text-[10px] text-white/30 font-medium">Shared Insight • {i}h</p>
          </div>
        </div>
      ))}
    </div>
    
    <div className="mt-auto bg-[#e93e68]/5 border border-[#e93e68]/10 p-6 rounded-[2rem] relative overflow-hidden">
      <div className="absolute top-[-20px] right-[-20px] opacity-10 text-[#e93e68]">
        <Sparkles size={80} />
      </div>
      <h4 className="font-black text-white text-sm mb-2">Neural Rose</h4>
      <p className="text-[10px] text-rose-300/50 leading-relaxed font-bold uppercase tracking-widest mb-4">Upscale your vision.</p>
      <button className={`w-full py-2.5 ${ROSE_GRADIENT} text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-rose-600/20`}>
        Activate
      </button>
    </div>
  </aside>
);

// Main Home Component
export default function Home() {
  const [activeTab, setActiveTab] = useState('home');
  const [activeView, setActiveView] = useState('explore');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [sharePost, setSharePost] = useState(null);
  const [showStoryViewer, setShowStoryViewer] = useState(false);
  const [currentUserStory, setCurrentUserStory] = useState(null);
  const [showCreateStory, setShowCreateStory] = useState(false);
  const [allStories, setAllStories] = useState([]);
  const { userProfile, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const feedData = useFeed(activeView);
  const {
    posts,
    loading,
    hasMore,
    error,
    loadMore,
    updatePost: updateFeedPost,
    addPost,
    refresh
  } = feedData;

  useInfiniteScroll(loadMore, hasMore, loading);

  useEffect(() => {
    if (location.state?.editPost) {
      setEditingPost(location.state.editPost);
      setIsCreateOpen(true);
      navigate(location.pathname, { replace: true });
    }
  }, [location.state, navigate, location.pathname]);

  useEffect(() => {
    refresh();
  }, [activeView, refresh]);

  const handleLike = async (postId) => {
    try {
      const result = await likePost(postId);
      updateFeedPost(postId, {
        is_liked: result.liked,
        likes_count: result.liked ? 
          (posts.find(p => (p.id || p._id) === postId)?.likes_count || 0) + 1 :
          (posts.find(p => (p.id || p._id) === postId)?.likes_count || 0) - 1
      });
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleBookmark = async (postId) => {
    try {
      const result = await bookmarkPost(postId);
      updateFeedPost(postId, {
        is_bookmarked: result.bookmarked
      });
    } catch (error) {
      console.error('Error bookmarking post:', error);
    }
  };

  const handleCreatePost = async (postData) => {
    try {
      if (editingPost) {
        await updatePost(
          editingPost.id || editingPost._id,
          postData.content,
          postData.tags,
          postData.mediaFile,
          postData.mediaFile?.thumbnailDataUrl || null,
          editingPost.media_url,
          postData.mentions || []
        );
        refresh();
        setEditingPost(null);
      } else {
        const newPost = await createPost(
          postData.content,
          postData.tags,
          postData.mediaFile,
          postData.mediaFile?.thumbnailDataUrl || null,
          postData.mentions || []
        );
        addPost(newPost);
      }
    } catch (error) {
      console.error('Error saving post:', error);
      throw error;
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleDeletePost = async (postId) => {
    try {
      await deletePost(postId);
      refresh();
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Failed to delete post. Please try again.');
    }
  };

  const handleEditPost = (postId) => {
    const post = posts.find(p => (p.id || p._id) === postId);
    if (post) {
      setEditingPost(post);
      setIsCreateOpen(true);
    }
  };

  const handleSharePost = (post) => {
    setSharePost(post);
  };

  const handleViewStory = (userStory, stories) => {
    const storiesWithId = userStory.stories.map(story => ({
      ...story,
      id: story.id || story._id
    }));
    
    const allStoriesWithId = stories.map(s => ({
      ...s,
      stories: s.stories.map(story => ({
        ...story,
        id: story.id || story._id
      }))
    }));
    
    setCurrentUserStory({ ...userStory, stories: storiesWithId });
    setAllStories(allStoriesWithId);
    setShowStoryViewer(true);
  };

  const handleCreateStory = () => {
    setShowCreateStory(true);
  };

  const handleStoryNavigate = (newUserStory, startIndex = 0) => {
    const storiesWithId = newUserStory.stories.map(story => ({
      ...story,
      id: story.id || story._id
    }));
    
    setCurrentUserStory({ 
      ...newUserStory, 
      stories: storiesWithId,
      startIndex 
    });
  };

  if (loading && posts.length === 0 && !error) {
    return (
      <div className="min-h-screen bg-[#0a0708] flex items-center justify-center">
        <div className="text-center">
          <div className={`w-16 h-16 ${ROSE_GRADIENT} rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse`}>
            <Zap size={32} fill="white" className="text-white" />
          </div>
          <p className="text-white/40 font-medium">Loading your feed...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0708] flex text-white font-sans selection:bg-[#e93e68] selection:text-white">
      <NavigationRail 
        activeTab={activeTab} 
        setTab={setActiveTab} 
        onLogout={handleLogout}
        userProfile={userProfile}
      />
      
      <main className="flex-1 ml-20 md:ml-24 flex min-w-0">
        <div className="flex-1 p-6 md:p-12 pb-32 overflow-y-auto">
          <div className="max-w-4xl mx-auto space-y-16">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-20 animate-in fade-in slide-in-from-top-4 duration-700">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 bg-rose-500 rounded-full animate-pulse shadow-[0_0_10px_#e93e68]" />
                  <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-rose-400/60">Insight Stream</h3>
                </div>
                <h1 className="text-6xl md:text-8xl font-black tracking-tighter italic">Stream.</h1>
              </div>
              
              <div className="flex gap-4">
                <button 
                  onClick={() => setActiveView('explore')}
                  className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
                    activeView === 'explore' 
                      ? `${ROSE_GRADIENT} text-white shadow-lg shadow-rose-600/20` 
                      : 'bg-[#130f10] text-white/40 border border-white/5 hover:border-rose-500/30'
                  }`}
                >
                  Explore
                </button>
                <button 
                  onClick={() => setActiveView('following')}
                  className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
                    activeView === 'following' 
                      ? `${ROSE_GRADIENT} text-white shadow-lg shadow-rose-600/20` 
                      : 'bg-[#130f10] text-white/40 border border-white/5 hover:border-rose-500/30'
                  }`}
                >
                  Following
                </button>
                <button 
                  onClick={() => setIsCreateOpen(true)}
                  className={`px-8 ${ROSE_GRADIENT} text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-rose-600/20 hover:scale-[0.98] transition-all`}
                >
                  Publish
                </button>
              </div>
            </header>

            {/* Stories Bar */}
            <StoriesBar 
              onCreateStory={handleCreateStory}
              onViewStory={(userStory, stories) => handleViewStory(userStory, stories)}
            />

            {/* Error State */}
            {error && (
              <ErrorState 
                error={error}
                onRetry={refresh}
                title="Failed to load posts"
                description="Something went wrong while loading your feed."
              />
            )}

            {/* Empty State */}
            {!loading && !error && posts.length === 0 && (
              <EmptyState
                title={activeView === 'following' ? 'No posts from people you follow' : 'No posts found'}
                description={
                  activeView === 'following' 
                    ? 'Follow some users to see their posts here, or switch to Explore to see all posts.' 
                    : 'Try adjusting your filters or check back later.'
                }
                onReset={() => {
                  if (activeView === 'following') {
                    setActiveView('explore');
                  }
                }}
              />
            )}

            {/* Posts Grid */}
            {!error && posts.length > 0 && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 pb-20">
                  {posts.map((post, idx) => (
                    <div key={post.id || post._id || idx} className={`${idx % 2 === 1 ? 'md:translate-y-24' : ''}`}>
                      <StreamCard 
                        post={post} 
                        onLike={handleLike}
                        onDelete={handleDeletePost}
                        onEdit={handleEditPost}
                        onShare={handleSharePost}
                        onBookmark={handleBookmark}
                        currentUserId={userProfile?.id}
                      />
                    </div>
                  ))}
                </div>
                
                {loading && posts.length > 0 && (
                  <InfiniteScrollLoader className="mt-8" />
                )}

                {!loading && !hasMore && posts.length > 0 && (
                  <EndOfContent className="mt-12 mb-32" />
                )}
              </>
            )}

            {loading && posts.length === 0 && (
              <SkeletonGrid count={6} />
            )}
          </div>
        </div>
        
        <PulseActivity />
      </main>

      {/* Overlays */}
      {isCreateOpen && (
        <CreateOverlay 
          onClose={() => {
            setIsCreateOpen(false);
            setEditingPost(null);
          }} 
          onPost={handleCreatePost}
          editingPost={editingPost}
        />
      )}
      {sharePost && (
        <SharePostModal
          post={sharePost}
          onClose={() => setSharePost(null)}
          onShare={(count) => alert(`Post shared with ${count} ${count === 1 ? 'person' : 'people'}!`)}
        />
      )}
      {showStoryViewer && currentUserStory && (
        <StoryViewer
          userStory={currentUserStory}
          allStories={allStories}
          onClose={() => setShowStoryViewer(false)}
          onNavigate={handleStoryNavigate}
        />
      )}
      {showCreateStory && (
        <CreateStoryModal
          onClose={() => setShowCreateStory(false)}
          onSuccess={refresh}
        />
      )}

      {/* Custom Animations */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin-slow { 
          from { transform: rotate(0deg); } 
          to { transform: rotate(360deg); } 
        }
        .animate-spin-slow { 
          animation: spin-slow 12s linear infinite; 
        }
        @keyframes fade-in { 
          from { opacity: 0; } 
          to { opacity: 1; } 
        }
        .animate-in { 
          animation: fade-in 0.8s ease-out forwards; 
        }
      `}} />
    </div>
  );
}
