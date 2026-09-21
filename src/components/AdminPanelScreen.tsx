import React, { useState, useMemo, useEffect, useRef, Suspense, lazy } from 'react';
import {
  ShieldCheck,
  Users,
  Droplet,
  BellRing,
  Wallet,
  Settings,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Search,
  Upload,
  RefreshCw,
  ArrowLeft,
  Calendar,
  Phone,
  Lock,
  Key,
  Building2,
  Save,
  Check,
  X,
  Clock,
  Pin,
  TrendingUp,
  TrendingDown,
  FileText,
  CreditCard,
  ArrowRight,
  Smartphone,
  Sparkles,
  Copy,
  Eye,
  Camera,
  LifeBuoy,
  MessageSquare,
  HelpCircle,
  Inbox,
  Cloud,
  Database,
  Server,
  Code,
  ExternalLink,
  Globe,
  Send
} from 'lucide-react';
const ExpenseModal = lazy(() => import('./ExpenseModal').then(m => ({ default: m.ExpenseModal })));
import { 
  MeetingFields, 
  DEFAULT_MEETING_FIELDS,
  generateExecutiveMeetingNotice, 
  generateJointMeetingNotice,
  formatBengaliMeetingDate,
  getBengaliDayFromDate
} from '../utils/noticeTemplates';
import { MeetingNoticeForm } from './MeetingNoticeForm';
import {
  Member,
  BloodDonor,
  Notice,
  FundRecord,
  OrganizationProfile,
  BloodGroup,
  PaymentGatewayConfig,
  PaymentStatus,
  SupportReportItem,
  HomeSlide,
  HumanitarianActivity,
  OrganizationRule,
  CalendarMonthlyBanner
} from '../types';
const AdminHomePageManager = lazy(() => import('./AdminHomePageManager').then(m => ({ default: m.AdminHomePageManager })));
import {
  toBengaliNumber,
  formatTaka,
  calculateNextEligibleDate,
  isDonorEligible,
  formatBengaliDate,
  sanitizePhone,
  getBloodGroupBadge,
  sortMembersOldestFirst,
  getMemberPhotoUrl
} from '../utils/helpers';
import {
  resetAllData,
  clearAllData,
  setAdminPin,
  getAdminPin,
  verifyAdminPin,
  loadPaymentSettings,
  savePaymentSettings,
  loadSupportReports,
  saveSupportReports,
  saveMembers,
  saveDonors,
  saveNotices,
  saveFunds,
  recordDeletedMemberId,
  clearDeletedMemberId,
  recordDeletedDonorId,
  clearDeletedDonorId,
  recordDeletedNoticeId,
  clearDeletedNoticeId,
  recordDeletedFundId,
  clearDeletedFundId,
  recordDeletedReportId,
  clearDeletedReportId
} from '../utils/storage';
import {
  fetchSupabaseStatus,
  saveSupabaseConfig,
  syncAllToSupabaseCloud,
  syncAllFromSupabaseCloud,
  SupabaseStatusResponse
} from '../utils/serverApi';
import { DueSmsModal } from './DueSmsModal';
import { BulkMeetingSmsModal } from './BulkMeetingSmsModal';
import { isExecutiveCommitteeMember } from '../utils/meetingSmsHelper';
import { triggerNativeCall, triggerNativeSms } from '../utils/nativeIntentHelper';
import {
  triggerDirectSimSms,
  generatePaidConfirmationSms,
  generateDirectSimPaidSms,
  generateDirectSimDueSms,
  resolveMemberPhone,
  extractArrearsMonthCount,
  formatDynamicArrearsText,
  ARREARS_MONTH_OPTIONS
} from '../utils/smsHelper';

interface AdminPanelScreenProps {
  profile: OrganizationProfile;
  onUpdateProfile?: (p: OrganizationProfile) => void;
  setProfile?: (p: OrganizationProfile) => void;
  members: Member[];
  onAddMember?: (m: Omit<Member, 'id'>) => void;
  onEditMember?: (m: Member) => void;
  onDeleteMember?: (id: string, name: string) => void;
  setMembers?: React.Dispatch<React.SetStateAction<Member[]>>;
  donors: BloodDonor[];
  onAddDonor?: (d: Omit<BloodDonor, 'id'>) => void;
  onEditDonor?: (d: BloodDonor) => void;
  onDeleteDonor?: (id: string, name: string) => void;
  setDonors?: React.Dispatch<React.SetStateAction<BloodDonor[]>>;
  notices: Notice[];
  onAddNotice?: (n: Omit<Notice, 'id'>) => void;
  onEditNotice?: (n: Notice) => void;
  onDeleteNotice?: (id: string) => void;
  setNotices?: React.Dispatch<React.SetStateAction<Notice[]>>;
  funds: FundRecord[];
  onAddFund?: (f: Omit<FundRecord, 'id'>) => void;
  onEditFund?: (f: FundRecord) => void;
  onDeleteFund?: (id: string) => void;
  onToggleFundStatus?: (id: string, newStatus: PaymentStatus) => void;
  setFunds?: React.Dispatch<React.SetStateAction<FundRecord[]>>;
  supportReports?: SupportReportItem[];
  onAddSupportReport?: (r: Omit<SupportReportItem, 'id'>) => void;
  onEditSupportReport?: (r: SupportReportItem) => void;
  onDeleteSupportReport?: (id: string) => void;
  setSupportReports?: React.Dispatch<React.SetStateAction<SupportReportItem[]>>;
  paymentConfig?: PaymentGatewayConfig;
  onUpdatePaymentConfig?: (config: PaymentGatewayConfig) => void;
  onResetAll?: () => void;
  isAdmin?: boolean;
  setIsAdmin?: (val: boolean) => void;
  onBack: () => void;
  activeScreen?: string;
  homeSlides?: HomeSlide[];
  onUpdateHomeSlides?: (slides: HomeSlide[]) => void;
  humanitarianActivities?: HumanitarianActivity[];
  onUpdateHumanitarianActivities?: (activities: HumanitarianActivity[]) => void;
  organizationRules?: OrganizationRule[];
  onUpdateOrganizationRules?: (rules: OrganizationRule[]) => void;
  calendarBanners?: Record<number, CalendarMonthlyBanner>;
  onUpdateCalendarBanners?: (banners: Record<number, CalendarMonthlyBanner>) => void;
  initialActiveTab?: 'overview' | 'homepage' | 'members' | 'donors' | 'funds' | 'notices' | 'payments' | 'reports' | 'settings';
}

