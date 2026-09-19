import { Member } from '../types';
import { toBengaliNumber } from './helpers';

/**
 * Normalizes a Bangladeshi or international phone number for SIM SMS URI schemes.
 */
export function sanitizePhoneForSms(phone: string): string {
  if (!phone) return '';
  let cleaned = phone.replace(/[^0-9+]/g, '');
  if (cleaned.startsWith('8801') && cleaned.length === 13) {
    cleaned = '+' + cleaned;
  } else if (cleaned.startsWith('01') && cleaned.length === 11) {
    // Both 01xxxxxxxxx and +8801xxxxxxxxx are valid, keep clean 017... or +8801...
    cleaned = '0' + cleaned.substring(1);
  }
  return cleaned;
}

/**
 * Builds the native mobile device SMS URI scheme.
 * iOS requires '&body=' separator while Android and web standards use '?body='.
 */
export function buildDirectSimSmsUrl(phone: string, body: string): string {
  const cleanPhone = sanitizePhoneForSms(phone);
  const isIOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent || '');
  const separator = isIOS ? '&' : '?';
  return `sms:${cleanPhone}${separator}body=${encodeURIComponent(body)}`;
}

/**
 * Triggers native SIM SMS by opening the mobile device's default SMS app with prefilled body.
 */
export function triggerDirectSimSms(phone: string, body: string): boolean {
  if (typeof window === 'undefined') return false;
  const cleanPhone = sanitizePhoneForSms(phone);
  if (!cleanPhone && !body) return false;

  const smsUrl = buildDirectSimSmsUrl(cleanPhone, body);

  try {
    const link = document.createElement('a');
    link.href = smsUrl;
    link.target = '_self';
    link.rel = 'noopener noreferrer';
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      if (document.body.contains(link)) {
        document.body.removeChild(link);
      }
    }, 800);
    return true;
  } catch (err) {
    console.warn('Failed to launch SMS via anchor, falling back to window.location:', err);
    try {
      window.location.href = smsUrl;
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Exact template for Paid Status as requested:
 * "আসসালামু আলাইকুম সিলেট মানবসেবা সংগঠন এর প্রিয় সদস্য - [MemberName] ভাই, আপনার [Months] মাসের মাসিক চাঁদা মোট - [Money] টাকা সফলভাবে পরিশোধ করা হয়েছে। আশা করি আগামী দিনগুলোতেও এভাবে সংগঠনের পাশে থাকবেন। ধন্যবাদ।"
 */
export function generateDirectSimPaidSms(params: {
  memberName: string;
  months?: string;
  money: number | string;
}): string {
  const memberName = params.memberName.trim() || 'সদস্য';
  let months = params.months?.trim() || 'চলতি';
  // Strip trailing " মাস" or " মাসের" if entered to prevent duplication with template's " মাসের"
  months = months.replace(/\s*মাস(ের)?\s*$/i, '').trim() || 'চলতি';
  const money = params.money !== '' && params.money !== undefined ? params.money : '০';

  return `আসসালামু আলাইকুম সিলেট মানবসেবা সংগঠন এর প্রিয় সদস্য - ${memberName} ভাই, আপনার ${months} মাসের মাসিক চাঁদা মোট - ${money} টাকা সফলভাবে পরিশোধ করা হয়েছে। আশা করি আগামী দিনগুলোতেও এভাবে সংগঠনের পাশে থাকবেন। ধন্যবাদ।`;
}

/**
 * Exact templates for Due Status as requested:
 * Condition A (If month count is 1):
 * "আসসালামু আলাইকুম সিলেট মানবসেবা সংগঠন এর প্রিয় সদস্য - [MemberName] ভাই, আপনার রানিং মাসের মাসিক চাঁদা মোট - [Money] টাকা বকেয়া রয়েছে। তাই সংগঠনের উন্নয়নের কথা বিবেচনা করে দ্রুত বকেয়া পরিশোধ করার চেষ্টা করবেন। ধন্যবাদ।"
 *
 * Condition B (If month count is greater than 1):
 * "আসসালামু আলাইকুম সিলেট মানবসেবা সংগঠন এর প্রিয় সদস্য - [MemberName] ভাই, আপনার রানিং মাস এবং গত [Months] মাস সহ মোট - [Money] টাকা বকেয়া রয়েছে। তাই সংগঠনের উন্নয়নের কথা বিবেচনা করে যত দ্রুত সম্ভব বকেয়া পরিশোধ করার চেষ্টা করবেন। ধন্যবাদ।"
 */
export function generateDirectSimDueSms(params: {
  memberName: string;
  money: number | string;
  monthCount: number;
  pastMonthsText?: string;
}): string {
  const memberName = params.memberName.trim() || 'সদস্য';
  const money = params.money !== '' && params.money !== undefined ? params.money : '০';
  const count = Math.max(1, params.monthCount || 1);

  if (count === 1) {
    return `আসসালামু আলাইকুম সিলেট মানবসেবা সংগঠন এর প্রিয় সদস্য - ${memberName} ভাই, আপনার রানিং মাসের মাসিক চাঁদা মোট - ${money} টাকা বকেয়া রয়েছে। তাই সংগঠনের উন্নয়নের কথা বিবেচনা করে দ্রুত বকেয়া পরিশোধ করার চেষ্টা করবেন। ধন্যবাদ।`;
  }

  // Condition B: month count > 1
  const pastMonths = params.pastMonthsText && params.pastMonthsText.trim()
    ? params.pastMonthsText.trim()
    : toBengaliNumber(count - 1);

  return `আসসালামু আলাইকুম সিলেট মানবসেবা সংগঠন এর প্রিয় সদস্য - ${memberName} ভাই, আপনার রানিং মাস এবং গত ${pastMonths} মাস সহ মোট - ${money} টাকা বকেয়া রয়েছে। তাই সংগঠনের উন্নয়নের কথা বিবেচনা করে যত দ্রুত সম্ভব বকেয়া পরিশোধ করার চেষ্টা করবেন। ধন্যবাদ।`;
}

/**
 * Generates an official Bengali confirmation message for Paid subscriptions.
 */
export function generatePaidConfirmationSms(params: {
  memberName: string;
  amount: number | string;
  month?: string;
  trxId?: string;
  date?: string;
  orgName?: string;
}): string {
  const org = params.orgName || 'সিলেট মানব সেবা সংগঠন';
  const monthText = params.month && params.month.trim() ? `${params.month.trim()} মাসের ` : '';
  const trxText = params.trxId && params.trxId.trim() ? ` (TrxID: ${params.trxId.trim()})` : '';
  
  return `সম্মানিত ${params.memberName.trim()}, ${org}-এ আপনার ${monthText}মাসিক চাঁদা বাবদ ${params.amount}/- টাকা সফলভাবে গৃহীত হয়েছে${trxText}। আপনার আন্তরিক সহযোগিতার জন্য অসংখ্য ধন্যবাদ।\n-${org}`;
}

/**
 * Generates a polite, respectful Bengali reminder message for Due payments with custom months.
 */
export function generateDueReminderSms(params: {
  memberName: string;
  amount: number | string;
  monthsText: string;
  paymentPhone?: string;
  paymentMethods?: string;
  orgName?: string;
}): string {
  const org = params.orgName || 'সিলেট মানব সেবা সংগঠন';
  const months = params.monthsText.trim() ? params.monthsText.trim() : 'চলতি';
  const paymentLine = params.paymentPhone && params.paymentPhone.trim()
    ? `\nচাঁদা পাঠানোর নম্বর (${params.paymentMethods || 'বিকাশ/নগদ'}): ${params.paymentPhone.trim()}`
    : '';

  return `সম্মানিত ${params.memberName.trim()},\n${org}-এ আপনার [${months}]-এর মাসিক চাঁদা বাবদ মোট ${params.amount}/- টাকা বকেয়া রয়েছে। সংগঠনের মানবিক ও সেবামূলক কার্যক্রম গতিশীল রাখতে বকেয়া চাঁদা পরিশোধের জন্য বিনীত অনুরোধ করা হচ্ছে।${paymentLine}\nধন্যবাদ,\n-${org}`;
}

/**
 * Resolves a member's contact phone number from available fields or matching member record.
 */
export function resolveMemberPhone(
  target: { phone?: string; memberName?: string; memberId?: string },
  members: Member[] = []
): string {
  if (target.phone && target.phone.trim()) {
    return target.phone.trim();
  }
  if (target.memberId) {
    const found = members.find(m => m.id === target.memberId);
    if (found?.phone && found.phone.trim()) {
      return found.phone.trim();
    }
  }
  if (target.memberName) {
    const trimmed = target.memberName.trim().toLowerCase();
    const found = members.find(m => m.name.trim().toLowerCase() === trimmed);
    if (found?.phone && found.phone.trim()) {
      return found.phone.trim();
    }
  }
  return '';
}

export const ARREARS_MONTH_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

const BENGALI_DIGITS: Record<string, number> = {
  '০': 0, '১': 1, '২': 2, '৩': 3, '৪': 4,
  '৫': 5, '৬': 6, '৭': 7, '৮': 8, '৯': 9
};

const BENGALI_WORDS_TO_NUM: Record<string, number> = {
  'এক': 1,
  'দুই': 2,
  'তিন': 3,
  'চার': 4,
  'পাঁচ': 5,
  'ছয়': 6,
  'ছয়': 6,
  'সাত': 7,
  'আট': 8,
  'নয়': 9,
  'নয়': 9,
  'দশ': 10,
  'এগার': 11,
  'এগারো': 11,
  'বার': 12,
  'বারো': 12
};

/**
 * Parses Bengali digits, ASCII numbers, or Bengali word numerals to an integer.
 */
export function parseBengaliOrEnglishNumber(val: string): number | null {
  if (!val) return null;
  const trimmed = val.trim();

  if (BENGALI_WORDS_TO_NUM[trimmed] !== undefined) {
    return BENGALI_WORDS_TO_NUM[trimmed];
  }

  let converted = '';
  for (const char of trimmed) {
    if (BENGALI_DIGITS[char] !== undefined) {
      converted += BENGALI_DIGITS[char];
    } else if (/[0-9]/.test(char)) {
      converted += char;
    }
  }

  if (converted) {
    const num = parseInt(converted, 10);
    if (!isNaN(num)) return num;
  }
  return null;
}

/**
 * Extracts and synchronizes the arrears month count from fund entry records.
 * Matches patterns like:
 * - "রানিং মাস সহ গত ৪ মাসের" -> 4 months
 * - "গত ৪ মাসের বকেয়া" -> 4 months
 * - "৪ মাসের বকেয়া" -> 4 months
 * - Comma separated Bengali months -> count of months
 * - Amount-based heuristic (e.g. 2000 tk -> 4 months at 500 tk/month)
 */
export function extractArrearsMonthCount(record: {
  month?: string;
  description?: string;
  notes?: string;
  amount?: number | string;
}): { monthCount: number; pastMonthsText: string } {
  const textParts = [record.month, record.description, record.notes].filter(Boolean) as string[];
  const fullText = textParts.join(' ');

  if (fullText) {
    // 1. "রানিং মাস সহ গত X মাস" or "রানিং মাস এবং গত X মাস"
    // e.g. "রানিং মাস সহ গত ৪ মাসের" -> matches 4
    const runningWithPastMatch = fullText.match(
      /(?:রানিং|চলতি)\s*মাস[^\d০-৯a-zA-Z]*(?:ও|এবং|সহ)?[^\d০-৯a-zA-Z]*গত\s*([০-৯\d]+|এক|দুই|তিন|চার|পাঁচ|ছয়|ছয়|সাত|আট|নয়|নয়|দশ|এগার|এগারো|বার|বারো)\s*মাস/i
    );
    if (runningWithPastMatch && runningWithPastMatch[1]) {
      const parsed = parseBengaliOrEnglishNumber(runningWithPastMatch[1]);
      if (parsed && parsed >= 1 && parsed <= 36) {
        return {
          monthCount: parsed,
          pastMonthsText: parsed > 1 ? toBengaliNumber(parsed - 1) : ''
        };
      }
    }

    // 2. "গত X মাস(ের)?"
    // e.g. "গত ৪ মাসের বকেয়া", "গত ৩ মাস"
    const pastMatch = fullText.match(
      /গত\s*([০-৯\d]+|এক|দুই|তিন|চার|পাঁচ|ছয়|ছয়|সাত|আট|নয়|নয়|দশ|এগার|এগারো|বার|বারো)\s*মাস/i
    );
    if (pastMatch && pastMatch[1]) {
      const parsed = parseBengaliOrEnglishNumber(pastMatch[1]);
      if (parsed && parsed >= 1 && parsed <= 36) {
        return {
          monthCount: parsed,
          pastMonthsText: parsed > 1 ? toBengaliNumber(parsed - 1) : ''
        };
      }
    }

    // 3. "X মাস(ের)? বকেয়া" or "X মাস(ের)? চাঁদা" or "X মাস(ের)?"
    // Ignore 4-digit years like 2026 or ২০২৬
    const monthsMatch = fullText.match(
      /(?<![০-৯\d])([০-৯\d]{1,2}|এক|দুই|তিন|চার|পাঁচ|ছয়|ছয়|সাত|আট|নয়|নয়|দশ|এগার|এগারো|বার|বারো)\s*মাস/i
    );
    if (monthsMatch && monthsMatch[1]) {
      const parsed = parseBengaliOrEnglishNumber(monthsMatch[1]);
      if (parsed && parsed >= 1 && parsed <= 36) {
        return {
          monthCount: parsed,
          pastMonthsText: parsed > 1 ? toBengaliNumber(parsed - 1) : ''
        };
      }
    }

    // 4. English "X months" or "X month"
    const engMatch = fullText.match(/(\d{1,2})\s*months?/i);
    if (engMatch && engMatch[1]) {
      const parsed = parseInt(engMatch[1], 10);
      if (parsed >= 1 && parsed <= 36) {
        return {
          monthCount: parsed,
          pastMonthsText: parsed > 1 ? toBengaliNumber(parsed - 1) : ''
        };
      }
    }

    // 5. Multiple named Bengali months listed together (e.g. "জানুয়ারি, ফেব্রুয়ারি, মার্চ")
    const bengaliMonthNames = [
      'বৈশাখ', 'জ্যৈষ্ঠ', 'আষাঢ়', 'শ্রাবণ', 'ভাদ্র', 'আশ্বিন', 'কার্তিক', 'অগ্রহায়ণ', 'পৌষ', 'মাঘ', 'ফাল্গুন', 'চৈত্র',
      'জানুয়ারি', 'জানুয়ারি', 'ফেব্রুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'আগষ্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
    ];
    const foundMonths = new Set<string>();
    for (const mName of bengaliMonthNames) {
      if (fullText.includes(mName)) {
        foundMonths.add(mName);
      }
    }
    if (foundMonths.size >= 2) {
      const count = foundMonths.size;
      return {
        monthCount: count,
        pastMonthsText: toBengaliNumber(count - 1)
      };
    }

    // 6. Direct numeric value in month field alone (e.g. "4" or "৪")
    if (record.month) {
      const trimmedMonth = record.month.trim();
      if (/^[০-৯\d]{1,2}$/.test(trimmedMonth)) {
        const parsed = parseBengaliOrEnglishNumber(trimmedMonth);
        if (parsed && parsed >= 1 && parsed <= 36) {
          return {
            monthCount: parsed,
            pastMonthsText: parsed > 1 ? toBengaliNumber(parsed - 1) : ''
          };
        }
      }
    }
  }

  // 7. Amount-based heuristic (standard monthly subscription is typically 500 tk)
  if (record.amount) {
    const numericAmount = typeof record.amount === 'number' ? record.amount : parseInt(String(record.amount), 10);
    if (!isNaN(numericAmount) && numericAmount >= 1000 && numericAmount <= 12000 && numericAmount % 500 === 0) {
      const derived = Math.floor(numericAmount / 500);
      if (derived >= 2 && derived <= 12) {
        return {
          monthCount: derived,
          pastMonthsText: toBengaliNumber(derived - 1)
        };
      }
    }
  }

  return {
    monthCount: 1,
    pastMonthsText: ''
  };
}

