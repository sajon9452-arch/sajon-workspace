import React, { useState } from 'react';
import { 
  CreditCard, 
  Smartphone, 
  Copy, 
  Check, 
  X, 
  Send, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  ArrowRight,
  Landmark,
  Wallet
} from 'lucide-react';
import { PaymentGatewayConfig, PaymentGatewayItem, Member, FundRecord, PendingPayment } from '../types';
import { safeSyncToSupabase } from '../utils/supabaseClient';
import { PMS_SYNC_EVENT } from '../utils/storage';

// Authentic High-Fidelity Colorful Logos
export const BkashLogo: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <polygon points="12,50 88,20 60,56 38,52" fill="#E2136E" />
    <polygon points="60,56 88,20 76,76 48,68" fill="#C2185B" />
    <polygon points="48,68 76,76 28,92 36,64" fill="#E2136E" />
    <polygon points="12,50 38,52 36,64 12,50" fill="#9C1046" />
    <polygon points="38,52 60,56 48,68 36,64" fill="#FF3388" />
  </svg>
);

export const NagadLogo: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M50 8C50 8 60 26 48 42C36 56 38 74 54 86C70 74 74 54 64 38C54 24 50 8 50 8Z"
      fill="#F7931E"
    />
    <path
      d="M32 40C32 40 22 56 30 72C38 86 54 92 54 92C54 92 40 82 36 68C32 56 38 46 32 40Z"
      fill="#EA1D25"
    />
    <path
      d="M50 24C50 24 54 34 48 44C42 54 44 64 52 72C60 64 62 52 56 42C50 32 50 24 50 24Z"
      fill="#FFB03B"
    />
  </svg>
);

export const RocketLogo: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M50 6C50 6 70 24 72 48L80 58L70 58L68 76L50 66L32 76L30 58L20 58L28 48C30 24 50 6 50 6Z"
      fill="#8C3494"
    />
    <circle cx="50" cy="36" r="8" fill="#FFFFFF" />
    <circle cx="50" cy="36" r="4.5" fill="#00A3E0" />
    <polygon points="42,74 50,94 58,74" fill="#FFA000" />
    <polygon points="45,74 50,88 55,74" fill="#FFEB3B" />
  </svg>
);

export interface PaymentGatewaySectionProps {
  paymentConfig: PaymentGatewayConfig;
  members?: Member[];
  onDepositSuccess?: (rec: { 
    memberName: string; 
    amount: number; 
    trxId: string;
    designation?: string;
    senderPhone?: string;
    gateway?: string;
  }) => void;
}

interface DisplayGatewayMethod {
  id: string;
  name: string;
  nameEn: string;
  number: string;
  type: string;
  instructions: string;
  gradient: string;
  borderHover: string;
  badgeBg: string;
  btnBg: string;
  logoType: 'bkash' | 'nagad' | 'rocket' | 'bank' | 'wallet';
  isBank: boolean;
  bankName?: string;
  branchName?: string;
  routingNumber?: string;
  accountHolder?: string;
}

