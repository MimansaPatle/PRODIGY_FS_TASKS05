import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Zap, 
  Mail,
  Lock,
  ArrowRight,
  Eye,
  EyeOff
} from 'lucide-react';

export default function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(formData.email, formData.password);
      navigate('/home');
    } catch (error) {
      console.error('Login error:', error);
      // Handle error message from backend or generic error
      const errorMessage = error.message || error.response?.data?.detail || 'Failed to sign in. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#fafbfc] flex items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Dynamic Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-100 rounded-full blur-[120px] opacity-60 animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-pink-100 rounded-full blur-[120px] opacity-60 animate-pulse" />

      <div className="w-full max-w-4xl bg-white/40 backdrop-blur-2xl border border-white/50 rounded-[3rem] shadow-2xl flex flex-col md:flex-row overflow-hidden relative z-10">
        
        {/* Left Side: Branding/Visual */}
        <div className="hidden md:flex md:w-1/2 bg-indigo-600 p-12 flex-col justify-between relative overflow-hidden">
          <div className="absolute inset-0 opacity-20 pointer-events-none">
             <img src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800" className="w-full h-full object-cover" alt="" />
          </div>
          <div className="relative z-10">
             <div className="flex items-center gap-3 text-white mb-8">
                <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
                  <Zap size={22} fill="currentColor" />
                </div>
                <span className="font-black text-2xl tracking-tighter uppercase italic">Vois</span>
             </div>
             <h1 className="text-5xl font-black text-white leading-tight tracking-tighter">
               Visuals with <br/> a Voice.
             </h1>
          </div>
          <div className="relative z-10">
            <p className="text-white/70 text-sm font-medium leading-relaxed max-w-xs">
              Join the most visually inspired community of curators and visual storytellers.
            </p>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="flex-1 p-8 md:p-16 flex flex-col justify-center">
          <div className="mb-10 text-center md:text-left">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">
              Welcome Back
            </h2>
            <p className="text-slate-400 text-sm font-medium">
              Enter your insights to continue
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-2xl text-sm font-medium">
              {error}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Email Insight</label>
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                <input 
                  type="email" 
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="alex@vois.design" 
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-600 transition-all font-bold text-slate-800"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Secure Key</label>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                <input 
                  type={showPassword ? "text" : "password"} 
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••" 
                  className="w-full pl-12 pr-12 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-600 transition-all font-bold text-slate-800"
                  required
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-indigo-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <div className="text-right">
                <Link 
                  to="/forgot-password"
                  state={{ email: formData.email }}
                  className="text-xs text-indigo-600 hover:text-indigo-700 font-medium hover:underline underline-offset-2"
                >
                  Forgot Password?
                </Link>
              </div>
            </div>

            <button 
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-5 rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 hover:-translate-y-1 active:translate-y-0 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {loading ? 'Processing...' : (
                <>
                  Enter Vois
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <p className="mt-10 text-center text-sm font-medium text-slate-400">
            Don't have a studio yet?{' '}
            <Link 
              to="/register"
              className="text-indigo-600 font-black hover:underline underline-offset-4"
            >
              Create One
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
