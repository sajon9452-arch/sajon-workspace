import { BloodDonor, BloodGroup, Member } from '../types';

// Convert English numerals to Bengali
export function toBengaliNumber(num: number | string): string {
  const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return num.toString().replace(/\d/g, (d) => banglaDigits[parseInt(d, 10)]);
}

// Format Bangladeshi Taka
export function formatTaka(amount: number): string {
  const formatted = new Intl.NumberFormat('en-IN').format(amount);
  return `৳ ${toBengaliNumber(formatted)}`;
}

export const toBengaliCurrency = formatTaka;

// Calculate Next Eligible Donation Date (+6 months / 180 days from last donation date)
export function calculateNextEligibleDate(lastDateStr: string): string {
  if (!lastDateStr) return '';
  try {
    const date = new Date(lastDateStr);
    if (isNaN(date.getTime())) return '';
    // 6-month (180 days) interval
    date.setDate(date.getDate() + 180);
    return date.toISOString().split('T')[0];
  } catch {
    return '';
  }
}

// Check if donor is currently eligible (based on 6-month / 180 days interval from last donation)
export function isDonorEligible(donor: BloodDonor): { eligible: boolean; daysRemaining: number } {
  if (!donor.lastDonationDate) {
    return { eligible: true, daysRemaining: 0 };
  }
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Automatically calculate 6 months (180 days) from last donation date
  const autoNextDateStr = calculateNextEligibleDate(donor.lastDonationDate);
  const eligibleDate = autoNextDateStr
    ? new Date(autoNextDateStr)
    : (donor.nextEligibleDate ? new Date(donor.nextEligibleDate) : null);
  
  if (!eligibleDate || isNaN(eligibleDate.getTime())) {
    return { eligible: true, daysRemaining: 0 };
  }

  eligibleDate.setHours(0, 0, 0, 0);

  const diffTime = eligibleDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) {
    return { eligible: true, daysRemaining: 0 };
  }
  return { eligible: false, daysRemaining: diffDays };
}

// Format date to Bengali readable string
export function formatBengaliDate(dateStr?: string): string {
  if (!dateStr) return 'নির্ধারিত নয়';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = toBengaliNumber(parts[0]);
      const monthNum = parseInt(parts[1], 10);
      const day = toBengaliNumber(parts[2]);
      
      const months = [
        'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
        'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
      ];
      const monthName = months[monthNum - 1] || parts[1];
      return `${day} ${monthName}, ${year}`;
    }
    return toBengaliNumber(dateStr);
  } catch {
    return toBengaliNumber(dateStr);
  }
}

