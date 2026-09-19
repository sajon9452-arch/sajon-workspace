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
  DELETED_ACTIVITY_IDS: 'pms_deleted_activity_ids_v2',
  DELETED_MEMBER_IDS: 'pms_deleted_member_ids_v2',
  DELETED_DONOR_IDS: 'pms_deleted_donor_ids_v2',
  DELETED_NOTICE_IDS: 'pms_deleted_notice_ids_v2',
  DELETED_FUND_IDS: 'pms_deleted_fund_ids_v2',
  DELETED_REPORT_IDS: 'pms_deleted_report_ids_v2',
  DELETED_RULE_IDS: 'pms_deleted_rule_ids_v2',
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
 * In-Memory Member Entity Cache to prevent loss of image fidelity if localStorage hits quota
 */
let memoryMembersCache: Member[] | null = null;

/**
 * Resilient Local Storage Setter
 * Prevents browser QuotaExceededError from interrupting app execution or stopping cloud persistence.
 * If quota limit is hit, creates a lightweight local representation while the memory and backend retain 100% full fidelity.
 */
export function safeSetLocalStorage(key: string, data: any): void {
  if (typeof window === 'undefined') return;
  try {
    const serialized = JSON.stringify(data);
    localStorage.setItem(key, serialized);
  } catch (err: any) {
    console.warn(`[Storage] Local storage quota limit reached for "${key}". Retaining full data in memory and cloud database.`);
    try {
      if (Array.isArray(data)) {
        // If quota limit reached, replace heavy base64 strings with server API photo endpoints
        // instead of blanking them, so profile pictures still render seamlessly
        const compact = data.map((item: any) => {
          if (item && typeof item === 'object') {
            const copy = { ...item };
            if (typeof copy.photoUrl === 'string' && copy.photoUrl.length > 2000) {
              copy.photoUrl = copy.id ? `/api/member-photo/${encodeURIComponent(copy.id)}` : '';
            }
            if (typeof copy.avatarUrl === 'string' && copy.avatarUrl.length > 2000) {
              copy.avatarUrl = copy.id ? `/api/member-photo/${encodeURIComponent(copy.id)}` : '';
            }
            if (typeof copy.imageUrl === 'string' && copy.imageUrl.length > 2000) copy.imageUrl = '';
            if (typeof copy.recipientPhotoUrl === 'string' && copy.recipientPhotoUrl.length > 2000) copy.recipientPhotoUrl = '';
            return copy;
          }
          return item;
        });
        localStorage.setItem(key, JSON.stringify(compact));
      }
    } catch (compactErr) {
      // Memory state and backend API are authoritative
    }
  }
}

/**
 * Reconciles an entity array in storage non-destructively:
 * 1. Unions incoming server data with local changes by unique ID.
 * 2. Filters out any items whose IDs are in the deleted ID blacklist.
 * 3. Never wipes out locally added items if server has not synced yet.
 * 4. Pushes any unsynced local additions up to server so Supabase is populated.
 */
function reconcileEntityStorageList<T extends { id: string }>(
  incomingServerList: T[] | undefined,
  storageKey: string,
  deletedIds: string[],
  sortFn?: (items: T[]) => T[]
): { merged: T[]; changed: boolean; hasLocalAdditions: boolean } {
  let localList: T[] = [];
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        localList = parsed;
      }
    }
  } catch (e) {}

  const map = new Map<string, T>();
  // Server records
  if (Array.isArray(incomingServerList)) {
    for (const item of incomingServerList) {
      if (item && item.id && !deletedIds.includes(item.id)) {
        map.set(item.id, item);
      }
    }
  }

  // Local additions (guarantee admin content never vanishes)
  let hasLocalAdditions = false;
  for (const item of localList) {
    if (item && item.id && !deletedIds.includes(item.id)) {
      if (!map.has(item.id)) {
        map.set(item.id, item);
        hasLocalAdditions = true;
      }
    }
  }

  let merged = Array.from(map.values());
  if (sortFn) {
    merged = sortFn(merged);
  }

  const currentJson = localStorage.getItem(storageKey);
  const newJson = JSON.stringify(merged);
  const changed = currentJson !== newJson;

  if (changed) {
    safeSetLocalStorage(storageKey, merged);
  }

  return { merged, changed, hasLocalAdditions };
}

