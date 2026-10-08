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
 * 1. Ensures NO member is missing: creates an automatic record if absent.
 * 2. Keeps existing records synchronized: updates member name and phone if edited.
 * 3. Preserves all existing records (Paid status, Expenses, etc.).
 */
export function autoSyncMembersToFunds(
  members: Member[],
  existingFunds: FundRecord[]
): FundRecord[] {
  if (!Array.isArray(members) || members.length === 0) {
    return existingFunds || [];
  }

  const result = Array.isArray(existingFunds) ? [...existingFunds] : [];
  const currentDate = new Date().toISOString().split('T')[0];

  members.forEach(member => {
    if (!member || !member.id) return;

    let found = false;
    result.forEach((f, idx) => {
      if (f.status === 'Expense') return;

      const isMatch =
        (f.memberId && f.memberId === member.id) ||
        (f.memberName && normalizeBengaliName(f.memberName) === normalizeBengaliName(member.name)) ||
        (member.phone && f.phone && sanitizePhone(member.phone) === sanitizePhone(f.phone));

      if (isMatch) {
        found = true;
        const targetPhone = member.phone || f.phone || '';
        if (f.memberId !== member.id || f.memberName !== member.name || f.phone !== targetPhone) {
          result[idx] = {
            ...f,
            memberId: member.id,
            memberName: member.name,
            phone: targetPhone
          };
        }
      }
    });

    if (!found) {
      // Auto-populate fund entry for this member so there is NO missing member
      const newFundRecord: FundRecord = {
        id: `fund-member-${member.id}`,
        memberId: member.id,
        memberName: member.name,
        phone: member.phone || '',
        amount: 500,
        status: 'Due',
        type: 'income',
        date: currentDate,
        month: 'মার্চ ২০২৬',
        description: 'মাসিক নিয়মিত চাঁদা',
        category: 'মাসিক চাঁদা',
        notes: member.isExecutive ? 'কার্যকরী কমিটি সদস্য' : 'সাধারণ সদস্য'
      };
      result.push(newFundRecord);
    }
  });

  return result;
}
