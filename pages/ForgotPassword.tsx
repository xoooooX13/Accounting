
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { db } from '../services/mockDb';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus('sending');
    setErrorMessage('');

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    const user = db.findUserByEmail(email);
    if (user) {
        setStatus('sent');
    } else {
        setStatus('error');
        setErrorMessage('No account found with this email address.');
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0B0E14] relative overflow-hidden isolate">
      {/* Background Mesh */}
      <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] rounded-full bg-primary/20 blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-accent/10 blur-[100px]"></div>

      <div className="w-full max-w-md p-6 relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-primary to-accent mb-6 shadow-glow">
             <Mail className="text-white" size={24} />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Forgot Password</h1>
          <p className="text-gray-400">Enter your email to receive a reset link</p>
        </div>

        <div className="bg-[#151A25]/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/5">
          {status === 'sent' ? (
             <div className="text-center animate-in fade-in zoom-in duration-300">
                 <div className="mx-auto w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mb-4">
                     <CheckCircle size={32} className="text-success" />
                 </div>
                 <h3 className="text-xl font-bold text-white mb-2">Check your email</h3>
                 <p className="text-gray-400 text-sm mb-6">We have sent a password reset link to <span className="text-white font-medium">{email}</span></p>
                 
                 <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 mb-6">
                     <p className="text-xs text-primary font-mono mb-2">DEV MODE: Click below to simulate email link</p>
                     <button 
                        onClick={() => navigate(`/reset-password?email=${encodeURIComponent(email)}`)}
                        className="text-xs font-bold bg-primary text-white px-3 py-1.5 rounded-lg hover:bg-primary-light transition-colors"
                     >
                        Open Reset Link
                     </button>
                 </div>

                 <Link to="/login" className="text-sm font-medium text-gray-400 hover:text-white flex items-center justify-center gap-2 transition-colors">
                     <ArrowLeft size={16} /> Back to Login
                 </Link>
             </div>
          ) : (
             <form onSubmit={handleSubmit} className="space-y-6">
                {status === 'error' && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl flex items-center gap-3 text-sm animate-in slide-in-from-top-2">
                        <AlertCircle size={18} />
                        {errorMessage}
                    </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300 ml-1">Email Address</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary transition-colors" size={20} />
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder:text-gray-600 focus:border-primary/50 focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                      placeholder="name@company.com"
                      required
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={status === 'sending'}
                  className="w-full bg-primary hover:bg-primary-light text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-primary/25 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {status === 'sending' ? 'Sending Link...' : 'Send Reset Link'}
                </button>

                <div className="text-center">
                    <Link to="/login" className="text-sm text-gray-400 hover:text-white transition-colors">
                        Back to Login
                    </Link>
                </div>
             </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