function reconcileDeletedIdStorage(serverIds: string[] | undefined, storageKey: string): string[] {
  let localIds: string[] = [];
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) localIds = parsed;
    }
  } catch (e) {}
  const combined = Array.from(new Set([
    ...(Array.isArray(serverIds) ? serverIds : []),
    ...localIds
  ]));
  localStorage.setItem(storageKey, JSON.stringify(combined));
  return combined;
}

/**
 * Hydrates local storage as a cache with server-persisted database state.
 * Performs strictly additive / non-destructive merging across all management sections.
 */
export function populateLocalStorageFromServer(
  serverDb: ServerDatabasePayload,
  _allowEmptyOverride: boolean = false
): boolean {
  if (typeof window === 'undefined' || !serverDb) return false;
  let hasChanged = false;

  try {
    // 1. Reconcile all deleted ID blacklists first so deletions stay permanent
    const deletedSlideIds = reconcileDeletedIdStorage(serverDb.deletedSlideIds, STORAGE_KEYS.DELETED_SLIDE_IDS);
    const deletedActivityIds = reconcileDeletedIdStorage(serverDb.deletedActivityIds, STORAGE_KEYS.DELETED_ACTIVITY_IDS);
    const deletedMemberIds = reconcileDeletedIdStorage(serverDb.deletedMemberIds, STORAGE_KEYS.DELETED_MEMBER_IDS);
    const deletedDonorIds = reconcileDeletedIdStorage(serverDb.deletedDonorIds, STORAGE_KEYS.DELETED_DONOR_IDS);
    const deletedNoticeIds = reconcileDeletedIdStorage(serverDb.deletedNoticeIds, STORAGE_KEYS.DELETED_NOTICE_IDS);
    const deletedFundIds = reconcileDeletedIdStorage(serverDb.deletedFundIds, STORAGE_KEYS.DELETED_FUND_IDS);
    const deletedReportIds = reconcileDeletedIdStorage(serverDb.deletedReportIds, STORAGE_KEYS.DELETED_REPORT_IDS);
    const deletedRuleIds = reconcileDeletedIdStorage(serverDb.deletedRuleIds, STORAGE_KEYS.DELETED_RULE_IDS);

    // 2. Members (with strict ascending seniority sort)
    if (Array.isArray(serverDb.members) && serverDb.members.length > 0) {
      memoryMembersCache = sortMembersOldestFirst(
        serverDb.members.filter((m: any) => m && m.id && !deletedMemberIds.includes(m.id))
      );
    }
    const membersRes = reconcileEntityStorageList(
      serverDb.members,
      STORAGE_KEYS.MEMBERS,
      deletedMemberIds,
      sortMembersOldestFirst
    );
    if (membersRes.changed) hasChanged = true;
    if (membersRes.hasLocalAdditions) {
      syncKeyToServer('members', membersRes.merged).catch(() => {});
    }

    // 3. Donors
    const donorsRes = reconcileEntityStorageList(
      serverDb.donors,
      STORAGE_KEYS.DONORS,
      deletedDonorIds
    );
    if (donorsRes.changed) hasChanged = true;
    if (donorsRes.hasLocalAdditions) {
      syncKeyToServer('donors', donorsRes.merged).catch(() => {});
    }

    // 4. Notices
    const noticesRes = reconcileEntityStorageList(
      serverDb.notices,
      STORAGE_KEYS.NOTICES,
      deletedNoticeIds
    );
    if (noticesRes.changed) hasChanged = true;
    if (noticesRes.hasLocalAdditions) {
      syncKeyToServer('notices', noticesRes.merged).catch(() => {});
    }

    // 5. Funds
    const fundsRes = reconcileEntityStorageList(
      serverDb.funds,
      STORAGE_KEYS.FUNDS,
      deletedFundIds
    );
    if (fundsRes.changed) hasChanged = true;
    if (fundsRes.hasLocalAdditions) {
      syncKeyToServer('funds', fundsRes.merged).catch(() => {});
    }

    // 6. Support Reports
    const reportsRes = reconcileEntityStorageList(
      serverDb.supportReports,
      STORAGE_KEYS.SUPPORT_REPORTS,
      deletedReportIds
    );
    if (reportsRes.changed) hasChanged = true;
    if (reportsRes.hasLocalAdditions) {
      syncKeyToServer('supportReports', reportsRes.merged).catch(() => {});
    }

    // 7. Home Slides
    const slidesRes = reconcileEntityStorageList(
      serverDb.homeSlides,
      STORAGE_KEYS.HOME_SLIDES,
      deletedSlideIds
    );
    if (slidesRes.changed) hasChanged = true;
    if (slidesRes.hasLocalAdditions) {
      syncKeyToServer('homeSlides', slidesRes.merged).catch(() => {});
    }

    // 8. Humanitarian Activities (strict empty-safe & deletion-aware)
    const actRes = reconcileEntityStorageList(
      serverDb.humanitarianActivities,
      STORAGE_KEYS.HUMANITARIAN_ACTIVITIES,
      deletedActivityIds
    );
    if (actRes.changed) hasChanged = true;
    if (actRes.hasLocalAdditions) {
      syncKeyToServer('humanitarianActivities', actRes.merged).catch(() => {});
    }

    // 9. Organization Rules
    const rulesRes = reconcileEntityStorageList(
      serverDb.organizationRules,
      STORAGE_KEYS.ORGANIZATION_RULES,
      deletedRuleIds
    );
    if (rulesRes.changed) hasChanged = true;
    if (rulesRes.hasLocalAdditions) {
      syncKeyToServer('organizationRules', rulesRes.merged).catch(() => {});
    }

    // 10. Profile
    if (serverDb.profile && typeof serverDb.profile === 'object') {
      const current = localStorage.getItem(STORAGE_KEYS.PROFILE);
      const incoming = JSON.stringify(serverDb.profile);
      if (current !== incoming) {
        localStorage.setItem(STORAGE_KEYS.PROFILE, incoming);
        hasChanged = true;
      }
    }

    // 11. Payment Gateway Settings
    if (serverDb.paymentConfig && typeof serverDb.paymentConfig === 'object') {
      const current = localStorage.getItem(STORAGE_KEYS.PAYMENT_SETTINGS);
      const incoming = JSON.stringify(serverDb.paymentConfig);
      if (current !== incoming) {
        localStorage.setItem(STORAGE_KEYS.PAYMENT_SETTINGS, incoming);
        hasChanged = true;
      }
    }

    // 12. Total Organization Balance
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

    // 13. Admin PIN
    if (serverDb.adminPin) {
      const current = localStorage.getItem(STORAGE_KEYS.ADMIN_PIN);
      if (current !== serverDb.adminPin) {
        localStorage.setItem(STORAGE_KEYS.ADMIN_PIN, serverDb.adminPin);
        hasChanged = true;
      }
    }

    // 14. Calendar Banners
    if (serverDb.calendarBanners && typeof serverDb.calendarBanners === 'object') {
      let localBanners: Record<string, any> = {};
      try {
        const raw = localStorage.getItem(STORAGE_KEYS.CALENDAR_BANNERS);
        if (raw) localBanners = JSON.parse(raw);
      } catch (e) {}
      const mergedBanners = { ...localBanners, ...serverDb.calendarBanners };
      const current = localStorage.getItem(STORAGE_KEYS.CALENDAR_BANNERS);
      const incoming = JSON.stringify(mergedBanners);
      if (current !== incoming) {
        localStorage.setItem(STORAGE_KEYS.CALENDAR_BANNERS, incoming);
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
    notifyDataChange(STORAGE_KEYS.PROFILE, profile);
    safeSetLocalStorage(STORAGE_KEYS.PROFILE, profile);
    syncKeyToServer('profile', profile);
  } catch (e) {
    console.error('Error saving org profile', e);
  }
}

// Members
export function loadDeletedMemberIds(): string[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.DELETED_MEMBER_IDS);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Error loading deleted member ids', e);
  }
  return [];
}

