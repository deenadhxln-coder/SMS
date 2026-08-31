import React, { useEffect, useState } from 'react';
import useAuthStore from '@sms/auth';
import api from '@sms/api-client';
import PageContainer from '../../components/layout/PageContainer';
import { 
  Users, GraduationCap, Bookmark, Coins, Plus, Globe,
  Activity, ArrowUpRight, AlertTriangle, CheckCircle, ShieldAlert,
  Building, DollarSign, Ban, RefreshCw
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
  const { user } = useAuthStore();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Super Admin Specific State
  const [tenants, setTenants] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    schoolName: '',
    slug: '',
    logoUrl: '',
    planType: 'FREE',
    adminName: '',
    adminEmail: '',
    adminPassword: ''
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setLoading(true);
        if (user.role === 'Super Admin') {
          const res = await api.get('/superadmin/tenants');
          setTenants(res.data.tenants);
        } else if (['School Admin', 'Teacher'].includes(user.role)) {
          const res = await api.get('/dashboard/summary');
          setData(res.data.summary);
        } else {
          setData({
            totalStudents: 1,
            totalClasses: 1,
            totalPaid: 500,
            totalDue: 1000,
            recentActivity: []
          });
        }
      } catch (err) {
        console.error('Failed to fetch dashboard summary:', err);
        setError('Could not load dashboard statistics.');
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, [user]);

  const handleOnboard = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setFormError('');
      setFormSuccess('');
      const res = await api.post('/superadmin/tenants', formData);
      setFormSuccess(res.data.message);
      
      // Refresh tenants list
      const updated = await api.get('/superadmin/tenants');
      setTenants(updated.data.tenants);
      
      // Reset form
      setFormData({
        schoolName: '',
        slug: '',
        logoUrl: '',
        planType: 'FREE',
        adminName: '',
        adminEmail: '',
        adminPassword: ''
      });
      setTimeout(() => {
        setShowModal(false);
        setFormSuccess('');
      }, 1500);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to onboard school tenant.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateTenant = async (id, updates) => {
    try {
      await api.put(`/superadmin/tenants/${id}`, updates);
      const res = await api.get('/superadmin/tenants');
      setTenants(res.data.tenants);
    } catch (err) {
      alert('Failed to update tenant: ' + (err.response?.data?.message || err.message));
    }
  };

  const getGrowthData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const curMonth = new Date().getMonth();
    const chartData = [];
    
    for (let i = 5; i >= 0; i--) {
      const targetMonthIndex = (curMonth - i + 12) % 12;
      const monthName = months[targetMonthIndex];
      
      const registeredCount = tenants.filter(t => {
        const date = new Date(t.createdAt);
        return date.getMonth() <= targetMonthIndex || date.getFullYear() < new Date().getFullYear();
      }).length;

      const revenue = tenants.filter(t => {
        const date = new Date(t.createdAt);
        return date.getMonth() <= targetMonthIndex || date.getFullYear() < new Date().getFullYear();
      }).reduce((sum, t) => sum + (t.planType === 'PREMIUM' ? 299 : t.planType === 'STANDARD' ? 99 : 0), 0);

      chartData.push({
        month: monthName,
        schools: registeredCount,
        revenue: revenue
      });
    }
    return chartData;
  };

  if (loading) {
    return (
      <div className="p-8 flex justify-center items-center h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-slate-400 text-sm font-medium">Assembling statistics...</span>
        </div>
      </div>
    );
  }

  // --- Render Super Admin Dashboard ---
  if (user.role === 'Super Admin') {
    const totalTenants = tenants.length;
    const premiumCount = tenants.filter(t => t.planType === 'PREMIUM').length;
    const standardCount = tenants.filter(t => t.planType === 'STANDARD').length;
    const suspendedCount = tenants.filter(t => t.status === 'SUSPENDED').length;

    return (
      <PageContainer 
        title="Super Admin Control Panel" 
        description="Global SaaS subscription monitoring and tenant onboarding center"
      >
        {/* SaaS Dashboard KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-center gap-5 hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Building size={24} />
            </div>
            <div>
              <p className="text-2xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Total Onboarded Schools</p>
              <h3 className="text-xl font-black text-slate-800 leading-none">{totalTenants}</h3>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-center gap-5 hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Coins size={24} />
            </div>
            <div>
              <p className="text-2xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Premium Schools</p>
              <h3 className="text-xl font-black text-slate-800 leading-none">{premiumCount}</h3>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-center gap-5 hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Globe size={24} />
            </div>
            <div>
              <p className="text-2xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Standard Schools</p>
              <h3 className="text-xl font-black text-slate-800 leading-none">{standardCount}</h3>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-center gap-5 hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Ban size={24} />
            </div>
            <div>
              <p className="text-2xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Suspended Schools</p>
              <h3 className="text-xl font-black text-slate-800 leading-none">{suspendedCount}</h3>
            </div>
          </div>

        </div>

        {/* SaaS Growth & MRR Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          
          {/* Revenue & Growth Trend Chart */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-sm font-bold text-slate-800 font-sans">Monthly Recurring Revenue & Growth</h3>
                <p className="text-3xs text-slate-400">Platform subscription earnings and onboarding velocity</p>
              </div>
              <div className="flex items-center gap-4 text-3xs font-semibold">
                <span className="flex items-center gap-1.5 text-indigo-600">
                  <span className="w-2 h-2 rounded-full bg-indigo-600"></span> MRR ($)
                </span>
                <span className="flex items-center gap-1.5 text-blue-500">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span> Schools Onboarded
                </span>
              </div>
            </div>
            
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={getGrowthData()}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorSchools" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis yAxisId="left" stroke="#4f46e5" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="right" orientation="right" stroke="#3b82f6" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '11px' }}
                    labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
                  />
                  <Area yAxisId="left" type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" name="MRR ($)" />
                  <Area yAxisId="right" type="monotone" dataKey="schools" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSchools)" name="Onboarded Schools" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* SaaS Business Analytics Metrics Panel */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800 mb-1">Platform Vital Signs</h3>
              <p className="text-3xs text-slate-400 mb-6">Real-time SaaS billing metrics and subscription health</p>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3.5 bg-slate-50/50 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse"></span>
                    <span className="text-xs font-semibold text-slate-600">Projected MRR</span>
                  </div>
                  <span className="text-sm font-black text-slate-800">
                    ${tenants.reduce((acc, t) => acc + (t.planType === 'PREMIUM' ? 299 : t.planType === 'STANDARD' ? 99 : 0), 0)}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3.5 bg-slate-50/50 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    <span className="text-xs font-semibold text-slate-600">Projected ARR</span>
                  </div>
                  <span className="text-sm font-black text-slate-800">
                    ${tenants.reduce((acc, t) => acc + (t.planType === 'PREMIUM' ? 299 : t.planType === 'STANDARD' ? 99 : 0), 0) * 12}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3.5 bg-slate-50/50 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                    <span className="text-xs font-semibold text-slate-600">Plan Conversion</span>
                  </div>
                  <span className="text-xs font-black text-slate-800">
                    {tenants.length > 0 ? ((tenants.filter(t => t.planType !== 'FREE').length / tenants.length) * 100).toFixed(0) : 0}% Paid
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-between text-3xs font-semibold text-slate-400">
              <span className="flex items-center gap-1.5"><Activity size={12} className="text-green-500" /> Platform Active</span>
              <span>Updated live</span>
            </div>
          </div>

        </div>

        {/* School Directory Table */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-sm font-bold text-slate-800">School Directory</h3>
              <p className="text-2xs text-slate-400">Manage school tenants and allocate subscription plans</p>
            </div>
            <button 
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-600/10"
            >
              <Plus size={16} />
              <span>Onboard School</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-50 text-2xs font-bold text-slate-400 uppercase bg-slate-50/50">
                  <th className="py-3 px-4 rounded-l-xl">School Details</th>
                  <th className="py-3 px-4">URL Slug</th>
                  <th className="py-3 px-4">Plan Allocation</th>
                  <th className="py-3 px-4">System Status</th>
                  <th className="py-3 px-4">Onboarded</th>
                  <th className="py-3 px-4 rounded-r-xl text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-xs divide-y divide-slate-50">
                {tenants.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                      No schools onboarded. Click 'Onboard School' to start.
                    </td>
                  </tr>
                ) : (
                  tenants.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/30 transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          {t.logoUrl ? (
                            <img src={t.logoUrl} alt="Logo" className="w-8 h-8 object-contain rounded bg-slate-50 p-1" />
                          ) : (
                            <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-slate-400 font-bold">
                              {t.schoolName.slice(0,2).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-slate-800">{t.schoolName}</p>
                            <p className="text-3xs text-slate-400 font-semibold">{t.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-3xs font-semibold">
                          /{t.slug}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <select 
                          value={t.planType} 
                          onChange={(e) => handleUpdateTenant(t.id, { planType: e.target.value })}
                          className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-2xs font-semibold text-slate-700"
                        >
                          <option value="FREE">Free Tier (10 students)</option>
                          <option value="STANDARD">Standard Tier (100 students)</option>
                          <option value="PREMIUM">Premium Tier (Unlimited)</option>
                        </select>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-3xs font-black uppercase tracking-wider ${
                          t.status === 'ACTIVE' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                        }`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 font-semibold text-slate-500">
                        {new Date(t.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <button 
                          onClick={() => handleUpdateTenant(t.id, { status: t.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE' })}
                          className={`text-2xs font-bold px-3 py-1.5 rounded-lg transition-colors ${
                            t.status === 'ACTIVE' 
                              ? 'bg-rose-50 text-rose-600 hover:bg-rose-100' 
                              : 'bg-green-50 text-green-600 hover:bg-green-100'
                          }`}
                        >
                          {t.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Onboarding Wizard Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden border border-slate-100 animate-slide-up">
              
              <div className="px-6 py-5 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Onboard New School</h3>
                  <p className="text-3xs text-slate-400">Register new school tenant and create admin credentials</p>
                </div>
                <button 
                  onClick={() => setShowModal(false)}
                  className="text-slate-400 hover:text-slate-600 text-xs font-semibold px-2 py-1 hover:bg-slate-200/50 rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>

              <form onSubmit={handleOnboard} className="p-6 space-y-6">
                {formError && (
                  <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-3xs font-semibold text-rose-500">
                    {formError}
                  </div>
                )}
                {formSuccess && (
                  <div className="p-3 bg-green-50 border border-green-100 rounded-xl text-3xs font-semibold text-green-500">
                    {formSuccess}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-3xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">School Name</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Springfield High"
                      value={formData.schoolName}
                      onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-xs text-slate-700 outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-3xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">URL Slug</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. springfield"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-xs text-slate-700 outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-3xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Logo URL (Optional)</label>
                    <input 
                      type="url" 
                      placeholder="https://..."
                      value={formData.logoUrl}
                      onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-xs text-slate-700 outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-3xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Subscription Tier</label>
                    <select 
                      value={formData.planType}
                      onChange={(e) => setFormData({ ...formData, planType: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-xs text-slate-700 outline-none focus:border-indigo-500 transition-colors"
                    >
                      <option value="FREE">Free Tier (10 students)</option>
                      <option value="STANDARD">Standard Tier (100 students)</option>
                      <option value="PREMIUM">Premium Tier (Unlimited)</option>
                    </select>
                  </div>
                </div>

                <div className="border-t border-slate-100/80 pt-5">
                  <h4 className="text-3xs font-black uppercase tracking-wider text-indigo-500 mb-3">School Admin Details</h4>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-3xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Admin Full Name</label>
                      <input 
                        type="text" 
                        required
                        placeholder="Admin Name"
                        value={formData.adminName}
                        onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-xs text-slate-700 outline-none focus:border-indigo-500 transition-colors"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-3xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Admin Email Address</label>
                        <input 
                          type="email" 
                          required
                          placeholder="admin@school.com"
                          value={formData.adminEmail}
                          onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-xs text-slate-700 outline-none focus:border-indigo-500 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-3xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Admin Password</label>
                        <input 
                          type="password" 
                          required
                          placeholder="••••••••"
                          value={formData.adminPassword}
                          onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-xs text-slate-700 outline-none focus:border-indigo-500 transition-colors"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-3">
                  <button 
                    type="button" 
                    onClick={() => setShowModal(false)}
                    className="bg-slate-100 hover:bg-slate-200/80 text-slate-600 text-xs font-semibold px-4 py-2.5 rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={saving}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-6 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-600/10 disabled:opacity-50"
                  >
                    {saving ? 'Registering School...' : 'Provision Tenant'}
                  </button>
                </div>
              </form>

            </div>
          </div>
        )}
      </PageContainer>
    );
  }

  // --- Render School Admin/Teacher/Student Dashboard ---
  const chartData = [
    { name: 'Term 1', Collected: parseFloat(data?.totalPaid || 0) * 0.3, Dues: parseFloat(data?.totalDue || 0) * 0.3 },
    { name: 'Term 2', Collected: parseFloat(data?.totalPaid || 0) * 0.6, Dues: parseFloat(data?.totalDue || 0) * 0.6 },
    { name: 'Term 3', Collected: parseFloat(data?.totalPaid || 0), Dues: parseFloat(data?.totalDue || 0) }
  ];

  const isAdmin = ['School Admin'].includes(user.role);

  return (
    <PageContainer 
      title={`${user.role} Dashboard`} 
      description={`School operations center as of ${new Date().toLocaleDateString()}`}
    >
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-xs font-semibold text-red-400">
          {error}
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        
        {/* KPI: Students */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-center gap-5 hover:shadow-md transition-all">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users size={24} />
          </div>
          <div>
            <p className="text-2xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Total Students</p>
            <h3 className="text-xl font-black text-slate-800 leading-none">{data?.totalStudents || 0}</h3>
          </div>
        </div>

        {/* KPI: Teachers */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-center gap-5 hover:shadow-md transition-all">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <GraduationCap size={24} />
          </div>
          <div>
            <p className="text-2xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Active Faculty</p>
            <h3 className="text-xl font-black text-slate-800 leading-none">{data?.totalTeachers || 0}</h3>
          </div>
        </div>

        {/* KPI: Financial / Class */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-center gap-5 hover:shadow-md transition-all">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            {isAdmin ? <Coins size={24} /> : <Bookmark size={24} />}
          </div>
          <div>
            <p className="text-2xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              {isAdmin ? 'Total Collected' : 'Assigned Classes'}
            </p>
            <h3 className="text-xl font-black text-slate-800 leading-none">
              {isAdmin ? `$${parseFloat(data?.totalPaid || 0).toLocaleString()}` : data?.totalClasses || 0}
            </h3>
          </div>
        </div>

        {/* KPI: Dues Progress */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-center gap-5 hover:shadow-md transition-all">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <AlertTriangle size={24} />
          </div>
          <div>
            <p className="text-2xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Outstanding Dues</p>
            <h3 className="text-xl font-black text-slate-800 leading-none">
              ${parseFloat(data?.totalDue || 0).toLocaleString()}
            </h3>
          </div>
        </div>

      </div>

      {/* Main Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Analytics Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-6">Financial Billing & Collected Collections</h3>
          <div className="h-72 w-full">
            {isAdmin ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCollected" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorDues" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #f1f5f9' }} />
                  <Area type="monotone" dataKey="Collected" stroke="#4f46e5" fillOpacity={1} fill="url(#colorCollected)" strokeWidth={2} />
                  <Area type="monotone" dataKey="Dues" stroke="#f43f5e" fillOpacity={1} fill="url(#colorDues)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400 font-medium">
                Academic progress metrics are available on report cards.
              </div>
            )}
          </div>
        </div>

        {/* Recent Audit */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex flex-col">
          <h3 className="text-sm font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Activity size={18} className="text-indigo-600 animate-pulse" />
            <span>Recent Activities Log</span>
          </h3>

          <div className="flex-1 overflow-y-auto space-y-4 pr-1 max-h-72">
            {!data?.recentActivity || data.recentActivity.length === 0 ? (
              <div className="text-center text-xs text-slate-400 py-12 font-medium">
                No recent activity logged.
              </div>
            ) : (
              data.recentActivity.map((log) => (
                <div key={log.id} className="flex gap-3 items-start text-xs border-b border-slate-50 pb-3">
                  <div className="p-1 rounded bg-slate-100 text-slate-600 mt-0.5">
                    <ArrowUpRight size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-700 truncate">
                      {log.action} on {log.entity}
                    </p>
                    <p className="text-2xs text-slate-400 font-semibold truncate">
                      By {log.user?.name || 'System'}
                    </p>
                  </div>
                  <span className="text-3xs text-slate-400 font-bold">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </PageContainer>
  );
};

export default Dashboard;
