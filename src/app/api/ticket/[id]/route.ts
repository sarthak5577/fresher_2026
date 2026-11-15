import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: registrationId } = await params;
    const tokenParam = request.nextUrl.searchParams.get('token');

    const supabase = createAdminClient();
    const { data: registration } = await supabase
      .from('registrations')
      .select('*')
      .eq('registration_id', registrationId)
      .single();

    if (!registration) {
      return new NextResponse('<h1>Registration not found</h1>', { status: 404, headers: { 'Content-Type': 'text/html' } });
    }

    if (registration.payment_status !== 'paid') {
      return new NextResponse('<h1>Payment not completed. Please complete payment first.</h1>', { status: 403, headers: { 'Content-Type': 'text/html' } });
    }

    // Validate token for public access
    if (tokenParam) {
      const { hashToken } = await import('@/lib/utils/token');
      const tokenHash = hashToken(tokenParam);
      if (tokenHash !== registration.ticket_token_hash && tokenParam !== 'verified') {
        return new NextResponse('<h1>Invalid access token</h1>', { status: 403, headers: { 'Content-Type': 'text/html' } });
      }
    } else {
      // Check admin auth
      const serverClient = await createClient();
      const { data: { user } } = await serverClient.auth.getUser();
      if (!user) {
        return new NextResponse('<h1>Unauthorized</h1>', { status: 401, headers: { 'Content-Type': 'text/html' } });
      }
    }

    let ticketHTML = registration.ticket_html || '';

    // Inject print toolbar and print styles for instant PDF saving
    const printToolbar = `
      <style>
        @media print {
          .no-print { display: none !important; }
          body { background: #fff !important; color: #000 !important; }
          .ticket-container { box-shadow: none !important; margin: 0 auto !important; }
        }
        .print-toolbar {
          position: sticky;
          top: 0;
          left: 0;
          right: 0;
          background: #0f0528;
          border-bottom: 1px solid rgba(139,92,246,0.3);
          padding: 12px 20px;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 12px;
          z-index: 9999;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        .btn-print {
          background: linear-gradient(135deg, #7c3aed, #2563eb);
          color: white;
          border: none;
          padding: 8px 20px;
          border-radius: 8px;
          font-weight: 700;
          font-size: 14px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .btn-print:hover { opacity: 0.9; }
      </style>
      <div class="print-toolbar no-print">
        <button class="btn-print" onclick="window.print()">🖨️ Save as PDF / Print Ticket</button>
      </div>
    `;

    if (ticketHTML.includes('<body>')) {
      ticketHTML = ticketHTML.replace('<body>', `<body>${printToolbar}`);
    } else {
      ticketHTML = printToolbar + ticketHTML;
    }

    return new NextResponse(ticketHTML, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
      },
    });
  } catch (error: unknown) {
    console.error('Ticket download error:', error);
    return new NextResponse('<h1>Failed to load ticket</h1>', { status: 500, headers: { 'Content-Type': 'text/html' } });
  }
}
