import { Member, BloodDonor, Notice, FundRecord, OrganizationProfile, PaymentGatewayConfig, SupportReportItem, HomeSlide, HumanitarianActivity, OrganizationRule, CalendarMonthlyBanner } from '../types';
import { INITIAL_MEMBERS, INITIAL_DONORS, INITIAL_NOTICES, INITIAL_FUNDS, INITIAL_ORG_PROFILE, INITIAL_SUPPORT_REPORTS, INITIAL_HOME_SLIDES, INITIAL_HUMANITARIAN_ACTIVITIES, INITIAL_ORGANIZATION_RULES } from '../data/initialData';
import { syncKeyToServer, resetServerDatabase, clearServerDatabase, ServerDatabasePayload } from './serverApi';
import { sortMembersOldestFirst } from './helpers';

export const STORAGE_KEYS = {
  PROFILE: 'pms_profile_v2',
  MEMBERS: 'pms_members_v2',
  DONORS: 'pms_donors_v2',
  NOTICES: 'pms_notices_v2',
  FUNDS: 'pms_funds_v2',
  TOTAL_ORG_BALANCE: 'pms_total_org_balance_v2',
  ADMIN_PIN: 'pms_admin_pin_v2',
  PAYMENT_SETTINGS: 'pms_payment_settings_v2',
  SUPPORT_REPORTS: 'pms_support_reports_v2',
  HOME_SLIDES: 'pms_home_slides_v2',
  HUMANITARIAN_ACTIVITIES: 'pms_humanitarian_activities_v2',
  ORGANIZATION_RULES: 'pms_organization_rules_v2',
  CALENDAR_BANNERS: 'pms_calendar_banners_v2',
  DELETED_SLIDE_IDS: 'pms_deleted_slide_ids_v2',
};

export const PMS_SYNC_CHANNEL_NAME = 'pms_realtime_sync_channel';
export const PMS_SYNC_EVENT_NAME = 'pms_data_updated';

// Cross-tab Broadcast Channel initialization
let broadcastChannel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && typeof BroadcastChannel !== 'undefined') {
  try {
    broadcastChannel = new BroadcastChannel(PMS_SYNC_CHANNEL_NAME);
  } catch (e) {
    console.warn('BroadcastChannel initialization skipped:', e);
  }
}

/**
 * Dispatches real-time updates to all tabs, windows, and in-app listeners
 */
export function notifyDataChange(key: string, data?: any): void {
  if (typeof window === 'undefined') return;

  // 1. Dispatch custom event for same-window / in-app instant re-renders
  try {
    window.dispatchEvent(
      new CustomEvent(PMS_SYNC_EVENT_NAME, {
        detail: { key, data, timestamp: Date.now() }
      })
    );
  } catch (e) {
    console.error('Error dispatching sync custom event:', e);
  }

  // 2. Broadcast to other tabs/windows in real time
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage({
        type: 'PMS_DATA_SYNC',
        key,
        timestamp: Date.now()
      });
    } catch (e) {
      console.warn('Error posting sync broadcast message:', e);
    }
  }
}

/**
 * Hydrates local storage as a cache with Firestore/server-persisted database state
 */
