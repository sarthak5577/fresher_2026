// Paytm Business API utilities
// Server-side only — never import in client components

import crypto from 'crypto';

const PAYTM_MID = process.env.PAYTM_MERCHANT_ID || '';
const PAYTM_KEY = process.env.PAYTM_MERCHANT_KEY || '';
const PAYTM_WEBSITE = process.env.PAYTM_WEBSITE || 'WEBSTAGING';
const IS_PRODUCTION = process.env.NODE_ENV === 'production' && process.env.PAYTM_ENVIRONMENT === 'production';

export const PAYTM_BASE_URL = IS_PRODUCTION
  ? 'https://securegw.paytm.in'
  : 'https://securegw-stage.paytm.in';

export function getPaytmConfig() {
  return {
    mid: PAYTM_MID,
    key: PAYTM_KEY,
    website: PAYTM_WEBSITE,
    baseUrl: PAYTM_BASE_URL,
    isConfigured: !!(PAYTM_MID && PAYTM_KEY),
  };
}

// Generate Paytm checksum signature
export async function generateChecksum(params: Record<string, string>): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const PaytmChecksum = require('paytmchecksum');
  return PaytmChecksum.generateSignature(JSON.stringify(params), PAYTM_KEY);
}

// Verify Paytm checksum
export async function verifyChecksum(
  params: Record<string, string>,
  checksum: string
): Promise<boolean> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const PaytmChecksum = require('paytmchecksum');
  return PaytmChecksum.verifySignature(JSON.stringify(params), PAYTM_KEY, checksum);
}

// Verify Paytm webhook checksum (body is the full webhook body object)
export async function verifyWebhookChecksum(
  body: Record<string, unknown>,
  checksum: string
): Promise<boolean> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const PaytmChecksum = require('paytmchecksum');
    return PaytmChecksum.verifySignature(body, PAYTM_KEY, checksum);
  } catch {
    return false;
  }
}

// Create Paytm transaction (Initiate Transaction API)
export async function initiatePaytmTransaction(params: {
  orderId: string;
  amount: string;
  customerId: string;
  customerEmail: string;
  customerPhone: string;
  callbackUrl: string;
}): Promise<{ success: boolean; txnToken?: string; error?: string }> {
  try {
    const config = getPaytmConfig();
    if (!config.isConfigured) {
      return { success: false, error: 'Paytm is not configured. Please add PAYTM_MERCHANT_ID and PAYTM_MERCHANT_KEY to your environment variables.' };
    }

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const PaytmChecksum = require('paytmchecksum');

    const paytmParams: {
      body: Record<string, unknown>;
      head: Record<string, string>;
    } = {
      body: {
        requestType: 'Payment',
        mid: config.mid,
        websiteName: config.website,
        orderId: params.orderId,
        callbackUrl: params.callbackUrl,
        txnAmount: {
          value: params.amount,
          currency: 'INR',
        },
        userInfo: {
          custId: params.customerId,
          email: params.customerEmail,
          mobile: params.customerPhone,
        },
      },
      head: {
        signature: '',
      },
    };

    const checksum = await PaytmChecksum.generateSignature(
      JSON.stringify(paytmParams.body),
      config.key
    );
    paytmParams.head.signature = checksum;

    const response = await fetch(
      `${config.baseUrl}/theia/api/v1/initiateTransaction?mid=${config.mid}&orderId=${params.orderId}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paytmParams),
      }
    );

    const data = await response.json();

    if (data.body?.resultInfo?.resultStatus === 'S') {
      return { success: true, txnToken: data.body.txnToken };
    }

    return {
      success: false,
      error: data.body?.resultInfo?.resultMsg || 'Failed to initiate Paytm transaction.',
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: msg };
  }
}

// Query Paytm transaction status (to verify after payment)
export async function getPaytmTransactionStatus(orderId: string): Promise<{
  status: string;
  txnId?: string;
  amount?: string;
  utr?: string;
  resultMsg?: string;
}> {
  try {
    const config = getPaytmConfig();
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const PaytmChecksum = require('paytmchecksum');

    const body = { mid: config.mid, orderId };
    const checksum = await PaytmChecksum.generateSignature(JSON.stringify(body), config.key);

    const response = await fetch(`${config.baseUrl}/v3/order/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        body,
        head: { signature: checksum },
      }),
    });

    const data = await response.json();
    const bodyData = data.body || {};

    return {
      status: bodyData.resultInfo?.resultStatus || 'UNKNOWN',
      txnId: bodyData.txnId,
      amount: bodyData.txnAmount,
      utr: bodyData.bankTxnId || bodyData.refundAmt,
      resultMsg: bodyData.resultInfo?.resultMsg,
    };
  } catch {
    return { status: 'UNKNOWN' };
  }
}

// Generate a simple HMAC for internal webhook verification fallback
export function generateInternalHmac(data: string): string {
  const secret = process.env.INTERNAL_WEBHOOK_SECRET || 'jsce-freshers-2026-internal';
  return crypto.createHmac('sha256', secret).update(data).digest('hex');
}

