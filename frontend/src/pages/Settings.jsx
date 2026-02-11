import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock, Shield, Ban, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../config/api';

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
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl border-b border-slate-100 px-6 py-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-full">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-black">Settings</h1>
            <p className="text-sm text-slate-400">Privacy & Security</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* Success Message */}
        {message && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-600 rounded-2xl">
            {message}
          </div>
        )}

        {/* Privacy Settings */}
        <div className="bg-white/70 backdrop-blur-xl border border-white/20 shadow-lg rounded-[2rem] p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Lock size={24} className="text-indigo-600" />
            <h2 className="text-xl font-black">Privacy</h2>
          </div>

          <div className="space-y-4">
            {/* Private Account Toggle */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-3">
                {isPrivate ? <EyeOff size={20} /> : <Eye size={20} />}
                <div>
                  <p className="font-bold">Private Account</p>
                  <p className="text-sm text-slate-500">
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
                  isPrivate ? 'bg-indigo-600' : 'bg-slate-300'
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
        <div className="bg-white/70 backdrop-blur-xl border border-white/20 shadow-lg rounded-[2rem] p-6">
          <div className="flex items-center gap-3 mb-4">
            <Ban size={24} className="text-red-600" />
            <h2 className="text-xl font-black">Blocked Users</h2>
          </div>

          {blockedUsers.length === 0 ? (
            <div className="text-center py-8">
              <Shield size={48} className="mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500">No blocked users</p>
            </div>
          ) : (
            <div className="space-y-3">
              {blockedUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    {user.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt={user.displayName}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-pink-400" />
                    )}
                    <div>
                      <p className="font-bold">{user.displayName}</p>
                      <p className="text-sm text-slate-500">@{user.username}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleUnblock(user.id)}
                    className="px-4 py-2 bg-slate-200 text-slate-700 rounded-full text-sm font-bold hover:bg-slate-300"
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
