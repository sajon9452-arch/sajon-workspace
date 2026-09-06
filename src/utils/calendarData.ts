import { toBengaliNumber } from './helpers';

export interface PublicHoliday {
  id: string;
  nameBn: string;
  nameEn: string;
  dateStr: string; // YYYY-MM-DD
  endDateStr?: string; // For multi-day holidays (e.g., Eid)
  dayNameBn: string;
  daysCount: number;
  type: 'general' | 'executive' | 'optional';
  typeLabelBn: string;
  category: 'national' | 'muslim' | 'hindu' | 'buddhist' | 'christian' | 'ethnic';
  categoryLabelBn: string;
  isMoonDependent?: boolean;
  description: string;
}

export interface BanglaDate {
  day: number;
  monthNameBn: string;
  year: number;
  seasonBn: string; // ঋতু
}

export interface HijriDate {
  day: number;
  monthNameBn: string;
  year: number;
}

export interface DayCalendarInfo {
  date: Date;
  dateStr: string; // YYYY-MM-DD
  dayOfMonth: number;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ..., 5 = Friday, 6 = Saturday
  dayNameBn: string;
  dayNameShortBn: string;
  isWeekend: boolean; // Friday (5) or Saturday (6)
  bangla: BanglaDate;
  hijri: HijriDate;
  holidays: PublicHoliday[];
  isToday: boolean;
}

