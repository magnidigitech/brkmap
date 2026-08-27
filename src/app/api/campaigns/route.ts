import { NextResponse } from 'next/server';
import { INITIAL_CAMPAIGN } from '@/lib/db/mock-data';

export async function GET() {
  return NextResponse.json({
    success: true,
    campaign: INITIAL_CAMPAIGN,
  });
}
