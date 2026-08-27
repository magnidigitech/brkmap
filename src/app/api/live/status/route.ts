import { NextRequest, NextResponse } from 'next/server';
import { calculateRealtimeCandidateEta } from '@/lib/optimizer/eta';
import { INITIAL_LOCATIONS } from '@/lib/db/mock-data';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = Number(searchParams.get('lat')) || 16.4250; // Between Guntur & Mangalagiri
    const lng = Number(searchParams.get('lng')) || 80.5100;

    const status = calculateRealtimeCandidateEta(
      lat,
      lng,
      'Mangalagiri – Guntur Bypass Highway',
      []
    );

    return NextResponse.json({
      success: true,
      status,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch live status' }, { status: 500 });
  }
}
