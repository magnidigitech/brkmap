import { NextRequest, NextResponse } from 'next/server';
import { CandidateAvailabilityData } from '@/lib/v5/types';

const MOCK_AVAILABILITY: CandidateAvailabilityData[] = [
  {
    id: 'av-1',
    candidateId: 'cand-1',
    candidateName: 'Hon. Bhashyam Ramakrishna',
    date: '2026-08-28',
    startTime: '08:00',
    endTime: '20:00',
    status: 'PREFERRED',
    notes: 'Primary Campaign Day — All Constituencies',
  },
  {
    id: 'av-2',
    candidateId: 'cand-2',
    candidateName: 'K. Srinivas (Co-Campaign Incharge)',
    date: '2026-08-28',
    startTime: '09:00',
    endTime: '18:00',
    status: 'AVAILABLE',
    notes: 'Mangalagiri & Tenali Back-up Lead',
  },
];

export async function GET(request: NextRequest) {
  return NextResponse.json({ success: true, availability: MOCK_AVAILABILITY });
}
