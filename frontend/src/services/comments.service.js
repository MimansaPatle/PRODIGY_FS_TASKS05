import api from '../config/api';

// Add comment to post
export async function addComment(postId, userId, content) {
  try {
    const response = await api.post(`/comments/posts/${postId}`, { content });
    return response.data;
  } catch (error) {
    console.error('Error adding comment:', error);
    throw error;
  }
}

// Get comments for a post
export async function getPostComments(postId, limitCount = 50) {
  try {
    const response = await api.get(`/comments/posts/${postId}?limit=${limitCount}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching comments:', error);
    throw error;
  }
}

// Delete comment (only by author)
export async function deleteComment(postId, commentId, userId) {
  try {
    const response = await api.delete(`/comments/${commentId}`);
    return true;
  } catch (error) {
    console.error('Error deleting comment:', error);
    return false;
  }
}