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
  PaymentGatewayConfig
} from '../types';
import { DEFAULT_TRANSPARENT_LOGO } from '../utils/defaultLogo';

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
  youtubeUrl: 'https://youtube.com/@sylhetmanabseva',
  logoUrl: DEFAULT_TRANSPARENT_LOGO
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

export const INITIAL_SUPPORT_MEMBERS: SupportTeamMember[] = [
  {
    id: 'supp-1',
    name: 'মোঃ কামরুল হাসান',
    phone: '01886122678',
    designation: 'সভাপতি / প্রধান সমন্বয়ক',
    subject: 'কেন্দ্রীয় সংগঠন ও সার্বিক জরুরি তথ্য সহায়তা',
    description: 'সংগঠনের প্রাতিষ্ঠানিক কার্যক্রম, কেন্দ্রীয় নীতি নির্ধারণ এবং যেকোনো জরুরি পরামর্শ ও দিকনির্দেশনায় সার্বক্ষণিক যোগাযোগ করুন।',
    category: 'কেন্দ্রীয় প্রশাসন',
    availableHours: 'সকাল ৯টা - রাত ১০টা',
    serial: 1
  },
  {
    id: 'supp-2',
    name: 'সাইদুল ইসলাম সাজন',
    phone: '01711223344',
    designation: 'অর্থ ও সহায়তা সম্পাদক',
    subject: 'চিকিৎসা ফান্ড আবেদন ও অনুদান যাচাই',
    description: 'অসহায় রোগীদের চিকিৎসা সহায়তা তহবিল, অনুদান ছাড় ও আর্থিক আবেদন প্রক্রিয়াকরণ বিষয়ে প্রয়োজনীয় পরামর্শ ও তথ্য পেতে যোগাযোগ করুন।',
    category: 'চিকিৎসা ফান্ড',
    availableHours: '২৪/৭ জরুরি সেবা',
    serial: 2
  },
  {
    id: 'supp-3',
    name: 'তানভীর আহমেদ',
    phone: '01812345678',
    designation: 'ব্লাড উইং কো-অর্ডিনেটর',
    subject: 'জরুরি রক্ত প্রয়োজন ও রক্তদাতা সন্ধান',
    description: 'যেকোনো গ্রুপের রক্তের তাৎক্ষণিক প্রয়োজনে রক্তযোদ্ধাদের সাথে যোগাযোগ এবং হাসপাতালের জরুরি ব্লাড সাপোর্টের জন্য সরাসরি কল করুন।',
    category: 'রক্তদান উইং',
    availableHours: '২৪/৭ সার্বক্ষণিক',
    serial: 3
  },
  {
    id: 'supp-4',
    name: 'আরিফুর রহমান',
    phone: '01911223344',
    designation: 'দপ্তর ও সদস্য সচিব',
    subject: 'সদস্য অন্তর্ভুক্তি ও চাঁদা যাচাই ডেস্ক',
    description: 'নতুন সদস্য হিসেবে নিবন্ধন, সদস্য তালিকাভুক্তিকরণ, পরিচয়পত্র (ID Card) ও মাসিক চাঁদার হিসাব সংক্রান্ত বিষয়ে সরাসরি সহায়তা নিন।',
    category: 'সদস্য দপ্তর',
    availableHours: 'সকাল ১০টা - সন্ধ্যা ৭টা',
    serial: 4
  },
  {
    id: 'supp-5',
    name: 'ফখরুল ইসলাম চৌধুরী',
    phone: '01611223344',
    designation: 'প্রবাসী কল্যাণ সমন্বয়ক',
    subject: 'প্রবাসী সদস্যদের অনুদান ও সহযোগিতা',
    description: 'প্রবাসে কর্মরত রেমিট্যান্স যোদ্ধা ভাইদের কল্যাণ তহবিল, পরামর্শ ও বৈদেশিক রেমিট্যান্স অনুদান সহযোগিতায় যোগাযোগ করুন।',
    category: 'প্রবাসী কল্যাণ',
    availableHours: 'হোয়াটসঅ্যাপে যেকোনো সময়',
    serial: 5
  },
  {
    id: 'supp-6',
    name: 'ইঞ্জিনিয়ার মোস্তফা কামাল',
    phone: '01511223344',
    designation: 'টেকনিক্যাল সাপোর্ট লিড',
    subject: 'অ্যাপে লগইন, প্রোফাইল ও কারিগরি সমস্যা',
    description: 'ওয়েব ও মোবাইল অ্যাপ ব্যবহার, পাসওয়ার্ড ভুলে যাওয়া, অনলাইন অনুদান ভেরিফিকেশন বা টেকনিক্যাল যেকোনো ত্রুটিতে সহায়তা নিন।',
    category: 'আইটি সাপোর্ট',
    availableHours: 'সকাল ৯টা - রাত ১১টা',
    serial: 6
  }
];
