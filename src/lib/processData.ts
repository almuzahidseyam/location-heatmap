import { ParsedData, PlaceVisit, RouteSegment, TopPlace } from './parseLocationData';

export interface ProcessedData {
  places: PlaceVisit[];
  routes: RouteSegment[];
  totalHours: number;
  totalDistance: number;
  topPlaces: TopPlace[];
  patterns: {
    byWeekday: { day: string; count: number }[];
    byHour: { hour: string; count: number }[];
  };
}

export function processData(
  data: ParsedData | null, 
  minVisits: number, 
  customNames: Record<string, string>
): ProcessedData | null {
  if (!data) return null;

  const m = new Map<string, any>();
  const weekdayCounts = new Array(7).fill(0);
  const hourCounts = new Array(24).fill(0);

  // Cluster places
  for (const v of data.rawPlaces) {
    const k = `${Math.round(v.lat * 1000)},${Math.round(v.lng * 1000)}`;
    let c = m.get(k);
    if (!c) {
      c = { k, sl: 0, sg: 0, n: 0, h: 0, name: v.name || '' };
      m.set(k, c);
    }
    c.sl += v.lat;
    c.sg += v.lng;
    c.n++;
    if (isFinite(v.durationHours) && v.durationHours > 0) c.h += v.durationHours;

    // Patterns
    const d = new Date(v.startTimestamp);
    weekdayCounts[d.getDay()]++;
    hourCounts[d.getHours()]++;
  }

  // Filter & Format Places
  const clusteredPlaces: PlaceVisit[] = [];
  const topPlaces: TopPlace[] = [];
  let totalHours = 0;

  [...m.values()].forEach(c => {
    totalHours += c.h;
    if (c.n >= minVisits) {
      const lat = c.sl / c.n;
      const lng = c.sg / c.n;
      const name = customNames[c.k] || c.name || 'Unnamed';
      
      clusteredPlaces.push({
        id: c.k,
        name,
        lat,
        lng,
        startTimestamp: 0,
        endTimestamp: 0,
        durationHours: c.h,
        visits: c.n
      });

      topPlaces.push({ key: c.k, name, lat, lng, visits: c.n, hours: c.h });
    }
  });

  topPlaces.sort((a, b) => b.n - a.n);

  // Group routes for frequency coloring
  const routeMap = new Map<string, RouteSegment>();
  data.rawRoutes.forEach(r => {
    const rk = `${Math.round(r.startLat*100)},${Math.round(r.startLng*100)}-${Math.round(r.endLat*100)},${Math.round(r.endLng*100)}`;
    if (routeMap.has(rk)) {
      routeMap.get(rk)!.frequency++;
    } else {
      routeMap.set(rk, { ...r });
    }
  });

  const processedRoutes = Array.from(routeMap.values());
  const totalDistance = processedRoutes.reduce((acc, r) => acc + (r.distance || 0), 0);

  const days = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  return {
    places: clusteredPlaces,
    routes: processedRoutes,
    totalHours,
    totalDistance,
    topPlaces: topPlaces.slice(0, 10),
    patterns: {
      byWeekday: weekdayCounts.map((count, i) => ({ day: days[i], count })),
      byHour: hourCounts.map((count, i) => ({ hour: `${i}:00`, count }))
    }
  };
}
