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
  Smartphone,
  ShieldAlert,
  UserCheck,
  UserX,
  Ban,
  RefreshCw,
  AlertTriangle
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
  saveSecurityAlerts 
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

  // Member Management States
  const [memberSearch, setMemberSearch] = useState('');
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [deletingMemberId, setDeletingMemberId] = useState<string | null>(null);

  // Fund & Manual Net Balance Management States
  const [inputNetBalance, setInputNetBalance] = useState<string>(
    manualTotalBalance !== null && manualTotalBalance !== undefined ? manualTotalBalance.toString() : '0'
  );
  const [fundSearch, setFundSearch] = useState('');
  const [fundStatusFilter, setFundStatusFilter] = useState<'all' | PaymentStatus>('all');
  const [copiedFundPhone, setCopiedFundPhone] = useState<string | null>(null);
  const [adminFundViewMode, setAdminFundViewMode] = useState<'table' | 'card'>('table');

  // Dedicated Net Balance Modal State
  const [isNetBalanceModalOpen, setIsNetBalanceModalOpen] = useState(false);

  // Dedicated Fund Record Edit Modal State (Admin-Exclusive Edit System)
  const [editingFundRecord, setEditingFundRecord] = useState<FundRecord | null>(null);
  const [editFundStatus, setEditFundStatus] = useState<PaymentStatus>('Due');
  const [editFundAmount, setEditFundAmount] = useState<string>('500');
  const [editFundMonth, setEditFundMonth] = useState<string>('মার্চ ২০২৬');
  const [editFundDate, setEditFundDate] = useState<string>('');
  const [editFundNotes, setEditFundNotes] = useState<string>('');
  const [isSavingFundEdit, setIsSavingFundEdit] = useState<boolean>(false);

  const handleOpenEditFund = (rec: FundRecord) => {
    setEditingFundRecord(rec);
    setEditFundStatus(rec.status);
    setEditFundAmount(rec.amount !== undefined ? rec.amount.toString() : '500');
    setEditFundMonth(rec.month || 'চলতি মাস');
    setEditFundDate(rec.date || new Date().toISOString().split('T')[0]);
    setEditFundNotes(rec.notes || rec.description || '');
  };

  const handleSaveFundRecordEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFundRecord) return;

    const parsedAmount = parseFloat(editFundAmount);
    const amount = isNaN(parsedAmount) ? 0 : parsedAmount;

    setIsSavingFundEdit(true);
    try {
      const updated: FundRecord = {
        ...editingFundRecord,
        status: editFundStatus,
        amount,
        month: editFundMonth.trim() || 'চলতি মাস',
        date: editFundDate.trim() || new Date().toISOString().split('T')[0],
        notes: editFundNotes.trim(),
        description: editFundNotes.trim() || editingFundRecord.description || 'নিয়মিত চাঁদা',
        approvedAt: editFundStatus === 'Paid' ? (editingFundRecord.approvedAt || new Date().toISOString()) : undefined
      };

      if (onEditFundRecord) {
        await onEditFundRecord(updated);
      }
      setEditingFundRecord(null);
      setNoticeMsg(`"${updated.memberName}"-এর চাঁদা তথ্য সফলভাবে আপডেট হয়েছে`);
      setTimeout(() => setNoticeMsg(''), 3000);
    } catch {
      setErrorMsg('চাঁদা তথ্য সংরক্ষণে সমস্যা হয়েছে');
      setTimeout(() => setErrorMsg(''), 3000);
    } finally {
      setIsSavingFundEdit(false);
    }
  };

  useEffect(() => {
    if (manualTotalBalance !== null && manualTotalBalance !== undefined) {
      setInputNetBalance(manualTotalBalance.toString());
    }
  }, [manualTotalBalance]);

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
      email
    });
    setNoticeMsg('সংগঠনের প্রোফাইল সফলভাবে আপডেট করা হয়েছে');
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
          <ShieldAlert className="w-4 h-4 text-amber-500" />
          <span>নিবন্ধন ও ডিভাইস ট্র্যাকিং</span>
          {pendingAccounts.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black">
              {toBengaliNumber(pendingAccounts.length)}
            </span>
          )}
          {unresolvedAlerts.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-rose-600 text-white text-[10px] font-black">
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
                    <span>সদস্য নিবন্ধন অনুমোদন ও ডিভাইস ট্র্যাকিং সিকিউরিটি</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-200 border border-emerald-400/30">
                      লাইভ সিকিউরিটি
                    </span>
                  </h3>
                  <p className="text-xs text-emerald-200/80 mt-0.5 max-w-xl">
                    অনলাইন নিবন্ধন পর্যালোচনা, ইউনিক ইউজারনেম বরাদ্দ, সদস্যদের আইপি ও ডিভাইস ট্র্যাকিং এবং সন্দেহজনক একাউন্ট তাৎক্ষণিক ব্লক করার প্রশাসনিক নিয়ন্ত্রণ।
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
                    ? 'bg-amber-400 text-emerald-950 shadow-xs'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>অনুমোদন অপেক্ষমাণ ({toBengaliNumber(pendingAccounts.length)})</span>
              </button>

              <button
                type="button"
                onClick={() => setRegSubTab('approved')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                  regSubTab === 'approved'
                    ? 'bg-emerald-400 text-emerald-950 shadow-xs'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>অনুমোদিত অ্যাকাউন্ট ও ডিভাইস ট্র্যাকিং ({toBengaliNumber(approvedAccounts.length)})</span>
              </button>

              <button
                type="button"
                onClick={() => setRegSubTab('alerts')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                  regSubTab === 'alerts'
                    ? 'bg-rose-500 text-white shadow-xs'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>নিরাপত্তা অ্যালার্ট ও সতর্কতা ({toBengaliNumber(securityAlerts.length)})</span>
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
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-100">
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
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-3">
                              <span>মোবাইল: <strong className="font-mono text-slate-700">{account.phone}</strong></span>
                              <span>•</span>
                              <span>ঠিকানা: {account.area}</span>
                            </p>
                          </div>

                          <div className="text-right text-[11px] text-slate-500">
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
                              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-sm ${
                                isBlocked 
                                  ? 'bg-rose-100 text-rose-800 border border-rose-300' 
                                  : isFlagged 
                                  ? 'bg-amber-100 text-amber-800 border border-amber-300' 
                                  : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              }`}>
                                {isBlocked ? <Ban className="w-5 h-5 text-rose-700" /> : acc.name.charAt(0) || 'স'}
                              </div>

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

                            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
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
          {/* Card 1: Manual Net Balance Control (Rule 1 & 2: Dedicated Admin Control & Cloud Data Binding) */}
          <div className="bg-gradient-to-br from-slate-900 via-teal-950 to-emerald-950 rounded-3xl p-5 sm:p-6 text-white border border-teal-800/40 shadow-lg space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-teal-500/20 text-teal-300 flex items-center justify-center shrink-0 border border-teal-400/30">
                  <Wallet className="w-6 h-6 text-teal-300" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-black text-white">
                      বর্তমান নেট ব্যালেন্স নিয়ন্ত্রণ (Manual Net Balance Control)
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-400/20 text-teal-200 border border-teal-400/30">
                      ম্যানুয়াল নিয়ন্ত্রণ
                    </span>
                  </div>
                  <p className="text-xs text-teal-200/80 mt-0.5 max-w-xl">
                    বর্তমান নেট ব্যালেন্স কোনো এন্ট্রি বা হিসাব থেকে স্বয়ংক্রিয়ভাবে পরিবর্তিত হয় না। অ্যাডমিন কর্তৃক নির্ধারিত ব্যালেন্সই Supabase ক্লাউড ও অ্যাপ জুড়ে প্রদর্শিত হবে।
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="px-4 py-2.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-left sm:text-right shrink-0">
                  <span className="text-[10px] text-teal-200 uppercase font-bold block">বর্তমান নির্ধারিত ব্যালেন্স</span>
                  <span className="text-xl sm:text-2xl font-black text-emerald-400">
                    {formatBengaliCurrency(manualTotalBalance ?? 0)}
                  </span>
                </div>
                <button
                  onClick={() => setIsNetBalanceModalOpen(true)}
                  className="px-3 py-2.5 rounded-2xl bg-teal-600/60 hover:bg-teal-500 text-white text-xs font-bold transition cursor-pointer flex items-center gap-1.5 border border-teal-400/40"
                  title="মোডালে ব্যালেন্স এডিট করুন"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">মোডাল এডিটর</span>
                </button>
              </div>
            </div>

            {/* Manual Balance Edit Form */}
            <form onSubmit={handleSaveManualBalance} className="pt-3 border-t border-teal-800/60 flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
              <div className="flex-1">
                <label className="block text-xs font-bold text-teal-100 mb-1">
                  মোট নেট ব্যালেন্সের নতুন পরিমাণ লিখুন (টাকায়):
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-teal-400 text-sm">৳</span>
                  <input
                    type="number"
                    required
                    value={inputNetBalance}
                    onChange={(e) => setInputNetBalance(e.target.value)}
                    placeholder="যেমন: 50000"
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-slate-800/90 border border-teal-500/40 text-white font-mono text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition cursor-pointer active:scale-95"
              >
                <Save className="w-4 h-4" />
                <span>ব্যালেন্স সংরক্ষণ ও ক্লাউড সিঙ্ক</span>
              </button>
            </form>
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

            {/* Mobile View Toggle Bar (sm:hidden) */}
            <div className="flex sm:hidden items-center justify-between px-3 py-2 bg-slate-50 border border-slate-200 rounded-2xl">
              <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                <span>ভিউ ফরম্যাট:</span>
                <span className="text-emerald-700 font-extrabold">{adminFundViewMode === 'table' ? 'রেসপনসিভ টেবিল' : 'কার্ড'}</span>
              </span>
              <div className="flex items-center gap-1 bg-white p-0.5 rounded-xl border border-slate-200 shadow-2xs">
                <button
                  onClick={() => setAdminFundViewMode('table')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                    adminFundViewMode === 'table'
                      ? 'bg-emerald-700 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  টেবিল ভিউ (৫ কলাম)
                </button>
                <button
                  onClick={() => setAdminFundViewMode('card')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                    adminFundViewMode === 'card'
                      ? 'bg-emerald-700 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  কার্ড ভিউ
                </button>
              </div>
            </div>

            {/* Mobile View 1: 5-Column Responsive Table (Rule 6 & 7: 100% Mobile Screen Fit, Zero Horizontal Scrolling) */}
            {adminFundViewMode === 'table' && (
              <div className="block sm:hidden w-full border border-slate-200 rounded-2xl overflow-hidden bg-white">
                <table className="w-full table-fixed text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-700 font-bold text-[10px]">
                      <th className="w-[27%] p-2 truncate">নাম ও পদবি</th>
                      <th className="w-[22%] p-2 truncate">মোবাইল</th>
                      <th className="w-[18%] p-2 truncate">মাস/তারিখ</th>
                      <th className="w-[16%] p-2 text-right truncate">পরিমাণ</th>
                      <th className="w-[17%] p-2 text-center truncate">অবস্থা/এডিট</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[11px]">
                    {filteredAdminFunds.map((record) => {
                      const isPaid = record.status === 'Paid';
                      return (
                        <tr key={record.id} className="hover:bg-slate-50/70 transition">
                          {/* 1. Name & Designation */}
                          <td className="p-2 align-middle">
                            <div className="font-bold text-slate-900 truncate leading-tight">
                              {record.memberName}
                            </div>
                            <div className="text-[9px] text-slate-500 truncate mt-0.5">
                              {record.notes || record.description || 'নিয়মিত সদস্য'}
                            </div>
                          </td>

                          {/* 2. Mobile */}
                          <td className="p-2 align-middle">
                            {record.phone ? (
                              <div className="font-mono text-[10px] text-slate-700 font-bold truncate">
                                {record.phone}
                              </div>
                            ) : (
                              <span className="text-[9px] text-slate-400 italic">নেই</span>
                            )}
                          </td>

                          {/* 3. Month & Date */}
                          <td className="p-2 align-middle">
                            <div className="font-semibold text-slate-800 text-[10px] truncate leading-tight">
                              {record.month || 'চলতি মাস'}
                            </div>
                            <div className="text-[9px] text-slate-400 truncate mt-0.5">
                              {record.date}
                            </div>
                          </td>

                          {/* 4. Amount */}
                          <td className="p-2 align-middle text-right">
                            <span className={`font-black text-[11px] block leading-tight ${
                              isPaid ? 'text-emerald-700' : 'text-amber-600'
                            }`}>
                              {formatBengaliCurrency(record.amount)}
                            </span>
                          </td>

                          {/* 5. Status & Dedicated Edit */}
                          <td className="p-2 align-middle text-center">
                            <div className="flex flex-col items-center gap-1">
                              <button
                                onClick={() => handleToggleFund(record.id, record.status)}
                                className={`px-1.5 py-0.5 rounded-full text-[9px] font-black inline-block select-none border leading-tight cursor-pointer active:scale-95 transition ${
                                  isPaid
                                    ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border-emerald-200'
                                    : 'bg-amber-100 hover:bg-amber-200 text-amber-800 border-amber-200'
                                }`}
                                title="ক্লিক করে স্ট্যাটাস পরিবর্তন করুন"
                              >
                                {isPaid ? 'পরিশোধ' : 'বকেয়া'}
                              </button>
                              <button
                                onClick={() => handleOpenEditFund(record)}
                                className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 text-[9px] font-bold border border-slate-200 flex items-center gap-0.5 cursor-pointer active:scale-95"
                                title="রেকর্ড বিস্তারিত এডিট করুন"
                              >
                                <Edit className="w-2.5 h-2.5 text-emerald-600" />
                                <span>এডিট</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Mobile View 2: Detailed Card List */}
            {adminFundViewMode === 'card' && (
              <div className="block sm:hidden divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
                {filteredAdminFunds.map((record) => {
                  const isPaid = record.status === 'Paid';
                  return (
                    <div key={record.id} className="p-3.5 bg-white space-y-2 hover:bg-slate-50/70 transition">
                      {/* Row 1: Member Name & Designation + Status Badge */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-bold text-slate-900 truncate">
                            {record.memberName}
                          </h4>
                          <p className="text-[10px] text-slate-500 truncate mt-0.5">
                            {record.notes || record.description || 'নিয়মিত চাঁদা'}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 shrink-0 select-none border ${
                            isPaid
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}
                        >
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
                      </div>

                      {/* Row 2: Phone, Month & Date */}
                      <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-50 gap-2">
                        <div className="flex items-center gap-1 font-mono text-slate-700 font-bold shrink-0">
                          {record.phone ? (
                            <>
                              <Phone className="w-3 h-3 text-emerald-600 shrink-0" />
                              <span>{record.phone}</span>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(record.phone || '');
                                  setCopiedFundPhone(record.phone || '');
                                  setTimeout(() => setCopiedFundPhone(null), 2000);
                                }}
                                className="text-slate-400 p-0.5 cursor-pointer"
                                title="কপি করুন"
                              >
                                {copiedFundPhone === record.phone ? (
                                  <Check className="w-2.5 h-2.5 text-emerald-600" />
                                ) : (
                                  <Copy className="w-2.5 h-2.5" />
                                )}
                              </button>
                            </>
                          ) : (
                            <span className="text-slate-400 italic text-[10px]">নম্বর নেই</span>
                          )}
                        </div>

                        <div className="text-[10px] text-slate-500 truncate text-right">
                          <span className="font-semibold text-slate-700">{record.month || 'চলতি মাস'}</span>
                          <span className="mx-1">•</span>
                          <span>{record.date}</span>
                        </div>
                      </div>

                      {/* Row 3: Amount + Dedicated Edit Button + Quick Status Toggle + SMS */}
                      <div className="flex items-center justify-between pt-1 border-t border-slate-50 gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-slate-400">পরিমাণ:</span>
                          <span className={`font-black text-xs ${isPaid ? 'text-emerald-700' : 'text-amber-600'}`}>
                            {formatBengaliCurrency(record.amount)}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {/* Dedicated Edit Button */}
                          <button
                            onClick={() => handleOpenEditFund(record)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-[11px] font-bold transition cursor-pointer flex items-center gap-1 active:scale-95"
                            title="রেকর্ড বিস্তারিত সম্পাদনা করুন"
                          >
                            <Edit className="w-3 h-3 text-emerald-700" />
                            <span>এডিট</span>
                          </button>

                          {/* Quick Status Toggle Button */}
                          <button
                            onClick={() => handleToggleFund(record.id, record.status)}
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer active:scale-95 border ${
                              isPaid
                                ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-200'
                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-emerald-200'
                            }`}
                            title={isPaid ? "'বকেয়া' করুন" : "'পরিশোধিত' করুন"}
                          >
                            {isPaid ? "বকেয়া" : "পরিশোধ"}
                          </button>

                          {/* SMS */}
                          {record.phone && (
                            <button
                              onClick={() => handleSendFundSms(record)}
                              className="p-1 rounded-lg bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 cursor-pointer"
                              title="SMS"
                            >
                              <Send className="w-3 h-3 text-emerald-600" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Desktop View: Full Table (sm: and up) */}
            <div className="hidden sm:block border border-slate-200 rounded-2xl overflow-hidden overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                    <th className="p-3.5">সদস্যের নাম ও পদবি</th>
                    <th className="p-3.5">মোবাইল নম্বর</th>
                    <th className="p-3.5">মাস ও তারিখ</th>
                    <th className="p-3.5">চাঁদার পরিমাণ</th>
                    <th className="p-3.5 text-center">বর্তমান অবস্থা</th>
                    <th className="p-3.5 text-center">অ্যাকশন ও সম্পাদনা</th>
                    <th className="p-3.5 text-right">রসিদ / SMS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAdminFunds.map((record) => {
                    const isPaid = record.status === 'Paid';
                    return (
                      <tr key={record.id} className="hover:bg-slate-50/70 transition">
                        <td className="p-3.5 font-bold text-slate-900">
                          <div>{record.memberName}</div>
                          <div className="text-[11px] text-slate-500 font-normal mt-0.5">
                            {record.notes || record.description || 'নিয়মিত সদস্য'}
                          </div>
                        </td>

                        <td className="p-3.5 font-mono text-slate-700">
                          {record.phone ? (
                            <div className="flex items-center gap-1.5">
                              <span>{record.phone}</span>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(record.phone || '');
                                  setCopiedFundPhone(record.phone || '');
                                  setTimeout(() => setCopiedFundPhone(null), 2000);
                                }}
                                className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                                title="নম্বর কপি করুন"
                              >
                                {copiedFundPhone === record.phone ? (
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

                        <td className="p-3.5 text-slate-600">
                          <div className="font-semibold text-slate-800">{record.month || 'চলতি মাস'}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{record.date}</div>
                        </td>

                        <td className="p-3.5">
                          <span className={`font-black text-sm ${isPaid ? 'text-emerald-700' : 'text-amber-600'}`}>
                            {formatBengaliCurrency(record.amount)}
                          </span>
                        </td>

                        <td className="p-3.5 text-center">
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
                        <td className="p-3.5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleOpenEditFund(record)}
                              className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 text-xs font-bold transition cursor-pointer flex items-center gap-1"
                              title="বিস্তারিত সম্পাদন করুন"
                            >
                              <Edit className="w-3.5 h-3.5 text-emerald-600" />
                              <span>সম্পাদনা</span>
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
                              {isPaid ? (
                                <>
                                  <Clock className="w-3 h-3 text-amber-700" />
                                  <span>'বকেয়া' করুন</span>
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                                  <span>'পরিশোধিত' করুন</span>
                                </>
                              )}
                            </button>
                          </div>
                        </td>

                        {/* Send / Copy SMS */}
                        <td className="p-3.5 text-right">
                          {record.phone && (
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

            {filteredAdminFunds.length === 0 && (
              <div className="p-10 text-center text-slate-400">
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

            {/* Target Member Summary Card */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 block font-bold uppercase">সদস্যের নাম</span>
                <h4 className="text-sm font-bold text-slate-900">{editingFundRecord.memberName}</h4>
                {editingFundRecord.phone && (
                  <span className="text-[11px] font-mono text-emerald-700 font-bold block mt-0.5">
                    {editingFundRecord.phone}
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
                  পরিশোধের স্ট্যাটাস (Payment Status) <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditFundStatus('Paid')}
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
                    onClick={() => setEditFundStatus('Due')}
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

              {/* Field 2: Amount (কতো টাকা আছে) */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  চাঁদার পরিমাণ (টাকায়) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-emerald-700 text-sm">৳</span>
                  <input
                    type="number"
                    required
                    value={editFundAmount}
                    onChange={(e) => setEditFundAmount(e.target.value)}
                    placeholder="যেমন: 500"
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 font-mono text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                {/* Amount quick selectors */}
                <div className="flex items-center gap-1.5 mt-1.5">
                  {['200', '300', '500', '1000', '2000'].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setEditFundAmount(amt)}
                      className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 text-[10px] font-bold transition cursor-pointer"
                    >
                      {amt} ৳
                    </button>
                  ))}
                </div>
              </div>

              {/* Field 3: Month & Date Reference (কোন মাসের) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    কোন মাসের (Month) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editFundMonth}
                    onChange={(e) => setEditFundMonth(e.target.value)}
                    placeholder="যেমন: মার্চ ২০২৬"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    তারিখ (Date)
                  </label>
                  <input
                    type="date"
                    value={editFundDate}
                    onChange={(e) => setEditFundDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-mono"
                  />
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
                  placeholder="যেমন: মাসিক নিয়মিত চাঁদা / বিকাশ মারফত"
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
    </div>
  );
};
