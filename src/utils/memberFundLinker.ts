import { Member, FundRecord } from '../types';
import { normalizeBengaliName, sanitizePhone } from './helpers';

/**
 * Searches and resolves a member from directory by memberId, name, or phone
 */
export function findMemberInDirectory(
  query: { memberId?: string; memberName?: string; phone?: string },
  members: Member[]
): Member | null {
  if (!Array.isArray(members) || members.length === 0) return null;

  // 1. Direct ID match
  if (query.memberId) {
    const byId = members.find(m => m.id === query.memberId);
    if (byId) return byId;
  }

  // 2. Normalized Name match
  if (query.memberName && query.memberName.trim()) {
    const targetNorm = normalizeBengaliName(query.memberName);
    const byName = members.find(m => normalizeBengaliName(m.name) === targetNorm);
    if (byName) return byName;
  }

  // 3. Sanitized Phone match
  if (query.phone && query.phone.trim()) {
    const targetPhone = sanitizePhone(query.phone);
    if (targetPhone.length >= 8) {
      const byPhone = members.find(m => sanitizePhone(m.phone) === targetPhone);
      if (byPhone) return byPhone;
    }
  }

  return null;
}

/**
 * Resolves verified phone number for a member from directory
 */
export function resolveMemberPhone(
  query: { memberId?: string; memberName?: string; phone?: string },
  members: Member[]
): string {
  const member = findMemberInDirectory(query, members);
  if (member && member.phone) {
    return member.phone;
  }
  return query.phone || '';
}

/**
 * Automatically synchronizes all members (General & Executive Committee)
 * with the Fund Management records.
 *
 * 1. Ensures EVERY member in the central Member List has a linked FundRecord via memberId.
 * 2. Strictly auto-syncs Identity details (Name, Phone, Designation) from the Member List.
 * 3. 100% PRESERVES all Admin-controlled Financial data:
 *    Payment Status, exact Paid/Due amounts, Paid/Due months, reference month, date, and notes.
 * 4. Automatically removes orphaned fund cards if a member was deleted from the central Member List.
 */
export function autoSyncMembersToFunds(
  members: Member[],
  existingFunds: FundRecord[]
): FundRecord[] {
  if (!Array.isArray(members) || members.length === 0) {
    return existingFunds || [];
  }

  const currentDate = new Date().toISOString().split('T')[0];
  const safeExisting = Array.isArray(existingFunds) ? existingFunds : [];
  const matchedFundIds = new Set<string>();

  // Map each member from the central Member List to their subscription fund record
  const syncedMemberFunds = members.map(member => {
    if (!member || !member.id) return null;

    // 1. Primary Match: unique memberId
    let matched = safeExisting.find(f => f && f.memberId === member.id && !matchedFundIds.has(f.id));

    // 2. Secondary Match: id constructed as "fund-member-${member.id}"
    if (!matched) {
      matched = safeExisting.find(f => f && f.id === `fund-member-${member.id}` && !matchedFundIds.has(f.id));
    }

    // 3. Fallback: sanitized phone match
    if (!matched && member.phone) {
      const sanitizedMemPhone = sanitizePhone(member.phone);
      if (sanitizedMemPhone.length >= 8) {
        matched = safeExisting.find(f => f && f.phone && sanitizePhone(f.phone) === sanitizedMemPhone && !matchedFundIds.has(f.id));
      }
    }

    // 4. Fallback: normalized Bengali name match
    if (!matched && member.name) {
      const normMemName = normalizeBengaliName(member.name);
      matched = safeExisting.find(f => f && f.memberName && normalizeBengaliName(f.memberName) === normMemName && !matchedFundIds.has(f.id));
    }

    const memberDesignation = member.designation || (member.isExecutive ? 'কার্যকরী কমিটি সদস্য' : 'সাধারণ সদস্য');
    const memberPhone = member.phone || matched?.phone || '';

    if (matched) {
      matchedFundIds.add(matched.id);
      // Strictly auto-sync identity while 100% preserving admin financial settings
      return {
        ...matched,
        id: matched.id || `fund-member-${member.id}`,
        memberId: member.id,
        memberName: member.name,
        phone: memberPhone,
        designation: memberDesignation,
        status: matched.status || 'Due',
        amount: typeof matched.amount === 'number' && !isNaN(matched.amount) ? matched.amount : 500,
        paidAmount: matched.paidAmount !== undefined ? matched.paidAmount : (matched.status === 'Paid' ? matched.amount : 0),
        dueAmount: matched.dueAmount !== undefined ? matched.dueAmount : (matched.status === 'Due' ? matched.amount : 0),
        paidMonths: matched.paidMonths !== undefined ? matched.paidMonths : (matched.status === 'Paid' ? (matched.month || 'মার্চ ২০২৬') : ''),
        dueMonths: matched.dueMonths !== undefined ? matched.dueMonths : (matched.status === 'Due' ? (matched.month || 'মার্চ ২০২৬') : ''),
        month: matched.month || 'মার্চ ২০২৬',
        date: matched.date || currentDate,
        type: matched.type || 'income',
        category: matched.category || 'মাসিক চাঁদা',
        description: matched.description || 'মাসিক নিয়মিত চাঁদা'
      } as FundRecord;
    } else {
      // Auto-populate fund entry for this member linked via Member ID
      return {
        id: `fund-member-${member.id}`,
        memberId: member.id,
        memberName: member.name,
        phone: memberPhone,
        designation: memberDesignation,
        amount: 500,
        status: 'Due',
        type: 'income',
        date: currentDate,
        month: 'মার্চ ২০২৬',
        paidMonths: '',
        dueMonths: 'মার্চ ২০২৬',
        paidAmount: 0,
        dueAmount: 500,
        description: 'মাসিক নিয়মিত চাঁদা',
        category: 'মাসিক চাঁদা',
        notes: memberDesignation
      } as FundRecord;
    }
  }).filter((f): f is FundRecord => f !== null);

  // Preserve any general expense or non-member records
  const expenseOrGeneralFunds = safeExisting.filter(f => f && f.status === 'Expense' && !matchedFundIds.has(f.id));

  return [...syncedMemberFunds, ...expenseOrGeneralFunds];
}
