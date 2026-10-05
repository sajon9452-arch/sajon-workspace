import React from 'react';
import { 
  CreditCard, 
  Smartphone, 
  Copy, 
  Check, 
  X, 
  Send, 
  ShieldCheck, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  Maximize2,
  Minimize2,
  HelpCircle,
  ArrowRight
} from 'lucide-react';
import { PaymentGatewayConfig, Member } from '../types';
import { findMemberInDirectory } from '../utils/memberFundLinker';

// Custom high-fidelity brand SVGs
export const BkashLogo: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 120 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 54L104 22L70 60L46 56L16 54Z" fill="currentColor" fillOpacity="0.95" />
    <path d="M70 60L104 22L90 78L56 70L70 60Z" fill="currentColor" fillOpacity="0.8" />
    <path d="M56 70L90 78L36 98L44 68L56 70Z" fill="currentColor" fillOpacity="0.9" />
    <path d="M16 54L46 56L44 68L16 54Z" fill="currentColor" fillOpacity="0.75" />
  </svg>
);

export const NagadLogo: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 100 100" className={className} fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M50 10C50 10 58 28 46 42C34 56 36 74 52 86C68 74 72 54 62 40C52 26 50 10 50 10Z" />
    <path d="M30 42C30 42 22 56 30 70C38 84 54 90 54 90C54 90 40 82 36 70C32 58 38 48 30 42Z" opacity="0.85" />
  </svg>
);

export const RocketLogo: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 100 100" className={className} fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M50 8C50 8 66 24 68 46L76 56L68 56L66 74L50 64L34 74L32 56L24 56L32 46C34 24 50 8 50 8Z" />
    <circle cx="50" cy="36" r="6" fill="white" />
    <path d="M46 70L50 88L54 70Z" fill="#F59E0B" />
  </svg>
);

export interface PaymentGatewaySectionProps {
  paymentConfig: PaymentGatewayConfig;
  selectedGateway: 'bkash' | 'nagad' | 'rocket' | null;
  onSelectGateway: (gateway: 'bkash' | 'nagad' | 'rocket' | null) => void;
  copiedField: string | null;
  onCopyNumber: (num: string, gatewayKey: string) => void;
  depositMemberName: string;
  onChangeMemberName: (val: string) => void;
  depositAmount: number | '';
  onChangeAmount: (val: number | '') => void;
  depositTrxId: string;
  onChangeTrxId: (val: string) => void;
  depositSenderPhone: string;
  onChangeSenderPhone: (val: string) => void;
  depositSuccessMsg: string;
  depositErrorMsg: string;
  onSubmit: (e: React.FormEvent) => void;
  isPaymentModalOpen: boolean;
  onTogglePaymentModal: (open: boolean) => void;
  members?: Member[];
}

