import React from 'react';
import { 
  HeartHandshake, 
  Lock, 
  PhoneCall, 
  ArrowLeft,
  Settings,
  Users,
  Droplet,
  Wallet,
  Calendar as CalendarIcon,
  BellRing,
  HelpCircle,
  ShieldCheck,
  Phone,
  LogOut,
  UserPlus,
  KeyRound,
  User
} from 'lucide-react';
import { ActiveScreen, OrganizationProfile, UserAccount } from '../types';

interface HeaderProps {
  profile: OrganizationProfile;
  activeScreen: ActiveScreen;
  setActiveScreen: (screen: ActiveScreen) => void;
  isAdmin: boolean;
  setIsAdmin: (val: boolean) => void;
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
      <div className="max-w-6xl mx-auto px-4 py-3 sm:py-3.5 flex justify-between items-center gap-3">
        {/* Brand Logo & Title */}
        <div 
          onClick={() => setActiveScreen('home')}
          className="flex items-center gap-3 cursor-pointer select-none group"
        >
          <div className="w-12 h-12 rounded-2xl bg-white shadow-md flex items-center justify-center p-1.5 border-2 border-emerald-400 text-emerald-800 shrink-0 group-hover:scale-105 transition-transform duration-300">
            {profile.logoUrl ? (
              <img 
                src={profile.logoUrl} 
                alt={profile.name} 
                className="w-full h-full object-cover rounded-xl"
              />
            ) : (
              <HeartHandshake className="w-8 h-8 text-emerald-700" />
            )}
          </div>
          <div>
            <h1 className="text-lg sm:text-2xl font-black tracking-tight text-white leading-tight flex items-center gap-2">
              <span>{profile.name}</span>
            </h1>
            <p className="text-[11px] sm:text-xs text-emerald-200 font-medium flex items-center gap-2 mt-0.5">
              <span>{profile.tagline || 'মানবতার কল্যাণে নিবেদিত প্রাণ'}</span>
              <span className="text-emerald-400">•</span>
              <span className="text-amber-300 font-semibold">{profile.address}</span>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
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
            <div className="flex items-center gap-1.5 bg-emerald-950/80 border border-emerald-500/40 p-1 rounded-2xl shadow-sm">
              <button
                onClick={() => setActiveScreen('admin')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  activeScreen === 'admin' 
                    ? 'bg-amber-400 text-emerald-950 shadow-xs' 
                    : 'text-emerald-100 hover:text-white'
                }`}
              >
                <Settings className="w-3.5 h-3.5" />
                <span>অ্যাডমিন প্যানেল</span>
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs text-rose-300 hover:text-white hover:bg-rose-900/60 font-semibold cursor-pointer transition"
                title="লগআউট"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">লগআউট</span>
              </button>
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

      {/* Navigation Tabs Bar */}
      <div className="bg-emerald-950/70 border-t border-emerald-800/50 px-4 py-2 overflow-x-auto no-scrollbar">
        <div className="max-w-6xl mx-auto flex items-center gap-1.5 sm:gap-2 text-xs font-bold whitespace-nowrap">
          <button
            onClick={() => setActiveScreen('home')}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
              activeScreen === 'home' 
                ? 'bg-emerald-600 text-white shadow-sm' 
                : 'text-emerald-100 hover:bg-emerald-800/60'
            }`}
          >
            প্রধান পাতা
          </button>
          <button
            onClick={() => setActiveScreen('members')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition cursor-pointer ${
              activeScreen === 'members' 
                ? 'bg-emerald-600 text-white shadow-sm' 
                : 'text-emerald-100 hover:bg-emerald-800/60'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-emerald-300" />
            <span>সদস্য তালিকা</span>
          </button>
          <button
            onClick={() => setActiveScreen('blood')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition cursor-pointer ${
              activeScreen === 'blood' 
                ? 'bg-rose-700 text-white shadow-sm' 
                : 'text-rose-100 hover:bg-rose-900/60'
            }`}
          >
            <Droplet className="w-3.5 h-3.5 text-rose-300" />
            <span>রক্তদান সেবা</span>
          </button>
          <button
            onClick={() => setActiveScreen('fund')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition cursor-pointer ${
              activeScreen === 'fund' 
                ? 'bg-emerald-600 text-white shadow-sm' 
                : 'text-emerald-100 hover:bg-emerald-800/60'
            }`}
          >
            <Wallet className="w-3.5 h-3.5 text-amber-300" />
            <span>তহবিল ও চাঁদা</span>
          </button>
          <button
            onClick={() => setActiveScreen('calendar')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition cursor-pointer ${
              activeScreen === 'calendar' 
                ? 'bg-emerald-600 text-white shadow-sm' 
                : 'text-emerald-100 hover:bg-emerald-800/60'
            }`}
          >
            <CalendarIcon className="w-3.5 h-3.5 text-teal-300" />
            <span>ক্যালেন্ডার ২০২৬</span>
          </button>
          <button
            onClick={() => setActiveScreen('notices')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition cursor-pointer ${
              activeScreen === 'notices' 
                ? 'bg-emerald-600 text-white shadow-sm' 
                : 'text-emerald-100 hover:bg-emerald-800/60'
            }`}
          >
            <BellRing className="w-3.5 h-3.5 text-yellow-300" />
            <span>নোটিশ বোর্ড</span>
          </button>
          <button
            onClick={() => setActiveScreen('support')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition cursor-pointer ${
              activeScreen === 'support' 
                ? 'bg-emerald-600 text-white shadow-sm' 
                : 'text-emerald-100 hover:bg-emerald-800/60'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5 text-emerald-300" />
            <span>সহায়তা কেন্দ্র</span>
          </button>
        </div>
      </div>
    </header>
  );
};
