import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Auth check
    const supabaseAuth = await createClient();
    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminClient();

    // Verify admin
    const { data: adminProfile } = await supabase
      .from('admin_profiles')
      .select('id')
      .eq('auth_user_id', user.id)
      .single();

    if (!adminProfile) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    const { data: registrations, count, error } = await supabase
      .from('registrations')
      .select('registration_id, student_name, department, college_id, phone, email, paytm_order_id, created_at', { count: 'exact' })
      .eq('payment_status', 'pending')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return NextResponse.json({
      registrations: registrations || [],
      total: count || 0,
      page,
      limit,
    });
  } catch (error) {
    console.error('Pending payments error:', error);
    return NextResponse.json({ error: 'Failed to fetch pending payments' }, { status: 500 });
  }
}
