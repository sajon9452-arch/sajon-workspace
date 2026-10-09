import { 
  Member, 
  BloodDonor, 
  Notice, 
  FundRecord, 
  OrganizationProfile, 
  SupportReportItem, 
  HomeSlide, 
  HumanitarianActivity, 
  OrganizationRule,
  PaymentGatewayConfig 
} from '../types';
import { 
  INITIAL_ORG_PROFILE, 
  INITIAL_MEMBERS, 
  INITIAL_DONORS, 
  INITIAL_NOTICES, 
  INITIAL_FUNDS, 
  INITIAL_HOME_SLIDES, 
  INITIAL_HUMANITARIAN_ACTIVITIES, 
  INITIAL_ORGANIZATION_RULES, 
  INITIAL_SUPPORT_REPORTS, 
  INITIAL_PAYMENT_CONFIG 
} from '../data/initialData';
import { sortMembersOldestFirst } from './helpers';

const STORAGE_KEYS = {
  PROFILE: 'pms_org_profile',
  MEMBERS: 'pms_members_list',
  DONORS: 'pms_blood_donors',
  NOTICES: 'pms_notices',
  FUNDS: 'pms_fund_records',
  HOME_SLIDES: 'pms_home_slides',
  HUMANITARIAN_ACTIVITIES: 'pms_humanitarian_activities',
  ORGANIZATION_RULES: 'pms_organization_rules',
  SUPPORT_REPORTS: 'pms_support_reports',
  PAYMENT_SETTINGS: 'pms_payment_settings',
  MANUAL_TOTAL_BALANCE: 'pms_manual_total_balance',
  ADMIN_PIN: 'pms_admin_pin',
  PERMANENTLY_DELETED: 'pms_permanently_deleted_records'
};

export const PMS_SYNC_EVENT = 'pms_local_sync';

export function notifyStorageChange(key: string, data?: any) {
  if (typeof window === 'undefined') return;
  try {
    window.dispatchEvent(new CustomEvent(PMS_SYNC_EVENT, { detail: { key, data } }));
  } catch (e) {
    // ignore
  }
}

// Permanent Deletion Registry: Guarantees deleted items can NEVER be revived under any circumstance
export function getPermanentlyDeletedIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PERMANENTLY_DELETED);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error(e);
  }
  return [];
}

export function markIdAsPermanentlyDeleted(id: string) {
  if (!id) return;
  try {
    const current = getPermanentlyDeletedIds();
    if (!current.includes(id)) {
      current.push(id);
      localStorage.setItem(STORAGE_KEYS.PERMANENTLY_DELETED, JSON.stringify(current));
    }
  } catch (e) {
    console.error(e);
  }
}

export function isIdPermanentlyDeleted(id: string): boolean {
  if (!id) return false;
  return getPermanentlyDeletedIds().includes(id);
}

// 1. Organization Profile
export function loadOrgProfile(): OrganizationProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PROFILE);
    if (raw) return { ...INITIAL_ORG_PROFILE, ...JSON.parse(raw) };
  } catch (e) {
    console.error(e);
  }
  return INITIAL_ORG_PROFILE;
}

export function saveOrgProfile(profile: OrganizationProfile) {
  try {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
    notifyStorageChange(STORAGE_KEYS.PROFILE, profile);
  } catch (e) {
    console.error(e);
  }
}

// 2. Members (Strictly dynamic: Never restores dummy records)
export function loadMembers(): Member[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MEMBERS);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return sortMembersOldestFirst(parsed.filter(m => !isIdPermanentlyDeleted(m.id)));
      }
    }
  } catch (e) {
    console.error(e);
  }
  return [];
}

export function saveMembers(members: Member[]) {
  try {
    const sorted = sortMembersOldestFirst(members.filter(m => !isIdPermanentlyDeleted(m.id)));
    localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(sorted));
    notifyStorageChange(STORAGE_KEYS.MEMBERS, sorted);
  } catch (e) {
    console.error(e);
  }
}

// 3. Blood Donors (Strictly dynamic: Never restores dummy records)
export function loadDonors(): BloodDonor[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DONORS);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter(d => !isIdPermanentlyDeleted(d.id));
      }
    }
  } catch (e) {
    console.error(e);
  }
  return [];
}

export function saveDonors(donors: BloodDonor[]) {
  try {
    const filtered = donors.filter(d => !isIdPermanentlyDeleted(d.id));
    localStorage.setItem(STORAGE_KEYS.DONORS, JSON.stringify(filtered));
    notifyStorageChange(STORAGE_KEYS.DONORS, filtered);
  } catch (e) {
    console.error(e);
  }
}

// 4. Funds (Strictly dynamic: Never restores dummy records)
export function loadFunds(): FundRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.FUNDS);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter(f => !isIdPermanentlyDeleted(f.id));
      }
    }
  } catch (e) {
    console.error(e);
  }
  return [];
}

export function saveFunds(funds: FundRecord[]) {
  try {
    const filtered = funds.filter(f => !isIdPermanentlyDeleted(f.id));
    localStorage.setItem(STORAGE_KEYS.FUNDS, JSON.stringify(filtered));
    notifyStorageChange(STORAGE_KEYS.FUNDS, filtered);
  } catch (e) {
    console.error(e);
  }
}

// 5. Notices (Strictly dynamic: Never restores dummy records)
export function loadNotices(): Notice[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.NOTICES);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter(n => !isIdPermanentlyDeleted(n.id));
      }
    }
  } catch (e) {
    console.error(e);
  }
  return [];
}

