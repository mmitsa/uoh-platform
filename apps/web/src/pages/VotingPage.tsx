import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useApi } from '../hooks/useApi';
import { useAuth } from '../app/auth';
import { Card, CardBody, Badge, Button, Modal, Input, useToast } from '../components/ui';
import { IconVoting, IconPlus, IconCheckCircle, IconTrash } from '../components/icons';

type VoteOption = { id?: string; text: string; voteCount?: number };
type VoteItem = {
  id: string;
  meetingId: string;
  title: string;
  status: string;
  options?: VoteOption[];
};

const STATUS_VARIANT: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
  draft: 'default',
  open: 'success',
  closed: 'info',
};

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-neutral-50 text-neutral-600',
  open: 'bg-green-50 text-green-600',
  closed: 'bg-blue-50 text-blue-600',
};

export function VotingPage() {
  const { get, post } = useApi();
  const { t } = useTranslation();
  const toast = useToast();
  const { hasRole } = useAuth();
  const [meetingId, setMeetingId] = useState('');
  const [items, setItems] = useState<VoteItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Create modal
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [voteTitle, setVoteTitle] = useState('');
  const [voteOptions, setVoteOptions] = useState<string[]>(['', '']);

  // Cast vote modal
  const [castingItem, setCastingItem] = useState<VoteItem | null>(null);
  const [selectedOption, setSelectedOption] = useState('');
  const [castingVote, setCastingVote] = useState(false);

  async function load() {
    if (!meetingId.trim()) { setItems([]); return; }
    setLoading(true);
    try { const res = await get<VoteItem[]>(`/api/v1/votes/by-meeting/${meetingId}`); setItems(res); }
    catch { toast.error(t('errors.loadFailed')); }
    finally { setLoading(false); }
  }

  function openCreateModal() {
    setVoteTitle('');
    setVoteOptions(['', '']);
    setShowCreate(true);
  }

  async function create() {
    const opts = voteOptions.filter((o) => o.trim());
    if (!meetingId.trim() || !voteTitle.trim() || opts.length < 2) return;
    setCreating(true);
    try {
      await post('/api/v1/votes', { meetingId, title: voteTitle, options: opts });
      toast.success(t('voting.create') + ' ✓');
      setShowCreate(false);
      await load();
    } catch { toast.error(t('errors.generic')); }
    finally { setCreating(false); }
  }

  async function openVoting(id: string) {
    try { await post(`/api/v1/votes/${id}/open`); toast.success(t('voting.open') + ' ✓'); await load(); }
    catch { toast.error(t('errors.generic')); }
  }

  async function closeVoting(id: string) {
    try { await post(`/api/v1/votes/${id}/close`); toast.success(t('voting.close') + ' ✓'); await load(); }
    catch { toast.error(t('errors.generic')); }
  }

  function openCastModal(item: VoteItem) {
    setSelectedOption('');
    setCastingItem(item);
  }

  async function castVote() {
    if (!castingItem || !selectedOption) return;
    setCastingVote(true);
    try {
      await post(`/api/v1/votes/${castingItem.id}/cast`, { optionId: selectedOption });
      toast.success(t('voting.cast') + ' ✓');
      setCastingItem(null);
      await load();
    } catch { toast.error(t('errors.generic')); }
    finally { setCastingVote(false); }
  }

  useEffect(() => { void load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const openCount = items.filter((v) => v.status === 'open').length;
  const closedCount = items.filter((v) => v.status === 'closed').length;

  function addOption() { setVoteOptions([...voteOptions, '']); }
  function removeOption(idx: number) { setVoteOptions(voteOptions.filter((_, i) => i !== idx)); }
  function updateOption(idx: number, val: string) { setVoteOptions(voteOptions.map((o, i) => (i === idx ? val : o))); }

  const canCreate = voteTitle.trim().length > 0 && voteOptions.filter((o) => o.trim()).length >= 2;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-neutral-900">{t('voting.title')}</h1>
        <p className="mt-1 text-sm text-neutral-500">{t('voting.description')}</p>
      </div>

      {/* Search card */}
      <Card className="border-brand-100 bg-brand-50/30">
        <CardBody>
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1">
              <Input label={t('voting.meetingIdPlaceholder')} value={meetingId} onChange={(e) => setMeetingId(e.target.value)} />
            </div>
            <Button variant="outline" onClick={() => void load()}>{t('actions.load')}</Button>
            {hasRole('CommitteeSecretary') && (
              <Button icon={<IconPlus className="h-4 w-4" />} onClick={openCreateModal} disabled={!meetingId.trim()}>
                {t('voting.create')}
              </Button>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Stats */}
      {items.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <Card><CardBody className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600"><IconVoting className="h-5 w-5" /></div>
            <div><p className="text-2xl font-bold text-neutral-900">{items.length}</p><p className="text-xs text-neutral-500">{t('common.all')}</p></div>
          </CardBody></Card>
          <Card><CardBody className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 text-green-600"><IconCheckCircle className="h-5 w-5" /></div>
            <div><p className="text-2xl font-bold text-neutral-900">{openCount}</p><p className="text-xs text-neutral-500">{t('voting.statuses.open')}</p></div>
          </CardBody></Card>
          <Card><CardBody className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600"><IconVoting className="h-5 w-5" /></div>
            <div><p className="text-2xl font-bold text-neutral-900">{closedCount}</p><p className="text-xs text-neutral-500">{t('voting.statuses.closed')}</p></div>
          </CardBody></Card>
        </div>
      )}

      {/* Vote cards */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}><CardBody className="space-y-2">
              <div className="h-5 w-2/3 animate-pulse rounded bg-neutral-200" />
              <div className="h-4 w-1/3 animate-pulse rounded bg-neutral-100" />
            </CardBody></Card>
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card><CardBody className="flex flex-col items-center py-16">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100 text-neutral-400"><IconVoting className="h-8 w-8" /></div>
          <h3 className="mt-4 text-sm font-semibold text-neutral-900">{t('voting.noData')}</h3>
          <p className="mt-1 text-sm text-neutral-500">{t('voting.noDataDesc')}</p>
        </CardBody></Card>
      ) : (
        <div className="space-y-3">
          {items.map((v) => (
            <Card key={v.id} className="transition-shadow hover:shadow-md">
              <CardBody>
                <div className="flex items-start gap-4">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${STATUS_COLORS[v.status] ?? 'bg-neutral-50 text-neutral-600'}`}>
                    <IconVoting className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-neutral-900">{v.title}</h3>
                        <p className="text-xs text-neutral-400 font-mono">{v.id.slice(0, 8)}</p>
                      </div>
                      <Badge variant={STATUS_VARIANT[v.status] ?? 'default'}>
                        {t(`voting.statuses.${v.status}` as any) ?? v.status}
                      </Badge>
                    </div>

                    {/* Options with vote counts */}
                    {v.options && v.options.length > 0 && (
                      <div className="mt-3 space-y-1.5">
                        {v.options.map((opt, idx) => {
                          const total = v.options!.reduce((sum, o) => sum + (o.voteCount ?? 0), 0);
                          const pct = total > 0 ? Math.round(((opt.voteCount ?? 0) / total) * 100) : 0;
                          return (
                            <div key={opt.id ?? idx} className="flex items-center gap-2 text-sm">
                              <span className="w-24 truncate text-neutral-700">{opt.text}</span>
                              <div className="h-2 flex-1 rounded-full bg-neutral-100">
                                <div className="h-2 rounded-full bg-brand-500 transition-all" style={{ width: `${pct}%` }} />
                              </div>
                              <span className="w-12 text-end text-xs text-neutral-500">{opt.voteCount ?? 0} ({pct}%)</span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {v.status === 'draft' && hasRole('CommitteeSecretary') && (
                        <Button size="sm" onClick={() => void openVoting(v.id)}>{t('voting.open')}</Button>
                      )}
                      {v.status === 'open' && (
                        <>
                          <Button size="sm" onClick={() => openCastModal(v)}>{t('voting.cast')}</Button>
                          {hasRole('CommitteeSecretary') && (
                            <Button size="sm" variant="outline" onClick={() => void closeVoting(v.id)}>{t('voting.close')}</Button>
                          )}
                        </>
                      )}
                      {v.status === 'closed' && (
                        <Button size="sm" variant="ghost">{t('voting.results')}</Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title={t('voting.create')}>
        <div className="grid gap-4">
          <Input
            label={t('voting.voteTitle')}
            value={voteTitle}
            onChange={(e) => setVoteTitle(e.target.value)}
          />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-700">{t('voting.options')}</label>
            <div className="space-y-2">
              {voteOptions.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Input
                    value={opt}
                    onChange={(e) => updateOption(idx, e.target.value)}
                    placeholder={`${t('voting.options')} ${idx + 1}`}
                  />
                  {voteOptions.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(idx)}
                      className="shrink-0 rounded-lg p-2 text-neutral-400 hover:bg-red-50 hover:text-red-500"
                    >
                      <IconTrash className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <Button variant="ghost" size="sm" className="mt-2" icon={<IconPlus className="h-3.5 w-3.5" />} onClick={addOption}>
              {t('voting.addOption')}
            </Button>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowCreate(false)}>{t('actions.cancel')}</Button>
            <Button onClick={() => void create()} disabled={!canCreate} loading={creating}>{t('actions.create')}</Button>
          </div>
        </div>
      </Modal>

      {/* Cast Vote Modal */}
      <Modal open={!!castingItem} onClose={() => setCastingItem(null)} title={t('voting.cast')}>
        {castingItem && (
          <div className="grid gap-4">
            <p className="text-sm font-medium text-neutral-700">{castingItem.title}</p>
            <p className="text-xs text-neutral-500">{t('voting.selectOption')}</p>
            <div className="space-y-2">
              {(castingItem.options ?? []).map((opt, idx) => (
                <button
                  key={opt.id ?? idx}
                  type="button"
                  onClick={() => setSelectedOption(opt.id ?? opt.text)}
                  className={`w-full rounded-lg border p-3 text-start text-sm transition-colors ${
                    selectedOption === (opt.id ?? opt.text)
                      ? 'border-brand-500 bg-brand-50 text-brand-700 ring-1 ring-brand-500'
                      : 'border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                  }`}
                >
                  {opt.text}
                </button>
              ))}
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setCastingItem(null)}>{t('actions.cancel')}</Button>
              <Button onClick={() => void castVote()} disabled={!selectedOption} loading={castingVote}>{t('voting.cast')}</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
