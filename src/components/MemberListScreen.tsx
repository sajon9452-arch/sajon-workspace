import React, { useState, useMemo, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Phone, 
  MessageSquare, 
  Copy, 
  Check, 
  Filter, 
  ArrowLeft,
  UserCheck,
  MapPin,
  Edit2,
  Trash2,
  X,
  Upload,
  Camera,
  Image as ImageIcon,
  ShieldCheck,
  Maximize2,
  Globe
} from 'lucide-react';
import { Member } from '../types';
import { toBengaliNumber, sanitizePhone, sortMembersOldestFirst, getMemberPhotoUrl } from '../utils/helpers';
import { isExecutiveCommitteeMember, dispatchPreFilledMemberSms } from '../utils/meetingSmsHelper';
import { triggerNativeCall, triggerNativeSms } from '../utils/nativeIntentHelper';
import { compressImageFile } from '../utils/imageCompressor';
import { DueSmsModal } from './DueSmsModal';
import { loadPaymentSettings } from '../utils/storage';
import { 
  loadedPhotoCache, 
  failedPhotoCache, 
  preloadPhoto, 
  preloadMembersPhotos,
  getInstantPhotoUrl
} from '../utils/photoPreloader';

interface MemberListScreenProps {
  members: Member[];
  onAddMember: (member: Omit<Member, 'id'>) => void;
  onEditMember?: (member: Member) => void;
  onDeleteMember?: (id: string, name: string) => void;
  isAdmin?: boolean;
  onBack: () => void;
}

// Helper to determine whether a member is an expatriate member
export const isExpatriateMember = (m?: Member | null): boolean => {
  if (!m) return false;
  return Boolean(
    m.isExpatriate === true ||
    m.memberType === 'expatriate' ||
    (m.countryStatus && m.countryStatus.trim().length > 0)
  );
};

interface MemberCardPhotoProps {
  member: Member;
  serialNo: number;
  isExp: boolean;
  onZoom: () => void;
}

const MemberCardPhoto: React.FC<MemberCardPhotoProps> = React.memo(({
  member,
  serialNo,
  isExp,
  onZoom,
}) => {
  const photoSrc = useMemo(() => getInstantPhotoUrl(member), [member]);
  const [hasError, setHasError] = useState<boolean>(Boolean(photoSrc && failedPhotoCache.has(photoSrc)));

  useEffect(() => {
    if (!photoSrc) {
      setHasError(false);
      return;
    }
    if (failedPhotoCache.has(photoSrc)) {
      setHasError(true);
    } else {
      setHasError(false);
      preloadPhoto(photoSrc, member.id);
    }
  }, [photoSrc, member.id]);

  const hasRealPhoto = Boolean(photoSrc && !hasError);
  const canZoom = hasRealPhoto;

  return (
    <div
      onClick={canZoom ? onZoom : undefined}
      id={`member-photo-${member.id || serialNo}`}
      className={`w-20 h-24 sm:w-24 sm:h-28 rounded-xl border-2 border-emerald-500/30 text-emerald-800 flex flex-col items-center justify-center font-bold flex-shrink-0 overflow-hidden shadow-xs relative bg-slate-100 select-none ${
        canZoom ? 'cursor-pointer group/photo hover:border-emerald-500 transition-all active:scale-95' : ''
      }`}
      title={canZoom ? `${member.name}-এর ছবি বড় করে দেখতে ক্লিক করুন` : member.name}
      role={canZoom ? 'button' : undefined}
      aria-label={canZoom ? `${member.name}-এর ছবি জুম করে দেখুন` : undefined}
    >
      {/* 1. Direct Instant Image Rendering: Zero-delay display with asynchronous pre-decoding */}
      {hasRealPhoto ? (
        <img
          src={photoSrc}
          alt={member.name}
          loading="eager"
          decoding="async"
          // @ts-expect-error fetchpriority attribute is supported in modern browsers
          fetchpriority="high"
          onLoad={() => {
            loadedPhotoCache.add(photoSrc);
          }}
          onError={() => {
            failedPhotoCache.add(photoSrc);
            setHasError(true);
          }}
          className="absolute inset-0 w-full h-full object-cover z-1 group-hover/photo:scale-105 transition-transform duration-200"
          style={{ contentVisibility: 'auto' }}
        />
      ) : (
        /* 2. Fallback placeholder ONLY when no profile photo exists or loading strictly failed */
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2 bg-gradient-to-b from-emerald-50 via-slate-100 to-emerald-100/60 z-0">
          <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-base font-black mb-1 shadow-2xs border border-emerald-200/70">
            {member.name.trim().charAt(0) || 'স'}
          </div>
          <span className="text-[10px] font-bold text-slate-500">
            {isExp ? 'প্রবাসী' : 'সদস্য'}
          </span>
        </div>
      )}

      {/* 3. Hover Zoom Indicator Overlay */}
      {canZoom && (
        <div className="absolute inset-0 bg-slate-950/25 opacity-0 group-hover/photo:opacity-100 transition-opacity flex items-center justify-center pointer-events-none z-2">
          <div className="p-1.5 rounded-lg bg-black/60 text-white shadow-xs backdrop-blur-xs">
            <Maximize2 className="w-3.5 h-3.5" />
          </div>
        </div>
      )}

      {/* 4. Seniority / Serial Badge */}
      <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-black/70 backdrop-blur-xs text-white text-[9px] font-bold rounded-md z-3 shadow-xs">
        #{toBengaliNumber(serialNo)}
      </div>
    </div>
  );
});

