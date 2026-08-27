export function timeStringToMinutes(timeStr: string): number {
  if (!timeStr || typeof timeStr !== 'string') return 0;
  const parts = timeStr.trim().split(':');
  const hours = parseInt(parts[0], 10) || 0;
  const minutes = parseInt(parts[1], 10) || 0;
  return hours * 60 + minutes;
}

export function minutesToTimeString(minutesFromMidnight: number): string {
  const normalized = Math.max(0, Math.floor(minutesFromMidnight)) % 1440;
  const hours = Math.floor(normalized / 60);
  const mins = normalized % 60;
  const hh = hours.toString().padStart(2, '0');
  const mm = mins.toString().padStart(2, '0');
  return `${hh}:${mm}`;
}

export interface TimeSlot {
  startMinutes: number;
  endMinutes: number;
}

export function doSlotsOverlap(slot1: TimeSlot, slot2: TimeSlot): boolean {
  return slot1.startMinutes < slot2.endMinutes && slot2.startMinutes < slot1.endMinutes;
}

export function formatDuration(seconds: number): string {
  if (seconds <= 0) return '0m';
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hours === 0) return `${mins}m`;
  return `${hours}h ${mins}m`;
}

export function formatDistance(meters: number): string {
  if (meters <= 0) return '0 km';
  const km = (meters / 1000).toFixed(1);
  return `${km} km`;
}