// 2026 Official Government Holidays in Bangladesh
export const BANGLADESH_HOLIDAYS_2026: PublicHoliday[] = [
  {
    id: 'h-0',
    nameBn: 'ইংরেজি নববর্ষ',
    nameEn: 'New Year’s Day',
    dateStr: '2026-01-01',
    dayNameBn: 'বৃহস্পতিবার',
    daysCount: 1,
    type: 'optional',
    typeLabelBn: 'ঐচ্ছিক ছুটি ও পালনীয় দিবস',
    category: 'national',
    categoryLabelBn: 'আন্তর্জাতিক দিবস',
    description: 'আন্তর্জাতিক গ্রেগরিয়ান ক্যালেন্ডারের শুভ সূচনা ও নববর্ষের শুভেচ্ছা।',
  },
  {
    id: 'h-01',
    nameBn: 'শ্রী শ্রী সরস্বতী পূজা (শ্রী পঞ্চমী)',
    nameEn: 'Saraswati Puja',
    dateStr: '2026-01-23',
    dayNameBn: 'শুক্রবার',
    daysCount: 1,
    type: 'optional',
    typeLabelBn: 'ঐচ্ছিক ছুটি',
    category: 'hindu',
    categoryLabelBn: 'হিন্দু পর্ব',
    description: 'বিদ্যা ও সঙ্গীতের দেবী সরস্বতীর আরাধনা তিথি উপলক্ষে সরকারি ঐচ্ছিক ছুটি।',
  },
  {
    id: 'h-1',
    nameBn: 'পবিত্র শবে বরাত',
    nameEn: 'Shab-e-Barat',
    dateStr: '2026-02-04',
    dayNameBn: 'বুধবার',
    daysCount: 1,
    type: 'executive',
    typeLabelBn: 'নির্বাহী আদেশে ছুটি',
    category: 'muslim',
    categoryLabelBn: 'মুসলিম পর্ব',
    isMoonDependent: true,
    description: 'পবিত্র সৌভাগ্যের রজনী উপলক্ষে নির্বাহী আদেশে সরকারি ছুটি।',
  },
  {
    id: 'h-2',
    nameBn: 'শহীদ দিবস ও আন্তর্জাতিক মাতৃভাষা দিবস',
    nameEn: 'Shaheed Day & International Mother Language Day',
    dateStr: '2026-02-21',
    dayNameBn: 'শনিবার',
    daysCount: 1,
    type: 'general',
    typeLabelBn: 'সাধারণ ছুটি',
    category: 'national',
    categoryLabelBn: 'জাতীয় দিবস',
    description: '১৯৫২ সালের মহান ভাষা আন্দোলনের অমর শহীদদের স্মরণে জাতীয় শোক ও সাধারণ ছুটি।',
  },
  {
    id: 'h-3',
    nameBn: 'পবিত্র শবে কদর',
    nameEn: 'Shab-e-Qadr',
    dateStr: '2026-03-17',
    dayNameBn: 'মঙ্গলবার',
    daysCount: 1,
    type: 'executive',
    typeLabelBn: 'নির্বাহী আদেশে ছুটি',
    category: 'muslim',
    categoryLabelBn: 'মুসলিম পর্ব',
    isMoonDependent: true,
    description: 'পবিত্র লাইলাতুল কদর মহিমান্বিত রজনী উপলক্ষে সরকারি ছুটি।',
  },
  {
    id: 'h-4',
    nameBn: 'জুমাতুল বিদা',
    nameEn: 'Jumatul Wida',
    dateStr: '2026-03-20',
    dayNameBn: 'শুক্রবার',
    daysCount: 1,
    type: 'executive',
    typeLabelBn: 'নির্বাহী আদেশে ছুটি',
    category: 'muslim',
    categoryLabelBn: 'মুসলিম পর্ব',
    isMoonDependent: true,
    description: 'পবিত্র মাহে রমজানের শেষ জুমুয়াবার উপলক্ষে সরকারি ছুটি।',
  },
  {
    id: 'h-5',
    nameBn: 'পবিত্র ঈদুল ফিতর (চাঁদ রাত ও ৩ দিনের ছুটি)',
    nameEn: 'Eid-ul-Fitr',
    dateStr: '2026-03-20',
    endDateStr: '2026-03-22',
    dayNameBn: 'শুক্রবার – রবিবার',
    daysCount: 3,
    type: 'general',
    typeLabelBn: 'সাধারণ ছুটি ও নির্বাহী আদেশ',
    category: 'muslim',
    categoryLabelBn: 'মুসলিম পর্ব',
    isMoonDependent: true,
    description: 'পবিত্র ঈদুল ফিতর উপলক্ষে ৩ দিনের সরকারি ছুটি (ঈদের আগের দিন, ঈদের দিন ও ঈদের পরের দিন)।',
  },
  {
    id: 'h-6',
    nameBn: 'স্বাধীনতা ও জাতীয় দিবস',
    nameEn: 'Independence & National Day',
    dateStr: '2026-03-26',
    dayNameBn: 'বৃহস্পতিবার',
    daysCount: 1,
    type: 'general',
    typeLabelBn: 'সাধারণ ছুটি',
    category: 'national',
    categoryLabelBn: 'জাতীয় দিবস',
    description: '১৯৭১ সালের মহান মুক্তিযুদ্ধের সূচনালগ্ন ও বাংলাদেশের স্বাধীনতা দিবস।',
  },
  {
    id: 'h-7',
    nameBn: 'বাংলা নববর্ষ (পহেলা বৈশাখ ১৪৩৩)',
    nameEn: 'Bengali New Year (Pahela Baishakh)',
    dateStr: '2026-04-14',
    dayNameBn: 'মঙ্গলবার',
    daysCount: 1,
    type: 'executive',
    typeLabelBn: 'নির্বাহী আদেশে ছুটি',
    category: 'national',
    categoryLabelBn: 'জাতীয় উৎসব',
    description: 'বাঙালির প্রাণের উৎসব বাংলা শুভ নববর্ষ ১৪৩৩ উদযাপন উপলক্ষে সরকারি ছুটি।',
  },
  {
    id: 'h-8',
    nameBn: 'মে দিবস (আন্তর্জাতিক শ্রমিক দিবস)',
    nameEn: 'May Day',
    dateStr: '2026-05-01',
    dayNameBn: 'শুক্রবার',
    daysCount: 1,
    type: 'general',
    typeLabelBn: 'সাধারণ ছুটি',
    category: 'national',
    categoryLabelBn: 'আন্তর্জাতিক দিবস',
    description: 'আন্তর্জাতিক শ্রমিক দিবস ও অধিকার আদায়ের স্মরণে সাধারণ ছুটি।',
  },
  {
    id: 'h-9',
    nameBn: 'বুদ্ধ পূর্ণিমা (বৈশাখী পূর্ণিমা)',
    nameEn: 'Buddha Purnima',
    dateStr: '2026-05-02',
    dayNameBn: 'শনিবার',
    daysCount: 1,
    type: 'general',
    typeLabelBn: 'সাধারণ ছুটি',
    category: 'buddhist',
    categoryLabelBn: 'বৌদ্ধ পর্ব',
    isMoonDependent: true,
    description: 'গৌতম বুদ্ধের জন্ম, বোধিলাভ ও মহাপরিনির্বাণ তিথি উপলক্ষে সাধারণ ছুটি।',
  },
  {
    id: 'h-10',
    nameBn: 'পবিত্র ঈদুল আজহা (কোরবানির ঈদ ও ৩ দিনের ছুটি)',
    nameEn: 'Eid-ul-Adha',
    dateStr: '2026-05-27',
    endDateStr: '2026-05-29',
    dayNameBn: 'বুধবার – শুক্রবার',
    daysCount: 3,
    type: 'general',
    typeLabelBn: 'সাধারণ ছুটি ও নির্বাহী আদেশ',
    category: 'muslim',
    categoryLabelBn: 'মুসলিম পর্ব',
    isMoonDependent: true,
    description: 'পবিত্র ঈদুল আজহা উপলক্ষে ৩ দিনের সরকারি ছুটি (ঈদের আগের দিন, ঈদের দিন ও ঈদের পরের দিন)।',
  },
  {
    id: 'h-11',
    nameBn: 'পবিত্র আশুরা (মহররম)',
    nameEn: 'Holy Ashura',
    dateStr: '2026-06-26',
    dayNameBn: 'শুক্রবার',
    daysCount: 1,
    type: 'executive',
    typeLabelBn: 'নির্বাহী আদেশে ছুটি',
    category: 'muslim',
    categoryLabelBn: 'মুসলিম পর্ব',
    isMoonDependent: true,
    description: 'পবিত্র ১০ই মহররম কারবালার শোকাবহ স্মৃতি ও আশুরা উপলক্ষে সরকারি ছুটি।',
  },
  {
    id: 'h-11b',
    nameBn: 'ব্যাংক হলিডে (অর্ধবার্ষিক)',
    nameEn: 'Bank Holiday (Half-yearly)',
    dateStr: '2026-07-01',
    dayNameBn: 'বুধবার',
    daysCount: 1,
    type: 'executive',
    typeLabelBn: 'ব্যাংক ও আর্থিক প্রতিষ্ঠান ছুটি',
    category: 'national',
    categoryLabelBn: 'প্রাতিষ্ঠানিক ছুটি',
    description: 'বাণিজ্যিক ব্যাংক ও আর্থিক প্রতিষ্ঠানের অর্ধবার্ষিক হিসাব বিবরণী প্রস্তুতের ছুটি।',
  },
  {
    id: 'h-12',
    nameBn: 'পবিত্র ঈদে মিলাদুন্নবী (সা.)',
    nameEn: 'Eid-e-Miladunnabi (PBUH)',
    dateStr: '2026-08-26',
    dayNameBn: 'বুধবার',
    daysCount: 1,
    type: 'general',
    typeLabelBn: 'সাধারণ ছুটি',
    category: 'muslim',
    categoryLabelBn: 'মুসলিম পর্ব',
    isMoonDependent: true,
    description: 'সর্বকালের সর্বশ্রেষ্ঠ মানব হযরত মুহাম্মদ (সা.)-এর পবিত্র বেলাদত ও ওফাত দিবস।',
  },
  {
    id: 'h-13',
    nameBn: 'শ্রী শ্রী জন্মাষ্টমী',
    nameEn: 'Janmashtami',
    dateStr: '2026-09-04',
    dayNameBn: 'শুক্রবার',
    daysCount: 1,
    type: 'general',
    typeLabelBn: 'সাধারণ ছুটি',
    category: 'hindu',
    categoryLabelBn: 'হিন্দু পর্ব',
    description: 'ভগবান শ্রীকৃষ্ণের শুভ আবির্ভাব তিথি জন্মাষ্টমী উপলক্ষে সাধারণ ছুটি।',
  },
  {
    id: 'h-14a',
    nameBn: 'শ্রী শ্রী দুর্গাপূজা (মহা নবমী)',
    nameEn: 'Durga Puja (Maha Nabami)',
    dateStr: '2026-10-20',
    dayNameBn: 'মঙ্গলবার',
    daysCount: 1,
    type: 'executive',
    typeLabelBn: 'নির্বাহী আদেশে ছুটি',
    category: 'hindu',
    categoryLabelBn: 'হিন্দু পর্ব',
    description: 'শারদীয় দুর্গোৎসবের মহা নবমী উপলক্ষে সরকারি ছুটি।',
  },
  {
    id: 'h-14',
    nameBn: 'শ্রী শ্রী দুর্গাপূজা (বিজয়া দশমী)',
    nameEn: 'Durga Puja (Bijoya Dashami)',
    dateStr: '2026-10-21',
    dayNameBn: 'বুধবার',
    daysCount: 1,
    type: 'general',
    typeLabelBn: 'সাধারণ ছুটি',
    category: 'hindu',
    categoryLabelBn: 'হিন্দু পর্ব',
    description: 'সনাতন ধর্মাবলম্বীদের প্রধান ধর্মীয় উৎসব শারদীয় দুর্গাপূজার বিজয়া দশমী উপলক্ষে ছুটি।',
  },
  {
    id: 'h-14b',
    nameBn: 'জাতীয় বিপ্লব ও সংহতি দিবস',
    nameEn: 'National Revolution & Solidarity Day',
    dateStr: '2026-11-07',
    dayNameBn: 'শনিবার',
    daysCount: 1,
    type: 'optional',
    typeLabelBn: 'ঐচ্ছিক ছুটি ও বিশেষ দিবস',
    category: 'national',
    categoryLabelBn: 'জাতীয় দিবস',
    description: '১৯৭৫ সালের ঐতিহাসিক জাতীয় বিপ্লব ও সংহতি স্মরণে বিশেষ জাতীয় দিবস।',
  },
  {
    id: 'h-15a',
    nameBn: 'শহীদ বুদ্ধিজীবী দিবস',
    nameEn: 'Martyred Intellectuals Day',
    dateStr: '2026-12-14',
    dayNameBn: 'সোমবার',
    daysCount: 1,
    type: 'optional',
    typeLabelBn: 'জাতীয় শোক ও পালনীয় দিবস',
    category: 'national',
    categoryLabelBn: 'জাতীয় দিবস',
    description: '১৯৭১ সালে বিজয়ের প্রাক্কালে শহীদ শ্রেষ্ঠ বুদ্ধিজীবীদের স্মরণে বিনম্র শ্রদ্ধা।',
  },
  {
    id: 'h-15',
    nameBn: 'মহান বিজয় দিবস',
    nameEn: 'Victory Day',
    dateStr: '2026-12-16',
    dayNameBn: 'বুধবার',
    daysCount: 1,
    type: 'general',
    typeLabelBn: 'সাধারণ ছুটি',
    category: 'national',
    categoryLabelBn: 'জাতীয় দিবস',
    description: '১৯৭১ সালে নয় মাসের রক্তক্ষয়ী যুদ্ধের পর বিজয়ের স্মারক গৌরবময় জাতীয় বিজয় দিবস।',
  },
  {
    id: 'h-16',
    nameBn: 'যিশু খ্রিস্টের জন্মদিন (বড়দিন)',
    nameEn: 'Christmas Day',
    dateStr: '2026-12-25',
    dayNameBn: 'শুক্রবার',
    daysCount: 1,
    type: 'general',
    typeLabelBn: 'সাধারণ ছুটি',
    category: 'christian',
    categoryLabelBn: 'খ্রিস্টান পর্ব',
    description: 'খ্রিস্টধর্মাবলম্বীদের সর্বপ্রধান ধর্মীয় উৎসব শুভ বড়দিন উপলক্ষে সাধারণ ছুটি।',
  },
  {
    id: 'h-17',
    nameBn: 'ব্যাংক হলিডে (বার্ষিক হিসাব সমাপনী)',
    nameEn: 'Bank Holiday (Year-end)',
    dateStr: '2026-12-31',
    dayNameBn: 'বৃহস্পতিবার',
    daysCount: 1,
    type: 'executive',
    typeLabelBn: 'ব্যাংক ও আর্থিক প্রতিষ্ঠান ছুটি',
    category: 'national',
    categoryLabelBn: 'প্রাতিষ্ঠানিক ছুটি',
    description: 'ব্যাংক ও আর্থিক প্রতিষ্ঠানের বাৎসরিক হিসাব চূড়ান্তকরণের জন্য নির্ধারিত ছুটি।',
  },
];

