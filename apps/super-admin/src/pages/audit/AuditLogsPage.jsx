import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@sms/api-client';
import { Button } from '@sms/ui-kit';
import PageContainer from '../../components/layout/PageContainer';
import EmptyState from '../../components/common/EmptyState';
import { TableSkeleton } from '../../components/common/SkeletonLoaders';
import AuditPayloadModal from '../../components/audit/AuditPayloadModal';
import { 
  ScrollText, 
  Search, 
  RefreshCw, 
  Download, 
  Clock, 
  Filter, 
  X, 
  Eye, 
  ShieldAlert, 
  CheckCircle2,
  Terminal,
  FileSpreadsheet
} from 'lucide-react';

const AuditLogsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 15;

  const [selectedLog, setSelectedLog] = useState(null);
  const [isPayloadModalOpen, setIsPayloadModalOpen] = useState(false);

  // Fetch all platform audit logs
  const { 
    data: auditLogs = [], 
    isLoading: loadingLogs, 
    refetch: refetchLogs,
    isFetching: fetchingLogs 
  } = useQuery({
    queryKey: ['superadmin', 'audit-logs'],
    queryFn: async () => {
      const response = await api.get('/superadmin/audit-logs');
      return response.data.logs || [];
    }
  });

  // Action categories derived from real data
  const actionTypes = Array.from(new Set(auditLogs.map(l => l.action).filter(Boolean)));

  const handleResetFilters = () => {
    setSearchTerm('');
    setActionFilter('ALL');
    setCurrentPage(1);
  };

  const hasActiveFilters = searchTerm !== '' || actionFilter !== 'ALL';

  // Filtering
  const filteredLogs = auditLogs.filter(log => {
    const q = searchTerm.toLowerCase();
    const matchesSearch = 
      (log.action || '').toLowerCase().includes(q) ||
      (log.adminId || '').toLowerCase().includes(q) ||
      (log.tenantId || '').toLowerCase().includes(q) ||
      (typeof log.metadata === 'string' && log.metadata.toLowerCase().includes(q));

    const matchesAction = actionFilter === 'ALL' || log.action === actionFilter;

    return matchesSearch && matchesAction;
  });

  const paginatedLogs = filteredLogs.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
  const totalPages = Math.ceil(filteredLogs.length / rowsPerPage) || 1;

  // CSV Export
  const handleExportCSV = () => {
    if (filteredLogs.length === 0) return;

    const headers = ['ID', 'Timestamp', 'Action', 'Admin ID', 'Tenant ID', 'Metadata'];
    const rows = filteredLogs.map(l => [
      `"${l.id}"`,
      `"${new Date(l.createdAt).toISOString()}"`,
      `"${l.action}"`,
      `"${l.adminId}"`,
      `"${l.tenantId || 'Global'}"`,
      `"${(typeof l.metadata === 'string' ? l.metadata : JSON.stringify(l.metadata || {})).replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `platform-audit-logs-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <PageContainer
      title="Platform Audit Trail"
      description="Immutable administrative activity logs, security mutations, and platform event history"
      action={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleExportCSV}
            disabled={filteredLogs.length === 0}
            icon={<Download size={14} />}
          >
            Export CSV
          </Button>
          <Button
            variant="outline"
            onClick={() => refetchLogs()}
            icon={<RefreshCw size={14} className={fetchingLogs ? 'animate-spin' : ''} />}
          >
            Refresh
          </Button>
        </div>
      }
    >
      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search action, admin UUID, tenant..."
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

        {/* Action Type Filter & Reset */}
        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Event Types</option>
            {actionTypes.map(act => (
              <option key={act} value={act}>{act}</option>
            ))}
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

      {/* Main Table */}
      {loadingLogs ? (
        <TableSkeleton rows={8} cols={5} />
      ) : filteredLogs.length === 0 ? (
        <EmptyState
          type={hasActiveFilters ? 'filtered' : 'empty'}
          title={hasActiveFilters ? 'No audit events match current filters' : 'No audit trail recorded'}
          description={
            hasActiveFilters 
              ? 'Try adjusting your search keywords or resetting the event type filter.' 
              : 'Administrative mutations such as tenant creation and subscription changes will be recorded here.'
          }
          action={
            hasActiveFilters ? (
              <Button variant="outline" onClick={handleResetFilters}>
                Reset Filters
              </Button>
            ) : null
          }
        />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
            <span>Showing <strong>{filteredLogs.length}</strong> recorded platform event{filteredLogs.length === 1 ? '' : 's'}</span>
            <span>Page {currentPage} of {totalPages}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Action Event</th>
                  <th className="py-3 px-4">Actor Admin</th>
                  <th className="py-3 px-4">Target Tenant ID</th>
                  <th className="py-3 px-4">Metadata Summary</th>
                  <th className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedLogs.map((log) => {
                  const metaStr = typeof log.metadata === 'object' ? JSON.stringify(log.metadata) : String(log.metadata || '{}');
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 text-slate-500 font-mono whitespace-nowrap">
                        <span className="flex items-center gap-1.5">
                          <Clock size={12} className="text-slate-400 flex-shrink-0" />
                          {new Date(log.createdAt).toLocaleString()}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-800 font-mono text-[11px] bg-slate-100 px-2 py-0.5 rounded border border-slate-200 inline-block">
                          {log.action}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-indigo-600 font-mono">
                        {log.adminId?.slice(0, 8)}...
                      </td>

                      <td className="py-3 px-4 text-slate-600 font-mono">
                        {log.tenantId ? `${log.tenantId.slice(0, 8)}...` : <span className="text-slate-400">Global</span>}
                      </td>

                      <td className="py-3 px-4 max-w-xs">
                        <span className="font-mono text-[11px] text-slate-600 block truncate bg-slate-50 px-2 py-1 rounded border border-slate-100" title={metaStr}>
                          {metaStr}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setSelectedLog(log);
                            setIsPayloadModalOpen(true);
                          }}
                          className="!px-2.5 !py-1 !text-xs !font-semibold text-indigo-600 hover:bg-indigo-50 border-indigo-200"
                        >
                          Payload
                        </Button>
                      </td>
                    </tr>
                  );
                })}
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

      {/* Payload Inspection Modal */}
      <AuditPayloadModal
        isOpen={isPayloadModalOpen}
        onClose={() => setIsPayloadModalOpen(false)}
        log={selectedLog}
      />

    </PageContainer>
  );
};

export default AuditLogsPage;
