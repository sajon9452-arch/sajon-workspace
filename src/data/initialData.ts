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

export const INITIAL_MEMBERS: Member[] = [
  {
    id: 'm-1',
    name: 'মো: ছাদিকুর রহমান',
    designation: 'সভাপতি',
    phone: '01886122678',
    area: 'পতেঙ্গা, চট্টগ্রাম',
    email: 'sadek.sylhet@gmail.com',
    status: 'সক্রিয়',
    joinDate: '২০২২-০৮-১৫',
    serial: 1,
    isExecutive: true,
    bloodGroup: 'B+',
    createdAt: '2022-08-15T00:00:00.000Z'
  },
  {
    id: 'm-2',
    name: 'মো: আব্দুল্লাহ আল মামুন',
    designation: 'সাধারণ সম্পাদক',
    phone: '01711000001',
    area: 'পতেঙ্গা, চট্টগ্রাম',
    email: 'mamun.pms@gmail.com',
    status: 'সক্রিয়',
    joinDate: '২০২২-০৮-১৫',
    serial: 2,
    isExecutive: true,
    bloodGroup: 'O+',
    createdAt: '2022-08-15T00:01:00.000Z'
  },
  {
    id: 'm-3',
    name: 'মো: কাওছার আহমদ',
    designation: 'সাংগঠনিক সম্পাদক',
    phone: '01711000002',
    area: 'পতেঙ্গা, চট্টগ্রাম',
    status: 'সক্রিয়',
    joinDate: '২০২২-০৮-১৫',
    serial: 3,
    isExecutive: true,
    bloodGroup: 'A+',
    createdAt: '2022-08-15T00:02:00.000Z'
  },
  {
    id: 'm-4',
    name: 'মো: শফিকুল ইসলাম',
    designation: 'অর্থ সম্পাদক',
    phone: '01711000003',
    area: 'পতেঙ্গা, চট্টগ্রাম',
    status: 'সক্রিয়',
    joinDate: '২০২২-০৮-১৫',
    serial: 4,
    isExecutive: true,
    bloodGroup: 'O+',
    createdAt: '2022-08-15T00:03:00.000Z'
  },
  {
    id: 'm-5',
    name: 'মো: মিজানুর রহমান',
    designation: 'সহ-সভাপতি',
    phone: '01711000004',
    area: 'পতেঙ্গা, চট্টগ্রাম',
    status: 'সক্রিয়',
    joinDate: '২০২২-০৮-১৫',
    serial: 5,
    isExecutive: true,
    bloodGroup: 'B+',
    createdAt: '2022-08-15T00:04:00.000Z'
  },
  {
    id: 'm-6',
    name: 'ইঞ্জি: তারেক মাহমুদ',
    designation: 'দপ্তর সম্পাদক',
    phone: '01711000005',
    area: 'পতেঙ্গা, চট্টগ্রাম',
    status: 'সক্রিয়',
    joinDate: '২০২২-০৮-১৫',
    serial: 6,
    isExecutive: true,
    bloodGroup: 'AB+',
    createdAt: '2022-08-15T00:05:00.000Z'
  },
  {
    id: 'm-7',
    name: 'মো: নাজমুল হাসান',
    designation: 'প্রচার সম্পাদক',
    phone: '01711000006',
    area: 'পতেঙ্গা, চট্টগ্রাম',
    status: 'সক্রিয়',
    joinDate: '২০২২-০৮-১৫',
    serial: 7,
    isExecutive: true,
    bloodGroup: 'A+',
    createdAt: '2022-08-15T00:06:00.000Z'
  },
  {
    id: 'm-8',
    name: 'মো: সুজন আহমদ',
    designation: 'সমাজকল্যাণ সম্পাদক',
    phone: '01711000007',
    area: 'পতেঙ্গা, চট্টগ্রাম',
    status: 'সক্রিয়',
    joinDate: '২০২২-০৮-১৫',
    serial: 8,
    isExecutive: true,
    bloodGroup: 'O+',
    createdAt: '2022-08-15T00:07:00.000Z'
  },
  {
    id: 'm-9',
    name: 'মো: কামরুল ইসলাম',
    designation: 'ত্রাণ ও পুনর্বাসন সম্পাদক',
    phone: '01711000008',
    area: 'পতেঙ্গা, চট্টগ্রাম',
    status: 'সক্রিয়',
    joinDate: '২০২২-০৮-১৫',
    serial: 9,
    isExecutive: true,
    bloodGroup: 'B+',
    createdAt: '2022-08-15T00:08:00.000Z'
  },
  {
    id: 'm-10',
    name: 'মো: রুবেল মিয়া',
    designation: 'কার্যকরী সদস্য',
    phone: '01711000009',
    area: 'পতেঙ্গা, চট্টগ্রাম',
    status: 'সক্রিয়',
    joinDate: '২০২২-০৮-১৫',
    serial: 10,
    isExecutive: true,
    bloodGroup: 'A+',
    createdAt: '2022-08-15T00:09:00.000Z'
  },
  {
    id: 'm-11',
    name: 'মো: ফখরুল ইসলাম',
    designation: 'সাধারণ সদস্য',
    phone: '01711000010',
    area: 'পতেঙ্গা, চট্টগ্রাম',
    status: 'সক্রিয়',
    joinDate: '২০২২-০৯-০১',
    serial: 11,
    bloodGroup: 'O+',
    createdAt: '2022-09-01T00:00:00.000Z'
  },
  {
    id: 'm-12',
    name: 'মো: তানভীর আহমদ',
    designation: 'সাধারণ সদস্য',
    phone: '01711000011',
    area: 'পতেঙ্গা, চট্টগ্রাম',
    status: 'সক্রিয়',
    joinDate: '২০২২-০৯-১৫',
    serial: 12,
    bloodGroup: 'B+',
    createdAt: '2022-09-15T00:00:00.000Z'
  },
  {
    id: 'm-13',
    name: 'মো: হাবিবুর রহমান',
    designation: 'সাধারণ সদস্য',
    phone: '01711000012',
    area: 'পতেঙ্গা, চট্টগ্রাম',
    status: 'সক্রিয়',
    joinDate: '২০২২-১০-০১',
    serial: 13,
    bloodGroup: 'A+',
    createdAt: '2022-10-01T00:00:00.000Z'
  },
  {
    id: 'm-14',
    name: 'মো: জাহিদ হাসান',
    designation: 'সাধারণ সদস্য',
    phone: '01711000013',
    area: 'পতেঙ্গা, চট্টগ্রাম',
    status: 'সক্রিয়',
    joinDate: '২০২২-১০-১৫',
    serial: 14,
    bloodGroup: 'O+',
    createdAt: '2022-10-15T00:00:00.000Z'
  },
  {
    id: 'm-15',
    name: 'মো: রায়হান আহমদ',
    designation: 'প্রবাসী সদস্য',
    phone: '01711000014',
    area: 'মাস্কাট, ওমান',
    status: 'সক্রিয়',
    joinDate: '২০২২-১১-০১',
    serial: 15,
    isExpatriate: true,
    countryStatus: 'ওমান',
    bloodGroup: 'B+',
    createdAt: '2022-11-01T00:00:00.000Z'
  },
  {
    id: 'm-16',
    name: 'মো: সাহেদ আলী',
    designation: 'প্রবাসী সদস্য',
    phone: '01711000015',
    area: 'দোহা, কাতার',
    status: 'সক্রিয়',
    joinDate: '২০২২-১১-১৫',
    serial: 16,
    isExpatriate: true,
    countryStatus: 'কাতার',
    bloodGroup: 'A+',
    createdAt: '2022-11-15T00:00:00.000Z'
  },
  {
    id: 'm-17',
    name: 'মো: আরিফ চৌধুরী',
    designation: 'প্রবাসী সদস্য',
    phone: '01711000016',
    area: 'দুবাই, ইউএই',
    status: 'সক্রিয়',
    joinDate: '২০২২-১২-০১',
    serial: 17,
    isExpatriate: true,
    countryStatus: 'সংযুক্ত আরব আমিরাত',
    bloodGroup: 'O+',
    createdAt: '2022-12-01T00:00:00.000Z'
  },
  {
    id: 'm-18',
    name: 'মো: মাসুম বিল্লাহ',
    designation: 'সাধারণ সদস্য',
    phone: '01711000017',
    area: 'পতেঙ্গা, চট্টগ্রাম',
    status: 'সক্রিয়',
    joinDate: '২০২৩-০১-০১',
    serial: 18,
    bloodGroup: 'B+',
    createdAt: '2023-01-01T00:00:00.000Z'
  },
  {
    id: 'm-19',
    name: 'মো: সাইদুর রহমান',
    designation: 'সাধারণ সদস্য',
    phone: '01711000018',
    area: 'পতেঙ্গা, চট্টগ্রাম',
    status: 'সক্রিয়',
    joinDate: '২০২৩-০২-০১',
    serial: 19,
    bloodGroup: 'A+',
    createdAt: '2023-02-01T00:00:00.000Z'
  },
  {
    id: 'm-20',
    name: 'মো: ফরহাদ রেজা',
    designation: 'সাধারণ সদস্য',
    phone: '01711000019',
    area: 'পতেঙ্গা, চট্টগ্রাম',
    status: 'সক্রিয়',
    joinDate: '২০২৩-০৩-০১',
    serial: 20,
    bloodGroup: 'O+',
    createdAt: '2023-03-01T00:00:00.000Z'
  },
  {
    id: 'm-21',
    name: 'মো: ইমরান হোসেন',
    designation: 'সাধারণ সদস্য',
    phone: '01711000020',
    area: 'পতেঙ্গা, চট্টগ্রাম',
    status: 'সক্রিয়',
    joinDate: '২০২৩-০৪-০১',
    serial: 21,
    bloodGroup: 'B+',
    createdAt: '2023-04-01T00:00:00.000Z'
  },
  {
    id: 'm-22',
    name: 'মো: রফিকুল ইসলাম',
    designation: 'সাধারণ সদস্য',
    phone: '01711000021',
    area: 'পতেঙ্গা, চট্টগ্রাম',
    status: 'সক্রিয়',
    joinDate: '২০২৩-০৫-০১',
    serial: 22,
    bloodGroup: 'A+',
    createdAt: '2023-05-01T00:00:00.000Z'
  },
  {
    id: 'm-23',
    name: 'মো: আশরাফুল আলম',
    designation: 'সাধারণ সদস্য',
    phone: '01711000022',
    area: 'পতেঙ্গা, চট্টগ্রাম',
    status: 'সক্রিয়',
    joinDate: '২০২৩-০৬-০১',
    serial: 23,
    bloodGroup: 'O+',
    createdAt: '2023-06-01T00:00:00.000Z'
  },
  {
    id: 'm-24',
    name: 'মো: শাকিল আহমদ',
    designation: 'সাধারণ সদস্য',
    phone: '01711000023',
    area: 'পতেঙ্গা, চট্টগ্রাম',
    status: 'সক্রিয়',
    joinDate: '২০২৩-০৭-০১',
    serial: 24,
    bloodGroup: 'B+',
    createdAt: '2023-07-01T00:00:00.000Z'
  },
  {
    id: 'm-25',
    name: 'মো: জুবায়ের আহমদ',
    designation: 'সাধারণ সদস্য',
    phone: '01711000024',
    area: 'পতেঙ্গা, চট্টগ্রাম',
    status: 'সক্রিয়',
    joinDate: '২০২৩-০৮-০১',
    serial: 25,
    bloodGroup: 'A+',
    createdAt: '2023-08-01T00:00:00.000Z'
  }
];

