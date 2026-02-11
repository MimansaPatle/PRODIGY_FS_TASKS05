import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, User, MessageCircle } from 'lucide-react';
import { getConversations, getConversationMessages, sendMessage } from '../services/messages.service';
import { useAuth } from '../context/AuthContext';

const Messages = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const { userProfile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.user_id);
    }
  }, [selectedConversation]);

  const loadConversations = async () => {
    try {
      const data = await getConversations();
      setConversations(data);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (userId) => {
    try {
      const data = await getConversationMessages(userId);
      setMessages(data);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    setSending(true);
    try {
      const message = await sendMessage(selectedConversation.user_id, newMessage.trim());
      setMessages(prev => [...prev, message]);
      setNewMessage('');
      
      // Update conversation list
      loadConversations();
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateString) => {
    // Parse the date string
    const date = new Date(dateString);
    
    // Check if the date string contains timezone info (+ or -)
    // If it has timezone info, it's already in IST from the backend
    // If not, it's UTC and needs conversion
    const hasTimezone = dateString.includes('+') || dateString.includes('Z');
    
    let displayDate;
    if (hasTimezone && dateString.includes('+05:30')) {
      // Already in IST, no conversion needed
      displayDate = date;
    } else {
      // UTC time, convert to IST by adding 5.5 hours
      displayDate = new Date(date.getTime() + (5.5 * 60 * 60 * 1000));
    }
    
    // Format the time
    return displayDate.toLocaleTimeString('en-IN', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafbfc] flex items-center justify-center">
        <div className="text-center">
          <MessageCircle size={48} className="text-indigo-600 mx-auto mb-4 animate-pulse" />
          <p className="text-slate-400 font-medium">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafbfc] flex">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100 p-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-black text-slate-900">Messages</h1>
        </div>
      </div>

      <div className="flex w-full pt-20">
        {/* Conversations List */}
        <div className="w-1/3 border-r border-slate-100 bg-white">
          <div className="p-4">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Conversations</h2>
            
            {conversations.length === 0 ? (
              <div className="text-center py-12">
                <MessageCircle size={48} className="text-slate-300 mx-auto mb-4" />
                <p className="text-slate-400">No conversations yet</p>
                <p className="text-xs text-slate-300 mt-2">Share a post to start messaging!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {conversations.map((conv, index) => (
                  <button
                    key={`conv-${conv.user_id || index}`}
                    onClick={() => setSelectedConversation(conv)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${
                      selectedConversation?.user_id === conv.user_id
                        ? 'bg-indigo-50 border-2 border-indigo-200'
                        : 'hover:bg-slate-50 border-2 border-transparent'
                    }`}
                  >
                    <img
                      src={conv.photoURL || `https://i.pravatar.cc/150?u=${conv.user_id}`}
                      alt={conv.username}
                      className="w-12 h-12 rounded-full"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-slate-900 truncate">{conv.displayName}</p>
                        {conv.unread_count > 0 && (
                          <span className="bg-indigo-600 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                            {conv.unread_count}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-500 truncate">@{conv.username}</p>
                      {conv.last_message && (
                        <p className="text-xs text-slate-400 truncate mt-1">
                          {conv.last_message.content}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 flex flex-col">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-slate-100 bg-white">
                <div className="flex items-center gap-3">
                  <img
                    src={selectedConversation.photoURL || `https://i.pravatar.cc/150?u=${selectedConversation.user_id}`}
                    alt={selectedConversation.username}
                    className="w-10 h-10 rounded-full"
                  />
                  <div>
                    <p className="font-bold text-slate-900">{selectedConversation.displayName}</p>
                    <p className="text-sm text-slate-500">@{selectedConversation.username}</p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message, index) => {
                  const isOwn = message.sender_id === userProfile?.id;
                  return (
                    <div
                      key={`msg-${message.id || message._id || index}`}
                      className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                          isOwn
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 text-slate-900'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        {message.story_data && (
                          <div className={`mt-3 p-3 rounded-lg border ${
                            isOwn 
                              ? 'bg-white/10 border-white/20' 
                              : 'bg-white border-slate-200'
                          }`}>
                            <p className={`text-xs font-bold mb-2 ${isOwn ? 'text-white/90' : 'text-slate-700'}`}>
                              Replied to {isOwn ? 'their' : 'your'} story
                            </p>
                            <div className="relative">
                              {message.story_data.media_type === 'video' ? (
                                <video 
                                  src={message.story_data.media_url}
                                  className="w-full h-32 object-cover rounded"
                                  controls={false}
                                />
                              ) : (
                                <img 
                                  src={message.story_data.media_url}
                                  alt="Story"
                                  className="w-full h-32 object-cover rounded"
                                />
                              )}
                            </div>
                          </div>
                        )}
                        {message.post_data && (
                          <button
                            onClick={() => navigate(`/post/${message.post_data.id || message.post_data._id}`)}
                            className={`mt-3 p-3 rounded-lg border w-full text-left hover:opacity-80 transition-opacity ${
                              isOwn 
                                ? 'bg-white/10 border-white/20' 
                                : 'bg-white border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-start gap-2 mb-2">
                              <img 
                                src={message.post_data.author_photo || `https://i.pravatar.cc/150?u=${message.post_data.author_id}`}
                                alt={message.post_data.author_username}
                                className="w-6 h-6 rounded-full"
                              />
                              <div className="flex-1 min-w-0">
                                <p className={`text-xs font-bold ${isOwn ? 'text-white/90' : 'text-slate-700'}`}>
                                  @{message.post_data.author_username}
                                </p>
                                <p className={`text-xs ${isOwn ? 'text-white/75' : 'text-slate-600'} overflow-hidden`}
                                   style={{ 
                                     display: '-webkit-box',
                                     WebkitLineClamp: 2,
                                     WebkitBoxOrient: 'vertical',
                                     textOverflow: 'ellipsis'
                                   }}>
                                  {message.post_data.content}
                                </p>
                              </div>
                            </div>
                            
                            {message.post_data.media_url && (
                              <div className="mt-2">
                                {message.post_data.media_type === 'video' ? (
                                  <video 
                                    src={message.post_data.media_url}
                                    className="w-full h-20 object-cover rounded"
                                    controls={false}
                                  />
                                ) : (
                                  <img 
                                    src={message.post_data.media_url}
                                    alt="Shared post"
                                    className="w-full h-20 object-cover rounded"
                                  />
                                )}
                              </div>
                            )}
                            
                            <div className="flex items-center gap-3 mt-2 text-xs">
                              <span className={isOwn ? 'text-white/60' : 'text-slate-400'}>
                                ❤️ {message.post_data.likes_count || 0}
                              </span>
                              <span className={isOwn ? 'text-white/60' : 'text-slate-400'}>
                                💬 {message.post_data.comments_count || 0}
                              </span>
                            </div>
                          </button>
                        )}
                        <p className={`text-xs mt-1 ${isOwn ? 'text-indigo-200' : 'text-slate-500'}`}>
                          {formatTime(message.created_at)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Message Input */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-100 bg-white">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-3 bg-slate-50 rounded-full border-0 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all"
                    disabled={sending}
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim() || sending}
                    className="p-3 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send size={20} />
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle size={64} className="text-slate-300 mx-auto mb-4" />
                <p className="text-slate-400 font-medium">Select a conversation to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;