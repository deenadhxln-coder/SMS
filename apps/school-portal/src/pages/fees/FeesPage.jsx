import { Button, Modal, Input } from '@sms/ui-kit';
import React, { useEffect, useState } from 'react';
import api from '@sms/api-client';
import useAuthStore from '@sms/auth';
import PageContainer from '../../components/layout/PageContainer';
import { exportToCSV } from '../../utils/csvExport';

import { CreditCard, Receipt, Plus, CheckCircle, AlertCircle, Download, Printer } from 'lucide-react';
import PaymentReceiptModal from './PaymentReceiptModal';

const FeesPage = () => {
  const { user } = useAuthStore();
  const isAdmin = user.role === 'School Admin';
  const isParent = user.role === 'Parent';

  // States
  const [invoices, setInvoices] = useState([]);
  const [structures, setStructures] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal Control
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [isStructModalOpen, setIsStructModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [selectedReceipt, setSelectedReceipt] = useState({ invoice: null, payment: null });

  const handleOpenReceipt = (invoice, payment = null) => {
    const targetPayment = payment || (invoice.payments && invoice.payments.length > 0 ? invoice.payments[0] : null);
    if (!targetPayment) return;
    setSelectedReceipt({ invoice, payment: targetPayment });
    setIsReceiptModalOpen(true);
  };

  // Form states
  const [payForm, setPayForm] = useState({ amountPaid: '', paymentMethod: 'Card' });
  const [structForm, setStructForm] = useState({ classId: '', title: '', amount: '', academicYearId: '2026-2027' });
  const [classes, setClasses] = useState([]);
  
  const [message, setMessage] = useState({ type: '', text: '' });
  const [modalError, setModalError] = useState('');

  const fetchFeesData = async () => {
    try {
      setLoading(true);
      const invRes = await api.get('/fees/invoices');
      setInvoices(invRes.data.invoices);

      if (isAdmin) {
        const strRes = await api.get('/fees/structures');
        setStructures(strRes.data.structures);

        const clsRes = await api.get('/academics/classes');
        setClasses(clsRes.data.classes);
      }
    } catch (err) {
      console.error('Failed to load fees data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeesData();
  }, [user]);

  const handleOpenPayModal = (invoice) => {
    setSelectedInvoice(invoice);
    setPayForm({ amountPaid: parseFloat(invoice.dueAmount).toFixed(2), paymentMethod: 'Card' });
    setModalError('');
    setIsPayModalOpen(true);
  };

  const handleExecutePayment = async () => {
    setModalError('');
    const amt = parseFloat(payForm.amountPaid);
    if (isNaN(amt) || amt <= 0) {
      setModalError('Please enter a valid payment amount.');
      return;
    }

    if (amt > parseFloat(selectedInvoice.dueAmount)) {
      setModalError(`Payment cannot exceed outstanding balance of $${selectedInvoice.dueAmount}`);
      return;
    }

    try {
      await api.post(`/fees/invoices/${selectedInvoice.id}/payments`, payForm);
      setIsPayModalOpen(false);
      fetchFeesData();
      setMessage({ type: 'success', text: `Payment of $${amt} processed successfully. Check notifications for your receipt.` });
    } catch (err) {
      setModalError(err.response?.data?.message || 'Failed to record payment');
    }
  };

  const handleCreateStructure = async () => {
    setModalError('');
    try {
      await api.post('/fees/structures', structForm);
      setIsStructModalOpen(false);
      fetchFeesData();
      setMessage({ type: 'success', text: 'New fee structure created successfully' });
    } catch (err) {
      setModalError(err.response?.data?.message || 'Failed to create fee structure');
    }
  };

  const handleExportCSV = () => {
    const columns = [
      { label: 'Invoice ID', accessor: (row) => row.id },
      { label: 'Student Name', accessor: (row) => row.student?.user?.name || 'Student' },
      { label: 'Admission No', accessor: (row) => row.student?.admissionNo || '' },
      { label: 'Total Amount', accessor: (row) => parseFloat(row.totalAmount || 0).toFixed(2) },
      { label: 'Paid Amount', accessor: (row) => parseFloat(row.paidAmount || 0).toFixed(2) },
      { label: 'Due Amount', accessor: (row) => parseFloat(row.dueAmount || 0).toFixed(2) },
      { label: 'Status', key: 'status' }
    ];
    exportToCSV(invoices, columns, 'tuition_invoices_ledger');
  };

  return (
    <PageContainer
      title="Fees & Accounts"
      description={isAdmin ? "Configure fee schedules and monitor outstanding student collections" : "Track pending invoices and view payments histories"}
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleExportCSV}
            disabled={!invoices.length}
          >
            <Download size={16} className="mr-2" /> Export CSV
          </Button>
          {isAdmin && (
            <Button variant="primary" onClick={() => setIsStructModalOpen(true)}>
              <Plus size={16} className="mr-2" /> Create Fee Structure
            </Button>
          )}
        </div>
      }
    >
      {message.text && (
        <div className="mb-6 p-4 rounded-xl text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
          {message.text}
        </div>
      )}

      {loading ? (
        <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-slate-400 text-sm font-medium">Assembling account balances...</span>
        </div>
      ) : (
        <div className="space-y-8 animate-fade-in">
          
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-50 bg-slate-50/20">
              <h3 className="text-sm font-bold text-slate-800">Pending & Paid Student Invoices</h3>
            </div>
            
            {invoices.length === 0 ? (
              <div className="py-20 text-center text-slate-400 font-medium">
                No billing statements or invoices found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-semibold text-slate-600 border-collapse">
                  <thead className="bg-slate-50 text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-4">Student</th>
                      <th className="px-6 py-4">Admission</th>
                      <th className="px-6 py-4">Total Amount</th>
                      <th className="px-6 py-4">Paid Amount</th>
                      <th className="px-6 py-4">Pending Due</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {invoices.map(inv => (
                      <tr key={inv.id} className="hover:bg-slate-50/50">
                        <td className="px-6 py-4 font-bold">{inv.student?.user?.name}</td>
                        <td className="px-6 py-4 text-indigo-600 font-bold">{inv.student?.admissionNo}</td>
                        <td className="px-6 py-4">${parseFloat(inv.totalAmount).toLocaleString()}</td>
                        <td className="px-6 py-4 text-green-600 font-bold">${parseFloat(inv.paidAmount).toLocaleString()}</td>
                        <td className="px-6 py-4 text-rose-600 font-bold">${parseFloat(inv.dueAmount).toLocaleString()}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 text-3xs font-extrabold rounded-full ${
                            inv.status === 'PAID'
                              ? 'bg-green-50 text-green-700'
                              : inv.status === 'PARTIAL'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-red-50 text-red-700'
                          }`}>
                            {inv.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {inv.payments && inv.payments.length > 0 && (
                              <Button 
                                variant="outline" 
                                onClick={() => handleOpenReceipt(inv)} 
                                className="px-2.5 py-1.5 text-2xs" 
                                icon={<Printer size={14} />}
                              >
                                Receipt
                              </Button>
                            )}
                            {inv.status !== 'PAID' && (isAdmin || isParent) ? (
                              <Button variant="outline" onClick={() => handleOpenPayModal(inv)} className="px-2.5 py-1.5 text-2xs" icon={<CreditCard size={14} />}>
                                Pay Invoice
                              </Button>
                            ) : (!inv.payments || inv.payments.length === 0) ? (
                              <span className="text-2xs text-slate-400 font-bold">Processed</span>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {isAdmin && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-50 bg-slate-50/20">
                <h3 className="text-sm font-bold text-slate-800">Fee Standard Configuration Rates</h3>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {structures.length === 0 ? (
                  <div className="col-span-full text-center text-xs text-slate-400 font-medium py-8">
                    No classes fee standard defined yet.
                  </div>
                ) : (
                  structures.map(str => (
                    <div key={str.id} className="p-5 border border-slate-100 rounded-xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-slate-800 mb-1">{str.title}</h4>
                        <p className="text-3xs text-slate-400 font-bold">AY: {str.academicYearId}</p>
                      </div>
                      <div className="mt-4 flex items-baseline justify-between border-t border-slate-50 pt-3">
                        <span className="text-3xs text-slate-400 uppercase tracking-wider font-extrabold">Amount</span>
                        <span className="text-base font-black text-indigo-650">${parseFloat(str.amount).toLocaleString()}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

        </div>
      )}

      {/* RECORD PAYMENT MODAL */}
      <Modal
        isOpen={isPayModalOpen}
        onClose={() => setIsPayModalOpen(false)}
        title={`Execute Invoice Payment`}
        footer={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsPayModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleExecutePayment}>Pay Now</Button>
          </div>
        }
      >
        {modalError && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-xs font-semibold text-red-600 rounded-xl">{modalError}</div>}
        
        {selectedInvoice && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-xl space-y-2 border border-slate-100">
              <div className="flex justify-between text-xs font-semibold text-slate-500">
                <span>Invoice Total:</span>
                <span className="text-slate-800 font-bold">${parseFloat(selectedInvoice.totalAmount).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs font-semibold text-slate-500">
                <span>Amount Paid:</span>
                <span className="text-green-600 font-bold">${parseFloat(selectedInvoice.paidAmount).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs font-semibold text-slate-500 border-t border-slate-200/60 pt-2">
                <span>Outstanding Dues:</span>
                <span className="text-rose-600 font-bold">${parseFloat(selectedInvoice.dueAmount).toLocaleString()}</span>
              </div>
            </div>

            <Input 
              label="Payment Amount ($)" 
              type="number" 
              value={payForm.amountPaid} 
              onChange={(e) => setPayForm(prev => ({ ...prev, amountPaid: e.target.value }))} 
            />

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-700">Payment Gateway</label>
              <select 
                value={payForm.paymentMethod} 
                onChange={(e) => setPayForm(prev => ({ ...prev, paymentMethod: e.target.value }))}
                className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="Card">Credit/Debit Card</option>
                <option value="UPI">UPI / Instant Transfer</option>
                <option value="Cash">Cash Ledger</option>
              </select>
            </div>
          </div>
        )}
      </Modal>

      {/* CREATE FEE STRUCTURE MODAL */}
      <Modal
        isOpen={isStructModalOpen}
        onClose={() => setIsStructModalOpen(false)}
        title="Create Class Fee Structure"
        footer={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsStructModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleCreateStructure}>Create Rate</Button>
          </div>
        }
      >
        {modalError && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-xs font-semibold text-red-600 rounded-xl">{modalError}</div>}
        <div className="space-y-4">
          <Input label="Fee Standard Title" placeholder="e.g. Tuition Fee Grade 10" value={structForm.title} onChange={(e) => setStructForm(prev => ({ ...prev, title: e.target.value }))} />
          
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-700">Target Class</label>
            <select value={structForm.classId} onChange={(e) => setStructForm(prev => ({ ...prev, classId: e.target.value }))} className="px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
              <option value="">Select Class</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Fee Amount ($)" type="number" value={structForm.amount} onChange={(e) => setStructForm(prev => ({ ...prev, amount: e.target.value }))} />
            <Input label="Academic Year" placeholder="2026-2027" value={structForm.academicYearId} onChange={(e) => setStructForm(prev => ({ ...prev, academicYearId: e.target.value }))} />
          </div>
        </div>
      </Modal>

      {/* PAYMENT RECEIPT MODAL */}
      <PaymentReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        invoice={selectedReceipt.invoice}
        payment={selectedReceipt.payment}
        student={selectedReceipt.invoice?.student}
      />

    </PageContainer>
  );
};

export default FeesPage;
