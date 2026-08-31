import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@sms/api-client';
import { Button, Input, Modal, Table } from '@sms/ui-kit';
import { 
  Building2, 
  Users, 
  Layers, 
  Search, 
  Plus, 
  ShieldAlert, 
  TrendingUp, 
  Calendar,
  Activity,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

// Form validation schema for school onboarding
const onboardingSchema = z.object({
  schoolName: z.string().min(3, 'School name must be at least 3 characters'),
  slug: z.string().min(3, 'Slug must be at least 3 characters').regex(/^[a-z0-9-]+$/, 'Slug must be alphanumeric & lowercase (no spaces)'),
  contactEmail: z.string().email('Invalid contact email'),
  planType: z.enum(['FREE', 'STANDARD', 'PREMIUM']),
  adminName: z.string().min(2, 'Owner name is required'),
  adminEmail: z.string().email('Invalid owner email'),
  adminPassword: z.string().min(6, 'Owner password must be at least 6 characters')
});

const SuperAdminDashboard = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'tenants', 'logs'
  const [searchTerm, setSearchTerm] = useState('');
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [newPlan, setNewPlan] = useState('FREE');

  // React Hook Form for Onboarding
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(onboardingSchema)
  });

  // Queries
  const { data: tenants = [], isLoading: loadingTenants } = useQuery({
    queryKey: ['superadmin', 'tenants'],
    queryFn: async () => {
      const response = await api.get('/superadmin/tenants');
      return response.data.tenants || [];
    }
  });

  const { data: auditLogs = [], isLoading: loadingLogs } = useQuery({
    queryKey: ['superadmin', 'audit-logs'],
    queryFn: async () => {
      const response = await api.get('/superadmin/audit-logs');
      return response.data.logs || [];
    }
  });

  // Onboard School Mutation
  const onboardMutation = useMutation({
    mutationFn: async (onboardingData) => {
      const response = await api.post('/superadmin/tenants', onboardingData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['superadmin', 'tenants']);
      queryClient.invalidateQueries(['superadmin', 'audit-logs']);
      setIsOnboardingOpen(false);
      reset();
      alert('School successfully onboarded!');
    },
    onError: (err) => {
      alert(err.response?.data?.message || 'Failed to onboard school.');
    }
  });

  // Update Tenant config Mutation
  const updateTenantMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await api.put(`/superadmin/tenants/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['superadmin', 'tenants']);
      queryClient.invalidateQueries(['superadmin', 'audit-logs']);
      setIsPlanModalOpen(false);
      alert('Tenant configuration updated!');
    },
    onError: (err) => {
      alert(err.response?.data?.message || 'Failed to update tenant configuration.');
    }
  });

  const handleOnboardSubmit = (data) => {
    onboardMutation.mutate(data);
  };

  const toggleTenantStatus = (tenant) => {
    const nextStatus = tenant.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    const confirmMsg = `Are you sure you want to change the status of ${tenant.schoolName} to ${nextStatus}?`;
    if (window.confirm(confirmMsg)) {
      updateTenantMutation.mutate({
        id: tenant.id,
        data: { status: nextStatus }
      });
    }
  };

  const openPlanModal = (tenant) => {
    setSelectedTenant(tenant);
    setNewPlan(tenant.planType);
    setIsPlanModalOpen(true);
  };

  const handlePlanChangeSubmit = () => {
    updateTenantMutation.mutate({
      id: selectedTenant.id,
      data: { planType: newPlan }
    });
  };

  // Metrics Calculations
  const totalTenants = tenants.length;
  const activeTenants = tenants.filter(t => t.status === 'ACTIVE').length;
  const suspendedTenants = totalTenants - activeTenants;

  const planCounts = tenants.reduce((acc, t) => {
    acc[t.planType] = (acc[t.planType] || 0) + 1;
    return acc;
  }, { FREE: 0, STANDARD: 0, PREMIUM: 0 });

  // Estimated Monthly Revenue: Standard = $99/mo, Premium = $299/mo
  const estimatedRevenue = (planCounts.STANDARD * 99) + (planCounts.PREMIUM * 299);

  // Column definitions for Table
  const tenantColumns = [
    { header: 'School Name', accessor: 'schoolName', render: (val) => <span className="font-bold text-white text-sm">{val}</span> },
    { header: 'Slug/Domain', accessor: 'slug', render: (val) => <span className="px-2 py-1 bg-slate-950 rounded border border-slate-800 text-xs text-slate-400">{val}</span> },
    { header: 'Contact Email', accessor: 'contactEmail', render: (val) => <span className="text-slate-300 text-sm">{val || '-'}</span> },
    { 
      header: 'Subscription', 
      accessor: 'planType', 
      render: (val) => (
        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
          val === 'PREMIUM' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
          val === 'STANDARD' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
          'bg-slate-850 text-slate-400 border-slate-800'
        }`}>
          {val}
        </span>
      ) 
    },
    { 
      header: 'Status', 
      accessor: 'status', 
      render: (val) => (
        <span className={`px-2 py-0.5 rounded text-xs font-bold ${
          val === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
        }`}>
          {val}
        </span>
      ) 
    },
    { 
      header: 'Actions', 
      accessor: 'id', 
      render: (val, row) => (
        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant="secondary"
            onClick={() => openPlanModal(row)}
            className="text-xs font-bold"
          >
            Change Plan
          </Button>
          <Button 
            size="sm"
            variant={row.status === 'ACTIVE' ? 'danger' : 'success'}
            onClick={() => toggleTenantStatus(row)}
            className="text-xs font-bold"
          >
            {row.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
          </Button>
        </div>
      ) 
    }
  ];

  const logColumns = [
    { header: 'Timestamp', accessor: 'createdAt', render: (val) => <span className="text-slate-500">{new Date(val).toLocaleString()}</span> },
    { header: 'Admin ID', accessor: 'adminId', render: (val) => <span className="font-mono text-purple-400">{val}</span> },
    { 
      header: 'Action', 
      accessor: 'action', 
      render: (val) => (
        <span className="px-2 py-0.5 bg-slate-950 rounded text-slate-300 border border-slate-800 uppercase text-[10px]">
          {val}
        </span>
      ) 
    },
    { header: 'Target School ID', accessor: 'tenantId', render: (val) => <span className="font-mono text-slate-500">{val || '-'}</span> },
    { header: 'Parameters', accessor: 'metadata', render: (val) => <span className="max-w-xs truncate font-mono text-slate-400 block" title={val}>{val || '{}'}</span> }
  ];

  // Filtered tenants for search
  const filteredTenants = tenants.filter(t => 
    (t.schoolName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.slug || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.contactEmail || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 md:p-8 space-y-8 animate-fade-in text-left">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 border border-slate-800 p-6 rounded-3xl">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Layers className="text-purple-400 w-7 h-7" /> Platform Administration
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Global SaaS Control Panel for Tenant Onboarding, Subscription Management, and Audits.
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setActiveTab('overview')} 
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'overview' ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/25' : 'bg-slate-800 text-slate-400 hover:text-slate-200'}`}
          >
            Overview
          </button>
          <button 
            onClick={() => setActiveTab('tenants')} 
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'tenants' ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/25' : 'bg-slate-800 text-slate-400 hover:text-slate-200'}`}
          >
            Tenants
          </button>
          <button 
            onClick={() => setActiveTab('logs')} 
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'logs' ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/25' : 'bg-slate-800 text-slate-400 hover:text-slate-200'}`}
          >
            Audit Logs
          </button>
        </div>
      </div>

      {/* Overview Dashboard Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-slate-900 border border-slate-850 p-6 rounded-3xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full filter blur-xl"></div>
              <div className="p-3 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-2xl w-fit">
                <Building2 className="w-6 h-6" />
              </div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mt-4">Total School Tenants</p>
              <h3 className="text-3xl font-black text-white mt-2">{totalTenants}</h3>
              <p className="text-slate-500 text-xs font-semibold mt-1">All registered systems</p>
            </div>

            <div className="bg-slate-900 border border-slate-850 p-6 rounded-3xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full filter blur-xl"></div>
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl w-fit">
                <CheckCircle className="w-6 h-6" />
              </div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mt-4">Active Deployments</p>
              <h3 className="text-3xl font-black text-white mt-2">{activeTenants}</h3>
              <p className="text-emerald-400 text-xs font-bold mt-1">Online and operating</p>
            </div>

            <div className="bg-slate-900 border border-slate-850 p-6 rounded-3xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full filter blur-xl"></div>
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-2xl w-fit">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mt-4">Suspended Tenants</p>
              <h3 className="text-3xl font-black text-white mt-2">{suspendedTenants}</h3>
              <p className="text-slate-500 text-xs font-semibold mt-1">Billing or policy locks</p>
            </div>

            <div className="bg-slate-900 border border-slate-850 p-6 rounded-3xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full filter blur-xl"></div>
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-2xl w-fit">
                <TrendingUp className="w-6 h-6" />
              </div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mt-4">Est. MRR (USD)</p>
              <h3 className="text-3xl font-black text-white mt-2">${estimatedRevenue}</h3>
              <p className="text-blue-400 text-xs font-bold mt-1">Active subscriptions</p>
            </div>
          </div>

          {/* Plan Breakdown */}
          <div className="bg-slate-900 border border-slate-850 p-6 rounded-3xl">
            <h2 className="text-lg font-black text-white mb-6">Tier Subscription Distribution</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-850/60">
                <div className="flex justify-between items-center">
                  <span className="px-3 py-1 bg-slate-800 text-slate-300 font-bold rounded-lg text-xs">FREE Tier</span>
                  <span className="text-slate-400 font-extrabold text-sm">{planCounts.FREE} schools</span>
                </div>
                <div className="w-full bg-slate-850 h-2 rounded-full mt-4 overflow-hidden">
                  <div className="bg-slate-400 h-full" style={{ width: `${totalTenants > 0 ? (planCounts.FREE / totalTenants) * 100 : 0}%` }}></div>
                </div>
              </div>
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-850/60">
                <div className="flex justify-between items-center">
                  <span className="px-3 py-1 bg-blue-500/10 text-blue-400 font-bold rounded-lg text-xs border border-blue-500/20">STANDARD Tier</span>
                  <span className="text-blue-400 font-extrabold text-sm">{planCounts.STANDARD} schools</span>
                </div>
                <div className="w-full bg-slate-850 h-2 rounded-full mt-4 overflow-hidden">
                  <div className="bg-blue-500 h-full" style={{ width: `${totalTenants > 0 ? (planCounts.STANDARD / totalTenants) * 100 : 0}%` }}></div>
                </div>
              </div>
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-850/60">
                <div className="flex justify-between items-center">
                  <span className="px-3 py-1 bg-purple-500/10 text-purple-400 font-bold rounded-lg text-xs border border-purple-500/20">PREMIUM Tier</span>
                  <span className="text-purple-400 font-extrabold text-sm">{planCounts.PREMIUM} schools</span>
                </div>
                <div className="w-full bg-slate-850 h-2 rounded-full mt-4 overflow-hidden">
                  <div className="bg-purple-500 h-full" style={{ width: `${totalTenants > 0 ? (planCounts.PREMIUM / totalTenants) * 100 : 0}%` }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tenants Management Tab */}
      {activeTab === 'tenants' && (
        <div className="space-y-6">
          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-900 border border-slate-850 p-4 rounded-2xl">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
              <input
                type="text"
                placeholder="Search schools by name or slug..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-600"
              />
            </div>
            <Button 
              onClick={() => setIsOnboardingOpen(true)}
              className="w-full sm:w-auto !bg-purple-600 hover:!bg-purple-500 flex items-center justify-center gap-2 border-none"
            >
              <Plus className="w-4 h-4" /> Onboard School
            </Button>
          </div>

          {/* Tenants Table */}
          <div className="bg-slate-900 border border-slate-850 rounded-2xl overflow-hidden">
            <Table
              columns={tenantColumns}
              loading={loadingTenants}
              data={filteredTenants}
              dark
            />
          </div>
        </div>
      )}

      {/* Audit Logs Tab */}
      {activeTab === 'logs' && (
        <div className="bg-slate-900 border border-slate-850 rounded-2xl overflow-hidden p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <Activity className="text-purple-400 w-5 h-5" /> Platform Audit Trail
            </h2>
            <span className="text-xs text-slate-400 font-bold bg-slate-950 px-3 py-1 rounded-lg border border-slate-850">
              Total {auditLogs.length} events logged
            </span>
          </div>

          <div className="border border-slate-850 rounded-xl overflow-hidden">
            <Table
              columns={logColumns}
              loading={loadingLogs}
              data={auditLogs}
              dark
            />
          </div>
        </div>
      )}

      {/* Onboarding Modal */}
      <Modal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        title="Onboard New Tenant School"
      >
        <form onSubmit={handleSubmit(handleOnboardSubmit)} className="space-y-4 text-left">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="School Name"
              placeholder="e.g. Oakridge Academy"
              error={errors.schoolName}
              required
              {...register('schoolName')}
            />
            <Input
              label="Unique Slug / Subdomain"
              placeholder="e.g. oakridge"
              error={errors.slug}
              required
              {...register('slug')}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Contact Email Address"
              type="email"
              placeholder="billing@school.com"
              error={errors.contactEmail}
              required
              {...register('contactEmail')}
            />
            <div className="flex flex-col space-y-1.5">
              <label className="text-xs font-bold text-slate-400">Subscription Plan</label>
              <select
                {...register('planType')}
                className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2.5 text-sm text-slate-300 focus:outline-none focus:border-purple-600"
              >
                <option value="FREE">FREE (Max 10 Students, 2 Teachers)</option>
                <option value="STANDARD">STANDARD (Max 100 Students, 10 Teachers)</option>
                <option value="PREMIUM">PREMIUM (Unlimited Students, Unlimited Teachers)</option>
              </select>
            </div>
          </div>

          <div className="border-t border-slate-800/80 pt-4 mt-6">
            <h4 className="text-xs font-bold uppercase tracking-wider text-purple-400 mb-4">Initial School Admin Account</h4>
            <Input
              label="Admin Owner Name"
              placeholder="John Doe"
              error={errors.adminName}
              required
              {...register('adminName')}
            />
            <div className="grid grid-cols-2 gap-4 mt-3">
              <Input
                label="Admin Email"
                type="email"
                placeholder="admin@school.com"
                error={errors.adminEmail}
                required
                {...register('adminEmail')}
              />
              <Input
                label="Temp Password"
                type="password"
                placeholder="••••••••"
                error={errors.adminPassword}
                required
                {...register('adminPassword')}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-800/80 pt-4 mt-6">
            <Button type="button" variant="secondary" onClick={() => setIsOnboardingOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={onboardMutation.isPending} className="!bg-purple-600 hover:!bg-purple-500 border-none">
              Provision Tenant
            </Button>
          </div>
        </form>
      </Modal>

      {/* Plan Update Modal */}
      <Modal
        isOpen={isPlanModalOpen}
        onClose={() => setIsPlanModalOpen(false)}
        title="Modify Subscription Tier"
      >
        <div className="space-y-4 text-left">
          {selectedTenant && (
            <p className="text-sm font-semibold text-slate-400">
              Select the new plan tier for <strong className="text-white">{selectedTenant.schoolName}</strong>:
            </p>
          )}

          <div className="flex flex-col space-y-1.5">
            <label className="text-xs font-bold text-slate-400">Plan Option</label>
            <select
              value={newPlan}
              onChange={(e) => setNewPlan(e.target.value)}
              className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2.5 text-sm text-slate-300 focus:outline-none focus:border-purple-600"
            >
              <option value="FREE">FREE (Max 10 Students, 2 Teachers)</option>
              <option value="STANDARD">STANDARD (Max 100 Students, 10 Teachers)</option>
              <option value="PREMIUM">PREMIUM (Unlimited Students, Unlimited Teachers)</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-800/80 pt-4 mt-6">
            <Button type="button" variant="secondary" onClick={() => setIsPlanModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              type="button" 
              onClick={handlePlanChangeSubmit} 
              loading={updateTenantMutation.isPending}
              className="!bg-purple-600 hover:!bg-purple-500 border-none"
            >
              Apply Tier Migration
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SuperAdminDashboard;
