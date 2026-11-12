import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyWebhookChecksum, getPaytmTransactionStatus } from '@/lib/paytm/checkout';
import { generateSecureToken, hashToken, generateInvoiceNumber } from '@/lib/utils/token';
import { generateQRCodeDataURL } from '@/lib/qr/generate';
import { sendConfirmationEmail } from '@/lib/resend/email';
import { buildInvoiceHTML, buildTicketHTML } from '@/lib/pdf/templates';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const body = JSON.parse(rawBody);

    // Extract Paytm params from webhook
    const { ORDERID, TXNAMOUNT, STATUS, TXNID, BANKTXNID, CHECKSUMHASH, RESPMSG } = body;

    // Verify Paytm checksum signature
    const { CHECKSUMHASH: _, ...bodyWithoutChecksum } = body;
    const isValid = await verifyWebhookChecksum(bodyWithoutChecksum, CHECKSUMHASH);

    if (!isValid) {
      console.error('Paytm webhook: Invalid checksum');
      return NextResponse.json({ error: 'Invalid checksum' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Idempotency: check if already processed
    const { data: existing } = await supabase
      .from('webhook_events')
      .select('id')
      .eq('razorpay_event_id', TXNID || ORDERID)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ status: 'already_processed' });
    }

    // Log webhook event
    await supabase.from('webhook_events').insert({
      razorpay_event_id: TXNID || ORDERID,
      event_type: `paytm.payment.${STATUS?.toLowerCase() || 'unknown'}`,
      processing_status: 'processing',
    });

    // Find registration
    const { data: payment } = await supabase
      .from('payments')
      .select('registration_id')
      .eq('paytm_order_id', ORDERID)
      .single();

    if (!payment) {
      await supabase
        .from('webhook_events')
        .update({ processed_at: new Date().toISOString(), processing_status: 'failed' })
        .eq('razorpay_event_id', TXNID || ORDERID);
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // Extra validation: re-confirm status via Paytm API
    const txnStatus = await getPaytmTransactionStatus(ORDERID);

    if (STATUS === 'TXN_SUCCESS' && txnStatus.status === 'TXN_SUCCESS') {
      // Verify amount matches
      const expectedAmount = '300.00';
      if (parseFloat(TXNAMOUNT) < parseFloat(expectedAmount)) {
        return NextResponse.json({ error: 'Amount mismatch' }, { status: 400 });
      }

      await processSuccessfulPayment(supabase, payment.registration_id, {
        paytmOrderId: ORDERID,
        txnId: TXNID,
        utr: BANKTXNID,
        amount: TXNAMOUNT,
      });
    } else if (STATUS === 'TXN_FAILURE') {
      // Mark as failed
      await supabase
        .from('payments')
        .update({ status: 'failed', paytm_txn_id: TXNID })
        .eq('paytm_order_id', ORDERID);

      await supabase
        .from('registrations')
        .update({ payment_status: 'failed', updated_at: new Date().toISOString() })
        .eq('paytm_order_id', ORDERID)
        .eq('payment_status', 'pending');
    }

    // Mark webhook processed
    await supabase
      .from('webhook_events')
      .update({ processed_at: new Date().toISOString(), processing_status: 'success' })
      .eq('razorpay_event_id', TXNID || ORDERID);

    return NextResponse.json({ status: 'ok' });
  } catch (error: unknown) {
    console.error('Paytm webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function processSuccessfulPayment(supabase: any, registrationId: string, paymentData: {
  paytmOrderId: string;
  txnId: string;
  utr: string;
  amount: string;
}) {
  // Get registration
  const { data: registration } = await supabase
    .from('registrations')
    .select('*')
    .eq('registration_id', registrationId)
    .single();

  if (!registration || registration.payment_status === 'paid') return;

  // Generate secure ticket token
  const ticketToken = generateSecureToken();
  const ticketTokenHash = hashToken(ticketToken);
  const invoiceNumber = generateInvoiceNumber();

  // Get event settings
  const { data: settings } = await supabase
    .from('event_settings')
    .select('event_date, event_venue')
    .eq('id', 1)
    .single();

  const eventDate = settings?.event_date || 'TBA';
  const eventVenue = settings?.event_venue || 'TBA';

  // Generate QR code
  const qrCodeDataUrl = await generateQRCodeDataURL(ticketToken);

  const paymentDate = new Date().toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  // Build HTML templates
  const invoiceHTML = buildInvoiceHTML({
    invoiceNumber,
    registrationId: registration.registration_id,
    studentName: registration.student_name,
    department: registration.department,
    collegeId: registration.college_id,
    phone: registration.phone,
    email: registration.email,
    paymentId: paymentData.txnId || paymentData.paytmOrderId,
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

  // Update registration
  await supabase
    .from('registrations')
    .update({
      payment_status: 'paid',
      ticket_token_hash: ticketTokenHash,
      invoice_number: invoiceNumber,
      invoice_html: invoiceHTML,
      ticket_html: ticketHTML,
      updated_at: new Date().toISOString(),
    })
    .eq('registration_id', registrationId)
    .eq('payment_status', 'pending');

  // Update payment record
  await supabase
    .from('payments')
    .update({
      paytm_txn_id: paymentData.txnId,
      utr_number: paymentData.utr,
      status: 'captured',
      verified_at: new Date().toISOString(),
    })
    .eq('paytm_order_id', paymentData.paytmOrderId);

  // Send confirmation email async
  try {
    const emailLog = await supabase.from('email_logs').insert({
      registration_id: registrationId,
      email_type: 'confirmation',
      delivery_status: 'pending',
    }).select().single();

    const emailResult = await sendConfirmationEmail(registration.email, {
      studentName: registration.student_name,
      registrationId: registration.registration_id,
      department: registration.department,
      collegeId: registration.college_id,
      paymentId: paymentData.txnId || paymentData.paytmOrderId,
      amount: 300,
      eventDate,
      eventVenue,
      invoicePdf: Buffer.from(invoiceHTML),
      ticketPdf: Buffer.from(ticketHTML),
    });

    if (emailLog?.data?.id) {
      await supabase.from('email_logs')
        .update({
          delivery_status: emailResult.success ? 'sent' : 'failed',
          sent_at: emailResult.success ? new Date().toISOString() : null,
          error_message: emailResult.error || null,
        })
        .eq('id', emailLog.data.id);
    }
  } catch (err) {
    console.error('Email failed:', err);
  }

  return ticketToken;
}

