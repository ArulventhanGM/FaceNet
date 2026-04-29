import React, { useState } from 'react';
import BorderGlow from '../components/BorderGlow';
import { LogIn, User, Lock, Sparkles, Eye, EyeOff } from 'lucide-react';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username === 'admin' && password === 'Arul@789') {
      setError('');
      onLogin();
    } else {
      setError('Invalid username or password');
    }
  };

  return (
    <div className="w-full flex items-center justify-center min-h-[80vh] px-4 md:px-0">
      <div className="w-full max-w-md">
        <BorderGlow glowColor="340 100 70" colors={['#f472b6', '#c084fc', '#38bdf8']} borderRadius={24} glowRadius={30}>
          <div className="bg-[#060010] p-6 sm:p-10 rounded-[24px] shadow-2xl flex flex-col items-center">
            
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#c084fc] to-[#38bdf8] flex items-center justify-center shadow-lg shadow-purple-500/30 mb-6">
              <Sparkles size={32} className="text-white" />
            </div>

            <h2 className="text-3xl font-extrabold text-white mb-2 text-center">Welcome Back</h2>
            <p className="text-gray-400 mb-8 text-center">Please enter your details to sign in.</p>

            <form onSubmit={handleSubmit} className="w-full space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5 ml-1">Username</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User size={18} className="text-gray-500" />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-[#10081c]/80 border border-white/10 text-white text-sm rounded-xl focus:ring-2 focus:ring-[#c084fc] focus:border-[#c084fc] block pl-11 p-3.5 transition-all outline-none placeholder-gray-600"
                    placeholder="Enter your username"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5 ml-1">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock size={18} className="text-gray-500" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#10081c]/80 border border-white/10 text-white text-sm rounded-xl focus:ring-2 focus:ring-[#c084fc] focus:border-[#c084fc] block pl-11 pr-11 p-3.5 transition-all outline-none placeholder-gray-600"
                    placeholder="••••••••"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-1 hover:bg-white/5 rounded-md text-gray-500 hover:text-gray-300 transition-colors cursor-pointer"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </div>

              {error && (
                <div className="text-[#f472b6] text-sm text-center font-medium bg-red-500/10 p-2 rounded-lg border border-red-500/20">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="w-full mt-4 flex items-center justify-center gap-2 bg-gradient-to-r from-[#c084fc] to-[#38bdf8] text-white p-3.5 rounded-xl font-bold shadow-[0_0_20px_rgba(192,132,252,0.3)] hover:shadow-[0_0_30px_rgba(192,132,252,0.5)] transition-all transform hover:-translate-y-0.5"
              >
                <LogIn size={20} />
                Sign In
              </button>
            </form>
          </div>
        </BorderGlow>
      </div>
    </div>
  );
}
