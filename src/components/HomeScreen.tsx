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
  Phone, 
  Share2, 
  Sparkles, 
  ShieldCheck, 
  Search, 
  HeartHandshake, 
  Gift, 
  ExternalLink,
  PlusCircle,
  HelpCircle
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
      // Swiped Left -> Next slide
      handleNextSlide();
    } else if (distance < -minSwipeDistance) {
      // Swiped Right -> Prev slide
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
          SECTION 1: Dynamic Image Slider / Carousel (Top Section)
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
            {/* Main Carousel Frame */}
            <div className="relative rounded-3xl overflow-hidden bg-slate-950 shadow-xl border border-slate-800 select-none">
              <div className="relative h-64 sm:h-80 md:h-[400px] lg:h-[460px] w-full overflow-hidden">
                {currentSlide.imageUrl ? (
                  <img
                    src={currentSlide.imageUrl}
                    alt={currentSlide.title || 'সংগঠনের ছবি'}
                    className="w-full h-full object-cover transition-all duration-700 ease-out"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-tr from-emerald-950 via-slate-900 to-teal-950 flex flex-col items-center justify-center p-6 text-center">
                    <HeartHandshake className="w-20 h-20 text-emerald-500/40 mb-3" />
                    <h3 className="text-xl font-bold text-white max-w-md">{currentSlide.title}</h3>
                  </div>
                )}

                {/* Gradient Shadows for readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/40 to-black/20 pointer-events-none" />

                {/* Top Badge Overlay */}
                <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-2 z-10">
                  <div className="flex items-center gap-2 flex-wrap">
                    {currentSlide.category && (
                      <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-600 text-white shadow-md backdrop-blur-md">
                        {currentSlide.category}
                      </span>
                    )}
                    {currentSlide.location && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-black/60 text-slate-200 backdrop-blur-md flex items-center gap-1 border border-white/10">
                        <MapPin className="w-3 h-3 text-rose-400 shrink-0" />
                        <span>{currentSlide.location}</span>
                      </span>
                    )}
                    {currentSlide.date && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-black/60 text-slate-200 backdrop-blur-md flex items-center gap-1 border border-white/10">
                        <Calendar className="w-3 h-3 text-amber-400 shrink-0" />
                        <span>{currentSlide.date}</span>
                      </span>
                    )}
                  </div>

                  {/* Counter & Admin edit shortcut */}
                  <div className="flex items-center gap-2">
                    {isAdmin && onNavigateToAdminTab && (
                      <button
                        onClick={() => onNavigateToAdminTab('slides')}
                        className="px-2.5 py-1 rounded-xl bg-amber-400/90 hover:bg-amber-400 text-amber-950 text-xs font-black shadow-md transition cursor-pointer flex items-center gap-1"
                        title="স্লাইডার পরিচালনা করুন"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">স্লাইডার এডিট</span>
                      </button>
                    )}
                    {activeSlidesList.length > 1 && (
                      <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-black/60 text-emerald-300 font-mono backdrop-blur-md border border-white/10">
                        {toBengaliNumber(currentSlideIndex + 1)} / {toBengaliNumber(activeSlidesList.length)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Bottom Content Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-7 md:p-8 text-white z-10 space-y-2">
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white leading-tight drop-shadow-md">
                    {currentSlide.title}
                  </h2>
                  {currentSlide.description && (
                    <p className="text-xs sm:text-sm text-slate-200 line-clamp-2 md:line-clamp-3 max-w-3xl leading-relaxed drop-shadow-sm font-medium">
                      {currentSlide.description}
                    </p>
                  )}
                </div>

                {/* Previous & Next Desktop Buttons */}
                {activeSlidesList.length > 1 && (
                  <>
                    <button
                      onClick={handlePrevSlide}
                      className="absolute left-3 top-1/2 -translate-y-1/2 p-2 sm:p-2.5 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-md transition cursor-pointer border border-white/10 shadow-lg active:scale-95 z-20"
                      aria-label="পূর্ববর্তী ছবি"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={handleNextSlide}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2 sm:p-2.5 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-md transition cursor-pointer border border-white/10 shadow-lg active:scale-95 z-20"
                      aria-label="পরবর্তী ছবি"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Slide Dots / Indicators */}
            {activeSlidesList.length > 1 && (
              <div className="flex items-center justify-center gap-2 pt-1">
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
          </div>
        ) : (
          /* Empty Slider State - Only when admin removes all slides */
          <div className="rounded-3xl bg-gradient-to-br from-emerald-900 via-slate-900 to-teal-950 p-6 sm:p-10 text-white text-center shadow-lg border border-emerald-800/50 space-y-4">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center">
              <HeartHandshake className="w-8 h-8 text-emerald-300" />
            </div>
            <div className="max-w-xl mx-auto space-y-1">
              <h2 className="text-xl sm:text-2xl font-black text-white">{profile.name}</h2>
              <p className="text-xs sm:text-sm text-emerald-200 font-medium">{profile.tagline}</p>
              <p className="text-xs text-amber-300 font-bold">{profile.address}</p>
            </div>
            {isAdmin && onNavigateToAdminTab && (
              <button
                onClick={() => onNavigateToAdminTab('slides')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black shadow transition cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>স্লাইডারে নতুন ছবি যোগ করুন</span>
              </button>
            )}
          </div>
        )}
      </section>

      {/* =========================================================================
          SECTION 2: Donation & Aid Recipient Directory (Multiple Records Support)
          ========================================================================= */}
      <section className="space-y-4">
        {/* Section Header */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="p-2 rounded-2xl bg-emerald-100 text-emerald-800">
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
            <div className="bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-2xl text-xs">
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
        {aidDonations.length > 3 && (
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={donationSearch}
              onChange={(e) => setDonationSearch(e.target.value)}
              placeholder="নাম, ঠিকানা বা দায়িত্বশীলের রেফারেন্স দিয়ে খুঁজুন..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-2xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>
        )}

        {/* Multiple Records Cards Grid */}
        {filteredDonations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredDonations.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs hover:shadow-md transition flex flex-col justify-between space-y-4"
              >
                {/* Card Top: Photo & Basic Details */}
                <div className="flex items-start gap-4">
                  {/* Photo with rounded framing */}
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 shadow-2xs">
                    {item.photoUrl ? (
                      <img
                        src={item.photoUrl}
                        alt={item.recipientName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-emerald-50 text-emerald-700 p-2 text-center">
                        <Heart className="w-7 h-7 text-emerald-500 mb-1" />
                        <span className="text-[9px] font-bold text-slate-400">সাহায্যপ্রাপ্ত</span>
                      </div>
                    )}
                  </div>

                  {/* Recipient Identity & Amount */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                        সহায়তাপ্রাপ্ত
                      </span>
                      <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>{item.date}</span>
                      </span>
                    </div>

                    <h4 className="text-base font-black text-slate-900 leading-snug">
                      {item.recipientName}
                    </h4>

                    {/* Amount badge */}
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 border border-emerald-300/80 text-emerald-900 text-sm font-black">
                      <span className="text-xs text-emerald-700 font-bold">বিতরণকৃত অনুদান:</span>
                      <span>{formatBengaliCurrency(item.amount)}</span>
                    </div>

                    {/* Address */}
                    <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium pt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <span className="truncate">{item.address}</span>
                    </div>
                  </div>
                </div>

                {/* Donor / Provider Reference */}
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                  <div className="truncate">
                    <span className="text-slate-500 font-medium">কার মাধ্যমে দেওয়া হয়েছে: </span>
                    <strong className="text-slate-800 font-bold">{item.providerReference}</strong>
                  </div>
                </div>

                {/* Detailed Description */}
                {item.description && (
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-slate-400">বিস্তারিত বিবরণ:</span>
                    <p className="text-xs text-slate-700 leading-relaxed font-normal bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
                      {item.description}
                    </p>
                  </div>
                )}

                {/* Optional Personal Payment Numbers */}
                {(item.bkashNumber || item.nagadNumber || item.rocketNumber) && (
                  <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2">
                    <div className="flex items-center gap-1.5 text-amber-900 text-[11px] font-black">
                      <Sparkles className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                      <span>ব্যক্তিগত আর্থিক সহায়তা পাঠানোর নম্বর (ঐচ্ছিক):</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
                      {item.bkashNumber && (
                        <div className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-xl border border-pink-200 shadow-2xs">
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="px-1.5 py-0.5 rounded bg-pink-100 text-pink-700 text-[10px] font-black">বিকাশ</span>
                            <span className="font-mono text-slate-800 font-bold text-xs truncate">{item.bkashNumber}</span>
                          </div>
                          <button
                            onClick={() => handleCopy(item.bkashNumber!, `aid-b-${item.id}`)}
                            className="p-1 text-slate-400 hover:text-emerald-700 transition cursor-pointer"
                            title="নম্বর কপি করুন"
                          >
                            {copiedKey === `aid-b-${item.id}` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      )}

                      {item.nagadNumber && (
                        <div className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-xl border border-orange-200 shadow-2xs">
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 text-[10px] font-black">নগদ</span>
                            <span className="font-mono text-slate-800 font-bold text-xs truncate">{item.nagadNumber}</span>
                          </div>
                          <button
                            onClick={() => handleCopy(item.nagadNumber!, `aid-n-${item.id}`)}
                            className="p-1 text-slate-400 hover:text-emerald-700 transition cursor-pointer"
                            title="নম্বর কপি করুন"
                          >
                            {copiedKey === `aid-n-${item.id}` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      )}

                      {item.rocketNumber && (
                        <div className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-xl border border-purple-200 shadow-2xs col-span-full">
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 text-[10px] font-black">রকেট</span>
                            <span className="font-mono text-slate-800 font-bold text-xs truncate">{item.rocketNumber}</span>
                          </div>
                          <button
                            onClick={() => handleCopy(item.rocketNumber!, `aid-r-${item.id}`)}
                            className="p-1 text-slate-400 hover:text-emerald-700 transition cursor-pointer"
                            title="নম্বর কপি করুন"
                          >
                            {copiedKey === `aid-r-${item.id}` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
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
          ========================================================================= */}
      <section className="space-y-4">
        {/* Section Header */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="p-2 rounded-2xl bg-amber-100 text-amber-800">
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
            <div className="bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-2xl text-xs">
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
        {extraContributions.length > 3 && (
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={contributionSearch}
              onChange={(e) => setContributionSearch(e.target.value)}
              placeholder="দাতার নাম, এলাকা বা রেফারেন্স দিয়ে খুঁজুন..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-2xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            />
          </div>
        )}

        {/* Multiple Contribution Cards Grid (Structured similarly to main donation cards) */}
        {filteredContributions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredContributions.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs hover:shadow-md transition flex flex-col justify-between space-y-4"
              >
                {/* Card Top: Photo & Basic Details */}
                <div className="flex items-start gap-4">
                  {/* Photo with rounded framing */}
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 shadow-2xs">
                    {item.photoUrl ? (
                      <img
                        src={item.photoUrl}
                        alt={item.donorName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-amber-50 text-amber-700 p-2 text-center">
                        <Gift className="w-7 h-7 text-amber-500 mb-1" />
                        <span className="text-[9px] font-bold text-slate-400">শুভাকাঙ্ক্ষী</span>
                      </div>
                    )}
                  </div>

                  {/* Donor Identity & Contributed Amount */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 uppercase tracking-wider">
                        বিশেষ অনুদান
                      </span>
                      <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>{item.date}</span>
                      </span>
                    </div>

                    <h4 className="text-base font-black text-slate-900 leading-snug">
                      {item.donorName}
                    </h4>

                    {/* Amount badge */}
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-50 border border-amber-300/80 text-amber-950 text-sm font-black">
                      <span className="text-xs text-amber-700 font-bold">প্রাপ্ত অনুদান:</span>
                      <span>{formatBengaliCurrency(item.amount)}</span>
                    </div>

                    {/* Address / Location */}
                    {item.address && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium pt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        <span className="truncate">{item.address}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Donor / Provider Reference */}
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-amber-700 shrink-0" />
                  <div className="truncate">
                    <span className="text-slate-500 font-medium">কার মাধ্যমে প্রাপ্ত / মাধ্যম: </span>
                    <strong className="text-slate-800 font-bold">{item.providerReference}</strong>
                  </div>
                </div>

                {/* Detailed Description */}
                {item.description && (
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-slate-400">উদ্দেশ্য / বিবরণ:</span>
                    <p className="text-xs text-slate-700 leading-relaxed font-normal bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
                      {item.description}
                    </p>
                  </div>
                )}

                {/* Optional Personal Payment Numbers */}
                {(item.bkashNumber || item.nagadNumber || item.rocketNumber) && (
                  <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2">
                    <div className="flex items-center gap-1.5 text-amber-900 text-[11px] font-black">
                      <Sparkles className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                      <span>যোগাযোগ ও লেনদেন নম্বর (ঐচ্ছিক):</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
                      {item.bkashNumber && (
                        <div className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-xl border border-pink-200 shadow-2xs">
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="px-1.5 py-0.5 rounded bg-pink-100 text-pink-700 text-[10px] font-black">বিকাশ</span>
                            <span className="font-mono text-slate-800 font-bold text-xs truncate">{item.bkashNumber}</span>
                          </div>
                          <button
                            onClick={() => handleCopy(item.bkashNumber!, `ext-b-${item.id}`)}
                            className="p-1 text-slate-400 hover:text-amber-700 transition cursor-pointer"
                            title="নম্বর কপি করুন"
                          >
                            {copiedKey === `ext-b-${item.id}` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      )}

                      {item.nagadNumber && (
                        <div className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-xl border border-orange-200 shadow-2xs">
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 text-[10px] font-black">নগদ</span>
                            <span className="font-mono text-slate-800 font-bold text-xs truncate">{item.nagadNumber}</span>
                          </div>
                          <button
                            onClick={() => handleCopy(item.nagadNumber!, `ext-n-${item.id}`)}
                            className="p-1 text-slate-400 hover:text-amber-700 transition cursor-pointer"
                            title="নম্বর কপি করুন"
                          >
                            {copiedKey === `ext-n-${item.id}` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      )}

                      {item.rocketNumber && (
                        <div className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-xl border border-purple-200 shadow-2xs col-span-full">
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 text-[10px] font-black">রকেট</span>
                            <span className="font-mono text-slate-800 font-bold text-xs truncate">{item.rocketNumber}</span>
                          </div>
                          <button
                            onClick={() => handleCopy(item.rocketNumber!, `ext-r-${item.id}`)}
                            className="p-1 text-slate-400 hover:text-amber-700 transition cursor-pointer"
                            title="নম্বর কপি করুন"
                          >
                            {copiedKey === `ext-r-${item.id}` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
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
    </div>
  );
};
