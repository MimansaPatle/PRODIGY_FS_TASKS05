import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Zap, 
  Lock,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Eye,
  EyeOff,
  AlertCircle
} from 'lucide-react';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  // Verify token on component mount
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setError('Invalid reset link. Please request a new password reset.');
        setVerifying(false);
        return;
      }

      try {
        const response = await fetch(`http://localhost:8000/auth/verify-reset-token/${token}`);
        
        if (response.ok) {
          const data = await response.json();
          setTokenValid(true);
          setUserEmail(data.email);
        } else {
          const errorData = await response.json();
          setError(errorData.detail || 'Invalid or expired reset link.');
        }
      } catch (error) {
        setError('Failed to verify reset link. Please try again.');
      } finally {
        setVerifying(false);
      }
    };

    verifyToken();
  }, [token]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost:8000/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: token,
          new_password: formData.password
        }),
      });

      if (response.ok) {
        setSuccess(true);
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Failed to reset password. Please try again.');
      }
    } catch (error) {
      setError('Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Loading state while verifying token
  if (verifying) {
    return (
      <div className="min-h-screen w-full bg-[#fafbfc] flex items-center justify-center p-6 relative overflow-hidden font-sans">
        {/* Dynamic Background Elements */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-100 rounded-full blur-[120px] opacity-60 animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-pink-100 rounded-full blur-[120px] opacity-60 animate-pulse" />

        <div className="w-full max-w-md bg-white/40 backdrop-blur-2xl border border-white/50 rounded-[3rem] shadow-2xl p-12 text-center relative z-10">
          <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-6 animate-pulse">
            <Lock size={32} className="text-indigo-600" />
          </div>
          
          <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-4">
            Verifying Reset Link...
          </h2>
          
          <p className="text-slate-600 text-sm font-medium">
            Please wait while we verify your password reset link.
          </p>
        </div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen w-full bg-[#fafbfc] flex items-center justify-center p-6 relative overflow-hidden font-sans">
        {/* Dynamic Background Elements */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-100 rounded-full blur-[120px] opacity-60 animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-pink-100 rounded-full blur-[120px] opacity-60 animate-pulse" />

        <div className="w-full max-w-md bg-white/40 backdrop-blur-2xl border border-white/50 rounded-[3rem] shadow-2xl p-12 text-center relative z-10">
          <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={32} className="text-green-600" />
          </div>
          
          <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-4">
            Password Reset Successful!
          </h2>
          
          <p className="text-slate-600 text-sm font-medium mb-8">
            Your password has been successfully updated. You can now log in with your new password.
          </p>
          
          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 hover:-translate-y-1 transition-all"
          >
            <ArrowLeft size={18} />
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  // Error state (invalid/expired token)
  if (!tokenValid) {
    return (
      <div className="min-h-screen w-full bg-[#fafbfc] flex items-center justify-center p-6 relative overflow-hidden font-sans">
        {/* Dynamic Background Elements */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-100 rounded-full blur-[120px] opacity-60 animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-pink-100 rounded-full blur-[120px] opacity-60 animate-pulse" />

        <div className="w-full max-w-md bg-white/40 backdrop-blur-2xl border border-white/50 rounded-[3rem] shadow-2xl p-12 text-center relative z-10">
          <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <AlertCircle size={32} className="text-red-600" />
          </div>
          
          <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-4">
            Invalid Reset Link
          </h2>
          
          <p className="text-red-600 text-sm font-medium mb-8">
            {error}
          </p>
          
          <div className="space-y-4">
            <Link
              to="/forgot-password"
              className="block px-8 py-4 bg-indigo-600 text-white rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 hover:-translate-y-1 transition-all"
            >
              Request New Reset Link
            </Link>
            
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-slate-400 hover:text-indigo-600 font-medium text-sm transition-colors"
            >
              <ArrowLeft size={16} />
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Reset password form
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
               Create New <br/> Password.
             </h1>
          </div>
          <div className="relative z-10">
            <p className="text-white/70 text-sm font-medium leading-relaxed max-w-xs">
              Choose a strong password to keep your account secure and get back to creating amazing content.
            </p>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="flex-1 p-8 md:p-16 flex flex-col justify-center">
          <div className="mb-10 text-center md:text-left">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">
              Reset Password
            </h2>
            <p className="text-slate-400 text-sm font-medium">
              Enter your new password for: <span className="text-indigo-600 font-bold">{userEmail}</span>
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-2xl text-sm font-medium">
              {error}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">New Password</label>
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
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Confirm Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                <input 
                  type={showConfirmPassword ? "text" : "password"} 
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••" 
                  className="w-full pl-12 pr-12 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-600 transition-all font-bold text-slate-800"
                  required
                />
                <button 
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-indigo-600 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button 
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-5 rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 hover:-translate-y-1 active:translate-y-0 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {loading ? 'Updating Password...' : (
                <>
                  Update Password
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <Link 
              to="/login"
              className="inline-flex items-center gap-2 text-slate-400 hover:text-indigo-600 font-medium text-sm transition-colors"
            >
              <ArrowLeft size={16} />
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}