export function populateLocalStorageFromServer(
  serverDb: ServerDatabasePayload,
  allowEmptyOverride: boolean = true
): boolean {
  if (typeof window === 'undefined' || !serverDb) return false;
  let hasChanged = false;
  try {
    if (serverDb.profile && typeof serverDb.profile === 'object') {
      const current = localStorage.getItem(STORAGE_KEYS.PROFILE);
      const incoming = JSON.stringify(serverDb.profile);
      if (current !== incoming) {
        localStorage.setItem(STORAGE_KEYS.PROFILE, incoming);
        hasChanged = true;
      }
    }
    if (Array.isArray(serverDb.members)) {
      const current = localStorage.getItem(STORAGE_KEYS.MEMBERS);
      const incoming = JSON.stringify(serverDb.members);
      if (serverDb.members.length > 0 || allowEmptyOverride || !current) {
        if (current !== incoming) {
          localStorage.setItem(STORAGE_KEYS.MEMBERS, incoming);
          hasChanged = true;
        }
      }
    }
    if (Array.isArray(serverDb.donors)) {
      const current = localStorage.getItem(STORAGE_KEYS.DONORS);
      const incoming = JSON.stringify(serverDb.donors);
      if (serverDb.donors.length > 0 || allowEmptyOverride || !current) {
        if (current !== incoming) {
          localStorage.setItem(STORAGE_KEYS.DONORS, incoming);
          hasChanged = true;
        }
      }
    }
    if (Array.isArray(serverDb.notices)) {
      const current = localStorage.getItem(STORAGE_KEYS.NOTICES);
      const incoming = JSON.stringify(serverDb.notices);
      if (serverDb.notices.length > 0 || allowEmptyOverride || !current) {
        if (current !== incoming) {
          localStorage.setItem(STORAGE_KEYS.NOTICES, incoming);
          hasChanged = true;
        }
      }
    }
    if (Array.isArray(serverDb.funds)) {
      const current = localStorage.getItem(STORAGE_KEYS.FUNDS);
      const incoming = JSON.stringify(serverDb.funds);
      if (serverDb.funds.length > 0 || allowEmptyOverride || !current) {
        if (current !== incoming) {
          localStorage.setItem(STORAGE_KEYS.FUNDS, incoming);
          hasChanged = true;
        }
      }
    }
    if (Array.isArray(serverDb.supportReports)) {
      const current = localStorage.getItem(STORAGE_KEYS.SUPPORT_REPORTS);
      const incoming = JSON.stringify(serverDb.supportReports);
      if (serverDb.supportReports.length > 0 || allowEmptyOverride || !current) {
        if (current !== incoming) {
          localStorage.setItem(STORAGE_KEYS.SUPPORT_REPORTS, incoming);
          hasChanged = true;
        }
      }
    }
    if (Array.isArray(serverDb.homeSlides)) {
      const current = localStorage.getItem(STORAGE_KEYS.HOME_SLIDES);
      const incoming = JSON.stringify(serverDb.homeSlides);
      if (current !== incoming) {
        localStorage.setItem(STORAGE_KEYS.HOME_SLIDES, incoming);
        hasChanged = true;
      }
    }
    if (serverDb.calendarBanners && typeof serverDb.calendarBanners === 'object') {
      const current = localStorage.getItem(STORAGE_KEYS.CALENDAR_BANNERS);
      const incoming = JSON.stringify(serverDb.calendarBanners);
      if (current !== incoming) {
        localStorage.setItem(STORAGE_KEYS.CALENDAR_BANNERS, incoming);
        hasChanged = true;
      }
    }
    if (Array.isArray(serverDb.deletedSlideIds)) {
      const current = localStorage.getItem(STORAGE_KEYS.DELETED_SLIDE_IDS);
      const incoming = JSON.stringify(serverDb.deletedSlideIds);
      if (current !== incoming) {
        localStorage.setItem(STORAGE_KEYS.DELETED_SLIDE_IDS, incoming);
        hasChanged = true;
      }
    }
    if (Array.isArray(serverDb.humanitarianActivities)) {
      const current = localStorage.getItem(STORAGE_KEYS.HUMANITARIAN_ACTIVITIES);
      const incoming = JSON.stringify(serverDb.humanitarianActivities);
      if (serverDb.humanitarianActivities.length > 0 || allowEmptyOverride || !current) {
        if (current !== incoming) {
          localStorage.setItem(STORAGE_KEYS.HUMANITARIAN_ACTIVITIES, incoming);
          hasChanged = true;
        }
      }
    }
    if (Array.isArray(serverDb.organizationRules)) {
      const current = localStorage.getItem(STORAGE_KEYS.ORGANIZATION_RULES);
      const incoming = JSON.stringify(serverDb.organizationRules);
      if (serverDb.organizationRules.length > 0 || allowEmptyOverride || !current) {
        if (current !== incoming) {
          localStorage.setItem(STORAGE_KEYS.ORGANIZATION_RULES, incoming);
          hasChanged = true;
        }
      }
    }
    if (serverDb.manualTotalBalance !== undefined) {
      const current = localStorage.getItem(STORAGE_KEYS.TOTAL_ORG_BALANCE);
      if (serverDb.manualTotalBalance === null) {
        if (current !== null) {
          localStorage.removeItem(STORAGE_KEYS.TOTAL_ORG_BALANCE);
          hasChanged = true;
        }
      } else {
        const incoming = serverDb.manualTotalBalance.toString();
        if (current !== incoming) {
          localStorage.setItem(STORAGE_KEYS.TOTAL_ORG_BALANCE, incoming);
          hasChanged = true;
        }
      }
    }
    if (serverDb.paymentConfig && typeof serverDb.paymentConfig === 'object') {
      const current = localStorage.getItem(STORAGE_KEYS.PAYMENT_SETTINGS);
      const incoming = JSON.stringify(serverDb.paymentConfig);
      if (current !== incoming) {
        localStorage.setItem(STORAGE_KEYS.PAYMENT_SETTINGS, incoming);
        hasChanged = true;
      }
    }
    if (serverDb.adminPin) {
      const current = localStorage.getItem(STORAGE_KEYS.ADMIN_PIN);
      if (current !== serverDb.adminPin) {
        localStorage.setItem(STORAGE_KEYS.ADMIN_PIN, serverDb.adminPin);
        hasChanged = true;
      }
    }
    if (hasChanged) {
      notifyDataChange('HYDRATE_FROM_SERVER', serverDb);
    }
  } catch (e) {
    console.error('Error populating local storage from server state:', e);
  }
  return hasChanged;
}

