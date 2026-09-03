import { Member, BloodDonor, Notice, FundRecord, OrganizationProfile, SupportReportItem, HomeSlide, HumanitarianActivity, OrganizationRule } from '../types';

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

export const INITIAL_MEMBERS: Member[] = [];

export const INITIAL_DONORS: BloodDonor[] = [];

export const INITIAL_NOTICES: Notice[] = [];

export const INITIAL_FUNDS: FundRecord[] = [];

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

export const INITIAL_HUMANITARIAN_ACTIVITIES: HumanitarianActivity[] = [
  {
    id: 'act-1',
    title: 'বন্যাপীড়িত অসহায় পরিবারের মাঝে জরুরি পুষ্টি ও খাদ্য সহায়তা বিতরণ',
    description: 'অতিবৃষ্টি ও পাহাড়ি ঢলে পানিবন্দি পরিবারের ঘরে ঘরে গিয়ে খাদ্য সামগ্রী ও নিত্যপ্রয়োজনীয় জিনিসপত্র পৌঁছে দেওয়া হয়েছে।',
    itemsGiven: 'চাল ১০ কেজি, মসুর ডাল ২ কেজি, সয়াবিন তেল ১ লিটার, আলু ৩ কেজি, লবণ ১ কেজি, খাবার স্যালাইন ১০ প্যাকেট ও পানি বিশুদ্ধকরণ ট্যাবলেট।',
    cost: 2350,
    handledBy: 'মো: আব্দুল্লাহ আল মামুন (সাধারণ সম্পাদক) ও টিম ভলান্টিয়ার্স',
    recipientName: 'মোসাম্মৎ জমিলা খাতুন (বয়স: ৫৮ বছর)',
    recipientPhotoUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=300&q=80',
    date: '২০২৬-০৮-২৮',
    location: 'কোম্পানীগঞ্জ ও গোয়াইনঘাট, সিলেট',
    isFeatured: true
  },
  {
    id: 'act-2',
    title: 'দুর্ঘটনায় আহত দরিদ্র দিনমজুর ভাইয়ের জরুরি চিকিৎসা ও ওষুধ ফান্ড',
    description: 'পেশাগত কাজে আহত দিনমজুর ভাইয়ের চোখের জরুরি অপারেশন ও পরবর্তী ৩ মাসের প্রয়োজনীয় ওষুধের সম্পূর্ণ খরচ সংগঠনের ফান্ড থেকে বহন করা হয়েছে।',
    itemsGiven: 'চক্ষু চিকিৎসা ব্যয়, চোখের লেন্স ড্রপ, অ্যান্টিবায়োটিক এবং নগদ ৩,৫০০ টাকা জরুরি জীবনযাত্রার অনুদান।',
    cost: 5800,
    handledBy: 'ইঞ্জি: তারেক মাহমুদ (রক্তদান ও সেবা সমন্বয়ক)',
    recipientName: 'মো: রহিম উল্লাহ (বয়স: ৫২ বছর)',
    recipientPhotoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    date: '২০২৬-০৮-১৮',
    location: 'পতেঙ্গা, চট্টগ্রাম',
    isFeatured: false
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
    category: 'সদস্যপদ বাতিল নীতিমালা',
    isActive: true
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

