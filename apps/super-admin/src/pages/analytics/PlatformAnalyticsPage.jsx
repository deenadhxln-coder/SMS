import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@sms/api-client';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Legend 
} from 'recharts';
import { Button } from '@sms/ui-kit';
import PageContainer from '../../components/layout/PageContainer';
import StatMetricCard from '../../components/common/StatMetricCard';
import { CardSkeleton } from '../../components/common/SkeletonLoaders';
import EmptyState from '../../components/common/EmptyState';
import { 
  BarChart3, 
  PieChart as PieIcon, 
  TrendingUp, 
  ShieldCheck, 
  Layers, 
  Building2, 
  RefreshCw,
  Info,
  Crown,
  Zap,
  Shield
} from 'lucide-react';

const PlatformAnalyticsPage = () => {
  const { 
    data: tenants = [], 
    isLoading: loadingTenants, 
    refetch: refetchTenants,
    isFetching 
  } = useQuery({
    queryKey: ['superadmin', 'tenants'],
    queryFn: async () => {
      const response = await api.get('/superadmin/tenants');
      return response.data.tenants || [];
    }
  });

  const total = tenants.length;
  const activeCount = tenants.filter(t => t.status === 'ACTIVE').length;
  const suspendedCount = tenants.filter(t => t.status === 'SUSPENDED').length;

  const freeCount = tenants.filter(t => t.planType === 'FREE').length;
  const standardCount = tenants.filter(t => t.planType === 'STANDARD').length;
  const premiumCount = tenants.filter(t => t.planType === 'PREMIUM').length;

  // Plan distribution for chart
  const planData = [
    { name: 'Starter (FREE)', count: freeCount, color: '#64748b' },
    { name: 'Growth (STANDARD)', count: standardCount, color: '#3b82f6' },
    { name: 'Enterprise (PREMIUM)', count: premiumCount, color: '#8b5cf6' }
  ].filter(p => p.count > 0 || total === 0);

  // Real timeline calculation: Group tenants by month-year based on real `createdAt`
  const timelineMap = {};
  tenants.forEach(t => {
    if (t.createdAt) {
      const d = new Date(t.createdAt);
      const key = `${d.toLocaleString('default', { month: 'short' })} ${d.getFullYear()}`;
      timelineMap[key] = (timelineMap[key] || 0) + 1;
    }
  });

  const timelineData = Object.keys(timelineMap).map(key => ({
    period: key,
    onboarded: timelineMap[key]
  }));

  return (
    <PageContainer
      title="Platform Analytics"
      description="Aggregated SaaS tenant growth metrics, subscription distributions, and operational utilization"
      action={
        <Button
          variant="outline"
          onClick={() => refetchTenants()}
          icon={<RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />}
        >
          Refresh Data
        </Button>
      }
    >
      {/* Platform Capacity Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatMetricCard
          title="Total Registered Tenants"
          value={total}
          subtext="Authoritative database count"
          icon={Building2}
          variant="primary"
        />
        <StatMetricCard
          title="Active vs Suspended Ratio"
          value={`${total > 0 ? Math.round((activeCount / total) * 100) : 0}%`}
          subtext={`${activeCount} Active / ${suspendedCount} Suspended`}
          icon={ShieldCheck}
          variant="success"
        />
        <StatMetricCard
          title="Paid Tier Ratio"
          value={`${total > 0 ? Math.round(((standardCount + premiumCount) / total) * 100) : 0}%`}
          subtext={`${standardCount + premiumCount} Standard & Premium`}
          icon={TrendingUp}
          variant="default"
        />
      </div>

      {loadingTenants ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CardSkeleton height="h-80" />
          <CardSkeleton height="h-80" />
        </div>
      ) : total === 0 ? (
        <EmptyState
          title="No Platform Data Available"
          description="Deploy school tenants to begin generating real platform analytics and subscription trends."
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Chart 1: Subscription Tier Distribution */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <PieIcon size={16} className="text-indigo-600" /> Subscription Tier Allocations
                </h3>
                <p className="text-xs text-slate-400">Institutional breakdown by active plan tier</p>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={planData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="count"
                  >
                    {planData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value, name) => [`${value} Institutions`, name]}
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px', border: 'none' }}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36} 
                    iconType="circle"
                    formatter={(value) => <span className="text-xs text-slate-600 font-semibold">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Plan Breakdown Metrics */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center">
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-500">Free</span>
                <p className="text-base font-bold text-slate-800">{freeCount}</p>
              </div>
              <div className="p-2 rounded-lg bg-blue-50/50 border border-blue-100">
                <span className="text-[10px] uppercase font-bold text-blue-600">Standard</span>
                <p className="text-base font-bold text-blue-900">{standardCount}</p>
              </div>
              <div className="p-2 rounded-lg bg-purple-50/50 border border-purple-100">
                <span className="text-[10px] uppercase font-bold text-purple-600">Premium</span>
                <p className="text-base font-bold text-purple-900">{premiumCount}</p>
              </div>
            </div>
          </div>

          {/* Chart 2: Onboarding Timeline (Real Timestamps) */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <BarChart3 size={16} className="text-indigo-600" /> Onboarding Growth Timeline
                </h3>
                <p className="text-xs text-slate-400">Monthly new school deployments</p>
              </div>
            </div>

            {timelineData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-xs text-slate-400">
                Insufficient timestamp records for timeline generation.
              </div>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis 
                      dataKey="period" 
                      tick={{ fontSize: 11, fill: '#64748b' }} 
                      axisLine={{ stroke: '#e2e8f0' }}
                    />
                    <YAxis 
                      allowDecimals={false} 
                      tick={{ fontSize: 11, fill: '#64748b' }} 
                      axisLine={{ stroke: '#e2e8f0' }}
                    />
                    <Tooltip 
                      formatter={(val) => [`${val} Schools Onboarded`, 'Deployments']}
                      contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px', border: 'none' }}
                    />
                    <Bar dataKey="onboarded" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Honest Data Disclaimer */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-500 text-[11px] flex items-start gap-2 leading-relaxed">
              <Info size={15} className="text-slate-400 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Data Honesty Standard:</strong> These visualizations reflect exact records stored in the platform database without artificial trend extrapolation.
              </span>
            </div>
          </div>

        </div>
      )}
    </PageContainer>
  );
};

export default PlatformAnalyticsPage;
