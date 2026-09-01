// Server API client for local container storage & sync
import {
  Member,
  BloodDonor,
  Notice,
  FundRecord,
  OrganizationProfile,
  PaymentGatewayConfig,
  SupportReportItem
} from '../types';

export interface ServerDatabasePayload {
  profile?: OrganizationProfile;
  members?: Member[];
  donors?: BloodDonor[];
  notices?: Notice[];
  funds?: FundRecord[];
  manualTotalBalance?: number | null;
  paymentConfig?: PaymentGatewayConfig;
  supportReports?: SupportReportItem[];
  adminPin?: string;
  updatedAt?: string;
}

/**
 * Fetch full persisted database state from Express backend / local storage
 */
export async function fetchServerDatabase(): Promise<ServerDatabasePayload | null> {
  try {
    const timestamp = Date.now();
    const response = await fetch(`/api/data?_t=${timestamp}`, {
      method: 'GET',
      cache: 'no-store',
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    });

    if (!response.ok) {
      return null;
    }

    const result = await response.json();
    if (result && result.success && result.data) {
      return result.data as ServerDatabasePayload;
    }
    return null;
  } catch (error) {
    console.warn('[ServerApi] Local backend not reachable, using localStorage:', error);
    return null;
  }
}

/**
 * Push specific key update to local server in background
 */
export async function syncKeyToServer(
  key:
    | 'profile'
    | 'members'
    | 'donors'
    | 'notices'
    | 'funds'
    | 'manualTotalBalance'
    | 'paymentConfig'
    | 'supportReports'
    | 'adminPin',
  value: any
): Promise<boolean> {
  try {
    const response = await fetch(`/api/data/${key}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ value })
    });

    if (!response.ok) {
      return false;
    }

    const result = await response.json();
    return Boolean(result && result.success);
  } catch (error) {
    // Non-blocking catch for offline/client-only modes
    return false;
  }
}

/**
 * Reset server database to default
 */
export async function resetServerDatabase(): Promise<boolean> {
  try {
    const response = await fetch('/api/data-action/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    return response.ok;
  } catch (e) {
    console.warn('[ServerApi] Error resetting database:', e);
    return false;
  }
}

/**
 * Clear data collections on server
 */
export async function clearServerDatabase(): Promise<boolean> {
  try {
    const response = await fetch('/api/data-action/clear', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    return response.ok;
  } catch (e) {
    console.warn('[ServerApi] Error clearing database:', e);
    return false;
  }
}
