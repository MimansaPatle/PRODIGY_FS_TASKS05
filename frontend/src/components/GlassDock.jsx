import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Home as HomeIcon, 
  Search, 
  Plus, 
  Bell, 
  User 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const GlassDock = ({ onCreateClick }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userProfile } = useAuth();
  
  // Get user ID, handling both id and _id fields
  const userId = userProfile?.id || userProfile?._id;
  
  const items = [
    { id: 'home', icon: HomeIcon, path: '/home' },
    { id: 'explore', icon: Search, path: '/explore' },
    { id: 'create', icon: Plus, highlight: true },
    { id: 'notifications', icon: Bell, path: '/notifications' },
    { id: 'profile', icon: User, path: userId ? `/profile/${userId}` : '/home' },
  ];

  const getActiveTab = () => {
    const path = location.pathname;
    if (path === '/home') return 'home';
    if (path === '/explore') return 'explore';
    if (path.startsWith('/profile/')) return 'profile';
    if (path.startsWith('/user/')) return 'profile';
    if (path === '/notifications') return 'notifications';
    return 'home';
  };

  const activeTab = getActiveTab();

  const handleTabClick = (item) => {
    if (item.id === 'create') {
      onCreateClick();
    } else if (item.id === 'notifications') {
      navigate('/notifications');
    } else if (item.id === 'profile') {
      // Make sure we have a valid userId before navigating
      if (userId) {
        navigate(`/profile/${userId}`);
      } else {
        console.error('Cannot navigate to profile: userId is undefined');
        // Stay on current page or navigate to home
        navigate('/home');
      }
    } else if (item.path) {
      navigate(item.path);
    }
  };

  return (
    <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2 p-2 bg-white/70 backdrop-blur-xl border border-white/20 shadow-2xl rounded-[2.5rem]">
      {items.map(item => (
        <button
          key={item.id}
          onClick={() => handleTabClick(item)}
          className={`relative group flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 ${
            item.highlight 
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' 
              : activeTab === item.id ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400 hover:text-slate-900'
          }`}
        >
          <item.icon size={22} strokeWidth={2.5} />
          {activeTab === item.id && !item.highlight && (
            <span className="absolute -top-1 right-1 w-2 h-2 bg-pink-500 rounded-full border-2 border-white" />
          )}
        </button>
      ))}
    </nav>
  );
};

export default GlassDock;