import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Home as HomeIcon, 
  Search, 
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
  Command,
  Tag,
  Bell
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

const PinterestCard = ({ post, onLike, onDelete, onEdit, onShare, onBookmark, currentUserId }) => {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);

  const handleCardClick = () => {
    navigate(`/post/${post.id || post._id}`);
  };

  const isOwner = post.author_id === currentUserId;

  return (
    <div 
      className="group relative rounded-2xl overflow-hidden bg-gray-100 cursor-pointer hover:shadow-lg transition-all duration-300 w-full"
      onClick={handleCardClick}
    >
      {post.media_url ? (
        post.media_type === 'video' || post.media_url.match(/\.(mp4|mov|avi|webm)$/i) ? (
          <div className="relative w-full">
            <video 
              src={post.media_url} 
              className="w-full h-auto object-cover"
              poster={post.thumbnail_url || undefined}
              preload="metadata"
              muted
            />
            {/* Video Badge */}
            <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-full">
              <span className="text-white text-xs font-bold">VIDEO</span>
            </div>
          </div>
        ) : (
          <div className="relative w-full">
            <LazyImage 
              src={post.media_url} 
              alt="" 
              className="w-full h-auto object-cover"
            />
          </div>
        )
      ) : (
        <div className="w-full aspect-square bg-gradient-to-br from-indigo-100 to-pink-100 flex items-center justify-center">
          <div className="text-center p-8">
            <ImageIcon size={32} className="text-indigo-300 mx-auto mb-2" />
            <p className="text-sm text-indigo-400 font-medium">Text Post</p>
            <p className="text-xs text-indigo-300 mt-2 line-clamp-3">{post.content}</p>
          </div>
        </div>
      )}
      
      {/* Hover Overlay */}
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-4">
        {/* Top Row - Menu */}
        <div className="flex justify-end">
          {isOwner && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-colors"
            >
              <Command size={16} />
            </button>
          )}
          
          {showMenu && (
            <div className="absolute top-12 right-0 bg-white rounded-xl shadow-lg border border-gray-100 py-2 min-w-[120px] z-10">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(post.id || post._id);
                  setShowMenu(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-600 hover:bg-gray-50 transition-colors"
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
                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                Delete Post
              </button>
            </div>
          )}
        </div>

        {/* Bottom Row - Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={(e) => { 
                e.stopPropagation(); 
                onLike(post.id || post._id); 
              }} 
              className={`p-2 rounded-full transition-all ${
                post.is_liked 
                  ? 'bg-pink-500 text-white' 
                  : 'bg-white/20 backdrop-blur-sm text-white hover:bg-white/30'
              }`}
            >
              <Heart size={16} fill={post.is_liked ? "currentColor" : "none"} />
            </button>
            <button 
              onClick={(e) => { 
                e.stopPropagation(); 
                navigate(`/post/${post.id || post._id}`); 
              }}
              className="p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-colors"
            >
              <MessageCircle size={16} />
            </button>
            <button 
              onClick={(e) => { 
                e.stopPropagation(); 
                onShare(post); 
              }}
              className="p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-colors"
            >
              <Send size={16} />
            </button>
          </div>
          <button 
            onClick={(e) => { 
              e.stopPropagation(); 
              onBookmark(post.id || post._id); 
            }}
            className={`p-2 rounded-full transition-all ${
              post.is_bookmarked 
                ? 'bg-indigo-500 text-white' 
                : 'bg-white/20 backdrop-blur-sm text-white hover:bg-white/30'
            }`}
          >
            <Bookmark size={16} fill={post.is_bookmarked ? "currentColor" : "none"} />
          </button>
        </div>
      </div>

      {/* Like Count Badge */}
      <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full opacity-100 group-hover:opacity-0 transition-opacity">
        <span className="text-gray-700 text-xs font-semibold">{post.likes_count || 0}</span>
      </div>
    </div>
  );
};

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

  // Initialize form with editing post data
  useEffect(() => {
    if (editingPost) {
      setCaption(editingPost.content || '');
      setMediaPreview(editingPost.media_url || '');
      setTags(editingPost.tags || []);
    }
  }, [editingPost]);

  const validateFile = (file) => {
    const maxVideoSize = 50 * 1024 * 1024; // 50MB
    const maxImageSize = 10 * 1024 * 1024; // 10MB
    
    if (file.type.startsWith('video/')) {
      if (file.size > maxVideoSize) {
        throw new Error('Video file too large. Maximum size: 50MB');
      }
    } else if (file.type.startsWith('image/')) {
      if (file.size > maxImageSize) {
        throw new Error('Image file too large. Maximum size: 10MB');
      }
    } else {
      throw new Error('Unsupported file type. Please use images or videos.');
    }
  };

  const generateVideoThumbnail = (videoFile) => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      video.onloadedmetadata = () => {
        // Set canvas dimensions
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Seek to 1 second or 10% of video duration, whichever is smaller
        const seekTime = Math.min(1, video.duration * 0.1);
        video.currentTime = seekTime;
      };
      
      video.onseeked = () => {
        try {
          // Draw video frame to canvas
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          // Convert canvas to base64
          const thumbnailDataUrl = canvas.toDataURL('image/jpeg', 0.8);
          resolve(thumbnailDataUrl);
        } catch (error) {
          reject(error);
        } finally {
          // Clean up
          video.src = '';
          video.load();
        }
      };
      
      video.onerror = () => {
        reject(new Error('Failed to load video for thumbnail generation'));
      };
      
      // Load video
      video.src = URL.createObjectURL(videoFile);
      video.load();
    });
  };

  const handleFileSelect = (file) => {
    setError('');
    
    if (!file) return;
    
    try {
      validateFile(file);
      setMediaFile(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setMediaPreview(e.target.result);
      };
      reader.readAsDataURL(file);
      
      // Show file info
      const sizeMB = (file.size / 1024 / 1024).toFixed(2);
      setUploadProgress(`File selected: ${file.name} (${sizeMB}MB)`);
      
      // Generate thumbnail for videos
      if (file.type.startsWith('video/')) {
        setUploadProgress(`Generating video thumbnail...`);
        generateVideoThumbnail(file)
          .then(thumbnail => {
            // Store thumbnail for later use
            file.thumbnailDataUrl = thumbnail;
            setUploadProgress(`Video thumbnail generated successfully`);
          })
          .catch(error => {
            console.error('Error generating thumbnail:', error);
            setUploadProgress(`Video selected (thumbnail generation failed)`);
          });
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleFileInput = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

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

  const handleMention = (user) => {
    const userId = user.id || user._id;
    if (!mentionedUsers.find(u => (u.id || u._id) === userId)) {
      setMentionedUsers([...mentionedUsers, user]);
    }
  };

  const removeMention = (userId) => {
    setMentionedUsers(mentionedUsers.filter(u => (u.id || u._id) !== userId));
  };

  const handlePost = async () => {
    if (!caption.trim()) {
      setError('Please add a caption for your post.');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      if (mediaFile) {
        const sizeMB = (mediaFile.size / 1024 / 1024).toFixed(2);
        setUploadProgress(`Processing ${mediaFile.type.startsWith('video/') ? 'video' : 'image'}... (${sizeMB}MB)`);
      }
      
      const mentionIds = mentionedUsers.map(u => u.id || u._id);
      await onPost({ content: caption, mediaFile, tags, mentions: mentionIds });
      onClose();
    } catch (error) {
      console.error('Error creating post:', error);
      setError(error.message || 'Failed to save post. Please try again.');
    } finally {
      setLoading(false);
      setUploadProgress('');
    }
  };

  const removeMedia = () => {
    setMediaFile(null);
    setMediaPreview('');
    setUploadProgress('');
    setError('');
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={onClose} />
      <div className="relative bg-white w-full max-w-4xl h-[80vh] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col md:flex-row">
        <button onClick={onClose} className="absolute top-6 right-6 z-10 p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors"><X size={20} /></button>
        
        <div className="w-full md:w-3/5 bg-slate-50 flex items-center justify-center border-b md:border-b-0 md:border-r border-slate-100 p-8">
          {mediaPreview ? (
            <div className="relative w-full h-full">
              {mediaFile?.type.startsWith('video/') ? (
                <video 
                  src={mediaPreview} 
                  className="w-full h-full object-contain rounded-2xl" 
                  controls
                />
              ) : (
                <img 
                  src={mediaPreview} 
                  className="w-full h-full object-contain rounded-2xl" 
                  alt="Preview" 
                />
              )}
              <button
                onClick={removeMedia}
                className="absolute top-4 right-4 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <div 
              className={`w-full h-full border-2 border-dashed rounded-2xl flex flex-col items-center justify-center transition-colors cursor-pointer ${
                isDragging 
                  ? 'border-indigo-500 bg-indigo-50' 
                  : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-100'
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => document.getElementById('file-input').click()}
            >
              <div className="text-center space-y-4">
                <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto shadow-sm">
                  <ImageIcon size={32} className="text-slate-300" />
                </div>
                <div>
                  <p className="text-lg font-bold text-slate-600 mb-2">Drop your media here</p>
                  <p className="text-sm text-slate-400 mb-4">or click to browse</p>
                  <div className="px-6 py-3 bg-indigo-600 text-white rounded-full text-sm font-bold hover:bg-indigo-700 transition-colors inline-block">
                    Choose File
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-xs text-slate-400">Supports: JPG, PNG, GIF, MP4, MOV</p>
                  <p className="text-xs text-slate-400 mt-1">Max: 10MB for images, 50MB for videos</p>
                </div>
              </div>
              <input
                id="file-input"
                type="file"
                accept="image/*,video/*"
                onChange={handleFileInput}
                className="hidden"
              />
            </div>
          )}
        </div>

        <div className="flex-1 p-10 flex flex-col">
          <h2 className="text-2xl font-black text-slate-900 mb-8">
            {editingPost ? 'Edit Post' : 'Share Insight'}
          </h2>
          <MentionAutocomplete
            value={caption}
            onChange={setCaption}
            onMention={handleMention}
            placeholder="What's the story behind this piece? (Type @ to mention someone)"
            className="flex-1 w-full bg-transparent outline-none resize-none font-medium text-slate-600 border border-slate-200 rounded-2xl p-4"
          />
          
          {/* Mentioned Users */}
          {mentionedUsers.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Mentioned:</p>
              <div className="flex flex-wrap gap-2">
                {mentionedUsers.map(user => (
                  <div
                    key={user.id || user._id}
                    className="flex items-center gap-2 px-3 py-2 bg-indigo-50 rounded-full"
                  >
                    {user.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt={user.username}
                        className="w-5 h-5 rounded-full"
                      />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-indigo-400 flex items-center justify-center">
                        <User className="w-3 h-3 text-white" />
                      </div>
                    )}
                    <span className="text-sm font-bold text-indigo-700">@{user.username}</span>
                    <button
                      type="button"
                      onClick={() => removeMention(user.id || user._id)}
                      className="text-indigo-400 hover:text-indigo-600"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Tags Display */}
          {tags.length > 0 && (
            <div className="mb-4">
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
          
          {/* Progress Display */}
          {uploadProgress && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 text-blue-600 rounded-xl text-sm font-medium">
              {uploadProgress}
            </div>
          )}
          
          <div className="pt-8 border-t border-slate-100 flex items-center justify-between">
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
               onClick={handlePost}
               disabled={loading || !caption.trim()}
               className="px-8 py-3 bg-indigo-600 text-white rounded-full font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-600/30 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-700 transition-colors"
              >
               {loading ? (uploadProgress ? 'Processing...' : 'Saving...') : editingPost ? 'Update Post' : 'Publish Post'}
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Expandable Navigation Menu Component
const ExpandableNavMenu = ({ onNavigate, userProfile, onCreatePost }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  // Import the count functions
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
    
    // Refresh counts every 30 seconds
    const interval = setInterval(loadUnreadCounts, 30000);
    return () => clearInterval(interval);
  }, []);

  const menuItems = [
    { 
      id: 'messages', 
      icon: MessageCircle, 
      action: () => onNavigate('/messages'),
      position: 'top-left',
      badge: unreadMessages
    },
    { 
      id: 'search', 
      icon: Search, 
      action: () => onNavigate('/explore'),
      position: 'left'
    },
    { 
      id: 'notifications', 
      icon: Bell, 
      action: () => onNavigate('/notifications'),
      position: 'top-right',
      badge: unreadNotifications
    },
    { 
      id: 'profile', 
      icon: User, 
      action: () => onNavigate(`/profile/${userProfile?.id || userProfile?._id}`),
      position: 'right'
    }
  ];

  const getPositionClasses = (position, isExpanded) => {
    const baseClasses = "absolute transition-all duration-300 ease-out";
    
    if (!isExpanded) {
      return `${baseClasses} opacity-0 scale-0 translate-x-0 translate-y-0 pointer-events-none`;
    }

    switch (position) {
      case 'left':
        return `${baseClasses} opacity-100 scale-100 -translate-x-20 translate-y-0 pointer-events-auto`;
      case 'top-left':
        return `${baseClasses} opacity-100 scale-100 -translate-x-14 -translate-y-14 pointer-events-auto`;
      case 'top-right':
        return `${baseClasses} opacity-100 scale-100 translate-x-14 -translate-y-14 pointer-events-auto`;
      case 'right':
        return `${baseClasses} opacity-100 scale-100 translate-x-20 translate-y-0 pointer-events-auto`;
      default:
        return `${baseClasses} opacity-0 scale-0 pointer-events-none`;
    }
  };

  return (
    <div 
      className="relative"
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      {/* Expanded Hover Area - Invisible larger area for easier interaction */}
      <div className={`absolute inset-0 ${isExpanded ? 'w-72 h-64 -left-36 -top-36' : 'w-24 h-24 -left-5 -top-5'} transition-all duration-300`} />
      
      {/* Expanded Menu Items */}
      {menuItems.map((item) => (
        <div key={item.id} className={getPositionClasses(item.position, isExpanded)}>
          <button
            onClick={item.action}
            className="relative w-12 h-12 bg-white hover:bg-gray-50 text-gray-600 hover:text-indigo-600 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center z-10"
          >
            <item.icon size={20} />
            
            {/* Badge for unread count */}
            {item.badge > 0 && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                {item.badge > 99 ? '99+' : item.badge}
              </div>
            )}
          </button>
        </div>
      ))}

      {/* Central Plus Button */}
      <button
        onClick={onCreatePost}
        className={`relative w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center z-10 ${
          isExpanded ? 'rotate-45' : 'rotate-0'
        }`}
      >
        <Plus size={24} />
      </button>
    </div>
  );
};

export default function Home() {
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

  // Use our new feed management hook
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

  // Set up infinite scroll
  useInfiniteScroll(loadMore, hasMore, loading);

  // Check for edit mode from Profile page
  useEffect(() => {
    if (location.state?.editPost) {
      setEditingPost(location.state.editPost);
      setIsCreateOpen(true);
      // Clear the state to prevent re-opening on refresh
      navigate(location.pathname, { replace: true });
    }
  }, [location.state, navigate, location.pathname]);

  // Reload when switching between explore/following
  useEffect(() => {
    refresh();
  }, [activeView, refresh]);

  const handleViewChange = (view) => {
    setActiveView(view);
  };

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
          editingPost.media_url, // Pass existing media URL
          postData.mentions || [] // Pass mentions
        );
        refresh();
        setEditingPost(null);
      } else {
        const newPost = await createPost(
          postData.content,
          postData.tags,
          postData.mediaFile,
          postData.mediaFile?.thumbnailDataUrl || null,
          postData.mentions || [] // Pass mentions
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

  const handleRetry = () => {
    refresh();
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

  const handleShareComplete = (count) => {
    alert(`Post shared with ${count} ${count === 1 ? 'person' : 'people'}!`);
  };

  const handleViewStory = (userStory, stories) => {
    // Ensure stories have proper id field
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
    // Ensure stories have proper id field
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

  const handleStorySuccess = () => {
    // Refresh stories bar
    refresh();
  };

  // Show loading state only for initial load
  if (loading && posts.length === 0 && !error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Zap size={32} fill="white" className="text-white" />
          </div>
          <p className="text-slate-400 font-medium">Loading your feed...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-white">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white">
            <Zap size={22} fill="currentColor" />
          </div>
          <span className="font-black text-xl tracking-tighter uppercase italic text-indigo-600">VOIS</span>
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            <button 
              onClick={() => setActiveView('explore')}
              className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all ${
                activeView === 'explore' 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-indigo-50 hover:text-indigo-600'
              }`}
            >
              Explore
            </button>
            <button 
              onClick={() => setActiveView('following')}
              className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all ${
                activeView === 'following' 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-indigo-50 hover:text-indigo-600'
              }`}
            >
              Following
            </button>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2.5 text-red-600 hover:text-red-700 transition-colors text-sm font-semibold"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Content with Sidebar */}
      <div className="flex gap-8 px-6 pb-32">
        {/* Main Feed */}
        <main className="flex-1">
          {/* Title Section */}
          <div className="mb-8">
            <h1 className="text-5xl font-black text-black mb-2">Discover</h1>
            <p className="text-gray-500 text-lg">Curation for the visually inspired.</p>
          </div>

          {/* Stories Bar */}
          <StoriesBar 
            onCreateStory={handleCreateStory}
            onViewStory={(userStory, stories) => handleViewStory(userStory, stories)}
          />

          {/* Error State */}
          {error && (
            <ErrorState 
              error={error}
              onRetry={handleRetry}
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
              <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
                {posts.map((post, index) => (
                  <div key={post.id || post._id || index} className="break-inside-avoid mb-4">
                    <PinterestCard 
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
              
              {/* Loading States */}
              {loading && posts.length > 0 && (
                <InfiniteScrollLoader className="mt-8" />
              )}

              {/* End of Content */}
              {!loading && !hasMore && posts.length > 0 && (
                <EndOfContent className="mt-12 mb-32" />
              )}
            </>
          )}

          {/* Loading States */}
          {loading && posts.length === 0 && (
            <SkeletonGrid count={6} />
          )}
        </main>

        {/* Sidebar - Trending Hashtags */}
        <aside className="hidden xl:block w-80 sticky top-4 h-fit">
          <TrendingHashtags limit={10} />
        </aside>
      </div>

      {/* Expandable Navigation Menu */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
        <ExpandableNavMenu 
          onNavigate={navigate}
          userProfile={userProfile}
          onCreatePost={() => setIsCreateOpen(true)}
        />
      </div>

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
          onShare={handleShareComplete}
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
          onSuccess={handleStorySuccess}
        />
      )}
    </div>
  );
}