'use client';

import React, { useState } from 'react';
import { EventData, LocationData } from '@/types';
import PlacesAutocomplete from '../locations/PlacesAutocomplete';
import { PlaceSearchResult } from '@/lib/google/places';
import { Plus, X, Calendar, Clock, MapPin, AlertCircle, Lock, Sliders, Check, Sparkles } from 'lucide-react';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  locations: LocationData[];
  onAddEvent: (event: EventData) => void;
}

export default function EventModal({
  isOpen,
  onClose,
  locations,
  onAddEvent,
}: EventModalProps) {
  const [title, setTitle] = useState('');
  const [eventType, setEventType] = useState<EventData['eventType']>('MEETING');
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [priority, setPriority] = useState(75);
  const [isFixed, setIsFixed] = useState(false);
  const [fixedStart, setFixedStart] = useState('10:00');
  const [fixedEnd, setFixedEnd] = useState('11:00');
  const [selectedLocId, setSelectedLocId] = useState(locations[0]?.id || '');
  const [description, setDescription] = useState('');

  if (!isOpen) return null;

  const handleSelectPlace = (place: PlaceSearchResult) => {
    const found = locations.find((l) => l.placeId === place.placeId || l.name === place.name);
    if (found) {
      setSelectedLocId(found.id);
    } else {
      const newLoc: LocationData = {
        id: `loc-${Date.now()}`,
        campaignId: 'cmp-guntur-2026',
        name: place.name,
        address: place.formattedAddress,
        latitude: place.latitude,
        longitude: place.longitude,
        placeId: place.placeId,
        category: (place.category as any) || 'OTHER',
      };
      locations.push(newLoc);
      setSelectedLocId(newLoc.id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !selectedLocId) return;

    const chosenLoc = locations.find((l) => l.id === selectedLocId);

    const newEvent: EventData = {
      id: `evt-${Date.now()}`,
      campaignId: 'cmp-guntur-2026',
      locationId: selectedLocId,
      title,
      description,
      eventType,
      date: '2026-08-28',
      preferredStart: isFixed ? fixedStart : '09:00',
      preferredEnd: isFixed ? fixedEnd : '17:00',
      fixedStart: isFixed ? fixedStart : null,
      fixedEnd: isFixed ? fixedEnd : null,
      durationMinutes: Number(durationMinutes),
      priority: Number(priority),
      isFixed,
      isFlexible: !isFixed,
      status: 'PLANNED',
      location: chosenLoc,
    };

    onAddEvent(newEvent);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-150 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Add Campaign Event</h3>
              <p className="text-xs text-slate-500">Schedule meetings, village visits, rallies, or press meets</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Event Title */}
          <div>
            <label className="text-xs font-bold text-slate-700 mb-1 block">Event Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Mangalagiri Weavers Public Gathering"
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Location Picker */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-rose-500" /> Location (Google Places Search)
            </label>

            <PlacesAutocomplete onSelectPlace={handleSelectPlace} />

            <div className="flex items-center gap-2 mt-1">
              <span className="text-[11px] text-slate-500">Or pick existing:</span>
              <select
                value={selectedLocId}
                onChange={(e) => setSelectedLocId(e.target.value)}
                className="flex-1 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} ({loc.category})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Event Type & Duration */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-xs font-bold text-slate-700 mb-1 block">Event Type</label>
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value as any)}
                className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="PUBLIC_MEETING">Public Mega Rally</option>
                <option value="VIP_MEETING">VIP / Official Meeting</option>
                <option value="VILLAGE_VISIT">Village Walkthrough</option>
                <option value="PRESS_CONF">Media Press Briefing</option>
                <option value="DOOR_TO_DOOR">Door-to-Door Campaign</option>
                <option value="BREAK_REST">Break / Rest Period</option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700">Duration (minutes)</label>
                <button
                  type="button"
                  onClick={() => setDurationMinutes(42)}
                  className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200 hover:bg-blue-100 transition-colors flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3 text-blue-600" /> Rec: 42m
                </button>
              </div>
              <input
                type="number"
                min="15"
                max="240"
                step="15"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Schedule Constraint Type: Fixed vs Flexible */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-600" /> Schedule Mode
              </span>
              <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
                <button
                  type="button"
                  onClick={() => setIsFixed(false)}
                  className={`px-2.5 py-0.5 rounded-md text-[11px] font-semibold transition-all ${
                    !isFixed ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-800'
                  }`}
                >
                  Flexible
                </button>
                <button
                  type="button"
                  onClick={() => setIsFixed(true)}
                  className={`px-2.5 py-0.5 rounded-md text-[11px] font-semibold transition-all ${
                    isFixed ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-800'
                  }`}
                >
                  Fixed Time
                </button>
              </div>
            </div>

            {isFixed && (
              <div className="grid grid-cols-2 gap-2 pt-1.5">
                <div>
                  <label className="text-[10px] text-slate-500 mb-0.5 block">Fixed Start Time</label>
                  <input
                    type="time"
                    value={fixedStart}
                    onChange={(e) => setFixedStart(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-800"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 mb-0.5 block">Fixed End Time</label>
                  <input
                    type="time"
                    value={fixedEnd}
                    onChange={(e) => setFixedEnd(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-800"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Priority Slider */}
          <div>
            <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
              <span>Political Priority Score</span>
              <span className="text-blue-600">{priority}/100</span>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              step="5"
              value={priority}
              onChange={(e) => setPriority(Number(e.target.value))}
              className="w-full accent-blue-600 bg-slate-200 rounded-lg h-2"
            />
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
              <Check className="w-4 h-4" /> Save Event
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
