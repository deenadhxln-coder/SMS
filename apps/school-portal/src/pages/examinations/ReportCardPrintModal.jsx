import React from 'react';
import { Modal, Button, Badge } from '@sms/ui-kit';
import useAuthStore from '@sms/auth';
import { Printer, Building2, Award, Calendar, FileText, CheckCircle } from 'lucide-react';

const ReportCardPrintModal = ({ isOpen, onClose, student, marks = [] }) => {
  const { user } = useAuthStore();

  if (!student) return null;

  const schoolName = user?.tenant?.schoolName || 'School Management System';
  const schoolLogo = user?.tenant?.logoUrl || null;
  const schoolEmail = user?.tenant?.contactEmail || null;

  const studentName = student?.user?.name || student?.name || 'Student';
  const admissionNo = student?.admissionNo || '—';
  const className = student?.class?.name || student?.className || '—';
  const sectionName = student?.section?.name || student?.sectionName || '';
  const classDisplay = sectionName ? `${className} - ${sectionName}` : className;

  // Calculate totals and cumulative statistics
  let totalMaxMarks = 0;
  let totalObtainedMarks = 0;

  marks.forEach((m) => {
    const max = parseFloat(m.examSubject?.maxMarks) || 100;
    const obtained = parseFloat(m.marksObtained) || 0;
    totalMaxMarks += max;
    totalObtainedMarks += obtained;
  });

  const cumulativePercentage = totalMaxMarks > 0 
    ? Math.round((totalObtainedMarks / totalMaxMarks) * 100) 
    : 0;

  const academicYear = marks[0]?.examSubject?.exam?.academicYearId || '2026-2027';

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Official Academic Report Card"
      maxWidth="max-w-3xl"
      footer={
        <div className="flex items-center justify-between w-full no-print">
          <span className="text-xs text-slate-400">
            A4 Portrait official transcript layout ready for native print or PDF export.
          </span>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button variant="primary" onClick={handlePrint}>
              <Printer size={16} className="mr-2" />
              Print Report Card
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
          .report-print-area, .report-print-area * {
            visibility: visible !important;
          }
          .report-print-area {
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

      {/* Printable Report Card Area */}
      <div className="report-print-area bg-white text-slate-900 p-6 rounded-xl border border-slate-100 font-sans">
        
        {/* School Crest / Header */}
        <div className="flex items-start justify-between border-b-2 border-slate-900 pb-5 mb-6">
          <div className="flex items-center gap-3">
            {schoolLogo ? (
              <img src={schoolLogo} alt={schoolName} className="h-14 w-14 object-contain rounded-lg border border-slate-200" />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-2xl shadow-sm">
                <Building2 size={28} />
              </div>
            )}
            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-900 uppercase">{schoolName}</h1>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Official Academic Performance Transcript</p>
              <p className="text-2xs text-slate-400">Academic Year: {academicYear}</p>
            </div>
          </div>
          <div className="text-right">
            <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-black rounded-full border border-indigo-200 uppercase tracking-wide">
              Official Transcript
            </span>
            <p className="text-2xs text-slate-400 mt-1">Issue Date: {new Date().toLocaleDateString()}</p>
          </div>
        </div>

        {/* Student Identification Details Grid */}
        <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100 mb-6 text-xs">
          <div>
            <span className="text-2xs text-slate-400 uppercase tracking-wider font-bold block mb-0.5">Student Name</span>
            <p className="font-black text-slate-900 text-sm">{studentName}</p>
          </div>
          <div>
            <span className="text-2xs text-slate-400 uppercase tracking-wider font-bold block mb-0.5">Admission Number</span>
            <p className="font-mono font-bold text-slate-800 text-sm">{admissionNo}</p>
          </div>
          <div>
            <span className="text-2xs text-slate-400 uppercase tracking-wider font-bold block mb-0.5">Class & Section</span>
            <p className="font-bold text-slate-800 text-sm">{classDisplay}</p>
          </div>
        </div>

        {/* Academic Marks Record Table */}
        <div className="border border-slate-200 rounded-xl overflow-hidden mb-6">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-100/75 border-b border-slate-200 text-2xs uppercase tracking-wider font-bold text-slate-700">
              <tr>
                <th className="px-4 py-3">Subject</th>
                <th className="px-4 py-3">Exam Term</th>
                <th className="px-4 py-3 text-right">Max Marks</th>
                <th className="px-4 py-3 text-right">Marks Obtained</th>
                <th className="px-4 py-3 text-right">Percentage</th>
                <th className="px-4 py-3 text-center">Grade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {marks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                    No academic exam results logged for this student.
                  </td>
                </tr>
              ) : (
                marks.map((m) => {
                  const max = parseFloat(m.examSubject?.maxMarks) || 100;
                  const obtained = parseFloat(m.marksObtained) || 0;
                  const pct = Math.round((obtained / max) * 100);
                  const code = m.examSubject?.subject?.code;

                  return (
                    <tr key={m.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3.5 font-bold text-slate-800">
                        {m.examSubject?.subject?.name || 'Subject'}
                        {code && <span className="block text-3xs font-mono text-slate-400 font-normal">[{code}]</span>}
                      </td>
                      <td className="px-4 py-3.5 text-slate-600 font-medium">
                        {m.examSubject?.exam?.name || 'Exam'}
                      </td>
                      <td className="px-4 py-3.5 text-right font-medium text-slate-500">
                        {max}
                      </td>
                      <td className="px-4 py-3.5 text-right font-black text-indigo-700">
                        {obtained}
                      </td>
                      <td className="px-4 py-3.5 text-right font-bold text-slate-700">
                        {pct}%
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className={`inline-block px-2.5 py-0.5 text-2xs font-extrabold rounded-full ${
                          m.grade === 'A' || m.grade === 'A+' || m.grade === 'B'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : m.grade === 'F'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          {m.grade || '—'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Overall Academic Performance Summary Strip */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 mb-8">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="border-r border-slate-200">
              <span className="text-2xs text-slate-400 uppercase tracking-wider font-bold block mb-0.5">Total Maximum</span>
              <p className="text-lg font-black text-slate-800">{totalMaxMarks}</p>
            </div>
            <div className="border-r border-slate-200">
              <span className="text-2xs text-slate-400 uppercase tracking-wider font-bold block mb-0.5">Marks Obtained</span>
              <p className="text-lg font-black text-indigo-600">{totalObtainedMarks}</p>
            </div>
            <div>
              <span className="text-2xs text-slate-400 uppercase tracking-wider font-bold block mb-0.5">Cumulative Score</span>
              <p className="text-lg font-black text-slate-800">
                {cumulativePercentage}%
              </p>
            </div>
          </div>
        </div>

        {/* Official School Signatures & Stamp */}
        <div className="grid grid-cols-3 gap-8 pt-8 border-t border-dashed border-slate-200 text-xs">
          <div className="text-center">
            <div className="border-b border-slate-400 pb-2 mb-1">
              <span className="text-3xs text-slate-400 font-bold uppercase tracking-wider">Class Teacher</span>
            </div>
            <p className="text-3xs text-slate-400">Class Evaluation Signature</p>
          </div>
          <div className="text-center">
            <div className="border-b border-slate-400 pb-2 mb-1">
              <span className="text-3xs text-slate-400 font-bold uppercase tracking-wider">Principal / Head of School</span>
            </div>
            <p className="text-3xs text-slate-400">Administrative Endorsement</p>
          </div>
          <div className="flex flex-col items-center justify-center">
            <div className="w-20 h-20 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center text-center p-2">
              <span className="text-4xs text-slate-400 font-bold uppercase tracking-wider">Official Stamp</span>
            </div>
          </div>
        </div>

      </div>
    </Modal>
  );
};

export default ReportCardPrintModal;
