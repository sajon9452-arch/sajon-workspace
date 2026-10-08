import React, { useState } from 'react';
import { 
  BellRing, 
  PlusCircle, 
  FileText, 
  Calendar, 
  User, 
  Copy, 
  Check, 
  Trash2, 
  X, 
  AlertCircle,
  Share2,
  Sparkles
} from 'lucide-react';
import { Notice } from '../types';
import { generateExecutiveMeetingNotice, generateGeneralMeetingNotice } from '../utils/noticeTemplates';

interface NoticeScreenProps {
  notices: Notice[];
  onAddNotice: (notice: Omit<Notice, 'id'>) => Promise<Notice>;
  onDeleteNotice: (id: string) => Promise<void>;
  isAdmin: boolean;
  onBack: () => void;
}

export const NoticeScreen: React.FC<NoticeScreenProps> = ({
  notices,
  onAddNotice,
  onDeleteNotice,
  isAdmin,
  onBack
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isMeetingTemplateOpen, setIsMeetingTemplateOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form states
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formCategory, setFormCategory] = useState('সাধারণ নোটিশ');
  const [formAuthor, setFormAuthor] = useState('সাধারণ সম্পাদক');
  const [formIsUrgent, setFormIsUrgent] = useState(false);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Meeting generator states
  const [meetingType, setMeetingType] = useState<'executive' | 'general'>('executive');
  const [meetingDate, setMeetingDate] = useState('আগামী শুক্রবার, সন্ধ্যা ৭:০০ ঘটিকা');
  const [meetingTime, setMeetingTime] = useState('সন্ধ্যা ৭:০০ ঘটিকা');
  const [meetingLocation, setMeetingLocation] = useState('সংগঠনের অস্থায়ী কার্যালয়, পতেঙ্গা, চট্টগ্রাম');
  const [meetingAgenda, setMeetingAgenda] = useState('মাসিক চাঁদা ও ফান্ড পর্যালোচনা এবং রমজান খাদ্য সহায়তা কর্মসূচি');
  const [meetingContact, setMeetingContact] = useState('01886122678');

  const handleCopyNotice = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleCreateMeetingNotice = () => {
    const text = meetingType === 'executive'
      ? generateExecutiveMeetingNotice({
          date: meetingDate,
          time: meetingTime,
          location: meetingLocation,
          agenda: meetingAgenda,
          contactNumber: meetingContact
        })
      : generateGeneralMeetingNotice({
          date: meetingDate,
          time: meetingTime,
          location: meetingLocation,
          agenda: meetingAgenda,
          contactNumber: meetingContact
        });

    setFormTitle(meetingType === 'executive' ? 'কার্যকরী কমিটির জরুরি সভা আহ্বান' : 'সাধারণ সদস্যদের মাসিক সভা');
    setFormContent(text);
    setFormCategory(meetingType === 'executive' ? 'কার্যকরী কমিটির মিটিং' : 'সাধারণ সভা');
    setFormAuthor('সাধারণ সম্পাদক');
    setFormIsUrgent(meetingType === 'executive');
    setIsMeetingTemplateOpen(false);
    setIsAddModalOpen(true);
  };

  const handleSubmitNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formContent.trim()) {
      setFormError('নোটিশের শিরোনাম ও বিস্তারিত বিবরণ লিখুন');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    try {
      await onAddNotice({
        title: formTitle.trim(),
        content: formContent.trim(),
        category: formCategory.trim(),
        author: formAuthor.trim(),
        date: new Date().toISOString().split('T')[0],
        isUrgent: formIsUrgent,
        priority: formIsUrgent ? 'urgent' : 'normal'
      });
      setIsAddModalOpen(false);
      setFormTitle('');
      setFormContent('');
    } catch {
      setFormError('নোটিশ প্রকাশে সমস্যা হয়েছে');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 sm:pb-8">
      {/* Header */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BellRing className="w-6 h-6 text-amber-600" />
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">
              অফিশিয়াল নোটিশ বোর্ড
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            সংগঠনের সভা, জরুরি বার্তা, ত্রাণ কার্যক্রম ও আনুষ্ঠানিক ঘোষণাসমূহ
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsMeetingTemplateOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow transition cursor-pointer active:scale-95"
          >
            <Sparkles className="w-4 h-4" />
            <span>মিটিং নোটিশ তৈরি</span>
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow transition cursor-pointer active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>নতুন নোটিশ</span>
          </button>
        </div>
      </div>

      {/* Notices List */}
      <div className="space-y-4">
        {notices.map((notice) => (
          <div
            key={notice.id}
            className={`bg-white rounded-3xl p-5 border transition shadow-xs hover:shadow-md space-y-3 ${
              notice.isUrgent 
                ? 'border-amber-300 ring-2 ring-amber-500/10' 
                : 'border-slate-200'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  {notice.isUrgent && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                      জরুরি
                    </span>
                  )}
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    {notice.category}
                  </span>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {notice.date}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-1.5">
                  {notice.title}
                </h3>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleCopyNotice(`${notice.title}\n\n${notice.content}`, notice.id)}
                  className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition cursor-pointer"
                  title="নোটিশ কপি করুন"
                >
                  {copiedId === notice.id ? (
                    <Check className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
                {isAdmin && (
                  <button
                    onClick={() => {
                      if (confirm(`আপনি কি "${notice.title}" নোটিশটি মুছে ফেলতে চান?`)) {
                        onDeleteNotice(notice.id);
                      }
                    }}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                    title="মুছে ফেলুন"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-700 whitespace-pre-line leading-relaxed">
              {notice.content}
            </p>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1.5 font-medium">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>প্রকাশক: {notice.author || 'সাধারণ সম্পাদক'}</span>
              </span>

              {copiedId === notice.id && (
                <span className="text-[11px] font-bold text-emerald-600">
                  ক্লিপবোর্ডে কপি করা হয়েছে!
                </span>
              )}
            </div>
          </div>
        ))}

        {notices.length === 0 && (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
            <BellRing className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <h4 className="font-bold text-slate-700">কোনো নোটিশ নেই</h4>
          </div>
        )}
      </div>

      {/* Dynamic Meeting Notice Generator Modal */}
      {isMeetingTemplateOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 my-8 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <span>স্বয়ংক্রিয় মিটিং নোটিশ তৈরি</span>
              </h3>
              <button onClick={() => setIsMeetingTemplateOpen(false)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">মিটিংয়ের ধরন</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMeetingType('executive')}
                    className={`py-2 rounded-xl font-bold transition ${
                      meetingType === 'executive' ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    কার্যকরী কমিটির মিটিং
                  </button>
                  <button
                    type="button"
                    onClick={() => setMeetingType('general')}
                    className={`py-2 rounded-xl font-bold transition ${
                      meetingType === 'general' ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    সাধারণ সদস্যদের সভা
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">তারিখ ও সময়</label>
                <input
                  type="text"
                  value={meetingDate}
                  onChange={(e) => setMeetingDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">স্থান</label>
                <input
                  type="text"
                  value={meetingLocation}
                  onChange={(e) => setMeetingLocation(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">প্রধান আলোচ্য বিষয়</label>
                <textarea
                  rows={2}
                  value={meetingAgenda}
                  onChange={(e) => setMeetingAgenda(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">যোগাযোগের নম্বর</label>
                <input
                  type="text"
                  value={meetingContact}
                  onChange={(e) => setMeetingContact(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsMeetingTemplateOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100"
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  onClick={handleCreateMeetingNotice}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold shadow"
                >
                  নোটিশ রূপান্তর করুন
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Notice Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 my-8 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-emerald-700" />
                <span>নতুন নোটিশ প্রকাশ</span>
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitNotice} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  নোটিশের শিরোনাম <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="যেমন: মাসিক কার্যকরী সভার সময় পরিবর্তন"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">ক্যাটাগরি</label>
                  <input
                    type="text"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    placeholder="মিটিং / সাধারণ নোটিশ"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">প্রকাশকের নাম/পদবি</label>
                  <input
                    type="text"
                    value={formAuthor}
                    onChange={(e) => setFormAuthor(e.target.value)}
                    placeholder="সাধারণ সম্পাদক"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  নোটিশের বিস্তারিত বিবরণ <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={5}
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder="নোটিশের পূর্ণাঙ্গ বার্তা লিখুন..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl bg-slate-50 border border-slate-200">
                <input
                  type="checkbox"
                  checked={formIsUrgent}
                  onChange={(e) => setFormIsUrgent(e.target.checked)}
                  className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500"
                />
                <span className="font-bold text-rose-700">জরুরি নোটিশ হিসেবে চিহ্নিত করুন</span>
              </label>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold shadow"
                >
                  {isSubmitting ? 'প্রকাশ হচ্ছে...' : 'প্রকাশ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
