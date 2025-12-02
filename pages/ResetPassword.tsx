
import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Lock, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { db } from '../services/mockDb';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const email = searchParams.get('email');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !confirmPassword) { setError('All fields are required'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    if (!email) { setError('Invalid reset link'); return; }

    setStatus('submitting');
    setError('');

    // Simulate API
    await new Promise(resolve => setTimeout(resolve, 1500));

    const success = db.resetPassword(email, password);
    if (success) {
        setStatus('success');
    } else {
        setStatus('error');
        setError('Failed to reset password. User not found.');
    }
  };

  if (!email) {
      return (
        <div className="min-h-screen w-full flex items-center justify-center bg-[#0B0E14] text-white">
            <div className="text-center">
                <AlertCircle size={48} className="mx-auto text-danger mb-4" />
                <h2 className="text-2xl font-bold mb-2">Invalid Link</h2>
                <p className="text-gray-400 mb-6">This password reset link is invalid or expired.</p>
                <Link to="/login" className="bg-white/10 px-6 py-2 rounded-lg hover:bg-white/20 transition-colors">Return to Login</Link>
            </div>
        </div>
      );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0B0E14] relative overflow-hidden isolate">
      <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] rounded-full bg-primary/20 blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-accent/10 blur-[100px]"></div>

      <div className="w-full max-w-md p-6 relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Reset Password</h1>
          <p className="text-gray-400">Create a new strong password</p>
        </div>

        <div className="bg-[#151A25]/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/5">
          {status === 'success' ? (
             <div className="text-center animate-in fade-in zoom-in duration-300">
                 <div className="mx-auto w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mb-4">
                     <CheckCircle size={32} className="text-success" />
                 </div>
                 <h3 className="text-xl font-bold text-white mb-2">Password Reset Successful</h3>
                 <p className="text-gray-400 text-sm mb-6">Your password has been updated. You can now log in with your new credentials.</p>
                 <Link to="/login" className="block w-full bg-primary hover:bg-primary-light text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-primary/25">
                     Sign In
                 </Link>
             </div>
          ) : (
             <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl flex items-center gap-3 text-sm animate-in slide-in-from-top-2">
                        <AlertCircle size={18} />
                        {error}
                    </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300 ml-1">New Password</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary transition-colors" size={20} />
                    <input 
                      type="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder:text-gray-600 focus:border-primary/50 focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300 ml-1">Confirm Password</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary transition-colors" size={20} />
                    <input 
                      type="password" 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder:text-gray-600 focus:border-primary/50 focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={status === 'submitting'}
                  className="w-full bg-primary hover:bg-primary-light text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-primary/25 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed mt-2"
                >
                  {status === 'submitting' ? 'Resetting...' : 'Reset Password'}
                </button>
                
                <div className="text-center pt-2">
                    <Link to="/login" className="text-sm text-gray-400 hover:text-white flex items-center justify-center gap-2 transition-colors">
                        <ArrowLeft size={16} /> Back to Login
                    </Link>
                </div>
             </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
