import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { hashToken } from '@/lib/utils/token';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const pid = searchParams.get('pid');
    const token = searchParams.get('token');

    if (!id) {
      return NextResponse.json({ error: 'Missing registration ID.' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data: registration } = await supabase
      .from('registrations')
      .select('*, payments(*)')
      .eq('registration_id', id)
      .single();

    if (!registration) {
      return NextResponse.json({ error: 'Registration not found.' }, { status: 404 });
    }

    // Verify token
    if (token) {
      const tokenHash = hashToken(token);
      if (tokenHash !== registration.ticket_token_hash) {
        return NextResponse.json({ error: 'Invalid access token.' }, { status: 403 });
      }
    }

    if (registration.payment_status !== 'paid') {
      return NextResponse.json({ error: 'Payment not completed.' }, { status: 403 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const paymentsList = Array.isArray(registration.payments) ? registration.payments : [];
    const payment = paymentsList[0] || null;
    const resolvedPaymentId = pid || payment?.utr_number || payment?.paytm_txn_id || payment?.paytm_order_id || registration.registration_id;

    const paymentDate = payment?.verified_at
      ? new Date(payment.verified_at).toLocaleString('en-IN', {
          timeZone: 'Asia/Kolkata',
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : new Date(registration.updated_at).toLocaleString('en-IN', {
          timeZone: 'Asia/Kolkata',
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });

    return NextResponse.json({
      studentName: registration.student_name,
      department: registration.department,
      collegeId: registration.college_id,
      registrationId: registration.registration_id,
      paymentId: resolvedPaymentId,
      amount: 300,
      paymentDate,
      email: registration.email,
      ticketToken: registration.ticket_token || '',
    });
  } catch (error: unknown) {
    console.error('Registration details error:', error);
    return NextResponse.json({ error: 'Failed to load details.' }, { status: 500 });
  }
}

