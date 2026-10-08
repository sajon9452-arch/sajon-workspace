import React, { useState } from 'react';
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
  HelpCircle,
  ArrowRight
} from 'lucide-react';
import { PaymentGatewayConfig, Member } from '../types';

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
  members?: Member[];
  onDepositSuccess?: (rec: { memberName: string; amount: number; trxId: string }) => void;
}

export const PaymentGatewaySection: React.FC<PaymentGatewaySectionProps> = ({
  paymentConfig,
  members = [],
  onDepositSuccess
}) => {
  const [selectedGateway, setSelectedGateway] = useState<'bkash' | 'nagad' | 'rocket'>('bkash');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);

  // Form states
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [memberName, setMemberName] = useState('');
  const [amount, setAmount] = useState<number | ''>(500);
  const [trxId, setTrxId] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const methods = [
    {
      id: 'bkash' as const,
      name: 'বিকাশ',
      nameEn: 'bKash',
      number: paymentConfig.bkashNumber,
      type: paymentConfig.bkashType || 'Personal',
      instructions: paymentConfig.bkashInstructions || 'আপনার বিকাশ অ্যাপ থেকে সেন্ড মানি (Send Money) করে ট্রানজেকশন আইডি (TrxID) নিচে প্রদান করুন।',
      brandBg: 'bg-[#D82360]',
      brandText: 'text-[#D82360]',
      brandBorder: 'border-[#D82360]',
      logo: BkashLogo
    },
    {
      id: 'nagad' as const,
      name: 'নগদ',
      nameEn: 'Nagad',
      number: paymentConfig.nagadNumber,
      type: paymentConfig.nagadType || 'Personal',
      instructions: paymentConfig.nagadInstructions || 'নগদ অ্যাপ থেকে সেন্ড মানি করে TrxID ও প্রেরক নম্বর নিচে এন্ট্রি করুন।',
      brandBg: 'bg-[#EA1D25]',
      brandText: 'text-[#EA1D25]',
      brandBorder: 'border-[#EA1D25]',
      logo: NagadLogo
    },
    {
      id: 'rocket' as const,
      name: 'রকেট',
      nameEn: 'Rocket',
      number: paymentConfig.rocketNumber,
      type: paymentConfig.rocketType || 'Personal',
      instructions: paymentConfig.rocketInstructions || 'রকেট অ্যাপ থেকে সেন্ড মানি করে ট্রানজেকশন রেফারেন্স নিশ্চিত করুন।',
      brandBg: 'bg-[#8C3494]',
      brandText: 'text-[#8C3494]',
      brandBorder: 'border-[#8C3494]',
      logo: RocketLogo
    }
  ];

  const currentMethod = methods.find(m => m.id === selectedGateway) || methods[0];

  const handleCopy = (num: string, label: string) => {
    navigator.clipboard.writeText(num);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleMemberChange = (id: string) => {
    setSelectedMemberId(id);
    const m = members.find(mem => mem.id === id);
    if (m) {
      setMemberName(m.name);
      setSenderPhone(m.phone || '');
    } else {
      setMemberName('');
      setSenderPhone('');
    }
  };

  const handleSubmitDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberName.trim()) {
      setErrorMsg('সদস্যের নাম নির্বাচন করুন');
      return;
    }
    if (!trxId.trim()) {
      setErrorMsg('সঠিক ট্রানজেকশন আইডি (TrxID) লিখুন');
      return;
    }
    if (amount === '' || Number(amount) <= 0) {
      setErrorMsg('সঠিক টাকার পরিমাণ লিখুন');
      return;
    }

    setSuccessMsg('আপনার ট্রানজেকশন আইডি সফলভাবে জমা হয়েছে! অ্যাডমিন যাচাই করে অনুমোদন করবেন।');
    setErrorMsg('');
    if (onDepositSuccess) {
      onDepositSuccess({ memberName, amount: Number(amount), trxId: trxId.trim() });
    }
    setTimeout(() => {
      setSuccessMsg('');
      setIsSubmitModalOpen(false);
      setTrxId('');
    }, 2500);
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 rounded-3xl p-5 sm:p-6 text-white shadow-xl space-y-5 border border-slate-700">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <div className="flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-amber-400" />
            <h3 className="text-base sm:text-lg font-bold">
              ডিজিটাল পেমেন্ট গেটওয়ে
            </h3>
          </div>
          <p className="text-xs text-slate-300 mt-0.5">
            বিকাশ, নগদ ও রকেটের মাধ্যমে সংগঠনের অ্যাকাউন্টে সরাসরি মাসিক চাঁদা প্রদান করুন
          </p>
        </div>

        <button
          onClick={() => setIsSubmitModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black shadow transition cursor-pointer active:scale-95"
        >
          <Send className="w-3.5 h-3.5" />
          <span>পেমেন্ট TrxID সাবমিট করুন</span>
        </button>
      </div>

      {/* Gateway selector tabs */}
      <div className="grid grid-cols-3 gap-2.5">
        {methods.map((method) => {
          const isSelected = selectedGateway === method.id;
          const LogoComp = method.logo;

          return (
            <button
              key={method.id}
              onClick={() => setSelectedGateway(method.id)}
              className={`p-3 rounded-2xl border transition text-left cursor-pointer flex flex-col justify-between space-y-2 ${
                isSelected
                  ? 'bg-white/15 border-amber-400 ring-2 ring-amber-400/20'
                  : 'bg-white/5 border-white/10 hover:bg-white/10'
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold">{method.name}</span>
                <LogoComp className="w-5 h-5 text-white" />
              </div>
              <div className="text-[10px] text-slate-300 font-mono">
                {method.type}
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Gateway Detailed Panel */}
      <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-amber-300">
              {currentMethod.name} ({currentMethod.nameEn}) নম্বর:
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white font-medium">
              {currentMethod.type}
            </span>
          </div>

          <div className="flex items-center gap-3 mt-1.5 font-mono text-lg sm:text-xl font-black text-white tracking-wider">
            <span>{currentMethod.number}</span>
            <button
              onClick={() => handleCopy(currentMethod.number, currentMethod.id)}
              className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white transition cursor-pointer"
              title="নম্বর কপি করুন"
            >
              {copiedField === currentMethod.id ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
            {copiedField === currentMethod.id && (
              <span className="text-[10px] text-emerald-400 font-sans font-bold">
                কপি হয়েছে!
              </span>
            )}
          </div>

          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            {currentMethod.instructions}
          </p>
        </div>

        <button
          onClick={() => setIsSubmitModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow transition cursor-pointer whitespace-nowrap active:scale-95"
        >
          <span>TrxID যাচাই করুন</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Deposit Submission Modal */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-slate-800 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Send className="w-5 h-5 text-emerald-700" />
                <span>পেমেন্ট ভেরিফিকেশন আবেদন</span>
              </h3>
              <button onClick={() => setIsSubmitModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {successMsg && (
              <div className="p-3 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmitDeposit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  সদস্য নির্বাচন করুন <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedMemberId}
                  onChange={(e) => handleMemberChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                >
                  <option value="">-- সদস্য নির্বাচন করুন --</option>
                  {members.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.designation})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">সদস্যের নাম</label>
                  <input
                    type="text"
                    required
                    value={memberName}
                    onChange={(e) => setMemberName(e.target.value)}
                    placeholder="সদস্যের নাম"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">প্রেরকের মোবাইল</label>
                  <input
                    type="tel"
                    value={senderPhone}
                    onChange={(e) => setSenderPhone(e.target.value)}
                    placeholder="01711000000"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    টাকার পরিমাণ (৳) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">গেটওয়ে</label>
                  <select
                    value={selectedGateway}
                    onChange={(e) => setSelectedGateway(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold"
                  >
                    <option value="bkash">বিকাশ (bKash)</option>
                    <option value="nagad">নগদ (Nagad)</option>
                    <option value="rocket">রকেট (Rocket)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  ট্রানজেকশন আইডি (TrxID) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={trxId}
                  onChange={(e) => setTrxId(e.target.value)}
                  placeholder="যেমন: BKL9X87ZQ2"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono font-bold uppercase tracking-wider text-emerald-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold shadow"
                >
                  জমা দিন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