export function recordDeletedMemberId(id: string): void {
  try {
    const ids = loadDeletedMemberIds();
    if (!ids.includes(id)) {
      const updated = [...ids, id];
      localStorage.setItem(STORAGE_KEYS.DELETED_MEMBER_IDS, JSON.stringify(updated));
      notifyDataChange(STORAGE_KEYS.DELETED_MEMBER_IDS, updated);
      syncKeyToServer('deletedMemberIds', updated).catch(() => {});
    }
  } catch (e) {
    console.error('Error recording deleted member id', e);
  }
}

export function clearDeletedMemberId(id: string): void {
  try {
    const ids = loadDeletedMemberIds();
    if (ids.includes(id)) {
      const updated = ids.filter(i => i !== id);
      localStorage.setItem(STORAGE_KEYS.DELETED_MEMBER_IDS, JSON.stringify(updated));
      notifyDataChange(STORAGE_KEYS.DELETED_MEMBER_IDS, updated);
      syncKeyToServer('deletedMemberIds', updated).catch(() => {});
    }
  } catch (e) {
    console.error('Error clearing deleted member id', e);
  }
}

export function loadMembers(): Member[] {
  const deletedIds = loadDeletedMemberIds();
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.MEMBERS);
    if (saved !== null) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        const merged = parsed.map((item: Member) => {
          // If member has no photoUrl or has proxy endpoint, check if memoryMembersCache has high-fidelity photo
          if (!item.photoUrl || item.photoUrl.startsWith('/api/')) {
            const cached = memoryMembersCache?.find(c => c.id === item.id);
            if (cached && (cached.photoUrl || cached.avatarUrl)) {
              return {
                ...item,
                photoUrl: cached.photoUrl || cached.avatarUrl,
                avatarUrl: cached.avatarUrl || cached.photoUrl
              };
            }
          }
          return item;
        });
        return sortMembersOldestFirst(merged.filter(m => !deletedIds.includes(m.id)));
      }
    }
  } catch (e) {
    console.error('Error loading members', e);
  }
  if (memoryMembersCache && memoryMembersCache.length > 0) {
    return sortMembersOldestFirst(memoryMembersCache.filter(m => !deletedIds.includes(m.id)));
  }
  return sortMembersOldestFirst(INITIAL_MEMBERS.filter(m => !deletedIds.includes(m.id)));
}

