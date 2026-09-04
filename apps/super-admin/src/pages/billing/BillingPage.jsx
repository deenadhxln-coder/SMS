import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@sms/api-client';
import { Button, Badge } from '@sms/ui-kit';
import { 
  CreditCard, 
  IndianRupee, 
  TrendingUp, 
  ShieldCheck, 
  AlertTriangle, 
  Crown, 
  Zap, 
  Shield, 
  Copy, 
  Check, 
  RefreshCw,
  Search,
  Receipt
} from 'lucide-react';

const BillingPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedKey, setCopiedKey] = useState(null);

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['superadmin', 'billing', 'summary'],
    queryFn: async () => {
      const res = await api.get('/superadmin/billing/summary');
      return res.data;
    },
    refetchInterval: 60000,
  });

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const metrics = data?.metrics || {
    totalTenants: 0,
    totalActiveSubscriptions: 0,
    totalPastDueSubscriptions: 0,
    estimatedMonthlyRevenue: 0,
    totalCollectedRevenue: 0,
    distribution: { FREE: 0, STANDARD: 0, PREMIUM: 0 },
  };

  const transactions = data?.transactions || [];

  const filteredTransactions = transactions.filter(txn => {
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    return (
      txn.gatewayPaymentId?.toLowerCase().includes(s) ||
      txn.tenant?.schoolName?.toLowerCase().includes(s) ||
      txn.tenant?.slug?.toLowerCase().includes(s) ||
      txn.status?.toLowerCase().includes(s)
    );
  });

  return (
    <div className="space-y-6 animate-fade-in text-left">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
              <CreditCard size={18} />
            </span>
            <h1 className="text-xl font-black tracking-tight text-slate-900">
              Platform SaaS Billing
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time Razorpay subscription distribution, platform revenue metrics, and transaction reconciliation.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            onClick={() => refetch()}
            loading={isFetching}
            className="!px-3 !py-1.5 !text-xs font-semibold text-slate-700 hover:bg-slate-50 border-slate-200 flex items-center gap-1.5"
          >
            <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
            <span>Refresh State</span>
          </Button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Est. Monthly MRR</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center">
              <IndianRupee size={16} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 font-mono">
              ₹{metrics.estimatedMonthlyRevenue.toLocaleString('en-IN')}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Calculated from active paid subscriptions</p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Collected</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-emerald-700 font-mono">
              ₹{metrics.totalCollectedRevenue.toLocaleString('en-IN')}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Succeeded platform payments to date</p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Paid Tiers</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center">
              <ShieldCheck size={16} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-blue-700 font-mono">
              {metrics.totalActiveSubscriptions} <span className="text-xs font-normal text-slate-400">/ {metrics.totalTenants} schools</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Growth (STANDARD) & Enterprise (PREMIUM)</p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Past Due / Alerts</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center">
              <AlertTriangle size={16} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-rose-700 font-mono">
              {metrics.totalPastDueSubscriptions}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Subscriptions requiring payment retry</p>
          </div>
        </div>
      </div>

      {/* Subscription Tier Distribution Section */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <span>Active Plan Tier Allocation</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-600 border border-slate-200 flex items-center justify-center flex-shrink-0">
              <Shield size={18} />
            </div>
            <div className="space-y-1 flex-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-900">Starter (FREE)</span>
                <span className="text-xs font-black font-mono text-slate-700">{metrics.distribution.FREE || 0}</span>
              </div>
              <p className="text-[11px] text-slate-500">₹0 / mo • Up to 100 Students</p>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/40 flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-600 border border-blue-200 flex items-center justify-center flex-shrink-0">
              <Zap size={18} />
            </div>
            <div className="space-y-1 flex-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-blue-900">Growth (STANDARD)</span>
                <span className="text-xs font-black font-mono text-blue-700">{metrics.distribution.STANDARD || 0}</span>
              </div>
              <p className="text-[11px] text-slate-500">₹99 / mo • Up to 500 Students</p>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/40 flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-purple-100 text-purple-600 border border-purple-200 flex items-center justify-center flex-shrink-0">
              <Crown size={18} />
            </div>
            <div className="space-y-1 flex-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-purple-900">Enterprise (PREMIUM)</span>
                <span className="text-xs font-black font-mono text-purple-700">{metrics.distribution.PREMIUM || 0}</span>
              </div>
              <p className="text-[11px] text-slate-500">₹299 / mo • Unlimited Capacity</p>
            </div>
          </div>
        </div>
      </div>

      {/* Transactions & Webhook Invoices Stream */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Receipt size={16} className="text-indigo-600" />
              <span>Recent Razorpay Platform Payments</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Authoritative records created via cryptographically signed webhooks.</p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search payment or school..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:bg-white"
            />
          </div>
        </div>

        {/* Transactions Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-slate-100">
                <th className="px-4 py-3">School Tenant</th>
                <th className="px-4 py-3">Razorpay Payment ID</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Method</th>
                <th className="px-4 py-3 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-xs text-slate-400">
                    No platform payment transactions recorded yet.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((txn) => (
                  <tr key={txn.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900">{txn.tenant?.schoolName || 'Unknown School'}</div>
                      <div className="text-[11px] font-mono text-indigo-600 font-medium">/{txn.tenant?.slug}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 font-mono text-[11px] text-slate-600">
                        <span>{txn.gatewayPaymentId}</span>
                        <button
                          onClick={() => handleCopy(txn.gatewayPaymentId, txn.gatewayPaymentId)}
                          className="text-slate-400 hover:text-slate-600 p-0.5"
                          title="Copy Payment ID"
                        >
                          {copiedKey === txn.gatewayPaymentId ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">
                      ₹{parseFloat(txn.amount).toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        txn.status === 'SUCCEEDED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : txn.status === 'PENDING'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {txn.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 uppercase text-[11px] font-medium text-slate-500">
                      {txn.paymentMethod || 'Online'}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-500 text-[11px] font-mono">
                      {txn.paidAt ? new Date(txn.paidAt).toLocaleString() : new Date(txn.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BillingPage;