// Admin PIN normalization and verification
export function normalizePin(pin: string): string {
  if (!pin) return '';
  const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  let res = pin.trim();
  for (let i = 0; i < 10; i++) {
    res = res.split(banglaDigits[i]).join(i.toString());
  }
  return res;
}

export function getAdminPin(): string {
  return localStorage.getItem(STORAGE_KEYS.ADMIN_PIN) || '1234';
}

export function setAdminPin(pin: string): void {
  const cleanPin = pin.trim();
  localStorage.setItem(STORAGE_KEYS.ADMIN_PIN, cleanPin);
  syncKeyToServer('adminPin', cleanPin);
}

export function verifyAdminPin(inputPin: string): boolean {
  const cleanInput = inputPin.trim();
  if (!cleanInput) return false;
  const currentPin = getAdminPin().trim();

  // Direct match
  if (cleanInput === currentPin) return true;

  // Normalized numeral match (e.g. '১২৩৪' vs '1234')
  const normInput = normalizePin(cleanInput);
  const normCurrent = normalizePin(currentPin);
  if (normInput === normCurrent) return true;

  // Default fallbacks if pin hasn't been changed
  if (normCurrent === '1234' && (normInput === '1234' || cleanInput.toLowerCase() === 'admin123')) {
    return true;
  }

  return false;
}

// Organization Profile
export function loadOrgProfile(): OrganizationProfile {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.PROFILE);
    if (saved !== null) {
      const parsed: OrganizationProfile = JSON.parse(saved);
      if (!parsed.name || parsed.name === 'মানব সেবা সংগঠন' || parsed.name === 'পতেঙ্গা মানব সেবা সংগঠন' || parsed.name === 'সিলেট মানব সেবা সংঘঠন') {
        parsed.name = 'সিলেট মানব সেবা সংগঠন';
      }
      if (!parsed.establishedDate) {
        parsed.establishedDate = '১৫/০৮/২০২২ইং';
      }
      if (!parsed.establishedYear) {
        parsed.establishedYear = '২০২২';
      }
      return parsed;
    }
  } catch (e) {
    console.error('Error loading org profile', e);
  }
  return INITIAL_ORG_PROFILE;
}

export function saveOrgProfile(profile: OrganizationProfile): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
    notifyDataChange(STORAGE_KEYS.PROFILE, profile);
    syncKeyToServer('profile', profile);
  } catch (e) {
    console.error('Error saving org profile', e);
  }
}

// Members
export function loadMembers(): Member[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.MEMBERS);
    if (saved !== null) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return sortMembersOldestFirst(parsed);
      }
    }
  } catch (e) {
    console.error('Error loading members', e);
  }
  return sortMembersOldestFirst(INITIAL_MEMBERS);
}

export function saveMembers(members: Member[]): void {
  try {
    const sorted = sortMembersOldestFirst(members);
    localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(sorted));
    notifyDataChange(STORAGE_KEYS.MEMBERS, sorted);
    syncKeyToServer('members', sorted);
  } catch (e) {
    console.error('Error saving members', e);
  }
}

