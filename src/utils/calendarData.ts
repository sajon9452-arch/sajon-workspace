export interface HolidayInfo {
  date: string; // YYYY-MM-DD
  title: string;
  type: 'govt' | 'religious' | 'national';
  dayNameBn: string;
}

export const MONTH_NAMES_BN = [
  'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
  'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
];

export const MONTH_NAMES_EN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const BANGLADESH_HOLIDAYS_2026: HolidayInfo[] = [
  { date: '2026-02-21', title: 'শহীদ দিবস ও আন্তর্জাতিক মাতৃভাষা দিবস', type: 'national', dayNameBn: 'শনিবার' },
  { date: '2026-03-21', title: 'পবিত্র ঈদুল ফিতর (চাঁদ সাপেক্ষে)', type: 'religious', dayNameBn: 'শনিবার' },
  { date: '2026-03-22', title: 'পবিত্র ঈদুল ফিতর ছুটি', type: 'religious', dayNameBn: 'রবিবার' },
  { date: '2026-03-26', title: 'স্বাধীনতা ও জাতীয় দিবস', type: 'national', dayNameBn: 'বৃহস্পতিবার' },
  { date: '2026-04-14', title: 'বাংলা নববর্ষ (পহেলা বৈশাখ ১৪৩৩)', type: 'national', dayNameBn: 'মঙ্গলবার' },
  { date: '2026-05-01', title: 'মে দিবস (আন্তর্জাতিক শ্রমিক দিবস)', type: 'govt', dayNameBn: 'শুক্রবার' },
  { date: '2026-05-31', title: 'বুদ্ধ পূর্ণিমা (বৈশাখী পূর্ণিমা)', type: 'religious', dayNameBn: 'রবিবার' },
  { date: '2026-05-27', title: 'পবিত্র ঈদুল আজহা (চাঁদ সাপেক্ষে)', type: 'religious', dayNameBn: 'বুধবার' },
  { date: '2026-05-28', title: 'পবিত্র ঈদুল আজহা ছুটি', type: 'religious', dayNameBn: 'বৃহস্পতিবার' },
  { date: '2026-06-26', title: 'পবিত্র আশুরা (১০ই মহররম)', type: 'religious', dayNameBn: 'শুক্রবার' },
  { date: '2026-08-15', title: 'জাতীয় শোক দিবস / সংগঠন প্রতিষ্ঠা বার্ষিকী (২০২২)', type: 'national', dayNameBn: 'শনিবার' },
  { date: '2026-08-26', title: 'পবিত্র ঈদে মিলাদুন্নবী (সা.)', type: 'religious', dayNameBn: 'বুধবার' },
  { date: '2026-09-04', title: 'শুভ জন্মাষ্টমী', type: 'religious', dayNameBn: 'শুক্রবার' },
  { date: '2026-10-20', title: 'দুর্গাপূজা (বিজয়া দশমী)', type: 'religious', dayNameBn: 'মঙ্গলবার' },
  { date: '2026-12-16', title: 'মহান বিজয় দিবস', type: 'national', dayNameBn: 'বুধবার' },
  { date: '2026-12-25', title: 'যিশু খ্রিস্টের জন্মদিন (বড় দিন)', type: 'religious', dayNameBn: 'শুক্রবার' }
];

export function getMonthDays(year: number, monthIndex: number) {
  const firstDay = new Date(year, monthIndex, 1).getDay(); // 0 is Sunday
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  return { firstDay, daysInMonth };
}
