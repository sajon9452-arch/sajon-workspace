import React from 'react';
import { 
  HeartHandshake, 
  PhoneCall, 
  ArrowLeft,
  ShieldCheck, 
  Phone, 
  LogOut, 
  UserPlus, 
  KeyRound, 
  Eye
} from 'lucide-react';
import { ActiveScreen, OrganizationProfile, UserAccount } from '../types';

interface HeaderProps {
  profile: OrganizationProfile;
  activeScreen: ActiveScreen;
  setActiveScreen: (screen: ActiveScreen) => void;
  isAdmin: boolean;
  setIsAdmin: (val: boolean) => void;
  adminViewMode?: 'admin' | 'user';
  onSelectViewMode?: (mode: 'admin' | 'user') => void;
  loggedInUser?: UserAccount | null;
  onLogout?: () => void;
  onMemberLogout?: () => void;
  openAuthModal: (mode?: 'login' | 'register') => void;
  openEmergencyModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  profile,
  activeScreen,
  setActiveScreen,
  isAdmin,
  setIsAdmin,
  adminViewMode = 'admin',
  onSelectViewMode,
  loggedInUser,
  onLogout,
  onMemberLogout,
  openAuthModal,
  openEmergencyModal,
}) => {
  const handleLogout = () => {
    setIsAdmin(false);
    setActiveScreen('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (onLogout) {
      onLogout();
    }
  };
  return (
    <header className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white shadow-lg sticky top-0 z-40 border-b border-emerald-700/40">
      {/* Top Hotline Bar */}
      <div className="bg-emerald-950/90 px-4 py-1.5 text-xs border-b border-emerald-800/60">
        <div className="max-w-6xl mx-auto flex justify-between items-center flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-emerald-100 font-medium">
                স্থাপিত: <strong className="text-white">{profile.establishedDate}</strong> ({profile.establishedYear})
              </span>
            </div>
            <span className="hidden sm:inline text-emerald-600">•</span>
            <span className="hidden sm:inline text-amber-300 font-semibold">
              রেজিস্ট্রেশন নং: {profile.regNumber}
            </span>
            {isAdmin && (
              <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-black border border-amber-400/40 text-[10px]">
                <ShieldCheck className="w-3 h-3 text-amber-300" />
                <span>সুপার অ্যাডমিন • {adminViewMode === 'admin' ? 'অ্যাডমিন প্যানেল ভিউ' : 'ইউজার ভিউ (প্রিভিউ)'}</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <a 
              href={`tel:${profile.hotline}`}
              className="flex items-center gap-1.5 text-emerald-200 hover:text-white font-mono text-[11px] font-bold"
            >
              <Phone className="w-3 h-3 text-emerald-400" />
              <span>{profile.hotline}</span>
            </a>
            <button
              onClick={openEmergencyModal}
              className="flex items-center gap-1 text-rose-300 hover:text-white font-bold bg-rose-950/60 border border-rose-600/40 px-2.5 py-0.5 rounded-full cursor-pointer transition active:scale-95 text-[11px]"
            >
              <PhoneCall className="w-3 h-3 text-rose-400" />
              <span>জরুরি হেল্পলাইন</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Header Bar */}
      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3.5 flex justify-between items-center gap-2 sm:gap-3 w-full max-w-full overflow-hidden">
        {/* Brand Logo & Title */}
        <div 
          onClick={() => setActiveScreen('home')}
          className="flex items-center gap-2.5 sm:gap-3 cursor-pointer select-none group min-w-0 flex-1 overflow-hidden"
        >
          <div className="flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300">
            {profile.logoUrl ? (
              <img 
                src={profile.logoUrl} 
                alt={profile.name} 
                className="h-10 sm:h-12 w-auto max-w-[80px] sm:max-w-[120px] object-contain select-none"
              />
            ) : (
              <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-emerald-300">
                <HeartHandshake className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
              </div>
            )}
          </div>
          {/* Requirement 1: Header Text Formatting (Strict 3-Line Clean Stack) */}
          <div className="flex flex-col justify-center min-w-0 flex-1 overflow-hidden">
            <h1 className="text-xs sm:text-base md:text-lg font-black tracking-tight text-white leading-tight truncate">
              {profile.name || 'সিলেট মানবসেবা সংগঠন'}
            </h1>
            <p className="text-[9.5px] sm:text-xs text-emerald-200 font-medium leading-snug mt-0.5 truncate">
              {profile.tagline || 'মানবতার কল্যাণে নিবেদিত প্রান'}
            </p>
            <p className="text-[9.5px] sm:text-xs text-amber-300 font-bold leading-snug truncate">
              {profile.address || 'পতেঙ্গা, চট্টগ্রাম'}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {activeScreen !== 'home' && (
            <button
              onClick={() => setActiveScreen('home')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-sm transition border border-white/10 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">হোমে ফিরে যান</span>
            </button>
          )}

          {isAdmin ? (
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Requirement 2: Circular/Round Admin View Switcher UI with labels above */}
              <div className="flex items-center gap-1.5 sm:gap-2 bg-emerald-950/90 border border-emerald-400/50 px-2 py-1 rounded-2xl shadow-md">
                {/* 1. User View circular button with label above */}
                <div className="flex flex-col items-center">
                  <span className={`text-[8.5px] sm:text-[9.5px] font-bold leading-none mb-1 tracking-tight select-none whitespace-nowrap ${
                    adminViewMode === 'user' ? 'text-emerald-300 font-black' : 'text-emerald-200/70'
                  }`}>
                    ইউজার ভিউ
                  </span>
                  <button
                    type="button"
                    onClick={() => onSelectViewMode && onSelectViewMode('user')}
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-sm active:scale-90 ${
                      adminViewMode === 'user'
                        ? 'bg-emerald-400 text-emerald-950 ring-2 ring-white shadow-emerald-400/60 font-black'
                        : 'bg-emerald-900/80 text-emerald-200 hover:text-white hover:bg-emerald-800 border border-emerald-600/40'
                    }`}
                    title="ইউজার ভিউ: সাধারণ সদস্য ও ব্যবহারকারীদের ইন্টারফেস দেখুন"
                  >
                    <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                  </button>
                </div>

                <div className="w-[1px] h-6 bg-emerald-700/60 self-end mb-1" />

                {/* 2. Admin Panel View circular button with label above */}
                <div className="flex flex-col items-center">
                  <span className={`text-[8.5px] sm:text-[9.5px] font-bold leading-none mb-1 tracking-tight select-none whitespace-nowrap ${
                    adminViewMode === 'admin' ? 'text-amber-300 font-black' : 'text-emerald-200/70'
                  }`}>
                    অ্যাডমিন ভিউ
                  </span>
                  <button
                    type="button"
                    onClick={() => onSelectViewMode && onSelectViewMode('admin')}
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-sm active:scale-90 ${
                      adminViewMode === 'admin'
                        ? 'bg-amber-400 text-amber-950 ring-2 ring-white shadow-amber-400/60 font-black'
                        : 'bg-emerald-900/80 text-amber-300/80 hover:text-amber-200 hover:bg-emerald-800 border border-emerald-600/40'
                    }`}
                    title="অ্যাডমিন প্যানেল ভিউ: সকল প্রশাসনিক ড্যাশবোর্ড ও নিয়ন্ত্রণ প্যানেল"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                  </button>
                </div>

                <div className="w-[1px] h-6 bg-emerald-700/60 self-end mb-1" />

                {/* 3. Logout circular button with label above */}
                <div className="flex flex-col items-center">
                  <span className="text-[8.5px] sm:text-[9.5px] font-bold leading-none mb-1 tracking-tight text-rose-300 select-none whitespace-nowrap">
                    লগআউট
                  </span>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center bg-rose-950/80 text-rose-300 hover:text-white hover:bg-rose-900 border border-rose-600/60 transition-all cursor-pointer shadow-sm active:scale-90"
                    title="অ্যাডমিন সেশন থেকে লগআউট"
                  >
                    <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                  </button>
                </div>
              </div>
            </div>
          ) : loggedInUser ? (
            <div className="flex items-center gap-1.5 bg-emerald-950/80 border border-emerald-500/40 p-1 rounded-2xl shadow-sm">
              <div className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-emerald-100 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="max-w-[110px] sm:max-w-[150px] truncate">{loggedInUser.name}</span>
              </div>
              <button
                onClick={onMemberLogout}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs text-rose-300 hover:text-white hover:bg-rose-900/60 font-semibold cursor-pointer transition"
                title="লগআউট"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">লগআউট</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => openAuthModal('register')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition cursor-pointer shadow-xs active:scale-95"
              >
                <UserPlus className="w-3.5 h-3.5 text-emerald-300" />
                <span>নিবন্ধন</span>
              </button>
              <button
                onClick={() => openAuthModal('login')}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-emerald-950 text-xs font-black shadow-xs transition cursor-pointer active:scale-95"
              >
                <KeyRound className="w-3.5 h-3.5 text-emerald-950" />
                <span>লগইন</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
