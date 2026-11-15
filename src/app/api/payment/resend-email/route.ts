import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendConfirmationEmail } from '@/lib/resend/email';
import { validateEmail } from '@/lib/utils/validation';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { registrationId, email } = body;

    if (!registrationId) {
      return NextResponse.json({ error: 'Registration ID is required.' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // 1. Fetch registration
    const { data: registration, error: regError } = await supabase
      .from('registrations')
      .select('*, payments(*)')
      .eq('registration_id', registrationId)
      .single();

    if (regError || !registration) {
      return NextResponse.json({ error: 'Registration not found.' }, { status: 404 });
    }

    // 2. Only allow resending email if the order is already verified and paid
    if (registration.payment_status !== 'paid') {
      return NextResponse.json(
        { error: 'Payment is not completed. Emails are only sent for confirmed paid registrations.' },
        { status: 400 }
      );
    }

    // 3. Optional: update email address if student corrected a typo
    let targetEmail = registration.email;
    if (email && email.trim() && email.trim().toLowerCase() !== registration.email.toLowerCase()) {
      if (!validateEmail(email.trim())) {
        return NextResponse.json({ error: 'Invalid email address provided.' }, { status: 400 });
      }
      targetEmail = email.trim();
      await supabase
        .from('registrations')
        .update({ email: targetEmail, updated_at: new Date().toISOString() })
        .eq('registration_id', registrationId);
    }

    // 4. Rate limiting: avoid spamming within 20 seconds
    const twentySecondsAgo = new Date(Date.now() - 20 * 1000).toISOString();
    const { data: recentAttempts } = await supabase
      .from('email_logs')
      .select('id')
      .eq('registration_id', registrationId)
      .gt('created_at', twentySecondsAgo)
      .limit(1);

    if (recentAttempts && recentAttempts.length > 0) {
      return NextResponse.json(
        { error: 'An email was already dispatched moments ago. Please wait 20 seconds before requesting again.' },
        { status: 429 }
      );
    }

    // 5. Fetch event settings
    const { data: settings } = await supabase
      .from('event_settings')
      .select('event_date, event_venue')
      .eq('id', 1)
      .single();

    const paymentsList = Array.isArray(registration.payments) ? registration.payments : [];
    const payment = paymentsList[0];
    const paymentId = payment?.utr_number || payment?.paytm_txn_id || payment?.paytm_order_id || registration.registration_id;

    // Send confirmation email
    const emailResult = await sendConfirmationEmail(
      targetEmail,
      {
        studentName: registration.student_name,
        registrationId: registration.registration_id,
        department: registration.department,
        collegeId: registration.college_id,
        paymentId,
        amount: 300,
        eventDate: settings?.event_date || 'TBA',
        eventVenue: settings?.event_venue || 'TBA',
        ticketToken: registration.ticket_token_hash ? 'verified' : undefined,
        invoicePdf: registration.invoice_html ? Buffer.from(registration.invoice_html) : undefined,
        ticketPdf: registration.ticket_html ? Buffer.from(registration.ticket_html) : undefined,
      },
      { forceResend: true }
    );

    if (!emailResult.success) {
      return NextResponse.json(
        {
          error: emailResult.error || 'Failed to dispatch email. Please verify domain settings in Resend.',
          success: false,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Confirmation email successfully dispatched to ${targetEmail}`,
      email: targetEmail,
    });
  } catch (error: unknown) {
    console.error('Resend email error:', error);
    const message = error instanceof Error ? error.message : 'Internal error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

