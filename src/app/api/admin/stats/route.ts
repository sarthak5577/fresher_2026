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

    let dailyStats: any[] = [];
    try {
      const { data } = await supabase.rpc('get_daily_registrations');
      if (data) dailyStats = data;
    } catch {
      dailyStats = [];
    }

    const [
      { count: total },
      { count: paid },
      { count: pending },
      { count: failed },
      { count: entered },
      { data: paymentStats },
      { data: deptStats },
    ] = await Promise.all([
      supabase.from('registrations').select('*', { count: 'exact', head: true }),
      supabase.from('registrations').select('*', { count: 'exact', head: true }).eq('payment_status', 'paid'),
      supabase.from('registrations').select('*', { count: 'exact', head: true }).eq('payment_status', 'pending'),
      supabase.from('registrations').select('*', { count: 'exact', head: true }).eq('payment_status', 'failed'),
      supabase.from('registrations').select('*', { count: 'exact', head: true }).eq('entry_status', 'entered'),
      supabase.from('payments').select('status, amount').eq('status', 'captured'),
      supabase.from('registrations').select('department, payment_status').eq('payment_status', 'paid'),
    ]);

    const totalCaptured = paymentStats?.reduce((sum: number, p: { amount: number }) => sum + (p.amount / 100), 0) || 0;

    // Department stats
    const deptCounts: Record<string, number> = {};
    (deptStats || []).forEach((r: { department: string }) => {
      deptCounts[r.department] = (deptCounts[r.department] || 0) + 1;
    });

    return NextResponse.json({
      total: total || 0,
      paid: paid || 0,
      pending: pending || 0,
      failed: failed || 0,
      entered: entered || 0,
      remaining: (paid || 0) - (entered || 0),
      totalCaptured,
      netCollection: totalCaptured, // subtract refunds if tracked
      departmentStats: deptCounts,
      dailyStats: dailyStats || [],
    });
  } catch (error: unknown) {
    console.error('Stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats.' }, { status: 500 });
  }
}

