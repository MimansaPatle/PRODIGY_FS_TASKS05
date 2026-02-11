import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { X, Image, Video, Hash, Upload, User as UserIcon } from 'lucide-react';
import { createPost } from '../../services/posts.service';
import MentionAutocomplete from '../MentionAutocomplete';
import '../../styles/components.css';

export default function CreatePost({ onClose, onPostCreated }) {
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mentionedUsers, setMentionedUsers] = useState([]);
  
  const { currentUser } = useAuth();

  const handleMention = (user) => {
    const userId = user.id || user._id;
    if (!mentionedUsers.find(u => (u.id || u._id) === userId)) {
      setMentionedUsers([...mentionedUsers, user]);
    }
  };

  const removeMention = (userId) => {
    setMentionedUsers(mentionedUsers.filter(u => (u.id || u._id) !== userId));
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setMediaFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setMediaPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() && !mediaFile) {
      setError('Please add content or media to your post');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const tagsArray = tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      const mentionIds = mentionedUsers.map(u => u.id || u._id);

      const newPost = await createPost(
        currentUser.uid,
        content.trim(),
        tagsArray,
        mediaFile,
        mentionIds
      );

      onPostCreated(newPost);
    } catch (error) {
      console.error('Error creating post:', error);
      setError('Failed to create post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="vois-card-large w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-2xl font-black text-deep-slate">Create Post</h2>
          <button
            onClick={onClose}
            className="p-2 text-muted-slate hover:text-deep-slate transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-2xl text-sm">
              {error}
            </div>
          )}

          {/* Media Upload */}
          <div>
            <label className="vois-section-label block mb-3">VISUAL CONTENT</label>
            
            {mediaPreview ? (
              <div className="relative">
                {mediaFile?.type.startsWith('video') ? (
                  <video
                    src={mediaPreview}
                    className="w-full h-64 object-cover rounded-2xl"
                    controls
                  />
                ) : (
                  <img
                    src={mediaPreview}
                    alt="Preview"
                    className="w-full h-64 object-cover rounded-2xl"
                  />
                )}
                <button
                  type="button"
                  onClick={() => {
                    setMediaFile(null);
                    setMediaPreview(null);
                  }}
                  className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="block">
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center hover:border-electric-indigo transition-colors cursor-pointer">
                  <Upload className="w-12 h-12 text-muted-slate mx-auto mb-4" />
                  <p className="font-medium text-deep-slate mb-2">Upload your visual</p>
                  <p className="vois-section-label text-muted-slate">
                    DRAG & DROP OR CLICK TO SELECT
                  </p>
                  <div className="flex items-center justify-center gap-4 mt-4">
                    <div className="flex items-center gap-2 text-muted-slate">
                      <Image className="w-4 h-4" />
                      <span className="text-xs">Images</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-slate">
                      <Video className="w-4 h-4" />
                      <span className="text-xs">Videos</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-slate mt-2 text-center">
                    🆓 FREE VERSION: Images stored as base64 (no Firebase Storage needed)
                  </p>
                </div>
              </label>
            )}
          </div>

          {/* Caption */}
          <div>
            <label className="vois-section-label block mb-3">CAPTION</label>
            <MentionAutocomplete
              value={content}
              onChange={setContent}
              onMention={handleMention}
              placeholder="Share your story behind this visual... (Type @ to mention someone)"
              className="vois-textarea w-full h-32"
            />
            <div className="flex justify-between items-center mt-2">
              <span className="vois-meta text-muted-slate">
                {content.length}/500 CHARACTERS
              </span>
            </div>
            
            {/* Mentioned Users */}
            {mentionedUsers.length > 0 && (
              <div className="mt-4">
                <p className="vois-section-label mb-2">MENTIONED USERS</p>
                <div className="flex flex-wrap gap-2">
                  {mentionedUsers.map(user => (
                    <div
                      key={user.id || user._id}
                      className="flex items-center gap-2 px-3 py-2 bg-indigo-50 rounded-full"
                    >
                      {user.photoURL ? (
                        <img
                          src={user.photoURL}
                          alt={user.username}
                          className="w-5 h-5 rounded-full"
                        />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-indigo-400 flex items-center justify-center">
                          <UserIcon className="w-3 h-3 text-white" />
                        </div>
                      )}
                      <span className="text-sm font-bold text-indigo-700">@{user.username}</span>
                      <button
                        type="button"
                        onClick={() => removeMention(user.id || user._id)}
                        className="text-indigo-400 hover:text-indigo-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Tags */}
          <div>
            <label className="vois-section-label block mb-3">TAGS</label>
            <div className="relative">
              <Hash className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-slate" />
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="photography, art, nature (comma separated)"
                className="vois-input w-full pl-12"
              />
            </div>
            <p className="vois-meta text-muted-slate mt-2">
              SEPARATE TAGS WITH COMMAS
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-6 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="vois-btn-secondary flex-1"
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={loading || (!content.trim() && !mediaFile)}
              className="vois-btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'PUBLISHING...' : 'PUBLISH POST'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}