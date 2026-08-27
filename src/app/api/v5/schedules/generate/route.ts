import { NextRequest, NextResponse } from 'next/server';
import { generateV5SmartSchedule } from '@/lib/v5/engine';
import { INITIAL_EVENTS, INITIAL_LOCATIONS } from '@/lib/db/mock-data';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { campaignId } = body;

    const result = await generateV5SmartSchedule(
      campaignId || 'cmp-1',
      INITIAL_EVENTS,
      INITIAL_LOCATIONS
    );

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to generate V5 smart schedule' }, { status: 500 });
  }
}
