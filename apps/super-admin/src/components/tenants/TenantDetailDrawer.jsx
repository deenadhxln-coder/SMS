import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
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
  Clock,
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

  const drawerContent = (
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
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base text-slate-900 truncate">
                    {tenant.schoolName}
                  </h3>
                  <Badge variant={tenant.status === 'ACTIVE' ? 'success' : 'danger'}>
                    {tenant.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                  <span className="font-mono text-indigo-600 font-semibold">{tenant.slug}.sms.edu</span>
                  <span>•</span>
                  <span>ID: {tenant.id?.slice(0, 8)}...</span>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Close drawer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Drawer Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">

            {/* Section 1: Tenant Profile */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                School Profile & Infrastructure
              </h4>
              <div className="grid grid-cols-1 gap-2 text-xs">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Globe size={14} className="text-slate-400" />
                    <span>Institutional Domain</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-mono text-indigo-600 font-semibold">
                    <span>https://{tenant.slug}.sms.edu</span>
                    <button
                      onClick={() => handleCopy(`https://${tenant.slug}.sms.edu`, 'domain')}
                      className="text-slate-400 hover:text-indigo-600 p-0.5 rounded"
                      title="Copy URL"
                    >
                      {copiedKey === 'domain' ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Mail size={14} className="text-slate-400" />
                    <span>Contact Email</span>
                  </div>
                  <span className="font-semibold text-slate-800">{tenant.contactEmail || 'Unassigned'}</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Calendar size={14} className="text-slate-400" />
                    <span>Onboarded On</span>
                  </div>
                  <span className="text-slate-700 font-medium">
                    {tenant.createdAt ? new Date(tenant.createdAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    }) : '—'}
                  </span>
                </div>
              </div>
            </div>

            {/* Section 2: Subscription & Limits */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Subscription Allocation
                </h4>
                <button
                  onClick={() => onOpenPlanModal(tenant)}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline"
                >
                  Change Tier
                </button>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-lg ${planSpec.color} flex items-center justify-center border flex-shrink-0`}>
                      <PlanIcon size={16} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">{tenant.planType}</span>
                        <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          {planSpec.name}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400">{planSpec.support}</span>
                    </div>
                  </div>
                </div>

                {/* Quota specs */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Enrolled Students</span>
                    <span className="font-bold text-slate-800 text-sm">
                      {tenant.studentCount ?? 0}
                      <span className="text-slate-400 font-normal text-xs"> / {planSpec.studentsLimit}</span>
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Active Faculty</span>
                    <span className="font-bold text-slate-800 text-sm">
                      {tenant.teacherCount ?? 0}
                      <span className="text-slate-400 font-normal text-xs"> staff</span>
                    </span>
                  </div>
                </div>

                {/* Student limit progress bar */}
                {tenant.planType !== 'PREMIUM' && (
                  <div className="pt-2">
                    {(() => {
                      const limit = tenant.planType === 'FREE' ? 100 : 500;
                      const count = tenant.studentCount || 0;
                      const pct = Math.min(Math.round((count / limit) * 100), 100);
                      const isNearLimit = pct >= 80;
                      return (
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px]">
                            <span className="text-slate-500">Student Quota Used</span>
                            <span className={`font-semibold ${isNearLimit ? 'text-amber-600' : 'text-slate-700'}`}>{pct}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                isNearLimit ? 'bg-amber-500' : 'bg-indigo-600'
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>

            {/* Section 3: Audit Trail for this Tenant */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Recent Tenant Audits ({tenantLogs.length})
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

  return typeof document !== 'undefined' ? createPortal(drawerContent, document.body) : null;
};

export default TenantDetailDrawer;
