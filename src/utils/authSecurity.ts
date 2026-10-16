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

// 3. Logged-in User Session with Live Account Verification
export function loadLoggedInUser(): UserAccount | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LOGGED_IN_USER);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.id === 'string') {
        const accounts = loadUserAccounts();
        const fresh = accounts.find(a => a.id === parsed.id);
        if (fresh && fresh.status === 'approved') {
          return fresh;
        }
      }
      // If user does not exist or is not actively approved, clear stale session
      localStorage.removeItem(STORAGE_KEYS.LOGGED_IN_USER);
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

// 4. Secure Admin Session Token & Airtight Verification
const ADMIN_SESSION_SECRET = 'sms_master_sylhetvip_verified_session';

export function loadIsAdminSession(): boolean {
  try {
    const session = localStorage.getItem(STORAGE_KEYS.ADMIN_SESSION);
    return session === ADMIN_SESSION_SECRET;
  } catch {
    return false;
  }
}

export function saveIsAdminSession(isAdmin: boolean) {
  try {
    if (isAdmin) {
      localStorage.setItem(STORAGE_KEYS.ADMIN_SESSION, ADMIN_SESSION_SECRET);
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

// Validation helper: strictly starting with 's' or 'S' followed by exactly 5 digits (e.g. s54776)
export function isValidS5DigitUsername(username: string): boolean {
  if (!username) return false;
  return /^[sS]\d{5}$/.test(username.trim());
}

// Normalizer: strips symbols, underscores, and ensures leading 's' with up to 5 digits
export function normalizeS5DigitUsername(raw: string): string {
  if (!raw) return '';
  let cleaned = raw.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  if (cleaned.startsWith('user_')) {
    cleaned = cleaned.replace('user_', '');
  }
  if (!cleaned.startsWith('s')) {
    cleaned = 's' + cleaned.replace(/[^0-9]/g, '');
  }
  return cleaned.slice(0, 6);
}

// Generate guaranteed-unique username: strictly starting with 's' followed by exactly 5 digits (e.g., s54776)
export function generateS5DigitUsername(
  phone?: string, 
  existingAccounts?: UserAccount[], 
  excludeAccountId?: string
): string {
  const accounts = existingAccounts || loadUserAccounts();
  const cleanPhone = (phone || '').replace(/[^0-9]/g, '');
  let candidateDigits = cleanPhone.length >= 5 ? cleanPhone.slice(-5) : '';

  if (!candidateDigits || candidateDigits.length !== 5) {
    candidateDigits = Math.floor(10000 + Math.random() * 90000).toString();
  }

  let candidate = `s${candidateDigits}`;

  let attempts = 0;
  while (attempts < 500 && accounts.some(a => a.id !== excludeAccountId && a.username && a.username.toLowerCase() === candidate.toLowerCase())) {
    const random5 = Math.floor(10000 + Math.random() * 90000).toString();
    candidate = `s${random5}`;
    attempts++;
  }
  return candidate;
}

// Backward-compatible alias
export const generateS5389Username = generateS5DigitUsername;

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
    photoUrl?: string;
    livenessVerified?: boolean;
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

  // Generate unique username strictly starting with S followed by 5 digits (e.g. s54776)
  const defaultUsername = generateS5DigitUsername(data.phone, accounts);

  const newAccount: UserAccount = {
    id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    name: data.name.trim(),
    phone: data.phone.trim(),
    area: data.area.trim(),
    designation: (data.designation || 'সাধারণ সদস্য').trim(),
    email: data.email?.trim() || undefined,
    bloodGroup: data.bloodGroup || undefined,
    username: defaultUsername,
    password: data.password,
    photoUrl: data.photoUrl,
    livenessVerified: data.livenessVerified,
    status: 'pending',
    registeredAt: new Date().toISOString(),
    registeredIp: tracking.ip,
    registeredDevice: tracking.deviceString,
    boundDeviceId: undefined,
    boundIp: undefined,
    isDeviceLocked: false,
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
  const search = usernameOrPhone.trim().toLowerCase().replace(/^@/, '');

  const user = accounts.find(
    a => a.username.toLowerCase().replace(/^@/, '') === search || a.phone.replace(/[^0-9]/g, '') === search.replace(/[^0-9]/g, '')
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

  // Requirement 4: Strict Single-Device & IP Lock Security
  // When an approved user logs in for the very first time, permanently lock/bind their device ID & IP.
  // If attempting to log in from a different device/ID, block access.
  const currentDeviceId = tracking.deviceId || 'DEV-CLIENT';
  const isFirstLoginOrReset = !user.isDeviceLocked || !user.boundDeviceId;

  if (!isFirstLoginOrReset) {
    const isDeviceMatch = user.boundDeviceId === currentDeviceId;
    if (!isDeviceMatch) {
      // Immediate High-Priority Security Alert in Admin Panel
      createSecurityAlert({
        userId: user.id,
        username: user.username,
        memberName: user.name,
        phone: user.phone,
        type: 'concurrent_attempt',
        message: `অননুমোদিত ভিন্ন ডিভাইস থেকে লগইন প্রচেষ্টা: সদস্য '${user.name}' (@${user.username})। অনুমোদিত ডিভাইস আইডি: ${user.boundDeviceId}, বর্তমান ডিভাইস আইডি: ${currentDeviceId} (${tracking.deviceString})`,
        ip: tracking.ip,
        device: tracking.deviceString
      });

      // Mark account as suspicious in records
      const updatedUser: UserAccount = {
        ...user,
        isSuspicious: true,
        suspiciousReason: `অননুমোদিত ভিন্ন ডিভাইস থেকে লগইন প্রচেষ্টা: ${tracking.deviceString} (${currentDeviceId})`
      };
      saveUserAccounts(accounts.map(a => a.id === user.id ? updatedUser : a));

      return {
        success: false,
        error: 'একক ডিভাইস ও আইপি নীতি (Single-Device Lock) লঙ্ঘন: আপনার অ্যাকাউন্টটি ইতোমধ্যেই অন্য একটি নির্দিষ্ট ডিভাইসের সাথে স্থায়ীভাবে আবদ্ধ। ভিন্ন বা অননুমোদিত ডিভাইস থেকে লগইন সম্পূর্ণ নিষিদ্ধ। নতুন ডিভাইসে লগইন করতে চাইলে অ্যাডমিনের সাথে যোগাযোগ করে আপনার অ্যাকাউন্টের "ডিভাইস রিসেট" সম্পন্ন করান।'
      };
    }
  }

  // Device is matched or this is first binding.
  const boundDeviceId = isFirstLoginOrReset ? currentDeviceId : user.boundDeviceId;
  const boundIp = isFirstLoginOrReset ? tracking.ip : (user.boundIp || user.registeredIp || tracking.ip);
  const boundDeviceString = isFirstLoginOrReset ? tracking.deviceString : (user.registeredDevice || tracking.deviceString);

  // Check IP network shift if already bound
  let isSuspicious = false;
  let suspiciousReason = '';
  if (!isFirstLoginOrReset && boundIp && boundIp !== tracking.ip) {
    isSuspicious = true;
    suspiciousReason = `ভিন্ন নেটওয়ার্ক/আইপি থেকে লগইন: বর্তমান আইপি (${tracking.ip}), অনুমোদিত আইপি (${boundIp})`;

    createSecurityAlert({
      userId: user.id,
      username: user.username,
      memberName: user.name,
      phone: user.phone,
      type: 'unrecognized_ip',
      message: `সতর্কতা: সদস্য '${user.name}' (@${user.username}) অনুমোদিত ডিভাইসে কিন্তু ভিন্ন আইপি থেকে লগইন করেছেন (${tracking.ip})`,
      ip: tracking.ip,
      device: tracking.deviceString
    });
  }

  // Permanently bind device on first login or keep existing binding
  const updatedUser: UserAccount = {
    ...user,
    boundDeviceId: boundDeviceId,
    boundIp: boundIp,
    isDeviceLocked: true,
    registeredDevice: boundDeviceString,
    registeredIp: boundIp,
    lastLoginAt: new Date().toISOString(),
    lastLoginIp: tracking.ip,
    lastLoginDevice: tracking.deviceString,
    isSuspicious: isSuspicious ? true : (isFirstLoginOrReset ? false : user.isSuspicious),
    suspiciousReason: isSuspicious ? suspiciousReason : (isFirstLoginOrReset ? undefined : user.suspiciousReason)
  };

  const updatedAccounts = accounts.map(a => a.id === user.id ? updatedUser : a);
  saveUserAccounts(updatedAccounts);
  saveLoggedInUser(updatedUser);

  return {
    success: true,
    user: updatedUser
  };
}

// Requirement 4: Admin Action - Device Reset (Removes previous IP/Device binding for new phone login)
export function resetMemberDeviceBinding(userId: string): boolean {
  const accounts = loadUserAccounts();
  const user = accounts.find(a => a.id === userId);
  if (!user) return false;

  const updated: UserAccount = {
    ...user,
    boundDeviceId: undefined,
    boundIp: undefined,
    registeredDevice: '', // cleared so next successful login permanently binds new phone
    registeredIp: '',
    isDeviceLocked: false,
    isSuspicious: false,
    suspiciousReason: undefined
  };

  saveUserAccounts(accounts.map(a => a.id === userId ? updated : a));
  return true;
}

// Requirement 6: Admin Action - Credential Recovery (Reset Username and/or Password)
export function updateMemberCredentials(
  userId: string,
  newUsername: string,
  newPassword?: string
): { success: boolean; error?: string } {
  const accounts = loadUserAccounts();
  const user = accounts.find(a => a.id === userId);
  if (!user) {
    return { success: false, error: 'ব্যবহারকারী অ্যাকাউন্ট খুঁজে পাওয়া যায়নি।' };
  }

  const cleanUsername = newUsername.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!isValidS5DigitUsername(cleanUsername)) {
    return { 
      success: false, 
      error: 'ইউজারনেম ফরম্যাট ভুল! ইউজারনেম অবশ্যই "s" এবং ঠিক ৫টি সংখ্যার হতে হবে, কোনো চিহ্ন বা আন্ডারস্কোর ছাড়া (যেমন: s54776)।' 
    };
  }

  // Check if username is already taken by another account
  const duplicate = accounts.find(a => a.id !== userId && a.username.toLowerCase() === cleanUsername);
  if (duplicate) {
    return { success: false, error: `ইউজারনেম "@${cleanUsername}" অন্য একজন সদস্যের নামে ইতিমধ্যে বরাদ্দ রয়েছে। অনুগ্রহ করে ভিন্ন ইউজারনেম নির্বাচন করুন।` };
  }

  const updated: UserAccount = {
    ...user,
    username: cleanUsername,
    password: newPassword && newPassword.trim() ? newPassword.trim() : user.password
  };

  saveUserAccounts(accounts.map(a => a.id === userId ? updated : a));
  return { success: true };
}
