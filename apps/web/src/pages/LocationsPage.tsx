import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useApi } from '../hooks/useApi';
import { useAuth } from '../app/auth';
import { Card, CardBody, Badge, Button, Input, Select, Modal, useToast } from '../components/ui';
import { IconMapPin, IconPlus, IconTrash, IconPencil, IconQrCode, IconNavigation, IconBuilding, IconSearch } from '../components/icons';
import { LocationMap, type MapLocation } from '../components/LocationMap';
import { QrShareModal } from '../components/QrShareModal';
import type { ShareableEntityType } from '../hooks/useShareLink';

/* ─── types ─── */

type LocationItem = {
  id: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string | null;
  descriptionEn: string | null;
  type: string;
  building: string | null;
  floor: string | null;
  roomNumber: string | null;
  latitude: number | null;
  longitude: number | null;
  mapImageUrl: string | null;
  parentLocationId: string | null;
  isActive: boolean;
};

const LOCATION_TYPES = [
  'Building', 'Hall', 'MeetingRoom', 'Lab', 'Auditorium',
  'Department', 'OutdoorArea', 'Gate', 'Library', 'Cafeteria', 'Parking', 'Other',
] as const;

const TYPE_COLORS: Record<string, string> = {
  Building: 'bg-blue-50 text-blue-700 border-blue-200',
  Hall: 'bg-purple-50 text-purple-700 border-purple-200',
  MeetingRoom: 'bg-brand-50 text-brand-700 border-brand-200',
  Lab: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Auditorium: 'bg-amber-50 text-amber-700 border-amber-200',
  Department: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  OutdoorArea: 'bg-green-50 text-green-700 border-green-200',
  Gate: 'bg-red-50 text-red-700 border-red-200',
  Library: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  Cafeteria: 'bg-orange-50 text-orange-700 border-orange-200',
  Parking: 'bg-gray-50 text-gray-700 border-gray-200',
  Other: 'bg-neutral-50 text-neutral-700 border-neutral-200',
};

