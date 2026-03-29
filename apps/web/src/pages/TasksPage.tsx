import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useApi } from '../hooks/useApi';
import { Card, CardBody, Badge, Button, Modal, Input, Select, useToast } from '../components/ui';
import { IconTasks, IconCheckCircle, IconClock, IconAlertTriangle, IconPlus, IconX } from '../components/icons';
import { TasksDashboard } from '../components/dashboard/TasksDashboard';

type SubTask = { id?: string; title: string; status: string; dueDateUtc?: string; progress?: number };
type TaskItem = {
  id: string;
  titleAr: string;
  titleEn: string;
  dueDateUtc: string;
  priority: string;
  status: string;
  progress: number;
  subTasks?: SubTask[];
};

const PRIORITY_VARIANT: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
  low: 'info',
  medium: 'default',
  high: 'warning',
  critical: 'danger',
};

const STATUS_VARIANT: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
  pending: 'default',
  in_progress: 'warning',
  completed: 'success',
  overdue: 'danger',
  cancelled: 'info',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-neutral-50 text-neutral-600',
  in_progress: 'bg-amber-50 text-amber-600',
  completed: 'bg-green-50 text-green-600',
  overdue: 'bg-red-50 text-red-600',
};

export function TasksPage() {
  const { get, put } = useApi();
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const [items, setItems] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'list' | 'dashboard'>('list');

  // Progress update modal
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [editStatus, setEditStatus] = useState('');
  const [editProgress, setEditProgress] = useState(0);
  const [saving, setSaving] = useState(false);

  // Subtask modal
  const [subtaskTask, setSubtaskTask] = useState<TaskItem | null>(null);
  const [subtaskList, setSubtaskList] = useState<{ title: string; status: string; dueDateUtc: string; progress: number }[]>([]);
  const [savingSubtasks, setSavingSubtasks] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await get<{ items: TaskItem[] }>('/api/v1/tasks?page=1&pageSize=50');
      setItems(res.items);
    } catch { toast.error(t('errors.loadFailed')); }
    finally { setLoading(false); }
  }

  useEffect(() => { void load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  async function saveProgress() {
    if (!editingTask) return;
    setSaving(true);
    try {
      await put(`/api/v1/tasks/${editingTask.id}/progress`, { status: editStatus, progress: editProgress });
      toast.success(t('tasks.updateProgress') + ' ✓');
      setEditingTask(null);
      await load();
    } catch { toast.error(t('errors.generic')); }
    finally { setSaving(false); }
  }

  async function saveSubtasks() {
    if (!subtaskTask) return;
    setSavingSubtasks(true);
    try {
      await put(`/api/v1/tasks/${subtaskTask.id}/subtasks`,
        subtaskList
          .filter((s) => s.title.trim())
          .map((s) => ({
            title: s.title,
            status: s.status,
            dueDateUtc: s.dueDateUtc || null,
            progress: s.progress,
          })),
      );
      toast.success(t('tasks.manageSubtasks') + ' ✓');
      setSubtaskTask(null);
      await load();
    } catch { toast.error(t('errors.generic')); }
    finally { setSavingSubtasks(false); }
  }

  function openProgressModal(task: TaskItem) {
    setEditingTask(task);
    setEditStatus(task.status);
    setEditProgress(task.progress);
  }

  function openSubtaskModal(task: TaskItem) {
    setSubtaskTask(task);
    setSubtaskList(
      task.subTasks?.map((s) => ({
        title: s.title,
        status: s.status,
        dueDateUtc: s.dueDateUtc ? s.dueDateUtc.split('T')[0] : '',
        progress: s.progress ?? 0,
      })) ?? [{ title: '', status: 'pending', dueDateUtc: '', progress: 0 }],
    );
  }

  const isAr = i18n.language === 'ar';
  const dateFmt = new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium' });

  const inProgressCount = items.filter((t) => t.status === 'in_progress').length;
  const completedCount = items.filter((t) => t.status === 'completed').length;
  const overdueCount = items.filter((t) => t.status === 'overdue' || (new Date(t.dueDateUtc) < new Date() && t.status !== 'completed')).length;

  const avgProgress = items.length > 0 ? Math.round(items.reduce((a, t) => a + t.progress, 0) / items.length) : 0;

  const stats = [
    { label: t('common.all'), value: items.length, icon: <IconTasks className="h-5 w-5" />, color: 'bg-brand-50 text-brand-600' },
    { label: t('tasks.statuses.in_progress'), value: inProgressCount, icon: <IconClock className="h-5 w-5" />, color: 'bg-amber-50 text-amber-600' },
    { label: t('tasks.statuses.completed'), value: completedCount, icon: <IconCheckCircle className="h-5 w-5" />, color: 'bg-green-50 text-green-600' },
    { label: t('tasks.statuses.overdue'), value: overdueCount, icon: <IconAlertTriangle className="h-5 w-5" />, color: 'bg-red-50 text-red-600' },
  ];

  const filters = ['all', 'pending', 'in_progress', 'completed', 'overdue'];
  const filteredItems = filter === 'all' ? items : items.filter((t) => t.status === filter);

  const statusOptions = [
    { value: 'pending', label: t('tasks.statuses.pending') },
    { value: 'in_progress', label: t('tasks.statuses.in_progress') },
    { value: 'completed', label: t('tasks.statuses.completed') },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">{t('tasks.title')}</h1>
          <p className="mt-1 text-sm text-neutral-500">{t('tasks.description')}</p>
        </div>
        <div className="flex shrink-0 rounded-lg border border-neutral-200 bg-neutral-50 text-sm font-medium">
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={['px-3 py-1.5 rounded-s-lg transition-colors', viewMode === 'list' ? 'bg-brand-700 text-white' : 'text-neutral-600 hover:bg-neutral-100'].join(' ')}
          >
            {t('tasksDashboard.listView')}
          </button>
          <button
            type="button"
            onClick={() => setViewMode('dashboard')}
            className={['px-3 py-1.5 rounded-e-lg transition-colors', viewMode === 'dashboard' ? 'bg-brand-700 text-white' : 'text-neutral-600 hover:bg-neutral-100'].join(' ')}
          >
            {t('tasksDashboard.dashboardView')}
          </button>
        </div>
      </div>

      {viewMode === 'dashboard' ? (
        <TasksDashboard />
      ) : (<>
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardBody className="flex items-center gap-3">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${s.color}`}>{s.icon}</div>
              <div>
                <p className="text-2xl font-bold text-neutral-900">{s.value}</p>
                <p className="text-xs text-neutral-500">{s.label}</p>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Progress overview */}
      <Card>
        <CardBody className="flex items-center justify-between gap-4">
          <span className="text-sm font-medium text-neutral-700">{t('tasks.progress')}</span>
          <div className="flex items-center gap-3">
            <div className="h-2.5 w-40 overflow-hidden rounded-full bg-neutral-100">
              <div className={`h-full rounded-full transition-all ${avgProgress >= 100 ? 'bg-green-500' : avgProgress > 50 ? 'bg-brand-600' : 'bg-amber-500'}`} style={{ width: `${Math.min(avgProgress, 100)}%` }} />
            </div>
            <span className="min-w-[3rem] text-end text-sm font-bold text-neutral-700">{avgProgress}%</span>
          </div>
        </CardBody>
      </Card>

      {/* Filter pills */}
      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={[
              'rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
              filter === f ? 'bg-brand-700 text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200',
            ].join(' ')}
          >
            {f === 'all' ? t('common.all') : t(`tasks.statuses.${f}` as any)}
          </button>
        ))}
      </div>

      {/* Task cards */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}><CardBody className="space-y-2">
              <div className="h-5 w-3/4 animate-pulse rounded bg-neutral-200" />
              <div className="h-4 w-1/2 animate-pulse rounded bg-neutral-100" />
              <div className="h-2 w-full animate-pulse rounded-full bg-neutral-100" />
            </CardBody></Card>
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <Card><CardBody className="flex flex-col items-center py-16">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100 text-neutral-400"><IconTasks className="h-8 w-8" /></div>
          <h3 className="mt-4 text-sm font-semibold text-neutral-900">{t('tasks.noData')}</h3>
          <p className="mt-1 text-sm text-neutral-500">{t('tasks.noDataDesc')}</p>
        </CardBody></Card>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((task) => {
            const isOverdue = new Date(task.dueDateUtc) < new Date() && task.status !== 'completed';
            return (
              <Card key={task.id} className={`transition-shadow hover:shadow-md ${isOverdue ? 'border-red-200' : ''}`}>
                <CardBody>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${STATUS_COLORS[task.status] ?? 'bg-neutral-50 text-neutral-600'}`}>
                          {task.status === 'completed' ? <IconCheckCircle className="h-4 w-4" /> : task.status === 'overdue' || isOverdue ? <IconAlertTriangle className="h-4 w-4" /> : <IconTasks className="h-4 w-4" />}
                        </div>
                        <div className="min-w-0">
                          <h3 className={`truncate font-semibold ${task.status === 'completed' ? 'text-neutral-400 line-through' : 'text-neutral-900'}`}>
                            {isAr ? task.titleAr : task.titleEn}
                          </h3>
                          <p className="text-xs text-neutral-400">{isAr ? task.titleEn : task.titleAr}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Badge variant={PRIORITY_VARIANT[task.priority] ?? 'default'}>
                        {t(`tasks.priorities.${task.priority}` as any) ?? task.priority}
                      </Badge>
                      <Badge variant={STATUS_VARIANT[task.status] ?? 'default'}>
                        {t(`tasks.statuses.${task.status}` as any) ?? task.status}
                      </Badge>
                    </div>
                  </div>
                  {/* Progress + due date row */}
                  <div className="mt-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 flex-1">
                      <div className="h-1.5 flex-1 max-w-xs overflow-hidden rounded-full bg-neutral-100">
                        <div
                          className={`h-full rounded-full transition-all ${task.progress >= 100 ? 'bg-green-500' : task.progress > 50 ? 'bg-brand-600' : 'bg-amber-500'}`}
                          style={{ width: `${Math.min(task.progress, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-neutral-500">{task.progress}%</span>
                    </div>
                    <span className={`flex items-center gap-1 text-xs ${isOverdue ? 'font-medium text-red-500' : 'text-neutral-400'}`}>
                      <IconClock className="h-3.5 w-3.5" />
                      {dateFmt.format(new Date(task.dueDateUtc))}
                    </span>
                  </div>
                  {/* Actions */}
                  <div className="mt-3 flex gap-2 border-t border-neutral-100 pt-3">
                    <Button variant="outline" size="sm" onClick={() => openProgressModal(task)}>
                      {t('tasks.updateProgress')}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => openSubtaskModal(task)}>
                      {t('tasks.manageSubtasks')}
                    </Button>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}

      </>)}

      {/* Update Progress Modal */}
      <Modal open={!!editingTask} onClose={() => setEditingTask(null)} title={t('tasks.updateProgress')}>
        <div className="grid gap-4">
          <Select
            label={t('tasks.status')}
            value={editStatus}
            onChange={(e) => setEditStatus(e.target.value)}
            options={statusOptions}
          />
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">{t('tasks.progress')} ({editProgress}%)</label>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={editProgress}
              onChange={(e) => setEditProgress(Number(e.target.value))}
              className="w-full accent-brand-600"
            />
            <div className="mt-1 flex justify-between text-[10px] text-neutral-400">
              <span>0%</span><span>50%</span><span>100%</span>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setEditingTask(null)}>{t('actions.cancel')}</Button>
            <Button onClick={() => void saveProgress()} loading={saving}>{t('actions.save')}</Button>
          </div>
        </div>
      </Modal>

      {/* Subtasks Modal */}
      <Modal open={!!subtaskTask} onClose={() => setSubtaskTask(null)} title={t('tasks.manageSubtasks')}>
        <div className="grid gap-4">
          {/* Auto-progress indicator */}
          {subtaskList.length > 0 && (
            <div className="flex items-center justify-between rounded-lg bg-neutral-50 px-3 py-2">
              <span className="text-xs font-medium text-neutral-600">{t('tasks.autoProgress')}</span>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-24 overflow-hidden rounded-full bg-neutral-200">
                  <div
                    className="h-full rounded-full bg-brand-600 transition-all"
                    style={{ width: `${subtaskList.length > 0 ? Math.round(subtaskList.reduce((a, s) => a + s.progress, 0) / subtaskList.length) : 0}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-neutral-700">
                  {subtaskList.length > 0 ? Math.round(subtaskList.reduce((a, s) => a + s.progress, 0) / subtaskList.length) : 0}%
                </span>
              </div>
            </div>
          )}

          {subtaskList.map((sub, idx) => {
            const isSubOverdue = sub.dueDateUtc && new Date(sub.dueDateUtc) < new Date() && sub.status !== 'completed';
            return (
              <div key={idx} className={`rounded-lg border p-3 space-y-2 ${isSubOverdue ? 'border-red-200 bg-red-50/30' : 'border-neutral-200'}`}>
                <div className="flex items-center gap-2">
                  <Input
                    value={sub.title}
                    onChange={(e) => {
                      const next = [...subtaskList];
                      next[idx] = { ...next[idx], title: e.target.value };
                      setSubtaskList(next);
                    }}
                    placeholder={t('tasks.subtasks')}
                    className="flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => setSubtaskList(subtaskList.filter((_, i) => i !== idx))}
                    className="shrink-0 rounded p-1 text-neutral-400 hover:text-red-500"
                  >
                    <IconX className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="mb-0.5 block text-[11px] font-medium text-neutral-500">{t('tasks.dueDate')}</label>
                    <input
                      type="date"
                      value={sub.dueDateUtc}
                      onChange={(e) => {
                        const next = [...subtaskList];
                        next[idx] = { ...next[idx], dueDateUtc: e.target.value };
                        setSubtaskList(next);
                      }}
                      className={`w-full rounded-md border px-2 py-1 text-xs ${isSubOverdue ? 'border-red-300 text-red-600' : 'border-neutral-300 text-neutral-700'}`}
                    />
                  </div>
                  <div>
                    <label className="mb-0.5 block text-[11px] font-medium text-neutral-500">{t('tasks.status')}</label>
                    <select
                      value={sub.status}
                      onChange={(e) => {
                        const next = [...subtaskList];
                        const newStatus = e.target.value;
                        next[idx] = {
                          ...next[idx],
                          status: newStatus,
                          progress: newStatus === 'completed' ? 100 : newStatus === 'pending' ? 0 : next[idx].progress,
                        };
                        setSubtaskList(next);
                      }}
                      className="w-full rounded-md border border-neutral-300 px-2 py-1 text-xs text-neutral-700"
                    >
                      {statusOptions.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-medium text-neutral-500">{t('tasks.progress')}</label>
                    <span className="text-[11px] font-bold text-neutral-600">{sub.progress}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={sub.progress}
                    onChange={(e) => {
                      const next = [...subtaskList];
                      const newProgress = Number(e.target.value);
                      next[idx] = {
                        ...next[idx],
                        progress: newProgress,
                        status: newProgress >= 100 ? 'completed' : newProgress > 0 ? 'in_progress' : 'pending',
                      };
                      setSubtaskList(next);
                    }}
                    className="w-full accent-brand-600"
                  />
                </div>
              </div>
            );
          })}
          <Button
            variant="ghost"
            size="sm"
            icon={<IconPlus className="h-3.5 w-3.5" />}
            onClick={() => setSubtaskList([...subtaskList, { title: '', status: 'pending', dueDateUtc: '', progress: 0 }])}
          >
            {t('tasks.addSubtask')}
          </Button>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setSubtaskTask(null)}>{t('actions.cancel')}</Button>
            <Button onClick={() => void saveSubtasks()} loading={savingSubtasks}>{t('actions.save')}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
