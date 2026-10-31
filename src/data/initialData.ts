import { 
  Member, 
  BloodDonor, 
  Notice, 
  FundRecord, 
  OrganizationProfile, 
  SupportReportItem, 
  SupportTeamMember,
  HomeSlide, 
  HumanitarianActivity, 
  OrganizationRule,
  PaymentGatewayConfig,
  AidDonationRecord,
  ExtraContributionRecord,
  PaymentGatewayItem
} from '../types';
import { DEFAULT_TRANSPARENT_LOGO } from '../utils/defaultLogo';

export const INITIAL_ORG_PROFILE: OrganizationProfile = {
  id: 'org_main_profile',
  name: 'সিলেট মানবসেবা সংগঠন',
  tagline: 'মানবতার কল্যাণে নিবেদিত প্রান',
  description: 'মানবতার সেবায় নিবেদিত একটি অরাজনৈতিক ও সামাজিক স্বেচ্ছাসেবী সংগঠন। সমাজে অসহায়, দরিদ্র ও সুবিধাবঞ্চিত মানুষের পাশে দাঁড়ানো এবং রক্তদান সহ বিভিন্ন সামাজিক কল্যাণমূলক উদ্যোগ বাস্তবায়ন করাই আমাদের মূল লক্ষ্য।',
  establishedDate: '১৫/০৮/২০২২ইং',
  establishedYear: '২০২২',
  address: 'পতেঙ্গা, চট্টগ্রাম',
  hotline: '',
  emergencyContact: '',
  regNumber: '',
  phone: '',
  email: '',
  facebookUrl: '',
  youtubeUrl: '',
  logoUrl: DEFAULT_TRANSPARENT_LOGO,
  presidentName: '',
  generalSecretaryName: '',
  financeSecretaryName: ''
};

export const INITIAL_PAYMENT_GATEWAYS: PaymentGatewayItem[] = [
  {
    id: 'gw_bkash_default',
    gatewayName: 'বিকাশ (bKash)',
    gatewayType: 'mobile',
    accountNumber: '01886122678',
    accountType: 'Personal',
    instructions: 'আপনার বিকাশ অ্যাপ থেকে সেন্ড মানি (Send Money) করে ট্রানজেকশন আইডি (TrxID) প্রদান করুন।',
    isActive: true,
    orderIndex: 1
  },
  {
    id: 'gw_nagad_default',
    gatewayName: 'নগদ (Nagad)',
    gatewayType: 'mobile',
    accountNumber: '01886122678',
    accountType: 'Personal',
    instructions: 'নগদ অ্যাপ থেকে সেন্ড মানি করে TrxID ও প্রেরক নম্বর নিচে এন্ট্রি করুন।',
    isActive: true,
    orderIndex: 2
  },
  {
    id: 'gw_rocket_default',
    gatewayName: 'রকেট (Rocket)',
    gatewayType: 'mobile',
    accountNumber: '01886122678-5',
    accountType: 'Personal',
    instructions: 'রকেট থেকে সেন্ড মানি করে ট্রানজেকশন রেফারেন্স নিশ্চিত করুন।',
    isActive: true,
    orderIndex: 3
  }
];

export const INITIAL_PAYMENT_CONFIG: PaymentGatewayConfig = {
  bkashNumber: '01886122678',
  bkashType: 'Personal',
  bkashInstructions: 'আপনার বিকাশ অ্যাপ থেকে সেন্ড মানি (Send Money) করে ট্রানজেকশন আইডি (TrxID) প্রদান করুন।',
  nagadNumber: '01886122678',
  nagadType: 'Personal',
  nagadInstructions: 'নগদ অ্যাপ থেকে সেন্ড মানি করে TrxID ও প্রেরক নম্বর নিচে এন্ট্রি করুন।',
  rocketNumber: '01886122678-5',
  rocketType: 'Personal',
  rocketInstructions: 'রকেট থেকে সেন্ড মানি করে ট্রানজেকশন রেফারেন্স নিশ্চিত করুন।',
  gateways: INITIAL_PAYMENT_GATEWAYS
};

// Purely dynamic & clean state: Zero dummy data across the entire app
export const INITIAL_MEMBERS: Member[] = [];
export const INITIAL_DONORS: BloodDonor[] = [];
export const INITIAL_NOTICES: Notice[] = [];
export const INITIAL_FUNDS: FundRecord[] = [];

// Dynamic Organization Slider Photos (Zero default data - Admin controlled only)
export const INITIAL_HOME_SLIDES: HomeSlide[] = [];

// Donation & Aid Recipient Directory (Zero default data - Admin controlled only)
export const INITIAL_AID_DONATIONS: AidDonationRecord[] = [];

// Extra Contribution / Additional Fund Section (Zero default data - Admin controlled only)
export const INITIAL_EXTRA_CONTRIBUTIONS: ExtraContributionRecord[] = [];

export const INITIAL_HUMANITARIAN_ACTIVITIES: HumanitarianActivity[] = [];
// Organization Rules & Guidelines (Zero default data - Admin controlled only)
export const INITIAL_ORGANIZATION_RULES: OrganizationRule[] = [];
export const INITIAL_SUPPORT_REPORTS: SupportReportItem[] = [];

// Strictly dynamic: Zero dummy/placeholder representatives
export const INITIAL_SUPPORT_MEMBERS: SupportTeamMember[] = [];