export interface SylhetMonthlyLandscape {
  monthIndex: number; // 0 to 11
  monthNameBn: string;
  monthNameEn: string;
  titleBn: string;
  locationBn: string;
  taglineBn: string;
  descriptionBn: string;
  imageUrl: string;
  featuredSeasonBn: string;
  banglaPeriodBn: string;
  hijriPeriodBn: string;
}

export const SYLHET_MONTHLY_SCENIC_LANDSCAPES: SylhetMonthlyLandscape[] = [
  {
    monthIndex: 0,
    monthNameBn: 'জানুয়ারি',
    monthNameEn: 'January',
    titleBn: 'মালনীছড়া চা বাগান, সিলেট',
    locationBn: 'সিলেট সদর',
    taglineBn: 'উপমহাদেশের প্রাচীনতম সুরম্য চা বাগান ও সবুজের গালিচা',
    descriptionBn: '১৮৫৪ সালে প্রতিষ্ঠিত উপমহাদেশের প্রথম চা বাগান। শীতের সকালে শিশিরভেজা সবুজ টিলা ও মিষ্টি কুয়াশার অপরূপ মেলবন্ধন।',
    imageUrl: '/src/assets/images/sylhet_tea_garden_1788671827287.jpg',
    featuredSeasonBn: 'শীতকাল',
    banglaPeriodBn: 'পৌষ – মাঘ ১৪৩২',
    hijriPeriodBn: 'রজব – শা’বান ১৪৪৭',
  },
  {
    monthIndex: 1,
    monthNameBn: 'ফেব্রুয়ারি',
    monthNameEn: 'February',
    titleBn: 'রাতারগুল সোয়াম্প ফরেস্ট, সিলেট',
    locationBn: 'গোয়াইনঘাট, সিলেট',
    taglineBn: 'বাংলার আমাজন ও মিষ্টি জলের চিরসবুজ জলমগ্ন অরণ্য',
    descriptionBn: 'বাংলাদেশের একমাত্র স্বীকৃত মিষ্টি জলের সোয়াম্প ফরেস্ট। করচ আর হিজল গাছের জলমগ্ন শাখাপ্রশাখার মাঝে ডিঙ্গি নৌকায় ভেসে বেড়ানোর অপূর্ব রোমাঞ্চ।',
    imageUrl: '/src/assets/images/sylhet_ratargul_swamp_1788671805674.jpg',
    featuredSeasonBn: 'বসন্তকাল ও শীতের বিদায়',
    banglaPeriodBn: 'মাঘ – ফাল্গুন ১৪৩২',
    hijriPeriodBn: 'শা’বান – রমজান ১৪৪৭',
  },
  {
    monthIndex: 2,
    monthNameBn: 'মার্চ',
    monthNameEn: 'March',
    titleBn: 'জাফলং জিরো পয়েন্ট ও পিয়াইন নদী, সিলেট',
    locationBn: 'গোয়াইনঘাট, সিলেট',
    taglineBn: 'মেঘালয়ের আকাশছোঁয়া পাহাড়, ডাউকি ঝুলন্ত সেতু ও স্বচ্ছ নদী',
    descriptionBn: 'সীমান্ত নদী পিয়াইনের স্বচ্ছ জলধারা, রঙিন নুড়ি পাথর এবং সীমান্তের ওপারে ভারতের ডাউকি ঝুলন্ত সেতুর মোহনীয় প্রাকৃতিক ক্যানভাস।',
    imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1400&q=80',
    featuredSeasonBn: 'বসন্তকাল',
    banglaPeriodBn: 'ফাল্গুন – চৈত্র ১৪৩২',
    hijriPeriodBn: 'রমজান – শাওয়াল ১৪৪৭',
  },
  {
    monthIndex: 3,
    monthNameBn: 'এপ্রিল',
    monthNameEn: 'April',
    titleBn: 'লালাখাল ও পান্না সবুজ জলধারা, সিলেট',
    locationBn: 'জৈন্তাপুর, সিলেট',
    taglineBn: 'পান্না-সবুজ ও নীল জলের মায়াবী নদী ও চা বাগানঘেরা পাহাড়ি রূপ',
    descriptionBn: 'প্রাকৃতিক খনিজের প্রভাবে লালাখালের নদীজল ঋতুভেদে অপার্থিব পান্না সবুজ রূপ ধারণ করে। দুই তীরের সবুজ টিলা আর নীরব নিসর্গ ভ্রমণপিপাসুদের মুগ্ধ করে।',
    imageUrl: 'https://images.unsplash.com/photo-1439066615861-d1af74d74000?auto=format&fit=crop&w=1400&q=80',
    featuredSeasonBn: 'গ্রীষ্মকাল (বৈশাখী আবহ)',
    banglaPeriodBn: 'চৈত্র ১৪৩২ – বৈশাখ ১৪৩৩',
    hijriPeriodBn: 'শাওয়াল – জিলকদ ১৪৪৭',
  },
  {
    monthIndex: 4,
    monthNameBn: 'মে',
    monthNameEn: 'May',
    titleBn: 'বিছানাকান্দি পাথুরে নদী ও পাহাড়ি ঝরনা, সিলেট',
    locationBn: 'গোয়াইনঘাট, সিলেট',
    taglineBn: 'মেঘের কোলে মেঘালয় পাহাড় ও স্বচ্ছ পাথুরে নদীর অপূর্ব মিলন',
    descriptionBn: 'উঁচু খাসিয়া পাহাড়ের কোল বেয়ে নেমে আসা দুধসাদা জলপ্রপাত ও নদীর বুকে ছড়িয়ে থাকা হাজারো পাথরের ওপর দিয়ে বয়ে চলা শীতল জলের কলতান।',
    imageUrl: 'https://images.unsplash.com/photo-1433086966358-54859d0ed716?auto=format&fit=crop&w=1400&q=80',
    featuredSeasonBn: 'গ্রীষ্মকাল (জ্যৈষ্ঠ)',
    banglaPeriodBn: 'বৈশাখ – জ্যৈষ্ঠ ১৪৩৩',
    hijriPeriodBn: 'জিলকদ – জিলহজ ১৪৪৭',
  },
  {
    monthIndex: 5,
    monthNameBn: 'জুন',
    monthNameEn: 'June',
    titleBn: 'ভোলাগঞ্জ ‘সাদা পাথর’, সিলেট',
    locationBn: 'কোম্পানীগঞ্জ, সিলেট',
    taglineBn: 'ধলাই নদীর হিমশীতল স্রোতধারা ও দুধ-সাদা পাথরের রূপকথা',
    descriptionBn: 'সিলেটের কাশ্মীরখ্যাত ভোলাগঞ্জ জিরো পয়েন্ট। পাহাড়ি ঝরনাধারা ও ধলাই নদীর মোহনায় দুধ-সাদা পাথরের স্বর্গীয় সৌন্দর্য পর্যটকদের বিমোহিত করে।',
    imageUrl: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1400&q=80',
    featuredSeasonBn: 'বর্ষাকাল (আষাঢ়)',
    banglaPeriodBn: 'জ্যৈষ্ঠ – আষাঢ় ১৪৩৩',
    hijriPeriodBn: 'জিলহজ ১৪৪৭ – মহররম ১৪৪৮',
  },
  {
    monthIndex: 6,
    monthNameBn: 'জুলাই',
    monthNameEn: 'July',
    titleBn: 'হাকালুকি হাওর ও বর্ষার দিগন্তজোড়া জলরাশি, সিলেট',
    locationBn: 'মৌলভীবাজার ও সিলেট অঞ্চল',
    taglineBn: 'এশিয়ার অন্যতম বৃহত্তম মিষ্টি পানির সুবিশাল উন্মুক্ত হাওর',
    descriptionBn: 'বর্ষার পূর্ণ মৌসুমে হাকালুকি হয়ে ওঠে যেন এক মহাসমুদ্র। ঢেউয়ের কলতান, ভাসমান জলজ গাছপালা ও সূর্যাস্তের রঙে রাঙানো প্রকৃতির অপার রূপ।',
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=80',
    featuredSeasonBn: 'বর্ষাকাল (শ্রাবণ)',
    banglaPeriodBn: 'আষাঢ় – শ্রাবণ ১৪৩৩',
    hijriPeriodBn: 'মহররম – সফর ১৪৪৮',
  },
  {
    monthIndex: 7,
    monthNameBn: 'আগস্ট',
    monthNameEn: 'August',
    titleBn: 'মাধবকুণ্ড জলপ্রপাত ও বনানী, সিলেট বিভাগ',
    locationBn: 'বড়লেখা, সিলেট অঞ্চল',
    taglineBn: 'প্রায় ২০০ ফুট সুউচ্চ পাহাড়ি খাদ বেয়ে আছড়ে পড়া প্রাকৃতিক ঝরনা',
    descriptionBn: 'বর্ষার জলে পূর্ণযৌবনা মাধবকুণ্ড জলপ্রপাতের অবিরাম গর্জন ও চারপাশের নিবিড় চিরহরিৎ বনাঞ্চলের সতেজ শ্যামল স্নিগ্ধতা।',
    imageUrl: 'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=1400&q=80',
    featuredSeasonBn: 'বর্ষা ও শরৎকালের সূচনা',
    banglaPeriodBn: 'শ্রাবণ – ভাদ্র ১৪৩৩',
    hijriPeriodBn: 'সফর – রবিউল আউয়াল ১৪৪৮',
  },
  {
    monthIndex: 8,
    monthNameBn: 'সেপ্টেম্বর',
    monthNameEn: 'September',
    titleBn: 'ঐতিহাসিক শাহী ঈদগাহ ময়দান, সিলেট',
    locationBn: 'সিলেট মহানগর',
    taglineBn: 'মুঘল আমলের ঐতিহ্যবাহী দুর্গসদৃশ স্থাপত্য ও ঐতিহাসিক ঈদগাহ',
    descriptionBn: 'মুঘল সম্রাট আওরঙ্গজেবের শাসনামলে নির্মিত সিলেটের সবচেয়ে প্রাচীন ও সুবৃহৎ উন্মুক্ত ঈদগাহ ময়দান। এর প্রাচীন ২২টি গম্বুজ স্থাপত্যের স্মৃতি বহন করে।',
    imageUrl: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=1400&q=80',
    featuredSeasonBn: 'শরৎকাল',
    banglaPeriodBn: 'ভাদ্র – আশ্বিন ১৪৩৩',
    hijriPeriodBn: 'রবিউল আউয়াল – রবিউস সানি ১৪৪৮',
  },
  {
    monthIndex: 9,
    monthNameBn: 'অক্টোবর',
    monthNameEn: 'October',
    titleBn: 'ঐতিহাসিক ক্বীন ব্রিজ ও সুরমা নদী তীর, সিলেট',
    locationBn: 'সুরমা নদী, সিলেট সদর',
    taglineBn: '১৯৩৬ সালের ঐতিহাসিক ধনুকাকৃতির আর্চ সেতু ও সিলেটের প্রবেশদ্বার',
    descriptionBn: 'সিলেটের প্রবেশদ্বার খ্যাত ঐতিহাসিক ক্বীন ব্রিজ। সুরমা নদীর বুক চিরে দাঁড়িয়ে থাকা লাল রঙের এই সুরম্য সেতুটি সিলেটের শতবর্ষী অহংকার।',
    imageUrl: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=1400&q=80',
    featuredSeasonBn: 'হেমন্তকাল',
    banglaPeriodBn: 'আশ্বিন – কার্তিক ১৪৩৩',
    hijriPeriodBn: 'রবিউস সানি – জমাদিউল আউয়াল ১৪৪৮',
  },
  {
    monthIndex: 10,
    monthNameBn: 'নভেম্বর',
    monthNameEn: 'November',
    titleBn: 'হযরত শাহ জালাল (রহ.) দরগাহ চত্বর, সিলেট',
    locationBn: 'দরগাহ মহল্লা, সিলেট',
    taglineBn: 'পুণ্যভূমি ও আধ্যাত্মিক রাজধানী সিলেটের শান্তির প্রাঙ্গণ',
    descriptionBn: 'সিলেটের ঐতিহ্যবাহী আধ্যাত্মিক প্রতীক হযরত শাহ জালাল (রহ.)-এর পুণ্যভূমি। সুফি ভাবগাম্ভীর্য, পবিত্র গজার মাছের পুকুর ও শান্ত সৌম্য পরিবেশ।',
    imageUrl: 'https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?auto=format&fit=crop&w=1400&q=80',
    featuredSeasonBn: 'হেমন্তকাল ও কুয়াশাচ্ছন্ন সকাল',
    banglaPeriodBn: 'কার্তিক – অগ্রহায়ণ ১৪৩৩',
    hijriPeriodBn: 'জমাদিউল আউয়াল – জমাদিউস সানি ১৪৪৮',
  },
  {
    monthIndex: 11,
    monthNameBn: 'ডিসেম্বর',
    monthNameEn: 'December',
    titleBn: 'টাঙ্গুয়ার হাওর ও নীল জলরাশি, সিলেট অঞ্চল',
    locationBn: 'তাহিরপুর ও সুনামগঞ্জ সীমান্ত',
    taglineBn: 'বিশ্ব ঐতিহ্য রামসার সাইট, অতিথি পাখির কলকাকলি ও নীল জলের মায়াজাল',
    descriptionBn: 'শীতের আগমনে সাইবেরিয়া ও দূরদেশ থেকে ঝাঁকে ঝাঁকে আসা পরিযায়ী পাখির মেলা, স্বচ্ছ নীল পানি এবং মেঘালয় পর্বতমালার অপরূপ নৈসর্গিক রূপ।',
    imageUrl: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1400&q=80',
    featuredSeasonBn: 'শীতকাল',
    banglaPeriodBn: 'অগ্রহায়ণ – পৌষ ১৪৩৩',
    hijriPeriodBn: 'জমাদিউস সানি – রজব ১৪৪৮',
  },
];

