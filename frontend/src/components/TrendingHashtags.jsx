import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Hash } from 'lucide-react';
import api from '../config/api';

export default function TrendingHashtags({ limit = 10 }) {
  const navigate = useNavigate();
  const [hashtags, setHashtags] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTrendingHashtags();
  }, []);

  const loadTrendingHashtags = async () => {
    try {
      const response = await api.get(`/hashtags/trending?limit=${limit}`);
      setHashtags(response.data);
    } catch (error) {
      console.error('Error loading trending hashtags:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white/70 backdrop-blur-xl border border-white/20 shadow-lg rounded-[2rem] p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={20} className="text-indigo-600" />
          <h3 className="font-black text-lg">Trending</h3>
        </div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-slate-100 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (hashtags.length === 0) return null;

  return (
    <div className="bg-white/70 backdrop-blur-xl border border-white/20 shadow-lg rounded-[2rem] p-6">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp size={20} className="text-indigo-600" />
        <h3 className="font-black text-lg">Trending</h3>
      </div>
      <div className="space-y-3">
        {hashtags.map((item, index) => (
          <button
            key={item.hashtag}
            onClick={() => navigate(`/hashtag/${item.hashtag.replace('#', '')}`)}
            className="w-full text-left p-3 hover:bg-indigo-50 rounded-xl transition-colors group"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <span className="text-slate-400 text-sm font-bold">#{index + 1}</span>
                <Hash size={16} className="text-indigo-600" />
                <span className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                  {item.hashtag}
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-1 ml-8">
              {item.post_count} {item.post_count === 1 ? 'post' : 'posts'}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
