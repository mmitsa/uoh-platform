import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

// Fix default marker icon issue with bundlers (Vite)
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

/* ───── Types ───── */

export interface MapLocation {
  id: string;
  nameAr: string;
  nameEn: string;
  type: string;
  latitude: number | null;
  longitude: number | null;
}

interface LocationMapProps {
  locations: MapLocation[];
  center?: [number, number];
  zoom?: number;
  onMarkerClick?: (id: string) => void;
  onMapClick?: (lat: number, lng: number) => void;
  isAr?: boolean;
  className?: string;
}

// University of Hail approximate coordinates
const DEFAULT_CENTER: [number, number] = [27.52, 41.69];

/* ───── Click handler sub-component ───── */

function ClickHandler({ onClick }: { onClick?: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onClick?.(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

/* ───── Main component ───── */

export function LocationMap({
  locations,
  center = DEFAULT_CENTER,
  zoom = 15,
  onMarkerClick,
  onMapClick,
  isAr = false,
  className = 'h-[400px] w-full rounded-xl',
}: LocationMapProps) {
  const geoLocations = locations.filter(
    (l) => l.latitude != null && l.longitude != null,
  );

  return (
    <div dir="ltr" className={className}>
      <MapContainer
        center={center}
        zoom={zoom}
        className="h-full w-full rounded-xl"
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {onMapClick && <ClickHandler onClick={onMapClick} />}
        {geoLocations.map((loc) => (
          <Marker
            key={loc.id}
            position={[loc.latitude!, loc.longitude!]}
            eventHandlers={{
              click: () => onMarkerClick?.(loc.id),
            }}
          >
            <Popup>
              <strong>{isAr ? loc.nameAr : loc.nameEn}</strong>
              <br />
              <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>{loc.type}</span>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