export function saveMembers(members: Member[]): void {
  try {
    const deletedIds = loadDeletedMemberIds();
    const filtered = members.filter(m => !deletedIds.includes(m.id));
    const sorted = sortMembersOldestFirst(filtered);
    memoryMembersCache = sorted;
    notifyDataChange(STORAGE_KEYS.MEMBERS, sorted);
    safeSetLocalStorage(STORAGE_KEYS.MEMBERS, sorted);
    syncKeyToServer('members', sorted);
  } catch (e) {
    console.error('Error saving members', e);
  }
}

// Donors
export function loadDeletedDonorIds(): string[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.DELETED_DONOR_IDS);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Error loading deleted donor ids', e);
  }
  return [];
}

export function recordDeletedDonorId(id: string): void {
  try {
    const ids = loadDeletedDonorIds();
    if (!ids.includes(id)) {
      const updated = [...ids, id];
      localStorage.setItem(STORAGE_KEYS.DELETED_DONOR_IDS, JSON.stringify(updated));
      notifyDataChange(STORAGE_KEYS.DELETED_DONOR_IDS, updated);
      syncKeyToServer('deletedDonorIds', updated).catch(() => {});
    }
  } catch (e) {
    console.error('Error recording deleted donor id', e);
  }
}

export function clearDeletedDonorId(id: string): void {
  try {
    const ids = loadDeletedDonorIds();
    if (ids.includes(id)) {
      const updated = ids.filter(i => i !== id);
      localStorage.setItem(STORAGE_KEYS.DELETED_DONOR_IDS, JSON.stringify(updated));
      notifyDataChange(STORAGE_KEYS.DELETED_DONOR_IDS, updated);
      syncKeyToServer('deletedDonorIds', updated).catch(() => {});
    }
  } catch (e) {
    console.error('Error clearing deleted donor id', e);
  }
}

export function loadDonors(): BloodDonor[] {
  const deletedIds = loadDeletedDonorIds();
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.DONORS);
    if (saved !== null) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed.filter(d => !deletedIds.includes(d.id));
      }
    }
  } catch (e) {
    console.error('Error loading donors', e);
  }
  return INITIAL_DONORS.filter(d => !deletedIds.includes(d.id));
}

