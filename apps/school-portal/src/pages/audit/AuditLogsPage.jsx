import React, { useState, useEffect, useCallback } from 'react';
import api from '@sms/api-client';
import PageContainer from '../../components/layout/PageContainer';
import { Table, Button, Badge } from '@sms/ui-kit';
import { exportToCSV } from '../../utils/csvExport';
import {
  ShieldAlert, Download, RefreshCw, Calendar,
  Filter, User, Clock, FileText, CheckCircle2, RotateCcw
} from 'lucide-react';

const ACTION_VARIANTS = {
  CREATE: 'emerald',
  UPDATE: 'indigo',
  DELETE: 'rose',
  LOGIN: 'purple',
};

const AuditLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchAuditLogs = useCallback(async (pageNum = 1) => {
    try {
      setLoading(true);
      setError('');

      const params = {
        page: pageNum,
        limit: 20,
      };

      if (actionFilter) params.action = actionFilter;
      if (entityFilter) params.entity = entityFilter;
      if (startDate) params.startDate = new Date(startDate).toISOString();
      if (endDate) {
        // Set to end of the day in ISO
        const endD = new Date(endDate);
        endD.setHours(23, 59, 59, 999);
        params.endDate = endD.toISOString();
      }

      const res = await api.get('/audit-logs', { params });
      setLogs(res.data.logs || []);
      setTotal(res.data.total || 0);
      setPage(res.data.page || 1);
      setTotalPages(res.data.totalPages || 1);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
      setError(err.userMessage || err.response?.data?.message || 'Failed to retrieve school audit trail.');
    } finally {
      setLoading(false);
    }
  }, [actionFilter, entityFilter, startDate, endDate]);

  useEffect(() => {
    fetchAuditLogs(1);
  }, [fetchAuditLogs]);

  const handleResetFilters = () => {
    setActionFilter('');
    setEntityFilter('');
    setStartDate('');
    setEndDate('');
  };

  const handleExportCSV = () => {
    const exportColumns = [
      { label: 'Date & Time', accessor: (row) => new Date(row.timestamp).toLocaleString() },
      { label: 'Action', accessor: (row) => row.action || '' },
      { label: 'Entity', accessor: (row) => row.entity || '' },
      { label: 'Entity ID', accessor: (row) => row.entityId || 'N/A' },
      { label: 'Performed By', accessor: (row) => row.user?.name || 'System / Unassigned' },
      { label: 'User Email', accessor: (row) => row.user?.email || 'N/A' },
    ];
    exportToCSV(logs, exportColumns, 'school_audit_logs');
  };

  const columns = [
    {
      header: 'Timestamp',
      accessor: 'timestamp',
      render: (val) => (
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
          <Clock size={14} className="text-slate-400 flex-shrink-0" />
          <span>{val ? new Date(val).toLocaleString() : '—'}</span>
        </div>
      ),
    },
    {
      header: 'Action',
      accessor: 'action',
      render: (val) => {
        const variant = ACTION_VARIANTS[val] || 'slate';
        return <Badge variant={variant}>{val}</Badge>;
      },
    },
    {
      header: 'Entity',
      accessor: 'entity',
      render: (val) => (
        <span className="font-bold text-xs text-slate-800 tracking-tight">
          {val}
        </span>
      ),
    },
    {
      header: 'Entity ID',
      accessor: 'entityId',
      render: (val) => (
        <span className="font-mono text-2xs text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
          {val ? (val.length > 18 ? `${val.substring(0, 18)}...` : val) : '—'}
        </span>
      ),
    },
    {
      header: 'Performed By',
      accessor: (row) => row.user?.name,
      render: (_, row) => (
        <div>
          <div className="text-xs font-bold text-slate-800">
            {row.user?.name || 'System Event'}
          </div>
          {row.user?.email && (
            <div className="text-2xs text-slate-400">
              {row.user.email}
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <PageContainer
      title="Audit Trail"
      description="Immutable institutional activity log and system event history"
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleExportCSV}
            disabled={!logs.length}
          >
            <Download size={16} className="mr-2" />
            Export Page CSV
          </Button>
          <Button
            variant="outline"
            onClick={() => fetchAuditLogs(page)}
            disabled={loading}
          >
            <RefreshCw size={16} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      }
    >
      {/* Error state with retry */}
      {error && (
        <div className="mb-6 p-4 rounded-xl text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 flex items-center justify-between">
          <span>{error}</span>
          <Button size="sm" variant="outline" onClick={() => fetchAuditLogs(page)}>
            Retry
          </Button>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 mb-6 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 items-end">
          <div>
            <label className="block text-2xs font-bold uppercase tracking-wider text-slate-400 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div>
            <label className="block text-2xs font-bold uppercase tracking-wider text-slate-400 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div>
            <label className="block text-2xs font-bold uppercase tracking-wider text-slate-400 mb-1">
              Action
            </label>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="">All Actions</option>
              <option value="CREATE">CREATE</option>
              <option value="UPDATE">UPDATE</option>
              <option value="DELETE">DELETE</option>
              <option value="LOGIN">LOGIN</option>
            </select>
          </div>

          <div>
            <label className="block text-2xs font-bold uppercase tracking-wider text-slate-400 mb-1">
              Entity
            </label>
            <select
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="">All Entities</option>
              <option value="Student">Student</option>
              <option value="Teacher">Teacher</option>
              <option value="Class">Class</option>
              <option value="Section">Section</option>
              <option value="Attendance">Attendance</option>
              <option value="Exam">Exam</option>
              <option value="Mark">Mark</option>
              <option value="FeeStructure">FeeStructure</option>
              <option value="Invoice">Invoice</option>
              <option value="Payment">Payment</option>
              <option value="Announcement">Announcement</option>
            </select>
          </div>

          <div>
            <Button
              variant="outline"
              className="w-full justify-center"
              onClick={handleResetFilters}
              disabled={!actionFilter && !entityFilter && !startDate && !endDate}
            >
              <RotateCcw size={14} className="mr-1.5" />
              Reset
            </Button>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <Table
        columns={columns}
        data={logs}
        loading={loading}
        pagination={{
          currentPage: page,
          totalPages,
          onPageChange: (p) => setPage(p),
        }}
        emptyMessage="No audit records found."
        emptyDescription="System events, logins, and management actions will be logged here automatically."
      />
    </PageContainer>
  );
};

export default AuditLogsPage;