export const PaymentGatewaySection: React.FC<PaymentGatewaySectionProps> = ({
  paymentConfig,
  members = [],
  onDepositSuccess
}) => {
  // Modal state: null when closed, or gateway id string
  const [activeModalGatewayId, setActiveModalGatewayId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [userName, setUserName] = useState('');
  const [designation, setDesignation] = useState('সাধারণ সদস্য');
  const [senderPhone, setSenderPhone] = useState('');
  const [amount, setAmount] = useState<number | ''>(500);
  const [trxId, setTrxId] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Build dynamic gateways list with priority to paymentConfig.gateways
  const methods = React.useMemo<DisplayGatewayMethod[]>(() => {
    if (paymentConfig.gateways && paymentConfig.gateways.length > 0) {
      const activeList = paymentConfig.gateways.filter(g => g.isActive !== false);
      if (activeList.length > 0) {
        return activeList.map((item): DisplayGatewayMethod => {
          let gradient = 'from-slate-700 to-slate-900';
          let borderHover = 'hover:border-slate-500';
          let badgeBg = 'bg-slate-500/15 text-slate-300 border-slate-500/30';
          let btnBg = 'bg-slate-700 hover:bg-slate-800';
          let logoType: 'bkash' | 'nagad' | 'rocket' | 'bank' | 'wallet' = 'wallet';

          const gType = (item.gatewayType || '').toLowerCase();
          const gName = (item.gatewayName || '').toLowerCase();

          if (gType === 'bkash' || gName.includes('বিকাশ') || gName.includes('bkash')) {
            gradient = 'from-[#E2136E] to-[#C2185B]';
            borderHover = 'hover:border-[#E2136E]/60';
            badgeBg = 'bg-[#E2136E]/15 text-[#FF66A3] border-[#E2136E]/30';
            btnBg = 'bg-[#E2136E] hover:bg-[#C2185B]';
            logoType = 'bkash';
          } else if (gType === 'nagad' || gName.includes('নগদ') || gName.includes('nagad')) {
            gradient = 'from-[#EA1D25] to-[#F7931E]';
            borderHover = 'hover:border-[#EA1D25]/60';
            badgeBg = 'bg-[#EA1D25]/15 text-[#FFA07A] border-[#EA1D25]/30';
            btnBg = 'bg-gradient-to-r from-[#EA1D25] to-[#F7931E] hover:opacity-95';
            logoType = 'nagad';
          } else if (gType === 'rocket' || gName.includes('রকেট') || gName.includes('rocket')) {
            gradient = 'from-[#8C3494] to-[#5C2366]';
            borderHover = 'hover:border-[#8C3494]/60';
            badgeBg = 'bg-[#8C3494]/15 text-[#DDA0DD] border-[#8C3494]/30';
            btnBg = 'bg-[#8C3494] hover:bg-[#6F2C91]';
            logoType = 'rocket';
          } else if (gType === 'bank' || item.bankName) {
            gradient = 'from-blue-700 to-indigo-900';
            borderHover = 'hover:border-blue-400';
            badgeBg = 'bg-blue-500/15 text-blue-300 border-blue-500/30';
            btnBg = 'bg-blue-600 hover:bg-blue-700';
            logoType = 'bank';
          } else if (gType === 'upay' || gName.includes('উপায়') || gName.includes('upay')) {
            gradient = 'from-amber-600 to-amber-800';
            borderHover = 'hover:border-amber-400';
            badgeBg = 'bg-amber-500/15 text-amber-300 border-amber-500/30';
            btnBg = 'bg-amber-600 hover:bg-amber-700';
            logoType = 'wallet';
          }

          return {
            id: item.id,
            name: item.gatewayName,
            nameEn: item.gatewayType.toUpperCase(),
            number: item.accountNumber,
            type: item.accountType,
            instructions: item.instructions || 'পেমেন্ট সম্পন্ন করে নিচের ফর্মে ট্রানজেকশন আইডি (TrxID) প্রদান করুন।',
            gradient,
            borderHover,
            badgeBg,
            btnBg,
            logoType,
            bankName: item.bankName,
            branchName: item.branchName,
            routingNumber: item.routingNumber,
            accountHolder: item.accountHolder,
            isBank: Boolean(item.bankName || gType === 'bank')
          };
        });
      }
    }

    // Default 3 standard gateways if not yet migrated or empty
    return [
      {
        id: 'bkash',
        name: 'বিকাশ',
        nameEn: 'bKash',
        number: paymentConfig.bkashNumber || '০১৮XXXXXXXX',
        type: paymentConfig.bkashType || 'Personal',
        instructions: paymentConfig.bkashInstructions || 'আপনার বিকাশ অ্যাপ থেকে সেন্ড মানি (Send Money) করে ট্রানজেকশন আইডি (TrxID) নিচে প্রদান করুন।',
        gradient: 'from-[#E2136E] to-[#C2185B]',
        borderHover: 'hover:border-[#E2136E]/60',
        badgeBg: 'bg-[#E2136E]/15 text-[#FF66A3] border-[#E2136E]/30',
        btnBg: 'bg-[#E2136E] hover:bg-[#C2185B]',
        logoType: 'bkash' as const,
        isBank: false
      },
      {
        id: 'nagad',
        name: 'নগদ',
        nameEn: 'Nagad',
        number: paymentConfig.nagadNumber || '০১৬XXXXXXXX',
        type: paymentConfig.nagadType || 'Personal',
        instructions: paymentConfig.nagadInstructions || 'নগদ অ্যাপ থেকে সেন্ড মানি করে TrxID ও প্রেরক নম্বর নিচে এন্ট্রি করুন।',
        gradient: 'from-[#EA1D25] to-[#F7931E]',
        borderHover: 'hover:border-[#EA1D25]/60',
        badgeBg: 'bg-[#EA1D25]/15 text-[#FFA07A] border-[#EA1D25]/30',
        btnBg: 'bg-gradient-to-r from-[#EA1D25] to-[#F7931E] hover:opacity-95',
        logoType: 'nagad' as const,
        isBank: false
      },
      {
        id: 'rocket',
        name: 'রকেট',
        nameEn: 'Rocket',
        number: paymentConfig.rocketNumber || '০১৭XXXXXXXX',
        type: paymentConfig.rocketType || 'Personal',
        instructions: paymentConfig.rocketInstructions || 'রকেট অ্যাপ থেকে সেন্ড মানি করে ট্রানজেকশন রেফারেন্স নিশ্চিত করুন।',
        gradient: 'from-[#8C3494] to-[#5C2366]',
        borderHover: 'hover:border-[#8C3494]/60',
        badgeBg: 'bg-[#8C3494]/15 text-[#DDA0DD] border-[#8C3494]/30',
        btnBg: 'bg-[#8C3494] hover:bg-[#6F2C91]',
        logoType: 'rocket' as const,
        isBank: false
      }
    ];
  }, [paymentConfig]);

  const currentMethod = methods.find(m => m.id === activeModalGatewayId) || methods[0];

  const renderLogo = (type: string, className = "w-6 h-6") => {
    switch (type) {
      case 'bkash':
        return <BkashLogo className={className} />;
      case 'nagad':
        return <NagadLogo className={className} />;
      case 'rocket':
        return <RocketLogo className={className} />;
      case 'bank':
        return <Landmark className={`${className} text-blue-600`} />;
      default:
        return <Wallet className={`${className} text-emerald-600`} />;
    }
  };

  const handleOpenGatewayModal = (gatewayId: string) => {
    setActiveModalGatewayId(gatewayId);
    setErrorMsg('');
    setSuccessMsg('');
    setCopied(false);
  };

  const handleCloseModal = () => {
    setActiveModalGatewayId(null);
    setErrorMsg('');
    setSuccessMsg('');
    setCopied(false);
  };

  const handleCopy = (num: string) => {
    navigator.clipboard.writeText(num);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleMemberSelect = (id: string) => {
    setSelectedMemberId(id);
    const m = members.find(mem => mem.id === id);
    if (m) {
      setUserName(m.name);
      setDesignation(m.designation || 'সাধারণ সদস্য');
      setSenderPhone(m.phone || '');
    } else {
      setSelectedMemberId('');
    }
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!userName.trim()) {
      setErrorMsg('ইউজারের নাম (User Name) লিখুন');
      return;
    }
    if (!designation.trim()) {
      setErrorMsg('পদবি (Designation) লিখুন');
      return;
    }
    if (!senderPhone.trim()) {
      setErrorMsg('যে নম্বর থেকে টাকা পাঠানো হয়েছে তা লিখুন');
      return;
    }
    if (amount === '' || Number(amount) <= 0) {
      setErrorMsg('সঠিক টাকার পরিমাণ লিখুন');
      return;
    }
    if (!trxId.trim()) {
      setErrorMsg('ট্রানজেকশন আইডি (TrxID) লিখুন');
      return;
    }

    setIsSubmitting(true);

    try {
      const cleanTrx = trxId.trim().toUpperCase();
      const numAmount = Number(amount);

      // 1. Requirement 1: Save submission directly into pending_payments table in Supabase with status 'pending'
      const newPendingPayment: PendingPayment = {
        id: `pay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        memberId: selectedMemberId || undefined,
        userName: userName.trim(),
        memberName: userName.trim(),
        designation: designation.trim() || 'সাধারণ সদস্য',
        senderPhone: senderPhone.trim(),
        amount: numAmount,
        trxId: cleanTrx,
        transactionId: cleanTrx,
        gateway: currentMethod.nameEn,
        status: 'pending',
        submittedAt: new Date().toISOString(),
        notes: `${currentMethod.name} (${currentMethod.nameEn}) TrxID: ${cleanTrx} - প্রেরক: ${senderPhone.trim()}`
      };

      // Direct Supabase save to pending_payments table
      await safeSyncToSupabase('pendingPayments', newPendingPayment);

      // Broadcast local sync event so Admin Panel and App update immediately
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(PMS_SYNC_EVENT));
      }

      // Trigger callback if provided
      if (onDepositSuccess) {
        onDepositSuccess({ 
          memberName: userName.trim(), 
          amount: numAmount, 
          trxId: cleanTrx,
          designation: designation.trim(),
          senderPhone: senderPhone.trim(),
          gateway: currentMethod.nameEn
        });
      }

      setSuccessMsg(`আপনার ${currentMethod.name} পেমেন্ট তথ্য সফলভাবে জমা হয়েছে! ট্রানজেকশন আইডি: ${cleanTrx}। অ্যাডমিন দ্রুত যাচাই করে অনুমোদন করবেন।`);

      setTimeout(() => {
        handleCloseModal();
        setTrxId('');
      }, 2500);
    } catch {
      setErrorMsg('পেমেন্ট তথ্য জমা করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 rounded-3xl p-5 sm:p-6 text-white shadow-xl space-y-4 border border-slate-700">
      {/* Header (Top Yellow Button Removed as requested) */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center shrink-0">
          <CreditCard className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
            <span>ডিজিটাল পেমেন্ট গেটওয়ে</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              সরাসরি পেমেন্ট
            </span>
          </h3>
          <p className="text-xs text-slate-300 mt-0.5">
            পেমেন্ট নম্বর দেখতে ও TrxID সাবমিট করতে নিচের বিকাশ, নগদ বা রকেট আইকনে স্পর্শ করুন
          </p>
        </div>
      </div>

      {/* Colorful & Interactive Gateway Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
        {methods.map((method) => {
          return (
            <button
              key={method.id}
              type="button"
              onClick={() => handleOpenGatewayModal(method.id)}
              className={`group p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 ${method.borderHover} transition-all duration-200 cursor-pointer text-left flex flex-col justify-between space-y-3 hover:shadow-lg hover:scale-[1.02] active:scale-98`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-white shadow-md p-1.5 flex items-center justify-center shrink-0 border border-slate-100 group-hover:scale-110 transition-transform">
                    {renderLogo(method.logoType, "w-full h-full")}
                  </div>
                  <div>
                    <span className="text-sm font-black text-white block">
                      {method.name}
                    </span>
                    <span className="text-[11px] font-mono text-slate-300 font-bold block">
                      {method.bankName ? method.bankName : method.nameEn}
                    </span>
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${method.badgeBg}`}>
                  {method.type}
                </span>
              </div>

              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs font-bold text-amber-300 group-hover:text-amber-200">
                <span className="flex items-center gap-1 text-[11px]">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>নম্বর ও পেমেন্ট ফর্ম</span>
                </span>
                <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          );
        })}
      </div>

      {/* Dedicated Popup Window / Form for the Selected Gateway */}
      {activeModalGatewayId && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 text-slate-800 animate-in fade-in zoom-in-95 duration-200 my-8">
            {/* 1. Branded Header */}
            <div className={`p-5 bg-gradient-to-r ${currentMethod.gradient} text-white flex items-center justify-between`}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white p-2 shadow-md flex items-center justify-center shrink-0">
                  {renderLogo(currentMethod.logoType, "w-full h-full")}
                </div>
                <div>
                  <h3 className="text-lg font-black flex items-center gap-2">
                    <span>{currentMethod.name} ({currentMethod.nameEn}) গেটওয়ে</span>
                  </h3>
                  <p className="text-xs text-white/90">
                    {currentMethod.isBank ? 'নির্ধারিত ব্যাংক অ্যাকাউন্টে টাকা পাঠিয়ে ডিপোজিট তথ্য সাবমিট করুন' : 'নির্ধারিত নম্বরে টাকা পাঠিয়ে TrxID তথ্য সাবমিট করুন'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition cursor-pointer"
                title="বন্ধ করুন"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* 2. Top Box: Admin-configured payment number or Bank info with Copy option */}
              <div className="p-4 rounded-2xl bg-slate-50 border-2 border-slate-200/90 space-y-3">
                {currentMethod.isBank ? (
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-600 flex items-center gap-1.5">
                        <Landmark className="w-4 h-4 text-blue-600" />
                        <span>ব্যাংক হিসাবের বিবরণী:</span>
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-800">
                        {currentMethod.type}
                      </span>
                    </div>

                    {currentMethod.bankName && (
                      <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex justify-between items-center">
                        <span className="text-slate-500 text-[11px]">ব্যাংকের নাম:</span>
                        <strong className="text-slate-800 font-bold text-sm">{currentMethod.bankName}</strong>
                      </div>
                    )}

                    {currentMethod.branchName && (
                      <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex justify-between items-center">
                        <span className="text-slate-500 text-[11px]">শাখা (Branch):</span>
                        <strong className="text-slate-800 font-bold text-xs">{currentMethod.branchName}</strong>
                      </div>
                    )}

                    {currentMethod.accountHolder && (
                      <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex justify-between items-center">
                        <span className="text-slate-500 text-[11px]">অ্যাকাউন্ট হোল্ডার:</span>
                        <strong className="text-slate-800 font-bold text-xs">{currentMethod.accountHolder}</strong>
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold">অ্যাকাউন্ট নম্বর:</span>
                        <span className="font-mono text-lg sm:text-xl font-black text-slate-900 tracking-wider">
                          {currentMethod.number}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(currentMethod.number)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs cursor-pointer active:scale-95 shrink-0"
                        title="অ্যাকাউন্ট নম্বর কপি করুন"
                      >
                        {copied ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>কপি হয়েছে!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>কপি করুন</span>
                          </>
                        )}
                      </button>
                    </div>

                    {currentMethod.routingNumber && (
                      <div className="flex items-center justify-between gap-3 bg-white p-2 rounded-xl border border-slate-200">
                        <span className="text-slate-500 text-[11px]">রাউটিং নম্বর:</span>
                        <span className="font-mono font-bold text-slate-800">{currentMethod.routingNumber}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-600 flex items-center gap-1.5">
                        <Smartphone className="w-4 h-4 text-slate-500" />
                        <span>{currentMethod.name} পেমেন্ট নম্বর ({currentMethod.type}):</span>
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-200 text-slate-700">
                        {currentMethod.type}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
                      <span className="font-mono text-xl sm:text-2xl font-black text-slate-900 tracking-wider">
                        {currentMethod.number}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(currentMethod.number)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs cursor-pointer active:scale-95 shrink-0"
                        title="নম্বর কপি করুন"
                      >
                        {copied ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>কপি হয়েছে!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>কপি করুন</span>
                          </>
                        )}
                      </button>
                    </div>
                  </>
                )}

                <p className="text-[11px] text-slate-500 leading-relaxed">
                  {currentMethod.instructions}
                </p>
              </div>

              {/* Success / Error Banners */}
              {successMsg && (
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              {errorMsg && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-300 text-rose-800 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* 3. The Payment Submission Form */}
              <form onSubmit={handleSubmitPayment} className="space-y-3.5 text-xs">
                {/* Optional Member Quick-Select */}
                {members.length > 0 && (
                  <div className="p-2.5 rounded-xl bg-slate-100/70 border border-slate-200">
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      সদস্য তালিকা থেকে নির্বাচন করুন (ঐচ্ছিক - তথ্য অটো পূরণ হবে):
                    </label>
                    <select
                      value={selectedMemberId}
                      onChange={(e) => handleMemberSelect(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    >
                      <option value="">-- সদস্য নির্বাচন করুন (ঐচ্ছিক) --</option>
                      {members.map((m) => (
                        <option key={m.id} value={m.id}>
                          #{m.serial} - {m.name} ({m.designation})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Field 1: User Name (ইউজারের নাম) & Field 2: Designation (পদবি) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      ইউজারের নাম (User Name) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      placeholder="আপনার নাম লিখুন"
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      পদবি (Designation) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      placeholder="যেমন: সাধারণ সদস্য / শুভাকাঙ্ক্ষী"
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>

                {/* Field 3: Sender Mobile Number (যে নম্বর থেকে টাকা পাঠানো হয়েছে) */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    যে নম্বর থেকে টাকা পাঠানো হয়েছে (Sender Mobile Number) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={senderPhone}
                    onChange={(e) => setSenderPhone(e.target.value)}
                    placeholder="যেমন: 01711000000"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                {/* Field 4: Amount (টাকার পরিমাণ) */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    টাকার পরিমাণ (Amount ৳) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-500">৳</span>
                    <input
                      type="number"
                      required
                      min="1"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="যেমন: 500"
                      className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white font-mono font-black text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                  {/* Quick amounts */}
                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    {['200', '300', '500', '1000', '2000'].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setAmount(Number(amt))}
                        className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold transition cursor-pointer ${
                          amount === Number(amt)
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {amt} ৳
                      </button>
                    ))}
                  </div>
                </div>

                {/* Field 5: Transaction ID (TrxID) */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    ট্রানজেকশন আইডি (TrxID) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={trxId}
                    onChange={(e) => setTrxId(e.target.value.toUpperCase())}
                    placeholder="যেমন: BKL9X87ZQ2"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white font-mono font-black uppercase tracking-wider text-emerald-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    টাকা পাঠানোর পর প্রাপ্ত SMS বা অ্যাপ স্টেটমেন্ট থেকে TrxID লিখে সাবমিট করুন
                  </p>
                </div>

                {/* Modal Actions */}
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold transition cursor-pointer"
                  >
                    বাতিল
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`px-6 py-2.5 rounded-xl text-white font-black text-xs shadow-md transition cursor-pointer active:scale-95 flex items-center gap-2 ${currentMethod.btnBg} disabled:opacity-50`}
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSubmitting ? 'জমা হচ্ছে...' : `${currentMethod.name} পেমেন্ট সাবমিট করুন`}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
