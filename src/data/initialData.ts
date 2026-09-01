import { Member, BloodDonor, Notice, FundRecord, OrganizationProfile, SupportReportItem } from '../types';

export const INITIAL_ORG_PROFILE: OrganizationProfile = {
  name: 'সিলেট মানব সেবা সংগঠন',
  tagline: 'মানবতার কল্যাণে নিবেদিত প্রাণ',
  establishedDate: '১৫/০৮/২০২২ইং',
  establishedYear: '২০২২',
  address: 'পতেঙ্গা, চট্টগ্রাম',
  hotline: '',
  emergencyContact: '',
  regNumber: '২০২২/০৮',
  phone: ''
};

export const INITIAL_MEMBERS: Member[] = [];

export const INITIAL_DONORS: BloodDonor[] = [];

export const INITIAL_NOTICES: Notice[] = [];

export const INITIAL_FUNDS: FundRecord[] = [];

export const INITIAL_SUPPORT_REPORTS: SupportReportItem[] = [
  {
    id: 'sup-1',
    name: 'মো: আব্দুল্লাহ আল মামুন',
    designation: 'সাধারণ সম্পাদক ও প্রধান হেল্পডেস্ক সমন্বয়ক',
    subject: 'সংগঠনের সদস্যপদ ও সার্বিক তথ্য সহায়তা',
    phone: '01886122678',
    description: 'সিলেট মানব সেবা সংগঠনের যেকোনো কার্যক্রম, নতুন সদস্য যোগদান বা জরুরি প্রয়োজনে সার্বক্ষণিক যোগাযোগ করতে পারেন।',
    type: 'সহায়তা',
    status: 'active',
    createdAt: '2026-08-15'
  },
  {
    id: 'sup-2',
    name: 'ইঞ্জি: তারেক মাহমুদ',
    designation: 'রক্তদান ও জরুরি সেবা সমন্বয়ক',
    subject: 'জরুরি রক্ত অনুসন্ধান ও ডোনার সমন্বয়',
    phone: '01711000000',
    description: 'চট্টগ্রাম ও সিলেট এলাকায় যেকোনো গ্রুপের জরুরি রক্তের প্রয়োজনে এবং রক্তদাতা নিবন্ধনে সার্বক্ষণিক যোগাযোগ ও সহায়তা প্রদান করা হয়।',
    type: 'রক্তদান বিষয়ক',
    status: 'active',
    createdAt: '2026-08-16'
  },
  {
    id: 'sup-3',
    name: 'ডা: নাজমুল হাসান',
    designation: 'স্বাস্থ্য ও চিকিৎসা ফান্ড উপদেষ্টা',
    subject: 'জরুরি চিকিৎসা সহায়তা ও ফান্ড আবেদন',
    phone: '01912345678',
    description: 'দরিদ্র ও অসহায় রোগীদের চিকিৎসা ফান্ড আবেদন এবং স্বাস্থ্য সংক্রান্ত যেকোনো পরামর্শের জন্য সরাসরি কথা বলতে পারেন।',
    type: 'সহায়তা',
    status: 'active',
    createdAt: '2026-08-20'
  }
];

