import { Member } from '../types';
import { sanitizePhoneForSms, buildDirectSimSmsUrl, triggerDirectSimSms } from './smsHelper';

/**
 * Checks if a member belongs to the Executive Committee (কার্যকরী কমিটি)
 */
export function isExecutiveCommitteeMember(member: Member): boolean {
  if (!member) return false;
  if (member.isExecutive === true) return true;
  if (member.isExecutive === false) return false;
  if (member.category === 'কার্যকরী কমিটি' || member.committeeType === 'executive') return true;
  if (member.category === 'সাধারণ সদস্য' || member.committeeType === 'general') return false;
  
  const des = (member.designation || '').trim();
  if (!des) return false;
  
  // Explicitly general member tags
  if (des === 'সদস্য' || des === 'সাধারণ সদস্য' || des === 'প্রবাসী সদস্য') {
    return false;
  }
  
  if (/^(সাধারণ\s*সদস্য|সদস্য|প্রবাসী\s*সদস্য)$/i.test(des)) {
    return false;
  }

  // Executive keywords across Bangladeshi organizations
  const executiveKeywords = [
    'কার্যকরী',
    'কার্যনির্বাহী',
    'নির্বাহী',
    'সভাপতি',
    'সম্পাদক',
    'কোষাধ্যক্ষ',
    'ক্যাশিয়ার',
    'সাংগঠনিক',
    'দপ্তর',
    'প্রচার',
    'সমন্বয়ক',
    'উপদেষ্টা',
    'পরিচালক',
    'আহ্বায়ক',
    'আহবায়ক',
    'সহ-সভাপতি',
    'সহ সভাপতি',
    'যুগ্ম',
    'অর্থ',
    'ত্রাণ',
    'এাণ', // common Bengali typing variant of ত্রাণ
    'কল্যাণ',
    'ক্রীড়া',
    'সাংস্কৃতিক',
    'সমাজসেবা',
    'শিক্ষা',
    'স্বাস্থ্য',
    'তথ্য ও প্রযুক্তি',
    'আইন',
    'ধর্ম',
    'সদস্য সচিব',
    'মহাসচিব',
    'executive',
    'president',
    'secretary',
    'advisor',
    'treasurer',
    'director',
    'coordinator'
  ];

  return executiveKeywords.some(kw => des.includes(kw));
}

export interface MeetingSmsRecipient {
  id: string;
  name: string;
  designation: string;
  phone: string;
  cleanPhone: string;
  isValidPhone: boolean;
  isExecutive: boolean;
  selected: boolean;
  status: 'idle' | 'sending' | 'sent' | 'skipped' | 'failed';
}

/**
 * Categorizes and builds recipients list according to meeting type
 * Without any hardcoded limits - completely dynamic
 */
export function buildMeetingRecipients(
  meetingType: 'কার্যকরী কমিটির মিটিং' | 'কার্যকরী কমিটি ও সাধারণ সদস্য উভয়ের মিটিং' | string,
  members: Member[]
): {
  recipients: MeetingSmsRecipient[];
  executiveCount: number;
  generalCount: number;
  validPhoneCount: number;
  missingPhoneCount: number;
} {
  const isExecutiveOnly = !meetingType?.includes('সাধারণ') && !meetingType?.includes('উভয়') && (
    meetingType === 'কার্যকরী কমিটির মিটিং' || meetingType?.includes('কার্যকরী')
  );

  // Filter out any invalid items - unconstrained dynamic members list
  const activeMembers = (members || []).filter(m => m && m.id && m.name);

  // Classify all members dynamically
  const allCategorized: MeetingSmsRecipient[] = activeMembers.map(m => {
    const clean = sanitizePhoneForSms(m.phone || '');
    const isValid = Boolean(clean && clean.length >= 10);
    const isExec = isExecutiveCommitteeMember(m);
    
    return {
      id: m.id,
      name: m.name.trim(),
      designation: m.designation?.trim() || (isExec ? 'কার্যকরী সদস্য' : 'সাধারণ সদস্য'),
      phone: m.phone?.trim() || '',
      cleanPhone: clean,
      isValidPhone: isValid,
      isExecutive: isExec,
      selected: isValid,
      status: 'idle' as const
    };
  });

  const executiveCount = allCategorized.filter(m => m.isExecutive).length;
  const generalCount = allCategorized.filter(m => !m.isExecutive).length;

  // Strict Category-Based Dynamic Filtering:
  // When 'কার্যকরী কমিটির মিটিং' is selected, target ONLY executive committee members (no general members)
  // When 'কার্যকরী কমিটি ও সাধারণ সদস্য উভয়ের মিটিং' is selected, target all members (Executive + General)
  const targeted: MeetingSmsRecipient[] = isExecutiveOnly
    ? allCategorized.filter(m => m.isExecutive)
    : allCategorized;

  const validPhoneCount = targeted.filter(t => t.isValidPhone).length;
  const missingPhoneCount = targeted.filter(t => !t.isValidPhone).length;

  return {
    recipients: targeted,
    executiveCount,
    generalCount,
    validPhoneCount,
    missingPhoneCount
  };
}

/**
 * Builds native multi-recipient SMS URL
 */
export function buildGroupSmsUrl(phones: string[], body: string): string {
  const isIOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent || '');
  const separator = isIOS ? '&' : '?';
  const delimiter = isIOS ? ',' : ',';
  const cleanList = phones.map(p => sanitizePhoneForSms(p)).filter(Boolean);
  const joinedPhones = cleanList.join(delimiter);

  return `sms:${joinedPhones}${separator}body=${encodeURIComponent(body)}`;
}

/**
 * Triggers native SIM SMS for a specific phone and text
 */
export function sendSmsToRecipient(phone: string, text: string): boolean {
  return triggerDirectSimSms(phone, text);
}
