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
  PaymentStatus 
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
  loadHumanitarianActivities, 
  saveHumanitarianActivities, 
  loadOrganizationRules, 
  saveOrganizationRules, 
  loadSupportReports, 
  saveSupportReports, 
  loadPaymentSettings, 
  savePaymentSettings, 
  loadManualTotalBalance, 
  saveManualTotalBalance,
  PMS_SYNC_EVENT,
  markIdAsPermanentlyDeleted,
  isIdPermanentlyDeleted
} from './utils/storage';
import { sortMembersOldestFirst } from './utils/helpers';
import { autoSyncMembersToFunds } from './utils/memberFundLinker';
import { fetchSupabaseData, safeSyncToSupabase, safeDeleteFromSupabase } from './utils/supabaseClient';

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
import { AdminModal } from './components/AdminModal';
import { EmergencyHelplineModal } from './components/EmergencyHelplineModal';

export default function App() {
  const [activeScreen, setActiveScreen] = useState<ActiveScreen>('home');
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  // Data States
  const [profile, setProfile] = useState<OrganizationProfile>(() => loadOrgProfile());
  const [members, setMembers] = useState<Member[]>(() => sortMembersOldestFirst(loadMembers()));
  const [donors, setDonors] = useState<BloodDonor[]>(() => loadDonors());
  const [notices, setNotices] = useState<Notice[]>(() => loadNotices());
  const [funds, setFunds] = useState<FundRecord[]>(() => autoSyncMembersToFunds(loadMembers(), loadFunds()));
  const [homeSlides, setHomeSlides] = useState<HomeSlide[]>(() => loadHomeSlides());
  const [humanitarianActivities, setHumanitarianActivities] = useState<HumanitarianActivity[]>(() => loadHumanitarianActivities());
  const [organizationRules, setOrganizationRules] = useState<OrganizationRule[]>(() => loadOrganizationRules());
  const [supportReports, setSupportReports] = useState<SupportReportItem[]>(() => loadSupportReports());
  const [paymentConfig, setPaymentConfig] = useState<PaymentGatewayConfig>(() => loadPaymentSettings());
  const [manualTotalBalance, setManualTotalBalance] = useState<number | null>(() => loadManualTotalBalance());

  // Modals
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);

  // Instant logout handler with immediate redirect
  const handleAdminLogout = () => {
    setIsAdmin(false);
    setActiveScreen('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Automatic redirect safety: If admin session is terminated while on admin screen, immediately return to home
  useEffect(() => {
    if (!isAdmin && activeScreen === 'admin') {
      setActiveScreen('home');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [isAdmin, activeScreen]);

  // Sync state across local tabs/windows safely
  useEffect(() => {
    const handleSync = (e: any) => {
      const key = e.detail?.key;
      if (!key) {
        setProfile(loadOrgProfile());
        setMembers(sortMembersOldestFirst(loadMembers()));
        setDonors(loadDonors());
        setNotices(loadNotices());
        setFunds(loadFunds());
      }
    };
    window.addEventListener(PMS_SYNC_EVENT, handleSync);

    // Safely check and load any cloud data from Supabase, strictly filtering out any permanently deleted items
    const loadFromSupabase = async () => {
      try {
        const cloudMembers = await fetchSupabaseData<Member>('members');
        if (cloudMembers && Array.isArray(cloudMembers)) {
          const liveMembers = sortMembersOldestFirst(
            cloudMembers.filter(m => m && m.id && !isIdPermanentlyDeleted(m.id))
          );
          setMembers(liveMembers);
          saveMembers(liveMembers);
        }

        const cloudFunds = await fetchSupabaseData<FundRecord>('funds');
        if (cloudFunds && Array.isArray(cloudFunds)) {
          const liveFunds = cloudFunds.filter(f => f && f.id && !isIdPermanentlyDeleted(f.id));
          setFunds(liveFunds);
          saveFunds(liveFunds);
        }

        const cloudDonors = await fetchSupabaseData<BloodDonor>('donors');
        if (cloudDonors && Array.isArray(cloudDonors)) {
          const liveDonors = cloudDonors.filter(d => d && d.id && !isIdPermanentlyDeleted(d.id));
          setDonors(liveDonors);
          saveDonors(liveDonors);
        }

        const cloudNotices = await fetchSupabaseData<Notice>('notices');
        if (cloudNotices && Array.isArray(cloudNotices)) {
          const liveNotices = cloudNotices.filter(n => n && n.id && !isIdPermanentlyDeleted(n.id));
          setNotices(liveNotices);
          saveNotices(liveNotices);
        }
      } catch (err) {
        console.warn('Supabase initial fetch skipped:', err);
      }
    };
    loadFromSupabase();

    return () => window.removeEventListener(PMS_SYNC_EVENT, handleSync);
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
    safeSyncToSupabase('members', member);

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
    safeSyncToSupabase('members', updatedMember);
  };

  const handleDeleteMember = async (id: string): Promise<void> => {
    // 1. Mark permanently deleted in storage registry (cannot be revived)
    markIdAsPermanentlyDeleted(id);

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
    return fund;
  };

  const handleEditFund = async (updatedFund: FundRecord): Promise<void> => {
    const updated = funds.map(f => f.id === updatedFund.id ? updatedFund : f);
    setFunds(updated);
    saveFunds(updated);
  };

  const handleDeleteFund = async (id: string): Promise<void> => {
    markIdAsPermanentlyDeleted(id);
    const updated = funds.filter(f => f.id !== id);
    setFunds(updated);
    saveFunds(updated);
    await safeDeleteFromSupabase('funds', id);
  };

  const handleToggleFundStatus = async (id: string, newStatus: PaymentStatus): Promise<void> => {
    let changedFund: FundRecord | null = null;
    const updated = funds.map(f => {
      if (f.id === id) {
        const u = {
          ...f,
          status: newStatus,
          approvedAt: newStatus === 'Paid' ? new Date().toISOString() : f.approvedAt
        };
        changedFund = u;
        return u;
      }
      return f;
    });
    setFunds(updated);
    saveFunds(updated);
    if (changedFund) {
      safeSyncToSupabase('funds', changedFund);
    }
  };

  const handleUpdateManualTotalBalance = (amount: number | null) => {
    setManualTotalBalance(amount);
    saveManualTotalBalance(amount);
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
    return donor;
  };

  const handleEditDonor = async (updatedDonor: BloodDonor): Promise<void> => {
    const updated = donors.map(d => d.id === updatedDonor.id ? updatedDonor : d);
    setDonors(updated);
    saveDonors(updated);
  };

  const handleDeleteDonor = async (id: string): Promise<void> => {
    markIdAsPermanentlyDeleted(id);
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
    return notice;
  };

  const handleDeleteNotice = async (id: string): Promise<void> => {
    markIdAsPermanentlyDeleted(id);
    const updated = notices.filter(n => n.id !== id);
    setNotices(updated);
    saveNotices(updated);
    await safeDeleteFromSupabase('notices', id);
  };

  // 5. Support Report Handlers
  const handleAddReport = async (newReport: Omit<SupportReportItem, 'id'>): Promise<SupportReportItem> => {
    const id = `sup-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const item: SupportReportItem = {
      ...newReport,
      id
    };
    const updated = [item, ...supportReports];
    setSupportReports(updated);
    saveSupportReports(updated);
    return item;
  };

  // 6. Organization Profile & Payment Settings
  const handleUpdateProfile = (newProfile: OrganizationProfile) => {
    setProfile(newProfile);
    saveOrgProfile(newProfile);
  };

  const handleUpdatePaymentConfig = (newConfig: PaymentGatewayConfig) => {
    setPaymentConfig(newConfig);
    savePaymentSettings(newConfig);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col antialiased">
      <Header
        profile={profile}
        activeScreen={activeScreen}
        setActiveScreen={setActiveScreen}
        isAdmin={isAdmin}
        setIsAdmin={setIsAdmin}
        onLogout={handleAdminLogout}
        openAdminModal={() => setIsAdminModalOpen(true)}
        openEmergencyModal={() => setIsEmergencyModalOpen(true)}
      />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6">
        {activeScreen === 'home' && (
          <HomeScreen
            profile={profile}
            members={members}
            donors={donors}
            notices={notices}
            funds={funds}
            homeSlides={homeSlides}
            humanitarianActivities={humanitarianActivities}
            organizationRules={organizationRules}
            manualTotalBalance={manualTotalBalance}
            onNavigate={(screen) => {
              setActiveScreen(screen);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            openEmergencyModal={() => setIsEmergencyModalOpen(true)}
          />
        )}

        {activeScreen === 'members' && (
          <MemberListScreen
            members={members}
            onAddMember={handleAddMember}
            isAdmin={isAdmin}
            openAdminModal={() => setIsAdminModalOpen(true)}
            onBack={() => setActiveScreen('home')}
          />
        )}

        {activeScreen === 'blood' && (
          <BloodDonationScreen
            donors={donors}
            onAddDonor={handleAddDonor}
            onEditDonor={handleEditDonor}
            onDeleteDonor={handleDeleteDonor}
            isAdmin={isAdmin}
            onBack={() => setActiveScreen('home')}
          />
        )}

        {activeScreen === 'fund' && (
          <FundScreen
            fundRecords={funds}
            members={members}
            manualTotalBalance={manualTotalBalance}
            paymentConfig={paymentConfig}
            isAdmin={isAdmin}
            onBack={() => setActiveScreen('home')}
          />
        )}

        {activeScreen === 'notices' && (
          <NoticeScreen
            notices={notices}
            onAddNotice={handleAddNotice}
            onDeleteNotice={handleDeleteNotice}
            isAdmin={isAdmin}
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
            reports={supportReports}
            profile={profile}
            onAddReport={handleAddReport}
            isAdmin={isAdmin}
            onBack={() => setActiveScreen('home')}
          />
        )}

        {activeScreen === 'admin' && (
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
            onToggleFundStatus={handleToggleFundStatus}
            manualTotalBalance={manualTotalBalance}
            onUpdateManualTotalBalance={handleUpdateManualTotalBalance}
            paymentConfig={paymentConfig}
            onUpdatePaymentConfig={handleUpdatePaymentConfig}
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
        openAdminModal={() => setIsAdminModalOpen(true)}
      />

      {/* Admin Login Modal */}
      <AdminModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        onSuccess={() => {
          setIsAdmin(true);
          setActiveScreen('admin');
        }}
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