export const INITIAL_DONORS: BloodDonor[] = [
  {
    id: 'd-1',
    name: 'মো: ছাদিকুর রহমান',
    phone: '01886122678',
    bloodGroup: 'B+',
    lastDonationDate: '২০২৫-১২-১০',
    totalDonations: 8,
    area: 'পতেঙ্গা, চট্টগ্রাম',
    isAvailable: true
  },
  {
    id: 'd-2',
    name: 'মো: আব্দুল্লাহ আল মামুন',
    phone: '01711000001',
    bloodGroup: 'O+',
    lastDonationDate: '২০২৬-০১-০৫',
    totalDonations: 12,
    area: 'পতেঙ্গা, চট্টগ্রাম',
    isAvailable: true
  },
  {
    id: 'd-3',
    name: 'মো: কাওছার আহমদ',
    phone: '01711000002',
    bloodGroup: 'A+',
    lastDonationDate: '২০২৫-১১-২০',
    totalDonations: 5,
    area: 'পতেঙ্গা, চট্টগ্রাম',
    isAvailable: true
  },
  {
    id: 'd-4',
    name: 'মো: শফিকুল ইসলাম',
    phone: '01711000003',
    bloodGroup: 'O+',
    lastDonationDate: '২০২৬-০২-১২',
    totalDonations: 6,
    area: 'পতেঙ্গা, চট্টগ্রাম',
    isAvailable: true
  },
  {
    id: 'd-5',
    name: 'ইঞ্জি: তারেক মাহমুদ',
    phone: '01711000005',
    bloodGroup: 'AB+',
    lastDonationDate: '২০২৫-১০-১৫',
    totalDonations: 9,
    area: 'পতেঙ্গা, চট্টগ্রাম',
    isAvailable: true
  }
];