// Get Blood Group Color Badge Styling
export function getBloodGroupBadge(group: BloodGroup): { bg: string; text: string; border: string } {
  switch (group) {
    case 'A+':
    case 'A-':
      return { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' };
    case 'B+':
    case 'B-':
      return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' };
    case 'O+':
    case 'O-':
      return { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' };
    case 'AB+':
    case 'AB-':
      return { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' };
    default:
      return { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' };
  }
}

// Clean phone number for tel: or wa.me links
export function sanitizePhone(phone: string): string {
  let cleaned = phone.replace(/[^0-9+]/g, '');
  if (cleaned.startsWith('01') && cleaned.length === 11) {
    cleaned = '+88' + cleaned;
  }
  return cleaned;
}

/**
 * Extracts addition/registration timestamp or serial order for seniority-based sorting.
 * Ensures ascending (oldest-first) ordering so earlier members stay at the top (#1, #2...)
 * and newly added members append at the very bottom.
 */
export function getMemberSortKey(member: Member, originalIndex: number = 0): number {
  // 1. Explicit serial property
  if (typeof member.serial === 'number' && !isNaN(member.serial)) {
    return member.serial;
  }
  // 2. Explicit createdAt timestamp
  if (member.createdAt) {
    const time = new Date(member.createdAt).getTime();
    if (!isNaN(time) && time > 0) return time;
  }
  // 3. Timestamp embedded in ID (e.g. m-1788313942545-xxxx or 1788313942545)
  if (member.id) {
    const tsMatch = member.id.match(/(\d{10,14})/);
    if (tsMatch) {
      const parsed = parseInt(tsMatch[1], 10);
      if (!isNaN(parsed) && parsed > 1500000000) {
        return parsed < 10000000000 ? parsed * 1000 : parsed;
      }
    }
    // Sequential ID like m-1, m-2, member-1
    const seqMatch = member.id.match(/^[a-zA-Z_-]*(\d+)$/);
    if (seqMatch) {
      const num = parseInt(seqMatch[1], 10);
      if (!isNaN(num)) return num;
    }
  }
  // 4. Join date if formatted YYYY-MM-DD
  if (member.joinDate && /^\d{4}-\d{2}-\d{2}$/.test(member.joinDate)) {
    const joinTime = new Date(member.joinDate).getTime();
    if (!isNaN(joinTime)) return joinTime;
  }
  // 5. Array order index fallback
  return originalIndex;
}

/**
 * Sorts members in ascending (oldest-first / seniority) order:
 * - Members who registered / were added first stay at the top of the list (starting from #1).
 * - Newly added members are automatically appended to the very bottom.
 * - Prevents LIFO (Last-In, First-Out) disorder to strictly maintain seniority hierarchy.
 */
export function sortMembersOldestFirst(members: Member[]): Member[] {
  return [...members].sort((a, b) => {
    // 1. Serial comparison if both have numerical serials
    if (typeof a.serial === 'number' && typeof b.serial === 'number') {
      return a.serial - b.serial;
    }

    // 2. Addition timestamp or ID timestamp comparison (Ascending: Oldest first)
    const keyA = getMemberSortKey(a);
    const keyB = getMemberSortKey(b);
    if (keyA !== keyB) {
      return keyA - keyB;
    }

    // 3. Fallback: joinDate or ID comparison
    if (a.joinDate && b.joinDate && a.joinDate !== b.joinDate) {
      return a.joinDate.localeCompare(b.joinDate);
    }
    return (a.id || '').localeCompare(b.id || '');
  });
}

/**
 * Resolves the displayable profile image URL for a member.
 * Supports:
 * - Direct base64 / data URLs ('data:image/...')
 * - Standard HTTP/HTTPS URLs (including public Supabase Storage URLs)
 * - Supabase Storage relative paths (e.g. 'avatars/pic.jpg', 'members/pic.png', '/storage/v1/object/public/...')
 * - All avatar/photo property aliases ('photoUrl', 'photo_url', 'avatarUrl', 'avatar_url', 'avatar', 'imageUrl', 'image_url', 'photo', 'image')
 * - Dynamic fallback to server photo endpoint (/api/member-photo/:id) if available
 */
export function getMemberPhotoUrl(member?: Partial<Member> | null): string {
  if (!member) return '';

  const raw =
    member.photoUrl ||
    member.avatarUrl ||
    member.avatar ||
    member.avatar_url ||
    member.photo_url ||
    member.imageUrl ||
    member.image_url ||
    member.photo ||
    member.image ||
    (member as any).profile_photo ||
    (member as any).profile_image ||
    (member as any).picture ||
    (member as any).file_url ||
    (member as any).file_path ||
    '';

  if (!raw || typeof raw !== 'string') {
    // If member has an ID, check if server has photo stored
    if (member.id && !member.id.startsWith('temp-')) {
      return `/api/member-photo/${encodeURIComponent(member.id)}`;
    }
    return '';
  }

  const trimmed = raw.trim();
  if (!trimmed) {
    if (member.id && !member.id.startsWith('temp-')) {
      return `/api/member-photo/${encodeURIComponent(member.id)}`;
    }
    return '';
  }

  // 1. Data URLs and Blob URLs
  if (trimmed.startsWith('data:image/') || trimmed.startsWith('blob:')) {
    return trimmed;
  }

  // 2. Direct server endpoint relative URL
  if (trimmed.startsWith('/api/member-photo/')) {
    return trimmed;
  }

  // 3. Full HTTP/HTTPS URLs (including Supabase Storage)
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  // 4. Supabase Storage Relative Paths
  const supabaseBase = (
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_URL) ||
    'https://quqzeiuaybmhzisivrud.supabase.co'
  ).replace(/\/+$/, '');

  if (trimmed.startsWith('/storage/v1/object/public/')) {
    return `${supabaseBase}${trimmed}`;
  }
  if (trimmed.startsWith('storage/v1/object/public/')) {
    return `${supabaseBase}/${trimmed}`;
  }

  // Bucket path, e.g. 'avatars/xyz.jpg' or 'members/xyz.png'
  if (trimmed.includes('/')) {
    const clean = trimmed.replace(/^\/+/, '');
    return `${supabaseBase}/storage/v1/object/public/${clean}`;
  }

  // Single file name like 'xyz.jpg' -> default to avatars bucket
  if (/\.(jpe?g|png|webp|gif|avif)$/i.test(trimmed)) {
    return `${supabaseBase}/storage/v1/object/public/avatars/${trimmed}`;
  }

  return trimmed;
}

/**
 * Clean up fund description and category to prevent duplicate or overlapping text
 * (e.g. preventing duplicate "মাসিক চাঁদা" when description already is "মাসিক নিয়মিত চাঁদা")
 */
export function getCleanFundDescription(record: {
  description?: string;
  category?: string;
}): {
  primaryText: string;
  showCategoryBadge: boolean;
  categoryBadgeText: string;
} {
  const desc = (record.description || '').trim();
  const cat = (record.category || '').trim();

  if (!desc) {
    return {
      primaryText: cat || 'মাসিক নিয়মিত চাঁদা',
      showCategoryBadge: false,
      categoryBadgeText: '',
    };
  }

  const isMonthlyDesc = desc.includes('মাসিক') || desc.includes('চাঁদা');
  const isMonthlyCat = cat.includes('মাসিক') || cat.includes('চাঁদা');

  const isRedundant =
    !cat ||
    desc.toLowerCase() === cat.toLowerCase() ||
    (isMonthlyDesc && isMonthlyCat) ||
    desc.includes(cat) ||
    cat.includes(desc);

  return {
    primaryText: desc,
    showCategoryBadge: !isRedundant,
    categoryBadgeText: cat,
  };
}
