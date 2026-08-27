import { NextRequest, NextResponse } from 'next/server';
import { runWhatIfSimulation } from '@/lib/v7/simulationEngine';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await runWhatIfSimulation(body);
    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to run What-If simulation' }, { status: 500 });
  }
}