export function saveDonors(donors: BloodDonor[]): void {
  try {
    const deletedIds = loadDeletedDonorIds();
    const filtered = donors.filter(d => !deletedIds.includes(d.id));
    notifyDataChange(STORAGE_KEYS.DONORS, filtered);
    safeSetLocalStorage(STORAGE_KEYS.DONORS, filtered);
    syncKeyToServer('donors', filtered);
  } catch (e) {
    console.error('Error saving donors', e);
  }
}

// Notices
export function loadDeletedNoticeIds(): string[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.DELETED_NOTICE_IDS);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Error loading deleted notice ids', e);
  }
  return [];
}

export function recordDeletedNoticeId(id: string): void {
  try {
    const ids = loadDeletedNoticeIds();
    if (!ids.includes(id)) {
      const updated = [...ids, id];
      localStorage.setItem(STORAGE_KEYS.DELETED_NOTICE_IDS, JSON.stringify(updated));
      notifyDataChange(STORAGE_KEYS.DELETED_NOTICE_IDS, updated);
      syncKeyToServer('deletedNoticeIds', updated).catch(() => {});
    }
  } catch (e) {
    console.error('Error recording deleted notice id', e);
  }
}

export function clearDeletedNoticeId(id: string): void {
  try {
    const ids = loadDeletedNoticeIds();
    if (ids.includes(id)) {
      const updated = ids.filter(i => i !== id);
      localStorage.setItem(STORAGE_KEYS.DELETED_NOTICE_IDS, JSON.stringify(updated));
      notifyDataChange(STORAGE_KEYS.DELETED_NOTICE_IDS, updated);
      syncKeyToServer('deletedNoticeIds', updated).catch(() => {});
    }
  } catch (e) {
    console.error('Error clearing deleted notice id', e);
  }
}

export function loadNotices(): Notice[] {
  const deletedIds = loadDeletedNoticeIds();
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.NOTICES);
    if (saved !== null) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed.filter(n => !deletedIds.includes(n.id));
      }
    }
  } catch (e) {
    console.error('Error loading notices', e);
  }
  return INITIAL_NOTICES.filter(n => !deletedIds.includes(n.id));
}

export function saveNotices(notices: Notice[]): void {
  try {
    const deletedIds = loadDeletedNoticeIds();
    const filtered = notices.filter(n => !deletedIds.includes(n.id));
    notifyDataChange(STORAGE_KEYS.NOTICES, filtered);
    safeSetLocalStorage(STORAGE_KEYS.NOTICES, filtered);
    syncKeyToServer('notices', filtered);
  } catch (e) {
    console.error('Error saving notices', e);
  }
}

// Funds
export function loadDeletedFundIds(): string[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.DELETED_FUND_IDS);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Error loading deleted fund ids', e);
  }
  return [];
}

export function recordDeletedFundId(id: string): void {
  try {
    const ids = loadDeletedFundIds();
    if (!ids.includes(id)) {
      const updated = [...ids, id];
      localStorage.setItem(STORAGE_KEYS.DELETED_FUND_IDS, JSON.stringify(updated));
      notifyDataChange(STORAGE_KEYS.DELETED_FUND_IDS, updated);
      syncKeyToServer('deletedFundIds', updated).catch(() => {});
    }
  } catch (e) {
    console.error('Error recording deleted fund id', e);
  }
}

export function clearDeletedFundId(id: string): void {
  try {
    const ids = loadDeletedFundIds();
    if (ids.includes(id)) {
      const updated = ids.filter(i => i !== id);
      localStorage.setItem(STORAGE_KEYS.DELETED_FUND_IDS, JSON.stringify(updated));
      notifyDataChange(STORAGE_KEYS.DELETED_FUND_IDS, updated);
      syncKeyToServer('deletedFundIds', updated).catch(() => {});
    }
  } catch (e) {
    console.error('Error clearing deleted fund id', e);
  }
}

export function loadFunds(): FundRecord[] {
  const deletedIds = loadDeletedFundIds();
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.FUNDS);
    if (saved !== null) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed.filter(f => !deletedIds.includes(f.id));
      }
    }
  } catch (e) {
    console.error('Error loading funds', e);
  }
  return INITIAL_FUNDS.filter(f => !deletedIds.includes(f.id));
}

