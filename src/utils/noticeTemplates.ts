/**
 * Notice Templates and Helper utilities for Sylhet Manob Seba Songothon
 */

export const MEETING_CATEGORIES = {
  EXECUTIVE: 'কার্যকরী কমিটির মিটিং',
  JOINT: 'কার্যকরী কমিটি ও সাধারণ সদস্য উভয়ের মিটিং',
} as const;

export type MeetingCategoryType = typeof MEETING_CATEGORIES[keyof typeof MEETING_CATEGORIES];

export interface MeetingFields {
  date: string;          // e.g. "২৫/১০/২০২৬" or "২৫ অক্টোবর ২০২৬"
  day: string;           // e.g. "শুক্রবার"
  time: string;          // e.g. "৮:৩০ মিনিট" or "৯:০০ টা"
  location: string;      // e.g. "সংগঠনের অস্থায়ী কার্যালয়"
  contactNumber: string; // e.g. "01886122678"
}

export const BENGALI_DAYS = [
  'রবিবার',
  'সোমবার',
  'মঙ্গলবার',
  'বুধবার',
  'বৃহস্পতিবার',
  'শুক্রবার',
  'শনিবার'
];

/**
 * Returns Bengali day of week from date object or ISO string
 */
export function getBengaliDayFromDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'শুক্রবার';
    const dayIndex = d.getDay();
    return BENGALI_DAYS[dayIndex] || 'শুক্রবার';
  } catch {
    return 'শুক্রবার';
  }
}

/**
 * Converts English digits to Bengali numerals
 */
export function toBengaliNumeral(num: string | number): string {
  const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(num).replace(/[0-9]/g, (digit) => bengaliDigits[parseInt(digit, 10)]);
}

/**
 * Formats YYYY-MM-DD to readable Bengali date (e.g., ২৫/০৯/২০২৬)
 */
export function formatBengaliMeetingDate(isoDate: string): string {
  if (!isoDate) return '';
  try {
    const parts = isoDate.split('-');
    if (parts.length === 3) {
      const year = toBengaliNumeral(parts[0]);
      const month = toBengaliNumeral(parts[1]);
      const day = toBengaliNumeral(parts[2]);
      return `${day}/${month}/${year}`;
    }
  } catch {
    // fallback
  }
  return toBengaliNumeral(isoDate);
}

/**
 * Generates the official Executive Committee Meeting Notice
 */
export function generateExecutiveMeetingNotice(fields: MeetingFields): string {
  const date = fields.date.trim() || '[Date]';
  const day = fields.day.trim() || '[Day]';
  const time = fields.time.trim() || '[Time]';
  const location = fields.location.trim() || '[Location]';
  const contactNumber = fields.contactNumber.trim() || '[Contact Number]';

  return `আসসালামু আলাইকুম, সিলেট মানবসেবা সংগঠন-এর সম্মানিত কার্যকরী কমিটির সদস্যবৃন্দ, আগামী ${date} ইংরেজি তারিখ, রোজ ${day}, রাত - ${time}, ${location}-এ আমাদের জরুরি কার্যকরী কমিটির সভা অনুষ্ঠিত হবে। সংগঠনের কার্যক্রমকে আরও গতিশীল করতে উক্ত মিটিংয়ে আপনার উপস্থিতি অত্যন্ত জরুরি। যদি কোনো কারণে কোনো কার্যকরী সদস্য উপস্থিত থাকতে অপারগ হন, তবে অনুগ্রহপূর্বক তা সংগঠনের ${contactNumber} নম্বরে কল দিয়ে অথবা কার্যকরী গ্রুপে মেসেজ দিয়ে পূর্বেই অবহিত করার জন্য বিশেষভাবে অনুরোধ করা হলো। ধন্যবাদান্তে, সিলেট মানবসেবা সংগঠন।`;
}

/**
 * Generates the official Joint Meeting Notice (Executive & General Members)
 */
export function generateJointMeetingNotice(fields: MeetingFields): string {
  const date = fields.date.trim() || '[Date]';
  const day = fields.day.trim() || '[Day]';
  const time = fields.time.trim() || '[Time]';
  const location = fields.location.trim() || '[Location]';
  const contactNumber = fields.contactNumber.trim() || '[Contact Number]';

  return `আসসালামু আলাইকুম, সিলেট মানবসেবা সংগঠন-এর সম্মানিত কার্যকরী কমিটি ও সাধারণ সদস্যবৃন্দ, আগামী ${date} ইংরেজি তারিখ, রোজ ${day}, রাত - ${time}, ${location}-এ সংগঠনের এক জরুরি যৌথ মিটিং অনুষ্ঠিত হবে। উক্ত মিটিংয়ে সংগঠনের সকল কার্যকরী সদস্য ও সাধারণ সদস্যদের যথাসময়ে উপস্থিত থাকার জন্য বিনীত অনুরোধ জানানো যাচ্ছে। বিশেষ কারণে কোনো সদস্য উপস্থিত থাকতে না পারলে, অনুগ্রহপূর্বক সংগঠনের ${contactNumber} এই নাম্বারে কল দিয়ে অথবা সংগঠনের গ্রুপে মেসেজ দিয়ে পূর্বে জানিয়ে যাওয়ার জন্য অনুরোধ করা হলো। ধন্যবাদান্তে, সিলেট মানবসেবা সংগঠন।`;
}

export const DEFAULT_MEETING_FIELDS: MeetingFields = {
  date: formatBengaliMeetingDate(new Date().toISOString().split('T')[0]),
  day: getBengaliDayFromDate(new Date().toISOString().split('T')[0]),
  time: '৮:৩০ মিনিট',
  location: 'সংগঠনের কার্যালয়',
  contactNumber: '01886122678'
};
