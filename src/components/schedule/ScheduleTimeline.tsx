'use client';

import React from 'react';
import { EventData, LocationData, ScheduleItemData } from '@/types';
import { formatDistance, formatDuration, timeStringToMinutes, minutesToTimeString } from '@/lib/optimizer/constraints';
import { calculateHaversineDistance, estimateDrivingDuration } from '@/lib/google/routes';
import { Clock, MapPin, Navigation, Lock, ShieldAlert, Calendar, Trash2, Edit3, PhoneCall, CheckCircle, AlertTriangle, FastForward, Play, Plus, Flag, Rocket, Zap, Navigation2 } from 'lucide-react';

interface ScheduleTimelineProps {
  items: ScheduleItemData[];
  selectedItemId?: string | null;
  onSelectItem?: (itemId: string) => void;
  onEditEvent?: (event: EventData) => void;
  onDeleteEvent?: (eventId: string) => void;
  onOpenContacts?: (item: ScheduleItemData) => void;
  onAddEventClick?: () => void;
  onAutoAdjustEvents?: (eventsToUpdate: EventData[]) => void;
  startLocation?: LocationData | null;
  endLocation?: LocationData | null;
  startTime?: string;
  endTime?: string;
}

export default function ScheduleTimeline({
  items,
  selectedItemId,
  onSelectItem,
  onEditEvent,
  onDeleteEvent,
  onOpenContacts,
  onAddEventClick,
  onAutoAdjustEvents,
  startLocation,
  endLocation,
  startTime = '08:00',
  endTime = '20:00',
}: ScheduleTimelineProps) {
  const hasItems = items && items.length > 0;

  // Detect Direct Time Overlaps & Travel Time Feasibility Conflicts
  const overlappingEventIds = new Set<string>();
  const travelConflictEventIds = new Set<string>();
  const conflictDetails: Array<{
    id1: string;
    id2: string;
    title1: string;
    title2: string;
    type: 'OVERLAP' | 'TRAVEL';
    message: string;
    recommendedStart2?: string;
    recommendedEnd1?: string;
    event1Obj?: EventData;
    event2Obj?: EventData;
  }> = [];

  if (hasItems) {
    for (let i = 0; i < items.length; i++) {
      const item1 = items[i];
      const start1 = timeStringToMinutes(item1.plannedArrival);
      const end1 = timeStringToMinutes(item1.plannedDeparture);

      // Check 1: Direct Overlap condition with subsequent items
      for (let j = i + 1; j < items.length; j++) {
        const item2 = items[j];
        const start2 = timeStringToMinutes(item2.plannedArrival);
        const end2 = timeStringToMinutes(item2.plannedDeparture);

        if (start1 < end2 && start2 < end1) {
          overlappingEventIds.add(item1.event.id);
          overlappingEventIds.add(item2.event.id);
          conflictDetails.push({
            id1: item1.event.id,
            id2: item2.event.id,
            title1: item1.event.title,
            title2: item2.event.title,
            type: 'OVERLAP',
            message: `"${item1.event.title}" and "${item2.event.title}" are scheduled at the exact same time (${item1.plannedArrival}–${item1.plannedDeparture}).`,
          });
        }
      }

      // Check 2: Travel Feasibility between consecutive stops
      if (i < items.length - 1) {
        const nextItem = items[i + 1];
        const prevDepMins = timeStringToMinutes(item1.plannedDeparture);
        const travelMins = Math.ceil(nextItem.travelSeconds / 60);
        const earliestArrivalAtNext = prevDepMins + travelMins;

        if (nextItem.event.isFixed && nextItem.event.fixedStart) {
          const nextFixedStartMins = timeStringToMinutes(nextItem.event.fixedStart);
          if (earliestArrivalAtNext > nextFixedStartMins) {
            const lateness = earliestArrivalAtNext - nextFixedStartMins;
            travelConflictEventIds.add(nextItem.event.id);
            travelConflictEventIds.add(item1.event.id);

            const recommendedStart2 = minutesToTimeString(earliestArrivalAtNext);
            const recommendedEnd1 = minutesToTimeString(nextFixedStartMins - travelMins);

            conflictDetails.push({
              id1: item1.event.id,
              id2: nextItem.event.id,
              title1: item1.event.title,
              title2: nextItem.event.title,
              type: 'TRAVEL',
              message: `Departure from "${item1.event.title}" (${item1.plannedDeparture}) + ${travelMins}m travel time means candidate arrives at ${recommendedStart2}, missing "${nextItem.event.title}" fixed start time (${nextItem.event.fixedStart}) by ${lateness}m!`,
              recommendedStart2,
              recommendedEnd1,
              event1Obj: item1.event,
              event2Obj: nextItem.event,
            });
          }
        }
      }
    }
  }

  // Auto-adjust action: Shift Event 2 Start Time
  const handleShiftNextEventStart = (evt2: EventData, newStart: string) => {
    if (!onAutoAdjustEvents) return;
    const dur = evt2.durationMinutes;
    const startMins = timeStringToMinutes(newStart);
    const newEnd = minutesToTimeString(startMins + dur);

    const updatedEvt: EventData = {
      ...evt2,
      fixedStart: newStart,
      fixedEnd: newEnd,
      preferredStart: newStart,
      preferredEnd: newEnd,
    };
    onAutoAdjustEvents([updatedEvt]);
  };

  // Auto-adjust action: End Event 1 Early
  const handleEndPrevEventEarly = (evt1: EventData, newEnd: string) => {
    if (!onAutoAdjustEvents) return;
    const startMins = timeStringToMinutes(evt1.fixedStart || evt1.preferredStart || '10:00');
    const endMins = timeStringToMinutes(newEnd);
    const newDur = Math.max(15, endMins - startMins);

    const updatedEvt: EventData = {
      ...evt1,
      fixedEnd: newEnd,
      preferredEnd: newEnd,
      durationMinutes: newDur,
    };
    onAutoAdjustEvents([updatedEvt]);
  };

  // Calculate Start Hub -> Stop 1 distance and recommended departure time
  let startTravelMeters = 0;
  let startTravelSeconds = 0;
  let recommendedLeaveTime = startTime;

  if (startLocation && hasItems && items[0]?.event?.location) {
    const loc1 = items[0].event.location;
    startTravelMeters = calculateHaversineDistance(
      startLocation.latitude,
      startLocation.longitude,
      loc1.latitude,
      loc1.longitude
    );
    startTravelSeconds = estimateDrivingDuration(startTravelMeters);

    const travelMins = Math.ceil(startTravelSeconds / 60);
    const dayStartMins = timeStringToMinutes(startTime);

    if (items[0].event.isFixed && items[0].event.fixedStart) {
      const fixedStartMins = timeStringToMinutes(items[0].event.fixedStart);
      const leaveForFixed = fixedStartMins - travelMins - 10;
      recommendedLeaveTime = minutesToTimeString(Math.max(dayStartMins, leaveForFixed));
    } else {
      recommendedLeaveTime = startTime;
    }
  }

  // Calculate Last Stop -> End Hub distance and expected arrival time
  let endTravelMeters = 0;
  let endTravelSeconds = 0;
  let expectedReturnArrival = endTime;

  if (endLocation && hasItems && items[items.length - 1]?.event?.location) {
    const lastLoc = items[items.length - 1].event.location!;
    endTravelMeters = calculateHaversineDistance(
      lastLoc.latitude,
      lastLoc.longitude,
      endLocation.latitude,
      endLocation.longitude
    );
    endTravelSeconds = estimateDrivingDuration(endTravelMeters);

    const lastDepartureMins = timeStringToMinutes(items[items.length - 1].plannedDeparture);
    const travelMins = Math.ceil(endTravelSeconds / 60);
    expectedReturnArrival = minutesToTimeString(lastDepartureMins + travelMins);
  }

  const getEventTypeTag = (type: string) => {
    switch (type) {
      case 'PUBLIC_MEETING':
        return 'Public Rally';
      case 'VIP_MEETING':
        return 'VIP Meeting';
      case 'VILLAGE_VISIT':
        return 'Village Visit';
      case 'PRESS_CONF':
        return 'Media Press';
      default:
        return 'Campaign Event';
    }
  };

  return (
    <div className="space-y-3 relative pl-6 sm:pl-8 pr-0.5 max-w-full overflow-hidden font-sans">
      {/* TIME CONFLICT WARNING BANNER */}
      {conflictDetails.length > 0 && (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-950 shadow-sm space-y-2.5 max-w-full overflow-hidden">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-rose-900">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Schedule Feasibility Alert ({conflictDetails.length} Issue{conflictDetails.length > 1 ? 's' : ''})</span>
            </div>
            <span className="text-[10px] font-bold bg-rose-600 text-white px-2 py-0.5 rounded-full uppercase tracking-wider">Action Required</span>
          </div>

          <div className="space-y-2 text-[11px] sm:text-xs text-rose-900 font-medium">
            {conflictDetails.map((c, idx) => (
              <div key={idx} className="block leading-relaxed bg-white/90 p-3 rounded-xl border border-rose-200/80 shadow-xs text-rose-950 space-y-2">
                <p className="text-slate-800">
                  • <strong className="font-extrabold text-slate-900">{c.message}</strong>
                </p>

                {c.type === 'TRAVEL' && c.event1Obj && c.event2Obj && c.recommendedStart2 && (
                  <div className="pt-1.5 flex items-center gap-2 flex-wrap border-t border-rose-100">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Quick Adjust:</span>
                    <button
                      type="button"
                      onClick={() => handleShiftNextEventStart(c.event2Obj!, c.recommendedStart2!)}
                      className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-[10px] shadow-xs transition-all flex items-center gap-1"
                    >
                      <Zap className="w-3 h-3 text-amber-300" /> Shift "{c.title2}" Start to {c.recommendedStart2}
                    </button>

                    {c.recommendedEnd1 && (
                      <button
                        type="button"
                        onClick={() => handleEndPrevEventEarly(c.event1Obj!, c.recommendedEnd1!)}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 font-semibold text-[10px] shadow-xs transition-all flex items-center gap-1"
                      >
                        <Clock className="w-3 h-3 text-slate-600" /> End "{c.title1}" Early at {c.recommendedEnd1}
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Connecting Timeline Line */}
      <div className="absolute left-2.5 sm:left-3.5 top-6 bottom-6 w-0.5 bg-slate-200 pointer-events-none" />

      {/* DAY START POINT (DEPARTURE HUB) */}
      {startLocation && (
        <div className="relative">
          <div className="p-3.5 sm:p-4 rounded-2xl border border-slate-200 bg-slate-900 text-white shadow-sm hover:shadow-md transition-all min-w-0">
            {/* Start Pin Badge */}
            <div className="absolute -left-6 sm:-left-8 top-4 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-[10px] shadow-md ring-2 ring-white">
              <Rocket className="w-3 h-3 text-white" />
            </div>

            <div className="flex items-start justify-between flex-wrap sm:flex-nowrap gap-2 min-w-0">
              <div className="min-w-0 flex-1">
                <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wider flex items-center gap-1 w-fit">
                  <Rocket className="w-2.5 h-2.5" /> Day Departure Hub
                </span>
                <h4 className="text-xs sm:text-sm font-bold text-white mt-1 truncate">
                  {startLocation.name}
                </h4>
                {startLocation.address && (
                  <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 flex items-center gap-1 min-w-0">
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate max-w-[180px] sm:max-w-xs block">{startLocation.address}</span>
                  </p>
                )}
              </div>

              <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-200 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700 whitespace-nowrap shrink-0">
                <Clock className="w-3 h-3 text-emerald-400" />
                <span>Leave at {recommendedLeaveTime}</span>
              </div>
            </div>
          </div>

          {/* Travel Connector to Stop 1 */}
          {hasItems && (
            <div className="py-1.5 px-3 flex items-center justify-between gap-1 text-[10px] sm:text-[11px] text-slate-600 bg-slate-100/80 my-1.5 rounded-xl border border-slate-200/60 min-w-0">
              <div className="flex items-center gap-1.5 font-medium truncate">
                <Navigation2 className="w-3 h-3 text-slate-500 shrink-0" />
                <span className="truncate">Travel to Stop 1: {formatDistance(startTravelMeters)} ({formatDuration(startTravelSeconds)})</span>
              </div>
              <span className="font-semibold text-slate-700 shrink-0">Leave {recommendedLeaveTime} → Arrive {items[0].plannedArrival}</span>
            </div>
          )}
        </div>
      )}

      {/* EMPTY EVENTS STATE */}
      {!hasItems && (
        <div className="flex flex-col items-center justify-center p-6 sm:p-10 text-center border border-dashed border-slate-300 rounded-2xl bg-white space-y-3">
          <Calendar className="w-8 h-8 text-slate-400" />
          <h4 className="text-sm font-bold text-slate-800">No Events Added Yet</h4>
          <p className="text-xs text-slate-500 max-w-xs">
            Add campaign meetings or rallies to calculate exact travel times from your Start Hub.
          </p>
          {onAddEventClick && (
            <button
              type="button"
              onClick={onAddEventClick}
              className="mt-1 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-xs transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Add Campaign Event
            </button>
          )}
        </div>
      )}

      {/* SCHEDULED CAMPAIGN EVENTS */}
      {hasItems &&
        items.map((item, index) => {
          const isSelected = selectedItemId === item.id;
          const loc = item.event.location;
          const isCompleted = item.execution?.status === 'COMPLETED';
          const isOverlapping = overlappingEventIds.has(item.event.id);
          const isTravelConflict = travelConflictEventIds.has(item.event.id);
          const isIssue = isOverlapping || isTravelConflict;

          return (
            <div key={item.id} className="relative">
              <div
                onClick={() => onSelectItem && onSelectItem(item.id)}
                className={`group relative p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md min-w-0 space-y-2.5 ${
                  isCompleted
                    ? 'bg-slate-50 opacity-75 border-slate-200'
                    : isIssue
                    ? 'bg-rose-50/60 border-rose-300 ring-1 ring-rose-200'
                    : isSelected
                    ? 'bg-blue-50/40 border-blue-400 ring-1 ring-blue-300'
                    : 'bg-white hover:border-slate-300 border-slate-200/80'
                }`}
              >
                {/* Sequence Badge */}
                <div
                  className={`absolute -left-6 sm:-left-8 top-4 w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center font-bold text-[10px] text-white shadow-xs ${
                    isCompleted
                      ? 'bg-emerald-600'
                      : isIssue
                      ? 'bg-rose-600 ring-2 ring-rose-100'
                      : 'bg-slate-900'
                  }`}
                >
                  {item.sequence}
                </div>

                {/* Card Header: Title & Time */}
                <div className="flex items-start justify-between gap-2 min-w-0">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap mb-1">
                      <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/60">
                        {getEventTypeTag(item.event.eventType)}
                      </span>

                      {item.event.isFixed && (
                        <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200/80 flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5" /> Fixed
                        </span>
                      )}

                      {isIssue && (
                        <span className="text-[10px] font-bold text-rose-800 bg-rose-100 px-2 py-0.5 rounded-md border border-rose-300 flex items-center gap-1">
                          <AlertTriangle className="w-2.5 h-2.5 text-rose-600" /> Conflict
                        </span>
                      )}
                    </div>

                    <h4 className={`text-xs sm:text-sm font-bold transition-colors ${isCompleted ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                      {item.event.title}
                    </h4>
                  </div>

                  <div className="text-right shrink-0">
                    <div className={`text-xs font-bold px-2.5 py-1 rounded-lg border whitespace-nowrap ${isIssue ? 'bg-rose-100 text-rose-950 border-rose-300' : 'bg-slate-100 text-slate-900 border-slate-200/80'}`}>
                      {item.plannedArrival} – {item.plannedDeparture}
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">{item.event.durationMinutes}m duration</p>
                  </div>
                </div>

                {/* Location Full-Width Address Row */}
                {loc && (
                  <div className="text-xs text-slate-600 bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/60 flex items-start gap-1.5 min-w-0">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-800 truncate">{loc.name}</p>
                      {loc.address && <p className="text-[10px] text-slate-500 truncate">{loc.address}</p>}
                    </div>
                  </div>
                )}

                {/* Dedicated Action Buttons Row (No Squishing or Overlapping) */}
                <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-xs">
                  <div className="flex items-center gap-2">
                    {onOpenContacts && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenContacts(item);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[10px] flex items-center gap-1 border border-slate-200/80 transition-colors"
                      >
                        <PhoneCall className="w-3 h-3 text-slate-500" /> Contact Organizer
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {onEditEvent && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditEvent(item.event);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-[10px] flex items-center gap-1 border border-slate-200/80 transition-colors"
                        title="Edit Event Time & Location"
                      >
                        <Edit3 className="w-3 h-3 text-slate-500" /> Edit
                      </button>
                    )}

                    {onDeleteEvent && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteEvent(item.event.id);
                        }}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Remove Event"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Minimalist Travel Connector */}
              {index < items.length - 1 && (
                <div className="py-1 px-3 flex items-center justify-between gap-1 text-[10px] text-slate-500 bg-slate-100/60 my-1 rounded-lg border border-slate-200/50 min-w-0">
                  <span className="font-medium truncate">
                    🚗 Travel: {formatDistance(items[index + 1].travelDistanceMeters)} ({formatDuration(items[index + 1].travelSeconds)})
                  </span>
                  <span className="font-medium shrink-0">Buffer: {formatDuration(items[index + 1].bufferSeconds)}</span>
                </div>
              )}
            </div>
          );
        })}

      {/* DAY END POINT (RETURN HUB) */}
      {endLocation && (
        <div className="relative">
          {hasItems && (
            <div className="py-1.5 px-3 flex items-center justify-between gap-1 text-[10px] text-slate-600 bg-slate-100/80 my-1.5 rounded-xl border border-slate-200/60 min-w-0">
              <span className="font-medium truncate">Return Travel: {formatDistance(endTravelMeters)} ({formatDuration(endTravelSeconds)})</span>
              <span className="font-semibold text-slate-700 shrink-0">Arrive End Hub: {expectedReturnArrival}</span>
            </div>
          )}

          <div className="p-3.5 sm:p-4 rounded-2xl border border-slate-200 bg-slate-900 text-white shadow-sm hover:shadow-md transition-all min-w-0">
            {/* End Pin Badge */}
            <div className="absolute -left-6 sm:-left-8 top-4 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-purple-500 text-white flex items-center justify-center font-bold text-[10px] shadow-md ring-2 ring-white">
              <Flag className="w-3 h-3 text-white" />
            </div>

            <div className="flex items-start justify-between flex-wrap sm:flex-nowrap gap-2 min-w-0">
              <div className="min-w-0 flex-1">
                <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase tracking-wider flex items-center gap-1 w-fit">
                  <Flag className="w-2.5 h-2.5" /> Day Return Hub
                </span>
                <h4 className="text-xs sm:text-sm font-bold text-white mt-1 truncate">
                  {endLocation.name}
                </h4>
                {endLocation.address && (
                  <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 flex items-center gap-1 min-w-0">
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate max-w-[180px] sm:max-w-xs block">{endLocation.address}</span>
                  </p>
                )}
              </div>

              <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-200 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700 whitespace-nowrap shrink-0">
                <Clock className="w-3 h-3 text-purple-400" />
                <span>Return at {expectedReturnArrival}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
