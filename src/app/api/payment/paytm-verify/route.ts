import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getPaytmTransactionStatus } from '@/lib/paytm/checkout';
import { generateSecureToken, hashToken, generateInvoiceNumber } from '@/lib/utils/token';
import { generateQRCodeDataURL } from '@/lib/qr/generate';
import { sendConfirmationEmail } from '@/lib/resend/email';
import { buildInvoiceHTML, buildTicketHTML } from '@/lib/pdf/templates';

export const dynamic = 'force-dynamic';

// Called from frontend after Paytm redirects back to our page
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { paytmOrderId, registrationId } = body;

    if (!paytmOrderId || !registrationId) {
      return NextResponse.json({ error: 'Missing parameters.' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Find registration
    const { data: registration } = await supabase
      .from('registrations')
      .select('*')
      .eq('registration_id', registrationId)
      .eq('paytm_order_id', paytmOrderId)
      .single();

    if (!registration) {
      return NextResponse.json({ error: 'Registration not found.' }, { status: 404 });
    }

    // Already paid — idempotent response
    if (registration.payment_status === 'paid') {
      return NextResponse.json({
        success: true,
        alreadyProcessed: true,
        registrationId,
        studentName: registration.student_name,
      });
    }

    // Verify payment status with Paytm API
    const txnStatus = await getPaytmTransactionStatus(paytmOrderId);

    if (txnStatus.status !== 'TXN_SUCCESS') {
      return NextResponse.json({
        success: false,
        status: txnStatus.status,
        message: txnStatus.resultMsg || 'Payment not completed.',
      });
    }

    // --- Process successful payment ---
    const ticketToken = generateSecureToken();
    const ticketTokenHash = hashToken(ticketToken);
    const invoiceNumber = generateInvoiceNumber();

    const { data: settings } = await supabase
      .from('event_settings')
      .select('event_date, event_venue')
      .eq('id', 1)
      .single();

    const eventDate = settings?.event_date || 'TBA';
    const eventVenue = settings?.event_venue || 'TBA';

    const qrCodeDataUrl = await generateQRCodeDataURL(ticketToken);
    const paymentDate = new Date().toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

    const invoiceHTML = buildInvoiceHTML({
      invoiceNumber,
      registrationId: registration.registration_id,
      studentName: registration.student_name,
      department: registration.department,
      collegeId: registration.college_id,
      phone: registration.phone,
      email: registration.email,
      paymentId: txnStatus.txnId || paytmOrderId,
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

    // Atomic update: only update if still pending
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

    await supabase
      .from('payments')
      .update({
        paytm_txn_id: txnStatus.txnId,
        utr_number: txnStatus.utr,
        status: 'captured',
        verified_at: new Date().toISOString(),
      })
      .eq('paytm_order_id', paytmOrderId);

    // Send email async
    sendConfirmationEmail(registration.email, {
      studentName: registration.student_name,
      registrationId: registration.registration_id,
      department: registration.department,
      collegeId: registration.college_id,
      paymentId: txnStatus.txnId || paytmOrderId,
      amount: 300,
      eventDate,
      eventVenue,
      invoicePdf: Buffer.from(invoiceHTML),
      ticketPdf: Buffer.from(ticketHTML),
    }).catch(console.error);

    return NextResponse.json({
      success: true,
      registrationId,
      studentName: registration.student_name,
      department: registration.department,
      collegeId: registration.college_id,
      paymentId: txnStatus.txnId || paytmOrderId,
      amount: 300,
      paymentDate,
      ticketToken,
    });
  } catch (error: unknown) {
    console.error('Payment verify error:', error);
    return NextResponse.json({ error: 'Verification failed.' }, { status: 500 });
  }
}

