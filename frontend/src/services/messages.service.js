import api from '../config/api';

// Send a message
export async function sendMessage(recipientId, content, postId = null, storyId = null) {
  try {
    const response = await api.post('/messages/', {
      recipient_id: recipientId,
      content,
      post_id: postId,
      story_id: storyId
    });
    return response.data;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
}

// Get all conversations
export async function getConversations() {
  try {
    const response = await api.get('/messages/conversations');
    return response.data;
  } catch (error) {
    console.error('Error fetching conversations:', error);
    throw error;
  }
}

// Get messages in a conversation
export async function getConversationMessages(userId, skip = 0, limit = 50) {
  try {
    const response = await api.get(`/messages/${userId}`, {
      params: { skip, limit }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching conversation messages:', error);
    throw error;
  }
}

// Mark message as read
export async function markMessageRead(messageId) {
  try {
    const response = await api.put(`/messages/${messageId}/read`);
    return response.data;
  } catch (error) {
    console.error('Error marking message as read:', error);
    throw error;
  }
}

// Delete message
export async function deleteMessage(messageId) {
  try {
    const response = await api.delete(`/messages/${messageId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting message:', error);
    throw error;
  }
}

// Get unread messages count
export async function getUnreadMessagesCount() {
  try {
    const conversations = await getConversations();
    const unreadCount = conversations.reduce((total, conv) => total + conv.unread_count, 0);
    return unreadCount;
  } catch (error) {
    console.error('Error fetching unread messages count:', error);
    return 0;
  }
}

// Share a post via message
export async function sharePost(postId, recipientId, message = '') {
  try {
    // Ensure IDs are strings and not empty
    const validPostId = String(postId || '').trim();
    const validRecipientId = String(recipientId || '').trim();
    
    if (!validPostId || !validRecipientId) {
      throw new Error('Invalid post ID or recipient ID');
    }
    
    const content = message.trim() || 'Shared a post with you';
    const response = await api.post('/messages/', {
      recipient_id: validRecipientId,
      content: content,
      post_id: validPostId
    });
    return response.data;
  } catch (error) {
    console.error('Error sharing post:', error);
    throw error;
  }
}