import React from 'react';
import { PhoneCall, X, ShieldAlert, Heart, Phone, Truck, Flame } from 'lucide-react';
import { OrganizationProfile } from '../types';
import { sanitizePhone } from '../utils/helpers';

interface EmergencyHelplineModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: OrganizationProfile;
}

export const EmergencyHelplineModal: React.FC<EmergencyHelplineModalProps> = ({
  isOpen,
  onClose,
  profile
}) => {
  if (!isOpen) return null;

  const helplines = [
    { name: 'সংগঠনের প্রধান হটলাইন', number: profile.hotline, desc: 'সিলেট মানব সেবা সংগঠন জরুরি সহায়তা', icon: Heart, color: 'text-emerald-700 bg-emerald-100' },
    { name: 'জরুরি হেল্পলাইন নম্বর', number: profile.emergencyContact, desc: 'সার্বক্ষণিক জরুরি সমন্বয়কারী', icon: PhoneCall, color: 'text-amber-700 bg-amber-100' },
    { name: 'জাতীয় জরুরি সেবা (৯৯৯)', number: '999', desc: 'পুলিশ, ফায়ার সার্ভিস ও অ্যাম্বুলেন্স', icon: ShieldAlert, color: 'text-rose-700 bg-rose-100' },
    { name: 'ফায়ার সার্ভিস কন্ট্রোল রুম', number: '16163', desc: 'অগ্নি দুর্ঘটনা ও উদ্ধার সেবা', icon: Flame, color: 'text-orange-700 bg-orange-100' }
  ];

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">জরুরি হেল্পলাইন</h3>
              <p className="text-[10px] text-slate-500">তাৎক্ষণিক কলের জন্য নম্বর স্পর্শ করুন</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2.5">
          {helplines.map((item) => {
            const IconComponent = item.icon;
            return (
              <a
                key={item.number}
                href={`tel:${sanitizePhone(item.number)}`}
                className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 transition group"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${item.color}`}>
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{item.name}</h4>
                    <p className="text-[10px] text-slate-500">{item.desc}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-emerald-800 bg-white px-2.5 py-1.5 rounded-xl border border-slate-200 shadow-2xs group-hover:border-emerald-500">
                  <Phone className="w-3 h-3 text-emerald-600" />
                  <span>{item.number}</span>
                </div>
              </a>
            );
          })}
        </div>

        <div className="pt-2 text-center">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
          >
            বন্ধ করুন
          </button>
        </div>
      </div>
    </div>
  );
};
