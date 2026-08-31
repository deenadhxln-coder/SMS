import React from 'react';
import useAuthStore from '@sms/auth';
import PageContainer from '../../components/layout/PageContainer';
import { User, Mail, ShieldAlert, BadgeCheck } from 'lucide-react';

const Settings = () => {
  const { user } = useAuthStore();

  return (
    <PageContainer
      title="Account Settings"
      description="View your user credentials and permissions context"
    >
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
    </PageContainer>
  );
};

export default Settings;
