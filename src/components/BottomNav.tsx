import React from 'react';
import { Home, Users, Droplet, Wallet, Headphones, ShieldCheck } from 'lucide-react';
import { ActiveScreen, UserAccount } from '../types';

interface BottomNavProps {
  activeScreen: ActiveScreen;
  setActiveScreen: (screen: ActiveScreen) => void;
  isAdmin: boolean;
  adminViewMode?: 'admin' | 'user';
  onSelectViewMode?: (mode: 'admin' | 'user') => void;
  loggedInUser?: UserAccount | null;
  openAuthModal: (mode?: 'login' | 'register') => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeScreen,
  setActiveScreen,
  isAdmin,
  adminViewMode = 'admin',
  onSelectViewMode,
  loggedInUser,
  openAuthModal
}) => {
  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 w-full max-w-full overflow-hidden bg-white/95 backdrop-blur-md border-t border-slate-200 z-40 py-1.5 px-2 shadow-lg overscroll-none">
      <div className="flex justify-around items-center">
        <button
          onClick={() => setActiveScreen('home')}
          className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition cursor-pointer ${
            activeScreen === 'home' ? 'text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px]">হোম</span>
        </button>

        <button
          onClick={() => setActiveScreen('members')}
          className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition cursor-pointer ${
            activeScreen === 'members' ? 'text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-5 h-5" />
          <span className="text-[10px]">সদস্য</span>
        </button>

        <button
          onClick={() => setActiveScreen('blood')}
          className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition cursor-pointer ${
            activeScreen === 'blood' ? 'text-rose-600 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Droplet className="w-5 h-5 text-rose-500" />
          <span className="text-[10px]">রক্তদান</span>
        </button>

        <button
          onClick={() => setActiveScreen('fund')}
          className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition cursor-pointer ${
            activeScreen === 'fund' ? 'text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Wallet className="w-5 h-5 text-amber-500" />
          <span className="text-[10px]">তহবিল</span>
        </button>

        {/* Requirement 3: Support Team tab replacing Calendar */}
        <button
          onClick={() => setActiveScreen('support')}
          className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition cursor-pointer ${
            activeScreen === 'support' ? 'text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Headphones className="w-5 h-5 text-emerald-600" />
          <span className="text-[10px]">সাপোর্ট টিম</span>
        </button>

        {/* Admin tab only if isAdmin in admin view */}
        {isAdmin && adminViewMode !== 'user' && (
          <button
            onClick={() => setActiveScreen('admin')}
            className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition cursor-pointer ${
              activeScreen === 'admin' ? 'text-amber-600 font-bold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck className="w-5 h-5 text-amber-500" />
            <span className="text-[10px]">অ্যাডমিন</span>
          </button>
        )}
      </div>
    </nav>
  );
};

