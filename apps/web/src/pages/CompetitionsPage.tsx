import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useApi } from '../hooks/useApi';
import { useAuth } from '../app/auth';
import { Card, CardBody, Button, Modal, Input, useToast } from '../components/ui';
import { IconTrophy, IconMedal, IconPlus, IconSearch, IconEye, IconPencil, IconTrash } from '../components/icons';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
type Competition = {
  id: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  type: 'quiz' | 'raffle' | 'challenge' | 'tournament';
  status: 'draft' | 'registration' | 'active' | 'judging' | 'completed' | 'archived';
  startDate: string;
  endDate: string;
  committeeId?: string;
  surveyId?: string | null;
  maxParticipants?: number | null;
  participantsCount: number;
  prizesAr?: string;
  prizesEn?: string;
  rulesAr?: string;
  rulesEn?: string;
  createdBy: string;
  createdAtUtc: string;
};

type CompetitionWinner = {
  id: string;
  competitionId: string;
  competitionTitle: string;
  competitionTitleAr: string;
  competitionType: string;
  rank: number;
  participantName: string;
  participantEmail: string;
  participantDepartment?: string;
  score?: number | null;
  prize?: string;
  wonAtUtc: string;
};

type LeaderboardEntry = {
  rank: number;
  participantName: string;
  participantEmail: string;
  department?: string;
  totalWins: number;
  totalScore: number;
  goldMedals: number;
  silverMedals: number;
  bronzeMedals: number;
  competitions: number;
};

type Tab = 'competitions' | 'winners' | 'leaderboard';

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */
const COMP_TYPE_COLORS: Record<string, string> = {
  quiz: 'bg-blue-100 text-blue-700',
  raffle: 'bg-purple-100 text-purple-700',
  challenge: 'bg-orange-100 text-orange-700',
  tournament: 'bg-green-100 text-green-700',
};

const COMP_STATUS_COLORS: Record<string, string> = {
  draft: 'bg-neutral-100 text-neutral-600',
  registration: 'bg-sky-100 text-sky-700',
  active: 'bg-green-100 text-green-700',
  judging: 'bg-amber-100 text-amber-700',
  completed: 'bg-brand-100 text-brand-700',
  archived: 'bg-neutral-200 text-neutral-500',
};

const MEDAL_COLORS: Record<number, { bg: string; text: string; border: string; emoji: string }> = {
  1: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-300', emoji: '🥇' },
  2: { bg: 'bg-neutral-50', text: 'text-neutral-500', border: 'border-neutral-300', emoji: '🥈' },
  3: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-300', emoji: '🥉' },
};

const COMP_TYPES = ['', 'quiz', 'raffle', 'challenge', 'tournament'] as const;
const COMP_STATUSES = ['', 'draft', 'registration', 'active', 'judging', 'completed', 'archived'] as const;

