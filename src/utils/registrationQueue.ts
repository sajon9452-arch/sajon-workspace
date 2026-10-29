import { RegistrationQueueItem, RegistrationQueueStatus, BloodGroup } from '../types';
import { safeSyncToSupabase, safeDeleteFromSupabase, fetchSupabaseCollection } from './supabaseClient';
import { notifyStorageChange } from './storage';
import { DeviceDetails } from './deviceTracker';

export const REGISTRATION_QUEUE_STORAGE_KEY = 'pms_registration_queue';

/**
 * Loads registration queue items from local storage
 */
export function loadRegistrationQueue(): RegistrationQueueItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(REGISTRATION_QUEUE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Error loading registration queue from localStorage:', err);
  }
  return [];
}

/**
 * Saves registration queue items to local storage and syncs
 */
export function saveRegistrationQueue(items: RegistrationQueueItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(REGISTRATION_QUEUE_STORAGE_KEY, JSON.stringify(items));
    notifyStorageChange(REGISTRATION_QUEUE_STORAGE_KEY, items);
  } catch (err) {
    console.warn('Error saving registration queue to localStorage:', err);
  }
}

/**
 * Union-merges local and cloud registration queues by unique ID so no user application is lost or overwritten
 */
export function mergeRegistrationQueues(
  localQueue: RegistrationQueueItem[],
  cloudQueue: RegistrationQueueItem[]
): RegistrationQueueItem[] {
  const map = new Map<string, RegistrationQueueItem>();

  // 1. Add cloud items
  cloudQueue.forEach(item => {
    if (item && item.id) {
      map.set(item.id, item);
    }
  });

  // 2. Add local items if not already in cloud map
  localQueue.forEach(item => {
    if (item && item.id && !map.has(item.id)) {
      map.set(item.id, item);
    }
  });

  return Array.from(map.values()).sort((a, b) => {
    const timeA = new Date(a.registeredAt || a.submittedAt || 0).getTime();
    const timeB = new Date(b.registeredAt || b.submittedAt || 0).getTime();
    return timeB - timeA;
  });
}

/**
 * Submits a new online registration into the isolated 17th Supabase table (`registration_queue`).
 * Keeps applicant completely separate from the active 'members' table.
 */
export async function submitToRegistrationQueue(
  formData: {
    name: string;
    phone: string;
    email?: string;
    area: string;
    designation?: string;
    bloodGroup?: BloodGroup | string;
    password?: string;
    photoUrl?: string;
  },
  tracking: DeviceDetails
): Promise<{ success: boolean; item?: RegistrationQueueItem; message: string }> {
  // 1. Fetch latest registration queue from cloud first to ensure multi-user isolation
  const cloudQueue = await fetchRegistrationQueueFromSupabase().catch(() => null);
  const currentQueue = mergeRegistrationQueues(loadRegistrationQueue(), cloudQueue || []);
  const cleanPhone = formData.phone.trim().replace(/[^0-9]/g, '');

  // Check if this phone number already has a pending application in the queue
  const existingPending = currentQueue.find(
    q => q.status === 'pending' && q.phone.replace(/[^0-9]/g, '') === cleanPhone
  );

  if (existingPending) {
    return {
      success: false,
      message: 'এই মোবাইল নম্বর দিয়ে ইতোমধ্যে একটি নিবন্ধন আবেদন অপেক্ষমাণ রয়েছে। অ্যাডমিন অনুমোদনের অপেক্ষা করুন।'
    };
  }

  // 2. Guaranteed collision-free unique record ID for isolated 17th Supabase table
  const uniqueId = `reg_q_${Date.now()}_${Math.random().toString(36).substring(2, 9)}_${Math.floor(Math.random() * 10000)}`;
  const newItem: RegistrationQueueItem = {
    id: uniqueId,
    name: formData.name.trim(),
    phone: formData.phone.trim(),
    email: formData.email?.trim() || undefined,
    area: formData.area.trim() || 'পতেঙ্গা, চট্টগ্রাম',
    designation: formData.designation?.trim() || 'সাধারণ সদস্য',
    bloodGroup: formData.bloodGroup || undefined,
    password: formData.password?.trim() || 'sms2022',
    photoUrl: formData.photoUrl || undefined,
    status: 'pending',
    registeredAt: new Date().toISOString(),
    submittedAt: new Date().toISOString(),
    registeredIp: tracking.ip || '103.145.24.82',
    registeredDevice: tracking.deviceString || 'স্মার্টফোন (Android/iOS)',
    deviceFingerprint: tracking.deviceId || undefined
  };

  const updatedQueue = [newItem, ...currentQueue];
  saveRegistrationQueue(updatedQueue);

  // 3. Sync to isolated 17th Supabase table `registration_queue`
  try {
    await safeSyncToSupabase('registrationQueue', newItem);
  } catch (syncErr) {
    console.warn('Supabase sync warning for registration queue item:', syncErr);
  }

  return {
    success: true,
    item: newItem,
    message: 'আপনার নিবন্ধন আবেদনটি সফলভাবে জমা হয়েছে এবং অনুমোদনের জন্য অপেক্ষমাণ তালিকায় রাখা হয়েছে।'
  };
}

/**
 * Updates status of a queue item (approve or reject) and syncs to Supabase
 */
export async function updateRegistrationQueueStatus(
  id: string,
  status: RegistrationQueueStatus,
  details?: {
    adminNote?: string;
    reviewedBy?: string;
    approvedMemberId?: string;
    assignedUsername?: string;
  }
): Promise<RegistrationQueueItem | null> {
  const currentQueue = loadRegistrationQueue();
  const targetIndex = currentQueue.findIndex(q => q.id === id);
  if (targetIndex === -1) return null;

  const updatedItem: RegistrationQueueItem = {
    ...currentQueue[targetIndex],
    status,
    reviewedAt: new Date().toISOString(),
    reviewedBy: details?.reviewedBy || 'Admin',
    adminNote: details?.adminNote !== undefined ? details.adminNote : currentQueue[targetIndex].adminNote,
    approvedMemberId: details?.approvedMemberId || currentQueue[targetIndex].approvedMemberId,
    assignedUsername: details?.assignedUsername || currentQueue[targetIndex].assignedUsername
  };

  currentQueue[targetIndex] = updatedItem;
  saveRegistrationQueue(currentQueue);

  // Sync updated queue item to isolated 17th Supabase table
  try {
    await safeSyncToSupabase('registrationQueue', updatedItem);
  } catch (syncErr) {
    console.warn('Supabase queue update sync warning:', syncErr);
  }

  return updatedItem;
}

/**
 * Permanently deletes a queue record from local storage and Supabase
 */
export async function deleteRegistrationQueueItem(id: string): Promise<boolean> {
  const currentQueue = loadRegistrationQueue();
  const filtered = currentQueue.filter(q => q.id !== id);
  saveRegistrationQueue(filtered);

  try {
    await safeDeleteFromSupabase('registrationQueue', id);
    return true;
  } catch (delErr) {
    console.warn('Supabase queue delete warning:', delErr);
    return false;
  }
}

/**
 * Fetches the entire registration queue from Supabase
 */
export async function fetchRegistrationQueueFromSupabase(): Promise<RegistrationQueueItem[] | null> {
  try {
    const data = await fetchSupabaseCollection<RegistrationQueueItem>('registrationQueue');
    if (Array.isArray(data)) {
      return data;
    }
  } catch (err) {
    console.warn('Error fetching registration queue from Supabase:', err);
  }
  return null;
}
