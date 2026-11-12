import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
import { verifyWebhookSignature } from '@/lib/razorpay/verify';

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-razorpay-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature.' }, { status: 400 });
    }

    // Verify webhook signature using raw body
    const isValid = verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid signature.' }, { status: 400 });
    }

    const event = JSON.parse(rawBody);
    const eventId = event.payload?.payment?.entity?.id || `${event.event}_${Date.now()}`;
    const supabase = createAdminClient();

    // Idempotency: check if already processed
    const { data: existing } = await supabase
      .from('webhook_events')
      .select('id')
      .eq('razorpay_event_id', eventId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ status: 'already_processed' });
    }

    // Log webhook event
    await supabase.from('webhook_events').insert({
      razorpay_event_id: eventId,
      event_type: event.event,
      processing_status: 'processing',
    });

    let processingStatus = 'success';

    try {
      switch (event.event) {
        case 'payment.captured': {
          const paymentEntity = event.payload.payment.entity;
          await supabase
            .from('payments')
            .update({
              status: 'captured',
              payment_method: paymentEntity.method,
              verified_at: new Date().toISOString(),
            })
            .eq('razorpay_order_id', paymentEntity.order_id);
          break;
        }

        case 'payment.failed': {
          const paymentEntity = event.payload.payment.entity;
          await supabase
            .from('payments')
            .update({ status: 'failed' })
            .eq('razorpay_order_id', paymentEntity.order_id);

          await supabase
            .from('registrations')
            .update({ payment_status: 'failed', updated_at: new Date().toISOString() })
            .eq('razorpay_order_id', paymentEntity.order_id)
            .eq('payment_status', 'pending');
          break;
        }

        case 'refund.created':
        case 'refund.processed': {
          const refundEntity = event.payload.refund.entity;
          await supabase
            .from('payments')
            .update({ status: 'refunded' })
            .eq('razorpay_payment_id', refundEntity.payment_id);

          await supabase
            .from('registrations')
            .update({ payment_status: 'refunded', updated_at: new Date().toISOString() })
            .eq('razorpay_order_id', refundEntity.payment_id);
          break;
        }

        default:
          // Log but don't fail
          break;
      }
    } catch (err) {
      processingStatus = 'failed';
      console.error('Webhook processing error:', err);
    }

    // Update processing status
    await supabase
      .from('webhook_events')
      .update({
        processed_at: new Date().toISOString(),
        processing_status: processingStatus,
      })
      .eq('razorpay_event_id', eventId);

    return NextResponse.json({ status: 'ok' });
  } catch (error: unknown) {
    console.error('Webhook handler error:', error);
    return NextResponse.json({ error: 'Webhook processing failed.' }, { status: 500 });
  }
}

