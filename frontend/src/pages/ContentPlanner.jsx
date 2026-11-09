/**
 * Content Planner Enhanced — with drag-and-drop support
 * Tabs: Calendar | Queue | Scheduled | Drafts | Best Times
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Link } from 'react-router-dom';
import {
  Calendar as CalendarIcon,
  Send, Clock, CheckCircle2, XCircle, Loader2,
  Trash2, Filter, Plus, BarChart2, FileText, GripVertical
} from 'lucide-react';
import {
  format, startOfMonth, endOfMonth,
  eachDayOfInterval, isSameMonth, isSameDay,
  addMonths, subMonths, setHours, setMinutes
} from 'date-fns';
import api from '../lib/api';
import toast from 'react-hot-toast';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// ── helpers ──────────────────────────────────────────────────
const PLATFORM_COLORS = {
  tiktok:    'bg-black border-gray-700',
  youtube:   'bg-red-600 border-red-800',
  x:         'bg-zinc-900 border-zinc-700',
  instagram: 'bg-pink-500 border-pink-700',
  facebook:  'bg-blue-600 border-blue-800',
  linkedin:  'bg-blue-700 border-blue-900'
};

const PLATFORM_LABELS = {
  tiktok: 'TikTok', youtube: 'YouTube', x: 'X',
  instagram: 'Instagram', facebook: 'Facebook', linkedin: 'LinkedIn'
};

const STATUS_CONFIG = {
  pending:    { label: 'Scheduled',    color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20' },
  processing: { label: 'Publishing…',  color: 'text-blue-400 bg-blue-400/10 border-blue-400/20' },
  published:  { label: 'Published',    color: 'text-green-400 bg-green-400/10 border-green-400/20' },
  failed:     { label: 'Failed',       color: 'text-red-400 bg-red-400/10 border-red-400/20' },
  cancelled:  { label: 'Cancelled',    color: 'text-gray-400 bg-gray-400/10 border-gray-400/20' }
};

const TABS = [
  { id: 'calendar',   label: 'Calendar',    icon: CalendarIcon },
  { id: 'queue',      label: 'Queue',       icon: Send },
  { id: 'scheduled',  label: 'Scheduled',   icon: Clock },
  { id: 'drafts',     label: 'Drafts',      icon: FileText },
  { id: 'best-times', label: 'Best Times',  icon: BarChart2 },
];

const TIME_SLOTS = [
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
  '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
  '18:00', '19:00', '20:00', '21:00', '22:00'
];

// ── Draggable Event Component ─────────────────────────────────
function DraggableEvent({ event, onDelete }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: event.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`p-2 rounded-lg border ${PLATFORM_COLORS[event.platform_name]} text-white text-[10px] cursor-move group relative`}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-center gap-1">
        <GripVertical size={10} className="flex-shrink-0 opacity-50" />
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{PLATFORM_LABELS[event.platform_name]}</p>
          <p className="text-[9px] opacity-75 truncate">{event.content_text}</p>
          <p className="text-[8px] opacity-60">{format(new Date(event.scheduled_at), 'HH:mm')}</p>
        </div>
      </div>
      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(event.id);
          }}
          className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-0.5 bg-red-500/80 rounded hover:bg-red-500 transition-all"
        >
          <XCircle size={10} />
        </button>
      )}
    </div>
  );
}

// ── Droppable Day Cell ────────────────────────────────────────
function DroppableDay({ day, events, isSelected, isToday, onSelect, onDrop }) {
  const [isOver, setIsOver] = useState(false);

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsOver(true);
      }}
      onDragLeave={() => setIsOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsOver(false);
        const eventId = e.dataTransfer.getData('eventId');
        if (eventId && onDrop) {
          onDrop(eventId, day);
        }
      }}
      onClick={() => onSelect(day)}
      className={`
        relative min-h-[80px] p-2 rounded-lg border text-left transition-all cursor-pointer
        ${isSelected
          ? 'border-accent-primary bg-accent-primary/10'
          : isOver
          ? 'border-accent-secondary bg-accent-secondary/10'
          : 'border-dark-border bg-dark-card hover:border-gray-600'}
      `}
    >
      <span className={`text-xs font-medium ${
        isToday
          ? 'w-6 h-6 bg-accent-primary text-white rounded-full flex items-center justify-center'
          : isSameMonth(day, new Date()) ? 'text-white' : 'text-gray-600'
      }`}>
        {format(day, 'd')}
      </span>
      <div className="mt-1 space-y-0.5">
        {events.slice(0, 3).map((ev) => (
          <div
            key={ev.id}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData('eventId', ev.id.toString());
            }}
            className={`text-[9px] truncate rounded px-1 py-0.5 text-white cursor-move ${
              PLATFORM_COLORS[ev.platform_name]?.split(' ')[0] || 'bg-gray-700'
            }`}
          >
            {PLATFORM_LABELS[ev.platform_name] || ev.platform_name}
          </div>
        ))}
        {events.length > 3 && (
          <div className="text-[9px] text-gray-500">+{events.length - 3} more</div>
        )}
      </div>
    </div>
  );
}

// ── Time Picker Modal ─────────────────────────────────────────
function TimePicker({ event, onSave, onClose }) {
  const [selectedTime, setSelectedTime] = useState(
    event.scheduled_at ? format(new Date(event.scheduled_at), 'HH:mm') : '09:00'
  );

  const handleSave = () => {
    const [hours, minutes] = selectedTime.split(':').map(Number);
    const newDate = setMinutes(setHours(new Date(event.scheduled_at), hours), minutes);
    onSave(newDate);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-card border border-dark-border rounded-2xl max-w-sm w-full p-6">
        <h3 className="text-lg font-bold text-white mb-4">Set Time</h3>
        
        <div className="mb-4">
          <label className="label">Select time</label>
          <select
            value={selectedTime}
            onChange={(e) => setSelectedTime(e.target.value)}
            className="select w-full"
          >
            {TIME_SLOTS.map((time) => (
              <option key={time} value={time}>
                {time}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-2">
          <button onClick={handleSave} className="btn btn-primary flex-1">
            <Check size={16} /> Save
          </button>
          <button onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Calendar Tab with Drag & Drop
// ─────────────────────────────────────────────────────────────
function CalendarTab() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);
  const queryClient = useQueryClient();

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);

  const { data, isLoading } = useQuery(
    ['calendar', format(monthStart, 'yyyy-MM-dd')],
    async () => {
      const { data } = await api.get(
        `/publishing/calendar?start=${monthStart.toISOString()}&end=${monthEnd.toISOString()}`
      );
      return data;
    }
  );

  const rescheduleMut = useMutation(
    ({ jobId, newDate }) => api.put(`/publishing/jobs/${jobId}/reschedule`, { scheduled_at: newDate.toISOString() }),
    {
      onSuccess: () => {
        toast.success('Rescheduled!');
        queryClient.invalidateQueries('calendar');
        setEditingEvent(null);
      },
      onError: () => toast.error('Failed to reschedule')
    }
  );

  const events = data?.events || [];
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPad = monthStart.getDay();
  const paddedDays = [...Array(startPad).fill(null), ...days];

  const eventsForDay = (date) =>
    events.filter((e) => isSameDay(new Date(e.scheduled_at || e.published_at), date));

  const selectedEvents = selectedDate ? eventsForDay(selectedDate) : [];

  const handleDrop = (eventId, targetDay) => {
    const event = events.find((e) => e.id === parseInt(eventId));
    if (!event) return;

    const currentTime = new Date(event.scheduled_at);
    const newDate = new Date(targetDay);
    newDate.setHours(currentTime.getHours());
    newDate.setMinutes(currentTime.getMinutes());

    rescheduleMut.mutate({ jobId: event.id, newDate });
  };

  return (
    <div className="flex gap-6">
      {/* Calendar grid */}
      <div className="flex-1">
        {/* Month nav */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
            className="p-2 rounded-lg hover:bg-dark-hover text-gray-400 hover:text-white transition-colors"
          >
            ‹
          </button>
          <h2 className="text-lg font-semibold text-white">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
          <button
            onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
            className="p-2 rounded-lg hover:bg-dark-hover text-gray-400 hover:text-white transition-colors"
          >
            ›
          </button>
        </div>

        <div className="mb-4 p-3 bg-accent-primary/10 border border-accent-primary/20 rounded-xl text-sm text-accent-primary">
          💡 Drag events between days to reschedule them
        </div>

        {/* Day labels */}
        <div className="grid grid-cols-7 mb-2">
          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d) => (
            <div key={d} className="text-center text-xs font-medium text-gray-500 py-2">{d}</div>
          ))}
        </div>

        {/* Day cells */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-6 h-6 animate-spin text-accent-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-1">
            {paddedDays.map((day, i) => {
              if (!day) return <div key={`pad-${i}`} />;
              const dayEvents = eventsForDay(day);
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const isToday = isSameDay(day, new Date());
              return (
                <DroppableDay
                  key={day.toISOString()}
                  day={day}
                  events={dayEvents}
                  isSelected={isSelected}
                  isToday={isToday}
                  onSelect={setSelectedDate}
                  onDrop={handleDrop}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Day detail panel */}
      <div className="w-80 flex-shrink-0">
        <div className="bg-dark-card border border-dark-border rounded-xl p-4 sticky top-0">
          <h3 className="text-sm font-semibold text-white mb-3">
            {selectedDate ? format(selectedDate, 'EEEE, MMMM d') : 'Select a day'}
          </h3>
          {selectedEvents.length === 0 ? (
            <div className="text-center py-8">
              <CalendarIcon className="w-8 h-8 text-gray-600 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No posts scheduled</p>
              <Link
                to="/create"
                className="mt-3 inline-flex items-center gap-1 text-xs text-accent-primary hover:underline"
              >
                <Plus size={12} /> Create post
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {selectedEvents.map((ev) => (
                <div key={ev.id} className="p-3 bg-dark-bg rounded-lg border border-dark-border group relative">
                  <button
                    onClick={() => setEditingEvent(ev)}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 bg-dark-card rounded hover:bg-dark-hover transition-all"
                  >
                    <Clock size={12} className="text-accent-primary" />
                  </button>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded border ${
                      STATUS_CONFIG[ev.status]?.color || STATUS_CONFIG.pending.color
                    }`}>
                      {STATUS_CONFIG[ev.status]?.label || ev.status}
                    </span>
                    <span className="text-[10px] text-gray-500">
                      {format(new Date(ev.scheduled_at || ev.published_at), 'HH:mm')}
                    </span>
                  </div>
                  <p className="text-xs text-gray-300 line-clamp-2">{ev.content_text}</p>
                  <p className="text-[10px] text-gray-500 mt-1 capitalize">{ev.platform_name}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Time picker modal */}
      {editingEvent && (
        <TimePicker
          event={editingEvent}
          onSave={(newDate) => rescheduleMut.mutate({ jobId: editingEvent.id, newDate })}
          onClose={() => setEditingEvent(null)}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Queue Tab
// ─────────────────────────────────────────────────────────────
function QueueTab() {
  const [statusFilter, setStatusFilter] = useState('pending');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery(['queue', statusFilter], async () => {
    const { data } = await api.get(`/publishing/queue?status=${statusFilter}`);
    return data;
  });

  const cancelMutation = useMutation(
    (jobId) => api.delete(`/publishing/jobs/${jobId}`),
    {
      onSuccess: () => {
        toast.success('Job cancelled');
        queryClient.invalidateQueries('queue');
      },
      onError: () => toast.error('Failed to cancel job')
    }
  );

  const retryMutation = useMutation(
    (jobId) => api.post(`/publishing/jobs/${jobId}/retry`),
    {
      onSuccess: () => {
        toast.success('Retry queued');
        queryClient.invalidateQueries('queue');
      },
      onError: () => toast.error('Failed to retry job')
    }
  );

  const jobs = data?.jobs || [];

  return (
    <div>
      {/* Status filter */}
      <div className="flex items-center gap-2 mb-6">
        {Object.entries(STATUS_CONFIG).map(([key, val]) => (
          <button
            key={key}
            onClick={() => setStatusFilter(key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              statusFilter === key
                ? val.color + ' border-current'
                : 'text-gray-400 bg-dark-card border-dark-border hover:text-white'
            }`}
          >
            {val.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-6 h-6 animate-spin text-accent-primary" />
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-16">
          <Send className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">No {statusFilter} jobs</p>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="flex items-center gap-4 p-4 bg-dark-card border border-dark-border rounded-xl hover:border-gray-600 transition-colors"
            >
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                job.status === 'published'  ? 'bg-green-400' :
                job.status === 'failed'     ? 'bg-red-400'   :
                job.status === 'processing' ? 'bg-blue-400 animate-pulse' :
                'bg-yellow-400'
              }`} />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-medium text-white capitalize">{job.platform_name}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded border ${STATUS_CONFIG[job.status]?.color}`}>
                    {STATUS_CONFIG[job.status]?.label}
                  </span>
                  {job.retry_count > 0 && (
                    <span className="text-[10px] text-gray-500">Retry #{job.retry_count}</span>
                  )}
                </div>
                <p className="text-xs text-gray-400 truncate">{job.content_text || 'No content preview'}</p>
                {job.scheduled_at && (
                  <p className="text-[10px] text-gray-600 mt-0.5">
                    {format(new Date(job.scheduled_at), 'MMM d, yyyy HH:mm')}
                  </p>
                )}
                {job.error_message && (
                  <p className="text-[10px] text-red-400 mt-0.5 truncate">{job.error_message}</p>
                )}
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                {job.status === 'failed' && (
                  <button
                    onClick={() => retryMutation.mutate(job.id)}
                    disabled={retryMutation.isLoading}
                    className="p-1.5 text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors"
                    title="Retry"
                  >
                    <Loader2 size={14} />
                  </button>
                )}
                {['pending', 'processing'].includes(job.status) && (
                  <button
                    onClick={() => cancelMutation.mutate(job.id)}
                    disabled={cancelMutation.isLoading}
                    className="p-1.5 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                    title="Cancel"
                  >
                    <XCircle size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Scheduled Tab
// ─────────────────────────────────────────────────────────────
function ScheduledTab() {
  const { data, isLoading } = useQuery('scheduled-posts', async () => {
    const { data } = await api.get('/publishing/queue?status=pending&limit=50');
    return data;
  });

  const jobs = data?.jobs || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="w-6 h-6 animate-spin text-accent-primary" />
      </div>
    );
  }

  return (
    <div>
      {jobs.length === 0 ? (
        <div className="text-center py-16">
          <Clock className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 mb-2">No scheduled posts</p>
          <Link to="/create" className="text-sm text-accent-primary hover:underline">
            Create and schedule a post
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="flex items-center gap-4 p-4 bg-dark-card border border-dark-border rounded-xl"
            >
              <Clock className="w-4 h-4 text-yellow-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{job.content_text || 'Scheduled post'}</p>
                <p className="text-xs text-gray-500 capitalize">{job.platform_name}</p>
              </div>
              <span className="text-xs text-gray-400 flex-shrink-0">
                {job.scheduled_at ? format(new Date(job.scheduled_at), 'MMM d, HH:mm') : '—'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Drafts Tab
// ─────────────────────────────────────────────────────────────
function DraftsTab() {
  const { data, isLoading } = useQuery('drafts', async () => {
    const { data } = await api.get('/content?status=draft&limit=50');
    return data;
  });

  const posts = data?.posts || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="w-6 h-6 animate-spin text-accent-primary" />
      </div>
    );
  }

  return (
    <div>
      {posts.length === 0 ? (
        <div className="text-center py-16">
          <FileText className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 mb-2">No drafts</p>
          <Link to="/create" className="text-sm text-accent-primary hover:underline">
            Start creating content
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {posts.map((post) => (
            <div
              key={post.id}
              className="p-4 bg-dark-card border border-dark-border rounded-xl hover:border-gray-600 transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Draft</span>
                <span className="text-xs text-gray-500">
                  {format(new Date(post.updated_at || post.created_at), 'MMM d')}
                </span>
              </div>
              <p className="text-sm text-white line-clamp-3">{post.content_text || post.title || 'Untitled draft'}</p>
              {post.platforms?.length > 0 && (
                <div className="flex gap-1 mt-2">
                  {post.platforms.map((p) => (
                    <span key={p} className="text-[10px] px-1.5 py-0.5 bg-dark-bg border border-dark-border rounded capitalize text-gray-400">{p}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Best Times Tab
// ─────────────────────────────────────────────────────────────
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function BestTimesTab() {
  const { data, isLoading } = useQuery('best-times', async () => {
    const { data } = await api.get('/analytics/best-times');
    return data;
  });

  const times = data?.times || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="w-6 h-6 animate-spin text-accent-primary" />
      </div>
    );
  }

  return (
    <div>
      {times.length === 0 ? (
        <div className="text-center py-16">
          <BarChart2 className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">Not enough data yet</p>
          <p className="text-sm text-gray-500 mt-1">Publish more content to see insights</p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-gray-400 mb-4">Based on your published content performance</p>
          {times.map((t, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-4 bg-dark-card border border-dark-border rounded-xl"
            >
              <div>
                <p className="text-sm font-medium text-white capitalize">{t.platform_name}</p>
                <p className="text-xs text-gray-400">
                  {DAY_NAMES[t.day_of_week]} at {String(t.hour).padStart(2, '0')}:00
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-accent-primary">
                  {parseFloat(t.avg_engagement_rate || 0).toFixed(2)}%
                </p>
                <p className="text-xs text-gray-500">avg engagement</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────
export default function ContentPlanner() {
  const [activeTab, setActiveTab] = useState('calendar');

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Content Planner</h1>
          <p className="text-sm text-gray-500 mt-0.5">Plan, schedule and manage all your content</p>
        </div>
        <Link
          to="/create"
          className="inline-flex items-center gap-2 px-4 py-2 bg-accent-primary text-white rounded-xl text-sm font-medium hover:bg-accent-primary/90 transition-colors"
        >
          <Plus size={16} />
          Create Post
        </Link>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-1 mb-6 border-b border-dark-border">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                active
                  ? 'border-accent-primary text-white'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <Icon size={15} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeTab === 'calendar'   && <CalendarTab />}
      {activeTab === 'queue'      && <QueueTab />}
      {activeTab === 'scheduled'  && <ScheduledTab />}
      {activeTab === 'drafts'     && <DraftsTab />}
      {activeTab === 'best-times' && <BestTimesTab />}
    </div>
  );
}
