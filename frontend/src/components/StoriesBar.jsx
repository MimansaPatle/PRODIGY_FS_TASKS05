import { useState, useEffect } from 'react';
import { Plus, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getActiveStories } from '../services/stories.service';

export default function StoriesBar({ onCreateStory, onViewStory }) {
  const { userProfile } = useAuth();
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStories();
  }, []);

  const loadStories = async () => {
    try {
      setLoading(true);
      const data = await getActiveStories();
      setStories(data);
    } catch (error) {
      console.error('Error loading stories:', error);
    } finally {
      setLoading(false);
    }
  };

  const userId = userProfile?.id || userProfile?._id;
  const currentUserStories = stories.find(s => s.author_id === userId);
  const hasOwnStory = currentUserStories && currentUserStories.stories.length > 0;

  return (
    <div className="bg-white/70 backdrop-blur-xl border border-white/20 shadow-lg rounded-[2rem] p-6 mb-8">
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
        {/* Your Story - Show profile with ring if has story, otherwise show create button */}
        {hasOwnStory ? (
          <button
            onClick={() => onViewStory(currentUserStories, stories)}
            className="flex-shrink-0 flex flex-col items-center gap-2 group"
          >
            <div className="relative">
              {/* Story ring */}
              <div className="absolute inset-0 rounded-[1.5rem] bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-500 p-[2px]">
                <div className="w-full h-full bg-white rounded-[1.5rem]" />
              </div>
              
              {/* Profile picture */}
              <div className="relative w-16 h-16 rounded-[1.5rem] overflow-hidden m-[2px]">
                {userProfile?.photoURL ? (
                  <img
                    src={userProfile.photoURL}
                    alt="Your story"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-indigo-400 to-pink-400 flex items-center justify-center">
                    <User className="w-8 h-8 text-white" />
                  </div>
                )}
              </div>
            </div>
            <span className="text-[10px] font-bold text-slate-600">Your Story</span>
            {currentUserStories.stories.length > 1 && (
              <span className="text-[8px] text-slate-400">
                {currentUserStories.stories.length} stories
              </span>
            )}
          </button>
        ) : (
          <button
            onClick={onCreateStory}
            className="flex-shrink-0 flex flex-col items-center gap-2 group"
          >
            <div className="relative">
              <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-indigo-100 to-pink-100 flex items-center justify-center overflow-hidden">
                {userProfile?.photoURL ? (
                  <img
                    src={userProfile.photoURL}
                    alt="Your story"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-8 h-8 text-indigo-400" />
                )}
              </div>
              <div className="absolute bottom-0 right-0 w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center border-2 border-white">
                <Plus size={12} className="text-white" strokeWidth={3} />
              </div>
            </div>
            <span className="text-[10px] font-bold text-slate-600">Your Story</span>
          </button>
        )}

        {/* Other Users' Stories */}
        {loading ? (
          // Loading skeletons
          [...Array(5)].map((_, i) => (
            <div key={i} className="flex-shrink-0 flex flex-col items-center gap-2">
              <div className="w-16 h-16 rounded-[1.5rem] bg-slate-200 animate-pulse" />
              <div className="w-12 h-2 bg-slate-200 rounded animate-pulse" />
            </div>
          ))
        ) : (
          stories
            .filter(userStory => userStory.author_id !== userId) // Exclude own stories
            .map((userStory) => (
              <button
                key={userStory.author_id}
                onClick={() => onViewStory(userStory, stories)}
                className="flex-shrink-0 flex flex-col items-center gap-2 group"
              >
                <div className="relative">
                  {/* Story ring */}
                  <div className={`absolute inset-0 rounded-[1.5rem] ${
                    userStory.has_unseen
                      ? 'bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-500'
                      : 'bg-slate-300'
                  } p-[2px]`}>
                    <div className="w-full h-full bg-white rounded-[1.5rem]" />
                  </div>
                  
                  {/* Profile picture */}
                  <div className="relative w-16 h-16 rounded-[1.5rem] overflow-hidden m-[2px]">
                    {userStory.author_photo ? (
                      <img
                        src={userStory.author_photo}
                        alt={userStory.author_displayName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-indigo-400 to-pink-400 flex items-center justify-center">
                        <User className="w-8 h-8 text-white" />
                      </div>
                    )}
                  </div>
                </div>
                <span className="text-[10px] font-bold text-slate-600 max-w-[64px] truncate">
                  {userStory.author_displayName}
                </span>
                {userStory.stories.length > 1 && (
                  <span className="text-[8px] text-slate-400">
                    {userStory.stories.length} stories
                  </span>
                )}
              </button>
            ))
        )}
      </div>
    </div>
  );
}
