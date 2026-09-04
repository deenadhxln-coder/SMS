import React from 'react';
import Modal from './Modal';
import Button from './Button';
import { AlertTriangle, Info } from 'lucide-react';

const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  description = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'danger', // 'danger' | 'primary'
  loading = false,
  dark = false,
  icon = null
}) => {
  const defaultIcon = confirmVariant === 'danger' ? (
    <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center flex-shrink-0">
      <AlertTriangle size={20} />
    </div>
  ) : (
    <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
      <Info size={20} />
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      dark={dark}
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            variant={confirmVariant}
            onClick={onConfirm}
            loading={loading}
          >
            {confirmText}
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-4 text-left">
        {icon || defaultIcon}
        <div className="space-y-1">
          <p className="text-sm font-semibold text-slate-800 leading-snug">
            {description}
          </p>
          <p className="text-xs text-slate-400 leading-relaxed">
            This action will take effect immediately upon confirmation.
          </p>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmModal;
