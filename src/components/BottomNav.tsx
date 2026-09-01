import React from 'react';
import { Home, Users, Droplet, BellRing, Wallet, Calendar, LifeBuoy } from 'lucide-react';
import { ActiveScreen } from '../types';

interface BottomNavProps {
  activeScreen: ActiveScreen;
  setActiveScreen: (screen: ActiveScreen) => void;
  noticeCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeScreen,
  setActiveScreen,
  noticeCount = 0,
}) => {
  const navItems: { 
    id: ActiveScreen; 
    label: string; 
    icon: React.ReactNode; 
    badge?: number; 
    theme: 'blood' | 'support' | 'calendar' | 'default';
  }[] = [
    {
      id: 'home',
      label: 'হোম',
      icon: <Home className="w-4 h-4" />,
      theme: 'default',
    },
    {
      id: 'members',
      label: 'সদস্য',
      icon: <Users className="w-4 h-4" />,
      theme: 'default',
    },
    {
      id: 'blood',
      label: 'রক্তদান',
      icon: <Droplet className="w-4 h-4 fill-current" />,
      theme: 'blood',
    },
    {
      id: 'notices',
      label: 'নোটিশ',
      icon: <BellRing className="w-4 h-4" />,
      badge: noticeCount,
      theme: 'default',
    },
    {
      id: 'fund',
      label: 'ফান্ড',
      icon: <Wallet className="w-4 h-4" />,
      theme: 'default',
    },
    {
      id: 'calendar',
      label: 'ক্যালেন্ডার',
      icon: <Calendar className="w-4 h-4" />,
      theme: 'calendar',
    },
    {
      id: 'support',
      label: 'সাপোর্ট',
      icon: <LifeBuoy className="w-4 h-4" />,
      theme: 'support',
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] px-1 py-1 sm:hidden select-none">
      <div className="max-w-md mx-auto flex items-center justify-between gap-0.5 overflow-x-auto no-scrollbar py-0.5">
        {navItems.map((item) => {
          const isActive = activeScreen === item.id;
          
          let activeColorClass = 'text-emerald-800 font-bold';
          let activeBgClass = 'bg-emerald-100 text-emerald-800';
          let activeDotClass = 'bg-emerald-600';

          if (item.theme === 'blood') {
            activeColorClass = 'text-rose-600 font-bold';
            activeBgClass = 'bg-rose-100 text-rose-600';
            activeDotClass = 'bg-rose-600';
          } else if (item.theme === 'support') {
            activeColorClass = 'text-amber-800 font-bold';
            activeBgClass = 'bg-amber-100 text-amber-800';
            activeDotClass = 'bg-amber-600';
          } else if (item.theme === 'calendar') {
            activeColorClass = 'text-indigo-800 font-bold';
            activeBgClass = 'bg-indigo-100 text-indigo-800';
            activeDotClass = 'bg-indigo-600';
          }

          return (
            <button
              key={item.id}
              id={`bottom-nav-${item.id}`}
              onClick={() => setActiveScreen(item.id)}
              className={`relative flex-1 min-w-[44px] max-w-[58px] flex flex-col items-center justify-center py-1 px-0.5 rounded-xl transition-all duration-150 active:scale-95 cursor-pointer ${
                isActive ? activeColorClass : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {isActive && (
                <span className={`absolute top-0 w-4 h-0.5 rounded-full ${activeDotClass}`} />
              )}
              
              <div
                className={`relative p-1 rounded-lg transition-colors flex items-center justify-center ${
                  isActive ? activeBgClass : 'bg-transparent text-slate-500'
                }`}
              >
                {item.icon}
                {Boolean(item.badge && item.badge > 0) && (
                  <span className="absolute -top-1 -right-1.5 min-w-[14px] h-3.5 px-0.5 bg-red-600 text-white rounded-full text-[8px] font-black flex items-center justify-center shadow-xs leading-none">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[8.5px] leading-tight tracking-tight truncate max-w-full text-center mt-0.5">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
