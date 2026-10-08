import React, { useState } from 'react';
import { 
  HelpCircle, 
  Phone, 
  Send, 
  CheckCircle2, 
  Clock, 
  User, 
  AlertCircle, 
  Copy, 
  Check, 
  PlusCircle, 
  X,
  HeartHandshake
} from 'lucide-react';
import { SupportReportItem, OrganizationProfile } from '../types';
import { sanitizePhone } from '../utils/helpers';

interface SupportScreenProps {
  reports: SupportReportItem[];
  profile: OrganizationProfile;
  onAddReport: (report: Omit<SupportReportItem, 'id'>) => Promise<SupportReportItem>;
  isAdmin: boolean;
  onBack: () => void;
}

export const SupportScreen: React.FC<SupportScreenProps> = ({
  reports,
  profile,
  onAddReport,
  isAdmin,
  onBack
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formSubject, setFormSubject] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formType, setFormType] = useState('চিকিৎসা সহায়তা');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleCopyPhone = (phone: string) => {
    navigator.clipboard.writeText(phone);
    setCopiedPhone(phone);
    setTimeout(() => setCopiedPhone(null), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formPhone.trim() || !formDescription.trim()) {
      setFormError('আপনার নাম, ফোন নম্বর ও বিস্তারিত কারণ লিখুন');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    try {
      await onAddReport({
        name: formName.trim(),
        phone: formPhone.trim(),
        subject: formSubject.trim() || formType,
        description: formDescription.trim(),
        designation: 'আবেদনকারী',
        type: formType,
        status: 'pending',
        createdAt: new Date().toISOString().split('T')[0]
      });
      setIsModalOpen(false);
      setSubmitSuccess(true);
      setFormName('');
      setFormPhone('');
      setFormSubject('');
      setFormDescription('');
      setTimeout(() => setSubmitSuccess(false), 4000);
    } catch {
      setFormError('আবেদন জমা দিতে সমস্যা হয়েছে');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 sm:pb-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 rounded-3xl p-5 sm:p-6 text-white shadow-lg space-y-3">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <HelpCircle className="w-6 h-6 text-teal-300" />
              <h2 className="text-xl sm:text-2xl font-black">
                সহায়তা কেন্দ্র ও হেল্পডেস্ক
              </h2>
            </div>
            <p className="text-xs text-teal-100 mt-1 max-w-xl">
              চিকিৎসা ফান্ড আবেদন, ত্রাণ সহায়তা, নতুন সদস্য অন্তর্ভুক্তি বা যেকোনো জরুরি সেবায় সরাসরি দায়িত্বশীলদের সাথে কথা বলুন
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white text-emerald-950 font-bold text-xs shadow-md hover:bg-emerald-50 transition cursor-pointer active:scale-95"
          >
            <PlusCircle className="w-4 h-4 text-emerald-700" />
            <span>সাহায্যের আবেদন জমা দিন</span>
          </button>
        </div>
      </div>

      {submitSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
          <span>আপনার আবেদনটি সফলভাবে গৃহীত হয়েছে। আমাদের দায়িত্বশীল টিম শীঘ্রই আপনার সাথে যোগাযোগ করবে।</span>
        </div>
      )}

      {/* Coordinators Hotline Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {reports.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition flex flex-col justify-between space-y-3"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  {item.type}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  item.status === 'active' 
                    ? 'bg-blue-100 text-blue-800' 
                    : item.status === 'resolved' 
                      ? 'bg-emerald-100 text-emerald-800' 
                      : 'bg-amber-100 text-amber-800'
                }`}>
                  {item.status === 'active' ? 'দায়িত্বপ্রাপ্ত' : item.status === 'resolved' ? 'নিষ্পন্ন' : 'বিবেচনাধীন'}
                </span>
              </div>

              <h3 className="text-sm font-bold text-slate-900">
                {item.name}
              </h3>
              <div className="text-xs text-emerald-700 font-semibold mt-0.5">
                {item.designation}
              </div>

              <div className="mt-2 text-xs text-slate-600 font-medium">
                বিষয়: {item.subject}
              </div>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-3">
                {item.description}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-slate-800">
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                <span>{item.phone}</span>
                <button
                  onClick={() => handleCopyPhone(item.phone)}
                  className="text-slate-400 hover:text-slate-600 p-0.5"
                  title="কপি"
                >
                  {copiedPhone === item.phone ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              <a
                href={`tel:${sanitizePhone(item.phone)}`}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition shadow-xs"
              >
                <Phone className="w-3 h-3" />
                <span>সরাসরি কল</span>
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Submit Support Request Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 my-8 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <HeartHandshake className="w-5 h-5 text-emerald-700" />
                <span>সাহায্য বা সহায়তার আবেদন</span>
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  আপনার নাম <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="আপনার পুরো নাম"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
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
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">সহায়তার ধরন</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="চিকিৎসা সহায়তা">চিকিৎসা সহায়তা</option>
                    <option value="ত্রাণ ও খাদ্য সহায়তা">ত্রাণ ও খাদ্য সহায়তা</option>
                    <option value="রক্তদান বিষয়ক">রক্তদান বিষয়ক</option>
                    <option value="শিক্ষা সহায়তা">শিক্ষা সহায়তা</option>
                    <option value="অন্যান্য">অন্যান্য</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">বিষয় / সমস্যা সংক্ষেপে</label>
                <input
                  type="text"
                  value={formSubject}
                  onChange={(e) => setFormSubject(e.target.value)}
                  placeholder="যেমন: রোগীর জরুরি ঔষধ সহায়তার আবেদন"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  বিস্তারিত বিবরণ ও ঠিকানা <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="সমস্যার পূর্ণ বিবরণ ও আপনার সঠিক বর্তমান ঠিকানা লিখুন..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold shadow"
                >
                  {isSubmitting ? 'জমা হচ্ছে...' : 'আবেদন জমা দিন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
