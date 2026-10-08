import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  MapPin, 
  Flag, 
  Sparkles,
  Info
} from 'lucide-react';
import { 
  MONTH_NAMES_BN, 
  MONTH_NAMES_EN, 
  BANGLADESH_HOLIDAYS_2026, 
  getMonthDays 
} from '../utils/calendarData';
import { toBengaliNumber } from '../utils/helpers';

interface CalendarScreenProps {
  onBack: () => void;
}

export const CalendarScreen: React.FC<CalendarScreenProps> = () => {
  const [currentMonthIndex, setCurrentMonthIndex] = useState(2); // March 2026

  const { firstDay, daysInMonth } = getMonthDays(2026, currentMonthIndex);

  // Month holidays
  const currentMonthPrefix = `2026-${String(currentMonthIndex + 1).padStart(2, '0')}`;
  const monthHolidays = BANGLADESH_HOLIDAYS_2026.filter(h => h.date.startsWith(currentMonthPrefix));

  const weekDayNames = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহঃ', 'শুক্র', 'শনি'];

  return (
    <div className="space-y-6 pb-20 sm:pb-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-800 via-emerald-800 to-teal-900 rounded-3xl p-5 sm:p-6 text-white shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-6 h-6 text-teal-300" />
              <h2 className="text-xl sm:text-2xl font-black">
                বর্ষপঞ্জি ও সরকারি ছুটি ২০২৬
              </h2>
            </div>
            <p className="text-xs text-teal-100 mt-1">
              সিলেট মানব সেবা সংগঠন—বাৎসরিক ক্যালেন্ডার ও জাতীয় দিবসের তালিকা
            </p>
          </div>

          {/* Month Navigation Controls */}
          <div className="flex items-center gap-2 bg-black/30 backdrop-blur-md p-1.5 rounded-2xl border border-white/10 self-stretch sm:self-auto justify-between sm:justify-start">
            <button
              onClick={() => setCurrentMonthIndex((prev) => (prev > 0 ? prev - 1 : 11))}
              className="p-1.5 rounded-xl text-white hover:bg-white/20 transition cursor-pointer"
              title="পূর্ববর্তী মাস"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="text-center px-3">
              <span className="text-sm font-black text-white block">
                {MONTH_NAMES_BN[currentMonthIndex]} ২০২৬
              </span>
              <span className="text-[10px] text-teal-200">
                {MONTH_NAMES_EN[currentMonthIndex]} 2026
              </span>
            </div>
            <button
              onClick={() => setCurrentMonthIndex((prev) => (prev < 11 ? prev + 1 : 0))}
              className="p-1.5 rounded-xl text-white hover:bg-white/20 transition cursor-pointer"
              title="পরবর্তী মাস"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Month Selection Quick Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {MONTH_NAMES_BN.map((name, idx) => (
          <button
            key={name}
            onClick={() => setCurrentMonthIndex(idx)}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              currentMonthIndex === idx
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {name}
          </button>
        ))}
      </div>

      {/* Interactive Monthly Grid */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-xs font-black">
          {weekDayNames.map((d, i) => (
            <div 
              key={d} 
              className={`py-2 rounded-xl ${
                i === 5 ? 'text-rose-600 bg-rose-50' : i === 6 ? 'text-amber-700 bg-amber-50' : 'text-slate-600 bg-slate-50'
              }`}
            >
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {/* Empty prefix slots */}
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-14 sm:min-h-20 rounded-2xl bg-slate-50/50 border border-transparent" />
          ))}

          {/* Month Days */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const dayIso = `2026-${String(currentMonthIndex + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
            const holiday = BANGLADESH_HOLIDAYS_2026.find(h => h.date === dayIso);
            const isFriday = (firstDay + i) % 7 === 5;
            const isSaturday = (firstDay + i) % 7 === 6;

            return (
              <div
                key={`day-${dayNum}`}
                className={`min-h-14 sm:min-h-20 p-1 sm:p-2 rounded-2xl border transition flex flex-col justify-between ${
                  holiday 
                    ? 'border-rose-300 bg-rose-50/80' 
                    : isFriday 
                      ? 'border-slate-200 bg-slate-50 text-rose-600' 
                      : 'border-slate-100 bg-white hover:border-emerald-300'
                }`}
              >
                <div className="flex justify-between items-start">
                  <span className={`text-xs sm:text-sm font-black ${
                    holiday || isFriday ? 'text-rose-600' : 'text-slate-900'
                  }`}>
                    {toBengaliNumber(dayNum)}
                  </span>
                  {holiday && (
                    <Flag className="w-3 h-3 text-rose-500 shrink-0" />
                  )}
                </div>

                {holiday && (
                  <div className="text-[9px] sm:text-[10px] font-bold text-rose-700 line-clamp-2 leading-tight bg-white/70 p-1 rounded-md">
                    {holiday.title}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Monthly Holidays List */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Flag className="w-5 h-5 text-rose-600" />
          <span>{MONTH_NAMES_BN[currentMonthIndex]} মাসের সরকারি ও ধর্মীয় ছুটির তালিকা</span>
        </h3>

        {monthHolidays.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {monthHolidays.map((h) => (
              <div 
                key={h.date}
                className="p-3.5 rounded-2xl bg-rose-50/80 border border-rose-200 flex items-start gap-3"
              >
                <div className="w-10 h-10 rounded-xl bg-rose-200 text-rose-900 flex flex-col items-center justify-center font-black shrink-0">
                  <span className="text-xs">{toBengaliNumber(parseInt(h.date.split('-')[2], 10))}</span>
                  <span className="text-[8px]">{h.dayNameBn}</span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{h.title}</h4>
                  <span className="text-[10px] font-semibold text-rose-700 bg-white px-2 py-0.5 rounded-full border border-rose-200 inline-block mt-1">
                    {h.type === 'national' ? 'জাতীয় দিবস' : h.type === 'religious' ? 'ধর্মীয় উৎসব' : 'সরকারি ছুটি'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500 italic">
            এই মাসে কোনো সাধারণ বা নির্বাহী ছুটি নেই।
          </p>
        )}
      </div>
    </div>
  );
};
