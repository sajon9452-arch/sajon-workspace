import { HumanitarianActivity, Notice } from '../types';

export interface OrganizationEvent {
  id: string;
  title: string;
  category: 'meeting' | 'relief' | 'blood' | 'medical' | 'environment' | 'anniversary' | 'special';
  categoryLabelBn: string;
  dateStr: string; // YYYY-MM-DD
  time?: string;
  location?: string;
  description: string;
  organizer?: string;
  targetBeneficiaries?: string;
  isUrgent?: boolean;
  cost?: number;
}

// 2026 Official Pre-Scheduled Organization Events for সিলেট মানব সেবা সংগঠন
export const OFFICIAL_ORG_EVENTS_2026: OrganizationEvent[] = [
  // January
  {
    id: 'org-ev-1',
    title: 'শীতবস্ত্র ও কম্বল বিতরণ কর্মসূচি ২০২৬',
    category: 'relief',
    categoryLabelBn: 'ত্রাণ ও বিতরণ',
    dateStr: '2026-01-09',
    time: 'সকাল ১০:০০ টা',
    location: 'সুরমা নদীর তীরবর্তী বস্তি এলাকা ও মালনীছড়া চা বাগান, সিলেট',
    description: 'তীব্র শৈত্যপ্রবাহে শীতার্ত প্রান্তিক দিনমজুর ও চা শ্রমিকদের মাঝে মানসম্মত কম্বল ও উলের চাদর বিতরণ।',
    organizer: 'ত্রাণ ও দুর্যোগ ব্যবস্থাপনা উপ-কমিটি',
    targetBeneficiaries: '৪০০+ শীতার্ত পরিবার',
  },
  {
    id: 'org-ev-2',
    title: 'বছরের প্রথম কার্যনির্বাহী ও সাংগঠনিক পরিকল্পনা সভা',
    category: 'meeting',
    categoryLabelBn: 'কার্যনির্বাহী সভা',
    dateStr: '2026-01-16',
    time: 'বিকাল ৪:৩০ টা',
    location: 'কেন্দ্রীয় কার্যালয়, আম্বরখানা, সিলেট',
    description: '২০২৬ সালের বার্ষিক মানবকল্যাণ কর্মপরিকল্পনা ও তহবিল ব্যবস্থাপনা নির্ধারণ বিষয়ক বিশেষ সভা।',
    organizer: 'কেন্দ্রীয় কার্যনির্বাহী পরিষদ',
  },

  // February
  {
    id: 'org-ev-3',
    title: 'মাসিক সমন্বয় সভা ও তহবিল অডিট পর্যালোচনা',
    category: 'meeting',
    categoryLabelBn: 'সমন্বয় সভা',
    dateStr: '2026-02-06',
    time: 'বিকাল ৫:০০ টা',
    location: 'প্রধান কার্যালয়, আম্বরখানা, সিলেট',
    description: 'সংগঠনের আয়-ব্যয়ের স্বচ্ছতা নিরীক্ষণ এবং পরবর্তী মাসের রক্তদান ও সেবা কর্মসূচির পরিকল্পনা।',
    organizer: 'অর্থ ও হিসাব নিরীক্ষণ বিভাগ',
  },
  {
    id: 'org-ev-4',
    title: 'অমর একুশে স্মরণে মেগা রক্তদান ও ফ্রি ব্লাড গ্রুপিং ক্যাম্পেইন',
    category: 'blood',
    categoryLabelBn: 'রক্তদান ক্যাম্প',
    dateStr: '2026-02-21',
    time: 'সকাল ৯:০০ টা - বিকাল ৫:০০ টা',
    location: 'সিলেট কেন্দ্রীয় শহীদ মিনার চত্বর, চৌহাট্টা',
    description: 'মহান ভাষা আন্দোলনের অমর শহীদদের স্মরণে দিনব্যাপী উন্মুক্ত রক্ত সংগ্রহ এবং রক্তের গ্রুপ নির্ণয় কর্মসূচি।',
    organizer: 'রক্তদান সেবা উইং ও যুব স্বেচ্ছাসেবক দল',
    targetBeneficiaries: '১৫০+ ব্যাগ রক্ত সংগ্রহ ও ৫০০ জনের গ্রুপ নির্ণয়',
  },

  // March
  {
    id: 'org-ev-5',
    title: 'মাসিক সাধারণ সভা ও মাহে রমজান ফুড প্যাক পরিকল্পনা',
    category: 'meeting',
    categoryLabelBn: 'সাধারণ সভা',
    dateStr: '2026-03-06',
    time: 'বিকাল ৫:০০ টা',
    location: 'কেন্দ্রীয় মিলনায়তন, আম্বরখানা, সিলেট',
    description: 'মাহে রমজানে দরিদ্র ও অসহায় রোজাদার পরিবারের তালিকা চূড়ান্তকরণ ও ত্রাণ কমিটি গঠন।',
    organizer: 'কেন্দ্রীয় পরিচালনা পর্ষদ',
  },
  {
    id: 'org-ev-6',
    title: 'মাহে রমজান উপলক্ষে হতদরিদ্র রোজাদারদের মাঝে খাদ্যসামগ্রী বিতরণ',
    category: 'relief',
    categoryLabelBn: 'ত্রাণ ও বিতরণ',
    dateStr: '2026-03-12',
    time: 'সকাল ১০:৩০ টা',
    location: 'সিলেট সদর, টুকেরবাজার ও খাদিমনগর ইউনিয়ন',
    description: 'চাল, ডাল, তেল, চিনি, ছোলা, খেজুর ও প্রয়োজনীয় খাদ্যদ্রব্য সম্বলিত বিশেষ রমজান প্যাকেজ প্রদান।',
    organizer: 'ত্রাণ বিতরণ সেল',
    targetBeneficiaries: '৩০০+ দুস্থ পরিবার',
  },
  {
    id: 'org-ev-7',
    title: 'সুবিধাবঞ্চিত পথশিশুদের সাথে ইফতার মাহফিল ও নতুন ঈদবস্ত্র বিতরণ',
    category: 'special',
    categoryLabelBn: 'ঈদ উপহার বিতরণ',
    dateStr: '2026-03-24',
    time: 'বিকাল ৪:৩০ টা',
    location: 'সিলেট সরকারি শিশু পরিবার (বালক/বালিকা) প্রাঙ্গণ',
    description: 'পবিত্র ঈদুল ফিতর উপলক্ষে এতিম ও সুবিধাবঞ্চিত শিশুদের মুখে হাসি ফোটাতে নতুন পোশাক ও ইফতার আয়োজন।',
    organizer: 'সামাজিক কল্যাণ বিষয়ক কমিটি',
    targetBeneficiaries: '২০০ জন শিশু',
  },

  // April
  {
    id: 'org-ev-8',
    title: 'ঈদ পুনর্মিলনী ও মাসিক সাংগঠনিক পর্যালোচনা সভা',
    category: 'meeting',
    categoryLabelBn: 'সাংগঠনিক সভা',
    dateStr: '2026-04-10',
    time: 'বিকাল ৪:০০ টা',
    location: 'প্রধান কার্যালয়, সিলেট',
    description: 'ঈদের শুভেচ্ছা বিনিময় ও আসন্ন গ্রীষ্মকালীন স্বাস্থ্য ক্যাম্পেইন সংক্রান্ত বিশেষ পর্যালোচনা।',
    organizer: 'সদস্য ব্যবস্থাপনা ও কল্যাণ সেল',
  },
  {
    id: 'org-ev-9',
    title: 'বিনামূল্যে চিকিৎসা সেবা, ডায়াবেটিস পরীক্ষা ও জরুরি ওষুধ বিতরণ',
    category: 'medical',
    categoryLabelBn: 'ফ্রি মেডিকেল ক্যাম্প',
    dateStr: '2026-04-24',
    time: 'সকাল ৯:৩০ টা - দুপুর ২:০০ টা',
    location: 'দক্ষিণ সুরমা কমিউনিটি ক্লিনিক প্রাঙ্গণ, সিলেট',
    description: 'বিশেষজ্ঞ চিকিৎসকদের পরামর্শ, বিনামূল্যে ওষুধ প্রদান ও ডায়াবেটিস-রক্তচাপ নির্ণয় ক্যাম্প।',
    organizer: 'মেডিকেল ও স্বাস্থ্য সেবা উইং',
    targetBeneficiaries: '৪০০+ রোগী',
  },

  // May
  {
    id: 'org-ev-10',
    title: 'ঐতিহাসিক মে দিবস: শ্রমজীবী মানুষের মাঝে বিশুদ্ধ পানি ও ওরাল স্যালাইন বিতরণ',
    category: 'relief',
    categoryLabelBn: 'মানবিক সেবা',
    dateStr: '2026-05-01',
    time: 'সকাল ১১:০০ টা',
    location: 'ক্বীন ব্রিজ পয়েন্ট, বন্দরবাজার ও আম্বরখানা মোড়, সিলেট',
    description: 'গ্রীষ্মের তীব্র দাবদাহে রিকশাচালক, দিনমজুর ও পথচারীদের মাঝে ঠাণ্ডা মিনারেল ওয়াটার ও স্যালাইন বিতরণ।',
    organizer: 'যুব স্বেচ্ছাসেবক টিম',
    targetBeneficiaries: '১০০০+ পথচারী ও মেহনতি মানুষ',
  },
  {
    id: 'org-ev-11',
    title: 'মাসিক সমন্বয় সভা ও বন্যা সতর্কবার্তা মনিটরিং সেল গঠন',
    category: 'meeting',
    categoryLabelBn: 'সমন্বয় সভা',
    dateStr: '2026-05-08',
    time: 'বিকাল ৫:৩০ টা',
    location: 'প্রধান কার্যালয়, সিলেট',
    description: 'বর্ষা মৌসুমে পাহাড়ি ঢল ও সম্ভাব্য সিলেট বন্যা পরিস্থিতিতে দ্রুত উদ্ধার ও ত্রাণ সেল গঠন।',
    organizer: 'জরুরি দুর্যোগ ব্যবস্থাপনা স্কোয়াড',
  },

  // June
  {
    id: 'org-ev-12',
    title: 'বিশ্ব পরিবেশ দিবস: সিলেট জুড়ে ফলদ ও বনজ বৃক্ষরোপণ অভিযান',
    category: 'environment',
    categoryLabelBn: 'পরিবেশ কর্মসূচি',
    dateStr: '2026-06-05',
    time: 'সকাল ১০:০০ টা',
    location: 'সিলেট ওসমানী আন্তর্জাতিক বিমানবন্দর মহাসড়ক ও বিভিন্ন মাদরাসা প্রাঙ্গণ',
    description: 'সবুজ সিলেট বিনির্মাণে বিভিন্ন শিক্ষাপ্রতিষ্ঠান ও মহাসড়কের পাশে ফলজ-বনজ গাছের চারা রোপণ ও বিতরণ।',
    organizer: 'পরিবেশ ও যুব উন্নয়ন সেল',
    targetBeneficiaries: '৫০০+ চারা রোপণ',
  },
  {
    id: 'org-ev-13',
    title: 'সিলেট অঞ্চলের সম্ভাব্য বন্যা প্রস্তুতি ও জরুরি ত্রাণ প্রস্তুতি সভা',
    category: 'meeting',
    categoryLabelBn: 'জরুরি সভা',
    dateStr: '2026-06-19',
    time: 'বিকাল ৫:০০ টা',
    location: 'প্রধান কার্যালয়, আম্বরখানা, সিলেট',
    description: 'হাওর ও নিম্নাঞ্চলের সার্বিক পানি পরিস্থিতি পর্যালোচনা এবং নৌকা ও শুকনা খাবারের অগ্রিম স্টক প্রস্তুত।',
    organizer: 'জরুরি ত্রাণ টাস্কফোর্স',
    isUrgent: true,
  },

  // July
  {
    id: 'org-ev-14',
    title: 'মাসিক কার্যনির্বাহী সভা ও দুর্যোগ পুনর্বাসন পর্যালোচনা',
    category: 'meeting',
    categoryLabelBn: 'কার্যনির্বাহী সভা',
    dateStr: '2026-07-03',
    time: 'বিকাল ৫:০০ টা',
    location: 'প্রধান কার্যালয়, সিলেট',
    description: 'চলমান মানবিক সহায়তা কার্যক্রমের স্বচ্ছ হিসাব নিকাশ এবং তৃণমূল প্রতিনিধিদের প্রতিবেদন পর্যালোচনা।',
    organizer: 'কেন্দ্রীয় পরিষদ',
  },
  {
    id: 'org-ev-15',
    title: 'বন্যাদুর্গত পানিবন্দি মানুষের মাঝে শুকনা খাবার ও বিশুদ্ধ পানি বিতরণ',
    category: 'relief',
    categoryLabelBn: 'ত্রাণ ও বিতরণ',
    dateStr: '2026-07-17',
    time: 'সকাল ৯:০০ টা',
    location: 'কোম্পানীগঞ্জ ও গোয়াইনঘাট হাওরাঞ্চল, সিলেট',
    description: 'পানিবন্দি দুর্গত পরিবারের ঘরে ঘরে স্পিডবোট যোগে মুড়ি, চিড়া, গুড়, বিস্কুট, পানি বিশুদ্ধকরণ ট্যাবলেট ও ওষুধ বিতরণ।',
    organizer: 'জরুরি রেসকিউ টিম',
    targetBeneficiaries: '৬০০+ বন্যাকবলিত পরিবার',
  },

  // August
  {
    id: 'org-ev-16',
    title: 'মাসিক সমন্বয় সভা ও চিকিৎসাধীন অসচ্ছল রোগীদের আর্থিক সাহায্য অনুমোদন',
    category: 'meeting',
    categoryLabelBn: 'সমন্বয় সভা',
    dateStr: '2026-08-07',
    time: 'বিকাল ৫:০০ টা',
    location: 'প্রধান কার্যালয়, সিলেট',
    description: 'সংগঠনের রোগী কল্যাণ তহবিল হতে যাচাইকৃত জটিল রোগীদের এককালীন চিকিৎসা অনুদান প্রদান চূড়ান্তকরণ।',
    organizer: 'রোগী কল্যাণ ও মানবিক সহায়তা সেল',
  },
  {
    id: 'org-ev-17',
    title: 'মুহূর্তে রক্তদানে জীবন বাঁচান: জরুরি মেগা রক্তদান উৎসব ২০২৬',
    category: 'blood',
    categoryLabelBn: 'রক্তদান ক্যাম্প',
    dateStr: '2026-08-28',
    time: 'সকাল ৯:০০ টা - বিকাল ৪:০০ টা',
    location: 'সিলেট এম এ জি ওসমানী মেডিকেল কলেজ মাঠ প্রাঙ্গণ',
    description: 'থ্যালাসেমিয়া ও কিডনি ডায়ালাইসিস রোগীদের জন্য জরুরি রক্ত সংগ্রহ এবং নিয়মিত দাতাদের বিশেষ সম্মাননা।',
    organizer: 'সিলেট মানব সেবা রক্তদান উইং',
    targetBeneficiaries: '২০০+ ব্যাগ রক্ত সংগ্রহ',
  },

  // September
  {
    id: 'org-ev-18',
    title: 'মাসিক কার্যনির্বাহী সভা ও শরৎকালীন সেবামূলক কাজের মূল্যায়ন',
    category: 'meeting',
    categoryLabelBn: 'কার্যনির্বাহী সভা',
    dateStr: '2026-09-04',
    time: 'বিকাল ৫:০০ টা',
    location: 'প্রধান কার্যালয়, সিলেট',
    description: 'পূর্ববর্তী ৩ মাসের কাজের অগ্রগতি পর্যালোচনা এবং আগামী প্রান্তিকের বাজেট অনুমোদন।',
    organizer: 'সচিবালয় শাখা',
  },
  {
    id: 'org-ev-19',
    title: 'সুবিধাভোগী দরিদ্র শিক্ষার্থীদের মাঝে শিক্ষা উপকরণ ও খাতা-কলম বিতরণ',
    category: 'special',
    categoryLabelBn: 'শিক্ষা সহায়তা',
    dateStr: '2026-09-18',
    time: 'সকাল ১১:০০ টা',
    location: 'জৈন্তাপুর মডেল সরকারি প্রাথমিক বিদ্যালয় মাঠ, সিলেট',
    description: 'ঝরে পড়া রোধে দরিদ্র মেধাবী শিশুদের মাঝে স্কুল ব্যাগ, জ্যামিতি বক্স, খাতা, কলম ও অনুদান বিতরণ।',
    organizer: 'শিক্ষা ও মেধা বিকাশ উপ-কমিটি',
    targetBeneficiaries: '১৫০ জন মেধাবী শিক্ষার্থী',
  },

  // October
  {
    id: 'org-ev-20',
    title: 'মাসিক সাধারণ সভা ও ত্রৈমাসিক আয়-ব্যয় প্রতিবেদন প্রকাশ',
    category: 'meeting',
    categoryLabelBn: 'সাধারণ সভা',
    dateStr: '2026-10-09',
    time: 'বিকাল ৫:০০ টা',
    location: 'কেন্দ্রীয় মিলনায়তন, সিলেট',
    description: 'সংগঠনের সকল সদস্যের উপস্থিতিতে উন্মুক্ত প্রশ্নোত্তর ও ডিজিটাল আর্থিক প্রতিবেদন প্রদর্শন।',
    organizer: 'কেন্দ্রীয় কার্যনির্বাহী পরিষদ',
  },
  {
    id: 'org-ev-21',
    title: 'শারীরিক প্রতিবন্ধী ও পক্ষাঘাতগ্রস্ত ব্যক্তিদের মাঝে হুইলচেয়ার বিতরণ',
    category: 'special',
    categoryLabelBn: 'প্রতিবন্ধী সহায়তা',
    dateStr: '2026-10-23',
    time: 'সকাল ১১:৩০ টা',
    location: 'সিলেট জেলা পরিষদ মিলনায়তন চত্বর',
    description: 'অসহায় ও প্রান্তিক পক্ষাঘাতগ্রস্ত ব্যক্তিদের স্বাভাবিক চলাচলের সুবিধার্থে বিনামূল্যে উন্নত হুইলচেয়ার ও ক্র্যাচ প্রদান।',
    organizer: 'মানব কল্যাণ ও পুনর্বাসন শাখা',
    targetBeneficiaries: '৫০ জন বিশেষ চাহিদাসম্পন্ন ব্যক্তি',
  },

  // November
  {
    id: 'org-ev-22',
    title: 'সিলেট মানব সেবা সংগঠন এর শুভ প্রতিষ্ঠা বার্ষিকী ও গুণীজন সমাবেশ',
    category: 'anniversary',
    categoryLabelBn: 'প্রতিষ্ঠা বার্ষিকী',
    dateStr: '2026-11-06',
    time: 'বিকাল ৩:০০ টা',
    location: 'কেন্দ্রীয় মুসলিম সাহিত্য সংসদ হল, দরগাহ গেট, সিলেট',
    description: 'মানবতার সেবায় সংগঠনটির গৌরবোজ্জ্বল যাত্রার প্রতিষ্ঠা বার্ষিকী উপলক্ষে আলোচনা সভা ও বিশিষ্ট সমাজসেবক সম্মাননা।',
    organizer: 'প্রতিষ্ঠা বার্ষিকী উদযাপন পর্ষদ',
  },
  {
    id: 'org-ev-23',
    title: 'আসন্ন শীতকালীন ত্রাণ তহবিল সংগ্রহ ও স্বেচ্ছাসেবী ওরিয়েন্টেশন',
    category: 'meeting',
    categoryLabelBn: 'জরুরি সভা',
    dateStr: '2026-11-20',
    time: 'বিকাল ৪:৩০ টা',
    location: 'প্রধান কার্যালয়, আম্বরখানা, সিলেট',
    description: 'শীতার্ত চা বাগান ও নদী তীরবর্তী মানুষের জন্য শীতবস্ত্র সংগ্রহের টার্গেট ও ভলান্টিয়ার টিম ব্রিফিং।',
    organizer: 'স্বেচ্ছাসেবী পরিচালনা সেল',
  },

  // December
  {
    id: 'org-ev-24',
    title: 'বার্ষিক সাধারণ সভা (AGM ২০২৬) ও ভবিষ্যৎ কর্মপরিকল্পনা গ্রহণ',
    category: 'meeting',
    categoryLabelBn: 'বার্ষিক সাধারণ সভা (AGM)',
    dateStr: '2026-12-04',
    time: 'সকাল ১০:০০ টা',
    location: 'জেলা শিল্পকলা একাডেমি মিলনায়তন, সিলেট',
    description: 'পুরো বছরের সামগ্রিক কার্যক্রমের মূল্যায়ন, অডিট রিপোর্ট অনুমোদন এবং ২০২৭ সালের নির্বাহী রূপরেখা পেশ।',
    organizer: 'কেন্দ্রীয় উপদেষ্টা ও কার্যনির্বাহী পরিষদ',
  },
  {
    id: 'org-ev-25',
    title: 'মহান বিজয় দিবস: বীর মুক্তিযোদ্ধাদের সম্মাননা ও বয়স্ক পুনর্বাসন ক্যাম্প',
    category: 'special',
    categoryLabelBn: 'বিজয় দিবস অনুষ্ঠান',
    dateStr: '2026-12-16',
    time: 'সকাল ৯:৩০ টা',
    location: 'সিলেট কেন্দ্রীয় শহীদ মিনার ও আম্বরখানা পয়েন্ট',
    description: 'মহান বিজয় দিবসে রক্তদান, বীর মুক্তিযোদ্ধাদের উত্তরীয় প্রদান এবং দুস্থ প্রবীণদের খাদ্য সামগ্রী বিতরণ।',
    organizer: 'জাতীয় দিবস উদযাপন পর্ষদ',
  },
  {
    id: 'org-ev-26',
    title: 'প্রান্তিক চা শ্রমিক ও শীতার্ত মানুষের মাঝে শীতবস্ত্র ও কম্বল বিতরণ ২০২৬',
    category: 'relief',
    categoryLabelBn: 'ত্রাণ ও বিতরণ',
    dateStr: '2026-12-25',
    time: 'সকাল ১০:০০ টা',
    location: 'লাক্কাতুরা ও তারাপুর চা বাগান বস্তি অঞ্চল, সিলেট',
    description: 'শীতের তীব্রতায় প্রান্তিক জনগোষ্ঠীর উষ্ণতা নিশ্চিতে কম্বল, জ্যাকেট ও গরম পোশাক বিতরণ।',
    organizer: 'শীতবস্ত্র বিতরণ বিশেষ টাস্কফোর্স',
    targetBeneficiaries: '৫০০+ চা শ্রমিক ও গ্রামীণ পরিবার',
  },
];

