import React, { useState, useEffect } from 'react';
import { 
  X, 
  Lock, 
  UserCheck, 
  UserPlus, 
  AlertCircle, 
  CheckCircle2, 
  ShieldCheck, 
  Smartphone, 
  Globe, 
  KeyRound, 
  ArrowRight,
  Eye,
  EyeOff
} from 'lucide-react';
import { UserAccount, BloodGroup } from '../types';
import { 
  isMasterAdminLogin, 
  submitMemberRegistration, 
  authenticateMember 
} from '../utils/authSecurity';
import { getFullTrackingSnapshot, DeviceDetails } from '../utils/deviceTracker';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
  onAdminLoginSuccess: () => void;
  onMemberLoginSuccess: (user: UserAccount) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
  onAdminLoginSuccess,
  onMemberLoginSuccess
}) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  
  // Tracking snapshot
  const [tracking, setTracking] = useState<DeviceDetails | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Registration form state
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regArea, setRegArea] = useState('পতেঙ্গা, চট্টগ্রাম');
  const [regDesignation, setRegDesignation] = useState('সাধারণ সদস্য');
  const [regBloodGroup, setRegBloodGroup] = useState<BloodGroup | ''>('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setLoginError('');
      setRegError('');
      setRegSuccess(null);
      // Fetch fresh client tracking info
      getFullTrackingSnapshot().then(snap => setTracking(snap));
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    const identifier = loginIdentifier.trim();
    const password = loginPassword.trim();

    if (!identifier) {
      setLoginError('ইউজারনেম বা মোবাইল নম্বর প্রদান করুন');
      return;
    }
    if (!password) {
      setLoginError('পাসওয়ার্ড প্রদান করুন');
      return;
    }

    setIsLoggingIn(true);

    try {
      // 1. Check Hardcoded Master Admin Credentials
      // Username: sylhetvip | Password: sms2022
      if (isMasterAdminLogin(identifier, password)) {
        setIsLoggingIn(false);
        setLoginIdentifier('');
        setLoginPassword('');
        onClose();
        // Immediately bypass regular user flows straight to Admin Panel!
        onAdminLoginSuccess();
        return;
      }

      // 2. Member Authentication Flow
      const currentTracking = tracking || await getFullTrackingSnapshot();
      const result = authenticateMember(identifier, password, currentTracking);

      if (result.success && result.user) {
        setIsLoggingIn(false);
        setLoginIdentifier('');
        setLoginPassword('');
        onClose();
        onMemberLoginSuccess(result.user);
      } else {
        setIsLoggingIn(false);
        setLoginError(result.error || 'লগইন ব্যর্থ হয়েছে। তথ্য যাচাই করুন।');
      }
    } catch {
      setIsLoggingIn(false);
      setLoginError('লগইন প্রক্রিয়ায় সমস্যা হয়েছে। পুনরায় চেষ্টা করুন।');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');

    if (!regName.trim()) {
      setRegError('আপনার পুরো নাম প্রদান করুন');
      return;
    }
    if (!regPhone.trim()) {
      setRegError('সঠিক মোবাইল নম্বর প্রদান করুন');
      return;
    }
    if (!regArea.trim()) {
      setRegError('এলাকা বা বর্তমান ঠিকানা প্রদান করুন');
      return;
    }
    if (!regPassword) {
      setRegError('একটি গোপন পাসওয়ার্ড প্রদান করুন');
      return;
    }
    if (regPassword.length < 4) {
      setRegError('পাসওয়ার্ড ন্যূনতম ৪ অক্ষরের হতে হবে');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setRegError('উভয় পাসওয়ার্ড হুবহু এক হতে হবে');
      return;
    }

    setIsRegistering(true);

    try {
      const currentTracking = tracking || await getFullTrackingSnapshot();
      const result = await submitMemberRegistration(
        {
          name: regName.trim(),
          phone: regPhone.trim(),
          area: regArea.trim(),
          designation: regDesignation,
          bloodGroup: regBloodGroup || undefined,
          password: regPassword
        },
        currentTracking
      );

      setIsRegistering(false);

      if (result.success) {
        setRegSuccess(result.message || 'নিবন্ধন আবেদন সফলভাবে জমা হয়েছে!');
        setRegName('');
        setRegPhone('');
        setRegPassword('');
        setRegConfirmPassword('');
      } else {
        setRegError(result.message || 'নিবন্ধন ব্যর্থ হয়েছে');
      }
    } catch {
      setIsRegistering(false);
      setRegError('নিবন্ধন প্রক্রিয়ায় সমস্যা হয়েছে।');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3.5 z-50 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in duration-200">
        {/* Top Header */}
        <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 px-5 py-4 text-white flex justify-between items-center border-b border-emerald-700/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <ShieldCheck className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h3 className="text-base font-black text-white leading-tight">
                {mode === 'login' ? 'নিরাপদ লগইন পোর্টাল' : 'নতুন সদস্য নিবন্ধন'}
              </h3>
              <p className="text-[11px] text-emerald-200">
                সদস্য ও অ্যাডমিন সিকিউরিটি সিস্টেম
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 p-1.5 gap-1.5">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setLoginError('');
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'login'
                ? 'bg-white text-emerald-900 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5 text-emerald-700" />
            <span>লগইন (Login)</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setRegError('');
              setRegSuccess(null);
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'register'
                ? 'bg-white text-emerald-900 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5 text-emerald-700" />
            <span>নিবন্ধন (Register)</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Tracking Info Badge */}
          {tracking && (
            <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 truncate">
                <Globe className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="font-mono font-medium text-slate-700">{tracking.ip}</span>
                <span className="text-slate-300">•</span>
                <span className="truncate">{tracking.os}</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100/70 text-emerald-800 text-[10px] font-bold shrink-0">
                আইপি ট্র্যাকিং সক্রিয়
              </span>
            </div>
          )}

          {/* 1. LOGIN MODE */}
          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-3.5">
              {loginError && (
                <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="leading-snug">{loginError}</div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ইউজারনেম অথবা মোবাইল নম্বর
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={loginIdentifier}
                  onChange={(e) => {
                    setLoginIdentifier(e.target.value);
                    setLoginError('');
                  }}
                  placeholder="ইউজারনেম অথবা মোবাইল নম্বর লিখুন"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    পাসওয়ার্ড
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[11px] text-slate-500 hover:text-slate-700 flex items-center gap-1 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    <span>{showPassword ? 'লুকান' : 'দেখুন'}</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => {
                      setLoginPassword(e.target.value);
                      setLoginError('');
                    }}
                    placeholder="পাসওয়ার্ড লিখুন"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-800 hover:bg-emerald-900 active:scale-98 text-white font-bold text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>{isLoggingIn ? 'যাচাই করা হচ্ছে...' : 'লগইন সম্পন্ন করুন'}</span>
                </button>
              </div>

              {/* Note about master admin and registration */}
              <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
                <p className="text-[11px] text-slate-500 text-center">
                  নতুন সদস্য? এখনও অ্যাকাউন্ট নেই?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('register');
                      setRegSuccess(null);
                      setRegError('');
                    }}
                    className="text-emerald-700 font-bold hover:underline cursor-pointer"
                  >
                    নিবন্ধন আবেদন করুন
                  </button>
                </p>
              </div>
            </form>
          )}

          {/* 2. REGISTRATION MODE */}
          {mode === 'register' && (
            <div>
              {regSuccess ? (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-emerald-950">
                      নিবন্ধন সফলভাবে জমা হয়েছে!
                    </h4>
                    <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
                      আপনার আবেদনটি অ্যাডমিন অনুমোদনের অপেক্ষমাণ তালিকায় পাঠানো হয়েছে। অ্যাডমিন পর্যালোচনা শেষে আপনাকে একটি ইউনিক ইউজারনেম বরাদ্দ করবেন।
                    </p>
                  </div>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setMode('login');
                        setRegSuccess(null);
                      }}
                      className="px-4 py-2 rounded-xl bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-800 transition cursor-pointer shadow-xs"
                    >
                      লগইন স্ক্রিনে ফিরে যান
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleRegisterSubmit} className="space-y-3">
                  {regError && (
                    <div className="p-2.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>{regError}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      পুরো নাম *
                    </label>
                    <input
                      type="text"
                      required
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="আপনার পূর্ণ নাম লিখুন"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        মোবাইল নম্বর *
                      </label>
                      <input
                        type="tel"
                        required
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        placeholder="০১XXXXXXXXX"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        পদবি / ক্যাটাগরি
                      </label>
                      <select
                        value={regDesignation}
                        onChange={(e) => setRegDesignation(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      >
                        <option value="সাধারণ সদস্য">সাধারণ সদস্য</option>
                        <option value="প্রবাসী সদস্য">প্রবাসী সদস্য</option>
                        <option value="আজীবন সদস্য">আজীবন সদস্য</option>
                        <option value="উপদেষ্টা">উপদেষ্টা</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        এলাকা / ঠিকানা *
                      </label>
                      <input
                        type="text"
                        required
                        value={regArea}
                        onChange={(e) => setRegArea(e.target.value)}
                        placeholder="পতেঙ্গা, চট্টগ্রাম"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        রক্তের গ্রুপ (ঐচ্ছিক)
                      </label>
                      <select
                        value={regBloodGroup}
                        onChange={(e) => setRegBloodGroup(e.target.value as BloodGroup)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      >
                        <option value="">নির্বাচন করুন</option>
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        পাসওয়ার্ড *
                      </label>
                      <input
                        type="password"
                        required
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="গোপন পাসওয়ার্ড"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        পাসওয়ার্ড নিশ্চিত করুন *
                      </label>
                      <input
                        type="password"
                        required
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        placeholder="পুনরায় পাসওয়ার্ড"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isRegistering}
                      className="w-full py-2.5 px-4 rounded-xl bg-emerald-800 hover:bg-emerald-900 active:scale-98 text-white font-bold text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>{isRegistering ? 'আবেদন পাঠানো হচ্ছে...' : 'নিবন্ধন আবেদন জমা দিন'}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
