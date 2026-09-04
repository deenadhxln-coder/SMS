import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import api from '@sms/api-client';
import { Button, Table, Badge } from '@sms/ui-kit';
import PageContainer from '../../components/layout/PageContainer';
import EmptyState from '../../components/common/EmptyState';
import { TableSkeleton } from '../../components/common/SkeletonLoaders';
import OnboardSchoolModal from '../../components/tenants/OnboardSchoolModal';
import PlanChangeModal from '../../components/tenants/PlanChangeModal';
import StatusConfirmModal from '../../components/tenants/StatusConfirmModal';
import TenantDetailDrawer from '../../components/tenants/TenantDetailDrawer';
import { 
  Building2, 
  Plus, 
  Search, 
  RefreshCw, 
  Copy, 
  Check, 
  X, 
  Filter, 
  AlertTriangle, 
  CheckCircle2,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

const TenantsPage = () => {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  // URL search params sync
  const initialSearch = searchParams.get('school') || '';
  const initialStatus = searchParams.get('status') || 'ALL';
  const initialPlan = searchParams.get('plan') || 'ALL';

  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [planFilter, setPlanFilter] = useState(initialPlan);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  const [copiedId, setCopiedId] = useState(null);
  const [feedback, setFeedback] = useState({ type: '', text: '' });

  // Modals & Drawer State
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState(null);

  // Queries
  const { 
    data: tenants = [], 
    isLoading: loadingTenants, 
    refetch: refetchTenants,
    isFetching: fetchingTenants 
  } = useQuery({
    queryKey: ['superadmin', 'tenants'],
    queryFn: async () => {
      const response = await api.get('/superadmin/tenants');
      return response.data.tenants || [];
    }
  });

  const { data: auditLogs = [] } = useQuery({
    queryKey: ['superadmin', 'audit-logs'],
    queryFn: async () => {
      const response = await api.get('/superadmin/audit-logs');
      return response.data.logs || [];
    }
  });

  // Auto-open drawer if `school` param is present and matches a tenant
  useEffect(() => {
    const slugQuery = searchParams.get('school');
    if (slugQuery && tenants.length > 0) {
      const match = tenants.find(t => t.slug === slugQuery);
      if (match) {
        setSelectedTenant(match);
        setIsDetailDrawerOpen(true);
      }
    }
  }, [searchParams, tenants]);

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
      setFeedback({ type: 'success', text: data.message || 'School institution onboarded successfully!' });
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
      setFeedback({ type: 'success', text: data.message || 'Tenant configuration updated.' });
      setTimeout(() => setFeedback({ type: '', text: '' }), 4000);
    },
    onError: (err) => {
      setFeedback({ type: 'error', text: err.response?.data?.message || 'Update failed.' });
    }
  });

  const handleCopySlug = (slug, id) => {
    navigator.clipboard.writeText(slug);
    setCopiedId(`slug-${id}`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('ALL');
    setPlanFilter('ALL');
    setCurrentPage(1);
    setSearchParams({});
  };

  const hasActiveFilters = searchTerm !== '' || statusFilter !== 'ALL' || planFilter !== 'ALL';

  // Filtered dataset
  const filteredTenants = tenants.filter(t => {
    const q = searchTerm.toLowerCase();
    const matchesSearch = 
      (t.schoolName || '').toLowerCase().includes(q) ||
      (t.slug || '').toLowerCase().includes(q) ||
      (t.contactEmail || '').toLowerCase().includes(q);

    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
    const matchesPlan = planFilter === 'ALL' || t.planType === planFilter;

    return matchesSearch && matchesStatus && matchesPlan;
  });

  const paginatedTenants = filteredTenants.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
  const totalPages = Math.ceil(filteredTenants.length / rowsPerPage) || 1;

  // Table Columns
  const columns = [
    {
      header: 'School Institution',
      accessor: 'schoolName',
      render: (val, row) => (
        <div 
          onClick={() => {
            setSelectedTenant(row);
            setIsDetailDrawerOpen(true);
          }}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold ${
            row.status === 'ACTIVE' 
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
              : 'bg-rose-50 text-rose-700 border border-rose-200'
          }`}>
            <Building2 size={16} />
          </div>
          <div className="min-w-0">
            <span className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors block truncate">
              {val}
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[11px] font-mono text-indigo-600 font-medium">/{row.slug}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopySlug(row.slug, row.id);
                }}
                className="text-slate-400 hover:text-slate-600 p-0.5"
                title="Copy slug"
              >
                {copiedId === `slug-${row.id}` ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
              </button>
            </div>
          </div>
        </div>
      )
    },
    {
      header: 'Contact Email',
      accessor: 'contactEmail',
      render: (val) => <span className="text-xs font-medium text-slate-600">{val || '—'}</span>
    },
    {
      header: 'Subscription Tier',
      accessor: 'planType',
      render: (val) => {
        const tierColors = {
          FREE: 'bg-slate-100 text-slate-700 border-slate-200',
          STANDARD: 'bg-blue-50 text-blue-700 border-blue-200',
          PREMIUM: 'bg-purple-50 text-purple-700 border-purple-200'
        };
        return (
          <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-md border ${tierColors[val] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
            {val}
          </span>
        );
      }
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (val) => (
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
          val === 'ACTIVE' 
            ? 'bg-emerald-100 text-emerald-800' 
            : 'bg-rose-100 text-rose-800'
        }`}>
          {val}
        </span>
      )
    },
    {
      header: 'Onboarded Date',
      accessor: 'createdAt',
      render: (val) => <span className="text-xs text-slate-500 font-mono">{val ? new Date(val).toLocaleDateString() : '—'}</span>
    },
    {
      header: 'Operations',
      accessor: 'id',
      render: (val, row) => (
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            onClick={() => {
              setSelectedTenant(row);
              setIsDetailDrawerOpen(true);
            }}
            className="!px-2.5 !py-1 !text-xs !font-semibold text-slate-700 hover:text-indigo-600 hover:border-indigo-200"
          >
            Details
          </Button>

          <Button
            variant="outline"
            onClick={() => {
              setSelectedTenant(row);
              setIsPlanModalOpen(true);
            }}
            className="!px-2.5 !py-1 !text-xs !font-semibold text-slate-700 hover:text-indigo-600 hover:border-indigo-200"
          >
            Tier
          </Button>

          <Button
            variant={row.status === 'ACTIVE' ? 'ghost' : 'outline'}
            onClick={() => {
              setSelectedTenant(row);
              setIsStatusModalOpen(true);
            }}
            className={`!px-2.5 !py-1 !text-xs !font-semibold ${
              row.status === 'ACTIVE'
                ? 'text-rose-600 hover:bg-rose-50 border border-rose-200'
                : 'text-emerald-600 hover:bg-emerald-50 border border-emerald-200'
            }`}
          >
            {row.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
          </Button>
        </div>
      )
    }
  ];

  return (
    <PageContainer
      title="School Tenant Workspace"
      description="Manage multi-tenant school deployments, subscription tiers, and institutional access"
      action={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => refetchTenants()}
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
      {/* Feedback Banner */}
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

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search school, slug, email..."
            className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
          />
          {searchTerm && (
            <button
              onClick={() => {
                setSearchTerm('');
                setCurrentPage(1);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filter Selects & Reset */}
        <div className="flex items-center flex-wrap gap-2.5 w-full md:w-auto">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="SUSPENDED">SUSPENDED</option>
          </select>

          {/* Plan Filter */}
          <select
            value={planFilter}
            onChange={(e) => {
              setPlanFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Tiers</option>
            <option value="FREE">FREE Tier</option>
            <option value="STANDARD">STANDARD Tier</option>
            <option value="PREMIUM">PREMIUM Tier</option>
          </select>

          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl transition-colors"
            >
              Reset Filters
            </button>
          )}
        </div>

      </div>

      {/* Main Tenant Table */}
      {loadingTenants ? (
        <TableSkeleton rows={6} cols={6} />
      ) : filteredTenants.length === 0 ? (
        <EmptyState
          type={hasActiveFilters ? 'filtered' : 'empty'}
          title={hasActiveFilters ? 'No matching school tenants found' : 'No school tenants onboarded'}
          description={
            hasActiveFilters 
              ? 'Try adjusting your search criteria or resetting your status and subscription filters.' 
              : 'Deploy your first educational institution to begin provisioning users and managing subscriptions.'
          }
          action={
            hasActiveFilters ? (
              <Button variant="outline" onClick={handleResetFilters}>
                Reset Filters
              </Button>
            ) : (
              <Button variant="primary" onClick={() => setIsOnboardingOpen(true)} icon={<Plus size={16} />}>
                Deploy School
              </Button>
            )
          }
        />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
            <span>Showing <strong>{filteredTenants.length}</strong> {filteredTenants.length === 1 ? 'school tenant' : 'school tenants'}</span>
            <span>Page {currentPage} of {totalPages}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  {columns.map((col, idx) => (
                    <th key={idx} className="py-3 px-4">{col.header}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedTenants.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                    {columns.map((col, cIdx) => (
                      <td key={cIdx} className="py-3 px-4">
                        {col.render ? col.render(row[col.accessor], row) : row[col.accessor]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Previous
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-7 h-7 text-xs font-bold rounded-lg transition-colors ${
                      currentPage === i + 1 
                        ? 'bg-indigo-600 text-white' 
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modals & Drawer */}
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

    </PageContainer>
  );
};

export default TenantsPage;
