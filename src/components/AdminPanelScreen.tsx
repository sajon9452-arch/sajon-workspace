import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  Settings, 
  Users, 
  CreditCard, 
  Building, 
  KeyRound, 
  Save, 
  CheckCircle2, 
  AlertCircle,
  PlusCircle,
  Edit,
  Trash2,
  Lock,
  Cloud,
  Search,
  X,
  Phone,
  MapPin,
  Globe,
  ShieldCheck,
  UserPlus,
  LogOut,
  Wallet,
  TrendingUp,
  Clock,
  Send,
  Check,
  Copy,
  Receipt,
  Coins,
  Sparkles,
  Calendar,
  LayoutGrid,
  Smartphone,
  ShieldAlert,
  UserCheck,
  UserX,
  Ban,
  RefreshCw,
  AlertTriangle,
  Upload,
  Image as ImageIcon,
  Heart,
  Gift,
  Eye,
  BookOpen,
  Droplet,
  Headphones,
  Code,
  Download,
  FileCheck
} from 'lucide-react';
import { 
  OrganizationProfile, 
  Member, 
  BloodDonor, 
  BloodGroup,
  FundRecord,
  PaymentStatus,
  PaymentGatewayConfig,
  UserAccount,
  SecurityAlert,
  HomeSlide,
  AidDonationRecord,
  ExtraContributionRecord,
  OrganizationRule,
  PendingPayment,
  SupportTeamMember
} from '../types';
import { 
  toBengaliNumber, 
  sortMembersOldestFirst,
  isExecutiveCommitteeMember,
  isExpatriateMember,
  getMemberPhotoUrl,
  sanitizePhone,
  formatBengaliCurrency
} from '../utils/helpers';
import { autoSyncMembersToFunds } from '../utils/memberFundLinker';
import { generateDirectSimPaidSms, generateDirectSimDueSms, triggerDirectSimSms } from '../utils/smsHelper';
import { generateAndDownloadReceipt } from '../utils/receiptGenerator';
import { saveAdminPin, PMS_SYNC_EVENT, saveFunds, loadFunds } from '../utils/storage';
import { BkashLogo, NagadLogo, RocketLogo } from './PaymentGatewaySection';
import { 
  loadUserAccounts, 
  saveUserAccounts, 
  loadSecurityAlerts, 
  saveSecurityAlerts,
  resetMemberDeviceBinding,
  updateMemberCredentials,
  generateS5389Username,
  generateS5DigitUsername,
  isValidS5DigitUsername
} from '../utils/authSecurity';
import { 
  checkSupabaseConnection, 
  checkSupabaseTableDetails,
  SUPABASE_URL, 
  SUPABASE_ANON_KEY,
  SUPABASE_SETUP_SQL,
  updateSupabaseCredentials,
  resetSupabaseCredentials,
  pushAllDataToSupabase,
  fetchSupabaseCollection,
  safeSyncToSupabase,
  safeDeleteFromSupabase,
  APP_SUPABASE_TABLES
} from '../utils/supabaseClient';
import { triggerFullCloudSync, getLocalSyncSnapshot } from '../utils/liveSync';
import { compressImageFile } from '../utils/imageCompressor';

interface AdminPanelScreenProps {
  profile: OrganizationProfile;
  onUpdateProfile: (profile: OrganizationProfile) => void;
  members: Member[];
  onAddMember: (member: Omit<Member, 'id'>) => Promise<Member>;
  onEditMember: (member: Member) => Promise<void>;
  onDeleteMember: (id: string) => Promise<void>;
  donors?: BloodDonor[];
  onAddDonor?: (donor: Omit<BloodDonor, 'id'>) => Promise<BloodDonor>;
  onEditDonor?: (donor: BloodDonor) => Promise<void>;
  onDeleteDonor?: (id: string) => Promise<void>;
  funds?: FundRecord[];
  onEditFundRecord?: (fund: FundRecord) => Promise<void>;
  onToggleFundStatus?: (id: string, newStatus: PaymentStatus) => Promise<void>;
  manualTotalBalance?: number | null;
  onUpdateManualTotalBalance?: (amount: number | null) => void;
  monthlyExpense?: number;
  onUpdateMonthlyExpense?: (amount: number) => void;
  extraMoney?: number;
  onUpdateExtraMoney?: (amount: number) => void;
  homeSlides?: HomeSlide[];
  onAddHomeSlide?: (slide: Omit<HomeSlide, 'id'>) => Promise<HomeSlide>;
  onEditHomeSlide?: (slide: HomeSlide) => Promise<void>;
  onDeleteHomeSlide?: (id: string) => Promise<void>;
  aidDonations?: AidDonationRecord[];
  onAddAidDonation?: (donation: Omit<AidDonationRecord, 'id'>) => Promise<AidDonationRecord>;
  onEditAidDonation?: (donation: AidDonationRecord) => Promise<void>;
  onDeleteAidDonation?: (id: string) => Promise<void>;
  extraContributions?: ExtraContributionRecord[];
  onAddExtraContribution?: (contribution: Omit<ExtraContributionRecord, 'id'>) => Promise<ExtraContributionRecord>;
  onEditExtraContribution?: (contribution: ExtraContributionRecord) => Promise<void>;
  onDeleteExtraContribution?: (id: string) => Promise<void>;
  organizationRules?: OrganizationRule[];
  onAddRule?: (rule: Omit<OrganizationRule, 'id'>) => Promise<OrganizationRule>;
  onEditRule?: (rule: OrganizationRule) => Promise<void>;
  onDeleteRule?: (id: string) => Promise<void>;
  supportMembers?: SupportTeamMember[];
  onAddSupportMember?: (member: Omit<SupportTeamMember, 'id'>) => Promise<SupportTeamMember>;
  onEditSupportMember?: (member: SupportTeamMember) => Promise<void>;
  onDeleteSupportMember?: (id: string) => Promise<void>;
  paymentConfig: PaymentGatewayConfig;
  onUpdatePaymentConfig: (config: PaymentGatewayConfig) => void;
  initialTab?: string;
  onBack: () => void;
  onLogout?: () => void;
}

