import {
  EventData,
  LocationData,
  OptimizationProfile,
  OptimizeRequestInput,
  RouteMatrixCell,
  ScheduleAlternative,
  ScheduleData,
  ScheduleItemData,
  ScheduleValidationResult,
} from '@/types';
import { RoutingProvider, defaultRoutingProvider } from '../google/provider';
import { minutesToTimeString, timeStringToMinutes } from './constraints';
import { calculateDynamicBufferMinutes } from './scoring';
import { validateScheduleFeasibility } from './validation';

export interface MultiProfileOptimizationResult {
  primarySchedule: ScheduleData;
  alternatives: ScheduleAlternative[];
  validation: ScheduleValidationResult;
  matrixCells: RouteMatrixCell[];
}

export async function optimizeCampaignSchedule(
  input: OptimizeRequestInput,
  events: EventData[],
  locations: LocationData[],
  routingProvider: RoutingProvider = defaultRoutingProvider
): Promise<MultiProfileOptimizationResult> {
  const matrixCells = await routingProvider.calculateMatrix(
    locations.map((l) => ({ id: l.id, latitude: l.latitude, longitude: l.longitude }))
  );

  const profiles: OptimizationProfile[] = ['BALANCED', 'MIN_TRAVEL_TIME', 'MAX_EVENTS'];
  const alternatives: ScheduleAlternative[] = [];

  let primarySchedule: ScheduleData | null = null;
  let primaryValidation: ScheduleValidationResult | null = null;

  for (const prof of profiles) {
    const singleResult = await runSingleProfileOptimization(
      { ...input, profile: prof },
      events,
      locations,
      matrixCells
    );

    const validation = validateScheduleFeasibility(
      events,
      singleResult.scheduleItems,
      input.startTime,
      input.endTime,
      singleResult.conflicts
    );

    const altSchedule: ScheduleData = {
      id: `sch-${prof.toLowerCase()}-${Date.now()}`,
      campaignId: input.campaignId || 'cmp-guntur-2026',
      date: input.date || '2026-08-28',
      version: 1,
      status: 'PUBLISHED',
      optimizationProfile: prof,
      totalDistanceMeters: singleResult.totalDistanceMeters,
      totalTravelSeconds: singleResult.totalTravelSeconds,
      totalBufferSeconds: singleResult.totalBufferSeconds,
      items: singleResult.scheduleItems,
    };

    let title = 'Best Balanced';
    let description = 'Optimal balance of travel duration, priority rewards, and comfort buffers.';

    if (prof === 'MIN_TRAVEL_TIME') {
      title = 'Minimum Travel Time';
      description = 'Minimizes total driving time and fuel consumption between events.';
    } else if (prof === 'MAX_EVENTS') {
      title = 'Maximum Events Coverage';
      description = 'Packs maximum possible campaign stops into the daily schedule.';
    }

    alternatives.push({
      profile: prof,
      title,
      description,
      totalDistanceMeters: singleResult.totalDistanceMeters,
      totalTravelSeconds: singleResult.totalTravelSeconds,
      totalBufferSeconds: singleResult.totalBufferSeconds,
      eventsScheduledCount: singleResult.scheduleItems.length,
      totalEventsCount: events.length,
      riskScore: validation.lateRiskScore,
      schedule: altSchedule,
    });

    if (prof === (input.profile || 'BALANCED') || !primarySchedule) {
      primarySchedule = altSchedule;
      primaryValidation = validation;
    }
  }

  return {
    primarySchedule: primarySchedule!,
    alternatives,
    validation: primaryValidation!,
    matrixCells,
  };
}

