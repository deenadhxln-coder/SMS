import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '@sms/api-client';
import { Button } from '@sms/ui-kit';
import PageContainer from '../../components/layout/PageContainer';
import StatMetricCard from '../../components/common/StatMetricCard';
import { KPISkeleton, CardSkeleton } from '../../components/common/SkeletonLoaders';
import OnboardSchoolModal from '../../components/tenants/OnboardSchoolModal';
import PlanChangeModal from '../../components/tenants/PlanChangeModal';
import StatusConfirmModal from '../../components/tenants/StatusConfirmModal';
import TenantDetailDrawer from '../../components/tenants/TenantDetailDrawer';
import AuditPayloadModal from '../../components/audit/AuditPayloadModal';
import { 
  Building2, 
  ShieldCheck, 
  AlertTriangle, 
  Sparkles, 
  Plus, 
  RefreshCw, 
  ArrowRight, 
  Clock, 
  CheckCircle2, 
  Activity, 
  ExternalLink,
  Crown,
  Zap,
  Shield,
  Layers,
  FileText,
  AlertCircle
} from 'lucide-react';

const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Modals & Drawers state
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [isPayloadModalOpen, setIsPayloadModalOpen] = useState(false);

  const [selectedTenant, setSelectedTenant] = useState(null);
  const [selectedAuditLog, setSelectedAuditLog] = useState(null);
  const [feedback, setFeedback] = useState({ type: '', text: '' });

  // 1. Fetch Tenants
  const { 
    data: tenants = [], 
    isLoading: loadingTenants, 
    isError: errorTenants,
    refetch: refetchTenants,
    isFetching: fetchingTenants
  } = useQuery({
    queryKey: ['superadmin', 'tenants'],
    queryFn: async () => {
      const response = await api.get('/superadmin/tenants');
      return response.data.tenants || [];
    }
  });

  // 2. Fetch Audit Logs
  const { 
    data: auditLogs = [], 
    isLoading: loadingLogs, 
    isError: errorLogs,
    refetch: refetchLogs 
  } = useQuery({
    queryKey: ['superadmin', 'audit-logs'],
    queryFn: async () => {
      const response = await api.get('/superadmin/audit-logs');
      return response.data.logs || [];
    }
  });

  // Mutations
  const onboardMutation = useMutation({
    mutationFn: async (onboardingData) => {
      const response = await api.post('/superadmin/tenants', onboardingData);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['superadmin', 'tenants']);
      queryClient.invalidateQueries(['superadmin', 'audit-logs']);
      setIsOnboardingOpen(false);
      setFeedback({ type: 'success', text: data.message || 'School institution successfully deployed!' });
      setTimeout(() => setFeedback({ type: '', text: '' }), 4000);
    },
    onError: (err) => {
      setFeedback({ type: 'error', text: err.response?.data?.message || 'Failed to onboard school.' });
    }
  });

  const updateTenantMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await api.put(`/superadmin/tenants/${id}`, data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['superadmin', 'tenants']);
      queryClient.invalidateQueries(['superadmin', 'audit-logs']);
      setIsPlanModalOpen(false);
      setIsStatusModalOpen(false);
      if (selectedTenant) {
        setSelectedTenant(prev => ({ ...prev, ...data.tenant }));
      }
      setFeedback({ type: 'success', text: data.message || 'Configuration updated successfully.' });
      setTimeout(() => setFeedback({ type: '', text: '' }), 4000);
    },
    onError: (err) => {
      setFeedback({ type: 'error', text: err.response?.data?.message || 'Update failed.' });
    }
  });

  const handleRefreshAll = () => {
    refetchTenants();
    refetchLogs();
  };

  // Real Metrics Calculations
  const totalSchools = tenants.length;
  const activeSchools = tenants.filter(t => t.status === 'ACTIVE').length;
  const suspendedSchools = tenants.filter(t => t.status === 'SUSPENDED').length;
  
  // Real 30-day onboarding calculation
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const newSchoolsLast30d = tenants.filter(t => t.createdAt && new Date(t.createdAt) >= thirtyDaysAgo).length;

  // Subscription plan breakdown
  const freeCount = tenants.filter(t => t.planType === 'FREE').length;
  const standardCount = tenants.filter(t => t.planType === 'STANDARD').length;
  const premiumCount = tenants.filter(t => t.planType === 'PREMIUM').length;

  // Operational Attention Items (real data only)
  const attentionItems = [];
  const suspendedList = tenants.filter(t => t.status === 'SUSPENDED');
  if (suspendedList.length > 0) {
    attentionItems.push({
      id: 'suspended',
      type: 'danger',
      title: `${suspendedList.length} Suspended School ${suspendedList.length === 1 ? 'Tenant' : 'Tenants'}`,
      description: 'Institutional access is blocked. Review account standing to restore services.',
      actionLabel: 'Review Suspensions',
      onClick: () => navigate('/tenants?status=SUSPENDED')
    });
  }

  const missingEmailList = tenants.filter(t => !t.contactEmail);
  if (missingEmailList.length > 0) {
    attentionItems.push({
      id: 'missing-email',
      type: 'warning',
      title: `${missingEmailList.length} ${missingEmailList.length === 1 ? 'School lacks' : 'Schools lack'} contact email`,
      description: 'Official notifications cannot be dispatched without a contact address.',
      actionLabel: 'Inspect Tenants',
      onClick: () => navigate('/tenants')
    });
  }

  return (
    <PageContainer
      title="Platform Control Center"
      description="Real-time multi-tenant monitoring, subscription allocations, and operational governance"
      action={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleRefreshAll}
            icon={<RefreshCw size={14} className={fetchingTenants ? 'animate-spin' : ''} />}
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            onClick={() => setIsOnboardingOpen(true)}
            icon={<Plus size={16} />}
          >
            Onboard School
          </Button>
        </div>
      }
    >
      {/* Action Feedback Banner */}
      {feedback.text && (
        <div className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between gap-3 animate-fade-in ${
          feedback.type === 'error' 
            ? 'bg-rose-50 border border-rose-200 text-rose-700' 
            : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
        }`}>
          <div className="flex items-center gap-2">
            {feedback.type === 'error' ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
            <span>{feedback.text}</span>
          </div>
          <button onClick={() => setFeedback({ type: '', text: '' })} className="hover:opacity-70">
            &times;
          </button>
        </div>
      )}

      {/* SECTION A: Platform Snapshot KPIs */}
      {loadingTenants ? (
        <KPISkeleton />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatMetricCard
            title="Total School Tenants"
            value={totalSchools}
            subtext="Registered SaaS institutions"
            icon={Building2}
            variant="primary"
            onClick={() => navigate('/tenants')}
          />
          <StatMetricCard
            title="Active Deployments"
            value={activeSchools}
            subtext={`${totalSchools > 0 ? Math.round((activeSchools / totalSchools) * 100) : 0}% operational rate`}
            icon={ShieldCheck}
            variant="success"
            badge="Live"
            onClick={() => navigate('/tenants?status=ACTIVE')}
          />
          <StatMetricCard
            title="Suspended Tenants"
            value={suspendedSchools}
            subtext={suspendedSchools > 0 ? 'Action required' : 'Zero service blocks'}
            icon={AlertTriangle}
            variant={suspendedSchools > 0 ? 'danger' : 'default'}
            badge={suspendedSchools > 0 ? 'Alert' : 'Normal'}
            onClick={() => navigate('/tenants?status=SUSPENDED')}
          />
          <StatMetricCard
            title="Recent Onboardings"
            value={newSchoolsLast30d}
            subtext="Deployed past 30 days"
            icon={Sparkles}
            variant="default"
          />
        </div>
      )}

      {/* SECTION B: Platform Overview (2-Column Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Subscription Distribution & Tenant Breakdown */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Subscription Tier Distribution</h3>
              <p className="text-xs text-slate-400">Institutional allocations by subscription plan</p>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate('/analytics')}
              className="!px-2.5 !py-1 !text-xs !font-semibold text-indigo-600 border-indigo-100 hover:bg-indigo-50"
            >
              Full Analytics <ArrowRight size={12} className="ml-1" />
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {/* Free Starter */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Shield size={14} className="text-slate-500" /> Starter Tier
                </span>
                <span className="text-[10px] font-bold uppercase bg-slate-200 px-1.5 py-0.5 rounded text-slate-700">FREE</span>
              </div>
              <div className="text-2xl font-bold text-slate-900 leading-none">{freeCount}</div>
              <p className="text-[11px] text-slate-500">
                {totalSchools > 0 ? Math.round((freeCount / totalSchools) * 100) : 0}% of all schools
              </p>
            </div>

            {/* Standard Growth */}
            <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                  <Zap size={14} className="text-blue-600" /> Growth Tier
                </span>
                <span className="text-[10px] font-bold uppercase bg-blue-100 px-1.5 py-0.5 rounded text-blue-800">STANDARD</span>
              </div>
              <div className="text-2xl font-bold text-slate-900 leading-none">{standardCount}</div>
              <p className="text-[11px] text-slate-500">
                {totalSchools > 0 ? Math.round((standardCount / totalSchools) * 100) : 0}% of all schools
              </p>
            </div>

            {/* Premium Enterprise */}
            <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                  <Crown size={14} className="text-purple-600" /> Enterprise Tier
                </span>
                <span className="text-[10px] font-bold uppercase bg-purple-100 px-1.5 py-0.5 rounded text-purple-800">PREMIUM</span>
              </div>
              <div className="text-2xl font-bold text-slate-900 leading-none">{premiumCount}</div>
              <p className="text-[11px] text-slate-500">
                {totalSchools > 0 ? Math.round((premiumCount / totalSchools) * 100) : 0}% of all schools
              </p>
            </div>

          </div>

          {/* Quick Tenant Directory Preview */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Recent Onboarded Institutions
              </h4>
              <button
                onClick={() => navigate('/tenants')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
              >
                View all ({totalSchools}) →
              </button>
            </div>

            {tenants.length === 0 ? (
              <div className="p-6 bg-slate-50 rounded-xl border border-slate-100 text-center text-xs text-slate-400">
                No school tenants deployed yet. Click "Onboard School" to deploy your first institution.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
                {tenants.slice(0, 4).map((t) => (
                  <div 
                    key={t.id} 
                    onClick={() => {
                      setSelectedTenant(t);
                      setIsDetailDrawerOpen(true);
                    }}
                    className="p-3.5 hover:bg-slate-50/80 transition-colors flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                        t.status === 'ACTIVE' 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        <Building2 size={16} />
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-slate-900 block truncate">{t.schoolName}</span>
                        <span className="text-[11px] font-mono text-indigo-600 truncate block">/{t.slug}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {t.planType}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        t.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {t.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Operational Attention Required & Quick Actions */}
        <div className="space-y-6">
          
          {/* Attention Required */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <AlertCircle size={16} className="text-amber-500" /> Attention Required
              </h3>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                {attentionItems.length}
              </span>
            </div>

            {attentionItems.length === 0 ? (
              <div className="p-5 bg-emerald-50/50 rounded-xl border border-emerald-100 text-left space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                  <CheckCircle2 size={15} /> All Platform Systems Normal
                </div>
                <p className="text-[11px] text-emerald-700">
                  No suspended accounts or high-priority platform anomalies detected.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {attentionItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={item.onClick}
                    className="p-3 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200 transition-colors cursor-pointer text-left space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">{item.title}</span>
                      <ArrowRight size={12} className="text-slate-400" />
                    </div>
                    <p className="text-[11px] text-slate-500 leading-normal">{item.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Platform Actions */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
              Quick Operations
            </h3>

            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={() => setIsOnboardingOpen(true)}
                className="w-full flex items-center justify-between p-2.5 bg-slate-50 hover:bg-indigo-50/60 rounded-xl border border-slate-200/80 text-xs font-semibold text-slate-700 hover:text-indigo-900 transition-colors text-left"
              >
                <span className="flex items-center gap-2">
                  <Plus size={15} className="text-indigo-600" /> Deploy New Institution
                </span>
                <ArrowRight size={12} className="text-slate-400" />
              </button>

              <button
                onClick={() => navigate('/tenants')}
                className="w-full flex items-center justify-between p-2.5 bg-slate-50 hover:bg-indigo-50/60 rounded-xl border border-slate-200/80 text-xs font-semibold text-slate-700 hover:text-indigo-900 transition-colors text-left"
              >
                <span className="flex items-center gap-2">
                  <Building2 size={15} className="text-slate-600" /> Manage School Tenants
                </span>
                <ArrowRight size={12} className="text-slate-400" />
              </button>

              <button
                onClick={() => navigate('/audit-logs')}
                className="w-full flex items-center justify-between p-2.5 bg-slate-50 hover:bg-indigo-50/60 rounded-xl border border-slate-200/80 text-xs font-semibold text-slate-700 hover:text-indigo-900 transition-colors text-left"
              >
                <span className="flex items-center gap-2">
                  <FileText size={15} className="text-slate-600" /> Inspect Platform Audit Trail
                </span>
                <ArrowRight size={12} className="text-slate-400" />
              </button>

              <button
                onClick={() => navigate('/system-health')}
                className="w-full flex items-center justify-between p-2.5 bg-slate-50 hover:bg-indigo-50/60 rounded-xl border border-slate-200/80 text-xs font-semibold text-slate-700 hover:text-indigo-900 transition-colors text-left"
              >
                <span className="flex items-center gap-2">
                  <Activity size={15} className="text-emerald-600" /> Live System Health
                </span>
                <ArrowRight size={12} className="text-slate-400" />
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* SECTION D: Recent Platform Activity Stream */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Recent Platform Administrative Activity</h3>
            <p className="text-xs text-slate-400">Authoritative audit log stream of global platform mutations</p>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate('/audit-logs')}
            className="!px-3 !py-1 !text-xs !font-semibold text-slate-700"
          >
            View Full Audit Trail ({auditLogs.length}) →
          </Button>
        </div>

        {auditLogs.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No administrative audit events recorded yet. Platform mutations will appear here in real-time.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                  <th className="py-2.5 px-3">Recorded Time</th>
                  <th className="py-2.5 px-3">Action Event</th>
                  <th className="py-2.5 px-3">Actor Admin</th>
                  <th className="py-2.5 px-3">Target Tenant ID</th>
                  <th className="py-2.5 px-3 text-right">Payload</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.slice(0, 5).map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-3 text-slate-500 font-mono">
                      <span className="flex items-center gap-1.5">
                        <Clock size={12} className="text-slate-400" />
                        {new Date(log.createdAt).toLocaleString()}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-bold text-slate-800 font-mono text-[11px] bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-indigo-600 font-mono">
                      {log.adminId?.slice(0, 8)}...
                    </td>
                    <td className="py-3 px-3 text-slate-500 font-mono">
                      {log.tenantId ? `${log.tenantId.slice(0, 8)}...` : 'Global Platform'}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => {
                          setSelectedAuditLog(log);
                          setIsPayloadModalOpen(true);
                        }}
                        className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 underline"
                      >
                        Inspect Payload
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals & Slide-over Drawer */}
      <OnboardSchoolModal
        isOpen={isOnboardingOpen}
        onClose={() => {
          setIsOnboardingOpen(false);
          onboardMutation.reset();
        }}
        onSubmit={(data) => onboardMutation.mutate(data)}
        isPending={onboardMutation.isPending}
        errorMessage={onboardMutation.error?.response?.data?.message || (onboardMutation.isError ? (onboardMutation.error?.message || 'Failed to onboard school.') : null)}
      />

      <PlanChangeModal
        isOpen={isPlanModalOpen}
        onClose={() => setIsPlanModalOpen(false)}
        tenant={selectedTenant}
        onSubmit={({ id, planType }) => updateTenantMutation.mutate({ id, data: { planType } })}
        isPending={updateTenantMutation.isPending}
      />

      <StatusConfirmModal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        tenant={selectedTenant}
        onConfirm={(t, newStatus) => updateTenantMutation.mutate({ id: t.id, data: { status: newStatus } })}
        isPending={updateTenantMutation.isPending}
      />

      <TenantDetailDrawer
        isOpen={isDetailDrawerOpen}
        onClose={() => setIsDetailDrawerOpen(false)}
        tenant={selectedTenant}
        auditLogs={auditLogs}
        onOpenPlanModal={(t) => {
          setSelectedTenant(t);
          setIsPlanModalOpen(true);
        }}
        onOpenStatusModal={(t) => {
          setSelectedTenant(t);
          setIsStatusModalOpen(true);
        }}
      />

      <AuditPayloadModal
        isOpen={isPayloadModalOpen}
        onClose={() => setIsPayloadModalOpen(false)}
        log={selectedAuditLog}
      />

    </PageContainer>
  );
};

export default SuperAdminDashboard;
