import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  KeyRound, 
  UserPlus, 
  AlertCircle, 
  CheckCircle2, 
  Smartphone, 
  Globe, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  Lock, 
  HeartHandshake, 
  PhoneCall, 
  Sparkles,
  Info
} from 'lucide-react';
import { UserAccount, BloodGroup, OrganizationProfile } from '../types';
import { 
  isMasterAdminLogin, 
  submitMemberRegistration, 
  authenticateMember,
  MASTER_ADMIN_CREDENTIALS
} from '../utils/authSecurity';
import { getFullTrackingSnapshot, DeviceDetails } from '../utils/deviceTracker';

interface AuthGateScreenProps {
  profile: OrganizationProfile;
  onAdminLoginSuccess: () => void;
  onMemberLoginSuccess: (user: UserAccount) => void;
  openEmergencyModal: () => void;
}

export const AuthGateScreen: React.FC<AuthGateScreenProps> = ({
  profile,
  onAdminLoginSuccess,
  onMemberLoginSuccess,
  openEmergencyModal
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
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
    // Collect device and IP snapshot on mount
    getFullTrackingSnapshot().then(snap => setTracking(snap));
  }, []);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    const identifier = loginIdentifier.trim();
    const password = loginPassword.trim();

    if (!identifier) {
      setLoginError('ইউজারনেম অথবা মোবাইল নম্বর প্রদান করুন');
      return;
    }
    if (!password) {
      setLoginError('পাসওয়ার্ড প্রদান করুন');
      return;
    }

    setIsLoggingIn(true);

    try {
      // 1. Check Hardcoded Master Admin Credentials
      // sylhetvip / sms2022
      if (isMasterAdminLogin(identifier, password)) {
        setIsLoggingIn(false);
        setLoginIdentifier('');
        setLoginPassword('');
        // Directly bypass regular user flow straight to Admin Panel
        onAdminLoginSuccess();
        return;
      }

      // 2. Member Authentication Flow
      const currentTracking = tracking || await getFullTrackingSnapshot();
      const result = authenticateMember(identifier, password, currentTracking);

      setIsLoggingIn(false);

      if (result.success && result.user) {
        setLoginIdentifier('');
        setLoginPassword('');
        onMemberLoginSuccess(result.user);
      } else {
        setLoginError(result.error || 'লগইন ব্যর্থ হয়েছে। তথ্য যাচাই করুন।');
      }
    } catch {
      setIsLoggingIn(false);
      setLoginError('লগইন প্রক্রিয়ায় সমস্যা হয়েছে। দয়া করে পুনরায় চেষ্টা করুন।');
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
        setRegError(result.message || 'নিবন্ধন জমা দেওয়া সম্ভব হয়নি।');
      }
    } catch {
      setIsRegistering(false);
      setRegError('নিবন্ধন প্রক্রিয়ায় কোনো ত্রুটি হয়েছে।');
    }
  };

  const fillMasterAdminCredentials = () => {
    setLoginIdentifier(MASTER_ADMIN_CREDENTIALS.username);
    setLoginPassword(MASTER_ADMIN_CREDENTIALS.password);
    setLoginError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 text-white flex flex-col justify-between antialiased selection:bg-emerald-500 selection:text-white px-4 py-6 sm:py-10">
      {/* Top Branding Bar */}
      <header className="max-w-xl w-full mx-auto text-center space-y-3">
        <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 shadow-lg shadow-emerald-950/50 backdrop-blur-md mb-1">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md">
            <HeartHandshake className="w-7 h-7" />
          </div>
        </div>
        
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white drop-shadow-sm">
            {profile.name || 'সিলেট মানব সেবা সংগঠন'}
          </h1>
          <p className="text-xs sm:text-sm text-emerald-300 font-medium mt-1">
            স্থাপিত : ১৫/০৮/২০২২ইং • পতেঙ্গা, চট্টগ্রাম
          </p>
          <p className="text-[12px] text-slate-300 mt-0.5 max-w-md mx-auto italic">
            &ldquo;{profile.tagline || 'মানবতার কল্যাণে নিবেদিত প্রাণ'}&rdquo;
          </p>
        </div>

        {/* Security Shield Gate Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold tracking-wide">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>নিরাপদ সুরক্ষা গেটওয়ে (সুরক্ষিত পোর্টাল)</span>
        </div>
      </header>

      {/* Main Authentication Card */}
      <div className="max-w-md w-full mx-auto my-6">
        <div className="bg-white/95 backdrop-blur-md text-slate-800 rounded-3xl shadow-2xl border border-slate-100/30 overflow-hidden transition-all">
          
          {/* Tab Switcher */}
          <div className="p-2 bg-slate-100/90 border-b border-slate-200/80 grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => {
                setActiveTab('login');
                setLoginError('');
              }}
              className={`py-2.5 px-3 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                activeTab === 'login'
                  ? 'bg-emerald-900 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <KeyRound className="w-4 h-4 text-emerald-400" />
              <span>লগইন (Login)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('register');
                setRegError('');
                setRegSuccess(null);
              }}
              className={`py-2.5 px-3 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                activeTab === 'register'
                  ? 'bg-emerald-900 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <UserPlus className="w-4 h-4 text-emerald-400" />
              <span>সদস্য নিবন্ধন (Register)</span>
            </button>
          </div>

          {/* Tab 1: LOGIN FORM */}
          {activeTab === 'login' && (
            <div className="p-5 sm:p-6 space-y-4">
              <div className="border-b border-slate-100 pb-2">
                <h2 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-emerald-600" />
                  সদস্য ও অ্যাডমিন লগইন
                </h2>
                <p className="text-[12px] text-slate-500 mt-0.5">
                  আপনার ইউজারনেম এবং পাসওয়ার্ড দিয়ে অ্যাকাউন্টে প্রবেশ করুন
                </p>
              </div>

              {loginError && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-start gap-2.5 animate-in fade-in duration-200">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="leading-snug">{loginError}</div>
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-3.5">
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
                    placeholder="ইউজারনেম / মোবাইল (যেমন: sylhetvip)"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition placeholder:text-slate-400 bg-white"
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
                      className="text-[11px] text-emerald-700 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      {showPassword ? (
                        <>
                          <EyeOff className="w-3 h-3" />
                          <span>লুকান</span>
                        </>
                      ) : (
                        <>
                          <Eye className="w-3 h-3" />
                          <span>দেখুন</span>
                        </>
                      )}
                    </button>
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => {
                      setLoginPassword(e.target.value);
                      setLoginError('');
                    }}
                    placeholder="আপনার গোপন পাসওয়ার্ড দিন"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition placeholder:text-slate-400 bg-white"
                  />
                </div>

                {/* Master Admin Helper Box */}
                <div className="p-3 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-[12px] text-amber-900 flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-amber-950">মাস্টার অ্যাডমিন লগইন তথ্য:</p>
                      <p className="text-[11px] text-amber-800">
                        ইউজারনেম: <code className="bg-white/80 px-1 py-0.5 rounded font-mono font-bold text-amber-900 border border-amber-300">sylhetvip</code> | 
                        পাসওয়ার্ড: <code className="bg-white/80 px-1 py-0.5 rounded font-mono font-bold text-amber-900 border border-amber-300">sms2022</code>
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={fillMasterAdminCredentials}
                    className="shrink-0 px-2.5 py-1 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-[10px] transition cursor-pointer shadow-xs"
                    title="মাস্টার ক্রেডেনশিয়াল পূরণ করুন"
                  >
                    অটো ফিল
                  </button>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-800 hover:to-teal-800 text-white font-bold text-sm shadow-md shadow-emerald-900/20 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-70 mt-2"
                >
                  {isLoggingIn ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>লগইন করুন ও প্রবেশ করুন</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Prompt to register */}
              <div className="pt-2 text-center text-xs text-slate-500 border-t border-slate-100">
                <span>নতুন সদস্য? </span>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('register');
                    setRegError('');
                    setRegSuccess(null);
                  }}
                  className="font-bold text-emerald-800 hover:underline cursor-pointer"
                >
                  অনলাইন সদস্য নিবন্ধনের আবেদন করুন
                </button>
              </div>
            </div>
          )}

          {/* Tab 2: REGISTRATION FORM */}
          {activeTab === 'register' && (
            <div className="p-5 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="border-b border-slate-100 pb-2">
                <h2 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-emerald-600" />
                  নতুন সদস্য নিবন্ধন ফরম
                </h2>
                <p className="text-[12px] text-slate-500 mt-0.5">
                  নিবন্ধনের পর অ্যাডমিন প্যানেল থেকে অনুমোদন ও ইউজারনেম বরাদ্দ দেওয়া হবে
                </p>
              </div>

              {regSuccess ? (
                <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3 animate-in zoom-in-95 duration-200">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center shadow-xs">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-emerald-950">
                      আবেদন সফলভাবে জমা হয়েছে!
                    </h3>
                    <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
                      {regSuccess}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-white border border-emerald-200/80 text-[11px] text-slate-600 text-left space-y-1">
                    <div className="font-bold text-slate-800 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      পরবর্তী পদক্ষেপ:
                    </div>
                    <p>১. অ্যাডমিনের অনুমোদন সম্পন্ন হওয়ার জন্য অপেক্ষা করুন।</p>
                    <p>২. অ্যাডমিন আপনাকে একটি স্বতন্ত্র ইউজারনেম বরাদ্দ করবেন।</p>
                    <p>৩. বরাদ্দকৃত ইউজারনেম ও আপনার সেট করা পাসওয়ার্ড দিয়ে লগইন করবেন।</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('login');
                      setRegSuccess(null);
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow transition cursor-pointer"
                  >
                    লগইন স্ক্রিনে ফিরে যান
                  </button>
                </div>
              ) : (
                <form onSubmit={handleRegisterSubmit} className="space-y-3">
                  {regError && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <div className="leading-snug">{regError}</div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      পূর্ণ নাম <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="আপনার পূর্ণ নাম বাংলায় লিখুন"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        মোবাইল নম্বর <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        placeholder="০১XXXXXXXXX"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        রক্তের গ্রুপ (ঐচ্ছিক)
                      </label>
                      <select
                        value={regBloodGroup}
                        onChange={(e) => setRegBloodGroup(e.target.value as BloodGroup)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white"
                      >
                        <option value="">নির্বাচন করুন</option>
                        <option value="A+">A+ (পজিটিভ)</option>
                        <option value="A-">A- (নেগেটিভ)</option>
                        <option value="B+">B+ (পজিটিভ)</option>
                        <option value="B-">B- (নেগেটিভ)</option>
                        <option value="O+">O+ (পজিটিভ)</option>
                        <option value="O-">O- (নেগেটিভ)</option>
                        <option value="AB+">AB+ (পজিটিভ)</option>
                        <option value="AB-">AB- (নেগেটিভ)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        বর্তমান এলাকা / ঠিকানা <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={regArea}
                        onChange={(e) => setRegArea(e.target.value)}
                        placeholder="পতেঙ্গা, চট্টগ্রাম"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        আবেদিত পদবী
                      </label>
                      <select
                        value={regDesignation}
                        onChange={(e) => setRegDesignation(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white"
                      >
                        <option value="সাধারণ সদস্য">সাধারণ সদস্য</option>
                        <option value="আজীবন সদস্য">আজীবন সদস্য</option>
                        <option value="স্বেচ্ছাসেবী">স্বেচ্ছাসেবী</option>
                        <option value="কার্যনির্বাহী সদস্য">কার্যনির্বাহী সদস্য</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        গোপন পাসওয়ার্ড <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="password"
                        required
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="ন্যূনতম ৪ অক্ষর"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        পাসওয়ার্ড নিশ্চিত করুন <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="password"
                        required
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        placeholder="পুনরায় পাসওয়ার্ড লিখুন"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white"
                      />
                    </div>
                  </div>

                  {/* Submission note */}
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex items-start gap-2">
                    <Info className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>
                      নিবন্ধন সফলভাবে দাখিলের পর আবেদনটি অ্যাডমিনের অনুমোদনের তালিকায় যুক্ত হবে এবং নিরাপত্তা নিরীক্ষার জন্য বর্তমান ডিভাইস ও আইপি সংরক্ষণ করা হবে।
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={isRegistering}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-800 hover:to-teal-800 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-900/20 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-70 mt-3"
                  >
                    {isRegistering ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>নিবন্ধন আবেদন জমা দিন</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Bottom Live Device & IP Tracking Security Bar */}
          <div className="px-5 py-3 bg-slate-900 text-slate-300 text-[11px] border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 truncate">
              <Globe className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="font-mono text-slate-200">{tracking?.ip || 'আইপি শনাক্ত হচ্ছে...'}</span>
              <span className="text-slate-600">•</span>
              <div className="flex items-center gap-1 text-slate-400 truncate">
                <Smartphone className="w-3 h-3 shrink-0" />
                <span className="truncate">{tracking?.os || 'ডিভাইস ট্র্যাকিং'}</span>
              </div>
            </div>
            <div className="flex items-center gap-1 text-emerald-400 font-semibold text-[10px]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>আইপি ও ডিভাইস ট্র্যাকিং সুরক্ষা সক্রিয়</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer & Emergency Helpline Link */}
      <footer className="max-w-xl w-full mx-auto text-center space-y-3 pt-2">
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={openEmergencyModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-bold transition cursor-pointer"
          >
            <PhoneCall className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
            <span>জরুরি হেল্পলাইন নম্বরসমূহ</span>
          </button>
        </div>

        <p className="text-[11px] text-slate-400">
          © ২০২৬ সিলেট মানব সেবা সংগঠন। সর্বস্বত্ব সংরক্ষিত।
        </p>
      </footer>
    </div>
  );
};