const selectCls = 'w-full appearance-none rounded-md border border-neutral-300 bg-neutral-0 py-2 pe-10 ps-3 text-sm text-neutral-900 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-1';

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */
export function CompetitionsPage() {
  const { get, post, put, del } = useApi();
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const { hasRole } = useAuth();
  const isAr = i18n.language === 'ar';
  const canManage = hasRole('CommitteeSecretary', 'SystemAdmin');

  // ── State ──
  const [tab, setTab] = useState<Tab>('competitions');
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [winners, setWinners] = useState<CompetitionWinner[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [winnersFilterType, setWinnersFilterType] = useState('');

  // Modals
  const [showCreate, setShowCreate] = useState(false);
  const [editItem, setEditItem] = useState<Competition | null>(null);
  const [viewItem, setViewItem] = useState<Competition | null>(null);
  const [showAddWinner, setShowAddWinner] = useState<Competition | null>(null);
  const [viewWinners, setViewWinners] = useState<Competition | null>(null);
  const [competitionWinners, setCompetitionWinners] = useState<CompetitionWinner[]>([]);

  // Form state
  const [form, setForm] = useState({
    titleAr: '', titleEn: '', descriptionAr: '', descriptionEn: '',
    type: 'quiz' as Competition['type'],
    status: 'draft' as Competition['status'],
    startDate: '', endDate: '',
    maxParticipants: '',
    prizesAr: '', prizesEn: '', rulesAr: '', rulesEn: '',
  });

  // Winner form
  const [winnerForm, setWinnerForm] = useState({
    participantName: '', participantEmail: '', participantDepartment: '',
    rank: '1', score: '', prize: '',
  });

  // ── Data fetching ──
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [compRes, winRes, lbRes] = await Promise.all([
        get<{ items: Competition[] }>('/api/v1/competitions'),
        get<CompetitionWinner[]>('/api/v1/competitions/winners'),
        get<LeaderboardEntry[]>('/api/v1/competitions/leaderboard'),
      ]);
      setCompetitions(compRes.items ?? []);
      setWinners(winRes ?? []);
      setLeaderboard(lbRes ?? []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [get]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Filtered data ──
  const filteredCompetitions = useMemo(() => {
    return competitions.filter((c) => {
      const q = search.toLowerCase();
      const matchSearch = !q ||
        c.titleAr.toLowerCase().includes(q) ||
        c.titleEn.toLowerCase().includes(q) ||
        (c.descriptionAr || '').toLowerCase().includes(q) ||
        (c.descriptionEn || '').toLowerCase().includes(q);
      const matchType = !filterType || c.type === filterType;
      const matchStatus = !filterStatus || c.status === filterStatus;
      return matchSearch && matchType && matchStatus;
    });
  }, [competitions, search, filterType, filterStatus]);

  const filteredWinners = useMemo(() => {
    if (!winnersFilterType) return winners;
    return winners.filter((w) => w.competitionType === winnersFilterType);
  }, [winners, winnersFilterType]);

  // ── Stats ──
  const stats = useMemo(() => ({
    total: competitions.length,
    active: competitions.filter((c) => c.status === 'active').length,
    completed: competitions.filter((c) => c.status === 'completed').length,
    participants: competitions.reduce((s, c) => s + c.participantsCount, 0),
  }), [competitions]);

  // ── Form handlers ──
  const resetForm = () => {
    setForm({ titleAr: '', titleEn: '', descriptionAr: '', descriptionEn: '', type: 'quiz', status: 'draft', startDate: '', endDate: '', maxParticipants: '', prizesAr: '', prizesEn: '', rulesAr: '', rulesEn: '' });
  };

  const openCreate = () => { resetForm(); setShowCreate(true); };

  const openEdit = (c: Competition) => {
    setForm({
      titleAr: c.titleAr, titleEn: c.titleEn,
      descriptionAr: c.descriptionAr, descriptionEn: c.descriptionEn,
      type: c.type, status: c.status,
      startDate: c.startDate?.slice(0, 10) ?? '', endDate: c.endDate?.slice(0, 10) ?? '',
      maxParticipants: c.maxParticipants?.toString() ?? '',
      prizesAr: c.prizesAr ?? '', prizesEn: c.prizesEn ?? '',
      rulesAr: c.rulesAr ?? '', rulesEn: c.rulesEn ?? '',
    });
    setEditItem(c);
  };

  const handleSave = async () => {
    const body = {
      ...form,
      maxParticipants: form.maxParticipants ? parseInt(form.maxParticipants) : null,
    };
    try {
      if (editItem) {
        await put(`/api/v1/competitions/${editItem.id}`, body);
        toast.success(t('competitions.updated'));
      } else {
        await post('/api/v1/competitions', body);
        toast.success(t('competitions.created'));
      }
      setShowCreate(false);
      setEditItem(null);
      fetchAll();
    } catch {
      toast.error('Error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('competitions.deleteConfirm'))) return;
    try {
      await del(`/api/v1/competitions/${id}`);
      toast.success(t('competitions.deleted'));
      fetchAll();
    } catch {
      toast.error('Error');
    }
  };

  const handleAddWinner = async () => {
    if (!showAddWinner) return;
    try {
      await post(`/api/v1/competitions/${showAddWinner.id}/winners`, {
        ...winnerForm,
        rank: parseInt(winnerForm.rank),
        score: winnerForm.score ? parseFloat(winnerForm.score) : null,
      });
      toast.success(t('competitions.winnerAdded'));
      setShowAddWinner(null);
      setWinnerForm({ participantName: '', participantEmail: '', participantDepartment: '', rank: '1', score: '', prize: '' });
      fetchAll();
    } catch {
      toast.error('Error');
    }
  };

  const openViewWinners = async (c: Competition) => {
    setViewWinners(c);
    try {
      const res = await get<CompetitionWinner[]>(`/api/v1/competitions/${c.id}/winners`);
      setCompetitionWinners(res ?? []);
    } catch {
      setCompetitionWinners([]);
    }
  };

  // ── Helpers ──
  const fmtDate = (d: string) => {
    if (!d) return '—';
    try { return new Date(d).toLocaleDateString(isAr ? 'ar-SA' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' }); }
    catch { return d.slice(0, 10); }
  };

  const localTitle = (c: { titleAr: string; titleEn: string }) => isAr ? c.titleAr : c.titleEn;
  const localCompTitle = (w: CompetitionWinner) => isAr ? w.competitionTitleAr : w.competitionTitle;

  // ── Tabs config ──
  const tabs: { key: Tab; label: string }[] = [
    { key: 'competitions', label: t('competitions.tabs.competitions') },
    { key: 'winners', label: t('competitions.tabs.winners') },
    { key: 'leaderboard', label: t('competitions.tabs.leaderboard') },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100 text-brand-600">
            <IconTrophy className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-neutral-900">{t('competitions.title')}</h1>
            <p className="text-sm text-neutral-500">{t('competitions.description')}</p>
          </div>
        </div>
        {canManage && tab === 'competitions' && (
          <Button onClick={openCreate} className="gap-2">
            <IconPlus className="h-4 w-4" />
            {t('competitions.create')}
          </Button>
        )}
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 rounded-lg bg-neutral-100 p-1">
        {tabs.map((tb) => (
          <button
            key={tb.key}
            type="button"
            onClick={() => setTab(tb.key)}
            className={[
              'flex-1 rounded-md px-4 py-2 text-sm font-medium transition-all duration-150',
              tab === tb.key
                ? 'bg-neutral-0 text-brand-700 shadow-sm'
                : 'text-neutral-500 hover:text-neutral-700',
            ].join(' ')}
          >
            {tb.label}
          </button>
        ))}
      </div>

      {/* ── Tab: Competitions ── */}
      {tab === 'competitions' && (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: t('competitions.stats.total'), value: stats.total, color: 'bg-brand-50 text-brand-700' },
              { label: t('competitions.stats.active'), value: stats.active, color: 'bg-green-50 text-green-700' },
              { label: t('competitions.stats.completed'), value: stats.completed, color: 'bg-blue-50 text-blue-700' },
              { label: t('competitions.stats.totalParticipants'), value: stats.participants, color: 'bg-purple-50 text-purple-700' },
            ].map((s) => (
              <Card key={s.label}>
                <CardBody className="flex items-center gap-3 p-4">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${s.color}`}>
                    <IconTrophy className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-neutral-900">{s.value}</div>
                    <div className="text-xs text-neutral-500">{s.label}</div>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>

          {/* Filters */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <IconSearch className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <Input
                placeholder={t('actions.search') + '...'}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="ps-10"
              />
            </div>
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className={selectCls}>
              <option value="">{t('competitions.fields.type')} — {t('actions.filter')}</option>
              {COMP_TYPES.filter(Boolean).map((tp) => (
                <option key={tp} value={tp}>{t(`competitions.types.${tp}`)}</option>
              ))}
            </select>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className={selectCls}>
              <option value="">{t('competitions.fields.status')} — {t('actions.filter')}</option>
              {COMP_STATUSES.filter(Boolean).map((st) => (
                <option key={st} value={st}>{t(`competitions.statuses.${st}`)}</option>
              ))}
            </select>
          </div>

          {/* Competition cards */}
          {filteredCompetitions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <IconTrophy className="h-16 w-16 text-neutral-200" />
              <h3 className="mt-4 text-lg font-semibold text-neutral-700">{t('competitions.noData')}</h3>
              <p className="mt-1 text-sm text-neutral-500">{t('competitions.noDataDesc')}</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredCompetitions.map((c) => (
                <Card key={c.id} className="overflow-hidden transition-shadow hover:shadow-md">
                  <CardBody className="p-0">
                    {/* Top bar color by type */}
                    <div className={`h-1.5 ${COMP_TYPE_COLORS[c.type]?.split(' ')[0] ?? 'bg-neutral-200'}`} />
                    <div className="p-4 space-y-3">
                      {/* Title + badges */}
                      <div className="space-y-2">
                        <h3 className="text-sm font-bold text-neutral-900 line-clamp-2">{localTitle(c)}</h3>
                        <div className="flex flex-wrap gap-1.5">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${COMP_TYPE_COLORS[c.type] ?? ''}`}>
                            {t(`competitions.types.${c.type}`)}
                          </span>
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${COMP_STATUS_COLORS[c.status] ?? ''}`}>
                            {t(`competitions.statuses.${c.status}`)}
                          </span>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-neutral-500 line-clamp-2">
                        {isAr ? c.descriptionAr : c.descriptionEn}
                      </p>

                      {/* Meta */}
                      <div className="space-y-1 text-xs text-neutral-500">
                        <div className="flex justify-between">
                          <span>{t('competitions.fields.participants')}</span>
                          <span className="font-medium text-neutral-700">
                            {c.participantsCount}{c.maxParticipants ? `/${c.maxParticipants}` : ''}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>{t('competitions.fields.startDate')}</span>
                          <span className="font-medium text-neutral-700">{fmtDate(c.startDate)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>{t('competitions.fields.endDate')}</span>
                          <span className="font-medium text-neutral-700">{fmtDate(c.endDate)}</span>
                        </div>
                      </div>

                      {/* Prizes */}
                      {(c.prizesAr || c.prizesEn) && (
                        <div className="rounded-md bg-amber-50 px-3 py-1.5 text-xs text-amber-700">
                          <span className="font-semibold">{t('competitions.winners.prize')}:</span>{' '}
                          {isAr ? c.prizesAr : c.prizesEn}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setViewItem(c)}
                          className="flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-brand-600 hover:bg-brand-50 transition-colors"
                        >
                          <IconEye className="h-3.5 w-3.5" />
                          {t('actions.view')}
                        </button>
                        {canManage && (
                          <>
                            <button
                              type="button"
                              onClick={() => openEdit(c)}
                              className="flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-100 transition-colors"
                            >
                              <IconPencil className="h-3.5 w-3.5" />
                              {t('actions.edit')}
                            </button>
                            <button
                              type="button"
                              onClick={() => openViewWinners(c)}
                              className="flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-amber-600 hover:bg-amber-50 transition-colors"
                            >
                              <IconMedal className="h-3.5 w-3.5" />
                              {t('competitions.winners.title')}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Winners Hall ── */}
      {tab === 'winners' && (
        <div className="space-y-6">
          {/* Filter by type */}
          <div className="flex items-center gap-3">
            <select value={winnersFilterType} onChange={(e) => setWinnersFilterType(e.target.value)} className={`${selectCls} max-w-xs`}>
              <option value="">{t('competitions.fields.type')} — {t('actions.filter')}</option>
              {COMP_TYPES.filter(Boolean).map((tp) => (
                <option key={tp} value={tp}>{t(`competitions.types.${tp}`)}</option>
              ))}
            </select>
          </div>

          {filteredWinners.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <IconMedal className="h-16 w-16 text-neutral-200" />
              <h3 className="mt-4 text-lg font-semibold text-neutral-700">{t('competitions.noWinners')}</h3>
              <p className="mt-1 text-sm text-neutral-500">{t('competitions.noWinnersDesc')}</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredWinners.map((w) => {
                const medal = MEDAL_COLORS[w.rank];
                return (
                  <Card key={w.id} className={`overflow-hidden transition-shadow hover:shadow-md ${medal ? `border ${medal.border}` : ''}`}>
                    <CardBody className="p-4">
                      <div className="flex items-start gap-3">
                        {/* Medal icon */}
                        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-2xl ${medal?.bg ?? 'bg-neutral-100'}`}>
                          {medal?.emoji ?? `#${w.rank}`}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-bold text-neutral-900">{w.participantName}</div>
                          <div className="text-xs text-neutral-500">{w.participantDepartment}</div>
                          <div className="mt-1 text-xs text-neutral-400">{w.participantEmail}</div>
                        </div>
                      </div>

                      <div className="mt-3 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-neutral-500">{t('competitions.winners.competition')}</span>
                          <span className="font-medium text-neutral-700 text-end max-w-[60%] truncate">
                            {localCompTitle(w)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-neutral-500">{t('competitions.winners.rank')}</span>
                          <span className={`font-bold ${medal?.text ?? 'text-neutral-700'}`}>
                            {t(`competitions.winners.${w.rank === 1 ? '1st' : w.rank === 2 ? '2nd' : '3rd'}` as any) || `#${w.rank}`}
                          </span>
                        </div>
                        {w.score != null && (
                          <div className="flex items-center justify-between">
                            <span className="text-neutral-500">{t('competitions.winners.score')}</span>
                            <span className="font-medium text-neutral-700">{w.score}</span>
                          </div>
                        )}
                        {w.prize && (
                          <div className="flex items-center justify-between">
                            <span className="text-neutral-500">{t('competitions.winners.prize')}</span>
                            <span className="font-medium text-amber-600 text-end max-w-[60%] truncate">{w.prize}</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-neutral-500">{t('competitions.winners.date')}</span>
                          <span className="font-medium text-neutral-700">{fmtDate(w.wonAtUtc)}</span>
                        </div>
                      </div>

                      {/* Type badge */}
                      <div className="mt-3">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${COMP_TYPE_COLORS[w.competitionType] ?? 'bg-neutral-100 text-neutral-600'}`}>
                          {t(`competitions.types.${w.competitionType}` as any)}
                        </span>
                      </div>
                    </CardBody>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Leaderboard ── */}
      {tab === 'leaderboard' && (
        <div className="space-y-8">
          {/* Podium */}
          {leaderboard.length >= 3 ? (
            <div>
              <h2 className="mb-6 text-center text-lg font-bold text-neutral-900">{t('competitions.podium.title')}</h2>
              <div className="mx-auto flex max-w-2xl items-end justify-center gap-3 sm:gap-6">
                {/* 2nd place */}
                <PodiumCard entry={leaderboard[1]} position={2} isAr={isAr} t={t} />
                {/* 1st place */}
                <PodiumCard entry={leaderboard[0]} position={1} isAr={isAr} t={t} />
                {/* 3rd place */}
                <PodiumCard entry={leaderboard[2]} position={3} isAr={isAr} t={t} />
              </div>
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <IconTrophy className="h-16 w-16 text-neutral-200" />
              <h3 className="mt-4 text-lg font-semibold text-neutral-700">{t('competitions.podium.noData')}</h3>
            </div>
          ) : null}

          {/* Rankings table */}
          {leaderboard.length > 0 && (
            <Card>
              <CardBody className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-neutral-200 bg-neutral-50">
                        <th className="px-4 py-3 text-start font-semibold text-neutral-600">{t('competitions.leaderboard.rank')}</th>
                        <th className="px-4 py-3 text-start font-semibold text-neutral-600">{t('competitions.leaderboard.name')}</th>
                        <th className="px-4 py-3 text-start font-semibold text-neutral-600 hidden sm:table-cell">{t('competitions.leaderboard.department')}</th>
                        <th className="px-4 py-3 text-center font-semibold text-neutral-600">{t('competitions.leaderboard.wins')}</th>
                        <th className="px-4 py-3 text-center font-semibold text-neutral-600 hidden sm:table-cell">{t('competitions.leaderboard.medals')}</th>
                        <th className="px-4 py-3 text-center font-semibold text-neutral-600">{t('competitions.leaderboard.score')}</th>
                        <th className="px-4 py-3 text-center font-semibold text-neutral-600 hidden md:table-cell">{t('competitions.leaderboard.competitions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaderboard.map((entry, i) => (
                        <tr key={entry.participantEmail} className={`border-b border-neutral-100 transition-colors hover:bg-neutral-50 ${i < 3 ? 'bg-amber-50/30' : ''}`}>
                          <td className="px-4 py-3">
                            <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                              i === 0 ? 'bg-amber-100 text-amber-700' :
                              i === 1 ? 'bg-neutral-200 text-neutral-600' :
                              i === 2 ? 'bg-orange-100 text-orange-700' :
                              'bg-neutral-100 text-neutral-500'
                            }`}>
                              {entry.rank}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-medium text-neutral-900">{entry.participantName}</div>
                            <div className="text-xs text-neutral-400 sm:hidden">{entry.department}</div>
                          </td>
                          <td className="px-4 py-3 text-neutral-500 hidden sm:table-cell">{entry.department}</td>
                          <td className="px-4 py-3 text-center font-semibold text-neutral-700">{entry.totalWins}</td>
                          <td className="px-4 py-3 hidden sm:table-cell">
                            <div className="flex items-center justify-center gap-1.5">
                              {entry.goldMedals > 0 && <span className="text-xs" title={t('competitions.winners.gold')}>🥇{entry.goldMedals}</span>}
                              {entry.silverMedals > 0 && <span className="text-xs" title={t('competitions.winners.silver')}>🥈{entry.silverMedals}</span>}
                              {entry.bronzeMedals > 0 && <span className="text-xs" title={t('competitions.winners.bronze')}>🥉{entry.bronzeMedals}</span>}
                              {entry.goldMedals === 0 && entry.silverMedals === 0 && entry.bronzeMedals === 0 && <span className="text-neutral-300">—</span>}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center font-semibold text-brand-600">{entry.totalScore}</td>
                          <td className="px-4 py-3 text-center text-neutral-500 hidden md:table-cell">{entry.competitions}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      )}

      {/* ── Modal: Create / Edit Competition ── */}
      <Modal
        open={showCreate || !!editItem}
        onClose={() => { setShowCreate(false); setEditItem(null); }}
        title={editItem ? t('competitions.edit') : t('competitions.create')}
        className="max-w-2xl"
      >
        <div className="space-y-4 p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label={t('competitions.fields.titleAr')} value={form.titleAr} onChange={(e) => setForm({ ...form, titleAr: e.target.value })} />
            <Input label={t('competitions.fields.titleEn')} value={form.titleEn} onChange={(e) => setForm({ ...form, titleEn: e.target.value })} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700">{t('competitions.fields.descriptionAr')}</label>
              <textarea rows={3} value={form.descriptionAr} onChange={(e) => setForm({ ...form, descriptionAr: e.target.value })} className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700">{t('competitions.fields.descriptionEn')}</label>
              <textarea rows={3} value={form.descriptionEn} onChange={(e) => setForm({ ...form, descriptionEn: e.target.value })} className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-neutral-700">{t('competitions.fields.type')}</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as Competition['type'] })} className={selectCls}>
                {COMP_TYPES.filter(Boolean).map((tp) => (
                  <option key={tp} value={tp}>{t(`competitions.types.${tp}`)}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-neutral-700">{t('competitions.fields.status')}</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Competition['status'] })} className={selectCls}>
                {COMP_STATUSES.filter(Boolean).map((st) => (
                  <option key={st} value={st}>{t(`competitions.statuses.${st}`)}</option>
                ))}
              </select>
            </div>
            <Input label={t('competitions.fields.maxParticipants')} type="number" value={form.maxParticipants} onChange={(e) => setForm({ ...form, maxParticipants: e.target.value })} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label={t('competitions.fields.startDate')} type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            <Input label={t('competitions.fields.endDate')} type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label={t('competitions.fields.prizesAr')} value={form.prizesAr} onChange={(e) => setForm({ ...form, prizesAr: e.target.value })} />
            <Input label={t('competitions.fields.prizesEn')} value={form.prizesEn} onChange={(e) => setForm({ ...form, prizesEn: e.target.value })} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700">{t('competitions.fields.rulesAr')}</label>
              <textarea rows={2} value={form.rulesAr} onChange={(e) => setForm({ ...form, rulesAr: e.target.value })} className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700">{t('competitions.fields.rulesEn')}</label>
              <textarea rows={2} value={form.rulesEn} onChange={(e) => setForm({ ...form, rulesEn: e.target.value })} className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => { setShowCreate(false); setEditItem(null); }}>
              {t('actions.cancel')}
            </Button>
            <Button onClick={handleSave} disabled={!form.titleAr && !form.titleEn}>
              {t('actions.save')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Modal: View Competition Details ── */}
      <Modal
        open={!!viewItem}
        onClose={() => setViewItem(null)}
        title={viewItem ? localTitle(viewItem) : ''}
        className="max-w-2xl"
      >
        {viewItem && (
          <div className="space-y-4 p-4">
            <div className="flex flex-wrap gap-2">
              <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${COMP_TYPE_COLORS[viewItem.type] ?? ''}`}>
                {t(`competitions.types.${viewItem.type}`)}
              </span>
              <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${COMP_STATUS_COLORS[viewItem.status] ?? ''}`}>
                {t(`competitions.statuses.${viewItem.status}`)}
              </span>
            </div>

            <p className="text-sm text-neutral-600">{isAr ? viewItem.descriptionAr : viewItem.descriptionEn}</p>

            <div className="grid gap-3 sm:grid-cols-2 text-sm">
              <div className="flex justify-between rounded-md bg-neutral-50 px-3 py-2">
                <span className="text-neutral-500">{t('competitions.fields.startDate')}</span>
                <span className="font-medium">{fmtDate(viewItem.startDate)}</span>
              </div>
              <div className="flex justify-between rounded-md bg-neutral-50 px-3 py-2">
                <span className="text-neutral-500">{t('competitions.fields.endDate')}</span>
                <span className="font-medium">{fmtDate(viewItem.endDate)}</span>
              </div>
              <div className="flex justify-between rounded-md bg-neutral-50 px-3 py-2">
                <span className="text-neutral-500">{t('competitions.fields.participants')}</span>
                <span className="font-medium">{viewItem.participantsCount}{viewItem.maxParticipants ? `/${viewItem.maxParticipants}` : ''}</span>
              </div>
              <div className="flex justify-between rounded-md bg-neutral-50 px-3 py-2">
                <span className="text-neutral-500">{t('competitions.fields.status')}</span>
                <span className="font-medium">{t(`competitions.statuses.${viewItem.status}`)}</span>
              </div>
            </div>

            {(viewItem.prizesAr || viewItem.prizesEn) && (
              <div className="rounded-lg bg-amber-50 p-3">
                <div className="text-xs font-semibold text-amber-700 mb-1">{t('competitions.winners.prize')}</div>
                <div className="text-sm text-amber-800">{isAr ? viewItem.prizesAr : viewItem.prizesEn}</div>
              </div>
            )}

            {(viewItem.rulesAr || viewItem.rulesEn) && (
              <div className="rounded-lg bg-blue-50 p-3">
                <div className="text-xs font-semibold text-blue-700 mb-1">{t('competitions.fields.rulesAr').replace(' (عربي)', '').replace(' (Arabic)', '')}</div>
                <div className="text-sm text-blue-800">{isAr ? viewItem.rulesAr : viewItem.rulesEn}</div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              {canManage && (
                <>
                  <Button variant="ghost" onClick={() => { setViewItem(null); setShowAddWinner(viewItem); }}>
                    <IconMedal className="h-4 w-4 me-1" />
                    {t('competitions.addWinner')}
                  </Button>
                  <Button variant="ghost" onClick={() => { setViewItem(null); openEdit(viewItem); }}>
                    <IconPencil className="h-4 w-4 me-1" />
                    {t('actions.edit')}
                  </Button>
                  <Button variant="danger" onClick={() => { setViewItem(null); handleDelete(viewItem.id); }}>
                    <IconTrash className="h-4 w-4 me-1" />
                    {t('actions.delete')}
                  </Button>
                </>
              )}
              <Button onClick={() => setViewItem(null)}>{t('actions.close')}</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Modal: Add Winner ── */}
      <Modal
        open={!!showAddWinner}
        onClose={() => setShowAddWinner(null)}
        title={`${t('competitions.addWinner')} — ${showAddWinner ? localTitle(showAddWinner) : ''}`}
      >
        <div className="space-y-4 p-4">
          <Input label={t('competitions.winners.participant')} value={winnerForm.participantName} onChange={(e) => setWinnerForm({ ...winnerForm, participantName: e.target.value })} />
          <Input label="Email" type="email" value={winnerForm.participantEmail} onChange={(e) => setWinnerForm({ ...winnerForm, participantEmail: e.target.value })} />
          <Input label={t('competitions.winners.department')} value={winnerForm.participantDepartment} onChange={(e) => setWinnerForm({ ...winnerForm, participantDepartment: e.target.value })} />
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-neutral-700">{t('competitions.winners.rank')}</label>
              <select value={winnerForm.rank} onChange={(e) => setWinnerForm({ ...winnerForm, rank: e.target.value })} className={selectCls}>
                <option value="1">{t('competitions.winners.1st')}</option>
                <option value="2">{t('competitions.winners.2nd')}</option>
                <option value="3">{t('competitions.winners.3rd')}</option>
              </select>
            </div>
            <Input label={t('competitions.winners.score')} type="number" value={winnerForm.score} onChange={(e) => setWinnerForm({ ...winnerForm, score: e.target.value })} />
            <Input label={t('competitions.winners.prize')} value={winnerForm.prize} onChange={(e) => setWinnerForm({ ...winnerForm, prize: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setShowAddWinner(null)}>{t('actions.cancel')}</Button>
            <Button onClick={handleAddWinner} disabled={!winnerForm.participantName}>{t('actions.save')}</Button>
          </div>
        </div>
      </Modal>

      {/* ── Modal: View Competition Winners ── */}
      <Modal
        open={!!viewWinners}
        onClose={() => setViewWinners(null)}
        title={`${t('competitions.winners.title')} — ${viewWinners ? localTitle(viewWinners) : ''}`}
        className="max-w-2xl"
      >
        <div className="p-4">
          {competitionWinners.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <IconMedal className="h-12 w-12 text-neutral-200" />
              <p className="mt-2 text-sm text-neutral-500">{t('competitions.noWinners')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {competitionWinners.sort((a, b) => a.rank - b.rank).map((w) => {
                const medal = MEDAL_COLORS[w.rank];
                return (
                  <div key={w.id} className={`flex items-center gap-3 rounded-lg p-3 ${medal?.bg ?? 'bg-neutral-50'} ${medal ? `border ${medal.border}` : 'border border-neutral-200'}`}>
                    <div className="text-2xl">{medal?.emoji ?? `#${w.rank}`}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-neutral-900">{w.participantName}</div>
                      <div className="text-xs text-neutral-500">{w.participantDepartment} · {w.participantEmail}</div>
                    </div>
                    {w.score != null && <div className="text-sm font-bold text-brand-600">{w.score}</div>}
                    {w.prize && <div className="text-xs text-amber-600 font-medium max-w-32 truncate">{w.prize}</div>}
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-4 flex justify-end gap-2">
            {canManage && viewWinners && (
              <Button variant="ghost" onClick={() => { setViewWinners(null); setShowAddWinner(viewWinners); }}>
                <IconPlus className="h-4 w-4 me-1" />
                {t('competitions.addWinner')}
              </Button>
            )}
            <Button onClick={() => setViewWinners(null)}>{t('actions.close')}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Podium Card Component                                              */
/* ------------------------------------------------------------------ */
function PodiumCard({ entry, position, isAr: _isAr, t }: { entry: LeaderboardEntry; position: 1 | 2 | 3; isAr: boolean; t: (k: string) => string }) {
  const configs: Record<number, { height: string; bg: string; crown: string; size: string }> = {
    1: { height: 'h-40 sm:h-48', bg: 'from-amber-400 to-amber-500', crown: '👑', size: 'w-28 sm:w-36' },
    2: { height: 'h-32 sm:h-40', bg: 'from-neutral-300 to-neutral-400', crown: '', size: 'w-24 sm:w-32' },
    3: { height: 'h-28 sm:h-32', bg: 'from-orange-300 to-orange-400', crown: '', size: 'w-24 sm:w-32' },
  };
  const cfg = configs[position];
  const medal = MEDAL_COLORS[position];

  return (
    <div className={`flex flex-col items-center ${cfg.size}`}>
      {/* Crown for 1st */}
      {cfg.crown && <div className="text-3xl mb-1 animate-bounce">{cfg.crown}</div>}

      {/* Avatar */}
      <div className={`relative mb-2 flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-gradient-to-br ${cfg.bg} text-white text-lg font-bold shadow-lg ${position === 1 ? 'ring-4 ring-amber-200' : ''}`}>
        {entry.participantName.charAt(0)}
        <div className={`absolute -bottom-1 -end-1 flex h-6 w-6 items-center justify-center rounded-full text-sm ${medal?.bg ?? ''} border-2 border-white`}>
          {medal?.emoji}
        </div>
      </div>

      {/* Name */}
      <div className="text-xs sm:text-sm font-bold text-neutral-900 text-center line-clamp-1 w-full">{entry.participantName}</div>
      <div className="text-[10px] text-neutral-500 text-center line-clamp-1 w-full">{entry.department}</div>

      {/* Score */}
      <div className="mt-1 text-sm sm:text-base font-extrabold text-brand-600">{entry.totalScore}</div>
      <div className="text-[10px] text-neutral-400">{t('competitions.leaderboard.score')}</div>

      {/* Medals */}
      <div className="mt-1 flex gap-1 text-xs">
        {entry.goldMedals > 0 && <span>🥇{entry.goldMedals}</span>}
        {entry.silverMedals > 0 && <span>🥈{entry.silverMedals}</span>}
        {entry.bronzeMedals > 0 && <span>🥉{entry.bronzeMedals}</span>}
      </div>

      {/* Podium block */}
      <div className={`mt-2 w-full rounded-t-lg bg-gradient-to-b ${cfg.bg} ${cfg.height} flex items-center justify-center shadow-inner`}>
        <span className="text-3xl sm:text-4xl font-extrabold text-white/80">{position}</span>
      </div>
    </div>
  );
}
