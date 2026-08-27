'use client';

import React, { useState, useEffect } from 'react';
import { LocationData } from '@/types';
import PlacesAutocomplete from '../locations/PlacesAutocomplete';
import { PlaceSearchResult } from '@/lib/google/places';
import { Clock, MapPin, Settings2, Check, X, Sparkles, Navigation, Play, Flag } from 'lucide-react';

export interface DaySettingsData {
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  startLocationId: string;
  endLocationId: string;
}

interface DaySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  locations: LocationData[];
  currentSettings: DaySettingsData;
  onSaveSettings: (newSettings: DaySettingsData) => void;
}

export default function DaySettingsModal({
  isOpen,
  onClose,
  locations,
  currentSettings,
  onSaveSettings,
}: DaySettingsModalProps) {
  const [startTime, setStartTime] = useState(currentSettings.startTime || '08:00');
  const [endTime, setEndTime] = useState(currentSettings.endTime || '20:00');
  const [startLocId, setStartLocId] = useState(currentSettings.startLocationId || locations[0]?.id || '');
  const [endLocId, setEndLocId] = useState(currentSettings.endLocationId || locations[0]?.id || '');

  useEffect(() => {
    if (currentSettings) {
      setStartTime(currentSettings.startTime || '08:00');
      setEndTime(currentSettings.endTime || '20:00');
      setStartLocId(currentSettings.startLocationId || locations[0]?.id || '');
      setEndLocId(currentSettings.endLocationId || locations[0]?.id || '');
    }
  }, [currentSettings, isOpen, locations]);

  if (!isOpen) return null;

  const handleSelectStartPlace = (place: PlaceSearchResult) => {
    const found = locations.find((l) => l.placeId === place.placeId || l.name === place.name);
    if (found) {
      setStartLocId(found.id);
    } else {
      const newLoc: LocationData = {
        id: `loc-${Date.now()}`,
        campaignId: 'cmp-ramakrishna-2026',
        name: place.name,
        address: place.formattedAddress,
        latitude: place.latitude,
        longitude: place.longitude,
        placeId: place.placeId,
        category: (place.category as any) || 'OTHER',
      };
      locations.push(newLoc);
      setStartLocId(newLoc.id);
    }
  };

  const handleSelectEndPlace = (place: PlaceSearchResult) => {
    const found = locations.find((l) => l.placeId === place.placeId || l.name === place.name);
    if (found) {
      setEndLocId(found.id);
    } else {
      const newLoc: LocationData = {
        id: `loc-${Date.now()}`,
        campaignId: 'cmp-ramakrishna-2026',
        name: place.name,
        address: place.formattedAddress,
        latitude: place.latitude,
        longitude: place.longitude,
        placeId: place.placeId,
        category: (place.category as any) || 'OTHER',
      };
      locations.push(newLoc);
      setEndLocId(newLoc.id);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings({
      startTime,
      endTime,
      startLocationId: startLocId,
      endLocationId: endLocId,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-150 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Settings2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Campaign Day Start & End Settings</h3>
              <p className="text-xs text-slate-500">Configure default departure & arrival hubs with working hours</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {/* Day Departure Settings */}
          <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-200/80 space-y-3">
            <div className="flex items-center gap-2 text-xs font-extrabold text-emerald-800 uppercase tracking-wider">
              <Play className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" /> Day Departure Hub & Start Time
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-emerald-600" /> Day Start Time
                </label>
                <input
                  type="time"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" /> Existing Start Hub
                </label>
                <select
                  value={startLocId}
                  onChange={(e) => setStartLocId(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-600 mb-1 block">
                Or Search Google Maps for a new Start Hub:
              </label>
              <PlacesAutocomplete
                onSelectPlace={handleSelectStartPlace}
                placeholder="Search starting location (e.g. MP Residence, Guntur Party Office)..."
              />
            </div>
          </div>

          {/* Day Return Settings */}
          <div className="p-3.5 bg-purple-50/60 rounded-xl border border-purple-200/80 space-y-3">
            <div className="flex items-center gap-2 text-xs font-extrabold text-purple-800 uppercase tracking-wider">
              <Flag className="w-3.5 h-3.5 text-purple-600" /> Day Return Hub & End Time
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-purple-600" /> Day End Time
                </label>
                <input
                  type="time"
                  required
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-purple-600" /> Existing End Hub
                </label>
                <select
                  value={endLocId}
                  onChange={(e) => setEndLocId(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                >
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-600 mb-1 block">
                Or Search Google Maps for a new Return Hub:
              </label>
              <PlacesAutocomplete
                onSelectPlace={handleSelectEndPlace}
                placeholder="Search return location (e.g. Amaravati Guest House)..."
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md flex items-center gap-1.5 transition-all"
            >
              <Check className="w-4 h-4" /> Save Start & End Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
