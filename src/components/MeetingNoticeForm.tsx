import React from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  Phone, 
  Users, 
  Building2, 
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { 
  MeetingFields, 
  BENGALI_DAYS, 
  getBengaliDayFromDate, 
  formatBengaliMeetingDate 
} from '../utils/noticeTemplates';

interface MeetingNoticeFormProps {
  meetingType: 'কার্যকরী কমিটির মিটিং' | 'কার্যকরী কমিটি ও সাধারণ সদস্য উভয়ের মিটিং';
  fields: MeetingFields;
  onChange: (updatedFields: MeetingFields) => void;
  onReset?: () => void;
}

export const MeetingNoticeForm: React.FC<MeetingNoticeFormProps> = ({
  meetingType,
  fields,
  onChange,
  onReset
}) => {
  const isExecutive = meetingType === 'কার্যকরী কমিটির মিটিং';

  const handleFieldChange = (field: keyof MeetingFields, value: string) => {
    onChange({
      ...fields,
      [field]: value
    });
  };

  const handleDatePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isoDate = e.target.value;
    if (isoDate) {
      const formattedDate = formatBengaliMeetingDate(isoDate);
      const calculatedDay = getBengaliDayFromDate(isoDate);
      onChange({
        ...fields,
        date: formattedDate,
        day: calculatedDay
      });
    }
  };

  return (
    <div className="bg-gradient-to-br from-indigo-50/60 via-purple-50/30 to-blue-50/40 rounded-2xl p-4 sm:p-5 border border-indigo-200/80 shadow-xs space-y-4 animate-fadeIn">
      {/* Header Badge */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-indigo-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-indigo-900">
                {isExecutive ? 'কার্যকরী কমিটির মিটিং ফরম' : 'যৌথ সাধারণ সভা ফরম'}
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 border border-indigo-200">
                <Sparkles className="w-3 h-3 text-indigo-600" />
                অটোমেটিক টেমপ্লেট
              </span>
            </div>
            <p className="text-[11px] text-slate-600">
              নিচের তথ্যগুলো পূরণ করলেই স্বয়ংক্রিয়ভাবে প্রফেশনাল বিজ্ঞপ্তি তৈরি হয়ে যাবে
            </p>
          </div>
        </div>

        {onReset && (
          <button
            type="button"
            onClick={onReset}
            className="text-[11px] font-bold text-indigo-700 hover:text-indigo-900 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-indigo-200 hover:bg-indigo-50 transition cursor-pointer"
            title="তথ্য রিসেট করুন"
          >
            <RotateCcw className="w-3 h-3" />
            <span>রিসেট</span>
          </button>
        )}
      </div>

      {/* Dynamic Input Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {/* Date (তারিখ) */}
        <div className="space-y-1">
          <label className="flex items-center justify-between text-xs font-bold text-slate-700">
            <span className="flex items-center gap-1.5">
              <CalendarIcon className="w-3.5 h-3.5 text-indigo-600" />
              তারিখ (Date) *
            </span>
            <span className="text-[10px] font-normal text-slate-500">উদা: ২৫/০৯/২০২৬</span>
          </label>
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              required
              value={fields.date}
              onChange={(e) => handleFieldChange('date', e.target.value)}
              placeholder="যেমন: ২৫/০৯/২০২৬"
              className="flex-1 px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none"
            />
            {/* Quick date picker icon */}
            <label 
              title="ক্যালেন্ডার থেকে তারিখ বাছাই করুন" 
              className="p-2 border border-slate-300 rounded-xl bg-white hover:bg-indigo-50 text-slate-600 hover:text-indigo-700 cursor-pointer transition shrink-0"
            >
              <CalendarIcon className="w-4 h-4" />
              <input
                type="date"
                onChange={handleDatePickerChange}
                className="sr-only"
              />
            </label>
          </div>
        </div>

        {/* Day (বার) */}
        <div className="space-y-1">
          <label className="flex items-center justify-between text-xs font-bold text-slate-700">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-600" />
              বার (Day) *
            </span>
            <span className="text-[10px] font-normal text-slate-500">উদা: শুক্রবার</span>
          </label>
          <div className="relative">
            <input
              type="text"
              required
              value={fields.day}
              onChange={(e) => handleFieldChange('day', e.target.value)}
              placeholder="যেমন: শুক্রবার"
              list="bengali-days-list"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none"
            />
            <datalist id="bengali-days-list">
              {BENGALI_DAYS.map((d) => (
                <option key={d} value={d} />
              ))}
            </datalist>
          </div>
          {/* Quick day pills */}
          <div className="flex flex-wrap gap-1 pt-0.5">
            {['শুক্রবার', 'শনিবার', 'রবিবার'].map((dayName) => (
              <button
                key={dayName}
                type="button"
                onClick={() => handleFieldChange('day', dayName)}
                className={`text-[10px] px-2 py-0.5 rounded-md font-semibold transition cursor-pointer ${
                  fields.day === dayName
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-white/80 text-slate-600 border border-slate-200 hover:bg-indigo-50'
                }`}
              >
                {dayName}
              </button>
            ))}
          </div>
        </div>

        {/* Time (সময়) */}
        <div className="space-y-1">
          <label className="flex items-center justify-between text-xs font-bold text-slate-700">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-600" />
              সময় (Time) *
            </span>
            <span className="text-[10px] font-normal text-slate-500">উদা: রাত - ৮:৩০ মিনিট</span>
          </label>
          <input
            type="text"
            required
            value={fields.time}
            onChange={(e) => handleFieldChange('time', e.target.value)}
            placeholder="যেমন: ৮:৩০ মিনিট বা ৯:০০ টা"
            className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none"
          />
          <div className="flex flex-wrap gap-1 pt-0.5">
            {['৮:৩০ মিনিট', '৯:০০ টা', '১০:০০ টা'].map((timePreset) => (
              <button
                key={timePreset}
                type="button"
                onClick={() => handleFieldChange('time', timePreset)}
                className={`text-[10px] px-2 py-0.5 rounded-md font-semibold transition cursor-pointer ${
                  fields.time === timePreset
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-white/80 text-slate-600 border border-slate-200 hover:bg-indigo-50'
                }`}
              >
                {timePreset}
              </button>
            ))}
          </div>
        </div>

        {/* Location (স্থান) */}
        <div className="space-y-1">
          <label className="flex items-center justify-between text-xs font-bold text-slate-700">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-indigo-600" />
              স্থান (Location) *
            </span>
            <span className="text-[10px] font-normal text-slate-500">উদা: সংগঠনের কার্যালয়</span>
          </label>
          <input
            type="text"
            required
            value={fields.location}
            onChange={(e) => handleFieldChange('location', e.target.value)}
            placeholder="যেমন: সংগঠনের কার্যালয় বা ভার্চুয়াল গুগল মিট"
            className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none"
          />
          <div className="flex flex-wrap gap-1 pt-0.5">
            {['সংগঠনের কার্যালয়', 'ভার্চুয়াল গুগল মিট'].map((locPreset) => (
              <button
                key={locPreset}
                type="button"
                onClick={() => handleFieldChange('location', locPreset)}
                className={`text-[10px] px-2 py-0.5 rounded-md font-semibold transition cursor-pointer truncate max-w-[180px] ${
                  fields.location === locPreset
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-white/80 text-slate-600 border border-slate-200 hover:bg-indigo-50'
                }`}
              >
                {locPreset}
              </button>
            ))}
          </div>
        </div>

        {/* Contact Number (যোগাযোগের মোবাইল নম্বর) */}
        <div className="space-y-1 sm:col-span-2">
          <label className="flex items-center justify-between text-xs font-bold text-slate-700">
            <span className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-indigo-600" />
              যোগাযোগের মোবাইল নম্বর (Contact Number) *
            </span>
            <span className="text-[10px] font-normal text-slate-500">জরুরি যোগাযোগের জন্য</span>
          </label>
          <input
            type="tel"
            required
            value={fields.contactNumber}
            onChange={(e) => handleFieldChange('contactNumber', e.target.value)}
            placeholder="01886122678"
            className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium font-mono bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
};