export const INITIAL_NOTICES: Notice[] = [
  {
    id: 'n-1',
    title: 'কার্যকরী কমিটির জরুরি মাসিক মিটিং আহ্বান',
    content: 'সিলেট মানব সেবা সংগঠনের সকল কার্যকরী সদস্যের অবগতির জন্য জানানো যাচ্ছে যে, আগামী শুক্রবার সন্ধ্যা ৭:০০ ঘটিকায় সংগঠনের অস্থায়ী কার্যালয়ে জরুরি মাসিক পর্যালোচনা সভা অনুষ্ঠিত হবে। যথাসময়ে সকলের উপস্থিতি একান্ত কাম্য।',
    date: '২০২৬-০৩-১৫',
    category: 'কার্যকরী কমিটির মিটিং',
    author: 'সাধারণ সম্পাদক',
    priority: 'urgent',
    isUrgent: true
  },
  {
    id: 'n-2',
    title: 'রমজান উপলক্ষে গরিব ও অসহায়দের মাঝে ইফতার ও খাদ্য সামগ্রী বিতরণ',
    content: 'পবিত্র মাহে রমজান উপলক্ষে সিলেট মানব সেবা সংগঠনের উদ্যোগে উপকূলীয় ও সুবিধাবঞ্চিত পরিবারের মাঝে নিত্যপ্রয়োজনীয় খাদ্য সামগ্রী বিতরণ কর্মসূচি গ্রহণ করা হয়েছে। সকল সদস্যকে নিজ নিজ চাঁদা পরিশোধের অনুরোধ করা হচ্ছে।',
    date: '২০২৬-০৩-১০',
    category: 'ত্রাণ ও মানবিক কার্যক্রম',
    author: 'ত্রাণ সম্পাদক',
    priority: 'high'
  },
  {
    id: 'n-3',
    title: 'স্বেচ্ছায় রক্তদান ক্যাম্পেইন ও ফ্রি ব্লাড গ্রুপিং কর্মসূচি',
    content: 'মানবতার সেবায় নিবেদিত হয়ে সিলেট মানব সেবা সংগঠন আগামী মাসে দিনব্যাপী রক্তদান ক্যাম্পেইন পরিচালনা করবে। আগ্রহী রক্তদাতাদের তালিকাভুক্ত হতে আহ্বান জানানো হচ্ছে।',
    date: '২০২৬-০৩-০১',
    category: 'রক্তদান সেবা',
    author: 'প্রচার সম্পাদক',
    priority: 'normal'
  }
];

