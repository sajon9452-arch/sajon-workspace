import React, { useState, useMemo } from 'react';
import { 
  Headphones, 
  Phone, 
  MessageCircle, 
  Copy, 
  Check, 
  Search, 
  X, 
  Clock, 
  CheckCircle2, 
  ArrowLeft
} from 'lucide-react';
import { SupportTeamMember } from '../types';
import { sanitizePhone, toBengaliNumber } from '../utils/helpers';

interface SupportScreenProps {
  supportMembers: SupportTeamMember[];
  onBack?: () => void;
  // Optional legacy props accepted for compatibility
  onAddSupportMember?: (member: Omit<SupportTeamMember, 'id'>) => Promise<SupportTeamMember>;
  onEditSupportMember?: (member: SupportTeamMember) => Promise<void>;
  onDeleteSupportMember?: (id: string) => Promise<void>;
  isAdmin?: boolean;
  openAdminModal?: () => void;
  profile?: any;
  reports?: any[];
  onAddReport?: any;
}

export const SupportScreen: React.FC<SupportScreenProps> = ({
  supportMembers = [],
  onBack
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Interactive feedback
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [zoomedPhoto, setZoomedPhoto] = useState<{ src: string; name: string; designation?: string } | null>(null);

  // Copy phone handler
  const handleCopyPhone = (phone: string) => {
    navigator.clipboard.writeText(phone);
    setCopiedPhone(phone);
    setToastMsg(`মোবাইল নম্বর ${phone} কপি করা হয়েছে`);
    setTimeout(() => {
      setCopiedPhone(null);
      setToastMsg(null);
    }, 2500);
  };

  // WhatsApp link generator
  const getWhatsAppUrl = (phone: string, subject: string) => {
    const clean = sanitizePhone(phone);
    const intl = clean.startsWith('0') ? '88' + clean : clean;
    const msg = encodeURIComponent(`আসসালামু আলাইকুম, আমি সিলেট মানবসেবা সংগঠনের "${subject}" বিষয়ে সহায়তা পেতে যোগাযোগ করছি।`);
    return `https://wa.me/${intl}?text=${msg}`;
  };

  // Filtered representatives (strictly dynamic admin-added data with search capability)
  const filteredRepresentatives = useMemo(() => {
    if (!searchTerm.trim()) return supportMembers;
    const q = searchTerm.trim().toLowerCase();
    return supportMembers.filter(m => {
      return (
        m.name.toLowerCase().includes(q) ||
        (m.phone || '').includes(q) ||
        (m.designation || '').toLowerCase().includes(q) ||
        (m.subject || '').toLowerCase().includes(q) ||
        (m.description || '').toLowerCase().includes(q)
      );
    });
  }, [supportMembers, searchTerm]);

  return (
    <div className="space-y-6 pb-20 sm:pb-8 animate-in fade-in">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-20 right-4 z-50 bg-emerald-900 text-white px-4 py-3 rounded-2xl shadow-xl border border-emerald-400/40 text-xs font-bold flex items-center gap-2 animate-in slide-in-from-top">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* 1. Directory Header - Strictly View-Only for public users */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-emerald-950 rounded-3xl p-5 sm:p-7 text-white shadow-xl border border-emerald-700/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2.5">
              {onBack && (
                <button
                  onClick={onBack}
                  className="p-2 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer shrink-0 mr-1"
                  title="ফিরে যান"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
              <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 text-emerald-300 shrink-0">
                <Headphones className="w-5 h-5 text-emerald-300" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                  <span>সাপোর্ট টিম ডিরেক্টরি</span>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 border border-emerald-400/30">
                    হেল্পডেস্ক
                  </span>
                </h2>
                <p className="text-xs text-emerald-200 font-medium mt-0.5">
                  যেকোনো সমস্যা, চিকিৎসা অনুদান, রক্তদান বা সদস্য সহায়তায় সংশ্লিষ্ট প্রতিনিধির সাথে সরাসরি কথা বলুন
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 text-xs font-bold bg-white/10 border border-white/20 px-3.5 py-2 rounded-2xl text-emerald-200">
            <span>মোট প্রতিনিধি:</span>
            <span className="font-mono text-white bg-emerald-700/60 px-2 py-0.5 rounded-lg">
              {toBengaliNumber(supportMembers.length)} জন
            </span>
          </div>
        </div>
      </div>

      {/* 2. Search Bar */}
      <div className="bg-white rounded-2xl p-2.5 sm:p-3 border border-slate-200 shadow-xs flex items-center gap-2">
        <Search className="w-5 h-5 text-slate-400 shrink-0 ml-1" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="নাম, পদবি, মোবাইল নম্বর বা সহায়তার বিষয় দিয়ে প্রতিনিধি খুঁজুন..."
          className="w-full text-xs sm:text-sm text-slate-800 placeholder-slate-400 bg-transparent focus:outline-none"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 3. Representatives Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredRepresentatives.map((rep) => {
          return (
            <div 
              key={rep.id}
              className="bg-white rounded-3xl border border-slate-200/90 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all duration-300 overflow-hidden flex flex-col justify-between group"
            >
              <div className="p-5 sm:p-6 space-y-4">
                {/* Header: Photo + Info */}
                <div className="flex items-start gap-4">
                  {/* Photo with zoom cursor */}
                  <div 
                    onClick={() => {
                      if (rep.photoUrl) {
                        setZoomedPhoto({ src: rep.photoUrl, name: rep.name, designation: rep.designation });
                      }
                    }}
                    className={`w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 border-2 border-emerald-500/20 flex items-center justify-center shrink-0 overflow-hidden shadow-xs relative ${rep.photoUrl ? 'cursor-zoom-in' : ''}`}
                    title={rep.photoUrl ? 'ছবি বড় করে দেখতে ক্লিক করুন' : undefined}
                  >
                    {rep.photoUrl ? (
                      <img 
                        src={rep.photoUrl} 
                        alt={rep.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-emerald-50 text-emerald-800 font-black text-xl">
                        {rep.name.charAt(0)}
                      </div>
                    )}
                  </div>

                  {/* Name & Badge */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {rep.category || 'সাধারণ সহায়তা'}
                      </span>
                    </div>

                    <h3 className="text-base font-black text-slate-900 truncate mt-1 group-hover:text-emerald-800 transition-colors">
                      {rep.name}
                    </h3>
                    
                    <p className="text-xs font-semibold text-emerald-700 truncate">
                      {rep.designation}
                    </p>

                    {rep.availableHours && (
                      <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium mt-1">
                        <Clock className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span className="truncate">{rep.availableHours}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Topic / Scope Box */}
                <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200/80 space-y-1.5">
                  <div className="text-[11px] font-black text-slate-700 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                    <span>সহায়তার বিষয়:</span>
                  </div>
                  <p className="text-xs font-bold text-emerald-900 leading-snug">
                    {rep.subject}
                  </p>
                  {rep.description && (
                    <p className="text-[11px] text-slate-600 leading-relaxed font-normal pt-1 border-t border-slate-200/60">
                      {rep.description}
                    </p>
                  )}
                </div>

                {/* Mobile Number & Copy */}
                <div className="flex items-center justify-between bg-emerald-50/60 border border-emerald-200/70 rounded-2xl p-2.5">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span className="text-xs font-bold font-mono text-slate-800 tracking-wide">
                      {rep.phone}
                    </span>
                  </div>
                  <button
                    onClick={() => handleCopyPhone(rep.phone)}
                    className="p-1.5 rounded-xl bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 transition cursor-pointer active:scale-90"
                    title="নম্বর কপি করুন"
                  >
                    {copiedPhone === rep.phone ? (
                      <Check className="w-3.5 h-3.5 text-emerald-700" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-slate-600" />
                    )}
                  </button>
                </div>
              </div>

              {/* Action Buttons: Direct Call & WhatsApp */}
              <div className="px-5 pb-5 pt-0">
                <div className="grid grid-cols-2 gap-2">
                  <a
                    href={`tel:${sanitizePhone(rep.phone)}`}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition shadow-xs active:scale-95"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>সরাসরি কল</span>
                  </a>

                  <a
                    href={getWhatsAppUrl(rep.phone, rep.subject)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition shadow-xs active:scale-95"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>হোয়াটসঅ্যাপ</span>
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {supportMembers.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 sm:p-12 text-center border border-slate-200 shadow-xs space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
            <Headphones className="w-8 h-8 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-800">কোনো প্রতিনিধি তালিকাভুক্ত নেই</h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
              সাপোর্ট টিম ডিরেক্টরিতে বর্তমানে কোনো প্রতিনিধি যুক্ত নেই। শুধুমাত্র অ্যাডমিন কর্তৃক যোগ করা প্রতিনিধিরাই এখানে স্থায়ীভাবে প্রদর্শিত হবে।
            </p>
          </div>
        </div>
      ) : filteredRepresentatives.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 sm:p-12 text-center border border-slate-200 shadow-xs space-y-3">
          <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Search className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-800">কোনো প্রতিনিধি পাওয়া যায়নি</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            আপনার অনুসন্ধানের সাথে মিল রেখে কোনো প্রতিনিধির রেকর্ড মেলেনি।
          </p>
          <button
            onClick={() => setSearchTerm('')}
            className="px-4 py-2 rounded-xl bg-emerald-700 text-white text-xs font-bold cursor-pointer"
          >
            সকল প্রতিনিধি দেখুন
          </button>
        </div>
      ) : null}

      {/* 4. Zoomed Photo Lightbox Modal */}
      {zoomedPhoto && (
        <div 
          onClick={() => setZoomedPhoto(null)}
          className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl overflow-hidden max-w-sm w-full shadow-2xl border border-slate-200 relative animate-in zoom-in-95"
          >
            <div className="relative aspect-square w-full bg-slate-900">
              <img 
                src={zoomedPhoto.src} 
                alt={zoomedPhoto.name}
                className="w-full h-full object-cover" 
              />
              <button
                onClick={() => setZoomedPhoto(null)}
                className="absolute top-3 right-3 p-2 rounded-full bg-slate-900/70 hover:bg-slate-900 text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 text-center">
              <h4 className="text-base font-bold text-slate-900">{zoomedPhoto.name}</h4>
              {zoomedPhoto.designation && (
                <p className="text-xs text-emerald-700 font-semibold mt-0.5">{zoomedPhoto.designation}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
