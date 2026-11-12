import { NextResponse } from 'next/server';
import { getEventSettings } from '@/lib/settings';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const settings = await getEventSettings();
    return NextResponse.json(settings);
  } catch (error: unknown) {
    console.error('Event settings error:', error);
    return NextResponse.json({ error: 'Failed to fetch settings.' }, { status: 500 });
  }
}
