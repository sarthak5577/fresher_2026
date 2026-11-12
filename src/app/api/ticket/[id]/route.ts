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
      return NextResponse.json({ error: 'Registration not found.' }, { status: 404 });
    }

    if (registration.payment_status !== 'paid') {
      return NextResponse.json({ error: 'Payment not completed.' }, { status: 403 });
    }

    // Validate token for public access
    if (tokenParam) {
      const { hashToken } = await import('@/lib/utils/token');
      const tokenHash = hashToken(tokenParam);
      if (tokenHash !== registration.ticket_token_hash) {
        return NextResponse.json({ error: 'Invalid access token.' }, { status: 403 });
      }
    } else {
      // Check admin auth
      const serverClient = await createClient();
      const { data: { user } } = await serverClient.auth.getUser();
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
      }
    }

    const ticketHTML = registration.ticket_html || '';

    return new NextResponse(ticketHTML, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `attachment; filename="EntryTicket-${registrationId}.html"`,
      },
    });
  } catch (error: unknown) {
    console.error('Ticket download error:', error);
    return NextResponse.json({ error: 'Failed to generate ticket.' }, { status: 500 });
  }
}

