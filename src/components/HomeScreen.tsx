import React, { useState, useEffect, useMemo } from 'react';
import {
  BellRing,
  ChevronRight,
  ChevronLeft,
  Heart,
  Calendar,
  ShieldCheck,
  Sparkles,
  MapPin,
  HeartHandshake,
  BookOpen,
  ExternalLink,
  Copy,
  Check,
  Mail,
  Youtube,
  Facebook,
  User,
  Maximize2,
  X
} from 'lucide-react';
import {
  ActiveScreen,
  OrganizationStats,
  Notice,
  OrganizationProfile,
  BloodDonor,
  HomeSlide,
  HumanitarianActivity,
  OrganizationRule
} from '../types';
import { toBengaliNumber, formatTaka } from '../utils/helpers';

interface HomeScreenProps {
  profile: OrganizationProfile;
  onNavigate: (screen: ActiveScreen) => void;
  stats?: OrganizationStats;
  donors?: BloodDonor[];
  onSelectBloodGroup?: (bg: string) => void;
  latestNotice?: Notice;
  isAdmin: boolean;
  openAdminModal: () => void;
  openEmergencyModal: () => void;
  homeSlides?: HomeSlide[];
  humanitarianActivities?: HumanitarianActivity[];
  organizationRules?: OrganizationRule[];
  onNavigateAdminTab?: (tab: 'homepage') => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  profile,
  onNavigate,
  stats: _stats,
  donors: _donors = [],
  onSelectBloodGroup: _onSelectBloodGroup,
  latestNotice,
  isAdmin,
  openAdminModal,
  openEmergencyModal: _openEmergencyModal,
  homeSlides = [],
  humanitarianActivities = [],
  organizationRules = [],
  onNavigateAdminTab
}) => {
  // Filter active slides
  const activeSlides = useMemo(() => {
    const filtered = homeSlides.filter(s => s.isActive !== false);
    return filtered.length > 0 ? filtered : homeSlides;
  }, [homeSlides]);

  // Photo Slider state
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isSliderPaused, setIsSliderPaused] = useState(false);

  // Auto-play slider every 5 seconds
  useEffect(() => {
    if (activeSlides.length <= 1 || isSliderPaused) return;

    const timer = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % activeSlides.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [activeSlides.length, isSliderPaused]);

  // Selected Activity index for Activity Details Card
  const [selectedActivityIndex, setSelectedActivityIndex] = useState(0);

  // Selected Rule Category Filter
  const [selectedRuleCategory, setSelectedRuleCategory] = useState<string>('সকল');

  // Rule categories list
  const ruleCategories = useMemo(() => {
    const set = new Set<string>();
    organizationRules.forEach(r => {
      if (r.category) set.add(r.category);
    });
    return ['সকল', ...Array.from(set)];
  }, [organizationRules]);

  // Filtered rules
  const filteredRules = useMemo(() => {
    if (selectedRuleCategory === 'সকল') return organizationRules;
    return organizationRules.filter(r => r.category === selectedRuleCategory);
  }, [organizationRules, selectedRuleCategory]);

  // Recipient photo modal state
  const [zoomedPhotoUrl, setZoomedPhotoUrl] = useState<string | null>(null);

  // Toast / Copy notification state
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  const handleCopy = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopiedLink(label);
      setTimeout(() => setCopiedLink(null), 2500);
    });
  };

  const handleAdminEditShortcut = () => {
    if (isAdmin) {
      if (onNavigateAdminTab) {
        onNavigateAdminTab('homepage');
      } else {
        onNavigate('admin');
      }
    } else {
      openAdminModal();
    }
  };

  const currentSlide = activeSlides[currentSlideIndex] || activeSlides[0];

  // Active featured activity or selected activity
  const activeActivity = humanitarianActivities[selectedActivityIndex] || humanitarianActivities[0];

  return (
    <div className="space-y-6 animate-fadeIn pb-14">
      {/* 1. LATEST NOTICE TICKER */}
      {latestNotice && (
        <div
          onClick={() => onNavigate('notices')}
          id="home-notice-ticker"
          className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-xs cursor-pointer hover:bg-red-100/70 transition group"
        >
          <div className="flex items-center gap-3 min-w-0">
            <span className="flex-shrink-0 bg-red-600 text-white text-xs px-2.5 py-1 rounded-lg font-bold flex items-center gap-1.5 animate-pulse">
              <BellRing className="w-3.5 h-3.5" />
              জরুরি নোটিশ
            </span>
            <p className="text-sm font-semibold text-red-950 truncate">
              {latestNotice.title || latestNotice.noticeText}
            </p>
          </div>
          <span className="flex-shrink-0 text-xs text-red-700 font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            <span>দেখুন</span>
            <ChevronRight className="w-4 h-4" />
          </span>
        </div>
      )}

      {/* =========================================================================
          SECTION 1: HUMANITARIAN PHOTO SLIDER / GALLERY (শীর্ষে ফটো স্লাইডার)
      ========================================================================== */}
      <section
        id="humanitarian-photo-slider-section"
        className="relative rounded-3xl overflow-hidden shadow-lg border border-slate-200 bg-slate-950"
        onMouseEnter={() => setIsSliderPaused(true)}
        onMouseLeave={() => setIsSliderPaused(false)}
        onTouchStart={() => setIsSliderPaused(true)}
        onTouchEnd={() => setIsSliderPaused(false)}
      >
        {currentSlide ? (
          <div className="relative h-64 sm:h-80 md:h-96 w-full overflow-hidden">
            {/* Slide Background Image */}
            <img
              src={currentSlide.imageUrl}
              alt={currentSlide.title}
              className="w-full h-full object-cover transition-all duration-700 ease-out"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  'https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=1200&q=80';
              }}
            />

            {/* Gradient Overlays for optimal readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20 pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-transparent to-transparent pointer-events-none" />

            {/* Top Badges & Admin Edit Shortcut */}
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-2">
                <span className="bg-emerald-600/90 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full shadow-md flex items-center gap-1.5 border border-emerald-400/30">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>{currentSlide.category || 'মানবিক কার্যক্রম'}</span>
                </span>
                {currentSlide.location && (
                  <span className="hidden sm:inline-flex bg-black/60 backdrop-blur-md text-white text-xs font-medium px-2.5 py-1 rounded-full border border-white/20 items-center gap-1">
                    <MapPin className="w-3 h-3 text-emerald-400" />
                    <span>{currentSlide.location}</span>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {/* Slide Counter Badge */}
                <span className="bg-black/70 backdrop-blur-md text-white text-xs font-bold px-2.5 py-1 rounded-full border border-white/20">
                  {toBengaliNumber(currentSlideIndex + 1)} / {toBengaliNumber(activeSlides.length)}
                </span>

                {/* Admin Slide Manager Shortcut */}
                <button
                  onClick={handleAdminEditShortcut}
                  className="bg-amber-500/90 hover:bg-amber-400 text-slate-950 text-xs font-black px-3 py-1 rounded-full shadow-md transition flex items-center gap-1 cursor-pointer"
                  title="স্লাইডার ম্যানেজ করুন"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-950" />
                  <span>{isAdmin ? 'স্লাইড এডিট' : 'এডমিন'}</span>
                </button>
              </div>
            </div>

            {/* Bottom Content Overlay */}
            <div className="absolute bottom-4 left-4 right-4 z-10 max-w-3xl">
              <div className="flex items-center gap-2 mb-1.5 text-amber-300 text-xs font-semibold">
                <Calendar className="w-3.5 h-3.5" />
                <span>{currentSlide.date || '২০২৬'}</span>
                {currentSlide.location && (
                  <span className="sm:hidden flex items-center gap-1 text-emerald-300">
                    • <MapPin className="w-3 h-3" /> {currentSlide.location}
                  </span>
                )}
              </div>

              {(currentSlide.title || currentSlide.location) && (
                <h2 className="text-lg sm:text-2xl md:text-3xl font-black text-white leading-tight drop-shadow-md">
                  {currentSlide.title || currentSlide.location}
                </h2>
              )}

              {currentSlide.description && (
                <p className="text-xs sm:text-sm text-slate-200 mt-1.5 line-clamp-2 sm:line-clamp-3 leading-relaxed drop-shadow-sm max-w-2xl">
                  {currentSlide.description}
                </p>
              )}
            </div>

            {/* Prev / Next Navigation Arrows */}
            {activeSlides.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentSlideIndex((prev) => (prev - 1 + activeSlides.length) % activeSlides.length);
                  }}
                  id="home-slider-prev-btn"
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-md border border-white/20 flex items-center justify-center transition shadow-lg z-20 cursor-pointer"
                  title="পূর্ববর্তী ছবি"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentSlideIndex((prev) => (prev + 1) % activeSlides.length);
                  }}
                  id="home-slider-next-btn"
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-md border border-white/20 flex items-center justify-center transition shadow-lg z-20 cursor-pointer"
                  title="পরবর্তী ছবি"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center text-slate-400">
            কোনো স্লাইড ছবি পাওয়া যায়নি
          </div>
        )}

        {/* Thumbnail Gallery Strip Below Main Slide */}
        {activeSlides.length > 1 && (
          <div className="bg-slate-900/95 backdrop-blur-md p-2.5 border-t border-white/10 flex items-center justify-between gap-2 overflow-x-auto scrollbar-none">
            <div className="flex items-center gap-2 overflow-x-auto py-1">
              {activeSlides.map((slide, idx) => (
                <button
                  key={slide.id || idx}
                  onClick={() => setCurrentSlideIndex(idx)}
                  className={`relative flex-shrink-0 w-16 h-11 sm:w-20 sm:h-12 rounded-xl overflow-hidden border-2 transition cursor-pointer ${
                    currentSlideIndex === idx
                      ? 'border-emerald-400 ring-2 ring-emerald-500/50 scale-105'
                      : 'border-white/20 opacity-60 hover:opacity-100'
                  }`}
                  title={slide.title}
                >
                  <img
                    src={slide.imageUrl}
                    alt={slide.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/20" />
                </button>
              ))}
            </div>

            <div className="flex-shrink-0 flex items-center gap-1.5 px-2">
              {activeSlides.map((_, idx) => (
                <span
                  key={idx}
                  onClick={() => setCurrentSlideIndex(idx)}
                  className={`block rounded-full transition-all cursor-pointer ${
                    currentSlideIndex === idx
                      ? 'w-6 h-2 bg-emerald-400'
                      : 'w-2 h-2 bg-white/40 hover:bg-white/80'
                  }`}
                />
              ))}
            </div>
          </div>
        )}
      </section>

      {/* =========================================================================
          SECTION 2: ACTIVITY DETAILS SECTION (ফটো স্লাইডারের ঠিক নিচে)
      ========================================================================== */}
      {activeActivity && (
        <section
          id="humanitarian-activity-details-section"
          className="bg-white rounded-3xl p-5 sm:p-7 border-2 border-teal-200 shadow-md relative overflow-hidden"
        >
          {/* Subtle Top Accent */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-600 via-teal-500 to-amber-500" />

          {/* Activity Section Header */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-xs">
                <HeartHandshake className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-teal-700 uppercase tracking-wider block">
                  সরাসরি মাঠপর্যায়ের ত্রাণ ও সেবা প্রতিবেদন
                </span>
                <h3 className="text-base sm:text-lg font-black text-slate-900">
                  মানবিক কার্যক্রম বিবরণী (Activity Details)
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {humanitarianActivities.length > 1 && (
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                  {humanitarianActivities.map((act, i) => (
                    <button
                      key={act.id}
                      onClick={() => setSelectedActivityIndex(i)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                        selectedActivityIndex === i
                          ? 'bg-teal-700 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      কার্যক্রম {toBengaliNumber(i + 1)}
                    </button>
                  ))}
                </div>
              )}

              <button
                onClick={handleAdminEditShortcut}
                className="text-xs font-bold text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-xl border border-teal-200 flex items-center gap-1 transition cursor-pointer"
                title="কার্যক্রম বিবরণী এডিট করুন"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                <span>{isAdmin ? 'এডিট করুন' : 'ম্যানেজ'}</span>
              </button>
            </div>
          </div>

          {/* Activity Card Body */}
          <div className="mt-5 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left / Center Main Details (Cols 8) */}
            <div className="lg:col-span-8 space-y-4">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="bg-teal-50 text-teal-800 text-xs font-bold px-2.5 py-1 rounded-full border border-teal-200">
                    বাস্তবায়িত কার্যক্রম
                  </span>
                  {activeActivity.date && (
                    <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {activeActivity.date}
                    </span>
                  )}
                  {activeActivity.location && (
                    <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                      {activeActivity.location}
                    </span>
                  )}
                </div>

                <h4 className="text-lg sm:text-xl font-black text-slate-900 leading-snug">
                  {activeActivity.title}
                </h4>

                <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                  {activeActivity.description}
                </p>
              </div>

              {/* Items Given Details (বিতরণকৃত সামগ্রী e.g., চাল, ডাল ইত্যাদি) */}
              {activeActivity.itemsGiven && (
                <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200/80">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-600" />
                    <h5 className="text-xs font-bold text-emerald-950 uppercase tracking-wide">
                      বিতরণকৃত সামগ্রীর তালিকা (Items Given):
                    </h5>
                  </div>
                  <p className="text-xs sm:text-sm text-emerald-900 font-medium leading-relaxed">
                    {activeActivity.itemsGiven}
                  </p>
                </div>
              )}

              {/* Financial & Volunteer Responsibility Box */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* Cost / Amount Spent */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    মোট ব্যয় / খরচ (Cost / Spent)
                  </span>
                  <div className="text-xl sm:text-2xl font-black text-teal-800">
                    {formatTaka(activeActivity.cost)}
                  </div>
                  <span className="text-[10px] text-teal-700 font-semibold mt-0.5 block">
                    সংগঠনের সাধারণ ও ত্রাণ ফান্ড থেকে পরিশোধিত
                  </span>
                </div>

                {/* Handled / Given By */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    বিতরণে / দায়িত্বে নিয়োজিত (Handled By)
                  </span>
                  <div className="text-sm font-bold text-slate-900 mt-1">
                    {activeActivity.handledBy}
                  </div>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    সিলেট মানব সেবা সংগঠন ভলান্টিয়ার টিম
                  </span>
                </div>
              </div>
            </div>

            {/* Right Side: Recipient Portrait Photo & Beneficiary Profile (Cols 4) */}
            <div className="lg:col-span-4 bg-gradient-to-b from-slate-50 to-teal-50/40 rounded-3xl p-5 sm:p-6 border border-slate-200 flex flex-col items-center text-center shadow-xs">
              <div className="w-full flex items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-200/80">
                <span className="text-xs font-bold text-teal-800 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-teal-600" />
                  <span>উপকারভোগীর ছবি</span>
                </span>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/90 border border-emerald-200 px-2 py-0.5 rounded-md">
                  যাচাইকৃত
                </span>
              </div>

              {/* Recipient Photo (Prominent rectangular/square portrait with clean balanced edges) */}
              <div className="w-full relative group">
                <div className="w-full aspect-square max-w-[280px] mx-auto rounded-2xl overflow-hidden border-2 border-teal-200/80 shadow-md bg-slate-100 relative">
                  {activeActivity.recipientPhotoUrl ? (
                    <img
                      src={activeActivity.recipientPhotoUrl}
                      alt={activeActivity.recipientName || 'উপকারভোগী'}
                      className="w-full h-full object-cover group-hover:scale-103 transition duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-4">
                      <User className="w-16 h-16 text-slate-300 stroke-1" />
                      <span className="text-xs font-medium mt-2 text-slate-400">ছবি সংরক্ষিত</span>
                    </div>
                  )}

                  {activeActivity.recipientPhotoUrl && (
                    <button
                      onClick={() => setZoomedPhotoUrl(activeActivity.recipientPhotoUrl || null)}
                      className="absolute bottom-2.5 right-2.5 px-2.5 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-900 text-white backdrop-blur-md flex items-center gap-1.5 text-xs font-bold shadow-lg transition active:scale-95 cursor-pointer"
                      title="ছবি বড় করে দেখুন"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span>বড় করে দেখুন</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-4 w-full space-y-1.5">
                <h5 className="font-bold text-slate-900 text-base sm:text-lg">
                  {activeActivity.recipientName || 'অসহায় উপকারভোগী'}
                </h5>
                <span className="text-xs text-slate-500 block">
                  {activeActivity.location ? `স্থান: ${activeActivity.location}` : 'যথাযথ যাচাইকৃত সুবিধাপ্রাপ্ত পরিবার'}
                </span>
                <div className="pt-1">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-100/90 border border-emerald-200 px-3 py-1 rounded-xl">
                    <Heart className="w-3.5 h-3.5 text-emerald-600 fill-current" />
                    সহায়তা সফলভাবে পৌঁছে দেওয়া হয়েছে
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Recipient Photo Zoom Modal */}

      {/* =========================================================================
          SECTION 4: ORGANIZATION RULES & GUIDELINES (সংগঠনের নিয়মাবলি ও নীতিমালা)
      ========================================================================== */}
      <section
        id="organization-rules-guidelines-section"
        className="bg-white rounded-3xl p-5 sm:p-7 border-2 border-amber-200 shadow-md space-y-5"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wide block">
                শৃঙ্খলা ও মানবিক আদর্শ
              </span>
              <h3 className="text-base sm:text-lg font-black text-slate-900">
                সংগঠনের নিয়মাবলি ও নীতিমালা (Rules & Guidelines)
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 font-semibold">
              মোট {toBengaliNumber(organizationRules.length)}টি পয়েন্ট
            </span>
            <button
              onClick={handleAdminEditShortcut}
              className="text-xs font-bold text-amber-800 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-xl border border-amber-300 flex items-center gap-1 transition cursor-pointer"
              title="নীতিমালা এডিট করুন"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
              <span>{isAdmin ? 'নীতিমালা এডিট' : 'এডমিন'}</span>
            </button>
          </div>
        </div>

        {/* Category Filter Chips */}
        {ruleCategories.length > 2 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {ruleCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedRuleCategory(cat)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  selectedRuleCategory === cat
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Formatted Points List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredRules.map((rule, idx) => (
            <div
              key={rule.id || idx}
              className="bg-amber-50/40 hover:bg-amber-50/80 border border-amber-200/80 rounded-2xl p-4 transition shadow-2xs hover:shadow-xs flex items-start gap-3.5 group"
            >
              {/* Point Number Badge */}
              <div className="w-8 h-8 rounded-full bg-amber-500 text-slate-950 font-black text-sm flex items-center justify-center flex-shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                {toBengaliNumber(rule.pointNumber || idx + 1)}
              </div>

              <div className="space-y-1 flex-1">
                {rule.category && (
                  <span className="inline-block bg-white text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-md border border-amber-200">
                    {rule.category}
                  </span>
                )}
                <p className="text-xs sm:text-sm font-medium text-slate-800 leading-relaxed">
                  {rule.ruleText}
                </p>
              </div>
            </div>
          ))}
        </div>

        {filteredRules.length === 0 && (
          <div className="p-6 text-center text-slate-500 text-xs bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            এই ক্যাটাগরিতে কোনো নীতিমালা নেই।
          </div>
        )}
      </section>

      {/* =========================================================================
          SECTION 5: OFFICIAL FOOTER SECTION (At the very bottom of the Home Page)
      ========================================================================== */}
      <footer
        id="home-official-footer-section"
        className="bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 space-y-6"
      >
        {/* Header with Organization Title and Edit Shortcut */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-slate-800">
          <div>
            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">
              অফিসিয়াল যোগাযোগ ও ডিজিটাল সংযোগ
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-white mt-0.5">
              {profile.name}
            </h3>
            <p className="text-xs text-slate-300 mt-1">
              মানবতার কল্যাণে নিবেদিত প্রাণ • সরকার অনুমোদিত রেজি: নং: {profile.regNumber || '২০২২/০৮'}
            </p>
          </div>

          <button
            onClick={handleAdminEditShortcut}
            className="self-start sm:self-auto px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 text-xs font-bold border border-emerald-500/30 flex items-center gap-1.5 transition cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>{isAdmin ? 'সোশ্যাল লিংক পরিবর্তন' : 'এডমিন নিয়ন্ত্রণ'}</span>
          </button>
        </div>

        {/* 3 Main Official Dynamic Contact Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 1. Official Facebook Page / Group */}
          <div className="bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-4 transition group">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md">
                  <Facebook className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold text-blue-300 bg-blue-950/80 px-2 py-0.5 rounded-full border border-blue-800">
                  ফেসবুক পেজ / গ্রুপ
                </span>
              </div>

              <div>
                <h4 className="font-bold text-white text-sm">
                  অফিসিয়াল ফেসবুক পেজ
                </h4>
                <p className="text-xs text-slate-300 mt-0.5 line-clamp-1 font-mono">
                  {profile.facebookUrl || 'https://facebook.com/sylhetmanabsevasangathan'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <a
                href={profile.facebookUrl || 'https://facebook.com'}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
              >
                <span>ভিজিট করুন</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button
                onClick={() => handleCopy(profile.facebookUrl || '', 'facebook')}
                className="p-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 transition cursor-pointer"
                title="লিংক কপি করুন"
              >
                {copiedLink === 'facebook' ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* 2. Official YouTube Channel */}
          <div className="bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-4 transition group">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center shadow-md">
                  <Youtube className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold text-red-300 bg-red-950/80 px-2 py-0.5 rounded-full border border-red-800">
                  ইউটিউব চ্যানেল
                </span>
              </div>

              <div>
                <h4 className="font-bold text-white text-sm">
                  অফিসিয়াল ইউটিউব চ্যানেল
                </h4>
                <p className="text-xs text-slate-300 mt-0.5 line-clamp-1 font-mono">
                  {profile.youtubeUrl || 'https://youtube.com/@sylhetmanabseva'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <a
                href={profile.youtubeUrl || 'https://youtube.com'}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2 px-3 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
              >
                <span>ভিডিও দেখুন</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button
                onClick={() => handleCopy(profile.youtubeUrl || '', 'youtube')}
                className="p-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 transition cursor-pointer"
                title="চ্যানেল লিংক কপি করুন"
              >
                {copiedLink === 'youtube' ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* 3. Official Email Address */}
          <div className="bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-4 transition group">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md">
                  <Mail className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-800">
                  ইমেইল যোগাযোগ
                </span>
              </div>

              <div>
                <h4 className="font-bold text-white text-sm">
                  অফিসিয়াল ইমেইল এড্রেস
                </h4>
                <p className="text-xs text-slate-300 mt-0.5 line-clamp-1 font-mono">
                  {profile.email || 'sylhetmanabseva@gmail.com'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <a
                href={`mailto:${profile.email || 'sylhetmanabseva@gmail.com'}`}
                className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
              >
                <span>ইমেইল পাঠান</span>
                <Mail className="w-3.5 h-3.5" />
              </a>
              <button
                onClick={() => handleCopy(profile.email || 'sylhetmanabseva@gmail.com', 'email')}
                className="p-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 transition cursor-pointer"
                title="ইমেইল এড্রেস কপি করুন"
              >
                {copiedLink === 'email' ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Organization Details & Copyright */}
        <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1">
            <span>স্থায়ী ঠিকানা: <strong className="text-slate-200 font-medium">{profile.address}</strong></span>
            <span>জরুরি হটলাইন: <strong className="text-amber-300 font-mono font-bold">{profile.hotline || '01886122678'}</strong></span>
            <span>২৪/৭ রক্ত যোগাযোগ: <strong className="text-rose-400 font-mono font-bold">{profile.emergencyContact || '01711000000'}</strong></span>
          </div>

          <div className="text-center sm:text-right text-[11px] text-slate-500">
            © ২০২৬ {profile.name} • সর্বস্বত্ব সংরক্ষিত
          </div>
        </div>
      </footer>

      {/* Recipient Portrait Zoom Modal */}
      {zoomedPhotoUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setZoomedPhotoUrl(null)}
        >
          <div className="relative max-w-md w-full bg-white rounded-3xl p-4 overflow-hidden shadow-2xl space-y-3" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="font-bold text-slate-900 text-sm">
                উপকারভোগীর ছবি
              </h4>
              <button
                onClick={() => setZoomedPhotoUrl(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="rounded-2xl overflow-hidden max-h-80 bg-slate-900">
              <img
                src={zoomedPhotoUrl}
                alt="উপকারভোগী ছবি"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
