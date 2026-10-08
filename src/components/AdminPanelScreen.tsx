import React, { useState, useMemo } from 'react';
import { 
  Settings, 
  Users, 
  CreditCard, 
  Building, 
  KeyRound, 
  Save, 
  CheckCircle2, 
  AlertCircle,
  PlusCircle,
  Edit,
  Trash2,
  Lock,
  Cloud,
  Search,
  X,
  Phone,
  MapPin,
  Globe,
  ShieldCheck,
  UserPlus
} from 'lucide-react';
import { 
  OrganizationProfile, 
  Member, 
  BloodDonor, 
  PaymentGatewayConfig 
} from '../types';
import { 
  toBengaliNumber, 
  sortMembersOldestFirst,
  isExecutiveCommitteeMember,
  isExpatriateMember,
  getMemberPhotoUrl,
  sanitizePhone
} from '../utils/helpers';
import { saveAdminPin } from '../utils/storage';
import { checkSupabaseConnection, SUPABASE_URL } from '../utils/supabaseClient';
import { compressImageFile } from '../utils/imageCompressor';

interface AdminPanelScreenProps {
  profile: OrganizationProfile;
  onUpdateProfile: (profile: OrganizationProfile) => void;
  members: Member[];
  onAddMember: (member: Omit<Member, 'id'>) => Promise<Member>;
  onEditMember: (member: Member) => Promise<void>;
  onDeleteMember: (id: string) => Promise<void>;
  donors: BloodDonor[];
  onAddDonor: (donor: Omit<BloodDonor, 'id'>) => Promise<BloodDonor>;
  onEditDonor: (donor: BloodDonor) => Promise<void>;
  onDeleteDonor: (id: string) => Promise<void>;
  funds: any[];
  paymentConfig: PaymentGatewayConfig;
  onUpdatePaymentConfig: (config: PaymentGatewayConfig) => void;
  onBack: () => void;
}