// Helper to retrieve holidays for a specific month (0 to 11)
export function getMonthHolidays(monthIndex: number): PublicHoliday[] {
  const monthNum = monthIndex + 1;
  const monthStr = String(monthNum).padStart(2, '0');
  const monthPrefix = `2026-${monthStr}`;

  return BANGLADESH_HOLIDAYS_2026.filter((h) => {
    if (h.dateStr.startsWith(monthPrefix)) return true;
    if (h.endDateStr && h.endDateStr.startsWith(monthPrefix)) return true;
    return false;
  }).sort((a, b) => a.dateStr.localeCompare(b.dateStr));
}

export const MONTH_NAMES_BN = [
  'জানুয়ারি',
  'ফেব্রুয়ারি',
  'মার্চ',
  'এপ্রিল',
  'মে',
  'জুন',
  'জুলাই',
  'আগস্ট',
  'সেপ্টেম্বর',
  'অক্টোবর',
  'নভেম্বর',
  'ডিসেম্বর',
];

export const MONTH_NAMES_EN = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export const DAY_NAMES_BN = [
  'রবিবার',
  'সোমবার',
  'মঙ্গলবার',
  'বুধবার',
  'বৃহস্পতিবার',
  'শুক্রবার',
  'শনিবার',
];

export const DAY_NAMES_SHORT_BN = [
  'রবি',
  'সোম',
  'মঙ্গল',
  'বুধ',
  'বৃহঃ',
  'শুক্র',
  'শনি',
];

