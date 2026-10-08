export interface MeetingTemplateFields {
  date: string;
  time: string;
  location: string;
  agenda?: string;
  contactNumber: string;
}

export function generateExecutiveMeetingNotice(fields: MeetingTemplateFields): string {
  return `বিসমিল্লাহির রাহমানির রাহিম
সিলেট মানব সেবা সংগঠন
কার্যকরী কমিটির জরুরি মাসিক মিটিং আহ্বান

সকল সম্মানিত কার্যকরী পরিষদের সদস্যবৃন্দের অবগতির জন্য জানানো যাচ্ছে যে, সংগঠনের সার্বিক কার্যক্রম পর্যালোচনা ও আগামী কর্মসূচির পরিকল্পনা বাস্তবায়নে এক সাধারণ সভা অনুষ্ঠিত হতে যাচ্ছে।

তারিখ: ${fields.date}
সময়: ${fields.time}
স্থান: ${fields.location}
আলোচ্য বিষয়: ${fields.agenda || 'সংগঠনের মাসিক ফান্ড পর্যালোচনা, চলমান সেবামূলক প্রকল্প ও ভবিষ্যৎ পরিকল্পনা'}

জরুরি যোগাযোগ: ${fields.contactNumber}

সকল সদস্যের আন্তরিক ও সময়মতো উপস্থিতি কামনা করছি।
- সাধারণ সম্পাদক, সিলেট মানব সেবা সংগঠন`;
}

export function generateGeneralMeetingNotice(fields: MeetingTemplateFields): string {
  return `বিসমিল্লাহির রাহমানির রাহিম
সিলেট মানব সেবা সংগঠন
সাধারণ সদস্যদের মাসিক সাধারণ সভা

সংগঠনের সকল সাধারণ ও আজীবন সদস্যদের জানানো যাচ্ছে যে, আমাদের নিয়মিত মাসিক সাধারণ সভা আগামী ${fields.date} তারিখ অনুষ্ঠিত হবে।

সময়: ${fields.time}
স্থান: ${fields.location}
আলোচ্য বিষয়: ${fields.agenda || 'নতুন সদস্য অন্তর্ভুক্তিকরণ ও সমাজসেবামূলক উদ্যোগ'}

জরুরি যোগাযোগ: ${fields.contactNumber}
- প্রচার ও দপ্তর সম্পাদক, সিলেট মানব সেবা সংগঠন`;
}
