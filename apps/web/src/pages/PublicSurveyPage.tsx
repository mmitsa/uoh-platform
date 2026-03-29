import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';

import { Card, CardBody, Button, Alert } from '../components/ui';
import { IconSurveys, IconCheckCircle } from '../components/icons';

type SurveyPublic = {
  id: string;
  titleAr: string;
  titleEn: string;
  status: string;
  questions: Array<{
    id: string;
    order: number;
    type: string;
    textAr: string;
    textEn: string;
    optionsJson?: string | null;
  }>;
};

export function PublicSurveyPage() {
  const { id } = useParams();
  const { t, i18n } = useTranslation();
  const [survey, setSurvey] = useState<SurveyPublic | null>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const isAr = i18n.language === 'ar';

  useEffect(() => {
    void (async () => {
      setError(null);
      try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/surveys/${id}/public`);
        if (!res.ok) {
          setError(`${t('errors.loadFailed')}: ${res.status}`);
          return;
        }
        const json = (await res.json()) as SurveyPublic;
        setSurvey(json);
      } catch {
        setError(t('errors.network'));
      } finally {
        setLoading(false);
      }
    })();
  }, [id, t]);

  const questions = useMemo(
    () => (survey?.questions ?? []).slice().sort((a, b) => a.order - b.order),
    [survey],
  );

  async function submit() {
    if (!survey) return;
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        answers: questions.map((q) => ({ surveyQuestionId: q.id, value: answers[q.id] ?? null })),
      };
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/surveys/${survey.id}/responses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        setError(`${t('publicSurvey.submitFailed')}: ${res.status}`);
        return;
      }
      setSubmitted(true);
    } catch {
      setError(t('errors.network'));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <Card>
          <CardBody>
            <div className="animate-pulse space-y-4">
              <div className="h-4 w-1/4 rounded bg-neutral-200" />
              <div className="h-6 w-3/4 rounded bg-neutral-200" />
              <div className="h-4 w-1/3 rounded bg-neutral-200" />
              <div className="h-20 rounded bg-neutral-100" />
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <Card>
          <CardBody className="flex flex-col items-center py-12 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/10 text-success">
              <IconCheckCircle className="h-8 w-8" />
            </div>
            <h2 className="text-lg font-semibold text-neutral-900">{t('publicSurvey.submitSuccess')}</h2>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      {/* Brand header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-700 text-white">
          <IconSurveys className="h-5 w-5" />
        </div>
        <div>
          <div className="text-xs font-medium text-neutral-500">{t('university')}</div>
          <div className="text-sm font-semibold text-neutral-900">{t('publicSurvey.subtitle')}</div>
        </div>
      </div>

      <Card>
        <CardBody>
          <h1 className="text-xl font-semibold text-neutral-900">
            {isAr ? survey?.titleAr : survey?.titleEn}
          </h1>

          {error && (
            <Alert variant="danger" className="mt-4">
              {error}
            </Alert>
          )}

          <div className="mt-6 grid gap-5">
            {questions.map((q, idx) => (
              <Question
                key={q.id}
                q={q}
                index={idx + 1}
                value={answers[q.id]}
                onChange={(v) => setAnswers((prev) => ({ ...prev, [q.id]: v }))}
                isAr={isAr}
              />
            ))}
          </div>

          <Button
            className="mt-6 w-full"
            onClick={() => void submit()}
            loading={submitting}
            disabled={!survey}
          >
            {t('actions.submit')}
          </Button>
        </CardBody>
      </Card>
    </div>
  );
}

function Question({
  q,
  index,
  value,
  onChange,
  isAr,
}: {
  q: { id: string; type: string; textAr: string; textEn: string; optionsJson?: string | null };
  index: number;
  value: any;
  onChange: (v: any) => void;
  isAr: boolean;
}) {
  const label = isAr ? q.textAr : q.textEn;
  const options = q.optionsJson ? (JSON.parse(q.optionsJson) as string[]) : [];

  return (
    <div>
      <div className="mb-2 text-sm font-medium text-neutral-900">
        {index}. {label}
      </div>
      {q.type === 'single' && (
        <div className="grid gap-2">
          {options.map((opt) => (
            <label
              key={opt}
              className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-sm transition-colors ${
                value === opt
                  ? 'border-brand-600 bg-brand-50 text-brand-800'
                  : 'border-neutral-200 bg-neutral-0 hover:bg-neutral-50'
              }`}
            >
              <input
                type="radio"
                name={q.id}
                checked={value === opt}
                onChange={() => onChange(opt)}
                className="accent-brand-700"
              />
              <span>{opt}</span>
            </label>
          ))}
        </div>
      )}
      {q.type === 'text' && (
        <textarea
          className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          rows={3}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  );
}
