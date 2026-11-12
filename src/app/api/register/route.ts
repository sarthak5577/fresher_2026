import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { initiatePaytmTransaction } from '@/lib/paytm/checkout';
import { generateRegistrationId } from '@/lib/utils/token';
import {
  validateEmail,
  validateIndianPhone,
  validateCollegeId,
  validateName,
  normalizeCollegeId,
} from '@/lib/utils/validation';
import { RESERVATION_EXPIRY_MINUTES } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { studentName, department, collegeId, phone, email } = body;

    // --- Server-side validation ---
    if (!studentName || !department || !collegeId || !phone || !email) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
    }
    if (!validateName(studentName)) {
      return NextResponse.json({ error: 'Invalid name.' }, { status: 400 });
    }
    if (!validateEmail(email)) {
      return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 });
    }
    if (!validateIndianPhone(phone)) {
      return NextResponse.json({ error: 'Invalid Indian mobile number. Enter 10 digits starting with 6-9.' }, { status: 400 });
    }
    if (!validateCollegeId(collegeId)) {
      return NextResponse.json({ error: 'Invalid College ID / PRN.' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const normalizedCollegeId = normalizeCollegeId(collegeId);

    // --- Get event settings ---
    const { data: settings } = await supabase
      .from('event_settings')
      .select('*')
      .eq('id', 1)
      .single();

    if (!settings) {
      return NextResponse.json({ error: 'Event settings not configured.' }, { status: 500 });
    }

    if (!settings.registration_open) {
      return NextResponse.json({ error: 'Registration is currently closed.' }, { status: 400 });
    }

    // Validate department
    const allowedDepts: string[] = settings.departments || [];
    if (!allowedDepts.includes(department)) {
      return NextResponse.json({ error: 'Invalid department selected.' }, { status: 400 });
    }

    // --- Check capacity (only paid registrations count) ---
    const { count: paidCount } = await supabase
      .from('registrations')
      .select('*', { count: 'exact', head: true })
      .eq('payment_status', 'paid');

    if ((paidCount || 0) >= settings.maximum_capacity) {
      return NextResponse.json({ error: 'Registration capacity is full.' }, { status: 400 });
    }

    // --- Check duplicate registration ---
    const { data: existingReg } = await supabase
      .from('registrations')
      .select('id, payment_status, registration_id, paytm_order_id, reservation_expires_at')
      .eq('college_id_normalized', normalizedCollegeId)
      .maybeSingle();

    if (existingReg) {
      if (existingReg.payment_status === 'paid') {
        return NextResponse.json(
          { error: `You are already registered. Your Registration ID is ${existingReg.registration_id}.` },
          { status: 400 }
        );
      }

      // Check if reservation is still valid
      if (existingReg.reservation_expires_at) {
        const expiresAt = new Date(existingReg.reservation_expires_at);
        if (expiresAt > new Date() && existingReg.paytm_order_id) {
          // Still within window — return existing order info
          return NextResponse.json({
            registrationId: existingReg.registration_id,
            paytmOrderId: existingReg.paytm_order_id,
            amount: settings.registration_fee / 100,
            amountPaise: settings.registration_fee,
          });
        }
      }
    }

    // --- Create registration ID and Paytm order ---
    const registrationId = existingReg
      ? existingReg.registration_id
      : generateRegistrationId();

    const paytmOrderId = `JSCE-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    const amountStr = (settings.registration_fee / 100).toFixed(2);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const paytmResult = await initiatePaytmTransaction({
      orderId: paytmOrderId,
      amount: amountStr,
      customerId: normalizedCollegeId,
      customerEmail: email,
      customerPhone: phone.replace(/\D/g, ''),
      callbackUrl: `${appUrl}/api/payment/paytm-callback`,
    });

    if (!paytmResult.success) {
      // Paytm not configured yet — still create registration, student will use UPI QR manually
      console.warn('Paytm not configured:', paytmResult.error);
    }

    const reservationExpiresAt = new Date(
      Date.now() + RESERVATION_EXPIRY_MINUTES * 60 * 1000
    ).toISOString();

    // --- Upsert registration record ---
    if (existingReg) {
      await supabase
        .from('registrations')
        .update({
          student_name: studentName,
          department,
          phone,
          email,
          payment_status: 'pending',
          paytm_order_id: paytmOrderId,
          reservation_expires_at: reservationExpiresAt,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingReg.id);
    } else {
      const { error: insertError } = await supabase
        .from('registrations')
        .insert({
          registration_id: registrationId,
          student_name: studentName,
          department,
          college_id: collegeId,
          college_id_normalized: normalizedCollegeId,
          phone,
          email,
          payment_status: 'pending',
          entry_status: 'not_entered',
          paytm_order_id: paytmOrderId,
          reservation_expires_at: reservationExpiresAt,
        });

      if (insertError) {
        if (insertError.code === '23505') {
          return NextResponse.json(
            { error: 'A registration with this College ID already exists.' },
            { status: 400 }
          );
        }
        throw insertError;
      }
    }

    // --- Create payment record ---
    await supabase.from('payments').upsert(
      {
        registration_id: registrationId,
        paytm_order_id: paytmOrderId,
        amount: settings.registration_fee,
        currency: 'INR',
        status: 'created',
        payment_method: 'upi',
      },
      { onConflict: 'paytm_order_id' }
    );

    return NextResponse.json({
      registrationId,
      paytmOrderId,
      txnToken: paytmResult.txnToken || null,
      amount: settings.registration_fee / 100,
      amountPaise: settings.registration_fee,
      paytmConfigured: paytmResult.success,
      paytmBaseUrl: process.env.PAYTM_ENVIRONMENT === 'production'
        ? 'https://securegw.paytm.in'
        : 'https://securegw-stage.paytm.in',
      mid: process.env.PAYTM_MERCHANT_ID || '',
    });
  } catch (error: unknown) {
    console.error('Registration error:', error);
    const message = error instanceof Error ? error.message : 'Registration failed.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
