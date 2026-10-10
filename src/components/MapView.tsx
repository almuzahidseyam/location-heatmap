"use client";

import React, { useEffect, useState } from 'react';
import DeckGL from '@deck.gl/react';
import { ScatterplotLayer, LineLayer } from '@deck.gl/layers';
import { HeatmapLayer } from '@deck.gl/aggregation-layers';
import Map from 'react-map-gl/maplibre';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { ProcessedData } from '@/lib/processData';

const DARK_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';
const LIGHT_STYLE = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';

const INITIAL_VIEW_STATE = {
  longitude: 90.4125,
  latitude: 23.8103,
  zoom: 6,
  pitch: 45,
  bearing: 0
};

interface MapViewProps {
  data: ProcessedData;
  theme: 'dark' | 'light';
  focusLocation?: { lat: number, lng: number } | null;
}

export default function MapView({ data, theme, focusLocation }: MapViewProps) {
  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);

  useEffect(() => {
    if (focusLocation) {
      setViewState(prev => ({
        ...prev,
        longitude: focusLocation.lng,
        latitude: focusLocation.lat,
        zoom: 14,
        transitionDuration: 1000
      }));
    } else if (data.places.length > 0) {
      setViewState(prev => ({
        ...prev,
        longitude: data.places[0].lng,
        latitude: data.places[0].lat,
        zoom: 11,
        transitionDuration: 1000
      }));
    }
  }, [focusLocation, data]);

  const maxFreq = Math.max(...data.routes.map(r => r.frequency), 1);

  const layers = [
    new HeatmapLayer({
      id: 'heatmapLayer',
      data: data.places,
      getPosition: (d) => [d.lng, d.lat],
      getWeight: (d) => d.durationHours || 1,
      radiusPixels: 40,
      intensity: 1,
      threshold: 0.03
    }),
    new LineLayer({
      id: 'routeLayer',
      data: data.routes,
      getSourcePosition: (d) => [d.startLng, d.startLat],
      getTargetPosition: (d) => [d.endLng, d.endLat],
      getColor: (d) => {
        const t = d.frequency / maxFreq;
        return [14, 165, 164, 50 + t * 200]; // Opacity based on frequency
      },
      getWidth: (d) => 1 + (d.frequency / maxFreq) * 4,
      pickable: true
    }),
    new ScatterplotLayer({
      id: 'placesLayer',
      data: data.places,
      getPosition: (d) => [d.lng, d.lat],
      getFillColor: [239, 68, 68, 200],
      getRadius: (d) => Math.max(80, Math.sqrt(d.visits) * 40),
      radiusMinPixels: 3,
      radiusMaxPixels: 30,
      pickable: true,
      autoHighlight: true
    })
  ];

  return (
    <DeckGL
      id="deckgl-map"
      viewState={viewState}
      onViewStateChange={({ viewState }) => setViewState(viewState as any)}) => setViewState(viewState)}
      controller={true}
      layers={layers}
      getTooltip={({object}) => {
        if (!object) return null;
        if (object.visits) return `${object.name !== 'Unnamed' ? object.name : 'Unknown Place'} \nVisits: ${object.visits} \nHours: ${Math.round(object.durationHours)}`;
        return `Route (${object.frequency} trips)`;
      }}
      {...({ glOptions: { preserveDrawingBuffer: true } } as any)}}
    >
      <Map
        mapLib={maplibregl as any}
        mapStyle={theme === 'dark' ? DARK_STYLE : LIGHT_STYLE}
        reuseMaps
      />
    </DeckGL>
  );
}
