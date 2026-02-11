import { useState, useCallback, useEffect, useRef } from 'react';
import { getFeedPosts, getExplorePosts, getPostsStats } from '../services/posts.service';

const initialFeedState = {
  posts: [],
  loading: false,
  hasMore: true,
  error: null,
  filters: {
    mediaType: 'all',
    sortBy: 'created_at'
  },
  pagination: {
    skip: 0,
    limit: 20
  },
  stats: null
};

export const useFeed = (feedType = 'explore') => {
  const [state, setState] = useState(initialFeedState);
  const stateRef = useRef(state);
  
  // Keep ref updated
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Load posts with current filters and pagination
  const loadPosts = useCallback(async (reset = false) => {
    const currentState = stateRef.current;
    
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const params = {
        skip: reset ? 0 : currentState.pagination.skip,
        limit: currentState.pagination.limit,
        sort_by: currentState.filters.sortBy,
        media_type: currentState.filters.mediaType,
        order: 'desc'
      };
      
      const response = await (feedType === 'explore' 
        ? getExplorePosts(params) 
        : getFeedPosts(params));
      
      setState(prev => ({
        ...prev,
        posts: reset ? response.posts : [...prev.posts, ...response.posts],
        hasMore: response.has_more,
        pagination: { 
          ...prev.pagination, 
          skip: response.next_skip || prev.pagination.skip + prev.pagination.limit 
        },
        loading: false
      }));
    } catch (error) {
      setState(prev => ({ ...prev, error, loading: false }));
    }
  }, [feedType]);

  // Load posts statistics
  const loadStats = useCallback(async () => {
    try {
      const stats = await getPostsStats();
      setState(prev => ({ ...prev, stats }));
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }, []);

  // Update filters and reset pagination
  const updateFilters = useCallback((newFilters) => {
    setState(prev => ({
      ...prev,
      filters: { ...prev.filters, ...newFilters },
      pagination: { ...prev.pagination, skip: 0 },
      posts: [], // Clear existing posts when filters change
      hasMore: true
    }));
  }, []);

  // Load more posts (for infinite scroll)
  const loadMore = useCallback(async () => {
    const currentState = stateRef.current;
    if (!currentState.hasMore || currentState.loading) return;
    await loadPosts(false);
  }, [loadPosts]);

  // Reset and reload posts
  const refresh = useCallback(async () => {
    setState(prev => ({
      ...prev,
      posts: [],
      pagination: { ...prev.pagination, skip: 0 },
      hasMore: true,
      error: null
    }));
    await loadPosts(true);
  }, [loadPosts]);

  // Update a specific post (for likes, etc.)
  const updatePost = useCallback((postId, updates) => {
    setState(prev => ({
      ...prev,
      posts: prev.posts.map(post => 
        (post.id || post._id) === postId ? { ...post, ...updates } : post
      )
    }));
  }, []);

  // Add new post to the beginning of the feed
  const addPost = useCallback((newPost) => {
    setState(prev => ({
      ...prev,
      posts: [newPost, ...prev.posts]
    }));
  }, []);

  // Initial load when filters change
  useEffect(() => {
    if (state.posts.length === 0 && !state.loading && !state.error) {
      loadPosts(true);
    }
  }, [state.filters, feedType, loadPosts]);

  // Load stats on mount
  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return {
    ...state,
    loadMore,
    updateFilters,
    refresh,
    updatePost,
    addPost
  };
};