// Donors
export function loadDonors(): BloodDonor[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.DONORS);
    if (saved !== null) return JSON.parse(saved);
  } catch (e) {
    console.error('Error loading donors', e);
  }
  return INITIAL_DONORS;
}

export function saveDonors(donors: BloodDonor[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.DONORS, JSON.stringify(donors));
    notifyDataChange(STORAGE_KEYS.DONORS, donors);
    syncKeyToServer('donors', donors);
  } catch (e) {
    console.error('Error saving donors', e);
  }
}

// Notices
export function loadNotices(): Notice[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.NOTICES);
    if (saved !== null) return JSON.parse(saved);
  } catch (e) {
    console.error('Error loading notices', e);
  }
  return INITIAL_NOTICES;
}

export function saveNotices(notices: Notice[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.NOTICES, JSON.stringify(notices));
    notifyDataChange(STORAGE_KEYS.NOTICES, notices);
    syncKeyToServer('notices', notices);
  } catch (e) {
    console.error('Error saving notices', e);
  }
}

// Funds
export function loadFunds(): FundRecord[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.FUNDS);
    if (saved !== null) return JSON.parse(saved);
  } catch (e) {
    console.error('Error loading funds', e);
  }
  return INITIAL_FUNDS;
}

export function saveFunds(funds: FundRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.FUNDS, JSON.stringify(funds));
    notifyDataChange(STORAGE_KEYS.FUNDS, funds);
    syncKeyToServer('funds', funds);
  } catch (e) {
    console.error('Error saving funds', e);
  }
}

// Manual Total Organization Balance
export function loadManualTotalBalance(): number | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.TOTAL_ORG_BALANCE);
    if (saved !== null && saved !== '') {
      const parsed = Number(saved);
      if (!isNaN(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Error loading manual total balance', e);
  }
  return null;
}

export function saveManualTotalBalance(amount: number | null): void {
  try {
    if (amount === null) {
      localStorage.removeItem(STORAGE_KEYS.TOTAL_ORG_BALANCE);
    } else {
      localStorage.setItem(STORAGE_KEYS.TOTAL_ORG_BALANCE, amount.toString());
    }
    notifyDataChange(STORAGE_KEYS.TOTAL_ORG_BALANCE, amount);
    syncKeyToServer('manualTotalBalance', amount);
  } catch (e) {
    console.error('Error saving manual total balance', e);
  }
}

// Payment Gateway Settings (Dynamic Admin Configured, no hardcoding)
export function loadPaymentSettings(): PaymentGatewayConfig {
  const defaults: PaymentGatewayConfig = {
    bkashNumber: '',
    bkashType: 'Personal',
    bkashInstruction: 'বিকাশ অ্যাপ বা *247# ডায়াল করে Send Money করুন',
    nagadNumber: '',
    nagadType: 'Personal',
    nagadInstruction: 'নগদ অ্যাপ বা *167# ডায়াল করে Send Money করুন',
    rocketNumber: '',
    rocketType: 'Personal',
    rocketInstruction: 'রকেট অ্যাপ বা *322# ডায়াল করে Send Money করুন',
  };

  try {
    const saved = localStorage.getItem(STORAGE_KEYS.PAYMENT_SETTINGS);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...defaults,
        ...parsed,
      };
    }
  } catch (e) {
    console.error('Error loading payment settings', e);
  }
  return defaults;
}

export function savePaymentSettings(settings: PaymentGatewayConfig): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PAYMENT_SETTINGS, JSON.stringify(settings));
    notifyDataChange(STORAGE_KEYS.PAYMENT_SETTINGS, settings);
    syncKeyToServer('paymentConfig', settings);
  } catch (e) {
    console.error('Error saving payment settings', e);
  }
}

// Support / Report Entries Storage
export function loadSupportReports(): SupportReportItem[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.SUPPORT_REPORTS);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error loading support reports', e);
  }
  return INITIAL_SUPPORT_REPORTS;
}

export function saveSupportReports(reports: SupportReportItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SUPPORT_REPORTS, JSON.stringify(reports));
    notifyDataChange(STORAGE_KEYS.SUPPORT_REPORTS, reports);
    syncKeyToServer('supportReports', reports);
  } catch (e) {
    console.error('Error saving support reports', e);
  }
}

