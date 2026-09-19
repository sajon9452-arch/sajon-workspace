import React, { useState, useMemo } from 'react';
import { 
  Wallet, 
  Plus, 
  ArrowLeft, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  TrendingUp, 
  TrendingDown, 
  Coins, 
  Receipt, 
  UserCheck, 
  Edit2, 
  Trash2, 
  Calendar, 
  X,
  Sparkles,
  RotateCcw,
  Check,
  Copy,
  Smartphone,
  Send,
  ShieldCheck,
  CreditCard,
  Clock,
  FileText,
  Layers,
  MessageSquare,
  LayoutGrid,
  List
} from 'lucide-react';
import { FundRecord, PaymentStatus, PaymentGatewayConfig, Member } from '../types';
import { toBengaliCurrency, toBengaliNumber, formatBengaliDate, getCleanFundDescription } from '../utils/helpers';
import { loadPaymentSettings, loadMembers } from '../utils/storage';
import { ExpenseModal } from './ExpenseModal';
import { DueSmsModal } from './DueSmsModal';
import { 
  triggerDirectSimSms, 
  generatePaidConfirmationSms, 
  generateDirectSimPaidSms,
  generateDirectSimDueSms,
  resolveMemberPhone,
  buildDirectSimSmsUrl,
  extractArrearsMonthCount,
  ARREARS_MONTH_OPTIONS
} from '../utils/smsHelper';

interface FundScreenProps {
  fundRecords: FundRecord[];
  members?: Member[];
  onAddFundRecord: (record: Omit<FundRecord, 'id'>) => void;
  onToggleStatus?: (id: string, newStatus: PaymentStatus) => void;
  onEditFundRecord?: (record: FundRecord) => void;
  onDeleteFundRecord?: (id: string) => void;
  manualTotalBalance?: number | null;
  onUpdateManualTotalBalance?: (amount: number | null) => void;
  paymentConfig?: PaymentGatewayConfig;
  isAdmin?: boolean;
  onBack: () => void;
}

