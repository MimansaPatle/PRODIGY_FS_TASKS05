import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Mail, Lock, User, Zap, ArrowRight } from 'lucide-react';

export default function Register() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    displayName: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const { register } = useAuth();
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
    setSuccess('');
    setLoading(true);

    try {
      const result = await register(formData.email, formData.password, formData.username, formData.displayName);
      if (result.success) {
        // Show success message and redirect to login after 2 seconds
        setSuccess('Registration successful! Redirecting to login...');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } catch (error) {
      if (error.message.includes('Email already registered')) {
        setError('This email is already registered. Try signing in instead.');
      } else if (error.message.includes('Username already taken')) {
        setError('This username is already taken. Please choose another one.');
      } else if (error.message.includes('Password')) {
        setError('Password should be at least 6 characters long.');
      } else {
        setError(error.message || 'Failed to create account. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0a0708] flex items-center justify-center p-6 font-sans selection:bg-[#e93e68] selection:text-white">
      {/* Rose-themed Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-[#e93e68]/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-[#f45d7d]/5 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-md bg-[#130f10] border border-white/5 p-10 rounded-[3rem] shadow-2xl relative z-10">
        {/* Logo and Branding */}
        <div className="flex flex-col items-center mb-12">
          <div className="w-16 h-16 bg-gradient-to-r from-[#e93e68] to-[#f45d7d] rounded-2xl flex items-center justify-center text-white mb-6 rotate-12 shadow-[0_0_40px_rgba(233,62,104,0.4)]">
            <Zap size={32} fill="currentColor" />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic mb-2">Pixora</h1>
          <p className="text-rose-300/40 text-[10px] font-bold uppercase tracking-[0.4em]">Rose Frequency Curation</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl text-sm font-medium">
            {error}
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 text-green-400 rounded-2xl text-sm font-medium">
            {success}
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          <input 
            type="text" 
            name="username"
            value={formData.username}
            onChange={handleChange}
            placeholder="Identity Handle" 
            className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl outline-none focus:border-[#e93e68] text-white font-bold transition-all placeholder:text-white/20"
            required
          />
          
          <input 
            type="text" 
            name="displayName"
            value={formData.displayName}
            onChange={handleChange}
            placeholder="Display Name" 
            className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl outline-none focus:border-[#e93e68] text-white font-bold transition-all placeholder:text-white/20"
            required
          />
          
          <input 
            type="email" 
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Neural Link (Email)" 
            className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl outline-none focus:border-[#e93e68] text-white font-bold transition-all placeholder:text-white/20"
            required
          />
          
          <div className="relative">
            <input 
              type={showPassword ? "text" : "password"} 
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Pass-Key" 
              className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl outline-none focus:border-[#e93e68] text-white font-bold transition-all placeholder:text-white/20"
              required
            />
            <button 
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-[#e93e68] transition-colors"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <button 
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#e93e68] to-[#f45d7d] text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:brightness-110 active:scale-[0.98] transition-all shadow-xl shadow-rose-500/20 disabled:opacity-50"
          >
            {loading ? 'Syncing...' : 'Establish Link'}
          </button>
        </form>

        <p className="mt-8 text-center text-[10px] font-bold text-white/30 uppercase tracking-widest">
          Link active?{' '}
          <Link 
            to="/login"
            className="text-[#e93e68] hover:underline"
          >
            Enter Pixora
          </Link>
        </p>
      </div>
    </div>
  );
}