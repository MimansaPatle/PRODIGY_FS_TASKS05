import api from '../config/api';

// Helper function to convert file to base64 with size limits
function convertFileToBase64(file) {
  return new Promise((resolve, reject) => {
    // Check file size limits
    const maxSize = file.type.startsWith('video/') ? 50 * 1024 * 1024 : 10 * 1024 * 1024; // 50MB for video, 10MB for images
    
    if (file.size > maxSize) {
      const maxSizeMB = maxSize / (1024 * 1024);
      reject(new Error(`File size too large. Maximum allowed: ${maxSizeMB}MB`));
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
}

// Create post with better error handling
export async function createPost(content, tags, mediaFile, thumbnailDataUrl = null, mentions = []) {
  let mediaURL = null;
  
  try {
    // Convert media file to base64 if provided
    if (mediaFile) {
      console.log('Converting file to base64...', { 
        name: mediaFile.name, 
        size: `${(mediaFile.size / 1024 / 1024).toFixed(2)}MB`,
        type: mediaFile.type 
      });
      
      mediaURL = await convertFileToBase64(mediaFile);
      console.log('File conversion completed');
    }
    
    const postData = {
      content,
      media_url: mediaURL,
      media_type: mediaFile ? (mediaFile.type.startsWith('video') ? 'video' : 'image') : null,
      thumbnail_url: thumbnailDataUrl, // Add thumbnail for videos
      tags: tags || [],
      mentions: mentions || [] // Add mentions array
    };
    
    console.log('Sending post data...', { 
      contentLength: content.length,
      mediaSize: mediaURL ? `${(mediaURL.length / 1024 / 1024).toFixed(2)}MB` : 'none',
      hasThumbnail: !!thumbnailDataUrl,
      tagsCount: tags?.length || 0,
      mentionsCount: mentions?.length || 0
    });
    
    const response = await api.post('/posts/', postData, {
      timeout: 60000, // 60 second timeout for large uploads
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Post created successfully');
    return response.data;
  } catch (error) {
    console.error('Error creating post:', error);
    
    // Provide specific error messages
    if (error.message.includes('File size too large')) {
      throw new Error(error.message);
    } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      throw new Error('Upload timeout. Please try with a smaller file or check your connection.');
    } else if (error.response?.status === 413) {
      throw new Error('File too large for server. Please use a smaller file.');
    } else if (error.response?.status === 400) {
      throw new Error('Invalid file format or data. Please try again.');
    } else {
      throw new Error('Failed to create post. Please try again.');
    }
  }
}

// Get feed posts
export async function getFeedPosts(params = {}) {
  const {
    skip = 0,
    limit = 20,
    sort_by = 'created_at',
    media_type = 'all',
    order = 'desc'
  } = params;

  try {
    const response = await api.get('/posts/feed', {
      params: { skip, limit, sort_by, media_type, order }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching feed posts:', error);
    throw error;
  }
}

// Get explore posts (all posts)
export async function getExplorePosts(params = {}) {
  const {
    skip = 0,
    limit = 20,
    sort_by = 'created_at',
    media_type = 'all',
    order = 'desc'
  } = params;

  try {
    const response = await api.get('/posts/explore', {
      params: { skip, limit, sort_by, media_type, order }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching explore posts:', error);
    throw error;
  }
}

// Like/unlike a post
export async function likePost(postId) {
  try {
    const response = await api.post(`/posts/${postId}/like`);
    return response.data;
  } catch (error) {
    console.error('Error toggling like:', error);
    throw error;
  }
}

// Bookmark/unbookmark a post
export async function bookmarkPost(postId) {
  try {
    const response = await api.post(`/posts/${postId}/bookmark`);
    return response.data;
  } catch (error) {
    console.error('Error toggling bookmark:', error);
    throw error;
  }
}

// Get bookmarked posts
export async function getBookmarkedPosts(limit = 20, skip = 0) {
  try {
    const response = await api.get('/posts/bookmarks/my', {
      params: { limit, skip }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching bookmarked posts:', error);
    throw error;
  }
}

// Check if user has liked a post
export async function hasUserLikedPost(postId) {
  try {
    const response = await api.get(`/posts/${postId}/liked`);
    return response.data;
  } catch (error) {
    console.error('Error checking like status:', error);
    return false;
  }
}

// Get post by ID
export async function getPostById(postId) {
  try {
    const response = await api.get(`/posts/${postId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching post:', error);
    return null;
  }
}

// Add comment
export async function addComment(postId, content) {
  try {
    const response = await api.post(`/comments/posts/${postId}`, { content });
    return response.data;
  } catch (error) {
    console.error('Error adding comment:', error);
    throw error;
  }
}

// Get post comments
export async function getPostComments(postId) {
  try {
    const response = await api.get(`/comments/posts/${postId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching comments:', error);
    throw error;
  }
}

// Get posts statistics
export async function getPostsStats() {
  try {
    const response = await api.get('/posts/stats');
    return response.data;
  } catch (error) {
    console.error('Error fetching posts stats:', error);
    throw error;
  }
}

// Delete comment
export async function deleteComment(postId, commentId) {
  try {
    const response = await api.delete(`/comments/${commentId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting comment:', error);
    throw error;
  }
}

// Update post
export async function updatePost(postId, content, tags, mediaFile, thumbnailDataUrl = null, existingMediaUrl = null, mentions = []) {
  let mediaURL = existingMediaUrl; // Start with existing media URL
  
  // Only convert new media file if provided
  if (mediaFile) {
    mediaURL = await convertFileToBase64(mediaFile);
  }
  
  const postData = {
    content,
    media_url: mediaURL, // Will be existing URL if no new file, or new URL if file uploaded
    media_type: mediaFile ? (mediaFile.type.startsWith('video') ? 'video' : 'image') : (existingMediaUrl ? 'image' : null),
    thumbnail_url: thumbnailDataUrl, // Add thumbnail for videos
    tags: tags || [],
    mentions: mentions || [] // Add mentions array
  };
  
  try {
    const response = await api.put(`/posts/${postId}`, postData);
    return response.data;
  } catch (error) {
    console.error('Error updating post:', error);
    throw error;
  }
}

// Delete post
export async function deletePost(postId) {
  try {
    const response = await api.delete(`/posts/${postId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting post:', error);
    throw error;
  }
}


// Get posts where user is tagged
export async function getTaggedPosts(userId) {
  try {
    const response = await api.get(`/posts/user/${userId}/tagged`);
    return response.data;
  } catch (error) {
    console.error('Error fetching tagged posts:', error);
    throw error;
  }
}
