import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, MessageCircle, UserPlus, Trash2, CheckCheck, Check, X, UserCheck, Zap } from 'lucide-react';
import { 
  getNotifications, 
  markNotificationRead, 
  markAllNotificationsRead, 
  deleteNotification 
} from '../services/notifications.service';
import { getPendingFollowRequests, acceptFollowRequest, rejectFollowRequest } from '../services/users.service';

const ROSE_GRADIENT = "bg-gradient-to-r from-[#e93e68] to-[#f45d7d]";

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
    if (!notification.read) {
      handleMarkAsRead(notification.id || notification._id);
    }

    if (notification.type === 'follow') {
      navigate(`/profile/${notification.actor_id}`);
    } else if (notification.type === 'like' || notification.type === 'comment') {
      navigate(`/post/${notification.post_id}`);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'like':
        return <Heart size={20} className="text-rose-500" fill="currentColor" />;
      case 'comment':
        return <MessageCircle size={20} className="text-blue-400" />;
      case 'follow':
        return <UserPlus size={20} className="text-green-400" />;
      case 'follow_request':
        return <UserPlus size={20} className="text-orange-400" />;
      case 'follow_accepted':
        return <UserCheck size={20} className="text-green-400" />;
      case 'mention':
        return <UserPlus size={20} className="text-purple-400" />;
      default:
        return <Heart size={20} className="text-white/40" />;
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
      <div className="min-h-screen bg-[#0a0708] flex items-center justify-center">
        <div className="text-center">
          <div className={`w-16 h-16 ${ROSE_GRADIENT} rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse`}>
            <Heart size={32} className="text-white" />
          </div>
          <p className="text-white/40 font-medium">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0708] selection:bg-[#e93e68] selection:text-white">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-[#130f10]/80 backdrop-blur-xl border-b border-white/10 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors"
            >
              <ArrowLeft size={20} className="text-white" />
            </button>
            <div className={`w-10 h-10 ${ROSE_GRADIENT} rounded-xl flex items-center justify-center shadow-lg shadow-rose-600/20`}>
              <Zap size={20} fill="currentColor" className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white uppercase tracking-tighter italic">Notifications</h1>
              {unreadCount > 0 && (
                <p className="text-sm text-white/50">{unreadCount} unread</p>
              )}
            </div>
          </div>
          
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              disabled={markingAllRead}
              className={`flex items-center gap-2 px-4 py-2 ${ROSE_GRADIENT} text-white rounded-full text-sm font-bold hover:brightness-110 disabled:opacity-50 transition-all shadow-lg shadow-rose-600/20`}
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
            <div className="flex items-center gap-3 mb-4">
              <span className="w-2 h-2 bg-rose-500 rounded-full animate-pulse shadow-[0_0_10px_#e93e68]" />
              <h2 className="text-[10px] font-black uppercase tracking-[0.5em] text-rose-400/60">Follow Requests</h2>
            </div>
            <div className="space-y-2">
              {followRequests.map(request => (
                <div
                  key={request.request_id}
                  className="flex items-center gap-4 p-4 bg-[#130f10] rounded-2xl border border-white/5 hover:border-rose-500/30 transition-all"
                >
                  <img
                    src={request.photoURL || `https://i.pravatar.cc/150?u=${request.requester_id}`}
                    alt={request.username}
                    className="w-12 h-12 rounded-full cursor-pointer"
                    onClick={() => navigate(`/profile/${request.requester_id}`)}
                  />
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white">{request.displayName}</p>
                    <p className="text-sm text-white/50">@{request.username}</p>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAcceptRequest(request.request_id)}
                      className={`p-2 ${ROSE_GRADIENT} text-white rounded-full hover:brightness-110 transition-all shadow-lg shadow-rose-600/20`}
                      title="Accept"
                    >
                      <Check size={18} />
                    </button>
                    <button
                      onClick={() => handleRejectRequest(request.request_id)}
                      className="p-2 bg-white/5 text-white/60 rounded-full hover:bg-red-500/20 hover:text-red-400 transition-colors"
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
            <Heart size={64} className="text-white/20 mx-auto mb-4" />
            <h2 className="text-2xl font-black text-white mb-2">No notifications yet</h2>
            <p className="text-white/40">When people interact with your posts, you'll see it here</p>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto px-4 space-y-2">
            {notifications.map(notification => (
              <div
                key={notification.id || notification._id}
                className={`flex items-start gap-4 p-4 rounded-2xl transition-all cursor-pointer ${
                  notification.read 
                    ? 'bg-transparent hover:bg-white/5' 
                    : 'bg-[#130f10] border border-white/5 hover:border-rose-500/30'
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
                        <span className="font-bold text-white">
                          {notification.actor_displayName}
                        </span>
                        <span className="text-white/60 ml-1">
                          {getNotificationText(notification)}
                        </span>
                      </p>
                      
                      {notification.post_content && (
                        <p className="text-xs text-white/40 mt-1 overflow-hidden"
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
                        <p className="text-xs text-white/40 mt-1 overflow-hidden"
                           style={{ 
                             display: '-webkit-box',
                             WebkitLineClamp: 2,
                             WebkitBoxOrient: 'vertical',
                             textOverflow: 'ellipsis'
                           }}>
                          Comment: "{notification.comment_content}"
                        </p>
                      )}
                      
                      <p className="text-xs text-white/30 mt-2">
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
                        className="p-1 text-white/40 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
                
                {!notification.read && (
                  <div className="w-2 h-2 bg-rose-500 rounded-full flex-shrink-0 mt-2 shadow-[0_0_10px_#e93e68]" />
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
