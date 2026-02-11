import api from '../config/api';

// Get notifications
export async function getNotifications(params = {}) {
  const {
    skip = 0,
    limit = 20,
    unread_only = false
  } = params;

  try {
    const response = await api.get('/notifications/', {
      params: { skip, limit, unread_only }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
}

// Get unread notifications count
export async function getUnreadCount() {
  try {
    const response = await api.get('/notifications/unread-count');
    return response.data;
  } catch (error) {
    console.error('Error fetching unread count:', error);
    return 0;
  }
}

// Mark notification as read
export async function markNotificationRead(notificationId) {
  try {
    const response = await api.put(`/notifications/${notificationId}/read`);
    return response.data;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
}

// Mark all notifications as read
export async function markAllNotificationsRead() {
  try {
    const response = await api.put('/notifications/mark-all-read');
    return response.data;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
}

// Delete notification
export async function deleteNotification(notificationId) {
  try {
    const response = await api.delete(`/notifications/${notificationId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
}