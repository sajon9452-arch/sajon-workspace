import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Search, 
  UserPlus, 
  Phone, 
  Mail, 
  MapPin, 
  Globe, 
  Edit, 
  Trash2, 
  X, 
  Maximize2,
  Check,
  AlertCircle,
  Copy,
  MessageCircle,
  ShieldCheck,
  Star
} from 'lucide-react';
import { Member } from '../types';
import { 
  toBengaliNumber, 
  isExecutiveCommitteeMember, 
  isExpatriateMember, 
  sortMembersOldestFirst,
  getMemberPhotoUrl,
  sanitizePhone
} from '../utils/helpers';
import { compressImageFile } from '../utils/imageCompressor';

interface MemberListScreenProps {
  members: Member[];
  onAddMember: (member: Omit<Member, 'id'>) => Promise<Member>;
  onEditMember: (member: Member) => Promise<void>;
  onDeleteMember: (id: string) => Promise<void>;
  isAdmin: boolean;
  onBack: () => void;
}

export const MemberListScreen: React.FC<MemberListScreenProps> = ({
  members,
  onAddMember,
  onEditMember,
  onDeleteMember,
  isAdmin,
  onBack
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'executive' | 'general' | 'expatriate'>('all');
  
  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [zoomedPhoto, setZoomedPhoto] = useState<{ src: string; name: string; designation?: string } | null>(null);
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formDesignation, setFormDesignation] = useState('সাধারণ সদস্য');
  const [formPhone, setFormPhone] = useState('');
  const [formArea, setFormArea] = useState('পতেঙ্গা, চট্টগ্রাম');
  const [formEmail, setFormEmail] = useState('');
  const [formIsExecutive, setFormIsExecutive] = useState(false);
  const [formIsExpatriate, setFormIsExpatriate] = useState(false);
  const [formCountry, setFormCountry] = useState('');
  const [formBloodGroup, setFormBloodGroup] = useState('O+');
  const [formPhoto, setFormPhoto] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Strict ascending seniority / serial order:
  // Earliest registered members stay on top (#1, #2... #25), newly added members strictly append to bottom!
  const sortedMembers = useMemo(() => {
    return sortMembersOldestFirst(members);
  }, [members]);

  // Tab Filtering
  const filteredMembers = useMemo(() => {
    return sortedMembers.filter(m => {
      if (activeTab === 'executive' && !isExecutiveCommitteeMember(m)) return false;
      if (activeTab === 'general' && (isExecutiveCommitteeMember(m) || isExpatriateMember(m))) return false;
      if (activeTab === 'expatriate' && !isExpatriateMember(m)) return false;

      if (searchTerm.trim()) {
        const query = searchTerm.trim().toLowerCase();
        const matchesName = m.name.toLowerCase().includes(query);
        const matchesPhone = (m.phone || '').includes(query);
        const matchesArea = (m.area || '').toLowerCase().includes(query);
        const matchesDes = (m.designation || '').toLowerCase().includes(query);
        return matchesName || matchesPhone || matchesArea || matchesDes;
      }
      return true;
    });
  }, [sortedMembers, activeTab, searchTerm]);

  const handleCopyPhone = (phone: string) => {
    if (!phone) return;
    navigator.clipboard.writeText(phone);
    setCopiedPhone(phone);
    setTimeout(() => setCopiedPhone(null), 2000);
  };

  const handleOpenAddModal = () => {
    setFormName('');
    setFormDesignation('সাধারণ সদস্য');
    setFormPhone('');
    setFormArea('পতেঙ্গা, চট্টগ্রাম');
    setFormEmail('');
    setFormIsExecutive(false);
    setFormIsExpatriate(false);
    setFormCountry('');
    setFormBloodGroup('O+');
    setFormPhoto('');
    setFormError('');
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (m: Member) => {
    setEditingMember(m);
    setFormName(m.name);
    setFormDesignation(m.designation || 'সাধারণ সদস্য');
    setFormPhone(m.phone || '');
    setFormArea(m.area || '');
    setFormEmail(m.email || '');
    setFormIsExecutive(Boolean(isExecutiveCommitteeMember(m)));
    setFormIsExpatriate(Boolean(isExpatriateMember(m)));
    setFormCountry(m.countryStatus || '');
    setFormBloodGroup(m.bloodGroup || 'O+');
    setFormPhoto(m.photoUrl || '');
    setFormError('');
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setFormError('ছবির সাইজ সর্বোচ্চ ১০ মেগাবাইট হতে পারবে');
      return;
    }

    try {
      const compressedBase64 = await compressImageFile(file, { maxWidth: 600, maxHeight: 600, quality: 0.8 });
      setFormPhoto(compressedBase64);
      setFormError('');
    } catch {
      setFormError('ছবি প্রসেসিংয়ে সমস্যা হয়েছে, পুনরায় চেষ্টা করুন');
    }
  };

  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError('সদস্যের পুরো নাম লিখুন');
      return;
    }
    if (!formPhone.trim()) {
      setFormError('সঠিক মোবাইল নম্বর লিখুন');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    try {
      if (editingMember) {
        // Edit existing member
        const updated: Member = {
          ...editingMember,
          name: formName.trim(),
          designation: formDesignation.trim(),
          phone: formPhone.trim(),
          area: formArea.trim(),
          email: formEmail.trim() || undefined,
          isExecutive: formIsExecutive,
          isExpatriate: formIsExpatriate,
          countryStatus: formIsExpatriate ? (formCountry.trim() || 'প্রবাসী') : undefined,
          bloodGroup: formBloodGroup,
          photoUrl: formPhoto || undefined,
          status: editingMember.status || 'সক্রিয়'
        };
        await onEditMember(updated);
        setEditingMember(null);
      } else {
        // Sequential bottom append: Calculate next serial
        let maxSerial = 0;
        members.forEach(m => {
          if (typeof m.serial === 'number' && !isNaN(m.serial) && m.serial > maxSerial) {
            maxSerial = m.serial;
          }
        });
        const nextSerial = Math.max(maxSerial, members.length) + 1;

        const newMem: Omit<Member, 'id'> = {
          name: formName.trim(),
          designation: formDesignation.trim(),
          phone: formPhone.trim(),
          area: formArea.trim(),
          email: formEmail.trim() || undefined,
          status: 'সক্রিয়',
          joinDate: new Date().toISOString().split('T')[0],
          serial: nextSerial,
          isExecutive: formIsExecutive,
          isExpatriate: formIsExpatriate,
          countryStatus: formIsExpatriate ? (formCountry.trim() || 'প্রবাসী') : undefined,
          bloodGroup: formBloodGroup,
          photoUrl: formPhoto || undefined,
          createdAt: new Date().toISOString()
        };
        await onAddMember(newMem);
        setIsAddModalOpen(false);
      }
    } catch {
      setFormError('সংরক্ষণে সমস্যা হয়েছে। পুনরায় চেষ্টা করুন।');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`আপনি কি নিশ্চিত যে "${name}" কে তালিকা থেকে মুছে ফেলতে চান?`)) {
      await onDeleteMember(id);
    }
  };

  return (
    <div className="space-y-6 pb-20 sm:pb-8">
      {/* Top Header Card */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                সদস্য ও কার্যকরী পরিষদ ডিরেক্টরি
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                প্রতিষ্ঠাকালীন ও নতুন নিবন্ধিত সদস্যদের ক্রমানুসারে পূর্ণাঙ্গ তালিকা
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-md transition cursor-pointer active:scale-95"
        >
          <UserPlus className="w-4 h-4" />
          <span>নতুন সদস্য যুক্ত করুন</span>
        </button>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="সদস্যের নাম, পদবি, মোবাইল নম্বর বা এলাকা দিয়ে অনুসন্ধান করুন..."
            className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-xs"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeTab === 'all' 
                ? 'bg-emerald-700 text-white shadow-xs' 
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            সকল সদস্য ({toBengaliNumber(members.length)})
          </button>
          <button
            onClick={() => setActiveTab('executive')}
            className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'executive' 
                ? 'bg-emerald-700 text-white shadow-xs' 
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>কার্যকরী পরিষদ ({toBengaliNumber(members.filter(m => isExecutiveCommitteeMember(m)).length)})</span>
          </button>
          <button
            onClick={() => setActiveTab('general')}
            className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeTab === 'general' 
                ? 'bg-emerald-700 text-white shadow-xs' 
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            সাধারণ সদস্য
          </button>
          <button
            onClick={() => setActiveTab('expatriate')}
            className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'expatriate' 
                ? 'bg-emerald-700 text-white shadow-xs' 
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-blue-400" />
            <span>প্রবাসী সদস্য ({toBengaliNumber(members.filter(m => isExpatriateMember(m)).length)})</span>
          </button>
        </div>
      </div>

      {/* Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
        {filteredMembers.map((member) => {
          const photo = getMemberPhotoUrl(member);
          const isExec = isExecutiveCommitteeMember(member);
          const isExp = isExpatriateMember(member);
          const cleanPhone = sanitizePhone(member.phone);

          return (
            <div
              key={member.id}
              className={`bg-white rounded-3xl p-4 sm:p-5 border transition hover:shadow-md flex flex-col justify-between space-y-3.5 ${
                isExec 
                  ? 'border-emerald-300 ring-1 ring-emerald-500/20' 
                  : 'border-slate-200'
              }`}
            >
              <div className="flex items-start gap-3.5">
                {/* Member Photo Avatar (Safe: NO empty string src) */}
                <div className="relative shrink-0">
                  <div 
                    onClick={() => photo && setZoomedPhoto({ src: photo, name: member.name, designation: member.designation })}
                    className={`w-16 h-16 sm:w-18 sm:h-18 rounded-2xl overflow-hidden border-2 flex items-center justify-center font-bold text-lg select-none shadow-xs ${
                      photo 
                        ? 'border-emerald-500 cursor-pointer group' 
                        : isExec 
                          ? 'border-emerald-400 bg-emerald-100 text-emerald-800' 
                          : 'border-slate-300 bg-slate-100 text-slate-700'
                    }`}
                    title={photo ? 'ছবি বড় করে দেখতে স্পর্শ করুন' : member.name}
                  >
                    {photo ? (
                      <img 
                        src={photo} 
                        alt={member.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                      />
                    ) : (
                      member.name.trim().charAt(0) || 'স'
                    )}
                  </div>

                  {/* Strict Seniority Serial Badge (#1, #2... #25) */}
                  <span className="absolute -top-2 -left-1.5 px-2 py-0.5 rounded-md text-[10px] font-black bg-slate-900 text-white shadow-sm border border-slate-700">
                    #{toBengaliNumber(member.serial)}
                  </span>
                </div>

                {/* Member Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h3 className="text-sm font-bold text-slate-900 truncate">
                      {member.name}
                    </h3>
                    {member.bloodGroup && (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-rose-100 text-rose-700 border border-rose-200 shrink-0">
                        {member.bloodGroup}
                      </span>
                    )}
                  </div>

                  {/* Designation Badges */}
                  <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      isExec 
                        ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' 
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {member.designation}
                    </span>

                    {isExp && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-800 flex items-center gap-1">
                        <Globe className="w-3 h-3 text-blue-600" />
                        <span>{member.countryStatus || 'প্রবাসী'}</span>
                      </span>
                    )}
                  </div>

                  {/* Phone & Area */}
                  <div className="mt-2 space-y-1 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <a 
                        href={`tel:${cleanPhone}`}
                        className="hover:underline font-mono text-[11px] font-bold text-slate-800"
                      >
                        {member.phone}
                      </a>
                      <button
                        onClick={() => handleCopyPhone(member.phone)}
                        className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer ml-0.5"
                        title="নম্বর কপি করুন"
                      >
                        {copiedPhone === member.phone ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{member.area || 'পতেঙ্গা, চট্টগ্রাম'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons: Direct Call, WhatsApp, Edit, Delete */}
              <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1">
                  <a
                    href={`tel:${cleanPhone}`}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition shadow-2xs"
                    title="সরাসরি কল দিন"
                  >
                    <Phone className="w-3 h-3" />
                    <span>কল</span>
                  </a>

                  {cleanPhone && (
                    <a
                      href={`https://wa.me/880${cleanPhone.replace(/^0/, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-[11px] transition shadow-2xs"
                      title="হোয়াটসঅ্যাপে মেসেজ পাঠান"
                    >
                      <MessageCircle className="w-3 h-3" />
                      <span>WhatsApp</span>
                    </a>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEditModal(member)}
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-emerald-700 transition cursor-pointer"
                    title="সম্পাদনা করুন"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  {isAdmin && (
                    <button
                      onClick={() => handleDelete(member.id, member.name)}
                      className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                      title="মুছে ফেলুন"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredMembers.length === 0 && (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h4 className="text-base font-bold text-slate-700">কোনো সদস্য পাওয়া যায়নি</h4>
          <p className="text-xs text-slate-500 mt-1">অনুসন্ধানের শব্দ পরিবর্তন করে পুনরায় চেষ্টা করুন</p>
        </div>
      )}

      {/* Add / Edit Member Modal */}
      {(isAddModalOpen || editingMember) && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 my-8 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-700" />
                <span>{editingMember ? 'সদস্যের তথ্য সম্পাদনা' : 'নতুন সদস্য নিবন্ধন'}</span>
              </h3>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingMember(null);
                }}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 transition cursor-pointer"
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

            <form onSubmit={handleSaveMember} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  সদস্যের নাম <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="যেমন: মো: ছাদিকুর রহমান"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">পদবি</label>
                  <input
                    type="text"
                    value={formDesignation}
                    onChange={(e) => setFormDesignation(e.target.value)}
                    placeholder="সভাপতি / সদস্য"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">রক্তের গ্রুপ</label>
                  <select
                    value={formBloodGroup}
                    onChange={(e) => setFormBloodGroup(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-white"
                  >
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    মোবাইল নম্বর <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="01886122678"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">এলাকা / ঠিকানা</label>
                  <input
                    type="text"
                    value={formArea}
                    onChange={(e) => setFormArea(e.target.value)}
                    placeholder="পতেঙ্গা, চট্টগ্রাম"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">ইমেইল (ঐচ্ছিক)</label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="member@gmail.com"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              {/* Committee & Expatriate Toggles */}
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsExecutive}
                    onChange={(e) => setFormIsExecutive(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="font-bold text-slate-800">কার্যকরী পরিষদ সদস্য</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsExpatriate}
                    onChange={(e) => setFormIsExpatriate(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="font-bold text-slate-800">প্রবাসী সদস্য</span>
                </label>

                {formIsExpatriate && (
                  <div className="pt-1">
                    <input
                      type="text"
                      value={formCountry}
                      onChange={(e) => setFormCountry(e.target.value)}
                      placeholder="দেশের নাম (যেমন: ওমান, কাতার, দুবাই)"
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white"
                    />
                  </div>
                )}
              </div>

              {/* Photo Upload with auto-compression */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  প্রোফাইল ছবি (গ্যালারি থেকে নির্বাচন)
                </label>
                <div className="flex items-center gap-3">
                  {formPhoto ? (
                    <div className="relative w-14 h-14 rounded-2xl overflow-hidden border-2 border-emerald-500 shrink-0 shadow-xs">
                      <img src={formPhoto} alt="প্রিভিউ" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setFormPhoto('')}
                        className="absolute top-0 right-0 p-0.5 bg-rose-600 text-white rounded-bl"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
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
                    setIsAddModalOpen(false);
                    setEditingMember(null);
                  }}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold shadow transition cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Photo Zoom Modal */}
      {zoomedPhoto && (
        <div 
          onClick={() => setZoomedPhoto(null)}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 rounded-3xl max-w-sm sm:max-w-md w-full overflow-hidden shadow-2xl border border-slate-800"
          >
            <div className="flex justify-between items-center p-3.5 text-white border-b border-slate-800">
              <div>
                <span className="text-xs font-bold block">{zoomedPhoto.name}</span>
                {zoomedPhoto.designation && (
                  <span className="text-[10px] text-emerald-400">{zoomedPhoto.designation}</span>
                )}
              </div>
              <button 
                onClick={() => setZoomedPhoto(null)}
                className="p-1 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="max-h-[70vh] flex items-center justify-center p-3">
              <img 
                src={zoomedPhoto.src} 
                alt={zoomedPhoto.name}
                className="max-h-[65vh] w-auto object-contain rounded-2xl shadow-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