// Helper to convert Gregorian Date to Bangla Date (Bangladesh Standard)
export function getBanglaDate(date: Date): BanglaDate {
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-indexed (0 = Jan, 11 = Dec)
  const day = date.getDate();

  // Determine Bangla Year
  // Pahela Baishakh is on April 14
  let banglaYear = year - 593;
  if (month < 3 || (month === 3 && day < 14)) {
    banglaYear = year - 594;
  }

  let banglaMonth = '';
  let banglaDay = 1;
  let season = '';

  // Dates in Bangladesh calendar
  // 1. Boishakh (31 days): Apr 14 - May 14
  // 2. Jaishthe (31 days): May 15 - Jun 14
  // 3. Ashadh (31 days): Jun 15 - Jul 15
  // 4. Shraban (31 days): Jul 16 - Aug 15
  // 5. Bhadra (31 days): Aug 16 - Sep 15
  // 6. Ashwin (31 days): Sep 16 - Oct 16
  // 7. Kartik (30 days): Oct 17 - Nov 15
  // 8. Agrahayan (30 days): Nov 16 - Dec 15
  // 9. Poush (30 days): Dec 16 - Jan 14
  // 10. Magh (30 days): Jan 15 - Feb 13
  // 11. Falgun (29 days in non-leap): Feb 14 - Mar 14
  // 12. Chaitra (30 days): Mar 15 - Apr 13

  if (month === 0) {
    // January
    if (day <= 14) {
      banglaMonth = 'পৌষ';
      banglaDay = day + 16;
      season = 'শীতকাল';
    } else {
      banglaMonth = 'মাঘ';
      banglaDay = day - 14;
      season = 'শীতকাল';
    }
  } else if (month === 1) {
    // February
    if (day <= 13) {
      banglaMonth = 'মাঘ';
      banglaDay = day + 17;
      season = 'শীতকাল';
    } else {
      banglaMonth = 'ফাল্গুন';
      banglaDay = day - 13;
      season = 'বসন্তকাল';
    }
  } else if (month === 2) {
    // March
    if (day <= 14) {
      banglaMonth = 'ফাল্গুন';
      banglaDay = day + 15; // Feb 28 days -> Feb 14 = 1 Falgun, Feb 28 = 15 Falgun, Mar 1 = 16 Falgun
      season = 'বসন্তকাল';
    } else {
      banglaMonth = 'চৈত্র';
      banglaDay = day - 14;
      season = 'বসন্তকাল';
    }
  } else if (month === 3) {
    // April
    if (day <= 13) {
      banglaMonth = 'চৈত্র';
      banglaDay = day + 17;
      season = 'বসন্তকাল';
    } else {
      banglaMonth = 'বৈশাখ';
      banglaDay = day - 13;
      season = 'গ্রীষ্মকাল';
    }
  } else if (month === 4) {
    // May
    if (day <= 14) {
      banglaMonth = 'বৈশাখ';
      banglaDay = day + 17;
      season = 'গ্রীষ্মকাল';
    } else {
      banglaMonth = 'জ্যৈষ্ঠ';
      banglaDay = day - 14;
      season = 'গ্রীষ্মকাল';
    }
  } else if (month === 5) {
    // June
    if (day <= 14) {
      banglaMonth = 'জ্যৈষ্ঠ';
      banglaDay = day + 17;
      season = 'গ্রীষ্মকাল';
    } else {
      banglaMonth = 'আষাঢ়';
      banglaDay = day - 14;
      season = 'বর্ষাকাল';
    }
  } else if (month === 6) {
    // July
    if (day <= 15) {
      banglaMonth = 'আষাঢ়';
      banglaDay = day + 16;
      season = 'বর্ষাকাল';
    } else {
      banglaMonth = 'শ্রাবণ';
      banglaDay = day - 15;
      season = 'বর্ষাকাল';
    }
  } else if (month === 7) {
    // August
    if (day <= 15) {
      banglaMonth = 'শ্রাবণ';
      banglaDay = day + 16;
      season = 'বর্ষাকাল';
    } else {
      banglaMonth = 'ভাদ্র';
      banglaDay = day - 15;
      season = 'শরৎকাল';
    }
  } else if (month === 8) {
    // September
    if (day <= 15) {
      banglaMonth = 'ভাদ্র';
      banglaDay = day + 16;
      season = 'শরৎকাল';
    } else {
      banglaMonth = 'আশ্বিন';
      banglaDay = day - 15;
      season = 'শরৎকাল';
    }
  } else if (month === 9) {
    // October
    if (day <= 16) {
      banglaMonth = 'আশ্বিন';
      banglaDay = day + 15;
      season = 'শরৎকাল';
    } else {
      banglaMonth = 'কার্তিক';
      banglaDay = day - 16;
      season = 'হেমন্তকাল';
    }
  } else if (month === 10) {
    // November
    if (day <= 15) {
      banglaMonth = 'কার্তিক';
      banglaDay = day + 15;
      season = 'হেমন্তকাল';
    } else {
      banglaMonth = 'অগ্রহায়ণ';
      banglaDay = day - 15;
      season = 'হেমন্তকাল';
    }
  } else if (month === 11) {
    // December
    if (day <= 15) {
      banglaMonth = 'অগ্রহায়ণ';
      banglaDay = day + 15;
      season = 'হেমন্তকাল';
    } else {
      banglaMonth = 'পৌষ';
      banglaDay = day - 15;
      season = 'শীতকাল';
    }
  }

  return {
    day: banglaDay,
    monthNameBn: banglaMonth,
    year: banglaYear,
    seasonBn: season,
  };
}