export const PaymentGatewaySection: React.FC<PaymentGatewaySectionProps> = ({
  paymentConfig,
  selectedGateway,
  onSelectGateway,
  copiedField,
  onCopyNumber,
  depositMemberName,
  onChangeMemberName,
  depositAmount,
  onChangeAmount,
  depositTrxId,
  onChangeTrxId,
  depositSenderPhone,
  onChangeSenderPhone,
  depositSuccessMsg,
  depositErrorMsg,
  onSubmit,
  isPaymentModalOpen,
  onTogglePaymentModal,
  members = [],
}) => {
  // Method metadata config
  const methods = [
    {
      id: 'bkash' as const,
      name: 'বিকাশ',
      nameEn: 'bKash',
      number: paymentConfig.bkashNumber,
      type: paymentConfig.bkashType || 'Personal',
      instructions: paymentConfig.bkashInstructions || 'আপনার বিকাশ অ্যাপ থেকে উপরের নম্বরে Send Money করুন। সফল ট্রানজেকশনের TrxID নিচে সাবমিট করুন।',
      brandBg: 'bg-[#D82360]',
      brandText: 'text-[#D82360]',
      brandBorder: 'border-[#D82360]',
      brandRing: 'ring-[#D82360]/20',
      activeBg: 'bg-pink-50/70',
      activeBorder: 'border-pink-500',
      hoverBorder: 'hover:border-pink-300 hover:bg-pink-50/20',
      btnId: 'select-gateway-bkash-btn',
      copyBtnId: 'copy-bkash-number-btn',
      logo: BkashLogo,
      placeholderTrx: 'যেমন: 9J7X4K2P9Q'
    },
    {
      id: 'nagad' as const,
      name: 'নগদ',
      nameEn: 'Nagad',
      number: paymentConfig.nagadNumber,
      type: paymentConfig.nagadType || 'Personal',
      instructions: paymentConfig.nagadInstructions || 'নগদ অ্যাপ বা *167# ডায়াল করে Send Money করুন। সফল পেমেন্টের পর TrxID টি নিচের বক্সে লিখে সাবমিট করুন।',
      brandBg: 'bg-[#F7941D]',
      brandText: 'text-[#F7941D]',
      brandBorder: 'border-[#F7941D]',
      brandRing: 'ring-[#F7941D]/20',
      activeBg: 'bg-orange-50/70',
      activeBorder: 'border-orange-500',
      hoverBorder: 'hover:border-orange-300 hover:bg-orange-50/20',
      btnId: 'select-gateway-nagad-btn',
      copyBtnId: 'copy-nagad-number-btn',
      logo: NagadLogo,
      placeholderTrx: 'যেমন: 7K9X2M4P1Q'
    },
    {
      id: 'rocket' as const,
      name: 'রকেট',
      nameEn: 'Rocket (DBBL)',
      number: paymentConfig.rocketNumber,
      type: paymentConfig.rocketType || 'Personal',
      instructions: paymentConfig.rocketInstructions || 'রকেট অ্যাপ বা *322# ডায়াল করে Send Money করার পর ফিরতি এসএমএসের TrxID নিচে সাবমিট করুন।',
      brandBg: 'bg-[#8C3494]',
      brandText: 'text-[#8C3494]',
      brandBorder: 'border-[#8C3494]',
      brandRing: 'ring-[#8C3494]/20',
      activeBg: 'bg-purple-50/70',
      activeBorder: 'border-purple-500',
      hoverBorder: 'hover:border-purple-300 hover:bg-purple-50/20',
      btnId: 'select-gateway-rocket-btn',
      copyBtnId: 'copy-rocket-number-btn',
      logo: RocketLogo,
      placeholderTrx: 'যেমন: 8L5N3P7Q2R'
    }
  ];

  const currentMethod = methods.find(m => m.id === selectedGateway);

  // Common details renderer for either In-Place View or Modal View
  const renderMethodDetailContent = (isModal = false) => {
    if (!currentMethod) return null;
    const LogoComponent = currentMethod.logo;

    return (
      <div className="space-y-4 animate-fadeIn">
        {/* Account Info Box */}
        <div className={`p-4 sm:p-5 rounded-2xl border ${currentMethod.activeBg} ${currentMethod.brandBorder}/40 shadow-xs space-y-3.5`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className={`w-6 h-6 rounded-lg ${currentMethod.brandBg} text-white flex items-center justify-center shadow-2xs`}>
                  <LogoComponent className="w-3.5 h-3.5" />
                </span>
                <span className="font-bold text-slate-900 text-sm">
                  {currentMethod.name} ({currentMethod.nameEn}) অ্যাকাউন্ট
                </span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white text-slate-700 border border-slate-200">
                  {currentMethod.type}
                </span>
              </div>
              <div className="text-xs text-slate-600">
                উদ্দেশ্য: <strong className="text-slate-900">মাসিক চাঁদা / অনুদান পরিশোধ</strong>
              </div>
            </div>

            {/* Account number & copy button */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              {currentMethod.number ? (
                <>
                  <div className="px-3.5 py-1.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
                    <span className="text-base sm:text-lg font-mono font-black text-slate-900 tracking-wider">
                      {currentMethod.number}
                    </span>
                  </div>
                  <button
                    type="button"
                    id={currentMethod.copyBtnId}
                    onClick={() => onCopyNumber(currentMethod.number, currentMethod.id)}
                    className={`flex items-center gap-1.5 px-3.5 py-2 font-bold text-xs rounded-xl shadow-xs transition-all duration-200 cursor-pointer ${
                      copiedField === currentMethod.id
                        ? 'bg-emerald-600 text-white ring-2 ring-emerald-400 scale-102'
                        : `${currentMethod.brandBg} hover:opacity-90 active:scale-95 text-white`
                    }`}
                    title="নম্বরটি ক্লিপবোর্ডে কপি করুন"
                  >
                    {copiedField === currentMethod.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-white animate-bounce" />
                        <span>কপি হয়েছে!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>নম্বর কপি</span>
                      </>
                    )}
                  </button>
                </>
              ) : (
                <div className="text-xs font-semibold text-rose-600 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200">
                  অ্যাডমিন এখনো নম্বর যুক্ত করেননি
                </div>
              )}
            </div>
          </div>

          {/* Quick step guide */}
          <div className="bg-white/90 p-3 sm:p-3.5 rounded-xl border border-slate-200/80 text-xs text-slate-600 space-y-1.5">
            <div className="font-bold text-slate-800 flex items-center gap-1.5">
              <Smartphone className={`w-3.5 h-3.5 ${currentMethod.brandText}`} />
              <span>{currentMethod.name} পেমেন্ট ও চাঁদা পাঠানোর নিয়ম:</span>
            </div>
            <p className="leading-relaxed">
              {currentMethod.instructions}
            </p>
          </div>
        </div>

        {/* TrxID Verification & Submission Form */}
        <div className={`p-4 sm:p-5 rounded-2xl border ${currentMethod.activeBg} ${currentMethod.brandBorder}/30 shadow-xs space-y-3.5`}>
          <div className="flex items-center justify-between border-b pb-2.5 border-slate-200/80">
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
              <Send className={`w-3.5 h-3.5 ${currentMethod.brandText}`} />
              <span>{currentMethod.name} ট্রানজেকশন সাবমিট ও ভেরিফিকেশন ফর্ম</span>
            </h4>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white text-slate-600 border border-slate-200">
              TrxID ভেরিফিকেশন
            </span>
          </div>

          {/* Feedback messages */}
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

          <form onSubmit={onSubmit} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  আপনার পূর্ণ নাম (Member Name) *
                </label>
                <input
                  type="text"
                  required
                  list="deposit-members-datalist"
                  value={depositMemberName}
                  onChange={(e) => {
                    const name = e.target.value;
                    onChangeMemberName(name);
                    if (members && members.length > 0) {
                      const matched = findMemberInDirectory({ memberName: name }, members);
                      if (matched && matched.phone && !depositSenderPhone) {
                        onChangeSenderPhone(matched.phone);
                      }
                    }
                  }}
                  onBlur={() => {
                    if (depositMemberName.trim() && members && members.length > 0) {
                      const matched = findMemberInDirectory({ memberName: depositMemberName }, members);
                      if (matched && matched.phone && !depositSenderPhone) {
                        onChangeSenderPhone(matched.phone);
                      }
                    }
                  }}
                  placeholder="যেমন: মোহাম্মদ সাহেদ আলম"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition"
                />
                {members && members.length > 0 && (
                  <datalist id="deposit-members-datalist">
                    {members.map((m) => (
                      <option key={m.id} value={m.name}>
                        {m.name}{m.designation ? ` (${m.designation})` : ''}{m.phone ? ` - ${m.phone}` : ''}
                      </option>
                    ))}
                  </datalist>
                )}
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
                  onChange={(e) => onChangeAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="৫০০"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono font-bold bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  {currentMethod.name} TrxID (Transaction ID) *
                </label>
                <input
                  type="text"
                  required
                  value={depositTrxId}
                  onChange={(e) => onChangeTrxId(e.target.value)}
                  placeholder={currentMethod.placeholderTrx}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono font-bold uppercase bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  প্রেরক মোবাইল নম্বর (Sender Mobile)
                </label>
                <input
                  type="text"
                  value={depositSenderPhone}
                  onChange={(e) => onChangeSenderPhone(e.target.value)}
                  placeholder="018XXXXXXXX"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between pt-2 gap-3">
              <span className="text-[11px] text-slate-500">
                পেমেন্ট চ্যানেল: <strong className="text-slate-800">{currentMethod.name} ({currentMethod.nameEn})</strong>
              </span>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                {!isModal && (
                  <button
                    type="button"
                    onClick={() => onSelectGateway(null)}
                    className="px-3 py-2 border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl transition cursor-pointer"
                  >
                    বন্ধ করুন
                  </button>
                )}
                {isModal && (
                  <button
                    type="button"
                    onClick={() => onTogglePaymentModal(false)}
                    className="px-3 py-2 border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl transition cursor-pointer"
                  >
                    পপআপ বন্ধ
                  </button>
                )}
                <button
                  type="submit"
                  id="subscription-deposit-submit-btn"
                  className={`flex-1 sm:flex-none px-5 py-2 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer ${currentMethod.brandBg} hover:opacity-95`}
                >
                  <Check className="w-4 h-4" />
                  <span>{currentMethod.name} চাঁদা সাবমিট করুন</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* 2. PAYMENT GATEWAY / MONTHLY SUBSCRIPTION (বিকাশ, নগদ, রকেট পেমেন্ট গেটওয়ে) */}
      <div 
        id="subscription-payment-gateway-section"
        className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden"
      >
        {/* Header banner */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-4 sm:p-5 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold border border-emerald-500/30">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              <span>মাসিক চাঁদা পরিশোধ গেটওয়ে</span>
            </div>
            <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-amber-400" />
              অনলাইন চাঁদা ও অনুদান পরিশোধ (Payment Methods)
            </h3>
            <p className="text-xs text-slate-300">
              বিকাশ, নগদ বা রকেটে সংগঠনের তহবিলে চাঁদা পাঠিয়ে ট্রানজেকশন আইডি (TrxID) সাবমিট করুন।
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {/* Open in Popup Modal Trigger */}
            <button
              type="button"
              onClick={() => onTogglePaymentModal(true)}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-semibold text-slate-200 border border-white/15 flex items-center gap-1.5 cursor-pointer transition shadow-2xs"
              title="পপআপ উইন্ডোতে বড় করে দেখুন"
            >
              <Maximize2 className="w-3.5 h-3.5 text-amber-300" />
              <span>পপআপ ভিউ</span>
            </button>
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-500/10 text-emerald-300 text-xs font-semibold rounded-xl border border-emerald-500/20">
              <ShieldCheck className="w-3.5 h-3.5" />
              নিরাপদ পেমেন্ট
            </span>
          </div>
        </div>

        <div className="p-4 sm:p-6 space-y-5">
          {/* Top Clean Tab / Icon Layout (Compact clickable cards for each method) */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <span>পেমেন্ট মেথড নির্বাচন করুন:</span>
                <span className="text-[11px] font-normal text-slate-500">(যেকোনো একটিতে ক্লিক করুন)</span>
              </label>

              {selectedGateway && (
                <button
                  type="button"
                  onClick={() => onSelectGateway(null)}
                  className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer transition py-0.5 px-2 rounded-lg hover:bg-slate-100"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>নির্বাচন বাতিল (বন্ধ করুন)</span>
                </button>
              )}
            </div>

            {/* 3 Clickable Method Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {methods.map((method) => {
                const isSelected = selectedGateway === method.id;
                const LogoComponent = method.logo;

                return (
                  <button
                    key={method.id}
                    type="button"
                    id={method.btnId}
                    onClick={() => onSelectGateway(isSelected ? null : method.id)}
                    className={`p-3 sm:p-3.5 rounded-2xl border-2 transition-all duration-200 text-left flex items-center justify-between relative overflow-hidden cursor-pointer ${
                      isSelected
                        ? `${method.brandBorder} ${method.activeBg} shadow-sm ring-2 ${method.brandRing}`
                        : `border-slate-200 bg-white ${method.hoverBorder}`
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Brand Logo in stylized circle */}
                      <div className={`w-10 h-10 rounded-xl ${method.brandBg} text-white flex items-center justify-center flex-shrink-0 shadow-2xs`}>
                        <LogoComponent className="w-5 h-5" />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-sm text-slate-900 leading-tight">
                            {method.name}
                          </span>
                          <span className="text-[11px] text-slate-500 font-medium">
                            {method.nameEn}
                          </span>
                        </div>
                        <div className="text-[11px] font-mono text-slate-600 truncate mt-0.5">
                          {method.number || 'নম্বর যুক্ত নেই'}
                        </div>
                      </div>
                    </div>

                    {/* Selection Indicator */}
                    <div className="flex-shrink-0 ml-2">
                      {isSelected ? (
                        <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full ${method.brandBg} text-white text-[10px] font-bold shadow-2xs`}>
                          <Check className="w-2.5 h-2.5" />
                          <span>নির্বাচিত</span>
                        </span>
                      ) : (
                        <span className="w-5 h-5 rounded-full border border-slate-300 flex items-center justify-center text-slate-400 group-hover:border-slate-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* DEFAULT STATE: When no payment method is selected (Clean & Uncluttered) */}
          {!selectedGateway && (
            <div className="py-7 px-5 rounded-2xl bg-slate-50/80 border border-dashed border-slate-300 text-center flex flex-col items-center justify-center animate-fadeIn">
              <div className="w-11 h-11 rounded-2xl bg-white shadow-2xs border border-slate-200 flex items-center justify-center text-slate-600 mb-2">
                <CreditCard className="w-5 h-5 text-emerald-600" />
              </div>
              <h4 className="text-xs sm:text-sm font-bold text-slate-800">
                পেমেন্ট মেথড নির্বাচন করুন
              </h4>
              <p className="text-xs text-slate-500 mt-1 max-w-md leading-relaxed">
                মাসিক চাঁদা বা অনুদান পাঠাতে উপরের <strong>বিকাশ</strong>, <strong>নগদ</strong> অথবা <strong>রকেট</strong> কার্ডে ক্লিক করুন। নির্বাচিত মেথডের একাউন্ট নম্বর, নিয়মাবলী ও TrxID সাবমিট ফর্ম প্রদর্শিত হবে।
              </p>
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onTogglePaymentModal(true)}
                  className="px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 shadow-2xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Maximize2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>পপআপ উইন্ডো ওপেন করুন</span>
                </button>
              </div>
            </div>
          )}

          {/* DYNAMIC TOGGLE VIEW: Rendered ONLY when a payment method is selected */}
          {selectedGateway && renderMethodDetailContent(false)}
        </div>
      </div>

      {/* DEDICATED INTERACTIVE POPUP MODAL (When isPaymentModalOpen is true) */}
      {isPaymentModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full my-auto overflow-hidden animate-scaleUp">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-4 sm:p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white leading-tight">
                    অনলাইন চাঁদা পরিশোধ গেটওয়ে
                  </h3>
                  <p className="text-[11px] text-slate-300">
                    বিকাশ, নগদ বা রকেট নির্বাচন করে TrxID সাবমিট করুন
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onTogglePaymentModal(false)}
                className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer"
                title="পপআপ বন্ধ করুন"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 sm:p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Method Selection Tabs inside modal */}
              <div className="grid grid-cols-3 gap-2">
                {methods.map((method) => {
                  const isSelected = selectedGateway === method.id;
                  const LogoComponent = method.logo;

                  return (
                    <button
                      key={`modal-${method.id}`}
                      type="button"
                      onClick={() => onSelectGateway(method.id)}
                      className={`p-2.5 rounded-xl border-2 transition text-left flex flex-col justify-between cursor-pointer ${
                        isSelected
                          ? `${method.brandBorder} ${method.activeBg} ring-2 ${method.brandRing}`
                          : `border-slate-200 bg-white ${method.hoverBorder}`
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`w-6 h-6 rounded-lg ${method.brandBg} text-white flex items-center justify-center shadow-2xs`}>
                          <LogoComponent className="w-3.5 h-3.5" />
                        </span>
                        {isSelected && (
                          <span className={`w-2 h-2 rounded-full ${method.brandBg}`} />
                        )}
                      </div>
                      <div className="mt-1.5">
                        <div className="font-bold text-xs text-slate-900">{method.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono truncate">{method.number || 'অফলাইন'}</div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* If no method selected inside modal, default to bKash or show prompt */}
              {!selectedGateway ? (
                <div className="py-6 px-4 rounded-xl bg-slate-50 border border-dashed border-slate-300 text-center">
                  <p className="text-xs text-slate-600 mb-2">
                    উপরের বিকাশ, নগদ বা রকেট বাটনে ক্লিক করুন।
                  </p>
                  <button
                    type="button"
                    onClick={() => onSelectGateway('bkash')}
                    className="px-3.5 py-1.5 bg-[#D82360] text-white text-xs font-bold rounded-xl shadow-xs"
                  >
                    বিকাশ (bKash) নির্বাচন করুন
                  </button>
                </div>
              ) : (
                renderMethodDetailContent(true)
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
