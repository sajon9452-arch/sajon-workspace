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
  Maximize2
} from 'lucide-react';
import { 
  OrganizationProfile, 
  HomeSlide, 
  AidDonationRecord, 
  ExtraContributionRecord 
} from '../types';
import { toBengaliNumber, formatBengaliCurrency } from '../utils/helpers';

interface HomeScreenProps {
  profile: OrganizationProfile;
  homeSlides: HomeSlide[];
  aidDonations: AidDonationRecord[];
  extraContributions: ExtraContributionRecord[];
  isAdmin: boolean;
  onNavigateToAdminTab?: (tab: 'slides' | 'donations' | 'contributions') => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  profile,
  homeSlides = [],
  aidDonations = [],
  extraContributions = [],
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

  // Filter only active slides (if isActive is defined)
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
                  title: 'সংগঠনের ফটো গ্যালারি', 
                  subtitle: currentSlide.title 
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

                {/* Previous & Next Desktop/Tablet Navigation Buttons */}
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

      {/* =========================================================================
          SECTION 2: Donation & Aid Recipient Directory (Refined Layout)
          - Significantly larger recipient photo at the top
          - All details strictly underneath the photo
          - Dynamic multiple records support
          ========================================================================= */}
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

        {/* Multiple Records Cards Grid - Refined Card Layout */}
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
            <h4 className="text-sm font-bold text-slate-700">কোনো অনুদান রেকর্ড পাওয়া যায়নি</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {donationSearch ? 'আপনার অনুসন্ধান অনুযায়ী কোনো রেকর্ড নেই।' : 'অ্যাডমিন প্যানেল থেকে নতুন অনুদান ও সাহায্যপ্রাপ্তদের তথ্য যুক্ত করুন।'}
            </p>
          </div>
        )}
      </section>

      {/* =========================================================================
          SECTION 3: Extra Contribution / Additional Fund Section
          - Refined Card Layout strictly matching Section 2:
            • Large photo at top
            • All details strictly underneath the photo
            • Multiple records dynamically supported
          ========================================================================= */}
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

        {/* Multiple Contribution Cards Grid - Exactly Same Refined Structure */}
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

                  {/* Optional Personal Payment Numbers (বিকাশ / নগদ / রকেট) */}
                  {(item.bkashNumber || item.nagadNumber || item.rocketNumber) && (
                    <div className="pt-2 border-t border-slate-100 space-y-2">
                      <div className="flex items-center gap-1.5 text-amber-900 text-xs font-black">
                        <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>যোগাযোগ ও আর্থিক লেনদেন নম্বর (ঐচ্ছিক):</span>
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
                              onClick={() => handleCopy(item.bkashNumber!, `ext-b-${item.id}`)}
                              className="p-1 rounded-lg text-pink-700 hover:bg-pink-100 transition cursor-pointer flex items-center gap-0.5 text-[10px] font-bold"
                              title="বিকাশ নম্বর কপি করুন"
                            >
                              {copiedKey === `ext-b-${item.id}` ? (
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
                              onClick={() => handleCopy(item.nagadNumber!, `ext-n-${item.id}`)}
                              className="p-1 rounded-lg text-orange-700 hover:bg-orange-100 transition cursor-pointer flex items-center gap-0.5 text-[10px] font-bold"
                              title="নগদ নম্বর কপি করুন"
                            >
                              {copiedKey === `ext-n-${item.id}` ? (
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
                              onClick={() => handleCopy(item.rocketNumber!, `ext-r-${item.id}`)}
                              className="p-1 rounded-lg text-purple-700 hover:bg-purple-100 transition cursor-pointer flex items-center gap-0.5 text-[10px] font-bold"
                              title="রকেট নম্বর কপি করুন"
                            >
                              {copiedKey === `ext-r-${item.id}` ? (
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
            <Gift className="w-10 h-10 text-slate-300 mx-auto" />
            <h4 className="text-sm font-bold text-slate-700">কোনো অতিরিক্ত অনুদান রেকর্ড পাওয়া যায়নি</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {contributionSearch ? 'আপনার অনুসন্ধান অনুযায়ী কোনো রেকর্ড নেই।' : 'শুভাকাঙ্ক্ষী ও শুভানুধ্যায়ীদের প্রদত্ত অনুদান তথ্য অ্যাডমিন প্যানেল থেকে যোগ করুন।'}
            </p>
          </div>
        )}
      </section>

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
