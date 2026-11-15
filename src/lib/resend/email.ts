// Email sending is disabled.
// Students download their ticket and invoice directly from the website after payment.
// Flow: Register → Pay via UPI → Enter 12-digit UTR → Download Ticket & Invoice on success page.

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

// No-op stub — email sending removed. Returns success silently so callers don't crash.
export async function sendConfirmationEmail(
  _toEmail: string,
  _data: ConfirmationEmailData,
  _options: { forceResend?: boolean } = {}
): Promise<{ success: boolean; messageId?: string; error?: string; alreadySent?: boolean }> {
  return { success: true, alreadySent: false };
}
