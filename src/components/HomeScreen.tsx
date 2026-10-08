import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Droplet, 
  Wallet, 
  Calendar as CalendarIcon, 
  BellRing, 
  Heart, 
  MapPin, 
  ArrowRight, 
  ChevronLeft, 
  ChevronRight, 
  PhoneCall, 
  ShieldCheck, 
  Sparkles,
  CreditCard,
  Building,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { 
  OrganizationProfile, 
  Member, 
  BloodDonor, 
  Notice, 
  FundRecord, 
  HomeSlide, 
  HumanitarianActivity, 
  OrganizationRule,
  ActiveScreen 
} from '../types';
import { toBengaliNumber, formatBengaliCurrency, isExecutiveCommitteeMember } from '../utils/helpers';

interface HomeScreenProps {
  profile: OrganizationProfile;
  members: Member[];
  donors: BloodDonor[];
  notices: Notice[];
  funds: FundRecord[];
  homeSlides: HomeSlide[];
  humanitarianActivities: HumanitarianActivity[];
  organizationRules: OrganizationRule[];
  manualTotalBalance: number | null;
  onNavigate: (screen: ActiveScreen) => void;
  openEmergencyModal: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  profile,
  members,
  donors,
  notices,
  funds,
  homeSlides,
  humanitarianActivities,
  organizationRules,
  manualTotalBalance,
  onNavigate,
  openEmergencyModal
}) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  // Auto rotate slides every 5 seconds
  useEffect(() => {
    if (!homeSlides || homeSlides.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % homeSlides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [homeSlides.length]);

  const activeSlide = homeSlides[currentSlideIndex] || homeSlides[0];

  // Stats calculation
  const totalMembersCount = members.length;
  const executiveMembersCount = members.filter(m => isExecutiveCommitteeMember(m)).length;
  const donorsCount = donors.length;

  const totalIncome = funds
    .filter(f => f.status === 'Paid')
    .reduce((sum, f) => sum + (Number(f.amount) || 0), 0);
  const totalExpense = funds
    .filter(f => f.status === 'Expense')
    .reduce((sum, f) => sum + (Number(f.amount) || 0), 0);
  const netBalance = manualTotalBalance !== null ? manualTotalBalance : (totalIncome - totalExpense);

  const latestNotice = notices[0];

  return (
    <div className="space-y-6 pb-20 sm:pb-8">
      {/* 1. Hero Photo Carousel */}
      {activeSlide && (
        <div className="space-y-2">
          <div className="relative rounded-3xl overflow-hidden bg-slate-900 shadow-xl border border-slate-800">
            <div className="relative h-64 sm:h-80 md:h-96 w-full overflow-hidden">
              {activeSlide.imageUrl ? (
                <img
                  src={activeSlide.imageUrl}
                  alt={activeSlide.title}
                  className="w-full h-full object-cover transition-transform duration-700 ease-out hover:scale-102"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 flex items-center justify-center">
                  <Heart className="w-20 h-20 text-emerald-500/20" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/40 to-transparent" />

              {/* Slide Content Overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-8 text-white space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500 text-white shadow-md">
                    {activeSlide.category}
                  </span>
                  <span className="text-xs text-slate-300 flex items-center gap-1 font-medium bg-black/40 backdrop-blur-xs px-2.5 py-0.5 rounded-full">
                    <MapPin className="w-3.5 h-3.5 text-rose-400" />
                    <span>{activeSlide.location}</span>
                  </span>
                  <span className="text-xs text-slate-300 font-medium bg-black/40 backdrop-blur-xs px-2.5 py-0.5 rounded-full">
                    {activeSlide.date}
                  </span>
                </div>
                <h2 className="text-xl sm:text-3xl font-black text-white leading-tight drop-shadow-md">
                  {activeSlide.title}
                </h2>
                <p className="text-xs sm:text-sm text-slate-200 line-clamp-2 max-w-2xl leading-relaxed">
                  {activeSlide.description}
                </p>
              </div>

              {/* Slider Controls */}
              {homeSlides.length > 1 && (
                <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-black/50 backdrop-blur-md p-1.5 rounded-2xl border border-white/10">
                  <button
                    onClick={() => setCurrentSlideIndex((prev) => (prev - 1 + homeSlides.length) % homeSlides.length)}
                    className="p-1 rounded-xl text-white hover:bg-white/20 transition cursor-pointer"
                    title="পূর্ববর্তী"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-bold text-emerald-300 px-1.5 font-mono">
                    {toBengaliNumber(currentSlideIndex + 1)}/{toBengaliNumber(homeSlides.length)}
                  </span>
                  <button
                    onClick={() => setCurrentSlideIndex((prev) => (prev + 1) % homeSlides.length)}
                    className="p-1 rounded-xl text-white hover:bg-white/20 transition cursor-pointer"
                    title="পরবর্তী"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Slide Thumbnails Selector */}
          {homeSlides.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto py-1 no-scrollbar">
              {homeSlides.map((slide, idx) => (
                <button
                  key={slide.id}
                  onClick={() => setCurrentSlideIndex(idx)}
                  className={`flex-1 min-w-[90px] sm:min-w-[120px] p-2 rounded-2xl border text-left transition cursor-pointer ${
                    currentSlideIndex === idx
                      ? 'bg-emerald-50 border-emerald-500 shadow-sm'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="text-[10px] font-bold text-slate-500">#{toBengaliNumber(idx + 1)} {slide.category}</div>
                  <div className="text-xs font-bold text-slate-800 truncate mt-0.5">{slide.title}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 2. Latest Notice Banner */}
      {latestNotice && (
        <div 
          onClick={() => onNavigate('notices')}
          className="bg-amber-50/90 border-2 border-amber-300/80 rounded-3xl p-4 sm:p-5 shadow-xs flex items-start gap-3.5 cursor-pointer hover:bg-amber-100/80 transition group"
        >
          <div className="p-2.5 rounded-2xl bg-amber-200 text-amber-900 shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
            <BellRing className="w-5 h-5 text-amber-800" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">
                সর্বশেষ নোটিশ
              </span>
              <span className="text-xs text-slate-500 font-medium">{latestNotice.date}</span>
            </div>
            <h3 className="text-sm font-bold text-slate-900 mt-1 truncate">
              {latestNotice.title}
            </h3>
            <p className="text-xs text-slate-600 line-clamp-1 mt-0.5">
              {latestNotice.content}
            </p>
          </div>
          <ArrowRight className="w-5 h-5 text-amber-700 shrink-0 self-center group-hover:translate-x-1 transition-transform" />
        </div>
      )}

      {/* 3. Four Live Statistical Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Members */}
        <div 
          onClick={() => onNavigate('members')}
          className="bg-white p-4 sm:p-5 rounded-3xl border border-emerald-100 shadow-xs hover:shadow-md transition cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
              <Users className="w-6 h-6 text-emerald-700" />
            </div>
            <span className="text-xs text-slate-500 font-semibold">সংগঠনের মোট সদস্য</span>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-0.5">
              {toBengaliNumber(totalMembersCount)} জন
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-emerald-700 font-bold">
            <span>কার্যকরী পরিষদ: {toBengaliNumber(executiveMembersCount)} জন</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Blood Donors */}
        <div 
          onClick={() => onNavigate('blood')}
          className="bg-white p-4 sm:p-5 rounded-3xl border border-rose-100 shadow-xs hover:shadow-md transition cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="w-11 h-11 rounded-2xl bg-rose-100 text-rose-800 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
              <Droplet className="w-6 h-6 text-rose-600" />
            </div>
            <span className="text-xs text-slate-500 font-semibold">নিবন্ধিত রক্তযোদ্ধা</span>
            <div className="text-2xl sm:text-3xl font-black text-rose-700 mt-0.5">
              {toBengaliNumber(donorsCount)} জন
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-rose-700 font-bold">
            <span>জরুরি রক্ত অনুসন্ধান</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Funds Net Balance */}
        <div 
          onClick={() => onNavigate('fund')}
          className="bg-white p-4 sm:p-5 rounded-3xl border border-amber-100 shadow-xs hover:shadow-md transition cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
              <Wallet className="w-6 h-6 text-amber-600" />
            </div>
            <span className="text-xs text-slate-500 font-semibold">বর্তমান ফান্ড ব্যালেন্স</span>
            <div className="text-xl sm:text-2xl font-black text-emerald-700 mt-0.5">
              {formatBengaliCurrency(netBalance)}
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
            <span>মোট আদায়: {formatBengaliCurrency(totalIncome)}</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* 2026 Calendar */}
        <div 
          onClick={() => onNavigate('calendar')}
          className="bg-white p-4 sm:p-5 rounded-3xl border border-teal-100 shadow-xs hover:shadow-md transition cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="w-11 h-11 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
              <CalendarIcon className="w-6 h-6 text-teal-700" />
            </div>
            <span className="text-xs text-slate-500 font-semibold">বর্ষপঞ্জি ২০২৬</span>
            <div className="text-2xl sm:text-3xl font-black text-teal-800 mt-0.5">
              ১২ মাস
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-teal-700 font-bold">
            <span>সরকারি ছুটির তালিকা</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>

      {/* 4. Quick Action Shortcuts Box */}
      <div className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 rounded-3xl p-5 sm:p-6 text-white shadow-lg space-y-4">
        <div className="flex justify-between items-center flex-wrap gap-2">
          <div>
            <h3 className="text-lg sm:text-xl font-bold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-300" />
              <span>জরুরি সেবা ও ফান্ডিং মাধ্যম</span>
            </h3>
            <p className="text-xs text-emerald-100 mt-0.5">
              মানবতার সেবায় দ্রুত যেকোনো কার্যক্রমে অংশগ্রহণ করুন
            </p>
          </div>
          <button
            onClick={openEmergencyModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow transition cursor-pointer active:scale-95"
          >
            <PhoneCall className="w-4 h-4" />
            <span>জরুরি হেল্পলাইন</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <button
            onClick={() => onNavigate('blood')}
            className="p-3.5 rounded-2xl bg-white/10 hover:bg-white/20 transition text-left backdrop-blur-sm border border-white/10 cursor-pointer active:scale-95"
          >
            <Droplet className="w-5 h-5 text-rose-300 mb-1.5" />
            <div className="text-xs font-bold text-white">রক্ত অনুসন্ধান</div>
            <div className="text-[10px] text-emerald-100 mt-0.5">যেকোনো গ্রুপের ডোনার</div>
          </button>

          <button
            onClick={() => onNavigate('fund')}
            className="p-3.5 rounded-2xl bg-white/10 hover:bg-white/20 transition text-left backdrop-blur-sm border border-white/10 cursor-pointer active:scale-95"
          >
            <Wallet className="w-5 h-5 text-amber-300 mb-1.5" />
            <div className="text-xs font-bold text-white">চাঁদা ও অনুদান</div>
            <div className="text-[10px] text-emerald-100 mt-0.5">বিকাশ / নগদ / রকেট</div>
          </button>

          <button
            onClick={() => onNavigate('members')}
            className="p-3.5 rounded-2xl bg-white/10 hover:bg-white/20 transition text-left backdrop-blur-sm border border-white/10 cursor-pointer active:scale-95"
          >
            <Users className="w-5 h-5 text-emerald-300 mb-1.5" />
            <div className="text-xs font-bold text-white">সদস্য ডিরেক্টরি</div>
            <div className="text-[10px] text-emerald-100 mt-0.5">সকল দায়িত্বশীলদের তালিকা</div>
          </button>

          <button
            onClick={() => onNavigate('support')}
            className="p-3.5 rounded-2xl bg-white/10 hover:bg-white/20 transition text-left backdrop-blur-sm border border-white/10 cursor-pointer active:scale-95"
          >
            <Heart className="w-5 h-5 text-pink-300 mb-1.5" />
            <div className="text-xs font-bold text-white">সাহায্যের আবেদন</div>
            <div className="text-[10px] text-emerald-100 mt-0.5">চিকিৎসা ও খাদ্য সাহায্য</div>
          </button>
        </div>
      </div>

      {/* 5. Humanitarian Activities Showcase */}
      {humanitarianActivities.length > 0 && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <Heart className="w-5 h-5 text-rose-500" />
              <span>মানবসেবামূলক কার্যক্রম ও অনুদান</span>
            </h3>
            <button
              onClick={() => onNavigate('fund')}
              className="text-xs text-emerald-700 font-bold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>সকল ফান্ড বিবরণী</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {humanitarianActivities.map((act) => (
              <div
                key={act.id}
                className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                    <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                      {act.location}
                    </span>
                    <span className="font-mono text-slate-400">{act.date}</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 leading-snug">
                    {act.title}
                  </h4>
                  <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                    {act.description}
                  </p>
                </div>
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500">বিতরণকৃত অনুদান:</span>
                  <span className="text-sm font-black text-rose-600">
                    {formatBengaliCurrency(act.amount)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. Organization Rules & Constitution */}
      {organizationRules.length > 0 && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6 text-emerald-700" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                সংগঠনের নীতিমালা ও গঠনতান্ত্রিক আদর্শ
              </h3>
              <p className="text-xs text-slate-500">সকল সদস্য ও শুভাকাঙ্ক্ষীদের জন্য অনুসরণীয় বিধানাবলী</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {organizationRules.map((rule) => (
              <div 
                key={rule.id}
                className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/80"
              >
                <div className="w-7 h-7 rounded-xl bg-emerald-700 text-white text-xs font-black flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                  {toBengaliNumber(rule.pointNumber)}
                </div>
                <div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 inline-block mb-1">
                    {rule.category}
                  </span>
                  <p className="text-xs text-slate-700 leading-relaxed font-medium">
                    {rule.ruleText}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
