import { NextRequest, NextResponse } from 'next/server';
import { INITIAL_LOCATIONS } from '@/lib/db/mock-data';
import { defaultRoutingProvider } from '@/lib/google/provider';

export async function GET(request: NextRequest) {
  try {
    const matrix = await defaultRoutingProvider.calculateMatrix(
      INITIAL_LOCATIONS.map((l) => ({ id: l.id, latitude: l.latitude, longitude: l.longitude }))
    );

    return NextResponse.json({
      success: true,
      locations: INITIAL_LOCATIONS,
      matrix,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to calculate matrix' }, { status: 500 });
  }
}
