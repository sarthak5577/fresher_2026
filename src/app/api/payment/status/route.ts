import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const registrationId = searchParams.get('id');

    if (!registrationId) {
      return NextResponse.json({ error: 'Registration ID required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data: registration, error } = await supabase
      .from('registrations')
      .select('registration_id, payment_status')
      .eq('registration_id', registrationId)
      .single();

    if (error || !registration) {
      return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
    }

    return NextResponse.json({
      registrationId: registration.registration_id,
      status: registration.payment_status,
    });
  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json({ error: 'Failed to check status' }, { status: 500 });
  }
}
