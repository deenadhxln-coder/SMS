import React, { useEffect, useState } from 'react';
import { Button, Modal, ConfirmModal, Input, Badge } from '@sms/ui-kit';
import api from '@sms/api-client';
import useAuthStore from '@sms/auth';
import PageContainer from '../../components/layout/PageContainer';
import { io } from 'socket.io-client';
import { Megaphone, Plus, Trash2, Calendar, User, Clock, Bell, AlertCircle, Sparkles } from 'lucide-react';

const AnnouncementsPage = () => {
  const { user, token } = useAuthStore();
  const isAdmin = user?.role === 'School Admin';

  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Creation modal state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [form, setForm] = useState({ title: '', body: '', targetRole: 'ALL' });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Deletion modal state
  const [deletingId, setDeletingId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchAnnouncements = async (pageNum = 1) => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/announcements', {
        params: { page: pageNum, limit: 20 },
      });
      setAnnouncements(res.data.announcements || []);
      setPage(res.data.page || 1);
      setTotalPages(res.data.totalPages || 1);
    } catch (err) {
      console.error('Failed to load announcements:', err);
      setError(err.response?.data?.message || 'Failed to load school announcements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements(1);
  }, []);

  // Real-time Socket.IO listener for NEW_ANNOUNCEMENT
  useEffect(() => {
    if (!token) return;

    const socketUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const socket = io(socketUrl, {
      auth: { token },
      transports: ['websocket'],
    });

    socket.on('NEW_ANNOUNCEMENT', (data) => {
      // Check if announcement is relevant to current user role
      const userRole = user?.role;
      const isRelevant = 
        userRole === 'School Admin' || 
        data.targetRole === 'ALL' || 
        data.targetRole === userRole;

      if (isRelevant) {
        setAnnouncements((prev) => {
          // Avoid duplicate insertion
          if (prev.some((a) => a.id === data.id)) return prev;
          return [
            {
              id: data.id,
              title: data.title,
              body: data.body,
              targetRole: data.targetRole,
              createdAt: data.createdAt || new Date().toISOString(),
              author: { name: 'School Administration' },
            },
            ...prev,
          ];
        });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [token, user]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!form.title.trim() || form.title.trim().length < 3) {
      setFormError('Title must be at least 3 characters long.');
      return;
    }
    if (!form.body.trim() || form.body.trim().length < 5) {
      setFormError('Body content must be at least 5 characters long.');
      return;
    }

    try {
      setSubmitting(true);
      await api.post('/announcements', {
        title: form.title.trim(),
        body: form.body.trim(),
        targetRole: form.targetRole,
      });

      setIsCreateOpen(false);
      setForm({ title: '', body: '', targetRole: 'ALL' });
      fetchAnnouncements(1);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to publish announcement');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      setIsDeleting(true);
      await api.delete(`/announcements/${deletingId}`);
      setAnnouncements((prev) => prev.filter((a) => a.id !== deletingId));
      setDeletingId(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete announcement');
    } finally {
      setIsDeleting(false);
    }
  };

  const getTargetBadge = (targetRole) => {
    switch (targetRole) {
      case 'ALL':
        return (
          <span className="px-2.5 py-0.5 text-3xs font-extrabold rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
            School-Wide (Everyone)
          </span>
        );
      case 'Teacher':
        return (
          <span className="px-2.5 py-0.5 text-3xs font-extrabold rounded-full bg-amber-50 text-amber-700 border border-amber-200">
            Faculty Only
          </span>
        );
      case 'Student':
        return (
          <span className="px-2.5 py-0.5 text-3xs font-extrabold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            Students Only
          </span>
        );
      case 'Parent':
        return (
          <span className="px-2.5 py-0.5 text-3xs font-extrabold rounded-full bg-purple-50 text-purple-700 border border-purple-200">
            Parents Only
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 text-3xs font-extrabold rounded-full bg-slate-100 text-slate-700">
            {targetRole}
          </span>
        );
    }
  };

  return (
    <PageContainer
      title="School Announcements"
      description="Official school broadcast notices, event announcements, and academic updates"
      actions={
        isAdmin && (
          <Button
            variant="primary"
            onClick={() => {
              setForm({ title: '', body: '', targetRole: 'ALL' });
              setFormError('');
              setIsCreateOpen(true);
            }}
          >
            <Plus size={16} className="mr-2" />
            New Announcement
          </Button>
        )
      }
    >
      {error && (
        <div className="mb-6 p-4 rounded-xl text-xs font-semibold bg-red-50 text-red-700 border border-red-200 flex items-center justify-between">
          <span>{error}</span>
          <Button variant="outline" size="sm" onClick={() => fetchAnnouncements(1)}>
            Retry
          </Button>
        </div>
      )}

      {loading ? (
        <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-slate-400 text-sm font-medium">Loading school announcements...</span>
        </div>
      ) : announcements.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center shadow-sm">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
            <Megaphone size={28} />
          </div>
          <h3 className="text-base font-bold text-slate-800">No Announcements Yet</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
            {isAdmin 
              ? 'Click "New Announcement" above to broadcast official notices to teachers, students, or parents.'
              : 'There are currently no active announcements published for your account.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((ann) => (
            <article
              key={ann.id}
              className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-3 relative"
            >
              {/* Header Strip */}
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h3 className="text-base font-bold text-slate-900 tracking-tight">{ann.title}</h3>
                    {getTargetBadge(ann.targetRole)}
                  </div>
                  <div className="flex items-center gap-3 text-2xs text-slate-400 font-medium">
                    <span className="flex items-center gap-1">
                      <User size={12} />
                      {ann.author?.name || 'School Administration'}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      {ann.createdAt ? new Date(ann.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      }) : 'Recent'}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {ann.createdAt ? new Date(ann.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>
                </div>

                {/* Admin Delete Action */}
                {isAdmin && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-slate-400 hover:text-rose-600 hover:border-rose-200 px-2.5 py-1"
                    onClick={() => setDeletingId(ann.id)}
                    title="Delete announcement"
                  >
                    <Trash2 size={14} />
                  </Button>
                )}
              </div>

              {/* Body Content */}
              <div className="text-xs text-slate-600 leading-relaxed whitespace-pre-line border-t border-slate-50 pt-3">
                {ann.body}
              </div>
            </article>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <span className="text-xs text-slate-400 font-medium">
                Page {page} of {totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => fetchAnnouncements(page - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => fetchAnnouncements(page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* CREATE ANNOUNCEMENT MODAL (School Admin Only) */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Publish Official Announcement"
        maxWidth="max-w-xl"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreate} disabled={submitting}>
              {submitting ? 'Publishing...' : 'Publish Announcement'}
            </Button>
          </div>
        }
      >
        {formError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-xs font-semibold text-red-600 rounded-xl">
            {formError}
          </div>
        )}

        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Announcement Title"
            placeholder="e.g. Midterm Examination Schedule Released"
            value={form.title}
            onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
            required
          />

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-700">Target Audience</label>
            <select
              value={form.targetRole}
              onChange={(e) => setForm((prev) => ({ ...prev, targetRole: e.target.value }))}
              className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="ALL">School-Wide (Everyone)</option>
              <option value="Teacher">Faculty & Teachers Only</option>
              <option value="Student">Students Only</option>
              <option value="Parent">Parents Only</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-700">Announcement Body</label>
            <textarea
              rows={5}
              placeholder="Enter the detailed announcement message or instructions here..."
              value={form.body}
              onChange={(e) => setForm((prev) => ({ ...prev, body: e.target.value }))}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none font-sans"
              required
            />
          </div>
        </form>
      </Modal>

      {/* CONFIRM DELETE MODAL */}
      <ConfirmModal
        isOpen={Boolean(deletingId)}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        title="Delete Announcement"
        message="Are you sure you want to delete this announcement? This action cannot be undone and the notice will be permanently removed from all recipient feeds."
        confirmText={isDeleting ? 'Deleting...' : 'Delete'}
        variant="danger"
      />
    </PageContainer>
  );
};

export default AnnouncementsPage;
