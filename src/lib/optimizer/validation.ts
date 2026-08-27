import { EventData, ScheduleItemData, ScheduleValidationResult } from '@/types';
import { timeStringToMinutes } from './constraints';

export function validateScheduleFeasibility(
  requestedEvents: EventData[],
  scheduledItems: ScheduleItemData[],
  dayStartTime: string,
  dayEndTime: string,
  conflicts: string[]
): ScheduleValidationResult {
  const dayStartMins = timeStringToMinutes(dayStartTime || '08:00');
  const dayEndMins = timeStringToMinutes(dayEndTime || '20:00');

  const scheduledEventIds = new Set(scheduledItems.map((i) => i.eventId));
  const unassignedEvents: Array<{ event: EventData; reason: string }> = [];

  requestedEvents.forEach((evt) => {
    if (!scheduledEventIds.has(evt.id)) {
      let reason = 'Insufficient travel time or day time window boundary reached';
      if (evt.isFixed && evt.fixedStart) {
        const startMins = timeStringToMinutes(evt.fixedStart);
        if (startMins < dayStartMins || startMins > dayEndMins) {
          reason = `Fixed time ${evt.fixedStart} is outside campaign working hours (${dayStartTime} – ${dayEndTime})`;
        } else {
          reason = `Fixed event conflicts with another higher priority fixed appointment`;
        }
      }
      unassignedEvents.push({ event: evt, reason });
    }
  });

  // Calculate late risk score
  let tightBuffersCount = 0;
  scheduledItems.forEach((item) => {
    if (item.bufferSeconds < 600) {
      tightBuffersCount++;
    }
  });

  let lateRiskScore: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
  if (tightBuffersCount >= 3 || conflicts.length > 0 || unassignedEvents.length >= 3) {
    lateRiskScore = 'HIGH';
  } else if (tightBuffersCount >= 1 || unassignedEvents.length >= 1) {
    lateRiskScore = 'MEDIUM';
  }

  let status: 'FEASIBLE' | 'NEEDS_ATTENTION' | 'IMPOSSIBLE' = 'FEASIBLE';
  if (unassignedEvents.length > 0 || conflicts.length > 0 || lateRiskScore === 'HIGH') {
    status = 'NEEDS_ATTENTION';
  }
  if (scheduledItems.length === 0 && requestedEvents.length > 0) {
    status = 'IMPOSSIBLE';
  }

  return {
    status,
    eventsRequested: requestedEvents.length,
    eventsScheduled: scheduledItems.length,
    unassignedEvents,
    conflicts,
    lateRiskScore,
  };
}
