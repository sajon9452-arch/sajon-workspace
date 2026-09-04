import React, { useState, useEffect, useMemo } from 'react';
import { 
  ActiveScreen, 
  Member, 
  BloodDonor, 
  Notice, 
  FundRecord, 
  OrganizationStats, 
  OrganizationProfile, 
  PaymentStatus, 
  PaymentGatewayConfig,
  SupportReportItem,
  HomeSlide,
  HumanitarianActivity,
  OrganizationRule
} from './types';
import { 
  loadMembers, 
  saveMembers, 
  loadDonors, 
  saveDonors, 
  loadNotices, 
  saveNotices, 
  loadFunds, 
  saveFunds, 
  loadOrgProfile, 
  saveOrgProfile, 
  loadManualTotalBalance, 
  saveManualTotalBalance, 
  loadPaymentSettings, 
  savePaymentSettings,
  loadSupportReports,
  saveSupportReports,
  loadHomeSlides,
  saveHomeSlides,
  loadHumanitarianActivities,
  saveHumanitarianActivities,
  loadOrganizationRules,
  saveOrganizationRules,
  populateLocalStorageFromServer, 
  resetAllData, 
  clearAllData,
  PMS_SYNC_EVENT_NAME
} from './utils/storage';
import { fetchServerDatabase, syncKeyToServer } from './utils/serverApi';
import { isDonorEligible } from './utils/helpers';
import { Header } from './components/Header';
import { HomeScreen } from './components/HomeScreen';
import { MemberListScreen } from './components/MemberListScreen';
import { BloodDonationScreen } from './components/BloodDonationScreen';
import { NoticeScreen } from './components/NoticeScreen';
import { FundScreen } from './components/FundScreen';
import { CalendarScreen } from './components/CalendarScreen';
import { SupportScreen } from './components/SupportScreen';
import { AdminPanelScreen } from './components/AdminPanelScreen';
import { AdminModal } from './components/AdminModal';
import { EmergencyHelplineModal } from './components/EmergencyHelplineModal';
import { SheetGuideModal } from './components/SheetGuideModal';
import { BottomNav } from './components/BottomNav';
import { OfflineStatusBanner } from './components/OfflineStatusBanner';
import { HeartHandshake, MapPin, ShieldCheck, Heart } from 'lucide-react';

