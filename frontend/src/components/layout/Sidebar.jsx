import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Home, Compass, User, TrendingUp, Users, Bookmark } from 'lucide-react';
import { getTrendingUsers, toggleFollowUser, isFollowing } from '../../services/users.service';
import '../../styles/components.css';

export default function Sidebar() {
  const location = useLocation();
  const { currentUser, userProfile } = useAuth();
  const [trendingUsers, setTrendingUsers] = useState([]);
  const [followingStates, setFollowingStates] = useState({});

  useEffect(() => {
    loadTrendingUsers();
  }, []);

  const loadTrendingUsers = async () => {
    try {
      const users = await getTrendingUsers(3);
      setTrendingUsers(users);
      
      // Check following status for each user
      if (currentUser) {
        const followingChecks = {};
        for (const user of users) {
          if (user.id !== currentUser.uid) {
            followingChecks[user.id] = await isFollowing(currentUser.uid, user.id);
          }
        }
        setFollowingStates(followingChecks);
      }
    } catch (error) {
      console.error('Error loading trending users:', error);
    }
  };

  const handleFollowToggle = async (userId) => {
    try {
      const isNowFollowing = await toggleFollowUser(currentUser.uid, userId);
      setFollowingStates(prev => ({
        ...prev,
        [userId]: isNowFollowing
      }));
    } catch (error) {
      console.error('Error toggling follow:', error);
    }
  };

  const navigation = [
    { name: 'Feed', href: '/', icon: Home, current: location.pathname === '/' },
    { name: 'Explore', href: '/explore', icon: Compass, current: location.pathname === '/explore' },
    { name: 'Trending', href: '/trending', icon: TrendingUp, current: location.pathname === '/trending' },
    { name: 'Following', href: '/following', icon: Users, current: location.pathname === '/following' },
    { name: 'Saved', href: '/saved', icon: Bookmark, current: location.pathname === '/saved' },
  ];

  return (
    <div className="sticky top-20 space-y-6">
      {/* Profile Card */}
      <div className="vois-card p-6">
        <Link to={`/profile/${currentUser?.uid}`} className="flex items-center gap-4 group">
          <div className="vois-avatar vois-avatar-live">
            {userProfile?.photoURL ? (
              <img
                src={userProfile.photoURL}
                alt={userProfile.displayName}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 bg-gradient-to-r from-electric-indigo to-rose-pink rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-black text-deep-slate group-hover:text-electric-indigo transition-colors">
              {userProfile?.displayName}
            </p>
            <p className="vois-section-label">@{userProfile?.username}</p>
          </div>
        </Link>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-100">
          <div className="text-center">
            <p className="font-black text-deep-slate">{userProfile?.posts_count || 0}</p>
            <p className="vois-meta text-muted-slate">POSTS</p>
          </div>
          <div className="text-center">
            <p className="font-black text-deep-slate">{userProfile?.followers_count || 0}</p>
            <p className="vois-meta text-muted-slate">COLLECTORS</p>
          </div>
          <div className="text-center">
            <p className="font-black text-deep-slate">{userProfile?.following_count || 0}</p>
            <p className="vois-meta text-muted-slate">FOLLOWING</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="vois-card p-4">
        <nav className="space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center gap-4 px-4 py-3 rounded-2xl font-medium transition-all duration-300 ${
                  item.current
                    ? 'bg-electric-indigo text-white shadow-lg'
                    : 'text-deep-slate hover:bg-slate-50 hover:text-electric-indigo'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Trending Artists */}
      <div className="vois-card p-6">
        <h3 className="vois-section-label mb-4">TRENDING ARTISTS</h3>
        <div className="space-y-4">
          {trendingUsers.map((user) => (
            <div key={user.id} className="flex items-center gap-3">
              <Link to={`/profile/${user.id}`} className="vois-avatar">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 bg-gradient-to-r from-electric-indigo to-rose-pink rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                )}
              </Link>
              <div className="flex-1 min-w-0">
                <Link to={`/profile/${user.id}`}>
                  <p className="font-medium text-deep-slate text-sm hover:text-electric-indigo transition-colors">
                    {user.displayName}
                  </p>
                  <p className="vois-meta text-muted-slate">@{user.username}</p>
                </Link>
              </div>
              {user.id !== currentUser?.uid && (
                <button
                  onClick={() => handleFollowToggle(user.id)}
                  className={`text-xs px-4 py-2 rounded-full font-black transition-colors ${
                    followingStates[user.id]
                      ? 'bg-slate-100 text-muted-slate hover:bg-red-50 hover:text-red-600'
                      : 'vois-btn-secondary'
                  }`}
                >
                  {followingStates[user.id] ? 'FOLLOWING' : 'FOLLOW'}
                </button>
              )}
            </div>
          ))}
          
          {trendingUsers.length === 0 && (
            <div className="text-center py-4">
              <p className="vois-meta text-muted-slate">No trending artists yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}