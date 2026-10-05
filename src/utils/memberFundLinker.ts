import { Member, FundRecord } from '../types';
import { sanitizePhone } from './nativeIntentHelper';

/**
 * Normalizes Bengali names for robust fuzzy matching across slight spelling/honorific variations
 * e.g., strips "মোঃ", "মো:", "মোহাম্মদ", "মুহাম্মদ", "মাওলানা", "জনাব", "ইঞ্জিনিয়ার", etc.
 */
export function normalizeBengaliName(name: string): string {
  if (!name) return '';
  let cleaned = name.trim().toLowerCase();

  // Strip common Bengali honorifics and prefixes
  const prefixes = [
    /^মো[:\.\s]+/i,
    /^মোঃ\s*/i,
    /^মোহাম্মদ\s*/i,
    /^মুহাম্মদ\s*/i,
    /^মুহা[:\.\s]+/i,
    /^মাওলানা\s*/i,
    /^জনাব\s*/i,
    /^আলহাজ্ব\s*/i,
    /^আলহাজ\s*/i,
    /^হাফেজ\s*/i,
    /^ইঞ্জিনিয়ার\s*/i,
    /^প্রকৌশলী\s*/i,
    /^ডাক্তার\s*/i,
    /^ডা[:\.\s]+/i,
    /^মি[:\.\s]+/i,
    /^ভাই[:\.\s]+/i
  ];

  for (const prefix of prefixes) {
    cleaned = cleaned.replace(prefix, '').trim();
  }

  // Remove parenthesis content e.g. "(সহ-সভাপতি)", "(প্রবাসী)"
  cleaned = cleaned.replace(/\([^)]*\)/g, '').trim();

  // Remove multiple whitespaces and punctuation
  cleaned = cleaned.replace(/[\.,\-_/\\|]/g, ' ').replace(/\s+/g, ' ').trim();

  return cleaned;
}

/**
 * Finds a matching member from the Member List / Executive Committee database.
 * Matches by memberId, exact name, normalized Bengali name, or normalized phone.
 */
export function findMemberInDirectory(
  target: { memberId?: string; memberName?: string; name?: string; phone?: string },
  members: Member[] = []
): Member | null {
  if (!members || members.length === 0) return null;

  // 1. Match by Member ID (highest accuracy)
  if (target.memberId) {
    const found = members.find(m => m.id === target.memberId);
    if (found) return found;
  }

  const queryName = (target.memberName || target.name || '').trim();
  const queryPhone = (target.phone || '').trim();

  // 2. Match by exact name (case-insensitive)
  if (queryName) {
    const lowerQuery = queryName.toLowerCase();
    const exactMatch = members.find(m => m.name.trim().toLowerCase() === lowerQuery);
    if (exactMatch) return exactMatch;

    // 3. Match by normalized Bengali name (handles "মো: কামরুল" vs "মোঃ কামরুল ইসলাম")
    const normQuery = normalizeBengaliName(queryName);
    if (normQuery.length >= 3) {
      const normMatch = members.find(m => {
        const normM = normalizeBengaliName(m.name);
        return normM === normQuery || normM.includes(normQuery) || normQuery.includes(normM);
      });
      if (normMatch) return normMatch;
    }
  }

  // 4. Match by phone number (if phone is provided and at least 6 digits)
  if (queryPhone) {
    const cleanQueryPhone = sanitizePhone(queryPhone);
    if (cleanQueryPhone.length >= 6) {
      const phoneMatch = members.find(m => {
        if (!m.phone) return false;
        const cleanMPhone = sanitizePhone(m.phone);
        return cleanMPhone === cleanQueryPhone || cleanMPhone.endsWith(cleanQueryPhone) || cleanQueryPhone.endsWith(cleanMPhone);
      });
      if (phoneMatch) return phoneMatch;
    }
  }

  return null;
}

export interface LinkedFundMemberInfo {
  linkedMember: Member | null;
  displayName: string;
  displayPhone: string;
  memberId?: string;
  designation?: string;
  isExecutive?: boolean;
  category?: string;
}

/**
 * Dynamically resolves and pulls the up-to-date member name and phone number
 * directly from the Member List / Executive Committee database.
 */
export function resolveLinkedFundData(
  record: { memberId?: string; memberName: string; phone?: string; senderPhone?: string },
  members: Member[] = []
): LinkedFundMemberInfo {
  const linked = findMemberInDirectory(record, members);

  if (linked) {
    return {
      linkedMember: linked,
      displayName: linked.name || record.memberName,
      displayPhone: linked.phone || record.phone || record.senderPhone || '',
      memberId: linked.id,
      designation: linked.designation,
      isExecutive: linked.isExecutive,
      category: linked.category
    };
  }

  return {
    linkedMember: null,
    displayName: record.memberName,
    displayPhone: record.phone || record.senderPhone || '',
    memberId: record.memberId
  };
}
