import React, { useState, useMemo } from 'react';
import { 
  PhoneCall, 
  MessageSquare, 
  HelpCircle, 
  Search, 
  ShieldCheck, 
  User, 
  ArrowLeft, 
  Copy, 
  Check, 
  Image as ImageIcon, 
  X, 
  Phone,
  Tag,
  ChevronDown,
  ChevronUp,
  LifeBuoy,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { SupportReportItem, OrganizationProfile } from '../types';
import { toBengaliNumber } from '../utils/helpers';

interface SupportScreenProps {
  reports: SupportReportItem[];
  profile?: OrganizationProfile;
  isAdmin?: boolean;
  onNavigateHome?: () => void;
  onNavigateAdmin?: () => void;
  onBack?: () => void;
}

export const SupportScreen: React.FC<SupportScreenProps> = ({
  reports = [],
  profile,
  isAdmin = false,
  onNavigateHome,
  onNavigateAdmin,
  onBack
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);
  const [zoomImage, setZoomImage] = useState<{ src: string; title: string } | null>(null);

  const handleBack = () => {
    if (onNavigateHome) onNavigateHome();
    else if (onBack) onBack();
  };

  // Extract unique subjects and their respective counts dynamically
  const subjectCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    reports.forEach(r => {
      const sub = r.subject ? r.subject.trim() : 'সাধারণ সহায়তা';
      counts[sub] = (counts[sub] || 0) + 1;
    });
    return counts;
  }, [reports]);

  const uniqueSubjects = useMemo(() => {
    return Object.keys(subjectCounts);
  }, [subjectCounts]);

  // Filtered reports
  const filteredReports = useMemo(() => {
    return reports.filter(r => {
      const matchSearch = 
        (r.name && r.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (r.designation && r.designation.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (r.subject && r.subject.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (r.phone && r.phone.includes(searchTerm)) ||
        (r.description && r.description.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const sub = r.subject ? r.subject.trim() : 'সাধারণ সহায়তা';
      const matchSubject = selectedSubject === 'all' || sub === selectedSubject;
      return matchSearch && matchSubject;
    });
  }, [reports, searchTerm, selectedSubject]);

  // Copy phone handler
  const handleCopyPhone = (phone: string, id: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(phone);
      setCopiedPhone(id);
      setTimeout(() => setCopiedPhone(null), 2000);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* Top Header Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-60 h-60 rounded-full bg-emerald-400/10 blur-2xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleBack}
                id="support-back-btn"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-xs transition cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>হোমে ফিরুন</span>
              </button>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-300/40 text-amber-200 text-xs font-bold">
                <LifeBuoy className="w-3.5 h-3.5 text-amber-300" />
                <span>হেল্পডেস্ক ও সহায়তা ডিরেক্টরি</span>
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              রিপোর্ট ও সহায়তা কেন্দ্র (Report & Support)
            </h2>
            <p className="text-emerald-100/90 text-xs sm:text-sm leading-relaxed">
              সংগঠনের যেকোনো কার্যক্রমে তথ্য, জরুরি রক্তের আবেদন, সদস্যপদ কিংবা যেকোনো প্রয়োজনে আমাদের দায়িত্বপ্রাপ্ত সমন্বয়কদের সাথে সরাসরি যোগাযোগ করুন।
            </p>
          </div>

          {isAdmin && onNavigateAdmin && (
            <div className="flex items-center">
              <button
                onClick={onNavigateAdmin}
                id="support-admin-manage-btn"
                className="bg-emerald-950/80 hover:bg-emerald-950 text-emerald-100 font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl border border-emerald-500/50 flex items-center gap-2 transition cursor-pointer shadow-xs"
                title="এডমিন প্যানেলে পরিচালনা করুন"
              >
                <ShieldCheck className="w-4 h-4 text-amber-300" />
                <span>এডমিন প্যানেলে পরিচালনা করুন</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Search & Subject Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              id="support-search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="নাম, পদবি, বিষয় বা মোবাইল নম্বর দিয়ে খুঁজুন..."
              className="w-full pl-9.5 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-slate-50/60"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto no-scrollbar pb-1 sm:pb-0">
            <button
              onClick={() => setSelectedSubject('all')}
              id="filter-all-subjects"
              className={`px-3 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                selectedSubject === 'all'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              সকল বিষয় ({toBengaliNumber(reports.length)})
            </button>
            {uniqueSubjects.map((sub) => (
              <button
                key={sub}
                onClick={() => setSelectedSubject(sub)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  selectedSubject === sub
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {sub} ({toBengaliNumber(subjectCounts[sub] || 0)})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Reports Card Grid */}
      {filteredReports.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center border border-slate-200 shadow-xs space-y-3">
          <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
            <HelpCircle className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-800">কোনো তথ্য পাওয়া যায়নি</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {searchTerm 
              ? 'আপনার অনুসন্ধানকৃত তথ্যের সাথে কোনো এন্ট্রি মেলেনি। অনুগ্রহ করে ফিল্টার বা কিওয়ার্ড পরিবর্তন করে দেখুন।' 
              : 'বর্তমানে কোনো সাপোর্ট বা রিপোর্ট এন্ট্রি যুক্ত নেই। অ্যাডমিন প্যানেল থেকে তথ্য যুক্ত করা হলে এখানে প্রদর্শিত হবে।'}
          </p>
          {searchTerm && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedSubject('all');
              }}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              <span>ফিল্টার রিসেট করুন</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredReports.map((item) => {
            const isExpanded = expandedId === item.id;
            const photoSrc = item.photoBase64 || item.photoUrl;

            return (
              <div
                key={item.id}
                id={`support-card-${item.id}`}
                className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-emerald-400 transition-all duration-200 shadow-xs hover:shadow-md flex flex-col justify-between"
              >
                <div>
                  {/* Card Top: Photo, Name, Designation & Subject */}
                  <div className="flex items-start gap-3.5">
                    {/* Photo with zoom capability */}
                    <div className="relative flex-shrink-0">
                      {photoSrc ? (
                        <div 
                          onClick={() => setZoomImage({ src: photoSrc, title: item.name })}
                          className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl overflow-hidden border-2 border-emerald-500/40 shadow-xs bg-slate-100 cursor-pointer group relative"
                          title="ছবিটি বড় করে দেখতে ক্লিক করুন"
                        >
                          <img
                            src={photoSrc}
                            alt={item.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                            <ImageIcon className="w-4 h-4" />
                          </div>
                        </div>
                      ) : (
                        <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 text-emerald-800 border-2 border-emerald-200 flex items-center justify-center font-black text-xl shadow-xs">
                          <User className="w-8 h-8 text-emerald-700" />
                        </div>
                      )}
                    </div>

                    {/* Name, Designation, Subject */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5 mb-1">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold">
                          <Tag className="w-3 h-3 text-emerald-600" />
                          <span>{item.subject}</span>
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 text-[10px] font-bold">
                          <CheckCircle2 className="w-3 h-3 text-teal-600" />
                          <span>ভেরিফাইড দায়িত্বপ্রাপ্ত</span>
                        </span>
                      </div>

                      <h4 className="text-base sm:text-lg font-black text-slate-900 leading-tight truncate">
                        {item.name}
                      </h4>
                      <p className="text-xs font-semibold text-emerald-700 mt-0.5">
                        {item.designation}
                      </p>
                    </div>
                  </div>

                  {/* Description Box */}
                  <div className="mt-3.5 bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <p className={`text-xs text-slate-700 leading-relaxed ${isExpanded ? '' : 'line-clamp-3'}`}>
                      {item.description}
                    </p>
                    {item.description && item.description.length > 110 && (
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : item.id)}
                        className="mt-1.5 text-[11px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-0.5 cursor-pointer"
                      >
                        <span>{isExpanded ? 'কম দেখুন' : 'সম্পূর্ণ বিবরণ দেখুন'}</span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>
                </div>

                {/* Card Footer: Phone Actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-900 bg-slate-100 px-2.5 py-1.5 rounded-lg font-mono">
                      {item.phone}
                    </span>
                    <button
                      onClick={() => handleCopyPhone(item.phone, item.id)}
                      className="p-1.5 text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition cursor-pointer"
                      title="নম্বর কপি করুন"
                    >
                      {copiedPhone === item.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* WhatsApp Action */}
                    <a
                      href={`https://wa.me/88${item.phone.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 px-2.5 py-1.5 rounded-xl text-xs font-bold transition"
                      title="হোয়াটসঅ্যাপে বার্তা দিন"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                      <span>হোয়াটসঅ্যাপ</span>
                    </a>

                    {/* Direct Call Action */}
                    <a
                      href={`tel:${item.phone}`}
                      className="inline-flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-1.5 rounded-xl text-xs font-black shadow-xs transition hover:scale-102"
                      title="সরাসরি ফোন কল করুন"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      <span>সরাসরি কল</span>
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Zoom Image Modal */}
      {zoomImage && (
        <div 
          onClick={() => setZoomImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fadeIn"
        >
          <div className="relative max-w-md w-full bg-slate-900 rounded-3xl overflow-hidden border border-white/20 p-2 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center px-3 py-2 text-white border-b border-white/10 mb-2">
              <span className="text-sm font-bold truncate">{zoomImage.title}</span>
              <button 
                onClick={() => setZoomImage(null)}
                className="p-1 rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="max-h-[70vh] flex items-center justify-center overflow-hidden rounded-2xl bg-black">
              <img
                src={zoomImage.src}
                alt={zoomImage.title}
                className="w-full h-auto max-h-[70vh] object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
