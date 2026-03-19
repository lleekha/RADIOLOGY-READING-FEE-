import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Eye, EyeOff, User, Lock, Mail, ArrowRight, UserPlus } from 'lucide-react';

interface AuthProps {
  onLogin: (username: string) => void;
}

export default function Auth({ onLogin }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Get existing users from localStorage
    const storedUsers = JSON.parse(localStorage.getItem('claim_slip_users') || '[]');

    if (isLogin) {
      // Login Logic
      const user = storedUsers.find(
        (u: any) => u.username === formData.username && u.password === formData.password
      );
      
      if (user) {
        onLogin(user.username);
      } else {
        alert('Invalid username or password. Please try again or create an account.');
      }
    } else {
      // Signup Logic
      const userExists = storedUsers.some((u: any) => u.username === formData.username);
      
      if (userExists) {
        alert('Username already exists. Please choose another one.');
        return;
      }

      const newUser = {
        username: formData.username,
        password: formData.password,
        email: formData.email,
        createdAt: new Date().toISOString()
      };

      storedUsers.push(newUser);
      localStorage.setItem('claim_slip_users', JSON.stringify(storedUsers));
      
      alert('Account created successfully! You can now sign in.');
      setIsLogin(true);
      setFormData({ username: formData.username, password: '', email: '' });
    }
  };

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    setFormData({ username: '', password: '', email: '' });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1a1a1a] p-4 font-sans">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
      >
        <div className="p-8">
          <div className="text-center mb-8">
            <motion.h2 
              key={isLogin ? 'login-title' : 'signup-title'}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-3xl font-bold text-[#095161] mb-2"
            >
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </motion.h2>
            <p className="text-gray-500 text-sm">
              {isLogin 
                ? 'Please enter your details to sign in' 
                : 'Join us to start generating claim slips'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  required
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-[#095161] focus:bg-white outline-none transition-all text-gray-700"
                  placeholder="Enter your username"
                />
              </div>
            </div>

            {!isLogin && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-2"
              >
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-[#095161] focus:bg-white outline-none transition-all text-gray-700"
                    placeholder="Enter your email"
                  />
                </div>
              </motion.div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-11 pr-12 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-[#095161] focus:bg-white outline-none transition-all text-gray-700"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#095161] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-4 bg-gradient-to-r from-[#095161] to-[#0b6377] text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              {isLogin ? 'Sign In' : 'Create Account'}
              <ArrowRight className="w-5 h-5" />
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <button
              onClick={toggleAuthMode}
              className="text-sm font-semibold text-[#095161] hover:underline flex items-center justify-center gap-2 mx-auto"
            >
              {isLogin ? (
                <>
                  <UserPlus className="w-4 h-4" />
                  Don't have an account? Create one
                </>
              ) : (
                <>
                  <User className="w-4 h-4" />
                  Already have an account? Sign in
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
