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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const department = searchParams.get('department') || '';
    const paymentStatus = searchParams.get('paymentStatus') || '';
    const entryStatus = searchParams.get('entryStatus') || '';
    const offset = (page - 1) * limit;

    const supabase = createAdminClient();
    let query = supabase
      .from('registrations')
      .select('*', { count: 'exact' });

    if (search) {
      query = query.or(
        `student_name.ilike.%${search}%,college_id_normalized.ilike.%${search}%,registration_id.ilike.%${search}%,email.ilike.%${search}%`
      );
    }
    if (department) query = query.eq('department', department);
    if (paymentStatus) query = query.eq('payment_status', paymentStatus);
    if (entryStatus) query = query.eq('entry_status', entryStatus);

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return NextResponse.json({ data, count, page, limit });
  } catch (error: unknown) {
    console.error('Registrations fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch registrations.' }, { status: 500 });
  }
}