export const INITIAL_HOME_SLIDES: HomeSlide[] = [
  {
    id: 'slide-1',
    imageUrl: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=1200&q=80',
    title: 'বন্যার্তদের মাঝে জরুরি খাদ্য ও ত্রাণ সামগ্রী বিতরণ',
    description: 'বন্যাপীড়িত প্রত্যন্ত অঞ্চলে পরিবারের মুখে অন্ন তুলে দিতে চাল, ডাল, তেল ও বিশুদ্ধ পানি সরবরাহ।',
    category: 'ত্রাণ বিতরণ',
    date: '২০২৬-০৮-২৮',
    location: 'কোম্পানীগঞ্জ, সিলেট',
    isActive: true
  },
  {
    id: 'slide-2',
    imageUrl: 'https://images.unsplash.com/photo-1615461066841-6116e61058f4?auto=format&fit=crop&w=1200&q=80',
    title: 'স্বেচ্ছায় রক্তদান ক্যাম্পেইন ও মুমূর্ষু রোগীর পাশে দাঁড়ানো',
    description: 'সংগঠনের নিবেদিতপ্রাণ রক্তযোদ্ধাদের মাধ্যমে জরুরি রক্তের ব্যবস্থা ও বিনামূল্যে রক্তের গ্রুপ নির্ণয়।',
    category: 'রক্তদান',
    date: '২০২৬-০৮-১৫',
    location: 'সিলেট এম.এ.জি ওসমানী মেডিকেল চত্বর',
    isActive: true
  },
  {
    id: 'slide-3',
    imageUrl: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=1200&q=80',
    title: 'পরিবেশ সুরক্ষায় দেশব্যাপী বৃক্ষরোপণ কর্মসূচি',
    description: 'সবুজ বাংলাদেশ বিনির্মাণে বিভিন্ন শিক্ষাপ্রতিষ্ঠান ও মহাসড়কে ফলজ, বনজ ও ভেষজ চারা রোপণ।',
    category: 'বৃক্ষরোপণ',
    date: '২০২৬-০৭-২৫',
    location: 'পতেঙ্গা ও কর্ণফুলী উপকূলীয় অঞ্চল',
    isActive: true
  },
  {
    id: 'slide-4',
    imageUrl: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=1200&q=80',
    title: 'অসহায় পথশিশু ও প্রবীণদের মাঝে ভালোবাসা ও সহায়তা',
    description: 'দরিদ্র ও ছিন্নমূল মানুষের মুখে হাসি ফোটাতে নতুন পোশাক, পুষ্টিকর খাবার ও শিক্ষা উপকরণ বিতরণ।',
    category: 'অসহায় সেবা',
    date: '২০২৬-০৬-২০',
    location: 'সিলেট রেলওয়ে স্টেশন ও ক্বীন ব্রিজ এলাকা',
    isActive: true
  }
];

