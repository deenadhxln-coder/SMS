import { Button, Modal, Input } from '@sms/ui-kit';
import React, { useEffect, useState } from 'react';
import api from '@sms/api-client';
import useAuthStore from '@sms/auth';
import PageContainer from '../../components/layout/PageContainer';



import { Plus, FileText, UserPlus, CheckCircle, BookOpen } from 'lucide-react';

const ExamsPage = () => {
  const { user } = useAuthStore();
  const isTeacherOrAdmin = ['Super Admin', 'School Admin', 'Teacher'].includes(user.role);

  // General States
  const [exams, setExams] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Student report card states
  const [reportCard, setReportCard] = useState([]);
  const [targetStudentId, setTargetStudentId] = useState('');

  // Modals Control
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [isSchedModalOpen, setIsSchedModalOpen] = useState(false);
  const [isMarkModalOpen, setIsMarkModalOpen] = useState(false);

  // Form states
  const [examForm, setExamForm] = useState({ name: '', academicYearId: '2026-2027', startDate: '', endDate: '' });
  const [schedForm, setSchedForm] = useState({ examId: '', subjectId: '', classId: '', examDate: '', maxMarks: 100 });
  
  // Enter marks states
  const [selectedSched, setSelectedSched] = useState(null);
  const [roster, setRoster] = useState([]);
  const [marksInputs, setMarksInputs] = useState({});
  
  const [message, setMessage] = useState({ type: '', text: '' });
  const [modalError, setModalError] = useState('');

  const fetchExams = async () => {
    try {
      setLoading(true);
      const res = await api.get('/exams');
      setExams(res.data.exams);
    } catch (err) {
      console.error('Failed to load exams:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMetadata = async () => {
    try {
      const clsRes = await api.get('/academics/classes');
      setClasses(clsRes.data.classes);

      const subRes = await api.get('/academics/subjects');
      setSubjects(subRes.data.subjects);
    } catch (err) {
      console.error('Failed to fetch academic metadata:', err);
    }
  };

  const fetchReportCard = async () => {
    try {
      setLoading(true);
      let studId = targetStudentId;
      if (user.role === 'Student') {
        const studentProfile = await api.get(`/students?limit=1`);
        const matchingStudent = studentProfile.data.students.find(s => s.userId === user.id);
        if (matchingStudent) {
          studId = matchingStudent.id;
        }
      } else if (user.role === 'Parent') {
        const studRes = await api.get('/students');
        const firstChild = studRes.data.students[0];
        if (firstChild) studId = firstChild.id;
      }

      if (studId) {
        const res = await api.get(`/exams/report-card/${studId}`);
        setReportCard(res.data.marks);
      }
    } catch (err) {
      console.error('Failed to fetch report card:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isTeacherOrAdmin) {
      fetchExams();
      fetchMetadata();
    } else {
      fetchReportCard();
    }
  }, [user]);

  const handleCreateExam = async () => {
    setModalError('');
    try {
      await api.post('/exams', examForm);
      setIsExamModalOpen(false);
      fetchExams();
    } catch (err) {
      setModalError(err.response?.data?.message || 'Failed to create exam');
    }
  };

  const handleAddSchedule = async () => {
    setModalError('');
    try {
      await api.post(`/exams/${schedForm.examId}/schedule`, schedForm);
      setIsSchedModalOpen(false);
      fetchExams();
    } catch (err) {
      setModalError(err.response?.data?.message || 'Failed to add schedule');
    }
  };

  const handleOpenMarksModal = async (sched) => {
    setSelectedSched(sched);
    setModalError('');
    try {
      const res = await api.get('/students', { params: { classId: sched.classId, limit: 100 } });
      setRoster(res.data.students);

      const inputs = {};
      res.data.students.forEach(s => {
        inputs[s.id] = '';
      });
      setMarksInputs(inputs);
      setIsMarkModalOpen(true);
    } catch (err) {
      console.error('Failed to load roster:', err);
    }
  };

  const handleScoreChange = (studentId, val) => {
    setMarksInputs(prev => ({
      ...prev,
      [studentId]: val
    }));
  };

  const handleSaveMarks = async () => {
    setModalError('');
    try {
      const markings = Object.keys(marksInputs).map(id => ({
        studentId: id,
        marksObtained: marksInputs[id] === '' ? 0 : parseFloat(marksInputs[id])
      }));

      await api.post(`/exams/${selectedSched.examId}/marks`, {
        examSubjectId: selectedSched.id,
        markings
      });

      setIsMarkModalOpen(false);
      fetchExams();
      setMessage({ type: 'success', text: 'Exam marks submitted successfully' });
    } catch (err) {
      setModalError(err.response?.data?.message || 'Failed to save marks');
    }
  };

  return (
    <PageContainer
      title="Examinations & Grading"
      description={isTeacherOrAdmin ? "Configure exam schedules and submit student grades" : "View academic term report cards"}
      action={
        isTeacherOrAdmin ? (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { setSchedForm(prev => ({ ...prev, examId: exams[0]?.id || '' })); setIsSchedModalOpen(true); }} icon={<Plus size={18} />}>
              Add Schedule
            </Button>
            <Button variant="primary" onClick={() => setIsExamModalOpen(true)} icon={<Plus size={18} />}>
              New Exam
            </Button>
          </div>
        ) : null
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
          <span className="text-slate-400 text-sm font-medium">Assembling examinations data...</span>
        </div>
      ) : isTeacherOrAdmin ? (
        <div className="space-y-8">
          {exams.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center text-slate-400 font-medium shadow-sm">
              No exams created. Click "New Exam" to get started.
            </div>
          ) : (
            exams.map(exam => (
              <div key={exam.id} className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex flex-col gap-5">
                <div className="flex justify-between items-start border-b border-slate-50 pb-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-800">{exam.name}</h3>
                    <p className="text-2xs font-semibold text-slate-400">
                      Term: {exam.academicYearId} | Dates: {exam.startDate} to {exam.endDate}
                    </p>
                  </div>
                  <span className={`px-2.5 py-1 text-3xs font-extrabold rounded-full ${
                    exam.status === 'PUBLISHED' ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {exam.status}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-semibold text-slate-600 border-collapse">
                    <thead>
                      <tr className="border-b border-slate-50 text-slate-400 uppercase tracking-wider">
                        <th className="pb-3">Subject</th>
                        <th className="pb-3">Class</th>
                        <th className="pb-3">Exam Date</th>
                        <th className="pb-3">Max Marks</th>
                        <th className="pb-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-slate-700">
                      {exam.examSubjects?.map(sched => (
                        <tr key={sched.id} className="hover:bg-slate-50/50">
                          <td className="py-3 flex items-center gap-1.5 font-bold">
                            <BookOpen size={14} className="text-slate-400" />
                            <span>{sched.subject?.name} ({sched.subject?.code})</span>
                          </td>
                          <td className="py-3">{sched.class?.name}</td>
                          <td className="py-3">{sched.examDate}</td>
                          <td className="py-3 font-bold">{sched.maxMarks}</td>
                          <td className="py-3 text-right">
                            <Button variant="outline" onClick={() => handleOpenMarksModal(sched)} className="px-3 py-1.5 text-2xs">
                              Enter Marks
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {reportCard.length === 0 ? (
            <div className="py-20 text-center text-slate-400 font-medium">
              No report cards or exam results published for this student.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4">Exam Term</th>
                    <th className="px-6 py-4">Subject</th>
                    <th className="px-6 py-4">Marks Obtained</th>
                    <th className="px-6 py-4">Max Marks</th>
                    <th className="px-6 py-4">Grade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                  {reportCard.map((mark) => (
                    <tr key={mark.id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4">{mark.examSubject?.exam?.name}</td>
                      <td className="px-6 py-4 flex items-center gap-2">
                        <FileText size={16} className="text-slate-400" />
                        <span>{mark.examSubject?.subject?.name}</span>
                      </td>
                      <td className="px-6 py-4 text-indigo-600 font-bold">{mark.marksObtained}</td>
                      <td className="px-6 py-4 font-bold">{mark.maxMarks}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 text-2xs font-extrabold rounded-full ${
                          mark.grade === 'A' || mark.grade === 'B' 
                            ? 'bg-green-50 text-green-700' 
                            : mark.grade === 'F'
                            ? 'bg-red-50 text-red-700'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {mark.grade}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* CREATE EXAM MODAL */}
      <Modal
        isOpen={isExamModalOpen}
        onClose={() => setIsExamModalOpen(false)}
        title="Create Term Exam"
        footer={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsExamModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleCreateExam}>Create</Button>
          </div>
        }
      >
        {modalError && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-xs font-semibold text-red-650 rounded-xl">{modalError}</div>}
        <div className="space-y-4">
          <Input label="Exam Name" placeholder="e.g. Midterm Exams, Final Exams" value={examForm.name} onChange={(e) => setExamForm(prev => ({ ...prev, name: e.target.value }))} />
          <Input label="Academic Year" placeholder="2026-2027" value={examForm.academicYearId} onChange={(e) => setExamForm(prev => ({ ...prev, academicYearId: e.target.value }))} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Start Date" type="date" value={examForm.startDate} onChange={(e) => setExamForm(prev => ({ ...prev, startDate: e.target.value }))} />
            <Input label="End Date" type="date" value={examForm.endDate} onChange={(e) => setExamForm(prev => ({ ...prev, endDate: e.target.value }))} />
          </div>
        </div>
      </Modal>

      {/* ADD SCHEDULE MODAL */}
      <Modal
        isOpen={isSchedModalOpen}
        onClose={() => setIsSchedModalOpen(false)}
        title="Schedule Exam Subject"
        footer={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsSchedModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleAddSchedule}>Add Schedule</Button>
          </div>
        }
      >
        {modalError && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-xs font-semibold text-red-650 rounded-xl">{modalError}</div>}
        <div className="space-y-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-700">Exam Term</label>
            <select value={schedForm.examId} onChange={(e) => setSchedForm(prev => ({ ...prev, examId: e.target.value }))} className="px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
              <option value="">Select Exam</option>
              {exams.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-700">Subject</label>
              <select value={schedForm.subjectId} onChange={(e) => setSchedForm(prev => ({ ...prev, subjectId: e.target.value }))} className="px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
                <option value="">Select Subject</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-700">Class</label>
              <select value={schedForm.classId} onChange={(e) => setSchedForm(prev => ({ ...prev, classId: e.target.value }))} className="px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
                <option value="">Select Class</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Exam Date" type="date" value={schedForm.examDate} onChange={(e) => setSchedForm(prev => ({ ...prev, examDate: e.target.value }))} />
            <Input label="Max Marks" type="number" value={schedForm.maxMarks} onChange={(e) => setSchedForm(prev => ({ ...prev, maxMarks: parseInt(e.target.value) }))} />
          </div>
        </div>
      </Modal>

      {/* ENTER MARKS MODAL */}
      <Modal
        isOpen={isMarkModalOpen}
        onClose={() => setIsMarkModalOpen(false)}
        title={`Enter Roster Scores: ${selectedSched?.subject?.name} (${selectedSched?.class?.name})`}
        footer={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsMarkModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSaveMarks}>Submit Marks</Button>
          </div>
        }
      >
        {modalError && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-xs font-semibold text-red-650 rounded-xl">{modalError}</div>}
        <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto space-y-4">
          {roster.map(student => (
            <div key={student.id} className="py-3 flex justify-between items-center gap-4">
              <div>
                <h4 className="text-sm font-bold text-slate-800">{student.user.name}</h4>
                <p className="text-3xs text-slate-400 font-semibold">{student.admissionNo}</p>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  placeholder="0"
                  min="0"
                  max={selectedSched?.maxMarks || 100}
                  value={marksInputs[student.id] || ''}
                  onChange={(e) => handleScoreChange(student.id, e.target.value)}
                  className="w-20 px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-center font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                <span className="text-xs text-slate-400 font-semibold">/ {selectedSched?.maxMarks}</span>
              </div>
            </div>
          ))}
        </div>
      </Modal>

    </PageContainer>
  );
};

export default ExamsPage;
