import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock, Shield, Ban, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../config/api';

const ROSE_GRADIENT = "bg-gradient-to-r from-[#e93e68] to-[#f45d7d]";

export default function Settings() {
  const navigate = useNavigate();
  const { userProfile, updateUserProfile } = useAuth();
  const [isPrivate, setIsPrivate] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    setIsPrivate(userProfile?.is_private || false);
    loadBlockedUsers();
  }, [userProfile]);

  const loadBlockedUsers = async () => {
    try {
      const response = await api.get('/moderation/blocked');
      setBlockedUsers(response.data);
    } catch (error) {
      console.error('Error loading blocked users:', error);
    }
  };

  const handlePrivacyToggle = async () => {
    try {
      setLoading(true);
      await updateUserProfile({ is_private: !isPrivate });
      setIsPrivate(!isPrivate);
      setMessage('Privacy settings updated');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error updating privacy:', error);
      setMessage('Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  const handleUnblock = async (userId) => {
    try {
      await api.delete(`/moderation/block/${userId}`);
      setBlockedUsers(prev => prev.filter(u => u.id !== userId));
      setMessage('User unblocked');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error unblocking user:', error);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0708] selection:bg-[#e93e68] selection:text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#130f10]/80 backdrop-blur-xl border-b border-white/10 px-6 py-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors">
            <ArrowLeft size={20} className="text-white" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-white uppercase tracking-tighter italic">Settings</h1>
            <p className="text-sm text-white/40">Privacy & Security</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* Success Message */}
        {message && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 text-green-400 rounded-2xl">
            {message}
          </div>
        )}

        {/* Privacy Settings */}
        <div className="bg-[#130f10] border border-white/10 rounded-[2rem] p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Lock size={24} className="text-rose-400" />
            <h2 className="text-xl font-black text-white">Privacy</h2>
          </div>

          <div className="space-y-4">
            {/* Private Account Toggle */}
            <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl">
              <div className="flex items-center gap-3">
                {isPrivate ? <EyeOff size={20} className="text-white/60" /> : <Eye size={20} className="text-white/60" />}
                <div>
                  <p className="font-bold text-white">Private Account</p>
                  <p className="text-sm text-white/50">
                    {isPrivate 
                      ? 'Only approved followers can see your posts'
                      : 'Anyone can see your posts'
                    }
                  </p>
                </div>
              </div>
              <button
                onClick={handlePrivacyToggle}
                disabled={loading}
                className={`relative w-14 h-8 rounded-full transition-colors ${
                  isPrivate ? ROSE_GRADIENT : 'bg-white/20'
                }`}
              >
                <div
                  className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform ${
                    isPrivate ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Blocked Users */}
        <div className="bg-[#130f10] border border-white/10 rounded-[2rem] p-6">
          <div className="flex items-center gap-3 mb-4">
            <Ban size={24} className="text-red-400" />
            <h2 className="text-xl font-black text-white">Blocked Users</h2>
          </div>

          {blockedUsers.length === 0 ? (
            <div className="text-center py-8">
              <Shield size={48} className="mx-auto text-white/20 mb-3" />
              <p className="text-white/50">No blocked users</p>
            </div>
          ) : (
            <div className="space-y-3">
              {blockedUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl hover:border-rose-500/30 transition-all"
                >
                  <div className="flex items-center gap-3">
                    {user.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt={user.displayName}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className={`w-10 h-10 rounded-full ${ROSE_GRADIENT}`} />
                    )}
                    <div>
                      <p className="font-bold text-white">{user.displayName}</p>
                      <p className="text-sm text-white/50">@{user.username}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleUnblock(user.id)}
                    className="px-4 py-2 bg-white/10 text-white/70 rounded-full text-sm font-bold hover:bg-white/20 transition-colors"
                  >
                    Unblock
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
