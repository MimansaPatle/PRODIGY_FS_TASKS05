import { useState, useEffect } from 'react';
import { X, Send, User, Search } from 'lucide-react';
import { sharePost } from '../services/messages.service';
import { getFollowing } from '../services/users.service';
import { useAuth } from '../context/AuthContext';

const SharePostModal = ({ post, onClose, onShare }) => {
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [message, setMessage] = useState('');
  const [following, setFollowing] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const { userProfile } = useAuth();

  useEffect(() => {
    loadFollowing();
  }, []);

  const loadFollowing = async () => {
    if (!userProfile?.id) return;
    
    setLoading(true);
    try {
      const followingData = await getFollowing(userProfile.id);
      setFollowing(followingData || []);
    } catch (error) {
      console.error('Error loading following:', error);
      setFollowing([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = following.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.displayName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleUserSelection = (user) => {
    const userId = user.id || user._id;
    setSelectedUsers(prev => {
      const isSelected = prev.find(u => (u.id || u._id) === userId);
      if (isSelected) {
        return prev.filter(u => (u.id || u._id) !== userId);
      } else {
        return [...prev, user];
      }
    });
  };

  const handleShare = async () => {
    if (selectedUsers.length === 0) return;

    setSending(true);
    try {
      const sharePromises = selectedUsers.map(user => {
        const userId = user.id || user._id;
        const postId = post.id || post._id;
        return sharePost(postId, userId, message);
      });
      
      await Promise.all(sharePromises);
      onShare?.(selectedUsers.length);
      onClose();
    } catch (error) {
      console.error('Error sharing post:', error);
      let errorMessage = 'Failed to share post. Please try again.';
      
      if (error.response?.status === 422) {
        errorMessage = 'Invalid data provided. Please check your selection and try again.';
      } else if (error.response?.status === 404) {
        errorMessage = 'User or post not found. Please try again.';
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      }
      
      alert(errorMessage);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={onClose} />
      <div className="relative bg-white w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-slate-900">Share Post</h2>
            <button
              onClick={onClose}
              className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
          
          {/* Search */}
          <div className="mt-4 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search people..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 rounded-xl border-0 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>
        </div>

        {/* User List */}
        <div className="max-h-80 overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center">
              <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-slate-400 text-sm">Loading contacts...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-8 text-center">
              <User size={32} className="text-slate-300 mx-auto mb-2" />
              <p className="text-slate-400">
                {searchTerm ? 'No users found' : 'No following found'}
              </p>
            </div>
          ) : (
            <div className="p-4 space-y-2">
              {filteredUsers.map((user, index) => {
                const userId = user.id || user._id;
                const isSelected = selectedUsers.find(u => (u.id || u._id) === userId);
                return (
                  <button
                    key={`user-${userId || index}`}
                    onClick={() => toggleUserSelection(user)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                      isSelected 
                        ? 'bg-indigo-50 border-2 border-indigo-200' 
                        : 'hover:bg-slate-50 border-2 border-transparent'
                    }`}
                  >
                    <img
                      src={user.photoURL || `https://i.pravatar.cc/150?u=${userId}`}
                      alt={user.username}
                      className="w-10 h-10 rounded-full"
                    />
                    <div className="flex-1 text-left">
                      <p className="font-bold text-slate-900">{user.displayName}</p>
                      <p className="text-sm text-slate-500">@{user.username}</p>
                    </div>
                    {isSelected && (
                      <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Message Input */}
        <div className="p-4 border-t border-slate-100">
          <textarea
            placeholder="Add a message (optional)..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full p-3 bg-slate-50 rounded-xl border-0 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all resize-none"
            rows={2}
          />
        </div>

        {/* Share Button */}
        <div className="p-4 pt-0">
          <button
            onClick={handleShare}
            disabled={selectedUsers.length === 0 || sending}
            className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 text-white rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-700 transition-colors"
          >
            <Send size={18} />
            {sending ? 'Sharing...' : `Share to ${selectedUsers.length} ${selectedUsers.length === 1 ? 'person' : 'people'}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SharePostModal;