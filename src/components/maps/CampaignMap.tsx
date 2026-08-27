'use client';

import React, { useEffect, useRef, useState } from 'react';
import { getGoogleMapsLoader, isGoogleMapsKeyAvailable } from '@/lib/google/client';
import { LocationData, ScheduleItemData } from '@/types';
import { formatDistance, formatDuration } from '@/lib/optimizer/constraints';
import { Compass, MapPin, Navigation, Layers, Rocket, Flag } from 'lucide-react';

interface CampaignMapProps {
  locations: LocationData[];
  scheduleItems: ScheduleItemData[];
  selectedItemId?: string | null;
  onSelectItem?: (itemId: string) => void;
  startLocation?: LocationData | null;
  endLocation?: LocationData | null;
}

export default function CampaignMap({
  locations,
  scheduleItems,
  selectedItemId,
  onSelectItem,
  startLocation,
  endLocation,
}: CampaignMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [useFallback, setUseFallback] = useState(false);
  const googleMapObj = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const renderersRef = useRef<any[]>([]);
  const polylinesRef = useRef<any[]>([]);

  useEffect(() => {
    if (!isGoogleMapsKeyAvailable()) {
      setUseFallback(true);
      return;
    }

    const loader = getGoogleMapsLoader();
    loader
      .load()
      .then((google) => {
        if (mapRef.current && !googleMapObj.current) {
          const map = new google.maps.Map(mapRef.current, {
            center: { lat: 16.3067, lng: 80.4365 }, // Guntur, AP
            zoom: 12,
            styles: [
              { elementType: 'geometry', stylers: [{ color: '#f8fafc' }] },
              { elementType: 'labels.text.fill', stylers: [{ color: '#334155' }] },
              { elementType: 'labels.text.stroke', stylers: [{ color: '#ffffff' }] },
              {
                featureType: 'administrative.country',
                elementType: 'geometry.stroke',
                stylers: [{ color: '#cbd5e1' }],
              },
              {
                featureType: 'water',
                elementType: 'geometry',
                stylers: [{ color: '#e2e8f0' }],
              },
              {
                featureType: 'road',
                elementType: 'geometry',
                stylers: [{ color: '#ffffff' }],
              },
            ],
            disableDefaultUI: false,
            zoomControl: true,
          });
          googleMapObj.current = map;
          setMapLoaded(true);
        }
      })
      .catch((err) => {
        console.warn('Google Maps JS API load failed, switching to vector map fallback');
        setUseFallback(true);
      });
  }, []);

  // Render Google Map Markers & Real-Road Driving Routes
  useEffect(() => {
    if (!googleMapObj.current || !mapLoaded || useFallback) return;

    const google = (window as any).google;
    if (!google) return;

    // Clear old markers, renderers & polylines
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    renderersRef.current.forEach((r) => r.setMap(null));
    renderersRef.current = [];

    polylinesRef.current.forEach((p) => p.setMap(null));
    polylinesRef.current = [];

    const bounds = new google.maps.LatLngBounds();
    const pathPoints: Array<{ latitude: number; longitude: number }> = [];

    // 1. Day Start Location Marker (Green)
    if (startLocation) {
      const startPos = { lat: startLocation.latitude, lng: startLocation.longitude };
      bounds.extend(startPos);
      pathPoints.push({ latitude: startLocation.latitude, longitude: startLocation.longitude });

      const startMarker = new google.maps.Marker({
        position: startPos,
        map: googleMapObj.current,
        title: `🚀 START: ${startLocation.name}`,
        label: {
          text: 'S',
          color: '#ffffff',
          fontWeight: 'bold',
          fontSize: '14px',
        },
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 17,
          fillColor: '#10b981', // Emerald green
          fillOpacity: 1,
          strokeWeight: 3,
          strokeColor: '#ffffff',
        },
        zIndex: 100,
      });
      markersRef.current.push(startMarker);
    }

    // 2. Scheduled Event Markers (1, 2, 3...)
    scheduleItems.forEach((item) => {
      const loc = item.event.location || locations.find((l) => l.id === item.event.locationId);
      if (!loc) return;

      const pos = { lat: loc.latitude, lng: loc.longitude };
      bounds.extend(pos);
      pathPoints.push({ latitude: loc.latitude, longitude: loc.longitude });

      const marker = new google.maps.Marker({
        position: pos,
        map: googleMapObj.current,
        title: `${item.sequence}. ${item.event.title}`,
        label: {
          text: `${item.sequence}`,
          color: '#ffffff',
          fontWeight: 'bold',
          fontSize: '13px',
        },
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 15,
          fillColor: item.event.isFixed ? '#e11d48' : '#2563eb',
          fillOpacity: 1,
          strokeWeight: 2,
          strokeColor: '#ffffff',
        },
        zIndex: 90,
      });

      marker.addListener('click', () => {
        if (onSelectItem) onSelectItem(item.id);
      });

      markersRef.current.push(marker);
    });

    // 3. Day End Location Marker (Purple)
    if (endLocation) {
      const endPos = { lat: endLocation.latitude, lng: endLocation.longitude };
      bounds.extend(endPos);
      pathPoints.push({ latitude: endLocation.latitude, longitude: endLocation.longitude });

      const endMarker = new google.maps.Marker({
        position: endPos,
        map: googleMapObj.current,
        title: `🏁 END: ${endLocation.name}`,
        label: {
          text: 'E',
          color: '#ffffff',
          fontWeight: 'bold',
          fontSize: '14px',
        },
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 17,
          fillColor: '#9333ea', // Purple
          fillOpacity: 1,
          strokeWeight: 3,
          strokeColor: '#ffffff',
        },
        zIndex: 100,
      });
      markersRef.current.push(endMarker);
    }

    // Fetch and render REAL ROAD POLYLINES via server-side Google Routes API
    if (pathPoints.length > 1) {
      fetch('/api/routes/polyline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ points: pathPoints }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && Array.isArray(data.polylines) && data.polylines.length > 0) {
            data.polylines.forEach((encodedPolyline: string) => {
              if (encodedPolyline && google.maps.geometry?.encoding) {
                const decodedPath = google.maps.geometry.encoding.decodePath(encodedPolyline);
                const roadPolyline = new google.maps.Polyline({
                  path: decodedPath,
                  geodesic: true,
                  strokeColor: '#2563eb', // Campaign Blue
                  strokeOpacity: 0.9,
                  strokeWeight: 6,
                  map: googleMapObj.current,
                });
                polylinesRef.current.push(roadPolyline);
              }
            });
          } else {
            // Fallback to client DirectionsService or Polyline
            renderDirectionsFallback(google, pathPoints);
          }
        })
        .catch(() => {
          renderDirectionsFallback(google, pathPoints);
        });
    }

    if (pathPoints.length > 0) {
      googleMapObj.current.fitBounds(bounds);
    }
  }, [scheduleItems, locations, startLocation, endLocation, mapLoaded, useFallback]);

  const renderDirectionsFallback = (google: any, points: Array<{ latitude: number; longitude: number }>) => {
    const directionsService = new google.maps.DirectionsService();

    for (let i = 0; i < points.length - 1; i++) {
      const fromPoint = points[i];
      const toPoint = points[i + 1];

      const renderer = new google.maps.DirectionsRenderer({
        map: googleMapObj.current,
        suppressMarkers: true,
        preserveViewport: true,
        polylineOptions: {
          strokeColor: '#2563eb',
          strokeOpacity: 0.9,
          strokeWeight: 5,
        },
      });
      renderersRef.current.push(renderer);

      const request = {
        origin: new google.maps.LatLng(fromPoint.latitude, fromPoint.longitude),
        destination: new google.maps.LatLng(toPoint.latitude, toPoint.longitude),
        travelMode: google.maps.TravelMode.DRIVING,
      };

      directionsService.route(request, (result: any, status: any) => {
        if (status === google.maps.DirectionsStatus.OK && result) {
          renderer.setDirections(result);
        } else {
          const polyline = new google.maps.Polyline({
            path: [
              { lat: fromPoint.latitude, lng: fromPoint.longitude },
              { lat: toPoint.latitude, lng: toPoint.longitude },
            ],
            geodesic: true,
            strokeColor: '#2563eb',
            strokeOpacity: 0.85,
            strokeWeight: 4,
          });
          polyline.setMap(googleMapObj.current);
          polylinesRef.current.push(polyline);
        }
      });
    }
  };

  return (
    <div className="relative w-full h-full min-h-[350px] sm:min-h-[450px] rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm flex flex-col">
      {/* Map Control Header */}
      <div className="absolute top-3 left-3 z-10 bg-white/90 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-200 shadow-md flex items-center gap-2.5">
        <div className="p-1 rounded-lg bg-blue-50 text-blue-600">
          <Compass className="w-4 h-4 animate-spin-slow" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-slate-800">Campaign Road Directions Map</h4>
          <p className="text-[10px] text-slate-500 flex items-center gap-1.5 mt-0.5">
            {startLocation && <span className="text-emerald-600 font-bold flex items-center gap-0.5"><Rocket className="w-3 h-3" /> Start</span>}
            <span>•</span>
            <span className="font-semibold">{scheduleItems.length} Stops</span>
            {endLocation && <span>•</span>}
            {endLocation && <span className="text-purple-600 font-bold flex items-center gap-0.5"><Flag className="w-3 h-3" /> End</span>}
          </p>
        </div>
      </div>

      {!useFallback ? (
        <div ref={mapRef} className="w-full h-full min-h-[350px] sm:min-h-[450px]" />
      ) : (
        <InteractiveVectorMapFallback
          locations={locations}
          scheduleItems={scheduleItems}
          selectedItemId={selectedItemId}
          onSelectItem={onSelectItem}
          startLocation={startLocation}
          endLocation={endLocation}
        />
      )}
    </div>
  );
}

