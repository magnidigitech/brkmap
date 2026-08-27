import { LiveCandidateStatus, ScheduleItemData } from '@/types';
import { calculateHaversineDistance, estimateDrivingDuration } from '../google/routes';
import { minutesToTimeString, timeStringToMinutes } from './constraints';

export function calculateRealtimeCandidateEta(
  currentLat: number,
  currentLng: number,
  currentLocName: string,
  scheduleItems: ScheduleItemData[],
  candidateName: string = 'Hon. Bhashyam Ramakrishna'
): LiveCandidateStatus {
  // Find current/next active schedule item
  const activeItem = scheduleItems.find(
    (item) => item.execution?.status !== 'COMPLETED' && item.execution?.status !== 'SKIPPED'
  );

  if (!activeItem) {
    return {
      candidateName,
      status: 'COMPLETED',
      currentLocationName: currentLocName || 'Campaign Headquarters',
      currentLatitude: currentLat,
      currentLongitude: currentLng,
      scheduledArrival: '19:00',
      liveEta: '19:00',
      delayMinutes: 0,
      riskLevel: 'LOW',
    };
  }

  const loc = activeItem.event.location;
  let driveDurationSeconds = 600; // 10 mins default

  if (loc) {
    const distMeters = calculateHaversineDistance(currentLat, currentLng, loc.latitude, loc.longitude);
    driveDurationSeconds = estimateDrivingDuration(distMeters);
  }

  const driveMins = Math.ceil(driveDurationSeconds / 60);
  const nowMins = 10 * 60 + 15; // Simulated current time: 10:15 AM
  const liveEtaMins = nowMins + driveMins;
  const plannedArrMins = timeStringToMinutes(activeItem.plannedArrival);

  const delayMinutes = Math.max(0, liveEtaMins - plannedArrMins);

  let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
  if (delayMinutes > 30) riskLevel = 'CRITICAL';
  else if (delayMinutes > 15) riskLevel = 'HIGH';
  else if (delayMinutes > 5) riskLevel = 'MEDIUM';

  const status: LiveCandidateStatus['status'] =
    activeItem.execution?.status === 'ARRIVED' || activeItem.execution?.status === 'IN_PROGRESS'
      ? 'AT_EVENT'
      : delayMinutes > 10
      ? 'DELAYED'
      : 'ON_ROAD';

  return {
    candidateName,
    status,
    currentLocationName: currentLocName || 'En route on Mangalagiri Highway',
    currentLatitude: currentLat,
    currentLongitude: currentLng,
    nextEventId: activeItem.eventId,
    nextEventTitle: activeItem.event.title,
    scheduledArrival: activeItem.plannedArrival,
    liveEta: minutesToTimeString(liveEtaMins),
    delayMinutes,
    riskLevel,
  };
}