export function saveFunds(funds: FundRecord[]): void {
  try {
    const deletedIds = loadDeletedFundIds();
    const filtered = funds.filter(f => !deletedIds.includes(f.id));
    notifyDataChange(STORAGE_KEYS.FUNDS, filtered);
    safeSetLocalStorage(STORAGE_KEYS.FUNDS, filtered);
    syncKeyToServer('funds', filtered);
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
    notifyDataChange(STORAGE_KEYS.TOTAL_ORG_BALANCE, amount);
    if (amount === null) {
      localStorage.removeItem(STORAGE_KEYS.TOTAL_ORG_BALANCE);
    } else {
      safeSetLocalStorage(STORAGE_KEYS.TOTAL_ORG_BALANCE, amount.toString());
    }
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
    notifyDataChange(STORAGE_KEYS.PAYMENT_SETTINGS, settings);
    safeSetLocalStorage(STORAGE_KEYS.PAYMENT_SETTINGS, settings);
    syncKeyToServer('paymentConfig', settings);
  } catch (e) {
    console.error('Error saving payment settings', e);
  }
}

// Support / Report Entries Storage
export function loadDeletedReportIds(): string[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.DELETED_REPORT_IDS);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Error loading deleted report ids', e);
  }
  return [];
}

export function recordDeletedReportId(id: string): void {
  try {
    const ids = loadDeletedReportIds();
    if (!ids.includes(id)) {
      const updated = [...ids, id];
      localStorage.setItem(STORAGE_KEYS.DELETED_REPORT_IDS, JSON.stringify(updated));
      notifyDataChange(STORAGE_KEYS.DELETED_REPORT_IDS, updated);
      syncKeyToServer('deletedReportIds', updated).catch(() => {});
    }
  } catch (e) {
    console.error('Error recording deleted report id', e);
  }
}

export function clearDeletedReportId(id: string): void {
  try {
    const ids = loadDeletedReportIds();
    if (ids.includes(id)) {
      const updated = ids.filter(i => i !== id);
      localStorage.setItem(STORAGE_KEYS.DELETED_REPORT_IDS, JSON.stringify(updated));
      notifyDataChange(STORAGE_KEYS.DELETED_REPORT_IDS, updated);
      syncKeyToServer('deletedReportIds', updated).catch(() => {});
    }
  } catch (e) {
    console.error('Error clearing deleted report id', e);
  }
}

export function loadSupportReports(): SupportReportItem[] {
  const deletedIds = loadDeletedReportIds();
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.SUPPORT_REPORTS);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed.filter(r => !deletedIds.includes(r.id));
      }
    }
  } catch (e) {
    console.error('Error loading support reports', e);
  }
  return INITIAL_SUPPORT_REPORTS.filter(r => !deletedIds.includes(r.id));
}

export function saveSupportReports(reports: SupportReportItem[]): void {
  try {
    const deletedIds = loadDeletedReportIds();
    const filtered = reports.filter(r => !deletedIds.includes(r.id));
    notifyDataChange(STORAGE_KEYS.SUPPORT_REPORTS, filtered);
    safeSetLocalStorage(STORAGE_KEYS.SUPPORT_REPORTS, filtered);
    syncKeyToServer('supportReports', filtered);
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
    notifyDataChange(STORAGE_KEYS.HOME_SLIDES, slides);
    safeSetLocalStorage(STORAGE_KEYS.HOME_SLIDES, slides);
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
    notifyDataChange(STORAGE_KEYS.CALENDAR_BANNERS, banners);
    safeSetLocalStorage(STORAGE_KEYS.CALENDAR_BANNERS, banners);
    syncKeyToServer('calendarBanners', banners);
  } catch (e) {
    console.error('Error saving calendar banners', e);
  }
}

// Deleted Activity IDs Tracking (Guarantees deleted activities never reappear)
export function loadDeletedActivityIds(): string[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.DELETED_ACTIVITY_IDS);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Error loading deleted activity ids', e);
  }
  return [];
}

export function recordDeletedActivityId(id: string): void {
  try {
    const ids = loadDeletedActivityIds();
    if (!ids.includes(id)) {
      const updated = [...ids, id];
      localStorage.setItem(STORAGE_KEYS.DELETED_ACTIVITY_IDS, JSON.stringify(updated));
      notifyDataChange(STORAGE_KEYS.DELETED_ACTIVITY_IDS, updated);
      syncKeyToServer('deletedActivityIds', updated).catch(() => {});
    }
  } catch (e) {
    console.error('Error recording deleted activity id', e);
  }
}