export const AdminPanelScreen: React.FC<AdminPanelScreenProps> = ({
  profile,
  onUpdateProfile,
  members,
  onAddMember,
  onEditMember,
  onDeleteMember,
  donors = [],
  onAddDonor,
  onEditDonor,
  onDeleteDonor,
  funds = [],
  onEditFundRecord,
  onToggleFundStatus,
  manualTotalBalance = 0,
  onUpdateManualTotalBalance,
  monthlyExpense = 0,
  onUpdateMonthlyExpense,
  extraMoney = 0,
  onUpdateExtraMoney,
  homeSlides = [],
  onAddHomeSlide,
  onEditHomeSlide,
  onDeleteHomeSlide,
  aidDonations = [],
  onAddAidDonation,
  onEditAidDonation,
  onDeleteAidDonation,
  extraContributions = [],
  onAddExtraContribution,
  onEditExtraContribution,
  onDeleteExtraContribution,
  organizationRules = [],
  onAddRule,
  onEditRule,
  onDeleteRule,
  supportMembers = [],
  onAddSupportMember,
  onEditSupportMember,
  onDeleteSupportMember,
  paymentConfig,
  onUpdatePaymentConfig,
  initialTab,
  onBack,
  onLogout
}) => {
  const [activeTab, setActiveTab] = useState<'members' | 'donors' | 'registrations' | 'funds' | 'verification' | 'slides' | 'donations' | 'contributions' | 'rules' | 'profile' | 'payments' | 'security' | 'support'>(
    (initialTab as any) || 'members'
  );
  
  // User Accounts & Security Tracking State
  const [userAccounts, setUserAccounts] = useState<UserAccount[]>(() => loadUserAccounts());
  const [securityAlerts, setSecurityAlerts] = useState<SecurityAlert[]>(() => loadSecurityAlerts());
  const [regSubTab, setRegSubTab] = useState<'pending' | 'approved' | 'alerts'>('pending');
  const [regSearch, setRegSearch] = useState('');
  const [assignedUsernames, setAssignedUsernames] = useState<Record<string, string>>({});
  const [isProcessingApproval, setIsProcessingApproval] = useState<string | null>(null);
  const [previewPhoto, setPreviewPhoto] = useState<{ url: string; name: string } | null>(null);

  // Digital Payment Gateway Verification State (Requirement 2 & 3)
  const [pendingPayments, setPendingPayments] = useState<PendingPayment[]>([]);
  const [isLoadingPayments, setIsLoadingPayments] = useState(false);
  const [paymentSearch, setPaymentSearch] = useState('');
  const [paymentFilterStatus, setPaymentFilterStatus] = useState<'all' | 'pending' | 'approved'>('pending');
  const [processingPaymentId, setProcessingPaymentId] = useState<string | null>(null);
  const [paymentSuccessToast, setPaymentSuccessToast] = useState<string | null>(null);
  const [copiedTrxId, setCopiedTrxId] = useState<string | null>(null);

  // Load pending payments directly from Supabase in real-time
  const loadPendingPaymentsFromCloud = useCallback(async () => {
    setIsLoadingPayments(true);
    try {
      const data = await fetchSupabaseCollection<PendingPayment>('pendingPayments');
      if (Array.isArray(data)) {
        const sorted = [...data].sort((a, b) => {
          const timeA = new Date(a.submittedAt || a.createdAt || 0).getTime();
          const timeB = new Date(b.submittedAt || b.createdAt || 0).getTime();
          return timeB - timeA;
        });
        setPendingPayments(sorted);
      }
    } catch {
      // ignore
    } finally {
      setIsLoadingPayments(false);
    }
  }, []);

  useEffect(() => {
    loadPendingPaymentsFromCloud();
  }, [loadPendingPaymentsFromCloud]);

  useEffect(() => {
    const handleSync = () => {
      loadPendingPaymentsFromCloud();
    };
    window.addEventListener(PMS_SYNC_EVENT, handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener(PMS_SYNC_EVENT, handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, [loadPendingPaymentsFromCloud]);

  const pendingVerificationList = useMemo(() => {
    return pendingPayments.filter(p => p.status === 'pending');
  }, [pendingPayments]);

  const approvedVerificationList = useMemo(() => {
    return pendingPayments.filter(p => p.status === 'approved');
  }, [pendingPayments]);

  const filteredVerificationList = useMemo(() => {
    let list = pendingPayments;
    if (paymentFilterStatus === 'pending') {
      list = list.filter(p => p.status === 'pending');
    } else if (paymentFilterStatus === 'approved') {
      list = list.filter(p => p.status === 'approved');
    }

    if (paymentSearch.trim()) {
      const q = paymentSearch.trim().toLowerCase();
      list = list.filter(p => 
        (p.userName && p.userName.toLowerCase().includes(q)) ||
        (p.senderPhone && p.senderPhone.includes(q)) ||
        (p.trxId && p.trxId.toLowerCase().includes(q)) ||
        (p.gateway && p.gateway.toLowerCase().includes(q))
      );
    }
    return list;
  }, [pendingPayments, paymentFilterStatus, paymentSearch]);

  // Requirement 3: Admin Approve action
  const handleApprovePayment = async (payment: PendingPayment) => {
    setProcessingPaymentId(payment.id);
    try {
      const allFunds = funds.length > 0 ? [...funds] : loadFunds();
      const numAmount = Number(payment.amount) || 500;
      const cleanTrx = payment.trxId || payment.transactionId || '';
      
      let targetFundIndex = -1;
      if (payment.memberId) {
        targetFundIndex = allFunds.findIndex(f => f.memberId === payment.memberId);
      }
      if (targetFundIndex === -1 && payment.userName) {
        const cleanName = payment.userName.trim().toLowerCase();
        targetFundIndex = allFunds.findIndex(f => f.memberName.trim().toLowerCase() === cleanName);
      }
      if (targetFundIndex === -1 && payment.senderPhone) {
        const cleanP = sanitizePhone(payment.senderPhone);
        if (cleanP) {
          targetFundIndex = allFunds.findIndex(f => f.phone && sanitizePhone(f.phone) === cleanP);
        }
      }

      let updatedFundRecord: FundRecord;
      if (targetFundIndex !== -1) {
        const target = allFunds[targetFundIndex];
        updatedFundRecord = {
          ...target,
          status: 'Paid',
          paidAmount: numAmount,
          dueAmount: 0,
          paymentMethod: payment.gateway,
          transactionId: cleanTrx,
          notes: `${payment.gateway || 'অনলাইন'} পেমেন্ট TrxID: ${cleanTrx} (অনুমোদিত)`,
          voucherNo: cleanTrx,
          approvedAt: new Date().toISOString()
        };
        allFunds[targetFundIndex] = updatedFundRecord;
      } else {
        updatedFundRecord = {
          id: `fund_appr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          memberId: payment.memberId,
          memberName: payment.userName || payment.memberName || 'সদস্য',
          designation: payment.designation || 'সাধারণ সদস্য',
          phone: payment.senderPhone,
          senderPhone: payment.senderPhone,
          amount: numAmount,
          paidAmount: numAmount,
          dueAmount: 0,
          status: 'Paid',
          paymentMethod: payment.gateway,
          transactionId: cleanTrx,
          date: new Date().toISOString().split('T')[0],
          month: 'রানিং মাস',
          category: 'মাসিক চাঁদা',
          type: 'income',
          description: `${payment.gateway || 'অনলাইন'} TrxID: ${cleanTrx} (${payment.senderPhone})`,
          notes: `${payment.gateway} পেমেন্ট অনুমোদিত | TrxID: ${cleanTrx}`,
          voucherNo: cleanTrx,
          approvedAt: new Date().toISOString()
        };
        allFunds.unshift(updatedFundRecord);
      }

      // Automatically update the corresponding member's payment status in main database
      await safeSyncToSupabase('funds', updatedFundRecord);
      saveFunds(allFunds);
      if (onEditFundRecord) {
        await onEditFundRecord(updatedFundRecord);
      }

      // Update payment status in pending_payments
      const updatedPayment: PendingPayment = {
        ...payment,
        status: 'approved',
        reviewedAt: new Date().toISOString(),
        reviewedBy: 'Admin'
      };
      await safeSyncToSupabase('pendingPayments', updatedPayment);

      setPendingPayments(prev => prev.map(p => p.id === payment.id ? updatedPayment : p));

      setPaymentSuccessToast(`সফল! ${payment.userName}-এর ${formatBengaliCurrency(numAmount)} টাকার পেমেন্ট অনুমোদন করা হয়েছে এবং সদস্যের চাঁদা 'পরিশোধিত' হিসেবে আপডেট করা হয়েছে।`);
      setTimeout(() => setPaymentSuccessToast(null), 4000);

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(PMS_SYNC_EVENT));
      }
    } catch {
      alert('পেমেন্ট অনুমোদন করতে সমস্যা হয়েছে।');
    } finally {
      setProcessingPaymentId(null);
    }
  };

  // Requirement 3: Admin Reject action
  const handleRejectPayment = async (paymentId: string) => {
    if (!confirm('আপনি কি নিশ্চিত যে এই পেমেন্ট রিকোয়েস্টটি বাতিল বা মুছে ফেলতে চান?')) {
      return;
    }
    setProcessingPaymentId(paymentId);
    try {
      // Discard or delete the request from Supabase pending_payments table
      await safeDeleteFromSupabase('pendingPayments', paymentId);
      setPendingPayments(prev => prev.filter(p => p.id !== paymentId));
      setPaymentSuccessToast('পেমেন্ট রিকোয়েস্টটি সফলভাবে বাতিল করা হয়েছে।');
      setTimeout(() => setPaymentSuccessToast(null), 3000);

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(PMS_SYNC_EVENT));
      }
    } catch {
      alert('রিকোয়েস্টটি মুছতে সমস্যা হয়েছে।');
    } finally {
      setProcessingPaymentId(null);
    }
  };

  // Sync user accounts & security alerts
  useEffect(() => {
    const handleSync = () => {
      setUserAccounts(loadUserAccounts());
      setSecurityAlerts(loadSecurityAlerts());
    };
    window.addEventListener(PMS_SYNC_EVENT, handleSync);
    return () => window.removeEventListener(PMS_SYNC_EVENT, handleSync);
  }, []);

  const pendingAccounts = useMemo(() => userAccounts.filter(a => a.status === 'pending'), [userAccounts]);
  const approvedAccounts = useMemo(() => userAccounts.filter(a => a.status === 'approved' || a.status === 'blocked'), [userAccounts]);
  const unresolvedAlerts = useMemo(() => securityAlerts.filter(a => !a.resolved), [securityAlerts]);

  // Handle Approve Member Registration & Assign Unique S + 5 Digits Username (e.g. s54776)
  const handleApproveRegistration = async (account: UserAccount) => {
    // 1. Determine clean unique username strictly following: 's' + 5 digits (no underscores or symbols)
    let candidateUsername = (assignedUsernames[account.id] || account.username || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!candidateUsername.startsWith('s')) {
      candidateUsername = 's' + candidateUsername.replace(/\D/g, '');
    }
    candidateUsername = candidateUsername.slice(0, 6);

    if (!isValidS5DigitUsername(candidateUsername)) {
      setErrorMsg('অনুমোদনের পূর্বে অনুগ্রহ করে S + ঠিক ৫টি সংখ্যার ইউনিক ইউজারনেম ইনপুট দিন (যেমন: s54776)।');
      setTimeout(() => setErrorMsg(''), 4000);
      return;
    }

    // Verify username uniqueness across other approved accounts
    const usernameTaken = userAccounts.some(
      a => a.id !== account.id && a.status === 'approved' && a.username && a.username.toLowerCase() === candidateUsername.toLowerCase()
    );
    if (usernameTaken) {
      setErrorMsg(`ইউজারনেম @${candidateUsername} ইতোমধ্যে ব্যবহৃত হয়েছে। অনুগ্রহ করে ভিন্ন একটি ইউনিক ইউজারনেম দিন।`);
      setTimeout(() => setErrorMsg(''), 4000);
      return;
    }

    setIsProcessingApproval(account.id);
    setErrorMsg('');

    try {
      // 2. Check if a member with this phone or ID already exists in the active member list
      let targetMemberId = account.memberId || '';
      const existingMember = members.find(m => 
        (account.memberId && m.id === account.memberId) ||
        (m.phone && account.phone && sanitizePhone(m.phone) === sanitizePhone(account.phone))
      );

      if (existingMember) {
        targetMemberId = existingMember.id;
        // Ensure existing member is active and update photo if available
        if (onEditMember) {
          try {
            await onEditMember({
              ...existingMember,
              photoUrl: account.photoUrl || existingMember.photoUrl,
              status: 'সক্রিয়'
            });
          } catch (editErr) {
            console.warn('onEditMember warning during approval:', editErr);
          }
        }
      } else {
        // Calculate next sequential serial
        let maxSerial = 0;
        members.forEach(m => {
          if (typeof m.serial === 'number' && !isNaN(m.serial) && m.serial > maxSerial) {
            maxSerial = m.serial;
          }
        });
        const nextSerial = Math.max(maxSerial, members.length) + 1;

        // Add to Member list (sequentially appended to bottom and auto-synced to funds)
        const newMemberData: Omit<Member, 'id'> = {
          name: account.name.trim(),
          designation: (account.designation || 'সাধারণ সদস্য').trim(),
          phone: account.phone.trim(),
          area: account.area.trim(),
          bloodGroup: account.bloodGroup,
          photoUrl: account.photoUrl,
          status: 'সক্রিয়',
          joinDate: new Date().toISOString().split('T')[0],
          serial: nextSerial,
          createdAt: new Date().toISOString()
        };

        if (onAddMember) {
          try {
            const createdMember = await onAddMember(newMemberData);
            if (createdMember && createdMember.id) {
              targetMemberId = createdMember.id;
            }
          } catch (addErr) {
            console.warn('onAddMember warning during approval, applying fallback ID:', addErr);
          }
        }

        if (!targetMemberId) {
          targetMemberId = `m-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        }
      }

      // 3. Update account to approved with assigned unique S5389 username, memberId and preserved password
      const updatedAccount: UserAccount = {
        ...account,
        status: 'approved',
        username: candidateUsername,
        memberId: targetMemberId,
        password: account.password || 'sms2022' // Ensure user password is saved safely
      };

      const freshAccounts = loadUserAccounts();
      const updatedList = freshAccounts.map(a => a.id === account.id ? updatedAccount : a);
      if (!updatedList.some(a => a.id === account.id)) {
        updatedList.unshift(updatedAccount);
      }

      saveUserAccounts(updatedList);
      setUserAccounts(updatedList);

      // Clean up temporary assignedUsernames entry
      setAssignedUsernames(prev => {
        const next = { ...prev };
        delete next[account.id];
        return next;
      });

      setNoticeMsg(`সদস্য "${account.name}" এর আবেদন সফলভাবে অনুমোদিত হয়েছে এবং ইউনিক ইউজারনেম "@${candidateUsername}" বরাদ্দ দেওয়া হয়েছে।`);
      setTimeout(() => setNoticeMsg(''), 4500);
    } catch (err) {
      console.error('Member approval error:', err);
      setErrorMsg('সদস্য অনুমোদন প্রক্রিয়ায় সমস্যা হয়েছে। পুনরায় চেষ্টা করুন।');
      setTimeout(() => setErrorMsg(''), 4000);
    } finally {
      setIsProcessingApproval(null);
    }
  };

  // Handle Reject Member Registration
  const handleRejectRegistration = (account: UserAccount) => {
    const updated = userAccounts.map(a => a.id === account.id ? { ...a, status: 'rejected' as const } : a);
    setUserAccounts(updated);
    saveUserAccounts(updated);
    setNoticeMsg(`"${account.name}" এর নিবন্ধন আবেদন প্রত্যাখ্যান করা হয়েছে`);
    setTimeout(() => setNoticeMsg(''), 3000);
  };

  // Handle Toggle Block User (Instant Admin Block / Unblock)
  const handleToggleBlockUser = (account: UserAccount) => {
    const isNowBlocked = account.status === 'blocked';
    const nextStatus: 'approved' | 'blocked' = isNowBlocked ? 'approved' : 'blocked';
    const updated = userAccounts.map(a => a.id === account.id ? { ...a, status: nextStatus, isSuspicious: isNowBlocked ? false : a.isSuspicious } : a);
    setUserAccounts(updated);
    saveUserAccounts(updated);

    if (!isNowBlocked) {
      setNoticeMsg(`ব্যবহারকারী @${account.username} (${account.name}) তাৎক্ষণিকভাবে ব্লক করা হয়েছে`);
    } else {
      setNoticeMsg(`ব্যবহারকারী @${account.username} (${account.name}) সফলভাবে আনব্লক করা হয়েছে`);
    }
    setTimeout(() => setNoticeMsg(''), 3500);
  };

  // Handle Delete User Account
  const handleDeleteUserAccount = (accountId: string, username: string) => {
    const updated = userAccounts.filter(a => a.id !== accountId);
    setUserAccounts(updated);
    saveUserAccounts(updated);
    setNoticeMsg(`ব্যবহারকারী @${username} এর রেকর্ড স্থায়ীভাবে মুছে ফেলা হয়েছে`);
    setTimeout(() => setNoticeMsg(''), 3000);
  };

  // Handle Resolve Alert
  const handleResolveAlert = (alertId: string) => {
    const updated = securityAlerts.map(a => a.id === alertId ? { ...a, resolved: true } : a);
    setSecurityAlerts(updated);
    saveSecurityAlerts(updated);
    setNoticeMsg('নিরাপত্তা অ্যালার্ট সমাধান হিসেবে চিহ্নিত করা হয়েছে');
    setTimeout(() => setNoticeMsg(''), 3000);
  };

  // Requirement 6: Credential Recovery Modal States
  const [credentialModalAccount, setCredentialModalAccount] = useState<UserAccount | null>(null);
  const [credNewUsername, setCredNewUsername] = useState('');
  const [credNewPassword, setCredNewPassword] = useState('');
  const [credError, setCredError] = useState('');

  const handleOpenCredentialModal = (acc: UserAccount) => {
    setCredentialModalAccount(acc);
    if (acc.username && isValidS5DigitUsername(acc.username)) {
      setCredNewUsername(acc.username.toLowerCase());
    } else {
      setCredNewUsername(generateS5DigitUsername(undefined, userAccounts, acc.id));
    }
    setCredNewPassword('');
    setCredError('');
  };

  const handleSaveCredentialRecovery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!credentialModalAccount) return;

    let cleanUsername = credNewUsername.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!cleanUsername.startsWith('s')) {
      cleanUsername = 's' + cleanUsername.replace(/\D/g, '');
    }
    cleanUsername = cleanUsername.slice(0, 6);

    if (!isValidS5DigitUsername(cleanUsername)) {
      setCredError('ইউজারনেম ফরম্যাট ভুল! ইউজারনেম অবশ্যই "s" এবং ঠিক ৫টি সংখ্যার হতে হবে, কোনো চিহ্ন বা আন্ডারস্কোর ছাড়া (যেমন: s54776)।');
      return;
    }

    const res = updateMemberCredentials(credentialModalAccount.id, cleanUsername, credNewPassword);
    if (!res.success) {
      setCredError(res.error || 'ক্রেডেনশিয়াল আপডেট ব্যর্থ হয়েছে');
      return;
    }
    const fresh = loadUserAccounts();
    setUserAccounts(fresh);
    setNoticeMsg(`সদস্য "${credentialModalAccount.name}" এর ইউজারনেম (@${cleanUsername}) ও ক্রেডেনশিয়াল সফলভাবে আপডেট করা হয়েছে।`);
    setCredentialModalAccount(null);
    setTimeout(() => setNoticeMsg(''), 4000);
  };

  // Member Management States
  const [memberSearch, setMemberSearch] = useState('');
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [deletingMemberId, setDeletingMemberId] = useState<string | null>(null);

  // Blood Donor Management States (Admin-Exclusive)
  const [donorSearch, setDonorSearch] = useState('');
  const [donorGroupFilter, setDonorGroupFilter] = useState<string>('all');
  const [isAddDonorModalOpen, setIsAddDonorModalOpen] = useState(false);
  const [editingDonor, setEditingDonor] = useState<BloodDonor | null>(null);
  const [deletingDonorId, setDeletingDonorId] = useState<string | null>(null);
  const [donorName, setDonorName] = useState('');
  const [donorPhone, setDonorPhone] = useState('');
  const [donorGroup, setDonorGroup] = useState<BloodGroup>('O+');
  const [donorArea, setDonorArea] = useState('পতেঙ্গা, চট্টগ্রাম');
  const [donorLastDate, setDonorLastDate] = useState('');
  const [donorTotal, setDonorTotal] = useState<number | ''>(1);
  const [donorIsAvailable, setDonorIsAvailable] = useState(true);
  const [donorFormError, setDonorFormError] = useState('');
  const [isSavingDonor, setIsSavingDonor] = useState(false);

  const isDonorAdminEligible = (lastDate?: string): boolean => {
    if (!lastDate) return true;
    try {
      const last = new Date(lastDate);
      const diffDays = Math.floor((Date.now() - last.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays >= 90;
    } catch {
      return true;
    }
  };

  const filteredAdminDonors = useMemo(() => {
    return (donors || []).filter(d => {
      if (donorGroupFilter !== 'all' && d.bloodGroup !== donorGroupFilter) return false;
      if (donorSearch.trim()) {
        const q = donorSearch.trim().toLowerCase();
        return (
          d.name.toLowerCase().includes(q) ||
          d.phone.includes(q) ||
          d.area.toLowerCase().includes(q) ||
          d.bloodGroup.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [donors, donorGroupFilter, donorSearch]);

  const handleOpenAddDonor = () => {
    setEditingDonor(null);
    setDonorName('');
    setDonorPhone('');
    setDonorGroup('O+');
    setDonorArea('পতেঙ্গা, চট্টগ্রাম');
    setDonorLastDate('');
    setDonorTotal(1);
    setDonorIsAvailable(true);
    setDonorFormError('');
    setIsAddDonorModalOpen(true);
  };

  const handleOpenEditDonor = (d: BloodDonor) => {
    setEditingDonor(d);
    setDonorName(d.name);
    setDonorPhone(d.phone);
    setDonorGroup(d.bloodGroup);
    setDonorArea(d.area);
    setDonorLastDate(d.lastDonationDate || '');
    setDonorTotal(d.totalDonations !== undefined ? d.totalDonations : 1);
    setDonorIsAvailable(d.isAvailable !== false);
    setDonorFormError('');
    setIsAddDonorModalOpen(true);
  };

  const handleSaveDonor = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingDonor(true);
    setDonorFormError('');

    const finalName = donorName.trim() || 'রক্তদাতা সদস্য';
    const finalPhone = donorPhone.trim();
    const finalArea = donorArea.trim() || 'পতেঙ্গা, চট্টগ্রাম';
    const finalTotal = donorTotal === '' ? 1 : Number(donorTotal);

    try {
      if (editingDonor && onEditDonor) {
        await onEditDonor({
          ...editingDonor,
          name: finalName,
          phone: finalPhone,
          bloodGroup: donorGroup,
          area: finalArea,
          lastDonationDate: donorLastDate || undefined,
          totalDonations: finalTotal,
          isAvailable: donorIsAvailable
        });
        setNoticeMsg(`রক্তদাতা "${finalName}" এর তথ্য সফলভাবে আপডেট ও ডাটাবেসে সংরক্ষিত হয়েছে`);
      } else if (onAddDonor) {
        await onAddDonor({
          name: finalName,
          phone: finalPhone,
          bloodGroup: donorGroup,
          area: finalArea,
          lastDonationDate: donorLastDate || undefined,
          totalDonations: finalTotal,
          isAvailable: donorIsAvailable
        });
        setNoticeMsg(`নতুন রক্তদাতা "${finalName}" সফলভাবে ডাটাবেসে যুক্ত হয়েছে ও লাইভ সিঙ্ক সম্পন্ন`);
      }
      setIsAddDonorModalOpen(false);
      setEditingDonor(null);
      setTimeout(() => setNoticeMsg(''), 3500);
    } catch {
      setDonorFormError('রক্তদাতার তথ্য সংরক্ষণে সমস্যা হয়েছে, পুনরায় চেষ্টা করুন');
    } finally {
      setIsSavingDonor(false);
    }
  };

  const handleConfirmDeleteDonor = async (id: string, name: string) => {
    if (!onDeleteDonor) return;
    try {
      await onDeleteDonor(id);
      setDeletingDonorId(null);
      setNoticeMsg(`রক্তদাতা "${name}" সফলভাবে মুছে ফেলা হয়েছে`);
      setTimeout(() => setNoticeMsg(''), 3000);
    } catch {
      setErrorMsg('মুছে ফেলার প্রক্রিয়ায় ত্রুটি হয়েছে');
      setTimeout(() => setErrorMsg(''), 3000);
    }
  };

  const handleToggleDonorAvailability = async (donor: BloodDonor) => {
    if (!onEditDonor) return;
    const newAvail = donor.isAvailable === false ? true : false;
    try {
      await onEditDonor({
        ...donor,
        isAvailable: newAvail
      });
      setNoticeMsg(`রক্তদাতা ${donor.name} এর প্রাপ্যতা ${newAvail ? 'সক্রিয়' : 'নিষ্ক্রিয়'} করা হয়েছে`);
      setTimeout(() => setNoticeMsg(''), 2500);
    } catch {
      setErrorMsg('স্ট্যাটাস পরিবর্তনে সমস্যা হয়েছে');
      setTimeout(() => setErrorMsg(''), 3000);
    }
  };

  // Fund & Manual Net Balance Management States
  const [inputNetBalance, setInputNetBalance] = useState<string>(
    manualTotalBalance !== null && manualTotalBalance !== undefined ? manualTotalBalance.toString() : '0'
  );
  const [inputMonthlyExpense, setInputMonthlyExpense] = useState<string>(
    monthlyExpense !== undefined ? monthlyExpense.toString() : '0'
  );
  const [inputExtraMoney, setInputExtraMoney] = useState<string>(
    extraMoney !== undefined ? extraMoney.toString() : '0'
  );
  const [fundSearch, setFundSearch] = useState('');
  const [fundStatusFilter, setFundStatusFilter] = useState<'all' | PaymentStatus>('all');
  const [copiedFundPhone, setCopiedFundPhone] = useState<string | null>(null);

  // Dedicated Net Balance Modal State
  const [isNetBalanceModalOpen, setIsNetBalanceModalOpen] = useState(false);

  // Dedicated Fund Record Edit Modal State (Requirement 4: Admin Control for Dues, Payments, and Months)
  const [editingFundRecord, setEditingFundRecord] = useState<FundRecord | null>(null);
  const [editFundStatus, setEditFundStatus] = useState<PaymentStatus>('Due');
  const [editFundAmount, setEditFundAmount] = useState<string>('500');
  const [editFundPaidAmount, setEditFundPaidAmount] = useState<string>('0');
  const [editFundDueAmount, setEditFundDueAmount] = useState<string>('500');
  const [editFundMonth, setEditFundMonth] = useState<string>('মার্চ ২০২৬');
  const [editFundPaidMonths, setEditFundPaidMonths] = useState<string>('');
  const [editFundDueMonths, setEditFundDueMonths] = useState<string>('মার্চ ২০২৬');
  const [editFundDate, setEditFundDate] = useState<string>('');
  const [editFundNotes, setEditFundNotes] = useState<string>('');
  const [isSavingFundEdit, setIsSavingFundEdit] = useState<boolean>(false);

  const handleOpenEditFund = (rec: FundRecord) => {
    setEditingFundRecord(rec);
    setEditFundStatus(rec.status);
    setEditFundAmount(rec.amount !== undefined ? rec.amount.toString() : '500');
    setEditFundPaidAmount(
      rec.paidAmount !== undefined 
        ? rec.paidAmount.toString() 
        : (rec.status === 'Paid' ? (rec.amount || 500).toString() : '0')
    );
    setEditFundDueAmount(
      rec.dueAmount !== undefined 
        ? rec.dueAmount.toString() 
        : (rec.status === 'Due' ? (rec.amount || 500).toString() : '0')
    );
    setEditFundMonth(rec.notes || rec.month || 'রানিং মাস');
    setEditFundNotes(rec.notes || rec.month || 'রানিং মাস');
    setEditFundDate(rec.date || new Date().toISOString().split('T')[0]);
  };

  const handleSaveFundRecordEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFundRecord) return;

    const parsedAmount = parseFloat(editFundAmount);
    const amount = isNaN(parsedAmount) ? 0 : parsedAmount;
    const isPaid = editFundStatus === 'Paid';
    const noteText = editFundNotes.trim() || 'রানিং মাস';

    const paidAmount = isPaid ? amount : 0;
    const dueAmount = !isPaid ? amount : 0;

    setIsSavingFundEdit(true);
    try {
      const resolvedMemberId = editingFundRecord.memberId || (
        editingFundRecord.id.startsWith('fund-member-')
          ? editingFundRecord.id.replace('fund-member-', '')
          : undefined
      );

      const updated: FundRecord = {
        ...editingFundRecord,
        memberId: resolvedMemberId,
        status: editFundStatus,
        amount,
        paidAmount,
        dueAmount,
        month: noteText,
        paidMonths: isPaid ? noteText : '',
        dueMonths: !isPaid ? noteText : '',
        date: editingFundRecord.date || new Date().toISOString().split('T')[0],
        notes: noteText,
        description: noteText,
        approvedAt: isPaid ? (editingFundRecord.approvedAt || new Date().toISOString()) : undefined
      };

      if (onEditFundRecord) {
        await onEditFundRecord(updated);
      }
      setEditingFundRecord(null);
      setNoticeMsg(`"${updated.memberName}"-এর চাঁদা ও বকেয়া তথ্য সফলভাবে সংরক্ষিত হয়েছে`);
      setTimeout(() => setNoticeMsg(''), 3000);
    } catch {
      setErrorMsg('চাঁদা তথ্য সংরক্ষণে সমস্যা হয়েছে');
      setTimeout(() => setErrorMsg(''), 3000);
    } finally {
      setIsSavingFundEdit(false);
    }
  };

  const handleSaveMonthlyExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(inputMonthlyExpense);
    const amount = isNaN(parsed) ? 0 : parsed;
    if (onUpdateMonthlyExpense) {
      onUpdateMonthlyExpense(amount);
    }
    setNoticeMsg(`মাসিক খরচ সফলভাবে ${formatBengaliCurrency(amount)} নির্ধারণ করা হয়েছে`);
    setTimeout(() => setNoticeMsg(''), 3000);
  };

  const handleSaveExtraMoney = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(inputExtraMoney);
    const amount = isNaN(parsed) ? 0 : parsed;
    if (onUpdateExtraMoney) {
      onUpdateExtraMoney(amount);
    }
    setNoticeMsg(`এক্সট্রা টাকা সফলভাবে ${formatBengaliCurrency(amount)} নির্ধারণ করা হয়েছে`);
    setTimeout(() => setNoticeMsg(''), 3000);
  };

  useEffect(() => {
    if (manualTotalBalance !== null && manualTotalBalance !== undefined) {
      setInputNetBalance(manualTotalBalance.toString());
    }
  }, [manualTotalBalance]);

  useEffect(() => {
    if (monthlyExpense !== undefined) {
      setInputMonthlyExpense(monthlyExpense.toString());
    }
  }, [monthlyExpense]);

  useEffect(() => {
    if (extraMoney !== undefined) {
      setInputExtraMoney(extraMoney.toString());
    }
  }, [extraMoney]);

  // Auto-sync members to fund records: 100% complete and up-to-date
  const effectiveAdminFunds = useMemo(() => {
    return autoSyncMembersToFunds(members, funds);
  }, [members, funds]);

  // Fast Member Lookup Map for photo & live auto-synced profile
  const adminMemberMap = useMemo(() => {
    const map = new Map<string, Member>();
    members.forEach(m => {
      if (m.id) map.set(m.id, m);
      if (m.phone) map.set(sanitizePhone(m.phone), m);
    });
    return map;
  }, [members]);

  const filteredAdminFunds = useMemo(() => {
    return effectiveAdminFunds.filter(f => {
      if (fundStatusFilter !== 'all' && f.status !== fundStatusFilter) return false;
      if (fundSearch.trim()) {
        const q = fundSearch.trim().toLowerCase();
        const matchesName = (f.memberName || '').toLowerCase().includes(q);
        const matchesPhone = (f.phone || '').includes(q);
        const matchesDesc = (f.description || '').toLowerCase().includes(q);
        const matchesMonth = (f.month || '').toLowerCase().includes(q);
        const matchesDesignation = (f.designation || '').toLowerCase().includes(q);
        const matchesPaidMonths = (f.paidMonths || '').toLowerCase().includes(q);
        const matchesDueMonths = (f.dueMonths || '').toLowerCase().includes(q);
        return matchesName || matchesPhone || matchesDesc || matchesMonth || matchesDesignation || matchesPaidMonths || matchesDueMonths;
      }
      return true;
    });
  }, [effectiveAdminFunds, fundStatusFilter, fundSearch]);

  const handleSaveManualBalance = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(inputNetBalance);
    const amount = isNaN(parsed) ? 0 : parsed;
    if (onUpdateManualTotalBalance) {
      onUpdateManualTotalBalance(amount);
      setNoticeMsg(`বর্তমান নেট ব্যালেন্স সফলভাবে "${formatBengaliCurrency(amount)}" নির্ধারণ করা হয়েছে`);
      setTimeout(() => setNoticeMsg(''), 3000);
    }
    setIsNetBalanceModalOpen(false);
  };

  const handleToggleFund = async (id: string, currentStatus: PaymentStatus) => {
    const newStatus: PaymentStatus = currentStatus === 'Paid' ? 'Due' : 'Paid';
    if (onToggleFundStatus) {
      await onToggleFundStatus(id, newStatus);
      setNoticeMsg(`চাঁদা স্ট্যাটাস সফলভাবে '${newStatus === 'Paid' ? 'পরিশোধিত' : 'বকেয়া'}' করা হয়েছে`);
      setTimeout(() => setNoticeMsg(''), 3000);
    }
  };

  const handleSendFundSms = (rec: FundRecord) => {
    const phone = rec.phone;
    if (!phone) {
      setErrorMsg('এই সদস্যের মোবাইল নম্বর যুক্ত নেই');
      setTimeout(() => setErrorMsg(''), 3000);
      return;
    }

    let text = '';
    if (rec.status === 'Paid') {
      text = generateDirectSimPaidSms({
        memberName: rec.memberName,
        months: rec.month || 'চলতি',
        money: rec.amount
      });
    } else {
      text = generateDirectSimDueSms({
        memberName: rec.memberName,
        money: rec.amount,
        monthCount: 1
      });
    }

    triggerDirectSimSms(phone, text);
    navigator.clipboard.writeText(text);
    setNoticeMsg(`${rec.memberName}-এর জন্য মেসেজ ক্লিপবোর্ডে কপি হয়েছে`);
    setTimeout(() => setNoticeMsg(''), 3500);
  };

  // Member Form (No blood group, No email)
  const [memName, setMemName] = useState('');
  const [memDesignation, setMemDesignation] = useState('সাধারণ সদস্য');
  const [memPhone, setMemPhone] = useState('');
  const [memArea, setMemArea] = useState('পতেঙ্গা, চট্টগ্রাম');
  const [memIsExecutive, setMemIsExecutive] = useState(false);
  const [memIsExpatriate, setMemIsExpatriate] = useState(false);
  const [memCountry, setMemCountry] = useState('');
  const [memPhoto, setMemPhoto] = useState('');
  const [memFormError, setMemFormError] = useState('');
  const [isSavingMember, setIsSavingMember] = useState(false);

  // Profile Form
  const [name, setName] = useState(profile.name);
  const [tagline, setTagline] = useState(profile.tagline);
  const [establishedDate, setEstablishedDate] = useState(profile.establishedDate);
  const [establishedYear, setEstablishedYear] = useState(profile.establishedYear);
  const [address, setAddress] = useState(profile.address);
  const [hotline, setHotline] = useState(profile.hotline || '');
  const [emergencyContact, setEmergencyContact] = useState(profile.emergencyContact || '');
  const [regNumber, setRegNumber] = useState(profile.regNumber || '');
  const [phone, setPhone] = useState(profile.phone || '');
  const [email, setEmail] = useState(profile.email || '');
  const [facebookUrl, setFacebookUrl] = useState(profile.facebookUrl || '');
  const [youtubeUrl, setYoutubeUrl] = useState(profile.youtubeUrl || '');
  const [logoUrl, setLogoUrl] = useState(profile.logoUrl || '');
  const [presidentName, setPresidentName] = useState(profile.presidentName || '');
  const [generalSecretaryName, setGeneralSecretaryName] = useState(profile.generalSecretaryName || '');
  const [financeSecretaryName, setFinanceSecretaryName] = useState(profile.financeSecretaryName || '');
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  // Sync profile when prop changes
  useEffect(() => {
    setName(profile.name);
    setTagline(profile.tagline);
    setEstablishedDate(profile.establishedDate);
    setEstablishedYear(profile.establishedYear);
    setAddress(profile.address);
    setHotline(profile.hotline || '');
    setEmergencyContact(profile.emergencyContact || '');
    setRegNumber(profile.regNumber || '');
    setPhone(profile.phone || '');
    setEmail(profile.email || '');
    setFacebookUrl(profile.facebookUrl || '');
    setYoutubeUrl(profile.youtubeUrl || '');
    setLogoUrl(profile.logoUrl || '');
    setPresidentName(profile.presidentName || '');
    setGeneralSecretaryName(profile.generalSecretaryName || '');
    setFinanceSecretaryName(profile.financeSecretaryName || '');
  }, [profile]);

  // Payment Form
  const [bkashNumber, setBkashNumber] = useState(paymentConfig.bkashNumber);
  const [bkashType, setBkashType] = useState(paymentConfig.bkashType);
  const [nagadNumber, setNagadNumber] = useState(paymentConfig.nagadNumber);
  const [nagadType, setNagadType] = useState(paymentConfig.nagadType);
  const [rocketNumber, setRocketNumber] = useState(paymentConfig.rocketNumber);
  const [rocketType, setRocketType] = useState(paymentConfig.rocketType);

  // PIN Form
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  
  const [noticeMsg, setNoticeMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [supabaseStatus, setSupabaseStatus] = useState<string>('সংযোগ পরীক্ষা হচ্ছে...');
  const [supabaseTableDetails, setSupabaseTableDetails] = useState<Record<string, boolean>>({});
  const [hasAnySupabaseTable, setHasAnySupabaseTable] = useState<boolean>(true);
  const [isSqlModalOpen, setIsSqlModalOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [configUrl, setConfigUrl] = useState(SUPABASE_URL);
  const [configKey, setConfigKey] = useState(SUPABASE_ANON_KEY);
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);
  const [cloudSyncFeedback, setCloudSyncFeedback] = useState<string | null>(null);
  const [sqlCopied, setSqlCopied] = useState(false);

  const refreshSupabaseStatus = React.useCallback(async () => {
    try {
      const res = await checkSupabaseTableDetails();
      setSupabaseStatus(res.connected ? (res.hasAnyTable ? 'সংযুক্ত ও সব টেবিল প্রস্তুত' : 'প্রোজেক্ট সংযুক্ত, কিন্তু টেবিল প্রয়োজন') : 'অফলাইন মোড');
      setSupabaseTableDetails(res.tables);
      setHasAnySupabaseTable(res.hasAnyTable);
    } catch {
      setSupabaseStatus('অফলাইন মোড');
    }
  }, []);

  React.useEffect(() => {
    refreshSupabaseStatus();
  }, [refreshSupabaseStatus]);

  const handleCopySqlScript = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(SUPABASE_SETUP_SQL);
        setSqlCopied(true);
        setTimeout(() => setSqlCopied(false), 3000);
      }
    } catch {
      // fallback
    }
  };

  const handleForcePushToSupabase = async () => {
    setIsCloudSyncing(true);
    setCloudSyncFeedback('Supabase ক্লাউডে আপলোড হচ্ছে...');
    try {
      const snapshot = getLocalSyncSnapshot();
      const res = await pushAllDataToSupabase(snapshot);
      if (res.success) {
        setCloudSyncFeedback(`সফলভাবে ${res.syncedKeys.length} টি সেকশনের ডাটা Supabase এ আপলোড হয়েছে!`);
        refreshSupabaseStatus();
      } else {
        setCloudSyncFeedback('আপলোড সম্পন্ন হয়নি। দয়া করে Supabase এ SQL স্ক্রিপ্টটি রান করে টেবিল তৈরি করুন।');
      }
    } catch (err: any) {
      setCloudSyncFeedback(`আপলোড ত্রুটি: ${err?.message || 'ব্যর্থ হয়েছে'}`);
    } finally {
      setIsCloudSyncing(false);
      setTimeout(() => setCloudSyncFeedback(null), 5000);
    }
  };

  const handleForcePullFromSupabase = async () => {
    setIsCloudSyncing(true);
    setCloudSyncFeedback('Supabase ক্লাউড থেকে ডাটা আনা হচ্ছে...');
    try {
      const res = await triggerFullCloudSync();
      setCloudSyncFeedback(res.message);
      refreshSupabaseStatus();
    } catch (err: any) {
      setCloudSyncFeedback(`সিঙ্ক ত্রুটি: ${err?.message || 'ব্যর্থ হয়েছে'}`);
    } finally {
      setIsCloudSyncing(false);
      setTimeout(() => setCloudSyncFeedback(null), 5000);
    }
  };

  const handleSaveCredentials = () => {
    if (!configUrl.trim() || !configKey.trim()) {
      setErrorMsg('Supabase URL ও Key উভয়ই প্রদান করা আবশ্যক');
      return;
    }
    updateSupabaseCredentials(configUrl.trim(), configKey.trim());
    setIsConfigModalOpen(false);
    setNoticeMsg('Supabase ক্রেডেনশিয়াল আপডেট করা হয়েছে');
    refreshSupabaseStatus();
    setTimeout(() => setNoticeMsg(''), 4000);
  };

  const handleResetCredentials = () => {
    resetSupabaseCredentials();
    setConfigUrl(SUPABASE_URL);
    setConfigKey(SUPABASE_ANON_KEY);
    setIsConfigModalOpen(false);
    setNoticeMsg('ডিফল্ট Supabase ক্রেডেনশিয়াল রিস্টোর করা হয়েছে');
    refreshSupabaseStatus();
    setTimeout(() => setNoticeMsg(''), 4000);
  };

  // Sorted members
  const sortedMembers = useMemo(() => {
    return sortMembersOldestFirst(members);
  }, [members]);

  // Filtered members in Admin
  const filteredMembers = useMemo(() => {
    if (!memberSearch.trim()) return sortedMembers;
    const q = memberSearch.trim().toLowerCase();
    return sortedMembers.filter(m => 
      m.name.toLowerCase().includes(q) ||
      (m.phone || '').includes(q) ||
      (m.designation || '').toLowerCase().includes(q) ||
      (m.area || '').toLowerCase().includes(q)
    );
  }, [sortedMembers, memberSearch]);

  const handleOpenAddModal = () => {
    setMemName('');
    setMemDesignation('সাধারণ সদস্য');
    setMemPhone('');
    setMemArea('পতেঙ্গা, চট্টগ্রাম');
    setMemIsExecutive(false);
    setMemIsExpatriate(false);
    setMemCountry('');
    setMemPhoto('');
    setMemFormError('');
    setIsAddMemberModalOpen(true);
  };

  const handleOpenEditModal = (m: Member) => {
    setEditingMember(m);
    setMemName(m.name);
    setMemDesignation(m.designation || 'সাধারণ সদস্য');
    setMemPhone(m.phone || '');
    setMemArea(m.area || '');
    setMemIsExecutive(Boolean(isExecutiveCommitteeMember(m)));
    setMemIsExpatriate(Boolean(isExpatriateMember(m)));
    setMemCountry(m.countryStatus || '');
    setMemPhoto(m.photoUrl || '');
    setMemFormError('');
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setMemFormError('ছবির সাইজ সর্বোচ্চ ১০ মেগাবাইট হতে পারবে');
      return;
    }

    try {
      const compressedBase64 = await compressImageFile(file, { maxWidth: 600, maxHeight: 600, quality: 0.8 });
      setMemPhoto(compressedBase64);
      setMemFormError('');
    } catch {
      setMemFormError('ছবি প্রসেসিংয়ে সমস্যা হয়েছে, পুনরায় চেষ্টা করুন');
    }
  };

  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingMember(true);
    setMemFormError('');

    const finalName = memName.trim() || 'নতুন সদস্য';
    const finalPhone = memPhone.trim() || '';
    const finalDesignation = memDesignation.trim() || 'সাধারণ সদস্য';
    const finalArea = memArea.trim() || 'পতেঙ্গা, চট্টগ্রাম';

    try {
      if (editingMember) {
        const updated: Member = {
          ...editingMember,
          name: finalName,
          designation: finalDesignation,
          phone: finalPhone,
          area: finalArea,
          isExecutive: memIsExecutive,
          isExpatriate: memIsExpatriate,
          countryStatus: memIsExpatriate ? (memCountry.trim() || 'প্রবাসী') : undefined,
          photoUrl: memPhoto || undefined,
          status: editingMember.status || 'সক্রিয়'
        };
        await onEditMember(updated);
        setEditingMember(null);
        setNoticeMsg(`"${updated.name}" এর তথ্য সফলভাবে আপডেট হয়েছে`);
      } else {
        // Unlimited members sequential serial
        let maxSerial = 0;
        members.forEach(m => {
          if (typeof m.serial === 'number' && !isNaN(m.serial) && m.serial > maxSerial) {
            maxSerial = m.serial;
          }
        });
        const nextSerial = Math.max(maxSerial, members.length) + 1;

        const newMem: Omit<Member, 'id'> = {
          name: finalName,
          designation: finalDesignation,
          phone: finalPhone,
          area: finalArea,
          status: 'সক্রিয়',
          joinDate: new Date().toISOString().split('T')[0],
          serial: nextSerial,
          isExecutive: memIsExecutive,
          isExpatriate: memIsExpatriate,
          countryStatus: memIsExpatriate ? (memCountry.trim() || 'প্রবাসী') : undefined,
          photoUrl: memPhoto || undefined,
          createdAt: new Date().toISOString()
        };
        await onAddMember(newMem);
        setIsAddMemberModalOpen(false);
        setNoticeMsg(`নতুন সদস্য "${newMem.name}" সফলভাবে যুক্ত হয়েছে`);
      }
      setTimeout(() => setNoticeMsg(''), 3000);
    } catch {
      setMemFormError('সংরক্ষণে সমস্যা হয়েছে। পুনরায় চেষ্টা করুন।');
    } finally {
      setIsSavingMember(false);
    }
  };

  // Permanent deletion
  const handleConfirmDeleteMember = async (id: string, name: string) => {
    try {
      await onDeleteMember(id);
      setDeletingMemberId(null);
      setNoticeMsg(`সদস্য "${name}" স্থায়ীভাবে তালিকা থেকে মুছে ফেলা হয়েছে`);
      setTimeout(() => setNoticeMsg(''), 3000);
    } catch {
      setErrorMsg('সদস্য মুছে ফেলতে সমস্যা হয়েছে');
      setTimeout(() => setErrorMsg(''), 3000);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('লোগো ফাইলের সাইজ সর্বোচ্চ ১০ মেগাবাইট হতে পারবে');
      setTimeout(() => setErrorMsg(''), 4000);
      return;
    }

    setIsUploadingLogo(true);
    try {
      const compressedBase64 = await compressImageFile(file, { maxWidth: 512, maxHeight: 512, quality: 0.85 });
      setLogoUrl(compressedBase64);
      setNoticeMsg('লোগো সফলভাবে লোড হয়েছে। "প্রোফাইল পরিবর্তন সংরক্ষণ" বাটনে চাপুন।');
      setTimeout(() => setNoticeMsg(''), 4000);
    } catch {
      setErrorMsg('লোগো প্রক্রিয়াকরণে সমস্যা হয়েছে');
      setTimeout(() => setErrorMsg(''), 4000);
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      ...profile,
      name: name.trim(),
      tagline: tagline.trim(),
      establishedDate: establishedDate.trim(),
      establishedYear: establishedYear.trim(),
      address: address.trim(),
      hotline: hotline.trim(),
      emergencyContact: emergencyContact.trim(),
      regNumber: regNumber.trim(),
      phone: phone.trim(),
      email: email.trim(),
      facebookUrl: facebookUrl.trim(),
      youtubeUrl: youtubeUrl.trim(),
      logoUrl: logoUrl.trim() || undefined,
      presidentName: presidentName.trim(),
      generalSecretaryName: generalSecretaryName.trim(),
      financeSecretaryName: financeSecretaryName.trim()
    });
    setNoticeMsg('সংগঠনের প্রোফাইল ও রসিদ স্বাক্ষরকারী তথ্য তাৎক্ষণিক সংরক্ষিত ও আপডেট হয়েছে');
    setTimeout(() => setNoticeMsg(''), 3000);
  };

  const handleSavePayments = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdatePaymentConfig({
      ...paymentConfig,
      bkashNumber,
      bkashType,
      nagadNumber,
      nagadType,
      rocketNumber,
      rocketType
    });
    setNoticeMsg('পেমেন্ট গেটওয়ে নম্বরসমূহ সফলভাবে সংরক্ষিত হয়েছে');
    setTimeout(() => setNoticeMsg(''), 3000);
  };

  const handleSavePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length < 4) {
      setErrorMsg('পিন কোড কমপক্ষে ৪ ডিজিটের হতে হবে');
      return;
    }
    if (newPin !== confirmPin) {
      setErrorMsg('উভয় পিন কোড মিলছে না');
      return;
    }
    saveAdminPin(newPin);
    setNewPin('');
    setConfirmPin('');
    setErrorMsg('');
    setNoticeMsg('অ্যাডমিন পিন কোড সফলভাবে পরিবর্তন করা হয়েছে');
    setTimeout(() => setNoticeMsg(''), 3000);
  };

  // ==========================================
  // SLIDES MANAGEMENT STATES & HANDLERS
  // ==========================================
  const [isSlideModalOpen, setIsSlideModalOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState<HomeSlide | null>(null);
  const [slideTitle, setSlideTitle] = useState('');
  const [slideDescription, setSlideDescription] = useState('');
  const [slideCategory, setSlideCategory] = useState('সাধারণ');
  const [slideDate, setSlideDate] = useState('২০২৬');
  const [slideLocation, setSlideLocation] = useState('পতেঙ্গা, চট্টগ্রাম');
  const [slideImageUrl, setSlideImageUrl] = useState('');
  const [slideIsActive, setSlideIsActive] = useState(true);

  const handleOpenAddSlide = () => {
    setEditingSlide(null);
    setSlideTitle('');
    setSlideDescription('');
    setSlideCategory('কেন্দ্রীয় মিলনমেলা');
    setSlideDate('২০২৬');
    setSlideLocation('পতেঙ্গা, চট্টগ্রাম');
    setSlideImageUrl('');
    setSlideIsActive(true);
    setIsSlideModalOpen(true);
  };

  const handleOpenEditSlide = (slide: HomeSlide) => {
    setEditingSlide(slide);
    setSlideTitle(slide.title);
    setSlideDescription(slide.description || '');
    setSlideCategory(slide.category || 'সাধারণ');
    setSlideDate(slide.date || '');
    setSlideLocation(slide.location || '');
    setSlideImageUrl(slide.imageUrl || '');
    setSlideIsActive(slide.isActive !== false);
    setIsSlideModalOpen(true);
  };

  const handleSlidePhotoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImageFile(file, { maxWidth: 1200, maxHeight: 800, quality: 0.8 });
        setSlideImageUrl(compressed);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleSaveSlide = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalImageUrl = slideImageUrl.trim() || 'https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=1200&q=80';
    const finalTitle = slideTitle.trim() || 'সংগঠনের গ্রুপ ফটো';

    try {
      if (editingSlide && onEditHomeSlide) {
        await onEditHomeSlide({
          ...editingSlide,
          title: finalTitle,
          imageUrl: finalImageUrl,
          isActive: slideIsActive
        });
        setNoticeMsg('স্লাইডার ছবি সফলভাবে আপডেট করা হয়েছে');
      } else if (onAddHomeSlide) {
        await onAddHomeSlide({
          title: finalTitle,
          imageUrl: finalImageUrl,
          isActive: slideIsActive
        });
        setNoticeMsg('স্লাইডারে নতুন ছবি সফলভাবে যুক্ত হয়েছে');
      }
      setIsSlideModalOpen(false);
      setTimeout(() => setNoticeMsg(''), 3500);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteSlide = async (id: string) => {
    if (!window.confirm('আপনি কি নিশ্চিত যে এই স্লাইডার ছবিটি মুছে ফেলতে চান?')) return;
    if (onDeleteHomeSlide) {
      await onDeleteHomeSlide(id);
      setNoticeMsg('স্লাইডার ছবি সফলভাবে মুছে ফেলা হয়েছে');
      setTimeout(() => setNoticeMsg(''), 3000);
    }
  };

  const handleToggleSlideActive = async (slide: HomeSlide) => {
    if (onEditHomeSlide) {
      await onEditHomeSlide({
        ...slide,
        isActive: slide.isActive === false ? true : false
      });
      setNoticeMsg('স্লাইডার স্ট্যাটাস পরিবর্তিত হয়েছে');
      setTimeout(() => setNoticeMsg(''), 2500);
    }
  };

  // ==========================================
  // AID & DONATIONS MANAGEMENT STATES & HANDLERS
  // ==========================================
  const [isDonationModalOpen, setIsDonationModalOpen] = useState(false);
  const [editingDonation, setEditingDonation] = useState<AidDonationRecord | null>(null);
  const [donationRecipientName, setDonationRecipientName] = useState('');
  const [donationPhotoUrl, setDonationPhotoUrl] = useState('');
  const [donationAddress, setDonationAddress] = useState('');
  const [donationProviderRef, setDonationProviderRef] = useState('');
  const [donationAmount, setDonationAmount] = useState('');
  const [donationDate, setDonationDate] = useState('');
  const [donationDescription, setDonationDescription] = useState('');
  const [donationBkash, setDonationBkash] = useState('');
  const [donationNagad, setDonationNagad] = useState('');
  const [donationRocket, setDonationRocket] = useState('');
  const [donationAdminSearch, setDonationAdminSearch] = useState('');

  const handleOpenAddDonation = () => {
    setEditingDonation(null);
    setDonationRecipientName('');
    setDonationPhotoUrl('');
    setDonationAddress('পতেঙ্গা, চট্টগ্রাম');
    setDonationProviderRef('মোঃ কামরুল হাসান (সভাপতি)');
    setDonationAmount('10000');
    setDonationDate(new Date().toLocaleDateString('bn-BD'));
    setDonationDescription('');
    setDonationBkash('');
    setDonationNagad('');
    setDonationRocket('');
    setIsDonationModalOpen(true);
  };

  const handleOpenEditDonation = (item: AidDonationRecord) => {
    setEditingDonation(item);
    setDonationRecipientName(item.recipientName);
    setDonationPhotoUrl(item.photoUrl || '');
    setDonationAddress(item.address || '');
    setDonationProviderRef(item.providerReference || '');
    setDonationAmount(item.amount ? item.amount.toString() : '');
    setDonationDate(item.date || '');
    setDonationDescription(item.description || '');
    setDonationBkash(item.bkashNumber || '');
    setDonationNagad(item.nagadNumber || '');
    setDonationRocket(item.rocketNumber || '');
    setIsDonationModalOpen(true);
  };

  const handleDonationPhotoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImageFile(file, { maxWidth: 600, maxHeight: 600, quality: 0.8 });
        setDonationPhotoUrl(compressed);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleSaveDonation = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalRecipient = donationRecipientName.trim() || 'অনুল্লেখিত সাহায্যপ্রাপ্ত';
    const parsedAmt = parseFloat(donationAmount);
    const amt = isNaN(parsedAmt) ? 0 : parsedAmt;
    const finalProviderRef = donationProviderRef.trim() || 'দায়িত্বশীল রেফারেন্স';
    const finalAddress = donationAddress.trim() || 'পতেঙ্গা, চট্টগ্রাম';
    const finalDate = donationDate.trim() || new Date().toLocaleDateString('bn-BD');

    try {
      if (editingDonation && onEditAidDonation) {
        await onEditAidDonation({
          ...editingDonation,
          recipientName: finalRecipient,
          photoUrl: donationPhotoUrl.trim(),
          address: finalAddress,
          providerReference: finalProviderRef,
          amount: amt,
          date: finalDate,
          description: donationDescription.trim(),
          bkashNumber: donationBkash.trim() || undefined,
          nagadNumber: donationNagad.trim() || undefined,
          rocketNumber: donationRocket.trim() || undefined
        });
        setNoticeMsg('অনুদান ও সাহায্য রেকর্ড সফলভাবে আপডেট করা হয়েছে');
      } else if (onAddAidDonation) {
        await onAddAidDonation({
          recipientName: finalRecipient,
          photoUrl: donationPhotoUrl.trim(),
          address: finalAddress,
          providerReference: finalProviderRef,
          amount: amt,
          date: finalDate,
          description: donationDescription.trim(),
          bkashNumber: donationBkash.trim() || undefined,
          nagadNumber: donationNagad.trim() || undefined,
          rocketNumber: donationRocket.trim() || undefined
        });
        setNoticeMsg('নতুন সাহায্য রেকর্ড সফলভাবে যোগ করা হয়েছে');
      }
      setIsDonationModalOpen(false);
      setTimeout(() => setNoticeMsg(''), 3500);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteDonation = async (id: string) => {
    if (!window.confirm('আপনি কি নিশ্চিত যে এই অনুদান রেকর্ডটি স্থায়ীভাবে মুছে ফেলতে চান?')) return;
    if (onDeleteAidDonation) {
      await onDeleteAidDonation(id);
      setNoticeMsg('অনুদান রেকর্ড মুছে ফেলা হয়েছে');
      setTimeout(() => setNoticeMsg(''), 3000);
    }
  };

  // ==========================================
  // EXTRA CONTRIBUTIONS MANAGEMENT STATES & HANDLERS
  // ==========================================
  const [isContribModalOpen, setIsContribModalOpen] = useState(false);
  const [editingContrib, setEditingContrib] = useState<ExtraContributionRecord | null>(null);
  const [contribDonorName, setContribDonorName] = useState('');
  const [contribPhotoUrl, setContribPhotoUrl] = useState('');
  const [contribAddress, setContribAddress] = useState('');
  const [contribProviderRef, setContribProviderRef] = useState('');
  const [contribAmount, setContribAmount] = useState('');
  const [contribDate, setContribDate] = useState('');
  const [contribDescription, setContribDescription] = useState('');
  const [contribBkash, setContribBkash] = useState('');
  const [contribNagad, setContribNagad] = useState('');
  const [contribRocket, setContribRocket] = useState('');
  const [contribAdminSearch, setContribAdminSearch] = useState('');

  const handleOpenAddContrib = () => {
    setEditingContrib(null);
    setContribDonorName('');
    setContribPhotoUrl('');
    setContribAddress('প্রবাসী / চট্টগ্রাম');
    setContribProviderRef('মোঃ কামরুল হাসান (সভাপতি)');
    setContribAmount('20000');
    setContribDate(new Date().toLocaleDateString('bn-BD'));
    setContribDescription('');
    setContribBkash('');
    setContribNagad('');
    setContribRocket('');
    setIsContribModalOpen(true);
  };

  const handleOpenEditContrib = (item: ExtraContributionRecord) => {
    setEditingContrib(item);
    setContribDonorName(item.donorName);
    setContribPhotoUrl(item.photoUrl || '');
    setContribAddress(item.address || '');
    setContribProviderRef(item.providerReference || '');
    setContribAmount(item.amount ? item.amount.toString() : '');
    setContribDate(item.date || '');
    setContribDescription(item.description || '');
    setContribBkash(item.bkashNumber || '');
    setContribNagad(item.nagadNumber || '');
    setContribRocket(item.rocketNumber || '');
    setIsContribModalOpen(true);
  };

  const handleContribPhotoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImageFile(file, { maxWidth: 600, maxHeight: 600, quality: 0.8 });
        setContribPhotoUrl(compressed);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleSaveContrib = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalDonor = contribDonorName.trim() || 'শুভাকাঙ্ক্ষী অনুদানকারী';
    const parsedAmt = parseFloat(contribAmount);
    const amt = isNaN(parsedAmt) ? 0 : parsedAmt;
    const finalProviderRef = contribProviderRef.trim() || 'সাধারণ অনুদান';
    const finalAddress = contribAddress.trim() || '';
    const finalDate = contribDate.trim() || new Date().toLocaleDateString('bn-BD');

    try {
      if (editingContrib && onEditExtraContribution) {
        await onEditExtraContribution({
          ...editingContrib,
          donorName: finalDonor,
          photoUrl: contribPhotoUrl.trim(),
          address: finalAddress,
          providerReference: finalProviderRef,
          amount: amt,
          date: finalDate,
          description: contribDescription.trim()
        });
        setNoticeMsg('অতিরিক্ত অনুদান রেকর্ড সফলভাবে আপডেট করা হয়েছে');
      } else if (onAddExtraContribution) {
        await onAddExtraContribution({
          donorName: finalDonor,
          photoUrl: contribPhotoUrl.trim(),
          address: finalAddress,
          providerReference: finalProviderRef,
          amount: amt,
          date: finalDate,
          description: contribDescription.trim()
        });
        setNoticeMsg('নতুন অতিরিক্ত অনুদান রেকর্ড সফলভাবে যোগ করা হয়েছে');
      }
      setIsContribModalOpen(false);
      setTimeout(() => setNoticeMsg(''), 3500);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteContrib = async (id: string) => {
    if (!window.confirm('আপনি কি নিশ্চিত যে এই অতিরিক্ত অনুদান রেকর্ডটি স্থায়ীভাবে মুছে ফেলতে চান?')) return;
    if (onDeleteExtraContribution) {
      await onDeleteExtraContribution(id);
      setNoticeMsg('অতিরিক্ত অনুদান রেকর্ড মুছে ফেলা হয়েছে');
      setTimeout(() => setNoticeMsg(''), 3000);
    }
  };

  // ==========================================
  // ORGANIZATION RULES MANAGEMENT
  // ==========================================
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<OrganizationRule | null>(null);
  const [rulePointNumber, setRulePointNumber] = useState<number>(1);
  const [ruleText, setRuleText] = useState('');
  const [ruleCategory, setRuleCategory] = useState('মৌলিক আদর্শ');
  const [ruleIsActive, setRuleIsActive] = useState(true);

  const handleOpenAddRule = () => {
    setEditingRule(null);
    let nextPoint = 1;
    if (organizationRules.length > 0) {
      nextPoint = Math.max(...organizationRules.map(r => r.pointNumber || 0)) + 1;
    }
    setRulePointNumber(nextPoint);
    setRuleText('');
    setRuleCategory('মৌলিক আদর্শ');
    setRuleIsActive(true);
    setIsRuleModalOpen(true);
  };

  const handleOpenEditRule = (rule: OrganizationRule) => {
    setEditingRule(rule);
    setRulePointNumber(rule.pointNumber);
    setRuleText(rule.ruleText);
    setRuleCategory(rule.category || 'সাধারণ');
    setRuleIsActive(rule.isActive !== false);
    setIsRuleModalOpen(true);
  };

  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalRuleText = ruleText.trim() || 'সংগঠনের নিয়মাবলি ও গঠনতন্ত্রের নীতিমালা মেনে চলুন।';

    try {
      if (editingRule && onEditRule) {
        await onEditRule({
          ...editingRule,
          pointNumber: Number(rulePointNumber) || 1,
          ruleText: finalRuleText,
          category: ruleCategory.trim() || 'মৌলিক আদর্শ',
          isActive: ruleIsActive
        });
        setNoticeMsg('নিয়মাবলি সফলভাবে আপডেট করা হয়েছে');
      } else if (onAddRule) {
        await onAddRule({
          pointNumber: Number(rulePointNumber) || 1,
          ruleText: finalRuleText,
          category: ruleCategory.trim() || 'মৌলিক আদর্শ',
          isActive: ruleIsActive
        });
        setNoticeMsg('নতুন নিয়মাবলি সফলভাবে যুক্ত হয়েছে');
      }
      setIsRuleModalOpen(false);
      setTimeout(() => setNoticeMsg(''), 3500);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteRule = async (id: string) => {
    if (!window.confirm('আপনি কি নিশ্চিত যে এই নিয়মটি স্থায়ীভাবে মুছে ফেলতে চান?')) return;
    if (onDeleteRule) {
      await onDeleteRule(id);
      setNoticeMsg('নিয়মাবলি সফলভাবে মুছে ফেলা হয়েছে');
      setTimeout(() => setNoticeMsg(''), 3000);
    }
  };

  const handleToggleRuleActive = async (rule: OrganizationRule) => {
    if (onEditRule) {
      await onEditRule({
        ...rule,
        isActive: rule.isActive === false ? true : false
      });
      setNoticeMsg(rule.isActive === false ? 'ধারাটি সক্রিয় করা হয়েছে' : 'ধারাটি নিষ্ক্রিয় করা হয়েছে');
      setTimeout(() => setNoticeMsg(''), 2500);
    }
  };

  // ==========================================
  // SUPPORT TEAM MANAGEMENT STATES & HANDLERS (Admin-Exclusive)
  // ==========================================
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [editingSupport, setEditingSupport] = useState<SupportTeamMember | null>(null);
  const [suppName, setSuppName] = useState('');
  const [suppPhone, setSuppPhone] = useState('');
  const [suppDesignation, setSuppDesignation] = useState('');
  const [suppCategory, setSuppCategory] = useState('সাধারণ সহায়তা');
  const [suppSubject, setSuppSubject] = useState('');
  const [suppDescription, setSuppDescription] = useState('');
  const [suppAvailableHours, setSuppAvailableHours] = useState('সকাল ৯টা - রাত ১০টা');
  const [suppPhoto, setSuppPhoto] = useState('');
  const [suppSearch, setSuppSearch] = useState('');
  const [isSavingSupport, setIsSavingSupport] = useState(false);
  const [suppFormError, setSuppFormError] = useState('');

  const handleOpenAddSupport = () => {
    setEditingSupport(null);
    setSuppName('');
    setSuppPhone('');
    setSuppDesignation('সাপোর্ট সমন্বয়ক');
    setSuppCategory('সাধারণ সহায়তা');
    setSuppSubject('');
    setSuppDescription('');
    setSuppAvailableHours('সকাল ৯টা - রাত ১০টা');
    setSuppPhoto('');
    setSuppFormError('');
    setIsSupportModalOpen(true);
  };

  const handleOpenEditSupport = (item: SupportTeamMember) => {
    setEditingSupport(item);
    setSuppName(item.name || '');
    setSuppPhone(item.phone || '');
    setSuppDesignation(item.designation || 'সাপোর্ট সমন্বয়ক');
    setSuppCategory(item.category || 'সাধারণ সহায়তা');
    setSuppSubject(item.subject || '');
    setSuppDescription(item.description || '');
    setSuppAvailableHours(item.availableHours || 'সকাল ৯টা - রাত ১০টা');
    setSuppPhoto(item.photoUrl || '');
    setSuppFormError('');
    setIsSupportModalOpen(true);
  };

  const handleSupportPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setSuppFormError('ছবির সাইজ সর্বোচ্চ ১০ মেগাবাইট হতে পারবে');
      return;
    }

    try {
      const compressed = await compressImageFile(file, { maxWidth: 600, maxHeight: 600, quality: 0.8 });
      setSuppPhoto(compressed);
      setSuppFormError('');
    } catch {
      setSuppFormError('ছবি প্রসেসিংয়ে সমস্যা হয়েছে, পুনরায় চেষ্টা করুন');
    }
  };

  const handleSaveSupport = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSupport(true);
    setSuppFormError('');

    const finalName = suppName.trim() || 'সাপোর্ট প্রতিনিধি';
    const finalPhone = suppPhone.trim();
    const finalDesignation = suppDesignation.trim() || 'সাপোর্ট সমন্বয়ক';
    const finalCategory = suppCategory.trim() || 'সাধারণ সহায়তা';
    const finalSubject = suppSubject.trim() || 'সাধারণ সহায়তা';
    const finalDescription = suppDescription.trim() || 'যেকোনো সহায়তার জন্য সরাসরি যোগাযোগ করুন।';
    const finalHours = suppAvailableHours.trim() || 'সকাল ৯টা - রাত ১০টা';

    try {
      if (editingSupport && onEditSupportMember) {
        await onEditSupportMember({
          ...editingSupport,
          name: finalName,
          phone: finalPhone,
          designation: finalDesignation,
          category: finalCategory,
          subject: finalSubject,
          description: finalDescription,
          availableHours: finalHours,
          photoUrl: suppPhoto || undefined
        });
        setNoticeMsg(`প্রতিনিধি "${finalName}" এর তথ্য সফলভাবে আপডেট করা হয়েছে`);
      } else if (onAddSupportMember) {
        const serial = (supportMembers.length || 0) + 1;
        await onAddSupportMember({
          name: finalName,
          phone: finalPhone,
          designation: finalDesignation,
          category: finalCategory,
          subject: finalSubject,
          description: finalDescription,
          availableHours: finalHours,
          photoUrl: suppPhoto || undefined,
          serial
        });
        setNoticeMsg(`নতুন প্রতিনিধি "${finalName}" সফলভাবে যুক্ত করা হয়েছে`);
      }
      setIsSupportModalOpen(false);
      setTimeout(() => setNoticeMsg(''), 3000);
    } catch {
      setSuppFormError('সংরক্ষণে সমস্যা হয়েছে, পুনরায় চেষ্টা করুন');
    } finally {
      setIsSavingSupport(false);
    }
  };

  const handleDeleteSupport = async (id: string, name: string) => {
    if (!window.confirm(`আপনি কি নিশ্চিতভাবে প্রতিনিধি "${name}" কে তালিকা থেকে মুছে ফেলতে চান?`)) {
      return;
    }
    try {
      if (onDeleteSupportMember) {
        await onDeleteSupportMember(id);
        setNoticeMsg(`প্রতিনিধি "${name}" সফলভাবে মুছে ফেলা হয়েছে`);
        setTimeout(() => setNoticeMsg(''), 3000);
      }
    } catch {
      setErrorMsg('মুছে ফেলতে সমস্যা হয়েছে');
      setTimeout(() => setErrorMsg(''), 3000);
    }
  };

  const filteredSupportMembers = useMemo(() => {
    if (!suppSearch.trim()) return supportMembers;
    const q = suppSearch.trim().toLowerCase();
    return supportMembers.filter(m => 
      m.name.toLowerCase().includes(q) ||
      (m.phone || '').includes(q) ||
      (m.designation || '').toLowerCase().includes(q) ||
      (m.subject || '').toLowerCase().includes(q) ||
      (m.category || '').toLowerCase().includes(q)
    );
  }, [supportMembers, suppSearch]);

  return (
    <div className="space-y-6 pb-20 sm:pb-8 w-full max-w-full overflow-x-clip">
      {/* Header */}
      <div className="bg-slate-900 rounded-3xl p-5 sm:p-6 text-white shadow-lg flex justify-between items-center flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Settings className="w-6 h-6 text-amber-400" />
            <h2 className="text-xl sm:text-2xl font-black">
              অ্যাডমিন কন্ট্রোল প্যানেল
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            সদস্য ব্যবস্থাপনা, সংগঠনের তথ্য, পেমেন্ট নম্বর ও নিরাপত্তা নিয়ন্ত্রণ
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onLogout && (
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition cursor-pointer shadow-sm active:scale-95"
              title="অ্যাডমিন প্যানেল থেকে লগআউট করুন"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>লগআউট</span>
            </button>
          )}
          <button
            onClick={onBack}
            className="px-4 py-2 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition cursor-pointer"
          >
            হোমে ফিরে যান
          </button>
        </div>
      </div>

      {noticeMsg && (
        <div className="p-4 rounded-2xl bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>{noticeMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-100 border border-rose-300 text-rose-900 text-xs font-bold flex items-center gap-2 shadow-xs">
          <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Real-time Security Alert Banner */}
      {unresolvedAlerts.length > 0 && (
        <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-300 text-rose-900 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5 text-rose-700 animate-pulse" />
            </div>
            <div>
              <h4 className="text-sm font-black text-rose-950 flex items-center gap-2">
                <span>জরুরি নিরাপত্তা সতর্কতা</span>
                <span className="px-2 py-0.5 rounded-full bg-rose-200 text-rose-900 text-[10px] font-bold">
                  {toBengaliNumber(unresolvedAlerts.length)}টি অ্যালার্ট
                </span>
              </h4>
              <p className="text-xs text-rose-800 mt-0.5">
                ভিন্ন ডিভাইস বা আইপি থেকে সদস্য অ্যাকাউন্টে সন্দেহজনক লগইন সনাক্ত হয়েছে। তাৎক্ষণিক পর্যালোচনা করুন।
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setActiveTab('registrations');
              setRegSubTab('alerts');
            }}
            className="px-4 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold transition cursor-pointer shadow-xs whitespace-nowrap"
          >
            সতর্কতা দেখুন ও ব্যবস্থা নিন
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('members')}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
            activeTab === 'members'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>সদস্য ব্যবস্থাপনা ({toBengaliNumber(members.length)})</span>
        </button>

        <button
          onClick={() => setActiveTab('donors')}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
            activeTab === 'donors'
              ? 'bg-rose-700 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Droplet className="w-4 h-4 text-rose-500" />
          <span>রক্তদাতা ব্যবস্থাপনা ({toBengaliNumber(donors.length)})</span>
        </button>

        <button
          onClick={() => setActiveTab('registrations')}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-bold transition cursor-pointer whitespace-nowrap relative ${
            activeTab === 'registrations'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <UserCheck className="w-4 h-4 text-emerald-400" />
          <span>নিবন্ধন আবেদন ও অনুমোদন</span>
          {pendingAccounts.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black animate-pulse">
              {toBengaliNumber(pendingAccounts.length)} অপেক্ষমাণ
            </span>
          )}
          {unresolvedAlerts.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-black">
              {toBengaliNumber(unresolvedAlerts.length)} সতর্কতা
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('funds')}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
            activeTab === 'funds'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Wallet className="w-4 h-4" />
          <span>তহবিল ও চাঁদা ব্যবস্থাপনা ({toBengaliNumber(effectiveAdminFunds.length)})</span>
        </button>

        {/* Dedicated Payment Verification Tab (Requirement 2) */}
        <button
          onClick={() => setActiveTab('verification')}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-bold transition cursor-pointer whitespace-nowrap relative ${
            activeTab === 'verification'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Receipt className="w-4 h-4 text-amber-500" />
          <span>পেমেন্ট রিকোয়েস্ট</span>
          {pendingVerificationList.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-black animate-pulse">
              {toBengaliNumber(pendingVerificationList.length)}
            </span>
          )}
        </button>

        {/* Dynamic Image Slider Management Tab */}
        <button
          onClick={() => setActiveTab('slides')}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
            activeTab === 'slides'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <ImageIcon className="w-4 h-4 text-emerald-500" />
          <span>স্লাইডার ফটো ({toBengaliNumber(homeSlides.length)})</span>
        </button>

        {/* Aid & Donations Directory Management Tab */}
        <button
          onClick={() => setActiveTab('donations')}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
            activeTab === 'donations'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Heart className="w-4 h-4 text-rose-500" />
          <span>সাহায্য ও অনুদান ({toBengaliNumber(aidDonations.length)})</span>
        </button>

        {/* Extra Contributions Management Tab */}
        <button
          onClick={() => setActiveTab('contributions')}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
            activeTab === 'contributions'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Gift className="w-4 h-4 text-amber-500" />
          <span>অতিরিক্ত অনুদান ({toBengaliNumber(extraContributions.length)})</span>
        </button>

        {/* Organization Rules Tab */}
        <button
          onClick={() => setActiveTab('rules')}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
            activeTab === 'rules'
              ? 'bg-teal-700 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4 text-teal-600" />
          <span>সংগঠনের নিয়মাবলি ({toBengaliNumber(organizationRules.length)})</span>
        </button>

        {/* Support Team Management Tab (Requirement 2) */}
        <button
          onClick={() => setActiveTab('support')}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
            activeTab === 'support'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Headphones className="w-4 h-4 text-emerald-400" />
          <span>সাপোর্ট টিম ({toBengaliNumber(supportMembers.length)})</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
            activeTab === 'profile'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>সংগঠনের প্রোফাইল</span>
        </button>

        <button
          onClick={() => setActiveTab('payments')}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
            activeTab === 'payments'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>পেমেন্ট গেটওয়ে নম্বর</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
            activeTab === 'security'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>পিন ও ক্লাউড</span>
        </button>
      </div>

      {/* 1. Member Management Tab */}
      {activeTab === 'members' && (
        <div className="space-y-4">
          {/* Member Sub-header */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-700" />
                <span>সদস্য ও কার্যকরী পরিষদ নিয়ন্ত্রণ</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                সদস্যদের তথ্য সম্পাদনা, স্থায়ীভাবে মুছে ফেলা ও নতুন নিবন্ধন
              </p>
            </div>

            <button
              onClick={handleOpenAddModal}
              className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow transition cursor-pointer active:scale-95"
            >
              <UserPlus className="w-4 h-4" />
              <span>নতুন সদস্য যুক্ত করুন</span>
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
              placeholder="সদস্যের নাম, পদবি বা মোবাইল নম্বর দিয়ে খুঁজুন..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
            {memberSearch && (
              <button
                onClick={() => setMemberSearch('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Member List with Edit & Delete options inside Admin Panel */}
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs divide-y divide-slate-100">
            {filteredMembers.map((member) => {
              const photo = getMemberPhotoUrl(member);
              const isExec = isExecutiveCommitteeMember(member);
              const isExp = isExpatriateMember(member);
              const cleanPhone = sanitizePhone(member.phone);

              return (
                <div key={member.id} className="p-3 sm:p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/60 transition">
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Member Photo */}
                    <div className="relative shrink-0">
                      <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center font-bold text-slate-700 text-sm">
                        {photo ? (
                          <img src={photo} alt={member.name} className="w-full h-full object-cover" />
                        ) : (
                          member.name.trim().charAt(0) || 'স'
                        )}
                      </div>
                      <span className="absolute -top-1.5 -left-1 px-1.5 py-0.2 rounded text-[9px] font-black bg-slate-900 text-white">
                        #{toBengaliNumber(member.serial)}
                      </span>
                    </div>

                    {/* Member Info */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-slate-900 truncate">
                          {member.name}
                        </h4>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          isExec 
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' 
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {member.designation}
                        </span>
                        {isExp && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-800">
                            {member.countryStatus || 'প্রবাসী'}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 flex-wrap">
                        <span className="flex items-center gap-1 font-mono text-[11px]">
                          <Phone className="w-3 h-3 text-emerald-600" />
                          <span>{member.phone}</span>
                        </span>
                        <span className="flex items-center gap-1 text-[11px]">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{member.area}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Admin Exclusive Edit & Delete Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleOpenEditModal(member)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 text-xs font-bold transition cursor-pointer"
                      title="তথ্য সম্পাদন করুন"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">সম্পাদনা</span>
                    </button>

                    <button
                      onClick={() => setDeletingMemberId(member.id)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 text-xs font-bold transition cursor-pointer"
                      title="স্থায়ীভাবে মুছে ফেলুন"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">মুছুন</span>
                    </button>
                  </div>
                </div>
              );
            })}

            {filteredMembers.length === 0 && (
              <div className="p-10 text-center text-slate-400">
                <Users className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p className="text-xs font-bold text-slate-600">কোনো সদস্য পাওয়া যায়নি</p>
                <p className="text-[11px] text-slate-400 mt-0.5">নতুন সদস্য যুক্ত করতে উপরের বাটনে চাপ দিন</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Blood Donors Management Tab (Admin Exclusive) */}
      {activeTab === 'donors' && (
        <div className="space-y-4">
          {/* Sub-header */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Droplet className="w-5 h-5 text-rose-600" />
                <span>জরুরি রক্তদাতা ডেটাবেজ ও তালিকা নিয়ন্ত্রণ</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                নতুন রক্তদাতা যুক্ত করুন, তথ্য সংশোধন করুন এবং সরাসরি কল বা প্রাপ্যতা আপডেট করুন (Supabase Live Sync)
              </p>
            </div>

            <button
              type="button"
              onClick={handleOpenAddDonor}
              className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow transition cursor-pointer active:scale-95 whitespace-nowrap"
            >
              <PlusCircle className="w-4 h-4" />
              <span>নতুন রক্তদাতা যোগ করুন</span>
            </button>
          </div>

          {/* Blood Group Filter Buttons */}
          <div className="w-full max-w-full overflow-hidden">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar touch-pan-x">
              <button
                type="button"
                onClick={() => setDonorGroupFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  donorGroupFilter === 'all'
                    ? 'bg-rose-700 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                সকল গ্রুপ ({toBengaliNumber(donors.length)})
              </button>
              {(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as BloodGroup[]).map((grp) => {
                const count = donors.filter(d => d.bloodGroup === grp).length;
                return (
                  <button
                    type="button"
                    key={grp}
                    onClick={() => setDonorGroupFilter(grp)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1 ${
                      donorGroupFilter === grp
                        ? 'bg-rose-700 text-white shadow-xs'
                        : 'bg-white text-slate-700 hover:bg-rose-50 border border-slate-200'
                    }`}
                  >
                    <span>{grp}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      donorGroupFilter === grp ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {toBengaliNumber(count)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={donorSearch}
              onChange={(e) => setDonorSearch(e.target.value)}
              placeholder="রক্তদাতার নাম, এলাকা বা ফোন নম্বর দিয়ে খুঁজুন..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/20"
            />
            {donorSearch && (
              <button
                type="button"
                onClick={() => setDonorSearch('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Donors List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredAdminDonors.map((donor) => {
              const eligible = isDonorAdminEligible(donor.lastDonationDate);
              const isAvailable = donor.isAvailable !== false;

              return (
                <div
                  key={donor.id}
                  className="bg-white rounded-3xl p-4 border border-slate-200 shadow-xs hover:shadow-md transition flex flex-col justify-between space-y-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-rose-100 border-2 border-rose-300 text-rose-800 flex flex-col items-center justify-center shrink-0">
                      <span className="text-base font-black leading-none">{donor.bloodGroup}</span>
                      <span className="text-[9px] font-bold mt-0.5 text-rose-600">গ্রুপ</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 justify-between">
                        <h4 className="text-sm font-bold text-slate-900 truncate">
                          {donor.name}
                        </h4>
                        <button
                          type="button"
                          onClick={() => handleToggleDonorAvailability(donor)}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition cursor-pointer ${
                            isAvailable && eligible
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-200'
                              : 'bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200'
                          }`}
                          title="ক্লিক করে প্রাপ্যতা পরিবর্তন করুন"
                        >
                          {isAvailable ? (eligible ? 'রক্তদানে প্রস্তুত' : 'সম্প্রতি দিয়েছেন') : 'নিষ্ক্রিয়'}
                        </button>
                      </div>

                      <div className="mt-2 space-y-1 text-xs text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <a
                            href={`tel:${sanitizePhone(donor.phone)}`}
                            className="font-mono text-[11px] font-semibold text-slate-800 hover:underline"
                          >
                            {donor.phone || 'নম্বর নেই'}
                          </a>
                        </div>

                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{donor.area || 'পতেঙ্গা, চট্টগ্রাম'}</span>
                        </div>

                        {donor.lastDonationDate && (
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>শেষ রক্তদান: {donor.lastDonationDate}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 font-medium">
                      মোট রক্তদান: {toBengaliNumber(donor.totalDonations || 1)} বার
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenEditDonor(donor)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 text-xs font-bold transition cursor-pointer"
                        title="সম্পাদনা"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>সম্পাদনা</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeletingDonorId(donor.id)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 text-xs font-bold transition cursor-pointer"
                        title="স্থায়ীভাবে মুছুন"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>মুছুন</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredAdminDonors.length === 0 && (
            <div className="bg-white rounded-3xl p-10 text-center border border-slate-200">
              <Droplet className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-600">কোনো রক্তদাতা পাওয়া যায়নি</p>
              <p className="text-[11px] text-slate-400 mt-0.5">নতুন রক্তদাতা যুক্ত করতে উপরের বাটনে চাপ দিন</p>
            </div>
          )}
        </div>
      )}

      {/* 2. Member Registrations, Admin Approvals & IP/Device Tracking Tab */}
      {activeTab === 'registrations' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Header Card */}
          <div className="bg-gradient-to-br from-slate-900 via-emerald-950 to-teal-950 rounded-3xl p-5 sm:p-6 text-white border border-emerald-800/40 shadow-lg space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0 border border-emerald-400/30">
                  <ShieldAlert className="w-6 h-6 text-emerald-300" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                    <span>সদস্য নিবন্ধন ও আবেদন অনুমোদন ব্যবস্থাপনা</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-200 border border-emerald-400/30">
                      অ্যাডমিন কনসোল
                    </span>
                  </h3>
                  <p className="text-xs text-emerald-200/80 mt-0.5 max-w-xl">
                    অনলাইন সদস্য আবেদন পর্যালোচনা, আপলোডকৃত ছবি ও তথ্য যাচাই, ইউনিক ইউজারনেম বরাদ্দ, অনুমোদন এবং ডিভাইস বাইন্ডিং নিয়ন্ত্রণ।
                  </p>
                </div>
              </div>

              {/* Quick metrics */}
              <div className="grid grid-cols-3 gap-2 w-full sm:w-auto">
                <div className="px-3 py-2 rounded-2xl bg-white/10 border border-white/10 text-center">
                  <div className="text-[10px] text-emerald-200 font-bold">অপেক্ষমাণ</div>
                  <div className="text-base font-black text-amber-300">{toBengaliNumber(pendingAccounts.length)}</div>
                </div>
                <div className="px-3 py-2 rounded-2xl bg-white/10 border border-white/10 text-center">
                  <div className="text-[10px] text-emerald-200 font-bold">অনুমোদিত</div>
                  <div className="text-base font-black text-emerald-300">{toBengaliNumber(approvedAccounts.length)}</div>
                </div>
                <div className="px-3 py-2 rounded-2xl bg-white/10 border border-white/10 text-center">
                  <div className="text-[10px] text-emerald-200 font-bold">সতর্কতা</div>
                  <div className="text-base font-black text-rose-300">{toBengaliNumber(unresolvedAlerts.length)}</div>
                </div>
              </div>
            </div>

            {/* Sub-tab pills */}
            <div className="flex items-center gap-2 border-t border-white/10 pt-3 overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => setRegSubTab('pending')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                  regSubTab === 'pending'
                    ? 'bg-amber-400 text-emerald-950 shadow-xs font-black'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>অনুমোদন অপেক্ষমাণ আবেদন ({toBengaliNumber(pendingAccounts.length)})</span>
              </button>

              <button
                type="button"
                onClick={() => setRegSubTab('approved')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                  regSubTab === 'approved'
                    ? 'bg-emerald-400 text-emerald-950 shadow-xs font-black'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>অনুমোদিত অ্যাকাউন্ট ও ডিভাইস নিয়ন্ত্রণ ({toBengaliNumber(approvedAccounts.length)})</span>
              </button>

              <button
                type="button"
                onClick={() => setRegSubTab('alerts')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                  regSubTab === 'alerts'
                    ? 'bg-rose-500 text-white shadow-xs font-black'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>নিরাপত্তা অ্যালার্ট ও লগইন ট্র্যাকিং ({toBengaliNumber(securityAlerts.length)})</span>
              </button>
            </div>
          </div>

          {/* Sub-Tab 1: Pending Registrations Queue */}
          {regSubTab === 'pending' && (
            <div className="space-y-4">
              <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-xs flex justify-between items-center gap-2">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span>নতুন সদস্য নিবন্ধন অনুমোদনের কিউ (Approval Queue)</span>
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    আবেদনকারীর তথ্য ও আইপি/ডিভাইস যাচাই করে একটি ইউনিক ইউজারনেম বরাদ্দ করুন ও অনুমোদন দিন
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold">
                  মোট অপেক্ষমাণ: {toBengaliNumber(pendingAccounts.length)}
                </span>
              </div>

              {pendingAccounts.length === 0 ? (
                <div className="bg-white rounded-3xl p-10 border border-slate-200 text-center shadow-xs">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
                  <h5 className="text-sm font-bold text-slate-800">কোনো অপেক্ষমাণ নিবন্ধন আবেদন নেই</h5>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    ব্যবহারকারীরা প্রধান পাতা থেকে নিবন্ধনের আবেদন জমা দিলে তা এখানে অনুমোদনের জন্য প্রদর্শিত হবে।
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingAccounts.map((account) => {
                    const currentUsername = assignedUsernames[account.id] !== undefined 
                      ? assignedUsernames[account.id] 
                      : (account.username || '');

                    return (
                      <div 
                        key={account.id} 
                        className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-4 hover:border-emerald-300 transition"
                      >
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-3 border-b border-slate-100">
                          <div className="flex items-center gap-3.5">
                            {/* Uploaded Profile Photo */}
                            <div className="relative shrink-0">
                              {account.photoUrl ? (
                                <div 
                                  onClick={() => account.photoUrl && setPreviewPhoto({ url: account.photoUrl, name: account.name })}
                                  className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl overflow-hidden border-2 border-emerald-500 shadow-sm bg-slate-100 cursor-pointer group relative"
                                  title="ছবি বড় করে দেখতে ক্লিক করুন"
                                >
                                  <img 
                                    src={account.photoUrl} 
                                    alt={account.name} 
                                    className="w-full h-full object-cover group-hover:scale-110 transition duration-200"
                                  />
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition">
                                    <Search className="w-5 h-5" />
                                  </div>
                                </div>
                              ) : (
                                <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
                                  <Users className="w-7 h-7" />
                                </div>
                              )}
                              <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full bg-emerald-600 text-white text-[9px] font-bold shadow-xs flex items-center gap-0.5" title="প্রোফাইল ছবি সংযুক্ত">
                                <Check className="w-2.5 h-2.5" />
                                <span>ছবি</span>
                              </span>
                            </div>

                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="text-base font-black text-slate-900">{account.name}</h4>
                                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
                                  {account.designation || 'সাধারণ সদস্য'}
                                </span>
                                {account.bloodGroup && (
                                  <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 text-xs font-bold border border-rose-200">
                                    {account.bloodGroup}
                                  </span>
                                )}
                                <span className="px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 text-[10px] font-bold border border-teal-200 flex items-center gap-1">
                                  <ShieldCheck className="w-3 h-3 text-teal-600" />
                                  <span>ছবি আপলোড ভেরিফাইড</span>
                                </span>
                              </div>
                              <p className="text-xs text-slate-600 mt-1 flex items-center gap-2.5 flex-wrap">
                                <span>মোবাইল: <strong className="font-mono text-slate-900 font-bold">{account.phone}</strong></span>
                                <span className="text-slate-300">•</span>
                                <span>ঠিকানা: {account.area}</span>
                                <span className="text-slate-300">•</span>
                                <span className="inline-flex items-center gap-1.5 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-300 text-amber-900 font-medium">
                                  <KeyRound className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                  <span>পাসওয়ার্ড:</span>
                                  <strong className="font-mono font-black text-amber-950 text-xs bg-white px-1.5 py-0.2 rounded border border-amber-300 select-all">
                                    {account.password || 'sms2022'}
                                  </strong>
                                </span>
                              </p>
                            </div>
                          </div>

                          <div className="text-right text-[11px] text-slate-500 shrink-0">
                            <div>আবেদনের তারিখ: {new Date(account.registeredAt).toLocaleDateString('bn-BD')}</div>
                            <div className="font-mono text-[10px] text-slate-400">{new Date(account.registeredAt).toLocaleTimeString()}</div>
                          </div>
                        </div>

                        {/* Device & IP Security Tracking Snapshot Box including User Password */}
                        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                          <div className="flex items-center justify-between font-bold text-slate-700 text-[11px]">
                            <span className="flex items-center gap-1.5 text-slate-800">
                              <Globe className="w-3.5 h-3.5 text-emerald-600" />
                              <span>নিবন্ধন ক্রেডেনশিয়াল, আইপি ও ডিভাইস ট্র্যাকিং ডেটা:</span>
                            </span>
                            <span className="text-emerald-700 font-mono text-[11px]">নিরাপদ ট্র্যাকিং রেকর্ড</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-slate-600 text-[11px]">
                            <div className="flex items-center gap-1.5 bg-amber-50/90 p-2 rounded-xl border border-amber-300">
                              <KeyRound className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                              <span className="text-amber-900 font-bold shrink-0">নিবন্ধন পাসওয়ার্ড:</span>
                              <span className="font-mono font-black text-amber-950 bg-white px-2 py-0.5 rounded-md border border-amber-300 select-all shadow-2xs">
                                {account.password || 'sms2022'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 truncate p-2 bg-white rounded-xl border border-slate-200">
                              <Globe className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span className="text-slate-400 font-medium">আইপি ঠিকানা:</span>
                              <span className="font-mono font-bold text-slate-900">
                                {account.registeredIp || '103.145.24.82'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 truncate p-2 bg-white rounded-xl border border-slate-200">
                              <Smartphone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="text-slate-400 font-medium shrink-0">ডিভাইস ও ব্রাউজার:</span>
                              <span className="font-medium text-slate-800 truncate" title={account.registeredDevice}>
                                {account.registeredDevice || 'স্মার্টফোন (Android • Chrome)'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Admin Action: Assign Unique Username (Strict S + 5 Digits, e.g., s54776) & Approve */}
                        <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                          <div className="w-full sm:w-auto flex-1">
                            <label className="block text-xs font-bold text-emerald-950 mb-1">
                              অ্যাডমিন-নিয়ন্ত্রিত ইউনিক ইউজারনেম (Strict S + ৫ ডিজিট, যেমন: s54776):
                            </label>
                            <div className="flex items-center gap-2 max-w-sm">
                              <div className="relative flex-1">
                                <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-xs">@</span>
                                <input
                                  type="text"
                                  value={currentUsername}
                                  maxLength={6}
                                  onChange={(e) => {
                                    let val = e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '');
                                    if (val && !val.startsWith('s')) {
                                      val = 's' + val.replace(/\D/g, '');
                                    }
                                    val = val.slice(0, 6);
                                    setAssignedUsernames(prev => ({ ...prev, [account.id]: val }));
                                  }}
                                  placeholder="সরাসরি টাইপ করুন (যেমন: s54776)"
                                  className="w-full pl-7 pr-3 py-2 rounded-xl border border-emerald-300 bg-white text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                                />
                              </div>
                            </div>
                            <span className="text-[10px] text-emerald-800 mt-1 block">
                              অনুমোদনের পর এই <strong>@{currentUsername || 's_____'}</strong> ইউজারনেম এবং নিবন্ধনে দেওয়া পাসওয়ার্ড (<strong className="font-mono text-amber-900">{account.password || 'sms2022'}</strong>) দিয়ে সদস্য লগইন করতে পারবেন।
                            </span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
                            <button
                              type="button"
                              onClick={() => handleRejectRegistration(account)}
                              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white text-rose-700 hover:bg-rose-50 border border-rose-200 transition cursor-pointer"
                            >
                              <UserX className="w-3.5 h-3.5 inline mr-1" />
                              <span>প্রত্যাখ্যান</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleToggleBlockUser(account)}
                              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-800 text-white hover:bg-rose-900 transition cursor-pointer"
                              title="ভুয়া বা সন্দেহজনক আবেদন তাৎক্ষণিক ব্লক করুন"
                            >
                              <Ban className="w-3.5 h-3.5 inline mr-1" />
                              <span>ব্লক</span>
                            </button>

                            <button
                              type="button"
                              disabled={isProcessingApproval === account.id}
                              onClick={() => handleApproveRegistration(account)}
                              className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                            >
                              <UserCheck className="w-4 h-4" />
                              <span>{isProcessingApproval === account.id ? 'অনুমোদন হচ্ছে...' : 'অনুমোদন দিন ও সদস্য হিসেবে যুক্ত করুন'}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Sub-Tab 2: Approved Accounts & Device Tracking List */}
          {regSubTab === 'approved' && (
            <div className="space-y-4">
              <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-700" />
                    <span>অনুমোদিত সদস্য অ্যাকাউন্ট ও আইপি/ডিভাইস ট্র্যাকিং তালিকা</span>
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    সদস্যদের বরাদ্দকৃত ইউজারনেম, নিবন্ধিত ডিভাইস ও সর্বশেষ লগইন আইপি পর্যবেক্ষণ করুন
                  </p>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={regSearch}
                    onChange={(e) => setRegSearch(e.target.value)}
                    placeholder="নাম, ইউজারনেম বা আইপি খুঁজুন..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              {approvedAccounts.length === 0 ? (
                <div className="bg-white rounded-3xl p-10 border border-slate-200 text-center shadow-xs">
                  <Users className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                  <h5 className="text-sm font-bold text-slate-700">কোনো অনুমোদিত অ্যাকাউন্ট নেই</h5>
                  <p className="text-xs text-slate-400 mt-1">অপেক্ষমাণ আবেদন অনুমোদন করলে অ্যাকাউন্টসমূহ এখানে যুক্ত হবে।</p>
                </div>
              ) : (
                <div className="bg-white rounded-3xl border border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-xs">
                  {approvedAccounts
                    .filter(acc => {
                      if (!regSearch.trim()) return true;
                      const q = regSearch.toLowerCase();
                      return (
                        acc.name.toLowerCase().includes(q) ||
                        acc.username.toLowerCase().includes(q) ||
                        acc.phone.includes(q) ||
                        (acc.registeredIp || '').includes(q) ||
                        (acc.lastLoginIp || '').includes(q)
                      );
                    })
                    .map((acc) => {
                      const isBlocked = acc.status === 'blocked';
                      const isFlagged = acc.isSuspicious;

                      return (
                        <div key={acc.id} className="p-4 sm:p-5 hover:bg-slate-50/60 transition space-y-3">
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                            <div className="flex items-center gap-3">
                              {acc.photoUrl ? (
                                <div 
                                  onClick={() => acc.photoUrl && setPreviewPhoto({ url: acc.photoUrl, name: acc.name })}
                                  className="w-11 h-11 rounded-2xl overflow-hidden border-2 border-emerald-400 shadow-2xs shrink-0 bg-slate-100 cursor-pointer group relative"
                                  title="ছবি বড় করে দেখতে ক্লিক করুন"
                                >
                                  <img 
                                    src={acc.photoUrl} 
                                    alt={acc.name} 
                                    className="w-full h-full object-cover group-hover:scale-110 transition duration-200"
                                  />
                                </div>
                              ) : (
                                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 ${
                                  isBlocked 
                                    ? 'bg-rose-100 text-rose-800 border border-rose-300' 
                                    : isFlagged 
                                    ? 'bg-amber-100 text-amber-800 border border-amber-300' 
                                    : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                }`}>
                                  {isBlocked ? <Ban className="w-5 h-5 text-rose-700" /> : acc.name.charAt(0) || 'স'}
                                </div>
                              )}

                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="text-sm font-bold text-slate-900">{acc.name}</h4>
                                  <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                                    @{acc.username}
                                  </span>
                                  {isBlocked ? (
                                    <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-black">
                                      🚫 ব্লকড
                                    </span>
                                  ) : isFlagged ? (
                                    <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black animate-pulse">
                                      ⚠️ ফ্ল্যাগড / ভিন্ন আইপি
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                                      ✅ অনুমোদিত ও সক্রিয়
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-slate-600 mt-1 flex items-center gap-2.5 flex-wrap">
                                  <span>মোবাইল: <strong className="font-mono text-slate-800">{acc.phone}</strong></span>
                                  <span className="text-slate-300">•</span>
                                  <span>{acc.designation || 'সাধারণ সদস্য'}</span>
                                  <span className="text-slate-300">•</span>
                                  <span>{acc.area}</span>
                                  <span className="text-slate-300">•</span>
                                  <span className="inline-flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-300 text-amber-900 font-medium">
                                    <KeyRound className="w-3 h-3 text-amber-600 shrink-0" />
                                    <span>পাসওয়ার্ড:</span>
                                    <strong className="font-mono font-bold text-amber-950 text-xs bg-white px-1.5 py-0.2 rounded border border-amber-300 select-all">
                                      {acc.password || 'sms2022'}
                                    </strong>
                                  </span>
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
                              {/* Requirement 4: Device Reset */}
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(`সদস্য '${acc.name}' এর বর্তমান ডিভাইস বাইন্ডিং ও আইপি লক মুছে ফেলতে চান? এতে করে তিনি তার নতুন ফোন/ডিভাইস থেকে লগইন করতে পারবেন।`)) {
                                    resetMemberDeviceBinding(acc.id);
                                    const fresh = loadUserAccounts();
                                    setUserAccounts(fresh);
                                    setNoticeMsg(`সদস্য '${acc.name}' এর ডিভাইস বাইন্ডিং সফলভাবে রিসেট করা হয়েছে। নতুন ডিভাইসে লগইন উন্মুক্ত।`);
                                    setTimeout(() => setNoticeMsg(''), 4000);
                                  }
                                }}
                                className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 transition cursor-pointer flex items-center gap-1 shadow-2xs"
                                title="নতুন ডিভাইসে লগইন করতে দিতে ডিভাইস বাইন্ডিং ও আইপি লক রিসেট করুন"
                              >
                                <Smartphone className="w-3.5 h-3.5 text-amber-600" />
                                <span>ডিভাইস রিসেট</span>
                              </button>

                              {/* Credential Recovery */}
                              <button
                                type="button"
                                onClick={() => handleOpenCredentialModal(acc)}
                                className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition cursor-pointer flex items-center gap-1"
                                title="সদস্যের ইউজারনেম বা পাসওয়ার্ড পরিবর্তন ও রিকভার করুন"
                              >
                                <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
                                <span>ক্রেডেনশিয়াল রিকভারি</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleToggleBlockUser(acc)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                                  isBlocked 
                                    ? 'bg-emerald-700 hover:bg-emerald-800 text-white' 
                                    : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                                }`}
                              >
                                {isBlocked ? 'আনব্লক করুন' : 'অ্যাকাউন্ট ব্লক করুন'}
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteUserAccount(acc.id, acc.username)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                                title="মুছে ফেলুন"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {/* Tracking & Single-Device Binding Details Grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-3 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] text-slate-600">
                            <div>
                              <span className="text-slate-400 font-medium">🌐 নিবন্ধিত আইপি: </span>
                              <span className="font-mono font-bold text-slate-800">{acc.registeredIp || 'রেকর্ড করা হয়নি'}</span>
                              <span className="block text-[10px] text-slate-400 truncate mt-0.5" title={acc.registeredDevice}>
                                ডিভাইস: {acc.registeredDevice || 'স্মার্টফোন'}
                              </span>
                            </div>

                            <div>
                              <span className="text-slate-400 font-medium">🔒 ডিভাইস বাইন্ডিং: </span>
                              {acc.isDeviceLocked && acc.boundDeviceId ? (
                                <span className="inline-block font-mono font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                  লকড ({acc.boundDeviceId})
                                </span>
                              ) : (
                                <span className="inline-block font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                  আনলকড (লগইনে লক হবে)
                                </span>
                              )}
                              {acc.boundIp && (
                                <span className="block text-[10px] font-mono text-slate-500 mt-0.5">
                                  লকড আইপি: <strong>{acc.boundIp}</strong>
                                </span>
                              )}
                            </div>

                            <div>
                              <span className="text-slate-400 font-medium">🕒 সর্বশেষ লগইন: </span>
                              <span className="font-medium text-slate-800">
                                {acc.lastLoginAt ? new Date(acc.lastLoginAt).toLocaleString('bn-BD') : 'এখনও লগইন করেনি'}
                              </span>
                              {acc.lastLoginIp && (
                                <span className="block text-[10px] font-mono text-slate-500 mt-0.5">
                                  লগইন আইপি: <strong>{acc.lastLoginIp}</strong> ({acc.lastLoginIp === acc.registeredIp ? 'ম্যাচ করেছে' : 'ভিন্ন আইপি'})
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}

          {/* Sub-Tab 3: Security Alerts & Suspicious Logins */}
          {regSubTab === 'alerts' && (
            <div className="space-y-4">
              <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-xs flex justify-between items-center gap-2">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-rose-600" />
                    <span>নিরাপত্তা অ্যালার্ট ও সতর্কতা সিস্টেম (IP/Device Alerts)</span>
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    ভিন্ন আইপি বা অপরিচিত ডিভাইস থেকে লগইন চেষ্টা সনাক্ত হলে অবিলম্বে অ্যালার্ট তৈরি হয়
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-900 text-xs font-bold">
                  মোট অ্যালার্ট: {toBengaliNumber(securityAlerts.length)}
                </span>
              </div>

              {securityAlerts.length === 0 ? (
                <div className="bg-white rounded-3xl p-10 border border-slate-200 text-center shadow-xs">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
                  <h5 className="text-sm font-bold text-slate-800">কোনো নিরাপত্তা সতর্কতা নেই</h5>
                  <p className="text-xs text-slate-400 mt-1">সব সদস্য অ্যাকাউন্ট স্বাভাবিক ও সুরক্ষিতভাবে পরিচালিত হচ্ছে।</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {securityAlerts.map((alert) => (
                    <div 
                      key={alert.id}
                      className={`bg-white rounded-3xl p-4 sm:p-5 border shadow-xs space-y-3 transition ${
                        alert.resolved 
                          ? 'border-slate-200 opacity-75' 
                          : 'border-rose-300 bg-rose-50/20 ring-1 ring-rose-200'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`w-3 h-3 rounded-full shrink-0 ${alert.resolved ? 'bg-slate-300' : 'bg-rose-600 animate-pulse'}`} />
                          <h5 className="text-sm font-black text-slate-900">
                            {alert.message}
                          </h5>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(alert.timestamp).toLocaleString('bn-BD')}
                        </span>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600">
                        <div>
                          <span className="text-slate-400 font-medium">সদস্যের নাম: </span>
                          <strong className="text-slate-900">{alert.memberName}</strong> (@{alert.username})
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            মোবাইল: <a href={`tel:${alert.phone}`} className="text-emerald-700 font-mono font-bold hover:underline">{alert.phone}</a>
                          </div>
                        </div>

                        <div>
                          <span className="text-slate-400 font-medium">লগইন আইপি: </span>
                          <span className="font-mono font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                            {alert.ip}
                          </span>
                          <div className="text-[10px] text-slate-500 mt-0.5 truncate" title={alert.device}>
                            ডিভাইস: {alert.device}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-1">
                        <a
                          href={`tel:${alert.phone}`}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>সদস্যকে কল দিন</span>
                        </a>

                        {alert.userId && (
                          <button
                            type="button"
                            onClick={() => {
                              const targetAcc = userAccounts.find(a => a.id === alert.userId);
                              if (targetAcc) handleToggleBlockUser(targetAcc);
                            }}
                            className="px-3.5 py-1.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold transition cursor-pointer"
                          >
                            <Ban className="w-3.5 h-3.5 inline mr-1" />
                            <span>অ্যাকাউন্ট ব্লক করুন</span>
                          </button>
                        )}

                        {!alert.resolved && (
                          <button
                            type="button"
                            onClick={() => handleResolveAlert(alert.id)}
                            className="px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5 inline mr-1" />
                            <span>সমাধান চিহ্নিত করুন</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 2. Fund & Subscription Management Tab (Admin-Exclusive Edit System & Manual Net Balance Control) */}
      {activeTab === 'funds' && (
        <div className="space-y-6">
          {/* Requirements 1 & 2: Financial Summary Control Cards in Bangla (Net Balance, Monthly Expense, Extra Money) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* 1. বর্তমান নেট ব্যালেন্স নিয়ন্ত্রণ (Manual Net Balance Control) */}
            <div className="bg-gradient-to-br from-slate-900 via-teal-950 to-emerald-950 rounded-3xl p-5 text-white border border-teal-800/40 shadow-lg flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-teal-500/20 text-teal-300 flex items-center justify-center shrink-0 border border-teal-400/30">
                      <Wallet className="w-5 h-5 text-teal-300" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-white">বর্তমান নেট ব্যালেন্স</h3>
                      <span className="text-[10px] text-teal-200">মূল তহবিল স্থিতি</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-400/20 text-teal-200 border border-teal-400/30">
                    অফিসিয়াল
                  </span>
                </div>

                <div className="mt-3 p-3 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/10 flex items-center justify-between">
                  <span className="text-[10px] text-teal-200 font-bold uppercase">বর্তমান ব্যালেন্স:</span>
                  <span className="text-xl font-black text-emerald-300">
                    {formatBengaliCurrency(manualTotalBalance ?? 0)}
                  </span>
                </div>
              </div>

              {/* Form to update Net Balance */}
              <form onSubmit={handleSaveManualBalance} className="pt-3 border-t border-teal-800/60 space-y-2.5">
                <label className="block text-[11px] font-bold text-teal-100">
                  নতুন নেট ব্যালেন্স লিখুন (টাকায়):
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-teal-400 text-xs">৳</span>
                  <input
                    type="number"
                    required
                    value={inputNetBalance}
                    onChange={(e) => setInputNetBalance(e.target.value)}
                    placeholder="যেমন: 50000"
                    className="w-full pl-7 pr-3 py-2 rounded-xl bg-slate-800/90 border border-teal-500/40 text-white font-mono text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </div>
                {/* Quick Presets */}
                <div className="flex items-center gap-1 flex-wrap">
                  {[10000, 25000, 50000, 100000].map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setInputNetBalance(amt.toString())}
                      className="px-2 py-0.5 rounded-lg bg-teal-900/60 hover:bg-teal-800 text-[10px] font-bold text-teal-200 border border-teal-700/50 cursor-pointer"
                    >
                      {amt.toLocaleString()} ৳
                    </button>
                  ))}
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition cursor-pointer active:scale-95"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>নেট ব্যালেন্স সেভ ও সিঙ্ক</span>
                </button>
              </form>
            </div>

            {/* 2. মাসিক খরচ নিয়ন্ত্রণ (Monthly Expense Control) */}
            <div className="bg-gradient-to-br from-rose-950 via-slate-900 to-rose-900 rounded-3xl p-5 text-white border border-rose-800/40 shadow-lg flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-300 flex items-center justify-center shrink-0 border border-rose-400/30">
                      <Receipt className="w-5 h-5 text-rose-300" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-white">মাসিক খরচ</h3>
                      <span className="text-[10px] text-rose-200">চলতি মাসের বাজেট/ব্যয়</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-400/20 text-rose-200 border border-rose-400/30">
                    বাজেট / খরচ
                  </span>
                </div>

                <div className="mt-3 p-3 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/10 flex items-center justify-between">
                  <span className="text-[10px] text-rose-200 font-bold uppercase">বর্তমান মাসিক খরচ:</span>
                  <span className="text-xl font-black text-rose-300">
                    {formatBengaliCurrency(monthlyExpense)}
                  </span>
                </div>
              </div>

              {/* Form to update Monthly Expense */}
              <form onSubmit={handleSaveMonthlyExpense} className="pt-3 border-t border-rose-800/60 space-y-2.5">
                <label className="block text-[11px] font-bold text-rose-100">
                  নতুন মাসিক খরচের পরিমাণ (টাকায়):
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-rose-400 text-xs">৳</span>
                  <input
                    type="number"
                    required
                    value={inputMonthlyExpense}
                    onChange={(e) => setInputMonthlyExpense(e.target.value)}
                    placeholder="যেমন: 3500"
                    className="w-full pl-7 pr-3 py-2 rounded-xl bg-slate-800/90 border border-rose-500/40 text-white font-mono text-xs font-bold focus:outline-none focus:ring-2 focus:ring-rose-400"
                  />
                </div>
                {/* Quick Presets */}
                <div className="flex items-center gap-1 flex-wrap">
                  {[2000, 3500, 5000, 10000].map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setInputMonthlyExpense(amt.toString())}
                      className="px-2 py-0.5 rounded-lg bg-rose-900/60 hover:bg-rose-800 text-[10px] font-bold text-rose-200 border border-rose-700/50 cursor-pointer"
                    >
                      {amt.toLocaleString()} ৳
                    </button>
                  ))}
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md transition cursor-pointer active:scale-95"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>মাসিক খরচ সেভ ও সিঙ্ক</span>
                </button>
              </form>
            </div>

            {/* 3. এক্সট্রা টাকা নিয়ন্ত্রণ (Extra Money Control) */}
            <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 rounded-3xl p-5 text-white border border-indigo-800/40 shadow-lg flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center shrink-0 border border-indigo-400/30">
                      <Coins className="w-5 h-5 text-indigo-300" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-white">এক্সট্রা টাকা</h3>
                      <span className="text-[10px] text-indigo-200">সংরক্ষিত তহবিল</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-400/20 text-indigo-200 border border-indigo-400/30">
                    সংরক্ষিত
                  </span>
                </div>

                <div className="mt-3 p-3 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/10 flex items-center justify-between">
                  <span className="text-[10px] text-indigo-200 font-bold uppercase">বর্তমান এক্সট্রা টাকা:</span>
                  <span className="text-xl font-black text-indigo-300">
                    {formatBengaliCurrency(extraMoney)}
                  </span>
                </div>
              </div>

              {/* Form to update Extra Money */}
              <form onSubmit={handleSaveExtraMoney} className="pt-3 border-t border-indigo-800/60 space-y-2.5">
                <label className="block text-[11px] font-bold text-indigo-100">
                  নতুন এক্সট্রা টাকার পরিমাণ (টাকায়):
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-indigo-400 text-xs">৳</span>
                  <input
                    type="number"
                    required
                    value={inputExtraMoney}
                    onChange={(e) => setInputExtraMoney(e.target.value)}
                    placeholder="যেমন: 12000"
                    className="w-full pl-7 pr-3 py-2 rounded-xl bg-slate-800/90 border border-indigo-500/40 text-white font-mono text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
                {/* Quick Presets */}
                <div className="flex items-center gap-1 flex-wrap">
                  {[5000, 10000, 20000, 50000].map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setInputExtraMoney(amt.toString())}
                      className="px-2 py-0.5 rounded-lg bg-indigo-900/60 hover:bg-indigo-800 text-[10px] font-bold text-indigo-200 border border-indigo-700/50 cursor-pointer"
                    >
                      {amt.toLocaleString()} ৳
                    </button>
                  ))}
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition cursor-pointer active:scale-95"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>এক্সট্রা টাকা সেভ ও সিঙ্ক</span>
                </button>
              </form>
            </div>
          </div>

          {/* Card 2: Member Subscription Payment Status Management (Rule 3 & 4: Zero Entry/Delete, Admin-Exclusive Edit) */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-700" />
                  <h3 className="text-base font-bold text-slate-900">
                    সদস্য চাঁদা ব্যবস্থাপনা ও তথ্য সম্পাদন (Admin-Exclusive Edit)
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  সদস্য তালিকা থেকে সকল সদস্য স্বয়ংক্রিয়ভাবে সিঙ্ক হয়ে এখানে প্রদর্শিত হচ্ছে। কোনো ম্যানুয়াল এন্ট্রি বা ডিলিটের প্রয়োজন নেই; শুধুমাত্র সদস্যের স্ট্যাটাস, পরিমাণ ও মাস সম্পাদন করুন।
                </p>
              </div>

              {/* Counters */}
              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                <span className="px-3 py-1 rounded-xl bg-emerald-50 text-emerald-800 font-bold text-xs border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>পরিশোধিত: {toBengaliNumber(effectiveAdminFunds.filter(f => f.status === 'Paid').length)}</span>
                </span>
                <span className="px-3 py-1 rounded-xl bg-amber-50 text-amber-800 font-bold text-xs border border-amber-200 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>বকেয়া: {toBengaliNumber(effectiveAdminFunds.filter(f => f.status === 'Due').length)}</span>
                </span>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={fundSearch}
                  onChange={(e) => setFundSearch(e.target.value)}
                  placeholder="সদস্যের নাম, মোবাইল নম্বর বা মাস দিয়ে খুঁজুন..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
                {fundSearch && (
                  <button
                    onClick={() => setFundSearch('')}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                <button
                  onClick={() => setFundStatusFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                    fundStatusFilter === 'all'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  সকল ({toBengaliNumber(effectiveAdminFunds.length)})
                </button>
                <button
                  onClick={() => setFundStatusFilter('Paid')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                    fundStatusFilter === 'Paid'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>পরিশোধিত ({toBengaliNumber(effectiveAdminFunds.filter(f => f.status === 'Paid').length)})</span>
                </button>
                <button
                  onClick={() => setFundStatusFilter('Due')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                    fundStatusFilter === 'Due'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>বকেয়া ({toBengaliNumber(effectiveAdminFunds.filter(f => f.status === 'Due').length)})</span>
                </button>
              </div>
            </div>

            {/* Requirement 2: Auto-Synced Member Fund Cards (Strictly Card View Only, Prominent & Larger) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
              {filteredAdminFunds.map((record) => {
                const isPaid = record.status === 'Paid';
                const matchedMember = record.memberId 
                  ? adminMemberMap.get(record.memberId) 
                  : (record.phone ? adminMemberMap.get(sanitizePhone(record.phone)) : null);

                // Auto-synced details from members list
                const memberName = matchedMember ? matchedMember.name : record.memberName;
                const memberPhone = matchedMember?.phone || record.phone || '';
                const memberDesignation = matchedMember?.designation || record.designation || 'সাধারণ সদস্য';
                const memberPhoto = matchedMember?.photoUrl;

                return (
                  <div 
                    key={record.id} 
                    className="p-5 sm:p-6 bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition space-y-4 flex flex-col justify-between relative"
                  >
                    <div>
                      {/* Top Header: Avatar, Name, Designation & Status */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3.5 min-w-0 flex-1">
                          {memberPhoto ? (
                            <img 
                              src={memberPhoto} 
                              alt={memberName} 
                              className="w-13 h-13 rounded-2xl object-cover border-2 border-emerald-500/20 shrink-0 shadow-xs" 
                            />
                          ) : (
                            <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 text-emerald-800 font-black text-base flex items-center justify-center shrink-0 border border-emerald-200/60 shadow-2xs">
                              {memberName.charAt(0)}
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <h4 className="text-base sm:text-lg font-black text-slate-900 truncate leading-snug">
                              {memberName}
                            </h4>
                            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1">
                                <span>{memberDesignation}</span>
                              </span>
                              <span className="text-[10px] text-slate-400 font-medium">
                                স্বয়ংক্রিয় সিঙ্ক
                              </span>
                            </div>
                          </div>
                        </div>

                        <span
                          className={`px-3 py-1 rounded-full text-xs font-black inline-flex items-center gap-1.5 shrink-0 select-none border shadow-2xs ${
                            isPaid
                              ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                              : 'bg-amber-100 text-amber-900 border-amber-300'
                          }`}
                        >
                          {isPaid ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                              <span>পরিশোধিত</span>
                            </>
                          ) : (
                            <>
                              <Clock className="w-3.5 h-3.5 text-amber-700" />
                              <span>বকেয়া</span>
                            </>
                          )}
                        </span>
                      </div>

                      {/* Amount & Dues Breakdown */}
                      <div className="mt-3.5 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-500">চাঁদার পরিমাণ:</span>
                          <span className={`text-xl font-black ${isPaid ? 'text-emerald-700' : 'text-amber-600'}`}>
                            {formatBengaliCurrency(record.amount)}
                          </span>
                        </div>

                        {/* Dynamic Amount Display (Requirement 3: Do not show Paid and Due side-by-side; show only Due if due, only Paid if paid) */}
                        {isPaid ? (
                          <div className="pt-2 border-t border-slate-200">
                            <div className="p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-100 flex items-center justify-between">
                              <span className="text-xs text-emerald-800 font-bold">পরিশোধিত টাকা:</span>
                              <span className="font-mono font-black text-emerald-900 text-sm">
                                {formatBengaliCurrency(record.paidAmount ?? record.amount)}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="pt-2 border-t border-slate-200">
                            <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-100 flex items-center justify-between">
                              <span className="text-xs text-amber-800 font-bold">বকেয়া টাকা:</span>
                              <span className="font-mono font-black text-amber-900 text-sm">
                                {formatBengaliCurrency(record.dueAmount ?? record.amount)}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Month Details */}
                        <div className="pt-2 border-t border-slate-200/80 text-[11px] space-y-1.5">
                          <div className="flex items-center justify-between text-slate-700">
                            <span className="text-slate-500 flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              <span>নির্ধারিত মাস:</span>
                            </span>
                            <span className="font-bold text-slate-800">{record.month || 'চলতি মাস'}</span>
                          </div>
                          {record.paidMonths && (
                            <div className="flex items-start justify-between gap-2">
                              <span className="text-emerald-700 font-bold shrink-0">পরিশোধিত মাস:</span>
                              <span className="font-bold text-emerald-900 bg-emerald-100/70 px-2 py-0.5 rounded-lg border border-emerald-200 text-right">
                                {record.paidMonths}
                              </span>
                            </div>
                          )}
                          {record.dueMonths && (
                            <div className="flex items-start justify-between gap-2">
                              <span className="text-amber-700 font-bold shrink-0">বকেয়া মাস:</span>
                              <span className="font-bold text-amber-900 bg-amber-100/70 px-2 py-0.5 rounded-lg border border-amber-200 text-right">
                                {record.dueMonths}
                              </span>
                            </div>
                          )}
                          {record.notes && (
                            <div className="text-slate-500 pt-1 border-t border-slate-100">
                              <strong>বিবরণ:</strong> {record.notes}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Bottom Actions */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                      {/* Phone with copy */}
                      {memberPhone ? (
                        <div className="flex items-center gap-1.5">
                          <a 
                            href={`tel:${memberPhone}`}
                            className="flex items-center gap-1 font-mono text-xs font-bold text-slate-700 hover:text-emerald-700 transition"
                          >
                            <Phone className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{memberPhone}</span>
                          </a>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(memberPhone);
                              setCopiedFundPhone(memberPhone);
                              setTimeout(() => setCopiedFundPhone(null), 2000);
                            }}
                            className="text-slate-400 p-1 cursor-pointer hover:text-slate-600 rounded-md hover:bg-slate-100 transition"
                            title="নম্বর কপি করুন"
                          >
                            {copiedFundPhone === memberPhone ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">নম্বর নেই</span>
                      )}

                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Dedicated Edit Button */}
                        <button
                          onClick={() => handleOpenEditFund(record)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition cursor-pointer flex items-center gap-1 active:scale-95 shadow-2xs"
                          title="চাঁদা, বকেয়া ও মাস বিস্তারিত সম্পাদন করুন"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>এডিট করুন</span>
                        </button>

                        {/* Quick Toggle Status */}
                        <button
                          onClick={() => handleToggleFund(record.id, record.status)}
                          className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer active:scale-95 border ${
                            isPaid
                              ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-200'
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-emerald-200'
                          }`}
                          title={isPaid ? "'বকেয়া' করুন" : "'পরিশোধিত' করুন"}
                        >
                          {isPaid ? "বকেয়া" : "পরিশোধ"}
                        </button>

                        {/* Clean "রসিদ" button - only for Paid members; completely hidden for Due */}
                        {isPaid && (
                          <button
                            onClick={async () => {
                              try {
                                const targetMember = members.find(m => m.id === record.memberId) || (record.phone ? members.find(m => sanitizePhone(m.phone) === sanitizePhone(record.phone)) : undefined);
                                await generateAndDownloadReceipt(record, targetMember, profile);
                                setNoticeMsg(`${record.memberName}-এর ডিজিটাল পেমেন্ট রসিদ সফলভাবে ডাউনলোড হয়েছে`);
                                setTimeout(() => setNoticeMsg(''), 3000);
                              } catch (err) {
                                console.error(err);
                                setErrorMsg('রসিদ ডাউনলোড করতে সমস্যা হয়েছে');
                                setTimeout(() => setErrorMsg(''), 3000);
                              }
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition cursor-pointer flex items-center gap-1 active:scale-95 shadow-2xs"
                            title="ডিজিটাল পেমেন্ট রসিদ সরাসরি ডাউনলোড করুন"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>রসিদ</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredAdminFunds.length === 0 && (
              <div className="p-10 text-center text-slate-400 bg-white rounded-3xl border border-slate-200">
                <Wallet className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p className="text-xs font-bold text-slate-600">কোনো চাঁদা রেকর্ড পাওয়া যায়নি</p>
                <p className="text-[11px] text-slate-400 mt-0.5">সদস্য তালিকা থেকে নতুন সদস্য যুক্ত হলে তা স্বয়ংক্রিয়ভাবে এখানে সিঙ্ক হবে</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Requirement 2: Dedicated Payment Verification Section */}
      {activeTab === 'verification' && (
        <div className="space-y-6">
          {/* Section Header */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
                  <Receipt className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                    <span>পেমেন্ট রিকোয়েস্ট যাচাইকরণ ও অনুমোদন</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                      লাইভ গেটওয়ে
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    বিকাশ, নগদ ও রকেটের মাধ্যমে পাঠানো পেমেন্ট TrxID যাচাই করে এক ক্লিকে অনুমোদন বা বাতিল করুন
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => loadPendingPaymentsFromCloud()}
              disabled={isLoadingPayments}
              className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer disabled:opacity-50 active:scale-95 shrink-0"
              title="নতুন রিকোয়েস্ট রিফ্রেশ করুন"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingPayments ? 'animate-spin text-emerald-600' : ''}`} />
              <span>{isLoadingPayments ? 'লোড হচ্ছে...' : 'লাইভ রিফ্রেশ'}</span>
            </button>
          </div>

          {/* Success Toast */}
          {paymentSuccessToast && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-2 shadow-xs animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{paymentSuccessToast}</span>
            </div>
          )}

          {/* Metrics summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-amber-800 block">অপেক্ষমাণ রিকোয়েস্ট</span>
                <span className="text-2xl font-black text-amber-950 font-mono">
                  {toBengaliNumber(pendingVerificationList.length)}
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-700" />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-emerald-800 block">অপেক্ষমাণ মোট টাকা</span>
                <span className="text-2xl font-black text-emerald-950 font-mono">
                  {formatBengaliCurrency(
                    pendingVerificationList.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0)
                  )}
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-emerald-700" />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-blue-800 block">অনুমোদিত রিকোয়েস্ট</span>
                <span className="text-2xl font-black text-blue-950 font-mono">
                  {toBengaliNumber(approvedVerificationList.length)}
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-blue-700" />
              </div>
            </div>
          </div>

          {/* Search & Filter Controls */}
          <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl overflow-x-auto">
              <button
                type="button"
                onClick={() => setPaymentFilterStatus('pending')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                  paymentFilterStatus === 'pending'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                অপেক্ষমাণ ({toBengaliNumber(pendingVerificationList.length)})
              </button>
              <button
                type="button"
                onClick={() => setPaymentFilterStatus('approved')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                  paymentFilterStatus === 'approved'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                অনুমোদিত ({toBengaliNumber(approvedVerificationList.length)})
              </button>
              <button
                type="button"
                onClick={() => setPaymentFilterStatus('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                  paymentFilterStatus === 'all'
                    ? 'bg-slate-800 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                সকল ({toBengaliNumber(pendingPayments.length)})
              </button>
            </div>

            <div className="relative flex-1 sm:max-w-xs">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={paymentSearch}
                onChange={(e) => setPaymentSearch(e.target.value)}
                placeholder="নাম, ফোন বা TrxID..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-slate-50"
              />
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredVerificationList.map((payment) => {
              const isPending = payment.status === 'pending';
              const gw = (payment.gateway || 'bKash').toLowerCase();
              const numAmount = Number(payment.amount) || 0;
              const isProcessing = processingPaymentId === payment.id;

              return (
                <div
                  key={payment.id}
                  className={`bg-white rounded-3xl p-5 border transition-all duration-200 flex flex-col justify-between space-y-4 hover:shadow-md ${
                    isPending
                      ? 'border-amber-300 ring-1 ring-amber-500/20'
                      : 'border-slate-200 bg-slate-50/50'
                  }`}
                >
                  <div>
                    {/* Top Header: Gateway badge, Status, and Date */}
                    <div className="flex items-center justify-between gap-2 flex-wrap pb-3 border-b border-slate-100">
                      {/* Gateway Badge */}
                      <div className="flex items-center gap-1.5">
                        {gw.includes('bkash') || gw.includes('বিকাশ') ? (
                          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#E2136E]/15 text-[#D82360] font-black text-xs border border-[#E2136E]/30">
                            <BkashLogo className="w-3.5 h-3.5" />
                            <span>বিকাশ (bKash)</span>
                          </span>
                        ) : gw.includes('nagad') || gw.includes('নগদ') ? (
                          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#EA1D25]/15 text-[#EA1D25] font-black text-xs border border-[#EA1D25]/30">
                            <NagadLogo className="w-3.5 h-3.5" />
                            <span>নগদ (Nagad)</span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#8C3494]/15 text-[#8C3494] font-black text-xs border border-[#8C3494]/30">
                            <RocketLogo className="w-3.5 h-3.5" />
                            <span>রকেট (Rocket)</span>
                          </span>
                        )}
                      </div>

                      {/* Status Badge */}
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border ${
                        isPending
                          ? 'bg-amber-100 text-amber-900 border-amber-300'
                          : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                      }`}>
                        {isPending ? (
                          <>
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>অপেক্ষমাণ (Pending)</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>অনুমোদিত (Approved)</span>
                          </>
                        )}
                      </span>
                    </div>

                    {/* Member & Payment Details */}
                    <div className="mt-3 space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-base font-black text-slate-900">
                            {payment.userName || payment.memberName || 'অজ্ঞাত আবেদনকারী'}
                          </h4>
                          <span className="inline-block mt-0.5 text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                            {payment.designation || 'সাধারণ সদস্য'}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block font-bold">জমা সময়:</span>
                          <span className="text-[11px] text-slate-600 font-bold">
                            {payment.submittedAt 
                              ? new Date(payment.submittedAt).toLocaleDateString('bn-BD', {
                                  day: 'numeric',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })
                              : 'চলতি সময়'}
                          </span>
                        </div>
                      </div>

                      {/* Phone Number with Click-to-Call */}
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-slate-500 font-bold">প্রেরকের ফোন:</span>
                        <a
                          href={`tel:${sanitizePhone(payment.senderPhone)}`}
                          className="font-mono font-bold text-emerald-700 hover:underline flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100"
                        >
                          <Phone className="w-3 h-3" />
                          <span>{payment.senderPhone}</span>
                        </a>
                      </div>

                      {/* Amount & TrxID Highlight Box */}
                      <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-600">টাকার পরিমাণ:</span>
                          <span className="text-lg font-black text-emerald-700 font-mono">
                            {formatBengaliCurrency(numAmount)}
                          </span>
                        </div>

                        {/* TrxID Box with Copy Button */}
                        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200">
                          <div className="min-w-0">
                            <span className="text-[10px] text-slate-400 block font-bold">ট্রানজেকশন আইডি:</span>
                            <span className="font-mono text-sm font-black text-slate-900 tracking-wider">
                              {payment.trxId || payment.transactionId || 'N/A'}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const code = payment.trxId || payment.transactionId || '';
                              if (code) {
                                navigator.clipboard.writeText(code);
                                setCopiedTrxId(payment.id);
                                setTimeout(() => setCopiedTrxId(null), 2000);
                              }
                            }}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition cursor-pointer active:scale-95 shrink-0"
                            title="TrxID কপি করুন"
                          >
                            {copiedTrxId === payment.id ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="text-emerald-700">কপি হয়েছে!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>কপি</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons: Requirement 3 (Approve / Reject) */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                    {isPending ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleRejectPayment(payment.id)}
                          disabled={isProcessing}
                          className="flex items-center gap-1 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 text-xs font-bold transition cursor-pointer active:scale-95 disabled:opacity-50"
                          title="এই রিকোয়েস্টটি বাতিল করুন"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                          <span>বাতিল (Reject)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleApprovePayment(payment)}
                          disabled={isProcessing}
                          className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition shadow-sm cursor-pointer active:scale-95 disabled:opacity-50"
                          title="পেমেন্ট অনুমোদন করুন এবং সদস্যের চাঁদা পরিশোধিত করুন"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>{isProcessing ? 'প্রসেসিং...' : 'অনুমোদন (Approve)'}</span>
                        </button>
                      </>
                    ) : (
                      <div className="w-full flex items-center justify-between text-xs text-slate-500 font-bold">
                        <span className="flex items-center gap-1 text-emerald-700">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>অনুমোদিত ও সদস্যের চাঁদায় যুক্ত</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRejectPayment(payment.id)}
                          disabled={isProcessing}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                          title="তালিকা থেকে হিস্ট্রি মুছুন"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Empty state */}
          {filteredVerificationList.length === 0 && (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
              <Receipt className="w-12 h-12 text-slate-300 mx-auto" />
              <h4 className="text-sm font-bold text-slate-700">কোনো পেমেন্ট রিকোয়েস্ট পাওয়া যায়নি</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                ব্যবহারকারীরা বিকাশ, নগদ বা রকেটের মাধ্যমে TrxID সাবমিট করলে তা স্বয়ংক্রিয়ভাবে এখানে প্রদর্শিত হবে।
              </p>
            </div>
          )}
        </div>
      )}

      {/* 3. Profile Form Tab */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Building className="w-5 h-5 text-emerald-700" />
            <span>সংগঠনের সার্বিক তথ্য সম্পাদন</span>
          </h3>

          <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
            {/* Dynamic Organization Logo Management */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-emerald-700" />
                    <span>সংগঠনের অফিসিয়াল লোগো পরিচালনা</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    এখানে নির্ধারিত লোগোটি স্বয়ংক্রিয়ভাবে অথেনটিকেশন গেটের শীর্ষে এবং পুরো সিস্টেমে প্রদর্শিত হবে
                  </p>
                </div>
                {logoUrl && (
                  <button
                    type="button"
                    onClick={() => setLogoUrl('')}
                    className="text-[11px] text-rose-600 hover:text-rose-700 font-bold hover:underline cursor-pointer"
                  >
                    লোগো অপসারণ
                  </button>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4 pt-1">
                {/* Logo Preview (Exact original uploaded shape without added borders or padding) */}
                <div className="flex items-center justify-center shrink-0 min-w-20 min-h-20">
                  {logoUrl ? (
                    <img 
                      src={logoUrl} 
                      alt="Organization Logo" 
                      className="max-h-20 max-w-28 w-auto object-contain"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-2xl bg-white border-2 border-dashed border-emerald-300 flex flex-col items-center justify-center text-center p-2 text-slate-400">
                      <ImageIcon className="w-7 h-7 mx-auto text-slate-300 mb-1" />
                      <span className="text-[9px] block font-semibold leading-tight">লোগো নেই</span>
                    </div>
                  )}
                </div>

                <div className="flex-1 w-full space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition cursor-pointer">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{isUploadingLogo ? 'প্রক্রিয়াধীন...' : 'ডিভাইস থেকে লোগো আপলোড'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        disabled={isUploadingLogo}
                        className="hidden"
                      />
                    </label>
                    <span className="text-[10px] text-slate-400">সর্বোচ্চ ১০ এমবি (PNG / JPG / WEBP)</span>
                  </div>

                  <div>
                    <input
                      type="text"
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                      placeholder="অথবা সরাসরি লোগো ওয়েব লিঙ্ক (URL) পেস্ট করুন..."
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block font-bold text-slate-700 mb-1">সংগঠনের নাম</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">স্লোগান / ট্যাগলাইন</label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block font-bold text-slate-700 mb-1">প্রতিষ্ঠার তারিখ</label>
                <input
                  type="text"
                  value={establishedDate}
                  onChange={(e) => setEstablishedDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">প্রতিষ্ঠার বছর</label>
                <input
                  type="text"
                  value={establishedYear}
                  onChange={(e) => setEstablishedYear(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">কার্যালয়ের ঠিকানা</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
              <div>
                <label className="block font-bold text-slate-700 mb-1">জরুরি হটলাইন</label>
                <input
                  type="text"
                  value={hotline}
                  onChange={(e) => setHotline(e.target.value)}
                  placeholder="খালি রাখলে হোম পেজে লুকানো থাকবে"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-mono text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">জরুরি হেল্পলাইন নম্বর</label>
                <input
                  type="text"
                  value={emergencyContact}
                  onChange={(e) => setEmergencyContact(e.target.value)}
                  placeholder="জরুরি সমন্বয়কারী নম্বর"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-mono text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">মোবাইল নম্বর</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="খালি রাখলে হোম পেজে লুকানো থাকবে"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-mono text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">রেজিস্ট্রেশন নম্বর</label>
                <input
                  type="text"
                  value={regNumber}
                  onChange={(e) => setRegNumber(e.target.value)}
                  placeholder="ঐচ্ছিক রেজি: নম্বর"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-xs"
                />
              </div>
            </div>

            {/* Official Links & Contact for Home Page Footer */}
            <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-200/80 space-y-3">
              <h4 className="font-bold text-indigo-950 text-xs flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-indigo-700" />
                <span>অফিসিয়াল যোগাযোগ, সোশ্যাল মিডিয়া ও ইমেইল (খালি রাখলে হোম পেজ থেকে স্বয়ংক্রিয়ভাবে লুকানো থাকবে)</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">অফিসিয়াল ইমেইল এড্রেস</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="খালি রাখলে হোম পেজে লুকানো থাকবে"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-mono bg-white text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">অফিসিয়াল ফেসবুক পেজ লিংক</label>
                  <input
                    type="url"
                    value={facebookUrl}
                    onChange={(e) => setFacebookUrl(e.target.value)}
                    placeholder="https://facebook.com/..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-mono bg-white text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">ইউটিউব / মিডিয়া লিংক</label>
                  <input
                    type="url"
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    placeholder="https://youtube.com/..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-mono bg-white text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Requirement 7: Digital Receipt Signatories (English / Bengali names for President, General Secretary, Finance Secretary) */}
            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/90 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h4 className="font-bold text-emerald-950 text-xs flex items-center gap-1.5">
                  <FileCheck className="w-4 h-4 text-emerald-700" />
                  <span>ডিজিটাল পেমেন্ট রসিদ স্বাক্ষরকারী কর্মকর্তাদের নাম (রসিদে স্বয়ংক্রিয়ভাবে মুদ্রিত হবে)</span>
                </h4>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded-full border border-emerald-200">
                  রসিদ ভেরিফিকেশন
                </span>
              </div>
              <p className="text-[11px] text-emerald-800/80">
                পেমেন্ট রসিদের নিচে ৩টি নির্ধারিত স্বাক্ষর স্থানে এই ৩ জন কর্মকর্তার ইংরেজি/বাংলা নাম স্বয়ংক্রিয়ভাবে প্রদর্শিত হবে।
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
                <div>
                  <label className="block font-bold text-slate-700 mb-1 text-xs">১. সভাপতি (President) নাম</label>
                  <input
                    type="text"
                    value={presidentName}
                    onChange={(e) => setPresidentName(e.target.value)}
                    placeholder="e.g. Md. Sajon Ahmed"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-medium bg-white text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1 text-xs">২. সাধারণ সম্পাদক (General Secretary) নাম</label>
                  <input
                    type="text"
                    value={generalSecretaryName}
                    onChange={(e) => setGeneralSecretaryName(e.target.value)}
                    placeholder="e.g. Mahfuzur Rahman"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-medium bg-white text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1 text-xs">৩. অর্থ বিষয়ক সম্পাদক (Finance Secretary) নাম</label>
                  <input
                    type="text"
                    value={financeSecretaryName}
                    onChange={(e) => setFinanceSecretaryName(e.target.value)}
                    placeholder="e.g. Tanvir Hasan"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-medium bg-white text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold shadow transition cursor-pointer active:scale-95"
              >
                <Save className="w-4 h-4" />
                <span>প্রোফাইল পরিবর্তন সংরক্ষণ</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 3. Payments Form Tab */}
      {activeTab === 'payments' && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-700" />
            <span>অফিসিয়াল পেমেন্ট নম্বর ও সেটিংস</span>
          </h3>

          <form onSubmit={handleSavePayments} className="space-y-4 text-xs">
            {/* bKash */}
            <div className="p-4 rounded-2xl bg-pink-50/50 border border-pink-200 space-y-3">
              <h4 className="font-bold text-pink-900 flex items-center gap-1.5 text-xs">
                <span>বিকাশ (bKash) সেটিংস</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">বিকাশ নম্বর</label>
                  <input
                    type="text"
                    value={bkashNumber}
                    onChange={(e) => setBkashNumber(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">অ্যাকাউন্টের ধরন</label>
                  <select
                    value={bkashType}
                    onChange={(e) => setBkashType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="Personal">Personal (ব্যক্তিগত)</option>
                    <option value="Merchant">Merchant (মার্চেন্ট)</option>
                    <option value="Agent">Agent (এজেন্ট)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Nagad */}
            <div className="p-4 rounded-2xl bg-orange-50/50 border border-orange-200 space-y-3">
              <h4 className="font-bold text-orange-900 flex items-center gap-1.5 text-xs">
                <span>নগদ (Nagad) সেটিংস</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">নগদ নম্বর</label>
                  <input
                    type="text"
                    value={nagadNumber}
                    onChange={(e) => setNagadNumber(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">অ্যাকাউন্টের ধরন</label>
                  <select
                    value={nagadType}
                    onChange={(e) => setNagadType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="Personal">Personal (ব্যক্তিগত)</option>
                    <option value="Merchant">Merchant (মার্চেন্ট)</option>
                    <option value="Agent">Agent (এজেন্ট)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Rocket */}
            <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-200 space-y-3">
              <h4 className="font-bold text-purple-900 flex items-center gap-1.5 text-xs">
                <span>রকেট (Rocket) সেটিংস</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">রকেট নম্বর</label>
                  <input
                    type="text"
                    value={rocketNumber}
                    onChange={(e) => setRocketNumber(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">অ্যাকাউন্টের ধরন</label>
                  <select
                    value={rocketType}
                    onChange={(e) => setRocketType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="Personal">Personal (ব্যক্তিগত)</option>
                    <option value="Merchant">Merchant (মার্চেন্ট)</option>
                    <option value="Agent">Agent (এজেন্ট)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold shadow transition cursor-pointer active:scale-95"
              >
                <Save className="w-4 h-4" />
                <span>পেমেন্ট সেটিংস সংরক্ষণ</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 4. Security & Cloud Tab */}
      {activeTab === 'security' && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs max-w-md space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Lock className="w-5 h-5 text-emerald-700" />
            <span>অ্যাডমিন পিন পরিবর্তন</span>
          </h3>

          <form onSubmit={handleSavePin} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">নতুন পিন কোড</label>
              <input
                type="password"
                required
                maxLength={8}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                placeholder="কমপক্ষে ৪ ডিজিট"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono tracking-widest text-center text-sm"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">নতুন পিন কোড পুনরায় লিখুন</label>
              <input
                type="password"
                required
                maxLength={8}
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value)}
                placeholder="একই পিন কোড পুনরায় লিখুন"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono tracking-widest text-center text-sm"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold shadow transition cursor-pointer active:scale-95"
              >
                <Save className="w-4 h-4" />
                <span>পিন পরিবর্তন করুন</span>
              </button>
            </div>
          </form>

          {/* Supabase Cloud Connection & Sync Control Center */}
          <div className="pt-5 border-t border-slate-100 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Cloud className="w-4 h-4 text-emerald-600" />
                  <span>Supabase ক্লাউড ডাটাবেজ নিয়ন্ত্রণ ও সিঙ্ক সেন্টার</span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  সদস্য, রক্তদাতা, ফান্ড, খরচ ও সমস্ত ডাটার চিরস্থায়ী ক্লাউড সংরক্ষণ
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={refreshSupabaseStatus}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer active:scale-95"
                  title="সংযোগ পুনর্যাচাই করুন"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>যাচাই</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsConfigModalOpen(true)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer active:scale-95"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>ক্রেডেনশিয়াল</span>
                </button>
              </div>
            </div>

            {/* Connection Status Card */}
            <div className={`p-4 rounded-2xl border transition ${
              hasAnySupabaseTable 
                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950' 
                : 'bg-amber-50/80 border-amber-200 text-amber-950'
            } space-y-2`}>
              <div className="flex items-center justify-between text-xs font-bold">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${
                    hasAnySupabaseTable ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500 animate-ping'
                  }`} />
                  <span>ক্লাউড স্ট্যাটাস:</span>
                  <span className={hasAnySupabaseTable ? 'text-emerald-700' : 'text-amber-700'}>
                    {supabaseStatus}
                  </span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/70 border border-slate-200/60 font-mono">
                  PostgREST
                </span>
              </div>

              <div className="text-[11px] text-slate-600 font-mono truncate bg-white/60 p-2 rounded-xl border border-slate-200/50">
                {SUPABASE_URL}
              </div>

              {/* Table Status Badges: Dynamically scans & renders every single app table and data section */}
              <div className="pt-2.5 border-t border-slate-200/50 space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                    <span>টেবিল রেডি যাচাই (Table Ready Check):</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-mono font-black border border-emerald-300">
                      {Object.values(supabaseTableDetails).filter(Boolean).length} / {APP_SUPABASE_TABLES.length} প্রস্তুত
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-bold">
                    সর্বমোট {toBengaliNumber(APP_SUPABASE_TABLES.length)} টি ডেটাবেস টেবিল
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5">
                  {APP_SUPABASE_TABLES.map((table) => {
                    const isReady = Boolean(supabaseTableDetails[table.id]);
                    return (
                      <div
                        key={table.id}
                        className={`px-2 py-1.5 rounded-xl border transition flex items-center justify-between gap-1.5 ${
                          isReady 
                            ? 'bg-emerald-50/90 text-emerald-900 border-emerald-300 shadow-2xs' 
                            : 'bg-amber-50/80 text-amber-900 border-amber-300'
                        }`}
                        title={`${table.englishLabel} (${table.id}): ${table.description}`}
                      >
                        <div className="min-w-0 flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${isReady ? 'bg-emerald-600 shadow-xs' : 'bg-amber-600 animate-pulse'}`} />
                          <div className="min-w-0">
                            <span className="text-[11px] font-bold block truncate leading-tight">{table.label}</span>
                            <span className="text-[9px] font-mono text-slate-500 block truncate leading-tight">{table.id}</span>
                          </div>
                        </div>
                        <span className={`text-xs font-black shrink-0 ${isReady ? 'text-emerald-700' : 'text-amber-700'}`}>
                          {isReady ? '✔️' : '✗'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Alert if tables not yet created in Supabase */}
              {!hasAnySupabaseTable && (
                <div className="mt-2 p-3 rounded-xl bg-amber-100 border border-amber-300 text-amber-900 text-xs space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>Supabase টেবিল তৈরি করা প্রয়োজন</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-amber-800">
                    Supabase ড্যাশবোর্ডে গিয়ে <strong>SQL Editor</strong> এ স্ক্রিপ্টটি একবার রান করলেই চিরস্থায়ীভাবে সব ডাটা সিঙ্ক হয়ে যাবে।
                  </p>
                </div>
              )}
            </div>

            {/* Cloud Sync Feedback Message */}
            {cloudSyncFeedback && (
              <div className="p-3 rounded-xl bg-slate-900 text-white text-xs font-bold animate-in fade-in flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{cloudSyncFeedback}</span>
              </div>
            )}

            {/* Quick Actions Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsSqlModalOpen(true)}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition cursor-pointer active:scale-95"
              >
                <Code className="w-4 h-4" />
                <span>Supabase SQL স্ক্রিপ্ট</span>
              </button>

              <button
                type="button"
                onClick={handleForcePushToSupabase}
                disabled={isCloudSyncing}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white text-xs font-bold shadow-xs transition cursor-pointer active:scale-95"
              >
                <Upload className="w-4 h-4" />
                <span>সব ডাটা ক্লাউডে আপলোড</span>
              </button>

              <button
                type="button"
                onClick={handleForcePullFromSupabase}
                disabled={isCloudSyncing}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white text-xs font-bold shadow-xs transition cursor-pointer active:scale-95"
              >
                <RefreshCw className={`w-4 h-4 ${isCloudSyncing ? 'animate-spin' : ''}`} />
                <span>ক্লাউড থেকে রিলোড</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Image Slider Management Tab */}
      {activeTab === 'slides' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-emerald-700" />
                <span>হোম স্লাইডার ও ব্যানার ফটো নিয়ন্ত্রণ</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                হোম পেজের শীর্ষ স্লাইডারে প্রদর্শিত গ্রুপ ছবি, ত্রাণ বিতরণ ও ব্যানারসমূহ পরিচালনা করুন
              </p>
            </div>
            <button
              type="button"
              onClick={handleOpenAddSlide}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition cursor-pointer active:scale-95 whitespace-nowrap"
            >
              <PlusCircle className="w-4 h-4" />
              <span>নতুন স্লাইড ফটো যোগ করুন</span>
            </button>
          </div>

          {/* Slides List Grid */}
          {homeSlides.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {homeSlides.map((slide, idx) => (
                <div
                  key={slide.id}
                  className="bg-white rounded-3xl overflow-hidden border border-slate-200/90 shadow-xs flex flex-col justify-between hover:shadow-md transition"
                >
                  <div className="relative h-44 w-full bg-slate-900 overflow-hidden">
                    {slide.imageUrl ? (
                      <img
                        src={slide.imageUrl}
                        alt={slide.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-500 bg-slate-800">
                        <ImageIcon className="w-10 h-10 text-slate-600" />
                      </div>
                    )}
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-emerald-600 text-white shadow">
                        #{toBengaliNumber(idx + 1)} {slide.category || 'সাধারণ'}
                      </span>
                      {slide.isActive !== false ? (
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-500/90 text-white backdrop-blur-xs">
                          সক্রিয়
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-600 text-slate-200 backdrop-blur-xs">
                          লুকানো
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 leading-snug line-clamp-2">
                        {slide.title}
                      </h4>
                      {slide.description && (
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                          {slide.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-2 flex-wrap">
                        {slide.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-rose-500" />
                            <span>{slide.location}</span>
                          </span>
                        )}
                        {slide.date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-amber-500" />
                            <span>{slide.date}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 mt-3">
                      <button
                        type="button"
                        onClick={() => handleToggleSlideActive(slide)}
                        className={`text-xs font-bold px-2.5 py-1 rounded-xl transition cursor-pointer ${
                          slide.isActive !== false
                            ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                        }`}
                      >
                        {slide.isActive !== false ? 'হাইড করুন' : 'সক্রিয় করুন'}
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEditSlide(slide)}
                          className="p-1.5 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 transition cursor-pointer"
                          title="সম্পাদনা"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSlide(slide.id)}
                          className="p-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 transition cursor-pointer"
                          title="মুছে ফেলুন"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center space-y-2">
              <ImageIcon className="w-10 h-10 text-slate-300 mx-auto" />
              <h4 className="text-sm font-bold text-slate-700">কোনো স্লাইডার ছবি যোগ করা হয়নি</h4>
              <p className="text-xs text-slate-400">
                উপরের বাটনে ক্লিক করে সংগঠনের গ্রুপ ছবি ও কার্যক্রমের ব্যানার যুক্ত করুন।
              </p>
            </div>
          )}
        </div>
      )}

      {/* 6. Aid & Donation Recipients Management Tab */}
      {activeTab === 'donations' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Heart className="w-5 h-5 text-rose-600" />
                <span>অনুদান ও সাহায্য প্রাপ্তদের তালিকা ব্যবস্থাপনা</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                সাহায্যপ্রাপ্তদের নাম, ছবি, ঠিকানা, দায়িত্বশীলের রেফারেন্স, টাকার পরিমাণ ও বিবরণ পরিচালনা করুন
              </p>
            </div>
            <button
              type="button"
              onClick={handleOpenAddDonation}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition cursor-pointer active:scale-95 whitespace-nowrap"
            >
              <PlusCircle className="w-4 h-4" />
              <span>নতুন অনুদান রেকর্ড যোগ করুন</span>
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={donationAdminSearch}
              onChange={(e) => setDonationAdminSearch(e.target.value)}
              placeholder="নাম, ঠিকানা বা রেফারেন্স দিয়ে খুঁজুন..."
              className="w-full pl-9 pr-4 py-2.5 text-xs rounded-2xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          {/* Donations List */}
          {aidDonations.filter(d => {
            if (!donationAdminSearch.trim()) return true;
            const q = donationAdminSearch.toLowerCase();
            return (
              (d.recipientName || '').toLowerCase().includes(q) ||
              (d.address || '').toLowerCase().includes(q) ||
              (d.providerReference || '').toLowerCase().includes(q)
            );
          }).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {aidDonations
                .filter(d => {
                  if (!donationAdminSearch.trim()) return true;
                  const q = donationAdminSearch.toLowerCase();
                  return (
                    (d.recipientName || '').toLowerCase().includes(q) ||
                    (d.address || '').toLowerCase().includes(q) ||
                    (d.providerReference || '').toLowerCase().includes(q)
                  );
                })
                .map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition flex flex-col justify-between space-y-3"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                        {item.photoUrl ? (
                          <img src={item.photoUrl} alt={item.recipientName} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-emerald-600 bg-emerald-50">
                            <Heart className="w-6 h-6" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="text-sm font-black text-slate-900 truncate">
                            {item.recipientName}
                          </h4>
                          <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                            {formatBengaliCurrency(item.amount)}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                          <span className="truncate">{item.address}</span>
                        </div>
                        <div className="text-xs text-slate-600 font-medium mt-1">
                          <span className="text-slate-400">রেফারেন্স: </span>
                          <strong>{item.providerReference}</strong>
                        </div>
                      </div>
                    </div>

                    {item.description && (
                      <p className="text-xs text-slate-600 line-clamp-2 bg-slate-50 p-2 rounded-xl border border-slate-100">
                        {item.description}
                      </p>
                    )}

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                      <span>{item.date}</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEditDonation(item)}
                          className="p-1.5 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 transition cursor-pointer"
                          title="সম্পাদনা"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteDonation(item.id)}
                          className="p-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 transition cursor-pointer"
                          title="মুছে ফেলুন"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center space-y-2">
              <Heart className="w-10 h-10 text-slate-300 mx-auto" />
              <h4 className="text-sm font-bold text-slate-700">কোনো অনুদান রেকর্ড পাওয়া যায়নি</h4>
              <p className="text-xs text-slate-400">নতুন সাহায্যপ্রাপ্তদের তথ্য যুক্ত করুন।</p>
            </div>
          )}
        </div>
      )}

      {/* 7. Extra Contributions Management Tab */}
      {activeTab === 'contributions' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Gift className="w-5 h-5 text-amber-600" />
                <span>অতিরিক্ত অনুদান ও বিশেষ তহবিল ব্যবস্থাপনা</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                শুভাকাঙ্ক্ষী, প্রবাসী ভাই ও বিশেষ দাতাদের প্রদত্ত অনুদান রেকর্ড পরিচালনা করুন
              </p>
            </div>
            <button
              type="button"
              onClick={handleOpenAddContrib}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition cursor-pointer active:scale-95 whitespace-nowrap"
            >
              <PlusCircle className="w-4 h-4" />
              <span>নতুন অতিরিক্ত অনুদান যোগ করুন</span>
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={contribAdminSearch}
              onChange={(e) => setContribAdminSearch(e.target.value)}
              placeholder="দাতার নাম, এলাকা বা রেফারেন্স দিয়ে খুঁজুন..."
              className="w-full pl-9 pr-4 py-2.5 text-xs rounded-2xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </div>

          {/* Contributions List */}
          {extraContributions.filter(c => {
            if (!contribAdminSearch.trim()) return true;
            const q = contribAdminSearch.toLowerCase();
            return (
              (c.donorName || '').toLowerCase().includes(q) ||
              (c.address || '').toLowerCase().includes(q) ||
              (c.providerReference || '').toLowerCase().includes(q)
            );
          }).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {extraContributions
                .filter(c => {
                  if (!contribAdminSearch.trim()) return true;
                  const q = contribAdminSearch.toLowerCase();
                  return (
                    (c.donorName || '').toLowerCase().includes(q) ||
                    (c.address || '').toLowerCase().includes(q) ||
                    (c.providerReference || '').toLowerCase().includes(q)
                  );
                })
                .map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition flex flex-col justify-between space-y-3"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                        {item.photoUrl ? (
                          <img src={item.photoUrl} alt={item.donorName} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-amber-600 bg-amber-50">
                            <Gift className="w-6 h-6" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="text-sm font-black text-slate-900 truncate">
                            {item.donorName}
                          </h4>
                          <span className="text-xs font-black text-amber-800 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                            {formatBengaliCurrency(item.amount)}
                          </span>
                        </div>
                        {item.address && (
                          <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                            <span className="truncate">{item.address}</span>
                          </div>
                        )}
                        <div className="text-xs text-slate-600 font-medium mt-1">
                          <span className="text-slate-400">মাধ্যম: </span>
                          <strong>{item.providerReference}</strong>
                        </div>
                      </div>
                    </div>

                    {item.description && (
                      <p className="text-xs text-slate-600 line-clamp-2 bg-slate-50 p-2 rounded-xl border border-slate-100">
                        {item.description}
                      </p>
                    )}

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                      <span>{item.date}</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEditContrib(item)}
                          className="p-1.5 rounded-xl bg-slate-100 hover:bg-amber-50 text-slate-600 hover:text-amber-700 transition cursor-pointer"
                          title="সম্পাদনা"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteContrib(item.id)}
                          className="p-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 transition cursor-pointer"
                          title="মুছে ফেলুন"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center space-y-2">
              <Gift className="w-10 h-10 text-slate-300 mx-auto" />
              <h4 className="text-sm font-bold text-slate-700">কোনো অতিরিক্ত অনুদান পাওয়া যায়নি</h4>
              <p className="text-xs text-slate-400">নতুন শুভাকাঙ্ক্ষী অনুদান এন্ট্রি করুন।</p>
            </div>
          )}
        </div>
      )}

      {/* 8. Organization Rules & Guidelines Management Tab */}
      {activeTab === 'rules' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-teal-700" />
                <span>সংগঠনের নিয়মাবলি ও নির্দেশিকা ব্যবস্থাপনা</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                হোম পেজে প্রদর্শিত সংগঠনের মৌলিক নিয়মাবলি, ধারা ও নির্দেশিকা সহজে যুক্ত, সম্পাদনা বা সক্রিয়/নিষ্ক্রিয় করুন
              </p>
            </div>
            <button
              type="button"
              onClick={handleOpenAddRule}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold shadow-xs transition cursor-pointer active:scale-95 whitespace-nowrap"
            >
              <PlusCircle className="w-4 h-4" />
              <span>নতুন নিয়মাবলি/ধারা যোগ করুন</span>
            </button>
          </div>

          {/* Rules List */}
          {organizationRules.length > 0 ? (
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs divide-y divide-slate-100 space-y-4">
              {[...organizationRules]
                .sort((a, b) => (a.pointNumber || 0) - (b.pointNumber || 0))
                .map((rule, idx) => (
                  <div
                    key={rule.id}
                    className="pt-4 first:pt-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 group hover:bg-slate-50/70 p-3 rounded-2xl transition"
                  >
                    <div className="flex items-start gap-3.5 flex-1 min-w-0">
                      {/* Number Badge (1, 2, 3...) */}
                      <div className={`w-8 h-8 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center shrink-0 shadow-xs mt-0.5 ${
                        rule.isActive !== false
                          ? 'bg-emerald-700 text-white'
                          : 'bg-slate-300 text-slate-600'
                      }`}>
                        {toBengaliNumber(rule.pointNumber || idx + 1)}
                      </div>

                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          {rule.category && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 border border-teal-200/60">
                              {rule.category}
                            </span>
                          )}
                          {rule.isActive === false && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200">
                              নিষ্ক্রিয় (লুকানো)
                            </span>
                          )}
                        </div>
                        <p className="text-xs sm:text-sm text-slate-800 font-medium leading-relaxed">
                          {rule.ruleText}
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => handleToggleRuleActive(rule)}
                        className={`text-xs font-bold px-2.5 py-1 rounded-xl transition cursor-pointer ${
                          rule.isActive !== false
                            ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                        }`}
                        title={rule.isActive !== false ? 'হোম পেজ থেকে লুকান' : 'হোম পেজে সক্রিয় করুন'}
                      >
                        {rule.isActive !== false ? 'হাইড করুন' : 'সক্রিয় করুন'}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenEditRule(rule)}
                        className="p-1.5 rounded-xl bg-slate-100 hover:bg-teal-50 text-slate-600 hover:text-teal-700 transition cursor-pointer"
                        title="সম্পাদনা"
                      >
                        <Edit className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteRule(rule.id)}
                        className="p-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 transition cursor-pointer"
                        title="স্থায়ীভাবে মুছে ফেলুন"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center space-y-2">
              <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
              <h4 className="text-sm font-bold text-slate-700">কোনো নিয়মাবলি যুক্ত করা নেই</h4>
              <p className="text-xs text-slate-400">
                সংগঠনের গঠনতন্ত্র ও আচরণবিধির ধারা যুক্ত করতে উপরের বাটনে ক্লিক করুন।
              </p>
            </div>
          )}
        </div>
      )}

      {/* 9. Support Team Management Tab (Requirement 2: Strictly managed exclusively from Admin Panel) */}
      {activeTab === 'support' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Headphones className="w-5 h-5 text-emerald-700" />
                <span>সাপোর্ট টিম ও হেল্পডেস্ক প্রতিনিধি ব্যবস্থাপনা</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                সাপোর্ট পেজের সকল হেল্পডেস্ক প্রতিনিধির তথ্য, দায়িত্ব, মোবাইল ও সময়সূচি কেন্দ্রীয়ভাবে পরিচালনা করুন
              </p>
            </div>
            <button
              type="button"
              onClick={handleOpenAddSupport}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition cursor-pointer active:scale-95 whitespace-nowrap"
            >
              <PlusCircle className="w-4 h-4" />
              <span>নতুন প্রতিনিধি যোগ করুন</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={suppSearch}
              onChange={(e) => setSuppSearch(e.target.value)}
              placeholder="প্রতিনিধির নাম, মোবাইল নম্বর, পদবি বা সহায়তার বিষয় দিয়ে খুঁজুন..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
            {suppSearch && (
              <button
                type="button"
                onClick={() => setSuppSearch('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Support Representatives List */}
          {supportMembers.length > 0 ? (
            <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-xs divide-y divide-slate-100 space-y-3">
              {filteredSupportMembers.map((rep) => (
                <div
                  key={rep.id}
                  className="pt-3 first:pt-0 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-3 rounded-2xl hover:bg-slate-50/70 transition"
                >
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    {/* Photo */}
                    <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                      {rep.photoUrl ? (
                        <img src={rep.photoUrl} alt={rep.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-emerald-50 text-emerald-800 font-black text-lg">
                          {rep.name.charAt(0)}
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-black text-slate-900">{rep.name}</h4>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {rep.designation}
                        </span>
                        {rep.category && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                            {rep.category}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                        <span className="flex items-center gap-1 font-mono text-emerald-700 font-bold">
                          <Phone className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{rep.phone}</span>
                        </span>
                        {rep.availableHours && (
                          <span className="flex items-center gap-1 text-[11px] text-slate-500">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{rep.availableHours}</span>
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-slate-700 bg-slate-50 p-2 rounded-xl border border-slate-200/60 mt-1">
                        <span className="font-bold text-emerald-900">বিষয়: </span>
                        <span>{rep.subject}</span>
                        {rep.description && (
                          <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{rep.description}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                    <button
                      type="button"
                      onClick={() => handleOpenEditSupport(rep)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold transition border border-amber-200 cursor-pointer active:scale-95"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>সম্পাদনা</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteSupport(rep.id, rep.name)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition border border-rose-200 cursor-pointer active:scale-95"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>মুছুন</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center space-y-3">
              <Headphones className="w-10 h-10 text-slate-300 mx-auto" />
              <h4 className="text-sm font-bold text-slate-700">কোনো সাপোর্ট প্রতিনিধি তালিকাভুক্ত নেই</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                পাবলিক সাপোর্ট পেজে প্রদর্শনের জন্য নতুন প্রতিনিধি যুক্ত করতে উপরের বাটনে চাপুন।
              </p>
            </div>
          )}
        </div>
      )}

      {/* Support Representative Add / Edit Modal (Admin Exclusive) */}
      {isSupportModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 my-8 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <Headphones className="w-5 h-5 text-emerald-700" />
                <span>{editingSupport ? 'সাপোর্ট প্রতিনিধি তথ্য সম্পাদন' : 'নতুন সাপোর্ট প্রতিনিধি যোগ করুন'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsSupportModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {suppFormError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{suppFormError}</span>
              </div>
            )}

            <form onSubmit={handleSaveSupport} className="space-y-3.5 text-xs">
              {/* Photo Upload with Preview */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">প্রতিনিধির ছবি</label>
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-300 flex items-center justify-center overflow-hidden shrink-0">
                    {suppPhoto ? (
                      <img src={suppPhoto} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <Headphones className="w-6 h-6 text-slate-400" />
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleSupportPhotoUpload}
                    className="text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                  />
                </div>
              </div>

              {/* Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">প্রতিনিধির নাম *</label>
                  <input
                    type="text"
                    required
                    value={suppName}
                    onChange={(e) => setSuppName(e.target.value)}
                    placeholder="পুরো নাম লিখুন"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">মোবাইল নম্বর *</label>
                  <input
                    type="tel"
                    required
                    value={suppPhone}
                    onChange={(e) => setSuppPhone(e.target.value)}
                    placeholder="01886122678"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-mono"
                  />
                </div>
              </div>

              {/* Designation & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">পদবি (Designation)</label>
                  <input
                    type="text"
                    value={suppDesignation}
                    onChange={(e) => setSuppDesignation(e.target.value)}
                    placeholder="যেমন: অর্থ সম্পাদক / ব্লাড কো-অর্ডিনেটর"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">ক্যাটাগরি</label>
                  <input
                    type="text"
                    value={suppCategory}
                    onChange={(e) => setSuppCategory(e.target.value)}
                    placeholder="যেমন: চিকিৎসা ফান্ড / রক্তদান উইং"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              {/* Subject */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">সহায়তার বিষয় (Subject/Topic) *</label>
                <input
                  type="text"
                  required
                  value={suppSubject}
                  onChange={(e) => setSuppSubject(e.target.value)}
                  placeholder="যেমন: চিকিৎসা ফান্ড আবেদন ও অনুদান যাচাই"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-medium"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">বিস্তারিত ডেসক্রিপশন / দিকনির্দেশনা</label>
                <textarea
                  rows={3}
                  value={suppDescription}
                  onChange={(e) => setSuppDescription(e.target.value)}
                  placeholder="ব্যবহারকারীরা কোন কোন বিষয়ে এই প্রতিনিধির সাথে যোগাযোগ করতে পারবেন তার বিবরণ..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              {/* Available Hours */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">যোগাযোগের সময়সূচি</label>
                <input
                  type="text"
                  value={suppAvailableHours}
                  onChange={(e) => setSuppAvailableHours(e.target.value)}
                  placeholder="যেমন: সকাল ৯টা - রাত ১০টা / ২৪/৭ জরুরি সেবা"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSupportModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isSavingSupport}
                  className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isSavingSupport ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Member Modal (Admin Exclusive) */}
      {(isAddMemberModalOpen || editingMember) && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 my-8 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-700" />
                <span>{editingMember ? 'সদস্য তথ্য সম্পাদনা' : 'নতুন সদস্য নিবন্ধন'}</span>
              </h3>
              <button
                onClick={() => {
                  setIsAddMemberModalOpen(false);
                  setEditingMember(null);
                }}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {memFormError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{memFormError}</span>
              </div>
            )}

            <form onSubmit={handleSaveMember} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  সদস্যের পুরো নাম
                </label>
                <input
                  type="text"
                  value={memName}
                  onChange={(e) => setMemName(e.target.value)}
                  placeholder="যেমন: মো: ছাদিকুর রহমান"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">পদবি</label>
                  <input
                    type="text"
                    value={memDesignation}
                    onChange={(e) => setMemDesignation(e.target.value)}
                    placeholder="সভাপতি / সদস্য"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">এলাকা / ঠিকানা</label>
                  <input
                    type="text"
                    value={memArea}
                    onChange={(e) => setMemArea(e.target.value)}
                    placeholder="পতেঙ্গা, চট্টগ্রাম"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  মোবাইল নম্বর
                </label>
                <input
                  type="tel"
                  value={memPhone}
                  onChange={(e) => setMemPhone(e.target.value)}
                  placeholder="01886122678"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-mono"
                />
              </div>

              {/* Committee & Expatriate Toggles */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={memIsExecutive}
                    onChange={(e) => setMemIsExecutive(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="font-bold text-slate-800">কার্যকরী পরিষদ সদস্য</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={memIsExpatriate}
                    onChange={(e) => setMemIsExpatriate(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="font-bold text-slate-800">প্রবাসী সদস্য</span>
                </label>

                {memIsExpatriate && (
                  <div className="pt-1">
                    <input
                      type="text"
                      value={memCountry}
                      onChange={(e) => setMemCountry(e.target.value)}
                      placeholder="দেশের নাম (যেমন: ওমান, কাতার, দুবাই)"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                    />
                  </div>
                )}
              </div>

              {/* Photo Upload */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  প্রোফাইল ছবি (গ্যালারি থেকে নির্বাচন)
                </label>
                <div className="flex items-center gap-3">
                  {memPhoto ? (
                    <div className="relative w-16 h-16 rounded-2xl overflow-hidden border-2 border-emerald-500 shrink-0 shadow-xs">
                      <img src={memPhoto} alt="প্রিভিউ" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setMemPhoto('')}
                        className="absolute top-0 right-0 p-0.5 bg-rose-600 text-white rounded-bl cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                      <Users className="w-6 h-6" />
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddMemberModalOpen(false);
                    setEditingMember(null);
                  }}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isSavingMember}
                  className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold shadow transition cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  {isSavingMember ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Permanent Deletion Confirmation Modal */}
      {deletingMemberId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                সদস্য স্থায়ীভাবে মুছে ফেলবেন?
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                মুছে ফেলার পর এই সদস্যের সকল তথ্য ও রেকর্ড স্থায়ীভাবে বিলুপ্ত হবে এবং পৃষ্ঠা রিলোড দিলেও তা আর ফিরে আসবে না।
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setDeletingMemberId(null)}
                className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
              >
                না, রাখুন
              </button>
              <button
                onClick={() => {
                  const target = members.find(m => m.id === deletingMemberId);
                  handleConfirmDeleteMember(deletingMemberId, target ? target.name : 'সদস্য');
                }}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow transition cursor-pointer active:scale-95"
              >
                হ্যাঁ, স্থায়ীভাবে মুছুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1. Dedicated Admin Net Balance Edit Modal (Rule 1 & 2: Full Manual Control & Supabase Binding) */}
      {isNetBalanceModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 my-8 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-teal-700" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-tight">
                    বর্তমান নেট ব্যালেন্স সম্পাদন
                  </h3>
                  <span className="text-[10px] text-teal-700 font-bold">
                    অ্যাডমিন ম্যানুয়াল নিয়ন্ত্রণ (Cloud Sync)
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsNetBalanceModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-teal-50 border border-teal-200 text-teal-900 text-xs space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-teal-700" />
                <span>সরাসরি ডাটা বাইন্ডিং ও স্থায়ী ক্লাউড সংরক্ষণ</span>
              </div>
              <p className="text-[11px] text-teal-800 leading-relaxed">
                এখানে আপনি যে পরিমাণ অর্থ নির্ধারণ করবেন, তা হুবহু হোম পেজ ও তহবিল তালিকায় প্রদর্শিত হবে। কোনো স্বয়ংক্রিয় এন্ট্রি বা ক্যালকুলেশন এই ব্যালেন্স পরিবর্তন করতে পারবে না।
              </p>
            </div>

            <form onSubmit={handleSaveManualBalance} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  মোট নেট ব্যালেন্সের পরিমাণ (টাকায়) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-teal-700 text-base">৳</span>
                  <input
                    type="number"
                    required
                    value={inputNetBalance}
                    onChange={(e) => setInputNetBalance(e.target.value)}
                    placeholder="যেমন: 50000"
                    className="w-full pl-9 pr-4 py-3 rounded-2xl border-2 border-teal-500/30 bg-slate-50 text-slate-900 font-mono text-base font-black focus:outline-none focus:border-teal-600 focus:bg-white"
                  />
                </div>
              </div>

              {/* Quick Presets */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  কুইক প্রিসেট বা যোগ করুন:
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { label: '+১,০০০', add: 1000 },
                    { label: '+৫,০০০', add: 5000 },
                    { label: '+১০,০০০', add: 10000 },
                    { label: 'রিসেট ০', set: 0 }
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        const cur = parseFloat(inputNetBalance) || 0;
                        if (preset.set !== undefined) {
                          setInputNetBalance('0');
                        } else if (preset.add) {
                          setInputNetBalance((cur + preset.add).toString());
                        }
                      }}
                      className="px-2 py-1.5 rounded-xl bg-slate-100 hover:bg-teal-50 text-slate-700 hover:text-teal-800 text-[11px] font-bold transition cursor-pointer border border-slate-200"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Live Preview */}
              <div className="p-3 rounded-2xl bg-slate-900 text-white flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">প্রদর্শিত হবে:</span>
                  <span className="text-lg font-black text-emerald-400">
                    {formatBengaliCurrency(parseFloat(inputNetBalance) || 0)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                    সঠিক বাইন্ডিং
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNetBalanceModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 transition cursor-pointer font-bold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold shadow-md transition cursor-pointer active:scale-95 flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>ব্যালেন্স নিশ্চিত ও সংরক্ষণ</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Dedicated Fund Record Edit Modal (Rule 4: Admin-Exclusive Edit System) */}
      {editingFundRecord && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 my-8 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <Edit className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-tight">
                    চাঁদা রেকর্ড সম্পাদন (Fund Record Edit)
                  </h3>
                  <span className="text-[10px] text-emerald-700 font-bold">
                    অ্যাডমিন কর্তৃক বিস্তারিত সম্পাদন
                  </span>
                </div>
              </div>
              <button
                onClick={() => setEditingFundRecord(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Target Member Summary Card with Auto-Synced Designation */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 block font-bold uppercase">সদস্যের নাম ও পদবি</span>
                <h4 className="text-sm font-black text-slate-900">{editingFundRecord.memberName}</h4>
                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    {editingFundRecord.designation || 'সাধারণ সদস্য'}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    (সদস্য তালিকা থেকে স্বয়ংক্রিয় সিঙ্ককৃত)
                  </span>
                </div>
                {editingFundRecord.phone && (
                  <span className="text-[11px] font-mono text-emerald-700 font-bold block mt-1">
                    মোবাইল: {editingFundRecord.phone}
                  </span>
                )}
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block font-bold uppercase">আইডি / রেফারেন্স</span>
                <span className="text-[10px] font-mono font-bold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                  {editingFundRecord.id.slice(0, 10)}
                </span>
              </div>
            </div>

            <form onSubmit={handleSaveFundRecordEdit} className="space-y-3.5 text-xs">
              {/* Field 1: Payment Status (Paid / Due) */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  পরিশোধের সামগ্রিক অবস্থা (Payment Status) <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditFundStatus('Paid');
                      setEditFundPaidAmount(editFundAmount);
                      setEditFundDueAmount('0');
                    }}
                    className={`p-3 rounded-2xl border-2 flex items-center justify-center gap-2 font-bold transition cursor-pointer ${
                      editFundStatus === 'Paid'
                        ? 'bg-emerald-50 border-emerald-600 text-emerald-900 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <CheckCircle2 className={`w-4 h-4 ${editFundStatus === 'Paid' ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <span>পরিশোধিত (Paid)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEditFundStatus('Due');
                      setEditFundDueAmount(editFundAmount);
                      setEditFundPaidAmount('0');
                    }}
                    className={`p-3 rounded-2xl border-2 flex items-center justify-center gap-2 font-bold transition cursor-pointer ${
                      editFundStatus === 'Due'
                        ? 'bg-amber-50 border-amber-600 text-amber-900 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Clock className={`w-4 h-4 ${editFundStatus === 'Due' ? 'text-amber-600' : 'text-slate-400'}`} />
                    <span>বকেয়া (Due)</span>
                  </button>
                </div>
              </div>

              {/* Field 2: Amount & Note/Remarks Input Box (Clean, Simple, Mobile-Optimized) */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3.5">
                {/* Amount input */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    টাকার পরিমাণ (৳) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-emerald-700 text-sm">৳</span>
                    <input
                      type="number"
                      required
                      value={editFundAmount}
                      onChange={(e) => {
                        setEditFundAmount(e.target.value);
                        if (editFundStatus === 'Paid') {
                          setEditFundPaidAmount(e.target.value);
                        } else {
                          setEditFundDueAmount(e.target.value);
                        }
                      }}
                      placeholder="যেমন: 500"
                      className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white font-mono text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                  {/* Amount quick selectors */}
                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    {['200', '300', '500', '1000', '2000'].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => {
                          setEditFundAmount(amt);
                          if (editFundStatus === 'Paid') {
                            setEditFundPaidAmount(amt);
                          } else {
                            setEditFundDueAmount(amt);
                          }
                        }}
                        className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 text-[11px] font-bold transition cursor-pointer"
                      >
                        {amt} ৳
                      </button>
                    ))}
                  </div>
                </div>

                {/* Note / Text input box */}
                <div className="pt-2.5 border-t border-slate-200">
                  <label className="block font-bold text-slate-700 mb-1">
                    নোট / বিবরণ (যেমন: রানিং মাস)
                  </label>
                  <input
                    type="text"
                    value={editFundNotes}
                    onChange={(e) => {
                      setEditFundNotes(e.target.value);
                      setEditFundMonth(e.target.value);
                    }}
                    placeholder="যেমন: রানিং মাস / মার্চ ২০২৬ / এককালীন চাঁদা"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                  {/* Quick Note Suggestions */}
                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    {['রানিং মাস', 'চলতি মাস', 'মার্চ ২০২৬', 'বকেয়া চাঁদা', 'অগ্রিম চাঁদা'].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => {
                          setEditFundNotes(n);
                          setEditFundMonth(n);
                        }}
                        className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold transition cursor-pointer border ${
                          editFundNotes === n
                            ? 'bg-emerald-700 text-white border-emerald-700'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-emerald-50'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingFundRecord(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 transition cursor-pointer font-bold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isSavingFundEdit}
                  className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold shadow transition cursor-pointer active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSavingFundEdit ? 'সংরক্ষণ হচ্ছে...' : 'পরিবর্তন সংরক্ষণ'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Requirement 6: Dedicated Credential Recovery Modal (Admin Reset Username / Password) */}
      {credentialModalAccount && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 my-8 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <KeyRound className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-tight">
                    সদস্য ক্রেডেনশিয়াল রিকভারি
                  </h3>
                  <span className="text-[10px] text-emerald-700 font-bold">
                    ইউজারনেম ও পাসওয়ার্ড রিসেট ও পরিবর্তন
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCredentialModalAccount(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Member Details Snapshot */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-3">
              {credentialModalAccount.photoUrl ? (
                <div className="w-11 h-11 rounded-xl overflow-hidden border-2 border-emerald-500 shrink-0">
                  <img src={credentialModalAccount.photoUrl} alt={credentialModalAccount.name} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm shrink-0">
                  {credentialModalAccount.name.charAt(0) || 'স'}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-slate-900 truncate">{credentialModalAccount.name}</h4>
                <p className="text-xs text-slate-500 font-mono">মোবাইল: {credentialModalAccount.phone}</p>
                <span className="text-[10px] text-emerald-700 font-bold">পদবী: {credentialModalAccount.designation || 'সাধারণ সদস্য'}</span>
              </div>
            </div>

            {credError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{credError}</span>
              </div>
            )}

            <form onSubmit={handleSaveCredentialRecovery} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  ইউনিক ইউজারনেম (S + ৫ ডিজিট, যেমন: s54776) <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-2.5 font-bold text-slate-400 font-mono">@</span>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={credNewUsername}
                      onChange={(e) => {
                        let clean = e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '');
                        if (clean && !clean.startsWith('s')) {
                          clean = 's' + clean.replace(/\D/g, '');
                        }
                        clean = clean.slice(0, 6);
                        setCredNewUsername(clean);
                        setCredError('');
                      }}
                      placeholder="যেমন: s54776"
                      className="w-full pl-7 pr-3 py-2 rounded-xl border border-slate-200 font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  ফরম্যাট: অবশ্যই ইংরেজি 's' এবং ঠিক ৫টি সংখ্যা (মোট ৬ অক্ষর, যেমন: s54776)। কোনো চিহ্ন বা আন্ডারস্কোর গ্রহণযোগ্য নয়।
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  নতুন পাসওয়ার্ড (Password)
                </label>
                <input
                  type="text"
                  value={credNewPassword}
                  onChange={(e) => {
                    setCredNewPassword(e.target.value);
                    setCredError('');
                  }}
                  placeholder="পরিবর্তন না করতে চাইলে ফাঁকা রাখুন"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  ফাঁকা রাখলে পূর্বের পাসওয়ার্ড অক্ষুণ্ণ থাকবে। নতুন পাসওয়ার্ড লিখলে সদস্য তা দিয়ে লগইন করতে পারবেন।
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCredentialModalAccount(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 transition cursor-pointer font-bold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold shadow transition cursor-pointer active:scale-95 flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>ক্রেডেনশিয়াল আপডেট ও সেভ</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Full Photo Inspection Modal */}
      {previewPhoto && (
        <div 
          onClick={() => setPreviewPhoto(null)}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 border border-slate-700 rounded-3xl max-w-sm w-full p-5 shadow-2xl space-y-3 text-center"
          >
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h4 className="text-sm font-bold text-white truncate">{previewPhoto.name} এর প্রোফাইল ছবি</h4>
              <button 
                type="button"
                onClick={() => setPreviewPhoto(null)}
                className="p-1 rounded-full text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="w-full aspect-square rounded-2xl overflow-hidden border-2 border-emerald-500 bg-slate-950">
              <img src={previewPhoto.url} alt={previewPhoto.name} className="w-full h-full object-contain" />
            </div>
            <button
              type="button"
              onClick={() => setPreviewPhoto(null)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition cursor-pointer"
            >
              বন্ধ করুন
            </button>
          </div>
        </div>
      )}
      {/* Modal 1: Add / Edit Slide Modal */}
      {isSlideModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 my-8 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-emerald-700" />
                <span>{editingSlide ? 'স্লাইডার ছবি সম্পাদনা' : 'নতুন স্লাইডার ছবি যোগ'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsSlideModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSlide} className="space-y-4 text-xs">
              {/* Photo Upload or URL */}
              <div className="space-y-2">
                <label className="block font-bold text-slate-700">
                  গ্রুপ ফটো / ব্যানার নির্বাচন (ঐচ্ছিক - ডিভাইস থেকে আপলোড অথবা লিঙ্ক)
                </label>
                <div className="flex items-center gap-3">
                  {slideImageUrl ? (
                    <div className="relative w-28 h-18 rounded-xl overflow-hidden border border-emerald-400 shrink-0 shadow-xs">
                      <img src={slideImageUrl} alt="প্রিভিউ" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setSlideImageUrl('')}
                        className="absolute top-0 right-0 p-1 bg-rose-600 text-white rounded-bl-lg hover:bg-rose-700 transition cursor-pointer"
                        title="ছবি সরান"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-28 h-18 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                      <ImageIcon className="w-8 h-8" />
                    </div>
                  )}
                  <div className="flex-1 space-y-1.5">
                    <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer transition text-xs border border-slate-200">
                      <Upload className="w-3.5 h-3.5" />
                      <span>গ্যালারি থেকে ফটো আপলোড</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleSlidePhotoFile}
                        className="hidden"
                      />
                    </label>
                    <input
                      type="url"
                      value={slideImageUrl}
                      onChange={(e) => setSlideImageUrl(e.target.value)}
                      placeholder="অথবা সরাসরি ওয়েব ইমেজ লিঙ্ক (URL) দিন"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>
                <p className="text-[11px] text-slate-500">
                  হোম পেজের টপ স্লাইডারে শুধুমাত্র ফ্রেশ ও পরিষ্কার গ্রুপ ফটো প্রদর্শিত হবে। কোনো শিরোনাম বা ওভারলে টেক্সট থাকবে না।
                </p>
              </div>

              {/* Visibility Toggle */}
              <div className="flex items-center gap-2.5 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <input
                  type="checkbox"
                  id="slideActiveCheck"
                  checked={slideIsActive}
                  onChange={(e) => setSlideIsActive(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <label htmlFor="slideActiveCheck" className="font-bold text-slate-800 cursor-pointer select-none">
                  হোম পেজের স্লাইডারে দৃশ্যমান রাখুন (Active Slide)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSlideModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 transition cursor-pointer font-bold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold shadow transition cursor-pointer active:scale-95 flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingSlide ? 'আপডেট করুন' : 'স্লাইডার যুক্ত করুন'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Add / Edit Aid Donation Record Modal */}
      {isDonationModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 my-8 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <Heart className="w-5 h-5 text-rose-600" />
                <span>{editingDonation ? 'অনুদান রেকর্ড সম্পাদনা' : 'নতুন অনুদান রেকর্ড যুক্ত করুন'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsDonationModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDonation} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  সাহায্যপ্রাপ্তের নাম
                </label>
                <input
                  type="text"
                  value={donationRecipientName}
                  onChange={(e) => setDonationRecipientName(e.target.value)}
                  placeholder="যেমন: রহিমা বেগম (অসহায় বিধবা)"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              {/* Photo Upload or URL */}
              <div className="space-y-2">
                <label className="block font-bold text-slate-700">সাহায্যপ্রাপ্তের ছবি (ঐচ্ছিক)</label>
                <div className="flex items-center gap-3">
                  {donationPhotoUrl ? (
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-emerald-400 shrink-0">
                      <img src={donationPhotoUrl} alt="প্রিভিউ" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setDonationPhotoUrl('')}
                        className="absolute top-0 right-0 p-0.5 bg-rose-600 text-white rounded-bl"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                      <Heart className="w-6 h-6" />
                    </div>
                  )}
                  <div className="flex-1 space-y-1.5">
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer transition text-xs">
                      <Upload className="w-3.5 h-3.5" />
                      <span>গ্যালারি থেকে ছবি আপলোড</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleDonationPhotoFile}
                        className="hidden"
                      />
                    </label>
                    <input
                      type="url"
                      value={donationPhotoUrl}
                      onChange={(e) => setDonationPhotoUrl(e.target.value)}
                      placeholder="অথবা ছবির সরাসরি লিঙ্ক (URL)"
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    বিতরণকৃত টাকার পরিমাণ (৳)
                  </label>
                  <input
                    type="number"
                    value={donationAmount}
                    onChange={(e) => setDonationAmount(e.target.value)}
                    placeholder="যেমন: 15000"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">তারিখ</label>
                  <input
                    type="text"
                    value={donationDate}
                    onChange={(e) => setDonationDate(e.target.value)}
                    placeholder="যেমন: ১২ মার্চ ২০২৬"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  ঠিকানা
                </label>
                <input
                  type="text"
                  value={donationAddress}
                  onChange={(e) => setDonationAddress(e.target.value)}
                  placeholder="যেমন: পতেঙ্গা কাঠগড় বাজার এলাকা, চট্টগ্রাম"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  কার মাধ্যমে দেওয়া হয়েছে (দায়িত্বশীলের নাম ও পদবি)
                </label>
                <input
                  type="text"
                  value={donationProviderRef}
                  onChange={(e) => setDonationProviderRef(e.target.value)}
                  placeholder="যেমন: মোঃ কামরুল হাসান (সভাপতি)"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">বিস্তারিত বিবরণ বা নোট</label>
                <textarea
                  rows={2}
                  value={donationDescription}
                  onChange={(e) => setDonationDescription(e.target.value)}
                  placeholder="চিকিৎসা খরচ, খাদ্য সামগ্রী বা সহায়তার বিস্তারিত..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              {/* Personal Voluntary Payment Numbers */}
              <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2">
                <div className="font-bold text-amber-900 text-xs">
                  ব্যক্তিগত সহায়তা গ্রহণের নম্বর (ঐচ্ছিক)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">বিকাশ নম্বর</label>
                    <input
                      type="text"
                      value={donationBkash}
                      onChange={(e) => setDonationBkash(e.target.value)}
                      placeholder="01886122678"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 font-mono text-xs bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">নগদ নম্বর</label>
                    <input
                      type="text"
                      value={donationNagad}
                      onChange={(e) => setDonationNagad(e.target.value)}
                      placeholder="01711000000"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 font-mono text-xs bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">রকেট নম্বর</label>
                    <input
                      type="text"
                      value={donationRocket}
                      onChange={(e) => setDonationRocket(e.target.value)}
                      placeholder="01886122678-5"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 font-mono text-xs bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsDonationModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 transition cursor-pointer font-bold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold shadow transition cursor-pointer active:scale-95 flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingDonation ? 'আপডেট করুন' : 'অনুদান রেকর্ড সংরক্ষণ'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Add / Edit Extra Contribution Modal */}
      {isContribModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 my-8 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <Gift className="w-5 h-5 text-amber-600" />
                <span>{editingContrib ? 'অতিরিক্ত অনুদান সম্পাদনা' : 'নতুন অতিরিক্ত অনুদান যুক্ত করুন'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsContribModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveContrib} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  শুভাকাঙ্ক্ষী / দাতার নাম
                </label>
                <input
                  type="text"
                  value={contribDonorName}
                  onChange={(e) => setContribDonorName(e.target.value)}
                  placeholder="যেমন: মোঃ আব্দুল করিম (প্রবাসী রেমিট্যান্স যোদ্ধা)"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              {/* Photo Upload or URL */}
              <div className="space-y-2">
                <label className="block font-bold text-slate-700">দাতার ছবি / প্রোফাইল (ঐচ্ছিক)</label>
                <div className="flex items-center gap-3">
                  {contribPhotoUrl ? (
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-amber-400 shrink-0">
                      <img src={contribPhotoUrl} alt="প্রিভিউ" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setContribPhotoUrl('')}
                        className="absolute top-0 right-0 p-0.5 bg-rose-600 text-white rounded-bl"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                      <Gift className="w-6 h-6" />
                    </div>
                  )}
                  <div className="flex-1 space-y-1.5">
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer transition text-xs">
                      <Upload className="w-3.5 h-3.5" />
                      <span>গ্যালারি থেকে ফটো আপলোড</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleContribPhotoFile}
                        className="hidden"
                      />
                    </label>
                    <input
                      type="url"
                      value={contribPhotoUrl}
                      onChange={(e) => setContribPhotoUrl(e.target.value)}
                      placeholder="অথবা ছবির সরাসরি লিঙ্ক (URL)"
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    অনুদানের পরিমাণ (৳)
                  </label>
                  <input
                    type="number"
                    value={contribAmount}
                    onChange={(e) => setContribAmount(e.target.value)}
                    placeholder="যেমন: 50000"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">তারিখ</label>
                  <input
                    type="text"
                    value={contribDate}
                    onChange={(e) => setContribDate(e.target.value)}
                    placeholder="যেমন: ১০ মার্চ ২০২৬"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">ঠিকানা / প্রবাস / এলাকা</label>
                <input
                  type="text"
                  value={contribAddress}
                  onChange={(e) => setContribAddress(e.target.value)}
                  placeholder="যেমন: মাস্কাট, ওমান (মূল বাড়ি: সিলেট)"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  কার মাধ্যমে দেওয়া হয়েছে / মাধ্যম
                </label>
                <input
                  type="text"
                  value={contribProviderRef}
                  onChange={(e) => setContribProviderRef(e.target.value)}
                  placeholder="যেমন: ফখরুল ইসলাম চৌধুরী (প্রবাসী কল্যাণ সমন্বয়ক)"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">উদ্দেশ্য বা বিবরণ</label>
                <textarea
                  rows={2}
                  value={contribDescription}
                  onChange={(e) => setContribDescription(e.target.value)}
                  placeholder="রমজান খাদ্য সামগ্রী বা ফান্ডের বিশেষ উন্নয়নের জন্য..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsContribModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 transition cursor-pointer font-bold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold shadow transition cursor-pointer active:scale-95 flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingContrib ? 'আপডেট করুন' : 'অনুদান সংরক্ষণ'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 4: Add / Edit Organization Rule Modal */}
      {isRuleModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 my-8 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-teal-700" />
                <span>{editingRule ? 'সংগঠনের নিয়মাবলি সম্পাদনা' : 'নতুন নিয়মাবলি / ধারা যোগ'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsRuleModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRule} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    ক্রমিক / ধারা নম্বর (ঐচ্ছিক)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={rulePointNumber}
                    onChange={(e) => setRulePointNumber(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    বিষয় / ক্যাটাগরি
                  </label>
                  <input
                    type="text"
                    value={ruleCategory}
                    onChange={(e) => setRuleCategory(e.target.value)}
                    placeholder="যেমন: মৌলিক আদর্শ / আর্থিক শৃঙ্খলা"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  নিয়মাবলি বা নির্দেশিকার বিবরণ
                </label>
                <textarea
                  rows={4}
                  value={ruleText}
                  onChange={(e) => setRuleText(e.target.value)}
                  placeholder="যেমন: সংগঠনের প্রতিটি সদস্যকে সর্বদা নিঃস্বার্থ মানবসেবা ও আর্তমানবতার কল্যাণে নিবেদিত থাকতে হবে..."
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 leading-relaxed focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                />
              </div>

              {/* Visibility Toggle */}
              <div className="flex items-center gap-2.5 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <input
                  type="checkbox"
                  id="ruleActiveCheck"
                  checked={ruleIsActive}
                  onChange={(e) => setRuleIsActive(e.target.checked)}
                  className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 cursor-pointer"
                />
                <label htmlFor="ruleActiveCheck" className="font-bold text-slate-800 cursor-pointer select-none">
                  হোম পেজে সক্রিয় ও দৃশ্যমান রাখুন
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsRuleModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 transition cursor-pointer font-bold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold shadow transition cursor-pointer active:scale-95 flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingRule ? 'আপডেট করুন' : 'ধারা সংরক্ষণ করুন'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add / Edit Blood Donor (Admin Exclusive) */}
      {isAddDonorModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 my-8 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <Droplet className="w-5 h-5 text-rose-600" />
                <span>{editingDonor ? 'রক্তদাতার তথ্য সম্পাদনা' : 'নতুন রক্তদাতা যোগ করুন'}</span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsAddDonorModalOpen(false);
                  setEditingDonor(null);
                }}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {donorFormError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{donorFormError}</span>
              </div>
            )}

            <form onSubmit={handleSaveDonor} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  রক্তদাতার পুরো নাম
                </label>
                <input
                  type="text"
                  value={donorName}
                  onChange={(e) => setDonorName(e.target.value)}
                  placeholder="যেমন: মোঃ কামরুল হাসান"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    রক্তের গ্রুপ
                  </label>
                  <select
                    value={donorGroup}
                    onChange={(e) => setDonorGroup(e.target.value as BloodGroup)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                  >
                    {(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as BloodGroup[]).map((grp) => (
                      <option key={grp} value={grp}>{grp}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    মোবাইল নম্বর
                  </label>
                  <input
                    type="tel"
                    value={donorPhone}
                    onChange={(e) => setDonorPhone(e.target.value)}
                    placeholder="01XXXXXXXXX"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 font-mono focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  এলাকা / বর্তমান ঠিকানা
                </label>
                <input
                  type="text"
                  value={donorArea}
                  onChange={(e) => setDonorArea(e.target.value)}
                  placeholder="যেমন: পতেঙ্গা, চট্টগ্রাম অথবা সিলেট সদর"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    সর্বশেষ রক্তদান (ঐচ্ছিক)
                  </label>
                  <input
                    type="date"
                    value={donorLastDate}
                    onChange={(e) => setDonorLastDate(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    মোট রক্তদান (বার)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={donorTotal}
                    onChange={(e) => setDonorTotal(e.target.value === '' ? '' : parseInt(e.target.value) || 1)}
                    placeholder="1"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 font-mono focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                  />
                </div>
              </div>

              {/* Availability checkbox */}
              <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <input
                  type="checkbox"
                  id="donorAvailCheck"
                  checked={donorIsAvailable}
                  onChange={(e) => setDonorIsAvailable(e.target.checked)}
                  className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 cursor-pointer"
                />
                <label htmlFor="donorAvailCheck" className="font-bold text-slate-800 cursor-pointer select-none">
                  বর্তমানে রক্তদানে প্রস্তুত ও সক্রিয়
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddDonorModalOpen(false);
                    setEditingDonor(null);
                  }}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 transition cursor-pointer font-bold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isSavingDonor}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow transition cursor-pointer active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSavingDonor ? 'সংরক্ষণ হচ্ছে...' : (editingDonor ? 'আপডেট করুন' : 'রক্তদাতা সংরক্ষণ')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Donor Confirmation Modal */}
      {deletingDonorId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                রক্তদাতা স্থায়ীভাবে মুছে ফেলবেন?
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                মুছে ফেলার পর এই রক্তদাতার সকল তথ্য ক্লাউড ডেটাবেজ থেকে স্থায়ীভাবে মুছে যাবে এবং সাধারণ ব্যবহারকারীরা আর দেখতে পাবেন না।
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingDonorId(null)}
                className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
              >
                না, রাখুন
              </button>
              <button
                type="button"
                onClick={() => {
                  const target = donors.find(d => d.id === deletingDonorId);
                  handleConfirmDeleteDonor(deletingDonorId, target ? target.name : 'রক্তদাতা');
                }}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow transition cursor-pointer active:scale-95"
              >
                হ্যাঁ, স্থায়ীভাবে মুছুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Supabase SQL Setup Script Modal */}
      {isSqlModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 animate-in zoom-in-95">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Code className="w-5 h-5 text-emerald-700" />
                  <span>Supabase ডাটাবেজ SQL সেটআপ স্ক্রিপ্ট</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  চিরস্থায়ী ডাটা সিঙ্কের জন্য Supabase ড্যাশবোর্ডে এই স্ক্রিপ্টটি একবার রান করুন
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsSqlModalOpen(false)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Steps & Code */}
            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs space-y-2">
                <div className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>সহজ ৩টি ধাপে সেটআপ:</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-slate-700 text-[11px] leading-relaxed">
                  <li>নিচে সবুজ <strong>"সম্পূর্ণ SQL স্ক্রিপ্ট কপি করুন"</strong> বাটনে চাপ দিন।</li>
                  <li>আপনার Supabase ড্যাশবোর্ডে গিয়ে বাম পাশের <strong>SQL Editor</strong> খুলুন এবং <strong>New query</strong> দিন।</li>
                  <li>কপিকৃত স্ক্রিপ্টটি পেস্ট করে সবুজ <strong>Run</strong> বাটনে ক্লিক করুন।</li>
                </ol>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-700">PostgreSQL Schema & RLS Script:</span>
                  <button
                    type="button"
                    onClick={handleCopySqlScript}
                    className="flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition cursor-pointer"
                  >
                    {sqlCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{sqlCopied ? 'কপি হয়েছে!' : 'কপি করুন'}</span>
                  </button>
                </div>
                <pre className="p-3 rounded-2xl bg-slate-900 text-emerald-400 font-mono text-[10px] leading-relaxed overflow-x-auto max-h-64 border border-slate-800">
                  {SUPABASE_SETUP_SQL}
                </pre>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 flex items-center justify-end gap-2 bg-slate-50 rounded-b-3xl">
              <button
                type="button"
                onClick={() => setIsSqlModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs transition cursor-pointer"
              >
                বন্ধ করুন
              </button>
              <button
                type="button"
                onClick={handleCopySqlScript}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow transition cursor-pointer active:scale-95"
              >
                {sqlCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{sqlCopied ? 'কপিকৃত!' : 'সম্পূর্ণ SQL স্ক্রিপ্ট কপি করুন'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Supabase Custom Credentials Configuration Modal */}
      {isConfigModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 animate-in zoom-in-95">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-emerald-700" />
                  <span>Supabase ক্লাউড ক্রেডেনশিয়াল কনফিগারেশন</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  প্রয়োজনে আপনার নিজস্ব Supabase Project URL ও Anon / Service Key দিন
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsConfigModalOpen(false)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Supabase Project URL</label>
                <input
                  type="url"
                  value={configUrl}
                  onChange={(e) => setConfigUrl(e.target.value)}
                  placeholder="https://xxxxxxxx.supabase.co"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-xs focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Supabase Anon Key / Public API Key</label>
                <input
                  type="text"
                  value={configKey}
                  onChange={(e) => setConfigKey(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-xs focus:ring-2 focus:ring-emerald-500/20"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Supabase ড্যাশবোর্ড {'>'} Project Settings {'>'} API Keys থেকে সংগ্রহ করুন
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-[11px] leading-relaxed">
                এটি পরিবর্তন করলে তাৎক্ষণিকভাবে নতুন ক্লাউড ডাটাবেজের সাথে সংযোগ স্থাপন করা হবে এবং ব্রাউজারে সংরক্ষিত থাকবে।
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 flex items-center justify-between gap-2 bg-slate-50 rounded-b-3xl">
              <button
                type="button"
                onClick={handleResetCredentials}
                className="px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 font-bold text-xs transition cursor-pointer"
              >
                ডিফল্ট রিস্টোর
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsConfigModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs transition cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  onClick={handleSaveCredentials}
                  className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow transition cursor-pointer active:scale-95"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
