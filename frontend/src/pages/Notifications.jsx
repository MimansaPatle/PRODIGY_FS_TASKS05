import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, MessageCircle, UserPlus, Trash2, CheckCheck, Check, X, UserCheck } from 'lucide-react';
import { 
  getNotifications, 
  markNotificationRead, 
  markAllNotificationsRead, 
  deleteNotification 
} from '../services/notifications.service';
import { getPendingFollowRequests, acceptFollowRequest, rejectFollowRequest } from '../services/users.service';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [followRequests, setFollowRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [markingAllRead, setMarkingAllRead] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadNotifications();
    loadFollowRequests();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const data = await getNotifications({ limit: 50 });
      setNotifications(data);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFollowRequests = async () => {
    try {
      const requests = await getPendingFollowRequests();
      setFollowRequests(requests);
    } catch (error) {
      console.error('Error loading follow requests:', error);
    }
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      await acceptFollowRequest(requestId);
      setFollowRequests(prev => prev.filter(req => req.request_id !== requestId));
    } catch (error) {
      console.error('Error accepting follow request:', error);
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      await rejectFollowRequest(requestId);
      setFollowRequests(prev => prev.filter(req => req.request_id !== requestId));
    } catch (error) {
      console.error('Error rejecting follow request:', error);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await markNotificationRead(notificationId);
      setNotifications(prev => 
        prev.map(notif => 
          (notif.id || notif._id) === notificationId ? { ...notif, read: true } : notif
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setMarkingAllRead(true);
      await markAllNotificationsRead();
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, read: true }))
      );
    } catch (error) {
      console.error('Error marking all as read:', error);
    } finally {
      setMarkingAllRead(false);
    }
  };

  const handleDelete = async (notificationId) => {
    try {
      await deleteNotification(notificationId);
      setNotifications(prev => 
        prev.filter(notif => (notif.id || notif._id) !== notificationId)
      );
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleNotificationClick = (notification) => {
    // Mark as read when clicked
    if (!notification.read) {
      handleMarkAsRead(notification.id || notification._id);
    }

    // Navigate based on notification type
    if (notification.type === 'follow') {
      navigate(`/profile/${notification.actor_id}`);
    } else if (notification.type === 'like' || notification.type === 'comment') {
      navigate(`/post/${notification.post_id}`);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'like':
        return <Heart size={20} className="text-red-500" fill="currentColor" />;
      case 'comment':
        return <MessageCircle size={20} className="text-blue-500" />;
      case 'follow':
        return <UserPlus size={20} className="text-green-500" />;
      case 'follow_request':
        return <UserPlus size={20} className="text-orange-500" />;
      case 'follow_accepted':
        return <UserCheck size={20} className="text-green-500" />;
      case 'mention':
        return <UserPlus size={20} className="text-purple-500" />;
      default:
        return <Heart size={20} className="text-gray-500" />;
    }
  };

  const getNotificationText = (notification) => {
    switch (notification.type) {
      case 'like':
        return `liked your post`;
      case 'comment':
        return `commented on your post`;
      case 'follow':
        return `started following you`;
      case 'follow_request':
        return `wants to follow you`;
      case 'follow_accepted':
        return `accepted your follow request`;
      case 'mention':
        return `mentioned you in a post`;
      default:
        return 'interacted with your content';
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return `${Math.floor(diffInHours / 24)}d ago`;
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafbfc] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Heart size={32} className="text-white" />
          </div>
          <p className="text-slate-400 font-medium">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafbfc]">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-xl font-black text-slate-900">Notifications</h1>
              {unreadCount > 0 && (
                <p className="text-sm text-slate-500">{unreadCount} unread</p>
              )}
            </div>
          </div>
          
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              disabled={markingAllRead}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-full text-sm font-bold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              <CheckCheck size={16} />
              {markingAllRead ? 'Marking...' : 'Mark all read'}
            </button>
          )}
        </div>
      </div>

      <div className="pt-24 pb-8">
        {/* Follow Requests Section */}
        {followRequests.length > 0 && (
          <div className="max-w-2xl mx-auto px-4 mb-6">
            <h2 className="text-lg font-black text-slate-900 mb-3">Follow Requests</h2>
            <div className="space-y-2">
              {followRequests.map(request => (
                <div
                  key={request.request_id}
                  className="flex items-center gap-4 p-4 bg-white rounded-2xl shadow-sm"
                >
                  <img
                    src={request.photoURL || `https://i.pravatar.cc/150?u=${request.requester_id}`}
                    alt={request.username}
                    className="w-12 h-12 rounded-full cursor-pointer"
                    onClick={() => navigate(`/profile/${request.requester_id}`)}
                  />
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900">{request.displayName}</p>
                    <p className="text-sm text-slate-500">@{request.username}</p>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAcceptRequest(request.request_id)}
                      className="p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors"
                      title="Accept"
                    >
                      <Check size={18} />
                    </button>
                    <button
                      onClick={() => handleRejectRequest(request.request_id)}
                      className="p-2 bg-slate-200 text-slate-600 rounded-full hover:bg-red-100 hover:text-red-600 transition-colors"
                      title="Reject"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {notifications.length === 0 ? (
          <div className="text-center py-16">
            <Heart size={64} className="text-slate-300 mx-auto mb-4" />
            <h2 className="text-2xl font-black text-slate-900 mb-2">No notifications yet</h2>
            <p className="text-slate-400">When people interact with your posts, you'll see it here</p>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto px-4 space-y-2">
            {notifications.map(notification => (
              <div
                key={notification.id || notification._id}
                className={`flex items-start gap-4 p-4 rounded-2xl transition-all cursor-pointer hover:bg-white/50 ${
                  notification.read ? 'bg-transparent' : 'bg-white shadow-sm'
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex-shrink-0">
                  <img
                    src={notification.actor_photo || `https://i.pravatar.cc/150?u=${notification.actor_id}`}
                    alt={notification.actor_username}
                    className="w-12 h-12 rounded-full"
                  />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-sm">
                        <span className="font-bold text-slate-900">
                          {notification.actor_displayName}
                        </span>
                        <span className="text-slate-600 ml-1">
                          {getNotificationText(notification)}
                        </span>
                      </p>
                      
                      {notification.post_content && (
                        <p className="text-xs text-slate-500 mt-1 overflow-hidden"
                           style={{ 
                             display: '-webkit-box',
                             WebkitLineClamp: 2,
                             WebkitBoxOrient: 'vertical',
                             textOverflow: 'ellipsis'
                           }}>
                          "{notification.post_content}"
                        </p>
                      )}
                      
                      {notification.comment_content && (
                        <p className="text-xs text-slate-500 mt-1 overflow-hidden"
                           style={{ 
                             display: '-webkit-box',
                             WebkitLineClamp: 2,
                             WebkitBoxOrient: 'vertical',
                             textOverflow: 'ellipsis'
                           }}>
                          Comment: "{notification.comment_content}"
                        </p>
                      )}
                      
                      <p className="text-xs text-slate-400 mt-2">
                        {formatTime(notification.created_at)}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {getNotificationIcon(notification.type)}
                      
                      {notification.post_media_url && (
                        <img
                          src={notification.post_media_url}
                          alt="Post"
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      )}
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(notification.id || notification._id);
                        }}
                        className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
                
                {!notification.read && (
                  <div className="w-2 h-2 bg-indigo-600 rounded-full flex-shrink-0 mt-2" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;