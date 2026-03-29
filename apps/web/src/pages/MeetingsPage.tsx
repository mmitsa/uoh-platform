import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { useApi } from '../hooks/useApi';
import { useAuth } from '../app/auth';
import { Card, CardBody, Badge, Button, Modal, Input, Select, useToast } from '../components/ui';
import {
  IconMeetings, IconPlus, IconCalendar, IconClock, IconUser, IconTrash,
  IconVideo, IconMapPin, IconExternalLink, IconLink, IconEye, IconBell,
  IconCommittees, IconQrCode,
} from '../components/icons';
import { QrShareModal } from '../components/QrShareModal';
import type { ShareableEntityType } from '../hooks/useShareLink';

/* ─── types ─── */
type MeetingRoom = {
  id: string;
  nameAr: string;
  nameEn: string;
  building: string | null;
  floor: string | null;
  capacity: number;
  hasVideoConference: boolean;
  hasProjector: boolean;
  isActive: boolean;
  latitude: number | null;
  longitude: number | null;
  mapUrl: string | null;
};

type MeetingListItem = {
  id: string;
  committeeId: string | null;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  type: string;
  startDateTimeUtc: string;
  endDateTimeUtc: string;
  status: string;
  location: string | null;
  onlinePlatform: string | null;
  onlineJoinUrl: string | null;
  recordingUrl: string | null;
  meetingRoomId: string | null;
  meetingRoom: MeetingRoom | null;
};

type MeetingDetail = MeetingListItem & {
  committeeNameAr: string | null;
  committeeNameEn: string | null;
  agenda: AgendaItem[];
  invitees: Invitee[];
};

type AgendaItem = { titleAr: string; titleEn: string; descriptionAr?: string; descriptionEn?: string; duration?: number; presenterName?: string };
type Invitee = { displayName: string; email: string; role: string };
type CommitteeOption = { id: string; nameAr: string; nameEn: string };

/* ─── constants ─── */
const STATUS_VARIANT: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
  draft: 'default',
  scheduled: 'info',
  in_progress: 'warning',
  completed: 'success',
  cancelled: 'danger',
};

const TYPE_ICONS: Record<string, typeof IconMeetings> = {
  in_person: IconMapPin,
  online: IconVideo,
  hybrid: IconLink,
};

