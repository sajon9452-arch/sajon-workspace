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
  ADMIN_PIN: 'pms_admin_pin'
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

// 2. Members
export function loadMembers(): Member[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MEMBERS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return sortMembersOldestFirst(parsed);
      }
    }
  } catch (e) {
    console.error(e);
  }
  return sortMembersOldestFirst(INITIAL_MEMBERS);
}

export function saveMembers(members: Member[]) {
  try {
    const sorted = sortMembersOldestFirst(members);
    localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(sorted));
    notifyStorageChange(STORAGE_KEYS.MEMBERS, sorted);
  } catch (e) {
    console.error(e);
  }
}

// 3. Blood Donors
export function loadDonors(): BloodDonor[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DONORS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error(e);
  }
  return INITIAL_DONORS;
}

export function saveDonors(donors: BloodDonor[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.DONORS, JSON.stringify(donors));
    notifyStorageChange(STORAGE_KEYS.DONORS, donors);
  } catch (e) {
    console.error(e);
  }
}

// 4. Funds
export function loadFunds(): FundRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.FUNDS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error(e);
  }
  return INITIAL_FUNDS;
}

export function saveFunds(funds: FundRecord[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.FUNDS, JSON.stringify(funds));
    notifyStorageChange(STORAGE_KEYS.FUNDS, funds);
  } catch (e) {
    console.error(e);
  }
}

// 5. Notices
export function loadNotices(): Notice[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.NOTICES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error(e);
  }
  return INITIAL_NOTICES;
}

export function saveNotices(notices: Notice[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.NOTICES, JSON.stringify(notices));
    notifyStorageChange(STORAGE_KEYS.NOTICES, notices);
  } catch (e) {
    console.error(e);
  }
}

// 6. Home Slides
export function loadHomeSlides(): HomeSlide[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.HOME_SLIDES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error(e);
  }
  return INITIAL_HOME_SLIDES;
}

export function saveHomeSlides(slides: HomeSlide[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.HOME_SLIDES, JSON.stringify(slides));
    notifyStorageChange(STORAGE_KEYS.HOME_SLIDES, slides);
  } catch (e) {
    console.error(e);
  }
}

// 7. Humanitarian Activities
export function loadHumanitarianActivities(): HumanitarianActivity[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.HUMANITARIAN_ACTIVITIES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error(e);
  }
  return INITIAL_HUMANITARIAN_ACTIVITIES;
}

export function saveHumanitarianActivities(activities: HumanitarianActivity[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.HUMANITARIAN_ACTIVITIES, JSON.stringify(activities));
    notifyStorageChange(STORAGE_KEYS.HUMANITARIAN_ACTIVITIES, activities);
  } catch (e) {
    console.error(e);
  }
}

// 8. Organization Rules
export function loadOrganizationRules(): OrganizationRule[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ORGANIZATION_RULES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error(e);
  }
  return INITIAL_ORGANIZATION_RULES;
}

export function saveOrganizationRules(rules: OrganizationRule[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.ORGANIZATION_RULES, JSON.stringify(rules));
    notifyStorageChange(STORAGE_KEYS.ORGANIZATION_RULES, rules);
  } catch (e) {
    console.error(e);
  }
}

// 9. Support Reports
export function loadSupportReports(): SupportReportItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SUPPORT_REPORTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error(e);
  }
  return INITIAL_SUPPORT_REPORTS;
}

export function saveSupportReports(reports: SupportReportItem[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.SUPPORT_REPORTS, JSON.stringify(reports));
    notifyStorageChange(STORAGE_KEYS.SUPPORT_REPORTS, reports);
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
