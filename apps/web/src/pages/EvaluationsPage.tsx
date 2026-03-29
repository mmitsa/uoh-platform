import { useEffect, useMemo, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { useApi } from '../hooks/useApi';
import { useAuth } from '../app/auth';
import { Card, CardBody, Badge, Button, Modal, Input, Select, useToast } from '../components/ui';
import {
  IconEvaluation, IconPlus, IconCheckCircle, IconEye, IconTrash,
  IconChartBar, IconCommittees, IconCalendar,
} from '../components/icons';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface EvalCriterion {
  id: string;
  labelAr: string;
  labelEn: string;
  maxScore: number;
  weight: number;
  sortOrder: number;
}

interface EvalTemplate {
  id: string;
  nameAr: string;
  nameEn: string;
  descriptionAr?: string;
  descriptionEn?: string;
  maxScore: number;
  isActive: boolean;
  createdAtUtc: string;
  criteria: EvalCriterion[];
}

interface CommitteeEvaluation {
  id: string;
  committeeId: string;
  committeeName?: string;
  templateId: string;
  templateName?: string;
  evaluatorDisplayName: string;
  status: string;
  periodStart: string;
  periodEnd: string;
  totalScore: number;
  maxPossibleScore: number;
  scorePercentage: number;
  createdAtUtc: string;
}

interface CriterionDraft {
  labelAr: string;
  labelEn: string;
  maxScore: number;
  weight: number;
  sortOrder: number;
}

type CommitteeOption = { id: string; nameAr: string; nameEn: string };

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const STATUS_VARIANT: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info' | 'brand'> = {
  draft: 'default',
  in_progress: 'warning',
  completed: 'success',
};

function getScoreColor(pct: number): string {
  if (pct >= 80) return 'text-green-600';
  if (pct >= 60) return 'text-amber-600';
  return 'text-red-600';
}

function getScoreBarColor(pct: number): string {
  if (pct >= 80) return 'bg-green-500';
  if (pct >= 60) return 'bg-amber-500';
  return 'bg-red-500';
}

function getScoreBgColor(pct: number): string {
  if (pct >= 80) return 'bg-green-50';
  if (pct >= 60) return 'bg-amber-50';
  return 'bg-red-50';
}