export const AdminPanelScreen: React.FC<AdminPanelScreenProps> = ({
  profile,
  onUpdateProfile,
  members,
  onAddMember,
  onEditMember,
  onDeleteMember,
  paymentConfig,
  onUpdatePaymentConfig,
  onBack
}) => {
  const [activeTab, setActiveTab] = useState<'members' | 'profile' | 'payments' | 'security'>('members');
  
  // Member Management States
  const [memberSearch, setMemberSearch] = useState('');
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [deletingMemberId, setDeletingMemberId] = useState<string | null>(null);

  // Member Form (No blood group, No email)
  const [memName, setMemName] = useState('');
  const [memDesignation, setMemDesignation] = useState('সাধারণ সদস্য');
  const [memPhone, setMemPhone] = useState('');
  const [memArea, setMemArea] = useState('পতেঙ্গা, চট্টগ্রাম');
  const [memIsExecutive, setMemIsExecutive] = useState(false);
  const [memIsExpatriate, setMemIsExpatriate] = useState(false);
  const [memCountry, setMemCountry] = useState('');
  const [memPhoto, setMemPhoto] = useState('');
  const [memFormError, setMemFormError] = useState('');
  const [isSavingMember, setIsSavingMember] = useState(false);

  // Profile Form
  const [name, setName] = useState(profile.name);
  const [tagline, setTagline] = useState(profile.tagline);
  const [establishedDate, setEstablishedDate] = useState(profile.establishedDate);
  const [establishedYear, setEstablishedYear] = useState(profile.establishedYear);
  const [address, setAddress] = useState(profile.address);
  const [hotline, setHotline] = useState(profile.hotline);
  const [regNumber, setRegNumber] = useState(profile.regNumber);
  const [phone, setPhone] = useState(profile.phone);
  const [email, setEmail] = useState(profile.email);

  // Payment Form
  const [bkashNumber, setBkashNumber] = useState(paymentConfig.bkashNumber);
  const [bkashType, setBkashType] = useState(paymentConfig.bkashType);
  const [nagadNumber, setNagadNumber] = useState(paymentConfig.nagadNumber);
  const [nagadType, setNagadType] = useState(paymentConfig.nagadType);
  const [rocketNumber, setRocketNumber] = useState(paymentConfig.rocketNumber);
  const [rocketType, setRocketType] = useState(paymentConfig.rocketType);

  // PIN Form
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  
  const [noticeMsg, setNoticeMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [supabaseStatus, setSupabaseStatus] = useState<string>('সংযোগ সক্রিয়');

  React.useEffect(() => {
    checkSupabaseConnection().then(res => setSupabaseStatus(res.message));
  }, []);

  // Sorted members
  const sortedMembers = useMemo(() => {
    return sortMembersOldestFirst(members);
  }, [members]);

  // Filtered members in Admin
  const filteredMembers = useMemo(() => {
    if (!memberSearch.trim()) return sortedMembers;
    const q = memberSearch.trim().toLowerCase();
    return sortedMembers.filter(m => 
      m.name.toLowerCase().includes(q) ||
      (m.phone || '').includes(q) ||
      (m.designation || '').toLowerCase().includes(q) ||
      (m.area || '').toLowerCase().includes(q)
    );
  }, [sortedMembers, memberSearch]);

  const handleOpenAddModal = () => {
    setMemName('');
    setMemDesignation('সাধারণ সদস্য');
    setMemPhone('');
    setMemArea('পতেঙ্গা, চট্টগ্রাম');
    setMemIsExecutive(false);
    setMemIsExpatriate(false);
    setMemCountry('');
    setMemPhoto('');
    setMemFormError('');
    setIsAddMemberModalOpen(true);
  };

  const handleOpenEditModal = (m: Member) => {
    setEditingMember(m);
    setMemName(m.name);
    setMemDesignation(m.designation || 'সাধারণ সদস্য');
    setMemPhone(m.phone || '');
    setMemArea(m.area || '');
    setMemIsExecutive(Boolean(isExecutiveCommitteeMember(m)));
    setMemIsExpatriate(Boolean(isExpatriateMember(m)));
    setMemCountry(m.countryStatus || '');
    setMemPhoto(m.photoUrl || '');
    setMemFormError('');
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setMemFormError('ছবির সাইজ সর্বোচ্চ ১০ মেগাবাইট হতে পারবে');
      return;
    }

    try {
      const compressedBase64 = await compressImageFile(file, { maxWidth: 600, maxHeight: 600, quality: 0.8 });
      setMemPhoto(compressedBase64);
      setMemFormError('');
    } catch {
      setMemFormError('ছবি প্রসেসিংয়ে সমস্যা হয়েছে, পুনরায় চেষ্টা করুন');
    }
  };

  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memName.trim()) {
      setMemFormError('সদস্যের নাম প্রদান করুন');
      return;
    }
    if (!memPhone.trim()) {
      setMemFormError('সঠিক মোবাইল নম্বর প্রদান করুন');
      return;
    }

    setIsSavingMember(true);
    setMemFormError('');

    try {
      if (editingMember) {
        const updated: Member = {
          ...editingMember,
          name: memName.trim(),
          designation: memDesignation.trim(),
          phone: memPhone.trim(),
          area: memArea.trim(),
          isExecutive: memIsExecutive,
          isExpatriate: memIsExpatriate,
          countryStatus: memIsExpatriate ? (memCountry.trim() || 'প্রবাসী') : undefined,
          photoUrl: memPhoto || undefined,
          status: editingMember.status || 'সক্রিয়'
        };
        await onEditMember(updated);
        setEditingMember(null);
        setNoticeMsg(`"${updated.name}" এর তথ্য সফলভাবে আপডেট হয়েছে`);
      } else {
        // Unlimited members sequential serial
        let maxSerial = 0;
        members.forEach(m => {
          if (typeof m.serial === 'number' && !isNaN(m.serial) && m.serial > maxSerial) {
            maxSerial = m.serial;
          }
        });
        const nextSerial = Math.max(maxSerial, members.length) + 1;

        const newMem: Omit<Member, 'id'> = {
          name: memName.trim(),
          designation: memDesignation.trim(),
          phone: memPhone.trim(),
          area: memArea.trim(),
          status: 'সক্রিয়',
          joinDate: new Date().toISOString().split('T')[0],
          serial: nextSerial,
          isExecutive: memIsExecutive,
          isExpatriate: memIsExpatriate,
          countryStatus: memIsExpatriate ? (memCountry.trim() || 'প্রবাসী') : undefined,
          photoUrl: memPhoto || undefined,
          createdAt: new Date().toISOString()
        };
        await onAddMember(newMem);
        setIsAddMemberModalOpen(false);
        setNoticeMsg(`নতুন সদস্য "${newMem.name}" সফলভাবে যুক্ত হয়েছে`);
      }
      setTimeout(() => setNoticeMsg(''), 3000);
    } catch {
      setMemFormError('সংরক্ষণে সমস্যা হয়েছে। পুনরায় চেষ্টা করুন।');
    } finally {
      setIsSavingMember(false);
    }
  };

  // Permanent deletion
  const handleConfirmDeleteMember = async (id: string, name: string) => {
    try {
      await onDeleteMember(id);
      setDeletingMemberId(null);
      setNoticeMsg(`সদস্য "${name}" স্থায়ীভাবে তালিকা থেকে মুছে ফেলা হয়েছে`);
      setTimeout(() => setNoticeMsg(''), 3000);
    } catch {
      setErrorMsg('সদস্য মুছে ফেলতে সমস্যা হয়েছে');
      setTimeout(() => setErrorMsg(''), 3000);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      ...profile,
      name,
      tagline,
      establishedDate,
      establishedYear,
      address,
      hotline,
      regNumber,
      phone,
      email
    });
    setNoticeMsg('সংগঠনের প্রোফাইল সফলভাবে আপডেট করা হয়েছে');
    setTimeout(() => setNoticeMsg(''), 3000);
  };

  const handleSavePayments = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdatePaymentConfig({
      ...paymentConfig,
      bkashNumber,
      bkashType,
      nagadNumber,
      nagadType,
      rocketNumber,
      rocketType
    });
    setNoticeMsg('পেমেন্ট গেটওয়ে নম্বরসমূহ সফলভাবে সংরক্ষিত হয়েছে');
    setTimeout(() => setNoticeMsg(''), 3000);
  };

  const handleSavePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length < 4) {
      setErrorMsg('পিন কোড কমপক্ষে ৪ ডিজিটের হতে হবে');
      return;
    }
    if (newPin !== confirmPin) {
      setErrorMsg('উভয় পিন কোড মিলছে না');
      return;
    }
    saveAdminPin(newPin);
    setNewPin('');
    setConfirmPin('');
    setErrorMsg('');
    setNoticeMsg('অ্যাডমিন পিন কোড সফলভাবে পরিবর্তন করা হয়েছে');
    setTimeout(() => setNoticeMsg(''), 3000);
  };

  return (
    <div className="space-y-6 pb-20 sm:pb-8">
      {/* Header */}
      <div className="bg-slate-900 rounded-3xl p-5 sm:p-6 text-white shadow-lg flex justify-between items-center flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Settings className="w-6 h-6 text-amber-400" />
            <h2 className="text-xl sm:text-2xl font-black">
              অ্যাডমিন কন্ট্রোল প্যানেল
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            সদস্য ব্যবস্থাপনা, সংগঠনের তথ্য, পেমেন্ট নম্বর ও নিরাপত্তা নিয়ন্ত্রণ
          </p>
        </div>

        <button
          onClick={onBack}
          className="px-4 py-2 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition cursor-pointer"
        >
          হোমে ফিরে যান
        </button>
      </div>

      {noticeMsg && (
        <div className="p-4 rounded-2xl bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>{noticeMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-100 border border-rose-300 text-rose-900 text-xs font-bold flex items-center gap-2 shadow-xs">
          <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('members')}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
            activeTab === 'members'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>সদস্য ব্যবস্থাপনা ({toBengaliNumber(members.length)})</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
            activeTab === 'profile'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>সংগঠনের প্রোফাইল</span>
        </button>

        <button
          onClick={() => setActiveTab('payments')}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
            activeTab === 'payments'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>পেমেন্ট গেটওয়ে নম্বর</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
            activeTab === 'security'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>পিন ও ক্লাউড</span>
        </button>
      </div>

      {/* 1. Member Management Tab */}
      {activeTab === 'members' && (
        <div className="space-y-4">
          {/* Member Sub-header */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-700" />
                <span>সদস্য ও কার্যকরী পরিষদ নিয়ন্ত্রণ</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                সদস্যদের তথ্য সম্পাদনা, স্থায়ীভাবে মুছে ফেলা ও নতুন নিবন্ধন
              </p>
            </div>

            <button
              onClick={handleOpenAddModal}
              className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow transition cursor-pointer active:scale-95"
            >
              <UserPlus className="w-4 h-4" />
              <span>নতুন সদস্য যুক্ত করুন</span>
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
              placeholder="সদস্যের নাম, পদবি বা মোবাইল নম্বর দিয়ে খুঁজুন..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
            {memberSearch && (
              <button
                onClick={() => setMemberSearch('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Member List with Edit & Delete options inside Admin Panel */}
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs divide-y divide-slate-100">
            {filteredMembers.map((member) => {
              const photo = getMemberPhotoUrl(member);
              const isExec = isExecutiveCommitteeMember(member);
              const isExp = isExpatriateMember(member);
              const cleanPhone = sanitizePhone(member.phone);

              return (
                <div key={member.id} className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-slate-50/60 transition">
                  <div className="flex items-center gap-3.5 min-w-0">
                    {/* Member Photo */}
                    <div className="relative shrink-0">
                      <div className="w-14 h-14 rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center font-bold text-slate-700 text-base">
                        {photo ? (
                          <img src={photo} alt={member.name} className="w-full h-full object-cover" />
                        ) : (
                          member.name.trim().charAt(0) || 'স'
                        )}
                      </div>
                      <span className="absolute -top-1.5 -left-1 px-1.5 py-0.2 rounded text-[9px] font-black bg-slate-900 text-white">
                        #{toBengaliNumber(member.serial)}
                      </span>
                    </div>

                    {/* Member Info */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-slate-900 truncate">
                          {member.name}
                        </h4>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          isExec 
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' 
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {member.designation}
                        </span>
                        {isExp && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-800">
                            {member.countryStatus || 'প্রবাসী'}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 flex-wrap">
                        <span className="flex items-center gap-1 font-mono text-[11px]">
                          <Phone className="w-3 h-3 text-emerald-600" />
                          <span>{member.phone}</span>
                        </span>
                        <span className="flex items-center gap-1 text-[11px]">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{member.area}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Admin Exclusive Edit & Delete Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleOpenEditModal(member)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 text-xs font-bold transition cursor-pointer"
                      title="তথ্য সম্পাদন করুন"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">সম্পাদনা</span>
                    </button>

                    <button
                      onClick={() => setDeletingMemberId(member.id)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 text-xs font-bold transition cursor-pointer"
                      title="স্থায়ীভাবে মুছে ফেলুন"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">মুছুন</span>
                    </button>
                  </div>
                </div>
              );
            })}

            {filteredMembers.length === 0 && (
              <div className="p-10 text-center text-slate-400">
                <Users className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p className="text-xs font-bold text-slate-600">কোনো সদস্য পাওয়া যায়নি</p>
                <p className="text-[11px] text-slate-400 mt-0.5">নতুন সদস্য যুক্ত করতে উপরের বাটনে চাপ দিন</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. Profile Form Tab */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Building className="w-5 h-5 text-emerald-700" />
            <span>সংগঠনের সার্বিক তথ্য সম্পাদন</span>
          </h3>

          <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block font-bold text-slate-700 mb-1">সংগঠনের নাম</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">স্লোগান / ট্যাগলাইন</label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block font-bold text-slate-700 mb-1">প্রতিষ্ঠার তারিখ</label>
                <input
                  type="text"
                  value={establishedDate}
                  onChange={(e) => setEstablishedDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">প্রতিষ্ঠার বছর</label>
                <input
                  type="text"
                  value={establishedYear}
                  onChange={(e) => setEstablishedYear(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">কার্যালয়ের ঠিকানা</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="block font-bold text-slate-700 mb-1">জরুরি হটলাইন</label>
                <input
                  type="text"
                  value={hotline}
                  onChange={(e) => setHotline(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">মোবাইল নম্বর</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">রেজিস্ট্রেশন নম্বর</label>
                <input
                  type="text"
                  value={regNumber}
                  onChange={(e) => setRegNumber(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold shadow transition cursor-pointer active:scale-95"
              >
                <Save className="w-4 h-4" />
                <span>প্রোফাইল পরিবর্তন সংরক্ষণ</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 3. Payments Form Tab */}
      {activeTab === 'payments' && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-700" />
            <span>অফিসিয়াল পেমেন্ট নম্বর ও সেটিংস</span>
          </h3>

          <form onSubmit={handleSavePayments} className="space-y-4 text-xs">
            {/* bKash */}
            <div className="p-4 rounded-2xl bg-pink-50/50 border border-pink-200 space-y-3">
              <h4 className="font-bold text-pink-900 flex items-center gap-1.5 text-xs">
                <span>বিকাশ (bKash) সেটিংস</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">বিকাশ নম্বর</label>
                  <input
                    type="text"
                    value={bkashNumber}
                    onChange={(e) => setBkashNumber(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">অ্যাকাউন্টের ধরন</label>
                  <select
                    value={bkashType}
                    onChange={(e) => setBkashType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="Personal">Personal (ব্যক্তিগত)</option>
                    <option value="Merchant">Merchant (মার্চেন্ট)</option>
                    <option value="Agent">Agent (এজেন্ট)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Nagad */}
            <div className="p-4 rounded-2xl bg-orange-50/50 border border-orange-200 space-y-3">
              <h4 className="font-bold text-orange-900 flex items-center gap-1.5 text-xs">
                <span>নগদ (Nagad) সেটিংস</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">নগদ নম্বর</label>
                  <input
                    type="text"
                    value={nagadNumber}
                    onChange={(e) => setNagadNumber(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">অ্যাকাউন্টের ধরন</label>
                  <select
                    value={nagadType}
                    onChange={(e) => setNagadType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="Personal">Personal (ব্যক্তিগত)</option>
                    <option value="Merchant">Merchant (মার্চেন্ট)</option>
                    <option value="Agent">Agent (এজেন্ট)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Rocket */}
            <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-200 space-y-3">
              <h4 className="font-bold text-purple-900 flex items-center gap-1.5 text-xs">
                <span>রকেট (Rocket) সেটিংস</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">রকেট নম্বর</label>
                  <input
                    type="text"
                    value={rocketNumber}
                    onChange={(e) => setRocketNumber(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">অ্যাকাউন্টের ধরন</label>
                  <select
                    value={rocketType}
                    onChange={(e) => setRocketType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="Personal">Personal (ব্যক্তিগত)</option>
                    <option value="Merchant">Merchant (মার্চেন্ট)</option>
                    <option value="Agent">Agent (এজেন্ট)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold shadow transition cursor-pointer active:scale-95"
              >
                <Save className="w-4 h-4" />
                <span>পেমেন্ট সেটিংস সংরক্ষণ</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 4. Security & Cloud Tab */}
      {activeTab === 'security' && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs max-w-md space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Lock className="w-5 h-5 text-emerald-700" />
            <span>অ্যাডমিন পিন পরিবর্তন</span>
          </h3>

          <form onSubmit={handleSavePin} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">নতুন পিন কোড</label>
              <input
                type="password"
                required
                maxLength={8}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                placeholder="কমপক্ষে ৪ ডিজিট"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono tracking-widest text-center text-sm"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">নতুন পিন কোড পুনরায় লিখুন</label>
              <input
                type="password"
                required
                maxLength={8}
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value)}
                placeholder="একই পিন কোড পুনরায় লিখুন"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono tracking-widest text-center text-sm"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold shadow transition cursor-pointer active:scale-95"
              >
                <Save className="w-4 h-4" />
                <span>পিন পরিবর্তন করুন</span>
              </button>
            </div>
          </form>

          {/* Supabase Cloud Connection Status */}
          <div className="pt-4 border-t border-slate-100 space-y-2">
            <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <Cloud className="w-4 h-4 text-emerald-600" />
              <span>Supabase ক্লাউড ডাটাবেজ স্ট্যাটাস</span>
            </h4>
            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-1">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>ক্লাউড সিঙ্ক:</span>
                </span>
                <span className="text-emerald-700">{supabaseStatus}</span>
              </div>
              <div className="text-[10px] text-slate-500 font-mono truncate">
                {SUPABASE_URL}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Member Modal (Admin Exclusive) */}
      {(isAddMemberModalOpen || editingMember) && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 my-8 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-700" />
                <span>{editingMember ? 'সদস্য তথ্য সম্পাদনা' : 'নতুন সদস্য নিবন্ধন'}</span>
              </h3>
              <button
                onClick={() => {
                  setIsAddMemberModalOpen(false);
                  setEditingMember(null);
                }}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {memFormError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{memFormError}</span>
              </div>
            )}

            <form onSubmit={handleSaveMember} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  সদস্যের পুরো নাম <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={memName}
                  onChange={(e) => setMemName(e.target.value)}
                  placeholder="যেমন: মো: ছাদিকুর রহমান"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">পদবি</label>
                  <input
                    type="text"
                    value={memDesignation}
                    onChange={(e) => setMemDesignation(e.target.value)}
                    placeholder="সভাপতি / সদস্য"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">এলাকা / ঠিকানা</label>
                  <input
                    type="text"
                    value={memArea}
                    onChange={(e) => setMemArea(e.target.value)}
                    placeholder="পতেঙ্গা, চট্টগ্রাম"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  মোবাইল নম্বর <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={memPhone}
                  onChange={(e) => setMemPhone(e.target.value)}
                  placeholder="01886122678"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-mono"
                />
              </div>

              {/* Committee & Expatriate Toggles */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={memIsExecutive}
                    onChange={(e) => setMemIsExecutive(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="font-bold text-slate-800">কার্যকরী পরিষদ সদস্য</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={memIsExpatriate}
                    onChange={(e) => setMemIsExpatriate(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="font-bold text-slate-800">প্রবাসী সদস্য</span>
                </label>

                {memIsExpatriate && (
                  <div className="pt-1">
                    <input
                      type="text"
                      value={memCountry}
                      onChange={(e) => setMemCountry(e.target.value)}
                      placeholder="দেশের নাম (যেমন: ওমান, কাতার, দুবাই)"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                    />
                  </div>
                )}
              </div>

              {/* Photo Upload */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  প্রোফাইল ছবি (গ্যালারি থেকে নির্বাচন)
                </label>
                <div className="flex items-center gap-3">
                  {memPhoto ? (
                    <div className="relative w-16 h-16 rounded-2xl overflow-hidden border-2 border-emerald-500 shrink-0 shadow-xs">
                      <img src={memPhoto} alt="প্রিভিউ" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setMemPhoto('')}
                        className="absolute top-0 right-0 p-0.5 bg-rose-600 text-white rounded-bl cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                      <Users className="w-6 h-6" />
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddMemberModalOpen(false);
                    setEditingMember(null);
                  }}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isSavingMember}
                  className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold shadow transition cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  {isSavingMember ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Permanent Deletion Confirmation Modal */}
      {deletingMemberId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                সদস্য স্থায়ীভাবে মুছে ফেলবেন?
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                মুছে ফেলার পর এই সদস্যের সকল তথ্য ও রেকর্ড স্থায়ীভাবে বিলুপ্ত হবে এবং পৃষ্ঠা রিলোড দিলেও তা আর ফিরে আসবে না।
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setDeletingMemberId(null)}
                className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
              >
                না, রাখুন
              </button>
              <button
                onClick={() => {
                  const target = members.find(m => m.id === deletingMemberId);
                  handleConfirmDeleteMember(deletingMemberId, target ? target.name : 'সদস্য');
                }}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow transition cursor-pointer active:scale-95"
              >
                হ্যাঁ, স্থায়ীভাবে মুছুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
