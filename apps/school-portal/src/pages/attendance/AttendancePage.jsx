import React, { useEffect, useState } from 'react';
import api from '@sms/api-client';
import useAuthStore from '@sms/auth';
import PageContainer from '../../components/layout/PageContainer';
import { Button } from '@sms/ui-kit';
import { exportToCSV } from '../../utils/csvExport';
import { Check, UserMinus, Clock, CalendarRange, ClipboardList, Download } from 'lucide-react';

const AttendancePage = () => {
  const { user } = useAuthStore();
  const isTeacherOrAdmin = ['School Admin', 'Teacher'].includes(user.role);

  // States
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [sections, setSections] = useState([]);
  const [selectedSection, setSelectedSection] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState([]);
  const [markings, setMarkings] = useState({});
  
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const loadSections = async (classId) => {
    try {
      const res = await api.get('/academics/sections', { params: { classId } });
      setSections(res.data.sections || []);
    } catch (err) {
      console.error('Failed to load sections:', err);
      setSections([]);
    }
  };

  useEffect(() => {
    const loadClasses = async () => {
      try {
        const res = await api.get('/academics/classes');
        setClasses(res.data.classes);
        if (res.data.classes.length > 0) {
          const firstClassId = res.data.classes[0].id;
          setSelectedClass(firstClassId);
          loadSections(firstClassId);
        }
      } catch (err) {
        console.error('Failed to load classes:', err);
      }
    };

    if (isTeacherOrAdmin) {
      loadClasses();
    } else {
      fetchStudentHistory();
    }
  }, [user]);

  const handleClassChange = (newClassId) => {
    setSelectedClass(newClassId);
    setSelectedSection('');
    loadSections(newClassId);
  };

  const fetchStudentHistory = async () => {
    try {
      setLoading(true);
      const res = await api.get('/attendance');
      setHistory(res.data.records);
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoster = async () => {
    if (!selectedClass) return;
    try {
      setLoading(true);
      setMessage({ type: '', text: '' });
      const params = { classId: selectedClass, limit: 100, status: 'ACTIVE' };
      if (selectedSection) {
        params.sectionId = selectedSection;
      }
      const res = await api.get('/students', { params });
      setStudents(res.data.students);
      
      const attRes = await api.get('/attendance', {
        params: { classId: selectedClass, startDate: date, endDate: date }
      });
      
      const prevMarkings = {};
      res.data.students.forEach(s => {
        prevMarkings[s.id] = 'PRESENT';
      });
      attRes.data.records.forEach(r => {
        prevMarkings[r.studentId] = r.status;
      });

      setMarkings(prevMarkings);
    } catch (err) {
      console.error('Failed to load class roster:', err);
      setMessage({ type: 'error', text: 'Failed to load class roster' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isTeacherOrAdmin && selectedClass) {
      fetchRoster();
    }
  }, [selectedClass, selectedSection, date]);

  const handleStatusChange = (studentId, status) => {
    setMarkings(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const markAll = (status) => {
    const updated = {};
    students.forEach(s => {
      updated[s.id] = status;
    });
    setMarkings(updated);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setMessage({ type: '', text: '' });
    try {
      const payload = {
        classId: selectedClass,
        date,
        markings: Object.keys(markings).map(id => ({
          studentId: id,
          status: markings[id]
        }))
      };

      await api.post('/attendance', payload);
      setMessage({ type: 'success', text: 'Attendance register submitted successfully' });
    } catch (err) {
      console.error('Failed to save attendance:', err);
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to save attendance register' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleExportCSV = () => {
    if (isTeacherOrAdmin) {
      const dataToExport = students.map((s) => ({
        date,
        studentName: s.user?.name || 'Student',
        admissionNo: s.admissionNo || '',
        status: markings[s.id] || 'PRESENT'
      }));
      const columns = [
        { label: 'Date', key: 'date' },
        { label: 'Student Name', key: 'studentName' },
        { label: 'Admission No', key: 'admissionNo' },
        { label: 'Status', key: 'status' }
      ];
      exportToCSV(dataToExport, columns, `attendance_register_${date}`);
    } else {
      const columns = [
        { label: 'Date', accessor: (r) => new Date(r.date).toLocaleDateString() },
        { label: 'Status', key: 'status' },
        { label: 'Remarks', accessor: (r) => r.remarks || 'None' }
      ];
      exportToCSV(history, columns, 'my_attendance_history');
    }
  };

  // Daily attendance KPI calculations
  const totalStudents = students.length;
  const presentCount = students.filter(s => markings[s.id] === 'PRESENT').length;
  const absentCount = students.filter(s => markings[s.id] === 'ABSENT').length;
  const lateCount = students.filter(s => markings[s.id] === 'LATE').length;
  const attendanceRate = totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0;
  const todayDateStr = new Date().toISOString().split('T')[0];

  return (
    <PageContainer
      title="Attendance Registry"
      description={isTeacherOrAdmin ? "Take daily registers and verify attendance trends" : "Review your calendar attendance entries"}
      actions={
        <Button
          variant="outline"
          onClick={handleExportCSV}
          disabled={isTeacherOrAdmin ? !students.length : !history.length}
        >
          <Download size={16} className="mr-2" /> Export CSV
        </Button>
      }
    >
      {message.text && (
        <div className={`mb-6 p-4 rounded-xl text-xs font-semibold border ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-700 border-green-200' 
            : 'bg-red-50 text-red-700 border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {isTeacherOrAdmin ? (
        <div className="flex flex-col gap-6">
          {/* Controls Bar */}
          <div className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm flex flex-wrap gap-4 items-center justify-between">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex flex-col gap-1">
                <label className="text-3xs font-extrabold uppercase tracking-wider text-slate-400">Class</label>
                <select
                  value={selectedClass}
                  onChange={(e) => handleClassChange(e.target.value)}
                  className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none"
                >
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-3xs font-extrabold uppercase tracking-wider text-slate-400">Section</label>
                <select
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value)}
                  className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none"
                >
                  <option value="">All Sections</option>
                  {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-3xs font-extrabold uppercase tracking-wider text-slate-400">Register Date</label>
                <input
                  type="date"
                  value={date}
                  max={todayDateStr}
                  onChange={(e) => setDate(e.target.value)}
                  className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => markAll('PRESENT')}>All Present</Button>
              <Button variant="outline" onClick={() => markAll('ABSENT')}>All Absent</Button>
            </div>
          </div>

          {/* Daily Attendance Summary KPI Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
              <span className="text-3xs font-extrabold uppercase tracking-wider text-slate-400">Roster Total</span>
              <p className="text-xl font-black text-slate-800 mt-1">{totalStudents}</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
              <span className="text-3xs font-extrabold uppercase tracking-wider text-emerald-600">Present</span>
              <p className="text-xl font-black text-emerald-600 mt-1">{presentCount}</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
              <span className="text-3xs font-extrabold uppercase tracking-wider text-rose-600">Absent</span>
              <p className="text-xl font-black text-rose-600 mt-1">{absentCount}</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
              <span className="text-3xs font-extrabold uppercase tracking-wider text-amber-600">Late</span>
              <p className="text-xl font-black text-amber-600 mt-1">{lateCount}</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
              <span className="text-3xs font-extrabold uppercase tracking-wider text-indigo-600">Attendance Rate</span>
              <p className={`text-xl font-black mt-1 ${attendanceRate >= 75 ? 'text-emerald-600' : 'text-amber-600'}`}>
                {attendanceRate}%
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {loading ? (
              <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
                <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-slate-400 text-sm font-medium">Fetching roster...</span>
              </div>
            ) : students.length === 0 ? (
              <div className="py-20 text-center text-slate-400 font-medium">
                No active students found in this class.
              </div>
            ) : (
              <div>
                <div className="divide-y divide-slate-100">
                  {students.map((student) => (
                    <div key={student.id} className="px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-slate-55/30 transition-colors">
                      <div>
                        <h4 className="font-bold text-slate-800">{student.user.name}</h4>
                        <p className="text-2xs text-slate-400 font-semibold">{student.admissionNo}</p>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleStatusChange(student.id, 'PRESENT')}
                          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border transition-all ${
                            markings[student.id] === 'PRESENT'
                              ? 'bg-green-500 text-white border-green-500 shadow-lg shadow-green-500/10'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-55'
                          }`}
                        >
                          <Check size={14} />
                          <span>Present</span>
                        </button>
                        
                        <button
                          onClick={() => handleStatusChange(student.id, 'ABSENT')}
                          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border transition-all ${
                            markings[student.id] === 'ABSENT'
                              ? 'bg-rose-500 text-white border-rose-500 shadow-lg shadow-rose-500/10'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-55'
                          }`}
                        >
                          <UserMinus size={14} />
                          <span>Absent</span>
                        </button>
                        
                        <button
                          onClick={() => handleStatusChange(student.id, 'LATE')}
                          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border transition-all ${
                            markings[student.id] === 'LATE'
                              ? 'bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-500/10'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-55'
                          }`}
                        >
                          <Clock size={14} />
                          <span>Late</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
                  <Button variant="primary" onClick={handleSubmit} loading={submitting}>
                    Submit Attendance Register
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-slate-400 text-sm font-medium">Fetching history logs...</span>
            </div>
          ) : history.length === 0 ? (
            <div className="py-20 text-center text-slate-400 font-medium">
              No attendance logs recorded for this account.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Class</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                  {history.map((record) => (
                    <tr key={record.id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4 whitespace-nowrap flex items-center gap-2">
                        <CalendarRange size={16} className="text-slate-400" />
                        <span>{record.date}</span>
                      </td>
                      <td className="px-6 py-4">{record.class?.name}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 text-2xs font-extrabold rounded-full ${
                          record.status === 'PRESENT' 
                            ? 'bg-green-50 text-green-700' 
                            : record.status === 'LATE'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-red-50 text-red-700'
                        }`}>
                          {record.status}
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
    </PageContainer>
  );
};

export default AttendancePage;
