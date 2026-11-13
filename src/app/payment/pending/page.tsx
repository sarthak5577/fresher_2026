'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import QRCode from 'qrcode';
import {
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  Smartphone,
  ShieldCheck,
  Loader2,
  ArrowRight,
  Info,
} from 'lucide-react';

const UPI_ID = process.env.NEXT_PUBLIC_UPI_ID || 'ganeshgadre@ybl';
const UPI_NAME = process.env.NEXT_PUBLIC_UPI_NAME || 'Ganesh Gadre';
const AMOUNT = '300';

function PaymentPendingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const registrationId = searchParams.get('id') || '';
  const orderId = searchParams.get('oid') || '';

  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [utrNumber, setUtrNumber] = useState<string>('');
  const [verifying, setVerifying] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [status, setStatus] = useState<'pending' | 'paid' | 'failed'>('pending');

  const upiIntentUrl = `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(
    UPI_NAME
  )}&am=${AMOUNT}&cu=INR&tn=${encodeURIComponent(
    `Freshers2026-${registrationId}`
  )}`;

  // Generate QR code on load
  useEffect(() => {
    if (!registrationId) return;
    QRCode.toDataURL(upiIntentUrl, {
      width: 280,
      margin: 2,
      color: {
        dark: '#0f0528',
        light: '#ffffff',
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('QR generation error:', err));
  }, [registrationId, upiIntentUrl]);

  // Periodic fallback check if status changes (e.g. approved by admin)
  const checkStatus = useCallback(async () => {
    if (!registrationId || status === 'paid') return;
    try {
      const res = await fetch(`/api/payment/status?id=${registrationId}`);
      const data = await res.json();
      if (data.status === 'paid') {
        setStatus('paid');
        setTimeout(() => {
          router.push(`/payment/success?id=${registrationId}`);
        }, 1500);
      }
    } catch {
      // silent
    }
  }, [registrationId, status, router]);

  useEffect(() => {
    const interval = setInterval(checkStatus, 10000);
    return () => clearInterval(interval);
  }, [checkStatus]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(UPI_ID);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleUtrSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanUtr = utrNumber.trim().toUpperCase();

    if (!cleanUtr) {
      setError('Please enter the 12-digit UTR / UPI Transaction Reference Number.');
      return;
    }

    if (!/^[A-Z0-9]{12}$/.test(cleanUtr)) {
      setError('UTR must be exactly 12 alphanumeric characters / digits (e.g. 412345678901).');
      return;
    }

    setVerifying(true);

    try {
      const res = await fetch('/api/payment/utr-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registrationId,
          utrNumber: cleanUtr,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Verification failed. Please check the UTR and try again.');
        setVerifying(false);
        return;
      }

      setStatus('paid');

      // Redirect immediately to ticket success page
      const successUrl = `/payment/success?id=${registrationId}&token=${data.token || ''}&pid=${cleanUtr}`;
      setTimeout(() => {
        router.push(successUrl);
      }, 1200);
    } catch {
      setError('Network error. Please try again.');
      setVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0118] py-12 px-4 sm:px-6 flex items-center justify-center">
      <div className="max-w-xl w-full">
        {/* Main Card */}
        <div className="glass rounded-3xl p-6 sm:p-8 border border-purple-900/50 bg-[#0f0528]/90 shadow-2xl relative">
          
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 bg-purple-900/40 border border-purple-700/40 px-3.5 py-1.5 rounded-full mb-3">
              <ShieldCheck className="w-4 h-4 text-purple-300" />
              <span className="text-xs font-medium text-purple-300">
                Official Event Payment
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              Scan & Pay <span className="gradient-text">₹{AMOUNT}</span>
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              JSCE Freshers 2026 Registration Fee
            </p>
          </div>

          {/* Registration Info Pill */}
          <div className="bg-purple-950/40 border border-purple-900/40 rounded-2xl p-4 mb-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            <div>
              <div className="text-xs text-slate-400">Registration ID</div>
              <div className="text-white font-mono font-bold text-base">
                {registrationId}
              </div>
            </div>
            <div className="sm:text-right">
              <div className="text-xs text-slate-400">Payable Amount</div>
              <div className="text-green-400 font-bold text-lg">₹{AMOUNT}.00</div>
            </div>
          </div>

          {/* QR Code Section */}
          <div className="flex flex-col items-center mb-6">
            <div className="p-3 bg-white rounded-2xl shadow-xl border-4 border-purple-600/30">
              {qrDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={qrDataUrl}
                  alt="UPI QR Code"
                  className="w-56 h-56 sm:w-64 sm:h-64 object-contain rounded-xl"
                />
              ) : (
                <div className="w-56 h-56 sm:w-64 sm:h-64 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
                </div>
              )}
            </div>

            <p className="text-xs text-slate-400 mt-3 flex items-center gap-1.5">
              <span>Scan with any UPI App:</span>
              <span className="text-slate-200 font-medium">GPay • PhonePe • Paytm • BHIM</span>
            </p>

            {/* Mobile Pay Button */}
            <a
              href={upiIntentUrl}
              className="mt-4 w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-semibold text-sm rounded-xl transition-all shadow-lg hover:shadow-purple-500/25"
            >
              <Smartphone className="w-4 h-4" />
              Pay via UPI App Directly
            </a>

            {/* Copy UPI ID */}
            <div className="mt-3 flex items-center gap-2 text-xs">
              <span className="text-slate-400">UPI ID:</span>
              <code className="text-purple-300 font-mono bg-purple-900/30 px-2 py-1 rounded-md border border-purple-800/40">
                {UPI_ID}
              </code>
              <button
                type="button"
                onClick={copyToClipboard}
                className="text-slate-400 hover:text-white p-1 rounded transition-colors"
                title="Copy UPI ID"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-green-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          <div className="border-t border-purple-900/30 my-6" />

          {/* UTR Submission Form */}
          <form onSubmit={handleUtrSubmit} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                  Enter 12-Digit UTR / Transaction ID
                </label>
                <span className="text-xs text-purple-400 font-medium">Instant Verification</span>
              </div>
              <input
                type="text"
                maxLength={12}
                value={utrNumber}
                onChange={(e) => setUtrNumber(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                placeholder="e.g. 412345678901"
                className="w-full bg-[#0d0220] border border-purple-900/50 focus:border-purple-500 rounded-xl px-4 py-3.5 text-white font-mono placeholder-slate-600 text-base tracking-widest text-center focus:outline-none focus:ring-1 focus:ring-purple-500/30 transition-all uppercase"
                disabled={verifying || status === 'paid'}
              />
              <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                <Info className="w-3 h-3 text-slate-400 flex-shrink-0" />
                Found in your GPay / PhonePe / Paytm receipt as &ldquo;UPI Ref No.&rdquo; or &ldquo;UTR&rdquo;.
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-950/40 border border-red-800/40 rounded-xl text-red-300 text-xs flex items-center gap-2">
                <XCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            {status === 'paid' && (
              <div className="p-4 bg-green-950/40 border border-green-800/40 rounded-xl text-green-300 text-sm flex items-center gap-2 font-medium">
                <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-green-400" />
                <span>Payment Confirmed! Redirecting to your ticket...</span>
              </div>
            )}

            <button
              type="submit"
              disabled={verifying || status === 'paid' || utrNumber.length < 10}
              className="w-full py-3.5 px-6 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-green-500/25 flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              {verifying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verifying UTR...
                </>
              ) : status === 'paid' ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Verified!
                </>
              ) : (
                <>
                  Verify & Get Ticket Instantly
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer note */}
          <p className="text-center text-[11px] text-slate-500 mt-4">
            Having trouble? The event coordinator will also verify payments manually if needed.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function PaymentPendingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0a0118] flex items-center justify-center">
          <Loader2 className="w-12 h-12 text-purple-400 animate-spin" />
        </div>
      }
    >
      <PaymentPendingContent />
    </Suspense>
  );
}
