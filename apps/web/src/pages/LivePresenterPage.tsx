import { useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { QRCodeSVG } from 'qrcode.react';

import { useLiveSurvey } from '../hooks/useLiveSurvey';
import { Badge, Button, Card, CardBody } from '../components/ui';
import { IconUser, IconCheckCircle } from '../components/icons';

function parseOptions(json: string | null | undefined): string[] {
  if (!json) return [];
  try { return JSON.parse(json); } catch { return []; }
}

export function LivePresenterPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [searchParams] = useSearchParams();
  const presenterKey = searchParams.get('key') ?? '';
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const { state, tallies, connected, nextQuestion, previousQuestion, toggleVoting, endSession } =
    useLiveSurvey('presenter', { sessionId, presenterKey });

  if (!state) {
    return (
      <div className="flex h-screen items-center justify-center bg-neutral-950 text-white">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
          <p className="mt-4 text-sm text-neutral-400">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  const questions = state.questions ?? [];
  const currentQ = questions[state.currentQuestionIndex] ?? null;
  const options = parseOptions(currentQ?.optionsJson);
  const currentTallies = currentQ ? (tallies[currentQ.id] ?? {}) : {};
  const totalVotes = Object.values(currentTallies).reduce((s, v) => s + v, 0);

  const joinUrl = `${window.location.origin}/public/live/${state.joinCode}`;

  const isCompleted = state.status === 'Completed';

  return (
    <div className="min-h-screen bg-neutral-950 text-white" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-800 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600">
            <IconCheckCircle className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold">{t('liveSurvey.liveSession')}</h1>
            <p className="text-xs text-neutral-400">{state.joinCode}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 rounded-full bg-neutral-800 px-3 py-1.5">
            <IconUser className="h-4 w-4 text-brand-400" />
            <span className="text-sm font-semibold">{state.participantCount}</span>
            <span className="text-xs text-neutral-400">{t('liveSurvey.participantCount')}</span>
          </div>
          <Badge variant={connected ? 'success' : 'danger'} className="text-xs">
            {connected ? 'Connected' : 'Disconnected'}
          </Badge>
          {isCompleted && <Badge variant="info">{t('liveSurvey.sessionEnded')}</Badge>}
        </div>
      </div>

      <div className="flex flex-1 gap-6 p-6">
        {/* Main content — question & results */}
        <div className="flex-1">
          {isCompleted ? (
            <Card className="bg-neutral-900 border-neutral-800">
              <CardBody className="flex flex-col items-center py-16 text-center">
                <IconCheckCircle className="h-16 w-16 text-green-500" />
                <h2 className="mt-4 text-xl font-bold">{t('liveSurvey.sessionEnded')}</h2>
                <p className="mt-2 text-neutral-400">{t('liveSurvey.thankYou')}</p>
              </CardBody>
            </Card>
          ) : !currentQ ? (
            <Card className="bg-neutral-900 border-neutral-800">
              <CardBody className="flex flex-col items-center py-16 text-center">
                <h2 className="text-xl font-bold">{t('liveSurvey.waitingForQuestion')}</h2>
                <p className="mt-2 text-neutral-400">{t('liveSurvey.pressNextToStart')}</p>
              </CardBody>
            </Card>
          ) : (
            <>
              {/* Question header */}
              <div className="mb-6">
                <div className="flex items-center gap-2 text-xs text-neutral-400">
                  <span>{t('liveSurvey.questionOf', { current: state.currentQuestionIndex + 1, total: questions.length })}</span>
                  {state.acceptingVotes ? (
                    <Badge variant="success" className="text-[10px]">{t('liveSurvey.acceptingVotes')}</Badge>
                  ) : (
                    <Badge variant="warning" className="text-[10px]">{t('liveSurvey.votingPaused')}</Badge>
                  )}
                </div>
                <h2 className="mt-2 text-2xl font-bold">{isAr ? currentQ.textAr : currentQ.textEn}</h2>
                {(isAr ? currentQ.textEn : currentQ.textAr) && (
                  <p className="mt-1 text-sm text-neutral-400">{isAr ? currentQ.textEn : currentQ.textAr}</p>
                )}
              </div>

              {/* Live bar chart */}
              <div className="space-y-3">
                {options.map((opt) => {
                  const count = currentTallies[opt] ?? 0;
                  const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
                  return (
                    <div key={opt}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="font-medium">{opt}</span>
                        <span className="text-neutral-400">{count} ({pct}%)</span>
                      </div>
                      <div className="h-8 w-full overflow-hidden rounded-lg bg-neutral-800">
                        <div
                          className="h-full rounded-lg bg-gradient-to-r from-brand-600 to-brand-400 transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="mt-4 text-center text-sm text-neutral-500">
                {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}
              </p>
            </>
          )}

          {/* Controls */}
          {!isCompleted && (
            <div className="mt-8 flex items-center justify-center gap-3">
              <Button variant="outline" onClick={previousQuestion} disabled={state.currentQuestionIndex <= 0}>
                {t('liveSurvey.prevQuestion')}
              </Button>
              <Button variant={state.acceptingVotes ? 'outline' : 'ghost'} onClick={toggleVoting}>
                {state.acceptingVotes ? t('liveSurvey.pauseVoting') : t('liveSurvey.resumeVoting')}
              </Button>
              <Button onClick={nextQuestion} disabled={state.currentQuestionIndex >= questions.length - 1}>
                {t('liveSurvey.nextQuestion')}
              </Button>
              <Button variant="ghost" className="text-red-400 hover:text-red-300" onClick={endSession}>
                {t('liveSurvey.endSession')}
              </Button>
            </div>
          )}
        </div>

        {/* QR code sidebar */}
        <div className="w-64 shrink-0">
          <Card className="bg-neutral-900 border-neutral-800">
            <CardBody className="flex flex-col items-center">
              <div className="rounded-xl bg-neutral-0 p-3">
                <QRCodeSVG value={joinUrl} size={200} level="M" />
              </div>
              <p className="mt-3 text-center text-xs text-neutral-400">{t('liveSurvey.scanToVote')}</p>
              <p className="mt-1 font-mono text-lg font-bold tracking-widest text-brand-400">{state.joinCode}</p>
              <p className="mt-2 break-all text-center text-[10px] text-neutral-500" dir="ltr">{joinUrl}</p>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
