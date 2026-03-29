import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line,
} from 'recharts';

import { useApi } from '../hooks/useApi';
import { useAuth } from '../app/auth';
import { Card, CardBody, Badge, Button, Modal, Input, Select, useToast } from '../components/ui';
import { IconSurveys, IconPlus, IconDownload, IconCheckCircle, IconTrash, IconBroadcast, IconReport, IconSend } from '../components/icons';

/* ── Types ──────────────────────────────────────────────────────────── */

type SurveyItem = {
  id: string;
  titleAr: string;
  titleEn: string;
  type: string;
  targetAudience: string;
  status: string;
  startAtUtc: string;
  endAtUtc: string;
  committeeId?: string;
  recommendationTaskId?: string;
  responseCount?: number;
  questionCount?: number;
  allowLuckyDraw?: boolean;
};

type RaffleWinner = {
  id: string;
  respondentName?: string;
  respondentEmail?: string;
  employeeId?: string;
  department?: string;
  submittedAtUtc: string;
};

type RaffleResult = {
  surveyId: string;
  surveyTitleAr: string;
  surveyTitleEn: string;
  totalResponses: number;
  winnersCount: number;
  winners: RaffleWinner[];
  drawnAtUtc: string;
};

type QuestionDraft = {
  order: number;
  type: 'single' | 'multi' | 'text' | 'rating';
  textAr: string;
  textEn: string;
  options: string[];
};

type CommitteeOption = { id: string; nameAr: string; nameEn: string };
type TemplateItem = {
  id: string;
  nameAr: string;
  nameEn: string;
  descriptionAr?: string;
  descriptionEn?: string;
  type: string;
  targetAudience: string;
  questionCount: number;
};

type WordCloudItem = { text: string; value: number };
type WordCloudQuestion = {
  questionId: string;
  order: number;
  textAr: string;
  textEn: string;
  words: WordCloudItem[];
};
type DemographicsData = {
  byDepartment: Array<{ label: string; count: number }>;
  byGender: Array<{ label: string; count: number }>;
};

type AnalyticsData = {
  id: string;
  titleAr: string;
  titleEn: string;
  status: string;
  totalResponses: number;
  questionCount: number;
  questions: Array<{
    id: string;
    order: number;
    type: string;
    textAr: string;
    textEn: string;
    answeredCount: number;
    tallies?: Array<{ option: string; count: number; percentage: number }>;
    averageRating?: number;
    distribution?: Array<{ rating: number; count: number }>;
    sampleResponses?: string[];
    totalTextResponses?: number;
  }>;
  timeline: Array<{ date: string; count: number }>;
  wordCloud?: WordCloudQuestion[];
  demographics?: DemographicsData;
};

/* ── Constants ──────────────────────────────────────────────────────── */

const STATUS_VARIANT: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
  draft: 'default',
  active: 'success',
  closed: 'info',
};

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-neutral-50 text-neutral-600',
  active: 'bg-green-50 text-green-600',
  closed: 'bg-blue-50 text-blue-600',
};

const PIE_COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6'];
const EMPTY_QUESTION: QuestionDraft = { order: 1, type: 'single', textAr: '', textEn: '', options: ['', ''] };

/* ── Component ──────────────────────────────────────────────────────── */

