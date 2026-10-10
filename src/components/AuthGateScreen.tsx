import React, { useState, useEffect } from 'react';
import { 
  KeyRound, 
  UserPlus, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft,
  Eye, 
  EyeOff, 
  Lock, 
  HeartHandshake, 
  User,
  Phone,
  MapPin,
  Shield,
  Droplet
} from 'lucide-react';
import { UserAccount, BloodGroup, OrganizationProfile } from '../types';
import { 
  isMasterAdminLogin, 
  submitMemberRegistration, 
  authenticateMember 
} from '../utils/authSecurity';
import { getFullTrackingSnapshot, DeviceDetails } from '../utils/deviceTracker';

interface AuthGateScreenProps {
  profile: OrganizationProfile;
  onAdminLoginSuccess: () => void;
  onMemberLoginSuccess: (user: UserAccount) => void;
  openEmergencyModal?: () => void;
}

export const AuthGateScreen: React.FC<AuthGateScreenProps> = ({
  profile,
  onAdminLoginSuccess,
  onMemberLoginSuccess
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [tracking, setTracking] = useState<DeviceDetails | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Login form state (Only username & password, no hints, no autofill)
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Survey-style Sequential Registration Form State
  const [regStep, setRegStep] = useState<number>(1);
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regBloodGroup, setRegBloodGroup] = useState<BloodGroup | ''>('');
  const [regArea, setRegArea] = useState('পতেঙ্গা, চট্টগ্রাম');
  const [regDesignation, setRegDesignation] = useState('সাধারণ সদস্য');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regShowPassword, setRegShowPassword] = useState(false);
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    // Collect device and IP snapshot silently in background for security tracking
    getFullTrackingSnapshot().then(snap => setTracking(snap));
  }, []);

  // Handle Clean Login (Hidden Master Admin check + Member authentication)
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
      // 1. Backend-Only Secure Master Admin Check (sylhetvip / sms2022)
      // Directly bypasses regular flows and enters full Admin Panel
      if (isMasterAdminLogin(identifier, password)) {
        setIsLoggingIn(false);
        setLoginIdentifier('');
        setLoginPassword('');
        onAdminLoginSuccess();
        return;
      }

      // 2. Regular Member Authentication Flow
      const currentTracking = tracking || await getFullTrackingSnapshot();
      const result = authenticateMember(identifier, password, currentTracking);

      setIsLoggingIn(false);

      if (result.success && result.user) {
        setLoginIdentifier('');
        setLoginPassword('');
        onMemberLoginSuccess(result.user);
      } else {
        setLoginError(result.error || 'ইউজারনেম বা পাসওয়ার্ড সঠিক নয়');
      }
    } catch {
      setIsLoggingIn(false);
      setLoginError('লগইন প্রক্রিয়ায় সমস্যা হয়েছে। দয়া করে পুনরায় চেষ্টা করুন।');
    }
  };

  // Step Validation for Survey-Style Registration
  const handleNextStep = () => {
    setRegError('');
    if (regStep === 1) {
      if (!regName.trim()) {
        setRegError('আপনার পূর্ণ নাম লিখুন');
        return;
      }
      if (!regPhone.trim() || regPhone.trim().length < 10) {
        setRegError('সঠিক মোবাইল নম্বর প্রদান করুন');
        return;
      }
      setRegStep(2);
    } else if (regStep === 2) {
      if (!regArea.trim()) {
        setRegError('আপনার বর্তমান এলাকা বা ঠিকানা লিখুন');
        return;
      }
      setRegStep(3);
    }
  };

  const handlePrevStep = () => {
    setRegError('');
    if (regStep > 1) {
      setRegStep(regStep - 1);
    }
  };

  // Final Survey Registration Submit
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');

    if (!regPassword) {
      setRegError('পাসওয়ার্ড প্রদান করুন');
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
        setRegStep(1);
      } else {
        setRegError(result.message || 'নিবন্ধন জমা দেওয়া সম্ভব হয়নি।');
      }
    } catch {
      setIsRegistering(false);
      setRegError('নিবন্ধন প্রক্রিয়ায় কোনো ত্রুটি হয়েছে।');
    }
  };

  const resetToLogin = () => {
    setActiveTab('login');
    setRegSuccess(null);
    setRegError('');
    setRegStep(1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white flex flex-col justify-center items-center p-4 sm:p-6 antialiased selection:bg-emerald-500 selection:text-white">
      
      {/* 2. Top Branding Header (ONLY Logo, Name, Established Date, and Slogan) */}
      <header className="max-w-md w-full mx-auto text-center space-y-2 mb-6 sm:mb-8">
        {/* Dynamic Organization Logo */}
        <div className="flex justify-center mb-2">
          {profile.logoUrl ? (
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white p-2 shadow-xl border border-white/20 flex items-center justify-center overflow-hidden">
              <img 
                src={profile.logoUrl} 
                alt={profile.name} 
                className="w-full h-full object-contain"
              />
            </div>
          ) : (
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-xl border border-emerald-400/30">
              <HeartHandshake className="w-9 h-9 sm:w-11 sm:h-11" />
            </div>
          )}
        </div>

        {/* Organization Name */}
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white drop-shadow-md">
          {profile.name || 'সিলেট মানব সেবা সংগঠন'}
        </h1>

        {/* Establishment Date */}
        <p className="text-xs sm:text-sm text-emerald-300 font-medium tracking-wide">
          স্থাপিত : {profile.establishedDate || '১৫/০৮/২০২২ইং'}
        </p>

        {/* Slogan / Tagline */}
        <p className="text-xs text-slate-300 italic max-w-sm mx-auto">
          &ldquo;{profile.tagline || 'মানবতার কল্যাণে নিবেদিত প্রাণ'}&rdquo;
        </p>
      </header>

      {/* 3. Main Authentication Card (Toggle-Based Clean Interface) */}
      <div className="max-w-md w-full mx-auto">
        <div className="bg-white text-slate-800 rounded-3xl shadow-2xl border border-slate-100 overflow-hidden transition-all">
          
          {/* Toggle Buttons: Login vs Registration */}
          <div className="p-2 bg-slate-100 border-b border-slate-200 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setActiveTab('login');
                setLoginError('');
              }}
              className={`py-2.5 px-3 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                activeTab === 'login'
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
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
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
              }`}
            >
              <UserPlus className="w-4 h-4 text-emerald-400" />
              <span>নিবন্ধন (Registration)</span>
            </button>
          </div>

          {/* TAB 1: CLEAN LOGIN FORM (Strictly username & password only, zero hints or leaks) */}
          {activeTab === 'login' && (
            <div className="p-6 sm:p-7 space-y-4">
              <div className="text-center pb-1">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto mb-2">
                  <Lock className="w-5 h-5" />
                </div>
                <h2 className="text-base font-black text-slate-900">
                  অ্যাকাউন্টে প্রবেশ করুন
                </h2>
              </div>

              {loginError && (
                <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    ইউজারনেম
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
                    placeholder="আপনার ইউজারনেম লিখুন"
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition bg-slate-50/50"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                      পাসওয়ার্ড
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer font-medium"
                    >
                      {showPassword ? (
                        <>
                          <EyeOff className="w-3.5 h-3.5" />
                          <span>লুকান</span>
                        </>
                      ) : (
                        <>
                          <Eye className="w-3.5 h-3.5" />
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
                    placeholder="আপনার পাসওয়ার্ড লিখুন"
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition bg-slate-50/50"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full py-3.5 px-4 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-md transition cursor-pointer disabled:opacity-70 mt-2 flex items-center justify-center gap-2 active:scale-98"
                >
                  {isLoggingIn ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>লগইন করুন</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* TAB 2: SURVEY-STYLE STEP-BY-STEP SEQUENTIAL REGISTRATION FORM */}
          {activeTab === 'register' && (
            <div className="p-6 sm:p-7 space-y-4">
              
              {regSuccess ? (
                <div className="text-center space-y-4 py-2 animate-in zoom-in-95 duration-200">
                  <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center shadow-xs">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-emerald-950">
                      নিবন্ধন সফলভাবে জমা হয়েছে!
                    </h3>
                    <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                      {regSuccess}
                    </p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 text-left space-y-1">
                    <div className="font-bold text-slate-800 flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-emerald-600" />
                      অনুমোদন প্রক্রিয়া:
                    </div>
                    <p>• অ্যাডমিন প্যানেল থেকে আপনার আবেদনটি যাচাই করা হবে।</p>
                    <p>• অনুমোদনের সাথে সাথে আপনাকে ইউজারনেম বরাদ্দ দেওয়া হবে।</p>
                    <p>• এরপর আপনি বরাদ্দকৃত ইউজারনেম ও পাসওয়ার্ড দিয়ে লগইন করতে পারবেন।</p>
                  </div>
                  <button
                    type="button"
                    onClick={resetToLogin}
                    className="w-full py-3 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm shadow transition cursor-pointer"
                  >
                    লগইন ফর্মে ফিরে যান
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Step Progress Header */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                      <span>ধাপ {regStep} / ৩ : {
                        regStep === 1 ? 'মৌলিক তথ্য' :
                        regStep === 2 ? 'ঠিকানা ও পদবী' : 'পাসওয়ার্ড নির্ধারণ'
                      }</span>
                      <span className="text-emerald-700">{Math.round((regStep / 3) * 100)}% সম্পন্ন</span>
                    </div>
                    {/* Visual Progress Bar */}
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                        style={{ width: `${(regStep / 3) * 100}%` }}
                      />
                    </div>
                  </div>

                  {regError && (
                    <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>{regError}</span>
                    </div>
                  )}

                  {/* Survey Step 1: Basic Information */}
                  {regStep === 1 && (
                    <div className="space-y-3.5 animate-in fade-in duration-200">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-emerald-600" />
                          <span>আপনার পূর্ণ নাম</span>
                        </label>
                        <input
                          type="text"
                          autoFocus
                          value={regName}
                          onChange={(e) => {
                            setRegName(e.target.value);
                            setRegError('');
                          }}
                          placeholder="পূর্ণ নাম বাংলায় লিখুন"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-slate-50/50"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-emerald-600" />
                          <span>মোবাইল নম্বর</span>
                        </label>
                        <input
                          type="tel"
                          value={regPhone}
                          onChange={(e) => {
                            setRegPhone(e.target.value);
                            setRegError('');
                          }}
                          placeholder="০১XXXXXXXXX"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-slate-50/50"
                        />
                      </div>

                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={handleNextStep}
                          className="w-full py-3 px-4 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow transition cursor-pointer flex items-center justify-center gap-2"
                        >
                          <span>পরবর্তী ধাপ</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Survey Step 2: Address, Blood Group, and Designation */}
                  {regStep === 2 && (
                    <div className="space-y-3.5 animate-in fade-in duration-200">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                          <Droplet className="w-3.5 h-3.5 text-rose-500" />
                          <span>রক্তের গ্রুপ (ঐচ্ছিক)</span>
                        </label>
                        <select
                          value={regBloodGroup}
                          onChange={(e) => setRegBloodGroup(e.target.value as BloodGroup)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-slate-50/50"
                        >
                          <option value="">রক্তের গ্রুপ নির্বাচন করুন</option>
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

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                          <span>বর্তমান এলাকা / ঠিকানা</span>
                        </label>
                        <input
                          type="text"
                          value={regArea}
                          onChange={(e) => {
                            setRegArea(e.target.value);
                            setRegError('');
                          }}
                          placeholder="যেমন: পতেঙ্গা, চট্টগ্রাম"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-slate-50/50"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          আবেদিত পদবী
                        </label>
                        <select
                          value={regDesignation}
                          onChange={(e) => setRegDesignation(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-slate-50/50"
                        >
                          <option value="সাধারণ সদস্য">সাধারণ সদস্য</option>
                          <option value="আজীবন সদস্য">আজীবন সদস্য</option>
                          <option value="স্বেচ্ছাসেবী">স্বেচ্ছাসেবী</option>
                          <option value="কার্যনির্বাহী সদস্য">কার্যনির্বাহী সদস্য</option>
                        </select>
                      </div>

                      <div className="pt-2 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handlePrevStep}
                          className="w-1/3 py-3 px-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition cursor-pointer flex items-center justify-center gap-1"
                        >
                          <ArrowLeft className="w-4 h-4" />
                          <span>পূর্ববর্তী</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleNextStep}
                          className="w-2/3 py-3 px-4 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow transition cursor-pointer flex items-center justify-center gap-2"
                        >
                          <span>পরবর্তী ধাপ</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Survey Step 3: Set Password & Final Submit */}
                  {regStep === 3 && (
                    <form onSubmit={handleRegisterSubmit} className="space-y-3.5 animate-in fade-in duration-200">
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="block text-xs font-bold text-slate-700">
                            পাসওয়ার্ড নির্ধারণ করুন
                          </label>
                          <button
                            type="button"
                            onClick={() => setRegShowPassword(!regShowPassword)}
                            className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
                          >
                            {regShowPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            <span>{regShowPassword ? 'লুকান' : 'দেখুন'}</span>
                          </button>
                        </div>
                        <input
                          type={regShowPassword ? 'text' : 'password'}
                          required
                          value={regPassword}
                          onChange={(e) => {
                            setRegPassword(e.target.value);
                            setRegError('');
                          }}
                          placeholder="ন্যূনতম ৪ অক্ষরের গোপন পাসওয়ার্ড"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-slate-50/50"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          পাসওয়ার্ড নিশ্চিত করুন
                        </label>
                        <input
                          type={regShowPassword ? 'text' : 'password'}
                          required
                          value={regConfirmPassword}
                          onChange={(e) => {
                            setRegConfirmPassword(e.target.value);
                            setRegError('');
                          }}
                          placeholder="পুনরায় পাসওয়ার্ড লিখুন"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-slate-50/50"
                        />
                      </div>

                      <div className="pt-2 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handlePrevStep}
                          className="w-1/3 py-3 px-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition cursor-pointer flex items-center justify-center gap-1"
                        >
                          <ArrowLeft className="w-4 h-4" />
                          <span>পূর্ববর্তী</span>
                        </button>
                        <button
                          type="submit"
                          disabled={isRegistering}
                          className="w-2/3 py-3 px-4 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow transition cursor-pointer disabled:opacity-70 flex items-center justify-center gap-2"
                        >
                          {isRegistering ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <>
                              <span>আবেদন জমা দিন</span>
                              <CheckCircle2 className="w-4 h-4" />
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

    </div>
  );
};