// Helper to convert Gregorian Date to Hijri Date for 2026
export function getHijriDate(date: Date): HijriDate {
  // Approximate Hijri mapping for 2026 (1447 - 1448 AH) in Bangladesh (Islamic Foundation standard)
  const y = date.getFullYear();
  const m = date.getMonth();
  const d = date.getDate();

  // Format: YYYY-MM-DD
  const curTime = new Date(y, m, d).getTime();

  // Key Hijri Month start boundaries in 2026:
  // Jan 1: 11 Rajab 1447
  // Jan 20: 1 Sha'ban 1447
  // Feb 18: 1 Ramadan 1447
  // Mar 20: 1 Shawwal 1447
  // Apr 19: 1 Dhul Qa'dah 1447
  // May 18: 1 Dhul Hijjah 1447
  // Jun 17: 1 Muharram 1448
  // Jul 17: 1 Safar 1448
  // Aug 15: 1 Rabi' al-Awwal 1448
  // Sep 14: 1 Rabi' al-Thani 1448
  // Oct 13: 1 Jumada al-Awwal 1448
  // Nov 12: 1 Jumada al-Thani 1448
  // Dec 11: 1 Rajab 1448

  const milestones: { startDate: string; monthNameBn: string; year: number }[] = [
    { startDate: '2025-12-21', monthNameBn: 'রজব', year: 1447 },
    { startDate: '2026-01-20', monthNameBn: 'শাবান', year: 1447 },
    { startDate: '2026-02-18', monthNameBn: 'রমজান', year: 1447 },
    { startDate: '2026-03-20', monthNameBn: 'শাওয়াল', year: 1447 },
    { startDate: '2026-04-19', monthNameBn: 'জিলকদ', year: 1447 },
    { startDate: '2026-05-18', monthNameBn: 'জিলহজ', year: 1447 },
    { startDate: '2026-06-17', monthNameBn: 'মহররম', year: 1448 },
    { startDate: '2026-07-17', monthNameBn: 'সফর', year: 1448 },
    { startDate: '2026-08-15', monthNameBn: 'রবিউল আউয়াল', year: 1448 },
    { startDate: '2026-09-14', monthNameBn: 'রবিউস সানি', year: 1448 },
    { startDate: '2026-10-13', monthNameBn: 'জমাদিউল আউয়াল', year: 1448 },
    { startDate: '2026-11-12', monthNameBn: 'জমাদিউস সানি', year: 1448 },
    { startDate: '2026-12-11', monthNameBn: 'রজব', year: 1448 },
  ];

  let currentMilestone = milestones[0];
  for (let i = 0; i < milestones.length; i++) {
    const mDate = new Date(milestones[i].startDate).getTime();
    if (curTime >= mDate) {
      currentMilestone = milestones[i];
    }
  }

  const startMs = new Date(currentMilestone.startDate).getTime();
  const diffDays = Math.floor((curTime - startMs) / (1000 * 60 * 60 * 24)) + 1;

  return {
    day: Math.max(1, Math.min(30, diffDays)),
    monthNameBn: currentMilestone.monthNameBn,
    year: currentMilestone.year,
  };
}

