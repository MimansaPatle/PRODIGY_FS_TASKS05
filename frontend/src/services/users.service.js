import api from '../config/api';

// Get user profile by ID
export async function getUserProfile(userId) {
  try {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
}

// Update user profile
export async function updateUserProfile(userId, profileData) {
  try {
    const response = await api.put('/users/me', profileData);
    return response.data;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
}

// Follow/Unfollow user
export async function toggleFollowUser(targetUserId) {
  try {
    const response = await api.post(`/users/follow/${targetUserId}`);
    return {
      following: response.data.following,
      requested: response.data.requested
    };
  } catch (error) {
    console.error('Error toggling follow:', error);
    throw error;
  }
}

// Check if user is following another user
export async function isFollowing(targetUserId) {
  try {
    const response = await api.get(`/users/${targetUserId}/following`);
    return response.data;
  } catch (error) {
    console.error('Error checking follow status:', error);
    return false;
  }
}

// Get follow status (following, requested, or none)
export async function getFollowStatus(targetUserId) {
  try {
    const response = await api.get(`/users/${targetUserId}/follow-status`);
    return response.data;
  } catch (error) {
    console.error('Error getting follow status:', error);
    return { following: false, requested: false };
  }
}

// Get pending follow requests
export async function getPendingFollowRequests() {
  try {
    const response = await api.get('/users/follow-requests/pending');
    return response.data;
  } catch (error) {
    console.error('Error fetching follow requests:', error);
    throw error;
  }
}

// Accept follow request
export async function acceptFollowRequest(requestId) {
  try {
    const response = await api.post(`/users/follow-requests/${requestId}/accept`);
    return response.data;
  } catch (error) {
    console.error('Error accepting follow request:', error);
    throw error;
  }
}

// Reject follow request
export async function rejectFollowRequest(requestId) {
  try {
    const response = await api.post(`/users/follow-requests/${requestId}/reject`);
    return response.data;
  } catch (error) {
    console.error('Error rejecting follow request:', error);
    throw error;
  }
}

// Get user's posts
export async function getUserPosts(userId, limitCount = 20) {
  try {
    const response = await api.get(`/posts/user/${userId}?limit=${limitCount}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching user posts:', error);
    throw error;
  }
}

// Get trending users (users with most followers)
export async function getTrendingUsers(limitCount = 10) {
  try {
    const response = await api.get(`/users/trending?limit=${limitCount}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching trending users:', error);
    throw error;
  }
}

// Search users by username or display name
export async function searchUsers(searchTerm, limitCount = 10) {
  try {
    const response = await api.get(`/users/search/${encodeURIComponent(searchTerm)}?limit=${limitCount}`);
    return response.data;
  } catch (error) {
    console.error('Error searching users:', error);
    throw error;
  }
}

// Get users that the current user is following
export async function getFollowing(userId, limitCount = 50) {
  try {
    const response = await api.get(`/users/${userId}/following-list?limit=${limitCount}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching following list:', error);
    throw error;
  }
}