import { Resend } from 'resend';
import { createAdminClient } from '@/lib/supabase/admin';

let resendInstance: Resend | null = null;

function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) {
    return null;
  }
  if (!resendInstance) {
    resendInstance = new Resend(process.env.RESEND_API_KEY);
  }
  return resendInstance;
}

export interface ConfirmationEmailData {
  studentName: string;
  registrationId: string;
  department: string;
  collegeId: string;
  paymentId: string;
  amount: number;
  eventDate: string;
  eventVenue: string;
  ticketToken?: string;
  qrCodeDataUrl?: string;
  invoicePdf?: Buffer;
  ticketPdf?: Buffer;
}

export async function sendConfirmationEmail(
  toEmail: string,
  data: ConfirmationEmailData,
  options: { forceResend?: boolean } = {}
): Promise<{ success: boolean; messageId?: string; error?: string; alreadySent?: boolean }> {
  const supabase = createAdminClient();

  try {
    // 1. Idempotency Check: Don't send duplicate emails unless forceResend is true
    if (!options.forceResend) {
      const { data: existingSent } = await supabase
        .from('email_logs')
        .select('id, sent_at')
        .eq('registration_id', data.registrationId)
        .eq('email_type', 'confirmation')
        .eq('delivery_status', 'sent')
        .maybeSingle();

      if (existingSent) {
        return { success: true, messageId: existingSent.id, alreadySent: true };
      }
    }

    const resend = getResend();
    if (!resend) {
      const err = 'RESEND_API_KEY is not configured in environment variables.';
      await logEmailAttempt(supabase, data.registrationId, 'failed', err);
      return { success: false, error: err };
    }

    const fromAddress = process.env.EMAIL_FROM || 'onboarding@resend.dev';
    const fromName = process.env.EMAIL_FROM_NAME || 'Freshers 2026 - JSCE';

    const attachments: Array<{ filename: string; content: Buffer }> = [];
    if (data.ticketPdf) {
      attachments.push({
        filename: `EntryTicket-${data.registrationId}.html`,
        content: data.ticketPdf,
      });
    }
    if (data.invoicePdf) {
      attachments.push({
        filename: `Invoice-${data.registrationId}.html`,
        content: data.invoicePdf,
      });
    }

    const result = await resend.emails.send({
      from: `${fromName} <${fromAddress}>`,
      to: toEmail,
      subject: 'Freshers 2026 – Registration & Admission Ticket Confirmed! 🎉',
      html: buildEmailHTML(data),
      attachments: attachments.length > 0 ? attachments : undefined,
    });

    if (result.error) {
      await logEmailAttempt(supabase, data.registrationId, 'failed', result.error.message);
      return { success: false, error: result.error.message };
    }

    const messageId = result.data?.id;
    await logEmailAttempt(supabase, data.registrationId, 'sent', null, messageId);
    return { success: true, messageId };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error sending email';
    await logEmailAttempt(supabase, data.registrationId, 'failed', message);
    return { success: false, error: message };
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function logEmailAttempt(supabase: any, registrationId: string, status: 'sent' | 'failed', errorMsg?: string | null, messageId?: string) {
  try {
    await supabase.from('email_logs').insert({
      registration_id: registrationId,
      email_type: 'confirmation',
      delivery_status: status,
      sent_at: status === 'sent' ? new Date().toISOString() : null,
      error_message: errorMsg || (messageId ? `Message ID: ${messageId}` : null),
    });
  } catch (err) {
    console.error('Failed to log email attempt:', err);
  }
}

function buildEmailHTML(data: ConfirmationEmailData): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://fresher-2026-rouge.vercel.app';
  const tokenQuery = data.ticketToken ? `?token=${data.ticketToken}` : '';
  const ticketDownloadUrl = `${appUrl}/api/ticket/${data.registrationId}${tokenQuery}`;
  const invoiceDownloadUrl = `${appUrl}/api/invoice/${data.registrationId}${tokenQuery}`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Registration Confirmed - Freshers 2026</title>
</head>
<body style="margin:0;padding:0;background-color:#0a0118;font-family:'Segoe UI',Arial,sans-serif;color:#ffffff;">
  <div style="max-width:600px;margin:0 auto;padding:20px;">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#1a0533 0%,#0d1b4b 100%);border-radius:16px 16px 0 0;padding:35px 25px;text-align:center;border:1px solid rgba(139,92,246,0.3);">
      <h1 style="color:#a855f7;font-size:12px;letter-spacing:3px;text-transform:uppercase;margin:0 0 10px;">JAYAWANTRAO SAWANT COLLEGE OF ENGINEERING</h1>
      <h2 style="color:#ffffff;font-size:30px;margin:0;font-weight:800;">FRESHERS 2026</h2>
      <p style="color:#60a5fa;margin:8px 0 0;font-size:15px;font-weight:600;">Admission Pass Confirmed ✓</p>
    </div>
    
    <!-- Success Banner -->
    <div style="background:linear-gradient(135deg,#059669,#047857);padding:18px;text-align:center;">
      <p style="color:#ffffff;font-size:18px;font-weight:700;margin:0;">🎉 Payment Verified Successfully!</p>
      <p style="color:#d1fae5;margin:4px 0 0;font-size:13px;">Your registration for Freshers 2026 is confirmed</p>
    </div>
    
    <!-- Content -->
    <div style="background:#0f0528;border:1px solid rgba(139,92,246,0.3);border-top:none;border-radius:0 0 16px 16px;padding:25px;">
      <p style="color:#e2e8f0;font-size:15px;margin:0 0 20px;">Dear <strong style="color:#c084fc;">${data.studentName}</strong>,</p>
      <p style="color:#94a3b8;font-size:14px;line-height:1.6;margin:0 0 25px;">
        Congratulations! Your payment has been verified and your spot at Freshers 2026 is officially booked.
        Below is your entry pass. Show the QR code below at the entry gate on event day.
      </p>

      ${
        data.qrCodeDataUrl
          ? `
      <!-- Embedded QR Code -->
      <div style="text-align:center;background:#1a0533;border:1px solid rgba(139,92,246,0.4);border-radius:16px;padding:25px;margin-bottom:25px;">
        <p style="color:#a855f7;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin:0 0 12px;">Official Admission QR Pass</p>
        <img src="${data.qrCodeDataUrl}" alt="Entry QR Code" style="width:190px;height:190px;border-radius:12px;background:#ffffff;padding:8px;display:inline-block;box-shadow:0 10px 25px rgba(0,0,0,0.5);" />
        <p style="color:#94a3b8;font-size:12px;margin:12px 0 0;">Scan at Auditorium Entrance</p>
      </div>
      `
          : ''
      }
      
      <!-- Details Card -->
      <div style="background:rgba(139,92,246,0.08);border:1px solid rgba(139,92,246,0.25);border-radius:12px;padding:20px;margin-bottom:25px;">
        <h3 style="color:#a855f7;font-size:13px;text-transform:uppercase;letter-spacing:2px;margin:0 0 15px;">Registration Summary</h3>
        ${detailRow('Registration ID', data.registrationId)}
        ${detailRow('Student Name', data.studentName)}
        ${detailRow('Department', data.department)}
        ${detailRow('College ID / PRN', data.collegeId)}
        ${detailRow('Payment / UTR Ref', data.paymentId)}
        ${detailRow('Amount Paid', `₹${data.amount}`)}
        ${detailRow('Event Date', data.eventDate)}
        ${detailRow('Venue', data.eventVenue)}
      </div>

      <!-- Action Buttons (Direct Secure Download Links) -->
      <div style="text-align:center;margin:30px 0;">
        <a href="${ticketDownloadUrl}" target="_blank" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#2563eb);color:#ffffff;text-decoration:none;font-weight:700;padding:12px 24px;border-radius:10px;font-size:14px;margin:5px;box-shadow:0 4px 15px rgba(124,58,237,0.3);">
          🎟️ View & Download Ticket PDF
        </a>
        <a href="${invoiceDownloadUrl}" target="_blank" style="display:inline-block;background:rgba(139,92,246,0.15);color:#c084fc;text-decoration:none;font-weight:600;padding:12px 20px;border-radius:10px;font-size:14px;margin:5px;border:1px solid rgba(139,92,246,0.3);">
          📄 Download Tax Invoice
        </a>
      </div>
      
      <!-- Instructions -->
      <div style="background:rgba(59,130,246,0.08);border:1px solid rgba(59,130,246,0.25);border-radius:12px;padding:20px;margin-bottom:25px;">
        <h3 style="color:#60a5fa;font-size:13px;text-transform:uppercase;letter-spacing:2px;margin:0 0 12px;">📋 Gate Entry Instructions</h3>
        <ul style="color:#94a3b8;font-size:13px;padding-left:20px;margin:0;line-height:1.8;">
          <li>Show the QR code above or your downloaded PDF ticket at the entrance.</li>
          <li>Each QR code is unique and valid for <strong>one entry only</strong>.</li>
          <li>Keep your physical College ID card ready for verification.</li>
        </ul>
      </div>
      
      <!-- Footer note -->
      <p style="color:#64748b;font-size:12px;text-align:center;margin:25px 0 0;line-height:1.6;">
        This is an automated confirmation from the Freshers 2026 Committee.<br>
        <strong style="color:#a855f7;">JSCE Freshers 2026 – Jayawantrao Sawant College of Engineering</strong>
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

function detailRow(label: string, value: string): string {
  return `
    <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid rgba(139,92,246,0.12);">
      <span style="color:#94a3b8;font-size:13px;">${label}</span>
      <span style="color:#e2e8f0;font-size:13px;font-weight:600;">${value}</span>
    </div>
  `;
}
