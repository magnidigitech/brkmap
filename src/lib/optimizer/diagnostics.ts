import { EventData, MissedEventDiagnostic } from '@/types';

export function analyzeWhyEventMissed(
  event: EventData,
  currentDelayMinutes: number = 18,
  trafficDelayMinutes: number = 11,
  emergencyDelayMinutes: number = 15
): MissedEventDiagnostic {
  const totalImpact = currentDelayMinutes + trafficDelayMinutes + emergencyDelayMinutes;

  const breakdown = [
    { factor: 'Previous Event Overrun (Mangalagiri Meeting)', impactMinutes: currentDelayMinutes },
    { factor: 'Highway Traffic Congestion (Guntur Bypass)', impactMinutes: trafficDelayMinutes },
    { factor: 'Emergency Unscheduled Meeting Insertion', impactMinutes: emergencyDelayMinutes },
  ];

  let recommendation = 'Schedule event 45 minutes earlier or move optional village stop.';
  if (event.isFixed) {
    recommendation = 'Adjust fixed appointment window with local organizer or trigger Emergency Re-optimization.';
  }

  return {
    eventId: event.id,
    eventTitle: event.title,
    scheduledTime: event.preferredStart || event.fixedStart || '16:00',
    totalImpactMinutes: totalImpact,
    breakdown,
    recommendation,
  };
}
