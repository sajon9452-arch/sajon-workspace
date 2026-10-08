import { sanitizePhone, toBengaliNumber } from './helpers';

export interface PaidSmsPayload {
  memberName: string;
  months?: string;
  money: number;
}

export interface DueSmsPayload {
  memberName: string;
  money: number;
  monthCount?: number;
  pastMonthsText?: string;
}

export function generateDirectSimPaidSms(payload: PaidSmsPayload): string {
  const { memberName, months = 'চলতি', money } = payload;
  return `সিলেট মানব সেবা সংগঠন: প্রিয় ${memberName}, আপনার ${months} মাসের চাঁদা বাবদ ৳${toBengaliNumber(money)} সফলভাবে জমা হয়েছে। মানবতার পাশে থাকায় ধন্যবাদ।`;
}

export function generateDirectSimDueSms(payload: DueSmsPayload): string {
  const { memberName, money, monthCount = 1, pastMonthsText } = payload;
  const monthDesc = pastMonthsText ? `(${pastMonthsText})` : `${toBengaliNumber(monthCount)} মাসের`;
  return `সিলেট মানব সেবা সংগঠন: প্রিয় ${memberName}, আপনার ${monthDesc} মাসিক চাঁদা বাবদ মোট ৳${toBengaliNumber(money)} বকেয়া রয়েছে। সংগঠনের ফান্ডে চাঁদা পরিশোধ করার অনুরোধ জানাচ্ছি।`;
}

export function triggerDirectSimSms(phone: string, text: string) {
  const clean = sanitizePhone(phone);
  if (!clean) return;
  const encoded = encodeURIComponent(text);
  // Safe mobile SMS intent URL
  const smsUrl = `sms:${clean}?body=${encoded}`;
  try {
    window.location.href = smsUrl;
  } catch (e) {
    console.error('SMS launch error:', e);
  }
}
