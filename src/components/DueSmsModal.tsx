import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  MessageSquare, 
  Send, 
  Copy, 
  Check, 
  Calendar, 
  Phone, 
  CreditCard, 
  AlertCircle,
  Sparkles,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { PaymentGatewayConfig } from '../types';
import { 
  buildDirectSimSmsUrl, 
  triggerDirectSimSms, 
  generateDueReminderSms,
  sanitizePhoneForSms
} from '../utils/smsHelper';
import { toBengaliNumber } from '../utils/helpers';

const BENGALI_MONTHS = [
  'জানুয়ারি',
  'ফেব্রুয়ারি',
  'মার্চ',
  'এপ্রিল',
  'মে',
  'জুন',
  'জুলাই',
  'আগস্ট',
  'সেপ্টেম্বর',
  'অক্টোবর',
  'নভেম্বর',
  'ডিসেম্বর'
];

interface DueSmsModalProps {
  isOpen: boolean;
  onClose: () => void;
  target: {
    memberName: string;
    phone?: string;
    amount?: number;
    month?: string;
    memberId?: string;
  } | null;
  paymentConfig?: PaymentGatewayConfig;
  defaultMonthlyRate?: number;
}

export const DueSmsModal: React.FC<DueSmsModalProps> = ({
  isOpen,
  onClose,
  target,
  paymentConfig,
  defaultMonthlyRate = 250
}) => {
  if (!isOpen || !target) return null;

  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonths, setSelectedMonths] = useState<string[]>(() => {
    if (target.month && target.month !== 'চলতি মাস' && target.month !== 'চলতি') {
      const match = BENGALI_MONTHS.find(m => target.month?.includes(m));
      return match ? [match] : [];
    }
    // Default to current month
    const currentMonthIdx = new Date().getMonth();
    return [BENGALI_MONTHS[currentMonthIdx]];
  });

  const [useCustomMonthText, setUseCustomMonthText] = useState(false);
  const [customMonthText, setCustomMonthText] = useState('');
  
  const [phone, setPhone] = useState(target.phone || '');
  const [amount, setAmount] = useState<number>(() => {
    if (target.amount && target.amount > 0) return target.amount;
    return defaultMonthlyRate;
  });

  const defaultPaymentPhone = useMemo(() => {
    return paymentConfig?.bkashNumber || paymentConfig?.nagadNumber || paymentConfig?.rocketNumber || '';
  }, [paymentConfig]);

  const [paymentPhone, setPaymentPhone] = useState(defaultPaymentPhone);
  const [paymentMethodName, setPaymentMethodName] = useState('বিকাশ/নগদ');
  const [isCopied, setIsCopied] = useState(false);
  const [smsTriggered, setSmsTriggered] = useState(false);

  // Sync state when target changes
  useEffect(() => {
    if (target) {
      setPhone(target.phone || '');
      setSmsTriggered(false);
      setIsCopied(false);
      if (target.amount && target.amount > 0) {
        setAmount(target.amount);
      }
    }
  }, [target]);

  // Handle month selection toggle
  const toggleMonth = (month: string) => {
    setSelectedMonths(prev => {
      const next = prev.includes(month)
        ? prev.filter(m => m !== month)
        : [...prev, month];
      
      // Auto-update amount based on number of selected months if rate is applicable
      if (next.length > 0) {
        setAmount(next.length * defaultMonthlyRate);
      }
      return next;
    });
  };

  const handleSelectAllMonths = () => {
    setSelectedMonths([...BENGALI_MONTHS]);
    setAmount(BENGALI_MONTHS.length * defaultMonthlyRate);
  };

  const handleClearMonths = () => {
    setSelectedMonths([]);
  };

  // Compute final months text string
  const computedMonthsText = useMemo(() => {
    if (useCustomMonthText && customMonthText.trim()) {
      return customMonthText.trim();
    }
    if (selectedMonths.length === 0) {
      return `চলতি (${toBengaliNumber(selectedYear)})`;
    }
    const yearBangla = toBengaliNumber(selectedYear);
    if (selectedMonths.length === 12) {
      return `সমগ্র ${yearBangla} সাল`;
    }
    return `${selectedMonths.join(', ')} ${yearBangla}`;
  }, [selectedMonths, selectedYear, useCustomMonthText, customMonthText]);

  // Live generated SMS message
  const generatedSms = useMemo(() => {
    return generateDueReminderSms({
      memberName: target.memberName,
      amount,
      monthsText: computedMonthsText,
      paymentPhone: paymentPhone.trim(),
      paymentMethods: paymentMethodName
    });
  }, [target.memberName, amount, computedMonthsText, paymentPhone, paymentMethodName]);

  const directSmsUrl = useMemo(() => {
    return buildDirectSimSmsUrl(phone, generatedSms);
  }, [phone, generatedSms]);

  const handleSendSimSms = () => {
    const success = triggerDirectSimSms(phone, generatedSms);
    setSmsTriggered(true);
    setTimeout(() => setSmsTriggered(false), 5000);
  };

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(generatedSms);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 3000);
    } catch {
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = generatedSms;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 text-white p-4 sm:p-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center text-emerald-200 shadow-inner">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg leading-tight flex items-center gap-1.5">
                <span>বকেয়া চাঁদা রিমাইন্ডার SIM SMS</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-400 text-amber-950 text-[10px] font-black tracking-wide">
                  সরাসরি SIM
                </span>
              </h3>
              <p className="text-xs text-emerald-100/80 mt-0.5">
                সদস্যের নাম: <strong className="text-white font-bold">{target.memberName}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer"
            aria-label="বন্ধ করুন"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 text-slate-800">
          {/* Member & Phone inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                সদস্যের নাম
              </label>
              <input
                type="text"
                disabled
                value={target.memberName}
                className="w-full px-3 py-2 text-sm bg-slate-100 border border-slate-200 rounded-xl font-semibold text-slate-700"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1 flex items-center justify-between">
                <span>মোবাইল নম্বর (SMS প্রাপক)</span>
                {!phone && (
                  <span className="text-rose-600 text-[10px] font-bold">নম্বর দিন</span>
                )}
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="tel"
                  placeholder="01xxxxxxxxx"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl font-mono"
                />
              </div>
            </div>
          </div>

          {/* Custom Months Section */}
          <div className="bg-slate-50 p-3.5 sm:p-4 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-emerald-700" />
                বকেয়া মাসসমূহ নির্বাচন করুন (Custom Months)
              </span>

              <div className="flex items-center gap-2 text-xs">
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-bold text-slate-800 font-mono"
                >
                  <option value={currentYear}>{toBengaliNumber(currentYear)} সাল</option>
                  <option value={currentYear - 1}>{toBengaliNumber(currentYear - 1)} সাল</option>
                  <option value={currentYear + 1}>{toBengaliNumber(currentYear + 1)} সাল</option>
                </select>

                <button
                  type="button"
                  onClick={() => setUseCustomMonthText(!useCustomMonthText)}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer"
                >
                  {useCustomMonthText ? 'মাস তালিকা দেখুন' : 'কাস্টম টেক্সট লিখুন'}
                </button>
              </div>
            </div>

            {useCustomMonthText ? (
              <div>
                <input
                  type="text"
                  placeholder="যেমন: জানুয়ারি ও ফেব্রুয়ারি ২০২৬ অথবা ৩ মাসের বকেয়া"
                  value={customMonthText}
                  onChange={(e) => setCustomMonthText(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-emerald-300 rounded-xl focus:ring-1 focus:ring-emerald-500 font-medium"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  এখানে আপনার ইচ্ছামতো যে কোনো কাস্টম মাসের বিবরণ সরাসরি লিখতে পারেন।
                </p>
              </div>
            ) : (
              <div>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                  {BENGALI_MONTHS.map((m) => {
                    const isSelected = selectedMonths.includes(m);
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => toggleMonth(m)}
                        className={`px-2 py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer border ${
                          isSelected
                            ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                        }`}
                      >
                        <span>{m}</span>
                        {isSelected && <Check className="w-3 h-3 text-white flex-shrink-0 ml-1" />}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200/80 text-xs">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSelectAllMonths}
                      className="text-[11px] font-bold text-emerald-700 hover:underline"
                    >
                      সব মাস সিলেক্ট
                    </button>
                    <span className="text-slate-300">•</span>
                    <button
                      type="button"
                      onClick={handleClearMonths}
                      className="text-[11px] font-bold text-slate-500 hover:text-slate-700 hover:underline"
                    >
                      ক্লিয়ার
                    </button>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-600">
                    নির্বাচিত: <strong className="text-emerald-800 font-bold">{toBengaliNumber(selectedMonths.length)}</strong> টি মাস
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Amount & Payment Gateway Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                বকেয়া মোট টাকা (৳)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl font-mono font-bold text-emerald-800"
                />
                <span className="absolute right-3 top-2 text-xs font-bold text-slate-400">টাকা</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                চাঁদা পাঠানোর নম্বর (বিকাশ/নগদ)
              </label>
              <input
                type="text"
                placeholder="01xxxxxxxxx (বিকাশ/নগদ পার্সোনাল)"
                value={paymentPhone}
                onChange={(e) => setPaymentPhone(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl font-mono"
              />
            </div>
          </div>

          {/* Live SMS Preview Box */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                সরাসরি SIM SMS প্রিভিউ (Live Preview)
              </span>
              <span className="text-[11px] font-mono text-slate-500">
                দৈর্ঘ্য: {toBengaliNumber(generatedSms.length)} অক্ষর
              </span>
            </div>

            <div className="bg-gradient-to-br from-emerald-50 to-teal-50/70 p-3.5 rounded-2xl border border-emerald-200 text-xs font-medium text-slate-800 whitespace-pre-wrap leading-relaxed shadow-inner">
              {generatedSms}
            </div>
          </div>

          {/* Status Feedback banner if triggered */}
          {smsTriggered && (
            <div className="p-3 bg-emerald-100/90 text-emerald-900 border border-emerald-300 rounded-2xl text-xs font-bold flex items-center justify-between gap-2 animate-fadeIn">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                <span>আপনার মোবাইল ডিভাইসের মেসেজ অ্যাপ ওপেন হচ্ছে...</span>
              </div>
              <a
                href={directSmsUrl}
                className="px-2.5 py-1 bg-emerald-700 text-white rounded-lg text-[11px] font-bold hover:bg-emerald-800 transition flex items-center gap-1"
              >
                <span>সরাসরি লিঙ্ক</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleCopyMessage}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
          >
            {isCopied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700">মেসেজ কপি হয়েছে!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-500" />
                <span>মেসেজ কপি করুন</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-200 text-xs font-bold transition cursor-pointer"
            >
              বাতিল
            </button>
            <button
              type="button"
              onClick={handleSendSimSms}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-extrabold shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <Send className="w-4 h-4" />
              <span>সরাসরি SIM থেকে SMS পাঠান</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
