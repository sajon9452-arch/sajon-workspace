import React, { useState, useEffect, useRef } from 'react';
import { 
  Heart, 
  MapPin, 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  UserCheck, 
  Copy, 
  Check, 
  Sparkles, 
  ShieldCheck, 
  Search, 
  HeartHandshake, 
  Gift, 
  PlusCircle,
  X,
  Maximize2,
  BookOpen,
  Share2,
  Mail,
  Phone,
  ExternalLink,
  Globe,
  Youtube,
  Facebook
} from 'lucide-react';
import { 
  OrganizationProfile, 
  HomeSlide, 
  AidDonationRecord, 
  ExtraContributionRecord,
  OrganizationRule
} from '../types';
import { toBengaliNumber, formatBengaliCurrency, sanitizePhone } from '../utils/helpers';

interface HomeScreenProps {
  profile: OrganizationProfile;
  homeSlides: HomeSlide[];
  aidDonations: AidDonationRecord[];
  extraContributions: ExtraContributionRecord[];
  organizationRules?: OrganizationRule[];
  isAdmin: boolean;
  onNavigateToAdminTab?: (tab: 'slides' | 'donations' | 'contributions' | 'rules' | 'profile') => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  profile,
  homeSlides = [],
  aidDonations = [],
  extraContributions = [],
  organizationRules = [],
  isAdmin,
  onNavigateToAdminTab
}) => {
  // Slider State
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // Search/Filter states
  const [donationSearch, setDonationSearch] = useState('');
  const [contributionSearch, setContributionSearch] = useState('');

  // Copy feedback state
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Lightbox / Image Zoom Modal
  const [zoomedImage, setZoomedImage] = useState<{ url: string; title: string; subtitle?: string } | null>(null);

  // Filter only active slides
  const activeSlidesList = homeSlides.filter(s => s.isActive !== false);

  // Auto rotate slides every 5 seconds (pause on hover/interaction)
  useEffect(() => {
    if (activeSlidesList.length <= 1 || isPaused) return;
    const interval = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % activeSlidesList.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [activeSlidesList.length, isPaused]);

  // Keep current index in bound if list changes
  useEffect(() => {
    if (currentSlideIndex >= activeSlidesList.length && activeSlidesList.length > 0) {
      setCurrentSlideIndex(0);
    }
  }, [activeSlidesList.length, currentSlideIndex]);

  // Touch Swipe Handlers for mobile users
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 50;

    if (distance > minSwipeDistance) {
      handleNextSlide();
    } else if (distance < -minSwipeDistance) {
      handlePrevSlide();
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  const handleNextSlide = () => {
    if (activeSlidesList.length <= 1) return;
    setCurrentSlideIndex((prev) => (prev + 1) % activeSlidesList.length);
  };

  const handlePrevSlide = () => {
    if (activeSlidesList.length <= 1) return;
    setCurrentSlideIndex((prev) => (prev - 1 + activeSlidesList.length) % activeSlidesList.length);
  };

  // 1-Click Copy Number Helper
  const handleCopy = (text: string, key: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey(null);
    }, 2500);
  };

  // Filtered Aid Donations
  const filteredDonations = aidDonations.filter(item => {
    if (!donationSearch.trim()) return true;
    const q = donationSearch.toLowerCase();
    return (
      (item.recipientName || '').toLowerCase().includes(q) ||
      (item.address || '').toLowerCase().includes(q) ||
      (item.providerReference || '').toLowerCase().includes(q) ||
      (item.description || '').toLowerCase().includes(q)
    );
  });

  // Filtered Extra Contributions
  const filteredContributions = extraContributions.filter(item => {
    if (!contributionSearch.trim()) return true;
    const q = contributionSearch.toLowerCase();
    return (
      (item.donorName || '').toLowerCase().includes(q) ||
      (item.address || '').toLowerCase().includes(q) ||
      (item.providerReference || '').toLowerCase().includes(q) ||
      (item.description || '').toLowerCase().includes(q)
    );
  });

  // Calculate totals
  const totalAidDisbursed = aidDonations.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const totalExtraReceived = extraContributions.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  // Active Organization Rules (sorted by pointNumber)
  const activeRules = [...organizationRules]
    .filter(r => r.isActive !== false)
    .sort((a, b) => (a.pointNumber || 0) - (b.pointNumber || 0));

  const currentSlide = activeSlidesList[currentSlideIndex] || activeSlidesList[0];

  return (
    <div className="space-y-8 pb-24 sm:pb-12">
      {/* =========================================================================
          SECTION 1: Clean Image Slider (Organization Group Photos Only)
          - No text overlay, titles, descriptions, location tags, or badges on top of photos
          - Full, clean view of organization group photos & banners
          ========================================================================= */}
      <section className="relative">
        {activeSlidesList.length > 0 && currentSlide ? (
          <div 
            className="space-y-3"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Main Carousel Frame - Clean, large, strictly without text overlays */}
            <div className="relative rounded-3xl overflow-hidden bg-slate-900 shadow-xl border border-slate-200/80 group select-none">
              <div 
                className="relative h-64 sm:h-80 md:h-[420px] lg:h-[480px] w-full overflow-hidden cursor-pointer"
                onClick={() => currentSlide.imageUrl && setZoomedImage({ 
                  url: currentSlide.imageUrl, 
                  title: 'সিলেট মানবসেবা সংগঠন', 
                  subtitle: 'গ্রুপ ফটো ও কার্যক্রম গ্যালারি' 
                })}
                title="ছবি বড় করে দেখতে ক্লিক করুন"
              >
                {currentSlide.imageUrl ? (
                  <img
                    src={currentSlide.imageUrl}
                    alt="সিলেট মানবসেবা সংগঠন"
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-tr from-emerald-900 via-slate-900 to-teal-900 flex flex-col items-center justify-center p-6 text-center">
                    <HeartHandshake className="w-20 h-20 text-emerald-400/50 mb-2" />
                    <span className="text-sm font-bold text-emerald-200">সিলেট মানবসেবা সংগঠন</span>
                  </div>
                )}

                {/* Subtle zoom hint on hover */}
                <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 backdrop-blur-md text-white text-[11px] font-semibold px-2.5 py-1 rounded-xl flex items-center gap-1 border border-white/20 pointer-events-none">
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>বড় করে দেখুন</span>
                </div>

                {/* Previous & Next Navigation Buttons */}
                {activeSlidesList.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePrevSlide();
                      }}
                      className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 sm:p-3 rounded-full bg-black/40 hover:bg-black/75 text-white backdrop-blur-md transition-all cursor-pointer border border-white/20 shadow-lg active:scale-90 z-20"
                      aria-label="পূর্ববর্তী ছবি"
                    >
                      <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNextSlide();
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 sm:p-3 rounded-full bg-black/40 hover:bg-black/75 text-white backdrop-blur-md transition-all cursor-pointer border border-white/20 shadow-lg active:scale-90 z-20"
                      aria-label="পরবর্তী ছবি"
                    >
                      <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Slide Navigation Controls & Admin Shortcut Below Photo */}
            <div className="flex items-center justify-between px-2 pt-1 flex-wrap gap-2">
              {/* Slide Counter / Indicators */}
              <div className="flex items-center gap-2">
                {activeSlidesList.length > 1 && (
                  <div className="flex items-center gap-1.5">
                    {activeSlidesList.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentSlideIndex(idx)}
                        className={`h-2 rounded-full transition-all cursor-pointer ${
                          currentSlideIndex === idx
                            ? 'w-8 bg-emerald-600 shadow-sm'
                            : 'w-2 bg-slate-300 hover:bg-slate-400'
                        }`}
                        aria-label={`স্লাইড ${idx + 1}`}
                      />
                    ))}
                  </div>
                )}
                <span className="text-[11px] font-bold text-slate-500 font-mono ml-1">
                  ({toBengaliNumber(currentSlideIndex + 1)}/{toBengaliNumber(activeSlidesList.length)})
                </span>
              </div>

              {/* Admin Manage Slides Quick Action */}
              {isAdmin && onNavigateToAdminTab && (
                <button
                  onClick={() => onNavigateToAdminTab('slides')}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-bold transition border border-amber-300 shadow-2xs cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-800" />
                  <span>স্লাইডার ফটো পরিচালনা</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Empty Slider State - Displayed only if admin permanently deleted all slides */
          <div className="rounded-3xl bg-slate-100 p-8 sm:p-12 text-center border-2 border-dashed border-slate-300 space-y-3">
            <HeartHandshake className="w-12 h-12 text-slate-400 mx-auto" />
            <h3 className="text-base font-bold text-slate-700">বর্তমানে কোনো স্লাইডার ফটো যুক্ত করা নেই</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              অ্যাডমিন প্যানেল থেকে সংগঠনের গ্রুপ ফটো বা ব্যানার যুক্ত করলে এখানে সুন্দরভাবে প্রদর্শিত হবে।
            </p>
            {isAdmin && onNavigateToAdminTab && (
              <button
                onClick={() => onNavigateToAdminTab('slides')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow transition cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>নতুন ফটো আপলোড করুন</span>
              </button>
            )}
          </div>
        )}
      </section>

      {/* Organization Introduction / Profile Description (Strictly dynamic) */}
      {profile?.description && profile.description.trim() && (
        <section className="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 rounded-3xl p-5 sm:p-6 text-white border border-emerald-800/40 shadow-lg relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-44 h-44 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-start gap-3.5 relative z-10">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0 mt-0.5">
              <Sparkles className="w-5 h-5 text-emerald-300" />
            </div>
            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  <span>{profile.name || 'সিলেট মানবসেবা সংগঠন'} পরিচিতি ও লক্ষ্য</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    আমাদের অঙ্গীকার
                  </span>
                </h3>
                {isAdmin && onNavigateToAdminTab && (
                  <button
                    onClick={() => onNavigateToAdminTab('profile')}
                    className="text-[11px] font-bold text-amber-300 hover:text-amber-200 underline cursor-pointer"
                  >
                    সম্পাদন করুন
                  </button>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-line">
                {profile.description}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* =========================================================================
          SECTION 2: Donation & Aid Recipient Directory (Refined Layout)
          - Significantly larger recipient photo at the top
          - All details strictly underneath the photo
          - Dynamic multiple records support
          ========================================================================= */}
      {aidDonations && aidDonations.length > 0 && (
        <section className="space-y-5">
          {/* Section Header */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="p-2.5 rounded-2xl bg-emerald-100 text-emerald-800">
                <Heart className="w-5 h-5 text-emerald-700" />
              </div>
              <h3 className="text-lg sm:text-xl font-black text-slate-900">
                অনুদান ও সাহায্য প্রাপ্তদের তালিকা
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800">
                {toBengaliNumber(aidDonations.length)}টি রেকর্ড
              </span>
            </div>
            <p className="text-xs text-slate-500">
              সংগঠন কর্তৃক বিতরণকৃত জরুরি মানবিক সহায়তা, অনুদান এবং সাহায্যপ্রাপ্তদের বিস্তারিত তথ্য
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap w-full sm:w-auto justify-start sm:justify-end">
            <div className="bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 rounded-2xl text-xs">
              <span className="text-slate-600 font-medium">মোট অনুদান: </span>
              <strong className="text-emerald-700 font-black">{formatBengaliCurrency(totalAidDisbursed)}</strong>
            </div>

            {isAdmin && onNavigateToAdminTab && (
              <button
                onClick={() => onNavigateToAdminTab('donations')}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>নতুন এন্ট্রি যোগ করুন</span>
              </button>
            )}
          </div>
        </div>

        {/* Search Bar for Aid Recipients */}
        {aidDonations.length > 2 && (
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={donationSearch}
              onChange={(e) => setDonationSearch(e.target.value)}
              placeholder="নাম, ঠিকানা বা রেফারেন্স দিয়ে সাহায্যপ্রাপ্তদের খুঁজুন..."
              className="w-full pl-9 pr-4 py-2.5 text-xs sm:text-sm rounded-2xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-2xs"
            />
          </div>
        )}

        {/* Multiple Records Cards Grid */}
        {filteredDonations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-5 sm:gap-6">
            {filteredDonations.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-3xl overflow-hidden border border-slate-200/90 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col justify-between group"
              >
                {/* 1. Large Recipient Photo at Top */}
                <div 
                  className="relative w-full h-56 sm:h-64 md:h-72 bg-slate-100 overflow-hidden cursor-pointer"
                  onClick={() => item.photoUrl && setZoomedImage({
                    url: item.photoUrl,
                    title: item.recipientName,
                    subtitle: `ঠিকানা: ${item.address} • অনুদান: ${formatBengaliCurrency(item.amount)}`
                  })}
                  title="ছবি বড় করে দেখতে ক্লিক করুন"
                >
                  {item.photoUrl ? (
                    <img
                      src={item.photoUrl}
                      alt={item.recipientName}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-tr from-emerald-50 to-teal-100/70 text-emerald-800 p-4">
                      <Heart className="w-14 h-14 text-emerald-500 mb-2" />
                      <span className="text-xs font-bold text-emerald-900">সাহায্যপ্রাপ্তের ছবি নেই</span>
                    </div>
                  )}

                  {/* Badges on Top Corners */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    <span className="px-3 py-1 rounded-xl text-[11px] font-black bg-emerald-700/90 backdrop-blur-md text-white shadow-md">
                      সহায়তাপ্রাপ্ত
                    </span>
                  </div>

                  <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/60 backdrop-blur-md text-white px-2.5 py-1 rounded-xl text-[11px] font-semibold border border-white/10 shadow-md">
                    <Calendar className="w-3 h-3 text-amber-300" />
                    <span>{item.date}</span>
                  </div>

                  {item.photoUrl && (
                    <div className="absolute bottom-2.5 right-2.5 bg-black/50 hover:bg-black/75 backdrop-blur-md text-white p-1.5 rounded-xl border border-white/20 transition opacity-80 group-hover:opacity-100">
                      <Maximize2 className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>

                {/* 2. All Relevant Details Strictly Underneath the Large Photo */}
                <div className="p-5 sm:p-6 space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-3">
                    {/* Name & Amount Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 block">সাহায্যপ্রাপ্তের নাম</span>
                        <h4 className="text-lg sm:text-xl font-black text-slate-900 leading-snug">
                          {item.recipientName}
                        </h4>
                      </div>

                      {/* Donated Amount Highlight */}
                      <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-950 font-black text-base shrink-0 self-start sm:self-auto">
                        <span className="text-[11px] text-emerald-700 font-bold">বিতরণকৃত অনুদান:</span>
                        <span>{formatBengaliCurrency(item.amount)}</span>
                      </div>
                    </div>

                    {/* Address (ঠিকানা) */}
                    <div className="flex items-start gap-2 text-xs sm:text-sm text-slate-700 bg-slate-50 p-2.5 rounded-2xl border border-slate-200/70">
                      <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 block">ঠিকানা</span>
                        <span className="font-semibold text-slate-800">{item.address}</span>
                      </div>
                    </div>

                    {/* Donor / Provider Reference (কার মাধ্যমে দেওয়া হয়েছে) */}
                    <div className="flex items-start gap-2 text-xs sm:text-sm text-slate-700 bg-emerald-50/60 p-2.5 rounded-2xl border border-emerald-200/80">
                      <UserCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[10px] font-bold text-emerald-700 block">কার মাধ্যমে দেওয়া হয়েছে</span>
                        <span className="font-bold text-emerald-950">{item.providerReference}</span>
                      </div>
                    </div>

                    {/* Detailed Description / Notes (বিস্তারিত বিবরণ) */}
                    {item.description && (
                      <div className="space-y-1">
                        <span className="text-[11px] font-bold text-slate-500">বিস্তারিত বিবরণ:</span>
                        <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
                          {item.description}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Optional Personal Payment Numbers (বিকাশ / নগদ / রকেট) */}
                  {(item.bkashNumber || item.nagadNumber || item.rocketNumber) && (
                    <div className="pt-2 border-t border-slate-100 space-y-2">
                      <div className="flex items-center gap-1.5 text-amber-900 text-xs font-black">
                        <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>ব্যক্তিগত সাহায্য পাঠানোর নম্বর (ঐচ্ছিক সরাসরি অনুদান):</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {item.bkashNumber && (
                          <div className="flex items-center justify-between bg-pink-50/60 px-3 py-2 rounded-2xl border border-pink-200 shadow-2xs">
                            <div className="flex items-center gap-1.5 truncate">
                              <span className="px-2 py-0.5 rounded-lg bg-pink-600 text-white text-[10px] font-black">বিকাশ</span>
                              <span className="font-mono text-slate-900 font-bold text-xs truncate">{item.bkashNumber}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleCopy(item.bkashNumber!, `aid-b-${item.id}`)}
                              className="p-1 rounded-lg text-pink-700 hover:bg-pink-100 transition cursor-pointer flex items-center gap-0.5 text-[10px] font-bold"
                              title="বিকাশ নম্বর কপি করুন"
                            >
                              {copiedKey === `aid-b-${item.id}` ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  <span className="text-emerald-700">কপি হয়েছে</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>কপি</span>
                                </>
                              )}
                            </button>
                          </div>
                        )}

                        {item.nagadNumber && (
                          <div className="flex items-center justify-between bg-orange-50/60 px-3 py-2 rounded-2xl border border-orange-200 shadow-2xs">
                            <div className="flex items-center gap-1.5 truncate">
                              <span className="px-2 py-0.5 rounded-lg bg-orange-600 text-white text-[10px] font-black">নগদ</span>
                              <span className="font-mono text-slate-900 font-bold text-xs truncate">{item.nagadNumber}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleCopy(item.nagadNumber!, `aid-n-${item.id}`)}
                              className="p-1 rounded-lg text-orange-700 hover:bg-orange-100 transition cursor-pointer flex items-center gap-0.5 text-[10px] font-bold"
                              title="নগদ নম্বর কপি করুন"
                            >
                              {copiedKey === `aid-n-${item.id}` ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  <span className="text-emerald-700">কপি হয়েছে</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>কপি</span>
                                </>
                              )}
                            </button>
                          </div>
                        )}

                        {item.rocketNumber && (
                          <div className="flex items-center justify-between bg-purple-50/60 px-3 py-2 rounded-2xl border border-purple-200 shadow-2xs col-span-full">
                            <div className="flex items-center gap-1.5 truncate">
                              <span className="px-2 py-0.5 rounded-lg bg-purple-600 text-white text-[10px] font-black">রকেট</span>
                              <span className="font-mono text-slate-900 font-bold text-xs truncate">{item.rocketNumber}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleCopy(item.rocketNumber!, `aid-r-${item.id}`)}
                              className="p-1 rounded-lg text-purple-700 hover:bg-purple-100 transition cursor-pointer flex items-center gap-0.5 text-[10px] font-bold"
                              title="রকেট নম্বর কপি করুন"
                            >
                              {copiedKey === `aid-r-${item.id}` ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  <span className="text-emerald-700">কপি হয়েছে</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>কপি</span>
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 rounded-3xl bg-white border border-slate-200 text-center space-y-2">
            <Heart className="w-10 h-10 text-slate-300 mx-auto" />
            <h4 className="text-sm font-bold text-slate-700">কোনো অনুদান রেকর্ড মেলেনি</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              আপনার অনুসন্ধান অনুযায়ী কোনো রেকর্ড নেই।
            </p>
          </div>
        )}
      </section>
      )}

      {/* =========================================================================
          SECTION 3: Extra Contribution / Additional Fund Section
          - Refined Card Layout strictly matching Section 2:
            • Large photo at top
            • All details strictly underneath the photo
            • Multiple records dynamically supported
            • Personal payment numbers removed (exclusive for donor records)
          ========================================================================= */}
      {extraContributions && extraContributions.length > 0 && (
        <section className="space-y-5">
        {/* Section Header */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="p-2.5 rounded-2xl bg-amber-100 text-amber-800">
                <Gift className="w-5 h-5 text-amber-700" />
              </div>
              <h3 className="text-lg sm:text-xl font-black text-slate-900">
                অতিরিক্ত অনুদান ও শুভাকাঙ্ক্ষী তহবিল
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-800">
                {toBengaliNumber(extraContributions.length)}টি অবদান
              </span>
            </div>
            <p className="text-xs text-slate-500">
              সংগঠনের সাধারণ ও বিশেষ তহবিলে শুভাকাঙ্ক্ষী, প্রবাসী ভাই ও দাতাদের পক্ষ থেকে প্রাপ্ত অতিরিক্ত অনুদান
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap w-full sm:w-auto justify-start sm:justify-end">
            <div className="bg-amber-50 border border-amber-200 px-3.5 py-1.5 rounded-2xl text-xs">
              <span className="text-slate-600 font-medium">অতিরিক্ত মোট জমা: </span>
              <strong className="text-amber-800 font-black">{formatBengaliCurrency(totalExtraReceived)}</strong>
            </div>

            {isAdmin && onNavigateToAdminTab && (
              <button
                onClick={() => onNavigateToAdminTab('contributions')}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>নতুন অবদান এন্ট্রি</span>
              </button>
            )}
          </div>
        </div>

        {/* Search Bar for Extra Contributions */}
        {extraContributions.length > 2 && (
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={contributionSearch}
              onChange={(e) => setContributionSearch(e.target.value)}
              placeholder="দাতার নাম, এলাকা বা রেফারেন্স দিয়ে খুঁজুন..."
              className="w-full pl-9 pr-4 py-2.5 text-xs sm:text-sm rounded-2xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 shadow-2xs"
            />
          </div>
        )}

        {/* Multiple Contribution Cards Grid */}
        {filteredContributions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-5 sm:gap-6">
            {filteredContributions.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-3xl overflow-hidden border border-slate-200/90 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col justify-between group"
              >
                {/* 1. Large Contributor / Event Photo at Top */}
                <div 
                  className="relative w-full h-56 sm:h-64 md:h-72 bg-slate-100 overflow-hidden cursor-pointer"
                  onClick={() => item.photoUrl && setZoomedImage({
                    url: item.photoUrl,
                    title: item.donorName,
                    subtitle: `ঠিকানা: ${item.address || 'উপলব্ধ নয়'} • অতিরিক্ত অনুদান: ${formatBengaliCurrency(item.amount)}`
                  })}
                  title="ছবি বড় করে দেখতে ক্লিক করুন"
                >
                  {item.photoUrl ? (
                    <img
                      src={item.photoUrl}
                      alt={item.donorName}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-tr from-amber-50 to-orange-100/70 text-amber-800 p-4">
                      <Gift className="w-14 h-14 text-amber-500 mb-2" />
                      <span className="text-xs font-bold text-amber-900">শুভাকাঙ্ক্ষীর ছবি</span>
                    </div>
                  )}

                  {/* Badges on Top Corners */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    <span className="px-3 py-1 rounded-xl text-[11px] font-black bg-amber-600/90 backdrop-blur-md text-white shadow-md">
                      বিশেষ অনুদান
                    </span>
                  </div>

                  <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/60 backdrop-blur-md text-white px-2.5 py-1 rounded-xl text-[11px] font-semibold border border-white/10 shadow-md">
                    <Calendar className="w-3 h-3 text-amber-300" />
                    <span>{item.date}</span>
                  </div>

                  {item.photoUrl && (
                    <div className="absolute bottom-2.5 right-2.5 bg-black/50 hover:bg-black/75 backdrop-blur-md text-white p-1.5 rounded-xl border border-white/20 transition opacity-80 group-hover:opacity-100">
                      <Maximize2 className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>

                {/* 2. All Relevant Details Strictly Underneath the Large Photo */}
                <div className="p-5 sm:p-6 space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-3">
                    {/* Name & Amount Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 block">শুভাকাঙ্ক্ষী / দাতার নাম</span>
                        <h4 className="text-lg sm:text-xl font-black text-slate-900 leading-snug">
                          {item.donorName}
                        </h4>
                      </div>

                      {/* Contributed Amount Highlight */}
                      <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 font-black text-base shrink-0 self-start sm:self-auto">
                        <span className="text-[11px] text-amber-700 font-bold">প্রাপ্ত অনুদান:</span>
                        <span>{formatBengaliCurrency(item.amount)}</span>
                      </div>
                    </div>

                    {/* Address (ঠিকানা / এলাকা) */}
                    {item.address && (
                      <div className="flex items-start gap-2 text-xs sm:text-sm text-slate-700 bg-slate-50 p-2.5 rounded-2xl border border-slate-200/70">
                        <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 block">ঠিকানা / এলাকা</span>
                          <span className="font-semibold text-slate-800">{item.address}</span>
                        </div>
                      </div>
                    )}

                    {/* Provider / Reference (কার মাধ্যমে প্রাপ্ত / মাধ্যম) */}
                    <div className="flex items-start gap-2 text-xs sm:text-sm text-slate-700 bg-amber-50/60 p-2.5 rounded-2xl border border-amber-200/80">
                      <UserCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[10px] font-bold text-amber-700 block">কার মাধ্যমে প্রাপ্ত / মাধ্যম</span>
                        <span className="font-bold text-amber-950">{item.providerReference}</span>
                      </div>
                    </div>

                    {/* Detailed Description / Purpose (উদ্দেশ্য ও বিস্তারিত বিবরণ) */}
                    {item.description && (
                      <div className="space-y-1">
                        <span className="text-[11px] font-bold text-slate-500">উদ্দেশ্য / বিস্তারিত বিবরণ:</span>
                        <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
                          {item.description}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 rounded-3xl bg-white border border-slate-200 text-center space-y-2">
            <Gift className="w-10 h-10 text-slate-300 mx-auto" />
            <h4 className="text-sm font-bold text-slate-700">কোনো অতিরিক্ত অনুদান রেকর্ড মেলেনি</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              আপনার অনুসন্ধান অনুযায়ী কোনো রেকর্ড নেই।
            </p>
          </div>
        )}
      </section>
      )}

      {/* =========================================================================
          SECTION 4: Organization Rules & Guidelines (Strict Conditional Visibility)
          - Completely hidden if admin has added 0 rules
          - Only displayed when rules are explicitly added
          ========================================================================= */}
      {activeRules && activeRules.length > 0 && (
        <section className="space-y-4">
          <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <div className="p-2.5 rounded-2xl bg-teal-100 text-teal-800">
                  <BookOpen className="w-5 h-5 text-teal-700" />
                </div>
                <h3 className="text-lg sm:text-xl font-black text-slate-900">
                  সংগঠনের নিয়মাবলি ও নির্দেশিকা
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-teal-100 text-teal-800">
                  {toBengaliNumber(activeRules.length)}টি ধারা
                </span>
              </div>
              <p className="text-xs text-slate-500">
                সংগঠনের আদর্শ, অভ্যন্তরীণ শৃঙ্খলা, সদস্য আচরণ ও মানবিক কার্যক্রম পরিচালনার মৌলিক নিয়মাবলি
              </p>
            </div>

            {isAdmin && onNavigateToAdminTab && (
              <button
                onClick={() => onNavigateToAdminTab('rules')}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold shadow-xs transition cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>নিয়মাবলি পরিচালনা ও সম্পাদন</span>
              </button>
            )}
          </div>

          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-xs divide-y divide-slate-100 space-y-3">
            {activeRules.map((rule, idx) => (
              <div 
                key={rule.id} 
                className="pt-3 first:pt-0 flex items-start gap-3.5 group hover:bg-slate-50/70 p-2.5 rounded-2xl transition"
              >
                {/* Number Badge (1, 2, 3...) */}
                <div className="w-8 h-8 rounded-2xl bg-emerald-700 text-white font-black text-xs sm:text-sm flex items-center justify-center shrink-0 shadow-xs mt-0.5 group-hover:scale-105 transition-transform">
                  {toBengaliNumber(rule.pointNumber || idx + 1)}
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  {rule.category && (
                    <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200/60">
                      {rule.category}
                    </span>
                  )}
                  <p className="text-xs sm:text-sm text-slate-800 font-medium leading-relaxed">
                    {rule.ruleText}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* =========================================================================
          SECTION 5: Official Social Media / Page Link & Official Email Address
          - Clickable direct links to official Facebook page, email, hotline, YouTube
          - Fully manageable via Admin Panel (Profile tab)
          ========================================================================= */}
      {/* =========================================================================
          SECTION 5: Official Social Media / Page Link & Official Email Address (Strict Conditional Visibility)
          - Every single contact option is independently checked.
          - Only render a specific contact card if admin has actually added a value/link for that exact field.
          - If a field is empty or blank, that specific card is completely hidden.
          - If all fields are empty across all contacts, completely hide the entire section card so space remains completely blank.
          ========================================================================= */}
      {(() => {
        const facebookUrl = (profile?.facebookUrl || '').trim();
        const email = (profile?.email || '').trim();
        const hotline = (profile?.hotline || '').trim();
        const phone = (profile?.phone || '').trim();
        const emergency = (profile?.emergencyContact || '').trim();
        const youtubeUrl = (profile?.youtubeUrl || '').trim();

        const hasFacebook = Boolean(facebookUrl);
        const hasEmail = Boolean(email);
        const hasHotline = Boolean(hotline);
        // Show phone independently if provided and not identical to hotline
        const hasPhone = Boolean(phone && phone !== hotline);
        // Show emergency independently if provided and not identical to hotline or phone
        const hasEmergency = Boolean(emergency && emergency !== hotline && emergency !== phone);
        const hasYoutube = Boolean(youtubeUrl);

        const hasAnyContact = hasFacebook || hasEmail || hasHotline || hasPhone || hasEmergency || hasYoutube;

        // If admin has not added any contact info across all fields, completely hide the entire section
        if (!hasAnyContact) return null;

        return (
          <section className="space-y-4">
            <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <div className="p-2.5 rounded-2xl bg-indigo-100 text-indigo-800">
                    <Share2 className="w-5 h-5 text-indigo-700" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-black text-slate-900">
                    অফিসিয়াল যোগাযোগ ও সোশ্যাল মিডিয়া
                  </h3>
                </div>
                <p className="text-xs text-slate-500">
                  সংগঠনের সাথে সার্বক্ষণিক যোগাযোগের জন্য অফিসিয়াল ফেসবুক পেজ, ইমেইল এবং মোবাইল নম্বরে ক্লিক করুন
                </p>
              </div>

              {isAdmin && onNavigateToAdminTab && (
                <button
                  onClick={() => onNavigateToAdminTab('profile')}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold shadow-xs transition cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>যোগাযোগ তথ্য সম্পাদন করুন</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* 1. Official Facebook Page Link */}
              {hasFacebook && (
                <a
                  href={facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs hover:border-blue-400 hover:shadow-md transition-all duration-300 flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <Facebook className="w-6 h-6" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">ফেসবুক পেজ</span>
                      <h4 className="text-xs sm:text-sm font-black text-slate-900 truncate group-hover:text-blue-700 transition-colors">
                        অফিসিয়াল ফেসবুক পেজ
                      </h4>
                      <p className="text-[11px] text-slate-500 truncate">ভিজিট করতে এখানে ক্লিক করুন</p>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-blue-600 shrink-0 transition-colors" />
                </a>
              )}

              {/* 2. Official Email Address */}
              {hasEmail && (
                <a
                  href={`mailto:${email}`}
                  className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs hover:border-emerald-400 hover:shadow-md transition-all duration-300 flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 group-hover:bg-emerald-700 group-hover:text-white transition-colors">
                      <Mail className="w-6 h-6" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">অফিসিয়াল ইমেইল</span>
                      <h4 className="text-xs sm:text-sm font-black text-slate-900 truncate group-hover:text-emerald-700 transition-colors font-mono">
                        {email}
                      </h4>
                      <p className="text-[11px] text-slate-500 truncate">মেইল পাঠাতে ক্লিক করুন</p>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 shrink-0 transition-colors" />
                </a>
              )}

              {/* 3. Official Hotline */}
              {hasHotline && (
                <a
                  href={`tel:${sanitizePhone(hotline)}`}
                  className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs hover:border-teal-400 hover:shadow-md transition-all duration-300 flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0 group-hover:bg-teal-700 group-hover:text-white transition-colors">
                      <Phone className="w-6 h-6" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">জরুরি হটলাইন</span>
                      <h4 className="text-xs sm:text-sm font-black text-slate-900 truncate group-hover:text-teal-700 transition-colors font-mono">
                        {hotline}
                      </h4>
                      <p className="text-[11px] text-slate-500 truncate">সরাসরি কল করতে ট্যাপ করুন</p>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-teal-600 shrink-0 transition-colors" />
                </a>
              )}

              {/* 4. Official Phone / Mobile */}
              {hasPhone && (
                <a
                  href={`tel:${sanitizePhone(phone)}`}
                  className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs hover:border-emerald-400 hover:shadow-md transition-all duration-300 flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 group-hover:bg-emerald-700 group-hover:text-white transition-colors">
                      <Phone className="w-6 h-6" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">মোবাইল নম্বর</span>
                      <h4 className="text-xs sm:text-sm font-black text-slate-900 truncate group-hover:text-emerald-700 transition-colors font-mono">
                        {phone}
                      </h4>
                      <p className="text-[11px] text-slate-500 truncate">সরাসরি কল করতে ট্যাপ করুন</p>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 shrink-0 transition-colors" />
                </a>
              )}

              {/* 5. Emergency Contact (if distinct) */}
              {hasEmergency && (
                <a
                  href={`tel:${sanitizePhone(emergency)}`}
                  className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs hover:border-rose-400 hover:shadow-md transition-all duration-300 flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-700 flex items-center justify-center shrink-0 group-hover:bg-rose-700 group-hover:text-white transition-colors">
                      <Phone className="w-6 h-6" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">জরুরি যোগাযোগ</span>
                      <h4 className="text-xs sm:text-sm font-black text-slate-900 truncate group-hover:text-rose-700 transition-colors font-mono">
                        {emergency}
                      </h4>
                      <p className="text-[11px] text-slate-500 truncate">জরুরি প্রয়োজনে কল করুন</p>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-rose-600 shrink-0 transition-colors" />
                </a>
              )}

              {/* 6. Official YouTube Channel / Media */}
              {hasYoutube && (
                <a
                  href={youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs hover:border-red-400 hover:shadow-md transition-all duration-300 flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center shrink-0 group-hover:bg-red-600 group-hover:text-white transition-colors">
                      <Youtube className="w-6 h-6" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">ইউটিউব চ্যানেল / মিডিয়া</span>
                      <h4 className="text-xs sm:text-sm font-black text-slate-900 truncate group-hover:text-red-700 transition-colors">
                        অফিসিয়াল ইউটিউব চ্যানেল
                      </h4>
                      <p className="text-[11px] text-slate-500 truncate">ভিডিও ও মানবিক কার্যক্রমের তথ্যচিত্র দেখতে ক্লিক করুন</p>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-red-600 shrink-0 transition-colors" />
                </a>
              )}
            </div>
          </section>
        );
      })()}

      {/* Lightbox / Zoom Modal */}
      {zoomedImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setZoomedImage(null)}
        >
          <div 
            className="relative max-w-4xl w-full bg-slate-950 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 flex items-center justify-between border-b border-slate-800 text-white">
              <div>
                <h4 className="text-sm sm:text-base font-bold">{zoomedImage.title}</h4>
                {zoomedImage.subtitle && (
                  <p className="text-xs text-slate-400 mt-0.5">{zoomedImage.subtitle}</p>
                )}
              </div>
              <button
                onClick={() => setZoomedImage(null)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="max-h-[75vh] overflow-auto flex items-center justify-center bg-black p-2">
              <img
                src={zoomedImage.url}
                alt={zoomedImage.title}
                className="max-h-[70vh] w-auto max-w-full object-contain rounded-xl"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