const EMPTY_CRITERION: CriterionDraft = {
  labelAr: '',
  labelEn: '',
  maxScore: 10,
  weight: 1,
  sortOrder: 1,
};

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export function EvaluationsPage() {
  const { get, post, put } = useApi();
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const { hasRole } = useAuth();
  const isAr = i18n.language === 'ar';
  const canManage = hasRole('CommitteeSecretary') || hasRole('SystemAdmin');
  const dateFmt = new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium' });

  /* ---------- Active Tab ---------- */
  const [activeTab, setActiveTab] = useState<'templates' | 'evaluations'>('templates');

  /* ================================================================ */
  /*  TEMPLATES STATE                                                  */
  /* ================================================================ */
  const [templates, setTemplates] = useState<EvalTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);

  // Create template modal
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  const [tplNameAr, setTplNameAr] = useState('');
  const [tplNameEn, setTplNameEn] = useState('');
  const [tplDescAr, setTplDescAr] = useState('');
  const [tplDescEn, setTplDescEn] = useState('');
  const [tplMaxScore, setTplMaxScore] = useState('100');
  const [tplCriteria, setTplCriteria] = useState<CriterionDraft[]>([{ ...EMPTY_CRITERION }]);
  const [savingTemplate, setSavingTemplate] = useState(false);

  // Template detail modal
  const [detailTemplate, setDetailTemplate] = useState<EvalTemplate | null>(null);
  const [detailTemplateLoading, setDetailTemplateLoading] = useState(false);

  /* ================================================================ */
  /*  EVALUATIONS STATE                                                */
  /* ================================================================ */
  const [evaluations, setEvaluations] = useState<CommitteeEvaluation[]>([]);
  const [evalsLoading, setEvalsLoading] = useState(false);

  // Start evaluation modal
  const [showStartEval, setShowStartEval] = useState(false);
  const [evalCommitteeId, setEvalCommitteeId] = useState('');
  const [evalTemplateId, setEvalTemplateId] = useState('');
  const [evalEvaluator, setEvalEvaluator] = useState('');
  const [evalPeriodStart, setEvalPeriodStart] = useState('');
  const [evalPeriodEnd, setEvalPeriodEnd] = useState('');
  const [startingEval, setStartingEval] = useState(false);

  // Committees for selector
  const [committees, setCommittees] = useState<CommitteeOption[]>([]);

  // View results modal
  const [resultsEval, setResultsEval] = useState<CommitteeEvaluation | null>(null);
  const [resultsTemplate, setResultsTemplate] = useState<EvalTemplate | null>(null);
  const [resultsLoading, setResultsLoading] = useState(false);

  // Submit evaluation
  const [submittingEval, setSubmittingEval] = useState(false);

  /* ================================================================ */
  /*  DATA LOADING                                                     */
  /* ================================================================ */

  const loadTemplates = useCallback(async () => {
    setTemplatesLoading(true);
    try {
      const res = await get<EvalTemplate[]>('/api/v1/evaluations/templates');
      setTemplates(res ?? []);
    } catch {
      toast.error(t('errors.loadFailed'));
    } finally {
      setTemplatesLoading(false);
    }
  }, [get, t, toast]);

  const loadEvaluations = useCallback(async () => {
    setEvalsLoading(true);
    try {
      const res = await get<{ items: CommitteeEvaluation[] }>('/api/v1/evaluations');
      setEvaluations(res.items ?? []);
    } catch {
      toast.error(t('errors.loadFailed'));
    } finally {
      setEvalsLoading(false);
    }
  }, [get, t, toast]);

  useEffect(() => {
    void loadTemplates();
    void loadEvaluations();
    // Load committees for the selector
    void (async () => {
      try {
        const res = await get<{ items: CommitteeOption[] }>('/api/v1/committees?page=1&pageSize=100');
        setCommittees(res.items ?? []);
      } catch { /* ignore */ }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ================================================================ */
  /*  TEMPLATE ACTIONS                                                 */
  /* ================================================================ */

  function resetTemplateForm() {
    setTplNameAr('');
    setTplNameEn('');
    setTplDescAr('');
    setTplDescEn('');
    setTplMaxScore('100');
    setTplCriteria([{ ...EMPTY_CRITERION }]);
  }

  function addCriterion() {
    setTplCriteria([...tplCriteria, { ...EMPTY_CRITERION, sortOrder: tplCriteria.length + 1 }]);
  }

  function removeCriterion(idx: number) {
    setTplCriteria(tplCriteria.filter((_, i) => i !== idx).map((c, i) => ({ ...c, sortOrder: i + 1 })));
  }

  function updateCriterion(idx: number, field: keyof CriterionDraft, val: string | number) {
    setTplCriteria(tplCriteria.map((c, i) => (i === idx ? { ...c, [field]: val } : c)));
  }

  const canSaveTemplate = useMemo(() => {
    return (
      tplNameAr.trim().length > 1 &&
      tplNameEn.trim().length > 1 &&
      Number(tplMaxScore) > 0 &&
      tplCriteria.length > 0 &&
      tplCriteria.every((c) => c.labelAr.trim() && c.labelEn.trim() && c.maxScore > 0 && c.weight > 0)
    );
  }, [tplNameAr, tplNameEn, tplMaxScore, tplCriteria]);

  async function saveTemplate() {
    if (!canSaveTemplate) return;
    setSavingTemplate(true);
    try {
      await post('/api/v1/evaluations/templates', {
        nameAr: tplNameAr,
        nameEn: tplNameEn,
        descriptionAr: tplDescAr || undefined,
        descriptionEn: tplDescEn || undefined,
        maxScore: Number(tplMaxScore),
        criteria: tplCriteria.map((c, idx) => ({
          labelAr: c.labelAr,
          labelEn: c.labelEn,
          maxScore: Number(c.maxScore),
          weight: Number(c.weight),
          sortOrder: idx + 1,
        })),
      });
      toast.success(t('evaluations.createTemplate') + ' \u2713');
      resetTemplateForm();
      setShowCreateTemplate(false);
      await loadTemplates();
    } catch {
      toast.error(t('errors.generic'));
    } finally {
      setSavingTemplate(false);
    }
  }

  async function openTemplateDetail(tpl: EvalTemplate) {
    setDetailTemplateLoading(true);
    setDetailTemplate(null);
    try {
      const detail = await get<EvalTemplate>(`/api/v1/evaluations/templates/${tpl.id}`);
      setDetailTemplate(detail);
    } catch {
      toast.error(t('errors.loadFailed'));
    } finally {
      setDetailTemplateLoading(false);
    }
  }

  /* ================================================================ */
  /*  EVALUATION ACTIONS                                               */
  /* ================================================================ */

  function resetEvalForm() {
    setEvalCommitteeId('');
    setEvalTemplateId('');
    setEvalEvaluator('');
    setEvalPeriodStart('');
    setEvalPeriodEnd('');
  }

  const canStartEval = useMemo(() => {
    return (
      evalCommitteeId !== '' &&
      evalTemplateId !== '' &&
      evalEvaluator.trim().length > 1 &&
      evalPeriodStart !== '' &&
      evalPeriodEnd !== ''
    );
  }, [evalCommitteeId, evalTemplateId, evalEvaluator, evalPeriodStart, evalPeriodEnd]);

  async function startEvaluation() {
    if (!canStartEval) return;
    setStartingEval(true);
    try {
      await post('/api/v1/evaluations', {
        committeeId: evalCommitteeId,
        templateId: evalTemplateId,
        evaluatorDisplayName: evalEvaluator,
        periodStart: evalPeriodStart,
        periodEnd: evalPeriodEnd,
      });
      toast.success(t('evaluations.startEvaluation') + ' \u2713');
      resetEvalForm();
      setShowStartEval(false);
      await loadEvaluations();
    } catch {
      toast.error(t('errors.generic'));
    } finally {
      setStartingEval(false);
    }
  }

  async function openResults(ev: CommitteeEvaluation) {
    setResultsLoading(true);
    setResultsEval(ev);
    setResultsTemplate(null);
    try {
      const tpl = await get<EvalTemplate>(`/api/v1/evaluations/templates/${ev.templateId}`);
      setResultsTemplate(tpl);
    } catch {
      toast.error(t('errors.loadFailed'));
    } finally {
      setResultsLoading(false);
    }
  }

  async function submitEvaluation(evalId: string) {
    setSubmittingEval(true);
    try {
      await put(`/api/v1/evaluations/${evalId}/responses`, { status: 'completed' });
      toast.success(t('evaluations.submitEvaluation') + ' \u2713');
      setResultsEval(null);
      setResultsTemplate(null);
      await loadEvaluations();
    } catch {
      toast.error(t('errors.generic'));
    } finally {
      setSubmittingEval(false);
    }
  }

  /* ================================================================ */
  /*  COMPUTED / OPTIONS                                               */
  /* ================================================================ */

  const committeeOptions = useMemo(
    () => [
      { value: '', label: t('evaluations.selectCommittee') },
      ...committees.map((c) => ({ value: c.id, label: isAr ? c.nameAr : c.nameEn })),
    ],
    [committees, isAr, t],
  );

  const templateOptions = useMemo(
    () => [
      { value: '', label: t('evaluations.selectTemplate') },
      ...templates.filter((tp) => tp.isActive).map((tp) => ({ value: tp.id, label: isAr ? tp.nameAr : tp.nameEn })),
    ],
    [templates, isAr, t],
  );

  const tabs = [
    { key: 'templates' as const, label: t('evaluations.templates'), icon: <IconChartBar className="h-4 w-4" /> },
    { key: 'evaluations' as const, label: t('evaluations.title'), icon: <IconEvaluation className="h-4 w-4" /> },
  ];

  /* ================================================================ */
  /*  RENDER                                                           */
  /* ================================================================ */

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">{t('evaluations.title')}</h1>
          <p className="mt-1 text-sm text-neutral-500">{t('evaluations.description')}</p>
        </div>
        <div className="flex items-center gap-3">
          {canManage && activeTab === 'templates' && (
            <Button icon={<IconPlus className="h-4 w-4" />} onClick={() => { resetTemplateForm(); setShowCreateTemplate(true); }}>
              {t('evaluations.createTemplate')}
            </Button>
          )}
          {canManage && activeTab === 'evaluations' && (
            <Button icon={<IconPlus className="h-4 w-4" />} onClick={() => { resetEvalForm(); setShowStartEval(true); }}>
              {t('evaluations.startEvaluation')}
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-neutral-200">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-neutral-500 hover:text-neutral-700'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* ============================================================ */}
      {/*  TAB 1: TEMPLATES                                             */}
      {/* ============================================================ */}
      {activeTab === 'templates' && (
        <>
          {templatesLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i}>
                  <CardBody className="space-y-3">
                    <div className="h-5 w-3/4 animate-pulse rounded bg-neutral-200" />
                    <div className="h-4 w-1/2 animate-pulse rounded bg-neutral-100" />
                    <div className="flex gap-2">
                      <div className="h-5 w-16 animate-pulse rounded-full bg-neutral-100" />
                      <div className="h-5 w-16 animate-pulse rounded-full bg-neutral-100" />
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          ) : templates.length === 0 ? (
            <Card>
              <CardBody className="flex flex-col items-center py-16">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100 text-neutral-400">
                  <IconChartBar className="h-8 w-8" />
                </div>
                <h3 className="mt-4 text-sm font-semibold text-neutral-900">{t('evaluations.noTemplates')}</h3>
                <p className="mt-1 text-sm text-neutral-500">{t('evaluations.noTemplatesDesc')}</p>
                {canManage && (
                  <Button className="mt-4" icon={<IconPlus className="h-4 w-4" />} onClick={() => { resetTemplateForm(); setShowCreateTemplate(true); }}>
                    {t('evaluations.createTemplate')}
                  </Button>
                )}
              </CardBody>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {templates.map((tpl) => (
                <Card key={tpl.id} className="transition-shadow hover:shadow-md">
                  <CardBody>
                    <div className="mb-3 flex items-start justify-between">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                        <IconEvaluation className="h-5 w-5" />
                      </div>
                      <Badge variant={tpl.isActive ? 'success' : 'default'}>
                        {tpl.isActive ? t('evaluations.statuses.draft') : t('evaluations.statuses.draft')}
                      </Badge>
                    </div>

                    <h3 className="font-semibold text-neutral-900">{isAr ? tpl.nameAr : tpl.nameEn}</h3>
                    <p className="mt-0.5 text-xs text-neutral-400">{isAr ? tpl.nameEn : tpl.nameAr}</p>

                    {(tpl.descriptionAr || tpl.descriptionEn) && (
                      <p className="mt-2 line-clamp-2 text-xs text-neutral-500">
                        {isAr ? tpl.descriptionAr : tpl.descriptionEn}
                      </p>
                    )}

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Badge variant="info" className="text-[10px]">
                        {tpl.criteria?.length ?? 0} {t('evaluations.criteria')}
                      </Badge>
                      <Badge variant="brand" className="text-[10px]">
                        {t('evaluations.maxScore')}: {tpl.maxScore}
                      </Badge>
                    </div>

                    <div className="mt-2 text-[10px] text-neutral-400">
                      {dateFmt.format(new Date(tpl.createdAtUtc))}
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                      <Button size="sm" variant="outline" icon={<IconEye className="h-3.5 w-3.5" />} onClick={() => void openTemplateDetail(tpl)}>
                        {t('evaluations.viewResults')}
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* ============================================================ */}
      {/*  TAB 2: EVALUATIONS                                          */}
      {/* ============================================================ */}
      {activeTab === 'evaluations' && (
        <>
          {evalsLoading ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}>
                  <CardBody className="space-y-3">
                    <div className="h-5 w-3/4 animate-pulse rounded bg-neutral-200" />
                    <div className="h-4 w-1/2 animate-pulse rounded bg-neutral-100" />
                    <div className="flex gap-2">
                      <div className="h-5 w-20 animate-pulse rounded-full bg-neutral-100" />
                      <div className="h-5 w-20 animate-pulse rounded-full bg-neutral-100" />
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          ) : evaluations.length === 0 ? (
            <Card>
              <CardBody className="flex flex-col items-center py-16">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100 text-neutral-400">
                  <IconEvaluation className="h-8 w-8" />
                </div>
                <h3 className="mt-4 text-sm font-semibold text-neutral-900">{t('evaluations.noData')}</h3>
                <p className="mt-1 text-sm text-neutral-500">{t('evaluations.noDataDesc')}</p>
                {canManage && (
                  <Button className="mt-4" icon={<IconPlus className="h-4 w-4" />} onClick={() => { resetEvalForm(); setShowStartEval(true); }}>
                    {t('evaluations.startEvaluation')}
                  </Button>
                )}
              </CardBody>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {evaluations.map((ev) => {
                const pct = ev.scorePercentage;
                return (
                  <Card key={ev.id} className="transition-shadow hover:shadow-md">
                    <CardBody>
                      <div className="mb-3 flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${getScoreBgColor(pct)} ${getScoreColor(pct)}`}>
                            <IconCommittees className="h-5 w-5" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-semibold text-neutral-900">
                              {ev.committeeName ?? ev.committeeId}
                            </h3>
                            <p className="text-xs text-neutral-400">
                              {ev.templateName ?? ev.templateId}
                            </p>
                          </div>
                        </div>
                        <Badge variant={STATUS_VARIANT[ev.status] ?? 'default'}>
                          {t(`evaluations.statuses.${ev.status}` as any) ?? ev.status}
                        </Badge>
                      </div>

                      {/* Evaluator */}
                      <div className="mt-2 flex items-center gap-2 text-xs text-neutral-500">
                        <span className="font-medium">{t('evaluations.evaluator')}:</span>
                        <span>{ev.evaluatorDisplayName}</span>
                      </div>

                      {/* Period */}
                      <div className="mt-1 flex items-center gap-2 text-xs text-neutral-400">
                        <IconCalendar className="h-3.5 w-3.5" />
                        <span>{t('evaluations.period')}: {dateFmt.format(new Date(ev.periodStart))} — {dateFmt.format(new Date(ev.periodEnd))}</span>
                      </div>

                      {/* Score section */}
                      <div className="mt-3 rounded-lg border border-neutral-200 bg-neutral-50 p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-neutral-600">{t('evaluations.score')}</span>
                          <span className={`text-sm font-bold ${getScoreColor(pct)}`}>
                            {ev.totalScore} / {ev.maxPossibleScore}
                          </span>
                        </div>
                        {/* Progress bar */}
                        <div className="mt-2 h-2 w-full rounded-full bg-neutral-200">
                          <div
                            className={`h-2 rounded-full transition-all ${getScoreBarColor(pct)}`}
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          />
                        </div>
                        <div className="mt-1 flex items-center justify-between">
                          <span className="text-[10px] text-neutral-400">{t('evaluations.scorePercentage')}</span>
                          <span className={`text-xs font-bold ${getScoreColor(pct)}`}>
                            {pct.toFixed(1)}%
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-neutral-100 pt-3">
                        <Button size="sm" variant="outline" icon={<IconEye className="h-3.5 w-3.5" />} onClick={() => void openResults(ev)}>
                          {t('evaluations.viewResults')}
                        </Button>
                        {canManage && ev.status === 'in_progress' && (
                          <Button size="sm" variant="primary" icon={<IconCheckCircle className="h-3.5 w-3.5" />} onClick={() => void submitEvaluation(ev.id)} loading={submittingEval}>
                            {t('evaluations.submitEvaluation')}
                          </Button>
                        )}
                      </div>
                    </CardBody>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ============================================================ */}
      {/*  CREATE TEMPLATE MODAL                                       */}
      {/* ============================================================ */}
      <Modal open={showCreateTemplate} onClose={() => { setShowCreateTemplate(false); resetTemplateForm(); }} title={t('evaluations.createTemplate')}>
        <div className="grid gap-4 ">
          {/* Template basic fields */}
          <Input label={t('evaluations.templateNameAr')} value={tplNameAr} onChange={(e) => setTplNameAr(e.target.value)} dir="rtl" />
          <Input label={t('evaluations.templateNameEn')} value={tplNameEn} onChange={(e) => setTplNameEn(e.target.value)} dir="ltr" />
          <Input label={t('evaluations.templateDescAr')} value={tplDescAr} onChange={(e) => setTplDescAr(e.target.value)} dir="rtl" />
          <Input label={t('evaluations.templateDescEn')} value={tplDescEn} onChange={(e) => setTplDescEn(e.target.value)} dir="ltr" />
          <Input label={t('evaluations.maxScore')} type="number" value={tplMaxScore} onChange={(e) => setTplMaxScore(e.target.value)} min="1" />

          {/* Criteria section */}
          <div className="border-t border-neutral-200 pt-4">
            <h4 className="mb-3 text-sm font-semibold text-neutral-900">{t('evaluations.criteria')}</h4>
            <div className="space-y-4">
              {tplCriteria.map((c, idx) => (
                <div key={idx} className="rounded-lg border border-neutral-200 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-medium text-neutral-500">
                      {t('evaluations.criteria')} {idx + 1}
                    </span>
                    {tplCriteria.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeCriterion(idx)}
                        className="rounded p-1 text-neutral-400 hover:bg-red-50 hover:text-red-500"
                      >
                        <IconTrash className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Input
                      placeholder={t('evaluations.criterionLabelAr')}
                      value={c.labelAr}
                      onChange={(e) => updateCriterion(idx, 'labelAr', e.target.value)}
                      dir="rtl"
                    />
                    <Input
                      placeholder={t('evaluations.criterionLabelEn')}
                      value={c.labelEn}
                      onChange={(e) => updateCriterion(idx, 'labelEn', e.target.value)}
                      dir="ltr"
                    />
                    <div className="grid grid-cols-3 gap-2">
                      <Input
                        label={t('evaluations.maxScore')}
                        type="number"
                        value={String(c.maxScore)}
                        onChange={(e) => updateCriterion(idx, 'maxScore', Number(e.target.value))}
                        min="1"
                      />
                      <Input
                        label={t('evaluations.weight')}
                        type="number"
                        value={String(c.weight)}
                        onChange={(e) => updateCriterion(idx, 'weight', Number(e.target.value))}
                        min="0.1"
                        step="0.1"
                      />
                      <Input
                        label={t('evaluations.sortOrder')}
                        type="number"
                        value={String(c.sortOrder)}
                        onChange={(e) => updateCriterion(idx, 'sortOrder', Number(e.target.value))}
                        min="1"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="ghost" size="sm" className="mt-3" icon={<IconPlus className="h-3.5 w-3.5" />} onClick={addCriterion}>
              {t('evaluations.addCriterion')}
            </Button>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => { setShowCreateTemplate(false); resetTemplateForm(); }}>
              {t('actions.cancel')}
            </Button>
            <Button onClick={() => void saveTemplate()} disabled={!canSaveTemplate} loading={savingTemplate}>
              {t('actions.create')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ============================================================ */}
      {/*  TEMPLATE DETAIL MODAL                                       */}
      {/* ============================================================ */}
      <Modal
        open={!!detailTemplate || detailTemplateLoading}
        onClose={() => { setDetailTemplate(null); setDetailTemplateLoading(false); }}
        title={detailTemplate ? (isAr ? detailTemplate.nameAr : detailTemplate.nameEn) : t('evaluations.templates')}
        className="sm:max-w-2xl"
      >
        {detailTemplateLoading ? (
          <div className="space-y-4 py-8">
            <div className="mx-auto h-6 w-48 animate-pulse rounded bg-neutral-200" />
            <div className="mx-auto h-4 w-32 animate-pulse rounded bg-neutral-100" />
            <div className="space-y-2 pt-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-10 animate-pulse rounded bg-neutral-100" />
              ))}
            </div>
          </div>
        ) : detailTemplate ? (
          <div className="space-y-5">
            {/* Template info */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium text-neutral-500">{t('evaluations.templateNameAr')}</p>
                <p className="mt-1 text-sm text-neutral-900" dir="rtl">{detailTemplate.nameAr}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-neutral-500">{t('evaluations.templateNameEn')}</p>
                <p className="mt-1 text-sm text-neutral-900" dir="ltr">{detailTemplate.nameEn}</p>
              </div>
            </div>

            {(detailTemplate.descriptionAr || detailTemplate.descriptionEn) && (
              <div>
                <p className="text-xs font-medium text-neutral-500">{t('evaluations.templateDescAr')}</p>
                {detailTemplate.descriptionAr && (
                  <p className="mt-1 text-sm text-neutral-700" dir="rtl">{detailTemplate.descriptionAr}</p>
                )}
                {detailTemplate.descriptionEn && (
                  <p className="mt-1 text-sm text-neutral-700" dir="ltr">{detailTemplate.descriptionEn}</p>
                )}
              </div>
            )}

            <div className="flex items-center gap-4">
              <Badge variant="brand">{t('evaluations.maxScore')}: {detailTemplate.maxScore}</Badge>
              <Badge variant="info">{detailTemplate.criteria?.length ?? 0} {t('evaluations.criteria')}</Badge>
            </div>

            {/* Criteria list */}
            <div className="border-t border-neutral-200 pt-4">
              <h4 className="mb-3 text-sm font-semibold text-neutral-900">{t('evaluations.criteria')}</h4>
              {detailTemplate.criteria && detailTemplate.criteria.length > 0 ? (
                <div className="space-y-2">
                  {[...detailTemplate.criteria]
                    .sort((a, b) => a.sortOrder - b.sortOrder)
                    .map((cr, idx) => (
                      <div key={cr.id} className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-neutral-50 p-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-600 text-xs font-bold">
                          {idx + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-neutral-900">{isAr ? cr.labelAr : cr.labelEn}</p>
                          <p className="text-xs text-neutral-400">{isAr ? cr.labelEn : cr.labelAr}</p>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-neutral-500">
                          <span>{t('evaluations.maxScore')}: <strong>{cr.maxScore}</strong></span>
                          <span>{t('evaluations.weight')}: <strong>{cr.weight}</strong></span>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-xs italic text-neutral-400">{t('evaluations.noTemplatesDesc')}</p>
              )}
            </div>
          </div>
        ) : null}
      </Modal>

      {/* ============================================================ */}
      {/*  START EVALUATION MODAL                                      */}
      {/* ============================================================ */}
      <Modal open={showStartEval} onClose={() => { setShowStartEval(false); resetEvalForm(); }} title={t('evaluations.startEvaluation')}>
        <div className="grid gap-4 ">
          <Select
            label={t('evaluations.committee')}
            value={evalCommitteeId}
            onChange={(e) => setEvalCommitteeId(e.target.value)}
            options={committeeOptions}
          />
          <Select
            label={t('evaluations.template')}
            value={evalTemplateId}
            onChange={(e) => setEvalTemplateId(e.target.value)}
            options={templateOptions}
          />
          <Input
            label={t('evaluations.evaluator')}
            value={evalEvaluator}
            onChange={(e) => setEvalEvaluator(e.target.value)}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label={t('evaluations.periodStart')}
              type="date"
              value={evalPeriodStart}
              onChange={(e) => setEvalPeriodStart(e.target.value)}
            />
            <Input
              label={t('evaluations.periodEnd')}
              type="date"
              value={evalPeriodEnd}
              onChange={(e) => setEvalPeriodEnd(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => { setShowStartEval(false); resetEvalForm(); }}>
              {t('actions.cancel')}
            </Button>
            <Button onClick={() => void startEvaluation()} disabled={!canStartEval} loading={startingEval}>
              {t('actions.create')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ============================================================ */}
      {/*  VIEW RESULTS MODAL                                          */}
      {/* ============================================================ */}
      <Modal
        open={!!resultsEval}
        onClose={() => { setResultsEval(null); setResultsTemplate(null); }}
        title={t('evaluations.viewResults')}
        className="sm:max-w-2xl"
      >
        {resultsEval && (
          <div className="space-y-5">
            {/* Evaluation header info */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium text-neutral-500">{t('evaluations.committee')}</p>
                <p className="mt-1 text-sm text-neutral-900">{resultsEval.committeeName ?? resultsEval.committeeId}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-neutral-500">{t('evaluations.evaluator')}</p>
                <p className="mt-1 text-sm text-neutral-900">{resultsEval.evaluatorDisplayName}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-neutral-500">{t('evaluations.period')}</p>
                <p className="mt-1 text-sm text-neutral-900">
                  {dateFmt.format(new Date(resultsEval.periodStart))} — {dateFmt.format(new Date(resultsEval.periodEnd))}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-neutral-500">{t('evaluations.template')}</p>
                <p className="mt-1 text-sm text-neutral-900">{resultsEval.templateName ?? resultsEval.templateId}</p>
              </div>
            </div>

            {/* Overall score card */}
            <div className={`rounded-xl border p-4 ${getScoreBgColor(resultsEval.scorePercentage)}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-neutral-600">{t('evaluations.totalScore')}</p>
                  <p className={`text-3xl font-bold ${getScoreColor(resultsEval.scorePercentage)}`}>
                    {resultsEval.totalScore} <span className="text-lg font-normal text-neutral-400">/ {resultsEval.maxPossibleScore}</span>
                  </p>
                </div>
                <div className="text-center">
                  <div className={`text-3xl font-bold ${getScoreColor(resultsEval.scorePercentage)}`}>
                    {resultsEval.scorePercentage.toFixed(1)}%
                  </div>
                  <p className="text-xs text-neutral-500">{t('evaluations.scorePercentage')}</p>
                </div>
              </div>
              {/* Full-width progress bar */}
              <div className="mt-3 h-3 w-full rounded-full bg-neutral-0/60">
                <div
                  className={`h-3 rounded-full transition-all ${getScoreBarColor(resultsEval.scorePercentage)}`}
                  style={{ width: `${Math.min(resultsEval.scorePercentage, 100)}%` }}
                />
              </div>
            </div>

            {/* Status badge */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-neutral-500">{t('evaluations.statuses.draft').replace(/.*/, '')}:</span>
              <Badge variant={STATUS_VARIANT[resultsEval.status] ?? 'default'}>
                {t(`evaluations.statuses.${resultsEval.status}` as any) ?? resultsEval.status}
              </Badge>
            </div>

            {/* Criteria breakdown */}
            {resultsLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-12 animate-pulse rounded bg-neutral-100" />
                ))}
              </div>
            ) : resultsTemplate && resultsTemplate.criteria && resultsTemplate.criteria.length > 0 ? (
              <div className="border-t border-neutral-200 pt-4">
                <h4 className="mb-3 text-sm font-semibold text-neutral-900">{t('evaluations.criteria')}</h4>
                <div className="space-y-2">
                  {[...resultsTemplate.criteria]
                    .sort((a, b) => a.sortOrder - b.sortOrder)
                    .map((cr, idx) => (
                      <div key={cr.id} className="rounded-lg border border-neutral-200 bg-neutral-0 p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-100 text-brand-600 text-[10px] font-bold">
                              {idx + 1}
                            </span>
                            <span className="text-sm font-medium text-neutral-900">
                              {isAr ? cr.labelAr : cr.labelEn}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-neutral-500">
                            <span>{t('evaluations.maxScore')}: {cr.maxScore}</span>
                            <span>{t('evaluations.weight')}: {cr.weight}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ) : null}

            {/* Submit button for in_progress evaluations */}
            {canManage && resultsEval.status === 'in_progress' && (
              <div className="flex justify-end border-t border-neutral-200 pt-4">
                <Button
                  icon={<IconCheckCircle className="h-4 w-4" />}
                  onClick={() => void submitEvaluation(resultsEval.id)}
                  loading={submittingEval}
                >
                  {t('evaluations.submitEvaluation')}
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
