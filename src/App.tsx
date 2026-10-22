import React, { useState, useEffect } from 'react';
import { 
  ActiveScreen, 
  Member, 
  BloodDonor, 
  Notice, 
  FundRecord, 
  OrganizationProfile, 
  PaymentGatewayConfig, 
  HomeSlide, 
  HumanitarianActivity, 
  OrganizationRule,
  SupportReportItem,
  SupportTeamMember,
  PaymentStatus,
  UserAccount,
  AidDonationRecord,
  ExtraContributionRecord
} from './types';
import { 
  loadOrgProfile, 
  saveOrgProfile, 
  loadMembers, 
  saveMembers, 
  loadDonors, 
  saveDonors, 
  loadFunds, 
  saveFunds, 
  loadNotices, 
  saveNotices, 
  loadHomeSlides, 
  saveHomeSlides, 
  loadAidDonations,
  saveAidDonations,
  loadExtraContributions,
  saveExtraContributions,
  loadHumanitarianActivities, 
  saveHumanitarianActivities, 
  loadOrganizationRules, 
  saveOrganizationRules, 
  loadSupportReports, 
  saveSupportReports, 
  loadSupportMembers,
  saveSupportMembers,
  loadPaymentSettings, 
  savePaymentSettings, 
  loadManualTotalBalance, 
  saveManualTotalBalance,
  loadMonthlyExpense,
  saveMonthlyExpense,
  loadExtraMoney,
  saveExtraMoney,
  PMS_SYNC_EVENT,
  markIdAsPermanentlyDeleted,
  isIdPermanentlyDeleted
} from './utils/storage';
import { 
  loadLoggedInUser, 
  saveLoggedInUser, 
  loadIsAdminSession, 
  saveIsAdminSession,
  loadUserAccounts 
} from './utils/authSecurity';
import { sortMembersOldestFirst } from './utils/helpers';
import { autoSyncMembersToFunds } from './utils/memberFundLinker';
import { 
  fetchSupabaseData, 
  safeSyncToSupabase, 
  safeDeleteFromSupabase,
  syncNetBalanceToSupabase,
  fetchNetBalanceFromSupabase,
  pullAllDataFromSupabase,
  syncFinancialsToSupabase,
  pushAllDataToSupabase
} from './utils/supabaseClient';
import { initRealTimeDataSync } from './utils/liveSync';

import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { HomeScreen } from './components/HomeScreen';
import { MemberListScreen } from './components/MemberListScreen';
import { BloodDonationScreen } from './components/BloodDonationScreen';
import { FundScreen } from './components/FundScreen';
import { NoticeScreen } from './components/NoticeScreen';
import { CalendarScreen } from './components/CalendarScreen';
import { SupportScreen } from './components/SupportScreen';
import { AdminPanelScreen } from './components/AdminPanelScreen';
import { AuthModal } from './components/AuthModal';
import { AuthGateScreen } from './components/AuthGateScreen';
import { EmergencyHelplineModal } from './components/EmergencyHelplineModal';

