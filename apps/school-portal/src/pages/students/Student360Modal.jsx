import React, { useState, useEffect } from 'react';
import { Modal, Badge, StatCard, Button, Table } from '@sms/ui-kit';
import api from '@sms/api-client';
import {
  User, Mail, Calendar, GraduationCap, Coins, CheckCircle2,
  Clock, FileText, AlertCircle, Phone, BookOpen, Shield, Printer
} from 'lucide-react';
import PaymentReceiptModal from '../fees/PaymentReceiptModal';
import ReportCardPrintModal from '../examinations/ReportCardPrintModal';

const Student360Modal = ({ studentId, isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'timetable' | 'attendance' | 'exams' | 'fees'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [student, setStudent] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [reportCard, setReportCard] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [timetable, setTimetable] = useState([]);

  // Print modals
  const [isReportCardPrintOpen, setIsReportCardPrintOpen] = useState(false);
  const [isReceiptPrintOpen, setIsReceiptPrintOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState({ invoice: null, payment: null });

  useEffect(() => {
    if (!isOpen || !studentId) {
      setStudent(null);
      setAttendance([]);
      setReportCard([]);
      setInvoices([]);
      setTimetable([]);
      setError('');
      return;
    }

    const loadStudentData = async () => {
      setLoading(true);
      setError('');
      try {
        // Fetch core profile, attendance, report card, and invoices in parallel
        const [studentRes, attRes, examRes, feeRes] = await Promise.all([
          api.get(`/students/${studentId}`),
          api.get('/attendance', { params: { studentId } }).catch(() => ({ data: { records: [] } })),
          api.get(`/exams/report-card/${studentId}`).catch(() => ({ data: { marks: [] } })),
          api.get('/fees/invoices', { params: { studentId } }).catch(() => ({ data: { invoices: [] } })),
        ]);

        const studentProfile = studentRes.data.student;
        setStudent(studentProfile);
        setAttendance(attRes.data.records || []);
        setReportCard(examRes.data.marks || []);
        setInvoices(feeRes.data.invoices || []);

        // If student has an assigned class, load class timetable
        if (studentProfile?.classId) {
          try {
            const ttRes = await api.get('/academics/timetable', {
              params: { classId: studentProfile.classId },
            });
            setTimetable(ttRes.data.timetables || []);
          } catch {
            setTimetable([]);
          }
        }
      } catch (err) {
        console.error('Failed to load student 360 data:', err);
        setError(err.response?.data?.message || 'Unable to load student profile details.');
      } finally {
        setLoading(false);
      }
    };

    loadStudentData();
  }, [isOpen, studentId]);

  // Derived metrics
  const totalDays = attendance.length;
  const presentDays = attendance.filter((r) => r.status === 'PRESENT').length;
  const attendancePct = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 100;

  let totalDue = 0;
  invoices.forEach((inv) => {
    totalDue += parseFloat(inv.dueAmount || 0);
  });

  const totalMarksObtained = reportCard.reduce((acc, m) => acc + (parseFloat(m.marksObtained) || 0), 0);
  const totalMaxMarks = reportCard.reduce((acc, m) => acc + (parseFloat(m.examSubject?.maxMarks) || 100), 0);
  const examAveragePct = totalMaxMarks > 0 ? Math.round((totalMarksObtained / totalMaxMarks) * 100) : 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Student 360° Profile"
      size="xl"
      footer={
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      }
    >
      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center gap-3">
          <div className="w-9 h-9 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-semibold text-slate-400">Loading student 360 records...</span>
        </div>
      ) : error ? (
        <div className="p-6 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl flex items-start gap-3 my-4">
          <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold">Access Error</h4>
            <p className="text-xs mt-1">{error}</p>
          </div>
        </div>
      ) : student ? (
        <div className="space-y-6">
          {/* Header Profile Strip */}
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-xl flex-shrink-0 shadow-sm">
                {student.user?.name?.charAt(0) || 'S'}
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 leading-snug">
                  {student.user?.name}
                </h3>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <Badge variant="indigo">{student.admissionNo}</Badge>
                  <span className="text-xs text-slate-500 font-medium">
                    {student.class?.name || 'Unassigned'} • Section {student.section?.name || 'A'}
                  </span>
                  <Badge variant={student.user?.status === 'ACTIVE' ? 'success' : 'neutral'}>
                    {student.user?.status || 'ACTIVE'}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="text-xs text-slate-500 space-y-1 sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0 w-full sm:w-auto">
              <p className="flex items-center sm:justify-end gap-1.5 font-medium text-slate-600">
                <Mail size={13} className="text-slate-400" />
                {student.user?.email}
              </p>
              {student.parent && (
                <p className="flex items-center sm:justify-end gap-1.5 text-3xs text-slate-400">
                  <User size={12} />
                  Parent: <span className="font-semibold text-slate-600">{student.parent.name}</span>
                </p>
              )}
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto pb-px">
            {[
              { id: 'overview', label: 'Overview', icon: <User size={15} /> },
              { id: 'timetable', label: 'Timetable', icon: <Calendar size={15} /> },
              { id: 'attendance', label: 'Attendance', icon: <CheckCircle2 size={15} /> },
              { id: 'exams', label: 'Report Card', icon: <GraduationCap size={15} /> },
              { id: 'fees', label: 'Invoices', icon: <Coins size={15} /> },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-fade-in">
              {/* Quick KPI StatCards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard
                  title="Attendance Standing"
                  value={`${attendancePct}%`}
                  icon={<CheckCircle2 size={20} />}
                  color={attendancePct >= 75 ? 'emerald' : 'rose'}
                  subtitle={`${presentDays} of ${totalDays} school days`}
                />
                <StatCard
                  title="Academic Score"
                  value={reportCard.length > 0 ? `${examAveragePct}%` : 'N/A'}
                  icon={<GraduationCap size={20} />}
                  color="blue"
                  subtitle={`${reportCard.length} exam marks on record`}
                />
                <StatCard
                  title="Outstanding Dues"
                  value={`$${totalDue.toLocaleString()}`}
                  icon={<Coins size={20} />}
                  color={totalDue === 0 ? 'emerald' : 'amber'}
                  subtitle={totalDue === 0 ? 'All fees settled' : 'Pending balance'}
                />
              </div>

              {/* Enrollment & Guardian Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-2xs">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                    <BookOpen size={15} className="text-indigo-600" /> Academic Placement
                  </h4>
                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between py-1.5 border-b border-slate-50">
                      <span className="text-slate-500">Admission No:</span>
                      <span className="font-mono font-bold text-slate-800">{student.admissionNo}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-50">
                      <span className="text-slate-500">Class:</span>
                      <span className="font-bold text-slate-800">{student.class?.name || 'Not assigned'}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-50">
                      <span className="text-slate-500">Section:</span>
                      <span className="font-bold text-slate-800">{student.section?.name || 'A'}</span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-slate-500">Academic Year:</span>
                      <span className="font-bold text-slate-800">{student.class?.academicYearId || '2026-2027'}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-2xs">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                    <Shield size={15} className="text-purple-600" /> Guardian & Contact
                  </h4>
                  {student.parent ? (
                    <div className="space-y-3 text-xs">
                      <div className="flex justify-between py-1.5 border-b border-slate-50">
                        <span className="text-slate-500">Parent Name:</span>
                        <span className="font-bold text-slate-800">{student.parent.name}</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-slate-50">
                        <span className="text-slate-500">Email:</span>
                        <span className="font-medium text-slate-800">{student.parent.email}</span>
                      </div>
                      <div className="flex justify-between py-1.5">
                        <span className="text-slate-500">Guardian Status:</span>
                        <Badge variant="success">Verified Parent</Badge>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 py-6 text-center">
                      No linked parent profile registered for this student.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TIMETABLE */}
          {activeTab === 'timetable' && (
            <div className="space-y-4 animate-fade-in">
              <h4 className="text-xs font-bold text-slate-500">
                Weekly Timetable for {student.class?.name || 'Enrolled Class'}
              </h4>
              {timetable.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
                  {timetable.map((slot) => (
                    <div
                      key={slot.id}
                      className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="neutral">{slot.dayOfWeek}</Badge>
                          <span className="font-bold text-slate-900">{slot.subject?.name}</span>
                        </div>
                        <p className="text-3xs text-slate-500">
                          Teacher: {slot.teacher?.user?.name || 'Faculty'} • Room: {slot.roomNumber || 'Main Hall'}
                        </p>
                      </div>
                      <span className="font-mono text-3xs font-bold text-indigo-700 bg-indigo-50 px-2 py-1 rounded border border-indigo-100 flex-shrink-0">
                        {slot.startTime?.slice(0, 5)} - {slot.endTime?.slice(0, 5)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
                  No weekly schedule configured for this class.
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ATTENDANCE HISTORY */}
          {activeTab === 'attendance' && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-500">
                  Recorded Sessions ({attendance.length} Total)
                </h4>
                <Badge variant={attendancePct >= 75 ? 'success' : 'danger'}>
                  {attendancePct}% Overall Attendance
                </Badge>
              </div>

              {attendance.length > 0 ? (
                <div className="max-h-80 overflow-y-auto">
                  <Table
                    columns={[
                      {
                        header: 'Date',
                        accessor: 'date',
                        render: (val) => new Date(val).toLocaleDateString(),
                      },
                      {
                        header: 'Day',
                        accessor: (row) =>
                          new Date(row.date).toLocaleDateString('en-US', { weekday: 'long' }),
                      },
                      {
                        header: 'Status',
                        accessor: 'status',
                        render: (val) => (
                          <Badge
                            variant={
                              val === 'PRESENT' ? 'success' : val === 'LATE' ? 'warning' : 'danger'
                            }
                          >
                            {val}
                          </Badge>
                        ),
                      },
                      {
                        header: 'Remarks',
                        accessor: 'remarks',
                        render: (val) => val || '—',
                      },
                    ]}
                    data={attendance}
                    loading={false}
                  />
                </div>
              ) : (
                <div className="py-12 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
                  No attendance records logged for this student yet.
                </div>
              )}
            </div>
          )}

          {/* TAB 4: REPORT CARD */}
          {activeTab === 'exams' && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-500">Academic Examination Marks</h4>
                <div className="flex items-center gap-3">
                  {reportCard.length > 0 && (
                    <span className="text-xs font-bold text-slate-700">
                      Average Score: <span className="text-indigo-600">{examAveragePct}%</span>
                    </span>
                  )}
                  {reportCard.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="px-2.5 py-1 text-2xs"
                      onClick={() => setIsReportCardPrintOpen(true)}
                      icon={<Printer size={12} />}
                    >
                      Print Report Card
                    </Button>
                  )}
                </div>
              </div>

              {reportCard.length > 0 ? (
                <div className="max-h-80 overflow-y-auto">
                  <Table
                    columns={[
                      {
                        header: 'Exam',
                        accessor: (row) => row.examSubject?.exam?.name || 'Exam',
                      },
                      {
                        header: 'Subject',
                        accessor: (row) => row.examSubject?.subject?.name || 'Subject',
                      },
                      {
                        header: 'Marks Obtained',
                        accessor: (row) => `${row.marksObtained} / ${row.examSubject?.maxMarks || 100}`,
                        render: (val) => <span className="font-bold text-slate-900">{val}</span>,
                      },
                      {
                        header: 'Percentage',
                        accessor: (row) => {
                          const max = parseFloat(row.examSubject?.maxMarks) || 100;
                          const obtained = parseFloat(row.marksObtained) || 0;
                          return `${Math.round((obtained / max) * 100)}%`;
                        },
                        render: (val) => (
                          <span
                            className={`font-semibold text-xs ${
                              parseInt(val, 10) >= 50 ? 'text-emerald-600' : 'text-rose-600'
                            }`}
                          >
                            {val}
                          </span>
                        ),
                      },
                    ]}
                    data={reportCard}
                    loading={false}
                  />
                </div>
              ) : (
                <div className="py-12 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
                  No examination marks recorded for this student.
                </div>
              )}
            </div>
          )}

          {/* TAB 5: FEE INVOICES */}
          {activeTab === 'fees' && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-500">Billing & Invoices</h4>
                <span className="text-xs font-bold text-slate-700">
                  Total Outstanding: <span className="text-amber-600">${totalDue.toFixed(2)}</span>
                </span>
              </div>

              {invoices.length > 0 ? (
                <div className="max-h-80 overflow-y-auto">
                  <Table
                    columns={[
                      {
                        header: 'Invoice #',
                        accessor: 'id',
                        render: (val) => <span className="font-mono text-xs font-bold text-slate-700">#{val.slice(0, 8)}</span>,
                      },
                      {
                        header: 'Due Date',
                        accessor: 'dueDate',
                        render: (val) => (val ? new Date(val).toLocaleDateString() : '—'),
                      },
                      {
                        header: 'Total Amount',
                        accessor: 'totalAmount',
                        render: (val) => `$${parseFloat(val).toFixed(2)}`,
                      },
                      {
                        header: 'Amount Due',
                        accessor: 'dueAmount',
                        render: (val) => (
                          <span
                            className={`font-bold ${
                              parseFloat(val) > 0 ? 'text-amber-600' : 'text-emerald-600'
                            }`}
                          >
                            ${parseFloat(val).toFixed(2)}
                          </span>
                        ),
                      },
                      {
                        header: 'Status',
                        accessor: 'status',
                        render: (val) => (
                          <Badge variant={val === 'PAID' ? 'success' : 'warning'}>{val}</Badge>
                        ),
                      },
                      {
                        header: 'Receipt',
                        accessor: (row) => row,
                        render: (row) => (
                          row.payments && row.payments.length > 0 ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="px-2 py-1 text-2xs"
                              onClick={() => {
                                setSelectedReceipt({ invoice: row, payment: row.payments[0] });
                                setIsReceiptPrintOpen(true);
                              }}
                              icon={<Printer size={12} />}
                            >
                              Receipt
                            </Button>
                          ) : (
                            <span className="text-2xs text-slate-400">—</span>
                          )
                        ),
                      },
                    ]}
                    data={invoices}
                    loading={false}
                  />
                </div>
              ) : (
                <div className="py-12 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
                  No invoices issued for this student.
                </div>
              )}
            </div>
          )}
        </div>
      ) : null}

      {/* REPORT CARD PRINT MODAL */}
      <ReportCardPrintModal
        isOpen={isReportCardPrintOpen}
        onClose={() => setIsReportCardPrintOpen(false)}
        student={student}
        marks={reportCard}
      />

      {/* PAYMENT RECEIPT MODAL */}
      <PaymentReceiptModal
        isOpen={isReceiptPrintOpen}
        onClose={() => setIsReceiptPrintOpen(false)}
        invoice={selectedReceipt.invoice}
        payment={selectedReceipt.payment}
        student={student}
      />
    </Modal>
  );
};

export default Student360Modal;
