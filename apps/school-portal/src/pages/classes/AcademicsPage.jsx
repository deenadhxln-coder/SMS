import { Button, Modal, Input, Table } from '@sms/ui-kit';
import React, { useEffect, useState } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import useAuthStore from '@sms/auth';
import api from '@sms/api-client';
import PageContainer from '../../components/layout/PageContainer';
import WeeklyTimetableGrid from './WeeklyTimetableGrid';

import { Plus, Bookmark, Layers, BookOpen, Link, Calendar } from 'lucide-react';

const AcademicsPage = () => {
  const { user } = useAuthStore();
  const roleName = user?.role?.name || user?.role || '';
  const isAdmin = roleName === 'Super Admin' || roleName === 'School Admin';

  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();

  const VALID_TABS = ['classes', 'sections', 'subjects', 'mappings', 'timetable'];
  const queryTab = searchParams.get('tab');
  const defaultTab = location.pathname.includes('/subjects') ? 'subjects' : 'classes';
  const activeTab = VALID_TABS.includes(queryTab) ? queryTab : defaultTab;

  const setActiveTab = (tab) => {
    setSearchParams({ tab });
  };

  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [mappings, setMappings] = useState([]);
  const [timetables, setTimetables] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Timetable filter states
  const [timetableClassId, setTimetableClassId] = useState('');
  const [timetableTeacherId, setTimetableTeacherId] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('');
  const [modalError, setModalError] = useState('');

  const [classForm, setClassForm] = useState({ name: '', academicYearId: '2026-2027' });
  const [sectionForm, setSectionForm] = useState({ classId: '', name: '', classTeacherId: '' });
  const [subForm, setSubForm] = useState({ name: '', code: '' });
  const [mapForm, setMapForm] = useState({ classId: '', subjectId: '', teacherId: '' });
  const [timetableForm, setTimetableForm] = useState({ classId: '', subjectId: '', teacherId: '', dayOfWeek: 'MONDAY', startTime: '09:00', endTime: '10:00', roomNumber: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'classes') {
        const res = await api.get('/academics/classes');
        setClasses(res.data.classes);
      } else if (activeTab === 'sections') {
        const res = await api.get('/academics/sections');
        setSections(res.data.sections);
      } else if (activeTab === 'subjects') {
        const res = await api.get('/academics/subjects');
        setSubjects(res.data.subjects);
      } else if (activeTab === 'mappings') {
        const res = await api.get('/academics/class-subjects');
        setMappings(res.data.mappings);
      } else if (activeTab === 'timetable') {
        const params = {};
        if (timetableClassId) params.classId = timetableClassId;
        if (timetableTeacherId) params.teacherId = timetableTeacherId;
        const res = await api.get('/academics/timetable', { params });
        setTimetables(res.data.timetables);
      }


      const tRes = await api.get('/teachers');
      setTeachers(tRes.data.teachers);
      
      const cRes = await api.get('/academics/classes');
      setClasses(cRes.data.classes);

      const sRes = await api.get('/academics/subjects');
      setSubjects(sRes.data.subjects);
    } catch (err) {
      console.error('Failed to load academic records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab, timetableClassId, timetableTeacherId]);

  const handleOpenAddModal = () => {
    setModalError('');
    if (activeTab === 'classes') {
      setModalType('class');
      setClassForm({ name: '', academicYearId: '2026-2027' });
    } else if (activeTab === 'sections') {
      setModalType('section');
      setSectionForm({ classId: classes[0]?.id || '', name: '', classTeacherId: '' });
    } else if (activeTab === 'subjects') {
      setModalType('subject');
      setSubForm({ name: '', code: '' });
    } else if (activeTab === 'mappings') {
      setModalType('mapping');
      setMapForm({ classId: classes[0]?.id || '', subjectId: subjects[0]?.id || '', teacherId: teachers[0]?.id || '' });
    } else if (activeTab === 'timetable') {
      setModalType('timetable');
      setTimetableForm({ classId: classes[0]?.id || '', subjectId: subjects[0]?.id || '', teacherId: teachers[0]?.id || '', dayOfWeek: 'MONDAY', startTime: '09:00', endTime: '10:00', roomNumber: '' });
    }
    setIsModalOpen(true);
  };

  const handleSaveConfig = async () => {
    setModalError('');
    try {
      if (modalType === 'class') {
        await api.post('/academics/classes', classForm);
      } else if (modalType === 'section') {
        await api.post('/academics/sections', sectionForm);
      } else if (modalType === 'subject') {
        await api.post('/academics/subjects', subForm);
      } else if (modalType === 'mapping') {
        await api.post('/academics/class-subjects', mapForm);
      } else if (modalType === 'timetable') {
        await api.post('/academics/timetable', timetableForm);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      setModalError(err.response?.data?.message || 'Failed to save configuration');
    }
  };

  return (
    <PageContainer
      title="Academic Configuration"
      description="Configure academic parameters, sections, courses, and mappings"
      action={
        <Button variant="primary" onClick={handleOpenAddModal} icon={<Plus size={18} />}>
          Add {activeTab.slice(0, -1)}
        </Button>
      }
    >
      {/* Tabs list */}
      <div className="flex border-b border-slate-100 gap-4 mb-6">
        <button
          onClick={() => setActiveTab('classes')}
          className={`pb-3 px-1 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'classes' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-650'
          }`}
        >
          <Bookmark size={18} />
          <span>Classes</span>
        </button>

        <button
          onClick={() => setActiveTab('sections')}
          className={`pb-3 px-1 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'sections' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-650'
          }`}
        >
          <Layers size={18} />
          <span>Sections</span>
        </button>

        <button
          onClick={() => setActiveTab('subjects')}
          className={`pb-3 px-1 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'subjects' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-650'
          }`}
        >
          <BookOpen size={18} />
          <span>Subjects</span>
        </button>

        <button
          onClick={() => setActiveTab('mappings')}
          className={`pb-3 px-1 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'mappings' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-650'
          }`}
        >
          <Link size={18} />
          <span>Subject Assignments</span>
        </button>

        <button
          onClick={() => setActiveTab('timetable')}
          className={`pb-3 px-1 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'timetable' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-650'
          }`}
        >
          <Calendar size={18} />
          <span>Timetable</span>
        </button>
      </div>

      {activeTab === 'classes' && (
        <Table
          columns={[
            { header: 'Class Name', accessor: 'name' },
            { header: 'Term Year', accessor: 'academicYearId' },
            { header: 'Sections', accessor: (row) => row.sections?.map(s => s.name).join(', ') || 'None' }
          ]}
          data={classes}
          loading={loading}
        />
      )}

      {activeTab === 'sections' && (
        <Table
          columns={[
            { header: 'Section Name', accessor: 'name' },
            { header: 'Class', accessor: (row) => row.class?.name || 'None' },
            { header: 'Class Teacher', accessor: (row) => row.classTeacher?.user?.name || 'Unassigned' }
          ]}
          data={sections}
          loading={loading}
        />
      )}

      {activeTab === 'subjects' && (
        <Table
          columns={[
            { header: 'Code', accessor: 'code', render: (val) => <span className="font-bold text-indigo-650">{val}</span> },
            { header: 'Subject Name', accessor: 'name' }
          ]}
          data={subjects}
          loading={loading}
        />
      )}

      {activeTab === 'mappings' && (
        <Table
          columns={[
            { header: 'Class', accessor: (row) => row.class?.name },
            { header: 'Subject', accessor: (row) => row.subject?.name },
            { header: 'Assigned Teacher', accessor: (row) => row.teacher?.user?.name }
          ]}
          data={mappings}
          loading={loading}
        />
      )}

      {activeTab === 'timetable' && (
        <WeeklyTimetableGrid
          timetables={timetables}
          loading={loading}
          classes={classes}
          teachers={teachers}
          selectedClassId={timetableClassId}
          onClassChange={setTimetableClassId}
          selectedTeacherId={timetableTeacherId}
          onTeacherChange={setTimetableTeacherId}
          onDeleteSlot={async (slotId) => {
            await api.delete(`/academics/timetable/${slotId}`);
            fetchData();
          }}
          isAdmin={isAdmin}
        />
      )}

      {/* MODAL CONFIGURATOR */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Add ${modalType?.toUpperCase()}`}
        footer={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSaveConfig}>Create</Button>
          </div>
        }
      >
        {modalError && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-xs font-semibold text-red-600 rounded-xl">{modalError}</div>}
        
        {modalType === 'class' && (
          <div className="space-y-4">
            <Input label="Class Name" placeholder="e.g. Class 10-A, Grade 8" value={classForm.name} onChange={(e) => setClassForm(prev => ({ ...prev, name: e.target.value }))} />
            <Input label="Academic Year" placeholder="2026-2027" value={classForm.academicYearId} onChange={(e) => setClassForm(prev => ({ ...prev, academicYearId: e.target.value }))} />
          </div>
        )}

        {modalType === 'section' && (
          <div className="space-y-4">
            <Input label="Section Name" placeholder="e.g. Section A, Section B" value={sectionForm.name} onChange={(e) => setSectionForm(prev => ({ ...prev, name: e.target.value }))} />
            
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-700">Link Class</label>
              <select value={sectionForm.classId} onChange={(e) => setSectionForm(prev => ({ ...prev, classId: e.target.value }))} className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-700">Class Teacher (Optional)</label>
              <select value={sectionForm.classTeacherId} onChange={(e) => setSectionForm(prev => ({ ...prev, classTeacherId: e.target.value }))} className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
                <option value="">None</option>
                {teachers.map(t => <option key={t.id} value={t.id}>{t.user?.name}</option>)}
              </select>
            </div>
          </div>
        )}

        {modalType === 'subject' && (
          <div className="space-y-4">
            <Input label="Subject Name" placeholder="e.g. Algebra, History" value={subForm.name} onChange={(e) => setSubForm(prev => ({ ...prev, name: e.target.value }))} />
            <Input label="Subject Code (Unique)" placeholder="e.g. MATH101" value={subForm.code} onChange={(e) => setSubForm(prev => ({ ...prev, code: e.target.value }))} />
          </div>
        )}

        {modalType === 'mapping' && (
          <div className="space-y-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-700">Class</label>
              <select value={mapForm.classId} onChange={(e) => setMapForm(prev => ({ ...prev, classId: e.target.value }))} className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-700">Subject</label>
              <select value={mapForm.subjectId} onChange={(e) => setMapForm(prev => ({ ...prev, subjectId: e.target.value }))} className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-700">Teacher</label>
              <select value={mapForm.teacherId} onChange={(e) => setMapForm(prev => ({ ...prev, teacherId: e.target.value }))} className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
                {teachers.map(t => <option key={t.id} value={t.id}>{t.user?.name}</option>)}
              </select>
            </div>
          </div>
        )}

        {modalType === 'timetable' && (
          <div className="space-y-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-700">Class</label>
              <select value={timetableForm.classId} onChange={(e) => setTimetableForm(prev => ({ ...prev, classId: e.target.value }))} className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-700">Subject</label>
              <select value={timetableForm.subjectId} onChange={(e) => setTimetableForm(prev => ({ ...prev, subjectId: e.target.value }))} className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-700">Teacher</label>
              <select value={timetableForm.teacherId} onChange={(e) => setTimetableForm(prev => ({ ...prev, teacherId: e.target.value }))} className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
                {teachers.map(t => <option key={t.id} value={t.id}>{t.user?.name}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-700">Day of Week</label>
                <select value={timetableForm.dayOfWeek} onChange={(e) => setTimetableForm(prev => ({ ...prev, dayOfWeek: e.target.value }))} className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
                  <option value="MONDAY">Monday</option>
                  <option value="TUESDAY">Tuesday</option>
                  <option value="WEDNESDAY">Wednesday</option>
                  <option value="THURSDAY">Thursday</option>
                  <option value="FRIDAY">Friday</option>
                  <option value="SATURDAY">Saturday</option>
                  <option value="SUNDAY">Sunday</option>
                </select>
              </div>
              <Input label="Room Number" placeholder="e.g. Room 101" value={timetableForm.roomNumber} onChange={(e) => setTimetableForm(prev => ({ ...prev, roomNumber: e.target.value }))} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input label="Start Time" placeholder="e.g. 09:00" value={timetableForm.startTime} onChange={(e) => setTimetableForm(prev => ({ ...prev, startTime: e.target.value }))} />
              <Input label="End Time" placeholder="e.g. 10:00" value={timetableForm.endTime} onChange={(e) => setTimetableForm(prev => ({ ...prev, endTime: e.target.value }))} />
            </div>
          </div>
        )}
      </Modal>

    </PageContainer>
  );
};

export default AcademicsPage;
