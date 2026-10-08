import React, { useState, useMemo } from 'react';
import { 
  Wallet, 
  Search, 
  PlusCircle, 
  CheckCircle2, 
  Clock, 
  ArrowDownLeft, 
  CreditCard, 
  Phone, 
  Copy, 
  Check, 
  Edit, 
  Trash2, 
  X, 
  TrendingUp, 
  TrendingDown, 
  Send,
  AlertCircle,
  FileSpreadsheet,
  Filter
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
  onAddFundRecord: (fund: Omit<FundRecord, 'id'>) => Promise<FundRecord>;
  onEditFundRecord: (fund: FundRecord) => Promise<void>;
  onDeleteFundRecord: (id: string) => Promise<void>;
  onToggleStatus: (id: string, newStatus: PaymentStatus) => Promise<void>;
  manualTotalBalance: number | null;
  onUpdateManualTotalBalance?: (amount: number | null) => void;
  paymentConfig: PaymentGatewayConfig;
  isAdmin: boolean;
  onBack: () => void;
}

export const FundScreen: React.FC<FundScreenProps> = ({
  fundRecords,
  members,
  onAddFundRecord,
  onEditFundRecord,
  onDeleteFundRecord,
  onToggleStatus,
  manualTotalBalance,
  onUpdateManualTotalBalance,
  paymentConfig,
  isAdmin,
  onBack
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | PaymentStatus>('all');
  
  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<FundRecord | null>(null);
  const [isAdjustBalanceOpen, setIsAdjustBalanceOpen] = useState(false);
  const [newManualBalance, setNewManualBalance] = useState<string>(manualTotalBalance !== null ? manualTotalBalance.toString() : '');
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);
  const [smsSentNotice, setSmsSentNotice] = useState<string | null>(null);

  // Form states for Add/Edit
  const [formRecordType, setFormRecordType] = useState<'income' | 'expense'>('income');
  const [formSelectedMemberId, setFormSelectedMemberId] = useState<string>('');
  const [formMemberName, setFormMemberName] = useState<string>('');
  const [formPhone, setFormPhone] = useState<string>('');
  const [formAmount, setFormAmount] = useState<number | ''>(500);
  const [formStatus, setFormStatus] = useState<PaymentStatus>('Paid');
  const [formMonth, setFormMonth] = useState<string>('মার্চ ২০২৬');
  const [formDate, setFormDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [formCategory, setFormCategory] = useState<string>('মাসিক চাঁদা');
  const [formDescription, setFormDescription] = useState<string>('মাসিক নিয়মিত চাঁদা');
  const [formDisbursedTo, setFormDisbursedTo] = useState<string>('');
  const [formVoucherNo, setFormVoucherNo] = useState<string>('');
  const [formNotes, setFormNotes] = useState<string>('');
  const [formError, setFormError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. 100% COMPLETE AUTO-SYNC: All members are automatically populated into Fund Management
  const effectiveFundRecords = useMemo(() => {
    return autoSyncMembersToFunds(members, fundRecords);
  }, [members, fundRecords]);

  // Financial Statistics
  const totalIncome = useMemo(() => {
    return effectiveFundRecords
      .filter(f => f.status === 'Paid')
      .reduce((sum, f) => sum + (Number(f.amount) || 0), 0);
  }, [effectiveFundRecords]);

  const totalExpense = useMemo(() => {
    return effectiveFundRecords
      .filter(f => f.status === 'Expense')
      .reduce((sum, f) => sum + (Number(f.amount) || 0), 0);
  }, [effectiveFundRecords]);

  const totalDue = useMemo(() => {
    return effectiveFundRecords
      .filter(f => f.status === 'Due')
      .reduce((sum, f) => sum + (Number(f.amount) || 0), 0);
  }, [effectiveFundRecords]);

  const netBalance = manualTotalBalance !== null ? manualTotalBalance : (totalIncome - totalExpense);

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
        return matchesName || matchesPhone || matchesDesc || matchesMonth;
      }
      return true;
    });
  }, [effectiveFundRecords, statusFilter, searchTerm]);

  // Handle member selection in modal (Strict rule: NO manual typing of name or number)
  const handleMemberSelect = (memberId: string) => {
    setFormSelectedMemberId(memberId);
    const target = members.find(m => m.id === memberId);
    if (target) {
      setFormMemberName(target.name);
      setFormPhone(target.phone || '');
    } else {
      setFormMemberName('');
      setFormPhone('');
    }
  };

  const handleOpenAddModal = (isExpense = false) => {
    setFormRecordType(isExpense ? 'expense' : 'income');
    if (!isExpense && members.length > 0) {
      const first = members[0];
      setFormSelectedMemberId(first.id);
      setFormMemberName(first.name);
      setFormPhone(first.phone || '');
    } else {
      setFormSelectedMemberId('');
      setFormMemberName('');
      setFormPhone('');
    }
    setFormAmount(isExpense ? 1000 : 500);
    setFormStatus(isExpense ? 'Expense' : 'Paid');
    setFormMonth('মার্চ ২০২৬');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormCategory(isExpense ? 'খরচ' : 'মাসিক চাঁদা');
    setFormDescription(isExpense ? 'জরুরি ত্রাণ ও খাদ্য সহায়তা' : 'মাসিক নিয়মিত চাঁদা');
    setFormDisbursedTo('');
    setFormVoucherNo('');
    setFormNotes('');
    setFormError('');
    setEditingRecord(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (rec: FundRecord) => {
    setEditingRecord(rec);
    const isExp = rec.status === 'Expense';
    setFormRecordType(isExp ? 'expense' : 'income');
    setFormSelectedMemberId(rec.memberId || '');
    setFormMemberName(rec.memberName);
    setFormPhone(rec.phone || '');
    setFormAmount(rec.amount);
    setFormStatus(rec.status);
    setFormMonth(rec.month || 'মার্চ ২০২৬');
    setFormDate(rec.date || new Date().toISOString().split('T')[0]);
    setFormCategory(rec.category || (isExp ? 'খরচ' : 'মাসিক চাঁদা'));
    setFormDescription(rec.description || '');
    setFormDisbursedTo(rec.disbursedTo || '');
    setFormVoucherNo(rec.voucherNo || '');
    setFormNotes(rec.notes || '');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmitFund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formRecordType === 'income' && !formMemberName.trim()) {
      setFormError('অনুগ্রহ করে ড্রপডাউন থেকে একজন সদস্য নির্বাচন করুন');
      return;
    }
    if (formRecordType === 'expense' && !formDescription.trim()) {
      setFormError('ব্যয়ের সঠিক বিবরণ ও কারণ লিখুন');
      return;
    }
    if (formAmount === '' || Number(formAmount) <= 0) {
      setFormError('সঠিক টাকার পরিমাণ লিখুন');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    try {
      if (editingRecord) {
        const updated: FundRecord = {
          ...editingRecord,
          memberId: formRecordType === 'income' ? formSelectedMemberId : undefined,
          memberName: formRecordType === 'income' ? formMemberName.trim() : (formDisbursedTo.trim() || 'সাধারণ ব্যয়'),
          phone: formPhone.trim(),
          amount: Number(formAmount),
          status: formStatus,
          date: formDate,
          month: formMonth,
          category: formCategory,
          description: formDescription.trim(),
          disbursedTo: formDisbursedTo.trim(),
          voucherNo: formVoucherNo.trim(),
          notes: formNotes.trim(),
          approvedAt: formStatus === 'Paid' ? new Date().toISOString() : undefined
        };
        await onEditFundRecord(updated);
      } else {
        const newRecord: Omit<FundRecord, 'id'> = {
          memberId: formRecordType === 'income' ? formSelectedMemberId : undefined,
          memberName: formRecordType === 'income' ? formMemberName.trim() : (formDisbursedTo.trim() || 'সাধারণ ব্যয়'),
          phone: formPhone.trim(),
          amount: Number(formAmount),
          status: formStatus,
          date: formDate,
          month: formMonth,
          category: formCategory,
          description: formDescription.trim(),
          disbursedTo: formDisbursedTo.trim(),
          voucherNo: formVoucherNo.trim(),
          notes: formNotes.trim(),
          approvedAt: formStatus === 'Paid' ? new Date().toISOString() : undefined
        };
        await onAddFundRecord(newRecord);
      }
      setIsModalOpen(false);
      setEditingRecord(null);
    } catch {
      setFormError('ফান্ড রেকর্ড সংরক্ষণে সমস্যা হয়েছে');
    } finally {
      setIsSubmitting(false);
    }
  };

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
        months: rec.month || 'চলতি',
        money: rec.amount
      });
    } else {
      text = generateDirectSimDueSms({
        memberName: rec.memberName,
        money: rec.amount,
        monthCount: 1
      });
    }

    triggerDirectSimSms(phone, text);
    navigator.clipboard.writeText(text);
    setSmsSentNotice(`${rec.memberName}-এর জন্য মেসেজ ক্লিপবোর্ডে কপি হয়েছে`);
    setTimeout(() => setSmsSentNotice(null), 3500);
  };

  const handleSaveAdjustBalance = () => {
    if (onUpdateManualTotalBalance) {
      const val = newManualBalance.trim() ? parseFloat(newManualBalance.trim()) : null;
      onUpdateManualTotalBalance(val);
      setIsAdjustBalanceOpen(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 sm:pb-8">
      {/* 1. Header & Summary Bar */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                <Wallet className="w-5 h-5 text-emerald-700" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                    তহবিল ও চাঁদা ব্যবস্থাপনা
                  </h2>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    অটো-সিঙ্ক সক্রিয়
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  সকল কার্যকরী ও সাধারণ সদস্যদের চাঁদা আদায়, বকেয়া হিসাব ও খরচের ডিজিটাল ক্যাশবুক
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => handleOpenAddModal(false)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-md transition cursor-pointer active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>চাঁদা এন্ট্রি</span>
            </button>
            <button
              onClick={() => handleOpenAddModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold shadow-md transition cursor-pointer active:scale-95"
            >
              <ArrowDownLeft className="w-4 h-4" />
              <span>খরচ ভাউচার</span>
            </button>
          </div>
        </div>

        {/* Live Balance Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
          <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-100">
            <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>মোট আদায়কৃত চাঁদা</span>
            </span>
            <div className="text-xl sm:text-2xl font-black text-emerald-900 mt-1">
              {formatBengaliCurrency(totalIncome)}
            </div>
            <span className="text-[11px] text-emerald-700 mt-1 block">
              পরিশোধিত রেকর্ড: {toBengaliNumber(effectiveFundRecords.filter(f => f.status === 'Paid').length)}টি
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-rose-50/80 border border-rose-100">
            <span className="text-xs font-bold text-rose-800 flex items-center gap-1.5">
              <TrendingDown className="w-4 h-4 text-rose-600" />
              <span>মোট ব্যয় বা খরচ</span>
            </span>
            <div className="text-xl sm:text-2xl font-black text-rose-900 mt-1">
              {formatBengaliCurrency(totalExpense)}
            </div>
            <span className="text-[11px] text-rose-700 mt-1 block">
              ভাউচার সংখ্যা: {toBengaliNumber(effectiveFundRecords.filter(f => f.status === 'Expense').length)}টি
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-100">
            <span className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-600" />
              <span>মোট বকেয়া চাঁদা</span>
            </span>
            <div className="text-xl sm:text-2xl font-black text-amber-900 mt-1">
              {formatBengaliCurrency(totalDue)}
            </div>
            <span className="text-[11px] text-amber-700 mt-1 block">
              বকেয়া সদস্য: {toBengaliNumber(effectiveFundRecords.filter(f => f.status === 'Due').length)} জন
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-gradient-to-br from-teal-900 to-emerald-950 text-white relative flex flex-col justify-between shadow-sm">
            <div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-teal-200">বর্তমান নেট ব্যালেন্স</span>
                {isAdmin && (
                  <button
                    onClick={() => setIsAdjustBalanceOpen(true)}
                    className="text-[10px] text-amber-300 hover:underline cursor-pointer bg-white/10 px-2 py-0.5 rounded"
                  >
                    সমন্বয়
                  </button>
                )}
              </div>
              <div className="text-xl sm:text-2xl font-black text-white mt-1">
                {formatBengaliCurrency(netBalance)}
              </div>
            </div>
            <span className="text-[10px] text-teal-200 mt-1">
              {manualTotalBalance !== null ? 'ম্যানুয়াল ব্যালেন্স সক্রিয়' : 'স্বয়ংক্রিয় হিসাব সক্রিয়'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Search & Status Filter Tabs */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="সদস্যের নাম, মোবাইল নম্বর বা বিবরণ দিয়ে অনুসন্ধান..."
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

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              statusFilter === 'all' 
                ? 'bg-emerald-700 text-white shadow-xs' 
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            সকল রেকর্ড ({toBengaliNumber(effectiveFundRecords.length)})
          </button>
          <button
            onClick={() => setStatusFilter('Paid')}
            className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              statusFilter === 'Paid' 
                ? 'bg-emerald-700 text-white shadow-xs' 
                : 'bg-white text-emerald-800 hover:bg-emerald-50 border border-emerald-200'
            }`}
          >
            পরিশোধিত ({toBengaliNumber(effectiveFundRecords.filter(f => f.status === 'Paid').length)})
          </button>
          <button
            onClick={() => setStatusFilter('Due')}
            className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              statusFilter === 'Due' 
                ? 'bg-amber-600 text-white shadow-xs' 
                : 'bg-white text-amber-800 hover:bg-amber-50 border border-amber-200'
            }`}
          >
            বকেয়া ({toBengaliNumber(effectiveFundRecords.filter(f => f.status === 'Due').length)})
          </button>
          <button
            onClick={() => setStatusFilter('Expense')}
            className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              statusFilter === 'Expense' 
                ? 'bg-rose-700 text-white shadow-xs' 
                : 'bg-white text-rose-800 hover:bg-rose-50 border border-rose-200'
            }`}
          >
            খরচ / ব্যয় ({toBengaliNumber(effectiveFundRecords.filter(f => f.status === 'Expense').length)})
          </button>
        </div>
      </div>

      {smsSentNotice && (
        <div className="p-3.5 rounded-2xl bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-2 shadow-xs">
          <Check className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>{smsSentNotice}</span>
        </div>
      )}

      {/* 3. Fund Records Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
              <tr>
                <th className="p-3.5 sm:p-4">সদস্যের নাম ও বিবরণ</th>
                <th className="p-3.5 sm:p-4">মোবাইল নম্বর</th>
                <th className="p-3.5 sm:p-4">মাস ও তারিখ</th>
                <th className="p-3.5 sm:p-4">টাকার পরিমাণ</th>
                <th className="p-3.5 sm:p-4 text-center">স্ট্যাটাস</th>
                <th className="p-3.5 sm:p-4 text-right">পদক্ষেপ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.map((record) => {
                const isExpense = record.status === 'Expense';
                const isPaid = record.status === 'Paid';
                const isDue = record.status === 'Due';

                return (
                  <tr key={record.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3.5 sm:p-4">
                      <div className="font-bold text-slate-900 text-sm">
                        {record.memberName}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isExpense 
                            ? 'bg-rose-100 text-rose-800' 
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {record.category || 'মাসিক চাঁদা'}
                        </span>
                        <span>•</span>
                        <span>{record.description}</span>
                      </div>
                    </td>

                    <td className="p-3.5 sm:p-4">
                      {record.phone ? (
                        <div className="flex items-center gap-1.5 font-mono text-slate-700 font-bold">
                          <span>{record.phone}</span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(record.phone || '');
                              setCopiedPhone(record.phone || '');
                              setTimeout(() => setCopiedPhone(null), 2000);
                            }}
                            className="text-slate-400 hover:text-slate-600 p-0.5"
                            title="নম্বর কপি করুন"
                          >
                            {copiedPhone === record.phone ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">নম্বর নেই</span>
                      )}
                    </td>

                    <td className="p-3.5 sm:p-4 text-slate-600">
                      <div className="font-semibold text-slate-800">{record.month || 'চলতি মাস'}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{record.date}</div>
                    </td>

                    <td className="p-3.5 sm:p-4">
                      <span className={`font-black text-sm ${
                        isExpense ? 'text-rose-600' : isPaid ? 'text-emerald-700' : 'text-amber-600'
                      }`}>
                        {formatBengaliCurrency(record.amount)}
                      </span>
                    </td>

                    <td className="p-3.5 sm:p-4 text-center">
                      <button
                        onClick={() => {
                          if (isExpense) return;
                          onToggleStatus(record.id, isPaid ? 'Due' : 'Paid');
                        }}
                        disabled={isExpense}
                        className={`px-3 py-1 rounded-full text-[11px] font-bold inline-flex items-center gap-1 transition ${
                          isExpense
                            ? 'bg-rose-100 text-rose-800 cursor-default'
                            : isPaid
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 cursor-pointer shadow-2xs'
                              : 'bg-amber-100 text-amber-800 hover:bg-amber-200 cursor-pointer shadow-2xs'
                        }`}
                        title={isExpense ? 'খরচ রেকর্ড' : 'ক্লিক করে স্ট্যাটাস পরিবর্তন করুন'}
                      >
                        {isPaid && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                        {isDue && <Clock className="w-3.5 h-3.5 text-amber-600" />}
                        {isExpense && <ArrowDownLeft className="w-3.5 h-3.5 text-rose-600" />}
                        <span>
                          {isPaid ? 'পরিশোধিত' : isDue ? 'বকেয়া' : 'ব্যয়'}
                        </span>
                      </button>
                    </td>

                    <td className="p-3.5 sm:p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {!isExpense && record.phone && (
                          <button
                            onClick={() => handleSendSms(record)}
                            className="p-1.5 rounded-lg text-emerald-700 hover:bg-emerald-50 transition cursor-pointer"
                            title="সরাসরি SIM SMS পাঠান / রসিদ কপি করুন"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenEditModal(record)}
                          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition cursor-pointer"
                          title="সম্পাদনা করুন"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => {
                              if (confirm(`আপনি কি "${record.memberName}"-এর ফান্ড এন্ট্রিটি মুছে ফেলতে চান?`)) {
                                onDeleteFundRecord(record.id);
                              }
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                            title="মুছে ফেলুন"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredRecords.length === 0 && (
          <div className="p-12 text-center text-slate-500">
            <Wallet className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <p className="font-bold text-slate-700">কোনো ফান্ড রেকর্ড পাওয়া যায়নি</p>
          </div>
        )}
      </div>

      {/* 4. Digital Payment Gateway Section */}
      <PaymentGatewaySection 
        paymentConfig={paymentConfig} 
        members={members} 
      />

      {/* Add / Edit Fund Modal (Dropdown Member Selection: Auto-Populated) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 my-8 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <Wallet className="w-5 h-5 text-emerald-700" />
                <span>
                  {editingRecord 
                    ? 'ফান্ড রেকর্ড সম্পাদনা' 
                    : formRecordType === 'expense' 
                      ? 'নতুন খরচের ভাউচার এন্ট্রি' 
                      : 'চাঁদা আদায় এন্ট্রি'}
                </span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
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

            <form onSubmit={handleSubmitFund} className="space-y-3.5 text-xs">
              {/* Record Type Toggle if adding */}
              {!editingRecord && (
                <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setFormRecordType('income');
                      setFormStatus('Paid');
                      setFormCategory('মাসিক চাঁদা');
                      if (members.length > 0) {
                        setFormSelectedMemberId(members[0].id);
                        setFormMemberName(members[0].name);
                        setFormPhone(members[0].phone || '');
                      }
                    }}
                    className={`py-2 rounded-xl font-bold transition ${
                      formRecordType === 'income' 
                        ? 'bg-emerald-700 text-white shadow-xs' 
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    চাঁদা আদায় (Income)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormRecordType('expense');
                      setFormStatus('Expense');
                      setFormCategory('খরচ');
                      setFormSelectedMemberId('');
                      setFormMemberName('');
                      setFormPhone('');
                    }}
                    className={`py-2 rounded-xl font-bold transition ${
                      formRecordType === 'expense' 
                        ? 'bg-rose-700 text-white shadow-xs' 
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    খরচ / ব্যয় (Expense)
                  </button>
                </div>
              )}

              {/* INCOME: Member Dropdown Selection (Strictly No manual typing) */}
              {formRecordType === 'income' ? (
                <>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      সদস্য নির্বাচন করুন (নাম ও নম্বর অটো-সিঙ্ক হবে) <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formSelectedMemberId}
                      onChange={(e) => handleMemberSelect(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-white font-medium text-slate-800"
                    >
                      <option value="">-- ড্রপডাউন থেকে সদস্য নির্বাচন করুন --</option>
                      {members.map(m => (
                        <option key={m.id} value={m.id}>
                          #{toBengaliNumber(m.serial)} {m.name} ({m.designation}) - {m.phone}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">সদস্যের নাম (অটো-সিঙ্ক)</label>
                      <input
                        type="text"
                        readOnly
                        value={formMemberName}
                        placeholder="অটোমেটিক পূরণ হবে"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-bold cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">মোবাইল নম্বর (অটো-সিঙ্ক)</label>
                      <input
                        type="text"
                        readOnly
                        value={formPhone}
                        placeholder="অটোমেটিক পূরণ হবে"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-mono font-bold cursor-not-allowed"
                      />
                    </div>
                  </div>
                </>
              ) : (
                /* EXPENSE: Disbursed to and Voucher input */
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      ব্যয়ের দায়িত্বশীল / গ্রহীতার নাম <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formDisbursedTo}
                      onChange={(e) => setFormDisbursedTo(e.target.value)}
                      placeholder="যেমন: মো: কামরুল ইসলাম"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">ভাউচার / স্লিপ নম্বর</label>
                    <input
                      type="text"
                      value={formVoucherNo}
                      onChange={(e) => setFormVoucherNo(e.target.value)}
                      placeholder="যেমন: V-2026-001"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 font-mono"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    টাকার পরিমাণ (৳) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">স্ট্যাটাস</label>
                  {formRecordType === 'expense' ? (
                    <input
                      type="text"
                      readOnly
                      value="Expense (ব্যয়)"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-rose-700 font-bold"
                    />
                  ) : (
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value as PaymentStatus)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-white font-bold"
                    >
                      <option value="Paid">Paid (পরিশোধিত)</option>
                      <option value="Due">Due (বকেয়া)</option>
                    </select>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">মাস</label>
                  <input
                    type="text"
                    value={formMonth}
                    onChange={(e) => setFormMonth(e.target.value)}
                    placeholder="মার্চ ২০২৬"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">তারিখ</label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">বিবরণ / কারণ</label>
                <input
                  type="text"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="মাসিক নিয়মিত চাঁদা / ত্রাণ বাবদ ব্যয়"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
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

      {/* Adjust Manual Balance Modal */}
      {isAdjustBalanceOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-900">ফান্ড ব্যালেন্স সমন্বয়</h3>
              <button onClick={() => setIsAdjustBalanceOpen(false)} className="text-slate-400 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-500">
              আপনি চাইলে স্বয়ংক্রিয় হিসাবের বদলে সুনির্দিষ্ট নগদ ক্যাশ টাকার পরিমাণ নির্ধারণ করে দিতে পারেন।
            </p>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">নতুন ব্যালেন্স (টাকা)</label>
              <input
                type="number"
                value={newManualBalance}
                onChange={(e) => setNewManualBalance(e.target.value)}
                placeholder="যেমন: ২৫০০০ (ফাঁকা রাখলে স্বয়ংক্রিয় হবে)"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setNewManualBalance('');
                  if (onUpdateManualTotalBalance) onUpdateManualTotalBalance(null);
                  setIsAdjustBalanceOpen(false);
                }}
                className="px-3 py-1.5 rounded-xl text-xs text-slate-600 hover:bg-slate-100"
              >
                রিসেট (স্বয়ংক্রিয়)
              </button>
              <button
                type="button"
                onClick={handleSaveAdjustBalance}
                className="px-4 py-1.5 rounded-xl text-xs bg-emerald-700 hover:bg-emerald-800 text-white font-bold shadow"
              >
                সংরক্ষণ করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
