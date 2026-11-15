'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  CheckCircle2, Download, QrCode, User, Building2,
  Hash, CreditCard, Calendar, ArrowLeft, Mail, Loader2,
} from 'lucide-react';

interface SuccessData {
  studentName: string;
  department: string;
  collegeId: string;
  registrationId: string;
  paymentId: string;
  amount: number;
  paymentDate: string;
  email?: string;
  ticketToken?: string;
}

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const registrationId = searchParams.get('id') || '';
  const paymentId = searchParams.get('pid') || '';
  const token = searchParams.get('token') || '';

  const [data, setData] = useState<SuccessData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [resending, setResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<{ type: 'idle' | 'success' | 'error'; message: string }>({
    type: 'idle',
    message: '',
  });
  const [showEditEmail, setShowEditEmail] = useState(false);
  const [customEmail, setCustomEmail] = useState('');

  useEffect(() => {
    if (!registrationId) {
      setError('Invalid success page access.');
      setLoading(false);
      return;
    }

    // Fetch registration details
    async function fetchDetails() {
      try {
        const queryParams = new URLSearchParams({ id: registrationId });
        if (paymentId) queryParams.set('pid', paymentId);
        if (token) queryParams.set('token', token);

        const res = await fetch(`/api/registration-details?${queryParams.toString()}`);
        const json = await res.json();
        if (!res.ok) {
          setError(json.error || 'Failed to load registration details.');
        } else {
          setData(json);
          if (json.email) {
            setCustomEmail(json.email);
          }
        }
      } catch {
        setError('Failed to load. Please save your Registration ID and Payment ID.');
      } finally {
        setLoading(false);
      }
    }

    fetchDetails();
  }, [registrationId, paymentId, token]);

  const downloadFile = (type: 'invoice' | 'ticket') => {
    const activeToken = token || data?.ticketToken || '';
    const url = `/api/${type}/${registrationId}?token=${activeToken}`;
    window.open(url, '_blank');
  };

  const handleResendEmail = async () => {
    if (!registrationId || resending) return;
    setResending(true);
    setResendStatus({ type: 'idle', message: '' });

    try {
      const res = await fetch('/api/payment/resend-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registrationId,
          email: customEmail.trim() || undefined,
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        setResendStatus({
          type: 'error',
          message: resData.error || 'Failed to resend email. Please try again in a few moments.',
        });
      } else {
        setResendStatus({
          type: 'success',
          message: `Ticket & invoice email sent successfully to ${resData.email || customEmail || 'your email'}! Please check your Inbox and Spam folder.`,
        });
        setShowEditEmail(false);
      }
    } catch {
      setResendStatus({
        type: 'error',
        message: 'Network error. Please try again.',
      });
    } finally {
      setResending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-400 spinner mx-auto mb-4" />
          <p className="text-slate-400">Loading your registration details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen hero-bg animated-gradient flex items-center justify-center py-12 px-4">
      <div className="max-w-2xl w-full">
        {/* Success header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/20 border-2 border-green-500/40 mb-6 pulse-glow">
            <CheckCircle2 className="w-10 h-10 text-green-400" />
          </div>
          <h1 className="text-4xl font-black text-white mb-2">Payment Successful!</h1>
          <p className="text-green-400 text-lg font-semibold">Registration Confirmed ✓</p>
          <p className="text-slate-400 mt-2">
            Check your email for your QR ticket and invoice.
          </p>
        </div>

        {error && (
          <div className="glass rounded-2xl p-6 mb-6 border border-yellow-700/30 text-center">
            <p className="text-yellow-300 mb-2">{error}</p>
            <div className="mt-3 space-y-1">
              <p className="text-slate-400 text-sm">Save these details:</p>
              <p className="text-white font-mono">Registration ID: <strong>{registrationId}</strong></p>
              <p className="text-white font-mono">Payment ID: <strong>{paymentId}</strong></p>
            </div>
          </div>
        )}

        {data && (
          <div className="glass rounded-3xl overflow-hidden">
            {/* Green banner */}
            <div className="bg-gradient-to-r from-green-600/30 to-teal-600/30 border-b border-green-700/30 px-8 py-5 flex items-center justify-between">
              <div>
                <div className="text-green-400 text-sm font-semibold uppercase tracking-wider">Amount Paid</div>
                <div className="text-white text-3xl font-black">₹{data.amount}</div>
              </div>
              <div className="bg-green-500 text-white text-xs font-bold px-4 py-2 rounded-full">
                ✓ PAID
              </div>
            </div>

            {/* Details */}
            <div className="p-8">
              <div className="grid gap-4 mb-8">
                {[
                  { icon: User, label: 'Student Name', value: data.studentName },
                  { icon: Building2, label: 'Department', value: data.department },
                  { icon: Hash, label: 'College ID / PRN', value: data.collegeId },
                  { icon: QrCode, label: 'Registration ID', value: data.registrationId },
                  { icon: CreditCard, label: 'Payment ID', value: data.paymentId },
                  { icon: Calendar, label: 'Payment Date', value: data.paymentDate },
                ].map(({ icon: Icon, label, value }) => (
                  <div
                    key={label}
                    className="flex items-start gap-4 p-4 bg-purple-900/10 rounded-xl border border-purple-900/20"
                  >
                    <Icon className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <div className="text-slate-500 text-xs uppercase tracking-wider mb-0.5">{label}</div>
                      <div className="text-white font-semibold text-sm break-all">{value}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Download buttons */}
              <div className="grid sm:grid-cols-2 gap-4 mb-6">
                <button
                  onClick={() => downloadFile('invoice')}
                  className="flex items-center justify-center gap-3 bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-500 hover:to-purple-700 text-white font-semibold py-4 rounded-xl btn-glow transition-all"
                >
                  <Download className="w-5 h-5" />
                  Download Invoice
                </button>
                <button
                  onClick={() => downloadFile('ticket')}
                  className="flex items-center justify-center gap-3 bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-500 hover:to-blue-700 text-white font-semibold py-4 rounded-xl btn-blue-glow transition-all"
                >
                  <QrCode className="w-5 h-5" />
                  Download Entry Ticket
                </button>
              </div>

              {/* Email note and Resend section */}
              <div className="bg-blue-950/30 border border-blue-800/40 rounded-2xl p-5 mb-6">
                <div className="flex items-start sm:items-center justify-between gap-3 flex-col sm:flex-row">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-900/40 rounded-lg">
                      <Mail className="w-5 h-5 text-blue-400 flex-shrink-0" />
                    </div>
                    <div>
                      <div className="text-white text-sm font-semibold">
                        Ticket & Invoice Emailed
                      </div>
                      <p className="text-slate-400 text-xs">
                        Sent to{' '}
                        <span className="text-blue-300 font-medium">
                          {data.email || 'your registered email'}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => setShowEditEmail(!showEditEmail)}
                      className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
                    >
                      {showEditEmail ? 'Cancel' : 'Change email?'}
                    </button>
                    <button
                      type="button"
                      onClick={handleResendEmail}
                      disabled={resending}
                      className="px-3.5 py-1.5 bg-blue-600/40 hover:bg-blue-600/60 border border-blue-500/40 text-blue-200 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                    >
                      {resending ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        'Resend Email'
                      )}
                    </button>
                  </div>
                </div>

                {/* Optional edit email input */}
                {showEditEmail && (
                  <div className="mt-4 pt-3 border-t border-blue-900/40 flex flex-col sm:flex-row gap-2">
                    <input
                      type="email"
                      value={customEmail}
                      onChange={(e) => setCustomEmail(e.target.value)}
                      placeholder="Enter correct email address"
                      className="flex-1 bg-[#0b031b] border border-blue-800/50 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-400"
                    />
                    <button
                      type="button"
                      onClick={handleResendEmail}
                      disabled={resending || !customEmail.includes('@')}
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg disabled:opacity-50 transition-colors"
                    >
                      Send to New Email
                    </button>
                  </div>
                )}

                {/* Resend Status Banner */}
                {resendStatus.message && (
                  <div
                    className={`mt-3 p-2.5 rounded-lg text-xs font-medium ${
                      resendStatus.type === 'success'
                        ? 'bg-green-950/50 border border-green-800/40 text-green-300'
                        : 'bg-red-950/50 border border-red-800/40 text-red-300'
                    }`}
                  >
                    {resendStatus.message}
                  </div>
                )}
              </div>

              {/* Important note */}
              <div className="bg-yellow-900/20 border border-yellow-700/30 rounded-xl p-4 mb-6">
                <p className="text-yellow-300 text-sm font-semibold mb-1">📋 Important Instructions</p>
                <ul className="text-slate-400 text-sm space-y-1 list-disc list-inside">
                  <li>You can tap <strong>Download Entry Ticket</strong> and <strong>Download Invoice</strong> anytime above to print or save as PDF</li>
                  <li>The QR entry ticket will be scanned at the venue entrance</li>
                  <li>Bring your College ID card for entry verification</li>
                  <li>Your Registration ID: <strong className="text-white font-mono">{data.registrationId}</strong></li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Back link */}
        <div className="text-center mt-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-purple-400 spinner" />
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}

