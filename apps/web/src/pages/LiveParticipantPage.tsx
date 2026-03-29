import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { useLiveSurvey } from '../hooks/useLiveSurvey';
import { IconCheckCircle, IconClock } from '../components/icons';

function parseOptions(json: string | null | undefined): string[] {
  if (!json) return [];
  try { return JSON.parse(json); } catch { return []; }
}

export function LiveParticipantPage() {
  const { joinCode } = useParams<{ joinCode: string }>();
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const { state, connected, submitVote, votedQuestions } = useLiveSurvey('participant', { joinCode });

  // Determine current question from participant state
  const currentQ = state?.currentQuestion ?? null;
  const questionId = currentQ?.id ?? '';
  const options = parseOptions(currentQ?.optionsJson);
  const hasVoted = votedQuestions.has(questionId);

  const isCompleted = state?.status === 'Completed';
  const isWaiting = !state || state.status === 'Created' || state.currentQuestionIndex < 0;
  const isPaused = state?.acceptingVotes === false && !isCompleted && !isWaiting;

  return (
    <div className="flex min-h-screen flex-col bg-neutral-50" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="bg-brand-700 px-4 py-3 text-white">
        <div className="flex items-center justify-between">
          <h1 className="text-sm font-bold">{t('liveSurvey.liveSession')}</h1>
          <div className="flex items-center gap-2">
            {joinCode && <span className="font-mono text-xs tracking-wider opacity-70">{joinCode}</span>}
            <span className={`h-2 w-2 rounded-full ${connected ? 'bg-green-400' : 'bg-red-400'}`} />
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center p-4">
        {/* Loading */}
        {!state && (
          <div className="text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
            <p className="mt-4 text-sm text-neutral-500">{t('common.loading')}</p>
          </div>
        )}

        {/* Session ended */}
        {isCompleted && (
          <div className="w-full max-w-sm text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
              <IconCheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="mt-4 text-xl font-bold text-neutral-900">{t('liveSurvey.thankYou')}</h2>
            <p className="mt-2 text-sm text-neutral-500">{t('liveSurvey.sessionEnded')}</p>
          </div>
        )}

        {/* Waiting for session to start */}
        {!isCompleted && isWaiting && state && (
          <div className="w-full max-w-sm text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-brand-100">
              <IconClock className="h-10 w-10 text-brand-600 animate-pulse" />
            </div>
            <h2 className="mt-4 text-lg font-bold text-neutral-900">{t('liveSurvey.waitingForSession')}</h2>
            <p className="mt-2 text-sm text-neutral-500">{t('liveSurvey.waitingForQuestion')}</p>
          </div>
        )}

        {/* Voting paused */}
        {isPaused && !hasVoted && (
          <div className="w-full max-w-sm text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
              <IconClock className="h-8 w-8 text-amber-600" />
            </div>
            <h2 className="mt-4 text-lg font-bold text-neutral-900">{t('liveSurvey.votingPaused')}</h2>
          </div>
        )}

        {/* Active question — show vote options */}
        {!isCompleted && !isWaiting && currentQ && !hasVoted && state?.acceptingVotes && (
          <div className="w-full max-w-sm">
            <h2 className="mb-1 text-lg font-bold text-neutral-900">
              {isAr ? currentQ.textAr : currentQ.textEn}
            </h2>
            {(isAr ? currentQ.textEn : currentQ.textAr) && (
              <p className="mb-4 text-sm text-neutral-500">{isAr ? currentQ.textEn : currentQ.textAr}</p>
            )}
            <div className="space-y-3">
              {options.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => submitVote(questionId, JSON.stringify(opt))}
                  className="flex w-full items-center justify-center rounded-xl border-2 border-neutral-200 bg-neutral-0 px-4 py-4 text-base font-medium text-neutral-900 shadow-sm transition-all active:scale-95 hover:border-brand-500 hover:bg-brand-50 min-h-[48px]"
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Vote recorded */}
        {!isCompleted && hasVoted && (
          <div className="w-full max-w-sm text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
              <IconCheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="mt-4 text-lg font-bold text-neutral-900">{t('liveSurvey.voteRecorded')}</h2>
            <p className="mt-2 text-sm text-neutral-500">{t('liveSurvey.waitingForQuestion')}</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-neutral-200 bg-neutral-0 px-4 py-3 text-center">
        <p className="text-xs text-neutral-400">{t('appName')}</p>
      </div>
    </div>
  );
}
