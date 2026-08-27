import { NextRequest, NextResponse } from 'next/server';
import { calculateCampaignAnalytics } from '@/lib/analytics/analytics';

export async function GET(request: NextRequest) {
  try {
    const analytics = calculateCampaignAnalytics([]);
    return NextResponse.json({
      success: true,
      analytics,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
