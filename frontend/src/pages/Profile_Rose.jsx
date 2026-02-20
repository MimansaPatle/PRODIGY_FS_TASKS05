import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Settings, Grid, Bookmark, Heart, Zap, ArrowLeft, Edit, Trash2, MoreHorizontal, X, ImageIcon, Hash, Tag, Lock, Ban } from 'lucide-react';
import { getUserProfile, getUserPosts, toggleFollowUser, getFollowStatus } from '../services/users.service';
import { deletePost, updatePost, getBookmarkedPosts, getTaggedPosts } from '../services/posts.service';
import api from '../config/api';

const ROSE_GRADIENT = "bg-gradient-to-r from-[#e93e68] to-[#f45d7d]";

export default function Profile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { currentUser, userProfile: currentUserProfile } = useAuth();
  const [profileUser, setProfileUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);
  const [taggedPosts, setTaggedPosts] = useState([]);
  const [activeTab, setActiveTab] = useState('posts');
  const [loading, setLoading] = useState(true);
  const [savedLoading, setSavedLoading] = useState(false);
  const [taggedLoading, setTaggedLoading] = useState(false);
  const [isFollowingUser, setIsFollowingUser] = useState(false);
  const [isRequested, setIsRequested] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [showPostMenu, setShowPostMenu] = useState(null);
  const [editingPost, setEditingPost] = useState(null);
  const [showEditOverlay, setShowEditOverlay] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);

  const currentUserId = currentUserProfile?.id || currentUserProfile?._id;
  const isOwnProfile = currentUserId === userId;

  useEffect(() => {
    loadProfileData();
  }, [userId]);

  useEffect(() => {
    const handleClickOutside = () => {
      setShowPostMenu(null);
    };

    if (showPostMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showPostMenu]);

  const loadProfileData = async () => {
    if (!userId || userId === 'undefined') {
      console.error('Invalid userId:', userId);
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      
      const user = await getUserProfile(userId);
      setProfileUser(user);
      
      const userPosts = await getUserPosts(userId);
      setPosts(userPosts);
      
      if (currentUserProfile && userId !== currentUserId) {
        const status = await getFollowStatus(userId);
        setIsFollowingUser(status.following);
        setIsRequested(status.requested);
        
        const blockStatus = await api.get(`/moderation/is-blocked/${userId}`);
        setIsBlocked(blockStatus.data.blocked);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSavedPosts = async () => {
    if (!isOwnProfile) return;
    
    try {
      setSavedLoading(true);
      const bookmarkedPosts = await getBookmarkedPosts();
      setSavedPosts(bookmarkedPosts);
    } catch (error) {
      console.error('Error loading saved posts:', error);
    } finally {
      setSavedLoading(false);
    }
  };

  const loadTaggedPosts = async () => {
    try {
      setTaggedLoading(true);
      const tagged = await getTaggedPosts(userId);
      setTaggedPosts(tagged);
    } catch (error) {
      console.error('Error loading tagged posts:', error);
    } finally {
      setTaggedLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'saved' && isOwnProfile && savedPosts.length === 0) {
      loadSavedPosts();
    } else if (tab === 'tagged' && taggedPosts.length === 0) {
      loadTaggedPosts();
    }
  };

  const handleFollowToggle = async () => {
    if (followLoading || isOwnProfile) return;
    
    try {
      setFollowLoading(true);
      const result = await toggleFollowUser(userId);
      setIsFollowingUser(result.following);
      setIsRequested(result.requested);
      
      if (result.following && !isFollowingUser) {
        setProfileUser(prev => ({
          ...prev,
          followers_count: prev.followers_count + 1
        }));
      } else if (!result.following && !result.requested && isFollowingUser) {
        setProfileUser(prev => ({
          ...prev,
          followers_count: prev.followers_count - 1
        }));
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      
      if (error.response?.status === 400) {
        alert("You cannot follow yourself!");
      } else if (error.response?.status === 404) {
        alert("User not found!");
      } else {
        alert("Failed to update follow status. Please try again.");
      }
    } finally {
      setFollowLoading(false);
    }
  };

  const handleBlockUser = async () => {
    try {
      if (isBlocked) {
        await api.delete(`/moderation/block/${userId}`);
        setIsBlocked(false);
        alert('User unblocked successfully');
      } else {
        await api.post(`/moderation/block/${userId}`);
        setIsBlocked(true);
        setIsFollowingUser(false);
        setIsRequested(false);
        alert('User blocked successfully');
      }
      setShowBlockConfirm(false);
    } catch (error) {
      console.error('Error blocking/unblocking user:', error);
      alert('Failed to update block status. Please try again.');
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    
    try {
      await deletePost(postId);
      setPosts(prev => prev.filter(p => (p.id || p._id) !== postId));
      setProfileUser(prev => ({
        ...prev,
        posts_count: Math.max(0, (prev.posts_count || 0) - 1)
      }));
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Failed to delete post. Please try again.');
    }
  };

  const handleEditPost = (post) => {
    setEditingPost(post);
    setShowEditOverlay(true);
  };

  const handleUpdatePost = async (postData) => {
    try {
      await updatePost(
        editingPost.id || editingPost._id,
        postData.content,
        postData.tags,
        postData.mediaFile,
        postData.mediaFile?.thumbnailDataUrl || null,
        postData.existingMediaUrl || editingPost.media_url
      );
      
      await loadProfileData();
      
      setShowEditOverlay(false);
      setEditingPost(null);
    } catch (error) {
      console.error('Error updating post:', error);
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0708] flex items-center justify-center">
        <div className="text-center">
          <div className={`w-16 h-16 ${ROSE_GRADIENT} rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse`}>
            <Zap size={32} fill="white" className="text-white" />
          </div>
          <p className="text-white/40 font-medium">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="min-h-screen bg-[#0a0708] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-black text-white mb-2">User not found</h2>
          <p className="text-white/40">This profile doesn't exist or has been removed.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0708] font-sans text-white selection:bg-[#e93e68] selection:text-white">
      
      {/* Header with Back Button and Logo */}
      <div className="fixed top-8 left-8 z-[110] flex items-center gap-3">
        <button
          onClick={() => navigate('/home')}
          className="p-2 bg-white/5 backdrop-blur-md rounded-xl hover:bg-white/10 transition-colors border border-white/10"
        >
          <ArrowLeft size={20} className="text-white" />
        </button>
        <div className={`w-10 h-10 ${ROSE_GRADIENT} rounded-2xl flex items-center justify-center text-white shadow-lg shadow-rose-600/20`}>
          <Zap size={22} fill="currentColor" />
        </div>
        <span className="font-black text-xl tracking-tighter uppercase italic text-white">Pixora</span>
      </div>

      <div className="max-w-5xl mx-auto p-6 md:p-12 pt-24">
        {/* Profile Header */}
        <header className="flex flex-col md:flex-row items-center gap-12 mb-20">
          <div className="relative">
            {profileUser?.photoURL ? (
              <img
                src={profileUser.photoURL}
                alt={profileUser.displayName}
                className="w-32 h-32 md:w-48 md:h-48 rounded-[2.5rem] object-cover shadow-2xl border-2 border-white/10"
              />
            ) : (
              <div className={`w-32 h-32 md:w-48 md:h-48 rounded-[2.5rem] ${ROSE_GRADIENT} flex items-center justify-center shadow-2xl`}>
                <User className="w-16 h-16 md:w-24 md:h-24 text-white" />
              </div>
            )}
          </div>
          
          <div className="flex-1 space-y-6 text-center md:text-left">
            <div className="flex flex-col md:flex-row items-center gap-4">
              <h2 className="text-3xl font-black tracking-tight">{profileUser?.displayName}</h2>
              {isOwnProfile ? (
                <>
                  <button 
                    onClick={() => navigate('/edit-profile')}
                    className="px-8 py-3 bg-white/5 border border-white/10 rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-white/10 hover:border-rose-500/30 transition-all"
                  >
                    Edit Studio
                  </button>
                  <button 
                    onClick={() => navigate('/settings')}
                    className="p-3 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 hover:border-rose-500/30 transition-all"
                  >
                    <Settings size={18} />
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleFollowToggle}
                    disabled={followLoading}
                    className={`px-8 py-3 rounded-full font-black text-[10px] uppercase tracking-widest transition-all disabled:opacity-50 shadow-lg ${
                      isFollowingUser
                        ? 'bg-white/5 border border-white/10 text-white/70 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30'
                        : isRequested
                        ? 'bg-white/10 border border-white/20 text-white/60 hover:bg-white/20'
                        : `${ROSE_GRADIENT} text-white shadow-rose-600/20 hover:brightness-110`
                    }`}
                  >
                    {followLoading ? 'Loading...' : (isFollowingUser ? 'Following' : isRequested ? 'Requested' : 'Collect')}
                  </button>
                  <button 
                    onClick={() => navigate('/messages')}
                    className="px-8 py-3 bg-white/5 border border-white/10 rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-white/10 hover:border-rose-500/30 transition-all"
                  >
                    Message
                  </button>
                  <button 
                    onClick={() => setShowBlockConfirm(true)}
                    className={`p-3 rounded-full transition-all ${
                      isBlocked 
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30' 
                        : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10'
                    }`}
                    title={isBlocked ? 'Unblock User' : 'Block User'}
                  >
                    <Ban size={18} />
                  </button>
                </>
              )}
            </div>
            
            <div className="flex items-center justify-center md:justify-start gap-2">
              <p className="text-white/40 font-medium">@{profileUser?.username}</p>
              {profileUser?.is_private && (
                <div className="flex items-center gap-1 px-2 py-1 bg-white/5 border border-white/10 rounded-full">
                  <Lock size={14} className="text-white/60" />
                  <span className="text-xs font-bold text-white/60">Private</span>
                </div>
              )}
            </div>
            
            {profileUser?.bio && (
              <p className="max-w-md text-white/60 font-medium leading-relaxed">
                {profileUser.bio}
              </p>
            )}

            <div className="flex justify-center md:justify-start gap-10">
              <div key="posts">
                <span className="font-black block text-xl">{profileUser?.posts_count || 0}</span>
                <span className="text-[10px] font-black uppercase text-white/40 tracking-widest">Creations</span>
              </div>
              <div key="followers">
                <span className="font-black block text-xl">{profileUser?.followers_count || 0}</span>
                <span className="text-[10px] font-black uppercase text-white/40 tracking-widest">Collectors</span>
              </div>
              <div key="following">
                <span className="font-black block text-xl">{profileUser?.following_count || 0}</span>
                <span className="text-[10px] font-black uppercase text-white/40 tracking-widest">Inspired By</span>
              </div>
            </div>
          </div>
        </header>

        {/* Tabs */}
        <div className="flex justify-center mb-12">
          <div className="bg-[#130f10] border border-white/10 rounded-[2rem] p-2 flex gap-2">
            <button
              onClick={() => handleTabChange('posts')}
              className={`flex items-center gap-2 px-6 py-3 rounded-full font-black text-xs uppercase tracking-[0.3em] transition-all duration-300 ${
                activeTab === 'posts'
                  ? `${ROSE_GRADIENT} text-white shadow-lg shadow-rose-600/20`
                  : 'text-white/40 hover:text-white/70'
              }`}
            >
              <Grid className="w-4 h-4" />
              Posts
            </button>
            {isOwnProfile && (
              <button
                onClick={() => handleTabChange('saved')}
                className={`flex items-center gap-2 px-6 py-3 rounded-full font-black text-xs uppercase tracking-[0.3em] transition-all duration-300 ${
                  activeTab === 'saved'
                    ? `${ROSE_GRADIENT} text-white shadow-lg shadow-rose-600/20`
                    : 'text-white/40 hover:text-white/70'
                }`}
              >
                <Bookmark className="w-4 h-4" />
                Saved
              </button>
            )}
            <button
              onClick={() => handleTabChange('tagged')}
              className={`flex items-center gap-2 px-6 py-3 rounded-full font-black text-xs uppercase tracking-[0.3em] transition-all duration-300 ${
                activeTab === 'tagged'
                  ? `${ROSE_GRADIENT} text-white shadow-lg shadow-rose-600/20`
                  : 'text-white/40 hover:text-white/70'
              }`}
            >
              <Tag className="w-4 h-4" />
              Tagged
            </button>
          </div>
        </div>

        {/* Content Grid */}
        {(savedLoading && activeTab === 'saved') || (taggedLoading && activeTab === 'tagged') ? (
          <div className="text-center py-20">
            <div className={`inline-block w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin mb-4`}></div>
            <p className="text-white/40 font-medium">
              {activeTab === 'saved' ? 'Loading saved posts...' : 'Loading tagged posts...'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(activeTab === 'saved' ? savedPosts : activeTab === 'tagged' ? taggedPosts : posts).map(post => (
            <div 
              key={post.id || post._id} 
              className="aspect-square rounded-[2rem] overflow-hidden bg-[#130f10] border border-white/5 group cursor-pointer relative hover:border-rose-500/30 hover:shadow-xl hover:shadow-rose-600/10 hover:-translate-y-1 transition-all duration-500"
              onClick={() => navigate(`/post/${post.id || post._id}`)}
            >
              {post.media_url ? (
                post.media_type === 'video' || post.media_url.match(/\.(mp4|mov|avi|webm)$/i) ? (
                  <div className="relative w-full h-full">
                    <video 
                      src={post.media_url} 
                      className="w-full h-full object-cover transition-transform group-hover:scale-110"
                      poster={post.thumbnail_url || undefined}
                      preload="metadata"
                      muted
                    />
                    <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-full">
                      <span className="text-white text-xs font-bold">VIDEO</span>
                    </div>
                  </div>
                ) : (
                  <img src={post.media_url} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt="" />
                )
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-rose-500/10 to-pink-500/10 flex items-center justify-center">
                  <div className="text-center">
                    <User size={24} className="text-rose-400/30 mx-auto mb-2" />
                    <p className="text-xs text-rose-400/40 font-medium">Text Post</p>
                  </div>
                </div>
              )}
              
              {isOwnProfile && activeTab === 'posts' && (
                <div className="absolute top-2 right-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const postId = post.id || post._id;
                      setShowPostMenu(showPostMenu === postId ? null : postId);
                    }}
                    className="p-2 bg-black/20 backdrop-blur-md rounded-full text-white hover:bg-black/40 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <MoreHorizontal size={14} />
                  </button>
                  
                  {showPostMenu === (post.id || post._id) && (
                    <div className="absolute top-12 right-0 bg-[#130f10] rounded-xl shadow-lg border border-white/10 py-2 min-w-[120px] z-10">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditPost(post);
                          setShowPostMenu(null);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-white/70 hover:bg-white/5 transition-colors flex items-center gap-2"
                      >
                        <Edit size={14} />
                        Edit Post
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePost(post.id || post._id);
                          setShowPostMenu(null);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2"
                      >
                        <Trash2 size={14} />
                        Delete Post
                      </button>
                    </div>
                  )}
                </div>
              )}
              
              <div className="absolute inset-0 bg-rose-600/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                <Heart size={24} fill="white" />
              </div>
              <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md border border-white/20 px-2 py-1 rounded-full opacity-100 group-hover:opacity-0 transition-opacity">
                <span className="text-white text-[8px] font-black tracking-widest uppercase">{post.likes_count || 0}</span>
              </div>
            </div>
          ))}
          </div>
        )}

        {/* Empty State */}
        {(activeTab === 'saved' ? savedPosts : activeTab === 'tagged' ? taggedPosts : posts).length === 0 && (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-white/5 border border-white/10 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6">
              {activeTab === 'saved' ? (
                <Bookmark className="w-12 h-12 text-white/20" />
              ) : activeTab === 'tagged' ? (
                <Tag className="w-12 h-12 text-white/20" />
              ) : profileUser?.is_private && !isOwnProfile ? (
                <Lock className="w-12 h-12 text-white/20" />
              ) : (
                <Grid className="w-12 h-12 text-white/20" />
              )}
            </div>
            <h3 className="text-2xl font-black text-white mb-2">
              {activeTab === 'saved' 
                ? 'No saved posts yet' 
                : activeTab === 'tagged'
                ? 'No tagged posts yet'
                : (isOwnProfile 
                  ? 'No posts yet' 
                  : (profileUser?.is_private 
                    ? 'This account is private' 
                    : 'No posts to show')
                )
              }
            </h3>
            <p className="text-white/40 font-medium">
              {activeTab === 'saved'
                ? 'Posts you bookmark will appear here'
                : activeTab === 'tagged'
                ? (isOwnProfile 
                  ? 'Posts where you are mentioned will appear here'
                  : `Posts where ${profileUser?.displayName} is mentioned will appear here`)
                : (isOwnProfile 
                  ? 'Share your first visual story with the community'
                  : (profileUser?.is_private 
                    ? 'Follow this account to see their posts'
                    : 'This artist hasn\'t shared any visuals yet')
                )
              }
            </p>
          </div>
        )}
      </div>

      {/* Block Confirmation Modal */}
      {showBlockConfirm && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowBlockConfirm(false)} />
          <div className="relative bg-[#130f10] border border-white/10 rounded-[2rem] shadow-2xl p-8 max-w-md w-full">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-500/20 border border-red-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Ban size={32} className="text-red-400" />
              </div>
              <h3 className="text-2xl font-black text-white mb-2">
                {isBlocked ? 'Unblock User?' : 'Block User?'}
              </h3>
              <p className="text-white/60 mb-6">
                {isBlocked 
                  ? `You will be able to see ${profileUser?.displayName}'s posts and interact with them again.`
                  : `${profileUser?.displayName} will no longer be able to follow you, see your posts, or message you.`
                }
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowBlockConfirm(false)}
                  className="flex-1 px-6 py-3 bg-white/5 border border-white/10 rounded-full font-bold text-white/70 hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBlockUser}
                  className={`flex-1 px-6 py-3 rounded-full font-bold text-white transition-colors ${
                    isBlocked 
                      ? `${ROSE_GRADIENT} hover:brightness-110 shadow-lg shadow-rose-600/20` 
                      : 'bg-red-500 hover:bg-red-600'
                  }`}
                >
                  {isBlocked ? 'Unblock' : 'Block'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Post Overlay */}
      {showEditOverlay && editingPost && (
        <EditPostOverlay
          post={editingPost}
          onClose={() => {
            setShowEditOverlay(false);
            setEditingPost(null);
          }}
          onUpdate={handleUpdatePost}
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
        existingMediaUrl: mediaFile ? null : post.media_url
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
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      <div className="relative bg-[#130f10] border border-white/10 w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden">
        <button onClick={onClose} className="absolute top-6 right-6 z-10 p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
          <X size={20} className="text-white" />
        </button>
        
        <div className="p-10">
          <h2 className="text-2xl font-black text-white mb-8 uppercase tracking-tighter italic">Edit Post</h2>
          
          {mediaPreview ? (
            <div className="relative w-full h-64 bg-[#0a0708] rounded-2xl overflow-hidden mb-6">
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
            <label className="block w-full h-48 border-2 border-dashed border-white/20 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-rose-500/30 hover:bg-white/5 transition-colors mb-6">
              <ImageIcon size={32} className="text-white/40 mb-2" />
              <span className="text-sm font-bold text-white/60">Add Media</span>
              <span className="text-xs text-white/40 mt-1">Click to upload image or video</span>
              <input
                type="file"
                accept="image/*,video/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          )}
          
          <textarea 
            placeholder="What's the story behind this piece?" 
            className="w-full h-32 bg-white/5 border border-white/10 outline-none resize-none font-medium text-white placeholder:text-white/20 rounded-2xl p-4 mb-6 focus:border-rose-500 transition-all"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          
          {tags.length > 0 && (
            <div className="mb-6">
              <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Tags:</p>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag, index) => (
                  <span 
                    key={index}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-full text-sm font-medium"
                  >
                    {tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="ml-1 text-rose-400 hover:text-rose-300"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm font-medium">
              {error}
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <button 
                onClick={addHashtag}
                disabled={loading}
                className="flex items-center gap-2 p-2 bg-white/5 hover:bg-rose-500/20 rounded-lg text-white/40 hover:text-rose-400 transition-colors disabled:opacity-50"
                title="Add Hashtag"
              >
                <Hash size={18} />
                <span className="text-xs font-medium">Hashtag</span>
              </button>
              <button 
                onClick={addTag}
                disabled={loading}
                className="flex items-center gap-2 p-2 bg-white/5 hover:bg-rose-500/20 rounded-lg text-white/40 hover:text-rose-400 transition-colors disabled:opacity-50"
                title="Add Tag"
              >
                <Tag size={18} />
                <span className="text-xs font-medium">Tag</span>
              </button>
            </div>
            <button 
              onClick={handleSubmit}
              disabled={loading || !content.trim()}
              className={`px-8 py-3 bg-gradient-to-r from-[#e93e68] to-[#f45d7d] text-white rounded-full font-black text-xs uppercase tracking-widest shadow-xl shadow-rose-600/30 disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110 transition-all`}
            >
              {loading ? 'Updating...' : 'Update Post'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
