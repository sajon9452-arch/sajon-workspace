import React, { useState, useMemo, useEffect } from 'react';
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
  Table as TableIcon,
  Smartphone,
  ShieldAlert,
  UserCheck,
  UserX,
  Ban,
  RefreshCw,
  AlertTriangle,
  Upload,
  Image as ImageIcon
} from 'lucide-react';
import { 
  OrganizationProfile, 
  Member, 
  BloodDonor, 
  FundRecord,
  PaymentStatus,
  PaymentGatewayConfig,
  UserAccount,
  SecurityAlert
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
import { saveAdminPin, PMS_SYNC_EVENT } from '../utils/storage';
import { 
  loadUserAccounts, 
  saveUserAccounts, 
  loadSecurityAlerts, 
  saveSecurityAlerts,
  resetMemberDeviceBinding,
  updateMemberCredentials
} from '../utils/authSecurity';
import { checkSupabaseConnection, SUPABASE_URL } from '../utils/supabaseClient';
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
  paymentConfig: PaymentGatewayConfig;
  onUpdatePaymentConfig: (config: PaymentGatewayConfig) => void;
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
  funds = [],
  onEditFundRecord,
  onToggleFundStatus,
  manualTotalBalance = 0,
  onUpdateManualTotalBalance,
  monthlyExpense = 0,
  onUpdateMonthlyExpense,
  extraMoney = 0,
  onUpdateExtraMoney,
  paymentConfig,
  onUpdatePaymentConfig,
  onBack,
  onLogout
}) => {
  const [activeTab, setActiveTab] = useState<'members' | 'registrations' | 'funds' | 'profile' | 'payments' | 'security'>('members');
  
  // User Accounts & Security Tracking State
  const [userAccounts, setUserAccounts] = useState<UserAccount[]>(() => loadUserAccounts());
  const [securityAlerts, setSecurityAlerts] = useState<SecurityAlert[]>(() => loadSecurityAlerts());
  const [regSubTab, setRegSubTab] = useState<'pending' | 'approved' | 'alerts'>('pending');
  const [regSearch, setRegSearch] = useState('');
  const [assignedUsernames, setAssignedUsernames] = useState<Record<string, string>>({});
  const [isProcessingApproval, setIsProcessingApproval] = useState<string | null>(null);
  const [previewPhoto, setPreviewPhoto] = useState<{ url: string; name: string } | null>(null);

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

  // Handle Approve Member Registration & Assign Unique Username
  const handleApproveRegistration = async (account: UserAccount) => {
    const customUsername = (assignedUsernames[account.id] || account.username || '').trim().toLowerCase();
    const cleanUsername = customUsername || `member_${account.phone.slice(-4)}`;

    // Verify username uniqueness
    const usernameTaken = userAccounts.some(
      a => a.id !== account.id && a.username.toLowerCase() === cleanUsername.toLowerCase()
    );
    if (usernameTaken) {
      setErrorMsg(`'${cleanUsername}' ইউজারনেমটি ইতোমধ্যে বরাদ্দ রয়েছে। অন্য ইউজারনেম প্রদান করুন।`);
      setTimeout(() => setErrorMsg(''), 4000);
      return;
    }

    setIsProcessingApproval(account.id);
    try {
      // 1. Calculate next sequential serial
      let maxSerial = 0;
      members.forEach(m => {
        if (typeof m.serial === 'number' && !isNaN(m.serial) && m.serial > maxSerial) {
          maxSerial = m.serial;
        }
      });
      const nextSerial = Math.max(maxSerial, members.length) + 1;

      // 2. Add to Member list (sequentially appended to bottom and auto-synced to funds)
      const newMemberData: Omit<Member, 'id'> = {
        name: account.name,
        designation: account.designation || 'সাধারণ সদস্য',
        phone: account.phone,
        area: account.area,
        bloodGroup: account.bloodGroup,
        photoUrl: account.photoUrl,
        status: 'সক্রিয়',
        joinDate: new Date().toISOString().split('T')[0],
        serial: nextSerial,
        createdAt: new Date().toISOString()
      };

      const createdMember = await onAddMember(newMemberData);

      // 3. Update account to approved with assigned unique username
      const updatedAccount: UserAccount = {
        ...account,
        status: 'approved',
        username: cleanUsername,
        memberId: createdMember.id
      };

      const updatedList = userAccounts.map(a => a.id === account.id ? updatedAccount : a);
      setUserAccounts(updatedList);
      saveUserAccounts(updatedList);

      setNoticeMsg(`সদস্য "${account.name}" এর আবেদন অনুমোদিত হয়েছে এবং ইউজারনেম "@${cleanUsername}" বরাদ্দ দেওয়া হয়েছে।`);
      setTimeout(() => setNoticeMsg(''), 4000);
    } catch {
      setErrorMsg('সদস্য অনুমোদন প্রক্রিয়ায় সমস্যা হয়েছে');
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
    setCredNewUsername(acc.username);
    setCredNewPassword('');
    setCredError('');
  };

  const handleSaveCredentialRecovery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!credentialModalAccount) return;
    const res = updateMemberCredentials(credentialModalAccount.id, credNewUsername, credNewPassword);
    if (!res.success) {
      setCredError(res.error || 'ক্রেডেনশিয়াল আপডেট ব্যর্থ হয়েছে');
      return;
    }
    const fresh = loadUserAccounts();
    setUserAccounts(fresh);
    setNoticeMsg(`সদস্য "${credentialModalAccount.name}" এর ইউজারনেম ও পাসওয়ার্ড সফলভাবে আপডেট করা হয়েছে।`);
    setCredentialModalAccount(null);
    setTimeout(() => setNoticeMsg(''), 4000);
  };

  // Member Management States
  const [memberSearch, setMemberSearch] = useState('');
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [deletingMemberId, setDeletingMemberId] = useState<string | null>(null);

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
  // Requirement 3: Default view for member subscription list MUST BE CARD VIEW
  const [adminFundViewMode, setAdminFundViewMode] = useState<'card' | 'table'>('card');

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
    setEditFundMonth(rec.month || 'মার্চ ২০২৬');
    setEditFundPaidMonths(rec.paidMonths || (rec.status === 'Paid' ? (rec.month || 'মার্চ ২০২৬') : ''));
    setEditFundDueMonths(rec.dueMonths || (rec.status === 'Due' ? (rec.month || 'মার্চ ২০২৬') : ''));
    setEditFundDate(rec.date || new Date().toISOString().split('T')[0]);
    setEditFundNotes(rec.notes || rec.description || '');
  };

  const handleSaveFundRecordEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFundRecord) return;

    const parsedAmount = parseFloat(editFundAmount);
    const amount = isNaN(parsedAmount) ? 0 : parsedAmount;
    const parsedPaid = parseFloat(editFundPaidAmount);
    const paidAmount = isNaN(parsedPaid) ? (editFundStatus === 'Paid' ? amount : 0) : parsedPaid;
    const parsedDue = parseFloat(editFundDueAmount);
    const dueAmount = isNaN(parsedDue) ? (editFundStatus === 'Due' ? amount : 0) : parsedDue;

    setIsSavingFundEdit(true);
    try {
      const updated: FundRecord = {
        ...editingFundRecord,
        status: editFundStatus,
        amount,
        paidAmount,
        dueAmount,
        month: editFundMonth.trim() || 'চলতি মাস',
        paidMonths: editFundPaidMonths.trim(),
        dueMonths: editFundDueMonths.trim(),
        date: editFundDate.trim() || new Date().toISOString().split('T')[0],
        notes: editFundNotes.trim(),
        description: editFundNotes.trim() || editingFundRecord.description || 'নিয়মিত চাঁদা',
        approvedAt: editFundStatus === 'Paid' ? (editingFundRecord.approvedAt || new Date().toISOString()) : undefined
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

  const filteredAdminFunds = useMemo(() => {
    return effectiveAdminFunds.filter(f => {
      if (fundStatusFilter !== 'all' && f.status !== fundStatusFilter) return false;
      if (fundSearch.trim()) {
        const q = fundSearch.trim().toLowerCase();
        const matchesName = (f.memberName || '').toLowerCase().includes(q);
        const matchesPhone = (f.phone || '').includes(q);
        const matchesDesc = (f.description || '').toLowerCase().includes(q);
        const matchesMonth = (f.month || '').toLowerCase().includes(q);
        return matchesName || matchesPhone || matchesDesc || matchesMonth;
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
  const [hotline, setHotline] = useState(profile.hotline);
  const [regNumber, setRegNumber] = useState(profile.regNumber);
  const [phone, setPhone] = useState(profile.phone);
  const [email, setEmail] = useState(profile.email);
  const [logoUrl, setLogoUrl] = useState(profile.logoUrl || '');
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  // Sync profile when prop changes
  useEffect(() => {
    setName(profile.name);
    setTagline(profile.tagline);
    setEstablishedDate(profile.establishedDate);
    setEstablishedYear(profile.establishedYear);
    setAddress(profile.address);
    setHotline(profile.hotline);
    setRegNumber(profile.regNumber);
    setPhone(profile.phone);
    setEmail(profile.email);
    setLogoUrl(profile.logoUrl || '');
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
  const [supabaseStatus, setSupabaseStatus] = useState<string>('সংযোগ সক্রিয়');

  React.useEffect(() => {
    checkSupabaseConnection().then(res => setSupabaseStatus(res.message));
  }, []);

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
    if (!memName.trim()) {
      setMemFormError('সদস্যের নাম প্রদান করুন');
      return;
    }
    if (!memPhone.trim()) {
      setMemFormError('সঠিক মোবাইল নম্বর প্রদান করুন');
      return;
    }

    setIsSavingMember(true);
    setMemFormError('');

    try {
      if (editingMember) {
        const updated: Member = {
          ...editingMember,
          name: memName.trim(),
          designation: memDesignation.trim(),
          phone: memPhone.trim(),
          area: memArea.trim(),
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
          name: memName.trim(),
          designation: memDesignation.trim(),
          phone: memPhone.trim(),
          area: memArea.trim(),
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
      name,
      tagline,
      establishedDate,
      establishedYear,
      address,
      hotline,
      regNumber,
      phone,
      email,
      logoUrl: logoUrl.trim() || undefined
    });
    setNoticeMsg('সংগঠনের প্রোফাইল ও লোগো সফলভাবে আপডেট করা হয়েছে');
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

  return (
    <div className="space-y-6 pb-20 sm:pb-8">
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
                <div key={member.id} className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-slate-50/60 transition">
                  <div className="flex items-center gap-3.5 min-w-0">
                    {/* Member Photo */}
                    <div className="relative shrink-0">
                      <div className="w-14 h-14 rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center font-bold text-slate-700 text-base">
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
                      : account.username;

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
                              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-3 flex-wrap">
                                <span>মোবাইল: <strong className="font-mono text-slate-700">{account.phone}</strong></span>
                                <span>•</span>
                                <span>ঠিকানা: {account.area}</span>
                              </p>
                            </div>
                          </div>

                          <div className="text-right text-[11px] text-slate-500 shrink-0">
                            <div>আবেদনের তারিখ: {new Date(account.registeredAt).toLocaleDateString('bn-BD')}</div>
                            <div className="font-mono text-[10px] text-slate-400">{new Date(account.registeredAt).toLocaleTimeString()}</div>
                          </div>
                        </div>

                        {/* Device & IP Security Tracking Snapshot Box */}
                        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                          <div className="flex items-center justify-between font-bold text-slate-700 text-[11px]">
                            <span className="flex items-center gap-1.5 text-slate-800">
                              <Globe className="w-3.5 h-3.5 text-emerald-600" />
                              <span>নিবন্ধিত আইপি ও ডিভাইস ট্র্যাকিং ডেটা:</span>
                            </span>
                            <span className="text-emerald-700 font-mono text-[11px]">নিরাপদ ট্র্যাকিং রেকর্ড</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600 text-[11px]">
                            <div className="flex items-center gap-1.5 truncate">
                              <span className="text-slate-400 font-medium">আইপি ঠিকানা:</span>
                              <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded-lg border border-slate-200">
                                {account.registeredIp || '103.145.24.82'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 truncate">
                              <Smartphone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="text-slate-400 font-medium shrink-0">ডিভাইস ও ব্রাউজার:</span>
                              <span className="font-medium text-slate-800 truncate" title={account.registeredDevice}>
                                {account.registeredDevice || 'স্মার্টফোন (Android • Chrome)'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Admin Action: Assign Username & Approve */}
                        <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                          <div className="w-full sm:w-auto flex-1">
                            <label className="block text-xs font-bold text-emerald-950 mb-1">
                              ইউনিক ইউজারনেম বরাদ্দ করুন (Assign Unique Username):
                            </label>
                            <div className="relative max-w-xs">
                              <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-xs">@</span>
                              <input
                                type="text"
                                value={currentUsername}
                                onChange={(e) => {
                                  const val = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
                                  setAssignedUsernames(prev => ({ ...prev, [account.id]: val }));
                                }}
                                placeholder="যেমন: sylhet_member_1"
                                className="w-full pl-7 pr-3 py-2 rounded-xl border border-emerald-300 bg-white text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                              />
                            </div>
                            <span className="text-[10px] text-emerald-800 mt-1 block">
                              অনুমোদনের পর এই ইউজারনেম এবং নিবন্ধনে দেওয়া পাসওয়ার্ড দিয়ে সদস্য লগইন করতে পারবেন।
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
                                <p className="text-xs text-slate-500 mt-0.5">
                                  মোবাইল: <strong className="font-mono text-slate-700">{acc.phone}</strong> • {acc.designation || 'সাধারণ সদস্য'} • {acc.area}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
                              {/* Requirement 6: Device Reset */}
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(`সদস্য '${acc.name}' এর বর্তমান ডিভাইস বাইন্ডিং মুছে ফেলতে চান? এতে করে তিনি তার নতুন ফোন/ডিভাইস থেকে লগইন করতে পারবেন।`)) {
                                    resetMemberDeviceBinding(acc.id);
                                    const fresh = loadUserAccounts();
                                    setUserAccounts(fresh);
                                    setNoticeMsg(`সদস্য '${acc.name}' এর ডিভাইস বাইন্ডিং সফলভাবে রিসেট করা হয়েছে`);
                                    setTimeout(() => setNoticeMsg(''), 3500);
                                  }
                                }}
                                className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition cursor-pointer"
                                title="নতুন ডিভাইসে লগইন করতে দিতে ডিভাইস বাইন্ডিং রিসেট করুন"
                              >
                                ডিভাইস রিসেট
                              </button>

                              {/* Requirement 6: Credential Recovery */}
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

                          {/* Tracking Details Grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] text-slate-600">
                            <div>
                              <span className="text-slate-400 font-medium">🌐 নিবন্ধিত আইপি: </span>
                              <span className="font-mono font-bold text-slate-800">{acc.registeredIp || 'রেকর্ড করা হয়নি'}</span>
                              <span className="block text-[10px] text-slate-400 truncate mt-0.5" title={acc.registeredDevice}>
                                ডিভাইস: {acc.registeredDevice || 'স্মার্টফোন'}
                              </span>
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

            {/* Requirement 3: View Toggle Bar (Default is Card View) */}
            <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl flex-wrap gap-2">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <span>ভিউ ফরম্যাট:</span>
                <span className="text-emerald-700 font-black">
                  {adminFundViewMode === 'card' ? 'কার্ড ভিউ (ডিফল্ট)' : 'রেসপনসিভ টেবিল'}
                </span>
              </span>
              <div className="flex items-center gap-1 bg-white p-0.5 rounded-xl border border-slate-200 shadow-2xs">
                <button
                  onClick={() => setAdminFundViewMode('card')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    adminFundViewMode === 'card'
                      ? 'bg-emerald-700 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>কার্ড ভিউ (ডিফল্ট)</span>
                </button>
                <button
                  onClick={() => setAdminFundViewMode('table')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    adminFundViewMode === 'table'
                      ? 'bg-emerald-700 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <TableIcon className="w-3.5 h-3.5" />
                  <span>টেবিল ভিউ</span>
                </button>
              </div>
            </div>

            {/* Requirement 3: Auto-Synced Member Fund Cards (Prominent Large Card View as Default) */}
            {adminFundViewMode === 'card' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredAdminFunds.map((record) => {
                  const isPaid = record.status === 'Paid';
                  // Auto-synced details from members list
                  const memberName = record.memberName;
                  const memberPhone = record.phone || '';
                  const memberDesignation = record.designation || record.notes || 'সাধারণ সদস্য';

                  return (
                    <div 
                      key={record.id} 
                      className="p-5 bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition space-y-3.5 flex flex-col justify-between"
                    >
                      <div>
                        {/* Header: Name, Designation & Status */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <h4 className="text-base font-black text-slate-900 truncate leading-snug">
                              {memberName}
                            </h4>
                            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                {memberDesignation}
                              </span>
                              <span className="text-[10px] text-slate-400 font-medium">
                                স্বয়ংক্রিয় সিঙ্ক
                              </span>
                            </div>
                          </div>

                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-black inline-flex items-center gap-1 shrink-0 select-none border ${
                              isPaid
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                : 'bg-amber-100 text-amber-800 border-amber-200'
                            }`}
                          >
                            {isPaid ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>পরিশোধিত</span>
                              </>
                            ) : (
                              <>
                                <Clock className="w-3.5 h-3.5 text-amber-600" />
                                <span>বকেয়া</span>
                              </>
                            )}
                          </span>
                        </div>

                        {/* Amount & Dues Breakdown */}
                        <div className="mt-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-slate-500">চাঁদার পরিমাণ:</span>
                            <span className={`text-lg font-black ${isPaid ? 'text-emerald-700' : 'text-amber-600'}`}>
                              {formatBengaliCurrency(record.amount)}
                            </span>
                          </div>

                          {/* Specific Dues & Payments (Requirement 4) */}
                          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 text-xs">
                            <div className="p-2 rounded-xl bg-emerald-50/70 border border-emerald-100">
                              <span className="text-[10px] text-emerald-700 block font-bold">পরিশোধিত টাকা:</span>
                              <span className="font-mono font-black text-emerald-900">
                                {formatBengaliCurrency(record.paidAmount ?? (isPaid ? record.amount : 0))}
                              </span>
                            </div>
                            <div className="p-2 rounded-xl bg-amber-50/70 border border-amber-100">
                              <span className="text-[10px] text-amber-700 block font-bold">বকেয়া টাকা:</span>
                              <span className="font-mono font-black text-amber-900">
                                {formatBengaliCurrency(record.dueAmount ?? (!isPaid ? record.amount : 0))}
                              </span>
                            </div>
                          </div>

                          {/* Month Details */}
                          <div className="pt-2 border-t border-slate-200/80 text-[11px] space-y-1">
                            <div className="flex items-center justify-between text-slate-700">
                              <span className="text-slate-500">নির্ধারিত মাস:</span>
                              <span className="font-bold text-slate-800">{record.month || 'চলতি মাস'}</span>
                            </div>
                            {record.paidMonths && (
                              <div className="flex items-start justify-between gap-2">
                                <span className="text-emerald-700 font-bold shrink-0">পরিশোধিত মাস:</span>
                                <span className="font-bold text-emerald-900 bg-emerald-100/70 px-2 py-0.5 rounded text-right">
                                  {record.paidMonths}
                                </span>
                              </div>
                            )}
                            {record.dueMonths && (
                              <div className="flex items-start justify-between gap-2">
                                <span className="text-amber-700 font-bold shrink-0">বকেয়া মাস:</span>
                                <span className="font-bold text-amber-900 bg-amber-100/70 px-2 py-0.5 rounded text-right">
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
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                        {/* Phone with copy */}
                        {memberPhone ? (
                          <div className="flex items-center gap-1.5">
                            <a 
                              href={`tel:${memberPhone}`}
                              className="flex items-center gap-1 font-mono text-xs font-bold text-slate-700 hover:text-emerald-700"
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
                              className="text-slate-400 p-0.5 cursor-pointer hover:text-slate-600"
                              title="কপি করুন"
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

                          {/* SMS */}
                          {memberPhone && (
                            <button
                              onClick={() => handleSendFundSms(record)}
                              className="p-1.5 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 cursor-pointer transition border border-slate-200"
                              title="SMS রসিদ পাঠান / কপি করুন"
                            >
                              <Send className="w-3.5 h-3.5 text-emerald-600" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Alternative View: Table View */}
            {adminFundViewMode === 'table' && (
              <div className="border border-slate-200 rounded-3xl overflow-hidden overflow-x-auto bg-white shadow-2xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                      <th className="p-3.5 sm:p-4">সদস্যের নাম ও পদবি (স্বয়ংক্রিয় সিঙ্ক)</th>
                      <th className="p-3.5 sm:p-4">মোবাইল নম্বর</th>
                      <th className="p-3.5 sm:p-4">মাস ও বকেয়া বিবরণ</th>
                      <th className="p-3.5 sm:p-4">চাঁদার পরিমাণ</th>
                      <th className="p-3.5 sm:p-4 text-center">বর্তমান অবস্থা</th>
                      <th className="p-3.5 sm:p-4 text-center">অ্যাকশন ও সম্পাদনা</th>
                      <th className="p-3.5 sm:p-4 text-right">রসিদ / SMS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredAdminFunds.map((record) => {
                      const isPaid = record.status === 'Paid';
                      const memberName = record.memberName;
                      const memberPhone = record.phone || '';
                      const memberDesignation = record.designation || record.notes || 'সাধারণ সদস্য';

                      return (
                        <tr key={record.id} className="hover:bg-slate-50/70 transition">
                          <td className="p-3.5 sm:p-4 font-bold text-slate-900">
                            <div className="text-sm font-black text-slate-900">{memberName}</div>
                            <div className="text-[11px] text-emerald-700 font-bold mt-0.5">
                              {memberDesignation}
                            </div>
                          </td>

                          <td className="p-3.5 sm:p-4 font-mono text-slate-700">
                            {memberPhone ? (
                              <div className="flex items-center gap-1.5">
                                <span>{memberPhone}</span>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(memberPhone);
                                    setCopiedFundPhone(memberPhone);
                                    setTimeout(() => setCopiedFundPhone(null), 2000);
                                  }}
                                  className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
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
                              <span className="text-slate-400 italic">নম্বর নেই</span>
                            )}
                          </td>

                          <td className="p-3.5 sm:p-4 text-slate-600">
                            <div className="font-semibold text-slate-800">{record.month || 'চলতি মাস'}</div>
                            {record.paidMonths && (
                              <div className="text-[10px] text-emerald-700 font-bold mt-0.5">
                                পরিশোধ: {record.paidMonths}
                              </div>
                            )}
                            {record.dueMonths && (
                              <div className="text-[10px] text-amber-700 font-bold mt-0.5">
                                বকেয়া: {record.dueMonths}
                              </div>
                            )}
                          </td>

                          <td className="p-3.5 sm:p-4">
                            <span className={`font-black text-sm ${isPaid ? 'text-emerald-700' : 'text-amber-600'}`}>
                              {formatBengaliCurrency(record.amount)}
                            </span>
                          </td>

                          <td className="p-3.5 sm:p-4 text-center">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                              isPaid 
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                                : 'bg-amber-100 text-amber-800 border border-amber-200'
                            }`}>
                              {isPaid ? (
                                <>
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  <span>পরিশোধিত</span>
                                </>
                              ) : (
                                <>
                                  <Clock className="w-3 h-3 text-amber-600" />
                                  <span>বকেয়া</span>
                                </>
                              )}
                            </span>
                          </td>

                          {/* Action: Dedicated Edit Button + Quick Status Toggle */}
                          <td className="p-3.5 sm:p-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => handleOpenEditFund(record)}
                                className="px-2.5 py-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition cursor-pointer flex items-center gap-1 border border-emerald-200"
                                title="বিস্তারিত সম্পাদন করুন"
                              >
                                <Edit className="w-3.5 h-3.5 text-emerald-600" />
                                <span>এডিট</span>
                              </button>

                              <button
                                onClick={() => handleToggleFund(record.id, record.status)}
                                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition cursor-pointer shadow-xs active:scale-95 inline-flex items-center gap-1 border ${
                                  isPaid
                                    ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300'
                                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-emerald-300'
                                }`}
                                title={isPaid ? "ক্লিক করে 'বকেয়া' করুন" : "ক্লিক করে 'পরিশোধিত' করুন"}
                              >
                                {isPaid ? "'বকেয়া' করুন" : "'পরিশোধ' করুন"}
                              </button>
                            </div>
                          </td>

                          {/* Send / Copy SMS */}
                          <td className="p-3.5 sm:p-4 text-right">
                            {memberPhone && (
                              <button
                                onClick={() => handleSendFundSms(record)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 transition cursor-pointer font-bold text-[11px]"
                                title="SMS রসিদ কপি / পাঠান"
                              >
                                <Send className="w-3 h-3 text-emerald-600" />
                                <span>SMS</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

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
                {/* Logo Preview */}
                <div className="w-20 h-20 rounded-2xl bg-white border-2 border-dashed border-emerald-300 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                  {logoUrl ? (
                    <img 
                      src={logoUrl} 
                      alt="Organization Logo" 
                      className="w-full h-full object-contain p-1"
                    />
                  ) : (
                    <div className="text-center p-2 text-slate-400">
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

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="block font-bold text-slate-700 mb-1">জরুরি হটলাইন</label>
                <input
                  type="text"
                  value={hotline}
                  onChange={(e) => setHotline(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">মোবাইল নম্বর</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">রেজিস্ট্রেশন নম্বর</label>
                <input
                  type="text"
                  value={regNumber}
                  onChange={(e) => setRegNumber(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
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

          {/* Supabase Cloud Connection Status */}
          <div className="pt-4 border-t border-slate-100 space-y-2">
            <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <Cloud className="w-4 h-4 text-emerald-600" />
              <span>Supabase ক্লাউড ডাটাবেজ স্ট্যাটাস</span>
            </h4>
            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-1">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>ক্লাউড সিঙ্ক:</span>
                </span>
                <span className="text-emerald-700">{supabaseStatus}</span>
              </div>
              <div className="text-[10px] text-slate-500 font-mono truncate">
                {SUPABASE_URL}
              </div>
            </div>
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
                  সদস্যের পুরো নাম <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
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
                  মোবাইল নম্বর <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
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

              {/* Field 2: Amount & Paid/Due Breakdown (Requirement 4) */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    মূল চাঁদার পরিমাণ (টাকায়) <span className="text-rose-500">*</span>
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
                      className="w-full pl-8 pr-4 py-2 rounded-xl border border-slate-200 bg-white font-mono text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                  {/* Amount quick selectors */}
                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
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
                        className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 text-[10px] font-bold transition cursor-pointer"
                      >
                        {amt} ৳
                      </button>
                    ))}
                  </div>
                </div>

                {/* Paid & Due Breakdown */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200">
                  <div>
                    <label className="block font-bold text-emerald-800 text-[11px] mb-1">
                      পরিশোধিত টাকা (৳):
                    </label>
                    <input
                      type="number"
                      value={editFundPaidAmount}
                      onChange={(e) => setEditFundPaidAmount(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50/50 font-mono text-xs font-bold text-emerald-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-amber-800 text-[11px] mb-1">
                      বকেয়া টাকা (৳):
                    </label>
                    <input
                      type="number"
                      value={editFundDueAmount}
                      onChange={(e) => setEditFundDueAmount(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-amber-200 bg-amber-50/50 font-mono text-xs font-bold text-amber-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              {/* Field 3: Month & Specific Paid / Due Month Management (Requirement 4) */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-slate-700 text-[11px] mb-1">
                      মূল রেফারেন্স মাস <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={editFundMonth}
                      onChange={(e) => setEditFundMonth(e.target.value)}
                      placeholder="যেমন: মার্চ ২০২৬"
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 text-[11px] mb-1">
                      তারিখ (Date)
                    </label>
                    <input
                      type="date"
                      value={editFundDate}
                      onChange={(e) => setEditFundDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white font-mono text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* Specific Paid Months (পরিশোধিত মাসসমূহ) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-emerald-800 text-[11px]">
                      পরিশোধিত মাসসমূহ (Paid Months):
                    </label>
                    <button
                      type="button"
                      onClick={() => setEditFundPaidMonths('')}
                      className="text-[10px] text-slate-400 hover:text-slate-600 underline cursor-pointer"
                    >
                      ক্লিয়ার
                    </button>
                  </div>
                  <input
                    type="text"
                    value={editFundPaidMonths}
                    onChange={(e) => setEditFundPaidMonths(e.target.value)}
                    placeholder="যেমন: জানুয়ারি ২০২৬, ফেব্রুয়ারি ২০২৬"
                    className="w-full px-2.5 py-1.5 rounded-xl border border-emerald-200 bg-white text-xs text-emerald-950 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  {/* Interactive Month Selector Chips */}
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {[
                      'জানুয়ারি ২০২৬', 'ফেব্রুয়ারি ২০২৬', 'মার্চ ২০২৬', 'এপ্রিল ২০২৬',
                      'মে ২০২৬', 'জুন ২০২৬', 'জুলাই ২০২৬', 'আগস্ট ২০২৬',
                      'সেপ্টেম্বর ২০২৬', 'অক্টোবর ২০২৬', 'নভেম্বর ২০২৬', 'ডিসেম্বর ২০২৬'
                    ].map((m) => {
                      const isSelected = editFundPaidMonths.includes(m);
                      return (
                        <button
                          key={m}
                          type="button"
                          onClick={() => {
                            const parts = editFundPaidMonths.split(',').map(s => s.trim()).filter(Boolean);
                            if (parts.includes(m)) {
                              setEditFundPaidMonths(parts.filter(x => x !== m).join(', '));
                            } else {
                              setEditFundPaidMonths([...parts, m].join(', '));
                            }
                          }}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition cursor-pointer border ${
                            isSelected
                              ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-emerald-50'
                          }`}
                        >
                          {isSelected && '✓ '}{m.split(' ')[0]}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Specific Due Months (বকেয়া মাসসমূহ) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-amber-800 text-[11px]">
                      বকেয়া মাসসমূহ (Due Months):
                    </label>
                    <button
                      type="button"
                      onClick={() => setEditFundDueMonths('')}
                      className="text-[10px] text-slate-400 hover:text-slate-600 underline cursor-pointer"
                    >
                      ক্লিয়ার
                    </button>
                  </div>
                  <input
                    type="text"
                    value={editFundDueMonths}
                    onChange={(e) => setEditFundDueMonths(e.target.value)}
                    placeholder="যেমন: মার্চ ২০২৬, এপ্রিল ২০২৬"
                    className="w-full px-2.5 py-1.5 rounded-xl border border-amber-200 bg-white text-xs text-amber-950 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                  {/* Interactive Month Selector Chips */}
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {[
                      'জানুয়ারি ২০২৬', 'ফেব্রুয়ারি ২০২৬', 'মার্চ ২০২৬', 'এপ্রিল ২০২৬',
                      'মে ২০২৬', 'জুন ২০২৬', 'জুলাই ২০২৬', 'আগস্ট ২০২৬',
                      'সেপ্টেম্বর ২০২৬', 'অক্টোবর ২০২৬', 'নভেম্বর ২০২৬', 'ডিসেম্বর ২০২৬'
                    ].map((m) => {
                      const isSelected = editFundDueMonths.includes(m);
                      return (
                        <button
                          key={m}
                          type="button"
                          onClick={() => {
                            const parts = editFundDueMonths.split(',').map(s => s.trim()).filter(Boolean);
                            if (parts.includes(m)) {
                              setEditFundDueMonths(parts.filter(x => x !== m).join(', '));
                            } else {
                              setEditFundDueMonths([...parts, m].join(', '));
                            }
                          }}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition cursor-pointer border ${
                            isSelected
                              ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-amber-50'
                          }`}
                        >
                          {isSelected && '✓ '}{m.split(' ')[0]}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Quick Month Control Buttons */}
                <div className="flex items-center gap-1.5 pt-1 border-t border-slate-200 flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      setEditFundStatus('Paid');
                      setEditFundPaidMonths(editFundMonth || 'মার্চ ২০২৬');
                      setEditFundDueMonths('');
                      setEditFundPaidAmount(editFundAmount);
                      setEditFundDueAmount('0');
                    }}
                    className="px-2.5 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-900 text-[10px] font-bold transition cursor-pointer"
                  >
                    সব পরিশোধিত চিহ্নিত করুন
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditFundStatus('Due');
                      setEditFundDueMonths(editFundMonth || 'মার্চ ২০২৬');
                      setEditFundDueAmount(editFundAmount);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 text-[10px] font-bold transition cursor-pointer"
                  >
                    চলতি মাস বকেয়া চিহ্নিত করুন
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditFundDueMonths('')}
                    className="px-2.5 py-1 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 text-[10px] font-bold transition cursor-pointer"
                  >
                    বকেয়া তালিকা খালি করুন
                  </button>
                </div>
              </div>

              {/* Field 4: Notes / Remarks */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  মন্তব্য বা রসিদ বিবরণ
                </label>
                <input
                  type="text"
                  value={editFundNotes}
                  onChange={(e) => setEditFundNotes(e.target.value)}
                  placeholder="যেমন: মাসিক নিয়মিত চাঁদা / বিকাশ মারফত পরিশোধিত"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
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
                  ইউনিক ইউজারনেম (Username) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 font-bold text-slate-400 font-mono">@</span>
                  <input
                    type="text"
                    required
                    value={credNewUsername}
                    onChange={(e) => {
                      const clean = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
                      setCredNewUsername(clean);
                      setCredError('');
                    }}
                    placeholder="সদস্যের নতুন ইউজারনেম"
                    className="w-full pl-7 pr-3 py-2 rounded-xl border border-slate-200 font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  শুধুমাত্র ছোট হাতের ইংরেজি অক্ষর, সংখ্যা ও আন্ডারস্কোর (_) ব্যবহার করা যাবে।
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
    </div>
  );
};
