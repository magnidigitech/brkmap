'use client';

import React from 'react';
import { EventData, LocationData, ScheduleItemData } from '@/types';
import { formatDistance, formatDuration, timeStringToMinutes, minutesToTimeString } from '@/lib/optimizer/constraints';
import { calculateHaversineDistance, estimateDrivingDuration } from '@/lib/google/routes';
import { Clock, MapPin, Navigation, Lock, ShieldAlert, Calendar, Trash2, Edit3, PhoneCall, CheckCircle, AlertTriangle, FastForward, Play, Plus, Flag, Rocket } from 'lucide-react';

interface ScheduleTimelineProps {
  items: ScheduleItemData[];
  selectedItemId?: string | null;
  onSelectItem?: (itemId: string) => void;
  onEditEvent?: (event: EventData) => void;
  onDeleteEvent?: (eventId: string) => void;
  onOpenContacts?: (item: ScheduleItemData) => void;
  onAddEventClick?: () => void;
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
  startLocation,
  endLocation,
  startTime = '08:00',
  endTime = '20:00',
}: ScheduleTimelineProps) {
  const hasItems = items && items.length > 0;

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
      // For flexible events, departure is exactly at Day Start Time
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

  const getEventTypeBadge = (type: string) => {
    switch (type) {
      case 'PUBLIC_MEETING':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-100 text-purple-700 border border-purple-200">Public Rally</span>;
      case 'VIP_MEETING':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-100 text-rose-700 border border-rose-200">VIP Meeting</span>;
      case 'VILLAGE_VISIT':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200">Village Visit</span>;
      case 'PRESS_CONF':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700 border border-amber-200">Media Press</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-700 border border-blue-200">Campaign Event</span>;
    }
  };

  const getExecutionBadge = (item: ScheduleItemData) => {
    const status = item.execution?.status;
    if (status === 'COMPLETED') {
      return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1"><CheckCircle className="w-3 h-3 text-emerald-600" /> Completed</span>;
    }
    if (status === 'ARRIVED' || status === 'IN_PROGRESS') {
      return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300 flex items-center gap-1"><Play className="w-3 h-3 text-blue-600 animate-pulse" /> Active Stop</span>;
    }
    if (status === 'SKIPPED') {
      return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-300 flex items-center gap-1"><FastForward className="w-3 h-3" /> Skipped</span>;
    }
    if (item.execution?.delayMinutes && item.execution.delayMinutes > 10) {
      return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1"><AlertTriangle className="w-3 h-3 text-amber-600" /> +{item.execution.delayMinutes}m Delay</span>;
    }
    return null;
  };

  return (
    <div className="space-y-3 sm:space-y-4 relative pl-7 sm:pl-9 pr-0.5 max-w-full overflow-hidden">
      {/* Connecting Gradient Line */}
      <div className="absolute left-3 sm:left-4 top-6 bottom-6 w-0.5 bg-gradient-to-b from-emerald-500 via-blue-500 to-purple-600 opacity-40 pointer-events-none" />

      {/* DAY START POINT (DEPARTURE HUB) */}
      {startLocation && (
        <div className="relative">
          <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-emerald-300/80 bg-emerald-50/60 shadow-sm hover:shadow-md transition-all min-w-0">
            {/* Start Pin Badge */}
            <div className="absolute -left-7 sm:-left-9 top-3.5 sm:top-4 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black text-xs shadow-lg ring-2 sm:ring-4 ring-emerald-100">
              <Rocket className="w-3.5 h-3.5 text-white" />
            </div>

            <div className="flex items-start justify-between flex-wrap sm:flex-nowrap gap-2 min-w-0">
              <div className="min-w-0 flex-1">
                <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-emerald-600 text-white uppercase tracking-wider shadow-sm flex items-center gap-1 w-fit whitespace-nowrap">
                  <Rocket className="w-3 h-3" /> DAY DEPARTURE (START POINT)
                </span>
                <h4 className="text-xs sm:text-sm font-black text-slate-900 mt-1.5 truncate">
                  {startLocation.name}
                </h4>
                {startLocation.address && (
                  <p className="text-[10px] sm:text-[11px] text-slate-600 mt-0.5 flex items-center gap-1 min-w-0">
                    <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span className="truncate max-w-[180px] sm:max-w-xs md:max-w-md block">{startLocation.address}</span>
                  </p>
                )}
              </div>

              <div className="flex items-center gap-1 text-[11px] sm:text-xs font-bold text-emerald-900 bg-white px-2 py-1 rounded-lg border border-emerald-200 shadow-sm whitespace-nowrap shrink-0">
                <Clock className="w-3 h-3 text-emerald-600" />
                <span>Leave Hub at {recommendedLeaveTime}</span>
              </div>
            </div>
          </div>

          {/* Travel Connector to Stop 1 with Time & Distance */}
          {hasItems && (
            <div className="py-2 px-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[10px] sm:text-[11px] text-emerald-900 bg-emerald-100/70 my-1.5 rounded-xl border border-emerald-300/80 shadow-sm min-w-0">
              <div className="flex items-center gap-1.5 font-bold truncate">
                <Navigation className="w-3 h-3 text-emerald-700 shrink-0" />
                <span className="truncate">Travel to Stop 1: {formatDistance(startTravelMeters)} ({formatDuration(startTravelSeconds)})</span>
              </div>
              <div className="flex items-center gap-1 font-extrabold text-emerald-800 bg-white/80 px-2 py-0.5 rounded-md border border-emerald-200 whitespace-nowrap shrink-0 self-start sm:self-auto">
                <Clock className="w-3 h-3 text-emerald-600" />
                <span>Leave {recommendedLeaveTime} → Arrive {items[0].plannedArrival}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* EMPTY EVENTS STATE */}
      {!hasItems && (
        <div className="flex flex-col items-center justify-center p-6 sm:p-10 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-white/70 space-y-3">
          <Calendar className="w-9 h-9 text-blue-500 animate-bounce" />
          <h4 className="text-sm sm:text-base font-extrabold text-slate-800">No Events Added Yet</h4>
          <p className="text-xs text-slate-500 max-w-xs">
            Add campaign meetings or rallies to calculate exact travel times from your Start Hub.
          </p>
          {onAddEventClick && (
            <button
              type="button"
              onClick={onAddEventClick}
              className="mt-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center gap-2"
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

          return (
            <div key={item.id} className="relative">
              <div
                onClick={() => onSelectItem && onSelectItem(item.id)}
                className={`group relative p-3 sm:p-4 rounded-xl sm:rounded-2xl border transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md min-w-0 ${
                  isCompleted
                    ? 'bg-slate-50 opacity-80 border-slate-200'
                    : isSelected
                    ? 'bg-blue-50/80 border-blue-500 ring-2 ring-blue-500/20 shadow-md'
                    : 'bg-white hover:bg-slate-50/80 border-slate-200'
                }`}
              >
                {/* Sequence Badge */}
                <div
                  className={`absolute -left-7 sm:-left-9 top-3.5 sm:top-4 w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center font-bold text-xs text-white shadow-md transition-transform group-hover:scale-105 ${
                    isCompleted
                      ? 'bg-emerald-600 ring-2 ring-emerald-100'
                      : item.event.isFixed
                      ? 'bg-rose-600 ring-2 sm:ring-4 ring-rose-100'
                      : 'bg-blue-600 ring-2 sm:ring-4 ring-blue-100'
                  }`}
                >
                  {item.sequence}
                </div>

                {/* Card Header */}
                <div className="flex items-start justify-between gap-2 sm:gap-3 flex-wrap sm:flex-nowrap min-w-0">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap mb-1">
                      {getEventTypeBadge(item.event.eventType)}
                      {getExecutionBadge(item)}
                      {item.event.isFixed && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5" /> Fixed
                        </span>
                      )}
                    </div>

                    <h4 className={`text-xs sm:text-sm font-bold truncate transition-colors ${isCompleted ? 'line-through text-slate-500' : 'text-slate-900 group-hover:text-blue-600'}`}>
                      {item.event.title}
                    </h4>
                  </div>

                  <div className="text-left sm:text-right shrink-0">
                    <div className="flex items-center gap-1 text-[11px] sm:text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg border border-slate-200 whitespace-nowrap">
                      <Clock className="w-3 h-3 text-blue-600" />
                      <span>{item.plannedArrival} – {item.plannedDeparture}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5">Duration: {item.event.durationMinutes}m</p>
                  </div>
                </div>

                {/* Location details */}
                {loc && (
                  <div className="mt-2.5 flex items-center justify-between gap-2 text-xs text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-200/80 min-w-0">
                    <div className="flex items-center gap-1.5 truncate min-w-0 flex-1">
                      <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <span className="font-semibold truncate max-w-[150px] sm:max-w-xs">{loc.name}</span>
                    </div>

                    {onOpenContacts && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenContacts(item);
                        }}
                        className="px-2 py-0.5 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[10px] flex items-center gap-1 border border-blue-200 shrink-0"
                      >
                        <PhoneCall className="w-3 h-3" /> Contact Organizer
                      </button>
                    )}
                  </div>
                )}

                {item.event.description && (
                  <p className="text-[11px] sm:text-xs text-slate-600 mt-1.5 line-clamp-2">{item.event.description}</p>
                )}

                {/* Action Buttons: Edit & Delete */}
                <div className="absolute right-2 bottom-2 flex items-center gap-1">
                  {onEditEvent && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditEvent(item.event);
                      }}
                      className="p-1 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                      title="Edit Event"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
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

              {/* Travel & Buffer connector */}
              {index < items.length - 1 && (
                <div className="py-1.5 px-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[10px] sm:text-[11px] text-slate-600 bg-slate-100/70 my-1 rounded-lg border border-slate-200/70 min-w-0">
                  <div className="flex items-center gap-1.5 text-blue-700 font-medium truncate">
                    <Navigation className="w-3 h-3 shrink-0" />
                    <span className="truncate">Travel: {formatDistance(items[index + 1].travelDistanceMeters)} ({formatDuration(items[index + 1].travelSeconds)})</span>
                  </div>
                  <div className="flex items-center gap-1 text-amber-700 font-medium shrink-0">
                    <ShieldAlert className="w-3 h-3" />
                    <span>Buffer: {formatDuration(items[index + 1].bufferSeconds)}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}

      {/* DAY END POINT (RETURN HUB) */}
      {endLocation && (
        <div className="relative">
          {hasItems && (
            <div className="py-2 px-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[10px] sm:text-[11px] text-purple-900 bg-purple-100/70 my-1.5 rounded-xl border border-purple-300/80 shadow-sm min-w-0">
              <div className="flex items-center gap-1.5 font-bold truncate">
                <Navigation className="w-3.5 h-3.5 text-purple-700 shrink-0" />
                <span className="truncate">Return Travel: {formatDistance(endTravelMeters)} ({formatDuration(endTravelSeconds)})</span>
              </div>
              <div className="flex items-center gap-1 font-extrabold text-purple-800 bg-white/80 px-2 py-0.5 rounded-md border border-purple-200 whitespace-nowrap shrink-0 self-start sm:self-auto">
                <Clock className="w-3 h-3 text-purple-600" />
                <span>Arrive End Hub: {expectedReturnArrival}</span>
              </div>
            </div>
          )}

          <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-purple-300/80 bg-purple-50/60 shadow-sm hover:shadow-md transition-all min-w-0">
            {/* End Pin Badge */}
            <div className="absolute -left-7 sm:-left-9 top-3.5 sm:top-4 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-purple-600 text-white flex items-center justify-center font-black text-xs shadow-lg ring-2 sm:ring-4 ring-purple-100">
              <Flag className="w-3.5 h-3.5 text-white" />
            </div>

            <div className="flex items-start justify-between flex-wrap sm:flex-nowrap gap-2 min-w-0">
              <div className="min-w-0 flex-1">
                <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-purple-600 text-white uppercase tracking-wider shadow-sm flex items-center gap-1 w-fit whitespace-nowrap">
                  <Flag className="w-3 h-3" /> DAY RETURN (END POINT)
                </span>
                <h4 className="text-xs sm:text-sm font-black text-slate-900 mt-1.5 truncate">
                  {endLocation.name}
                </h4>
                {endLocation.address && (
                  <p className="text-[10px] sm:text-[11px] text-slate-600 mt-0.5 flex items-center gap-1 min-w-0">
                    <MapPin className="w-3 h-3 text-purple-600 shrink-0" />
                    <span className="truncate max-w-[180px] sm:max-w-xs md:max-w-md block">{endLocation.address}</span>
                  </p>
                )}
              </div>

              <div className="flex items-center gap-1 text-[11px] sm:text-xs font-bold text-purple-900 bg-white px-2 py-1 rounded-lg border border-purple-200 shadow-sm whitespace-nowrap shrink-0">
                <Clock className="w-3 h-3 text-purple-600" />
                <span>Return Arrival: {expectedReturnArrival}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
