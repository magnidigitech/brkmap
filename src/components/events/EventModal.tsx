'use client';

import React, { useState, useEffect } from 'react';
import { EventData, LocationData } from '@/types';
import PlacesAutocomplete from '../locations/PlacesAutocomplete';
import { PlaceSearchResult } from '@/lib/google/places';
import { timeStringToMinutes } from '@/lib/optimizer/constraints';
import { Plus, X, Calendar, Clock, MapPin, AlertCircle, Lock, Sliders, Check, Sparkles, Edit3 } from 'lucide-react';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  locations: LocationData[];
  onAddEvent: (event: EventData) => void;
  onUpdateEvent?: (event: EventData) => void;
  eventToEdit?: EventData | null;
  allEvents?: EventData[];
}

export default function EventModal({
  isOpen,
  onClose,
  locations,
  onAddEvent,
  onUpdateEvent,
  eventToEdit,
  allEvents = [],
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

  // Helper to calculate duration in minutes between start and end times
  const calculateDurationFromTimes = (startStr: string, endStr: string): number => {
    if (!startStr || !endStr) return 45;
    const [sh, sm] = startStr.split(':').map(Number);
    const [eh, em] = endStr.split(':').map(Number);
    if (isNaN(sh) || isNaN(sm) || isNaN(eh) || isNaN(em)) return 45;

    let startMins = sh * 60 + sm;
    let endMins = eh * 60 + em;
    if (endMins <= startMins) {
      endMins += 24 * 60; // Handle overnight boundary
    }
    const diff = endMins - startMins;
    return diff > 0 ? diff : 45;
  };

  // Helper to detect if chosen fixed time range overlaps with any other fixed event
  const getConflictingEventName = (): string | null => {
    if (!isFixed || !allEvents || allEvents.length === 0) return null;
    const startMins = timeStringToMinutes(fixedStart);
    const endMins = timeStringToMinutes(fixedEnd);

    for (const evt of allEvents) {
      if (eventToEdit && evt.id === eventToEdit.id) continue;
      if (!evt.isFixed) continue;

      const evtStart = timeStringToMinutes(evt.fixedStart || evt.preferredStart || '10:00');
      const evtEnd = timeStringToMinutes(evt.fixedEnd || evt.preferredEnd || '11:00');

      if (startMins < evtEnd && evtStart < endMins) {
        return evt.title;
      }
    }
    return null;
  };

  useEffect(() => {
    if (eventToEdit) {
      setTitle(eventToEdit.title);
      setEventType(eventToEdit.eventType);
      setDurationMinutes(eventToEdit.durationMinutes);
      setPriority(eventToEdit.priority);
      setIsFixed(eventToEdit.isFixed);
      const fs = eventToEdit.fixedStart || '10:00';
      const fe = eventToEdit.fixedEnd || '11:00';
      setFixedStart(fs);
      setFixedEnd(fe);
      if (eventToEdit.isFixed) {
        setDurationMinutes(calculateDurationFromTimes(fs, fe));
      }
      setSelectedLocId(eventToEdit.locationId);
      setDescription(eventToEdit.description || '');
    } else {
      setTitle('');
      setEventType('MEETING');
      setDurationMinutes(45);
      setPriority(75);
      setIsFixed(false);
      setFixedStart('10:00');
      setFixedEnd('11:00');
      setSelectedLocId(locations[0]?.id || '');
      setDescription('');
    }
  }, [eventToEdit, isOpen, locations]);

  if (!isOpen) return null;

  const conflictingTitle = getConflictingEventName();

  const handleToggleFixed = (fixed: boolean) => {
    setIsFixed(fixed);
    if (fixed) {
      const calculated = calculateDurationFromTimes(fixedStart, fixedEnd);
      setDurationMinutes(calculated);
    }
  };

  const handleFixedStartChange = (val: string) => {
    setFixedStart(val);
    const calculated = calculateDurationFromTimes(val, fixedEnd);
    setDurationMinutes(calculated);
  };

  const handleFixedEndChange = (val: string) => {
    setFixedEnd(val);
    const calculated = calculateDurationFromTimes(fixedStart, val);
    setDurationMinutes(calculated);
  };

  const handleSelectPlace = (place: PlaceSearchResult) => {
    const found = locations.find((l) => l.placeId === place.placeId || l.name === place.name);
    if (found) {
      setSelectedLocId(found.id);
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
      setSelectedLocId(newLoc.id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    let targetLocId = selectedLocId;
    let chosenLoc = locations.find((l) => l.id === targetLocId);

    if (!chosenLoc) {
      chosenLoc = {
        id: `loc-${Date.now()}`,
        campaignId: 'cmp-ramakrishna-2026',
        name: title + ' Location',
        address: 'Guntur, AP',
        latitude: 16.3067,
        longitude: 80.4365,
        category: 'MEETING_HALL',
      };
      locations.push(chosenLoc);
      targetLocId = chosenLoc.id;
    }

    const calculatedDuration = isFixed
      ? calculateDurationFromTimes(fixedStart, fixedEnd)
      : Number(durationMinutes);

    const eventPayload: EventData = {
      id: eventToEdit ? eventToEdit.id : `evt-${Date.now()}`,
      campaignId: 'cmp-ramakrishna-2026',
      locationId: targetLocId,
      title,
      description,
      eventType,
      date: '2026-08-28',
      preferredStart: isFixed ? fixedStart : '09:00',
      preferredEnd: isFixed ? fixedEnd : '17:00',
      fixedStart: isFixed ? fixedStart : null,
      fixedEnd: isFixed ? fixedEnd : null,
      durationMinutes: calculatedDuration,
      priority: Number(priority),
      isFixed,
      isFlexible: !isFixed,
      status: eventToEdit ? eventToEdit.status : 'PLANNED',
      location: chosenLoc,
    };

    if (eventToEdit && onUpdateEvent) {
      onUpdateEvent(eventPayload);
    } else {
      onAddEvent(eventPayload);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-150 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${eventToEdit ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
              {eventToEdit ? <Edit3 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                {eventToEdit ? 'Edit Campaign Event' : 'Add Campaign Event'}
              </h3>
              <p className="text-xs text-slate-500">
                {eventToEdit ? 'Update event details, timing, priority & venue' : 'Schedule meetings, village visits, rallies, or press meets'}
              </p>
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
          {/* 1. Event Title */}
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

          {/* 2. Location Picker */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-rose-500" /> Location (Google Places Search)
            </label>

            <PlacesAutocomplete onSelectPlace={handleSelectPlace} />

            {locations.length > 0 && (
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
            )}
          </div>

          {/* 3. Schedule Mode */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-600" /> Schedule Mode
              </span>
              <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
                <button
                  type="button"
                  onClick={() => handleToggleFixed(false)}
                  className={`px-2.5 py-0.5 rounded-md text-[11px] font-semibold transition-all ${
                    !isFixed ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-800'
                  }`}
                >
                  Flexible
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleFixed(true)}
                  className={`px-2.5 py-0.5 rounded-md text-[11px] font-semibold transition-all ${
                    isFixed ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-800'
                  }`}
                >
                  Fixed Time
                </button>
              </div>
            </div>

            {isFixed && (
              <div className="space-y-2 pt-1">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-700 mb-0.5 block">Fixed Start Time</label>
                    <input
                      type="time"
                      value={fixedStart}
                      onChange={(e) => handleFixedStartChange(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-700 mb-0.5 block">Fixed End Time</label>
                    <input
                      type="time"
                      value={fixedEnd}
                      onChange={(e) => handleFixedEndChange(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                    />
                  </div>
                </div>

                <div className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 flex items-center justify-between">
                  <span>Calculated Duration:</span>
                  <span className="font-extrabold">{durationMinutes} minutes</span>
                </div>

                {conflictingTitle && (
                  <div className="p-2 rounded-lg bg-rose-100 border border-rose-300 text-rose-900 text-[11px] font-bold flex items-center gap-1.5 animate-pulse">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>⚠️ Warning: {fixedStart} – {fixedEnd} overlaps with existing event "{conflictingTitle}"! Please adjust times.</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 4. Event Type & Duration */}
          <div className={!isFixed ? 'grid grid-cols-2 gap-2.5' : 'block'}>
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

            {!isFixed && (
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
            )}
          </div>

          {/* 5. Priority Score */}
          <div>
            <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
              <span>Priority Score</span>
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
              className={`px-5 py-2 rounded-xl text-white font-semibold text-xs shadow-md flex items-center gap-1.5 transition-all ${
                eventToEdit ? 'bg-amber-600 hover:bg-amber-700' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              <Check className="w-4 h-4" /> {eventToEdit ? 'Update Event' : 'Save Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
