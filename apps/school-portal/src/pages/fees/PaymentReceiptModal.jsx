import React from 'react';
import { Modal, Button, Badge } from '@sms/ui-kit';
import useAuthStore from '@sms/auth';
import { Printer, CheckCircle, Receipt, Building2, Calendar, FileText } from 'lucide-react';

const PaymentReceiptModal = ({ isOpen, onClose, invoice, payment, student }) => {
  const { user } = useAuthStore();

  if (!invoice || !payment) return null;

  const schoolName = user?.tenant?.schoolName || 'School Management System';
  const schoolEmail = user?.tenant?.contactEmail || null;
  const schoolLogo = user?.tenant?.logoUrl || null;

  const studentName = student?.user?.name || student?.name || invoice.student?.user?.name || 'Student';
  const admissionNo = student?.admissionNo || invoice.student?.admissionNo || '—';
  const className = student?.class?.name || student?.className || invoice.student?.class?.name || '—';

  const totalAmount = parseFloat(invoice.totalAmount || 0).toFixed(2);
  const amountPaid = parseFloat(payment.amountPaid || 0).toFixed(2);
  const remainingDue = parseFloat(invoice.dueAmount || 0).toFixed(2);
  const paidDate = payment.paidAt ? new Date(payment.paidAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }) : new Date().toLocaleDateString();

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Official Payment Receipt"
      maxWidth="max-w-2xl"
      footer={
        <div className="flex items-center justify-between w-full no-print">
          <span className="text-xs text-slate-400">
            Click Print to generate a high-resolution paper copy or PDF.
          </span>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button variant="primary" onClick={handlePrint}>
              <Printer size={16} className="mr-2" />
              Print Receipt
            </Button>
          </div>
        </div>
      }
    >
      {/* Scoped Print Styles */}
      <style>{`
        @page {
          size: A4 portrait;
          margin: 15mm;
        }
        @media print {
          body * {
            visibility: hidden !important;
          }
          .receipt-print-area, .receipt-print-area * {
            visibility: visible !important;
          }
          .receipt-print-area {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Printable Receipt Body */}
      <div className="receipt-print-area bg-white text-slate-900 p-6 rounded-xl border border-slate-100 font-sans">
        
        {/* Receipt Header / Letterhead */}
        <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4 mb-6">
          <div className="flex items-center gap-3">
            {schoolLogo ? (
              <img src={schoolLogo} alt={schoolName} className="h-12 w-12 object-contain rounded-lg border border-slate-200" />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-xl shadow-sm">
                <Building2 size={24} />
              </div>
            )}
            <div>
              <h2 className="text-lg font-black tracking-tight text-slate-900 uppercase">{schoolName}</h2>
              <p className="text-xs text-slate-500 font-medium">Official Financial Accounting & Fee Receipt</p>
              {schoolEmail && <p className="text-2xs text-slate-400">{schoolEmail}</p>}
            </div>
          </div>
          <div className="text-right">
            <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-black rounded-full border border-emerald-200 uppercase tracking-wide">
              Payment Confirmed
            </span>
            <p className="text-2xs text-slate-400 font-mono mt-1">Status: {invoice.status}</p>
          </div>
        </div>

        {/* Transaction & Student Details Strip */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100 mb-6 text-xs">
          <div>
            <span className="text-2xs text-slate-400 uppercase tracking-wider font-bold block mb-0.5">Student Details</span>
            <p className="font-bold text-slate-800 text-sm">{studentName}</p>
            <p className="text-slate-600 mt-0.5">Admission No: <span className="font-bold text-slate-900">{admissionNo}</span></p>
            <p className="text-slate-600">Class: <span className="font-bold text-slate-900">{className}</span></p>
          </div>
          <div className="text-right">
            <span className="text-2xs text-slate-400 uppercase tracking-wider font-bold block mb-0.5">Receipt Metadata</span>
            <p className="text-slate-600">Transaction Ref: <span className="font-mono font-bold text-indigo-700">{payment.transactionRef}</span></p>
            <p className="text-slate-600 mt-0.5">Invoice ID: <span className="font-mono text-slate-700">#{invoice.id ? invoice.id.slice(0, 8).toUpperCase() : ''}</span></p>
            <p className="text-slate-600">Date Paid: <span className="font-medium text-slate-900">{paidDate}</span></p>
          </div>
        </div>

        {/* Financial Line Items Table */}
        <div className="border border-slate-200 rounded-xl overflow-hidden mb-6">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-100/75 border-b border-slate-200 text-2xs uppercase tracking-wider font-bold text-slate-600">
              <tr>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3 text-center">Payment Method</th>
                <th className="px-4 py-3 text-right">Invoice Total</th>
                <th className="px-4 py-3 text-right">Amount Paid</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="px-4 py-3.5 font-medium text-slate-800">
                  Tuition & Academic Term Fees
                  <span className="block text-2xs text-slate-400">Academic billing statement settlement</span>
                </td>
                <td className="px-4 py-3.5 text-center">
                  <span className="px-2 py-0.5 text-2xs font-semibold bg-slate-100 text-slate-700 rounded border border-slate-200">
                    {payment.paymentMethod || 'Card'}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-right font-medium text-slate-600">
                  ${totalAmount}
                </td>
                <td className="px-4 py-3.5 text-right font-black text-emerald-600 text-sm">
                  ${amountPaid}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Financial Summary Calculation */}
        <div className="flex justify-end mb-8">
          <div className="w-64 space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100 text-slate-600">
              <span>Invoice Total:</span>
              <span className="font-bold text-slate-800">${totalAmount}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100 text-emerald-700 font-bold">
              <span>Amount Paid (This Txn):</span>
              <span className="text-sm font-black">${amountPaid}</span>
            </div>
            <div className="flex justify-between py-1 pt-1.5 border-b-2 border-slate-900 text-slate-800 font-bold">
              <span>Remaining Balance Due:</span>
              <span className={`font-black ${parseFloat(remainingDue) > 0 ? 'text-rose-600' : 'text-slate-700'}`}>
                ${remainingDue}
              </span>
            </div>
          </div>
        </div>

        {/* Verification & Signatures */}
        <div className="grid grid-cols-2 gap-8 pt-8 border-t border-dashed border-slate-200 text-xs">
          <div>
            <p className="text-2xs text-slate-400 uppercase tracking-wider font-bold mb-1">Payment Verification</p>
            <p className="text-slate-600 text-2xs leading-relaxed">
              This receipt confirms that payment has been successfully recorded in the school management financial ledger.
            </p>
          </div>
          <div className="flex flex-col items-end justify-end">
            <div className="w-48 border-b border-slate-400 pb-1 text-center">
              <span className="text-3xs text-slate-400 uppercase tracking-wider font-bold">Authorized Bursar / Accounts</span>
            </div>
            <p className="text-3xs text-slate-400 mt-1">Official School Seal & Signature</p>
          </div>
        </div>

      </div>
    </Modal>
  );
};

export default PaymentReceiptModal;
