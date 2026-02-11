import api from '../config/api';

// Create a new story
export async function createStory(mediaFile, mediaType, thumbnailDataUrl = null) {
  try {
    const response = await api.post('/stories/', {
      media_url: mediaFile,
      media_type: mediaType,
      thumbnail_url: thumbnailDataUrl
    });
    return response.data;
  } catch (error) {
    console.error('Error creating story:', error);
    throw error;
  }
}

// Get all active stories
export async function getActiveStories() {
  try {
    const response = await api.get('/stories/active');
    return response.data;
  } catch (error) {
    console.error('Error fetching active stories:', error);
    throw error;
  }
}

// Get a specific story
export async function getStory(storyId) {
  try {
    const response = await api.get(`/stories/${storyId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching story:', error);
    throw error;
  }
}

// Mark story as viewed
export async function markStoryViewed(storyId) {
  try {
    const response = await api.post(`/stories/${storyId}/view`);
    return response.data;
  } catch (error) {
    console.error('Error marking story as viewed:', error);
    throw error;
  }
}

// Get story viewers
export async function getStoryViewers(storyId) {
  try {
    const response = await api.get(`/stories/${storyId}/viewers`);
    return response.data;
  } catch (error) {
    console.error('Error fetching story viewers:', error);
    throw error;
  }
}

// Delete a story
export async function deleteStory(storyId) {
  try {
    const response = await api.delete(`/stories/${storyId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting story:', error);
    throw error;
  }
}