// Generate calendar cells for a given year & month (0-indexed month)
export function getMonthDaysInfo(year: number, monthIndex: number): DayCalendarInfo[] {
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const days: DayCalendarInfo[] = [];

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, monthIndex, d);
    const dayOfWeek = date.getDay(); // 0 = Sun, ..., 5 = Fri, 6 = Sat
    const dateStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    
    // Find matching holidays
    const holidays = BANGLADESH_HOLIDAYS_2026.filter((h) => {
      if (h.endDateStr) {
        return dateStr >= h.dateStr && dateStr <= h.endDateStr;
      }
      return h.dateStr === dateStr;
    });

    const bangla = getBanglaDate(date);
    const hijri = getHijriDate(date);

    days.push({
      date,
      dateStr,
      dayOfMonth: d,
      dayOfWeek,
      dayNameBn: DAY_NAMES_BN[dayOfWeek],
      dayNameShortBn: DAY_NAMES_SHORT_BN[dayOfWeek],
      isWeekend: dayOfWeek === 5 || dayOfWeek === 6, // Fri & Sat are weekends in Bangladesh
      bangla,
      hijri,
      holidays,
      isToday: dateStr === todayStr,
    });
  }

  return days;
}

// Format full Bangla and English date for display
export function getFullDateSummary(date: Date = new Date()): {
  englishFormatted: string;
  banglaFormatted: string;
  hijriFormatted: string;
  dayName: string;
  season: string;
} {
  const d = date.getDate();
  const m = date.getMonth();
  const y = date.getFullYear();
  const dayOfWeek = date.getDay();

  const bangla = getBanglaDate(date);
  const hijri = getHijriDate(date);

  const englishFormatted = `${toBengaliNumber(d)} ${MONTH_NAMES_BN[m]}, ${toBengaliNumber(y)}ইং`;
  const banglaFormatted = `${toBengaliNumber(bangla.day)} ${bangla.monthNameBn}, ${toBengaliNumber(bangla.year)} বঙ্গাব্দ`;
  const hijriFormatted = `${toBengaliNumber(hijri.day)} ${hijri.monthNameBn}, ${toBengaliNumber(hijri.year)} হিজরি`;

  return {
    englishFormatted,
    banglaFormatted,
    hijriFormatted,
    dayName: DAY_NAMES_BN[dayOfWeek],
    season: bangla.seasonBn,
  };
}
