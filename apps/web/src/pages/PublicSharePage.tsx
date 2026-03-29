import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardBody, Badge, Button, Skeleton } from '../components/ui';
import {
  IconMeetings, IconCommittees, IconClock, IconMapPin,
  IconVideo, IconUser, IconCheckCircle, IconBuilding, IconNavigation,
} from '../components/icons';
import { LocationMap } from '../components/LocationMap';

type PublicShareResponse = {
  entityType: string;
  token: string;
  entityData: Record<string, any>;
};

/* ───── Loading skeleton ───── */
function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-3/4" />
      <Skeleton className="h-5 w-1/2" />
      <Skeleton className="h-40 w-full rounded-xl" />
      <Skeleton className="h-24 w-full rounded-xl" />
    </div>
  );
}

/* ───── Meeting view ───── */
function MeetingView({ data, isAr, t }: { data: Record<string, any>; isAr: boolean; t: (k: string) => string }) {
  const dateFmt = new Intl.DateTimeFormat(isAr ? 'ar-SA' : 'en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  return (
    <div className="space-y-4">
      <div>
        <Badge variant="info" className="mb-3">{t('share.publicPage.meeting')}</Badge>
        <h1 className="text-2xl font-bold text-neutral-900">{isAr ? data.titleAr : data.titleEn}</h1>
        <p className="mt-1 text-sm text-neutral-500">{isAr ? data.titleEn : data.titleAr}</p>
      </div>

      {(data.descriptionAr || data.descriptionEn) && (
        <p className="text-sm text-neutral-700">{isAr ? data.descriptionAr : data.descriptionEn}</p>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex items-center gap-2 rounded-lg bg-neutral-50 p-3">
          <IconClock className="h-5 w-5 text-brand-600" />
          <div>
            <p className="text-xs text-neutral-500">{t('share.publicPage.dateTime')}</p>
            <p className="text-sm font-medium text-neutral-900">{dateFmt.format(new Date(data.startDateTimeUtc))}</p>
          </div>
        </div>

        {data.location && (
          <div className="flex items-center gap-2 rounded-lg bg-neutral-50 p-3">
            <IconMapPin className="h-5 w-5 text-brand-600" />
            <div>
              <p className="text-xs text-neutral-500">{t('share.publicPage.location')}</p>
              <p className="text-sm font-medium text-neutral-900">{data.location}</p>
            </div>
          </div>
        )}

        {(data.committeeNameAr || data.committeeNameEn) && (
          <div className="flex items-center gap-2 rounded-lg bg-neutral-50 p-3">
            <IconCommittees className="h-5 w-5 text-brand-600" />
            <div>
              <p className="text-xs text-neutral-500">{t('share.publicPage.committee')}</p>
              <p className="text-sm font-medium text-neutral-900">{isAr ? data.committeeNameAr : data.committeeNameEn}</p>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 rounded-lg bg-neutral-50 p-3">
          <IconMeetings className="h-5 w-5 text-brand-600" />
          <div>
            <p className="text-xs text-neutral-500">{t('share.publicPage.status')}</p>
            <Badge variant={data.status === 'Scheduled' ? 'info' : data.status === 'Completed' ? 'success' : 'default'}>
              {data.status}
            </Badge>
          </div>
        </div>
      </div>

      {data.onlineJoinUrl && (
        <a href={data.onlineJoinUrl} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-xl border-2 border-green-300 bg-gradient-to-r from-green-50 to-emerald-50 p-4 text-sm font-semibold text-green-800 transition-all hover:border-green-400 hover:shadow-md">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-600 text-white">
            <IconVideo className="h-5 w-5" />
          </div>
          {t('share.publicPage.joinOnline')}
        </a>
      )}

      {data.agenda?.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold text-neutral-700">{t('share.publicPage.agenda')}</h2>
          <div className="space-y-2">
            {(data.agenda as any[]).map((item: any, idx: number) => (
              <div key={idx} className="flex items-start gap-3 rounded-lg border border-neutral-200 p-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-700">
                  {item.order ?? idx + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-neutral-900">{isAr ? item.titleAr : item.titleEn}</p>
                  {item.presenterName && (
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-neutral-400">
                      <IconUser className="h-3 w-3" />{item.presenterName}
                    </p>
                  )}
                </div>
                {item.durationMinutes && (
                  <span className="shrink-0 text-xs text-neutral-400">{item.durationMinutes} min</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ───── Committee view ───── */
function CommitteeView({ data, isAr, t }: { data: Record<string, any>; isAr: boolean; t: (k: string) => string }) {
  return (
    <div className="space-y-4">
      <div>
        <Badge variant="brand" className="mb-3">{t('share.publicPage.committee')}</Badge>
        <h1 className="text-2xl font-bold text-neutral-900">{isAr ? data.nameAr : data.nameEn}</h1>
        <p className="mt-1 text-sm text-neutral-500">{isAr ? data.nameEn : data.nameAr}</p>
      </div>

      {(data.descriptionAr || data.descriptionEn) && (
        <p className="text-sm text-neutral-700">{isAr ? data.descriptionAr : data.descriptionEn}</p>
      )}

      <div className="flex flex-wrap gap-2">
        <Badge variant="info">{data.type}</Badge>
        <Badge variant={data.status === 'Active' ? 'success' : 'default'}>{data.status}</Badge>
      </div>

      {(data.objectivesAr || data.objectivesEn) && (
        <Card>
          <CardBody>
            <h2 className="mb-2 text-sm font-semibold text-neutral-700">{t('share.publicPage.objectives')}</h2>
            <p className="text-sm text-neutral-600">{isAr ? data.objectivesAr : data.objectivesEn}</p>
          </CardBody>
        </Card>
      )}

      {data.members?.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold text-neutral-700">
            {t('share.publicPage.members')} ({(data.members as any[]).length})
          </h2>
          <div className="space-y-2">
            {(data.members as any[]).map((m: any, idx: number) => (
              <div key={idx} className="flex items-center gap-3 rounded-lg bg-neutral-50 p-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-brand-600">
                  <IconUser className="h-4 w-4" />
                </div>
                <span className="flex-1 text-sm font-medium text-neutral-900">{m.displayName}</span>
                <Badge variant={m.role === 'head' ? 'warning' : m.role === 'secretary' ? 'info' : 'default'}>
                  {m.role}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ───── Directive view ───── */
function DirectiveView({ data, isAr, t }: { data: Record<string, any>; isAr: boolean; t: (k: string) => string }) {
  return (
    <div className="space-y-4">
      <div>
        <Badge variant="warning" className="mb-3">{t('share.publicPage.directive')}</Badge>
        <h1 className="text-2xl font-bold text-neutral-900">{isAr ? data.titleAr : data.titleEn}</h1>
        <p className="mt-1 text-sm text-neutral-500">{isAr ? data.titleEn : data.titleAr}</p>
      </div>

      {(data.descriptionAr || data.descriptionEn) && (
        <p className="text-sm text-neutral-700">{isAr ? data.descriptionAr : data.descriptionEn}</p>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {data.issuedBy && (
          <div className="rounded-lg bg-neutral-50 p-3">
            <p className="text-xs text-neutral-500">{t('share.publicPage.issuedBy')}</p>
            <p className="text-sm font-medium text-neutral-900">{data.issuedBy}</p>
          </div>
        )}
        {data.referenceNumber && (
          <div className="rounded-lg bg-neutral-50 p-3">
            <p className="text-xs text-neutral-500">{t('share.publicPage.refNumber')}</p>
            <p className="text-sm font-medium text-neutral-900">{data.referenceNumber}</p>
          </div>
        )}
      </div>

      {data.decisions?.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold text-neutral-700">{t('share.publicPage.decisions')}</h2>
          <div className="space-y-2">
            {(data.decisions as any[]).map((d: any, idx: number) => (
              <div key={idx} className="rounded-lg border border-neutral-200 p-3">
                <div className="flex items-center gap-2">
                  <IconCheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium text-neutral-900">{isAr ? d.titleAr : d.titleEn}</span>
                  <Badge variant="default" className="ms-auto">{d.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ───── MOM view ───── */
function MomView({ data, isAr, t }: { data: Record<string, any>; isAr: boolean; t: (k: string) => string }) {
  return (
    <div className="space-y-4">
      <div>
        <Badge variant="success" className="mb-3">{t('share.publicPage.minutes')}</Badge>
        <h1 className="text-2xl font-bold text-neutral-900">
          {isAr ? data.meetingTitleAr : data.meetingTitleEn}
        </h1>
        {data.meetingDate && (
          <p className="mt-1 text-sm text-neutral-500">
            {new Intl.DateTimeFormat(isAr ? 'ar-SA' : 'en-US', {
              year: 'numeric', month: 'long', day: 'numeric',
            }).format(new Date(data.meetingDate))}
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge variant={data.status === 'Approved' ? 'success' : data.status === 'PendingApproval' ? 'warning' : 'default'}>
          {data.status}
        </Badge>
      </div>

      {data.pdfDocUrl && (
        <a href={data.pdfDocUrl} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-lg border border-brand-200 bg-brand-50 p-3 text-sm font-medium text-brand-700 hover:bg-brand-100 transition-colors">
          PDF
        </a>
      )}

      {data.decisions?.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold text-neutral-700">{t('share.publicPage.decisions')}</h2>
          <div className="space-y-2">
            {(data.decisions as any[]).map((d: any, idx: number) => (
              <div key={idx} className="flex items-center gap-2 rounded-lg border border-neutral-200 p-3">
                <IconCheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm text-neutral-900">{isAr ? d.titleAr : d.titleEn}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.recommendations?.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold text-neutral-700">{t('share.publicPage.recommendations')}</h2>
          <div className="space-y-2">
            {(data.recommendations as any[]).map((r: any, idx: number) => (
              <div key={idx} className="rounded-lg border border-neutral-200 p-3">
                <p className="text-sm font-medium text-neutral-900">{isAr ? r.titleAr : r.titleEn}</p>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  <Badge variant="default">{r.status}</Badge>
                  <Badge variant={r.priority === 'High' ? 'danger' : r.priority === 'Medium' ? 'warning' : 'info'}>
                    {r.priority}
                  </Badge>
                  {r.progress > 0 && <Badge variant="success">{r.progress}%</Badge>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ───── Location view ───── */
function LocationView({ data, isAr, t }: { data: Record<string, any>; isAr: boolean; t: (k: string) => string }) {
  const hasCoords = data.latitude != null && data.longitude != null;
  const directionsUrl = hasCoords
    ? `https://www.google.com/maps/dir/?api=1&destination=${data.latitude},${data.longitude}`
    : null;

  return (
    <div className="space-y-4">
      <div>
        <Badge variant="brand" className="mb-3">{t('share.publicPage.location')}</Badge>
        <h1 className="text-2xl font-bold text-neutral-900">{isAr ? data.nameAr : data.nameEn}</h1>
        <p className="mt-1 text-sm text-neutral-500">{isAr ? data.nameEn : data.nameAr}</p>
      </div>

      {(data.descriptionAr || data.descriptionEn) && (
        <p className="text-sm text-neutral-700">{isAr ? data.descriptionAr : data.descriptionEn}</p>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex items-center gap-2 rounded-lg bg-neutral-50 p-3">
          <IconMapPin className="h-5 w-5 text-brand-600" />
          <div>
            <p className="text-xs text-neutral-500">{t('locations.type')}</p>
            <p className="text-sm font-medium text-neutral-900">{t(`locations.types.${data.type}` as any)}</p>
          </div>
        </div>

        {(data.building || data.floor || data.roomNumber) && (
          <div className="flex items-center gap-2 rounded-lg bg-neutral-50 p-3">
            <IconBuilding className="h-5 w-5 text-brand-600" />
            <div>
              <p className="text-xs text-neutral-500">{t('locations.building')}</p>
              <p className="text-sm font-medium text-neutral-900">
                {[data.building, data.floor ? `${t('locations.floor')} ${data.floor}` : null, data.roomNumber].filter(Boolean).join(' — ')}
              </p>
            </div>
          </div>
        )}
      </div>

      {(data.parentLocationNameAr || data.parentLocationNameEn) && (
        <div className="flex items-center gap-2 rounded-lg bg-blue-50 p-3">
          <IconBuilding className="h-5 w-5 text-blue-600" />
          <div>
            <p className="text-xs text-blue-500">{t('locations.parentLocation')}</p>
            <p className="text-sm font-medium text-blue-900">{isAr ? data.parentLocationNameAr : data.parentLocationNameEn}</p>
          </div>
        </div>
      )}

      {/* Embedded map */}
      {hasCoords && (
        <div className="overflow-hidden rounded-xl border border-neutral-200">
          <LocationMap
            locations={[{
              id: 'target',
              nameAr: data.nameAr,
              nameEn: data.nameEn,
              type: t(`locations.types.${data.type}` as any),
              latitude: data.latitude,
              longitude: data.longitude,
            }]}
            center={[data.latitude, data.longitude]}
            zoom={17}
            isAr={isAr}
            className="h-[300px] w-full"
          />
        </div>
      )}

      {/* Get Directions CTA */}
      {directionsUrl && (
        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-3 rounded-xl border-2 border-brand-300 bg-gradient-to-r from-brand-50 to-blue-50 p-4 text-sm font-semibold text-brand-800 transition-all hover:border-brand-400 hover:shadow-md"
        >
          <IconNavigation className="h-5 w-5" />
          {t('locations.getDirections')}
        </a>
      )}
    </div>
  );
}

/* ───── Attendance Check-in View ───── */

function AttendanceView({ data, isAr, t, token }: { data: Record<string, any>; isAr: boolean; t: (k: string) => string; token: string }) {
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<Record<string, any> | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleCheckIn() {
    if (!email.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const base = import.meta.env.VITE_API_BASE_URL || '';
      const res = await fetch(`${base}/api/v1/public/share/${token}/check-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), displayName: displayName.trim() || undefined }),
      });
      if (!res.ok) throw new Error('Check-in failed');
      setResult(await res.json());
    } catch {
      setError(t('attendance.checkInFailed'));
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
          <IconCheckCircle className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-neutral-900">{t('attendance.checkedIn')}</h2>
        <p className="text-sm text-neutral-500">{isAr ? result.meetingTitleAr : result.meetingTitleEn}</p>
        {result.alreadyCheckedIn && (
          <p className="text-xs text-amber-600">{t('attendance.alreadyCheckedIn')}</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        <Badge variant="success" className="mb-3">{t('attendance.checkIn')}</Badge>
        <h1 className="text-xl font-bold text-neutral-900">{isAr ? data.titleAr : data.titleEn}</h1>
        {(data.committeeNameAr || data.committeeNameEn) && (
          <p className="mt-1 text-sm text-neutral-500">{isAr ? data.committeeNameAr : data.committeeNameEn}</p>
        )}
        {data.startDateTimeUtc && (
          <p className="mt-1 text-xs text-neutral-400">
            <IconClock className="inline h-3 w-3 me-1" />
            {new Date(data.startDateTimeUtc).toLocaleString(isAr ? 'ar-SA' : 'en-US', {
              dateStyle: 'medium', timeStyle: 'short',
            })}
          </p>
        )}
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">{t('attendance.email')} *</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            dir="ltr"
            placeholder="email@example.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">{t('attendance.name')}</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          onClick={() => void handleCheckIn()}
          disabled={submitting || !email.trim()}
          className="w-full rounded-lg bg-brand-600 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50 transition-colors"
        >
          {submitting ? '...' : t('attendance.submit')}
        </button>
      </div>
    </div>
  );
}

/* ═════ Main Page ═════ */

export function PublicSharePage() {
  const { token } = useParams<{ token: string }>();
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [data, setData] = useState<PublicShareResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const toggleLang = () => {
    void i18n.changeLanguage(isAr ? 'en' : 'ar');
  };

  useEffect(() => {
    void (async () => {
      try {
        const base = import.meta.env.VITE_API_BASE_URL || '';
        const res = await fetch(`${base}/api/v1/public/share/${token}`);
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          if (body.code === 'SHARE_LINK_EXPIRED') {
            setError(t('share.expired'));
          } else {
            setError(t('share.notFound'));
          }
          return;
        }
        setData(await res.json());
      } catch {
        setError(t('share.notFound'));
      } finally {
        setLoading(false);
      }
    })();
  }, [token, t]);

  const renderEntity = () => {
    if (!data) return null;
    const { entityType, entityData } = data;

    switch (entityType) {
      case 'Meeting': return <MeetingView data={entityData} isAr={isAr} t={t} />;
      case 'Committee': return <CommitteeView data={entityData} isAr={isAr} t={t} />;
      case 'Directive': return <DirectiveView data={entityData} isAr={isAr} t={t} />;
      case 'Mom': return <MomView data={entityData} isAr={isAr} t={t} />;
      case 'Location': return <LocationView data={entityData} isAr={isAr} t={t} />;
      case 'Attendance': return <AttendanceView data={entityData} isAr={isAr} t={t} token={data.token} />;
      default: return <p className="text-neutral-500">{t('share.notFound')}</p>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50 to-neutral-100" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header */}
      <header className="border-b border-neutral-200 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white text-xs font-bold">M</div>
            <span className="text-sm font-semibold text-neutral-900">{t('share.publicPage.poweredBy')}</span>
          </div>
          <Button variant="outline" size="sm" onClick={toggleLang}>
            {isAr ? 'EN' : 'عربي'}
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-2xl px-4 py-8">
        <Card>
          <CardBody className="p-6">
            {loading && <LoadingSkeleton />}
            {error && (
              <div className="flex flex-col items-center py-12 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-400">
                  <IconMeetings className="h-8 w-8" />
                </div>
                <p className="mt-4 text-sm font-medium text-neutral-900">{error}</p>
              </div>
            )}
            {!loading && !error && renderEntity()}
          </CardBody>
        </Card>
      </main>
    </div>
  );
}
