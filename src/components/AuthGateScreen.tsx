import React, { useState, useEffect, useRef } from 'react';
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
  User, 
  Phone, 
  MapPin, 
  Shield, 
  Droplet, 
  Check, 
  Briefcase,
  Upload,
  Image as ImageIcon,
  Trash2,
  RefreshCw,
  FileCheck
} from 'lucide-react';
import { UserAccount, BloodGroup, OrganizationProfile } from '../types';
import { 
  isMasterAdminLogin, 
  submitMemberRegistration, 
  authenticateMember 
} from '../utils/authSecurity';
import { getFullTrackingSnapshot, DeviceDetails } from '../utils/deviceTracker';
import { compressImageFile } from '../utils/imageCompressor';
import { DEFAULT_TRANSPARENT_LOGO } from '../utils/defaultLogo';

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

  // Survey-style Sequential Registration Form State (4 Steps)
  // Step 1: Basic Info (Name, Phone, Blood Group)
  // Step 2: Location & Editable Designation
  // Step 3: Mandatory Manual Image Upload (Replaces live face scan)
  // Step 4: Secure Password & Final Submission
  const [regStep, setRegStep] = useState<number>(1);
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regBloodGroup, setRegBloodGroup] = useState<BloodGroup | ''>('');
  const [regArea, setRegArea] = useState('পতেঙ্গা, চট্টগ্রাম');
  // Editable designation field pre-filled with 'সাধারণ সদস্য'
  const [regDesignation, setRegDesignation] = useState('সাধারণ সদস্য');
  
  // Mandatory Manual Image Upload States
  const [uploadedPhoto, setUploadedPhoto] = useState<string | null>(null);
  const [uploadedPhotoFileName, setUploadedPhotoFileName] = useState<string>('');
  const [isCompressingPhoto, setIsCompressingPhoto] = useState<boolean>(false);
  const [photoError, setPhotoError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Password & Submission States
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

      // 2. Regular Member Authentication Flow (Checks assigned Username or Phone)
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
      if (!regDesignation.trim()) {
        setRegError('আপনার পদবী উল্লেখ করুন (যেমন: সাধারণ সদস্য)');
        return;
      }
      setRegStep(3);
    } else if (regStep === 3) {
      if (!uploadedPhoto) {
        setRegError('দয়া করে আপনার একটি স্পষ্ট প্রোফাইল ছবি আপলোড করুন');
        return;
      }
      setRegStep(4);
    }
  };

  const handlePrevStep = () => {
    setRegError('');
    if (regStep > 1) {
      setRegStep(regStep - 1);
    }
  };

  // Handle Manual Image File Selection & Compression
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoError('');
    setRegError('');

    // 1. File Type Validation
    if (!file.type.startsWith('image/')) {
      setPhotoError('শুধুমাত্র ছবি ফাইল (JPG, PNG, WEBP) আপলোড করা যাবে');
      return;
    }

    // 2. File Size Limit (Max 5MB)
    const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
    if (file.size > MAX_SIZE_BYTES) {
      setPhotoError('ছবির ফাইলের আকার সর্বোচ্চ ৫ মেগাবাইট (5MB) হতে হবে। অনুগ্রহ করে ছোট সাইজের ছবি নির্বাচন করুন।');
      return;
    }

    setIsCompressingPhoto(true);

    try {
      // Compress and convert to clean Base64 JPEG data URL for fast upload & storage
      const compressedDataUrl = await compressImageFile(file, {
        maxWidth: 900,
        maxHeight: 900,
        quality: 0.85
      });

      setUploadedPhoto(compressedDataUrl);
      setUploadedPhotoFileName(file.name);
      setPhotoError('');
    } catch {
      setPhotoError('ছবিটি লোড বা প্রসেস করতে ব্যর্থ হয়েছে। অন্য একটি ছবি নির্বাচন করুন।');
    } finally {
      setIsCompressingPhoto(false);
      // Reset input value so same file can be reselected if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemovePhoto = () => {
    setUploadedPhoto(null);
    setUploadedPhotoFileName('');
    setPhotoError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Final Survey Registration Submit into Admin Queue
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

    if (!uploadedPhoto) {
      setRegError('প্রোফাইল ছবি ছাড়া নিবন্ধন আবেদন জমা দেওয়া যাবে না');
      setRegStep(3);
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
          designation: regDesignation.trim() || 'সাধারণ সদস্য',
          bloodGroup: regBloodGroup || undefined,
          password: regPassword,
          photoUrl: uploadedPhoto,
          livenessVerified: true
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
        setUploadedPhoto(null);
        setUploadedPhotoFileName('');
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
    setUploadedPhoto(null);
    setUploadedPhotoFileName('');
  };

  // Preset designation suggestions
  const designationSuggestions = [
    'সাধারণ সদস্য',
    'আজীবন সদস্য',
    'স্বেচ্ছাসেবী',
    'কার্যনির্বাহী সদস্য',
    'উপদেষ্টা'
  ];

  const displayLogoUrl = profile.logoUrl || DEFAULT_TRANSPARENT_LOGO;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white flex flex-col justify-center items-center p-4 sm:p-6 antialiased selection:bg-emerald-500 selection:text-white">

      {/* Top Branding Header (Requirement 2: ONLY Organization Logo, Name, Established Date, and Slogan) */}
      {/* Prominently displayed in larger size, clean and transparent with NO background fill, NO borders, and NO boxes around it */}
      <header className="max-w-md w-full mx-auto text-center space-y-2 mb-6 sm:mb-8">
        {/* Prominent Transparent Circular Logo */}
        <div className="flex justify-center mb-3">
          <img 
            src={displayLogoUrl} 
            alt={profile.name || 'সিলেট মানব সেবা সংগঠন'} 
            className="w-28 h-28 sm:w-36 sm:h-36 object-contain drop-shadow-2xl select-none transition-transform duration-300 hover:scale-105"
          />
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

      {/* Main Authentication Card */}
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

          {/* TAB 1: CLEAN LOGIN FORM */}
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
                      অনুমোদন কিউ ও প্রক্রিয়া:
                    </div>
                    <p>• আপনার আবেদনটি আপলোডকৃত প্রোফাইল ছবি ও ডিভাইস ট্র্যাকিং সহ অ্যাডমিন কিউতে জমা হয়েছে।</p>
                    <p>• অ্যাডমিন প্যানেল থেকে তথ্য যাচাই ও অনুমোদনের পর আপনাকে একটি ইউনিক ইউজারনেম বরাদ্দ দেওয়া হবে।</p>
                    <p>• বরাদ্দকৃত সেই ইউজারনেম ও আপনার দেওয়া পাসওয়ার্ড দিয়ে এই অ্যাপে লগইন করতে পারবেন।</p>
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
                      <span>ধাপ {regStep} / ৪ : {
                        regStep === 1 ? 'মৌলিক তথ্য' :
                        regStep === 2 ? 'ঠিকানা ও পদবী' :
                        regStep === 3 ? 'প্রোফাইল ছবি আপলোড' : 'পাসওয়ার্ড নির্ধারণ'
                      }</span>
                      <span className="text-emerald-700 font-extrabold">{Math.round((regStep / 4) * 100)}% সম্পন্ন</span>
                    </div>

                    {/* Visual Progress Bar */}
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                        style={{ width: `${(regStep / 4) * 100}%` }}
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
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-slate-50/50 font-mono"
                        />
                      </div>

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

                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={handleNextStep}
                          className="w-full py-3 px-4 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow transition cursor-pointer flex items-center justify-center gap-2"
                        >
                          <span>পরবর্তী ধাপ: ঠিকানা ও পদবী</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Survey Step 2: Location and Editable Designation */}
                  {regStep === 2 && (
                    <div className="space-y-3.5 animate-in fade-in duration-200">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                          <span>বর্তমান এলাকা / ঠিকানা</span>
                        </label>
                        <input
                          type="text"
                          autoFocus
                          value={regArea}
                          onChange={(e) => {
                            setRegArea(e.target.value);
                            setRegError('');
                          }}
                          placeholder="যেমন: পতেঙ্গা, চট্টগ্রাম"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-slate-50/50"
                        />
                      </div>

                      {/* Requirement 3: Editable Designation Field (defaults to 'সাধারণ সদস্য' as an editable text field) */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                          <Briefcase className="w-3.5 h-3.5 text-emerald-600" />
                          <span>আবেদিত পদবী / পদ (সরাসরি সম্পাদনাযোগ্য)</span>
                        </label>
                        <input
                          type="text"
                          value={regDesignation}
                          onChange={(e) => {
                            setRegDesignation(e.target.value);
                            setRegError('');
                          }}
                          placeholder="আপনার পছন্দসই পদবী লিখুন..."
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-slate-50/50 font-medium"
                        />
                        <p className="text-[11px] text-slate-500 mt-1">
                          ডিফল্ট হিসেবে &apos;সাধারণ সদস্য&apos; দেওয়া আছে। আপনি চাইলে মুছে নিজের পদবী লিখতে পারেন।
                        </p>

                        {/* Quick Selection Chips */}
                        <div className="flex items-center gap-1.5 flex-wrap mt-2">
                          <span className="text-[10px] text-slate-400 font-semibold">সহজ পছন্দ:</span>
                          {designationSuggestions.map((desig) => (
                            <button
                              key={desig}
                              type="button"
                              onClick={() => setRegDesignation(desig)}
                              className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                                regDesignation === desig
                                  ? 'bg-emerald-700 text-white'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              {desig}
                            </button>
                          ))}
                        </div>
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
                          <span>পরবর্তী: ছবি আপলোড</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Survey Step 3: Mandatory Manual Image Upload Flow (Requirement 3: Replaces live face scan) */}
                  {regStep === 3 && (
                    <div className="space-y-4 animate-in fade-in duration-200">
                      <div className="text-center">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200 mb-1">
                          <Upload className="w-3.5 h-3.5 text-emerald-600" />
                          <span>বাধ্যতামূলক প্রোফাইল ছবি আপলোড</span>
                        </div>
                        <p className="text-xs text-slate-500">
                          আপনার একটি স্পষ্ট ও সাম্প্রতিক রঙিন ছবি নির্বাচন করুন
                        </p>
                      </div>

                      {/* Photo Guidelines Card */}
                      <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs text-amber-950 space-y-1.5">
                        <div className="font-bold flex items-center gap-1.5 text-amber-900">
                          <FileCheck className="w-4 h-4 text-amber-700" />
                          <span>ছবি আপলোডের নির্দেশিকা (Photo Guidelines):</span>
                        </div>
                        <ul className="text-[11px] space-y-1 text-amber-900/90 list-disc list-inside pl-1">
                          <li>পর্যাপ্ত আলোতে সরাসরি ক্যামেরার দিকে তাকানো মুখমণ্ডলের ছবি হতে হবে</li>
                          <li>মুখমণ্ডল সম্পূর্ণ ও স্পষ্টভাবে দৃশ্যমান থাকা আবশ্যক</li>
                          <li>কোনো সানগ্লাস, ক্যাপ বা মাস্ক পরিহিত ছবি গ্রহণ করা হবে না</li>
                          <li>ফাইলের আকার সর্বোচ্চ ৫ মেগাবাইট (JPG, PNG, WEBP)</li>
                        </ul>
                      </div>

                      {photoError && (
                        <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200">
                          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                          <span>{photoError}</span>
                        </div>
                      )}

                      {/* Hidden File Input */}
                      <input 
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />

                      {/* Upload Box or Image Preview Card */}
                      {uploadedPhoto ? (
                        /* Uploaded Photo Preview Card */
                        <div className="p-4 rounded-3xl bg-emerald-50/70 border border-emerald-200 text-center space-y-3 animate-in zoom-in-95 duration-200">
                          <div className="relative w-32 h-32 mx-auto rounded-3xl overflow-hidden border-3 border-emerald-600 shadow-md bg-white">
                            <img 
                              src={uploadedPhoto} 
                              alt="Uploaded Face" 
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute bottom-1.5 inset-x-1.5 py-0.5 rounded-full bg-emerald-800/90 text-white text-[9px] font-bold flex items-center justify-center gap-1 backdrop-blur-xs">
                              <Check className="w-3 h-3 text-emerald-300" />
                              <span>ছবি সংরক্ষিত</span>
                            </div>
                          </div>

                          <div>
                            <h4 className="text-xs sm:text-sm font-black text-emerald-950 flex items-center justify-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              <span>ছবি সফলভাবে আপলোড হয়েছে!</span>
                            </h4>
                            {uploadedPhotoFileName && (
                              <p className="text-[10px] text-slate-500 font-mono mt-0.5 truncate max-w-xs mx-auto">
                                ফাইল: {uploadedPhotoFileName}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center justify-center gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold transition cursor-pointer shadow-2xs"
                            >
                              <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                              <span>অন্য ছবি নির্বাচন</span>
                            </button>
                            <button
                              type="button"
                              onClick={handleRemovePhoto}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 text-xs font-bold transition cursor-pointer shadow-2xs"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                              <span>মুছুন</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* Manual Upload Trigger Area */
                        <div 
                          onClick={() => fileInputRef.current?.click()}
                          className="border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/30 hover:bg-emerald-50/60 rounded-3xl p-6 sm:p-7 text-center transition cursor-pointer space-y-3 group"
                        >
                          <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                            {isCompressingPhoto ? (
                              <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <ImageIcon className="w-7 h-7 text-emerald-600" />
                            )}
                          </div>

                          <div className="space-y-1">
                            <h4 className="text-xs sm:text-sm font-black text-slate-900">
                              {isCompressingPhoto ? 'ছবি প্রসেস করা হচ্ছে...' : 'ছবি নির্বাচন করতে এখানে ক্লিক করুন'}
                            </h4>
                            <p className="text-[11px] text-slate-500">
                              আপনার ডিভাইস থেকে পরিষ্কার মুখমণ্ডলের ছবি আপলোড করুন
                            </p>
                            <span className="inline-block text-[10px] text-emerald-800 font-bold bg-emerald-100/70 px-2 py-0.5 rounded-md mt-1">
                              সর্বোচ্চ সাইজ: ৫ মেগাবাইট (JPG / PNG / WEBP)
                            </span>
                          </div>

                          <button
                            type="button"
                            className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 group-hover:bg-emerald-800 text-white text-xs font-bold transition shadow-xs"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <span>গ্যালারি বা ক্যামেরা থেকে ছবি নিন</span>
                          </button>
                        </div>
                      )}

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
                          disabled={!uploadedPhoto || isCompressingPhoto}
                          onClick={handleNextStep}
                          className="w-2/3 py-3 px-4 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <span>পরবর্তী: পাসওয়ার্ড নির্ধারণ</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Survey Step 4: Set Password & Final Submission */}
                  {regStep === 4 && (
                    <form onSubmit={handleRegisterSubmit} className="space-y-3.5 animate-in fade-in duration-200">
                      {/* Applicant Summary Preview */}
                      <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex items-center gap-3">
                        {uploadedPhoto ? (
                          <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-emerald-500 shrink-0 bg-white">
                            <img src={uploadedPhoto} alt="Uploaded Face" className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-slate-200 flex items-center justify-center text-slate-500">
                            <User className="w-6 h-6" />
                          </div>
                        )}
                        <div className="flex-1 truncate">
                          <h4 className="text-xs font-black text-slate-900 truncate">{regName || 'সদস্য আবেদন'}</h4>
                          <p className="text-[11px] text-slate-600 font-medium">পদবী: {regDesignation} • {regPhone}</p>
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800">
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span>প্রোফাইল ছবি সংযুক্ত</span>
                          </span>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="block text-xs font-bold text-slate-700">
                            গোপন পাসওয়ার্ড নির্ধারণ করুন
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
                          autoFocus
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

                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex items-start gap-2">
                        <Shield className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>
                          আবেদন জমা দেওয়ার পর তথ্য, ছবি ও ডিভাইস রেকর্ড অ্যাডমিন প্যানেলের অনুমোদন কিউতে যুক্ত হবে। অনুমোদনের পর বরাদ্দকৃত ইউজারনেম দিয়ে লগইন করতে পারবেন।
                        </span>
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
                              <span>নিবন্ধন সম্পন্ন ও জমা দিন</span>
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
