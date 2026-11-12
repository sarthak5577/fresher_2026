import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { hashToken } from '@/lib/utils/token';

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

export async function POST(request: NextRequest) {
  try {
    const admin = await verifyAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const body = await request.json();
    const { token, registrationId } = body;

    if (!token && !registrationId) {
      return NextResponse.json({ error: 'Token or Registration ID required.' }, { status: 400 });
    }

    const supabase = createAdminClient();
    let registration;

    if (token) {
      const tokenHash = hashToken(token);
      const { data } = await supabase
        .from('registrations')
        .select('*')
        .eq('ticket_token_hash', tokenHash)
        .maybeSingle();
      registration = data;
    } else if (registrationId) {
      const { data } = await supabase
        .from('registrations')
        .select('*')
        .eq('registration_id', registrationId.trim().toUpperCase())
        .maybeSingle();
      registration = data;
    }

    if (!registration) {
      await supabase.from('entry_logs').insert({
        registration_id: registrationId || 'UNKNOWN',
        admin_id: admin.id,
        result: 'invalid',
      });
      return NextResponse.json({ result: 'invalid', message: 'Invalid QR code or Registration ID.' });
    }

    if (registration.payment_status !== 'paid') {
      await supabase.from('entry_logs').insert({
        registration_id: registration.registration_id,
        admin_id: admin.id,
        result: 'unpaid',
      });
      return NextResponse.json({
        result: 'unpaid',
        message: 'Payment not completed for this registration.',
        studentName: registration.student_name,
        department: registration.department,
        collegeId: registration.college_id,
        registrationId: registration.registration_id,
      });
    }

    if (registration.entry_status === 'entered') {
      return NextResponse.json({
        result: 'already_entered',
        message: 'Student has already entered.',
        studentName: registration.student_name,
        department: registration.department,
        collegeId: registration.college_id,
        registrationId: registration.registration_id,
        enteredAt: registration.entered_at,
      });
    }

    // Atomically mark as entered using conditional update
    const { data: updated, error: updateError } = await supabase
      .from('registrations')
      .update({
        entry_status: 'entered',
        entered_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('registration_id', registration.registration_id)
      .eq('entry_status', 'not_entered') // Guard condition
      .select()
      .single();

    if (updateError || !updated) {
      // Race condition: check if already entered
      const { data: recheckReg } = await supabase
        .from('registrations')
        .select('entry_status, entered_at')
        .eq('registration_id', registration.registration_id)
        .single();

      if (recheckReg?.entry_status === 'entered') {
        return NextResponse.json({
          result: 'already_entered',
          message: 'Student has already entered.',
          studentName: registration.student_name,
          department: registration.department,
          collegeId: registration.college_id,
          registrationId: registration.registration_id,
          enteredAt: recheckReg.entered_at,
        });
      }
      return NextResponse.json({ result: 'invalid', message: 'Entry update failed.' });
    }

    // Log entry
    await supabase.from('entry_logs').insert({
      registration_id: registration.registration_id,
      admin_id: admin.id,
      result: 'success',
    });

    return NextResponse.json({
      result: 'success',
      message: 'Entry confirmed!',
      studentName: registration.student_name,
      department: registration.department,
      collegeId: registration.college_id,
      registrationId: registration.registration_id,
      enteredAt: updated.entered_at,
    });
  } catch (error: unknown) {
    console.error('Scan error:', error);
    return NextResponse.json({ error: 'Scan failed.' }, { status: 500 });
  }
}

