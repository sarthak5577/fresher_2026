import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

// Paytm redirects here after payment (GET or POST)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get('ORDERID') || searchParams.get('orderId') || '';
  const status = searchParams.get('STATUS') || '';

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  if (status === 'TXN_FAILURE') {
    return Response.redirect(`${baseUrl}/payment/failed?orderId=${orderId}`);
  }

  // Find registration for this order
  const supabase = createAdminClient();
  const { data: payment } = await supabase
    .from('payments')
    .select('registration_id')
    .eq('paytm_order_id', orderId)
    .single();

  if (!payment) {
    return Response.redirect(`${baseUrl}/payment/failed?orderId=${orderId}`);
  }

  // Redirect to success page — the page will verify payment via API
  return Response.redirect(
    `${baseUrl}/payment/success?id=${payment.registration_id}&oid=${orderId}`
  );
}

export async function POST(request: NextRequest) {
  // Paytm may POST to callback URL — handle same as GET
  let orderId = '';
  let status = '';

  try {
    const body = await request.formData();
    orderId = (body.get('ORDERID') as string) || '';
    status = (body.get('STATUS') as string) || '';
  } catch {
    const body = await request.json().catch(() => ({}));
    orderId = body.ORDERID || '';
    status = body.STATUS || '';
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  if (status === 'TXN_FAILURE') {
    return Response.redirect(`${baseUrl}/payment/failed?orderId=${orderId}`);
  }

  const supabase = createAdminClient();
  const { data: payment } = await supabase
    .from('payments')
    .select('registration_id')
    .eq('paytm_order_id', orderId)
    .single();

  if (!payment) {
    return Response.redirect(`${baseUrl}/payment/failed?orderId=${orderId}`);
  }

  return Response.redirect(
    `${baseUrl}/payment/success?id=${payment.registration_id}&oid=${orderId}`
  );
}

