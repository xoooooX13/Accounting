
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, AlertCircle, CheckCircle } from 'lucide-react';

const Signup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { register, error: authError } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    if (!name || !email || !password || !confirmPassword) { setLocalError('Please fill in all fields'); return; }
    if (password.length < 6) { setLocalError('Password must be at least 6 characters'); return; }
    if (password !== confirmPassword) { setLocalError('Passwords do not match'); return; }
    
    setIsSubmitting(true);
    try { 
        await register(name, email, password); 
        setSuccess(true);
        setTimeout(() => navigate('/login'), 2000);
    } catch (e) { 
        // Error handled by authError
    } finally { 
        setIsSubmitting(false); 
    }
  };

  if (success) {
      return (
        <div className="min-h-screen w-full flex items-center justify-center bg-[#0B0E14] relative overflow-hidden">
            <div className="bg-[#151A25]/90 p-8 rounded-3xl border border-white/5 text-center animate-in zoom-in duration-300">
                <div className="mx-auto w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle size={32} className="text-success" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Account Created!</h2>
                <p className="text-gray-400 mb-4">Redirecting to login page...</p>
                <Link to="/login" className="text-primary hover:text-white font-medium text-sm">Click here if not redirected</Link>
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
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Create Account</h1>
          <p className="text-gray-400">Join Nexus ERP to manage your business</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-[#151A25]/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/5">
          {(authError || localError) && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl flex items-center gap-3 text-sm mb-6 animate-in slide-in-from-top-2">
              <AlertCircle size={18} />
              {authError || localError}
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300 ml-1">Full Name</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary transition-colors" size={20} />
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder:text-gray-600 focus:border-primary/50 focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                  placeholder="John Doe"
                />
              </div>
            </div>

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
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300 ml-1">Password</label>
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
              disabled={isSubmitting}
              className="w-full bg-primary hover:bg-primary-light text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-primary/25 active:scale-[0.98] mt-4 disabled:opacity-70"
            >
              {isSubmitting ? 'Creating account...' : 'Create Account'}
            </button>
          </div>

          <p className="text-center text-sm text-gray-400 mt-8">
            Already have an account? <Link to="/login" className="text-primary hover:text-white transition-colors font-medium">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Signup;