export const MemberListScreen: React.FC<MemberListScreenProps> = ({
  members,
  onAddMember,
  onEditMember,
  onDeleteMember,
  isAdmin = false,
  onBack,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDesignation, setSelectedDesignation] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'general' | 'expatriate'>('general');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);
  const [zoomedMember, setZoomedMember] = useState<Member | null>(null);
  const [dueSmsMember, setDueSmsMember] = useState<Member | null>(null);
  const paymentConfig = useMemo(() => loadPaymentSettings(), []);

  // Close zoom modal on escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setZoomedMember(null);
      }
    };
    if (zoomedMember) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [zoomedMember]);

  // Form State
  const [name, setName] = useState('');
  const [designation, setDesignation] = useState('');
  const [phone, setPhone] = useState('');
  const [area, setArea] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [isExpatriateForm, setIsExpatriateForm] = useState(false);
  const [countryStatus, setCountryStatus] = useState('');
  const [formError, setFormError] = useState('');

  const handlePhotoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setFormError('ছবির সাইজ সর্বোচ্চ ১০ মেগাবাইট হতে পারবে');
        return;
      }
      setFormError('');
      try {
        const compressed = await compressImageFile(file, { maxWidth: 800, maxHeight: 800, quality: 0.8 });
        setPhotoUrl(compressed);
      } catch (err) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPhotoUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  // Background preloader for instant photo rendering without any scroll flashing
  useEffect(() => {
    if (Array.isArray(members) && members.length > 0) {
      preloadMembersPhotos(members);
    }
  }, [members]);

  // Strictly sort members in ascending (oldest-first) order by registration/addition time
  // Earliest added members stay at the top (starting from #1) and new members append to the bottom
  const sortedMembers = useMemo(() => {
    return sortMembersOldestFirst(members);
  }, [members]);

  // Split into mutually exclusive lists: General members and Expatriate members
  const generalMembers = useMemo(() => {
    return sortedMembers.filter(m => !isExpatriateMember(m));
  }, [sortedMembers]);

  const expatriateMembers = useMemo(() => {
    return sortedMembers.filter(m => isExpatriateMember(m));
  }, [sortedMembers]);

  // Exclusive visibility: Current active member list
  const currentMembersList = useMemo(() => {
    return activeTab === 'general' ? generalMembers : expatriateMembers;
  }, [activeTab, generalMembers, expatriateMembers]);

  // Master serial number lookup for the active list respecting registration order / seniority (#১ থেকে শুরু)
  const memberSerialMap = useMemo(() => {
    const map = new Map<string, number>();
    currentMembersList.forEach((m, idx) => {
      map.set(m.id, idx + 1);
    });
    return map;
  }, [currentMembersList]);

  // Extract unique designations for filter from active list
  const designations = useMemo(() => {
    const set = new Set(currentMembersList.map(m => m.designation).filter(Boolean));
    return Array.from(set);
  }, [currentMembersList]);

  // Filtered members list strictly maintaining ascending / oldest-first seniority hierarchy
  const filteredMembers = useMemo(() => {
    return currentMembersList.filter(m => {
      const matchesSearch = 
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.phone.includes(searchTerm) ||
        m.designation.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (m.countryStatus && m.countryStatus.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (m.area && m.area.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesDesignation = selectedDesignation === 'all' || m.designation === selectedDesignation;

      return matchesSearch && matchesDesignation;
    });
  }, [currentMembersList, searchTerm, selectedDesignation]);

  const handleCopyPhone = (phoneNumber: string) => {
    navigator.clipboard.writeText(phoneNumber);
    setCopiedPhone(phoneNumber);
    setTimeout(() => setCopiedPhone(null), 2000);
  };

  const handleOpenEdit = (m: Member) => {
    const isExp = isExpatriateMember(m);
    setEditingMember(m);
    setName(m.name);
    setDesignation(m.designation);
    setPhone(m.phone);
    setArea(m.area || (isExp ? '' : 'পতেঙ্গা, চট্টগ্রাম'));
    setPhotoUrl(getMemberPhotoUrl(m));
    setIsExpatriateForm(isExp);
    setCountryStatus(m.countryStatus || '');
    setFormError('');
    setIsAddModalOpen(true);
  };

  const handleOpenAdd = (forceExpatriate?: boolean) => {
    const isExp = typeof forceExpatriate === 'boolean' ? forceExpatriate : activeTab === 'expatriate';
    setEditingMember(null);
    setName('');
    setDesignation('');
    setPhone('');
    setArea(isExp ? '' : 'পতেঙ্গা, চট্টগ্রাম');
    setPhotoUrl('');
    setIsExpatriateForm(isExp);
    setCountryStatus(''); // STRICTLY BLANK: No default or hardcoded value
    setFormError('');
    setIsAddModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('সদস্যের নাম লিখুন');
      return;
    }
    if (!designation.trim()) {
      setFormError('সদস্যের পদবি লিখুন');
      return;
    }
    if (!phone.trim()) {
      setFormError('মোবাইল নম্বর লিখুন');
      return;
    }

    const finalPhoto = photoUrl.trim() || '';
    const isExec = isExecutiveCommitteeMember({ designation });
    const memberPayload = {
      name: name.trim(),
      designation: designation.trim(),
      phone: phone.trim(),
      area: area.trim() || (isExpatriateForm ? 'প্রবাসী' : 'পতেঙ্গা, চট্টগ্রাম'),
      photoUrl: finalPhoto,
      avatarUrl: finalPhoto,
      photo_url: finalPhoto,
      isExpatriate: isExpatriateForm,
      isExecutive: isExec,
      category: isExec ? 'কার্যকরী কমিটি' : 'সাধারণ সদস্য',
      committeeType: isExec ? 'executive' : 'general',
      memberType: (isExpatriateForm ? 'expatriate' : 'general') as 'expatriate' | 'general',
      countryStatus: isExpatriateForm ? countryStatus.trim() : undefined,
    };

    if (editingMember) {
      if (onEditMember) {
        onEditMember({
          ...editingMember,
          ...memberPayload,
        });
      }
    } else {
      onAddMember({
        ...memberPayload,
        joinDate: new Date().toISOString().split('T')[0],
        status: 'সক্রিয়'
      });
    }

    // Automatically navigate to the corresponding tab if different
    if (isExpatriateForm && activeTab !== 'expatriate') {
      setActiveTab('expatriate');
    } else if (!isExpatriateForm && activeTab !== 'general') {
      setActiveTab('general');
    }

    setName('');
    setDesignation('');
    setPhone('');
    setArea('');
    setPhotoUrl('');
    setCountryStatus('');
    setIsExpatriateForm(false);
    setEditingMember(null);
    setFormError('');
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-5 animate-fadeIn pb-12">
      {/* Top Breadcrumb & Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            id="members-back-btn"
            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition"
            title="হোমে ফিরুন"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
              <span className="text-xs font-semibold text-emerald-700">পতেঙ্গা, চট্টগ্রাম • সদস্য ডিরেক্টরি</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-600" />
              সদস্য তালিকা (Members)
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Admin Only: Add Member Button */}
          {isAdmin && (
            <button
              onClick={() => handleOpenAdd(activeTab === 'expatriate')}
              id="members-add-new-btn"
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{activeTab === 'expatriate' ? 'নতুন প্রবাসী সদস্য যোগ' : 'নতুন সদস্য যোগ'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              id="members-search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="নাম, পদবি, এলাকা, দেশ বা ফোন নম্বর দিয়ে সদস্য খুঁজুন..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Designation Dropdown */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs text-slate-500 font-medium whitespace-nowrap">পদবি:</span>
            <select
              value={selectedDesignation}
              onChange={(e) => setSelectedDesignation(e.target.value)}
              id="filter-designation-select"
              className="bg-transparent text-xs text-slate-700 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="all">সকল পদবি ({toBengaliNumber(currentMembersList.length)})</option>
              {designations.map(des => (
                <option key={des} value={des}>{des}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Mutually Exclusive Tabs: General Members vs Expatriate Members */}
      <div className="bg-slate-100 p-1.5 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              setActiveTab('general');
              setSelectedDesignation('all');
            }}
            id="tab-general-members"
            className={`flex items-center justify-center gap-2 py-2.5 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'general'
                ? 'bg-white text-emerald-800 shadow-xs border border-emerald-500/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <Users className={`w-4 h-4 ${activeTab === 'general' ? 'text-emerald-600' : 'text-slate-400'}`} />
            <span className="truncate">সদস্য তালিকা</span>
            <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold shrink-0 ${
              activeTab === 'general' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
            }`}>
              {toBengaliNumber(generalMembers.length)}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('expatriate');
              setSelectedDesignation('all');
            }}
            id="tab-expatriate-members"
            className={`flex items-center justify-center gap-2 py-2.5 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'expatriate'
                ? 'bg-white text-emerald-800 shadow-xs border border-emerald-500/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <Globe className={`w-4 h-4 ${activeTab === 'expatriate' ? 'text-emerald-600' : 'text-slate-400'}`} />
            <span className="truncate">প্রবাসী সদস্য তালিকা</span>
            <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold shrink-0 ${
              activeTab === 'expatriate' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
            }`}>
              {toBengaliNumber(expatriateMembers.length)}
            </span>
          </button>
        </div>
      </div>

      {/* Member Cards Grid */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 px-1 text-xs text-slate-500">
          <div className="flex flex-wrap items-center gap-2">
            <span>
              {activeTab === 'general' ? 'মোট সাধারণ সদস্য: ' : 'মোট প্রবাসী সদস্য: '}
              <strong className="text-slate-800 font-bold">{toBengaliNumber(filteredMembers.length)}</strong> জন
            </span>
            <span className="hidden sm:inline text-slate-300">•</span>
            <span className="inline-flex items-center gap-1.5 text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full font-semibold border border-emerald-200/70">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              জ্যেষ্ঠতা ক্রম অনুসারে সজ্জিত (#১ থেকে শুরু)
            </span>
          </div>
          <span>{activeTab === 'general' ? 'ঠিকানা: পতেঙ্গা, চট্টগ্রাম' : 'প্রবাসী ভাইদের তালিকা'}</span>
        </div>

        {filteredMembers.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 text-center border-2 border-dashed border-slate-200 shadow-xs">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3 border border-emerald-100">
              {activeTab === 'expatriate' ? <Globe className="w-8 h-8" /> : <Users className="w-8 h-8" />}
            </div>
            <h4 className="text-base font-bold text-slate-800">
              {searchTerm || selectedDesignation !== 'all' 
                ? 'কোনো সদস্য পাওয়া যায়নি' 
                : (activeTab === 'general' ? 'সাধারণ সদস্য তালিকা বর্তমানে সম্পূর্ণ খালি' : 'প্রবাসী সদস্য তালিকা বর্তমানে সম্পূর্ণ খালি')}
            </h4>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
              {searchTerm || selectedDesignation !== 'all' 
                ? 'আপনার সার্চ বা ফিল্টারের সাথে মিলে এমন কোনো সদস্য নেই। ফিল্টার রিসেট করে আবার চেষ্টা করুন।'
                : (activeTab === 'general'
                    ? 'সংগঠনে এখনও কোনো সাধারণ সদস্য অন্তর্ভুক্ত করা হয়নি। অ্যাডমিন প্যানেল থেকে লগইন করে নতুন সদস্যদের নাম, পদবি, মোবাইল নম্বর ও ছবি যুক্ত করুন।'
                    : 'সংগঠনে এখনও কোনো প্রবাসী সদস্য অন্তর্ভুক্ত করা হয়নি। নতুন প্রবাসী সদস্য যুক্ত করতে উপরের বাটনে ক্লিক করুন।')}
            </p>
            {isAdmin && (
              <button
                onClick={() => handleOpenAdd(activeTab === 'expatriate')}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{activeTab === 'expatriate' ? 'নতুন প্রবাসী সদস্য যুক্ত করুন' : 'নতুন সদস্য যুক্ত করুন'}</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredMembers.map((member, idx) => {
              const cleanPhone = sanitizePhone(member.phone);
              const serialNo = memberSerialMap.get(member.id) || (idx + 1);
              const isExp = isExpatriateMember(member);

              return (
                <div
                  key={member.id || idx}
                  id={`member-card-${member.id || idx}`}
                  className="bg-white rounded-2xl border border-slate-200/90 hover:border-emerald-400/80 transition-all duration-200 shadow-xs hover:shadow-md overflow-hidden flex flex-col justify-between"
                >
                  {/* Top ID Card Header Strip */}
                  <div className="h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600"></div>

                  <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                    {/* Seniority Hierarchy & Serial Header */}
                    <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-slate-100">
                      <div className="flex items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-emerald-600 text-white text-xs font-bold shadow-2xs">
                          <span>ক্রমিক #{toBengaliNumber(serialNo)}</span>
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium">
                          (জ্যেষ্ঠতা ক্রম)
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {member.countryStatus ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-800 text-[11px] font-bold border border-blue-200/80">
                            <Globe className="w-3 h-3 text-blue-600" />
                            <span>{member.countryStatus}</span>
                          </span>
                        ) : isExp ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-800 text-[11px] font-bold border border-blue-200/80">
                            <Globe className="w-3 h-3 text-blue-600" />
                            <span>প্রবাসী সদস্য</span>
                          </span>
                        ) : null}

                        {!isExp && member.bloodGroup && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 text-[11px] font-bold border border-rose-200/70">
                            রক্ত: {member.bloodGroup}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[11px] font-semibold border border-emerald-200/60">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          <span>{isExp ? 'প্রবাসী' : 'সক্রিয়'}</span>
                        </span>
                      </div>
                    </div>

                    {/* Professional ID Card Body */}
                    <div className="flex items-start gap-4">
                      {/* Large ID Card Portrait Photo with Seniority Badge & Click-to-Zoom */}
                      <MemberCardPhoto
                        member={member}
                        serialNo={serialNo}
                        isExp={isExp}
                        onZoom={() => setZoomedMember(member)}
                      />
                      
                      {/* Member Info Column */}
                      <div className="flex-1 min-w-0 flex flex-col justify-center space-y-2 py-0.5">
                        <h3 className="font-bold text-slate-900 text-base sm:text-lg leading-snug break-words">
                          {member.name}
                        </h3>

                        <div>
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200/70">
                            <UserCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                            <span>{member.designation}</span>
                          </span>
                        </div>

                        {/* Expatriate Country */}
                        {isExp && (
                          <p className="text-xs font-semibold text-blue-700 flex items-center gap-1.5">
                            <Globe className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                            <span>দেশ: {member.countryStatus || 'সৌদি আরব'}</span>
                          </p>
                        )}

                        {/* Location */}
                        <p className="text-xs text-slate-600 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span className="truncate">
                            {isExp 
                              ? `অবস্থান: ${member.area || 'প্রবাসী'}` 
                              : (member.area || 'পতেঙ্গা, চট্টগ্রাম')}
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* Actions & Phone Bar - Completely removed for Expatriate members */}
                    {!isExp ? (
                      <div className="mt-4 pt-3.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-mono font-bold text-slate-800 tracking-wide">
                            {member.phone}
                          </span>
                          <button
                            onClick={() => handleCopyPhone(member.phone)}
                            id={`member-copy-${member.id || idx}`}
                            className="p-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs transition cursor-pointer"
                            title="নম্বর কপি করুন"
                          >
                            {copiedPhone === member.phone ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {/* Inline Admin Controls */}
                          {isAdmin && (
                            <div className="flex items-center gap-1 mr-1 pr-1 border-r border-slate-200">
                              <button
                                onClick={() => handleOpenEdit(member)}
                                className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs transition cursor-pointer"
                                title="সদস্য এডিট করুন"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              {onDeleteMember && (
                                <button
                                  onClick={() => onDeleteMember(member.id, member.name)}
                                  className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-xs transition cursor-pointer"
                                  title="সদস্য ডিলিট করুন"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          )}

                          {isAdmin && (
                            <button
                              onClick={() => setDueSmsMember(member)}
                              className="px-2 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold transition flex items-center gap-1 border border-amber-200 cursor-pointer shadow-2xs"
                              title="বকেয়া চাঁদা রিমাইন্ডার SIM SMS পাঠান (কাস্টম মাসসহ)"
                            >
                              <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
                              <span className="text-[10px] hidden sm:inline">বকেয়া SMS</span>
                            </button>
                          )}

                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => dispatchPreFilledMemberSms(member)}
                              id={`member-sms-btn-${member.id || idx}`}
                              className="px-2 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition flex items-center gap-1 border border-indigo-200/80 cursor-pointer shadow-2xs active:scale-95"
                              title="এসএমএস পাঠান (প্রাক-নির্ধারিত মিটিং নোটিশসহ)"
                            >
                              <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
                              <span className="hidden sm:inline">এসএমএস পাঠান</span>
                              <span className="sm:hidden">এসএমএস</span>
                            </button>
                          )}

                          <a
                            href={`https://wa.me/${cleanPhone.replace('+', '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold transition flex items-center gap-1 border border-emerald-200/70"
                            title="হোয়াটসঅ্যাপে বার্তা পাঠান"
                          >
                            <span>WA</span>
                          </a>

                          <button
                            type="button"
                            onClick={() => triggerNativeCall(cleanPhone)}
                            id={`member-call-${member.id || idx}`}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs cursor-pointer active:scale-98"
                            title="সরাসরি কল দিন"
                          >
                            <Phone className="w-3 h-3" />
                            <span>কল</span>
                          </button>
                        </div>
                      </div>
                    ) : isAdmin ? (
                      /* For Expatriate Members: completely NO phone, NO copy, NO WA, NO Call. If Admin: provide edit/delete options */
                      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(member)}
                          className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold transition cursor-pointer flex items-center gap-1"
                          title="প্রবাসী সদস্যের তথ্য এডিট করুন"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>এডিট</span>
                        </button>
                        {onDeleteMember && (
                          <button
                            onClick={() => onDeleteMember(member.id, member.name)}
                            className="px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold transition cursor-pointer flex items-center gap-1"
                            title="প্রবাসী সদস্য ডিলিট করুন"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>ডিলিট</span>
                          </button>
                        )}
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add / Edit Member Modal (Admin Only Triggered) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 flex flex-col max-h-[92dvh] sm:max-h-[88vh] animate-scaleUp overflow-hidden my-auto">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white z-10">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                {isExpatriateForm ? (
                  <Globe className="w-5 h-5 text-blue-600" />
                ) : (
                  <Users className="w-5 h-5 text-emerald-600" />
                )}
                {editingMember
                  ? (isExpatriateForm ? 'প্রবাসী সদস্যের তথ্য সম্পাদনা' : 'সদস্যের তথ্য সম্পাদনা')
                  : (isExpatriateForm ? 'নতুন প্রবাসী সদস্য যুক্তকরণ' : 'নতুন সদস্য যুক্তকরণ')}
              </h3>
              <button
                onClick={() => { setIsAddModalOpen(false); setEditingMember(null); }}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                title="বন্ধ করুন"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Flexible Scrollable Body (AlwaysScrollableScrollPhysics equivalent) */}
            <div
              className="flex-1 overflow-y-auto overscroll-contain px-5 py-4 sm:p-6"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              {/* Member Type Switcher */}
              <div className="flex items-center p-1 bg-slate-100 rounded-xl mb-3.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsExpatriateForm(false);
                    if (!area || area === 'প্রবাসী') setArea('পতেঙ্গা, চট্টগ্রাম');
                  }}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    !isExpatriateForm ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>সাধারণ সদস্য</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsExpatriateForm(true);
                    if (area === 'পতেঙ্গা, চট্টগ্রাম') setArea('');
                  }}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    isExpatriateForm ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5 text-blue-600" />
                  <span>প্রবাসী সদস্য</span>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3.5">
              {formError && (
                <div className="p-2.5 rounded-lg bg-red-50 text-red-700 text-xs font-medium border border-red-200">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  সদস্যের নাম (Name) *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="যেমন: মোহাম্মদ সাহেদুল আলম"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                    <span>পদবি (Designation) *</span>
                    <span className="text-[10px] text-emerald-700 font-medium">পদবি অনুযায়ী স্বয়ংক্রিয় শ্রেণিবিভাগ</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    placeholder="যেমন: সাধারণ সম্পাদক / সভাপতি / সদস্য"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
                  />
                  {/* Quick Designation Presets */}
                  <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                    {['সদস্য', 'সভাপতি', 'সাধারণ সম্পাদক', 'সহ-সভাপতি', 'সাংগঠনিক সম্পাদক', 'কোষাধ্যক্ষ', 'সহ-ক্রীড়া সম্পাদক', 'উপদেষ্টা'].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setDesignation(preset)}
                        className={`text-[10px] px-2 py-0.5 rounded-md border transition cursor-pointer ${
                          designation === preset
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    মোবাইল নম্বর (Phone) *
                  </label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="যেমন: 01811-XXXXXX"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* Dynamic Designation-Based Auto-Classification Card */}
              {(() => {
                const isExec = isExecutiveCommitteeMember({ designation });
                return (
                  <div className={`p-2.5 rounded-xl border flex items-center justify-between gap-2.5 transition ${
                    isExec 
                      ? 'bg-purple-50/80 border-purple-200 text-purple-900' 
                      : 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                  }`}>
                    <div className="flex items-center gap-2 min-w-0">
                      {isExec ? (
                        <ShieldCheck className="w-4 h-4 text-purple-600 shrink-0" />
                      ) : (
                        <Users className="w-4 h-4 text-emerald-600 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <div className="text-xs font-bold flex items-center gap-1.5 flex-wrap">
                          <span>স্বয়ংক্রিয় শ্রেণিবিভাগ:</span>
                          <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                            isExec ? 'bg-purple-200 text-purple-900' : 'bg-emerald-200 text-emerald-900'
                          }`}>
                            {isExec ? 'কার্যকরী কমিটি (Executive Committee)' : 'সাধারণ সদস্য (General Member)'}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-600 mt-0.5 leading-tight">
                          {isExec 
                            ? "পদবিতে 'সদস্য' না থাকায় ইনি স্বয়ংক্রিয়ভাবে কার্যকরী কমিটির মিটিং ও যৌথ সাধারণ সভা উভয় এসএমএস তালিকায় অন্তর্ভুক্ত হবেন।" 
                            : "পদবিতে 'সদস্য' থাকায় ইনি সাধারণ সদস্য হিসেবে শ্রেণিভুক্ত এবং যৌথ সাধারণ সভার এসএমএসে অন্তর্ভুক্ত হবেন।"}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Dedicated Expatriate Country / Status Title Input (Blank by default) */}
              {isExpatriateForm && (
                <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200/80 space-y-1">
                  <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-blue-600" />
                      <span>প্রবাসী দেশ / স্ট্যাটাস (Country / Status Title)</span>
                    </span>
                    <span className="text-[10px] text-blue-700 font-semibold">ঐচ্ছিক / টাইপ করুন</span>
                  </label>
                  <input
                    type="text"
                    id="member-country-status-input"
                    value={countryStatus}
                    onChange={(e) => setCountryStatus(e.target.value)}
                    placeholder="যেমন: সৌদি প্রবাসী, দুবাই প্রবাসী, কাতার প্রবাসী"
                    className="w-full px-3 py-2 border border-blue-200 focus:border-blue-500 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:outline-none bg-white font-medium"
                  />
                  <p className="text-[10px] text-slate-500 leading-tight pt-0.5">
                    দেশ বা স্ট্যাটাস টাইটেল ম্যানুয়ালি লিখে দিন (যেমন: সৌদি প্রবাসী, ওমান প্রবাসী ইত্যাদি)। কোনো ডিফল্ট বা হার্ডকোডেড মান রাখা হয়নি।
                  </p>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isExpatriateForm ? 'কর্মস্থল / বর্তমান ঠিকানা বা এলাকা (ঐচ্ছিক)' : 'এলাকা / ঠিকানা (ঐচ্ছিক)'}
                </label>
                <input
                  type="text"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  placeholder={isExpatriateForm ? 'যেমন: রিয়াদ, সৌদি আরব / দুবাই' : 'যেমন: কাঠগড়, পতেঙ্গা, চট্টগ্রাম'}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span>সদস্যের ছবি (মোবাইল গ্যালারি থেকে আপলোড)</span>
                  <span className="text-[11px] text-slate-400 font-normal">ঐচ্ছিক</span>
                </label>
                <input
                  type="file"
                  id="member-photo-gallery-picker"
                  accept="image/*"
                  onChange={handlePhotoFileChange}
                  className="hidden"
                />

                {photoUrl ? (
                  <div className="flex items-center gap-3.5 bg-emerald-50/70 p-3 rounded-2xl border border-emerald-200">
                    <div className="w-16 h-16 rounded-2xl border-2 border-emerald-500 overflow-hidden flex-shrink-0 bg-white shadow-xs">
                      <img 
                        src={photoUrl} 
                        alt="Preview" 
                        className="w-full h-full object-cover" 
                      />
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span>গ্যালারি থেকে ছবি সিলেক্ট করা হয়েছে</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => document.getElementById('member-photo-gallery-picker')?.click()}
                          className="px-2.5 py-1 bg-white hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg border border-emerald-300 transition flex items-center gap-1 cursor-pointer"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          <span>পরিবর্তন</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setPhotoUrl('')}
                          className="px-2.5 py-1 bg-white hover:bg-rose-50 text-rose-600 text-xs font-bold rounded-lg border border-rose-200 transition cursor-pointer"
                        >
                          মুছুন
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => document.getElementById('member-photo-gallery-picker')?.click()}
                    className="w-full py-4 px-4 border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl bg-slate-50 hover:bg-emerald-50/40 text-slate-600 hover:text-emerald-800 transition flex flex-col items-center justify-center gap-1.5 cursor-pointer group"
                  >
                    <div className="w-10 h-10 rounded-full bg-white shadow-2xs border border-slate-200 group-hover:border-emerald-300 flex items-center justify-center text-emerald-600">
                      <Upload className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-slate-800 group-hover:text-emerald-700">
                      ফোনের গ্যালারি থেকে ছবি নির্বাচন করুন
                    </span>
                    <span className="text-[10px] text-slate-400">
                      ট্যাপ করে গ্যালারি বা ক্যামেরা থেকে ছবি নিন (JPG, PNG, WEBP)
                    </span>
                  </button>
                )}
              </div>

              {!editingMember && (
                <div className="p-3 bg-emerald-50/80 border border-emerald-200/80 rounded-xl text-xs text-emerald-900 flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="font-bold text-emerald-950">জ্যেষ্ঠতা রক্ষা ও সিরিয়াল নীতি:</p>
                    <p className="text-[11px] text-emerald-800 leading-relaxed">
                      নতুন সদস্যের তথ্য তালিকার সবার শেষে (ক্রমিক #{toBengaliNumber(currentMembersList.length + 1)}) যুক্ত হবে। আগের সদস্যদের জ্যেষ্ঠতা ও ক্রমিক নম্বর সম্পূর্ণ অক্ষুণ্ণ থাকবে।
                    </p>
                  </div>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => { setIsAddModalOpen(false); setEditingMember(null); }}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  id="members-submit-btn"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition cursor-pointer"
                >
                  {editingMember ? 'আপডেট সম্পন্ন করুন' : 'সংরক্ষণ করুন'}
                </button>
              </div>

              {/* Generous Bottom Padding (100px) ensuring action buttons sit completely above the system navigation bar */}
              <div className="h-24 sm:h-28 w-full shrink-0" aria-hidden="true" style={{ minHeight: '100px' }} />
            </form>
          </div>
        </div>
      </div>
    )}

      {/* Member Profile Picture Click-to-Zoom Modal */}
      {zoomedMember && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-fadeIn"
          onClick={() => setZoomedMember(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="member-zoom-title"
        >
          <div
            className="relative max-w-lg w-full bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-200/90 animate-scaleUp flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header: Member's Name & Clear Close ('X') Button */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/70">
              <div className="min-w-0 pr-2">
                <h3
                  id="member-zoom-title"
                  className="font-bold text-slate-900 text-base sm:text-lg truncate flex items-center gap-2"
                >
                  <span>{zoomedMember.name}</span>
                </h3>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200/70">
                    <UserCheck className="w-3 h-3 text-emerald-600" />
                    <span>{zoomedMember.designation}</span>
                  </span>
                  {zoomedMember.countryStatus && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 text-xs font-bold border border-blue-200/70">
                      <Globe className="w-3 h-3 text-blue-600" />
                      <span>{zoomedMember.countryStatus}</span>
                    </span>
                  )}
                  {memberSerialMap.get(zoomedMember.id) && (
                    <span className="text-xs text-slate-400 font-medium">
                      ক্রমিক #{toBengaliNumber(memberSerialMap.get(zoomedMember.id)!)}
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={() => setZoomedMember(null)}
                id="close-member-zoom-btn"
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition cursor-pointer flex-shrink-0"
                title="বন্ধ করুন (Esc)"
                aria-label="বন্ধ করুন"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Large High-Resolution Member Photo */}
            <div className="p-4 sm:p-5 flex-1 flex items-center justify-center bg-slate-950 overflow-hidden">
              {(() => {
                const zoomPhoto = getMemberPhotoUrl(zoomedMember);
                return zoomPhoto ? (
                  <div className="relative w-full flex items-center justify-center max-h-[65vh]">
                    <img
                      src={zoomPhoto}
                      alt={zoomedMember.name}
                      loading="eager"
                      decoding="async"
                      className="w-full h-auto max-h-[65vh] object-contain rounded-2xl select-none shadow-lg"
                    />
                  </div>
                ) : (
                  <div className="py-16 text-center text-slate-400">
                    <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-3xl font-bold mx-auto mb-2">
                      {zoomedMember.name.charAt(0)}
                    </div>
                    <p className="text-sm font-semibold text-slate-300">কোনো ছবি সংরক্ষিত নেই</p>
                  </div>
                );
              })()}
            </div>

            {/* Modal Footer: Location and Direct Contact Bar */}
            <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs text-slate-600 truncate">
                <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                <span className="truncate">
                  {isExpatriateMember(zoomedMember)
                    ? (zoomedMember.countryStatus ? `${zoomedMember.countryStatus} • ${zoomedMember.area || 'প্রবাসী'}` : (zoomedMember.area || 'প্রবাসী'))
                    : (zoomedMember.area || 'পতেঙ্গা, চট্টগ্রাম')}
                </span>
              </div>

              {!isExpatriateMember(zoomedMember) && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => triggerNativeCall(zoomedMember.phone)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs cursor-pointer active:scale-98"
                    title="সরাসরি ফোন কল করুন"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>কল করুন ({zoomedMember.phone})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => dispatchPreFilledMemberSms(zoomedMember)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition shadow-xs border border-indigo-200 cursor-pointer active:scale-95"
                    title="এসএমএস পাঠান (প্রাক-নির্ধারিত মিটিং নোটিশসহ)"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
                    <span>এসএমএস পাঠান</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Due Reminder Direct SIM SMS Modal with Custom Months Selection */}
      <DueSmsModal
        isOpen={!!dueSmsMember}
        onClose={() => setDueSmsMember(null)}
        target={dueSmsMember ? {
          memberName: dueSmsMember.name,
          phone: dueSmsMember.phone,
          memberId: dueSmsMember.id
        } : null}
        paymentConfig={paymentConfig}
      />
    </div>
  );
};
