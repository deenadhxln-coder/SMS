import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@sms/api-client';
import { Button, Badge } from '@sms/ui-kit';
import { 
  CreditCard, 
  ShieldCheck, 
  Crown, 
  Zap, 
  Shield, 
  Users, 
  GraduationCap, 
  RefreshCw, 
  ExternalLink, 
  Receipt, 
  Check, 
  AlertCircle,
  Clock
} from 'lucide-react';

const BillingTab = () => {
  const queryClient = useQueryClient();
  const [isProcessingUpgrade, setIsProcessingUpgrade] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['billing', 'subscription'],
    queryFn: async () => {
      const res = await api.get('/billing/subscription');
      return res.data;
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/billing/cancel');
      return res.data;
    },
    onSuccess: (resData) => {
      setFeedbackMsg({ type: 'success', text: resData.message || 'Subscription cancelled successfully.' });
      queryClient.invalidateQueries({ queryKey: ['billing', 'subscription'] });
    },
    onError: (err) => {
      setFeedbackMsg({ type: 'error', text: err.userMessage || 'Failed to cancel subscription.' });
    }
  });

  const handleUpgrade = async (targetPlan) => {
    setIsProcessingUpgrade(true);
    setFeedbackMsg(null);
    try {
      const res = await api.post('/billing/create-subscription', { planType: targetPlan });
      const { subscriptionId, orderId, shortUrl, keyId, amount, currency } = res.data;

      // If Razorpay standard checkout script is available or short_url is provided
      if (window.Razorpay && keyId) {
        const isOrder = orderId && orderId.startsWith('order_');
        const options = {
          key: keyId,
          ...(isOrder ? { order_id: orderId, amount: amount ? Math.round(amount * 100) : undefined } : { subscription_id: subscriptionId }),
          currency: currency || 'INR',
          name: 'SMS Multi-Tenant Platform',
          description: `Upgrade to ${targetPlan} Plan`,
          handler: function (response) {
            setFeedbackMsg({
              type: 'info',
              text: 'Payment received! Webhook is synchronizing your plan. Refreshing state...'
            });
            setTimeout(() => {
              refetch();
            }, 2000);
          },
          theme: {
            color: '#4f46e5'
          }
        };
        const rzp = new window.Razorpay(options);
        rzp.open();
      } else if (shortUrl) {
        // Open hosted checkout link
        window.open(shortUrl, '_blank', 'noopener,noreferrer');
        setFeedbackMsg({
          type: 'info',
          text: `Checkout opened in a new window (Subscription ID: ${subscriptionId}). Complete payment and click "Refresh Plan".`
        });
      } else {
        setFeedbackMsg({
          type: 'success',
          text: `Razorpay Test Subscription generated (${subscriptionId}). In test mode, webhook will synchronize state upon payment.`
        });
      }
    } catch (err) {
      setFeedbackMsg({
        type: 'error',
        text: err.userMessage || 'Failed to initialize subscription checkout. Please try again.'
      });
    } finally {
      setIsProcessingUpgrade(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center text-xs text-slate-400">
        <RefreshCw size={20} className="animate-spin mx-auto mb-2 text-indigo-600" />
        <span>Loading subscription & quota details...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
        <p className="font-bold">Failed to load billing information</p>
        <p className="mt-1">Please verify your internet connection or reload the page.</p>
        <Button variant="outline" onClick={() => refetch()} className="mt-3 !py-1 !px-2.5 !text-xs">
          Retry
        </Button>
      </div>
    );
  }

  const currentPlan = data?.tenant?.planType || 'FREE';
  const usage = data?.usage || { students: { current: 0, limit: 10, percentage: 0 }, teachers: { current: 0, limit: 5, percentage: 0 } };
  const payments = data?.payments || [];
  const subscription = data?.subscription;

  const planTiers = [
    {
      id: 'FREE',
      name: 'Starter Evaluation',
      tier: 'FREE',
      price: '₹0',
      period: 'forever',
      icon: Shield,
      color: 'border-slate-200 bg-white',
      badgeColor: 'bg-slate-100 text-slate-700',
      features: ['Up to 100 Students', 'Up to 20 Teachers', 'Standard gradebooks', 'Parent & Student portal access'],
      isCurrent: currentPlan === 'FREE',
    },
    {
      id: 'STANDARD',
      name: 'Growth School',
      tier: 'STANDARD',
      price: '₹99',
      period: '/ month',
      icon: Zap,
      color: 'border-indigo-200 bg-indigo-50/20 ring-1 ring-indigo-500/20',
      badgeColor: 'bg-indigo-100 text-indigo-700',
      features: ['Up to 500 Students', 'Up to 50 Teachers', 'Advanced fee invoicing & receipts', 'Priority API limits', 'Bulk student onboarding'],
      isCurrent: currentPlan === 'STANDARD',
    },
    {
      id: 'PREMIUM',
      name: 'Enterprise Scale',
      tier: 'PREMIUM',
      price: '₹299',
      period: '/ month',
      icon: Crown,
      color: 'border-purple-200 bg-purple-50/20 ring-1 ring-purple-500/20',
      badgeColor: 'bg-purple-100 text-purple-700',
      features: ['Unlimited Students', 'Unlimited Teachers', 'Custom report card exports', 'Dedicated platform SLA', 'Audit log retention'],
      isCurrent: currentPlan === 'PREMIUM',
    }
  ];

  return (
    <div className="space-y-6 text-left animate-fade-in">
      {/* Alert banner */}
      {feedbackMsg && (
        <div className={`p-4 rounded-xl text-xs flex items-start gap-2.5 border ${
          feedbackMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
          feedbackMsg.type === 'error' ? 'bg-rose-50 text-rose-800 border-rose-200' :
          'bg-indigo-50 text-indigo-800 border-indigo-200'
        }`}>
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
          <div className="flex-1">{feedbackMsg.text}</div>
          <button onClick={() => setFeedbackMsg(null)} className="text-slate-400 hover:text-slate-600">×</button>
        </div>
      )}

      {/* Section 1: Current Plan & Quota Usage */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Institutional Plan</span>
            <div className="flex items-center gap-2 mt-0.5">
              <h3 className="text-lg font-black text-slate-900">{data?.tenant?.schoolName}</h3>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
                {currentPlan} Tier
              </span>
              {subscription?.status && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  subscription.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }`}>
                  {subscription.status}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => refetch()}
              loading={isFetching}
              className="!py-1.5 !px-3 !text-xs font-semibold text-slate-700 border-slate-200"
            >
              <RefreshCw size={13} className={isFetching ? 'animate-spin' : ''} />
              <span className="ml-1.5">Refresh Plan</span>
            </Button>
            {currentPlan !== 'FREE' && (
              <Button
                variant="outline"
                onClick={() => {
                  if (window.confirm('Are you sure you want to cancel your paid subscription? Your plan will downgrade to Starter (FREE) tier.')) {
                    cancelMutation.mutate();
                  }
                }}
                loading={cancelMutation.isPending}
                className="!py-1.5 !px-3 !text-xs font-semibold text-rose-600 hover:bg-rose-50 border-rose-200"
              >
                Cancel Subscription
              </Button>
            )}
          </div>
        </div>

        {/* Quota Progress Bars */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <GraduationCap size={15} className="text-indigo-600" /> Active Students Quota
              </span>
              <span className="font-mono font-bold text-slate-900">
                {usage.students.current} / {usage.students.limit >= 999999 ? 'Unlimited' : usage.students.limit}
              </span>
            </div>
            {usage.students.limit < 999999 && (
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    usage.students.percentage >= 90 ? 'bg-rose-500' :
                    usage.students.percentage >= 75 ? 'bg-amber-500' :
                    'bg-indigo-600'
                  }`}
                  style={{ width: `${Math.min(usage.students.percentage, 100)}%` }}
                />
              </div>
            )}
            <p className="text-[10px] text-slate-400">Enforced on student profile creation by backend quota guard.</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Users size={15} className="text-indigo-600" /> Active Teachers Quota
              </span>
              <span className="font-mono font-bold text-slate-900">
                {usage.teachers.current} / {usage.teachers.limit >= 999999 ? 'Unlimited' : usage.teachers.limit}
              </span>
            </div>
            {usage.teachers.limit < 999999 && (
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    usage.teachers.percentage >= 90 ? 'bg-rose-500' :
                    usage.teachers.percentage >= 75 ? 'bg-amber-500' :
                    'bg-indigo-600'
                  }`}
                  style={{ width: `${Math.min(usage.teachers.percentage, 100)}%` }}
                />
              </div>
            )}
            <p className="text-[10px] text-slate-400">Enforced on faculty creation by backend quota guard.</p>
          </div>
        </div>
      </div>

      {/* Section 2: Upgrade Plans Selection */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-6">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <CreditCard size={18} className="text-indigo-600" />
            <span>Subscription Tier Options</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Upgrade your school capacity instantly. Powered by Razorpay secure recurring billing.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {planTiers.map((p) => {
            const Icon = p.icon;
            return (
              <div 
                key={p.id}
                className={`p-5 rounded-2xl border flex flex-col justify-between ${p.color}`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-xs">
                      <Icon size={18} className="text-indigo-600" />
                    </div>
                    {p.isCurrent && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                        Current Plan
                      </span>
                    )}
                  </div>

                  <div>
                    <h4 className="font-bold text-sm text-slate-900">{p.name}</h4>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-2xl font-black text-slate-900 font-mono">{p.price}</span>
                      <span className="text-xs text-slate-400 font-medium">{p.period}</span>
                    </div>
                  </div>

                  <ul className="space-y-2 text-xs text-slate-600 pt-2 border-t border-slate-100">
                    {p.features.map((feat, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check size={14} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100">
                  {p.isCurrent ? (
                    <Button
                      variant="outline"
                      disabled
                      className="w-full justify-center !py-2 !text-xs font-semibold"
                    >
                      Active Plan
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      onClick={() => handleUpgrade(p.tier)}
                      loading={isProcessingUpgrade}
                      className="w-full justify-center !py-2 !text-xs font-bold"
                    >
                      Upgrade to {p.tier}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 3: Platform Payment Receipts */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Receipt size={16} className="text-indigo-600" />
            <span>DHXLN Platform Billing History</span>
          </h3>
          <span className="text-[11px] text-slate-400">{payments.length} invoices recorded</span>
        </div>

        {payments.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-slate-100">
            No platform subscription payments recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3">Transaction ID</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Payment Method</th>
                  <th className="px-4 py-3 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((pay) => (
                  <tr key={pay.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-mono font-medium text-slate-700">
                      {pay.gatewayPaymentId}
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">
                      ₹{parseFloat(pay.amount).toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        pay.status === 'SUCCEEDED' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                      }`}>
                        {pay.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 uppercase text-slate-500">
                      {pay.paymentMethod || 'Online'}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-400 font-mono text-[11px]">
                      {pay.paidAt ? new Date(pay.paidAt).toLocaleDateString() : new Date(pay.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default BillingTab;
