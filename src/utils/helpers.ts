import { Member } from '../types';

/**
 * Converts English digits to Bengali numerals
 */
export function toBengaliNumber(num: number | string | undefined | null): string {
  if (num === undefined || num === null) return '০';
  const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return num
    .toString()
    .replace(/[0-9]/g, (digit) => bengaliDigits[parseInt(digit, 10)]);
}

/**
 * Converts Bengali digits to standard English number
 */
export function fromBengaliNumber(str: string): number {
  if (!str) return 0;
  const bengaliToEnglish: Record<string, string> = {
    '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
    '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9'
  };
  const converted = str.replace(/[০-৯]/g, (d) => bengaliToEnglish[d] || d);
  const parsed = parseFloat(converted.replace(/[^0-9.-]/g, ''));
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Format currency in Bangladeshi Taka with Bengali numerals
 */
export function formatBengaliCurrency(amount: number | string | undefined | null): string {
  const num = typeof amount === 'string' ? fromBengaliNumber(amount) : (amount || 0);
  return `৳ ${toBengaliNumber(num.toLocaleString('en-US'))}`;
}

/**
 * Normalizes phone numbers by stripping whitespace, dashes, and country code
 */
export function sanitizePhone(phone?: string | null): string {
  if (!phone) return '';
  let cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.startsWith('880')) {
    cleaned = '0' + cleaned.slice(3);
  }
  return cleaned;
}

/**
 * Normalizes Bengali names for robust matching
 */
export function normalizeBengaliName(name?: string | null): string {
  if (!name) return '';
  return name
    .trim()
    .toLowerCase()
    .replace(/[\s\.\,\-_]+/g, '')
    .replace(/মোঃ/g, 'মো')
    .replace(/মাওঃ/g, 'মাও')
    .replace(/মাওলানা/g, 'মাও')
    .replace(/ইঞ্জিঃ/g, 'ইঞ্জি');
}

/**
 * Check if a member belongs to Executive Committee
 */
export function isExecutiveCommitteeMember(member?: Member | null): boolean {
  if (!member) return false;
  if (member.isExecutive === true) return true;
  if (member.memberType === 'executive') return true;
  if (member.category === 'কার্যকরী কমিটি') return true;
  const des = (member.designation || '').toLowerCase();
  return (
    des.includes('সভাপতি') ||
    des.includes('সম্পাদক') ||
    des.includes('দপ্তর') ||
    des.includes('কোষাধ্যক্ষ') ||
    des.includes('কার্যকরী') ||
    des.includes('উপদেষ্টা')
  );
}

/**
 * Check if a member is Expatriate
 */
export function isExpatriateMember(member?: Member | null): boolean {
  if (!member) return false;
  if (member.isExpatriate === true) return true;
  if (member.memberType === 'expatriate') return true;
  const des = (member.designation || '').toLowerCase();
  const area = (member.area || '').toLowerCase();
  return des.includes('প্রবাসী') || area.includes('প্রবাসী') || Boolean(member.countryStatus);
}

/**
 * Strictly sorts members in ascending seniority order (oldest first).
 * The earliest members (#1, #2, #3...) remain at the top.
 * Newly added members appear at the very bottom in sequential order.
 */
export function sortMembersOldestFirst(members: Member[]): Member[] {
  if (!Array.isArray(members)) return [];
  return [...members].sort((a, b) => {
    // 1. Explicit serial comparison
    const serialA = typeof a.serial === 'number' && !isNaN(a.serial) && a.serial > 0 ? a.serial : null;
    const serialB = typeof b.serial === 'number' && !isNaN(b.serial) && b.serial > 0 ? b.serial : null;
    if (serialA !== null && serialB !== null) {
      return serialA - serialB;
    }
    if (serialA !== null) return -1;
    if (serialB !== null) return 1;

    // 2. Creation or registration timestamp comparison
    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    if (timeA !== timeB && timeA > 0 && timeB > 0) {
      return timeA - timeB;
    }

    // 3. JoinDate comparison
    const joinA = a.joinDate ? a.joinDate : '';
    const joinB = b.joinDate ? b.joinDate : '';
    return joinA.localeCompare(joinB);
  });
}

/**
 * Safely resolves member photo URL without returning empty strings
 */
export function getMemberPhotoUrl(member?: Partial<Member> | null): string {
  if (!member) return '';
  const photo = member.photoUrl;
  if (typeof photo === 'string' && photo.trim().length > 0) {
    return photo.trim();
  }
  return '';
}
