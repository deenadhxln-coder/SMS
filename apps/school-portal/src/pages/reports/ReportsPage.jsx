import React, { useEffect, useState } from 'react';
import api from '@sms/api-client';
import PageContainer from '../../components/layout/PageContainer';
import { Button } from '@sms/ui-kit';
import { Printer, TrendingUp, BarChart2, CalendarRange } from 'lucide-react';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const ReportsPage = () => {
  const [reportType, setReportType] = useState('attendance');
  const [reportData, setReportData] = useState([]);
  const [exams, setExams] = useState([]);
  const [classes, setClasses] = useState([]);
  
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedExam, setSelectedExam] = useState('');
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const clsRes = await api.get('/academics/classes');
        setClasses(clsRes.data.classes);
        if (clsRes.data.classes.length > 0) setSelectedClass(clsRes.data.classes[0].id);

        const examRes = await api.get('/exams');
        setExams(examRes.data.exams);
        if (examRes.data.exams.length > 0) setSelectedExam(examRes.data.exams[0].id);
      } catch (err) {
        console.error('Failed to load filter metadata:', err);
      }
    };
    fetchMetadata();
  }, []);

  const runReport = async () => {
    setLoading(true);
    try {
      const params = {};
      if (reportType === 'attendance' && selectedClass) {
        params.classId = selectedClass;
      }
      if (reportType === 'exams' && selectedExam) {
        params.examId = selectedExam;
      }

      const res = await api.get(`/reports/${reportType}`, { params });
      setReportData(res.data.stats || res.data.classAverages || res.data.classFees || []);
    } catch (err) {
      console.error('Failed to run analytics report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedClass || selectedExam || reportType) {
      runReport();
    }
  }, [reportType, selectedClass, selectedExam]);

  const handlePrint = () => {
    window.print();
  };

  const getChartData = () => {
    if (reportType === 'attendance') {
      return reportData.map(item => ({
        name: item.class?.name || 'Class',
        [item.status]: parseInt(item.count)
      }));
    }
    
    if (reportType === 'exams') {
      return reportData.map(item => ({
        name: classes.find(c => c.id === item.classId)?.name || 'Class',
        'Avg Mark': parseFloat(item.avgMarks).toFixed(1),
        'Max Mark': parseFloat(item.maxMarks).toFixed(1)
      }));
    }

    if (reportType === 'fees') {
      return reportData.map(item => ({
        name: item['student.class.name'] || 'Class',
        Collected: parseFloat(item.totalPaid),
        Outstanding: parseFloat(item.totalDue)
      }));
    }
    return [];
  };

  return (
    <PageContainer
      title="Reports & Insights"
      description="View real-time school logs, attendance averages, and collected fees balances"
      action={
        <Button variant="outline" onClick={handlePrint} icon={<Printer size={18} />}>
          Print Report
        </Button>
      }
    >
      <div className="flex flex-col gap-6">
        
        <div className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm flex flex-wrap gap-4 items-end justify-between">
          <div className="flex items-center gap-4 flex-wrap">
            
            <div className="flex flex-col gap-1">
              <label className="text-3xs font-extrabold uppercase tracking-wider text-slate-400">Report Focus</label>
              <select
                value={reportType}
                onChange={(e) => { setReportType(e.target.value); setReportData([]); }}
                className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none"
              >
                <option value="attendance">Class Attendance Ratios</option>
                <option value="exams">Term Exam Performance</option>
                <option value="fees">Fee Collection Statements</option>
              </select>
            </div>

            {reportType === 'attendance' && (
              <div className="flex flex-col gap-1">
                <label className="text-3xs font-extrabold uppercase tracking-wider text-slate-400">Class filter</label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none"
                >
                  <option value="">All Classes</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            )}

            {reportType === 'exams' && (
              <div className="flex flex-col gap-1">
                <label className="text-3xs font-extrabold uppercase tracking-wider text-slate-400">Select Exam Term</label>
                <select
                  value={selectedExam}
                  onChange={(e) => setSelectedExam(e.target.value)}
                  className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none"
                >
                  {exams.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>
            )}

          </div>

          <Button variant="secondary" onClick={runReport} loading={loading}>
            Refresh Analytics
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 p-6 shadow-sm min-h-80 flex flex-col justify-between">
            <h3 className="text-sm font-bold text-slate-800 mb-6 flex items-center gap-2">
              <BarChart2 size={18} className="text-indigo-655" />
              <span>Report Visualizations</span>
            </h3>

            {loading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : reportData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-xs text-slate-400 font-medium">
                No graphic stats available for current query.
              </div>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getChartData()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #f1f5f9' }} />
                    <Legend wrapperStyle={{ fontSize: '11px', fontWeight: '600' }} />
                    
                    {reportType === 'attendance' && (
                      <>
                        <Bar dataKey="PRESENT" name="Present" fill="#22c55e" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="ABSENT" name="Absent" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="LATE" name="Late" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                      </>
                    )}

                    {reportType === 'exams' && (
                      <>
                        <Bar dataKey="Avg Mark" name="Class Average" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Max Mark" name="Highest Score" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      </>
                    )}

                    {reportType === 'fees' && (
                      <>
                        <Bar dataKey="Collected" name="Paid Collected ($)" fill="#10b981" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Outstanding" name="Dues Outstanding ($)" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                      </>
                    )}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 mb-6 flex items-center gap-2">
              <TrendingUp size={18} className="text-indigo-655" />
              <span>Metrics Summary</span>
            </h3>

            <div className="space-y-4">
              {reportType === 'attendance' && (
                <div className="text-xs space-y-3 font-semibold text-slate-650">
                  <div className="flex justify-between border-b border-slate-50 pb-2">
                    <span>Average Daily Rate:</span>
                    <span className="text-green-600 font-bold">94.2%</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-50 pb-2">
                    <span>Tardiness Ratio:</span>
                    <span className="text-amber-500 font-bold">3.1%</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-50 pb-2">
                    <span>Unexcused Absences:</span>
                    <span className="text-rose-500 font-bold">2.7%</span>
                  </div>
                </div>
              )}

              {reportType === 'exams' && (
                <div className="text-xs space-y-3 font-semibold text-slate-655">
                  <div className="flex justify-between border-b border-slate-50 pb-2">
                    <span>Overall Pass Rate:</span>
                    <span className="text-green-600 font-bold">88.5%</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-50 pb-2">
                    <span>Highest Class Average:</span>
                    <span className="text-indigo-600 font-bold">82.1</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-50 pb-2">
                    <span>Subject Fail Ratio:</span>
                    <span className="text-rose-500 font-bold">4.2%</span>
                  </div>
                </div>
              )}

              {reportType === 'fees' && (
                <div className="text-xs space-y-3 font-semibold text-slate-655">
                  <div className="flex justify-between border-b border-slate-50 pb-2">
                    <span>Total Collection Rate:</span>
                    <span className="text-green-600 font-bold">78.2%</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-50 pb-2">
                    <span>Invoice Collections:</span>
                    <span className="text-slate-800 font-bold">Active Term</span>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </PageContainer>
  );
};

export default ReportsPage;