// Fallback Light Vector Map with Start & End Hub Pins
function InteractiveVectorMapFallback({
  locations,
  scheduleItems,
  selectedItemId,
  onSelectItem,
  startLocation,
  endLocation,
}: CampaignMapProps) {
  const allLocations = [...locations];
  if (startLocation && !allLocations.find((l) => l.id === startLocation.id)) allLocations.push(startLocation);
  if (endLocation && !allLocations.find((l) => l.id === endLocation.id)) allLocations.push(endLocation);

  const lats = allLocations.map((l) => l.latitude);
  const lngs = allLocations.map((l) => l.longitude);
  const minLat = Math.min(...lats, 16.20);
  const maxLat = Math.max(...lats, 16.60);
  const minLng = Math.min(...lngs, 80.30);
  const maxLng = Math.max(...lngs, 80.70);

  const getXY = (lat: number, lng: number) => {
    const x = ((lng - minLng) / (maxLng - minLng)) * 76 + 12;
    const y = 88 - ((lat - minLat) / (maxLat - minLat)) * 76;
    return { x, y };
  };

  const scheduledLocs = scheduleItems.map((item) => {
    const loc = item.event.location || locations.find((l) => l.id === item.event.locationId);
    return { item, loc };
  });

  return (
    <div className="relative w-full h-full min-h-[350px] sm:min-h-[450px] bg-gradient-to-br from-slate-50 via-slate-100 to-blue-50/30 p-4 sm:p-6 flex flex-col justify-between overflow-hidden">
      {/* Grid Pattern */}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage: `radial-gradient(#cbd5e1 1px, transparent 1px)`,
          backgroundSize: '20px 20px',
        }}
      />

      {/* SVG Polylines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <defs>
          <linearGradient id="routeLightGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#2563eb" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#9333ea" stopOpacity="0.9" />
          </linearGradient>
        </defs>

        {scheduledLocs.map(({ item, loc }, idx) => {
          if (idx === 0 || !loc) return null;
          const prevLoc = scheduledLocs[idx - 1].loc;
          if (!prevLoc) return null;

          const p1 = getXY(prevLoc.latitude, prevLoc.longitude);
          const p2 = getXY(loc.latitude, loc.longitude);

          return (
            <line
              key={`line-${idx}`}
              x1={`${p1.x}%`}
              y1={`${p1.y}%`}
              x2={`${p2.x}%`}
              y2={`${p2.y}%`}
              stroke="url(#routeLightGradient)"
              strokeWidth="3.5"
              strokeDasharray="6,4"
              className="animate-pulse"
            />
          );
        })}
      </svg>

      {/* Interactive Location Nodes */}
      <div className="relative w-full h-full z-10">
        {/* START HUB NODE */}
        {startLocation && (() => {
          const { x, y } = getXY(startLocation.latitude, startLocation.longitude);
          return (
            <div
              style={{ left: `${x}%`, top: `${y}%` }}
              className="absolute -translate-x-1/2 -translate-y-1/2 group z-30"
            >
              <div className="relative flex items-center justify-center w-9 h-9 rounded-full font-black text-xs text-white shadow-xl bg-emerald-600 ring-4 ring-emerald-200 transform group-hover:scale-125 transition-transform">
                S
              </div>
              <div className="absolute left-1/2 -translate-x-1/2 bottom-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none bg-white border border-emerald-300 rounded-lg p-2 shadow-xl w-48 z-40">
                <p className="text-[11px] font-black text-emerald-800 flex items-center gap-1"><Rocket className="w-3 h-3 text-emerald-600" /> Day Start Point</p>
                <p className="text-[10px] text-slate-700 font-bold truncate mt-0.5">{startLocation.name}</p>
              </div>
            </div>
          );
        })()}

        {/* EVENT NODES */}
        {scheduledLocs.map(({ item, loc }) => {
          if (!loc) return null;
          const { x, y } = getXY(loc.latitude, loc.longitude);
          const isSelected = selectedItemId === item.id;

          return (
            <div
              key={item.id}
              onClick={() => onSelectItem && onSelectItem(item.id)}
              style={{ left: `${x}%`, top: `${y}%` }}
              className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-20"
            >
              <div
                className={`relative flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full font-bold text-xs text-white shadow-md transition-all duration-300 transform group-hover:scale-125 ${
                  isSelected
                    ? 'bg-amber-500 ring-4 ring-amber-200 scale-125'
                    : item.event.isFixed
                    ? 'bg-rose-600 ring-2 ring-rose-200'
                    : 'bg-blue-600 ring-2 ring-blue-200'
                }`}
              >
                {item.sequence}
              </div>

              <div className="absolute left-1/2 -translate-x-1/2 bottom-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none bg-white border border-slate-200 rounded-lg p-2 shadow-xl w-44 z-30">
                <p className="text-[11px] font-bold text-slate-800 truncate">{item.event.title}</p>
                <p className="text-[10px] text-slate-500 truncate">{loc.name}</p>
                <div className="mt-1 flex items-center justify-between text-[9px] text-blue-600 font-semibold">
                  <span>Arr: {item.plannedArrival}</span>
                  <span>Dist: {formatDistance(item.travelDistanceMeters)}</span>
                </div>
              </div>
            </div>
          );
        })}

        {/* END HUB NODE */}
        {endLocation && (() => {
          const { x, y } = getXY(endLocation.latitude, endLocation.longitude);
          return (
            <div
              style={{ left: `${x}%`, top: `${y}%` }}
              className="absolute -translate-x-1/2 -translate-y-1/2 group z-30"
            >
              <div className="relative flex items-center justify-center w-9 h-9 rounded-full font-black text-xs text-white shadow-xl bg-purple-600 ring-4 ring-purple-200 transform group-hover:scale-125 transition-transform">
                E
              </div>
              <div className="absolute left-1/2 -translate-x-1/2 bottom-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none bg-white border border-purple-300 rounded-lg p-2 shadow-xl w-48 z-40">
                <p className="text-[11px] font-black text-purple-800 flex items-center gap-1"><Flag className="w-3 h-3 text-purple-600" /> Day End Point</p>
                <p className="text-[10px] text-slate-700 font-bold truncate mt-0.5">{endLocation.name}</p>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Footer Info Banner */}
      <div className="relative z-10 self-end bg-white/90 border border-slate-200 backdrop-blur-md px-3 py-1.5 rounded-xl text-right text-slate-700 text-xs shadow-sm">
        <p className="font-semibold text-slate-800">Guntur Campaign Bounds</p>
        <p className="text-[10px] text-slate-500">Live Routes & Start/End Hub Pins</p>
      </div>
    </div>
  );
}