export function LocationsPage() {
  const { get, post, patch, del } = useApi();
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const { hasRole } = useAuth();
  const isAr = i18n.language === 'ar';
  const isAdmin = hasRole('SystemAdmin');

  // List state
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'map' | 'list'>('map');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Detail modal
  const [detail, setDetail] = useState<LocationItem | null>(null);

  // Create/Edit modal
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<LocationItem | null>(null);
  const [formBusy, setFormBusy] = useState(false);

  // Form fields
  const [fNameAr, setFNameAr] = useState('');
  const [fNameEn, setFNameEn] = useState('');
  const [fDescAr, setFDescAr] = useState('');
  const [fDescEn, setFDescEn] = useState('');
  const [fType, setFType] = useState<string>('Building');
  const [fBuilding, setFBuilding] = useState('');
  const [fFloor, setFFloor] = useState('');
  const [fRoom, setFRoom] = useState('');
  const [fLat, setFLat] = useState('');
  const [fLng, setFLng] = useState('');
  const [fMapImage, setFMapImage] = useState('');
  const [fParentId, setFParentId] = useState('');

  // QR share
  const [shareTarget, setShareTarget] = useState<{ type: ShareableEntityType; id: string; title: string } | null>(null);

  /* ─── Load locations ─── */
  useEffect(() => {
    void loadLocations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadLocations() {
    setLoading(true);
    try {
      const res = await get<LocationItem[]>('/api/v1/locations');
      setLocations(res);
    } catch { /* ignore */ }
    setLoading(false);
  }

  /* ─── Filter ─── */
  const filtered = locations.filter((loc) => {
    if (typeFilter && loc.type !== typeFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return loc.nameAr.toLowerCase().includes(q)
        || loc.nameEn.toLowerCase().includes(q)
        || (loc.building ?? '').toLowerCase().includes(q);
    }
    return true;
  });

  /* ─── Open form ─── */
  function openCreate() {
    setEditItem(null);
    setFNameAr(''); setFNameEn(''); setFDescAr(''); setFDescEn('');
    setFType('Building'); setFBuilding(''); setFFloor(''); setFRoom('');
    setFLat(''); setFLng(''); setFMapImage(''); setFParentId('');
    setShowForm(true);
  }

  function openEdit(loc: LocationItem) {
    setEditItem(loc);
    setFNameAr(loc.nameAr); setFNameEn(loc.nameEn);
    setFDescAr(loc.descriptionAr ?? ''); setFDescEn(loc.descriptionEn ?? '');
    setFType(loc.type); setFBuilding(loc.building ?? ''); setFFloor(loc.floor ?? '');
    setFRoom(loc.roomNumber ?? '');
    setFLat(loc.latitude != null ? String(loc.latitude) : '');
    setFLng(loc.longitude != null ? String(loc.longitude) : '');
    setFMapImage(loc.mapImageUrl ?? '');
    setFParentId(loc.parentLocationId ?? '');
    setShowForm(true);
  }

  /* ─── Save ─── */
  async function handleSave() {
    if (!fNameAr.trim() || !fNameEn.trim()) return;
    setFormBusy(true);
    try {
      const payload = {
        nameAr: fNameAr.trim(),
        nameEn: fNameEn.trim(),
        descriptionAr: fDescAr.trim() || null,
        descriptionEn: fDescEn.trim() || null,
        type: fType,
        building: fBuilding.trim() || null,
        floor: fFloor.trim() || null,
        roomNumber: fRoom.trim() || null,
        latitude: fLat ? parseFloat(fLat) : null,
        longitude: fLng ? parseFloat(fLng) : null,
        mapImageUrl: fMapImage.trim() || null,
        parentLocationId: fParentId || null,
      };

      if (editItem) {
        await patch(`/api/v1/locations/${editItem.id}`, payload);
        toast.success(t('actions.saved'));
      } else {
        await post('/api/v1/locations', payload);
        toast.success(t('actions.saved'));
      }
      setShowForm(false);
      void loadLocations();
    } catch { toast.error(t('errors.generic')); }
    setFormBusy(false);
  }

  /* ─── Delete (soft) ─── */
  async function handleDelete(id: string) {
    try {
      await del(`/api/v1/locations/${id}`);
      setDetail(null);
      toast.success(t('actions.deleted'));
      void loadLocations();
    } catch { toast.error(t('errors.generic')); }
  }

  /* ─── Directions URL ─── */
  function directionsUrl(lat: number, lng: number) {
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  }

  /* ─── Type filter options ─── */
  const typeOptions = [
    { value: '', label: t('locations.allTypes') },
    ...LOCATION_TYPES.map((lt) => ({ value: lt, label: t(`locations.types.${lt}` as any) })),
  ];

  /* ─── Parent location options for form ─── */
  const parentOptions = [
    { value: '', label: '—' },
    ...locations
      .filter((l) => l.type === 'Building' && (!editItem || l.id !== editItem.id))
      .map((l) => ({ value: l.id, label: isAr ? l.nameAr : l.nameEn })),
  ];

  /* ─── Map data ─── */
  const mapLocations: MapLocation[] = filtered.map((l) => ({
    id: l.id,
    nameAr: l.nameAr,
    nameEn: l.nameEn,
    type: t(`locations.types.${l.type}` as any),
    latitude: l.latitude,
    longitude: l.longitude,
  }));

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">{t('locations.title')}</h1>
          <p className="mt-0.5 text-sm text-neutral-500">{t('locations.description')}</p>
        </div>
        {isAdmin && (
          <Button icon={<IconPlus className="h-4 w-4" />} onClick={openCreate}>
            {t('locations.addLocation')}
          </Button>
        )}
      </div>

      {/* Toolbar: search + type filter + view toggle */}
      <Card>
        <CardBody className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <IconSearch className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('locations.searchPlaceholder')}
              className="w-full rounded-lg border border-neutral-200 bg-white py-2 ps-9 pe-3 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
          </div>
          <Select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            options={typeOptions}
          />
          <div className="flex rounded-lg border border-neutral-200 p-0.5">
            <button
              type="button"
              onClick={() => setView('map')}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                view === 'map' ? 'bg-brand-600 text-white' : 'text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              {t('locations.viewMap')}
            </button>
            <button
              type="button"
              onClick={() => setView('list')}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                view === 'list' ? 'bg-brand-600 text-white' : 'text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              {t('locations.viewList')}
            </button>
          </div>
        </CardBody>
      </Card>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
        </div>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <Card>
          <CardBody className="flex flex-col items-center gap-3 py-12 text-center">
            <IconMapPin className="h-12 w-12 text-neutral-300" />
            <h3 className="text-sm font-semibold text-neutral-700">{t('locations.noLocations')}</h3>
            <p className="text-xs text-neutral-500">{t('locations.noLocationsDesc')}</p>
          </CardBody>
        </Card>
      )}

      {/* Map view */}
      {!loading && filtered.length > 0 && view === 'map' && (
        <Card>
          <CardBody className="p-0 overflow-hidden rounded-xl">
            <LocationMap
              locations={mapLocations}
              onMarkerClick={(id) => setDetail(locations.find((l) => l.id === id) ?? null)}
              isAr={isAr}
              className="h-[500px] w-full"
            />
          </CardBody>
        </Card>
      )}

      {/* List/card view */}
      {!loading && filtered.length > 0 && view === 'list' && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((loc) => (
            <div key={loc.id} role="button" tabIndex={0} onClick={() => setDetail(loc)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setDetail(loc); }} className="group cursor-pointer transition-shadow hover:shadow-md rounded-lg border border-neutral-200 bg-neutral-0 shadow-sm">
              <CardBody className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${TYPE_COLORS[loc.type] ?? 'bg-neutral-50 text-neutral-600'}`}>
                      <IconBuilding className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-neutral-900 line-clamp-1">{isAr ? loc.nameAr : loc.nameEn}</p>
                      <p className="text-xs text-neutral-500 line-clamp-1">{isAr ? loc.nameEn : loc.nameAr}</p>
                    </div>
                  </div>
                  <Badge className={`shrink-0 text-[10px] ${TYPE_COLORS[loc.type] ?? ''}`}>
                    {t(`locations.types.${loc.type}` as any)}
                  </Badge>
                </div>

                {/* Building / floor info */}
                {(loc.building || loc.floor || loc.roomNumber) && (
                  <p className="flex items-center gap-1.5 text-xs text-neutral-500">
                    <IconMapPin className="h-3 w-3" />
                    {[loc.building, loc.floor ? `${t('locations.floor')} ${loc.floor}` : null, loc.roomNumber].filter(Boolean).join(' — ')}
                  </p>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-1">
                  {loc.latitude != null && loc.longitude != null && (
                    <a
                      href={directionsUrl(loc.latitude, loc.longitude)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1 rounded-md bg-brand-50 px-2 py-1 text-xs font-medium text-brand-700 transition-colors hover:bg-brand-100"
                    >
                      <IconNavigation className="h-3 w-3" />
                      {t('locations.getDirections')}
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShareTarget({ type: 'Location', id: loc.id, title: isAr ? loc.nameAr : loc.nameEn });
                    }}
                    className="flex items-center gap-1 rounded-md bg-neutral-50 px-2 py-1 text-xs font-medium text-neutral-600 transition-colors hover:bg-neutral-100"
                  >
                    <IconQrCode className="h-3 w-3" />
                    QR
                  </button>
                </div>
              </CardBody>
            </div>
          ))}
        </div>
      )}

      {/* ─── Detail Modal ─── */}
      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail ? (isAr ? detail.nameAr : detail.nameEn) : ''}>
        {detail && (
          <div className="space-y-4">
            {/* Subtitle */}
            <p className="text-sm text-neutral-500">{isAr ? detail.nameEn : detail.nameAr}</p>

            {/* Type badge + location info */}
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={TYPE_COLORS[detail.type] ?? ''}>
                {t(`locations.types.${detail.type}` as any)}
              </Badge>
              {(detail.building || detail.floor || detail.roomNumber) && (
                <span className="text-xs text-neutral-500">
                  {[detail.building, detail.floor ? `${t('locations.floor')} ${detail.floor}` : null, detail.roomNumber].filter(Boolean).join(' — ')}
                </span>
              )}
            </div>

            {/* Description */}
            {(detail.descriptionAr || detail.descriptionEn) && (
              <p className="text-sm text-neutral-700">{isAr ? detail.descriptionAr : detail.descriptionEn}</p>
            )}

            {/* Mini map */}
            {detail.latitude != null && detail.longitude != null && (
              <div className="overflow-hidden rounded-xl border border-neutral-200">
                <LocationMap
                  locations={[{
                    id: detail.id,
                    nameAr: detail.nameAr,
                    nameEn: detail.nameEn,
                    type: t(`locations.types.${detail.type}` as any),
                    latitude: detail.latitude,
                    longitude: detail.longitude,
                  }]}
                  center={[detail.latitude, detail.longitude]}
                  zoom={17}
                  isAr={isAr}
                  className="h-[250px] w-full"
                />
              </div>
            )}

            {/* Coordinates info */}
            {detail.latitude != null && detail.longitude != null ? (
              <p className="text-xs text-neutral-400">
                {t('locations.coordinates')}: {detail.latitude.toFixed(6)}, {detail.longitude.toFixed(6)}
              </p>
            ) : (
              <p className="text-xs text-neutral-400">{t('locations.noCoordinates')}</p>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
              {detail.latitude != null && detail.longitude != null && (
                <a
                  href={directionsUrl(detail.latitude, detail.longitude)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700"
                >
                  <IconNavigation className="h-4 w-4" />
                  {t('locations.getDirections')}
                </a>
              )}
              <Button
                variant="outline"
                size="sm"
                icon={<IconQrCode className="h-3.5 w-3.5" />}
                onClick={() => setShareTarget({ type: 'Location', id: detail.id, title: isAr ? detail.nameAr : detail.nameEn })}
              >
                QR
              </Button>
              {isAdmin && (
                <>
                  <Button variant="outline" size="sm" icon={<IconPencil className="h-3.5 w-3.5" />} onClick={() => { setDetail(null); openEdit(detail); }}>
                    {t('actions.edit')}
                  </Button>
                  <Button variant="danger" size="sm" icon={<IconTrash className="h-3.5 w-3.5" />} onClick={() => void handleDelete(detail.id)}>
                    {t('actions.delete')}
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* ─── Create/Edit Modal ─── */}
      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editItem ? t('locations.editLocation') : t('locations.addLocation')}
      >
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label={t('locations.nameAr')} value={fNameAr} onChange={(e) => setFNameAr(e.target.value)} dir="rtl" />
            <Input label={t('locations.nameEn')} value={fNameEn} onChange={(e) => setFNameEn(e.target.value)} dir="ltr" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label={t('locations.descriptionAr')} value={fDescAr} onChange={(e) => setFDescAr(e.target.value)} dir="rtl" />
            <Input label={t('locations.descriptionEn')} value={fDescEn} onChange={(e) => setFDescEn(e.target.value)} dir="ltr" />
          </div>

          <Select
            label={t('locations.type')}
            value={fType}
            onChange={(e) => setFType(e.target.value)}
            options={LOCATION_TYPES.map((lt) => ({ value: lt, label: t(`locations.types.${lt}` as any) }))}
          />

          <div className="grid gap-3 sm:grid-cols-3">
            <Input label={t('locations.building')} value={fBuilding} onChange={(e) => setFBuilding(e.target.value)} />
            <Input label={t('locations.floor')} value={fFloor} onChange={(e) => setFFloor(e.target.value)} />
            <Input label={t('locations.roomNumber')} value={fRoom} onChange={(e) => setFRoom(e.target.value)} />
          </div>

          <Select
            label={t('locations.parentLocation')}
            value={fParentId}
            onChange={(e) => setFParentId(e.target.value)}
            options={parentOptions}
          />

          {/* Coordinate picker */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-neutral-600">{t('locations.coordinates')}</p>
            <p className="text-[11px] text-neutral-400">{t('locations.clickToSetCoords')}</p>
            <div className="overflow-hidden rounded-xl border border-neutral-200">
              <LocationMap
                locations={fLat && fLng ? [{
                  id: 'pick',
                  nameAr: fNameAr || t('locations.addLocation'),
                  nameEn: fNameEn || t('locations.addLocation'),
                  type: t(`locations.types.${fType}` as any),
                  latitude: parseFloat(fLat),
                  longitude: parseFloat(fLng),
                }] : []}
                center={fLat && fLng ? [parseFloat(fLat), parseFloat(fLng)] : undefined}
                zoom={fLat && fLng ? 17 : 15}
                onMapClick={(lat, lng) => {
                  setFLat(lat.toFixed(6));
                  setFLng(lng.toFixed(6));
                }}
                className="h-[200px] w-full"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input label={t('locations.latitude')} value={fLat} onChange={(e) => setFLat(e.target.value)} placeholder="27.52" dir="ltr" />
              <Input label={t('locations.longitude')} value={fLng} onChange={(e) => setFLng(e.target.value)} placeholder="41.69" dir="ltr" />
            </div>
          </div>

          <Input label={t('locations.mapImage')} value={fMapImage} onChange={(e) => setFMapImage(e.target.value)} dir="ltr" />

          <Button onClick={() => void handleSave()} loading={formBusy} className="w-full">
            {editItem ? t('actions.save') : t('actions.create')}
          </Button>
        </div>
      </Modal>

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