export const INITIAL_ORGANIZATION_RULES: OrganizationRule[] = [
  {
    id: 'rule-1',
    pointNumber: 1,
    ruleText: 'সংগঠনের সকল সদস্যকে দেশ, সমাজ ও মানবতার সেবায় সম্পূর্ণরূপে নিঃস্বার্থ ও দল-মত নিরপেক্ষভাবে কাজ করতে হবে।',
    category: 'মূলনীতি',
    isActive: true
  },
  {
    id: 'rule-2',
    pointNumber: 2,
    ruleText: 'রক্তদানের ক্ষেত্রে কোনো প্রকার আর্থিক সুবিধা বা উপঢৌকন গ্রহণ সম্পূর্ণরূপে নিষিদ্ধ; রক্তদান একটি পবিত্র মানবিক আমানত।',
    category: 'রক্তদান সেবা',
    isActive: true
  },
  {
    id: 'rule-3',
    pointNumber: 3,
    ruleText: 'সংগঠনের ফান্ডের প্রতিটি টাকা (আয় ও ব্যয়) সুনির্দিষ্ট ভাউচার ও ট্রানজেকশন আইডিসহ ডিজিটাল ক্যাশবুকে তাৎক্ষণিক এন্ট্রি নিশ্চিত করতে হবে।',
    category: 'আর্থিক স্বচ্ছতা',
    isActive: true
  },
  {
    id: 'rule-4',
    pointNumber: 4,
    ruleText: 'ত্রাণ বিতরণ বা জরুরি যেকোনো সাহায্য সরাসরি প্রকৃত অসচ্ছল ও ক্ষতিগ্রস্ত ব্যক্তির হাতে ভলান্টিয়ারদের উপস্থিতিতে পৌঁছে দিতে হবে।',
    category: 'ত্রাণ ও সেবা',
    isActive: true
  },
  {
    id: 'rule-5',
    pointNumber: 5,
    ruleText: 'সকল সদস্যকে মাসিক সাধারণ মিটিং ও জরুরি উদ্ধার কার্যক্রমে সক্রিয় উপস্থিতি নিশ্চিত করতে হবে।',
    category: 'শৃঙ্খলা ও উপস্থিতি',
    isActive: true
  },
  {
    id: 'rule-6',
    pointNumber: 6,
    ruleText: 'সংগঠনের নাম বা লোগো ব্যবহার করে ব্যক্তিগত স্বার্থ হাসিল বা সংগঠনের ভাবমূর্তি ক্ষুণ্নকারী কর্মকাণ্ড প্রমাণিত হলে তাৎক্ষণিক সদস্যপদ বাতিল হবে।',
    category: 'নীতিমালা',
    isActive: true
  }
];

export const INITIAL_HUMANITARIAN_ACTIVITIES: HumanitarianActivity[] = [
  {
    id: 'act-1',
    title: 'অসুস্থ রিকশাচালক কাসেম মিয়ার জরুরি চিকিৎসা ফান্ড',
    description: 'পতেঙ্গা এলাকার অসচ্ছল রিকশাচালক কাসেম মিয়ার হার্ট অপারেশনের জন্য জরুরি ঔষধ ও নগদ সহায়তা প্রদান।',
    date: '২০২৬-০৩-০১',
    location: 'পতেঙ্গা, চট্টগ্রাম',
    amount: 15000,
    recipientName: 'মো: কাসেম মিয়া',
    isFeatured: true
  },
  {
    id: 'act-2',
    title: 'এতিম মাদরাসা শিক্ষার্থীদের শিক্ষা উপকরণ বিতরণ',
    description: 'সিলেট মানব সেবা সংগঠনের উদ্যোগে ৫০ জন অসচ্ছল ও এতিম ছাত্র-ছাত্রীর মাঝে কুরআন শরিফ, খাতা ও কলম উপহার।',
    date: '২০২৬-০২-১৫',
    location: 'কোম্পানীগঞ্জ, সিলেট',
    amount: 10000,
    recipientName: 'মাদরাসার এতিম শিক্ষার্থীবৃন্দ',
    isFeatured: true
  }
];

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

export const INITIAL_FUNDS: FundRecord[] = [];
