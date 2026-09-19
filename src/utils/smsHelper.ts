import { Member } from '../types';

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
  const org = params.orgName || 'সিলট মানব সেবা সংগঠন';
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
  const org = params.orgName || 'সিলট মানব সেবা সংগঠন';
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
