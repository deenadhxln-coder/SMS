import React, { useEffect, useState } from 'react';
import { 
  X, 
  Building, 
  Globe, 
  Mail, 
  Calendar, 
  Shield, 
  Zap, 
  Crown, 
  Copy, 
  Check, 
  ExternalLink,
  Activity, 
  Clock, 
  AlertTriangle,
  FileText
} from 'lucide-react';
import { Button, Badge } from '@sms/ui-kit';

const TenantDetailDrawer = ({
  isOpen,
  onClose,
  tenant,
  auditLogs = [],
  onOpenPlanModal,
  onOpenStatusModal
}) => {
  const [copiedKey, setCopiedKey] = useState(null);

  // Reset local state when tenant changes or drawer opens
  useEffect(() => {
    setCopiedKey(null);
  }, [tenant, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !tenant) return null;

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Filter logs relating specifically to this tenant
  const tenantLogs = auditLogs.filter(log => log.tenantId === tenant.id).slice(0, 8);

  const planTierSpecs = {
    FREE: {
      name: 'Starter Evaluation Tier',
      studentsLimit: '100 Students',
      support: 'Community Support',
      icon: Shield,
      color: 'bg-slate-100 text-slate-700 border-slate-200'
    },
    STANDARD: {
      name: 'Growth School Tier',
      studentsLimit: '500 Students',
      support: 'Standard SLA',
      icon: Zap,
      color: 'bg-blue-50 text-blue-700 border-blue-200'
    },
    PREMIUM: {
      name: 'Enterprise Scale Tier',
      studentsLimit: 'Uncapped Capacity',
      support: 'Priority Dedicated SLA',
      icon: Crown,
      color: 'bg-purple-50 text-purple-700 border-purple-200'
    }
  };

  const planSpec = planTierSpecs[tenant.planType] || planTierSpecs.FREE;
  const PlanIcon = planSpec.icon;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden text-left" role="dialog" aria-modal="true" aria-label="Tenant Details">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm transition-opacity animate-fade-in"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex sm:pl-10">
        <div className="w-screen max-w-full sm:max-w-md md:max-w-lg bg-white shadow-2xl border-l border-slate-200 flex flex-col h-full animate-slide-in-right">
          
          {/* Drawer Header */}
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
            <div className="flex items-center gap-3 min-w-0">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                tenant.status === 'ACTIVE'
                  ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                  : 'bg-rose-50 text-rose-600 border border-rose-200'
              }`}>
                <Building size={20} />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-bold text-slate-900 truncate">
                  {tenant.schoolName}
                </h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs font-mono text-indigo-600 font-medium truncate">
                    /{tenant.slug}
                  </span>
                  <button
                    onClick={() => handleCopy(tenant.slug, 'slug')}
                    className="text-slate-400 hover:text-slate-600 p-0.5"
                    title="Copy slug"
                  >
                    {copiedKey === 'slug' ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors"
              aria-label="Close panel"
            >
              <X size={18} />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
            
            {/* Status & Plan Pill Strip */}
            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">Status:</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                  tenant.status === 'ACTIVE' 
                    ? 'bg-emerald-100 text-emerald-800' 
                    : 'bg-rose-100 text-rose-800'
                }`}>
                  {tenant.status}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">Tier:</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {tenant.planType}
                </span>
              </div>
            </div>

            {/* Section 1: Institutional Identity Details */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Institutional Details
              </h4>
              <div className="grid grid-cols-1 gap-2.5 text-xs">
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <Mail size={14} className="text-slate-400" /> Contact Email
                  </span>
                  <span className="font-semibold text-slate-800 font-mono">
                    {tenant.contactEmail || 'Not provided'}
                  </span>
                </div>

                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <Globe size={14} className="text-slate-400" /> Portal Subdomain
                  </span>
                  <span className="font-semibold text-indigo-600 font-mono truncate max-w-[220px]">
                    https://{tenant.slug}.sms.edu
                  </span>
                </div>

                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <Calendar size={14} className="text-slate-400" /> Onboarded On
                  </span>
                  <span className="font-semibold text-slate-800">
                    {tenant.createdAt ? new Date(tenant.createdAt).toLocaleString() : '—'}
                  </span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <FileText size={14} className="text-slate-400" /> System Tenant UUID
                  </span>
                  <div className="flex items-center gap-1 font-mono text-[11px] text-slate-600">
                    <span>{tenant.id?.slice(0, 13)}...</span>
                    <button
                      onClick={() => handleCopy(tenant.id, 'id')}
                      className="text-slate-400 hover:text-slate-600 p-0.5"
                      title="Copy full tenant ID"
                    >
                      {copiedKey === 'id' ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Subscription Allocation */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Subscription Allocation
                </h4>
                <Button
                  variant="outline"
                  onClick={() => onOpenPlanModal(tenant)}
                  className="!px-2.5 !py-1 !text-xs !font-semibold text-indigo-600 hover:bg-indigo-50 border-indigo-200"
                >
                  Change Tier
                </Button>
              </div>

              <div className={`p-4 rounded-xl border ${planSpec.color} flex items-start gap-3`}>
                <PlanIcon size={20} className="flex-shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm">{planSpec.name}</span>
                    <span className="font-bold uppercase tracking-wider text-[10px]">{tenant.planType}</span>
                  </div>
                  <div className="pt-1 space-y-1 text-slate-600">
                    <p>• Max Student Quota: <strong>{planSpec.studentsLimit}</strong></p>
                    <p>• Platform SLA: <strong>{planSpec.support}</strong></p>
                    {tenant.subscription && (
                      <p>• Razorpay Status: <strong className="uppercase font-mono text-[11px] text-indigo-700">{tenant.subscription.status || 'Active'}</strong></p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Recent Activity on this Tenant */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                <span>Recent Platform Activity</span>
                <span className="text-[10px] text-slate-400 font-normal">{tenantLogs.length} events recorded</span>
              </h4>

              {tenantLogs.length === 0 ? (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center text-xs text-slate-400">
                  No administrative events logged for this tenant yet.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden bg-white">
                  {tenantLogs.map(log => (
                    <div key={log.id} className="p-3 text-xs flex items-start justify-between gap-2 hover:bg-slate-50/60">
                      <div>
                        <span className="font-bold text-slate-800 block">{log.action}</span>
                        <span className="text-slate-400 text-[11px] flex items-center gap-1 mt-0.5">
                          <Clock size={11} /> {new Date(log.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                        Admin: {log.adminId?.slice(0, 6)}...
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Section 4: Operational Administration */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Governance Actions
              </h4>
              <div className="flex flex-col gap-2">
                <Button
                  variant={tenant.status === 'ACTIVE' ? 'ghost' : 'outline'}
                  onClick={() => onOpenStatusModal(tenant)}
                  className={`w-full justify-center !py-2 !text-xs !font-bold ${
                    tenant.status === 'ACTIVE'
                      ? 'text-rose-600 hover:bg-rose-50 border border-rose-200'
                      : 'text-emerald-600 hover:bg-emerald-50 border border-emerald-200'
                  }`}
                >
                  {tenant.status === 'ACTIVE' ? 'Suspend School Account' : 'Reactivate School Account'}
                </Button>
              </div>
            </div>

          </div>

          {/* Drawer Footer */}
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-400">
            <span>SMS Multi-Tenant SaaS</span>
            <button
              onClick={onClose}
              className="font-semibold text-slate-600 hover:text-slate-900"
            >
              Done
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default TenantDetailDrawer;
