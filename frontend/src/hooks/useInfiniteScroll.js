import { useState, useEffect, useCallback } from 'react';

// Debounce utility function
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

export const useInfiniteScroll = (loadMore, hasMore, loading) => {
  const [isFetching, setIsFetching] = useState(false);

  const handleScroll = useCallback(
    debounce(() => {
      // Check if we're near the bottom of the page
      const scrollTop = document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = document.documentElement.clientHeight;
      
      if (scrollTop + clientHeight >= scrollHeight - 200) {
        if (hasMore && !loading && !isFetching) {
          setIsFetching(true);
          loadMore().finally(() => setIsFetching(false));
        }
      }
    }, 100),
    [loadMore, hasMore, loading, isFetching]
  );

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  return isFetching;
};