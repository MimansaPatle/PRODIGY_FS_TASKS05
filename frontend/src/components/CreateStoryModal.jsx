import { useState } from 'react';
import { X, Upload, Image as ImageIcon, Video } from 'lucide-react';
import { createStory } from '../services/stories.service';

export default function CreateStoryModal({ onClose, onSuccess }) {
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [mediaType, setMediaType] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = (file) => {
    if (!file) return;

    // Validate file type
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    if (!isImage && !isVideo) {
      setError('Please select an image or video file');
      return;
    }

    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      setError('File size must be less than 50MB');
      return;
    }

    setError('');
    setMediaType(isImage ? 'image' : 'video');

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setMediaPreview(e.target.result);
      setMediaFile(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleSubmit = async () => {
    if (!mediaFile) {
      setError('Please select a file');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await createStory(mediaFile, mediaType);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating story:', error);
      setError(error.response?.data?.detail || 'Failed to create story');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 z-10 p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors"
        >
          <X size={20} />
        </button>

        <div className="p-10">
          <h2 className="text-2xl font-black text-slate-900 mb-8">Create Story</h2>

          {/* Upload area */}
          {!mediaPreview ? (
            <div
              className={`border-2 border-dashed rounded-3xl p-12 text-center transition-all ${
                isDragging
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50'
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <Upload size={48} className="mx-auto mb-4 text-slate-300" />
              <p className="text-slate-600 font-bold mb-2">Drag & drop your photo or video</p>
              <p className="text-slate-400 text-sm mb-6">or</p>
              <label className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-full font-bold text-sm cursor-pointer hover:bg-indigo-700 transition-colors">
                Choose File
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={(e) => handleFileSelect(e.target.files[0])}
                  className="hidden"
                />
              </label>
              <p className="text-xs text-slate-400 mt-4">Max 50MB • Images & Videos</p>
            </div>
          ) : (
            <div className="relative">
              {/* Preview */}
              <div className="relative w-full h-96 bg-black rounded-3xl overflow-hidden">
                {mediaType === 'video' ? (
                  <video
                    src={mediaPreview}
                    className="w-full h-full object-contain"
                    controls
                  />
                ) : (
                  <img
                    src={mediaPreview}
                    alt="Story preview"
                    className="w-full h-full object-contain"
                  />
                )}
              </div>

              {/* Change file button */}
              <button
                onClick={() => {
                  setMediaFile(null);
                  setMediaPreview(null);
                  setMediaType(null);
                }}
                className="mt-4 px-4 py-2 bg-slate-100 text-slate-600 rounded-full text-sm font-bold hover:bg-slate-200 transition-colors"
              >
                Change File
              </button>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-medium">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4 mt-8">
            <button
              onClick={onClose}
              className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-full font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || !mediaFile}
              className="flex-1 py-4 bg-indigo-600 text-white rounded-full font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-600/30 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-700 transition-colors"
            >
              {loading ? 'Posting...' : 'Share Story'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
