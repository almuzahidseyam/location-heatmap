import JSZip from 'jszip';

export interface PlaceVisit {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  startTimestamp: string;
  endTimestamp: string;
  durationHours: number;
}

export interface RouteSegment {
  id: string;
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  activityType: string;
  distance: number;
  path: [number, number][]; 
}

export interface TopPlace {
  name: string;
  visits: number;
  hours: number;
}

export interface ParsedData {
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

export async function parseGoogleTakeoutZip(file: File, onProgress: (msg: string) => void): Promise<ParsedData> {
  onProgress("Unzipping file...");
  const zip = new JSZip();
  const loadedZip = await zip.loadAsync(file);
  
  const jsonFiles = Object.values(loadedZip.files).filter(
    (zipEntry) => 
      !zipEntry.dir && 
      zipEntry.name.includes('Semantic Location History') && 
      zipEntry.name.endsWith('.json')
  );

  if (jsonFiles.length === 0) {
    throw new Error("No Semantic Location History JSON files found in the ZIP.");
  }

  const places: PlaceVisit[] = [];
  const routes: RouteSegment[] = [];
  let totalHours = 0;
  let totalDistance = 0;

  const placeAggregator: Record<string, {name: string, visits: number, hours: number}> = {};
  const weekdayCounts = new Array(7).fill(0);
  const hourCounts = new Array(24).fill(0);

  onProgress(`Found ${jsonFiles.length} months of data. Parsing...`);

  for (let i = 0; i < jsonFiles.length; i++) {
    if (i % 5 === 0) onProgress(`Parsing month ${i + 1} of ${jsonFiles.length}...`);
    const fileContent = await jsonFiles[i].async('string');
    
    try {
      const data = JSON.parse(fileContent);
      const timelineObjects = data.timelineObjects || [];

      for (const obj of timelineObjects) {
        if (obj.placeVisit && obj.placeVisit.location) {
          const loc = obj.placeVisit.location;
          if (loc.latitudeE7 && loc.longitudeE7) {
            const start = new Date(obj.placeVisit.duration?.startTimestamp || 0);
            const end = new Date(obj.placeVisit.duration?.endTimestamp || 0);
            const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
            
            if (durationHours > 0) totalHours += durationHours;

            places.push({
              id: `${loc.latitudeE7}-${loc.longitudeE7}-${start.getTime()}`,
              name: loc.name || "Unknown Place",
              address: loc.address || "",
              lat: loc.latitudeE7 / 1e7,
              lng: loc.longitudeE7 / 1e7,
              startTimestamp: obj.placeVisit.duration?.startTimestamp,
              endTimestamp: obj.placeVisit.duration?.endTimestamp,
              durationHours
            });

            // Analytics Aggregation
            const key = loc.name || loc.address || `${Math.round((loc.latitudeE7/1e7)*1000)/1000}`;
            if (!placeAggregator[key]) {
              placeAggregator[key] = { name: loc.name || "Unnamed Place", visits: 0, hours: 0 };
            }
            placeAggregator[key].visits += 1;
            placeAggregator[key].hours += durationHours;

            weekdayCounts[start.getDay()] += 1;
            hourCounts[start.getHours()] += 1;
          }
        }

        if (obj.activitySegment) {
          const seg = obj.activitySegment;
          if (seg.startLocation?.latitudeE7 && seg.endLocation?.latitudeE7) {
            const startLat = seg.startLocation.latitudeE7 / 1e7;
            const startLng = seg.startLocation.longitudeE7 / 1e7;
            const endLat = seg.endLocation.latitudeE7 / 1e7;
            const endLng = seg.endLocation.longitudeE7 / 1e7;
            
            const distance = seg.distance || 0;
            totalDistance += distance;

            let path: [number, number][] = [];
            if (seg.simplifiedRawPath?.points) {
              path = seg.simplifiedRawPath.points.map((p: any) => [p.lngE7 / 1e7, p.latE7 / 1e7]);
            } else if (seg.waypointPath?.waypoints) {
              path = seg.waypointPath.waypoints.map((p: any) => [p.lngE7 / 1e7, p.latE7 / 1e7]);
            } else {
              path = [[startLng, startLat], [endLng, endLat]];
            }

            routes.push({
              id: `${startLat}-${startLng}-${seg.duration?.startTimestamp}`,
              startLat, startLng, endLat, endLng,
              activityType: seg.activityType || "UNKNOWN",
              distance, path
            });
          }
        }
      }
    } catch (e) {
      console.warn(`Failed to parse ${jsonFiles[i].name}`, e);
    }
  }

  // Format Top Places
  const topPlaces = Object.values(placeAggregator)
    .sort((a, b) => b.hours - a.hours)
    .slice(0, 10);

  // Format Patterns
  const days = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  const byWeekday = weekdayCounts.map((count, i) => ({ day: days[i], count }));
  const byHour = hourCounts.map((count, i) => ({ hour: `${i}:00`, count }));

  onProgress("Processing complete!");
  return { places, routes, totalHours, totalDistance, topPlaces, patterns: { byWeekday, byHour } };
}
