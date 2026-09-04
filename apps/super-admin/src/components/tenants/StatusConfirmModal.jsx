import React from 'react';
import { Modal, Button } from '@sms/ui-kit';
import { AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';

const StatusConfirmModal = ({ isOpen, onClose, tenant, onConfirm, isPending }) => {
  if (!tenant) return null;

  const isSuspending = tenant.status === 'ACTIVE';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isSuspending ? 'Suspend School Tenant' : 'Activate School Tenant'}
      size="md"
    >
      <div className="space-y-4 text-left py-1">
        <div className={`p-4 rounded-xl border flex items-start gap-3.5 ${
          isSuspending 
            ? 'bg-rose-50/70 border-rose-200 text-rose-950' 
            : 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
        }`}>
          {isSuspending ? (
            <ShieldAlert size={22} className="text-rose-600 flex-shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 size={22} className="text-emerald-600 flex-shrink-0 mt-0.5" />
          )}

          <div className="space-y-1 text-xs">
            <h4 className="font-bold text-sm">
              {isSuspending ? 'Confirm Tenant Account Suspension' : 'Confirm Tenant Account Activation'}
            </h4>
            <p className="text-slate-600 leading-relaxed">
              {isSuspending ? (
                <>
                  Are you sure you want to suspend <strong className="text-slate-900">{tenant.schoolName}</strong> (<code className="font-mono text-rose-700">/{tenant.slug}</code>)?
                  <span className="block mt-1 font-medium text-rose-700">
                    Consequence: All administrators, teachers, parents, and students associated with this institution will immediately be blocked from signing in until reactivated.
                  </span>
                </>
              ) : (
                <>
                  Are you sure you want to restore active status for <strong className="text-slate-900">{tenant.schoolName}</strong>?
                  <span className="block mt-1 text-emerald-800">
                    This will immediately restore platform access for all verified users under this institution.
                  </span>
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex justify-end items-center gap-3 pt-3 border-t border-slate-100">
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
            variant={isSuspending ? 'danger' : 'primary'}
            onClick={() => onConfirm(tenant, isSuspending ? 'SUSPENDED' : 'ACTIVE')}
            loading={isPending}
          >
            {isSuspending ? 'Suspend School Deployment' : 'Activate School Deployment'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default StatusConfirmModal;
