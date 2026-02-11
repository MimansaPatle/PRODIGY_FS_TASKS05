import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Zap, 
  Mail,
  ArrowRight,
  ArrowLeft,
  CheckCircle
} from 'lucide-react';
import { forgotPassword } from '../services/auth.service';

export default function ForgotPassword() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [resending, setResending] = useState(false);
  
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || '';

  // Automatically send reset email when component loads
  useEffect(() => {
    const sendResetEmail = async () => {
      if (!email) {
        navigate('/login');
        return;
      }

      // Just show the ready state, don't send email automatically
      setSuccess(true);
    };

    sendResetEmail();
  }, [email, navigate]);

  // Function to send email when button is clicked
  const handleSendEmail = async () => {
    setResending(true);
    setError('');

    try {
      console.log('Sending forgot password request for:', email);
      await forgotPassword(email);
      console.log('Forgot password request successful');
      setEmailSent(true);
      // Show brief success feedback
      setTimeout(() => setResending(false), 1000);
    } catch (error) {
      console.error('Send email request failed:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      setError('Failed to send email. Please try again.');
      setResending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-[#fafbfc] flex items-center justify-center p-6 relative overflow-hidden font-sans">
        {/* Dynamic Background Elements */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-100 rounded-full blur-[120px] opacity-60 animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-pink-100 rounded-full blur-[120px] opacity-60 animate-pulse" />

        <div className="w-full max-w-md bg-white/40 backdrop-blur-2xl border border-white/50 rounded-[3rem] shadow-2xl p-12 text-center relative z-10">
          <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-6 animate-pulse">
            <Mail size={32} className="text-indigo-600" />
          </div>
          
          <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-4">
            Sending Reset Email...
          </h2>
          
          <p className="text-slate-600 text-sm font-medium">
            Please wait while we send the reset link to your email.
          </p>
        </div>
      </div>
    );
  }

  if (error && !success) {
    return (
      <div className="min-h-screen w-full bg-[#fafbfc] flex items-center justify-center p-6 relative overflow-hidden font-sans">
        {/* Dynamic Background Elements */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-100 rounded-full blur-[120px] opacity-60 animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-pink-100 rounded-full blur-[120px] opacity-60 animate-pulse" />

        <div className="w-full max-w-md bg-white/40 backdrop-blur-2xl border border-white/50 rounded-[3rem] shadow-2xl p-12 text-center relative z-10">
          <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Mail size={32} className="text-red-600" />
          </div>
          
          <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-4">
            Something Went Wrong
          </h2>
          
          <p className="text-red-600 text-sm font-medium mb-8">
            {error}
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
            Ready to Send Reset Email!
          </h2>
          
          <p className="text-slate-600 text-sm font-medium mb-2">
            Click the button below to send a password reset email to:
          </p>
          
          <p className="text-indigo-600 font-bold mb-6">
            {email}
          </p>
          
          <p className="text-slate-400 text-xs font-medium mb-8">
            You will receive an email with a secure link to reset your password. The link will expire in 1 hour.
          </p>

          {/* Error Message for Resend */}
          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-medium">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            {/* Send Email Button */}
            <button
              onClick={handleSendEmail}
              disabled={resending}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-xl shadow-green-600/20 hover:-translate-y-1 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {resending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Mail size={18} />
                  {emailSent ? 'Send Email Again' : 'Send Email'}
                </>
              )}
            </button>

            {/* Success message after email is sent */}
            {emailSent && !resending && (
              <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm font-medium text-center">
                ✅ Password reset email sent! Check your inbox and spam folder.
              </div>
            )}

            {/* Back to Login Button */}
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-8 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-[2rem] font-black text-sm uppercase tracking-widest transition-all"
            >
              <ArrowLeft size={18} />
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }
}