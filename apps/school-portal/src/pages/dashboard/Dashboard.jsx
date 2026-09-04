import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '@sms/auth';
import api from '@sms/api-client';
import PageContainer from '../../components/layout/PageContainer';
import { StatCard, Badge, Button } from '@sms/ui-kit';
import ChildSelector from '../../components/ChildSelector';
import {
  Users, GraduationCap, Coins, AlertTriangle,
  Calendar, Clock, BookOpen, CheckCircle2, XCircle,
  FileText, ArrowRight, UserCheck, ShieldCheck, ChevronRight
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const roleName = user?.role?.name || user?.role || '';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Role specific state
  const [adminData, setAdminData] = useState(null);
  const [teacherSchedule, setTeacherSchedule] = useState([]);
  const [teacherExams, setTeacherExams] = useState([]);
  const [studentData, setStudentData] = useState({
    attendance: [],
    timetable: [],
    invoices: []
  });
  const [parentData, setParentData] = useState({
    children: [],
    selectedChild: null,
    childAttendance: [],
    childInvoices: [],
    childSchedule: []
  });

  const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      if (roleName === 'School Admin') {
        const res = await api.get('/dashboard/summary');
        setAdminData(res.data.summary);
      } else if (roleName === 'Teacher') {
        const teacherId = user?.teacherProfile?.id;
        const [ttRes, examRes] = await Promise.all([
          api.get('/academics/timetable', { params: teacherId ? { teacherId } : {} }),
          api.get('/exams')
        ]);
        setTeacherSchedule(ttRes.data.timetables || []);
        setTeacherExams(examRes.data.exams || []);
      } else if (roleName === 'Student') {
        const classId = user?.studentProfile?.classId;
        const [attRes, ttRes, invRes] = await Promise.all([
          api.get('/attendance'),
          classId ? api.get('/academics/timetable', { params: { classId } }) : Promise.resolve({ data: { timetables: [] } }),
          api.get('/fees/invoices')
        ]);
        setStudentData({
          attendance: attRes.data.records || [],
          timetable: ttRes.data.timetables || [],
          invoices: invRes.data.invoices || []
        });
      } else if (roleName === 'Parent') {
        const childrenRes = await api.get('/students/my-children');
        const children = childrenRes.data.children || [];
        const firstChild = children[0] || null;

        let childAtt = [];
        let childInv = [];
        let childSched = [];

        if (firstChild) {
          const [attRes, invRes, ttRes] = await Promise.all([
            api.get('/attendance', { params: { studentId: firstChild.id } }).catch(() => ({ data: { records: [] } })),
            api.get('/fees/invoices', { params: { studentId: firstChild.id } }).catch(() => ({ data: { invoices: [] } })),
            firstChild.classId
              ? api.get('/academics/timetable', { params: { classId: firstChild.classId } }).catch(() => ({ data: { timetables: [] } }))
              : Promise.resolve({ data: { timetables: [] } })
          ]);
          childAtt = attRes.data.records || [];
          childInv = invRes.data.invoices || [];
          childSched = ttRes.data.timetables || [];
        }

        setParentData({
          children,
          selectedChild: firstChild,
          childAttendance: childAtt,
          childInvoices: childInv,
          childSchedule: childSched
        });
      }
    } catch (err) {
      console.error('Dashboard data load error:', err);
      setError(err.userMessage || err.response?.data?.message || 'Unable to load real dashboard metrics.');
    } finally {
      setLoading(false);
    }
  }, [roleName, user]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const handleSelectChild = async (child) => {
    try {
      setLoading(true);
      const [attRes, invRes, ttRes] = await Promise.all([
        api.get('/attendance', { params: { studentId: child.id } }).catch(() => ({ data: { records: [] } })),
        api.get('/fees/invoices', { params: { studentId: child.id } }).catch(() => ({ data: { invoices: [] } })),
        child.classId
          ? api.get('/academics/timetable', { params: { classId: child.classId } }).catch(() => ({ data: { timetables: [] } }))
          : Promise.resolve({ data: { timetables: [] } })
      ]);
      setParentData((prev) => ({
        ...prev,
        selectedChild: child,
        childAttendance: attRes.data.records || [],
        childInvoices: invRes.data.invoices || [],
        childSchedule: ttRes.data.timetables || []
      }));
    } catch (err) {
      console.error('Failed to load child metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !adminData && !teacherSchedule.length && !studentData.attendance.length && !parentData.children.length) {
    return (
      <div className="p-8 flex justify-center items-center h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-slate-400 text-sm font-medium">Assembling operational metrics...</span>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 1. SCHOOL ADMIN COCKPIT
  // =========================================================================
  if (roleName === 'School Admin') {
    const totalPaid = parseFloat(adminData?.totalPaid || 0);
    const totalDue = parseFloat(adminData?.totalDue || 0);
    const totalBilled = totalPaid + totalDue;
    const collectionPct = totalBilled > 0 ? Math.round((totalPaid / totalBilled) * 100) : 0;

    return (
      <PageContainer
        title="Operations Center"
        description={`School administration overview as of ${new Date().toLocaleDateString()}`}
      >
        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700 flex items-center justify-between gap-3">
            <span>{error}</span>
            <Button size="sm" variant="outline" onClick={loadDashboardData}>
              Try Again
            </Button>
          </div>
        )}

        {/* Operational KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Students"
            value={adminData?.totalStudents || 0}
            icon={<Users size={22} />}
            color="blue"
            subtitle="Enrolled active learners"
            onClick={() => navigate('/students')}
          />
          <StatCard
            title="Active Faculty"
            value={adminData?.totalTeachers || 0}
            icon={<GraduationCap size={22} />}
            color="purple"
            subtitle="Teaching departments"
            onClick={() => navigate('/teachers')}
          />
          <StatCard
            title="Tuition Collected"
            value={`$${totalPaid.toLocaleString()}`}
            icon={<Coins size={22} />}
            color="emerald"
            subtitle={`${collectionPct}% collection rate`}
            onClick={() => navigate('/fees')}
          />
          <StatCard
            title="Outstanding Dues"
            value={`$${totalDue.toLocaleString()}`}
            icon={<AlertTriangle size={22} />}
            color="amber"
            subtitle="Pending fee receivables"
            onClick={() => navigate('/fees')}
          />
        </div>

        {/* Quick Operations Actions */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm mb-8">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
            Quick Administrative Actions
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <button
              type="button"
              onClick={() => navigate('/students')}
              className="p-4 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-indigo-50/50 hover:border-indigo-200 transition-all flex flex-col items-center text-center gap-2 group"
            >
              <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all">
                <Users size={20} />
              </div>
              <span className="text-xs font-bold text-slate-800">Enroll Student</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/teachers')}
              className="p-4 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-purple-50/50 hover:border-purple-200 transition-all flex flex-col items-center text-center gap-2 group"
            >
              <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-purple-600 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-all">
                <GraduationCap size={20} />
              </div>
              <span className="text-xs font-bold text-slate-800">Manage Faculty</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/attendance')}
              className="p-4 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-emerald-50/50 hover:border-emerald-200 transition-all flex flex-col items-center text-center gap-2 group"
            >
              <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all">
                <Calendar size={20} />
              </div>
              <span className="text-xs font-bold text-slate-800">Mark Attendance</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/fees')}
              className="p-4 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-amber-50/50 hover:border-amber-200 transition-all flex flex-col items-center text-center gap-2 group"
            >
              <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-amber-600 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-all">
                <Coins size={20} />
              </div>
              <span className="text-xs font-bold text-slate-800">Fee Structures</span>
            </button>
          </div>
        </div>

        {/* Bottom Split: Fee Real Progress & Live Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Financial Collection Progress</h3>
                <p className="text-xs text-slate-400">Total institutional billing settlement status</p>
              </div>
              <span className="text-lg font-black text-slate-900">{collectionPct}%</span>
            </div>

            <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden flex mb-6">
              <div
                className="bg-emerald-500 h-full transition-all duration-500"
                style={{ width: `${collectionPct}%` }}
              ></div>
              <div
                className="bg-amber-400 h-full transition-all duration-500"
                style={{ width: `${100 - collectionPct}%` }}
              ></div>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-100 text-center">
              <div>
                <p className="text-2xs font-semibold text-slate-400 uppercase">Total Billed</p>
                <p className="text-base font-bold text-slate-800 mt-0.5">${totalBilled.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-2xs font-semibold text-emerald-600 uppercase">Total Paid</p>
                <p className="text-base font-bold text-emerald-600 mt-0.5">${totalPaid.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-2xs font-semibold text-amber-600 uppercase">Outstanding</p>
                <p className="text-base font-bold text-amber-600 mt-0.5">${totalDue.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
              <ShieldCheck size={16} className="text-indigo-600" /> Recent Activity Log
            </h3>
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {adminData?.recentActivity?.length > 0 ? (
                adminData.recentActivity.map((log) => (
                  <div key={log.id} className="p-3 rounded-xl bg-slate-50/60 border border-slate-100 text-xs">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-bold text-slate-800 truncate">{log.action}</span>
                      <span className="text-3xs text-slate-400 flex-shrink-0">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-slate-500 text-2xs truncate">
                      {log.entityType ? `${log.entityType} record` : 'System action'}
                    </p>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No recent audit events recorded today.
                </div>
              )}
            </div>
          </div>
        </div>
      </PageContainer>
    );
  }

  // =========================================================================
  // 2. TEACHER COCKPIT
  // =========================================================================
  if (roleName === 'Teacher') {
    const todayClasses = teacherSchedule.filter((item) => item.dayOfWeek === todayName);

    return (
      <PageContainer
        title="Faculty Workspace"
        description={`Teaching schedule and assigned academic duties for ${user.name}`}
      >
        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700 flex items-center justify-between gap-3">
            <span>{error}</span>
            <Button size="sm" variant="outline" onClick={loadDashboardData}>
              Try Again
            </Button>
          </div>
        )}
        {/* Faculty Profile Strip */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-black text-xl flex-shrink-0">
              {user.name.charAt(0)}
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-800">{user.name}</h2>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <Badge variant="indigo">{user.teacherProfile?.employeeNo || 'FACULTY'}</Badge>
                <span className="text-xs text-slate-500 font-medium">
                  {user.teacherProfile?.department || 'General'} Department
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="primary" onClick={() => navigate('/attendance')}>
              <CheckCircle2 size={16} className="mr-2" /> Take Attendance
            </Button>
          </div>
        </div>

        {/* Schedule & Exams Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Today's Class Schedule ({todayName})</h3>
                  <p className="text-xs text-slate-400">Assigned lecture periods and venues</p>
                </div>
                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
                  {todayClasses.length} Periods Today
                </span>
              </div>

              {todayClasses.length > 0 ? (
                <div className="space-y-3">
                  {todayClasses.map((period) => (
                    <div
                      key={period.id}
                      className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center justify-between hover:bg-slate-50 transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs shadow-2xs">
                          <Clock size={16} className="text-indigo-600" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-800">
                            {period.subject?.name} <span className="text-xs text-slate-400">({period.subject?.code})</span>
                          </h4>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Class: <span className="font-semibold text-slate-700">{period.class?.name}</span> • Room: <span className="font-semibold text-slate-700">{period.roomNumber || 'Main Hall'}</span>
                          </p>
                        </div>
                      </div>
                      <div className="text-right font-mono text-xs font-bold text-slate-700 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                        {period.startTime?.slice(0, 5)} - {period.endTime?.slice(0, 5)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
                  No classes assigned for {todayName}.
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Upcoming Examination Cycles */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                <FileText size={16} className="text-purple-600" /> Scheduled Exams
              </h3>
              {teacherExams.length > 0 ? (
                <div className="space-y-3">
                  {teacherExams.slice(0, 4).map((exam) => (
                    <div key={exam.id} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-slate-800">{exam.name}</span>
                        <Badge variant={exam.status === 'PUBLISHED' ? 'success' : 'neutral'}>
                          {exam.status}
                        </Badge>
                      </div>
                      <p className="text-3xs text-slate-400">
                        {new Date(exam.startDate).toLocaleDateString()} to {new Date(exam.endDate).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 text-center py-6">No scheduled examinations.</p>
              )}
            </div>
          </div>
        </div>
      </PageContainer>
    );
  }

  // =========================================================================
  // 3. STUDENT COCKPIT
  // =========================================================================
  if (roleName === 'Student') {
    const totalDays = studentData.attendance.length;
    const presentCount = studentData.attendance.filter((r) => r.status === 'PRESENT').length;
    const attendancePct = totalDays > 0 ? Math.round((presentCount / totalDays) * 100) : 100;
    const todayClasses = studentData.timetable.filter((t) => t.dayOfWeek === todayName);

    let totalDue = 0;
    studentData.invoices.forEach((inv) => {
      totalDue += parseFloat(inv.dueAmount || 0);
    });

    return (
      <PageContainer
        title="Student Portal"
        description={`Welcome back, ${user.name}`}
      >
        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700 flex items-center justify-between gap-3">
            <span>{error}</span>
            <Button size="sm" variant="outline" onClick={loadDashboardData}>
              Try Again
            </Button>
          </div>
        )}
        {/* Student Profile Strip */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-xl flex-shrink-0">
              {user.name.charAt(0)}
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-800">{user.name}</h2>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <Badge variant="indigo">{user.studentProfile?.admissionNo || 'ENROLLED'}</Badge>
                <span className="text-xs text-slate-500 font-medium">Academic Year 2026-2027</span>
              </div>
            </div>
          </div>
          <Button variant="outline" onClick={() => navigate('/examinations')}>
            View Report Card
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Attendance Standing"
            value={`${attendancePct}%`}
            icon={<CheckCircle2 size={22} />}
            color={attendancePct >= 75 ? 'emerald' : 'rose'}
            subtitle={`${presentCount} present of ${totalDays} school days`}
          />
          <StatCard
            title="Classes Today"
            value={`${todayClasses.length} Periods`}
            icon={<Clock size={22} />}
            color="blue"
            subtitle={`${todayName} class roster`}
          />
          <StatCard
            title="Outstanding Tuition"
            value={`$${totalDue.toLocaleString()}`}
            icon={<Coins size={22} />}
            color={totalDue === 0 ? 'emerald' : 'amber'}
            subtitle={totalDue === 0 ? 'Fully settled' : 'Pending payment'}
            onClick={() => navigate('/fees')}
          />
        </div>

        {/* Timetable Schedule */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
              <BookOpen size={16} className="text-indigo-600" /> Today's Classes ({todayName})
            </h3>
            {todayClasses.length > 0 ? (
              <div className="space-y-3">
                {todayClasses.map((t) => (
                  <div key={t.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">{t.subject?.name}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Teacher: {t.teacher?.user?.name || 'Faculty'} • Room: {t.roomNumber || 'Standard'}
                      </p>
                    </div>
                    <span className="font-mono text-xs font-bold text-slate-700 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                      {t.startTime?.slice(0, 5)} - {t.endTime?.slice(0, 5)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-10 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
                No classes scheduled for {todayName}.
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center justify-between">
              <span>Tuition Invoices</span>
              <button
                type="button"
                onClick={() => navigate('/fees')}
                className="text-xs text-indigo-600 font-bold hover:underline"
              >
                View all
              </button>
            </h3>
            {studentData.invoices.length > 0 ? (
              <div className="space-y-3">
                {studentData.invoices.slice(0, 3).map((inv) => (
                  <div key={inv.id} className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-800">Invoice #{inv.id.slice(0, 8)}</span>
                      <Badge variant={inv.status === 'PAID' ? 'success' : 'neutral'}>{inv.status}</Badge>
                    </div>
                    <p className="text-slate-500 text-2xs">
                      Due: ${parseFloat(inv.dueAmount).toFixed(2)} of ${parseFloat(inv.totalAmount).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 text-center py-6">No invoices on file.</p>
            )}
          </div>
        </div>
      </PageContainer>
    );
  }

  // =========================================================================
  // 4. PARENT COCKPIT
  // =========================================================================
  if (roleName === 'Parent') {
    const { children, selectedChild, childAttendance, childInvoices, childSchedule } = parentData;
    const totalDays = childAttendance.length;
    const presentCount = childAttendance.filter((r) => r.status === 'PRESENT').length;
    const attendancePct = totalDays > 0 ? Math.round((presentCount / totalDays) * 100) : 100;
    const todayClasses = childSchedule.filter((t) => t.dayOfWeek === todayName);

    let childDue = 0;
    childInvoices.forEach((inv) => {
      childDue += parseFloat(inv.dueAmount || 0);
    });

    return (
      <PageContainer
        title="Parent Portal"
        description="Monitor your children's daily attendance, timetable, and school tuition"
      >
        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700 flex items-center justify-between gap-3">
            <span>{error}</span>
            <Button size="sm" variant="outline" onClick={loadDashboardData}>
              Try Again
            </Button>
          </div>
        )}
        <ChildSelector
          children={children}
          selectedChild={selectedChild}
          onSelectChild={handleSelectChild}
        />

        {selectedChild ? (
          <>
            {/* Child Header Card */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-xl flex-shrink-0">
                  {selectedChild.user?.name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-800">{selectedChild.user?.name}</h2>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <Badge variant="indigo">{selectedChild.admissionNo}</Badge>
                    <span className="text-xs text-slate-500 font-medium">
                      Class: {selectedChild.class?.name || 'Assigned'} • Section: {selectedChild.section?.name || 'A'}
                    </span>
                  </div>
                </div>
              </div>
              <Button variant="outline" onClick={() => navigate('/examinations')}>
                Exams & Grades
              </Button>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <StatCard
                title="Child Attendance Standing"
                value={`${attendancePct}%`}
                icon={<CheckCircle2 size={22} />}
                color={attendancePct >= 75 ? 'emerald' : 'rose'}
                subtitle={`${presentCount} present of ${totalDays} total recorded days`}
              />
              <StatCard
                title="Today's Timetable"
                value={`${todayClasses.length} Classes`}
                icon={<Clock size={22} />}
                color="blue"
                subtitle={`Scheduled for ${todayName}`}
              />
              <StatCard
                title="Tuition Balance Due"
                value={`$${childDue.toLocaleString()}`}
                icon={<Coins size={22} />}
                color={childDue === 0 ? 'emerald' : 'amber'}
                subtitle={childDue === 0 ? 'All fees settled' : 'Click to pay invoices'}
                onClick={() => navigate('/fees')}
              />
            </div>

            {/* Bottom Timetable & Invoice List */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <BookOpen size={16} className="text-indigo-600" /> Today's Schedule ({todayName})
                </h3>
                {todayClasses.length > 0 ? (
                  <div className="space-y-3">
                    {todayClasses.map((t) => (
                      <div key={t.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-bold text-slate-800">{t.subject?.name}</h4>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Teacher: {t.teacher?.user?.name || 'Faculty'} • Room: {t.roomNumber || 'Main'}
                          </p>
                        </div>
                        <span className="font-mono text-xs font-bold text-slate-700 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                          {t.startTime?.slice(0, 5)} - {t.endTime?.slice(0, 5)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-10 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
                    No classes scheduled for {todayName}.
                  </div>
                )}
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-slate-800">Child Invoices</h3>
                  <button
                    type="button"
                    onClick={() => navigate('/fees')}
                    className="text-xs text-indigo-600 font-bold hover:underline"
                  >
                    Pay fees
                  </button>
                </div>
                {childInvoices.length > 0 ? (
                  <div className="space-y-3">
                    {childInvoices.slice(0, 3).map((inv) => (
                      <div key={inv.id} className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-slate-800">Invoice #{inv.id.slice(0, 8)}</span>
                          <Badge variant={inv.status === 'PAID' ? 'success' : 'neutral'}>{inv.status}</Badge>
                        </div>
                        <p className="text-slate-500 text-2xs">
                          Outstanding: ${parseFloat(inv.dueAmount).toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 text-center py-6">No invoices on file.</p>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center shadow-sm">
            <Users size={32} className="mx-auto text-slate-300 mb-3" />
            <h3 className="text-sm font-bold text-slate-800 mb-1">No Associated Student Profiles</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Your parent account is active, but no student records are currently linked to your profile in this school. Please contact your school administrator.
            </p>
          </div>
        )}
      </PageContainer>
    );
  }

  // Fallback if unexpected role
  return (
    <PageContainer title="Dashboard" description="Welcome to School Management System">
      <div className="bg-white rounded-2xl border border-slate-100 p-8 shadow-sm text-center">
        <p className="text-sm text-slate-600">Logged in as {user.name} ({roleName})</p>
      </div>
    </PageContainer>
  );
};

export default Dashboard;
