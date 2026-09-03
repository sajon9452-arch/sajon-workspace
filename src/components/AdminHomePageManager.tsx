import React, { useState } from 'react';
import {
  Sparkles,
  Sliders,
  Image as ImageIcon,
  HeartHandshake,
  BookOpen,
  Share2,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Upload,
  Save,
  X,
  ExternalLink,
  Eye,
  Star,
  MapPin,
  Calendar,
  DollarSign,
  User,
  Tag,
  Mail,
  Youtube,
  Facebook,
  Phone,
  ArrowRight
} from 'lucide-react';
import {
  HomeSlide,
  HumanitarianActivity,
  OrganizationRule,
  OrganizationProfile
} from '../types';
import { formatTaka, toBengaliNumber } from '../utils/helpers';

interface AdminHomePageManagerProps {
  slides: HomeSlide[];
  onUpdateSlides: (slides: HomeSlide[]) => void;
  activities: HumanitarianActivity[];
  onUpdateActivities: (activities: HumanitarianActivity[]) => void;
  rules: OrganizationRule[];
  onUpdateRules: (rules: OrganizationRule[]) => void;
  profile: OrganizationProfile;
  onUpdateProfile: (profile: OrganizationProfile) => void;
  notifySuccess: (msg: string) => void;
  notifyError: (msg: string) => void;
}

