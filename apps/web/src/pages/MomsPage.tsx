import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useApi } from '../hooks/useApi';
import { useAuth } from '../app/auth';
import { Card, CardBody, Badge, Button, Input, Select, Alert, useToast } from '../components/ui';
import { IconMom, IconCheck, IconDownload, IconPlus, IconTrash, IconCalendar, IconClock, IconX, IconQrCode } from '../components/icons';
import { QrShareModal } from '../components/QrShareModal';
import type { ShareableEntityType } from '../hooks/useShareLink';

/* ─── types ─── */
type MeetingOption = { id: string; titleAr: string; titleEn: string; startDateTimeUtc: string; status: string };
type AttendeeEntry = { displayName: string; email: string; present: boolean; attendanceStatus: string; absenceReason?: string };
type DecisionEntry = { textAr: string; textEn: string };
type AgendaMinuteEntry = { agendaItemTitle: string; notesAr: string; notesEn: string };
type RecommendationEntry = { textAr: string; textEn: string; assignedTo: string; assignedToEmail?: string; dueDate: string; priority: string; category?: string; beneficiary?: string };

const STEPS = ['create', 'attendance', 'submit', 'approve', 'export'] as const;

const PRIORITY_COLORS: Record<string, string> = {
  high: 'bg-red-50 text-red-700',
  medium: 'bg-amber-50 text-amber-700',
  low: 'bg-green-50 text-green-700',
};

