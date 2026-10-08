import React, { useState } from 'react';
import { 
  Settings, 
  Users, 
  Wallet, 
  Droplet, 
  BellRing, 
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
  PhoneCall,
  Cloud,
  Database
} from 'lucide-react';
import { 
  OrganizationProfile, 
  Member, 
  BloodDonor, 
  Notice, 
  FundRecord, 
  PaymentGatewayConfig 
} from '../types';
import { toBengaliNumber, formatBengaliCurrency } from '../utils/helpers';
import { saveAdminPin } from '../utils/storage';
import { checkSupabaseConnection, SUPABASE_URL } from '../utils/supabaseClient';

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
  funds: FundRecord[];
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
  donors,
  onAddDonor,
  onEditDonor,
  onDeleteDonor,
  funds,
  paymentConfig,
  onUpdatePaymentConfig,
  onBack
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'payments' | 'security'>('profile');
  
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
            সংগঠনের তথ্যাবলী, পেমেন্ট নম্বর ও নিরাপত্তা নিয়ন্ত্রণ
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
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-bold transition cursor-pointer ${
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
          className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-bold transition cursor-pointer ${
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
          className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'security'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>পিন ও নিরাপত্তা</span>
        </button>
      </div>

      {/* Profile Form Tab */}
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

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="block font-bold text-slate-700 mb-1">প্রতিষ্ঠা তারিখ</label>
                <input
                  type="text"
                  value={establishedDate}
                  onChange={(e) => setEstablishedDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">প্রতিষ্ঠা সাল</label>
                <input
                  type="text"
                  value={establishedYear}
                  onChange={(e) => setEstablishedYear(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">রেজিস্ট্রেশন নম্বর</label>
                <input
                  type="text"
                  value={regNumber}
                  onChange={(e) => setRegNumber(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block font-bold text-slate-700 mb-1">কার্যালয়ের ঠিকানা</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">জরুরি হেল্পলাইন নম্বর</label>
                <input
                  type="text"
                  value={hotline}
                  onChange={(e) => setHotline(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block font-bold text-slate-700 mb-1">অফিশিয়াল মোবাইল</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">অফিশিয়াল ইমেইল</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold shadow transition cursor-pointer active:scale-95"
              >
                <Save className="w-4 h-4" />
                <span>সংরক্ষণ করুন</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Payment Gateway Form Tab */}
      {activeTab === 'payments' && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-700" />
            <span>ডিজিটাল লেনদেন নম্বর ব্যবস্থাপনা</span>
          </h3>

          <form onSubmit={handleSavePayments} className="space-y-4 text-xs">
            {/* bKash */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="font-bold text-pink-600 block">বিকাশ (bKash) সেটিংস</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1">বিকাশ মোবাইল নম্বর</label>
                  <input
                    type="text"
                    value={bkashNumber}
                    onChange={(e) => setBkashNumber(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono font-bold bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">অ্যাকাউন্টের ধরন</label>
                  <input
                    type="text"
                    value={bkashType}
                    onChange={(e) => setBkashType(e.target.value)}
                    placeholder="Personal / Merchant"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Nagad */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="font-bold text-amber-600 block">নগদ (Nagad) সেটিংস</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1">নগদ মোবাইল নম্বর</label>
                  <input
                    type="text"
                    value={nagadNumber}
                    onChange={(e) => setNagadNumber(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono font-bold bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">অ্যাকাউন্টের ধরন</label>
                  <input
                    type="text"
                    value={nagadType}
                    onChange={(e) => setNagadType(e.target.value)}
                    placeholder="Personal / Merchant"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Rocket */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="font-bold text-violet-600 block">রকেট (Rocket) সেটিংস</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1">রকেট মোবাইল নম্বর</label>
                  <input
                    type="text"
                    value={rocketNumber}
                    onChange={(e) => setRocketNumber(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono font-bold bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">অ্যাকাউন্টের ধরন</label>
                  <input
                    type="text"
                    value={rocketType}
                    onChange={(e) => setRocketType(e.target.value)}
                    placeholder="Personal / Merchant"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  />
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

      {/* Security Form Tab */}
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
    </div>
  );
};
