import React, { useState, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  ArrowLeft, 
  Clock, 
  CheckCircle2, 
  Info,
  CalendarCheck,
  CalendarDays,
  Flame,
  Globe,
  MapPin,
  Users,
  HeartHandshake,
  ShieldCheck,
  Search,
  PhoneCall,
  Moon,
  AlertCircle,
  Award,
  Layers,
  ExternalLink,
  X,
  Share2,
  ArrowRight
} from 'lucide-react';
import { 
  BANGLADESH_HOLIDAYS_2026, 
  MONTH_NAMES_BN, 
  MONTH_NAMES_EN, 
  DAY_NAMES_SHORT_BN, 
  DAY_NAMES_BN,
  getMonthDaysInfo, 
  getFullDateSummary, 
  getBanglaDate, 
  PublicHoliday, 
  DayCalendarInfo 
} from '../utils/calendarData';
import { 
  OrganizationEvent, 
  getAllOrganizationEvents 
} from '../utils/organizationEvents';
import { OrganizationProfile, Notice, HumanitarianActivity, ActiveScreen } from '../types';
import { toBengaliNumber } from '../utils/helpers';

interface CalendarScreenProps {
  onBack: () => void;
  profile?: OrganizationProfile;
  notices?: Notice[];
  humanitarianActivities?: HumanitarianActivity[];
  onNavigate?: (screen: ActiveScreen) => void;
}