export function saveNotices(notices: Notice[]) {
  try {
    const filtered = notices.filter(n => !isIdPermanentlyDeleted(n.id));
    localStorage.setItem(STORAGE_KEYS.NOTICES, JSON.stringify(filtered));
    notifyStorageChange(STORAGE_KEYS.NOTICES, filtered);
  } catch (e) {
    console.error(e);
  }
}

// 6. Home Slides (Strictly dynamic: Never restores dummy records)
export function loadHomeSlides(): HomeSlide[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.HOME_SLIDES);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter(s => !isIdPermanentlyDeleted(s.id));
      }
    }
  } catch (e) {
    console.error(e);
  }
  return [];
}

export function saveHomeSlides(slides: HomeSlide[]) {
  try {
    const filtered = slides.filter(s => !isIdPermanentlyDeleted(s.id));
    localStorage.setItem(STORAGE_KEYS.HOME_SLIDES, JSON.stringify(filtered));
    notifyStorageChange(STORAGE_KEYS.HOME_SLIDES, filtered);
  } catch (e) {
    console.error(e);
  }
}

// 7. Humanitarian Activities (Strictly dynamic: Never restores dummy records)
export function loadHumanitarianActivities(): HumanitarianActivity[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.HUMANITARIAN_ACTIVITIES);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter(a => !isIdPermanentlyDeleted(a.id));
      }
    }
  } catch (e) {
    console.error(e);
  }
  return [];
}

export function saveHumanitarianActivities(activities: HumanitarianActivity[]) {
  try {
    const filtered = activities.filter(a => !isIdPermanentlyDeleted(a.id));
    localStorage.setItem(STORAGE_KEYS.HUMANITARIAN_ACTIVITIES, JSON.stringify(filtered));
    notifyStorageChange(STORAGE_KEYS.HUMANITARIAN_ACTIVITIES, filtered);
  } catch (e) {
    console.error(e);
  }
}

// 8. Organization Rules (Strictly dynamic: Never restores dummy records)
export function loadOrganizationRules(): OrganizationRule[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ORGANIZATION_RULES);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter(r => !isIdPermanentlyDeleted(r.id));
      }
    }
  } catch (e) {
    console.error(e);
  }
  return [];
}

export function saveOrganizationRules(rules: OrganizationRule[]) {
  try {
    const filtered = rules.filter(r => !isIdPermanentlyDeleted(r.id));
    localStorage.setItem(STORAGE_KEYS.ORGANIZATION_RULES, JSON.stringify(filtered));
    notifyStorageChange(STORAGE_KEYS.ORGANIZATION_RULES, filtered);
  } catch (e) {
    console.error(e);
  }
}

// 9. Support Reports (Strictly dynamic: Never restores dummy records)
export function loadSupportReports(): SupportReportItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SUPPORT_REPORTS);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter(s => !isIdPermanentlyDeleted(s.id));
      }
    }
  } catch (e) {
    console.error(e);
  }
  return [];
}

export function saveSupportReports(reports: SupportReportItem[]) {
  try {
    const filtered = reports.filter(s => !isIdPermanentlyDeleted(s.id));
    localStorage.setItem(STORAGE_KEYS.SUPPORT_REPORTS, JSON.stringify(filtered));
    notifyStorageChange(STORAGE_KEYS.SUPPORT_REPORTS, filtered);
  } catch (e) {
    console.error(e);
  }
}

// 10. Payment Gateway Settings
export function loadPaymentSettings(): PaymentGatewayConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PAYMENT_SETTINGS);
    if (raw) return { ...INITIAL_PAYMENT_CONFIG, ...JSON.parse(raw) };
  } catch (e) {
    console.error(e);
  }
  return INITIAL_PAYMENT_CONFIG;
}

export function savePaymentSettings(settings: PaymentGatewayConfig) {
  try {
    localStorage.setItem(STORAGE_KEYS.PAYMENT_SETTINGS, JSON.stringify(settings));
    notifyStorageChange(STORAGE_KEYS.PAYMENT_SETTINGS, settings);
  } catch (e) {
    console.error(e);
  }
}

// 11. Manual Total Balance Override
export function loadManualTotalBalance(): number | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MANUAL_TOTAL_BALANCE);
    if (raw !== null) {
      const parsed = parseFloat(raw);
      return isNaN(parsed) ? null : parsed;
    }
  } catch (e) {
    console.error(e);
  }
  return null;
}

export function saveManualTotalBalance(amount: number | null) {
  try {
    if (amount === null) {
      localStorage.removeItem(STORAGE_KEYS.MANUAL_TOTAL_BALANCE);
    } else {
      localStorage.setItem(STORAGE_KEYS.MANUAL_TOTAL_BALANCE, amount.toString());
    }
    notifyStorageChange(STORAGE_KEYS.MANUAL_TOTAL_BALANCE, amount);
  } catch (e) {
    console.error(e);
  }
}

// 12. Admin PIN
export function loadAdminPin(): string {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ADMIN_PIN);
    if (raw) return raw;
  } catch (e) {
    console.error(e);
  }
  return '1234';
}

export function saveAdminPin(pin: string) {
  try {
    localStorage.setItem(STORAGE_KEYS.ADMIN_PIN, pin);
  } catch (e) {
    console.error(e);
  }
}
