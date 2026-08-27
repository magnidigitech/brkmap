import { NextRequest, NextResponse } from 'next/server';
import { INITIAL_EVENTS, INITIAL_LOCATIONS } from '@/lib/db/mock-data';
import { optimizeCampaignSchedule } from '@/lib/optimizer/optimizer';
import { OptimizeRequestInput } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body: OptimizeRequestInput = await request.json();
    const { campaignId, date, startLocationId, endLocationId, startTime, endTime, profile } = body;

    let targetEvents = INITIAL_EVENTS.filter((e) => e.date === date || !date);
    if (body.eventIds && body.eventIds.length > 0) {
      targetEvents = targetEvents.filter((e) => body.eventIds!.includes(e.id));
    }

    const eventsWithLocations = targetEvents.map((evt) => ({
      ...evt,
      location: INITIAL_LOCATIONS.find((l) => l.id === evt.locationId),
    }));

    const optResult = await optimizeCampaignSchedule(
      {
        campaignId: campaignId || 'cmp-guntur-2026',
        date: date || '2026-08-28',
        startLocationId: startLocationId || INITIAL_LOCATIONS[0].id,
        endLocationId: endLocationId || INITIAL_LOCATIONS[0].id,
        startTime: startTime || '08:00',
        endTime: endTime || '20:00',
        profile: profile || 'BALANCED',
      },
      eventsWithLocations,
      INITIAL_LOCATIONS
    );

    return NextResponse.json({
      success: true,
      schedule: optResult.primarySchedule,
      alternatives: optResult.alternatives,
      validation: optResult.validation,
      matrixCells: optResult.matrixCells,
    });
  } catch (error) {
    console.error('Optimization endpoint error:', error);
    return NextResponse.json({ success: false, error: 'Optimization failed' }, { status: 500 });
  }
}
