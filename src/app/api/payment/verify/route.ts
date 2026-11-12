import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
import { verifyPaymentSignature } from '@/lib/razorpay/verify';
import { getRazorpayInstance } from '@/lib/razorpay/client';
import { generateSecureToken, hashToken, generateInvoiceNumber } from '@/lib/utils/token';
import { generateQRCodeDataURL } from '@/lib/qr/generate';
import { sendConfirmationEmail } from '@/lib/resend/email';
import { buildInvoiceHTML, buildTicketHTML } from '@/lib/pdf/templates';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      registration_id,
    } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !registration_id) {
      return NextResponse.json({ error: 'Missing required payment parameters.' }, { status: 400 });
    }

    // --- Verify Razorpay signature ---
    const isValid = verifyPaymentSignature({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    });

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid payment signature.' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // --- Get registration ---
    const { data: registration, error: regError } = await supabase
      .from('registrations')
      .select('*')
      .eq('registration_id', registration_id)
      .eq('razorpay_order_id', razorpay_order_id)
      .single();

    if (regError || !registration) {
      return NextResponse.json({ error: 'Registration not found.' }, { status: 404 });
    }

    // Idempotency: already paid
    if (registration.payment_status === 'paid') {
      return NextResponse.json({
        success: true,
        registrationId: registration.registration_id,
        alreadyProcessed: true,
      });
    }

    // --- Verify payment with Razorpay API ---
    const razorpay = getRazorpayInstance();
    const payment = await razorpay.payments.fetch(razorpay_payment_id);

    if (!payment || payment.status !== 'captured') {
      // Update payment record as failed if not captured
      await supabase
        .from('payments')
        .update({ status: payment?.status || 'failed' })
        .eq('razorpay_order_id', razorpay_order_id);

      return NextResponse.json({ error: 'Payment not captured.' }, { status: 400 });
    }

    // Verify order ID matches
    if (payment.order_id !== razorpay_order_id) {
      return NextResponse.json({ error: 'Payment order mismatch.' }, { status: 400 });
    }

    // Verify amount (must be ≥ registration fee)
    const { data: settings } = await supabase
      .from('event_settings')
      .select('registration_fee, event_date, event_venue')
      .eq('id', 1)
      .single();

    if (settings && payment.amount < settings.registration_fee) {
      return NextResponse.json({ error: 'Incorrect payment amount.' }, { status: 400 });
    }

    // --- Generate secure ticket token ---
    const ticketToken = generateSecureToken();
    const ticketTokenHash = hashToken(ticketToken);
    const invoiceNumber = generateInvoiceNumber();

    // --- Update registration to PAID atomically ---
    const { error: updateError } = await supabase
      .from('registrations')
      .update({
        payment_status: 'paid',
        ticket_token_hash: ticketTokenHash,
        invoice_number: invoiceNumber,
        updated_at: new Date().toISOString(),
      })
      .eq('registration_id', registration_id)
      .eq('payment_status', 'pending'); // Guard against double-processing

    if (updateError) {
      console.error('Registration update error:', updateError);
    }

    // --- Update payment record ---
    await supabase
      .from('payments')
      .update({
        razorpay_payment_id,
        status: 'captured',
        payment_method: payment.method,
        verified_at: new Date().toISOString(),
      })
      .eq('razorpay_order_id', razorpay_order_id);

    // --- Generate QR code ---
    const eventDate = settings?.event_date || 'TBA';
    const eventVenue = settings?.event_venue || 'TBA';
    const qrCodeDataUrl = await generateQRCodeDataURL(ticketToken);

    // --- Send confirmation email (non-blocking) ---
    const paymentDate = new Date(payment.created_at! * 1000).toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    // Build PDFs as HTML strings (stored for download)
    const invoiceHTML = buildInvoiceHTML({
      invoiceNumber,
      registrationId: registration.registration_id,
      studentName: registration.student_name,
      department: registration.department,
      collegeId: registration.college_id,
      phone: registration.phone,
      email: registration.email,
      paymentId: razorpay_payment_id,
      paymentDate,
      amount: 300,
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

    // Store HTML for PDF download (we'll generate PDF on demand)
    await supabase
      .from('registrations')
      .update({
        invoice_html: invoiceHTML,
        ticket_html: ticketHTML,
      })
      .eq('registration_id', registration_id);

    // Send email async (don't block response)
    sendEmailAsync(supabase, registration, {
      paymentId: razorpay_payment_id,
      paymentDate,
      eventDate,
      eventVenue,
      qrCodeDataUrl,
      invoiceHTML,
      ticketHTML,
    });

    return NextResponse.json({
      success: true,
      registrationId: registration.registration_id,
      studentName: registration.student_name,
      department: registration.department,
      collegeId: registration.college_id,
      paymentId: razorpay_payment_id,
      amount: 300,
      paymentDate,
      ticketToken, // Send token to frontend for display only (not stored directly)
    });
  } catch (error: unknown) {
    console.error('Payment verification error:', error);
    const message = error instanceof Error ? error.message : 'Payment verification failed.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function sendEmailAsync(
  supabase: ReturnType<typeof import('@/lib/supabase/admin').createAdminClient>,
  registration: Record<string, string>,
  emailData: {
    paymentId: string;
    paymentDate: string;
    eventDate: string;
    eventVenue: string;
    qrCodeDataUrl: string;
    invoiceHTML: string;
    ticketHTML: string;
  }
) {
  try {
    // Log email attempt
    const { data: emailLog } = await supabase
      .from('email_logs')
      .insert({
        registration_id: registration.registration_id,
        email_type: 'confirmation',
        delivery_status: 'pending',
      })
      .select()
      .single();

    // For now, send with placeholder PDFs (HTML converted)
    const result = await sendConfirmationEmail(registration.email, {
      studentName: registration.student_name,
      registrationId: registration.registration_id,
      department: registration.department,
      collegeId: registration.college_id,
      paymentId: emailData.paymentId,
      amount: 300,
      eventDate: emailData.eventDate,
      eventVenue: emailData.eventVenue,
      invoicePdf: Buffer.from(emailData.invoiceHTML),
      ticketPdf: Buffer.from(emailData.ticketHTML),
    });

    if (emailLog) {
      await supabase
        .from('email_logs')
        .update({
          delivery_status: result.success ? 'sent' : 'failed',
          sent_at: result.success ? new Date().toISOString() : null,
          error_message: result.error || null,
        })
        .eq('id', emailLog.id);
    }
  } catch (err) {
    console.error('Email sending failed:', err);
  }
}

