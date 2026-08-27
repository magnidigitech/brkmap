import { NextRequest, NextResponse } from 'next/server';
import { generateV6LearningInsights } from '@/lib/v6/learning';

export async function GET(request: NextRequest) {
  try {
    const insights = await generateV6LearningInsights('cmp-1');
    return NextResponse.json({
      success: true,
      insights,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch V6 learning insights' }, { status: 500 });
  }
}
