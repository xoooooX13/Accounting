import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Mail, Lock, AlertCircle } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, loginWithGoogle, error: authError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || '/';
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    if (!email || !password) { setLocalError('Please fill in all fields'); return; }
    setIsSubmitting(true);
    try { await login(email, password); navigate(from, { replace: true }); } catch (e) { } finally { setIsSubmitting(false); }
  };

  const handleGoogleLogin = async () => {
    setIsSubmitting(true);
    try { await loginWithGoogle(); navigate(from, { replace: true }); } catch (e) { } finally { setIsSubmitting(false); }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0B0E14] relative overflow-hidden isolate">
      {/* Dynamic Background Mesh */}
      <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] rounded-full bg-primary/20 blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-accent/10 blur-[100px]"></div>

      <div className="w-full max-w-md p-6 relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary to-accent mb-6 shadow-glow">
             <span className="text-white text-3xl font-extrabold">N</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Welcome Back</h1>
          <p className="text-gray-400">Sign in to access your ERP dashboard</p>
          <div className="mt-3 text-sm text-gray-500 bg-white/5 rounded-lg py-2 px-4 inline-block">
             <span className="opacity-70">Demo:</span> <span className="text-gray-300 font-mono">admin@nexus.com</span> / <span className="text-gray-300 font-mono">password</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-[#151A25]/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/5">
          {(authError || localError) && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl flex items-center gap-3 text-sm mb-6 animate-in slide-in-from-top-2">
              <AlertCircle size={18} />
              {authError || localError}
            </div>
          )}

          <div className="space-y-5">
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
              <div className="flex justify-between items-center ml-1">
                <label className="text-sm font-medium text-gray-300">Password</label>
                <Link to="/forgot-password" className="text-xs text-primary hover:text-accent transition-colors">Forgot password?</Link>
              </div>
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

            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full bg-primary hover:bg-primary-light text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-primary/25 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed mt-2"
            >
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </button>
          </div>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-[#151A25] px-4 text-gray-500">Or continue with</span>
            </div>
          </div>

          <button 
            type="button"
            onClick={handleGoogleLogin}
            disabled={isSubmitting}
            className="w-full bg-white text-gray-900 font-semibold py-3.5 rounded-xl transition-all hover:bg-gray-100 flex items-center justify-center gap-3 disabled:opacity-70 active:scale-[0.98]"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Google Account
          </button>

          <p className="text-center text-sm text-gray-400 mt-8">
            Don't have an account? <Link to="/signup" className="text-primary hover:text-white transition-colors font-medium">Create account</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;