/**
 * Merges official events with any dynamically provided events from notices or humanitarian activities
 */
export function getAllOrganizationEvents(
  humanitarianActivities: HumanitarianActivity[] = [],
  notices: Notice[] = []
): OrganizationEvent[] {
  const events = [...OFFICIAL_ORG_EVENTS_2026];

  // Convert humanitarian activities that have dates in 2026 into calendar events
  humanitarianActivities.forEach((act) => {
    if (act.date && act.date.startsWith('2026')) {
      // Check if not already matching an event by date & title
      const exists = events.some(
        (e) => e.dateStr === act.date && e.title.toLowerCase() === act.title.toLowerCase()
      );
      if (!exists) {
        events.push({
          id: `act-${act.id}`,
          title: act.title,
          category: 'relief',
          categoryLabelBn: 'ত্রাণ কার্যক্রম',
          dateStr: act.date,
          location: act.location || 'সিলেট',
          description: `${act.description}${act.itemsGiven ? ` • বিতরণকৃত সামগ্রী: ${act.itemsGiven}` : ''}`,
          organizer: act.handledBy || 'স্বেচ্ছাসেবী টিম',
          cost: act.cost,
        });
      }
    }
  });

  // Convert meeting / urgent notices that have dates in 2026
  notices.forEach((n) => {
    if (n.date && n.date.startsWith('2026') && (n.category === 'জরুরি' || n.category === 'কার্যক্রম' || n.priority === 'মিটিং' || n.priority === 'ত্রাণ')) {
      const exists = events.some((e) => e.dateStr === n.date);
      if (!exists) {
        events.push({
          id: `notice-ev-${n.id}`,
          title: n.title || 'সাংগঠনিক বিশেষ নোটিশ ও কর্মসূচি',
          category: n.priority === 'মিটিং' ? 'meeting' : 'special',
          categoryLabelBn: n.priority === 'মিটিং' ? 'সাংগঠনিক সভা' : 'বিশেষ কর্মসূচি',
          dateStr: n.date,
          description: n.noticeText,
          location: 'সিলেট',
          organizer: 'সিলেট মানব সেবা সংগঠন',
          isUrgent: n.priority === 'জরুরি' || n.priority === 'মিটিং',
        });
      }
    }
  });

  // Sort chronologically
  return events.sort((a, b) => a.dateStr.localeCompare(b.dateStr));
}