export function SurveysPage() {
  const { get, post, del } = useApi();
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const { hasRole } = useAuth();
  const isAr = i18n.language === 'ar';

  // List state
  const [items, setItems] = useState<SurveyItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Create form state
  const [showCreate, setShowCreate] = useState(false);
  const [titleAr, setTitleAr] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [surveyType, setSurveyType] = useState<'general' | 'poll'>('general');
  const [audience, setAudience] = useState<'staff' | 'public'>('staff');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [allowLuckyDraw, setAllowLuckyDraw] = useState(false);
  const [questions, setQuestions] = useState<QuestionDraft[]>([{ ...EMPTY_QUESTION }]);
  const [creating, setCreating] = useState(false);
  const [startingLive, setStartingLive] = useState<string | null>(null);

  // Committee integration
  const [committeeId, setCommitteeId] = useState('');
  const [committees, setCommittees] = useState<CommitteeOption[]>([]);

  // Templates
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [showTemplates, setShowTemplates] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [templateSurveyId, setTemplateSurveyId] = useState<string | null>(null);
  const [templateNameAr, setTemplateNameAr] = useState('');
  const [templateNameEn, setTemplateNameEn] = useState('');

  // Analytics
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [analyticsTab, setAnalyticsTab] = useState<'overview' | 'wordcloud' | 'demographics'>('overview');

  // Email results
  const [showEmailResults, setShowEmailResults] = useState(false);
  const [emailSurveyId, setEmailSurveyId] = useState<string | null>(null);
  const [emailRecipients, setEmailRecipients] = useState('');
  const [emailMessageAr, setEmailMessageAr] = useState('');
  const [emailMessageEn, setEmailMessageEn] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);

  // Raffle / Lucky draw
  const [showRaffle, setShowRaffle] = useState(false);
  const [raffleResult, setRaffleResult] = useState<RaffleResult | null>(null);
  const [drawingWinners, setDrawingWinners] = useState(false);
  const [winnerCount, setWinnerCount] = useState(1);
  const [raffleSurveyId, setRaffleSurveyId] = useState<string | null>(null);

  /* ── Data Loading ────────────────────────────────────────────────── */

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: '1', pageSize: '50' });
      if (statusFilter) params.set('status', statusFilter);
      if (typeFilter) params.set('type', typeFilter);
      if (searchTerm.trim()) params.set('search', searchTerm.trim());
      const res = await get<{ items: SurveyItem[] }>(`/api/v1/surveys?${params}`);
      setItems(res.items);
    } catch { toast.error(t('errors.loadFailed')); }
    finally { setLoading(false); }
  }, [get, statusFilter, typeFilter, searchTerm, t, toast]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    void (async () => {
      try {
        const res = await get<{ items: CommitteeOption[] }>('/api/v1/committees?page=1&pageSize=100');
        setCommittees(res.items ?? []);
      } catch { /* ignore */ }
    })();
    void loadTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadTemplates() {
    try {
      const res = await get<TemplateItem[]>('/api/v1/surveys/templates');
      setTemplates(res ?? []);
    } catch { /* ignore */ }
  }

  /* ── Create Survey ───────────────────────────────────────────────── */

  function resetCreateForm() {
    setTitleAr(''); setTitleEn(''); setSurveyType('general'); setAudience('staff');
    setStartDate(''); setEndDate(''); setAllowLuckyDraw(false);
    setQuestions([{ ...EMPTY_QUESTION }]); setCommitteeId(''); setSelectedTemplateId('');
  }

  async function create() {
    setCreating(true);
    try {
      const now = new Date();
      const defaultEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      await post('/api/v1/surveys', {
        type: surveyType, targetAudience: audience, titleAr, titleEn,
        startAtUtc: startDate ? new Date(startDate).toISOString() : now.toISOString(),
        endAtUtc: endDate ? new Date(endDate).toISOString() : defaultEnd.toISOString(),
        allowLuckyDraw,
        committeeId: committeeId || null,
        templateId: selectedTemplateId || null,
        questions: questions
          .filter((q) => q.textAr.trim() || q.textEn.trim())
          .map((q, idx) => ({
            order: idx + 1, type: q.type, textAr: q.textAr, textEn: q.textEn,
            options: q.type === 'text' || q.type === 'rating' ? [] : q.options.filter((o) => o.trim()),
          })),
      });
      resetCreateForm();
      setShowCreate(false);
      toast.success(t('surveys.create') + ' \u2713');
      await load();
    } catch { toast.error(t('errors.generic')); }
    finally { setCreating(false); }
  }

  /* ── Actions ─────────────────────────────────────────────────────── */

  async function activate(id: string) {
    try { await post(`/api/v1/surveys/${id}/activate`); toast.success(t('surveys.activate') + ' \u2713'); await load(); }
    catch { toast.error(t('errors.generic')); }
  }
  async function closeSurvey(id: string) {
    try { await post(`/api/v1/surveys/${id}/close`); toast.success(t('surveys.close') + ' \u2713'); await load(); }
    catch { toast.error(t('errors.generic')); }
  }

  function exportFile(id: string, format: 'xlsx' | 'pdf') {
    void (async () => {
      try {
        const ext = format === 'xlsx' ? 'export.xlsx' : 'export.pdf';
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/surveys/${id}/${ext}`);
        if (!res.ok) { toast.error(`${t('surveys.export')}: ${res.status}`); return; }
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `survey_${id}.${format === 'xlsx' ? 'xlsx' : 'html'}`; a.click();
        URL.revokeObjectURL(url);
        toast.success((format === 'xlsx' ? t('surveys.export') : t('surveys.exportPdf')) + ' \u2713');
      } catch { toast.error(t('errors.generic')); }
    })();
  }

  async function startLive(surveyId: string) {
    setStartingLive(surveyId);
    try {
      const res = await post<{ id: string; joinCode: string; presenterKey: string }>(
        `/api/v1/surveys/${surveyId}/live-sessions`,
      );
      window.open(`/surveys/${surveyId}/live/${res.id}?key=${res.presenterKey}`, '_blank');
      toast.success(t('liveSurvey.liveSession') + ' \u2713');
    } catch { toast.error(t('errors.generic')); }
    finally { setStartingLive(null); }
  }

  /* ── Templates ───────────────────────────────────────────────────── */

  function saveAsTemplate(surveyId: string) {
    setTemplateSurveyId(surveyId);
    const survey = items.find(s => s.id === surveyId);
    setTemplateNameAr(survey?.titleAr ?? '');
    setTemplateNameEn(survey?.titleEn ?? '');
  }

  async function confirmSaveAsTemplate() {
    if (!templateSurveyId) return;
    setSavingTemplate(true);
    try {
      await post(`/api/v1/surveys/${templateSurveyId}/save-as-template`, {
        nameAr: templateNameAr, nameEn: templateNameEn,
      });
      toast.success(t('surveys.templateSaved'));
      setTemplateSurveyId(null);
      await loadTemplates();
    } catch { toast.error(t('errors.generic')); }
    finally { setSavingTemplate(false); }
  }

  async function deleteTemplate(templateId: string) {
    try {
      await del(`/api/v1/surveys/templates/${templateId}`);
      toast.success(t('surveys.templateDeleted'));
      await loadTemplates();
    } catch { toast.error(t('errors.generic')); }
  }

  /* ── Analytics ───────────────────────────────────────────────────── */

  async function openAnalytics(surveyId: string) {
    setShowAnalytics(true);
    setLoadingAnalytics(true);
    setAnalyticsData(null);
    setAnalyticsTab('overview');
    try {
      const data = await get<AnalyticsData>(`/api/v1/surveys/${surveyId}/analytics`);
      setAnalyticsData(data);
    } catch { toast.error(t('errors.loadFailed')); }
    finally { setLoadingAnalytics(false); }
  }

  function openEmailResults(surveyId: string) {
    setEmailSurveyId(surveyId);
    setEmailRecipients('');
    setEmailMessageAr('');
    setEmailMessageEn('');
    setShowEmailResults(true);
  }

  async function sendEmailResults() {
    if (!emailSurveyId) return;
    const recipients = emailRecipients.split(/[,;\n]/).map(e => e.trim()).filter(Boolean);
    if (recipients.length === 0) { toast.error(t('surveys.noRecipients')); return; }
    setSendingEmail(true);
    try {
      await post(`/api/v1/surveys/${emailSurveyId}/email-results`, {
        recipients,
        messageAr: emailMessageAr || undefined,
        messageEn: emailMessageEn || undefined,
      });
      toast.success(t('surveys.emailSent'));
      setShowEmailResults(false);
    } catch { toast.error(t('errors.generic')); }
    finally { setSendingEmail(false); }
  }

  /* ── Raffle / Lucky Draw ────────────────────────────────────────── */

  function openRaffle(surveyId: string) {
    setRaffleSurveyId(surveyId);
    setRaffleResult(null);
    setWinnerCount(1);
    setShowRaffle(true);
  }

  async function drawWinners() {
    if (!raffleSurveyId) return;
    setDrawingWinners(true);
    try {
      const result = await post<RaffleResult>(`/api/v1/surveys/${raffleSurveyId}/draw-winners`, { count: winnerCount });
      setRaffleResult(result);
      toast.success(t('surveys.raffle.winnersDrawn'));
    } catch { toast.error(t('errors.generic')); }
    finally { setDrawingWinners(false); }
  }

  /* ── Question helpers ────────────────────────────────────────────── */

  function addQuestion() { setQuestions([...questions, { ...EMPTY_QUESTION, order: questions.length + 1 }]); }
  function removeQuestion(idx: number) { setQuestions(questions.filter((_, i) => i !== idx).map((q, i) => ({ ...q, order: i + 1 }))); }
  function updateQuestion(idx: number, field: keyof QuestionDraft, val: any) { setQuestions(questions.map((q, i) => (i === idx ? { ...q, [field]: val } : q))); }
  function addOptionToQuestion(qIdx: number) { setQuestions(questions.map((q, i) => (i === qIdx ? { ...q, options: [...q.options, ''] } : q))); }
  function removeOptionFromQuestion(qIdx: number, oIdx: number) { setQuestions(questions.map((q, i) => (i === qIdx ? { ...q, options: q.options.filter((_, j) => j !== oIdx) } : q))); }
  function updateOption(qIdx: number, oIdx: number, val: string) { setQuestions(questions.map((q, i) => (i === qIdx ? { ...q, options: q.options.map((o, j) => (j === oIdx ? val : o)) } : q))); }

  /* ── Derived ─────────────────────────────────────────────────────── */

  const dateFmt = new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium' });
  const activeCount = items.filter((s) => s.status === 'active').length;
  const closedCount = items.filter((s) => s.status === 'closed').length;
  const totalResponses = items.reduce((acc, s) => acc + (s.responseCount ?? 0), 0);

  const stats = [
    { label: t('common.all'), value: items.length, color: 'bg-brand-50 text-brand-600' },
    { label: t('surveys.statuses.active'), value: activeCount, color: 'bg-green-50 text-green-600' },
    { label: t('surveys.statuses.closed'), value: closedCount, color: 'bg-blue-50 text-blue-600' },
    { label: t('surveys.totalResponses'), value: totalResponses, color: 'bg-purple-50 text-purple-600' },
  ];

  const canCreate = titleAr.trim().length > 0 && titleEn.trim().length > 0 &&
    (selectedTemplateId || questions.some((q) => q.textAr.trim() || q.textEn.trim()));

  const typeOptions = [{ value: 'general', label: t('surveys.types.general') }, { value: 'poll', label: t('surveys.types.poll') }];
  const audienceOptions = [{ value: 'staff', label: t('surveys.audiences.staff') }, { value: 'public', label: t('surveys.audiences.public') }];
  const questionTypeOptions = [
    { value: 'single', label: t('surveys.questionTypes.single') }, { value: 'multi', label: t('surveys.questionTypes.multi') },
    { value: 'text', label: t('surveys.questionTypes.text') }, { value: 'rating', label: t('surveys.questionTypes.rating') },
  ];
  const statusOptions = [
    { value: '', label: t('surveys.allStatuses') },
    { value: 'Draft', label: t('surveys.statuses.draft') },
    { value: 'Active', label: t('surveys.statuses.active') },
    { value: 'Closed', label: t('surveys.statuses.closed') },
  ];
  const typeFilterOptions = [
    { value: '', label: t('surveys.allTypes') },
    { value: 'general', label: t('surveys.types.general') },
    { value: 'poll', label: t('surveys.types.poll') },
  ];
  const committeeOptions = [
    { value: '', label: t('surveys.selectCommittee') },
    ...committees.map(c => ({ value: c.id, label: isAr ? c.nameAr : c.nameEn })),
  ];
  const templateOpts = [
    { value: '', label: t('surveys.selectTemplate') },
    ...templates.map(tp => ({ value: tp.id, label: isAr ? tp.nameAr : tp.nameEn })),
  ];

  /* ── Render ──────────────────────────────────────────────────────── */

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">{t('surveys.title')}</h1>
          <p className="mt-1 text-sm text-neutral-500">{t('surveys.description')}</p>
        </div>
        <div className="flex gap-2">
          {hasRole('CommitteeSecretary') && (
            <>
              <Button variant="outline" onClick={() => setShowTemplates(true)}>{t('surveys.templates')}</Button>
              <Button icon={<IconPlus className="h-4 w-4" />} onClick={() => { resetCreateForm(); setShowCreate(true); }}>{t('surveys.create')}</Button>
            </>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}><CardBody className="flex items-center gap-3">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${s.color}`}><IconSurveys className="h-5 w-5" /></div>
            <div><p className="text-2xl font-bold text-neutral-900">{s.value}</p><p className="text-xs text-neutral-500">{s.label}</p></div>
          </CardBody></Card>
        ))}
      </div>

      {/* Filters */}
      <Card><CardBody>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[200px]">
            <Input placeholder={t('surveys.searchPlaceholder')} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} options={statusOptions} />
          <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} options={typeFilterOptions} />
        </div>
      </CardBody></Card>

      {/* Survey List */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}><CardBody className="space-y-3">
              <div className="h-5 w-3/4 animate-pulse rounded bg-neutral-200" />
              <div className="h-4 w-1/2 animate-pulse rounded bg-neutral-100" />
              <div className="flex gap-2"><div className="h-5 w-16 animate-pulse rounded-full bg-neutral-100" /><div className="h-5 w-16 animate-pulse rounded-full bg-neutral-100" /></div>
            </CardBody></Card>
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card><CardBody className="flex flex-col items-center py-16">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100 text-neutral-400"><IconSurveys className="h-8 w-8" /></div>
          <h3 className="mt-4 text-sm font-semibold text-neutral-900">{t('surveys.noData')}</h3>
          <p className="mt-1 text-sm text-neutral-500">{t('surveys.noDataDesc')}</p>
          {hasRole('CommitteeSecretary') && (
            <Button className="mt-4" icon={<IconPlus className="h-4 w-4" />} onClick={() => { resetCreateForm(); setShowCreate(true); }}>{t('surveys.create')}</Button>
          )}
        </CardBody></Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map((s) => (
            <Card key={s.id} className="transition-shadow hover:shadow-md">
              <CardBody>
                <div className="mb-3 flex items-start justify-between">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${STATUS_COLORS[s.status] ?? 'bg-neutral-50 text-neutral-600'}`}>
                    {s.status === 'active' ? <IconCheckCircle className="h-5 w-5" /> : <IconSurveys className="h-5 w-5" />}
                  </div>
                  <Badge variant={STATUS_VARIANT[s.status] ?? 'default'}>{t(`surveys.statuses.${s.status}` as any) ?? s.status}</Badge>
                </div>
                <h3 className="font-semibold text-neutral-900">{isAr ? s.titleAr : s.titleEn}</h3>
                <p className="mt-0.5 text-xs text-neutral-400">{isAr ? s.titleEn : s.titleAr}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Badge variant="brand" className="text-[10px]">{t(`surveys.types.${s.type}` as any) ?? s.type}</Badge>
                  <Badge variant="info" className="text-[10px]">{t(`surveys.audiences.${s.targetAudience}` as any) ?? s.targetAudience}</Badge>
                  {s.committeeId && <Badge variant="warning" className="text-[10px]">{t('surveys.fromCommittee')}</Badge>}
                </div>
                <div className="mt-2 flex items-center gap-4 text-[10px] text-neutral-400">
                  <span>{dateFmt.format(new Date(s.startAtUtc))} — {dateFmt.format(new Date(s.endAtUtc))}</span>
                  <span>{s.responseCount ?? 0} {t('surveys.responses')}</span>
                  <span>{s.questionCount ?? 0} {t('surveys.questions')}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 border-t border-neutral-100 pt-3">
                  {s.status === 'draft' && hasRole('CommitteeSecretary') && <Button variant="outline" size="sm" onClick={() => void activate(s.id)}>{t('surveys.activate')}</Button>}
                  {s.status === 'active' && hasRole('CommitteeSecretary') && <Button variant="ghost" size="sm" onClick={() => void closeSurvey(s.id)}>{t('surveys.close')}</Button>}
                  {s.status === 'active' && hasRole('CommitteeSecretary') && (
                    <Button variant="primary" size="sm" icon={<IconBroadcast className="h-3 w-3" />} onClick={() => void startLive(s.id)} loading={startingLive === s.id}>
                      {t('liveSurvey.startLive')}
                    </Button>
                  )}
                  <Button variant="outline" size="sm" icon={<IconDownload className="h-3 w-3" />} onClick={() => exportFile(s.id, 'xlsx')}>{t('surveys.export')}</Button>
                  <Button variant="outline" size="sm" icon={<IconDownload className="h-3 w-3" />} onClick={() => exportFile(s.id, 'pdf')}>{t('surveys.exportPdf')}</Button>
                  <Button variant="ghost" size="sm" icon={<IconReport className="h-3 w-3" />} onClick={() => void openAnalytics(s.id)}>{t('surveys.analytics')}</Button>
                  {hasRole('CommitteeSecretary') && <Button variant="ghost" size="sm" icon={<IconSend className="h-3 w-3" />} onClick={() => openEmailResults(s.id)}>{t('surveys.emailResults')}</Button>}
                  {hasRole('CommitteeSecretary') && <Button variant="ghost" size="sm" onClick={() => saveAsTemplate(s.id)}>{t('surveys.saveAsTemplate')}</Button>}
                  {s.allowLuckyDraw && (s.status === 'active' || s.status === 'closed') && hasRole('CommitteeSecretary') && (
                    <Button variant="primary" size="sm" onClick={() => openRaffle(s.id)}>{t('surveys.raffle.draw')}</Button>
                  )}
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {/* Create Survey Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title={t('surveys.create')}>
        <div className="grid gap-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Select label={t('committees.type')} value={surveyType} onChange={(e) => setSurveyType(e.target.value as any)} options={typeOptions} />
            <Select label={t('surveys.audiences.staff')} value={audience} onChange={(e) => setAudience(e.target.value as any)} options={audienceOptions} />
          </div>
          <Input label={t('surveys.titleArPlaceholder')} value={titleAr} onChange={(e) => setTitleAr(e.target.value)} dir="rtl" />
          <Input label={t('surveys.titleEnPlaceholder')} value={titleEn} onChange={(e) => setTitleEn(e.target.value)} dir="ltr" />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label={t('surveys.startDate')} type="datetime-local" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            <Input label={t('surveys.endDate')} type="datetime-local" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Select label={t('surveys.committee')} value={committeeId} onChange={(e) => setCommitteeId(e.target.value)} options={committeeOptions} />
            <Select label={t('surveys.useTemplate')} value={selectedTemplateId} onChange={(e) => setSelectedTemplateId(e.target.value)} options={templateOpts} />
          </div>
          <label className="flex items-center gap-2 text-sm text-neutral-700">
            <input type="checkbox" checked={allowLuckyDraw} onChange={(e) => setAllowLuckyDraw(e.target.checked)} className="rounded border-neutral-300" />
            {t('surveys.luckyDraw')}
          </label>

          {!selectedTemplateId && (
            <div className="border-t border-neutral-200 pt-4">
              <h4 className="mb-3 text-sm font-semibold text-neutral-900">{t('surveys.questions')}</h4>
              <div className="space-y-4">
                {questions.map((q, qIdx) => (
                  <div key={qIdx} className="rounded-lg border border-neutral-200 p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-medium text-neutral-500">{t('surveys.questions')} {qIdx + 1}</span>
                      {questions.length > 1 && (
                        <button type="button" onClick={() => removeQuestion(qIdx)} className="rounded p-1 text-neutral-400 hover:bg-red-50 hover:text-red-500"><IconTrash className="h-3.5 w-3.5" /></button>
                      )}
                    </div>
                    <div className="grid gap-2">
                      <Select label={t('surveys.questionType')} value={q.type} onChange={(e) => updateQuestion(qIdx, 'type', e.target.value)} options={questionTypeOptions} />
                      <Input placeholder={t('surveys.questionTextAr')} value={q.textAr} onChange={(e) => updateQuestion(qIdx, 'textAr', e.target.value)} dir="rtl" />
                      <Input placeholder={t('surveys.questionTextEn')} value={q.textEn} onChange={(e) => updateQuestion(qIdx, 'textEn', e.target.value)} dir="ltr" />
                      {(q.type === 'single' || q.type === 'multi') && (
                        <div className="mt-1">
                          <label className="mb-1 block text-xs font-medium text-neutral-500">{t('voting.options')}</label>
                          <div className="space-y-1.5">
                            {q.options.map((opt, oIdx) => (
                              <div key={oIdx} className="flex items-center gap-2">
                                <Input value={opt} onChange={(e) => updateOption(qIdx, oIdx, e.target.value)} placeholder={`${t('voting.options')} ${oIdx + 1}`} />
                                {q.options.length > 2 && (
                                  <button type="button" onClick={() => removeOptionFromQuestion(qIdx, oIdx)} className="shrink-0 rounded p-1.5 text-neutral-400 hover:bg-red-50 hover:text-red-500"><IconTrash className="h-3.5 w-3.5" /></button>
                                )}
                              </div>
                            ))}
                          </div>
                          <Button variant="ghost" size="sm" className="mt-1" icon={<IconPlus className="h-3 w-3" />} onClick={() => addOptionToQuestion(qIdx)}>{t('surveys.addOption')}</Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="ghost" size="sm" className="mt-3" icon={<IconPlus className="h-3.5 w-3.5" />} onClick={addQuestion}>{t('surveys.addQuestion')}</Button>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowCreate(false)}>{t('actions.cancel')}</Button>
            <Button onClick={() => void create()} disabled={!canCreate} loading={creating}>{t('actions.create')}</Button>
          </div>
        </div>
      </Modal>

      {/* Templates Modal */}
      <Modal open={showTemplates} onClose={() => setShowTemplates(false)} title={t('surveys.templates')}>
        <div className="max-h-[60vh] overflow-y-auto space-y-3">
          {templates.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <IconSurveys className="h-10 w-10 text-neutral-300" />
              <p className="mt-2 text-sm text-neutral-500">{t('surveys.noTemplates')}</p>
              <p className="text-xs text-neutral-400">{t('surveys.noTemplatesDesc')}</p>
            </div>
          ) : templates.map((tp) => (
            <Card key={tp.id}>
              <CardBody className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-neutral-900">{isAr ? tp.nameAr : tp.nameEn}</h4>
                  <p className="text-xs text-neutral-400">{isAr ? tp.nameEn : tp.nameAr}</p>
                  <div className="mt-1 flex gap-2">
                    <Badge variant="brand" className="text-[10px]">{tp.type}</Badge>
                    <Badge variant="info" className="text-[10px]">{tp.questionCount} {t('surveys.questions')}</Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => {
                    setShowTemplates(false); resetCreateForm();
                    setSelectedTemplateId(tp.id); setSurveyType(tp.type as any); setAudience(tp.targetAudience as any);
                    setShowCreate(true);
                  }}>{t('surveys.createFromTemplate')}</Button>
                  <button onClick={() => void deleteTemplate(tp.id)} className="rounded p-1.5 text-neutral-400 hover:bg-red-50 hover:text-red-500"><IconTrash className="h-4 w-4" /></button>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      </Modal>

      {/* Save as Template Modal */}
      <Modal open={!!templateSurveyId} onClose={() => setTemplateSurveyId(null)} title={t('surveys.saveAsTemplate')}>
        <div className="grid gap-4">
          <Input label={t('surveys.templateNameAr')} value={templateNameAr} onChange={(e) => setTemplateNameAr(e.target.value)} dir="rtl" />
          <Input label={t('surveys.templateNameEn')} value={templateNameEn} onChange={(e) => setTemplateNameEn(e.target.value)} dir="ltr" />
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setTemplateSurveyId(null)}>{t('actions.cancel')}</Button>
            <Button onClick={() => void confirmSaveAsTemplate()} loading={savingTemplate} disabled={!templateNameAr.trim() || !templateNameEn.trim()}>{t('actions.save')}</Button>
          </div>
        </div>
      </Modal>

      {/* Analytics Modal */}
      <Modal open={showAnalytics} onClose={() => setShowAnalytics(false)} title={t('surveys.analytics')}>
        <div className="space-y-6">
          {loadingAnalytics ? (
            <div className="flex flex-col items-center py-12">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
              <p className="mt-4 text-sm text-neutral-500">{t('common.loading')}</p>
            </div>
          ) : analyticsData ? (
            <>
              {/* Tabs */}
              <div className="flex gap-1 rounded-lg bg-neutral-100 p-1">
                {(['overview', 'wordcloud', 'demographics'] as const).map((tab) => (
                  <button key={tab} onClick={() => setAnalyticsTab(tab)}
                    className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${analyticsTab === tab ? 'bg-neutral-0 text-brand-600 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}>
                    {t(`surveys.tabs.${tab}` as any)}
                  </button>
                ))}
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-2 gap-4">
                <Card><CardBody className="text-center">
                  <p className="text-2xl font-bold text-brand-600">{analyticsData.totalResponses}</p>
                  <p className="text-xs text-neutral-500">{t('surveys.totalResponses')}</p>
                </CardBody></Card>
                <Card><CardBody className="text-center">
                  <p className="text-2xl font-bold text-brand-600">{analyticsData.questionCount}</p>
                  <p className="text-xs text-neutral-500">{t('surveys.questionCount')}</p>
                </CardBody></Card>
              </div>

              {/* Overview Tab */}
              {analyticsTab === 'overview' && (
                <>
                  {analyticsData.timeline.length > 0 && (
                    <Card><CardBody>
                      <h4 className="mb-3 text-sm font-semibold text-neutral-900">{t('surveys.responseTimeline')}</h4>
                      <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={analyticsData.timeline}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                            <YAxis tick={{ fontSize: 10 }} />
                            <Tooltip />
                            <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </CardBody></Card>
                  )}

                  {analyticsData.questions.map((q) => (
                    <Card key={q.id}><CardBody>
                      <h4 className="text-sm font-semibold text-neutral-900">{q.order}. {isAr ? q.textAr : q.textEn}</h4>
                      <p className="text-xs text-neutral-400 mb-3">{q.answeredCount} {t('surveys.responses')}</p>

                      {q.tallies && q.tallies.length > 0 && (
                        <div className="h-48">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={q.tallies} layout="vertical">
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis type="number" />
                              <YAxis dataKey="option" type="category" width={120} tick={{ fontSize: 11 }} />
                              <Tooltip />
                              <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      )}

                      {q.distribution && (
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <p className="text-3xl font-bold text-brand-600">{q.averageRating}</p>
                            <p className="text-xs text-neutral-500">{t('surveys.averageRating')}</p>
                          </div>
                          <div className="h-40 flex-1">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie data={q.distribution} dataKey="count" nameKey="rating" cx="50%" cy="50%" outerRadius={60} label>
                                  {q.distribution.map((_, idx) => (<Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />))}
                                </Pie>
                                <Tooltip />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      )}

                      {q.sampleResponses && q.sampleResponses.length > 0 && (
                        <div>
                          <p className="text-xs text-neutral-500 mb-2">{q.totalTextResponses} {t('surveys.textResponses')}</p>
                          <div className="space-y-1.5 max-h-40 overflow-y-auto">
                            {q.sampleResponses.map((txt, idx) => (
                              <div key={idx} className="rounded bg-neutral-50 px-3 py-2 text-sm text-neutral-700">{txt}</div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardBody></Card>
                  ))}
                </>
              )}

              {/* Word Cloud Tab */}
              {analyticsTab === 'wordcloud' && (
                <>
                  {(!analyticsData.wordCloud || analyticsData.wordCloud.length === 0) ? (
                    <Card><CardBody className="flex flex-col items-center py-8 text-center">
                      <IconSurveys className="h-10 w-10 text-neutral-300" />
                      <p className="mt-2 text-sm text-neutral-500">{t('surveys.noWordCloudData')}</p>
                      <p className="text-xs text-neutral-400">{t('surveys.noWordCloudDesc')}</p>
                    </CardBody></Card>
                  ) : analyticsData.wordCloud.map((wq) => (
                    <Card key={wq.questionId}><CardBody>
                      <h4 className="text-sm font-semibold text-neutral-900 mb-3">{wq.order}. {isAr ? wq.textAr : wq.textEn}</h4>
                      <div className="flex flex-wrap gap-2 justify-center py-4">
                        {wq.words.map((w, idx) => {
                          const maxVal = wq.words[0]?.value ?? 1;
                          const ratio = w.value / maxVal;
                          const fontSize = Math.max(12, Math.round(ratio * 36));
                          const opacity = Math.max(0.4, ratio);
                          return (
                            <span key={idx} style={{ fontSize: `${fontSize}px`, opacity }}
                              className="inline-block px-1 font-medium text-brand-600 transition-transform hover:scale-110 cursor-default"
                              title={`${w.text}: ${w.value}`}>
                              {w.text}
                            </span>
                          );
                        })}
                      </div>
                      <p className="text-center text-xs text-neutral-400 mt-2">{wq.words.length} {t('surveys.uniqueWords')}</p>
                    </CardBody></Card>
                  ))}
                </>
              )}

              {/* Demographics Tab */}
              {analyticsTab === 'demographics' && (
                <>
                  {(!analyticsData.demographics ||
                    (analyticsData.demographics.byDepartment.length === 0 && analyticsData.demographics.byGender.length === 0)) ? (
                    <Card><CardBody className="flex flex-col items-center py-8 text-center">
                      <IconSurveys className="h-10 w-10 text-neutral-300" />
                      <p className="mt-2 text-sm text-neutral-500">{t('surveys.noDemographicsData')}</p>
                      <p className="text-xs text-neutral-400">{t('surveys.noDemographicsDesc')}</p>
                    </CardBody></Card>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2">
                      {analyticsData.demographics!.byDepartment.length > 0 && (
                        <Card><CardBody>
                          <h4 className="text-sm font-semibold text-neutral-900 mb-3">{t('surveys.byDepartment')}</h4>
                          <div className="h-52">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie data={analyticsData.demographics!.byDepartment} dataKey="count" nameKey="label" cx="50%" cy="50%" outerRadius={70} label={({ label, count }: any) => `${label} (${count})`}>
                                  {analyticsData.demographics!.byDepartment.map((_, idx) => (<Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />))}
                                </Pie>
                                <Tooltip />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        </CardBody></Card>
                      )}
                      {analyticsData.demographics!.byGender.length > 0 && (
                        <Card><CardBody>
                          <h4 className="text-sm font-semibold text-neutral-900 mb-3">{t('surveys.byGender')}</h4>
                          <div className="h-52">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie data={analyticsData.demographics!.byGender} dataKey="count" nameKey="label" cx="50%" cy="50%" outerRadius={70} label={({ label, count }: any) => `${label} (${count})`}>
                                  {analyticsData.demographics!.byGender.map((_, idx) => (<Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />))}
                                </Pie>
                                <Tooltip />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        </CardBody></Card>
                      )}
                    </div>
                  )}
                </>
              )}
            </>
          ) : null}
        </div>
      </Modal>

      {/* Raffle / Lucky Draw Modal */}
      <Modal open={showRaffle} onClose={() => setShowRaffle(false)} title={t('surveys.raffle.title')}>
        <div className="space-y-4">
          {!raffleResult ? (
            <>
              <p className="text-sm text-neutral-600">{t('surveys.raffle.description')}</p>
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <label className="mb-1 block text-sm font-medium text-neutral-700">{t('surveys.raffle.winnerCount')}</label>
                  <input
                    type="number" min={1} max={100} value={winnerCount}
                    onChange={(e) => setWinnerCount(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
                <Button onClick={() => void drawWinners()} loading={drawingWinners}>{t('surveys.raffle.drawNow')}</Button>
              </div>
            </>
          ) : (
            <>
              <div className="rounded-lg bg-green-50 p-4 text-center">
                <p className="text-lg font-bold text-green-700">{t('surveys.raffle.congratulations')}</p>
                <p className="text-sm text-green-600">{t('surveys.raffle.winnersSelected', { count: raffleResult.winnersCount, total: raffleResult.totalResponses })}</p>
              </div>
              <div className="space-y-2">
                {raffleResult.winners.map((w, idx) => (
                  <Card key={w.id}>
                    <CardBody className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-600">
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-neutral-900">{w.respondentName || w.respondentEmail || w.employeeId || t('surveys.raffle.anonymous')}</p>
                        <div className="flex flex-wrap gap-2 text-xs text-neutral-500">
                          {w.employeeId && <span>{t('surveys.raffle.employeeId')}: {w.employeeId}</span>}
                          {w.department && <span>{w.department}</span>}
                          {w.respondentEmail && <span>{w.respondentEmail}</span>}
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => setRaffleResult(null)}>{t('surveys.raffle.drawAgain')}</Button>
                <Button variant="outline" onClick={() => setShowRaffle(false)}>{t('actions.close')}</Button>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Email Results Modal */}
      <Modal open={showEmailResults} onClose={() => setShowEmailResults(false)} title={t('surveys.emailResults')}>
        <div className="grid gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">{t('surveys.recipientEmails')}</label>
            <textarea
              value={emailRecipients}
              onChange={(e) => setEmailRecipients(e.target.value)}
              placeholder={t('surveys.recipientEmailsPlaceholder')}
              rows={3}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
            <p className="mt-1 text-xs text-neutral-400">{t('surveys.recipientEmailsHint')}</p>
          </div>
          <Input label={t('surveys.emailMessageAr')} value={emailMessageAr} onChange={(e) => setEmailMessageAr(e.target.value)} dir="rtl" />
          <Input label={t('surveys.emailMessageEn')} value={emailMessageEn} onChange={(e) => setEmailMessageEn(e.target.value)} dir="ltr" />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowEmailResults(false)}>{t('actions.cancel')}</Button>
            <Button icon={<IconSend className="h-4 w-4" />} onClick={() => void sendEmailResults()} loading={sendingEmail} disabled={!emailRecipients.trim()}>
              {t('surveys.sendResults')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
