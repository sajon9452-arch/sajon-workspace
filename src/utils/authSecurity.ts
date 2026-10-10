import { UserAccount, SecurityAlert } from '../types';
import { PMS_SYNC_EVENT, notifyStorageChange } from './storage';
import { DeviceDetails, normalizeDeviceCompare } from './deviceTracker';

// Hardcoded Master Admin Credentials as strictly requested by user
export const MASTER_ADMIN_CREDENTIALS = {
  username: 'sylhetvip',
  password: 'sms2022'
};

const STORAGE_KEYS = {
  USER_ACCOUNTS: 'pms_user_accounts_v2',
  SECURITY_ALERTS: 'pms_security_alerts_v2',
  LOGGED_IN_USER: 'pms_logged_in_user_v2',
  ADMIN_SESSION: 'pms_admin_session_v2'
};

// 1. User Accounts Storage
export function loadUserAccounts(): UserAccount[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USER_ACCOUNTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Error loading user accounts:', e);
  }
  return [];
}

export function saveUserAccounts(accounts: UserAccount[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.USER_ACCOUNTS, JSON.stringify(accounts));
    notifyStorageChange(STORAGE_KEYS.USER_ACCOUNTS, accounts);
  } catch (e) {
    console.error('Error saving user accounts:', e);
  }
}

// 2. Security Alerts Storage
export function loadSecurityAlerts(): SecurityAlert[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SECURITY_ALERTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Error loading security alerts:', e);
  }
  return [];
}

export function saveSecurityAlerts(alerts: SecurityAlert[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.SECURITY_ALERTS, JSON.stringify(alerts));
    notifyStorageChange(STORAGE_KEYS.SECURITY_ALERTS, alerts);
  } catch (e) {
    console.error('Error saving security alerts:', e);
  }
}

// 3. Logged-in User Session
export function loadLoggedInUser(): UserAccount | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LOGGED_IN_USER);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error loading logged in user:', e);
  }
  return null;
}

export function saveLoggedInUser(user: UserAccount | null) {
  try {
    if (!user) {
      localStorage.removeItem(STORAGE_KEYS.LOGGED_IN_USER);
    } else {
      localStorage.setItem(STORAGE_KEYS.LOGGED_IN_USER, JSON.stringify(user));
    }
    notifyStorageChange(STORAGE_KEYS.LOGGED_IN_USER, user);
  } catch (e) {
    console.error('Error saving logged in user:', e);
  }
}

// 4. Admin Session Flag
export function loadIsAdminSession(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEYS.ADMIN_SESSION) === 'true';
  } catch {
    return false;
  }
}

export function saveIsAdminSession(isAdmin: boolean) {
  try {
    if (isAdmin) {
      localStorage.setItem(STORAGE_KEYS.ADMIN_SESSION, 'true');
    } else {
      localStorage.removeItem(STORAGE_KEYS.ADMIN_SESSION);
    }
    notifyStorageChange(STORAGE_KEYS.ADMIN_SESSION, isAdmin);
  } catch (e) {
    console.error('Error saving admin session:', e);
  }
}

// 5. Authentication Verification Functions
export function isMasterAdminLogin(userIdentifier: string, passwordAttempt: string): boolean {
  const normUser = (userIdentifier || '').trim().toLowerCase();
  const normPass = (passwordAttempt || '').trim();
  return (
    normUser === MASTER_ADMIN_CREDENTIALS.username.toLowerCase() &&
    normPass === MASTER_ADMIN_CREDENTIALS.password
  );
}

