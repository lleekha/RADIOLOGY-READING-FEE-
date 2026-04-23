import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Eye, EyeOff, User, Lock, Mail, ArrowRight, UserPlus, AlertCircle, X, ShieldCheck, Key, Smartphone, CheckCircle2, ChevronDown } from 'lucide-react';

interface AuthProps {
  onLogin: (username: string, modality: string) => void;
}

const DEFAULT_MODALITIES = [
  "X-RAY", 
  "X-RAY MAIN", 
  "X-RAY OPD", 
  "X-RAY PORTABLE",
  "MRI", 
  "MRI CONTRAST",
  "CT SCAN",
  "CT SCAN MAIN",
  "CT SCAN OPD",
  "ULTRASOUND"
];

export default function Auth({ onLogin }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    modality: '',
  });
  const [errors, setErrors] = useState({
    username: '',
    password: '',
  });
  const [showNonExistingPopup, setShowNonExistingPopup] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotPasswordStep, setForgotPasswordStep] = useState(1); // 1: username, 2: code, 3: new password
  const [resetCode, setResetCode] = useState('');
  const [userToReset, setUserToReset] = useState<any>(null);
  const [verificationInput, setVerificationInput] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetError, setResetError] = useState('');
  const [showOTP, setShowOTP] = useState(false);
  const [generatedOTP, setGeneratedOTP] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [otpError, setOtpError] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showTroubleshoot, setShowTroubleshoot] = useState(false);

  const handleTroubleshoot = async () => {
    setIsSending(true);
    try {
      const res = await fetch('/api/test-email');
      const data = await res.json();
      if (data.success) {
        alert('Success! Your Gmail configuration is valid. Try sending the code again.');
      } else {
        alert(`Configuration Error: ${data.error}\n\nSuggestion: ${data.suggestion || 'Check your Secrets.'}`);
      }
    } catch (err) {
      alert('Could not connect to the server to test the configuration.');
    } finally {
      setIsSending(false);
    }
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    
    const storedUsers = JSON.parse(localStorage.getItem('claim_slip_users') || '[]');
    const user = storedUsers.find((u: any) => u.username === formData.username || u.email === formData.email);

    if (!user) {
      setResetError('Account not found with this username or email.');
      return;
    }

    // Skip verification step as requested
    setUserToReset(user);
    setForgotPasswordStep(3);
  };

  const verifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (verificationInput === resetCode) {
      setForgotPasswordStep(3);
    } else {
      setResetError('Invalid verification code. Please try again.');
    }
  };

  const resetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setResetError('Password must be at least 6 characters.');
      return;
    }

    const storedUsers = JSON.parse(localStorage.getItem('claim_slip_users') || '[]');
    const updatedUsers = storedUsers.map((u: any) => 
      u.username === userToReset.username ? { ...u, password: newPassword } : u
    );

    localStorage.setItem('claim_slip_users', JSON.stringify(updatedUsers));
    setResetSuccess(true);
    setTimeout(() => {
      setIsForgotPassword(false);
      setForgotPasswordStep(1);
      setResetSuccess(false);
      setFormData({ ...formData, password: '' });
    }, 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({ username: '', password: '' });
    
    // Get existing users from localStorage
    const storedUsers = JSON.parse(localStorage.getItem('claim_slip_users') || '[]');

    if (isLogin) {
      // Check for hardcoded ADMIN account
      if (formData.username === 'ADMIN' && formData.password === 'Ateguria_2027') {
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        setGeneratedOTP(otp);
        setShowOTP(true);
        setIsSending(true);
        
        // Call the backend to send the actual email
        fetch('/api/send-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'gonzales1225111@gmail.com', otp }),
        })
        .then(async res => {
          if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || 'Failed to send OTP');
          }
          alert(`ADMIN SECURITY: A verification code has been sent to gonzales1225111@gmail.com.`);
        })
        .catch(err => {
          console.error('Failed to send OTP:', err);
          alert(`Error: ${err.message}`);
          setShowTroubleshoot(true);
          setShowOTP(false);
        })
        .finally(() => {
          setIsSending(false);
        });

        console.log(`ADMIN OTP for gonzales1225111@gmail.com: ${otp}`);
        return;
      }

      // Login Logic
      const userByUsername = storedUsers.find((u: any) => u.username === formData.username);
      
      if (!userByUsername) {
        setErrors({ ...errors, username: 'Incorrect username' });
        setShowNonExistingPopup(true);
        return;
      }

      if (userByUsername.password !== formData.password) {
        setErrors({ ...errors, password: 'Incorrect password' });
        return;
      }

      if (userByUsername.username !== 'ADMIN' && !userByUsername.isApproved) {
        alert('Your account is pending approval from the ADMIN. Please wait for authorization.');
        return;
      }

      onLogin(userByUsername.username, userByUsername.modality || 'ALL');
    } else {
      // Signup Logic
      const userExists = storedUsers.some((u: any) => u.username === formData.username);
      
      if (userExists) {
        setErrors({ ...errors, username: 'Account already exist' });
        alert('Account already exist. Please choose another username.');
        return;
      }

      if (formData.username !== 'ADMIN' && !formData.modality) {
        alert('Please select a modality');
        return;
      }

      const newUser = {
        username: formData.username,
        password: formData.password,
        email: formData.email,
        modality: formData.modality,
        isApproved: false,
        createdAt: new Date().toISOString()
      };

      storedUsers.push(newUser);
      localStorage.setItem('claim_slip_users', JSON.stringify(storedUsers));
      
      alert('Account created successfully! Please wait for the ADMIN to approve your account before you can sign in.');
      setIsLogin(true);
      setFormData({ username: formData.username, password: '', email: '' });
    }
  };

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    setFormData({ username: '', password: '', email: '', modality: '' });
    setErrors({ username: '', password: '' });
  };

  const handleResendOTP = () => {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOTP(otp);
    setOtpInput('');
    setOtpError('');
    setIsSending(true);
    
    fetch('/api/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'gonzales1225111@gmail.com', otp }),
    })
    .then(async res => {
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to resend OTP');
      }
      alert(`A new verification code has been sent to gonzales1225111@gmail.com.`);
    })
    .catch(err => {
      console.error('Failed to resend OTP:', err);
      alert(`Error: ${err.message}. Please check your Gmail configuration.`);
    })
    .finally(() => {
      setIsSending(false);
    });

    console.log(`Resent ADMIN OTP: ${otp}`);
  };

  const handleOTPVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpInput === generatedOTP) {
      onLogin('ADMIN', 'ALL');
    } else {
      setOtpError('Invalid OTP code. Access denied.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 font-sans relative">
      <AnimatePresence>
        {showOTP && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-[#095161]/90 backdrop-blur-xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl p-10 relative overflow-hidden text-center"
            >
              <div className="w-20 h-20 bg-[#095161]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <ShieldCheck className="w-10 h-10 text-[#095161]" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Admin Verification</h3>
              <p className="text-gray-500 mb-8">Please enter the 6-digit security code sent to <span className="font-bold text-[#095161]">gonzales1225111@gmail.com</span></p>
              
              <form onSubmit={handleOTPVerify} className="space-y-6">
                <div className="relative">
                  <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otpInput}
                    onChange={(e) => {
                      setOtpInput(e.target.value.replace(/\D/g, ''));
                      setOtpError('');
                    }}
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-[#095161] focus:bg-white outline-none transition-all text-gray-700 font-bold tracking-[0.5em] text-center text-2xl"
                    placeholder="000000"
                  />
                </div>
                
                {otpError && (
                  <p className="text-sm font-bold text-red-500">{otpError}</p>
                )}

                <div className="flex flex-col gap-4">
                  <button
                    type="submit"
                    disabled={isSending}
                    className={`w-full py-4 bg-[#095161] text-white font-bold rounded-2xl shadow-lg hover:bg-[#0b6377] transition-all flex items-center justify-center gap-2 ${isSending ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {isSending ? 'Sending Code...' : 'Verify & Access Database'}
                    {!isSending && <ArrowRight className="w-5 h-5" />}
                  </button>
                  
                  <button
                    type="button"
                    disabled={isSending}
                    onClick={handleResendOTP}
                    className={`text-sm font-bold text-[#095161] hover:underline transition-all ${isSending ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {isSending ? 'Sending...' : 'Resend Code'}
                  </button>

                  {showTroubleshoot && (
                    <button
                      type="button"
                      onClick={handleTroubleshoot}
                      className="text-xs font-bold text-amber-600 hover:text-amber-700 underline mt-2"
                    >
                      Troubleshoot Connection
                    </button>
                  )}
                </div>
                
                <button
                  type="button"
                  onClick={() => setShowOTP(false)}
                  className="text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors mt-2"
                >
                  Cancel
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {isForgotPassword && (
          <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl p-10 relative overflow-hidden"
            >
              {/* Decorative background element */}
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#095161]/5 rounded-full blur-3xl" />
              <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-[#0b6377]/5 rounded-full blur-3xl" />

              <button 
                onClick={() => setIsForgotPassword(false)}
                className="absolute top-6 right-6 p-2 text-gray-400 hover:text-[#095161] hover:bg-gray-100 rounded-full transition-all"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-[#095161]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck className="w-8 h-8 text-[#095161]" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800">Reset Password</h3>
                <p className="text-gray-500 text-sm mt-2">
                  {forgotPasswordStep === 1 && "Enter your username or email to reset your password"}
                  {forgotPasswordStep === 2 && `We've sent a 6-digit code to ${userToReset?.email}`}
                  {forgotPasswordStep === 3 && "Create a new secure password for your account"}
                </p>
              </div>

              {resetError && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-sm"
                >
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <p className="font-medium">{resetError}</p>
                </motion.div>
              )}

              {resetSuccess ? (
                <div className="text-center py-8">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4"
                  >
                    <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                  </motion.div>
                  <h4 className="text-xl font-bold text-gray-800">Password Reset!</h4>
                  <p className="text-gray-500 mt-2">Redirecting you to login...</p>
                </div>
              ) : (
                <>
                  {forgotPasswordStep === 1 && (
                    <form onSubmit={handleForgotPassword} className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Username or Email</label>
                        <div className="relative">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <input
                            type="text"
                            required
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-[#095161] focus:bg-white outline-none transition-all text-gray-700 font-medium"
                            placeholder="Your username or email"
                          />
                        </div>
                      </div>
                      <button
                        type="submit"
                        className="w-full py-4 bg-[#095161] text-white font-bold rounded-2xl shadow-lg hover:bg-[#0b6377] transition-all flex items-center justify-center gap-2 group"
                      >
                        Reset Password Now
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </form>
                  )}

                  {forgotPasswordStep === 2 && (
                    <form onSubmit={verifyCode} className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Verification Code</label>
                        <div className="relative">
                          <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <input
                            type="text"
                            required
                            maxLength={6}
                            value={verificationInput}
                            onChange={(e) => setVerificationInput(e.target.value.replace(/\D/g, ''))}
                            className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-[#095161] focus:bg-white outline-none transition-all text-gray-700 font-bold tracking-[0.5em] text-center text-xl"
                            placeholder="000000"
                          />
                        </div>
                      </div>
                      <button
                        type="submit"
                        className="w-full py-4 bg-[#095161] text-white font-bold rounded-2xl shadow-lg hover:bg-[#0b6377] transition-all"
                      >
                        Verify Code
                      </button>
                      <button
                        type="button"
                        onClick={() => setForgotPasswordStep(1)}
                        className="w-full text-sm font-bold text-gray-400 hover:text-[#095161] transition-colors"
                      >
                        Resend Code
                      </button>
                    </form>
                  )}

                  {forgotPasswordStep === 3 && (
                    <form onSubmit={resetPassword} className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">New Password</label>
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <input
                            type="password"
                            required
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-[#095161] focus:bg-white outline-none transition-all text-gray-700 font-medium"
                            placeholder="Enter new password"
                          />
                        </div>
                      </div>
                      <button
                        type="submit"
                        className="w-full py-4 bg-gradient-to-r from-[#095161] to-[#0b6377] text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all"
                      >
                        Update Password
                      </button>
                    </form>
                  )}
                </>
              )}
            </motion.div>
          </div>
        )}

        {showNonExistingPopup && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-sm bg-white rounded-3xl shadow-2xl p-8 text-center relative border-2 border-red-50"
            >
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-10 h-10 text-red-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Account Not Found</h3>
              <p className="text-gray-500 mb-8">The username you entered doesn't match any existing account. Would you like to create a new one?</p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    setShowNonExistingPopup(false);
                    setIsLogin(false);
                  }}
                  className="w-full py-3 bg-[#095161] text-white font-bold rounded-xl hover:bg-[#0b6377] transition-colors"
                >
                  Create New Account
                </button>
                <button
                  onClick={() => setShowNonExistingPopup(false)}
                  className="w-full py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Try Again
                </button>
              </div>
              <button 
                onClick={() => setShowNonExistingPopup(false)}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Username</label>
                {errors.username && <span className="text-[10px] font-bold text-red-500 uppercase tracking-tight">{errors.username}</span>}
              </div>
              <div className="relative">
                <User className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${errors.username ? 'text-red-400' : 'text-gray-400'}`} />
                <input
                  type="text"
                  required
                  value={formData.username}
                  onChange={(e) => {
                    setFormData({ ...formData, username: e.target.value });
                    if (errors.username) setErrors({ ...errors, username: '' });
                  }}
                  className={`w-full pl-11 pr-4 py-3 border-2 rounded-xl focus:bg-white outline-none transition-all text-gray-700 ${
                    errors.username 
                      ? 'bg-red-50 border-red-200 focus:border-red-500' 
                      : 'bg-gray-50 border-gray-100 focus:border-[#095161]'
                  }`}
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

            {!isLogin && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-2"
              >
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Modality</label>
                <div className="relative">
                  <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <select
                    required
                    value={formData.modality}
                    onChange={(e) => setFormData({ ...formData, modality: e.target.value })}
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-[#095161] focus:bg-white outline-none transition-all text-gray-700 appearance-none font-bold"
                  >
                    <option value="">Select your modality</option>
                    {DEFAULT_MODALITIES.map(mod => (
                      <option key={mod} value={mod}>{mod}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </motion.div>
            )}

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Password</label>
                {errors.password && <span className="text-[10px] font-bold text-red-500 uppercase tracking-tight">{errors.password}</span>}
              </div>
              <div className="relative">
                <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${errors.password ? 'text-red-400' : 'text-gray-400'}`} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={(e) => {
                    setFormData({ ...formData, password: e.target.value });
                    if (errors.password) setErrors({ ...errors, password: '' });
                  }}
                  className={`w-full pl-11 pr-12 py-3 border-2 rounded-xl focus:bg-white outline-none transition-all text-gray-700 ${
                    errors.password 
                      ? 'bg-red-50 border-red-200 focus:border-red-500' 
                      : 'bg-gray-50 border-gray-100 focus:border-[#095161]'
                  }`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${errors.password ? 'text-red-400 hover:text-red-600' : 'text-gray-400 hover:text-[#095161]'}`}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {isLogin && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotPassword(true);
                      setForgotPasswordStep(1);
                      setResetError('');
                    }}
                    className="text-xs font-bold text-[#095161] hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
              )}
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
