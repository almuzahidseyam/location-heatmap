import JSZip from 'jszip';

export interface PlaceVisit {
  id: string;
  name: string;
  lat: number;
  lng: number;
  startTimestamp: number;
  endTimestamp: number;
  durationHours: number;
  visits: number; // For clustering
}

export interface RouteSegment {
  id: string;
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  activityType: string;
  path: [number, number][]; // [lng, lat]
  frequency: number; // Added for route coloring
}

export interface TopPlace {
  key: string;
  lat: number;
  lng: number;
  visits: number;
  hours: number;
}

export interface ParsedData {
  rawPlaces: PlaceVisit[];
  rawRoutes: RouteSegment[];
}

function ll(v: any): [number, number] | null {
  if (!v) return null;
  if (typeof v === 'string') {
    const m = v.match(/(-?\d+(?:\.\d+)?)[°\s]*,\s*(-?\d+(?:\.\d+)?)/);
    return m ? [+m[1], +m[2]] : null;
  }
  if (v.latitudeE7 != null) return [v.latitudeE7 / 1e7, v.longitudeE7 / 1e7];
  if (v.latLng) return ll(v.latLng);
  if (v.lat != null) return [v.lat, v.lng ?? v.lon];
  return null;
}

export function extractTimelineData(jsonObj: any): ParsedData {
  const V: PlaceVisit[] = [];
  const P: RouteSegment[] = [];

  const items = Array.isArray(jsonObj) ? jsonObj : (jsonObj.semanticSegments || jsonObj.timelineObjects || []);
  
  const addPath = (arr: (number[] | null)[]) => {
    const valid = arr.filter(Boolean) as [number, number][]; // [lat, lng]
    if (valid.length > 1) {
      P.push({
        id: `route-${Math.random()}`,
        startLat: valid[0][0],
        startLng: valid[0][1],
        endLat: valid[valid.length - 1][0],
        endLng: valid[valid.length - 1][1],
        activityType: 'UNKNOWN',
        path: valid.map(p => [p[1], p[0]]), // Deck.gl needs [lng, lat]
        frequency: 1
      });
    }
  };

  for (const e of items) {
    if (e.visit) {
      const p = ll(e.visit.topCandidate?.placeLocation);
      if (p) {
        const s = Date.parse(e.startTime);
        const end = Date.parse(e.endTime);
        V.push({ id: `p-${Math.random()}`, name: '', lat: p[0], lng: p[1], startTimestamp: s, endTimestamp: end, durationHours: (end - s) / 36e5, visits: 1 });
      }
    } else if (e.placeVisit) {
      const p = ll(e.placeVisit.location);
      const d = e.placeVisit.duration || {};
      if (p) {
        const s = Date.parse(d.startTimestamp);
        const end = Date.parse(d.endTimestamp);
        V.push({ id: `p-${Math.random()}`, name: e.placeVisit.location?.name || '', lat: p[0], lng: p[1], startTimestamp: s, endTimestamp: end, durationHours: (end - s) / 36e5, visits: 1 });
      }
    }

    if (e.activity) addPath([ll(e.activity.start), ll(e.activity.end)]);
    if (e.activitySegment) {
      const a = e.activitySegment;
      addPath([ll(a.startLocation), ...(a.waypointPath?.waypoints || []).map(ll), ll(a.endLocation)]);
    }
    if (e.timelinePath) addPath(e.timelinePath.map((p: any) => ll(p.point)));
  }

  if (jsonObj.locations) addPath(jsonObj.locations.map(ll));

  const validV = V.filter(v => isFinite(v.lat) && isFinite(v.lng) && isFinite(v.startTimestamp));
  return { rawPlaces: validV, rawRoutes: P };
}

export async function parseFile(file: File, onProgress: (msg: string) => void): Promise<ParsedData> {
  if (file.name.endsWith('.zip')) {
    onProgress("Unzipping file...");
    const zip = new JSZip();
    const loadedZip = await zip.loadAsync(file);
    
    const jsonFiles = Object.values(loadedZip.files).filter(
      (zipEntry) => 
        !zipEntry.dir && 
        zipEntry.name.endsWith('.json') &&
        (zipEntry.name.includes('Semantic Location History') || zipEntry.name.includes('Records.json'))
    );

    if (jsonFiles.length === 0) {
      throw new Error("No timeline JSON files found in the ZIP.");
    }

    let allPlaces: PlaceVisit[] = [];
    let allRoutes: RouteSegment[] = [];

    onProgress(`Found ${jsonFiles.length} files. Parsing...`);
    for (let i = 0; i < jsonFiles.length; i++) {
      if (i % 5 === 0) onProgress(`Parsing file ${i + 1} of ${jsonFiles.length}...`);
      const fileContent = await jsonFiles[i].async('string');
      try {
        const j = JSON.parse(fileContent);
        const { rawPlaces, rawRoutes } = extractTimelineData(j);
        allPlaces = allPlaces.concat(rawPlaces);
        allRoutes = allRoutes.concat(rawRoutes);
      } catch (e) {
        console.warn(`Failed to parse ${jsonFiles[i].name}`, e);
      }
    }
    onProgress("Processing complete!");
    return { rawPlaces: allPlaces, rawRoutes: allRoutes };
  } else {
    onProgress("Parsing JSON file...");
    const text = await file.text();
    const j = JSON.parse(text);
    const data = extractTimelineData(j);
    onProgress("Processing complete!");
    return data;
  }
}

// Generate Synthetic Demo Data
export function generateDemoData(): ParsedData {
  const hubs = [[23.7806, 90.4000, 'Home'], [23.7509, 90.3935, 'Work'], [23.7340, 90.3926, 'University'], [23.8103, 90.4125, 'Gym']];
  const rnd = (a: number, b: number) => a + Math.random() * (b - a);
  const V: PlaceVisit[] = [];
  const P: RouteSegment[] = [];
  const start = Date.now() - 300 * 864e5;
  
  for (let d = 0; d < 300; d++) {
    const day = start + d * 864e5;
    let prev = hubs[0];
    const stops = [1, 2, 0].map((x, i) => i == 2 ? hubs[0] : hubs[Math.random() < 0.7 ? x : Math.floor(rnd(0, hubs.length))]);
    let t = day + 8 * 36e5;
    
    for (const h of stops) {
      P.push({
        id: `demo-r-${Math.random()}`,
        startLat: prev[0], startLng: prev[1], endLat: h[0] as number, endLng: h[1] as number,
        activityType: 'DRIVE',
        path: [[prev[1] as number, prev[0] as number], [h[1] as number, h[0] as number]],
        frequency: 1
      });
      t += 36e5 / 2;
      const stay = rnd(1, 5) * 36e5;
      V.push({
        id: `demo-v-${Math.random()}`,
        name: h[2] as string,
        lat: h[0] as number,
        lng: h[1] as number,
        startTimestamp: t,
        endTimestamp: t + stay,
        durationHours: stay / 36e5,
        visits: 1
      });
      t += stay;
      prev = h;
    }
  }
  return { rawPlaces: V, rawRoutes: P };
}
