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
  HeartHandshake, 
  User, 
  Phone, 
  MapPin, 
  Shield, 
  Droplet, 
  Camera, 
  RefreshCw, 
  Check, 
  ScanFace, 
  Upload, 
  Sparkles,
  MoveHorizontal,
  Briefcase
} from 'lucide-react';
import { UserAccount, BloodGroup, OrganizationProfile } from '../types';
import { 
  isMasterAdminLogin, 
  submitMemberRegistration, 
  authenticateMember 
} from '../utils/authSecurity';
import { getFullTrackingSnapshot, DeviceDetails } from '../utils/deviceTracker';
import { compressImageFile } from '../utils/imageCompressor';

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
  // Step 3: Live Face Scan & Liveness Detection (Auto capture)
  // Step 4: Secure Password & Final Submission
  const [regStep, setRegStep] = useState<number>(1);
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regBloodGroup, setRegBloodGroup] = useState<BloodGroup | ''>('');
  const [regArea, setRegArea] = useState('পতেঙ্গা, চট্টগ্রাম');
  // Editable designation field pre-filled with 'সাধারণ সদস্য'
  const [regDesignation, setRegDesignation] = useState('সাধারণ সদস্য');
  
  // Live Face Scan & Liveness Detection States
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [isLivenessVerified, setIsLivenessVerified] = useState<boolean>(false);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string>('');
  const [livenessStage, setLivenessStage] = useState<'align' | 'turn' | 'blink' | 'capturing' | 'done'>('align');
  const [livenessProgress, setLivenessProgress] = useState<number>(0);
  const [flashEffect, setFlashEffect] = useState<boolean>(false);

  // Password & Submission States
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regShowPassword, setRegShowPassword] = useState(false);
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);

  // Camera & Canvas Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const livenessTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Collect device and IP snapshot silently in background for security tracking
    getFullTrackingSnapshot().then(snap => setTracking(snap));
  }, []);

  // Stop camera when moving away from Step 3 or unmounting
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    if (livenessTimerRef.current) {
      clearInterval(livenessTimerRef.current);
      livenessTimerRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Start Camera for Face Scan
  const startCamera = async () => {
    stopCamera();
    setCameraError('');
    setLivenessStage('align');
    setLivenessProgress(10);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('আপনার ব্রাউজারে লাইভ ক্যামেরা সাপোর্ট করছে না। অনুগ্রহ করে ফাইল আপলোড অপশন ব্যবহার করুন।');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 640 }
        },
        audio: false
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(e => console.error('Play error:', e));
      }
      setCameraActive(true);
      startLivenessChallenge();
    } catch (err: any) {
      console.error('Camera access error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('ক্যামেরা ব্যবহারের অনুমতি পাওয়া যায়নি। ব্রাউজার সেটিংসে ক্যামেরা এলাও করুন অথবা নিচের বিকল্প ছবি বাটন ব্যবহার করুন।');
      } else {
        setCameraError('ক্যামেরা চালু করা সম্ভব হয়নি। নিচের বিকল্প আপলোড বাটন ব্যবহার করতে পারেন।');
      }
    }
  };

  // Run the Liveness Verification Sequence
  const startLivenessChallenge = () => {
    if (livenessTimerRef.current) clearInterval(livenessTimerRef.current);

    let progress = 10;
    setLivenessProgress(progress);
    setLivenessStage('align');

    // Stage 1: Align Face (1.8s) -> Stage 2: Turn Left/Right (2.2s) -> Stage 3: Blink (1.8s) -> Auto Capture!
    const interval = setInterval(() => {
      progress += 4;
      if (progress < 40) {
        setLivenessStage('align');
      } else if (progress >= 40 && progress < 75) {
        setLivenessStage('turn');
      } else if (progress >= 75 && progress < 100) {
        setLivenessStage('blink');
      } else if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        livenessTimerRef.current = null;
        triggerAutoCapture();
      }
      setLivenessProgress(Math.min(progress, 100));
    }, 180);

    livenessTimerRef.current = interval;
  };

  // Trigger Automatic Live Photo Capture upon liveness completion
  const triggerAutoCapture = () => {
    setLivenessStage('capturing');
    setFlashEffect(true);
    setTimeout(() => setFlashEffect(false), 300);

    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const width = video.videoWidth || 480;
      const height = video.videoHeight || 480;

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Flip horizontally to give natural mirror image
        ctx.translate(width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
        setCapturedPhoto(dataUrl);
        setIsLivenessVerified(true);
        setLivenessStage('done');
        stopCamera();
      }
    }
  };

  // Fallback Photo Upload if camera cannot be used
  const handleFallbackPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressed = await compressImageFile(file, { maxWidth: 500, maxHeight: 500, quality: 0.85 });
      setCapturedPhoto(compressed);
      setIsLivenessVerified(true);
      setLivenessStage('done');
      setCameraError('');
      stopCamera();
    } catch {
      setCameraError('ছবি প্রক্রিয়াকরণে সমস্যা হয়েছে। অন্য ছবি নির্বাচন করুন।');
    }
  };

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
      if (!regDesignation.trim()) {
        setRegError('আপনার পদবী উল্লেখ করুন (যেমন: সাধারণ সদস্য)');
        return;
      }
      setRegStep(3);
      // If photo not captured yet, automatically trigger camera
      if (!capturedPhoto) {
        setTimeout(() => startCamera(), 200);
      }
    } else if (regStep === 3) {
      if (!capturedPhoto || !isLivenessVerified) {
        setRegError('লাইভ ফেস স্ক্যান ও লাইভনেস যাচাই সম্পন্ন করুন');
        return;
      }
      stopCamera();
      setRegStep(4);
    }
  };

  const handlePrevStep = () => {
    setRegError('');
    stopCamera();
    if (regStep > 1) {
      setRegStep(regStep - 1);
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

    if (!capturedPhoto) {
      setRegError('লাইভ ছবি ছাড়া নিবন্ধন জমা দেওয়া যাবে না');
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
          photoUrl: capturedPhoto,
          livenessVerified: isLivenessVerified
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
        setCapturedPhoto(null);
        setIsLivenessVerified(false);
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
    stopCamera();
    setActiveTab('login');
    setRegSuccess(null);
    setRegError('');
    setRegStep(1);
    setCapturedPhoto(null);
    setIsLivenessVerified(false);
  };

  // Preset designation suggestions
  const designationSuggestions = [
    'সাধারণ সদস্য',
    'আজীবন সদস্য',
    'স্বেচ্ছাসেবী',
    'কার্যনির্বাহী সদস্য',
    'উপদেষ্টা'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white flex flex-col justify-center items-center p-4 sm:p-6 antialiased selection:bg-emerald-500 selection:text-white">
      
      {/* Hidden Canvas for Live Photo Capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Top Branding Header (ONLY Logo, Name, Established Date, and Slogan) */}
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

      {/* Main Authentication Card */}
      <div className="max-w-md w-full mx-auto">
        <div className="bg-white text-slate-800 rounded-3xl shadow-2xl border border-slate-100 overflow-hidden transition-all">
          
          {/* Toggle Buttons: Login vs Registration */}
          <div className="p-2 bg-slate-100 border-b border-slate-200 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                stopCamera();
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
                    <p>• আপনার আবেদনটি লাইভ ফেস ছবি ও ডিভাইস ট্র্যাকিং সহ অ্যাডমিন কিউতে জমা হয়েছে।</p>
                    <p>• অ্যাডমিন প্যানেল থেকে অনুমোদনের পর আপনাকে একটি ইউনিক ইউজারনেম বরাদ্দ করা হবে।</p>
                    <p>• বরাদ্দকৃত ইউজারনেম ও আপনার গোপন পাসওয়ার্ড দিয়ে পরবর্তীতে লগইন করতে পারবেন।</p>
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
                        regStep === 3 ? 'লাইভ ফেস স্ক্যান' : 'পাসওয়ার্ড নির্ধারণ'
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

                      {/* Requirement 2: Editable Designation Field (Replaced rigid dropdown with editable text input box pre-filled with 'সাধারণ সদস্য') */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                          <Briefcase className="w-3.5 h-3.5 text-emerald-600" />
                          <span>আবেদিত পদবী / পদ</span>
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
                          ডিফল্ট হিসেবে &apos;সাধারণ সদস্য&apos; নির্ধারণ করা আছে। আপনি চাইলে মুছে নিজের পছন্দসই পদবী লিখতে পারবেন।
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
                          <span>পরবর্তী: ফেস স্ক্যান</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Survey Step 3: Mandatory Live Face Scan & Liveness Detection (Requirement 3) */}
                  {regStep === 3 && (
                    <div className="space-y-3.5 animate-in fade-in duration-200">
                      <div className="text-center">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200 mb-1">
                          <ScanFace className="w-3.5 h-3.5 text-emerald-600" />
                          <span>লাইভ ফেস স্ক্যান ও লাইভনেস যাচাই</span>
                        </div>
                        <p className="text-xs text-slate-500">
                          নিরাপত্তা নিশ্চিতকরণে আপনার জীবন্ত উপস্থিতি (লুক বামে/ডানে ও চোখের পলক) যাচাই করা হবে
                        </p>
                      </div>

                      {/* Camera Viewport or Captured Result Card */}
                      {capturedPhoto ? (
                        /* Successfully Captured Photo Card */
                        <div className="p-4 rounded-3xl bg-emerald-50/60 border border-emerald-200 text-center space-y-3 animate-in zoom-in-95 duration-200">
                          <div className="relative w-36 h-36 mx-auto rounded-3xl overflow-hidden border-3 border-emerald-500 shadow-md">
                            <img 
                              src={capturedPhoto} 
                              alt="Captured Live Photo" 
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute bottom-2 inset-x-2 py-0.5 rounded-full bg-emerald-900/90 text-white text-[10px] font-bold flex items-center justify-center gap-1 backdrop-blur-xs">
                              <Check className="w-3 h-3 text-emerald-300" />
                              <span>লাইভনেস নিশ্চিত</span>
                            </div>
                          </div>

                          <div>
                            <h4 className="text-sm font-black text-emerald-950 flex items-center justify-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              <span>লাইভ ফেস স্ক্যান সফল হয়েছে!</span>
                            </h4>
                            <p className="text-[11px] text-emerald-800 mt-0.5">
                              ছবিটি আবেদনের সাথে সংরক্ষিত হয়েছে এবং অ্যাডমিন প্যানেলে প্রদর্শিত হবে।
                            </p>
                          </div>

                          <div className="pt-1">
                            <button
                              type="button"
                              onClick={() => {
                                setCapturedPhoto(null);
                                setIsLivenessVerified(false);
                                setTimeout(() => startCamera(), 150);
                              }}
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold transition cursor-pointer shadow-2xs"
                            >
                              <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                              <span>পুনরায় ছবি তুলুন (Rescan)</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* Live Camera & Interactive Liveness Scan Viewport */
                        <div className="relative rounded-3xl overflow-hidden bg-slate-950 border-2 border-slate-700 shadow-inner">
                          {/* Flash animation layer */}
                          {flashEffect && (
                            <div className="absolute inset-0 bg-white z-30 animate-out fade-out duration-300 pointer-events-none" />
                          )}

                          {/* Video Element */}
                          <div className="relative aspect-square max-h-64 sm:max-h-72 mx-auto flex items-center justify-center overflow-hidden">
                            <video
                              ref={videoRef}
                              autoPlay
                              playsInline
                              muted
                              className={`w-full h-full object-cover transform -scale-x-100 ${
                                cameraActive ? 'opacity-100' : 'opacity-0'
                              }`}
                            />

                            {/* Biometric Oval Guide Frame */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                              <div className={`w-44 h-56 rounded-[50%] border-2 transition-all duration-300 relative ${
                                livenessStage === 'done'
                                  ? 'border-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.6)]'
                                  : livenessStage === 'capturing'
                                  ? 'border-white shadow-[0_0_30px_rgba(255,255,255,0.8)]'
                                  : 'border-emerald-400/80 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                              }`}>
                                {/* Scanning Radar Target Line */}
                                {cameraActive && livenessStage !== 'done' && (
                                  <div className="absolute inset-x-2 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-pulse top-1/2" />
                                )}
                              </div>
                            </div>

                            {/* Camera Initializing Overlay */}
                            {!cameraActive && !cameraError && (
                              <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center z-20 bg-slate-900/90 text-white">
                                <Camera className="w-10 h-10 text-emerald-400 mb-2 animate-pulse" />
                                <p className="text-xs font-bold text-slate-200">ক্যামেরা সংযোগ হচ্ছে...</p>
                                <p className="text-[11px] text-slate-400 mt-1 max-w-xs">
                                  ব্রাউজারে ক্যামেরার অনুমতি দিন যাতে লাইভ ফেস স্ক্যান শুরু হতে পারে
                                </p>
                                <button
                                  type="button"
                                  onClick={startCamera}
                                  className="mt-3 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition cursor-pointer"
                                >
                                  ক্যামেরা চালু করুন
                                </button>
                              </div>
                            )}

                            {/* Camera Error / Permission Denied Overlay */}
                            {cameraError && (
                              <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center z-20 bg-slate-900/95 text-white space-y-2">
                                <AlertCircle className="w-9 h-9 text-rose-400 mx-auto" />
                                <p className="text-xs font-semibold text-rose-200 leading-tight">{cameraError}</p>
                                <div className="flex flex-col gap-2 pt-1 w-full max-w-xs">
                                  <button
                                    type="button"
                                    onClick={startCamera}
                                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5"
                                  >
                                    <RefreshCw className="w-3.5 h-3.5" />
                                    <span>পুনরায় চেষ্টা করুন</span>
                                  </button>
                                  <label className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5">
                                    <Upload className="w-3.5 h-3.5" />
                                    <span>ডিভাইস থেকে সরাসরি ছবি আপলোড করুন</span>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      capture="user"
                                      onChange={handleFallbackPhotoUpload}
                                      className="hidden"
                                    />
                                  </label>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Interactive Liveness Movement Instructions Bar (Requirement 3: Natural movements such as looking left/right and blinking) */}
                          {cameraActive && (
                            <div className="p-3 bg-slate-900 border-t border-slate-800 space-y-2">
                              {/* Step Challenge Instruction Banner */}
                              <div className="flex items-center justify-center gap-2 text-center text-xs font-black">
                                {livenessStage === 'align' && (
                                  <div className="flex items-center gap-2 text-emerald-300 animate-pulse">
                                    <ScanFace className="w-4 h-4 text-emerald-400" />
                                    <span>১. ক্যামেরার মুখোমুখি সরাসরি তাকান (সোজা দৃষ্টি)</span>
                                  </div>
                                )}
                                {livenessStage === 'turn' && (
                                  <div className="flex items-center gap-2 text-amber-300">
                                    <MoveHorizontal className="w-4 h-4 text-amber-400 animate-bounce" />
                                    <span>২. মাথা ধীরে ধীরে ডানে অথবা বাঁয়ে ঘোরান</span>
                                  </div>
                                )}
                                {livenessStage === 'blink' && (
                                  <div className="flex items-center gap-2 text-teal-300 animate-pulse">
                                    <Eye className="w-4 h-4 text-teal-400" />
                                    <span>৩. স্বাভাবিকভাবে চোখের পলক ফেলুন (Blink)</span>
                                  </div>
                                )}
                                {livenessStage === 'capturing' && (
                                  <div className="flex items-center gap-2 text-white">
                                    <Sparkles className="w-4 h-4 text-amber-300" />
                                    <span>স্বয়ংক্রিয়ভাবে ছবি তোলা হচ্ছে... স্থির থাকুন</span>
                                  </div>
                                )}
                              </div>

                              {/* Liveness Progress Bar */}
                              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                <div 
                                  className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-200"
                                  style={{ width: `${livenessProgress}%` }}
                                />
                              </div>

                              {/* Manual snap backup button */}
                              <div className="flex justify-between items-center text-[11px] text-slate-400 pt-1">
                                <span>লাইভনেস ট্র্যাকিং সক্রিয়</span>
                                <button
                                  type="button"
                                  onClick={triggerAutoCapture}
                                  className="text-emerald-400 hover:text-emerald-300 font-bold hover:underline cursor-pointer"
                                >
                                  এখনই ছবি তুলুন
                                </button>
                              </div>
                            </div>
                          )}
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
                          disabled={!capturedPhoto}
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
                        {capturedPhoto ? (
                          <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-emerald-500 shrink-0">
                            <img src={capturedPhoto} alt="Live Face" className="w-full h-full object-cover" />
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
                            <span>ফেস স্ক্যান ভেরিফাইড</span>
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
                          আবেদন জমা দেওয়ার পর তথ্য, লাইভ ছবি ও ডিভাইস রেকর্ড অ্যাডমিন প্যানেলের অনুমোদন কিউতে যুক্ত হবে।
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
