import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Camera, User, Mail, Type, FileText, Zap, ArrowLeft, Upload, X } from 'lucide-react';

export default function EditProfile() {
  const { userProfile, updateUserProfile } = useAuth();
  const navigate = useNavigate();
  
  // Get user ID, handling both id and _id fields
  const userId = userProfile?.id || userProfile?._id;
  
  const [formData, setFormData] = useState({
    displayName: '',
    username: '',
    bio: '',
    photoURL: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');

  useEffect(() => {
    if (userProfile) {
      setFormData({
        displayName: userProfile.displayName || '',
        username: userProfile.username || '',
        bio: userProfile.bio || '',
        photoURL: userProfile.photoURL || ''
      });
      setProfileImagePreview(userProfile.photoURL || '');
    }
  }, [userProfile]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const validateImageFile = (file) => {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Please select a valid image file (JPG, PNG, GIF, or WebP)');
    }
    
    if (file.size > maxSize) {
      throw new Error('Image file too large. Maximum size: 5MB');
    }
  };

  const handleImageSelect = (file) => {
    setError('');
    setUploadProgress('');
    
    if (!file) return;
    
    try {
      validateImageFile(file);
      setProfileImage(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
      
      const sizeMB = (file.size / 1024 / 1024).toFixed(2);
      setUploadProgress(`Image selected: ${file.name} (${sizeMB}MB)`);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleImageSelect(files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleFileInput = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleImageSelect(file);
    }
  };

  const removeImage = () => {
    setProfileImage(null);
    setProfileImagePreview(userProfile?.photoURL || '');
    setUploadProgress('');
    setError('');
  };

  const convertImageToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      let updatedFormData = { ...formData };
      
      // If a new image was selected, convert it to base64
      if (profileImage) {
        setUploadProgress('Processing image...');
        const base64Image = await convertImageToBase64(profileImage);
        updatedFormData.photoURL = base64Image;
      }
      
      await updateUserProfile(updatedFormData);
      setSuccess('Profile updated successfully!');
      setTimeout(() => {
        navigate(`/profile/${userId}`, { replace: true });
      }, 1500);
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
      setUploadProgress('');
    }
  };

  return (
    <div className="min-h-screen bg-[#fafbfc] font-sans text-slate-900">
      
      {/* Floating Logo Top Left */}
      <div className="fixed top-8 left-8 z-[110] flex items-center gap-3">
        <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-600/20">
          <Zap size={22} fill="currentColor" />
        </div>
        <span className="font-black text-xl tracking-tighter uppercase italic text-indigo-600">Vois</span>
      </div>

      <div className="max-w-2xl mx-auto p-6 md:p-12 pt-24">
        <div className="bg-white/70 backdrop-blur-xl border border-white/20 shadow-lg rounded-[3rem] p-8 md:p-12">
          
          {/* Header */}
          <div className="flex items-center gap-4 mb-10">
            <button 
              onClick={() => navigate(`/profile/${userId}`)}
              className="p-3 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Edit Studio</h1>
              <p className="text-slate-400 font-medium">Update your profile information</p>
            </div>
          </div>

          {/* Messages */}
          {error && (
            <div className="mb-8 p-4 bg-red-50 border border-red-200 text-red-600 rounded-2xl text-sm font-medium">
              {error}
            </div>
          )}
          
          {success && (
            <div className="mb-8 p-4 bg-green-50 border border-green-200 text-green-600 rounded-2xl text-sm font-medium">
              {success}
            </div>
          )}

          {/* Profile Photo */}
          <div className="text-center mb-10">
            <div className="relative inline-block">
              <div className="relative">
                {profileImagePreview ? (
                  <img
                    src={profileImagePreview}
                    alt={userProfile?.displayName}
                    className="w-24 h-24 rounded-[2rem] object-cover shadow-xl"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-r from-indigo-600 to-pink-500 flex items-center justify-center shadow-xl">
                    <User className="w-12 h-12 text-white" />
                  </div>
                )}
              </div>
              
              {/* Drag and Drop Area */}
              <div 
                className={`absolute -inset-2 border-2 border-dashed rounded-[2rem] transition-all duration-300 ${
                  isDragging 
                    ? 'border-indigo-500 bg-indigo-50/80 backdrop-blur-sm' 
                    : 'border-transparent hover:border-indigo-300 hover:bg-indigo-50/50'
                } cursor-pointer`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => document.getElementById('profile-image-input').click()}
              >
                <div className={`absolute inset-0 flex items-center justify-center transition-opacity ${
                  isDragging ? 'opacity-100' : 'opacity-0 hover:opacity-100'
                }`}>
                  <div className="bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg">
                    <Upload size={16} className="text-indigo-600" />
                  </div>
                </div>
              </div>
              
              {/* Remove Image Button */}
              {profileImage && (
                <button
                  onClick={removeImage}
                  className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg z-10"
                >
                  <X size={12} />
                </button>
              )}
              
              <input
                id="profile-image-input"
                type="file"
                accept="image/*"
                onChange={handleFileInput}
                className="hidden"
              />
            </div>
            
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mt-4">
              Profile Photo
            </p>
            <p className="text-[8px] font-medium text-slate-400 mt-1">
              Drag & drop or click to upload • Max 5MB
            </p>
            
            {/* Upload Progress */}
            {uploadProgress && (
              <div className="mt-3 p-2 bg-blue-50 border border-blue-200 text-blue-600 rounded-lg text-xs font-medium">
                {uploadProgress}
              </div>
            )}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Display Name */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Display Name</label>
              <div className="relative">
                <Type size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                <input
                  type="text"
                  name="displayName"
                  value={formData.displayName}
                  onChange={handleChange}
                  placeholder="Your display name"
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-600 transition-all font-bold text-slate-800"
                  required
                />
              </div>
            </div>

            {/* Username */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Username</label>
              <div className="relative">
                <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="your.username"
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-600 transition-all font-bold text-slate-800"
                  required
                />
              </div>
            </div>

            {/* Email - Read Only */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Email (Read Only)</label>
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                <input
                  type="email"
                  value={userProfile?.email || ''}
                  className="w-full pl-12 pr-4 py-4 bg-slate-100 border border-slate-200 rounded-2xl text-slate-500 cursor-not-allowed font-bold"
                  disabled
                />
              </div>
              <p className="text-[10px] font-medium text-slate-400 ml-1">
                Email cannot be changed from this form
              </p>
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Bio</label>
              <div className="relative">
                <FileText size={18} className="absolute left-4 top-4 text-slate-300" />
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  placeholder="Tell the community about yourself and your art..."
                  className="w-full pl-12 pr-4 py-4 h-32 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-600 transition-all resize-none font-medium text-slate-700"
                  maxLength={500}
                />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                  {formData.bio.length}/500 Characters
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-8 border-t border-slate-100">
              <button
                type="button"
                onClick={() => navigate(`/profile/${userId}`)}
                className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-4 bg-indigo-600 text-white rounded-full font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}