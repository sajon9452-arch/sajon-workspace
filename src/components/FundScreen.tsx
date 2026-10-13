import React, { useState, useMemo } from 'react';
import { 
  Wallet, 
  Search, 
  CheckCircle2, 
  Clock, 
  Phone, 
  Copy, 
  Check, 
  TrendingUp, 
  TrendingDown, 
  Send,
  ShieldCheck,
  Lock,
  Receipt,
  Coins,
  Sparkles,
  LayoutGrid,
  User,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { FundRecord, Member, PaymentStatus, PaymentGatewayConfig } from '../types';
import { 
  toBengaliNumber, 
  formatBengaliCurrency, 
  sanitizePhone 
} from '../utils/helpers';
import { autoSyncMembersToFunds } from '../utils/memberFundLinker';
import { generateDirectSimPaidSms, generateDirectSimDueSms, triggerDirectSimSms } from '../utils/smsHelper';
import { PaymentGatewaySection } from './PaymentGatewaySection';

interface FundScreenProps {
  fundRecords: FundRecord[];
  members: Member[];
  manualTotalBalance: number | null;
  monthlyExpense?: number;
  extraMoney?: number;
  paymentConfig: PaymentGatewayConfig;
  isAdmin?: boolean;
  onBack?: () => void;
}

export const FundScreen: React.FC<FundScreenProps> = ({
  fundRecords,
  members,
  manualTotalBalance,
  monthlyExpense = 0,
  extraMoney = 0,
  paymentConfig,
  isAdmin
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | PaymentStatus>('all');
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);
  const [smsSentNotice, setSmsSentNotice] = useState<string | null>(null);

  // 1. 100% COMPLETE AUTO-SYNC: All members are automatically populated into Fund Management
  // Name, Mobile Number, and Designation are strictly auto-synced from Member list
  const effectiveFundRecords = useMemo(() => {
    return autoSyncMembersToFunds(members, fundRecords);
  }, [members, fundRecords]);

  // Fast Member Lookup Map for photoUrl & real-time live designation sync
  const memberMap = useMemo(() => {
    const map = new Map<string, Member>();
    members.forEach(m => {
      if (m.id) map.set(m.id, m);
      if (m.phone) map.set(sanitizePhone(m.phone), m);
    });
    return map;
  }, [members]);

  // Financial Statistics
  const totalIncome = useMemo(() => {
    return effectiveFundRecords
      .reduce((sum, f) => {
        if (f.paidAmount !== undefined && !isNaN(Number(f.paidAmount))) {
          return sum + Number(f.paidAmount);
        }
        return f.status === 'Paid' ? sum + (Number(f.amount) || 0) : sum;
      }, 0);
  }, [effectiveFundRecords]);

  const totalDue = useMemo(() => {
    return effectiveFundRecords
      .reduce((sum, f) => {
        if (f.dueAmount !== undefined && !isNaN(Number(f.dueAmount))) {
          return sum + Number(f.dueAmount);
        }
        return f.status === 'Due' ? sum + (Number(f.amount) || 0) : sum;
      }, 0);
  }, [effectiveFundRecords]);

  // Requirement 1: Current Net Balance is strictly manualTotalBalance (never auto-calculated from entries)
  const netBalance = manualTotalBalance !== null && manualTotalBalance !== undefined ? manualTotalBalance : 0;

  // Filtered Records
  const filteredRecords = useMemo(() => {
    return effectiveFundRecords.filter(f => {
      if (statusFilter !== 'all' && f.status !== statusFilter) return false;

      if (searchTerm.trim()) {
        const q = searchTerm.trim().toLowerCase();
        const matchesName = (f.memberName || '').toLowerCase().includes(q);
        const matchesPhone = (f.phone || '').includes(q);
        const matchesDesc = (f.description || '').toLowerCase().includes(q);
        const matchesMonth = (f.month || '').toLowerCase().includes(q);
        const matchesPaidMonths = (f.paidMonths || '').toLowerCase().includes(q);
        const matchesDueMonths = (f.dueMonths || '').toLowerCase().includes(q);
        const matchesDesignation = (f.designation || '').toLowerCase().includes(q);
        return matchesName || matchesPhone || matchesDesc || matchesMonth || matchesPaidMonths || matchesDueMonths || matchesDesignation;
      }
      return true;
    });
  }, [effectiveFundRecords, statusFilter, searchTerm]);

  const handleSendSms = (rec: FundRecord) => {
    const phone = rec.phone;
    if (!phone) {
      alert('এই সদস্যের মোবাইল নম্বর যুক্ত নেই');
      return;
    }

    let text = '';
    if (rec.status === 'Paid') {
      text = generateDirectSimPaidSms({
        memberName: rec.memberName,
        months: rec.paidMonths || rec.month || 'চলতি',
        money: rec.paidAmount || rec.amount
      });
    } else {
      text = generateDirectSimDueSms({
        memberName: rec.memberName,
        money: rec.dueAmount || rec.amount,
        monthCount: 1
      });
    }

    triggerDirectSimSms(phone, text);
    navigator.clipboard.writeText(text);
    setSmsSentNotice(`${rec.memberName}-এর জন্য মেসেজ ক্লিপবোর্ডে কপি হয়েছে ও SMS প্রস্তুত`);
    setTimeout(() => setSmsSentNotice(null), 3500);
  };

  return (
    <div className="space-y-6 pb-20 sm:pb-8">
      {/* 1. Header & Summary Bar */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center shrink-0 shadow-md">
                <Wallet className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                    তহবিল ও চাঁদা ডিরেক্টরি
                  </h2>
                  <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    স্বয়ংক্রিয় সিঙ্ক সক্রিয়
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  সদস্য তালিকা থেকে সরাসরি সিঙ্ককৃত চাঁদা আদায়, বকেয়া হিসাব ও সংগঠনের সামগ্রিক আর্থিক বিবরণী
                </p>
              </div>
            </div>
          </div>

          {isAdmin ? (
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>ব্যালেন্স ও চাঁদা পরিবর্তনের জন্য অ্যাডমিন প্যানেল ব্যবহার করুন</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-600 text-xs font-medium">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>পাবলিক ভিউ: শুধুমাত্র প্রদর্শনযোগ্য</span>
            </div>
          )}
        </div>

        {/* Requirements 1 & 2: Financial Summary Cards in Bangla
            1. বর্তমান নেট ব্যালেন্স (Editable from Admin Panel)
            2. মাসিক খরচ (Monthly Expense - Editable from Admin Panel)
            3. এক্সট্রা টাকা (Extra Money - Editable from Admin Panel)
            4. মোট আদায়কৃত চাঁদা (Total Income)
            5. মোট বকেয়া চাঁদা (Total Due)
        */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5 pt-2 border-t border-slate-100">
          {/* Card 1: বর্তমান নেট ব্যালেন্স (Hero Card) */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-teal-900 via-emerald-950 to-slate-900 text-white relative flex flex-col justify-between shadow-md border border-teal-700/40">
            <div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-teal-200 flex items-center gap-1.5">
                  <Wallet className="w-3.5 h-3.5 text-teal-300" />
                  <span>বর্তমান নেট ব্যালেন্স</span>
                </span>
                <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full text-teal-100 font-bold backdrop-blur-xs">
                  অফিসিয়াল
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-black mt-2 text-white tracking-tight">
                {formatBengaliCurrency(netBalance)}
              </div>
            </div>
            <span className="text-[10px] text-teal-200/90 mt-2.5 block font-medium">
              সংগঠনের অনুমোদিত মূল তহবিল স্থিতি
            </span>
          </div>

          {/* Card 2: মাসিক খরচ (Monthly Expense - Fully Editable) */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-50 to-red-50/80 border border-rose-200 text-rose-950 relative flex flex-col justify-between shadow-2xs">
            <div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-rose-800 flex items-center gap-1.5">
                  <Receipt className="w-3.5 h-3.5 text-rose-600" />
                  <span>মাসিক খরচ</span>
                </span>
                <span className="text-[10px] bg-rose-200/70 text-rose-800 px-2 py-0.5 rounded-full font-bold">
                  বাজেট / ব্যয়
                </span>
              </div>
              <div className="text-xl sm:text-2xl font-black mt-2 text-rose-900 tracking-tight">
                {formatBengaliCurrency(monthlyExpense)}
              </div>
            </div>
            <span className="text-[10px] text-rose-700 mt-2.5 block font-medium">
              চলতি মাসের অনুমোদিত সার্বিক ব্যয়
            </span>
          </div>

          {/* Card 3: এক্সট্রা টাকা (Extra Money - Fully Editable) */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50/80 border border-indigo-200 text-indigo-950 relative flex flex-col justify-between shadow-2xs">
            <div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-indigo-800 flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5 text-indigo-600" />
                  <span>এক্সট্রা টাকা</span>
                </span>
                <span className="text-[10px] bg-indigo-200/70 text-indigo-800 px-2 py-0.5 rounded-full font-bold">
                  সংরক্ষিত
                </span>
              </div>
              <div className="text-xl sm:text-2xl font-black mt-2 text-indigo-900 tracking-tight">
                {formatBengaliCurrency(extraMoney)}
              </div>
            </div>
            <span className="text-[10px] text-indigo-700 mt-2.5 block font-medium">
              আপৎকালীন ও অতিরিক্ত সংরক্ষিত তহবিল
            </span>
          </div>

          {/* Card 4: মোট আদায়কৃত চাঁদা */}
          <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-emerald-950 flex flex-col justify-between shadow-2xs">
            <div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                  <span>মোট আদায়কৃত চাঁদা</span>
                </span>
                <span className="text-[10px] bg-emerald-200/70 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                  আদায়
                </span>
              </div>
              <div className="text-xl sm:text-2xl font-black mt-2 text-emerald-900 tracking-tight">
                {formatBengaliCurrency(totalIncome)}
              </div>
            </div>
            <span className="text-[10px] text-emerald-700 mt-2.5 block font-medium">
              পরিশোধকারী: {toBengaliNumber(effectiveFundRecords.filter(f => f.status === 'Paid').length)} জন
            </span>
          </div>

          {/* Card 5: মোট বকেয়া চাঁদা */}
          <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-950 flex flex-col justify-between shadow-2xs">
            <div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>মোট বকেয়া চাঁদা</span>
                </span>
                <span className="text-[10px] bg-amber-200/70 text-amber-800 px-2 py-0.5 rounded-full font-bold">
                  বকেয়া
                </span>
              </div>
              <div className="text-xl sm:text-2xl font-black mt-2 text-amber-900 tracking-tight">
                {formatBengaliCurrency(totalDue)}
              </div>
            </div>
            <span className="text-[10px] text-amber-700 mt-2.5 block font-medium">
              বকেয়া সদস্য: {toBengaliNumber(effectiveFundRecords.filter(f => f.status === 'Due').length)} জন
            </span>
          </div>
        </div>
      </div>

      {smsSentNotice && (
        <div className="p-4 rounded-2xl bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{smsSentNotice}</span>
          </div>
        </div>
      )}

      {/* 2. Search, Status Filter & View Mode Switcher */}
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="সদস্যের নাম, পদবি, মোবাইল নম্বর বা মাস দিয়ে খুঁজুন..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-2xs"
          />
        </div>

        <div className="flex items-center gap-2 justify-between md:justify-end flex-wrap">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                statusFilter === 'all' 
                  ? 'bg-emerald-700 text-white shadow-xs' 
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              সকল ({toBengaliNumber(effectiveFundRecords.length)})
            </button>
            <button
              onClick={() => setStatusFilter('Paid')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1 ${
                statusFilter === 'Paid' 
                  ? 'bg-emerald-700 text-white shadow-xs' 
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
              <span>পরিশোধিত ({toBengaliNumber(effectiveFundRecords.filter(f => f.status === 'Paid').length)})</span>
            </button>
            <button
              onClick={() => setStatusFilter('Due')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1 ${
                statusFilter === 'Due' 
                  ? 'bg-amber-600 text-white shadow-xs' 
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-amber-200" />
              <span>বকেয়া ({toBengaliNumber(effectiveFundRecords.filter(f => f.status === 'Due').length)})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Requirement 2: Auto-Synced Member Fund Cards (Strictly Card View Only, Prominent & Larger) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {filteredRecords.map((record) => {
            const isPaid = record.status === 'Paid';
            const matchedMember = record.memberId 
              ? memberMap.get(record.memberId) 
              : (record.phone ? memberMap.get(sanitizePhone(record.phone)) : null);

            // Auto-synced details from Member list:
            const memberName = matchedMember ? matchedMember.name : record.memberName;
            const memberPhone = matchedMember?.phone || record.phone || '';
            const memberDesignation = matchedMember?.designation || record.designation || 'সাধারণ সদস্য';
            const memberPhoto = matchedMember?.photoUrl;

            return (
              <div 
                key={record.id}
                className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all space-y-4 relative flex flex-col justify-between"
              >
                <div>
                  {/* Top Header: Avatar, Name, Designation & Status Badge */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3.5 min-w-0">
                      {memberPhoto ? (
                        <img 
                          src={memberPhoto} 
                          alt={memberName} 
                          className="w-13 h-13 rounded-2xl object-cover border-2 border-emerald-500/20 shrink-0 shadow-xs" 
                        />
                      ) : (
                        <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 text-emerald-800 font-black text-base flex items-center justify-center shrink-0 border border-emerald-200/60 shadow-2xs">
                          {memberName.charAt(0) || <User className="w-6 h-6 text-emerald-700" />}
                        </div>
                      )}
                      <div className="min-w-0">
                        <h3 className="text-base sm:text-lg font-black text-slate-900 truncate leading-snug">
                          {memberName}
                        </h3>
                        {/* Auto-synced Designation (পদবি) */}
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/70 inline-flex items-center gap-1">
                            <span>{memberDesignation}</span>
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            স্বয়ংক্রিয় সিঙ্ক
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-black inline-flex items-center gap-1.5 shrink-0 select-none border shadow-2xs ${
                        isPaid
                          ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                          : 'bg-amber-100 text-amber-900 border-amber-300'
                      }`}
                    >
                      {isPaid ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                          <span>পরিশোধিত</span>
                        </>
                      ) : (
                        <>
                          <Clock className="w-3.5 h-3.5 text-amber-700" />
                          <span>বকেয়া</span>
                        </>
                      )}
                    </span>
                  </div>

                  {/* Financial Details Box */}
                  <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500">চাঁদার পরিমাণ:</span>
                      <span className={`text-xl sm:text-2xl font-black ${isPaid ? 'text-emerald-700' : 'text-amber-600'}`}>
                        {formatBengaliCurrency(record.amount)}
                      </span>
                    </div>

                    {/* Dues & Payments Specific Details (Requirement 4) */}
                    {(record.paidAmount !== undefined || record.dueAmount !== undefined) && (
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 text-xs">
                        <div className="p-2 rounded-xl bg-emerald-50/70 border border-emerald-100">
                          <span className="text-[10px] text-emerald-700 block font-bold">পরিশোধিত টাকা:</span>
                          <span className="font-mono font-black text-emerald-900">
                            {formatBengaliCurrency(record.paidAmount ?? (isPaid ? record.amount : 0))}
                          </span>
                        </div>
                        <div className="p-2 rounded-xl bg-amber-50/70 border border-amber-100">
                          <span className="text-[10px] text-amber-700 block font-bold">বকেয়া টাকা:</span>
                          <span className="font-mono font-black text-amber-900">
                            {formatBengaliCurrency(record.dueAmount ?? (!isPaid ? record.amount : 0))}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Month Details & Month breakdown */}
                    <div className="pt-2 border-t border-slate-200/80 text-xs space-y-1.5">
                      <div className="flex items-center justify-between text-slate-700">
                        <span className="text-slate-500 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>নির্ধারিত মাস:</span>
                        </span>
                        <span className="font-bold text-slate-800">{record.month || 'চলতি মাস'}</span>
                      </div>

                      {/* Specific Paid Months (পরিশোধিত মাসসমূহ) */}
                      {record.paidMonths && (
                        <div className="flex items-start justify-between gap-2 text-[11px]">
                          <span className="text-emerald-700 font-bold shrink-0">পরিশোধিত মাস:</span>
                          <span className="font-bold text-emerald-900 text-right bg-emerald-100/70 px-2 py-0.5 rounded-lg border border-emerald-200">
                            {record.paidMonths}
                          </span>
                        </div>
                      )}

                      {/* Specific Due Months (বকেয়া মাসসমূহ) */}
                      {record.dueMonths && (
                        <div className="flex items-start justify-between gap-2 text-[11px]">
                          <span className="text-amber-700 font-bold shrink-0">বকেয়া মাস:</span>
                          <span className="font-bold text-amber-900 text-right bg-amber-100/70 px-2 py-0.5 rounded-lg border border-amber-200">
                            {record.dueMonths}
                          </span>
                        </div>
                      )}

                      {record.notes && (
                        <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                          <strong>বিবরণ:</strong> {record.notes}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bottom Actions: Auto-synced Mobile Number & SMS Receipt Button */}
                <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100 flex-wrap">
                  {/* Phone with copy */}
                  {memberPhone ? (
                    <div className="flex items-center gap-2">
                      <a 
                        href={`tel:${memberPhone}`}
                        className="flex items-center gap-1.5 font-mono text-xs font-bold text-slate-800 hover:text-emerald-700 transition"
                      >
                        <Phone className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{memberPhone}</span>
                      </a>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(memberPhone);
                          setCopiedPhone(memberPhone);
                          setTimeout(() => setCopiedPhone(null), 2000);
                        }}
                        className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100 cursor-pointer transition"
                        title="নম্বর কপি করুন"
                      >
                        {copiedPhone === memberPhone ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  ) : (
                    <span className="text-[11px] text-slate-400 italic">নম্বর সংযুক্ত নেই</span>
                  )}

                  {/* SMS Action */}
                  {memberPhone && (
                    <button
                      onClick={() => handleSendSms(record)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs transition cursor-pointer border border-emerald-200 active:scale-95"
                    >
                      <Send className="w-3 h-3 text-emerald-600" />
                      <span>SMS রসিদ</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

      {filteredRecords.length === 0 && (
        <div className="p-12 text-center text-slate-500 bg-white rounded-3xl border border-slate-200">
          <Wallet className="w-12 h-12 text-slate-300 mx-auto mb-2" />
          <p className="font-bold text-slate-700">কোনো চাঁদা রেকর্ড পাওয়া যায়নি</p>
          <p className="text-xs text-slate-400 mt-0.5">সদস্য তালিকা থেকে নতুন সদস্য যুক্ত হলে তা স্বয়ংক্রিয়ভাবে এখানে প্রদর্শিত হবে</p>
        </div>
      )}

      {/* 4. Digital Payment Gateway Section (Official bKash, Nagad, Rocket) */}
      <PaymentGatewaySection 
        paymentConfig={paymentConfig} 
        members={members} 
      />
    </div>
  );
};
