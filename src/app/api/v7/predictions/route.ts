import { NextRequest, NextResponse } from 'next/server';
import { generateV7PredictiveIntelligence } from '@/lib/v7/predictiveEngine';

export async function GET(request: NextRequest) {
  try {
    const payload = await generateV7PredictiveIntelligence('cmp-1');
    return NextResponse.json({
      success: true,
      data: payload,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch V7 predictions' }, { status: 500 });
  }
}
