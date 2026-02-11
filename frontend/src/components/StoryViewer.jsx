import { useState, useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, Eye, Trash2, Send } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { markStoryViewed, getStoryViewers, deleteStory } from '../services/stories.service';
import { sendMessage } from '../services/messages.service';
import { useNavigate } from 'react-router-dom';

export default function StoryViewer({ userStory, onClose, allStories, onNavigate }) {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showViewers, setShowViewers] = useState(false);
  const [viewers, setViewers] = useState([]);
  const [replyText, setReplyText] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const progressInterval = useRef(null);
  const videoRef = useRef(null);

  const currentStory = userStory.stories[currentStoryIndex];
  const userId = userProfile?.id || userProfile?._id;
  const isOwnStory = userStory.author_id === userId;
  const STORY_DURATION = 5000; // 5 seconds
  
  // Get story ID safely
  const currentStoryId = currentStory?.id || currentStory?._id;

  useEffect(() => {
    // Mark story as viewed
    if (currentStoryId && !isOwnStory) {
      markStoryViewed(currentStoryId);
    }
  }, [currentStoryId, isOwnStory]);

  useEffect(() => {
    if (!isPaused && !isInputFocused) {
      startProgress();
    } else {
      stopProgress();
    }

    return () => stopProgress();
  }, [currentStoryIndex, isPaused, isInputFocused]);

  const startProgress = () => {
    setProgress(0);
    const interval = 50;
    const increment = (interval / STORY_DURATION) * 100;

    progressInterval.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          handleNext();
          return 0;
        }
        return prev + increment;
      });
    }, interval);
  };

  const stopProgress = () => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
    }
  };

  const handleNext = () => {
    if (currentStoryIndex < userStory.stories.length - 1) {
      setCurrentStoryIndex(prev => prev + 1);
      setProgress(0);
    } else {
      // Move to next user's stories
      const currentUserIndex = allStories.findIndex(s => s.author_id === userStory.author_id);
      if (currentUserIndex < allStories.length - 1) {
        // Use setTimeout to avoid state update during render
        setTimeout(() => {
          onNavigate(allStories[currentUserIndex + 1]);
        }, 0);
      } else {
        // Use setTimeout to avoid state update during render
        setTimeout(() => {
          onClose();
        }, 0);
      }
    }
  };

  const handlePrevious = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(prev => prev - 1);
      setProgress(0);
    } else {
      // Move to previous user's stories
      const currentUserIndex = allStories.findIndex(s => s.author_id === userStory.author_id);
      if (currentUserIndex > 0) {
        const prevUserStory = allStories[currentUserIndex - 1];
        onNavigate(prevUserStory, prevUserStory.stories.length - 1);
      }
    }
  };

  const loadViewers = async () => {
    if (!isOwnStory || !currentStoryId) return;
    
    try {
      const data = await getStoryViewers(currentStoryId);
      setViewers(data);
      setShowViewers(true);
    } catch (error) {
      console.error('Error loading viewers:', error);
      alert('Failed to load viewers');
    }
  };

  const handleDelete = async () => {
    if (!currentStoryId) return;
    if (!window.confirm('Delete this story?')) return;
    
    try {
      await deleteStory(currentStoryId);
      
      // Remove from local state
      const updatedStories = userStory.stories.filter(s => (s.id || s._id) !== currentStoryId);
      
      if (updatedStories.length === 0) {
        setTimeout(() => {
          onClose();
        }, 0);
      } else if (currentStoryIndex >= updatedStories.length) {
        setCurrentStoryIndex(updatedStories.length - 1);
      }
    } catch (error) {
      console.error('Error deleting story:', error);
      alert('Failed to delete story');
    }
  };

  const handleVideoPlay = () => {
    if (videoRef.current) {
      videoRef.current.play();
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim()) return;
    
    try {
      // Send message with story reference
      await sendMessage(
        userStory.author_id,
        replyText,
        null, // no post_id
        currentStoryId // story_id
      );
      
      // Navigate to messages page
      navigate('/messages');
    } catch (error) {
      console.error('Error sending story reply:', error);
      alert('Failed to send reply. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black flex items-center justify-center">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 z-10 p-2 bg-black/50 backdrop-blur-md rounded-full text-white hover:bg-black/70 transition-colors"
      >
        <X size={24} />
      </button>

      {/* Navigation buttons */}
      {currentStoryIndex > 0 || allStories.findIndex(s => s.author_id === userStory.author_id) > 0 ? (
        <button
          onClick={handlePrevious}
          className="absolute left-6 z-10 p-3 bg-black/50 backdrop-blur-md rounded-full text-white hover:bg-black/70 transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
      ) : null}

      {currentStoryIndex < userStory.stories.length - 1 || 
       allStories.findIndex(s => s.author_id === userStory.author_id) < allStories.length - 1 ? (
        <button
          onClick={handleNext}
          className="absolute right-6 z-10 p-3 bg-black/50 backdrop-blur-md rounded-full text-white hover:bg-black/70 transition-colors"
        >
          <ChevronRight size={24} />
        </button>
      ) : null}

      {/* Story container */}
      <div className="relative w-full max-w-md h-[90vh] bg-black rounded-3xl overflow-hidden">
        {/* Progress bars */}
        <div className="absolute top-0 left-0 right-0 z-10 flex gap-1 p-2">
          {userStory.stories.map((_, index) => (
            <div key={index} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-white transition-all duration-100"
                style={{
                  width: index < currentStoryIndex ? '100%' : 
                         index === currentStoryIndex ? `${progress}%` : '0%'
                }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-4 left-0 right-0 z-10 px-4 pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white">
                {userStory.author_photo ? (
                  <img src={userStory.author_photo} alt={userStory.author_displayName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-indigo-400 to-pink-400" />
                )}
              </div>
              <div>
                <p className="text-white font-bold text-sm">{userStory.author_displayName}</p>
                <p className="text-white/70 text-xs">
                  {(() => {
                    const dateString = currentStory.created_at;
                    const date = new Date(dateString);
                    const hasTimezone = dateString.includes('+') || dateString.includes('Z');
                    
                    let displayDate;
                    if (hasTimezone && dateString.includes('+05:30')) {
                      displayDate = date;
                    } else {
                      displayDate = new Date(date.getTime() + (5.5 * 60 * 60 * 1000));
                    }
                    
                    return displayDate.toLocaleTimeString('en-IN', { 
                      hour: '2-digit', 
                      minute: '2-digit',
                      hour12: true
                    });
                  })()}
                </p>
              </div>
            </div>

            {isOwnStory && (
              <button
                onClick={handleDelete}
                className="p-2 bg-black/30 backdrop-blur-md rounded-full text-white hover:bg-red-500 transition-colors"
                title="Delete Story"
              >
                <Trash2 size={18} />
              </button>
            )}
          </div>
        </div>

        {/* Story content */}
        <div
          className="w-full h-full flex items-center justify-center"
          onMouseDown={() => setIsPaused(true)}
          onMouseUp={() => setIsPaused(false)}
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => setIsPaused(false)}
        >
          {currentStory.media_type === 'video' ? (
            <video
              ref={videoRef}
              src={currentStory.media_url}
              className="w-full h-full object-contain"
              autoPlay
              muted
              playsInline
              onLoadedData={handleVideoPlay}
              onEnded={handleNext}
            />
          ) : (
            <img
              src={currentStory.media_url}
              alt="Story"
              className="w-full h-full object-contain"
            />
          )}
        </div>

        {/* View count at bottom for own stories, Reply input for others' stories */}
        {isOwnStory ? (
          <div className="absolute bottom-6 left-0 right-0 z-10 px-4">
            <button
              onClick={loadViewers}
              className="w-full bg-black/50 backdrop-blur-md rounded-full px-4 py-3 text-white flex items-center justify-between hover:bg-black/70 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Eye size={18} />
                <span className="text-sm font-bold">
                  {currentStory.views_count} {currentStory.views_count === 1 ? 'view' : 'views'}
                </span>
              </div>
              <ChevronRight size={18} />
            </button>
          </div>
        ) : (
          <div className="absolute bottom-6 left-0 right-0 z-10 px-4">
            <div className="bg-black/50 backdrop-blur-md rounded-full px-4 py-2 flex items-center gap-2">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onFocus={() => setIsInputFocused(true)}
                onBlur={() => setIsInputFocused(false)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendReply()}
                placeholder={`Reply to ${userStory.author_displayName}...`}
                className="flex-1 bg-transparent text-white placeholder-white/60 outline-none text-sm"
              />
              <button
                onClick={handleSendReply}
                disabled={!replyText.trim()}
                className="p-2 hover:bg-white/20 rounded-full transition-colors disabled:opacity-50"
              >
                <Send size={18} className="text-white" />
              </button>
            </div>
          </div>
        )}

        {/* Tap zones for navigation */}
        <div className="absolute inset-0 flex">
          <div className="w-1/3 h-full" onClick={handlePrevious} />
          <div className="w-1/3 h-full" />
          <div className="w-1/3 h-full" onClick={handleNext} />
        </div>
      </div>

      {/* Viewers modal */}
      {showViewers && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-20">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full mx-4 max-h-[70vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-black">Viewers</h3>
              <button onClick={() => setShowViewers(false)} className="p-2 hover:bg-slate-100 rounded-full">
                <X size={20} />
              </button>
            </div>
            
            {viewers.length === 0 ? (
              <p className="text-center text-slate-400 py-8">No views yet</p>
            ) : (
              <div className="space-y-3">
                {viewers.map((viewer) => (
                  <div key={viewer.viewer_id} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-indigo-400 to-pink-400">
                      {viewer.viewer_photo && (
                        <img src={viewer.viewer_photo} alt={viewer.viewer_displayName} className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-sm">{viewer.viewer_displayName}</p>
                      <p className="text-xs text-slate-400">@{viewer.viewer_username}</p>
                    </div>
                    <p className="text-xs text-slate-400">
                      {(() => {
                        const dateString = viewer.viewed_at;
                        const date = new Date(dateString);
                        const hasTimezone = dateString.includes('+') || dateString.includes('Z');
                        
                        let displayDate;
                        if (hasTimezone && dateString.includes('+05:30')) {
                          displayDate = date;
                        } else {
                          displayDate = new Date(date.getTime() + (5.5 * 60 * 60 * 1000));
                        }
                        
                        return displayDate.toLocaleTimeString('en-IN', { 
                          hour: '2-digit', 
                          minute: '2-digit',
                          hour12: true
                        });
                      })()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}