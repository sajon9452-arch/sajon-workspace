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
  ExtraContributionRecord
} from '../types';
import { DEFAULT_TRANSPARENT_LOGO } from '../utils/defaultLogo';

export const INITIAL_ORG_PROFILE: OrganizationProfile = {
  name: 'সিলেট মানবসেবা সংগঠন',
  tagline: 'মানবতার কল্যাণে নিবেদিত প্রান',
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

// Purely dynamic & clean state: Zero dummy members/funds
export const INITIAL_MEMBERS: Member[] = [];
export const INITIAL_DONORS: BloodDonor[] = [];
export const INITIAL_NOTICES: Notice[] = [];
export const INITIAL_FUNDS: FundRecord[] = [];

// Dynamic Organization Slider Photos
export const INITIAL_HOME_SLIDES: HomeSlide[] = [
  {
    id: 'slide-1',
    title: 'মানবতার কল্যাণে নিবেদিত সিলেট মানব সেবা সংগঠন',
    description: 'অসহায় মানুষের পাশে দাঁড়াতে ও মানবতার সেবায় আমাদের ঐক্যবদ্ধ পথচলা। চট্টগ্রাম ও সিলেটের তৃণমূল মানুষের সেবায় নিবেদিত।',
    category: 'কেন্দ্রীয় মিলনমেলা',
    date: '২০২৬',
    location: 'পতেঙ্গা, চট্টগ্রাম',
    imageUrl: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=1200&q=80',
    isActive: true
  },
  {
    id: 'slide-2',
    title: 'জরুরি খাদ্য ও শীতবস্ত্র বিতরণ কর্মসূচি',
    description: 'দরিদ্র ও প্রান্তিক জনগোষ্ঠীর মাঝে খাদ্য সামগ্রী ও শীতবস্ত্র পৌঁছে দেওয়ার মহৎ উদ্যোগ।',
    category: 'ত্রাণ ও পুনর্বাসন',
    date: '২০২৬',
    location: 'সিলেট ও চট্টগ্রাম',
    imageUrl: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=1200&q=80',
    isActive: true
  },
  {
    id: 'slide-3',
    title: 'বিনামূল্যে রক্তদান ক্যাম্পেইন ও স্বাস্থ্য সহায়তা',
    description: 'সংগঠনের রক্তযোদ্ধা ভাইদের উদ্যোগে স্বেচ্ছায় রক্তদান ও মুমূর্ষু রোগীর পাশে তাৎক্ষণিক রক্ত পৌঁছানোর মহৎ কার্যক্রম।',
    category: 'স্বাস্থ্য ও রক্তদান',
    date: '২০২৬',
    location: 'চট্টগ্রাম',
    imageUrl: 'https://images.unsplash.com/photo-1579208575657-c595a05383b7?auto=format&fit=crop&w=1200&q=80',
    isActive: true
  }
];

// Donation & Aid Recipient Directory (Multiple Records Support)
export const INITIAL_AID_DONATIONS: AidDonationRecord[] = [
  {
    id: 'aid-1',
    recipientName: 'রহিমা বেগম (অসহায় বিধবা মাতা)',
    photoUrl: 'https://images.unsplash.com/photo-1544717302-de2939b7ef71?auto=format&fit=crop&w=600&q=80',
    address: 'পতেঙ্গা কাঠগড় বাজার এলাকা, চট্টগ্রাম',
    providerReference: 'মোঃ কামরুল হাসান (সভাপতি)',
    amount: 15000,
    date: '১২ মার্চ ২০২৬',
    description: 'কন্যার বিবাহ ও পরিবারের এক মাসের খাদ্যসামগ্রী ক্রয়ের জন্য জরুরি আর্থিক অনুদান বিতরণ করা হয়েছে।',
    bkashNumber: '01886122678',
    nagadNumber: '01711000000',
    rocketNumber: '01886122678-5',
    createdAt: '2026-03-12T10:00:00Z'
  },
  {
    id: 'aid-2',
    recipientName: 'মোঃ আব্দুল জলিল (অসুস্থ রিকশাচালক)',
    photoUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=600&q=80',
    address: 'কুমারগাঁও, সিলেট সদর',
    providerReference: 'তানভীর আহমেদ (সমন্বয়ক)',
    amount: 20000,
    date: '০৫ মার্চ ২০২৬',
    description: 'হৃদরোগে আক্রান্ত হওয়ায় জরুরি অপারেশন ও ওষুধের খরচের জন্য সংগঠনের চিকিৎসা তহবিল হতে হস্তান্তরকৃত অনুদান।',
    bkashNumber: '01812345678',
    nagadNumber: '01911223344',
    createdAt: '2026-03-05T14:30:00Z'
  },
  {
    id: 'aid-3',
    recipientName: 'সুফিয়া আক্তার (মেধাবী শিক্ষার্থী)',
    photoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80',
    address: 'দক্ষিণ পতেঙ্গা, চট্টগ্রাম',
    providerReference: 'সাইদুল ইসলাম সাজন (অর্থ সম্পাদক)',
    amount: 12000,
    date: '২০ ফেব্রুয়ারি ২০২৬',
    description: 'এইচএসসি পরীক্ষার ফি এবং বইপত্র ক্রয়ের নিমিত্তে সংগঠনের শিক্ষা সহায়তা তহবিল থেকে এককালীন অনুদান।',
    bkashNumber: '01886122678',
    createdAt: '2026-02-20T09:15:00Z'
  }
];

// Extra Contribution / Additional Fund Section (Well-wishers & Special Contributors)
export const INITIAL_EXTRA_CONTRIBUTIONS: ExtraContributionRecord[] = [
  {
    id: 'extra-1',
    donorName: 'মোঃ আব্দুল করিম (প্রবাসী রেমিট্যান্স যোদ্ধা)',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
    address: 'মাস্কাট, ওমান (মূল বাড়ি: সিলেট)',
    providerReference: 'ফখরুল ইসলাম চৌধুরী (প্রবাসী কল্যাণ সমন্বয়ক)',
    amount: 50000,
    date: '১০ মার্চ ২০২৬',
    description: 'রমজান উপলক্ষে গরিব ও এতিমদের মাঝে ইফতার ও ঈদ উপহার বিতরণ ফান্ডের জন্য বিশেষ অতিরিক্ত অনুদান।',
    bkashNumber: '01886122678',
    nagadNumber: '01711223344',
    createdAt: '2026-03-10T12:00:00Z'
  },
  {
    id: 'extra-2',
    donorName: 'আলহাজ্ব মোঃ নজরুল ইসলাম',
    photoUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=600&q=80',
    address: 'সি বিচ রোড, পতেঙ্গা, চট্টগ্রাম',
    providerReference: 'মোঃ কামরুল হাসান (সভাপতি)',
    amount: 30000,
    date: '২৮ ফেব্রুয়ারি ২০২৬',
    description: 'সংগঠনের স্থায়ী চিকিৎসা ও জরুরি অ্যাম্বুলেন্স সহায়তা তহবিলের উন্নয়নের জন্য ব্যক্তিগত অনুদান।',
    bkashNumber: '01886122678',
    createdAt: '2026-02-28T16:00:00Z'
  },
  {
    id: 'extra-3',
    donorName: 'ইঞ্জিনিয়ার রাশেদুল হক (ইউকে প্রবাসী)',
    photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80',
    address: 'লন্ডন, যুক্তরাজ্য',
    providerReference: 'আরিফুর রহমান (দপ্তর সচিব)',
    amount: 25000,
    date: '১৫ ফেব্রুয়ারি ২০২৬',
    description: 'দুস্থ পরিবারের মাঝে টিউবওয়েল ও নিরাপদ খাবার পানি সরবরাহ প্রকল্পের জন্য অতিরিক্ত অনুদান।',
    bkashNumber: '01911223344',
    nagadNumber: '01611223344',
    createdAt: '2026-02-15T11:00:00Z'
  }
];

export const INITIAL_HUMANITARIAN_ACTIVITIES: HumanitarianActivity[] = [];
export const INITIAL_ORGANIZATION_RULES: OrganizationRule[] = [
  {
    id: 'rule-1',
    pointNumber: 1,
    ruleText: 'সংগঠনের প্রতিটি সদস্যকে সর্বদা নিঃস্বার্থ মানবসেবা, আর্তমানবতার কল্যাণ ও সামাজিক উন্নয়নে নিবেদিত থাকতে হবে।',
    category: 'মৌলিক আদর্শ',
    isActive: true
  },
  {
    id: 'rule-2',
    pointNumber: 2,
    ruleText: 'সংগঠনের নির্ধারিত মাসিক চাঁদা প্রতি মাসের ১০ তারিখের মধ্যে ফান্ডে নিয়মিত পরিশোধ করতে হবে।',
    category: 'আর্থিক শৃঙ্খলা',
    isActive: true
  },
  {
    id: 'rule-3',
    pointNumber: 3,
    ruleText: 'জরুরি মুমূর্ষু রোগীর রক্তের প্রয়োজনে এবং প্রাকৃতিক দুর্যোগে ত্রাণ বিতরণে স্বতঃস্ফূর্তভাবে অংশগ্রহণ করতে হবে।',
    category: 'সেবামূলক কার্যক্রম',
    isActive: true
  },
  {
    id: 'rule-4',
    pointNumber: 4,
    ruleText: 'সংগঠনের সকল কার্যক্রম সম্পূর্ণ অরাজনৈতিক, অলাভজনক এবং দল-মত-ধর্ম নির্বিশেষে সর্বজনীন।',
    category: 'সংগঠন নীতি',
    isActive: true
  },
  {
    id: 'rule-5',
    pointNumber: 5,
    ruleText: 'সংগঠনের অভ্যন্তরীণ শৃঙ্খলা, সুনাম ও সদস্যদের পারস্পরিক সৌহার্দ্য রক্ষা করা প্রত্যেকের আবশ্যিক দায়িত্ব।',
    category: 'শৃঙ্খলা ও আচরণ',
    isActive: true
  },
  {
    id: 'rule-6',
    pointNumber: 6,
    ruleText: 'যেকোনো ব্যক্তিগত সমস্যা বা সাংগঠনিক মতানৈক্য কেন্দ্রীয় কার্যনির্বাহী পরিষদের পরামর্শক্রমে সমাধান করতে হবে।',
    category: 'প্রশাসনিক নিয়ম',
    isActive: true
  }
];
export const INITIAL_SUPPORT_REPORTS: SupportReportItem[] = [];

// Strictly dynamic: Zero dummy/placeholder representatives
export const INITIAL_SUPPORT_MEMBERS: SupportTeamMember[] = [];