// Deleted Slide IDs Tracking (Guarantees deleted images never reappear)
export function loadDeletedSlideIds(): string[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.DELETED_SLIDE_IDS);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Error loading deleted slide ids', e);
  }
  return [];
}

export function recordDeletedSlideId(id: string): void {
  try {
    const ids = loadDeletedSlideIds();
    if (!ids.includes(id)) {
      const updated = [...ids, id];
      localStorage.setItem(STORAGE_KEYS.DELETED_SLIDE_IDS, JSON.stringify(updated));
      notifyDataChange(STORAGE_KEYS.DELETED_SLIDE_IDS, updated);
      syncKeyToServer('deletedSlideIds', updated).catch(() => {});
    }
  } catch (e) {
    console.error('Error recording deleted slide id', e);
  }
}

// Home Slides Storage (Permanent deletion aware: empty arrays preserved, deleted items permanently filtered)
export function loadHomeSlides(): HomeSlide[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.HOME_SLIDES);
    if (saved !== null) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        const deletedIds = loadDeletedSlideIds();
        return parsed.filter(s => !deletedIds.includes(s.id));
      }
    }
  } catch (e) {
    console.error('Error loading home slides', e);
  }
  const deletedIds = loadDeletedSlideIds();
  return INITIAL_HOME_SLIDES.filter(s => !deletedIds.includes(s.id));
}

export function saveHomeSlides(slides: HomeSlide[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.HOME_SLIDES, JSON.stringify(slides));
    notifyDataChange(STORAGE_KEYS.HOME_SLIDES, slides);
    syncKeyToServer('homeSlides', slides);
  } catch (e) {
    console.error('Error saving home slides', e);
  }
}

// Calendar Monthly Banners Storage (Default placeholders preserved initially, permanent deletions respected forever)
export function loadCalendarBanners(): Record<number, CalendarMonthlyBanner> {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.CALENDAR_BANNERS);
    if (saved !== null) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object') {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error loading calendar banners', e);
  }
  return {};
}

export function saveCalendarBanners(banners: Record<number, CalendarMonthlyBanner>): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CALENDAR_BANNERS, JSON.stringify(banners));
    notifyDataChange(STORAGE_KEYS.CALENDAR_BANNERS, banners);
    syncKeyToServer('calendarBanners', banners);
  } catch (e) {
    console.error('Error saving calendar banners', e);
  }
}

// Humanitarian Activities Storage
export function loadHumanitarianActivities(): HumanitarianActivity[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.HUMANITARIAN_ACTIVITIES);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error loading humanitarian activities', e);
  }
  return INITIAL_HUMANITARIAN_ACTIVITIES;
}

export function saveHumanitarianActivities(activities: HumanitarianActivity[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.HUMANITARIAN_ACTIVITIES, JSON.stringify(activities));
    notifyDataChange(STORAGE_KEYS.HUMANITARIAN_ACTIVITIES, activities);
    syncKeyToServer('humanitarianActivities', activities);
  } catch (e) {
    console.error('Error saving humanitarian activities', e);
  }
}

// Organization Rules Storage
export function loadOrganizationRules(): OrganizationRule[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.ORGANIZATION_RULES);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error loading organization rules', e);
  }
  return INITIAL_ORGANIZATION_RULES;
}

export function saveOrganizationRules(rules: OrganizationRule[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ORGANIZATION_RULES, JSON.stringify(rules));
    notifyDataChange(STORAGE_KEYS.ORGANIZATION_RULES, rules);
    syncKeyToServer('organizationRules', rules);
  } catch (e) {
    console.error('Error saving organization rules', e);
  }
}

// Reset all data to default initial state
export function resetAllData(): void {
  localStorage.removeItem(STORAGE_KEYS.PROFILE);
  localStorage.removeItem(STORAGE_KEYS.MEMBERS);
  localStorage.removeItem(STORAGE_KEYS.DONORS);
  localStorage.removeItem(STORAGE_KEYS.NOTICES);
  localStorage.removeItem(STORAGE_KEYS.FUNDS);
  localStorage.removeItem(STORAGE_KEYS.SUPPORT_REPORTS);
  localStorage.removeItem(STORAGE_KEYS.HOME_SLIDES);
  localStorage.removeItem(STORAGE_KEYS.HUMANITARIAN_ACTIVITIES);
  localStorage.removeItem(STORAGE_KEYS.ORGANIZATION_RULES);
  localStorage.removeItem(STORAGE_KEYS.TOTAL_ORG_BALANCE);
  notifyDataChange('RESET_ALL');
  resetServerDatabase();
}

