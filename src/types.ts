export type ActiveScreen = 
  | 'home' 
  | 'members' 
  | 'executive' 
  | 'blood' 
  | 'fund' 
  | 'notices' 
  | 'calendar' 
  | 'support' 
  | 'admin';

export type PaymentStatus = 'Paid' | 'Due' | 'Expense';

export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

export interface Member {
  id: string;
  name: string;
  designation: string;
  phone: string;
  area: string;
  email?: string;
  status: 'সক্রিয়' | 'স্থগিত';
  joinDate: string;
  serial: number;
  photoUrl?: string;
  isExecutive?: boolean;
  isExpatriate?: boolean;
  countryStatus?: string;
  bloodGroup?: BloodGroup | string;
  createdAt?: string;
  notes?: string;
  memberType?: 'general' | 'executive' | 'expatriate';
  category?: string;
}

export interface BloodDonor {
  id: string;
  name: string;
  phone: string;
  bloodGroup: BloodGroup;
  lastDonationDate?: string;
  totalDonations?: number;
  area: string;
  isAvailable: boolean;
  notes?: string;
}

export interface FundRecord {
  id: string;
  memberId?: string;
  memberName: string;
  phone?: string;
  senderPhone?: string;
  amount: number;
  status: PaymentStatus;
  date: string;
  month?: string;
  description: string;
  category: 'মাসিক চাঁদা' | 'এককালীন অনুদান' | 'জরুরি সাহায্য' | 'খরচ' | string;
  type?: 'income' | 'expense';
  notes?: string;
  approvedAt?: string;
  disbursedTo?: string;
  voucherNo?: string;
  totalBalance?: number;
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  date: string;
  category: string;
  author: string;
  priority?: 'normal' | 'high' | 'urgent';
  isUrgent?: boolean;
}

export interface OrganizationProfile {
  name: string;
  tagline: string;
  establishedDate: string;
  establishedYear: string;
  address: string;
  hotline: string;
  emergencyContact: string;
  regNumber: string;
  phone: string;
  email: string;
  facebookUrl?: string;
  youtubeUrl?: string;
  logoUrl?: string;
}

export interface PaymentGatewayConfig {
  bkashNumber: string;
  bkashType: string;
  bkashInstructions: string;
  nagadNumber: string;
  nagadType: string;
  nagadInstructions: string;
  rocketNumber: string;
  rocketType: string;
  rocketInstructions: string;
}

export interface SupportReportItem {
  id: string;
  name: string;
  designation: string;
  subject: string;
  phone: string;
  description: string;
  type: string;
  status: 'active' | 'resolved' | 'pending';
  createdAt: string;
  photoUrl?: string;
}

export interface HomeSlide {
  id: string;
  title: string;
  description: string;
  category: string;
  date: string;
  location: string;
  imageUrl?: string;
  isActive: boolean;
}

export interface HumanitarianActivity {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  amount: number;
  recipientName?: string;
  recipientPhotoUrl?: string;
  isFeatured?: boolean;
}

export interface OrganizationRule {
  id: string;
  pointNumber: number;
  ruleText: string;
  category: string;
  isActive: boolean;
}

export interface CalendarMonthlyBanner {
  monthIndex: number;
  imageUrl?: string;
  caption?: string;
}

export type UserAccountStatus = 'pending' | 'approved' | 'rejected' | 'blocked';

export interface UserAccount {
  id: string;
  memberId?: string;
  name: string;
  phone: string;
  area: string;
  designation?: string;
  email?: string;
  bloodGroup?: string;
  username: string; // assigned by admin or initially requested
  password?: string; // secure password set by user
  photoUrl?: string; // Captured live face photo during liveness verification
  livenessVerified?: boolean; // Face liveness check verification status
  status: UserAccountStatus;
  registeredAt: string;
  registeredIp: string;
  registeredDevice: string;
  lastLoginAt?: string;
  lastLoginIp?: string;
  lastLoginDevice?: string;
  isSuspicious?: boolean;
  suspiciousReason?: string;
}

export interface SecurityAlert {
  id: string;
  userId?: string;
  username: string;
  memberName: string;
  phone: string;
  type: 'unrecognized_ip' | 'unrecognized_device' | 'concurrent_attempt' | 'blocked_attempt' | 'suspicious_activity';
  message: string;
  ip: string;
  device: string;
  timestamp: string;
  resolved: boolean;
}
