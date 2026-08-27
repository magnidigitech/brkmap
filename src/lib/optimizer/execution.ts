import { EventData, EventExecutionData, ScheduleItemData } from '@/types';
import { minutesToTimeString, timeStringToMinutes } from './constraints';

export interface DelayAnalysisResult {
  currentDelayMinutes: number;
  projectedScheduleItems: ScheduleItemData[];
  impactedEventsCount: number;
  criticalAlerts: string[];
}

export function updateEventExecutionStatus(
  item: ScheduleItemData,
  newStatus: EventExecutionData['status'],
  actualTime: string // HH:mm
): ScheduleItemData {
  const actualMins = timeStringToMinutes(actualTime);
  const plannedArrivalMins = timeStringToMinutes(item.plannedArrival);
  const plannedDepartureMins = timeStringToMinutes(item.plannedDeparture);

  let delayMinutes = item.execution?.delayMinutes || 0;

  if (newStatus === 'ARRIVED') {
    delayMinutes = Math.max(0, actualMins - plannedArrivalMins);
  } else if (newStatus === 'COMPLETED') {
    const actualDur = actualMins - (item.execution?.actualStart ? timeStringToMinutes(item.execution.actualStart) : plannedArrivalMins);
    delayMinutes = Math.max(0, actualMins - plannedDepartureMins);
  }

  const updatedExecution: EventExecutionData = {
    id: item.execution?.id || `exec-${item.id}`,
    eventId: item.eventId,
    actualArrival: newStatus === 'ARRIVED' ? actualTime : item.execution?.actualArrival,
    actualStart: newStatus === 'IN_PROGRESS' || newStatus === 'ARRIVED' ? actualTime : item.execution?.actualStart,
    actualEnd: newStatus === 'COMPLETED' ? actualTime : item.execution?.actualEnd,
    delayMinutes,
    status: newStatus,
  };

  return {
    ...item,
    execution: updatedExecution,
  };
}

export function calculateProjectedDelayImpact(
  items: ScheduleItemData[],
  currentDelayMinutes: number
): DelayAnalysisResult {
  const criticalAlerts: string[] = [];
  let impactedCount = 0;

  const projectedScheduleItems = items.map((item) => {
    if (item.execution?.status === 'COMPLETED' || item.execution?.status === 'SKIPPED') {
      return item;
    }

    const plannedArrMins = timeStringToMinutes(item.plannedArrival);
    const plannedDepMins = timeStringToMinutes(item.plannedDeparture);

    const projectedArrMins = plannedArrMins + currentDelayMinutes;
    const projectedDepMins = plannedDepMins + currentDelayMinutes;

    if (currentDelayMinutes > 0) {
      impactedCount++;
    }

    if (item.event.isFixed && item.event.fixedStart) {
      const fixedStartMins = timeStringToMinutes(item.event.fixedStart);
      if (projectedArrMins > fixedStartMins) {
        criticalAlerts.push(
          `CRITICAL: Projected arrival at "${item.event.title}" (${minutesToTimeString(projectedArrMins)}) misses fixed start time (${item.event.fixedStart}) by ${projectedArrMins - fixedStartMins} mins`
        );
      }
    }

    return {
      ...item,
      plannedArrival: minutesToTimeString(projectedArrMins),
      plannedDeparture: minutesToTimeString(projectedDepMins),
      lateRiskScore: currentDelayMinutes > 15 ? 80 : 20,
    };
  });

  return {
    currentDelayMinutes,
    projectedScheduleItems,
    impactedEventsCount: impactedCount,
    criticalAlerts,
  };
}
