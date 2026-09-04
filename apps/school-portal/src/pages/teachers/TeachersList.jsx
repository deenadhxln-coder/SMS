import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api from '@sms/api-client';
import useAuthStore from '@sms/auth';
import PageContainer from '../../components/layout/PageContainer';
import { Table, Button, Modal, Input, Select, Badge, ConfirmModal } from '@sms/ui-kit';
import { Plus, Edit, UserMinus } from 'lucide-react';

const DEPARTMENT_OPTIONS = [
  { label: 'Mathematics', value: 'Mathematics' },
  { label: 'Science', value: 'Science' },
  { label: 'English & Languages', value: 'English & Languages' },
  { label: 'Social Studies', value: 'Social Studies' },
  { label: 'Computer Science', value: 'Computer Science' },
  { label: 'Arts & Music', value: 'Arts & Music' },
  { label: 'Physical Education', value: 'Physical Education' },
  { label: 'General', value: 'General' }
];

const teacherCreateSchema = z.object({
  name: z.string().min(1, 'Full name is required'),
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  department: z.string().min(1, 'Department is required')
});

const teacherEditSchema = z.object({
  name: z.string().min(1, 'Full name is required'),
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  department: z.string().min(1, 'Department is required'),
  status: z.enum(['ACTIVE', 'INACTIVE'])
});