// Clear all data to empty
export function clearAllData(): void {
  localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.DONORS, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.NOTICES, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.FUNDS, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.SUPPORT_REPORTS, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.HOME_SLIDES, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.HUMANITARIAN_ACTIVITIES, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.ORGANIZATION_RULES, JSON.stringify([]));
  localStorage.removeItem(STORAGE_KEYS.TOTAL_ORG_BALANCE);
  notifyDataChange('CLEAR_ALL');
  clearServerDatabase();
}

// Export CSV for any data category
export function exportSheetCSV(type: 'members' | 'donors' | 'notices' | 'fund' | 'expenses' | 'support'): void {
  let headers = '';
  let rows: string[] = [];
  let filename = '';

  if (type === 'members') {
    headers = 'Serial_No,Name,Designation,Phone,BloodGroup,Area,JoinDate';
    const members = sortMembersOldestFirst(loadMembers());
    rows = members.map((m, idx) => `"${idx + 1}","${m.name}","${m.designation}","${m.phone}","${m.bloodGroup || ''}","${m.area || ''}","${m.joinDate || ''}"`);
    filename = 'Members_Sylhet_Manob_Seba.csv';
  } else if (type === 'donors') {
    headers = 'Name,Phone,BloodGroup,LastDonationDate,NextEligibleDate,Area';
    const donors = loadDonors();
    rows = donors.map(d => `"${d.name}","${d.phone}","${d.bloodGroup}","${d.lastDonationDate || ''}","${d.nextEligibleDate || ''}","${d.area || ''}"`);
    filename = 'BloodDonors_Sylhet_Manob_Seba.csv';
  } else if (type === 'notices') {
    headers = 'Date,Title,NoticeText,Priority';
    const notices = loadNotices();
    rows = notices.map(n => `"${n.date}","${(n.title || '').replace(/"/g, '""')}","${n.noticeText.replace(/"/g, '""')}","${n.priority || ''}"`);
    filename = 'Notices_Sylhet_Manob_Seba.csv';
  } else if (type === 'expenses') {
    headers = 'Date,Particulars_Reason,DisbursedTo,Amount,Category,Notes_Voucher';
    const funds = loadFunds();
    const expenses = funds.filter(f => f.status === 'Expense');
    rows = expenses.map(e => `"${e.date || ''}","${(e.description || '').replace(/"/g, '""')}","${e.disbursedTo || e.memberName}","${e.amount}","${e.category || ''}","${(e.notes || '').replace(/"/g, '""')}"`);
    filename = 'ExpenseBreakdown_Sylhet_Manob_Seba.csv';
  } else if (type === 'fund') {
    headers = 'TotalBalance,MemberName,Status,Amount,Month,Date,TrxID,Notes';
    const funds = loadFunds();
    const manualBal = loadManualTotalBalance();
    const calculatedTotal = funds.filter(f => f.status === 'Paid').reduce((acc, curr) => acc + curr.amount, 0);
    const totalBalance = manualBal !== null ? manualBal : calculatedTotal;
    rows = funds.map(f => `"${totalBalance}","${f.memberName}","${f.status}","${f.amount}","${f.month || ''}","${f.date || ''}","${f.trxId || ''}","${(f.notes || '').replace(/"/g, '""')}"`);
    filename = 'Fund_Sylhet_Manob_Seba.csv';
  } else if (type === 'support') {
    headers = 'Name,Designation,Subject,Phone,Description,Date';
    const reports = loadSupportReports();
    rows = reports.map(r => `"${r.name}","${r.designation}","${r.subject}","${r.phone}","${(r.description || '').replace(/"/g, '""')}","${r.createdAt || ''}"`);
    filename = 'Support_Reports_Sylhet_Manob_Seba.csv';
  }

  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers, ...rows].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