export default function App() {
  const [activeScreen, setActiveScreen] = useState<ActiveScreen>('home');
  const [isAdmin, setIsAdmin] = useState<boolean>(() => loadIsAdminSession());
  // Requirement 3: Admin View Switcher (User View vs. Admin Panel View)
  const [adminViewMode, setAdminViewMode] = useState<'admin' | 'user'>('admin');
  const [loggedInUser, setLoggedInUser] = useState<UserAccount | null>(() => {
    const user = loadLoggedInUser();
    if (user) {
      // Validate that user is still active and approved
      const accounts = loadUserAccounts();
      const fresh = accounts.find(a => a.id === user.id);
      if (fresh && fresh.status === 'approved') {
        return fresh;
      }
      saveLoggedInUser(null);
      return null;
    }
    return null;
  });

  // Strict Authentication status: Either master admin session OR approved regular member
  const isApprovedMember = loggedInUser !== null && loggedInUser.status === 'approved';
  const isAuthenticated = isAdmin || isApprovedMember;

  // Real-time preview mode: When admin selects 'user' view, pass isAdmin: false to user screens
  const effectiveIsAdminForScreens = isAdmin && adminViewMode === 'admin';

  // Data States
  const [profile, setProfile] = useState<OrganizationProfile>(() => loadOrgProfile());
  const [members, setMembers] = useState<Member[]>(() => sortMembersOldestFirst(loadMembers()));
  const [donors, setDonors] = useState<BloodDonor[]>(() => loadDonors());
  const [notices, setNotices] = useState<Notice[]>(() => loadNotices());
  const [funds, setFunds] = useState<FundRecord[]>(() => autoSyncMembersToFunds(loadMembers(), loadFunds()));
  const [homeSlides, setHomeSlides] = useState<HomeSlide[]>(() => loadHomeSlides());
  const [aidDonations, setAidDonations] = useState<AidDonationRecord[]>(() => loadAidDonations());
  const [extraContributions, setExtraContributions] = useState<ExtraContributionRecord[]>(() => loadExtraContributions());
  const [humanitarianActivities, setHumanitarianActivities] = useState<HumanitarianActivity[]>(() => loadHumanitarianActivities());
  const [organizationRules, setOrganizationRules] = useState<OrganizationRule[]>(() => loadOrganizationRules());
  const [supportReports, setSupportReports] = useState<SupportReportItem[]>(() => loadSupportReports());
  const [supportMembers, setSupportMembers] = useState<SupportTeamMember[]>(() => loadSupportMembers());
  const [paymentConfig, setPaymentConfig] = useState<PaymentGatewayConfig>(() => loadPaymentSettings());
  const [manualTotalBalance, setManualTotalBalance] = useState<number | null>(() => loadManualTotalBalance());
  const [monthlyExpense, setMonthlyExpense] = useState<number>(() => loadMonthlyExpense());
  const [extraMoney, setExtraMoney] = useState<number>(() => loadExtraMoney());
  const [adminActiveTab, setAdminActiveTab] = useState<string>('members');

  // Modals
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);

  // Requirement 9: Network Connection & Offline State Monitoring
  const [isOffline, setIsOffline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? !navigator.onLine : false;
  });

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleOpenAuthModal = (mode: 'login' | 'register' = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const handleAdminLoginSuccess = () => {
    setIsAdmin(true);
    saveIsAdminSession(true);
    setAdminViewMode('admin');
    setActiveScreen('admin');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleMemberLoginSuccess = (user: UserAccount) => {
    setLoggedInUser(user);
    saveLoggedInUser(user);
    setActiveScreen('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Instant admin logout handler with immediate redirect
  const handleAdminLogout = () => {
    setIsAdmin(false);
    saveIsAdminSession(false);
    setAdminViewMode('admin');
    setActiveScreen('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Seamless Dual-View Mode Switcher: User View vs Admin Panel View
  const handleSelectViewMode = (mode: 'admin' | 'user') => {
    setAdminViewMode(mode);
    if (mode === 'admin') {
      setActiveScreen('admin');
    } else {
      if (activeScreen === 'admin') {
        setActiveScreen('home');
      }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleMemberLogout = () => {
    setLoggedInUser(null);
    saveLoggedInUser(null);
    setActiveScreen('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Sync listener: If currently logged in user gets blocked/rejected or admin session drops, kick out immediately
  useEffect(() => {
    const handleAccountSync = () => {
      if (loggedInUser) {
        const accounts = loadUserAccounts();
        const fresh = accounts.find(a => a.id === loggedInUser.id);
        if (!fresh || fresh.status !== 'approved') {
          setLoggedInUser(null);
          saveLoggedInUser(null);
        }
      }
      if (isAdmin) {
        if (!loadIsAdminSession()) {
          setIsAdmin(false);
        }
      }
    };
    window.addEventListener(PMS_SYNC_EVENT, handleAccountSync);
    window.addEventListener('storage', handleAccountSync);
    return () => {
      window.removeEventListener(PMS_SYNC_EVENT, handleAccountSync);
      window.removeEventListener('storage', handleAccountSync);
    };
  }, [loggedInUser, isAdmin]);

  // Strict route isolation: Ensure regular members can NEVER access admin panel screen
  useEffect(() => {
    if (!isAdmin && activeScreen === 'admin') {
      setActiveScreen('home');
    }
  }, [isAdmin, activeScreen]);

  // Automatic redirect safety: If admin session is terminated while on admin screen, immediately return to home
  useEffect(() => {
    if (!isAdmin && activeScreen === 'admin') {
      setActiveScreen('home');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [isAdmin, activeScreen]);

  // Real-Time Multi-Device Synchronization & AppCreator24 WebView Sync Listener
  useEffect(() => {
    // 1. Initialize SSE real-time push stream & WebView auto-polling loop
    const cleanupLiveSync = initRealTimeDataSync();

    // 2. Comprehensive reload helper: Updates all screens immediately without manual refresh
    const reloadAllStateFromStorage = () => {
      setProfile(loadOrgProfile());
      setMembers(sortMembersOldestFirst(loadMembers()));
      setDonors(loadDonors());
      setNotices(loadNotices());
      setFunds(loadFunds());
      setManualTotalBalance(loadManualTotalBalance());
      setMonthlyExpense(loadMonthlyExpense());
      setExtraMoney(loadExtraMoney());
      setSupportMembers(loadSupportMembers());
      setHomeSlides(loadHomeSlides());
      setAidDonations(loadAidDonations());
      setExtraContributions(loadExtraContributions());
      setOrganizationRules(loadOrganizationRules());
      setPaymentConfig(loadPaymentSettings());
    };

    const handleSync = (_e: any) => {
      reloadAllStateFromStorage();
    };

    window.addEventListener(PMS_SYNC_EVENT, handleSync);
    window.addEventListener('storage', handleSync);

    // Universal Cloud Data Loader: Dynamically fetches all admin-managed sections live from Supabase
    const loadFromSupabase = async () => {
      try {
        const cloudData = await pullAllDataFromSupabase();
        if (cloudData && typeof cloudData === 'object') {
          // 1. Members
          if (Array.isArray(cloudData.members) && cloudData.members.length > 0) {
            const liveMembers = sortMembersOldestFirst(
              cloudData.members.filter((m: any) => m && m.id && !isIdPermanentlyDeleted(m.id))
            );
            if (liveMembers.length > 0) {
              setMembers(liveMembers);
              saveMembers(liveMembers);
            }
          }

          // 2. Funds
          if (Array.isArray(cloudData.funds) && cloudData.funds.length > 0) {
            const liveFunds = cloudData.funds.filter((f: any) => f && f.id && !isIdPermanentlyDeleted(f.id));
            if (liveFunds.length > 0) {
              setFunds(liveFunds);
              saveFunds(liveFunds);
            }
          }

          // 3. Blood Donors
          if (Array.isArray(cloudData.donors) && cloudData.donors.length > 0) {
            const liveDonors = cloudData.donors.filter((d: any) => d && d.id && !isIdPermanentlyDeleted(d.id));
            if (liveDonors.length > 0) {
              setDonors(liveDonors);
              saveDonors(liveDonors);
            }
          }

          // 4. Notices
          if (Array.isArray(cloudData.notices) && cloudData.notices.length > 0) {
            const liveNotices = cloudData.notices.filter((n: any) => n && n.id && !isIdPermanentlyDeleted(n.id));
            if (liveNotices.length > 0) {
              setNotices(liveNotices);
              saveNotices(liveNotices);
            }
          }

          // 5. Support Team Members
          if (Array.isArray(cloudData.supportMembers) && cloudData.supportMembers.length > 0) {
            const liveSupport = cloudData.supportMembers.filter((s: any) => s && s.id && !isIdPermanentlyDeleted(s.id));
            if (liveSupport.length > 0) {
              setSupportMembers(liveSupport);
              saveSupportMembers(liveSupport);
            }
          }

          // 6. Home Slides
          if (Array.isArray(cloudData.homeSlides) && cloudData.homeSlides.length > 0) {
            const liveSlides = cloudData.homeSlides.filter((s: any) => s && s.id && !isIdPermanentlyDeleted(s.id));
            if (liveSlides.length > 0) {
              setHomeSlides(liveSlides);
              saveHomeSlides(liveSlides);
            }
          }

          // 7. Aid Donations
          if (Array.isArray(cloudData.aidDonations) && cloudData.aidDonations.length > 0) {
            const liveAid = cloudData.aidDonations.filter((a: any) => a && a.id && !isIdPermanentlyDeleted(a.id));
            if (liveAid.length > 0) {
              setAidDonations(liveAid);
              saveAidDonations(liveAid);
            }
          }

          // 8. Extra Contributions
          if (Array.isArray(cloudData.extraContributions) && cloudData.extraContributions.length > 0) {
            const liveExtra = cloudData.extraContributions.filter((c: any) => c && c.id && !isIdPermanentlyDeleted(c.id));
            if (liveExtra.length > 0) {
              setExtraContributions(liveExtra);
              saveExtraContributions(liveExtra);
            }
          }

          // 9. Organization Rules
          if (Array.isArray(cloudData.organizationRules) && cloudData.organizationRules.length > 0) {
            const liveRules = cloudData.organizationRules.filter((r: any) => r && r.id && !isIdPermanentlyDeleted(r.id));
            if (liveRules.length > 0) {
              setOrganizationRules(liveRules);
              saveOrganizationRules(liveRules);
            }
          }

          // 10. Financial Balances
          if (cloudData.manualTotalBalance !== undefined && cloudData.manualTotalBalance !== null) {
            setManualTotalBalance(cloudData.manualTotalBalance);
            saveManualTotalBalance(cloudData.manualTotalBalance);
          }
          if (typeof cloudData.monthlyExpense === 'number') {
            setMonthlyExpense(cloudData.monthlyExpense);
            saveMonthlyExpense(cloudData.monthlyExpense);
          }
          if (typeof cloudData.extraMoney === 'number') {
            setExtraMoney(cloudData.extraMoney);
            saveExtraMoney(cloudData.extraMoney);
          }
        }
      } catch (err) {
        // Fallback to local and server sync
      }
    };
    loadFromSupabase();

    return () => {
      cleanupLiveSync();
      window.removeEventListener(PMS_SYNC_EVENT, handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  // 1. Member Handlers
  // Strictly append newly added members to the very bottom in sequential order
  const handleAddMember = async (newMember: Omit<Member, 'id'>): Promise<Member> => {
    const id = `m-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    
    // Ensure strict bottom sequential serial
    let maxSerial = 0;
    members.forEach(m => {
      if (typeof m.serial === 'number' && !isNaN(m.serial) && m.serial > maxSerial) {
        maxSerial = m.serial;
      }
    });
    const serial = Math.max(maxSerial, members.length) + 1;

    const member: Member = {
      ...newMember,
      id,
      serial,
      createdAt: new Date().toISOString()
    };

    // Append to the bottom
    const updatedMembers = sortMembersOldestFirst([...members, member]);
    setMembers(updatedMembers);
    saveMembers(updatedMembers);

    // Auto-sync into Fund section immediately so no member is missing
    setFunds(prevFunds => {
      const synced = autoSyncMembersToFunds(updatedMembers, prevFunds);
      saveFunds(synced);
      return synced;
    });

    // Safe sync to Supabase
    await safeSyncToSupabase('members', member);

    return member;
  };

  const handleEditMember = async (updatedMember: Member): Promise<void> => {
    const updated = members.map(m => m.id === updatedMember.id ? updatedMember : m);
    const sorted = sortMembersOldestFirst(updated);
    setMembers(sorted);
    saveMembers(sorted);

    // Auto-sync updated member details in Fund records
    setFunds(prevFunds => {
      const synced = autoSyncMembersToFunds(sorted, prevFunds);
      saveFunds(synced);
      return synced;
    });

    // Safe sync to Supabase
    await safeSyncToSupabase('members', updatedMember);
  };

  const handleDeleteMember = async (id: string): Promise<void> => {
    // 1. Mark permanently deleted in storage registry (cannot be revived)
    markIdAsPermanentlyDeleted(id, 'members');

    // 2. Permanently remove from members state and localStorage
    const updated = members.filter(m => m.id !== id);
    setMembers(updated);
    saveMembers(updated);

    // 3. Remove associated fund records
    setFunds(prevFunds => {
      const filteredFunds = prevFunds.filter(f => f.memberId !== id);
      saveFunds(filteredFunds);
      return filteredFunds;
    });

    // 4. Permanently remove from Supabase cloud database
    await safeDeleteFromSupabase('members', id);
  };

  // 2. Fund Handlers
  const handleAddFund = async (newFund: Omit<FundRecord, 'id'>): Promise<FundRecord> => {
    const id = `f-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const fund: FundRecord = {
      ...newFund,
      id
    };
    const updated = [fund, ...funds.filter(f => f.id !== id)];
    setFunds(updated);
    saveFunds(updated);
    await safeSyncToSupabase('funds', fund);
    return fund;
  };

  const handleEditFund = async (updatedFund: FundRecord): Promise<void> => {
    const matchIndex = funds.findIndex(
      f => f.id === updatedFund.id || (f.memberId && updatedFund.memberId && f.memberId === updatedFund.memberId)
    );
    let updated: FundRecord[];
    if (matchIndex >= 0) {
      updated = [...funds];
      updated[matchIndex] = updatedFund;
    } else {
      updated = [updatedFund, ...funds];
    }
    setFunds(updated);
    saveFunds(updated);
    await safeSyncToSupabase('funds', updatedFund);
  };

  const handleDeleteFund = async (id: string): Promise<void> => {
    markIdAsPermanentlyDeleted(id, 'funds');
    const updated = funds.filter(f => f.id !== id);
    setFunds(updated);
    saveFunds(updated);
    await safeDeleteFromSupabase('funds', id);
  };

  const handleToggleFundStatus = async (id: string, newStatus: PaymentStatus): Promise<void> => {
    let changedFund: FundRecord | null = null;
    const matchIndex = funds.findIndex(f => f.id === id || (f.memberId && f.memberId === id));
    let updated: FundRecord[];
    if (matchIndex >= 0) {
      updated = funds.map((f, idx) => {
        if (idx === matchIndex) {
          const u: FundRecord = {
            ...f,
            status: newStatus,
            paidAmount: newStatus === 'Paid' ? (f.amount || 500) : 0,
            dueAmount: newStatus === 'Due' ? (f.amount || 500) : 0,
            paidMonths: newStatus === 'Paid' ? (f.month || 'মার্চ ২০২৬') : '',
            dueMonths: newStatus === 'Due' ? (f.month || 'মার্চ ২০২৬') : '',
            approvedAt: newStatus === 'Paid' ? new Date().toISOString() : undefined
          };
          changedFund = u;
          return u;
        }
        return f;
      });
    } else {
      const effectiveList = autoSyncMembersToFunds(members, funds);
      const target = effectiveList.find(f => f.id === id || f.memberId === id);
      if (target) {
        changedFund = {
          ...target,
          status: newStatus,
          paidAmount: newStatus === 'Paid' ? (target.amount || 500) : 0,
          dueAmount: newStatus === 'Due' ? (target.amount || 500) : 0,
          paidMonths: newStatus === 'Paid' ? (target.month || 'মার্চ ২০২৬') : '',
          dueMonths: newStatus === 'Due' ? (target.month || 'মার্চ ২০২৬') : '',
          approvedAt: newStatus === 'Paid' ? new Date().toISOString() : undefined
        };
        updated = [changedFund, ...funds];
      } else {
        updated = funds;
      }
    }
    setFunds(updated);
    saveFunds(updated);
    if (changedFund) {
      await safeSyncToSupabase('funds', changedFund);
    }
  };

  const handleUpdateManualTotalBalance = (amount: number | null) => {
    setManualTotalBalance(amount);
    saveManualTotalBalance(amount);
    if (amount !== null) {
      syncNetBalanceToSupabase(amount);
    }
  };

  const handleUpdateMonthlyExpense = (amount: number) => {
    setMonthlyExpense(amount);
    saveMonthlyExpense(amount);
    syncFinancialsToSupabase(amount, extraMoney);
  };

  const handleUpdateExtraMoney = (amount: number) => {
    setExtraMoney(amount);
    saveExtraMoney(amount);
    syncFinancialsToSupabase(monthlyExpense, amount);
  };

  // 3. Donor Handlers
  const handleAddDonor = async (newDonor: Omit<BloodDonor, 'id'>): Promise<BloodDonor> => {
    const id = `d-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const donor: BloodDonor = {
      ...newDonor,
      id
    };
    const updated = [donor, ...donors];
    setDonors(updated);
    saveDonors(updated);
    // Direct sync to Supabase database
    await safeSyncToSupabase('donors', donor);
    return donor;
  };

  const handleEditDonor = async (updatedDonor: BloodDonor): Promise<void> => {
    const updated = donors.map(d => d.id === updatedDonor.id ? updatedDonor : d);
    setDonors(updated);
    saveDonors(updated);
    // Direct sync to Supabase database
    await safeSyncToSupabase('donors', updatedDonor);
  };

  const handleDeleteDonor = async (id: string): Promise<void> => {
    markIdAsPermanentlyDeleted(id, 'donors');
    const updated = donors.filter(d => d.id !== id);
    setDonors(updated);
    saveDonors(updated);
    await safeDeleteFromSupabase('donors', id);
  };

  // 4. Notice Handlers
  const handleAddNotice = async (newNotice: Omit<Notice, 'id'>): Promise<Notice> => {
    const id = `n-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const notice: Notice = {
      ...newNotice,
      id
    };
    const updated = [notice, ...notices];
    setNotices(updated);
    saveNotices(updated);
    await safeSyncToSupabase('notices', notice);
    return notice;
  };

  const handleDeleteNotice = async (id: string): Promise<void> => {
    markIdAsPermanentlyDeleted(id, 'notices');
    const updated = notices.filter(n => n.id !== id);
    setNotices(updated);
    saveNotices(updated);
    await safeDeleteFromSupabase('notices', id);
  };

  // 5. Support Report & Support Team Directory Handlers
  const handleAddReport = async (newReport: Omit<SupportReportItem, 'id'>): Promise<SupportReportItem> => {
    const id = `sup-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const item: SupportReportItem = {
      ...newReport,
      id
    };
    const updated = [item, ...supportReports];
    setSupportReports(updated);
    saveSupportReports(updated);
    await safeSyncToSupabase('supportReports', item);
    return item;
  };

  const handleAddSupportMember = async (newMember: Omit<SupportTeamMember, 'id'>): Promise<SupportTeamMember> => {
    const id = `supp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const item: SupportTeamMember = {
      ...newMember,
      id
    };
    const updated = [...supportMembers, item];
    setSupportMembers(updated);
    saveSupportMembers(updated);
    await safeSyncToSupabase('supportMembers', item);
    return item;
  };

  const handleEditSupportMember = async (updatedMember: SupportTeamMember): Promise<void> => {
    const updated = supportMembers.map(m => m.id === updatedMember.id ? updatedMember : m);
    setSupportMembers(updated);
    saveSupportMembers(updated);
    await safeSyncToSupabase('supportMembers', updatedMember);
  };

  const handleDeleteSupportMember = async (id: string): Promise<void> => {
    markIdAsPermanentlyDeleted(id, 'supportMembers');
    const updated = supportMembers.filter(m => m.id !== id);
    setSupportMembers(updated);
    saveSupportMembers(updated);
    await safeDeleteFromSupabase('supportMembers', id);
  };

  // 5.1 Home Slide Handlers
  const handleAddHomeSlide = async (newSlide: Omit<HomeSlide, 'id'>): Promise<HomeSlide> => {
    const id = `slide-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const slide: HomeSlide = { ...newSlide, id };
    const updated = [...homeSlides, slide];
    setHomeSlides(updated);
    saveHomeSlides(updated);
    await safeSyncToSupabase('homeSlides', slide);
    return slide;
  };

  const handleEditHomeSlide = async (updatedSlide: HomeSlide): Promise<void> => {
    const updated = homeSlides.map(s => s.id === updatedSlide.id ? updatedSlide : s);
    setHomeSlides(updated);
    saveHomeSlides(updated);
    await safeSyncToSupabase('homeSlides', updatedSlide);
  };

  const handleDeleteHomeSlide = async (id: string): Promise<void> => {
    markIdAsPermanentlyDeleted(id, 'homeSlides');
    const updated = homeSlides.filter(s => s.id !== id);
    setHomeSlides(updated);
    saveHomeSlides(updated);
    await safeDeleteFromSupabase('homeSlides', id);
  };

  // 5.2 Aid Donation Record Handlers
  const handleAddAidDonation = async (newDonation: Omit<AidDonationRecord, 'id'>): Promise<AidDonationRecord> => {
    const id = `aid-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const donation: AidDonationRecord = { ...newDonation, id, createdAt: new Date().toISOString() };
    const updated = [donation, ...aidDonations];
    setAidDonations(updated);
    saveAidDonations(updated);
    await safeSyncToSupabase('aidDonations', donation);
    return donation;
  };

  const handleEditAidDonation = async (updatedDonation: AidDonationRecord): Promise<void> => {
    const updated = aidDonations.map(d => d.id === updatedDonation.id ? updatedDonation : d);
    setAidDonations(updated);
    saveAidDonations(updated);
    await safeSyncToSupabase('aidDonations', updatedDonation);
  };

  const handleDeleteAidDonation = async (id: string): Promise<void> => {
    markIdAsPermanentlyDeleted(id, 'aidDonations');
    const updated = aidDonations.filter(d => d.id !== id);
    setAidDonations(updated);
    saveAidDonations(updated);
    await safeDeleteFromSupabase('aidDonations', id);
  };

  // 5.3 Extra Contribution Handlers
  const handleAddExtraContribution = async (newContrib: Omit<ExtraContributionRecord, 'id'>): Promise<ExtraContributionRecord> => {
    const id = `extra-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const contrib: ExtraContributionRecord = { ...newContrib, id, createdAt: new Date().toISOString() };
    const updated = [contrib, ...extraContributions];
    setExtraContributions(updated);
    saveExtraContributions(updated);
    await safeSyncToSupabase('extraContributions', contrib);
    return contrib;
  };

  const handleEditExtraContribution = async (updatedContrib: ExtraContributionRecord): Promise<void> => {
    const updated = extraContributions.map(c => c.id === updatedContrib.id ? updatedContrib : c);
    setExtraContributions(updated);
    saveExtraContributions(updated);
    await safeSyncToSupabase('extraContributions', updatedContrib);
  };

  const handleDeleteExtraContribution = async (id: string): Promise<void> => {
    markIdAsPermanentlyDeleted(id, 'extraContributions');
    const updated = extraContributions.filter(c => c.id !== id);
    setExtraContributions(updated);
    saveExtraContributions(updated);
    await safeDeleteFromSupabase('extraContributions', id);
  };

  // 5.4 Organization Rule Handlers
  const handleAddRule = async (newRule: Omit<OrganizationRule, 'id'>): Promise<OrganizationRule> => {
    const id = `rule-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const rule: OrganizationRule = { ...newRule, id };
    const updated = [...organizationRules, rule];
    setOrganizationRules(updated);
    saveOrganizationRules(updated);
    await safeSyncToSupabase('organizationRules', rule);
    return rule;
  };

  const handleEditRule = async (updatedRule: OrganizationRule): Promise<void> => {
    const updated = organizationRules.map(r => r.id === updatedRule.id ? updatedRule : r);
    setOrganizationRules(updated);
    saveOrganizationRules(updated);
    await safeSyncToSupabase('organizationRules', updatedRule);
  };

  const handleDeleteRule = async (id: string): Promise<void> => {
    markIdAsPermanentlyDeleted(id, 'organizationRules');
    const updated = organizationRules.filter(r => r.id !== id);
    setOrganizationRules(updated);
    saveOrganizationRules(updated);
    await safeDeleteFromSupabase('organizationRules', id);
  };

  // 6. Organization Profile & Payment Settings
  const handleUpdateProfile = (newProfile: OrganizationProfile) => {
    setProfile(newProfile);
    saveOrgProfile(newProfile);
    safeSyncToSupabase('settings', { id: 'pms_org_profile', key: 'profile', data: newProfile });
  };

  const handleUpdatePaymentConfig = (newConfig: PaymentGatewayConfig) => {
    setPaymentConfig(newConfig);
    savePaymentSettings(newConfig);
    safeSyncToSupabase('settings', { id: 'pms_payment_settings', key: 'payment_settings', data: newConfig });
  };

  // Strict Login/Registration Gate: When not authenticated, hide all main app content completely
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col antialiased w-full max-w-full overflow-x-hidden">
        {isOffline && (
          <div className="bg-amber-600 text-white px-4 py-2 text-xs font-bold flex items-center justify-between gap-2 shadow-md sticky top-0 z-50 animate-in slide-in-from-top">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-white animate-ping shrink-0" />
              <span>ইন্টারনেট সংযোগ বিচ্ছিন্ন (Offline) — স্থানীয়ভাবে সংরক্ষিত তথ্য সক্রিয় রয়েছে</span>
            </div>
            <button 
              type="button" 
              onClick={() => window.location.reload()} 
              className="px-2.5 py-0.5 rounded-lg bg-white/20 hover:bg-white/30 text-white text-[10px] font-bold transition cursor-pointer"
            >
              পুনরায় চেষ্টা করুন
            </button>
          </div>
        )}
        <AuthGateScreen
          profile={profile}
          onAdminLoginSuccess={handleAdminLoginSuccess}
          onMemberLoginSuccess={handleMemberLoginSuccess}
          openEmergencyModal={() => setIsEmergencyModalOpen(true)}
        />
        <EmergencyHelplineModal
          isOpen={isEmergencyModalOpen}
          onClose={() => setIsEmergencyModalOpen(false)}
          profile={profile}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col antialiased w-full max-w-full overflow-x-clip">
      {isOffline && (
        <div className="bg-amber-600 text-white px-4 py-2 text-xs font-bold flex items-center justify-between gap-2 shadow-md sticky top-0 z-50 animate-in slide-in-from-top">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-white animate-ping shrink-0" />
            <span>ইন্টারনেট সংযোগ বিচ্ছিন্ন (Offline) — অফলাইন ক্যাশে সংরক্ষিত ডেটা প্রদর্শিত হচ্ছে</span>
          </div>
          <button 
            type="button" 
            onClick={() => window.location.reload()} 
            className="px-2.5 py-0.5 rounded-lg bg-white/20 hover:bg-white/30 text-white text-[10px] font-bold transition cursor-pointer"
          >
            পুনরায় চেষ্টা করুন
          </button>
        </div>
      )}
      <Header
        profile={profile}
        activeScreen={activeScreen}
        setActiveScreen={setActiveScreen}
        isAdmin={isAdmin}
        setIsAdmin={setIsAdmin}
        adminViewMode={adminViewMode}
        onSelectViewMode={handleSelectViewMode}
        loggedInUser={loggedInUser}
        onLogout={handleAdminLogout}
        onMemberLogout={handleMemberLogout}
        openAuthModal={handleOpenAuthModal}
        openEmergencyModal={() => setIsEmergencyModalOpen(true)}
      />

      <main className="flex-1 max-w-6xl w-full mx-auto px-3 sm:px-4 py-4 sm:py-6 overflow-x-clip">
        {activeScreen === 'home' && (
          <HomeScreen
            profile={profile}
            homeSlides={homeSlides}
            aidDonations={aidDonations}
            extraContributions={extraContributions}
            organizationRules={organizationRules}
            isAdmin={effectiveIsAdminForScreens}
            onNavigateToAdminTab={(tab) => {
              setAdminActiveTab(tab);
              setActiveScreen('admin');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {activeScreen === 'members' && (
          <MemberListScreen
            members={members}
            onAddMember={handleAddMember}
            isAdmin={effectiveIsAdminForScreens}
            openAdminModal={() => handleOpenAuthModal('login')}
            onBack={() => setActiveScreen('home')}
          />
        )}

        {activeScreen === 'blood' && (
          <BloodDonationScreen
            donors={donors}
            onAddDonor={handleAddDonor}
            onEditDonor={handleEditDonor}
            onDeleteDonor={handleDeleteDonor}
            isAdmin={effectiveIsAdminForScreens}
            onNavigateToAdminTab={(tab) => {
              setAdminActiveTab(tab);
              setActiveScreen('admin');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onBack={() => setActiveScreen('home')}
          />
        )}

        {activeScreen === 'fund' && (
          <FundScreen
            fundRecords={funds}
            members={members}
            manualTotalBalance={manualTotalBalance}
            monthlyExpense={monthlyExpense}
            extraMoney={extraMoney}
            paymentConfig={paymentConfig}
            isAdmin={effectiveIsAdminForScreens}
            onBack={() => setActiveScreen('home')}
          />
        )}

        {activeScreen === 'notices' && (
          <NoticeScreen
            notices={notices}
            onAddNotice={handleAddNotice}
            onDeleteNotice={handleDeleteNotice}
            isAdmin={effectiveIsAdminForScreens}
            onBack={() => setActiveScreen('home')}
          />
        )}

        {activeScreen === 'calendar' && (
          <CalendarScreen
            onBack={() => setActiveScreen('home')}
          />
        )}

        {activeScreen === 'support' && (
          <SupportScreen
            supportMembers={supportMembers}
            onAddSupportMember={handleAddSupportMember}
            onEditSupportMember={handleEditSupportMember}
            onDeleteSupportMember={handleDeleteSupportMember}
            reports={supportReports}
            profile={profile}
            onAddReport={handleAddReport}
            isAdmin={effectiveIsAdminForScreens}
            openAdminModal={() => handleOpenAuthModal('login')}
            onBack={() => setActiveScreen('home')}
          />
        )}

        {activeScreen === 'admin' && isAdmin && (
          <AdminPanelScreen
            profile={profile}
            onUpdateProfile={handleUpdateProfile}
            members={members}
            onAddMember={handleAddMember}
            onEditMember={handleEditMember}
            onDeleteMember={handleDeleteMember}
            donors={donors}
            onAddDonor={handleAddDonor}
            onEditDonor={handleEditDonor}
            onDeleteDonor={handleDeleteDonor}
            funds={funds}
            onEditFundRecord={handleEditFund}
            onToggleFundStatus={handleToggleFundStatus}
            manualTotalBalance={manualTotalBalance}
            onUpdateManualTotalBalance={handleUpdateManualTotalBalance}
            monthlyExpense={monthlyExpense}
            onUpdateMonthlyExpense={handleUpdateMonthlyExpense}
            extraMoney={extraMoney}
            onUpdateExtraMoney={handleUpdateExtraMoney}
            homeSlides={homeSlides}
            onAddHomeSlide={handleAddHomeSlide}
            onEditHomeSlide={handleEditHomeSlide}
            onDeleteHomeSlide={handleDeleteHomeSlide}
            aidDonations={aidDonations}
            onAddAidDonation={handleAddAidDonation}
            onEditAidDonation={handleEditAidDonation}
            onDeleteAidDonation={handleDeleteAidDonation}
            extraContributions={extraContributions}
            onAddExtraContribution={handleAddExtraContribution}
            onEditExtraContribution={handleEditExtraContribution}
            onDeleteExtraContribution={handleDeleteExtraContribution}
            organizationRules={organizationRules}
            onAddRule={handleAddRule}
            onEditRule={handleEditRule}
            onDeleteRule={handleDeleteRule}
            paymentConfig={paymentConfig}
            onUpdatePaymentConfig={handleUpdatePaymentConfig}
            initialTab={adminActiveTab}
            onBack={() => setActiveScreen('home')}
            onLogout={handleAdminLogout}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <BottomNav
        activeScreen={activeScreen}
        setActiveScreen={setActiveScreen}
        isAdmin={isAdmin}
        adminViewMode={adminViewMode}
        onSelectViewMode={handleSelectViewMode}
        loggedInUser={loggedInUser}
        openAuthModal={handleOpenAuthModal}
      />

      {/* Complete Secure Login, Registration & Device Tracking System */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authModalMode}
        onAdminLoginSuccess={handleAdminLoginSuccess}
        onMemberLoginSuccess={handleMemberLoginSuccess}
      />

      {/* Emergency Helpline Modal */}
      <EmergencyHelplineModal
        isOpen={isEmergencyModalOpen}
        onClose={() => setIsEmergencyModalOpen(false)}
        profile={profile}
      />
    </div>
  );
}