export default function App() {
  const [activeScreen, setActiveScreen] = useState<ActiveScreen>('home');
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  
  // Data States initialized from localStorage
  const [profile, setProfile] = useState<OrganizationProfile>(() => loadOrgProfile());
  const [members, setMembers] = useState<Member[]>(() => loadMembers());
  const [donors, setDonors] = useState<BloodDonor[]>(() => loadDonors());
  const [notices, setNotices] = useState<Notice[]>(() => loadNotices());
  const [funds, setFunds] = useState<FundRecord[]>(() => loadFunds());
  const [supportReports, setSupportReports] = useState<SupportReportItem[]>(() => loadSupportReports());
  const [homeSlides, setHomeSlides] = useState<HomeSlide[]>(() => loadHomeSlides());
  const [humanitarianActivities, setHumanitarianActivities] = useState<HumanitarianActivity[]>(() => loadHumanitarianActivities());
  const [organizationRules, setOrganizationRules] = useState<OrganizationRule[]>(() => loadOrganizationRules());
  const [adminActiveTab, setAdminActiveTab] = useState<'overview' | 'homepage' | 'members' | 'donors' | 'funds' | 'notices' | 'payments' | 'reports' | 'settings'>('overview');
  const [manualTotalBalance, setManualTotalBalance] = useState<number | null>(() => loadManualTotalBalance());
  const [paymentConfig, setPaymentConfig] = useState<PaymentGatewayConfig>(() => loadPaymentSettings());
  const [selectedBloodGroupFilter, setSelectedBloodGroupFilter] = useState<string>('all');

  // Modals
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [isSheetGuideOpen, setIsSheetGuideOpen] = useState(false);

  // Sync state with local storage & optional local backend
  useEffect(() => {
    let isMounted = true;

    const syncAllFromStorage = () => {
      if (!isMounted) return;
      setProfile(loadOrgProfile());
      setMembers(loadMembers());
      setDonors(loadDonors());
      setNotices(loadNotices());
      setFunds(loadFunds());
      setSupportReports(loadSupportReports());
      setHomeSlides(loadHomeSlides());
      setHumanitarianActivities(loadHumanitarianActivities());
      setOrganizationRules(loadOrganizationRules());
      setManualTotalBalance(loadManualTotalBalance());
      setPaymentConfig(loadPaymentSettings());
    };

    // Hydrate from server / Supabase Cloud database
    fetchServerDatabase().then((serverData) => {
      if (serverData && isMounted) {
        if (serverData.profile) setProfile(serverData.profile);
        if (Array.isArray(serverData.members)) setMembers(serverData.members);
        if (Array.isArray(serverData.donors)) setDonors(serverData.donors);
        if (Array.isArray(serverData.notices)) setNotices(serverData.notices);
        if (Array.isArray(serverData.funds)) setFunds(serverData.funds);
        if (Array.isArray(serverData.supportReports)) setSupportReports(serverData.supportReports);
        if (Array.isArray(serverData.homeSlides)) setHomeSlides(serverData.homeSlides);
        if (Array.isArray(serverData.humanitarianActivities)) setHumanitarianActivities(serverData.humanitarianActivities);
        if (Array.isArray(serverData.organizationRules)) setOrganizationRules(serverData.organizationRules);
        if (serverData.manualTotalBalance !== undefined) setManualTotalBalance(serverData.manualTotalBalance);
        if (serverData.paymentConfig) setPaymentConfig(serverData.paymentConfig);
        populateLocalStorageFromServer(serverData, true);
      }
    }).catch(() => {
      // Fallback seamlessly to local storage cache
    });

    // Cross-tab and in-app synchronization listeners
    window.addEventListener('storage', syncAllFromStorage);
    window.addEventListener(PMS_SYNC_EVENT_NAME, syncAllFromStorage);

    return () => {
      isMounted = false;
      window.removeEventListener('storage', syncAllFromStorage);
      window.removeEventListener(PMS_SYNC_EVENT_NAME, syncAllFromStorage);
    };
  }, []);

  // Organization Profile Update Handler
  const handleUpdateProfile = (newProfile: OrganizationProfile) => {
    setProfile(newProfile);
    saveOrgProfile(newProfile);
    syncKeyToServer('profile', newProfile).catch(() => {});
  };

  // Payment Gateway Configuration Handler
  const handleUpdatePaymentConfig = (newConfig: PaymentGatewayConfig) => {
    setPaymentConfig(newConfig);
    savePaymentSettings(newConfig);
    syncKeyToServer('paymentConfig', newConfig).catch(() => {});
  };

  // Member Handlers
  const handleAddMember = async (newMember: Omit<Member, 'id'>): Promise<Member> => {
    const memberId = `m-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const member: Member = {
      ...newMember,
      id: memberId
    };
    
    setMembers(prev => {
      const updated = [member, ...prev.filter(m => m.id !== member.id)];
      saveMembers(updated);
      syncKeyToServer('members', updated).catch(() => {});
      return updated;
    });
    return member;
  };

  const handleEditMember = async (updatedMember: Member): Promise<void> => {
    setMembers(prev => {
      const updated = prev.map(m => m.id === updatedMember.id ? updatedMember : m);
      saveMembers(updated);
      syncKeyToServer('members', updated).catch(() => {});
      return updated;
    });
  };

  const handleDeleteMember = async (id: string, name: string): Promise<void> => {
    if (confirm(`আপনি কি সদস্য "${name}" কে মুছে ফেলতে চান?`)) {
      setMembers(prev => {
        const updated = prev.filter(m => m.id !== id);
        saveMembers(updated);
        syncKeyToServer('members', updated).catch(() => {});
        return updated;
      });
    }
  };

  // Blood Donor Handlers
  const handleAddDonor = async (newDonor: Omit<BloodDonor, 'id'>): Promise<BloodDonor> => {
    const donorId = `d-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const donor: BloodDonor = {
      ...newDonor,
      id: donorId
    };
    
    setDonors(prev => {
      const updated = [donor, ...prev.filter(d => d.id !== donor.id)];
      saveDonors(updated);
      syncKeyToServer('donors', updated).catch(() => {});
      return updated;
    });
    return donor;
  };

  const handleEditDonor = async (updatedDonor: BloodDonor): Promise<void> => {
    setDonors(prev => {
      const updated = prev.map(d => d.id === updatedDonor.id ? updatedDonor : d);
      saveDonors(updated);
      syncKeyToServer('donors', updated).catch(() => {});
      return updated;
    });
  };

  const handleDeleteDonor = async (id: string, name: string): Promise<void> => {
    if (confirm(`আপনি কি রক্তদাতা "${name}" এর তথ্য মুছে ফেলতে চান?`)) {
      setDonors(prev => {
        const updated = prev.filter(d => d.id !== id);
        saveDonors(updated);
        syncKeyToServer('donors', updated).catch(() => {});
        return updated;
      });
    }
  };

  // Notice Handlers
  const handleAddNotice = async (newNotice: Omit<Notice, 'id'>): Promise<Notice> => {
    const noticeId = `n-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const notice: Notice = {
      ...newNotice,
      id: noticeId
    };

    setNotices(prev => {
      const updated = [notice, ...prev.filter(n => n.id !== notice.id)];
      saveNotices(updated);
      syncKeyToServer('notices', updated).catch(() => {});
      return updated;
    });
    return notice;
  };

  const handleEditNotice = async (updatedNotice: Notice): Promise<void> => {
    setNotices(prev => {
      const updated = prev.map(n => n.id === updatedNotice.id ? updatedNotice : n);
      saveNotices(updated);
      syncKeyToServer('notices', updated).catch(() => {});
      return updated;
    });
  };

  const handleDeleteNotice = async (id: string): Promise<void> => {
    if (confirm('আপনি কি এই নোটিশটি মুছে ফেলতে চান?')) {
      setNotices(prev => {
        const updated = prev.filter(n => n.id !== id);
        saveNotices(updated);
        syncKeyToServer('notices', updated).catch(() => {});
        return updated;
      });
    }
  };

  // Fund Handlers
  const handleAddFund = async (newFund: Omit<FundRecord, 'id'>): Promise<FundRecord> => {
    const fundId = `f-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const fund: FundRecord = {
      ...newFund,
      id: fundId
    };

    setFunds(prev => {
      const updated = [fund, ...prev.filter(f => f.id !== fund.id)];
      saveFunds(updated);
      syncKeyToServer('funds', updated).catch(() => {});
      return updated;
    });
    return fund;
  };

  const handleEditFund = async (updatedFund: FundRecord): Promise<void> => {
    setFunds(prev => {
      const updated = prev.map(f => f.id === updatedFund.id ? updatedFund : f);
      saveFunds(updated);
      syncKeyToServer('funds', updated).catch(() => {});
      return updated;
    });
  };

  const handleDeleteFund = async (id: string): Promise<void> => {
    if (confirm('আপনি কি এই ফান্ড এন্ট্রিটি মুছে ফেলতে চান?')) {
      setFunds(prev => {
        const updated = prev.filter(f => f.id !== id);
        saveFunds(updated);
        syncKeyToServer('funds', updated).catch(() => {});
        return updated;
      });
    }
  };

  const handleToggleFundStatus = async (id: string, newStatus: PaymentStatus): Promise<void> => {
    setFunds(prev => {
      const updated = prev.map(f => {
        if (f.id === id) {
          return {
            ...f,
            status: newStatus,
            approvedAt: newStatus === 'Paid' ? new Date().toISOString() : f.approvedAt,
            date: f.date || new Date().toISOString().split('T')[0]
          };
        }
        return f;
      });
      saveFunds(updated);
      syncKeyToServer('funds', updated).catch(() => {});
      return updated;
    });
  };

  // Support & Report Handlers
  const handleAddSupportReport = async (newReport: Omit<SupportReportItem, 'id'>): Promise<SupportReportItem> => {
    const reportId = `rep-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const report: SupportReportItem = {
      ...newReport,
      id: reportId
    };

    setSupportReports(prev => {
      const updated = [report, ...prev.filter(r => r.id !== report.id)];
      saveSupportReports(updated);
      syncKeyToServer('supportReports', updated).catch(() => {});
      return updated;
    });
    return report;
  };

  const handleEditSupportReport = async (updatedReport: SupportReportItem): Promise<void> => {
    setSupportReports(prev => {
      const updated = prev.map(r => r.id === updatedReport.id ? updatedReport : r);
      saveSupportReports(updated);
      syncKeyToServer('supportReports', updated).catch(() => {});
      return updated;
    });
  };

  const handleDeleteSupportReport = async (id: string): Promise<void> => {
    setSupportReports(prev => {
      const updated = prev.filter(r => r.id !== id);
      saveSupportReports(updated);
      syncKeyToServer('supportReports', updated).catch(() => {});
      return updated;
    });
  };

  const handleUpdateManualTotalBalance = (val: number | null) => {
    setManualTotalBalance(val);
    saveManualTotalBalance(val);
    syncKeyToServer('manualTotalBalance', val).catch(() => {});
  };

  // Home Page Dynamic Section Handlers
  const handleUpdateHomeSlides = (updated: HomeSlide[]) => {
    setHomeSlides(updated);
    saveHomeSlides(updated);
    syncKeyToServer('homeSlides', updated).catch(() => {});
  };

  const handleUpdateHumanitarianActivities = (updated: HumanitarianActivity[]) => {
    setHumanitarianActivities(updated);
    saveHumanitarianActivities(updated);
    syncKeyToServer('humanitarianActivities', updated).catch(() => {});
  };

  const handleUpdateOrganizationRules = (updated: OrganizationRule[]) => {
    setOrganizationRules(updated);
    saveOrganizationRules(updated);
    syncKeyToServer('organizationRules', updated).catch(() => {});
  };

  const handleResetData = () => {
    if (confirm('আপনি কি সকল ডাটা রিসেট করে ডিফল্ট অবস্থায় ফিরিয়ে নিতে চান?')) {
      resetAllData();
      window.location.reload();
    }
  };

  // Aggregated Stats
  const stats: OrganizationStats = useMemo(() => {
    const readyDonors = donors.filter(d => isDonorEligible(d).eligible).length;
    const paidAmt = funds.filter(f => f.status === 'Paid').reduce((sum, f) => sum + (Number(f.amount) || 0), 0);
    const dueAmt = funds.filter(f => f.status === 'Due').reduce((sum, f) => sum + (Number(f.amount) || 0), 0);
    const expAmt = funds.filter(f => f.status === 'Expense').reduce((sum, f) => sum + (Number(f.amount) || 0), 0);
    const netBal = paidAmt - expAmt;

    return {
      totalMembers: members.length,
      totalDonors: donors.length,
      readyDonors,
      totalFundBalance: manualTotalBalance !== null ? manualTotalBalance : netBal,
      totalPaidAmount: paidAmt,
      totalDueAmount: dueAmt,
      activeNotices: notices.length,
    };
  }, [members, donors, notices, funds, manualTotalBalance]);

  // Latest notice for ticker
  const latestNotice = notices[0];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-between text-slate-800 selection:bg-emerald-200">
      {/* Offline Status Reassurance Banner */}
      <OfflineStatusBanner />

      {/* Top Header */}
      <Header
        profile={profile}
        activeScreen={activeScreen}
        setActiveScreen={setActiveScreen}
        isAdmin={isAdmin}
        setIsAdmin={setIsAdmin}
        openAdminModal={() => setIsAdminModalOpen(true)}
        openEmergencyModal={() => setIsEmergencyModalOpen(true)}
      />

      {/* Main Screen Content */}
      <main className="max-w-6xl w-full mx-auto px-4 py-6 flex-1">
        {activeScreen === 'home' && (
          <HomeScreen
            profile={profile}
            onNavigate={(screen) => {
              if (screen === 'blood') {
                setSelectedBloodGroupFilter('all');
              }
              setActiveScreen(screen);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onSelectBloodGroup={(bg) => {
              setSelectedBloodGroupFilter(bg);
              setActiveScreen('blood');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            donors={donors}
            stats={stats}
            latestNotice={latestNotice}
            isAdmin={isAdmin}
            openAdminModal={() => setIsAdminModalOpen(true)}
            openEmergencyModal={() => setIsEmergencyModalOpen(true)}
            homeSlides={homeSlides}
            humanitarianActivities={humanitarianActivities}
            organizationRules={organizationRules}
            onNavigateAdminTab={(tab) => {
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
            onEditMember={handleEditMember}
            onDeleteMember={handleDeleteMember}
            isAdmin={isAdmin}
            onBack={() => setActiveScreen('home')}
          />
        )}

        {activeScreen === 'blood' && (
          <BloodDonationScreen
            donors={donors}
            initialBloodGroup={selectedBloodGroupFilter}
            onAddDonor={handleAddDonor}
            onEditDonor={handleEditDonor}
            onDeleteDonor={handleDeleteDonor}
            isAdmin={isAdmin}
            onBack={() => {
              setSelectedBloodGroupFilter('all');
              setActiveScreen('home');
            }}
          />
        )}

        {activeScreen === 'notices' && (
          <NoticeScreen
            notices={notices}
            isAdmin={isAdmin}
            onAddNotice={handleAddNotice}
            onEditNotice={handleEditNotice}
            onDeleteNotice={handleDeleteNotice}
            onBack={() => setActiveScreen('home')}
          />
        )}

        {activeScreen === 'fund' && (
          <FundScreen
            fundRecords={funds}
            onAddFundRecord={handleAddFund}
            onEditFundRecord={handleEditFund}
            onDeleteFundRecord={handleDeleteFund}
            onToggleStatus={handleToggleFundStatus}
            manualTotalBalance={manualTotalBalance}
            onUpdateManualTotalBalance={handleUpdateManualTotalBalance}
            paymentConfig={paymentConfig}
            isAdmin={isAdmin}
            onBack={() => setActiveScreen('home')}
          />
        )}

        {activeScreen === 'calendar' && (
          <CalendarScreen
            profile={profile}
            notices={notices}
            humanitarianActivities={humanitarianActivities}
            onBack={() => setActiveScreen('home')}
            onNavigate={(screen) => setActiveScreen(screen)}
          />
        )}

        {activeScreen === 'support' && (
          <SupportScreen
            reports={supportReports}
            profile={profile}
            isAdmin={isAdmin}
            onNavigateHome={() => setActiveScreen('home')}
            onNavigateAdmin={() => setActiveScreen('admin')}
            onBack={() => setActiveScreen('home')}
          />
        )}

        {activeScreen === 'admin' && (
          <AdminPanelScreen
            profile={profile}
            members={members}
            donors={donors}
            notices={notices}
            funds={funds}
            supportReports={supportReports}
            onAddSupportReport={handleAddSupportReport}
            onEditSupportReport={handleEditSupportReport}
            onDeleteSupportReport={handleDeleteSupportReport}
            setSupportReports={setSupportReports}
            paymentConfig={paymentConfig}
            onUpdatePaymentConfig={handleUpdatePaymentConfig}
            onUpdateProfile={handleUpdateProfile}
            onAddMember={handleAddMember}
            onEditMember={handleEditMember}
            onDeleteMember={handleDeleteMember}
            onAddDonor={handleAddDonor}
            onEditDonor={handleEditDonor}
            onDeleteDonor={handleDeleteDonor}
            onAddNotice={handleAddNotice}
            onEditNotice={handleEditNotice}
            onDeleteNotice={handleDeleteNotice}
            onAddFund={handleAddFund}
            onEditFund={handleEditFund}
            onDeleteFund={handleDeleteFund}
            onToggleFundStatus={handleToggleFundStatus}
            onResetAll={handleResetData}
            isAdmin={isAdmin}
            setIsAdmin={setIsAdmin}
            onBack={() => setActiveScreen('home')}
            homeSlides={homeSlides}
            onUpdateHomeSlides={handleUpdateHomeSlides}
            humanitarianActivities={humanitarianActivities}
            onUpdateHumanitarianActivities={handleUpdateHumanitarianActivities}
            organizationRules={organizationRules}
            onUpdateOrganizationRules={handleUpdateOrganizationRules}
            initialActiveTab={adminActiveTab}
          />
        )}
      </main>

      {/* Footer UI */}
      <footer className="bg-white border-t border-slate-200 text-slate-600 text-xs py-6 px-4 mb-14 sm:mb-0">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <HeartHandshake className="w-4 h-4 text-emerald-600" />
            <span className="font-bold text-slate-800">{profile.name}</span>
            <span className="text-slate-400">|</span>
            <span className="text-amber-700 font-semibold text-xs bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
              {profile.establishedDate || 'স্থাপিত : ১৫/০৮/২০২২ইং'}
            </span>
            <span className="text-slate-400">|</span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-emerald-600" />
              {profile.address}
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-slate-500">
            {/* Organization Slogan */}
            <div className="flex items-center gap-1.5 text-emerald-700 font-bold bg-emerald-50 border border-emerald-200/80 px-3 py-1 rounded-full text-xs">
              <Heart className="w-3.5 h-3.5 fill-emerald-600 text-emerald-600" />
              <span>মানবতার কল্যাণে নিবেদিত প্রাণ</span>
            </div>

            {/* Admin Access Option */}
            <button
              onClick={() => {
                if (isAdmin) {
                  setActiveScreen('admin');
                } else {
                  setIsAdminModalOpen(true);
                }
              }}
              className="hover:text-amber-700 flex items-center gap-1 font-bold text-amber-700 transition"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>ইন-অ্যাপ এডমিন প্যানেল</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Bottom Navigation for Mobile */}
      <BottomNav
        activeScreen={activeScreen}
        setActiveScreen={(scr) => {
          setActiveScreen(scr);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        noticeCount={notices.length}
      />

      {/* Modals */}
      <AdminModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        onSuccessLogin={() => {
          setIsAdmin(true);
          setActiveScreen('admin');
        }}
      />

      <EmergencyHelplineModal
        isOpen={isEmergencyModalOpen}
        onClose={() => setIsEmergencyModalOpen(false)}
        profile={profile}
        onUpdateProfile={(updatedProfile) => {
          setProfile(updatedProfile);
          saveOrgProfile(updatedProfile);
        }}
        isAdmin={isAdmin}
        onNavigateToAdmin={() => {
          if (isAdmin) {
            setActiveScreen('admin');
          } else {
            setIsAdminModalOpen(true);
          }
        }}
      />

      <SheetGuideModal
        isOpen={isSheetGuideOpen}
        onClose={() => setIsSheetGuideOpen(false)}
      />
    </div>
  );
}
