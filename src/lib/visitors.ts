// Visitor logging and the data behind the visitor globe.
//
// Talks to Supabase's REST interface directly with fetch, so no SDK ships to the
// browser. Everything here runs client-side only.

import type { VisitorMapConfig } from '@/lib/config';

export interface VisitorMapSettings {
  url: string;
  anonKey: string;
  table: string;
}

export interface VisitorPoint {
  lat: number;
  lng: number;
  city: string | null;
  country: string | null;
  visits: number;
  size: number;
  color: string;
}

/** Most recent visits loaded for the globe. Supabase caps a response at 1000 rows by default. */
export const VISIT_ROW_LIMIT = 1000;

const GEO_ENDPOINT = 'https://ipapi.co/json/';
const CACHE_KEY = 'visitorMapCache';

/** Turns the [visitor_map] block of config.toml into client settings, or null when it is off or incomplete. */
export function toVisitorMapSettings(config?: VisitorMapConfig): VisitorMapSettings | null {
  if (!config || config.enabled === false) return null;
  if (!config.supabase_url || !config.supabase_anon_key) return null;

  return {
    url: config.supabase_url.replace(/\/+$/, ''),
    anonKey: config.supabase_anon_key,
    table: config.table || 'visitors',
  };
}

function endpoint(settings: VisitorMapSettings, query = ''): string {
  return `${settings.url}/rest/v1/${encodeURIComponent(settings.table)}${query}`;
}

function authHeaders(settings: VisitorMapSettings): Record<string, string> {
  return {
    apikey: settings.anonKey,
    Authorization: `Bearer ${settings.anonKey}`,
  };
}

/**
 * Looks up the visitor's approximate location from their IP and stores one row.
 * Resolves to false (and stores nothing) when the location is unknown, so a blocked
 * or rate-limited lookup never turns into a made-up point on the globe.
 */
export async function recordVisit(settings: VisitorMapSettings): Promise<boolean> {
  const geoResponse = await fetch(GEO_ENDPOINT);
  if (!geoResponse.ok) return false;

  const geo = await geoResponse.json();
  if (typeof geo.latitude !== 'number' || typeof geo.longitude !== 'number') return false;

  const response = await fetch(endpoint(settings), {
    method: 'POST',
    headers: {
      ...authHeaders(settings),
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify([
      {
        lat: geo.latitude,
        lng: geo.longitude,
        city: geo.city ?? null,
        country: geo.country_name ?? null,
        ip: geo.ip ?? null,
        user_agent: navigator.userAgent,
        timestamp: new Date().toISOString(),
      },
    ]),
  });

  return response.ok;
}

interface VisitRow {
  lat: number;
  lng: number;
  city: string | null;
  country: string | null;
}

function pointColor(visits: number): string {
  if (visits > 5) return '#f59e0b';
  if (visits > 2) return '#fbbf24';
  return '#fde68a';
}

/** Height of a point above the surface, in globe radii. Grows slowly so busy cities do not tower over the rest. */
function pointHeight(visits: number): number {
  return 0.02 + Math.log10(visits + 1) * 0.12;
}

/** Groups visit rows by coordinates; busier locations get taller, more saturated points. */
export function aggregateVisits(rows: VisitRow[]): VisitorPoint[] {
  const byLocation = new Map<string, VisitorPoint>();

  for (const row of rows) {
    if (typeof row.lat !== 'number' || typeof row.lng !== 'number') continue;

    const key = `${row.lat},${row.lng}`;
    const existing = byLocation.get(key);
    if (existing) {
      existing.visits += 1;
    } else {
      byLocation.set(key, {
        lat: row.lat,
        lng: row.lng,
        city: row.city,
        country: row.country,
        visits: 1,
        size: 0,
        color: '',
      });
    }
  }

  return Array.from(byLocation.values())
    .map((point) => ({
      ...point,
      size: pointHeight(point.visits),
      color: pointColor(point.visits),
    }))
    .sort((a, b) => b.visits - a.visits);
}

/** Loads the most recent visits and aggregates them into globe points. Throws when the database is unreachable. */
export async function fetchVisitorPoints(settings: VisitorMapSettings): Promise<VisitorPoint[]> {
  const query = `?select=lat,lng,city,country&order=timestamp.desc&limit=${VISIT_ROW_LIMIT}`;
  const response = await fetch(endpoint(settings, query), { headers: authHeaders(settings) });
  if (!response.ok) {
    throw new Error(`Visitor data request failed with status ${response.status}`);
  }

  const rows: VisitRow[] = await response.json();
  return aggregateVisits(rows);
}

/** Timestamp (ms) of the newest stored visit, or null when the table is empty. Throws when unreachable. */
export async function fetchLatestVisitTime(settings: VisitorMapSettings): Promise<number | null> {
  const query = '?select=timestamp&order=timestamp.desc&limit=1';
  const response = await fetch(endpoint(settings, query), { headers: authHeaders(settings) });
  if (!response.ok) {
    throw new Error(`Visitor data request failed with status ${response.status}`);
  }

  const rows: Array<{ timestamp: string }> = await response.json();
  if (rows.length === 0) return null;

  const time = Date.parse(rows[0].timestamp);
  return Number.isNaN(time) ? null : time;
}

/**
 * Points from the last successful load, kept so the globe still has data while the
 * database is paused. The previous version of the site cached points under the same
 * key with its own styling, so heights and colours are always recomputed here.
 */
export function readCachedPoints(): VisitorPoint[] | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;

    return (parsed as VisitorPoint[])
      .filter((point) => typeof point?.lat === 'number' && typeof point?.lng === 'number')
      .map((point) => {
        const visits = point.visits || 1;
        return { ...point, visits, size: pointHeight(visits), color: pointColor(visits) };
      });
  } catch {
    return null;
  }
}

export function writeCachedPoints(points: VisitorPoint[]): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(points));
  } catch {
    // Storage may be full or disabled; the cache is only a convenience.
  }
}
