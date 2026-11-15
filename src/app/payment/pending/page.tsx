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
  Download,
  AlertTriangle,
  HelpCircle,
} from 'lucide-react';

const UPI_ID = process.env.NEXT_PUBLIC_UPI_ID || 'ganeshgadre@ybl';
const UPI_NAME = process.env.NEXT_PUBLIC_UPI_NAME || 'Ganesh Gadre';
const AMOUNT = '300.00';

function PaymentPendingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const registrationId = searchParams.get('id') || '';

  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [utrNumber, setUtrNumber] = useState<string>('');
  const [verifying, setVerifying] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [status, setStatus] = useState<'pending' | 'paid' | 'failed'>('pending');
  const [showGuide, setShowGuide] = useState<boolean>(true);

  // Clean, standard NPCI-compliant UPI URI
  // Short clean transaction note avoids aggressive bank risk-engine filters
  const standardUpiUrl = `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(
    UPI_NAME
  )}&am=${AMOUNT}&cu=INR&tn=Freshers2026`;

  // App-specific intents for smoother mobile redirection
  const phonePeIntentUrl = `phonepe://pay?pa=${UPI_ID}&pn=${encodeURIComponent(
    UPI_NAME
  )}&am=${AMOUNT}&cu=INR&tn=Freshers2026`;

  const gPayIntentUrl = `tez://upi/pay?pa=${UPI_ID}&pn=${encodeURIComponent(
    UPI_NAME
  )}&am=${AMOUNT}&cu=INR&tn=Freshers2026`;

  const paytmIntentUrl = `paytmmp://pay?pa=${UPI_ID}&pn=${encodeURIComponent(
    UPI_NAME
  )}&am=${AMOUNT}&cu=INR&tn=Freshers2026`;

  // Generate high-resolution QR code on load
  useEffect(() => {
    if (!registrationId) return;
    QRCode.toDataURL(standardUpiUrl, {
      width: 400,
      margin: 2,
      color: {
        dark: '#0f0528',
        light: '#ffffff',
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('QR generation error:', err));
  }, [registrationId, standardUpiUrl]);

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
    <div className="min-h-screen bg-[#0a0118] py-10 px-4 sm:px-6 flex items-center justify-center">
      <div className="max-w-xl w-full">
        {/* Main Card */}
        <div className="glass rounded-3xl p-6 sm:p-8 border border-purple-900/50 bg-[#0f0528]/95 shadow-2xl relative">
          
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 bg-purple-900/40 border border-purple-700/40 px-3.5 py-1.5 rounded-full mb-3">
              <ShieldCheck className="w-4 h-4 text-purple-300" />
              <span className="text-xs font-medium text-purple-300">
                Official Event Payment
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              Scan & Pay <span className="gradient-text">₹300</span>
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
              <div className="text-green-400 font-bold text-lg">₹300.00</div>
            </div>
          </div>

          {/* QR Code Section */}
          <div className="flex flex-col items-center mb-5">
            <div className="p-3 bg-white rounded-2xl shadow-2xl border-4 border-purple-600/40">
              {qrDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={qrDataUrl}
                  alt="UPI Payment QR Code"
                  className="w-56 h-56 sm:w-64 sm:h-64 object-contain rounded-xl"
                />
              ) : (
                <div className="w-56 h-56 sm:w-64 sm:h-64 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
                </div>
              )}
            </div>

            {/* Quick Action Buttons: Save QR & Copy UPI */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 w-full">
              {qrDataUrl && (
                <a
                  href={qrDataUrl}
                  download={`Freshers2026-QR-${registrationId || 'pay'}.png`}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-purple-900/50 hover:bg-purple-800/60 border border-purple-600/40 text-purple-200 text-xs sm:text-sm font-semibold rounded-xl transition-all shadow"
                >
                  <Download className="w-4 h-4 text-purple-300" />
                  Save QR to Gallery
                </a>
              )}

              <button
                type="button"
                onClick={copyToClipboard}
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900/60 hover:bg-slate-800/80 border border-slate-700/60 text-slate-200 text-xs sm:text-sm font-semibold rounded-xl transition-all cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-green-400" />
                    <span className="text-green-300">UPI ID Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-slate-400" />
                    <span>Copy UPI ID ({UPI_ID})</span>
                  </>
                )}
              </button>
            </div>

            {/* Direct Mobile UPI Links */}
            <div className="mt-3 w-full">
              <div className="text-[11px] text-slate-400 text-center mb-2">
                Open directly in installed UPI App:
              </div>
              <div className="grid grid-cols-3 gap-2">
                <a
                  href={gPayIntentUrl}
                  className="inline-flex items-center justify-center gap-1.5 py-2 px-2 bg-[#1a1333] hover:bg-[#251b47] border border-purple-800/40 rounded-xl text-xs font-medium text-slate-200 transition-colors"
                >
                  <Smartphone className="w-3.5 h-3.5 text-blue-400" />
                  <span>Google Pay</span>
                </a>
                <a
                  href={phonePeIntentUrl}
                  className="inline-flex items-center justify-center gap-1.5 py-2 px-2 bg-[#1a1333] hover:bg-[#251b47] border border-purple-800/40 rounded-xl text-xs font-medium text-slate-200 transition-colors"
                >
                  <Smartphone className="w-3.5 h-3.5 text-purple-400" />
                  <span>PhonePe</span>
                </a>
                <a
                  href={paytmIntentUrl}
                  className="inline-flex items-center justify-center gap-1.5 py-2 px-2 bg-[#1a1333] hover:bg-[#251b47] border border-purple-800/40 rounded-xl text-xs font-medium text-slate-200 transition-colors"
                >
                  <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Paytm</span>
                </a>
              </div>
            </div>
          </div>

          {/* Security Decline Helper Box */}
          <div className="mb-6 rounded-2xl bg-amber-950/30 border border-amber-800/40 p-4 text-xs">
            <div
              className="flex items-center justify-between cursor-pointer"
              onClick={() => setShowGuide(!showGuide)}
            >
              <div className="flex items-center gap-2 font-semibold text-amber-300">
                <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span>UPI App showing &quot;Declined for security reasons&quot;?</span>
              </div>
              <HelpCircle className="w-4 h-4 text-amber-400/80" />
            </div>

            {showGuide && (
              <div className="mt-3 text-slate-300 space-y-2 border-t border-amber-900/40 pt-3">
                <p className="text-slate-400">
                  Bank security engines block some browser-initiated links for protection. Use either method below to pay 100% smoothly:
                </p>
                <div className="bg-[#120726] p-2.5 rounded-xl border border-purple-900/30 space-y-1">
                  <div className="font-semibold text-purple-300">Method 1 — Scan from Gallery (Recommended):</div>
                  <ol className="list-decimal list-inside space-y-0.5 text-slate-300">
                    <li>Tap <strong className="text-white">&quot;Save QR to Gallery&quot;</strong> above</li>
                    <li>Open <strong>PhonePe / GPay / Paytm</strong></li>
                    <li>Tap the <strong>QR Scanner</strong> icon ➔ tap the <strong>Gallery/Image icon</strong> inside the scanner</li>
                    <li>Select the saved QR to complete ₹300 payment</li>
                  </ol>
                </div>
                <div className="bg-[#120726] p-2.5 rounded-xl border border-purple-900/30 space-y-1">
                  <div className="font-semibold text-purple-300">Method 2 — Pay directly to UPI ID:</div>
                  <ol className="list-decimal list-inside space-y-0.5 text-slate-300">
                    <li>Copy UPI ID: <strong className="text-white font-mono">{UPI_ID}</strong></li>
                    <li>In PhonePe/GPay, select <strong>&quot;To UPI ID / Number&quot;</strong></li>
                    <li>Paste <code className="text-purple-300">{UPI_ID}</code> (Name: <strong>{UPI_NAME}</strong>) and pay ₹300</li>
                  </ol>
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-purple-900/30 my-5" />

          {/* UTR Submission Form */}
          <form onSubmit={handleUtrSubmit} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                  Step 2: Enter 12-Digit UTR / Transaction ID
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
              <p className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                Found in your payment receipt as &ldquo;UPI Ref No.&rdquo;, &ldquo;UTR&rdquo;, or &ldquo;Transaction ID&rdquo;.
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
              className="w-full py-3.5 px-6 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-green-500/25 flex items-center justify-center gap-2 text-sm sm:text-base cursor-pointer disabled:cursor-not-allowed"
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