export const FundScreen: React.FC<FundScreenProps> = ({
  fundRecords,
  members,
  onAddFundRecord,
  onToggleStatus,
  onEditFundRecord,
  onDeleteFundRecord,
  manualTotalBalance = null,
  onUpdateManualTotalBalance,
  paymentConfig: passedPaymentConfig,
  isAdmin = false,
  onBack,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | PaymentStatus>('all');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<FundRecord | null>(null);

  // Expense Breakdown Modal State
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<FundRecord | null>(null);

  // Manual Total Balance Modal State
  const [isEditBalanceModalOpen, setIsEditBalanceModalOpen] = useState(false);
  const [manualBalanceInput, setManualBalanceInput] = useState<string>('');
  const [balanceSaveSuccess, setBalanceSaveSuccess] = useState(false);

  // Form State
  const [memberName, setMemberName] = useState('');
  const [amount, setAmount] = useState<number | ''>(500);
  const [status, setStatus] = useState<PaymentStatus>('Paid');
  const [description, setDescription] = useState('মাসিক নিয়মিত চাঁদা');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState<'মাসিক চাঁদা' | 'এককালীন অনুদান' | 'জরুরি সাহায্য' | 'খরচ'>('মাসিক চাঁদা');
  const [formError, setFormError] = useState('');
  const [formMonth, setFormMonth] = useState('মার্চ ২০২৬');
  const [formPhone, setFormPhone] = useState('');
  const [arrearsMonthCount, setArrearsMonthCount] = useState<number>(1);
  const [pastMonthsText, setPastMonthsText] = useState<string>('');
  const [modalSmsNotice, setModalSmsNotice] = useState<string | null>(null);

  // Payment Gateway Selection & Direct Subscription State (Default: null - collapsed by default)
  const paymentConfig = passedPaymentConfig || loadPaymentSettings();
  const [selectedGateway, setSelectedGateway] = useState<'bkash' | 'nagad' | 'rocket' | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Quick Deposit/Subscription Form State
  const [depositMemberName, setDepositMemberName] = useState('');
  const [depositAmount, setDepositAmount] = useState<number | ''>(500);
  const [depositTrxId, setDepositTrxId] = useState('');
  const [depositSenderPhone, setDepositSenderPhone] = useState('');
  const [depositSuccessMsg, setDepositSuccessMsg] = useState('');
  const [depositErrorMsg, setDepositErrorMsg] = useState('');

  // SMS Integration States: Paid Auto-Trigger & Due Manual Trigger
  const allMembers = useMemo(() => {
    return members && members.length > 0 ? members : loadMembers();
  }, [members]);

  const [paidSmsToast, setPaidSmsToast] = useState<{
    memberName: string;
    phone: string;
    amount: number;
    smsText: string;
  } | null>(null);

  const [dueSmsTarget, setDueSmsTarget] = useState<{
    memberName: string;
    phone?: string;
    amount?: number;
    month?: string;
    memberId?: string;
  } | null>(null);

  // Computed Live SMS Preview for Fund Modal
  const currentModalSmsPreview = useMemo(() => {
    const moneyVal = amount !== '' ? amount : 0;
    const nameVal = memberName.trim() || '[সদস্যের নাম]';
    if (status === 'Paid') {
      return generateDirectSimPaidSms({
        memberName: nameVal,
        months: formMonth.trim() || 'চলতি',
        money: moneyVal
      });
    }
    if (status === 'Due') {
      return generateDirectSimDueSms({
        memberName: nameVal,
        money: moneyVal,
        monthCount: arrearsMonthCount,
        pastMonthsText: pastMonthsText.trim()
      });
    }
    return '';
  }, [memberName, amount, status, formMonth, arrearsMonthCount, pastMonthsText]);

  // Handle direct SMS click from modal
  const handleSendDirectSmsFromModal = () => {
    if (!memberName.trim()) {
      setFormError('অনুগ্রহ করে সদস্যের নাম লিখুন');
      return;
    }

    const resolvedPhone = formPhone.trim() || resolveMemberPhone({ memberName: memberName.trim() }, allMembers);
    const moneyVal = amount !== '' ? amount : 0;

    let smsText = '';
    if (status === 'Paid') {
      smsText = generateDirectSimPaidSms({
        memberName: memberName.trim(),
        months: formMonth.trim() || 'চলতি',
        money: moneyVal
      });
    } else if (status === 'Due') {
      smsText = generateDirectSimDueSms({
        memberName: memberName.trim(),
        money: moneyVal,
        monthCount: arrearsMonthCount,
        pastMonthsText: pastMonthsText.trim()
      });
    } else {
      smsText = generateDirectSimPaidSms({
        memberName: memberName.trim(),
        months: formMonth.trim() || 'চলতি',
        money: moneyVal
      });
    }

    // Trigger Direct SIM SMS intent
    triggerDirectSimSms(resolvedPhone, smsText);

    // Also copy to clipboard for user convenience
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(smsText).catch(() => {});
    }

    setModalSmsNotice(
      resolvedPhone
        ? `${resolvedPhone} নম্বরে সরাসরি SIM SMS অ্যাপ চালু হয়েছে এবং মেসেজ কপি হয়েছে`
        : 'সরাসরি SIM SMS অ্যাপ চালু হয়েছে এবং মেসেজ ক্লিপবোর্ডে কপি হয়েছে'
    );
    setTimeout(() => setModalSmsNotice(null), 5000);
  };

  const handleApproveOrTogglePaid = (record: FundRecord, targetStatus?: PaymentStatus) => {
    const nextStatus: PaymentStatus = targetStatus || (record.status === 'Paid' ? 'Due' : 'Paid');
    if (onToggleStatus) {
      onToggleStatus(record.id, nextStatus);
    }

    // Auto-trigger Direct SIM SMS when payment is approved or marked as Paid
    if (nextStatus === 'Paid') {
      const memberPhone = resolveMemberPhone(record, allMembers);
      const smsText = generatePaidConfirmationSms({
        memberName: record.memberName,
        amount: record.amount,
        month: record.month,
        trxId: record.trxId
      });

      if (memberPhone) {
        triggerDirectSimSms(memberPhone, smsText);
      }

      setPaidSmsToast({
        memberName: record.memberName,
        phone: memberPhone,
        amount: record.amount,
        smsText
      });
      setTimeout(() => {
        setPaidSmsToast(prev => prev?.memberName === record.memberName ? null : prev);
      }, 9000);
    }
  };

  const handleCopyNumber = (num: string, gatewayKey: string) => {
    if (!num) return;
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(num).catch(() => {
          fallbackCopyText(num);
        });
      } else {
        fallbackCopyText(num);
      }
    } catch {
      fallbackCopyText(num);
    }
    setCopiedField(gatewayKey);
    setTimeout(() => setCopiedField(null), 2500);
  };

  const fallbackCopyText = (text: string) => {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand('copy');
      textArea.remove();
    } catch {
      // Ignore if document is restricted
    }
  };

  // Submits user subscription as PENDING verification
  const handleQuickDepositSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDepositErrorMsg('');
    if (!selectedGateway) {
      setDepositErrorMsg('অনুগ্রহ করে একটি পেমেন্ট মেথড (বিকাশ / নগদ / রকেট) নির্বাচন করুন');
      return;
    }
    if (!depositMemberName.trim()) {
      setDepositErrorMsg('অনুগ্রহ করে আপনার নাম লিখুন');
      return;
    }
    if (!depositAmount || Number(depositAmount) <= 0) {
      setDepositErrorMsg('সঠিক চাঁদার পরিমাণ লিখুন');
      return;
    }
    if (!depositTrxId.trim()) {
      setDepositErrorMsg('অনুগ্রহ করে Transaction ID (TrxID) লিখুন');
      return;
    }

    const gatewayName = selectedGateway === 'bkash' ? 'বিকাশ (bKash)' : selectedGateway === 'nagad' ? 'নগদ (Nagad)' : 'রকেট (Rocket)';
    const noteText = `মাসিক চাঁদা (${gatewayName} - TrxID: ${depositTrxId.trim()}${depositSenderPhone.trim() ? `, প্রেরক: ${depositSenderPhone.trim()}` : ''})`;

    onAddFundRecord({
      memberName: depositMemberName.trim(),
      amount: Number(depositAmount),
      status: 'Pending', // User deposits start as Pending until verified and approved by admin
      description: noteText,
      date: new Date().toISOString().split('T')[0],
      category: 'মাসিক চাঁদা',
      phone: depositSenderPhone.trim() || '',
      trxId: depositTrxId.trim(),
      senderPhone: depositSenderPhone.trim() || '',
      gateway: selectedGateway,
      notes: `অপেক্ষমান যাচাই (TrxID: ${depositTrxId.trim()})`
    });

    setDepositSuccessMsg(`ধন্যবাদ ${depositMemberName.trim()}! আপনার ${gatewayName} চাঁদার লেনদেনটি (TrxID: ${depositTrxId.trim()}) পেন্ডিং (Pending) হিসেবে সফলভাবে জমা হয়েছে। সংগঠনের অ্যাডমিন ভেরিফাই করে অনুমোদন করার পরই এটি মূল পেইড (Paid) তালিকায় যুক্ত হবে।`);
    setDepositMemberName('');
    setDepositAmount(500);
    setDepositTrxId('');
    setDepositSenderPhone('');
    setTimeout(() => setDepositSuccessMsg(''), 10000);
  };

  // Expense Handlers
  const handleOpenAddExpense = () => {
    setEditingExpense(null);
    setIsExpenseModalOpen(true);
  };

  const handleOpenEditExpense = (rec: FundRecord) => {
    setEditingExpense(rec);
    setIsExpenseModalOpen(true);
  };

  const handleSaveExpense = (data: {
    description: string;
    amount: number;
    disbursedTo: string;
    date: string;
    category: string;
    voucherNo?: string;
    notes?: string;
  }) => {
    let noteText = '';
    const cleanVoucher = data.voucherNo ? data.voucherNo.trim() : '';
    const cleanNotes = data.notes ? data.notes.trim() : '';

    if (cleanVoucher && cleanNotes) {
      noteText = `ভাউচার: ${cleanVoucher} - ${cleanNotes}`;
    } else if (cleanVoucher) {
      noteText = `ভাউচার: ${cleanVoucher}`;
    } else if (cleanNotes) {
      noteText = cleanNotes;
    }

    if (editingExpense && onEditFundRecord) {
      onEditFundRecord({
        ...editingExpense,
        memberName: data.disbursedTo,
        amount: data.amount,
        status: 'Expense',
        type: 'expense',
        description: data.description,
        date: data.date,
        category: (data.category as any) || 'বিবিধ ও অন্যান্য ব্যয়',
        disbursedTo: data.disbursedTo,
        notes: noteText
      });
    } else if (onAddFundRecord) {
      onAddFundRecord({
        memberName: data.disbursedTo,
        amount: data.amount,
        status: 'Expense',
        type: 'expense',
        description: data.description,
        date: data.date,
        category: (data.category as any) || 'বিবিধ ও অন্যান্য ব্যয়',
        disbursedTo: data.disbursedTo,
        notes: noteText
      });
      // Switch filter so user can immediately view the added expense breakdown in the table
      setStatusFilter('Expense');
    }
    setIsExpenseModalOpen(false);
    setEditingExpense(null);
  };

  // Live Auto Calculations from records
  const stats = useMemo(() => {
    let totalPaid = 0;
    let totalDue = 0;
    let totalExpense = 0;
    let totalPending = 0;
    let paidCount = 0;
    let dueCount = 0;
    let expenseCount = 0;
    let pendingCount = 0;

    fundRecords.forEach(r => {
      const amt = Number(r.amount) || 0;
      if (r.status === 'Expense') {
        totalExpense += amt;
        expenseCount++;
      } else if (r.status === 'Paid') {
        totalPaid += amt;
        paidCount++;
      } else if (r.status === 'Pending') {
        totalPending += amt;
        pendingCount++;
      } else if (r.status === 'Due') {
        totalDue += amt;
        dueCount++;
      }
    });

    const netBalance = totalPaid - totalExpense;

    return {
      totalPaid,
      totalDue,
      totalExpense,
      totalPending,
      netBalance,
      paidCount,
      dueCount,
      expenseCount,
      pendingCount,
      totalRecords: fundRecords.length
    };
  }, [fundRecords]);

  // Effective Total Organization Balance (Manual or Calculated)
  const displayTotalBalance = useMemo(() => {
    if (manualTotalBalance !== null && manualTotalBalance !== undefined) {
      return manualTotalBalance;
    }
    return stats.netBalance;
  }, [manualTotalBalance, stats.netBalance]);

  // Filtered records
  const filteredRecords = useMemo(() => {
    return fundRecords.filter(r => {
      const matchesSearch = 
        r.memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.description && r.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (r.disbursedTo && r.disbursedTo.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (r.trxId && r.trxId.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (r.notes && r.notes.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (r.category && r.category.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStatus = statusFilter === 'all' || r.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [fundRecords, searchTerm, statusFilter]);

  const handleOpenEdit = (rec: FundRecord) => {
    setEditingRecord(rec);
    setMemberName(rec.memberName);
    setAmount(rec.amount);
    setStatus(rec.status);
    setDescription(rec.description || '');
    setDate(rec.date);
    setCategory((rec.category as any) || 'মাসিক চাঁদা');
    setFormMonth(rec.month || rec.description || 'মার্চ ২০২৬');
    setFormPhone(rec.phone || resolveMemberPhone(rec, allMembers) || '');
    const parsedArrears = extractArrearsMonthCount(rec);
    setArrearsMonthCount(parsedArrears.monthCount);
    setPastMonthsText(parsedArrears.pastMonthsText);
    setModalSmsNotice(null);
    setIsAddModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberName.trim()) {
      setFormError('সদস্য বা দাতার নাম লিখুন');
      return;
    }
    if (amount === '' || Number(amount) <= 0) {
      setFormError('সঠিক টাকার পরিমাণ দিন');
      return;
    }

    if (editingRecord && onEditFundRecord) {
      onEditFundRecord({
        ...editingRecord,
        memberName: memberName.trim(),
        amount: Number(amount),
        status,
        description: description.trim(),
        date,
        month: formMonth.trim() || undefined,
        phone: formPhone.trim() || undefined,
        category
      });
    } else {
      onAddFundRecord({
        memberName: memberName.trim(),
        amount: Number(amount),
        status,
        description: description.trim() || 'মাসিক অনুদান',
        date,
        month: formMonth.trim() || undefined,
        phone: formPhone.trim() || undefined,
        category
      });
    }

    setMemberName('');
    setAmount(500);
    setStatus('Paid');
    setDescription('মাসিক নিয়মিত চাঁদা');
    setDate(new Date().toISOString().split('T')[0]);
    setCategory('মাসিক চাঁদা');
    setFormMonth('মার্চ ২০২৬');
    setFormPhone('');
    setArrearsMonthCount(1);
    setPastMonthsText('');
    setModalSmsNotice(null);
    setEditingRecord(null);
    setFormError('');
    setIsAddModalOpen(false);
  };

  // Open Edit Total Balance Modal
  const handleOpenBalanceModal = () => {
    setManualBalanceInput(displayTotalBalance.toString());
    setIsEditBalanceModalOpen(true);
    setBalanceSaveSuccess(false);
  };

  // Save manual total balance
  const handleSaveManualBalance = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = Number(manualBalanceInput);
    if (!isNaN(parsed) && onUpdateManualTotalBalance) {
      onUpdateManualTotalBalance(parsed);
      setBalanceSaveSuccess(true);
      setTimeout(() => {
        setBalanceSaveSuccess(false);
        setIsEditBalanceModalOpen(false);
      }, 1000);
    }
  };

  // Reset to auto-calculated balance
  const handleResetToAutoBalance = () => {
    if (onUpdateManualTotalBalance) {
      onUpdateManualTotalBalance(null);
      setIsEditBalanceModalOpen(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            id="fund-back-btn"
            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition"
            title="হোমে ফিরুন"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
              <span className="text-xs font-semibold text-emerald-700">পতেঙ্গা, চট্টগ্রাম • ফান্ড ও আর্থিক হিসাব</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Wallet className="w-5 h-5 text-emerald-600" />
              সংগঠনের ফান্ড ও চাঁদা হিসাব (Fund Sheet)
            </h2>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Add Expense Button (Admin Only) */}
          {isAdmin && (
            <button
              onClick={handleOpenAddExpense}
              id="fund-add-expense-btn"
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl shadow-2xs transition cursor-pointer"
              title="নতুন খরচের হিসাব লিপিবদ্ধ করুন"
            >
              <FileText className="w-4 h-4 text-rose-600" />
              <span>নতুন খরচ এন্ট্রি</span>
            </button>
          )}

          {/* Admin Only: New Deposit Entry Button */}
          {isAdmin && (
            <button
              onClick={() => {
                setEditingRecord(null);
                setMemberName('');
                setAmount(500);
                setStatus('Paid');
                setDescription('মাসিক নিয়মিত চাঁদা');
                setDate(new Date().toISOString().split('T')[0]);
                setCategory('মাসিক চাঁদা');
                setFormMonth('মার্চ ২০২৬');
                setFormPhone('');
                setArrearsMonthCount(1);
                setPastMonthsText('');
                setModalSmsNotice(null);
                setIsAddModalOpen(true);
              }}
              id="fund-add-entry-btn"
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>নতুন চাঁদা / জমা এন্ট্রি</span>
            </button>
          )}
        </div>
      </div>

      {/* 1. SEPARATE CARD: সংগঠনের মোট তহবিলের পরিমাণ (Total Organization Balance) */}
      <div 
        id="org-total-balance-section"
        className="bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 text-white rounded-3xl p-6 sm:p-7 shadow-md border border-emerald-500/30 relative overflow-hidden"
      >
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-400/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>সংগঠনের মূল রিজার্ভ তহবিল</span>
              {manualTotalBalance !== null && (
                <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.2 rounded-full">
                  ম্যানুয়াল আপডেট
                </span>
              )}
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              সংগঠনের মোট তহবিলের পরিমাণ
            </h3>
            <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
              সিলেট মানবসেবা সংগঠনের বর্তমান নিট রিজার্ভ ব্যালেন্স (মোট আদায় - মোট খরচ)।
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 bg-white/5 backdrop-blur-xs p-4 rounded-2xl border border-white/10">
            <div className="text-left sm:text-right">
              <span className="text-[11px] text-emerald-300 font-semibold uppercase tracking-wider block">
                সর্বমোট মূল ব্যালেন্স
              </span>
              <div className="text-3xl sm:text-4xl font-black text-amber-300 font-mono tracking-tight">
                {toBengaliCurrency(displayTotalBalance)}
              </div>
            </div>

            {/* Admin Only: Edit Balance Option */}
            {isAdmin && (
              <button
                onClick={handleOpenBalanceModal}
                id="fund-edit-total-balance-btn"
                className="flex items-center gap-1.5 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
                title="মোট তহবিল ব্যালেন্স পরিবর্তন করুন"
              >
                <Edit2 className="w-4 h-4" />
                <span>ব্যালেন্স এডিট করুন</span>
              </button>
            )}
          </div>
        </div>

        {/* Ambient glow decoration */}
        <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>
      </div>

      {/* Auto Balance Summary Dashboard - 4 Column Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Paid Balance */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
              <Coins className="w-4 h-4 text-emerald-600" />
              শিট হিসাব অনুযায়ী মোট আদায়
            </span>
            <div className="text-2xl font-bold text-emerald-700 mt-2 font-mono">
              {toBengaliCurrency(stats.totalPaid)}
            </div>
          </div>
          <div className="text-[11px] text-slate-500 mt-3 pt-2.5 border-t border-slate-100 flex justify-between items-center">
            <span>পরিশোধিত এন্ট্রি:</span>
            <span className="font-bold text-slate-800">{toBengaliNumber(stats.paidCount)} টি</span>
          </div>
        </div>

        {/* Total Expense */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                <TrendingDown className="w-4 h-4 text-rose-600" />
                সংগঠনের মোট খরচ
              </span>
              <button
                onClick={() => setStatusFilter('Expense')}
                className="text-[10px] font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-2 py-0.5 rounded-md transition"
              >
                খতিয়ান দেখুন
              </button>
            </div>
            <div className="text-2xl font-bold text-rose-700 mt-2 font-mono">
              {toBengaliCurrency(stats.totalExpense)}
            </div>
          </div>
          <div className="text-[11px] text-slate-500 mt-3 pt-2.5 border-t border-slate-100 flex justify-between items-center">
            <span>মোট ভাউচার সংখ্যা:</span>
            <span className="font-bold text-slate-800">{toBengaliNumber(stats.expenseCount)} টি</span>
          </div>
        </div>

        {/* Pending Approvals */}
        <div className={`rounded-2xl p-5 border shadow-xs flex flex-col justify-between transition ${
          stats.pendingCount > 0 ? 'bg-amber-50/60 border-amber-300' : 'bg-white border-slate-200'
        }`}>
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                <Clock className={`w-4 h-4 ${stats.pendingCount > 0 ? 'text-amber-600 animate-spin' : 'text-slate-400'}`} />
                অপেক্ষমান অনুমোদন (Pending)
              </span>
              {stats.pendingCount > 0 && (
                <button
                  onClick={() => setStatusFilter('Pending')}
                  className="text-[10px] font-black text-amber-800 bg-amber-200/80 hover:bg-amber-300 px-2 py-0.5 rounded-md transition"
                >
                  যাচাই করুন
                </button>
              )}
            </div>
            <div className="text-2xl font-bold text-amber-700 mt-2 font-mono">
              {toBengaliCurrency(stats.totalPending)}
            </div>
          </div>
          <div className="text-[11px] text-slate-500 mt-3 pt-2.5 border-t border-slate-100 flex justify-between items-center">
            <span>অনুমোদন অপেক্ষায়:</span>
            <span className={`font-bold ${stats.pendingCount > 0 ? 'text-amber-800' : 'text-slate-800'}`}>
              {toBengaliNumber(stats.pendingCount)} টি লেনদেন
            </span>
          </div>
        </div>

        {/* Total Due */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              বকেয়া চাঁদা (Due Balance)
            </span>
            <div className="text-2xl font-bold text-amber-700 mt-2 font-mono">
              {toBengaliCurrency(stats.totalDue)}
            </div>
          </div>
          <div className="text-[11px] text-slate-500 mt-3 pt-2.5 border-t border-slate-100 flex justify-between items-center">
            <span>বকেয়া সদস্য:</span>
            <span className="font-bold text-amber-700">{toBengaliNumber(stats.dueCount)} জন</span>
          </div>
        </div>
      </div>

      {/* Paid Auto-Trigger SMS Feedback Notification Banner */}
      {paidSmsToast && (
        <div className="bg-emerald-50 border-2 border-emerald-400 text-emerald-950 p-4 rounded-2xl shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
              <Check className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold">
                {paidSmsToast.memberName}-এর পেমেন্ট সফলভাবে পেইড ও অনুমোদিত হয়েছে!
              </p>
              <p className="text-xs text-emerald-800 mt-0.5">
                {paidSmsToast.phone 
                  ? `সদস্যের নম্বরে (${paidSmsToast.phone}) সরাসরি SIM SMS মেসেজ ট্রিগার করা হয়েছে।` 
                  : 'সদস্যের ফোন নম্বর প্রোফাইলে না থাকায় ম্যানুয়ালি এসএমএস পাঠান।'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-center">
            {paidSmsToast.phone && (
              <button
                onClick={() => triggerDirectSimSms(paidSmsToast.phone, paidSmsToast.smsText)}
                className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-2xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition"
                title="ডিভাইসের মেসেজ অ্যাপ পুনরায় ওপেন করুন"
              >
                <Send className="w-3.5 h-3.5" />
                <span>পুনরায় SMS পাঠান</span>
              </button>
            )}
            <button
              onClick={() => setPaidSmsToast(null)}
              className="p-1.5 rounded-lg text-slate-500 hover:bg-emerald-100 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* PENDING TRANSACTIONS VERIFICATION ACTION CENTER (Visible when there are pending submissions) */}
      {stats.pendingCount > 0 && (
        <div id="pending-transactions-verification-section" className="bg-gradient-to-br from-amber-50 via-orange-50/50 to-amber-100/40 rounded-3xl p-5 sm:p-6 border-2 border-amber-300 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-amber-200/80">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold text-amber-950">
                    যাচাই ও অনুমোদনের অপেক্ষমান ট্রানজেকশন (Pending Approvals)
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-white text-xs font-black shadow-2xs">
                    {toBengaliNumber(stats.pendingCount)} টি অপেক্ষমান
                  </span>
                </div>
                <p className="text-xs text-amber-900/80 mt-0.5">
                  ইউজারদের সাবমিটকৃত চাঁদার ট্রানজেকশন আইডি (TrxID) নিচে দেওয়া হলো। অ্যাডমিন যাচাই করে অনুমোদন দিলে তা মূল পেইড তালিকায় যুক্ত হবে।
                </p>
              </div>
            </div>

            {isAdmin && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-200/80 text-amber-950 text-xs font-bold rounded-xl border border-amber-300">
                <ShieldCheck className="w-4 h-4 text-amber-800" />
                অ্যাডমিন ভেরিফিকেশন প্যানেল
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {fundRecords.filter(r => r.status === 'Pending').map((pRecord) => (
              <div key={pRecord.id} className="bg-white rounded-2xl p-4 border border-amber-200/90 shadow-xs flex flex-col justify-between gap-3 hover:border-amber-400 transition">
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-900 font-black text-sm flex items-center justify-center">
                        {pRecord.memberName.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm leading-tight">{pRecord.memberName}</h4>
                        <span className="text-[11px] text-slate-500">{formatBengaliDate(pRecord.date)}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-base font-mono font-black text-emerald-700 block">
                        {toBengaliCurrency(pRecord.amount)}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-300 inline-block">
                        অপেক্ষমান
                      </span>
                    </div>
                  </div>

                  {/* TrxID, Phone & Gateway info */}
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 text-[11px] font-medium">TrxID:</span>
                      <div className="flex items-center gap-1.5 font-mono font-bold text-slate-800">
                        <span className="bg-white px-2 py-0.5 rounded border border-slate-200 text-xs text-amber-900">
                          {pRecord.trxId || (pRecord.notes?.includes('TrxID:') ? pRecord.notes.split('TrxID:')[1].trim().split(' ')[0] : 'N/A')}
                        </span>
                        {pRecord.trxId && (
                          <button
                            onClick={() => handleCopyNumber(pRecord.trxId || '', `trx-${pRecord.id}`)}
                            className="p-1 text-slate-400 hover:text-slate-700 rounded transition"
                            title="কপি করুন"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {pRecord.phone && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 text-[11px] font-medium">প্রেরক মোবাইল:</span>
                        <a href={`tel:${pRecord.phone}`} className="font-mono text-emerald-700 font-semibold hover:underline">
                          {pRecord.phone}
                        </a>
                      </div>
                    )}

                    {pRecord.gateway && (
                      <div className="flex items-center justify-between pt-0.5">
                        <span className="text-slate-500 text-[11px] font-medium">পেমেন্ট মেথড:</span>
                        <span className="font-bold text-[11px] text-slate-700">
                          {pRecord.gateway === 'bkash' ? 'বিকাশ (bKash)' : pRecord.gateway === 'nagad' ? 'নগদ (Nagad)' : 'রকেট (Rocket)'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  {isAdmin ? (
                    <>
                      {onDeleteFundRecord && (
                        <button
                          onClick={() => onDeleteFundRecord(pRecord.id)}
                          className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl transition flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>বাতিল</span>
                        </button>
                      )}
                      {onToggleStatus && (
                        <button
                          onClick={() => handleApproveOrTogglePaid(pRecord, 'Paid')}
                          className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer ml-auto"
                        >
                          <Check className="w-4 h-4" />
                          <span>অনুমোদন ও পেইড করুন (Approve)</span>
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="w-full text-center py-1.5 text-xs font-semibold text-amber-800 bg-amber-50 rounded-xl border border-amber-200">
                      অ্যাডমিনের যাচাই ও অনুমোদনের অপেক্ষায় রয়েছে
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. PAYMENT GATEWAY / MONTHLY SUBSCRIPTION (বিকাশ, নগদ, রকেট পেমেন্ট গেটওয়ে) */}
      <div 
        id="subscription-payment-gateway-section"
        className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden"
      >
        {/* Header banner */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-5 sm:p-6 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold border border-emerald-500/30">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              <span>মাসিক চাঁদা পরিশোধ গেটওয়ে</span>
            </div>
            <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-amber-400" />
              মাসিক চাঁদা ও তহবিল অনুদান পরিশোধ (Deposit Gateway)
            </h3>
            <p className="text-xs text-slate-300">
              সিলেট মানব সেবা সংঘঠনের সম্মানিত সদস্যবৃন্দ নিচের বিকাশ, নগদ অথবা রকেট নম্বরে মাসিক চাঁদা পাঠিয়ে সাবমিট করুন।
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-white/10 rounded-xl text-xs font-semibold text-slate-200 border border-white/10 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              নিরাপদ পেমেন্ট চ্যানেল
            </span>
          </div>
        </div>

        <div className="p-5 sm:p-6 space-y-6">
          {/* Brand Gateway Selection Tabs (Prominently Visible Default State) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-slate-700">
                পেমেন্ট মেথড নির্বাচন করুন (Select Payment Method):
              </label>
              {selectedGateway && (
                <button
                  type="button"
                  onClick={() => setSelectedGateway(null)}
                  className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer transition"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>বন্ধ করুন (Collapse)</span>
                </button>
              )}
            </div>
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              {/* bKash Tab */}
              <button
                type="button"
                id="select-gateway-bkash-btn"
                onClick={() => setSelectedGateway(selectedGateway === 'bkash' ? null : 'bkash')}
                className={`p-3.5 sm:p-4 rounded-2xl border-2 transition text-left flex flex-col justify-between relative overflow-hidden cursor-pointer ${
                  selectedGateway === 'bkash'
                    ? 'border-pink-600 bg-pink-50/80 shadow-md shadow-pink-500/15 ring-2 ring-pink-500/20'
                    : 'border-slate-200 bg-white hover:border-pink-300 hover:bg-pink-50/20'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="w-7 h-7 rounded-xl bg-pink-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                    bK
                  </span>
                  {selectedGateway === 'bkash' ? (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-pink-600 text-white text-[9px] font-bold">
                      <Check className="w-2.5 h-2.5" />
                      <span>নির্বাচিত</span>
                    </span>
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-slate-300" />
                  )}
                </div>
                <div className="mt-3">
                  <div className="font-black text-sm sm:text-base text-slate-900">বিকাশ (bKash)</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {selectedGateway === 'bkash' ? 'সক্রিয় ও উন্মুক্ত' : 'ক্লিক করে তথ্য দেখুন'}
                  </div>
                </div>
              </button>

              {/* Nagad Tab */}
              <button
                type="button"
                id="select-gateway-nagad-btn"
                onClick={() => setSelectedGateway(selectedGateway === 'nagad' ? null : 'nagad')}
                className={`p-3.5 sm:p-4 rounded-2xl border-2 transition text-left flex flex-col justify-between relative overflow-hidden cursor-pointer ${
                  selectedGateway === 'nagad'
                    ? 'border-orange-500 bg-orange-50/80 shadow-md shadow-orange-500/15 ring-2 ring-orange-500/20'
                    : 'border-slate-200 bg-white hover:border-orange-300 hover:bg-orange-50/20'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="w-7 h-7 rounded-xl bg-orange-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                    নগদ
                  </span>
                  {selectedGateway === 'nagad' ? (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-orange-600 text-white text-[9px] font-bold">
                      <Check className="w-2.5 h-2.5" />
                      <span>নির্বাচিত</span>
                    </span>
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-slate-300" />
                  )}
                </div>
                <div className="mt-3">
                  <div className="font-black text-sm sm:text-base text-slate-900">নগদ (Nagad)</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {selectedGateway === 'nagad' ? 'সক্রিয় ও উন্মুক্ত' : 'ক্লিক করে তথ্য দেখুন'}
                  </div>
                </div>
              </button>

              {/* Rocket Tab */}
              <button
                type="button"
                id="select-gateway-rocket-btn"
                onClick={() => setSelectedGateway(selectedGateway === 'rocket' ? null : 'rocket')}
                className={`p-3.5 sm:p-4 rounded-2xl border-2 transition text-left flex flex-col justify-between relative overflow-hidden cursor-pointer ${
                  selectedGateway === 'rocket'
                    ? 'border-purple-600 bg-purple-50/80 shadow-md shadow-purple-500/15 ring-2 ring-purple-500/20'
                    : 'border-slate-200 bg-white hover:border-purple-300 hover:bg-purple-50/20'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="w-7 h-7 rounded-xl bg-purple-700 text-white font-black text-xs flex items-center justify-center shadow-xs">
                    রকেট
                  </span>
                  {selectedGateway === 'rocket' ? (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-purple-700 text-white text-[9px] font-bold">
                      <Check className="w-2.5 h-2.5" />
                      <span>নির্বাচিত</span>
                    </span>
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-slate-300" />
                  )}
                </div>
                <div className="mt-3">
                  <div className="font-black text-sm sm:text-base text-slate-900">রকেট (Rocket)</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {selectedGateway === 'rocket' ? 'সক্রিয় ও উন্মুক্ত' : 'ক্লিক করে তথ্য দেখুন'}
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* DEFAULT STATE ON PAGE LOAD: When no payment method is selected */}
          {!selectedGateway && (
            <div className="py-8 px-6 rounded-2xl bg-slate-50 border border-dashed border-slate-300 text-center flex flex-col items-center justify-center animate-fadeIn">
              <div className="w-12 h-12 rounded-2xl bg-white shadow-2xs border border-slate-200 flex items-center justify-center text-slate-600 mb-2.5">
                <CreditCard className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">পেমেন্ট মেথড নির্বাচন করুন</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-md leading-relaxed">
                মাসিক চাঁদা বা অনুদান পাঠাতে উপরের <strong>বিকাশ</strong>, <strong>নগদ</strong> অথবা <strong>রকেট</strong> অপশনে ক্লিক করুন। নির্বাচিত মেথডের একাউন্ট নম্বর, নিয়মাবলী ও ট্রানজেকশন সাবমিট ফর্ম নিচে প্রদর্শিত হবে।
              </p>
            </div>
          )}

          {/* DYNAMIC & EXCLUSIVE VIEW: Rendered ONLY when a payment method is selected */}
          {selectedGateway && (
            <div className="space-y-5 animate-fadeIn">
              {/* 1. bKash Exclusive Details */}
              {selectedGateway === 'bkash' && (
                <div className="p-5 rounded-2xl bg-pink-50/80 border border-pink-200 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded bg-pink-600 text-white font-bold text-xs">
                          বিকাশ একাউন্ট
                        </span>
                        <span className="text-xs font-semibold text-pink-900">
                          উদ্দেশ্য: <strong>মাসিক চাঁদা / অনুদান</strong>
                        </span>
                      </div>
                      {paymentConfig.bkashNumber ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xl sm:text-2xl font-mono font-black text-pink-950 tracking-wider">
                            {paymentConfig.bkashNumber}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pink-200 text-pink-900">
                            {paymentConfig.bkashType || 'Personal'}
                          </span>
                        </div>
                      ) : (
                        <div className="text-xs font-semibold text-pink-800/80 mt-1">
                          অ্যাডমিন এখনো বিকাশ নম্বর যুক্ত করেননি (এডমিন প্যানেল থেকে সেট করুন)
                        </div>
                      )}
                    </div>

                    {paymentConfig.bkashNumber && (
                      <button
                        type="button"
                        id="copy-bkash-number-btn"
                        onClick={() => handleCopyNumber(paymentConfig.bkashNumber, 'bkash')}
                        className={`flex items-center justify-center gap-2 px-4 py-2.5 font-bold text-xs rounded-xl shadow-xs transition-all duration-200 cursor-pointer self-start sm:self-auto ${
                          copiedField === 'bkash'
                            ? 'bg-emerald-600 text-white ring-2 ring-emerald-400 scale-105'
                            : 'bg-pink-600 hover:bg-pink-700 active:scale-95 text-white'
                        }`}
                      >
                        {copiedField === 'bkash' ? (
                          <>
                            <Check className="w-4 h-4 text-white animate-bounce" />
                            <span>নম্বর কপি হয়েছে!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            <span>নম্বর কপি করুন</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  <div className="text-xs text-slate-600 bg-white/80 p-3 rounded-xl border border-pink-100 space-y-1">
                    <div className="font-bold text-pink-950 flex items-center gap-1.5">
                      <Smartphone className="w-3.5 h-3.5 text-pink-600" />
                      <span>বিকাশে পেমেন্ট ও চাঁদা পাঠানোর নিয়মাবলী:</span>
                    </div>
                    <p>
                      {paymentConfig.bkashInstructions || 'আপনার বিকাশ অ্যাপ থেকে উপরের নম্বরে Send Money করুন। রেফারেন্সে আপনার নাম বা মেম্বার আইডি লিখুন এবং সফল ট্রানজেকশনের TrxID নিচে সাবমিট করুন।'}
                    </p>
                  </div>
                </div>
              )}

              {/* 2. Nagad Exclusive Details */}
              {selectedGateway === 'nagad' && (
                <div className="p-5 rounded-2xl bg-orange-50/80 border border-orange-200 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded bg-orange-600 text-white font-bold text-xs">
                          নগদ একাউন্ট
                        </span>
                        <span className="text-xs font-semibold text-orange-900">
                          উদ্দেশ্য: <strong>মাসিক চাঁদা / অনুদান</strong>
                        </span>
                      </div>
                      {paymentConfig.nagadNumber ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xl sm:text-2xl font-mono font-black text-orange-950 tracking-wider">
                            {paymentConfig.nagadNumber}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-200 text-orange-900">
                            {paymentConfig.nagadType || 'Personal'}
                          </span>
                        </div>
                      ) : (
                        <div className="text-xs font-semibold text-orange-800/80 mt-1">
                          অ্যাডমিন এখনো নগদ নম্বর যুক্ত করেননি (এডমিন প্যানেল থেকে সেট করুন)
                        </div>
                      )}
                    </div>

                    {paymentConfig.nagadNumber && (
                      <button
                        type="button"
                        id="copy-nagad-number-btn"
                        onClick={() => handleCopyNumber(paymentConfig.nagadNumber, 'nagad')}
                        className={`flex items-center justify-center gap-2 px-4 py-2.5 font-bold text-xs rounded-xl shadow-xs transition-all duration-200 cursor-pointer self-start sm:self-auto ${
                          copiedField === 'nagad'
                            ? 'bg-emerald-600 text-white ring-2 ring-emerald-400 scale-105'
                            : 'bg-orange-600 hover:bg-orange-700 active:scale-95 text-white'
                        }`}
                      >
                        {copiedField === 'nagad' ? (
                          <>
                            <Check className="w-4 h-4 text-white animate-bounce" />
                            <span>নম্বর কপি হয়েছে!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            <span>নম্বর কপি করুন</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  <div className="text-xs text-slate-600 bg-white/80 p-3 rounded-xl border border-orange-100 space-y-1">
                    <div className="font-bold text-orange-950 flex items-center gap-1.5">
                      <Smartphone className="w-3.5 h-3.5 text-orange-600" />
                      <span>নগদে পেমেন্ট ও চাঁদা পাঠানোর নিয়মাবলী:</span>
                    </div>
                    <p>
                      {paymentConfig.nagadInstructions || 'নগদ অ্যাপ বা *167# ডায়াল করে Send Money করুন। সফল পেমেন্টের পর TrxID টি নিচের বক্সে লিখে সাবমিট করুন।'}
                    </p>
                  </div>
                </div>
              )}

              {/* 3. Rocket Exclusive Details */}
              {selectedGateway === 'rocket' && (
                <div className="p-5 rounded-2xl bg-purple-50/80 border border-purple-200 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded bg-purple-700 text-white font-bold text-xs">
                          রকেট একাউন্ট
                        </span>
                        <span className="text-xs font-semibold text-purple-900">
                          উদ্দেশ্য: <strong>মাসিক চাঁদা / অনুদান</strong>
                        </span>
                      </div>
                      {paymentConfig.rocketNumber ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xl sm:text-2xl font-mono font-black text-purple-950 tracking-wider">
                            {paymentConfig.rocketNumber}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-200 text-purple-900">
                            {paymentConfig.rocketType || 'Personal'}
                          </span>
                        </div>
                      ) : (
                        <div className="text-xs font-semibold text-purple-800/80 mt-1">
                          অ্যাডমিন এখনো রকেট নম্বর যুক্ত করেননি (এডমিন প্যানেল থেকে সেট করুন)
                        </div>
                      )}
                    </div>

                    {paymentConfig.rocketNumber && (
                      <button
                        type="button"
                        id="copy-rocket-number-btn"
                        onClick={() => handleCopyNumber(paymentConfig.rocketNumber, 'rocket')}
                        className={`flex items-center justify-center gap-2 px-4 py-2.5 font-bold text-xs rounded-xl shadow-xs transition-all duration-200 cursor-pointer self-start sm:self-auto ${
                          copiedField === 'rocket'
                            ? 'bg-emerald-600 text-white ring-2 ring-emerald-400 scale-105'
                            : 'bg-purple-700 hover:bg-purple-800 active:scale-95 text-white'
                        }`}
                      >
                        {copiedField === 'rocket' ? (
                          <>
                            <Check className="w-4 h-4 text-white animate-bounce" />
                            <span>নম্বর কপি হয়েছে!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            <span>নম্বর কপি করুন</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  <div className="text-xs text-slate-600 bg-white/80 p-3 rounded-xl border border-purple-100 space-y-1">
                    <div className="font-bold text-purple-950 flex items-center gap-1.5">
                      <Smartphone className="w-3.5 h-3.5 text-purple-600" />
                      <span>রকেটে পেমেন্ট ও চাঁদা পাঠানোর নিয়মাবলী:</span>
                    </div>
                    <p>
                      {paymentConfig.rocketInstructions || 'রকেট একাউন্ট থেকে Send Money করার পর ফিরতি এসএমএসের TrxID নিচে যুক্ত করে সাবমিট করুন।'}
                    </p>
                  </div>
                </div>
              )}

              {/* Transaction Verification & Deposit Submission Form (Customized for Chosen Gateway) */}
              <div className={`p-5 rounded-2xl border space-y-4 shadow-xs transition-all ${
                selectedGateway === 'bkash' 
                  ? 'bg-pink-50/40 border-pink-200/90' 
                  : selectedGateway === 'nagad'
                  ? 'bg-orange-50/40 border-orange-200/90'
                  : 'bg-purple-50/40 border-purple-200/90'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3 border-slate-200/80">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Send className={`w-4 h-4 ${
                        selectedGateway === 'bkash' ? 'text-pink-600' : selectedGateway === 'nagad' ? 'text-orange-600' : 'text-purple-700'
                      }`} />
                      <span>
                        {selectedGateway === 'bkash' ? 'বিকাশ (bKash)' : selectedGateway === 'nagad' ? 'নগদ (Nagad)' : 'রকেট (Rocket)'} ট্রানজেকশন সাবমিট ও ভেরিফিকেশন
                      </span>
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      টাকা পাঠানো সম্পন্ন হলে আপনার নাম, টাকার পরিমাণ এবং ফিরতি মেসেজের TrxID নিচে দিন:
                    </p>
                  </div>
                  <span className={`self-start sm:self-auto text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    selectedGateway === 'bkash' ? 'bg-pink-100 text-pink-800' : selectedGateway === 'nagad' ? 'bg-orange-100 text-orange-800' : 'bg-purple-100 text-purple-800'
                  }`}>
                    {selectedGateway === 'bkash' ? 'bKash Verification' : selectedGateway === 'nagad' ? 'Nagad Verification' : 'Rocket Verification'}
                  </span>
                </div>

                {depositSuccessMsg && (
                  <div className="p-3.5 rounded-xl bg-emerald-50 text-emerald-900 text-xs font-semibold border border-emerald-200 flex items-center gap-2 animate-fadeIn">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>{depositSuccessMsg}</span>
                  </div>
                )}

                {depositErrorMsg && (
                  <div className="p-3.5 rounded-xl bg-rose-50 text-rose-900 text-xs font-semibold border border-rose-200 flex items-center gap-2 animate-fadeIn">
                    <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                    <span>{depositErrorMsg}</span>
                  </div>
                )}

                <form onSubmit={handleQuickDepositSubmit} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        আপনার পূর্ণ নাম (Member Name) *
                      </label>
                      <input
                        type="text"
                        required
                        value={depositMemberName}
                        onChange={(e) => setDepositMemberName(e.target.value)}
                        placeholder="যেমন: মোহাম্মদ সাহেদ আলম"
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        পরিশোধিত চাঁদার পরিমাণ (টাকা ৳) *
                      </label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="৫০০"
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono font-bold bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        {selectedGateway === 'bkash' ? 'বিকাশ TrxID (Transaction ID) *' : selectedGateway === 'nagad' ? 'নগদ TrxID (Transaction ID) *' : 'রকেট TrxID (Transaction ID) *'}
                      </label>
                      <input
                        type="text"
                        required
                        value={depositTrxId}
                        onChange={(e) => setDepositTrxId(e.target.value)}
                        placeholder={selectedGateway === 'bkash' ? 'যেমন: 9J7X4K2P9Q' : selectedGateway === 'nagad' ? 'যেমন: 7K9X2M4P1Q' : 'যেমন: 8L5N3P7Q2R'}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono font-bold bg-white uppercase focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        {selectedGateway === 'bkash' ? 'যে বিকাশ নম্বর থেকে পাঠিয়েছেন (Sender Mobile)' : selectedGateway === 'nagad' ? 'যে নগদ নম্বর থেকে পাঠিয়েছেন (Sender Mobile)' : 'যে রকেট নম্বর থেকে পাঠিয়েছেন (Sender Mobile)'}
                      </label>
                      <input
                        type="text"
                        value={depositSenderPhone}
                        onChange={(e) => setDepositSenderPhone(e.target.value)}
                        placeholder="018XXXXXXXX"
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between pt-2 gap-3">
                    <span className="text-[11px] text-slate-600">
                      পেমেন্ট গেটওয়ে: <strong className="text-slate-900">{selectedGateway === 'bkash' ? 'বিকাশ (bKash)' : selectedGateway === 'nagad' ? 'নগদ (Nagad)' : 'রকেট (Rocket)'}</strong> | খাত: <strong>মাসিক চাঁদা</strong>
                    </span>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() => setSelectedGateway(null)}
                        className="px-3 py-2 border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl transition cursor-pointer"
                      >
                        বন্ধ করুন
                      </button>
                      <button
                        type="submit"
                        id="subscription-deposit-submit-btn"
                        className={`flex-1 sm:flex-none px-5 py-2 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer ${
                          selectedGateway === 'bkash'
                            ? 'bg-pink-600 hover:bg-pink-700'
                            : selectedGateway === 'nagad'
                            ? 'bg-orange-600 hover:bg-orange-700'
                            : 'bg-purple-700 hover:bg-purple-800'
                        }`}
                      >
                        <Check className="w-4 h-4" />
                        <span>
                          {selectedGateway === 'bkash' ? 'বিকাশ চাঁদা সাবমিট করুন' : selectedGateway === 'nagad' ? 'নগদ চাঁদা সাবমিট করুন' : 'রকেট চাঁদা সাবমিট করুন'}
                        </span>
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            id="fund-search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="সদস্যের নাম বা বাবত দিয়ে খুঁজুন..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-slate-500 font-medium">ফিল্টার:</span>
            {(['all', 'Paid', 'Expense', 'Pending', 'Due'] as const).map(st => {
              const count = 
                st === 'all' ? fundRecords.length :
                st === 'Paid' ? stats.paidCount :
                st === 'Expense' ? stats.expenseCount :
                st === 'Pending' ? stats.pendingCount : stats.dueCount;
              
              const label = 
                st === 'all' ? 'সব রেকর্ড' :
                st === 'Paid' ? 'আদায়কৃত (Paid)' :
                st === 'Expense' ? 'খরচের খতিয়ান (Expense)' :
                st === 'Pending' ? 'অপেক্ষমান (Pending)' : 'বকেয়া (Due)';

              return (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  id={`fund-status-${st}`}
                  className={`px-3 py-1 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    statusFilter === st
                      ? st === 'Expense'
                        ? 'bg-rose-700 text-white shadow-2xs'
                        : st === 'Pending'
                        ? 'bg-amber-600 text-white shadow-2xs'
                        : 'bg-slate-900 text-white shadow-2xs'
                      : st === 'Expense'
                      ? 'bg-rose-50 text-rose-800 hover:bg-rose-100'
                      : st === 'Pending'
                      ? 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <span>{label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    statusFilter === st ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-slate-700'
                  }`}>
                    {toBengaliNumber(count)}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2.5 w-full sm:w-auto">
            <span className="text-xs text-slate-500 font-medium">
              দেখানো হচ্ছে: <strong>{toBengaliNumber(filteredRecords.length)}</strong> টি রেকর্ড
            </span>

            {/* View Mode Toggle: Cards vs Table */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                id="fund-viewmode-cards-btn"
                className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'cards'
                    ? 'bg-white text-emerald-800 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="কার্ড ভিউ (মোবাইলের জন্য উপযোগী ও প্রশস্ত)"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>কার্ড ভিউ</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                id="fund-viewmode-table-btn"
                className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-white text-emerald-800 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="টেবিল ভিউ"
              >
                <List className="w-3.5 h-3.5" />
                <span>টেবিল ভিউ</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* DEDICATED EXPENSE BREAKDOWN VIEW (When statusFilter === 'Expense') */}
      {statusFilter === 'Expense' ? (
        <div id="expense-breakdown-section" className="space-y-4">
          <div className="bg-gradient-to-r from-rose-900 via-slate-900 to-rose-950 text-white p-5 rounded-2xl border border-rose-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <FileText className="w-5 h-5 text-rose-400" />
                <h3 className="text-base font-bold text-white">সংগঠনের খরচের খতিয়ান ও স্বচ্ছতা বিবরণী</h3>
              </div>
              <p className="text-xs text-rose-200/80 max-w-xl">
                সিলেট মানবসেবা সংগঠনের সকল সামাজিক কার্যক্রম, চিকিৎসা সাহায্য ও পরিচালনা ব্যয়ের উন্মুক্ত খতিয়ান।
              </p>
            </div>

            <div className="flex items-center gap-2">
              {isAdmin && (
                <button
                  onClick={handleOpenAddExpense}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>নতুন খরচ এন্ট্রি</span>
                </button>
              )}
            </div>
          </div>

          {filteredRecords.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400 text-xs shadow-xs">
              এখনো কোনো খরচের বিবরণ পাওয়া যায়নি
            </div>
          ) : viewMode === 'cards' ? (
            /* Responsive Expense Cards Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredRecords.map((rec, idx) => (
                <div
                  key={rec.id || idx}
                  id={`expense-card-${rec.id || idx}`}
                  className="bg-white rounded-2xl border border-rose-200/90 shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between"
                >
                  {/* Header Strip */}
                  <div className="h-1.5 bg-gradient-to-r from-rose-500 via-red-500 to-rose-600" />

                  <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3.5">
                    {/* Date & Category Header */}
                    <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-rose-100">
                      <div className="flex items-center gap-1.5 text-xs text-rose-800 font-semibold">
                        <Calendar className="w-3.5 h-3.5 text-rose-600" />
                        <span>{formatBengaliDate(rec.date)}</span>
                      </div>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 text-[11px] font-bold border border-rose-200">
                        {rec.category || 'অফিস পরিচালনা'}
                      </span>
                    </div>

                    {/* Expense Reason & Disbursed Details */}
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
                        খরচের কারণ / বিবরণ
                      </span>
                      <h4 className="font-bold text-slate-900 text-sm sm:text-base leading-snug">
                        {rec.description || 'সংগঠনের ব্যয়'}
                      </h4>

                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <div className="flex items-center gap-1 text-xs text-slate-600 font-medium">
                          <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                          <span>দায়িত্বে: <strong className="text-slate-800">{rec.disbursedTo || rec.memberName}</strong></span>
                        </div>

                        {rec.notes?.includes('ভাউচার:') && (
                          <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-bold text-[10px] font-mono border border-slate-200">
                            {rec.notes.split('ভাউচার:')[1].split('-')[0].trim()}
                          </span>
                        )}
                      </div>

                      {rec.notes && !rec.notes.includes('ভাউচার:') && (
                        <p className="text-[11px] text-slate-600 bg-rose-50/50 p-2 rounded-lg border border-rose-100 mt-1">
                          {rec.notes}
                        </p>
                      )}
                    </div>

                    {/* Amount & Admin Actions */}
                    <div className="pt-3 border-t border-rose-100 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">খরচের পরিমাণ</span>
                        <span className="text-lg sm:text-xl font-black font-mono text-rose-600">
                          - {toBengaliCurrency(rec.amount)}
                        </span>
                      </div>

                      {isAdmin && (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditExpense(rec)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition cursor-pointer"
                            title="এডিট করুন"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {onDeleteFundRecord && (
                            <button
                              type="button"
                              onClick={() => onDeleteFundRecord(rec.id)}
                              className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                              title="মুছুন"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Expense Detailed Table */
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-rose-50/60 border-b border-slate-200 text-xs font-bold text-slate-700">
                      <th className="py-3 px-4">তারিখ</th>
                      <th className="py-3 px-4">খরচের কারণ / বিবরণ</th>
                      <th className="py-3 px-4">কার মাধ্যমে / দায়িত্বে</th>
                      <th className="py-3 px-4">খাত / ক্যাটাগরি</th>
                      <th className="py-3 px-4">ভাউচার / মেমো</th>
                      <th className="py-3 px-4 text-right">পরিমাণ (টাকা ৳)</th>
                      {isAdmin && <th className="py-3 px-4 text-right">অ্যাকশন</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredRecords.map((rec) => (
                      <tr key={rec.id} className="hover:bg-rose-50/30 transition-colors">
                        <td className="py-3 px-4 text-slate-600 text-xs whitespace-nowrap font-medium">
                          {formatBengaliDate(rec.date)}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900">
                          <div className="flex flex-col">
                            <span>{rec.description || 'সংগঠনের ব্যয়'}</span>
                            {rec.notes && (
                              <span className="text-[11px] text-slate-500 font-normal mt-0.5">
                                {rec.notes}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-700 text-xs font-semibold">
                          <div className="flex items-center gap-1.5">
                            <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                            <span>{rec.disbursedTo || rec.memberName}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 text-[11px] font-bold border border-rose-200">
                            {rec.category || 'অফিস পরিচালনা'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-xs font-mono text-slate-600">
                          {rec.notes?.includes('ভাউচার:') ? (
                            <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-bold text-[11px]">
                              {rec.notes.split('ভাউচার:')[1].split('-')[0].trim()}
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right font-black font-mono text-rose-700 text-sm">
                          - {toBengaliCurrency(rec.amount)}
                        </td>
                        {isAdmin && (
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenEditExpense(rec)}
                                className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                title="এডিট করুন"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              {onDeleteFundRecord && (
                                <button
                                  onClick={() => onDeleteFundRecord(rec.id)}
                                  className="p-1 text-rose-600 hover:bg-rose-50 rounded"
                                  title="মুছুন"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                  {filteredRecords.length > 0 && (
                    <tfoot>
                      <tr className="bg-rose-50/80 font-bold border-t-2 border-rose-200">
                        <td colSpan={isAdmin ? 5 : 4} className="py-3 px-4 text-rose-950 text-xs">
                          মোট খরচের পরিমাণ:
                        </td>
                        <td className="py-3 px-4 text-right font-black font-mono text-rose-800 text-sm">
                          {toBengaliCurrency(stats.totalExpense)}
                        </td>
                        {isAdmin && <td></td>}
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* STANDARD FUND / SUBSCRIPTION RECORDS SECTION */
        filteredRecords.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400 text-xs shadow-xs">
            কোনো রেকর্ড পাওয়া যায়নি
          </div>
        ) : viewMode === 'cards' ? (
          /* Responsive Fund Cards Grid (Matches Member Directory Design) */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRecords.map((record, idx) => {
              const cleanDesc = getCleanFundDescription(record);
              const memberPhone = resolveMemberPhone(record, allMembers);

              return (
                <div
                  key={record.id || idx}
                  id={`fund-card-${record.id || idx}`}
                  className="bg-white rounded-2xl border border-slate-200/90 hover:border-emerald-400/80 transition-all duration-200 shadow-xs hover:shadow-md overflow-hidden flex flex-col justify-between"
                >
                  {/* Top Status Header Strip */}
                  <div
                    className={`h-1.5 ${
                      record.status === 'Paid'
                        ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600'
                        : record.status === 'Due'
                        ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600'
                        : record.status === 'Pending'
                        ? 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500'
                        : 'bg-gradient-to-r from-rose-500 via-red-500 to-rose-600'
                    }`}
                  />

                  <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3.5">
                    {/* Top Row: Member Info + Status Badge */}
                    <div className="flex items-start justify-between gap-2.5 pb-2.5 border-b border-slate-100">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-xl text-sm font-black flex items-center justify-center shrink-0 ${
                            record.status === 'Paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : record.status === 'Pending'
                              ? 'bg-amber-100 text-amber-900'
                              : record.status === 'Due'
                              ? 'bg-amber-100 text-amber-900'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {record.memberName.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-slate-900 text-sm truncate">
                            {record.memberName}
                          </h4>
                          {record.phone ? (
                            <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                              <Smartphone className="w-3 h-3 text-slate-400" />
                              {record.phone}
                            </span>
                          ) : memberPhone ? (
                            <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                              <Smartphone className="w-3 h-3 text-slate-400" />
                              {memberPhone}
                            </span>
                          ) : null}
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div className="shrink-0">
                        {record.status === 'Paid' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 shadow-2xs">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>পরিশোধিত (Paid)</span>
                          </span>
                        ) : record.status === 'Pending' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 text-xs font-bold border border-amber-300 shadow-2xs">
                            <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                            <span>অপেক্ষমান (Pending)</span>
                          </span>
                        ) : record.status === 'Due' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200 shadow-2xs">
                            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                            <span>বকেয়া (Due)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 text-xs font-bold border border-rose-200 shadow-2xs">
                            <span>ব্যয় (Expense)</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Description & Category - Clean without duplicate "মাসিক চাঁদা" */}
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
                        বাবত / বিবরণ
                      </span>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-xs sm:text-sm font-semibold text-slate-800">
                          {cleanDesc.primaryText}
                        </span>
                        {cleanDesc.showCategoryBadge && (
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium border border-slate-200">
                            {cleanDesc.categoryBadgeText}
                          </span>
                        )}
                        {record.trxId && (
                          <span className="text-[10px] font-mono bg-amber-50 text-amber-900 border border-amber-200 px-1.5 py-0.5 rounded font-bold">
                            TrxID: {record.trxId}
                          </span>
                        )}
                      </div>
                      {record.notes && (
                        <p className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100 mt-1">
                          {record.notes}
                        </p>
                      )}
                    </div>

                    {/* Financial & Date Details Row */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100/80">
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-slate-400 block font-medium">তারিখ ও মাস</span>
                        <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{formatBengaliDate(record.date)}</span>
                          {record.month && record.month !== record.date && (
                            <span className="text-slate-400 text-[11px]">({record.month})</span>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block font-medium">টাকার পরিমাণ</span>
                        <div
                          className={`text-lg sm:text-xl font-black font-mono tracking-tight ${
                            record.status === 'Expense' ? 'text-rose-600' : 'text-slate-900'
                          }`}
                        >
                          {record.status === 'Expense'
                            ? `- ${toBengaliCurrency(record.amount)}`
                            : toBengaliCurrency(record.amount)}
                        </div>
                      </div>
                    </div>

                    {/* Actions Footer */}
                    <div className="pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {record.status === 'Due' && (
                          <button
                            type="button"
                            onClick={() =>
                              setDueSmsTarget({
                                memberName: record.memberName,
                                phone: resolveMemberPhone(record, allMembers),
                                amount: record.amount,
                                month: record.month,
                                memberId: record.memberId,
                              })
                            }
                            className="px-3 py-1.5 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-600 text-white shadow-xs transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                            title="বকেয়া রিমাইন্ডার SIM SMS পাঠান"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>বকেয়া SMS পাঠান</span>
                          </button>
                        )}

                        {isAdmin && onToggleStatus && record.status === 'Pending' && (
                          <button
                            type="button"
                            onClick={() => handleApproveOrTogglePaid(record, 'Paid')}
                            className="px-3 py-1.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>অনুমোদন</span>
                          </button>
                        )}

                        {isAdmin && onToggleStatus && record.status !== 'Expense' && record.status !== 'Pending' && (
                          <button
                            type="button"
                            onClick={() =>
                              handleApproveOrTogglePaid(
                                record,
                                record.status === 'Paid' ? 'Due' : 'Paid'
                              )
                            }
                            className="px-2.5 py-1.5 text-xs font-medium rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                          >
                            {record.status === 'Paid' ? 'Due করুন' : 'Paid করুন'}
                          </button>
                        )}
                      </div>

                      {isAdmin && (
                        <div className="flex items-center gap-1 ml-auto">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(record)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition cursor-pointer"
                            title="এডিট"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {onDeleteFundRecord && (
                            <button
                              type="button"
                              onClick={() => onDeleteFundRecord(record.id)}
                              className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                              title="মুছুন"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Table View for Standard Funds */
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-700">
                    <th className="py-3 px-4">সদস্য / এন্ট্রির নাম</th>
                    <th className="py-3 px-4">বাবত / বিবরণ</th>
                    <th className="py-3 px-4">তারিখ</th>
                    <th className="py-3 px-4 text-right">পরিমাণ (টাকা)</th>
                    <th className="py-3 px-4 text-center">স্ট্যাটাস</th>
                    {isAdmin && <th className="py-3 px-4 text-right">অ্যাকশন</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRecords.map((record, idx) => {
                    const cleanDesc = getCleanFundDescription(record);
                    return (
                      <tr key={record.id || idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900">
                          <div className="flex items-center gap-2">
                            <div className={`w-7 h-7 rounded-lg text-xs font-black flex items-center justify-center ${
                              record.status === 'Paid'
                                ? 'bg-emerald-50 text-emerald-800'
                                : record.status === 'Pending'
                                ? 'bg-amber-100 text-amber-900'
                                : record.status === 'Expense'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}>
                              {record.memberName.charAt(0)}
                            </div>
                            <div className="flex flex-col">
                              <span>{record.memberName}</span>
                              {record.phone && (
                                <span className="text-[10px] text-slate-400 font-mono font-normal">
                                  {record.phone}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4 text-slate-600 text-xs">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="font-medium text-slate-800">{cleanDesc.primaryText}</span>
                            {cleanDesc.showCategoryBadge && (
                              <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-normal">
                                {cleanDesc.categoryBadgeText}
                              </span>
                            )}
                            {record.trxId && (
                              <span className="text-[10px] font-mono bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.2 rounded font-bold">
                                TrxID: {record.trxId}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-3 px-4 text-slate-500 text-xs whitespace-nowrap">
                          {formatBengaliDate(record.date)}
                        </td>

                        <td className="py-3 px-4 text-right font-bold font-mono text-slate-900">
                          {record.status === 'Expense' ? (
                            <span className="text-rose-600">- {toBengaliCurrency(record.amount)}</span>
                          ) : (
                            toBengaliCurrency(record.amount)
                          )}
                        </td>

                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          {record.status === 'Paid' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Paid
                            </span>
                          ) : record.status === 'Pending' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 text-xs font-bold border border-amber-300">
                              <Clock className="w-3 h-3 text-amber-600 animate-pulse" />
                              Pending
                            </span>
                          ) : record.status === 'Due' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200">
                              <AlertCircle className="w-3 h-3 text-amber-600" />
                              Due
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 text-xs font-bold border border-rose-200">
                              Expense
                            </span>
                          )}
                        </td>

                        {/* Admin Only: Row actions */}
                        {isAdmin && (
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              {record.status === 'Due' && (
                                <button
                                  onClick={() => setDueSmsTarget({
                                    memberName: record.memberName,
                                    phone: resolveMemberPhone(record, allMembers),
                                    amount: record.amount,
                                    month: record.month,
                                    memberId: record.memberId
                                  })}
                                  className="text-[11px] font-bold px-2 py-1 rounded-md bg-amber-500 hover:bg-amber-600 text-white shadow-xs transition flex items-center gap-1 cursor-pointer"
                                  title="বকেয়া রিমাইন্ডার SIM SMS পাঠান (কাস্টম মাসসহ)"
                                >
                                  <MessageSquare className="w-3 h-3" />
                                  <span>বকেয়া SMS</span>
                                </button>
                              )}

                              {onToggleStatus && record.status === 'Pending' && (
                                <button
                                  onClick={() => handleApproveOrTogglePaid(record, 'Paid')}
                                  className="text-[11px] font-bold px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition flex items-center gap-1 cursor-pointer"
                                  title="যাচাই সম্পন্ন করে পেইড করুন ও অটো SMS পাঠান"
                                >
                                  <Check className="w-3 h-3" />
                                  <span>অনুমোদন</span>
                                </button>
                              )}

                              {onToggleStatus && record.status !== 'Expense' && record.status !== 'Pending' && (
                                <button
                                  onClick={() => handleApproveOrTogglePaid(record, record.status === 'Paid' ? 'Due' : 'Paid')}
                                  className="text-[11px] font-semibold px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                                  title="Paid বা Due পরিবর্তন করুন"
                                >
                                  {record.status === 'Paid' ? 'Due করুন' : 'Paid করুন'}
                                </button>
                              )}

                              <button
                                onClick={() => handleOpenEdit(record)}
                                className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                title="এডিট"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              
                              {onDeleteFundRecord && (
                                <button
                                  onClick={() => onDeleteFundRecord(record.id)}
                                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                                  title="মুছুন"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {/* ADMIN ONLY: Edit Total Organization Balance Modal */}
      {isEditBalanceModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-md w-full p-4 sm:p-6 shadow-2xl border border-slate-200 animate-scaleUp max-h-[92vh] flex flex-col my-auto overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                  <Coins className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    সংগঠনের মোট তহবিল ব্যালেন্স এডিট
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    ম্যানুয়ালি মোট তহবিল ব্যালেন্স নির্ধারণ করুন
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsEditBalanceModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {balanceSaveSuccess && (
              <div className="mt-4 p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold flex items-center gap-2 border border-emerald-200 shrink-0">
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>সংগঠনের মোট তহবিলের পরিমাণ সফলভাবে সংরক্ষিত হয়েছে!</span>
              </div>
            )}

            <form onSubmit={handleSaveManualBalance} className="space-y-4 mt-4 overflow-y-auto pr-1 flex-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  সংগঠনের মোট তহবিলের পরিমাণ (টাকা ৳) *
                </label>
                <input
                  type="number"
                  required
                  autoFocus
                  id="fund-manual-balance-input"
                  value={manualBalanceInput}
                  onChange={(e) => setManualBalanceInput(e.target.value)}
                  placeholder="যেমন: 50000"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-lg font-mono font-bold focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-none"
                />
                <span className="text-[11px] text-slate-400 block mt-1">
                  বর্তমান হিসাবকৃত স্থিতি: {toBengaliCurrency(stats.netBalance)}
                </span>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="submit"
                  id="fund-manual-balance-save-btn"
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>তহবিল ব্যালেন্স সংরক্ষণ করুন</span>
                </button>

                <button
                  type="button"
                  onClick={handleResetToAutoBalance}
                  id="fund-manual-balance-reset-btn"
                  className="w-full py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                  <span>অটো ক্যালকুলেশনে রিসেট করুন ({toBengaliCurrency(stats.netBalance)})</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Entry Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-md w-full p-4 sm:p-6 shadow-2xl border border-slate-200 animate-scaleUp max-h-[92vh] flex flex-col my-auto overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-600" />
                {editingRecord ? 'ফান্ড এন্ট্রি সম্পাদনা' : 'নতুন চাঁদা / ফান্ড এন্ট্রি'}
              </h3>
              <button
                onClick={() => { setIsAddModalOpen(false); setEditingRecord(null); }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 mt-3 overflow-y-auto pr-1 flex-1">
              {formError && (
                <div className="p-2.5 rounded-lg bg-red-50 text-red-700 text-xs font-medium border border-red-200">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  সদস্য / দাতার নাম (MemberName) *
                </label>
                <input
                  type="text"
                  required
                  value={memberName}
                  onChange={(e) => {
                    const name = e.target.value;
                    setMemberName(name);
                    if (!formPhone) {
                      const matched = resolveMemberPhone({ memberName: name }, allMembers);
                      if (matched) setFormPhone(matched);
                    }
                  }}
                  placeholder="যেমন: মো: কামরুল ইসলাম"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    টাকার পরিমাণ (Amount ৳) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="৫০০"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    স্ট্যাটাস (Status) *
                  </label>
                  <select
                    value={status}
                    onChange={(e) => {
                      const newStatus = e.target.value as PaymentStatus;
                      setStatus(newStatus);
                      if (newStatus === 'Due') {
                        const parsed = extractArrearsMonthCount({
                          month: formMonth,
                          description: description,
                          amount: amount
                        });
                        if (parsed.monthCount > 1) {
                          setArrearsMonthCount(parsed.monthCount);
                          setPastMonthsText(parsed.pastMonthsText);
                        }
                      }
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none bg-white font-bold"
                  >
                    <option value="Paid">Paid (পরিশোধিত)</option>
                    <option value="Pending">Pending (অপেক্ষমান যাচাই)</option>
                    <option value="Due">Due (বকেয়া)</option>
                    <option value="Expense">Expense (সংগঠনের খরচ)</option>
                  </select>
                </div>
              </div>

              {/* Month / Year and Phone Number Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    মাস / সাল (Month)
                  </label>
                  <input
                    type="text"
                    value={formMonth}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormMonth(val);
                      if (status === 'Due') {
                        const parsed = extractArrearsMonthCount({ month: val });
                        if (parsed.monthCount > 1) {
                          setArrearsMonthCount(parsed.monthCount);
                          setPastMonthsText(parsed.pastMonthsText);
                        }
                      }
                    }}
                    placeholder="যেমন: মার্চ ২০২৬"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    মোবাইল নম্বর (SIM SMS)
                  </label>
                  <input
                    type="tel"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="01711-XXXXXX"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* Due Status Dynamic Arrears Selection */}
              {status === 'Due' && (
                <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200/80 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      <span>বকেয়া মাসের সংখ্যা ও রিমাইন্ডার হিসাব</span>
                    </label>
                    <span className="text-[10px] font-bold text-amber-800 bg-white px-2 py-0.5 rounded-full border border-amber-300 shadow-2xs">
                      {arrearsMonthCount === 1 ? '১ মাস (রানিং)' : `মোট ${toBengaliNumber(arrearsMonthCount)} মাস`}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        বকেয়া মাস নির্বাচন
                      </label>
                      <select
                        value={arrearsMonthCount}
                        onChange={(e) => {
                          const count = Number(e.target.value);
                          setArrearsMonthCount(count);
                          if (count > 1) {
                            setPastMonthsText(toBengaliNumber(count - 1));
                          } else {
                            setPastMonthsText('');
                          }
                        }}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white font-bold focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-none"
                      >
                        <option value={1}>১ মাস (শুধুমাত্র রানিং মাস)</option>
                        {ARREARS_MONTH_OPTIONS.filter(n => n > 1).map(n => (
                          <option key={n} value={n}>
                            {toBengaliNumber(n)} মাস (রানিং + গত {toBengaliNumber(n - 1)} মাস)
                          </option>
                        ))}
                        {!ARREARS_MONTH_OPTIONS.includes(arrearsMonthCount) && arrearsMonthCount > 1 && (
                          <option value={arrearsMonthCount}>
                            {toBengaliNumber(arrearsMonthCount)} মাস (রানিং + গত {toBengaliNumber(arrearsMonthCount - 1)} মাস)
                          </option>
                        )}
                      </select>
                    </div>

                    {arrearsMonthCount > 1 && (
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          অতীত মাসের সংখ্যা / নাম
                        </label>
                        <input
                          type="text"
                          value={pastMonthsText}
                          onChange={(e) => setPastMonthsText(e.target.value)}
                          placeholder={toBengaliNumber(arrearsMonthCount - 1)}
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-none font-medium"
                          title="টেমপ্লেটে 'গত [Months] মাস সহ' হিসেবে প্রদর্শিত হবে"
                        />
                      </div>
                    )}
                  </div>

                  <p className="text-[11px] text-amber-900 leading-relaxed bg-amber-100/70 p-2 rounded-lg">
                    {arrearsMonthCount === 1 ? (
                      <span>ℹ️ ১ মাস বকেয়া থাকায় রানিং মাসের সিঙ্গেল টেমপ্লেট প্রযোজ্য হবে।</span>
                    ) : (
                      <span>ℹ️ ১ মাসের বেশি বকেয়া থাকায় রানিং মাস এবং গত <strong>{pastMonthsText || toBengaliNumber(arrearsMonthCount - 1)}</strong> মাস সহ বকেয়া টেমপ্লেট প্রযোজ্য হবে।</span>
                    )}
                  </p>
                </div>
              )}

              {/* Live Direct SIM SMS Message Preview */}
              {(status === 'Paid' || status === 'Due') && currentModalSmsPreview && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                    <span className="flex items-center gap-1.5 text-emerald-800">
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                      <span>মেসেজ প্রিভিউ (Direct SIM SMS):</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {currentModalSmsPreview.length} অক্ষর
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed font-sans bg-white p-2.5 rounded-lg border border-slate-200 select-all shadow-2xs">
                    {currentModalSmsPreview}
                  </p>
                </div>
              )}

              {/* In-Modal Feedback Notice */}
              {modalSmsNotice && (
                <div className="p-2.5 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200 flex items-center justify-between animate-fadeIn">
                  <span>✓ {modalSmsNotice}</span>
                  <button type="button" onClick={() => setModalSmsNotice(null)} className="text-emerald-600 hover:text-emerald-800 font-bold ml-2">✕</button>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    তারিখ (Date)
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ধরন (Category)
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none bg-white font-medium"
                  >
                    <option value="মাসিক চাঁদা">মাসিক চাঁদা</option>
                    <option value="এককালীন অনুদান">এককালীন অনুদান</option>
                    <option value="জরুরি সাহায্য">জরুরি সাহায্য</option>
                    <option value="খরচ">খরচ / অফিস ব্যয়</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  বিবরণ / বাবত
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="যেমন: মার্চ মাসের মাসিক চাঁদা"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => { setIsAddModalOpen(false); setEditingRecord(null); }}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition text-center cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  onClick={handleSendDirectSmsFromModal}
                  id="fund-send-sms-btn"
                  className="px-3.5 py-2.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
                  title="সরাসরি মোবাইলের SIM SMS অ্যাপে মেসেজ পাঠান"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                  <span>এসএমএস পাঠান</span>
                </button>
                <button
                  type="submit"
                  id="fund-submit-btn"
                  className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition text-center cursor-pointer"
                >
                  {editingRecord ? 'আপডেট সম্পন্ন করুন' : 'এন্ট্রি সংরক্ষণ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Expense Modal (Add & Edit) */}
      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => {
          setIsExpenseModalOpen(false);
          setEditingExpense(null);
        }}
        onSubmit={handleSaveExpense}
        onSave={handleSaveExpense}
        initialData={
          editingExpense
            ? {
                description: editingExpense.description || '',
                amount: editingExpense.amount,
                disbursedTo: editingExpense.disbursedTo || editingExpense.memberName,
                date: editingExpense.date,
                category: editingExpense.category || 'ত্রাণ ও খাদ্য সহায়তা',
                voucherNo: editingExpense.notes?.includes('ভাউচার:')
                  ? editingExpense.notes.split('ভাউচার:')[1].split('-')[0].trim()
                  : '',
                notes: editingExpense.notes?.includes('ভাউচার:')
                  ? (editingExpense.notes.split(' - ').length > 1 ? editingExpense.notes.split(' - ').slice(1).join(' - ').trim() : '')
                  : (editingExpense.notes || '')
              }
            : null
        }
      />

      {/* Due Reminder Direct SIM SMS Modal with Custom Months Selection */}
      <DueSmsModal
        isOpen={!!dueSmsTarget}
        onClose={() => setDueSmsTarget(null)}
        target={dueSmsTarget}
        paymentConfig={paymentConfig}
      />
    </div>
  );
};