async function runSingleProfileOptimization(
  input: OptimizeRequestInput,
  events: EventData[],
  locations: LocationData[],
  matrixCells: RouteMatrixCell[]
) {
  const { startLocationId, endLocationId, startTime, endTime, profile } = input;

  const dayStartMins = timeStringToMinutes(startTime || '08:00');
  const dayEndMins = timeStringToMinutes(endTime || '20:00');

  const routeMatrixMap = new Map<string, { distanceMeters: number; durationSeconds: number }>();
  matrixCells.forEach((cell) => {
    routeMatrixMap.set(`${cell.originId}:${cell.destinationId}`, {
      distanceMeters: cell.distanceMeters,
      durationSeconds: cell.durationSeconds,
    });
  });

  const getTravelData = (origId: string, destId: string) => {
    if (origId === destId) return { distanceMeters: 0, durationSeconds: 0 };
    const key = `${origId}:${destId}`;
    return routeMatrixMap.get(key) || { distanceMeters: 5000, durationSeconds: 600 };
  };

  const fixedEvents = events
    .filter((e) => e.isFixed && e.fixedStart)
    .sort((a, b) => timeStringToMinutes(a.fixedStart!) - timeStringToMinutes(b.fixedStart!));

  const flexibleEvents = events
    .filter((e) => !e.isFixed || !e.fixedStart)
    .sort((a, b) => b.priority - a.priority);

  const scheduleItems: ScheduleItemData[] = [];
  const conflicts: string[] = [];

  // Helper to test if fixed events overlap
  for (let i = 0; i < fixedEvents.length; i++) {
    const fEvent = fixedEvents[i];
    const fixedStartMins = timeStringToMinutes(fEvent.fixedStart!);

    if (i > 0) {
      const prevEvent = fixedEvents[i - 1];
      const prevStartMins = timeStringToMinutes(prevEvent.fixedStart!);
      const prevEndMins = prevEvent.fixedEnd
        ? timeStringToMinutes(prevEvent.fixedEnd)
        : prevStartMins + prevEvent.durationMinutes;

      if (fixedStartMins < prevEndMins) {
        conflicts.push(`Conflict: Fixed event "${fEvent.title}" overlaps with "${prevEvent.title}"`);
      }
    }
  }

  const assignedEventsList: Array<{
    event: EventData;
    arrivalMins: number;
    departureMins: number;
    travelDist: number;
    travelSecs: number;
    bufferSecs: number;
  }> = [];

  const remainingFlexible = [...flexibleEvents];

  const scheduleEventAt = (event: EventData, startMins: number, originId: string) => {
    const travel = getTravelData(originId, event.locationId);
    const travelMins = Math.ceil(travel.durationSeconds / 60);
    const bufferMins = calculateDynamicBufferMinutes(
      event.eventType,
      event.priority,
      travelMins,
      event.isFixed
    );

    const arrivalMins = startMins + travelMins;
    const departureMins = arrivalMins + event.durationMinutes;

    return {
      event,
      arrivalMins,
      departureMins,
      travelDist: travel.distanceMeters,
      travelSecs: travel.durationSeconds,
      bufferSecs: bufferMins * 60,
    };
  };

  let currOrigin = startLocationId || (events[0]?.locationId ?? locations[0]?.id);
  let currTime = dayStartMins;

  for (const fEvent of fixedEvents) {
    const fStart = timeStringToMinutes(fEvent.fixedStart!);

    // Fit eligible flexible events before fixed event
    let idx = 0;
    while (idx < remainingFlexible.length) {
      const flex = remainingFlexible[idx];
      const travelToFlex = getTravelData(currOrigin, flex.locationId);
      const flexDuration = flex.durationMinutes;
      const flexTravelMins = Math.ceil(travelToFlex.durationSeconds / 60);
      const travelFlexToFixed = getTravelData(flex.locationId, fEvent.locationId);
      const fixedTravelMins = Math.ceil(travelFlexToFixed.durationSeconds / 60);

      const estimatedFinishMins = currTime + flexTravelMins + flexDuration;
      const arrivalAtFixed = estimatedFinishMins + fixedTravelMins;

      if (arrivalAtFixed <= fStart && estimatedFinishMins <= dayEndMins) {
        const placed = scheduleEventAt(flex, currTime, currOrigin);
        assignedEventsList.push(placed);
        currOrigin = flex.locationId;
        currTime = placed.departureMins + Math.ceil(placed.bufferSecs / 60);
        remainingFlexible.splice(idx, 1);
      } else {
        idx++;
      }
    }

    // Place fixed event
    const travelToFixed = getTravelData(currOrigin, fEvent.locationId);
    const travelSecs = travelToFixed.durationSeconds;
    const travelDist = travelToFixed.distanceMeters;
    const arrivalMins = fStart;
    const departureMins = fEvent.fixedEnd
      ? timeStringToMinutes(fEvent.fixedEnd)
      : fStart + fEvent.durationMinutes;
    const bufferSecs = calculateDynamicBufferMinutes(fEvent.eventType, fEvent.priority, Math.ceil(travelSecs / 60), true) * 60;

    assignedEventsList.push({
      event: fEvent,
      arrivalMins,
      departureMins,
      travelDist,
      travelSecs,
      bufferSecs,
    });

    currOrigin = fEvent.locationId;
    currTime = departureMins + Math.ceil(bufferSecs / 60);
  }

  // Schedule remaining flexible events
  while (remainingFlexible.length > 0) {
    let bestIdx = -1;
    let bestScore = -Infinity;

    for (let i = 0; i < remainingFlexible.length; i++) {
      const flex = remainingFlexible[i];
      const travel = getTravelData(currOrigin, flex.locationId);
      const travelMins = Math.ceil(travel.durationSeconds / 60);
      const arrival = currTime + travelMins;
      const departure = arrival + flex.durationMinutes;

      if (departure <= dayEndMins) {
        let candidateScore = flex.priority * 10 - travel.distanceMeters / 1000;
        if (profile === 'MIN_TRAVEL_TIME') candidateScore -= travelMins * 8;
        if (profile === 'MIN_DISTANCE') candidateScore -= (travel.distanceMeters / 1000) * 12;
        if (profile === 'MAX_EVENTS') candidateScore += 150;

        if (candidateScore > bestScore) {
          bestScore = candidateScore;
          bestIdx = i;
        }
      }
    }

    if (bestIdx >= 0) {
      const flex = remainingFlexible[bestIdx];
      const placed = scheduleEventAt(flex, currTime, currOrigin);
      assignedEventsList.push(placed);
      currOrigin = flex.locationId;
      currTime = placed.departureMins + Math.ceil(placed.bufferSecs / 60);
      remainingFlexible.splice(bestIdx, 1);
    } else {
      break;
    }
  }

  let totalDistanceMeters = 0;
  let totalTravelSeconds = 0;
  let totalBufferSeconds = 0;

  assignedEventsList.forEach((item, index) => {
    totalDistanceMeters += item.travelDist;
    totalTravelSeconds += item.travelSecs;
    totalBufferSeconds += item.bufferSecs;

    scheduleItems.push({
      id: `item-${index + 1}`,
      scheduleId: 'temp-schedule-id',
      eventId: item.event.id,
      sequence: index + 1,
      plannedArrival: minutesToTimeString(item.arrivalMins),
      plannedDeparture: minutesToTimeString(item.departureMins),
      travelDistanceMeters: item.travelDist,
      travelSeconds: item.travelSecs,
      bufferSeconds: item.bufferSecs,
      lateRiskScore: item.bufferSecs < 600 ? 60 : 10,
      event: item.event,
    });
  });

  return {
    scheduleItems,
    totalDistanceMeters,
    totalTravelSeconds,
    totalBufferSeconds,
    conflicts,
  };
}
