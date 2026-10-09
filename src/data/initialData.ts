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

export const INITIAL_ORG_PROFILE: OrganizationProfile = {
  name: 'সিলেট মানব সেবা সংগঠন',
  tagline: 'মানবতার কল্যাণে নিবেদিত প্রাণ',
  establishedDate: '১৫/০৮/২০২২ইং',
  establishedYear: '২০২২',
  address: 'পতেঙ্গা, চট্টগ্রাম',
  hotline: '01886122678',
  emergencyContact: '01711000000',
  regNumber: '২০২২/০৮',
  phone: '01886122678',
  email: 'sylhetmanabseva@gmail.com',
  facebookUrl: 'https://facebook.com/sylhetmanabsevasangathan',
  youtubeUrl: 'https://youtube.com/@sylhetmanabseva'
};

export const INITIAL_PAYMENT_CONFIG: PaymentGatewayConfig = {
  bkashNumber: '01886122678',
  bkashType: 'Personal',
  bkashInstructions: 'আপনার বিকাশ অ্যাপ থেকে সেন্ড মানি (Send Money) করে ট্রানজেকশন আইডি (TrxID) প্রদান করুন।',
  nagadNumber: '01886122678',
  nagadType: 'Personal',
  nagadInstructions: 'নগদ অ্যাপ থেকে সেন্ড মানি করে TrxID ও প্রেরক নম্বর নিচে এন্ট্রি করুন।',
  rocketNumber: '01886122678-5',
  rocketType: 'Personal',
  rocketInstructions: 'রকেট থেকে সেন্ড মানি করে ট্রানজেকশন রেফারেন্স নিশ্চিত করুন।'
};

// Purely dynamic & clean state: Zero dummy, default, or mock records anywhere
export const INITIAL_MEMBERS: Member[] = [];
export const INITIAL_DONORS: BloodDonor[] = [];
export const INITIAL_NOTICES: Notice[] = [];
export const INITIAL_FUNDS: FundRecord[] = [];
export const INITIAL_HOME_SLIDES: HomeSlide[] = [];
export const INITIAL_HUMANITARIAN_ACTIVITIES: HumanitarianActivity[] = [];
export const INITIAL_ORGANIZATION_RULES: OrganizationRule[] = [];
export const INITIAL_SUPPORT_REPORTS: SupportReportItem[] = [];
