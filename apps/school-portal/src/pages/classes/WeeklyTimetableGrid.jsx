import React, { useState, useMemo } from 'react';
import { Button, Badge, ConfirmModal, Select, Table } from '@sms/ui-kit';
import { Calendar, Clock, BookOpen, User, MapPin, Trash2, LayoutGrid, List, Filter } from 'lucide-react';

const WEEKDAYS = [
  { key: 'MONDAY', label: 'Monday' },
  { key: 'TUESDAY', label: 'Tuesday' },
  { key: 'WEDNESDAY', label: 'Wednesday' },
  { key: 'THURSDAY', label: 'Thursday' },
  { key: 'FRIDAY', label: 'Friday' },
];

const WeeklyTimetableGrid = ({
  timetables = [],
  loading = false,
  classes = [],
  teachers = [],
  selectedClassId = '',
  onClassChange = () => {},
  selectedTeacherId = '',
  onTeacherChange = () => {},
  onDeleteSlot = () => {},
  isAdmin = false,
}) => {
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [slotToDelete, setSlotToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Check if Saturday has any schedules
  const daysToDisplay = useMemo(() => {
    const hasSaturday = timetables.some((t) => t.dayOfWeek === 'SATURDAY');
    if (hasSaturday) {
      return [...WEEKDAYS, { key: 'SATURDAY', label: 'Saturday' }];
    }
    return WEEKDAYS;
  }, [timetables]);

  // Group timetables by day of week
  const slotsByDay = useMemo(() => {
    const map = {};
    daysToDisplay.forEach((d) => {
      map[d.key] = [];
    });
    timetables.forEach((item) => {
      if (map[item.dayOfWeek]) {
        map[item.dayOfWeek].push(item);
      }
    });
    // Sort each day's slots by start time
    Object.keys(map).forEach((day) => {
      map[day].sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
    });
    return map;
  }, [timetables, daysToDisplay]);

  const handleConfirmDelete = async () => {
    if (!slotToDelete) return;
    setIsDeleting(true);
    try {
      await onDeleteSlot(slotToDelete.id);
      setSlotToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const classOptions = [
    { label: 'All Classes', value: '' },
    ...classes.map((c) => ({ label: c.name, value: c.id })),
  ];

  const teacherOptions = [
    { label: 'All Faculty', value: '' },
    ...teachers.map((t) => ({ label: t.user?.name || `Employee ${t.employeeNo}`, value: t.id })),
  ];

  return (
    <div className="space-y-6">
      {/* Control Bar: Filters & View Switcher */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="w-full sm:w-48">
            <Select
              options={classOptions}
              value={selectedClassId}
              onChange={(e) => onClassChange(e.target.value)}
              placeholder="Filter by Class"
            />
          </div>
          <div className="w-full sm:w-48">
            <Select
              options={teacherOptions}
              value={selectedTeacherId}
              onChange={(e) => onTeacherChange(e.target.value)}
              placeholder="Filter by Faculty"
            />
          </div>
          {(selectedClassId || selectedTeacherId) && (
            <button
              type="button"
              onClick={() => {
                onClassChange('');
                onTeacherChange('');
              }}
              className="text-xs text-indigo-600 font-bold hover:underline px-2 py-1"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-start md:self-auto">
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'grid'
                ? 'bg-white text-indigo-600 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <LayoutGrid size={15} />
            <span>Weekly Grid</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'list'
                ? 'bg-white text-indigo-600 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <List size={15} />
            <span>List View</span>
          </button>
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((idx) => (
            <div key={idx} className="bg-white rounded-2xl border border-slate-100 p-4 space-y-3 animate-pulse">
              <div className="h-5 bg-slate-100 rounded-lg w-20"></div>
              <div className="h-24 bg-slate-50 rounded-xl"></div>
              <div className="h-24 bg-slate-50 rounded-xl"></div>
            </div>
          ))}
        </div>
      ) : timetables.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center">
          <Calendar size={36} className="mx-auto text-slate-300 mb-3" />
          <h3 className="text-sm font-bold text-slate-800 mb-1">No Timetable Periods Scheduled</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {selectedClassId || selectedTeacherId
              ? 'No scheduled lecture periods match the active class or teacher filter.'
              : 'Add scheduled periods to populate your school timetable.'}
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        /* VISUAL WEEKLY GRID VIEW */
        <div className="overflow-x-auto pb-4">
          <div
            className="grid gap-4"
            style={{
              minWidth: `${daysToDisplay.length * 200}px`,
              gridTemplateColumns: `repeat(${daysToDisplay.length}, minmax(180px, 1fr))`,
            }}
          >
            {daysToDisplay.map((day) => {
              const daySlots = slotsByDay[day.key] || [];
              return (
                <div key={day.key} className="flex flex-col gap-3">
                  {/* Day Column Header */}
                  <div className="bg-slate-100/80 rounded-xl px-3.5 py-2.5 flex items-center justify-between border border-slate-200/60">
                    <span className="text-xs font-black text-slate-800 tracking-wide uppercase">
                      {day.label}
                    </span>
                    <span className="text-3xs font-bold bg-white text-slate-600 px-2 py-0.5 rounded-full border border-slate-200">
                      {daySlots.length} {daySlots.length === 1 ? 'Period' : 'Periods'}
                    </span>
                  </div>

                  {/* Day Period Cards */}
                  <div className="flex-1 space-y-3 min-h-[220px] bg-slate-50/40 rounded-2xl p-2 border border-slate-100">
                    {daySlots.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-center p-4">
                        <span className="text-3xs font-semibold text-slate-400">
                          No classes scheduled
                        </span>
                      </div>
                    ) : (
                      daySlots.map((slot) => (
                        <div
                          key={slot.id}
                          className="bg-white rounded-xl p-3.5 border border-slate-200/70 shadow-2xs hover:shadow-sm hover:border-indigo-200 transition-all group text-left relative"
                        >
                          {/* Time tag */}
                          <div className="flex items-center justify-between gap-1 mb-2">
                            <span className="inline-flex items-center gap-1 font-mono text-3xs font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                              <Clock size={11} />
                              {slot.startTime?.slice(0, 5)} - {slot.endTime?.slice(0, 5)}
                            </span>
                            {slot.roomNumber && (
                              <span className="inline-flex items-center gap-0.5 text-3xs font-medium text-slate-500">
                                <MapPin size={10} />
                                {slot.roomNumber}
                              </span>
                            )}
                          </div>

                          {/* Subject Code & Name */}
                          <h4 className="text-xs font-bold text-slate-900 leading-tight mb-1 truncate">
                            {slot.subject?.name || 'Class Period'}
                          </h4>

                          <div className="flex items-center gap-1.5 mb-2">
                            {slot.subject?.code && (
                              <Badge variant="indigo">{slot.subject.code}</Badge>
                            )}
                            <span className="text-3xs font-semibold text-slate-500 truncate">
                              {slot.class?.name}
                            </span>
                          </div>

                          {/* Teacher */}
                          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-3xs text-slate-500">
                            <span className="flex items-center gap-1 truncate font-medium">
                              <User size={11} className="text-slate-400 flex-shrink-0" />
                              {slot.teacher?.user?.name || 'Unassigned'}
                            </span>
                            {isAdmin && (
                              <button
                                type="button"
                                onClick={() => setSlotToDelete(slot)}
                                className="opacity-0 group-hover:opacity-100 p-1 rounded text-rose-500 hover:bg-rose-50 transition-opacity cursor-pointer"
                                title="Delete Slot"
                                aria-label="Delete schedule slot"
                              >
                                <Trash2 size={12} />
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* TABLE LIST VIEW */
        <Table
          columns={[
            {
              header: 'Day',
              accessor: 'dayOfWeek',
              render: (val) => (
                <span className="font-bold text-slate-800 text-xs">
                  {val?.charAt(0) + val?.slice(1).toLowerCase()}
                </span>
              ),
            },
            {
              header: 'Time Period',
              accessor: (row) => `${row.startTime?.slice(0, 5)} - ${row.endTime?.slice(0, 5)}`,
              render: (val) => (
                <span className="font-mono text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                  {val}
                </span>
              ),
            },
            {
              header: 'Class',
              accessor: (row) => row.class?.name || 'N/A',
            },
            {
              header: 'Subject',
              accessor: (row) => row.subject?.name || 'N/A',
              render: (val, row) => (
                <div>
                  <span className="font-bold text-slate-800 text-xs">{val}</span>
                  {row.subject?.code && (
                    <span className="ml-1.5 text-3xs font-bold text-slate-400">
                      ({row.subject.code})
                    </span>
                  )}
                </div>
              ),
            },
            {
              header: 'Teacher',
              accessor: (row) => row.teacher?.user?.name || 'Unassigned',
            },
            {
              header: 'Room',
              accessor: 'roomNumber',
              render: (val) => val || '—',
            },
            ...(isAdmin
              ? [
                  {
                    header: 'Actions',
                    accessor: 'id',
                    render: (_, row) => (
                      <Button
                        variant="ghost"
                        onClick={() => setSlotToDelete(row)}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 text-xs"
                      >
                        <Trash2 size={14} className="mr-1" /> Delete
                      </Button>
                    ),
                  },
                ]
              : []),
          ]}
          data={timetables}
          loading={loading}
          emptyMessage="No timetable entries found."
        />
      )}

      {/* Confirmation Modal for Slot Deletion */}
      <ConfirmModal
        isOpen={!!slotToDelete}
        onClose={() => setSlotToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Timetable Period"
        description={`Are you sure you want to remove the ${slotToDelete?.subject?.name || 'scheduled'} period on ${slotToDelete?.dayOfWeek} (${slotToDelete?.startTime?.slice(0, 5)} - ${slotToDelete?.endTime?.slice(0, 5)})?`}
        confirmText="Remove Slot"
        confirmVariant="danger"
        loading={isDeleting}
      />
    </div>
  );
};

export default WeeklyTimetableGrid;