export function MomsPage() {
  const { get, post, put } = useApi();
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const { hasRole } = useAuth();
  const isAr = i18n.language === 'ar';

  // Meeting selector
  const [meetings, setMeetings] = useState<MeetingOption[]>([]);
  const [selectedMeetingId, setSelectedMeetingId] = useState('');
  const [loadingMeetings, setLoadingMeetings] = useState(false);

  const [momId, setMomId] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [busy, setBusy] = useState(false);

  // Attendance
  const [attendees, setAttendees] = useState<AttendeeEntry[]>([]);

  // Decisions
  const [decisions, setDecisions] = useState<DecisionEntry[]>([{ textAr: '', textEn: '' }]);

  // Agenda minutes
  const [agendaMinutes, setAgendaMinutes] = useState<AgendaMinuteEntry[]>([]);

  // Recommendations
  const [recommendations, setRecommendations] = useState<RecommendationEntry[]>([]);

  const dateFmt = new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium', timeStyle: 'short' });

  // Load meetings on mount
  useEffect(() => {
    async function loadMeetings() {
      setLoadingMeetings(true);
      try {
        const res = await get<{ items: MeetingOption[] }>('/api/v1/meetings?page=1&pageSize=50');
        setMeetings(res.items);
      } catch { /* ignore */ }
      finally { setLoadingMeetings(false); }
    }
    void loadMeetings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const meetingOptions = [
    { value: '', label: t('moms.selectMeeting') },
    ...meetings.map((m) => ({
      value: m.id,
      label: `${isAr ? m.titleAr : m.titleEn} — ${dateFmt.format(new Date(m.startDateTimeUtc))}`,
    })),
  ];

  const priorityOptions = [
    { value: 'high', label: t('moms.high') },
    { value: 'medium', label: t('moms.medium') },
    { value: 'low', label: t('moms.low') },
  ];

  // Reject
  const [rejectReason, setRejectReason] = useState('');

  // QR share
  const [shareTarget, setShareTarget] = useState<{ type: ShareableEntityType; id: string; title: string } | null>(null);

  const attendanceStatusOptions = [
    { value: 'present', label: t('moms.attendanceStatuses.present') },
    { value: 'absent', label: t('moms.attendanceStatuses.absent') },
    { value: 'excused', label: t('moms.attendanceStatuses.excused') },
    { value: 'late', label: t('moms.attendanceStatuses.late') },
  ];

  const absenceReasonOptions = [
    { value: '', label: t('moms.selectAbsenceReason') },
    { value: 'sick_leave', label: t('moms.absenceReasons.sick_leave') },
    { value: 'official_travel', label: t('moms.absenceReasons.official_travel') },
    { value: 'personal_leave', label: t('moms.absenceReasons.personal_leave') },
    { value: 'schedule_conflict', label: t('moms.absenceReasons.schedule_conflict') },
    { value: 'no_notice', label: t('moms.absenceReasons.no_notice') },
    { value: 'other', label: t('moms.absenceReasons.other') },
  ];

  async function create() {
    if (!selectedMeetingId) return;
    setBusy(true);
    try {
      const res = await post<any>(`/api/v1/moms/by-meeting/${selectedMeetingId}`);
      setMomId(res.id);

      // Load invitees as attendees
      try {
        const invitees = await get<any[]>(`/api/v1/meetings/${selectedMeetingId}/invitees`);
        if (invitees?.length) {
          setAttendees(invitees.map((inv: any) => ({ displayName: inv.displayName, email: inv.email, present: true, attendanceStatus: 'present' })));
        } else {
          setAttendees([{ displayName: '', email: '', present: true, attendanceStatus: 'present' }]);
        }
      } catch {
        setAttendees([{ displayName: '', email: '', present: true, attendanceStatus: 'present' }]);
      }

      // Load agenda items as agenda minutes
      try {
        const agenda = await get<any[]>(`/api/v1/meetings/${selectedMeetingId}/agenda`);
        if (agenda?.length) {
          setAgendaMinutes(agenda.map((a: any) => ({
            agendaItemTitle: isAr ? a.titleAr : a.titleEn,
            notesAr: '',
            notesEn: '',
          })));
        } else {
          setAgendaMinutes([]);
        }
      } catch {
        setAgendaMinutes([]);
      }

      setDecisions([{ textAr: '', textEn: '' }]);
      setRecommendations([]);
      setCurrentStep(1);
      toast.success(t('moms.steps.create') + ' ✓');
    } catch { toast.error(t('errors.generic')); }
    finally { setBusy(false); }
  }

  async function saveAll() {
    if (!momId) return;
    setBusy(true);
    try {
      // Save attendance
      await put(`/api/v1/moms/${momId}/attendance`, {
        attendees: attendees.filter((a) => a.displayName.trim()),
      });
      // Save decisions
      await put(`/api/v1/moms/${momId}/decisions`, {
        decisions: decisions.filter((d) => d.textAr.trim() || d.textEn.trim()),
      });
      // Save agenda minutes
      if (agendaMinutes.length > 0) {
        await put(`/api/v1/moms/${momId}/agenda-minutes`, {
          items: agendaMinutes.filter((am) => am.notesAr.trim() || am.notesEn.trim()),
        });
      }
      // Save recommendations
      if (recommendations.length > 0) {
        await put(`/api/v1/moms/${momId}/recommendations`, {
          items: recommendations.filter((r) => r.textAr.trim() || r.textEn.trim()),
        });
      }
      setCurrentStep(2);
      toast.success(t('moms.attendance') + ' & ' + t('moms.decisions') + ' ✓');
    } catch { toast.error(t('errors.generic')); }
    finally { setBusy(false); }
  }

  async function submit() {
    if (!momId) return; setBusy(true);
    try { await post(`/api/v1/moms/${momId}/submit`); setCurrentStep(3); toast.success(t('moms.steps.submit') + ' ✓'); }
    catch { toast.error(t('errors.generic')); }
    finally { setBusy(false); }
  }

  async function approve() {
    if (!momId) return; setBusy(true);
    try { await post(`/api/v1/moms/${momId}/approve`); setCurrentStep(4); toast.success(t('moms.steps.approve') + ' ✓'); }
    catch { toast.error(t('errors.generic')); }
    finally { setBusy(false); }
  }

  async function exportDocs() {
    if (!momId) return; setBusy(true);
    try {
      const res = await post<any>(`/api/v1/moms/${momId}/export`);
      const word = await get<any>(res.wordDownloadUrl);
      const pdf = await get<any>(res.pdfDownloadUrl);
      window.open(word.url, '_blank');
      window.open(pdf.url, '_blank');
      toast.success(t('moms.steps.export') + ' ✓');
    } catch { toast.error(t('errors.generic')); }
    finally { setBusy(false); }
  }

  const stepIcons = [
    <IconMom className="h-5 w-5" />,
    <IconCheck className="h-5 w-5" />,
    <IconMom className="h-5 w-5" />,
    <IconCheck className="h-5 w-5" />,
    <IconDownload className="h-5 w-5" />,
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-neutral-900">{t('moms.title')}</h1>
        <p className="mt-1 text-sm text-neutral-500">{t('moms.description')}</p>
      </div>

      {/* Step indicator */}
      <Card>
        <CardBody className="py-6">
          <div className="flex items-center justify-between">
            {STEPS.map((step, idx) => (
              <div key={step} className="flex flex-1 items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={[
                      'flex h-12 w-12 items-center justify-center rounded-full text-sm font-semibold transition-all',
                      idx < currentStep
                        ? 'bg-green-500 text-white shadow-md shadow-green-200'
                        : idx === currentStep
                          ? 'bg-brand-700 text-white shadow-md shadow-brand-200'
                          : 'bg-neutral-100 text-neutral-400',
                    ].join(' ')}
                  >
                    {idx < currentStep ? <IconCheck className="h-5 w-5" /> : stepIcons[idx]}
                  </div>
                  <span className={[
                    'mt-2 text-xs font-medium',
                    idx <= currentStep ? 'text-neutral-900' : 'text-neutral-400',
                  ].join(' ')}>
                    {step === 'attendance' ? t('moms.attendance') : t(`moms.steps.${step}` as any)}
                  </span>
                </div>
                {idx < STEPS.length - 1 && (
                  <div className={[
                    'mx-3 h-0.5 flex-1 rounded transition-colors',
                    idx < currentStep ? 'bg-green-500' : 'bg-neutral-200',
                  ].join(' ')} />
                )}
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Action card */}
      <Card>
        <CardBody className="space-y-4">
          {/* Step 0: Create */}
          {currentStep === 0 && (
            <>
              <div className="flex items-center gap-3 rounded-lg bg-brand-50 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
                  <IconMom className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-neutral-900">{t('moms.steps.create')}</h3>
                  <p className="text-xs text-neutral-500">{t('moms.noDataDesc')}</p>
                </div>
              </div>

              {/* Meeting selector dropdown */}
              <Select
                label={t('moms.selectMeeting')}
                value={selectedMeetingId}
                onChange={(e) => setSelectedMeetingId(e.target.value)}
                options={meetingOptions}
                disabled={loadingMeetings}
              />

              {/* Show selected meeting info */}
              {selectedMeetingId && (() => {
                const m = meetings.find((x) => x.id === selectedMeetingId);
                if (!m) return null;
                return (
                  <div className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-neutral-50 p-3">
                    <IconCalendar className="h-5 w-5 text-neutral-400" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-neutral-900">{isAr ? m.titleAr : m.titleEn}</p>
                      <p className="flex items-center gap-2 text-xs text-neutral-500">
                        <IconClock className="h-3 w-3" />{dateFmt.format(new Date(m.startDateTimeUtc))}
                        <Badge variant={m.status === 'completed' ? 'success' : m.status === 'scheduled' ? 'info' : 'default'}>{m.status}</Badge>
                      </p>
                    </div>
                  </div>
                );
              })()}

              {hasRole('CommitteeSecretary') && (
                <Button
                  icon={<IconMom className="h-4 w-4" />}
                  onClick={() => void create()}
                  loading={busy}
                  disabled={!selectedMeetingId}
                  className="w-full"
                >
                  {t('moms.create')}
                </Button>
              )}
            </>
          )}

          {/* Step 1: Attendance, Decisions, Agenda Minutes, Recommendations */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 rounded-lg bg-blue-50 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                  <IconCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-neutral-900">{t('moms.attendance')}</h3>
                  <p className="text-xs text-neutral-500">{t('moms.editAttendanceDesc')}</p>
                </div>
              </div>

              {/* ── Attendees ── */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-neutral-700">{t('moms.attendance')}</label>
                <div className="space-y-2">
                  {attendees.map((att, idx) => (
                    <div key={idx} className="rounded-lg bg-neutral-50 p-2">
                      <div className="flex items-center gap-2">
                        <div className="w-28 shrink-0">
                          <Select
                            value={att.attendanceStatus}
                            onChange={(e) => {
                              const status = e.target.value;
                              const isPresent = status === 'present' || status === 'late';
                              setAttendees(attendees.map((a, i) => (i === idx ? { ...a, attendanceStatus: status, present: isPresent, absenceReason: isPresent ? '' : a.absenceReason } : a)));
                            }}
                            options={attendanceStatusOptions}
                          />
                        </div>
                        <Input placeholder={t('committees.memberName')} value={att.displayName} onChange={(e) => setAttendees(attendees.map((a, i) => (i === idx ? { ...a, displayName: e.target.value } : a)))} />
                        <Input placeholder={t('committees.memberEmail')} value={att.email} onChange={(e) => setAttendees(attendees.map((a, i) => (i === idx ? { ...a, email: e.target.value } : a)))} />
                        <button type="button" onClick={() => setAttendees(attendees.filter((_, i) => i !== idx))} className="shrink-0 rounded p-1 text-neutral-400 hover:bg-red-50 hover:text-red-500">
                          <IconTrash className="h-4 w-4" />
                        </button>
                      </div>
                      {(att.attendanceStatus === 'absent' || att.attendanceStatus === 'excused') && (
                        <div className="ms-7 mt-1.5">
                          <Select
                            value={att.absenceReason ?? ''}
                            onChange={(e) => setAttendees(attendees.map((a, i) => (i === idx ? { ...a, absenceReason: e.target.value } : a)))}
                            options={absenceReasonOptions}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <Button variant="ghost" size="sm" className="mt-2" icon={<IconPlus className="h-3.5 w-3.5" />} onClick={() => setAttendees([...attendees, { displayName: '', email: '', present: true, attendanceStatus: 'present', absenceReason: '' }])}>
                  {t('moms.addAttendee')}
                </Button>
              </div>

              {/* ── Agenda Minutes ── */}
              {agendaMinutes.length > 0 && (
                <div>
                  <label className="mb-2 block text-sm font-semibold text-neutral-700">{t('moms.agendaDiscussion')}</label>
                  <div className="space-y-3">
                    {agendaMinutes.map((am, idx) => (
                      <div key={idx} className="rounded-lg border border-neutral-200 p-3">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="flex items-center gap-2 text-xs font-medium text-neutral-600">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-700">{idx + 1}</span>
                            {am.agendaItemTitle}
                          </span>
                          <button type="button" onClick={() => setAgendaMinutes(agendaMinutes.filter((_, i) => i !== idx))} className="rounded p-1 text-neutral-400 hover:bg-red-50 hover:text-red-500">
                            <IconTrash className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div className="grid gap-2">
                          <textarea
                            placeholder={t('moms.noteForItem') + ' (AR)'}
                            value={am.notesAr}
                            onChange={(e) => setAgendaMinutes(agendaMinutes.map((a, i) => (i === idx ? { ...a, notesAr: e.target.value } : a)))}
                            dir="rtl"
                            className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                            rows={2}
                          />
                          <textarea
                            placeholder={t('moms.noteForItem') + ' (EN)'}
                            value={am.notesEn}
                            onChange={(e) => setAgendaMinutes(agendaMinutes.map((a, i) => (i === idx ? { ...a, notesEn: e.target.value } : a)))}
                            dir="ltr"
                            className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                            rows={2}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button variant="ghost" size="sm" className="mt-2" icon={<IconPlus className="h-3.5 w-3.5" />} onClick={() => setAgendaMinutes([...agendaMinutes, { agendaItemTitle: '', notesAr: '', notesEn: '' }])}>
                    {t('moms.addAgendaMinute')}
                  </Button>
                </div>
              )}

              {/* ── Decisions ── */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-neutral-700">{t('moms.decisions')}</label>
                <div className="space-y-2">
                  {decisions.map((dec, idx) => (
                    <div key={idx} className="flex items-start gap-2 rounded-lg border border-neutral-200 p-2">
                      <div className="grid flex-1 gap-1.5">
                        <Input placeholder={t('moms.decisions') + ' (AR)'} value={dec.textAr} onChange={(e) => setDecisions(decisions.map((d, i) => (i === idx ? { ...d, textAr: e.target.value } : d)))} dir="rtl" />
                        <Input placeholder={t('moms.decisions') + ' (EN)'} value={dec.textEn} onChange={(e) => setDecisions(decisions.map((d, i) => (i === idx ? { ...d, textEn: e.target.value } : d)))} dir="ltr" />
                      </div>
                      {decisions.length > 1 && (
                        <button type="button" onClick={() => setDecisions(decisions.filter((_, i) => i !== idx))} className="mt-2 shrink-0 rounded p-1 text-neutral-400 hover:bg-red-50 hover:text-red-500">
                          <IconTrash className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <Button variant="ghost" size="sm" className="mt-2" icon={<IconPlus className="h-3.5 w-3.5" />} onClick={() => setDecisions([...decisions, { textAr: '', textEn: '' }])}>
                  {t('moms.addDecision')}
                </Button>
              </div>

              {/* ── Recommendations ── */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-neutral-700">{t('moms.recommendations')}</label>
                {recommendations.length === 0 ? (
                  <p className="mb-2 text-xs text-neutral-400">{t('moms.recommendations')} — 0</p>
                ) : (
                  <div className="space-y-3">
                    {recommendations.map((rec, idx) => (
                      <div key={idx} className="rounded-lg border border-neutral-200 p-3">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-xs font-medium text-neutral-500">{t('moms.recommendation')} {idx + 1}</span>
                          <button type="button" onClick={() => setRecommendations(recommendations.filter((_, i) => i !== idx))} className="rounded p-1 text-neutral-400 hover:bg-red-50 hover:text-red-500">
                            <IconTrash className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div className="grid gap-2">
                          <Input placeholder={t('moms.recommendation') + ' (AR)'} value={rec.textAr} onChange={(e) => setRecommendations(recommendations.map((r, i) => (i === idx ? { ...r, textAr: e.target.value } : r)))} dir="rtl" />
                          <Input placeholder={t('moms.recommendation') + ' (EN)'} value={rec.textEn} onChange={(e) => setRecommendations(recommendations.map((r, i) => (i === idx ? { ...r, textEn: e.target.value } : r)))} dir="ltr" />
                          <div className="grid grid-cols-3 gap-2">
                            <Input placeholder={t('moms.assignedTo')} value={rec.assignedTo} onChange={(e) => setRecommendations(recommendations.map((r, i) => (i === idx ? { ...r, assignedTo: e.target.value } : r)))} />
                            <Input type="date" placeholder={t('moms.dueDate')} value={rec.dueDate} onChange={(e) => setRecommendations(recommendations.map((r, i) => (i === idx ? { ...r, dueDate: e.target.value } : r)))} />
                            <Select value={rec.priority} onChange={(e) => setRecommendations(recommendations.map((r, i) => (i === idx ? { ...r, priority: e.target.value } : r)))} options={priorityOptions} />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <Input placeholder={t('moms.category')} value={rec.category ?? ''} onChange={(e) => setRecommendations(recommendations.map((r, i) => (i === idx ? { ...r, category: e.target.value } : r)))} />
                            <Input placeholder={t('moms.beneficiary')} value={rec.beneficiary ?? ''} onChange={(e) => setRecommendations(recommendations.map((r, i) => (i === idx ? { ...r, beneficiary: e.target.value } : r)))} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <Button variant="ghost" size="sm" className="mt-2" icon={<IconPlus className="h-3.5 w-3.5" />} onClick={() => setRecommendations([...recommendations, { textAr: '', textEn: '', assignedTo: '', dueDate: '', priority: 'medium' }])}>
                  {t('moms.addRecommendation')}
                </Button>
              </div>

              <Button onClick={() => void saveAll()} loading={busy} className="w-full">
                {t('actions.save')} & {t('actions.next')}
              </Button>
            </div>
          )}

          {/* Step 2: Submit */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-lg bg-amber-50 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                  <IconMom className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-neutral-900">{t('moms.steps.submit')}</h3>
                  <p className="text-xs text-neutral-500">{t('moms.statuses.draft')}</p>
                </div>
              </div>

              {/* Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-lg border border-neutral-200 p-3 text-center">
                  <p className="text-2xl font-bold text-neutral-900">{attendees.filter(a => a.present).length}/{attendees.length}</p>
                  <p className="text-xs text-neutral-500">{t('moms.attendance')}</p>
                </div>
                <div className="rounded-lg border border-neutral-200 p-3 text-center">
                  <p className="text-2xl font-bold text-neutral-900">{decisions.filter(d => d.textAr.trim() || d.textEn.trim()).length}</p>
                  <p className="text-xs text-neutral-500">{t('moms.decisions')}</p>
                </div>
                <div className="rounded-lg border border-neutral-200 p-3 text-center">
                  <p className="text-2xl font-bold text-neutral-900">{agendaMinutes.filter(am => am.notesAr.trim() || am.notesEn.trim()).length}</p>
                  <p className="text-xs text-neutral-500">{t('moms.agendaMinutes')}</p>
                </div>
                <div className="rounded-lg border border-neutral-200 p-3 text-center">
                  <p className="text-2xl font-bold text-neutral-900">{recommendations.length}</p>
                  <p className="text-xs text-neutral-500">{t('moms.recommendations')}</p>
                </div>
              </div>

              {/* Recommendations summary */}
              {recommendations.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-neutral-700">{t('moms.recommendations')}:</p>
                  {recommendations.map((rec, idx) => (
                    <div key={idx} className="flex items-center gap-2 rounded-lg bg-neutral-50 p-2 text-xs">
                      <span className={`rounded-full px-2 py-0.5 font-medium ${PRIORITY_COLORS[rec.priority] ?? 'bg-neutral-100 text-neutral-700'}`}>{t(`moms.${rec.priority}` as any)}</span>
                      <span className="flex-1 truncate text-neutral-700">{isAr ? rec.textAr : rec.textEn}</span>
                      {rec.assignedTo && <span className="text-neutral-400">{rec.assignedTo}</span>}
                    </div>
                  ))}
                </div>
              )}

              {hasRole('CommitteeSecretary') && (
                <Button onClick={() => void submit()} loading={busy} className="w-full">
                  {t('moms.submit')}
                </Button>
              )}
            </div>
          )}

          {/* Step 3: Approve */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-lg bg-blue-50 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                  <IconCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-neutral-900">{t('moms.steps.approve')}</h3>
                  <p className="text-xs text-neutral-500">{t('moms.statuses.pending_approval')}</p>
                </div>
              </div>
              {hasRole('CommitteeHead') && (
                <div className="space-y-3">
                  <Button onClick={() => void approve()} loading={busy} className="w-full">
                    {t('moms.approve')}
                  </Button>
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                    <Input
                      placeholder={t('moms.rejectReason')}
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                    />
                    <Button
                      variant="outline"
                      className="mt-2 w-full border-red-300 text-red-600 hover:bg-red-100"
                      onClick={async () => {
                        if (!momId) return;
                        setBusy(true);
                        try {
                          await post(`/api/v1/moms/${momId}/reject`, { reason: rejectReason || null });
                          setCurrentStep(1);
                          toast.success(t('moms.rejected'));
                          setRejectReason('');
                        } catch { toast.error(t('errors.generic')); }
                        finally { setBusy(false); }
                      }}
                      loading={busy}
                      icon={<IconX className="h-4 w-4" />}
                    >
                      {t('moms.reject')}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Export */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-lg bg-green-50 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-100 text-green-700">
                  <IconDownload className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-neutral-900">{t('moms.steps.export')}</h3>
                  <p className="text-xs text-neutral-500">{t('moms.statuses.approved')}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  icon={<IconDownload className="h-4 w-4" />}
                  onClick={() => void exportDocs()}
                  loading={busy}
                  className="flex-1"
                >
                  {t('moms.export')} — {t('moms.momReport')}
                </Button>
                {momId && (
                  <Button
                    variant="outline"
                    icon={<IconQrCode className="h-4 w-4" />}
                    onClick={() => {
                      const m = meetings.find((x) => x.id === selectedMeetingId);
                      setShareTarget({ type: 'Mom', id: momId, title: m ? (isAr ? m.titleAr : m.titleEn) : 'MOM' });
                    }}
                  >
                    {t('share.qrCode')}
                  </Button>
                )}
              </div>
            </div>
          )}

          {momId && (
            <Alert variant="info" className="mt-2">
              MOM ID: <span className="font-mono text-xs">{momId}</span>
            </Alert>
          )}
        </CardBody>
      </Card>

      {/* QR Share Modal */}
      {shareTarget && (
        <QrShareModal
          open={!!shareTarget}
          onClose={() => setShareTarget(null)}
          entityType={shareTarget.type}
          entityId={shareTarget.id}
          entityTitle={shareTarget.title}
        />
      )}
    </div>
  );
}
