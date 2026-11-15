import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { generateSecureToken, hashToken, generateInvoiceNumber } from '@/lib/utils/token';
import { generateQRCodeDataURL } from '@/lib/qr/generate';
import { sendConfirmationEmail } from '@/lib/resend/email';
import { buildInvoiceHTML, buildTicketHTML } from '@/lib/pdf/templates';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
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
      .select('id, name')
      .eq('auth_user_id', user.id)
      .single();

    if (!adminProfile) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { registrationId, action, adminNote, utrNumber } = body;

    if (!registrationId || !action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    // Get registration
    const { data: registration, error: regError } = await supabase
      .from('registrations')
      .select('*')
      .eq('registration_id', registrationId)
      .eq('payment_status', 'pending')
      .single();

    if (regError || !registration) {
      return NextResponse.json({ error: 'Registration not found or already processed' }, { status: 404 });
    }

    if (action === 'reject') {
      await supabase
        .from('registrations')
        .update({ payment_status: 'failed', updated_at: new Date().toISOString() })
        .eq('registration_id', registrationId);

      await supabase
        .from('payments')
        .update({ status: 'failed' })
        .eq('registration_id', registrationId);

      return NextResponse.json({ success: true, action: 'rejected' });
    }

    // APPROVE: generate ticket, invoice, send email
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

    const manualPaymentRef = utrNumber || `MANUAL-${Date.now()}`;

    const invoiceHTML = buildInvoiceHTML({
      invoiceNumber,
      registrationId: registration.registration_id,
      studentName: registration.student_name,
      department: registration.department,
      collegeId: registration.college_id,
      phone: registration.phone,
      email: registration.email,
      paymentId: manualPaymentRef,
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

    // Update registration to paid
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
        utr_number: utrNumber || null,
        status: 'captured',
        payment_method: 'manual_upi',
        verified_at: new Date().toISOString(),
      })
      .eq('registration_id', registrationId);

    // Log entry
    try {
      await supabase.from('entry_logs').insert({
        registration_id: registrationId,
        admin_id: adminProfile.id,
        result: 'success',
      });
    } catch {
      // non-fatal log
    }

    // Send confirmation email
    try {
      await sendConfirmationEmail(registration.email, {
        studentName: registration.student_name,
        registrationId: registration.registration_id,
        department: registration.department,
        collegeId: registration.college_id,
        paymentId: manualPaymentRef,
        amount: 300,
        eventDate,
        eventVenue,
        ticketToken,
        qrCodeDataUrl,
        invoicePdf: Buffer.from(invoiceHTML),
        ticketPdf: Buffer.from(ticketHTML),
      });
    } catch (emailErr) {
      console.error('Email failed after approval:', emailErr);
    }

    return NextResponse.json({ success: true, action: 'approved', registrationId });
  } catch (error) {
    console.error('Approve payment error:', error);
    return NextResponse.json({ error: 'Failed to process approval' }, { status: 500 });
  }
}
