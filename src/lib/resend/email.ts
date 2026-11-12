import { Resend } from 'resend';

let resendInstance: Resend | null = null;

function getResend(): Resend {
  if (!resendInstance) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY not configured');
    }
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
  invoicePdf: Buffer;
  ticketPdf: Buffer;
}

export async function sendConfirmationEmail(
  toEmail: string,
  data: ConfirmationEmailData
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const resend = getResend();
    const fromAddress = process.env.EMAIL_FROM || 'noreply@freshers2026.com';
    const fromName = process.env.EMAIL_FROM_NAME || 'Freshers 2026 - JSCE';

    const result = await resend.emails.send({
      from: `${fromName} <${fromAddress}>`,
      to: toEmail,
      subject: 'Freshers 2026 – Registration Successful! 🎉',
      html: buildEmailHTML(data),
      attachments: [
        {
          filename: `Invoice-${data.registrationId}.pdf`,
          content: data.invoicePdf,
        },
        {
          filename: `EntryTicket-${data.registrationId}.pdf`,
          content: data.ticketPdf,
        },
      ],
    });

    if (result.error) {
      return { success: false, error: result.error.message };
    }

    return { success: true, messageId: result.data?.id };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: message };
  }
}

function buildEmailHTML(data: ConfirmationEmailData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Registration Confirmed - Freshers 2026</title>
</head>
<body style="margin:0;padding:0;background-color:#0f0528;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:20px;">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#1a0533 0%,#0d1b4b 100%);border-radius:16px 16px 0 0;padding:40px 30px;text-align:center;border:1px solid rgba(139,92,246,0.3);">
      <h1 style="color:#a855f7;font-size:14px;letter-spacing:3px;text-transform:uppercase;margin:0 0 10px;">JAYAWANTRAO SAWANT COLLEGE OF ENGINEERING</h1>
      <h2 style="color:#ffffff;font-size:32px;margin:0;font-weight:800;">FRESHERS 2026</h2>
      <p style="color:#60a5fa;margin:10px 0 0;font-size:16px;">Registration Confirmed ✓</p>
    </div>
    
    <!-- Success Banner -->
    <div style="background:linear-gradient(135deg,#059669,#047857);padding:20px;text-align:center;">
      <p style="color:#ffffff;font-size:20px;font-weight:700;margin:0;">🎉 Payment Successful!</p>
      <p style="color:#d1fae5;margin:5px 0 0;font-size:14px;">Your spot at Freshers 2026 is confirmed</p>
    </div>
    
    <!-- Content -->
    <div style="background:#1a0533;border:1px solid rgba(139,92,246,0.3);border-top:none;border-radius:0 0 16px 16px;padding:30px;">
      <p style="color:#e2e8f0;font-size:16px;margin:0 0 25px;">Dear <strong style="color:#a855f7;">${data.studentName}</strong>,</p>
      <p style="color:#94a3b8;font-size:14px;margin:0 0 25px;">Congratulations! Your registration for Freshers 2026 has been confirmed. Please find your registration details below and the attached PDF invoice and QR entry ticket.</p>
      
      <!-- Details Card -->
      <div style="background:rgba(139,92,246,0.1);border:1px solid rgba(139,92,246,0.3);border-radius:12px;padding:20px;margin-bottom:25px;">
        <h3 style="color:#a855f7;font-size:14px;text-transform:uppercase;letter-spacing:2px;margin:0 0 15px;">Registration Details</h3>
        ${detailRow('Registration ID', data.registrationId)}
        ${detailRow('Student Name', data.studentName)}
        ${detailRow('Department', data.department)}
        ${detailRow('College ID / PRN', data.collegeId)}
        ${detailRow('Payment ID', data.paymentId)}
        ${detailRow('Amount Paid', `₹${data.amount}`)}
        ${detailRow('Event Date', data.eventDate)}
        ${detailRow('Venue', data.eventVenue)}
      </div>
      
      <!-- Instructions -->
      <div style="background:rgba(59,130,246,0.1);border:1px solid rgba(59,130,246,0.3);border-radius:12px;padding:20px;margin-bottom:25px;">
        <h3 style="color:#60a5fa;font-size:14px;text-transform:uppercase;letter-spacing:2px;margin:0 0 12px;">📋 Entry Instructions</h3>
        <ul style="color:#94a3b8;font-size:13px;padding-left:20px;margin:0;line-height:1.8;">
          <li>Bring your QR Entry Ticket (attached PDF) to the event</li>
          <li>Your QR code will be scanned at the entry gate</li>
          <li>Keep your College ID card handy for verification</li>
          <li>Arrive on time – entry is first come, first served</li>
        </ul>
      </div>
      
      <!-- Footer note -->
      <p style="color:#64748b;font-size:12px;text-align:center;margin:20px 0 0;">
        This is an automated email. Please do not reply.<br>
        For support, contact your college event coordinator.<br><br>
        <strong style="color:#a855f7;">FRESHERS 2026 – Jayawantrao Sawant College of Engineering</strong>
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

function detailRow(label: string, value: string): string {
  return `
    <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid rgba(139,92,246,0.15);">
      <span style="color:#94a3b8;font-size:13px;">${label}</span>
      <span style="color:#e2e8f0;font-size:13px;font-weight:600;">${value}</span>
    </div>
  `;
}

