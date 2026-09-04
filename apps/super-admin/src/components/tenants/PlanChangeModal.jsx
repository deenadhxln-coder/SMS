import React, { useState, useEffect } from 'react';
import { Modal, Button } from '@sms/ui-kit';
import { CheckCircle2, Shield, Zap, Crown, Check } from 'lucide-react';

const PlanChangeModal = ({ isOpen, onClose, tenant, onSubmit, isPending }) => {
  const [selectedPlan, setSelectedPlan] = useState('FREE');

  useEffect(() => {
    if (tenant) {
      setSelectedPlan(tenant.planType || 'FREE');
    }
  }, [tenant, isOpen]);

  const plans = [
    {
      id: 'FREE',
      name: 'Starter Plan',
      tier: 'FREE',
      icon: Shield,
      color: 'text-slate-600 bg-slate-100 border-slate-200',
      activeColor: 'border-slate-800 ring-2 ring-slate-800/10 bg-slate-50/50',
      description: 'Ideal for evaluation and pilot onboarding.',
      limits: ['Up to 100 students', 'Standard gradebooks', 'Basic audit logging']
    },
    {
      id: 'STANDARD',
      name: 'Growth Plan',
      tier: 'STANDARD',
      icon: Zap,
      color: 'text-blue-600 bg-blue-50 border-blue-200',
      activeColor: 'border-blue-600 ring-2 ring-blue-600/10 bg-blue-50/40',
      description: 'Standard school operations with full academic workflows.',
      limits: ['Up to 500 students', 'Online fee invoicing', 'Parent & Student portals', 'Bulk operations']
    },
    {
      id: 'PREMIUM',
      name: 'Enterprise Plan',
      tier: 'PREMIUM',
      icon: Crown,
      color: 'text-purple-600 bg-purple-50 border-purple-200',
      activeColor: 'border-purple-600 ring-2 ring-purple-600/10 bg-purple-50/40',
      description: 'Uncapped capacity with priority platform features.',
      limits: ['Unlimited students', 'Custom report card exports', 'Priority API limits', 'Extended audit retention']
    }
  ];

  const handleSubmit = () => {
    if (!tenant) return;
    onSubmit({
      id: tenant.id,
      planType: selectedPlan
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Modify Subscription Tier"
      size="md"
    >
      <div className="space-y-4 text-left py-1">
        <p className="text-xs text-slate-600 leading-normal">
          Select the allocation tier for <strong className="font-semibold text-slate-900">{tenant?.schoolName}</strong> (slug: <code className="text-indigo-600 bg-indigo-50 px-1 py-0.5 rounded text-[11px]">{tenant?.slug}</code>).
        </p>

        <div className="space-y-3">
          {plans.map((p) => {
            const Icon = p.icon;
            const isSelected = selectedPlan === p.tier;
            const isCurrent = tenant?.planType === p.tier;

            return (
              <div
                key={p.id}
                onClick={() => setSelectedPlan(p.tier)}
                className={`p-4 rounded-xl border transition-all cursor-pointer text-left ${
                  isSelected ? p.activeColor : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg ${p.color} flex items-center justify-center flex-shrink-0 border`}>
                      <Icon size={16} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">{p.name}</span>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                          {p.tier}
                        </span>
                        {isCurrent && (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                            Current
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{p.description}</p>
                    </div>
                  </div>

                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors ${
                    isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 bg-white'
                  }`}>
                    {isSelected && <Check size={12} strokeWidth={3} />}
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500">
                  {p.limits.map((l, i) => (
                    <span key={i} className="flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-slate-400"></span>
                      {l}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-end items-center gap-3 pt-4 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleSubmit}
            loading={isPending}
            disabled={selectedPlan === tenant?.planType}
          >
            Apply Plan Migration
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default PlanChangeModal;
