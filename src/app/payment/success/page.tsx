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
}

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const registrationId = searchParams.get('id') || '';
  const paymentId = searchParams.get('pid') || '';
  const token = searchParams.get('token') || '';

  const [data, setData] = useState<SuccessData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
    const url = `/api/${type}/${registrationId}?token=${token}`;
    window.open(url, '_blank');
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

              {/* Email note */}
              <div className="flex items-center gap-3 bg-blue-900/20 border border-blue-700/30 rounded-xl p-4 mb-6">
                <Mail className="w-5 h-5 text-blue-400 flex-shrink-0" />
                <p className="text-slate-400 text-sm">
                  Your invoice and QR entry ticket have been emailed to{' '}
                  <span className="text-blue-400">your registered email address</span>.
                </p>
              </div>

              {/* Important note */}
              <div className="bg-yellow-900/20 border border-yellow-700/30 rounded-xl p-4 mb-6">
                <p className="text-yellow-300 text-sm font-semibold mb-1">📋 Important</p>
                <ul className="text-slate-400 text-sm space-y-1 list-disc list-inside">
                  <li>Keep your QR entry ticket ready for the event</li>
                  <li>The QR code will be scanned once at entry</li>
                  <li>Bring your College ID card for verification</li>
                  <li>Save your Registration ID: <strong className="text-white">{data.registrationId}</strong></li>
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