export function clearDeletedActivityId(id: string): void {
  try {
    const ids = loadDeletedActivityIds();
    if (ids.includes(id)) {
      const updated = ids.filter(i => i !== id);
      localStorage.setItem(STORAGE_KEYS.DELETED_ACTIVITY_IDS, JSON.stringify(updated));
      notifyDataChange(STORAGE_KEYS.DELETED_ACTIVITY_IDS, updated);
      syncKeyToServer('deletedActivityIds', updated).catch(() => {});
    }
  } catch (e) {
    console.error('Error clearing deleted activity id', e);
  }
}

// Humanitarian Activities Storage - Zero fallback mock data
export function loadHumanitarianActivities(): HumanitarianActivity[] {
  try {
    const deletedIds = loadDeletedActivityIds();
    const saved = localStorage.getItem(STORAGE_KEYS.HUMANITARIAN_ACTIVITIES);
    if (saved !== null) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed.filter(a => !deletedIds.includes(a.id));
      }
    }
  } catch (e) {
    console.error('Error loading humanitarian activities', e);
  }
  return [];
}

export function saveHumanitarianActivities(activities: HumanitarianActivity[]): void {
  try {
    const deletedIds = loadDeletedActivityIds();
    const filtered = activities.filter(a => !deletedIds.includes(a.id));
    notifyDataChange(STORAGE_KEYS.HUMANITARIAN_ACTIVITIES, filtered);
    safeSetLocalStorage(STORAGE_KEYS.HUMANITARIAN_ACTIVITIES, filtered);
    syncKeyToServer('humanitarianActivities', filtered);
  } catch (e) {
    console.error('Error saving humanitarian activities', e);
  }
}

// Organization Rules Storage
export function loadDeletedRuleIds(): string[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.DELETED_RULE_IDS);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Error loading deleted rule ids', e);
  }
  return [];
}

export function recordDeletedRuleId(id: string): void {
  try {
    const ids = loadDeletedRuleIds();
    if (!ids.includes(id)) {
      const updated = [...ids, id];
      localStorage.setItem(STORAGE_KEYS.DELETED_RULE_IDS, JSON.stringify(updated));
      notifyDataChange(STORAGE_KEYS.DELETED_RULE_IDS, updated);
      syncKeyToServer('deletedRuleIds', updated).catch(() => {});
    }
  } catch (e) {
    console.error('Error recording deleted rule id', e);
  }
}

export function clearDeletedRuleId(id: string): void {
  try {
    const ids = loadDeletedRuleIds();
    if (ids.includes(id)) {
      const updated = ids.filter(i => i !== id);
      localStorage.setItem(STORAGE_KEYS.DELETED_RULE_IDS, JSON.stringify(updated));
      notifyDataChange(STORAGE_KEYS.DELETED_RULE_IDS, updated);
      syncKeyToServer('deletedRuleIds', updated).catch(() => {});
    }
  } catch (e) {
    console.error('Error clearing deleted rule id', e);
  }
}

export function loadOrganizationRules(): OrganizationRule[] {
  const deletedIds = loadDeletedRuleIds();
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.ORGANIZATION_RULES);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.filter(r => !deletedIds.includes(r.id));
      }
    }
  } catch (e) {
    console.error('Error loading organization rules', e);
  }
  return INITIAL_ORGANIZATION_RULES.filter(r => !deletedIds.includes(r.id));
}

export function saveOrganizationRules(rules: OrganizationRule[]): void {
  try {
    const deletedIds = loadDeletedRuleIds();
    const filtered = rules.filter(r => !deletedIds.includes(r.id));
    notifyDataChange(STORAGE_KEYS.ORGANIZATION_RULES, filtered);
    safeSetLocalStorage(STORAGE_KEYS.ORGANIZATION_RULES, filtered);
    syncKeyToServer('organizationRules', filtered);
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
  localStorage.removeItem(STORAGE_KEYS.DELETED_ACTIVITY_IDS);
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
  localStorage.removeItem(STORAGE_KEYS.DELETED_ACTIVITY_IDS);
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