// Generate an alert
export function createSecurityAlert(
  params: Omit<SecurityAlert, 'id' | 'timestamp' | 'resolved'>
): SecurityAlert {
  const alert: SecurityAlert = {
    ...params,
    id: `sec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
    resolved: false
  };

  const currentAlerts = loadSecurityAlerts();
  const updated = [alert, ...currentAlerts];
  saveSecurityAlerts(updated);
  return alert;
}

// Member Registration submission
export async function submitMemberRegistration(
  data: {
    name: string;
    phone: string;
    area: string;
    designation?: string;
    email?: string;
    bloodGroup?: string;
    password: string;
  },
  tracking: DeviceDetails
): Promise<{ success: boolean; account?: UserAccount; message?: string }> {
  const accounts = loadUserAccounts();

  // Check if phone or pending registration already exists
  const existingPhone = accounts.find(
    a => a.phone === data.phone && (a.status === 'approved' || a.status === 'pending')
  );

  if (existingPhone) {
    if (existingPhone.status === 'pending') {
      return {
        success: false,
        message: 'এই মোবাইল নম্বরে একটি নিবন্ধন আবেদন ইতোমধ্যে অনুমোদনের অপেক্ষায় রয়েছে।'
      };
    }
    return {
      success: false,
      message: 'এই মোবাইল নম্বর দিয়ে ইতোমধ্যে একটি অ্যাকাউন্ট নিবন্ধিত রয়েছে।'
    };
  }

  // Temporary identifier until admin assigns unique username
  const cleanPhone = data.phone.replace(/[^0-9]/g, '');
  const tempUsername = `user_${cleanPhone.slice(-4) || Math.floor(1000 + Math.random() * 9000)}`;

  const newAccount: UserAccount = {
    id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    name: data.name.trim(),
    phone: data.phone.trim(),
    area: data.area.trim(),
    designation: (data.designation || 'সাধারণ সদস্য').trim(),
    email: data.email?.trim() || undefined,
    bloodGroup: data.bloodGroup || undefined,
    username: tempUsername,
    password: data.password,
    status: 'pending',
    registeredAt: new Date().toISOString(),
    registeredIp: tracking.ip,
    registeredDevice: tracking.deviceString,
    isSuspicious: false
  };

  const updated = [newAccount, ...accounts];
  saveUserAccounts(updated);

  return {
    success: true,
    account: newAccount,
    message: 'নিবন্ধন সফলভাবে জমা হয়েছে। অ্যাডমিন অনুমোদনের পর আপনাকে ইউজারনেম বরাদ্দ দেওয়া হবে।'
  };
}

// Member Login
export function authenticateMember(
  usernameOrPhone: string,
  passwordAttempt: string,
  tracking: DeviceDetails
): {
  success: boolean;
  user?: UserAccount;
  error?: string;
  isBlocked?: boolean;
  isPending?: boolean;
} {
  const accounts = loadUserAccounts();
  const search = usernameOrPhone.trim().toLowerCase();

  const user = accounts.find(
    a => a.username.toLowerCase() === search || a.phone.replace(/[^0-9]/g, '') === search.replace(/[^0-9]/g, '')
  );

  if (!user) {
    return { success: false, error: 'ইউজারনেম বা মোবাইল নম্বর খুঁজে পাওয়া যায়নি।' };
  }

  if (user.password !== passwordAttempt) {
    return { success: false, error: 'ভুল পাসওয়ার্ড! পুনরায় চেষ্টা করুন।' };
  }

  if (user.status === 'blocked') {
    // Record security alert for blocked login attempt
    createSecurityAlert({
      userId: user.id,
      username: user.username,
      memberName: user.name,
      phone: user.phone,
      type: 'blocked_attempt',
      message: `ব্লক করা ব্যবহারকারী '${user.name}' (@${user.username}) লগইন করার চেষ্টা করেছেন`,
      ip: tracking.ip,
      device: tracking.deviceString
    });

    return {
      success: false,
      isBlocked: true,
      error: 'আপনার অ্যাকাউন্টটি অ্যাডমিন কর্তৃক সাময়িকভাবে স্থগিত বা ব্লক করা হয়েছে। দয়া করে প্রশাসকের সাথে যোগাযোগ করুন।'
    };
  }

  if (user.status === 'pending') {
    return {
      success: false,
      isPending: true,
      error: 'আপনার নিবন্ধন আবেদনটি এখনও অ্যাডমিন কর্তৃক অনুমোদনের অপেক্ষায় রয়েছে। অনুমোদন সম্পন্ন হলে লগইন করতে পারবেন।'
    };
  }

  if (user.status === 'rejected') {
    return {
      success: false,
      error: 'আপনার আবেদনটি বাতিল করা হয়েছে। নতুন করে আবেদন করতে সহায়তা কেন্দ্রে যোগাযোগ করুন।'
    };
  }

  // Device & IP Tracking Security Check
  let isSuspicious = false;
  let suspiciousReason = '';

  const ipMismatch = user.registeredIp && user.registeredIp !== tracking.ip;
  const deviceMismatch = user.registeredDevice && !normalizeDeviceCompare(user.registeredDevice, tracking.deviceString);

  if (ipMismatch || deviceMismatch) {
    isSuspicious = true;
    suspiciousReason = `অপরিচিত ডিভাইস বা আইপি থেকে লগইন: বর্তমান আইপি (${tracking.ip}), নিবন্ধিত আইপি (${user.registeredIp})`;

    // Immediate Alert in Admin Panel
    createSecurityAlert({
      userId: user.id,
      username: user.username,
      memberName: user.name,
      phone: user.phone,
      type: ipMismatch ? 'unrecognized_ip' : 'unrecognized_device',
      message: `সতর্কতা: সদস্য '${user.name}' (@${user.username}) ভিন্ন আইপি/ডিভাইস থেকে লগইন করেছেন! বর্তমান আইপি: ${tracking.ip} (নিবন্ধিত: ${user.registeredIp})`,
      ip: tracking.ip,
      device: tracking.deviceString
    });
  }

  // Update user with last login tracking
  const updatedUser: UserAccount = {
    ...user,
    lastLoginAt: new Date().toISOString(),
    lastLoginIp: tracking.ip,
    lastLoginDevice: tracking.deviceString,
    isSuspicious: isSuspicious ? true : user.isSuspicious,
    suspiciousReason: isSuspicious ? suspiciousReason : user.suspiciousReason
  };

  const updatedAccounts = accounts.map(a => a.id === user.id ? updatedUser : a);
  saveUserAccounts(updatedAccounts);
  saveLoggedInUser(updatedUser);

  return {
    success: true,
    user: updatedUser
  };
}