export function MeetingsPage() {
  const { get, post, put } = useApi();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const { hasRole } = useAuth();
  const isAr = i18n.language === 'ar';

  const [items, setItems] = useState<MeetingListItem[]>([]);
  const [committees, setCommittees] = useState<CommitteeOption[]>([]);
  const [rooms, setRooms] = useState<MeetingRoom[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  // Detail view
  const [detail, setDetail] = useState<MeetingDetail | null>(null);
  const [detailTab, setDetailTab] = useState<'overview' | 'participants' | 'agenda'>('overview');
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Create form
  const [titleAr, setTitleAr] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [type, setType] = useState<'in_person' | 'online' | 'hybrid'>('in_person');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [descriptionAr, setDescriptionAr] = useState('');
  const [descriptionEn, setDescriptionEn] = useState('');
  const [location, setLocation] = useState('');
  const [onlineJoinUrl, setOnlineJoinUrl] = useState('');
  const [committeeId, setCommitteeId] = useState('');
  const [recordingUrl, setRecordingUrl] = useState('');
  const [meetingRoomId, setMeetingRoomId] = useState('');
  const [creating, setCreating] = useState(false);

  // Agenda modal
  const [agendaMeeting, setAgendaMeeting] = useState<MeetingListItem | null>(null);
  const [agendaItems, setAgendaItems] = useState<AgendaItem[]>([]);
  const [savingAgenda, setSavingAgenda] = useState(false);

  // Invitees modal
  const [inviteesMeeting, setInviteesMeeting] = useState<MeetingListItem | null>(null);
  const [invitees, setInvitees] = useState<Invitee[]>([]);
  const [savingInvitees, setSavingInvitees] = useState(false);
  const [newInvName, setNewInvName] = useState('');
  const [newInvEmail, setNewInvEmail] = useState('');
  const [newInvRole, setNewInvRole] = useState('attendee');

  // QR share
  const [shareTarget, setShareTarget] = useState<{ type: ShareableEntityType; id: string; title: string } | null>(null);

  const canCreate = useMemo(
    () => titleAr.trim().length > 2 && titleEn.trim().length > 2 && start && end,
    [titleAr, titleEn, start, end],
  );

  async function load() {
    setLoading(true);
    try {
      const [meetingsRes, committeesRes, roomsRes] = await Promise.all([
        get<{ items: MeetingListItem[] }>('/api/v1/meetings?page=1&pageSize=50'),
        get<{ items: CommitteeOption[] }>('/api/v1/committees?page=1&pageSize=100&status=active'),
        get<{ items: MeetingRoom[] }>('/api/v1/meeting-rooms?activeOnly=true'),
      ]);
      setItems(meetingsRes.items);
      setCommittees(committeesRes.items);
      setRooms(roomsRes.items ?? []);
    } catch { toast.error(t('errors.loadFailed')); }
    finally { setLoading(false); }
  }

  async function openDetail(m: MeetingListItem) {
    setLoadingDetail(true);
    setDetailTab('overview');
    try {
      const res = await get<MeetingDetail>(`/api/v1/meetings/${m.id}`);
      setDetail(res);
    } catch {
      // fallback: build detail from list item
      setDetail({ ...m, committeeNameAr: null, committeeNameEn: null, agenda: [], invitees: [] });
    }
    finally { setLoadingDetail(false); }
  }

  async function create() {
    if (!canCreate) return;
    setCreating(true);
    try {
      await post('/api/v1/meetings', {
        committeeId: committeeId || null, titleAr, titleEn,
        descriptionAr: descriptionAr || null, descriptionEn: descriptionEn || null,
        type,
        startDateTimeUtc: new Date(start).toISOString(),
        endDateTimeUtc: new Date(end).toISOString(),
        location: type !== 'online' ? location || null : null,
        meetingRoomId: type !== 'online' && meetingRoomId ? meetingRoomId : null,
        onlinePlatform: type !== 'in_person' ? 'teams' : null,
        onlineJoinUrl: type !== 'in_person' ? onlineJoinUrl || null : null,
        recordingUrl: recordingUrl || null,
      });
      setTitleAr(''); setTitleEn(''); setDescriptionAr(''); setDescriptionEn('');
      setStart(''); setEnd(''); setLocation('');
      setOnlineJoinUrl(''); setCommitteeId(''); setRecordingUrl(''); setMeetingRoomId('');
      setShowCreate(false);
      toast.success(t('meetings.create') + ' ✓');
      await load();
    } catch { toast.error(t('errors.generic')); }
    finally { setCreating(false); }
  }

  async function publish(id: string) {
    try { await post(`/api/v1/meetings/${id}/publish`); toast.success(t('meetings.publish') + ' ✓'); await load(); }
    catch { toast.error(t('errors.generic')); }
  }
  async function cancel(id: string) {
    try { await post(`/api/v1/meetings/${id}/cancel`); toast.success(t('meetings.cancelMeeting') + ' ✓'); await load(); }
    catch { toast.error(t('errors.generic')); }
  }
  async function sendNotifications(id: string) {
    try { await post(`/api/v1/meetings/${id}/notify`); toast.success(t('meetings.notificationsSent')); }
    catch { toast.error(t('errors.generic')); }
  }

  // Agenda management
  async function openAgenda(m: MeetingListItem) {
    setAgendaMeeting(m);
    try {
      const res = await get<AgendaItem[]>(`/api/v1/meetings/${m.id}/agenda`);
      setAgendaItems(res.length > 0 ? res : [{ titleAr: '', titleEn: '', descriptionAr: '', descriptionEn: '', presenterName: '' }]);
    } catch { setAgendaItems([{ titleAr: '', titleEn: '', descriptionAr: '', descriptionEn: '', presenterName: '' }]); }
  }
  function updateAgendaItem(idx: number, field: keyof AgendaItem, val: string | number) {
    setAgendaItems(agendaItems.map((a, i) => (i === idx ? { ...a, [field]: val } : a)));
  }
  async function saveAgenda() {
    if (!agendaMeeting) return;
    setSavingAgenda(true);
    try {
      const filtered = agendaItems.filter((a) => a.titleAr.trim() || a.titleEn.trim());
      await put(`/api/v1/meetings/${agendaMeeting.id}/agenda`, { items: filtered });
      toast.success(t('meetings.agenda') + ' ✓');
      setAgendaMeeting(null);
    } catch { toast.error(t('errors.generic')); }
    finally { setSavingAgenda(false); }
  }

  // Invitees management
  async function openInvitees(m: MeetingListItem) {
    setInviteesMeeting(m);
    try {
      const res = await get<Invitee[]>(`/api/v1/meetings/${m.id}/invitees`);
      setInvitees(res);
    } catch { setInvitees([]); }
  }
  function addInvitee() {
    if (!newInvName.trim() || !newInvEmail.trim()) return;
    setInvitees([...invitees, { displayName: newInvName, email: newInvEmail, role: newInvRole }]);
    setNewInvName(''); setNewInvEmail(''); setNewInvRole('attendee');
  }
  async function saveInvitees() {
    if (!inviteesMeeting) return;
    setSavingInvitees(true);
    try {
      await put(`/api/v1/meetings/${inviteesMeeting.id}/invitees`, { invitees });
      toast.success(t('meetings.invitees') + ' ✓');
      setInviteesMeeting(null);
    } catch { toast.error(t('errors.generic')); }
    finally { setSavingInvitees(false); }
  }

  useEffect(() => { void load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const dateFmt = new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium', timeStyle: 'short' });
  const dayFmt = new Intl.DateTimeFormat(i18n.language, { day: 'numeric' });
  const monthFmt = new Intl.DateTimeFormat(i18n.language, { month: 'short' });

  const now = new Date();
  const upcoming = items.filter((m) => new Date(m.startDateTimeUtc) >= now || m.status === 'scheduled' || m.status === 'draft');
  const past = items.filter((m) => !upcoming.includes(m));

  const stats = [
    { label: t('common.all'), value: items.length, color: 'bg-brand-50 text-brand-600' },
    { label: t('meetings.statuses.scheduled'), value: items.filter((m) => m.status === 'scheduled').length, color: 'bg-blue-50 text-blue-600' },
    { label: t('meetings.statuses.completed'), value: items.filter((m) => m.status === 'completed').length, color: 'bg-green-50 text-green-600' },
  ];

  const typeOptions = [
    { value: 'in_person', label: t('meetings.types.in_person') },
    { value: 'online', label: t('meetings.types.online') },
    { value: 'hybrid', label: t('meetings.types.hybrid') },
  ];

  const committeeOptions = [
    { value: '', label: t('meetings.selectCommittee') },
    ...committees.map((c) => ({ value: c.id, label: isAr ? c.nameAr : c.nameEn })),
  ];

  const roomOptions = [
    { value: '', label: t('meetings.selectRoom') },
    ...rooms.map((r) => ({
      value: r.id,
      label: `${isAr ? r.nameAr : r.nameEn} — ${r.building ?? ''} ${r.floor ? `(${t('meetings.floor')}: ${r.floor})` : ''} [${r.capacity}]`,
    })),
  ];

  const selectedRoom = meetingRoomId ? rooms.find((r) => r.id === meetingRoomId) : null;

  const inviteeRoleOptions = [
    { value: 'attendee', label: t('roles.CommitteeMember') },
    { value: 'head', label: t('roles.CommitteeHead') },
    { value: 'secretary', label: t('roles.CommitteeSecretary') },
    { value: 'observer', label: t('roles.Observer') },
  ];

  function getCommitteeName(cId: string | null) {
    if (!cId) return null;
    const c = committees.find((x) => x.id === cId);
    return c ? (isAr ? c.nameAr : c.nameEn) : null;
  }

  function getDuration(startStr: string, endStr: string) {
    const mins = Math.round((new Date(endStr).getTime() - new Date(startStr).getTime()) / 60000);
    return mins > 0 ? mins : null;
  }

  /* ─── Meeting Card ─── */
  function MeetingCard({ m }: { m: MeetingListItem }) {
    const d = new Date(m.startDateTimeUtc);
    const TypeIcon = TYPE_ICONS[m.type] ?? IconMeetings;
    const committeeName = getCommitteeName(m.committeeId);
    const dur = getDuration(m.startDateTimeUtc, m.endDateTimeUtc);

    return (
      <Card className="transition-shadow hover:shadow-md">
        <CardBody>
          <div className="flex gap-4">
            <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-brand-50 text-brand-700">
              <span className="text-lg font-bold leading-tight">{dayFmt.format(d)}</span>
              <span className="text-[10px] font-medium uppercase">{monthFmt.format(d)}</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <h3 className="truncate font-semibold text-neutral-900">{isAr ? m.titleAr : m.titleEn}</h3>
                <Badge variant={STATUS_VARIANT[m.status] ?? 'default'} className="shrink-0">
                  {t(`meetings.statuses.${m.status}` as any) ?? m.status}
                </Badge>
              </div>
              <p className="mt-0.5 text-xs text-neutral-400">{isAr ? m.titleEn : m.titleAr}</p>

              {/* Meta row */}
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-neutral-500">
                <span className="flex items-center gap-1"><IconClock className="h-3.5 w-3.5" />{dateFmt.format(d)}</span>
                <span className="flex items-center gap-1"><TypeIcon className="h-3.5 w-3.5" />{t(`meetings.types.${m.type}` as any)}</span>
                {dur && <span className="flex items-center gap-1">{dur} {t('meetings.minutes')}</span>}
              </div>

              {/* Location / Online / Committee chips */}
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {m.location && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs text-neutral-600">
                    <IconMapPin className="h-3 w-3" />{m.location}
                  </span>
                )}
                {(m.onlineJoinUrl || m.status === 'scheduled' || m.status === 'in_progress') && (
                  <button
                    onClick={() => navigate(`/meetings/${m.id}/live`)}
                    className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700 hover:bg-green-100 transition-colors"
                  >
                    <IconVideo className="h-3 w-3" />{t('meetings.joinMeeting')}
                  </button>
                )}
                {m.recordingUrl && (
                  <a
                    href={m.recordingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-medium text-purple-700 hover:bg-purple-100 transition-colors"
                  >
                    <IconVideo className="h-3 w-3" />{t('meetings.recording')}<IconExternalLink className="h-2.5 w-2.5" />
                  </a>
                )}
                {committeeName && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs text-amber-700">
                    <IconCommittees className="h-3 w-3" />{committeeName}
                  </span>
                )}
              </div>

              {/* Actions */}
              {hasRole('CommitteeSecretary') && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" icon={<IconEye className="h-3.5 w-3.5" />} onClick={() => void openDetail(m)}>{t('meetings.viewDetails')}</Button>
                  {m.status === 'draft' && <Button variant="outline" size="sm" onClick={() => void publish(m.id)}>{t('meetings.publish')}</Button>}
                  {m.status === 'scheduled' && <Button variant="outline" size="sm" icon={<IconBell className="h-3.5 w-3.5" />} onClick={() => void sendNotifications(m.id)}>{t('meetings.sendNotifications')}</Button>}
                  {m.status !== 'cancelled' && m.status !== 'completed' && <Button variant="ghost" size="sm" onClick={() => void cancel(m.id)}>{t('meetings.cancelMeeting')}</Button>}
                  <Button variant="outline" size="sm" onClick={() => void openAgenda(m)}>{t('meetings.agenda')}</Button>
                  <Button variant="outline" size="sm" icon={<IconUser className="h-3.5 w-3.5" />} onClick={() => void openInvitees(m)}>{t('meetings.invitees')}</Button>
                  <Button variant="outline" size="sm" icon={<IconQrCode className="h-3.5 w-3.5" />} onClick={() => setShareTarget({ type: 'Meeting', id: m.id, title: isAr ? m.titleAr : m.titleEn })}>{t('share.qrCode')}</Button>
                  <Button variant="outline" size="sm" icon={<IconQrCode className="h-3.5 w-3.5" />} onClick={() => setShareTarget({ type: 'Attendance', id: m.id, title: `${t('attendance.checkIn')} - ${isAr ? m.titleAr : m.titleEn}` })}>{t('attendance.qrCode')}</Button>
                </div>
              )}
              {!hasRole('CommitteeSecretary') && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" icon={<IconEye className="h-3.5 w-3.5" />} onClick={() => void openDetail(m)}>{t('meetings.viewDetails')}</Button>
                  <Button variant="outline" size="sm" icon={<IconQrCode className="h-3.5 w-3.5" />} onClick={() => setShareTarget({ type: 'Meeting', id: m.id, title: isAr ? m.titleAr : m.titleEn })}>{t('share.qrCode')}</Button>
                </div>
              )}
            </div>
          </div>
        </CardBody>
      </Card>
    );
  }

  /* ─── Detail tabs ─── */
  const DETAIL_TABS = [
    { key: 'overview' as const, label: t('meetings.overview') },
    { key: 'participants' as const, label: t('meetings.participants') },
    { key: 'agenda' as const, label: t('meetings.agenda') },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">{t('meetings.title')}</h1>
          <p className="mt-1 text-sm text-neutral-500">{t('meetings.description')}</p>
        </div>
        {hasRole('CommitteeSecretary') && (
          <Button icon={<IconPlus className="h-4 w-4" />} onClick={() => setShowCreate(true)}>{t('meetings.create')}</Button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {stats.map((s) => (
          <Card key={s.label}><CardBody className="flex items-center gap-3">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${s.color}`}><IconMeetings className="h-5 w-5" /></div>
            <div><p className="text-2xl font-bold text-neutral-900">{s.value}</p><p className="text-xs text-neutral-500">{s.label}</p></div>
          </CardBody></Card>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}><CardBody className="flex gap-4">
              <div className="h-14 w-14 animate-pulse rounded-xl bg-neutral-200" />
              <div className="flex-1 space-y-2"><div className="h-5 w-3/4 animate-pulse rounded bg-neutral-200" /><div className="h-4 w-1/2 animate-pulse rounded bg-neutral-100" /></div>
            </CardBody></Card>
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card><CardBody className="flex flex-col items-center py-16">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100 text-neutral-400"><IconCalendar className="h-8 w-8" /></div>
          <h3 className="mt-4 text-sm font-semibold text-neutral-900">{t('meetings.noData')}</h3>
          <p className="mt-1 text-sm text-neutral-500">{t('meetings.noDataDesc')}</p>
          {hasRole('CommitteeSecretary') && (
            <Button className="mt-4" icon={<IconPlus className="h-4 w-4" />} onClick={() => setShowCreate(true)}>{t('meetings.create')}</Button>
          )}
        </CardBody></Card>
      ) : (
        <>
          {upcoming.length > 0 && (
            <div>
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-neutral-700"><IconCalendar className="h-4 w-4 text-neutral-400" />{t('dashboard.upcomingMeetings')} ({upcoming.length})</h2>
              <div className="space-y-3">{upcoming.map((m) => <MeetingCard key={m.id} m={m} />)}</div>
            </div>
          )}
          {past.length > 0 && (
            <div>
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-neutral-700"><IconClock className="h-4 w-4 text-neutral-400" />{t('meetings.statuses.completed')} ({past.length})</h2>
              <div className="space-y-3">{past.map((m) => <MeetingCard key={m.id} m={m} />)}</div>
            </div>
          )}
        </>
      )}

      {/* Create Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title={t('meetings.create')} className="sm:max-w-xl">
        <div className="grid gap-4">
          <Select label={t('meetings.committee')} value={committeeId} onChange={(e) => setCommitteeId(e.target.value)} options={committeeOptions} />
          <Select label={t('meetings.type')} value={type} onChange={(e) => setType(e.target.value as any)} options={typeOptions} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label={t('meetings.titleAr')} value={titleAr} onChange={(e) => setTitleAr(e.target.value)} dir="rtl" />
            <Input label={t('meetings.titleEn')} value={titleEn} onChange={(e) => setTitleEn(e.target.value)} dir="ltr" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label={t('meetings.descriptionAr')} value={descriptionAr} onChange={(e) => setDescriptionAr(e.target.value)} dir="rtl" />
            <Input label={t('meetings.descriptionEn')} value={descriptionEn} onChange={(e) => setDescriptionEn(e.target.value)} dir="ltr" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label={t('meetings.start')} type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} />
            <Input label={t('meetings.end')} type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} />
          </div>
          {type !== 'online' && (
            <>
              <Select label={t('meetings.meetingRoom')} value={meetingRoomId} onChange={(e) => setMeetingRoomId(e.target.value)} options={roomOptions} />
              {selectedRoom && (
                <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-neutral-900">{isAr ? selectedRoom.nameAr : selectedRoom.nameEn}</span>
                    <span className="text-xs text-neutral-500">{t('meetings.capacity')}: {selectedRoom.capacity}</span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-2 text-xs text-neutral-500">
                    {selectedRoom.building && <span>{t('meetings.building')}: {selectedRoom.building}</span>}
                    {selectedRoom.floor && <span>{t('meetings.floor')}: {selectedRoom.floor}</span>}
                    {selectedRoom.hasVideoConference && <span className="rounded-full bg-blue-50 px-2 py-0.5 text-blue-600">{t('meetings.videoConference')}</span>}
                    {selectedRoom.hasProjector && <span className="rounded-full bg-purple-50 px-2 py-0.5 text-purple-600">{t('meetings.projector')}</span>}
                  </div>
                  {selectedRoom.mapUrl && (
                    <a href={selectedRoom.mapUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700">
                      <IconMapPin className="h-3 w-3" />{t('meetings.viewOnMap')}<IconExternalLink className="h-2.5 w-2.5" />
                    </a>
                  )}
                  {selectedRoom.latitude && selectedRoom.longitude && !selectedRoom.mapUrl && (
                    <a href={`https://www.google.com/maps?q=${selectedRoom.latitude},${selectedRoom.longitude}`} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700">
                      <IconMapPin className="h-3 w-3" />{t('meetings.viewOnMap')}<IconExternalLink className="h-2.5 w-2.5" />
                    </a>
                  )}
                </div>
              )}
              <Input label={t('meetings.location')} value={location} onChange={(e) => setLocation(e.target.value)} placeholder={t('meetings.locationPlaceholder')} />
            </>
          )}
          {type !== 'in_person' && (
            <>
              <Input label={t('meetings.onlineJoinUrl')} value={onlineJoinUrl} onChange={(e) => setOnlineJoinUrl(e.target.value)} placeholder="https://teams.microsoft.com/..." dir="ltr" />
              <p className="text-xs text-neutral-400">
                {t('meetings.createTeamsLink')} — {t('meetings.onlinePlatform')}: Microsoft Teams
              </p>
            </>
          )}
          <Input label={t('meetings.recordingUrl')} value={recordingUrl} onChange={(e) => setRecordingUrl(e.target.value)} placeholder="https://web.microsoftstream.com/..." dir="ltr" />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowCreate(false)}>{t('actions.cancel')}</Button>
            <Button onClick={() => void create()} disabled={!canCreate} loading={creating}>{t('actions.create')}</Button>
          </div>
        </div>
      </Modal>

      {/* Detail Modal */}
      <Modal open={!!detail} onClose={() => setDetail(null)} title={t('meetings.details')} className="sm:max-w-2xl lg:max-w-3xl">
        {detail && !loadingDetail && (
          <div className="space-y-4">
            {/* Tabs */}
            <div className="flex gap-1 rounded-lg bg-neutral-100 p-1">
              {DETAIL_TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setDetailTab(tab.key)}
                  className={[
                    'flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    detailTab === tab.key ? 'bg-neutral-0 text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-700',
                  ].join(' ')}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Overview tab */}
            {detailTab === 'overview' && (
              <div className="space-y-4">
                <div className="rounded-lg bg-brand-50 p-4">
                  <h3 className="text-lg font-bold text-neutral-900">{isAr ? detail.titleAr : detail.titleEn}</h3>
                  <p className="mt-1 text-sm text-neutral-500">{isAr ? detail.titleEn : detail.titleAr}</p>
                  {(detail.descriptionAr || detail.descriptionEn) && (
                    <p className="mt-2 text-sm text-neutral-700">{isAr ? detail.descriptionAr : detail.descriptionEn}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg border border-neutral-200 p-3">
                    <p className="text-xs font-medium text-neutral-500">{t('meetings.status')}</p>
                    <Badge variant={STATUS_VARIANT[detail.status] ?? 'default'} className="mt-1">
                      {t(`meetings.statuses.${detail.status}` as any)}
                    </Badge>
                  </div>
                  <div className="rounded-lg border border-neutral-200 p-3">
                    <p className="text-xs font-medium text-neutral-500">{t('meetings.type')}</p>
                    <p className="mt-1 text-sm font-medium text-neutral-900">{t(`meetings.types.${detail.type}` as any)}</p>
                  </div>
                  <div className="rounded-lg border border-neutral-200 p-3">
                    <p className="text-xs font-medium text-neutral-500">{t('meetings.start')}</p>
                    <p className="mt-1 text-sm font-medium text-neutral-900">{dateFmt.format(new Date(detail.startDateTimeUtc))}</p>
                  </div>
                  <div className="rounded-lg border border-neutral-200 p-3">
                    <p className="text-xs font-medium text-neutral-500">{t('meetings.end')}</p>
                    <p className="mt-1 text-sm font-medium text-neutral-900">{dateFmt.format(new Date(detail.endDateTimeUtc))}</p>
                  </div>
                  {detail.location && (
                    <div className="rounded-lg border border-neutral-200 p-3">
                      <p className="text-xs font-medium text-neutral-500">{t('meetings.location')}</p>
                      <p className="mt-1 flex items-center gap-1 text-sm font-medium text-neutral-900"><IconMapPin className="h-4 w-4 text-neutral-400" />{detail.location}</p>
                    </div>
                  )}
                  {(detail.committeeNameAr || detail.committeeNameEn) && (
                    <div className="rounded-lg border border-neutral-200 p-3">
                      <p className="text-xs font-medium text-neutral-500">{t('meetings.committee')}</p>
                      <p className="mt-1 flex items-center gap-1 text-sm font-medium text-neutral-900"><IconCommittees className="h-4 w-4 text-neutral-400" />{isAr ? detail.committeeNameAr : detail.committeeNameEn}</p>
                    </div>
                  )}
                  {getDuration(detail.startDateTimeUtc, detail.endDateTimeUtc) && (
                    <div className="rounded-lg border border-neutral-200 p-3">
                      <p className="text-xs font-medium text-neutral-500">{t('meetings.duration')}</p>
                      <p className="mt-1 text-sm font-medium text-neutral-900">{getDuration(detail.startDateTimeUtc, detail.endDateTimeUtc)} {t('meetings.minutes')}</p>
                    </div>
                  )}
                </div>

                {/* Meeting Room info */}
                {detail.meetingRoom && (
                  <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
                    <p className="text-xs font-medium text-neutral-500">{t('meetings.meetingRoom')}</p>
                    <p className="mt-1 text-sm font-semibold text-neutral-900">{isAr ? detail.meetingRoom.nameAr : detail.meetingRoom.nameEn}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-neutral-500">
                      {detail.meetingRoom.building && <span>{t('meetings.building')}: {detail.meetingRoom.building}</span>}
                      {detail.meetingRoom.floor && <span>{t('meetings.floor')}: {detail.meetingRoom.floor}</span>}
                      <span>{t('meetings.capacity')}: {detail.meetingRoom.capacity}</span>
                      {detail.meetingRoom.hasVideoConference && <span className="rounded-full bg-blue-50 px-2 py-0.5 text-blue-600">{t('meetings.videoConference')}</span>}
                      {detail.meetingRoom.hasProjector && <span className="rounded-full bg-purple-50 px-2 py-0.5 text-purple-600">{t('meetings.projector')}</span>}
                    </div>
                    {(detail.meetingRoom.mapUrl || (detail.meetingRoom.latitude && detail.meetingRoom.longitude)) && (
                      <a
                        href={detail.meetingRoom.mapUrl ?? `https://www.google.com/maps?q=${detail.meetingRoom.latitude},${detail.meetingRoom.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700"
                      >
                        <IconMapPin className="h-3.5 w-3.5" />{t('meetings.viewOnMap')}<IconExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                )}

                {/* Join Meeting in Platform */}
                {(detail.status === 'scheduled' || detail.status === 'in_progress') && (
                  <button
                    onClick={() => { setDetail(null); navigate(`/meetings/${detail.id}/live`); }}
                    className="flex w-full items-center gap-3 rounded-xl border-2 border-green-300 bg-gradient-to-r from-green-50 to-emerald-50 p-4 text-sm font-semibold text-green-800 shadow-sm transition-all hover:border-green-400 hover:shadow-md"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-600 text-white">
                      <IconVideo className="h-5 w-5" />
                    </div>
                    <div className="text-start">
                      <p className="font-bold">{t('meetings.joinMeetingInPlatform')}</p>
                      <p className="text-xs font-normal text-green-600">{t('meetings.joinMeetingInPlatformDesc')}</p>
                    </div>
                  </button>
                )}

                {/* Online join / recording links */}
                {(detail.onlineJoinUrl || detail.recordingUrl) && (
                  <div className="space-y-2">
                    {detail.onlineJoinUrl && (
                      <a
                        href={detail.onlineJoinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm font-medium text-blue-700 hover:bg-blue-100 transition-colors"
                      >
                        <IconVideo className="h-5 w-5" />
                        {t('meetings.openExternal')}
                        {detail.onlinePlatform && <span className="text-xs text-blue-500">({detail.onlinePlatform})</span>}
                        <IconExternalLink className="ms-auto h-4 w-4" />
                      </a>
                    )}
                    {detail.recordingUrl && (
                      <a
                        href={detail.recordingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 rounded-lg border border-purple-200 bg-purple-50 p-3 text-sm font-medium text-purple-700 hover:bg-purple-100 transition-colors"
                      >
                        <IconVideo className="h-5 w-5" />
                        {t('meetings.recording')}
                        <IconExternalLink className="ms-auto h-4 w-4" />
                      </a>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Participants tab */}
            {detailTab === 'participants' && (
              <div className="space-y-3">
                {detail.invitees.length === 0 ? (
                  <p className="py-8 text-center text-sm text-neutral-400">{t('meetings.invitees')} — 0</p>
                ) : (
                  detail.invitees.map((inv, idx) => (
                    <div key={idx} className="flex items-center gap-3 rounded-lg bg-neutral-50 p-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-brand-600">
                        <IconUser className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-neutral-900">{inv.displayName}</p>
                        <p className="text-xs text-neutral-500">{inv.email}</p>
                      </div>
                      <Badge variant={inv.role === 'chair' ? 'warning' : inv.role === 'secretary' ? 'info' : 'default'}>
                        {inv.role}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Agenda tab */}
            {detailTab === 'agenda' && (
              <div className="space-y-3">
                {detail.agenda.length === 0 ? (
                  <p className="py-8 text-center text-sm text-neutral-400">{t('meetings.agenda')} — 0</p>
                ) : (
                  detail.agenda.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3 rounded-lg border border-neutral-200 p-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-sm font-bold text-brand-700">{idx + 1}</div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-neutral-900">{isAr ? item.titleAr : item.titleEn}</p>
                        <p className="text-xs text-neutral-500">{isAr ? item.titleEn : item.titleAr}</p>
                        {(item.descriptionAr || item.descriptionEn) && (
                          <p className="mt-1 text-xs text-neutral-600">{isAr ? item.descriptionAr : item.descriptionEn}</p>
                        )}
                        {item.presenterName && (
                          <p className="mt-1 flex items-center gap-1 text-xs text-neutral-400">
                            <IconUser className="h-3 w-3" />{item.presenterName}
                          </p>
                        )}
                      </div>
                      {item.duration && (
                        <span className="shrink-0 text-xs text-neutral-400">{item.duration} {t('meetings.minutes')}</span>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
        {loadingDetail && (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-700" />
          </div>
        )}
      </Modal>

      {/* Agenda Modal */}
      <Modal open={!!agendaMeeting} onClose={() => setAgendaMeeting(null)} title={t('meetings.agenda')}>
        {agendaMeeting && (
          <div className="grid gap-4">
            <p className="text-sm font-medium text-neutral-700">
              {isAr ? agendaMeeting.titleAr : agendaMeeting.titleEn}
            </p>
            <div className="space-y-3">
              {agendaItems.map((item, idx) => (
                <div key={idx} className="rounded-lg border border-neutral-200 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-medium text-neutral-500">{t('meetings.agenda')} {idx + 1}</span>
                    {agendaItems.length > 1 && (
                      <button type="button" onClick={() => setAgendaItems(agendaItems.filter((_, i) => i !== idx))} className="rounded p-1 text-neutral-400 hover:bg-red-50 hover:text-red-500">
                        <IconTrash className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <div className="grid grid-cols-2 gap-2">
                      <Input placeholder={t('meetings.titleAr')} value={item.titleAr} onChange={(e) => updateAgendaItem(idx, 'titleAr', e.target.value)} dir="rtl" />
                      <Input placeholder={t('meetings.titleEn')} value={item.titleEn} onChange={(e) => updateAgendaItem(idx, 'titleEn', e.target.value)} dir="ltr" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Input placeholder={t('meetings.agendaDescriptionAr')} value={item.descriptionAr ?? ''} onChange={(e) => updateAgendaItem(idx, 'descriptionAr', e.target.value)} dir="rtl" />
                      <Input placeholder={t('meetings.agendaDescriptionEn')} value={item.descriptionEn ?? ''} onChange={(e) => updateAgendaItem(idx, 'descriptionEn', e.target.value)} dir="ltr" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Input placeholder={t('meetings.presenterName')} value={item.presenterName ?? ''} onChange={(e) => updateAgendaItem(idx, 'presenterName', e.target.value)} />
                      <Input placeholder={t('meetings.duration') + ' (' + t('meetings.minutes') + ')'} type="number" value={item.duration ?? ''} onChange={(e) => updateAgendaItem(idx, 'duration', Number(e.target.value))} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="ghost" size="sm" icon={<IconPlus className="h-3.5 w-3.5" />} onClick={() => setAgendaItems([...agendaItems, { titleAr: '', titleEn: '', descriptionAr: '', descriptionEn: '', presenterName: '' }])}>
              {t('meetings.addAgendaItem')}
            </Button>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setAgendaMeeting(null)}>{t('actions.cancel')}</Button>
              <Button onClick={() => void saveAgenda()} loading={savingAgenda}>{t('actions.save')}</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Invitees Modal */}
      <Modal open={!!inviteesMeeting} onClose={() => setInviteesMeeting(null)} title={t('meetings.invitees')}>
        {inviteesMeeting && (
          <div className="grid gap-4">
            <p className="text-sm font-medium text-neutral-700">
              {isAr ? inviteesMeeting.titleAr : inviteesMeeting.titleEn}
            </p>

            {invitees.length > 0 && (
              <div className="space-y-2">
                {invitees.map((inv, idx) => (
                  <div key={idx} className="flex items-center gap-3 rounded-lg bg-neutral-50 p-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-brand-600">
                      <IconUser className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-neutral-900">{inv.displayName}</p>
                      <p className="text-xs text-neutral-500">{inv.email} · {inv.role}</p>
                    </div>
                    <button type="button" onClick={() => setInvitees(invitees.filter((_, i) => i !== idx))} className="shrink-0 rounded p-1 text-neutral-400 hover:bg-red-50 hover:text-red-500">
                      <IconTrash className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="rounded-lg border border-dashed border-neutral-300 p-3">
              <p className="mb-2 text-xs font-medium text-neutral-500">{t('meetings.addInvitee')}</p>
              <div className="grid gap-2">
                <Input placeholder={t('committees.memberName')} value={newInvName} onChange={(e) => setNewInvName(e.target.value)} />
                <Input placeholder={t('committees.memberEmail')} value={newInvEmail} onChange={(e) => setNewInvEmail(e.target.value)} type="email" />
                <Select value={newInvRole} onChange={(e) => setNewInvRole(e.target.value)} options={inviteeRoleOptions} />
                <Button size="sm" variant="outline" icon={<IconPlus className="h-3.5 w-3.5" />} onClick={addInvitee} disabled={!newInvName.trim() || !newInvEmail.trim()}>
                  {t('meetings.addInvitee')}
                </Button>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setInviteesMeeting(null)}>{t('actions.cancel')}</Button>
              <Button onClick={() => void saveInvitees()} loading={savingInvitees}>{t('actions.save')}</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* QR Share Modal */}
      <QrShareModal
        open={!!shareTarget}
        onClose={() => setShareTarget(null)}
        entityType={shareTarget?.type ?? 'Meeting'}
        entityId={shareTarget?.id ?? ''}
        entityTitle={shareTarget?.title ?? ''}
      />
    </div>
  );
}
