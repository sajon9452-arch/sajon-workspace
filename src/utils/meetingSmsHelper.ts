import { Member } from '../types';
import {
  sanitizePhone,
  buildUniversalSmsUri,
  triggerNativeSms,
  triggerNativeGroupSms
} from './nativeIntentHelper';
import { sanitizePhoneForSms, buildDirectSimSmsUrl, triggerDirectSimSms } from './smsHelper';
import { loadNotices } from './storage';
import {
  generateExecutiveMeetingNotice,
  generateJointMeetingNotice,
  DEFAULT_MEETING_FIELDS
} from './noticeTemplates';

export { triggerNativeGroupSms };

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

/**
 * Auto-resolves the pre-configured meeting SMS template body for a member.
 * Dynamically looks up any active published meeting notice from storage, or falls back to
 * the official Executive Committee / Joint Meeting notice template based on member designation.
 */
export function getPreconfiguredMeetingSms(member?: Partial<Member> | null): string {
  try {
    if (typeof window !== 'undefined') {
      const notices = loadNotices();
      if (Array.isArray(notices) && notices.length > 0) {
        const isExec = isExecutiveCommitteeMember(member);

        // 1. Look for matching meeting notice in notices list
        const meetingNotice = notices.find(n => {
          if (!n || !n.noticeText) return false;
          const text = n.noticeText.trim();
          if (!text) return false;
          const cat = (n.category || '').trim();
          const title = (n.title || '').trim();

          if (isExec) {
            if (
              cat === 'কার্যকরী কমিটির মিটিং' ||
              title.includes('কার্যকরী') ||
              text.includes('কার্যকরী কমিটির সভা') ||
              text.includes('কার্যকরী কমিটির মিটিং')
            ) {
              return true;
            }
          }
          return cat.includes('মিটিং') || title.includes('মিটিং') || title.includes('সভা') || text.includes('মিটিং');
        });

        if (meetingNotice && meetingNotice.noticeText && meetingNotice.noticeText.trim().length > 15) {
          return meetingNotice.noticeText.trim();
        }
      }
    }
  } catch (e) {
    // Fallback to official templates
  }

  // 2. Official pre-configured meeting templates
  const isExec = isExecutiveCommitteeMember(member);
  if (isExec) {
    return generateExecutiveMeetingNotice(DEFAULT_MEETING_FIELDS);
  }
  return generateJointMeetingNotice(DEFAULT_MEETING_FIELDS);
}

/**
 * Immediately dispatches an individual pre-filled meeting SMS to the target member
 * using the native device SMS application with auto-populated recipient number and message template.
 * Enables one-tap sending for admin while strictly bypassing WebView/browser interference.
 */
export function dispatchPreFilledMemberSms(member: Partial<Member> | null): boolean {
  if (!member || !member.phone) return false;
  const cleanPhone = sanitizePhone(member.phone);
  if (!cleanPhone) return false;
  const templateBody = getPreconfiguredMeetingSms(member);
  return triggerNativeSms(cleanPhone, templateBody);
}

export interface MeetingSmsRecipient {
  id: string;
  serialNo: number;
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
 * Checks whether a given meeting type string refers strictly to Executive Committee members.
 * Supports: 'কার্যকরী কমিটির মিটিং' (Executive only)
 * vs 'যৌথ মিটিং' / 'যৌথ সাধারণ সভা' (Executive + General)
 */
export function isExecutiveMeetingType(meetingType?: string): boolean {
  if (!meetingType) return true;
  const t = meetingType.trim();
  if (t.includes('যৌথ') || t.includes('উভয়') || t.includes('সাধারণ')) {
    return false;
  }
  return t === 'কার্যকরী কমিটির মিটিং' || t.includes('কার্যকরী');
}

/**
 * Categorizes and builds recipients list dynamically according to meeting type and live members in database.
 * Never hardcodes any count - strictly computes from database active members.
 */
export function buildMeetingRecipients(
  meetingType: 'কার্যকরী কমিটির মিটিং' | 'যৌথ মিটিং' | 'কার্যকরী কমিটি ও সাধারণ সদস্য উভয়ের মিটিং' | string,
  members: Member[]
): {
  recipients: MeetingSmsRecipient[];
  executiveCount: number;
  generalCount: number;
  validPhoneCount: number;
  missingPhoneCount: number;
} {
  const isExecutiveOnly = isExecutiveMeetingType(meetingType);

  // Filter out any invalid items - unconstrained dynamic members list
  const activeMembers = (members || []).filter(m => m && m.id && m.name);

  // Classify all members dynamically with their seniority serial number
  const allCategorized: MeetingSmsRecipient[] = activeMembers.map((m, index) => {
    const clean = sanitizePhoneForSms(m.phone || '');
    const isValid = Boolean(clean && clean.length >= 10);
    const isExec = isExecutiveCommitteeMember(m);
    
    return {
      id: m.id,
      serialNo: index + 1,
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

  // Strict Category-Based Dynamic Filtering
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
 * Builds native multi-recipient SMS URL using cross-platform universal standards
 */
export function buildGroupSmsUrl(phones: string[], body: string): string {
  return buildUniversalSmsUri(phones, body);
}

/**
 * Triggers native SIM SMS for a specific phone and text safely without breaking WebViews
 */
export function sendSmsToRecipient(phone: string, text: string): boolean {
  return triggerNativeSms(phone, text);
}

/**
 * Triggers native SIM SMS for multiple recipients at once into the device's native messaging app
 */
export function sendGroupSmsToRecipients(phones: string[], text: string): boolean {
  return triggerNativeGroupSms(phones, text);
}
