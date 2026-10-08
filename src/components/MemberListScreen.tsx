import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Search, 
  Phone, 
  MapPin, 
  Globe, 
  X, 
  Check, 
  Copy, 
  MessageCircle, 
  ShieldCheck
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

interface MemberListScreenProps {
  members: Member[];
  onAddMember?: (member: Omit<Member, 'id'>) => Promise<Member>;
  onEditMember?: (member: Member) => Promise<void>;
  onDeleteMember?: (id: string) => Promise<void>;
  isAdmin?: boolean;
  onBack?: () => void;
}

export const MemberListScreen: React.FC<MemberListScreenProps> = ({
  members
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'executive' | 'general' | 'expatriate'>('all');
  
  // Modals & copying
  const [zoomedPhoto, setZoomedPhoto] = useState<{ src: string; name: string; designation?: string } | null>(null);
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);

  // Strict ascending seniority / serial order:
  // Earliest registered members stay on top, newly added members strictly append to bottom!
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

  return (
    <div className="space-y-6 pb-20 sm:pb-8">
      {/* Top Header Card (Clean: Public view without any Add Member button) */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 text-emerald-700" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
              সদস্য ও কার্যকরী পরিষদ ডিরেক্টরি
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              সংগঠনের সম্মানিত দায়িত্বশীল ও সাধারণ সদস্যদের অফিসিয়াল তালিকা
            </p>
          </div>
        </div>

        <div className="px-3.5 py-1.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold shrink-0">
          মোট সদস্য: {toBengaliNumber(members.length)} জন
        </div>
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
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
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
            সাধারণ সদস্য ({toBengaliNumber(members.filter(m => !isExecutiveCommitteeMember(m) && !isExpatriateMember(m)).length)})
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
              <div className="flex items-start gap-4">
                {/* Member Photo Avatar: Larger Photo Box */}
                <div className="relative shrink-0">
                  <div 
                    onClick={() => photo && setZoomedPhoto({ src: photo, name: member.name, designation: member.designation })}
                    className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl sm:rounded-3xl overflow-hidden border-2 flex items-center justify-center font-bold text-xl select-none shadow-sm ${
                      photo 
                        ? 'border-emerald-500 cursor-pointer group hover:border-emerald-600' 
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

                  {/* Strict Seniority Serial Badge (#1, #2... #N) */}
                  <span className="absolute -top-2 -left-1.5 px-2 py-0.5 rounded-md text-[10px] font-black bg-slate-900 text-white shadow-sm border border-slate-700">
                    #{toBengaliNumber(member.serial)}
                  </span>
                </div>

                {/* Member Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                      {member.name}
                    </h3>
                  </div>

                  {/* Designation Badges */}
                  <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-lg ${
                      isExec 
                        ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' 
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {member.designation}
                    </span>

                    {isExp && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-blue-100 text-blue-800 flex items-center gap-1">
                        <Globe className="w-3 h-3 text-blue-600" />
                        <span>{member.countryStatus || 'প্রবাসী'}</span>
                      </span>
                    )}
                  </div>

                  {/* Phone & Area */}
                  <div className="mt-2.5 space-y-1 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <a 
                        href={`tel:${cleanPhone}`}
                        className="hover:underline font-mono text-xs font-bold text-slate-800"
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

                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{member.area || 'পতেঙ্গা, চট্টগ্রাম'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Public Member Card Action Bar: Direct Call & WhatsApp only */}
              <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 w-full">
                  <a
                    href={`tel:${cleanPhone}`}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-2xs"
                    title="সরাসরি কল দিন"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>কল দিন</span>
                  </a>

                  {cleanPhone && (
                    <a
                      href={`https://wa.me/880${cleanPhone.replace(/^0/, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs transition shadow-2xs"
                      title="হোয়াটসঅ্যাপে মেসেজ পাঠান"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State when no members found (Strictly informational for public visitors) */}
      {filteredMembers.length === 0 && (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs">
          <Users className="w-14 h-14 text-slate-300 mx-auto mb-3" />
          {members.length === 0 ? (
            <div>
              <h4 className="text-base sm:text-lg font-bold text-slate-800">
                এখনও কোনো সদস্য তালিকাভুক্ত করা হয়নি
              </h4>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                সংগঠনের সদস্য তালিকা বর্তমানে খালি রয়েছে। সংগঠনের অ্যাডমিন প্যানেল থেকে অনুমোদিত সদস্য নিবন্ধন ও প্রকাশ করা হবে।
              </p>
            </div>
          ) : (
            <div>
              <h4 className="text-base font-bold text-slate-700">কোনো সদস্য পাওয়া যায়নি</h4>
              <p className="text-xs text-slate-500 mt-1">অনুসন্ধানের শব্দ পরিবর্তন করে পুনরায় চেষ্টা করুন</p>
            </div>
          )}
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
                className="p-1 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
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
