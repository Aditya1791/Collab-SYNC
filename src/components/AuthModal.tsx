import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import { authStart, authSuccess, authFailure, clearError } from '../features/auth/authSlice';
import { Shield, Sparkles, LogIn, UserPlus } from 'lucide-react';

export const AuthModal: React.FC = () => {
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((state) => state.auth);
  const [isLogin, setIsLogin] = useState(true);

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // 2FA view states
  const [requires2FA, setRequires2FA] = useState(false);
  const [emailOtpCode, setEmailOtpCode] = useState('');
  const [phoneOtpCode, setPhoneOtpCode] = useState('');
  const [debug2faEmailOtp, setDebug2faEmailOtp] = useState('');
  const [debug2faPhoneOtp, setDebug2faPhoneOtp] = useState('');

  const handleToggleMode = () => {
    setIsLogin(!isLogin);
    dispatch(clearError());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(authStart());

    try {
      if (requires2FA) {
        const response = await fetch('/api/auth/verify-2fa', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, emailOtp: emailOtpCode, phoneOtp: phoneOtpCode })
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || '2-Step Verification failed');
        }

        setRequires2FA(false);
        setEmailOtpCode('');
        setPhoneOtpCode('');
        setDebug2faEmailOtp('');
        setDebug2faPhoneOtp('');
        dispatch(authSuccess({ user: data.user, token: data.token }));
      } else {
        const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';
        const body = isLogin 
          ? { email, password }
          : { username, email, password };

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Authentication failed');
        }

        if (data.requires2FA) {
          setRequires2FA(true);
          setDebug2faEmailOtp(data.emailCode || '');
          setDebug2faPhoneOtp(data.phoneCode || '');
          dispatch(authFailure('2-Step Verification code required.'));
          return;
        }

        dispatch(authSuccess({ user: data.user, token: data.token }));
      }
    } catch (err: any) {
      dispatch(authFailure(err.message || 'Something went wrong'));
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="glass-panel rounded-2xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all duration-300 scale-100">
        <div className="p-8 text-center bg-gradient-to-br from-slate-900/70 to-indigo-950/70 border-b border-white/5 text-white relative">
          <div className="absolute top-3 right-3 bg-white/10 text-white/70 px-2.5 py-1 rounded-full text-xs font-mono">
            v1.0.0
          </div>
          <div className="inline-flex p-3 bg-white/10 rounded-xl mb-4">
            <Shield className="h-8 w-8 text-indigo-400" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Collaborative Workspace</h2>
          <p className="text-indigo-200 text-sm mt-1">Real-time enterprise project boards</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-4">
          {requires2FA ? (
            <div className="space-y-4">
              <div className="text-center space-y-2">
                <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                  2-Step Verification is enabled. Please enter the 6-digit codes sent to your Gmail account and phone.
                </p>
                {(debug2faEmailOtp || debug2faPhoneOtp) && (
                  <div className="py-2.5 px-3.5 bg-amber-50 text-amber-600 border border-amber-100/40 rounded-xl text-[10px] font-semibold space-y-1 font-mono text-left">
                    <div>MOCK GMAIL OTP: {debug2faEmailOtp}</div>
                    <div>MOCK PHONE OTP: {debug2faPhoneOtp}</div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 text-left">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Gmail OTP Code
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="Gmail code"
                    value={emailOtpCode}
                    onChange={(e) => setEmailOtpCode(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition text-slate-800 placeholder-slate-400 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Phone OTP Code
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="Phone code"
                    value={phoneOtpCode}
                    onChange={(e) => setPhoneOtpCode(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition text-slate-800 placeholder-slate-400 text-sm"
                  />
                </div>
              </div>

              {error && error !== '2-Step Verification code required.' && (
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-xs text-center font-medium animate-fade-in">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium rounded-xl transition flex items-center justify-center gap-2 shadow-md shadow-indigo-600/10 cursor-pointer"
              >
                {loading ? (
                  <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  'Verify & Sign In'
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setRequires2FA(false);
                  setEmailOtpCode('');
                  setPhoneOtpCode('');
                  setDebug2faEmailOtp('');
                  setDebug2faPhoneOtp('');
                  dispatch(clearError());
                }}
                className="w-full py-2.5 px-4 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-700 font-semibold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer border border-slate-200"
              >
                Cancel
              </button>
            </div>
          ) : (
            <>
              {!isLogin && (
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Username
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Aditya"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition text-slate-800 placeholder-slate-400 text-sm"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition text-slate-800 placeholder-slate-400 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition text-slate-800 placeholder-slate-400 text-sm"
                />
              </div>

              {error && error !== '2-Step Verification code required.' && (
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-xs text-center font-medium animate-fade-in">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium rounded-xl transition flex items-center justify-center gap-2 shadow-md shadow-indigo-600/10 cursor-pointer"
              >
                {loading ? (
                  <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : isLogin ? (
                  <>
                    <LogIn className="h-4 w-4" /> Sign In
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" /> Create Account
                  </>
                )}
              </button>

              <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
                {isLogin ? "New to Workspace?" : "Already have an account?"}{' '}
                <button
                  type="button"
                  onClick={handleToggleMode}
                  className="text-indigo-600 font-semibold hover:underline cursor-pointer"
                >
                  {isLogin ? 'Create an account' : 'Sign in instead'}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
};
