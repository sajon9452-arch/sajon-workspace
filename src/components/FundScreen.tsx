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
  Filter,
  ShieldCheck,
  Lock
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
  paymentConfig: PaymentGatewayConfig;
  isAdmin?: boolean;
  onBack?: () => void;
}

export const FundScreen: React.FC<FundScreenProps> = ({
  fundRecords,
  members,
  manualTotalBalance,
  paymentConfig,
  isAdmin
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | PaymentStatus>('all');
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);
  const [smsSentNotice, setSmsSentNotice] = useState<string | null>(null);

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

  const totalDue = useMemo(() => {
    return effectiveFundRecords
      .filter(f => f.status === 'Due')
      .reduce((sum, f) => sum + (Number(f.amount) || 0), 0);
  }, [effectiveFundRecords]);

  // Rule 3: Current Net Balance is strictly manualTotalBalance (never auto-calculated from entries)
  const netBalance = manualTotalBalance !== null ? manualTotalBalance : 0;

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

  return (
    <div className="space-y-6 pb-20 sm:pb-8">
      {/* 1. Header & Summary Bar (No manual entry or delete buttons; auto-synced) */}
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
                    তহবিল ও চাঁদা ডিরেক্টরি
                  </h2>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    স্বয়ংক্রিয় সিঙ্ক সক্রিয়
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  সদস্য তালিকা থেকে স্বয়ংক্রিয়ভাবে সিঙ্ক হওয়া চাঁদা আদায় ও বকেয়া হিসাবের স্বচ্ছ তালিকা
                </p>
              </div>
            </div>
          </div>

          {isAdmin ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold">
              <ShieldCheck className="w-4 h-4 text-amber-600" />
              <span>স্ট্যাটাস ও ব্যালেন্স পরিবর্তনের জন্য অ্যাডমিন প্যানেলে যান</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-600 text-xs font-medium">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>পাবলিক ভিউ: শুধুমাত্র প্রদর্শনযোগ্য</span>
            </div>
          )}
        </div>

        {/* Live Balance Summary Cards (Net balance strictly manual) */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
          <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-100">
            <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>মোট আদায়কৃত চাঁদা</span>
            </span>
            <div className="text-xl sm:text-2xl font-black text-emerald-900 mt-1">
              {formatBengaliCurrency(totalIncome)}
            </div>
            <span className="text-[11px] text-emerald-700 mt-1 block">
              পরিশোধকারী সদস্য: {toBengaliNumber(effectiveFundRecords.filter(f => f.status === 'Paid').length)} জন
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

          <div className="col-span-2 lg:col-span-1 p-4 rounded-2xl bg-gradient-to-br from-teal-900 to-emerald-950 text-white relative flex flex-col justify-between shadow-sm">
            <div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-teal-200">বর্তমান নেট ব্যালেন্স</span>
                <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full text-teal-100 font-medium">
                  অফিসিয়াল
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-black mt-1 text-white">
                {formatBengaliCurrency(netBalance)}
              </div>
            </div>
            <span className="text-[10px] text-teal-200/80 mt-2 block">
              সংগঠনের অনুমোদিত মূল তহবিল স্থিতি
            </span>
          </div>
        </div>
      </div>

      {smsSentNotice && (
        <div className="p-3.5 rounded-2xl bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            <span>{smsSentNotice}</span>
          </div>
        </div>
      )}

      {/* 2. Search & Status Filter */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="সদস্যের নাম, মোবাইল নম্বর বা মাস দিয়ে খুঁজুন..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

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
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
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
            <Clock className="w-3.5 h-3.5 text-amber-300" />
            <span>বকেয়া ({toBengaliNumber(effectiveFundRecords.filter(f => f.status === 'Due').length)})</span>
          </button>
        </div>
      </div>

      {/* 3. Automatic Subscriptions Table (Strictly Edit-Only for Status, No Manual Entry or Delete) */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                <th className="p-3.5 sm:p-4">সদস্যের নাম ও পদবি</th>
                <th className="p-3.5 sm:p-4">মোবাইল নম্বর</th>
                <th className="p-3.5 sm:p-4">মাস ও তারিখ</th>
                <th className="p-3.5 sm:p-4">চাঁদার পরিমাণ</th>
                <th className="p-3.5 sm:p-4 text-center">পরিশোধের স্ট্যাটাস</th>
                <th className="p-3.5 sm:p-4 text-right">রসিদ / SMS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.map((record) => {
                const isPaid = record.status === 'Paid';
                const isDue = record.status === 'Due';

                return (
                  <tr key={record.id} className="hover:bg-slate-50/70 transition">
                    <td className="p-3.5 sm:p-4 font-bold text-slate-900">
                      <div>{record.memberName}</div>
                      <div className="text-[11px] text-slate-500 font-normal mt-0.5">
                        {record.notes || record.description || 'নিয়মিত চাঁদা'}
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
                            className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
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
                      <span className={`font-black text-sm ${isPaid ? 'text-emerald-700' : 'text-amber-600'}`}>
                        {formatBengaliCurrency(record.amount)}
                      </span>
                    </td>

                    {/* Payment Status: Purely read-only badge in public Fund view */}
                    <td className="p-3.5 sm:p-4 text-center">
                      <span
                        className={`px-3 py-1 rounded-full text-[11px] font-bold inline-flex items-center gap-1 cursor-default select-none shadow-2xs ${
                          isPaid
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {isPaid ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>পরিশোধিত</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            <span>বকেয়া</span>
                          </>
                        )}
                      </span>
                    </td>

                    {/* Receipt / SMS Action only (No Edit, No Delete) */}
                    <td className="p-3.5 sm:p-4 text-right">
                      {record.phone && (
                        <button
                          onClick={() => handleSendSms(record)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 transition cursor-pointer font-bold text-[11px]"
                          title="SMS রসিদ কপি / পাঠান"
                        >
                          <Send className="w-3 h-3 text-emerald-600" />
                          <span>মেসেজ</span>
                        </button>
                      )}
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
            <p className="font-bold text-slate-700">কোনো চাঁদা রেকর্ড পাওয়া যায়নি</p>
            <p className="text-xs text-slate-400 mt-0.5">সদস্য তালিকা থেকে নতুন সদস্য যুক্ত হলে তা স্বয়ংক্রিয়ভাবে এখানে প্রদর্শিত হবে</p>
          </div>
        )}
      </div>

      {/* 4. Digital Payment Gateway Section (Official bKash, Nagad, Rocket) */}
      <PaymentGatewaySection 
        paymentConfig={paymentConfig} 
        members={members} 
      />
    </div>
  );
};
