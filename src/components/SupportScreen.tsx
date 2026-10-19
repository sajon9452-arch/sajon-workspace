import React, { useState, useMemo } from 'react';
import { 
  Headphones, 
  Phone, 
  MessageCircle, 
  Copy, 
  Check, 
  Search, 
  X, 
  PlusCircle, 
  Edit3, 
  Trash2, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  ArrowLeft
} from 'lucide-react';
import { SupportTeamMember, SupportReportItem, OrganizationProfile } from '../types';
import { sanitizePhone, toBengaliNumber } from '../utils/helpers';
import { compressImageFile } from '../utils/imageCompressor';

interface SupportScreenProps {
  supportMembers: SupportTeamMember[];
  onAddSupportMember?: (member: Omit<SupportTeamMember, 'id'>) => Promise<SupportTeamMember>;
  onEditSupportMember?: (member: SupportTeamMember) => Promise<void>;
  onDeleteSupportMember?: (id: string) => Promise<void>;
  reports?: SupportReportItem[];
  profile: OrganizationProfile;
  onAddReport?: (report: Omit<SupportReportItem, 'id'>) => Promise<SupportReportItem>;
  isAdmin?: boolean;
  openAdminModal?: () => void;
  onBack?: () => void;
}

export const SupportScreen: React.FC<SupportScreenProps> = ({
  supportMembers,
  onAddSupportMember,
  onEditSupportMember,
  onDeleteSupportMember,
  isAdmin = false,
  openAdminModal,
  onBack
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Interactive feedback
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [zoomedPhoto, setZoomedPhoto] = useState<{ src: string; name: string; designation?: string } | null>(null);

  // Admin Add / Edit Representative Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<SupportTeamMember | null>(null);
  const [repName, setRepName] = useState('');
  const [repPhone, setRepPhone] = useState('');
  const [repDesignation, setRepDesignation] = useState('');
  const [repSubject, setRepSubject] = useState('');
  const [repDescription, setRepDescription] = useState('');
  const [repCategory, setRepCategory] = useState('সাধারণ সহায়তা');
  const [repAvailableHours, setRepAvailableHours] = useState('সকাল ৯টা - রাত ১০টা');
  const [repPhoto, setRepPhoto] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // Filtered representatives (Strictly dynamic admin-added data with search capability, zero dummy data)
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

  // Photo compressor handler
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setFormError('ছবির সাইজ সর্বোচ্চ ১০ মেগাবাইট হতে পারবে');
      return;
    }

    try {
      const compressed = await compressImageFile(file, { maxWidth: 600, maxHeight: 600, quality: 0.8 });
      setRepPhoto(compressed);
      setFormError('');
    } catch {
      setFormError('ছবি প্রসেসিংয়ে সমস্যা হয়েছে, পুনরায় চেষ্টা করুন');
    }
  };

  // Open modal for add
  const handleOpenAddModal = () => {
    setEditingMember(null);
    setRepName('');
    setRepPhone('');
    setRepDesignation('সাপোর্ট সমন্বয়ক');
    setRepSubject('');
    setRepDescription('');
    setRepCategory('সাধারণ সহায়তা');
    setRepAvailableHours('সকাল ৯টা - রাত ১০টা');
    setRepPhoto('');
    setFormError('');
    setIsEditModalOpen(true);
  };

  // Open modal for edit
  const handleOpenEditModal = (rep: SupportTeamMember) => {
    setEditingMember(rep);
    setRepName(rep.name);
    setRepPhone(rep.phone);
    setRepDesignation(rep.designation);
    setRepSubject(rep.subject);
    setRepDescription(rep.description);
    setRepCategory(rep.category || 'সাধারণ সহায়তা');
    setRepAvailableHours(rep.availableHours || 'সকাল ৯টা - রাত ১০টা');
    setRepPhoto(rep.photoUrl || '');
    setFormError('');
    setIsEditModalOpen(true);
  };

  // Save Support Representative
  const handleSaveRepresentative = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError('');

    const finalName = repName.trim() || 'সাপোর্ট প্রতিনিধি';
    const finalPhone = repPhone.trim();
    const finalDesignation = repDesignation.trim() || 'সাপোর্ট সমন্বয়ক';
    const finalSubject = repSubject.trim() || 'সাধারণ সহায়তা';
    const finalDescription = repDescription.trim() || 'যেকোনো সহায়তার জন্য সরাসরি যোগাযোগ করুন।';
    const finalCategory = repCategory.trim() || 'সাধারণ সহায়তা';
    const finalHours = repAvailableHours.trim() || 'সকাল ৯টা - রাত ১০টা';

    try {
      if (editingMember) {
        if (onEditSupportMember) {
          await onEditSupportMember({
            ...editingMember,
            name: finalName,
            phone: finalPhone,
            designation: finalDesignation,
            subject: finalSubject,
            description: finalDescription,
            category: finalCategory,
            availableHours: finalHours,
            photoUrl: repPhoto || undefined
          });
          setToastMsg(`প্রতিনিধি "${finalName}" এর তথ্য সফলভাবে আপডেট করা হয়েছে`);
        }
      } else {
        if (onAddSupportMember) {
          const serial = (supportMembers.length || 0) + 1;
          await onAddSupportMember({
            name: finalName,
            phone: finalPhone,
            designation: finalDesignation,
            subject: finalSubject,
            description: finalDescription,
            category: finalCategory,
            availableHours: finalHours,
            photoUrl: repPhoto || undefined,
            serial
          });
          setToastMsg(`নতুন প্রতিনিধি "${finalName}" সফলভাবে যুক্ত করা হয়েছে`);
        }
      }
      setIsEditModalOpen(false);
      setTimeout(() => setToastMsg(null), 3000);
    } catch {
      setFormError('সংরক্ষণে সমস্যা হয়েছে, পুনরায় চেষ্টা করুন');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Support Representative
  const handleDeleteRepresentative = async (id: string, name: string) => {
    if (!window.confirm(`আপনি কি নিশ্চিতভাবে প্রতিনিধি "${name}" কে তালিকা থেকে মুছে ফেলতে চান?`)) {
      return;
    }
    try {
      if (onDeleteSupportMember) {
        await onDeleteSupportMember(id);
        setToastMsg(`প্রতিনিধি "${name}" মুছে ফেলা হয়েছে`);
        setTimeout(() => setToastMsg(null), 3000);
      }
    } catch {
      alert('মুছে ফেলতে সমস্যা হয়েছে');
    }
  };

  return (
    <div className="space-y-6 pb-20 sm:pb-8 animate-in fade-in">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-20 right-4 z-50 bg-emerald-900 text-white px-4 py-3 rounded-2xl shadow-xl border border-emerald-400/40 text-xs font-bold flex items-center gap-2 animate-in slide-in-from-top">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* 1. Directory Header: Strictly clean, only features "নতুন প্রতিনিধি যোগ করুন" */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-emerald-950 rounded-3xl p-5 sm:p-7 text-white shadow-xl border border-emerald-700/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2.5">
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

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                if (isAdmin) {
                  handleOpenAddModal();
                } else if (openAdminModal) {
                  openAdminModal();
                } else {
                  alert('নতুন প্রতিনিধি যোগ করার জন্য অনুগ্রহ করে অ্যাডমিন প্যানেলে লগইন করুন।');
                }
              }}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs sm:text-sm font-black transition cursor-pointer shadow-md active:scale-95 shrink-0"
            >
              <PlusCircle className="w-4 h-4 text-slate-950 shrink-0" />
              <span>নতুন প্রতিনিধি যোগ করুন</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Search Bar (Clean - Zero Category Filter Tabs) */}
      <div className="bg-white rounded-2xl p-2.5 sm:p-3 border border-slate-200 shadow-xs flex items-center gap-2">
        <Search className="w-5 h-5 text-slate-400 shrink-0 ml-1" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="প্রতিনিধির নাম, পদবি, সহায়তার বিষয় বা মোবাইল নম্বর দিয়ে খুঁজুন..."
          className="w-full text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none bg-transparent"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 3. Support Team Representatives Directory Cards (Strictly Card View Styled like Member List) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {filteredRepresentatives.map((rep) => {
          const cleanPhone = sanitizePhone(rep.phone);
          const hasPhoto = Boolean(rep.photoUrl);

          return (
            <div
              key={rep.id}
              className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 hover:border-emerald-300 hover:shadow-lg transition-all duration-300 flex flex-col justify-between space-y-4 group relative"
            >
              <div>
                {/* Top Row: Photo Avatar & Key Info */}
                <div className="flex items-start gap-3.5">
                  {/* Photo Box: Click to zoom */}
                  <div className="relative shrink-0">
                    <div
                      onClick={() => hasPhoto && setZoomedPhoto({ src: rep.photoUrl!, name: rep.name, designation: rep.designation })}
                      className={`w-20 h-20 sm:w-22 sm:h-22 rounded-2xl sm:rounded-3xl overflow-hidden border-2 flex items-center justify-center font-bold text-xl select-none shadow-xs ${
                        hasPhoto 
                          ? 'border-emerald-500 cursor-pointer group-hover:scale-105 transition-transform' 
                          : 'border-emerald-300 bg-emerald-50 text-emerald-800'
                      }`}
                      title={hasPhoto ? 'ছবি বড় করে দেখতে ক্লিক করুন' : rep.name}
                    >
                      {hasPhoto ? (
                        <img 
                          src={rep.photoUrl} 
                          alt={rep.name} 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-emerald-800">
                          <span className="text-2xl font-black">{rep.name.trim().charAt(0) || 'স'}</span>
                        </div>
                      )}
                    </div>

                    {/* Seniority Serial Badge */}
                    <span className="absolute -top-2 -left-1.5 px-2 py-0.5 rounded-md text-[10px] font-black bg-slate-900 text-white shadow-xs border border-slate-700">
                      #{toBengaliNumber(rep.serial || 1)}
                    </span>
                  </div>

                  {/* Representative Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 justify-between">
                      <h3 className="text-sm sm:text-base font-black text-slate-900 truncate">
                        {rep.name}
                      </h3>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span>সক্রিয়</span>
                      </span>
                    </div>

                    {/* Designation (পদবি) */}
                    <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-lg bg-emerald-100 text-emerald-900 border border-emerald-300/80">
                        {rep.designation}
                      </span>
                    </div>

                    {/* Available Hours (সময়সূচি) */}
                    {rep.availableHours && (
                      <div className="mt-1.5 flex items-center gap-1 text-[11px] text-slate-500 font-semibold">
                        <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{rep.availableHours}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Subject / Topic of Support (বিষয়) */}
                <div className="mt-3">
                  <div className="p-2 rounded-xl bg-teal-50 border border-teal-200/80 text-teal-950 text-xs font-bold flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded bg-teal-700 text-white text-[10px] font-black shrink-0">
                      বিষয়
                    </span>
                    <span className="truncate">{rep.subject}</span>
                  </div>
                </div>

                {/* Detailed Description / Instructions (ডেসক্রিপশন) */}
                <div className="mt-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl p-3 text-xs text-slate-700 leading-relaxed font-medium">
                  <p className="line-clamp-4 group-hover:line-clamp-none transition-all duration-300">
                    {rep.description}
                  </p>
                </div>
              </div>

              {/* Bottom Section: Mobile Number & Action Buttons */}
              <div className="pt-3 border-t border-slate-100 space-y-2.5">
                {/* Mobile Number Display with Copy Button */}
                <div className="flex items-center justify-between bg-slate-100/80 px-3 py-1.5 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-1.5 font-mono text-xs sm:text-sm font-black text-slate-900">
                    <Phone className="w-3.5 h-3.5 text-emerald-700" />
                    <span>{rep.phone}</span>
                  </div>

                  <button
                    onClick={() => handleCopyPhone(rep.phone)}
                    className="p-1 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-white transition cursor-pointer flex items-center gap-1 text-[11px] font-bold"
                    title="নম্বর কপি করুন"
                  >
                    {copiedPhone === rep.phone ? (
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

                {/* Direct Action Buttons: Call & WhatsApp */}
                <div className="grid grid-cols-2 gap-2">
                  <a
                    href={`tel:${cleanPhone}`}
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

                {/* Admin Management Controls */}
                {isAdmin && (
                  <div className="pt-2 flex items-center justify-end gap-2 border-t border-dashed border-slate-200">
                    <button
                      onClick={() => handleOpenEditModal(rep)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold transition border border-amber-200 cursor-pointer"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>সম্পাদনা</span>
                    </button>
                    <button
                      onClick={() => handleDeleteRepresentative(rep.id, rep.name)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition border border-rose-200 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>মুছুন</span>
                    </button>
                  </div>
                )}
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
          <button
            onClick={() => {
              if (isAdmin) {
                handleOpenAddModal();
              } else if (openAdminModal) {
                openAdminModal();
              } else {
                alert('নতুন প্রতিনিধি যোগ করার জন্য অনুগ্রহ করে অ্যাডমিন প্যানেলে লগইন করুন।');
              }
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-bold shadow-md transition active:scale-95 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>নতুন প্রতিনিধি যোগ করুন</span>
          </button>
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

      {/* 5. Admin Add / Edit Representative Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 my-8 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                <Headphones className="w-5 h-5 text-emerald-700" />
                <span>{editingMember ? 'প্রতিনিধির তথ্য সম্পাদনা' : 'নতুন সাপোর্ট প্রতিনিধি যোগ করুন'}</span>
              </h3>
              <button 
                onClick={() => setIsEditModalOpen(false)} 
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveRepresentative} className="space-y-3.5 text-xs">
              {/* Photo Upload */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">প্রোফাইল ছবি</label>
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-300 flex items-center justify-center overflow-hidden shrink-0">
                    {repPhoto ? (
                      <img src={repPhoto} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <Headphones className="w-6 h-6 text-slate-400" />
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                  />
                </div>
              </div>

              {/* Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    নাম
                  </label>
                  <input
                    type="text"
                    value={repName}
                    onChange={(e) => setRepName(e.target.value)}
                    placeholder="প্রতিনিধির পুরো নাম"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    মোবাইল নম্বর
                  </label>
                  <input
                    type="tel"
                    value={repPhone}
                    onChange={(e) => setRepPhone(e.target.value)}
                    placeholder="01886122678"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-mono"
                  />
                </div>
              </div>

              {/* Designation & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    পদবি (Designation)
                  </label>
                  <input
                    type="text"
                    value={repDesignation}
                    onChange={(e) => setRepDesignation(e.target.value)}
                    placeholder="যেমন: অর্থ সম্পাদক / ব্লাড কো-অর্ডিনেটর"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">ক্যাটাগরি</label>
                  <input
                    type="text"
                    value={repCategory}
                    onChange={(e) => setRepCategory(e.target.value)}
                    placeholder="যেমন: চিকিৎসা ফান্ড / রক্তদান উইং"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              {/* Subject / Topic */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  সহায়তার বিষয় (Subject/Topic)
                </label>
                <input
                  type="text"
                  value={repSubject}
                  onChange={(e) => setRepSubject(e.target.value)}
                  placeholder="যেমন: চিকিৎসা ফান্ড আবেদন ও অনুদান যাচাই"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-medium"
                />
              </div>

              {/* Detailed Description / Instructions */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  বিস্তারিত ডেসক্রিপশন / নির্দেশনা
                </label>
                <textarea
                  rows={3}
                  value={repDescription}
                  onChange={(e) => setRepDescription(e.target.value)}
                  placeholder="ব্যবহারকারীরা কোন কোন বিষয়ে এই প্রতিনিধির সাথে যোগাযোগ করতে পারবেন তার বিবরণ..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              {/* Available Hours */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">যোগাযোগের সময়সূচি</label>
                <input
                  type="text"
                  value={repAvailableHours}
                  onChange={(e) => setRepAvailableHours(e.target.value)}
                  placeholder="যেমন: সকাল ৯টা - রাত ১০টা / ২৪/৭ জরুরি সেবা"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