export const AdminHomePageManager: React.FC<AdminHomePageManagerProps> = ({
  slides,
  onUpdateSlides,
  activities,
  onUpdateActivities,
  rules,
  onUpdateRules,
  profile,
  onUpdateProfile,
  notifySuccess,
  notifyError
}) => {
  const [activeSection, setActiveSection] = useState<'slides' | 'activities' | 'rules' | 'social'>('slides');

  // Slide Form State
  const [isSlideModalOpen, setIsSlideModalOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState<HomeSlide | null>(null);
  const [slideImageUrl, setSlideImageUrl] = useState('');
  const [slideTitle, setSlideTitle] = useState('');
  const [slideDescription, setSlideDescription] = useState('');
  const [slideCategory, setSlideCategory] = useState('ত্রাণ বিতরণ');
  const [slideDate, setSlideDate] = useState('');
  const [slideLocation, setSlideLocation] = useState('');
  const [slideIsActive, setSlideIsActive] = useState(true);

  // Activity Form State
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<HumanitarianActivity | null>(null);
  const [activityTitle, setActivityTitle] = useState('');
  const [activityDescription, setActivityDescription] = useState('');
  const [activityItemsGiven, setActivityItemsGiven] = useState('');
  const [activityCost, setActivityCost] = useState<number | string>('');
  const [activityHandledBy, setActivityHandledBy] = useState('');
  const [activityRecipientName, setActivityRecipientName] = useState('');
  const [activityRecipientPhotoUrl, setActivityRecipientPhotoUrl] = useState('');
  const [activityDate, setActivityDate] = useState('');
  const [activityLocation, setActivityLocation] = useState('');
  const [activityIsFeatured, setActivityIsFeatured] = useState(false);

  // Rule Form State
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<OrganizationRule | null>(null);
  const [rulePointNumber, setRulePointNumber] = useState<number | string>('');
  const [ruleText, setRuleText] = useState('');
  const [ruleCategory, setRuleCategory] = useState('মূলনীতি');

  // Social Links Form State
  const [facebookUrl, setFacebookUrl] = useState(profile.facebookUrl || 'https://facebook.com/sylhetmanabsevasangathan');
  const [youtubeUrl, setYoutubeUrl] = useState(profile.youtubeUrl || 'https://youtube.com/@sylhetmanabseva');
  const [emailAddress, setEmailAddress] = useState(profile.email || 'sylhetmanabseva@gmail.com');
  const [hotline, setHotline] = useState(profile.hotline || '01886122678');
  const [emergencyContact, setEmergencyContact] = useState(profile.emergencyContact || '01711000000');

  // Handle Photo File Upload (Base64)
  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      notifyError('ছবির সাইজ সর্বোচ্চ ২ মেগাবাইট (2MB) হতে হবে');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setter(reader.result);
        notifySuccess('ছবি আপলোড সম্পন্ন হয়েছে');
      }
    };
    reader.readAsDataURL(file);
  };

  // --- SLIDE CRUD ---
  const openAddSlideModal = () => {
    setEditingSlide(null);
    setSlideImageUrl('');
    setSlideTitle('');
    setSlideDescription('');
    setSlideCategory('ত্রাণ বিতরণ');
    setSlideDate(new Date().toISOString().split('T')[0]);
    setSlideLocation('সিলেট');
    setSlideIsActive(true);
    setIsSlideModalOpen(true);
  };

  const openEditSlideModal = (slide: HomeSlide) => {
    setEditingSlide(slide);
    setSlideImageUrl(slide.imageUrl || '');
    setSlideTitle(slide.title);
    setSlideDescription(slide.description || '');
    setSlideCategory(slide.category || 'ত্রাণ বিতরণ');
    setSlideDate(slide.date || '');
    setSlideLocation(slide.location || '');
    setSlideIsActive(slide.isActive !== false);
    setIsSlideModalOpen(true);
  };

  const handleSaveSlide = (e: React.FormEvent) => {
    e.preventDefault();
    if (!slideImageUrl.trim()) {
      notifyError('অনুগ্রহ করে স্লাইডের ছবি ইউআরএল বা ফাইল দিন');
      return;
    }
    if (!slideTitle.trim()) {
      notifyError('স্লাইডের শিরোনাম লিখুন');
      return;
    }

    const slideData: HomeSlide = {
      id: editingSlide ? editingSlide.id : `slide-${Date.now()}`,
      imageUrl: slideImageUrl.trim(),
      title: slideTitle.trim(),
      description: slideDescription.trim(),
      category: slideCategory.trim(),
      date: slideDate.trim(),
      location: slideLocation.trim(),
      isActive: slideIsActive
    };

    let updatedSlides: HomeSlide[];
    if (editingSlide) {
      updatedSlides = slides.map(s => s.id === editingSlide.id ? slideData : s);
      notifySuccess('স্লাইড সফলভাবে আপডেট হয়েছে');
    } else {
      updatedSlides = [slideData, ...slides];
      notifySuccess('নতুন স্লাইড সফলভাবে যুক্ত হয়েছে');
    }

    onUpdateSlides(updatedSlides);
    setIsSlideModalOpen(false);
  };

  const handleDeleteSlide = (id: string, title: string) => {
    if (window.confirm(`আপনি কি "${title}" স্লাইডটি মুছে ফেলতে চান?`)) {
      const updated = slides.filter(s => s.id !== id);
      onUpdateSlides(updated);
      notifySuccess('স্লাইড মুছে ফেলা হয়েছে');
    }
  };

  const handleToggleSlideActive = (id: string) => {
    const updated = slides.map(s => s.id === id ? { ...s, isActive: !s.isActive } : s);
    onUpdateSlides(updated);
    notifySuccess('স্লাইডের প্রদর্শন স্ট্যাটাস পরিবর্তন হয়েছে');
  };

  // --- ACTIVITY CRUD ---
  const openAddActivityModal = () => {
    setEditingActivity(null);
    setActivityTitle('');
    setActivityDescription('');
    setActivityItemsGiven('');
    setActivityCost('');
    setActivityHandledBy('');
    setActivityRecipientName('');
    setActivityRecipientPhotoUrl('');
    setActivityDate(new Date().toISOString().split('T')[0]);
    setActivityLocation('সিলেট');
    setActivityIsFeatured(activities.length === 0);
    setIsActivityModalOpen(true);
  };

  const openEditActivityModal = (act: HumanitarianActivity) => {
    setEditingActivity(act);
    setActivityTitle(act.title);
    setActivityDescription(act.description);
    setActivityItemsGiven(act.itemsGiven || '');
    setActivityCost(act.cost);
    setActivityHandledBy(act.handledBy);
    setActivityRecipientName(act.recipientName || '');
    setActivityRecipientPhotoUrl(act.recipientPhotoUrl || '');
    setActivityDate(act.date || '');
    setActivityLocation(act.location || '');
    setActivityIsFeatured(!!act.isFeatured);
    setIsActivityModalOpen(true);
  };

  const handleSaveActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activityTitle.trim()) {
      notifyError('কার্যক্রমের শিরোনাম অবশ্যই লিখুন');
      return;
    }
    if (!activityDescription.trim()) {
      notifyError('কার্যক্রমের বিবরণ লিখুন');
      return;
    }

    const costNum = Number(activityCost) || 0;
    const activityData: HumanitarianActivity = {
      id: editingActivity ? editingActivity.id : `act-${Date.now()}`,
      title: activityTitle.trim(),
      description: activityDescription.trim(),
      itemsGiven: activityItemsGiven.trim(),
      cost: costNum,
      handledBy: activityHandledBy.trim() || 'সংগঠনের ভলান্টিয়ার টিম',
      recipientName: activityRecipientName.trim(),
      recipientPhotoUrl: activityRecipientPhotoUrl.trim(),
      date: activityDate.trim() || new Date().toISOString().split('T')[0],
      location: activityLocation.trim() || 'সিলেট',
      isFeatured: activityIsFeatured
    };

    let updatedActivities: HumanitarianActivity[];
    if (editingActivity) {
      // If setting this to featured, unfeature others
      if (activityIsFeatured) {
        updatedActivities = activities.map(a => a.id === editingActivity.id ? activityData : { ...a, isFeatured: false });
      } else {
        updatedActivities = activities.map(a => a.id === editingActivity.id ? activityData : a);
      }
      notifySuccess('কার্যক্রমের বিবরণ সফলভাবে আপডেট হয়েছে');
    } else {
      if (activityIsFeatured) {
        updatedActivities = [activityData, ...activities.map(a => ({ ...a, isFeatured: false }))];
      } else {
        updatedActivities = [activityData, ...activities];
      }
      notifySuccess('নতুন মানবিক কার্যক্রম সফলভাবে যুক্ত হয়েছে');
    }

    onUpdateActivities(updatedActivities);
    setIsActivityModalOpen(false);
  };

  const handleDeleteActivity = (id: string, title: string) => {
    if (window.confirm(`আপনি কি "${title}" কার্যক্রমটি মুছে ফেলতে চান?`)) {
      const updated = activities.filter(a => a.id !== id);
      onUpdateActivities(updated);
      notifySuccess('কার্যক্রম মুছে ফেলা হয়েছে');
    }
  };

  const handleSetFeaturedActivity = (id: string) => {
    const updated = activities.map(a => ({
      ...a,
      isFeatured: a.id === id
    }));
    onUpdateActivities(updated);
    notifySuccess('এই কার্যক্রমটিকে হোম পেজের প্রধান ফিচারড হিসেবে নির্বাচন করা হয়েছে');
  };

  // --- RULE CRUD ---
  const openAddRuleModal = () => {
    setEditingRule(null);
    setRulePointNumber(rules.length + 1);
    setRuleText('');
    setRuleCategory('মূলনীতি');
    setIsRuleModalOpen(true);
  };

  const openEditRuleModal = (rule: OrganizationRule) => {
    setEditingRule(rule);
    setRulePointNumber(rule.pointNumber || rules.findIndex(r => r.id === rule.id) + 1);
    setRuleText(rule.ruleText);
    setRuleCategory(rule.category || 'মূলনীতি');
    setIsRuleModalOpen(true);
  };

  const handleSaveRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleText.trim()) {
      notifyError('নীতিমালার বিবরণ অবশ্যই লিখুন');
      return;
    }

    const ruleData: OrganizationRule = {
      id: editingRule ? editingRule.id : `rule-${Date.now()}`,
      pointNumber: rulePointNumber || rules.length + 1,
      ruleText: ruleText.trim(),
      category: ruleCategory.trim() || 'মূলনীতি',
      isActive: true
    };

    let updatedRules: OrganizationRule[];
    if (editingRule) {
      updatedRules = rules.map(r => r.id === editingRule.id ? ruleData : r);
      notifySuccess('নীতিমালা সফলভাবে আপডেট হয়েছে');
    } else {
      updatedRules = [...rules, ruleData];
      notifySuccess('নতুন নিয়ম সফলভাবে যুক্ত হয়েছে');
    }

    onUpdateRules(updatedRules);
    setIsRuleModalOpen(false);
  };

  const handleDeleteRule = (id: string) => {
    if (window.confirm('আপনি কি এই নিয়মটি তালিকা থেকে মুছে ফেলতে চান?')) {
      const updated = rules.filter(r => r.id !== id);
      onUpdateRules(updated);
      notifySuccess('নিয়ম সফলভাবে মুছে ফেলা হয়েছে');
    }
  };

  // --- SOCIAL & OFFICIAL LINKS SAVE ---
  const handleSaveSocialLinks = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedProfile: OrganizationProfile = {
      ...profile,
      facebookUrl: facebookUrl.trim(),
      youtubeUrl: youtubeUrl.trim(),
      email: emailAddress.trim(),
      hotline: hotline.trim(),
      emergencyContact: emergencyContact.trim()
    };
    onUpdateProfile(updatedProfile);
    notifySuccess('অফিসিয়াল সোশ্যাল লিংক ও ইমেইল সফলভাবে সংরক্ষিত হয়েছে');
  };

  return (
    <div className="space-y-6">
      {/* Top Section Tabs */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap gap-2 items-center justify-between">
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setActiveSection('slides')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeSection === 'slides'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>১. ফটো স্লাইডার ও গ্যালারি ({toBengaliNumber(slides.length)})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('activities')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeSection === 'activities'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <HeartHandshake className="w-4 h-4" />
            <span>২. মানবিক কার্যক্রম বিবরণী ({toBengaliNumber(activities.length)})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('rules')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeSection === 'rules'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>৩. নিয়মাবলি ও নীতিমালা ({toBengaliNumber(rules.length)})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('social')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeSection === 'social'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Share2 className="w-4 h-4" />
            <span>৪. অফিসিয়াল ফুটার লিংক</span>
          </button>
        </div>

        <span className="text-[11px] text-emerald-800 font-semibold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
          হোম পেজ লাইভ ম্যানেজমেন্ট
        </span>
      </div>

      {/* SECTION 1: PHOTO SLIDER & GALLERY */}
      {activeSection === 'slides' && (
        <div className="space-y-4">
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-emerald-600" />
                মানবিক ফটো স্লাইডার ও গ্যালারি ম্যানেজমেন্ট
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                হোম পেজের শীর্ষে প্রদর্শিত ছবি, শিরোনাম, স্থান ও বিবরণ পরিচালনা করুন।
              </p>
            </div>

            <button
              onClick={openAddSlideModal}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>নতুন স্লাইড ছবি যোগ করুন</span>
            </button>
          </div>

          {/* Slides Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {slides.map((slide, idx) => (
              <div
                key={slide.id}
                className={`bg-white rounded-2xl border-2 transition overflow-hidden shadow-xs flex flex-col justify-between ${
                  slide.isActive !== false ? 'border-slate-200 hover:border-emerald-500' : 'border-slate-200 opacity-60 bg-slate-50'
                }`}
              >
                <div className="relative h-44 bg-slate-900 overflow-hidden">
                  <img
                    src={slide.imageUrl}
                    alt={slide.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=600&q=80';
                    }}
                  />
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                    <span className="bg-emerald-600/90 text-white text-[11px] font-bold px-2 py-0.5 rounded-md shadow-xs">
                      #{toBengaliNumber(idx + 1)} {slide.category || 'কার্যক্রম'}
                    </span>
                    {slide.isActive === false && (
                      <span className="bg-rose-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                        লুকানো (Inactive)
                      </span>
                    )}
                  </div>
                  {slide.date && (
                    <span className="absolute bottom-2.5 right-2.5 bg-black/70 backdrop-blur-xs text-white text-[10px] font-semibold px-2 py-0.5 rounded">
                      {slide.date}
                    </span>
                  )}
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm leading-snug">
                      {slide.title}
                    </h4>
                    {slide.description && (
                      <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                        {slide.description}
                      </p>
                    )}
                    {slide.location && (
                      <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-2">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{slide.location}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => handleToggleSlideActive(slide.id)}
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition ${
                        slide.isActive !== false
                          ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                      }`}
                    >
                      {slide.isActive !== false ? 'হোমে প্রদর্শিত' : 'লুকানো রয়েছে'}
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => openEditSlideModal(slide)}
                        className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition"
                        title="এডিট করুন"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteSlide(slide.id, slide.title)}
                        className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition"
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

          {slides.length === 0 && (
            <div className="bg-white p-8 rounded-2xl border border-dashed border-slate-300 text-center text-slate-500 text-sm">
              এখনো কোনো স্লাইড ছবি যুক্ত করা হয়নি। &quot;নতুন স্লাইড ছবি যোগ করুন&quot; বাটনে চাপুন।
            </div>
          )}
        </div>
      )}

      {/* SECTION 2: HUMANITARIAN ACTIVITIES */}
      {activeSection === 'activities' && (
        <div className="space-y-4">
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <HeartHandshake className="w-5 h-5 text-teal-600" />
                মানবিক কার্যক্রম বিবরণী ম্যানেজমেন্ট
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                বিতরণকৃত সামগ্রী, ব্যয়ের পরিমাণ, ভলান্টিয়ারের নাম ও উপকারভোগীর ছবিসহ পূর্ণাঙ্গ প্রতিবেদন।
              </p>
            </div>

            <button
              onClick={openAddActivityModal}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>নতুন কার্যক্রম বিবরণী যোগ করুন</span>
            </button>
          </div>

          <div className="space-y-3">
            {activities.map((act) => (
              <div
                key={act.id}
                className={`bg-white rounded-2xl p-4 sm:p-5 border-2 transition shadow-xs ${
                  act.isFeatured ? 'border-teal-500 bg-teal-50/20' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex flex-col md:flex-row gap-4 justify-between">
                  <div className="flex items-start gap-4">
                    {/* Recipient Photo Preview */}
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-100 overflow-hidden border-2 border-teal-200 flex-shrink-0 relative">
                      {act.recipientPhotoUrl ? (
                        <img
                          src={act.recipientPhotoUrl}
                          alt={act.recipientName || 'উপকারভোগী'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                          <User className="w-7 h-7" />
                          <span className="text-[9px] mt-0.5">ছবি নেই</span>
                        </div>
                      )}
                      {act.isFeatured && (
                        <span className="absolute top-1 right-1 w-3 h-3 rounded-full bg-amber-400 ring-2 ring-white" title="হোম পেজে ফিচারড" />
                      )}
                    </div>

                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {act.isFeatured && (
                          <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Star className="w-3 h-3 fill-current" />
                            হোম পেজ শীর্ষ ফিচারড
                          </span>
                        )}
                        <span className="bg-teal-100 text-teal-900 text-xs font-bold px-2.5 py-0.5 rounded-lg">
                          খরচ: {formatTaka(act.cost)}
                        </span>
                        {act.date && (
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {act.date}
                          </span>
                        )}
                      </div>

                      <h4 className="font-bold text-slate-900 text-base leading-snug">
                        {act.title}
                      </h4>

                      <p className="text-xs text-slate-600 leading-relaxed">
                        {act.description}
                      </p>

                      {act.itemsGiven && (
                        <div className="mt-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700">
                          <span className="font-bold text-teal-800 block mb-0.5">বিতরণকৃত সামগ্রী:</span>
                          <span>{act.itemsGiven}</span>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-y-1 gap-x-4 text-xs text-slate-500 pt-1">
                        <div>
                          <span className="font-semibold text-slate-700">দায়িত্বে / বিতরণে:</span> {act.handledBy}
                        </div>
                        {act.recipientName && (
                          <div>
                            <span className="font-semibold text-slate-700">উপকারভোগী:</span> {act.recipientName}
                          </div>
                        )}
                        {act.location && (
                          <div>
                            <span className="font-semibold text-slate-700">স্থান:</span> {act.location}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex md:flex-col items-center md:items-end justify-between gap-2 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                    <button
                      type="button"
                      onClick={() => handleSetFeaturedActivity(act.id)}
                      className={`text-xs font-bold px-3 py-1.5 rounded-xl transition flex items-center gap-1 whitespace-nowrap ${
                        act.isFeatured
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      <Star className={`w-3.5 h-3.5 ${act.isFeatured ? 'fill-amber-600 text-amber-600' : ''}`} />
                      <span>{act.isFeatured ? 'প্রধান কার্ড' : 'হোমে ফিচার করুন'}</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => openEditActivityModal(act)}
                        className="p-2 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition"
                        title="এডিট করুন"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteActivity(act.id, act.title)}
                        className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition"
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

          {activities.length === 0 && (
            <div className="bg-white p-8 rounded-2xl border border-dashed border-slate-300 text-center text-slate-500 text-sm">
              এখনো কোনো কার্যক্রম যুক্ত করা হয়নি। &quot;নতুন কার্যক্রম বিবরণী যোগ করুন&quot; বাটনে চাপুন।
            </div>
          )}
        </div>
      )}

      {/* SECTION 3: RULES & GUIDELINES */}
      {activeSection === 'rules' && (
        <div className="space-y-4">
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-600" />
                সংগঠনের নিয়মাবলি ও নীতিমালা ম্যানেজমেন্ট
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                হোম পেজে পয়েন্ট আকারে প্রদর্শিত নির্দেশিকা ও নীতিমালা সংযোজন বা পরিবর্তন করুন।
              </p>
            </div>

            <button
              onClick={openAddRuleModal}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>নতুন নিয়ম যোগ করুন</span>
            </button>
          </div>

          <div className="space-y-2.5">
            {rules.map((rule, idx) => (
              <div
                key={rule.id}
                className="bg-white rounded-2xl p-4 border border-slate-200 hover:border-amber-400 transition shadow-xs flex items-start justify-between gap-3"
              >
                <div className="flex items-start gap-3 flex-1">
                  <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 font-black text-sm flex items-center justify-center flex-shrink-0">
                    {toBengaliNumber(rule.pointNumber || idx + 1)}
                  </div>

                  <div className="space-y-1 flex-1">
                    {rule.category && (
                      <span className="inline-block bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded">
                        {rule.category}
                      </span>
                    )}
                    <p className="text-sm font-medium text-slate-900 leading-relaxed">
                      {rule.ruleText}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => openEditRuleModal(rule)}
                    className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition"
                    title="এডিট করুন"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteRule(rule.id)}
                    className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition"
                    title="মুছে ফেলুন"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {rules.length === 0 && (
            <div className="bg-white p-8 rounded-2xl border border-dashed border-slate-300 text-center text-slate-500 text-sm">
              এখনো কোনো নিয়ম বা নীতিমালা যুক্ত করা হয়নি।
            </div>
          )}
        </div>
      )}

      {/* SECTION 4: OFFICIAL FOOTER LINKS */}
      {activeSection === 'social' && (
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Share2 className="w-5 h-5 text-blue-600" />
              অফিসিয়াল সোশ্যাল লিংক ও যোগাযোগ তথ্য
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              হোম পেজের নিচে ফুটার সেকশনে প্রদর্শিত অফিসিয়াল ফেসবুক, ইউটিউব ও ইমেইল এড্রেস আপডেট করুন।
            </p>
          </div>

          <form onSubmit={handleSaveSocialLinks} className="space-y-4 max-w-2xl">
            {/* Facebook */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Facebook className="w-4 h-4 text-blue-600" />
                অফিসিয়াল ফেসবুক পেজ / গ্রুপ ইউআরএল (Facebook Link):
              </label>
              <input
                type="url"
                value={facebookUrl}
                onChange={(e) => setFacebookUrl(e.target.value)}
                placeholder="https://facebook.com/your-group"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
              <span className="text-[11px] text-slate-500">
                ব্যবহারকারীরা এই বাটনে ক্লিক করলে সরাসরি আপনার ফেসবুক পেজে চলে যাবেন।
              </span>
            </div>

            {/* YouTube */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Youtube className="w-4 h-4 text-red-600" />
                অফিসিয়াল ইউটিউব চ্যানেল লিংক (YouTube Channel Link):
              </label>
              <input
                type="url"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="https://youtube.com/@your-channel"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-red-500 focus:outline-hidden"
              />
              <span className="text-[11px] text-slate-500">
                সংগঠনের মানবিক কাজের ভিডিও দেখতে ব্যবহারকারীরা সরাসরি ইউটিউবে যেতে পারবেন।
              </span>
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-emerald-600" />
                অফিসিয়াল ইমেইল এড্রেস (Official Email Address):
              </label>
              <input
                type="email"
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                placeholder="info@sylhetmanabseva.org"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
              <span className="text-[11px] text-slate-500">
                যেকোনো অফিশিয়াল যোগাযোগ বা অনুসন্ধানের জন্য এই ইমেইল প্রদর্শিত হবে।
              </span>
            </div>

            {/* Hotline & Emergency Contact */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-teal-600" />
                  জরুরি হটলাইন নম্বর:
                </label>
                <input
                  type="text"
                  value={hotline}
                  onChange={(e) => setHotline(e.target.value)}
                  placeholder="01886122678"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-rose-600" />
                  ২৪/৭ জরুরি রক্ত যোগাযোগ:
                </label>
                <input
                  type="text"
                  value={emergencyContact}
                  onChange={(e) => setEmergencyContact(e.target.value)}
                  placeholder="01711000000"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="pt-3">
              <button
                type="submit"
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>সোশ্যাল ও যোগাযোগ তথ্য সংরক্ষণ করুন</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* --- MODAL: ADD / EDIT SLIDE --- */}
      {isSlideModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-emerald-600" />
                {editingSlide ? 'স্লাইড ছবি সম্পাদনা' : 'নতুন স্লাইড ছবি যোগ'}
              </h3>
              <button
                onClick={() => setIsSlideModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSlide} className="space-y-4 text-left">
              {/* Image Preview */}
              {slideImageUrl && (
                <div className="relative h-40 rounded-2xl overflow-hidden bg-slate-900 border border-slate-200">
                  <img
                    src={slideImageUrl}
                    alt="প্রিভিউ"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Image URL & Upload */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  ছবির লিংক (Image URL):
                </label>
                <input
                  type="url"
                  value={slideImageUrl}
                  onChange={(e) => setSlideImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />

                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[11px] text-slate-400">অথবা ডিভাইস থেকে ফটো সিলেক্ট করুন:</span>
                  <label className="cursor-pointer px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1 transition">
                    <Upload className="w-3.5 h-3.5" />
                    <span>ফাইল বাছাই</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, setSlideImageUrl)}
                    />
                  </label>
                </div>
              </div>

              {/* Title */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">
                  স্লাইডের শিরোনাম (Title) *
                </label>
                <input
                  type="text"
                  required
                  value={slideTitle}
                  onChange={(e) => setSlideTitle(e.target.value)}
                  placeholder="যেমন: বন্যার্তদের মাঝে জরুরি ত্রাণ বিতরণ"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">
                  সংক্ষিপ্ত বিবরণ (Description)
                </label>
                <textarea
                  rows={2}
                  value={slideDescription}
                  onChange={(e) => setSlideDescription(e.target.value)}
                  placeholder="কার্যক্রম সম্পর্কে ২-৩ বাক্যে বিবরণ লিখুন..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Category */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">ক্যাটাগরি</label>
                  <select
                    value={slideCategory}
                    onChange={(e) => setSlideCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                  >
                    <option value="ত্রাণ বিতরণ">ত্রাণ বিতরণ</option>
                    <option value="রক্তদান">রক্তদান সেবা</option>
                    <option value="বৃক্ষরোপণ">বৃক্ষরোপণ</option>
                    <option value="অসহায় সেবা">অসহায় সেবা</option>
                    <option value="চিকিৎসা সহায়তা">চিকিৎসা সহায়তা</option>
                    <option value="শিক্ষা সহায়তা">শিক্ষা সহায়তা</option>
                  </select>
                </div>

                {/* Date */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">তারিখ</label>
                  <input
                    type="date"
                    value={slideDate}
                    onChange={(e) => setSlideDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                  />
                </div>
              </div>

              {/* Location */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">স্থান / এলাকা</label>
                <input
                  type="text"
                  value={slideLocation}
                  onChange={(e) => setSlideLocation(e.target.value)}
                  placeholder="যেমন: কোম্পানীগঞ্জ, সিলেট"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="slide-active-toggle"
                  checked={slideIsActive}
                  onChange={(e) => setSlideIsActive(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded"
                />
                <label htmlFor="slide-active-toggle" className="text-xs font-bold text-slate-700 cursor-pointer">
                  হোম পেজের স্লাইডারে সক্রিয়ভাবে প্রদর্শন করুন
                </label>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSlideModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white shadow-xs"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: ADD / EDIT ACTIVITY --- */}
      {isActivityModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <HeartHandshake className="w-5 h-5 text-teal-600" />
                {editingActivity ? 'কার্যক্রম বিবরণী সম্পাদনা' : 'নতুন মানবিক কার্যক্রম বিবরণী'}
              </h3>
              <button
                onClick={() => setIsActivityModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveActivity} className="space-y-4 text-left">
              {/* Title */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">
                  কার্যক্রমের শিরোনাম (Activity Title) *
                </label>
                <input
                  type="text"
                  required
                  value={activityTitle}
                  onChange={(e) => setActivityTitle(e.target.value)}
                  placeholder="যেমন: বন্যাপীড়িত অসহায় পরিবারের মাঝে খাদ্য সহায়তা বিতরণ"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">
                  বিস্তারিত বিবরণ (Activity Description) *
                </label>
                <textarea
                  rows={3}
                  required
                  value={activityDescription}
                  onChange={(e) => setActivityDescription(e.target.value)}
                  placeholder="কিভাবে ও কাদের মাঝে কার্যক্রম পরিচালনা করা হয়েছে বিস্তারিত লিখুন..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>

              {/* Items Given */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">
                  বিতরণকৃত সামগ্রী (Items Given - e.g. চাল, ডাল ইত্যাদি):
                </label>
                <input
                  type="text"
                  value={activityItemsGiven}
                  onChange={(e) => setActivityItemsGiven(e.target.value)}
                  placeholder="যেমন: চাল ১০ কেজি, ডাল ২ কেজি, তেল ১ লিটার, আলু ৩ কেজি"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Cost */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    ব্যয় / মোট খরচ (টাকায় ৳) *
                  </label>
                  <input
                    type="number"
                    required
                    value={activityCost}
                    onChange={(e) => setActivityCost(e.target.value)}
                    placeholder="যেমন: 2350"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>

                {/* Handled By */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    বিতরণে / দায়িত্বে (Volunteer / Organizer) *
                  </label>
                  <input
                    type="text"
                    required
                    value={activityHandledBy}
                    onChange={(e) => setActivityHandledBy(e.target.value)}
                    placeholder="যেমন: মো: আব্দুল্লাহ আল মামুন ও টিম ভলান্টিয়ার্স"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
              </div>

              {/* Recipient Info & Photo */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold text-teal-800 flex items-center gap-1.5">
                  <User className="w-4 h-4" />
                  উপকারভোগীর তথ্য ও ছবি (Recipient Details & Portrait Photo)
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-700">উপকারভোগীর নাম ও পরিচয়:</label>
                    <input
                      type="text"
                      value={activityRecipientName}
                      onChange={(e) => setActivityRecipientName(e.target.value)}
                      placeholder="যেমন: মোসাম্মৎ জমিলা খাতুন (বয়স: ৫৮)"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-700">তারিখ ও স্থান:</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="date"
                        value={activityDate}
                        onChange={(e) => setActivityDate(e.target.value)}
                        className="w-full px-2 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                      />
                      <input
                        type="text"
                        value={activityLocation}
                        onChange={(e) => setActivityLocation(e.target.value)}
                        placeholder="সিলেট"
                        className="w-full px-2 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <div className="w-14 h-14 rounded-full bg-slate-200 overflow-hidden border-2 border-teal-300 flex-shrink-0">
                    {activityRecipientPhotoUrl ? (
                      <img
                        src={activityRecipientPhotoUrl}
                        alt="উপকারভোগী ছবি"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400">
                        <User className="w-6 h-6" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-1">
                    <input
                      type="url"
                      value={activityRecipientPhotoUrl}
                      onChange={(e) => setActivityRecipientPhotoUrl(e.target.value)}
                      placeholder="উপকারভোগীর ছবির লিংক (Image URL)"
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs bg-white"
                    />
                    <label className="inline-flex cursor-pointer px-2 py-0.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-[11px] font-semibold rounded-lg items-center gap-1 transition">
                      <Upload className="w-3 h-3" />
                      <span>ডিভাইস থেকে ছবি আপলোড</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, setActivityRecipientPhotoUrl)}
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Featured Toggle */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="activity-featured-toggle"
                  checked={activityIsFeatured}
                  onChange={(e) => setActivityIsFeatured(e.target.checked)}
                  className="w-4 h-4 text-teal-600 rounded"
                />
                <label htmlFor="activity-featured-toggle" className="text-xs font-bold text-slate-700 cursor-pointer">
                  হোম পেজের প্রধান কার্ড (Featured Activity) হিসেবে প্রদর্শন করুন
                </label>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsActivityModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-xs font-bold text-white shadow-xs"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: ADD / EDIT RULE --- */}
      {isRuleModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-600" />
                {editingRule ? 'নীতিমালা সম্পাদনা' : 'নতুন নিয়ম / নীতিমালা যোগ'}
              </h3>
              <button
                onClick={() => setIsRuleModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRule} className="space-y-4 text-left">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">পয়েন্ট নম্বর (Point No.)</label>
                  <input
                    type="number"
                    value={rulePointNumber}
                    onChange={(e) => setRulePointNumber(e.target.value)}
                    placeholder="1"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">ক্যাটাগরি</label>
                  <select
                    value={ruleCategory}
                    onChange={(e) => setRuleCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                  >
                    <option value="মূলনীতি">মূলনীতি</option>
                    <option value="রক্তদান সেবা">রক্তদান সেবা</option>
                    <option value="আর্থিক স্বচ্ছতা">আর্থিক স্বচ্ছতা</option>
                    <option value="ত্রাণ ও সেবা">ত্রাণ ও সেবা</option>
                    <option value="শৃঙ্খলা ও উপস্থিতি">শৃঙ্খলা ও উপস্থিতি</option>
                    <option value="সদস্যপদ বাতিল নীতিমালা">সদস্যপদ বাতিল নীতিমালা</option>
                    <option value="সাধারণ নিয়মাবলী">সাধারণ নিয়মাবলী</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">
                  নীতিমালার বিবরণ (Rule Description) *
                </label>
                <textarea
                  rows={4}
                  required
                  value={ruleText}
                  onChange={(e) => setRuleText(e.target.value)}
                  placeholder="যেমন: সংগঠনের সকল সদস্যকে দেশ, সমাজ ও মানবতার সেবায় সম্পূর্ণরূপে নিঃস্বার্থভাবে কাজ করতে হবে..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsRuleModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-xs font-bold text-white shadow-xs"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
