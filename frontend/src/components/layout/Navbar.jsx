import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Search, Bell, Settings, LogOut, User } from 'lucide-react';
import '../../styles/components.css';

export default function Navbar() {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const { currentUser, userProfile, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-surface border-b border-white/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <div className="w-8 h-8 bg-electric-indigo rounded-lg flex items-center justify-center">
              <span className="text-lg font-black text-white">⚡</span>
            </div>
            <span className="vois-brand text-electric-indigo">VOIS</span>
          </Link>

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-slate" />
              <input
                type="text"
                placeholder="Search artists, posts..."
                className="vois-input w-full pl-12"
              />
            </div>
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-4">
            {/* Mobile Search */}
            <button className="md:hidden p-2 text-muted-slate hover:text-deep-slate transition-colors">
              <Search className="w-5 h-5" />
            </button>

            {/* Notifications */}
            <button className="p-2 text-muted-slate hover:text-deep-slate transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-rose-pink rounded-full"></span>
            </button>

            {/* Profile Menu */}
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="vois-avatar vois-avatar-live"
              >
                {userProfile?.photoURL ? (
                  <img
                    src={userProfile.photoURL}
                    alt={userProfile.displayName}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 bg-gradient-to-r from-electric-indigo to-rose-pink rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                )}
              </button>

              {/* Dropdown Menu */}
              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-56 glass-surface rounded-2xl shadow-xl border border-white/20 py-2">
                  <div className="px-4 py-3 border-b border-white/10">
                    <p className="font-black text-deep-slate">{userProfile?.displayName}</p>
                    <p className="vois-section-label">@{userProfile?.username}</p>
                  </div>
                  
                  <Link
                    to={`/profile/${currentUser?.uid}`}
                    className="flex items-center gap-3 px-4 py-3 text-deep-slate hover:bg-white/50 transition-colors"
                    onClick={() => setShowProfileMenu(false)}
                  >
                    <User className="w-4 h-4" />
                    <span className="font-medium">Your Studio</span>
                  </Link>
                  
                  <Link
                    to="/edit-profile"
                    className="flex items-center gap-3 px-4 py-3 text-deep-slate hover:bg-white/50 transition-colors"
                    onClick={() => setShowProfileMenu(false)}
                  >
                    <Settings className="w-4 h-4" />
                    <span className="font-medium">Settings</span>
                  </Link>
                  
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-3 text-rose-pink hover:bg-white/50 transition-colors w-full text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="font-medium">Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}