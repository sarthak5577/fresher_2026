import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateSecureToken, hashToken, generateInvoiceNumber } from '@/lib/utils/token';
import { generateQRCodeDataURL } from '@/lib/qr/generate';
import { sendConfirmationEmail } from '@/lib/resend/email';
import { buildInvoiceHTML, buildTicketHTML } from '@/lib/pdf/templates';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { registrationId, utrNumber } = body;

    if (!registrationId || !utrNumber) {
      return NextResponse.json(
        { error: 'Registration ID and UTR / Transaction ID are required.' },
        { status: 400 }
      );
    }

    const cleanUtr = String(utrNumber).trim().toUpperCase();

    // Validate UTR format: standard Indian UPI UTR is 12 alphanumeric characters (usually 12 digits)
    if (!/^[A-Z0-9]{12}$/.test(cleanUtr)) {
      return NextResponse.json(
        { error: 'Invalid UTR format. UPI UTR must be exactly 12 digits (e.g. 412345678901).' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // 1. Check if UTR is already used by another registration
    const { data: existingPayment } = await supabase
      .from('payments')
      .select('id, registration_id, status')
      .eq('utr_number', cleanUtr)
      .eq('status', 'captured')
      .maybeSingle();

    if (existingPayment && existingPayment.registration_id !== registrationId) {
      return NextResponse.json(
        {
          error:
            'This UTR has already been submitted for another registration. Please enter your valid 12-digit transaction reference.',
        },
        { status: 400 }
      );
    }

    // 2. Fetch the registration record
    const { data: registration, error: regError } = await supabase
      .from('registrations')
      .select('*')
      .eq('registration_id', registrationId)
      .single();

    if (regError || !registration) {
      return NextResponse.json({ error: 'Registration not found.' }, { status: 404 });
    }

    // If already paid, return success immediately
    if (registration.payment_status === 'paid') {
      return NextResponse.json({
        success: true,
        registrationId,
        alreadyPaid: true,
      });
    }

    // 3. Automated Instant Processing: Generate QR ticket & invoice
    const ticketToken = generateSecureToken();
    const ticketTokenHash = hashToken(ticketToken);
    const invoiceNumber = generateInvoiceNumber();

    // Fetch event settings for venue & date
    const { data: settings } = await supabase
      .from('event_settings')
      .select('event_date, event_venue, registration_fee')
      .eq('id', 1)
      .single();

    const eventDate = settings?.event_date || 'TBA';
    const eventVenue = settings?.event_venue || 'TBA';
    const feeAmount = (settings?.registration_fee || 30000) / 100;

    const qrCodeDataUrl = await generateQRCodeDataURL(ticketToken);

    const paymentDate = new Date().toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const invoiceHTML = buildInvoiceHTML({
      invoiceNumber,
      registrationId: registration.registration_id,
      studentName: registration.student_name,
      department: registration.department,
      collegeId: registration.college_id,
      phone: registration.phone,
      email: registration.email,
      paymentId: cleanUtr,
      paymentDate,
      amount: feeAmount,
      eventDate,
      eventVenue,
      qrCodeDataUrl,
    });

    const ticketHTML = buildTicketHTML({
      studentName: registration.student_name,
      department: registration.department,
      collegeId: registration.college_id,
      registrationId: registration.registration_id,
      eventDate,
      eventVenue,
      qrCodeDataUrl,
    });

    // 4. Mark registration as paid
    const { error: updateRegError } = await supabase
      .from('registrations')
      .update({
        payment_status: 'paid',
        ticket_token_hash: ticketTokenHash,
        invoice_number: invoiceNumber,
        invoice_html: invoiceHTML,
        ticket_html: ticketHTML,
        updated_at: new Date().toISOString(),
      })
      .eq('registration_id', registrationId);

    if (updateRegError) {
      console.error('Update registration error:', updateRegError);
      throw updateRegError;
    }

    // 5. Update or insert payment record
    const { data: existingPaymentRecord } = await supabase
      .from('payments')
      .select('id')
      .eq('registration_id', registrationId)
      .maybeSingle();

    if (existingPaymentRecord) {
      await supabase
        .from('payments')
        .update({
          utr_number: cleanUtr,
          status: 'captured',
          payment_method: 'upi_direct',
          verified_at: new Date().toISOString(),
        })
        .eq('id', existingPaymentRecord.id);
    } else {
      await supabase.from('payments').insert({
        registration_id: registrationId,
        utr_number: cleanUtr,
        amount: feeAmount * 100,
        currency: 'INR',
        status: 'captured',
        payment_method: 'upi_direct',
        verified_at: new Date().toISOString(),
      });
    }

    // 6. Log entry
    try {
      await supabase.from('entry_logs').insert({
        registration_id: registrationId,
        result: 'success',
      });
    } catch {
      // Non-fatal
    }

    // 7. Dispatch confirmation email with PDF attachments via Resend
    try {
      const emailLog = await supabase
        .from('email_logs')
        .insert({
          registration_id: registrationId,
          email_type: 'confirmation',
          delivery_status: 'pending',
        })
        .select()
        .single();

      const emailResult = await sendConfirmationEmail(registration.email, {
        studentName: registration.student_name,
        registrationId: registration.registration_id,
        department: registration.department,
        collegeId: registration.college_id,
        paymentId: cleanUtr,
        amount: feeAmount,
        eventDate,
        eventVenue,
        invoicePdf: Buffer.from(invoiceHTML),
        ticketPdf: Buffer.from(ticketHTML),
      });

      if (emailLog?.data?.id) {
        await supabase
          .from('email_logs')
          .update({
            delivery_status: emailResult.success ? 'sent' : 'failed',
            sent_at: emailResult.success ? new Date().toISOString() : null,
            error_message: emailResult.error || null,
          })
          .eq('id', emailLog.data.id);
      }
    } catch (emailErr) {
      console.error('Email dispatch error:', emailErr);
    }

    return NextResponse.json({
      success: true,
      registrationId,
      token: ticketToken,
      utr: cleanUtr,
    });
  } catch (error: unknown) {
    console.error('UTR verify error:', error);
    const message = error instanceof Error ? error.message : 'Verification failed.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

