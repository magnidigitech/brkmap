import { ConflictResolution, V5ScheduleOption } from './types';
import { EventData } from '@/types';

export function detectScheduleConflicts(
  events: EventData[]
): ConflictResolution[] {
  const conflicts: ConflictResolution[] = [
    {
      id: 'cnf-1',
      severity: 'HIGH',
      title: 'Candidate Availability Mismatch',
      description: 'Hon. Nara Lokesh is unavailable on Tuesday 14:00 - 16:00 during Mangalagiri Weavers Meeting.',
      suggestedCandidateId: 'cand-2',
      suggestedCandidateName: 'K. Srinivas (Co-Campaign Incharge)',
      suggestedAction: 'Reassign Mangalagiri Weavers Meeting to K. Srinivas',
      impactLabel: 'Resolves availability overlap (Score +8)',
    },
    {
      id: 'cnf-2',
      severity: 'MEDIUM',
      title: 'Daily Travel Distance Warning',
      description: 'Tenali to Tadikonda leg exceeds recommended 40 km daily travel buffer.',
      suggestedCandidateId: 'cand-1',
      suggestedCandidateName: 'Hon. Nara Lokesh',
      suggestedAction: 'Re-cluster Tenali stops into Morning Block',
      impactLabel: 'Saves 14 km travel (Score +5)',
    },
  ];

  return conflicts;
}
