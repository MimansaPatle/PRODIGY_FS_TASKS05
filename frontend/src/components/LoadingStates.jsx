import { Loader2, RefreshCw, AlertCircle } from 'lucide-react';

// Skeleton loading card for initial load
export const SkeletonCard = ({ className = "" }) => (
  <div className={`animate-pulse ${className}`}>
    <div className="bg-slate-200 rounded-[2rem] aspect-square mb-4"></div>
    <div className="space-y-2">
      <div className="h-4 bg-slate-200 rounded w-3/4"></div>
      <div className="h-3 bg-slate-200 rounded w-1/2"></div>
    </div>
  </div>
);

// Grid of skeleton cards
export const SkeletonGrid = ({ count = 6, className = "" }) => (
  <div className={`grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8 ${className}`}>
    {Array.from({ length: count }).map((_, index) => (
      <SkeletonCard key={index} />
    ))}
  </div>
);

// Infinite scroll loading spinner
export const InfiniteScrollLoader = ({ className = "" }) => (
  <div className={`flex justify-center items-center py-8 ${className}`}>
    <div className="flex items-center gap-3 text-slate-400">
      <Loader2 size={20} className="animate-spin" />
      <span className="text-sm font-medium">Loading more posts...</span>
    </div>
  </div>
);

// End of content indicator
export const EndOfContent = ({ className = "" }) => (
  <div className={`flex justify-center items-center py-12 ${className}`}>
    <div className="text-center">
      <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <AlertCircle size={24} className="text-slate-300" />
      </div>
      <p className="text-slate-400 font-medium">You've reached the end!</p>
      <p className="text-xs text-slate-300 mt-1">No more posts to show</p>
    </div>
  </div>
);

// Error state with retry button
export const ErrorState = ({ 
  error, 
  onRetry, 
  className = "",
  title = "Something went wrong",
  description = "Failed to load posts. Please try again."
}) => (
  <div className={`flex justify-center items-center py-12 ${className}`}>
    <div className="text-center max-w-sm">
      <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <AlertCircle size={24} className="text-red-400" />
      </div>
      <h3 className="text-lg font-bold text-slate-800 mb-2">{title}</h3>
      <p className="text-slate-400 font-medium mb-6">{description}</p>
      {error && (
        <p className="text-xs text-red-400 mb-4 font-mono bg-red-50 p-2 rounded">
          {error.message || error.toString()}
        </p>
      )}
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-full font-bold hover:bg-indigo-700 transition-colors mx-auto"
        >
          <RefreshCw size={16} />
          Try Again
        </button>
      )}
    </div>
  </div>
);

// Empty state for filtered results
export const EmptyState = ({ 
  title = "No posts found",
  description = "Try adjusting your filters or check back later.",
  onReset,
  className = ""
}) => (
  <div className={`flex justify-center items-center py-20 ${className}`}>
    <div className="text-center max-w-sm">
      <div className="w-24 h-24 bg-slate-100 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
        <AlertCircle size={32} className="text-slate-300" />
      </div>
      <h3 className="text-xl font-bold text-slate-600 mb-2">{title}</h3>
      <p className="text-slate-400 mb-6">{description}</p>
      {onReset && (
        <button
          onClick={onReset}
          className="px-6 py-3 bg-indigo-600 text-white rounded-full font-bold hover:bg-indigo-700 transition-colors"
        >
          Reset Filters
        </button>
      )}
    </div>
  </div>
);