import React, { useState, useMemo } from 'react';
import { 
  BellRing, 
  Calendar, 
  Plus, 
  ArrowLeft, 
  Pin, 
  Megaphone, 
  CheckCircle2, 
  Tag, 
  Clock, 
  Sparkles, 
  Edit2, 
  Trash2, 
  X,
  Users,
  Copy,
  Check,
  Share2,
  Send
} from 'lucide-react';
import { Notice, Member } from '../types';
import { formatBengaliDate, toBengaliNumber } from '../utils/helpers';
import { 
  MeetingFields, 
  DEFAULT_MEETING_FIELDS,
  generateExecutiveMeetingNotice, 
  generateJointMeetingNotice,
  formatBengaliMeetingDate,
  getBengaliDayFromDate
} from '../utils/noticeTemplates';
import { MeetingNoticeForm } from './MeetingNoticeForm';
import { BulkMeetingSmsModal } from './BulkMeetingSmsModal';

interface NoticeScreenProps {
  notices: Notice[];
  members?: Member[];
  onAddNotice: (notice: Omit<Notice, 'id'>) => void;
  onEditNotice?: (notice: Notice) => void;
  onDeleteNotice?: (id: string) => void;
  isAdmin?: boolean;
  onBack: () => void;
}

export const NoticeScreen: React.FC<NoticeScreenProps> = ({
  notices,
  members = [],
  onAddNotice,
  onEditNotice,
  onDeleteNotice,
  isAdmin = false,
  onBack,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null);
  const [noticeText, setNoticeText] = useState('');
  const [noticeDate, setNoticeDate] = useState(new Date().toISOString().split('T')[0]);
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeCategory, setNoticeCategory] = useState<
    'কার্যকরী কমিটির মিটিং' | 'কার্যকরী কমিটি ও সাধারণ সদস্য উভয়ের মিটিং' | 'জরুরি' | 'সাধারণ' | 'কার্যক্রম' | 'রক্তদান' | string
  >('কার্যকরী কমিটির মিটিং');
  const [isPinned, setIsPinned] = useState(false);
  const [formError, setFormError] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Bulk Meeting SMS Modal State
  const [bulkSmsData, setBulkSmsData] = useState<{
    isOpen: boolean;
    meetingType: string;
    noticeText: string;
    noticeTitle?: string;
  }>({
    isOpen: false,
    meetingType: 'কার্যকরী কমিটির মিটিং',
    noticeText: '',
    noticeTitle: ''
  });

  const handleOpenBulkSms = (type: string, text: string, title?: string) => {
    setBulkSmsData({
      isOpen: true,
      meetingType: type || 'কার্যকরী কমিটির মিটিং',
      noticeText: text,
      noticeTitle: title
    });
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Dynamic Meeting Form Fields State
  const [meetingFields, setMeetingFields] = useState<MeetingFields>(() => ({
    date: formatBengaliMeetingDate(new Date().toISOString().split('T')[0]),
    day: getBengaliDayFromDate(new Date().toISOString().split('T')[0]),
    time: '৮:৩০ মিনিট',
    location: 'সংগঠনের কার্যালয়',
    contactNumber: '01886122678'
  }));

  const isMeetingCategory = 
    noticeCategory === 'কার্যকরী কমিটির মিটিং' || 
    noticeCategory === 'কার্যকরী কমিটি ও সাধারণ সদস্য উভয়ের মিটিং';

  // Sort: Pinned notices first, then date descending
  const sortedNotices = useMemo(() => {
    return [...notices].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  }, [notices]);

  // Sync template text dynamically when meeting fields change or category changes
  const applyMeetingTemplate = (
    cat: string,
    fields: MeetingFields
  ) => {
    if (cat === 'কার্যকরী কমিটির মিটিং') {
      const generated = generateExecutiveMeetingNotice(fields);
      setNoticeText(generated);
      if (!noticeTitle || noticeTitle.includes('মিটিং') || noticeTitle.includes('সভা')) {
        setNoticeTitle('জরুরি কার্যকরী কমিটির সভা বিজ্ঞপ্তি');
      }
    } else if (cat === 'কার্যকরী কমিটি ও সাধারণ সদস্য উভয়ের মিটিং') {
      const generated = generateJointMeetingNotice(fields);
      setNoticeText(generated);
      if (!noticeTitle || noticeTitle.includes('মিটিং') || noticeTitle.includes('সভা')) {
        setNoticeTitle('জরুরি যৌথ সাধারণ সভা বিজ্ঞপ্তি');
      }
    }
  };

  const handleSelectCategory = (cat: string) => {
    setNoticeCategory(cat);
    if (cat === 'কার্যকরী কমিটির মিটিং' || cat === 'কার্যকরী কমিটি ও সাধারণ সদস্য উভয়ের মিটিং') {
      applyMeetingTemplate(cat, meetingFields);
    }
  };

  const handleMeetingFieldsChange = (updated: MeetingFields) => {
    setMeetingFields(updated);
    applyMeetingTemplate(noticeCategory, updated);
  };

  const handleOpenAddModal = (defaultCat: string = 'কার্যকরী কমিটির মিটিং') => {
    const todayIso = new Date().toISOString().split('T')[0];
    const initialFields: MeetingFields = {
      date: formatBengaliMeetingDate(todayIso),
      day: getBengaliDayFromDate(todayIso),
      time: '৮:৩০ মিনিট',
      location: 'সংগঠনের কার্যালয়',
      contactNumber: '01886122678'
    };
    setMeetingFields(initialFields);
    setEditingNotice(null);
    setNoticeDate(todayIso);
    setNoticeCategory(defaultCat);
    setIsPinned(false);
    setFormError('');

    if (defaultCat === 'কার্যকরী কমিটির মিটিং' || defaultCat === 'কার্যকরী কমিটি ও সাধারণ সদস্য উভয়ের মিটিং') {
      applyMeetingTemplate(defaultCat, initialFields);
    } else {
      setNoticeText('');
      setNoticeTitle('');
    }

    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (n: Notice) => {
    setEditingNotice(n);
    setNoticeText(n.noticeText);
    setNoticeTitle(n.title || '');
    setNoticeDate(n.date);
    const cat = n.category || 'সাধারণ';
    setNoticeCategory(cat);
    setIsPinned(Boolean(n.isPinned));
    setFormError('');
    setIsAddModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticeText.trim()) {
      setFormError('নোটিশের বিবরণ লিখুন');
      return;
    }
    if (!noticeDate) {
      setFormError('তারিখ সিলেক্ট করুন');
      return;
    }

    const finalTitle = noticeTitle.trim() || (
      noticeCategory === 'কার্যকরী কমিটির মিটিং' 
        ? 'জরুরি কার্যকরী কমিটির সভা'
        : noticeCategory === 'কার্যকরী কমিটি ও সাধারণ সদস্য উভয়ের মিটিং'
        ? 'জরুরি যৌথ সাধারণ সভা'
        : 'সংগঠনের বিজ্ঞপ্তি'
    );

    if (editingNotice && onEditNotice) {
      onEditNotice({
        ...editingNotice,
        title: finalTitle,
        noticeText: noticeText.trim(),
        date: noticeDate,
        category: noticeCategory,
        isPinned
      });
    } else {
      onAddNotice({
        title: finalTitle,
        date: noticeDate,
        noticeText: noticeText.trim(),
        category: noticeCategory,
        isPinned
      });
    }

    setNoticeText('');
    setNoticeTitle('');
    setNoticeDate(new Date().toISOString().split('T')[0]);
    setIsPinned(false);
    setEditingNotice(null);
    setFormError('');
    setIsAddModalOpen(false);
  };

  const handleCopyNotice = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const getCategoryBadge = (cat?: string) => {
    switch (cat) {
      case 'কার্যকরী কমিটির মিটিং':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'কার্যকরী কমিটি ও সাধারণ সদস্য উভয়ের মিটিং':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'জরুরি':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'রক্তদান':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'কার্যক্রম':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      default:
        return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            id="notice-back-btn"
            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition"
            title="হোমে ফিরুন"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
              <span className="text-xs font-semibold text-blue-700">পতেঙ্গা, চট্টগ্রাম • জরুরি নোটিশ বোর্ড</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <BellRing className="w-5 h-5 text-blue-600" />
              সংগঠনের নোটিশ ও বিজ্ঞপ্তি (Notices)
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Admin Only: Add Notice Button */}
          {isAdmin && (
            <button
              onClick={() => handleOpenAddModal('কার্যকরী কমিটির মিটিং')}
              id="notice-add-modal-btn"
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>নতুন নোটিশ প্রকাশ</span>
            </button>
          )}
        </div>
      </div>

      {/* Notices Feed */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1 text-xs text-slate-500">
          <span>মোট নোটিশ: <strong className="text-slate-800">{toBengaliNumber(notices.length)}</strong> টি</span>
          <span>সংগঠন: সিলেট মানবসেবা সংগঠন</span>
        </div>

        {sortedNotices.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-slate-200">
            <Megaphone className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-600 font-medium text-sm">বর্তমানে কোনো নোটিশ প্রকাশিত নেই</p>
            <p className="text-xs text-slate-400 mt-1">নতুন নোটিশ যোগ করতে এডমিন প্যানেল ব্যবহার করুন</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedNotices.map((notice, idx) => {
              const catClass = getCategoryBadge(notice.category);
              const isCopied = copiedId === (notice.id || String(idx));

              return (
                <div
                  key={notice.id || idx}
                  id={`notice-card-${notice.id || idx}`}
                  className={`bg-white rounded-2xl p-5 border transition-all shadow-xs ${
                    notice.isPinned
                      ? 'border-amber-300 ring-1 ring-amber-200 bg-gradient-to-br from-amber-50/20 via-white to-white'
                      : 'border-slate-200 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {notice.isPinned && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-900 text-xs font-bold border border-amber-300">
                          <Pin className="w-3 h-3 text-amber-700" />
                          পিন করা নোটিশ
                        </span>
                      )}

                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold border ${catClass}`}>
                        <Tag className="w-3 h-3" />
                        {notice.category || 'সাধারণ'}
                      </span>

                      <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {formatBengaliDate(notice.date)}
                      </span>
                    </div>

                    {/* Actions: Copy & Admin */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleCopyNotice(notice.noticeText, notice.id || String(idx))}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                          isCopied
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                        title="নোটিশ কপি করুন"
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                        <span className="hidden sm:inline">{isCopied ? 'কপি হয়েছে' : 'কপি'}</span>
                      </button>

                      {isAdmin && (
                        <>
                          {(notice.category === 'কার্যকরী কমিটির মিটিং' || 
                            notice.category === 'কার্যকরী কমিটি ও সাধারণ সদস্য উভয়ের মিটিং' ||
                            notice.title?.includes('মিটিং') ||
                            notice.title?.includes('সভা') ||
                            notice.noticeText?.includes('মিটিং')) && (
                            <button
                              type="button"
                              onClick={() => handleOpenBulkSms(notice.category || 'কার্যকরী কমিটির মিটিং', notice.noticeText, notice.title)}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer shadow-2xs ${
                                notice.category === 'কার্যকরী কমিটির মিটিং'
                                  ? 'bg-purple-600 hover:bg-purple-700 text-white'
                                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                              }`}
                              title="সবার কাছে এসএমএস পাঠান"
                            >
                              <Send className="w-3 h-3" />
                              <span>সবার কাছে এসএমএস পাঠান</span>
                            </button>
                          )}

                          <button
                            onClick={() => handleOpenEdit(notice)}
                            className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 text-xs transition cursor-pointer"
                            title="সম্পাদনা"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {onDeleteNotice && (
                            <button
                              onClick={() => onDeleteNotice(notice.id)}
                              className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 text-xs transition cursor-pointer"
                              title="মুছুন"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Title if present */}
                  {notice.title && (
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 mt-2.5 flex items-center gap-1.5">
                      {notice.title}
                    </h3>
                  )}

                  {/* Notice Content */}
                  <div className="mt-2 text-slate-800 text-sm leading-relaxed whitespace-pre-line font-normal bg-slate-50/50 p-3.5 rounded-xl border border-slate-100">
                    {notice.noticeText}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add / Edit Notice Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-xl border border-slate-200 animate-scaleUp my-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <BellRing className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingNotice ? 'নোটিশ সম্পাদনা' : 'নতুন নোটিশ ও বিজ্ঞপ্তি প্রকাশ'}
                  </h3>
                  <p className="text-[11px] text-slate-500">সিলেট মানবসেবা সংগঠন • নোটিশ বোর্ড</p>
                </div>
              </div>
              <button
                onClick={() => { setIsAddModalOpen(false); setEditingNotice(null); }}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              {formError && (
                <div className="p-2.5 rounded-lg bg-red-50 text-red-700 text-xs font-medium border border-red-200">
                  {formError}
                </div>
              )}

              {/* Notice Category Selection: Meeting Categories & Others */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-800">
                  নোটিশের ধরন / ক্যাটাগরি বাছাই করুন *
                </label>
                
                {/* Two Distinct Meeting Category Options */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleSelectCategory('কার্যকরী কমিটির মিটিং')}
                    className={`flex items-start gap-2.5 p-3 rounded-xl border text-left transition cursor-pointer ${
                      noticeCategory === 'কার্যকরী কমিটির মিটিং'
                        ? 'bg-purple-50/80 border-purple-400 ring-2 ring-purple-400/20 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-purple-200 hover:bg-purple-50/30'
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                      noticeCategory === 'কার্যকরী কমিটির মিটিং'
                        ? 'bg-purple-600 text-white'
                        : 'bg-purple-100 text-purple-700'
                    }`}>
                      <Users className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        কার্যকরী কমিটির মিটিং
                      </div>
                      <div className="text-[11px] text-slate-500 leading-tight mt-0.5">
                        Executive Committee Meeting (নির্দিষ্ট টেমপ্লেট)
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectCategory('কার্যকরী কমিটি ও সাধারণ সদস্য উভয়ের মিটিং')}
                    className={`flex items-start gap-2.5 p-3 rounded-xl border text-left transition cursor-pointer ${
                      noticeCategory === 'কার্যকরী কমিটি ও সাধারণ সদস্য উভয়ের মিটিং'
                        ? 'bg-indigo-50/80 border-indigo-400 ring-2 ring-indigo-400/20 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-indigo-200 hover:bg-indigo-50/30'
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                      noticeCategory === 'কার্যকরী কমিটি ও সাধারণ সদস্য উভয়ের মিটিং'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-indigo-100 text-indigo-700'
                    }`}>
                      <Users className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        কার্যকরী কমিটি ও সাধারণ সদস্য উভয়ের মিটিং
                      </div>
                      <div className="text-[11px] text-slate-500 leading-tight mt-0.5">
                        Joint Meeting (উভয় সদস্যদের জন্য যৌথ সভা)
                      </div>
                    </div>
                  </button>
                </div>

                {/* Other standard categories dropdown */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[11px] text-slate-500 font-semibold mr-1">অন্যান্য নোটিশ:</span>
                  {[
                    { id: 'জরুরি', label: 'জরুরি বিজ্ঞপ্তি' },
                    { id: 'সাধারণ', label: 'সাধারণ নোটিশ' },
                    { id: 'কার্যক্রম', label: 'কার্যক্রম নোটিশ' },
                    { id: 'রক্তদান', label: 'রক্তদান ক্যাম্প' }
                  ].map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleSelectCategory(c.id)}
                      className={`text-[11px] px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
                        noticeCategory === c.id
                          ? 'bg-slate-800 text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* If either meeting category is selected, show Dynamic Meeting Input Form */}
              {isMeetingCategory && (
                <MeetingNoticeForm
                  meetingType={noticeCategory as any}
                  fields={meetingFields}
                  onChange={handleMeetingFieldsChange}
                  onReset={() => {
                    const todayIso = new Date().toISOString().split('T')[0];
                    const resetFields: MeetingFields = {
                      date: formatBengaliMeetingDate(todayIso),
                      day: getBengaliDayFromDate(todayIso),
                      time: '৮:৩০ মিনিট',
                      location: 'সংগঠনের কার্যালয়',
                      contactNumber: '01886122678'
                    };
                    handleMeetingFieldsChange(resetFields);
                  }}
                />
              )}

              {/* Title & Date Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    নোটিশের শিরোনাম (Title)
                  </label>
                  <input
                    type="text"
                    value={noticeTitle}
                    onChange={(e) => setNoticeTitle(e.target.value)}
                    placeholder="যেমন: জরুরি সভা সংক্রান্ত বিজ্ঞপ্তি"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    প্রকাশের তারিখ (Posting Date) *
                  </label>
                  <input
                    type="date"
                    required
                    value={noticeDate}
                    onChange={(e) => setNoticeDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none bg-white"
                  />
                </div>
              </div>

              {/* Notice Content / Live Generated Output */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700">
                    নোটিশের বিস্তারিত বক্তব্য (Notice Text) *
                  </label>
                  {isMeetingCategory && (
                    <button
                      type="button"
                      onClick={() => applyMeetingTemplate(noticeCategory, meetingFields)}
                      className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                      title="উপরে পূরণ করা তথ্য দিয়ে টেমপ্লেট পুনরায় লোড করুন"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>টেমপ্লেট পুনরায় রিফ্রেশ</span>
                    </button>
                  )}
                </div>
                <textarea
                  required
                  rows={isMeetingCategory ? 5 : 4}
                  value={noticeText}
                  onChange={(e) => setNoticeText(e.target.value)}
                  placeholder="নোটিশের বিস্তারিত বক্তব্য এখানে লিখুন..."
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none leading-relaxed font-normal bg-white"
                />
                {isMeetingCategory && (
                  <p className="text-[11px] text-slate-500">
                    💡 উপরের ফরমটি পূরণ করলে এই বার্তাটি স্বয়ংক্রিয়ভাবে আপডেট হয়। প্রয়োজনে আপনি সরাসরি এই টেক্সটবক্সেও পরিবর্তন করতে পারেন।
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="pin-notice-chk"
                  checked={isPinned}
                  onChange={(e) => setIsPinned(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="pin-notice-chk" className="text-xs font-semibold text-slate-700 cursor-pointer select-none">
                  গুরুত্বপূর্ণ নোটিশ হিসেবে উপরে পিন (Pin) করে রাখুন
                </label>
              </div>

              <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100">
                <div>
                  {isMeetingCategory && (
                    <button
                      type="button"
                      onClick={() => handleOpenBulkSms(noticeCategory, noticeText, noticeTitle)}
                      className={`px-4 py-2 text-xs font-bold text-white rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5 ${
                        noticeCategory === 'কার্যকরী কমিটির মিটিং'
                          ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-100'
                          : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100'
                      }`}
                      title="সবার কাছে এসএমএস পাঠান"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>সবার কাছে এসএমএস পাঠান</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => { setIsAddModalOpen(false); setEditingNotice(null); }}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                  >
                    বাতিল
                  </button>
                  <button
                    type="submit"
                    id="notice-submit-btn"
                    className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
                  >
                    <BellRing className="w-3.5 h-3.5" />
                    <span>{editingNotice ? 'আপডেট করুন' : 'নোটিশ প্রকাশ করুন'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-700 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 animate-slideUp text-xs sm:text-sm font-semibold border border-emerald-600">
          <CheckCircle2 className="w-4 h-4 text-emerald-200" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Bulk Meeting SMS Dispatch Modal */}
      <BulkMeetingSmsModal
        isOpen={bulkSmsData.isOpen}
        onClose={() => setBulkSmsData(prev => ({ ...prev, isOpen: false }))}
        meetingType={bulkSmsData.meetingType}
        noticeText={bulkSmsData.noticeText}
        noticeTitle={bulkSmsData.noticeTitle}
        members={members}
        onNotifySuccess={(msg) => showToast(msg)}
      />
    </div>
  );
};
