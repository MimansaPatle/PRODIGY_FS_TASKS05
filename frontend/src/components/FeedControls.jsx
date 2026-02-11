import { Clock, Heart, MessageCircle, Image, Video, FileText, Grid } from 'lucide-react';

const FeedControls = ({ filters = { mediaType: 'all', sortBy: 'created_at' }, onFilterChange, stats, className = "" }) => {
  const filterOptions = [
    { 
      key: 'all', 
      label: 'All', 
      icon: Grid,
      count: stats?.total_posts 
    },
    { 
      key: 'image', 
      label: 'Images', 
      icon: Image,
      count: stats?.image_posts 
    },
    { 
      key: 'video', 
      label: 'Videos', 
      icon: Video,
      count: stats?.video_posts 
    },
    { 
      key: 'text', 
      label: 'Text', 
      icon: FileText,
      count: stats?.text_posts 
    }
  ];

  const sortOptions = [
    { 
      key: 'created_at', 
      label: 'Newest', 
      icon: Clock 
    },
    { 
      key: 'likes_count', 
      label: 'Most Liked', 
      icon: Heart 
    },
    { 
      key: 'comments_count', 
      label: 'Most Discussed', 
      icon: MessageCircle 
    }
  ];

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      {/* Media Type Filters */}
      <div className="flex flex-wrap gap-2">
        <span className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center mr-2">
          Filter:
        </span>
        {filterOptions.map(option => {
          const Icon = option.icon;
          return (
            <button
              key={option.key}
              onClick={() => onFilterChange({ mediaType: option.key })}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all ${
                filters.mediaType === option.key
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                  : 'bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600'
              }`}
            >
              <Icon size={14} />
              {option.label}
              {option.count !== undefined && (
                <span className="text-xs opacity-75">
                  ({option.count || 0})
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Sort Options */}
      <div className="flex flex-wrap gap-2">
        <span className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center mr-2">
          Sort:
        </span>
        {sortOptions.map(option => {
          const Icon = option.icon;
          return (
            <button
              key={option.key}
              onClick={() => onFilterChange({ sortBy: option.key })}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all ${
                filters.sortBy === option.key
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                  : 'bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600'
              }`}
            >
              <Icon size={14} />
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default FeedControls;