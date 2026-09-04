import React, { useState } from 'react';
import useAuthStore from '@sms/auth';
import PageContainer from '../../components/layout/PageContainer';
import { User, Mail, ShieldAlert, BadgeCheck, CreditCard, Shield } from 'lucide-react';
import BillingTab from './BillingTab';

const Settings = () => {
  const { user } = useAuthStore();
  const isSchoolAdmin = user?.role === 'School Admin';
  const [activeTab, setActiveTab] = useState('profile');

  return (
    <PageContainer
      title="Account Settings"
      description="View your user credentials, institutional security, and subscription billing"
    >
      <div className="space-y-6">
        {/* Tab Selection */}
        {isSchoolAdmin && (
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
                activeTab === 'profile'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <BadgeCheck size={16} />
              <span>Security Profile</span>
            </button>
            <button
              onClick={() => setActiveTab('billing')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
                activeTab === 'billing'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <CreditCard size={16} />
              <span>Subscription & Plan Quotas</span>
            </button>
          </div>
        )}

        {/* Tab Content */}
        {activeTab === 'profile' || !isSchoolAdmin ? (
          <div className="max-w-2xl bg-white border border-slate-100 shadow-sm rounded-2xl p-6 md:p-8 animate-fade-in text-left">
            <h3 className="text-base font-bold text-slate-800 mb-6 pb-3 border-b border-slate-50 flex items-center gap-2">
              <BadgeCheck size={20} className="text-indigo-650" />
              <span>Security Profile Information</span>
            </h3>

            <div className="space-y-6">
              <div className="flex gap-4 items-center">
                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                  <User size={18} />
                </div>
                <div>
                  <p className="text-3xs font-extrabold uppercase tracking-wider text-slate-400">Full Display Name</p>
                  <h4 className="text-sm font-bold text-slate-700">{user?.name}</h4>
                </div>
              </div>

              <div className="flex gap-4 items-center">
                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                  <Mail size={18} />
                </div>
                <div>
                  <p className="text-3xs font-extrabold uppercase tracking-wider text-slate-400">Linked Email Address</p>
                  <h4 className="text-sm font-bold text-slate-700">{user?.email}</h4>
                </div>
              </div>

              <div className="flex gap-4 items-center">
                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                  <ShieldAlert size={18} />
                </div>
                <div>
                  <p className="text-3xs font-extrabold uppercase tracking-wider text-slate-400">Access Security Role</p>
                  <h4 className="text-sm font-bold text-indigo-600">{user?.role}</h4>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <BillingTab />
        )}
      </div>
    </PageContainer>
  );
};

export default Settings;

