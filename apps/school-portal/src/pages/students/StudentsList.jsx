import { Table, Button, Modal, Input } from '@sms/ui-kit';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api from '@sms/api-client';
import PageContainer from '../../components/layout/PageContainer';




import { Plus, UserCheck, UserMinus, Edit } from 'lucide-react';

const studentFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters').optional().or(z.literal('')),
  classId: z.string().min(1, 'Class is required'),
  sectionId: z.string().min(1, 'Section is required'),
  parentId: z.string().optional().or(z.literal('')),
});

const StudentsList = () => {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterClass, setFilterClass] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [formError, setFormError] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(studentFormSchema)
  });

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await api.get('/students', {
        params: {
          search,
          classId: filterClass,
          page,
          limit: 10,
          status: 'ACTIVE'
        }
      });
      setStudents(res.data.students);
      setTotalPages(res.data.pagination.totalPages);
    } catch (err) {
      console.error('Failed to load students:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAcademics = async () => {
    try {
      const classRes = await api.get('/academics/classes');
      setClasses(classRes.data.classes);
      
      const secRes = await api.get('/academics/sections');
      setSections(secRes.data.sections);
    } catch (err) {
      console.error('Failed to load classes or sections:', err);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [search, filterClass, page]);

  useEffect(() => {
    fetchAcademics();
  }, []);

  const handleOpenAddModal = () => {
    setEditingStudent(null);
    reset({
      name: '',
      email: '',
      password: '',
      classId: '',
      sectionId: '',
      parentId: ''
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (student) => {
    setEditingStudent(student);
    reset({
      name: student.user.name,
      email: student.user.email,
      password: '',
      classId: student.classId || '',
      sectionId: student.sectionId || '',
      parentId: student.parentId || ''
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleDeactivate = async (studentId) => {
    if (!window.confirm('Are you sure you want to deactivate (soft delete) this student profile?')) return;
    try {
      await api.delete(`/students/${studentId}`);
      fetchStudents();
    } catch (err) {
      console.error('Deactivation failed:', err);
      alert('Could not deactivate student.');
    }
  };

  const onSubmit = async (data) => {
    setFormError('');
    setFormSubmitting(true);
    try {
      if (editingStudent) {
        await api.put(`/students/${editingStudent.id}`, {
          name: data.name,
          email: data.email,
          classId: data.classId,
          sectionId: data.sectionId,
          parentId: data.parentId || null
        });
      } else {
        if (!data.password) {
          setFormError('Password is required for new students.');
          setFormSubmitting(false);
          return;
        }
        await api.post('/students', data);
      }
      setIsModalOpen(false);
      fetchStudents();
    } catch (err) {
      console.error('Form submission failed:', err);
      const msg = err.response?.data?.message || 'Error occurred. Please verify input parameters.';
      setFormError(msg);
    } finally {
      setFormSubmitting(false);
    }
  };

  const columns = [
    {
      header: 'Admission No',
      accessor: 'admissionNo',
      render: (val) => <span className="font-bold text-indigo-600">{val}</span>
    },
    {
      header: 'Name',
      accessor: (row) => row.user.name
    },
    {
      header: 'Email',
      accessor: (row) => row.user.email
    },
    {
      header: 'Class',
      accessor: (row) => row.class?.name || 'Unassigned'
    },
    {
      header: 'Section',
      accessor: (row) => row.section?.name || 'Unassigned'
    },
    {
      header: 'Actions',
      accessor: 'id',
      render: (val, row) => (
        <div className="flex gap-2">
          <Button 
            variant="ghost" 
            onClick={() => handleOpenEditModal(row)}
            className="p-1.5 text-indigo-600 hover:bg-indigo-50"
            icon={<Edit size={16} />}
          >
            Edit
          </Button>
          <Button 
            variant="ghost" 
            onClick={() => handleDeactivate(row.id)}
            className="p-1.5 text-rose-600 hover:bg-rose-50"
            icon={<UserMinus size={16} />}
          >
            Deactivate
          </Button>
        </div>
      )
    }
  ];

  const tableFilters = (
    <div className="flex gap-3">
      <select
        value={filterClass}
        onChange={(e) => { setFilterClass(e.target.value); setPage(1); }}
        className="px-3 py-2 text-xs font-semibold bg-white border border-slate-200 rounded-xl focus:outline-none"
      >
        <option value="">All Classes</option>
        {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
    </div>
  );

  return (
    <PageContainer 
      title="Student Directory" 
      description="Manage admissions, class assignments, and parent mappings"
      action={
        <Button 
          variant="primary" 
          onClick={handleOpenAddModal}
          icon={<Plus size={18} />}
        >
          Add Student
        </Button>
      }
    >
      <Table
        columns={columns}
        data={students}
        loading={loading}
        pagination={{
          totalPages,
          currentPage: page,
          onPageChange: (p) => setPage(p)
        }}
        searchValue={search}
        onSearchChange={(val) => { setSearch(val); setPage(1); }}
        filters={tableFilters}
        emptyMessage="No students matched your search criteria."
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingStudent ? 'Edit Student Details' : 'Register New Student'}
        footer={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSubmit(onSubmit)} loading={formSubmitting}>
              {editingStudent ? 'Save Changes' : 'Register Admission'}
            </Button>
          </div>
        }
      >
        {formError && (
          <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-xs font-semibold text-red-400">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Student Full Name"
            placeholder="Jane Doe"
            error={errors.name}
            required
            {...register('name')}
          />

          <Input
            label="Email Address"
            type="email"
            placeholder="jane@school.com"
            error={errors.email}
            required
            {...register('email')}
          />

          {!editingStudent && (
            <Input
              label="Default Login Password"
              type="password"
              placeholder="••••••••"
              error={errors.password}
              required
              {...register('password')}
            />
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700">Class <span className="text-red-500">*</span></label>
              <select
                {...register('classId')}
                className="px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              >
                <option value="">Select Class</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              {errors.classId && <span className="text-xs text-red-500">{errors.classId.message}</span>}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700">Section <span className="text-red-500">*</span></label>
              <select
                {...register('sectionId')}
                className="px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              >
                <option value="">Select Section</option>
                {sections.map(s => <option key={s.id} value={s.id}>{s.name} ({s.class?.name})</option>)}
              </select>
              {errors.sectionId && <span className="text-xs text-red-500">{errors.sectionId.message}</span>}
            </div>
          </div>

          <Input
            label="Parent / Guardian ID (Optional)"
            placeholder="e.g. UUID profile ID"
            error={errors.parentId}
            {...register('parentId')}
          />
        </form>
      </Modal>
    </PageContainer>
  );
};

export default StudentsList;
