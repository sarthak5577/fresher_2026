import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

async function verifyAdmin(request: NextRequest) {
  const serverClient = await createClient();
  const { data: { user } } = await serverClient.auth.getUser();
  if (!user) return null;

  const supabase = createAdminClient();
  const { data: profile } = await supabase
    .from('admin_profiles')
    .select('*')
    .eq('auth_user_id', user.id)
    .single();

  return profile;
}

export async function GET(request: NextRequest) {
  try {
    const admin = await verifyAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const supabase = createAdminClient();
    const { data: settings } = await supabase
      .from('event_settings')
      .select('*')
      .eq('id', 1)
      .single();

    return NextResponse.json(settings);
  } catch (error: unknown) {
    return NextResponse.json({ error: 'Failed to fetch settings.' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const admin = await verifyAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const body = await request.json();
    const supabase = createAdminClient();

    const allowedFields = [
      'event_name', 'event_date', 'event_venue', 'registration_open',
      'departments', 'contact_email', 'contact_phone', 'event_description',
      'maximum_capacity',
    ];

    // Filter only allowed fields (do NOT allow changing registration_fee for existing orders)
    const updateData: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (key in body) {
        updateData[key] = body[key];
      }
    }

    updateData.updated_at = new Date().toISOString();

    const { error } = await supabase
      .from('event_settings')
      .update(updateData)
      .eq('id', 1);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Settings update error:', error);
    return NextResponse.json({ error: 'Failed to update settings.' }, { status: 500 });
  }
}

