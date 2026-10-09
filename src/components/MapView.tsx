"use client";

import React, { useMemo } from 'react';
import DeckGL from '@deck.gl/react';
import { ScatterplotLayer, LineLayer } from '@deck.gl/layers';
import { HeatmapLayer } from '@deck.gl/aggregation-layers';
import Map from 'react-map-gl';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { ParsedData } from '@/lib/parseLocationData';

const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

const INITIAL_VIEW_STATE = {
  longitude: 90.4125, // Default to Dhaka, Bangladesh (can be dynamic later)
  latitude: 23.8103,
  zoom: 6,
  pitch: 45,
  bearing: 0
};

interface MapViewProps {
  data: ParsedData;
}

export default function MapView({ data }: MapViewProps) {
  
  // Calculate center based on first place visit or route if available
  const initialViewState = useMemo(() => {
    if (data.places.length > 0) {
      return { ...INITIAL_VIEW_STATE, longitude: data.places[0].lng, latitude: data.places[0].lat, zoom: 10 };
    }
    return INITIAL_VIEW_STATE;
  }, [data]);

  const layers = [
    // 1. Heatmap Layer for overall visits
    new HeatmapLayer({
      id: 'heatmapLayer',
      data: data.places,
      getPosition: (d) => [d.lng, d.lat],
      getWeight: (d) => d.durationHours || 1,
      radiusPixels: 40,
      intensity: 1,
      threshold: 0.03
    }),
    
    // 2. Line Layer for Routes
    new LineLayer({
      id: 'routeLayer',
      data: data.routes,
      getSourcePosition: (d) => [d.startLng, d.startLat],
      getTargetPosition: (d) => [d.endLng, d.endLat],
      getColor: [45, 212, 191, 100], // Teal color with opacity
      getWidth: 2,
      pickable: true
    }),

    // 3. Scatterplot for Places
    new ScatterplotLayer({
      id: 'placesLayer',
      data: data.places,
      getPosition: (d) => [d.lng, d.lat],
      getFillColor: [239, 68, 68, 200], // Red color
      getRadius: (d) => Math.max(100, d.durationHours * 50),
      radiusMinPixels: 3,
      radiusMaxPixels: 30,
      pickable: true,
      autoHighlight: true
    })
  ];

  return (
    <DeckGL
      initialViewState={initialViewState}
      controller={true}
      layers={layers}
      getTooltip={({object}) => object && (object.name || object.activityType || 'Location')}
    >
      <Map
        mapLib={maplibregl as any}
        mapStyle={MAP_STYLE}
        reuseMaps
      />
    </DeckGL>
  );
}