const TeachersList = () => {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'School Admin' || user?.role?.name === 'School Admin';

  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [deactivatingTeacher, setDeactivatingTeacher] = useState(null);
  const [deactivatingLoading, setDeactivatingLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [actionFeedback, setActionFeedback] = useState({ type: '', text: '' });

  const {
    register: registerAdd,
    handleSubmit: handleSubmitAdd,
    reset: resetAdd,
    formState: { errors: errorsAdd }
  } = useForm({
    resolver: zodResolver(teacherCreateSchema),
    defaultValues: { name: '', email: '', password: '', department: 'General' }
  });

  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    reset: resetEdit,
    formState: { errors: errorsEdit }
  } = useForm({
    resolver: zodResolver(teacherEditSchema),
    defaultValues: { name: '', email: '', department: 'General', status: 'ACTIVE' }
  });

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/teachers', {
        params: { search, page, limit: 10 }
      });
      setTeachers(res.data.teachers || []);
      if (res.data.pagination) {
        setTotalPages(res.data.pagination.totalPages || 1);
      }
    } catch (err) {
      console.error('Failed to load teachers roster:', err);
      setActionFeedback({
        type: 'error',
        text: err.userMessage || err.response?.data?.message || 'Failed to load faculty registry.',
        canRetry: true
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, [search, page]);

  const handleOpenAdd = () => {
    resetAdd({ name: '', email: '', password: '', department: 'General' });
    setFormError('');
    setIsAddOpen(true);
  };

  const handleOpenEdit = (teacher) => {
    setEditingTeacher(teacher);
    resetEdit({
      name: teacher.user?.name || '',
      email: teacher.user?.email || '',
      department: teacher.department || 'General',
      status: teacher.status || 'ACTIVE'
    });
    setFormError('');
  };

  const onSubmitAdd = async (data) => {
    try {
      setFormSubmitting(true);
      setFormError('');
      await api.post('/teachers', data);
      setIsAddOpen(false);
      resetAdd();
      setActionFeedback({
        type: 'success',
        text: `Faculty profile for ${data.name} created successfully.`
      });
      fetchTeachers();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create faculty profile.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const onSubmitEdit = async (data) => {
    if (!editingTeacher) return;
    try {
      setFormSubmitting(true);
      setFormError('');
      await api.put(`/teachers/${editingTeacher.id}`, data);
      setEditingTeacher(null);
      setActionFeedback({
        type: 'success',
        text: `Faculty profile for ${data.name} updated successfully.`
      });
      fetchTeachers();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to update faculty profile.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleConfirmDeactivate = async () => {
    if (!deactivatingTeacher) return;
    try {
      setDeactivatingLoading(true);
      await api.delete(`/teachers/${deactivatingTeacher.id}`);
      setActionFeedback({
        type: 'success',
        text: `Faculty profile for ${deactivatingTeacher.user?.name} deactivated.`
      });
      setDeactivatingTeacher(null);
      fetchTeachers();
    } catch (err) {
      setActionFeedback({
        type: 'error',
        text: err.response?.data?.message || 'Failed to deactivate faculty profile.'
      });
    } finally {
      setDeactivatingLoading(false);
    }
  };

  const columns = [
    {
      header: 'Employee No',
      accessor: 'employeeNo',
      render: (val) => <span className="font-bold text-indigo-600 tracking-wide">{val}</span>
    },
    {
      header: 'Name',
      accessor: (row) => row.user?.name || 'N/A'
    },
    {
      header: 'Email',
      accessor: (row) => row.user?.email || 'N/A'
    },
    {
      header: 'Department',
      accessor: 'department',
      render: (val) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
          {val}
        </span>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (val) => (
        <Badge variant={val === 'ACTIVE' ? 'success' : 'neutral'}>
          {val}
        </Badge>
      )
    },
    ...(isAdmin ? [{
      header: 'Actions',
      accessor: 'actions',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleOpenEdit(row)}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50/50 transition-all"
            title="Edit Faculty"
            aria-label={`Edit ${row.user?.name}`}
          >
            <Edit size={15} />
          </button>
          {row.status === 'ACTIVE' && (
            <button
              type="button"
              onClick={() => setDeactivatingTeacher(row)}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50/50 transition-all"
              title="Deactivate Faculty"
              aria-label={`Deactivate ${row.user?.name}`}
            >
              <UserMinus size={15} />
            </button>
          )}
        </div>
      )
    }] : [])
  ];

  return (
    <PageContainer
      title="Faculty Registry"
      description="Manage active faculty roster, departments, and teaching assignments"
      actions={
        isAdmin && (
          <Button variant="primary" onClick={handleOpenAdd}>
            <Plus size={16} className="mr-2" /> Add Faculty
          </Button>
        )
      }
    >
      {/* Dynamic Feedback Banner */}
      {actionFeedback.text && (
        <div className={`mb-6 p-4 rounded-xl text-xs font-semibold flex items-center justify-between animate-fade-in ${
          actionFeedback.type === 'error'
            ? 'bg-rose-50 border border-rose-200 text-rose-700'
            : 'bg-emerald-50 border border-emerald-200 text-emerald-700'
        }`}>
          <span>{actionFeedback.text}</span>
          <div className="flex items-center gap-2">
            {actionFeedback.canRetry && (
              <Button size="sm" variant="outline" onClick={fetchTeachers}>
                Retry
              </Button>
            )}
            <button
              onClick={() => setActionFeedback({ type: '', text: '' })}
              className="text-xs font-bold underline cursor-pointer hover:opacity-80"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <Table
        columns={columns}
        data={teachers}
        loading={loading}
        searchValue={search}
        onSearchChange={(val) => { setSearch(val); setPage(1); }}
        pagination={{
          currentPage: page,
          totalPages,
          onPageChange: setPage
        }}
        emptyMessage="No faculty records found."
        emptyDescription={search ? "Try adjusting your search query." : "Onboard faculty members to populate your school registry."}
      />

      {/* Add Faculty Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Add Faculty Member"
        size="md"
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddOpen(false)}
              disabled={formSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="add-teacher-form"
              variant="primary"
              loading={formSubmitting}
            >
              Create Faculty Profile
            </Button>
          </>
        }
      >
        <form id="add-teacher-form" onSubmit={handleSubmitAdd(onSubmitAdd)} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
              {formError}
            </div>
          )}
          <Input
            label="Full Name"
            placeholder="e.g. Dr. Arthur Pendelton"
            required
            {...registerAdd('name')}
            error={errorsAdd.name?.message}
          />
          <Input
            label="Work Email"
            type="email"
            placeholder="teacher@school.com"
            required
            {...registerAdd('email')}
            error={errorsAdd.email?.message}
          />
          <Input
            label="Initial Password"
            type="password"
            placeholder="At least 6 characters"
            required
            {...registerAdd('password')}
            error={errorsAdd.password?.message}
          />
          <Select
            label="Academic Department"
            options={DEPARTMENT_OPTIONS}
            required
            {...registerAdd('department')}
            error={errorsAdd.department?.message}
          />
        </form>
      </Modal>

      {/* Edit Faculty Modal */}
      <Modal
        isOpen={!!editingTeacher}
        onClose={() => setEditingTeacher(null)}
        title="Edit Faculty Profile"
        size="md"
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditingTeacher(null)}
              disabled={formSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="edit-teacher-form"
              variant="primary"
              loading={formSubmitting}
            >
              Save Changes
            </Button>
          </>
        }
      >
        <form id="edit-teacher-form" onSubmit={handleSubmitEdit(onSubmitEdit)} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
              {formError}
            </div>
          )}
          <Input
            label="Full Name"
            required
            {...registerEdit('name')}
            error={errorsEdit.name?.message}
          />
          <Input
            label="Work Email"
            type="email"
            required
            {...registerEdit('email')}
            error={errorsEdit.email?.message}
          />
          <Select
            label="Academic Department"
            options={DEPARTMENT_OPTIONS}
            required
            {...registerEdit('department')}
            error={errorsEdit.department?.message}
          />
          <Select
            label="Account Status"
            options={[
              { label: 'Active', value: 'ACTIVE' },
              { label: 'Inactive (Deactivated)', value: 'INACTIVE' }
            ]}
            required
            {...registerEdit('status')}
            error={errorsEdit.status?.message}
          />
        </form>
      </Modal>

      {/* Deactivate Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deactivatingTeacher}
        onClose={() => setDeactivatingTeacher(null)}
        onConfirm={handleConfirmDeactivate}
        title="Deactivate Faculty Member"
        description={`Are you sure you want to deactivate ${deactivatingTeacher?.user?.name || 'this teacher'}? They will be locked out of the school portal and their assigned teaching schedules.`}
        confirmText="Deactivate Profile"
        confirmVariant="danger"
        loading={deactivatingLoading}
      />
    </PageContainer>
  );
};

export default TeachersList;