export const AdminPanelScreen: React.FC<AdminPanelScreenProps> = ({
  profile,
  onUpdateProfile,
  setProfile,
  members,
  onAddMember,
  onEditMember,
  onDeleteMember,
  setMembers,
  donors,
  onAddDonor,
  onEditDonor,
  onDeleteDonor,
  setDonors,
  notices,
  onAddNotice,
  onEditNotice,
  onDeleteNotice,
  setNotices,
  funds,
  onAddFund,
  onEditFund,
  onDeleteFund,
  onToggleFundStatus,
  setFunds,
  supportReports = [],
  onAddSupportReport,
  onEditSupportReport,
  onDeleteSupportReport,
  setSupportReports,
  paymentConfig: initialPaymentConfig,
  onUpdatePaymentConfig,
  onResetAll,
  isAdmin,
  setIsAdmin,
  onBack,
  homeSlides = [],
  onUpdateHomeSlides,
  humanitarianActivities = [],
  onUpdateHumanitarianActivities,
  organizationRules = [],
  onUpdateOrganizationRules,
  calendarBanners,
  onUpdateCalendarBanners,
  initialActiveTab
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'homepage' | 'members' | 'donors' | 'funds' | 'notices' | 'payments' | 'reports' | 'settings'>(initialActiveTab || 'overview');

  useEffect(() => {
    if (initialActiveTab) {
      setActiveTab(initialActiveTab);
    }
  }, [initialActiveTab]);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [paymentPreviewTab, setPaymentPreviewTab] = useState<'bkash' | 'nagad' | 'rocket'>('bkash');
  const [copiedTestField, setCopiedTestField] = useState<string | null>(null);

  // Search terms per tab
  const [memberSearch, setMemberSearch] = useState('');
  const [donorSearch, setDonorSearch] = useState('');
  const [fundSearch, setFundSearch] = useState('');
  const [supportSearch, setSupportSearch] = useState('');
  const [supportFilterType, setSupportFilterType] = useState<string>('all');

  // Support / Report states
  const [editingSupportReport, setEditingSupportReport] = useState<SupportReportItem | null>(null);
  const [isAddSupportReportOpen, setIsAddSupportReportOpen] = useState(false);
  const [supportPhotoBase64, setSupportPhotoBase64] = useState<string>('');

  // Modals / Edit states
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [memberPhotoBase64, setMemberPhotoBase64] = useState<string>('');
  const [zoomedMemberPhoto, setZoomedMemberPhoto] = useState<Member | null>(null);

  // Explicit Member Form Input States for robust submission
  const [memberNameInput, setMemberNameInput] = useState('');
  const [memberDesignationInput, setMemberDesignationInput] = useState('সদস্য');
  const [memberPhoneInput, setMemberPhoneInput] = useState('');
  const [memberAreaInput, setMemberAreaInput] = useState('পতেঙ্গা, চট্টগ্রাম');
  const [memberJoinDateInput, setMemberJoinDateInput] = useState(new Date().toISOString().split('T')[0]);
  const [memberEmailInput, setMemberEmailInput] = useState('');
  const [memberStatusInput, setMemberStatusInput] = useState<'সক্রিয়' | 'স্থগিত'>('সক্রিয়');
  const [memberIsExpatriateInput, setMemberIsExpatriateInput] = useState(false);
  const [memberIsExecutiveInput, setMemberIsExecutiveInput] = useState(false);
  const [memberCountryStatusInput, setMemberCountryStatusInput] = useState('');
  const [adminMemberTab, setAdminMemberTab] = useState<'all' | 'general' | 'expatriate'>('all');

  useEffect(() => {
    if (editingMember) {
      setMemberNameInput(editingMember.name || '');
      setMemberDesignationInput(editingMember.designation || 'সদস্য');
      setMemberPhoneInput(editingMember.phone || '');
      setMemberAreaInput(editingMember.area || (editingMember.isExpatriate ? 'প্রবাসী' : 'পতেঙ্গা, চট্টগ্রাম'));
      setMemberJoinDateInput(editingMember.joinDate || new Date().toISOString().split('T')[0]);
      setMemberEmailInput(editingMember.email || '');
      setMemberStatusInput(editingMember.status || 'সক্রিয়');
      setMemberPhotoBase64(getMemberPhotoUrl(editingMember));
      setMemberIsExpatriateInput(Boolean(editingMember.isExpatriate || editingMember.memberType === 'expatriate'));
      setMemberCountryStatusInput(editingMember.countryStatus || '');
      const isExec = editingMember.isExecutive !== undefined 
        ? Boolean(editingMember.isExecutive) 
        : (editingMember.category === 'কার্যকরী কমিটি' || editingMember.committeeType === 'executive' || isExecutiveCommitteeMember(editingMember));
      setMemberIsExecutiveInput(isExec);
    } else {
      setMemberNameInput('');
      setMemberDesignationInput('সদস্য');
      setMemberPhoneInput('');
      setMemberAreaInput('পতেঙ্গা, চট্টগ্রাম');
      setMemberJoinDateInput(new Date().toISOString().split('T')[0]);
      setMemberEmailInput('');
      setMemberStatusInput('সক্রিয়');
      setMemberPhotoBase64('');
      setMemberIsExpatriateInput(false);
      setMemberIsExecutiveInput(false);
      setMemberCountryStatusInput('');
    }
  }, [editingMember, isAddMemberOpen]);

  const handleMemberPhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        notifyError('ছবির সাইজ সর্বোচ্চ ৫ মেগাবাইট হতে পারবে');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setMemberPhotoBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const [editingDonor, setEditingDonor] = useState<BloodDonor | null>(null);
  const [isAddDonorOpen, setIsAddDonorOpen] = useState(false);
  const [loggingDonationDonor, setLoggingDonationDonor] = useState<BloodDonor | null>(null);

  const [editingFund, setEditingFund] = useState<FundRecord | null>(null);
  const [isAddFundOpen, setIsAddFundOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<FundRecord | null>(null);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

  const [editingNotice, setEditingNotice] = useState<Notice | null>(null);
  const [isAddNoticeOpen, setIsAddNoticeOpen] = useState(false);
  const [noticeModalCategory, setNoticeModalCategory] = useState<string>('কার্যকরী কমিটির মিটিং');
  const [noticeModalText, setNoticeModalText] = useState<string>('');
  const [noticeModalTitle, setNoticeModalTitle] = useState<string>('');
  const [noticeModalDate, setNoticeModalDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [noticeModalIsPinned, setNoticeModalIsPinned] = useState<boolean>(false);
  const [noticeMeetingFields, setNoticeMeetingFields] = useState<MeetingFields>(() => ({
    date: formatBengaliMeetingDate(new Date().toISOString().split('T')[0]),
    day: getBengaliDayFromDate(new Date().toISOString().split('T')[0]),
    time: '৮:৩০ মিনিট',
    location: 'সংগঠনের কার্যালয়',
    contactNumber: '01886122678'
  }));

  // Bulk Meeting SMS Dispatch State
  const [bulkMeetingSmsData, setBulkMeetingSmsData] = useState<{
    isOpen: boolean;
    meetingType: string;
    noticeText: string;
    noticeTitle?: string;
  }>({
    isOpen: false,
    meetingType: 'কার্যকরী কমিটির মিটিং',
    noticeText: '',
    noticeTitle: ''
  });

  const handleOpenBulkMeetingSms = (type: string, text: string, title?: string) => {
    setBulkMeetingSmsData({
      isOpen: true,
      meetingType: type || 'কার্যকরী কমিটির মিটিং',
      noticeText: text,
      noticeTitle: title
    });
  };

  // Settings State
  const [editProfileData, setEditProfileData] = useState<OrganizationProfile>(profile);
  const [currentPinInput, setCurrentPinInput] = useState('');
  const [newPinInput, setNewPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');
  const [paymentConfig, setPaymentConfig] = useState<PaymentGatewayConfig>(
    () => initialPaymentConfig || loadPaymentSettings()
  );

  // Supabase Cloud Storage States
  const [supabaseUrlInput, setSupabaseUrlInput] = useState('');
  const [supabaseKeyInput, setSupabaseKeyInput] = useState('');
  const [supabaseStatus, setSupabaseStatus] = useState<SupabaseStatusResponse | null>(null);
  const [isCheckingSupabase, setIsCheckingSupabase] = useState(false);
  const [isSavingSupabase, setIsSavingSupabase] = useState(false);
  const [isSyncingCloud, setIsSyncingCloud] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [dueSmsTarget, setDueSmsTarget] = useState<{
    memberName: string;
    phone?: string;
    amount?: number;
    month?: string;
    memberId?: string;
  } | null>(null);

  // Fund Modal States for SIM SMS & Form Management
  const [fundFormMemberName, setFundFormMemberName] = useState('');
  const [fundFormAmount, setFundFormAmount] = useState<number | ''>(1000);
  const [fundFormStatus, setFundFormStatus] = useState<PaymentStatus>('Paid');
  const [fundFormMonth, setFundFormMonth] = useState('মার্চ ২০২৬');
  const [fundFormPhone, setFundFormPhone] = useState('');
  const [fundFormNotes, setFundFormNotes] = useState('');
  const [fundArrearsMonthCount, setFundArrearsMonthCount] = useState<number>(1);
  const [fundPastMonthsText, setFundPastMonthsText] = useState<string>('');
  const [fundModalSmsNotice, setFundModalSmsNotice] = useState<string | null>(null);

  const lastLoadedFundIdRef = useRef<string | null>(null);
  const lastAddFundOpenRef = useRef<boolean>(false);

  // Sync Fund Form states when opening edit or add
  useEffect(() => {
    if (editingFund && editingFund.id !== lastLoadedFundIdRef.current) {
      lastLoadedFundIdRef.current = editingFund.id;
      lastAddFundOpenRef.current = false;

      const parsedArrears = extractArrearsMonthCount(editingFund);
      setFundFormMemberName(editingFund.memberName || '');
      setFundFormAmount(editingFund.amount || 1000);
      setFundFormStatus(editingFund.status || 'Paid');
      setFundFormMonth(editingFund.month || 'মার্চ ২০২৬');
      setFundFormPhone(editingFund.phone || resolveMemberPhone(editingFund, members) || '');
      setFundFormNotes(editingFund.notes || '');
      setFundArrearsMonthCount(parsedArrears.monthCount);
      setFundPastMonthsText(parsedArrears.pastMonthsText);
      setFundModalSmsNotice(null);
    } else if (isAddFundOpen && !lastAddFundOpenRef.current) {
      lastAddFundOpenRef.current = true;
      lastLoadedFundIdRef.current = null;

      setFundFormMemberName('');
      setFundFormAmount(1000);
      setFundFormStatus('Paid');
      setFundFormMonth('মার্চ ২০২৬');
      setFundFormPhone('');
      setFundFormNotes('');
      setFundArrearsMonthCount(1);
      setFundPastMonthsText('');
      setFundModalSmsNotice(null);
    } else if (!editingFund && !isAddFundOpen) {
      lastLoadedFundIdRef.current = null;
      lastAddFundOpenRef.current = false;
    }
  }, [editingFund, isAddFundOpen, members]);

  // Computed Live SMS Preview for Admin Fund Modal
  const currentAdminFundSmsPreview = useMemo(() => {
    const moneyVal = fundFormAmount !== '' ? Number(fundFormAmount) : 0;
    const nameVal = fundFormMemberName.trim() || '[সদস্যের নাম]';
    if (fundFormStatus === 'Paid') {
      return generateDirectSimPaidSms({
        memberName: nameVal,
        months: fundFormMonth.trim() || 'চলতি',
        money: moneyVal
      });
    }
    if (fundFormStatus === 'Due') {
      return generateDirectSimDueSms({
        memberName: nameVal,
        money: moneyVal,
        monthCount: fundArrearsMonthCount,
        pastMonthsText: fundPastMonthsText.trim()
      });
    }
    return '';
  }, [fundFormMemberName, fundFormAmount, fundFormStatus, fundFormMonth, fundArrearsMonthCount, fundPastMonthsText]);

  // Direct SIM SMS Trigger from Admin Fund Modal
  const handleSendDirectSmsFromAdminModal = () => {
    if (!fundFormMemberName.trim()) {
      notifyError('অনুগ্রহ করে সদস্যের নাম লিখুন');
      return;
    }

    const resolvedPhone = fundFormPhone.trim() || resolveMemberPhone({ memberName: fundFormMemberName.trim() }, members);
    const moneyVal = fundFormAmount !== '' ? Number(fundFormAmount) : 0;

    let smsText = '';
    if (fundFormStatus === 'Paid') {
      smsText = generateDirectSimPaidSms({
        memberName: fundFormMemberName.trim(),
        months: fundFormMonth.trim() || 'চলতি',
        money: moneyVal
      });
    } else if (fundFormStatus === 'Due') {
      smsText = generateDirectSimDueSms({
        memberName: fundFormMemberName.trim(),
        money: moneyVal,
        monthCount: fundArrearsMonthCount,
        pastMonthsText: fundPastMonthsText.trim()
      });
    } else {
      smsText = generateDirectSimPaidSms({
        memberName: fundFormMemberName.trim(),
        months: fundFormMonth.trim() || 'চলতি',
        money: moneyVal
      });
    }

    triggerDirectSimSms(resolvedPhone, smsText);

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(smsText).catch(() => {});
    }

    setFundModalSmsNotice(
      resolvedPhone
        ? `${resolvedPhone} নম্বরে সরাসরি SIM SMS অ্যাপ চালু হয়েছে এবং মেসেজ কপি হয়েছে`
        : 'সরাসরি SIM SMS অ্যাপ চালু হয়েছে এবং মেসেজ ক্লিপবোর্ডে কপি হয়েছে'
    );
    notifySuccess('সরাসরি SIM SMS অ্যাপ চালু হয়েছে');
    setTimeout(() => setFundModalSmsNotice(null), 5000);
  };

  useEffect(() => {
    setEditProfileData(profile);
  }, [profile]);

  useEffect(() => {
    if (initialPaymentConfig) {
      setPaymentConfig(initialPaymentConfig);
    }
  }, [initialPaymentConfig]);

  // Check Supabase Cloud Connection
  const checkSupabaseLiveStatus = async () => {
    setIsCheckingSupabase(true);
    try {
      const status = await fetchSupabaseStatus();
      setSupabaseStatus(status);
      if (status.url && !supabaseUrlInput) {
        setSupabaseUrlInput(status.url);
      }
    } catch (e) {
      console.warn('Error fetching Supabase status:', e);
    } finally {
      setIsCheckingSupabase(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'settings') {
      checkSupabaseLiveStatus();
    }
  }, [activeTab]);

  const handleSaveSupabase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabaseUrlInput.trim() || !supabaseKeyInput.trim()) {
      notifyError('সুপাবেজ প্রজেক্ট URL এবং Anon Key উভয় ফিল্ড পূরণ করুন');
      return;
    }
    setIsSavingSupabase(true);
    try {
      const res = await saveSupabaseConfig(supabaseUrlInput.trim(), supabaseKeyInput.trim());
      if (res.success) {
        notifySuccess(res.message || 'Supabase ক্লাউড ডাটাবেজ কনফিগারেশন সফলভাবে সংরক্ষিত হয়েছে!');
        await checkSupabaseLiveStatus();
      } else {
        notifyError(res.message || 'সুপাবেজ সেভ বা টেস্ট ব্যর্থ হয়েছে');
      }
    } catch (err: any) {
      notifyError(`ত্রুটি: ${err.message || err}`);
    } finally {
      setIsSavingSupabase(false);
    }
  };

  const handlePushAllToCloud = async () => {
    setIsSyncingCloud(true);
    try {
      const res = await syncAllToSupabaseCloud();
      if (res.success) {
        notifySuccess(res.message || 'সকল তথ্য Supabase ক্লাউডে সফলভাবে সংরক্ষিত হয়েছে!');
        await checkSupabaseLiveStatus();
      } else {
        notifyError(res.message || 'ক্লাউড সিঙ্ক ব্যর্থ হয়েছে।');
      }
    } catch (err: any) {
      notifyError(`সিঙ্ক ত্রুটি: ${err.message || err}`);
    } finally {
      setIsSyncingCloud(false);
    }
  };

  const handlePullAllFromCloud = async () => {
    setIsSyncingCloud(true);
    try {
      const res = await syncAllFromSupabaseCloud();
      if (res.success) {
        notifySuccess('Supabase ক্লাউড থেকে সর্বশেষ ডাটা সফলভাবে ফেচ ও রিলোড করা হয়েছে!');
        setTimeout(() => window.location.reload(), 1000);
      } else {
        notifyError(res.message || 'ক্লাউড থেকে ফেচ করা সম্ভব হয়নি।');
      }
    } catch (err: any) {
      notifyError(`ফেচ ত্রুটি: ${err.message || err}`);
    } finally {
      setIsSyncingCloud(false);
    }
  };

  const handleCopySqlScript = () => {
    const sql = `-- Supabase SQL Editor এ পেস্ট করে এক ক্লিকে Run করুন
-- ১. প্রধান কি-ভ্যালু ডাটাবেজ টেবিল
CREATE TABLE IF NOT EXISTS organization_data (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE organization_data ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Full Access" ON organization_data;
CREATE POLICY "Public Full Access" ON organization_data FOR ALL USING (true) WITH CHECK (true);

-- ২. মানবিক কার্যক্রম বিবরণী টেবিল (সরাসরি রেকর্ড ম্যানেজমেন্ট ও পার্মানেন্ট ডিলিট)
CREATE TABLE IF NOT EXISTS humanitarian_activities (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  items_given TEXT,
  cost NUMERIC DEFAULT 0,
  handled_by TEXT,
  recipient_name TEXT,
  recipient_photo_url TEXT,
  date TEXT,
  location TEXT,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE humanitarian_activities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Activities Public Access" ON humanitarian_activities;
CREATE POLICY "Activities Public Access" ON humanitarian_activities FOR ALL USING (true) WITH CHECK (true);`;

    navigator.clipboard.writeText(sql).then(() => {
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 3000);
      notifySuccess('SQL কোড কপি হয়েছে! Supabase ড্যাশবোর্ডের SQL Editor-এ পেস্ট করে Run চাপুন।');
    }).catch(() => {
      notifyError('কপি করা সম্ভব হয়নি। অনুগ্রহ করে ম্যানুয়ালি সিলেক্ট করে কপি করুন।');
    });
  };

  // Helper trigger for notifications
  const notifySuccess = (msg: string) => {
    setSuccessMsg(msg);
    setErrorMsg('');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const notifyError = (msg: string) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(''), 4000);
  };

  // Direct Single-Write Payment Settings Handler
  const handleSaveSettings = async (e?: React.FormEvent) => {
    if (e && e.preventDefault) e.preventDefault();
    const paymentData: PaymentGatewayConfig = {
      bkashNumber: paymentConfig.bkashNumber?.trim() || '',
      bkashType: paymentConfig.bkashType || 'Personal',
      bkashInstructions: paymentConfig.bkashInstructions?.trim() || '',
      nagadNumber: paymentConfig.nagadNumber?.trim() || '',
      nagadType: paymentConfig.nagadType || 'Personal',
      nagadInstructions: paymentConfig.nagadInstructions?.trim() || '',
      rocketNumber: paymentConfig.rocketNumber?.trim() || '',
      rocketType: paymentConfig.rocketType || 'Personal',
      rocketInstructions: paymentConfig.rocketInstructions?.trim() || '',
      bankDetails: paymentConfig.bankDetails?.trim() || '',
      instructions: paymentConfig.instructions?.trim() || '',
      activeGateways: paymentConfig.activeGateways || ['bkash', 'nagad', 'rocket']
    };

    setPaymentConfig(paymentData);
    savePaymentSettings(paymentData);
    if (onUpdatePaymentConfig) {
      await onUpdatePaymentConfig(paymentData);
    }
    notifySuccess('বিকাশ, নগদ ও রকেট পেমেন্ট গেটওয়ে নম্বর সফলভাবে সংরক্ষিত হয়েছে');
  };

  const handleClearAllPaymentNumbers = async () => {
    if (window.confirm('আপনি কি নিশ্চিত যে সকল পেমেন্ট নম্বর (বিকাশ, নগদ, রকেট) মুছে সম্পূর্ণ ফাঁকা করতে চান? এর ফলে ডাটাবেজ ও লোকাল স্টোরেজ থেকে বর্তমান নম্বরগুলো রিমুভ হয়ে যাবে এবং আপনি প্রয়োজনমতো নতুন নম্বর সেট করতে পারবেন।')) {
      const clearedData: PaymentGatewayConfig = {
        ...paymentConfig,
        bkashNumber: '',
        nagadNumber: '',
        rocketNumber: '',
        bankDetails: ''
      };
      setPaymentConfig(clearedData);
      savePaymentSettings(clearedData);
      if (onUpdatePaymentConfig) {
        await onUpdatePaymentConfig(clearedData);
      }
      notifySuccess('বিকাশ, নগদ ও রকেট পেমেন্ট নম্বর সফলভাবে মুছে ডাটাবেজ থেকে সম্পূর্ণ ফাঁকা করা হয়েছে। আপনি চাইলে এখন যেকোনো নতুন নম্বর লিখে সেভ করতে পারেন।');
    }
  };

  const handleClearSinglePaymentNumber = async (gateway: 'bkash' | 'nagad' | 'rocket') => {
    const nameMap = { bkash: 'বিকাশ', nagad: 'নগদ', rocket: 'রকেট' };
    const keyMap = { bkash: 'bkashNumber', nagad: 'nagadNumber', rocket: 'rocketNumber' } as const;
    const updatedData: PaymentGatewayConfig = {
      ...paymentConfig,
      [keyMap[gateway]]: ''
    };
    setPaymentConfig(updatedData);
    savePaymentSettings(updatedData);
    if (onUpdatePaymentConfig) {
      await onUpdatePaymentConfig(updatedData);
    }
    notifySuccess(`${nameMap[gateway]} নম্বর সফলভাবে মুছে ফাঁকা করা হয়েছে। আপনি চাইলে নতুন নম্বর দিয়ে সেভ করতে পারেন।`);
  };

  const handleSavePaymentSettings = handleSaveSettings;

  const handleTestCopy = (text: string, field: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedTestField(field);
    setTimeout(() => setCopiedTestField(null), 2500);
  };

  // Fund balance calculations (Auto Balance Calculation)
  const fundSummary = useMemo(() => {
    let totalPaid = 0;
    let totalDue = 0;
    let totalExpense = 0;
    let totalPending = 0;
    let paidItems = 0;
    let dueItems = 0;
    let expenseItems = 0;
    let pendingItems = 0;
    let totalBalance = 0;

    funds.forEach(f => {
      if (f.status === 'Paid') {
        totalPaid += f.amount;
        paidItems++;
      } else if (f.status === 'Expense') {
        totalExpense += f.amount;
        expenseItems++;
      } else if (f.status === 'Pending') {
        totalPending += f.amount;
        pendingItems++;
      } else if (f.status === 'Due') {
        totalDue += f.amount;
        dueItems++;
      }
    });

    const netBalance = totalPaid - totalExpense;

    return {
      totalBalance: netBalance,
      totalPaid,
      totalDue,
      totalExpense,
      totalPending,
      paidItems,
      dueItems,
      expenseItems,
      pendingItems
    };
  }, [funds]);

  // Clean Single-Write Member CRUD (Delegates cleanly to App onAddMember / onEditMember)
  const handleSaveMember = async (e?: React.FormEvent<HTMLFormElement> | React.MouseEvent) => {
    if (e && e.preventDefault) e.preventDefault();

    let name = memberNameInput.trim();
    let designation = memberDesignationInput.trim() || 'সদস্য';
    let phone = memberPhoneInput.trim();
    let area = memberAreaInput.trim() || 'পতেঙ্গা, চট্টগ্রাম';
    let photoUrl = memberPhotoBase64.trim();
    let joinDate = memberJoinDateInput || new Date().toISOString().split('T')[0];
    let email = memberEmailInput.trim();
    let status = memberStatusInput || 'সক্রিয়';

    // Fallback to reading form elements if state wasn't updated
    if (!name || !phone) {
      if (e && 'currentTarget' in e && e.currentTarget instanceof HTMLFormElement) {
        const formData = new FormData(e.currentTarget);
        name = (formData.get('name') as string)?.trim() || name;
        designation = (formData.get('designation') as string)?.trim() || designation;
        phone = (formData.get('phone') as string)?.trim() || phone;
        area = (formData.get('area') as string)?.trim() || area;
        joinDate = (formData.get('joinDate') as string) || joinDate;
        email = (formData.get('email') as string)?.trim() || email;
        status = (formData.get('status') as 'সক্রিয়' | 'স্থগিত') || status;
      }
    }

    if (!name || !phone) {
      notifyError('নাম এবং মোবাইল নম্বর অবশ্যই প্রদান করুন');
      return;
    }

    const isExec = isExecutiveCommitteeMember({ designation });
    const memberData: Omit<Member, 'id'> = {
      name,
      designation: designation || 'সদস্য',
      phone,
      area: area || (memberIsExpatriateInput ? 'প্রবাসী' : 'পতেঙ্গা, চট্টগ্রাম'),
      photoUrl: photoUrl || '',
      joinDate: joinDate || new Date().toISOString().split('T')[0],
      email: email || '',
      status: status || 'সক্রিয়',
      isExpatriate: memberIsExpatriateInput,
      isExecutive: isExec,
      category: isExec ? 'কার্যকরী কমিটি' : 'সাধারণ সদস্য',
      committeeType: isExec ? 'executive' : 'general',
      memberType: memberIsExpatriateInput ? 'expatriate' : 'general',
      countryStatus: memberCountryStatusInput.trim()
    };

    if (editingMember) {
      const updatedMember: Member = {
        ...memberData,
        id: editingMember.id,
        isExecutive: isExec,
        category: isExec ? 'কার্যকরী কমিটি' : 'সাধারণ সদস্য',
        committeeType: isExec ? 'executive' : 'general'
      };

      if (onEditMember) {
        await onEditMember(updatedMember);
      } else if (setMembers) {
        setMembers(prev => prev.map(m => m.id === editingMember.id ? updatedMember : m));
      }
      setEditingMember(null);
      notifySuccess('সদস্যের তথ্য সফলভাবে আপডেট হয়েছে');
    } else {
      if (onAddMember) {
        await onAddMember(memberData);
      } else if (setMembers) {
        const timestamp = Date.now();
        const newMember: Member = {
          ...memberData,
          id: `m-${timestamp}`,
          createdAt: new Date(timestamp).toISOString()
        };
        setMembers(prev => [...prev.filter(m => m.id !== newMember.id), newMember]);
      }
      setIsAddMemberOpen(false);
      setMemberNameInput('');
      setMemberPhoneInput('');
      setMemberPhotoBase64('');
      setMemberEmailInput('');
      setMemberIsExpatriateInput(false);
      setMemberCountryStatusInput('');
      notifySuccess('নতুন সদস্য সফলভাবে যুক্ত হয়েছে');
    }
  };

  const handleDeleteMember = async (id: string, name: string) => {
    if (window.confirm(`আপনি কি নিশ্চিত যে "${name}"-কে সদস্য তালিকা থেকে মুছে ফেলতে চান?`)) {
      recordDeletedMemberId(id);
      if (onDeleteMember) {
        await onDeleteMember(id, name);
      } else if (setMembers) {
        setMembers(prev => {
          const updated = prev.filter(m => m.id !== id);
          saveMembers(updated);
          return updated;
        });
      }
      notifySuccess(`"${name}" সদস্য তালিকা থেকে মুছে ফেলা হয়েছে`);
    }
  };

  // BLOOD DONOR CRUD
  const handleSaveDonor = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const name = formData.get('name') as string;
    const phone = formData.get('phone') as string;
    const bloodGroup = formData.get('bloodGroup') as BloodGroup;
    const lastDonationDate = formData.get('lastDonationDate') as string;
    const area = formData.get('area') as string;
    const totalDonations = parseInt(formData.get('totalDonations') as string, 10) || 1;
    const notes = formData.get('notes') as string;

    if (!name.trim() || !phone.trim()) {
      notifyError('রক্তদাতার নাম ও ফোন নম্বর প্রদান করুন');
      return;
    }

    // 6-month (180 days) automatic calculation in the background
    const calculatedNext = lastDonationDate ? calculateNextEligibleDate(lastDonationDate) : '';

    if (editingDonor) {
      if (onEditDonor) {
        onEditDonor({
          ...editingDonor,
          name: name.trim(),
          phone: phone.trim(),
          bloodGroup,
          lastDonationDate: lastDonationDate || '',
          nextEligibleDate: calculatedNext,
          area: area.trim() || 'পতেঙ্গা, চট্টগ্রাম',
          totalDonations,
          notes: notes.trim()
        });
      } else if (setDonors) {
        setDonors(prev => prev.map(d => d.id === editingDonor.id ? {
          ...d,
          name: name.trim(),
          phone: phone.trim(),
          bloodGroup,
          lastDonationDate: lastDonationDate || '',
          nextEligibleDate: calculatedNext,
          area: area.trim() || 'পতেঙ্গা, চট্টগ্রাম',
          totalDonations,
          notes: notes.trim()
        } : d));
      }
      setEditingDonor(null);
      notifySuccess('রক্তদাতার তথ্য সফলভাবে আপডেট হয়েছে');
    } else {
      if (onAddDonor) {
        onAddDonor({
          name: name.trim(),
          phone: phone.trim(),
          bloodGroup,
          lastDonationDate: lastDonationDate || '',
          nextEligibleDate: calculatedNext,
          area: area.trim() || 'পতেঙ্গা, চট্টগ্রাম',
          totalDonations,
          notes: notes.trim()
        });
      } else if (setDonors) {
        const newDonor: BloodDonor = {
          id: `d-${Date.now()}`,
          name: name.trim(),
          phone: phone.trim(),
          bloodGroup,
          lastDonationDate: lastDonationDate || '',
          nextEligibleDate: calculatedNext,
          area: area.trim() || 'পতেঙ্গা, চট্টগ্রাম',
          totalDonations,
          notes: notes.trim()
        };
        setDonors(prev => [newDonor, ...prev]);
      }
      setIsAddDonorOpen(false);
      notifySuccess('নতুন রক্তদাতা সফলভাবে নিবন্ধিত হয়েছে');
    }
  };

  const handleDeleteDonor = (id: string, name: string) => {
    if (window.confirm(`আপনি কি "${name}" রক্তদাতাকে মুছে ফেলতে চান?`)) {
      recordDeletedDonorId(id);
      if (onDeleteDonor) {
        onDeleteDonor(id, name);
      } else if (setDonors) {
        setDonors(prev => {
          const updated = prev.filter(d => d.id !== id);
          saveDonors(updated);
          return updated;
        });
      }
      notifySuccess(`"${name}" রক্তদাতা ডিরেক্টরি থেকে মুছে ফেলা হয়েছে`);
    }
  };

  const handleQuickLogDonation = (donorId: string, donationDateStr: string) => {
    // Automatically calculate 6 months (180 days)
    const nextDate = calculateNextEligibleDate(donationDateStr);
    const donorToUpdate = donors.find(d => d.id === donorId);
    if (donorToUpdate && onEditDonor) {
      onEditDonor({
        ...donorToUpdate,
        lastDonationDate: donationDateStr,
        nextEligibleDate: nextDate,
        totalDonations: (donorToUpdate.totalDonations || 0) + 1
      });
    } else if (setDonors) {
      setDonors(prev => prev.map(d => {
        if (d.id === donorId) {
          return {
            ...d,
            lastDonationDate: donationDateStr,
            nextEligibleDate: nextDate,
            totalDonations: (d.totalDonations || 0) + 1
          };
        }
        return d;
      }));
    }
    setLoggingDonationDonor(null);
    notifySuccess('নতুন রক্তদানের তথ্য লিপিবদ্ধ হয়েছে (৬ মাস / ১৮০ দিন পর পরবর্তী তারিখ স্বয়ংক্রিয়ভাবে নির্ধারণ করা হলো)');
  };

  // FUND CRUD & Auto Balance Calculation
  const handleSaveFund = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const memberName = formData.get('memberName') as string;
    const amount = parseInt(formData.get('amount') as string, 10);
    const status = (formData.get('status') as PaymentStatus) || 'Paid';
    const month = formData.get('month') as string;
    const phone = formData.get('phone') as string;
    const notes = formData.get('notes') as string;

    if (!memberName.trim() || isNaN(amount) || amount <= 0) {
      notifyError('সদস্যের নাম এবং সঠিক টাকার পরিমাণ লিখুন');
      return;
    }

    if (editingFund) {
      if (onEditFund) {
        onEditFund({
          ...editingFund,
          memberName: memberName.trim(),
          amount,
          status,
          month: month.trim() || 'চলতি মাস',
          phone: phone.trim(),
          notes: notes.trim()
        });
      } else if (setFunds) {
        setFunds(prev => prev.map(f => f.id === editingFund.id ? {
          ...f,
          memberName: memberName.trim(),
          amount,
          status,
          month: month.trim() || 'চলতি মাস',
          phone: phone.trim(),
          notes: notes.trim()
        } : f));
      }
      setEditingFund(null);
      notifySuccess('ফান্ড এন্ট্রি ও ব্যালেন্স সফলভাবে আপডেট হয়েছে');
    } else {
      if (onAddFund) {
        onAddFund({
          memberName: memberName.trim(),
          amount,
          status,
          date: new Date().toISOString().split('T')[0],
          month: month.trim() || 'চলতি মাস',
          phone: phone.trim(),
          notes: notes.trim() || (status === 'Paid' ? 'পরিশোধিত' : status === 'Expense' ? 'সংগঠনের ব্যয়' : 'বকেয়া'),
          type: status === 'Expense' ? 'expense' : 'income'
        });
      } else if (setFunds) {
        const newFund: FundRecord = {
          id: `f-${Date.now()}`,
          memberName: memberName.trim(),
          amount,
          status,
          date: new Date().toISOString().split('T')[0],
          month: month.trim() || 'চলতি মাস',
          phone: phone.trim(),
          notes: notes.trim() || (status === 'Paid' ? 'পরিশোধিত' : status === 'Expense' ? 'সংগঠনের ব্যয়' : 'বকেয়া'),
          type: status === 'Expense' ? 'expense' : 'income'
        };
        setFunds(prev => [newFund, ...prev]);
      }
      setIsAddFundOpen(false);
      if (status === 'Paid') {
        const targetPhone = phone.trim() || resolveMemberPhone({ memberName: memberName.trim() }, members);
        if (targetPhone) {
          const smsText = generatePaidConfirmationSms({
            memberName: memberName.trim(),
            amount,
            month: month.trim()
          });
          triggerDirectSimSms(targetPhone, smsText);
        }
      }
      notifySuccess('নতুন ফান্ড এন্ট্রি যুক্ত হয়েছে এবং ব্যালেন্স স্বয়ংক্রিয়ভাবে আপডেট হয়েছে');
    }
  };

  const handleSaveExpense = (data: {
    description: string;
    amount: number;
    disbursedTo: string;
    date: string;
    category: string;
    voucherNo?: string;
    notes?: string;
  }) => {
    let noteText = '';
    const cleanVoucher = data.voucherNo ? data.voucherNo.trim() : '';
    const cleanNotes = data.notes ? data.notes.trim() : '';

    if (cleanVoucher && cleanNotes) {
      noteText = `ভাউচার: ${cleanVoucher} - ${cleanNotes}`;
    } else if (cleanVoucher) {
      noteText = `ভাউচার: ${cleanVoucher}`;
    } else if (cleanNotes) {
      noteText = cleanNotes;
    }

    if (editingExpense && onEditFund) {
      onEditFund({
        ...editingExpense,
        memberName: data.disbursedTo,
        amount: data.amount,
        status: 'Expense',
        type: 'expense',
        description: data.description,
        date: data.date,
        category: (data.category as any) || 'বিবিধ ও অন্যান্য ব্যয়',
        disbursedTo: data.disbursedTo,
        notes: noteText
      });
      notifySuccess('খরচের বিবরণ সফলভাবে আপডেট হয়েছে');
    } else if (onAddFund) {
      onAddFund({
        memberName: data.disbursedTo,
        amount: data.amount,
        status: 'Expense',
        type: 'expense',
        description: data.description,
        date: data.date,
        category: (data.category as any) || 'বিবিধ ও অন্যান্য ব্যয়',
        disbursedTo: data.disbursedTo,
        notes: noteText
      });
      notifySuccess('নতুন খরচের বিবরণ সফলভাবে সংরক্ষিত হয়েছে');
    } else if (setFunds) {
      const newRecord: FundRecord = {
        id: `f-${Date.now()}`,
        memberName: data.disbursedTo,
        amount: data.amount,
        status: 'Expense',
        type: 'expense',
        description: data.description,
        date: data.date,
        category: (data.category as any) || 'বিবিধ ও অন্যান্য ব্যয়',
        disbursedTo: data.disbursedTo,
        notes: noteText
      };
      setFunds(prev => [newRecord, ...prev]);
      notifySuccess('নতুন খরচের বিবরণ সফলভাবে সংরক্ষিত হয়েছে');
    }
    setIsExpenseModalOpen(false);
    setEditingExpense(null);
  };

  const handleToggleFundStatus = (fundId: string) => {
    const target = funds.find(f => f.id === fundId);
    if (!target || target.status === 'Expense') return;

    const nextStatus: PaymentStatus = target.status === 'Pending' ? 'Paid' : target.status === 'Paid' ? 'Due' : 'Paid';

    if (onToggleFundStatus) {
      onToggleFundStatus(fundId, nextStatus);
    } else if (setFunds) {
      setFunds(prev => prev.map(f => {
        if (f.id === fundId) {
          return {
            ...f,
            status: nextStatus,
            approvedAt: nextStatus === 'Paid' ? new Date().toISOString() : f.approvedAt
          };
        }
        return f;
      }));
    }

    if (nextStatus === 'Paid') {
      const memberPhone = resolveMemberPhone(target, members);
      const smsText = generatePaidConfirmationSms({
        memberName: target.memberName,
        amount: target.amount,
        month: target.month,
        trxId: target.trxId
      });
      if (memberPhone) {
        triggerDirectSimSms(memberPhone, smsText);
      }
      notifySuccess(
        memberPhone
          ? `পেমেন্ট অনুমোদিত হয়েছে এবং ${target.memberName}-এর নম্বরে (${memberPhone}) সরাসরি SIM SMS ট্রিগার করা হয়েছে`
          : 'পেমেন্ট অনুমোদিত ও পরিশোধিত হিসেবে চিহ্নিত হয়েছে'
      );
    } else {
      notifySuccess('স্ট্যাটাস বকেয়া (Due) করা হয়েছে');
    }
  };

  const handleDeleteFund = (id: string, name: string) => {
    if (window.confirm(`আপনি কি "${name}"-এর ফান্ড এন্ট্রিটি মুছে ফেলতে চান?`)) {
      recordDeletedFundId(id);
      if (onDeleteFund) {
        onDeleteFund(id);
      } else if (setFunds) {
        setFunds(prev => {
          const updated = prev.filter(f => f.id !== id);
          saveFunds(updated);
          return updated;
        });
      }
      notifySuccess('ফান্ড এন্ট্রি মুছে ফেলা হয়েছে এবং ব্যালেন্স স্বয়ংক্রিয়ভাবে সমন্বয় করা হয়েছে');
    }
  };

  // NOTICE CRUD & DYNAMIC MEETING TEMPLATES
  const handleOpenAddNoticeModal = (defaultCat: string = 'কার্যকরী কমিটির মিটিং') => {
    const todayIso = new Date().toISOString().split('T')[0];
    const initialFields: MeetingFields = {
      date: formatBengaliMeetingDate(todayIso),
      day: getBengaliDayFromDate(todayIso),
      time: '৮:৩০ মিনিট',
      location: 'সংগঠনের কার্যালয়',
      contactNumber: '01886122678'
    };
    setNoticeMeetingFields(initialFields);
    setEditingNotice(null);
    setNoticeModalDate(todayIso);
    setNoticeModalCategory(defaultCat);
    setNoticeModalIsPinned(false);

    if (defaultCat === 'কার্যকরী কমিটির মিটিং') {
      setNoticeModalText(generateExecutiveMeetingNotice(initialFields));
      setNoticeModalTitle('জরুরি কার্যকরী কমিটির সভা বিজ্ঞপ্তি');
    } else if (defaultCat === 'কার্যকরী কমিটি ও সাধারণ সদস্য উভয়ের মিটিং') {
      setNoticeModalText(generateJointMeetingNotice(initialFields));
      setNoticeModalTitle('জরুরি যৌথ সাধারণ সভা বিজ্ঞপ্তি');
    } else {
      setNoticeModalText('');
      setNoticeModalTitle('');
    }
    setIsAddNoticeOpen(true);
  };

  const handleOpenEditNoticeModal = (n: Notice) => {
    setEditingNotice(n);
    const cat = n.category || n.priority || 'সাধারণ';
    setNoticeModalCategory(cat);
    setNoticeModalText(n.noticeText || '');
    setNoticeModalTitle(n.title || '');
    setNoticeModalDate(n.date || new Date().toISOString().split('T')[0]);
    setNoticeModalIsPinned(Boolean(n.isPinned));
    setIsAddNoticeOpen(true);
  };

  const handleNoticeCategoryChange = (cat: string) => {
    setNoticeModalCategory(cat);
    if (cat === 'কার্যকরী কমিটির মিটিং') {
      setNoticeModalText(generateExecutiveMeetingNotice(noticeMeetingFields));
      if (!noticeModalTitle || noticeModalTitle.includes('মিটিং') || noticeModalTitle.includes('সভা')) {
        setNoticeModalTitle('জরুরি কার্যকরী কমিটির সভা বিজ্ঞপ্তি');
      }
    } else if (cat === 'কার্যকরী কমিটি ও সাধারণ সদস্য উভয়ের মিটিং') {
      setNoticeModalText(generateJointMeetingNotice(noticeMeetingFields));
      if (!noticeModalTitle || noticeModalTitle.includes('মিটিং') || noticeModalTitle.includes('সভা')) {
        setNoticeModalTitle('জরুরি যৌথ সাধারণ সভা বিজ্ঞপ্তি');
      }
    }
  };

  const handleNoticeMeetingFieldsChange = (updated: MeetingFields) => {
    setNoticeMeetingFields(updated);
    if (noticeModalCategory === 'কার্যকরী কমিটির মিটিং') {
      setNoticeModalText(generateExecutiveMeetingNotice(updated));
    } else if (noticeModalCategory === 'কার্যকরী কমিটি ও সাধারণ সদস্য উভয়ের মিটিং') {
      setNoticeModalText(generateJointMeetingNotice(updated));
    }
  };

  const handleSaveNotice = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!noticeModalText.trim()) {
      notifyError('নোটিশের বিবরণ অবশ্যই লিখুন');
      return;
    }

    const finalTitle = noticeModalTitle.trim() || (
      noticeModalCategory === 'কার্যকরী কমিটির মিটিং' 
        ? 'জরুরি কার্যকরী কমিটির সভা'
        : noticeModalCategory === 'কার্যকরী কমিটি ও সাধারণ সদস্য উভয়ের মিটিং'
        ? 'জরুরি যৌথ সাধারণ সভা'
        : 'সংগঠনের নোটিশ'
    );

    if (editingNotice) {
      if (onEditNotice) {
        onEditNotice({
          ...editingNotice,
          title: finalTitle,
          noticeText: noticeModalText.trim(),
          priority: noticeModalCategory as any,
          category: noticeModalCategory,
          date: noticeModalDate || editingNotice.date,
          isPinned: noticeModalIsPinned
        });
      } else if (setNotices) {
        setNotices(prev => prev.map(n => n.id === editingNotice.id ? {
          ...n,
          title: finalTitle,
          noticeText: noticeModalText.trim(),
          priority: noticeModalCategory as any,
          category: noticeModalCategory,
          date: noticeModalDate || n.date,
          isPinned: noticeModalIsPinned
        } : n));
      }
      setEditingNotice(null);
      setIsAddNoticeOpen(false);
      notifySuccess('নোটিশ সফলভাবে আপডেট হয়েছে');
    } else {
      if (onAddNotice) {
        onAddNotice({
          title: finalTitle,
          noticeText: noticeModalText.trim(),
          priority: noticeModalCategory as any,
          category: noticeModalCategory,
          date: noticeModalDate || new Date().toISOString().split('T')[0],
          isPinned: noticeModalIsPinned
        });
      } else if (setNotices) {
        const newNotice: Notice = {
          id: `n-${Date.now()}`,
          title: finalTitle,
          noticeText: noticeModalText.trim(),
          priority: noticeModalCategory as any,
          category: noticeModalCategory,
          date: noticeModalDate || new Date().toISOString().split('T')[0],
          isPinned: noticeModalIsPinned
        };
        setNotices(prev => [newNotice, ...prev]);
      }
      setIsAddNoticeOpen(false);
      notifySuccess('নতুন নোটিশ সফলভাবে বোর্ডে প্রকাশিত হয়েছে');
    }
  };

  const handleDeleteNotice = (id: string) => {
    if (window.confirm('আপনি কি এই নোটিশটি মুছে ফেলতে চান?')) {
      recordDeletedNoticeId(id);
      if (onDeleteNotice) {
        onDeleteNotice(id);
      } else if (setNotices) {
        setNotices(prev => {
          const updated = prev.filter(n => n.id !== id);
          saveNotices(updated);
          return updated;
        });
      }
      notifySuccess('নোটিশ সফলভাবে মুছে ফেলা হয়েছে');
    }
  };

  const handleTogglePinNotice = (id: string) => {
    const target = notices.find(n => n.id === id);
    if (target && onEditNotice) {
      onEditNotice({ ...target, isPinned: !target.isPinned });
    } else if (setNotices) {
      setNotices(prev => prev.map(n => n.id === id ? { ...n, isPinned: !n.isPinned } : n));
    }
  };

  // SUPPORT & REPORT CRUD
  const handleSupportPhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        notifyError('ছবির সাইজ সর্বোচ্চ ৫ মেগাবাইট হতে পারবে');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setSupportPhotoBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveSupportReport = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const name = (formData.get('name') as string) || '';
    const designation = (formData.get('designation') as string) || '';
    const subject = (formData.get('subject') as string) || '';
    const phone = (formData.get('phone') as string) || '';
    const description = (formData.get('description') as string) || '';
    const type = (formData.get('type') as any) || 'সহায়তা';
    const status = (formData.get('status') as any) || 'pending';
    const adminNotes = (formData.get('adminNotes') as string) || '';

    if (!name.trim()) {
      notifyError('নাম অবশ্যই পূরণ করুন');
      return;
    }
    if (!subject.trim()) {
      notifyError('বিষয় / শিরোনাম অবশ্যই পূরণ করুন');
      return;
    }
    if (!phone.trim()) {
      notifyError('মোবাইল নম্বর অবশ্যই পূরণ করুন');
      return;
    }
    if (!description.trim()) {
      notifyError('বিস্তারিত বিবরণ অবশ্যই লিখুন');
      return;
    }

    const reportData: Omit<SupportReportItem, 'id'> = {
      name: name.trim(),
      designation: designation.trim() || 'সাধারণ সদস্য',
      subject: subject.trim(),
      phone: phone.trim(),
      description: description.trim(),
      photoUrl: supportPhotoBase64 || editingSupportReport?.photoUrl || '',
      type,
      status,
      adminNotes: adminNotes.trim(),
      createdAt: editingSupportReport?.createdAt || new Date().toISOString()
    };

    if (editingSupportReport) {
      const updatedReport: SupportReportItem = {
        ...reportData,
        id: editingSupportReport.id
      };
      if (onEditSupportReport) {
        onEditSupportReport(updatedReport);
      } else if (setSupportReports) {
        setSupportReports(prev => prev.map(r => r.id === editingSupportReport.id ? updatedReport : r));
      }
      setEditingSupportReport(null);
      setSupportPhotoBase64('');
      notifySuccess('সাপোর্ট/রিপোর্ট এন্ট্রি সফলভাবে আপডেট হয়েছে');
    } else {
      if (onAddSupportReport) {
        onAddSupportReport(reportData);
      } else if (setSupportReports) {
        const newReport: SupportReportItem = {
          ...reportData,
          id: `rep-${Date.now()}`
        };
        setSupportReports(prev => [newReport, ...prev]);
      }
      setIsAddSupportReportOpen(false);
      setSupportPhotoBase64('');
      notifySuccess('নতুন সাপোর্ট/রিপোর্ট এন্ট্রি সফলভাবে যোগ হয়েছে');
    }
  };

  const handleDeleteSupportReport = (id: string, name: string) => {
    if (window.confirm(`আপনি কি "${name}"-এর সাপোর্ট/রিপোর্ট এন্ট্রি মুছে ফেলতে চান?`)) {
      recordDeletedReportId(id);
      if (onDeleteSupportReport) {
        onDeleteSupportReport(id);
      } else if (setSupportReports) {
        setSupportReports(prev => {
          const updated = prev.filter(r => r.id !== id);
          saveSupportReports(updated);
          return updated;
        });
      }
      notifySuccess('সাপোর্ট/রিপোর্ট এন্ট্রি সফলভাবে মুছে ফেলা হয়েছে');
    }
  };

  const handleQuickSupportStatusChange = (id: string, newStatus: 'pending' | 'in_review' | 'resolved') => {
    const target = (supportReports || []).find(r => r.id === id);
    if (target) {
      const updated = { ...target, status: newStatus };
      if (onEditSupportReport) {
        onEditSupportReport(updated);
      } else if (setSupportReports) {
        setSupportReports(prev => prev.map(r => r.id === id ? updated : r));
      }
      const label = newStatus === 'resolved' ? 'সমাধানকৃত' : newStatus === 'in_review' ? 'পর্যালোচনায়' : 'অপেক্ষমাণ';
      notifySuccess(`স্ট্যাটাস পরিবর্তন করে "${label}" করা হয়েছে`);
    }
  };

  // ORGANIZATION PROFILE & SETTINGS
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateProfile) {
      onUpdateProfile(editProfileData);
    }
    if (setProfile) {
      setProfile(editProfileData);
    }
    notifySuccess('সংগঠনের তথ্য ও পরিচিতি সফলভাবে সংরক্ষিত হয়েছে');
  };

  const handleChangePin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCurrent = currentPinInput.trim();
    const cleanNew = newPinInput.trim();
    const cleanConfirm = confirmPinInput.trim();

    if (!cleanCurrent) {
      notifyError('বর্তমান পাসওয়ার্ড প্রদান করুন');
      return;
    }
    if (!verifyAdminPin(cleanCurrent)) {
      notifyError('বর্তমান পাসওয়ার্ড সঠিক নয়!');
      return;
    }
    if (cleanNew.length < 4) {
      notifyError('নতুন পাসওয়ার্ড কমপক্ষে ৪ ডিজিট বা অক্ষরের হতে হবে');
      return;
    }
    if (cleanNew !== cleanConfirm) {
      notifyError('নতুন পাসওয়ার্ড ও নিশ্চিতকরণ পাসওয়ার্ড মিলছে না');
      return;
    }

    setAdminPin(cleanNew);
    setCurrentPinInput('');
    setNewPinInput('');
    setConfirmPinInput('');
    notifySuccess('এডমিন পাসওয়ার্ড সফলভাবে আপডেট এবং লোকাল স্টোরেজে সেভ করা হয়েছে');
  };

  const filteredSupportReports = useMemo(() => {
    return (supportReports || []).filter(r => {
      const matchesSearch = !supportSearch || 
        (r.name && r.name.toLowerCase().includes(supportSearch.toLowerCase())) ||
        (r.subject && r.subject.toLowerCase().includes(supportSearch.toLowerCase())) ||
        (r.phone && r.phone.includes(supportSearch)) ||
        (r.description && r.description.toLowerCase().includes(supportSearch.toLowerCase()));
      
      const matchesType = supportFilterType === 'all' || r.type === supportFilterType;
      return matchesSearch && matchesType;
    });
  }, [supportReports, supportSearch, supportFilterType]);

  const supportSummary = useMemo(() => {
    const list = supportReports || [];
    const total = list.length;
    const pending = list.filter(r => r.status === 'pending').length;
    const inReview = list.filter(r => r.status === 'in_review').length;
    const resolved = list.filter(r => r.status === 'resolved').length;
    return { total, pending, inReview, resolved };
  }, [supportReports]);

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* Top Admin Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white p-5 rounded-2xl shadow-md border border-slate-700">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              id="admin-back-btn"
              className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
              title="হোমে ফিরুন"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  এডমিন মোড সক্রিয় • কোনো গুগল শিটের প্রয়োজন নেই
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                ইন-অ্যাপ সেন্ট্রাল এডমিন প্যানেল
              </h2>
              <p className="text-xs text-slate-300">
                {profile.name} • {profile.address}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setIsAdmin(false);
                onBack();
              }}
              id="admin-logout-btn"
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-rose-600/30 hover:bg-rose-600 text-rose-200 hover:text-white border border-rose-500/40 rounded-xl transition"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>লগআউট</span>
            </button>
          </div>
        </div>

        {/* Global Feedback Banner */}
        {successMsg && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-500/20 text-emerald-200 border border-emerald-500/40 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="mt-4 p-3 rounded-xl bg-red-500/20 text-red-200 border border-red-500/40 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Admin Tabs Navigation Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 bg-white p-2 rounded-2xl border border-slate-200 shadow-xs">
        <button
          onClick={() => setActiveTab('overview')}
          id="admin-tab-overview"
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'overview'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>ওভারভিউ</span>
        </button>

        <button
          onClick={() => setActiveTab('homepage')}
          id="admin-tab-homepage"
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'homepage'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>হোম পেজ সেটিংস</span>
          <span className="text-[10px] bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded-full font-bold">নতুন</span>
        </button>

        <button
          onClick={() => setActiveTab('members')}
          id="admin-tab-members"
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'members'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>সদস্য ব্যবস্থাপনা ({toBengaliNumber(members.length)})</span>
        </button>

        <button
          onClick={() => setActiveTab('donors')}
          id="admin-tab-donors"
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'donors'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Droplet className="w-4 h-4" />
          <span>রক্তদান ব্যবস্থাপনা ({toBengaliNumber(donors.length)})</span>
        </button>

        <button
          onClick={() => setActiveTab('funds')}
          id="admin-tab-funds"
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'funds'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Wallet className="w-4 h-4" />
          <span>ফান্ড ও হিসাব ({toBengaliNumber(funds.length)})</span>
        </button>

        <button
          onClick={() => setActiveTab('notices')}
          id="admin-tab-notices"
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'notices'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BellRing className="w-4 h-4" />
          <span>নোটিশ বোর্ড ({toBengaliNumber(notices.length)})</span>
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          id="admin-tab-reports"
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'reports'
              ? 'bg-amber-500 text-slate-950 shadow-xs ring-1 ring-amber-300 font-black'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <LifeBuoy className="w-4 h-4" />
          <span>রিপোর্ট ও সহায়তা ({toBengaliNumber((supportReports || []).length)})</span>
        </button>

        <button
          onClick={() => setActiveTab('payments')}
          id="admin-tab-payments"
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'payments'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>পেমেন্ট নম্বর ব্যবস্থাপনা</span>
          {(paymentConfig.bkashNumber || paymentConfig.nagadNumber || paymentConfig.rocketNumber) && (
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          id="admin-tab-settings"
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'settings'
              ? 'bg-purple-700 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>সংগঠন সেটিংস ও ব্যাকআপ</span>
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Real-time Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">মোট সদস্য</span>
                <Users className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl font-black text-slate-900 mt-2">
                {toBengaliNumber(members.length)} জন
              </div>
              <button
                onClick={() => { setActiveTab('members'); setIsAddMemberOpen(true); }}
                className="text-[11px] font-bold text-blue-600 hover:underline mt-2 flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> নতুন সদস্য যোগ
              </button>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">স্বেচ্ছায় রক্তদাতা</span>
                <Droplet className="w-4 h-4 text-rose-600" />
              </div>
              <div className="text-2xl font-black text-slate-900 mt-2">
                {toBengaliNumber(donors.length)} জন
              </div>
              <button
                onClick={() => { setActiveTab('donors'); setIsAddDonorOpen(true); }}
                className="text-[11px] font-bold text-rose-600 hover:underline mt-2 flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> নতুন দাতা নিবন্ধন
              </button>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">মোট ফান্ড ব্যালেন্স</span>
                <Wallet className="w-4 h-4 text-teal-600" />
              </div>
              <div className="text-2xl font-black text-teal-700 mt-2">
                {formatTaka(fundSummary.totalBalance)}
              </div>
              <span className="text-[11px] text-slate-500 mt-2 block">
                আদায়: {formatTaka(fundSummary.totalPaid)} • বকেয়া: {formatTaka(fundSummary.totalDue)}
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">প্রকাশিত নোটিশ</span>
                <BellRing className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-2xl font-black text-slate-900 mt-2">
                {toBengaliNumber(notices.length)} টি
              </div>
              <button
                onClick={() => { setActiveTab('notices'); setIsAddNoticeOpen(true); }}
                className="text-[11px] font-bold text-amber-600 hover:underline mt-2 flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> নতুন নোটিশ প্রকাশ
              </button>
            </div>
          </div>

          {/* Quick Actions Panel */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-slate-700" />
              সংগঠনের পরিচিতি ও সরাসরি নিয়ন্ত্রণ
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <span className="text-slate-500 font-semibold block">স্থায়ী ঠিকানা:</span>
                <span className="text-slate-900 font-bold text-sm mt-0.5 block">{profile.address}</span>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <span className="text-slate-500 font-semibold block">জরুরি হটলাইন:</span>
                <span className="text-slate-900 font-bold text-sm mt-0.5 block font-mono">{profile.hotline}</span>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <span className="text-slate-500 font-semibold block">রেজিস্ট্রেশন নম্বর:</span>
                <span className="text-slate-900 font-bold text-sm mt-0.5 block">{profile.regNumber}</span>
              </div>
            </div>

            {/* Direct Shortcut to Payment Numbers */}
            <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    বিকাশ, নগদ ও রকেট পেমেন্ট নম্বর পরিবর্তন ও লাইভ ব্যবস্থাপনা
                  </h4>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    সদস্যদের চাঁদা পরিশোধের জন্য যেকোনো সময় নতুন মোবাইল ব্যাংকিং নম্বর সেট করুন।
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('payments')}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
              >
                <span>নম্বর ম্যানেজ করুন</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MEMBERS CRUD */}
      {activeTab === 'members' && (
        <div className="space-y-4">
          {/* Action Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                placeholder="সদস্যের নাম, পদবি, এলাকা বা ফোন দিয়ে খুঁজুন..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setEditingMember(null);
                  setIsAddMemberOpen(true);
                }}
                id="admin-add-member-btn"
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>নতুন সদস্য যুক্ত করুন</span>
              </button>
            </div>
          </div>

          {/* Sub-tabs: All, General, Expatriate */}
          <div className="flex flex-wrap items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/80">
            <button
              type="button"
              onClick={() => setAdminMemberTab('all')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer ${
                adminMemberTab === 'all'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              সকল সদস্য ({toBengaliNumber(members.length)})
            </button>
            <button
              type="button"
              onClick={() => setAdminMemberTab('general')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                adminMemberTab === 'general'
                  ? 'bg-white text-emerald-800 shadow-xs border border-emerald-300/60'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-emerald-600" />
              <span>সাধারণ সদস্য ({toBengaliNumber(members.filter(m => !m.isExpatriate && m.memberType !== 'expatriate').length)})</span>
            </button>
            <button
              type="button"
              onClick={() => setAdminMemberTab('expatriate')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                adminMemberTab === 'expatriate'
                  ? 'bg-white text-blue-800 shadow-xs border border-blue-300/60'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Globe className="w-3.5 h-3.5 text-blue-600" />
              <span>প্রবাসী সদস্য ({toBengaliNumber(members.filter(m => m.isExpatriate || m.memberType === 'expatriate').length)})</span>
            </button>
          </div>

          {/* Members Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-3.5 w-20 text-center">ক্রমিক (#)</th>
                    <th className="p-3.5">নাম ও পদবি</th>
                    <th className="p-3.5">মোবাইল নম্বর</th>
                    <th className="p-3.5">এলাকা</th>
                    <th className="p-3.5">যোগদান</th>
                    <th className="p-3.5">স্ট্যাটাস</th>
                    <th className="p-3.5 text-right">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {sortMembersOldestFirst(members)
                    .filter(m => {
                      if (adminMemberTab === 'general') return !m.isExpatriate && m.memberType !== 'expatriate';
                      if (adminMemberTab === 'expatriate') return m.isExpatriate || m.memberType === 'expatriate';
                      return true;
                    })
                    .filter(m =>
                      m.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
                      m.designation.toLowerCase().includes(memberSearch.toLowerCase()) ||
                      m.phone.includes(memberSearch) ||
                      (m.countryStatus && m.countryStatus.toLowerCase().includes(memberSearch.toLowerCase())) ||
                      (m.area && m.area.toLowerCase().includes(memberSearch.toLowerCase()))
                    )
                    .map((m, idx) => {
                      const allSorted = sortMembersOldestFirst(members);
                      const serialIndex = allSorted.findIndex(item => item.id === m.id);
                      const serialNo = serialIndex !== -1 ? serialIndex + 1 : idx + 1;
                      return (
                      <tr key={m.id} className="hover:bg-slate-50/80 transition">
                        <td className="p-3.5 text-center">
                          <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
                            #{toBengaliNumber(serialNo)}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <div className="flex items-center gap-2.5">
                            {(() => {
                              const photoSrc = getMemberPhotoUrl(m);
                              return (
                                <div 
                                  onClick={() => {
                                    if (photoSrc) setZoomedMemberPhoto(m);
                                  }}
                                  className={`w-9 h-9 rounded-xl bg-blue-50 border border-blue-200/80 text-blue-800 flex items-center justify-center font-bold text-xs flex-shrink-0 overflow-hidden shadow-2xs ${
                                    photoSrc ? 'cursor-pointer hover:border-emerald-500 transition-all' : ''
                                  }`}
                                  title={photoSrc ? `${m.name}-এর ছবি বড় করে দেখতে ক্লিক করুন` : m.name}
                                >
                                  {photoSrc ? (
                                    <img
                                      src={photoSrc}
                                      alt={m.name}
                                      className="w-full h-full object-cover hover:scale-110 transition-transform duration-200"
                                      onError={(e) => {
                                        const img = e.target as HTMLImageElement;
                                        if (m.id && !img.src.includes('/api/member-photo/')) {
                                          img.src = `/api/member-photo/${encodeURIComponent(m.id)}`;
                                        } else {
                                          img.style.display = 'none';
                                        }
                                      }}
                                    />
                                  ) : (
                                    m.name.charAt(0)
                                  )}
                                </div>
                              );
                            })()}
                            <div>
                              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                <span>{m.name}</span>
                                {m.countryStatus ? (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                                    <Globe className="w-2.5 h-2.5 text-blue-600" />
                                    <span>{m.countryStatus}</span>
                                  </span>
                                ) : (m.isExpatriate || m.memberType === 'expatriate') ? (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                                    <Globe className="w-2.5 h-2.5 text-blue-600" />
                                    <span>প্রবাসী</span>
                                  </span>
                                ) : null}
                              </div>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[11px] text-slate-600 font-medium">{m.designation}</span>
                                {(() => {
                                  const isExec = isExecutiveCommitteeMember(m);
                                  return (
                                    <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                                      isExec 
                                        ? 'bg-purple-50 text-purple-700 border-purple-200' 
                                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    }`}>
                                      {isExec ? 'কার্যকরী কমিটি' : 'সাধারণ সদস্য'}
                                    </span>
                                  );
                                })()}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3.5 font-mono text-slate-800 font-semibold">{m.phone}</td>
                        <td className="p-3.5 text-slate-600">{m.area || ((m.isExpatriate || m.memberType === 'expatriate') ? 'প্রবাসী' : 'পতেঙ্গা, চট্টগ্রাম')}</td>
                        <td className="p-3.5 text-slate-500 text-[11px]">
                          {m.joinDate ? toBengaliNumber(m.joinDate) : '১৫/০৮/২০২২'}
                        </td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {m.status || 'সক্রিয়'}
                          </span>
                        </td>
                        <td className="p-3.5 text-right space-x-1.5">
                          <button
                            onClick={() => setEditingMember(m)}
                            id={`edit-member-${m.id}`}
                            className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 transition cursor-pointer"
                            title="এডিট করুন"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteMember(m.id, m.name)}
                            id={`delete-member-${m.id}`}
                            className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition cursor-pointer"
                            title="মুছে ফেলুন"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: BLOOD DONORS CRUD */}
      {activeTab === 'donors' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={donorSearch}
                onChange={(e) => setDonorSearch(e.target.value)}
                placeholder="রক্তদাতার নাম, রক্তের গ্রুপ বা ফোন দিয়ে খুঁজুন..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setEditingDonor(null);
                  setIsAddDonorOpen(true);
                }}
                id="admin-add-donor-btn"
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition"
              >
                <Plus className="w-4 h-4" />
                <span>নতুন রক্তদাতা যোগ</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {donors
              .filter(d =>
                d.name.toLowerCase().includes(donorSearch.toLowerCase()) ||
                d.bloodGroup.toLowerCase().includes(donorSearch.toLowerCase()) ||
                d.phone.includes(donorSearch) ||
                (d.area && d.area.toLowerCase().includes(donorSearch.toLowerCase()))
              )
              .map(d => {
                const eligibility = isDonorEligible(d);
                const bgBadge = getBloodGroupBadge(d.bloodGroup);

                return (
                  <div key={d.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl border flex items-center justify-center font-black text-sm ${bgBadge.bg} ${bgBadge.border} ${bgBadge.text}`}>
                            {d.bloodGroup}
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900 text-sm">{d.name}</h4>
                            <span className="text-xs text-slate-500 font-mono">{d.phone}</span>
                          </div>
                        </div>

                        {eligibility.eligible ? (
                          <span className="px-2.5 py-1 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            <span>প্রস্তুত আছেন (Eligible)</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-200 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                            <span>৬ মাসের অপেক্ষমান ({toBengaliNumber(eligibility.daysRemaining)} দিন বাকি)</span>
                          </span>
                        )}
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2 bg-slate-50 p-2 rounded-xl text-[11px]">
                        <div>
                          <span className="text-slate-500 block">সর্বশেষ দান:</span>
                          <span className="font-bold text-slate-700">{d.lastDonationDate ? formatBengaliDate(d.lastDonationDate) : 'তথ্য নেই'}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">পরবর্তী তারিখ (৬ মাস):</span>
                          <span className="font-bold text-rose-700">
                            {d.lastDonationDate 
                              ? formatBengaliDate(calculateNextEligibleDate(d.lastDonationDate)) 
                              : (d.nextEligibleDate ? formatBengaliDate(d.nextEligibleDate) : 'প্রস্তুত')}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                      <button
                        onClick={() => setLoggingDonationDonor(d)}
                        className="text-[11px] font-bold text-rose-700 hover:text-rose-900 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200 flex items-center gap-1"
                      >
                        <Droplet className="w-3 h-3" />
                        <span>নতুন রক্তদান এন্ট্রি</span>
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setEditingDonor(d)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                          title="এডিট"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteDonor(d.id, d.name)}
                          className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition"
                          title="ডিলিট"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* TAB 4: FUNDS CRUD (Live Auto Balance Calculation) */}
      {activeTab === 'funds' && (
        <div className="space-y-4">
          {/* Live Auto Balance Banner */}
          <div className="bg-gradient-to-r from-teal-900 to-emerald-950 text-white p-4 sm:p-5 rounded-2xl shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-teal-200 uppercase tracking-wider block">
                স্বয়ংক্রিয় ব্যালেন্স (Live Auto Balance)
              </span>
              <div className="text-3xl font-black text-white mt-1">
                {formatTaka(fundSummary.totalBalance)}
              </div>
              <p className="text-[11px] text-teal-300 mt-1">
                যেকোনো এন্ট্রি যোগ/বদল/মুছে ফেলার সাথে সাথে অটোমেটিক হিসাব আপডেট হয়
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="bg-white/10 px-3 py-2 rounded-xl text-center min-w-[90px]">
                <span className="text-[10px] text-emerald-300 block font-semibold">আদায়কৃত (Paid)</span>
                <span className="text-sm font-bold text-white">{formatTaka(fundSummary.totalPaid)}</span>
              </div>
              <div className="bg-white/10 px-3 py-2 rounded-xl text-center min-w-[90px]">
                <span className="text-[10px] text-rose-300 block font-semibold">মোট খরচ (Expense)</span>
                <span className="text-sm font-bold text-rose-200">{formatTaka(fundSummary.totalExpense)}</span>
              </div>
              <div className="bg-white/10 px-3 py-2 rounded-xl text-center min-w-[90px]">
                <span className="text-[10px] text-amber-300 block font-semibold">যাচাই বাকি (Pending)</span>
                <span className="text-sm font-bold text-amber-200">{formatTaka(fundSummary.totalPending)}</span>
              </div>
              <div className="bg-white/10 px-3 py-2 rounded-xl text-center min-w-[90px]">
                <span className="text-[10px] text-slate-300 block font-semibold">বকেয়া (Due)</span>
                <span className="text-sm font-bold text-slate-200">{formatTaka(fundSummary.totalDue)}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={fundSearch}
                onChange={(e) => setFundSearch(e.target.value)}
                placeholder="সদস্যের নাম, TrxID বা মাস দিয়ে খুঁজুন..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setEditingExpense(null);
                  setIsExpenseModalOpen(true);
                }}
                id="admin-add-expense-btn"
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl shadow-xs transition cursor-pointer"
              >
                <TrendingDown className="w-4 h-4 text-rose-600" />
                <span>নতুন খরচ এন্ট্রি</span>
              </button>

              <button
                onClick={() => {
                  setEditingFund(null);
                  setIsAddFundOpen(true);
                }}
                id="admin-add-fund-btn"
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-xs transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>নতুন ফান্ড এন্ট্রি যোগ</span>
              </button>
            </div>
          </div>

          {/* Card View Layout Exclusively */}
          {(() => {
            const filteredFunds = funds.filter(f =>
              f.memberName.toLowerCase().includes(fundSearch.toLowerCase()) ||
              (f.month && f.month.toLowerCase().includes(fundSearch.toLowerCase())) ||
              (f.notes && f.notes.toLowerCase().includes(fundSearch.toLowerCase())) ||
              (f.trxId && f.trxId.toLowerCase().includes(fundSearch.toLowerCase()))
            );

            if (filteredFunds.length === 0) {
              return (
                <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400 text-xs shadow-xs">
                  কোনো ফান্ড রেকর্ড পাওয়া যায়নি
                </div>
              );
            }

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {filteredFunds.map(f => {
                  const memberPhone = resolveMemberPhone(f, members);
                  const arrearsInfo = formatDynamicArrearsText(f);

                  return (
                    <div
                      key={f.id}
                      className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
                    >
                      {/* Status Strip */}
                      <div
                        className={`h-1.5 ${
                          f.status === 'Paid'
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-600'
                            : f.status === 'Pending'
                            ? 'bg-gradient-to-r from-amber-400 to-amber-500'
                            : f.status === 'Expense'
                            ? 'bg-gradient-to-r from-rose-500 to-red-600'
                            : 'bg-gradient-to-r from-amber-500 to-orange-500'
                        }`}
                      />

                      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                        {/* Member & Category Header */}
                        <div className="flex items-start justify-between gap-2 pb-2 border-b border-slate-100">
                          <div className="min-w-0 flex-1">
                            <h4 className="font-bold text-slate-900 text-sm truncate">
                              {f.memberName}
                            </h4>
                            {memberPhone && (
                              <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-mono font-semibold mt-0.5">
                                <Smartphone className="w-3 h-3 text-emerald-500 shrink-0" />
                                <span>{memberPhone}</span>
                              </div>
                            )}
                          </div>
                          {f.category && (
                            <span className="shrink-0 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                              {f.category}
                            </span>
                          )}
                        </div>

                        {/* Amount and Timing */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-xs text-slate-500">
                            {f.status === 'Due' && arrearsInfo.isMultiMonth ? (
                              <span className="font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 inline-block text-[11px]">
                                {arrearsInfo.formattedText}
                              </span>
                            ) : (
                              <span>{f.month || f.date}</span>
                            )}
                          </div>
                          <div className="font-mono font-black text-sm">
                            {f.status === 'Expense' ? (
                              <span className="text-rose-600">- {formatTaka(f.amount)}</span>
                            ) : (
                              <span className="text-slate-900">{formatTaka(f.amount)}</span>
                            )}
                          </div>
                        </div>

                        {/* TrxID / Notes if present */}
                        {(f.trxId || f.notes) && (
                          <div className="text-[11px] bg-slate-50 p-2 rounded-xl border border-slate-100 flex flex-wrap items-center gap-1.5">
                            {f.trxId && (
                              <span className="font-mono text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-200 px-1.5 py-0.5 rounded">
                                TrxID: {f.trxId}
                              </span>
                            )}
                            {f.notes && (
                              <span className="text-slate-600 truncate">{f.notes}</span>
                            )}
                          </div>
                        )}

                        {/* Status Toggle Buttons */}
                        <div className="pt-1">
                          {f.status === 'Pending' ? (
                            <button
                              type="button"
                              onClick={() => handleToggleFundStatus(f.id)}
                              className="w-full py-1.5 rounded-xl text-xs font-bold border transition bg-amber-50 text-amber-800 border-amber-300 hover:bg-emerald-600 hover:text-white cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                              title="ক্লিক করে ট্রানজেকশন অনুমোদন (Approve) করুন"
                            >
                              <Clock className="w-3.5 h-3.5 text-amber-600" />
                              <span>Pending (অনুমোদন করুন)</span>
                            </button>
                          ) : f.status === 'Expense' ? (
                            <span className="w-full py-1 rounded-xl text-xs font-bold border bg-rose-50 text-rose-700 border-rose-200 block text-center">
                              Expense (ব্যয়)
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleToggleFundStatus(f.id)}
                              className={`w-full py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer text-center ${
                                f.status === 'Paid'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                  : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                              }`}
                              title="স্ট্যাটাস পরিবর্তন করতে ক্লিক করুন"
                            >
                              {f.status === 'Paid' ? '✓ Paid (পরিশোধিত)' : '⚠ Due (বকেয়া)'}
                            </button>
                          )}
                        </div>

                        {/* Admin Action Bar with Direct SMS */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1.5">
                          <div className="flex items-center gap-1.5">
                            {f.status === 'Due' && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const arrears = extractArrearsMonthCount(f);
                                    const body = generateDirectSimDueSms({
                                      memberName: f.memberName,
                                      money: f.amount,
                                      monthCount: arrears.monthCount,
                                      pastMonthsText: arrears.pastMonthsText
                                    });
                                    if (memberPhone) {
                                      triggerDirectSimSms(memberPhone, body);
                                    } else {
                                      setDueSmsTarget({
                                        memberName: f.memberName,
                                        phone: '',
                                        amount: f.amount,
                                        month: f.month || arrearsInfo.formattedText,
                                        memberId: f.memberId
                                      });
                                    }
                                  }}
                                  className="px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-500 hover:bg-amber-600 text-white transition flex items-center gap-1 cursor-pointer shadow-2xs"
                                  title="সরাসরি SIM SMS পাঠান"
                                >
                                  <Send className="w-3 h-3" />
                                  <span>SIM SMS</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDueSmsTarget({
                                    memberName: f.memberName,
                                    phone: memberPhone,
                                    amount: f.amount,
                                    month: f.month || arrearsInfo.formattedText,
                                    memberId: f.memberId
                                  })}
                                  className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                                  title="কাস্টমাইজ ও প্রিভিউ"
                                >
                                  <MessageSquare className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}

                            {f.status === 'Paid' && (
                              <button
                                type="button"
                                onClick={() => {
                                  const body = generateDirectSimPaidSms({
                                    memberName: f.memberName,
                                    months: f.month || f.category || 'চলতি',
                                    money: f.amount
                                  });
                                  if (memberPhone) {
                                    triggerDirectSimSms(memberPhone, body);
                                  }
                                }}
                                className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition flex items-center gap-1 cursor-pointer"
                                title="পরিশোধ নিশ্চিতকরণ SMS পাঠান"
                              >
                                <Send className="w-3 h-3 text-emerald-600" />
                                <span>SMS</span>
                              </button>
                            )}
                          </div>

                          <div className="flex items-center gap-1 ml-auto">
                            <button
                              type="button"
                              onClick={() => {
                                if (f.status === 'Expense') {
                                  setEditingExpense(f);
                                  setIsExpenseModalOpen(true);
                                } else {
                                  setEditingFund(f);
                                }
                              }}
                              className="p-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 transition cursor-pointer"
                              title="এডিট"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteFund(f.id, f.memberName)}
                              className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition cursor-pointer"
                              title="ডিলিট"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {/* TAB 5: NOTICES CRUD */}
      {activeTab === 'notices' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <BellRing className="w-4 h-4 text-amber-600" />
              নোটিশ ব্যবস্থাপনা
            </h3>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const defaultText = generateExecutiveMeetingNotice(noticeMeetingFields);
                  handleOpenBulkMeetingSms('কার্যকরী কমিটির মিটিং', defaultText, 'জরুরি কার্যকরী কমিটির সভা বিজ্ঞপ্তি');
                }}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl shadow-xs transition cursor-pointer"
                title="সবার কাছে মিটিং নোটিশ এসএমএস পাঠান"
              >
                <Send className="w-3.5 h-3.5 text-purple-600" />
                <span>মিটিং এসএমএস ব্রডকাস্ট</span>
              </button>

              <button
                onClick={() => handleOpenAddNoticeModal('কার্যকরী কমিটির মিটিং')}
                id="admin-add-notice-btn"
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>নতুন নোটিশ প্রকাশ</span>
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {notices.map(n => (
              <div key={n.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                        {n.category || n.priority || 'সাধারণ'}
                      </span>
                      <span className="text-xs text-slate-500">{formatBengaliDate(n.date)}</span>
                      {n.isPinned && (
                        <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                          <Pin className="w-3 h-3" /> পিন করা
                        </span>
                      )}
                    </div>
                    {n.title && <h4 className="font-bold text-slate-900 text-sm mt-1.5">{n.title}</h4>}
                    <p className="text-xs text-slate-700 mt-1 whitespace-pre-line leading-relaxed bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">{n.noticeText}</p>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                    {(n.category === 'কার্যকরী কমিটির মিটিং' || 
                      n.category === 'কার্যকরী কমিটি ও সাধারণ সদস্য উভয়ের মিটিং' ||
                      n.title?.includes('মিটিং') ||
                      n.title?.includes('সভা') ||
                      n.noticeText?.includes('মিটিং')) && (
                      <button
                        type="button"
                        onClick={() => handleOpenBulkMeetingSms(n.category || 'কার্যকরী কমিটির মিটিং', n.noticeText, n.title)}
                        className={`p-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                          n.category === 'কার্যকরী কমিটির মিটিং'
                            ? 'bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200'
                            : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200'
                        }`}
                        title="সবার কাছে এসএমএস পাঠান"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">এসএমএস পাঠান</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(n.noticeText);
                        notifySuccess('নোটিশ কপি হয়েছে');
                      }}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs transition cursor-pointer"
                      title="নোটিশ কপি করুন"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleTogglePinNotice(n.id)}
                      className={`p-1.5 rounded-lg text-xs transition cursor-pointer ${n.isPinned ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-500'}`}
                      title={n.isPinned ? 'আনপিন করুন' : 'পিন করুন'}
                    >
                      <Pin className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleOpenEditNoticeModal(n)}
                      className="p-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition cursor-pointer"
                      title="এডিট"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteNotice(n.id)}
                      className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition cursor-pointer"
                      title="ডিলিট"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5.2: SUPPORT & REPORTS MANAGEMENT */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-xs">
                  <LifeBuoy className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <span>রিপোর্ট ও সহায়তা কেন্দ্র ব্যবস্থাপনা</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                      লাইভ রেকর্ডস
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    ব্যবহারকারী ও সদস্যদের অভিযোগ, সহায়তা ও পরামর্শ আবেদনসমূহ পর্যালোচনা এবং পরিচালনা করুন।
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setEditingSupportReport(null);
                  setSupportPhotoBase64('');
                  setIsAddSupportReportOpen(true);
                }}
                id="admin-add-support-report-btn"
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>নতুন রিপোর্ট / এন্ট্রি যোগ করুন</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
              <span className="text-xs text-slate-500 font-medium block">মোট এন্ট্রি</span>
              <span className="text-xl font-bold text-slate-900 mt-1 block">
                {toBengaliNumber(supportSummary.total)} টি
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200 shadow-2xs">
              <span className="text-xs text-amber-800 font-medium block">অপেক্ষমাণ (Pending)</span>
              <span className="text-xl font-bold text-amber-900 mt-1 block">
                {toBengaliNumber(supportSummary.pending)} টি
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200 shadow-2xs">
              <span className="text-xs text-blue-800 font-medium block">পর্যালোচনায় (In Review)</span>
              <span className="text-xl font-bold text-blue-900 mt-1 block">
                {toBengaliNumber(supportSummary.inReview)} টি
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200 shadow-2xs">
              <span className="text-xs text-emerald-800 font-medium block">সমাধানকৃত (Resolved)</span>
              <span className="text-xl font-bold text-emerald-900 mt-1 block">
                {toBengaliNumber(supportSummary.resolved)} টি
              </span>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={supportSearch}
                onChange={(e) => setSupportSearch(e.target.value)}
                placeholder="নাম, বিষয়, ফোন বা বিবরণ খুঁজুন..."
                className="w-full pl-9 pr-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:border-amber-500 focus:outline-none bg-slate-50/50"
              />
              {supportSearch && (
                <button
                  type="button"
                  onClick={() => setSupportSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
              <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">ধরন:</span>
              {['all', 'সহায়তা', 'অভিযোগ', 'পরামর্শ', 'রক্তদান বিষয়ক', 'অন্যান্য'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSupportFilterType(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                    supportFilterType === cat
                      ? 'bg-amber-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat === 'all' ? 'সকল ধরন' : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Reports Grid List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Dashed 'Add New Subject' Card for Admin */}
            <button
              type="button"
              id="admin-add-new-subject-dashed-card"
              onClick={() => {
                setEditingSupportReport(null);
                setSupportPhotoBase64('');
                setIsAddSupportReportOpen(true);
              }}
              className="min-h-[180px] p-6 rounded-2xl border-2 border-dashed border-amber-300 hover:border-amber-500 bg-gradient-to-br from-amber-50/40 to-orange-50/30 hover:from-amber-50/80 hover:to-orange-50/60 transition-all duration-200 flex flex-col items-center justify-center text-center group cursor-pointer shadow-2xs hover:shadow-md"
            >
              <div className="w-14 h-14 rounded-full bg-amber-100 group-hover:bg-amber-500 text-amber-700 group-hover:text-white flex items-center justify-center transition-all duration-200 shadow-xs mb-3 group-hover:scale-110">
                <Plus className="w-7 h-7 stroke-[2.5]" />
              </div>
              <h4 className="text-sm font-bold text-slate-800 group-hover:text-amber-900 transition">
                নতুন বিষয় যোগ করুন
              </h4>
              <p className="text-xs font-semibold text-amber-700/80 group-hover:text-amber-800 tracking-wide mt-0.5">
                Add New Subject / Support Entry
              </p>
              <span className="text-[10px] text-slate-400 mt-2 font-medium">
                ক্লিক করে নতুন হেল্পডেস্ক বা সাপোর্ট তথ্য যুক্ত করুন
              </span>
            </button>

            {/* Existing filtered items */}
            {filteredSupportReports.map((report) => {
              const statusBadge = report.status === 'resolved' 
                ? { bg: 'bg-emerald-100 text-emerald-800 border-emerald-200', text: 'সমাধানকৃত' }
                : report.status === 'in_review'
                ? { bg: 'bg-blue-100 text-blue-800 border-blue-200', text: 'পর্যালোচনায়' }
                : { bg: 'bg-amber-100 text-amber-900 border-amber-200', text: 'অপেক্ষমাণ' };

              return (
                <div 
                  key={report.id}
                  id={`admin-support-item-${report.id}`}
                  className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition flex flex-col justify-between space-y-4"
                >
                    <div className="space-y-3">
                      {/* Top Header Row with Photo & Info */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          {report.photoUrl ? (
                            <img
                              src={report.photoUrl}
                              alt={report.name}
                              className="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-2xs shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-800 font-black text-base flex items-center justify-center shrink-0 border border-amber-200">
                              {report.name.charAt(0)}
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-sm font-bold text-slate-900">{report.name}</h4>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                                {report.designation || 'সদস্য'}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5 font-mono">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span>{report.phone}</span>
                            </div>
                          </div>
                        </div>

                        {/* Status badge & Type */}
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${statusBadge.bg}`}>
                            {statusBadge.text}
                          </span>
                          <span className="text-[10px] text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200 font-semibold">
                            {report.type || 'সহায়তা'}
                          </span>
                        </div>
                      </div>

                      {/* Subject & Description */}
                      <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-100 space-y-1.5">
                        <h5 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          <MessageSquare className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>বিষয়: {report.subject}</span>
                        </h5>
                        <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                          {report.description}
                        </p>
                      </div>

                      {/* Admin Notes if present */}
                      {report.adminNotes && (
                        <div className="bg-amber-50/60 p-2.5 rounded-xl border border-amber-200/60 text-[11px] text-amber-900">
                          <strong className="font-bold">এডমিন মন্তব্য:</strong> {report.adminNotes}
                        </div>
                      )}
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1 text-[10px] text-slate-400">
                        <Clock className="w-3 h-3" />
                        <span>{report.createdAt ? new Date(report.createdAt).toLocaleDateString('bn-BD') : 'সংরক্ষিত'}</span>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1.5">
                        {/* Quick Status Buttons */}
                        <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
                          <button
                            type="button"
                            onClick={() => handleQuickSupportStatusChange(report.id, 'pending')}
                            className={`px-2 py-1 text-[10px] font-bold rounded ${
                              report.status === 'pending'
                                ? 'bg-amber-500 text-white shadow-2xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                            title="অপেক্ষমাণ"
                          >
                            অপেক্ষমাণ
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuickSupportStatusChange(report.id, 'in_review')}
                            className={`px-2 py-1 text-[10px] font-bold rounded ${
                              report.status === 'in_review'
                                ? 'bg-blue-600 text-white shadow-2xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                            title="পর্যালোচনায়"
                          >
                            পর্যালোচনায়
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuickSupportStatusChange(report.id, 'resolved')}
                            className={`px-2 py-1 text-[10px] font-bold rounded ${
                              report.status === 'resolved'
                                ? 'bg-emerald-600 text-white shadow-2xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                            title="সমাধানকৃত"
                          >
                            সমাধান
                          </button>
                        </div>

                        {/* Direct SMS Button */}
                        <button
                          type="button"
                          onClick={() => triggerNativeSms(report.phone, '')}
                          className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition cursor-pointer"
                          title="সরাসরি এসএমএস পাঠান"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>

                        {/* Direct Call Button */}
                        <button
                          type="button"
                          onClick={() => triggerNativeCall(report.phone)}
                          className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition cursor-pointer active:scale-98"
                          title="সরাসরি কল দিন"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </button>

                        {/* Edit Button */}
                        <button
                          type="button"
                          onClick={() => {
                            setEditingSupportReport(report);
                            setSupportPhotoBase64(report.photoUrl || '');
                            setIsAddSupportReportOpen(true);
                          }}
                          className="p-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition"
                          title="সম্পাদনা করুন"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => handleDeleteSupportReport(report.id, report.name)}
                          className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition"
                          title="মুছে ফেলুন"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
        </div>
      )}

      {/* TAB 5.5: DEDICATED PAYMENT GATEWAY & MOBILE BANKING NUMBERS MANAGEMENT */}
      {activeTab === 'payments' && (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <span>বিকাশ, নগদ ও রকেট পেমেন্ট নম্বর ব্যবস্থাপনা</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      লাইভ কানেক্টেড
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    এখানে যে নম্বরগুলো সেট ও সেভ করবেন, তা সরাসরি মেম্বারদের পেমেন্ট স্ক্রিনে দৃশ্যমান হবে।
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Status Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className={`p-3.5 rounded-xl border transition ${
              paymentConfig.bkashNumber ? 'bg-pink-50/80 border-pink-200' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-pink-900 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-pink-600" />
                  বিকাশ (bKash)
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  paymentConfig.bkashNumber ? 'bg-pink-200/80 text-pink-950' : 'bg-slate-200 text-slate-600'
                }`}>
                  {paymentConfig.bkashNumber ? 'সক্রিয়' : 'খালি'}
                </span>
              </div>
              <div className="mt-2 text-sm font-mono font-bold text-slate-800">
                {paymentConfig.bkashNumber || 'নম্বর সেট করা হয়নি'}
              </div>
            </div>

            <div className={`p-3.5 rounded-xl border transition ${
              paymentConfig.nagadNumber ? 'bg-orange-50/80 border-orange-200' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-orange-900 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-600" />
                  নগদ (Nagad)
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  paymentConfig.nagadNumber ? 'bg-orange-200/80 text-orange-950' : 'bg-slate-200 text-slate-600'
                }`}>
                  {paymentConfig.nagadNumber ? 'সক্রিয়' : 'খালি'}
                </span>
              </div>
              <div className="mt-2 text-sm font-mono font-bold text-slate-800">
                {paymentConfig.nagadNumber || 'নম্বর সেট করা হয়নি'}
              </div>
            </div>

            <div className={`p-3.5 rounded-xl border transition ${
              paymentConfig.rocketNumber ? 'bg-purple-50/80 border-purple-200' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-600" />
                  রকেট (Rocket)
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  paymentConfig.rocketNumber ? 'bg-purple-200/80 text-purple-950' : 'bg-slate-200 text-slate-600'
                }`}>
                  {paymentConfig.rocketNumber ? 'সক্রিয়' : 'খালি'}
                </span>
              </div>
              <div className="mt-2 text-sm font-mono font-bold text-slate-800">
                {paymentConfig.rocketNumber || 'নম্বর সেট করা হয়নি'}
              </div>
            </div>
          </div>

          {/* Form with Dedicated Inputs */}
          <form onSubmit={handleSavePaymentSettings} className="space-y-4">
            {/* 1. bKash Dedicated Card */}
            <div className="bg-white p-5 rounded-2xl border border-pink-200 shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-pink-100">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-pink-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                    bK
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">১. বিকাশ (bKash) নম্বর ও তথ্য</h4>
                    <span className="text-[11px] text-slate-500">বিকাশ মোবাইল ব্যাংকিং সেটিংস</span>
                  </div>
                </div>

                {paymentConfig.bkashNumber && (
                  <button
                    type="button"
                    onClick={() => handleTestCopy(paymentConfig.bkashNumber, 'test-bkash')}
                    className="flex items-center gap-1 px-3 py-1.5 bg-pink-50 hover:bg-pink-100 text-pink-700 text-xs font-bold rounded-lg border border-pink-200 transition cursor-pointer"
                  >
                    {copiedTestField === 'test-bkash' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-pink-600" />
                        <span>কপি হয়েছে!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>কপি টেস্ট</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    বিকাশ মোবাইল নম্বর (bKash Phone Number) <span className="text-pink-600">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="admin-bkash-number-input"
                      value={paymentConfig.bkashNumber}
                      onChange={(e) => setPaymentConfig({ ...paymentConfig, bkashNumber: e.target.value })}
                      placeholder="যেমন: 018XXXXXXXX"
                      className="w-full px-3.5 py-2.5 border-2 border-pink-200 focus:border-pink-500 rounded-xl text-sm font-mono font-bold text-slate-900 bg-pink-50/30 focus:bg-white focus:outline-none transition shadow-inner"
                    />
                    {paymentConfig.bkashNumber && (
                      <button
                        type="button"
                        onClick={() => setPaymentConfig({ ...paymentConfig, bkashNumber: '' })}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        title="মুছুন"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    ১১ ডিজিটের সচল বিকাশ ব্যক্তিগত বা মার্চেন্ট নম্বর দিন।
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    অ্যাকাউন্টের ধরন (Account Type)
                  </label>
                  <select
                    value={paymentConfig.bkashType}
                    onChange={(e) => setPaymentConfig({ ...paymentConfig, bkashType: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 border border-slate-300 focus:border-pink-500 rounded-xl text-xs font-bold bg-white focus:outline-none transition"
                  >
                    <option value="Personal">Personal (ব্যক্তিগত - Send Money)</option>
                    <option value="Merchant">Merchant (মার্চেন্ট - Payment)</option>
                    <option value="Agent">Agent (এজেন্ট - Cash In)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  পেমেন্ট নির্দেশনা (Instructions / Note for Users)
                </label>
                <input
                  type="text"
                  value={paymentConfig.bkashInstructions || ''}
                  onChange={(e) => setPaymentConfig({ ...paymentConfig, bkashInstructions: e.target.value })}
                  placeholder="যেমন: আপনার বিকাশ অ্যাপ থেকে Send Money করুন। রেফারেন্সে মেম্বার আইডি লিখুন।"
                  className="w-full px-3.5 py-2 border border-slate-300 focus:border-pink-500 rounded-xl text-xs bg-white focus:outline-none transition"
                />
              </div>
            </div>

            {/* 2. Nagad Dedicated Card */}
            <div className="bg-white p-5 rounded-2xl border border-orange-200 shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-orange-100">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-orange-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                    নগদ
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">২. নগদ (Nagad) নম্বর ও তথ্য</h4>
                    <span className="text-[11px] text-slate-500">নগদ মোবাইল ব্যাংকিং সেটিংস</span>
                  </div>
                </div>

                {paymentConfig.nagadNumber && (
                  <button
                    type="button"
                    onClick={() => handleTestCopy(paymentConfig.nagadNumber, 'test-nagad')}
                    className="flex items-center gap-1 px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-700 text-xs font-bold rounded-lg border border-orange-200 transition cursor-pointer"
                  >
                    {copiedTestField === 'test-nagad' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-orange-600" />
                        <span>কপি হয়েছে!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>কপি টেস্ট</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    নগদ মোবাইল নম্বর (Nagad Phone Number) <span className="text-orange-600">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="admin-nagad-number-input"
                      value={paymentConfig.nagadNumber}
                      onChange={(e) => setPaymentConfig({ ...paymentConfig, nagadNumber: e.target.value })}
                      placeholder="যেমন: 017XXXXXXXX"
                      className="w-full px-3.5 py-2.5 border-2 border-orange-200 focus:border-orange-500 rounded-xl text-sm font-mono font-bold text-slate-900 bg-orange-50/30 focus:bg-white focus:outline-none transition shadow-inner"
                    />
                    {paymentConfig.nagadNumber && (
                      <button
                        type="button"
                        onClick={() => setPaymentConfig({ ...paymentConfig, nagadNumber: '' })}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        title="মুছুন"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    ১১ ডিজিটের সচল নগদ ব্যক্তিগত বা মার্চেন্ট নম্বর দিন।
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    অ্যাকাউন্টের ধরন (Account Type)
                  </label>
                  <select
                    value={paymentConfig.nagadType}
                    onChange={(e) => setPaymentConfig({ ...paymentConfig, nagadType: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 border border-slate-300 focus:border-orange-500 rounded-xl text-xs font-bold bg-white focus:outline-none transition"
                  >
                    <option value="Personal">Personal (ব্যক্তিগত - Send Money)</option>
                    <option value="Merchant">Merchant (মার্চেন্ট - Payment)</option>
                    <option value="Agent">Agent (এজেন্ট - Cash In)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  পেমেন্ট নির্দেশনা (Instructions / Note for Users)
                </label>
                <input
                  type="text"
                  value={paymentConfig.nagadInstructions || ''}
                  onChange={(e) => setPaymentConfig({ ...paymentConfig, nagadInstructions: e.target.value })}
                  placeholder="যেমন: নগদ অ্যাপ বা *167# ডায়াল করে Send Money করুন এবং ট্রানজেকশন আইডি দিন।"
                  className="w-full px-3.5 py-2 border border-slate-300 focus:border-orange-500 rounded-xl text-xs bg-white focus:outline-none transition"
                />
              </div>
            </div>

            {/* 3. Rocket Dedicated Card */}
            <div className="bg-white p-5 rounded-2xl border border-purple-200 shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-purple-100">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-purple-700 text-white font-black text-xs flex items-center justify-center shadow-xs">
                    রকেট
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">৩. রকেট (Rocket) নম্বর ও তথ্য</h4>
                    <span className="text-[11px] text-slate-500">ডাচ্-বাংলা রকেট মোবাইল ব্যাংকিং সেটিংস</span>
                  </div>
                </div>

                {paymentConfig.rocketNumber && (
                  <button
                    type="button"
                    onClick={() => handleTestCopy(paymentConfig.rocketNumber, 'test-rocket')}
                    className="flex items-center gap-1 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold rounded-lg border border-purple-200 transition cursor-pointer"
                  >
                    {copiedTestField === 'test-rocket' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-purple-600" />
                        <span>কপি হয়েছে!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>কপি টেস্ট</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    রকেট মোবাইল নম্বর (Rocket 12-Digit Phone Number) <span className="text-purple-600">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="admin-rocket-number-input"
                      value={paymentConfig.rocketNumber}
                      onChange={(e) => setPaymentConfig({ ...paymentConfig, rocketNumber: e.target.value })}
                      placeholder="যেমন: 019XXXXXXXXX"
                      className="w-full px-3.5 py-2.5 border-2 border-purple-200 focus:border-purple-500 rounded-xl text-sm font-mono font-bold text-slate-900 bg-purple-50/30 focus:bg-white focus:outline-none transition shadow-inner"
                    />
                    {paymentConfig.rocketNumber && (
                      <button
                        type="button"
                        onClick={() => setPaymentConfig({ ...paymentConfig, rocketNumber: '' })}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        title="মুছুন"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    ১২ ডিজিটের রকেট নম্বর (চেক ডিজিট সহ) দিন।
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    অ্যাকাউন্টের ধরন (Account Type)
                  </label>
                  <select
                    value={paymentConfig.rocketType}
                    onChange={(e) => setPaymentConfig({ ...paymentConfig, rocketType: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 border border-slate-300 focus:border-purple-500 rounded-xl text-xs font-bold bg-white focus:outline-none transition"
                  >
                    <option value="Personal">Personal (ব্যক্তিগত - Send Money)</option>
                    <option value="Merchant">Merchant (মার্চেন্ট - Payment)</option>
                    <option value="Agent">Agent (এজেন্ট - Cash In)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  পেমেন্ট নির্দেশনা (Instructions / Note for Users)
                </label>
                <input
                  type="text"
                  value={paymentConfig.rocketInstructions || ''}
                  onChange={(e) => setPaymentConfig({ ...paymentConfig, rocketInstructions: e.target.value })}
                  placeholder="যেমন: রকেট অ্যাপ থেকে Send Money করে ট্রানজেকশন আইডি অ্যাডমিনকে জানান।"
                  className="w-full px-3.5 py-2 border border-slate-300 focus:border-purple-500 rounded-xl text-xs bg-white focus:outline-none transition"
                />
              </div>
            </div>

            {/* Save Button */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>সংরক্ষণ বাটনে ক্লিক করার সাথে সাথে ইউজার পেমেন্ট স্ক্রিনে লাইভ আপডেট হয়ে যাবে।</span>
              </div>

              <button
                type="submit"
                id="admin-save-all-payment-numbers-btn"
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>পেমেন্ট নম্বরসমূহ সেভ ও লাইভ আপডেট করুন</span>
              </button>
            </div>
          </form>

          {/* Interactive Live User Preview (লাইভ ইউজার ভিউ প্রিভিউ) */}
          <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-md space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <h4 className="text-sm font-bold flex items-center gap-2 text-emerald-400">
                  <Eye className="w-4 h-4" />
                  <span>সদস্যদের স্ক্রিনে লাইভ ভিউ প্রিভিউ (Live User Preview)</span>
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  সদস্যরা ফান্ড পেজে বিকাশ, নগদ বা রকেট নির্বাচন করলে ঠিক যেভাবে দেখতে পাবেন:
                </p>
              </div>

              {/* Preview Method Selector */}
              <div className="flex items-center gap-1.5 bg-slate-800 p-1 rounded-xl border border-slate-700">
                <button
                  type="button"
                  onClick={() => setPaymentPreviewTab('bkash')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                    paymentPreviewTab === 'bkash'
                      ? 'bg-pink-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  বিকাশ
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentPreviewTab('nagad')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                    paymentPreviewTab === 'nagad'
                      ? 'bg-orange-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  নগদ
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentPreviewTab('rocket')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                    paymentPreviewTab === 'rocket'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  রকেট
                </button>
              </div>
            </div>

            {/* Preview Display Box */}
            {paymentPreviewTab === 'bkash' && (
              <div className="p-4 rounded-xl bg-pink-950/40 border border-pink-700/60 text-slate-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="px-2.5 py-0.5 rounded bg-pink-600 text-white font-bold text-[11px]">
                      বিকাশ একাউন্ট
                    </span>
                    {paymentConfig.bkashNumber ? (
                      <div className="text-xl font-mono font-black text-pink-300 mt-1.5 tracking-wider">
                        {paymentConfig.bkashNumber}
                      </div>
                    ) : (
                      <div className="text-xs font-semibold text-rose-300 mt-1.5">
                        অ্যাডমিন এখনো বিকাশ নম্বর যুক্ত করেননি (উপরে ইনপুটে নম্বর লিখে সেভ করুন)
                      </div>
                    )}
                  </div>

                  {paymentConfig.bkashNumber && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-pink-600 text-white text-xs font-bold rounded-xl self-start sm:self-auto">
                      <Copy className="w-3.5 h-3.5" />
                      <span>কপি বাটন সক্রিয়</span>
                    </div>
                  )}
                </div>

                <div className="text-xs text-pink-200/80 bg-slate-950/60 p-2.5 rounded-lg border border-pink-900/50">
                  <span className="font-bold text-pink-300">নির্দেশনা: </span>
                  {paymentConfig.bkashInstructions || 'বিকাশ অ্যাপ থেকে Send Money করুন।'}
                </div>
              </div>
            )}

            {paymentPreviewTab === 'nagad' && (
              <div className="p-4 rounded-xl bg-orange-950/40 border border-orange-700/60 text-slate-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="px-2.5 py-0.5 rounded bg-orange-600 text-white font-bold text-[11px]">
                      নগদ একাউন্ট
                    </span>
                    {paymentConfig.nagadNumber ? (
                      <div className="text-xl font-mono font-black text-orange-300 mt-1.5 tracking-wider">
                        {paymentConfig.nagadNumber}
                      </div>
                    ) : (
                      <div className="text-xs font-semibold text-orange-300 mt-1.5">
                        অ্যাডমিন এখনো নগদ নম্বর যুক্ত করেননি (উপরে ইনপুটে নম্বর লিখে সেভ করুন)
                      </div>
                    )}
                  </div>

                  {paymentConfig.nagadNumber && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 text-white text-xs font-bold rounded-xl self-start sm:self-auto">
                      <Copy className="w-3.5 h-3.5" />
                      <span>কপি বাটন সক্রিয়</span>
                    </div>
                  )}
                </div>

                <div className="text-xs text-orange-200/80 bg-slate-950/60 p-2.5 rounded-lg border border-orange-900/50">
                  <span className="font-bold text-orange-300">নির্দেশনা: </span>
                  {paymentConfig.nagadInstructions || 'নগদ অ্যাপ বা *167# ডায়াল করে Send Money করুন।'}
                </div>
              </div>
            )}

            {paymentPreviewTab === 'rocket' && (
              <div className="p-4 rounded-xl bg-purple-950/40 border border-purple-700/60 text-slate-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="px-2.5 py-0.5 rounded bg-purple-600 text-white font-bold text-[11px]">
                      রকেট একাউন্ট
                    </span>
                    {paymentConfig.rocketNumber ? (
                      <div className="text-xl font-mono font-black text-purple-300 mt-1.5 tracking-wider">
                        {paymentConfig.rocketNumber}
                      </div>
                    ) : (
                      <div className="text-xs font-semibold text-purple-300 mt-1.5">
                        অ্যাডমিন এখনো রকেট নম্বর যুক্ত করেননি (উপরে ইনপুটে নম্বর লিখে সেভ করুন)
                      </div>
                    )}
                  </div>

                  {paymentConfig.rocketNumber && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 text-white text-xs font-bold rounded-xl self-start sm:self-auto">
                      <Copy className="w-3.5 h-3.5" />
                      <span>কপি বাটন সক্রিয়</span>
                    </div>
                  )}
                </div>

                <div className="text-xs text-purple-200/80 bg-slate-950/60 p-2.5 rounded-lg border border-purple-900/50">
                  <span className="font-bold text-purple-300">নির্দেশনা: </span>
                  {paymentConfig.rocketInstructions || 'রকেট অ্যাপ থেকে Send Money করে ট্রানজেকশন আইডি দিন।'}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 6: SETTINGS, PERMANENT ADDRESS & BACKUP */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          {/* Organization Profile Settings */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-purple-700" />
              সংগঠনের পরিচিতি ও স্থায়ী ঠিকানা কনফিগারেশন
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              ভবিষ্যতে কোনো কোড না বদলিয়ে অ্যাপের ভেতর থেকেই যেকোনো তথ্য পরিবর্তন করুন।
            </p>

            <form onSubmit={handleSaveProfile} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    সংগঠনের পূর্ণ নাম
                  </label>
                  <input
                    type="text"
                    required
                    value={editProfileData.name}
                    onChange={(e) => setEditProfileData({ ...editProfileData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-purple-500/20 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    প্রতিষ্ঠা সাল / তারিখ (যেমন: ১৫/০৮/২০২২ইং)
                  </label>
                  <input
                    type="text"
                    value={editProfileData.establishedDate || ''}
                    onChange={(e) => setEditProfileData({ ...editProfileData, establishedDate: e.target.value })}
                    placeholder="১৫/০৮/২০২২ইং"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-semibold text-amber-900 focus:ring-2 focus:ring-purple-500/20 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    সংগঠনের মূল বাণী / স্লোগান
                  </label>
                  <input
                    type="text"
                    value={editProfileData.tagline}
                    onChange={(e) => setEditProfileData({ ...editProfileData, tagline: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-purple-500/20 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    স্থায়ী ঠিকানা (Permanent Address) *
                  </label>
                  <input
                    type="text"
                    required
                    value={editProfileData.address}
                    onChange={(e) => setEditProfileData({ ...editProfileData, address: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-purple-500/20 focus:outline-none font-bold text-purple-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    জরুরি হটলাইন
                  </label>
                  <input
                    type="text"
                    value={editProfileData.hotline}
                    onChange={(e) => setEditProfileData({ ...editProfileData, hotline: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-purple-500/20 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    রক্তদান জরুরি যোগাযোগ
                  </label>
                  <input
                    type="text"
                    value={editProfileData.emergencyContact}
                    onChange={(e) => setEditProfileData({ ...editProfileData, emergencyContact: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-purple-500/20 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    রেজিস্ট্রেশন নম্বর
                  </label>
                  <input
                    type="text"
                    value={editProfileData.regNumber}
                    onChange={(e) => setEditProfileData({ ...editProfileData, regNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-purple-500/20 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>সংগঠনের তথ্য সংরক্ষণ করুন</span>
                </button>
              </div>
            </form>
          </div>

          {/* Change Admin PIN */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
              <Key className="w-5 h-5 text-amber-600" />
              এডমিন গোপন পিন কোড পরিবর্তন
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              বর্তমান পিন কোড দিয়ে নতুন যেকোনো পিন কোড সেট করতে পারবেন।
            </p>

            <form onSubmit={handleChangePin} className="space-y-3 max-w-md">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">বর্তমান পিন</label>
                <input
                  type="password"
                  required
                  value={currentPinInput}
                  onChange={(e) => setCurrentPinInput(e.target.value)}
                  placeholder="বর্তমান পিন কোড দিন..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-mono text-center"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">নতুন পিন</label>
                  <input
                    type="password"
                    required
                    value={newPinInput}
                    onChange={(e) => setNewPinInput(e.target.value)}
                    placeholder="৪-৬ ডিজিটের পিন..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-mono text-center"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">নিশ্চিত করুন</label>
                  <input
                    type="password"
                    required
                    value={confirmPinInput}
                    onChange={(e) => setConfirmPinInput(e.target.value)}
                    placeholder="একই পিন পুনরায় দিন..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-mono text-center"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
              >
                পিন কোড আপডেট করুন
              </button>
            </form>
          </div>

          {/* Payment Gateway Settings (bKash, Nagad, Rocket) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-emerald-600" />
                  মাসিক চাঁদা পেমেন্ট গেটওয়ে নম্বর ও তথ্য সেটিংস
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  সদস্যদের চাঁদা ও অনুদান পরিশোধের জন্য বিকাশ, নগদ ও রকেট নম্বরসমূহ সেট করুন বা ফাঁকা করতে মুছুন।
                </p>
              </div>

              <button
                type="button"
                id="admin-clear-all-payments-btn"
                onClick={handleClearAllPaymentNumbers}
                className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 shadow-xs transition flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
                title="এক ক্লিকে সকল পেমেন্ট নম্বর মুছে ফাঁকা করুন"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>সব নম্বর এক ক্লিকে মুছুন / ফাঁকা করুন</span>
              </button>
            </div>

            <form onSubmit={handleSavePaymentSettings} className="space-y-4 pt-1">
              {/* bKash Config */}
              <div className="p-4 bg-pink-50/60 rounded-xl border border-pink-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-pink-900 text-xs flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-pink-600 inline-block" />
                    বিকাশ (bKash) সেটিংস
                  </span>

                  <div className="flex items-center gap-2">
                    {paymentConfig.bkashNumber ? (
                      <>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-pink-200/80 text-pink-900 font-mono">
                          বর্তমান: {paymentConfig.bkashNumber}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleClearSinglePaymentNumber('bkash')}
                          className="text-[11px] font-bold text-rose-600 hover:text-rose-800 bg-rose-100 hover:bg-rose-200 px-2 py-0.5 rounded-md transition flex items-center gap-1 cursor-pointer"
                          title="বিকাশ নম্বর মুছে ফাঁকা করুন"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>নম্বর মুছুন</span>
                        </button>
                      </>
                    ) : (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-200/80 text-slate-600">
                        কোনো নম্বর নেই (ফাঁকা)
                      </span>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      বিকাশ নম্বর (Phone Number)
                    </label>
                    <input
                      type="text"
                      value={paymentConfig.bkashNumber}
                      onChange={(e) => setPaymentConfig({ ...paymentConfig, bkashNumber: e.target.value })}
                      placeholder="যেমন: 018XXXXXXXX (ফাঁকা রাখতে খালি রাখুন)"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono bg-white focus:outline-none focus:ring-2 focus:ring-pink-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">অ্যাকাউন্টের ধরন (Account Type)</label>
                    <select
                      value={paymentConfig.bkashType}
                      onChange={(e) => setPaymentConfig({ ...paymentConfig, bkashType: e.target.value as any })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold bg-white focus:outline-none"
                    >
                      <option value="Personal">Personal (ব্যক্তিগত - Send Money)</option>
                      <option value="Merchant">Merchant (মার্চেন্ট - Payment)</option>
                      <option value="Agent">Agent (এজেন্ট - Cash In)</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">পেমেন্ট নির্দেশনা (Instructions / Note)</label>
                  <input
                    type="text"
                    value={paymentConfig.bkashInstructions || ''}
                    onChange={(e) => setPaymentConfig({ ...paymentConfig, bkashInstructions: e.target.value })}
                    placeholder="যেমন: Send Money করার সময় রেফারেন্সে আপনার নাম বা মেম্বার আইডি লিখুন"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Nagad Config */}
              <div className="p-4 bg-orange-50/60 rounded-xl border border-orange-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-orange-900 text-xs flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-600 inline-block" />
                    নগদ (Nagad) সেটিংস
                  </span>

                  <div className="flex items-center gap-2">
                    {paymentConfig.nagadNumber ? (
                      <>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-orange-200/80 text-orange-900 font-mono">
                          বর্তমান: {paymentConfig.nagadNumber}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleClearSinglePaymentNumber('nagad')}
                          className="text-[11px] font-bold text-rose-600 hover:text-rose-800 bg-rose-100 hover:bg-rose-200 px-2 py-0.5 rounded-md transition flex items-center gap-1 cursor-pointer"
                          title="নগদ নম্বর মুছে ফাঁকা করুন"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>নম্বর মুছুন</span>
                        </button>
                      </>
                    ) : (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-200/80 text-slate-600">
                        কোনো নম্বর নেই (ফাঁকা)
                      </span>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      নগদ নম্বর (Phone Number)
                    </label>
                    <input
                      type="text"
                      value={paymentConfig.nagadNumber}
                      onChange={(e) => setPaymentConfig({ ...paymentConfig, nagadNumber: e.target.value })}
                      placeholder="যেমন: 017XXXXXXXX (ফাঁকা রাখতে খালি রাখুন)"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">অ্যাকাউন্টের ধরন (Account Type)</label>
                    <select
                      value={paymentConfig.nagadType}
                      onChange={(e) => setPaymentConfig({ ...paymentConfig, nagadType: e.target.value as any })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold bg-white focus:outline-none"
                    >
                      <option value="Personal">Personal (ব্যক্তিগত - Send Money)</option>
                      <option value="Merchant">Merchant (মার্চেন্ট - Payment)</option>
                      <option value="Agent">Agent (এজেন্ট - Cash In)</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">পেমেন্ট নির্দেশনা (Instructions / Note)</label>
                  <input
                    type="text"
                    value={paymentConfig.nagadInstructions || ''}
                    onChange={(e) => setPaymentConfig({ ...paymentConfig, nagadInstructions: e.target.value })}
                    placeholder="যেমন: নগদ Send Money বা ক্যাশ ইন করে TrxID সংরক্ষণ করুন"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Rocket Config */}
              <div className="p-4 bg-purple-50/60 rounded-xl border border-purple-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-purple-900 text-xs flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-600 inline-block" />
                    রকেট (Rocket) সেটিংস
                  </span>

                  <div className="flex items-center gap-2">
                    {paymentConfig.rocketNumber ? (
                      <>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-200/80 text-purple-900 font-mono">
                          বর্তমান: {paymentConfig.rocketNumber}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleClearSinglePaymentNumber('rocket')}
                          className="text-[11px] font-bold text-rose-600 hover:text-rose-800 bg-rose-100 hover:bg-rose-200 px-2 py-0.5 rounded-md transition flex items-center gap-1 cursor-pointer"
                          title="রকেট নম্বর মুছে ফাঁকা করুন"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>নম্বর মুছুন</span>
                        </button>
                      </>
                    ) : (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-200/80 text-slate-600">
                        কোনো নম্বর নেই (ফাঁকা)
                      </span>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      রকেট নম্বর (Phone Number with Check Digit)
                    </label>
                    <input
                      type="text"
                      value={paymentConfig.rocketNumber}
                      onChange={(e) => setPaymentConfig({ ...paymentConfig, rocketNumber: e.target.value })}
                      placeholder="যেমন: 019XXXXXXXXX (ফাঁকা রাখতে খালি রাখুন)"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">অ্যাকাউন্টের ধরন (Account Type)</label>
                    <select
                      value={paymentConfig.rocketType}
                      onChange={(e) => setPaymentConfig({ ...paymentConfig, rocketType: e.target.value as any })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold bg-white focus:outline-none"
                    >
                      <option value="Personal">Personal (ব্যক্তিগত - Send Money)</option>
                      <option value="Merchant">Merchant (মার্চেন্ট - Payment)</option>
                      <option value="Agent">Agent (এজেন্ট - Cash In)</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">পেমেন্ট নির্দেশনা (Instructions / Note)</label>
                  <input
                    type="text"
                    value={paymentConfig.rocketInstructions || ''}
                    onChange={(e) => setPaymentConfig({ ...paymentConfig, rocketInstructions: e.target.value })}
                    placeholder="যেমন: রকেট সেন্ড মানি করে ট্রানজেকশন আইডি অ্যাডমিনকে জানান"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleClearAllPaymentNumbers}
                  className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 font-bold text-xs rounded-xl border border-slate-200 hover:border-rose-200 transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>সব নম্বর মুছে ফাঁকা করুন (Clear All)</span>
                </button>

                <button
                  type="submit"
                  id="admin-save-payments-btn"
                  onClick={(e) => handleSaveSettings(e)}
                  className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>পেমেন্ট নম্বরসমূহ সংরক্ষণ করুন (Save / Update)</span>
                </button>
              </div>
            </form>
          </div>

          {/* SUPABASE CLOUD DATABASE & PERSISTENT STORAGE */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Cloud className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    Supabase ক্লাউড ডাটাবেজ ও পারমানেন্ট ব্যাকআপ
                  </h3>
                  <p className="text-xs text-slate-500">
                    ব্রাউজার Clear Data করলেও ক্লাউড ডাটাবেজ থেকে তথ্য কখনো মুছে যাবে না
                  </p>
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={checkSupabaseLiveStatus}
                  disabled={isCheckingSupabase}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition flex items-center gap-1 cursor-pointer"
                  title="স্ট্যাটাস রিফ্রেশ করুন"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isCheckingSupabase ? 'animate-spin text-emerald-600' : ''}`} />
                  <span>রিফ্রেশ</span>
                </button>

                {supabaseStatus?.connected && supabaseStatus?.tableExists ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                    ক্লাউড সক্রিয় ও সংযুক্ত
                  </span>
                ) : supabaseStatus?.connected && !supabaseStatus?.tableExists ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                    টেবিল তৈরি প্রয়োজন
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                    <Server className="w-3.5 h-3.5 text-slate-500" />
                    লোকাল সার্ভার সক্রিয়
                  </span>
                )}
              </div>
            </div>

            {/* Status explanation alert */}
            {supabaseStatus && (
              <div
                className={`p-3.5 rounded-xl text-xs flex items-start gap-2.5 ${
                  supabaseStatus.connected && supabaseStatus.tableExists
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                    : supabaseStatus.connected && !supabaseStatus.tableExists
                    ? 'bg-amber-50 border border-amber-200 text-amber-900'
                    : 'bg-slate-50 border border-slate-200 text-slate-700'
                }`}
              >
                {supabaseStatus.connected && supabaseStatus.tableExists ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : supabaseStatus.connected ? (
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                ) : (
                  <Database className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <span className="font-semibold">{supabaseStatus.message}</span>
                  {supabaseStatus.connected && supabaseStatus.tableExists && (
                    <div className="mt-1 text-[11px] text-emerald-700">
                      ✅ এডমিন প্যানেল থেকে যেকোনো তথ্য অ্যাড, এডিট বা ডিলিট করলে তা সরাসরি এবং স্থায়ীভাবে Supabase এ সেভ হচ্ছে।
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Config Form */}
            <form onSubmit={handleSaveSupabase} className="space-y-3 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Supabase Project URL *
                  </label>
                  <input
                    type="url"
                    value={supabaseUrlInput}
                    onChange={(e) => setSupabaseUrlInput(e.target.value)}
                    placeholder="https://xyzabcdef.supabase.co"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono bg-white focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
                    required
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Supabase Dashboard {'>'} Project Settings {'>'} API থেকে URL কপি করুন
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Supabase API Key (Anon / Service Key) *
                  </label>
                  <input
                    type="password"
                    value={supabaseKeyInput}
                    onChange={(e) => setSupabaseKeyInput(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono bg-white focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
                    required
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Project Settings {'>'} API {'>'} anon public বা service_role কী
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={isSavingSupabase}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{isSavingSupabase ? 'যাচাই ও সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ ও কানেক্ট করুন'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowSqlModal(!showSqlModal)}
                    className="px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs rounded-xl border border-purple-200 transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Code className="w-3.5 h-3.5" />
                    <span>{showSqlModal ? 'SQL কোড লুকান' : 'SQL টেবিল স্ক্রিপ্ট দেখুন'}</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePushAllToCloud}
                    disabled={isSyncingCloud}
                    className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl border border-blue-200 transition flex items-center gap-1.5 cursor-pointer"
                    title="বর্তমান সকল মেম্বার, ডোনার ও নোটিশ ক্লাউডে আপলোড করুন"
                  >
                    <Cloud className="w-3.5 h-3.5" />
                    <span>{isSyncingCloud ? 'সিঙ্ক হচ্ছে...' : 'ক্লাউডে ডেটা সিঙ্ক করুন'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handlePullAllFromCloud}
                    disabled={isSyncingCloud}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition flex items-center gap-1.5 cursor-pointer"
                    title="সুপাবেজ থেকে রিয়েল-টাইম ডেটা ফেচ করে অ্যাপ রিফ্রেশ করুন"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>ক্লাউড থেকে ফেচ করুন</span>
                  </button>
                </div>
              </div>
            </form>

            {/* SQL Table Creation Accordion / Helper */}
            {showSqlModal && (
              <div className="mt-3 p-4 bg-slate-900 rounded-xl text-slate-100 text-xs font-mono space-y-2 border border-slate-700">
                <div className="flex items-center justify-between text-slate-300 pb-2 border-b border-slate-800">
                  <span className="font-sans font-bold text-xs text-emerald-400 flex items-center gap-1.5">
                    <Database className="w-4 h-4" />
                    Supabase SQL Editor এ রান করার স্ক্রিপ্ট (১ ক্লিকে টেবিল তৈরি)
                  </span>
                  <button
                    type="button"
                    onClick={handleCopySqlScript}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-[11px] font-sans font-bold flex items-center gap-1 transition cursor-pointer"
                  >
                    {copiedSql ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedSql ? 'কপি হয়েছে!' : 'SQL কোড কপি করুন'}</span>
                  </button>
                </div>

                <pre className="text-[11px] leading-relaxed text-emerald-200 overflow-x-auto p-2 bg-slate-950/60 rounded-lg">
{`-- ১. প্রধান কি-ভ্যালু ডাটাবেজ টেবিল
CREATE TABLE IF NOT EXISTS organization_data (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE organization_data ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Full Access" ON organization_data;
CREATE POLICY "Public Full Access" ON organization_data FOR ALL USING (true) WITH CHECK (true);

-- ২. মানবিক কার্যক্রম বিবরণী টেবিল (সরাসরি রেকর্ড ম্যানেজমেন্ট ও পার্মানেন্ট ডিলিট)
CREATE TABLE IF NOT EXISTS humanitarian_activities (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  items_given TEXT,
  cost NUMERIC DEFAULT 0,
  handled_by TEXT,
  recipient_name TEXT,
  recipient_photo_url TEXT,
  date TEXT,
  location TEXT,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE humanitarian_activities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Activities Public Access" ON humanitarian_activities;
CREATE POLICY "Activities Public Access" ON humanitarian_activities FOR ALL USING (true) WITH CHECK (true);`}
                </pre>

                <p className="text-[11px] text-slate-400 font-sans pt-1">
                  💡 <strong>সহজ ধাপ:</strong> Supabase ড্যাশবোর্ডে গিয়ে বামের <strong>SQL Editor</strong> মেনুতে ক্লিক করুন, &quot;New Query&quot; এ উপরের কোডটি পেস্ট করে &quot;Run&quot; চাপুন।
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: HOMEPAGE SETTINGS */}
      {activeTab === 'homepage' && (
        <Suspense fallback={
          <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-slate-200">
            <div className="w-8 h-8 border-3 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mb-2" />
            <span className="text-xs font-semibold text-slate-500">হোমপেজ সেটিংস লোড হচ্ছে...</span>
          </div>
        }>
          <AdminHomePageManager
            slides={homeSlides}
            onUpdateSlides={onUpdateHomeSlides || (() => {})}
            activities={humanitarianActivities}
            onUpdateActivities={onUpdateHumanitarianActivities || (() => {})}
            rules={organizationRules}
            onUpdateRules={onUpdateOrganizationRules || (() => {})}
            profile={profile}
            onUpdateProfile={onUpdateProfile || (() => {})}
            calendarBanners={calendarBanners}
            onUpdateCalendarBanners={onUpdateCalendarBanners}
            notifySuccess={notifySuccess}
            notifyError={notifyError}
          />
        </Suspense>
      )}

      {/* MEMBER MODAL (Add / Edit) */}
      {(isAddMemberOpen || editingMember) && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                {memberIsExpatriateInput ? (
                  <Globe className="w-5 h-5 text-blue-600" />
                ) : (
                  <Users className="w-5 h-5 text-emerald-600" />
                )}
                {editingMember 
                  ? (memberIsExpatriateInput ? 'প্রবাসী সদস্যের তথ্য সম্পাদনা (Edit)' : 'সদস্যের তথ্য সম্পাদনা (Edit)')
                  : (memberIsExpatriateInput ? 'নতুন প্রবাসী সদস্য যুক্তকরণ (Add)' : 'নতুন সদস্য যুক্তকরণ (Add)')}
              </h3>
              <button
                onClick={() => { setIsAddMemberOpen(false); setEditingMember(null); }}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Member Category Switcher */}
            <div className="flex items-center p-1 bg-slate-100 rounded-xl mt-3.5">
              <button
                type="button"
                onClick={() => {
                  setMemberIsExpatriateInput(false);
                  if (!memberAreaInput || memberAreaInput === 'প্রবাসী') {
                    setMemberAreaInput('পতেঙ্গা, চট্টগ্রাম');
                  }
                }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  !memberIsExpatriateInput ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Users className="w-3.5 h-3.5 text-emerald-600" />
                <span>সাধারণ সদস্য</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMemberIsExpatriateInput(true);
                  if (memberAreaInput === 'পতেঙ্গা, চট্টগ্রাম') {
                    setMemberAreaInput('');
                  }
                }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  memberIsExpatriateInput ? 'bg-white text-blue-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Globe className="w-3.5 h-3.5 text-blue-600" />
                <span>প্রবাসী সদস্য</span>
              </button>
            </div>

            <form onSubmit={handleSaveMember} className="space-y-3 mt-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">পূর্ণ নাম (Name) *</label>
                <input
                  type="text"
                  name="name"
                  required
                  value={memberNameInput}
                  onChange={(e) => setMemberNameInput(e.target.value)}
                  placeholder="যেমন: মোহাম্মদ সাহেদুল আলম"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                    <span>পদবি (Designation) *</span>
                    <span className="text-[10px] text-blue-600 font-medium">পদবি অনুযায়ী স্বয়ংক্রিয় শ্রেণিবিভাগ</span>
                  </label>
                  <input
                    type="text"
                    name="designation"
                    required
                    value={memberDesignationInput}
                    onChange={(e) => setMemberDesignationInput(e.target.value)}
                    placeholder="যেমন: সাধারণ সম্পাদক / সভাপতি / সদস্য"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:outline-none font-medium"
                  />
                  {/* Quick Designation Presets */}
                  <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                    {['সদস্য', 'সভাপতি', 'সাধারণ সম্পাদক', 'সহ-সভাপতি', 'সাংগঠনিক সম্পাদক', 'কোষাধ্যক্ষ', 'সহ-ক্রীড়া সম্পাদক', 'উপদেষ্টা'].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setMemberDesignationInput(preset)}
                        className={`text-[10px] px-2 py-0.5 rounded-md border transition cursor-pointer ${
                          memberDesignationInput === preset
                            ? 'bg-blue-100 text-blue-800 border-blue-300 font-bold'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">মোবাইল নম্বর (Phone) *</label>
                  <input
                    type="text"
                    name="phone"
                    required
                    value={memberPhoneInput}
                    onChange={(e) => setMemberPhoneInput(e.target.value)}
                    placeholder="01811-XXXXXX"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  />
                </div>
              </div>

              {/* Dynamic Designation-Based Auto-Classification Card */}
              {(() => {
                const isExec = isExecutiveCommitteeMember({ designation: memberDesignationInput });
                return (
                  <div className={`p-2.5 rounded-xl border flex items-center justify-between gap-2.5 transition ${
                    isExec 
                      ? 'bg-purple-50/80 border-purple-200 text-purple-900' 
                      : 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                  }`}>
                    <div className="flex items-center gap-2 min-w-0">
                      {isExec ? (
                        <ShieldCheck className="w-4 h-4 text-purple-600 shrink-0" />
                      ) : (
                        <Users className="w-4 h-4 text-emerald-600 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <div className="text-xs font-bold flex items-center gap-1.5 flex-wrap">
                          <span>স্বয়ংক্রিয় শ্রেণিবিভাগ:</span>
                          <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                            isExec ? 'bg-purple-200 text-purple-900' : 'bg-emerald-200 text-emerald-900'
                          }`}>
                            {isExec ? 'কার্যকরী কমিটি (Executive Committee)' : 'সাধারণ সদস্য (General Member)'}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-600 mt-0.5 leading-tight">
                          {isExec 
                            ? "পদবিতে 'সদস্য' না থাকায় ইনি স্বয়ংক্রিয়ভাবে কার্যকরী কমিটির মিটিং ও যৌথ সাধারণ সভা উভয় এসএমএস তালিকায় অন্তর্ভুক্ত হবেন।" 
                            : "পদবিতে 'সদস্য' থাকায় ইনি সাধারণ সদস্য হিসেবে শ্রেণিভুক্ত এবং যৌথ সাধারণ সভার এসএমএসে অন্তর্ভুক্ত হবেন।"}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Expatriate Country / Status Title Input (Blank by default, manual input) */}
              {memberIsExpatriateInput && (
                <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200 space-y-1">
                  <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-blue-600" />
                      <span>প্রবাসী দেশ / স্ট্যাটাস টাইটেল (Country / Status Title)</span>
                    </span>
                    <span className="text-[10px] text-blue-700 font-semibold">ঐচ্ছিক / টাইপ করুন</span>
                  </label>
                  <input
                    type="text"
                    name="countryStatus"
                    value={memberCountryStatusInput}
                    onChange={(e) => setMemberCountryStatusInput(e.target.value)}
                    placeholder="যেমন: সৌদি প্রবাসী, দুবাই প্রবাসী, কাতার প্রবাসী"
                    className="w-full px-3 py-2 border border-blue-200 focus:border-blue-500 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:outline-none bg-white font-medium"
                  />
                  <p className="text-[10px] text-slate-500 leading-tight pt-0.5">
                    প্রবাসীর দেশ বা অবস্থান অনুযায়ী পদবি বা টাইটেল টাইপ করুন (যেমন: সৌদি প্রবাসী, দুবাই প্রবাসী ইত্যাদি)। কোনো ডিফল্ট মান রাখা হয়নি।
                  </p>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {memberIsExpatriateInput ? 'কর্মস্থল / বর্তমান ঠিকানা বা এলাকা (ঐচ্ছিক)' : 'এলাকা / ঠিকানা (Area)'}
                </label>
                <input
                  type="text"
                  name="area"
                  value={memberAreaInput}
                  onChange={(e) => setMemberAreaInput(e.target.value)}
                  placeholder={memberIsExpatriateInput ? 'যেমন: রিয়াদ, সৌদি আরব / দুবাই' : 'যেমন: কাঠগড়, পতেঙ্গা, চট্টগ্রাম'}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span>সদস্যের ছবি (মোবাইল গ্যালারি থেকে আপলোড)</span>
                  <span className="text-[11px] text-slate-400 font-normal">ঐচ্ছিক</span>
                </label>
                <input
                  type="file"
                  id="admin-member-photo-picker"
                  accept="image/*"
                  onChange={handleMemberPhotoSelect}
                  className="hidden"
                />

                {memberPhotoBase64 ? (
                  <div className="flex items-center gap-3.5 bg-blue-50/70 p-3 rounded-2xl border border-blue-200">
                    <div className="w-14 h-14 rounded-2xl border-2 border-blue-500 overflow-hidden flex-shrink-0 bg-white shadow-xs">
                      <img 
                        src={memberPhotoBase64} 
                        alt="Member Preview" 
                        className="w-full h-full object-cover" 
                      />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900">
                        <Check className="w-3.5 h-3.5 text-blue-600" />
                        <span>গ্যালারি থেকে ছবি সিলেক্ট করা হয়েছে</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => document.getElementById('admin-member-photo-picker')?.click()}
                          className="px-2.5 py-1 bg-white hover:bg-blue-100 text-blue-800 text-xs font-bold rounded-lg border border-blue-300 transition flex items-center gap-1 cursor-pointer"
                        >
                          <Camera className="w-3 h-3" />
                          <span>পরিবর্তন</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setMemberPhotoBase64('')}
                          className="px-2.5 py-1 bg-white hover:bg-rose-50 text-rose-600 text-xs font-bold rounded-lg border border-rose-200 transition cursor-pointer"
                        >
                          মুছুন
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => document.getElementById('admin-member-photo-picker')?.click()}
                    className="w-full py-3.5 px-4 border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl bg-slate-50 hover:bg-blue-50/40 text-slate-600 hover:text-blue-800 transition flex flex-col items-center justify-center gap-1 cursor-pointer group"
                  >
                    <div className="w-8 h-8 rounded-full bg-white shadow-2xs border border-slate-200 group-hover:border-blue-300 flex items-center justify-center text-blue-600">
                      <Upload className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-800 group-hover:text-blue-700">
                      মোবাইল গ্যালারি থেকে ছবি নির্বাচন করুন
                    </span>
                    <span className="text-[10px] text-slate-400">
                      ট্যাপ করে গ্যালারি থেকে ছবি নিন (JPG, PNG, WEBP)
                    </span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">যোগদানের তারিখ</label>
                  <input
                    type="date"
                    name="joinDate"
                    value={memberJoinDateInput}
                    onChange={(e) => setMemberJoinDateInput(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">সদস্য পদ স্ট্যাটাস</label>
                  <select
                    name="status"
                    value={memberStatusInput}
                    onChange={(e) => setMemberStatusInput(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-bold bg-white"
                  >
                    <option value="সক্রিয়">সক্রিয়</option>
                    <option value="স্থগিত">স্থগিত</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => { setIsAddMemberOpen(false); setEditingMember(null); }}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  id="admin-save-member-btn"
                  onClick={(e) => handleSaveMember(e)}
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{editingMember ? 'আপডেট করুন' : 'সংরক্ষণ করুন'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BLOOD DONOR MODAL (Add / Edit) */}
      {(isAddDonorOpen || editingDonor) && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Droplet className="w-5 h-5 text-rose-600" />
                {editingDonor ? 'রক্তদাতার তথ্য সম্পাদনা (Edit)' : 'নতুন রক্তদাতা নিবন্ধন (Add)'}
              </h3>
              <button
                onClick={() => { setIsAddDonorOpen(false); setEditingDonor(null); }}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDonor} className="space-y-3 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">রক্তদাতার নাম *</label>
                <input
                  type="text"
                  name="name"
                  required
                  defaultValue={editingDonor?.name || ''}
                  placeholder="যেমন: কাজী আরমানুল হক"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-rose-500/20 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">মোবাইল নম্বর *</label>
                  <input
                    type="text"
                    name="phone"
                    required
                    defaultValue={editingDonor?.phone || ''}
                    placeholder="01819-XXXXXX"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-rose-500/20 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">রক্তের গ্রুপ *</label>
                  <select
                    name="bloodGroup"
                    defaultValue={editingDonor?.bloodGroup || 'A+'}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-bold text-rose-700 bg-white"
                  >
                    {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">সর্বশেষ রক্তদানের তারিখ</label>
                <input
                  type="date"
                  name="lastDonationDate"
                  defaultValue={editingDonor?.lastDonationDate || ''}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none"
                />
                <p className="mt-1 text-[11px] text-slate-500">
                  * রক্তদানের তারিখ দিলে পরবর্তী সম্ভাব্য উপযুক্ত তারিখ ব্যাকগ্রাউন্ডে স্বয়ংক্রিয়ভাবে ৬ মাস (১৮০ দিন) পর নির্ধারণ হবে।
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">এলাকা</label>
                  <input
                    type="text"
                    name="area"
                    defaultValue={editingDonor?.area || 'পতেঙ্গা, চট্টগ্রাম'}
                    placeholder="যেমন: পতেঙ্গা সী-বীচ রোড"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">মোট রক্তদান সংখ্যা</label>
                  <input
                    type="number"
                    name="totalDonations"
                    defaultValue={editingDonor?.totalDonations || 1}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => { setIsAddDonorOpen(false); setEditingDonor(null); }}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs"
                >
                  {editingDonor ? 'আপডেট করুন' : 'সংরক্ষণ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK LOG DONATION MODAL */}
      {loggingDonationDonor && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-200 animate-scaleUp">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              রক্তদান সম্পন্ন রেকর্ড করুন
            </h3>
            <p className="text-xs text-slate-600 mb-4">
              <strong>{loggingDonationDonor.name}</strong> ({loggingDonationDonor.bloodGroup}) এর রক্তদানের তারিখ লিপিবদ্ধ করুন (স্বয়ংক্রিয়ভাবে ৬ মাস / ১৮০ দিন পর পরবর্তী তারিখ নির্ধারিত হবে)।
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const dDate = (e.currentTarget.elements.namedItem('donationDate') as HTMLInputElement).value;
                handleQuickLogDonation(loggingDonationDonor.id, dDate);
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">রক্তদানের তারিখ</label>
                <input
                  type="date"
                  name="donationDate"
                  required
                  defaultValue={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setLoggingDonationDonor(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs"
                >
                  লিপিবদ্ধ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FUND MODAL (Add / Edit) */}
      {(isAddFundOpen || editingFund) && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Wallet className="w-5 h-5 text-teal-600" />
                {editingFund ? 'ফান্ড এন্ট্রি সম্পাদনা (Edit)' : 'নতুন চাঁদা / ফান্ড এন্ট্রি (Add)'}
              </h3>
              <button
                onClick={() => { setIsAddFundOpen(false); setEditingFund(null); }}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFund} className="space-y-3 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">সদস্য বা বিবরণ *</label>
                <input
                  type="text"
                  name="memberName"
                  required
                  value={fundFormMemberName}
                  onChange={(e) => {
                    const name = e.target.value;
                    setFundFormMemberName(name);
                    if (!fundFormPhone) {
                      const matched = resolveMemberPhone({ memberName: name }, members);
                      if (matched) setFundFormPhone(matched);
                    }
                  }}
                  placeholder="যেমন: মোহাম্মদ সাহেদুল আলম"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500/20 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">টাকার পরিমাণ (৳) *</label>
                  <input
                    type="number"
                    name="amount"
                    required
                    value={fundFormAmount}
                    onChange={(e) => setFundFormAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="1000"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-mono focus:outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">স্ট্যাটাস *</label>
                  <select
                    name="status"
                    value={fundFormStatus}
                    onChange={(e) => {
                      const newStatus = e.target.value as PaymentStatus;
                      setFundFormStatus(newStatus);
                      if (newStatus === 'Due') {
                        const parsed = extractArrearsMonthCount({
                          month: fundFormMonth,
                          notes: fundFormNotes,
                          amount: fundFormAmount
                        });
                        if (parsed.monthCount > 1) {
                          setFundArrearsMonthCount(parsed.monthCount);
                          setFundPastMonthsText(parsed.pastMonthsText);
                        }
                      }
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-bold bg-white"
                  >
                    <option value="Paid">Paid (পরিশোধিত)</option>
                    <option value="Pending">Pending (অপেক্ষমান যাচাই)</option>
                    <option value="Due">Due (বকেয়া)</option>
                    <option value="Expense">Expense (সংগঠনের খরচ)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">মাস / সাল</label>
                  <input
                    type="text"
                    name="month"
                    value={fundFormMonth}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFundFormMonth(val);
                      if (fundFormStatus === 'Due') {
                        const parsed = extractArrearsMonthCount({ month: val });
                        if (parsed.monthCount > 1) {
                          setFundArrearsMonthCount(parsed.monthCount);
                          setFundPastMonthsText(parsed.pastMonthsText);
                        }
                      }
                    }}
                    placeholder="যেমন: মার্চ ২০২৬"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">ফোন নম্বর (ঐচ্ছিক)</label>
                  <input
                    type="tel"
                    name="phone"
                    value={fundFormPhone}
                    onChange={(e) => setFundFormPhone(e.target.value)}
                    placeholder="01811-XXXXXX"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-mono focus:outline-none"
                  />
                </div>
              </div>

              {/* Due Status Arrears Months Selection */}
              {fundFormStatus === 'Due' && (
                <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      <span>বকেয়া মাসের সংখ্যা ও রিমাইন্ডার হিসাব</span>
                    </label>
                    <span className="text-[10px] font-bold text-amber-800 bg-white px-2 py-0.5 rounded-full border border-amber-300">
                      {fundArrearsMonthCount === 1 ? '১ মাস (রানিং)' : `মোট ${toBengaliNumber(fundArrearsMonthCount)} মাস`}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        বকেয়া মাস নির্বাচন
                      </label>
                      <select
                        value={fundArrearsMonthCount}
                        onChange={(e) => {
                          const count = Number(e.target.value);
                          setFundArrearsMonthCount(count);
                          if (count > 1) {
                            setFundPastMonthsText(toBengaliNumber(count - 1));
                          } else {
                            setFundPastMonthsText('');
                          }
                        }}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white font-bold focus:outline-none"
                      >
                        <option value={1}>১ মাস (শুধুমাত্র রানিং মাস)</option>
                        {ARREARS_MONTH_OPTIONS.filter(n => n > 1).map(n => (
                          <option key={n} value={n}>
                            {toBengaliNumber(n)} মাস (রানিং + গত {toBengaliNumber(n - 1)} মাস)
                          </option>
                        ))}
                        {!ARREARS_MONTH_OPTIONS.includes(fundArrearsMonthCount) && fundArrearsMonthCount > 1 && (
                          <option value={fundArrearsMonthCount}>
                            {toBengaliNumber(fundArrearsMonthCount)} মাস (রানিং + গত {toBengaliNumber(fundArrearsMonthCount - 1)} মাস)
                          </option>
                        )}
                      </select>
                    </div>

                    {fundArrearsMonthCount > 1 && (
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          অতীত মাসের সংখ্যা / নাম
                        </label>
                        <input
                          type="text"
                          value={fundPastMonthsText}
                          onChange={(e) => setFundPastMonthsText(e.target.value)}
                          placeholder={toBengaliNumber(fundArrearsMonthCount - 1)}
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none font-medium"
                          title="টেমপ্লেটে 'গত [Months] মাস সহ' হিসেবে প্রদর্শিত হবে"
                        />
                      </div>
                    )}
                  </div>

                  <p className="text-[11px] text-amber-900 leading-relaxed bg-amber-100/70 p-2 rounded-lg">
                    {fundArrearsMonthCount === 1 ? (
                      <span>ℹ️ ১ মাস বকেয়া থাকায় রানিং মাসের সিঙ্গেল টেমপ্লেট প্রযোজ্য হবে।</span>
                    ) : (
                      <span>ℹ️ ১ মাসের বেশি বকেয়া থাকায় রানিং মাস এবং গত <strong>{fundPastMonthsText || toBengaliNumber(fundArrearsMonthCount - 1)}</strong> মাস সহ বকেয়া টেমপ্লেট প্রযোজ্য হবে।</span>
                    )}
                  </p>
                </div>
              )}

              {/* Live Direct SIM SMS Message Preview */}
              {(fundFormStatus === 'Paid' || fundFormStatus === 'Due') && currentAdminFundSmsPreview && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                    <span className="flex items-center gap-1.5 text-teal-800">
                      <MessageSquare className="w-3.5 h-3.5 text-teal-600" />
                      <span>মেসেজ প্রিভিউ (Direct SIM SMS):</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {currentAdminFundSmsPreview.length} অক্ষর
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed font-sans bg-white p-2.5 rounded-lg border border-slate-200 select-all shadow-2xs">
                    {currentAdminFundSmsPreview}
                  </p>
                </div>
              )}

              {/* In-Modal Feedback Notice */}
              {fundModalSmsNotice && (
                <div className="p-2.5 bg-teal-50 text-teal-800 text-xs font-bold rounded-xl border border-teal-200 flex items-center justify-between animate-fadeIn">
                  <span>✓ {fundModalSmsNotice}</span>
                  <button type="button" onClick={() => setFundModalSmsNotice(null)} className="text-teal-600 hover:text-teal-800 font-bold ml-2">✕</button>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">নোট / মন্তব্য</label>
                <input
                  type="text"
                  name="notes"
                  value={fundFormNotes}
                  onChange={(e) => setFundFormNotes(e.target.value)}
                  placeholder="যেমন: নগদ / বিকাশ মারফত জমা"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleSendDirectSmsFromAdminModal}
                  id="admin-fund-send-sms-btn"
                  className="px-3.5 py-2 text-xs font-bold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-300 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
                  title="সরাসরি মোবাইলের SIM SMS অ্যাপে মেসেজ পাঠান"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-teal-600" />
                  <span>এসএমএস পাঠান</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setIsAddFundOpen(false); setEditingFund(null); }}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-xs transition"
                >
                  {editingFund ? 'আপডেট করুন' : 'সংরক্ষণ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EXPENSE MODAL (Add / Edit) */}
      {isExpenseModalOpen && (
        <Suspense fallback={null}>
          <ExpenseModal
            isOpen={isExpenseModalOpen}
            onClose={() => {
              setIsExpenseModalOpen(false);
              setEditingExpense(null);
            }}
            onSubmit={handleSaveExpense}
            onSave={handleSaveExpense}
            initialData={
              editingExpense
                ? {
                    description: editingExpense.description || '',
                    amount: editingExpense.amount,
                    disbursedTo: editingExpense.disbursedTo || editingExpense.memberName,
                    date: editingExpense.date,
                    category: editingExpense.category || 'ত্রাণ ও খাদ্য সহায়তা',
                    voucherNo: editingExpense.notes?.includes('ভাউচার:')
                      ? editingExpense.notes.split('ভাউচার:')[1].split('-')[0].trim()
                      : '',
                    notes: editingExpense.notes?.includes('ভাউচার:')
                      ? (editingExpense.notes.split(' - ').length > 1 ? editingExpense.notes.split(' - ').slice(1).join(' - ').trim() : '')
                      : (editingExpense.notes || '')
                  }
                : null
            }
          />
        </Suspense>
      )}

      {/* NOTICE MODAL (Add / Edit) with Dynamic Meeting Templates */}
      {(isAddNoticeOpen || editingNotice) && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-xl border border-slate-200 animate-scaleUp my-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <BellRing className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingNotice ? 'নোটিশ সম্পাদনা (Edit Notice)' : 'নতুন নোটিশ ও বিজ্ঞপ্তি প্রকাশ'}
                  </h3>
                  <p className="text-[11px] text-slate-500">সিলেট মানবসেবা সংগঠন • নোটিশ বোর্ড</p>
                </div>
              </div>
              <button
                onClick={() => { setIsAddNoticeOpen(false); setEditingNotice(null); }}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNotice} className="space-y-4 mt-4">
              {/* Meeting Category Selection */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-800">
                  নোটিশের ধরন / ক্যাটাগরি বাছাই করুন *
                </label>
                
                {/* Two Distinct Meeting Category Options */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleNoticeCategoryChange('কার্যকরী কমিটির মিটিং')}
                    className={`flex items-start gap-2.5 p-3 rounded-xl border text-left transition cursor-pointer ${
                      noticeModalCategory === 'কার্যকরী কমিটির মিটিং'
                        ? 'bg-purple-50/80 border-purple-400 ring-2 ring-purple-400/20 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-purple-200 hover:bg-purple-50/30'
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                      noticeModalCategory === 'কার্যকরী কমিটির মিটিং'
                        ? 'bg-purple-600 text-white'
                        : 'bg-purple-100 text-purple-700'
                    }`}>
                      <Users className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        কার্যকরী কমিটির মিটিং
                      </div>
                      <div className="text-[11px] text-slate-500 leading-tight mt-0.5">
                        Executive Committee Meeting (নির্দিষ্ট টেমপ্লেট)
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleNoticeCategoryChange('কার্যকরী কমিটি ও সাধারণ সদস্য উভয়ের মিটিং')}
                    className={`flex items-start gap-2.5 p-3 rounded-xl border text-left transition cursor-pointer ${
                      noticeModalCategory === 'কার্যকরী কমিটি ও সাধারণ সদস্য উভয়ের মিটিং'
                        ? 'bg-indigo-50/80 border-indigo-400 ring-2 ring-indigo-400/20 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-indigo-200 hover:bg-indigo-50/30'
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                      noticeModalCategory === 'কার্যকরী কমিটি ও সাধারণ সদস্য উভয়ের মিটিং'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-indigo-100 text-indigo-700'
                    }`}>
                      <Users className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        কার্যকরী কমিটি ও সাধারণ সদস্য উভয়ের মিটিং
                      </div>
                      <div className="text-[11px] text-slate-500 leading-tight mt-0.5">
                        Joint Meeting (উভয় সদস্যদের জন্য যৌথ সভা)
                      </div>
                    </div>
                  </button>
                </div>

                {/* Other standard categories */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[11px] text-slate-500 font-semibold mr-1">অন্যান্য নোটিশ:</span>
                  {[
                    { id: 'সাধারণ', label: 'সাধারণ নোটিশ' },
                    { id: 'জরুরি', label: 'জরুরি নোটিশ' },
                    { id: 'রক্তদান', label: 'রক্তদান ক্যাম্প' },
                    { id: 'ত্রাণ', label: 'ত্রাণ ও সেবা' }
                  ].map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleNoticeCategoryChange(c.id)}
                      className={`text-[11px] px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
                        noticeModalCategory === c.id
                          ? 'bg-slate-800 text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* If meeting category is selected, render Dynamic Meeting Input Form */}
              {(noticeModalCategory === 'কার্যকরী কমিটির মিটিং' || noticeModalCategory === 'কার্যকরী কমিটি ও সাধারণ সদস্য উভয়ের মিটিং') && (
                <MeetingNoticeForm
                  meetingType={noticeModalCategory as any}
                  fields={noticeMeetingFields}
                  onChange={handleNoticeMeetingFieldsChange}
                  onReset={() => {
                    const todayIso = new Date().toISOString().split('T')[0];
                    const resetFields: MeetingFields = {
                      date: formatBengaliMeetingDate(todayIso),
                      day: getBengaliDayFromDate(todayIso),
                      time: '৮:৩০ মিনিট',
                      location: 'সংগঠনের কার্যালয়',
                      contactNumber: '01886122678'
                    };
                    handleNoticeMeetingFieldsChange(resetFields);
                  }}
                />
              )}

              {/* Title & Posting Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    নোটিশের শিরোনাম (Title)
                  </label>
                  <input
                    type="text"
                    value={noticeModalTitle}
                    onChange={(e) => setNoticeModalTitle(e.target.value)}
                    placeholder="যেমন: জরুরি সভা সংক্রান্ত বিজ্ঞপ্তি"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-none bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    প্রকাশের তারিখ (Date) *
                  </label>
                  <input
                    type="date"
                    required
                    value={noticeModalDate}
                    onChange={(e) => setNoticeModalDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-none bg-white"
                  />
                </div>
              </div>

              {/* Notice Content / Live Generated Output */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700">
                    নোটিশের বিবরণ (Notice Text) *
                  </label>
                  {(noticeModalCategory === 'কার্যকরী কমিটির মিটিং' || noticeModalCategory === 'কার্যকরী কমিটি ও সাধারণ সদস্য উভয়ের মিটিং') && (
                    <button
                      type="button"
                      onClick={() => {
                        if (noticeModalCategory === 'কার্যকরী কমিটির মিটিং') {
                          setNoticeModalText(generateExecutiveMeetingNotice(noticeMeetingFields));
                        } else {
                          setNoticeModalText(generateJointMeetingNotice(noticeMeetingFields));
                        }
                      }}
                      className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                      title="উপরে পূরণ করা তথ্য দিয়ে টেমপ্লেট পুনরায় লোড করুন"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>টেমপ্লেট পুনরায় রিফ্রেশ</span>
                    </button>
                  )}
                </div>
                <textarea
                  required
                  rows={(noticeModalCategory === 'কার্যকরী কমিটির মিটিং' || noticeModalCategory === 'কার্যকরী কমিটি ও সাধারণ সদস্য উভয়ের মিটিং') ? 5 : 4}
                  value={noticeModalText}
                  onChange={(e) => setNoticeModalText(e.target.value)}
                  placeholder="বিস্তারিত নোটিশ লিখুন..."
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-none leading-relaxed font-normal bg-white"
                />
                {(noticeModalCategory === 'কার্যকরী কমিটির মিটিং' || noticeModalCategory === 'কার্যকরী কমিটি ও সাধারণ সদস্য উভয়ের মিটিং') && (
                  <p className="text-[11px] text-slate-500">
                    💡 উপরের ফরমের ফিল্ডগুলো পরিবর্তন করলে এই টেক্সট স্বয়ংক্রিয়ভাবে আপডেট হয়।
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="admin-notice-pin-chk"
                  checked={noticeModalIsPinned}
                  onChange={(e) => setNoticeModalIsPinned(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="admin-notice-pin-chk" className="text-xs font-semibold text-slate-700 cursor-pointer select-none">
                  বোর্ডের শীর্ষে পিন করে রাখুন
                </label>
              </div>

              <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100">
                <div>
                  {(noticeModalCategory === 'কার্যকরী কমিটির মিটিং' || noticeModalCategory === 'কার্যকরী কমিটি ও সাধারণ সদস্য উভয়ের মিটিং') && (
                    <button
                      type="button"
                      onClick={() => handleOpenBulkMeetingSms(noticeModalCategory, noticeModalText, noticeModalTitle)}
                      className={`px-4 py-2 text-xs font-bold text-white rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5 ${
                        noticeModalCategory === 'কার্যকরী কমিটির মিটিং'
                          ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-100'
                          : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100'
                      }`}
                      title="এই মিটিং নোটিশটি সরাসরি সবার কাছে এসএমএস পাঠান"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>সবার কাছে এসএমএস পাঠান</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => { setIsAddNoticeOpen(false); setEditingNotice(null); }}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                  >
                    বাতিল
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
                  >
                    <BellRing className="w-3.5 h-3.5" />
                    <span>{editingNotice ? 'আপডেট করুন' : 'প্রকাশ করুন'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUPPORT & REPORT MODAL (Add / Edit) */}
      {(isAddSupportReportOpen || editingSupportReport) && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 animate-scaleUp my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <LifeBuoy className="w-5 h-5 text-amber-600" />
                {editingSupportReport ? 'রিপোর্ট / সহায়তা সম্পাদনা (Edit)' : 'নতুন সাপোর্ট / রিপোর্ট এন্ট্রি (Add)'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsAddSupportReportOpen(false);
                  setEditingSupportReport(null);
                  setSupportPhotoBase64('');
                }}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSupportReport} className="space-y-4 mt-4">
              {/* Photo Upload with Base64 Converter */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  ছবি (গ্যালারি থেকে সিলেক্ট করুন / Base64)
                </label>
                <div className="flex items-center gap-3">
                  {supportPhotoBase64 || editingSupportReport?.photoUrl ? (
                    <div className="relative w-16 h-16 rounded-xl border-2 border-amber-500 overflow-hidden bg-slate-100 shrink-0">
                      <img
                        src={supportPhotoBase64 || editingSupportReport?.photoUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setSupportPhotoBase64('')}
                        className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-red-600 text-white hover:bg-red-700"
                        title="ছবি মুছুন"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center bg-slate-50 text-slate-400 shrink-0">
                      <Camera className="w-5 h-5" />
                      <span className="text-[9px] font-bold mt-0.5">ছবি নেই</span>
                    </div>
                  )}

                  <div className="flex-1">
                    <label className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer transition border border-slate-200">
                      <Upload className="w-3.5 h-3.5 text-slate-600" />
                      <span>গ্যালারি থেকে ছবি বাছাই করুন</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleSupportPhotoSelect}
                        className="hidden"
                      />
                    </label>
                    <p className="text-[10px] text-slate-400 mt-1">
                      JPG, PNG, WebP (সর্বোচ্চ ৫ মেগাবাইট)
                    </p>
                  </div>
                </div>
              </div>

              {/* Name & Designation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    নাম <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    defaultValue={editingSupportReport?.name || ''}
                    placeholder="আবেদনকারীর নাম"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    পদবি / পরিচয়
                  </label>
                  <input
                    type="text"
                    name="designation"
                    defaultValue={editingSupportReport?.designation || ''}
                    placeholder="যেমন: সাধারণ সম্পাদক / রক্তদান সমন্বয়ক"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Phone & Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    মোবাইল নম্বর <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    defaultValue={editingSupportReport?.phone || ''}
                    placeholder="০১XXXXXXXXX"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono focus:ring-1 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    আবেদনের ধরন
                  </label>
                  <select
                    name="type"
                    defaultValue={editingSupportReport?.type || 'সহায়তা'}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold bg-white focus:ring-1 focus:ring-amber-500 focus:outline-none"
                  >
                    <option value="সহায়তা">সহায়তা (Support)</option>
                    <option value="অভিযোগ">অভিযোগ (Complaint)</option>
                    <option value="পরামর্শ">পরামর্শ (Feedback)</option>
                    <option value="রক্তদান বিষয়ক">রক্তদান বিষয়ক (Blood)</option>
                    <option value="অন্যান্য">অন্যান্য (Other)</option>
                  </select>
                </div>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  বিষয় / শিরোনাম <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="subject"
                  required
                  defaultValue={editingSupportReport?.subject || ''}
                  placeholder="যেমন: জরুরি চিকিৎসা সহায়তা বা নোটিশ বিষয়ক পরামর্শ"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  বিস্তারিত বিবরণ <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  rows={3}
                  required
                  defaultValue={editingSupportReport?.description || ''}
                  placeholder="আপনার বিষয় বা সমস্যা বিস্তারিত লিখুন..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none leading-relaxed"
                />
              </div>

              {/* Status & Admin Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    বর্তমান অবস্থা (Status)
                  </label>
                  <select
                    name="status"
                    defaultValue={editingSupportReport?.status || 'pending'}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold bg-white focus:ring-1 focus:ring-amber-500 focus:outline-none"
                  >
                    <option value="pending">অপেক্ষমাণ (Pending)</option>
                    <option value="in_review">পর্যালোচনায় (In Review)</option>
                    <option value="resolved">সমাধানকৃত (Resolved)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    এডমিন মন্তব্য (Admin Notes)
                  </label>
                  <input
                    type="text"
                    name="adminNotes"
                    defaultValue={editingSupportReport?.adminNotes || ''}
                    placeholder="যেমন: যোগাযোগ করা হয়েছে"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddSupportReportOpen(false);
                    setEditingSupportReport(null);
                    setSupportPhotoBase64('');
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs transition cursor-pointer"
                >
                  {editingSupportReport ? 'আপডেট করুন' : 'সংরক্ষণ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Member Photo Zoom Modal */}
      {zoomedMemberPhoto && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-fadeIn"
          onClick={() => setZoomedMemberPhoto(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="relative max-w-lg w-full bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-200/90 animate-scaleUp flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/70">
              <div className="min-w-0 pr-2">
                <h3 className="font-bold text-slate-900 text-base sm:text-lg truncate">
                  {zoomedMemberPhoto.name}
                </h3>
                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200/70">
                    {zoomedMemberPhoto.designation}
                  </span>
                  {zoomedMemberPhoto.countryStatus ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 text-xs font-bold border border-blue-200/70">
                      <Globe className="w-3 h-3 text-blue-600" />
                      <span>{zoomedMemberPhoto.countryStatus}</span>
                    </span>
                  ) : (zoomedMemberPhoto.isExpatriate || zoomedMemberPhoto.memberType === 'expatriate') ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 text-xs font-bold border border-blue-200/70">
                      <Globe className="w-3 h-3 text-blue-600" />
                      <span>প্রবাসী সদস্য</span>
                    </span>
                  ) : null}
                </div>
              </div>
              <button
                onClick={() => setZoomedMemberPhoto(null)}
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition cursor-pointer flex-shrink-0"
                title="বন্ধ করুন"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 sm:p-5 flex-1 flex items-center justify-center bg-slate-950 overflow-hidden">
              {(() => {
                const zoomPhoto = getMemberPhotoUrl(zoomedMemberPhoto);
                return zoomPhoto ? (
                  <img
                    src={zoomPhoto}
                    alt={zoomedMemberPhoto.name}
                    className="w-full h-auto max-h-[65vh] object-contain rounded-2xl select-none shadow-lg"
                    onError={(e) => {
                      const img = e.target as HTMLImageElement;
                      if (zoomedMemberPhoto.id && !img.src.includes('/api/member-photo/')) {
                        img.src = `/api/member-photo/${encodeURIComponent(zoomedMemberPhoto.id)}`;
                      }
                    }}
                  />
                ) : (
                  <div className="py-12 text-center text-slate-400">
                    <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-2xl font-bold mx-auto mb-2">
                      {zoomedMemberPhoto.name.charAt(0)}
                    </div>
                    <p className="text-sm font-medium text-slate-300">কোনো ছবি সংরক্ষিত নেই</p>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Due Reminder Direct SIM SMS Modal with Custom Months Selection */}
      <DueSmsModal
        isOpen={!!dueSmsTarget}
        onClose={() => setDueSmsTarget(null)}
        target={dueSmsTarget}
        paymentConfig={paymentConfig}
      />

      {/* Bulk Meeting SMS Dispatch Modal */}
      <BulkMeetingSmsModal
        isOpen={bulkMeetingSmsData.isOpen}
        onClose={() => setBulkMeetingSmsData(prev => ({ ...prev, isOpen: false }))}
        meetingType={bulkMeetingSmsData.meetingType}
        noticeText={bulkMeetingSmsData.noticeText}
        noticeTitle={bulkMeetingSmsData.noticeTitle}
        members={members}
        onNotifySuccess={(msg) => notifySuccess(msg)}
      />
    </div>
  );
};
