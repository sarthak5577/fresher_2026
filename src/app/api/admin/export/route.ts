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
    const format = searchParams.get('format') || 'csv';

    const supabase = createAdminClient();
    const { data: registrations } = await supabase
      .from('registrations')
      .select('registration_id, student_name, department, college_id, phone, email, payment_status, entry_status, entered_at, created_at')
      .order('created_at', { ascending: false });

    if (!registrations) {
      return NextResponse.json({ error: 'No data.' }, { status: 404 });
    }

    if (format === 'csv') {
      const headers = [
        'Registration ID', 'Student Name', 'Department', 'College ID',
        'Phone', 'Email', 'Payment Status', 'Entry Status',
        'Entry Time', 'Registration Date',
      ];

      const csvRows = [
        headers.join(','),
        ...registrations.map((r) =>
          [
            r.registration_id,
            `"${r.student_name}"`,
            r.department,
            r.college_id,
            r.phone,
            r.email,
            r.payment_status,
            r.entry_status,
            r.entered_at || '',
            r.created_at,
          ].join(',')
        ),
      ];

      return new NextResponse(csvRows.join('\n'), {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="freshers2026-registrations-${Date.now()}.csv"`,
        },
      });
    }

    return NextResponse.json(registrations);
  } catch (error: unknown) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Export failed.' }, { status: 500 });
  }
}

