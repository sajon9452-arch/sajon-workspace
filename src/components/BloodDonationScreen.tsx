import React, { useState, useMemo } from 'react';
import { 
  Droplet, 
  Search, 
  UserPlus, 
  Phone, 
  MapPin, 
  Clock, 
  Heart, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Copy, 
  Check,
  Edit,
  Trash2
} from 'lucide-react';
import { BloodDonor, BloodGroup } from '../types';
import { toBengaliNumber, sanitizePhone } from '../utils/helpers';

interface BloodDonationScreenProps {
  donors: BloodDonor[];
  onAddDonor: (donor: Omit<BloodDonor, 'id'>) => Promise<BloodDonor>;
  onEditDonor: (donor: BloodDonor) => Promise<void>;
  onDeleteDonor: (id: string) => Promise<void>;
  isAdmin: boolean;
  onBack: () => void;
}

const BLOOD_GROUPS: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export const BloodDonationScreen: React.FC<BloodDonationScreenProps> = ({
  donors,
  onAddDonor,
  onEditDonor,
  onDeleteDonor,
  isAdmin,
  onBack
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingDonor, setEditingDonor] = useState<BloodDonor | null>(null);
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formGroup, setFormGroup] = useState<BloodGroup>('O+');
  const [formArea, setFormArea] = useState('পতেঙ্গা, চট্টগ্রাম');
  const [formLastDate, setFormLastDate] = useState('');
  const [formTotal, setFormTotal] = useState<number | ''>(1);
  const [formIsAvailable, setFormIsAvailable] = useState(true);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate eligibility: minimum 90-120 days
  const isDonorEligible = (lastDate?: string): boolean => {
    if (!lastDate) return true;
    try {
      const last = new Date(lastDate);
      const diffDays = Math.floor((Date.now() - last.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays >= 90;
    } catch {
      return true;
    }
  };

  const filteredDonors = useMemo(() => {
    return donors.filter(d => {
      if (selectedGroup !== 'all' && d.bloodGroup !== selectedGroup) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.trim().toLowerCase();
        const matchesName = d.name.toLowerCase().includes(q);
        const matchesPhone = d.phone.includes(q);
        const matchesArea = d.area.toLowerCase().includes(q);
        return matchesName || matchesPhone || matchesArea;
      }
      return true;
    });
  }, [donors, selectedGroup, searchTerm]);

  const handleCopyPhone = (phone: string) => {
    navigator.clipboard.writeText(phone);
    setCopiedPhone(phone);
    setTimeout(() => setCopiedPhone(null), 2000);
  };

  const handleOpenAddModal = () => {
    setFormName('');
    setFormPhone('');
    setFormGroup('O+');
    setFormArea('পতেঙ্গা, চট্টগ্রাম');
    setFormLastDate('');
    setFormTotal(1);
    setFormIsAvailable(true);
    setFormError('');
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (d: BloodDonor) => {
    setEditingDonor(d);
    setFormName(d.name);
    setFormPhone(d.phone);
    setFormGroup(d.bloodGroup);
    setFormArea(d.area);
    setFormLastDate(d.lastDonationDate || '');
    setFormTotal(d.totalDonations || 1);
    setFormIsAvailable(d.isAvailable !== false);
    setFormError('');
  };

  const handleSubmitDonor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formPhone.trim()) {
      setFormError('রক্তদাতার নাম ও মোবাইল নম্বর প্রদান করুন');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    try {
      if (editingDonor) {
        await onEditDonor({
          ...editingDonor,
          name: formName.trim(),
          phone: formPhone.trim(),
          bloodGroup: formGroup,
          area: formArea.trim(),
          lastDonationDate: formLastDate || undefined,
          totalDonations: formTotal === '' ? 1 : Number(formTotal),
          isAvailable: formIsAvailable
        });
        setEditingDonor(null);
      } else {
        await onAddDonor({
          name: formName.trim(),
          phone: formPhone.trim(),
          bloodGroup: formGroup,
          area: formArea.trim(),
          lastDonationDate: formLastDate || undefined,
          totalDonations: formTotal === '' ? 1 : Number(formTotal),
          isAvailable: formIsAvailable
        });
        setIsAddModalOpen(false);
      }
    } catch {
      setFormError('রক্তদাতা সংরক্ষণে সমস্যা হয়েছে');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 sm:pb-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-rose-900 via-rose-800 to-red-900 rounded-3xl p-5 sm:p-6 text-white shadow-lg space-y-3">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Droplet className="w-6 h-6 text-rose-300" />
              <h2 className="text-xl sm:text-2xl font-black">
                জরুরি রক্তদান সেবা কেন্দ্র
              </h2>
            </div>
            <p className="text-xs text-rose-100 mt-1 max-w-xl">
              "এক ব্যাগ রক্ত, বাঁচায় একটি প্রাণ"—পতেঙ্গা ও সিলেটের যেকোনো মুমূর্ষু রোগীর প্রয়োজনে সরাসরি রক্তদাতার সাথে যোগাযোগ করুন
            </p>
          </div>

          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white text-rose-900 font-bold text-xs shadow-md hover:bg-rose-50 transition cursor-pointer active:scale-95"
          >
            <UserPlus className="w-4 h-4 text-rose-700" />
            <span>রক্তদাতা হিসেবে নিবন্ধন করুন</span>
          </button>
        </div>
      </div>

      {/* Blood Group Selector Buttons */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setSelectedGroup('all')}
          className={`px-3 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
            selectedGroup === 'all'
              ? 'bg-rose-700 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          সকল গ্রুপ ({toBengaliNumber(donors.length)})
        </button>
        {BLOOD_GROUPS.map((grp) => {
          const count = donors.filter(d => d.bloodGroup === grp).length;
          return (
            <button
              key={grp}
              onClick={() => setSelectedGroup(grp)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1 ${
                selectedGroup === grp
                  ? 'bg-rose-700 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-rose-50 border border-slate-200'
              }`}
            >
              <span>{grp}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                selectedGroup === grp ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-800'
              }`}>
                {toBengaliNumber(count)}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="রক্তদাতার নাম, এলাকা বা ফোন নম্বর দিয়ে অনুসন্ধান..."
          className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/20 shadow-xs"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Donors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filteredDonors.map((donor) => {
          const eligible = isDonorEligible(donor.lastDonationDate);

          return (
            <div
              key={donor.id}
              className="bg-white rounded-3xl p-4 border border-slate-200 shadow-xs hover:shadow-md transition flex flex-col justify-between space-y-3"
            >
              <div className="flex items-start gap-3">
                <div className="w-14 h-14 rounded-2xl bg-rose-100 border-2 border-rose-300 text-rose-800 flex flex-col items-center justify-center shrink-0">
                  <span className="text-base font-black leading-none">{donor.bloodGroup}</span>
                  <span className="text-[9px] font-bold mt-0.5 text-rose-600">গ্রুপ</span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 justify-between">
                    <h3 className="text-sm font-bold text-slate-900 truncate">
                      {donor.name}
                    </h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      eligible 
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}>
                      {eligible ? 'রক্তদানে প্রস্তুত' : 'সম্প্রতি দিয়েছেন'}
                    </span>
                  </div>

                  <div className="mt-2 space-y-1 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <a
                        href={`tel:${sanitizePhone(donor.phone)}`}
                        className="font-mono text-[11px] font-semibold text-slate-800 hover:underline"
                      >
                        {donor.phone}
                      </a>
                      <button
                        onClick={() => handleCopyPhone(donor.phone)}
                        className="text-slate-400 hover:text-slate-600 p-0.5"
                        title="নম্বর কপি করুন"
                      >
                        {copiedPhone === donor.phone ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{donor.area}</span>
                    </div>

                    {donor.lastDonationDate && (
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>শেষ রক্তদান: {donor.lastDonationDate}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] text-slate-500 font-medium">
                  মোট রক্তদান: {toBengaliNumber(donor.totalDonations || 1)} বার
                </span>

                <div className="flex items-center gap-1.5">
                  <a
                    href={`tel:${sanitizePhone(donor.phone)}`}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs"
                  >
                    <Phone className="w-3 h-3" />
                    <span>কল দিন</span>
                  </a>

                  {isAdmin && (
                    <>
                      <button
                        onClick={() => handleOpenEditModal(donor)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
                        title="সম্পাদনা"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`আপনি কি "${donor.name}" কে রক্তদাতা তালিকা থেকে মুছে ফেলতে চান?`)) {
                            onDeleteDonor(donor.id);
                          }
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600"
                        title="মুছে ফেলুন"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredDonors.length === 0 && (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
          <Droplet className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h4 className="text-base font-bold text-slate-700">এই গ্রুপে কোনো রক্তদাতা পাওয়া যায়নি</h4>
          <p className="text-xs text-slate-500 mt-1">অন্য কোনো রক্তের গ্রুপ বা এলাকা দিয়ে খুঁজুন</p>
        </div>
      )}

      {/* Add / Edit Donor Modal */}
      {(isAddModalOpen || editingDonor) && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 my-8 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Droplet className="w-5 h-5 text-rose-600" />
                <span>{editingDonor ? 'রক্তদাতার তথ্য পরিবর্তন' : 'নতুন রক্তদাতা নিবন্ধন'}</span>
              </h3>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingDonor(null);
                }}
                className="p-1 rounded-full text-slate-400"
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

            <form onSubmit={handleSubmitDonor} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  রক্তদাতার পুরো নাম <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="যেমন: মো: আব্দুল্লাহ আল মামুন"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                />
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
                    placeholder="01711000000"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">রক্তের গ্রুপ</label>
                  <select
                    value={formGroup}
                    onChange={(e) => setFormGroup(e.target.value as BloodGroup)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold"
                  >
                    {BLOOD_GROUPS.map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">ঠিকানা / এলাকা</label>
                <input
                  type="text"
                  value={formArea}
                  onChange={(e) => setFormArea(e.target.value)}
                  placeholder="পতেঙ্গা, চট্টগ্রাম"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">সর্বশেষ রক্তদানের তারিখ</label>
                  <input
                    type="date"
                    value={formLastDate}
                    onChange={(e) => setFormLastDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">মোট রক্তদান সংখ্যা</label>
                  <input
                    type="number"
                    min="1"
                    value={formTotal}
                    onChange={(e) => setFormTotal(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingDonor(null);
                  }}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white font-bold shadow transition cursor-pointer active:scale-95 disabled:opacity-50"
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