export const CalendarScreen: React.FC<CalendarScreenProps> = ({ 
  onBack,
  profile,
  notices = [],
  humanitarianActivities = [],
  onNavigate
}) => {
  // Current real date (or 2026 date context)
  const realDate = useMemo(() => new Date(), []);
  
  // Year is fixed to 2026 as per calendar specifications
  const [selectedYear] = useState<number>(2026);
  const [selectedMonth, setSelectedMonth] = useState<number>(() => {
    const m = realDate.getMonth();
    return Math.min(11, Math.max(0, m));
  });

  // Active View Tab: 'calendar' | 'holidays'
  const [activeViewTab, setActiveViewTab] = useState<'calendar' | 'holidays'>('calendar');

  // Selected Day for Detail Modal
  const [selectedDayInfo, setSelectedDayInfo] = useState<DayCalendarInfo | null>(null);

  // Calendar Grid Filter: 'all' | 'orgEvents' | 'holidays' | 'weekends'
  const [calendarGridFilter, setCalendarGridFilter] = useState<'all' | 'orgEvents' | 'holidays' | 'weekends'>('all');

  // Holiday Tab Filter: 'all' | 'general' | 'executive' | 'upcoming'
  const [holidayFilter, setHolidayFilter] = useState<'all' | 'general' | 'executive' | 'upcoming'>('all');

  // Search keyword for holidays & dates
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Month filter for holiday/events list
  const [selectedListMonth, setSelectedListMonth] = useState<number | 'all'>('all');

  // Copy or share notification toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Combine official organization events with dynamic activities & notices
  const allOrgEvents = useMemo(() => {
    return getAllOrganizationEvents(humanitarianActivities, notices);
  }, [humanitarianActivities, notices]);

  // Map of dateStr -> OrganizationEvent[] for rapid lookup
  const orgEventsByDate = useMemo(() => {
    const map = new Map<string, OrganizationEvent[]>();
    allOrgEvents.forEach((ev) => {
      const list = map.get(ev.dateStr) || [];
      list.push(ev);
      map.set(ev.dateStr, list);
    });
    return map;
  }, [allOrgEvents]);

  // Days for the selected month
  const monthDays = useMemo(() => {
    return getMonthDaysInfo(selectedYear, selectedMonth);
  }, [selectedYear, selectedMonth]);

  // First day offset (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
  const firstDayOffset = useMemo(() => {
    const firstDay = new Date(selectedYear, selectedMonth, 1);
    return firstDay.getDay();
  }, [selectedYear, selectedMonth]);

  // Today's summary
  const todaySummary = useMemo(() => {
    return getFullDateSummary(realDate);
  }, [realDate]);

  // Month navigation
  const handlePrevMonth = () => {
    if (selectedMonth > 0) {
      setSelectedMonth(selectedMonth - 1);
    } else {
      setSelectedMonth(11);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth < 11) {
      setSelectedMonth(selectedMonth + 1);
    } else {
      setSelectedMonth(0);
    }
  };

  const handleGoToCurrentMonth = () => {
    setSelectedMonth(realDate.getMonth());
  };

  // Filtered Holidays
  const filteredHolidays = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const todayStr = `${realDate.getFullYear()}-${String(realDate.getMonth() + 1).padStart(2, '0')}-${String(realDate.getDate()).padStart(2, '0')}`;
    
    return BANGLADESH_HOLIDAYS_2026.filter((holiday) => {
      // Month filter
      if (selectedListMonth !== 'all') {
        const holidayMonth = parseInt(holiday.dateStr.split('-')[1], 10) - 1;
        if (holidayMonth !== selectedListMonth) return false;
      }

      // Type filter
      if (holidayFilter === 'general' && holiday.type !== 'general') return false;
      if (holidayFilter === 'executive' && holiday.type !== 'executive') return false;
      if (holidayFilter === 'upcoming') {
        const endDate = holiday.endDateStr || holiday.dateStr;
        if (endDate < todayStr) return false;
      }

      // Query filter
      if (query) {
        const matchBn = holiday.nameBn.toLowerCase().includes(query);
        const matchEn = holiday.nameEn.toLowerCase().includes(query);
        const matchDesc = holiday.description.toLowerCase().includes(query);
        if (!matchBn && !matchEn && !matchDesc) return false;
      }

      return true;
    });
  }, [holidayFilter, selectedListMonth, realDate, searchQuery]);

  // Next upcoming org event
  const nextOrgEvent = useMemo(() => {
    const todayStr = `${realDate.getFullYear()}-${String(realDate.getMonth() + 1).padStart(2, '0')}-${String(realDate.getDate()).padStart(2, '0')}`;
    return allOrgEvents.find((e) => e.dateStr >= todayStr) || allOrgEvents[0];
  }, [allOrgEvents, realDate]);

  // Next upcoming holiday
  const nextUpcomingHoliday = useMemo(() => {
    const todayStr = `${realDate.getFullYear()}-${String(realDate.getMonth() + 1).padStart(2, '0')}-${String(realDate.getDate()).padStart(2, '0')}`;
    return BANGLADESH_HOLIDAYS_2026.find((h) => (h.endDateStr || h.dateStr) >= todayStr) || BANGLADESH_HOLIDAYS_2026[0];
  }, [realDate]);

  // Helper for days remaining
  const getDaysRemainingText = (dateStr: string, endDateStr?: string) => {
    const todayStr = `${realDate.getFullYear()}-${String(realDate.getMonth() + 1).padStart(2, '0')}-${String(realDate.getDate()).padStart(2, '0')}`;
    const todayMs = new Date(todayStr).getTime();
    const targetMs = new Date(dateStr).getTime();
    const endMs = endDateStr ? new Date(endDateStr).getTime() : targetMs;

    if (todayMs >= targetMs && todayMs <= endMs) {
      return { text: 'আজ অনুষ্ঠিত হচ্ছে', status: 'today' };
    }

    const diffDays = Math.ceil((targetMs - todayMs) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) {
      return { text: 'অতিক্রান্ত', status: 'past' };
    }
    if (diffDays === 1) {
      return { text: 'আগামীকাল', status: 'tomorrow' };
    }
    return { text: `আর ${toBengaliNumber(diffDays)} দিন বাকি`, status: 'future' };
  };

  // Selected date events & holiday info
  const selectedDayEvents = useMemo(() => {
    if (!selectedDayInfo) return [];
    return orgEventsByDate.get(selectedDayInfo.dateStr) || [];
  }, [selectedDayInfo, orgEventsByDate]);

  const orgName = profile?.name || 'সিলেট মানব সেবা সংগঠন';
  const orgTagline = profile?.tagline || 'মানবতার সেবায় নিবেদিত এক বিশ্বস্ত নাম';
  const orgAddress = profile?.address || 'আম্বরখানা, সিলেট সদর, সিলেট';
  const orgHotline = profile?.hotline || profile?.phone || '০১৭xxxxxxxx';
  const orgReg = profile?.regNumber || 'রেজিস্ট্রেশন নং: এস-১২৯৮/২০২০';

  return (
    <div className="space-y-6 animate-fadeIn pb-20 max-w-7xl mx-auto px-1 sm:px-2">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 right-5 z-50 bg-slate-950 text-white px-4 py-2.5 rounded-2xl shadow-xl border border-emerald-500/50 flex items-center gap-2 text-xs font-bold animate-slideUp">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* =========================================================================
          SECTION 1: BRANDING HEADER (সিলট মানব সেবা সংগঠন Official Calendar Header)
      ========================================================================== */}
      <div className="relative overflow-hidden text-white rounded-3xl p-5 sm:p-7 shadow-xl border border-emerald-700/60 bg-emerald-950">
        {/* Humanitarian Activity Photographic Background */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-700 scale-105"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=1920&q=85')`,
            backgroundPosition: 'center 40%'
          }}
          aria-hidden="true"
        />

        {/* Semi-transparent Emerald / Teal Protective Gradient Overlay (guarantees crystal-clear legibility of all white and yellow/amber text) */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/92 via-emerald-900/88 to-teal-950/94 backdrop-blur-[1.5px]" />

        {/* Soft Background Accents */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-56 h-56 rounded-full bg-amber-400/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Organization Identity & Title */}
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-3">
              <button
                onClick={onBack}
                id="calendar-top-back-btn"
                className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer border border-white/15 flex-shrink-0 active:scale-95"
                title="হোমে ফিরে যান"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <div className="flex flex-wrap items-center gap-2">
                <span className="bg-emerald-500/30 text-emerald-100 text-[11px] font-bold px-3 py-0.5 rounded-full border border-emerald-400/30 flex items-center gap-1.5 shadow-2xs backdrop-blur-xs">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                  অফিশিয়াল সাংগঠনিক ক্যালেন্ডার ২০২৬
                </span>
                <span className="bg-amber-400/20 text-amber-200 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-amber-300/30">
                  {orgReg}
                </span>
                <span className="hidden sm:inline-flex bg-teal-400/20 text-teal-200 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-teal-300/30 items-center gap-1">
                  <Globe className="w-3 h-3 text-teal-300" />
                  ১০০% অফলাইন কার্যকর
                </span>
              </div>
            </div>

            {/* Official Organization Name & Branding */}
            <div>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-400/20 border border-amber-300/40 flex items-center justify-center text-amber-300 flex-shrink-0">
                  <HeartHandshake className="w-5 h-5" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white drop-shadow-xs">
                  {orgName}
                </h1>
              </div>
              <p className="text-xs sm:text-sm text-emerald-100/90 mt-1 font-medium leading-relaxed pl-11">
                {orgTagline}
              </p>
            </div>

            {/* Quick Metadata Badges */}
            <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-emerald-100/80 pl-1">
              <div className="flex items-center gap-1.5 bg-black/20 px-3 py-1 rounded-xl border border-white/10">
                <MapPin className="w-3.5 h-3.5 text-amber-300 flex-shrink-0" />
                <span className="truncate max-w-[240px] sm:max-w-none">{orgAddress}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-black/20 px-3 py-1 rounded-xl border border-white/10">
                <PhoneCall className="w-3.5 h-3.5 text-emerald-300 flex-shrink-0" />
                <span>জরুরি যোগাযোগ: <strong>{orgHotline}</strong></span>
              </div>
            </div>
          </div>

          {/* Right Live Date & Status Card */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end justify-between gap-3 bg-white/10 backdrop-blur-md p-4 sm:p-5 rounded-3xl border border-white/20 shadow-md">
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-300 text-slate-950 flex flex-col items-center justify-center font-black shadow-md border-2 border-white/30 flex-shrink-0">
                <span className="text-[11px] leading-none uppercase font-bold tracking-wider opacity-80">
                  {todaySummary.dayName}
                </span>
                <span className="text-2xl leading-none font-black mt-1">
                  {toBengaliNumber(realDate.getDate())}
                </span>
              </div>

              <div>
                <div className="text-[10px] text-emerald-200 font-bold uppercase tracking-wider flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-300" />
                  <span>আজকের তারিখ</span>
                </div>
                <div className="text-base font-black text-white mt-0.5">
                  {todaySummary.englishFormatted}
                </div>
                <div className="text-xs text-amber-200 font-bold mt-0.5">
                  {todaySummary.banglaFormatted}
                </div>
                <div className="text-[11px] text-emerald-200 font-medium mt-0.5">
                  {todaySummary.hijriFormatted} • {todaySummary.season}
                </div>
              </div>
            </div>

            {/* Quick Next Highlights */}
            {nextOrgEvent && (
              <div className="mt-2 pt-2 border-t border-white/15 text-[11px] text-emerald-100 flex items-center gap-2 self-stretch">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span className="truncate">
                  আসন্ন কর্মসূচি: <strong className="text-white">{nextOrgEvent.title}</strong> ({nextOrgEvent.dateStr})
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* =========================================================================
          SECTION 2: VIEW CONTROLLER & SEARCH BAR
      ========================================================================== */}
      <div className="bg-white rounded-3xl p-3 sm:p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-2xl overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveViewTab('calendar')}
            id="tab-view-calendar"
            className={`px-4 py-2 text-xs sm:text-sm font-black rounded-xl transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeViewTab === 'calendar'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <CalendarIcon className="w-4 h-4" />
            <span>১. পূর্ণাঙ্গ ক্যালেন্ডার</span>
          </button>

          <button
            onClick={() => setActiveViewTab('holidays')}
            id="tab-view-holidays"
            className={`px-4 py-2 text-xs sm:text-sm font-black rounded-xl transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeViewTab === 'holidays'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Flame className="w-4 h-4 text-rose-500" />
            <span>২. সরকারি ছুটির গেজেট</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              activeViewTab === 'holidays' ? 'bg-rose-500 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {toBengaliNumber(BANGLADESH_HOLIDAYS_2026.length)}
            </span>
          </button>
        </div>

        {/* Universal Search Box */}
        <div className="relative min-w-[240px] md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ছুটি বা বিশেষ দিন খুঁজুন..."
            id="calendar-search-input"
            className="w-full pl-9.5 pr-8 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Clean Search Results Feedback (when searching in calendar view) */}
      {searchQuery.trim() && activeViewTab === 'calendar' && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-emerald-700 flex-shrink-0" />
            <span className="text-xs text-emerald-900 font-bold">
              "{searchQuery}" অনুসন্ধান: {toBengaliNumber(filteredHolidays.length)} টি সরকারি ছুটি ও দিবস পাওয়া গেছে
            </span>
          </div>
          <button
            onClick={() => setActiveViewTab('holidays')}
            className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer self-start sm:self-auto shadow-2xs"
          >
            <span>ছুটির তালিকায় দেখুন</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* =========================================================================
          VIEW TAB 1: CALENDAR GRID DISPLAY (Redesigned & Mobile Friendly)
      ========================================================================== */}
      {activeViewTab === 'calendar' && (
        <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-xs space-y-5">
          {/* Calendar Controller Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
                  <span>মাসিক ক্যালেন্ডার ও ইভেন্ট ড্যাশবোর্ড</span>
                  <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full hidden sm:inline">
                    ইংরেজি • বাংলা • হিজরি
                  </span>
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                সংগঠনের সভা, ত্রাণ বিতরণ কর্মসূচি ও সরকারি ছুটি চিহ্নিত রয়েছে
              </p>
            </div>

            {/* Month Navigator Controls */}
            <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-200 self-start sm:self-auto">
              <button
                onClick={handlePrevMonth}
                id="calendar-prev-month-btn"
                className="p-2 rounded-xl bg-white hover:bg-slate-200/80 text-slate-700 shadow-2xs border border-slate-200 transition cursor-pointer active:scale-95"
                title="পূর্ববর্তী মাস"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="px-3 text-center min-w-[140px]">
                <span className="block text-sm sm:text-base font-black text-slate-900">
                  {MONTH_NAMES_BN[selectedMonth]} {toBengaliNumber(selectedYear)}
                </span>
                <span className="block text-[10px] text-slate-500 font-medium">
                  {MONTH_NAMES_EN[selectedMonth]} {selectedYear}
                </span>
              </div>

              <button
                onClick={handleNextMonth}
                id="calendar-next-month-btn"
                className="p-2 rounded-xl bg-white hover:bg-slate-200/80 text-slate-700 shadow-2xs border border-slate-200 transition cursor-pointer active:scale-95"
                title="পরবর্তী মাস"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                onClick={handleGoToCurrentMonth}
                id="calendar-current-month-btn"
                className="ml-1 px-3 py-1.5 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl transition cursor-pointer shadow-2xs active:scale-95"
                title="বর্তমান মাসে যান"
              >
                চলতি মাস
              </button>
            </div>
          </div>

          {/* Quick Month Bar Pill Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-none text-xs">
            {MONTH_NAMES_BN.map((name, idx) => {
              const isSelected = selectedMonth === idx;
              // Check if month has org events
              const monthPrefix = `2026-${String(idx + 1).padStart(2, '0')}`;
              const hasEvents = allOrgEvents.some(e => e.dateStr.startsWith(monthPrefix));

              return (
                <button
                  key={idx}
                  onClick={() => setSelectedMonth(idx)}
                  id={`calendar-month-pill-${idx}`}
                  className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer relative ${
                    isSelected
                      ? 'bg-emerald-700 text-white shadow-xs scale-102 ring-2 ring-emerald-600/30'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <span>{name}</span>
                  {hasEvents && !isSelected && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 absolute top-1 right-1" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Calendar Grid Filter Badges */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">ফিল্টার:</span>
              <button
                onClick={() => setCalendarGridFilter('all')}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                  calendarGridFilter === 'all'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                সকল দিন
              </button>
              <button
                onClick={() => setCalendarGridFilter('orgEvents')}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                  calendarGridFilter === 'orgEvents'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                }`}
              >
                <Users className="w-3 h-3" />
                <span>সাংগঠনিক কর্মসূচি</span>
              </button>
              <button
                onClick={() => setCalendarGridFilter('holidays')}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                  calendarGridFilter === 'holidays'
                    ? 'bg-rose-700 text-white shadow-xs'
                    : 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100'
                }`}
              >
                <Flame className="w-3 h-3" />
                <span>সরকারি ছুটি</span>
              </button>
            </div>

            <div className="text-[11px] text-slate-500 flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-emerald-600" />
              <span>যেকোনো তারিখে ট্যাপ করে বিস্তারিত কর্মসূচি ও ছুটির বিবরণ দেখুন</span>
            </div>
          </div>

          {/* Calendar Grid Container */}
          <div className="bg-slate-50/70 border border-slate-200 rounded-3xl p-2 sm:p-4 overflow-hidden shadow-2xs">
            {/* Day of Week Headers */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 text-center">
              {DAY_NAMES_SHORT_BN.map((dayName, idx) => {
                const isWeekendHeader = idx === 5 || idx === 6; // Fri or Sat
                return (
                  <div
                    key={idx}
                    className={`py-2 text-xs sm:text-sm font-black rounded-xl select-none ${
                      isWeekendHeader
                        ? 'bg-rose-100/90 text-rose-700 border border-rose-200/70'
                        : 'bg-white text-slate-700 border border-slate-200/60 shadow-2xs'
                    }`}
                  >
                    <span className="hidden sm:inline">{DAY_NAMES_BN[idx]}</span>
                    <span className="sm:hidden">{dayName}</span>
                  </div>
                );
              })}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {/* Empty offset spaces before 1st of the month */}
              {Array.from({ length: firstDayOffset }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="min-h-[75px] sm:min-h-[96px] rounded-2xl bg-slate-100/40 border border-dashed border-slate-200/50 opacity-40"
                />
              ))}

              {/* Month Days */}
              {monthDays.map((dayInfo) => {
                const dayEvents = orgEventsByDate.get(dayInfo.dateStr) || [];
                const hasOrgEvent = dayEvents.length > 0;
                const hasHoliday = dayInfo.holidays.length > 0;
                const isSelected = selectedDayInfo?.dateStr === dayInfo.dateStr;

                // Filter logic
                let isDimmed = false;
                if (calendarGridFilter === 'orgEvents' && !hasOrgEvent) isDimmed = true;
                if (calendarGridFilter === 'holidays' && !hasHoliday) isDimmed = true;
                if (calendarGridFilter === 'weekends' && !dayInfo.isWeekend) isDimmed = true;

                return (
                  <div
                    key={dayInfo.dateStr}
                    onClick={() => setSelectedDayInfo(dayInfo)}
                    id={`calendar-day-${dayInfo.dateStr}`}
                    className={`group relative min-h-[75px] sm:min-h-[102px] p-1.5 sm:p-2.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between select-none ${
                      isDimmed ? 'opacity-30' : 'opacity-100'
                    } ${
                      isSelected
                        ? 'ring-2 ring-emerald-600 bg-emerald-50/90 border-emerald-400 shadow-md scale-102 z-10'
                        : dayInfo.isToday
                        ? 'bg-amber-50/90 border-amber-300 ring-2 ring-amber-400/80 shadow-xs'
                        : hasOrgEvent
                        ? 'bg-emerald-50/70 border-emerald-300 hover:bg-emerald-100/70 shadow-2xs'
                        : hasHoliday
                        ? 'bg-rose-50/80 border-rose-200 hover:bg-rose-100/80'
                        : dayInfo.isWeekend
                        ? 'bg-slate-100/80 border-slate-200 hover:bg-slate-200/70'
                        : 'bg-white border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/40 shadow-2xs'
                    }`}
                  >
                    {/* Cell Top Header: Date Number & Badges */}
                    <div className="flex items-start justify-between w-full">
                      <span
                        className={`text-sm sm:text-base font-black leading-none ${
                          dayInfo.isToday
                            ? 'text-amber-950 bg-amber-300/80 px-1.5 py-0.5 rounded-md shadow-2xs'
                            : hasOrgEvent
                            ? 'text-emerald-900 font-black'
                            : hasHoliday
                            ? 'text-rose-700'
                            : dayInfo.isWeekend
                            ? 'text-rose-600'
                            : 'text-slate-800'
                        }`}
                      >
                        {toBengaliNumber(dayInfo.dayOfMonth)}
                      </span>

                      {/* Top Right Dot or Marker */}
                      <div className="flex items-center gap-1">
                        {dayInfo.isToday && (
                          <span className="text-[9px] font-bold bg-amber-500 text-slate-950 px-1 rounded-sm leading-tight shadow-2xs">
                            আজ
                          </span>
                        )}
                        {hasOrgEvent && (
                          <span
                            className="w-2.5 h-2.5 rounded-full bg-emerald-600 border border-white shadow-xs animate-pulse"
                            title={dayEvents[0].title}
                          />
                        )}
                        {hasHoliday && !hasOrgEvent && (
                          <span
                            className="w-2.5 h-2.5 rounded-full bg-rose-600 border border-white shadow-xs"
                            title={dayInfo.holidays[0].nameBn}
                          />
                        )}
                      </div>
                    </div>

                    {/* Middle Content: Organization Event / Holiday Title Pill */}
                    <div className="my-1 space-y-1">
                      {hasOrgEvent && (
                        <div className="truncate">
                          <span className="text-[9px] sm:text-[10px] font-bold text-emerald-900 bg-emerald-100/90 border border-emerald-300 px-1 sm:px-1.5 py-0.5 rounded-md flex items-center gap-1 truncate shadow-2xs">
                            <Users className="w-2.5 h-2.5 text-emerald-700 flex-shrink-0" />
                            <span className="truncate">{dayEvents[0].categoryLabelBn}</span>
                          </span>
                        </div>
                      )}

                      {hasHoliday && (
                        <div className="truncate">
                          <span className="text-[9px] sm:text-[10px] font-bold text-rose-800 bg-rose-100/90 border border-rose-200 px-1 sm:px-1.5 py-0.5 rounded-md flex items-center gap-1 truncate">
                            <Flame className="w-2.5 h-2.5 text-rose-600 flex-shrink-0" />
                            <span className="truncate">{dayInfo.holidays[0].nameBn}</span>
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Cell Bottom Footer: Bangla & Hijri Date */}
                    <div className="mt-auto pt-1 border-t border-slate-200/60 flex items-center justify-between text-[9px] sm:text-[10px] text-slate-500 font-medium">
                      <span className="text-emerald-800 font-bold truncate">
                        {toBengaliNumber(dayInfo.bangla.day)} {dayInfo.bangla.monthNameBn}
                      </span>
                      <span className="text-teal-700 hidden sm:inline truncate">
                        {toBengaliNumber(dayInfo.hijri.day)} {dayInfo.hijri.monthNameBn}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Grid Legend */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 pt-1">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-md bg-amber-100 border-2 border-amber-400 shadow-2xs" />
                <span className="font-bold text-amber-900">আজকের দিন</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-md bg-emerald-100 border-2 border-emerald-500 shadow-2xs" />
                <span className="font-bold text-emerald-900">সাংগঠনিক কর্মসূচি ও সভা</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-md bg-rose-100 border border-rose-300" />
                <span className="font-bold text-rose-800">সরকারি ছুটি</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-md bg-slate-100 border border-slate-300" />
                <span className="font-medium text-slate-700">সাপ্তাহিক ছুটি (শুক্র ও শনি)</span>
              </div>
            </div>

            <span className="text-[11px] text-slate-400">
              * সিলেট মানব সেবা সংগঠন অফিশিয়াল শিডিউল ২০২৬
            </span>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW TAB 2: GOVERNMENT PUBLIC HOLIDAYS (সরকারি ছুটি ২০২৬)
      ========================================================================== */}
      {activeViewTab === 'holidays' && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-5">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600" />
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
                  <span>বাংলাদেশ সরকারি ছুটি ২০২৬ (গেজেট অনুযায়ী)</span>
                  <span className="text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-0.5 rounded-full">
                    মোট {toBengaliNumber(BANGLADESH_HOLIDAYS_2026.length)} টি প্রধান সরকারি ছুটি
                  </span>
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                জনপ্রশাসন মন্ত্রণালয়ের অনুমোদিত ক্যালেন্ডার ও ইসলামিক ফাউন্ডেশনের চাঁদ দেখার তালিকা
              </p>
            </div>

            {/* Upcoming Holiday Spotlight */}
            {nextUpcomingHoliday && (
              <div className="bg-gradient-to-r from-rose-50 to-amber-50 border border-rose-200 rounded-2xl p-3 flex items-center gap-3 self-start md:self-auto shadow-2xs">
                <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                  <Flame className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wide block">
                    পরবর্তী আসন্ন সরকারি ছুটি
                  </span>
                  <span className="text-xs font-bold text-slate-900 block truncate max-w-[220px]">
                    {nextUpcomingHoliday.nameBn}
                  </span>
                  <span className="text-[10px] text-amber-800 font-semibold">
                    {nextUpcomingHoliday.dateStr} ({nextUpcomingHoliday.dayNameBn})
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-2xl">
              <button
                onClick={() => setHolidayFilter('all')}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  holidayFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                সকল ছুটি ({toBengaliNumber(BANGLADESH_HOLIDAYS_2026.length)})
              </button>

              <button
                onClick={() => setHolidayFilter('general')}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  holidayFilter === 'general'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                সাধারণ ছুটি
              </button>

              <button
                onClick={() => setHolidayFilter('executive')}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  holidayFilter === 'executive'
                    ? 'bg-blue-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                নির্বাহী আদেশে ছুটি
              </button>

              <button
                onClick={() => setHolidayFilter('upcoming')}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  holidayFilter === 'upcoming'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                আসন্ন ছুটি
              </button>
            </div>

            {/* Month Filter Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium whitespace-nowrap">মাস অনুযায়ী:</span>
              <select
                value={selectedListMonth}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedListMonth(val === 'all' ? 'all' : parseInt(val, 10));
                }}
                className="text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="all">পুরো বছর (সব মাস)</option>
                {MONTH_NAMES_BN.map((name, idx) => (
                  <option key={idx} value={idx}>
                    {name} ২০২৬
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Holidays Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredHolidays.map((holiday) => {
              const hDate = new Date(holiday.dateStr);
              const bangla = getBanglaDate(hDate);
              const countdown = getDaysRemainingText(holiday.dateStr, holiday.endDateStr);

              return (
                <div
                  key={holiday.id}
                  id={`holiday-card-${holiday.id}`}
                  className="bg-slate-50/80 hover:bg-white rounded-3xl p-5 border border-slate-200 hover:border-rose-300 transition-all shadow-2xs hover:shadow-sm flex flex-col justify-between gap-3"
                >
                  <div>
                    {/* Category & Badges */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-lg border ${
                        holiday.type === 'general'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-blue-50 text-blue-800 border-blue-200'
                      }`}>
                        {holiday.typeLabelBn}
                      </span>

                      <div className="flex items-center gap-1.5">
                        {holiday.isMoonDependent && (
                          <span className="text-[10px] bg-amber-100 text-amber-900 border border-amber-200 px-2 py-0.5 rounded-md font-semibold flex items-center gap-1">
                            <Moon className="w-3 h-3 text-amber-700" />
                            চাঁদ দেখার ওপর
                          </span>
                        )}
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                          countdown.status === 'today'
                            ? 'bg-emerald-600 text-white animate-pulse'
                            : countdown.status === 'tomorrow'
                            ? 'bg-amber-500 text-white font-bold'
                            : countdown.status === 'future'
                            ? 'bg-slate-200 text-slate-800'
                            : 'bg-slate-100 text-slate-400'
                        }`}>
                          {countdown.text}
                        </span>
                      </div>
                    </div>

                    {/* Holiday Title */}
                    <h4 className="text-base font-bold text-slate-900 leading-snug">
                      {holiday.nameBn}
                    </h4>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      {holiday.nameEn}
                    </p>

                    {/* Description */}
                    <p className="text-xs text-slate-600 mt-2 leading-relaxed bg-white/80 p-2.5 rounded-2xl border border-slate-100">
                      {holiday.description}
                    </p>
                  </div>

                  {/* Date & Bangla Date */}
                  <div className="pt-2 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-1.5 text-slate-900 font-bold">
                      <CalendarDays className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" />
                      <span>
                        {toBengaliNumber(hDate.getDate())} {MONTH_NAMES_BN[hDate.getMonth()]}, ২০২৬ ({holiday.dayNameBn})
                      </span>
                    </div>

                    <div className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200/60">
                      {toBengaliNumber(bangla.day)} {bangla.monthNameBn}, {toBengaliNumber(bangla.year)} বঙ্গাব্দ
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredHolidays.length === 0 && (
            <div className="text-center py-10 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
              <CalendarCheck className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-slate-700">কোনো সরকারি ছুটি পাওয়া যায়নি</h4>
              <p className="text-xs text-slate-500 mt-1">অনুগ্রহ করে ফিল্টার পরিবর্তন করে পুনরায় চেষ্টা করুন।</p>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          INTERACTIVE DATE DETAIL MODAL / INSPECTOR (When clicking any date)
      ========================================================================== */}
      {selectedDayInfo && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-scaleUp max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-emerald-800 to-teal-900 text-white p-5 flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 flex flex-col items-center justify-center flex-shrink-0 shadow-md">
                  <span className="text-[10px] font-bold uppercase leading-none">{selectedDayInfo.dayNameShortBn}</span>
                  <span className="text-xl font-black leading-none mt-0.5">{toBengaliNumber(selectedDayInfo.dayOfMonth)}</span>
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-black text-white leading-snug">
                      {toBengaliNumber(selectedDayInfo.dayOfMonth)} {MONTH_NAMES_BN[selectedDayInfo.date.getMonth()]}, ২০২৬
                    </h3>
                    {selectedDayInfo.isToday && (
                      <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full">
                        আজ
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-emerald-200 mt-0.5 font-medium">
                    {selectedDayInfo.dayNameBn} • {MONTH_NAMES_EN[selectedDayInfo.date.getMonth()]} {selectedDayInfo.dayOfMonth}, 2026
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedDayInfo(null)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
                title="বন্ধ করুন"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              {/* Three Dates Alignment Box */}
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px] font-medium">বাংলা সন (বঙ্গাব্দ):</span>
                  <span className="font-bold text-emerald-900 text-sm">
                    {toBengaliNumber(selectedDayInfo.bangla.day)} {selectedDayInfo.bangla.monthNameBn}
                  </span>
                  <span className="block text-[10px] text-slate-500">
                    {toBengaliNumber(selectedDayInfo.bangla.year)} বঙ্গাব্দ ({selectedDayInfo.bangla.seasonBn})
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 block text-[10px] font-medium">আরবি সন (হিজরি):</span>
                  <span className="font-bold text-teal-900 text-sm">
                    {toBengaliNumber(selectedDayInfo.hijri.day)} {selectedDayInfo.hijri.monthNameBn}
                  </span>
                  <span className="block text-[10px] text-slate-500">
                    {toBengaliNumber(selectedDayInfo.hijri.year)} হিজরি
                  </span>
                </div>
              </div>

              {/* Organization Events on this day */}
              {selectedDayEvents.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                    <Users className="w-4 h-4 text-emerald-700" />
                    <span>সিলেট মানব সেবা সংগঠন এর কর্মসূচি ({toBengaliNumber(selectedDayEvents.length)} টি)</span>
                  </div>

                  {selectedDayEvents.map((ev) => (
                    <div key={ev.id} className="p-4 rounded-2xl bg-emerald-50/90 border border-emerald-300 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold bg-emerald-700 text-white px-2 py-0.5 rounded-md">
                          {ev.categoryLabelBn}
                        </span>
                        {ev.time && (
                          <span className="text-xs text-emerald-800 font-bold flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {ev.time}
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm font-black text-slate-900">
                        {ev.title}
                      </h4>

                      <p className="text-xs text-slate-700 leading-relaxed bg-white/80 p-2.5 rounded-xl border border-emerald-100">
                        {ev.description}
                      </p>

                      <div className="grid grid-cols-1 gap-1 text-[11px] text-slate-600 pt-1">
                        {ev.location && (
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                            <span><strong>স্থান:</strong> {ev.location}</span>
                          </div>
                        )}
                        {ev.organizer && (
                          <div className="flex items-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" />
                            <span><strong>দায়িত্বপ্রাপ্ত:</strong> {ev.organizer}</span>
                          </div>
                        )}
                        {ev.targetBeneficiaries && (
                          <div className="flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                            <span><strong>উপকারভোগী:</strong> {ev.targetBeneficiaries}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}

              {/* Public Holidays on this day */}
              {selectedDayInfo.holidays.length > 0 ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-rose-800">
                    <Flame className="w-4 h-4 text-rose-600" />
                    <span>সরকারি ছুটি বিবরণ</span>
                  </div>

                  {selectedDayInfo.holidays.map((h) => (
                    <div key={h.id} className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-rose-900 text-sm">{h.nameBn}</span>
                        <span className="text-[10px] font-bold bg-rose-600 text-white px-2 py-0.5 rounded-md">
                          {h.typeLabelBn}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium">{h.nameEn}</p>
                      <p className="text-xs text-rose-900 leading-relaxed bg-white/80 p-2 rounded-xl border border-rose-100">
                        {h.description}
                      </p>
                    </div>
                  ))}
                </div>
              ) : null}

              {/* If no event and no holiday */}
              {selectedDayEvents.length === 0 && selectedDayInfo.holidays.length === 0 && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-1">
                  <CalendarCheck className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-xs font-bold text-slate-700">
                    {selectedDayInfo.isWeekend ? 'সাপ্তাহিক ছুটির দিন' : 'স্বাভাবিক কর্মদিবস'}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    এই তারিখে সংগঠনের কোনো বিশেষ সভা বা সরকারি ছুটি নির্ধারিত নেই।
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 p-4 border-t border-slate-100 flex items-center justify-between gap-2">
              <button
                onClick={() => {
                  const text = `${orgName} - ${selectedDayInfo.dayOfMonth} ${MONTH_NAMES_BN[selectedDayInfo.date.getMonth()]}, ২০২৬ তারিখে ${selectedDayEvents.length > 0 ? selectedDayEvents[0].title : (selectedDayInfo.holidays[0]?.nameBn || 'স্বাভাবিক দিন')}`;
                  navigator.clipboard?.writeText(text);
                  showToast('তারিখ ও তথ্য কপি করা হয়েছে!');
                }}
                className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>তারিখ কপি করুন</span>
              </button>

              <button
                onClick={() => setSelectedDayInfo(null)}
                className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition cursor-pointer shadow-xs"
              >
                ঠিক আছে
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
