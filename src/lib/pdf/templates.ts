// PDF generation using pure HTML + server-side rendering approach
// We generate HTML and use Puppeteer-compatible buffer or a lightweight PDF library

export interface InvoiceData {
  invoiceNumber: string;
  registrationId: string;
  studentName: string;
  department: string;
  collegeId: string;
  phone: string;
  email: string;
  paymentId: string;
  paymentDate: string;
  amount: number;
  eventDate: string;
  eventVenue: string;
  qrCodeDataUrl: string;
}

export function buildInvoiceHTML(data: InvoiceData): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Invoice - ${data.invoiceNumber}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Helvetica Neue', Arial, sans-serif; background: #fff; color: #1a1a2e; }
  .container { max-width: 700px; margin: 0 auto; padding: 40px; }
  .header { background: linear-gradient(135deg, #1a0533, #0d1b4b); color: white; padding: 30px; border-radius: 12px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-start; }
  .header-left h1 { font-size: 11px; letter-spacing: 2px; color: #a855f7; text-transform: uppercase; margin-bottom: 6px; }
  .header-left h2 { font-size: 26px; font-weight: 800; color: white; margin-bottom: 4px; }
  .header-left p { color: #93c5fd; font-size: 13px; }
  .invoice-label { background: #7c3aed; padding: 8px 20px; border-radius: 20px; font-size: 13px; font-weight: 600; color: white; }
  .invoice-meta { background: #f8f4ff; border: 1px solid #e9d5ff; border-radius: 12px; padding: 20px; margin-bottom: 24px; display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .meta-item label { font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 2px; }
  .meta-item span { font-size: 14px; font-weight: 600; color: #1a1a2e; }
  .section-title { font-size: 12px; letter-spacing: 2px; text-transform: uppercase; color: #7c3aed; font-weight: 700; margin-bottom: 12px; padding-bottom: 6px; border-bottom: 2px solid #e9d5ff; }
  .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0; border: 1px solid #e9d5ff; border-radius: 12px; overflow: hidden; margin-bottom: 24px; }
  .detail-row { display: contents; }
  .detail-label { background: #f8f4ff; padding: 10px 16px; font-size: 12px; color: #6b7280; font-weight: 500; border-bottom: 1px solid #e9d5ff; }
  .detail-value { background: white; padding: 10px 16px; font-size: 13px; color: #1a1a2e; font-weight: 600; border-bottom: 1px solid #e9d5ff; }
  .payment-box { background: linear-gradient(135deg, #1a0533, #0d1b4b); border-radius: 12px; padding: 20px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; }
  .payment-box .amount { font-size: 32px; font-weight: 800; color: #a855f7; }
  .payment-box .status { background: #059669; color: white; padding: 6px 16px; border-radius: 20px; font-size: 12px; font-weight: 700; }
  .qr-section { text-align: center; border: 1px solid #e9d5ff; border-radius: 12px; padding: 20px; margin-bottom: 24px; }
  .qr-section img { width: 180px; height: 180px; }
  .qr-section p { color: #6b7280; font-size: 12px; margin-top: 8px; }
  .footer { background: #f8f4ff; border-radius: 12px; padding: 16px; text-align: center; color: #6b7280; font-size: 11px; line-height: 1.6; }
  .footer strong { color: #7c3aed; }
  .paid-stamp { position: relative; }
  .paid-stamp::after { content: 'PAID'; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-30deg); font-size: 48px; font-weight: 900; color: rgba(5, 150, 105, 0.15); border: 4px solid rgba(5, 150, 105, 0.15); border-radius: 8px; padding: 4px 16px; letter-spacing: 6px; }
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <div class="header-left">
      <h1>Jayawantrao Sawant College of Engineering</h1>
      <h2>FRESHERS 2026</h2>
      <p>Official Registration Invoice</p>
    </div>
    <div class="invoice-label">INVOICE</div>
  </div>
  
  <div class="invoice-meta">
    <div class="meta-item">
      <label>Invoice Number</label>
      <span>${data.invoiceNumber}</span>
    </div>
    <div class="meta-item">
      <label>Registration ID</label>
      <span>${data.registrationId}</span>
    </div>
    <div class="meta-item">
      <label>Payment Date</label>
      <span>${data.paymentDate}</span>
    </div>
    <div class="meta-item">
      <label>Payment ID</label>
      <span>${data.paymentId}</span>
    </div>
  </div>
  
  <p class="section-title">Student Information</p>
  <div class="details-grid">
    <div class="detail-label">Student Name</div>
    <div class="detail-value">${data.studentName}</div>
    <div class="detail-label">Department</div>
    <div class="detail-value">${data.department}</div>
    <div class="detail-label">College ID / PRN</div>
    <div class="detail-value">${data.collegeId}</div>
    <div class="detail-label">Email Address</div>
    <div class="detail-value">${data.email}</div>
    <div class="detail-label">Phone Number</div>
    <div class="detail-value">${data.phone}</div>
  </div>
  
  <p class="section-title">Event Details</p>
  <div class="details-grid">
    <div class="detail-label">Event Name</div>
    <div class="detail-value">Freshers 2026</div>
    <div class="detail-label">College</div>
    <div class="detail-value">Jayawantrao Sawant College of Engineering</div>
    <div class="detail-label">Event Date</div>
    <div class="detail-value">${data.eventDate}</div>
    <div class="detail-label">Venue</div>
    <div class="detail-value">${data.eventVenue}</div>
  </div>
  
  <div class="payment-box paid-stamp">
    <div>
      <div style="color:#94a3b8;font-size:12px;margin-bottom:4px;">AMOUNT PAID</div>
      <div class="amount">₹${data.amount}</div>
      <div style="color:#94a3b8;font-size:11px;margin-top:4px;">Registration Fee (Inclusive of all charges)</div>
    </div>
    <div class="status">✓ PAID</div>
  </div>
  
  <div class="qr-section">
    <p class="section-title" style="margin-bottom:16px;">QR Entry Ticket</p>
    <img src="${data.qrCodeDataUrl}" alt="QR Code" />
    <p>Scan this QR code at the event entry gate</p>
  </div>
  
  <div class="footer">
    <strong>Jayawantrao Sawant College of Engineering – Freshers 2026</strong><br>
    This is a computer-generated invoice. No physical signature required.<br>
    For queries, contact the event coordination team.
  </div>
</div>
</body>
</html>`;
}

export function buildTicketHTML(data: {
  studentName: string;
  department: string;
  collegeId: string;
  registrationId: string;
  eventDate: string;
  eventVenue: string;
  qrCodeDataUrl: string;
}): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Entry Ticket - ${data.registrationId}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Helvetica Neue', Arial, sans-serif; background: #0f0528; display: flex; justify-content: center; align-items: center; min-height: 100vh; padding: 20px; }
  .ticket { background: linear-gradient(135deg, #1a0533, #0d1b4b); border: 2px solid #7c3aed; border-radius: 24px; padding: 0; overflow: hidden; max-width: 500px; width: 100%; }
  .ticket-header { background: linear-gradient(135deg, #7c3aed, #3b82f6); padding: 24px 30px; text-align: center; }
  .ticket-header h1 { font-size: 11px; color: rgba(255,255,255,0.8); letter-spacing: 3px; text-transform: uppercase; margin-bottom: 6px; }
  .ticket-header h2 { font-size: 28px; font-weight: 900; color: white; }
  .ticket-header p { color: rgba(255,255,255,0.7); font-size: 12px; margin-top: 4px; }
  .ticket-body { padding: 30px; }
  .student-name { font-size: 24px; font-weight: 800; color: white; margin-bottom: 4px; }
  .student-dept { color: #a855f7; font-size: 14px; margin-bottom: 20px; }
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px; }
  .info-item label { font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 2px; }
  .info-item span { font-size: 13px; color: #e2e8f0; font-weight: 600; }
  .divider { border: none; border-top: 2px dashed rgba(124,58,237,0.4); margin: 20px 0; }
  .qr-section { text-align: center; }
  .qr-section img { width: 200px; height: 200px; border-radius: 12px; border: 3px solid rgba(124,58,237,0.4); }
  .qr-label { color: #64748b; font-size: 11px; margin-top: 8px; letter-spacing: 1px; text-transform: uppercase; }
  .ticket-footer { background: rgba(0,0,0,0.3); padding: 14px 30px; text-align: center; color: #475569; font-size: 11px; }
  .valid-badge { display: inline-block; background: #059669; color: white; padding: 4px 14px; border-radius: 20px; font-size: 11px; font-weight: 700; margin-bottom: 6px; }
</style>
</head>
<body>
<div class="ticket">
  <div class="ticket-header">
    <h1>Jayawantrao Sawant College of Engineering</h1>
    <h2>FRESHERS 2026</h2>
    <p>Official Entry Ticket</p>
  </div>
  <div class="ticket-body">
    <div class="valid-badge">✓ VALID TICKET</div>
    <div class="student-name">${data.studentName}</div>
    <div class="student-dept">${data.department}</div>
    <div class="info-grid">
      <div class="info-item">
        <label>Registration ID</label>
        <span>${data.registrationId}</span>
      </div>
      <div class="info-item">
        <label>College ID / PRN</label>
        <span>${data.collegeId}</span>
      </div>
      <div class="info-item">
        <label>Event Date</label>
        <span>${data.eventDate}</span>
      </div>
      <div class="info-item">
        <label>Venue</label>
        <span>${data.eventVenue}</span>
      </div>
    </div>
    <hr class="divider" />
    <div class="qr-section">
      <img src="${data.qrCodeDataUrl}" alt="QR Code" />
      <div class="qr-label">Scan at Entry Gate</div>
    </div>
  </div>
  <div class="ticket-footer">
    This ticket is valid for one person only. Non-transferable.<br>
    Present this QR code at the event entry gate.
  </div>
</div>
</body>
</html>`;
}

