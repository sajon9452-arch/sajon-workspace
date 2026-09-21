import { Member } from '../types';
import { sanitizePhoneForSms, buildDirectSimSmsUrl, triggerDirectSimSms } from './smsHelper';

/**
 * Designation-Based Auto-Classification:
 * - If the designation contains or equals "সদস্য" (e.g., সাধারণ সদস্য, সদস্য, প্রবাসী সদস্য),
 *   the system classifies that person as a 'সাধারণ সদস্য' (General Member).
 * - If the designation is anything else (e.g., সভাপতি, সাধারণ সম্পাদক, সহ-ক্রীড়া সম্পাদক, সাংগঠনিক সম্পাদক ইত্যাদি),
 *   the system automatically classifies them as part of the 'কার্যকরী কমিটি' (Executive Committee).
 */
export function isGeneralMemberByDesignation(designation?: string): boolean {
  if (!designation) return true; // Default to general member if empty
  const des = designation.trim();
  if (!des) return true;
  // If the designation contains or equals "সদস্য"
  return des.includes('সদস্য') || des.toLowerCase().includes('member');
}

/**
 * Checks if a member belongs to the Executive Committee (কার্যকরী কমিটি) based on Designation
 * - Target ONLY members whose designation is NOT 'সদস্য' / does NOT contain 'সদস্য'
 */
export function isExecutiveCommitteeMember(member: { designation?: string } | null | undefined): boolean {
  if (!member) return false;
  const des = (member.designation || '').trim();
  if (!des) return false;
  return !isGeneralMemberByDesignation(des);
}

export function getMemberCommitteeCategory(designation?: string): {
  isExecutive: boolean;
  categoryLabel: 'কার্যকরী কমিটি' | 'সাধারণ সদস্য';
  categoryTitle: string;
} {
  const isExec = !isGeneralMemberByDesignation(designation);
  return {
    isExecutive: isExec,
    categoryLabel: isExec ? 'কার্যকরী কমিটি' : 'সাধারণ সদস্য',
    categoryTitle: isExec ? 'কার্যকরী কমিটি (Executive Committee)' : 'সাধারণ সদস্য (General Member)'
  };
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
