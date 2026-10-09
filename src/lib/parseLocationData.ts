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
  path: [number, number][]; // [lng, lat] for deck.gl
}

export interface ParsedData {
  places: PlaceVisit[];
  routes: RouteSegment[];
  totalHours: number;
  totalDistance: number;
}

export async function parseGoogleTakeoutZip(file: File, onProgress: (msg: string) => void): Promise<ParsedData> {
  onProgress("Unzipping file...");
  const zip = new JSZip();
  const loadedZip = await zip.loadAsync(file);
  
  // Find all semantic location history JSON files
  const jsonFiles = Object.values(loadedZip.files).filter(
    (zipEntry) => 
      !zipEntry.dir && 
      zipEntry.name.includes('Semantic Location History') && 
      zipEntry.name.endsWith('.json')
  );

  if (jsonFiles.length === 0) {
    throw new Error("No Semantic Location History JSON files found in the ZIP. Please ensure you exported your 'Location History' or 'Timeline' correctly.");
  }

  const places: PlaceVisit[] = [];
  const routes: RouteSegment[] = [];
  let totalHours = 0;
  let totalDistance = 0;

  onProgress(`Found ${jsonFiles.length} months of data. Parsing...`);

  for (let i = 0; i < jsonFiles.length; i++) {
    onProgress(`Parsing month ${i + 1} of ${jsonFiles.length}...`);
    const fileContent = await jsonFiles[i].async('string');
    
    try {
      const data = JSON.parse(fileContent);
      const timelineObjects = data.timelineObjects || [];

      for (const obj of timelineObjects) {
        // Parse Place Visits
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
          }
        }

        // Parse Activity Segments (Routes)
        if (obj.activitySegment) {
          const seg = obj.activitySegment;
          if (seg.startLocation?.latitudeE7 && seg.endLocation?.latitudeE7) {
            const startLat = seg.startLocation.latitudeE7 / 1e7;
            const startLng = seg.startLocation.longitudeE7 / 1e7;
            const endLat = seg.endLocation.latitudeE7 / 1e7;
            const endLng = seg.endLocation.longitudeE7 / 1e7;
            
            const distance = seg.distance || 0;
            totalDistance += distance;

            // Extract path if available
            let path: [number, number][] = [];
            if (seg.simplifiedRawPath?.points) {
              path = seg.simplifiedRawPath.points.map((p: any) => [p.lngE7 / 1e7, p.latE7 / 1e7]);
            } else if (seg.waypointPath?.waypoints) {
              path = seg.waypointPath.waypoints.map((p: any) => [p.lngE7 / 1e7, p.latE7 / 1e7]);
            } else {
              // Fallback straight line
              path = [[startLng, startLat], [endLng, endLat]];
            }

            routes.push({
              id: `${startLat}-${startLng}-${seg.duration?.startTimestamp}`,
              startLat,
              startLng,
              endLat,
              endLng,
              activityType: seg.activityType || "UNKNOWN",
              distance,
              path
            });
          }
        }
      }
    } catch (e) {
      console.warn(`Failed to parse ${jsonFiles[i].name}`, e);
    }
  }

  onProgress("Processing complete!");
  return { places, routes, totalHours, totalDistance };
}
